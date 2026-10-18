#!/usr/bin/env bash
# Ticket 144 pre-flight. Copy to $TMPDIR and run from the repository root.
# This ticket has no code path: the checks cover the checkout, the free ports,
# the absent committed secret, the version and every anchor.
set -u
fail=0
reasons=""
ROOT="$(git rev-parse --show-toplevel)"
SESSION="$HOME/athan-gitree/sessions/144"
CHECKOUT="$SESSION/itsaplan"
ENV_FILE="$SESSION/.env"

say() { reasons="${reasons}$1\n"; fail=1; }

[ -n "$ROOT" ] || say "not inside a git repository"

ver="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
python3 - "$ver" <<'EOF' || say "package.json version $ver is below 2.0.1092"
import sys
sys.exit(0 if tuple(int(x) for x in sys.argv[1].split(".")) >= (2, 0, 1092) else 1)
EOF

[ -f "$ROOT/ai/plans/README.md" ] || say "queue file missing"
grep -qF "| 144 | The board as a portable product, take three: It's a Plan (itsaplan.dev)" "$ROOT/ai/plans/README.md" \
  || say "queue row 144 missing"

[ -f "$CHECKOUT/docker-compose.yml" ] || say "product checkout missing at $CHECKOUT"
grep -qF "ghcr.io/croffasia/itsaplan-api:" "$CHECKOUT/docker-compose.yml" \
  || say "compose file does not pin the itaplan-api image"

[ -f "$ENV_FILE" ] || say "env file missing at $ENV_FILE"
if [ -f "$ENV_FILE" ]; then
  for key in POSTGRES_PASSWORD BETTER_AUTH_SECRET APP_ENCRYPTION_KEY S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY API_URL APP_URL VERSION; do
    grep -qE "^${key}=.+" "$ENV_FILE" || say "env file has no value for $key"
  done
  if git -C "$ROOT" ls-files --error-unmatch "$ENV_FILE" >/dev/null 2>&1; then
    say "env file is tracked by git"
  fi
fi

case "$ENV_FILE" in
  "$ROOT"/*) say "env file sits inside the repository tree" ;;
esac

for port in 3000 3001; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    docker ps --format '{{.Names}} {{.Ports}}' | grep -q ":$port->" \
      || say "port $port is listening and no compose container holds it"
  fi
done

for anchor in "$ROOT/ai/plans/144-itsaplan-board/scripts/anchors"/*.txt; do
  name="$(basename "$anchor" .txt)"
  case "$name" in
    reader-status-map|reader-done-top) source="$ROOT/board/reader.mjs" ;;
    *) source="" ;;
  esac
  if [ -z "$source" ] || [ ! -f "$source" ]; then
    say "anchor $name has no source file"
    continue
  fi
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor" "$source")"
  [ "$count" = "1" ] || say "anchor $name counts $count in $source, must be 1"
done

if [ "$fail" -eq 0 ]; then
  echo "PREFLIGHT OK"
  exit 0
fi
printf 'PREFLIGHT FAILED\n'
printf "$reasons"
exit 1
