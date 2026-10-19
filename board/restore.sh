#!/usr/bin/env bash
# Rebuild the board from a snapshot. Both schemas are dropped and the file is
# replayed, so this is a full replacement and works against an empty database as
# well as a populated one.
#
# Usage: restore.sh [file]     (default: snapshot/board.sql)
set -euo pipefail
cd "$(dirname "$0")"

file="${1:-snapshot/board.sql}"
test -f "$file" || { echo "no $file to restore" >&2; exit 1; }

psql() {
  docker compose --env-file env exec -T postgres psql -U itsaplan -d itsaplan -v ON_ERROR_STOP=1 "$@"
}

# The api holds pooled connections and prepared statements against the schema
# that is about to go, so it is stopped for the swap and started after.
docker compose --env-file env stop api > /dev/null
psql -c 'drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;' > /dev/null
psql < "$file" > /dev/null
docker compose --env-file env start api > /dev/null

printf 'restored %s rows from %s\n' "$(grep -c '^INSERT INTO\|^COPY ' "$file")" "$file"
