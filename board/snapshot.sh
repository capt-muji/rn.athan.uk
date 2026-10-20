#!/usr/bin/env bash
# Write the committed snapshot of the board. Run at the end of a run, in the
# same commit as the run's work. Safe to run while the stack is up.
set -euo pipefail
cd "$(dirname "$0")"

out=snapshot/board.sql
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

# Every table's schema is included, and every table's rows except the
# credential and session tables (session, account, apikey, jwks,
# oauth_resource): tokens, keys, passwords and login state never belong in
# git, and a restored board issues fresh ones through its own setup. The one
# row per line format keeps a ticket moving between columns as a one line
# diff.
docker compose --env-file env exec -T postgres \
  pg_dump -U athan -d athan \
  --no-owner --no-privileges \
  --inserts --column-inserts \
  --exclude-table-data=session \
  --exclude-table-data=account \
  --exclude-table-data=apikey \
  --exclude-table-data=jwks \
  --exclude-table-data=oauth_resource \
  > "$tmp"

# The board's own texts are published with the snapshot, so the dump answers to the same gate the
# commits do: a row quoting a term the repository may never carry is refused before it lands.
node ../scripts/check-identifiers.js --file "$tmp" \
  || { echo "snapshot refused: the dump carries a term the repository may never carry" >&2; exit 1; }

mv "$tmp" "$out"
printf 'snapshot written: %s rows, %s bytes\n' \
  "$(grep -c '^INSERT INTO' "$out")" "$(wc -c < "$out" | tr -d ' ')"
