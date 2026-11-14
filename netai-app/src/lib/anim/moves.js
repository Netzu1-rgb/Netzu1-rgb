// Animaciones de cada ejercicio, escritas para NetAI Fit. Cada una es una lista de fotogramas clave.
// Vista de costado: la persona mira a la derecha. "N" es el lado cercano (se dibuja lleno) y "F" el lejano.
import { pivot, ik2, angleOf, add, vec, LEN } from './rig.js';

// ---- Ayudas para escribir poses
const L = (x, y, bend = -1, foot = 95) => ({ ik: [x, y], bend, foot }); // pierna que llega a un punto (rodilla adelante)
const A = (x, y, bend = 1) => ({ ik: [x, y], bend }); // brazo que llega a un punto (codo atrás)
const G = (a, b, foot) => ({ ang: [a, b], foot }); // miembro por ángulos
const pose = (o) => ({ head: 0, ...o, legF: o.legF || o.legN, armF: o.armF || o.armN });
/** Cadera y torso a partir de los hombros: cadera = extremo de dos huesos que van del tobillo al hombro */
const bodyLine = (ankle, shoulder, bend = 1) => {
  const [hip] = ik2(ankle, shoulder, LEN.thigh + LEN.shin, LEN.torso, bend);
  return { hip, torso: angleOf(shoulder[0] - hip[0], shoulder[1] - hip[1]) };
};
const torsoTo = (hip, shoulder) => angleOf(shoulder[0] - hip[0], shoulder[1] - hip[1]);

// Posturas base
const STAND = pose({ hip: [56, 61], torso: 180, legN: L(60, 104), legF: L(56, 104), armN: G(0, 0), armF: G(-2, -2) });
const stand = (o = {}) => pose({ ...STAND, ...o });
const squatLow = (o = {}) => pose({ ...STAND, hip: [43, 84], torso: 143, ...o });

// Plancha sobre las manos (flexiones)
const plankUp = bodyLine([17, 100], [86, 77]);
const plankDown = bodyLine([17, 100], [88, 91]);
const PLANK_LEG = L(17, 100, 1, 30);

// Cuadrupedia (perro de caza, patada de glúteo, gato y vaca)
const QUAD = { hip: [44, 82], torso: torsoTo([44, 82], [73.6, 77]) };

export const MOVES = {
  // ======================== Piernas
  'bodyweight-squat': { frames: [stand({ armN: G(80, 80), armF: G(78, 78) }), squatLow({ armN: G(95, 95), armF: G(93, 93) })] },
  'goblet-squat': {
    frames: [stand({ armN: G(12, 168), armF: G(10, 166) }), squatLow({ armN: G(30, 150), armF: G(28, 148) })],
    props: [{ t: 'kb', on: 'handN', dy: -4 }],
  },
  squat: {
    frames: [stand({ armN: G(-30, 150), armF: G(-32, 148) }), squatLow({ torso: 138, armN: G(-60, 120), armF: G(-62, 118) })],
    props: [{ t: 'plate', on: 'shoulder', dx: -7, dy: -1, behind: true }],
  },
  'jump-squat': {
    mode: 'loop', dur: 1800,
    frames: [
      stand({ armN: G(60, 60), armF: G(58, 58) }),
      squatLow({ armN: G(-20, -20), armF: G(-22, -22) }),
      stand({ hip: [56, 50], legN: L(60, 93, -1, 40), legF: L(56, 93, -1, 40), armN: G(165, 170), armF: G(163, 168) }),
    ],
  },
  'wall-sit': {
    dur: 3200,
    frames: [pose({ hip: [37, 82], torso: 180, legN: L(61, 104), legF: L(57, 104), armN: G(20, 150), armF: G(18, 148) }), pose({ hip: [37, 82.6], torso: 179, legN: L(61, 104), legF: L(57, 104), armN: G(20, 150), armF: G(18, 148) })],
    props: [{ t: 'wall', x: 32 }],
  },
  'forward-lunge': {
    dur: 2600,
    frames: [
      pose({ hip: [38, 61], torso: 180, legN: L(42, 104), legF: L(36, 104), armN: G(0, 0), armF: G(-2, -2) }),
      pose({ hip: [52, 79], torso: 180, legN: L(78, 104), legF: L(30, 100, -1, 40), armN: G(2, 2), armF: G(0, 0) }),
    ],
  },
  'lateral-lunge': {
    view: 'front', dur: 2600,
    frames: [
      pose({ hip: [60, 61], torso: 180, legN: L(66, 104, 1, 90), legF: L(54, 104, -1, -90), armN: G(25, -150), armF: G(-25, 150) }),
      pose({ hip: [72, 79], torso: 172, legN: L(88, 104, -1, 90), legF: L(40, 104, -1, -90), armN: G(25, -150), armF: G(-25, 150) }),
    ],
  },
  'bulgarian-split-squat': {
    dur: 2600,
    frames: [
      pose({ hip: [52, 64], torso: 178, legN: L(68, 104), legF: L(25, 78, 1, -95), armN: G(0, 0), armF: G(-2, -2) }),
      pose({ hip: [50, 82], torso: 172, legN: L(68, 104), legF: L(25, 78, 1, -95), armN: G(5, 5), armF: G(3, 3) }),
    ],
    props: [{ t: 'bench', x1: 4, x2: 30, y: 82 }, { t: 'db', on: 'handN' }],
  },
  'step-up': {
    dur: 2600,
    frames: [
      pose({ hip: [46, 61], torso: 176, legN: L(68, 81), legF: L(46, 104), armN: G(0, 0), armF: G(-2, -2) }),
      pose({ hip: [66, 40], torso: 180, legN: L(70, 81), legF: L(62, 76, 1, 40), armN: G(0, 0), armF: G(-2, -2) }),
    ],
    props: [{ t: 'box', x1: 58, x2: 92, y: 85 }, { t: 'db', on: 'handN' }],
  },
  'calf-raise': {
    dur: 1800,
    frames: [stand(), stand({ hip: [56, 55], legN: L(60, 98, -1, 32), legF: L(56, 98, -1, 32) })],
  },
  'standing-calf-raise': {
    dur: 1800,
    frames: [stand({ armN: G(-25, 160), armF: G(-27, 158) }), stand({ hip: [56, 55], legN: L(60, 98, -1, 32), legF: L(56, 98, -1, 32), armN: G(-25, 160), armF: G(-27, 158) })],
    props: [{ t: 'handle', on: 'shoulder', w: 14 }, { t: 'post', x: 40, y: 30 }],
  },
  'leg-press': {
    dur: 2400, floor: false,
    frames: [
      pose({ hip: [42, 90], torso: 225, head: 25, legN: L(58, 70, -1, 165), legF: L(56, 72, -1, 165), armN: A(40, 88, -1), armF: A(38, 88, -1) }),
      pose({ hip: [42, 90], torso: 225, head: 25, legN: L(72, 60, -1, 165), legF: L(70, 62, -1, 165), armN: A(40, 88, -1), armF: A(38, 88, -1) }),
    ],
    props: [{ t: 'pad', from: [16, 72], to: [40, 98], w: 6 }, { t: 'pad', from: [40, 98], to: [60, 98], w: 5 }, { t: 'sled', on: 'toeN', angle: 45 }],
  },
  'leg-extension': {
    dur: 2200, floor: false,
    frames: [
      pose({ hip: [46, 80], torso: 186, legN: G(90, 5, 95), legF: G(88, 3, 95), armN: A(50, 86, -1), armF: A(48, 86, -1) }),
      pose({ hip: [46, 80], torso: 186, legN: G(90, 88, 175), legF: G(88, 86, 173), armN: A(50, 86, -1), armF: A(48, 86, -1) }),
    ],
    props: [{ t: 'pad', from: [34, 86], to: [66, 86], w: 6 }, { t: 'pad', from: [34, 86], to: [30, 46], w: 6 }, { t: 'post', x: 50, y: 88 }, { t: 'roller', on: 'ankleN', dy: -4 }],
  },
  'leg-curl': {
    dur: 2200, vb: '-6 -6 132 132',
    frames: [
      pose({ hip: [64, 77], torso: -90, head: -12, legN: G(90, 90, 175), legF: G(91, 91, 176), armN: A(26, 88), armF: A(24, 88) }),
      pose({ hip: [64, 77], torso: -90, head: -12, legN: G(90, 200, -70), legF: G(91, 198, -72), armN: A(26, 88), armF: A(24, 88) }),
    ],
    props: [{ t: 'bench', x1: 20, x2: 92, y: 82 }, { t: 'roller', on: 'ankleN', dy: -4 }],
  },
  'romanian-deadlift': {
    dur: 2800,
    frames: [stand(), pose({ hip: [45, 64], torso: 108, legN: L(60, 104), legF: L(56, 104), armN: G(0, 0), armF: G(-2, -2) })],
    props: [{ t: 'plate', on: 'handN' }],
  },
  'single-leg-romanian-deadlift': {
    dur: 2800,
    frames: [
      pose({ hip: [56, 61], torso: 180, legN: L(60, 104), legF: G(-4, -4, 95), armN: G(0, 0), armF: G(-2, -2) }),
      pose({ hip: [52, 63], torso: 96, legN: L(60, 104), legF: G(-92, -92, 2), armN: G(0, 0), armF: G(-2, -2) }),
    ],
    props: [{ t: 'db', on: 'handN' }],
  },
  deadlift: {
    dur: 2800,
    frames: [
      pose({ hip: [44, 86], torso: 128, legN: L(60, 104), legF: L(56, 104), armN: G(0, 0), armF: G(-2, -2) }),
      stand(),
    ],
    props: [{ t: 'plate', on: 'handN', r: 9 }],
  },

  // ======================== Glúteos
  'glute-bridge': {
    dur: 2400,
    frames: [
      pose({ hip: [52, 104], torso: -90, head: 0, legN: L(76, 104, -1), legF: L(74, 104, -1), armN: G(90, 90), armF: G(90, 90) }),
      pose({ hip: [52, 88], torso: -58, head: -32, legN: L(76, 104, -1), legF: L(74, 104, -1), armN: G(90, 90), armF: G(90, 90) }),
    ],
  },
  'hip-thrust': {
    dur: 2400,
    frames: [
      pose({ hip: [52, 100], torso: -122, head: 25, legN: L(82, 104, -1), legF: L(80, 104, -1), armN: A(52, 92, -1), armF: A(50, 92, -1) }),
      pose({ hip: [56, 82], torso: -90, head: 0, legN: L(82, 104, -1), legF: L(80, 104, -1), armN: A(56, 74, -1), armF: A(54, 74, -1) }),
    ],
    props: [{ t: 'bench', x1: 4, x2: 30, y: 86 }, { t: 'plate', on: 'hip', dy: -9 }],
  },
  'donkey-kick': {
    dur: 2000, vb: '-6 -6 132 132',
    frames: [
      pose({ ...QUAD, legN: G(0, -90, -95), legF: G(1, -90, -95), armN: A(74, 105), armF: A(72, 105) }),
      pose({ ...QUAD, legN: G(-105, 178, -150), legF: G(1, -90, -95), armN: A(74, 105), armF: A(72, 105) }),
    ],
  },

  // ======================== Pecho
  'push-up': {
    dur: 2200,
    frames: [
      pose({ ...plankUp, legN: PLANK_LEG, armN: A(86, 105, 1), armF: A(84, 105, 1) }),
      pose({ ...plankDown, legN: PLANK_LEG, armN: A(86, 105, 1), armF: A(84, 105, 1) }),
    ],
  },
  'knee-push-up': {
    dur: 2200,
    frames: [
      pose({ hip: pivot([42, 104], 159, 22), torso: 102, legN: G(-21, -110, -140), legF: G(-20, -108, -138), armN: A(80, 105, 1), armF: A(78, 105, 1) }),
      pose({ hip: pivot([42, 104], 140, 22), torso: 95, legN: G(-40, -100, -135), legF: G(-39, -98, -133), armN: A(80, 105, 1), armF: A(78, 105, 1) }),
    ],
  },
  'bench-press': {
    dur: 2400,
    frames: [
      pose({ hip: [62, 79], torso: -90, legN: L(82, 104, -1), legF: L(80, 104, -1), armN: A(33, 51, -1), armF: A(31, 51, -1) }),
      pose({ hip: [62, 79], torso: -90, legN: L(82, 104, -1), legF: L(80, 104, -1), armN: A(37, 71, -1), armF: A(35, 71, -1) }),
    ],
    props: [{ t: 'bench', x1: 14, x2: 70, y: 84 }, { t: 'plate', on: 'handN' }],
  },
  'dumbbell-bench-press': {
    dur: 2400,
    frames: [
      pose({ hip: [62, 79], torso: -90, legN: L(82, 104, -1), legF: L(80, 104, -1), armN: A(33, 51, -1), armF: A(31, 51, -1) }),
      pose({ hip: [62, 79], torso: -90, legN: L(82, 104, -1), legF: L(80, 104, -1), armN: A(38, 72, -1), armF: A(36, 72, -1) }),
    ],
    props: [{ t: 'bench', x1: 14, x2: 70, y: 84 }, { t: 'db', on: 'handN' }, { t: 'db', on: 'handF', side: 'F' }],
  },
  'incline-dumbbell-press': {
    dur: 2400,
    frames: [
      pose({ hip: [52, 86], torso: 220, head: 30, legN: L(78, 104), legF: L(76, 104), armN: A(34, 35), armF: A(32, 35) }),
      pose({ hip: [52, 86], torso: 220, head: 30, legN: L(78, 104), legF: L(76, 104), armN: A(41, 58), armF: A(39, 58) }),
    ],
    props: [{ t: 'pad', from: [50, 92], to: [26, 62], w: 6 }, { t: 'pad', from: [46, 93], to: [64, 93], w: 5 }, { t: 'post', x: 50, y: 94 }, { t: 'db', on: 'handN' }],
  },
  'dumbbell-fly': {
    dur: 2600,
    frames: [
      pose({ hip: [62, 79], torso: -90, legN: L(82, 104, -1), legF: L(80, 104, -1), armN: G(176, 182), armF: G(174, 180) }),
      pose({ hip: [62, 79], torso: -90, legN: L(82, 104, -1), legF: L(80, 104, -1), armN: G(120, 100), armF: G(118, 98) }),
    ],
    props: [{ t: 'bench', x1: 14, x2: 70, y: 84 }, { t: 'db', on: 'handN' }],
  },
  dip: {
    dur: 2400,
    frames: [
      pose({ hip: pivot([58, 35], -10, 30), torso: 170, legN: G(15, -70, -110), legF: G(17, -68, -108), armN: A(60, 62, -1), armF: A(58, 62, -1) }),
      pose({ hip: pivot([56, 50], -20, 30), torso: 160, legN: G(20, -75, -115), legF: G(22, -73, -113), armN: A(60, 62, -1), armF: A(58, 62, -1) }),
    ],
    props: [{ t: 'bar', x1: 48, x2: 72, y: 64, posts: true }],
  },

  // ======================== Espalda
  'pull-up': {
    dur: 2600, floor: false,
    frames: [
      pose({ hip: [60, 70], torso: 180, legN: G(25, -55, -100), legF: G(27, -53, -98), armN: A(64, 12, -1), armF: A(62, 12, -1) }),
      pose({ hip: [60, 52], torso: 180, legN: G(25, -55, -100), legF: G(27, -53, -98), armN: A(64, 12, -1), armF: A(62, 12, -1) }),
    ],
    props: [{ t: 'bar', x1: 36, x2: 86, y: 11, hang: true }],
  },
  'chin-up': {
    dur: 2600, floor: false,
    frames: [
      pose({ hip: [60, 70], torso: 180, legN: G(25, -55, -100), legF: G(27, -53, -98), armN: A(62, 12, 1), armF: A(60, 12, 1) }),
      pose({ hip: [60, 52], torso: 180, legN: G(25, -55, -100), legF: G(27, -53, -98), armN: A(62, 12, 1), armF: A(60, 12, 1) }),
    ],
    props: [{ t: 'bar', x1: 36, x2: 86, y: 11, hang: true }],
  },
  'lat-pulldown': {
    dur: 2400,
    frames: [
      pose({ hip: [50, 80], torso: 190, legN: L(74, 104), legF: L(72, 104), armN: A(50, 23, -1), armF: A(48, 23, -1) }),
      pose({ hip: [50, 80], torso: 196, legN: L(74, 104), legF: L(72, 104), armN: A(50, 46, -1), armF: A(48, 46, -1) }),
    ],
    props: [{ t: 'bench', x1: 36, x2: 62, y: 84 }, { t: 'cable', on: 'handN', to: [50, 2] }, { t: 'handle', on: 'handN', w: 22 }, { t: 'pad', from: [64, 74], to: [76, 74], w: 5 }],
  },
  'seated-row': {
    dur: 2400,
    frames: [
      pose({ hip: [36, 84], torso: 158, legN: L(78, 90, -1, 165), legF: L(76, 90, -1, 165), armN: A(75, 64), armF: A(73, 64) }),
      pose({ hip: [36, 84], torso: 186, legN: L(78, 90, -1, 165), legF: L(76, 90, -1, 165), armN: A(48, 70), armF: A(46, 70) }),
    ],
    props: [{ t: 'bench', x1: 20, x2: 56, y: 88 }, { t: 'pad', from: [82, 84], to: [82, 100], w: 4 }, { t: 'cable', on: 'handN', to: [100, 66] }, { t: 'handle', on: 'handN', w: 6 }],
  },
  'barbell-row': {
    dur: 2400,
    frames: [
      pose({ hip: [46, 64], torso: 110, legN: L(60, 104), legF: L(56, 104), armN: A(75, 82), armF: A(73, 82) }),
      pose({ hip: [46, 64], torso: 110, legN: L(60, 104), legF: L(56, 104), armN: A(60, 68), armF: A(58, 68) }),
    ],
    props: [{ t: 'plate', on: 'handN' }],
  },
  'one-arm-dumbbell-row': {
    dur: 2400,
    frames: [
      pose({ hip: [40, 64], torso: 96, legN: L(50, 104), legF: L(30, 104), armN: A(71, 88), armF: A(84, 80) }),
      pose({ hip: [40, 64], torso: 96, legN: L(50, 104), legF: L(30, 104), armN: A(56, 66), armF: A(84, 80) }),
    ],
    props: [{ t: 'bench', x1: 66, x2: 100, y: 82 }, { t: 'db', on: 'handN' }],
  },
  superman: {
    dur: 2400, vb: '-16 -24 152 152',
    frames: [
      pose({ hip: [72, 104], torso: -90, head: 0, legN: G(91, 91, 178), legF: G(92, 92, 179), armN: G(-91, -91), armF: G(-92, -92) }),
      pose({ hip: [72, 103], torso: -100, head: -12, legN: G(102, 104, 180), legF: G(103, 105, 181), armN: G(-112, -114), armF: G(-113, -115) }),
    ],
  },
  'bird-dog': {
    dur: 2600, vb: '-12 -10 140 140',
    frames: [
      pose({ ...QUAD, legN: G(0, -90, -95), legF: G(1, -90, -95), armN: G(0, 0), armF: G(-1, -1) }),
      pose({ ...QUAD, legN: G(0, -90, -95), legF: G(-92, -92, -2), armN: G(94, 94), armF: G(-1, -1) }),
    ],
  },

  // ======================== Hombros
  'overhead-press': {
    dur: 2400,
    frames: [stand({ armN: A(61, 30, -1), armF: A(59, 30, -1) }), stand({ armN: A(57, 3), armF: A(55, 3) })],
    props: [{ t: 'plate', on: 'handN' }],
  },
  'seated-dumbbell-press': {
    dur: 2400,
    frames: [
      pose({ hip: [48, 78], torso: 180, legN: L(72, 104), legF: L(70, 104), armN: A(54, 46, -1), armF: A(52, 46, -1) }),
      pose({ hip: [48, 78], torso: 180, legN: L(72, 104), legF: L(70, 104), armN: A(50, 20), armF: A(48, 20) }),
    ],
    props: [{ t: 'pad', from: [41, 82], to: [41, 40], w: 6 }, { t: 'bench', x1: 36, x2: 60, y: 82 }, { t: 'db', on: 'handN' }],
  },
  'pike-push-up': {
    dur: 2400,
    frames: [
      (() => { const b = bodyLine([34, 100], [72, 79], -1); return pose({ ...b, legN: L(34, 100, 1, 30), armN: A(82, 105, -1), armF: A(80, 105, -1) }); })(),
      (() => { const b = bodyLine([34, 100], [70, 92], -1); return pose({ ...b, legN: L(34, 100, 1, 30), armN: A(82, 105, -1), armF: A(80, 105, -1) }); })(),
    ],
  },
  'lateral-raise': {
    view: 'front', dur: 2400,
    frames: [
      pose({ hip: [60, 61], torso: 180, legN: L(64, 104, 1, 90), legF: L(56, 104, -1, -90), armN: G(8, 6), armF: G(-8, -6) }),
      pose({ hip: [60, 61], torso: 180, legN: L(64, 104, 1, 90), legF: L(56, 104, -1, -90), armN: G(86, 88), armF: G(-86, -88) }),
    ],
    props: [{ t: 'dbs', on: 'handN' }, { t: 'dbs', on: 'handF' }],
  },
  'face-pull': {
    dur: 2200,
    frames: [stand({ hip: [44, 61], legN: L(48, 104), legF: L(40, 104), armN: A(72, 30, -1), armF: A(70, 30, -1) }), stand({ hip: [44, 61], legN: L(48, 104), legF: L(40, 104), armN: A(52, 22, -1), armF: A(50, 22, -1) })],
    props: [{ t: 'cable', on: 'handN', to: [104, 28] }, { t: 'handle', on: 'handN', w: 5 }],
  },
  'rear-delt-fly': {
    dur: 2400,
    frames: [
      pose({ hip: [46, 64], torso: 110, legN: L(60, 104), legF: L(56, 104), armN: G(2, 2), armF: G(0, 0) }),
      pose({ hip: [46, 64], torso: 110, legN: L(60, 104), legF: L(56, 104), armN: G(-60, -70), armF: G(-62, -72) }),
    ],
    props: [{ t: 'db', on: 'handN' }],
  },
  'band-pull-apart': {
    view: 'front', dur: 2200,
    frames: [
      pose({ hip: [60, 61], torso: 180, legN: L(64, 104, 1, 90), legF: L(56, 104, -1, -90), armN: G(70, -100), armF: G(-70, 100) }),
      pose({ hip: [60, 61], torso: 180, legN: L(64, 104, 1, 90), legF: L(56, 104, -1, -90), armN: G(92, 92), armF: G(-92, -92) }),
    ],
    props: [{ t: 'band', from: 'handN', to: 'handF' }],
  },

  // ======================== Brazos
  'bicep-curl': { dur: 2200, frames: [stand({ armN: G(2, 2), armF: G(0, 0) }), stand({ armN: G(6, 165), armF: G(4, 163) })], props: [{ t: 'db', on: 'handN' }] },
  'hammer-curl': { dur: 2200, frames: [stand({ armN: G(2, 2), armF: G(0, 0) }), stand({ armN: G(6, 165), armF: G(4, 163) })], props: [{ t: 'dbs', on: 'handN' }] },
  'tricep-pushdown': {
    dur: 2000,
    frames: [stand({ hip: [50, 61], torso: 172, legN: L(56, 104), legF: L(50, 104), armN: G(10, 130), armF: G(8, 128) }), stand({ hip: [50, 61], torso: 172, legN: L(56, 104), legF: L(50, 104), armN: G(8, 4), armF: G(6, 2) })],
    props: [{ t: 'cable', on: 'handN', to: [78, 4] }, { t: 'handle', on: 'handN', w: 8 }],
  },
  'skull-crusher': {
    dur: 2400,
    frames: [
      pose({ hip: [62, 79], torso: -90, legN: L(82, 104, -1), legF: L(80, 104, -1), armN: G(176, 180), armF: G(174, 178) }),
      pose({ hip: [62, 79], torso: -90, legN: L(82, 104, -1), legF: L(80, 104, -1), armN: G(184, -80), armF: G(182, -82) }),
    ],
    props: [{ t: 'bench', x1: 14, x2: 70, y: 84 }, { t: 'plate', on: 'handN', r: 6 }],
  },
  'bench-dip': {
    dur: 2200,
    frames: [
      pose({ hip: [41, 72], torso: 180, legN: L(70, 104), legF: L(68, 104), armN: A(36, 70, -1), armF: A(34, 70, -1) }),
      pose({ hip: [42, 86], torso: 180, legN: L(70, 104), legF: L(68, 104), armN: A(36, 70, -1), armF: A(34, 70, -1) }),
    ],
    props: [{ t: 'bench', x1: 6, x2: 38, y: 72 }],
  },

  // ======================== Abdomen
  plank: (() => {
    const b = bodyLine([8.5, 100], [80, 88]);
    const p = pose({ ...b, legN: L(8.5, 100, 1, 30), armN: G(0, 90), armF: G(-1, 89) });
    return { dur: 3200, frames: [p, { ...p, hip: [p.hip[0], p.hip[1] + 0.8] }] };
  })(),
  'side-plank': (() => {
    const b = bodyLine([14, 102], [84, 80]);
    const p = pose({ ...b, legN: L(14, 103, 1, 90), legF: L(16, 99, 1, 90), armN: G(0, 90), armF: G(178, 180) });
    return { view: 'front', dur: 3200, frames: [p, { ...p, hip: [p.hip[0], p.hip[1] + 1] }] };
  })(),
  'dead-bug': {
    dur: 2600, vb: '-10 -10 140 140',
    frames: [
      pose({ hip: [64, 104], torso: -90, legN: G(180, 90, 95), legF: G(95, 95, 175), armN: G(-94, -94), armF: G(180, 180) }),
      pose({ hip: [64, 104], torso: -90, legN: G(95, 95, 175), legF: G(180, 90, 95), armN: G(180, 180), armF: G(-94, -94) }),
    ],
  },
  crunch: {
    dur: 2200,
    frames: [
      pose({ hip: [56, 104], torso: -90, legN: L(80, 104, -1), legF: L(78, 104, -1), armN: A(38, 100, -1), armF: A(36, 100, -1) }),
      pose({ hip: [56, 104], torso: -116, head: 10, legN: L(80, 104, -1), legF: L(78, 104, -1), armN: A(40, 92, -1), armF: A(38, 92, -1) }),
    ],
  },
  'hanging-leg-raise': {
    dur: 2600, floor: false,
    frames: [
      pose({ hip: [60, 64], torso: 180, legN: G(4, 4, 95), legF: G(6, 6, 97), armN: A(62, 8, -1), armF: A(60, 8, -1) }),
      pose({ hip: [58, 64], torso: 172, legN: G(92, 92, 175), legF: G(94, 94, 177), armN: A(62, 8, -1), armF: A(60, 8, -1) }),
    ],
    props: [{ t: 'bar', x1: 36, x2: 86, y: 7, hang: true }],
  },
  'russian-twist': {
    view: 'front', dur: 2000,
    frames: [
      pose({ hip: [60, 94], torso: 172, legN: G(115, -20, 90), legF: G(-115, 20, -90), armN: G(50, 70), armF: G(70, 80) }),
      pose({ hip: [60, 94], torso: 188, legN: G(115, -20, 90), legF: G(-115, 20, -90), armN: G(-70, -80), armF: G(-50, -70) }),
    ],
  },
  'flutter-kick': {
    dur: 900, vb: '-12 -10 140 140',
    frames: [
      pose({ hip: [62, 104], torso: -90, head: 8, legN: G(80, 80, 170), legF: G(96, 96, 186), armN: G(90, 90), armF: G(91, 91) }),
      pose({ hip: [62, 104], torso: -90, head: 8, legN: G(96, 96, 186), legF: G(80, 80, 170), armN: G(90, 90), armF: G(91, 91) }),
    ],
  },

  // ======================== Cardio
  'jumping-jack': {
    view: 'front', dur: 1000,
    frames: [
      pose({ hip: [60, 61], torso: 180, legN: L(64, 104, 1, 90), legF: L(56, 104, -1, -90), armN: G(10, 8), armF: G(-10, -8) }),
      pose({ hip: [60, 59], torso: 180, legN: L(78, 102, 1, 90), legF: L(42, 102, -1, -90), armN: G(160, 172), armF: G(-160, -172) }),
    ],
  },
  'high-knees': {
    dur: 800,
    frames: [
      stand({ hip: [56, 60], legN: L(66, 80), legF: L(56, 103), armN: G(-30, 20), armF: G(40, 130) }),
      stand({ hip: [56, 60], legN: L(58, 103), legF: L(64, 80), armN: G(40, 130), armF: G(-30, 20) }),
    ],
  },
  'mountain-climber': {
    dur: 900,
    frames: [
      pose({ ...plankUp, legN: L(58, 96, -1, 30), legF: PLANK_LEG, armN: A(86, 105, 1), armF: A(84, 105, 1) }),
      pose({ ...plankUp, legN: PLANK_LEG, legF: L(58, 96, -1, 30), armN: A(86, 105, 1), armF: A(84, 105, 1) }),
    ],
  },
  burpee: {
    mode: 'loop', dur: 3600,
    frames: [
      pose({ ...STAND, armN: A(57, 59), armF: A(55, 59) }),
      pose({ hip: [52, 88], torso: 128, legN: L(60, 104), legF: L(57, 104), armN: A(80, 105, 1), armF: A(78, 105, 1) }),
      pose({ ...plankUp, legN: PLANK_LEG, armN: A(86, 105, 1), armF: A(84, 105, 1) }),
      pose({ hip: [52, 88], torso: 128, legN: L(60, 104), legF: L(57, 104), armN: A(80, 105, 1), armF: A(78, 105, 1) }),
      pose({ hip: [56, 52], torso: 180, legN: L(60, 94, -1, 40), legF: L(57, 94, -1, 40), armN: A(62, 2), armF: A(60, 2) }),
    ],
  },
  'kettlebell-swing': {
    dur: 1800,
    frames: [
      pose({ hip: [44, 68], torso: 122, legN: L(60, 104), legF: L(56, 104), armN: G(-18, -18), armF: G(-20, -20) }),
      stand({ armN: G(92, 92), armF: G(90, 90) }),
    ],
    props: [{ t: 'kb', on: 'handN' }],
  },
  'farmer-carry': {
    dur: 1100,
    frames: [
      stand({ hip: [56, 62], legN: L(70, 104), legF: L(44, 103, -1, 60), armN: G(0, 0), armF: G(-2, -2) }),
      stand({ hip: [56, 62], legN: L(44, 103, -1, 60), legF: L(70, 104), armN: G(0, 0), armF: G(-2, -2) }),
    ],
    props: [{ t: 'kb', on: 'handN' }],
  },
  'battle-ropes': {
    dur: 700,
    frames: [
      pose({ hip: [46, 74], torso: 160, legN: L(64, 104), legF: L(50, 104), armN: A(76, 48), armF: A(74, 70), k: 0 }),
      pose({ hip: [46, 74], torso: 160, legN: L(64, 104), legF: L(50, 104), armN: A(76, 70), armF: A(74, 48), k: 1 }),
    ],
    props: [{ t: 'waves', to: [118, 100] }],
  },
  'treadmill-incline-walk': {
    dur: 1300,
    frames: [
      stand({ hip: [56, 57], torso: 176, legN: L(68, 98), legF: L(44, 102, -1, 60), armN: G(-25, -10), armF: G(25, 45) }),
      stand({ hip: [56, 57], torso: 176, legN: L(44, 102, -1, 60), legF: L(68, 98), armN: G(25, 45), armF: G(-25, -10) }),
    ],
    props: [{ t: 'treadmill', from: [6, 108], to: [104, 96] }],
  },
  'jump-rope': {
    dur: 700,
    frames: [
      stand({ armN: G(10, 70), armF: G(4, 64), k: 0 }),
      stand({ hip: [56, 55], legN: L(60, 98, -1, 40), legF: L(56, 98, -1, 40), armN: G(14, 80), armF: G(8, 74), k: 1 }),
    ],
    props: [{ t: 'rope' }],
  },
  'skater-hop': {
    view: 'front', mode: 'loop', dur: 1800,
    frames: [
      pose({ hip: [74, 66], torso: 168, legN: L(78, 104, 1, 90), legF: L(62, 98, -1, -90), armN: G(-40, -30), armF: G(-70, -60) }),
      pose({ hip: [60, 54], torso: 180, legN: L(64, 94, 1, 90), legF: L(56, 94, -1, -90), armN: G(10, 10), armF: G(-10, -10) }),
      pose({ hip: [46, 66], torso: 192, legN: L(58, 98, 1, 90), legF: L(42, 104, -1, -90), armN: G(70, 60), armF: G(40, 30) }),
      pose({ hip: [60, 54], torso: 180, legN: L(64, 94, 1, 90), legF: L(56, 94, -1, -90), armN: G(10, 10), armF: G(-10, -10) }),
    ],
  },

  // ======================== Movilidad
  'cat-cow-stretch': {
    dur: 3200,
    frames: [
      pose({ ...QUAD, arch: 7, head: 55, legN: G(0, -90, -95), legF: G(1, -90, -95), armN: A(74, 105), armF: A(72, 105) }),
      pose({ ...QUAD, arch: -5, head: -35, legN: G(0, -90, -95), legF: G(1, -90, -95), armN: A(74, 105), armF: A(72, 105) }),
    ],
  },
  'childs-pose': (() => {
    const hip = pivot([62, 104], -120, 22);
    const p = pose({ hip, torso: 80, head: 20, legN: G(60, -90, -95), legF: G(61, -90, -95), armN: G(95, 90), armF: G(96, 91) });
    return { dur: 3600, frames: [p, { ...p, arch: 2 }] };
  })(),
  'kneeling-hip-flexor-stretch': {
    dur: 3200,
    frames: [
      pose({ hip: pivot([40, 104], 150, 22), torso: 180, legN: L(74, 104), legF: G(-30, -90, -95), armN: A(66, 82), armF: A(64, 82) }),
      pose({ hip: pivot([40, 104], 135, 22), torso: 186, legN: L(74, 104), legF: G(-45, -90, -95), armN: A(70, 84), armF: A(68, 84) }),
    ],
  },
  'hamstring-stretch': {
    dur: 3400,
    frames: [
      pose({ hip: [52, 66], torso: 172, legN: L(72, 104, -1, 150), legF: L(48, 104), armN: A(62, 78), armF: A(60, 78) }),
      pose({ hip: [50, 66], torso: 128, legN: L(72, 104, -1, 150), legF: L(48, 104), armN: A(70, 92), armF: A(68, 92) }),
    ],
  },
};
void add; void vec;
