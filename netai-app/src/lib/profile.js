// Perfil de la persona: datos personales y físicos que carga en el recorrido inicial.
// Se guarda solo en el teléfono (localStorage) y se usa para personalizar la app.
// En el modo Bienestar el peso no se muestra ni hay metas de peso.
// El Modo Sport (opcional, solo adultos y nunca con TCA) agrega objetivos físicos con límites seguros.

import { MINIMUM_SAFE_ENERGY_FLOOR, DEFAULT_ENERGY_RANGE } from './ethicalNutrition.js';

export const PROFILE_KEY = 'netai_profile_v1';

export const SEX_OPTIONS = [
  { id: 'femenino', label: 'Femenino' },
  { id: 'masculino', label: 'Masculino' },
  { id: 'no-decir', label: 'Prefiero no decirlo' },
];

export const ACTIVITY_LEVELS = [
  { id: 'baja', label: 'Poco movimiento', hint: 'Trabajo sentado y casi nada de actividad física.', factor: 1.2 },
  { id: 'ligera', label: 'Algo de movimiento', hint: 'Caminatas o actividad suave 1 a 3 días por semana.', factor: 1.375 },
  { id: 'moderada', label: 'Moderado', hint: 'Entrenás o hacés deporte 3 a 5 días por semana.', factor: 1.55 },
  { id: 'alta', label: 'Mucho movimiento', hint: 'Entrenás casi todos los días o tenés un trabajo físico.', factor: 1.725 },
];

export const GOALS = [
  { id: 'calma', label: 'Comer con más calma' },
  { id: 'energia', label: 'Tener más energía en el día' },
  { id: 'orden', label: 'Ordenar mis comidas' },
  { id: 'entreno', label: 'Acompañar mi entrenamiento' },
  { id: 'familia', label: 'Comer mejor en familia' },
  { id: 'saber', label: 'Aprender sobre alimentación' },
];

// Tipo de alimentación: se elige una sola. "De todo" es no tener ninguna de las otras dos en `diet`.
export const DIET_TYPES = [
  { id: '', label: 'De todo' },
  { id: 'vegetariana', label: 'Vegetariana', hint: 'sin carne ni pescado' },
  { id: 'vegana', label: 'Vegana', hint: 'nada de origen animal' },
];

// Alimentos que la persona no come (por salud, gusto o creencias). Se pueden marcar varios.
// `hiddenFor`: no se ofrece cuando el tipo de alimentación ya lo excluye.
export const AVOID_OPTIONS = [
  { id: 'sin-tacc', label: 'Gluten (sin TACC)', field: 'diet' },
  { id: 'sin-lactosa', label: 'Lactosa', field: 'diet', hiddenFor: ['vegana'] },
  { id: 'carne roja', label: 'Carne roja', hiddenFor: ['vegetariana', 'vegana'] },
  { id: 'cerdo', label: 'Cerdo', hiddenFor: ['vegetariana', 'vegana'] },
  { id: 'pollo', label: 'Pollo', hiddenFor: ['vegetariana', 'vegana'] },
  { id: 'pescado', label: 'Pescado', hiddenFor: ['vegetariana', 'vegana'] },
  { id: 'mariscos', label: 'Mariscos', hiddenFor: ['vegetariana', 'vegana'] },
  { id: 'huevo', label: 'Huevo', hiddenFor: ['vegana'] },
  { id: 'frutos secos', label: 'Frutos secos' },
  { id: 'soja', label: 'Soja' },
];

// Etiquetas para mostrar lo guardado en `diet`
export const DIET_OPTIONS = [
  { id: 'vegetariana', label: 'Vegetariana' },
  { id: 'vegana', label: 'Vegana' },
  { id: 'sin-tacc', label: 'Sin gluten (sin TACC)' },
  { id: 'sin-lactosa', label: 'Sin lactosa' },
];

/** Texto con todo lo que la persona no come: lo marcado más lo que escribió */
export function avoidedFoods(profile) {
  const marked = Array.isArray(profile?.avoid) ? profile.avoid.filter((x) => typeof x === 'string') : [];
  return [...marked, String(profile?.allergies || '').trim()].filter(Boolean).join(', ');
}

export const TCA_OPTIONS = [
  { id: 'no', label: 'No' },
  { id: 'si', label: 'Sí' },
  { id: 'no-decir', label: 'Prefiero no responder' },
];

export function emptyProfile() {
  return {
    version: 1,
    name: '',
    age: '',
    sex: '',
    heightCm: '',
    weightKg: '',
    activity: '',
    goals: [],
    diet: [], // tipo de alimentación y exclusiones que filtran recetas: vegetariana, vegana, sin-tacc, sin-lactosa
    avoid: [], // otros alimentos que no come
    allergies: '', // texto libre: otros alimentos o alergias
    tca: '',
    viewMode: 'rangos', // 'rangos' | 'intuitivo'
    mode: 'bienestar', // 'bienestar' | 'sport'
    sportGoal: '',
    sportType: '', // deporte principal (el primero de la lista)
    sportTypes: [], // todos los deportes que hace
    trainingDays: '',
    sessionMinutes: '',
    targetWeightKg: '',
    completedAt: null,
    skipped: false,
  };
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? { ...emptyProfile(), ...JSON.parse(raw) } : null;
  } catch (e) {
    return null;
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('No se pudo guardar el perfil', e);
  }
}

export const isAdult = (profile) => Number(profile?.age) >= 18;

// Quien está en tratamiento o recuperación de un TCA no ve números en ningún momento.
export const hidesNumbers = (profile) => profile?.tca === 'si';

// Rango de energía flexible y personal.
// Gasto en reposo con la fórmula de Mifflin-St Jeor, multiplicado por el nivel de actividad,
// con un margen de ±7,5 %. Nunca por debajo del piso seguro de 1.500 kcal.
// Si faltan datos, es menor de edad o no quiere ver números, se usa el rango general.
export function energyRangeFor(profile) {
  const general = { min: DEFAULT_ENERGY_RANGE.min, max: DEFAULT_ENERGY_RANGE.max, personal: false };
  if (!profile || hidesNumbers(profile) || !isAdult(profile)) return general;
  const age = Number(profile.age);
  const h = Number(profile.heightCm);
  const w = Number(profile.weightKg);
  const level = ACTIVITY_LEVELS.find((l) => l.id === profile.activity);
  if (!(age > 0 && h > 0 && w > 0 && level)) return general;

  const sexTerm = profile.sex === 'masculino' ? 5 : profile.sex === 'femenino' ? -161 : -78;
  const resting = 10 * w + 6.25 * h - 5 * age + sexTerm;
  const daily = resting * level.factor;
  const round50 = (n) => Math.round(n / 50) * 50;
  const min = Math.max(MINIMUM_SAFE_ENERGY_FLOOR, round50(daily * 0.925));
  const max = Math.max(min + 300, round50(daily * 1.075));
  return { min, max, personal: true };
}

// Validaciones de los campos numéricos. Devuelven un mensaje o null.
export function validateNumbers(profile) {
  const errors = {};
  const age = profile.age === '' ? null : Number(profile.age);
  if (age !== null && !(Number.isInteger(age) && age >= 13 && age <= 110)) {
    errors.age = 'Escribí tu edad en años, entre 13 y 110.';
  }
  const h = profile.heightCm === '' ? null : Number(profile.heightCm);
  if (h !== null && !(h >= 100 && h <= 230)) errors.heightCm = 'Escribí tu altura en centímetros, entre 100 y 230.';
  const w = profile.weightKg === '' ? null : Number(profile.weightKg);
  if (w !== null && !(w >= 30 && w <= 300)) errors.weightKg = 'Escribí tu peso en kilos, entre 30 y 300.';
  return errors;
}

// ---------------------------------------------------------------------------
// MODO SPORT: objetivos físicos para deportistas adultos.
// Referencias generales: ACSM (Nutrition and Athletic Performance, 2016) e ISSN
// (posición sobre proteínas y ejercicio, 2017). Los valores son orientativos.
// ---------------------------------------------------------------------------

export const APP_MODES = [
  { id: 'sport', label: 'Modo Sport', short: 'Objetivo físico, macros y peso.', hint: 'Para deportistas: objetivo físico, energía, proteínas, carbohidratos, agua y seguimiento de tu peso.' },
  { id: 'bienestar', label: 'Bienestar', short: 'Comer con calma, sin metas de peso.', hint: 'Comer con calma, sin metas de peso. Rangos flexibles o Modo Intuitivo.' },
];

export const SPORT_GOALS = [
  { id: 'perder-grasa', label: 'Bajar de peso', hint: 'Perder grasa cuidando la masa muscular y el rendimiento.' },
  { id: 'ganar-musculo', label: 'Subir masa muscular', hint: 'Ganar músculo con un aumento de peso gradual.' },
  { id: 'recomposicion', label: 'Recomposición', hint: 'Bajar un poco de grasa y ganar músculo, con el peso casi estable.' },
  { id: 'rendimiento', label: 'Rendimiento', hint: 'Mantener el peso y rendir mejor en entrenamientos y competencias.' },
];

export const SPORT_TYPES = [
  { id: 'fuerza', label: 'Gimnasio o fuerza' },
  { id: 'resistencia', label: 'Running, ciclismo o natación' },
  { id: 'equipo', label: 'Deporte en equipo' },
  { id: 'combate', label: 'Deporte de combate' },
  { id: 'mixto', label: 'Funcional o crossfit' },
  { id: 'otro', label: 'Otro' },
];

export const canUseSport = (profile) => isAdult(profile) && !hidesNumbers(profile);
export const isSport = (profile) => profile?.mode === 'sport' && canUseSport(profile);

// Minutos de entrenamiento por semana y factor de actividad que corresponde
function trainingLoad(profile) {
  const minutes = (Number(profile.trainingDays) || 0) * (Number(profile.sessionMinutes) || 0);
  const factor = minutes < 150 ? 1.375 : minutes < 300 ? 1.55 : minutes < 600 ? 1.725 : 1.9;
  return { minutes, factor };
}

function restingEnergy(profile) {
  const sexTerm = profile.sex === 'masculino' ? 5 : profile.sex === 'femenino' ? -161 : -78;
  return 10 * Number(profile.weightKg) + 6.25 * Number(profile.heightCm) - 5 * Number(profile.age) + sexTerm;
}

const round50 = (n) => Math.round(n / 50) * 50;
const round5 = (n) => Math.round(n / 5) * 5;

// Plan del Modo Sport. Devuelve null si faltan datos.
export function sportPlan(profile) {
  if (!isSport(profile)) return null;
  const w = Number(profile.weightKg);
  const h = Number(profile.heightCm);
  const age = Number(profile.age);
  if (!(w > 0 && h > 0 && age > 0 && profile.sportGoal)) return null;

  const resting = restingEnergy(profile);
  const { minutes, factor } = trainingLoad(profile);
  const maintenance = resting * factor;
  // Piso: nunca por debajo del gasto en reposo ni de 1.500 kcal
  const floor = Math.max(MINIMUM_SAFE_ENERGY_FLOOR, round50(resting));

  let target = maintenance;
  let protein = [1.4, 1.8];
  let rate = null; // kg por semana, [mín, máx]
  switch (profile.sportGoal) {
    case 'perder-grasa':
      target = Math.max(maintenance * 0.85, maintenance - 500);
      protein = [1.8, 2.2];
      rate = [-(w * 0.01), -(w * 0.005)];
      break;
    case 'ganar-musculo':
      target = Math.min(maintenance * 1.1, maintenance + 400);
      protein = [1.6, 2.0];
      rate = [w * 0.0025, w * 0.005];
      break;
    case 'recomposicion':
      target = maintenance * 0.95;
      protein = [1.8, 2.2];
      break;
    default:
      target = maintenance;
  }
  const min = Math.max(floor, round50(target * 0.95));
  const max = Math.max(min + 200, round50(target * 1.05));

  // Macronutrientes que suman la energía del día:
  // proteínas por kilo (ISSN), grasas entre 20 y 30 % de la energía y carbohidratos con lo que queda.
  const mid = (min + max) / 2;
  const proteinG = [round5(protein[0] * w), round5(protein[1] * w)];
  const proteinMid = (proteinG[0] + proteinG[1]) / 2;
  const fatG = [round5((mid * 0.2) / 9), round5((mid * 0.3) / 9)];
  const carbsMid = Math.max(0, (mid - proteinMid * 4 - ((fatG[0] + fatG[1]) / 2) * 9) / 4);
  const carbsG = [round5(carbsMid * 0.9), round5(carbsMid * 1.1)];
  // Agua: unos 35 ml por kilo más lo que se pierde entrenando (unos 500 ml por hora), en vasos de 250 ml
  const waterMl = w * 35 + (minutes / 7 / 60) * 500;
  const waterGlasses = Math.min(16, Math.max(8, Math.ceil(waterMl / 250)));

  return {
    goal: profile.sportGoal,
    maintenance: round50(maintenance),
    energy: { min, max },
    floor,
    proteinG,
    carbsG,
    fatG,
    waterGlasses,
    rateKg: rate,
    trainingMinutes: minutes,
  };
}

// Peso mínimo saludable para la altura (equivale a un índice de 18,5; no se muestra el índice)
export function minHealthyWeight(heightCm) {
  const m = Number(heightCm) / 100;
  return m > 0 ? Math.ceil(18.5 * m * m) : null;
}

// Semanas estimadas hasta el peso objetivo, al ritmo seguro del plan
export function weeksToTarget(profile) {
  const w = Number(profile.weightKg);
  const t = Number(profile.targetWeightKg);
  if (!(w > 0 && t > 0)) return null;
  if (profile.sportGoal === 'perder-grasa' && t < w) return Math.ceil((w - t) / (w * 0.0075));
  if (profile.sportGoal === 'ganar-musculo' && t > w) return Math.ceil((t - w) / (w * 0.00375));
  return null;
}

export function validateSport(profile) {
  const errors = {};
  if (!isAdult(profile)) return errors;
  if (profile.mode !== 'sport') return errors;
  if (!profile.weightKg) errors.weightKg = 'En el Modo Sport necesitamos tu peso para calcular el plan.';
  if (!profile.heightCm) errors.heightCm = 'En el Modo Sport necesitamos tu altura para calcular el plan.';
  const t = profile.targetWeightKg === '' || profile.targetWeightKg == null ? null : Number(profile.targetWeightKg);
  const w = Number(profile.weightKg);
  const minW = minHealthyWeight(profile.heightCm);
  if (t !== null) {
    if (!(t >= 30 && t <= 300)) errors.targetWeightKg = 'Escribí el peso objetivo en kilos, entre 30 y 300.';
    else if (profile.sportGoal === 'perder-grasa' && minW && t < minW) errors.targetWeightKg = `Ese peso queda por debajo de lo saludable para tu altura. El mínimo recomendable es ${minW} kg; si querés bajar más, consultalo con un profesional.`;
    else if (profile.sportGoal === 'perder-grasa' && w && t >= w) errors.targetWeightKg = 'Para bajar de peso, el objetivo tiene que ser menor que tu peso actual.';
    else if (profile.sportGoal === 'ganar-musculo' && w && t <= w) errors.targetWeightKg = 'Para subir masa muscular, el objetivo tiene que ser mayor que tu peso actual.';
  }
  const days = profile.trainingDays === '' ? null : Number(profile.trainingDays);
  if (days !== null && !(Number.isInteger(days) && days >= 0 && days <= 7)) errors.trainingDays = 'Elegí entre 0 y 7 días.';
  return errors;
}

// Seguimiento de peso (solo Modo Sport): promedio de los últimos 7 días y ritmo semanal
export const WEIGHT_LOG_KEY = 'netai_weight_log_v1';

export function weightTrend(entries) {
  const list = [...(entries || [])].sort((a, b) => a.date.localeCompare(b.date));
  if (list.length === 0) return null;
  const last = new Date(list[list.length - 1].date + 'T12:00:00');
  const avgBetween = (fromDays, toDays) => {
    const vals = list.filter((e) => {
      const d = (last - new Date(e.date + 'T12:00:00')) / 86400000;
      return d >= fromDays && d < toDays;
    }).map((e) => Number(e.kg));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const thisWeek = avgBetween(0, 7);
  const prevWeek = avgBetween(7, 14);
  return {
    latest: Number(list[list.length - 1].kg),
    weekAvg: thisWeek,
    weeklyChange: thisWeek !== null && prevWeek !== null ? thisWeek - prevWeek : null,
    count: list.length,
  };
}
