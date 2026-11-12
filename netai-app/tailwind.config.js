/** @type {import('tailwindcss').Config} */

// Sistema de diseño NetAI: los colores salen de los grupos del Método del Plato.
// hoja = vegetales (marca), remolacha = proteínas, trigo = cereales, agua = hidratación.
// loza = neutros con un leve tinte verde, como un plato de cerámica.
// hoja-900 (#14412C) y el gris #B5B8BA son los colores del logo oficial.
// Cada color apunta a una variable CSS (definidas en src/app/globals.css) para poder cambiar de tema.
const scale = (name) => Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((k) => [k, `rgb(var(--${name}-${k}) / <alpha-value>)`])
);
const hoja = scale('hoja');
const remolacha = scale('remolacha');
const trigo = scale('trigo');
const agua = scale('agua');
const loza = scale('loza');

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hoja, remolacha, trigo, agua, loza,
        papel: 'rgb(var(--papel) / <alpha-value>)', // superficie de tarjetas: blanco en claro, verde muy oscuro en oscuro
        // Nombres anteriores, apuntando a la nueva paleta para que todo el proyecto la herede
        sage: hoja,
        earth: trigo,
        ocean: agua,
        lavender: remolacha,
        stonecalm: loza,
        stone: loza,
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        display: ['"Bricolage Grotesque Variable"', '"Bricolage Grotesque"', '"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
        marca: ['Outfit', '"Bricolage Grotesque Variable"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 26, 21, 0.05), 0 4px 16px -6px rgba(15, 26, 21, 0.10)',
        card: '0 2px 4px rgba(15, 26, 21, 0.04), 0 16px 32px -16px rgba(15, 26, 21, 0.22)',
        glass: '0 8px 32px -12px rgba(15, 26, 21, 0.18)',
        sheet: '0 -12px 40px -12px rgba(15, 26, 21, 0.28)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-gentle': 'pulseGentle 3s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseGentle: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.85' } },
      },
    },
  },
  plugins: [],
};
