'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Cuántas hojas hay abiertas: sirve para que el botón Atrás del teléfono cierre la hoja en lugar de salir de la app
let openSheets = 0;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({ children, onClose, labelledBy }) {
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

export function CloseButton({ onClick }) {
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
