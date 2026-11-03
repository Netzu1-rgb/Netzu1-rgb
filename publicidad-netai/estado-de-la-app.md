# Estado de la app NetAI

Revisión del 3 de noviembre de 2026 (versión 1.3.0). Vista previa: https://claude.ai/artifact/CrqyVV3rpWvrDZGzfhuWSo (privada; los registros se guardan en el navegador de quien la abre).

## Versión 1.3.0: Modo Sport

Modo opcional para deportistas mayores de 18, elegido en el recorrido inicial o desde Ajustes, en “Tus datos”. No está disponible para quien indica estar en tratamiento por un trastorno de la conducta alimentaria.

- **Pasos propios:** deporte, días y minutos de entrenamiento, objetivo (bajar de peso, subir masa muscular, recomposición o rendimiento) y peso objetivo opcional.
- **Plan:** energía, proteínas, carbohidratos, grasas y agua, según las guías de nutrición deportiva (ACSM e ISSN). Los tres macronutrientes suman la energía del día.
- **Límites de seguridad:** déficit de hasta 15 % (máximo 500 kcal por día); nunca por debajo del gasto en reposo ni de 1.500 kcal; ritmo de 0,5 a 1 % del peso por semana para bajar y de 0,25 a 0,5 % para subir; peso objetivo dentro de un rango saludable para la altura.
- **Mi día:** objetivo, energía, proteínas del día (se registran en cada comida), guía de carbohidratos y grasas, y vasos de agua según peso y entrenamiento.
- **Semana:** registro de peso, promedio de 7 días, cambio semanal, avisos si el ritmo es demasiado rápido, semanas hasta el objetivo y señales de falta de energía (cansancio, lesiones, ciclo menstrual).
- **Textos:** se ajustaron la web, la política de privacidad, los términos y la guía de marca: el modo Bienestar sigue siendo neutral al peso y el Modo Sport es opcional.

## Versión 1.2.0: tus datos personales y físicos

Recorrido de 7 pasos la primera vez que se abre la app (y editable desde Ajustes, en “Tus datos”):

1. Sobre vos: nombre, edad y sexo.
2. Tu cuerpo: altura y peso (opcionales; no se pide a menores de 18).
3. Actividad semanal.
4. Para qué usás NetAI (objetivos sin metas de peso).
5. Alimentación: vegetariana, vegana, sin TACC, sin lactosa y alergias.
6. Cómo ver la app, con una pregunta opcional sobre trastornos de la conducta alimentaria.
7. Resumen con tu rango de energía.

Con esos datos:
- El rango de energía de Mi día pasa a ser personal (fórmula de Mifflin-St Jeor por actividad, ±7,5 %), nunca por debajo de 1.500 kcal. Si faltan datos o es menor de edad, se usa el rango general de 1.900 a 2.200 kcal.
- Quien responde que está en tratamiento por un TCA no ve números en ningún lugar y no puede desactivar el Modo Intuitivo desde el interruptor.
- Las recetas se filtran según la alimentación elegida.
- Saludo con el nombre.
- La app nunca muestra el peso, no calcula IMC ni propone metas de peso.
- La copia de seguridad incluye estos datos, "Borrar todos mis datos" también los borra, y la política de privacidad los describe.

## Versión 1.1.0

| Antes | Ahora |
|---|---|
| La primera vez aparecían comidas de ejemplo como si fueran tuyas | Empieza vacía (en 1.2.0, con el recorrido de datos) |
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
