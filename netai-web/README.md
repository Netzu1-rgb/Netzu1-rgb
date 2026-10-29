# Web de NetAI y NetAI Fit

Web estática de una sola página (HTML, CSS y JavaScript, sin `npm` ni build) que presenta las dos apps y explica cómo instalarlas. Creada siguiendo la skill `adrian-saenz-hostinger-premium-website`, con el estilo "Editorial Light Cream" y la paleta salvia y tierra de NetAI.

## Qué hay que rellenar antes de publicar
Todo está en `lib/manifest.js`. Mientras un dato esté vacío, la web lo muestra como "Próximamente" y no inventa nada.

| Campo | Qué poner | Si está vacío |
|---|---|---|
| `apps.netai.url` | Dirección pública de NetAI en Vercel (por ejemplo `https://…/app`) | El botón dice "Próximamente" |
| `apps.fit.url` | Dirección de NetAI Fit cuando exista la beta | Igual |
| `stores.appStore` / `stores.playStore` | Enlaces a las fichas de las tiendas | Las insignias salen apagadas |
| `waitlistEndpoint` | Dirección de un servicio de formularios (Formspree, Getform…) que reciba un POST con `email` y `app` | Se oculta el formulario y sale "Muy pronto abrimos la lista de espera" |
| `betaDate` | Texto libre, por ejemplo `15 de diciembre` | Sale "Fecha por confirmar" |

Una web estática no puede guardar correos por sí sola, por eso la lista de espera necesita ese servicio externo.

## Publicar en Hostinger
1. Sube **el contenido** de esta carpeta (incluido `.htaccess`, que es un archivo oculto) a `public_html`.
2. Cada vez que cambies `styles.css` o `main.js`, sube el número `?v=AAAAMMDD` en `index.html`.
3. Si el plan usa Nginx, el `.htaccess` no se aplica: basta con subir el `?v=` en cada cambio.

## Decisiones respecto a la skill
- No usa GSAP ni Lenis: el contenido se ve igual sin ellos y hay menos cosas que puedan fallar.
- **Respeta `prefers-reduced-motion`** en todas las animaciones, porque es una app de bienestar. La skill recomienda lo contrario para las microinteracciones.
- Los teléfonos del encabezado están dibujados en HTML y CSS. El de NetAI Fit está marcado como "vista previa", porque la app todavía no existe.

## Probar en local
```bash
cd netai-web
python3 -m http.server 8765
```
Abre `http://localhost:8765/`.
