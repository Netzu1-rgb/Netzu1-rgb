// Acceso compartido a Claude (Anthropic) desde el servidor.
// La clave vive solo en el servidor (ANTHROPIC_API_KEY) y cada pedido exige una sesión válida.
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken, clientIp } from '@/lib/auth';

// Claude Haiku 5.5: el modelo más económico de Claude que lee imágenes. Se puede cambiar con CLAUDE_MODEL.
const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-5-5';

// El cliente lee ANTHROPIC_API_KEY (y ANTHROPIC_BASE_URL, que usan las pruebas) del entorno
let client;
const getClient = () => { client ||= new Anthropic({ maxRetries: 1 }); return client; };

// Límites de uso (por instancia del servidor). El tope real de gasto se configura en Google Cloud.
// - Por sesión: cada persona tiene su propio cupo, aunque comparta la red (wifi de un club, datos móviles).
// - Por conexión: un tope más alto, para que nadie lo esquive abriendo sesiones nuevas.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = Number(process.env.PHOTO_ANALYSIS_PER_HOUR || 30);
const MAX_PER_IP = MAX_PER_WINDOW * 10;
const MAX_KEYS = 20000;
const hits = new Map();
function overLimit(key, max) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.delete(key); // se vuelve a insertar al final: las claves más viejas quedan primeras
  hits.set(key, list);
  if (hits.size > MAX_KEYS) hits.delete(hits.keys().next().value);
  return list.length > max;
}

/** Los pedidos que cambian algo tienen que venir de la propia app, no de otro sitio */
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') !== 'cross-site';
  try { return new URL(origin).host === (request.headers.get('x-forwarded-host') || request.headers.get('host')); } catch (e) { return false; }
}

/** true si el cuerpo declarado supera el máximo (se corta antes de leerlo) */
export const tooLarge = (request, maxBytes) => Number(request.headers.get('content-length') || 0) > maxBytes;

const fail = (message, status) => NextResponse.json({ message }, { status });

/**
 * Comprueba origen, sesión, clave y límite de uso. Devuelve {} o { error: respuesta }.
 */
export async function aiGuard(request, what = 'El análisis por foto') {
  if (!sameOrigin(request)) return { error: fail('Pedido no permitido.', 403) };
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!(await verifySessionToken(token))) return { error: fail('Tu sesión venció. Volvé a entrar a la app.', 401) };
  if (!process.env.ANTHROPIC_API_KEY) return { error: fail(`${what} todavía no está activado.`, 503) };
  if (overLimit(`s:${token.slice(-32)}`, MAX_PER_WINDOW) || overLimit(`ip:${clientIp(request)}`, MAX_PER_IP)) return { error: fail('Llegaste al máximo de pedidos por hora. Probá más tarde.', 429) };
  return {};
}

/**
 * Pide a Claude una respuesta en JSON que cumpla el esquema (Zod). Devuelve el objeto o lanza un error.
 * `content` es la lista de bloques del mensaje: texto y, si hace falta, una imagen.
 */
export async function aiJson({ content, schema, maxTokens = 4000 }) {
  let response;
  try {
    response = await getClient().messages.parse(
      {
        model: MODEL,
        // El razonamiento del modelo cuenta dentro de este tope: se deja margen para que la respuesta no se corte
        max_tokens: maxTokens,
        // Esfuerzo bajo: alcanza para estimar un plato y mantiene el costo y la demora al mínimo
        output_config: { effort: 'low', format: zodOutputFormat(schema) },
        messages: [{ role: 'user', content }],
      },
      { timeout: 30000 }
    );
  } catch (e) {
    if (e instanceof Anthropic.NotFoundError) console.error('Claude: el modelo configurado no existe', MODEL);
    else if (e instanceof Anthropic.RateLimitError) console.error('Claude: se alcanzó el límite de pedidos de la cuenta');
    else if (e instanceof Anthropic.APIError) console.error('Claude respondió', e.status, String(e.message).slice(0, 300));
    else console.error('Claude: sin conexión o respuesta inválida', String(e?.message || e).slice(0, 300));
    throw new Error('ia-error');
  }
  // Un pedido rechazado llega como respuesta correcta con stop_reason "refusal": no hay contenido para leer
  if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens' || !response.parsed_output) {
    console.error('Claude no devolvió un resultado utilizable:', response.stop_reason);
    throw new Error('ia-sin-resultado');
  }
  return response.parsed_output;
}

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(n) || 0)));
export { fail };
