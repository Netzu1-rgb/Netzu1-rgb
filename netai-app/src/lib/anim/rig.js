// Muñeco animado de NetAI Fit: un esqueleto 2D con articulaciones, animado por fotogramas clave.
// Es la misma idea que usan las animaciones por huesos (Lottie, Spine): cada fotograma dice dónde
// está la cadera, hacia dónde apunta el torso y hacia dónde apunta cada miembro (o qué punto tiene
// que tocar la mano o el pie), y entre fotogramas se interpola. Todo se dibuja con trazos simples.
//
// Ángulos en grados: 0 = hacia abajo, 90 = hacia adelante (derecha), 180 = hacia arriba, -90 = atrás.

export const LEN = { torso: 30, neck: 10, head: 6.5, upper: 15, fore: 14, thigh: 22, shin: 21, foot: 7 };
export const FLOOR = 108;

const rad = (a) => (a * Math.PI) / 180;
export const vec = (a, l) => [Math.sin(rad(a)) * l, Math.cos(rad(a)) * l];
export const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
export const angleOf = (dx, dy) => (Math.atan2(dx, dy) * 180) / Math.PI;
export const pivot = (c, a, l) => add(c, vec(a, l));

/** Dos huesos que tienen que llegar a un punto (cinemática inversa). bend elige hacia qué lado dobla la articulación del medio. */
export function ik2(root, target, l1, l2, bend = 1) {
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.001);
  const base = Math.atan2(dy, dx);
  const cosA = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d || 1)));
  const a = base + bend * Math.acos(cosA);
  const mid = [root[0] + Math.cos(a) * l1, root[1] + Math.sin(a) * l1];
  const da = Math.atan2(dy, dx);
  const end = [root[0] + Math.cos(da) * d, root[1] + Math.sin(da) * d];
  return [mid, end];
}

const lerp = (a, b, t) => a + (b - a) * t;
const lerpP = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
const ease = (t) => 0.5 - Math.cos(Math.PI * t) / 2;

function limb(spec, root, l1, l2, endLen) {
  let mid; let end;
  if (spec.ik) [mid, end] = ik2(root, spec.ik, l1, l2, spec.bend ?? 1);
  else { mid = pivot(root, spec.ang[0], l1); end = pivot(mid, spec.ang[1], l2); }
  const tip = endLen && spec.foot != null ? pivot(end, spec.foot, endLen) : null;
  return { root, mid, end, tip };
}

function mixLimb(a, b, t) {
  const out = { ...a };
  if (a.ik && b.ik) out.ik = lerpP(a.ik, b.ik, t);
  if (a.ang && b.ang) out.ang = [lerp(a.ang[0], b.ang[0], t), lerp(a.ang[1], b.ang[1], t)];
  if (a.foot != null && b.foot != null) out.foot = lerp(a.foot, b.foot, t);
  return out;
}

/** Mezcla dos fotogramas */
export function mixFrames(a, b, t) {
  return {
    hip: lerpP(a.hip, b.hip, t),
    torso: lerp(a.torso, b.torso, t),
    head: lerp(a.head || 0, b.head || 0, t),
    arch: lerp(a.arch || 0, b.arch || 0, t),
    k: lerp(a.k || 0, b.k || 0, t),
    legN: mixLimb(a.legN, b.legN, t),
    legF: mixLimb(a.legF, b.legF, t),
    armN: mixLimb(a.armN, b.armN, t),
    armF: mixLimb(a.armF, b.armF, t),
  };
}

/** Fotograma del momento `phase` (0 a 1) del ciclo */
export function frameAt(def, phase) {
  const fr = def.frames;
  if (fr.length === 1) return fr[0];
  if (def.mode === 'loop') {
    const x = phase * fr.length;
    const i = Math.floor(x) % fr.length;
    return mixFrames(fr[i], fr[(i + 1) % fr.length], ease(x - Math.floor(x)));
  }
  // ida y vuelta
  const span = fr.length - 1;
  const x = (phase < 0.5 ? phase * 2 : (1 - phase) * 2) * span;
  const i = Math.min(span - 1, Math.floor(x));
  return mixFrames(fr[i], fr[i + 1], ease(x - i));
}

/** Posiciones de todas las articulaciones */
export function solve(f, front = false) {
  const dir = vec(f.torso, 1);
  const perp = [dir[1], -dir[0]]; // perpendicular al torso (lado derecho de la pantalla en vista de frente)
  const hipW = front ? 5 : 0;
  const shW = front ? 8 : 0;
  const top = add(f.hip, vec(f.torso, LEN.torso));
  const head = pivot(top, f.torso + (f.head || 0), LEN.neck);
  const hipN = add(f.hip, [perp[0] * hipW, perp[1] * hipW]);
  const hipF = add(f.hip, [-perp[0] * hipW, -perp[1] * hipW]);
  const shN = add(top, [perp[0] * shW, perp[1] * shW]);
  const shF = add(top, [-perp[0] * shW, -perp[1] * shW]);
  return {
    hip: f.hip, top, head, dir, arch: f.arch || 0, k: f.k || 0,
    legN: limb(f.legN, hipN, LEN.thigh, LEN.shin, LEN.foot),
    legF: limb(f.legF, hipF, LEN.thigh, LEN.shin, LEN.foot),
    armN: limb(f.armN, shN, LEN.upper, LEN.fore),
    armF: limb(f.armF, shF, LEN.upper, LEN.fore),
  };
}

/** Punto de una articulación por nombre, para enganchar objetos (barra, mancuerna…) */
export function jointPoint(j, name) {
  switch (name) {
    case 'handN': return j.armN.end;
    case 'handF': return j.armF.end;
    case 'shoulder': return j.top;
    case 'hip': return j.hip;
    case 'ankleN': return j.legN.end;
    case 'ankleF': return j.legF.end;
    case 'toeN': return j.legN.tip || j.legN.end;
    case 'head': return j.head;
    default: return [0, 0];
  }
}

const r1 = (n) => Math.round(n * 10) / 10;
const pts = (...p) => p.map((q) => `${r1(q[0])},${r1(q[1])}`).join(' ');

/**
 * Formas a dibujar para un momento del ciclo: [{ tag, attrs }].
 * Se usa igual en la app (React) y para generar imágenes de control.
 */
export function shapes(def, phase) {
  const front = def.view === 'front';
  const f = frameAt(def, phase);
  const j = solve(f, front);
  const out = [];
  const S = 'currentColor';
  const line = (a, b, w, op = 1, extra = {}) => out.push({ tag: 'line', attrs: { x1: r1(a[0]), y1: r1(a[1]), x2: r1(b[0]), y2: r1(b[1]), stroke: S, strokeWidth: w, strokeLinecap: 'round', opacity: op, ...extra } });
  const poly = (p, w, op = 1) => out.push({ tag: 'polyline', attrs: { points: pts(...p), fill: 'none', stroke: S, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round', opacity: op } });
  const circle = (c, r, attrs = {}) => out.push({ tag: 'circle', attrs: { cx: r1(c[0]), cy: r1(c[1]), r, ...attrs } });
  const at = (p) => (typeof p === 'string' ? jointPoint(j, p) : p);

  // Suelo y sombra
  if (def.floor !== false) {
    out.push({ tag: 'line', attrs: { x1: -40, y1: FLOOR + 3, x2: 160, y2: FLOOR + 3, stroke: S, strokeWidth: 1.2, opacity: 0.18 } });
  }

  const props = def.props || [];
  const drawProp = (p) => {
    const o = { opacity: 0.55 };
    switch (p.t) {
      case 'bench': // banco o camilla: tapa y patas
        out.push({ tag: 'rect', attrs: { x: p.x1, y: p.y, width: p.x2 - p.x1, height: 5, rx: 2.5, fill: S, opacity: 0.22 } });
        if (p.legs !== false) [p.x1 + 4, p.x2 - 4].forEach((x) => line([x, p.y + 4], [x, FLOOR + 2], 2.2, 0.22));
        break;
      case 'box':
        out.push({ tag: 'rect', attrs: { x: p.x1, y: p.y, width: p.x2 - p.x1, height: FLOOR + 3 - p.y, rx: 3, fill: S, opacity: 0.16 } });
        break;
      case 'wall':
        out.push({ tag: 'rect', attrs: { x: p.x - 4, y: 0, width: 4, height: FLOOR + 3, fill: S, opacity: 0.2 } });
        break;
      case 'pad': // respaldo o almohadilla recta
        line(p.from, p.to, p.w || 5, 0.24);
        break;
      case 'post':
        line([p.x, p.y], [p.x, FLOOR + 2], 2.2, 0.22);
        break;
      case 'bar': // barra fija o paralelas
        line([p.x1, p.y], [p.x2, p.y], 3, 0.5);
        if (p.posts) [p.x1, p.x2].forEach((x) => line([x, p.y], [x, FLOOR + 2], 2, 0.22));
        if (p.hang) [p.x1, p.x2].forEach((x) => line([x, p.y], [x, -20], 2, 0.22));
        break;
      case 'cable': {
        const a = at(p.on);
        line(a, p.to, 1.1, 0.5);
        circle(p.to, 2.6, { fill: 'none', stroke: S, strokeWidth: 1.4, opacity: 0.5 });
        break;
      }
      case 'band': line(at(p.from), at(p.to), 1.6, 0.6); break;
      case 'treadmill':
        line(p.from, p.to, 4, 0.3);
        line([p.to[0] - 6, p.to[1]], [p.to[0] - 2, p.to[1] - 40], 2.2, 0.25);
        break;
      default: break;
    }
    void o;
  };
  const drawHeld = (p) => {
    const c = p.on ? add(at(p.on), [p.dx || 0, p.dy || 0]) : [0, 0];
    switch (p.t) {
      case 'plate': // disco de la barra visto de costado
        circle(c, p.r || 8.5, { fill: 'none', stroke: S, strokeWidth: 3, opacity: 0.9 });
        circle(c, 1.6, { fill: S, opacity: 0.9 });
        break;
      case 'db': // mancuerna vista de punta
        circle(c, p.r || 4.2, { fill: S, opacity: 0.9 });
        break;
      case 'dbs': // mancuerna vista de costado (vista de frente)
        out.push({ tag: 'rect', attrs: { x: r1(c[0] - 2.5), y: r1(c[1] - 6), width: 5, height: 12, rx: 2, fill: S, opacity: 0.9 } });
        break;
      case 'kb': // pesa rusa
        circle(add(c, [0, 5]), 5.5, { fill: S, opacity: 0.9 });
        out.push({ tag: 'path', attrs: { d: `M${r1(c[0] - 3)},${r1(c[1] + 2)} Q${r1(c[0])},${r1(c[1] - 4)} ${r1(c[0] + 3)},${r1(c[1] + 2)}`, fill: 'none', stroke: S, strokeWidth: 1.8, opacity: 0.9 } });
        break;
      case 'handle': line(add(c, [-(p.w || 10) / 2, 0]), add(c, [(p.w || 10) / 2, 0]), 2.4, 0.85); break;
      case 'sled': { // plataforma de la prensa, perpendicular a la pierna
        const d = vec((p.angle || 0) + 90, 9);
        line(add(c, d), add(c, [-d[0], -d[1]]), 3.5, 0.5);
        break;
      }
      case 'roller': circle(c, 3.6, { fill: 'none', stroke: S, strokeWidth: 2, opacity: 0.6 }); break;
      case 'rope': { // soga de saltar: pasa por arriba de la cabeza y por debajo de los pies
        const a = j.armN.end; const b = j.armF.end;
        const cy = -14 + (FLOOR + 22) * j.k;
        const cx = (a[0] + b[0]) / 2 + 6;
        out.push({ tag: 'path', attrs: { d: `M${r1(a[0])},${r1(a[1])} Q${r1(cx)},${r1(cy)} ${r1(b[0])},${r1(b[1])}`, fill: 'none', stroke: S, strokeWidth: 1.3, opacity: 0.7 } });
        break;
      }
      case 'waves': { // sogas de batalla
        [j.armN.end, j.armF.end].forEach((h, i) => {
          const mx = (h[0] + p.to[0]) / 2; const my = (h[1] + p.to[1]) / 2 + (i ? -1 : 1) * (8 - 16 * j.k);
          out.push({ tag: 'path', attrs: { d: `M${r1(h[0])},${r1(h[1])} Q${r1(mx)},${r1(my)} ${r1(p.to[0])},${r1(p.to[1])}`, fill: 'none', stroke: S, strokeWidth: 2, opacity: i ? 0.35 : 0.7 } });
        });
        break;
      }
      default: break;
    }
  };

  props.filter((p) => !p.on && p.t !== 'rope' && p.t !== 'waves').forEach(drawProp);

  const far = front ? 0.85 : 0.4;
  const W = { limb: 6.2, torso: front ? 11 : 9 };
  const leg = (l, op) => { poly([l.root, l.mid, l.end], W.limb, op); if (l.tip) line(l.end, l.tip, W.limb - 1.6, op); };
  const arm = (a, op) => poly([a.root, a.mid, a.end], W.limb - 0.6, op);

  // Lo que está del lado de atrás primero
  props.filter((p) => p.on && p.behind).forEach(drawHeld);
  leg(j.legF, far);
  arm(j.armF, far);
  props.filter((p) => p.on && p.side === 'F' && !p.behind).forEach(drawHeld);

  // Torso: en vista de costado puede curvarse (gato y vaca)
  if (front) {
    line(j.hip, j.top, W.torso);
    line(j.armN.root, j.armF.root, 5.5);
    line(j.legN.root, j.legF.root, 5.5);
  } else if (j.arch) {
    const mid = lerpP(j.hip, j.top, 0.5);
    const c = add(mid, [j.dir[1] * j.arch, -j.dir[0] * j.arch]);
    out.push({ tag: 'path', attrs: { d: `M${r1(j.hip[0])},${r1(j.hip[1])} Q${r1(c[0])},${r1(c[1])} ${r1(j.top[0])},${r1(j.top[1])}`, fill: 'none', stroke: S, strokeWidth: W.torso, strokeLinecap: 'round' } });
  } else line(j.hip, j.top, W.torso);
  circle(j.head, LEN.head, { fill: S });

  leg(j.legN, 1);
  arm(j.armN, 1);
  props.filter((p) => p.on && p.side !== 'F' && !p.behind).forEach(drawHeld);
  props.filter((p) => p.t === 'rope' || p.t === 'waves').forEach(drawHeld);
  return out;
}

export const DEFAULT_VIEWBOX = '0 0 120 120';
