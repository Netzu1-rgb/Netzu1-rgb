# Herramientas para crear la publicidad de NetAI

> **Estado de la información.** La lista original llegó con los enlaces cortados y con la numeración repetida (dos "9", falta el "5"). Las descripciones de la columna "Qué hace" son las que venían en la lista. **No he abierto los repositorios**, así que hay que confirmar la URL exacta, la licencia y la instalación de cada uno antes de usarlos (columna "Por verificar").

## Resumen

| # | Herramienta | Qué hace (según la lista) | Uso en la publicidad de NetAI | Por verificar |
|---|---|---|---|---|
| 4 | **toprank** (`nowork-studio/…`) | SEO y Google Ads en automático con IA | Palabras clave y textos de anuncios de búsqueda; SEO de la landing | URL completa. Revisar que no cree campañas con gasto sin tu aprobación |
| 6 | **agentic inbox** (`cloudflare/age…`) | Bandeja de entrada inteligente con agentes de IA | Atender consultas de leads y soporte de la app; clasificar respuestas a campañas | URL completa. Necesita cuenta de Cloudflare |
| 7 | **clawrouter** (`mksglu/context…`) | Router de contexto para agentes | Reducir el contexto que consumen los agentes cuando trabajan con la guía de marca y el código | El nombre y la URL no coinciden (`mksglu/context…`). Confirmar cuál es el repo |
| 8 | **camofox browser** (`jo-inc/camofox…`) | Navegador sigiloso para que los agentes naveguen sin bloqueos | Investigar la competencia y los anuncios de otras apps | Respetar los términos de cada sitio. No usarlo para saltarse bloqueos de plataformas publicitarias |
| 9 | **open higgsfield ai** (`Anil-matcha/Op…`) | Generación de vídeo con IA, open source | Clips de ambiente (cocina, mesa, rutinas) para anuncios y Reels | Hardware o API que necesita, licencia de los modelos y uso comercial |
| 10 | **hyperframes** (`heygen-com/hyp…`) | Escribes HTML y obtienes vídeo; pensado para agentes | Anuncios animados con la identidad de NetAI: textos, capturas de la app y logo | URL completa. Encaja con el `render.js` ya existente |
| 9 (2.º) | **agent-skills** (`addyosmani/age…`) | Biblioteca de habilidades para Claude Code | Instalar skills de calidad (revisión, SEO, rendimiento) en este proyecto | Cuáles son relevantes para la landing |

## Cómo encaja cada una

### Creatividad
- **hyperframes**: la opción principal para vídeos de marca. Se escribe HTML con los colores salvia y tierra, las capturas de `AppMockup` y los textos de `marca-netai.md`, y se renderiza a vídeo. Es repetible y versionable en git.
- **open higgsfield ai**: para planos que no se pueden hacer con HTML (manos cocinando, una mesa familiar). Evita cuerpos, básculas o cualquier imagen que apunte al peso.

### Alcance
- **toprank**: búsqueda de pago y SEO. Conviene empezar por SEO de la landing (`src/app/page.jsx`) antes de gastar en Google Ads.
- **agentic inbox**: responde y clasifica los mensajes que lleguen a raíz de la publicidad.

### Investigación y soporte al trabajo
- **camofox browser**: revisar qué comunican otras apps de nutrición.
- **clawrouter**: ahorrar contexto cuando un agente tenga que leer mucho material.
- **agent-skills**: ampliar lo que Claude Code sabe hacer en este repo.

## Antes de instalar cualquiera
1. Abrir el repositorio y confirmar la URL, la licencia y la última actualización.
2. Leer qué permisos y claves pide. No pegues claves de producción de Vercel, Mercado Pago ni ElevenLabs en una herramienta que no hayas revisado.
3. Probar primero con material de ejemplo, no con la cuenta publicitaria real.
4. Todo lo que se genere pasa por la lista de límites éticos de [`marca-netai.md`](marca-netai.md).
