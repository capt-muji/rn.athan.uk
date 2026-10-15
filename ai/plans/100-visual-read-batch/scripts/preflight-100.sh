#!/usr/bin/env bash
# Pre-flight for ticket 100. Save a copy to $TMPDIR and run with bash from the lane root
# ($HOME/athan-gitree/lanes/100). Expected last line: PREFLIGHT OK
# bash 3.2 compatible.
set -u
fail=0
plan="ai/plans/100-visual-read-batch"

say_fail() { echo "PREFLIGHT FAIL: $1"; fail=1; }

# 1. The lane branch and a clean tree
[ "$(git rev-parse --abbrev-ref HEAD)" = "lane/100" ] || say_fail "not on lane/100 (run inside the lane worktree)"
[ -z "$(git status --porcelain)" ] || say_fail "tree not clean"

# 2. origin fetched
git fetch -q origin uat || say_fail "git fetch origin uat failed"

# 3. Version at or above the planned 2.0.751
v="$(python3 -c 'import json; print(json.load(open("app.json"))["expo"]["version"])' 2>/dev/null)" || say_fail "app.json unreadable"
low="$(printf '%s\n2.0.751\n' "$v" | sort -V | head -1)"
[ "$low" = "2.0.751" ] || say_fail "version $v is below the planned 2.0.751"

# 4. The lane tip is at or above the planned sha (the sha is an ancestor of lane/100)
git merge-base --is-ancestor f9af66c2 lane/100 2>/dev/null || say_fail "planned sha f9af66c2 is not an ancestor of lane/100"

# 5. Every anchor counts exactly 1
count_anchor() {
  # $1 anchor file (inside the plan folder), $2 source file (repo relative)
  local n
  n="$(python3 -c 'import sys; print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2")"
  [ "$n" = "1" ] || say_fail "anchor $1 counts $n in $2 (must be 1)"
}
count_anchor "$plan/scripts/anchors/01-ago-render.md" "components/prayer/Ago.tsx"
count_anchor "$plan/scripts/anchors/02-format-ago.md" "shared/time.ts"
count_anchor "$plan/scripts/anchors/03-unit-letters.md" "components/countdown/Countdown.tsx"
count_anchor "$plan/scripts/anchors/04-unit-letter-style.md" "components/countdown/Countdown.tsx"
count_anchor "$plan/scripts/anchors/05-info-svg.md" "assets/icons/svg/info.svg"
count_anchor "$plan/scripts/anchors/06-ar-note-copy.md" "shared/i18n/ar.ts"
count_anchor "$plan/scripts/anchors/07-qibla-subtitle.md" "components/sheets/screens/Qibla.tsx"
count_anchor "$plan/scripts/anchors/08-sound-list.md" "components/sheets/screens/Sound.tsx"
count_anchor "$plan/scripts/anchors/09-note-foot.md" "components/sheets/parts/VolumeNote.tsx"
count_anchor "$plan/scripts/anchors/10-help-question.md" "components/modals/Help.tsx"
count_anchor "$plan/scripts/anchors/11-date-comma.md" "shared/time.ts"
count_anchor "$plan/scripts/anchors/12-hijri-comma.md" "shared/time.ts"
count_anchor "$plan/scripts/anchors/13-locale-direction.md" "shared/i18n/locale.ts"
count_anchor "$plan/scripts/anchors/14-day-location.md" "components/day/Day.tsx"

# 6. The hook wiring is live in the lane
[ -x ".husky/_/h" ] || say_fail "lane hooks missing (.husky/_/h); run npx husky in the lane"

[ "$fail" = "0" ] && echo "PREFLIGHT OK"
exit "$fail"
