'use client';

import React from 'react';
import Link from 'next/link';
import { PlateGraphic } from '@/components/brand/Plate';

const GROUPS = [
  { label: 'Vegetales y frutas', share: 'La mitad', dot: 'bg-hoja-500' },
  { label: 'Proteínas', share: 'Un cuarto', dot: 'bg-remolacha-600' },
  { label: 'Cereales y legumbres', share: 'Un cuarto', dot: 'bg-trigo-400' },
];

export default function HeroSection() {
  return (
    <section className="bg-loza-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-center">
        <div>
          <h1 className="font-display text-[clamp(2.6rem,7vw,5.25rem)] font-bold leading-[0.98] tracking-[-0.03em] text-loza-900">
            Comé con calma. Sin dietas ni culpa.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-loza-600 leading-relaxed max-w-xl">
            NetAI te ayuda a armar tu plato y a escuchar tu hambre, con rangos flexibles o sin ver un solo número.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-7 py-4 rounded-full bg-hoja-600 hover:bg-hoja-700 text-white font-bold text-base transition-colors"
            >
              Entrar a la app
            </Link>
            <Link
              href="#filosofia"
              className="inline-flex items-center justify-center px-7 py-4 rounded-full border border-loza-300 hover:border-loza-500 text-loza-800 font-bold text-base transition-colors"
            >
              Cómo pensamos la comida
            </Link>
          </div>

          <p className="mt-8 text-sm text-loza-500 max-w-md">
            Basada en las Guías Alimentarias para la Población Argentina. Tus registros se guardan en tu teléfono.
          </p>
        </div>

        <figure className="flex flex-col items-center lg:items-end">
          <PlateGraphic className="w-full max-w-[360px] lg:max-w-[440px] h-auto" />
          <figcaption className="mt-6 w-full max-w-[360px] lg:max-w-[440px]">
            <ul className="divide-y divide-loza-200 border-y border-loza-200">
              {GROUPS.map((g) => (
                <li key={g.label} className="flex items-center gap-3 py-2.5 text-[15px]">
                  <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${g.dot}`} />
                  <span className="text-loza-800">{g.label}</span>
                  <span className="ml-auto text-loza-500">{g.share}</span>
                </li>
              ))}
            </ul>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
