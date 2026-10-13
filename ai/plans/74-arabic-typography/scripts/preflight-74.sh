#!/usr/bin/env bash
# Pre-flight for ticket 74. Exits non-zero with a numbered list on failure; prints PREFLIGHT OK.
# The executor saves a copy to $TMPDIR and runs it from there, from the repository root.
set -u

fail=0
n=0
reasons=""

reason() {
  n=$((n + 1))
  reasons="${reasons}$n. $1
"
  fail=1
}

# 1. On uat with a clean tree.
branch="$(git branch --show-current)"
if [ "$branch" != "uat" ]; then
  reason "checkout is on '$branch', expected uat"
fi
if [ -n "$(git status --porcelain)" ]; then
  reason "tree is not clean"
fi

# 2. origin/uat fetched and merged in.
git fetch origin >/dev/null 2>&1 || reason "git fetch origin failed"
if git rev-parse --verify origin/uat >/dev/null 2>&1; then
  if ! git merge-base --is-ancestor origin/uat HEAD; then
    reason "origin/uat is not merged into HEAD"
  fi
else
  reason "origin/uat not found"
fi

# 3. Version not lower than the planned-at version (2.0.201).
version="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
lower="$(python3 -c 'print(1 if tuple(int(x) for x in "'"$version"'".split(".")) < (2,0,201) else 0)')"
if [ "$lower" = "1" ]; then
  reason "version $version is lower than the planned-at 2.0.201"
fi

# 4. Needs first: the status cell of queue row 72 starts with DONE.
row72_status="$(awk -F'|' '/^\| 72 \|/ {gsub(/^ +| +$/, "", $5); print $5; exit}' ai/plans/README.md)"
if [ -z "$row72_status" ]; then
  reason "queue row 72 not found"
else
  case "$row72_status" in
    DONE*) ;;
    *) reason "queue row 72 status is '$row72_status', expected DONE (Needs first)" ;;
  esac
fi

# 5. Anchors count exactly 1 in their source files, except the anchors named as arguments:
#    this plan's own landed steps and row 72 drift them on a known schedule.
expected_drift=" $* "
anchor_dir="ai/plans/74-arabic-typography/scripts/anchors"
if [ ! -d "$anchor_dir" ]; then
  reason "no anchor directory at $anchor_dir"
else
  for f in "$anchor_dir"/*.txt; do
    [ -f "$f" ] || continue
    base="$(basename "$f" .txt)"
    case "$(basename "$f")" in
      01-text-tokens.txt) src="shared/constants.ts" ;;
      02-relaunch-rtl.txt) src="stores/language.ts" ;;
      03-width-keys.txt) src="stores/ui.ts" ;;
      04-appjson-fonts.txt) src="app.json" ;;
      05-help-question.txt) src="components/modals/Help.tsx" ;;
      06-header-title.txt) src="components/sheets/parts/Header.tsx" ;;
      07-width-measure-hidden.txt) src="components/ui/InitialWidthMeasurement.tsx" ;;
      08-prayer-row-text.txt) src="components/prayer/Prayer.tsx" ;;
      09-countdown-styles.txt) src="components/countdown/Countdown.tsx" ;;
      10-qibla-dial-font.txt) src="components/sheets/screens/QiblaCompass.tsx" ;;
      *) reason "anchor $(basename "$f") has no source mapping"; continue ;;
    esac
    count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$f" "$src")"
    if [ "$count" != "1" ]; then
      case "$expected_drift" in
        *" $base "*)
        echo "note: anchor $base is drifted, expected at this step (section 3 drift schedule)"
        ;;
        *)
        reason "anchor $base counts $count in $src (1 expected; not in the expected-drift list)"
        ;;
      esac
    fi
  done
fi

if [ "$fail" -eq 0 ]; then
  echo "PREFLIGHT OK"
  exit 0
fi
echo "PREFLIGHT FAILED"
printf '%s' "$reasons"
exit 1
