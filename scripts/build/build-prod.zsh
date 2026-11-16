#!/bin/zsh
: "${ATHAN_BUNDLE_ID:?set locally - the real bundle id is never committed}"
# build-prod.zsh <commit-or-branch> <out.apk>
#
# Builds the owner's LOCAL production Android release APK of Athan: EXPO_PUBLIC_ENV=prod, so the
# app serves the baked London Unified Prayer Timetable artifact (T-595) and uses the owner's
# athan-storage. Compiled on this Mac
# with Gradle, never on EAS. Same shape as build-mock.zsh: its own detached worktree, the main
# checkout's node_modules, versionCode 1000000 and the debug keystore, so `adb install -r` goes on
# over the builds already on the 3T and keeps the app's data.

emulate -L zsh
setopt pipe_fail no_unset

REPO=$HOME/repos/rn.athan.uk
SWEEP=$HOME/athan-build
WT=${PROD_WT:-$SWEEP/worktrees/prod-build}
ARCHS=${PROD_ARCHS:-arm64-v8a}
SDK=${ANDROID_HOME:-$HOME/Library/Android/sdk}
BT=$SDK/build-tools/37.0.0
PKG=${ATHAN_BUNDLE_ID}
EXPECTED_VC=1000000
EXPECTED_CERT=fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c

fail() { print -u2 -- "\nBUILD-PROD FAILED: $*"; exit 1; }
say() { print -- "== $*"; }

(( $# == 2 )) || fail "usage: ${0:t} <commit-or-branch> <out.apk>"
REF=$1
OUT=${2:A}
NAME=${OUT:t:r}
LOGS=${OUT:h}/logs
BUILD_TMP=${WT:h}/.tmp-${WT:t}
SECONDS=0

[[ $OUT == *.apk ]] || fail "output must end in .apk: $OUT"
case $OUT in (/tmp/*|/private/tm[p]/*|$REPO/*) fail "output must not be under /tmp or inside the repo: $OUT";; esac
case $WT in (/tmp/*|/private/tm[p]/*|$REPO/*) fail "worktree must not be under /tmp or inside the repo: $WT";; esac
[[ -x $BT/aapt && -x $BT/apksigner ]] || fail "aapt or apksigner missing in $BT"
export ANDROID_HOME=$SDK
[[ -n ${JAVA_HOME:-} ]] || export JAVA_HOME=$(/usr/libexec/java_home -v 17) || fail "no JDK 17"
mkdir -p $LOGS ${OUT:h} ${WT:h} || fail "cannot create $LOGS"

unset -m 'EXPO_PUBLIC_*'
unset EXPO_ANDROID_SUFFIX EXPO_NAME_SUFFIX 2>/dev/null
export EXPO_PUBLIC_ENV=prod CI=1 EXPO_NO_TELEMETRY=1

# The store ids are not in the repository. They arrive here, from outside it, and prebuild writes
# them into the git-ignored native project; the app group must match the provisioning profile.
BUNDLE=${ATHAN_BUNDLE_ID}
GROUP=group.${ATHAN_BUNDLE_ID}
EAS_ID=feadd49a-8467-4860-95c5-8ae0c8bc119b
export EXPO_APP_ID=$PKG EXPO_BUNDLE_ID=$BUNDLE EXPO_APP_GROUP=$GROUP EXPO_EAS_PROJECT_ID=$EAS_ID
export EXPO_PUBLIC_ANDROID_PACKAGE=$PKG EXPO_PUBLIC_IOS_BUNDLE_ID=$BUNDLE

others=$(pgrep -fl 'GradleWrapperMain.*assemble|export:embed|react-native-xcode' 2>/dev/null)
[[ -z $others ]] || fail "another Android build or bundler is running; it shares node_modules:\n$others"

SHA=$(git -C $REPO rev-parse --verify --quiet "$REF^{commit}") || fail "'$REF' does not resolve to a commit"
SUBJECT=$(git -C $REPO log -1 --format='%h %s' $SHA)
say "ref $REF -> $SHA ($SUBJECT)"

if [[ -e $WT ]]; then
  [[ $(git -C $WT rev-parse --path-format=absolute --git-common-dir) == $REPO/.git ]] || fail "$WT is not a worktree of $REPO"
  [[ -z $(git -C $WT status --porcelain --untracked-files=no) ]] || fail "worktree $WT has tracked changes"
  git -C $WT checkout --quiet --detach $SHA || fail "checkout of $SHA in $WT failed"
else
  git -C $REPO worktree add --detach $WT $SHA > $LOGS/$NAME.worktree.log 2>&1 || fail "git worktree add failed"
fi
[[ $(git -C $WT rev-parse HEAD) == $SHA ]] || fail "worktree HEAD is not $SHA"

[[ $(shasum -a 256 < $REPO/yarn.lock) == $(shasum -a 256 < $WT/yarn.lock) ]] || fail "yarn.lock differs from the main checkout"
[[ -L $WT/node_modules ]] || { rm -rf $WT/node_modules; ln -s $REPO/node_modules $WT/node_modules || fail "cannot link node_modules"; }
say "node_modules: linked to the main checkout"

# The committed catalog without the build-injected lines; EXPO_PUBLIC_ENV reaches Expo
# from the exported process env only
grep -vE '^EXPO_PUBLIC_(ENV|ANDROID_PACKAGE|IOS_BUNDLE_ID)=|^EXPO_(APP_ID|BUNDLE_ID|APP_GROUP|EAS_PROJECT_ID)=' $WT/.env.example > $WT/.env || fail "cannot write $WT/.env"
print -- 'EXPO_PUBLIC_ENV=prod' >> $WT/.env

say "expo prebuild -p android --no-install --clean (log $LOGS/$NAME.prebuild.log)"
(cd $WT && npx expo prebuild -p android --no-install --clean) > $LOGS/$NAME.prebuild.log 2>&1 \
  || fail "expo prebuild exited $? (log $LOGS/$NAME.prebuild.log)"

GRADLE_FILE=$WT/android/app/build.gradle
APP_VERSION=$(cd $WT && node -p "require('./app.json').expo.version") || fail "cannot read app.json version"
grep -q "applicationId '$PKG'" $GRADLE_FILE || fail "applicationId is not $PKG"
grep -q "versionName \"$APP_VERSION\"" $GRADLE_FILE || fail "versionName is not $APP_VERSION"
grep -qE "^ *versionCode $EXPECTED_VC\$" $GRADLE_FILE || fail "versionCode is not $EXPECTED_VC"

APK_BUILT=$WT/android/app/build/outputs/apk/release/app-release.apk
rm -f $APK_BUILT
rm -rf $BUILD_TMP && mkdir -p $BUILD_TMP || fail "cannot reset $BUILD_TMP"

say "gradlew assembleRelease --no-daemon -PreactNativeArchitectures=$ARCHS (log $LOGS/$NAME.gradle.log)"
(cd $WT/android && TMPDIR=$BUILD_TMP ./gradlew assembleRelease --no-daemon -PreactNativeArchitectures=$ARCHS) \
  > $LOGS/$NAME.gradle.log 2>&1
code=$?
(( code == 0 )) || { tail -40 $LOGS/$NAME.gradle.log >&2; fail "gradle exited $code (log $LOGS/$NAME.gradle.log)"; }
grep -q '^BUILD SUCCESSFUL' $LOGS/$NAME.gradle.log || fail "gradle exited 0 without BUILD SUCCESSFUL"
[[ -s $APK_BUILT ]] || fail "gradle succeeded but $APK_BUILT is missing"
cp $APK_BUILT $OUT || fail "cannot copy the APK to $OUT"

badging=${${(M)${(f)"$($BT/aapt dump badging $OUT 2>/dev/null)"}:#package:*}[1]:-}
re="name='([^']+)' versionCode='([0-9]+)' versionName='([^']+)'"
[[ $badging =~ $re ]] || fail "cannot parse badging: $badging"
[[ $match[1] == $PKG && $match[2] == $EXPECTED_VC && $match[3] == $APP_VERSION ]] \
  || fail "badging is $match[1] $match[2] $match[3], expected $PKG $EXPECTED_VC $APP_VERSION"
cert=$($BT/apksigner verify --print-certs $OUT 2>/dev/null | grep -m1 'certificate SHA-256 digest' | awk '{print $NF}')
[[ $cert == $EXPECTED_CERT ]] || fail "signer $cert is not the owner's debug certificate"

BUNDLE=$BUILD_TMP/index.android.bundle
unzip -p $OUT assets/index.android.bundle > $BUNDLE && [[ -s $BUNDLE ]] || fail "no bundle in $OUT"
[[ $(xxd -l 8 -p $BUNDLE) == c61fbc03c103191f ]] || fail "bundle is not Hermes bytecode"
LC_ALL=C grep -aqF londonprayertimes $BUNDLE && fail "the retired API domain is in the bundle"
# aapt2 obfuscates file resources in release builds (the artifact lands as res/NN.bin),
# so the entry is found by size and LUPT magic, never by name
ARTIFACT=''
for entry in ${(f)"$(unzip -l $OUT | awk '$1 == 223548 {print $4}')"}; do
  if [[ $(unzip -p $OUT $entry | head -c 4) == LUPT ]]; then ARTIFACT=$entry; break; fi
done
[[ -n $ARTIFACT ]] || fail "no 223548-byte LUPT artifact in the APK"
[[ $(unzip -p $OUT "$ARTIFACT" | wc -c | tr -d ' ') == 223548 ]] || fail "the LUPT artifact in the APK is not 223548 bytes"
rm -rf $BUILD_TMP

size=$(stat -f %z $OUT)
report="APK            $OUT
size           $size bytes ($(( size / 1048576 )) MiB)
package        $PKG, versionCode $EXPECTED_VC, versionName $APP_VERSION
signer         $cert (owner's debug certificate)
sha256         $(shasum -a 256 $OUT | cut -c1-64)
source         $REF -> $SHA ($SUBJECT)
env            EXPO_PUBLIC_ENV=prod, LUPT artifact $ARTIFACT in the APK, no API domain in the bundle, archs $ARCHS
built          $(date '+%Y-%m-%d %H:%M:%S %Z') in ${SECONDS}s, locally with Gradle (no EAS)"
print -r -- $report > $OUT.build.txt
print -- "\nBUILD-PROD OK\n$report"
