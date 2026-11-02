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
1. Encabezado con el plato del Método del Plato, que se arma una vez al cargar.
2. Las dos apps, lado a lado, con su estado (disponible o en desarrollo) e insignias de tiendas.
3. **Un día con las dos apps:** el teléfono queda fijo y cambia de pantalla a medida que bajás por los pasos.
4. Mejor juntas y pack de lanzamiento.
5. Lo que no vas a encontrar en NetAI (tabla comparativa).
6. Planes en US$: Gratis (registro ilimitado, sin fotos), Plus US$0,99/mes (60 fotos) y Pro US$1,99/mes (150 fotos).
7. Cómo instalar, con pestañas Android / iPhone.
8. Preguntas frecuentes.
9. Lista de espera y pie con aviso de salud.

## Diseño
- Mismo sistema visual que la app: colores de los grupos del plato, Bricolage Grotesque y Atkinson Hyperlegible. Detalle en `../publicidad-netai/marca-netai.md`.
- Rediseñada siguiendo la skill `frontend-design` de Anthropic: sin etiquetas en mayúsculas, sin numeración decorativa, sin animaciones de aparición en cada sección.
- Sin librerías externas: todo es CSS y JavaScript propio. Funciona sin JavaScript (se pierden solo las animaciones) y respeta el movimiento reducido.
- El `.htaccess` y el `?v=AAAAMMDD` de la skill de Hostinger se mantienen para la caché.

## Probar en local
```bash
cd netai-web
python3 -m http.server 8765
```
Abre `http://localhost:8765/`.
