'use client';

import { useEffect } from 'react';

// Pantalla de error: tus registros están guardados en el teléfono y no se pierden
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-loza-50 flex items-center justify-center px-6">
      <div className="max-w-md">
        <h1 className="font-display text-3xl font-bold text-loza-900">Algo salió mal</h1>
        <p className="text-loza-600 mt-3 text-[17px]">
          Tuvimos un problema al mostrar esta pantalla. Tus registros siguen guardados en tu teléfono.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={() => reset()} className="px-6 py-3 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white font-bold">
            Probar de nuevo
          </button>
          <a href="/app" className="px-6 py-3 rounded-full border border-loza-300 text-loza-800 font-bold hover:border-loza-500">
            Recargar la app
          </a>
        </div>
      </div>
    </main>
  );
}
