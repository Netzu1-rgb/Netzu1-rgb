import { NextResponse } from 'next/server';
import { 
  getFamilyPassword, 
  isAuthConfigured,
  createSessionToken, 
  SESSION_COOKIE_NAME, 
  SESSION_MAX_AGE_SECONDS 
} from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Ingresá la contraseña familiar.' 
        },
        { status: 400 }
      );
    }

    if (!isAuthConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: 'El acceso todavía no está configurado. Quien administra la app tiene que definir APP_FAMILY_PASSWORD y SESSION_SECRET en el servidor.',
        },
        { status: 503 }
      );
    }

    const expectedPassword = getFamilyPassword();

    // Verificación segura en tiempo constante
    const inputBuf = Buffer.from(password.trim());
    const expectedBuf = Buffer.from(expectedPassword.trim());
    const isMatch = inputBuf.length === expectedBuf.length && 
      require('crypto').timingSafeEqual(inputBuf, expectedBuf);

    if (!isMatch) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Contraseña incorrecta. Pedísela a quien administra el acceso de tu familia.' 
        },
        { status: 401 }
      );
    }

    // Generar token criptográfico para 30 días
    const sessionToken = await createSessionToken();

    const response = NextResponse.json({
      success: true,
      message: 'Acceso autorizado. Redirigiendo a tu espacio de bienestar...',
    });

    // Guardar cookie HTTP-only persistente (30 días)
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en autenticación familiar:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ocurrió un error en el servidor al verificar el acceso.' 
      },
      { status: 500 }
    );
  }
}
