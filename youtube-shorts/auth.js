// Ejecútalo UNA vez en tu ordenador para obtener el YT_REFRESH_TOKEN:
//   YT_CLIENT_ID=... YT_CLIENT_SECRET=... node auth.js
// En Google Cloud, el cliente OAuth debe ser de tipo "Aplicación de escritorio".
const http = require('http');

const { YT_CLIENT_ID, YT_CLIENT_SECRET } = process.env;
if (!YT_CLIENT_ID || !YT_CLIENT_SECRET) {
  console.error('Define YT_CLIENT_ID y YT_CLIENT_SECRET antes de ejecutar.');
  process.exit(1);
}
const PUERTO = 8080;
const REDIRECT = `http://localhost:${PUERTO}`;

const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
url.search = new URLSearchParams({
  client_id: YT_CLIENT_ID,
  redirect_uri: REDIRECT,
  response_type: 'code',
  scope: 'https://www.googleapis.com/auth/youtube.upload',
  access_type: 'offline',
  prompt: 'consent',
}).toString();

const servidor = http.createServer(async (req, res) => {
  const code = new URL(req.url, REDIRECT).searchParams.get('code');
  if (!code) { res.end('Sin código.'); return; }
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: YT_CLIENT_ID, client_secret: YT_CLIENT_SECRET,
      redirect_uri: REDIRECT, grant_type: 'authorization_code',
    }),
  });
  const json = await r.json();
  res.end('Listo. Vuelve a la terminal.');
  if (json.refresh_token) {
    console.log('\nYT_REFRESH_TOKEN =', json.refresh_token, '\nGuárdalo como secreto en GitHub. No lo subas al repo.');
  } else {
    console.error('No se recibió refresh_token:', json);
  }
  servidor.close();
});

servidor.listen(PUERTO, () => {
  console.log('Abre esta URL en el navegador e inicia sesión con tu canal:\n\n' + url.toString());
});
