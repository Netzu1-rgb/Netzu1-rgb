// Renderiza un Short vertical (1080x1920) a partir de una pregunta:
// gancho -> pregunta con cuenta atrás -> respuesta con dato curioso.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ANCHO = 1080;
const ALTO = 1920;
const GANCHOS = [
  'Solo el 10% acierta esta',
  '¿Lo sabes en 5 segundos?',
  'Casi nadie acierta esta pregunta',
  'Pon a prueba tu cultura general',
];
const LETRAS = ['A', 'B', 'C', 'D'];

const escapar = (t) =>
  String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function pagina(cuerpo) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin: 0; }
    body { width: ${ANCHO}px; height: ${ALTO}px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(160deg, #1b1446 0%, #3a1c71 50%, #d76d77 100%); color: #fff;
      display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 90px; gap: 50px; text-align: center; }
    .gancho { font-size: 96px; font-weight: 900; line-height: 1.1; text-transform: uppercase; }
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

// Devuelve la lista de escenas [{html, segundos}] del Short.
function escenas(q, indice) {
  const lista = [
    {
      segundos: 2,
      html: pagina(`<div class="etiqueta">Pregunta #${indice + 1}</div>
        <div class="gancho">${escapar(GANCHOS[indice % GANCHOS.length])}</div>`),
    },
  ];
  for (let n = 5; n >= 1; n--) {
    lista.push({
      segundos: 1,
      html: pagina(`<div class="pregunta">${escapar(q.pregunta)}</div>${opciones(q, false)}
        <div class="cuenta">${n}</div>
        <div class="barra"><div style="width:${(n / 5) * 100}%"></div></div>`),
    });
  }
  lista.push({
    segundos: 4,
    html: pagina(`<div class="pregunta">${escapar(q.pregunta)}</div>${opciones(q, true)}
      <div class="dato">${escapar(q.dato)}</div>
      <div class="cta">¿Acertaste? Dímelo en comentarios</div>`),
  });
  return lista;
}

async function renderizar(q, indice, salida) {
  const tmp = fs.mkdtempSync(path.join(path.dirname(salida), '.frames-'));
  const lista = escenas(q, indice);
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

  // El demuxer concat de ffmpeg necesita repetir la última imagen al final.
  const concat = lista.map((e, i) => `file 'f${i}.png'\nduration ${e.segundos}`).join('\n') + `\nfile 'f${lista.length - 1}.png'\n`;
  fs.writeFileSync(path.join(tmp, 'lista.txt'), concat);
  const total = lista.reduce((s, e) => s + e.segundos, 0);

  const musica = path.join(__dirname, 'musica.mp3');
  const audio = fs.existsSync(musica)
    ? ['-stream_loop', '-1', '-i', musica]
    : ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo'];
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'lista.txt'),
    ...audio,
    '-map', '0:v', '-map', '1:a',
    '-vf', 'fps=30,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-c:a', 'aac', '-b:a', '128k',
    '-t', String(total),
    '-movflags', '+faststart',
    salida,
  ]);
  fs.rmSync(tmp, { recursive: true, force: true });
  return salida;
}

module.exports = { renderizar };

// Uso directo: node render.js [indice]
if (require.main === module) {
  const preguntas = require('./preguntas.json');
  const indice = Number(process.argv[2] || 0);
  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  renderizar(preguntas[indice], indice, path.join(outDir, `short-${indice + 1}.mp4`))
    .then((f) => console.log('Vídeo generado:', f))
    .catch((e) => { console.error(e); process.exit(1); });
}
