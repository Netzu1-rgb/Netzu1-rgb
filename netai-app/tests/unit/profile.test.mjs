import test from 'node:test';
import assert from 'node:assert/strict';
import { energyRangeFor, sportPlan, validateSport, validateNumbers, minHealthyWeight, weeksToTarget, weightTrend, canUseSport, hidesNumbers } from '../../src/lib/profile.js';

const adulto = { age: '35', sex: 'masculino', heightCm: '180', weightKg: '80', activity: 'moderada', tca: 'no', mode: 'bienestar' };
const sport = { age: '30', sex: 'masculino', heightCm: '178', weightKg: '85', mode: 'sport', sportGoal: 'perder-grasa', trainingDays: '4', sessionMinutes: '60', tca: 'no' };

test('rango de energía personal para un adulto con datos completos', () => {
  assert.deepEqual(energyRangeFor(adulto), { min: 2500, max: 2900, personal: true });
});

test('sin datos, menores y TCA usan el rango general', () => {
  const general = { min: 1900, max: 2200, personal: false };
  assert.deepEqual(energyRangeFor(null), general);
  assert.deepEqual(energyRangeFor({ ...adulto, age: '16' }), general);
  assert.deepEqual(energyRangeFor({ ...adulto, tca: 'si' }), general);
  assert.deepEqual(energyRangeFor({ ...adulto, weightKg: '' }), general);
});

test('el rango nunca baja del piso de 1.500 kcal', () => {
  const r = energyRangeFor({ age: '80', sex: 'femenino', heightCm: '150', weightKg: '40', activity: 'baja', tca: 'no' });
  assert.ok(r.min >= 1500);
  assert.ok(r.max > r.min);
});

test('Modo Sport: bajar de peso con déficit moderado y piso en el gasto en reposo', () => {
  const p = sportPlan(sport);
  assert.deepEqual(p.energy, { min: 2250, max: 2500 });
  assert.equal(p.floor, 1800);
  assert.ok(p.energy.min >= p.floor);
  assert.ok(p.maintenance - (p.energy.min + p.energy.max) / 2 <= 500, 'el déficit no supera 500 kcal');
  assert.deepEqual(p.proteinG, [155, 185]);
  assert.equal(p.waterGlasses, 14);
});

test('Modo Sport: los macronutrientes suman la energía del día en los cuatro objetivos', () => {
  for (const goal of ['perder-grasa', 'ganar-musculo', 'recomposicion', 'rendimiento']) {
    const p = sportPlan({ ...sport, sportGoal: goal });
    const mid = (a) => (a[0] + a[1]) / 2;
    const kcal = mid(p.proteinG) * 4 + mid(p.carbsG) * 4 + mid(p.fatG) * 9;
    const objetivo = (p.energy.min + p.energy.max) / 2;
    assert.ok(Math.abs(kcal - objetivo) < 60, `${goal}: ${kcal} vs ${objetivo}`);
  }
});

test('Modo Sport: ritmo de 0,5 a 1 % del peso por semana al bajar', () => {
  const p = sportPlan(sport);
  assert.ok(Math.abs(p.rateKg[0] + 0.85) < 0.001);
  assert.ok(Math.abs(p.rateKg[1] + 0.425) < 0.001);
});

test('Modo Sport no está disponible para menores ni con TCA', () => {
  assert.equal(canUseSport({ ...sport, age: '17' }), false);
  assert.equal(canUseSport({ ...sport, tca: 'si' }), false);
  assert.equal(sportPlan({ ...sport, tca: 'si' }), null);
  assert.equal(hidesNumbers({ tca: 'si' }), true);
});

test('peso objetivo: rechaza valores por debajo de lo saludable para la altura', () => {
  assert.equal(minHealthyWeight('178'), 59);
  assert.match(validateSport({ ...sport, targetWeightKg: '55' }).targetWeightKg, /por debajo de lo saludable/);
  assert.equal(validateSport({ ...sport, targetWeightKg: '78' }).targetWeightKg, undefined);
  assert.match(validateSport({ ...sport, targetWeightKg: '90' }).targetWeightKg, /menor que tu peso actual/);
  assert.equal(weeksToTarget({ ...sport, targetWeightKg: '78' }), 11);
});

test('validación de edad, altura y peso', () => {
  assert.ok(validateNumbers({ age: '10', heightCm: '', weightKg: '' }).age);
  assert.ok(validateNumbers({ age: '30', heightCm: '50', weightKg: '400' }).heightCm);
  assert.deepEqual(validateNumbers({ age: '30', heightCm: '170', weightKg: '70' }), {});
});

test('tendencia de peso: promedio semanal y cambio contra la semana anterior', () => {
  const t = weightTrend([{ date: '2026-11-01', kg: 86 }, { date: '2026-11-04', kg: 85.6 }, { date: '2026-11-09', kg: 85 }, { date: '2026-11-12', kg: 84.8 }]);
  assert.equal(t.latest, 84.8);
  assert.ok(Math.abs(t.weekAvg - 84.9) < 0.001);
  assert.ok(Math.abs(t.weeklyChange + 0.9) < 0.001);
  assert.equal(weightTrend([]), null);
});
