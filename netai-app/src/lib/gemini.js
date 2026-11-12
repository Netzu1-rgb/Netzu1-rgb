// Acceso compartido a Google Gemini desde el servidor.
// La clave vive solo en el servidor (GEMINI_API_KEY) y cada pedido exige una sesión válida.
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken, clientIp } from '@/lib/auth';

const API_BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com';
// Modelos en orden de preferencia, del más barato al siguiente. Si Google retira uno (responde 404),
// se pasa al próximo y se recuerda cuál funcionó. GEMINI_MODEL acepta uno o varios separados por coma.
const MODELS = (process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite,gemini-2.5-flash').split(',').map((m) => m.trim()).filter(Boolean);
let working = 0;

// Límite simple por conexión (por instancia del servidor). El tope real de gasto se configura en Google Cloud.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = Number(process.env.PHOTO_ANALYSIS_PER_HOUR || 30);
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_PER_WINDOW;
}

const fail = (message, status) => NextResponse.json({ message }, { status });

/**
 * Comprueba sesión, clave y límite de uso. Devuelve { apiKey } o { error: respuesta }.
 */
export async function geminiGuard(request, what = 'El análisis por foto') {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!(await verifySessionToken(token))) return { error: fail('Tu sesión venció. Volvé a entrar a la app.', 401) };
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: fail(`${what} todavía no está activado.`, 503) };
  if (rateLimited(clientIp(request))) return { error: fail('Llegaste al máximo de pedidos por hora. Probá más tarde.', 429) };
  return { apiKey };
}

/**
 * Llama a Gemini pidiendo una respuesta en JSON con esquema. Devuelve el objeto o lanza un error.
 */
export async function geminiJson({ apiKey, parts, schema, maxOutputTokens = 800, temperature = 0.2 }) {
  let res;
  for (let i = working; i < MODELS.length; i++) {
    const model = MODELS[i];
    const generationConfig = { responseMimeType: 'application/json', responseSchema: schema, temperature, maxOutputTokens };
    // En la serie 2.5 el "razonamiento" se cobra como salida y puede cortar la respuesta: se apaga.
    if (model.includes('2.5-flash')) generationConfig.thinkingConfig = { thinkingBudget: 0 };
    res = await fetch(`${API_BASE}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) { working = i; break; }
    console.error('Gemini respondió', res.status, 'con', model, (await res.text().catch(() => '')).slice(0, 300));
    if (res.status !== 404) break; // 404: el modelo ya no existe; cualquier otro error no se arregla cambiando de modelo
  }
  if (!res.ok) throw new Error('gemini-status');
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  return JSON.parse(text);
}

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(n) || 0)));
export { fail };
