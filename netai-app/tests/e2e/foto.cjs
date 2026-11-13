const BASE = process.env.BASE || 'http://localhost:3210';
const FIX = require('path').join(__dirname, 'fixtures');
const { chromium } = require('playwright');
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + m);
(async () => {
  const b = await chromium.launch();
  const r0 = await (await fetch(BASE + '/api/analizar-plato', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status;
  ok(r0 === 401, 'sin sesión: la ruta responde 401');
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.request.post(BASE + '/api/auth/login', { data: { password: 'familia-local' } });
  await p.goto(BASE + '/app', { waitUntil: 'networkidle' });
  // perfil Sport ya completo
  await p.evaluate(() => localStorage.setItem('netai_profile_v1', JSON.stringify({ version: 1, name: 'Juan', age: '30', sex: 'masculino', heightCm: '178', weightKg: '85', mode: 'sport', sportGoal: 'perder-grasa', trainingDays: '4', sessionMinutes: '60', tca: 'no', viewMode: 'rangos', goals: [], diet: [], allergies: '', completedAt: '2026-11-03' })));
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Registrar' }).nth(1).click(); await p.waitForTimeout(200);
  await p.click('button:has-text("Sacar foto del plato")');
  ok(await p.isVisible('text=la foto se envía a Claude'), 'primera vez: pide permiso y explica a dónde va la foto');
  const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.click('button:has-text("Aceptar y sacar foto")')]);
  await chooser.setFiles(FIX + '/plato.jpg');
  await p.waitForSelector('text=Milanesa con puré y ensalada', { timeout: 15000 });
  ok((await p.inputValue('#meal-name')) === 'Milanesa con puré y ensalada', 'completa el nombre');
  ok((await p.inputValue('#meal-energy')) === '720' && (await p.inputValue('#meal-protein')) === '42' && (await p.inputValue('#meal-carbs')) === '58' && (await p.inputValue('#meal-fat')) === '34', 'completa kcal, proteínas, carbohidratos y grasas');
  await p.click('button:has-text("Guardar")'); await p.waitForTimeout(400);
  const body = await p.textContent('body');
  ok(body.includes('P 42 g · C 58 g · G 34 g'), 'la comida guarda los macronutrientes');
  ok(body.includes('42 g de 155 a 185 g') && body.includes('58 g de') && body.includes('34 g de'), 'Mi día suma proteínas, carbohidratos y grasas');
  // segunda foto: ya no pide permiso; foto sin comida
  await p.getByRole('button', { name: 'Registrar' }).nth(2).click(); await p.waitForTimeout(200);
  const [ch2] = await Promise.all([p.waitForEvent('filechooser'), p.click('button:has-text("Sacar foto del plato")')]);
  await ch2.setFiles(FIX + '/vacio.jpg');
  await p.waitForSelector('text=No encontramos comida en la foto', { timeout: 15000 });
  ok(true, 'segunda vez abre la cámara directo; foto sin comida: mensaje claro');
  ok(errs.length === 0, 'sin errores ' + errs.join(' | '));
  await b.close();
})();
