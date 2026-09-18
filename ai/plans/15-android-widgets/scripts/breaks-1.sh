#!/usr/bin/env bash
# Session 15 step 1 breaks. Each break: copy, perl-substitute, run named tests,
# expect failure, restore. Ends ALL AS EXPECTED: 1 only when every listed
# break failed its tests and no BREAK NOT APPLIED happened.
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FAILURES=0
NOT_APPLIED=0

run_tests() {
  npx jest shared/__tests__/flags.test.ts --watchman=false --selectProjects=unit >/tmp/break-out.txt 2>&1
  local code=$?
  tail -4 /tmp/break-out.txt | head -2
  return $code
}

break_a() {
  cp app.config.ts /tmp/break-appconfig.ts
  perl -pi -e 's/enableAndroid: true/enableAndroid: false/' app.config.ts
  if cmp -s app.config.ts /tmp/break-appconfig.ts; then echo "BREAK NOT APPLIED: enableAndroid"; NOT_APPLIED=1; else
    if run_tests; then echo "BREAK (a) NOT CAUGHT"; FAILURES=1; else echo "break (a) caught"; fi
  fi
  cp /tmp/break-appconfig.ts app.config.ts
}

break_b() {
  cp shared/flags.ts /tmp/break-flags.ts
  perl -pi -e "s/EXPO_PUBLIC_ANDROID_WIDGETS/EXPO_PUBLIC_ANDROID_WIDGET/g" shared/flags.ts
  if cmp -s shared/flags.ts /tmp/break-flags.ts; then echo "BREAK NOT APPLIED: env var name"; NOT_APPLIED=1; else
    if run_tests; then echo "BREAK (b) NOT CAUGHT"; FAILURES=1; else echo "break (b) caught"; fi
  fi
  cp /tmp/break-flags.ts shared/flags.ts
}

break_c() {
  cp app.json /tmp/break-appjson.json
  perl -pi -e 's/"targetCellWidth": 2/"targetCellWidth": 3/g' app.json
  if cmp -s app.json /tmp/break-appjson.json; then echo "BREAK NOT APPLIED: targetCellWidth"; NOT_APPLIED=1; else
    if run_tests; then echo "BREAK (c) NOT CAUGHT"; FAILURES=1; else echo "break (c) caught"; fi
  fi
  cp /tmp/break-appjson.json app.json
}

break_a
break_b
break_c

if [ "$FAILURES" = 0 ] && [ "$NOT_APPLIED" = 0 ]; then echo "ALL AS EXPECTED: 1"; else exit 1; fi
