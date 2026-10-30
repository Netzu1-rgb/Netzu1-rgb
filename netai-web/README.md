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

## Secciones
1. Encabezado con titular animado palabra por palabra, fondo de degradado suave y dos teléfonos con parallax.
2. Cinta con los principios de la marca.
3. Las dos apps, con estado (disponible / beta) e insignias de tiendas.
4. Cifras del producto (contadores).
5. **Un día con las dos apps**: efecto firma. El teléfono queda fijo y cambia de pantalla a medida que bajás por los pasos.
6. Mejor juntas (bento con el pack de lanzamiento).
7. Filosofía: comparación con las apps de dieta tradicionales.
8. Precios en US$: Gratis (registro ilimitado, sin fotos), Plus US$0,99/mes (60 fotos) y Pro US$1,99/mes (150 fotos).
9. Cómo instalar, con pestañas Android / iPhone.
10. Preguntas frecuentes.
11. Lista de espera y pie con aviso de salud.

## Decisiones respecto a la skill
- No usa GSAP ni Lenis: todos los efectos son CSS y JavaScript propio, con un solo bucle de scroll. Hay menos cosas que puedan fallar.
- **Respeta `prefers-reduced-motion`** en todas las animaciones, porque es una marca de bienestar. La skill recomienda lo contrario para las microinteracciones.
- Sin cursor personalizado ni pantalla de carga: no aportan a una web de salud y pueden parecer errores.
- Los teléfonos están dibujados en HTML y CSS. Las pantallas de NetAI Fit son una vista previa, porque la app todavía no existe.
- Funciona sin JavaScript: todo el contenido se ve, solo se pierden las animaciones.

## Probar en local
```bash
cd netai-web
python3 -m http.server 8765
```
Abre `http://localhost:8765/`.
