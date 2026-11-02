'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Leaf, 
  Heart, 
  ShieldCheck, 
  Mail, 
  Instagram, 
  Github, 
  Twitter, 
  ArrowUpRight 
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-10 h-10 rounded-xl bg-sage-500 text-white flex items-center justify-center">
                <Leaf size={20} />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                Net<span className="text-sage-400">AI</span>
              </span>
            </Link>

            <p className="text-stone-400 text-sm leading-relaxed max-w-sm mb-6">
              Plataforma ética de registro nutricional y bienestar diario. Fomentamos una relación compasiva con la alimentación, libre de dietas restrictivas y obsesiones con la báscula.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-sage-600 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={17} />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-sage-600 text-stone-300 hover:text-white flex items-center justify-center transition-colors font-bold text-xs"
                aria-label="TikTok"
              >
                TK
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-sage-600 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="X Twitter"
              >
                <Twitter size={17} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-sage-600 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github size={17} />
              </a>
            </div>
          </div>

          {/* Nav Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="#que-brinda" className="hover:text-sage-400 transition-colors">
                  Qué brinda la app
                </Link>
              </li>
              <li>
                <Link href="#filosofia" className="hover:text-sage-400 transition-colors">
                  Filosofía Anti-TCA
                </Link>
              </li>
              <li>
                <Link href="#precios" className="hover:text-sage-400 transition-colors">
                  Planes Comerciales
                </Link>
              </li>
              <li>
                <Link href="#pagos" className="hover:text-sage-400 transition-colors">
                  Medios de Pago
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sage-400 font-semibold hover:text-sage-300 transition-colors inline-flex items-center gap-1">
                  Acceso Privado Familiar <ArrowUpRight size={14} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Pillars */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Principios
            </h4>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li>• Alimentación Intuitiva</li>
              <li>• Guías GAPA Evidencia</li>
              <li>• Método del Plato</li>
              <li>• Modo Bienestar Sin Números</li>
              <li>• Privacidad Local en tu Móvil</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Contacto y Soporte
            </h4>
            <p className="text-sm text-stone-400 leading-relaxed mb-3">
              ¿Dudas o sugerencias familiares sobre la app? Escríbenos de forma directa:
            </p>
            <a
              href="mailto:soporte@netai.app"
              className="inline-flex items-center gap-2 text-sm text-sage-400 hover:text-sage-300 font-medium transition-colors"
            >
              <Mail size={16} />
              <span>soporte@netai.app</span>
            </a>
          </div>

        </div>

        {/* Mandatory Medical & Ethical Disclaimer */}
        <div className="pt-8 pb-6 border-b border-stone-800">
          <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/80 flex items-start gap-3">
            <ShieldCheck size={20} className="text-sage-400 shrink-0 mt-0.5" />
            <div className="text-xs text-stone-400 leading-relaxed">
              <strong className="text-stone-200 block mb-1">Aviso Legal y de Responsabilidad Médica:</strong>
              NetAI es una herramienta pedagógica y de registro personal diseñada para el autoconocimiento y la inspiración culinaria. La información, sugerencias y rangos brindados no constituyen diagnóstico, prescripción médica ni tratamiento nutricional. Para el abordaje de condiciones clínicas, patologías o Trastornos de la Conducta Alimentaria, consulte siempre a profesionales matriculados de la medicina, la nutrición y la salud mental.
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} NetAI Wellness Platform. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="text-stone-400">Hecho con empatía para uso familiar y bienestar integral.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
