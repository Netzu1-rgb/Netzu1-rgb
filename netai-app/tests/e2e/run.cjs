// Pruebas de navegador de NetAI.
// Compila la app, levanta el servidor y un Claude simulado, y corre cada archivo *.cjs de esta carpeta.
// Uso: npm run test:e2e           (todas)
//      npm run test:e2e -- foto   (solo las que contienen "foto")
const { spawn, spawnSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const PORT = 3210;
const AI_LOG = path.join(os.tmpdir(), `netai-ia-${process.pid}.jsonl`);
const NEXT = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');

// Claude simulado: responde un plato a las fotos y tres ideas a los pedidos de texto, con el formato de la API de Anthropic
function fakeClaude() {
  return http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
      const sent = JSON.parse(raw);
      // La app tiene que pedir el modelo económico, con esfuerzo bajo, respuesta con esquema y una credencial
      if (!req.url.startsWith('/v1/messages') || sent.model !== 'claude-haiku-5-5' || sent.output_config?.effort !== 'low' || sent.output_config?.format?.type !== 'json_schema' || !(req.headers['x-api-key'] || req.headers.authorization) || 'temperature' in sent) {
        return send(400, { type: 'error', error: { type: 'invalid_request_error', message: 'pedido distinto del esperado' } });
      }
      const parts = sent.messages[0].content;
      const img = parts.find((p) => p.type === 'image');
      const text = parts.find((p) => p.type === 'text').text;
      let answer;
      if (!img) {
        fs.appendFileSync(AI_LOG, JSON.stringify({ prompt: text }) + '\n');
        answer = { sugerencias: [
          { nombre: 'Tarta de verduras con ensalada', descripcion: 'Tarta de acelga y queso con ensalada de tomate.', kcal: 520, proteinas_g: 24, carbohidratos_g: 48, grasas_g: 24 },
          { nombre: 'Guiso de lentejas', descripcion: 'Lentejas con zapallo, zanahoria y arroz.', kcal: 560, proteinas_g: 28, carbohidratos_g: 80, grasas_g: 12 },
          { nombre: 'Omelette con vegetales', descripcion: 'Omelette de dos huevos con espinaca y pan integral.', kcal: 430, proteinas_g: 26, carbohidratos_g: 30, grasas_g: 22 },
        ] };
      } else {
        answer = { esComida: img.source.data.length >= 3000, nombre: 'Milanesa con puré y ensalada', porcion: '1 plato mediano', alimentos: ['milanesa', 'puré', 'ensalada'], kcal: 720, proteinas_g: 42, carbohidratos_g: 58, grasas_g: 34, plato: { vegetales: 25, proteinas: 40, cereales: 35 }, confianza: 'media', nota: 'La porción de puré es aproximada.' };
      }
      // Como el modelo real con razonamiento activado: primero un bloque de razonamiento vacío, después el texto
      send(200, { id: 'msg_prueba', type: 'message', role: 'assistant', model: sent.model, content: [{ type: 'thinking', thinking: '', signature: 'x' }, { type: 'text', text: JSON.stringify(answer) }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1300, output_tokens: 250 } });
    });
  });
}

const waitFor = async (url) => {
  for (let i = 0; i < 80; i++) {
    try { await fetch(url); return; } catch (e) { await new Promise((r) => setTimeout(r, 250)); }
  }
  throw new Error('El servidor no arrancó');
};

(async () => {
  const claude = fakeClaude();
  await new Promise((r) => claude.listen(0, '127.0.0.1', r));
  const AI_PORT = claude.address().port;
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    APP_ACCESS_CODES: 'familia-local, codigo-ana',
    SESSION_SECRET: 'clave-de-prueba-de-al-menos-32-caracteres',
    ANTHROPIC_API_KEY: 'clave-de-prueba',
    ANTHROPIC_BASE_URL: `http://127.0.0.1:${AI_PORT}`,
    PHOTO_ANALYSIS_PER_HOUR: '1000',
    NEXT_PUBLIC_REQUEST_ENDPOINT: 'https://formsubmit.co/ajax/prueba',
    NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
  };
  console.log('Compilando la app…');
  const build = spawnSync(process.execPath, [NEXT, 'build'], { cwd: ROOT, env, encoding: 'utf8' });
  if (build.status !== 0) { console.error(build.stdout, build.stderr); process.exit(1); }

  const server = spawn(process.execPath, [NEXT, 'start', '-p', String(PORT)], { cwd: ROOT, env, stdio: 'ignore' });
  let serverExited = false;
  server.on('exit', () => { serverExited = true; });
  const stop = () => { claude.close(); server.kill(); try { fs.unlinkSync(AI_LOG); } catch (e) { /* no existía */ } };
  let failed = 0;
  let passed = 0;
  try {
    await waitFor(`http://localhost:${PORT}/login`);
    await new Promise((r) => setTimeout(r, 500));
    if (serverExited) throw new Error(`No se pudo iniciar el servidor: ¿el puerto ${PORT} está ocupado?`);
    const filter = process.argv[2];
    const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.cjs') && f !== 'run.cjs' && (!filter || f.includes(filter))).sort();
    for (const file of files) {
      const args = file === 'accesibilidad.cjs' ? [['light'], ['dark']] : [[]];
      for (const extra of args) {
        // Asíncrono: el Claude simulado vive en este proceso y tiene que poder responder
        const r = await new Promise((resolve) => {
          const child = spawn(process.execPath, [path.join(__dirname, file), ...extra], { env: { ...env, BASE: `http://localhost:${PORT}`, AI_LOG } });
          let stdout = ''; let stderr = '';
          child.stdout.on('data', (d) => { stdout += d; });
          child.stderr.on('data', (d) => { stderr += d; });
          const timer = setTimeout(() => child.kill(), 240000);
          child.on('exit', (status) => { clearTimeout(timer); resolve({ status, stdout, stderr }); });
        });
        const lines = (r.stdout || '').split('\n');
        const ok = lines.filter((l) => l.startsWith('OK')).length;
        const bad = lines.filter((l) => l.startsWith('FALLA'));
        const crashed = r.status !== 0;
        passed += ok;
        failed += bad.length + (crashed ? 1 : 0);
        console.log(`${bad.length || crashed ? '✗' : '✓'} ${file}${extra.length ? ' (' + extra[0] + ')' : ''}: ${ok} correctas${bad.length ? ', ' + bad.length + ' fallas' : ''}`);
        bad.forEach((l) => console.log('    ' + l));
        if (crashed) console.log('    ' + (r.stderr || 'se cortó por tiempo').toString().split('\n').slice(0, 6).join('\n    '));
      }
    }
  } finally {
    stop();
  }
  console.log(`\n${passed} comprobaciones correctas, ${failed} con problemas.`);
  process.exit(failed ? 1 : 0);
})();
