import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeLogs, sanitizeWeights, parseJson } from '../../src/lib/storage.js';

test('un texto dañado no rompe la lectura', () => {
  assert.equal(parseJson('{"a":'), null);
  assert.equal(parseJson(null), null);
  assert.deepEqual(parseJson('{"a":1}'), { a: 1 });
});

test('los registros con otro formato se descartan', () => {
  assert.deepEqual(sanitizeLogs(null), {});
  assert.deepEqual(sanitizeLogs([1, 2]), {});
  assert.deepEqual(sanitizeLogs({ hola: {}, '2026-11-01': 'x' }), {});
});

test('un día dañado queda usable y conserva lo válido', () => {
  const out = sanitizeLogs({ '2026-11-01': { waterGlasses: 'muchos', meals: { almuerzo: [{ id: 1, name: 'Guiso', energy: '560', protein: -3 }, { name: '' }, null], cena: 'nada' } } });
  const day = out['2026-11-01'];
  assert.equal(day.waterGlasses, 0);
  assert.equal(day.meals.almuerzo.length, 1);
  assert.equal(day.meals.almuerzo[0].energy, 560);
  assert.equal('protein' in day.meals.almuerzo[0], false);
  assert.equal('cena' in day.meals, false);
});

test('una comida sin energía sigue sin energía', () => {
  const out = sanitizeLogs({ '2026-11-01': { waterGlasses: 3, meals: { cena: [{ id: 'a', name: 'Tarta', energy: null }] } } });
  assert.equal('energy' in out['2026-11-01'].meals.cena[0], false);
  assert.equal(out['2026-11-01'].waterGlasses, 3);
});

test('el registro de peso descarta valores imposibles', () => {
  assert.deepEqual(sanitizeWeights('x'), []);
  assert.deepEqual(sanitizeWeights([{ date: '2026-11-01', kg: '84.8' }, { date: 'ayer', kg: 80 }, { date: '2026-11-02', kg: 900 }, null]), [{ date: '2026-11-01', kg: 84.8 }]);
});
