#!/bin/zsh
: "${ATHAN_BUNDLE_ID:?set locally - the real bundle id is never committed}"
# t491-ios-build.zsh <sha> <out.app> <env:local|prod>
# Reproduces the lane's step-2/3 iOS Release device build: detached worktree, main checkout's
# node_modules, prebuild -p ios --clean, pod install, xcodebuild Release generic with the paid
# team inline. EXPO_PUBLIC_ENV picks mock (local) or prod data.
emulate -L zsh
setopt pipe_fail no_unset

REPO=$HOME/repos/rn.athan.uk
WT=$HOME/athan-gitree/worktrees/ios-build
DD=$HOME/athan-gitree/worktrees/.tmp-t491-s4-dd
TEAM=9V3WAU9Z54
SHA=$1
OUT=${2:A}
ENVKIND=${3:-local}
NAME=${OUT:t:r}
LOGS=${OUT:h}/logs
SECONDS=0

fail() { print -u2 -- "\nT491-IOS FAILED: $*"; exit 1; }
say() { print -- "== $*"; }

mkdir -p $LOGS
unset -m 'EXPO_PUBLIC_*'
unset EXPO_ANDROID_SUFFIX EXPO_NAME_SUFFIX 2>/dev/null
export CI=1 EXPO_NO_TELEMETRY=1
if [[ $ENVKIND == prod ]]; then
  export EXPO_PUBLIC_ENV=prod
else
  export EXPO_PUBLIC_ENV=local
fi
export EXPO_APP_ID=${ATHAN_BUNDLE_ID} EXPO_BUNDLE_ID=${ATHAN_BUNDLE_ID} \
  EXPO_APP_GROUP=group.${ATHAN_BUNDLE_ID} EXPO_EAS_PROJECT_ID=feadd49a-8467-4860-95c5-8ae0c8bc119b \
  EXPO_PUBLIC_ANDROID_PACKAGE=${ATHAN_BUNDLE_ID} EXPO_PUBLIC_IOS_BUNDLE_ID=${ATHAN_BUNDLE_ID} \
  EXPO_PUBLIC_IOS_WIDGETS=1

others=$(pgrep -fl 'GradleWrapperMain.*assemble' 2>/dev/null)
[[ -z $others ]] || print -u2 -- "NOTE: a Gradle build is running: $others"

git -C $WT cat-file -e $SHA:mocks/minutes.ts 2>/dev/null || fail "$SHA not readable in $WT"
git -C $WT checkout --quiet HEAD -- mocks/minutes.ts 2>/dev/null
dirty=$(git -C $WT status --porcelain --untracked-files=no)
[[ -z $dirty ]] || fail "worktree has tracked changes: $dirty"
git -C $WT checkout --quiet --detach $SHA || fail "checkout failed"
say "worktree at $(git -C $WT rev-parse --short HEAD)"

if [[ $(shasum -a 256 < $REPO/yarn.lock) == $(shasum -a 256 < $WT/yarn.lock) ]]; then
  [[ -L $WT/node_modules ]] || { rm -rf $WT/node_modules; ln -s $REPO/node_modules $WT/node_modules; }
  say "node_modules linked"
else
  fail "yarn.lock differs from main checkout"
fi

grep -vE '^EXPO_PUBLIC_(ENV|ANDROID_PACKAGE|IOS_BUNDLE_ID|IOS_WIDGETS|ANDROID_WIDGETS)=|^EXPO_(APP_ID|BUNDLE_ID|APP_GROUP|EAS_PROJECT_ID)=' $WT/.env.example > $WT/.env || fail "cannot write .env"
print -- "EXPO_PUBLIC_ENV=$ENVKIND
EXPO_PUBLIC_IOS_WIDGETS=1" >> $WT/.env

say "prebuild (log $LOGS/$NAME.prebuild.log)"
(cd $WT && npx expo prebuild -p ios --no-install --clean) > $LOGS/$NAME.prebuild.log 2>&1 || fail "prebuild exited $?"

say "pod install (log $LOGS/$NAME.pod.log)"
(cd $WT/ios && pod install) > $LOGS/$NAME.pod.log 2>&1 || fail "pod install exited $?"

rm -rf $DD && mkdir -p $DD
say "xcodebuild Release (log $LOGS/$NAME.release.log)"
(cd $WT/ios && xcodebuild -workspace Athan.xcworkspace -scheme Athan -configuration Release \
  -destination generic/platform=iOS -allowProvisioningUpdates -derivedDataPath $DD \
  CODE_SIGN_STYLE=Automatic DEVELOPMENT_TEAM=$TEAM build) > $LOGS/$NAME.release.log 2>&1 \
  || fail "xcodebuild exited $?"

APP=$DD/Build/Products/Release-iphoneos/Athan.app
[[ -d $APP ]] || fail "no Athan.app at $APP"
rm -rf $OUT && cp -R $APP $OUT || fail "cannot copy .app"

BIN=$OUT/Athan
size=$(stat -f %z $BIN)
syms=$(nm -gU $BIN | wc -l | tr -d ' ')
disk=$(du -sk $OUT | cut -f1)
gzipsz=$(cd $OUT && tar -cf - . | gzip -9 | wc -c | tr -d ' ')
ver=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' $OUT/Info.plist)
pkg=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' $OUT/Info.plist)
report="APP            $OUT
bundle id      $pkg, version $ver
source         $SHA
env            EXPO_PUBLIC_ENV=$ENVKIND
main binary    $size bytes, $syms exported symbols (nm -gU)
.app on disk   $disk KiB
gzip estimate  $gzipsz bytes (tar -cf - . | gzip -9)
debug dylibs   $(find $OUT -name '*.debug.dylib' -o -name '__preview.dylib' | wc -l | tr -d ' ')
phases         total ${SECONDS}s
built          $(date '+%Y-%m-%d %H:%M:%S %Z')"
print -r -- $report > $OUT.build.txt
print -- "\nT491-IOS OK\n$report"
