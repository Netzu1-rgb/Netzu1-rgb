import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

// Análisis de platos por foto con Google Gemini.
// La clave vive solo en el servidor (GEMINI_API_KEY). La foto se procesa y no se guarda.

export const runtime = 'nodejs';

const API_BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com';
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_BASE64 = 4_000_000; // unos 3 MB de imagen
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Límite simple por dirección IP para evitar abusos (por instancia del servidor).
// El tope real de gasto se configura en Google Cloud.
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

const PROMPT = `Sos un asistente de nutrición de la app NetAI (Argentina). Analizá la foto de una comida.
- Identificá los alimentos visibles y estimá la porción en lenguaje común (por ejemplo, "1 plato mediano", "2 empanadas").
- Estimá la energía (kcal) y los gramos de proteínas, carbohidratos y grasas de TODO lo que se ve.
- Estimá qué porcentaje del plato ocupan vegetales y frutas, proteínas, y cereales o legumbres (que sumen 100).
- Usá nombres de comidas como se dicen en Argentina.
- No hagas juicios ("bueno", "malo", "demasiado") ni consejos para bajar de peso.
- Si la foto no muestra comida, respondé esComida = false y dejá los números en 0.
- Si no estás seguro de la porción o de algún ingrediente, usá confianza "baja" y explicalo en "nota" en una frase.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    esComida: { type: 'BOOLEAN' },
    nombre: { type: 'STRING' },
    porcion: { type: 'STRING' },
    alimentos: { type: 'ARRAY', items: { type: 'STRING' } },
    kcal: { type: 'NUMBER' },
    proteinas_g: { type: 'NUMBER' },
    carbohidratos_g: { type: 'NUMBER' },
    grasas_g: { type: 'NUMBER' },
    plato: {
      type: 'OBJECT',
      properties: {
        vegetales: { type: 'NUMBER' },
        proteinas: { type: 'NUMBER' },
        cereales: { type: 'NUMBER' },
      },
      required: ['vegetales', 'proteinas', 'cereales'],
    },
    confianza: { type: 'STRING', enum: ['alta', 'media', 'baja'] },
    nota: { type: 'STRING' },
  },
  required: ['esComida', 'nombre', 'porcion', 'alimentos', 'kcal', 'proteinas_g', 'carbohidratos_g', 'grasas_g', 'plato', 'confianza'],
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(n) || 0)));

export async function POST(request) {
  // Solo para personas que entraron a la app
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ message: 'Tu sesión venció. Volvé a entrar a la app.' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: 'El análisis por foto todavía no está activado. Podés registrar la comida a mano.' },
      { status: 503 }
    );
  }

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  if (rateLimited(ip)) {
    return NextResponse.json({ message: 'Llegaste al máximo de fotos por hora. Probá más tarde o registrá a mano.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const image = body?.image;
  const mimeType = body?.mimeType;
  if (typeof image !== 'string' || !ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json({ message: 'Mandá una foto en formato JPG, PNG o WebP.' }, { status: 400 });
  }
  if (image.length > MAX_BASE64) {
    return NextResponse.json({ message: 'La foto es demasiado grande. Probá con otra.' }, { status: 413 });
  }

  let geminiRes;
  try {
    geminiRes = await fetch(`${API_BASE}/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: image } }, { text: PROMPT }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: SCHEMA,
          temperature: 0.2,
          maxOutputTokens: 800,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch (e) {
    console.error('Gemini sin respuesta', e?.message);
    return NextResponse.json({ message: 'No pudimos analizar la foto. Revisá tu conexión y probá de nuevo.' }, { status: 502 });
  }

  if (!geminiRes.ok) {
    console.error('Gemini respondió', geminiRes.status, (await geminiRes.text().catch(() => '')).slice(0, 300));
    return NextResponse.json({ message: 'No pudimos analizar la foto en este momento. Probá de nuevo o registrá a mano.' }, { status: 502 });
  }

  let parsed;
  try {
    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    parsed = JSON.parse(text);
  } catch (e) {
    return NextResponse.json({ message: 'No entendimos la respuesta del análisis. Probá con otra foto.' }, { status: 502 });
  }

  if (!parsed?.esComida) {
    return NextResponse.json({ message: 'No encontramos comida en la foto. Probá con otra o registrá a mano.' }, { status: 422 });
  }

  // Respuesta normalizada y con límites razonables
  return NextResponse.json({
    name: String(parsed.nombre || 'Plato').slice(0, 120),
    portion: String(parsed.porcion || '').slice(0, 120),
    items: Array.isArray(parsed.alimentos) ? parsed.alimentos.slice(0, 12).map((x) => String(x).slice(0, 60)) : [],
    energy: clamp(parsed.kcal, 0, 3000),
    protein: clamp(parsed.proteinas_g, 0, 300),
    carbs: clamp(parsed.carbohidratos_g, 0, 500),
    fat: clamp(parsed.grasas_g, 0, 300),
    plate: {
      vegetables: clamp(parsed.plato?.vegetales, 0, 100),
      protein: clamp(parsed.plato?.proteinas, 0, 100),
      carbs: clamp(parsed.plato?.cereales, 0, 100),
    },
    confidence: ['alta', 'media', 'baja'].includes(parsed.confianza) ? parsed.confianza : 'media',
    note: parsed.nota ? String(parsed.nota).slice(0, 240) : '',
  });
}
