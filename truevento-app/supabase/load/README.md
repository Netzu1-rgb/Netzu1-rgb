# Prueba de carga (solo base local)

Para medir la base con muchos datos y muchos usuarios a la vez. **Nunca contra producción.**

1. Base local con datos de la prueba completa (`npx supabase start`, `db reset` y la e2e).
2. `psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f seed.sql`: agrega 3000 alumnos, 60.000 pedidos y 39.000 clases.
3. `bash bench.sh`: tiempo de las consultas más usadas, como administrador y como alumno.
4. `npm i autocannon && node http-load.cjs`: 50 y 200 alumnos abriendo la app a la vez, por la misma API que usan los celulares.

Resultados del 27/11/2026 (máquina de 4 núcleos):

| Consulta | Antes de `20261207000000_fast_security_rules.sql` | Después |
|---|---|---|
| Alumno: sus clases | 4238 ms | 5 ms |
| Alumno: su agenda (3 meses) | 1618 ms | 10 ms |
| Administrador: agenda de la semana | 599 ms | 11 ms |
| Administrador: clases del mes | 150 ms | 3 ms |
| Administrador: lista de alumnos | 174 ms | 7 ms |
| Alumno: horarios ocupados (2 meses) | — | 18 ms |

Carga: 50 y 200 usuarios a la vez → ~400 consultas/s, 0 errores (abrir la app son ~4 consultas).
