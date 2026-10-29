// Genera audio: narración con ElevenLabs y efectos (tic y campana) con ffmpeg.
// Requiere ELEVENLABS_API_KEY. Opcional: ELEVENLABS_VOICE_ID y ELEVENLABS_MODEL.
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const VOZ = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
const MODELO = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

// Las frases que se repiten en todos los vídeos se guardan aquí y no se vuelven a pedir.
const DIR_FIJAS = path.join(__dirname, 'voces-fijas');
let caracteresUsados = 0;

const hayVoz = () => Boolean(process.env.ELEVENLABS_API_KEY);
const usados = () => caracteresUsados;

async function narrar(texto, salida) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOZ}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: texto,
        model_id: MODELO,
        language_code: 'es',
        // Poca estabilidad y mucho estilo dan una lectura más enérgica.
        voice_settings: { stability: 0.35, similarity_boost: 0.8, style: 0.6, use_speaker_boost: true },
      }),
    }
  );
  if (res.status === 401) {
    throw new Error(
      'ElevenLabs rechazó la clave (401). Revisa el secreto ELEVENLABS_API_KEY: debe empezar por sk_ y tener 51 caracteres. ' +
        (await res.text())
    );
  }
  if (!res.ok) throw new Error(`ElevenLabs respondió ${res.status}: ${await res.text()}`);
  fs.writeFileSync(salida, Buffer.from(await res.arrayBuffer()));
  caracteresUsados += texto.length;
  return salida;
}

// Narra una frase fija reutilizando la grabación guardada si ya existe.
async function narrarFija(texto) {
  const clave = crypto.createHash('sha1').update(`${VOZ}|${MODELO}|${texto}`).digest('hex').slice(0, 16);
  const archivo = path.join(DIR_FIJAS, `${clave}.mp3`);
  if (!fs.existsSync(archivo)) {
    fs.mkdirSync(DIR_FIJAS, { recursive: true });
    await narrar(texto, archivo);
  }
  return archivo;
}

// Narra una escena compuesta de partes [{texto, fija}] y las une en un solo archivo.
async function narrarPartes(partes, salida) {
  const archivos = [];
  for (let i = 0; i < partes.length; i++) {
    const p = partes[i];
    archivos.push(p.fija ? await narrarFija(p.texto) : await narrar(p.texto, `${salida}.${i}.mp3`));
  }
  if (archivos.length === 1) {
    fs.copyFileSync(archivos[0], salida);
    return salida;
  }
  const entradas = archivos.flatMap((a) => ['-i', a]);
  const filtro = `${archivos.map((_, i) => `[${i}:a]`).join('')}concat=n=${archivos.length}:v=0:a=1`;
  ffmpeg([...entradas, '-filter_complex', filtro, '-c:a', 'libmp3lame', '-b:a', '128k', salida]);
  return salida;
}

// Caracteres que quedan en la suscripción, o null si la clave no tiene permiso para consultarlo.
async function saldo() {
  const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.character_limit - json.character_count;
}

function duracion(archivo) {
  return Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', archivo]).toString()
  );
}

const ffmpeg = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);

function crearEfectos(dir) {
  const tic = `${dir}/tic.wav`;
  const campana = `${dir}/campana.wav`;
  ffmpeg(['-f', 'lavfi', '-i', 'sine=f=1500:d=0.06', '-af', 'afade=t=out:st=0.02:d=0.04,volume=0.9', '-ar', '44100', '-ac', '2', tic]);
  ffmpeg([
    '-f', 'lavfi', '-i', 'sine=f=880:d=0.7', '-f', 'lavfi', '-i', 'sine=f=1320:d=0.7',
    '-filter_complex', '[0][1]amix=2:normalize=0,afade=t=out:st=0.05:d=0.65,volume=0.8',
    '-ar', '44100', '-ac', '2', campana,
  ]);
  return { tic, campana };
}

// Crea un WAV de duración exacta con el efecto al inicio y la voz 0,25 s después.
function pistaEscena({ voz, efecto, segundos }, salida) {
  const entradas = [];
  const filtros = [];
  if (efecto) { entradas.push('-i', efecto); filtros.push(`[${filtros.length}:a]aresample=44100,aformat=channel_layouts=stereo[e]`); }
  if (voz) { entradas.push('-i', voz); filtros.push(`[${filtros.length}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=250|250[v]`); }
  if (!entradas.length) {
    ffmpeg(['-f', 'lavfi', '-i', `anullsrc=r=44100:cl=stereo`, '-t', String(segundos), salida]);
    return salida;
  }
  const etiquetas = [efecto && '[e]', voz && '[v]'].filter(Boolean);
  const mezcla = etiquetas.length > 1 ? `${etiquetas.join('')}amix=${etiquetas.length}:normalize=0` : `${etiquetas[0]}anull`;
  ffmpeg([...entradas, '-filter_complex', `${filtros.join(';')};${mezcla},apad`, '-t', String(segundos), '-ar', '44100', '-ac', '2', salida]);
  return salida;
}

module.exports = { hayVoz, usados, narrarPartes, saldo, duracion, crearEfectos, pistaEscena };
