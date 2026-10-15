#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/../../../.." || exit 1
break_one() {
  local name="$1" file="$2" from="$3" to="$4" tests="$5" project="$6"
  python3 - "$file" "$from" "$to" <<'EOF'
import sys
path, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(path).read()
if text.count(old) != 1:
    print(f"BREAK NOT APPLIED: {old!r} counts {text.count(old)} in {path}")
    sys.exit(1)
open(path, 'w').write(text.replace(old, new))
EOF
  [ $? -ne 0 ] && exit 1
  if npx jest $tests --watchman=false --selectProjects=$project > $TMPDIR/break-88.log 2>&1; then
    echo "BREAK NOT CAUGHT: $name passed with the break applied"
    git checkout -- "$file"
    exit 1
  fi
  echo "break $name: tests red as expected"
  git checkout -- "$file"
}
break_one "gregorian-label" "shared/time.ts" \
  'const composed = `${t(GREGORIAN_WEEKDAY_KEYS[isoWeekday - 1])}, ${String(day)} ' \
  'const composed = `${t(GREGORIAN_WEEKDAY_KEYS[isoWeekday - 1])}, ${String(day).replace(/[0-9]/g, "٥")} ' \
  "shared/__tests__/dateLocalized.test.ts shared/__tests__/widgetTimeline.test.ts" unit
break_one "stepper-value" "components/sheets/parts/Stepper.tsx" \
  '<Text style={styles.value}>{visible}</Text>' \
  '<Text style={styles.value}>{visible.replace(/[0-9]/g, "٥")}</Text>' \
  "components/sheets/parts/__tests__/Stepper.test.tsx" components
break_one "info-box" "components/prayer/Explanation.tsx" \
  '<Text style={styles.infoExplanation}>{explanation}</Text>' \
  '<Text style={styles.infoExplanation}>{explanation.replace(/[0-9]/g, "٥")}</Text>' \
  "components/prayer/__tests__/Explanation.test.tsx" components
break_one "help-answer" "components/modals/Help.tsx" \
  '<Text style={styles.cause}>{text}</Text>' \
  '<Text style={styles.cause}>{text.replace(/[0-9]/g, "٥")}</Text>' \
  "components/modals/__tests__/Help.test.tsx" components
echo "ALL ASPECTED: 1"
