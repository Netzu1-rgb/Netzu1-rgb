// Acceso con códigos y sesiones firmadas (Web Crypto: funciona en Edge y en Node.js).
//
// - APP_ACCESS_CODES: uno o varios códigos separados por coma o salto de línea.
//   Cada persona o grupo puede tener el suyo; quitar un código de la lista cierra sus sesiones.
// - APP_FAMILY_PASSWORD: nombre anterior, se sigue aceptando como un código más.
// - SESSION_SECRET: clave para firmar las sesiones (mínimo 32 caracteres en producción).

export const SESSION_COOKIE_NAME = 'netai_family_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 días

const DEV_FALLBACK_CODE = 'familia2026';
const enc = new TextEncoder();

/** Lista de códigos válidos. En producción no hay ninguno por defecto. */
export function getAccessCodes() {
  const raw = [process.env.APP_ACCESS_CODES, process.env.APP_FAMILY_PASSWORD].filter(Boolean).join('\n');
  const codes = [...new Set(raw.split(/[\n,]/).map((c) => c.trim()).filter(Boolean))];
  if (codes.length) return codes;
  return process.env.NODE_ENV === 'production' ? [] : [DEV_FALLBACK_CODE];
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || '';
  if (process.env.NODE_ENV === 'production' && secret.length < 32) return null;
  return secret || 'solo-para-desarrollo';
}

/** Indica si el acceso está bien configurado para este entorno */
export function isAuthConfigured() {
  return getSessionSecret() !== null && getAccessCodes().length > 0;
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Comparación en tiempo constante
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Identificador corto de un código: va dentro de la sesión para saber con cuál se entró
const codeIdOf = async (secret, code) => (await hmacHex(secret, `code-id:${code}`)).slice(0, 12);

/**
 * Devuelve el código que coincide con lo que escribió la persona, o null.
 * Se comparan resúmenes HMAC para no filtrar el largo ni el contenido por tiempo de respuesta.
 */
export async function matchAccessCode(input) {
  const secret = getSessionSecret();
  if (!secret || typeof input !== 'string') return null;
  const given = await hmacHex(secret, `code:${input.trim()}`);
  let found = null;
  for (const code of getAccessCodes()) {
    if (safeEqual(given, await hmacHex(secret, `code:${code}`))) found = code;
  }
  return found;
}

/** Crea la sesión (30 días). Formato: v2.<idDelCódigo>.<fecha>.<firma> */
export async function createSessionToken(code) {
  const secret = getSessionSecret();
  if (!secret || !code) throw new Error('El acceso no está configurado');
  const codeId = await codeIdOf(secret, code);
  const timestamp = Date.now().toString();
  const signature = await hmacHex(`${secret}:${code}`, `netai-session:${codeId}:${timestamp}`);
  return `v2.${codeId}.${timestamp}.${signature}`;
}

/** Valida la sesión: firma correcta, no vencida y de un código que sigue vigente */
export async function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'v2') return false;
  const [, codeId, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  const now = Date.now();
  if (now - timestamp > SESSION_MAX_AGE_SECONDS * 1000 || timestamp > now + 60000) return false;

  const secret = getSessionSecret();
  if (!secret) return false;
  for (const code of getAccessCodes()) {
    if (!safeEqual(codeId, await codeIdOf(secret, code))) continue;
    const expected = await hmacHex(`${secret}:${code}`, `netai-session:${codeId}:${timestampStr}`);
    return safeEqual(expected, signature);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Límite de intentos fallidos por conexión (en memoria, por instancia del servidor).
// Frena la prueba masiva de códigos; no reemplaza un código largo y difícil de adivinar.
// ---------------------------------------------------------------------------
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;
const fails = new Map();

export function clientIp(request) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
}

export function isLockedOut(ip, now = Date.now()) {
  const list = (fails.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length) fails.set(ip, list); else fails.delete(ip);
  return list.length >= MAX_FAILS;
}

export function recordFailure(ip, now = Date.now()) {
  const list = (fails.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  fails.set(ip, list);
  if (fails.size > 5000) fails.delete(fails.keys().next().value); // tope de memoria
}

export function clearFailures(ip) {
  fails.delete(ip);
}
