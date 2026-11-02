import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Clock, 
  Filter, 
  ChefHat, 
  Heart, 
  Plus, 
  Check, 
  Search, 
  Utensils, 
  Compass, 
  Bookmark, 
  ShoppingBag,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import MedicalDisclaimer from './MedicalDisclaimer';

export default function DietPlanView({ 
  mealPlan = [], 
  profile = {}, 
  targets = {}, 
  onRegenerate, 
  onAddFood,
  mealSchedules = {},
  onOpenScheduleModal,
  wellnessMode = false
}) {
  const { t, formatNumber } = useTranslation();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'Desayuno' | 'Almuerzo' | 'Merienda' | 'Cena'
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all'); // 'all' | 'quick' (<15m) | 'medium'
  const [selectedBudgetFilter, setSelectedBudgetFilter] = useState('all'); // 'all' | 'Económico' | 'Medio'
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const [addedMealToast, setAddedMealToast] = useState('');
  const [savedFavorites, setSavedFavorites] = useState({});

  // Rich Meal Inspiration Pool
  const inspirationPool = useMemo(() => {
    return [
      {
        id: 'insp-1',
        title: 'Tostón Mediterráneo con Palta, Huevo y Semillas',
        category: 'Desayuno',
        prepTime: '10 min',
        prepTimeCategory: 'quick',
        budget: 'Económico',
        dietType: 'Vegetariana',
        difficulty: 'Fácil',
        calories: 340,
        protein: 14,
        carbs: 28,
        fat: 19,
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
        tags: ['Rápido', 'Rico en Fibra', 'Energía Matutina'],
        desc: 'Pan tostado crocante untado con palta fresca macerada, huevo a la plancha y un puñado de semillas de chía y sésamo.',
        ingredients: [
          '2 rebanadas de pan de masa madre o integral',
          '1/2 palta madura con limón y sal marina',
          '1 huevo de campo a la plancha',
          '1 cdta de semillas de chía y sésamo'
        ],
        recipe: 'Tostar el pan hasta dorar. Pisar la palta con unas gotas de limón. Cocinar el huevo a fuego suave. Montar y espolvorear semillas.'
      },
      {
        id: 'insp-2',
        title: 'Bowl de Avena Tibia con Frutos Rojos y Miel',
        category: 'Desayuno',
        prepTime: '8 min',
        prepTimeCategory: 'quick',
        budget: 'Económico',
        dietType: 'Equilibrada',
        difficulty: 'Fácil',
        calories: 360,
        protein: 18,
        carbs: 52,
        fat: 7,
        image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
        tags: ['Reconfortante', 'Antioxidante', 'Saciedad'],
        desc: 'Avena cocida en leche suave o bebida vegetal, coronada con arándanos frescos, nueces y un hilo sutil de miel pura.',
        ingredients: [
          '50g de avena en copos integrales',
          '200ml de leche o bebida de almendras',
          'Un puñado de arándanos o frutos del bosque',
          '1 cdta de miel y nueces picadas'
        ],
        recipe: 'Cocinar la avena con la leche a fuego bajo revolviendo 5 minutos hasta espesar. Servir tibia con los frutos y miel.'
      },
      {
        id: 'insp-3',
        title: 'Salmón Grillado con Espárragos y Arroz Aromático',
        category: 'Almuerzo',
        prepTime: '20 min',
        prepTimeCategory: 'medium',
        budget: 'Medio',
        dietType: 'Equilibrada',
        difficulty: 'Media',
        calories: 460,
        protein: 38,
        carbs: 34,
        fat: 20,
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
        tags: ['Omega-3', 'Antiinflamatorio', 'Rendimiento'],
        desc: 'Filete de salmón dorado a la sartén con espárragos tiernos y porción de arroz jazmín con hierbas frescas.',
        ingredients: [
          '150g de filete de salmón fresco',
          '1 taza de arroz jazmín o basmati cocido',
          '1 atado pequeño de espárragos verdes',
          '1 cdta de aceite de oliva y ralladura de limón'
        ],
        recipe: 'Sellar el salmón 4 min por lado. Saltear los espárragos con oliva. Servir acompañado de arroz templado y limón.'
      },
      {
        id: 'insp-4',
        title: 'Bowl Multicolor de Quinoa, Vegetales Asados y Tofu',
        category: 'Almuerzo',
        prepTime: '25 min',
        prepTimeCategory: 'medium',
        budget: 'Económico',
        dietType: 'Vegetariana',
        difficulty: 'Fácil',
        calories: 420,
        protein: 22,
        carbs: 48,
        fat: 15,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        tags: ['100% Vegetal', 'Fibra Prebiótica', 'Colorido'],
        desc: 'Base de quinoa tricolor esponjosa con calabaza asada, brócoli crujiente, dados de tofu dorado y aderezo tahini.',
        ingredients: [
          '1 taza de quinoa cocida',
          '100g de tofu en cubos marinados en soja',
          'Calabaza y brócoli cortados',
          '1 cda de pasta de sésamo (tahini)'
        ],
        recipe: 'Hornear los vegetales y el tofu hasta que estén dorados. Montar sobre la quinoa y bañar con tahini diluido en agua tibia.'
      },
      {
        id: 'insp-5',
        title: 'Pausa Cremosa: Yogur Griego con Granola y Frutas',
        category: 'Merienda',
        prepTime: '5 min',
        prepTimeCategory: 'quick',
        budget: 'Económico',
        dietType: 'Equilibrada',
        difficulty: 'Muy Fácil',
        calories: 230,
        protein: 16,
        carbs: 22,
        fat: 8,
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
        tags: ['Probióticos', 'Snack Rápido', 'Digestión'],
        desc: 'Yogur espeso natural con un toque crujiente de granola artesanal y rodajas de banana o fresas.',
        ingredients: [
          '150g de yogur griego natural sin azúcar',
          '2 cdas de granola con semillas',
          'Fruta fresca de estación en trozos'
        ],
        recipe: 'Colocar el yogur en una copa o cuenco, espolvorear la granola y decorar con las frutas frescas.'
      },
      {
        id: 'insp-6',
        title: 'Cena Ligera: Crema de Calabaza con Pollo y Semillas',
        category: 'Cena',
        prepTime: '15 min',
        prepTimeCategory: 'medium',
        budget: 'Económico',
        dietType: 'Equilibrada',
        difficulty: 'Fácil',
        calories: 380,
        protein: 32,
        carbs: 30,
        fat: 12,
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
        tags: ['Descanso Celular', 'Cero Pesadez', 'Calidez'],
        desc: 'Sopa crema de calabaza asada y jengibre, acompañada de tiras de pollo tierno y semillas de calabaza tostadas.',
        ingredients: [
          '200g de calabaza cocida y procesada',
          '120g de pechuga de pollo desmenuzada',
          '1 pizca de jengibre y nuez moscada',
          '1 cda de semillas de calabaza'
        ],
        recipe: 'Calentar la crema de calabaza con especias. Servir bien caliente coronando con el pollo tibio y las semillas crujientes.'
      }
    ];
  }, []);

  // Filter logic
  const filteredMeals = useMemo(() => {
    return inspirationPool.filter(meal => {
      if (selectedCategory !== 'all' && meal.category !== selectedCategory) return false;
      if (selectedTimeFilter !== 'all' && meal.prepTimeCategory !== selectedTimeFilter) return false;
      if (selectedBudgetFilter !== 'all' && meal.budget !== selectedBudgetFilter) return false;
      return true;
    });
  }, [inspirationPool, selectedCategory, selectedTimeFilter, selectedBudgetFilter]);

  const handleAddMealToToday = (meal) => {
    if (onAddFood) {
      onAddFood({
        id: Date.now(),
        name: meal.title,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        category: meal.category.toLowerCase().includes('desayuno') ? 'breakfast' :
                  meal.category.toLowerCase().includes('almuerzo') ? 'lunch' :
                  meal.category.toLowerCase().includes('merienda') ? 'afternoonSnack' : 'dinner',
        portion: '1 plato inspirado',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        image: meal.image
      });

      setAddedMealToast(`¡"${meal.title.slice(0, 30)}..." sumado a tu registro de hoy!`);
      setTimeout(() => setAddedMealToast(''), 2500);
    }
  };

  const toggleFavorite = (mealId) => {
    setSavedFavorites(prev => ({
      ...prev,
      [mealId]: !prev[mealId]
    }));
  };

  return (
    <div className="diet-guide-container fade-in">
      {/* Toast Notification */}
      {addedMealToast && (
        <div className="meals-toast-notification fade-in">
          <Check size={16} />
          <span>{addedMealToast}</span>
        </div>
      )}

      {/* 1. MANDATORY CLINICAL & ETHICAL MEDICAL DISCLAIMER */}
      <MedicalDisclaimer />

      {/* 2. Hero Header: Inspiration Catalog (NOT a rigid diet) */}
      <div className="diet-hero-banner glass-panel">
        <div className="diet-hero-left">
          <div className="d-flex align-center gap-2 mb-2 flex-wrap">
            <span className="diet-badge-pill highlight">
              <Compass size={14} />
              Catálogo de Inspiración Culinaria
            </span>
            <span className="diet-badge-pill">Libre de Dietas Restrictivas</span>
            {wellnessMode && (
              <span className="wellness-mode-pill">🌿 Modo Bienestar Activo</span>
            )}
          </div>

          <h2 className="diet-hero-title">
            Inspiración para Nutrir tu Día
          </h2>
          <p className="diet-hero-desc">
            Explora recetas reconfortantes y equilibradas según tus tiempos y gustos. En NetAI no creemos en menús obligatorios: vos decidís qué disfrutar según las señales de tu cuerpo.
          </p>
        </div>

        <div className="diet-hero-right d-flex gap-2 align-center">
          <button 
            type="button" 
            onClick={onOpenScheduleModal} 
            className="btn-secondary btn-recalc"
            title="Personalizar horarios habituales"
          >
            <Clock size={15} className="text-emerald" />
            <span>Mis Horarios</span>
          </button>
        </div>
      </div>

      {/* 3. Interactive Filter Bar */}
      <div className="glass-panel p-3 mt-3 mb-4">
        <div className="d-flex align-center justify-between mb-3 flex-wrap gap-2">
          <div className="d-flex align-center gap-2">
            <SlidersHorizontal size={16} className="text-emerald" />
            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Filtrar Catálogo de Ideas</span>
          </div>
          <span className="text-secondary" style={{ fontSize: '0.78rem' }}>
            Mostrando {filteredMeals.length} de {inspirationPool.length} recetas
          </span>
        </div>

        {/* Category Filter Chips */}
        <div className="d-flex gap-2 flex-wrap mb-2">
          {[
            { id: 'all', label: 'Todas las comidas' },
            { id: 'Desayuno', label: '🌅 Desayunos' },
            { id: 'Almuerzo', label: '🍽️ Almuerzos' },
            { id: 'Merienda', label: '☕ Meriendas' },
            { id: 'Cena', label: '🌙 Cenas' }
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`btn-tag-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Prep Time & Budget Filter Sub-row */}
        <div className="d-flex gap-3 flex-wrap align-center pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="d-flex align-center gap-1">
            <Clock size={14} className="text-secondary" />
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Tiempo:</span>
            <button
              type="button"
              className={`btn-micro-chip ${selectedTimeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTimeFilter('all')}
            >
              Todos
            </button>
            <button
              type="button"
              className={`btn-micro-chip ${selectedTimeFilter === 'quick' ? 'active' : ''}`}
              onClick={() => setSelectedTimeFilter('quick')}
            >
              Rápido (&lt;15 min)
            </button>
          </div>

          <div className="d-flex align-center gap-1">
            <ShoppingBag size={14} className="text-secondary" />
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Presupuesto:</span>
            <button
              type="button"
              className={`btn-micro-chip ${selectedBudgetFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedBudgetFilter('all')}
            >
              Todos
            </button>
            <button
              type="button"
              className={`btn-micro-chip ${selectedBudgetFilter === 'Económico' ? 'active' : ''}`}
              onClick={() => setSelectedBudgetFilter('Económico')}
            >
              Económico
            </button>
          </div>
        </div>
      </div>

      {/* 4. Recipe Inspiration Grid */}
      <div className="inspiration-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredMeals.map((recipe) => {
          const isExpanded = expandedRecipeId === recipe.id;
          const isFav = savedFavorites[recipe.id];

          return (
            <div key={recipe.id} className="recipe-card glass-panel overflow-hidden d-flex flex-column" style={{ transition: 'all 0.25s ease' }}>
              {/* Image & Badges */}
              <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                <img 
                  src={recipe.image} 
                  alt={recipe.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="diet-badge-pill" style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                    {recipe.category}
                  </span>
                  <span className="diet-badge-pill" style={{ background: 'rgba(16,185,129,0.85)', color: '#fff' }}>
                    {recipe.prepTime}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(recipe.id)}
                  style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isFav ? '#ef4444' : '#fff', cursor: 'pointer' }}
                  aria-label="Guardar en favoritos"
                >
                  <Heart size={16} fill={isFav ? '#ef4444' : 'none'} />
                </button>
              </div>

              {/* Recipe Body */}
              <div className="p-3 d-flex flex-column flex-1 justify-between">
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                    {recipe.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 12px 0' }}>
                    {recipe.desc}
                  </p>

                  <div className="d-flex gap-1 flex-wrap mb-3">
                    {recipe.tags.map(tag => (
                      <span key={tag} className="diet-badge-pill" style={{ fontSize: '0.7rem' }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Quantitative or Qualitative Pill */}
                  {!wellnessMode ? (
                    <div className="d-flex align-center justify-between p-2 mb-3 rounded" style={{ background: 'var(--bg-card-subtle, rgba(255,255,255,0.03))', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Aporte energético:
                      </span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--brand-green)' }}>
                        ~{recipe.calories} kcal
                      </span>
                    </div>
                  ) : (
                    <div className="d-flex align-center gap-2 p-2 mb-3 rounded" style={{ background: 'rgba(139, 92, 246, 0.08)', borderRadius: '8px' }}>
                      <Sparkles size={14} className="text-purple" style={{ color: '#8b5cf6' }} />
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        Aporte variado y armónico para tu vitalidad
                      </span>
                    </div>
                  )}

                  {/* Expandable Ingredients & Instructions */}
                  {isExpanded && (
                    <div className="fade-in pt-2 mb-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>Ingredientes sugeridos:</h4>
                      <ul style={{ paddingLeft: 18, margin: '0 0 10px 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {recipe.ingredients.map((ing, idx) => (
                          <li key={idx}>{ing}</li>
                        ))}
                      </ul>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Preparación sencilla:</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                        {recipe.recipe}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="d-flex align-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '8px 10px', fontSize: '0.78rem' }}
                  >
                    <span>{isExpanded ? 'Ocultar' : 'Ver receta'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddMealToToday(recipe)}
                    className="btn-primary"
                    style={{ flex: 1.2, padding: '8px 10px', fontSize: '0.78rem' }}
                  >
                    <Plus size={14} />
                    <span>Sumar a hoy</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
