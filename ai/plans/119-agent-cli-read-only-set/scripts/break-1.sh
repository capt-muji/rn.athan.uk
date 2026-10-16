#!/bin/bash
# Break script for step 1. Proves the four landed rows, the unchanged status row and every
# widened ban name by exact line counts against ai/AGENTS.md. Ends ALL AS EXPECTED: 1.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
F=ai/AGENTS.md
ok=1

check() {
  n=$(grep -cF -- "$2" "$F")
  if [ "$n" = "$1" ]; then
    echo "ok   $3 ($n)"
  else
    echo "FAIL $3: got $n, want $1"
    ok=0
  fi
}

check 1 '| Expo project health check (advisory) | `npx @expo/agent-cli doctor` |' 'doctor row'
check 1 '| Quick type check (tsc only, not the gate) | `npx @expo/agent-cli typecheck` |' 'typecheck row'
check 1 '| Expo docs lookup, SDK-matched | `npx @expo/agent-cli docs:sync` / `docs:search` |' 'docs row'
check 1 '| Expo dev-server session tables | `npx expo command:ps` / `command:events` |' 'session tables row'
check 1 '| Expo project status and smoke | `npx @expo/agent-cli status` / `smoke --ios` |' 'status row unchanged'
check 1 '| Gate before done | `yarn validate` |' 'gate row unchanged'

check 1 'the routed reads only' 'allowlist opening'
for name in deploy agents:setup skills:sync skills:clean install new feedback login logout register whoami; do
  check 1 "\`$name\`" "ban name \`$name\`"
done
check 1 '`status --explain` (an EAS service query)' 'ban status --explain'
check 1 '`--device`' 'ban --device'
check 1 '(it launches or binds a phone)' 'ban --device ground'
check 1 '`--eas` (it starts a paid EAS Simulator session)' 'ban --eas'
check 1 '`smoke --android` while a phone is connected' 'ban smoke --android'

# The routing table holds exactly 13 data rows (9 before, 4 added): header plus separator
# plus 13 rows, from the "## Tool routing" heading to the blank line that ends the table.
rows=$(awk '/^## Tool routing/{f=1;next} f&&/^\|/{n++} f&&n&&/^$/{exit} END{print n+0}' "$F")
if [ "$rows" = "15" ]; then
  echo "ok   routing table line count ($rows)"
else
  echo "FAIL routing table line count: got $rows, want 15"
  ok=0
fi

if [ "$ok" = "1" ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "ALL AS EXPECTED: 0"
  exit 1
fi
