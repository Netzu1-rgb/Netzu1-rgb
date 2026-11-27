#!/bin/bash
# Times the app's most used queries as an admin and as a student (local database).
# Each query runs 5 times; prints the median execution time in ms.
DB="psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -XtAq"
export PGPASSWORD=postgres
ADMIN=$($DB -c "select id from public.profiles where role='admin' and username is distinct from 'x' order by created_at limit 1")
STUDENT=$($DB -c "select p.id from public.profiles p join public.students s on s.id=p.student_id where s.full_name='Ana Silva'")

run() { # who, label, sql
  local who=$1 label=$2 sql=$3 times=()
  for i in 1 2 3 4 5; do
    t=$($DB <<EOF | grep -o 'Execution Time: [0-9.]*' | grep -o '[0-9.]*$'
select set_config('request.jwt.claims', json_build_object('sub', '$who', 'role', 'authenticated')::text, false);
set role authenticated;
explain (analyze, format text) $sql;
EOF
)
    times+=("$t")
  done
  med=$(printf '%s\n' "${times[@]}" | sort -n | sed -n 3p)
  printf '%-48s %8s ms\n' "$label" "$med"
}

run "$ADMIN"   "admin · clases del último mes (inicio)"     "select * from public.classes where class_date >= current_date - 30"
run "$ADMIN"   "admin · lista de alumnos"                   "select id, full_name from public.students where active order by lower(full_name)"
run "$ADMIN"   "admin · solicitudes pendientes"             "select * from public.lessons where status = 'requested' and lesson_date >= current_date order by lesson_date"
run "$ADMIN"   "admin · agenda de la semana"                "select * from public.agenda(current_date, current_date + 7)"
run "$ADMIN"   "admin · alumnos de la app"                  "select * from public.app_students()"
run "$STUDENT" "alumno · su agenda (3 meses)"                "select * from public.agenda(current_date - 30, current_date + 60)"
run "$STUDENT" "alumno · sus clases (lectura directa)"      "select * from public.lessons"
run "$STUDENT" "alumno · su resumen"                        "select public.my_student_summary()"
run "$STUDENT" "alumno · horarios ocupados (2 meses)"         "select * from public.busy_slots(current_date, current_date + 60)"
