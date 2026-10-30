# Plan para conectar NetAI a Google Gemini Flash

Documento de planificación. No incluye código de la app.

> **Estado de la información.** No pude abrir la documentación oficial de Google desde la sesión donde escribí esto (`ai.google.dev` no estaba permitido en la red). Lo que sigue sale de mi conocimiento general. Todo lo que figura en "Por confirmar" hay que comprobarlo en la documentación oficial antes de construir.

## Hallazgo clave: hoy el análisis de fotos es una simulación
En `src/components/FoodScannerModal.jsx` (proyecto NetAI), la función `analyzeMeal` espera un par de segundos con `setTimeout` y devuelve valores fijos. Con texto busca palabras ("pollo", "pizza") y devuelve calorías prefijadas, y la "confianza" del 95 % o 98 % está escrita a mano. No hay ninguna llamada a una IA.

Hasta que esto se reemplace por una llamada real, **no se deben cobrar ni anunciar "análisis por foto con IA"**.

## Problema previo: hoy no hay usuarios
NetAI entra con una **contraseña familiar compartida** y guarda todo en `localStorage`. Eso significa que:
- El servidor no sabe quién es cada persona, así que **no puede contar las 60 o 150 fotos por plan** ni saber quién pagó.
- Cualquiera con la contraseña compartiría la misma cuota.

Para vender Plus y Pro hace falta, como mínimo, una identidad por persona y un estado de suscripción guardado en un servidor. Opciones, de menor a mayor trabajo:

| Opción | Qué es | Ventaja | Inconveniente |
|---|---|---|---|
| **A. Cuentas con correo (enlace mágico)** | Cada persona entra con su correo y recibe un enlace | Simple para el usuario, permite contar el uso | Hay que añadir una base de datos y envío de correos |
| **B. Inicio de sesión de Google o Apple** | Un toque para entrar | Apple lo exige si hay otros inicios de sesión de terceros | Depende de esos servicios |
| **C. Identificador anónimo por dispositivo** | Un código firmado guardado en el teléfono | Sin cuentas, coherente con "datos en tu teléfono" | Se puede perder o copiar, y no sirve para recuperar la suscripción |

Mi recomendación: **A o B**, porque se necesita saber quién pagó para cobrar y para recuperar el plan si se cambia de teléfono. Con la opción C se puede hacer una primera beta, pero no es un sistema de cobro fiable.

## Arquitectura propuesta

```
Teléfono (app)  →  Ruta del servidor en Vercel  →  Gemini API
   foto reducida        valida, cuenta uso            devuelve JSON
```

1. **La app nunca habla directamente con Gemini.** Si la clave estuviera en el teléfono, cualquiera podría robarla y gastar tu dinero.
2. **Una ruta del servidor** (por ejemplo `/api/analizar-plato`, dentro de la estructura de Next.js que ya tienes) recibe la foto, comprueba la identidad y la cuota, llama a Gemini y devuelve el resultado.
3. **La clave de Google** se guarda en las variables de entorno de Vercel, con un nombre como `GEMINI_API_KEY`. **Nunca** con el prefijo `NEXT_PUBLIC_`, porque eso la expondría al navegador.
4. **La ruta queda protegida** por el middleware que ya existe (`middleware.js`). Hay que revisar que su `matcher` cubra también las rutas `/api/` nuevas.

## Pasos

### 1. Cuenta y clave en Google
- Crear una clave en **Google AI Studio**.
- **Por confirmar:** diferencias entre el nivel gratuito y el de pago. En general, los datos del nivel gratuito pueden usarse para mejorar los productos de Google. Como las fotos de comidas son datos personales de salud, **usar el nivel de pago** y leer la política de uso de datos.
- Activar la facturación y **poner un presupuesto máximo con alertas** en Google Cloud, para que un error no genere una factura grande.

### 2. Reducir la foto en el teléfono antes de enviarla
- Reducir a unos 1.024 píxeles por el lado largo y comprimir como JPEG.
- Motivos: ahorra costo, acelera la respuesta y evita el límite de tamaño de las funciones de Vercel (**por confirmar:** hoy es de unos 4,5 MB por petición).

### 3. Ruta del servidor
- Validar el tipo de archivo (solo JPEG o PNG) y el tamaño máximo.
- Comprobar identidad y cuota del plan (ver más abajo).
- Llamar a Gemini con la foto y una instrucción fija.
- Pedir **respuesta en JSON con esquema**, para recibir campos predecibles. **Por confirmar:** nombres exactos de los parámetros en el SDK actual (`@google/genai` es el paquete que recuerdo como el vigente, pero Google ha cambiado de SDK antes).
- Limitar la longitud de la respuesta para controlar el costo.
- No guardar la imagen. Procesarla y descartarla.

### 4. Cambios en la app
- Sustituir la simulación de `analyzeMeal` por una llamada a la ruta del servidor.
- Mostrar estados de carga y error ("No pudimos analizar el plato, probá de nuevo o escribilo a mano").
- Eliminar los porcentajes de "confianza" inventados.
- Mantener siempre la opción de **editar** el resultado y el registro manual.

### 5. Cuotas por plan

| Plan | Fotos al mes |
|---|---|
| Gratis | 0 (o unas pocas de prueba, a decidir) |
| Plus | 60 |
| Pro | 150 |

- El contador vive **en el servidor**, por persona y por mes. Nunca solo en el teléfono.
- Cuando se agota, mensaje amable y sin urgencia: "Llegaste al máximo de fotos de este mes. Podés registrar a mano".
- Poner también un límite por minuto por persona, para evitar abusos.

### 6. Instrucción a la IA, alineada con la marca
La instrucción que se envíe con la foto debe pedir:
- Identificar los alimentos y agruparlos según el **Método del Plato** (vegetales, proteínas, cereales).
- Una porción orientativa en lenguaje común, no en gramos exactos.
- **Sin juicios** ("bueno", "malo", "demasiado") ni consejos de pérdida de peso.
- Calorías y macronutrientes **solo si la persona los quiere ver**, y siempre como estimación, detrás del Modo Intuitivo.
- Un campo de "incertidumbre" para que la app pida confirmación cuando la foto no sea clara.

### 7. Privacidad y tiendas
- Ahora la foto **sale del teléfono hacia Google**. Hay que cambiar en la web y en la app las frases "100 % de tus registros guardados en tu teléfono" y "no se envían a servidores externos".
- Pedir un **consentimiento claro y separado** antes de la primera foto (qué se envía, a quién y para qué).
- Escribir una **política de privacidad** que lo explique.
- **Por confirmar:** las reglas actuales de Apple y Google sobre compartir datos personales con servicios de IA de terceros. Es probable que exijan consentimiento explícito y que lo declares en la ficha de la tienda.
- Revisar las leyes de protección de datos que apliquen, por ejemplo la ley argentina de datos personales, porque son datos de salud.

### 8. Control de costos
- Presupuesto máximo en Google Cloud con alertas por correo.
- Límite de fotos por persona y por mes (arriba).
- Registro de gasto por día para detectar anomalías.
- Un interruptor que permita apagar la función sin publicar una versión nueva.

## Prueba de precisión antes de lanzar
1. Reunir unas **20 fotos de platos argentinos** (milanesa, empanadas, asado, ensalada, guiso, etc.).
2. Probarlas con Flash y con Flash-Lite, usando la misma instrucción.
3. Revisar a mano si identifica los alimentos y si agrupa bien los platos.
4. Elegir el modelo más barato que acierte lo suficiente. Si falla en porciones, probar un modelo más grande.
5. **Por confirmar:** nombres exactos de los modelos vigentes en AI Studio (cambian con frecuencia) y su precio oficial.

## Cálculo orientativo de margen
Con precios de terceros sin confirmar y una foto estándar (unos US$0,003 por análisis), el costo de IA del uso máximo sería de unos US$0,18 en Plus y US$0,45 en Pro. Después de la comisión de las tiendas (15 % a 30 %), quedaría un margen de aproximadamente US$0,50 a US$0,65 en Plus y US$0,95 a US$1,25 en Pro. **Volver a calcularlo con los precios oficiales.**

## Orden sugerido
1. Decidir cómo se identifica cada persona (cuentas A/B/C).
2. Crear la clave, activar facturación y poner presupuesto máximo.
3. Prueba de las 20 fotos con Flash y Flash-Lite.
4. Construir la ruta del servidor y sustituir la simulación.
5. Cuotas por plan y consentimiento de privacidad.
6. Actualizar los textos de la web y de la app.
7. Beta cerrada con pocas personas y control de gasto diario.
8. Lanzar Plus y Pro.

## Pendiente de decidir
- Sistema de identidad (A, B o C).
- Si el plan Gratis incluye algunas fotos de prueba.
- Si las calorías se muestran o solo grupos de alimentos.
- Quién redacta la política de privacidad.
