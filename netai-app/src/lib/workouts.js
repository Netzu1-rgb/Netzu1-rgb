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
  { id: 'gym-superior', program: 'torso-pierna', goals: ['musculo', 'fuerza'], name: 'Torso', goal: 'Fuerza', level: 'Intermedio', place: 'gimnasio', minutes: 50,
    items: [x('bench-press', 3, 8), x('one-arm-dumbbell-row', 3, 10), x('lateral-raise', 3, 12), x('bicep-curl', 3, 12), x('tricep-pushdown', 3, 12)] },
  { id: 'gym-inferior', program: 'torso-pierna', goals: ['musculo', 'fuerza'], name: 'Pierna', goal: 'Fuerza', level: 'Intermedio', place: 'gimnasio', minutes: 50,
    items: [x('squat', 3, 8), x('romanian-deadlift', 3, 10), x('leg-press', 3, 12), x('hip-thrust', 3, 10), x('calf-raise', 3, 15)] },

  // ---- Programas conocidos para ganar masa muscular (gimnasio). Se hacen en orden y se repiten.
  { id: 'ppl-empuje', program: 'ppl', goals: ['musculo'], name: 'PPL · Empuje', goal: 'Ganar músculo', level: 'Intermedio', place: 'gimnasio', minutes: 60,
    items: [x('bench-press', 4, 8), x('overhead-press', 3, 8), x('incline-dumbbell-press', 3, 10), x('lateral-raise', 3, 12), x('tricep-pushdown', 3, 12), x('skull-crusher', 3, 10)] },
  { id: 'ppl-tiron', program: 'ppl', goals: ['musculo'], name: 'PPL · Tirón', goal: 'Ganar músculo', level: 'Intermedio', place: 'gimnasio', minutes: 60,
    items: [x('barbell-row', 4, 8), x('lat-pulldown', 3, 10), x('seated-row', 3, 10), x('face-pull', 3, 15), x('bicep-curl', 3, 12), x('hammer-curl', 3, 12)] },
  { id: 'ppl-piernas', program: 'ppl', goals: ['musculo'], name: 'PPL · Piernas', goal: 'Ganar músculo', level: 'Intermedio', place: 'gimnasio', minutes: 60,
    items: [x('squat', 4, 8), x('romanian-deadlift', 3, 10), x('leg-press', 3, 12), x('leg-curl', 3, 12), x('leg-extension', 3, 12), x('standing-calf-raise', 4, 12)] },
  { id: 'arnold-pecho-espalda', program: 'arnold', goals: ['musculo'], name: 'Arnold · Pecho y espalda', goal: 'Ganar músculo', level: 'Intermedio', place: 'gimnasio', minutes: 70,
    items: [x('bench-press', 4, 8), x('incline-dumbbell-press', 3, 10), x('dumbbell-fly', 3, 12), x('chin-up', 4, 8), x('barbell-row', 4, 8), x('lat-pulldown', 3, 10)] },
  { id: 'arnold-hombros-brazos', program: 'arnold', goals: ['musculo'], name: 'Arnold · Hombros y brazos', goal: 'Ganar músculo', level: 'Intermedio', place: 'gimnasio', minutes: 70,
    items: [x('overhead-press', 4, 8), x('lateral-raise', 3, 12), x('rear-delt-fly', 3, 12), x('bicep-curl', 3, 10), x('hammer-curl', 3, 10), x('skull-crusher', 3, 10), x('tricep-pushdown', 3, 12)] },
  { id: 'arnold-piernas', program: 'arnold', goals: ['musculo'], name: 'Arnold · Piernas y abdomen', goal: 'Ganar músculo', level: 'Intermedio', place: 'gimnasio', minutes: 70,
    items: [x('squat', 4, 8), x('leg-press', 3, 12), x('leg-extension', 3, 12), x('leg-curl', 3, 12), x('romanian-deadlift', 3, 10), x('standing-calf-raise', 4, 15), x('hanging-leg-raise', 3, 12)] },
  { id: 'cinco-a', program: '5x5', goals: ['fuerza'], name: '5×5 · Día A', goal: 'Fuerza', level: 'Para empezar', place: 'gimnasio', minutes: 45,
    items: [x('squat', 5, 5), x('bench-press', 5, 5), x('barbell-row', 5, 5)] },
  { id: 'cinco-b', program: '5x5', goals: ['fuerza'], name: '5×5 · Día B', goal: 'Fuerza', level: 'Para empezar', place: 'gimnasio', minutes: 45,
    items: [x('squat', 5, 5), x('overhead-press', 5, 5), x('deadlift', 1, 5)] },
  { id: 'caminata-12-3-30', program: '12-3-30', goals: ['bajar', 'resistencia', 'moverme'], name: 'Caminata 12-3-30', goal: 'Resistencia', level: 'Para empezar', place: 'gimnasio', minutes: 30,
    note: 'Cinta con 12 % de pendiente, a unos 4,8 km/h (3 millas por hora), durante 30 minutos.',
    items: [t('treadmill-incline-walk', 1, 1800)] },

  // ---- Rutinas por deporte: fuerza y acondicionamiento que acompañan lo que la persona ya practica
  { id: 'deporte-resistencia-casa', sports: ['resistencia'], goals: ['resistencia'], name: 'Fuerza para correr, pedalear o nadar', goal: 'Resistencia', level: 'Para empezar', place: 'casa', minutes: 30,
    items: [x('forward-lunge', 3, 10), x('glute-bridge', 3, 15), x('calf-raise', 3, 15), x('jump-squat', 3, 8), x('superman', 3, 12), t('side-plank', 3, 30)] },
  { id: 'deporte-resistencia-gym', sports: ['resistencia'], goals: ['resistencia'], name: 'Fuerza para correr, pedalear o nadar', goal: 'Resistencia', level: 'Para empezar', place: 'gimnasio', minutes: 45,
    items: [x('bulgarian-split-squat', 3, 8), x('single-leg-romanian-deadlift', 3, 8), x('step-up', 3, 10), x('standing-calf-raise', 3, 12), x('lat-pulldown', 3, 10), t('side-plank', 3, 30)] },
  { id: 'deporte-equipo-casa', sports: ['equipo'], goals: [], name: 'Fuerza para deportes de equipo', goal: 'Potencia y cambios de dirección', level: 'Intermedio', place: 'casa', minutes: 30,
    items: [x('jump-squat', 3, 6), x('lateral-lunge', 3, 8), x('skater-hop', 3, 10), x('glute-bridge', 3, 15), x('push-up', 3, 10), t('plank', 3, 40)] },
  { id: 'deporte-equipo-gym', sports: ['equipo'], goals: [], name: 'Fuerza para deportes de equipo', goal: 'Potencia y cambios de dirección', level: 'Intermedio', place: 'gimnasio', minutes: 50,
    items: [x('squat', 4, 6), x('romanian-deadlift', 3, 8), x('bulgarian-split-squat', 3, 8), x('jump-squat', 3, 6), x('one-arm-dumbbell-row', 3, 10), t('side-plank', 3, 30)] },
  { id: 'deporte-combate-casa', sports: ['combate'], goals: [], name: 'Acondicionamiento para deportes de combate', goal: 'Resistencia y tronco', level: 'Intermedio', place: 'casa', minutes: 30,
    items: [t('jump-rope', 3, 60), x('push-up', 3, 12), x('burpee', 3, 8), x('russian-twist', 3, 20), t('mountain-climber', 3, 30), t('plank', 3, 40)] },
  { id: 'deporte-combate-gym', sports: ['combate'], goals: [], name: 'Acondicionamiento para deportes de combate', goal: 'Resistencia y tronco', level: 'Intermedio', place: 'gimnasio', minutes: 45,
    items: [x('kettlebell-swing', 3, 12), x('pull-up', 3, 6), x('dip', 3, 8), t('farmer-carry', 3, 40), t('battle-ropes', 3, 30), x('hanging-leg-raise', 3, 10)] },
  { id: 'deporte-funcional-casa', sports: ['mixto'], goals: [], name: 'Circuito funcional', goal: 'Todo el cuerpo', level: 'Intermedio', place: 'casa', minutes: 25,
    items: [x('burpee', 3, 10), x('jump-squat', 3, 10), x('push-up', 3, 12), t('mountain-climber', 3, 30), x('russian-twist', 3, 20), t('jumping-jack', 3, 40)] },
  { id: 'deporte-funcional-gym', sports: ['mixto'], goals: [], name: 'Circuito funcional', goal: 'Todo el cuerpo', level: 'Intermedio', place: 'gimnasio', minutes: 40,
    items: [x('kettlebell-swing', 3, 15), x('goblet-squat', 3, 12), x('pull-up', 3, 6), x('burpee', 3, 10), t('farmer-carry', 3, 40), t('battle-ropes', 3, 30)] },
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
// Programas de gimnasio: rutinas que se hacen en orden y se repiten
export const FIT_PROGRAMS = [
  { id: 'ppl', label: 'PPL', hint: 'Empuje, tirón y piernas', goals: ['musculo'] },
  { id: 'arnold', label: 'Arnold split', hint: 'Pecho y espalda, hombros y brazos, piernas', goals: ['musculo'] },
  { id: 'torso-pierna', label: 'Torso y pierna', hint: 'Dos días que se alternan', goals: ['musculo', 'fuerza'] },
  { id: '5x5', label: '5×5', hint: 'Tres ejercicios, cinco series de cinco', goals: ['fuerza'] },
];
export const programsFor = (goal, place) => (place === 'gimnasio' ? FIT_PROGRAMS.filter((p) => p.goals.includes(goal)) : []);
// Deportes que la persona practica (los mismos que pregunta NetAI). "fuerza" es el gimnasio en sí: no suma rutina aparte.
export const FIT_SPORTS = [
  { id: 'resistencia', label: 'Running, ciclismo o natación' },
  { id: 'equipo', label: 'Deporte en equipo' },
  { id: 'combate', label: 'Deporte de combate' },
  { id: 'mixto', label: 'Funcional o crossfit' },
];
export const emptyFitProfile = () => ({ goal: '', place: 'casa', days: '3', level: 'empezar', program: '', sports: [], completedAt: '' });

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
    ...(sports.some((x) => FIT_SPORTS.some((f) => f.id === x)) ? { sports: sports.filter((x) => FIT_SPORTS.some((f) => f.id === x)) } : {}),
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
    program: FIT_PROGRAMS.some((p) => p.id === data.program) ? data.program : '',
    sports: Array.isArray(data.sports) ? data.sports.filter((x) => FIT_SPORTS.some((f) => f.id === x)) : [],
    completedAt: typeof data.completedAt === 'string' ? data.completedAt : '',
  };
}

/**
 * Rutinas para la persona, en el orden en que se van a ir proponiendo:
 * primero las de los deportes que practica y después las del programa elegido o, si no eligió uno, las del objetivo.
 */
export function recommendedRoutines(fit) {
  const place = fit?.place || 'casa';
  const inPlace = ROUTINES.filter((r) => r.place === place);
  const bySport = inPlace.filter((r) => (r.sports || []).some((x) => (fit?.sports || []).includes(x)));
  const program = programsFor(fit?.goal, place).some((p) => p.id === fit?.program) ? fit.program : '';
  let main;
  if (program) main = inPlace.filter((r) => r.program === program);
  else {
    const general = inPlace.filter((r) => !r.sports && !(r.program && FIT_PROGRAMS.some((p) => p.id === r.program)));
    const matching = general.filter((r) => r.goals.includes(fit?.goal));
    const mine = fit?.level === 'intermedio' ? 'Intermedio' : 'Para empezar';
    main = [...(matching.length ? matching : general)].sort((a, b) => Number(b.level === mine) - Number(a.level === mine));
  }
  // Si el objetivo es de movilidad en el gimnasio, la rutina de movilidad (que es de casa) también sirve
  if (fit?.goal === 'movilidad' && place === 'gimnasio') main = [ROUTINES.find((r) => r.id === 'movilidad'), ...main];
  return [...new Set([...bySport, ...main])];
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
// Equipos con los que no se anota carga: el peso es el del cuerpo o no aplica
const NO_LOAD = ['Barra fija', 'Barras paralelas', 'Cinta', 'Sogas'];
export const usesWeight = (slug) => exerciseBySlug(slug)?.place === 'gimnasio' && !NO_LOAD.includes(exerciseBySlug(slug)?.equipment);
export const timeText = (secs) => (secs >= 120 && secs % 60 === 0 ? `${secs / 60} min` : `${secs} s`);
export const targetText = (item) => (item.secs ? (item.sets === 1 ? timeText(item.secs) : `${item.sets} × ${timeText(item.secs)}`) : `${item.sets} × ${item.reps}`);

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
  const values = sets.map((s) => (s.secs ? timeText(s.secs) : s.reps)).join(' · ');
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
        const reps = num(s.reps, 1, 500); const secs = num(s.secs, 1, 36000); const kg = num(s.kg, 0, 600);
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
            const reps = num(s.reps, 1, 500); const secs = num(s.secs, 1, 36000); const kg = num(s.kg, 0, 600);
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

/** Una serie se puede marcar como hecha solo si tiene repeticiones o tiempo válidos */
export const setIsValid = (st) => (num(st.secs, 1, 36000) !== null) || (num(st.reps, 1, 500) !== null);

/** Kilos totales movidos en un entrenamiento (repeticiones por carga) */
export const workoutVolume = (exercises) => Math.round((exercises || []).reduce((n, e) => n + e.sets.reduce((m, st) => m + (Number(st.reps) || 0) * (Number(String(st.kg ?? '').replace(',', '.')) || 0), 0), 0));

/** Ejercicios en los que el entrenamiento en curso supera la mejor carga anterior */
export function newRecords(draft, workouts) {
  const best = new Map(exerciseProgress(workouts).filter((p) => p.unit === 'kg').map((p) => [p.slug, p.best]));
  return (draft?.exercises || []).map((e) => {
    const top = Math.max(0, ...e.sets.filter((st) => st.done).map((st) => Number(String(st.kg ?? '').replace(',', '.')) || 0));
    return best.has(e.slug) && top > best.get(e.slug) ? { slug: e.slug, kg: top, before: best.get(e.slug) } : null;
  }).filter(Boolean);
}
