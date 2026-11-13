import { NextResponse } from 'next/server';
import {
  isAuthConfigured,
  matchAccessCode,
  createSessionToken,
  clientIp,
  isLockedOut,
  recordFailure,
  clearFailures,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';
import { sameOrigin, tooLarge } from '@/lib/gemini';

export async function POST(request) {
  try {
    if (!sameOrigin(request) || tooLarge(request, 2000)) {
      return NextResponse.json({ success: false, message: 'Pedido no permitido.' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== 'string' || password.length > 200) {
      return NextResponse.json({ success: false, message: 'Ingresá tu código de acceso.' }, { status: 400 });
    }

    if (!isAuthConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: 'El acceso todavía no está configurado. Quien administra la app tiene que definir APP_ACCESS_CODES y SESSION_SECRET en el servidor.',
        },
        { status: 503 }
      );
    }

    const ip = clientIp(request);
    if (isLockedOut(ip)) {
      return NextResponse.json(
        { success: false, message: 'Demasiados intentos. Esperá 15 minutos y probá de nuevo.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }

    const code = await matchAccessCode(password);
    if (!code) {
      recordFailure(ip);
      return NextResponse.json(
        { success: false, message: 'Código incorrecto. Revisalo o pedí uno nuevo a quien te dio el acceso.' },
        { status: 401 }
      );
    }

    clearFailures(ip);
    const response = NextResponse.json({ success: true, message: 'Acceso autorizado.' });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: await createSessionToken(code),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Error al verificar el acceso:', error);
    return NextResponse.json({ success: false, message: 'No pudimos verificar el acceso. Probá de nuevo.' }, { status: 500 });
  }
}
