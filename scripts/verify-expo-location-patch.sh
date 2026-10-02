#!/bin/bash
#
# Is node_modules/expo-location in the state patches/expo-location+58.0.9.patch produces?
#
# Session 50 isolates four heading changes by editing node_modules and rebuilding, three of which
# live in that patch. A tree left edited silently changes every later build in this repository and
# no suite would catch it, because none of them compiles Kotlin or Swift.
#
#   bash scripts/verify-expo-location-patch.sh [root]
#
# Exits 0 and prints PATCH AS SHIPPED when every check passes, 1 and PATCH NOT AS SHIPPED otherwise.
# It only ever reads.
set -u

ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
PKG="$ROOT/node_modules/expo-location"
KT="$PKG/android/src/main/java/expo/modules/location/LocationModule.kt"
SWIFT="$PKG/ios/Providers/DeviceHeadingStreamer.swift"
CONFIG="$PKG/expo-module.config.json"

refuse() {
  echo "$1"
  echo "PATCH NOT AS SHIPPED"
  exit 1
}

[ -d "$PKG" ] || refuse "expo-location not found under $ROOT"

for file in "$KT" "$SWIFT" "$CONFIG"; do
  # A missing file must fail rather than count zero: ai/AGENTS.md records a grep -c on a missing
  # target reading identically to a real zero, which is dangerous exactly when it is trusted
  [ -f "$file" ] || refuse "${file##*/} not found"
done

ok=0

count() {
  local got
  got=$(grep -c -F "$1" "$2" 2>/dev/null || true)
  printf '%s' "${got:-0}"
}

game=$(count 'SENSOR_DELAY_GAME' "$KT")
echo "SENSOR_DELAY_GAME: $game, expected 2"
[ "$game" = "2" ] || ok=1

if grep -q -F 'DEGREE_DELTA' "$KT"; then
  echo "DEGREE_DELTA: present, expected absent"
  ok=1
else
  echo "DEGREE_DELTA: absent, expected absent"
fi

filter=$(count 'kCLHeadingFilterNone' "$SWIFT")
echo "kCLHeadingFilterNone: $filter, expected 1"
[ "$filter" = "1" ] || ok=1

# Either of the next two makes autolinking resolve a prebuilt AAR, so Gradle never compiles the
# patched Kotlin and a build measures unpatched code while reporting BUILD SUCCESSFUL (session 49)
if grep -q -F '"publication"' "$CONFIG"; then
  echo "publication block: present, expected absent"
  ok=1
else
  echo "publication block: absent, expected absent"
fi

if [ -d "$PKG/android/local-maven-repo" ]; then
  echo "local-maven-repo: present, expected absent"
  ok=1
else
  echo "local-maven-repo: absent, expected absent"
fi

[ "$ok" = "0" ] || refuse "one or more checks failed"

echo "PATCH AS SHIPPED"
