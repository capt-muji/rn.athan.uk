#!/bin/bash
# Extract the plan's anchors verbatim and verify each counts exactly 1 in its source.
set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"
A="$ROOT/anchors"
NEXT=node_modules/expo-location/src/next
mkdir -p "$A"

ex() { sed -n "${3},${4}p" "$2" > "$A/$1"; }

ex next-index.md             "$NEXT/index.ts"                                                       1 12
ex next-location.md          "$NEXT/Location.ts"                                                    2 16
ex next-js-index.md          "$NEXT/js/index.ts"                                                    1 15
ex next-position-heading.md  "$NEXT/types/Position.types.ts"                                      137 149
ex next-permissions-option.md "$NEXT/types/Permissions.types.ts"                                   49 62
ex next-native-manifest.md   "$NEXT/native/types/NativeLocationModuleNextClass.types.ts"           17 31
ex changelog-next.md         node_modules/expo-location/CHANGELOG.md                               45 49
ex qibla-watch.md            device/qibla.ts                                                       77 90
ex qibla-read-position.md    device/qibla.ts                                                       47 58
ex qibla-sheet-branch.md     hooks/useQibla.ts                                                    252 266
ex qiblaheading-index.md     modules/qiblaheading/index.ts                                          1  9
ex patch-android-gate.md     patches/expo-location+58.0.16.patch                                   28 41
ex patch-ios-filter.md       patches/expo-location+58.0.16.patch                                   67 79
ex agents-qibla-lock.md      ai/AGENTS.md                                                          93 95
ex upstream-location-pr.md   ai/UPSTREAM-PRS.md                                                    25 28
ex settle-gate.md            shared/qiblaSettle.ts                                                 32 39

rc=0
for name in next-index.md next-location.md next-js-index.md next-position-heading.md \
            next-permissions-option.md next-native-manifest.md changelog-next.md \
            qibla-watch.md qibla-read-position.md qibla-sheet-branch.md qiblaheading-index.md \
            patch-android-gate.md patch-ios-filter.md agents-qibla-lock.md \
            upstream-location-pr.md settle-gate.md; do
  case "$name" in
    next-index.md)             src="$NEXT/index.ts" ;;
    next-location.md)          src="$NEXT/Location.ts" ;;
    next-js-index.md)          src="$NEXT/js/index.ts" ;;
    next-position-heading.md)  src="$NEXT/types/Position.types.ts" ;;
    next-permissions-option.md) src="$NEXT/types/Permissions.types.ts" ;;
    next-native-manifest.md)   src="$NEXT/native/types/NativeLocationModuleNextClass.types.ts" ;;
    changelog-next.md)         src="node_modules/expo-location/CHANGELOG.md" ;;
    qibla-watch.md|qibla-read-position.md) src="device/qibla.ts" ;;
    qibla-sheet-branch.md)     src="hooks/useQibla.ts" ;;
    qiblaheading-index.md)     src="modules/qiblaheading/index.ts" ;;
    patch-android-gate.md|patch-ios-filter.md) src="patches/expo-location+58.0.16.patch" ;;
    agents-qibla-lock.md)      src="ai/AGENTS.md" ;;
    upstream-location-pr.md)   src="ai/UPSTREAM-PRS.md" ;;
    settle-gate.md)            src="shared/qiblaSettle.ts" ;;
  esac
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$name" "$src")"
  lines="$(awk 'END{print NR}' "$A/$name")"
  echo "$name source=$src lines=$lines count=$count"
  [ "$count" = "1" ] || rc=1
done
exit $rc
