// Genera el siguiente Short (un reto de varias preguntas) y lo sube a YouTube.
// Sin credenciales de YouTube (o con DRY_RUN=1) solo genera el vídeo.
const fs = require('fs');
const path = require('path');
const { renderizar } = require('./render');
const { subirVideo } = require('./upload');

const POR_VIDEO = Number(process.env.PREGUNTAS_POR_VIDEO || 3);
const banco = require('./preguntas.json');
const rutaEstado = path.join(__dirname, 'estado.json');

async function main() {
  const estado = JSON.parse(fs.readFileSync(rutaEstado, 'utf8'));
  const inicio = estado.siguiente;
  const preguntas = banco.slice(inicio, inicio + POR_VIDEO);
  if (preguntas.length < POR_VIDEO) {
    console.log(`Quedan ${preguntas.length} preguntas sin usar y hacen falta ${POR_VIDEO}. Añade más en preguntas.json.`);
    process.exit(1);
  }
  const numeroVideo = Math.floor(inicio / POR_VIDEO);
  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const archivo = await renderizar(preguntas, numeroVideo, path.join(outDir, `reto-${numeroVideo + 1}.mp4`));
  console.log('Vídeo generado:', archivo);

  if (process.env.DRY_RUN === '1' || !process.env.YT_REFRESH_TOKEN) {
    console.log('Modo prueba: no se sube a YouTube.');
    return;
  }

  const soluciones = preguntas
    .map((q, i) => `${i + 1}. ${q.pregunta} → ${q.opciones[q.correcta]}`)
    .join('\n');
  const id = await subirVideo(archivo, {
    titulo: `¿Aciertas las ${POR_VIDEO}? Reto de cultura general #${numeroVideo + 1} #Shorts #quiz`,
    descripcion: `Reto de cultura general #${numeroVideo + 1}. ¿Cuántas aciertas?\n\nSoluciones:\n${soluciones}\n\nDéjame tu puntuación en los comentarios y sígueme para un reto nuevo cada día.\n\nVoz generada con IA (ElevenLabs).\n\n#Shorts #quiz #trivia #culturageneral #sabiasque`,
    tags: ['quiz', 'trivia', 'cultura general', 'preguntas', 'sabías que', 'reto', 'shorts'],
    privacidad: process.env.YT_PRIVACY || 'private',
  });
  console.log(`Subido: https://youtube.com/shorts/${id}`);

  estado.siguiente = inicio + POR_VIDEO;
  fs.writeFileSync(rutaEstado, JSON.stringify(estado, null, 2) + '\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
