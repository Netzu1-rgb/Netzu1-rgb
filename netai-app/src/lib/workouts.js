// Rutinas y registro de entrenamientos de NetAI (pestaña Mover).
// Las series y repeticiones son valores generales para empezar; están pendientes de revisión profesional.
import { EXERCISES } from './exercises.js';

export const WORKOUTS_KEY = 'netai_workouts_v1';
export const WORKOUT_DRAFT_KEY = 'netai_workout_draft_v1';

// x(slug, series, repeticiones) o t(slug, series, segundos)
const x = (slug, sets, reps) => ({ slug, sets, reps });
const t = (slug, sets, secs) => ({ slug, sets, secs });

export const ROUTINES = [
  { id: 'casa-completo', goals: ['moverme', 'bajar', 'fuerza'], name: 'Cuerpo completo en casa', goal: 'Moverme más', level: 'Para empezar', place: 'casa', minutes: 25,
    items: [x('bodyweight-squat', 3, 12), x('knee-push-up', 3, 8), x('glute-bridge', 3, 12), x('bird-dog', 3, 10), t('plank', 3, 30)] },
  { id: 'casa-fuerza', goals: ['fuerza', 'musculo'], name: 'Fuerza en casa', goal: 'Fuerza', level: 'Intermedio', place: 'casa', minutes: 30,
    items: [x('forward-lunge', 3, 10), x('push-up', 3, 10), x('pike-push-up', 3, 8), x('bench-dip', 3, 10), x('superman', 3, 12), t('side-plank', 3, 30)] },
  { id: 'casa-piernas', goals: ['fuerza', 'musculo', 'bajar'], name: 'Piernas y glúteos en casa', goal: 'Fuerza', level: 'Para empezar', place: 'casa', minutes: 30,
    items: [x('bodyweight-squat', 3, 15), x('forward-lunge', 3, 10), x('glute-bridge', 3, 15), x('donkey-kick', 3, 12), t('wall-sit', 3, 30), x('calf-raise', 3, 15)] },
  { id: 'casa-cardio', goals: ['resistencia', 'bajar'], name: 'Cardio corto en casa', goal: 'Resistencia', level: 'Intermedio', place: 'casa', minutes: 20,
    items: [t('jumping-jack', 3, 40), t('high-knees', 3, 30), t('mountain-climber', 3, 30), x('bodyweight-squat', 3, 15), x('burpee', 3, 8)] },
  { id: 'movilidad', goals: ['movilidad', 'moverme'], name: 'Movilidad en 10 minutos', goal: 'Movilidad', level: 'Para empezar', place: 'casa', minutes: 10,
    items: [x('cat-cow-stretch', 2, 10), t('childs-pose', 2, 40), t('kneeling-hip-flexor-stretch', 2, 30), t('hamstring-stretch', 2, 30)] },
  { id: 'gym-completo-a', goals: ['fuerza', 'musculo', 'bajar', 'moverme'], name: 'Cuerpo completo A', goal: 'Fuerza', level: 'Para empezar', place: 'gimnasio', minutes: 45,
    items: [x('goblet-squat', 3, 10), x('dumbbell-bench-press', 3, 10), x('seated-row', 3, 10), x('romanian-deadlift', 3, 10), t('plank', 3, 30)] },
  { id: 'gym-completo-b', goals: ['fuerza', 'musculo', 'bajar', 'moverme'], name: 'Cuerpo completo B', goal: 'Fuerza', level: 'Para empezar', place: 'gimnasio', minutes: 45,
    items: [x('leg-press', 3, 12), x('lat-pulldown', 3, 10), x('overhead-press', 3, 8), x('hip-thrust', 3, 10), x('dead-bug', 3, 10)] },
  { id: 'gym-superior', goals: ['musculo', 'fuerza'], name: 'Tren superior', goal: 'Fuerza', level: 'Intermedio', place: 'gimnasio', minutes: 50,
    items: [x('bench-press', 3, 8), x('one-arm-dumbbell-row', 3, 10), x('lateral-raise', 3, 12), x('bicep-curl', 3, 12), x('tricep-pushdown', 3, 12)] },
  { id: 'gym-inferior', goals: ['musculo', 'fuerza'], name: 'Tren inferior', goal: 'Fuerza', level: 'Intermedio', place: 'gimnasio', minutes: 50,
    items: [x('squat', 3, 8), x('romanian-deadlift', 3, 10), x('leg-press', 3, 12), x('hip-thrust', 3, 10), x('calf-raise', 3, 15)] },
];

export const FIT_PROFILE_KEY = 'netai_fit_profile_v1';

// Objetivos de NetAI Fit. "bajar" no se ofrece a quien indicó en NetAI un tratamiento por un trastorno alimentario.
export const FIT_GOALS = [
  { id: 'fuerza', label: 'Ganar fuerza', hint: 'Levantar más, de a poco' },
  { id: 'musculo', label: 'Ganar músculo', hint: 'Más volumen de trabajo' },
  { id: 'bajar', label: 'Bajar de peso', hint: 'Fuerza y cardio, sin apuro' },
  { id: 'resistencia', label: 'Resistencia', hint: 'Aguantar más sin cansarte' },
  { id: 'movilidad', label: 'Movilidad', hint: 'Moverte suelto y sin dolor' },
  { id: 'moverme', label: 'Moverme más', hint: 'Empezar y sostenerlo' },
];
export const FIT_LEVELS = [
  { id: 'empezar', label: 'Estoy empezando' },
  { id: 'intermedio', label: 'Ya entreno' },
];
export const emptyFitProfile = () => ({ goal: '', place: 'casa', days: '3', level: 'empezar', completedAt: '' });

/** Objetivo y días que ya cargó la persona en NetAI (Modo Sport), para no preguntar dos veces */
export function fitDefaultsFromNetAI(profile) {
  if (!profile || profile.mode !== 'sport') return {};
  const goal = { 'perder-grasa': 'bajar', 'ganar-musculo': 'musculo', recomposicion: 'fuerza', rendimiento: 'resistencia' }[profile.sportGoal];
  const days = Number(profile.trainingDays);
  const sports = Array.isArray(profile.sportTypes) && profile.sportTypes.length ? profile.sportTypes : [profile.sportType];
  return {
    ...(goal ? { goal } : {}),
    ...(days >= 1 && days <= 7 ? { days: String(days) } : {}),
    ...(sports.includes('fuerza') ? { place: 'gimnasio', level: 'intermedio' } : {}),
  };
}

export function sanitizeFitProfile(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const base = emptyFitProfile();
  return {
    goal: FIT_GOALS.some((g) => g.id === data.goal) ? data.goal : '',
    place: data.place === 'gimnasio' ? 'gimnasio' : 'casa',
    days: /^[1-7]$/.test(String(data.days)) ? String(data.days) : base.days,
    level: data.level === 'intermedio' ? 'intermedio' : 'empezar',
    completedAt: typeof data.completedAt === 'string' ? data.completedAt : '',
  };
}

/** Rutinas que sirven para el objetivo y el lugar; primero las del nivel de la persona */
export function recommendedRoutines(fit) {
  const inPlace = ROUTINES.filter((r) => r.place === (fit?.place || 'casa') || (fit?.place === 'gimnasio' && r.id === 'movilidad' && fit?.goal === 'movilidad'));
  const matching = inPlace.filter((r) => r.goals.includes(fit?.goal));
  const list = matching.length ? matching : inPlace;
  const mine = fit?.level === 'intermedio' ? 'Intermedio' : 'Para empezar';
  return [...list].sort((a, b) => Number(b.level === mine) - Number(a.level === mine));
}

/** La rutina que toca: rota entre las recomendadas según la última que se hizo */
export function nextRoutine(fit, workouts) {
  const list = recommendedRoutines(fit);
  if (!list.length) return null;
  const last = [...(workouts || [])].sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)).find((w) => list.some((r) => r.id === w.routineId));
  if (!last) return list[0];
  return list[(list.findIndex((r) => r.id === last.routineId) + 1) % list.length];
}

/** Días de la semana actual (lunes a domingo) con su fecha y si hubo entrenamiento */
export function weekDays(workouts, today) {
  const base = new Date(`${today}T12:00:00`);
  const monday = new Date(base); monday.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  const trained = new Set((workouts || []).map((w) => w.date));
  return ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { label, date, trained: trained.has(date), isToday: date === today, future: date > today };
  });
}

/** Progreso por ejercicio: la mejor marca de cada sesión, de la más vieja a la más nueva */
export function exerciseProgress(workouts) {
  const map = new Map();
  for (const w of [...(workouts || [])].sort((a, b) => (a.finishedAt || 0) - (b.finishedAt || 0))) {
    for (const e of w.exercises || []) {
      const kgs = e.sets.map((s) => s.kg || 0);
      const unit = Math.max(...kgs) > 0 ? 'kg' : e.sets[0]?.secs ? 's' : 'rep';
      const top = unit === 'kg' ? Math.max(...kgs) : Math.max(...e.sets.map((s) => (unit === 's' ? s.secs : s.reps) || 0));
      if (!map.has(e.slug)) map.set(e.slug, { slug: e.slug, unit, sessions: [] });
      const entry = map.get(e.slug);
      if (unit === 'kg') entry.unit = 'kg';
      entry.sessions.push({ date: w.date, top, unit, text: lastSetsText(e.sets) });
    }
  }
  return [...map.values()].map((p) => {
    const same = p.sessions.filter((x) => x.unit === p.unit);
    return { ...p, first: same[0]?.top ?? null, last: same[same.length - 1]?.top ?? null, best: Math.max(...same.map((x) => x.top)) };
  }).sort((a, b) => b.sessions.length - a.sessions.length);
}
export const FEELINGS = [
  { id: 'suave', label: 'Suave' },
  { id: 'bien', label: 'Bien' },
  { id: 'exigente', label: 'Exigente' },
];

export const exerciseBySlug = (slug) => EXERCISES.find((e) => e.slug === slug);
/** Los ejercicios de gimnasio llevan carga en kilos; los de casa, solo repeticiones o tiempo */
export const usesWeight = (slug) => exerciseBySlug(slug)?.place === 'gimnasio' && exerciseBySlug(slug)?.equipment !== 'Barra fija';
export const targetText = (item) => `${item.sets} × ${item.secs ? `${item.secs} s` : item.reps}`;

/** Arma el entrenamiento en curso a partir de una rutina, con la carga de la última vez si existe */
export function startWorkout(routine, workouts, now = Date.now()) {
  return {
    routineId: routine.id,
    routineName: routine.name,
    startedAt: now,
    exercises: routine.items.map((item) => {
      const last = lastSets(workouts, item.slug);
      return {
        slug: item.slug,
        sets: Array.from({ length: item.sets }, (_, i) => ({
          reps: item.reps ?? '',
          secs: item.secs ?? '',
          kg: last[i]?.kg ?? last[last.length - 1]?.kg ?? '',
          done: false,
        })),
      };
    }),
  };
}

/** Series hechas de un ejercicio en el entrenamiento más reciente que lo incluye */
export function lastSets(workouts, slug) {
  for (const w of [...(workouts || [])].sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))) {
    const ex = (w.exercises || []).find((e) => e.slug === slug);
    if (ex?.sets?.length) return ex.sets;
  }
  return [];
}

/** Texto corto con lo último que se hizo: "12 · 12 · 10 con 20 kg" */
export function lastSetsText(sets) {
  if (!sets.length) return '';
  const values = sets.map((s) => (s.secs ? `${s.secs} s` : s.reps)).join(' · ');
  const kgs = [...new Set(sets.map((s) => s.kg).filter((k) => k !== '' && k != null))];
  return `${values}${kgs.length ? ` con ${kgs.join(' / ')} kg` : ''}`;
}

const num = (v, min, max) => { const n = Number(String(v).replace(',', '.')); return v === '' || v == null || !Number.isFinite(n) || n < min || n > max ? null : n; };

/** Cierra el entrenamiento en curso: se guardan solo las series marcadas como hechas */
export function finishWorkout(draft, feeling, now = Date.now()) {
  const exercises = draft.exercises
    .map((e) => ({
      slug: e.slug,
      sets: e.sets.filter((s) => s.done).map((s) => {
        const out = {};
        const reps = num(s.reps, 1, 500); const secs = num(s.secs, 1, 3600); const kg = num(s.kg, 0, 600);
        if (secs !== null) out.secs = Math.round(secs); else if (reps !== null) out.reps = Math.round(reps);
        if (kg !== null && kg > 0) out.kg = kg;
        return out;
      }).filter((s) => s.reps || s.secs),
    }))
    .filter((e) => e.sets.length);
  if (!exercises.length) return null;
  const d = new Date(now);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    routineId: draft.routineId,
    routineName: draft.routineName,
    minutes: Math.max(1, Math.min(600, Math.round((now - draft.startedAt) / 60000))),
    feeling: FEELINGS.some((f) => f.id === feeling) ? feeling : 'bien',
    finishedAt: now,
    exercises,
  };
}

/** Cantidad de entrenamientos en los últimos 7 días (contando hoy) */
export function workoutsThisWeek(workouts, today) {
  const end = new Date(`${today}T12:00:00`);
  const start = new Date(end); start.setDate(end.getDate() - 6);
  return (workouts || []).filter((w) => { const d = new Date(`${w.date}T12:00:00`); return d >= start && d <= end; }).length;
}

/** Limpia lo leído del teléfono o de una copia de seguridad */
export function sanitizeWorkouts(data) {
  if (!Array.isArray(data)) return [];
  return data
    .filter((w) => w && typeof w === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(String(w.date)) && Array.isArray(w.exercises))
    .map((w) => ({
      id: String(w.id ?? `${w.date}-${Math.random().toString(36).slice(2, 8)}`),
      date: w.date,
      routineId: String(w.routineId || ''),
      routineName: String(w.routineName || 'Entrenamiento').slice(0, 80),
      minutes: num(w.minutes, 1, 600) ?? 1,
      feeling: FEELINGS.some((f) => f.id === w.feeling) ? w.feeling : 'bien',
      finishedAt: Number(w.finishedAt) || 0,
      exercises: w.exercises
        .filter((e) => e && typeof e.slug === 'string' && Array.isArray(e.sets) && exerciseBySlug(e.slug))
        .map((e) => ({
          slug: e.slug,
          sets: e.sets.filter((s) => s && typeof s === 'object').map((s) => {
            const out = {};
            const reps = num(s.reps, 1, 500); const secs = num(s.secs, 1, 3600); const kg = num(s.kg, 0, 600);
            if (secs !== null) out.secs = Math.round(secs); else if (reps !== null) out.reps = Math.round(reps);
            if (kg !== null && kg > 0) out.kg = kg;
            return out;
          }).filter((s) => s.reps || s.secs),
        }))
        .filter((e) => e.sets.length),
    }))
    .filter((w) => w.exercises.length)
    .slice(-2000);
}
