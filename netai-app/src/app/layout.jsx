import './globals.css';
import InstallPrompt from '@/components/pwa/InstallPrompt';

export const metadata = {
  title: 'NetAI • Nutrición Consciente & Bienestar Diario',
  description: 'Plataforma de alimentación intuitiva, balance de energía y registro consciente sin obsesiones ni dietas restrictivas.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2D6A4F',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&display=swap"
        />
      </head>
      <body className="bg-loza-50 text-loza-900 antialiased selection:bg-hoja-200 selection:text-hoja-900 min-h-screen">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
