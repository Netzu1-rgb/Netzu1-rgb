// NetAI Ethical Nutrition Engine
// Weight-neutral, Anti-TCA / ED-Safe Design Standards
// Calculations based on Mifflin-St Jeor equation with strict biological safety limits

export const ACTIVITY_MULTIPLIERS = {
  sedentary: { label: 'Tranquilo / Sedentario', desc: 'Actividades cotidianas y trabajo de escritorio', factor: 1.2 },
  light: { label: 'Ligero', desc: 'Caminatas o actividad física suave 1-3 días por semana', factor: 1.375 },
  moderate: { label: 'Moderado', desc: 'Actividad moderada o deporte 3-5 días por semana', factor: 1.55 },
  active: { label: 'Dinámico / Activo', desc: 'Entrenamiento intenso o trabajo activo regular', factor: 1.725 },
  athlete: { label: 'Alto Rendimiento', desc: 'Actividad deportiva exigente o doble turno', factor: 1.9 }
};

// Weight-Neutral Goals: Focus on energy, nourishment and vitality instead of weight-loss / deficits
export const GOAL_ADJUSTMENTS = {
  vitality: { 
    id: 'vitality',
    label: 'Bienestar y Vitalidad', 
    desc: 'Balance de energía sostenido para nutrir tu rutina y potenciar tu salud diaria', 
    pct: 0.0, 
    proteinPerKg: 1.8 
  },
  active_energy: { 
    id: 'active_energy',
    label: 'Energía Activa', 
    desc: 'Combustible óptimo para días dinámicos, rendimiento deportivo y bienestar', 
    pct: 0.05, 
    proteinPerKg: 1.9 
  },
  strength_recov: { 
    id: 'strength_recov',
    label: 'Fuerza y Recuperación', 
    desc: 'Aporte nutritivo enfocado en tonificación, reparación muscular y vitalidad', 
    pct: 0.10, 
    proteinPerKg: 2.0 
  },
  nourish_boost: { 
    id: 'nourish_boost',
    label: 'Nutrición Plena', 
    desc: 'Aporte enriquecido para maximizar fuerza, resistencia física y descanso reparador', 
    pct: 0.15, 
    proteinPerKg: 2.2 
  }
};

// Backward-compatibility aliases for existing user profiles stored in localStorage
export const GOAL_ALIASES = {
  maintain: 'vitality',
  lose_steady: 'vitality',
  lose_fast: 'vitality',
  gain_lean: 'strength_recov',
  gain_strength: 'nourish_boost'
};

export const DIET_TYPES = {
  balanced: { label: 'Equilibrada / Mediterránea', desc: 'Variada, rica en granos enteros, grasas saludables y fuentes limpias de proteína' },
  high_protein: { label: 'Alta en Proteína', desc: 'Énfasis en saciedad prolongada y aporte proteico variado' },
  keto: { label: 'Keto / Low Carb', desc: 'Enfocada en grasas saludables y vegetales ricos en fibra' },
  vegetarian: { label: 'Vegetariana', desc: 'Basada en plantas con lácteos y huevos' },
  vegan: { label: '100% Vegana', desc: 'Completamente basada en plantas y legumbres' }
};

// Available Food Choice Pools for Custom Questionnaire
export const PROTEIN_OPTIONS = [
  { id: 'pollo', label: 'Pechuga de Pollo / Pavo', desc: 'Proteína completa, tierna y de fácil digestión' },
  { id: 'pescado', label: 'Salmón, Atún y Pescados', desc: 'Rico en Omega-3 cardiosaludable y antiinflamatorio' },
  { id: 'huevos', label: 'Huevos enteros y Claras', desc: 'Proteína de alto valor biológico y minerales esenciales' },
  { id: 'carne_roja', label: 'Cortes magros de Res / Ternera', desc: 'Rica en hierro hemo, zinc y creatina natural' },
  { id: 'yogur_griego', label: 'Yogur Griego / Quesos Suaves', desc: 'Aporte de calcio, probióticos y saciedad' },
  { id: 'legumbres_tofu', label: 'Legumbres, Tofu y Soja', desc: 'Excelente proteína vegetal rica en fibra y micronutrientes' },
  { id: 'whey', label: 'Batidos Proteicos (Whey o Vegetal)', desc: 'Opción práctica y rápida para antes o después de entrenar' }
];

export const CARB_OPTIONS = [
  { id: 'avena', label: 'Avena Integral y Cereales', desc: 'Energía sostenida y rica en betaglucanos saciantes' },
  { id: 'arroz', label: 'Arroz Basmati / Integral / Jazmín', desc: 'Digestión ligera y excelente combustible para el día' },
  { id: 'batata', label: 'Batata / Camote dulce y Patata', desc: 'Carbohidrato natural rico en potasio y vitamina A' },
  { id: 'quinoa', label: 'Quinoa tricolor y Granos Ancestrales', desc: 'Grano completo con aminoácidos y fibra soluble' },
  { id: 'pan_madre', label: 'Pan de Masa Madre / Centeno', desc: 'Fermentación natural agradable para la microbiota' },
  { id: 'frutas', label: 'Frutas Frescas de Estación', desc: 'Antioxidantes, hidratación celular y energía viva' }
];

export const FAT_OPTIONS = [
  { id: 'aguacate', label: 'Aguacate / Palta fresca', desc: 'Grasas monoinsaturadas cardiosaludables y textura suave' },
  { id: 'oliva', label: 'Aceite de Oliva Virgen Extra (AOVE)', desc: 'Pilar antioxidante con polifenoles protectores' },
  { id: 'frutos_secos', label: 'Nueces, Almendras y Castañas', desc: 'Saciedad, vitamina E, magnesio y minerales esenciales' },
  { id: 'mantequilla_mani', label: 'Mantequilla de Cacahuete / Almendra', desc: 'Densa en energía, sabor y bienestar' },
  { id: 'semillas', label: 'Semillas de Chía, Lino y Sésamo', desc: 'Omega-3 vegetal (ALA) y fibra prebiótica' }
];

// MANDATORY CLINICAL DISCLAIMER
export const MEDICAL_DISCLAIMER_TEXT = 
  'NetAI brinda sugerencias e información nutricional con fines exclusivamente educativos y de inspiración culinaria. Esta aplicación adopta un enfoque neutral respecto al peso y no promueve dietas restrictivas ni sustituye el asesoramiento, diagnóstico o tratamiento de un médico, nutricionista matriculado o profesional de la salud mental.';

/**
 * Validates biometric input to protect health and avoid triggering TCA.
 * REJECTS any input resulting in an underweight BMI (< 18.5).
 */
export function validateBiometricSafety(weight, height) {
  const w = parseFloat(weight);
  const h = parseFloat(height);

  if (!w || !h || w <= 0 || h <= 0) {
    return {
      isValid: false,
      message: 'Por favor, ingresa valores válidos de peso y estatura.'
    };
  }

  const heightM = h / 100;
  const bmi = Math.round((w / (heightM * heightM)) * 10) / 10;
  const safeMinWeight = Math.ceil(18.5 * (heightM * heightM));

  if (bmi < 18.5) {
    return {
      isValid: false,
      bmi,
      safeMinWeight,
      message: `Por tu seguridad y bienestar integral, NetAI no permite configurar objetivos por debajo del rango fisiológico seguro (IMC mínimo de 18.5, equivalente a ~${safeMinWeight} kg para tu estatura). Nuestro compromiso es cuidar tu salud y vitalidad.`
    };
  }

  return {
    isValid: true,
    bmi,
    safeMinWeight
  };
}

/**
 * Calculates nutritional targets based on biological safety standards.
 * HARD-CODED SAFETY LIMIT: targetCalories can NEVER be below the Basal Metabolic Rate (BMR).
 * Provides a flexible RANGE instead of rigid restrictive numbers.
 */
export function calculateNutritionTargets(profile = {}) {
  const { gender, age, weight, height, activityLevel, goal, dietType, targetWaterCustom } = profile;
  
  const w = parseFloat(weight) || 70;
  const h = parseFloat(height) || 170;
  const a = parseInt(age, 10) || 25;

  // Mifflin-St Jeor formula for BMR (Base physiological energy expenditure)
  let bmr = (10 * w) + (6.25 * h) - (5 * a);
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  const safeBmr = Math.max(1200, Math.round(bmr));

  const actFactor = ACTIVITY_MULTIPLIERS[activityLevel]?.factor || 1.375;
  const tdee = Math.round(safeBmr * actFactor);

  // Normalize goal key via aliases if legacy key is present
  const resolvedGoalKey = GOAL_ALIASES[goal] || goal || 'vitality';
  const goalObj = GOAL_ADJUSTMENTS[resolvedGoalKey] || GOAL_ADJUSTMENTS.vitality;

  // HARD-CODED LIMIT: Never allow targetCalories below standard safe BMR!
  const computedTarget = Math.round(tdee * (1 + goalObj.pct));
  const targetCalories = Math.max(safeBmr, computedTarget);

  // Flexible energy range (±7% margin, ~150 kcal range of natural body variance)
  const rangeMargin = Math.round(targetCalories * 0.07);
  const targetRange = {
    min: targetCalories - rangeMargin,
    max: targetCalories + rangeMargin,
    label: `${targetCalories - rangeMargin} – ${targetCalories + rangeMargin} kcal`
  };

  // Calculate Balanced Macros
  let proteinGrams = 0;
  let fatGrams = 0;
  let carbGrams = 0;

  if (dietType === 'keto') {
    carbGrams = Math.round((targetCalories * 0.05) / 4);
    proteinGrams = Math.round(Math.min(w * 2.0, (targetCalories * 0.25) / 4));
    const remainingCalories = targetCalories - (carbGrams * 4) - (proteinGrams * 4);
    fatGrams = Math.round(remainingCalories / 9);
  } else if (dietType === 'high_protein') {
    proteinGrams = Math.round(w * 2.1);
    fatGrams = Math.round((targetCalories * 0.25) / 9);
    const remainingCalories = targetCalories - (proteinGrams * 4) - (fatGrams * 9);
    carbGrams = Math.max(30, Math.round(remainingCalories / 4));
  } else {
    proteinGrams = Math.round(w * (goalObj.proteinPerKg || 1.8));
    fatGrams = Math.round((targetCalories * 0.25) / 9);
    const remainingCalories = targetCalories - (proteinGrams * 4) - (fatGrams * 9);
    carbGrams = Math.max(40, Math.round(remainingCalories / 4));
  }

  // Water reference (Comfortable baseline)
  const calculatedWater = Math.round(((w * 0.035) + 0.5) * 10) / 10;
  const targetWaterLiters = targetWaterCustom ? parseFloat(targetWaterCustom) : calculatedWater;

  // Non-stigmatizing BMI indicator
  const heightM = h / 100;
  const bmi = Math.round((w / (heightM * heightM)) * 10) / 10;

  let bmiCategory = 'Rango Fisiológico de Referencia';
  if (bmi < 18.5) {
    bmiCategory = 'Bajo referencia (Priorizar nutrición)';
  }

  return {
    bmr: safeBmr,
    tdee,
    targetCalories,
    targetRange,
    bmi,
    bmiCategory,
    targetWaterLiters,
    macros: {
      protein: proteinGrams,
      carbs: carbGrams,
      fat: fatGrams
    }
  };
}

export function formatTimeAmPm(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length !== 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? `0${hours}` : `${hours}`;
  return `${strHours}:${minutes} ${ampm}`;
}

// Continuous Compassionate Motivation Library
export const MOTIVATIONAL_SPARKS = {
  daily: [
    { text: 'Cada comida es una oportunidad para nutrir tu vitalidad y escuchar a tu cuerpo.', author: 'Bienestar Consciente' },
    { text: 'La constancia saludable se construye con compasión, disfrute y flexibilidad.', author: 'Salud Integral' },
    { text: 'Tu valor nunca se mide en números ni en balanzas. Tu energía es tu mayor fortaleza.', author: 'Enfoque Positivo' },
    { text: 'Comer con calma y presencia transforma la comida en verdadero bienestar.', author: 'Nutrición Atenta' },
    { text: 'El balance no es perfección diaria, sino el promedio amoroso de tus hábitos.', author: 'Ritmo Saludable' }
  ],
  logged_food: [
    '✨ ¡Nutriendo tu día con energía de calidad!',
    '🌿 Cada plato suma nutrientes, color y vitalidad a tu cuerpo.',
    '🍲 ¡Excelente momento para conectar con lo que tu cuerpo necesita!',
    '💪 Aporte clave de nutrientes para tu bienestar diario.',
    '🥑 Alimentar tu cuerpo con consciencia es el mejor acto de autocuidado.'
  ],
  water: [
    '💧 ¡Pausa de hidratación! Tu cuerpo y tu mente agradecen este respiro.',
    '🌊 Un vaso más de agua para mantener tu energía limpia y fluida.',
    '✨ Cuidar tu hidratación es cuidar tu claridad y bienestar.'
  ],
  energy_abundance: [
    '⚡ Tu cuerpo es sabio: utilizará este combustible para rendir, recuperarse y mantener tu vitalidad.',
    '💫 La energía de hoy es la base de tu fuerza de mañana. ¡Disfrutá de cada bocado sin culpas!',
    '🌟 El apetito y las necesidades cambian de un día a otro; escuchar a tu cuerpo siempre es el camino correcto.'
  ],
  wellness_mode: [
    '🧘 Modo Bienestar Activo: Conectando con los sabores, la textura y las sensaciones de saciedad sin números.',
    '🌱 Tu intuición y disfrute son tus mejores guías nutricionales.'
  ]
};

export function getMotivationalSpark(type = 'daily', index = null) {
  const pool = MOTIVATIONAL_SPARKS[type] || MOTIVATIONAL_SPARKS.daily;
  if (index !== null && pool[index]) return pool[index];
  const randIdx = Math.floor(Math.random() * pool.length);
  return pool[randIdx];
}

/**
 * Builds meal suggestions pool formatted as an Inspiration Catalog (Meal Inspiration)
 * NOT a prescriptive rigid diet plan.
 */
export function generatePersonalizedMealPlan(profile = {}, targets = {}, mealSchedules = {}) {
  const { 
    preferredProteins = ['pollo', 'huevos', 'pescado'], 
    preferredCarbs = ['avena', 'arroz', 'batata'], 
    preferredFats = ['aguacate', 'oliva', 'frutos_secos']
  } = profile;
  const { targetCalories = 2000, macros = { protein: 120, carbs: 220, fat: 65 } } = targets;

  const p1 = preferredProteins[0] || 'pollo';
  const p2 = preferredProteins[1] || preferredProteins[0] || 'pescado';
  const c1 = preferredCarbs[0] || 'avena';
  const c2 = preferredCarbs[1] || preferredCarbs[0] || 'arroz';
  const f1 = preferredFats[0] || 'aguacate';
  const f2 = preferredFats[1] || preferredFats[0] || 'oliva';

  const getCustomMealTime = (key, fallback) => {
    const s = mealSchedules?.[key];
    if (!s) return fallback;
    const rawTime = typeof s === 'string' ? s : (s.time || fallback);
    return formatTimeAmPm(rawTime) || rawTime;
  };

  const mealTemplates = [
    {
      id: 'breakfast',
      name: 'Desayuno de Vitalidad',
      category: 'Desayuno',
      prepTime: '10 min',
      budget: 'Económico',
      pct: 0.25,
      time: getCustomMealTime('breakfast', '08:30 AM'),
      icon: 'Sun',
      options: [
        {
          title: `Bowl de ${c1 === 'avena' ? 'Avena con Frutas' : 'Tostadas de Masa Madre'} y ${p1 === 'huevos' ? 'Huevos Revueltos' : 'Proteína y Frutos Secos'}`,
          desc: `Combinación colorida y suave con base de ${c1}, proteína de ${p1} y un toque de ${f1}.`,
          tags: ['Energía Sostenible', 'Fácil Digestión', 'Ingredientes Favoritos'],
          recipe: `Preparar tu porción de ${c1} al gusto, acompañando con ${p1} y agregando láminas de ${f1} para un balance armónico.`
        },
        {
          title: `Omelette Suave o Batido Vital de ${p1}`,
          desc: `Aporte completo de aminoácidos integrando ${p1} y textura rica con ${f2}.`,
          tags: ['Rápido de Preparar', 'Sabor Natural'],
          recipe: `Cocinar a fuego medio incorporando vegetales frescos y 1 cucharadita de ${f2} para realzar sabores.`
        }
      ]
    },
    {
      id: 'lunch',
      name: 'Almuerzo Equilibrado',
      category: 'Almuerzo',
      prepTime: '20 min',
      budget: 'Medio',
      pct: 0.35,
      time: getCustomMealTime('lunch', '01:30 PM'),
      icon: 'Utensils',
      options: [
        {
          title: `Plato Nutritivo: ${p1 === 'pollo' ? 'Pechuga a las Hierbas' : p1 === 'pescado' ? 'Filete de Salmón / Atún' : 'Proteína Suave'} con ${c2 === 'arroz' ? 'Arroz Aromático' : 'Batata Asada'}`,
          desc: `Plato armónico con proteína de ${p1}, carbohidratos reconfortantes de ${c2} y aderezo de ${f1}.`,
          tags: ['Variedad de Nutrientes', 'Sabor Casero', 'Antioxidante'],
          recipe: `Dorar la proteína de ${p1} a fuego medio. Acompañar con ${c2} tibio y emulsionar con ${f1} y hierbas frescas.`
        },
        {
          title: `Bowl de Variedad con ${p2} y ${c1}`,
          desc: `Variación colorida y rica en texturas combinando ${p2} con base de ${c1}.`,
          tags: ['Fácil de Transportar', 'Nutrición Completa'],
          recipe: `Integrar verduras salteadas al dente, añadir ${p2} y una base de ${c1} con semillas variadas.`
        }
      ]
    },
    {
      id: 'afternoonSnack',
      name: 'Merienda Reconfortante',
      category: 'Merienda',
      prepTime: '5 min',
      budget: 'Económico',
      pct: 0.15,
      time: getCustomMealTime('afternoonSnack', '05:00 PM'),
      icon: 'Coffee',
      options: [
        {
          title: `Pausa de Media Tarde: Yogur o Fruta con ${f2 === 'frutos_secos' ? 'Nueces y Frutos Secos' : 'Semillas y Fruta'}`,
          desc: `Equilibrio crujiente entre frescura y saciedad natural con ${f2}.`,
          tags: ['Pausa Consciente', 'Snack Amigable'],
          recipe: `Servir fruta fresca en cubos junto a una porción de frutos secos de ${f2} para una pausa de media tarde reparadora.`
        }
      ]
    },
    {
      id: 'dinner',
      name: 'Cena Liviana y Reparadora',
      category: 'Cena',
      prepTime: '15 min',
      budget: 'Medio',
      pct: 0.25,
      time: getCustomMealTime('dinner', '09:00 PM'),
      icon: 'Moon',
      options: [
        {
          title: `Cena Serena de ${p2} con Verduras al Vapor y ${f1}`,
          desc: `Proteína limpia de ${p2} acompañada de vegetales tiernos y toque aromático de ${f1}.`,
          tags: ['Descanso Reparador', 'Digestión Suave'],
          recipe: `Cocinar ${p2} a la plancha o al vapor con especias suaves. Acompañar con ensalada tibia o crema de calabaza.`
        }
      ]
    }
  ];

  return mealTemplates.map(meal => {
    const mealCals = Math.round(targetCalories * meal.pct);
    const mealProtein = Math.round(macros.protein * meal.pct);
    const mealCarbs = Math.round(macros.carbs * meal.pct);
    const mealFat = Math.round(macros.fat * meal.pct);

    return {
      ...meal,
      targetCalories: mealCals,
      macros: {
        protein: mealProtein,
        carbs: mealCarbs,
        fat: mealFat
      }
    };
  });
}

export const PRESET_SAMPLE_FOODS = [
  {
    name: 'Pechuga de Pollo a la plancha (150g)',
    calories: 247,
    protein: 46.5,
    carbs: 0,
    fat: 5.4,
    category: 'Almuerzo',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Tostada de Masa Madre con Aguacate y Huevo',
    calories: 340,
    protein: 14,
    carbs: 28,
    fat: 19,
    category: 'Desayuno',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Salmón a la plancha con Espárragos',
    calories: 420,
    protein: 38,
    carbs: 6,
    fat: 26,
    category: 'Cena',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Bowl de Avena con Frutas y Semillas',
    calories: 360,
    protein: 20,
    carbs: 52,
    fat: 8,
    category: 'Desayuno',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Yogur Griego con Miel y Nueces',
    calories: 230,
    protein: 18,
    carbs: 16,
    fat: 11,
    category: 'Snack',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Bowl Mediterráneo con Vegetales y Proteína',
    calories: 460,
    protein: 34,
    carbs: 28,
    fat: 22,
    category: 'Almuerzo',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80'
  }
];
