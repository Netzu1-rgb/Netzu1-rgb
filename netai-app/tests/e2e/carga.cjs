// Uso simultáneo: muchas personas entrando, abriendo la app y usando la IA al mismo tiempo. No usa navegador.
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:3210';
const USERS = Number(process.env.USERS || 150);
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + m);
const img = fs.readFileSync(path.join(__dirname, 'fixtures', 'plato.jpg')).toString('base64');
const pct = (list, p) => [...list].sort((a, b) => a - b)[Math.min(list.length - 1, Math.floor(list.length * p))];
const timed = async (bucket, fn) => { const t = performance.now(); const r = await fn(); bucket.push(performance.now() - t); return r; };

async function user(i, times, sharedIp) {
  const ip = sharedIp || `10.${20 + (i >> 8)}.${i & 255}.7`;
  const json = { 'Content-Type': 'application/json', 'x-forwarded-for': ip };
  const login = await timed(times.login, () => fetch(BASE + '/api/auth/login', { method: 'POST', headers: json, body: JSON.stringify({ password: i % 2 ? 'familia-local' : 'codigo-ana' }) }));
  const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
  if (login.status !== 200) return 'ingreso ' + login.status;
  const app = await timed(times.app, () => fetch(BASE + '/app', { headers: { cookie, 'x-forwarded-for': ip }, redirect: 'manual' }));
  if (app.status !== 200) return 'app ' + app.status;
  await app.text();
  const photo = await timed(times.photo, () => fetch(BASE + '/api/analizar-plato', { method: 'POST', headers: { ...json, cookie }, body: JSON.stringify({ image: img, mimeType: 'image/jpeg' }) }));
  const data = await photo.json().catch(() => ({}));
  if (photo.status !== 200 || !data.name) return 'foto ' + photo.status;
  const ideas = await timed(times.ideas, () => fetch(BASE + '/api/sugerir-comidas', { method: 'POST', headers: { ...json, cookie }, body: JSON.stringify({ moment: 'cena', diet: [], allergies: '' }) }));
  if (ideas.status !== 200) return 'ideas ' + ideas.status;
  return null;
}

(async () => {
  const times = { login: [], app: [], photo: [], ideas: [] };
  const t0 = performance.now();
  const results = await Promise.all(Array.from({ length: USERS }, (_, i) => user(i, times)));
  const total = performance.now() - t0;
  const failed = results.filter(Boolean);
  ok(failed.length === 0, `${USERS} personas a la vez: ingreso, app, foto e ideas sin errores ${failed.slice(0, 5).join(', ')}`);
  const line = Object.entries(times).map(([k, v]) => `${k} ${Math.round(pct(v, 0.5))}/${Math.round(pct(v, 0.95))} ms`).join(' · ');
  console.log(`      mediana / percentil 95: ${line} · total ${Math.round(total)} ms`);
  ok(pct(times.app, 0.95) < 3000 && pct(times.photo, 0.95) < 5000, 'con esa carga, el 95 % de las respuestas llega en tiempos razonables');

  // Un club entero en el mismo wifi: cada sesión tiene su propio cupo de IA
  const t2 = { login: [], app: [], photo: [], ideas: [] };
  const same = await Promise.all(Array.from({ length: 40 }, (_, i) => user(i, t2, '10.77.0.1')));
  ok(same.filter(Boolean).length === 0, '40 personas en la misma red (un club, una oficina) no se bloquean entre sí ' + same.filter(Boolean).slice(0, 3).join(', '));

  // Las sesiones no se mezclan: cada una sigue siendo válida por separado
  const a = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.88.0.1' }, body: JSON.stringify({ password: 'familia-local' }) });
  const b = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.88.0.2' }, body: JSON.stringify({ password: 'codigo-ana' }) });
  const ca = (a.headers.get('set-cookie') || '').split(';')[0]; const cb = (b.headers.get('set-cookie') || '').split(';')[0];
  ok(ca !== cb && ca.split('.')[1] !== cb.split('.')[1], 'cada código genera sesiones distintas');
})().catch((e) => { console.log('FALLA error inesperado ' + e.message); process.exit(1); });
