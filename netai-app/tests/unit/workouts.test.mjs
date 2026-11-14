import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTINES, startWorkout, finishWorkout, lastSets, lastSetsText, workoutsThisWeek, sanitizeWorkouts, exerciseBySlug, usesWeight } from '../../src/lib/workouts.js';

test('todas las rutinas usan ejercicios de la biblioteca', () => {
  assert.ok(ROUTINES.length >= 8);
  for (const r of ROUTINES) for (const item of r.items) {
    const ex = exerciseBySlug(item.slug);
    assert.ok(ex, `${r.id}: falta ${item.slug}`);
    if (r.place === 'casa') assert.equal(ex.place, 'casa', `${r.id}: ${item.slug} necesita gimnasio`);
    assert.ok(item.sets >= 1 && (item.reps || item.secs));
  }
});

test('solo se guardan las series hechas', () => {
  const draft = startWorkout(ROUTINES.find((r) => r.id === 'gym-completo-a'), [], 1000);
  draft.exercises[0].sets[0] = { reps: 10, secs: '', kg: '20', done: true };
  draft.exercises[0].sets[1] = { reps: 8, secs: '', kg: '22,5', done: true };
  const w = finishWorkout(draft, 'exigente', 1000 + 40 * 60000);
  assert.equal(w.exercises.length, 1);
  assert.deepEqual(w.exercises[0].sets, [{ reps: 10, kg: 20 }, { reps: 8, kg: 22.5 }]);
  assert.equal(w.minutes, 40);
  assert.equal(w.feeling, 'exigente');
});

test('sin ninguna serie hecha no se guarda nada', () => {
  assert.equal(finishWorkout(startWorkout(ROUTINES[0], [], 0), 'bien', 60000), null);
});

test('la próxima vez propone la carga anterior', () => {
  const r = ROUTINES.find((x) => x.id === 'gym-completo-a');
  const first = startWorkout(r, [], 0);
  first.exercises[0].sets.forEach((s) => { s.kg = 20; s.done = true; });
  const saved = finishWorkout(first, 'bien', 600000);
  const again = startWorkout(r, [saved], 700000);
  assert.equal(again.exercises[0].sets[0].kg, 20);
  assert.equal(lastSetsText(lastSets([saved], 'goblet-squat')), '10 · 10 · 10 con 20 kg');
  assert.equal(usesWeight('goblet-squat'), true);
  assert.equal(usesWeight('push-up'), false);
});

test('cuenta los entrenamientos de la última semana', () => {
  const list = [{ date: '2026-11-14' }, { date: '2026-11-10' }, { date: '2026-11-01' }];
  assert.equal(workoutsThisWeek(list, '2026-11-14'), 2);
});

test('una copia dañada no rompe el historial', () => {
  assert.deepEqual(sanitizeWorkouts('x'), []);
  const out = sanitizeWorkouts([
    null,
    { date: 'ayer', exercises: [] },
    { date: '2026-11-10', routineName: 'A', exercises: [{ slug: 'no-existe', sets: [{ reps: 5 }] }, { slug: 'push-up', sets: [{ reps: 'x' }, { reps: 12, kg: -4 }] }] },
  ]);
  assert.equal(out.length, 1);
  assert.deepEqual(out[0].exercises, [{ slug: 'push-up', sets: [{ reps: 12 }] }]);
});

import { FIT_GOALS, recommendedRoutines, nextRoutine, weekDays, exerciseProgress, fitDefaultsFromNetAI, sanitizeFitProfile } from '../../src/lib/workouts.js';

test('cada objetivo tiene rutinas en casa y en el gimnasio', () => {
  for (const g of FIT_GOALS) for (const place of ['casa', 'gimnasio']) {
    assert.ok(recommendedRoutines({ goal: g.id, place, level: 'empezar' }).length >= 1, `${g.id} en ${place}`);
  }
});

test('la rutina que toca va rotando', () => {
  const fit = { goal: 'fuerza', place: 'gimnasio', level: 'empezar' };
  const list = recommendedRoutines(fit);
  assert.equal(nextRoutine(fit, []).id, list[0].id);
  assert.equal(nextRoutine(fit, [{ routineId: list[0].id, finishedAt: 5 }]).id, list[1].id);
});

test('la semana va de lunes a domingo', () => {
  const days = weekDays([{ date: '2026-11-10' }], '2026-11-14'); // sábado 14
  assert.equal(days[0].date, '2026-11-09');
  assert.equal(days[1].trained, true);
  assert.equal(days[5].isToday, true);
  assert.equal(days[6].future, true);
});

test('el progreso compara la primera carga con la última', () => {
  const mk = (date, t, kg) => ({ date, finishedAt: t, exercises: [{ slug: 'goblet-squat', sets: [{ reps: 10, kg }, { reps: 10, kg }] }] });
  const [p] = exerciseProgress([mk('2026-11-01', 1, 20), mk('2026-11-08', 2, 25)]);
  assert.equal(p.unit, 'kg'); assert.equal(p.first, 20); assert.equal(p.last, 25); assert.equal(p.sessions.length, 2);
});

test('toma objetivo y días de NetAI, y descarta perfiles dañados', () => {
  assert.deepEqual(fitDefaultsFromNetAI({ mode: 'sport', sportGoal: 'ganar-musculo', trainingDays: '4', sportTypes: ['fuerza'] }), { goal: 'musculo', days: '4', place: 'gimnasio', level: 'intermedio' });
  assert.deepEqual(fitDefaultsFromNetAI({ mode: 'bienestar' }), {});
  assert.equal(sanitizeFitProfile('x'), null);
  assert.equal(sanitizeFitProfile({ goal: 'volar', days: '9' }).goal, '');
});
