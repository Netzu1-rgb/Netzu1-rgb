#!/usr/bin/env bash
# Runs the database rule tests against the local Supabase stack (npx supabase start).
set -euo pipefail
cd "$(dirname "$0")"
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -X -q -P footer=off -P tuples_only=on -f rules.sql
