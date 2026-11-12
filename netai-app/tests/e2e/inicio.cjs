const BASE = process.env.BASE || 'http://localhost:3210';
const FIX = require('path').join(__dirname, 'fixtures');
const { chromium } = require('playwright'); const fs = require('fs');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + m);
(async () => {
  const b = await chromium.launch();
  for (const [n, vp] of [['m', { width: 390, height: 844 }], ['d', { width: 1366, height: 860 }]]) {
    const p = await b.newPage({ viewport: vp }); const errs = []; let sent = null;
    p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
    await p.route('https://formsubmit.co/**', r => { sent = JSON.parse(r.request().postData()); r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":"true"}' }); });
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) === 0, n + ': sin desborde horizontal');
    await p.addScriptTag({ content: axe });
    const r = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })).violations.map(v => v.id + ' x' + v.nodes.length + ' ' + (v.nodes[0].html || '').slice(0, 90)));
    ok(r.length === 0, n + ': accesibilidad ' + JSON.stringify(r));
    if (n === 'm') {
      await p.click('button:has-text("Enviar solicitud")'); ok((await p.textContent('[role=status]')).includes('nombre'), 'valida');
      await p.fill('#rq-nombre', 'Ana'); await p.fill('#rq-email', 'ana@correo.com'); await p.check('input[value=iPhone]'); await p.check('input[value=Sport]'); await p.check('input[type=checkbox]');
      await p.click('button:has-text("Enviar solicitud")'); await p.waitForTimeout(500);
      ok(sent && sent.Nombre === 'Ana' && sent.Modo === 'Sport' && sent['Teléfono'] === 'iPhone', 'envía la solicitud');
      ok((await p.textContent('[role=status]')).includes('Recibimos tu solicitud'), 'confirma');
    }
    ok(errs.length === 0, n + ': sin errores ' + errs.join('|'));
  }
  await b.close();
})();
