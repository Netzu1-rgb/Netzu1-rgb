# TRUEVENTO · App de alumnos e instructores

Aplicación web progresiva (PWA), en **español, portugués e inglés**, donde los alumnos de TRUEVENTO Kiteschool ven sus clases, piden horarios, siguen su progreso y el pronóstico del viento, y los instructores manejan su agenda y marcan lo que aprendió cada alumno.

Es una app aparte de la de gestión (`../truevento-app`), pero usa **la misma base de datos Supabase**: una clase que el instructor marca como dada queda registrada sola en la gestión, con el precio del alumno y el pago del instructor.

## Qué hace

| | Alumno | Instructor / escuela |
|---|---|---|
| **Inicio** | próxima clase, pedidos pendientes, viento de hoy y avisos | pedidos para confirmar, clases de hoy y clases pasadas sin cerrar |
| **Agenda** | sus clases (pedir, cancelar) | semana completa: agendar, confirmar, rechazar, cambiar, cancelar y "clase dada" |
| **Progreso** | camino de aprendizaje por niveles y comentarios del instructor | marcar habilidades (practicando → logrado) y escribir comentarios |
| **Avisos** | los lee en el inicio | publicar para todos o para un alumno ("hoy no hay viento…") |
| **Viento** | pronóstico de 7 días (Open-Meteo, sin clave) | igual |

Al cerrar una clase ("Clase dada"), el instructor indica cuánto duró, deja un comentario y marca las habilidades trabajadas. Eso crea la clase en la gestión con los precios guardados en las fichas.

## Idiomas

La app detecta el idioma del celular (portugués o inglés; si no, español) y se puede cambiar en la pantalla de entrada o en **Ajustes → Idioma**. Todos los textos están en `src/i18n/messages.ts` (el español es la referencia; la compilación falla si a portugués o inglés le falta un texto). Los mensajes de la base de datos y las habilidades del camino de aprendizaje también se traducen; lo que escriben las personas (avisos, comentarios) queda como se escribió.

## Viento

- **Punto**: la escuela (TRUEVENTO kiteschool, Guajirú, -2.8813, -39.9119, según el mapa de truevento.com). Se puede cambiar con `VITE_SPOT_LAT` / `VITE_SPOT_LON`.
- **Fuente principal**: Open-Meteo, celda del modelo **sobre el mar** (`cell_selection=sea`: el viento sobre tierra es más débil), en nudos y en hora de Ceará (UTC−3). **Respaldo**: MET Norway (Instituto Meteorológico de Noruega) si Open-Meteo no responde. Si no hay conexión, se muestra el último pronóstico guardado (hasta 24 h) con un aviso.
- **Cálculos** (`src/lib/wind.ts`): promedio, máximo y ráfagas de las horas de clase (9 a 17 h); dirección promedio como vector, en 16 rumbos y grados; los datos faltantes se omiten (nunca se muestran como 0 kn). Guía para clases: menos de 12 kn poco viento, 12–25 kn ideal, más de 25 kn o ráfagas de 32 kn o más, fuerte; ráfagas 10 kn por encima del promedio se marcan como fuertes. "Mejor horario" es el tramo más largo de horas ideales.
- **Pruebas**: `npm test` (33 casos de unidades, zonas horarias, rumbos, datos faltantes, fuentes y caché) y `npx vite-node scripts/check-wind-real.ts <respuesta-de-met-norway.json>` para comparar con un pronóstico real.

## Privacidad (LGPD)

Al crear la cuenta, el alumno acepta la política de privacidad (se puede leer en la pantalla de registro y en Ajustes). La base guarda cuándo la aceptó (`students.privacy_accepted_at`).

## Cómo se vinculan las dos apps

1. **Un alumno nuevo se registra solo**: nombre y apellido, WhatsApp, peso aproximado y experiencia, más su usuario y contraseña. Se crea su ficha en la gestión, sin precio.
2. Pide su clase eligiendo día y horario en el calendario (los horarios ocupados aparecen como *Reservado*).
3. En la app de gestión aparece en **Solicitudes** (y un aviso en el Dashboard) con todos sus datos y la clase pedida. **El administrador solo pone el precio por hora** y confirma; para un alumno que ya tiene precio, viene completado.
4. El instructor da la clase y la marca como dada: se registra sola en la gestión con ese precio.

## Seguridad y privacidad

- Cada persona entra con **su usuario y contraseña**. Los alumnos nuevos se registran solos; los alumnos que la escuela ya tenía cargados y los instructores usan un **código de invitación** (ficha del alumno o tarjeta del instructor → **Invitar a la app**, se manda por WhatsApp). El código vale 30 días y se usa una sola vez.
- Un alumno sin precio puede pedir clases y el instructor confirmarlas, pero la clase solo se puede cerrar cuando la escuela puso el precio.
- Un alumno **nunca** ve precios, pagos ni datos de otros alumnos: la base de datos se lo impide (Row Level Security y funciones que devuelven solo sus horas, sin importes).
- Un instructor solo confirma, cambia o cierra sus propias clases. Los dueños entran como administradores.
- La app de gestión sigue siendo privada y no cambia.

## Puesta en marcha

1. **Base de datos**: aplicá las migraciones `../truevento-app/supabase/migrations/20261124000000_students_app.sql`, `20261125000000_push_notifications.sql`, `20261126000000_merge_instructors.sql` y `20261127000000_whatsapp_contact.sql` , `20261128000000_admin_code.sql` , `20261129000000_time_by_whatsapp.sql` , `20261130000000_admin_reschedule.sql` , `20261201000000_class_language.sql` y `20261202000000_school_rules.sql` (en ese orden) en el mismo proyecto Supabase (SQL Editor o `npx supabase db push`). En **Authentication → Sign In / Providers → Email** tienen que estar activados *Allow new users to sign up* y desactivado *Confirm email* (los usuarios no usan correos reales).
2. **Vercel**: nuevo proyecto con *Root Directory* `truevento-alumnos` y estas variables:

   | Variable | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | la misma URL de Supabase que la gestión |
   | `VITE_SUPABASE_ANON_KEY` | la misma clave publishable / anon |
   | `VITE_USERNAME_DOMAIN` | `truevento.com` (igual que la gestión) |
   | `VITE_VAPID_PUBLIC_KEY` | la clave pública de notificaciones (la misma que en la gestión; ver su README, *Notificaciones en el celular*) |

3. **Dominio `app.truevento.com`**: en Vercel, *Settings → Domains* del proyecto, agregá `app.truevento.com`. En Cloudflare (DNS de truevento.com) creá un registro **CNAME** `app` → `cname.vercel-dns.com` con el proxy desactivado (nube gris).
4. En el proyecto de **gestión**, `VITE_STUDENTS_APP_URL=https://app.truevento.com` (es el valor por defecto) y volvé a publicar.

## Camino de aprendizaje

Es el paso a paso de la escuela: **25 pasos en 4 niveles** — 1 · En tierra (reconocimiento del spot, direcciones de viento, armado, conexiones, sistemas de seguridad y quick release, ventana de viento, control del kite), 2 · En el agua (body drag, curvas de tracción, recuperación de la tabla, body drag segunda etapa, relanzamiento en el agua, quick release en el agua, autorrescate), 3 · Con la tabla (board grab, steady pull, waterstart sin y con tabla) y 4 · Navegación y autonomía (navegar a la derecha y a la izquierda, orzar, transiciones, downwind, aterrizaje del kite, relanzamiento y aterrizaje por el alumno).

Cada idioma usa los términos que usan los kiters de ese país: *body drag, waterstart, board grab, steady pull, downwind* y *quick release* quedan en inglés también en español y portugués; se dice *kite* (no "cometa" ni "pipa"), *orzar* en español y *orçar / velejar* en Brasil. Los pasos están en la migración `20261124000000_students_app.sql` (en español) y sus traducciones en `src/i18n/messages.ts` (`SKILLS`); `src/i18n/skills.test.ts` controla que no falte ninguna.

## Acceso de administración (código)

Los administradores (la dueña y quien gestiona el sistema) entran con un código en vez de una invitación: **Crear cuenta → ¿La escuela te mandó un código? → el código**, su nombre y apellido, usuario y contraseña. Después entran con el login normal. Quien se registra con el nombre de una dueña (por ejemplo Victoria Linde) queda vinculada a sus clases.

El código no está en el repositorio: se carga al publicar, guardado como hash, con usos y vencimiento:

```sql
insert into private.admin_codes (code_hash, uses_left, expires_at)
values (public.admin_code_hash('EL-CODIGO'), 2, now() + interval '30 days');
```

Cuando se gastan los usos o vence, deja de funcionar. Prueba: `../truevento-app/supabase/tests/admin_code.sql`.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # valores de `npx supabase status` (desde ../truevento-app)
npm run dev                  # http://localhost:5174
```

| Comando | Qué hace |
|---|---|
| `npm run build` | verifica tipos y compila la PWA en `dist/` |
| `npm test` | pruebas de fechas, horas, códigos y viento |

Las reglas de la base se prueban desde la app de gestión con `npm run db:test` (incluye `supabase/tests/students_app.sql`).
