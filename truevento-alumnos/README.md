# TRUEVENTO · App de alumnos e instructores

Aplicación web progresiva (PWA) donde los alumnos de TRUEVENTO Kiteschool ven sus clases, piden horarios, siguen su progreso y el pronóstico del viento, y los instructores manejan su agenda y marcan lo que aprendió cada alumno.

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

## Seguridad y privacidad

- Cada persona entra con **su usuario y contraseña**. Para crear la cuenta necesita un **código de invitación** que genera la escuela desde la app de gestión (ficha del alumno o tarjeta del instructor → **Invitar a la app**), y que se manda por WhatsApp con un toque. El código vale 30 días y se usa una sola vez.
- Un alumno **nunca** ve precios, pagos ni datos de otros alumnos: la base de datos se lo impide (Row Level Security y funciones que devuelven solo sus horas, sin importes).
- Un instructor solo confirma, cambia o cierra sus propias clases. Los dueños entran como administradores.
- La app de gestión sigue siendo privada y no cambia.

## Puesta en marcha

1. **Base de datos**: aplicá la migración `../truevento-app/supabase/migrations/20261124000000_students_app.sql` en el mismo proyecto Supabase (SQL Editor o `npx supabase db push`). En **Authentication → Sign In / Providers → Email** tienen que estar activados *Allow new users to sign up* y desactivado *Confirm email* (los usuarios no usan correos reales).
2. **Vercel**: nuevo proyecto con *Root Directory* `truevento-alumnos` y estas variables:

   | Variable | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | la misma URL de Supabase que la gestión |
   | `VITE_SUPABASE_ANON_KEY` | la misma clave publishable / anon |
   | `VITE_USERNAME_DOMAIN` | `truevento.com` (igual que la gestión) |

3. En el proyecto de **gestión**, agregá `VITE_STUDENTS_APP_URL` con la dirección de esta app (por ejemplo `https://truevento-alumnos.vercel.app`) y volvé a publicar, para que las invitaciones lleven el link correcto.

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
| `npm run build:demo` | `dist-demo/truevento-alumnos-demo.html`: la app en una sola página con datos de ejemplo en el navegador |

Las reglas de la base se prueban desde la app de gestión con `npm run db:test` (incluye `supabase/tests/students_app.sql`).
