'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full glass-surface border-b border-[#e3ded6]/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size="md" />
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
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
