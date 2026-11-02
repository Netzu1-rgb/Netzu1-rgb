'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share2, X, PlusSquare, Sparkles } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Registro del Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('NetAI Service Worker registrado con éxito:', reg.scope))
          .catch((err) => console.warn('NetAI Service Worker no pudo registrarse:', err));
      });
    }

    // 2. Comprobar si ya fue descartado en esta sesión
    if (typeof window !== 'undefined' && sessionStorage.getItem('netai_pwa_dismissed')) {
      return;
    }

    // 3. Detección de iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      setShowPrompt(true);
    }

    // 4. Captura de evento de instalación nativa en Android / Chrome
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSModal(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('netai_pwa_dismissed', 'true');
    }
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Banner flotante de instalación */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-bounce-subtle">
        <div className="bg-stonecalm-900/95 backdrop-blur-xl border border-stonecalm-700/80 rounded-2xl p-4 shadow-2xl text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sage-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Instalar NetAI App</p>
              <p className="text-[11px] text-stonecalm-300">
                Acceso rápido desde tu inicio y modo sin conexión.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
            >
              {isIOS ? <Share2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Cerrar banner"
              className="p-1.5 rounded-lg text-stonecalm-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal explicativo para Safari en iOS */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-stonecalm-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stonecalm-200 text-stonecalm-900 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stonecalm-100">
              <h4 className="font-bold text-sm text-stonecalm-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sage-600" />
                Instalar en iPhone / iPad
              </h4>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-stonecalm-400 hover:text-stonecalm-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stonecalm-600">
              Para disfrutar de la PWA a pantalla completa en iOS Safari, seguí estos 2 simples pasos:
            </p>

            <div className="space-y-3 text-xs bg-stonecalm-50 p-4 rounded-2xl border border-stonecalm-200">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-ocean-100 text-ocean-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <p>
                  Tocá el botón <strong>Compartir</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-ocean-600" /> en la barra inferior de Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-sage-100 text-sage-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <p>
                  Desplazate hacia abajo y seleccioná <strong>"Agregar a Inicio"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-sage-600" />.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl bg-sage-600 text-white font-semibold text-xs hover:bg-sage-700 transition-colors"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
