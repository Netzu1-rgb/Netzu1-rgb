'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Leaf, Menu, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full glass-surface border-b border-[#e3ded6]/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sage-500 to-sage-700 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform duration-200">
              <Leaf size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-sage-950 font-sans">
                  Net<span className="text-sage-600">AI</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-sage-100 text-sage-700 border border-sage-200">
                  Bienestar
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium tracking-tight">
                Nutrición Consciente & Ética
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="#que-brinda" 
              className="text-sm font-semibold text-stone-600 hover:text-sage-700 transition-colors"
            >
              Qué brinda
            </Link>
            <Link 
              href="#filosofia" 
              className="text-sm font-semibold text-stone-600 hover:text-sage-700 transition-colors"
            >
              Filosofía
            </Link>
            <Link 
              href="#precios" 
              className="text-sm font-semibold text-stone-600 hover:text-sage-700 transition-colors"
            >
              Precios
            </Link>
            <Link 
              href="#pagos" 
              className="text-sm font-semibold text-stone-600 hover:text-sage-700 transition-colors"
            >
              Medios de Pago
            </Link>
          </nav>

          {/* CTA Access Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-semibold text-sm shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200"
            >
              <span>Acceder a la App</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-stone-700 hover:text-sage-800 hover:bg-sage-50 transition-colors"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-surface border-b border-sage-200 px-5 pt-3 pb-6 animate-slide-up">
          <div className="flex flex-col gap-4">
            <Link 
              href="#que-brinda" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-stone-700 hover:text-sage-700 py-1"
            >
              Qué brinda la app
            </Link>
            <Link 
              href="#filosofia" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-stone-700 hover:text-sage-700 py-1"
            >
              Filosofía Anti-TCA
            </Link>
            <Link 
              href="#precios" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-stone-700 hover:text-sage-700 py-1"
            >
              Planes Comerciales
            </Link>
            <Link 
              href="#pagos" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-stone-700 hover:text-sage-700 py-1"
            >
              Formas de Pago
            </Link>
            
            <div className="pt-2 border-t border-sage-200">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sage-600 text-white font-semibold text-sm shadow-soft"
              >
                <span>Acceder a la App / Descargar</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
