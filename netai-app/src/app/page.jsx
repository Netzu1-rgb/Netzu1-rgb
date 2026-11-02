import React from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import PhilosophySection from '@/components/landing/PhilosophySection';
import PricingSection from '@/components/landing/PricingSection';
import PaymentMethodsSection from '@/components/landing/PaymentMethodsSection';
import Footer from '@/components/landing/Footer';

export const metadata = {
  title: 'NetAI • Nutrición Consciente, Libre de Dietas & Registro Ético',
  description: 'Descubre una relación compasiva con tu alimentación. Plataforma con registro de energía flexible, Modo Intuitivo sin números y catálogo de recetas anti-TCA.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f4] text-[#1e2924]">
      {/* 1. Navbar */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 2. Hero Section with Pure CSS Mobile App Mockup */}
        <HeroSection />

        {/* 3. Qué Brinda la App (4 Pilares) */}
        <FeaturesSection />

        {/* 4. Filosofía Anti-TCA & Comparativa */}
        <PhilosophySection />

        {/* 5. Precios Ilustrativos */}
        <PricingSection />

        {/* 6. Métodos de Pago Aceptados */}
        <PaymentMethodsSection />
      </main>

      {/* 7. Footer con Disclaimer Médico y Redes */}
      <Footer />
    </div>
  );
}
