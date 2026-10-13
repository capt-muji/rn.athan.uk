#!/usr/bin/env bash
# Ticket 68 pre-flight. Copy to $TMPDIR and run from the repository root.
set -u
fail=0
reasons=""

say() { reasons="${reasons}$1\n"; fail=1; }

branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "uat" ] || say "not on uat (on $branch)"

[ -z "$(git status --porcelain)" ] || say "tree not clean"

git fetch origin uat >/dev/null 2>&1
behind=$(git rev-list --count uat..origin/uat)
[ "$behind" = "0" ] || say "origin/uat not merged in ($behind commits behind)"

ver="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
python3 - "$ver" <<'EOF' || say "package.json version $ver is below 2.0.148"
import sys
sys.exit(0 if tuple(int(x) for x in sys.argv[1].split(".")) >= (2, 0, 148) else 1)
EOF

row67="$(grep -c '^| 67 |.*DEFERRED' ai/plans/README.md)"
[ "$row67" = "1" ] || say "row 67 is not DEFERRED (widget group must be free: 67 deferred, 69 owner-blocked)"

declare -a pairs
pairs=(
  "appjson-rtl app.json"
  "tip-worklet components/countdown/tipGeometry.ts"
  "bar-leftstyle components/countdown/Bar.tsx"
  "segmented-pill components/sheets/parts/SegmentedControl.tsx"
  "toggle-travel components/sheets/parts/Toggle.tsx"
  "wave-point shared/qiblaWave.ts"
  "overlay-left components/overlay/Overlay.tsx"
  "veil-left components/overlay/VeilBackdrop.tsx"
  "commit-flow stores/language.ts"
  "widgettypes-ios shared/widgetTypes.ts"
  "widgettypes-android shared/widgetTypes.ts"
  "timeline-entry shared/widgetTimeline.ts"
  "locale-ids shared/i18n/locale.ts"
)
here="ai/plans/68-rtl-flip/scripts"
for entry in "${pairs[@]}"; do
  a="${entry%% *}"
  src="${entry#* }"
  anchor="$here/anchors/$a.txt"
  if [ ! -f "$anchor" ]; then
    say "anchor file missing: $a"
    continue
  fi
  lines=$(wc -l < "$anchor" | tr -d ' ')
  if [ "$lines" -lt 3 ] || [ "$lines" -gt 15 ]; then
    say "anchor $a is $lines lines (must be 3 to 15)"
  fi
  count=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor" "$src")
  [ "$count" = "1" ] || say "anchor $a counts $count in $src (must be 1)"
done

if [ "$fail" = "0" ]; then
  echo "PREFLIGHT OK"
  exit 0
fi
echo "PREFLIGHT FAILED"
printf "$reasons"
exit 1
