'use client';

import React, { useState } from 'react';

// Solicitud de acceso. Se envía al servicio de formularios configurado en NEXT_PUBLIC_REQUEST_ENDPOINT,
// que la reenvía por correo a quien administra la app. Sin esa variable, el formulario no se muestra.
const ENDPOINT = process.env.NEXT_PUBLIC_REQUEST_ENDPOINT || '';

const field = 'w-full px-4 py-3 rounded-2xl border border-white/25 bg-white/10 text-white placeholder:text-agua-200 focus:outline-none focus:border-white/70';
const label = 'block text-[15px] font-bold text-agua-100 mb-1.5';

export default function RequestForm() {
  const [form, setForm] = useState({ nombre: '', email: '', whatsapp: '', telefono: '', modo: 'Bienestar', mensaje: '', consentimiento: false, _honey: '' });
  const [status, setStatus] = useState({ state: 'idle', text: '' });
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  if (!/^https?:\/\//i.test(ENDPOINT)) {
    return <p className="rounded-2xl bg-white/10 p-5 text-lg text-agua-100">Las solicitudes abren muy pronto. Volvé a pasar por acá.</p>;
  }

  const fail = (text) => setStatus({ state: 'error', text });

  const submit = async (e) => {
    e.preventDefault();
    if (status.state === 'sending' || form._honey) return;
    const nombre = form.nombre.trim();
    const email = form.email.trim();
    if (!nombre) return fail('Escribí tu nombre.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Revisá el correo, parece incompleto.');
    if (!form.telefono) return fail('Elegí si tu teléfono es Android o iPhone.');
    if (!form.consentimiento) return fail('Para enviar la solicitud, aceptá el uso de tus datos.');

    setStatus({ state: 'sending', text: 'Enviando…' });
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `Nueva solicitud de NetAI: ${nombre}`,
          _template: 'table',
          _replyto: email,
          Nombre: nombre,
          Correo: email,
          WhatsApp: form.whatsapp.trim() || 'No lo dejó',
          Teléfono: form.telefono,
          Modo: form.modo,
          Mensaje: form.mensaje.trim() || 'Sin mensaje',
          Fecha: new Date().toLocaleString('es-AR'),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || String(body.success) === 'false') throw new Error('envío');
      setForm({ nombre: '', email: '', whatsapp: '', telefono: '', modo: 'Bienestar', mensaje: '', consentimiento: false, _honey: '' });
      setStatus({ state: 'ok', text: `Listo, ${nombre}. Recibimos tu solicitud y te escribimos a ${email}.` });
    } catch (err) {
      fail('No pudimos enviar la solicitud. Probá de nuevo en unos minutos.');
    }
  };

  const radio = (name, value) => (
    <label key={value} className="inline-flex items-center gap-2 text-agua-50 cursor-pointer">
      <input type="radio" name={name} value={value} checked={form[name] === value} onChange={() => set({ [name]: value })} className="w-[18px] h-[18px] accent-agua-300" />
      {value === 'Sport' ? 'Modo Sport' : value}
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-[24px] border border-white/15 bg-white/5 p-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="rq-nombre" className={label}>Nombre</label>
          <input id="rq-nombre" type="text" autoComplete="name" value={form.nombre} onChange={(e) => set({ nombre: e.target.value })} className={field} />
        </div>
        <div>
          <label htmlFor="rq-email" className={label}>Correo</label>
          <input id="rq-email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="rq-tel" className={label}>WhatsApp <span className="font-normal text-agua-200">(opcional)</span></label>
        <input id="rq-tel" type="tel" inputMode="tel" autoComplete="tel" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} className={field} />
      </div>
      <fieldset className="flex flex-wrap gap-x-5 gap-y-1.5">
        <legend className={label}>Tu teléfono</legend>
        {['Android', 'iPhone'].map((v) => radio('telefono', v))}
      </fieldset>
      <fieldset className="flex flex-wrap gap-x-5 gap-y-1.5">
        <legend className={label}>¿Qué modo te interesa?</legend>
        {['Bienestar', 'Sport', 'Todavía no sé'].map((v) => radio('modo', v))}
      </fieldset>
      <div>
        <label htmlFor="rq-msg" className={label}>¿Algo que quieras contarnos? <span className="font-normal text-agua-200">(opcional)</span></label>
        <textarea id="rq-msg" rows="2" value={form.mensaje} onChange={(e) => set({ mensaje: e.target.value })} className={field} />
      </div>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form._honey} onChange={(e) => set({ _honey: e.target.value })} className="absolute -left-[9999px] w-px h-px opacity-0" />
      <label className="flex items-start gap-2.5 text-[15px] text-agua-50 cursor-pointer">
        <input type="checkbox" checked={form.consentimiento} onChange={(e) => set({ consentimiento: e.target.checked })} className="mt-0.5 w-[18px] h-[18px] shrink-0 accent-agua-300" />
        Acepto que usen estos datos solo para responderme sobre el acceso a NetAI.
      </label>
      <button type="submit" disabled={status.state === 'sending'} className="justify-self-start px-7 py-3.5 rounded-full bg-white text-agua-900 font-bold hover:bg-agua-50 disabled:opacity-60">
        Enviar solicitud
      </button>
      <p role="status" aria-live="polite" className={`min-h-[1.5em] text-[15px] ${status.state === 'error' ? 'text-remolacha-100' : 'text-agua-50'}`}>{status.text}</p>
    </form>
  );
}
