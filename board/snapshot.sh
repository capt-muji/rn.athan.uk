#!/usr/bin/env bash
# Write the committed snapshot of the board. Run at the end of a run, in the
# same commit as the run's work. Safe to run while the stack is up.
set -euo pipefail
cd "$(dirname "$0")"

out=snapshot/board.sql
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

# Every table is included, schema and rows, so restore.sh can rebuild the whole
# database from this one file. The one row per line format keeps a ticket moving
# between columns as a one line diff.
docker compose --env-file env exec -T postgres \
  pg_dump -U itsaplan -d itsaplan \
  --no-owner --no-privileges \
  --inserts --column-inserts \
  > "$tmp"

mv "$tmp" "$out"
printf 'snapshot written: %s rows, %s bytes\n' \
  "$(grep -c '^INSERT INTO' "$out")" "$(wc -c < "$out" | tr -d ' ')"
