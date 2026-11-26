# Builds the TRUEVENTO logo as a vector SVG (text converted to paths from the Outfit font).
#
# Usage (needs Python 3 and fontTools: pip install fonttools brotli):
#   python3 scripts/logo/make_logo.py public/logo-truevento.svg
#
# Python because fontTools can set the weight of the Outfit variable font; the Node font
# libraries cannot do it with this .woff2 file.
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONT = Path(__file__).resolve().parents[3] / 'truevento-alumnos/public/fonts/outfit-latin.woff2'

def text_path(text, weight, size, x, baseline, spacing, skew=0.0, center=None):
    f = instantiateVariableFont(TTFont(FONT), {'wght': weight})
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    s = size / upm
    names = [cmap[ord(ch)] for ch in text]
    widths = [f['hmtx'][n][0] * s for n in names]
    total = sum(widths) + spacing * (len(text) - 1)
    if center is not None:
        x = center - total / 2
    out = []
    cx = x
    for n, w in zip(names, widths):
        pen = SVGPathPen(gs, ntos=lambda v: f'{v:.2f}')
        # font units -> svg: scale, flip y, move to baseline; skew for italics
        tp = TransformPen(pen, (s, 0, -s * skew, -s, cx, baseline))
        gs[n].draw(tp)
        d = pen.getCommands()
        if d: out.append(d)
        cx += w + spacing
    return ' '.join(out)

title = text_path('TRUEVENTO', 820, 16.6, 0, 125.4, 1.75, center=101.5)
sub = text_path('kiteschool', 380, 8.0, 0, 137.8, 3.55, skew=0.22, center=101.5)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 203 203" role="img" aria-label="TRUEVENTO kiteschool">
  <defs>
    <linearGradient id="tv-ring" x1="28" y1="40" x2="175" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#4a72f5"/><stop offset=".45" stop-color="#8a3fe6"/><stop offset=".75" stop-color="#c63fb6"/><stop offset="1" stop-color="#ee4a7c"/>
    </linearGradient>
    <linearGradient id="tv-icon" x1="70" y1="0" x2="135" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#4f73f2"/><stop offset=".5" stop-color="#7d4bec"/><stop offset=".78" stop-color="#b146d6"/><stop offset="1" stop-color="#ef4a7d"/>
    </linearGradient>
    <linearGradient id="tv-text" x1="43" y1="0" x2="161" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#4a72f5"/><stop offset=".45" stop-color="#7a45ea"/><stop offset=".7" stop-color="#b43fcf"/><stop offset="1" stop-color="#ee4a7c"/>
    </linearGradient>
  </defs>
  <circle cx="101.5" cy="101.5" r="101.5" fill="#000"/>
  <circle cx="101.5" cy="101.5" r="73" fill="none" stroke="url(#tv-ring)" stroke-width="2"/>
  <g fill="none" stroke="url(#tv-icon)" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M96.6 59.6 A7.8 7.8 0 0 0 89.9 74.6"/>
    <path d="M117.4 76.6 A10 10 0 1 0 109 90 L134.4 90"/>
    <path d="M88.4 92.2 A9 9 0 1 0 79.5 101.5 L124.8 101.5"/>
  </g>
  <path fill="url(#tv-text)" d="{title}"/>
  <path fill="#e8e6f0" d="{sub}"/>
</svg>
'''
open(sys.argv[1], 'w').write(svg)
print(len(svg))
