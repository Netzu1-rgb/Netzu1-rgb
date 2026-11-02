'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Sparkles, ArrowRight, Heart, Users } from 'lucide-react';

export default function PricingSection() {
  const plans = [
    {
      name: 'Plan Mensual',
      badge: 'Flexibilidad Mensual',
      price: '$4.990',
      period: 'ARS / mes',
      equivalent: 'Aprox. $4.99 USD',
      desc: 'Ideal para comenzar a explorar tu alimentación consciente sin compromisos a largo plazo.',
      featured: false,
      features: [
        'Registro consciente de energía sin números rojos',
        'Interruptor instantáneo para el Modo Intuitivo',
        'Catálogo de inspiración de comidas (Método del Plato)',
        'PWA instalable offline en Android e iOS',
        'Almacenamiento privado local en tu teléfono'
      ]
    },
    {
      name: 'Plan Semestral',
      badge: 'Más Elegido • Ahorro 25%',
      price: '$3.740',
      period: 'ARS / mes',
      equivalent: 'Facturado cada 6 meses ($22.440 ARS)',
      desc: 'El tiempo ideal para asentar hábitos sostenibles y una relación en paz con tu plato.',
      featured: true,
      features: [
        'Todo lo incluido en el Plan Mensual',
        'Módulos completos de educación basada en guías GAPA',
        'Filtros avanzados por tiempo y presupuesto',
        'Guía paso a paso para distinguir hambre física de emocional',
        'Acceso prioritario a nuevas recetas de inspiración'
      ]
    },
    {
      name: 'Plan Familiar',
      badge: 'Hogar Saludable',
      price: '$8.990',
      period: 'ARS / mes',
      equivalent: 'Hasta 5 personas en casa',
      desc: 'Diseñado para que toda la familia comparta la app manteniendo la privacidad de sus registros.',
      featured: false,
      features: [
        'Hasta 5 integrantes del hogar con acceso independiente',
        'Cada familiar conserva sus datos locales privados en su móvil',
        'Ideal para inculcar alimentación sin culpas a hijos y pareja',
        'Instalación ilimitada en celulares y tablets familiares',
        'Soporte directo para la instalación de la PWA'
      ]
    }
  ];

  return (
    <section id="precios" className="py-20 md:py-28 bg-white border-t border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage-50 text-sage-800 border border-sage-200 mb-4 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-sage-600" />
            <span>Membresías Transparentes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
            Inversión en tu tranquilidad y salud diaria
          </h2>
          <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
            Planes claros sin letras chicas ni renovaciones engañosas. Elige la alternativa que mejor se adapte a tu ritmo de vida o al de tu familia.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-200 ${
                p.featured
                  ? 'bg-gradient-to-b from-sage-50/90 via-white to-sage-50/50 border-2 border-sage-500 shadow-card -translate-y-1'
                  : 'bg-[#faf9f7] border border-stone-200 shadow-soft hover:shadow-card'
              }`}
            >
              {p.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-sage-600 text-white font-bold text-xs tracking-wide shadow-xs">
                  {p.badge}
                </div>
              )}

              <div>
                {!p.featured && (
                  <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-stone-200/80 text-stone-700 mb-4">
                    {p.badge}
                  </span>
                )}
                {p.featured && <div className="h-4" />}

                <h3 className="text-2xl font-bold text-stone-900 mb-2">
                  {p.name}
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm font-normal mb-6 min-h-[36px]">
                  {p.desc}
                </p>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-stone-200">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
                      {p.price}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-stone-500">
                      {p.period}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 font-medium block mt-1">
                    {p.equivalent}
                  </span>
                </div>

                {/* Features List */}
                <ul className="space-y-3.5 mb-8">
                  {p.features.map((f, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3 text-xs sm:text-sm text-stone-700">
                      <div className="w-5 h-5 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                      <span className="leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div>
                <Link
                  href="/login"
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                    p.featured
                      ? 'bg-sage-600 hover:bg-sage-700 text-white shadow-soft'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  <span>Acceder con este Plan</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
