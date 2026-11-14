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
  Scale,
  Dumbbell,
  Camera,
  Loader2,
  Star,
  Bell,
  FileDown,
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
import { prepareImage } from '@/lib/photo';
import { sanitizeLogs, sanitizeWeights, parseJson, isObject } from '@/lib/storage';
import { PROFILE_KEY, WEIGHT_LOG_KEY, loadProfile, saveProfile, emptyProfile, avoidedFoods, energyRangeFor, hidesNumbers, sportPlan, isSport, SPORT_GOALS, weightTrend, minHealthyWeight, weeksToTarget } from '@/lib/profile';

const MEAL_CATEGORIES = [
  { id: 'desayuno', label: 'Desayuno', Icon: Sunrise, hint: 'Empezá el día con energía amable' },
  { id: 'almuerzo', label: 'Almuerzo', Icon: Sun, hint: 'Un momento para recargar y hacer una pausa' },
  { id: 'merienda', label: 'Merienda', Icon: Coffee, hint: 'Una pausa a media tarde' },
  { id: 'cena', label: 'Cena', Icon: Moon, hint: 'Algo reconfortante antes de descansar' },
  { id: 'colacion', label: 'Colación', Icon: Apple, hint: 'Si tu cuerpo te pide energía extra' },
];

const APP_VERSION = '1.7.2';
const STORAGE_KEY = 'netai_wellness_log_v1';
const PHOTO_CONSENT_KEY = 'netai_photo_consent';
const PREFS_KEY = 'netai_prefs_v1';
const DEFAULT_SCHEDULE = { desayuno: '08:00', almuerzo: '13:00', merienda: '17:00', cena: '21:00', colacion: '' };
const emptyPrefs = () => ({ favorites: [], schedule: { ...DEFAULT_SCHEDULE }, reminders: false, theme: 'auto' }); // theme: 'auto' | 'claro' | 'oscuro'
const sameName = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
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

function downloadFile(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  const [weightLog, setWeightLog] = useState([]); // [{ date, kg }] solo Modo Sport
  const [weightSheet, setWeightSheet] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  // Hojas
  const [activeMealModal, setActiveMealModal] = useState(null); // momento del día que se está registrando
  const [editingMealId, setEditingMealId] = useState(null); // id del registro que se edita, o null si es nuevo
  const [activeRecipeModal, setActiveRecipeModal] = useState(null);
  const [recipeMoment, setRecipeMoment] = useState(suggestedMoment());
  const [activeArticleModal, setActiveArticleModal] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recipeFilter, setRecipeFilter] = useState('Todos');
  const [toast, setToast] = useState(null); // { text, undo? }
  const [prefs, setPrefs] = useState(emptyPrefs); // favoritas, horarios y recordatorios
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [period, setPeriod] = useState('semana'); // 'semana' | 'mes'
  const [ideas, setIdeas] = useState({ status: 'idle', list: [], moment: suggestedMoment() });
  const remindedRef = useRef('');

  const emptyForm = { name: '', energy: '', protein: '', carbs: '', fat: '', satietyBefore: 3, satietyAfter: 7, notes: '' };
  const [photo, setPhoto] = useState({ status: 'idle' }); // idle | consent | loading | done | error
  const photoInputRef = useRef(null);
  const [newMealForm, setNewMealForm] = useState(emptyForm);

  // "Hoy" se actualiza si la app queda abierta al pasar la medianoche
  const [today, setToday] = useState(getTodayString());
  useEffect(() => {
    const check = () => {
      const now = getTodayString();
      setToday((prev) => {
        if (prev !== now) setSelectedDate((sel) => (sel === prev ? now : sel));
        return now;
      });
    };
    const id = setInterval(check, 60000);
    document.addEventListener('visibilitychange', check);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', check); };
  }, []);
  const isToday = selectedDate === today;

  // Tema: sigue al teléfono ("auto") o lo que la persona elija. Solo se aplica dentro de la app.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = prefs.theme === 'oscuro' || (prefs.theme !== 'claro' && mq.matches);
      document.documentElement.classList.toggle('oscuro', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0F1A15' : '#14412C');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      document.documentElement.classList.remove('oscuro');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#14412C');
    };
  }, [prefs.theme]);

  // Frase del día
  const dailyEncouragement = useMemo(() => {
    const index = Math.abs(selectedDate.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0)) % MINDFUL_ENCOURAGEMENTS.length;
    return MINDFUL_ENCOURAGEMENTS[index];
  }, [selectedDate]);

  // Cargar de localStorage. La primera vez empieza vacío, sin datos de ejemplo.
  useEffect(() => {
    try {
      // Cada dato se lee por separado: si uno está dañado, los demás igual se cargan
      const savedData = parseJson(localStorage.getItem(STORAGE_KEY));
      if (savedData) setLogsByDate(sanitizeLogs(savedData));
      const pr = parseJson(localStorage.getItem(PREFS_KEY));
      if (isObject(pr)) setPrefs({ ...emptyPrefs(), ...pr, favorites: Array.isArray(pr.favorites) ? pr.favorites.filter((f) => isObject(f) && typeof f.name === 'string') : [], schedule: { ...DEFAULT_SCHEDULE, ...(isObject(pr.schedule) ? pr.schedule : {}) } });
      const savedIntuitive = localStorage.getItem(INTUITIVE_KEY);
      if (savedIntuitive !== null) setIntuitiveMode(savedIntuitive === 'true');
      const savedWeights = parseJson(localStorage.getItem(WEIGHT_LOG_KEY));
      if (savedWeights) setWeightLog(sanitizeWeights(savedWeights));
      const savedProfile = loadProfile();
      setProfile(savedProfile);
      if (!savedProfile) setOnboarding('inicial');
    } catch (e) {
      console.warn('Error leyendo localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // Guardar en localStorage. Los registros pueden ser grandes (meses de comidas): se escriben un instante
  // después del último cambio para que cada toque responda al momento, y siempre antes de salir de la app.
  const pendingSave = useRef(null);
  useEffect(() => {
    if (!isLoaded) return undefined;
    const write = () => {
      pendingSave.current = null;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(logsByDate)); } catch (e) { console.warn('Error guardando en localStorage', e); }
    };
    pendingSave.current = write;
    const id = setTimeout(write, 250);
    return () => clearTimeout(id);
  }, [logsByDate, isLoaded]);
  useEffect(() => {
    const flush = () => pendingSave.current?.();
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => { flush(); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onHide); };
  }, []);
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(INTUITIVE_KEY, String(intuitiveMode));
      localStorage.setItem(WEIGHT_LOG_KEY, JSON.stringify(weightLog));
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Error guardando en localStorage', e);
    }
  }, [intuitiveMode, weightLog, prefs, isLoaded]);

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

  // Mes: últimos 30 días contra los 30 anteriores
  const monthStats = useMemo(() => {
    const span = (from, to) => {
      let cared = 0, mealCount = 0, water = 0, protein = 0, proteinDays = 0;
      const hunger = [], satiety = [];
      for (let i = from; i <= to; i++) {
        const log = logsByDate[offsetDate(today, -i)];
        if (!log) continue;
        const meals = Object.values(log.meals || {}).flat();
        if (meals.length || log.waterGlasses) cared++;
        mealCount += meals.length;
        water += log.waterGlasses || 0;
        meals.forEach((m) => { hunger.push(Number(m.satietyBefore)); satiety.push(Number(m.satietyAfter)); });
        const p = meals.reduce((n, m) => n + (Number(m.protein) || 0), 0);
        if (p > 0) { protein += p; proteinDays++; }
      }
      return { cared, mealCount, waterAvg: cared ? water / cared : null, hunger: average(hunger), satiety: average(satiety), proteinAvg: proteinDays ? protein / proteinDays : null };
    };
    return { now: span(0, 29), prev: span(30, 59) };
  }, [logsByDate, today]);

  const energyRange = useMemo(() => energyRangeFor(profile), [profile]);
  const numbersLocked = hidesNumbers(profile); // TCA: nunca se muestran números
  // Modo Sport: el plan usa el último peso registrado
  const trend = useMemo(() => weightTrend(weightLog), [weightLog]);
  const plan = useMemo(() => {
    if (!isSport(profile)) return null;
    return sportPlan(trend ? { ...profile, weightKg: trend.latest } : profile);
  }, [profile, trend]);
  const sportOn = !!plan;
  const showNumbers = sportOn || (!intuitiveMode && !numbersLocked);
  const waterTarget = plan?.waterGlasses || 8;
  const macrosToday = useMemo(() => {
    const all = Object.values(currentDayLog.meals || {}).flat();
    const sum = (k) => all.reduce((n, m) => n + (Number(m[k]) || 0), 0);
    return { protein: sum('protein'), carbs: sum('carbs'), fat: sum('fat') };
  }, [currentDayLog]);
  const proteinToday = macrosToday.protein;

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
    setPhoto({ status: 'idle' });
    setEditingMealId(null);
    setNewMealForm(preset ? { ...emptyForm, ...preset } : emptyForm);
    setActiveMealModal(category);
  };

  const openEditMeal = (category, meal) => {
    setToast(null);
    setPhoto({ status: 'idle' });
    setEditingMealId(meal.id);
    setNewMealForm({
      name: meal.name,
      energy: String(meal.energy ?? ''),
      protein: meal.protein != null ? String(meal.protein) : '',
      carbs: meal.carbs != null ? String(meal.carbs) : '',
      fat: meal.fat != null ? String(meal.fat) : '',
      satietyBefore: Number(meal.satietyBefore) || 3,
      satietyAfter: Number(meal.satietyAfter) || 7,
      notes: meal.notes || '',
    });
    setActiveMealModal(category);
  };

  const closeMealSheet = () => {
    setPhoto({ status: 'idle' });
    setActiveMealModal(null);
    setEditingMealId(null);
    setNewMealForm(emptyForm);
  };

  // Foto del plato: la primera vez pide permiso; después abre la cámara
  const startPhoto = () => {
    let consent = false;
    try { consent = localStorage.getItem(PHOTO_CONSENT_KEY) === 'true'; } catch (e) { /* sin almacenamiento */ }
    if (!consent) { setPhoto({ status: 'consent' }); return; }
    photoInputRef.current?.click();
  };

  const acceptPhotoConsent = () => {
    try { localStorage.setItem(PHOTO_CONSENT_KEY, 'true'); } catch (e) { /* sin almacenamiento */ }
    setPhoto({ status: 'idle' });
    photoInputRef.current?.click();
  };

  const handlePhotoFile = async (file) => {
    if (!file) return;
    let prepared;
    try {
      prepared = await prepareImage(file);
    } catch (e) {
      setPhoto({ status: 'error', error: 'No pudimos leer esa imagen. Probá con otra foto.' });
      return;
    }
    setPhoto({ status: 'loading', preview: prepared.preview });
    try {
      const res = await fetch('/api/analizar-plato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: prepared.base64, mimeType: prepared.mimeType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'No pudimos analizar la foto.');
      setNewMealForm((prev) => ({
        ...prev,
        name: data.name,
        energy: String(data.energy),
        protein: String(data.protein),
        carbs: String(data.carbs),
        fat: String(data.fat),
      }));
      setPhoto({ status: 'done', preview: prepared.preview, result: data });
    } catch (e) {
      setPhoto({ status: 'error', preview: prepared.preview, error: e.message });
    }
  };

  // Favoritas: comidas guardadas a mano para registrarlas con un toque
  const isFavorite = (name) => prefs.favorites.some((f) => sameName(f.name, name));
  const toggleFavorite = (meal) => {
    const was = isFavorite(meal.name);
    setPrefs((prev) => ({
      ...prev,
      favorites: was
        ? prev.favorites.filter((f) => !sameName(f.name, meal.name))
        : [...prev.favorites, { name: meal.name.trim(), energy: meal.energy ?? null, protein: meal.protein ?? null, carbs: meal.carbs ?? null, fat: meal.fat ?? null }].slice(-30),
    }));
    setToast({ text: was ? 'La quitaste de tus favoritas.' : 'Guardada en tus favoritas.' });
  };
  const applyPreset = (f) => setNewMealForm((prev) => ({
    ...prev,
    name: f.name,
    energy: f.energy != null ? String(f.energy) : '',
    protein: f.protein != null ? String(f.protein) : '',
    carbs: f.carbs != null ? String(f.carbs) : '',
    fat: f.fat != null ? String(f.fat) : '',
  }));

  // Recordatorios: a la hora de cada comida, si todavía no la registraste. Funcionan con la app abierta.
  useEffect(() => {
    if (!isLoaded || !prefs.reminders) return;
    const tick = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const day = getTodayString();
      const cat = MEAL_CATEGORIES.find((c) => prefs.schedule[c.id] === hhmm);
      if (!cat) return;
      const key = `${day}-${cat.id}`;
      if (remindedRef.current === key) return;
      remindedRef.current = key;
      if (((logsByDate[day] || emptyDay()).meals[cat.id] || []).length > 0) return;
      const text = `Es la hora de tu ${cat.label.toLowerCase()}. Cuando comas, registralo con calma.`;
      setToast({ text });
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
          navigator.serviceWorker?.ready.then((reg) => reg.showNotification('NetAI', { body: text, icon: '/icons/icon-192.png', tag: key }));
        }
      } catch (e) { /* sin notificaciones del sistema */ }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [isLoaded, prefs.reminders, prefs.schedule, logsByDate]);

  const setReminders = async (on) => {
    if (on && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch (e) { /* el aviso dentro de la app sigue funcionando */ }
    }
    setPrefs((prev) => ({ ...prev, reminders: on }));
  };

  // Historial en una planilla (CSV) para abrir en Excel o Google Sheets
  const handleExportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Fecha', 'Momento', 'Comida', 'Energía (kcal)', 'Proteínas (g)', 'Carbohidratos (g)', 'Grasas (g)', 'Hambre antes', 'Saciedad después', 'Notas', 'Vasos de agua del día']];
    Object.keys(logsByDate).sort().forEach((date) => {
      const day = logsByDate[date];
      let any = false;
      MEAL_CATEGORIES.forEach((c) => (day.meals?.[c.id] || []).forEach((m) => {
        any = true;
        rows.push([date, c.label, m.name, m.energy, m.protein, m.carbs, m.fat, m.satietyBefore, m.satietyAfter, m.notes, day.waterGlasses || 0]);
      }));
      if (!any && day.waterGlasses) rows.push([date, '', '', '', '', '', '', '', '', '', day.waterGlasses]);
    });
    const csv = '\ufeff' + rows.map((r) => r.map(esc).join(';')).join('\r\n');
    downloadFile(csv, `netai-historial-${today}.csv`, 'text/csv;charset=utf-8');
    setToast({ text: 'Descargaste tu historial.' });
  };

  // Sugerencias de comidas con IA para el momento elegido
  const askIdeas = async (moment) => {
    setIdeas({ status: 'loading', list: [], moment });
    try {
      const sport = plan
        ? { goal: SPORT_GOALS.find((g) => g.id === plan.goal)?.label, energyLeft: Math.max(0, plan.energy.max - totalEnergyToday), proteinLeft: Math.max(0, plan.proteinG[0] - proteinToday) }
        : null;
      const res = await fetch('/api/sugerir-comidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moment, diet: profile?.diet || [], allergies: avoidedFoods(profile), sport }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'No pudimos traer sugerencias.');
      setIdeas({ status: 'done', list: data.suggestions, moment });
    } catch (e) {
      setIdeas({ status: 'error', list: [], moment, error: e.message });
    }
  };

  const addIdea = (idea) => {
    const entry = { id: 'idea-' + Date.now(), name: idea.name, energy: idea.energy, protein: idea.protein, carbs: idea.carbs, fat: idea.fat, satietyBefore: 3, satietyAfter: 7, notes: 'Sugerencia de NetAI.' };
    updateDay(selectedDate, (day) => ({ ...day, meals: { ...day.meals, [ideas.moment]: [...(day.meals[ideas.moment] || []), entry] } }));
    setToast({ text: `Sumaste la sugerencia a ${MEAL_CATEGORIES.find((c) => c.id === ideas.moment)?.label.toLowerCase()}.` });
    setActiveTab('today');
  };

  // Informe del mes en texto, para guardar o compartir con un profesional
  const handleMonthReport = () => {
    const f = (n, d = 1) => (n == null ? 'sin datos' : Number(n).toLocaleString('es-AR', { maximumFractionDigits: d }));
    const { now, prev } = monthStats;
    const lines = [
      'NetAI: informe de hábitos de los últimos 30 días',
      `Generado el ${formatDayMonth(today)} de ${today.slice(0, 4)}`,
      '',
      `Días con registros: ${now.cared} de 30 (30 días anteriores: ${prev.cared})`,
      `Comidas registradas: ${now.mealCount} (antes: ${prev.mealCount})`,
      `Agua, vasos por día registrado: ${f(now.waterAvg)} (antes: ${f(prev.waterAvg)})`,
      `Hambre antes de comer, promedio de 1 a 10: ${f(now.hunger)} (antes: ${f(prev.hunger)})`,
      `Saciedad después de comer, promedio de 1 a 10: ${f(now.satiety)} (antes: ${f(prev.satiety)})`,
      ...(sportOn ? [`Proteínas por día registrado: ${f(now.proteinAvg, 0)} g (antes: ${f(prev.proteinAvg, 0)} g)`] : []),
      '',
      'Los datos salen de lo que registraste en la app. Es información educativa y no reemplaza la consulta con un profesional de la salud.',
    ];
    downloadFile(lines.join('\r\n'), `netai-informe-${today}.txt`, 'text/plain;charset=utf-8');
    setToast({ text: 'Descargaste el informe del mes.' });
  };

  const handleAddMealSubmit = (e) => {
    e.preventDefault();
    if (!newMealForm.name.trim()) return;
    const entry = {
      id: editingMealId || 'meal-' + Date.now(),
      name: newMealForm.name.trim(),
      energy: newMealForm.energy === '' || !(parseInt(newMealForm.energy, 10) >= 0) ? null : parseInt(newMealForm.energy, 10),
      ...(newMealForm.protein !== '' && Number(newMealForm.protein) >= 0 ? { protein: Math.round(Number(newMealForm.protein)) } : {}),
      ...(newMealForm.carbs !== '' && Number(newMealForm.carbs) >= 0 ? { carbs: Math.round(Number(newMealForm.carbs)) } : {}),
      ...(newMealForm.fat !== '' && Number(newMealForm.fat) >= 0 ? { fat: Math.round(Number(newMealForm.fat)) } : {}),
      ...(photo.status === 'done' ? { source: 'foto' } : {}),
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
    const payload = { app: 'NetAI', version: 3, exportedAt: new Date().toISOString(), intuitiveMode, profile, weightLog, prefs, logsByDate };
    downloadFile(JSON.stringify(payload, null, 2), `netai-registros-${today}.json`, 'application/json');
    setToast({ text: 'Descargaste la copia de tus registros.' });
  };

  const handleImport = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (!isObject(data) || data.app !== 'NetAI' || !isObject(data.logsByDate)) throw new Error('formato');
      setLogsByDate((prev) => ({ ...prev, ...sanitizeLogs(data.logsByDate) }));
      if (Array.isArray(data.weightLog)) setWeightLog(sanitizeWeights(data.weightLog));
      if (isObject(data.prefs)) setPrefs({ ...emptyPrefs(), ...data.prefs, favorites: Array.isArray(data.prefs.favorites) ? data.prefs.favorites.filter((f) => isObject(f) && typeof f.name === 'string') : [], schedule: { ...DEFAULT_SCHEDULE, ...(isObject(data.prefs.schedule) ? data.prefs.schedule : {}) } });
      if (isObject(data.profile)) {
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
    setWeightLog([]);
    setPrefs(emptyPrefs());
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
        <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <LogoMark className="w-8 h-8 shrink-0" />
            <div className="min-w-0">
              <h1 className="font-marca font-bold text-lg leading-none text-hoja-900 tracking-normal">NetAI</h1>
              <p className="text-xs text-loza-600 leading-tight mt-0.5">{sportOn ? 'Modo Sport' : 'Bienestar'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!numbersLocked && !sportOn && <button
              type="button"
              role="switch"
              aria-checked={intuitiveMode}
              onClick={() => setIntuitiveMode(!intuitiveMode)}
              className="flex items-center gap-2 pl-3 pr-1.5 min-h-[44px] rounded-full text-sm font-bold text-loza-800 hover:bg-loza-100 transition-colors"
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
              className="p-3 rounded-full text-loza-600 hover:text-loza-900 hover:bg-loza-100 transition-colors"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selector de día: solo en las pestañas que dependen de la fecha */}
        {(activeTab === 'today' || activeTab === 'week') && <div className="max-w-3xl lg:max-w-5xl mx-auto px-1 sm:px-3 pb-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleDayOffset(-1)}
            aria-label="Día anterior"
            className="p-3 rounded-full text-loza-600 hover:text-loza-900 hover:bg-loza-100 transition-colors"
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
            className="p-3 rounded-full text-loza-600 hover:text-loza-900 hover:bg-loza-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>}
      </header>

      <main className="max-w-3xl lg:max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 lg:pt-10 flex-1">
        {/* ------------------------------------------------------------ */}
        {/* MI DÍA */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'today' && (
          // En pantallas anchas: resumen del día a la izquierda (queda a la vista) y comidas a la derecha
          <div className="space-y-10 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-x-14 lg:gap-y-10 lg:items-start animate-fade-in">
            {profile?.skipped && (
              <section aria-labelledby="titulo-completar" className="lg:col-span-2 rounded-[24px] bg-papel border border-loza-200 p-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex-1 min-w-[14rem]">
                  <h2 id="titulo-completar" className="font-display text-lg font-bold text-loza-900">Completá tus datos</h2>
                  <p className="text-sm text-loza-600 mt-0.5">Con tu edad, actividad y lo que comés, NetAI adapta tu rango de energía y tus recetas. Lleva 2 minutos.</p>
                </div>
                <button type="button" onClick={() => setOnboarding('editar')} className="px-5 py-2.5 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white text-sm font-bold">
                  Completar
                </button>
              </section>
            )}

            <div className="space-y-10 lg:sticky lg:top-32">
            <section aria-labelledby="titulo-dia">
              {profile?.name?.trim() && (
                <p className="font-display text-2xl font-bold text-loza-900 mb-1.5">Hola, {profile.name.trim()}</p>
              )}
              <p className="text-loza-600 text-[15px] leading-relaxed max-w-prose">{dailyEncouragement}</p>

              <div className="mt-6 rounded-[28px] bg-papel border border-loza-200 p-5 sm:p-7">
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
                    <EnergyRange total={totalEnergyToday} range={plan ? { ...plan.energy, personal: true, label: 'Tu objetivo' } : energyRange} floor={plan?.floor} />
                    {plan && <SportMacros plan={plan} today={macrosToday} goalLabel={SPORT_GOALS.find((g) => g.id === plan.goal)?.label} />}
                  </div>
                )}
              </div>
            </section>

            {/* Hidratación */}
            <section aria-labelledby="titulo-agua">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="titulo-agua" className="font-display text-xl font-bold text-loza-900">Agua</h2>
                <p className="text-sm text-loza-600 tabular">
                  <span className="font-bold text-agua-700">{water}</span> de {waterTarget} vasos
                </p>
              </div>
              <p className="text-sm text-loza-500 mt-0.5">
                {sportOn
                  ? `Según tu peso y tu entrenamiento, unos ${waterTarget} vasos de 250 ml. Los días que entrenás, sumá agua durante la sesión.`
                  : 'Las guías alimentarias argentinas sugieren unos 2 litros al día.'} Tocá un vaso para marcarlo.
              </p>
              <div className={`mt-4 grid ${waterTarget > 8 ? 'grid-cols-7' : 'grid-cols-8'} gap-0 gap-y-2 sm:gap-3 max-w-md`}>
                {Array.from({ length: waterTarget }, (_, i) => i).map((index) => {
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
                      <span className={`text-[11px] tabular ${filled ? 'text-agua-700 font-bold' : 'text-loza-500'}`}>{index + 1}</span>
                    </button>
                  );
                })}
              </div>
            </section>
            </div>

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
                        className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center ${items.length ? 'bg-hoja-600 text-white' : 'bg-papel border border-loza-200 text-loza-500'}`}
                      >
                        <cat.Icon className="w-[18px] h-[18px]" />
                      </span>

                      <div className="flex items-start justify-between gap-3 min-h-10">
                        <div className="pt-0.5 min-w-0">
                          <h3 className="font-display text-lg font-bold text-loza-900 leading-tight">
                            {cat.label}
                            {prefs.schedule[cat.id] && <span className="ml-2 font-sans text-sm font-normal text-loza-500 tabular">{prefs.schedule[cat.id]}</span>}
                          </h3>
                          <p className="text-sm text-loza-500">{cat.hint}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openNewMeal(cat.id)}
                          className="shrink-0 inline-flex items-center gap-1.5 pl-2.5 pr-3.5 min-h-[44px] rounded-full text-sm font-bold text-hoja-700 hover:bg-hoja-50 border border-hoja-200 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Registrar
                        </button>
                      </div>

                      {items.length > 0 && (
                        <ul className="mt-3 space-y-2.5">
                          {items.map((meal) => (
                            <li key={meal.id} className="rounded-2xl bg-papel border border-loza-200 p-4">
                              <div>
                                <p className="font-bold text-[15px] text-loza-900 leading-snug">{meal.name}</p>
                                <div className="flex items-center justify-end -mr-2.5 -mb-1">
                                  {showNumbers && (
                                    <span className="mr-auto text-sm text-loza-600 tabular whitespace-nowrap">{meal.energy != null ? `${meal.energy} kcal` : 'sin estimar'}</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => toggleFavorite(meal)}
                                    aria-pressed={isFavorite(meal.name)}
                                    aria-label={isFavorite(meal.name) ? `Quitar ${meal.name} de favoritas` : `Guardar ${meal.name} en favoritas`}
                                    title="Favorita"
                                    className={`w-11 h-11 grid place-items-center rounded-xl hover:bg-trigo-50 transition-colors ${isFavorite(meal.name) ? 'text-trigo-600' : 'text-loza-500 hover:text-trigo-700'}`}
                                  >
                                    <Star className="w-4 h-4" fill={isFavorite(meal.name) ? 'currentColor' : 'none'} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditMeal(cat.id, meal)}
                                    aria-label={`Editar ${meal.name}`}
                                    title="Editar registro"
                                    className="w-11 h-11 grid place-items-center rounded-xl text-loza-500 hover:text-loza-800 hover:bg-loza-100 transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMeal(cat.id, meal.id)}
                                    aria-label={`Eliminar ${meal.name}`}
                                    title="Eliminar registro"
                                    className="w-11 h-11 grid place-items-center rounded-xl text-loza-500 hover:text-remolacha-700 hover:bg-remolacha-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              {sportOn && (meal.protein != null || meal.carbs != null || meal.fat != null) && (
                                <p className="text-sm text-loza-600 mt-1 tabular">
                                  {[meal.protein != null && `P ${meal.protein} g`, meal.carbs != null && `C ${meal.carbs} g`, meal.fat != null && `G ${meal.fat} g`].filter(Boolean).join(' · ')}
                                </p>
                              )}
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
            <div className="inline-flex p-1 rounded-full bg-papel border border-loza-200" role="group" aria-label="Período">
              {[['semana', 'Semana'], ['mes', 'Mes']].map(([id, label]) => (
                <button key={id} type="button" aria-pressed={period === id} onClick={() => setPeriod(id)} className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${period === id ? 'bg-hoja-600 text-white' : 'text-loza-600 hover:text-loza-900'}`}>
                  {label}
                </button>
              ))}
            </div>

            {period === 'mes' && (
              <section aria-labelledby="titulo-mes">
                <h2 id="titulo-mes" className="font-display text-2xl font-bold text-loza-900">Tu mes</h2>
                <p className="text-loza-600 text-[15px] leading-relaxed mt-1.5 max-w-prose">Los últimos 30 días, al lado de los 30 anteriores. Sirve para ver hacia dónde van tus hábitos, sin metas que cumplir.</p>
                {monthStats.now.cared === 0 && monthStats.prev.cared === 0 ? (
                  <p className="mt-5 text-loza-500">Todavía no hay registros. Cuando registres comidas o agua, vas a ver tu mes acá.</p>
                ) : (
                  <>
                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full text-[15px] tabular">
                        <thead>
                          <tr className="text-left text-sm text-loza-500 border-b border-loza-300">
                            <th scope="col" className="py-2 pr-3 font-normal">Hábito</th>
                            <th scope="col" className="py-2 px-3 font-normal text-right whitespace-nowrap">Últimos 30 días</th>
                            <th scope="col" className="py-2 pl-3 font-normal text-right whitespace-nowrap">30 anteriores</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-loza-200">
                          {[
                            ['Días con registros', monthStats.now.cared, monthStats.prev.cared, 0],
                            ['Comidas registradas', monthStats.now.mealCount, monthStats.prev.mealCount, 0],
                            ['Vasos de agua por día', monthStats.now.waterAvg, monthStats.prev.waterAvg, 1],
                            ['Hambre antes de comer', monthStats.now.hunger, monthStats.prev.hunger, 1],
                            ['Saciedad después', monthStats.now.satiety, monthStats.prev.satiety, 1],
                            ...(sportOn ? [['Proteínas por día (g)', monthStats.now.proteinAvg, monthStats.prev.proteinAvg, 0]] : []),
                          ].map(([label, now, prev, d]) => (
                            <tr key={label}>
                              <th scope="row" className="py-3 pr-3 font-normal text-left text-loza-800">{label}</th>
                              <td className="py-3 px-3 text-right font-bold text-loza-900">{now == null ? '—' : Number(now).toLocaleString('es-AR', { maximumFractionDigits: d })}</td>
                              <td className="py-3 pl-3 text-right text-loza-600">{prev == null ? '—' : Number(prev).toLocaleString('es-AR', { maximumFractionDigits: d })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" onClick={handleMonthReport} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-loza-300 text-loza-800 text-sm font-bold hover:border-loza-500">
                      <FileDown className="w-4 h-4" aria-hidden="true" /> Descargar informe del mes
                    </button>
                  </>
                )}
              </section>
            )}

            {period === 'semana' && (<>
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
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold tabular ${d.cared ? 'bg-hoja-600 text-white' : 'bg-loza-100 text-loza-500'} ${d.date === today ? 'ring-2 ring-offset-2 ring-offset-loza-50 ring-hoja-300' : ''}`}>
                        {Number(d.date.slice(8))}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>

            {sportOn && (
              <WeightSection
                plan={plan}
                profile={profile}
                trend={trend}
                entries={weightLog}
                onAdd={() => { setToast(null); setWeightInput(trend ? String(trend.latest) : String(profile?.weightKg || '')); setWeightSheet(true); }}
              />
            )}

            <section aria-labelledby="titulo-agua-semana">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="titulo-agua-semana" className="font-display text-xl font-bold text-loza-900">Agua</h2>
                <p className="text-sm text-loza-500">vasos por día, de {waterTarget}</p>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1.5 items-end h-36" role="img" aria-label={`Vasos de agua por día: ${weekDays.map((d) => d.water).join(', ')}`}>
                {weekDays.map((d) => (
                  <div key={d.date} className="flex flex-col items-center justify-end gap-1 h-full">
                    <span className="text-xs text-loza-600 tabular">{d.water || ''}</span>
                    <span className="w-full max-w-8 rounded-t-lg bg-agua-500" style={{ height: `${Math.max(d.water ? 6 : 2, (Math.min(d.water, waterTarget) / waterTarget) * 100)}%`, opacity: d.water ? 1 : 0.25 }} />
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
            </>)}
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
                  <div key={section.id} className="bg-papel p-5 grid sm:grid-cols-[180px_1fr] gap-x-6 gap-y-1.5">
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

            <section aria-labelledby="titulo-ideas">
              <h2 id="titulo-ideas" className="font-display text-xl font-bold text-loza-900">Ideas para hoy</h2>
              <p className="text-sm text-loza-600 mt-1 max-w-prose">La IA te propone tres comidas según el momento del día y lo que comés. Se envían tus preferencias de alimentación a Claude, de Anthropic, sin tu nombre.</p>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Momento del día para las ideas">
                {MEAL_CATEGORIES.map((c) => (
                  <button key={c.id} type="button" aria-pressed={ideas.moment === c.id} onClick={() => setIdeas((prev) => ({ ...prev, moment: c.id, status: prev.status === 'done' ? 'idle' : prev.status, list: [] }))} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${ideas.moment === c.id ? 'bg-loza-900 text-loza-50' : 'bg-papel border border-loza-200 text-loza-700 hover:border-loza-400'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => askIdeas(ideas.moment)} disabled={ideas.status === 'loading'} className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white text-sm font-bold disabled:opacity-60">
                {ideas.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}
                {ideas.status === 'loading' ? 'Pensando ideas…' : ideas.status === 'done' ? 'Pedir otras ideas' : 'Pedir ideas'}
              </button>
              <div aria-live="polite">
                {ideas.status === 'error' && <p className="mt-3 text-sm text-remolacha-800">{ideas.error}</p>}
                {ideas.status === 'done' && (
                  <ul className="mt-4 grid gap-3">
                    {ideas.list.map((idea) => (
                      <li key={idea.name} className="rounded-2xl bg-papel border border-loza-200 p-4 flex flex-wrap items-start gap-x-4 gap-y-2">
                        <div className="flex-1 min-w-[12rem]">
                          <p className="font-bold text-loza-900">{idea.name}</p>
                          <p className="text-sm text-loza-600 mt-0.5">{idea.description}</p>
                          {showNumbers && <p className="text-sm text-loza-700 mt-1 tabular">{idea.energy} kcal · P {idea.protein} g · C {idea.carbs} g · G {idea.fat} g</p>}
                        </div>
                        <button type="button" onClick={() => addIdea(idea)} className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-hoja-200 text-hoja-700 text-sm font-bold hover:bg-hoja-50">
                          <Plus className="w-4 h-4" aria-hidden="true" /> Sumar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

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
                        ? 'bg-loza-900 text-loza-50'
                        : 'bg-papel text-loza-700 border border-loza-200 hover:border-loza-400'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <ul className="mt-5 border-t border-loza-200 lg:grid lg:grid-cols-2 lg:gap-x-14">
                {filteredRecipes.map((recipe) => (
                  <li key={recipe.id} className="py-5 border-b border-loza-200 grid sm:grid-cols-[1fr_auto] gap-3 sm:gap-6 sm:items-center">
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
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white text-sm font-bold transition-colors"
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
                      className="w-full h-full text-left rounded-[22px] bg-papel border border-loza-200 p-5 hover:border-hoja-300 transition-colors flex flex-col"
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
            onExportCsv={handleExportCsv}
            onSchedule={() => { setSettingsOpen(false); setScheduleOpen(true); }}
            theme={prefs.theme}
            onTheme={(theme) => setPrefs((prev) => ({ ...prev, theme }))}
            onImport={handleImport}
            onDeleteAll={handleDeleteAll}
            onLogout={handleLogout}
            onClose={() => setSettingsOpen(false)}
            onEditProfile={() => { setSettingsOpen(false); setOnboarding('editar'); }}
            numbersLocked={numbersLocked}
            sportOn={sportOn}
            hasData={Object.keys(logsByDate).length > 0 || !!profile?.completedAt}
          />
        </Sheet>
      )}

      {scheduleOpen && (
        <Sheet onClose={() => setScheduleOpen(false)} labelledBy="titulo-horarios">
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-horarios" className="font-display text-xl font-bold text-loza-900">Horarios y recordatorios</h2>
            <CloseButton onClick={() => setScheduleOpen(false)} />
          </div>
          <p className="mt-2 text-sm text-loza-600">Poné la hora en que solés comer. Dejá vacío lo que no uses.</p>
          <div className="mt-4 divide-y divide-loza-200 border-y border-loza-200">
            {MEAL_CATEGORIES.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                <label htmlFor={`hora-${c.id}`} className="font-bold text-[15px] text-loza-800">{c.label}</label>
                <input
                  id={`hora-${c.id}`}
                  type="time"
                  value={prefs.schedule[c.id] || ''}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, schedule: { ...prev.schedule, [c.id]: e.target.value } }))}
                  className="px-3 py-2 rounded-xl border border-loza-300 bg-papel text-[15px] tabular focus:outline-none focus:border-hoja-500"
                />
              </div>
            ))}
          </div>
          <button type="button" role="switch" aria-checked={prefs.reminders} onClick={() => setReminders(!prefs.reminders)} className="mt-4 w-full flex items-center justify-between gap-3 text-left">
            <span>
              <span className="block font-bold text-[15px] text-loza-800">Recordarme a esa hora</span>
              <span className="block text-sm text-loza-500">Te avisamos si todavía no registraste esa comida. Funciona mientras NetAI está abierta en el teléfono.</span>
            </span>
            <span aria-hidden="true" className={`relative w-10 h-6 rounded-full shrink-0 transition-colors ${prefs.reminders ? 'bg-hoja-600' : 'bg-loza-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${prefs.reminders ? 'translate-x-4' : ''}`} />
            </span>
          </button>
          <div className="mt-6 text-right">
            <button type="button" onClick={() => { setScheduleOpen(false); setToast({ text: 'Guardamos tus horarios.' }); }} className="px-6 py-3 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white text-sm font-bold">Listo</button>
          </div>
        </Sheet>
      )}

      {weightSheet && (
        <Sheet onClose={() => setWeightSheet(false)} labelledBy="titulo-peso">
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-peso" className="font-display text-xl font-bold text-loza-900">Registrar peso de hoy</h2>
            <CloseButton onClick={() => setWeightSheet(false)} />
          </div>
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const kg = Number(String(weightInput).replace(',', '.'));
              if (!(kg >= 30 && kg <= 300)) { setToast({ text: 'Escribí tu peso en kilos, entre 30 y 300.' }); return; }
              setWeightLog((prev) => [...prev.filter((x) => x.date !== today), { date: today, kg: Math.round(kg * 10) / 10 }]);
              setWeightSheet(false);
              setToast({ text: 'Peso registrado. Tu plan se actualizó.' });
            }}
          >
            <div>
              <label htmlFor="peso-hoy" className="block text-sm font-bold text-loza-800 mb-1.5">Peso (kg)</label>
              <input id="peso-hoy" type="number" inputMode="decimal" step="0.1" min="30" max="300" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} className="w-40 px-4 py-3 rounded-2xl border border-loza-300 bg-papel text-[15px] tabular focus:outline-none focus:border-hoja-500" />
              <p className="text-sm text-loza-500 mt-1.5">Pesate a la misma hora, idealmente en ayunas. El peso varía de un día a otro: lo que importa es el promedio semanal.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setWeightSheet(false)} className="px-5 py-3 rounded-full text-sm font-bold text-loza-700 hover:bg-loza-100">Cancelar</button>
              <button type="submit" className="px-6 py-3 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white text-sm font-bold">Guardar</button>
            </div>
          </form>
        </Sheet>
      )}

      {/* Aviso breve, con opción de deshacer */}
      <div aria-live="polite" className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 pointer-events-none">
        {toast && (
          <div className="pointer-events-auto flex items-center gap-4 max-w-md w-full sm:w-auto rounded-2xl bg-loza-900 text-loza-50 pl-4 pr-2 py-2.5 shadow-card animate-slide-up">
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

          <PhotoPanel
            photo={photo}
            showNumbers={showNumbers}
            onStart={startPhoto}
            onAccept={acceptPhotoConsent}
            onDecline={() => setPhoto({ status: 'idle' })}
          />
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; handlePhotoFile(f); }}
          />

          {!editingMealId && photo.status !== 'done' && prefs.favorites.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold text-loza-800">Tus favoritas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {prefs.favorites.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => applyPreset(f)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm transition-colors text-left ${newMealForm.name === f.name ? 'bg-hoja-600 text-white' : 'bg-papel border border-loza-200 text-loza-700 hover:border-loza-400'}`}
                  >
                    <Star className="w-3.5 h-3.5 shrink-0" fill="currentColor" aria-hidden="true" />
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!editingMealId && photo.status !== 'done' && frequentMeals.filter((f) => !isFavorite(f.name)).length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold text-loza-800">Tus frecuentes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {frequentMeals.filter((f) => !isFavorite(f.name)).map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => applyPreset(f)}
                    className={`px-3.5 py-2 rounded-full text-sm transition-colors text-left ${newMealForm.name === f.name ? 'bg-hoja-600 text-white' : 'bg-papel border border-loza-200 text-loza-700 hover:border-loza-400'}`}
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
                placeholder="Por ejemplo: guiso de lentejas"
                value={newMealForm.name}
                onChange={(e) => setNewMealForm({ ...newMealForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-loza-300 bg-papel text-[15px] placeholder:text-loza-500 focus:outline-none focus:border-hoja-500"
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
                  className="w-40 px-4 py-3 rounded-2xl border border-loza-300 bg-papel text-[15px] tabular focus:outline-none focus:border-hoja-500"
                />
                <p className="text-sm text-loza-500 mt-1.5">Una estimación alcanza. No hace falta pesar nada.</p>
              </div>
            )}

            {sportOn && (
              <div>
                <label htmlFor="meal-protein" className="block text-sm font-bold text-loza-800 mb-1.5">Proteínas (g)</label>
                <input
                  id="meal-protein"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="300"
                  value={newMealForm.protein}
                  onChange={(e) => setNewMealForm({ ...newMealForm, protein: e.target.value })}
                  className="w-40 px-4 py-3 rounded-2xl border border-loza-300 bg-papel text-[15px] tabular focus:outline-none focus:border-hoja-500"
                />
                <p className="text-sm text-loza-500 mt-1.5">Opcional. Por ejemplo: 100 g de pollo tienen unos 25 g de proteínas.</p>
                <div className="mt-3 grid grid-cols-2 gap-3 max-w-xs">
                  <div>
                    <label htmlFor="meal-carbs" className="block text-sm font-bold text-loza-800 mb-1.5">Carbohidratos (g)</label>
                    <input id="meal-carbs" type="number" inputMode="numeric" min="0" max="500" value={newMealForm.carbs} onChange={(e) => setNewMealForm({ ...newMealForm, carbs: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-loza-300 bg-papel text-[15px] tabular focus:outline-none focus:border-hoja-500" />
                  </div>
                  <div>
                    <label htmlFor="meal-fat" className="block text-sm font-bold text-loza-800 mb-1.5">Grasas (g)</label>
                    <input id="meal-fat" type="number" inputMode="numeric" min="0" max="300" value={newMealForm.fat} onChange={(e) => setNewMealForm({ ...newMealForm, fat: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-loza-300 bg-papel text-[15px] tabular focus:outline-none focus:border-hoja-500" />
                  </div>
                </div>
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
                className="w-full px-4 py-3 rounded-2xl border border-loza-300 bg-papel text-[15px] placeholder:text-loza-500 focus:outline-none focus:border-hoja-500"
              />
            </div>

            <div className="sticky bottom-0 -mx-5 sm:-mx-7 px-5 sm:px-7 py-3 bg-loza-50 border-t border-loza-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeMealSheet}
                className="px-5 py-3 rounded-full text-sm font-bold text-loza-700 hover:bg-loza-100"
              >
                Cancelar
              </button>
              <button type="submit" className="px-6 py-3 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white text-sm font-bold">
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
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${recipeMoment === c.id ? 'bg-loza-900 text-loza-50' : 'bg-papel border border-loza-200 text-loza-700 hover:border-loza-400'}`}
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
              className="px-6 py-3 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white text-sm font-bold"
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
              className="px-6 py-3 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white text-sm font-bold"
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
function EnergyRange({ total, range, floor = MINIMUM_SAFE_ENERGY_FLOOR }) {
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
        <div className="absolute -top-1 -bottom-1 w-0.5 bg-loza-700 rounded" style={{ left: pct(floor) }} aria-hidden="true" />
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-loza-600 tabular">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="w-0.5 h-3.5 rounded bg-loza-700" />
          Piso seguro: {floor.toLocaleString('es-AR')} kcal
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="w-3.5 h-2.5 rounded-sm bg-hoja-100 border border-hoja-300" />
          {range.label || (range.personal ? 'Tu rango' : 'Rango general')}: {range.min.toLocaleString('es-AR')} a {range.max.toLocaleString('es-AR')} kcal
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
      <path d="M5 4 H27 L24 36 H8 Z" fill={filled ? 'rgb(var(--agua-100))' : 'rgb(var(--papel))'} stroke={filled ? '#3478A8' : 'rgb(var(--loza-300))'} strokeWidth="2" strokeLinejoin="round" />
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
              className={`h-11 rounded-xl text-sm font-bold tabular transition-colors ${
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

// Cuántas hojas hay abiertas: sirve para que el botón Atrás del teléfono cierre la hoja en lugar de salir de la app
let openSheets = 0;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Sheet({ children, onClose, labelledBy }) {
  const panel = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const el = panel.current;
    const opener = document.activeElement;
    el.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape') { close.current(); return; }
      if (e.key !== 'Tab') return;
      // El foco del teclado no sale de la hoja mientras está abierta
      const items = [...el.querySelectorAll(FOCUSABLE)].filter((n) => n.getClientRects().length > 0);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!el.contains(active) || active === el) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);

    let closedByBack = false;
    openSheets += 1;
    if (!window.history.state?.netaiSheet) window.history.pushState({ ...(window.history.state || {}), netaiSheet: true }, '');
    const onPop = () => { closedByBack = true; close.current(); };
    window.addEventListener('popstate', onPop);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
      document.body.style.overflow = prev;
      openSheets -= 1;
      // Si se cerró con un botón (y no se abrió otra hoja enseguida), se quita la entrada que se sumó al historial
      queueMicrotask(() => { if (!closedByBack && openSheets === 0 && window.history.state?.netaiSheet) window.history.back(); });
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto bg-loza-50 rounded-t-[28px] sm:rounded-[28px] shadow-sheet px-5 pt-5 pb-8 sm:p-7 animate-slide-up safe-bottom focus:outline-none"
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
function SettingsPanel({ intuitiveMode, onToggleIntuitive, onExport, onExportCsv, onSchedule, theme, onTheme, onImport, onDeleteAll, onLogout, onClose, onEditProfile, numbersLocked, sportOn, hasData }) {
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

        {numbersLocked || sportOn ? (
          <p className="py-3.5 text-sm text-loza-600">
            {sportOn
              ? 'Estás en el Modo Sport, que muestra energía, proteínas y peso. Para volver al modo Bienestar o al Modo Intuitivo, cambialo desde “Tus datos”.'
              : 'El Modo Intuitivo está siempre activo según lo que respondiste en tus datos. Lo podés cambiar desde “Tus datos”.'}
          </p>
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

        <div className="py-3.5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold text-[15px] text-loza-800" id="tema-label">Apariencia</p>
          <div className="inline-flex p-1 rounded-full bg-loza-100" role="radiogroup" aria-labelledby="tema-label">
            {[['auto', 'Automática'], ['claro', 'Clara'], ['oscuro', 'Oscura']].map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={theme === id} onClick={() => onTheme(id)} className={`px-3.5 py-1.5 rounded-full text-sm font-bold transition-colors ${theme === id ? 'bg-hoja-600 text-white' : 'text-loza-600 hover:text-loza-900'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={onSchedule} className={row}>
          <Bell className="w-5 h-5 text-loza-500 shrink-0" aria-hidden="true" />
          <span>
            <span className="block font-bold">Horarios y recordatorios</span>
            <span className="block text-sm text-loza-500">A qué hora comés y si querés que te avisemos.</span>
          </span>
        </button>

        <div className="py-3.5">
          <p className="font-bold text-[15px] text-loza-800">Copia de seguridad</p>
          <p className="text-sm text-loza-500 mt-0.5">Tus registros y tus datos están solo en este teléfono. Descargá una copia para no perderlos o para pasarlos a otro dispositivo.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onExport} disabled={!hasData} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-loza-900 text-loza-50 text-sm font-bold disabled:opacity-40">
              <Download className="w-4 h-4" aria-hidden="true" /> Descargar copia
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-loza-300 text-loza-800 text-sm font-bold hover:border-loza-500">
              <Upload className="w-4 h-4" aria-hidden="true" /> Restaurar copia
            </button>
            <button type="button" onClick={onExportCsv} disabled={!hasData} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-loza-300 text-loza-800 text-sm font-bold hover:border-loza-500 disabled:opacity-40">
              <FileDown className="w-4 h-4" aria-hidden="true" /> Historial en planilla
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
                <button type="button" onClick={onDeleteAll} className="px-4 py-2.5 rounded-full bg-remolacha-600 text-white text-sm font-bold">Sí, borrar todo</button>
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
              <button type="button" onClick={onLogout} className="px-4 py-2.5 rounded-full bg-loza-900 text-loza-50 text-sm font-bold">Cerrar sesión</button>
              <button type="button" onClick={() => setConfirm(null)} className="px-4 py-2.5 rounded-full text-sm font-bold text-loza-700 hover:bg-loza-100">Cancelar</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirm('logout')} className="inline-flex items-center gap-2 text-[15px] font-bold text-loza-800">
              <LogOut className="w-4 h-4" aria-hidden="true" /> Cerrar sesión
            </button>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs text-loza-500">NetAI, versión {APP_VERSION}</p>
    </div>
  );
}

// Modo Sport: objetivo y macronutrientes del día contra el plan
function SportMacros({ plan, today, goalLabel }) {
  const rows = [
    { key: 'protein', label: 'Proteínas', range: plan.proteinG, bar: 'bg-remolacha-600', band: 'bg-remolacha-100' },
    { key: 'carbs', label: 'Carbohidratos', range: plan.carbsG, bar: 'bg-trigo-500', band: 'bg-trigo-100' },
    { key: 'fat', label: 'Grasas', range: plan.fatG, bar: 'bg-agua-500', band: 'bg-agua-100' },
  ];
  return (
    <div className="mt-6 pt-5 border-t border-loza-200">
      <p className="flex items-center gap-2 text-sm font-bold text-hoja-800">
        <Dumbbell className="w-4 h-4" aria-hidden="true" /> Objetivo: {goalLabel}
      </p>
      <div className="mt-4 space-y-4">
        {rows.map((r) => {
          const val = today[r.key];
          return (
            <div key={r.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-bold text-loza-800">{r.label}</span>
                <span className="text-loza-600 tabular"><span className="font-bold text-loza-900">{val} g</span> de {r.range[0]} a {r.range[1]} g</span>
              </div>
              <div className="mt-2 relative h-2.5 rounded-full bg-loza-100" aria-hidden="true">
                <div className={`absolute inset-y-0 rounded-full ${r.band}`} style={{ left: `${(r.range[0] / r.range[1]) * 100}%`, right: 0 }} />
                <div className={`absolute inset-y-0 left-0 rounded-full ${r.bar} transition-[width] duration-500`} style={{ width: `${Math.min(100, (val / r.range[1]) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-loza-500">Valores orientativos según guías de nutrición deportiva (ACSM e ISSN). Se suman los gramos que registres en cada comida o que estime la foto.</p>
    </div>
  );
}

// Foto del plato: permiso, análisis y resultado para revisar
function PhotoPanel({ photo, showNumbers, onStart, onAccept, onDecline }) {
  if (photo.status === 'consent') {
    return (
      <div className="mt-4 rounded-2xl bg-agua-50 p-4 text-agua-900">
        <p className="font-bold">Antes de tu primera foto</p>
        <p className="text-sm mt-1 leading-relaxed">
          Para reconocer el plato, la foto se envía a Claude, un servicio de inteligencia artificial de Anthropic. No la guardamos y solo se usa para este análisis. El resultado es una estimación que podés corregir.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={onAccept} className="px-4 py-2.5 rounded-full bg-agua-600 text-white text-sm font-bold">Aceptar y sacar foto</button>
          <button type="button" onClick={onDecline} className="px-4 py-2.5 rounded-full text-sm font-bold text-agua-900 hover:bg-agua-100">Ahora no</button>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-4">
      {photo.status === 'idle' && (
        <button type="button" onClick={onStart} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-hoja-300 text-hoja-800 font-bold hover:bg-hoja-50">
          <Camera className="w-5 h-5" aria-hidden="true" /> Sacar foto del plato
        </button>
      )}
      {photo.status !== 'idle' && (
        <div className="flex gap-3 items-start">
          {photo.preview && <img src={photo.preview} alt="Foto del plato" className="w-20 h-20 rounded-2xl object-cover shrink-0" />}
          <div className="min-w-0 flex-1" aria-live="polite">
            {photo.status === 'loading' && (
              <p className="flex items-center gap-2 text-loza-700"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Analizando el plato…</p>
            )}
            {photo.status === 'error' && (
              <>
                <p className="text-remolacha-800 text-sm">{photo.error}</p>
                <button type="button" onClick={onStart} className="mt-2 text-sm font-bold text-hoja-700 underline underline-offset-4">Probar con otra foto</button>
              </>
            )}
            {photo.status === 'done' && photo.result && (
              <>
                <p className="font-bold text-loza-900 leading-snug">{photo.result.name}</p>
                <p className="text-sm text-loza-600">{photo.result.portion}</p>
                {showNumbers ? (
                  <p className="text-sm text-loza-800 mt-1 tabular">
                    {photo.result.energy} kcal · P {photo.result.protein} g · C {photo.result.carbs} g · G {photo.result.fat} g
                  </p>
                ) : (
                  <p className="text-sm text-loza-800 mt-1">
                    Vegetales {photo.result.plate.vegetables} % · Proteínas {photo.result.plate.protein} % · Cereales {photo.result.plate.carbs} %
                  </p>
                )}
                <p className="text-xs text-loza-500 mt-1">
                  Estimación {photo.result.confidence === 'alta' ? 'bastante segura' : photo.result.confidence === 'baja' ? 'poco segura' : 'aproximada'}. Revisá y corregí antes de guardar.
                  {photo.result.note ? ` ${photo.result.note}` : ''}
                </p>
                <button type="button" onClick={onStart} className="mt-1.5 text-sm font-bold text-hoja-700 underline underline-offset-4">Sacar otra foto</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Modo Sport: seguimiento de peso con promedio semanal y avisos de ritmo
function WeightSection({ plan, profile, trend, entries, onAdd }) {
  const fmt1 = (n) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 1 });
  const target = Number(profile?.targetWeightKg) || null;
  const base = trend?.weekAvg ?? Number(profile?.weightKg);
  let pace = null; // mensaje sobre el ritmo
  if (trend?.weeklyChange != null && plan.rateKg) {
    const ch = trend.weeklyChange;
    const [lo, hi] = plan.rateKg; // kg por semana
    if (plan.goal === 'perder-grasa') {
      if (ch < lo) pace = { tone: 'alerta', text: 'Estás bajando más rápido de lo recomendable (más de 1 % de tu peso por semana). Comé un poco más: protege tu músculo, tu energía y tu rendimiento.' };
      else if (ch <= hi) pace = { tone: 'bien', text: 'Vas a un ritmo seguro.' };
      else pace = { tone: 'neutro', text: 'Esta semana el peso casi no cambió. Es normal: mirá la tendencia de 2 o 3 semanas antes de ajustar.' };
    } else if (plan.goal === 'ganar-musculo') {
      if (ch > hi) pace = { tone: 'alerta', text: 'Estás subiendo más rápido de lo recomendable. Bajá un poco la energía para ganar músculo con menos grasa.' };
      else if (ch >= lo) pace = { tone: 'bien', text: 'Vas a un ritmo seguro para ganar músculo.' };
      else pace = { tone: 'neutro', text: 'Esta semana el peso casi no cambió. Si sigue igual 2 o 3 semanas, sumá un poco de energía.' };
    }
  }
  const remaining = target && base ? target - base : null;
  const weeks = target && base ? weeksToTarget({ ...profile, weightKg: base }) : null;
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return (
    <section aria-labelledby="titulo-peso-semana">
      <div className="flex items-center justify-between gap-4">
        <h2 id="titulo-peso-semana" className="font-display text-xl font-bold text-loza-900">Tu peso</h2>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 pl-3 pr-4 py-2 rounded-full text-sm font-bold text-hoja-700 border border-hoja-200 hover:bg-hoja-50">
          <Scale className="w-4 h-4" aria-hidden="true" /> Registrar peso
        </button>
      </div>
      {!trend ? (
        <p className="mt-2 text-loza-600">Registrá tu peso una o dos veces por semana para ver tu tendencia.</p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-3 tabular">
            <div className="rounded-2xl bg-papel border border-loza-200 p-3"><dt className="text-xs text-loza-500">Último</dt><dd className="font-display text-xl font-bold text-loza-900">{fmt1(trend.latest)} kg</dd></div>
            <div className="rounded-2xl bg-papel border border-loza-200 p-3"><dt className="text-xs text-loza-500">Promedio 7 días</dt><dd className="font-display text-xl font-bold text-loza-900">{fmt1(trend.weekAvg)} kg</dd></div>
            <div className="rounded-2xl bg-papel border border-loza-200 p-3"><dt className="text-xs text-loza-500">Cambio semanal</dt><dd className="font-display text-xl font-bold text-loza-900">{trend.weeklyChange == null ? '—' : `${trend.weeklyChange > 0 ? '+' : ''}${fmt1(trend.weeklyChange)} kg`}</dd></div>
          </dl>
          {pace && (
            <p className={`mt-3 rounded-2xl p-4 text-[15px] ${pace.tone === 'alerta' ? 'bg-remolacha-50 text-remolacha-900' : pace.tone === 'bien' ? 'bg-hoja-50 text-hoja-900' : 'bg-loza-100 text-loza-800'}`}>{pace.text}</p>
          )}
          {remaining != null && Math.abs(remaining) >= 0.5 && (
            <p className="mt-3 text-[15px] text-loza-700">
              Te faltan <strong className="tabular">{fmt1(Math.abs(remaining))} kg</strong> para tu objetivo de {fmt1(target)} kg
              {weeks ? <>, unas <strong className="tabular">{weeks}</strong> semanas a ritmo seguro.</> : '.'}
            </p>
          )}
          <ul className="mt-4 divide-y divide-loza-200 border-y border-loza-200 text-sm tabular">
            {recent.map((e) => (
              <li key={e.date} className="py-2 flex justify-between"><span className="text-loza-600">{formatWeekday(e.date)}, {formatDayMonth(e.date)}</span><span className="font-bold text-loza-900">{fmt1(e.kg)} kg</span></li>
            ))}
          </ul>
        </>
      )}
      {plan.goal === 'perder-grasa' && (
        <p className="mt-4 text-sm text-loza-500 leading-relaxed">
          Si notás cansancio que no se va, lesiones seguidas, mucho frío, problemas para dormir o cambios en tu ciclo menstrual, puede ser falta de energía: comé más y consultá con un profesional.
        </p>
      )}
    </section>
  );
}

