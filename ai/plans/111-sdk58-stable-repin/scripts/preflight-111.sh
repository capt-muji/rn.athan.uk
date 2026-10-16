#!/usr/bin/env bash
# Pre-flight for plan 111. Run from a saved copy in $TMPDIR against the uat checkout.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

echo "== branch and tree =="
[ "$(git rev-parse --abbrev-ref HEAD)" = "uat" ] || { echo "FAIL not on uat"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "FAIL tree not clean"; exit 1; }
git fetch origin --quiet
[ -z "$(git log --oneline origin/uat..uat)" ] || { echo "FAIL uat has unpushed commits; the audit runs first"; exit 1; }
[ -z "$(git log --oneline uat..origin/uat)" ] || { echo "FAIL uat is behind origin/uat; pull first"; exit 1; }

echo "== version floor =="
v=$(node -e "console.log(require('./package.json').version)")
python3 - "$v" << 'EOF'
import sys
have = tuple(int(x) for x in sys.argv[1].split('.'))
need = (2, 0, 854)
if have < need:
    print(f"FAIL version {have} below planned floor {need}")
    sys.exit(1)
print("version", have, ">= floor", need)
EOF

echo "== no other ticket in flight (row 111 excepted) =="
inflight=$(grep -E "\| (PLANNING|READY|IN PROGRESS|EXECUTED)[ (]" ai/plans/README.md | grep -v "^| 111 " || true)
[ -z "$inflight" ] || { echo "FAIL another ticket is in flight:"; echo "$inflight"; exit 1; }

echo "== anchors =="
bash ai/plans/111-sdk58-stable-repin/scripts/anchors-check.sh

echo "== npm drift check (section 2.2 STOP if moved) =="
node -e "
const want = { expo: '58.0.12', 'react-native': '0.88.0', 'expo-background-task': '58.0.11', 'expo-location': '58.0.16', 'expo-widgets': '58.0.19' };
const https = require('https');
const get = (p) => new Promise((res, rej) => https.get('https://registry.npmjs.org/' + p + '/latest', (r) => { let b=''; r.on('data',(c)=>b+=c); r.on('end',()=>res(JSON.parse(b).version)); }).on('error', rej));
(async () => { let bad = 0; for (const [p, v] of Object.entries(want)) { const got = await get(p); const ok = got === v; if (!ok) bad++; console.log((ok?'OK  ':'DRIFT'), p, 'plan', v, 'npm', got); } if (bad) { console.log('FAIL npm moved past the plan; NEEDS REPLAN'); process.exit(1); } })();
"

echo "PREFLIGHT OK"
