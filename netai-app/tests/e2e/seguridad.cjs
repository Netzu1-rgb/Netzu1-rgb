// Seguridad: acceso, sesiones, cabeceras y abuso de la API. No usa navegador.
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:3210';
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALLA') + ' ' + m);
const post = (url, body, headers = {}) => fetch(BASE + url, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const login = async (code, ip) => { const r = await post('/api/auth/login', { password: code }, { 'x-forwarded-for': ip }); return { r, cookie: (r.headers.get('set-cookie') || '').split(';')[0], raw: r.headers.get('set-cookie') || '' }; };
(async () => {
  // Zona privada
  let r = await fetch(BASE + '/app', { redirect: 'manual' });
  ok(r.status >= 300 && r.status < 400 && (r.headers.get('location') || '').includes('/login'), 'sin sesión, /app manda al ingreso');
  r = await fetch(BASE + '/app', { redirect: 'manual', headers: { cookie: 'netai_family_session=v2.aaaaaaaaaaaa.' + Date.now() + '.' + 'f'.repeat(64) } });
  ok(r.status >= 300 && r.status < 400, 'una sesión inventada no entra');

  const good = await login('familia-local', '10.1.0.1');
  ok(good.r.status === 200 && /HttpOnly/i.test(good.raw) && /SameSite=lax/i.test(good.raw) && /Secure/i.test(good.raw), 'la sesión se guarda en una cookie HttpOnly, Secure y SameSite');
  r = await fetch(BASE + '/app', { redirect: 'manual', headers: { cookie: good.cookie } });
  ok(r.status === 200, 'con el código correcto se entra');
  const parts = good.cookie.split('=')[1].split('.');
  const tampered = `netai_family_session=${parts[0]}.${parts[1]}.${Number(parts[2]) + 5000}.${parts[3]}`;
  r = await fetch(BASE + '/app', { redirect: 'manual', headers: { cookie: tampered } });
  ok(r.status >= 300 && r.status < 400, 'una sesión alterada (otra fecha, misma firma) no entra');
  const flipped = `netai_family_session=${parts[0]}.${parts[1]}.${parts[2]}.${parts[3].slice(0, -1)}${parts[3].endsWith('0') ? '1' : '0'}`;
  r = await fetch(BASE + '/app', { redirect: 'manual', headers: { cookie: flipped } });
  ok(r.status >= 300 && r.status < 400, 'una firma con un carácter cambiado no entra');

  // Cabeceras
  r = await fetch(BASE + '/app', { headers: { cookie: good.cookie } });
  const h = (k) => r.headers.get(k) || '';
  ok(h('content-security-policy').includes("frame-ancestors 'none'") && h('x-frame-options') === 'DENY', 'la app no se puede incrustar en otro sitio');
  ok(h('strict-transport-security').includes('max-age') && h('x-content-type-options') === 'nosniff' && h('referrer-policy') && h('cross-origin-opener-policy') === 'same-origin', 'cabeceras de seguridad presentes');
  ok(!r.headers.get('x-powered-by'), 'no se anuncia la tecnología del servidor');

  // API
  r = await post('/api/analizar-plato', { image: 'x', mimeType: 'image/jpeg' });
  ok(r.status === 401, 'la foto no se analiza sin sesión');
  r = await post('/api/sugerir-comidas', { moment: 'cena' });
  ok(r.status === 401, 'las sugerencias no se dan sin sesión');
  r = await post('/api/analizar-plato', { image: 'x', mimeType: 'image/jpeg' }, { cookie: good.cookie, origin: 'https://sitio-ajeno.example' });
  ok(r.status === 403, 'un pedido desde otro sitio se rechaza aunque lleve la sesión');
  r = await post('/api/auth/login', { password: 'familia-local' }, { origin: 'https://sitio-ajeno.example', 'x-forwarded-for': '10.1.0.2' });
  ok(r.status === 403, 'el ingreso desde otro sitio se rechaza');
  r = await post('/api/analizar-plato', { image: 'x', mimeType: 'text/html' }, { cookie: good.cookie });
  ok(r.status === 400, 'solo se aceptan imágenes');
  r = await post('/api/analizar-plato', JSON.stringify({ image: 'A'.repeat(6_500_000), mimeType: 'image/jpeg' }), { cookie: good.cookie });
  ok(r.status === 413, 'una foto enorme se corta antes de procesarla');
  r = await post('/api/analizar-plato', '{"image":', { cookie: good.cookie });
  ok(r.status === 400, 'un pedido mal formado responde con un error claro');
  const img = fs.readFileSync(path.join(__dirname, 'fixtures', 'plato.jpg')).toString('base64');
  r = await post('/api/analizar-plato', { image: img, mimeType: 'image/jpeg' }, { cookie: good.cookie });
  ok(r.status === 200 && (r.headers.get('cache-control') || '').includes('no-store'), 'con sesión la foto se analiza y la respuesta no se guarda en cachés');
  r = await post('/api/auth/login', { password: 'x'.repeat(5000) }, { 'x-forwarded-for': '10.1.0.3' });
  ok(r.status === 403 || r.status === 400, 'un código absurdamente largo se rechaza');
  r = await post('/api/auth/login', { password: { $ne: '' } }, { 'x-forwarded-for': '10.1.0.3' });
  ok(r.status === 400, 'un código que no es texto se rechaza');

  // Prueba masiva de códigos
  let last;
  for (let i = 0; i < 8; i++) last = await login('adivinando-' + i, '10.9.9.9');
  ok(last.r.status === 401, 'los primeros intentos fallidos responden "incorrecto"');
  const locked = await login('familia-local', '10.9.9.9');
  ok(locked.r.status === 429 && locked.r.headers.get('retry-after'), 'después de 8 intentos fallidos esa conexión queda bloqueada, incluso con el código correcto');
  const other = await login('codigo-ana', '10.9.9.10');
  ok(other.r.status === 200, 'el bloqueo no afecta a las demás conexiones');

  // Cerrar sesión
  r = await post('/api/auth/logout', {}, { cookie: good.cookie });
  ok(/netai_family_session=;|Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(r.headers.get('set-cookie') || ''), 'cerrar sesión borra la cookie');
})().catch((e) => { console.log('FALLA error inesperado ' + e.message); process.exit(1); });
