#!/bin/zsh
# Session 8 study builds. Worktree-only: every file this script touches or writes
# lives under ~/athan-device-sweep; nothing is committed, nothing merges.
# Run from the repository root:
#   zsh ai/plans/08-ios-replace-previous-notification/scripts/build-study.sh
# Ends: STUDY BUILDS OK
# No pipefail: `grep -m1`/`grep -q` exit on their match and SIGPIPE a
# still-writing producer, turning successes into failures.
set -eu

REPO=/Users/muji/repos/rn.athan.uk
PLAN=$REPO/ai/plans/08-ios-replace-previous-notification
WORKTREE=/Users/muji/athan-device-sweep/worktrees/study-8
OUT=/Users/muji/athan-device-sweep/session8
mkdir -p "$OUT"

# Deterministic worktree: drop any earlier attempt, registered or not.
git -C "$REPO" worktree remove --force "$WORKTREE" 2>/dev/null || true
rm -rf "$WORKTREE"
git -C "$REPO" worktree add --detach "$WORKTREE" uat-2
ln -s "$REPO/node_modules" "$WORKTREE/node_modules"
cd "$WORKTREE"

python3 "$PLAN/scripts/splice-appjson.py" app.json
python3 "$PLAN/scripts/splice-index.py" app/index.tsx
cp "$PLAN/scripts/files/notifyStudy.ts.txt" device/notifyStudy.ts

npx expo prebuild -p ios --no-install
(cd ios && pod install)

build_variant() {
  local label=$1
  local log="$OUT/build-variant-${label}.log"
  xcodebuild -workspace ios/AthanLab.xcworkspace -scheme AthanLab -configuration Release \
    -destination 'generic/platform=iOS' -derivedDataPath ios/build \
    DEVELOPMENT_TEAM=9V3WAU9Z54 CODE_SIGN_STYLE=Automatic -allowProvisioningUpdates build \
    > "$log" 2>&1
  grep -m1 '\*\* BUILD SUCCEEDED \*\*' "$log"
  local app=ios/build/Build/Products/Release-iphoneos/AthanLab.app
  # Fixed-string: the raw pattern's dots are regex-any and would match the
  # keychain line where the plist dump renders them as spaces.
  security cms -D -i "$app/embedded.mobileprovision" 2>/dev/null | grep -F -m1 'com.mugtaba.athan.experiments'
  mkdir -p "$OUT/variant${label}"
  rm -rf "$OUT/variant${label}/AthanLab.app"
  cp -R "$app" "$OUT/variant${label}/AthanLab.app"
  echo "VARIANT ${label} OK: $OUT/variant${label}/AthanLab.app"
}

build_variant A

# Variant B: expo compiles the ExpoNotifications pod straight from
# node_modules (the Pods project references it there), and the worktree's
# node_modules is a symlink to the main checkout, which this script must
# never touch. So the worktree gets its own node_modules: every package and
# dot-entry symlinked, expo-notifications alone a real, patched copy, and
# pod install run again so the Pods project points at the worktree's copy.
rm node_modules
mkdir node_modules
for entry in "$REPO"/node_modules/* "$REPO"/node_modules/.*; do
  name=${entry:t}
  [ "$name" = "." ] && continue
  [ "$name" = ".." ] && continue
  [ "$name" = "expo-notifications" ] && continue
  ln -s "$entry" "node_modules/$name"
done
cp -R "$REPO/node_modules/expo-notifications" node_modules/expo-notifications
python3 "$PLAN/scripts/splice-pod.py" \
  node_modules/expo-notifications/ios/ExpoNotifications/Notifications/NotificationRecords.swift
(cd ios && pod install > "$OUT/pod-reinstall-variant-b.log" 2>&1)
build_variant B

echo "STUDY BUILDS OK"
