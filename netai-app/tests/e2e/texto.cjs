// Estimación de una comida con IA a partir de lo que la persona escribe.
const BASE = process.env.BASE || 'http://localhost:3210';
const fs = require('fs');
const { chromium } = require('playwright');
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + m);
(async () => {
  const b = await chromium.launch();
  const r0 = await (await fetch(BASE + '/api/analizar-comida', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status;
  ok(r0 === 401, 'sin sesión: la ruta responde 401');
  const gone = await (await fetch(BASE + '/api/analizar-plato', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status;
  ok(gone === 404, 'la ruta de análisis por foto ya no existe');
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.request.post(BASE + '/api/auth/login', { data: { password: 'familia-local' } });
  await p.goto(BASE + '/app', { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.setItem('netai_profile_v1', JSON.stringify({ version: 1, name: 'Juan', age: '30', sex: 'masculino', heightCm: '178', weightKg: '85', mode: 'sport', sportGoal: 'perder-grasa', trainingDays: '4', sessionMinutes: '60', tca: 'no', viewMode: 'rangos', goals: [], diet: [], allergies: '', completedAt: 'x' })));
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Registrar' }).nth(1).click(); await p.waitForTimeout(200);
  ok((await p.locator('input[type=file]').count()) === 0 && (await p.locator('text=foto').count()) === 0, 'registrar ya no ofrece sacar una foto');
  ok(await p.locator('button:has-text("Estimar con IA")').isDisabled() && await p.isVisible('text=El texto se envía a Claude'), 'el botón de estimar espera a que escribas, y avisa a dónde va el texto');
  await p.fill('#meal-name', 'una milanesa con pure y ensalada');
  await p.click('button:has-text("Estimar con IA")');
  await p.waitForSelector('text=Estimación de la IA', { timeout: 15000 });
  ok((await p.inputValue('#meal-name')) === 'Milanesa con puré y ensalada', 'ordena el nombre de la comida');
  ok((await p.inputValue('#meal-energy')) === '720' && (await p.inputValue('#meal-protein')) === '42' && (await p.inputValue('#meal-carbs')) === '58' && (await p.inputValue('#meal-fat')) === '34', 'completa kcal, proteínas, carbohidratos y grasas');
  ok((await p.textContent('[role=dialog]')).includes('1 plato mediano') && (await p.textContent('[role=dialog]')).includes('La porción de puré es aproximada'), 'muestra la porción estimada y la aclaración');
  const log = fs.readFileSync(process.env.AI_LOG, 'utf8');
  ok(log.includes('una milanesa con pure y ensalada') && !log.includes('Juan'), 'a la IA le llega solo lo escrito, sin el nombre de la persona');
  await p.click('button:has-text("Guardar")'); await p.waitForTimeout(400);
  const body = await p.textContent('body');
  ok(body.includes('P 42 g · C 58 g · G 34 g'), 'la comida guarda los macronutrientes');
  ok(body.includes('42 g de 155 a 185 g') && body.includes('58 g de') && body.includes('34 g de'), 'Mi día suma proteínas, carbohidratos y grasas');
  // Un texto que no es comida
  await p.getByRole('button', { name: 'Registrar' }).nth(2).click(); await p.waitForTimeout(200);
  await p.fill('#meal-name', 'asdf qwerty'); await p.click('button:has-text("Estimar con IA")');
  await p.waitForSelector('text=No reconocimos una comida en ese texto', { timeout: 15000 });
  ok((await p.inputValue('#meal-energy')) === '', 'si el texto no es una comida, lo dice y no completa nada');
  // Se puede guardar a mano igual
  await p.fill('#meal-name', 'Fruta'); await p.fill('#meal-energy', '80'); await p.click('button:has-text("Guardar")'); await p.waitForTimeout(300);
  ok((await p.textContent('main')).includes('Fruta'), 'registrar a mano sigue funcionando');
  // Modo Intuitivo: la estimación no muestra números
  const q = await ctx.newPage();
  await q.goto(BASE + '/app', { waitUntil: 'networkidle' });
  await q.evaluate(() => { localStorage.setItem('netai_profile_v1', JSON.stringify({ version: 1, name: 'Ana', age: '30', mode: 'bienestar', tca: 'si', viewMode: 'intuitivo', goals: [], diet: [], allergies: '', completedAt: 'x' })); });
  await q.reload({ waitUntil: 'networkidle' }); await q.waitForTimeout(300);
  await q.getByRole('button', { name: 'Registrar' }).nth(0).click(); await q.fill('#meal-name', 'tostadas con palta'); await q.click('button:has-text("Estimar con IA")');
  await q.waitForSelector('text=Estimación de la IA', { timeout: 15000 });
  const dlg = await q.textContent('[role=dialog]');
  ok(dlg.includes('Vegetales 25 %') && !dlg.includes('kcal') && !dlg.includes('720'), 'sin números: la estimación muestra solo cómo quedó armado el plato');
  ok(errs.length === 0, 'sin errores ' + errs.join(' | '));
  await b.close();
})();
