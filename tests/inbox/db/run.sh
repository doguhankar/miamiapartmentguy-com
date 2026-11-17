#!/usr/bin/env bash
# Runs the real inbox migrations against a throwaway local Postgres and executes
# the SQL authorization/RLS tests. Touches nothing outside a temp directory.
#   usage: tests/inbox/db/run.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
PORT="${PGTEST_PORT:-54329}"
DIR="$(mktemp -d /tmp/mag-pgtest.XXXXXX)"
RUN=""
if [ "$(id -u)" = "0" ]; then
  chown postgres:postgres "$DIR"; chmod 755 "$ROOT" "$ROOT/tests" "$ROOT/tests/inbox" "$ROOT/tests/inbox/db" "$ROOT/supabase" "$ROOT/supabase/migrations" 2>/dev/null || true
  RUN="runuser -u postgres --"
fi

cleanup() { $RUN "$PGBIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT

$RUN "$PGBIN/initdb" -D "$DIR/data" -A trust -U postgres >/dev/null
$RUN "$PGBIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" -w start >/dev/null

PSQL=($RUN "$PGBIN/psql" -h "$DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -d postgres -c "create database mag_test" >/dev/null
P=("${PSQL[@]}" -d mag_test)

export PGOPTIONS='-c client_min_messages=warning'
echo "== stubs"
"${P[@]}" -f "$ROOT/tests/inbox/db/stubs.sql" >/dev/null 2>&1
echo "== production baseline (reconciled migrations)"
"${P[@]}" -f "$ROOT/supabase/migrations/20261116173508_unified_inbox_conversations_messages.sql" >/dev/null
"${P[@]}" -f "$ROOT/supabase/migrations/20261116173559_inbox_find_lead_by_phone.sql" >/dev/null
echo "== v2 migration"
"${P[@]}" -f "$ROOT/supabase/migrations/20261117000000_social_inbox_v2.sql" >/dev/null
echo "== v2 migration again (must be re-runnable)"
"${P[@]}" -f "$ROOT/supabase/migrations/20261117000000_social_inbox_v2.sql" >/dev/null
echo "== tests"
PGOPTIONS='-c client_min_messages=notice' "${P[@]}" -f "$ROOT/tests/inbox/db/tests.sql" >"$DIR/out.txt" 2>&1 && RC=0 || RC=$?
sed -E 's#^psql:[^ ]+ ##; s#NOTICE:  ##' "$DIR/out.txt" | grep -E "PASS|FAIL|ERROR|──|ALL DB" || true
if [ "$RC" != "0" ]; then echo "TESTS FAILED"; exit 1; fi
