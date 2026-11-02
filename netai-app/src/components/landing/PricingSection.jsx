'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Camera } from 'lucide-react';

const PLANS = [
  {
    name: 'Gratis',
    price: 'US$0',
    period: 'para siempre',
    note: 'Para empezar a cuidarte sin pagar nada.',
    photos: 'Sin análisis por foto',
    featured: false,
    features: [
      'Registro manual ilimitado de comidas',
      'Modo Intuitivo y Método del Plato',
      'Biblioteca de alimentos frecuentes y favoritos',
      'Horarios de comidas personalizables',
    ],
  },
  {
    name: 'Plus',
    price: 'US$0,99',
    period: 'por mes',
    note: 'Registrá tus platos con una foto.',
    photos: '60 fotos al mes',
    featured: false,
    features: [
      'Todo lo del plan Gratis',
      '60 análisis de platos por foto con IA',
      'Estimación automática de porciones',
      'Historial completo y exportable',
      'Soporte prioritario y sin anuncios',
    ],
  },
  {
    name: 'Pro',
    price: 'US$1,99',
    period: 'por mes',
    note: 'Para registrar casi todo con una foto.',
    photos: '150 fotos al mes',
    featured: true,
    features: [
      'Todo lo del plan Plus',
      '150 análisis de platos por foto con IA (unos 5 al día)',
      'Tendencias de tus hábitos y comparación entre períodos',
      'Sugerencias de comidas con IA',
      'Informe mensual de hábitos',
    ],
  },
];

export default function PricingSection() {
  return (
    <section id="precios" className="py-20 md:py-28 bg-white border-t border-loza-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-loza-900 tracking-tight">Planes</h2>
          <p className="mt-4 text-lg text-loza-600 leading-relaxed">
            Empezá gratis, sin límite de registros. Si querés que la IA reconozca tus platos por foto, elegí Plus o Pro. Precios en dólares estadounidenses.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((p) => (
            <article
              key={p.name}
              className={`relative rounded-[28px] p-7 flex flex-col ${
                p.featured ? 'bg-hoja-900 text-hoja-50' : 'bg-loza-50 border border-loza-200 text-loza-900'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className={`font-display text-2xl font-bold ${p.featured ? 'text-white' : 'text-loza-900'}`}>{p.name}</h3>
                {p.featured && <span className="text-sm font-bold text-hoja-200">Recomendado</span>}
              </div>
              <p className="mt-4 flex items-baseline gap-2">
                <span className={`font-display text-5xl font-bold tracking-tight tabular ${p.featured ? 'text-white' : 'text-loza-900'}`}>{p.price}</span>
                <span className={p.featured ? 'text-hoja-200' : 'text-loza-500'}>{p.period}</span>
              </p>
              <p className={`mt-2 ${p.featured ? 'text-hoja-100' : 'text-loza-600'}`}>{p.note}</p>

              <p className={`mt-6 flex items-center gap-2 rounded-2xl px-4 py-3 font-bold ${
                p.featured ? 'bg-hoja-800 text-white' : p.price === 'US$0' ? 'bg-loza-100 text-loza-500' : 'bg-hoja-50 text-hoja-800'
              }`}>
                <Camera className="w-[18px] h-[18px]" aria-hidden="true" />
                {p.photos}
              </p>

              <ul className="mt-6 space-y-3 flex-1">
                {p.features.map((f) => (
                  <li key={f} className={`flex gap-3 text-[15px] ${p.featured ? 'text-hoja-50' : 'text-loza-700'}`}>
                    <Check className={`w-[18px] h-[18px] shrink-0 mt-0.5 ${p.featured ? 'text-hoja-300' : 'text-hoja-600'}`} aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`mt-8 inline-flex items-center justify-center px-6 py-3.5 rounded-full font-bold transition-colors ${
                  p.featured ? 'bg-white text-hoja-900 hover:bg-hoja-50' : 'bg-loza-900 text-white hover:bg-loza-800'
                }`}
              >
                {p.price === 'US$0' ? 'Empezar gratis' : `Elegir ${p.name}`}
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-8 text-loza-600">Pagá con tarjeta, Mercado Pago, transferencia o USDT.</p>
      </div>
    </section>
  );
}
