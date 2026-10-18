#!/bin/bash
# Ticket 116 pre-flight. Run from the repository root. Ends PREFLIGHT OK or names the check
# that failed.
set -u

PLAN_DIR="ai/plans/116-iphone-duo"
ANCHORS="$PLAN_DIR/scripts/anchors"
VERSION_FLOOR="2.0.1073"
FAILED=0

fail() {
  echo "FAIL: $1"
  FAILED=1
}

# --- checkout ---
git rev-parse --verify --quiet origin/uat >/dev/null || fail "origin/uat is not fetched"
if git rev-parse --verify --quiet origin/uat >/dev/null; then
  git merge-base --is-ancestor origin/uat HEAD || fail "origin/uat is not merged into HEAD"
fi
DIRTY="$(git status --porcelain | grep -v '^.. ai/plans/' || true)"
[ -z "$DIRTY" ] || fail "tree is not clean outside ai/plans: $DIRTY"

# --- version not lower than the floor ---
VERSION="$(node -p "require('./package.json').version")"
node -e '
const [v, floor] = process.argv.slice(1);
const parse = (s) => s.split(".").map(Number);
const [a, b, c] = parse(v);
const [x, y, z] = parse(floor);
process.exit(a > x || (a === x && (b > y || (b === y && c >= z))) ? 0 : 1);
' "$VERSION" "$VERSION_FLOOR" || fail "version $VERSION is below the floor $VERSION_FLOOR"

# --- the toolchain that ships the Duo ---
XCODE="$(xcodebuild -version 2>/dev/null | head -1)"
case "$XCODE" in
  "Xcode 27.1"*) echo "ok: $XCODE" ;;
  *) fail "Xcode 27.1 is required, found: ${XCODE:-none}" ;;
esac
xcodebuild -showsdks 2>/dev/null | grep -q "iphoneos27.1" || fail "no iphoneos27.1 SDK"
xcrun simctl list runtimes 2>/dev/null | grep -q "iOS 27.1" || fail "no iOS 27.1 simulator runtime"
xcrun simctl list devicetypes 2>/dev/null | grep -q "iPhone Duo" || fail "no iPhone Duo device type"

# --- exactly one booted Duo on the 27.1 runtime ---
DUO_LINES="$(xcrun simctl list devices | grep 'iPhone Duo' | grep Booted || true)"
DUO_COUNT="$(printf '%s\n' "$DUO_LINES" | grep -c 'iPhone Duo' || true)"
[ "$DUO_COUNT" = "1" ] || fail "expected exactly one booted iPhone Duo, found $DUO_COUNT"
SIMULATOR_UDID="$(printf '%s\n' "$DUO_LINES" | head -1 | sed -E 's/.*\(([0-9A-F-]{36})\).*/\1/')"
[ -n "$SIMULATOR_UDID" ] || fail "no booted iPhone Duo simulator resolves"

APP_PATH="$(xcrun simctl get_app_container "$SIMULATOR_UDID" com.example.athan 2>/dev/null || true)"
if [ -z "$APP_PATH" ]; then
  fail "com.example.athan is not installed on the Duo simulator"
else
  APP_VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$APP_PATH/Info.plist" 2>/dev/null)"
  node -e '
const [v, floor] = process.argv.slice(1);
const parse = (s) => s.split(".").map(Number);
const [a, b, c] = parse(v);
const [x, y, z] = parse(floor);
process.exit(a > x || (a === x && (b > y || (b === y && c >= z))) ? 0 : 1);
' "$APP_VERSION" "2.0.1054" || fail "installed app $APP_VERSION is below 2.0.1054"
  APP_SDK="$(/usr/libexec/PlistBuddy -c 'Print :DTSDKName' "$APP_PATH/Info.plist" 2>/dev/null)"
  [ "$APP_SDK" = "iphonesimulator27.1" ] || fail "installed app build SDK is ${APP_SDK:-none}, expected iphonesimulator27.1"
fi

# --- the range must not touch the app layout path ---
APP_SURFACE="$(git diff --name-only origin/uat -- app components hooks modules shared/constants.ts)"
[ -z "$APP_SURFACE" ] || fail "app layout files differ from origin/uat: $APP_SURFACE"

# --- anchors, counted with python, never grep ---
for entry in screen-content-cap:app/Screen.tsx navigation-pager:app/Navigation.tsx size-content-max-width:shared/constants.ts window-dimensions-hook:hooks/useWindowDimensions.ts portrait-lock:app.json; do
  anchor="$ANCHORS/${entry%%:*}.txt"
  source="${entry##*:}"
  [ -f "$anchor" ] || { fail "anchor missing: $anchor"; continue; }
  [ -f "$source" ] || { fail "anchor source missing: $source"; continue; }
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor" "$source")"
  [ "$count" = "1" ] || fail "anchor $anchor appears $count times in $source"
done

if [ "$FAILED" = "1" ]; then
  echo "PREFLIGHT FAILED"
  exit 1
fi
echo "PREFLIGHT OK"
