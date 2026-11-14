// Biblioteca de ejercicios de NetAI (pestaña Mover).
// Cada ejercicio tiene tres dibujos (inicio, mitad y final del movimiento) en /public/ejercicios/<slug>/.
// Los dibujos son de Workout Guide (Bryl Lim), basados en Everkinetic, con licencia CC BY-SA 4.0:
// ver public/ejercicios/ATRIBUCION.md. Los textos en español son propios y están pendientes de revisión profesional.

export const EXERCISE_ZONES = ['Piernas', 'Glúteos', 'Pecho', 'Espalda', 'Hombros', 'Brazos', 'Abdomen', 'Cardio', 'Movilidad'];

export const EXERCISE_PLACES = [
  { id: 'casa', label: 'En casa' },
  { id: 'gimnasio', label: 'Gimnasio' },
];

// kind: 'reps' (repeticiones) | 'tiempo' (mantener o hacer durante un tiempo)
const E = (slug, name, zone, place, equipment, muscles, kind, steps, care) => ({ slug, name, zone, place, equipment, muscles, kind, steps, care });

export const EXERCISES = [
  // ---- Piernas
  E('bodyweight-squat', 'Sentadilla', 'Piernas', 'casa', 'Sin equipo', ['Cuádriceps', 'Glúteos'], 'reps',
    ['Parate con los pies al ancho de los hombros.', 'Bajá llevando la cadera hacia atrás, como para sentarte, con el pecho arriba.', 'Subí empujando el piso con todo el pie.'],
    'Las rodillas siguen la dirección de los pies.'),
  E('forward-lunge', 'Estocada hacia adelante', 'Piernas', 'casa', 'Sin equipo', ['Cuádriceps', 'Glúteos'], 'reps',
    ['Desde parado, da un paso largo hacia adelante.', 'Bajá hasta que las dos rodillas queden cerca de los 90 grados.', 'Empujá con la pierna de adelante para volver.'],
    'Mantené el torso derecho y el paso lo bastante largo para estar estable.'),
  E('wall-sit', 'Sentadilla contra la pared', 'Piernas', 'casa', 'Una pared', ['Cuádriceps'], 'tiempo',
    ['Apoyá la espalda en la pared y deslizate hacia abajo.', 'Quedate con las rodillas a unos 90 grados, como en una silla.', 'Respirá normal mientras sostenés.'],
    'Si molestan las rodillas, quedate más arriba.'),
  E('calf-raise', 'Elevación de talones', 'Piernas', 'casa', 'Sin equipo', ['Gemelos'], 'reps',
    ['Parate derecho, con apoyo cerca si lo necesitás.', 'Subí a puntas de pie lo más alto que puedas.', 'Bajá despacio.'],
    'Subí y bajá sin rebotar.'),
  E('goblet-squat', 'Sentadilla con mancuerna', 'Piernas', 'gimnasio', 'Mancuerna', ['Cuádriceps', 'Glúteos'], 'reps',
    ['Sostené una mancuerna contra el pecho, con los codos hacia abajo.', 'Bajá entre las piernas manteniendo el pecho arriba.', 'Subí empujando el piso.'],
    'Empezá con poco peso hasta que el movimiento salga cómodo.'),
  E('squat', 'Sentadilla con barra', 'Piernas', 'gimnasio', 'Barra', ['Cuádriceps', 'Glúteos'], 'reps',
    ['Apoyá la barra sobre la parte alta de la espalda y dá un paso atrás.', 'Bajá con la cadera hacia atrás y la espalda firme.', 'Subí sin que las rodillas se vayan hacia adentro.'],
    'Usá los soportes de seguridad y pedí que te miren la técnica las primeras veces.'),
  E('leg-press', 'Prensa de piernas', 'Piernas', 'gimnasio', 'Máquina', ['Cuádriceps', 'Glúteos'], 'reps',
    ['Sentate con la espalda y la cadera bien apoyadas.', 'Bajá la plataforma flexionando las rodillas con control.', 'Empujá sin trabar las rodillas al final.'],
    'No despegues la cadera del asiento.'),
  E('romanian-deadlift', 'Peso muerto rumano', 'Piernas', 'gimnasio', 'Barra', ['Isquiotibiales', 'Glúteos'], 'reps',
    ['Parate con la barra en las manos y las rodillas apenas flexionadas.', 'Llevá la cadera hacia atrás y bajá la barra pegada a las piernas.', 'Volvé apretando los glúteos.'],
    'La espalda queda recta todo el recorrido.'),

  // ---- Glúteos
  E('glute-bridge', 'Puente de glúteos', 'Glúteos', 'casa', 'Sin equipo', ['Glúteos', 'Isquiotibiales'], 'reps',
    ['Acostate boca arriba con las rodillas flexionadas y los pies apoyados.', 'Subí la cadera hasta alinear hombros, cadera y rodillas.', 'Bajá despacio.'],
    'Apretá los glúteos arriba, sin arquear la zona lumbar.'),
  E('donkey-kick', 'Patada de glúteo', 'Glúteos', 'casa', 'Sin equipo', ['Glúteos'], 'reps',
    ['Ponete en cuatro apoyos.', 'Llevá una pierna hacia arriba con la rodilla flexionada.', 'Bajá sin apoyar y repetí; después cambiá de lado.'],
    'El movimiento sale de la cadera: la espalda no se mueve.'),
  E('hip-thrust', 'Empuje de cadera', 'Glúteos', 'gimnasio', 'Barra y banco', ['Glúteos'], 'reps',
    ['Apoyá la parte alta de la espalda en un banco, con la barra sobre la cadera.', 'Subí la cadera hasta que el torso quede paralelo al piso.', 'Bajá con control.'],
    'Usá una almohadilla en la barra y mirá hacia adelante.'),

  // ---- Pecho
  E('knee-push-up', 'Flexión de brazos con rodillas', 'Pecho', 'casa', 'Sin equipo', ['Pecho', 'Tríceps'], 'reps',
    ['Apoyá las manos y las rodillas, con el cuerpo en línea de rodillas a cabeza.', 'Bajá el pecho hacia el piso flexionando los codos.', 'Empujá para volver.'],
    'Es la versión para empezar: pasá a la flexión completa cuando salgan cómodas.'),
  E('push-up', 'Flexión de brazos', 'Pecho', 'casa', 'Sin equipo', ['Pecho', 'Tríceps', 'Hombros'], 'reps',
    ['Apoyá manos y puntas de pie, con el cuerpo en una sola línea.', 'Bajá el pecho hasta cerca del piso.', 'Empujá hasta estirar los brazos.'],
    'No dejes caer la cadera ni levantar la cola.'),
  E('bench-press', 'Press de banca', 'Pecho', 'gimnasio', 'Barra y banco', ['Pecho', 'Tríceps', 'Hombros'], 'reps',
    ['Acostate en el banco con los pies firmes en el piso.', 'Bajá la barra con control hasta el pecho.', 'Empujá hasta estirar los brazos.'],
    'Con cargas altas, pedí que alguien te asista.'),
  E('dumbbell-bench-press', 'Press con mancuernas', 'Pecho', 'gimnasio', 'Mancuernas y banco', ['Pecho', 'Tríceps'], 'reps',
    ['Acostate en el banco con una mancuerna en cada mano a la altura del pecho.', 'Empujá hacia arriba hasta estirar los brazos.', 'Bajá despacio.'],
    'Bajá hasta donde el hombro esté cómodo.'),

  // ---- Espalda
  E('superman', 'Superman', 'Espalda', 'casa', 'Sin equipo', ['Zona lumbar', 'Glúteos'], 'reps',
    ['Acostate boca abajo con los brazos estirados adelante.', 'Levantá un poco brazos, pecho y piernas a la vez.', 'Sostené un segundo y bajá.'],
    'Mirá al piso para no forzar el cuello.'),
  E('bird-dog', 'Perro de caza', 'Espalda', 'casa', 'Sin equipo', ['Zona lumbar', 'Abdomen'], 'reps',
    ['Ponete en cuatro apoyos.', 'Estirá un brazo adelante y la pierna contraria atrás.', 'Volvé y cambiá de lado.'],
    'Hacelo lento: la cadera no gira.'),
  E('pull-up', 'Dominada', 'Espalda', 'gimnasio', 'Barra fija', ['Dorsales', 'Bíceps'], 'reps',
    ['Colgate de la barra con las manos algo más abiertas que los hombros.', 'Tirá hasta pasar el mentón por encima de la barra.', 'Bajá con control hasta estirar los brazos.'],
    'Si todavía no sale, usá la máquina asistida o una banda.'),
  E('lat-pulldown', 'Jalón al pecho', 'Espalda', 'gimnasio', 'Polea', ['Dorsales', 'Bíceps'], 'reps',
    ['Sentate con los muslos trabados y tomá la barra ancha.', 'Tirá la barra hacia la parte alta del pecho.', 'Volvé despacio hasta estirar los brazos.'],
    'Tirá con los codos, sin balancear el torso.'),
  E('seated-row', 'Remo sentado', 'Espalda', 'gimnasio', 'Polea', ['Espalda', 'Bíceps'], 'reps',
    ['Sentate con la espalda derecha y las rodillas apenas flexionadas.', 'Tirá el agarre hacia el abdomen juntando los omóplatos.', 'Volvé con control.'],
    'El torso casi no se mueve.'),
  E('one-arm-dumbbell-row', 'Remo con mancuerna', 'Espalda', 'gimnasio', 'Mancuerna y banco', ['Espalda', 'Bíceps'], 'reps',
    ['Apoyá una mano y una rodilla en el banco, con la espalda plana.', 'Tirá la mancuerna hacia la cadera.', 'Bajá estirando el brazo; después cambiá de lado.'],
    'No gires el torso para subir el peso.'),
  E('deadlift', 'Peso muerto', 'Espalda', 'gimnasio', 'Barra', ['Espalda', 'Glúteos', 'Isquiotibiales'], 'reps',
    ['Parate con la barra sobre la mitad del pie y tomala con la espalda recta.', 'Levantá empujando el piso, con la barra pegada al cuerpo.', 'Bajá llevando la cadera hacia atrás.'],
    'Es un ejercicio técnico: aprendelo con poco peso y con alguien que te corrija.'),

  // ---- Hombros
  E('pike-push-up', 'Flexión en V invertida', 'Hombros', 'casa', 'Sin equipo', ['Hombros', 'Tríceps'], 'reps',
    ['Apoyá manos y pies con la cadera bien arriba, formando una V invertida.', 'Bajá la cabeza hacia el piso flexionando los codos.', 'Empujá para volver.'],
    'Si cuesta, acercá menos los pies a las manos.'),
  E('overhead-press', 'Press militar', 'Hombros', 'gimnasio', 'Barra', ['Hombros', 'Tríceps'], 'reps',
    ['Parate con la barra a la altura de las clavículas.', 'Empujá hacia arriba hasta estirar los brazos.', 'Bajá con control.'],
    'Apretá abdomen y glúteos para no arquear la espalda.'),
  E('lateral-raise', 'Vuelos laterales', 'Hombros', 'gimnasio', 'Mancuernas', ['Hombros'], 'reps',
    ['Parate con una mancuerna en cada mano a los costados.', 'Subí los brazos hacia los lados hasta la altura de los hombros.', 'Bajá despacio.'],
    'Con poco peso alcanza: no uses impulso.'),

  // ---- Brazos
  E('bench-dip', 'Fondos en banco', 'Brazos', 'casa', 'Una silla firme o un banco', ['Tríceps'], 'reps',
    ['Apoyá las manos en el borde, con las piernas adelante.', 'Bajá el cuerpo flexionando los codos hacia atrás.', 'Empujá hasta estirar los brazos.'],
    'Si sentís molestia en el hombro, bajá menos.'),
  E('bicep-curl', 'Curl de bíceps', 'Brazos', 'gimnasio', 'Mancuernas', ['Bíceps'], 'reps',
    ['Parate con una mancuerna en cada mano y las palmas hacia adelante.', 'Flexioná los codos para subir el peso.', 'Bajá despacio.'],
    'Los codos quedan pegados al cuerpo.'),
  E('tricep-pushdown', 'Extensión de tríceps en polea', 'Brazos', 'gimnasio', 'Polea', ['Tríceps'], 'reps',
    ['Tomá la barra de la polea alta con los codos pegados al cuerpo.', 'Empujá hacia abajo hasta estirar los brazos.', 'Volvé con control.'],
    'Solo se mueve el antebrazo.'),

  // ---- Abdomen
  E('plank', 'Plancha', 'Abdomen', 'casa', 'Sin equipo', ['Abdomen'], 'tiempo',
    ['Apoyá antebrazos y puntas de pie.', 'Alineá cabeza, cadera y talones.', 'Sostené respirando normal.'],
    'Cortá cuando la cadera empiece a caer.'),
  E('side-plank', 'Plancha lateral', 'Abdomen', 'casa', 'Sin equipo', ['Oblicuos'], 'tiempo',
    ['Acostate de costado y apoyá un antebrazo bajo el hombro.', 'Subí la cadera hasta quedar en línea.', 'Sostené y después cambiá de lado.'],
    'Para empezar, apoyá la rodilla de abajo.'),
  E('dead-bug', 'Bicho muerto', 'Abdomen', 'casa', 'Sin equipo', ['Abdomen'], 'reps',
    ['Acostate boca arriba con brazos al techo y rodillas a 90 grados.', 'Bajá un brazo y la pierna contraria hacia el piso.', 'Volvé y cambiá de lado.'],
    'La zona lumbar queda pegada al piso.'),
  E('crunch', 'Abdominal corto', 'Abdomen', 'casa', 'Sin equipo', ['Abdomen'], 'reps',
    ['Acostate boca arriba con las rodillas flexionadas.', 'Despegá los hombros del piso acercando las costillas a la cadera.', 'Bajá despacio.'],
    'No tires del cuello con las manos.'),

  // ---- Cardio
  E('jumping-jack', 'Saltos de tijera', 'Cardio', 'casa', 'Sin equipo', ['Todo el cuerpo'], 'tiempo',
    ['Parate con los pies juntos y los brazos a los costados.', 'Saltá abriendo piernas y subiendo los brazos.', 'Saltá de nuevo para volver.'],
    'Caé suave, con las rodillas apenas flexionadas.'),
  E('mountain-climber', 'Escalador', 'Cardio', 'casa', 'Sin equipo', ['Abdomen', 'Piernas'], 'tiempo',
    ['Ponete en posición de flexión de brazos.', 'Llevá una rodilla al pecho.', 'Cambiá de pierna de forma continua.'],
    'Mantené la cadera a la altura de los hombros.'),
  E('high-knees', 'Rodillas arriba', 'Cardio', 'casa', 'Sin equipo', ['Piernas'], 'tiempo',
    ['Parate derecho.', 'Trotá en el lugar subiendo las rodillas hasta la cadera.', 'Acompañá con los brazos.'],
    'Empezá a ritmo tranquilo.'),
  E('burpee', 'Burpee', 'Cardio', 'casa', 'Sin equipo', ['Todo el cuerpo'], 'reps',
    ['Desde parado, bajá y apoyá las manos en el piso.', 'Llevá los pies atrás hasta quedar en plancha y volvé.', 'Parate con un salto corto.'],
    'Es intenso: podés hacerlo sin salto y caminando los pies.'),

  // ---- Movilidad
  E('cat-cow-stretch', 'Gato y vaca', 'Movilidad', 'casa', 'Sin equipo', ['Columna'], 'reps',
    ['Ponete en cuatro apoyos.', 'Redondeá la espalda hacia el techo.', 'Después hundila suavemente, llevando el pecho adelante.'],
    'Movete lento, acompañando con la respiración.'),
  E('childs-pose', 'Postura del niño', 'Movilidad', 'casa', 'Sin equipo', ['Espalda', 'Cadera'], 'tiempo',
    ['Arrodillate y sentate sobre los talones.', 'Llevá el torso hacia adelante con los brazos estirados.', 'Respirá profundo y soltá.'],
    'Si molestan las rodillas, poné una manta entre muslos y pantorrillas.'),
  E('kneeling-hip-flexor-stretch', 'Estiramiento de cadera', 'Movilidad', 'casa', 'Sin equipo', ['Flexores de cadera'], 'tiempo',
    ['Apoyá una rodilla en el piso y el otro pie adelante.', 'Llevá la cadera hacia adelante con el torso derecho.', 'Sostené y cambiá de lado.'],
    'Tiene que tirar, no doler.'),
  E('hamstring-stretch', 'Estiramiento de isquiotibiales', 'Movilidad', 'casa', 'Sin equipo', ['Isquiotibiales'], 'tiempo',
    ['Estirá una pierna adelante con el talón apoyado.', 'Inclinate desde la cadera con la espalda larga.', 'Sostené y cambiá de lado.'],
    'No rebotes.'),
];

export const exerciseFrames = (slug) => [1, 2, 3].map((n) => `/ejercicios/${slug}/frame-${n}.svg`);
