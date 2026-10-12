#!/usr/bin/env bash
# Pre-flight for job 56. Save a copy to $TMPDIR and run it from there.
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null)" || { echo 'not in the repository'; exit 1; }

[ "$(git rev-parse --abbrev-ref HEAD)" = "uat" ] || { echo 'not on uat'; exit 1; }
git fetch origin >/dev/null 2>&1 || { echo 'git fetch failed'; exit 1; }
behind=$(git rev-list --count uat..origin/uat)
[ "$behind" = "0" ] || { echo "origin/uat is $behind commits ahead: merge first"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo 'tree not clean'; git status --porcelain | head -5; exit 1; }

version=$(node -e "console.log(require('./package.json').version)")
python3 - "$version" <<'EOF' || exit 1
import sys
v = sys.argv[1].split('.')
need = (2, 0, 67)
if tuple(map(int, v[:3])) < need:
    print(f'version {sys.argv[1]} is below the planned 2.0.67')
    sys.exit(1)
EOF

row=$(awk -F'|' '/^\| 56 \| Ticket board/ {print $4}' ai/plans/README.md)
echo "$row" | grep -Eq 'PLANNING|READY|IN PROGRESS|EXECUTED' || { echo "queue row 56 cannot run: $row"; exit 1; }

node_major=$(node --version | sed 's/v\([0-9]*\).*/\1/')
[ "$node_major" -ge 24 ] || { echo "node $node_major is below 24"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo 'docker compose unavailable'; exit 1; }
docker info >/dev/null 2>&1 || { echo 'docker daemon not running (start OrbStack)'; exit 1; }

bash ai/plans/56-ticket-board/scripts/anchor-check.sh | grep -q 'ANCHORS OK' || { echo 'anchor check failed'; exit 1; }

echo 'PREFLIGHT OK'
