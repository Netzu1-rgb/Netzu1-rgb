// Logo oficial de NetAI: hoja dentro de un recuadro gris, sobre verde.
// Colores tomados del logo original: verde #14412C y gris #B5B8BA.

export const MARCA = { verde: '#14412C', gris: '#B5B8BA' };

const LEAF = [
  'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z',
  'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
];

// Solo el ícono (recuadro con la hoja)
export function LogoMark({ className = '', title }) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true };
  return (
    <svg viewBox="0 0 40 40" className={className} {...a11y}>
      <rect width="40" height="40" rx="9" fill={MARCA.gris} />
      <g transform="translate(5 5) scale(1.25)" fill="none" stroke={MARCA.verde} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        {LEAF.map((d) => <path key={d} d={d} />)}
      </g>
    </svg>
  );
}

// Ícono más la palabra NetAI. tone="dark" sobre el verde de marca, tone="light" sobre fondos claros.
export function Logo({ tone = 'light', size = 'md', className = '' }) {
  const sizes = {
    sm: { mark: 'w-8 h-8', text: 'text-xl', gap: 'gap-2.5' },
    md: { mark: 'w-10 h-10', text: 'text-2xl', gap: 'gap-3' },
    lg: { mark: 'w-24 h-24', text: 'text-6xl', gap: 'gap-6' },
  }[size];
  const vertical = size === 'lg';
  return (
    <span className={`inline-flex ${vertical ? 'flex-col items-center' : 'items-center'} ${sizes.gap} ${className}`}>
      <LogoMark className={`${sizes.mark} shrink-0 ${vertical ? 'shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)] rounded-[22%]' : ''}`} />
      <span
        className={`font-marca font-bold tracking-tight leading-none ${sizes.text}`}
        style={{ color: tone === 'dark' ? MARCA.gris : MARCA.verde }}
      >
        NetAI
      </span>
    </span>
  );
}
