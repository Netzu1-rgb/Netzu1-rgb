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
  themeColor: '#4A6B53',
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
      <body className="bg-[#f8f7f4] text-[#1e2924] antialiased selection:bg-sage-200 selection:text-sage-900 min-h-screen">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
