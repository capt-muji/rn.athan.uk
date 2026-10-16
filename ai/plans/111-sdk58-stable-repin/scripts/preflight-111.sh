#!/usr/bin/env bash
# Pre-flight for plan 111. Run from a saved copy in $TMPDIR against the uat checkout.
# It does not call scripts/anchors-check.sh: the anchors assert step 1's starting state and step 1
# runs them itself (the first attempt's audit finding 1).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

echo "== tree =="
[ -z "$(git status --porcelain)" ] || { echo "FAIL tree not clean"; exit 1; }
git fetch origin --quiet
[ -z "$(git log --oneline HEAD..origin/uat)" ] || { echo "FAIL HEAD is behind origin/uat; merge or rebase first"; exit 1; }
echo "on $(git rev-parse --abbrev-ref HEAD) at $(git rev-parse --short HEAD), origin/uat merged in"

echo "== version floor =="
v=$(node -e "console.log(require('./package.json').version)")
python3 - "$v" << 'EOF'
import sys
have = tuple(int(x) for x in sys.argv[1].split('.'))
need = (2, 0, 896)
if have < need:
    print(f"FAIL version {have} below planned floor {need}")
    sys.exit(1)
print("version", have, ">= floor", need)
EOF

echo "== in-flight rows (advisory: the orchestrator owns the lane's serialization) =="
grep -nE '^\| [0-9]+ \|.*\| (PLANNING|READY|IN PROGRESS|EXECUTED)[ ,]' ai/plans/README.md | cut -c1-120 || true

echo "== the patch files this plan starts from =="
for f in patches/expo-background-task+58.0.11.patch patches/expo-location+58.0.16.patch patches/expo-widgets+58.0.19.patch; do
  [ -f "$f" ] || { echo "FAIL missing $f"; exit 1; }
  echo "present $f"
done

echo "== anchor files present (their counts belong to step 1, which asserts the starting state) =="
for f in ai/plans/111-sdk58-stable-repin/scripts/anchors/*.txt; do
  [ -s "$f" ] || { echo "FAIL empty anchor $f"; exit 1; }
done
ls ai/plans/111-sdk58-stable-repin/scripts/anchors/*.txt | wc -l

echo "== npm drift check (section 2.2 STOP if moved) =="
node -e "
const want = { expo: '58.0.13', 'react-native': '0.88.0', 'expo-background-task': '58.0.11', 'expo-location': '58.0.17', 'expo-widgets': '58.0.20', '@expo/ui': '58.0.20', 'expo-notifications': '58.1.5', 'expo-router': '58.0.22', 'expo-haptics': '58.0.7', 'expo-splash-screen': '58.0.10' };
const https = require('https');
const get = (p) => new Promise((res, rej) => https.get('https://registry.npmjs.org/' + p + '/latest', (r) => { let b=''; r.on('data',(c)=>b+=c); r.on('end',()=>res(JSON.parse(b).version)); }).on('error', rej));
(async () => { let bad = 0; for (const [p, v] of Object.entries(want)) { const got = await get(p); const ok = got === v; if (!ok) bad++; console.log((ok?'OK  ':'DRIFT'), p, 'plan', v, 'npm', got); } if (bad) { console.log('FAIL npm moved past the plan; NEEDS REPLAN'); process.exit(1); } })();
"

echo "PREFLIGHT OK"
