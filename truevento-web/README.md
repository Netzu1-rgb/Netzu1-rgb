# TRUEVENTO · Página web (truevento.com)

Sitio estático (HTML + Tailwind por CDN + `js/main.js` con los textos en español, portugués e inglés). Publicado en Vercel, proyecto **truevento_kiteschool-v2** (equipo ntz6), sin repositorio conectado: se sube con la API o la CLI de Vercel.

Esta carpeta es la versión publicada (bajada de truevento.com el 26/11/2026) más la sección **App de alumnos** (`#app`, entre Cursos e Instructores, y "App" en el menú), con el enlace a la app (https://app.truevento.com) y al tutorial de instalación (https://app.truevento.com/instalar). Textos: claves `nav_app` y `app_*` en `js/main.js`.

- Video de portada: el original (`video_truevento.mp4`, 70 MB, fuera de git) ya viene blando y con bloques (exportado para redes). Se limpia (desbloqueo, menos ruido, nitidez, leve retoque de color) y se publica en 1080p para todos los equipos: `assets/video-hevc.mp4` (HEVC, 13,8 MB; iPhone, Mac y la mayoría de los navegadores) y `assets/video-h264.mp4` (H.264, 20,7 MB, respaldo). `assets/hero-poster.jpg` se ve mientras carga. Con el archivo original de la filmación (4K o sin exportar) se podría lograr bastante más nitidez.
- Fotos: redimensionadas (1280 px; equipo 640 px), con un retoque suave de contraste, color y nitidez (−37 % de peso). Los originales están en la versión publicada en Vercel.
- La sección de la app reemplaza al bloque de las 4 características (intercomunicadores, viento, agua plana, multilingüe), debajo de la portada.

Publicar esta sección junto con la app de alumnos: hasta que app.truevento.com funcione, los dos enlaces no abren nada.
