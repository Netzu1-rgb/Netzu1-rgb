'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Info, Pause, Play } from 'lucide-react';
import { EXERCISES, EXERCISE_PLACES, EXERCISE_ZONES, exerciseFrames } from '@/lib/exercises';

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
    <div ref={ref} aria-hidden="true" className={`relative text-hoja-800 ${animated ? 'figura-animada' : ''} ${className}`}>
      {near && poses.map((n) => (
        <span key={n} data-pose={n} className="figura-pose" style={{ '--pose': `url(${frames[n - 1]})` }} />
      ))}
    </div>
  );
}

const pill = (on) => `shrink-0 px-4 min-h-[44px] rounded-full text-sm font-bold transition-colors ${on ? 'bg-loza-900 text-loza-50' : 'bg-papel border border-loza-300 text-loza-700 hover:border-loza-500'}`;

export default function MoveTab({ Sheet, CloseButton }) {
  const [place, setPlace] = useState('casa');
  const [zone, setZone] = useState('Todas');
  const [open, setOpen] = useState(null);
  const [playing, setPlaying] = useState(true);

  const list = useMemo(() => EXERCISES.filter((e) => (place === 'gimnasio' || e.place === 'casa') && (zone === 'Todas' || e.zone === zone)), [place, zone]);
  const zones = useMemo(() => ['Todas', ...EXERCISE_ZONES.filter((z) => EXERCISES.some((e) => e.zone === z && (place === 'gimnasio' || e.place === 'casa')))], [place]);
  const openExercise = (e) => { setPlaying(true); setOpen(e); };

  return (
    <div className="space-y-8 animate-fade-in">
      <section aria-labelledby="titulo-mover">
        <h1 id="titulo-mover" className="font-display text-3xl font-bold text-loza-900">Mover</h1>
        <p className="mt-2 text-loza-600 max-w-prose">Mirá cómo se hace cada ejercicio antes de probarlo. Tocá uno para ver el movimiento y los pasos.</p>

        <div className="mt-5 inline-flex p-1 rounded-full bg-loza-100" role="group" aria-label="Dónde entrenás">
          {EXERCISE_PLACES.map((p) => (
            <button key={p.id} type="button" aria-pressed={place === p.id} onClick={() => { setPlace(p.id); setZone('Todas'); }}
              className={`px-5 min-h-[44px] rounded-full text-sm font-bold transition-colors ${place === p.id ? 'bg-hoja-600 text-white' : 'text-loza-700 hover:text-loza-900'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-loza-600">{place === 'casa' ? 'Ejercicios sin equipo o con lo que hay en casa.' : 'Suma los ejercicios con barra, mancuernas, poleas y máquinas.'}</p>

        <div className="mt-4 -mx-4 px-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Zona del cuerpo">
          {zones.map((z) => (
            <button key={z} type="button" aria-pressed={zone === z} onClick={() => setZone(z)} className={pill(zone === z)}>{z}</button>
          ))}
        </div>
      </section>

      <section aria-label="Ejercicios">
        <p className="text-sm text-loza-600" aria-live="polite">{list.length} {list.length === 1 ? 'ejercicio' : 'ejercicios'}</p>
        <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((e) => (
            <li key={e.slug}>
              <button type="button" onClick={() => openExercise(e)} className="group w-full h-full text-left rounded-[20px] bg-papel border border-loza-200 hover:border-hoja-400 transition-colors p-3">
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
          Las indicaciones son generales y no reemplazan a un profesional del ejercicio. Si algo duele, pará. Ilustraciones de{' '}
          <a className="underline underline-offset-2 hover:text-loza-900" href="https://github.com/bryllim/workout-guide" target="_blank" rel="noopener noreferrer">Workout Guide</a> (Bryl Lim), basadas en{' '}
          <a className="underline underline-offset-2 hover:text-loza-900" href="https://github.com/everkinetic/data" target="_blank" rel="noopener noreferrer">Everkinetic</a>, con licencia{' '}
          <a className="underline underline-offset-2 hover:text-loza-900" href="https://creativecommons.org/licenses/by-sa/4.0/deed.es" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.
        </p>
      </aside>

      {open && (
        <Sheet onClose={() => setOpen(null)} labelledBy="titulo-ejercicio">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-loza-600">{open.zone} · {open.equipment}</p>
              <h2 id="titulo-ejercicio" className="font-display text-2xl font-bold text-loza-900 leading-tight">{open.name}</h2>
            </div>
            <CloseButton onClick={() => setOpen(null)} />
          </div>

          <div className="relative mt-4 rounded-[24px] bg-papel border border-loza-200">
            <ExerciseFigure key={`${open.slug}-${playing}`} slug={open.slug} animated={playing} className="w-full max-w-[320px] mx-auto aspect-square" />
            <button type="button" onClick={() => setPlaying(!playing)} aria-pressed={!playing}
              className="absolute right-2 bottom-2 inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-full text-sm font-bold text-loza-700 hover:bg-loza-100">
              {playing ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
              {playing ? 'Pausar' : 'Ver movimiento'}
            </button>
          </div>

          <p className="mt-4 text-sm text-loza-600">Trabaja: <span className="font-bold text-loza-800">{open.muscles.join(', ')}</span> · {open.kind === 'tiempo' ? 'Por tiempo' : 'Por repeticiones'}</p>

          <h3 className="mt-5 font-bold text-loza-900">Cómo se hace</h3>
          <ol className="mt-2 space-y-2 text-[15px] text-loza-700 list-decimal pl-5">
            {open.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <p className="mt-4 rounded-2xl bg-hoja-50 text-hoja-900 p-4 text-[15px] leading-relaxed">{open.care}</p>
        </Sheet>
      )}
    </div>
  );
}
