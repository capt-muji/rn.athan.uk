#!/bin/bash
# The claim battery for ticket 121, one block per step. Read-only.
# Run from the worktree root: bash ai/plans/121-expo-location-next/scripts/verify-claims.sh
# Step 3's upstream pull-request state is not shell-checkable: it was read through the GitHub API
# on 2026-10-16 and is recorded in FINDINGS section 2 with its timestamps.
set -u
cd "$(git rev-parse --show-toplevel)"
NEXT=node_modules/expo-location/src/next
MAIN="$HOME/repos/rn.athan.uk"

echo "== installed version"
python3 -c "import json;d=json.load(open('node_modules/expo-location/package.json'));print(d['name'], d['version'])"
python3 -c "import json;print('package.json pin:', json.load(open('package.json'))['dependencies']['expo-location'])"

echo "== R1.1 the JS surface"
sed -n '1,33p' "$NEXT/index.ts"
echo "-- Location.ts"
sed -n '1,17p' "$NEXT/Location.ts"
echo "-- js/index.ts"
sed -n '1,29p' "$NEXT/js/index.ts"

echo "== R1.2/R1.3 heading greps"
printf 'src/next/js: '; grep -rn "heading\|Heading" "$NEXT/js" | wc -l
printf 'src/next:    '; grep -rn "heading\|Heading" "$NEXT" | wc -l
grep -rn "heading\|Heading" "$NEXT"
printf 'native next: '; grep -rn "heading\|Heading" node_modules/expo-location/android/src/main/java/expo/modules/location/next node_modules/expo-location/ios/next | wc -l
grep -rn "heading\|Heading" node_modules/expo-location/android/src/main/java/expo/modules/location/next node_modules/expo-location/ios/next

echo "== R1.4 the field's own documentation and the platform mappings"
sed -n '137,149p' "$NEXT/types/Position.types.ts"
grep -n "heading: course" node_modules/expo-location/ios/next/Position/Position.swift
grep -n "heading = if (hasBearing())" node_modules/expo-location/android/src/main/java/expo/modules/location/next/LocationRecords.kt

echo "== R1.6 the changelog's /next entries, 58.0.10 to the installed version"
awk '/^## 58\.0\.(10|11|12|13|14|15|16)/{v=$2} /next|next\]/{if (v) print v": "$0}' node_modules/expo-location/CHANGELOG.md

echo "== R1.7 the temporary-full-accuracy path"
sed -n '49,62p' "$NEXT/types/Permissions.types.ts"
grep -n "requestTemporaryFullAccuracyAuthorization" node_modules/expo-location/ios/next/Permissions/TemporaryFullAccuracyRequester.swift
grep -n "purposeDictionary\|purposeKey" node_modules/expo-location/ios/next/Permissions/TemporaryFullAccuracyPlistKeys.swift
sed -n '16,20p;272,276p' node_modules/expo-location/plugin/src/withLocation.ts
echo "-- main tree, read-only, generated files"
git -C "$MAIN" log --oneline -1
python3 -c "import json;print('main version:', json.load(open('$MAIN/package.json'))['version'])"
sed -n '79,83p' "$MAIN/ios/Athan/Info.plist"
printf 'expo-location plugin entries in app.json: '; grep -c "expo-location" "$MAIN/app.json" || true
printf 'foreground-service permissions in the manifest: '; grep -c "FOREGROUND_SERVICE" "$MAIN/android/app/src/main/AndroidManifest.xml" || true

echo "== R2.1 the app's import surface"
git grep -n "^import .*expo-location" -- '*.ts' '*.tsx'
printf 'wider grep lines: '; git grep -n "expo-location" -- '*.ts' '*.tsx' | wc -l
git grep -n "expo-location" -- '*.ts' '*.tsx'

echo "== R2.2 every classic call in device/qibla.ts"
grep -n "Location\." device/qibla.ts
printf 'device/qibla.ts lines: '; wc -l < device/qibla.ts

echo "== R2.3 the heading sources"
sed -n '249,266p' hooks/useQibla.ts
sed -n '1,9p' modules/qiblaheading/index.ts
sed -n '32,39p' shared/qiblaSettle.ts

echo "== R3.1 the patch's hunks and the guard"
printf 'hunks: '; grep -c '^@@' patches/expo-location+58.0.16.patch
grep -n '^diff --git\|^@@' patches/expo-location+58.0.16.patch
bash scripts/verify-expo-location-patch.sh
grep -n "SENSOR_DELAY_GAME\|DEGREE_DELTA\|TIME_DELTA" node_modules/expo-location/android/src/main/java/expo/modules/location/LocationModule.kt
grep -n "headingFilter" node_modules/expo-location/ios/Providers/DeviceHeadingStreamer.swift

echo "== R3.1 the upstream record"
sed -n '9,13p;25,28p' ai/UPSTREAM-PRS.md

echo "== R4.3 the row"
grep -o "^| 121 | .\{0,120\}" ai/plans/README.md
grep -o "per row 53's discipline; she rules before code | .\{0,80\}" ai/plans/README.md
