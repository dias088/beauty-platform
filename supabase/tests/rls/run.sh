#!/usr/bin/env bash
# Проверка RLS и триггеров-защит на чистом локальном Postgres (не Supabase).
# Накатывает минимальную заглушку Supabase (роли anon/authenticated/service_role,
# auth.uid(), storage), все миграции по порядку и прогоняет сценарий:
# попытки подделки должны блокироваться, обычные действия — проходить.
#
#   PGDATABASE=bp_rls_test ./supabase/tests/rls/run.sh
#
# Нужны psql/createdb и права на создание БД. Живую базу НЕ трогает.
set -euo pipefail
cd "$(dirname "$0")"
DB="${PGDATABASE:-bp_rls_test}"
export PGOPTIONS="-c client_min_messages=warning"
MIGRATIONS=(../../migrations/*.sql)

dropdb --if-exists "$DB"
createdb "$DB"
for f in 00_supabase_shim.sql "${MIGRATIONS[@]}" 01_helpers.sql; do
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/dev/null
done

out=$(psql -q -d "$DB" -f 02_write_guards.sql 2>&1 | grep -oE "(PASS|FAIL) .*|^--- [A-Z].*|ERROR.*")
echo "$out"
dropdb "$DB"
if grep -qE "^(FAIL|ERROR)" <<<"$out"; then exit 1; fi
