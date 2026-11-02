import React, { useState, useMemo } from 'react';
import { 
  Sun, 
  Utensils, 
  Coffee, 
  Moon, 
  Cookie, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Trash2, 
  Copy, 
  Star, 
  Edit3, 
  RotateCcw, 
  Camera, 
  Search, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  BookOpen,
  Sparkles,
  Heart
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { PRESET_SAMPLE_FOODS, getMotivationalSpark } from '../nutritionEngine';
import DietPlanView from './DietPlanView';
import MealHistoryView from './MealHistoryView';
import CustomDropdown from './CustomDropdown';

export default function MealsView({ 
  profile, 
  targets, 
  foodLogs, 
  onAddFood, 
  onRemoveFood, 
  onUpdateFood,
  onOpenScanner,
  mealPlan,
  onRegenerateDiet,
  mealSchedules = {},
  onOpenScheduleModal,
  wellnessMode = false
}) {
  const { t, formatDate, formatNumber } = useTranslation();

  // Active view tab: 'tracker' (daily meals) | 'history' (analysis & history) | 'guide' (weekly diet plan)
  const [viewMode, setViewMode] = useState('tracker');

  // Date navigation state
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Category collapsed state
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Add Meal Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState('breakfast');
  const [addTab, setAddTab] = useState('search'); // 'search' | 'manual' | 'repeat'

  // Food search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchFood, setSelectedSearchFood] = useState(null);
  const [searchPortionMultiplier, setSearchPortionMultiplier] = useState(1);

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    name: '',
    category: 'breakfast',
    portion: '1 porción (~200g)',
    quantity: 1,
    unit: 'serving',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });

  // Edit Food Modal state
  const [editingItem, setEditingItem] = useState(null);

  // Delete confirmation state
  const [deletingItem, setDeletingItem] = useState(null);

  // Success toast state
  const [toastMessage, setToastMessage] = useState('');

  // Favorites stored in state
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('netai_favorite_foods');
    return saved ? JSON.parse(saved) : [];
  });

  // Helper to get time from mealSchedules
  const getCatTime = (catId, fallback = '08:00') => {
    const s = mealSchedules?.[catId];
    if (!s) return fallback;
    return typeof s === 'string' ? s : (s.time || fallback);
  };

  // Categories configuration with icons and default titles + custom meals
  const categories = useMemo(() => {
    const base = [
      { id: 'breakfast', name: t('meals.breakfast'), icon: Sun, color: '#F59E0B' },
      { id: 'lunch', name: t('meals.lunch'), icon: Utensils, color: '#10B981' },
      { id: 'afternoonSnack', name: t('meals.afternoonSnack'), icon: Coffee, color: '#06B6D4' },
      { id: 'dinner', name: t('meals.dinner'), icon: Moon, color: '#8B5CF6' },
      { id: 'snacks', name: t('meals.snacks'), icon: Cookie, color: '#EC4899' }
    ];

    if (mealSchedules) {
      Object.entries(mealSchedules).forEach(([key, val]) => {
        if (val?.isCustom) {
          base.push({
            id: key,
            name: val.name || 'Comida Extra',
            icon: Sparkles,
            color: '#3B82F6',
            isCustom: true
          });
        }
      });
    }
    return base;
  }, [t, mealSchedules]);

  // Format today string comparison (YYYY-MM-DD)
  const currentDateKey = currentDate.toISOString().split('T')[0];
  const isToday = new Date().toISOString().split('T')[0] === currentDateKey;

  // Change date helpers
  const handlePrevDay = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNextDay = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  // Toggle category accordion
  const toggleCategory = (catId) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Filter foods for current date (or assign default date if legacy items)
  const dayFoods = useMemo(() => {
    return foodLogs.filter(item => {
      const itemDate = item.date || new Date().toISOString().split('T')[0];
      return itemDate === currentDateKey;
    });
  }, [foodLogs, currentDateKey]);

  // Daily totals
  const consumedCalories = dayFoods.reduce((acc, curr) => acc + (Number(curr.calories) || 0), 0);
  const consumedProtein = dayFoods.reduce((acc, curr) => acc + (Number(curr.protein) || 0), 0);
  const consumedCarbs = dayFoods.reduce((acc, curr) => acc + (Number(curr.carbs) || 0), 0);
  const consumedFat = dayFoods.reduce((acc, curr) => acc + (Number(curr.fat) || 0), 0);

  const remainingCalories = Math.max(0, targets.targetCalories - consumedCalories);
  const calPercent = Math.min(100, Math.round((consumedCalories / targets.targetCalories) * 100));

  // Circular progress calculations for SVG ring
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (calPercent / 100) * circumference;

  // Open add modal for specific category
  const openAddModal = (catId = 'breakfast') => {
    setAddModalCategory(catId);
    const scheduledTime = getCatTime(catId, '12:00');
    setManualForm(prev => ({ ...prev, category: catId, time: scheduledTime }));
    setIsAddModalOpen(true);
    setSearchQuery('');
    setSelectedSearchFood(null);
  };

  // Handle Toast feedback
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2400);
  };

  // Toggle Favorite
  const toggleFavorite = (food) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.name === food.name);
      const updated = exists 
        ? prev.filter(f => f.name !== food.name)
        : [...prev, { ...food, id: Date.now() }];
      localStorage.setItem('netai_favorite_foods', JSON.stringify(updated));
      return updated;
    });
    showToast(t('meals.save'));
  };

  // Duplicate meal
  const handleDuplicate = (food) => {
    const duplicated = {
      ...food,
      id: Date.now(),
      date: currentDateKey,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    onAddFood(duplicated);
    showToast(getMotivationalSpark('logged_food'));
  };

  // Execute deletion after confirmation
  const executeDelete = () => {
    if (deletingItem) {
      onRemoveFood(deletingItem.id);
      setDeletingItem(null);
      showToast(t('meals.delete'));
    }
  };

  // Handle Save from Search
  const handleAddFromSearch = (food) => {
    const mult = searchPortionMultiplier || 1;
    const newFood = {
      id: Date.now(),
      date: currentDateKey,
      category: addModalCategory,
      name: food.name,
      portion: `${Math.round(100 * mult)}g`,
      calories: Math.round(food.calories * mult),
      protein: Math.round(food.protein * mult * 10) / 10,
      carbs: Math.round(food.carbs * mult * 10) / 10,
      fat: Math.round(food.fat * mult * 10) / 10,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: food.image
    };
    onAddFood(newFood);
    setIsAddModalOpen(false);
    showToast(getMotivationalSpark('logged_food'));
  };

  // Handle Save from Manual Entry
  const handleAddManual = (e) => {
    e.preventDefault();
    if (!manualForm.name.trim() || !manualForm.calories) return;

    const newFood = {
      id: Date.now(),
      date: currentDateKey,
      category: manualForm.category || addModalCategory,
      name: manualForm.name.trim(),
      portion: manualForm.portion || `${manualForm.quantity} ${manualForm.unit}`,
      calories: Number(manualForm.calories),
      protein: Number(manualForm.protein || 0),
      carbs: Number(manualForm.carbs || 0),
      fat: Number(manualForm.fat || 0),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
    };

    onAddFood(newFood);
    setIsAddModalOpen(false);
    showToast(getMotivationalSpark('logged_food'));
    setManualForm({
      name: '',
      category: 'breakfast',
      portion: '',
      quantity: 1,
      unit: 'serving',
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    });
    showToast(t('meals.addedSuccess'));
  };

  // Handle Update Food
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (editingItem && onUpdateFood) {
      onUpdateFood(editingItem);
    }
    setEditingItem(null);
    showToast(t('meals.save'));
  };

  // Filtered food search results combining presets and favorites
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const pool = [...PRESET_SAMPLE_FOODS, ...favorites];
    if (!q) return pool.slice(0, 8);
    return pool.filter(f => f.name.toLowerCase().includes(q));
  }, [searchQuery, favorites]);

  return (
    <div className="meals-view-container fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="meals-toast-notification fade-in">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation Tabs: Tracker vs History vs Diet Guide */}
      <div className="meals-top-navigation glass-panel mb-3">
        <div className="meals-nav-pill-group">
          <button 
            type="button" 
            className={`nav-pill-btn ${viewMode === 'tracker' ? 'active' : ''}`}
            onClick={() => setViewMode('tracker')}
          >
            <Utensils size={16} />
            <span>{t('meals.tabDaily')}</span>
          </button>
          <button 
            type="button" 
            className={`nav-pill-btn ${viewMode === 'history' ? 'active' : ''}`}
            onClick={() => setViewMode('history')}
          >
            <Clock size={16} />
            <span>{t('meals.tabHistory')}</span>
          </button>
          <button 
            type="button" 
            className={`nav-pill-btn ${viewMode === 'guide' ? 'active' : ''}`}
            onClick={() => setViewMode('guide')}
          >
            <BookOpen size={16} />
            <span>{t('meals.tabDietPlan')}</span>
          </button>
        </div>

        <div className="d-flex align-center gap-2">
          <button 
            type="button" 
            onClick={onOpenScheduleModal}
            className="btn-schedule-top"
            title="Personalizar horarios de comidas"
          >
            <Clock size={15} className="text-emerald" />
            <span>Mis Horarios</span>
          </button>

          <button 
            type="button" 
            onClick={() => openAddModal('breakfast')} 
            className="btn-primary btn-add-meal-top"
          >
            <Plus size={16} />
            <span>{t('meals.addFood')}</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: DAILY MEALS TRACKER */}
      {viewMode === 'tracker' && (
        <>
          {/* Date Selector Strip */}
          <div className="date-selector-strip glass-panel mb-3">
            <button 
              type="button" 
              onClick={handlePrevDay} 
              className="btn-date-nav"
              aria-label="Día anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="date-display-center" onClick={handleGoToToday}>
              <div className="d-flex align-center gap-2">
                <CalendarIcon size={16} className="text-emerald" />
                <span className="date-main-text">
                  {isToday ? t('meals.today') : formatDate(currentDate, { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                {!isToday && (
                  <span className="btn-today-pill">{t('meals.today')}</span>
                )}
              </div>
              <span className="date-sub-text">
                {formatDate(currentDate, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <button 
              type="button" 
              onClick={handleNextDay} 
              className="btn-date-nav"
              aria-label="Día siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Daily Nutritional Summary Card */}
          {wellnessMode ? (
            <div className="daily-nutritional-summary glass-panel mb-4 p-3 d-flex align-center justify-between">
              <div className="d-flex align-center gap-3">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', flexShrink: 0 }}>
                  <Heart size={22} />
                </div>
                <div>
                  <h4 className="m-0" style={{ fontSize: '0.98rem', fontWeight: 700 }}>Registro del Día (Modo Bienestar)</h4>
                  <span className="text-secondary" style={{ fontSize: '0.82rem' }}>
                    {dayFoods.length} {dayFoods.length === 1 ? 'comida disfrutada' : 'comidas disfrutadas'} • Escuchando a tu cuerpo con amabilidad
                  </span>
                </div>
              </div>
              <span className="wellness-mode-pill">🌿 Modo Bienestar</span>
            </div>
          ) : (
            <div className="daily-nutritional-summary glass-panel mb-4">
              <div className="summary-ring-col">
                <div className="summary-svg-wrap">
                  <svg className="circular-ring-svg" width="160" height="160">
                    <circle
                      stroke="var(--border-color)"
                      strokeWidth="11"
                      fill="transparent"
                      r={radius}
                      cx="80"
                      cy="80"
                    />
                    <circle
                      stroke={consumedCalories > (targets.targetRange?.max || targets.targetCalories * 1.07) ? '#6366f1' : 'var(--brand-green)'}
                      strokeWidth="11"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      r={radius}
                      cx="80"
                      cy="80"
                      style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </svg>
                  <div className="summary-ring-center">
                    <span className="summary-val">{formatNumber(consumedCalories)}</span>
                    <span className="summary-lbl">Energía Consumida</span>
                    <span className="summary-sub">kcal del día</span>
                  </div>
                </div>
              </div>

              <div className="summary-macros-col">
                <div className="summary-top-stats">
                  <div className="stat-pill">
                    <span className="stat-lbl">Consumida</span>
                    <span className="stat-num">{formatNumber(consumedCalories)} kcal</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-lbl">Rango Saludable</span>
                    <span className="stat-num text-emerald">{targets.targetRange?.label || `${formatNumber(targets.targetCalories)} kcal`}</span>
                  </div>
                </div>

                {/* Macro Bars */}
                <div className="summary-macro-bars">
                  <div className="macro-bar-line">
                    <div className="macro-bar-info">
                      <span className="macro-name text-emerald">{t('macros.protein')}</span>
                      <span className="macro-qty">{consumedProtein}g / ~{targets.macros.protein}g</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill protein" 
                        style={{ width: `${Math.min(100, (consumedProtein / (targets.macros.protein || 100)) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="macro-bar-line">
                    <div className="macro-bar-info">
                      <span className="macro-name text-carbs">{t('macros.carbs')}</span>
                      <span className="macro-qty">{consumedCarbs}g / ~{targets.macros.carbs}g</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill carbs" 
                        style={{ width: `${Math.min(100, (consumedCarbs / (targets.macros.carbs || 200)) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="macro-bar-line">
                    <div className="macro-bar-info">
                      <span className="macro-name text-fat">{t('macros.fat')}</span>
                      <span className="macro-qty">{consumedFat}g / ~{targets.macros.fat}g</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill fat" 
                        style={{ width: `${Math.min(100, (consumedFat / (targets.macros.fat || 60)) * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Meal Categories Sections (Desayuno, Almuerzo, Merienda, Cena, Snacks) */}
          <div className="meal-categories-stack">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              const catFoods = dayFoods.filter(f => (f.category || 'breakfast') === cat.id);
              const catCalories = catFoods.reduce((acc, curr) => acc + (Number(curr.calories) || 0), 0);
              const isCollapsed = collapsedCategories[cat.id];

              return (
                <div key={cat.id} className="category-accordion-card glass-panel mb-3">
                  {/* Category Header */}
                  <div className="category-card-header">
                    <div className="cat-header-left" onClick={() => toggleCategory(cat.id)}>
                      <div className="cat-icon-badge" style={{ backgroundColor: `${cat.color}18`, color: cat.color }}>
                        <IconComp size={20} />
                      </div>
                      <div>
                        <div className="d-flex align-center gap-2">
                          <h3 className="cat-title">{cat.name}</h3>
                          <span className="cat-count-tag">
                            {catFoods.length === 1 ? t('meals.oneItem') : t('meals.itemsCount', { count: catFoods.length })}
                          </span>
                        </div>
                        <div className="d-flex align-center gap-2 mt-0-5">
                          {!wellnessMode && (
                            <>
                              <span className="cat-cals-total">
                                {formatNumber(catCalories)} {t('macros.calories')}
                              </span>
                              <span className="meta-bullet">•</span>
                            </>
                          )}
                          <span 
                            className="cat-schedule-badge cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenScheduleModal?.();
                            }}
                            title="Toca para personalizar tu horario"
                          >
                            <Clock size={11} />
                            <span>{getCatTime(cat.id)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="cat-header-actions">
                      <button 
                        type="button" 
                        onClick={() => openAddModal(cat.id)} 
                        className="btn-add-food-chip"
                        title={t('meals.addFood')}
                      >
                        <Plus size={16} />
                        <span className="desktop-only">{t('meals.addFood')}</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => toggleCategory(cat.id)} 
                        className="btn-toggle-collapse"
                        aria-label="Contraer/Expandir"
                      >
                        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Category Food Items List */}
                  {!isCollapsed && (
                    <div className="category-items-body fade-in">
                      {catFoods.length === 0 ? (
                        <div className="category-empty-state" onClick={() => openAddModal(cat.id)}>
                          <Plus size={22} className="text-secondary mb-1" />
                          <p className="empty-state-title">{t('meals.emptyCategory')}</p>
                          <span className="empty-state-cta">{t('meals.emptyCategoryCta')}</span>
                        </div>
                      ) : (
                        <div className="foods-items-container">
                          {catFoods.map((item) => {
                            const isFav = favorites.some(f => f.name === item.name);

                            return (
                              <div key={item.id} className="food-item-card">
                                <div className="food-card-main">
                                  {item.image && (
                                    <img src={item.image} alt={item.name} className="food-card-thumb" />
                                  )}
                                  <div className="food-card-info">
                                    <div className="d-flex align-center gap-2">
                                      <h4 className="food-card-title">{item.name}</h4>
                                      <button 
                                        type="button" 
                                        onClick={() => toggleFavorite(item)} 
                                        className={`btn-fav-star ${isFav ? 'active' : ''}`}
                                        title={t('meals.favorite')}
                                      >
                                        <Star size={14} />
                                      </button>
                                    </div>
                                    <div className="food-card-meta">
                                      <span className="food-portion-lbl">{item.portion || '1 porción'}</span>
                                      <span className="meta-bullet">•</span>
                                      <span className="food-time-lbl">{item.time || '12:00'}</span>
                                    </div>
                                    {!wellnessMode ? (
                                      <div className="food-macros-chips">
                                        <span className="macro-chip-small protein">P: {item.protein || 0}g</span>
                                        <span className="macro-chip-small carbs">C: {item.carbs || 0}g</span>
                                        <span className="macro-chip-small fat">G: {item.fat || 0}g</span>
                                      </div>
                                    ) : (
                                      <div className="food-macros-chips">
                                        <span className="macro-chip-small" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--brand-green)', fontWeight: 600 }}>
                                          ✨ Plato Nutritivo
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="food-card-right">
                                  {!wellnessMode && (
                                    <div className="food-calories-box">
                                      <span className="cals-number">{item.calories}</span>
                                      <span className="cals-unit">kcal</span>
                                    </div>
                                  )}

                                  {/* Actions Bar */}
                                  <div className="food-card-actions">
                                    <button 
                                      type="button" 
                                      onClick={() => handleDuplicate(item)} 
                                      className="btn-food-action"
                                      title={t('meals.duplicate')}
                                    >
                                      <Copy size={15} />
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={() => setEditingItem({ ...item })} 
                                      className="btn-food-action"
                                      title={t('meals.edit')}
                                    >
                                      <Edit3 size={15} />
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={() => setDeletingItem(item)} 
                                      className="btn-food-action delete"
                                      title={t('meals.delete')}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* VIEW MODE 2: PROFESSIONAL CLINICAL & SPORTS NUTRITION HISTORY */}
      {viewMode === 'history' && (
        <MealHistoryView
          foodLogs={foodLogs}
          targets={targets}
          profile={profile}
          onDuplicateFood={handleDuplicate}
          onRemoveFood={onRemoveFood}
          categories={categories}
        />
      )}

      {/* VIEW MODE 3: DIET GUIDE (WEEKLY MEAL PLAN) */}
      {viewMode === 'guide' && (
        <div className="meals-guide-panel fade-in">
          <DietPlanView
            mealPlan={mealPlan}
            profile={profile}
            targets={targets}
            onRegenerate={onRegenerateDiet}
            onAddFood={onAddFood}
            mealSchedules={mealSchedules}
            onOpenScheduleModal={onOpenScheduleModal}
          />
        </div>
      )}

      {/* MODAL 1: ADD MEAL MODAL (4 FLOWS: SCAN, SEARCH, MANUAL, REPEAT) */}
      {isAddModalOpen && (
        <div className="modal-backdrop fade-in" onClick={() => setIsAddModalOpen(false)}>
          <div className="add-meal-modal-card glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-top-bar">
              <div className="d-flex align-center gap-2">
                <div className="modal-badge-icon">
                  <Plus size={20} className="text-emerald" />
                </div>
                <div>
                  <h3 className="m-0" style={{ fontSize: '1.2rem' }}>{t('meals.addFood')}</h3>
                  <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                    {categories.find(c => c.id === addModalCategory)?.name || t('meals.breakfast')}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)} 
                className="modal-close-btn"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* 4 Flow Tabs */}
            <div className="add-modal-tabs">
              <button 
                type="button" 
                className={`add-tab-btn ${addTab === 'search' ? 'active' : ''}`}
                onClick={() => setAddTab('search')}
              >
                <Search size={15} />
                <span>{t('meals.tabSearch')}</span>
              </button>
              <button 
                type="button" 
                className={`add-tab-btn ${addTab === 'manual' ? 'active' : ''}`}
                onClick={() => setAddTab('manual')}
              >
                <Edit3 size={15} />
                <span>{t('meals.tabManual')}</span>
              </button>
              <button 
                type="button" 
                className={`add-tab-btn ${addTab === 'repeat' ? 'active' : ''}`}
                onClick={() => setAddTab('repeat')}
              >
                <RotateCcw size={15} />
                <span>{t('meals.tabRepeat')}</span>
              </button>
              <button 
                type="button" 
                className="add-tab-btn scan-accent"
                onClick={() => {
                  setIsAddModalOpen(false);
                  onOpenScanner();
                }}
              >
                <Camera size={15} />
                <span>{t('meals.tabScan')}</span>
              </button>
            </div>

            {/* TAB CONTENT: SEARCH FOODS */}
            {addTab === 'search' && (
              <div className="search-tab-content">
                <div className="search-input-wrap">
                  <Search size={16} className="text-secondary" />
                  <input
                    type="text"
                    className="modal-search-input"
                    placeholder={t('meals.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="btn-clear-search">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Portion Adjuster if food selected */}
                {selectedSearchFood && (
                  <div className="portion-adjuster-card glass-panel fade-in mt-3 mb-3">
                    <div className="d-flex justify-between align-center mb-2">
                      <h4 className="m-0">{selectedSearchFood.name}</h4>
                      <span className="text-emerald" style={{ fontWeight: 700 }}>
                        {Math.round(selectedSearchFood.calories * searchPortionMultiplier)} kcal
                      </span>
                    </div>

                    <div className="d-flex align-center gap-3">
                      <label className="text-secondary" style={{ fontSize: '0.8rem' }}>{t('meals.quantity')}:</label>
                      <div className="quantity-stepper">
                        <button 
                          type="button" 
                          onClick={() => setSearchPortionMultiplier(prev => Math.max(0.5, prev - 0.5))}
                          className="btn-step"
                        >
                          -
                        </button>
                        <span className="step-val">{searchPortionMultiplier}x</span>
                        <button 
                          type="button" 
                          onClick={() => setSearchPortionMultiplier(prev => prev + 0.5)}
                          className="btn-step"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleAddFromSearch(selectedSearchFood)}
                        className="btn-primary w-100"
                      >
                        <Check size={16} />
                        <span>{t('meals.save')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Search Results List */}
                <div className="search-results-list">
                  {searchResults.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`search-result-row ${selectedSearchFood?.name === item.name ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedSearchFood(item);
                        setSearchPortionMultiplier(1);
                      }}
                    >
                      <img src={item.image} alt={item.name} className="search-row-thumb" />
                      <div className="search-row-info">
                        <span className="search-row-title">{item.name}</span>
                        <div className="search-row-macros">
                          <span>{item.calories} kcal</span>
                          <span>• P: {item.protein}g</span>
                          <span>• C: {item.carbs}g</span>
                          <span>• G: {item.fat}g</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddFromSearch(item);
                        }}
                        className="btn-add-quick"
                        title={t('meals.addFood')}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: MANUAL ENTRY */}
            {addTab === 'manual' && (
              <form onSubmit={handleAddManual} className="manual-entry-form">
                <div className="form-group mb-2">
                  <label className="form-lbl">{t('meals.foodName')} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder={t('meals.foodNamePlaceholder')}
                    value={manualForm.name}
                    onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="form-row-2 mb-2">
                  <div className="form-group">
                    <label className="form-lbl">{t('meals.categoryLabel')}</label>
                    <CustomDropdown
                      value={manualForm.category}
                      onChange={(catId) => setManualForm(prev => ({ ...prev, category: catId }))}
                      width="full"
                      options={categories.map(c => ({
                        value: c.id,
                        label: c.name,
                        icon: c.icon,
                        color: c.color,
                        desc: 'Comida diaria'
                      }))}
                      ariaLabel={t('meals.categoryLabel')}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-lbl">{t('meals.portion')}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej. 1 plato (~250g)"
                      value={manualForm.portion}
                      onChange={(e) => setManualForm(prev => ({ ...prev, portion: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row-4 mb-3">
                  <div className="form-group">
                    <label className="form-lbl">{t('meals.caloriesLabel')} *</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      placeholder="kcal"
                      value={manualForm.calories}
                      onChange={(e) => setManualForm(prev => ({ ...prev, calories: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-lbl">{t('meals.proteinLabel')}</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      placeholder="g"
                      value={manualForm.protein}
                      onChange={(e) => setManualForm(prev => ({ ...prev, protein: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-lbl">{t('meals.carbsLabel')}</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      placeholder="g"
                      value={manualForm.carbs}
                      onChange={(e) => setManualForm(prev => ({ ...prev, carbs: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-lbl">{t('meals.fatLabel')}</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      placeholder="g"
                      value={manualForm.fat}
                      onChange={(e) => setManualForm(prev => ({ ...prev, fat: e.target.value }))}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary w-100">
                  <Check size={16} />
                  <span>{t('meals.save')}</span>
                </button>
              </form>
            )}

            {/* TAB CONTENT: REPEAT FROM HISTORY */}
            {addTab === 'repeat' && (
              <div className="repeat-tab-content">
                <div className="repeat-items-list">
                  {foodLogs.length === 0 ? (
                    <p className="text-secondary text-center py-4">{t('meals.emptyCategory')}</p>
                  ) : (
                    foodLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="search-result-row">
                        <img src={log.image} alt={log.name} className="search-row-thumb" />
                        <div className="search-row-info">
                          <span className="search-row-title">{log.name}</span>
                          <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                            {log.calories} kcal • P: {log.protein}g • C: {log.carbs}g • G: {log.fat}g
                          </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            handleDuplicate(log);
                            setIsAddModalOpen(false);
                          }}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <Plus size={14} />
                          <span>{t('meals.repeat')}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PORTIONS AND MACROS */}
      {editingItem && (
        <div className="modal-backdrop fade-in" onClick={() => setEditingItem(null)}>
          <div className="add-meal-modal-card glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3 className="m-0">{t('meals.edit')}</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="edit-food-form">
              <div className="form-group mb-2">
                <label className="form-lbl">{t('meals.foodName')}</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group mb-2">
                <label className="form-lbl">{t('meals.portion')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingItem.portion || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, portion: e.target.value }))}
                />
              </div>

              <div className="form-row-4 mb-3">
                <div className="form-group">
                  <label className="form-lbl">kcal</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={editingItem.calories}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, calories: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-lbl">P (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={editingItem.protein}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, protein: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-lbl">C (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={editingItem.carbs}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, carbs: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-lbl">G (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={editingItem.fat}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, fat: e.target.value }))}
                  />
                </div>
              </div>

              <div className="d-flex justify-between gap-2">
                <button type="button" onClick={() => setEditingItem(null)} className="btn-secondary w-100">
                  {t('meals.cancel')}
                </button>
                <button type="submit" className="btn-primary w-100">
                  {t('meals.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deletingItem && (
        <div className="modal-backdrop fade-in" onClick={() => setDeletingItem(null)}>
          <div className="confirm-modal-card glass-panel" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon-wrap delete mb-2">
              <Trash2 size={24} />
            </div>
            <h3 className="confirm-title">{t('meals.deleteConfirm')}</h3>
            <p className="confirm-desc">{deletingItem.name} — {deletingItem.calories} kcal</p>
            <p className="confirm-sub">{t('meals.deleteDesc')}</p>

            <div className="d-flex gap-2 mt-3">
              <button 
                type="button" 
                onClick={() => setDeletingItem(null)} 
                className="btn-secondary w-100"
              >
                {t('meals.cancel')}
              </button>
              <button 
                type="button" 
                onClick={executeDelete} 
                className="btn-primary delete-btn w-100"
              >
                {t('meals.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
