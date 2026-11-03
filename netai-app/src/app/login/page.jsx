'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlateGraphic } from '@/components/brand/Plate';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/app';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor, ingresá la contraseña familiar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Contraseña incorrecta.');
      }

      setSuccess(true);

      // Usar redirección directa para asegurar recarga de sesión de cookies
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 700);
    } catch (err) {
      setError(err.message || 'No fue posible validar el acceso. Intentá nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-loza-900 leading-tight">Entrá a NetAI</h1>
      <p className="text-loza-600 text-[15px] leading-relaxed mt-2">
        Usá la contraseña que comparte tu familia. La sesión queda abierta 30 días en este dispositivo.
      </p>

      {error && (
        <div role="alert" className="mt-6 p-4 rounded-2xl bg-remolacha-50 text-remolacha-900 text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-remolacha-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <p role="status" className="mt-6 p-4 rounded-2xl bg-hoja-50 text-hoja-900 text-sm animate-fade-in">
          Contraseña correcta. Entrando…
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="family-password" className="block text-sm font-bold text-loza-800 mb-2">
            Contraseña familiar
          </label>
          <div className="relative">
            <input
              id="family-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading || success}
              autoFocus
              required
              className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-loza-300 bg-white text-loza-900 text-[15px] focus:outline-none focus:border-hoja-500 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute inset-y-0 right-0 px-3.5 flex items-center text-loza-500 hover:text-loza-800 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full py-3.5 px-6 rounded-full bg-hoja-600 hover:bg-hoja-700 text-white font-bold text-[15px] transition-colors flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Verificando…
            </>
          ) : success ? (
            'Entrando…'
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      <p className="text-sm text-loza-500 mt-6 leading-relaxed">
        ¿No sabés la contraseña? Pedísela a quien administra el acceso de tu familia.
      </p>
      <p className="text-sm text-loza-500 mt-3">
        <Link href="/privacidad" className="underline underline-offset-4 hover:text-loza-800">Privacidad</Link>
        {' '}y{' '}
        <Link href="/terminos" className="underline underline-offset-4 hover:text-loza-800">términos de uso</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-loza-50 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Panel de marca: el plato del Método del Plato */}
      <aside className="bg-hoja-900 text-hoja-50 px-6 pt-6 pb-10 lg:p-12 flex flex-col">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-hoja-100 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Volver al inicio
        </Link>
        <div className="mt-8 lg:mt-auto flex items-center gap-5 lg:block">
          <PlateGraphic tone="dark" decorative className="w-20 h-20 lg:w-64 lg:h-64 shrink-0" />
          <div className="lg:mt-10">
            <p className="font-display text-2xl lg:text-4xl font-bold text-white leading-tight">NetAI</p>
            <p className="text-hoja-100 mt-1 lg:mt-3 lg:text-lg max-w-sm">Comer con calma, sin dietas ni culpa.</p>
          </div>
        </div>
        <p className="hidden lg:block mt-auto pt-10 text-sm text-hoja-200">Tus registros se guardan en tu teléfono.</p>
      </aside>

      <section className="flex items-start lg:items-center justify-center px-6 py-10 lg:p-12">
        <Suspense
          fallback={
            <p className="flex items-center gap-2 text-loza-600">
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              Cargando…
            </p>
          }
        >
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
