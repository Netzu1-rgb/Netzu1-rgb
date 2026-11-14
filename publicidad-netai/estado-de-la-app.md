# Estado de la app NetAI

Revisión del 12 de noviembre de 2026 (versión 2.1.0). Vista previa: https://claude.ai/artifact/CrqyVV3rpWvrDZGzfhuWSo (privada; los registros se guardan en el navegador de quien la abre).

## Versión 2.1.0: programas conocidos y rutinas por deporte en NetAI Fit

**Programas para ganar masa muscular (gimnasio)**
- **PPL:** empuje, tirón y piernas.
- **Arnold split:** pecho y espalda, hombros y brazos, piernas y abdomen.
- **Torso y pierna:** dos días que se alternan.
- **5×5:** dos días con tres ejercicios, pensado para fuerza.
- **Caminata 12-3-30:** cinta con 12 % de pendiente, a unos 4,8 km/h, 30 minutos.

Al elegir "Ganar músculo" o "Ganar fuerza" en el gimnasio, Fit pregunta qué programa seguir y después va proponiendo sus días en orden.

**Rutinas por deporte.** Fit pregunta qué deporte hace la persona (o lo toma de NetAI) y pone primero la rutina que lo acompaña, en versión casa y gimnasio:
- Running, ciclismo o natación: fuerza de piernas a un lado por vez, gemelos, saltos y tronco.
- Deporte en equipo: fuerza de piernas, saltos y cambios de dirección.
- Deporte de combate: soga, flexiones, burpees, giros y tronco; en gimnasio, pesa rusa, dominadas, fondos y sogas.
- Funcional o crossfit: circuito de todo el cuerpo.

**Biblioteca.** Pasó de 40 a 68 ejercicios, con sus dibujos.

**De dónde sale cada cosa**
- Los programas son formatos públicos y muy difundidos; las series y repeticiones son una versión general escrita para NetAI, no la de un autor en particular.
- De lo que se buscó en redes: la caminata 12-3-30 y los esquemas semanales 3-2-1 y 4-2-1 aparecen como tendencia en 2026; del Arnold split no se encontró cobertura reciente, se agregó porque es un clásico pedido.
- Para deportes de resistencia hay respaldo de estudios: sumar fuerza mejora la economía de carrera y los saltos ayudan a quienes corren. Para deportes de equipo, combate y funcional no se encontraron guías concretas: esas rutinas son un punto de partida general.
- Todo sigue pendiente de la revisión de un profesional del ejercicio.

**No se hizo:** los esquemas semanales 3-2-1 y 4-2-1 (combinan fuerza, pilates o cardio y movilidad) no están como plan armado.

## Versión 2.0.0: NetAI Fit, app de entrenamiento aparte

NetAI Fit pasa a ser una app propia en `/fit`, con su nombre, su ícono y su manifiesto, así se instala en el teléfono separada de NetAI. La pestaña Mover se quitó de NetAI.

**Qué tiene**
- **Objetivos, en una pantalla:** ganar fuerza, ganar músculo, bajar de peso, resistencia, movilidad o moverme más; lugar (casa o gimnasio), días por semana y nivel.
- **Hoy:** la rutina que toca según el objetivo (va rotando), la semana de lunes a domingo y el acceso a la comida del día en NetAI.
- **Entrenar:** cada ejercicio con su figura en movimiento; por serie se anotan repeticiones o segundos y los kilos, y se marca como hecha. Propone la carga de la última vez. Si se sale o se cierra la app, el entrenamiento queda guardado para seguir.
- **Rutinas:** nueve rutinas (cinco en casa, cuatro en gimnasio), primero las del objetivo.
- **Ejercicios:** la biblioteca de 40 ejercicios con filtros.
- **Progreso:** totales, carga por ejercicio comparada con la primera vez, historial por ejercicio, peso corporal e historial de entrenamientos.

**Cómo se conecta con NetAI**
- Toma de NetAI el nombre y, si la persona usa el Modo Sport, el objetivo, los días y el lugar.
- El peso corporal es el mismo registro: lo que se anota en una app aparece en la otra.
- NetAI muestra en Mi día el entrenamiento hecho ese día, con acceso a Fit. Fit tiene un acceso a NetAI.
- La copia de seguridad de NetAI incluye los entrenamientos y los objetivos de Fit, y "Borrar todos mis datos" también los borra.
- Si en NetAI se indicó un tratamiento por un trastorno alimentario, Fit no ofrece "Bajar de peso" ni pide el peso corporal.
- Usan el mismo código de acceso y la misma sesión.

**Cómo está hecha la separación.** Las dos apps se publican juntas, en el mismo dominio. Así comparten los datos del teléfono sin cuentas ni servidor. Si más adelante van en dominios distintos o a las tiendas como dos apps, hacen falta cuentas para que sigan conectadas.

**Seguridad.** El ingreso solo vuelve a páginas de la propia app después de entrar (antes aceptaba cualquier dirección en el enlace).

**Pendiente**
- Las series y repeticiones de las rutinas, y los textos de los ejercicios, son generales: falta la revisión de un profesional del ejercicio.
- No hay rutinas armadas por la persona, ni temporizador de descanso, ni gráficos de evolución.
- El movimiento de la figura va a saltos (tres poses por ejercicio).
- La web de presentación sigue mostrando NetAI Fit como "en desarrollo".

## Versión 1.10.0: alimentación en una pantalla corta y varios deportes

- **"¿Qué comés?":** tres tarjetas con ícono (de todo, vegetariana, vegana) y una frase que se arma sola con lo elegido, por ejemplo "Te vamos a sugerir platos vegetarianos, sin frutos secos ni maní".
- **Alimentos que no comés:** quedan plegados en un botón; al tocarlo aparecen las opciones y el campo libre. El botón muestra cuántos hay marcados.
- **Entrenamiento:** se pueden elegir varios deportes. El primero queda como principal y el resumen los muestra todos.

## Versión 1.9.2: el recorrido y la app empiezan en modo claro

- El recorrido inicial se muestra siempre en claro, aunque el teléfono esté en modo oscuro.
- La app también empieza en claro. El tema oscuro, o que siga al teléfono ("Automática"), se elige en Ajustes, Apariencia.
- Quien ya usaba la app conserva el tema que tenía guardado.

## Versión 1.9.1: se quita el paso "¿Cómo querés ver la app?" del recorrido inicial

El recorrido de la primera vez ya no pregunta por tratamientos de trastornos de la conducta alimentaria ni por la forma de ver la app: pasa de la alimentación al resumen (7 pasos en lugar de 8).

- **Dónde quedó:** el paso sigue disponible en Ajustes, "Tus datos". Ahí se puede indicar el tratamiento (oculta todos los números y desactiva el Modo Sport) y elegir entre rango de energía o Modo Intuitivo.
- **Consecuencia a tener en cuenta:** una persona nueva en tratamiento por un trastorno alimentario ya no recibe la protección automática al empezar; ve calorías, y en Modo Sport también peso y metas, salvo que lo indique desde Ajustes. Los textos de la web y de los términos que presentan a NetAI como cuidadosa con ese tema conviene revisarlos con esto en mente.
- En Bienestar, el interruptor "Modo Intuitivo" del encabezado sigue ocultando los números con un toque.

## Versión 1.9.0: primeros pasos más cortos e interactivos

- **Bienvenida:** el plato, un título ("Armemos tu plan en 1 minuto") y tres frases cortas con ícono, en lugar de párrafos.
- **Edad, altura y peso:** se eligen con botones de más y menos o deslizando una barra; también se pueden escribir.
- **Modo:** dos tarjetas grandes con ícono y una línea cada una.
- **Entrenamiento:** los días de la semana se tocan (0 a 7) y la duración se elige entre opciones, sin escribir.
- **Gancho:** el título saluda por el nombre apenas se escribe, y una tira "Tu plan va tomando forma" va sumando lo que la persona respondió. En Bienestar no muestra el peso ni la altura.
- **Menos texto:** se acortaron las explicaciones de todos los pasos.

Sin cambios: el orden de los pasos, las validaciones, y las reglas para menores de 18 y para quien está en tratamiento por un trastorno alimentario.

## Versión 1.8.0: primer paso de NetAI Fit, la pestaña Mover

Una quinta pestaña, "Mover", con una biblioteca de 40 ejercicios y una figura que muestra el movimiento.

- **Figura animada:** cada ejercicio tiene tres dibujos (inicio, mitad y final) que se alternan. Se puede pausar, y queda quieta si el teléfono tiene activado "reducir movimiento". Toma el color del tema claro u oscuro.
- **Filtros:** "En casa" (24 ejercicios sin equipo) o "Gimnasio" (suma barra, mancuernas, poleas y máquinas), y zona del cuerpo.
- **Detalle:** músculos que trabaja, tres pasos y un cuidado, en español.
- **De dónde salen los dibujos:** de Workout Guide (Bryl Lim), basados en Everkinetic, con licencia CC BY-SA 4.0. La app los acredita en pantalla y en `netai-app/public/ejercicios/ATRIBUCION.md`. La elección está explicada en `competidores-gym.md`.

**Pendiente**
- Los textos de los ejercicios son propios y generales: falta la revisión de un profesional del ejercicio.
- El grosor del trazo cambia entre las poses de algunos ejercicios, y el movimiento se ve a saltos (tres poses, no un video).
- Todavía no hay rutinas ni registro de series; es solo la biblioteca.
- La revisión automática de accesibilidad todavía no recorre esta pestaña.

## Versión 1.7.2: el Modo Sport va primero y viene marcado

En el paso "¿Cómo querés usar NetAI?" del recorrido inicial, el Modo Sport aparece primero y ya seleccionado; Bienestar queda segundo. Se mantiene igual que antes:

- Quien ya eligió un modo conserva el suyo al editar sus datos.
- Los menores de 18 no ven ese paso y quedan en Bienestar.
- Quien indica estar en tratamiento por un trastorno de la conducta alimentaria queda en Bienestar, sin números.
- "Prefiero completarlo después" deja la app en Bienestar con el rango general.

A tener en cuenta: el Modo Sport exige altura y peso, así que quien avanza sin cambiar el modo tiene que cargarlos.

## Versión 1.7.1: paso "Tu alimentación" más claro

El paso mostraba cuatro etiquetas (vegetariana, vegana, sin TACC, sin lactosa) como si todas las personas fueran alguna de ellas. Ahora tiene dos preguntas:

- **¿Qué comés?** Una sola opción: "De todo" (la que viene marcada), vegetariana o vegana, cada una con su aclaración.
- **¿Hay alimentos que no comés?** Varias opciones: gluten, lactosa, carne roja, cerdo, pollo, pescado, mariscos, huevo, frutos secos y soja. Si elegís vegetariana o vegana, no se ofrecen los que ya quedan cubiertos.
- El campo libre queda para otros alimentos o alergias.

El resumen muestra por separado cómo comés y lo que no comés, y las "Ideas para hoy" reciben la lista completa de lo que no comés.

## Versión 1.7.0: el escaneo de fotos pasa a Claude

- La foto del plato y las "Ideas para hoy" ahora usan Claude, de Anthropic (modelo `claude-haiku-5-5`, el más económico). Se quitó el código de Google Gemini.
- La variable del servidor es `ANTHROPIC_API_KEY` (antes `GEMINI_API_KEY`). Pasos en `conectar-ia.md`.
- Se actualizaron el aviso de permiso de la foto, la política de privacidad y los textos para las tiendas, que nombran a quién se envía la foto.
- Probado con un servidor que imita a Claude; falta la primera prueba con una clave real.

Las notas de versiones anteriores que mencionan Gemini describen cómo era la app en ese momento.

## Versión 1.6.0: velocidad, seguridad, uso simultáneo y escritorio

**Velocidad** (medida en un teléfono lento simulado, con un año de registros)
- La app pesa unos 280 KB al cargar y cada acción responde en menos de 130 ms.
- Los registros se guardan un instante después del último cambio y siempre al salir: marcar un vaso de agua pasó de 104 a 56 ms.
- Con mala señal, a los 3 segundos se muestra la copia guardada en lugar de esperar a la red.

**Seguridad**
- Los pedidos que llegan desde otros sitios se rechazan, aunque lleven la sesión.
- Fotos o pedidos demasiado grandes se cortan antes de procesarlos.
- Las respuestas de la API no se guardan en cachés intermedios; se sumaron cabeceras de aislamiento.
- Prueba nueva con 23 comprobaciones: sesiones inventadas o alteradas, bloqueo por intentos, cabeceras, cookie y abuso de la API.
- Pendiente conocido: la política de contenido todavía permite scripts en línea, que Next.js necesita para páginas estáticas. Endurecerla obliga a generar cada página en el servidor y la hace más lenta.

**Varias personas a la vez**
- La app no guarda datos de usuarios en el servidor: cada teléfono tiene los suyos, así que no hay cruces entre personas.
- El cupo de IA ahora es por sesión (30 por hora) además de un tope por conexión: quienes comparten wifi no se bloquean entre sí.
- Prueba nueva de carga: 150 personas ingresando, abriendo la app, analizando una foto y pidiendo ideas al mismo tiempo, sin errores. Se hizo en un solo servidor de prueba y con Gemini simulado; en Vercel la capacidad real depende del plan y del cupo de Google.

**Diseño**
- Escritorio y tablet horizontal: Mi día en dos columnas (resumen y agua a la izquierda, siempre a la vista; comidas a la derecha) y recetas en dos columnas.
- Modo Sport: los 14 vasos de agua van en dos filas parejas de 7.
- Mes: los encabezados de la tabla ya no se parten.

## Versión 1.5.1: revisión de diseño y de fallas

Revisión pantalla por pantalla, con capturas y pruebas en navegador.

**Fallas corregidas**
- El botón Atrás del teléfono, con una hoja abierta (registrar, ajustes, receta), sacaba de la app. Ahora cierra la hoja.
- El foco del teclado y de los lectores de pantalla quedaba detrás de la hoja abierta. Ahora entra en la hoja, no sale mientras está abierta y vuelve al botón que la abrió.
- Un dato dañado en el teléfono, o una copia de seguridad con otro formato, podía impedir que la app cargara. Ahora cada dato se lee por separado y se limpia.
- En teléfonos con barra de navegador, la hoja podía quedar más alta que la pantalla visible.

**Diseño**
- Tarjeta de comida: el nombre usa todo el ancho (antes se partía en cuatro renglones al lado de los íconos) y las acciones van en su propia fila.
- Botones de favorita, editar, eliminar, día anterior y siguiente, ajustes, "Registrar" y la escala de hambre: ahora miden 44 px, el mínimo cómodo para el dedo (antes, 28 a 38 px).
- Al registrar una comida, "Cancelar" y "Guardar" quedan siempre visibles abajo, sin tener que bajar hasta el final.
- El selector de día ya no aparece en Inspiración ni en Aprender, donde no hacía nada.

**Pendiente de diseño (no se tocó)**
- Recetas sin fotos.
- Las pestañas Semana y Aprender siguen en una sola columna en escritorio.

## Versión 1.5.0: preparación del lanzamiento

**Acceso y seguridad**
- Códigos de acceso (`APP_ACCESS_CODES`): uno por persona o grupo. Quitar un código de la lista cierra sus sesiones.
- Bloqueo después de 8 intentos fallidos en 15 minutos por conexión. En producción no hay código por defecto.
- Cabeceras de seguridad (CSP, HSTS y otras), páginas de error propias, `robots` y `sitemap`; `/app` y `/login` no se indexan.

**Página de inicio única.** Se reescribió `/` con el diseño actual: qué hace la app, los dos modos, planes y formulario para pedir acceso. Durante la beta no se cobra y todas las funciones están habilitadas.

**Funciones que la web prometía y faltaban**
- Favoritas marcadas a mano (estrella en cada comida), además de las frecuentes.
- Horarios de comidas personalizables y recordatorios a la hora de cada comida (funcionan con la app abierta; ver límites más abajo).
- Exportar el historial a CSV.
- Vista de Mes: compara los últimos 30 días con los 30 anteriores y descarga un informe.
- "Ideas para hoy": tres sugerencias de comidas con IA según el momento del día, la alimentación y las alergias.

**App instalable**
- Tema oscuro (automático, claro u oscuro).
- Service worker reescrito: no guarda redirecciones ni respuestas de la API, y la app abre sin conexión.
- El día cambia solo a la medianoche. Capturas y accesos directos en el manifiesto.
- Tipografías incluidas en la app, sin pedirlas a Google.

**Limpieza.** Se eliminó la versión anterior de la app (Vite) y los componentes viejos de la página de inicio.

**Pruebas guardadas en el proyecto.** `npm test` (34 pruebas de los cálculos, el acceso, la lectura de datos y los entrenamientos) y `npm run test:e2e` (177 comprobaciones en un navegador, con revisión de accesibilidad en tema claro y oscuro). GitHub las corre en cada cambio.

## Versión 1.4.0: foto del plato con Gemini y solicitudes de acceso

**Foto del plato.** En "Registrar", el botón "Sacar foto del plato" abre la cámara. La foto se reduce en el teléfono, se envía a Google Gemini desde el servidor y vuelve con nombre, porción, kcal, proteínas, carbohidratos y grasas, que completan el formulario para revisar antes de guardar.
- La primera vez pide permiso y explica que la foto va a Google y no se guarda.
- Las comidas guardan proteínas, carbohidratos y grasas, y en el Modo Sport Mi día suma las tres contra el plan.
- En el Modo Intuitivo o con TCA, el resultado muestra solo las proporciones del plato, sin números.
- Para activarlo hay que cargar `GEMINI_API_KEY` en Vercel; sin la clave, la app pide registrar a mano. Probado con un servidor que imita a Gemini (no hubo acceso real a Google desde esta sesión).

**Solicitudes de acceso en la web.** La sección final de `netai-web` es un formulario (nombre, correo, WhatsApp opcional, Android o iPhone, modo de interés, mensaje y consentimiento) que llega por correo a musarrajuan99@gmail.com a través de FormSubmit. La primera solicitud dispara un correo de activación que hay que confirmar.

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

### Solo vos podés hacerlo
1. **Datos legales:** responsable, correo de contacto, ciudad y país, en `netai-app/src/components/legal/LegalPage.jsx`. Hoy las páginas de privacidad y términos los muestran como pendientes. Conviene que un abogado revise los textos.
2. **Publicar en Vercel** y cargar las variables (pasos en `lanzamiento.md`).
3. **Clave de Anthropic** con saldo y límite de gasto. La conexión se probó con un servidor que imita a Claude; falta la primera prueba con la clave real.
4. **Activar FormSubmit:** la primera solicitud dispara un correo de activación que hay que confirmar.
5. **Revisión profesional:** que un nutricionista matriculado revise los valores del Modo Sport y los artículos de Aprender.
6. **Dominio** y, más adelante, cuentas de desarrollador de Google Play y App Store.

### Decisiones para después de la beta
- **Cuentas y cobros.** La app no tiene cuentas ni pagos: en la beta todo está habilitado para quien tiene un código. Para cobrar Plus y Pro con cuotas de fotos hacen falta cuentas, un servidor que guarde la suscripción y un medio de pago (Mercado Pago o Stripe en la web; el sistema de cada tienda en las apps).
- **Copia en la nube.** Los registros viven en el teléfono; si se pierde o se cambia, solo se recuperan con la copia descargada desde Ajustes.

### Límites conocidos
- **Recordatorios:** suenan mientras la app está abierta o en segundo plano reciente. Para que lleguen con la app cerrada hacen falta notificaciones desde un servidor (o la app empaquetada para las tiendas).
- **Límite de pedidos a la IA y bloqueo por intentos fallidos:** se cuentan en la memoria de cada servidor. En Vercel frenan abusos simples; el tope real de gasto se pone en la consola de Anthropic.
- **Recetas sin fotos.**
- **NetAI Fit:** solo existe en la web como "en desarrollo".
