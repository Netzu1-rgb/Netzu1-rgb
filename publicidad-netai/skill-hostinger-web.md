# Skill `adrian-saenz-hostinger-premium-website`

Archivo recibido: `adrian-saenz-hostinger-premium-website.zip`. Es una **skill de Claude Code** (instrucciones, scripts y referencias), no una app ni una librería. Revisé `SKILL.md`, `recommended-settings.json` y los scripts.

## Qué hace
Genera webs **estáticas** (HTML, CSS y JavaScript sin framework ni `npm`) listas para subir por FTP a Hostinger u otro hosting. Apunta a un nivel visual "premium": animaciones con GSAP, efectos 3D y desplazamiento narrativo. Incluye 10 arquetipos visuales, un catálogo de más de 40 efectos, una lista de errores conocidos, la configuración de caché (`.htaccess`) y un verificador de proyecto.

## Contenido
| Carpeta o archivo | Para qué sirve |
|---|---|
| `SKILL.md` | Punto de entrada: flujo de conversación y reglas |
| `reference/01` a `10` | Convenciones, arquetipos, efectos, errores conocidos, imágenes, despliegue |
| `scripts/` | Descarga de librerías (GSAP, Lenis, Three.js desde unpkg), imágenes libres de Openverse, conversión a WebP y verificador |
| `templates/htaccess.template` | Configuración de caché para Hostinger |
| `recommended-settings.json` | Permisos opcionales para trabajar sin avisos |

## Revisión de seguridad
Los scripts revisados solo descargan de `unpkg.com` y `api.openverse.org`, y `webp_convert.py` instala `pillow` con `pip`. No vi nada que borre archivos fuera de su carpeta ni envíe datos. `recommended-settings.json` no pre-autoriza nada destructivo, pero **no lo copies** a tu configuración sin necesidad: es mejor aprobar cada paso.

## Encaje con NetAI

**Sirve para:** una web estática de lanzamiento, con la cuenta atrás de la beta, la lista de espera y la presentación de NetAI Fit.

**No sirve para:** la app en sí. La propia skill indica que no es para aplicaciones con servidor o base de datos, y prohíbe frameworks. Tu app usa Next.js, así que esta skill no reemplaza ese código.

| Punto | Detalle |
|---|---|
| Arquetipo adecuado | **Editorial Light Cream**, indicado para bienestar y estilo de vida pausado. Encaja con los colores salvia y tierra de NetAI |
| Lista de espera | Una web estática no guarda correos. Hace falta un servicio de formularios o la API de Vercel |
| Movimiento | Las animaciones intensas contradicen el tono sereno de NetAI. Usar pocas y suaves |
| Accesibilidad | La skill recomienda **no** respetar `prefers-reduced-motion` en microinteracciones. Para una app de bienestar conviene respetarlo siempre |
| Dos sitios | Si la landing de lanzamiento es aparte de la que ya existe en Next.js, hay que mantener ambas coherentes |

## Recomendación
Usarla solo para una **landing de la beta** (opción rápida, sin tocar el código de la app), con el arquetipo Editorial Light Cream y animaciones sobrias. Si prefieres una única web, es mejor mejorar la landing actual de Next.js.
