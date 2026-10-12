#!/usr/bin/env bash
# 58a pre-flight: run from $TMPDIR against the repository, before any branch.
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo "$HOME/repos/rn.athan.uk")"
PLAN=ai/plans/58a-logical-edges
fail() { echo "PREFLIGHT FAILED: $1"; exit 1; }

[ "$(git rev-parse --abbrev-ref HEAD)" = "uat" ] || fail "not on uat"
status=$(git status --porcelain | grep -v -E "^\?\? $PLAN/|^ M ai/plans/README.md|^ M $PLAN/(PLAN|LOG)\.md" || true)
[ -z "$status" ] || { echo "$status"; fail "tree not clean apart from plan files"; }
git fetch -q origin uat
git merge-base --is-ancestor origin/uat uat || fail "origin/uat is not merged into uat"

ver=$(node -p "require('./package.json').version")
node -e "const v=process.argv[1].split('.').map(Number);if(!(v[0]>2||(v[0]===2&&v[1]>0)||v[2]>=85))process.exit(1)" "$ver" || fail "version $ver is lower than the planned-at 2.0.85"

grep -q "^| 39 | D4b. Translation sweep.*DONE" ai/plans/README.md || fail "needs-first row 39 is not DONE"
grep -q "^| 68 |" ai/plans/README.md || fail "queue row 68 (58b) is missing"

count() { python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$PLAN/scripts/anchors/$1" "$2"; }
check() { n=$(count "$1" "$2"); [ "$n" = "1" ] || fail "anchor $1 counts $n in $2"; }
check constants-prayer-padding.txt shared/constants.ts
check prayer-width-arithmetic.txt components/prayer/Prayer.tsx
check prayer-padding-style.txt components/prayer/Prayer.tsx
check alert-padding.txt components/prayer/Alert.tsx
check time-margin.txt components/prayer/Time.tsx
check overlay-catcher-inline.txt components/overlay/Overlay.tsx
check overlay-container-styles.txt components/overlay/Overlay.tsx
check infobox-inline.txt components/overlay/OverlayInfoBox.tsx
check infobox-styles.txt components/overlay/OverlayInfoBox.tsx
check veil-styles.txt components/overlay/VeilBackdrop.tsx
check sheet-inset.txt components/sheets/parts/Sheet.tsx
check sounditem-left.txt components/sheets/parts/SoundItem.tsx
check sounditem-right.txt components/sheets/parts/SoundItem.tsx
check stepper-margin.txt components/sheets/parts/Stepper.tsx
check segmented-indicator.txt components/sheets/parts/SegmentedControl.tsx
check segmented-iconlayer.txt components/sheets/parts/SegmentedControl.tsx
check qibla-styles.txt components/sheets/screens/Qibla.tsx
check sound-styles.txt components/sheets/screens/Sound.tsx
check language-padding.txt components/sheets/screens/Language.tsx
check settings-upper.txt components/sheets/screens/Settings.tsx
check settings-lower-a.txt components/sheets/screens/Settings.tsx
check settings-lower-b.txt components/sheets/screens/Settings.tsx
check help-styles-a.txt components/modals/Help.tsx
check help-styles-b.txt components/modals/Help.tsx
check modal-styles-a.txt components/modals/Modal.tsx
check modal-styles-b.txt components/modals/Modal.tsx
check day-padding.txt components/day/Day.tsx
check navigation-styles.txt app/Navigation.tsx
check bar-gloss.txt components/countdown/Bar.tsx

for f in check-directional-styles.js directional-styles-allowlist.json directionalStyleGate.test.ts; do
  [ -f "$PLAN/scripts/handover/$f" ] || fail "missing handover file $f"
done
entries=$(node -p "JSON.parse(require('fs').readFileSync('$PLAN/scripts/handover/directional-styles-allowlist.json')).length")
[ "$entries" = "59" ] || fail "allowlist holds $entries entries, expected 59"

echo "PREFLIGHT OK"
