'use client';

import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import {
  SEX_OPTIONS,
  ACTIVITY_LEVELS,
  GOALS,
  DIET_OPTIONS,
  DIET_TYPES,
  AVOID_OPTIONS,
  avoidedFoods,
  TCA_OPTIONS,
  emptyProfile,
  energyRangeFor,
  hidesNumbers,
  isAdult,
  validateNumbers,
  APP_MODES,
  SPORT_GOALS,
  SPORT_TYPES,
  canUseSport,
  sportPlan,
  minHealthyWeight,
  weeksToTarget,
  validateSport,
} from '@/lib/profile';

const fmt = (n) => Number(n).toLocaleString('es-AR');

// Recorrido para cargar datos personales y físicos. mode="inicial" la primera vez, "editar" desde Ajustes.
export default function Onboarding({ initial, mode = 'inicial', onFinish, onSkip, onClose }) {
  // La primera vez, el Modo Sport viene marcado. Quien ya eligió un modo conserva el suyo.
  // Menores de 18 y personas en tratamiento por un TCA terminan siempre en Bienestar (se resuelve al guardar).
  const [p, setP] = useState(() => ({ ...emptyProfile(), ...(initial || {}), ...(!initial || initial.skipped ? { mode: 'sport' } : {}) }));
  const [stepIndex, setStepIndex] = useState(mode === 'editar' ? 1 : 0);
  const [touched, setTouched] = useState(false);

  const set = (patch) => setP((prev) => ({ ...prev, ...patch }));
  const toggleIn = (key, id) => { const list = p[key] || []; set({ [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] }); };
  // Tipo de alimentación: una sola opción. Al elegir vegetariana o vegana se quitan las exclusiones que ya quedan cubiertas.
  const dietType = p.diet.includes('vegana') ? 'vegana' : p.diet.includes('vegetariana') ? 'vegetariana' : '';
  const setDietType = (id) => {
    const covered = AVOID_OPTIONS.filter((o) => (o.hiddenFor || []).includes(id)).map((o) => o.id);
    set({
      diet: [...p.diet.filter((x) => x !== 'vegetariana' && x !== 'vegana' && !covered.includes(x)), ...(id ? [id] : [])],
      avoid: (p.avoid || []).filter((x) => !covered.includes(x)),
    });
  };

  const minor = p.age !== '' && Number(p.age) < 18;
  const sport = p.mode === 'sport' && !minor;
  const steps = useMemo(() => {
    if (minor) return ['inicio', 'vos', 'actividad', 'objetivos', 'alimentacion', 'vista', 'resumen'];
    if (sport) return ['inicio', 'vos', 'modo', 'cuerpo', 'deporte', 'meta', 'alimentacion', 'vista', 'resumen'];
    return ['inicio', 'vos', 'modo', 'cuerpo', 'actividad', 'objetivos', 'alimentacion', 'vista', 'resumen'];
  }, [minor, sport]);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const errors = { ...validateNumbers(p), ...validateSport(p) };
  const stepErrors = step === 'vos' ? ['age'] : step === 'cuerpo' ? ['heightCm', 'weightKg'] : step === 'deporte' ? ['trainingDays'] : step === 'meta' ? ['targetWeightKg'] : [];
  const plan = sportPlan({ ...p, mode: sport ? 'sport' : p.mode });
  const weeks = weeksToTarget(p);
  const blocked = stepErrors.some((k) => errors[k]);
  const range = energyRangeFor(p);

  const next = () => {
    if (blocked) { setTouched(true); return; }
    setTouched(false);
    if (step === 'meta' && !p.sportGoal) { setTouched(true); return; }
    if (step === 'resumen') {
      // El Modo Sport no está disponible para menores ni para quien está en tratamiento por un TCA
      const mode = p.mode === 'sport' && canUseSport(p) ? 'sport' : 'bienestar';
      const viewMode = hidesNumbers(p) ? 'intuitivo' : mode === 'sport' ? 'rangos' : p.viewMode;
      // Menores de edad: no se guardan datos físicos
      const clean = minor ? { ...p, heightCm: '', weightKg: '', targetWeightKg: '' } : p;
      onFinish({ ...clean, mode, viewMode, skipped: false, completedAt: new Date().toISOString() });
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };
  const back = () => { setTouched(false); setStepIndex((i) => Math.max(i - 1, mode === 'editar' ? 1 : 0)); };

  const numbered = steps.slice(1); // el paso de bienvenida no cuenta
  const position = numbered.indexOf(step) + 1;

  return (
    <div className="fixed inset-0 z-[70] bg-loza-50 overflow-y-auto">
      <div className="min-h-full max-w-xl mx-auto px-5 sm:px-8 pt-5 pb-8 flex flex-col safe-top safe-bottom">
        <header className="flex items-center justify-between gap-3 min-h-11">
          <LogoMark className="w-9 h-9 rounded-[22%]" />
          {step !== 'inicio' && (
            <p className="text-sm text-loza-500 tabular" aria-live="polite">Paso {position} de {numbered.length}</p>
          )}
          {mode === 'editar' ? (
            <button type="button" onClick={onClose} aria-label="Cerrar sin guardar" className="p-2 -mr-2 rounded-full text-loza-500 hover:bg-loza-100">
              <X className="w-5 h-5" />
            </button>
          ) : step !== 'inicio' ? (
            <button type="button" onClick={onSkip} className="text-sm font-bold text-loza-600 hover:text-loza-900 px-2 py-1">
              Completar después
            </button>
          ) : <span className="w-9" />}
        </header>

        {step !== 'inicio' && (
          <div className="mt-3 flex gap-1" aria-hidden="true">
            {numbered.map((s, i) => (
              <span key={s} className={`h-1 flex-1 rounded-full transition-colors ${i < position ? 'bg-hoja-600' : 'bg-loza-200'}`} />
            ))}
          </div>
        )}

        <main className="flex-1 pt-8">
          {step === 'inicio' && (
            <div>
              <h1 className="font-display text-4xl font-bold text-loza-900 leading-tight">Antes de empezar, contanos un poco de vos</h1>
              <p className="mt-4 text-[17px] text-loza-600 leading-relaxed">
                Son unas preguntas cortas para adaptar NetAI a tu vida: tu rango de energía, tus recetas y cómo querés ver la app. Lleva unos 2 minutos.
              </p>
              <ul className="mt-6 space-y-3 text-[15px] text-loza-700">
                <li className="flex gap-3"><Dot />Todo es opcional. Podés saltear lo que no quieras contestar.</li>
                <li className="flex gap-3"><Dot />Tus datos se guardan solo en este teléfono.</li>
                <li className="flex gap-3"><Dot />Si sos deportista, podés elegir el Modo Sport para trabajar un objetivo físico.</li>
              </ul>
            </div>
          )}

          {step === 'vos' && (
            <Step title="Sobre vos">
              <Field id="ob-nombre" label="¿Cómo querés que te llamemos?" hint="Opcional.">
                <input id="ob-nombre" type="text" autoComplete="given-name" value={p.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} />
              </Field>
              <Field id="ob-edad" label="Edad" hint="En años." error={touched && errors.age}>
                <input id="ob-edad" type="number" inputMode="numeric" min="13" max="110" value={p.age} onChange={(e) => set({ age: e.target.value })} className={`${inputCls} w-32 tabular`} />
              </Field>
              {minor && (
                <p className="rounded-2xl bg-agua-50 text-agua-900 p-4 text-[15px]">
                  Como sos menor de 18, no te vamos a pedir peso ni altura. Usá NetAI junto a una persona adulta y, ante cualquier duda, consultá con un pediatra o nutricionista.
                </p>
              )}
              <Choice
                label="Sexo"
                hint="Solo para estimar tu energía diaria, porque el cálculo cambia un poco."
                options={SEX_OPTIONS}
                value={p.sex}
                onChange={(v) => set({ sex: v })}
              />
            </Step>
          )}

          {step === 'modo' && (
            <Step title="¿Cómo querés usar NetAI?" intro="Lo podés cambiar cuando quieras desde Ajustes.">
              <div className="grid gap-2" role="radiogroup" aria-label="Modo de uso">
                {APP_MODES.map((m) => (
                  <OptionCard key={m.id} role="radio" selected={p.mode === m.id} onClick={() => set({ mode: m.id })} title={m.label} hint={m.hint} />
                ))}
              </div>
              {p.mode === 'sport' && (
                <p className="rounded-2xl bg-agua-50 text-agua-900 p-4 text-[15px] leading-relaxed">
                  El Modo Sport usa tu peso y tu entrenamiento para calcular un plan con límites seguros: nunca baja de tu gasto en reposo y apunta a cambios graduales. Si tenés una condición de salud, consultá con un profesional antes de empezar.
                </p>
              )}
            </Step>
          )}

          {step === 'cuerpo' && (
            <Step
              title="Tu cuerpo"
              intro={sport
                ? 'Con tu altura y tu peso calculamos tu plan y seguimos tu progreso. Solo vos los ves.'
                : 'Lo usamos solo para estimar tu rango de energía. En el modo Bienestar no lo vas a ver en la app, no calculamos tu IMC y no hay metas de peso. Si preferís no contestar, dejalo en blanco.'}
            >
              <div className="grid grid-cols-2 gap-4">
                <Field id="ob-altura" label="Altura (cm)" error={touched && errors.heightCm}>
                  <input id="ob-altura" type="number" inputMode="numeric" min="100" max="230" value={p.heightCm} onChange={(e) => set({ heightCm: e.target.value })} className={`${inputCls} tabular`} />
                </Field>
                <Field id="ob-peso" label="Peso (kg)" error={touched && errors.weightKg}>
                  <input id="ob-peso" type="number" inputMode="decimal" min="30" max="300" step="0.1" value={p.weightKg} onChange={(e) => set({ weightKg: e.target.value })} className={`${inputCls} tabular`} />
                </Field>
              </div>
            </Step>
          )}

          {step === 'deporte' && (
            <Step title="Tu entrenamiento">
              <Choice label="¿Qué deporte hacés principalmente?" options={SPORT_TYPES} value={p.sportType} onChange={(v) => set({ sportType: v })} />
              <div className="grid grid-cols-2 gap-4">
                <Field id="ob-dias" label="Días por semana" error={touched && errors.trainingDays}>
                  <input id="ob-dias" type="number" inputMode="numeric" min="0" max="7" value={p.trainingDays} onChange={(e) => set({ trainingDays: e.target.value })} className={`${inputCls} tabular`} />
                </Field>
                <Field id="ob-minutos" label="Minutos por sesión">
                  <input id="ob-minutos" type="number" inputMode="numeric" min="0" max="300" step="5" value={p.sessionMinutes} onChange={(e) => set({ sessionMinutes: e.target.value })} className={`${inputCls} tabular`} />
                </Field>
              </div>
            </Step>
          )}

          {step === 'meta' && (
            <Step title="Tu objetivo">
              <div className="grid gap-2" role="radiogroup" aria-label="Objetivo físico">
                {SPORT_GOALS.map((g) => (
                  <OptionCard key={g.id} role="radio" selected={p.sportGoal === g.id} onClick={() => set({ sportGoal: g.id, targetWeightKg: '' })} title={g.label} hint={g.hint} />
                ))}
              </div>
              {touched && !p.sportGoal && <p role="alert" className="text-sm text-remolacha-700">Elegí un objetivo para seguir.</p>}
              {(p.sportGoal === 'perder-grasa' || p.sportGoal === 'ganar-musculo') && (
                <Field
                  id="ob-objetivo"
                  label="Peso objetivo (kg)"
                  hint={p.sportGoal === 'perder-grasa'
                    ? `Opcional. Para tu altura, lo saludable es no bajar de ${minHealthyWeight(p.heightCm) || '—'} kg.`
                    : 'Opcional.'}
                  error={touched && errors.targetWeightKg}
                >
                  <input id="ob-objetivo" type="number" inputMode="decimal" min="30" max="300" step="0.5" value={p.targetWeightKg} onChange={(e) => set({ targetWeightKg: e.target.value })} className={`${inputCls} w-36 tabular`} />
                </Field>
              )}
              {weeks && !errors.targetWeightKg && (
                <p className="text-[15px] text-loza-700">A un ritmo seguro, llegarías en unas <strong className="tabular">{weeks}</strong> semanas.</p>
              )}
            </Step>
          )}

          {step === 'actividad' && (
            <Step title="¿Cuánto te movés en una semana común?">
              <div className="grid gap-2" role="radiogroup" aria-label="Nivel de actividad">
                {ACTIVITY_LEVELS.map((l) => (
                  <OptionCard key={l.id} selected={p.activity === l.id} onClick={() => set({ activity: l.id })} title={l.label} hint={l.hint} role="radio" />
                ))}
              </div>
            </Step>
          )}

          {step === 'objetivos' && (
            <Step title="¿Para qué querés usar NetAI?" intro="Podés elegir varias.">
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <Pill key={g.id} selected={p.goals.includes(g.id)} onClick={() => toggleIn('goals', g.id)}>{g.label}</Pill>
                ))}
              </div>
            </Step>
          )}

          {step === 'alimentacion' && (
            <Step title="Tu alimentación" intro="Contanos qué comés y qué no, para que las recetas y las ideas te sirvan. Podés dejarlo como está.">
              <fieldset>
                <legend className="text-sm font-bold text-loza-800">¿Qué comés?</legend>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="¿Qué comés?">
                  {DIET_TYPES.map((d) => (
                    <Pill key={d.id || 'todo'} role="radio" selected={dietType === d.id} onClick={() => setDietType(d.id)}>
                      {d.label}{d.hint && <span className="font-normal opacity-80"> · {d.hint}</span>}
                    </Pill>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-bold text-loza-800">¿Hay alimentos que no comés?</legend>
                <p className="mt-0.5 text-sm text-loza-600">Marcá los que no consumís, por salud, gusto o creencias.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {AVOID_OPTIONS.filter((o) => !(o.hiddenFor || []).includes(dietType)).map((o) => {
                    const key = o.field === 'diet' ? 'diet' : 'avoid';
                    return <Pill key={o.id} selected={(p[key] || []).includes(o.id)} onClick={() => toggleIn(key, o.id)}>{o.label}</Pill>;
                  })}
                </div>
              </fieldset>
              <Field id="ob-alergias" label="Otros alimentos que no comés o alergias" hint="Opcional. Por ejemplo: maní, kiwi.">
                <input id="ob-alergias" type="text" value={p.allergies} onChange={(e) => set({ allergies: e.target.value })} className={inputCls} />
              </Field>
            </Step>
          )}

          {step === 'vista' && (
            <Step title="¿Cómo querés ver la app?">
              <Choice
                label="¿Estás en tratamiento o en recuperación de un trastorno de la conducta alimentaria?"
                hint="Es opcional. Si respondés que sí, la app no te va a mostrar calorías ni números en ningún momento."
                options={TCA_OPTIONS}
                value={p.tca}
                onChange={(v) => set({ tca: v })}
              />
              {hidesNumbers(p) ? (
                <p className="rounded-2xl bg-hoja-50 text-hoja-900 p-4 text-[15px] leading-relaxed">
                  Gracias por contarnos. Activamos el Modo Intuitivo: vas a registrar con los grupos del plato y la escala de hambre y saciedad, sin números.
                  {p.mode === 'sport' && ' Por eso, el Modo Sport y las metas de peso no van a estar disponibles.'} Seguí las indicaciones de tu equipo de salud; NetAI no reemplaza ese acompañamiento.
                </p>
              ) : sport ? (
                <p className="text-[15px] text-loza-600">En el Modo Sport vas a ver tu energía, tus proteínas y tu peso para seguir el objetivo.</p>
              ) : (
                <div className="grid gap-2" role="radiogroup" aria-label="Cómo ver la app">
                  <OptionCard role="radio" selected={p.viewMode === 'rangos'} onClick={() => set({ viewMode: 'rangos' })} title="Con un rango de energía flexible" hint="Ves una estimación de calorías del día dentro de un rango, sin alertas." />
                  <OptionCard role="radio" selected={p.viewMode === 'intuitivo'} onClick={() => set({ viewMode: 'intuitivo' })} title="Modo Intuitivo, sin números" hint="Registrás con los grupos del plato y cómo te sentís. Lo podés cambiar cuando quieras." />
                </div>
              )}
            </Step>
          )}

          {step === 'resumen' && (
            <Step title={p.name ? `Listo, ${p.name.trim()}` : 'Listo'}>
              {plan && !hidesNumbers(p) && (
                <div className="rounded-[24px] bg-hoja-900 text-hoja-50 p-6">
                  <p className="text-sm text-hoja-200">Tu plan: {SPORT_GOALS.find((g) => g.id === p.sportGoal)?.label}</p>
                  <p className="font-display text-3xl sm:text-4xl font-bold text-hoja-50 mt-1 tabular">{fmt(plan.energy.min)} a {fmt(plan.energy.max)} kcal</p>
                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[15px] tabular">
                    <dt className="text-hoja-200">Proteínas</dt><dd className="text-hoja-50">{plan.proteinG[0]} a {plan.proteinG[1]} g</dd>
                    <dt className="text-hoja-200">Carbohidratos</dt><dd className="text-hoja-50">{plan.carbsG[0]} a {plan.carbsG[1]} g</dd>
                    <dt className="text-hoja-200">Grasas</dt><dd className="text-hoja-50">{plan.fatG[0]} a {plan.fatG[1]} g</dd>
                    <dt className="text-hoja-200">Agua</dt><dd className="text-hoja-50">{plan.waterGlasses} vasos</dd>
                    {plan.rateKg && (<><dt className="text-hoja-200">Ritmo</dt><dd className="text-hoja-50">{Math.abs(plan.rateKg[1]).toLocaleString('es-AR', { maximumFractionDigits: 1 })} a {Math.abs(plan.rateKg[0]).toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg por semana</dd></>)}
                  </dl>
                  <p className="text-sm text-hoja-100 mt-4 leading-relaxed">
                    Mantenimiento estimado: {fmt(plan.maintenance)} kcal. Nunca bajamos de {fmt(plan.floor)} kcal, tu gasto en reposo. Son valores orientativos según las guías de nutrición deportiva (ACSM e ISSN).
                  </p>
                </div>
              )}
              {!plan && !hidesNumbers(p) && p.viewMode === 'rangos' && (
                <div className="rounded-[24px] bg-hoja-900 text-hoja-50 p-6">
                  <p className="text-sm text-hoja-200">{range.personal ? 'Tu rango de energía flexible' : 'Rango de energía general'}</p>
                  <p className="font-display text-3xl sm:text-4xl font-bold text-hoja-50 mt-1 tabular">{fmt(range.min)} a {fmt(range.max)} kcal</p>
                  <p className="text-sm text-hoja-100 mt-2 leading-relaxed">
                    {range.personal
                      ? 'Es una estimación según tu edad, altura, peso y actividad. El cuerpo se regula a lo largo de la semana: no es un límite.'
                      : minor
                        ? 'Para menores de 18 usamos un rango general. Consultá con un profesional para una indicación personal.'
                        : 'Usamos un rango general porque faltan algunos datos. Podés completarlos cuando quieras desde Ajustes.'}
                  </p>
                </div>
              )}
              <dl className="divide-y divide-loza-200 border-y border-loza-200 text-[15px]">
                <Row label="Edad" value={p.age ? `${p.age} años` : 'Sin completar'} />
                {!minor && <Row label="Altura y peso" value={p.heightCm && p.weightKg ? (sport ? `${p.heightCm} cm, ${p.weightKg} kg` : 'Cargados (no se muestran)') : 'Sin completar'} />}
                {sport ? (
                  <>
                    <Row label="Modo" value="Sport" />
                    <Row label="Entrenamiento" value={p.trainingDays ? `${p.trainingDays} días por semana${p.sessionMinutes ? `, ${p.sessionMinutes} min` : ''}` : 'Sin completar'} />
                    <Row label="Objetivo" value={[SPORT_GOALS.find((g) => g.id === p.sportGoal)?.label, p.targetWeightKg ? `${p.targetWeightKg} kg` : ''].filter(Boolean).join(', ') || 'Sin completar'} />
                  </>
                ) : (
                  <>
                    <Row label="Actividad" value={ACTIVITY_LEVELS.find((l) => l.id === p.activity)?.label || 'Sin completar'} />
                    <Row label="Objetivos" value={p.goals.length ? GOALS.filter((g) => p.goals.includes(g.id)).map((g) => g.label).join(', ') : 'Sin completar'} />
                  </>
                )}
                <Row label="Alimentación" value={DIET_OPTIONS.filter((d) => p.diet.includes(d.id)).map((d) => d.label).join(', ') || 'De todo'} />
                {avoidedFoods(p) && <Row label="No comés" value={avoidedFoods(p)} />}
                {!sport && <Row label="Vista" value={hidesNumbers(p) || p.viewMode === 'intuitivo' ? 'Modo Intuitivo' : 'Rango de energía'} />}
              </dl>
              <p className="text-sm text-loza-500">Podés cambiar todo desde Ajustes, en “Tus datos”.</p>
            </Step>
          )}
        </main>

        <footer className="pt-8 flex items-center gap-3">
          {stepIndex > (mode === 'editar' ? 1 : 0) && (
            <button type="button" onClick={back} className="px-5 py-3.5 rounded-full text-[15px] font-bold text-loza-700 hover:bg-loza-100">
              Atrás
            </button>
          )}
          <button type="button" onClick={next} className="ml-auto px-7 py-3.5 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white text-[15px] font-bold">
            {step === 'inicio' ? 'Empezar' : step === 'resumen' ? (mode === 'editar' ? 'Guardar cambios' : 'Ir a mi día') : 'Siguiente'}
          </button>
        </footer>
        {step === 'inicio' && mode === 'inicial' && (
          <button type="button" onClick={onSkip} className="mt-3 self-end text-sm font-bold text-loza-500 hover:text-loza-800 px-2 py-1">
            Prefiero completarlo después
          </button>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full px-4 py-3 rounded-2xl border border-loza-300 bg-papel text-[16px] text-loza-900 focus:outline-none focus:border-hoja-500';

function Dot() {
  return <span aria-hidden="true" className="mt-2 w-1.5 h-1.5 rounded-full bg-hoja-500 shrink-0" />;
}

function Step({ title, intro, children }) {
  return (
    <section aria-labelledby="ob-titulo" className="space-y-6">
      <div>
        <h1 id="ob-titulo" className="font-display text-3xl font-bold text-loza-900 leading-tight">{title}</h1>
        {intro && <p className="mt-3 text-[16px] text-loza-600 leading-relaxed">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, hint, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[15px] font-bold text-loza-800">{label}</label>
      {hint && <p className="text-sm text-loza-500 mt-0.5">{hint}</p>}
      <div className="mt-2">{children}</div>
      {error && <p role="alert" className="mt-1.5 text-sm text-remolacha-700">{error}</p>}
    </div>
  );
}

function Choice({ label, hint, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="text-[15px] font-bold text-loza-800">{label}</legend>
      {hint && <p className="text-sm text-loza-500 mt-0.5">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <Pill key={o.id} role="radio" selected={value === o.id} onClick={() => onChange(o.id)}>{o.label}</Pill>
        ))}
      </div>
    </fieldset>
  );
}

function Pill({ selected, onClick, children, role }) {
  const a11y = role === 'radio' ? { role: 'radio', 'aria-checked': selected } : { 'aria-pressed': selected };
  return (
    <button
      type="button"
      onClick={onClick}
      {...a11y}
      className={`px-4 py-2.5 rounded-full text-[15px] font-bold transition-colors ${selected ? 'bg-hoja-600 text-white' : 'bg-papel border border-loza-300 text-loza-700 hover:border-loza-500'}`}
    >
      {children}
    </button>
  );
}

function OptionCard({ selected, onClick, title, hint, role }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 border transition-colors ${selected ? 'border-hoja-600 bg-hoja-50 ring-1 ring-hoja-600' : 'border-loza-300 bg-papel hover:border-loza-500'}`}
    >
      <span className="block font-bold text-[16px] text-loza-900">{title}</span>
      <span className="block text-sm text-loza-600 mt-0.5">{hint}</span>
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="py-3 grid grid-cols-[7.5rem_1fr] gap-3">
      <dt className="text-loza-500">{label}</dt>
      <dd className="text-loza-900">{value}</dd>
    </div>
  );
}
