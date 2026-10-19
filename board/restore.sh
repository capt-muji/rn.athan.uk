#!/usr/bin/env bash
# Rebuild the board from the committed snapshot. The schema is dropped and
# recreated from the file, so this is a full replacement and works against an
# empty database as well as a populated one.
set -euo pipefail
cd "$(dirname "$0")"

test -f snapshot/board.sql || { echo "no snapshot/board.sql to restore" >&2; exit 1; }

psql() {
  docker compose --env-file env exec -T postgres psql -U itsaplan -d itsaplan -v ON_ERROR_STOP=1 "$@"
}

psql -c 'drop schema public cascade; create schema public;' > /dev/null
psql < snapshot/board.sql > /dev/null
# The api holds pooled connections and prepared statements against the dropped
# schema, so it is restarted to pick the restored one up.
docker compose --env-file env restart api > /dev/null

printf 'restored %s rows from snapshot/board.sql\n' \
  "$(grep -c '^INSERT INTO' snapshot/board.sql)"
