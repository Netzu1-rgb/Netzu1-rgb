'use client';

import React, { useEffect, useRef, useState } from 'react';
import { shapes, DEFAULT_VIEWBOX } from '@/lib/anim/rig';
import { MOVES } from '@/lib/anim/moves';

// Momento del ciclo que se muestra quieto: el final del movimiento, que es el más claro
const stillPhase = (def) => (def.mode === 'loop' ? 1 / def.frames.length : 0.5);

/**
 * Muñeco que hace el ejercicio. Quieto en las listas; en movimiento en el detalle y al entrenar.
 * Se mueve solo cuando está en pantalla y nunca si el teléfono pide reducir el movimiento.
 */
export default function CharacterFigure({ slug, animated = false, className = '', label }) {
  const def = MOVES[slug];
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState(() => (def ? stillPhase(def) : 0));

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(Boolean(mq?.matches));
    update();
    mq?.addEventListener?.('change', update);
    return () => mq?.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return undefined; }
    const io = new IntersectionObserver((entries) => setVisible(entries.some((e) => e.isIntersecting)), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const moving = Boolean(def && animated && visible && !reduced);
  useEffect(() => {
    if (!moving) { if (def) setPhase(stillPhase(def)); return undefined; }
    const dur = def.dur || 2400;
    let raf = 0; let last = 0; const t0 = performance.now();
    const tick = (now) => {
      if (now - last > 33) { last = now; setPhase(((now - t0) % dur) / dur); } // unos 30 cuadros por segundo alcanzan
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [moving, def]);

  if (!def) return <div ref={ref} className={className} aria-hidden="true" />;
  return (
    <svg ref={ref} viewBox={def.vb || DEFAULT_VIEWBOX} className={`text-agua-800 ${className}`} data-figura={slug} data-animada={moving ? 'si' : 'no'}
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'} focusable="false">
      {shapes(def, phase).map((s, i) => React.createElement(s.tag, { key: i, ...s.attrs }))}
    </svg>
  );
}
