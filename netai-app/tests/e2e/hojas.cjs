// Hojas (ventanas que suben desde abajo): foco del teclado, botón Atrás, tamaño de los botones y datos dañados.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:3210';
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + m);
const PROFILE = { version: 1, name: 'Sofi', age: '32', sex: 'femenino', heightCm: '165', weightKg: '60', mode: 'bienestar', activity: 'moderada', tca: 'no', viewMode: 'rangos', goals: ['calma'], diet: [], allergies: '', completedAt: 'x' };
const today = () => { const x = new Date(); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.request.post(BASE + '/api/auth/login', { data: { password: 'familia-local' } });
  await p.goto(BASE + '/app', { waitUntil: 'networkidle' });
  const seed = async (logs, extra = {}) => {
    await p.evaluate(([pr, lg, ex]) => {
      localStorage.clear();
      localStorage.setItem('netai_profile_v1', JSON.stringify(pr)); localStorage.setItem('netai_wellness_log_v1', lg); localStorage.setItem('netai_pwa_dismissed', 'true');
      Object.entries(ex).forEach(([k, v]) => localStorage.setItem(k, v));
    }, [PROFILE, logs, extra]);
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(400);
  };
  const logs = {}; logs[today()] = { waterGlasses: 2, meals: { almuerzo: [{ id: 'a', name: 'Milanesa napolitana con puré de papas y ensalada mixta grande', energy: 720, satietyBefore: 3, satietyAfter: 7 }] } };
  await seed(JSON.stringify(logs));

  // Botones cómodos para el dedo
  const small = await p.evaluate(() => [...document.querySelectorAll('button')].filter((e) => e.getClientRects().length).map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), e.getAttribute('aria-label') || e.textContent.trim()]; }).filter((x) => x[0] < 44 || x[1] < 44));
  ok(small.length === 0, 'los botones de Mi día miden al menos 44 px ' + JSON.stringify(small.slice(0, 4)));
  const nameBox = await p.locator('li:has-text("Milanesa napolitana") p').first().boundingBox();
  ok(nameBox.height < 50, 'el nombre de la comida usa el ancho de la tarjeta (' + Math.round(nameBox.height) + ' px de alto)');

  // Foco dentro de la hoja
  await p.click('button[aria-label="Ajustes"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!document.activeElement.closest('[role=dialog]')), 'al abrir Ajustes el foco entra en la hoja');
  for (let i = 0; i < 40; i++) await p.keyboard.press('Tab');
  ok(await p.evaluate(() => !!document.activeElement.closest('[role=dialog]')), 'el tabulador no sale de la hoja');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.activeElement.getAttribute('aria-label') === 'Ajustes'), 'al cerrar, el foco vuelve al botón que la abrió');

  // Botón Atrás del teléfono
  await p.click('button[aria-label="Ajustes"]'); await p.waitForTimeout(300);
  await p.goBack(); await p.waitForTimeout(400);
  ok(p.url().endsWith('/app') && (await p.locator('[role=dialog]').count()) === 0, 'Atrás cierra la hoja y la app sigue abierta');
  await p.click('button[aria-label="Ajustes"]'); await p.waitForTimeout(300);
  await p.click('button:has-text("Horarios y recordatorios")'); await p.waitForTimeout(400);
  ok(await p.isVisible('#titulo-horarios'), 'pasar de una hoja a otra no la cierra');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  ok((await p.locator('[role=dialog]').count()) === 0 && !(await p.evaluate(() => window.history.state?.netaiSheet)), 'al cerrar con Escape no queda una entrada de más en el historial');
  await p.goto(BASE + '/app', { waitUntil: 'networkidle' });

  // El selector de día solo aparece donde sirve
  await p.click('nav[aria-label=Secciones] button:nth-child(3)'); await p.waitForTimeout(300);
  ok((await p.locator('button[aria-label="Día anterior"]').count()) === 0, 'Inspiración no muestra el selector de día');
  await p.click('nav[aria-label=Secciones] button:nth-child(1)'); await p.waitForTimeout(300);
  ok(await p.isVisible('button[aria-label="Día anterior"]'), 'Mi día sí lo muestra');

  // Datos dañados en el teléfono
  await seed('{"roto":', { netai_weight_log_v1: '"x"', netai_prefs_v1: '[1,2]' });
  ok(await p.isVisible('text=Hola, Sofi'), 'con registros dañados la app abre igual y conserva el perfil');
  const bad = {}; bad[today()] = { waterGlasses: 'x', meals: { almuerzo: 'nada', cena: [null, { id: 1, name: 'Tarta', energy: 'abc' }] } };
  await seed(JSON.stringify(bad));
  ok(await p.isVisible('text=Tarta') && errs.length === 0, 'un día con formato raro no rompe la pantalla');

  // Copia de seguridad con contenido inválido
  await p.click('button[aria-label="Ajustes"]'); await p.waitForTimeout(300);
  await p.setInputFiles('input[type=file][accept*="json"]', { name: 'copia.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'NetAI', logsByDate: { '2026-01-05': { meals: { almuerzo: 7 } }, basura: 3 }, weightLog: [{ date: 'x', kg: 'y' }], prefs: { favorites: 'no' } })) });
  await p.waitForTimeout(500);
  await p.click('nav[aria-label=Secciones] button:nth-child(2)'); await p.waitForTimeout(300);
  await p.click('nav[aria-label=Secciones] button:nth-child(1)'); await p.waitForTimeout(300);
  ok(await p.isVisible('text=Hola, Sofi') && errs.length === 0, 'restaurar una copia con datos inválidos no rompe la app ' + errs.join('|'));
  ok(errs.length === 0, 'sin errores ' + errs.join('|'));
  await b.close();
})();
