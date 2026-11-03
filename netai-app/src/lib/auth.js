// Web Crypto compatible session signer & verifier (Edge & Node.js on Vercel)

export const SESSION_COOKIE_NAME = 'netai_family_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 días persistente

const DEV_FALLBACK_PASSWORD = 'familia2026';

/**
 * Contraseña familiar configurada en Vercel.
 * En desarrollo, si falta, se usa una de prueba; en producción no hay contraseña por defecto.
 */
export function getFamilyPassword() {
  const configured = process.env.APP_FAMILY_PASSWORD;
  if (configured && configured.trim()) return configured;
  return process.env.NODE_ENV === 'production' ? null : DEV_FALLBACK_PASSWORD;
}

/**
 * Clave con la que se firman las sesiones: SESSION_SECRET más la contraseña,
 * así cambiar cualquiera de las dos cierra todas las sesiones abiertas.
 */
function getSigningSecret() {
  const password = getFamilyPassword();
  if (!password) return null;
  const sessionSecret = process.env.SESSION_SECRET || '';
  if (process.env.NODE_ENV === 'production' && sessionSecret.length < 32) return null;
  return `${sessionSecret}:${password}`;
}

/**
 * Indica si el acceso está bien configurado para este entorno
 */
export function isAuthConfigured() {
  return getSigningSecret() !== null;
}

/**
 * Deriva una clave criptográfica HMAC a partir de la contraseña
 */
async function getCryptoKey(secret) {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Convierte ArrayBuffer a string hexadecimal
 */
function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Crea un token de sesión criptográfico con duración de 30 días
 */
export async function createSessionToken() {
  const secret = getSigningSecret();
  if (!secret) throw new Error('El acceso no está configurado');
  const timestamp = Date.now().toString();
  const key = await getCryptoKey(secret);
  const enc = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(`netai-session:${timestamp}`));
  const signatureHex = bufferToHex(signatureBuffer);
  
  // Formato: v1.<timestamp>.<signature>
  return `v1.${timestamp}.${signatureHex}`;
}

/**
 * Valida si un token de sesión es legítimo y no ha expirado
 */
export async function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;

  const [, timestampStr, signatureHex] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Validar vigencia de 30 días
  const now = Date.now();
  const maxAgeMs = SESSION_MAX_AGE_SECONDS * 1000;
  if (now - timestamp > maxAgeMs || timestamp > now + 60000) {
    return false;
  }

  const secret = getSigningSecret();
  if (!secret) return false;
  const key = await getCryptoKey(secret);
  const enc = new TextEncoder();
  const expectedSigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(`netai-session:${timestampStr}`));
  const expectedSigHex = bufferToHex(expectedSigBuffer);

  // Comparación en tiempo constante para mitigar timing attacks
  if (expectedSigHex.length !== signatureHex.length) return false;
  let result = 0;
  for (let i = 0; i < expectedSigHex.length; i++) {
    result |= expectedSigHex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
  }
  return result === 0;
}
