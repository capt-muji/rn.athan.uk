#!/usr/bin/env bash
# Ticket 64 pre-flight. Copy to $TMPDIR and run from the repository root.
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
python3 - "$ver" <<'EOF' || say "package.json version $ver is below 2.0.149"
import sys
sys.exit(0 if tuple(int(x) for x in sys.argv[1].split(".")) >= (2, 0, 149) else 1)
EOF

for loc in en ar ms so hi th; do
  [ -f "shared/i18n/$loc.ts" ] || say "catalog missing: shared/i18n/$loc.ts"
done

declare -a pairs
pairs=(
  "alert-card components/sheets/screens/Alert.tsx"
  "sound-card components/sheets/screens/Sound.tsx"
  "help-quiet shared/help.ts"
  "en-quiet shared/i18n/en.ts"
)
here="ai/plans/64-volume-copy/scripts"
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
