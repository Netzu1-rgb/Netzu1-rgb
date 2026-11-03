# Estado de la app NetAI

Revisión del 3 de noviembre de 2026 (versión 1.1.0). Vista previa: https://claude.ai/artifact/CrqyVV3rpWvrDZGzfhuWSo (privada; los registros se guardan en el navegador de quien la abre).

## Hecho en esta versión

| Antes | Ahora |
|---|---|
| La primera vez aparecían comidas de ejemplo como si fueran tuyas | Empieza vacía, con una bienvenida de 3 pasos |
| No se podía corregir un registro | Botón para editar cada comida |
| Borrar no tenía vuelta atrás | Aviso con "Deshacer" durante 6 segundos |
| Había que escribir siempre la comida completa | "Tus frecuentes": las comidas que más registrás, con un toque |
| Las recetas se sumaban siempre al almuerzo | Elegís el momento (desayuno, almuerzo, merienda, cena, colación) |
| Se podía navegar a días futuros | El día siguiente se desactiva en "Hoy" |
| Los registros solo vivían en el teléfono, sin copia | Ajustes: descargar copia, restaurarla y borrar todo (con confirmación) |
| Salir usaba una ventana del navegador | Ajustes con confirmación dentro de la app; enlaces a privacidad y términos |
| La web prometía un "resumen semanal" que no existía | Pestaña "Semana": días en que te cuidaste, agua por día y promedio de hambre y saciedad, sin calorías ni rachas |
| El aviso de instalación tenía el diseño viejo y salía en todas las páginas | Rediseñado, solo dentro de la app; el modo sin conexión se activa aunque la página ya haya cargado |

Probado en el navegador en modo producción: 19 comprobaciones de estas funciones, sin errores.

## Lo que falta

### Decisiones tuyas (bloquean el lanzamiento)
1. **Cómo entra una persona nueva:** beta cerrada con contraseña, acceso libre o cuentas (ver `lanzamiento.md`).
2. **Análisis por foto:** hoy es una simulación. Hay que conectar Gemini (ver `conectar-gemini.md`) antes de vender Plus y Pro.
3. **Cobros:** no hay sistema de pagos. Para la web, Mercado Pago o Stripe; para las tiendas, el sistema de cada una.
4. **Datos legales:** responsable, correo, ciudad y país en las páginas de privacidad y términos.

### Código
- **Código viejo sin usar.** En `netai-app/src/` quedó la versión anterior de la app (Vite: `App.jsx`, `main.jsx`, `components/*View.jsx`, `FoodScannerModal.jsx`, `PremiumModal.jsx`, `i18n/`, `security/`, `nutritionEngine.js`, `App.css`, `mealsAndI18n.css`, `index.css`, más `index.html` y `vite.config.js` en la raíz). La app actual no la usa. Propuesta: sacarla del proyecto o moverla a una carpeta de archivo, para que no confunda.
- **Promesas del plan Gratis sin hacer:** "Horarios de comidas personalizables" y "Favoritos" (hoy hay frecuentes, no favoritos marcados a mano).
- **Recordatorios** (por ejemplo, de agua): no existen. Ayudan a la app y Apple los valora para aceptarla en la tienda.
- **Pruebas automáticas:** las comprobaciones de esta revisión se hicieron a mano con un navegador automatizado; conviene guardarlas en el proyecto para repetirlas antes de cada publicación.

### Diseño
- **Página de inicio de la app** (`/`): el encabezado y los precios están rediseñados, pero las secciones del medio (funciones, filosofía, medios de pago) conservan el diseño anterior.
- **Dos páginas de inicio:** la web `netai-web/` y la página de inicio de la app dicen lo mismo con distinto diseño. Conviene elegir una y que la otra redirija.
- **Modo oscuro:** la app no lo tiene; se usa mucho de noche.
- **Recetas sin imágenes.**
- **NetAI Fit:** solo existe en la web como "en camino".
