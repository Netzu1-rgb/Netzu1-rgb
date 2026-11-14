# Apps para estudiar antes de construir NetAI Fit

Primer paso de NetAI Fit: decidir qué apps mirar, con qué método y qué sacar de cada una. No incluye código. Preparado el 14 de noviembre de 2026.

## Lo primero: qué se puede hacer con REA y qué no

REA analiza apps ya hechas (JavaScript, Electron, sitios web y binarios). Su propio aviso de uso excluye copiar software propietario, reproducir su código o sus recursos, y saltarse protecciones o términos de uso. Eso divide las apps en tres grupos:

| Grupo | Qué se puede hacer | Con qué |
|---|---|---|
| **A. Apps de código abierto** | Leer el código, analizarlo con REA, entender cómo resuelven cada función | REA o lectura directa del repositorio |
| **B. Apps comerciales** | Usarlas como cliente, leer su ficha de tienda, sus precios y sus reseñas | Tu teléfono y una planilla. REA solo sobre su web pública |
| **C. Datos abiertos** | Usar los datos respetando su licencia | Descarga directa |

Desarmar la app de una empresa (su APK o su IPA) para ver cómo está hecha por dentro queda fuera: lo prohíben sus términos de uso y es lo que REA dice que no apoya. Tampoco hace falta, porque lo que NetAI Fit necesita aprender está a la vista en los grupos A y B.

## Grupo A: código abierto (acá sí sirve REA)

| App | Qué es | Licencia | Para qué función de NetAI Fit sirve |
|---|---|---|---|
| **wger** (`wger-project/wger`) | Gestor de entrenamientos, nutrición y peso, con servidor propio, app móvil y una API | Código AGPL-3.0; ejercicios con licencia Creative Commons por entrada | Rutinas (1), registro (2), biblioteca de ejercicios (3) y, sobre todo, cómo une entrenamiento y nutrición (5 a 8) |
| **Liftosaur** (`astashov/liftosaur`) | Registro de fuerza hecho como PWA; las apps de tienda son envoltorios de esa web | AGPL-3.0 | Es el caso más parecido a NetAI (PWA): registro de series (2), programas con progresión (1) y progreso (4) |
| **LibreFit** (`odweta/LibreFit`) | Registro de entrenamientos para Android, privado y sin cuenta | GPL-3.0 o posterior | Registro (2) y biblioteca con imágenes (3), con los datos en el teléfono como NetAI |
| **GymRoutines** (`noahjutz/gymroutines`) | Registro simple de rutinas para Android | GPL-3.0 o posterior | El registro mínimo (2): qué alcanza para una primera versión |
| **LiftLog** (Liam Morrow) | Registro de fuerza | AGPL-3.0, según AlternativeTo | Flujo de registro durante el entrenamiento (2). Confirmar el repositorio antes de usarlo |

**Cuidado con las licencias AGPL y GPL.** Leer el código para aprender cómo funciona algo está permitido. Copiar partes de ese código dentro de NetAI Fit obligaría a publicar el código de NetAI Fit con la misma licencia. La regla es: se toman ideas y se escribe todo de nuevo.

## Grupo B: comerciales (se estudian como usuario)

Son las referencias del mercado. Se miran desde afuera: instalar, usar la versión gratis unos días y anotar.

| App | Por qué mirarla |
|---|---|
| **Hevy** | Registro de fuerza muy usado, con parte social. Ver cómo se registra una serie y cómo muestra el progreso |
| **Strong** | Registro de fuerza minimalista. Ver cuántos toques lleva anotar una serie |
| **JEFIT** | Biblioteca grande de ejercicios y rutinas. Ver cómo ordena y filtra los ejercicios |
| **Fitbod** | Arma la rutina automáticamente. Ver qué pregunta al principio y cómo explica lo que propone |
| **Nike Training Club** | Entrenamientos guiados con video. Ver el formato de las sesiones para principiantes y para casa |
| **Freeletics** | Entrenamiento con el peso del cuerpo y plan guiado. Ver el recorrido inicial y los avisos de descanso |

Los precios y los límites de cada plan cambian seguido: se anotan el día que se revisa cada app, no se copian de acá.

## Grupo C: datos abiertos para la biblioteca de ejercicios

| Fuente | Qué trae | Licencia |
|---|---|---|
| **free-exercise-db** (`yuhonas/free-exercise-db`) | Listado de ejercicios con imágenes, en JSON | Un catálogo de terceros lo describe como dominio público. Leer su `LICENSE.md` antes de usarlo |
| **Ejercicios de wger** | Ejercicios con descripción y músculos, por API | Creative Commons, distinta en cada entrada: hay que respetar la atribución de cada una |

Esto puede ahorrar la parte más cara de la función 3 (la biblioteca). Los textos están en inglés: habría que traducirlos y hacer que los revise un profesional del ejercicio.

## Qué anotar de cada app

Una fila por app, con lo mismo para todas:

| Punto | Qué mirar |
|---|---|
| Recorrido inicial | Qué pregunta, cuántos pasos, qué es obligatorio |
| Registrar una serie | Cuántos toques, qué viene completado, cómo se corrige |
| Rutinas | Cómo se eligen o se arman, cómo progresan semana a semana |
| Biblioteca | Cuántos ejercicios, video o imagen, variantes para casa |
| Progreso | Qué muestra (constancia, cargas, medidas) y con qué tono |
| Motivación | Rachas, logros, avisos; si castiga cuando se falla |
| Vínculo con la comida | Si existe y cómo |
| Qué es gratis y qué es pago | Dónde está el corte |
| Lo que no queremos copiar | Presión, comparaciones, metas de peso sin límites |

## Elegida para empezar: Workout Guide

Buscando una app abierta con un personaje que muestre el ejercicio en movimiento, la mejor base resultó **Workout Guide** (`bryllim/workout-guide`):

| Candidata | Qué ofrece | Por qué sí o por qué no |
|---|---|---|
| **Workout Guide** | 302 ejercicios, tres poses dibujadas por ejercicio, con equipo y músculos | **Elegida.** Licencia clara: código MIT y dibujos CC BY-SA 4.0, que permite uso comercial con atribución |
| Open Exercises (`badboysm890/open-exercises-app`) | 75 ejercicios con animación fluida (Lottie) | Las animaciones vienen de otro proyecto (*sixpack-lottie*) cuya licencia no está aclarada |
| openGym (`DuarteSantos8/openGym`) | Más de 5.600 ejercicios con demos animadas | Las imágenes son de un tercero y solo se pueden usar dentro de openGym |
| workout.cool | Más de 1.200 ejercicios con video | Los videos son de una app socia |

Qué se tomó y qué no:
- **Se usan los dibujos** de 40 ejercicios, sin modificar, con la atribución que pide la licencia.
- **Se aprendió la idea** de animar alternando tres poses y de describir cada ejercicio con equipo, músculo principal y tipo (repeticiones o tiempo).
- **No se copió código.** La pantalla, los filtros, la animación y los textos en español se escribieron para NetAI.

La licencia CC BY-SA obliga a compartir igual los dibujos (y cualquier versión modificada de ellos), no el código ni los textos de la app.

## Por dónde empezar

1. **Liftosaur y wger con REA**, porque son los dos que más enseñan: uno es una PWA como NetAI y el otro une entrenamiento con nutrición. El pedido para Claude Code está en `instalar-rea.md`; REA se instala en tu computadora, no en una sesión en la nube.
2. **Hevy y Fitbod como usuario**, una semana cada una, llenando la tabla de arriba.
3. **Revisar la licencia de free-exercise-db** y decidir si la biblioteca de ejercicios parte de ahí.
4. Con eso, definir la primera versión de NetAI Fit: registro de series, tres o cuatro rutinas por objetivo y la biblioteca.

## Pendiente de decidir

- **Fit dentro de NetAI o aparte.** `netai-fit.md` recomendaba empezar con una pestaña dentro de NetAI. Desde entonces NetAI sumó el Modo Sport (objetivos, peso, macros), que es el lugar natural para engancharlo.
- **Objetivos.** `netai-fit.md` dice "sin bajar de peso como opción", pero el Modo Sport ya incluye ese objetivo con límites de seguridad. Hay que alinear los dos documentos.
- **Quién revisa las rutinas** desde el punto de vista profesional.

## Fuentes

- [Workout Guide en GitHub](https://github.com/bryllim/workout-guide)
- [Open Exercises en GitHub](https://github.com/badboysm890/open-exercises-app)
- [openGym en GitHub](https://github.com/DuarteSantos8/openGym/tree/main)
- [workout.cool en Hacker News](https://news.ycombinator.com/item?id=44309320)

- [wger en GitHub](https://www.github.com/wger-project/flutter) y [su README](https://cdn.jsdelivr.net/gh/wger-project/wger@master/README.md)
- [Liftosaur en GitHub](https://github.com/astashov/liftosaur) y [su ficha en ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fastashov%2Fliftosaur)
- [LibreFit en GitHub](https://github.com/odweta/LibreFit)
- [GymRoutines en F-Droid (IzzyOnDroid)](https://apt.izzysoft.de/fdroid/index/apk/com.noahjutz.gymroutines?repo=main)
- [LiftLog en AlternativeTo](https://www.alternativeto.net/software/liftlog-liam-morrow/about/)
- [free-exercise-db en apis.io](https://apis.io/providers/free-exercise-db/)
