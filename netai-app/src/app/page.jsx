import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { PlateGraphic } from '@/components/brand/Plate';
import PricingSection from '@/components/landing/PricingSection';
import RequestForm from '@/components/landing/RequestForm';

export const metadata = {
  title: 'NetAI · Comé con calma, sin dietas ni culpa',
  description: 'Registrá tus comidas con una foto o a mano, escuchá tu hambre y elegí tu modo: Bienestar, sin metas de peso, o Sport, para deportistas.',
};

const GROUPS = [
  { label: 'Vegetales y frutas', share: 'La mitad', dot: 'bg-hoja-500' },
  { label: 'Proteínas', share: 'Un cuarto', dot: 'bg-remolacha-600' },
  { label: 'Cereales y legumbres', share: 'Un cuarto', dot: 'bg-trigo-400' },
];

const FEATURES = [
  { title: 'Registrá con una foto o a mano', text: 'Sacale una foto al plato y la IA estima porción, calorías, proteínas, carbohidratos y grasas. Siempre podés corregirlo.' },
  { title: 'Escuchá tu hambre', text: 'Anotá cuánta hambre tenías antes y cómo te sentiste después, con una escala del 1 al 10.' },
  { title: 'Modo Intuitivo', text: 'Con un toque desaparecen las calorías y los números. Quedan los grupos del plato y cómo te sentís.' },
  { title: 'Tu semana y tu mes', text: 'Mirá tu constancia, tu agua y tus hábitos sin rachas que se pierden.' },
  { title: 'Tus datos, en tu teléfono', text: 'Los registros se guardan en tu dispositivo. Podés descargar una copia o borrarlos cuando quieras.' },
  { title: 'Funciona sin conexión', text: 'Se instala desde el navegador en Android y iPhone, y sigue andando sin internet.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-loza-50 text-loza-900">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-loza-900 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 glass-surface border-x-0 border-t-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">
          <Link href="/" aria-label="NetAI, inicio"><Logo size="sm" /></Link>
          <nav aria-label="Principal" className="hidden md:flex gap-6 ml-auto text-[15px] text-loza-700">
            <a href="#que-hace" className="hover:text-loza-900 hover:underline underline-offset-4">Qué hace</a>
            <a href="#modos" className="hover:text-loza-900 hover:underline underline-offset-4">Modos</a>
            <a href="#precios" className="hover:text-loza-900 hover:underline underline-offset-4">Planes</a>
          </nav>
          <div className="flex items-center gap-2 ml-auto md:ml-0">
            <Link href="/login" className="px-4 py-2 rounded-full text-sm font-bold text-loza-800 hover:bg-loza-100">Entrar</Link>
            <a href="#solicitar" className="px-4 py-2 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white text-sm font-bold">Pedir acceso</a>
          </div>
        </div>
      </header>

      <main id="contenido" className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-center">
          <div>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5.25rem)] font-bold leading-[0.98] tracking-[-0.03em]">
              Comé con calma. Sin dietas ni culpa.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-loza-600 leading-relaxed max-w-xl">
              NetAI te ayuda a armar tu plato y a escuchar tu hambre, con rangos flexibles o sin ver un solo número. Y si entrenás, el Modo Sport te acompaña con tu objetivo.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="#solicitar" className="inline-flex items-center justify-center px-7 py-4 rounded-full bg-hoja-600 hover:bg-hoja-500 text-white font-bold">Pedir acceso a la beta</a>
              <Link href="/login" className="inline-flex items-center justify-center px-7 py-4 rounded-full border border-loza-300 hover:border-loza-500 text-loza-800 font-bold">Ya tengo un código</Link>
            </div>
            <p className="mt-8 text-sm text-loza-500 max-w-md">Basada en las Guías Alimentarias para la Población Argentina. Tus registros se guardan en tu teléfono.</p>
          </div>
          <figure className="flex flex-col items-center lg:items-end">
            <PlateGraphic className="w-full max-w-[360px] lg:max-w-[440px] h-auto" />
            <figcaption className="mt-6 w-full max-w-[360px] lg:max-w-[440px]">
              <ul className="divide-y divide-loza-200 border-y border-loza-200">
                {GROUPS.map((g) => (
                  <li key={g.label} className="flex items-center gap-3 py-2.5 text-[15px]">
                    <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${g.dot}`} />
                    <span className="text-loza-800">{g.label}</span>
                    <span className="ml-auto text-loza-500">{g.share}</span>
                  </li>
                ))}
              </ul>
            </figcaption>
          </figure>
        </section>

        <section id="que-hace" className="bg-white border-y border-loza-200 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Qué hace NetAI</h2>
            <dl className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10">
              {FEATURES.map((f) => (
                <div key={f.title} className="py-5 border-t border-loza-200">
                  <dt className="font-display text-xl font-bold">{f.title}</dt>
                  <dd className="mt-1.5 text-loza-600 leading-relaxed">{f.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="modos" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 scroll-mt-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Dos modos, vos elegís</h2>
          <div className="mt-10 grid md:grid-cols-2 border-t-2 border-loza-900">
            <article className="py-8 md:pr-10">
              <h3 className="font-display text-2xl font-bold">Bienestar</h3>
              <p className="mt-2 text-loza-600 leading-relaxed">Para comer con atención, con un enfoque neutral al peso. Sin metas de peso, sin alimentos prohibidos y sin alertas rojas.</p>
              <ul className="mt-4 space-y-2 text-loza-700 list-disc pl-5 marker:text-hoja-500">
                <li>Rango de energía flexible o Modo Intuitivo</li>
                <li>Método del Plato y recetas</li>
                <li>Lecturas breves sobre hambre física y emocional</li>
              </ul>
            </article>
            <article className="py-8 md:pl-10 border-t md:border-t-0 md:border-l border-loza-200">
              <h3 className="font-display text-2xl font-bold">Modo Sport</h3>
              <p className="mt-2 text-loza-600 leading-relaxed">Para deportistas mayores de 18 que quieren bajar de peso, subir masa muscular o rendir mejor, con un ritmo seguro.</p>
              <ul className="mt-4 space-y-2 text-loza-700 list-disc pl-5 marker:text-agua-500">
                <li>Plan de energía, proteínas, carbohidratos, grasas y agua</li>
                <li>Seguimiento de peso con promedio semanal</li>
                <li>Nunca baja de tu gasto en reposo y avisa si vas demasiado rápido</li>
              </ul>
            </article>
          </div>
        </section>

        <PricingSection />

        <section id="solicitar" className="bg-agua-900 text-agua-50 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-start">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">Pedí acceso a NetAI</h2>
              <p className="mt-4 text-lg text-agua-100 leading-relaxed max-w-xl">NetAI está en beta cerrada. Dejanos tus datos y te mandamos por correo tu código de acceso y cómo instalarla.</p>
              <ul className="mt-6 space-y-2 text-agua-100 list-disc pl-5 marker:text-agua-300">
                <li>Te respondemos personalmente, sin listas de difusión.</li>
                <li>Funciona en Android y en iPhone.</li>
              </ul>
            </div>
            <RequestForm />
          </div>
        </section>
      </main>

      <footer className="bg-loza-50 border-t border-loza-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-[1fr_1.6fr] gap-8">
          <div>
            <Logo size="sm" />
            <p className="mt-3 text-[15px] text-loza-600">Comer con calma y moverte a tu ritmo.</p>
          </div>
          <p className="text-[15px] text-loza-600 leading-relaxed">
            Información educativa. No sustituye la consulta ni la indicación de un profesional de la salud matriculado. Si tu relación con la comida o el ejercicio te genera malestar, consultá con un profesional.
          </p>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-loza-200 flex flex-wrap justify-between gap-3 text-sm text-loza-600">
          <p>© {new Date().getFullYear()} NetAI</p>
          <nav aria-label="Legal" className="flex gap-5">
            <Link href="/privacidad" className="underline underline-offset-4 hover:text-loza-900">Privacidad</Link>
            <Link href="/terminos" className="underline underline-offset-4 hover:text-loza-900">Términos de uso</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
