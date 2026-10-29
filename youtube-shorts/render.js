// Renderiza un Short vertical (1080x1920) con varias preguntas:
// gancho -> (pregunta -> cuenta atrás -> respuesta) x N -> cierre.
// La duración de cada escena se ajusta a la narración de ElevenLabs.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { hayVoz, narrar, duracion, crearEfectos, pistaEscena } = require('./voz');

const ANCHO = 1080;
const ALTO = 1920;
const CUENTA_ATRAS = 3;
const GANCHOS = [
  '¡Tres preguntas! Casi nadie acierta las tres. ¿Y tú?',
  '¿Eres más listo que la mayoría? ¡Demuéstralo con estas tres preguntas!',
  '¡Reto de cultura general! Tres preguntas, tres segundos cada una. ¡Vamos!',
  'Si aciertas las tres, eres un genio. ¡Empezamos!',
];
const ORDINALES = ['Primera', 'Segunda', 'Tercera', 'Cuarta', 'Quinta'];
const LETRAS = ['A', 'B', 'C', 'D'];

const escapar = (t) =>
  String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function pagina(cuerpo) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin: 0; }
    body { width: ${ANCHO}px; height: ${ALTO}px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(160deg, #1b1446 0%, #3a1c71 50%, #d76d77 100%); color: #fff;
      display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 90px; gap: 50px; text-align: center; }
    .gancho { font-size: 92px; font-weight: 900; line-height: 1.1; text-transform: uppercase; }
    .etiqueta { font-size: 44px; font-weight: 700; padding: 14px 40px; border-radius: 999px; background: #ffd200; color: #1b1446; }
    .pregunta { font-size: 72px; font-weight: 800; line-height: 1.15; }
    .opciones { width: 100%; display: flex; flex-direction: column; gap: 28px; }
    .op { display: flex; align-items: center; gap: 30px; font-size: 56px; font-weight: 700; text-align: left;
      padding: 30px 40px; border-radius: 28px; background: rgba(255,255,255,0.14); border: 4px solid rgba(255,255,255,0.3); }
    .op b { display: inline-flex; align-items: center; justify-content: center; flex: none;
      width: 84px; height: 84px; border-radius: 50%; background: #fff; color: #3a1c71; }
    .op.ok { background: #19b36b; border-color: #b8ffd9; }
    .op.mal { opacity: 0.35; }
    .cuenta { font-size: 150px; font-weight: 900; color: #ffd200; }
    .barra { width: 100%; height: 22px; border-radius: 11px; background: rgba(255,255,255,0.2); overflow: hidden; }
    .barra div { height: 100%; background: #ffd200; }
    .dato { font-size: 50px; font-weight: 600; line-height: 1.3; background: rgba(0,0,0,0.25); padding: 36px 44px; border-radius: 28px; }
    .cta { font-size: 46px; font-weight: 700; opacity: 0.9; }
  </style></head><body>${cuerpo}</body></html>`;
}

function opciones(q, revelar) {
  return `<div class="opciones">${q.opciones
    .map((o, i) => {
      const clase = revelar ? (i === q.correcta ? 'ok' : 'mal') : '';
      return `<div class="op ${clase}"><b>${LETRAS[i]}</b>${escapar(o)}</div>`;
    })
    .join('')}</div>`;
}

// Escenas del Short: {html, voz (texto a narrar), efecto ('tic'|'campana'), minimo (segundos)}.
function escenas(preguntas, numeroVideo) {
  const total = preguntas.length;
  const lista = [{
    minimo: 2.5,
    voz: GANCHOS[numeroVideo % GANCHOS.length],
    html: pagina(`<div class="etiqueta">Reto #${numeroVideo + 1}</div>
      <div class="gancho">${total} preguntas.<br>¿Las aciertas todas?</div>`),
  }];

  preguntas.forEach((q, n) => {
    const etiqueta = `<div class="etiqueta">Pregunta ${n + 1}/${total}</div>`;
    lista.push({
      minimo: 2,
      voz: `${ORDINALES[n] || 'Siguiente'} pregunta. ${q.pregunta}`,
      html: pagina(`${etiqueta}<div class="pregunta">${escapar(q.pregunta)}</div>${opciones(q, false)}
        <div class="cuenta">&nbsp;</div><div class="barra"><div style="width:100%"></div></div>`),
    });
    for (let s = CUENTA_ATRAS; s >= 1; s--) {
      lista.push({
        minimo: 1,
        efecto: 'tic',
        html: pagina(`${etiqueta}<div class="pregunta">${escapar(q.pregunta)}</div>${opciones(q, false)}
          <div class="cuenta">${s}</div>
          <div class="barra"><div style="width:${((s - 1) / CUENTA_ATRAS) * 100}%"></div></div>`),
      });
    }
    lista.push({
      minimo: 3,
      efecto: 'campana',
      voz: `¡La respuesta es ${q.opciones[q.correcta]}! ${q.dato}`,
      html: pagina(`${etiqueta}<div class="pregunta">${escapar(q.pregunta)}</div>${opciones(q, true)}
        <div class="dato">${escapar(q.dato)}</div>`),
    });
  });

  lista.push({
    minimo: 2.5,
    voz: '¿Cuántas acertaste? ¡Dímelo en los comentarios y sígueme para un reto nuevo cada día!',
    html: pagina(`<div class="gancho">¿Cuántas acertaste?</div>
      <div class="cta">Escríbelo en comentarios<br>y sígueme para más retos</div>`),
  });
  return lista;
}

async function renderizar(preguntas, numeroVideo, salida) {
  const tmp = fs.mkdtempSync(path.join(path.dirname(salida), '.frames-'));
  const lista = escenas(preguntas, numeroVideo);
  const efectos = crearEfectos(tmp);
  const conVoz = hayVoz();
  if (!conVoz) console.warn('Sin ELEVENLABS_API_KEY: el vídeo saldrá sin narración, solo con efectos.');

  // 1. Narración y duración de cada escena.
  for (let i = 0; i < lista.length; i++) {
    const e = lista[i];
    e.segundos = e.minimo;
    if (conVoz && e.voz) {
      e.archivoVoz = await narrar(e.voz, path.join(tmp, `voz${i}.mp3`));
      e.segundos = Math.max(e.minimo, Math.ceil((duracion(e.archivoVoz) + 0.6) * 10) / 10);
    }
  }

  // 2. Imágenes de cada escena.
  const navegador = await chromium.launch();
  try {
    const page = await navegador.newPage({ viewport: { width: ANCHO, height: ALTO } });
    for (let i = 0; i < lista.length; i++) {
      await page.setContent(lista[i].html);
      await page.screenshot({ path: path.join(tmp, `f${i}.png`) });
    }
  } finally {
    await navegador.close();
  }

  // 3. Pista de audio: una por escena y luego concatenadas.
  const pistas = lista.map((e, i) =>
    pistaEscena({ voz: e.archivoVoz, efecto: e.efecto && efectos[e.efecto], segundos: e.segundos }, path.join(tmp, `a${i}.wav`))
  );
  fs.writeFileSync(path.join(tmp, 'audio.txt'), pistas.map((p) => `file '${path.basename(p)}'`).join('\n') + '\n');

  // El demuxer concat de ffmpeg necesita repetir la última imagen al final.
  const concat = lista.map((e, i) => `file 'f${i}.png'\nduration ${e.segundos}`).join('\n') + `\nfile 'f${lista.length - 1}.png'\n`;
  fs.writeFileSync(path.join(tmp, 'lista.txt'), concat);
  const total = lista.reduce((s, e) => s + e.segundos, 0);

  // Música de fondo opcional, bajita para no tapar la voz.
  const musica = path.join(__dirname, 'musica.mp3');
  const conMusica = fs.existsSync(musica);
  const entradaMusica = conMusica ? ['-stream_loop', '-1', '-i', musica] : [];
  const filtroAudio = conMusica
    ? '[1:a]aresample=44100[voz];[2:a]volume=0.12,aresample=44100[mus];[voz][mus]amix=2:duration=first:normalize=0[a]'
    : '[1:a]anull[a]';

  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'lista.txt'),
    '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'audio.txt'),
    ...entradaMusica,
    '-filter_complex', filtroAudio,
    '-map', '0:v', '-map', '[a]',
    '-vf', 'fps=30,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-c:a', 'aac', '-b:a', '160k',
    '-t', String(total),
    '-movflags', '+faststart',
    salida,
  ]);
  fs.rmSync(tmp, { recursive: true, force: true });
  return salida;
}

module.exports = { renderizar };

// Uso directo: node render.js [numeroVideo]  (usa 3 preguntas a partir de numeroVideo*3)
if (require.main === module) {
  const banco = require('./preguntas.json');
  const numero = Number(process.argv[2] || 0);
  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  renderizar(banco.slice(numero * 3, numero * 3 + 3), numero, path.join(outDir, `reto-${numero + 1}.mp4`))
    .then((f) => console.log('Vídeo generado:', f))
    .catch((e) => { console.error(e); process.exit(1); });
}
