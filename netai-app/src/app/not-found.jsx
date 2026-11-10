import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';

export const metadata = { title: 'Página no encontrada · NetAI' };

export default function NotFound() {
  return (
    <main className="min-h-screen bg-loza-50 flex items-center justify-center px-6">
      <div className="max-w-md">
        <Logo size="md" />
        <h1 className="font-display text-4xl font-bold text-loza-900 mt-8">No encontramos esa página</h1>
        <p className="text-loza-600 mt-3 text-[17px]">Puede que el enlace esté mal escrito o que la página ya no exista.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="px-6 py-3 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white font-bold">Ir al inicio</Link>
          <Link href="/app" className="px-6 py-3 rounded-full border border-loza-300 text-loza-800 font-bold hover:border-loza-500">Abrir la app</Link>
        </div>
      </div>
    </main>
  );
}
