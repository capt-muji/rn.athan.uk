#!/usr/bin/env bash
# Ticket 86 pre-flight. Copy to $TMPDIR and run from the repository root.
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
python3 - "$ver" <<'EOF' || say "package.json version $ver is below 2.0.715"
import sys
sys.exit(0 if tuple(int(x) for x in sys.argv[1].split(".")) >= (2, 0, 715) else 1)
EOF

# Needs first is empty for this ticket, so nothing to check here.

declare -a pairs
pairs=(
  "header-type-styles components/sheets/parts/Header.tsx"
  "day-type-styles components/day/Day.tsx"
  "typography-script-line shared/typography.ts"
  "alert-note-foot components/sheets/screens/Alert.tsx"
  "sound-note-in-card components/sheets/screens/Sound.tsx"
  "list-container components/prayer/List.tsx"
  "tip-geometry components/countdown/tipGeometry.ts"
  "bar-tip-style components/countdown/Bar.tsx"
  "bar-fill-style components/countdown/Bar.tsx"
  "language-applying-row components/sheets/screens/Language.tsx"
  "pick-language components/sheets/screens/languageSheet.ts"
  "layout-sheet-host app/_layout.tsx"
  "language-busy-atom stores/language.ts"
  "catalog-applying-key shared/i18n/en.ts"
)
here="ai/plans/86-visual-polish-batch/scripts"
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
