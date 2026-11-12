const BASE = process.env.BASE || 'http://localhost:3210';
const FIX = require('path').join(__dirname, 'fixtures');
const { chromium } = require('playwright');
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + m);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  await p.request.post(BASE + '/api/auth/login', { data: { password: 'familia-local' } });
  await p.goto(BASE + '/app', { waitUntil: 'networkidle' });
  await p.evaluate(() => navigator.serviceWorker.ready); await p.waitForTimeout(1500);
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);  // segunda carga: el SW guarda la página y los archivos
  await p.click('text=Prefiero completarlo después').catch(() => {});
  await p.getByRole('button', { name: 'Registrar' }).first().click(); await p.fill('#meal-name', 'Mate y tostadas'); await p.click('button:has-text("Guardar")'); await p.waitForTimeout(300);
  await ctx.setOffline(true);
  await p.reload({ waitUntil: 'domcontentloaded' }).catch(e => console.log('reload', e.message)); await p.waitForTimeout(1500);
  ok((await p.textContent('body')).includes('Mate y tostadas'), 'sin conexión: la app abre y muestra los registros');
  await p.click('nav[aria-label=Secciones] button:nth-child(4)'); await p.waitForTimeout(300);
  ok(await p.isVisible('#titulo-escala'), 'sin conexión: se puede navegar');
  const font = await p.evaluate(() => document.fonts.check('700 20px "Bricolage Grotesque Variable"'));
  ok(font, 'sin conexión: las tipografías siguen cargadas');
  await b.close();
})();
