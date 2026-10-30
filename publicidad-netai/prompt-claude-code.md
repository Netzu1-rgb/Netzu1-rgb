# Prompt para Claude Code

Copia el bloque de abajo en una sesión nueva de Claude Code, abierta en la carpeta del repo `Netzu1-rgb`.

````text
Contexto
Soy el dueño de NetAI, una plataforma de nutrición consciente (enfoque neutral al peso y anti-TCA, guías GAPA de Argentina). Está hecha en Next.js 14 (landing pública, acceso familiar por contraseña y una PWA privada con datos en localStorage). Quiero lanzarla en App Store y Play Store, sumar una app de gimnasio llamada NetAI Fit, y hacer la publicidad con IA.

Lee primero, en este orden, lo que ya está en el repo:
1. publicidad-netai/README.md (índice)
2. publicidad-netai/marca-netai.md (marca, tono, colores y límites éticos)
3. publicidad-netai/netai-fit.md (objetivos, funciones, vínculo entre las apps, beneficios cruzados)
4. publicidad-netai/rea-y-opciones-de-app.md (opciones para construir la app)
5. publicidad-netai/herramientas.md y flujo-de-trabajo.md (herramientas de publicidad)
6. netai-web/README.md (la web estática ya creada)

Reglas que no se negocian
- Lenguaje ético: nada de "bajar de peso", "adelgazar", "quemar grasa", "comida trampa", alimentos "buenos o malos", rojo de alerta, imágenes de cuerpos, básculas ni "antes y después". Piso de 1.500 kcal, sin compensar la comida con ejercicio.
- Motivación sin presión: sin rachas que se pierdan, sin rankings ni comparaciones.
- Respetar prefers-reduced-motion en todas las animaciones.
- Privacidad: los datos se quedan en el teléfono salvo que el usuario decida compartirlos.
- No inventes datos: precios, fechas, enlaces, estudios ni referencias. Si falta algo, déjalo marcado como pendiente y pregúntame.
- Las rutinas de NetAI Fit solo pueden citar fuentes reales (revisiones en PubMed, guías de la OMS) y deben quedar marcadas para revisión de un profesional del ejercicio.
- No copies código ni recursos de otras apps. Para estudiar a la competencia, usa la app como usuario, sus fichas de tienda y sus reseñas. REA (morluto/rea) solo para entender la arquitectura de webs públicas y sin saltarte términos de uso.

Estado actual
- Hecho: guía de marca, planificación de NetAI Fit, comparación de opciones de app y la web estática netai-web/ (HTML, CSS y JS sin build, con .htaccess para Hostinger).
- Pendiente de mi parte: la URL pública de NetAI en Vercel, el servicio de formularios para la lista de espera, la fecha de la beta, el % de descuento y los enlaces de las tiendas. Se rellenan en netai-web/lib/manifest.js.
- Decidido: el nombre es NetAI Fit. La primera versión será NetAI con una pestaña "Mover" y Capacitor para llegar a las tiendas. Pasar a Expo solo si Fit se convierte en el centro del producto.

Qué quiero que hagas ahora (en este orden, pidiéndome confirmación antes de cada paso grande)
1. Revisa netai-web/ y dime qué mejorarías, sin cambiar nada todavía.
2. Prepara el plan técnico de la primera versión con Capacitor: qué hay que cambiar en el Next.js actual (rutas de API y middleware que necesitan servidor, funciones nativas como notificaciones y Apple Salud / Health Connect, política de privacidad, pagos de iOS) y los riesgos de rechazo de Apple. Entrégalo como documento en publicidad-netai/, sin escribir código de la app.
3. Haz una plantilla publicidad-netai/competidores-gym.md con una ficha por app de gimnasio (funciones, precio, nota en tiendas, 5 quejas y 5 elogios de las reseñas, cómo trata la dieta y el peso) y una tabla contra las 12 funciones de NetAI Fit. Pregúntame qué apps incluir.
4. Propón 5 piezas de publicidad (guion, texto, formato) que cumplan las reglas éticas, reutilizando el pipeline de youtube-shorts/ si encaja.

Forma de trabajar
- Responde en español, con tono claro y sin tecnicismos innecesarios.
- Trabaja en la rama claude/youthful-euler-s5160b, haz commits pequeños con mensajes descriptivos y no abras pull request salvo que te lo pida.
- Si algo es ambiguo o depende de una decisión mía, pregunta antes de seguir.
````
