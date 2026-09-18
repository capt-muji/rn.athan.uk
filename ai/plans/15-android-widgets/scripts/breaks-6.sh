#!/usr/bin/env bash
# Session 15 step 6 breaks.
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FAILURES=0
NOT_APPLIED=0

run_tests() {
  npx jest shared/__tests__/widgetAssets.test.ts --watchman=false --selectProjects=unit --forceExit >/tmp/break-out.txt 2>&1
  local code=$?
  tail -3 /tmp/break-out.txt | head -1
  return $code
}

break_a() {
  mv assets/widgets/athan_widget_moon_light.png /tmp/break-moon.png
  if [ ! -f assets/widgets/athan_widget_moon_light.png ]; then
    if run_tests; then echo "BREAK (a) NOT CAUGHT"; FAILURES=1; else echo "break (a) caught"; fi
  else
    echo "BREAK NOT APPLIED: png removal"; NOT_APPLIED=1
  fi
  mv /tmp/break-moon.png assets/widgets/athan_widget_moon_light.png
}

break_b() {
  cp scripts/generate-widget-assets.py /tmp/break-gen.py
  perl -pi -e 's/css\("rgba\(252, 252, 254, 0\.92\)"\)/css("rgba(252, 252, 255, 0.92)")/' scripts/generate-widget-assets.py
  if cmp -s scripts/generate-widget-assets.py /tmp/break-gen.py; then echo "BREAK NOT APPLIED: palette drift"; NOT_APPLIED=1; else
    if run_tests; then echo "BREAK (b) NOT CAUGHT"; FAILURES=1; else echo "break (b) caught"; fi
  fi
  cp /tmp/break-gen.py scripts/generate-widget-assets.py
}

break_a
break_b

if [ "$FAILURES" = 0 ] && [ "$NOT_APPLIED" = 0 ]; then echo "ALL AS EXPECTED: 1"; else exit 1; fi
