'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Info, Pause, Play, Check, Plus, Trash2, ChevronRight, Clock, House, ListChecks, Dumbbell, TrendingUp, Target, Utensils, Flame, HeartPulse, Footprints, Activity, BicepsFlexed, PersonStanding, Scale } from 'lucide-react';
import { Sheet, CloseButton } from '@/components/ui/Sheet';
import { EXERCISES, EXERCISE_PLACES, EXERCISE_ZONES, exerciseFrames } from '@/lib/exercises';
import {
  ROUTINES, FEELINGS, FIT_GOALS, FIT_LEVELS, WORKOUTS_KEY, WORKOUT_DRAFT_KEY, FIT_PROFILE_KEY,
  emptyFitProfile, sanitizeFitProfile, fitDefaultsFromNetAI, recommendedRoutines, nextRoutine, weekDays, exerciseProgress,
  exerciseBySlug, usesWeight, targetText, startWorkout, finishWorkout, lastSets, lastSetsText, sanitizeWorkouts,
} from '@/lib/workouts';
import { PROFILE_KEY, WEIGHT_LOG_KEY, hidesNumbers } from '@/lib/profile';
import { parseJson, sanitizeWeights, isObject } from '@/lib/storage';

// Figura del ejercicio. Animada, alterna las tres poses; quieta, muestra la del medio.
// Los dibujos se cargan recién cuando la figura está cerca de la pantalla.
export function ExerciseFigure({ slug, animated = false, className = '' }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return undefined; }
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const frames = exerciseFrames(slug);
  const poses = animated ? [1, 2, 3] : [2];
  return (
    <div ref={ref} aria-hidden="true" className={`relative text-agua-800 ${animated ? 'figura-animada' : ''} ${className}`}>
      {near && poses.map((n) => (
        <span key={n} data-pose={n} className="figura-pose" style={{ '--pose': `url(${frames[n - 1]})` }} />
      ))}
    </div>
  );
}


// Marca de NetAI Fit: el mismo recuadro gris de NetAI, con una línea de pulso en azul
export function FitMark({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#B5B8BA" />
      <path d="M10 34h11l5-14 9 26 6-17 3 5h10" fill="none" stroke="#19344C" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const GOAL_ICONS = { fuerza: Dumbbell, musculo: BicepsFlexed, bajar: Flame, resistencia: HeartPulse, movilidad: PersonStanding, moverme: Footprints };
const primary = 'bg-agua-600 hover:bg-agua-500 text-white';
const pill = (on) => `shrink-0 px-4 min-h-[44px] rounded-full text-sm font-bold transition-colors ${on ? 'bg-loza-900 text-loza-50' : 'bg-papel border border-loza-300 text-loza-700 hover:border-loza-500'}`;
const segment = (on) => `px-5 min-h-[44px] rounded-full text-sm font-bold transition-colors ${on ? 'bg-agua-600 text-white' : 'text-loza-700 hover:text-loza-900'}`;
const numberCls = 'w-full h-11 px-2 rounded-xl border border-loza-300 bg-papel text-center text-[16px] font-bold text-loza-900 tabular focus:outline-none focus:border-agua-500';
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const longDate = (date) => { const t = new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }); return t.charAt(0).toUpperCase() + t.slice(1); };
const fmt = (n) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 1 });
const unitText = (n, unit) => `${fmt(n)} ${unit === 'kg' ? 'kg' : unit === 's' ? 's' : 'rep.'}`;

export default function FitApp() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('hoy'); // 'hoy' | 'rutinas' | 'ejercicios' | 'progreso'
  const [today, setToday] = useState(localDate);
  const [fit, setFit] = useState(null); // objetivos de Fit
  const [setup, setSetup] = useState(null); // borrador del formulario de objetivos, o null
  const [netai, setNetai] = useState(null); // perfil de NetAI, solo lectura
  const [workouts, setWorkouts] = useState([]);
  const [weights, setWeights] = useState([]); // peso corporal, compartido con NetAI
  const [place, setPlace] = useState('casa');
  const [zone, setZone] = useState('Todas');
  const [open, setOpen] = useState(null);
  const [playing, setPlaying] = useState(true);
  const [routine, setRoutine] = useState(null);
  const [draft, setDraft] = useState(null);
  const [training, setTraining] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [feeling, setFeeling] = useState('bien');
  const [progressOf, setProgressOf] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [toast, setToast] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Cargar del teléfono. NetAI Fit comparte el teléfono con NetAI: lee su perfil y usa el mismo registro de peso.
  useEffect(() => {
    try {
      const profile = parseJson(localStorage.getItem(PROFILE_KEY));
      if (isObject(profile)) setNetai(profile);
      const savedFit = sanitizeFitProfile(parseJson(localStorage.getItem(FIT_PROFILE_KEY)));
      if (savedFit?.completedAt) { setFit(savedFit); setPlace(savedFit.place); }
      else setSetup({ ...emptyFitProfile(), ...fitDefaultsFromNetAI(profile) });
      setWorkouts(sanitizeWorkouts(parseJson(localStorage.getItem(WORKOUTS_KEY))));
      setWeights(sanitizeWeights(parseJson(localStorage.getItem(WEIGHT_LOG_KEY))));
      const saved = parseJson(localStorage.getItem(WORKOUT_DRAFT_KEY));
      if (isObject(saved) && Array.isArray(saved.exercises) && saved.routineName) setDraft(saved);
      const prefs = parseJson(localStorage.getItem('netai_prefs_v1'));
      const dark = prefs?.theme === 'oscuro' || (prefs?.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('oscuro', Boolean(dark) && Boolean(savedFit?.completedAt));
    } catch (e) { console.warn('Error leyendo los datos', e); }
    setLoaded(true);
    return () => document.documentElement.classList.remove('oscuro');
  }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts)); } catch (e) { /* sin almacenamiento */ } }, [workouts, loaded]);
  useEffect(() => { if (loaded) try { localStorage.setItem(WEIGHT_LOG_KEY, JSON.stringify(weights)); } catch (e) { /* sin almacenamiento */ } }, [weights, loaded]);
  useEffect(() => { if (loaded) try { if (draft) localStorage.setItem(WORKOUT_DRAFT_KEY, JSON.stringify(draft)); else localStorage.removeItem(WORKOUT_DRAFT_KEY); } catch (e) { /* sin almacenamiento */ } }, [draft, loaded]);
  useEffect(() => { const id = setInterval(() => setToday(localDate()), 60000); return () => clearInterval(id); }, []);
  useEffect(() => { if (!toast) return undefined; const id = setTimeout(() => setToast(''), 5000); return () => clearTimeout(id); }, [toast]);

  const noNumbers = hidesNumbers(netai || {}); // tratamiento por un trastorno alimentario indicado en NetAI
  const goals = noNumbers ? FIT_GOALS.filter((g) => g.id !== 'bajar') : FIT_GOALS;
  const name = String(netai?.name || '').trim();
  const list = useMemo(() => EXERCISES.filter((e) => (place === 'gimnasio' || e.place === 'casa') && (zone === 'Todas' || e.zone === zone)), [place, zone]);
  const zones = useMemo(() => ['Todas', ...EXERCISE_ZONES.filter((z) => EXERCISES.some((e) => e.zone === z && (place === 'gimnasio' || e.place === 'casa')))], [place]);
  const recommended = useMemo(() => recommendedRoutines(fit), [fit]);
  const upNext = useMemo(() => nextRoutine(fit, workouts), [fit, workouts]);
  const week = useMemo(() => weekDays(workouts, today), [workouts, today]);
  const weekDone = week.filter((d) => d.trained).length;
  const weekGoal = Number(fit?.days) || 3;
  const recent = useMemo(() => [...workouts].sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)).slice(0, 8), [workouts]);
  const progress = useMemo(() => exerciseProgress(workouts), [workouts]);
  const sortedWeights = useMemo(() => [...weights].sort((a, b) => (a.date < b.date ? 1 : -1)), [weights]);
  const trainedToday = workouts.some((w) => w.date === today);
  const goalLabel = FIT_GOALS.find((g) => g.id === fit?.goal)?.label;
  const openExercise = (e) => { setPlaying(true); setOpen(e); };

  const saveSetup = () => {
    if (!setup.goal) return;
    const data = { ...setup, completedAt: fit?.completedAt || new Date().toISOString() };
    try { localStorage.setItem(FIT_PROFILE_KEY, JSON.stringify(data)); } catch (e) { /* sin almacenamiento */ }
    setFit(data); setPlace(data.place); setSetup(null); setTab('hoy');
  };
  const begin = (r) => { setDraft(startWorkout(r, workouts)); setRoutine(null); setTraining(true); };
  const updateSet = (ei, si, patch) => setDraft((d) => ({ ...d, exercises: d.exercises.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((st, j) => (j !== si ? st : { ...st, ...patch })) })) }));
  const addSet = (ei) => setDraft((d) => ({ ...d, exercises: d.exercises.map((e, i) => (i !== ei ? e : { ...e, sets: [...e.sets, { ...e.sets[e.sets.length - 1], done: false }] })) }));
  const doneSets = draft ? draft.exercises.reduce((n, e) => n + e.sets.filter((st) => st.done).length, 0) : 0;
  const totalSets = draft ? draft.exercises.reduce((n, e) => n + e.sets.length, 0) : 0;
  const save = () => {
    const workout = finishWorkout(draft, feeling);
    if (!workout) return;
    setWorkouts((prev) => [...prev, workout]);
    setDraft(null); setTraining(false); setFinishing(false); setFeeling('bien'); setTab('hoy');
    setToast('Guardaste el entrenamiento.');
  };
  const addWeight = () => {
    const kg = Number(String(weightInput).replace(',', '.'));
    if (!(kg >= 30 && kg <= 300)) { setToast('Escribí tu peso en kilos, entre 30 y 300.'); return; }
    setWeights((prev) => [...prev.filter((w) => w.date !== today), { date: today, kg: Math.round(kg * 10) / 10 }]);
    setWeightInput(''); setToast('Peso registrado.');
  };
  const deleteAll = () => {
    setWorkouts([]); setDraft(null); setFit(null); setConfirmDelete(false);
    try { localStorage.removeItem(FIT_PROFILE_KEY); } catch (e) { /* sin almacenamiento */ }
    setSetup({ ...emptyFitProfile(), ...fitDefaultsFromNetAI(netai) });
    setToast('Borraste tus datos de NetAI Fit.');
  };

  if (!loaded) return <div className="min-h-screen bg-loza-50" />;

  // ------------------------------------------------------------------
  // Objetivos: una sola pantalla, todo tocando
  // ------------------------------------------------------------------
  if (setup) {
    const fromNetai = Object.keys(fitDefaultsFromNetAI(netai)).length > 0;
    return (
      <div className="min-h-screen bg-loza-50">
        <main className="max-w-xl mx-auto px-5 sm:px-8 pt-5 pb-10 safe-top safe-bottom">
          <header className="flex items-center justify-between min-h-11">
            <span className="flex items-center gap-2.5"><FitMark className="w-9 h-9" /><span className="font-marca font-bold text-xl text-loza-900">NetAI Fit</span></span>
            {fit && <button type="button" onClick={() => setSetup(null)} className="px-3 min-h-[44px] rounded-full text-sm font-bold text-loza-700 hover:bg-loza-100">Cancelar</button>}
          </header>
          <h1 className="mt-8 font-display text-4xl font-bold text-loza-900 leading-tight">{name ? `${name}, ¿qué buscás?` : '¿Qué buscás?'}</h1>
          {fromNetai && <p className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-agua-100 text-agua-900 text-sm font-bold"><Utensils className="w-4 h-4" aria-hidden="true" />Tomamos tu objetivo de NetAI</p>}

          <div className="mt-5 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Objetivo">
            {goals.map((g) => {
              const on = setup.goal === g.id; const Icon = GOAL_ICONS[g.id];
              return (
                <button key={g.id} type="button" role="radio" aria-checked={on} onClick={() => setSetup({ ...setup, goal: g.id })}
                  className={`text-left rounded-[20px] p-3.5 border transition-colors ${on ? 'border-agua-600 bg-agua-50 ring-1 ring-agua-600' : 'border-loza-300 bg-papel hover:border-loza-500'}`}>
                  <span className={`grid place-items-center w-11 h-11 rounded-full ${on ? 'bg-agua-600 text-white' : 'bg-loza-100 text-loza-700'}`}><Icon className="w-5 h-5" aria-hidden="true" /></span>
                  <span className="mt-2 block font-bold text-[16px] text-loza-900 leading-tight">{g.label}</span>
                  <span className="block text-sm text-loza-600">{g.hint}</span>
                </button>
              );
            })}
          </div>

          <fieldset className="mt-7">
            <legend className="text-[15px] font-bold text-loza-800">¿Dónde entrenás?</legend>
            <div className="mt-2 inline-flex p-1 rounded-full bg-loza-100" role="radiogroup" aria-label="Dónde entrenás">
              {EXERCISE_PLACES.map((pl) => <button key={pl.id} type="button" role="radio" aria-checked={setup.place === pl.id} onClick={() => setSetup({ ...setup, place: pl.id })} className={segment(setup.place === pl.id)}>{pl.label}</button>)}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-[15px] font-bold text-loza-800">¿Cuántos días por semana?</legend>
            <div className="mt-2 grid grid-cols-7 gap-1.5" role="radiogroup" aria-label="Días por semana">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                const on = String(setup.days) === String(d);
                return <button key={d} type="button" role="radio" aria-checked={on} aria-label={`${d} ${d === 1 ? 'día' : 'días'}`} onClick={() => setSetup({ ...setup, days: String(d) })} className={`h-11 rounded-full text-[15px] font-bold tabular transition-colors ${on ? 'bg-agua-600 text-white' : 'bg-papel border border-loza-300 text-loza-700 hover:border-loza-500'}`}>{d}</button>;
              })}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-[15px] font-bold text-loza-800">¿Cómo venís?</legend>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Nivel">
              {FIT_LEVELS.map((l) => <button key={l.id} type="button" role="radio" aria-checked={setup.level === l.id} onClick={() => setSetup({ ...setup, level: l.id })} className={pill(setup.level === l.id)}>{l.label}</button>)}
            </div>
          </fieldset>

          <button type="button" onClick={saveSetup} disabled={!setup.goal} className={`mt-8 w-full min-h-[52px] rounded-full text-[16px] font-bold ${primary} disabled:opacity-40 disabled:pointer-events-none`}>
            {fit ? 'Guardar cambios' : 'Armar mi plan'}
          </button>
          {!setup.goal && <p className="mt-2 text-center text-sm text-loza-600">Elegí un objetivo para seguir.</p>}
        </main>
      </div>
    );
  }

  const exerciseSheet = open && (
    <Sheet onClose={() => setOpen(null)} labelledBy="titulo-ejercicio">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-loza-600">{open.zone} · {open.equipment}</p>
          <h2 id="titulo-ejercicio" className="font-display text-2xl font-bold text-loza-900 leading-tight">{open.name}</h2>
        </div>
        <CloseButton onClick={() => setOpen(null)} />
      </div>
      <div className="mt-4 rounded-[24px] bg-papel border border-loza-200">
        <ExerciseFigure key={`${open.slug}-${playing}`} slug={open.slug} animated={playing} className="w-full max-w-[300px] mx-auto aspect-square" />
      </div>
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={() => setPlaying(!playing)} aria-pressed={!playing} className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-full text-sm font-bold text-loza-700 hover:bg-loza-100">
          {playing ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
          {playing ? 'Pausar' : 'Ver movimiento'}
        </button>
      </div>
      <p className="mt-4 text-sm text-loza-600">Trabaja: <span className="font-bold text-loza-800">{open.muscles.join(', ')}</span> · {open.kind === 'tiempo' ? 'Por tiempo' : 'Por repeticiones'}</p>
      <h3 className="mt-5 font-bold text-loza-900">Cómo se hace</h3>
      <ol className="mt-2 space-y-2 text-[15px] text-loza-700 list-decimal pl-5">{open.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="mt-4 rounded-2xl bg-agua-50 text-agua-900 p-4 text-[15px] leading-relaxed">{open.care}</p>
    </Sheet>
  );

  // ------------------------------------------------------------------
  // Entrenamiento en curso: pantalla completa
  // ------------------------------------------------------------------
  if (training && draft) {
    return (
      <div className="min-h-screen bg-loza-50">
        <main className="max-w-xl mx-auto px-4 sm:px-6 pb-28 safe-top">
          <header className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-loza-50 border-b border-loza-200 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setTraining(false)} className="px-3 min-h-[44px] rounded-full text-sm font-bold text-loza-700 hover:bg-loza-100">Salir</button>
            <div className="text-center min-w-0">
              <h1 className="font-display text-lg font-bold text-loza-900 leading-tight truncate">{draft.routineName}</h1>
              <p className="text-sm text-loza-600 tabular" aria-live="polite">{doneSets} de {totalSets} series</p>
            </div>
            <span className="w-14" aria-hidden="true" />
          </header>
          <div className="h-1 -mx-4 bg-loza-200" aria-hidden="true"><div className="h-1 bg-agua-600 transition-all" style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} /></div>

          <ol className="mt-5 space-y-4">
            {draft.exercises.map((ex, ei) => {
              const info = exerciseBySlug(ex.slug);
              if (!info) return null;
              const timed = ex.sets[0]?.secs !== '' && ex.sets[0]?.secs != null;
              const weight = usesWeight(ex.slug);
              const last = lastSetsText(lastSets(workouts, ex.slug));
              const cols = weight ? 'grid-cols-[2rem_1fr_1fr_2.75rem]' : 'grid-cols-[2rem_1fr_2.75rem]';
              return (
                <li key={ex.slug} className="rounded-[24px] bg-papel border border-loza-200 p-4">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => openExercise(info)} aria-label={`Ver cómo se hace: ${info.name}`} className="shrink-0 rounded-2xl bg-loza-50 border border-loza-200 hover:border-agua-400">
                      <ExerciseFigure slug={ex.slug} animated className="w-20 h-20" />
                    </button>
                    <div className="min-w-0">
                      <h2 className="font-bold text-[16px] text-loza-900 leading-snug">{info.name}</h2>
                      <p className="text-sm text-loza-600">{info.equipment}</p>
                      {last && <p className="text-sm text-loza-600">La última vez: <span className="font-bold text-loza-800 tabular">{last}</span></p>}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className={`grid ${cols} gap-2 text-sm text-loza-600`} aria-hidden="true">
                      <span>Serie</span><span className="text-center">{timed ? 'Segundos' : 'Repeticiones'}</span>{weight && <span className="text-center">Kilos</span>}<span />
                    </div>
                    {ex.sets.map((st, si) => (
                      <div key={si} className={`grid ${cols} gap-2 items-center`}>
                        <span className="font-bold text-loza-800 tabular text-center">{si + 1}</span>
                        <input type="number" inputMode="numeric" min="1" aria-label={`${info.name}, serie ${si + 1}: ${timed ? 'segundos' : 'repeticiones'}`} value={timed ? st.secs : st.reps}
                          onChange={(e) => updateSet(ei, si, timed ? { secs: e.target.value } : { reps: e.target.value })} className={numberCls} />
                        {weight && (
                          <input type="number" inputMode="decimal" min="0" step="0.5" placeholder="—" aria-label={`${info.name}, serie ${si + 1}: kilos`} value={st.kg}
                            onChange={(e) => updateSet(ei, si, { kg: e.target.value })} className={`${numberCls} placeholder:text-loza-500`} />
                        )}
                        <button type="button" aria-pressed={st.done} aria-label={`${info.name}, serie ${si + 1}: ${st.done ? 'hecha' : 'marcar como hecha'}`} onClick={() => updateSet(ei, si, { done: !st.done })}
                          className={`grid place-items-center w-11 h-11 rounded-full border transition-colors ${st.done ? 'bg-agua-600 border-agua-600 text-white' : 'bg-papel border-loza-300 text-loza-500 hover:border-agua-500'}`}>
                          <Check className="w-5 h-5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addSet(ei)} className="mt-2 inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-full text-sm font-bold text-agua-700 hover:bg-agua-50">
                    <Plus className="w-4 h-4" aria-hidden="true" /> Otra serie
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-sm text-loza-600">Descansá entre 1 y 2 minutos entre series. Si algo duele, pará.</p>
        </main>

        <div className="fixed bottom-0 inset-x-0 z-10 glass-surface border-x-0 border-b-0 safe-bottom">
          <div className="max-w-xl mx-auto px-4 py-3">
            <button type="button" onClick={() => setFinishing(true)} className={`w-full min-h-[48px] rounded-full text-[15px] font-bold ${primary}`}>Terminar entrenamiento</button>
          </div>
        </div>

        {finishing && (
          <Sheet onClose={() => setFinishing(false)} labelledBy="titulo-terminar">
            <div className="flex items-start justify-between gap-4">
              <h2 id="titulo-terminar" className="font-display text-2xl font-bold text-loza-900">¿Cómo estuvo?</h2>
              <CloseButton onClick={() => setFinishing(false)} />
            </div>
            {doneSets === 0 ? (
              <p role="alert" className="mt-4 rounded-2xl bg-trigo-50 text-loza-900 p-4 text-[15px]">Marcá al menos una serie como hecha para guardar el entrenamiento.</p>
            ) : (
              <>
                <p className="mt-2 text-loza-600">Hiciste {doneSets} {doneSets === 1 ? 'serie' : 'series'}.</p>
                <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Cómo estuvo el entrenamiento">
                  {FEELINGS.map((f) => <button key={f.id} type="button" role="radio" aria-checked={feeling === f.id} onClick={() => setFeeling(f.id)} className={pill(feeling === f.id)}>{f.label}</button>)}
                </div>
              </>
            )}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button type="button" onClick={() => { setDraft(null); setTraining(false); setFinishing(false); }} className="px-5 min-h-[44px] rounded-full text-sm font-bold text-remolacha-700 hover:bg-remolacha-50">Descartar</button>
              <button type="button" onClick={save} disabled={doneSets === 0} className={`px-6 min-h-[44px] rounded-full text-sm font-bold ${primary} disabled:opacity-40 disabled:pointer-events-none`}>Guardar entrenamiento</button>
            </div>
          </Sheet>
        )}
        {exerciseSheet}
      </div>
    );
  }

  const RoutineCard = ({ r }) => (
    <button type="button" onClick={() => setRoutine(r)} className="w-full h-full text-left rounded-[24px] bg-papel border border-loza-200 hover:border-agua-400 transition-colors p-4 flex items-center gap-4">
      <ExerciseFigure slug={r.items[0].slug} className="w-20 h-20 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-bold text-loza-900 leading-tight">{r.name}</span>
        <span className="mt-1 block text-sm text-loza-600">{r.goal} · {r.level}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-sm text-loza-600 tabular"><Clock className="w-4 h-4" aria-hidden="true" />{r.minutes} min · {r.items.length} ejercicios</span>
      </span>
      <ChevronRight className="w-5 h-5 text-loza-500 shrink-0" aria-hidden="true" />
    </button>
  );

  return (
    <div className="min-h-screen bg-loza-50 flex flex-col pb-28">
      <header className="sticky top-0 z-30 glass-surface border-x-0 border-t-0 safe-top">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            <FitMark className="w-9 h-9" />
            <span><span className="block font-marca font-bold text-lg text-loza-900 leading-none">NetAI Fit</span>{goalLabel && <span className="block text-xs text-loza-600 mt-0.5">{goalLabel}</span>}</span>
          </span>
          <div className="flex items-center gap-1">
            <Link href="/app" className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-full text-sm font-bold text-loza-800 hover:bg-loza-100"><Utensils className="w-4 h-4" aria-hidden="true" />Nutrición</Link>
            <button type="button" onClick={() => setSetup({ ...fit })} aria-label="Cambiar mis objetivos" title="Mis objetivos" className="p-3 rounded-full text-loza-600 hover:text-loza-900 hover:bg-loza-100"><Target className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-6 flex-1">
        {tab === 'hoy' && (
          <div className="space-y-8 animate-fade-in">
            <section aria-labelledby="titulo-hoy">
              <h1 id="titulo-hoy" className="font-display text-3xl font-bold text-loza-900">{name ? `Hola, ${name}` : 'Hoy'}</h1>
              <p className="mt-1 text-loza-600">{trainedToday ? 'Ya entrenaste hoy. Lo que sigue es descansar y comer bien.' : 'Tu entrenamiento de hoy está listo.'}</p>
            </section>

            {draft ? (
              <section aria-labelledby="titulo-en-curso" className="rounded-[24px] bg-agua-900 text-agua-50 p-5">
                <h2 id="titulo-en-curso" className="font-display text-xl font-bold text-agua-50">Tenés un entrenamiento sin terminar</h2>
                <p className="mt-1 text-agua-100">{draft.routineName}: {doneSets} de {totalSets} series.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setTraining(true)} className="px-5 min-h-[44px] rounded-full bg-agua-50 text-agua-900 text-sm font-bold">Seguir</button>
                  <button type="button" onClick={() => setDraft(null)} className="px-5 min-h-[44px] rounded-full text-sm font-bold text-agua-50 hover:bg-agua-800">Descartar</button>
                </div>
              </section>
            ) : upNext && (
              <section aria-labelledby="titulo-toca" className="rounded-[24px] bg-papel border border-loza-200 p-5">
                <p className="text-sm text-loza-600">{trainedToday ? 'La próxima' : 'Hoy te toca'}</p>
                <div className="mt-1 flex items-center gap-4">
                  <ExerciseFigure slug={upNext.items[0].slug} animated className="w-24 h-24 shrink-0" />
                  <div className="min-w-0">
                    <h2 id="titulo-toca" className="font-display text-2xl font-bold text-loza-900 leading-tight">{upNext.name}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-loza-600 tabular"><Clock className="w-4 h-4" aria-hidden="true" />{upNext.minutes} min · {upNext.items.length} ejercicios</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => begin(upNext)} className={`px-7 min-h-[48px] rounded-full text-[15px] font-bold ${primary}`}>Empezar</button>
                  <button type="button" onClick={() => setRoutine(upNext)} className="px-5 min-h-[48px] rounded-full text-sm font-bold text-loza-700 hover:bg-loza-100">Ver ejercicios</button>
                </div>
              </section>
            )}

            <section aria-labelledby="titulo-semana-fit">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="titulo-semana-fit" className="font-display text-xl font-bold text-loza-900">Tu semana</h2>
                <p className="text-sm text-loza-600 tabular"><span className="font-bold text-loza-900">{weekDone}</span> de {weekGoal} entrenamientos</p>
              </div>
              <ol className="mt-3 grid grid-cols-7 gap-1.5" aria-label="Días de esta semana">
                {week.map((d) => (
                  <li key={d.date} className="text-center">
                    <span className="block text-sm text-loza-600" aria-hidden="true">{d.label}</span>
                    <span role="img" aria-label={`${longDate(d.date)}: ${d.trained ? 'entrenaste' : d.future ? 'todavía no llegó' : 'sin entrenamiento'}`}
                      className={`mt-1 mx-auto grid place-items-center w-10 h-10 rounded-full ${d.trained ? 'bg-agua-600 text-white' : 'bg-loza-100 text-loza-500'} ${d.isToday ? 'ring-2 ring-offset-2 ring-offset-loza-50 ring-agua-600' : ''}`}>
                      {d.trained && <Check className="w-5 h-5" aria-hidden="true" />}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-sm text-loza-600">{weekDone >= weekGoal ? 'Cumpliste tu semana. Descansar también es parte del plan.' : 'Un día sin entrenar no borra nada: seguís desde donde quedaste.'}</p>
            </section>

            <Link href="/app" className="flex items-center gap-4 rounded-[24px] bg-papel border border-loza-200 hover:border-hoja-400 transition-colors p-4">
              <span className="grid place-items-center w-12 h-12 rounded-full bg-hoja-100 text-hoja-800 shrink-0"><Utensils className="w-5 h-5" aria-hidden="true" /></span>
              <span className="flex-1"><span className="block font-bold text-loza-900">Tu comida de hoy</span><span className="block text-sm text-loza-600">{netai?.mode === 'sport' ? 'En NetAI ves tu energía y tus proteínas del día.' : 'Registrá lo que comés en NetAI.'}</span></span>
              <ChevronRight className="w-5 h-5 text-loza-500" aria-hidden="true" />
            </Link>
          </div>
        )}

        {tab === 'rutinas' && (
          <div className="space-y-8 animate-fade-in">
            <section aria-labelledby="titulo-para-vos">
              <h1 id="titulo-para-vos" className="font-display text-3xl font-bold text-loza-900">Rutinas</h1>
              <h2 className="mt-5 font-display text-xl font-bold text-loza-900">Para tu objetivo</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">{recommended.map((r) => <li key={r.id}><RoutineCard r={r} /></li>)}</ul>
            </section>
            {ROUTINES.some((r) => !recommended.includes(r)) && (
              <section aria-labelledby="titulo-otras">
                <h2 id="titulo-otras" className="font-display text-xl font-bold text-loza-900">Otras rutinas</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">{ROUTINES.filter((r) => !recommended.includes(r)).map((r) => <li key={r.id}><RoutineCard r={r} /></li>)}</ul>
              </section>
            )}
            <aside className="flex items-start gap-3 text-sm text-loza-600">
              <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <p>Las rutinas son generales y no reemplazan a un profesional del ejercicio. Empezá con poca carga y sumá de a poco.</p>
            </aside>
          </div>
        )}

        {tab === 'ejercicios' && (
          <div className="space-y-6 animate-fade-in">
            <section aria-label="Filtros de ejercicios">
              <h1 className="font-display text-3xl font-bold text-loza-900">Ejercicios</h1>
              <div className="mt-4 inline-flex p-1 rounded-full bg-loza-100" role="group" aria-label="Dónde entrenás">
                {EXERCISE_PLACES.map((pl) => <button key={pl.id} type="button" aria-pressed={place === pl.id} onClick={() => { setPlace(pl.id); setZone('Todas'); }} className={segment(place === pl.id)}>{pl.label}</button>)}
              </div>
              <div className="mt-4 -mx-4 px-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Zona del cuerpo">
                {zones.map((z) => <button key={z} type="button" aria-pressed={zone === z} onClick={() => setZone(z)} className={pill(zone === z)}>{z}</button>)}
              </div>
            </section>
            <section aria-label="Ejercicios">
              <p className="text-sm text-loza-600" aria-live="polite">{list.length} {list.length === 1 ? 'ejercicio' : 'ejercicios'}</p>
              <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {list.map((e) => (
                  <li key={e.slug}>
                    <button type="button" onClick={() => openExercise(e)} className="w-full h-full text-left rounded-[20px] bg-papel border border-loza-200 hover:border-agua-400 transition-colors p-3">
                      <ExerciseFigure slug={e.slug} className="w-full aspect-square" />
                      <span className="mt-1 block font-bold text-[15px] text-loza-900 leading-snug">{e.name}</span>
                      <span className="block text-sm text-loza-600">{e.zone} · {e.equipment}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <aside className="flex items-start gap-3 text-sm text-loza-600">
              <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                Las indicaciones son generales. Si algo duele, pará. Ilustraciones de{' '}
                <a className="underline underline-offset-2 hover:text-loza-900" href="https://github.com/bryllim/workout-guide" target="_blank" rel="noopener noreferrer">Workout Guide</a> (Bryl Lim), basadas en{' '}
                <a className="underline underline-offset-2 hover:text-loza-900" href="https://github.com/everkinetic/data" target="_blank" rel="noopener noreferrer">Everkinetic</a>, con licencia{' '}
                <a className="underline underline-offset-2 hover:text-loza-900" href="https://creativecommons.org/licenses/by-sa/4.0/deed.es" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.
              </p>
            </aside>
          </div>
        )}

        {tab === 'progreso' && (
          <div className="space-y-9 animate-fade-in">
            <section aria-labelledby="titulo-progreso">
              <h1 id="titulo-progreso" className="font-display text-3xl font-bold text-loza-900">Progreso</h1>
              <dl className="mt-4 grid grid-cols-3 gap-2.5">
                {[['Total', workouts.length], ['Esta semana', `${weekDone} de ${weekGoal}`], ['Series', workouts.reduce((n, w) => n + w.exercises.reduce((m, e) => m + e.sets.length, 0), 0)]].map(([label, value]) => (
                  <div key={label} className="rounded-[20px] bg-papel border border-loza-200 p-3.5">
                    <dt className="text-sm text-loza-600">{label}</dt>
                    <dd className="mt-1 font-display text-2xl font-bold text-loza-900 tabular">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="titulo-cargas">
              <h2 id="titulo-cargas" className="font-display text-xl font-bold text-loza-900">Tus cargas</h2>
              {progress.length === 0 ? (
                <p className="mt-2 text-loza-600">Cuando termines un entrenamiento, acá vas a ver cuánto levantaste en cada ejercicio y cómo va cambiando.</p>
              ) : (
                <ul className="mt-3 divide-y divide-loza-200 border-y border-loza-200">
                  {progress.map((pr) => {
                    const info = exerciseBySlug(pr.slug); const up = pr.last > pr.first;
                    return (
                      <li key={pr.slug}>
                        <button type="button" onClick={() => setProgressOf(pr)} className="w-full py-3 flex items-center gap-3 text-left hover:bg-loza-100/60 rounded-xl">
                          <ExerciseFigure slug={pr.slug} className="w-12 h-12 shrink-0" />
                          <span className="flex-1 min-w-0"><span className="block font-bold text-loza-900">{info?.name}</span><span className="block text-sm text-loza-600 tabular">{pr.sessions.length} {pr.sessions.length === 1 ? 'vez' : 'veces'}</span></span>
                          <span className="text-right tabular">
                            <span className="block font-bold text-loza-900">{unitText(pr.last, pr.unit)}</span>
                            {pr.sessions.length > 1 && <span className={`flex items-center justify-end gap-1 text-sm ${up ? 'text-agua-700 font-bold' : 'text-loza-600'}`}>{up && <TrendingUp className="w-4 h-4" aria-hidden="true" />}antes {unitText(pr.first, pr.unit)}</span>}
                          </span>
                          <ChevronRight className="w-5 h-5 text-loza-500 shrink-0" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {!noNumbers && (
              <section aria-labelledby="titulo-peso-fit">
                <h2 id="titulo-peso-fit" className="font-display text-xl font-bold text-loza-900">Tu peso</h2>
                <p className="mt-1 text-sm text-loza-600">Opcional. Es el mismo registro que ves en NetAI.</p>
                <div className="mt-3 flex items-center gap-2">
                  <label htmlFor="fit-peso" className="sr-only">Peso de hoy en kilos</label>
                  <div className="flex items-baseline gap-2 rounded-2xl border border-loza-300 bg-papel px-3 py-2 focus-within:border-agua-500">
                    <input id="fit-peso" type="number" inputMode="decimal" min="30" max="300" step="0.1" placeholder="—" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} className="w-20 bg-transparent text-center font-display text-2xl font-bold text-loza-900 tabular placeholder:text-loza-500 focus:outline-none" />
                    <span className="text-sm text-loza-600">kg</span>
                  </div>
                  <button type="button" onClick={addWeight} className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-full border border-agua-200 text-agua-700 text-sm font-bold hover:bg-agua-50"><Scale className="w-4 h-4" aria-hidden="true" />Registrar</button>
                </div>
                {sortedWeights.length > 0 && (
                  <ul className="mt-3 divide-y divide-loza-200 border-y border-loza-200 text-[15px]">
                    {sortedWeights.slice(0, 5).map((w) => <li key={w.date} className="py-2.5 flex justify-between gap-3"><span className="text-loza-700">{longDate(w.date)}</span><span className="font-bold text-loza-900 tabular">{fmt(w.kg)} kg</span></li>)}
                  </ul>
                )}
              </section>
            )}

            <section aria-labelledby="titulo-historial">
              <h2 id="titulo-historial" className="font-display text-xl font-bold text-loza-900">Tus entrenamientos</h2>
              {recent.length === 0 ? (
                <p className="mt-2 text-loza-600">Todavía no registraste ninguno.</p>
              ) : (
                <ul className="mt-3 divide-y divide-loza-200 border-y border-loza-200">
                  {recent.map((w) => (
                    <li key={w.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-loza-900">{w.routineName}</p>
                        <p className="text-sm text-loza-600 tabular">{longDate(w.date)} · {w.minutes} min · {w.exercises.reduce((n, e) => n + e.sets.length, 0)} series · {FEELINGS.find((f) => f.id === w.feeling)?.label}</p>
                      </div>
                      <button type="button" onClick={() => { setWorkouts((prev) => prev.filter((x) => x.id !== w.id)); setToast('Eliminaste el entrenamiento.'); }} aria-label={`Eliminar el entrenamiento ${w.routineName} del ${longDate(w.date)}`} className="grid place-items-center w-11 h-11 shrink-0 rounded-xl text-loza-500 hover:text-remolacha-700 hover:bg-remolacha-50">
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="pt-2">
              {confirmDelete ? (
                <div className="rounded-2xl bg-remolacha-50 p-4">
                  <p className="text-[15px] text-remolacha-900">Se borran tus entrenamientos y tus objetivos de NetAI Fit en este teléfono. Lo de NetAI (comidas y peso) no se toca.</p>
                  <div className="mt-3 flex gap-2 justify-end">
                    <button type="button" onClick={() => setConfirmDelete(false)} className="px-4 min-h-[44px] rounded-full text-sm font-bold text-remolacha-900 hover:bg-remolacha-100">Cancelar</button>
                    <button type="button" onClick={deleteAll} className="px-5 min-h-[44px] rounded-full bg-remolacha-700 text-white text-sm font-bold">Sí, borrar</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="text-sm font-bold text-remolacha-700 hover:underline min-h-[44px]">Borrar mis datos de NetAI Fit</button>
              )}
            </section>
          </div>
        )}
      </main>

      {toast && <div role="status" className="fixed bottom-24 inset-x-0 z-40 px-4 pointer-events-none"><p className="max-w-sm mx-auto rounded-2xl bg-loza-900 text-loza-50 px-4 py-3 text-sm font-bold text-center shadow-sheet">{toast}</p></div>}

      <nav aria-label="Secciones" className="fixed bottom-0 inset-x-0 z-40 glass-surface border-x-0 border-b-0 safe-bottom">
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 pt-1.5 pb-2">
          {[{ id: 'hoy', label: 'Hoy', Icon: House }, { id: 'rutinas', label: 'Rutinas', Icon: ListChecks }, { id: 'ejercicios', label: 'Ejercicios', Icon: Dumbbell }, { id: 'progreso', label: 'Progreso', Icon: Activity }].map(({ id, label, Icon }) => {
            const on = tab === id;
            return (
              <button key={id} type="button" onClick={() => { setTab(id); window.scrollTo(0, 0); }} aria-current={on ? 'page' : undefined} className={`flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-colors ${on ? 'text-loza-900' : 'text-loza-600 hover:text-loza-800'}`}>
                <span className={`px-4 py-1 rounded-full transition-colors ${on ? 'bg-agua-100 text-agua-800' : ''}`}><Icon className="w-5 h-5" /></span>
                <span className={`text-xs ${on ? 'font-bold' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {routine && (
        <Sheet onClose={() => setRoutine(null)} labelledBy="titulo-rutina">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-loza-600">{routine.goal} · {routine.level} · {routine.minutes} min</p>
              <h2 id="titulo-rutina" className="font-display text-2xl font-bold text-loza-900 leading-tight">{routine.name}</h2>
            </div>
            <CloseButton onClick={() => setRoutine(null)} />
          </div>
          <ol className="mt-4 divide-y divide-loza-200 border-y border-loza-200">
            {routine.items.map((item) => (
              <li key={item.slug} className="py-2 flex items-center gap-3">
                <ExerciseFigure slug={item.slug} className="w-14 h-14 shrink-0" />
                <span className="flex-1 font-bold text-[15px] text-loza-900">{exerciseBySlug(item.slug)?.name}</span>
                <span className="text-[15px] text-loza-700 tabular">{targetText(item)}</span>
              </li>
            ))}
          </ol>
          <div className="sticky bottom-0 -mx-5 sm:-mx-7 px-5 sm:px-7 py-3 mt-4 bg-loza-50 border-t border-loza-200 flex justify-end">
            <button type="button" onClick={() => begin(routine)} className={`px-7 min-h-[48px] rounded-full text-[15px] font-bold ${primary}`}>Empezar</button>
          </div>
        </Sheet>
      )}

      {progressOf && (
        <Sheet onClose={() => setProgressOf(null)} labelledBy="titulo-progreso-ejercicio">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-loza-600">Mejor marca: <span className="font-bold text-loza-800 tabular">{unitText(progressOf.best, progressOf.unit)}</span></p>
              <h2 id="titulo-progreso-ejercicio" className="font-display text-2xl font-bold text-loza-900 leading-tight">{exerciseBySlug(progressOf.slug)?.name}</h2>
            </div>
            <CloseButton onClick={() => setProgressOf(null)} />
          </div>
          <ul className="mt-4 divide-y divide-loza-200 border-y border-loza-200 text-[15px]">
            {[...progressOf.sessions].reverse().map((sn, i) => (
              <li key={`${sn.date}-${i}`} className="py-2.5 flex justify-between gap-3"><span className="text-loza-700">{longDate(sn.date)}</span><span className="font-bold text-loza-900 tabular text-right">{sn.text}</span></li>
            ))}
          </ul>
        </Sheet>
      )}

      {exerciseSheet}
    </div>
  );
}
