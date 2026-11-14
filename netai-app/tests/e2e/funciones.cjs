const BASE = process.env.BASE || 'http://localhost:3210';
const FIX = require('path').join(__dirname, 'fixtures');
const { chromium } = require('playwright');
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + m);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.request.post(BASE + '/api/auth/login', { data: { password: 'familia-local' } });
  await p.goto(BASE + '/app', { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
  await p.click('text=Prefiero completarlo después'); await p.waitForTimeout(300);
  ok((await p.locator('text=Tostada de masa madre').count()) === 0, 'primera vez: sin datos de ejemplo');
  ok(await p.isDisabled('button[aria-label="Día siguiente"]'), 'no deja ir a un día futuro');
  await p.getByRole('button', { name: 'Registrar' }).first().click(); await p.waitForTimeout(400);
  await p.fill('#meal-name', 'Yogur con granola'); await p.click('button:has-text("Guardar")'); await p.waitForTimeout(400);
  ok(await p.isVisible('text=Comida guardada.'), 'aviso al guardar');
  ok((await p.locator('text=Yogur con granola').count()) > 0, 'la comida aparece en el día');
  // editar
  await p.click('button[aria-label="Editar Yogur con granola"]'); await p.waitForTimeout(300);
  ok((await p.inputValue('#meal-name')) === 'Yogur con granola', 'editar: abre con los datos');
  await p.fill('#meal-name', 'Yogur con granola y banana'); await p.click('button:has-text("Guardar cambios")'); await p.waitForTimeout(400);
  ok((await p.locator('text=Yogur con granola y banana').count()) > 0, 'editar: guarda el cambio');
  // frecuentes
  await p.getByRole('button', { name: 'Registrar' }).last().click(); await p.waitForTimeout(300);
  ok(await p.isVisible('text=Tus frecuentes'), 'muestra comidas frecuentes');
  await p.click('button:has-text("Cancelar")'); await p.waitForTimeout(200);
  // borrar y deshacer
  await p.click('button[aria-label="Eliminar Yogur con granola y banana"]'); await p.waitForTimeout(300);
  ok((await p.locator('li >> text=Yogur con granola y banana').count()) === 0, 'borrar: desaparece');
  await p.click('button:has-text("Deshacer")'); await p.waitForTimeout(300);
  ok((await p.locator('text=Yogur con granola y banana').count()) > 0, 'deshacer: vuelve');
  // agua
  await p.click('button[aria-label^="Vaso 3"]'); await p.waitForTimeout(200);
  // receta con momento
  await p.click('nav[aria-label=Secciones] button:nth-child(3)'); await p.waitForTimeout(300);
  await p.click('button:has-text("Ver receta")'); await p.waitForTimeout(300);
  await p.click('[role=radio]:has-text("Cena")'); await p.click('[role=dialog] button:has-text("Sumar a cena")'); await p.waitForTimeout(400);
  ok(await p.isVisible('text=Sumaste la receta a cena.'), 'receta: se suma al momento elegido');
  // semana
  await p.click('nav[aria-label=Secciones] button:nth-child(2)'); await p.waitForTimeout(400);
  ok(await p.isVisible('#titulo-semana'), 'vista Semana');
  ok((await p.textContent('#titulo-semana + p')).includes('1 día'), 'semana: cuenta los días');
  // ajustes
  await p.click('button[aria-label="Ajustes"]'); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Descargar copia")')]);
  const path = await dl.path(); const data = JSON.parse(require('fs').readFileSync(path, 'utf8'));
  ok(data.app === 'NetAI' && Object.keys(data.logsByDate).length === 1 && data.profile, 'exportar: descarga la copia (' + dl.suggestedFilename() + ')');
  await p.click('button:has-text("Borrar todos mis datos")'); await p.waitForTimeout(200);
  ok(await p.isVisible('text=¿Borrar todos tus datos?'), 'borrar todo: pide confirmación');
  await p.click('button:has-text("Sí, borrar todo")'); await p.waitForTimeout(300);
  ok(await p.isVisible('text=Armemos tu plan en 1 minuto'), 'borrar todo: vuelve el recorrido');
  await p.click('text=Prefiero completarlo después'); await p.waitForTimeout(300);
  await p.click('button[aria-label="Ajustes"]'); await p.waitForTimeout(300);
  await p.setInputFiles('input[type=file]', path); await p.waitForTimeout(500);
  ok(await p.isVisible('text=Registros restaurados desde la copia.'), 'restaurar copia');
  await p.click('nav[aria-label=Secciones] button:nth-child(1)'); await p.waitForTimeout(300);
  ok((await p.locator('text=Yogur con granola y banana').count()) > 0, 'restaurar: vuelven los registros');
  await p.click('button[aria-label="Ajustes"]'); await p.click('button:has-text("Cerrar sesión")'); await p.waitForTimeout(200);
  await p.locator('button:has-text("Cerrar sesión")').first().click(); await p.waitForURL('**/login', { timeout: 8000 });
  ok(p.url().endsWith('/login'), 'cerrar sesión sin ventanas del navegador');
  console.log('errores:', errs);
  await b.close();
})();
