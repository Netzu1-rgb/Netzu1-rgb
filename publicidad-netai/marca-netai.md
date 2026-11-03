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
Planes vigentes en la web (`netai-web/`), en dólares estadounidenses:

| Plan | Precio | Incluye |
|---|---|---|
| Gratis | US$0, para siempre | Registro manual ilimitado, sin análisis por foto |
| Plus | US$0,99/mes | 60 análisis de platos por foto con IA al mes |
| Pro (recomendado) | US$1,99/mes | 150 análisis de platos por foto con IA al mes (unos 5 platos al día) |

Medios de pago: tarjetas, Mercado Pago, transferencia y cripto (USDT). La landing de Next.js todavía muestra los precios anteriores en pesos (`PricingSection.jsx`).

## Público
- Personas que quieren comer mejor sin dietas restrictivas ni culpa.
- Familias que quieren una relación sana con la comida en casa.
- Personas que ya se cansaron de las apps de conteo de calorías.
- Mercado principal: Argentina (hay que usar voseo rioplatense en los textos: "registrá", "descubrí").

## Tono
Cálido, sereno y sin juicios. Nada de urgencia agresiva ni de "antes y después". El README del proyecto usa voseo; la landing usa tuteo. Elige uno por campaña y mantenlo.

## Identidad visual
Sistema compartido por la web (`netai-web/`) y la app (`netai-app/`, en `tailwind.config.js` y `src/components/brand/Plate.jsx`).

**Logo oficial:** una hoja dentro de un recuadro gris, con la palabra NetAI en Outfit (negrita), sobre verde oscuro. Colores del logo: verde `#14412C` y gris `#B5B8BA`. Archivos en `publicidad-netai/marca/`:
- `logo-original.png`: la imagen que mandaste.
- `netai-logo-fondo-verde.png` y `netai-logo-transparente.png`: el logo completo en 1200 × 1200.
- `netai-icono.svg` y `netai-icono-1024.png`: solo el ícono, para la app, las tiendas y las redes.

**Gráfico de la marca:** el Método del Plato (mitad vegetales, un cuarto proteínas, un cuarto cereales). Ya no es el logo, sino la ilustración principal de la web y de la app. Los colores de apoyo salen de esos grupos de alimentos.

| Nombre | Color | Uso |
|---|---|---|
| Verde del logo | `#14412C` | Fondo de marca, logo, superficies oscuras |
| Gris del logo | `#B5B8BA` | Recuadro del ícono y la palabra NetAI sobre verde |
| Hoja | `#2D6A4F` | Botones principales, vegetales |
| Remolacha | `#93385A` | Proteínas en el plato |
| Trigo | `#D9A232` | Cereales en el plato, detalles cálidos |
| Agua | `#3478A8` (oscuro `#19344C`) | Hidratación y NetAI Fit |
| Loza | `#F6F8F4` | Fondo, neutro con un leve tinte verde |
| Tinta | `#1A2A23` | Texto |

**Tipografías (Google Fonts):** Outfit (negrita) solo para la palabra NetAI del logo, Bricolage Grotesque para títulos y Atkinson Hyperlegible para el texto. Atkinson está pensada para leerse fácil; su cero lleva una barra a propósito, para no confundirlo con la letra O.

**NetAI Fit:** mismo estilo de ícono (recuadro gris) con una línea de pulso en azul oscuro en lugar de la hoja. Su color propio es el azul agua.

**Reglas de diseño:**
- Una sola pieza llamativa por pantalla: el plato como ilustración.
- Sin etiquetas en mayúsculas sobre los títulos, sin numerar secciones que no son una secuencia y sin resaltar una palabra del título.
- Animación solo cuando aporta: el plato se arma una vez al cargar la web y el teléfono cambia de pantalla en "Un día". Siempre se respeta el movimiento reducido.
- Activos: `netai-web/assets/img/netai-icon.svg`, `netai-web/assets/img/netai-fit-icon.svg`, `netai-app/public/icons/`.

## Modo Sport
NetAI tiene dos modos. **Bienestar** (el principal) sigue siendo neutral al peso. **Modo Sport** es opcional, para deportistas mayores de 18: objetivo de bajar de peso, subir masa muscular, recomposición o rendimiento, con energía, proteínas, carbohidratos, grasas, agua y seguimiento de peso. Límites: déficit de hasta 15 % (máximo 500 kcal por día), nunca por debajo del gasto en reposo ni de 1.500 kcal, ritmo de 0,5 a 1 % del peso por semana, peso objetivo dentro de un rango saludable para la altura, y no disponible para quien indica un trastorno de la conducta alimentaria.

En anuncios del Modo Sport se puede hablar de objetivos de peso o de masa muscular, siempre con ritmo seguro y sin promesas de resultados. Siguen prohibidos el "antes y después", los cuerpos como trofeo, los plazos ("bajá 10 kg en un mes") y las palabras de culpa.

## Límites éticos (obligatorios en todo anuncio)
La app prohíbe estos conceptos en su propio texto, y los anuncios deben respetarlo igual:

| No usar | Usar en su lugar |
|---|---|
| "Bajar de peso", "adelgazar", "quemar grasa" (salvo en piezas del Modo Sport, con ritmo seguro) | Bienestar diario, vitalidad, salud integral |
| "Comida trampa" | Alimentos de consumo ocasional |
| Alimentos "buenos" o "malos" | Nutrientes de consumo habitual o recreativos |
| "Calorías excedidas", "meta fallada" | Balance de energía flexible |
| Rojo de alerta, imágenes de cuerpos, básculas, medidas o "antes y después" | Paleta salvia, comida, mesa compartida, rutinas cotidianas |

Reglas adicionales:
- No prometas resultados de salud ni de peso.
- NetAI no sustituye a un profesional. Incluye el descargo médico del `Footer` en las landing de campaña y una mención corta en los anuncios que lo permitan.
- Publicidad en Meta, Google y TikTok: las plataformas restringen anuncios de salud y peso. Revisa sus políticas antes de pagar una campaña.
