import { NextResponse } from 'next/server';
import { geminiGuard, geminiJson, clamp, fail, tooLarge } from '@/lib/gemini';

// Análisis de platos por foto con Google Gemini. La foto se procesa y no se guarda.

export const runtime = 'nodejs';

const MAX_BASE64 = 4_000_000; // unos 3 MB de imagen
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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

export async function POST(request) {
  if (tooLarge(request, 6_000_000)) return fail('La foto es demasiado grande. Probá con otra.', 413);
  const guard = await geminiGuard(request, 'El análisis por foto');
  if (guard.error) return guard.error;

  const body = await request.json().catch(() => null);
  const image = body?.image;
  const mimeType = body?.mimeType;
  if (typeof image !== 'string' || !ALLOWED_TYPES.includes(mimeType)) return fail('Mandá una foto en formato JPG, PNG o WebP.', 400);
  if (image.length > MAX_BASE64) return fail('La foto es demasiado grande. Probá con otra.', 413);

  let parsed;
  try {
    parsed = await geminiJson({ apiKey: guard.apiKey, parts: [{ inlineData: { mimeType, data: image } }, { text: PROMPT }], schema: SCHEMA });
  } catch (e) {
    return fail('No pudimos analizar la foto en este momento. Probá de nuevo o registrá a mano.', 502);
  }
  if (!parsed?.esComida) return fail('No encontramos comida en la foto. Probá con otra o registrá a mano.', 422);

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
