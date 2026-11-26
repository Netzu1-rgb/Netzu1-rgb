# TRUEVENTO · Gestión de la escuela de kiteboarding

Aplicación web progresiva (PWA) para registrar alumnos, clases, horas, ingresos y pagos a instructores de TRUEVENTO Kiteschool. Se instala en Android, iOS y computadoras, funciona desde el celular después de cada clase y permite cargar clases sin conexión.

## Arquitectura

```
┌──────────────────────────────┐      ┌──────────────────────────────────────────┐
│ Frontend (Vercel, estático)  │      │ Supabase                                 │
│ React + Vite + Tailwind      │─────▶│ Auth: usuarios y sesiones                │
│ PWA: manifest + service      │ HTTPS│ PostgreSQL: datos, reglas de negocio y   │
│ worker (Workbox)             │      │   seguridad por filas (RLS)              │
│ IndexedDB: caché offline y   │      │ Funciones SQL: configuración inicial,    │
│   cola de clases pendientes  │      │   liquidaciones                          │
└──────────────┬───────────────┘      └──────────────────▲───────────────────────┘
               │ /api/users                              │ service role
┌──────────────▼───────────────┐                         │
│ Backend (Vercel Function)    │─────────────────────────┘
│ Crea accesos de instructores │
│ (solo administradores)       │
└──────────────────────────────┘
```

- **Base de datos (`supabase/migrations`)**: toda la lógica económica vive en Postgres. Los totales de cada clase son columnas calculadas (`total = round(horas × precio, 2)`, `pago instructor = round(horas × pago/h, 2)`, `ganancia = total − pago`). Cada clase guarda una copia del precio del alumno y del pago del instructor vigentes al registrarla, así que cambiar precios después no altera el pasado.
- **Seguridad**: Row Level Security en todas las tablas. Un instructor solo ve sus clases, su ficha y sus liquidaciones; no puede fijar su propio pago (se toma de su ficha), ni editar o borrar clases, ni tocar configuraciones o liquidaciones. Las liquidaciones solo se crean con la función `pay_settlement`.
- **Backend (`api/users.ts`)**: crear usuarios requiere la clave de servicio de Supabase, por eso vive en una Vercel Function que primero verifica que quien llama es administrador.
- **Frontend (`src/`)**: React mobile first. `src/lib/api.ts` concentra todas las consultas; `src/lib/offline.ts` maneja la caché y la cola offline.

### Estructura

```
supabase/migrations/   esquema, reglas, RLS y funciones (gestión + app de alumnos)
supabase/tests/        pruebas de reglas y permisos (npm run db:test)
api/users.ts           función de servidor para accesos
src/pages/             pantallas: Dashboard, Registrar clase, Alumnos, Instructores, Liquidaciones, Historial, Configuración
src/components/        interfaz reutilizable
src/lib/               datos, dinero, fechas, offline, CSV
public/                logo de TRUEVENTO, íconos de la app (generados del logo) y fuentes
```

## Reglas de negocio

1. Al registrar una clase se indica el alumno, su precio por hora y quién la da. Cada alumno puede pagar un precio distinto. Para un alumno existente el precio se completa desde su ficha y se puede cambiar solo para esa clase; un alumno nuevo se crea automáticamente con ese precio.
2. Cada instructor externo tiene su pago por hora; un administrador puede ajustarlo en una clase puntual.
3. Las clases de los dos dueños registran horas e ingresos, pero su pago de instructor es siempre 0.
4. Cada clase conserva los precios y pagos vigentes al momento de guardarla.
5. La ganancia de la escuela se calcula sola.
6. Una liquidación toma todas las clases pendientes de un instructor externo en un período, las marca como pagadas y ninguna puede entrar en otra liquidación. Si las clases cambiaron mientras el administrador revisaba, el pago se rechaza para que vuelva a calcular. Un pago registrado por error se puede anular y sus clases vuelven a quedar pendientes.
7. Las clases ya liquidadas no se pueden editar ni borrar.
8. Un instructor inactivo no puede cargar clases nuevas.

## App de alumnos e instructores

La carpeta `../truevento-alumnos` es una segunda app, conectada a esta misma base, donde los alumnos ven sus clases, piden horarios, siguen su progreso y el viento, y los instructores manejan su agenda. Se invita a cada persona desde acá: **ficha del alumno → Invitar a la app** o **Instructores → Invitar a la app** (genera un código y lo manda por WhatsApp). Las clases que un instructor cierra en esa app aparecen solas en el Historial con la nota "Desde la agenda". Ver `../truevento-alumnos/README.md`.

Los alumnos nuevos se registran solos en esa app con sus datos y piden su clase; acá aparecen en **Solicitudes** (con un aviso en el Dashboard) y el administrador solo pone el precio por hora y confirma.

Requiere la migración `20261124000000_students_app.sql` y la variable `VITE_STUDENTS_APP_URL` con la dirección de esa app.

## Notificaciones en el celular

Cuando un alumno pide una clase, al administrador le llega una notificación (aunque la app esté cerrada); cuando la escuela confirma, cambia, rechaza o cancela una clase, le llega al alumno en su idioma; si un alumno cancela, le llega al administrador. Se activan en cada dispositivo: **Solicitudes → Activar notificaciones** o **Configuración → Notificaciones** (en la app de alumnos, **Ajustes → Notificaciones** o el aviso en Inicio). En iPhone (iOS 16.4 o más) primero hay que instalar la app en la pantalla de inicio.

Cómo funciona: la migración `20261125000000_push_notifications.sql` guarda los dispositivos y, con un trigger en `lessons`, arma los mensajes y los manda por `pg_net` a la función **`/api/push`** de esta app, que los firma (VAPID) y los entrega. Si algo falla, la clase se guarda igual.

Para activarlo en producción:

1. Generá las claves una sola vez: `npx web-push generate-vapid-keys`, y un secreto largo: `openssl rand -hex 32`.
2. Vercel (gestión): `VAPID_PUBLIC_KEY`, `VITE_VAPID_PUBLIC_KEY` (la misma pública), `VAPID_PRIVATE_KEY`, `PUSH_SECRET`, `SUPABASE_ANON_KEY` y opcional `VAPID_SUBJECT` (`mailto:` de la escuela). Vercel (alumnos): `VITE_VAPID_PUBLIC_KEY`.
3. En el SQL Editor de Supabase, una vez:
   ```sql
   insert into private.push_config (url, secret)
   values ('https://TU-APP-DE-GESTION.vercel.app/api/push', 'EL_MISMO_PUSH_SECRET');
   ```

Pruebas: `supabase/tests/push.sql` (quién recibe qué y en qué idioma), `api/push.test.ts`, `tests/push/chain.mjs` (base → pg_net → /api/push → servicio de push falso que descifra el mensaje) y `tests/push/sw.cjs` (el service worker muestra la notificación en un navegador real).

## Cambiar la fecha de una clase (solo administración)

Si llueve o el viento no acompaña, en **Solicitudes → Próximas clases → Cambiar fecha** se elige el motivo (lluvia, sin viento, viento muy fuerte u otro), el nuevo día y el horario (los ocupados aparecen bloqueados). El alumno recibe la notificación con el motivo en su idioma y queda el botón **Avisar por WhatsApp** con el mensaje armado. Los instructores no pueden mover clases: confirman los pedidos en el día que pidió el alumno y pueden cancelar. En la app de alumnos, "Cambiar fecha" aparece solo para administradores. Migración: `20261130000000_admin_reschedule.sql` (prueba: `supabase/tests/reschedule.sql`).

## Horario y precio por WhatsApp

El alumno pide solo **el día y cuántas horas**; el **horario y el precio** se coordinan por WhatsApp. En **Solicitudes** se elige el *Horario acordado* (los horarios ocupados de ese día aparecen bloqueados), la duración, el precio y el instructor, y se confirma. Un pedido sin horario no ocupa lugar en el calendario; una clase confirmada siempre tiene horario. Migración: `20261129000000_time_by_whatsapp.sql` (prueba: `supabase/tests/time_whatsapp.sql`).

## Acordar el precio por WhatsApp

Cada alumno tiene que tener su WhatsApp para pedir una clase (se pide al registrarse, o en el último paso del pedido si no lo tenía). El precio se acuerda por WhatsApp antes de confirmar:

- **Alumno**: al enviar el pedido ve "En breve nos comunicaremos con vos por WhatsApp para acordar el precio por hora" y el botón **Escribirnos por WhatsApp**, con un mensaje armado (día, hora y duración) en su idioma. En la clase pendiente queda **Acordar el precio por WhatsApp**.
- **Gestión**: en cada solicitud, **Acordar precio por WhatsApp** abre el chat con el alumno y un mensaje de la escuela ("Te escribimos de Truevento Kiteschool…") en el idioma del alumno (el de su app o, si no, según su número), con el precio que se escribió en la tarjeta. Cuando lo acuerdan, se confirma la clase.
- **Clases sin precio**: si una clase quedó confirmada para un alumno sin precio por hora (por ejemplo, la agendó un instructor), aparece en Inicio ("N clases sin precio") y arriba de todo en Solicitudes como *Pendiente: falta el precio*, y cuenta en el globito rojo, hasta que se completa la casilla de precio.

El número de la escuela es el de la página (+54 9 221 545-1174); se cambia con `VITE_SCHOOL_WHATSAPP` en la app de alumnos. Migración: `20261127000000_whatsapp_contact.sql` (prueba: `supabase/tests/whatsapp.sql`).

## Un registro por instructor

Si al cargar una clase se escribe como "Otro instructor" un nombre que ya existe (sin importar mayúsculas, acentos o espacios), la app usa ese mismo instructor y avisa "ya está cargado: esta clase se suma a sus horas". La migración `20261126000000_merge_instructors.sql` une los instructores externos que ya estaban repetidos: pasa todas sus clases, liquidaciones, alumnos y accesos a uno solo, sin cambiar ningún importe (prueba: `supabase/tests/merge.sql`).

## Funcionamiento sin conexión

- El service worker guarda la app completa: abre sin internet.
- Lo que ya se cargó (alumnos, clases, dashboard) queda en caché en el dispositivo y se muestra con un aviso cuando no hay conexión. La base de datos real es siempre Postgres; el dispositivo no se usa como base principal.
- Una clase (o un alumno nuevo) guardada sin conexión queda en una cola del dispositivo y se envía sola al volver internet. Cada registro lleva un identificador generado en el teléfono, así que aunque se envíe dos veces se guarda una sola vez.
- Si el servidor rechaza un registro pendiente (por ejemplo, el instructor fue desactivado), aparece en Configuración con el motivo y se puede descartar.

## Puesta en marcha

### 1. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Aplicá las migraciones (en orden). Antes, hacé una copia de los datos. Con la CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase db push
   ```
   O copiá el contenido de cada archivo de `supabase/migrations/` (en orden) en el **SQL Editor** y ejecutalo.
3. En **Authentication → URL Configuration**, poné como *Site URL* la dirección de Vercel (por ejemplo `https://truevento.vercel.app`).
4. En **Project Settings → API** copiá: la URL del proyecto, la clave *anon/publishable* y la clave *service_role/secret* (esta última es secreta: solo va en Vercel, nunca en el frontend).

### 2. Vercel

1. Importá el repositorio en Vercel y elegí **`truevento-app`** como *Root Directory*. El framework se detecta como Vite.
2. Cargá estas variables de entorno (ver `.env.example`):

   | Variable | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | URL del proyecto Supabase |
   | `VITE_SUPABASE_ANON_KEY` | clave anon / publishable |
   | `VITE_USERNAME_DOMAIN` | `truevento.com` (un dominio que exista: Supabase rechaza correos de dominios inventados; no se envía ningún correo) |
   | `SUPABASE_URL` | URL del proyecto Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | clave service_role / secret |
   | `USERNAME_DOMAIN` | el mismo valor que `VITE_USERNAME_DOMAIN` |

3. Deploy. Vercel sirve todo por HTTPS, requisito para instalar la PWA.

### Modo de una sola persona (sin pantalla de ingreso)

Si la app la va a usar una sola persona con un enlace privado, agregá en Vercel la variable **`VITE_AUTO_LOGIN_PASSWORD`** con cualquier contraseña (8 caracteres o más) y volvé a publicar. Entonces:

- No hay pantalla de ingreso: la app entra sola con una cuenta interna (usuario `escuela`).
- La primera vez muestra solo la configuración inicial (escuela y dueños). Después abre directo, en cualquier dispositivo.
- En Supabase, **Authentication → Sign In / Providers → Email**, desactivá **Confirm email** antes de abrirla por primera vez.
- Cualquiera que tenga el enlace puede usar la app: no lo compartas.

Para volver al ingreso con usuario y contraseña, borrá la variable y publicá de nuevo.

### 3. Primer ingreso

1. Abrí la app: aparece **Bienvenido a TRUEVENTO** para crear la cuenta del administrador (email y contraseña). Si Supabase tiene activada la confirmación de email, confirmala desde el correo.
2. Completá la **configuración inicial**: nombre de la escuela, los dos dueños y la moneda.
3. **Recomendado**: en Supabase, **Authentication → Sign In / Providers**, desactivá *Allow new users to sign up*. Los accesos de instructores se crean desde la app (Instructores → Crear acceso) y siguen funcionando. Aunque alguien se registrara por su cuenta, no vería ningún dato hasta que un administrador le asigne un rol.
4. En **Instructores**, cargá los externos y creá su acceso (usuario y contraseña). Para el segundo dueño, usá **Crear acceso** en su tarjeta: entra como administrador.

## Desarrollo local

Requiere Node 22+ y Docker.

```bash
npm install
npx supabase start          # Postgres + Auth locales; aplica la migración
cp .env.example .env.local  # completar con los valores de `npx supabase status`
npm run dev                 # http://localhost:5173 (también sirve /api/users)
```

Comandos:

| Comando | Qué hace |
|---|---|
| `npm run dev` | app en modo desarrollo |
| `npm run build` | verifica tipos y compila la PWA en `dist/` |
| `npm test` | pruebas de cálculos (dinero, fechas, CSV, usuarios) |
| `npm run db:test` | pruebas de reglas y permisos en la base local |
| `npm run db:reset` | reinicia la base local |
| `npm run build:demo` | genera `dist-demo/truevento-demo.html`: la app completa en una sola página, con datos de ejemplo en el navegador y sin servidor (para mostrarla) |

La base local arranca vacía. Los datos de prueba se cargan desde la app; en producción no hay datos ficticios.

## Horas

Las duraciones se escriben y se muestran como horas:minutos (`1:30 hs`), en cuartos de hora (00, 15, 30 o 45 minutos). En la base se guardan como horas decimales (1:30 = 1,5) para que los importes sean exactos. El CSV trae las dos columnas: "Duración" (1:30 hs) y "Horas (decimal)" para hacer cuentas en Excel.

## Exportación

**Historial → Exportar** descarga un CSV pensado para Excel en español y portugués: separador `;`, decimales con coma y acentos correctos. Liquidaciones también permite exportar el detalle de un instructor.
