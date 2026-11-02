'use client';

import React from 'react';
import { 
  Sparkles, 
  Heart, 
  Droplets, 
  Utensils, 
  Sun, 
  Coffee, 
  Moon, 
  Leaf, 
  Compass, 
  BookOpen, 
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export default function AppMockup() {
  return (
    <div className="relative mx-auto max-w-[340px] sm:max-w-[360px] select-none">
      
      {/* Outer Glow Halo */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-sage-400/25 via-ocean-300/20 to-lavender-400/25 rounded-[56px] blur-2xl -z-10" />

      {/* Phone Hardware Frame */}
      <div className="relative rounded-[48px] p-3 bg-stone-900 shadow-2xl ring-1 ring-white/20">
        
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-30 flex items-center justify-between px-3">
          <div className="w-2 h-2 rounded-full bg-stone-800" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
        </div>

        {/* Screen Bezel & Canvas */}
        <div className="relative rounded-[40px] overflow-hidden bg-[#f8f7f4] border border-stone-200/50 pt-8 pb-4 px-4 flex flex-col h-[650px] shadow-inner text-[#1e2924]">
          
          {/* Status Bar simulation */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 px-2 mb-3">
            <span>09:41</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-4 h-2 rounded-sm border border-stone-400 flex items-center p-0.5">
                <div className="h-full w-full bg-stone-700 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Top Greeting & Wellness Mode Toggle */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <span className="text-[11px] uppercase font-bold text-sage-600 tracking-wider">NetAI PWA</span>
              <h4 className="text-base font-bold text-stone-900 leading-tight">Hola, Familia 👋</h4>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-lavender-100 text-lavender-700 border border-lavender-200 text-[10px] font-bold">
              <Heart size={11} className="fill-lavender-600" />
              <span>Modo Intuitivo</span>
            </div>
          </div>

          {/* Daily Motivation Spark Mini-Card */}
          <div className="rounded-2xl p-3 bg-gradient-to-r from-sage-50 to-ocean-50 border border-sage-200/80 mb-3 shadow-xs">
            <div className="flex items-center gap-1.5 text-sage-700 mb-1">
              <Sparkles size={13} className="text-sage-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Sabiduría Diaria</span>
            </div>
            <p className="text-[11.5px] italic font-medium text-stone-700 leading-snug">
              “La nutrición es un acto de cuidado y energía, no un examen de perfección.”
            </p>
          </div>

          {/* Flexible Energy & Balance Indicator (Weight-neutral) */}
          <div className="rounded-2xl p-3.5 bg-white border border-stone-200 shadow-soft mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-stone-600">Balance Consciente de Energía</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">
                Zona Óptima
              </span>
            </div>

            {/* Visual Soft Bar */}
            <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden p-0.5 mb-2">
              <div className="h-full rounded-full bg-gradient-to-r from-sage-400 via-sage-500 to-ocean-400 w-[72%] transition-all" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500">
              <span>Zona segura sugerida</span>
              <strong className="text-sage-800 font-semibold">1850 – 2150 kcal</strong>
            </div>
          </div>

          {/* Water & Variety Mini Tracker */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-2xl p-2.5 bg-ocean-50 border border-ocean-200/70 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-ocean-500 text-white flex items-center justify-center shrink-0">
                <Droplets size={16} />
              </div>
              <div>
                <span className="text-[10px] text-ocean-700 font-medium block">Hidratación</span>
                <strong className="text-xs text-ocean-950 font-bold">6 de 8 vasos</strong>
              </div>
            </div>

            <div className="rounded-2xl p-2.5 bg-earth-100/70 border border-earth-200 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-earth-600 text-white flex items-center justify-center shrink-0">
                <Leaf size={16} />
              </div>
              <div>
                <span className="text-[10px] text-earth-800 font-medium block">Colores en plato</span>
                <strong className="text-xs text-earth-950 font-bold">4 variedades</strong>
              </div>
            </div>
          </div>

          {/* Meals of the Day Preview */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider px-1">
              Registro Atento de Hoy
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Sun size={14} />
                </div>
                <div>
                  <h6 className="text-[12px] font-bold text-stone-900 leading-tight">Tostada Integral & Palta</h6>
                  <span className="text-[10px] text-stone-500">Desayuno con semillas y huevo</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-sage-700 bg-sage-50 px-2 py-0.5 rounded-md border border-sage-200">
                Saciedad óptima
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sage-100 text-sage-700 flex items-center justify-center">
                  <Utensils size={14} />
                </div>
                <div>
                  <h6 className="text-[12px] font-bold text-stone-900 leading-tight">Bowl Mediterráneo</h6>
                  <span className="text-[10px] text-stone-500">Quinoa, vegetales asados y salmón</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-sage-700 bg-sage-50 px-2 py-0.5 rounded-md border border-sage-200">
                Nutrición plena
              </span>
            </div>
          </div>

          {/* Simulated Mobile Bottom Navigation Bar */}
          <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-around text-stone-400">
            <div className="flex flex-col items-center text-sage-700">
              <Utensils size={16} />
              <span className="text-[9px] font-bold mt-0.5">Mi Día</span>
            </div>
            <div className="flex flex-col items-center">
              <Compass size={16} />
              <span className="text-[9px] font-medium mt-0.5">Inspiración</span>
            </div>
            <div className="flex flex-col items-center">
              <BookOpen size={16} />
              <span className="text-[9px] font-medium mt-0.5">Aprender</span>
            </div>
          </div>

          {/* Home indicator bar */}
          <div className="w-24 h-1 bg-stone-300 rounded-full mx-auto mt-2" />
        </div>
      </div>
    </div>
  );
}
