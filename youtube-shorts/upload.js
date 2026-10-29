// Sube un vídeo a YouTube con la YouTube Data API v3 (subida reanudable).
// Requiere YT_CLIENT_ID, YT_CLIENT_SECRET y YT_REFRESH_TOKEN (ver auth.js).
const fs = require('fs');

async function tokenDeAcceso() {
  const { YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN } = process.env;
  if (!YT_CLIENT_ID || !YT_CLIENT_SECRET || !YT_REFRESH_TOKEN) {
    throw new Error('Faltan YT_CLIENT_ID, YT_CLIENT_SECRET o YT_REFRESH_TOKEN');
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: YT_CLIENT_ID,
      client_secret: YT_CLIENT_SECRET,
      refresh_token: YT_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Error al obtener token: ${JSON.stringify(json)}`);
  return json.access_token;
}

async function subirVideo(archivo, { titulo, descripcion, tags, privacidad = 'private' }) {
  const token = await tokenDeAcceso();
  const tamano = fs.statSync(archivo).size;

  const inicio = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': String(tamano),
      },
      body: JSON.stringify({
        snippet: { title: titulo.slice(0, 100), description: descripcion, tags, categoryId: '27', defaultLanguage: 'es' },
        status: { privacyStatus: privacidad, selfDeclaredMadeForKids: false },
      }),
    }
  );
  if (!inicio.ok) throw new Error(`Error al iniciar la subida: ${await inicio.text()}`);
  const urlSubida = inicio.headers.get('location');

  const subida = await fetch(urlSubida, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(tamano) },
    body: fs.readFileSync(archivo),
  });
  const json = await subida.json();
  if (!subida.ok) throw new Error(`Error al subir el vídeo: ${JSON.stringify(json)}`);
  return json.id;
}

module.exports = { subirVideo };
