# Lanzamiento de NetAI en internet

Lista para publicar NetAI, en orden. Primero la beta cerrada en la web; después, las tiendas. Actualizada para la versión 1.5.0.

## Ya está hecho

| Qué | Dónde |
|---|---|
| Next.js 16 y React 19, `npm audit` sin vulnerabilidades | `netai-app/package.json` |
| `/app` protegida con códigos de acceso (uno por persona o grupo), sesiones firmadas y bloqueo por intentos fallidos | `netai-app/src/lib/auth.js`, `src/proxy.js` |
| Cabeceras de seguridad, páginas de error, `robots` y `sitemap` | `netai-app/next.config.js`, `src/app/` |
| Página de inicio con planes y formulario para pedir acceso | `netai-app/src/app/page.jsx` |
| Recorrido inicial, modo Bienestar y Modo Sport | `src/components/onboarding/`, `src/lib/profile.js` |
| Foto del plato e "Ideas para hoy" con Claude (falta la clave) | `src/app/api/` |
| Favoritas, horarios, recordatorios, vista de Mes, informe y exportación | `src/app/app/page.jsx` |
| Tema oscuro, uso sin conexión, íconos, capturas y accesos directos | `public/sw.js`, `public/manifest.webmanifest` |
| Imagen para compartir en WhatsApp y redes (1200 × 630) | `netai-app/public/og.png` |
| Política de privacidad y términos de uso (faltan tus datos) | `/privacidad` y `/terminos` |
| Pruebas automáticas, también en GitHub | `netai-app/tests/`, `.github/workflows/netai-app.yml` |
| Web de presentación con solicitud de acceso | `netai-web/` |
| Capturas y textos para las tiendas | `publicidad-netai/tiendas/`, `ficha-tiendas.md` |

## Cómo funciona la beta cerrada

1. Una persona completa el formulario de la web o de la página de inicio.
2. La solicitud te llega por correo (FormSubmit).
3. Le respondés con el enlace de la app y un código de acceso (plantilla en `respuesta-a-solicitudes.md`). Podés usar un código por persona o por grupo.
4. Para dar de baja a alguien, quitás su código de `APP_ACCESS_CODES` en Vercel y volvés a publicar: sus sesiones se cierran.

Durante la beta no se cobra y todas las funciones están habilitadas. La app no tiene cuentas ni pagos; eso se decide antes del lanzamiento público (ver `estado-de-la-app.md`).

## Fase 1: beta en la web

### Lo que necesito de vos
- [ ] **Datos legales:** nombre o razón social del responsable, correo de contacto, ciudad y país. Se completan en `netai-app/src/components/legal/LegalPage.jsx`. Conviene que un abogado revise los textos.
- [ ] **Clave de Anthropic** (console.anthropic.com), con saldo cargado y un límite de gasto mensual. Pasos en `conectar-ia.md`.
- [ ] **Dominio.** Por ejemplo, un `.com.ar` en NIC Argentina o un `.com` en cualquier registrador.

### Pasos
1. **Publicar la app en Vercel:**
   1. Crear cuenta en vercel.com con tu GitHub.
   2. *Add New → Project* y elegir el repo `Netzu1-rgb`.
   3. En *Root Directory* poner `netai-app`.
   4. En *Environment Variables* cargar:
      - `APP_ACCESS_CODES`: los códigos, separados por coma. Que sean largos y difíciles de adivinar.
      - `SESSION_SECRET`: generala con `openssl rand -base64 32`.
      - `ANTHROPIC_API_KEY`: la clave de Anthropic.
      - `NEXT_PUBLIC_SITE_URL`: tu dominio, por ejemplo `https://netai.com.ar`.
      - `NEXT_PUBLIC_REQUEST_ENDPOINT`: la dirección de FormSubmit (ver paso 3).
   5. *Deploy*. Después, en *Settings → Domains*, conectar tu dominio.
2. **Probar la foto con la clave real:** registrar una comida con "Sacar foto del plato" y pedir "Ideas para hoy". Es la única parte que no se pudo probar contra el servicio real.
3. **Activar las solicitudes:** enviar una solicitud de prueba desde la web. FormSubmit manda un correo de activación; al confirmarlo te da un código alternativo. Conviene usar ese código en lugar del correo en `netai-web/lib/manifest.js` (`requestEndpoint`) y en `NEXT_PUBLIC_REQUEST_ENDPOINT`, para que la dirección no quede a la vista.
4. **Publicar la web de presentación** en Hostinger: completar `netai-web/lib/manifest.js` y subir el contenido de la carpeta a `public_html` (el archivo `netai-web-hostinger.zip` de la raíz del repo trae la versión actual lista para subir y descomprimir). En `netai-web/lib/manifest.js` poner la dirección de la app (`apps.netai.url`).
5. **Probar en teléfonos reales:** abrir el dominio en Android (Chrome) y en iPhone (Safari), instalar la app y usarla un día completo, con tema claro y oscuro.
6. **Compartir el enlace** y revisar que la vista previa (imagen y texto) se vea bien en WhatsApp.

Antes de cada publicación: `npm test` y `npm run test:e2e` en `netai-app`.

## Fase 2: tiendas (después de la beta)

| | Google Play | App Store |
|---|---|---|
| Cuenta de desarrollador | Pago único de US$25 | US$99 por año |
| Cómo empaquetar la app | Como "Trusted Web Activity" a partir de la PWA (por ejemplo con PWABuilder). Requiere publicar un archivo `assetlinks.json` en tu dominio | Con Capacitor; hace falta una Mac con Xcode |
| Riesgo principal | Bajo, si la web funciona bien | Apple rechaza apps que son solo una web envuelta: hay que sumar funciones nativas (notificaciones, Apple Salud) |
| Cobros digitales | Facturación de Google Play | Compras dentro de la app de Apple (obligatorio para suscripciones) |

Material listo: 12 capturas de 1080 × 1920 en `publicidad-netai/tiendas/`, logo en `publicidad-netai/marca/` textos en `ficha-tiendas.md` e imagen destacada de 1024 × 500 para Google Play en `publicidad-netai/tiendas/imagen-destacada-1024x500.png`.

Las tiendas piden que quien revisa pueda entrar: hay que darles un código de acceso de prueba, o abrir el acceso con cuentas antes de presentar.

Antes de presentar, conviene revisar las políticas vigentes de cada tienda para apps de salud y nutrición, porque cambian seguido.
