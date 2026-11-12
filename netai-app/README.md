# NetAI

App de nutrición consciente, hecha con Next.js. Se instala en el teléfono desde el navegador (PWA) y guarda los registros en el propio dispositivo.

Tiene dos modos:

- **Bienestar:** neutral al peso. No muestra el peso ni propone metas de peso, el rango de energía nunca baja de 1.500 kcal y el Modo Intuitivo oculta todos los números. Quien indica estar en tratamiento por un trastorno de la conducta alimentaria no ve números en ningún lugar.
- **Modo Sport:** opcional, para deportistas mayores de 18. Plan de energía, proteínas, carbohidratos, grasas y agua según el objetivo (bajar de peso, subir masa muscular, recomposición o rendimiento), con límites de seguridad y seguimiento del peso.

## Qué incluye

| Sección | Qué hace |
|---|---|
| Recorrido inicial | Datos personales y físicos, modo, actividad u objetivos deportivos, alimentación y forma de ver la app |
| Mi día | Registro de comidas con horarios propios, agua, hambre y saciedad, favoritas y frecuentes, editar y deshacer |
| Foto del plato | La cámara envía la foto a Google Gemini y vuelve con kcal, proteínas, carbohidratos y grasas para revisar antes de guardar |
| Semana y Mes | Días registrados, agua, hambre y saciedad; comparación de los últimos 30 días con los anteriores e informe descargable; en Sport, peso y ritmo |
| Inspiración | Método del Plato, "Ideas para hoy" (sugerencias con IA) y recetas filtradas por alimentación |
| Aprender | Artículos breves de alimentación consciente |
| Ajustes | Tus datos, Modo Intuitivo, tema claro u oscuro, horarios y recordatorios, copia de seguridad, exportar a CSV y borrar todo |

La página de inicio (`/`) presenta la app, los planes y el formulario para pedir acceso. `/app` pide un código de acceso.

## Probar en tu computadora

Hace falta Node.js 20.9 o posterior.

```bash
./iniciar-local.sh        # en Windows: iniciar-local.bat
```

El script instala lo necesario, crea `.env.local` y abre la app en `http://localhost:3000`. En desarrollo, si no cargaste ningún código, el código de acceso es `familia2026`.

A mano: `npm install`, copiar `.env.example` como `.env.local` y `npm run dev`.

## Variables de entorno

Están explicadas en `.env.example`. En Vercel se cargan en *Project Settings → Environment Variables*.

| Variable | Para qué | Obligatoria |
|---|---|---|
| `APP_ACCESS_CODES` | Códigos de acceso separados por coma. Un código por persona o grupo; quitar uno cierra sus sesiones | Sí, en producción |
| `SESSION_SECRET` | Clave que firma las sesiones, de 32 caracteres o más (`openssl rand -base64 32`) | Sí, en producción |
| `GEMINI_API_KEY` | Foto del plato y sugerencias de comidas. Sin la clave, la app pide registrar a mano | No |
| `GEMINI_MODEL` | Modelo de Gemini (por defecto `gemini-2.5-flash`) | No |
| `PHOTO_ANALYSIS_PER_HOUR` | Máximo de pedidos a la IA por hora y por conexión (por defecto 30) | No |
| `NEXT_PUBLIC_SITE_URL` | Dirección pública, para la vista previa al compartir | Recomendada |
| `NEXT_PUBLIC_REQUEST_ENDPOINT` | Adónde llegan las solicitudes de acceso (FormSubmit). Sin ella, el formulario no se muestra | No |

Las variables `NEXT_PUBLIC_…` quedan dentro de la app al compilar: si las cambiás en Vercel, hay que volver a publicar.

## Pruebas

```bash
npm test            # cálculos de energía, Modo Sport y acceso (segundos)
npm run test:e2e    # compila la app y la recorre en un navegador (unos minutos)
npm run test:e2e -- foto   # solo los archivos cuyo nombre contiene "foto"
```

Las pruebas de navegador usan Playwright y un Gemini simulado, así que no gastan cuota ni necesitan clave. La primera vez hay que instalar el navegador con `npx playwright install chromium`. Incluyen una revisión de accesibilidad (axe) en tema claro y oscuro. GitHub las corre en cada cambio (`.github/workflows/netai-app.yml`).

## Publicar

Paso a paso en [`../publicidad-netai/lanzamiento.md`](../publicidad-netai/lanzamiento.md). En resumen: proyecto nuevo en Vercel con *Root Directory* `netai-app`, cargar las variables y conectar el dominio.

## Dónde está cada cosa

| Ruta | Contenido |
|---|---|
| `src/app/page.jsx` | Página de inicio |
| `src/app/app/page.jsx` | La app completa (pestañas, hojas y ajustes) |
| `src/components/onboarding/Onboarding.jsx` | Recorrido inicial |
| `src/lib/profile.js`, `src/lib/ethicalNutrition.js` | Cálculos de energía, plan del Modo Sport y límites de seguridad |
| `src/lib/auth.js`, `src/proxy.js`, `src/app/api/auth/` | Códigos de acceso, sesiones y protección de `/app` |
| `src/lib/gemini.js`, `src/app/api/analizar-plato/`, `src/app/api/sugerir-comidas/` | Conexión con Gemini |
| `src/app/privacidad/`, `src/app/terminos/`, `src/components/legal/LegalPage.jsx` | Textos legales (faltan los datos del responsable) |
| `public/sw.js`, `public/manifest.webmanifest`, `public/icons/` | Instalación y uso sin conexión |
| `tailwind.config.js`, `src/app/globals.css` | Colores (claro y oscuro) y tipografías |
| `tests/` | Pruebas unitarias y de navegador |

## Datos y privacidad

- Los registros, el perfil y las preferencias se guardan en el teléfono (`localStorage`). No hay cuentas ni base de datos.
- La foto del plato se reduce en el teléfono, pasa por el servidor hacia Google Gemini y no se guarda. La app pide permiso la primera vez.
- El pedido de sugerencias envía el momento del día, el tipo de alimentación y las alergias, sin el nombre.
- Los valores que devuelve la IA son estimaciones: la persona los revisa antes de guardar.

NetAI no reemplaza la consulta con profesionales de la salud.
