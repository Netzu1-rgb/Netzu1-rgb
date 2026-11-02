'use client';

import React from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Coins, 
  ShieldCheck, 
  Lock 
} from 'lucide-react';

export default function PaymentMethodsSection() {
  const methods = [
    {
      title: 'Mercado Pago',
      badge: 'Inmediato',
      desc: 'Dinero en cuenta, tarjetas guardadas y cuotas sin interés según promociones vigentes en Argentina y Latam.',
      icon: Smartphone,
      color: 'bg-ocean-50 text-ocean-700 border-ocean-200'
    },
    {
      title: 'Tarjetas de Crédito y Débito',
      badge: 'Visa, Mastercard, Amex',
      desc: 'Procesamiento encriptado de alta seguridad internacional para tarjetas nacionales e internacionales.',
      icon: CreditCard,
      color: 'bg-sage-50 text-sage-700 border-sage-200'
    },
    {
      title: 'Transferencia Bancaria',
      badge: 'CBU / CVU / Alias',
      desc: 'Acreditación transparente y directa desde cualquier banco o billetera digital sin comisiones intermedias.',
      icon: Building2,
      color: 'bg-earth-50 text-earth-800 border-earth-200'
    },
    {
      title: 'Criptomonedas (USDT)',
      badge: 'TRC20 / Polygon',
      desc: 'Para miembros internacionales o usuarios que prefieren activos digitales estables con confirmación en red.',
      icon: Coins,
      color: 'bg-lavender-50 text-lavender-700 border-lavender-200'
    }
  ];

  return (
    <section id="pagos" className="py-16 md:py-24 bg-loza-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight mb-3">
            Múltiples formas de pago a tu alcance
          </h2>
          <p className="text-sm sm:text-base text-stone-600">
            Aceptamos las plataformas más confiables para que elijas la opción más práctica y segura para ti.
          </p>
        </div>

        {/* Methods Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {methods.map((m, idx) => {
            const IconComponent = m.icon;
            return (
              <div 
                key={idx}
                className="rounded-2xl p-6 bg-white border border-stone-200 shadow-soft hover:shadow-card transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${m.color}`}>
                      <IconComponent size={24} className="stroke-[1.8]" />
                    </div>
                    <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                      {m.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 mb-2">
                    {m.title}
                  </h3>

                  <p className="text-xs text-stone-600 font-normal leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Guarantee Seal */}
        <div className="rounded-2xl p-5 bg-white border border-stone-200 flex flex-wrap items-center justify-center sm:justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2 font-semibold text-stone-700">
            <ShieldCheck size={18} className="text-sage-600" />
            <span>Encriptación SSL de 256 bits y resguardo estricto de privacidad</span>
          </div>
          <div className="flex items-center gap-4 text-stone-600 font-medium">
            <span>✓ Cero permanencia forzada</span>
            <span>✓ Cancelación en cualquier momento</span>
          </div>
        </div>

      </div>
    </section>
  );
}
