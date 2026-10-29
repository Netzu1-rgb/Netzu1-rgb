// Genera el siguiente Short de la lista y lo sube a YouTube.
// Sin credenciales (o con DRY_RUN=1) solo genera el vídeo.
const fs = require('fs');
const path = require('path');
const { renderizar } = require('./render');
const { subirVideo } = require('./upload');

const preguntas = require('./preguntas.json');
const rutaEstado = path.join(__dirname, 'estado.json');

async function main() {
  const estado = JSON.parse(fs.readFileSync(rutaEstado, 'utf8'));
  const indice = estado.siguiente;
  if (indice >= preguntas.length) {
    console.log('No quedan preguntas nuevas. Añade más en preguntas.json.');
    return;
  }
  const q = preguntas[indice];
  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const archivo = await renderizar(q, indice, path.join(outDir, `short-${indice + 1}.mp4`));
  console.log('Vídeo generado:', archivo);

  if (process.env.DRY_RUN === '1' || !process.env.YT_REFRESH_TOKEN) {
    console.log('Modo prueba: no se sube a YouTube.');
    return;
  }

  const id = await subirVideo(archivo, {
    titulo: `${q.pregunta} #Shorts #quiz`,
    descripcion: `${q.pregunta}\n\nRespuesta: ${q.opciones[q.correcta]}. ${q.dato}\n\n¿Acertaste? Déjalo en los comentarios y sígueme para una pregunta nueva cada día.\n\n#Shorts #quiz #trivia #culturageneral #sabiasque`,
    tags: ['quiz', 'trivia', 'cultura general', 'preguntas', 'sabías que', 'shorts'],
    privacidad: process.env.YT_PRIVACY || 'private',
  });
  console.log(`Subido: https://youtube.com/shorts/${id}`);

  estado.siguiente = indice + 1;
  fs.writeFileSync(rutaEstado, JSON.stringify(estado, null, 2) + '\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
