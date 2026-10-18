#!/usr/bin/env bash
# Pre-flight for ticket 136. Run from the lane worktree root before any step
# branch. Ends PREFLIGHT OK.
set -u
fail=0
reason() { echo "PREFLIGHT FAIL: $1"; fail=1; }

[ -f app.config.ts ] || { echo "PREFLIGHT FAIL: not the repo root (app.config.ts absent)"; exit 1; }

BRANCH=$(git branch --show-current)
case "$BRANCH" in
  lane/136|fix/*|docs/*) ;;
  *) reason "branch is $BRANCH, expected lane/136 or a step branch" ;;
esac

[ -z "$(git status --porcelain | grep -v '^?? ai/plans/136')" ] || reason "tree not clean"

git fetch -q origin uat
MISSING=$(git rev-list HEAD..origin/uat --count)
[ "$MISSING" = "0" ] || reason "$MISSING commits on origin/uat missing from this branch"

VERSION=$(python3 -c "import json;print(json.load(open('app.json'))['expo']['version'])" 2>/dev/null || \
  python3 -c "import json;print(json.load(open('app.json'))['version'])")
python3 - "$VERSION" <<'EOF' || reason "version $1 lower than Planned at 2.0.1013"
import sys
def key(v): return [int(x) for x in v.split('.')]
sys.exit(0 if key(sys.argv[1]) >= key('2.0.1013') else 1)
EOF

grep -q "^| 136 | Android chevrons do not mirror under Arabic" ai/plans/README.md \
  || reason "ticket 136 row missing from the queue"

A=ai/plans/136-android-chevron-mirror/scripts/anchors
check_anchor() {
  local name="$1" file="$2"
  [ -f "$A/$name.txt" ] || { reason "anchor file $name missing"; return; }
  local count
  count=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$name.txt" "$file")
  [ "$count" = "1" ] || reason "anchor $name counts $count in $file"
}
check_anchor locale-chevronfor shared/i18n/locale.ts
check_anchor settings-chevron-render components/sheets/screens/Settings.tsx
check_anchor settings-chevron-style components/sheets/screens/Settings.tsx
check_anchor colorpicker-chevron-render components/sheets/screens/ColorPicker.tsx
check_anchor colorpicker-chevron-style components/sheets/screens/ColorPicker.tsx
check_anchor help-action-chevron components/modals/Help.tsx
check_anchor layout-direction-root app/_layout.tsx
check_anchor countdown-timerrow-pin components/countdown/Countdown.tsx
check_anchor typography-sweep-idiom components/__tests__/typographySweep.test.tsx
check_anchor help-android-action components/modals/__tests__/Help.test.tsx
check_anchor settings-whatsnew-mock components/sheets/screens/__tests__/Settings.test.tsx

[ "$fail" = "0" ] && echo "PREFLIGHT OK"
exit "$fail"
