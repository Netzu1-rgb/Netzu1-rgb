'use client';

import React from 'react';
import { ShieldCheck, HeartHandshake, Check, X, Sparkles, Scale, Info } from 'lucide-react';

export default function PhilosophySection() {
  const comparisons = [
    {
      traditional: 'Uso de colores rojos y alarmas si superas tu número de calorías.',
      netai: 'Paleta neutral y reencuadre positivo: la energía nutre tus células y recuperación.'
    },
    {
      traditional: 'Clasificación moral de "alimentos buenos" y "comidas trampa (cheat meals)".',
      netai: 'Alimentos de alta densidad nutricional y alimentos de consumo ocasional sin culpa.'
    },
    {
      traditional: 'Rachas punitivas (streaks) y premios por comer por debajo de lo saludable.',
      netai: 'Celebración de la constancia, la variedad de colores en el plato y la hidratación.'
    },
    {
      traditional: 'Foco exclusivo en un peso objetivo arbitrario y tablas de IMC rígidas.',
      netai: 'Foco en vitalidad, fuerza, descanso, digestión y bienestar general sostenible.'
    },
    {
      traditional: 'Planes de dieta forzados e intercambios restrictivos día por día.',
      netai: 'Catálogo de inspiración culinaria basado en el Método del Plato y tus propios gustos.'
    }
  ];

  return (
    <section id="filosofia" className="py-20 md:py-28 bg-loza-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight mb-4">
            Por qué decidimos romper con la cultura de la dieta
          </h2>
          <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
            La evidencia clínica demuestra que las dietas restrictivas y las aplicaciones obsesivas incrementan la ansiedad alimentaria y los Trastornos de la Conducta Alimentaria (TCA). NetAI nació para ser el antídoto.
          </p>
        </div>

        {/* Comparison Table / Dual Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-14">
          
          {/* Traditional Apps Card */}
          <div className="rounded-3xl p-8 bg-stone-100/90 border border-stone-300/80 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-stone-200 text-stone-600 flex items-center justify-center">
                <X size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-800">Apps Tradicionales</h3>
                <span className="text-xs text-stone-500 font-medium">Cultura de la dieta y culpa</span>
              </div>
            </div>

            <div className="space-y-4">
              {comparisons.map((c, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/70 border border-stone-200">
                  <span className="text-stone-400 font-bold shrink-0 mt-0.5">✕</span>
                  <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                    {c.traditional}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* NetAI Ethical Standard Card */}
          <div className="rounded-3xl p-8 bg-gradient-to-b from-sage-50/90 to-white border-2 border-sage-300 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-sage-600 text-white flex items-center justify-center shadow-xs">
                <Check size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-sage-950">El Estándar NetAI</h3>
                <span className="text-xs text-sage-700 font-semibold">Salud integral y compasión</span>
              </div>
            </div>

            <div className="space-y-4">
              {comparisons.map((c, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-sage-100/50 border border-sage-200/90">
                  <Check size={16} className="text-sage-700 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-sage-900 font-medium leading-relaxed">
                    {c.netai}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Hard Limits Banner */}
        <div className="rounded-2xl p-6 bg-sage-600 text-white shadow-soft flex flex-col sm:flex-row items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sage-500/80 border border-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={26} className="text-white" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold">Límites de Seguridad Fisiológica Inamovibles</h4>
              <p className="text-xs sm:text-sm text-sage-100 leading-snug">
                El código de NetAI bloquea cualquier configuración inferior a 1500 kcal o la Tasa Metabólica Basal segura. Tu cuerpo merece combustible digno para vivir.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
