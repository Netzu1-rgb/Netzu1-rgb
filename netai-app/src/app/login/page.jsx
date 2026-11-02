'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  HeartHandshake,
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
        throw new Error(data.error || 'Contraseña incorrecta.');
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
    <div className="w-full max-w-md">
      {/* Botón Volver a la Landing */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-stonecalm-600 hover:text-sage-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la página principal
        </Link>
      </div>

      {/* Tarjeta de Acceso Glassmorphic */}
      <div className="bg-white/80 backdrop-blur-xl border border-sage-200/80 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-sage-900/5 relative overflow-hidden">
        {/* Glow sutil en esquina */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-sage-300/30 rounded-full blur-2xl pointer-events-none" />

        {/* Encabezado del Formulario */}
        <div className="text-center mb-8 relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage-500 to-sage-700 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-sage-600/30">
            <Lock className="w-8 h-8" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sage-100 text-sage-800 border border-sage-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-sage-600" />
            Acceso Privado Familiar
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-stonecalm-900 tracking-tight">
            Bienvenido a NetAI
          </h1>
          <p className="text-stonecalm-600 text-sm mt-2">
            Ingresá la contraseña compartida para acceder a la PWA de bienestar y nutrición consciente.
          </p>
        </div>

        {/* Notificación de Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-earth-50 border border-earth-300/80 text-earth-900 text-sm flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-earth-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Acceso no concedido</p>
              <p className="text-xs text-earth-800 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Notificación de Éxito */}
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-sage-50 border border-sage-300 text-sage-900 text-sm flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-sage-600 shrink-0" />
            <div>
              <p className="font-semibold">¡Contraseña validada con éxito!</p>
              <p className="text-xs text-sage-700">Entrando a tu espacio de bienestar...</p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="family-password"
              className="block text-xs font-semibold uppercase tracking-wider text-stonecalm-700 mb-2"
            >
              Contraseña de Familia
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stonecalm-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <input
                id="family-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresá la contraseña familiar"
                disabled={loading || success}
                autoFocus
                required
                className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-stonecalm-200 bg-white/90 text-stonecalm-900 placeholder-stonecalm-400 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all shadow-sm disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stonecalm-400 hover:text-stonecalm-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-4 px-6 rounded-xl bg-sage-600 hover:bg-sage-700 active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-sage-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando credenciales...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Acceso Concedido
              </>
            ) : (
              <>
                Ingresar a la Plataforma
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Separador e Información de Seguridad */}
        <div className="mt-8 pt-6 border-t border-stonecalm-200/80 space-y-3">
          <div className="flex items-center gap-2 text-xs text-stonecalm-600">
            <ShieldCheck className="w-4 h-4 text-sage-600 shrink-0" />
            <span>Sesión segura por 30 días con cifrado HMAC-SHA256</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stonecalm-600">
            <HeartHandshake className="w-4 h-4 text-earth-600 shrink-0" />
            <span>Tus registros de nutrición son 100% privados y locales</span>
          </div>
        </div>
      </div>

      {/* Nota al pie */}
      <p className="text-center text-xs text-stonecalm-500 mt-6">
        ¿Sos miembro de la familia y olvidaste la clave? Consultá con el administrador familiar.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sage-50 via-stonecalm-50 to-earth-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-sage-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-earth-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-12 text-stonecalm-600 gap-3">
            <Loader2 className="w-8 h-8 text-sage-600 animate-spin" />
            <p className="text-sm font-medium">Cargando pasarela de acceso...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
