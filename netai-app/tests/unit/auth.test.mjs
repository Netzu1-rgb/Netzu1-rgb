import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
process.env.SESSION_SECRET = 'clave-de-prueba-de-al-menos-32-caracteres';
process.env.APP_ACCESS_CODES = 'codigo-uno, codigo-dos';
delete process.env.APP_FAMILY_PASSWORD;

const auth = await import('../../src/lib/auth.js');

test('acepta cualquiera de los códigos configurados y rechaza el resto', async () => {
  assert.equal(await auth.matchAccessCode('codigo-uno'), 'codigo-uno');
  assert.equal(await auth.matchAccessCode('  codigo-dos '), 'codigo-dos');
  assert.equal(await auth.matchAccessCode('otro'), null);
  assert.equal(await auth.matchAccessCode(''), null);
});

test('la sesión es válida y deja de serlo si se altera', async () => {
  const token = await auth.createSessionToken('codigo-uno');
  assert.equal(await auth.verifySessionToken(token), true);
  assert.equal(await auth.verifySessionToken(token.slice(0, -1) + (token.endsWith('0') ? '1' : '0')), false);
  assert.equal(await auth.verifySessionToken('v2.x.1.y'), false);
  assert.equal(await auth.verifySessionToken(''), false);
});

test('quitar un código cierra sus sesiones y no las de los demás', async () => {
  const uno = await auth.createSessionToken('codigo-uno');
  const dos = await auth.createSessionToken('codigo-dos');
  process.env.APP_ACCESS_CODES = 'codigo-uno';
  assert.equal(await auth.verifySessionToken(uno), true);
  assert.equal(await auth.verifySessionToken(dos), false);
  process.env.APP_ACCESS_CODES = 'codigo-uno, codigo-dos';
});

test('las sesiones vencen a los 30 días', async () => {
  const realNow = Date.now;
  const token = await auth.createSessionToken('codigo-uno');
  Date.now = () => realNow() + 31 * 24 * 60 * 60 * 1000;
  try { assert.equal(await auth.verifySessionToken(token), false); } finally { Date.now = realNow; }
});

test('en producción, sin códigos o con clave corta, el acceso no está configurado', () => {
  assert.equal(auth.isAuthConfigured(), true);
  const saved = process.env.APP_ACCESS_CODES;
  delete process.env.APP_ACCESS_CODES;
  assert.equal(auth.isAuthConfigured(), false);
  process.env.APP_ACCESS_CODES = saved;
  process.env.SESSION_SECRET = 'corta';
  assert.equal(auth.isAuthConfigured(), false);
  process.env.SESSION_SECRET = 'clave-de-prueba-de-al-menos-32-caracteres';
});

test('bloqueo tras 8 intentos fallidos en 15 minutos', () => {
  const ip = '10.0.0.1';
  for (let i = 0; i < 7; i++) auth.recordFailure(ip, 1000 + i);
  assert.equal(auth.isLockedOut(ip, 2000), false);
  auth.recordFailure(ip, 1500);
  assert.equal(auth.isLockedOut(ip, 2000), true);
  assert.equal(auth.isLockedOut(ip, 2000 + 16 * 60 * 1000), false);
  auth.recordFailure(ip); auth.clearFailures(ip);
  assert.equal(auth.isLockedOut(ip), false);
});
