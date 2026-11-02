'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import AppMockup from './AppMockup';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      
      {/* Background Soft Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-sage-200/40 blur-3xl" />
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-ocean-200/30 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 rounded-full bg-lavender-200/30 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Value Proposition & Copywriting */}
          <div className="lg:col-span-7 text-center lg:text-left">
            
            {/* Ethical Badge Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage-100 text-sage-800 border border-sage-200/80 mb-6 text-xs sm:text-sm font-semibold shadow-xs">
              <Sparkles size={15} className="text-sage-600" />
              <span>Enfoque Neutral al Peso & Libre de Culpa</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.15] mb-6">
              Nutrición con <span className="text-sage-600 underline decoration-sage-300 decoration-wavy decoration-2 underline-offset-4">paz mental</span>, sin obsesiones ni dietas restrictivas.
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-stone-600 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-8">
              Descubre una relación amable con tu alimentación. Registra tu balance de energía diario con rangos flexibles o activa el <strong>Modo Intuitivo</strong> para conectar con tu hambre y saciedad sin contar un solo número.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-sage-600 hover:bg-sage-700 text-white font-bold text-base shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>Acceder a la App / Descargar</span>
                <ArrowRight size={18} />
              </Link>

              <Link
                href="#filosofia"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 font-semibold text-base border border-stone-200 shadow-soft hover:border-sage-300 transition-all duration-200"
              >
                <span>Conocer Filosofía</span>
              </Link>
            </div>

            {/* Trust Micro-Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-stone-200/80 text-left">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-sage-600 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-stone-700">Espacio Seguro Anti-TCA</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-sage-600 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-stone-700">Rangos Biológicos Seguros</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-sage-600 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-stone-700">Guías GAPA & Evidencia</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Pure CSS Mobile Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <AppMockup />
          </div>

        </div>
      </div>
    </section>
  );
}
