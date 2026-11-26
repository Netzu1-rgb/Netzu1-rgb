# TRUEVENTO · Página web (truevento.com)

Sitio estático (HTML + Tailwind por CDN + `js/main.js` con los textos en español, portugués e inglés). Publicado en Vercel, proyecto **truevento_kiteschool-v2** (equipo ntz6), sin repositorio conectado: se sube con la API o la CLI de Vercel.

Esta carpeta es la versión publicada (bajada de truevento.com el 26/11/2026) más la sección **App de alumnos** (`#app`, entre Cursos e Instructores, y "App" en el menú), con el enlace a la app (https://app.truevento.com) y al tutorial de instalación (https://app.truevento.com/instalar). Textos: claves `nav_app` y `app_*` en `js/main.js`.

- Video de portada: un recorte de 9,8 s del original (`video_truevento.mp4`, 70 MB, 28 s, fuera de git) con las tomas más nítidas y sin el texto grabado: playa (0–6 s) y barcos y vegetación sobre la laguna (8–11,8 s). El original viene blando y con bloques (exportado para redes); se limpia (desbloqueo, menos ruido, nitidez, leve retoque de color). Al ser más corto, con el mismo peso lleva casi el triple de calidad por segundo: `assets/video-hevc.mp4` (HEVC, 12,8 MB; iPhone, Mac y la mayoría de los navegadores) y `assets/video-h264.mp4` (H.264, 18,8 MB, respaldo), 1080p en todos los equipos. `assets/hero-poster.jpg` es el primer cuadro y se ve mientras carga.
- Fotos: redimensionadas (1280 px; equipo 640 px), con un retoque suave de contraste, color y nitidez (−37 % de peso). Los originales están en la versión publicada en Vercel.
- La sección de la app reemplaza al bloque de las 4 características (intercomunicadores, viento, agua plana, multilingüe), debajo de la portada.

Publicar esta sección junto con la app de alumnos: hasta que app.truevento.com funcione, los dos enlaces no abren nada.
- Sin formulario de reserva: la sección Contacto invita a reservar en la app (pasos y botones), y los botones "Reservar" del menú y de cada curso abren la app. Quedan la ubicación, el WhatsApp, el email y el mapa.
