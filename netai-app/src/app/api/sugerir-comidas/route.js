import { NextResponse } from 'next/server';
import { geminiGuard, geminiJson, clamp, fail } from '@/lib/gemini';

// Sugerencias de comidas con Google Gemini, según el momento del día y las preferencias de la persona.
// No se envía el nombre ni el peso: solo alimentación, alergias, modo y, en Sport, cuánto falta del plan.

export const runtime = 'nodejs';

const MOMENTS = ['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion'];
const text = (v, max) => String(v || '').replace(/[\r\n]+/g, ' ').slice(0, max);

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    sugerencias: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          nombre: { type: 'STRING' },
          descripcion: { type: 'STRING' },
          kcal: { type: 'NUMBER' },
          proteinas_g: { type: 'NUMBER' },
          carbohidratos_g: { type: 'NUMBER' },
          grasas_g: { type: 'NUMBER' },
        },
        required: ['nombre', 'descripcion', 'kcal', 'proteinas_g', 'carbohidratos_g', 'grasas_g'],
      },
    },
  },
  required: ['sugerencias'],
};

export async function POST(request) {
  const guard = await geminiGuard(request, 'Las sugerencias con IA');
  if (guard.error) return guard.error;

  const body = await request.json().catch(() => ({}));
  const moment = MOMENTS.includes(body?.moment) ? body.moment : 'almuerzo';
  const diet = Array.isArray(body?.diet) ? body.diet.slice(0, 6).map((d) => text(d, 30)) : [];
  const allergies = text(body?.allergies, 120);
  const sport = body?.sport && typeof body.sport === 'object' ? body.sport : null;

  const prompt = [
    'Sos un asistente de nutrición de la app NetAI (Argentina). Proponé 3 ideas distintas para la comida indicada.',
    `Momento del día: ${moment}.`,
    diet.length ? `Alimentación: ${diet.join(', ')}. Respetala sin excepciones.` : 'Sin restricciones de alimentación.',
    allergies ? `Evitá por completo estos alimentos (alergias o exclusiones): ${allergies}.` : '',
    sport
      ? `Es deportista con objetivo "${text(sport.goal, 30)}". Para lo que queda del día le faltan unas ${clamp(sport.energyLeft, 0, 5000)} kcal y ${clamp(sport.proteinLeft, 0, 400)} g de proteínas: proponé porciones acordes y priorizá proteínas.`
      : 'Seguí el Método del Plato: mitad vegetales o frutas, un cuarto proteínas y un cuarto cereales o legumbres.',
    'Usá comidas y nombres habituales en Argentina, con ingredientes fáciles de conseguir y preparación simple.',
    'En "descripcion", una sola oración con los ingredientes principales y cómo se prepara.',
    'Estimá kcal y gramos de proteínas, carbohidratos y grasas de una porción.',
    'No hagas juicios ("bueno", "malo", "light") ni consejos para bajar de peso.',
  ].filter(Boolean).join('\n');

  let parsed;
  try {
    parsed = await geminiJson({ apiKey: guard.apiKey, parts: [{ text: prompt }], schema: SCHEMA, maxOutputTokens: 900, temperature: 0.8 });
  } catch (e) {
    return fail('No pudimos traer sugerencias en este momento. Probá de nuevo.', 502);
  }

  const list = (Array.isArray(parsed?.sugerencias) ? parsed.sugerencias : []).slice(0, 3).map((s) => ({
    name: text(s.nombre, 100),
    description: text(s.descripcion, 260),
    energy: clamp(s.kcal, 0, 2500),
    protein: clamp(s.proteinas_g, 0, 250),
    carbs: clamp(s.carbohidratos_g, 0, 400),
    fat: clamp(s.grasas_g, 0, 250),
  })).filter((s) => s.name);
  if (!list.length) return fail('No pudimos traer sugerencias en este momento. Probá de nuevo.', 502);
  return NextResponse.json({ suggestions: list });
}
