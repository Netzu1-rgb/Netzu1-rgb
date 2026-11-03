// Perfil de la persona: datos personales y físicos que carga en el recorrido inicial.
// Se guarda solo en el teléfono (localStorage) y se usa para personalizar la app,
// nunca para mostrar el peso, calcular IMC ni proponer metas de peso.

import { MINIMUM_SAFE_ENERGY_FLOOR, DEFAULT_ENERGY_RANGE } from '@/lib/ethicalNutrition';

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

export const DIET_OPTIONS = [
  { id: 'vegetariana', label: 'Vegetariana' },
  { id: 'vegana', label: 'Vegana' },
  { id: 'sin-tacc', label: 'Sin TACC (celiaquía)' },
  { id: 'sin-lactosa', label: 'Sin lactosa' },
];

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
    diet: [],
    allergies: '',
    tca: '',
    viewMode: 'rangos', // 'rangos' | 'intuitivo'
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
