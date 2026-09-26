#!/bin/bash
# Step 6 break script: the TIME_TICK listener must bind to the PROCESS, not to a
# JS data push.
#
# The defect this pins: ensureRegistered used to be reachable only from
# armWidgetRefreshChain, which only runs from refreshPrayerWidgets behind a data
# gate. On the Find X8 that left the app holding four receivers, none of them
# TIME_TICK, so the one minute signal ColorOS does not defer was absent exactly
# when it was needed.
set -u

MOD="modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshModule.kt"
LISTENER="modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshTickListener.kt"
FAILED=0

check() {  # name, expected(pass|fail), command
  local name="$1" expect="$2"; shift 2
  if "$@" >/dev/null 2>&1; then got=pass; else got=fail; fi
  if [ "$got" = "$expect" ]; then
    echo "ok       $name ($got)"
  else
    echo "MISMATCH $name (expected $expect, got $got)"
    FAILED=$((FAILED + 1))
  fi
}

echo "--- assertions on the shipped source"

# The module must register the listener from OnCreate, so it follows the process.
check "module has OnCreate block"            pass grep -q "OnCreate {" "$MOD"
check "OnCreate registers the tick listener" pass \
  perl -0777 -ne 'exit(($_ =~ /OnCreate\s*\{[^}]*WidgetRefreshTickListener\.ensureRegistered/s) ? 0 : 1)' "$MOD"

# The listener itself must redraw, never re-arm: armNext from a TIME_TICK pushes
# the pending alarm forward 500ms every minute, so the alarm can never fire
# (measured at 1.28.19, label stuck at 53m while truth walked to 36m).
check "listener calls updateAll"             pass grep -q "WidgetRefreshScheduler.updateAll" "$LISTENER"
# Code only, not prose: the KDoc names armNext to explain why it must never be
# called from here, so a bare grep would match the explanation.
check "listener never calls armNext"         fail \
  grep -qE "^[^*/]*WidgetRefreshScheduler\.armNext" "$LISTENER"
check "listener never calls ensureArmed"     fail \
  grep -qE "^[^*/]*WidgetRefreshScheduler\.ensureArmed" "$LISTENER"

# Runtime registration only: ACTION_TIME_TICK is refused to manifest receivers
# from API 26 and this module's minSdk is 24.
check "filters ACTION_TIME_TICK exactly"     pass grep -q "IntentFilter(Intent.ACTION_TIME_TICK)" "$LISTENER"
check "not in any AndroidManifest"           fail \
  grep -rq "WidgetRefreshTickListener" modules/widgetrefresh/android/src/main/AndroidManifest.xml
check "guarded against double registration"  pass grep -q "if (registered) return" "$LISTENER"

echo "--- negative controls (a break must be CAUGHT)"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp "$MOD" "$TMP/mod.orig"
cp "$LISTENER" "$TMP/listener.orig"
restore() { cp "$TMP/mod.orig" "$MOD"; cp "$TMP/listener.orig" "$LISTENER"; }

# Break 1: move registration back behind the JS push (delete the OnCreate block).
perl -0777 -pi -e 's/\n *OnCreate \{.*?\n *\}\n//s' "$MOD"
if grep -q "OnCreate {" "$MOD"; then
  echo "BREAK NOT APPLIED: OnCreate still present"; FAILED=$((FAILED + 1))
elif perl -0777 -ne 'exit(($_ =~ /OnCreate\s*\{[^}]*ensureRegistered/s) ? 0 : 1)' "$MOD" 2>/dev/null; then
  echo "NOT CAUGHT: push-gated registration passed the check"; FAILED=$((FAILED + 1))
else
  echo "ok       break 1 caught (registration back behind the JS push)"
fi
restore

# Break 2: the 1.28.19 regression, re-arming from the tick instead of redrawing.
perl -pi -e 's/WidgetRefreshScheduler\.updateAll\(context\)/WidgetRefreshScheduler.ensureArmed(context)/' "$LISTENER"
if grep -q "updateAll" "$LISTENER"; then
  echo "BREAK NOT APPLIED: updateAll still present"; FAILED=$((FAILED + 1))
elif grep -q "ensureArmed" "$LISTENER"; then
  echo "ok       break 2 caught (tick re-arming instead of redrawing)"
else
  echo "NOT CAUGHT: re-arm break slipped through"; FAILED=$((FAILED + 1))
fi
restore

# Break 3: a near-miss rename of the action, which an 'appears anywhere' check missed before.
perl -pi -e 's/Intent\.ACTION_TIME_TICK/Intent.ACTION_TIME_CHANGED/' "$LISTENER"
if grep -q "IntentFilter(Intent.ACTION_TIME_TICK)" "$LISTENER"; then
  echo "BREAK NOT APPLIED: filter unchanged"; FAILED=$((FAILED + 1))
else
  echo "ok       break 3 caught (ACTION_TIME_CHANGED substituted for TIME_TICK)"
fi
restore

if ! diff -q "$TMP/mod.orig" "$MOD" >/dev/null || ! diff -q "$TMP/listener.orig" "$LISTENER" >/dev/null; then
  echo "RESTORE FAILED: source left modified"; exit 1
fi

[ "$FAILED" -eq 0 ] && echo "ALL AS EXPECTED: 1" || { echo "FAILURES: $FAILED"; exit 1; }
