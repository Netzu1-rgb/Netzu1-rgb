# Lanzamiento de NetAI en internet

Lista de lo que necesita la app para publicarse, en orden. Primero la web (más rápido y barato), después las tiendas.

## Ya está hecho

| Qué | Dónde |
|---|---|
| Next.js 16 y React 19, `npm audit` sin vulnerabilidades | `netai-app/package.json` |
| `/app` protegida con contraseña (antes se abría sin ella) | `netai-app/src/proxy.js` |
| Sesiones firmadas con `SESSION_SECRET`; en producción no hay contraseña por defecto | `netai-app/src/lib/auth.js` |
| Íconos de la app en PNG (Android, iPhone y "maskable") y manifiesto completo | `netai-app/public/icons/`, `public/manifest.webmanifest` |
| Funciona sin conexión (service worker) | `netai-app/public/sw.js` |
| Imagen para compartir en WhatsApp y redes (1200 × 630) | `netai-app/public/og.png` |
| Política de privacidad y términos de uso (faltan tus datos) | `/privacidad` y `/terminos` |
| Zoom habilitado en el teléfono (accesibilidad) | `netai-app/src/app/layout.jsx` |
| Inicio local para probar | `netai-app/iniciar-local.sh` y `.bat` |

## Decisiones antes de lanzar

1. **Cómo entra una persona nueva.** Hoy la app pide una contraseña que comparte la familia. Sirve para una **beta cerrada** (vos repartís la contraseña), pero no para un lanzamiento abierto: alguien que llega desde un anuncio no la tiene. Opciones:
   - **Beta cerrada con contraseña:** funciona hoy.
   - **Acceso libre:** sin contraseña, como los datos quedan en el teléfono. Es un cambio chico.
   - **Cuentas con correo o con Google/Apple:** necesario para cobrar Plus y Pro y para las tiendas si hay pagos.
2. **No cobrar Plus ni Pro todavía.** El análisis por foto es una simulación (ver `conectar-gemini.md`) y no hay sistema de pagos ni cuentas. Lanzar con el plan Gratis y la beta, y abrir los planes pagos cuando la IA y los cobros funcionen de verdad.

## Fase 1: lanzamiento web

### Lo que necesito de vos
- [ ] **Logo e imágenes** de tus publicaciones (archivos). Con eso regenero los íconos, la imagen para compartir y la marca.
- [ ] **Datos legales:** nombre o razón social del responsable, correo de contacto, ciudad y país. Se completan en `netai-app/src/components/legal/LegalPage.jsx`. Conviene que un abogado revise los textos.
- [ ] **Correo de soporte y redes reales.** La landing de la app muestra `soporte@netai.app` y enlaces genéricos a Instagram, TikTok, X y GitHub que venían en el código original. Confirmá cuáles son tuyos.

### Pasos
1. **Dominio.** Por ejemplo, un `.com.ar` en NIC Argentina o un `.com` en cualquier registrador.
2. **Publicar la app en Vercel:**
   1. Crear cuenta en vercel.com con tu GitHub.
   2. *Add New → Project* y elegir el repo `Netzu1-rgb`.
   3. En *Root Directory* poner `netai-app`.
   4. En *Environment Variables* cargar:
      - `APP_FAMILY_PASSWORD`: la contraseña de la beta.
      - `SESSION_SECRET`: generala con `openssl rand -base64 32`.
      - `NEXT_PUBLIC_SITE_URL`: tu dominio, por ejemplo `https://netai.com.ar`.
   5. *Deploy*. Después, en *Settings → Domains*, conectar tu dominio.
3. **Publicar la web de presentación** (`netai-web/`) en Hostinger, o en el mismo dominio. En `netai-web/lib/manifest.js` poner la dirección de la app (`apps.netai.url`).
4. **Lista de espera:** crear un formulario en un servicio como Formspree y poner su dirección en `waitlistEndpoint`.
5. **Probar en teléfonos reales:** abrir el dominio en Android (Chrome) y en iPhone (Safari), instalar la app y usarla un día completo.
6. **Compartir el enlace** y revisar que la vista previa (imagen y texto) se vea bien en WhatsApp.

## Fase 2: tiendas (después de la web)

| | Google Play | App Store |
|---|---|---|
| Cuenta de desarrollador | Pago único de US$25 | US$99 por año |
| Cómo empaquetar la app | Como "Trusted Web Activity" a partir de la PWA (por ejemplo con PWABuilder). Requiere publicar un archivo `assetlinks.json` en tu dominio | Con Capacitor; hace falta una Mac con Xcode |
| Riesgo principal | Bajo, si la web funciona bien | Apple rechaza apps que son solo una web envuelta: hay que sumar funciones nativas (notificaciones, Apple Salud) |
| Cobros digitales | Facturación de Google Play | Compras dentro de la app de Apple (obligatorio para suscripciones) |

Material para las fichas de las dos tiendas:
- Capturas de pantalla del teléfono (puedo generarlas desde la app).
- Ícono en alta resolución y, para Google Play, una imagen destacada de 1024 × 500.
- Descripción corta y larga, categoría (Salud y bienestar) y clasificación por edad.
- Enlace a la política de privacidad.
- Formularios de privacidad: "Seguridad de los datos" en Google Play y "Etiquetas de privacidad" en Apple.

Antes de presentar, conviene revisar las políticas vigentes de cada tienda para apps de salud y nutrición, porque cambian seguido.
