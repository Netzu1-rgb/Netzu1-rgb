// Tipografías servidas desde el propio sitio (sin pedidos a terceros y disponibles sin conexión)
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/400-italic.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource-variable/bricolage-grotesque/wght.css';
import '@fontsource/outfit/700.css';
import './globals.css';
import InstallPrompt from '@/components/pwa/InstallPrompt';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'NetAI · Nutrición consciente, sin dietas ni culpa',
  description: 'Comé con calma: Método del Plato, escala de hambre y saciedad y Modo Intuitivo para registrar sin ver números. Basada en las guías alimentarias argentinas.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-512.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'NetAI',
    title: 'NetAI · Comé con calma, sin dietas ni culpa',
    description: 'Armá tu plato y escuchá tu hambre, con rangos flexibles o sin ver un solo número.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'NetAI: el plato del Método del Plato' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NetAI · Comé con calma, sin dietas ni culpa',
    description: 'Armá tu plato y escuchá tu hambre, con rangos flexibles o sin ver un solo número.',
    images: ['/og.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#14412C',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NetAI" />
      </head>
      <body className="bg-loza-50 text-loza-900 antialiased selection:bg-hoja-200 selection:text-hoja-900 min-h-screen">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
