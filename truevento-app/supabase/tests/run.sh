#!/usr/bin/env bash
# Runs the database rule tests against the local Supabase stack (npx supabase start).
set -euo pipefail
cd "$(dirname "$0")"
for f in rules.sql students_app.sql push.sql merge.sql whatsapp.sql admin_code.sql time_whatsapp.sql reschedule.sql class_language.sql school_rules.sql agenda_contact.sql; do
  PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -X -q -P footer=off -P tuples_only=on -f "$f"
done
