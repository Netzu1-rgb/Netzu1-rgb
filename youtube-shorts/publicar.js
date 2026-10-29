// Genera el siguiente Short (un reto de varias preguntas) y prepara el texto para YouTube.
// Si hay credenciales de YouTube (YT_REFRESH_TOKEN), además lo sube.
// Con DRY_RUN=1 solo genera el vídeo y no avanza estado.json.
const fs = require('fs');
const path = require('path');
const { renderizar } = require('./render');
const { subirVideo } = require('./upload');
const { hayVoz, usados, saldo } = require('./voz');

const POR_VIDEO = Number(process.env.PREGUNTAS_POR_VIDEO || 3);
const banco = require('./preguntas.json');
const rutaEstado = path.join(__dirname, 'estado.json');
// Avisar cuando el saldo de ElevenLabs alcance para menos de estos vídeos.
const VIDEOS_MINIMOS = 5;
// Caracteres por vídeo si aún no hay ninguna medición (las frases fijas ya grabadas no cuentan).
const CARACTERES_POR_VIDEO = 450;

function textos(preguntas, numeroVideo) {
  const soluciones = preguntas
    .map((q, i) => `${i + 1}. ${q.pregunta} → ${q.opciones[q.correcta]}`)
    .join('\n');
  return {
    titulo: `¿Aciertas las ${POR_VIDEO}? Reto de cultura general #${numeroVideo + 1} #Shorts #quiz`,
    descripcion: `Reto de cultura general #${numeroVideo + 1}. ¿Cuántas aciertas?\n\nSoluciones:\n${soluciones}\n\nDéjame tu puntuación en los comentarios y sígueme para un reto nuevo cada día.\n\nVoz generada con IA (ElevenLabs).\n\n#Shorts #quiz #trivia #culturageneral #sabiasque`,
    tags: ['quiz', 'trivia', 'cultura general', 'preguntas', 'sabías que', 'reto', 'shorts'],
  };
}

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

  const t = textos(preguntas, numeroVideo);
  fs.writeFileSync(
    path.join(outDir, 'texto.md'),
    `**Título** (cópialo en YouTube):\n\n\`\`\`\n${t.titulo}\n\`\`\`\n\n**Descripción:**\n\n\`\`\`\n${t.descripcion}\n\`\`\`\n`
  );
  const salidas = [`numero=${numeroVideo + 1}`, `archivo=${archivo}`];

  if (hayVoz()) {
    const restante = await saldo();
    const porVideo = Math.max(usados(), CARACTERES_POR_VIDEO);
    if (restante === null) {
      console.log('No se pudo consultar el saldo de ElevenLabs (la clave necesita el permiso "User: Read").');
    } else {
      const videos = Math.floor(restante / porVideo);
      console.log(`ElevenLabs: este vídeo usó ${usados()} caracteres; quedan ${restante} (unos ${videos} vídeos).`);
      if (videos < VIDEOS_MINIMOS) {
        salidas.push(`aviso=Quedan ${restante} caracteres en ElevenLabs, suficientes para unos ${videos} vídeos. Recarga o cambia de plan en https://elevenlabs.io/app/subscription`);
      }
    }
  }
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, salidas.join('\n') + '\n');

  if (process.env.DRY_RUN === '1') {
    console.log('Modo prueba: no se sube ni se avanza el estado.');
    return;
  }

  if (process.env.YT_REFRESH_TOKEN) {
    const id = await subirVideo(archivo, { ...t, privacidad: process.env.YT_PRIVACY || 'private' });
    console.log(`Subido: https://youtube.com/shorts/${id}`);
  }

  estado.siguiente = inicio + POR_VIDEO;
  fs.writeFileSync(rutaEstado, JSON.stringify(estado, null, 2) + '\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
