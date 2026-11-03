import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';

// Datos que hay que completar antes de publicar. Se ven resaltados en la página mientras falten.
export const LEGAL = {
  responsable: '[Nombre o razón social del responsable]',
  contacto: '[correo de contacto]',
  domicilio: '[ciudad y país del responsable]',
  actualizado: '3 de noviembre de 2026',
};

export function Pendiente({ children }) {
  return <mark className="bg-trigo-100 text-trigo-900 rounded px-1">{children}</mark>;
}

export default function LegalPage({ title, children }) {
  return (
    <div className="min-h-screen bg-loza-50">
      <header className="border-b border-loza-200">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link href="/" aria-label="NetAI, inicio">
            <Logo size="sm" />
          </Link>
          <nav className="flex gap-5 text-[15px] text-loza-700">
            <Link href="/privacidad" className="hover:underline underline-offset-4">Privacidad</Link>
            <Link href="/terminos" className="hover:underline underline-offset-4">Términos</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 py-12 sm:py-16">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-loza-900 leading-tight">{title}</h1>
        <p className="mt-3 text-loza-500">Última actualización: {LEGAL.actualizado}</p>
        <div className="legal mt-10 space-y-8 text-[17px] leading-relaxed text-loza-700">{children}</div>
      </main>
    </div>
  );
}

export function Seccion({ titulo, children }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-bold text-loza-900">{titulo}</h2>
      {children}
    </section>
  );
}
