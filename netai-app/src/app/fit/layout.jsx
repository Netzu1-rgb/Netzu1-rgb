// NetAI Fit: app de entrenamiento, aparte de NetAI. Es privada: no se indexa en buscadores.
export const metadata = {
  title: 'NetAI Fit',
  description: 'Rutinas, registro de cargas y progreso, conectado con NetAI.',
  manifest: '/fit.webmanifest',
  robots: { index: false, follow: false },
  icons: { icon: '/icons/fit-192.png', apple: '/icons/fit-apple-touch.png' },
  appleWebApp: { title: 'NetAI Fit', capable: true },
};

export default function FitLayout({ children }) {
  return children;
}
