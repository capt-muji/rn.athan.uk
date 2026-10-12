#!/usr/bin/env bash
# Ticket 67 step 1 break. Run from the repository root with uat holding step 1.
set -u
cp widgets/PrayerWidget.tsx /tmp/break67-widget.tsx.bak

python3 - <<'EOF'
import pathlib
p = pathlib.Path('widgets/PrayerWidget.tsx')
s = p.read_text()
old = "    (digitLocaleKey ?? localeKey) === 'ar' ? value.replace(/[0-9]/g, (digit) => WIDGET_DIGITS[digit]) : value;"
new = "    localeKey === 'ar' ? value.replace(/[0-9]/g, (digit) => WIDGET_DIGITS[digit]) : value;"
assert s.count(old) == 1, "break substitution not found once"
s = s.replace(old, new)
p.write_text(s)
print("break applied: digit keying reverted to the device locale")
EOF

npx jest shared/__tests__/widgetRenderer.test.ts -t 'stamped app locale' --watchman=false --selectProjects=unit > /tmp/break67.log 2>&1
if grep -q '19د' /tmp/break67.log && grep -q 'stamped app locale' /tmp/break67.log; then
  echo "caught: mixed-script card returns (19d beside ar strings)"
  cp /tmp/break67-widget.tsx.bak widgets/PrayerWidget.tsx
  rm /tmp/break67-widget.tsx.bak
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp /tmp/break67-widget.tsx.bak widgets/PrayerWidget.tsx
rm /tmp/break67-widget.tsx.bak
echo "BREAK NOT APPLIED (the stamped-locale case did not fail)"
exit 1
