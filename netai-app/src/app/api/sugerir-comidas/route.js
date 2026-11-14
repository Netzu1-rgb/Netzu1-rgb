import { NextResponse } from 'next/server';
import { z } from 'zod';
import { aiGuard, aiJson, clamp, fail, tooLarge } from '@/lib/ia';

// Sugerencias de comidas con Claude (Anthropic), según el momento del día y las preferencias de la persona.
// No se envía el nombre ni el peso: solo alimentación, alergias, modo y, en Sport, cuánto falta del plan.

export const runtime = 'nodejs';

const MOMENTS = ['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion'];
const text = (v, max) => String(v || '').replace(/[\r\n]+/g, ' ').slice(0, max);

const SCHEMA = z.object({
  sugerencias: z.array(z.object({
    nombre: z.string(),
    descripcion: z.string(),
    kcal: z.number(),
    proteinas_g: z.number(),
    carbohidratos_g: z.number(),
    grasas_g: z.number(),
  })),
});

export async function POST(request) {
  if (tooLarge(request, 20_000)) return fail('El pedido es demasiado grande.', 413);
  const guard = await aiGuard(request, 'Las sugerencias con IA');
  if (guard.error) return guard.error;

  const body = await request.json().catch(() => ({}));
  const moment = MOMENTS.includes(body?.moment) ? body.moment : 'almuerzo';
  const diet = Array.isArray(body?.diet) ? body.diet.slice(0, 6).map((d) => text(d, 30)) : [];
  const allergies = text(body?.allergies, 300);
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
    parsed = await aiJson({ content: [{ type: 'text', text: prompt }], schema: SCHEMA });
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
