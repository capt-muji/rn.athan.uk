#!/usr/bin/env bash
# Preflight for ticket 131. Save a copy to $TMPDIR and run it from there, with
# SERIAL_3T and IPHONE_UDID exported to the real device identifiers.
set -u
REPO="${REPO:-$HOME/repos/rn.athan.uk}"
PLAN=ai/plans/131-six-readings

fail() { echo "PREFLIGHT FAILED: $*"; exit 1; }

cd "$REPO" || fail "no repo at $REPO"
[ "$(git rev-parse --abbrev-ref HEAD)" = "uat" ] || fail "main tree not on uat"
[ -z "$(git status --porcelain)" ] || fail "main tree dirty"
git fetch -q origin uat || fail "git fetch origin uat"
git merge-base --is-ancestor origin/uat uat || fail "origin/uat not merged into uat"

CURRENT=$(node -e 'process.stdout.write(require("./package.json").version)')
node -e "const c='$CURRENT'.split('.').map(Number),m=[2,0,984];let ok=c[0]>m[0]||(c[0]===m[0]&&(c[1]>m[1]||(c[1]===m[1]&&c[2]>=m[2])));process.exit(ok?0:1)" \
  || fail "version $CURRENT lower than planned-at 2.0.984"

grep -q "^| 124 |.*DONE" ai/plans/README.md || fail "row 124 not DONE"
grep -q "^| 131 |.*NOT PLANNED\|^| 131 |.*PLANNING\|^| 131 |.*READY\|^| 131 |.*IN PROGRESS\|^| 131 |.*EXECUTED" ai/plans/README.md \
  || fail "row 131 not in a plannable or executing state"

for a in "$PLAN"/scripts/anchors/*.txt; do
  name=$(basename "$a" .txt)
  src=$(head -1 "$a" | sed 's/^source: //')
  [ -f "$src" ] || fail "anchor $name source missing: $src"
  count=$(python3 -c '
import sys
anchor = open(sys.argv[1]).read().split("\n", 1)[1]
print(open(sys.argv[2]).read().count(anchor))
' "$a" "$src")
  [ "$count" = "1" ] || fail "anchor $name counts $count in $src, expected 1"
done

for t in adb zsh python3 node git; do
  command -v "$t" >/dev/null 2>&1 || fail "tool missing: $t"
done
AAPT2=$HOME/Library/Android/sdk/build-tools/37.0.0/aapt2
[ -x "$AAPT2" ] || fail "aapt2 missing at $AAPT2"
command -v pymobiledevice3 >/dev/null 2>&1 || fail "pymobiledevice3 missing"
command -v agent-device >/dev/null 2>&1 || fail "agent-device missing"
xcrun devicectl list devices >/dev/null 2>&1 || fail "devicectl unavailable"

[ -n "${SERIAL_3T:-}" ] || fail "SERIAL_3T not exported"
adb devices | grep -qw "$SERIAL_3T" || fail "3T $SERIAL_3T not visible to adb"
[ -n "${IPHONE_UDID:-}" ] || fail "IPHONE_UDID not exported"
xcrun devicectl list devices 2>/dev/null | grep -q "$IPHONE_UDID" \
  || echo "NOTE: XS not connected yet; step 2 needs it attached"

echo "PREFLIGHT OK"
