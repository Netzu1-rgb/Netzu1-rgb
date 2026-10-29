# Shorts automáticos de preguntas (quiz)

Cada día genera un Short vertical de unos 35-45 segundos con un reto de **3 preguntas** de cultura general, narrado con voz de **ElevenLabs**, y lo publica en la sección **Releases** del repo para que lo descargues y lo subas tú a YouTube.

## Uso diario (desde el móvil)

1. Abre `https://github.com/Netzu1-rgb/Netzu1-rgb/releases` en Safari.
2. Entra en el reto más reciente y toca el archivo `.mp4` para descargarlo. Guárdalo en Fotos o en Archivos.
3. En la app de YouTube, pulsa **+ → Subir un vídeo**, elige el MP4 y copia el título y la descripción que aparecen en el Release.

Se crea un vídeo nuevo cada día a las 17:23 UTC. Para crear uno al momento, ve a **Actions → Crear Short diario → Run workflow**.

![Ejemplo](ejemplo.png)

**Estructura del vídeo:**
1. Gancho narrado ("¡Tres preguntas! Casi nadie acierta las tres…").
2. Por cada pregunta: la voz la lee, cuenta atrás de 3 s con tic-tac y campana al revelar la respuesta con un dato curioso.
3. Cierre: "¿Cuántas acertaste? Dímelo en los comentarios…".

Cada escena dura lo que tarda la voz en leerla. Para cambiar el número de preguntas, usa la variable `PREGUNTAS_POR_VIDEO` (3 por defecto).

## Voz con ElevenLabs

1. Crea una cuenta en [elevenlabs.io](https://elevenlabs.io) y copia tu API key en *Profile → API Keys*.
2. Guárdala en GitHub como secreto `ELEVENLABS_API_KEY`.
3. (Opcional) Elige una voz nativa en español en la *Voice Library*, copia su Voice ID y créalo como **variable** de Actions `ELEVENLABS_VOICE_ID`. Si no, se usa una voz predefinida (Adam) con el modelo multilingüe. Las voces de la biblioteca solo se pueden usar por API con un plan de pago.

Cada vídeo consume unos 400 caracteres, o unos 600 la primera vez que se graban las frases fijas. El plan gratuito (10.000 caracteres al mes) da para unos 25 vídeos al mes, así que para publicar a diario hace falta el plan Starter. El plan gratuito tampoco permite el uso comercial, y para monetizar el canal necesitas un plan de pago.

### Ahorro de caracteres

- Las frases que se repiten en todos los vídeos (ganchos, "Primera pregunta.", el cierre) se graban **una sola vez** y se guardan en `voces-fijas/`. Si cambias de voz o de modelo, se graban de nuevo automáticamente. Así cada vídeo gasta unos 400 caracteres.
- Para gastar la mitad por carácter, crea la variable de Actions `ELEVENLABS_MODEL=eleven_flash_v2_5` (suena algo menos expresivo).

### Aviso de saldo bajo

Después de cada vídeo se consulta el saldo de ElevenLabs. Si alcanza para menos de 5 vídeos, se abre un **Issue** en el repo y GitHub te envía un email. Para que funcione, la API key necesita el permiso **User → Read** además de **Text to Speech**. Si el saldo se agota del todo, ese día el workflow falla y GitHub también te avisa por email.

Sin `ELEVENLABS_API_KEY`, el vídeo se genera igual pero sin narración, solo con los efectos de sonido.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `preguntas.json` | Banco de preguntas (30 = 10 vídeos). Añade más para tener más días de contenido |
| `estado.json` | Índice de la primera pregunta del siguiente vídeo |
| `render.js` | Pasa HTML a imágenes con Playwright y las convierte en MP4 con ffmpeg |
| `voz.js` | Narración con ElevenLabs, caché de frases fijas, consulta de saldo y efectos de sonido (tic y campana) |
| `voces-fijas/` | Grabaciones de las frases que se repiten (se crea sola) |
| `upload.js` | Sube el vídeo con la YouTube Data API v3 |
| `auth.js` | Se ejecuta una sola vez para obtener el refresh token |
| `publicar.js` | Genera la siguiente pregunta y la sube |
| `musica.mp3` (opcional) | Si existe, se usa como música de fondo. Usa solo música libre de derechos, por ejemplo de la Biblioteca de audio de YouTube |

## Probar en local

```bash
cd youtube-shorts
npm install
DRY_RUN=1 node publicar.js   # genera out/reto-N.mp4 y out/texto.md sin avanzar el estado
node render.js 2             # renderiza el reto 3 (preguntas 7 a 9)
ELEVENLABS_API_KEY=xxx DRY_RUN=1 node publicar.js   # igual, con voz
```

## (Opcional) Subida automática a YouTube

Si algún día quieres que se suba solo, crea los secretos `YT_CLIENT_ID`, `YT_CLIENT_SECRET` y `YT_REFRESH_TOKEN` siguiendo estos pasos. Sin ellos, el vídeo solo se publica en Releases.

1. En [Google Cloud Console](https://console.cloud.google.com/), crea un proyecto y activa **YouTube Data API v3**.
2. Configura la **pantalla de consentimiento OAuth** de tipo externo y añade tu cuenta como usuario de prueba.
3. Crea unas **credenciales OAuth** de tipo *Aplicación de escritorio* y copia el Client ID y el Client Secret.
4. En tu ordenador, ejecuta:
   ```bash
   YT_CLIENT_ID=xxx YT_CLIENT_SECRET=yyy node auth.js
   ```
   Abre la URL que aparece, inicia sesión con la cuenta del canal y copia el `YT_REFRESH_TOKEN`.
5. En GitHub, ve a **Settings → Secrets and variables → Actions** y crea estos secretos: `YT_CLIENT_ID`, `YT_CLIENT_SECRET` y `YT_REFRESH_TOKEN`.
6. Para probarlo, ve a la pestaña **Actions**, elige "Crear Short diario" y pulsa **Run workflow**.

### Avisos importantes

- **Privacidad:** los vídeos se suben como `private` por defecto. Mientras la app de Google Cloud no pase la verificación de la API de YouTube, Google los bloquea en privado aunque pidas `public`. Cuando la app esté verificada, crea la variable de Actions `YT_PRIVACY=public`.
- **Token caducado:** con la pantalla de consentimiento en modo "Testing", el refresh token caduca a los 7 días. Para que no caduque, pon la app en "In production".
- **Cuota:** cada subida gasta unas 1.600 de las 10.000 unidades diarias de la API.
- **Monetización:** YouTube no monetiza el contenido repetitivo. Varía las preguntas, los ganchos y los temas.
