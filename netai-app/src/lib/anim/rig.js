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
  // El momento siempre queda dentro del ciclo, aunque llegue un valor negativo o mayor que 1
  phase = Number.isFinite(phase) ? ((phase % 1) + 1) % 1 : 0;
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
const P = (q) => `${r1(q[0])},${r1(q[1])}`;

// Colores del maniquí: variables definidas en globals.css, con valores para tema claro y oscuro
const C = {
  skin: 'var(--fig-skin)', skinF: 'var(--fig-skin-far)',
  shirt: 'var(--fig-shirt)', shirtF: 'var(--fig-shirt-far)',
  shorts: 'var(--fig-shorts)', shortsF: 'var(--fig-shorts-far)',
  shoe: 'var(--fig-shoe)', hair: 'var(--fig-hair)',
  focus: 'var(--fig-focus)', focusF: 'var(--fig-focus-far)',
  prop: 'var(--fig-prop)', ghost: 'var(--fig-ghost)',
};

// Qué parte del cuerpo se resalta según la zona del ejercicio
export const FOCUS_BY_ZONE = {
  Piernas: ['thigh'], Glúteos: ['glute'], Pecho: ['chest'], Espalda: ['chest'], Hombros: ['shoulder'],
  Brazos: ['upperArm'], Abdomen: ['abs'], Cardio: [], Movilidad: [],
};

/**
 * Formas a dibujar para un momento del ciclo: [{ tag, attrs }].
 * opts.focus: partes a resaltar. opts.ghost: dibuja de fondo la posición inicial (para la figura quieta).
 */
export function shapes(def, phase, opts = {}) {
  const front = def.view === 'front';
  const focus = def.focus || opts.focus || [];
  const j = solve(frameAt(def, phase), front);
  const out = [];
  const push = (tag, attrs, fill, extra = {}) => out.push({ tag, attrs: { ...attrs, style: { fill, ...extra } } });
  const circle = (c, r, fill, extra) => push('circle', { cx: r1(c[0]), cy: r1(c[1]), r: r1(r) }, fill, extra);
  // Segmento con volumen: una cápsula que puede afinarse de un extremo al otro
  const seg = (p, q, ra, rb, fill, extra) => {
    const dx = q[0] - p[0]; const dy = q[1] - p[1]; const d = Math.hypot(dx, dy);
    if (d < 0.5) { circle(p, Math.max(ra, rb), fill, extra); return; }
    const n = [-dy / d, dx / d];
    const p1 = [p[0] + n[0] * ra, p[1] + n[1] * ra]; const p2 = [q[0] + n[0] * rb, q[1] + n[1] * rb];
    const p3 = [q[0] - n[0] * rb, q[1] - n[1] * rb]; const p4 = [p[0] - n[0] * ra, p[1] - n[1] * ra];
    push('path', { d: `M${P(p1)} L${P(p2)} A${r1(rb)},${r1(rb)} 0 0 0 ${P(p3)} L${P(p4)} A${r1(ra)},${r1(ra)} 0 0 0 ${P(p1)} Z` }, fill, extra);
  };
  const stroke = (d, color, w, op = 1) => out.push({ tag: 'path', attrs: { d, style: { fill: 'none', stroke: color, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round', opacity: op } } });
  const line = (p, q, color, w, op = 1) => stroke(`M${P(p)} L${P(q)}`, color, w, op);
  const mix = (p, q, t) => lerpP(p, q, t);
  const at = (jj, name) => (typeof name === 'string' ? jointPoint(jj, name) : name);

  // ---------------------------------------------------------------- cuerpo
  const drawBody = (jj, mono) => {
    const col = (near, far, isFar) => mono || (isFar ? far : near);
    const has = (part) => !mono && focus.includes(part);
    const leg = (l, isFar) => {
      const knee = l.mid; const cut = mix(l.root, knee, 0.4);
      seg(l.root, knee, 5, 3.9, col(has('thigh') ? C.focus : C.skin, has('thigh') ? C.focusF : C.skinF, isFar));
      seg(l.root, cut, 5.7, 5.2, col(has('glute') ? C.focus : C.shorts, has('glute') ? C.focusF : C.shortsF, isFar));
      seg(knee, l.end, 3.8, 2.6, col(has('shin') ? C.focus : C.skin, has('shin') ? C.focusF : C.skinF, isFar));
      if (l.tip) seg(l.end, l.tip, 3, 2.3, col(C.shoe, C.shoe, isFar)); else circle(l.end, 3, col(C.shoe, C.shoe, isFar));
    };
    const arm = (a, isFar) => {
      const cut = mix(a.root, a.mid, 0.48);
      seg(a.root, a.mid, 3.6, 2.9, col(has('upperArm') ? C.focus : C.skin, has('upperArm') ? C.focusF : C.skinF, isFar));
      seg(a.root, cut, 4, 3.5, col(C.shirt, C.shirtF, isFar));
      seg(a.mid, a.end, 2.9, 2.2, col(has('forearm') ? C.focus : C.skin, has('forearm') ? C.focusF : C.skinF, isFar));
      circle(a.end, 2.6, col(C.skin, C.skinF, isFar));
      if (has('shoulder')) circle(a.root, 4.4, isFar ? C.focusF : C.focus);
    };
    const chest = [-jj.dir[1], jj.dir[0]]; // hacia dónde mira el pecho
    const head = () => {
      seg(jj.top, mix(jj.top, jj.head, 0.55), 2.7, 2.5, mono || C.skin);
      circle(jj.head, 6.4, mono || C.skin);
      if (mono) return;
      // Pelo: media cabeza del lado de atrás y arriba (o solo arriba, de frente)
      const h = front ? jj.dir : [jj.dir[0] * 0.75 - chest[0] * 0.66, jj.dir[1] * 0.75 - chest[1] * 0.66];
      const hl = Math.hypot(h[0], h[1]) || 1; const u = [h[0] / hl, h[1] / hl]; const t = [-u[1], u[0]];
      const R = 6.9; const c = [jj.head[0] + u[0] * 0.6, jj.head[1] + u[1] * 0.6];
      const e1 = [c[0] + t[0] * R, c[1] + t[1] * R]; const e2 = [c[0] - t[0] * R, c[1] - t[1] * R];
      push('path', { d: `M${P(e1)} A${R},${R} 0 0 0 ${P(e2)} Z` }, C.hair);
    };
    const torso = () => {
      if (front) {
        const d = `M${P(jj.armN.root)} L${P(jj.armF.root)} L${P(jj.legF.root)} L${P(jj.legN.root)} Z`;
        out.push({ tag: 'path', attrs: { d, style: { fill: mono || C.shirt, stroke: mono || C.shirt, strokeWidth: 7, strokeLinejoin: 'round' } } });
        if (has('chest')) seg(mix(jj.hip, jj.top, 0.62), mix(jj.hip, jj.top, 0.92), 7.5, 8.5, C.focus);
        if (has('abs')) seg(mix(jj.hip, jj.top, 0.12), mix(jj.hip, jj.top, 0.5), 5.5, 6, C.focus);
        const dh = `M${P(jj.legN.root)} L${P(jj.legF.root)}`;
        out.push({ tag: 'path', attrs: { d: dh, style: { fill: 'none', stroke: mono || C.shorts, strokeWidth: 11.5, strokeLinecap: 'round' } } });
        if (has('glute')) circle(jj.hip, 5, C.focus);
        return;
      }
      if (jj.arch) {
        const m = mix(jj.hip, jj.top, 0.5);
        const cpt = [m[0] + jj.dir[1] * jj.arch, m[1] - jj.dir[0] * jj.arch];
        stroke(`M${P(jj.hip)} Q${P(cpt)} ${P(jj.top)}`, mono || C.shirt, 12.6);
      } else {
        seg(jj.hip, jj.top, 6.2, 6.9, mono || C.shirt);
        if (has('chest')) seg(mix(jj.hip, jj.top, 0.5), mix(jj.hip, jj.top, 0.96), 6.3, 6.9, C.focus);
        if (has('abs')) seg(mix(jj.hip, jj.top, 0.1), mix(jj.hip, jj.top, 0.52), 6.2, 6.5, C.focus);
      }
      circle(jj.hip, 6.4, mono || (has('glute') ? C.focus : C.shorts));
    };
    if (front) { leg(jj.legF, false); leg(jj.legN, false); torso(); arm(jj.armF, false); arm(jj.armN, false); head(); return; }
    arm(jj.armF, true); leg(jj.legF, true); torso(); head(); leg(jj.legN, false); arm(jj.armN, false);
  };

  // ---------------------------------------------------------------- suelo y objetos fijos
  if (def.floor !== false) line([-60, FLOOR - 0.3], [180, FLOOR - 0.3], C.prop, 1.4, 0.35);
  const props = def.props || [];
  const fixedProp = (p) => {
    switch (p.t) {
      case 'bench':
        push('rect', { x: p.x1, y: p.y, width: p.x2 - p.x1, height: 5.5, rx: 2.7 }, C.prop, { opacity: 0.55 });
        if (p.legs !== false) [p.x1 + 5, p.x2 - 5].forEach((x) => line([x, p.y + 5], [x, FLOOR - 1], C.prop, 2.6, 0.4));
        break;
      case 'box': push('rect', { x: p.x1, y: p.y, width: p.x2 - p.x1, height: FLOOR - 1 - p.y, rx: 3 }, C.prop, { opacity: 0.4 }); break;
      case 'wall': push('rect', { x: p.x - 5, y: -30, width: 5, height: FLOOR + 29 }, C.prop, { opacity: 0.4 }); break;
      case 'pad': line(p.from, p.to, C.prop, p.w || 5.5, 0.5); break;
      case 'post': line([p.x, p.y], [p.x, FLOOR - 1], C.prop, 2.6, 0.4); break;
      case 'bar':
        if (p.posts) [p.x1, p.x2].forEach((x) => line([x, p.y], [x, FLOOR - 1], C.prop, 2.4, 0.4));
        if (p.hang) [p.x1, p.x2].forEach((x) => line([x, p.y], [x, -30], C.prop, 2.4, 0.4));
        line([p.x1, p.y], [p.x2, p.y], C.prop, 3.4, 0.9);
        break;
      case 'treadmill':
        line(p.from, p.to, C.prop, 4.5, 0.55);
        line([p.to[0] - 6, p.to[1]], [p.to[0] - 1, p.to[1] - 42], C.prop, 2.6, 0.45);
        line([p.to[0] - 1, p.to[1] - 42], [p.to[0] - 12, p.to[1] - 44], C.prop, 2.6, 0.45);
        break;
      default: break;
    }
  };
  const heldProp = (p, jj) => {
    const c = p.on ? add(at(jj, p.on), [p.dx || 0, p.dy || 0]) : [0, 0];
    switch (p.t) {
      case 'plate': { // barra con discos, vista de punta
        const r = p.r || 8.5;
        circle(c, r, C.shorts); circle(c, r - 2.6, C.prop, { opacity: 0.55 }); circle(c, 1.8, C.shoe);
        break;
      }
      case 'db': circle(c, p.r || 4.4, C.shorts); circle(c, 1.6, C.prop); break; // mancuerna vista de punta
      case 'dbs': // mancuerna vista de costado
        push('rect', { x: r1(c[0] - 1.2), y: r1(c[1] - 6.5), width: 2.4, height: 13, rx: 1 }, C.prop);
        push('rect', { x: r1(c[0] - 3.2), y: r1(c[1] - 7.5), width: 6.4, height: 4, rx: 1.4 }, C.shorts);
        push('rect', { x: r1(c[0] - 3.2), y: r1(c[1] + 3.5), width: 6.4, height: 4, rx: 1.4 }, C.shorts);
        break;
      case 'kb': // pesa rusa
        stroke(`M${r1(c[0] - 3.2)},${r1(c[1] + 3)} Q${r1(c[0])},${r1(c[1] - 5)} ${r1(c[0] + 3.2)},${r1(c[1] + 3)}`, C.shorts, 2.2);
        circle(add(c, [0, 6]), 5.8, C.shorts);
        break;
      case 'handle': line(add(c, [-(p.w || 10) / 2, 0]), add(c, [(p.w || 10) / 2, 0]), C.shoe, 2.8); break;
      case 'sled': { const d = vec((p.angle || 0) + 90, 10); line(add(c, d), add(c, [-d[0], -d[1]]), C.prop, 4, 0.8); break; }
      case 'roller': circle(c, 3.8, C.prop); break;
      case 'cable': { const a = at(jj, p.on); line(a, p.to, C.prop, 1.3, 0.8); circle(p.to, 3, C.prop, { opacity: 0.8 }); break; }
      case 'band': line(at(jj, p.from), at(jj, p.to), C.focus, 2); break;
      case 'rope': { // soga de saltar: pasa por arriba de la cabeza y por debajo de los pies
        const a = jj.armN.end; const b2 = jj.armF.end; const cy = -14 + (FLOOR + 22) * jj.k; const cx = (a[0] + b2[0]) / 2 + 6;
        stroke(`M${P(a)} Q${r1(cx)},${r1(cy)} ${P(b2)}`, C.prop, 1.5, 0.9);
        break;
      }
      case 'waves': // sogas de batalla
        [jj.armN.end, jj.armF.end].forEach((h, i) => {
          const mx = (h[0] + p.to[0]) / 2; const my = (h[1] + p.to[1]) / 2 + (i ? -1 : 1) * (8 - 16 * jj.k);
          stroke(`M${P(h)} Q${r1(mx)},${r1(my)} ${P(p.to)}`, C.prop, 2.4, i ? 0.5 : 0.9);
        });
        break;
      default: break;
    }
  };
  const FIXED = ['bench', 'box', 'wall', 'pad', 'post', 'bar', 'treadmill'];
  props.filter((p) => FIXED.includes(p.t)).forEach(fixedProp);

  // ---------------------------------------------------------------- posición inicial de fondo (figura quieta)
  if (opts.ghost) {
    const j0 = solve(frameAt(def, 0), front);
    const moved = Math.hypot(j0.hip[0] - j.hip[0], j0.hip[1] - j.hip[1]) + Math.hypot(j0.armN.end[0] - j.armN.end[0], j0.armN.end[1] - j.armN.end[1])
      + Math.hypot(j0.legN.end[0] - j.legN.end[0], j0.legN.end[1] - j.legN.end[1]) + Math.hypot(j0.top[0] - j.top[0], j0.top[1] - j.top[1]);
    if (moved > 8) {
      const start = out.length;
      drawBody(j0, C.ghost);
      const ghostShapes = out.splice(start);
      out.push({ tag: 'g', attrs: { style: { opacity: 0.2 } }, children: ghostShapes });
    }
  }

  // ---------------------------------------------------------------- objetos en mano y cuerpo
  const held = props.filter((p) => !FIXED.includes(p.t));
  held.filter((p) => p.behind || p.side === 'F').forEach((p) => heldProp(p, j));
  drawBody(j, null);
  held.filter((p) => !(p.behind || p.side === 'F')).forEach((p) => heldProp(p, j));
  return out;
}

export const DEFAULT_VIEWBOX = '-8 -20 136 136';

// Encuadre automático: un cuadrado que contiene al maniquí y sus objetos durante todo el movimiento,
// para que cada ejercicio llene el recuadro (parado, acostado o colgado).
const boxCache = new Map();
export function viewBoxFor(def) {
  if (boxCache.has(def)) return boxCache.get(def);
  const front = def.view === 'front';
  let x1 = Infinity; let y1 = Infinity; let x2 = -Infinity; let y2 = -Infinity;
  const grow = (pt, r = 0) => { x1 = Math.min(x1, pt[0] - r); x2 = Math.max(x2, pt[0] + r); y1 = Math.min(y1, pt[1] - r); y2 = Math.max(y2, pt[1] + r); };
  const steps = def.mode === 'loop' ? def.frames.length * 4 : 8;
  for (let i = 0; i <= steps; i++) {
    const j = solve(frameAt(def, (i / steps) * 0.999), front);
    grow(j.head, 8); grow(j.hip, 7); grow(j.top, 8);
    [j.legN, j.legF].forEach((l) => { grow(l.mid, 5); grow(l.end, 4); if (l.tip) grow(l.tip, 3); });
    [j.armN, j.armF].forEach((a) => { grow(a.mid, 4); grow(a.end, 3); });
    (def.props || []).forEach((pr) => {
      if (pr.on && typeof pr.on === 'string') grow(add(jointPoint(j, pr.on), [pr.dx || 0, pr.dy || 0]), pr.t === 'plate' ? (pr.r || 8.5) + 1 : 8);
    });
  }
  (def.props || []).forEach((pr) => {
    if (pr.t === 'bench' || pr.t === 'box') { grow([pr.x1, pr.y]); grow([pr.x2, FLOOR]); }
    if (pr.t === 'bar') { grow([pr.x1, pr.y - 3]); grow([pr.x2, pr.y]); }
    if (pr.t === 'pad' || pr.t === 'treadmill') { grow(pr.from, 4); grow(pr.to, 4); }
    if (pr.t === 'treadmill') grow([pr.to[0], pr.to[1] - 46]);
    if (pr.t === 'cable' || pr.t === 'waves') grow(pr.to, 4);
    if (pr.t === 'wall') grow([pr.x - 6, FLOOR]);
    if (pr.t === 'rope') grow([(x1 + x2) / 2, -14]);
  });
  if (def.floor !== false) grow([x1, FLOOR + 1]);
  const size = Math.max(x2 - x1, y2 - y1) + 12;
  const cx = (x1 + x2) / 2;
  const top = y2 + 6 - size + (size - (y2 - y1) - 12) / 2; // centrado vertical, con el piso cerca del borde de abajo
  const vb = `${r1(cx - size / 2)} ${r1(def.floor !== false ? y2 + 6 - size : top)} ${r1(size)} ${r1(size)}`;
  boxCache.set(def, vb);
  return vb;
}
