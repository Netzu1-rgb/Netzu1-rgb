# Textos para las fichas de las tiendas

Borrador para Google Play y App Store. Sigue la guía de `marca-netai.md`: sin promesas de resultados, sin "antes y después" y sin culpa. Revisá los límites de caracteres vigentes en cada tienda antes de cargar.

## Nombre
NetAI: nutrición consciente

## Descripción corta
Registrá tus comidas sin culpa. Con Método del Plato, Modo Intuitivo y Modo Sport.

## Descripción larga

NetAI te ayuda a comer mejor sin dietas ni culpa.

Registrá lo que comés en segundos, escribiendo o con una foto del plato. Llevá la cuenta del agua, anotá cómo llegaste de hambre y cómo quedaste, y mirá tu semana y tu mes de un vistazo.

Dos modos, vos elegís:

• Bienestar. Neutral al peso: la app no muestra tu peso ni te propone metas de peso. Con el Modo Intuitivo podés ocultar todos los números y guiarte por las proporciones del plato.

• Modo Sport. Para deportistas mayores de 18. Un plan de energía, proteínas, carbohidratos, grasas y agua según tu objetivo: bajar de peso, subir masa muscular, recomposición o rendimiento. Con límites de seguridad y seguimiento del peso semana a semana.

Qué incluye:
• Foto del plato: la IA estima kcal, proteínas, carbohidratos y grasas, y vos revisás antes de guardar.
• Ideas para hoy: sugerencias de comidas según tu alimentación y tus alergias.
• Método del Plato, recetas y artículos de alimentación consciente.
• Favoritas y frecuentes para registrar con un toque.
• Horarios de comidas y recordatorios.
• Informe del mes y exportación de tu historial.
• Tema claro y oscuro.
• Funciona sin conexión.

Tus registros se guardan en tu teléfono. Podés descargar una copia o borrar todo cuando quieras.

NetAI no reemplaza la consulta con profesionales de la salud. Los valores que estima la IA son aproximados.

## Categoría y clasificación
- Categoría: Salud y bienestar.
- Clasificación por edad: completar el cuestionario de cada tienda. El Modo Sport es solo para mayores de 18.

## Capturas
`publicidad-netai/tiendas/`, en este orden: 01 Mi día, 02 Comidas, 03 Semana, 04 Mes, 05 Método del Plato, 06 Modo Intuitivo, 07 Modo Sport, 08 Peso en Sport, 09 a 12 Tema oscuro.

## Qué declarar sobre los datos

Base para "Seguridad de los datos" (Google Play) y "Etiquetas de privacidad" (Apple). Confirmalo con la política de privacidad final.

| Dato | Dónde queda | Se comparte |
|---|---|---|
| Perfil (nombre, edad, sexo, altura, peso, actividad, alimentación) | En el teléfono | No |
| Registros de comidas, agua, hambre, saciedad y peso | En el teléfono | No |
| Foto del plato | No se guarda | Se envía a Anthropic (Claude) para analizarla, con permiso previo |
| Pedido de sugerencias (momento del día, alimentación, alergias) | No se guarda | Se envía a Anthropic (Claude), sin el nombre |
| Solicitud de acceso (nombre, correo, WhatsApp opcional) | Llega por correo al responsable | Pasa por FormSubmit |

La app no tiene publicidad ni rastreadores.
