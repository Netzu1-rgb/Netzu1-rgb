// Limpieza de lo que se lee del teléfono o de una copia de seguridad.
// Un dato dañado o con otro formato no puede dejar la app sin abrir.

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

function cleanMeal(meal) {
  if (!isObject(meal) || typeof meal.name !== 'string' || !meal.name.trim()) return null;
  const out = { ...meal, id: String(meal.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`), name: meal.name.slice(0, 200) };
  for (const key of ['energy', 'protein', 'carbs', 'fat']) {
    const n = num(meal[key]);
    if (n === null || n < 0) delete out[key]; else out[key] = Math.round(n);
  }
  if (typeof out.notes !== 'string') delete out.notes;
  return out;
}

/** Registros por día: { 'AAAA-MM-DD': { waterGlasses, meals: { momento: [comidas] } } } */
export function sanitizeLogs(data) {
  if (!isObject(data)) return {};
  const out = {};
  for (const [date, day] of Object.entries(data)) {
    if (!DATE.test(date) || !isObject(day)) continue;
    const meals = {};
    if (isObject(day.meals)) {
      for (const [moment, list] of Object.entries(day.meals)) {
        if (Array.isArray(list)) meals[moment] = list.map(cleanMeal).filter(Boolean);
      }
    }
    const water = num(day.waterGlasses);
    out[date] = { ...day, waterGlasses: water === null ? 0 : Math.min(40, Math.max(0, Math.round(water))), meals };
  }
  return out;
}

/** Registro de peso: [{ date, kg }] */
export function sanitizeWeights(data) {
  if (!Array.isArray(data)) return [];
  return data
    .filter((w) => isObject(w) && typeof w.date === 'string' && DATE.test(w.date) && num(w.kg) !== null && Number(w.kg) >= 20 && Number(w.kg) <= 400)
    .map((w) => ({ date: w.date, kg: Number(w.kg) }));
}

/** Lee y convierte un texto JSON; si está dañado devuelve null en lugar de fallar */
export function parseJson(text) {
  if (typeof text !== 'string' || !text) return null;
  try { return JSON.parse(text); } catch (e) { return null; }
}

export { isObject };
