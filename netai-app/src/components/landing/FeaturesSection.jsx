'use client';

import React from 'react';
import { 
  Heart, 
  Sparkles, 
  Compass, 
  BookOpen, 
  Sliders, 
  EyeOff, 
  UtensilsCrossed, 
  GraduationCap 
} from 'lucide-react';

export default function FeaturesSection() {
  const pillars = [
    {
      icon: Sliders,
      badge: 'Pilar 1',
      badgeColor: 'bg-sage-100 text-sage-800 border-sage-200',
      title: 'Registro Consciente de Energía',
      description: 'Olvídate de los límites calóricos estrictos que generan ansiedad. NetAI utiliza bandas y rangos flexibles (ej. 1900 – 2200 kcal) que respetan la variabilidad natural de tu gasto diario sin colores rojos ni alertas punitivas.',
      highlights: ['Margen biológico flexible', 'Cero alertas de peligro', 'Refuerzo positivo diario']
    },
    {
      icon: EyeOff,
      badge: 'Pilar 2',
      badgeColor: 'bg-lavender-100 text-lavender-800 border-lavender-200',
      title: 'Modo Intuitivo (Sin Números)',
      description: 'Con un solo toque puedes apagar por completo los números, calorías y gramos de toda la aplicación. Diseñado para quienes desean registrar sus comidas desde la presencia mental, el disfrute y las señales de hambre y saciedad.',
      highlights: ['Oculta calorías y macros', 'Registro por fotos y sensaciones', 'Prevención activa de TCA']
    },
    {
      icon: UtensilsCrossed,
      badge: 'Pilar 3',
      badgeColor: 'bg-ocean-100 text-ocean-800 border-ocean-200',
      title: 'Inspiración Culinaria (Método del Plato)',
      description: 'No creemos en planes de dieta obligatorios ni alimentos prohibidos. Ofrecemos un catálogo interactivo de recetas basadas en la distribución armónica del plato: abundantes vegetales, proteínas de calidad y carbohidratos complejos.',
      highlights: ['Filtros por tiempo y presupuesto', 'Ideas prácticas en 15 minutos', 'Opciones para toda la familia']
    },
    {
      icon: GraduationCap,
      badge: 'Pilar 4',
      badgeColor: 'bg-earth-100 text-earth-800 border-earth-200',
      title: 'Educación Basada en Evidencia',
      description: 'Módulos pedagógicos claros fundamentados en las Guías Alimentarias para la Población Argentina (GAPA) y la Alimentación Intuitiva. Aprende a distinguir entre hambre fisiológica y emocional sin mitos ni restricciones absurdas.',
      highlights: ['Guías GAPA y ciencia real', 'Desmitificación de alimentos', 'Sostenibilidad a largo plazo']
    }
  ];

  return (
    <section id="que-brinda" className="py-20 md:py-28 bg-white border-y border-stone-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight mb-4">
            ¿Qué hace a NetAI una aplicación diferente y segura?
          </h2>
          <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
            Eliminamos todo lo tóxico de las aplicaciones tradicionales de conteo calórico para construir un santuario digital de salud, tranquilidad y buenos hábitos.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {pillars.map((p, idx) => {
            const IconComponent = p.icon;
            return (
              <div 
                key={idx}
                className="relative rounded-3xl p-8 bg-[#fbfaf8] border border-stone-200/90 shadow-soft hover:shadow-card hover:border-sage-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-sage-700 shadow-xs">
                      <IconComponent size={28} className="stroke-[1.8]" />
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3 tracking-tight">
                    {p.title}
                  </h3>

                  <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                    {p.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-200/80">
                  <div className="flex flex-wrap gap-2">
                    {p.highlights.map((item, hIdx) => (
                      <span 
                        key={hIdx} 
                        className="inline-flex items-center text-xs font-medium text-stone-700 bg-white px-3 py-1 rounded-lg border border-stone-200"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
