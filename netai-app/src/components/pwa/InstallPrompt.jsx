'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';

const DISMISS_KEY = 'netai_pwa_dismissed';

export default function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    // Modo sin conexión: registrar el service worker aunque la página ya haya cargado
    if ('serviceWorker' in navigator) {
      const register = () => navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('No se pudo activar el modo sin conexión:', err));
      if (document.readyState === 'complete') register();
      else window.addEventListener('load', register, { once: true });
    }

    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === 'true'; } catch (e) { /* sin almacenamiento */ }
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (dismissed || standalone) return;

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (ios) {
      setIsIOS(true);
      setVisible(true);
    }

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setShowIOSSteps(false);
    try { localStorage.setItem(DISMISS_KEY, 'true'); } catch (e) { /* sin almacenamiento */ }
  };

  const install = async () => {
    if (isIOS) {
      setShowIOSSteps(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferredPrompt(null);
  };

  // Solo se ofrece dentro de la app, no en la página de inicio ni en las legales
  if (!visible || !pathname?.startsWith('/app')) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
        <div className="w-full max-w-md flex items-center gap-3 rounded-2xl bg-hoja-900 text-white p-3 pr-2 shadow-card animate-slide-up">
          <LogoMark className="w-10 h-10 shrink-0 rounded-[22%]" />
          <p className="flex-1 text-sm leading-snug">
            <span className="font-bold block">Instalá NetAI</span>
            <span className="text-hoja-100">Queda en tu pantalla de inicio y funciona sin conexión.</span>
          </p>
          <button type="button" onClick={install} className="shrink-0 px-4 py-2 rounded-full bg-white text-hoja-900 text-sm font-bold hover:bg-hoja-50">
            Instalar
          </button>
          <button type="button" onClick={dismiss} aria-label="No mostrar más" className="shrink-0 p-2 rounded-full text-hoja-200 hover:text-white hover:bg-hoja-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIOSSteps && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-loza-950/45" onClick={() => setShowIOSSteps(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="titulo-ios" className="relative w-full sm:max-w-sm bg-loza-50 rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 shadow-sheet safe-bottom">
            <div className="flex items-start justify-between gap-3">
              <h2 id="titulo-ios" className="font-display text-xl font-bold text-loza-900">Instalar en iPhone</h2>
              <button type="button" onClick={() => setShowIOSSteps(false)} aria-label="Cerrar" className="p-2 -mr-2 -mt-1 rounded-full text-loza-500 hover:bg-loza-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="mt-4 space-y-3 text-[15px] text-loza-700">
              <li className="grid grid-cols-[1.5rem_1fr] gap-2"><span className="font-display font-bold text-hoja-700">1</span>Abrí NetAI en Safari.</li>
              <li className="grid grid-cols-[1.5rem_1fr] gap-2"><span className="font-display font-bold text-hoja-700">2</span>Tocá el botón Compartir, el cuadrado con una flecha hacia arriba.</li>
              <li className="grid grid-cols-[1.5rem_1fr] gap-2"><span className="font-display font-bold text-hoja-700">3</span>Elegí “Agregar a pantalla de inicio” y tocá “Agregar”.</li>
            </ol>
            <button type="button" onClick={dismiss} className="mt-6 w-full py-3 rounded-full bg-hoja-600 text-white text-sm font-bold">Listo</button>
          </div>
        </div>
      )}
    </>
  );
}
