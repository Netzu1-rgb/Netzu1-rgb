'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Utensils,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Info,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Clock,
  X,
  Sunrise,
  Sun,
  Coffee,
  Moon,
  Apple,
  Settings2,
  Pencil,
  CalendarDays,
  Download,
  Upload,
  UserRound,
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
import { PlateGraphic, PLATE_TONES } from '@/components/brand/Plate';
import { LogoMark } from '@/components/brand/Logo';
import Onboarding from '@/components/onboarding/Onboarding';
import { PROFILE_KEY, loadProfile, saveProfile, emptyProfile, energyRangeFor, hidesNumbers } from '@/lib/profile';

const MEAL_CATEGORIES = [
  { id: 'desayuno', label: 'Desayuno', Icon: Sunrise, hint: 'Empezá el día con energía amable' },
  { id: 'almuerzo', label: 'Almuerzo', Icon: Sun, hint: 'Un momento para recargar y hacer una pausa' },
  { id: 'merienda', label: 'Merienda', Icon: Coffee, hint: 'Una pausa a media tarde' },
  { id: 'cena', label: 'Cena', Icon: Moon, hint: 'Algo reconfortante antes de descansar' },
  { id: 'colacion', label: 'Colación', Icon: Apple, hint: 'Si tu cuerpo te pide energía extra' },
];

const APP_VERSION = '1.2.0';
const STORAGE_KEY = 'netai_wellness_log_v1';
const INTUITIVE_KEY = 'netai_intuitive_mode';

function emptyDay() {
  return { waterGlasses: 0, meals: { desayuno: [], almuerzo: [], merienda: [], cena: [], colacion: [] } };
}

function offsetDate(dateStr, offset) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function average(values) {
  const v = values.filter((n) => Number.isFinite(n) && n > 0);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// Momento del día sugerido según la hora
function suggestedMoment() {
  const h = new Date().getHours();
  if (h < 11) return 'desayuno';
  if (h < 16) return 'almuerzo';
  if (h < 20) return 'merienda';
  return 'cena';
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function PwaAppPage() {
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'week' | 'inspiration' | 'learn'
  const [intuitiveMode, setIntuitiveMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [logsByDate, setLogsByDate] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [onboarding, setOnboarding] = useState(null); // 'inicial' | 'editar' | null

  // Hojas
  const [activeMealModal, setActiveMealModal] = useState(null); // momento del día que se está registrando
  const [editingMealId, setEditingMealId] = useState(null); // id del registro que se edita, o null si es nuevo
  const [activeRecipeModal, setActiveRecipeModal] = useState(null);
  const [recipeMoment, setRecipeMoment] = useState(suggestedMoment());
  const [activeArticleModal, setActiveArticleModal] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recipeFilter, setRecipeFilter] = useState('Todos');
  const [toast, setToast] = useState(null); // { text, undo? }

  const emptyForm = { name: '', energy: '400', satietyBefore: 3, satietyAfter: 7, notes: '' };
  const [newMealForm, setNewMealForm] = useState(emptyForm);

  const today = getTodayString();
  const isToday = selectedDate === today;

  // Frase del día
  const dailyEncouragement = useMemo(() => {
    const index = Math.abs(selectedDate.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0)) % MINDFUL_ENCOURAGEMENTS.length;
    return MINDFUL_ENCOURAGEMENTS[index];
  }, [selectedDate]);

  // Cargar de localStorage. La primera vez empieza vacío, sin datos de ejemplo.
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) setLogsByDate(JSON.parse(savedData));
      const savedIntuitive = localStorage.getItem(INTUITIVE_KEY);
      if (savedIntuitive !== null) setIntuitiveMode(savedIntuitive === 'true');
      const savedProfile = loadProfile();
      setProfile(savedProfile);
      if (!savedProfile) setOnboarding('inicial');
    } catch (e) {
      console.warn('Error leyendo localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logsByDate));
      localStorage.setItem(INTUITIVE_KEY, String(intuitiveMode));
    } catch (e) {
      console.warn('Error guardando en localStorage', e);
    }
  }, [logsByDate, intuitiveMode, isLoaded]);

  // El aviso se va solo a los 6 segundos
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const currentDayLog = useMemo(() => logsByDate[selectedDate] || emptyDay(), [logsByDate, selectedDate]);

  const totalEnergyToday = useMemo(() => {
    let sum = 0;
    Object.values(currentDayLog.meals || {}).forEach((list) => list.forEach((item) => { sum += Number(item.energy) || 0; }));
    return sum;
  }, [currentDayLog]);

  // Comidas frecuentes: las que más registraste, con la última energía usada
  const frequentMeals = useMemo(() => {
    const counts = new Map();
    Object.values(logsByDate).forEach((day) => {
      Object.values(day.meals || {}).forEach((list) => list.forEach((m) => {
        const key = (m.name || '').trim().toLowerCase();
        if (!key) return;
        const prev = counts.get(key) || { name: m.name.trim(), energy: m.energy, count: 0 };
        counts.set(key, { name: prev.name, energy: m.energy, count: prev.count + 1 });
      }));
    });
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [logsByDate]);

  // Últimos 7 días (hasta hoy) para la vista semanal
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = offsetDate(today, -i);
      const log = logsByDate[date] || emptyDay();
      const meals = Object.values(log.meals || {}).flat();
      days.push({
        date,
        water: log.waterGlasses || 0,
        meals: meals.length,
        hungerAvg: average(meals.map((m) => Number(m.satietyBefore))),
        satietyAvg: average(meals.map((m) => Number(m.satietyAfter))),
        cared: meals.length > 0 || (log.waterGlasses || 0) > 0,
      });
    }
    return days;
  }, [logsByDate, today]);

  const energyRange = useMemo(() => energyRangeFor(profile), [profile]);
  const numbersLocked = hidesNumbers(profile); // TCA: nunca se muestran números
  const showNumbers = !intuitiveMode && !numbersLocked;

  const updateDay = (date, fn) => {
    setLogsByDate((prev) => ({ ...prev, [date]: fn(prev[date] || emptyDay()) }));
  };

  // Agua
  const handleToggleWater = (glassIndex) => {
    const current = currentDayLog.waterGlasses || 0;
    const nextWater = glassIndex + 1 === current ? current - 1 : glassIndex + 1;
    updateDay(selectedDate, (day) => ({ ...day, waterGlasses: nextWater }));
  };

  // Abrir la hoja para registrar o para editar
  const openNewMeal = (category, preset) => {
    setToast(null);
    setEditingMealId(null);
    setNewMealForm(preset ? { ...emptyForm, ...preset } : emptyForm);
    setActiveMealModal(category);
  };

  const openEditMeal = (category, meal) => {
    setToast(null);
    setEditingMealId(meal.id);
    setNewMealForm({
      name: meal.name,
      energy: String(meal.energy ?? ''),
      satietyBefore: Number(meal.satietyBefore) || 3,
      satietyAfter: Number(meal.satietyAfter) || 7,
      notes: meal.notes || '',
    });
    setActiveMealModal(category);
  };

  const closeMealSheet = () => {
    setActiveMealModal(null);
    setEditingMealId(null);
    setNewMealForm(emptyForm);
  };

  const handleAddMealSubmit = (e) => {
    e.preventDefault();
    if (!newMealForm.name.trim()) return;
    const entry = {
      id: editingMealId || 'meal-' + Date.now(),
      name: newMealForm.name.trim(),
      energy: parseInt(newMealForm.energy, 10) || 350,
      satietyBefore: parseInt(newMealForm.satietyBefore, 10) || 3,
      satietyAfter: parseInt(newMealForm.satietyAfter, 10) || 7,
      notes: newMealForm.notes.trim(),
    };
    updateDay(selectedDate, (day) => {
      const list = day.meals[activeMealModal] || [];
      const next = editingMealId ? list.map((m) => (m.id === editingMealId ? entry : m)) : [...list, entry];
      return { ...day, meals: { ...day.meals, [activeMealModal]: next } };
    });
    setToast({ text: editingMealId ? 'Registro actualizado.' : 'Comida guardada.' });
    closeMealSheet();
  };

  // Borrar con opción de deshacer
  const handleDeleteMeal = (category, mealId) => {
    const date = selectedDate;
    const list = (logsByDate[date] || emptyDay()).meals[category] || [];
    const index = list.findIndex((m) => m.id === mealId);
    if (index < 0) return;
    const removed = list[index];
    updateDay(date, (day) => ({ ...day, meals: { ...day.meals, [category]: (day.meals[category] || []).filter((m) => m.id !== mealId) } }));
    setToast({
      text: `Borraste “${removed.name}”.`,
      undo: () => updateDay(date, (day) => {
        const current = [...(day.meals[category] || [])];
        current.splice(index, 0, removed);
        return { ...day, meals: { ...day.meals, [category]: current } };
      }),
    });
  };

  // Sumar una receta al momento elegido
  const handleAddRecipeToDay = (recipe, mealCategory) => {
    const avgEnergy = parseInt(String(recipe.energyEstimate || '').split('-')[0].trim(), 10) || 450;
    const entry = {
      id: 'recipe-' + Date.now(),
      name: recipe.title,
      energy: avgEnergy,
      satietyBefore: 3,
      satietyAfter: 7,
      notes: 'Receta de Inspiración.',
    };
    updateDay(selectedDate, (day) => ({ ...day, meals: { ...day.meals, [mealCategory]: [...(day.meals[mealCategory] || []), entry] } }));
    const label = MEAL_CATEGORIES.find((c) => c.id === mealCategory)?.label.toLowerCase();
    setToast({ text: `Sumaste la receta a ${label}.` });
    setActiveRecipeModal(null);
    setActiveTab('today');
  };

  // Días: no se puede avanzar más allá de hoy
  const handleDayOffset = (offset) => {
    const next = offsetDate(selectedDate, offset);
    if (next > today) return;
    setSelectedDate(next);
  };

  // Recorrido de datos personales y físicos
  const handleProfileFinish = (data) => {
    const wasEditing = onboarding === 'editar';
    saveProfile(data);
    setProfile(data);
    setIntuitiveMode(data.viewMode === 'intuitivo' || hidesNumbers(data));
    if (data.diet.includes('vegetariana') || data.diet.includes('vegana')) setRecipeFilter('Vegetariano');
    setOnboarding(null);
    setToast({ text: wasEditing ? 'Guardaste tus datos.' : 'Listo. Ya podés registrar tu primera comida.' });
  };

  const handleProfileSkip = () => {
    const data = { ...emptyProfile(), skipped: true };
    saveProfile(data);
    setProfile(data);
    setOnboarding(null);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Error en logout', e);
    }
    window.location.href = '/login';
  };

  // Copia de seguridad: los registros viven solo en este teléfono
  const handleExport = () => {
    const payload = { app: 'NetAI', version: 2, exportedAt: new Date().toISOString(), intuitiveMode, profile, logsByDate };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netai-registros-${today}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast({ text: 'Descargaste la copia de tus registros.' });
  };

  const handleImport = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (!data || data.app !== 'NetAI' || typeof data.logsByDate !== 'object') throw new Error('formato');
      setLogsByDate((prev) => ({ ...prev, ...data.logsByDate }));
      if (data.profile && typeof data.profile === 'object') {
        const restored = { ...emptyProfile(), ...data.profile };
        saveProfile(restored);
        setProfile(restored);
      }
      setToast({ text: 'Registros restaurados desde la copia.' });
      setSettingsOpen(false);
    } catch (e) {
      setToast({ text: 'Ese archivo no es una copia de NetAI. Elegí el archivo que descargaste desde Ajustes.' });
    }
  };

  const handleDeleteAll = () => {
    setLogsByDate({});
    setProfile(null);
    try { localStorage.removeItem(PROFILE_KEY); } catch (e) { /* sin almacenamiento */ }
    setSettingsOpen(false);
    setToast({ text: 'Borraste todos tus datos de este teléfono.' });
    setOnboarding('inicial');
  };

  const filteredRecipes = useMemo(() => {
    if (recipeFilter === 'Todos') return RECIPES_CATALOG;
    return RECIPES_CATALOG.filter((r) => r.tags.includes(recipeFilter) || r.category.includes(recipeFilter));
  }, [recipeFilter]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-loza-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="w-12 h-12" />
          <p className="text-loza-600 text-sm">Preparando tu día…</p>
        </div>
      </div>
    );
  }

  // Mientras está el recorrido de datos, es lo único en pantalla
  if (onboarding) {
    return (
      <Onboarding
        mode={onboarding}
        initial={onboarding === 'editar' ? profile : null}
        onFinish={handleProfileFinish}
        onSkip={handleProfileSkip}
        onClose={() => setOnboarding(null)}
      />
    );
  }

  const water = currentDayLog.waterGlasses || 0;
  const mealCount = Object.values(currentDayLog.meals || {}).reduce((n, list) => n + list.length, 0);

  return (
    <div className="min-h-screen bg-loza-50 text-loza-900 flex flex-col pb-28">
      {/* ============================================================== */}
      {/* ENCABEZADO */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-30 glass-surface border-x-0 border-t-0 safe-top">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <LogoMark className="w-8 h-8 shrink-0" />
            <div className="min-w-0">
              <p className="font-marca font-bold text-lg leading-none text-hoja-900">NetAI</p>
              <p className="text-xs text-loza-500 leading-tight mt-0.5">Acceso familiar</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!numbersLocked && <button
              type="button"
              role="switch"
              aria-checked={intuitiveMode}
              onClick={() => setIntuitiveMode(!intuitiveMode)}
              className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full text-sm font-bold text-loza-800 hover:bg-loza-100 transition-colors"
            >
              <span>Modo Intuitivo</span>
              <span
                aria-hidden="true"
                className={`relative w-10 h-6 rounded-full transition-colors ${intuitiveMode ? 'bg-hoja-600' : 'bg-loza-300'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${intuitiveMode ? 'translate-x-4' : ''}`}
                />
              </span>
            </button>}

            <button
              type="button"
              onClick={() => { setToast(null); setSettingsOpen(true); }}
              aria-label="Ajustes"
              title="Ajustes"
              className="p-2.5 rounded-full text-loza-600 hover:text-loza-900 hover:bg-loza-100 transition-colors"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selector de día */}
        <div className="max-w-3xl mx-auto px-2 sm:px-4 pb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleDayOffset(-1)}
            aria-label="Día anterior"
            className="p-2 rounded-full text-loza-600 hover:text-loza-900 hover:bg-loza-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="text-sm text-loza-800">
            <span className="font-bold">{isToday ? 'Hoy' : formatWeekday(selectedDate)}</span>
            <span className="text-loza-500">, {formatDayMonth(selectedDate)}</span>
          </p>
          <button
            type="button"
            onClick={() => handleDayOffset(1)}
            aria-label="Día siguiente"
            disabled={isToday}
            className="p-2 rounded-full text-loza-600 hover:text-loza-900 hover:bg-loza-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-6 flex-1">
        {/* ------------------------------------------------------------ */}
        {/* MI DÍA */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'today' && (
          <div className="space-y-10 animate-fade-in">
            {profile?.skipped && (
              <section aria-labelledby="titulo-completar" className="rounded-[24px] bg-white border border-loza-200 p-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex-1 min-w-[14rem]">
                  <h2 id="titulo-completar" className="font-display text-lg font-bold text-loza-900">Completá tus datos</h2>
                  <p className="text-sm text-loza-600 mt-0.5">Con tu edad, actividad y lo que comés, NetAI adapta tu rango de energía y tus recetas. Lleva 2 minutos.</p>
                </div>
                <button type="button" onClick={() => setOnboarding('editar')} className="px-5 py-2.5 rounded-full bg-hoja-600 hover:bg-hoja-700 text-white text-sm font-bold">
                  Completar
                </button>
              </section>
            )}

            <section aria-labelledby="titulo-dia">
              {profile?.name?.trim() && (
                <p className="font-display text-2xl font-bold text-loza-900 mb-1.5">Hola, {profile.name.trim()}</p>
              )}
              <p className="text-loza-600 text-[15px] leading-relaxed max-w-prose">{dailyEncouragement}</p>

              <div className="mt-6 rounded-[28px] bg-white border border-loza-200 p-5 sm:p-7">
                {!showNumbers ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <PlateGraphic className="w-40 h-40 sm:w-44 sm:h-44 mx-auto sm:mx-0 shrink-0" />
                    <div className="space-y-3">
                      <h2 id="titulo-dia" className="font-display text-2xl font-bold text-loza-900">Tu plato, sin números</h2>
                      <p className="text-loza-600 text-[15px] leading-relaxed">
                        Mitad vegetales y frutas, un cuarto de proteínas y un cuarto de cereales. Mirá los colores de tu plato antes que una balanza.
                      </p>
                      <PlateLegend />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                      <div>
                        <h2 id="titulo-dia" className="font-display text-xl font-bold text-loza-900">Energía de hoy</h2>
                        <p className="text-sm text-loza-500 mt-0.5">Un rango flexible: el cuerpo se regula a lo largo de la semana.</p>
                      </div>
                      <p className="font-display tabular text-loza-900">
                        <span className="text-4xl font-bold">{totalEnergyToday.toLocaleString('es-AR')}</span>
                        <span className="text-sm text-loza-500 ml-1.5">kcal</span>
                      </p>
                    </div>
                    <EnergyRange total={totalEnergyToday} range={energyRange} />
                  </div>
                )}
              </div>
            </section>

            {/* Hidratación */}
            <section aria-labelledby="titulo-agua">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="titulo-agua" className="font-display text-xl font-bold text-loza-900">Agua</h2>
                <p className="text-sm text-loza-600 tabular">
                  <span className="font-bold text-agua-700">{water}</span> de 8 vasos
                </p>
              </div>
              <p className="text-sm text-loza-500 mt-0.5">Las guías alimentarias argentinas sugieren unos 2 litros al día. Tocá un vaso para marcarlo.</p>
              <div className="mt-4 grid grid-cols-8 gap-1.5 sm:gap-3 max-w-md">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
                  const filled = water > index;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleToggleWater(index)}
                      aria-label={`Vaso ${index + 1}${filled ? ', tomado' : ''}`}
                      aria-pressed={filled}
                      className="group flex flex-col items-center gap-1 rounded-xl py-1 hover:bg-agua-50 transition-colors"
                    >
                      <WaterGlass filled={filled} className="w-7 h-9 sm:w-8 sm:h-10" />
                      <span className={`text-[11px] tabular ${filled ? 'text-agua-700 font-bold' : 'text-loza-400'}`}>{index + 1}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Comidas del día: es una secuencia real, de la mañana a la noche */}
            <section aria-labelledby="titulo-comidas">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="titulo-comidas" className="font-display text-xl font-bold text-loza-900">Comidas</h2>
                <p className="text-sm text-loza-500 tabular">{mealCount === 1 ? '1 registro' : `${mealCount} registros`}</p>
              </div>

              <ol className="mt-4 relative">
                {MEAL_CATEGORIES.map((cat, i) => {
                  const items = currentDayLog.meals?.[cat.id] || [];
                  const last = i === MEAL_CATEGORIES.length - 1;
                  return (
                    <li key={cat.id} className="relative pl-12 pb-7">
                      {!last && <span aria-hidden="true" className="absolute left-[19px] top-10 bottom-0 w-px bg-loza-200" />}
                      <span
                        aria-hidden="true"
                        className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center ${items.length ? 'bg-hoja-600 text-white' : 'bg-white border border-loza-200 text-loza-500'}`}
                      >
                        <cat.Icon className="w-[18px] h-[18px]" />
                      </span>

                      <div className="flex items-start justify-between gap-3 min-h-10">
                        <div className="pt-0.5 min-w-0">
                          <h3 className="font-display text-lg font-bold text-loza-900 leading-tight">{cat.label}</h3>
                          <p className="text-sm text-loza-500">{cat.hint}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openNewMeal(cat.id)}
                          className="shrink-0 inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-2 rounded-full text-sm font-bold text-hoja-700 hover:bg-hoja-50 border border-hoja-200 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Registrar
                        </button>
                      </div>

                      {items.length > 0 && (
                        <ul className="mt-3 space-y-2.5">
                          {items.map((meal) => (
                            <li key={meal.id} className="rounded-2xl bg-white border border-loza-200 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-bold text-[15px] text-loza-900 leading-snug min-w-0">{meal.name}</p>
                                <div className="flex items-center gap-1 shrink-0 -mr-1.5 -mt-1">
                                  {showNumbers && (
                                    <span className="text-sm text-loza-600 tabular whitespace-nowrap px-1">{meal.energy} kcal</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openEditMeal(cat.id, meal)}
                                    aria-label={`Editar ${meal.name}`}
                                    title="Editar registro"
                                    className="p-1.5 rounded-lg text-loza-400 hover:text-loza-800 hover:bg-loza-100 transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMeal(cat.id, meal.id)}
                                    aria-label={`Eliminar ${meal.name}`}
                                    title="Eliminar registro"
                                    className="p-1.5 rounded-lg text-loza-400 hover:text-remolacha-700 hover:bg-remolacha-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              {meal.notes && <p className="text-sm text-loza-600 mt-1">{meal.notes}</p>}
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                <ScaleReading label="Hambre antes" value={Number(meal.satietyBefore)} />
                                <ScaleReading label="Saciedad después" value={Number(meal.satietyAfter)} />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* SEMANA: constancia amable, sin rachas que se pierdan */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'week' && (
          <div className="space-y-10 animate-fade-in">
            <section aria-labelledby="titulo-semana">
              <h2 id="titulo-semana" className="font-display text-2xl font-bold text-loza-900">Tu semana</h2>
              <p className="text-loza-600 text-[15px] leading-relaxed mt-1.5 max-w-prose">
                {(() => {
                  const n = weekDays.filter((d) => d.cared).length;
                  if (n === 0) return 'Todavía no hay registros esta semana. Cuando registres una comida o un vaso de agua, lo vas a ver acá.';
                  if (n === 1) return 'Esta semana te cuidaste 1 día. Cada registro cuenta.';
                  return `Esta semana te cuidaste ${n} de 7 días. Un día sin registrar no borra nada.`;
                })()}
              </p>

              <ol className="mt-6 grid grid-cols-7 gap-1.5" aria-label="Días de la semana">
                {weekDays.map((d) => (
                  <li key={d.date}>
                    <button
                      type="button"
                      onClick={() => { setSelectedDate(d.date); setActiveTab('today'); }}
                      aria-label={`${formatWeekday(d.date)} ${formatDayMonth(d.date)}: ${d.meals} comidas y ${d.water} vasos de agua`}
                      className="w-full flex flex-col items-center gap-1.5 rounded-2xl py-2 hover:bg-loza-100 transition-colors"
                    >
                      <span className="text-xs text-loza-500 capitalize">{formatWeekday(d.date).slice(0, 3)}</span>
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold tabular ${d.cared ? 'bg-hoja-600 text-white' : 'bg-loza-100 text-loza-400'} ${d.date === today ? 'ring-2 ring-offset-2 ring-offset-loza-50 ring-hoja-300' : ''}`}>
                        {Number(d.date.slice(8))}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="titulo-agua-semana">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="titulo-agua-semana" className="font-display text-xl font-bold text-loza-900">Agua</h2>
                <p className="text-sm text-loza-500">vasos por día, de 8</p>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1.5 items-end h-36" role="img" aria-label={`Vasos de agua por día: ${weekDays.map((d) => d.water).join(', ')}`}>
                {weekDays.map((d) => (
                  <div key={d.date} className="flex flex-col items-center justify-end gap-1 h-full">
                    <span className="text-xs text-loza-600 tabular">{d.water || ''}</span>
                    <span className="w-full max-w-8 rounded-t-lg bg-agua-500" style={{ height: `${Math.max(d.water ? 6 : 2, (Math.min(d.water, 8) / 8) * 100)}%`, opacity: d.water ? 1 : 0.25 }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5 mt-1.5 border-t border-loza-200 pt-1.5">
                {weekDays.map((d) => (
                  <span key={d.date} className="text-center text-xs text-loza-500 capitalize">{formatWeekday(d.date).slice(0, 1)}</span>
                ))}
              </div>
            </section>

            <section aria-labelledby="titulo-escala-semana">
              <h2 id="titulo-escala-semana" className="font-display text-xl font-bold text-loza-900">Hambre y saciedad</h2>
              {(() => {
                const h = average(weekDays.map((d) => d.hungerAvg));
                const sat = average(weekDays.map((d) => d.satietyAvg));
                if (!h && !sat) return <p className="mt-2 text-loza-500">Cuando registres comidas, vas a ver acá cómo te sentiste en promedio.</p>;
                return (
                  <div className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-4">
                    <ScaleReading label="Hambre antes, en promedio" value={Math.round(h)} />
                    <ScaleReading label="Saciedad después, en promedio" value={Math.round(sat)} />
                  </div>
                );
              })()}
              <p className="mt-4 text-sm text-loza-500 max-w-prose">Comer con calma suele pasar entre el 3 y el 7 de la escala. Es una guía, no una meta.</p>
            </section>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* INSPIRACIÓN */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'inspiration' && (
          <div className="space-y-10 animate-fade-in">
            <section aria-labelledby="titulo-plato" className="grid sm:grid-cols-[auto_1fr] gap-6 items-center">
              <PlateGraphic className="w-44 h-44 mx-auto sm:mx-0" />
              <div>
                <h2 id="titulo-plato" className="font-display text-2xl font-bold text-loza-900">El Método del Plato</h2>
                <p className="text-loza-600 text-[15px] leading-relaxed mt-1.5">
                  Una forma de armar las comidas principales sin pesar nada, según las guías alimentarias argentinas (GAPA).
                </p>
              </div>
            </section>

            <dl className="grid gap-px bg-loza-200 rounded-[24px] overflow-hidden border border-loza-200">
              {PLATE_METHOD_SECTIONS.map((section) => {
                const tone = PLATE_TONES[section.id] || PLATE_TONES.vegetables;
                return (
                  <div key={section.id} className="bg-white p-5 grid sm:grid-cols-[180px_1fr] gap-x-6 gap-y-1.5">
                    <dt className="flex items-center gap-2.5">
                      <span aria-hidden="true" className={`w-3 h-3 rounded-full ${tone.dot}`} />
                      <span className="font-bold text-loza-900">{section.name}</span>
                      <span className="text-sm text-loza-500 tabular ml-auto sm:ml-0">{section.percentage === 50 ? 'la mitad' : 'un cuarto'}</span>
                    </dt>
                    <dd className="text-sm text-loza-600 leading-relaxed">
                      {section.description}
                      <span className="block text-loza-500 mt-1">{section.examples}</span>
                    </dd>
                  </div>
                );
              })}
            </dl>

            <section aria-labelledby="titulo-recetas">
              <h2 id="titulo-recetas" className="font-display text-xl font-bold text-loza-900">Recetas para inspirarte</h2>
              <div className="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar recetas">
                {['Todos', 'Vegetariano', 'Rápido', 'Legumbres', 'Familiar', 'GAPA'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setRecipeFilter(f)}
                    aria-pressed={recipeFilter === f}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                      recipeFilter === f
                        ? 'bg-loza-900 text-white'
                        : 'bg-white text-loza-700 border border-loza-200 hover:border-loza-400'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <ul className="mt-5 divide-y divide-loza-200 border-y border-loza-200">
                {filteredRecipes.map((recipe) => (
                  <li key={recipe.id} className="py-5 grid sm:grid-cols-[1fr_auto] gap-3 sm:gap-6 sm:items-center">
                    <div className="min-w-0">
                      <p className="text-sm text-loza-500 flex items-center gap-1.5">
                        <span>{recipe.category}</span>
                        <span aria-hidden="true" className="w-1 h-1 rounded-full bg-loza-300" />
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{recipe.time}</span>
                      </p>
                      <h3 className="font-display text-lg font-bold text-loza-900 leading-snug mt-1">{recipe.title}</h3>
                      <p className="text-sm text-loza-600 mt-1 line-clamp-2">{recipe.description}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                      <button
                        type="button"
                        onClick={() => handleAddRecipeToDay(recipe, suggestedMoment())}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-hoja-600 hover:bg-hoja-700 text-white text-sm font-bold transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Sumar a {MEAL_CATEGORIES.find((c) => c.id === suggestedMoment())?.label.toLowerCase()}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setToast(null); setRecipeMoment(suggestedMoment()); setActiveRecipeModal(recipe); }}
                        className="px-4 py-2 rounded-full text-sm font-bold text-loza-700 hover:bg-loza-100 transition-colors"
                      >
                        Ver receta
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {filteredRecipes.length === 0 && (
                <p className="py-8 text-center text-loza-500">No hay recetas con ese filtro. Probá con “Todos”.</p>
              )}
            </section>

            <p className="flex items-start gap-2.5 text-sm text-loza-500 leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              Las recetas y proporciones son orientativas y se basan en guías de salud pública. Adaptá las porciones a tu apetito y a tus indicaciones médicas.
            </p>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* APRENDER */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'learn' && (
          <div className="space-y-10 animate-fade-in">
            <section aria-labelledby="titulo-escala">
              <h2 id="titulo-escala" className="font-display text-2xl font-bold text-loza-900">Escala de hambre y saciedad</h2>
              <p className="text-loza-600 text-[15px] leading-relaxed mt-1.5 max-w-prose">
                Del 1 al 10, para reconocer cómo te sentís antes y después de comer. Comer con calma suele pasar entre el 3 y el 7.
              </p>

              <ol className="mt-6 grid grid-cols-10 gap-1" aria-label="Niveles de la escala">
                {HUNGER_SATIETY_SCALE.map((level) => (
                  <li key={level.level} className="flex flex-col items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={`w-full h-10 rounded-lg ${level.level >= 3 && level.level <= 7 ? 'bg-hoja-500' : level.level === 8 ? 'bg-hoja-200' : 'bg-loza-200'}`}
                    />
                    <span className="text-sm font-bold text-loza-800 tabular">{level.level}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-1 flex justify-between text-xs text-loza-500">
                <span>Mucha hambre</span>
                <span>Muy lleno</span>
              </div>

              <dl className="mt-6 divide-y divide-loza-200 border-y border-loza-200">
                {HUNGER_SATIETY_SCALE.map((level) => (
                  <div key={level.level} className="py-3 grid grid-cols-[2.5rem_1fr] gap-3">
                    <dt className="font-display text-xl font-bold text-loza-900 tabular leading-none pt-0.5">{level.level}</dt>
                    <dd>
                      <span className="font-bold text-loza-900">{level.label}.</span>{' '}
                      <span className="text-loza-600">{level.desc}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="titulo-lecturas">
              <h2 id="titulo-lecturas" className="font-display text-xl font-bold text-loza-900">Lecturas breves</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {EDUCATION_ARTICLES.map((article) => (
                  <li key={article.id}>
                    <button
                      type="button"
                      onClick={() => setActiveArticleModal(article)}
                      className="w-full h-full text-left rounded-[22px] bg-white border border-loza-200 p-5 hover:border-hoja-300 transition-colors flex flex-col"
                    >
                      <span className="text-sm text-loza-500">{article.category}, {article.readTime}</span>
                      <span className="font-display text-lg font-bold text-loza-900 leading-snug mt-1">{article.title}</span>
                      <span className="text-sm text-loza-600 mt-1.5">{article.summary}</span>
                      <span className="mt-auto pt-3 text-sm font-bold text-hoja-700">Leer</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* HOJA: AJUSTES */}
      {/* ============================================================== */}
      {settingsOpen && (
        <Sheet onClose={() => setSettingsOpen(false)} labelledBy="titulo-ajustes">
          <SettingsPanel
            intuitiveMode={intuitiveMode}
            onToggleIntuitive={() => setIntuitiveMode(!intuitiveMode)}
            onExport={handleExport}
            onImport={handleImport}
            onDeleteAll={handleDeleteAll}
            onLogout={handleLogout}
            onClose={() => setSettingsOpen(false)}
            onEditProfile={() => { setSettingsOpen(false); setOnboarding('editar'); }}
            numbersLocked={numbersLocked}
            hasData={Object.keys(logsByDate).length > 0 || !!profile?.completedAt}
          />
        </Sheet>
      )}

      {/* Aviso breve, con opción de deshacer */}
      <div aria-live="polite" className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 pointer-events-none">
        {toast && (
          <div className="pointer-events-auto flex items-center gap-4 max-w-md w-full sm:w-auto rounded-2xl bg-loza-900 text-white pl-4 pr-2 py-2.5 shadow-card animate-slide-up">
            <p className="text-sm flex-1">{toast.text}</p>
            {toast.undo && (
              <button
                type="button"
                onClick={() => { toast.undo(); setToast(null); }}
                className="shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold text-hoja-200 hover:bg-loza-800"
              >
                Deshacer
              </button>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* NAVEGACIÓN INFERIOR */}
      {/* ============================================================== */}
      <nav aria-label="Secciones" className="fixed bottom-0 inset-x-0 z-40 glass-surface border-x-0 border-b-0 safe-bottom">
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 pt-1.5 pb-2">
          {[
            { id: 'today', label: 'Mi día', Icon: Utensils },
            { id: 'week', label: 'Semana', Icon: CalendarDays },
            { id: 'inspiration', label: 'Inspiración', Icon: Sparkles },
            { id: 'learn', label: 'Aprender', Icon: BookOpen },
          ].map(({ id, label, Icon }) => {
            const on = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={on ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-colors ${on ? 'text-loza-900' : 'text-loza-500 hover:text-loza-800'}`}
              >
                <span className={`px-4 py-1 rounded-full transition-colors ${on ? 'bg-hoja-100 text-hoja-800' : ''}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className={`text-xs ${on ? 'font-bold' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ============================================================== */}
      {/* HOJA: REGISTRAR COMIDA */}
      {/* ============================================================== */}
      {activeMealModal && (
        <Sheet onClose={closeMealSheet} labelledBy="titulo-registro">
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-registro" className="font-display text-xl font-bold text-loza-900">
              {editingMealId ? 'Editar' : 'Registrar'} {MEAL_CATEGORIES.find((c) => c.id === activeMealModal)?.label.toLowerCase()}
            </h2>
            <CloseButton onClick={closeMealSheet} />
          </div>

          {!editingMealId && frequentMeals.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold text-loza-800">Tus frecuentes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {frequentMeals.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setNewMealForm({ ...newMealForm, name: f.name, energy: String(f.energy ?? newMealForm.energy) })}
                    className={`px-3.5 py-2 rounded-full text-sm transition-colors text-left ${newMealForm.name === f.name ? 'bg-hoja-600 text-white' : 'bg-white border border-loza-200 text-loza-700 hover:border-loza-400'}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleAddMealSubmit} className="mt-5 space-y-5">
            <div>
              <label htmlFor="meal-name" className="block text-sm font-bold text-loza-800 mb-1.5">¿Qué comiste?</label>
              <input
                id="meal-name"
                type="text"
                required
                placeholder="Por ejemplo: ensalada de garbanzos con vegetales asados"
                value={newMealForm.name}
                onChange={(e) => setNewMealForm({ ...newMealForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-loza-300 bg-white text-[15px] placeholder:text-loza-400 focus:outline-none focus:border-hoja-500"
              />
            </div>

            {showNumbers && (
              <div>
                <label htmlFor="meal-energy" className="block text-sm font-bold text-loza-800 mb-1.5">Energía estimada (kcal)</label>
                <input
                  id="meal-energy"
                  type="number"
                  inputMode="numeric"
                  min="50"
                  max="1800"
                  value={newMealForm.energy}
                  onChange={(e) => setNewMealForm({ ...newMealForm, energy: e.target.value })}
                  className="w-40 px-4 py-3 rounded-2xl border border-loza-300 bg-white text-[15px] tabular focus:outline-none focus:border-hoja-500"
                />
                <p className="text-sm text-loza-500 mt-1.5">Una estimación alcanza. No hace falta pesar nada.</p>
              </div>
            )}

            <ScalePicker
              id="hambre-antes"
              label="Hambre antes de comer"
              value={Number(newMealForm.satietyBefore)}
              onChange={(v) => setNewMealForm({ ...newMealForm, satietyBefore: v })}
            />
            <ScalePicker
              id="saciedad-despues"
              label="Saciedad después de comer"
              value={Number(newMealForm.satietyAfter)}
              onChange={(v) => setNewMealForm({ ...newMealForm, satietyAfter: v })}
            />

            <div>
              <label htmlFor="meal-notes" className="block text-sm font-bold text-loza-800 mb-1.5">
                ¿Cómo te sentiste? <span className="font-normal text-loza-500">(opcional)</span>
              </label>
              <textarea
                id="meal-notes"
                rows="2"
                placeholder="¿Disfrutaste los sabores? ¿Comiste con calma?"
                value={newMealForm.notes}
                onChange={(e) => setNewMealForm({ ...newMealForm, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-loza-300 bg-white text-[15px] placeholder:text-loza-400 focus:outline-none focus:border-hoja-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeMealSheet}
                className="px-5 py-3 rounded-full text-sm font-bold text-loza-700 hover:bg-loza-100"
              >
                Cancelar
              </button>
              <button type="submit" className="px-6 py-3 rounded-full bg-hoja-600 hover:bg-hoja-700 text-white text-sm font-bold">
                {editingMealId ? 'Guardar cambios' : 'Guardar'}
              </button>
            </div>
          </form>
        </Sheet>
      )}

      {/* ============================================================== */}
      {/* HOJA: RECETA */}
      {/* ============================================================== */}
      {activeRecipeModal && (
        <Sheet onClose={() => setActiveRecipeModal(null)} labelledBy="titulo-receta">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-loza-500">{activeRecipeModal.category}, {activeRecipeModal.time}</p>
              <h2 id="titulo-receta" className="font-display text-2xl font-bold text-loza-900 leading-tight mt-0.5">{activeRecipeModal.title}</h2>
            </div>
            <CloseButton onClick={() => setActiveRecipeModal(null)} />
          </div>
          <p className="text-loza-600 mt-3 leading-relaxed">{activeRecipeModal.description}</p>

          <h3 className="font-display text-lg font-bold text-loza-900 mt-6">Ingredientes</h3>
          <ul className="mt-2 space-y-1.5 text-[15px] text-loza-700">
            {activeRecipeModal.ingredients.map((ing, i) => (
              <li key={i} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-2 w-1.5 h-1.5 rounded-full bg-hoja-500 shrink-0" />
                <span>{ing}</span>
              </li>
            ))}
          </ul>

          <h3 className="font-display text-lg font-bold text-loza-900 mt-6">Preparación</h3>
          <ol className="mt-2 space-y-3 text-[15px] text-loza-700">
            {activeRecipeModal.instructions.map((step, i) => (
              <li key={i} className="grid grid-cols-[1.75rem_1fr] gap-2">
                <span className="font-display font-bold text-hoja-700 tabular">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <p className="mt-6 rounded-2xl bg-hoja-50 p-4 text-[15px] text-hoja-900 leading-relaxed">{activeRecipeModal.mindfulNote}</p>

          <fieldset className="mt-6">
            <legend className="text-sm font-bold text-loza-800">¿En qué momento la vas a comer?</legend>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Momento del día">
              {MEAL_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={recipeMoment === c.id}
                  onClick={() => setRecipeMoment(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${recipeMoment === c.id ? 'bg-loza-900 text-white' : 'bg-white border border-loza-200 text-loza-700 hover:border-loza-400'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveRecipeModal(null)}
              className="px-5 py-3 rounded-full text-sm font-bold text-loza-700 hover:bg-loza-100"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => handleAddRecipeToDay(activeRecipeModal, recipeMoment)}
              className="px-6 py-3 rounded-full bg-hoja-600 hover:bg-hoja-700 text-white text-sm font-bold"
            >
              Sumar a {MEAL_CATEGORIES.find((c) => c.id === recipeMoment)?.label.toLowerCase()}
            </button>
          </div>
        </Sheet>
      )}

      {/* ============================================================== */}
      {/* HOJA: LECTURA */}
      {/* ============================================================== */}
      {activeArticleModal && (
        <Sheet onClose={() => setActiveArticleModal(null)} labelledBy="titulo-articulo">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-loza-500">{activeArticleModal.category}, {activeArticleModal.readTime}</p>
              <h2 id="titulo-articulo" className="font-display text-2xl font-bold text-loza-900 leading-tight mt-0.5">{activeArticleModal.title}</h2>
              {activeArticleModal.subtitle && <p className="text-loza-600 mt-1">{activeArticleModal.subtitle}</p>}
            </div>
            <CloseButton onClick={() => setActiveArticleModal(null)} />
          </div>

          <div className="mt-5 space-y-4 text-[15px] text-loza-700 leading-relaxed max-w-prose">
            {activeArticleModal.content.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-trigo-50 p-4 text-[15px] text-trigo-900 leading-relaxed">
            <p className="font-bold">Para poner en práctica</p>
            <p className="mt-1">{activeArticleModal.actionableTip}</p>
          </div>

          <div className="mt-6 text-right">
            <button
              type="button"
              onClick={() => setActiveArticleModal(null)}
              className="px-6 py-3 rounded-full bg-hoja-600 hover:bg-hoja-700 text-white text-sm font-bold"
            >
              Listo
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ================================================================== */
/* PIEZAS DE INTERFAZ                                                  */
/* ================================================================== */

function formatWeekday(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const w = d.toLocaleDateString('es-AR', { weekday: 'long' });
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function formatDayMonth(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

function PlateLegend() {
  const items = [
    { label: 'Vegetales y frutas', dot: PLATE_TONES.vegetables.dot },
    { label: 'Proteínas', dot: PLATE_TONES.protein.dot },
    { label: 'Cereales y legumbres', dot: PLATE_TONES.carbs.dot },
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-loza-700">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2">
          <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${it.dot}`} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

// Rango de energía: marca el piso seguro y la franja flexible, nunca un "límite" que se excede
function EnergyRange({ total, range }) {
  const scaleMax = Math.round(range.max * 1.2);
  const pct = (v) => `${Math.min(100, (v / scaleMax) * 100)}%`;
  const inRange = total >= range.min;
  return (
    <div className="mt-6">
      <div className="relative h-3 rounded-full bg-loza-100">
        <div
          className="absolute inset-y-0 rounded-full bg-hoja-100"
          style={{ left: pct(range.min), width: `calc(${pct(range.max)} - ${pct(range.min)})` }}
        />
        <div className="absolute inset-y-0 left-0 rounded-full bg-hoja-600 transition-[width] duration-500" style={{ width: pct(total) }} />
        <div className="absolute -top-1 -bottom-1 w-0.5 bg-loza-700 rounded" style={{ left: pct(MINIMUM_SAFE_ENERGY_FLOOR) }} aria-hidden="true" />
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-loza-600 tabular">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="w-0.5 h-3.5 rounded bg-loza-700" />
          Piso seguro: {MINIMUM_SAFE_ENERGY_FLOOR.toLocaleString('es-AR')} kcal
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="w-3.5 h-2.5 rounded-sm bg-hoja-100 border border-hoja-300" />
          {range.personal ? 'Tu rango' : 'Rango general'}: {range.min.toLocaleString('es-AR')} a {range.max.toLocaleString('es-AR')} kcal
        </li>
      </ul>
      {inRange && (
        <p className="mt-3 text-sm text-hoja-800">Hoy tu cuerpo ya recibió energía de sobra para tu día.</p>
      )}
    </div>
  );
}

// Vaso de agua dibujado: se llena al tocarlo
function WaterGlass({ filled, className = '' }) {
  return (
    <svg viewBox="0 0 32 40" className={className} aria-hidden="true">
      <path d="M5 4 H27 L24 36 H8 Z" fill={filled ? '#D8E8F3' : '#FFFFFF'} stroke={filled ? '#3478A8' : '#C3CEC5'} strokeWidth="2" strokeLinejoin="round" />
      {filled && <path d="M6.6 14 H25.4 L23.6 34.2 H8.4 Z" fill="#3478A8" />}
    </svg>
  );
}

// Lectura de la escala 1 a 10 con su valor marcado
function ScaleReading({ label, value }) {
  const level = HUNGER_SATIETY_SCALE.find((l) => l.level === value);
  return (
    <div>
      <p className="text-xs text-loza-500">
        {label}: <span className="font-bold text-loza-800 tabular">{value}</span>
        {level ? <span className="text-loza-500">, {level.label.toLowerCase()}</span> : null}
      </p>
      <div className="mt-1.5 flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i + 1 <= value ? 'bg-hoja-500' : 'bg-loza-200'}`} />
        ))}
      </div>
    </div>
  );
}

// Selector táctil de la escala 1 a 10
function ScalePicker({ id, label, value, onChange }) {
  const level = HUNGER_SATIETY_SCALE.find((l) => l.level === value);
  return (
    <fieldset>
      <legend className="text-sm font-bold text-loza-800">{label}</legend>
      <div className="mt-2 grid grid-cols-10 gap-1" role="radiogroup" aria-label={label}>
        {HUNGER_SATIETY_SCALE.map((l) => {
          const on = l.level === value;
          return (
            <button
              key={l.level}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${l.level}, ${l.label}`}
              onClick={() => onChange(l.level)}
              className={`h-10 rounded-xl text-sm font-bold tabular transition-colors ${
                on ? 'bg-hoja-600 text-white' : 'bg-loza-100 text-loza-700 hover:bg-loza-200'
              }`}
            >
              {l.level}
            </button>
          );
        })}
      </div>
      <p id={`${id}-label`} className="mt-1.5 text-sm text-loza-600 min-h-[1.25rem]">
        {level ? `${level.label}. ${level.desc}` : ''}
      </p>
    </fieldset>
  );
}

function Sheet({ children, onClose, labelledBy }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-loza-950/45 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-loza-50 rounded-t-[28px] sm:rounded-[28px] shadow-sheet px-5 pt-5 pb-8 sm:p-7 animate-slide-up safe-bottom"
      >
        <span aria-hidden="true" className="sm:hidden block mx-auto -mt-1 mb-4 w-10 h-1 rounded-full bg-loza-300" />
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Cerrar"
      className="shrink-0 p-2 -mr-2 -mt-1 rounded-full text-loza-500 hover:text-loza-900 hover:bg-loza-100"
    >
      <X className="w-5 h-5" />
    </button>
  );
}

// Ajustes: copia de seguridad, borrar datos, legales y salir. Las acciones que borran piden confirmación dentro de la hoja.
function SettingsPanel({ intuitiveMode, onToggleIntuitive, onExport, onImport, onDeleteAll, onLogout, onClose, onEditProfile, numbersLocked, hasData }) {
  const [confirm, setConfirm] = useState(null); // 'delete' | 'logout' | null
  const fileRef = useRef(null);
  const row = 'w-full flex items-center gap-3 py-3.5 text-left text-[15px] text-loza-800 hover:text-loza-900';
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-ajustes" className="font-display text-xl font-bold text-loza-900">Ajustes</h2>
        <CloseButton onClick={onClose} />
      </div>

      <div className="mt-4 divide-y divide-loza-200 border-y border-loza-200">
        <button type="button" onClick={onEditProfile} className={row}>
          <UserRound className="w-5 h-5 text-loza-500 shrink-0" aria-hidden="true" />
          <span>
            <span className="block font-bold">Tus datos</span>
            <span className="block text-sm text-loza-500">Edad, actividad, alimentación y cómo ver la app.</span>
          </span>
        </button>

        {numbersLocked ? (
          <p className="py-3.5 text-sm text-loza-600">El Modo Intuitivo está siempre activo según lo que respondiste en tus datos. Lo podés cambiar desde “Tus datos”.</p>
        ) : (
        <button type="button" role="switch" aria-checked={intuitiveMode} onClick={onToggleIntuitive} className={`${row} justify-between`}>
          <span>
            <span className="block font-bold">Modo Intuitivo</span>
            <span className="block text-sm text-loza-500">Oculta calorías y números en toda la app.</span>
          </span>
          <span aria-hidden="true" className={`relative w-10 h-6 rounded-full shrink-0 transition-colors ${intuitiveMode ? 'bg-hoja-600' : 'bg-loza-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${intuitiveMode ? 'translate-x-4' : ''}`} />
          </span>
        </button>
        )}

        <div className="py-3.5">
          <p className="font-bold text-[15px] text-loza-800">Copia de seguridad</p>
          <p className="text-sm text-loza-500 mt-0.5">Tus registros y tus datos están solo en este teléfono. Descargá una copia para no perderlos o para pasarlos a otro dispositivo.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onExport} disabled={!hasData} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-loza-900 text-white text-sm font-bold disabled:opacity-40">
              <Download className="w-4 h-4" aria-hidden="true" /> Descargar copia
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-loza-300 text-loza-800 text-sm font-bold hover:border-loza-500">
              <Upload className="w-4 h-4" aria-hidden="true" /> Restaurar copia
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }}
            />
          </div>
        </div>

        <div className="py-3.5">
          {confirm === 'delete' ? (
            <div className="rounded-2xl bg-remolacha-50 p-4">
              <p className="font-bold text-remolacha-900">¿Borrar todos tus datos?</p>
              <p className="text-sm text-remolacha-800 mt-1">Se borran tus registros y tus datos personales de este teléfono, y no se pueden recuperar salvo que tengas una copia.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={onDeleteAll} className="px-4 py-2.5 rounded-full bg-remolacha-700 text-white text-sm font-bold">Sí, borrar todo</button>
                <button type="button" onClick={() => setConfirm(null)} className="px-4 py-2.5 rounded-full text-sm font-bold text-remolacha-900 hover:bg-remolacha-100">Cancelar</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirm('delete')} disabled={!hasData} className="text-[15px] font-bold text-remolacha-700 disabled:opacity-40">
              Borrar todos mis datos
            </button>
          )}
        </div>

        <nav aria-label="Legal" className="py-3.5 flex gap-5 text-[15px]">
          <Link href="/privacidad" className="text-loza-700 underline underline-offset-4">Privacidad</Link>
          <Link href="/terminos" className="text-loza-700 underline underline-offset-4">Términos de uso</Link>
        </nav>

        <div className="py-3.5">
          {confirm === 'logout' ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] text-loza-800 w-full">¿Cerrar la sesión en este teléfono? Tus registros no se borran.</p>
              <button type="button" onClick={onLogout} className="px-4 py-2.5 rounded-full bg-loza-900 text-white text-sm font-bold">Cerrar sesión</button>
              <button type="button" onClick={() => setConfirm(null)} className="px-4 py-2.5 rounded-full text-sm font-bold text-loza-700 hover:bg-loza-100">Cancelar</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirm('logout')} className="inline-flex items-center gap-2 text-[15px] font-bold text-loza-800">
              <LogOut className="w-4 h-4" aria-hidden="true" /> Cerrar sesión
            </button>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs text-loza-400">NetAI, versión {APP_VERSION}</p>
    </div>
  );
}
