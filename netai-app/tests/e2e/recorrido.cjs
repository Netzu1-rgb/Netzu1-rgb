const BASE = process.env.BASE || 'http://localhost:3210';
const FIX = require('path').join(__dirname, 'fixtures');
const { chromium } = require('playwright');
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + m);
async function fresh(b) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(String(e)));
  await p.request.post(BASE + '/api/auth/login', { data: { password: 'familia-local' } });
  await p.goto(BASE + '/app', { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
  return p;
}
const next = (p) => p.click('footer button:has-text("Siguiente"), footer button:has-text("Empezar")');
(async () => {
  const b = await chromium.launch();
  // 1. Recorrido completo, adulto
  let p = await fresh(b);
  ok(await p.isVisible('text=Armemos tu plan en 1 minuto'), 'la primera vez abre el recorrido');
  await next(p);
  await p.click('button[aria-label="Sumar a edad"]');
  ok((await p.inputValue('#ob-edad')) === '30', 'la edad se puede elegir tocando, sin escribir');
  await p.fill('#ob-nombre', 'Juan'); await p.fill('#ob-edad', '35'); await p.click('button[aria-label="Sumar a edad"]'); await p.click('button[aria-label="Restar a edad"]');
  await p.locator('input[type=range][aria-label^="Edad"]').fill('35');
  ok((await p.inputValue('#ob-edad')) === '35' && await p.isVisible('h1:has-text("Hola, Juan")'), 'botones, barra y campo quedan sincronizados, y saluda por el nombre');
  ok((await p.locator('[aria-label="Lo que ya respondiste"] li').allTextContents()).join('|') === 'Juan|35 años', 'la tira "tu plan" muestra lo que ya respondiste');
  await p.click('[role=radio]:has-text("Masculino")');
  await next(p);
  const modos = await p.locator('[role=radiogroup][aria-label="Modo de uso"] [role=radio]').allTextContents();
  ok(modos[0].startsWith('Modo Sport') && modos[1].startsWith('Bienestar') && (await p.getAttribute('[role=radio]:has-text("Modo Sport")', 'aria-checked')) === 'true', 'el Modo Sport va primero y viene marcado');
  await p.click('[role=radiogroup][aria-label="Modo de uso"] [role=radio]:has-text("Bienestar")'); await next(p);
  await p.fill('#ob-altura', '180'); await p.fill('#ob-peso', '400');
  await next(p); ok(await p.isVisible('text=Escribí tu peso en kilos'), 'valida un peso fuera de rango');
  await p.fill('#ob-peso', '80'); await next(p);
  await p.click('[role=radio]:has-text("Moderado")'); await next(p);
  await p.click('button:has-text("Comer con más calma")'); await p.click('button:has-text("Acompañar mi entrenamiento")'); await next(p);
  ok((await p.getAttribute('[role=radio]:has-text("De todo")', 'aria-checked')) === 'true' && await p.isVisible('button:has-text("Carne roja")'), 'alimentación: empieza en "De todo" y pregunta qué no comés');
  await p.click('button:has-text("Cerdo")');
  await p.click('button:has-text("Vegetariana")'); await p.click('button:has-text("Frutos secos")'); await p.fill('#ob-alergias', 'maní');
  ok((await p.locator('button:has-text("Carne roja")').count()) === 0 && await p.isVisible('button:has-text("Huevo")'), 'al elegir vegetariana no ofrece las carnes');
  await next(p);
  await p.click('[role=radio]:has-text("No")'); await next(p);
  const resumen = await p.textContent('main');
  ok(resumen.includes('No comés') && resumen.includes('frutos secos, maní') && !resumen.includes('cerdo'), 'el resumen separa cómo comés de lo que no comés');
  const rango = await p.textContent('main p.font-display.tabular');
  ok(rango.includes('2.500 a 2.900'), 'calcula el rango personal: ' + rango);
  await p.click('footer button:has-text("Ir a mi día")'); await p.waitForTimeout(400);
  ok(await p.isVisible('text=Hola, Juan'), 'saluda por el nombre');
  ok((await p.textContent('body')).includes('Tu rango: 2.500 a 2.900 kcal'), 'Mi día usa el rango personal');
  await p.click('nav[aria-label=Secciones] button:nth-child(3)'); await p.waitForTimeout(200);
  ok((await p.getAttribute('[aria-pressed=true]:has-text("Vegetariano")', 'aria-pressed')) === 'true', 'recetas filtradas por vegetariana');
  await p.click('nav[aria-label=Secciones] button:nth-child(1)');
  await p.click('button[aria-label="Ajustes"]'); await p.click('button:has-text("Tus datos")'); await p.waitForTimeout(300);
  ok((await p.inputValue('#ob-nombre')) === 'Juan', 'editar datos desde Ajustes: vienen cargados');
  await p.click('button[aria-label="Cerrar sin guardar"]');
  ok(p.errs.length === 0, 'sin errores (adulto) ' + p.errs.join(' | '));
  // 2. TCA: nunca números
  p = await fresh(b);
  await next(p); await p.fill('#ob-edad', '28'); await next(p); await p.click('[role=radio]:has-text("Bienestar")'); await next(p); await next(p); await next(p); await next(p); await next(p);
  await p.click('[role=radio]:has-text("Sí")'); await p.waitForTimeout(150);
  ok(await p.isVisible('text=Activamos el Modo Intuitivo'), 'TCA: activa el Modo Intuitivo');
  await next(p); ok(!(await p.isVisible('text=kcal')), 'TCA: el resumen no muestra calorías');
  await p.click('footer button:has-text("Ir a mi día")'); await p.waitForTimeout(400);
  ok(!(await p.isVisible('[role=switch]')) && !(await p.textContent('main')).includes('kcal'), 'TCA: Mi día sin números ni interruptor');
  // 3. Menor de edad
  p = await fresh(b);
  await next(p); await p.fill('#ob-edad', '15'); await p.waitForTimeout(100);
  ok(await p.isVisible('text=Como sos menor de 18'), 'menor: aviso');
  await next(p); ok(await p.isVisible('text=¿Cuánto te movés'), 'menor: saltea peso y altura');
  // 4. Completar después
  p = await fresh(b);
  await p.click('text=Prefiero completarlo después'); await p.waitForTimeout(300);
  ok(await p.isVisible('#titulo-completar'), 'saltear: queda el recordatorio en Mi día');
  ok((await p.textContent('body')).includes('Rango general: 1.900 a 2.200 kcal'), 'saltear: rango general');
  await b.close();
})();
