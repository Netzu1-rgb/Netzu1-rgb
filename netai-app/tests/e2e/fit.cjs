// NetAI Fit: app de entrenamiento aparte, conectada con NetAI.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:3210';
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + m);
const SPORT = { version: 1, name: 'Juan', age: '30', sex: 'masculino', heightCm: '178', weightKg: '85', mode: 'sport', sportGoal: 'ganar-musculo', sportType: 'fuerza', sportTypes: ['fuerza'], trainingDays: '4', sessionMinutes: '60', tca: 'no', viewMode: 'rangos', goals: [], diet: [], avoid: [], allergies: '', completedAt: 'x' };
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
  ok(slugs.length >= 68 && new Set(slugs).size === slugs.length && missing.length === 0, `${slugs.length} ejercicios, cada uno con sus tres poses ${missing.slice(0, 3)}`);
  ok(unsafe === 0 && fs.existsSync(path.join(dir, 'ATRIBUCION.md')), 'los dibujos no traen código y llevan su atribución');

  // Es privada, igual que NetAI
  const r = await fetch(BASE + '/fit', { redirect: 'manual' });
  ok(r.status >= 300 && r.status < 400 && (r.headers.get('location') || '').includes('/login'), 'sin sesión, NetAI Fit manda al ingreso');
  const mf = await (await fetch(BASE + '/fit.webmanifest')).json();
  ok(mf.short_name === 'NetAI Fit' && mf.start_url === '/fit' && mf.scope === '/fit', 'tiene su propio manifiesto para instalarse como app aparte');

  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.request.post(BASE + '/api/auth/login', { data: { password: 'familia-local' } });
  await p.goto(BASE + '/fit', { waitUntil: 'networkidle' });
  await p.evaluate((pr) => localStorage.setItem('netai_profile_v1', JSON.stringify(pr)), SPORT);
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  ok(await p.isVisible('h1:has-text("Juan, ¿qué buscás?")') && await p.isVisible('text=Tomamos tu objetivo de NetAI'), 'la primera vez pregunta los objetivos y saluda con el nombre de NetAI');
  ok((await p.getAttribute('[role=radio]:has-text("Ganar músculo")', 'aria-checked')) === 'true' && (await p.getAttribute('[role=radio][aria-label="4 días"]', 'aria-checked')) === 'true' && (await p.getAttribute('[role=radio]:has-text("Gimnasio")', 'aria-checked')) === 'true', 'trae objetivo, días y lugar desde el Modo Sport de NetAI');
  ok((await p.locator('[aria-label="Programa de entrenamiento"] [role=radio]').allTextContents()).map((t) => t.split(/(?=[A-ZÁÉ][a-zé])/)[0]).length === 3 && (await p.getAttribute('[role=radio]:has-text("PPL")', 'aria-checked')) === 'true', 'para ganar músculo en el gimnasio ofrece PPL, Arnold split y torso y pierna');
  await p.click('[role=radio]:has-text("Arnold split")'); await p.click('[role=radio]:has-text("PPL")');
  await p.click('button:has-text("Armar mi plan")'); await p.waitForTimeout(400);
  ok(await p.isVisible('text=Hoy te toca') && await p.isVisible('h2:has-text("PPL · Empuje")') && await p.isVisible('text=0 de 4 entrenamientos') && await p.isVisible('text=Ganar músculo · PPL'), 'Hoy: propone la primera rutina del programa y muestra la semana');

  // Entrenar
  await p.click('button:has-text("Empezar")'); await p.waitForTimeout(400);
  ok(await p.isVisible('text=0 de 19 series') && (await p.locator('.figura-animada').count()) >= 1, 'el entrenamiento lista los ejercicios con la figura en movimiento');
  for (let i = 0; i < 3; i++) await p.locator('input[aria-label^="Press de banca"][aria-label$="kilos"]').nth(i).fill(i === 2 ? '62,5'.replace(',', '.') : '60');
  ok((await p.evaluate(() => window.scrollY)) === 0, 'el entrenamiento abre desde arriba');
  // Sin repeticiones no se puede marcar la serie
  await p.fill('input[aria-label="Press de banca, serie 1: repeticiones"]', '');
  await p.locator('button[aria-label^="Press de banca"][aria-label$="marcar como hecha"]').first().click(); await p.waitForTimeout(200);
  ok(await p.isVisible('text=0 de 19 series') && await p.isVisible('text=Anotá las repeticiones o el tiempo'), 'una serie sin repeticiones no se marca, y avisa por qué');
  await p.fill('input[aria-label="Press de banca, serie 1: repeticiones"]', '8');
  for (let i = 0; i < 3; i++) await p.locator('button[aria-label^="Press de banca"][aria-label$="marcar como hecha"]').first().click();
  ok(await p.isVisible('text=3 de 19 series'), 'cada serie se marca como hecha y avanza el contador');
  ok(await p.isVisible('[role=timer]') && /Descanso 1:\d\d/.test(await p.textContent('[role=timer]')), 'al marcar una serie arranca el descanso con cuenta regresiva');
  await p.click('[role=timer] button:has-text("Saltar")'); await p.waitForTimeout(200);
  ok((await p.locator('[role=timer]').count()) === 0, 'el descanso se puede saltar');
  // Salir no pierde lo cargado
  await p.click('button:has-text("Salir")'); await p.waitForTimeout(300);
  ok(await p.isVisible('text=Tenés un entrenamiento sin terminar'), 'al salir, el entrenamiento queda guardado para seguir');
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  await p.click('button:has-text("Seguir")'); await p.waitForTimeout(300);
  ok(await p.isVisible('text=3 de 19 series') && (await p.inputValue('input[aria-label="Press de banca, serie 3: kilos"]')) === '62.5', 'y sobrevive a cerrar y volver a abrir la app');
  await p.click('button:has-text("Terminar entrenamiento")');
  ok((await p.textContent('[role=dialog]')).includes('Kilos movidos') && (await p.textContent('[role=dialog]')).includes('1.460'), 'al terminar muestra el resumen con los kilos movidos');
  await p.click('[role=radio]:has-text("Exigente")'); await p.click('button:has-text("Guardar entrenamiento")'); await p.waitForTimeout(400);
  ok(await p.isVisible('text=1 de 4 entrenamientos') && await p.isVisible('text=Ya entrenaste hoy'), 'al guardar, cuenta en la semana');

  // Progreso
  await p.click('nav button:has-text("Progreso")'); await p.waitForTimeout(300);
  const prog = await p.textContent('main');
  ok(prog.includes('Press de banca') && prog.includes('62,5 kg') && prog.includes('Exigente'), 'Progreso: muestra la carga por ejercicio y el historial');
  await p.fill('#fit-peso', '84,6'.replace(',', '.')); await p.click('button:has-text("Registrar")'); await p.waitForTimeout(300);
  ok((await p.textContent('main')).includes('84,6 kg'), 'se puede anotar el peso corporal');

  // La próxima vez propone la carga anterior y rota la rutina
  await p.click('nav button:has-text("Rutinas")');
  const rut = await p.textContent('main');
  ok(rut.includes('Programas conocidos') && rut.includes('Arnold split') && rut.includes('Pecho y espalda') && rut.includes('5×5') && rut.includes('Caminata 12-3-30') && rut.includes('Por deporte') && rut.includes('Circuito funcional') && !rut.includes('Fuerza en casa'), 'Rutinas: agrupa los programas conocidos y las rutinas por deporte del lugar elegido');
  await p.click('button:has-text("Caminata 12-3-30") >> nth=-1'); ok(await p.isVisible('text=12 % de pendiente') && await p.isVisible('[role=dialog] >> text=30 min'), 'la caminata 12-3-30 explica cómo se hace'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.click('button:has-text("PPL · Empuje")'); await p.click('[role=dialog] button:has-text("Empezar")'); await p.waitForTimeout(300);
  ok((await p.inputValue('input[aria-label="Press de banca, serie 1: kilos"]')) === '60' && await p.isVisible('text=La última vez:'), 'la próxima vez trae la carga anterior');
  await p.fill('input[aria-label="Press de banca, serie 1: kilos"]', '65'); await p.locator('button[aria-label^="Press de banca"][aria-label$="marcar como hecha"]').first().click();
  await p.click('button:has-text("Terminar entrenamiento")');
  ok((await p.textContent('[aria-label="Marcas nuevas"]')).includes('Press de banca') && (await p.textContent('[aria-label="Marcas nuevas"]')).includes('65 kg'), 'avisa cuando superás tu mejor carga');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // Con un entrenamiento en curso, empezar otro avisa antes de pisarlo
  await p.click('button:has-text("Salir")'); await p.click('nav button:has-text("Rutinas")'); await p.click('button:has-text("Caminata 12-3-30") >> nth=-1'); await p.waitForTimeout(300);
  ok(await p.isVisible('text=Si empezás esta, ese se descarta') && await p.isVisible('[role=dialog] button:has-text("Seguir el anterior")'), 'con un entrenamiento sin terminar, avisa antes de empezar otro');
  await p.click('[role=dialog] button:has-text("Descartar y empezar")'); await p.waitForTimeout(300);
  ok((await p.inputValue('input[aria-label="Caminata en cinta con pendiente, serie 1: minutos"]')) === '30' && (await p.locator('input[aria-label$="kilos"]').count()) === 0, 'la caminata se anota en minutos y sin kilos');
  await p.click('button:has-text("Terminar entrenamiento")'); await p.click('button:has-text("Descartar")'); await p.waitForTimeout(300);
  await p.click('nav button:has-text("Hoy")'); await p.waitForTimeout(200);
  ok(await p.isVisible('h2:has-text("PPL · Tirón")'), 'la rutina que toca va rotando dentro del programa');
  // Con un deporte elegido, su rutina pasa a ser la primera
  await p.click('button[aria-label="Cambiar mis objetivos"]'); await p.click('button:has-text("Deporte de combate")'); await p.click('button:has-text("Guardar cambios")'); await p.waitForTimeout(300);
  await p.click('nav button:has-text("Rutinas")');
  ok((await p.locator('#titulo-para-vos ~ ul li').first().textContent()).includes('Acondicionamiento para deportes de combate'), 'al elegir un deporte, su rutina queda primera entre las recomendadas');

  // Biblioteca
  await p.click('nav button:has-text("Ejercicios")'); await p.waitForTimeout(300);
  await p.click('section[aria-label=Ejercicios] button:has-text("Press de banca")'); await p.waitForTimeout(400);
  const sheet = p.locator('[role=dialog]');
  ok((await sheet.locator('.figura-animada .figura-pose').count()) === 3 && (await sheet.locator('ol li').count()) === 3, 'Ejercicios: el detalle muestra la figura con sus tres poses y los pasos');
  await sheet.locator('button:has-text("Pausar")').click(); await p.waitForTimeout(200);
  ok((await sheet.locator('.figura-animada').count()) === 0, 'se puede pausar el movimiento');
  await p.keyboard.press('Escape');
  ok(await p.isVisible('text=CC BY-SA 4.0'), 'acredita a los autores de las ilustraciones');

  // Conexión con NetAI
  await p.goto(BASE + '/app', { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
  const app = await p.textContent('main');
  ok(app.includes('Entrenaste: PPL · Empuje') && (await p.locator('nav[aria-label=Secciones] button').count()) === 4, 'NetAI muestra el entrenamiento del día y ya no tiene la pestaña Mover');
  await p.click('nav[aria-label=Secciones] button:nth-child(2)'); await p.waitForTimeout(400);
  ok((await p.textContent('main')).includes('84,6 kg'), 'el peso anotado en Fit aparece en NetAI');
  await p.click('nav[aria-label=Secciones] button:nth-child(1)'); await p.click('a:has-text("Entrenaste")'); await p.waitForURL('**/fit'); await p.waitForTimeout(400);
  ok(await p.isVisible('text=Ya entrenaste hoy'), 'desde NetAI se abre NetAI Fit');

  // Tratamiento por un trastorno alimentario indicado en NetAI: sin objetivo de bajar de peso ni registro de peso
  const q = await ctx.newPage();
  await q.goto(BASE + '/fit', { waitUntil: 'networkidle' });
  await q.evaluate(() => { localStorage.setItem('netai_profile_v1', JSON.stringify({ version: 1, name: 'Ana', age: '28', mode: 'bienestar', tca: 'si', viewMode: 'intuitivo', completedAt: 'x' })); localStorage.removeItem('netai_fit_profile_v1'); });
  await q.reload({ waitUntil: 'networkidle' }); await q.waitForTimeout(300);
  ok((await q.locator('[role=radio]:has-text("Bajar de peso")').count()) === 0 && await q.isVisible('[role=radio]:has-text("Moverme más")'), 'con tratamiento por TCA en NetAI no se ofrece "Bajar de peso"');
  await q.click('[role=radio]:has-text("Moverme más")'); await q.click('button:has-text("Armar mi plan")'); await q.click('nav button:has-text("Progreso")'); await q.waitForTimeout(300);
  ok((await q.locator('#fit-peso').count()) === 0, 'ni se pide el peso corporal');
  ok(errs.length === 0, 'sin errores ' + errs.join('|'));
  await b.close();
})();
