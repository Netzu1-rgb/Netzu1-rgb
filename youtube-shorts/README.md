# Shorts automáticos de preguntas (quiz)

Cada día genera un Short vertical de 11 segundos con una pregunta de cultura general y lo sube a YouTube.

![Ejemplo](ejemplo.png)

**Estructura del vídeo:** gancho (2 s), pregunta con cuenta atrás de 5 s y respuesta con un dato curioso (4 s).
Es corto a propósito: muchos espectadores lo ven dos veces, y eso mejora la retención.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `preguntas.json` | Banco de preguntas. Añade más para tener más días de contenido |
| `estado.json` | Índice de la siguiente pregunta que se publicará |
| `render.js` | Pasa HTML a imágenes con Playwright y las convierte en MP4 con ffmpeg |
| `upload.js` | Sube el vídeo con la YouTube Data API v3 |
| `auth.js` | Se ejecuta una sola vez para obtener el refresh token |
| `publicar.js` | Genera la siguiente pregunta y la sube |
| `musica.mp3` (opcional) | Si existe, se usa como música de fondo. Usa solo música libre de derechos, por ejemplo de la Biblioteca de audio de YouTube |

## Probar en local

```bash
cd youtube-shorts
npm install
DRY_RUN=1 node publicar.js   # genera out/short-N.mp4 sin subirlo
node render.js 4             # renderiza la pregunta con índice 4
```

## Configurar la subida a YouTube

1. En [Google Cloud Console](https://console.cloud.google.com/), crea un proyecto y activa **YouTube Data API v3**.
2. Configura la **pantalla de consentimiento OAuth** de tipo externo y añade tu cuenta como usuario de prueba.
3. Crea unas **credenciales OAuth** de tipo *Aplicación de escritorio* y copia el Client ID y el Client Secret.
4. En tu ordenador, ejecuta:
   ```bash
   YT_CLIENT_ID=xxx YT_CLIENT_SECRET=yyy node auth.js
   ```
   Abre la URL que aparece, inicia sesión con la cuenta del canal y copia el `YT_REFRESH_TOKEN`.
5. En GitHub, ve a **Settings → Secrets and variables → Actions** y crea estos secretos: `YT_CLIENT_ID`, `YT_CLIENT_SECRET` y `YT_REFRESH_TOKEN`.
6. Para probarlo, ve a la pestaña **Actions**, elige "Publicar Short diario" y pulsa **Run workflow**.

### Avisos importantes

- **Privacidad:** los vídeos se suben como `private` por defecto. Mientras la app de Google Cloud no pase la verificación de la API de YouTube, Google los bloquea en privado aunque pidas `public`. Cuando la app esté verificada, crea la variable de Actions `YT_PRIVACY=public`.
- **Token caducado:** con la pantalla de consentimiento en modo "Testing", el refresh token caduca a los 7 días. Para que no caduque, pon la app en "In production".
- **Cuota:** cada subida gasta unas 1.600 de las 10.000 unidades diarias de la API.
- **Monetización:** YouTube no monetiza el contenido repetitivo. Varía las preguntas, los ganchos y los temas.
