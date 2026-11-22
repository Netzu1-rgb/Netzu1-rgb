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
supabase/migrations/   esquema, reglas, RLS y funciones (una migración)
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

## Funcionamiento sin conexión

- El service worker guarda la app completa: abre sin internet.
- Lo que ya se cargó (alumnos, clases, dashboard) queda en caché en el dispositivo y se muestra con un aviso cuando no hay conexión. La base de datos real es siempre Postgres; el dispositivo no se usa como base principal.
- Una clase (o un alumno nuevo) guardada sin conexión queda en una cola del dispositivo y se envía sola al volver internet. Cada registro lleva un identificador generado en el teléfono, así que aunque se envíe dos veces se guarda una sola vez.
- Si el servidor rechaza un registro pendiente (por ejemplo, el instructor fue desactivado), aparece en Configuración con el motivo y se puede descartar.

## Puesta en marcha

### 1. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Aplicá la migración. Con la CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase db push
   ```
   O copiá el contenido de `supabase/migrations/20261119000000_init.sql` en el **SQL Editor** y ejecutalo.
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
