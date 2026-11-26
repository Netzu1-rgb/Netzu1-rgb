# TRUEVENTO · Página web (truevento.com)

Sitio estático (HTML + Tailwind por CDN + `js/main.js` con los textos en español, portugués e inglés). Publicado en Vercel, proyecto **truevento_kiteschool-v2** (equipo ntz6), sin repositorio conectado: se sube con la API o la CLI de Vercel.

Esta carpeta es la versión publicada (bajada de truevento.com el 26/11/2026) más:

- **App de alumnos** (`#app`, debajo del video, y "App" en el menú): dos botones, iPhone y Android, que bajan a la guía de instalación con ese celular ya elegido. Textos: `nav_app` y `app_*` en `js/main.js`.
- **Guía de instalación** (`#instalar`, `js/tutorial.js`): al deslizar hacia abajo, el teléfono de un lado cambia de pantalla y del otro se explica cada paso (5 pasos en iPhone y 5 en Android, en es/pt/en). En celular el teléfono queda fijo arriba y los pasos pasan por debajo. Al final están los enlaces a la app (https://app.truevento.com) y al tutorial para compartir (https://app.truevento.com/instalar). Imágenes: `assets/tut-*.jpg` y `assets/app-icon.png`. Estilos: `.tm-*` y `.os-btn` en `css/style.css`.
- **Contacto** (`#contact`): solo la información directa y el mapa; las reservas se hacen en la app.

- Video de portada: un recorte de 9,8 s del original (`video_truevento.mp4`, 70 MB, 28 s, fuera de git) con las tomas más nítidas y sin el texto grabado: playa (0–6 s) y barcos y vegetación sobre la laguna (8–11,8 s). El original viene blando y con bloques (exportado para redes); se limpia (desbloqueo, menos ruido, nitidez, leve retoque de color). Al ser más corto, con el mismo peso lleva casi el triple de calidad por segundo: `assets/video-hevc.mp4` (HEVC, 12,8 MB; iPhone, Mac y la mayoría de los navegadores) y `assets/video-h264.mp4` (H.264, 18,8 MB, respaldo), 1080p en todos los equipos. `assets/hero-poster.jpg` es el primer cuadro y se ve mientras carga.
- Fotos: redimensionadas (1280 px; equipo 640 px), con un retoque suave de contraste, color y nitidez (−37 % de peso). Los originales están en la versión publicada en Vercel.
- La sección de la app reemplaza al bloque de las 4 características (intercomunicadores, viento, agua plana, multilingüe), debajo de la portada.

Publicar esta sección junto con la app de alumnos: hasta que app.truevento.com funcione, los dos enlaces no abren nada.
- Sin formulario de reserva: los botones "Reservar" del menú y de cada curso abren la app. En Contacto quedan la ubicación, el WhatsApp, el email y el mapa.

## Test

`node tests/site.test.cjs` (desde esta carpeta; usa el Playwright instalado en la máquina). Sirve la página y la revisa entera, unos 237 controles:

- **Archivos y textos:** cada texto en los 3 idiomas y ninguno sobrante, archivos que existen, enlaces internos que llevan a una sección, ids sin repetir, enlaces externos con `rel="noopener"` y peso de fotos y videos.
- **6 tamaños de pantalla** (celular de 320 px, iPhone, Android, tablet, computadora y pantalla grande): nada se corre de costado, sin imágenes rotas, el video arranca, texto legible, botones fáciles de tocar, el menú abre y cierra, los botones iPhone/Android llevan a la guía, en cada paso de la guía el teléfono muestra ese paso sin tapar el texto, y sin errores en la consola.
- **Funciones:** idiomas (se recuerdan al volver), aviso de cookies, ventanas de privacidad y términos (también con Escape), carrusel (flechas, puntos y deslizar con el dedo), enlaces externos, navegador con almacenamiento bloqueado (Safari privado) y la opción de movimiento reducido.

Las capturas quedan en `tests/out/` (fuera de git).
