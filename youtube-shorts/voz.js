// Genera audio: narración con ElevenLabs y efectos (tic y campana) con ffmpeg.
// Requiere ELEVENLABS_API_KEY. Opcional: ELEVENLABS_VOICE_ID y ELEVENLABS_MODEL.
const { execFileSync } = require('child_process');
const fs = require('fs');

const VOZ = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
const MODELO = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

const hayVoz = () => Boolean(process.env.ELEVENLABS_API_KEY);

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
  if (!res.ok) throw new Error(`ElevenLabs respondió ${res.status}: ${await res.text()}`);
  fs.writeFileSync(salida, Buffer.from(await res.arrayBuffer()));
  return salida;
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

module.exports = { hayVoz, narrar, duracion, crearEfectos, pistaEscena };
