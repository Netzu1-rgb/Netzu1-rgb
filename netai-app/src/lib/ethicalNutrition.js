/**
 * NetAI - Módulo de Nutrición Consciente y Ética (Weight-Neutral / Anti-TCA)
 * Basado en las Guías Alimentarias para la Población Argentina (GAPA) y Principios de Alimentación Intuitiva.
 */

// Límite inferior ético infranqueable: Ninguna persona debe recibir pautas inferiores a 1500 kcal
export const MINIMUM_SAFE_ENERGY_FLOOR = 1500;

// Rango flexible por defecto (±150 kcal para evitar obsesión con números exactos)
export const DEFAULT_ENERGY_RANGE = {
  min: 1900,
  max: 2200,
  targetLabel: '1.900 - 2.200 kcal de bienestar',
};

// Escala de Hambre y Saciedad (1 al 10) orientada al autoconocimiento
export const HUNGER_SATIETY_SCALE = [
  { level: 1, label: 'Vacío extremo', desc: 'Debilidad o mareo. Conviene no llegar a este punto planificando colaciones.', zone: 'attention' },
  { level: 2, label: 'Hambre voraz', desc: 'Gran urgencia por comer. Comer con lentitud para recuperar confort.', zone: 'attention' },
  { level: 3, label: 'Hambre moderada', desc: 'Momento ideal para iniciar la comida con presencia y disfrute.', zone: 'ideal' },
  { level: 4, label: 'Apetito incipiente', desc: 'Señales sutiles en el estómago.', zone: 'ideal' },
  { level: 5, label: 'Neutral', desc: 'Ni hambre ni saciedad. Estado de equilibrio.', zone: 'neutral' },
  { level: 6, label: 'Ligeramente satisfecho', desc: 'El cuerpo recibió suficiente energía.', zone: 'ideal' },
  { level: 7, label: 'Cómodamente saciado', desc: 'Momento óptimo para finalizar la comida sin pesadez.', zone: 'ideal' },
  { level: 8, label: 'Lleno', desc: 'Sensación de abundancia. Totalmente normal en reuniones sociales o festivas.', zone: 'normal' },
  { level: 9, label: 'Pesadez', desc: 'Un poco de incomodidad estomacal. Ocasión para observar con amabilidad.', zone: 'attention' },
  { level: 10, label: 'Saturación', desc: 'Sobrecarga física. Descansar, hidratarse con agua y no culpabilizarse.', zone: 'attention' },
];

// Método del Plato Consciente (GAPA & Harvard)
export const PLATE_METHOD_SECTIONS = [
  {
    id: 'vegetables',
    name: 'Vegetales y Frutas',
    percentage: 50,
    color: 'from-emerald-400 to-sage-500',
    description: 'Aportan fibra prebiótica, agua, antioxidantes y micronutrientes esenciales.',
    tips: ['Incorporá colores variados (verde, rojo, naranja, violeta)', 'Crudos o cocidos al vapor, asados o en guisados'],
    examples: 'Tomate, hojas verdes, calabaza, zanahoria, brócoli, pimientos, manzana, frutas de estación.',
  },
  {
    id: 'protein',
    name: 'Proteínas de Calidad',
    percentage: 25,
    color: 'from-amber-400 to-earth-500',
    description: 'Estructura muscular, defensas inmunes y sensación de saciedad prolongada.',
    tips: ['Alterná fuentes animales y vegetales', 'Las legumbres son económicas y ricas en fibra'],
    examples: 'Huevos, lentejas, garbanzos, porotos, pescado, pechuga de pollo, tofu, yogur natural, quesos magros.',
  },
  {
    id: 'carbs',
    name: 'Carbohidratos Complejos',
    percentage: 25,
    color: 'from-sky-400 to-ocean-500',
    description: 'La principal fuente de energía limpia para el cerebro y el movimiento diario.',
    tips: ['Priorizá granos enteros sobre harinas refinadas', 'Conservan su cáscara con vitaminas del complejo B'],
    examples: 'Arroz integral o yamaní, avena, quinoa, fideos integrales, papa con cáscara, batata, choclo, pan masa madre.',
  },
];

// Catálogo curado de recetas conscientes, nutritivas y accesibles
export const RECIPES_CATALOG = [
  {
    id: 'rec-01',
    title: 'Bowl de Quinoa, Calabaza Asada y Lentejas',
    category: 'Almuerzo / Cena',
    time: '25 min',
    budget: 'Económico',
    tags: ['Vegetariano', 'Rico en fibra', 'GAPA'],
    energyEstimate: '480 - 540 kcal',
    plateBalance: { veg: 50, prot: 25, carb: 25 },
    description: 'Plato cálido y reconfortante que combina la textura suave de la calabaza asada con el toque crocante de semillas y la fibra saciante de las lentejas.',
    ingredients: [
      '1 taza de calabaza en cubos horneada con oliva y romero',
      '1/2 taza de lentejas cocidas (o en conserva enjuagada)',
      '1/2 taza de quinoa cocida',
      '1 taza de espinacas tiernas o rúcula fresca',
      '1 cda de semillas de girasol tostadas',
      'Aderezo: aceite de oliva virgen, jugo de limón y sal marina',
    ],
    instructions: [
      'Disponer las hojas verdes frescas como base en un bowl.',
      'Añadir la quinoa cocida y las lentejas a temperatura ambiente.',
      'Incorporar los cubos de calabaza asada tibia.',
      'Coronar con las semillas tostadas y rociar con el aderezo de oliva y limón.',
    ],
    mindfulNote: 'Observá la variedad de texturas y colores antes de comer. Disfrutá el contraste térmico entre la calabaza tibia y las hojas frescas.',
  },
  {
    id: 'rec-02',
    title: 'Omelette Campestre con Tomates Cherry y Espinaca',
    category: 'Desayuno / Cena',
    time: '12 min',
    budget: 'Muy Accesible',
    tags: ['Rápido', 'Proteína Completa', 'Sin Gluten'],
    energyEstimate: '380 - 430 kcal',
    plateBalance: { veg: 45, prot: 35, carb: 20 },
    description: 'Una opción express y equilibrada con huevos de campo, vegetales frescos y tostada de masa madre.',
    ingredients: [
      '2 huevos grandes de campo',
      '1 taza de espinacas frescas picadas',
      '6 tomates cherry cortados al medio',
      '1 feta fina de queso fresco o por salut',
      '1 rebanada de pan de masa madre o integral',
      '1 cdita de aceite de oliva',
    ],
    instructions: [
      'Saltear en sartén caliente con oliva los tomates cherry y la espinaca hasta marchitar levemente (2 min).',
      'Batir los dos huevos con una pizca de sal marina, pimienta y orégano.',
      'Verter sobre los vegetales, agregar el queso en trozos y doblar a la mitad.',
      'Servir junto a la tostada tibia.',
    ],
    mindfulNote: 'El huevo aporta colina para la función cognitiva. Masticá despacio y sentí la suavidad del queso fundido.',
  },
  {
    id: 'rec-03',
    title: 'Guiso Mediterráneo de Garbanzos y Pimientos',
    category: 'Almuerzo',
    time: '30 min',
    budget: 'Familiar',
    tags: ['Legumbres', 'Apto Vegano', 'Olla Única'],
    energyEstimate: '520 - 580 kcal',
    plateBalance: { veg: 50, prot: 25, carb: 25 },
    description: 'Guiso aromático tradicional lleno de micronutrientes, licopeno de los tomates y la energía sostenida del garbanzo.',
    ingredients: [
      '1 taza y media de garbanzos cocidos',
      '1 pimiento rojo picado',
      '1 zanahoria cortada en rodajas finas',
      '1 taza de puré de tomate natural triturado',
      '1 diente de ajo y 1/2 cebolla picada',
      'Pimentón dulce ahumado, laurel y aceite de oliva',
    ],
    instructions: [
      'Sofreír la cebolla, ajo, zanahoria y pimiento con aceite de oliva por 6 minutos.',
      'Añadir el pimentón dulce y remover rápidamente para que no se queme.',
      'Incorporar el tomate triturado, una hoja de laurel y 1/2 taza de caldo o agua.',
      'Sumar los garbanzos, bajar el fuego y cocinar tapado durante 18 minutos.',
    ],
    mindfulNote: 'Las comidas de olla estimulan el sentido del olfato y reconectan con la calidez del hogar. Comé sentado sin pantallas.',
  },
  {
    id: 'rec-04',
    title: 'Pescado Blanco al Papillote con Vegetales de Estación',
    category: 'Cena',
    time: '20 min',
    budget: 'Medio',
    tags: ['Omega 3', 'Ligero', 'GAPA'],
    energyEstimate: '410 - 470 kcal',
    plateBalance: { veg: 55, prot: 30, carb: 15 },
    description: 'Cocción al vapor dentro de papel manteca que conserva todos los jugos, minerales y aromas naturales sin grasas añadidas.',
    ingredients: [
      '1 filete de merluza, abadejo o lenguado fresco (180g)',
      '1/2 zucchini cortado en bastones finos',
      '1/2 zanahoria en juliana',
      '4 rodajas de limón',
      '1 papa mediana hervida previamente en rodajas',
      'Hierbas frescas: eneldo, tomillo y aceite de oliva',
    ],
    instructions: [
      'Precalentar el horno a 200°C.',
      'Extender papel manteca o aluminio y colocar como base la papa y los vegetales.',
      'Ubicar el filete encima, salpimentar y colocar las rodajas de limón e hierbas.',
      'Cerrar el paquete sellando los bordes herméticamente y hornear por 15 minutos.',
    ],
    mindfulNote: 'Al abrir el paquete en tu plato, inhalá profundamente el aroma concentrado antes del primer bocado.',
  },
  {
    id: 'rec-05',
    title: 'Bowl de Avena Trasnochada (Overnight Oats) con Frutas y Nueces',
    category: 'Desayuno / Merienda',
    time: '5 min (preparación previa)',
    budget: 'Económico',
    tags: ['Prebióticos', 'Sin Cocción', 'Desayuno Express'],
    energyEstimate: '390 - 450 kcal',
    plateBalance: { veg: 40, prot: 20, carb: 40 },
    description: 'Preparación fría que fermenta levemente la avena durante la noche, mejorando la digestibilidad y disponibilidad mineral.',
    ingredients: [
      '1/2 taza de avena arrollada gruesa',
      '3/4 taza de leche o bebida vegetal fortificada con calcio',
      '1 cda de semillas de chía',
      '1/2 manzana rallada o frutos rojos frescos',
      '4 mitades de nuez picadas',
      'Pizca de canela en polvo y miel o extracto de vainilla',
    ],
    instructions: [
      'Mezclar en un frasco o bowl la avena, semillas de chía, canela y leche.',
      'Tapar y refrigerar durante toda la noche (o al menos 4 horas).',
      'Al momento de consumir, coronar con la fruta fresca y las nueces crocantes.',
    ],
    mindfulNote: 'La avena y las semillas de chía aportan mucílagos que nutren suavemente la microbiota intestinal.',
  },
  {
    id: 'rec-06',
    title: 'Tarta Casera de Acelga, Ricota y Masa de Semillas',
    category: 'Almuerzo / Cena',
    time: '35 min',
    budget: 'Familiar',
    tags: ['Calcio', 'Hierro', 'Para Compartir'],
    energyEstimate: '460 - 510 kcal',
    plateBalance: { veg: 50, prot: 25, carb: 25 },
    description: 'Un clásico de los hogares rioplatenses, adaptado con ricota magra cremosa y masa integral con semillas.',
    ingredients: [
      '1 atado grande de acelga fresca lavada y cocida al vapor',
      '200g de ricota fresca',
      '2 huevos para ligar',
      '1 cebolla rehogada',
      '1 masa para tarta casera de harina integral y semillas',
      'Nuez moscada, sal marina y pimienta negra',
    ],
    instructions: [
      'Escurrir muy bien la acelga y picarla finamente.',
      'Mezclar con la ricota, la cebolla rehogada, condimentos y los dos huevos batidos.',
      'Forrar una tartera con la masa integral, verter el relleno y emparejar.',
      'Hornear a 180°C por 25 a 30 minutos hasta dorar la superficie.',
    ],
    mindfulNote: 'Compartir una tarta casera en familia refuerza el valor vincular y afectivo del acto de comer.',
  },
];

// Artículos breves de psicoeducación alimentaria (GAPA & Alimentación Intuitiva)
export const EDUCATION_ARTICLES = [
  {
    id: 'edu-01',
    title: 'Hambre Física vs. Hambre Emocional',
    subtitle: 'Aprender a escuchar a tu cuerpo sin juzgarte',
    readTime: '3 min',
    category: 'Autoconocimiento',
    summary: 'El hambre física es gradual, siente en el estómago y se satisface con cualquier comida nutritiva. El hambre emocional suele ser repentina y busca confort específico.',
    content: [
      'El hambre es una señal biológica vital tan natural como tener sed o sueño. No es un enemigo al que debas engañar o silenciar.',
      'El hambre física se desarrolla de manera progresiva y se calma cuando comés lo suficiente. Podés sentir un vacío en el estómago o falta de concentración.',
      'El hambre emocional responde a estados anímicos: estrés, aburrimiento, soledad o cansancio. No está "mal" comer por placer o consuelo; la clave es identificar qué emoción está presente y darte contención amorosa sin recurrir exclusivamente a la comida.',
    ],
    actionableTip: 'Antes de abrir la heladera, hacé una pausa de 3 respiraciones profundas y preguntate con ternura: "¿Qué necesita mi cuerpo y mi mente en este momento?".',
  },
  {
    id: 'edu-02',
    title: 'El Mito del "Día Trampa" y la Prohibición',
    subtitle: 'Por qué categorizar alimentos como "buenos" o "malos" daña tu relación con la comida',
    readTime: '4 min',
    category: 'Filosofía Anti-Dieta',
    summary: 'Prohibir un alimento aumenta el deseo psicológico por él y genera un ciclo dañino de restricción y descontrol.',
    content: [
      'La cultura de las dietas nos enseñó que existen comidas "buenas" que nos hacen virtuosos y comidas "malas" que merecen castigo o culpa. Esto es falso y alimenta conductas de riesgo.',
      'Cuando te prohibís un chocolate o una porción de pizza, tu cerebro lo interpreta como una amenaza de escasez, aumentando la fijación mental con ese alimento.',
      'En NetAI hablamos de "alimentos de consumo habitual" (ricos en nutrientes protectores) y "alimentos de consumo ocasional" (que aportan placer sensorial y cultural). Todos tienen un lugar legítimo en una vida plena.',
    ],
    actionableTip: 'Permitite comer tu alimento favorito de manera consciente: sin pantallas, oliéndolo, masticándolo despacio y disfrutando cada matiz.',
  },
  {
    id: 'edu-03',
    title: 'GAPA: Las 10 Claves Alimentarias Oficiales',
    subtitle: 'Recomendaciones basadas en evidencia para la población argentina',
    readTime: '4 min',
    category: 'Evidencia Científica',
    summary: 'Las Guías Alimentarias para la Población Argentina (Ministerio de Salud) proponen un enfoque integral de salud pública sin obsesión calórica.',
    content: [
      '1. Incorporar a diario alimentos de todos los grupos y realizar al menos 30 minutos de actividad física que disfrutes.',
      '2. Tomar a diario 8 vasos de agua segura (aproximadamente 2 litros) antes de sentir sed excesiva.',
      '3. Consumir a diario 5 porciones entre frutas y verduras de todo tipo y color, aprovechando las de estación.',
      '4. Reducir el uso de sal y el consumo de ultraprocesados con alto contenido de sodio agregando hierbas aromáticas.',
      '5. Limitar el consumo de bebidas azucaradas y alimentos con exceso de grasas saturadas sin caer en el extremo de la exclusión culinaria.',
      '6. Consumir diariamente leche, yogur o quesos, preferentemente descremados, por su biodisponibilidad de calcio.',
      '7. Al consumir carnes, quitar la grasa visible y sumar pescado dos o más veces por semana.',
      '8. Consumir legumbres, cereales integrales y sumar semillas como parte habitual de tus comidas.',
      '9. Consumir aceite crudo como condimento y frutas secas o semillas con moderación.',
      '10. El consumo de bebidas alcohólicas debe ser responsable y no estimulado.',
    ],
    actionableTip: 'Elegí una sola recomendación para enriquecer tu semana, en lugar de intentar cambiar todo de golpe.',
  },
  {
    id: 'edu-04',
    title: 'Comer con Atención Plena (Mindful Eating)',
    subtitle: 'Reconectar los cinco sentidos con el plato',
    readTime: '3 min',
    category: 'Práctica Cotidiana',
    summary: 'Comer distraídos frente al celular reduce hasta en un 40% la percepción de saciedad biológica.',
    content: [
      'Nuestras vidas aceleradas nos empujan a comer de pie, respondiendo mensajes o mirando series. En ese estado, el cerebro no registra adecuadamente las señales hormonales de saciedad (leptina y grelina).',
      'El Mindful Eating no es una técnica rígida: consiste simplemente en traer la atención al momento presente mientras comés.',
      'Observar los colores, percibir los aromas, sentir la textura en el paladar y apoyar los cubiertos entre bocado y bocado transforma un acto automático en una experiencia placentera.',
    ],
    actionableTip: 'Probá hacer los primeros 3 bocados de cada comida en silencio y plena concentración sensorial.',
  },
];

// Mensajes motivacionales empáticos y compasivos (Zero Punitivos)
export const MINDFUL_ENCOURAGEMENTS = [
  'La nutrición es un patrón semanal, no el resultado de una comida aislada. Cuidate con paciencia.',
  'Tu cuerpo es inteligente y sabe regular su energía. Escuchalo con respeto.',
  'Cada comida es una nueva oportunidad para nutrirte, hidratarte y brindarte bienestar.',
  'La salud mental y la paz con la comida son tan importantes como los micronutrientes.',
  'Moverte con alegría y comer con serenidad es el mejor regalo para tu vitalidad.',
  'Hoy tu cuerpo te acompaña en todo lo que hacés. Agradecele nutriéndolo con cariño.',
];
