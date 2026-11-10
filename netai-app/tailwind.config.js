/** @type {import('tailwindcss').Config} */

// Sistema de diseño NetAI: los colores salen de los grupos del Método del Plato.
// hoja = vegetales (marca), remolacha = proteínas, trigo = cereales, agua = hidratación.
// loza = neutros con un leve tinte verde, como un plato de cerámica.
// hoja-900 (#14412C) y el gris #B5B8BA son los colores del logo oficial.
const hoja = {
  50: '#EEF6F1', 100: '#D7EADF', 200: '#B0D4C0', 300: '#80B89B', 400: '#529A77',
  500: '#378058', 600: '#2D6A4F', 700: '#255640', 800: '#1E4535', 900: '#14412C', 950: '#0C2A1C',
};
const remolacha = {
  50: '#FBF0F3', 100: '#F5DCE3', 200: '#EBB8C7', 300: '#DC8CA4', 400: '#C6627F',
  500: '#AD4566', 600: '#93385A', 700: '#782D49', 800: '#5F243A', 900: '#4A1D2E', 950: '#2E111C',
};
const trigo = {
  50: '#FCF7EA', 100: '#F7EBC9', 200: '#EFD592', 300: '#E5BB58', 400: '#D9A232',
  500: '#C1871D', 600: '#9E6B16', 700: '#7C5315', 800: '#5F4114', 900: '#4A3312', 950: '#2B1D09',
};
const agua = {
  50: '#EEF5FA', 100: '#D8E8F3', 200: '#B0D0E7', 300: '#7DB1D5', 400: '#4E91BF',
  500: '#3478A8', 600: '#2C6390', 700: '#255076', 800: '#1F415F', 900: '#19344C', 950: '#0F2131',
};
const loza = {
  50: '#F6F8F4', 100: '#EDF1EC', 200: '#DCE4DD', 300: '#C3CEC5', 400: '#97A69C',
  500: '#5F7066', 600: '#4F6056', 700: '#3D4C44', 800: '#2A3831', 900: '#1A2A23', 950: '#0F1A15',
};

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
        display: ['"Bricolage Grotesque"', '"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
        marca: ['Outfit', '"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
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
