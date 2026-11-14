const BASE = process.env.BASE || 'http://localhost:3210';
const FIX = require('path').join(__dirname, 'fixtures');
const { chromium } = require('playwright');
const fs = require('fs');
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const SPORT = { version: 1, name: 'Juan', age: '30', sex: 'masculino', heightCm: '178', weightKg: '85', mode: 'sport', sportGoal: 'perder-grasa', sportType: 'fuerza', trainingDays: '4', sessionMinutes: '60', targetWeightKg: '78', tca: 'no', viewMode: 'rangos', goals: [], diet: [], allergies: '', completedAt: '2026-11-03' };
const BIEN = { ...SPORT, mode: 'bienestar', sportGoal: '', activity: 'moderada', goals: ['calma'] };
const scheme = process.argv[2] || 'light';
async function run(p, label, out) {
  await p.addScriptTag({ content: axeSrc });
  const r = await p.evaluate(async () => await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }));
  for (const v of r.violations) {
    out.push({ label, id: v.id, impact: v.impact, n: v.nodes.length, ej: v.nodes.slice(0, 40).map(n => (n.html || '').slice(0, 110) + (n.any[0]?.message ? ' :: ' + n.any[0].message.slice(0, 120) : '')) });
  }
}
(async () => {
  const b = await chromium.launch(); const out = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  const go = async (path) => { await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(300); };
  await go('/'); await run(p, 'inicio', out);
  await go('/login'); await run(p, 'login', out);
  await go('/privacidad'); await run(p, 'privacidad', out);
  await p.request.post(BASE + '/api/auth/login', { data: { password: 'familia-local' } });
  await go('/app'); await run(p, 'recorrido-inicio', out);
  await p.click('footer button:has-text("Empezar")'); await p.waitForTimeout(200); await run(p, 'recorrido-vos', out);
  for (const [name, prof] of [['bienestar', BIEN], ['sport', SPORT]]) {
    await p.evaluate((pr) => { localStorage.setItem('netai_profile_v1', JSON.stringify(pr)); const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); }; localStorage.setItem('netai_weight_log_v1', JSON.stringify([{ date: d(9), kg: 86 }, { date: d(2), kg: 85 }]));
      const t = new Date(); const k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
      localStorage.setItem('netai_wellness_log_v1', JSON.stringify({ [k]: { waterGlasses: 3, meals: { desayuno: [{ id: 'a', name: 'Tostadas con palta', energy: 350, protein: 12, carbs: 40, fat: 14, satietyBefore: 3, satietyAfter: 7, notes: 'Rico' }], almuerzo: [], merienda: [], cena: [], colacion: [] } } })); }, prof);
    // El tema oscuro ya no se activa solo: se elige en Ajustes
    if (scheme === 'dark') await p.evaluate(() => localStorage.setItem('netai_prefs_v1', JSON.stringify({ theme: 'oscuro' })));
    await go('/app'); await run(p, name + '-midia', out);
    await p.getByRole('button', { name: 'Registrar' }).nth(1).click(); await p.waitForTimeout(300); await run(p, name + '-registrar', out);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    for (const [i, t] of [[2, 'semana'], [3, 'inspiracion'], [4, 'aprender']]) { await p.click(`nav[aria-label=Secciones] button:nth-child(${i})`); await p.waitForTimeout(300); await run(p, name + '-' + t, out); }
    await p.click('button:has-text("Ver receta")').catch(() => {}); 
    await p.click('nav[aria-label=Secciones] button:nth-child(3)'); await p.waitForTimeout(200);
    await p.locator('button:has-text("Ver receta")').first().click(); await p.waitForTimeout(300); await run(p, name + '-receta', out); await p.keyboard.press('Escape');
    await p.click('button[aria-label="Ajustes"]'); await p.waitForTimeout(300); await run(p, name + '-ajustes', out); await p.keyboard.press('Escape');
  }
  const seen = new Map();
  for (const v of out) { const k = v.id; if (!seen.has(k)) seen.set(k, { impact: v.impact, where: [], ej: v.ej }); seen.get(k).ej = [...new Set([...seen.get(k).ej, ...v.ej])]; seen.get(k).where.push(v.label + '(' + v.n + ')'); }
  for (const [k, v] of seen) { console.log(`\n[${v.impact}] ${k} -> ${v.where.join(', ')}`); v.ej.forEach(e => console.log('    ' + e)); }
  console.log((seen.size === 0 && errs.length === 0 ? 'OK   ' : 'FALLA') + ' accesibilidad (axe) en tema ' + scheme + ': ' + seen.size + ' reglas con problemas, ' + errs.length + ' errores');
  await b.close();
})();
