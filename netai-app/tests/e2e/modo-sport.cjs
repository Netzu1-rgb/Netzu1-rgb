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
const body = (p) => p.textContent('body');
(async () => {
  const b = await chromium.launch();
  let p = await fresh(b);
  await next(p); await p.fill('#ob-nombre', 'Juan'); await p.fill('#ob-edad', '30'); await p.click('[role=radio]:has-text("Masculino")'); await next(p);
  ok(await p.isVisible('text=¿Cómo querés usar NetAI?'), 'paso de modo');
  await p.click('[role=radio]:has-text("Modo Sport")'); await p.waitForTimeout(150); await next(p);
  await next(p); ok(await p.isVisible('text=necesitamos tu peso'), 'Sport exige peso y altura');
  await p.fill('#ob-altura', '178'); await p.fill('#ob-peso', '85'); await next(p);
  await p.click('[role=radio]:has-text("Gimnasio o fuerza")'); await p.fill('#ob-dias', '4'); await p.fill('#ob-minutos', '60'); await next(p);
  await next(p); ok(await p.isVisible('text=Elegí un objetivo para seguir'), 'pide elegir objetivo');
  await p.click('[role=radio]:has-text("Bajar de peso")'); await p.fill('#ob-objetivo', '55'); await next(p);
  ok(await p.isVisible('text=queda por debajo de lo saludable'), 'rechaza un peso objetivo no saludable');
  await p.fill('#ob-objetivo', '78'); await p.waitForTimeout(100);
  ok(await p.isVisible('text=unas 11 semanas'), 'estima semanas a ritmo seguro'); await next(p);
  await next(p); await p.click('[role=radio]:has-text("No")'); await next(p);
  const t = await body(p);
  ok(t.includes('2.250 a 2.500 kcal') && t.includes('155 a 185 g'), 'plan: energía y proteínas');
  ok(t.includes('14 vasos') && t.includes('nunca bajamos de 1.800') || t.includes('Nunca bajamos de 1.800'), 'plan: agua y piso del gasto en reposo');
  await p.click('footer button:has-text("Ir a mi día")'); await p.waitForTimeout(400);
  const d = await body(p);
  ok(d.includes('Modo Sport') && d.includes('Tu objetivo: 2.250 a 2.500 kcal') && d.includes('Objetivo: Bajar de peso'), 'Mi día en Modo Sport');
  ok(!(await p.isVisible('[role=switch]')), 'sin interruptor de Modo Intuitivo');
  ok((await p.locator('button[aria-label^="Vaso"]').count()) === 14, '14 vasos de agua');
  await p.getByRole('button', { name: 'Registrar' }).nth(1).click(); await p.waitForTimeout(200);
  await p.fill('#meal-name', 'Pollo con arroz'); await p.fill('#meal-energy', '650'); await p.fill('#meal-protein', '45'); await p.click('button:has-text("Guardar")'); await p.waitForTimeout(400);
  ok((await body(p)).includes('45 g de 155 a 185 g'), 'proteínas del día');
  // Semana: peso con historial rápido
  await p.evaluate(() => {
    const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
    localStorage.setItem('netai_weight_log_v1', JSON.stringify([{ date: d(13), kg: 86 }, { date: d(10), kg: 85.8 }, { date: d(6), kg: 84.4 }, { date: d(2), kg: 84 }]));
  });
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  await p.click('nav[aria-label=Secciones] button:nth-child(2)'); await p.waitForTimeout(300);
  ok((await body(p)).includes('más rápido de lo recomendable'), 'avisa si baja demasiado rápido');
  await p.click('button:has-text("Registrar peso")'); await p.fill('#peso-hoy', '83.9'); await p.click('form button:has-text("Guardar")'); await p.waitForTimeout(300);
  ok((await body(p)).includes('83,9 kg'), 'registra el peso de hoy');
  ok(p.errs.length === 0, 'sin errores ' + p.errs.join(' | '));
  // TCA + Sport: termina en Bienestar sin números
  p = await fresh(b);
  await next(p); await p.fill('#ob-edad', '25'); await next(p); await p.click('[role=radio]:has-text("Modo Sport")'); await next(p);
  await p.fill('#ob-altura', '165'); await p.fill('#ob-peso', '60'); await next(p); await next(p);
  await p.click('[role=radio]:has-text("Bajar de peso")'); await next(p); await next(p);
  await p.click('[role=radio]:has-text("Sí")'); await p.waitForTimeout(100);
  ok(await p.isVisible('text=el Modo Sport y las metas de peso no van a estar disponibles'), 'TCA: avisa que Sport no está disponible');
  await next(p); await p.click('footer button:has-text("Ir a mi día")'); await p.waitForTimeout(300);
  const tt = await p.textContent('main');
  ok(!tt.includes('kcal') && !(await body(p)).includes('Modo Sport'), 'TCA: queda en Bienestar sin números');
  // Menor: sin paso de modo
  p = await fresh(b);
  await next(p); await p.fill('#ob-edad', '16'); await next(p);
  ok(!(await p.isVisible('text=¿Cómo querés usar NetAI?')), 'menor: no se ofrece Modo Sport');
  await b.close();
})();
