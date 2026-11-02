'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Utensils,
  Sparkles,
  BookOpen,
  Droplets,
  Plus,
  Trash2,
  CheckCircle2,
  Heart,
  Info,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Smile,
  Calendar,
  Clock,
  Flame,
  Award,
  AlertCircle,
  X,
  Compass,
} from 'lucide-react';
import {
  MINIMUM_SAFE_ENERGY_FLOOR,
  DEFAULT_ENERGY_RANGE,
  HUNGER_SATIETY_SCALE,
  PLATE_METHOD_SECTIONS,
  RECIPES_CATALOG,
  EDUCATION_ARTICLES,
  MINDFUL_ENCOURAGEMENTS,
} from '@/lib/ethicalNutrition';

const MEAL_CATEGORIES = [
  { id: 'desayuno', label: 'Desayuno', icon: '🌅', hint: 'Comenzá el día con energía amable' },
  { id: 'almuerzo', label: 'Almuerzo', icon: '☀️', hint: 'Momento para recargar y pausar' },
  { id: 'merienda', label: 'Merienda', icon: '☕', hint: 'Pausa de media tarde para conectar' },
  { id: 'cena', label: 'Cena', icon: '🌙', hint: 'Comida reconfortante para un buen descanso' },
  { id: 'colacion', label: 'Colación Consciente', icon: '🍎', hint: 'Si tu cuerpo te pide energía extra' },
];

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function PwaAppPage() {
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'inspiration' | 'learn'
  const [intuitiveMode, setIntuitiveMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [logsByDate, setLogsByDate] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Modales
  const [activeMealModal, setActiveMealModal] = useState(null); // 'desayuno' | ...
  const [activeRecipeModal, setActiveRecipeModal] = useState(null); // recipe object
  const [activeArticleModal, setActiveArticleModal] = useState(null); // article object
  const [recipeFilter, setRecipeFilter] = useState('Todos');

  // Formulario nuevo plato
  const [newMealForm, setNewMealForm] = useState({
    name: '',
    energy: '400',
    satietyBefore: 3,
    satietyAfter: 7,
    notes: '',
  });

  // Frase inspiradora aleatoria
  const dailyEncouragement = useMemo(() => {
    const index = Math.abs(selectedDate.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0)) % MINDFUL_ENCOURAGEMENTS.length;
    return MINDFUL_ENCOURAGEMENTS[index];
  }, [selectedDate]);

  // Cargar de localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('netai_wellness_log_v1');
      if (savedData) {
        setLogsByDate(JSON.parse(savedData));
      } else {
        // Datos de ejemplo para el primer día
        const initialToday = getTodayString();
        setLogsByDate({
          [initialToday]: {
            waterGlasses: 5,
            meals: {
              desayuno: [
                {
                  id: 'd-1',
                  name: 'Tostada de masa madre con huevo revuelto y palta',
                  energy: 410,
                  satietyBefore: 2,
                  satietyAfter: 7,
                  notes: 'Desayuné tranquilo mirando la luz de la mañana.',
                },
              ],
              almuerzo: [
                {
                  id: 'a-1',
                  name: 'Bowl de Quinoa, Calabaza Asada y Lentejas',
                  energy: 510,
                  satietyBefore: 3,
                  satietyAfter: 7,
                  notes: 'Sabor excelente, textura de calabaza perfecta.',
                },
              ],
              merienda: [],
              cena: [],
              colacion: [],
            },
          },
        });
      }

      const savedIntuitive = localStorage.getItem('netai_intuitive_mode');
      if (savedIntuitive !== null) {
        setIntuitiveMode(savedIntuitive === 'true');
      }
    } catch (e) {
      console.warn('Error leyendo localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('netai_wellness_log_v1', JSON.stringify(logsByDate));
      localStorage.setItem('netai_intuitive_mode', String(intuitiveMode));
    } catch (e) {
      console.warn('Error guardando en localStorage', e);
    }
  }, [logsByDate, intuitiveMode, isLoaded]);

  // Datos del día seleccionado
  const currentDayLog = useMemo(() => {
    if (!logsByDate[selectedDate]) {
      return {
        waterGlasses: 0,
        meals: {
          desayuno: [],
          almuerzo: [],
          merienda: [],
          cena: [],
          colacion: [],
        },
      };
    }
    return logsByDate[selectedDate];
  }, [logsByDate, selectedDate]);

  // Total de energía consumida hoy
  const totalEnergyToday = useMemo(() => {
    let sum = 0;
    Object.values(currentDayLog.meals || {}).forEach((mealArray) => {
      mealArray.forEach((item) => {
        sum += Number(item.energy) || 0;
      });
    });
    return sum;
  }, [currentDayLog]);

  // Manejo de agua
  const handleToggleWater = (glassIndex) => {
    const current = currentDayLog.waterGlasses || 0;
    const nextWater = glassIndex + 1 === current ? current - 1 : glassIndex + 1;

    setLogsByDate((prev) => ({
      ...prev,
      [selectedDate]: {
        ...currentDayLog,
        waterGlasses: nextWater,
      },
    }));
  };

  // Manejo de agregar comida
  const handleAddMealSubmit = (e) => {
    e.preventDefault();
    if (!newMealForm.name.trim()) return;

    const newEntry = {
      id: 'meal-' + Date.now(),
      name: newMealForm.name.trim(),
      energy: parseInt(newMealForm.energy, 10) || 350,
      satietyBefore: parseInt(newMealForm.satietyBefore, 10) || 3,
      satietyAfter: parseInt(newMealForm.satietyAfter, 10) || 7,
      notes: newMealForm.notes.trim(),
    };

    setLogsByDate((prev) => {
      const dayData = prev[selectedDate] || {
        waterGlasses: 0,
        meals: { desayuno: [], almuerzo: [], merienda: [], cena: [], colacion: [] },
      };

      const targetList = dayData.meals[activeMealModal] || [];

      return {
        ...prev,
        [selectedDate]: {
          ...dayData,
          meals: {
            ...dayData.meals,
            [activeMealModal]: [...targetList, newEntry],
          },
        },
      };
    });

    // Reset y cerrar modal
    setNewMealForm({
      name: '',
      energy: '400',
      satietyBefore: 3,
      satietyAfter: 7,
      notes: '',
    });
    setActiveMealModal(null);
  };

  // Eliminar comida
  const handleDeleteMeal = (category, mealId) => {
    setLogsByDate((prev) => {
      const dayData = prev[selectedDate];
      if (!dayData) return prev;

      return {
        ...prev,
        [selectedDate]: {
          ...dayData,
          meals: {
            ...dayData.meals,
            [category]: (dayData.meals[category] || []).filter((item) => item.id !== mealId),
          },
        },
      };
    });
  };

  // Sumar receta de inspiración al día
  const handleAddRecipeToDay = (recipe, mealCategory = 'almuerzo') => {
    const avgEnergy = parseInt(recipe.energyEstimate.split('-')[0].trim(), 10) || 450;
    const newEntry = {
      id: 'recipe-' + Date.now(),
      name: recipe.title,
      energy: avgEnergy,
      satietyBefore: 3,
      satietyAfter: 7,
      notes: 'Preparada siguiendo inspiración de NetAI.',
    };

    setLogsByDate((prev) => {
      const dayData = prev[selectedDate] || {
        waterGlasses: 0,
        meals: { desayuno: [], almuerzo: [], merienda: [], cena: [], colacion: [] },
      };

      const targetList = dayData.meals[mealCategory] || [];

      return {
        ...prev,
        [selectedDate]: {
          ...dayData,
          meals: {
            ...dayData.meals,
            [mealCategory]: [...targetList, newEntry],
          },
        },
      };
    });

    setActiveRecipeModal(null);
    setActiveTab('today');
  };

  // Navegar días
  const handleDayOffset = (offset) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + offset);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Manejo de Logout
  const handleLogout = async () => {
    if (!confirm('¿Deseás cerrar tu sesión familiar en este dispositivo?')) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Error en logout', e);
    }
    window.location.href = '/login';
  };

  // Filtrado de recetas
  const filteredRecipes = useMemo(() => {
    if (recipeFilter === 'Todos') return RECIPES_CATALOG;
    return RECIPES_CATALOG.filter((r) =>
      r.tags.includes(recipeFilter) || r.category.includes(recipeFilter)
    );
  }, [recipeFilter]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-stonecalm-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sage-600 text-white flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-stonecalm-600 font-medium text-sm">Cargando tu espacio de bienestar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stonecalm-50 via-sage-50/20 to-stonecalm-100/40 text-stonecalm-900 pb-24 sm:pb-16 flex flex-col">
      {/* ============================================================== */}
      {/* BARRA SUPERIOR (HEADER) */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-stonecalm-200/80 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Logo y Badge Familiar */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sage-500 to-sage-700 flex items-center justify-center text-white shadow-md shadow-sage-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-stonecalm-900">NetAI</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 border border-sage-200">
                  Familiar
                </span>
              </div>
              <p className="text-[11px] text-stonecalm-500 leading-none">Nutrición Ética & Sin Juicios</p>
            </div>
          </div>

          {/* Toggle Modo Intuitivo y Salir */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIntuitiveMode(!intuitiveMode)}
              title={intuitiveMode ? 'Activar vista con rangos de energía' : 'Ocultar números y activar Modo Intuitivo'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                intuitiveMode
                  ? 'bg-lavender-100 text-lavender-900 border border-lavender-300'
                  : 'bg-stonecalm-100 text-stonecalm-700 hover:bg-stonecalm-200 border border-stonecalm-200'
              }`}
            >
              {intuitiveMode ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-lavender-700" />
                  <span className="hidden sm:inline">Modo</span> Intuitivo
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-stonecalm-600" />
                  <span className="hidden sm:inline">Modo</span> Estándar
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              title="Cerrar sesión familiar"
              className="p-2 rounded-xl text-stonecalm-500 hover:text-earth-700 hover:bg-earth-50 border border-transparent hover:border-earth-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selector de Fecha */}
        <div className="max-w-4xl mx-auto mt-2 pt-2 border-t border-stonecalm-100 flex items-center justify-between text-xs">
          <button
            onClick={() => handleDayOffset(-1)}
            className="flex items-center gap-1 text-stonecalm-600 hover:text-stonecalm-900 px-2 py-1 rounded-lg hover:bg-stonecalm-100 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Día anterior
          </button>

          <div className="flex items-center gap-2 font-semibold text-stonecalm-800">
            <Calendar className="w-3.5 h-3.5 text-sage-600" />
            <span>
              {selectedDate === getTodayString()
                ? `Hoy (${selectedDate})`
                : selectedDate}
            </span>
          </div>

          <button
            onClick={() => handleDayOffset(1)}
            className="flex items-center gap-1 text-stonecalm-600 hover:text-stonecalm-900 px-2 py-1 rounded-lg hover:bg-stonecalm-100 transition-colors"
          >
            Día siguiente
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* CONTENIDO PRINCIPAL POR PESTAÑAS */}
      {/* ============================================================== */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-5 flex-1 space-y-6">
        {/* Banner de Bienvenida y Reflexión Ética */}
        <div className="bg-gradient-to-r from-sage-50 via-white to-earth-50 border border-sage-200/80 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-sage-100 text-sage-700 flex items-center justify-center shrink-0 mt-0.5">
            <Smile className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-sage-900 uppercase tracking-wide">
              {intuitiveMode ? '🌿 Modo Intuitivo Activo' : '✨ Bienestar Diario'}
            </p>
            <p className="text-xs sm:text-sm text-stonecalm-700 mt-0.5 italic">
              "{dailyEncouragement}"
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* TAB 1: MI DÍA */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'today' && (
          <div className="space-y-6 animate-fade-in">
            {/* Tarjeta de Energía o Armonía del Plato */}
            <div className="bg-white rounded-3xl p-6 border border-stonecalm-200/80 shadow-sm relative overflow-hidden">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-stonecalm-900">
                    {intuitiveMode ? 'Armonía y Balance del Día' : 'Balance de Energía Consciente'}
                  </h2>
                  <p className="text-xs text-stonecalm-500 mt-0.5">
                    {intuitiveMode
                      ? 'Sin números ni calorías. Tu cuerpo sabe qué y cuánto necesita.'
                      : 'Rango flexible de referencia. La nutrición se regula a nivel semanal.'}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-sage-50 text-sage-800 border border-sage-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
                  Pauta Segura
                </span>
              </div>

              {intuitiveMode ? (
                /* Vista Modo Intuitivo: Gráfico cualitativo de grupos de alimentos */
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-xl">🥗</span>
                      <p className="text-xs font-bold text-emerald-900 mt-1">Vegetales & Frutas</p>
                      <p className="text-[10px] text-emerald-700">Fibra y vitalidad</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                      <span className="text-xl">🍳</span>
                      <p className="text-xs font-bold text-amber-900 mt-1">Proteínas</p>
                      <p className="text-[10px] text-amber-700">Fuerza y saciedad</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-center">
                      <span className="text-xl">🍚</span>
                      <p className="text-xs font-bold text-sky-900 mt-1">Granos & Carbos</p>
                      <p className="text-[10px] text-sky-700">Energía activa</p>
                    </div>
                  </div>
                  <p className="text-xs text-stonecalm-600 text-center italic">
                    Priorizá la variedad de colores en tus platos antes que la rigidez de una balanza.
                  </p>
                </div>
              ) : (
                /* Vista Estándar: Barra de rango flexible */
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between text-sm">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-stonecalm-900">
                        {totalEnergyToday}
                      </span>
                      <span className="text-xs text-stonecalm-500">kcal registradas</span>
                    </div>
                    <span className="text-xs font-medium text-stonecalm-600">
                      Rango de referencia: <strong className="text-sage-700">{DEFAULT_ENERGY_RANGE.targetLabel}</strong>
                    </span>
                  </div>

                  {/* Barra de progreso con gradiente seguro */}
                  <div className="w-full h-3.5 bg-stonecalm-100 rounded-full overflow-hidden p-0.5 border border-stonecalm-200 relative">
                    <div
                      className="h-full bg-gradient-to-r from-sage-400 via-sage-500 to-ocean-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (totalEnergyToday / DEFAULT_ENERGY_RANGE.max) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stonecalm-500">
                    <span>Mínimo seguro: {MINIMUM_SAFE_ENERGY_FLOOR} kcal</span>
                    <span>Meta flexible: {DEFAULT_ENERGY_RANGE.min} - {DEFAULT_ENERGY_RANGE.max} kcal</span>
                  </div>

                  {totalEnergyToday >= DEFAULT_ENERGY_RANGE.min && (
                    <div className="p-2.5 rounded-xl bg-sage-50 border border-sage-200 text-sage-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
                      <span>¡Excelente balance! Tu cuerpo cuenta con la energía óptima para sus actividades diarias.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Registro de Hidratación Consciente (GAPA: 8 vasos) */}
            <div className="bg-white rounded-3xl p-6 border border-stonecalm-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stonecalm-900">Hidratación Consciente</h3>
                    <p className="text-[11px] text-stonecalm-500">Recomendación GAPA: 8 vasos de agua al día (~2 litros)</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-ocean-700 px-2.5 py-1 rounded-full bg-ocean-50 border border-ocean-200">
                  {currentDayLog.waterGlasses || 0} / 8 vasos
                </span>
              </div>

              {/* Botones de Vasos de Agua */}
              <div className="grid grid-cols-8 gap-2 pt-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
                  const isFilled = (currentDayLog.waterGlasses || 0) > index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleToggleWater(index)}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isFilled
                          ? 'bg-gradient-to-b from-ocean-400 to-ocean-600 text-white shadow-md shadow-ocean-500/25 scale-[1.02]'
                          : 'bg-stonecalm-100 hover:bg-stonecalm-200 text-stonecalm-400 border border-stonecalm-200/70'
                      }`}
                      title={`Vaso ${index + 1}`}
                    >
                      <Droplets className={`w-4 h-4 ${isFilled ? 'fill-current' : ''}`} />
                      <span className="text-[9px] font-bold mt-0.5">{index + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secciones de Comidas del Día */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-stonecalm-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-sage-600" />
                Momentos de Comida de Hoy
              </h3>

              {MEAL_CATEGORIES.map((cat) => {
                const items = currentDayLog.meals?.[cat.id] || [];
                return (
                  <div
                    key={cat.id}
                    className="bg-white rounded-3xl p-5 border border-stonecalm-200/80 shadow-sm transition-all hover:border-sage-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{cat.icon}</span>
                        <div>
                          <h4 className="font-bold text-sm text-stonecalm-900">{cat.label}</h4>
                          <p className="text-[11px] text-stonecalm-500">{cat.hint}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveMealModal(cat.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sage-50 hover:bg-sage-100 text-sage-800 text-xs font-semibold border border-sage-200 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-sage-600" />
                        Registrar
                      </button>
                    </div>

                    {/* Lista de platos en este momento */}
                    {items.length === 0 ? (
                      <div className="py-4 text-center border-2 border-dashed border-stonecalm-200/70 rounded-2xl">
                        <p className="text-xs text-stonecalm-400">
                          Aún no registraste comidas en este momento.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {items.map((meal) => (
                          <div
                            key={meal.id}
                            className="p-3.5 rounded-2xl bg-stonecalm-50 border border-stonecalm-200/70 flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-stonecalm-900">
                                  {meal.name}
                                </span>
                                {!intuitiveMode && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sage-100 text-sage-800">
                                    {meal.energy} kcal
                                  </span>
                                )}
                              </div>

                              {meal.notes && (
                                <p className="text-xs text-stonecalm-600 italic">
                                  "{meal.notes}"
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-[11px] text-stonecalm-500 pt-1">
                                <span>Hambre previa: <strong>{meal.satietyBefore}/10</strong></span>
                                <span>•</span>
                                <span>Saciedad posterior: <strong>{meal.satietyAfter}/10</strong></span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteMeal(cat.id, meal.id)}
                              title="Eliminar registro"
                              className="text-stonecalm-400 hover:text-earth-600 p-1.5 rounded-lg hover:bg-white transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 2: INSPIRACIÓN DE COMIDAS */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'inspiration' && (
          <div className="space-y-6 animate-fade-in">
            {/* El Método del Plato Visual (Harvard & GAPA) */}
            <div className="bg-white rounded-3xl p-6 border border-stonecalm-200/80 shadow-sm">
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sage-700 bg-sage-100 px-2.5 py-0.5 rounded-full">
                  Guía Visual Consciente
                </span>
                <h2 className="text-lg font-bold text-stonecalm-900 mt-2">
                  El Método del Plato Equilibrado
                </h2>
                <p className="text-xs text-stonecalm-500 mt-0.5">
                  Una forma sencilla de armar tus comidas principales sin necesidad de pesar alimentos.
                </p>
              </div>

              {/* Gráfico representativo del plato */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {PLATE_METHOD_SECTIONS.map((section) => (
                  <div
                    key={section.id}
                    className="p-4 rounded-2xl bg-stonecalm-50 border border-stonecalm-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-stonecalm-900">{section.name}</span>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-white border border-stonecalm-200 text-stonecalm-800">
                          {section.percentage}%
                        </span>
                      </div>
                      <p className="text-xs text-stonecalm-600 mb-2">{section.description}</p>
                    </div>
                    <div className="text-[11px] text-stonecalm-500 pt-2 border-t border-stonecalm-200">
                      <strong>Ejemplos:</strong> {section.examples}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtros de Recetas */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['Todos', 'Vegetariano', 'Rápido', 'Legumbres', 'Familiar', 'GAPA'].map((f) => (
                <button
                  key={f}
                  onClick={() => setRecipeFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    recipeFilter === f
                      ? 'bg-sage-600 text-white shadow-sm'
                      : 'bg-white text-stonecalm-600 hover:bg-stonecalm-100 border border-stonecalm-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Grid de Recetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-3xl p-5 border border-stonecalm-200/80 shadow-sm flex flex-col justify-between hover:border-sage-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-sage-800 bg-sage-50 px-2.5 py-0.5 rounded-full border border-sage-200">
                        {recipe.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-stonecalm-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{recipe.time}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-stonecalm-900 leading-snug mb-2">
                      {recipe.title}
                    </h3>
                    <p className="text-xs text-stonecalm-600 line-clamp-2 mb-3">
                      {recipe.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {recipe.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-stonecalm-100 text-stonecalm-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stonecalm-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setActiveRecipeModal(recipe)}
                      className="text-xs font-semibold text-stonecalm-700 hover:text-sage-700 underline"
                    >
                      Ver preparación
                    </button>

                    <button
                      onClick={() => handleAddRecipeToDay(recipe, 'almuerzo')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Sumar a mi día
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Aviso ético no vinculante */}
            <div className="p-4 rounded-2xl bg-stonecalm-100/70 border border-stonecalm-200 text-stonecalm-600 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-stonecalm-500 shrink-0 mt-0.5" />
              <p>
                <strong>Inspiración culinaria no vinculante:</strong> Las recetas y proporciones son sugerencias orientativas basadas en guías de salud pública. Adaptá las porciones según tu apetito y condiciones médicas personales.
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 3: APRENDER (PSICOEDUCACIÓN & GAPA) */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'learn' && (
          <div className="space-y-6 animate-fade-in">
            {/* Escala de Hambre y Saciedad */}
            <div className="bg-white rounded-3xl p-6 border border-stonecalm-200/80 shadow-sm">
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ocean-700 bg-ocean-100 px-2.5 py-0.5 rounded-full">
                  Herramienta Práctica
                </span>
                <h2 className="text-lg font-bold text-stonecalm-900 mt-2">
                  Escala de Hambre y Saciedad (1 al 10)
                </h2>
                <p className="text-xs text-stonecalm-500 mt-0.5">
                  Una brújula interna para reconectar con tus sensaciones físicas genuinas.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {HUNGER_SATIETY_SCALE.map((level) => (
                  <div
                    key={level.level}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      level.zone === 'ideal'
                        ? 'bg-sage-50 border-sage-300 text-sage-950 shadow-sm'
                        : level.zone === 'neutral'
                        ? 'bg-white border-stonecalm-200 text-stonecalm-800'
                        : 'bg-stonecalm-50 border-stonecalm-200 text-stonecalm-600'
                    }`}
                  >
                    <div className="text-lg font-extrabold">{level.level}</div>
                    <div className="text-[11px] font-bold mt-0.5">{level.label}</div>
                    <div className="text-[10px] text-stonecalm-500 mt-1 line-clamp-2">
                      {level.desc}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-stonecalm-500 text-center mt-4 italic">
                El rango óptimo para comer con serenidad suele encontrarse entre los niveles 3 (hambre moderada) y 7 (cómodamente saciado).
              </p>
            </div>

            {/* Lista de Artículos */}
            <div className="space-y-4">
              <h3 className="font-bold text-base text-stonecalm-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sage-600" />
                Lecturas Breves de Salud y Nutrición Consciente
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EDUCATION_ARTICLES.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => setActiveArticleModal(article)}
                    className="bg-white rounded-3xl p-5 border border-stonecalm-200/80 shadow-sm cursor-pointer hover:border-sage-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-stonecalm-500 mb-2">
                        <span className="font-semibold text-sage-700 bg-sage-50 px-2.5 py-0.5 rounded-full border border-sage-200">
                          {article.category}
                        </span>
                        <span>Lectura: {article.readTime}</span>
                      </div>
                      <h4 className="font-bold text-base text-stonecalm-900 mb-1">
                        {article.title}
                      </h4>
                      <p className="text-xs text-stonecalm-600 mb-3">
                        {article.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stonecalm-100 flex items-center justify-between text-xs font-semibold text-sage-700">
                      <span>Leer artículo completo</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* BARRA DE NAVEGACIÓN INFERIOR (PWA BOTTOM TABS) */}
      {/* ============================================================== */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stonecalm-200/80 px-4 py-2 sm:py-2.5 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
              activeTab === 'today'
                ? 'text-sage-700 font-bold bg-sage-50'
                : 'text-stonecalm-500 hover:text-stonecalm-800'
            }`}
          >
            <Utensils className="w-5 h-5 mb-1" />
            <span className="text-[11px]">Mi Día</span>
          </button>

          <button
            onClick={() => setActiveTab('inspiration')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
              activeTab === 'inspiration'
                ? 'text-sage-700 font-bold bg-sage-50'
                : 'text-stonecalm-500 hover:text-stonecalm-800'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-1" />
            <span className="text-[11px]">Inspiración</span>
          </button>

          <button
            onClick={() => setActiveTab('learn')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
              activeTab === 'learn'
                ? 'text-sage-700 font-bold bg-sage-50'
                : 'text-stonecalm-500 hover:text-stonecalm-800'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-1" />
            <span className="text-[11px]">Aprender</span>
          </button>
        </div>
      </nav>

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR COMIDA */}
      {/* ============================================================== */}
      {activeMealModal && (
        <div className="fixed inset-0 z-50 bg-stonecalm-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-stonecalm-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stonecalm-100 mb-4">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-sage-600" />
                <h3 className="font-bold text-base text-stonecalm-900 capitalize">
                  Registrar {activeMealModal}
                </h3>
              </div>
              <button
                onClick={() => setActiveMealModal(null)}
                className="p-1 rounded-lg text-stonecalm-400 hover:text-stonecalm-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMealSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stonecalm-700 mb-1.5">
                  ¿Qué comiste? (Nombre del plato o alimentos)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ensalada de garbanzos con vegetales asados"
                  value={newMealForm.name}
                  onChange={(e) => setNewMealForm({ ...newMealForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stonecalm-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              {!intuitiveMode && (
                <div>
                  <label className="block text-xs font-semibold text-stonecalm-700 mb-1.5">
                    Energía estimada (kcal de bienestar)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="1800"
                    value={newMealForm.energy}
                    onChange={(e) => setNewMealForm({ ...newMealForm, energy: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stonecalm-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                  />
                  <p className="text-[11px] text-stonecalm-500 mt-1">
                    Estimación flexible. En NetAI no exigimos pesaje estricto.
                  </p>
                </div>
              )}

              {/* Escala de saciedad antes y después */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-stonecalm-700 mb-1">
                    Hambre antes (1-10)
                  </label>
                  <select
                    value={newMealForm.satietyBefore}
                    onChange={(e) => setNewMealForm({ ...newMealForm, satietyBefore: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stonecalm-200 text-xs bg-white"
                  >
                    {HUNGER_SATIETY_SCALE.map((s) => (
                      <option key={s.level} value={s.level}>
                        {s.level} - {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stonecalm-700 mb-1">
                    Saciedad después (1-10)
                  </label>
                  <select
                    value={newMealForm.satietyAfter}
                    onChange={(e) => setNewMealForm({ ...newMealForm, satietyAfter: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stonecalm-200 text-xs bg-white"
                  >
                    {HUNGER_SATIETY_SCALE.map((s) => (
                      <option key={s.level} value={s.level}>
                        {s.level} - {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stonecalm-700 mb-1.5">
                  Sensaciones o notas conscientes (opcional)
                </label>
                <textarea
                  rows="2"
                  placeholder="¿Cómo te sentiste al comer? ¿Disfrutaste los sabores?"
                  value={newMealForm.notes}
                  onChange={(e) => setNewMealForm({ ...newMealForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stonecalm-200 text-xs focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMealModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-stonecalm-200 text-xs font-semibold text-stonecalm-700 hover:bg-stonecalm-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold shadow-md shadow-sage-600/20"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: VER RECETA COMPLETA */}
      {/* ============================================================== */}
      {activeRecipeModal && (
        <div className="fixed inset-0 z-50 bg-stonecalm-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-stonecalm-200 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-stonecalm-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sage-700 bg-sage-100 px-2 py-0.5 rounded-full">
                  {activeRecipeModal.category}
                </span>
                <h3 className="font-bold text-lg text-stonecalm-900 mt-1">
                  {activeRecipeModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveRecipeModal(null)}
                className="p-1 rounded-lg text-stonecalm-400 hover:text-stonecalm-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stonecalm-600 italic">
              {activeRecipeModal.description}
            </p>

            {/* Ingredientes */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-stonecalm-800 mb-2">
                Ingredientes
              </h4>
              <ul className="space-y-1.5 text-xs text-stonecalm-700">
                {activeRecipeModal.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sage-600 font-bold">•</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instrucciones */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-stonecalm-800 mb-2">
                Preparación Paso a Paso
              </h4>
              <ol className="space-y-2 text-xs text-stonecalm-700 list-decimal pl-4">
                {activeRecipeModal.instructions.map((step, i) => (
                  <li key={i} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Nota de Mindful Eating */}
            <div className="p-3.5 rounded-2xl bg-sage-50 border border-sage-200 text-xs text-sage-900">
              <strong className="block font-semibold mb-1">🌿 Momento Consciente:</strong>
              <p>{activeRecipeModal.mindfulNote}</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveRecipeModal(null)}
                className="px-4 py-2.5 rounded-xl border border-stonecalm-200 text-xs font-semibold text-stonecalm-700"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleAddRecipeToDay(activeRecipeModal, 'almuerzo')}
                className="px-5 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold shadow-md"
              >
                Sumar a mi día de hoy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: LECTURA ARTÍCULO EDUCATIVO */}
      {/* ============================================================== */}
      {activeArticleModal && (
        <div className="fixed inset-0 z-50 bg-stonecalm-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-stonecalm-200 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-stonecalm-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sage-700 bg-sage-100 px-2 py-0.5 rounded-full">
                  {activeArticleModal.category}
                </span>
                <h3 className="font-bold text-lg text-stonecalm-900 mt-1">
                  {activeArticleModal.title}
                </h3>
                <p className="text-xs text-stonecalm-500">{activeArticleModal.subtitle}</p>
              </div>
              <button
                onClick={() => setActiveArticleModal(null)}
                className="p-1 rounded-lg text-stonecalm-400 hover:text-stonecalm-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-stonecalm-700 leading-relaxed">
              {activeArticleModal.content.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 text-xs text-earth-900">
              <strong className="block font-semibold mb-1">💡 Clave para poner en práctica:</strong>
              <p>{activeArticleModal.actionableTip}</p>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setActiveArticleModal(null)}
                className="px-5 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
