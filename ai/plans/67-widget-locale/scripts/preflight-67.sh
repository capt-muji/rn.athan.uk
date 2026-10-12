#!/usr/bin/env bash
# Ticket 67 pre-flight. Copy to $TMPDIR and run from the repository root.
set -u
fail=0
reasons=""

say() { reasons="${reasons}$1\n"; fail=1; }

branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "uat" ] || say "not on uat (on $branch)"

[ -z "$(git status --porcelain)" ] || say "tree not clean"

git fetch origin uat >/dev/null 2>&1
merged=$(git rev-list --count origin/uat..uat)
[ "$merged" = "0" ] || say "origin/uat not merged in ($merged commits ahead)"

ver="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
python3 - "$ver" <<'EOF' || say "package.json version $ver is below 2.0.122"
import sys
sys.exit(0 if tuple(int(x) for x in sys.argv[1].split(".")) >= (2, 0, 122) else 1)
EOF

declare -a pairs
pairs=(
  "types-ios-version shared/widgetTypes.ts"
  "types-android-version shared/widgetTypes.ts"
  "types-stale-field shared/widgetTypes.ts"
  "types-strings-field shared/widgetTypes.ts"
  "timeline-import shared/widgetTimeline.ts"
  "timeline-entry shared/widgetTimeline.ts"
  "timeline-stale shared/widgetTimeline.ts"
  "timeline-snapshot shared/widgetTimeline.ts"
  "widget-localekey widgets/PrayerWidget.tsx"
  "widget-digitcomment widgets/PrayerWidget.tsx"
  "widget-localise widgets/PrayerWidget.tsx"
  "renderer-ar shared/__tests__/widgetRenderer.test.ts"
  "renderer-v1 shared/__tests__/widgetRenderer.test.ts"
  "contract-ios shared/__tests__/widgetContract.test.ts"
  "contract-android shared/__tests__/widgetContract.test.ts"
)
here="ai/plans/67-widget-locale/scripts"
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
else
  echo "PREFLIGHT FAILED"
  printf "$reasons"
  exit 1
fi
