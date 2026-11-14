// Pestaña Mover: biblioteca de ejercicios con la figura animada.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:3210';
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + m);
(async () => {
  // Cada ejercicio de la lista tiene sus tres dibujos, y son solo dibujos
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'lib', 'exercises.js'), 'utf8');
  const slugs = [...src.matchAll(/E\('([a-z0-9-]+)'/g)].map((m) => m[1]);
  const dir = path.join(__dirname, '..', '..', 'public', 'ejercicios');
  const missing = []; let unsafe = 0;
  for (const s of slugs) for (const n of [1, 2, 3]) {
    const f = path.join(dir, s, `frame-${n}.svg`);
    if (!fs.existsSync(f)) { missing.push(`${s}/${n}`); continue; }
    if (/<script|href|onload|<foreignObject/i.test(fs.readFileSync(f, 'utf8'))) unsafe += 1;
  }
  ok(slugs.length >= 40 && new Set(slugs).size === slugs.length && missing.length === 0, `${slugs.length} ejercicios, cada uno con sus tres poses ${missing.slice(0, 3)}`);
  ok(unsafe === 0 && fs.existsSync(path.join(dir, 'ATRIBUCION.md')), 'los dibujos no traen código y llevan su atribución');

  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.request.post(BASE + '/api/auth/login', { data: { password: 'familia-local' } });
  await p.goto(BASE + '/app', { waitUntil: 'networkidle' });
  await p.evaluate(() => { localStorage.setItem('netai_profile_v1', JSON.stringify({ version: 1, name: 'Sofi', age: '32', sex: 'femenino', heightCm: '165', weightKg: '60', mode: 'bienestar', activity: 'moderada', tca: 'no', viewMode: 'rangos', goals: ['calma'], diet: [], allergies: '', completedAt: 'x' })); localStorage.setItem('netai_pwa_dismissed', 'true'); });
  await p.reload({ waitUntil: 'networkidle' });
  await p.click('nav[aria-label=Secciones] button:has-text("Mover")'); await p.waitForTimeout(500);
  ok(await p.isVisible('#titulo-mover') && (await p.locator('button[aria-label="Día anterior"]').count()) === 0, 'abre la pestaña Mover, sin selector de día');
  const count = async () => p.locator('section[aria-label=Ejercicios] li').count();
  const home = await count();
  ok(home >= 20 && !(await p.textContent('section[aria-label=Ejercicios]')).includes('Press de banca'), `en casa: ${home} ejercicios, sin los de gimnasio`);
  await p.click('button:has-text("Gimnasio")'); await p.waitForTimeout(300);
  ok((await count()) === slugs.length && (await p.textContent('section[aria-label=Ejercicios]')).includes('Press de banca'), 'gimnasio: suma barra, mancuernas y máquinas');
  await p.click('[aria-label="Zona del cuerpo"] button:has-text("Pecho")'); await p.waitForTimeout(300);
  const chest = await p.locator('section[aria-label=Ejercicios] li').allTextContents();
  ok(chest.length >= 3 && chest.every((t) => t.includes('Pecho')), 'filtra por zona del cuerpo');
  const loaded = await p.evaluate(() => [...document.querySelectorAll('section[aria-label=Ejercicios] .figura-pose')].length);
  ok(loaded === chest.length, 'en la lista cada tarjeta carga una sola pose');
  await p.click('section[aria-label=Ejercicios] button:has-text("Flexión de brazos") >> nth=-1'); await p.waitForTimeout(500);
  const sheet = p.locator('[role=dialog]');
  ok((await sheet.locator('.figura-animada .figura-pose').count()) === 3 && (await sheet.locator('ol li').count()) === 3, 'el detalle muestra la figura con sus tres poses y los pasos');
  const anim = await sheet.locator('.figura-pose').first().evaluate((el) => getComputedStyle(el).animationName);
  ok(anim.startsWith('figura-pose'), 'la figura se mueve (' + anim + ')');
  const drawn = await sheet.locator('.figura-pose').first().evaluate(async (el) => { const url = getComputedStyle(el).getPropertyValue('--pose').match(/url\((.*)\)/)[1].replace(/["']/g, ''); const r = await fetch(url); return r.ok && (r.headers.get('content-type') || '').includes('svg'); });
  ok(drawn, 'el dibujo se descarga del propio sitio');
  await sheet.locator('button:has-text("Pausar")').click(); await p.waitForTimeout(200);
  ok((await sheet.locator('.figura-animada').count()) === 0 && await sheet.locator('button:has-text("Ver movimiento")').isVisible(), 'se puede pausar el movimiento');
  ok(await p.isVisible('text=CC BY-SA 4.0'), 'la pantalla acredita a los autores de las ilustraciones');
  await p.close();
  // Quien pide menos movimiento ve la figura quieta
  const q = await (await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })).newPage();
  await q.request.post(BASE + '/api/auth/login', { data: { password: 'familia-local' } });
  await q.goto(BASE + '/app', { waitUntil: 'networkidle' });
  await q.evaluate(() => { localStorage.setItem('netai_profile_v1', JSON.stringify({ version: 1, name: 'Sofi', age: '32', mode: 'bienestar', tca: 'no', viewMode: 'rangos', goals: [], diet: [], allergies: '', completedAt: 'x' })); localStorage.setItem('netai_pwa_dismissed', 'true'); });
  await q.reload({ waitUntil: 'networkidle' });
  await q.click('nav[aria-label=Secciones] button:has-text("Mover")'); await q.click('section[aria-label=Ejercicios] button >> nth=0'); await q.waitForTimeout(400);
  const still = await q.locator('[role=dialog] .figura-pose').first().evaluate((el) => getComputedStyle(el).animationName);
  ok(still === 'none', 'con "reducir movimiento" activado, la figura queda quieta');
  ok(errs.length === 0, 'sin errores ' + errs.join('|'));
  await b.close();
})();
