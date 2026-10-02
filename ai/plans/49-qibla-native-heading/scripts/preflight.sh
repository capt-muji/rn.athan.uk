#!/usr/bin/env bash
# Pre-flight for session 49. Run from the repository root:
#   bash $TMPDIR/preflight-49.sh <step>
# Ends PREFLIGHT OK, or names the first thing that is not as the plan expects.
set -u

step="${1:-1}"
fail=0

say() { printf '%s\n' "$*"; }
bad() { printf 'PREFLIGHT FAIL: %s\n' "$*"; fail=1; }

cd "$(git rev-parse --show-toplevel)" || { say 'PREFLIGHT FAIL: not in a git repository'; exit 1; }

say "== step $step"

# 1. The branch and the tree
branch=$(git branch --show-current)
[ "$branch" = "uat-2" ] || bad "on branch '$branch', expected uat-2"

dirty=$(git status --porcelain | grep -vE ' (ai/plans/README\.md|ai/plans/49-qibla-native-heading/)' | grep -vE '^\?\? ai/plans/49-qibla-native-heading/' || true)
[ -z "$dirty" ] || bad "the tree holds changes outside the plan folder:
$dirty"

# 2. The anchors this plan depends on, each expected exactly once.
#    An anchor is text the plan itself quotes, so a count other than 1 means the file moved under the plan.
anchor() {
  local label="$1" file="$2" needle="$3"
  if [ ! -f "$file" ]; then bad "$label: $file does not exist"; return; fi
  local n
  n=$(python3 - "$file" "$needle" <<'PY'
import sys
path, needle = sys.argv[1], sys.argv[2]
print(open(path, encoding='utf-8').read().count(needle))
PY
)
  if [ "$n" = "1" ]; then say "anchor OK (1): $label"; else bad "$label: counted $n, expected 1"; fi
}

anchor 'expo-location pins 21.0.1' \
  node_modules/expo-location/android/build.gradle \
  "api 'com.google.android.gms:play-services-location:21.0.1'"

anchor 'normalizeAccuracy buckets the degrees' \
  node_modules/expo-location/ios/LocationUtils.swift \
  'internal func normalizeAccuracy(_ accuracy: CLLocationDirection) -> Int {'

anchor 'the heading event is the only JS path' \
  node_modules/expo-location/ios/LocationModule.swift \
  '"accuracy": normalizeAccuracy(heading.headingAccuracy)'

anchor 'the settling gate latches, and sits above the haptic' \
  hooks/useQibla.ts \
  'if (!settledRef.current && !hasSettled(window, nowMs)) return;'

anchor 'the hook stops every watch it started' \
  hooks/useQibla.ts \
  'unwatchRef.current?.();'

anchor 'the sheet draws only with a live heading' \
  components/sheets/screens/Qibla.tsx \
  '{showsCompass && <QiblaCompass size={size} bearing={bearing} heading={heading} aligned={aligned} />}'

anchor 'modules/ is outside the coverage measure' \
  scripts/check-changed-coverage.js \
  "{ path: 'modules/', reason:"

anchor 'the unused-export sweep scans modules/' \
  scripts/find-unused-exports.py \
  '"modules"'

anchor 'the local-module JS pattern to follow' \
  modules/widgetrefresh/index.ts \
  "expo.requireOptionalNativeModule?.('ExpoWidgetRefresh') ?? null;"

# 3. The baseline the plan's acceptance criteria compare against
unused=$(python3 scripts/find-unused-exports.py | grep -c '^  ' || true)
if [ "$unused" = "5" ]; then say "unused exports baseline OK (5)"; else bad "unused exports baseline is $unused, expected 5"; fi

# 4. The toolchain the plan's build checks need
[ -x android/gradlew ] || bad 'android/gradlew is missing: run npx expo prebuild -p android --no-install'
[ -f ios/Athan.xcworkspace/contents.xcworkspacedata ] || bad 'ios/Athan.xcworkspace is missing: run npx expo prebuild -p ios --no-install'
command -v pod >/dev/null || bad 'cocoapods is not on PATH'

# 5. Both devices, because step 2 needs both and the owner asked for both
adb devices | grep -q '8f7ada76[[:space:]]*device' || bad 'the OnePlus 3T 8f7ada76 is not attached'
xcrun devicectl list devices 2>/dev/null | grep -q '00008020-0015585C22D2002E' || bad 'the iPhone XS is not paired'

# 6. Step 2 only: step 1 must have landed
if [ "$step" = "2" ]; then
  [ -f modules/qiblaheading/index.ts ] || bad 'step 2 needs step 1 merged: modules/qiblaheading/index.ts is absent'
  grep -q 'QIBLA_DIAGNOSTIC' .env.example || bad 'step 2 needs step 1 merged: the flag is not in .env.example'
fi

[ "$fail" = "0" ] && say 'PREFLIGHT OK' || exit 1
