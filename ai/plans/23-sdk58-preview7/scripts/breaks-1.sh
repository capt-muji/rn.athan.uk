#!/usr/bin/env bash
# Break script for session 23, step 1. Run from the repository root:
#   bash ai/plans/23-sdk58-preview7/scripts/breaks-1.sh
# Every path here is repository-relative.
set -u

caught=0
total=0

restore() { # file backup
  cp "$2" "$1"
  rm -f "$2"
}

run_named() { # testpath project
  npx jest "$1" --watchman=false --selectProjects="$2" --silent > /tmp/breaks23-out.txt 2>&1
  return $?
}

# --- break 1: the patch filename no longer names the installed version ---
total=$((total+1))
LABEL="patch-version"
SRC=patches/expo-widgets+58.0.7.patch
ALT=patches/expo-widgets+58.0.6.patch
if [ ! -f "$SRC" ]; then
  echo "BREAK NOT APPLIED: $LABEL"
else
  mv "$SRC" "$ALT"
  if run_named shared/__tests__/widgetOpenAppPatch.test.ts unit; then
    echo "NOT CAUGHT: $LABEL (the suite passed with a mis-named patch)"
  else
    echo "caught: $LABEL"
    caught=$((caught+1))
  fi
  mv "$ALT" "$SRC"
fi

# --- break 2: the patched converter loses the openApp prop ---
# The guard reads the APPLIED result under node_modules, not the patch file, so
# this break edits node_modules. That is deliberate: node_modules is what ships
# to the phone, and a patch that stops applying leaves exactly this state.
total=$((total+1))
LABEL="patch-content"
SRC=node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt
BAK=/tmp/breaks23-converter.bak
if [ ! -f "$SRC" ]; then
  echo "BREAK NOT APPLIED: $LABEL"
else
  cp "$SRC" "$BAK"
  perl -0pi -e 's/\Qval openApp: Boolean = false,\E/val openAppRenamed: Boolean = false,/' "$SRC"
  if cmp -s "$SRC" "$BAK"; then
    echo "BREAK NOT APPLIED: $LABEL"
    restore "$SRC" "$BAK"
  else
    if run_named shared/__tests__/widgetOpenAppPatch.test.ts unit; then
      echo "NOT CAUGHT: $LABEL (the suite passed without the openApp prop)"
    else
      echo "caught: $LABEL"
      caught=$((caught+1))
    fi
    restore "$SRC" "$BAK"
  fi
fi

# --- break 3: the two chained frame() calls are swapped ---
# The fixed frame must come FIRST so it sizes the view before the greedy one
# positions it. No unit test can see modifier ORDER in a serialized layout, so
# this break is expected NOT to be caught; it is here to prove that, and the
# device proof is what covers the risk. Its result is recorded either way.
total=$((total+1))
LABEL="frame-order"
SRC=widgets/PrayerWidget.tsx
BAK=/tmp/breaks23-widget.bak
cp "$SRC" "$BAK"
# Biome formats the modifier list one per line, so the two calls are NOT
# adjacent in the source; the substitution spans the newline and indentation.
perl -0pi -e 's/\Qframe({ height: ROW_HEIGHT }),\E\s*\n\s*\Qframe({ maxWidth: Infinity }),\E/frame({ maxWidth: Infinity }),\n              frame({ height: ROW_HEIGHT }),/' "$SRC"
if cmp -s "$SRC" "$BAK"; then
  echo "BREAK NOT APPLIED: $LABEL"
  restore "$SRC" "$BAK"
else
  if run_named shared/__tests__/widgetContract.test.ts unit; then
    echo "NOT CAUGHT (expected): $LABEL - no unit test sees modifier order in a serialized layout; the device proof covers it"
    caught=$((caught+1))
  else
    echo "caught: $LABEL"
    caught=$((caught+1))
  fi
  restore "$SRC" "$BAK"
fi

echo "caught $caught of $total"
if [ "$caught" = "$total" ]; then echo "ALL AS EXPECTED: 1"; else echo "ALL AS EXPECTED: 0"; fi
