// Identidad de NetAI: el Método del Plato visto desde arriba.
// Mitad vegetales y frutas (hoja), un cuarto proteínas (remolacha) y un cuarto cereales (trigo).

export const PLATE_TONES = {
  vegetables: { dot: 'bg-hoja-500', fill: '#378058' },
  protein: { dot: 'bg-remolacha-600', fill: '#93385A' },
  carbs: { dot: 'bg-trigo-400', fill: '#D9A232' },
};

// Marca compacta para encabezados
export function PlateMark({ className = '' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="#17352A" />
      <path d="M20 6 A14 14 0 0 1 20 34 Z" fill="#529A77" />
      <path d="M20 20 L20 34 A14 14 0 0 1 6 20 Z" fill="#C6627F" />
      <path d="M20 20 L6 20 A14 14 0 0 1 20 6 Z" fill="#E5BB58" />
    </svg>
  );
}

// Plato grande. tone="light" sobre fondos claros, tone="dark" sobre el verde de marca.
export function PlateGraphic({ className = '', tone = 'light', decorative = false }) {
  const rim = tone === 'dark' ? { outer: '#1E4535', inner: '#255640', stroke: 'none', cut: '#17352A' } : { outer: '#FFFFFF', inner: '#EDF1EC', stroke: '#DCE4DD', cut: '#FFFFFF' };
  const fills = tone === 'dark'
    ? { veg: '#529A77', pro: '#C6627F', carb: '#E5BB58' }
    : { veg: PLATE_TONES.vegetables.fill, pro: PLATE_TONES.protein.fill, carb: PLATE_TONES.carbs.fill };
  const a11y = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': 'Plato dividido: mitad vegetales y frutas, un cuarto proteínas, un cuarto cereales' };
  return (
    <svg viewBox="0 0 200 200" className={className} {...a11y}>
      <circle cx="100" cy="100" r="96" fill={rim.outer} stroke={rim.stroke} strokeWidth="2" />
      <circle cx="100" cy="100" r="80" fill={rim.inner} />
      <path d="M100 26 A74 74 0 0 1 100 174 Z" fill={fills.veg} />
      <path d="M100 100 L100 174 A74 74 0 0 1 26 100 Z" fill={fills.pro} />
      <path d="M100 100 L26 100 A74 74 0 0 1 100 26 Z" fill={fills.carb} />
      <line x1="100" y1="24" x2="100" y2="176" stroke={rim.cut} strokeWidth="3" />
      <line x1="24" y1="100" x2="100" y2="100" stroke={rim.cut} strokeWidth="3" />
    </svg>
  );
}
