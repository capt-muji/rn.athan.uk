#!/bin/zsh
# Session 8 study builds. Worktree-only: every file this script touches or writes
# lives under ~/athan-device-sweep; nothing is committed, nothing merges.
# Run from the repository root:
#   zsh ai/plans/08-ios-replace-previous-notification/scripts/build-study.sh
# Ends: STUDY BUILDS OK
set -euo pipefail

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
  security cms -D -i "$app/embedded.mobileprovision" 2>/dev/null | grep -m1 'com.mugtaba.athan.experiments'
  mkdir -p "$OUT/variant${label}"
  rm -rf "$OUT/variant${label}/AthanLab.app"
  cp -R "$app" "$OUT/variant${label}/AthanLab.app"
  echo "VARIANT ${label} OK: $OUT/variant${label}/AthanLab.app"
}

build_variant A

python3 "$PLAN/scripts/splice-pod.py" \
  ios/Pods/expo-notifications/ios/ExpoNotifications/Notifications/NotificationRecords.swift
build_variant B

echo "STUDY BUILDS OK"
