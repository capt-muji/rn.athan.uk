#!/usr/bin/env bash
# 58a step 1: the gate can fail in both directions, or it guards nothing.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
AL=scripts/directional-styles-allowlist.json
GATE="npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit"
cp "$AL" "$TMPDIR/allowlist-58a-backup.json"

# direction 1: deleting a permanent entry exposes its line as a remainder hit
node -e "const fs=require('fs');const l=JSON.parse(fs.readFileSync(process.argv[1]));fs.writeFileSync(process.argv[1],JSON.stringify(l.filter(e=>!(e.file==='components/ui/RamadanDecorations.tsx'&&e.snippet==='left: cx - r,')),null,2)+'\n')" "$AL"
if $GATE > "$TMPDIR/gate-break1.log" 2>&1; then
  echo "BREAK NOT APPLIED: the gate passed with a permanent entry deleted"; exit 1
fi
grep -q "components/ui/RamadanDecorations.tsx" "$TMPDIR/gate-break1.log" || { echo "BREAK NOT APPLIED: the failure did not name the site"; exit 1; }
cp "$TMPDIR/allowlist-58a-backup.json" "$AL"

# direction 2: an entry whose snippet matches nothing is stale
node -e "const fs=require('fs');const l=JSON.parse(fs.readFileSync(process.argv[1]));l.push({file:'components/overlay/Overlay.tsx',snippet:'left: NOTHING_MATCHES_THIS',reason:'break fixture'});fs.writeFileSync(process.argv[1],JSON.stringify(l,null,2)+'\n')" "$AL"
if $GATE > "$TMPDIR/gate-break2.log" 2>&1; then
  echo "BREAK NOT APPLIED: the gate passed with a stale entry"; exit 1
fi
grep -q "NOTHING_MATCHES_THIS" "$TMPDIR/gate-break2.log" || { echo "BREAK NOT APPLIED: the failure did not name the entry"; exit 1; }
cp "$TMPDIR/allowlist-58a-backup.json" "$AL"

$GATE > "$TMPDIR/gate-break3.log" 2>&1
tail -4 "$TMPDIR/gate-break3.log"
node scripts/check-directional-styles.js > "$TMPDIR/gate-cli-restore.log" 2>&1 || { echo "BREAK NOT RESTORED: the CLI still fails"; cat "$TMPDIR/gate-cli-restore.log"; exit 1; }
cmp -s "$AL" "$TMPDIR/allowlist-58a-backup.json" || { echo "BREAK NOT RESTORED: the allowlist differs from its backup"; exit 1; }
echo "ALL ASPECTED: 1"
