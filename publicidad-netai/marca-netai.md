# Marca NetAI: guía para la publicidad

## Qué es
Plataforma web y PWA de nutrición ética con enfoque **neutral al peso y anti-TCA**. Sigue las Guías Alimentarias para la Población Argentina (GAPA) y la Alimentación Intuitiva. Funciona en Android e iOS, se instala sin tienda de apps y guarda los datos en el propio móvil.

Tiene una landing pública (`/`), un acceso familiar por contraseña (`/login`) y la app privada (`/app`) con tres pestañas: **Mi Día**, **Inspiración de Comidas** y **Aprender**.

## Propuesta de valor (textos de la landing)
- Titular: *"Nutrición con paz mental, sin obsesiones ni dietas restrictivas."*
- Subtítulo: una relación amable con tu alimentación, con rangos flexibles o con el Modo Intuitivo, sin contar un solo número.
- Sellos de confianza: Espacio seguro anti-TCA · Rangos biológicos seguros · Guías GAPA y evidencia.

## Funciones que se pueden mostrar en un anuncio
| Función | Mensaje corto |
|---|---|
| Registro consciente de energía | Rangos flexibles (ej. 1.900–2.200 kcal), sin números rojos ni alertas punitivas |
| Modo Intuitivo | Un toque apaga todos los números y calorías de la app |
| Escala de saciedad (1–10) | Anota tu hambre antes de comer y tu plenitud después |
| Método del Plato | 50 % vegetales, 25 % proteínas, 25 % cereales, sin alimentos prohibidos |
| Hidratación consciente | 8 vasos al día, según GAPA |
| Educación | Distinguir hambre física de hambre emocional |
| Privacidad | Los registros se quedan en tu teléfono (`localStorage`) |
| Plan Familiar | Hasta 5 personas, cada una con sus datos privados |
| Idiomas | La app incluye selector de idiomas (`src/i18n/`), útil para anuncios en varios mercados |

## Precios (para anuncios con oferta)
Los precios salen de `PricingSection.jsx`. Compruébalos antes de publicar, porque pueden haber cambiado.

| Plan | Precio |
|---|---|
| Mensual | $4.990 ARS/mes (aprox. 4,99 USD) |
| Semestral (el más elegido, ahorro 25 %) | $3.740 ARS/mes, facturado cada 6 meses ($22.440 ARS) |
| Familiar (hasta 5 personas) | $8.990 ARS/mes |

Medios de pago: tarjetas, Mercado Pago, transferencia y cripto (USDT).

## Público
- Personas que quieren comer mejor sin dietas restrictivas ni culpa.
- Familias que quieren una relación sana con la comida en casa.
- Personas que ya se cansaron de las apps de conteo de calorías.
- Mercado principal: Argentina (hay que usar voseo rioplatense en los textos: "registrá", "descubrí").

## Tono
Cálido, sereno y sin juicios. Nada de urgencia agresiva ni de "antes y después". El README del proyecto usa voseo; la landing usa tuteo. Elige uno por campaña y mantenlo.

## Identidad visual (de `tailwind.config.js`)
- **Salvia** (verde): `#538974` (500), `#3e6d5b` (600), `#e1ede6` (100). Es el color principal.
- **Tierra** (beige/marrón): `#f4efe8` (100), `#ad917a` (500).
- **Océano** (azul suave) y **lavanda** como acentos.
- Fondo claro `#faf9f7`, texto en gris piedra. Tipografía del sistema (`system-ui`).
- Activos: `public/icons/icon-512.svg`, `public/icons/icon-192.svg`, `src/assets/hero.png`.

## Límites éticos (obligatorios en todo anuncio)
La app prohíbe estos conceptos en su propio texto, y los anuncios deben respetarlo igual:

| No usar | Usar en su lugar |
|---|---|
| "Bajar de peso", "adelgazar", "quemar grasa" | Bienestar diario, vitalidad, salud integral |
| "Comida trampa" | Alimentos de consumo ocasional |
| Alimentos "buenos" o "malos" | Nutrientes de consumo habitual o recreativos |
| "Calorías excedidas", "meta fallada" | Balance de energía flexible |
| Rojo de alerta, imágenes de cuerpos, básculas, medidas o "antes y después" | Paleta salvia, comida, mesa compartida, rutinas cotidianas |

Reglas adicionales:
- No prometas resultados de salud ni de peso.
- NetAI no sustituye a un profesional. Incluye el descargo médico del `Footer` en las landing de campaña y una mención corta en los anuncios que lo permitan.
- Publicidad en Meta, Google y TikTok: las plataformas restringen anuncios de salud y peso. Revisa sus políticas antes de pagar una campaña.
