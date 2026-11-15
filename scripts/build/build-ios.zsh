#!/bin/zsh
: "${ATHAN_BUNDLE_ID:?set locally - the real bundle id is never committed}"
# build-ios.zsh <commit-or-branch> <out.app> <env:local|prod>
#
# Release iOS build of Athan from any commit of $HOME/repos/rn.athan.uk: its own detached
# worktree (default ~/athan-build/worktrees/ios-build), the main checkout's node_modules,
# prebuild -p ios --clean, pod install, xcodebuild Release. EXPO_PUBLIC_ENV picks mock
# (local) or prod data.
#
# IOS_DEST overrides the xcodebuild destination (default generic/platform=iOS; pass e.g.
# 'platform=iOS Simulator,id=<udid>' for a simulator build, which skips signing).
# IOS_SUFFIX (e.g. fleettest) gives the build its own bundle id, app group and display
# name so it installs beside the owner's app: the suffix is exported inside this prebuild
# and build, never passed to them. IOS_WT overrides the worktree path.

emulate -L zsh
setopt pipe_fail no_unset

REPO=$HOME/repos/rn.athan.uk
SWEEP=$HOME/athan-build
WT=${IOS_WT:-$SWEEP/worktrees/ios-build}
DD=$SWEEP/worktrees/.tmp-ios-dd
TEAM=9V3WAU9Z54
REF=$1
OUT=${2:A}
ENVKIND=${3:-local}
NAME=${OUT:t:r}
LOGS=${OUT:h}/logs
SECONDS=0

fail() { print -u2 -- "\nBUILD-IOS FAILED: $*"; exit 1; }
say() { print -- "== $*"; }

(( $# == 3 )) || fail "usage: ${0:t} <commit-or-branch> <out.app> <env:local|prod>"
[[ $OUT == *.app ]] || fail "output must end in .app: $OUT"
case $OUT in (/tmp/*|/private/tm[p]/*|$REPO/*) fail "output must not be under /tmp or inside the repo: $OUT";; esac
case $WT in (/tmp/*|/private/tm[p]/*|$REPO/*) fail "worktree must not be under /tmp or inside the repo: $WT";; esac
[[ $ENVKIND == local || $ENVKIND == prod ]] || fail "env must be local or prod: $ENVKIND"
mkdir -p $LOGS ${WT:h} ${OUT:h} || fail "cannot create $LOGS"

unset -m 'EXPO_PUBLIC_*'
unset EXPO_ANDROID_SUFFIX EXPO_NAME_SUFFIX EXPO_IOS_SUFFIX 2>/dev/null
export CI=1 EXPO_NO_TELEMETRY=1
export EXPO_PUBLIC_ENV=$ENVKIND
GROUP=group.${ATHAN_BUNDLE_ID}
NAME_SUFFIX='BGTest'
if [[ -n ${IOS_SUFFIX:-} ]]; then
  export EXPO_IOS_SUFFIX=$IOS_SUFFIX
  NAME_SUFFIX=${IOS_NAME_SUFFIX:-FleetTest}
  export EXPO_NAME_SUFFIX=$NAME_SUFFIX
  GROUP=group.${ATHAN_BUNDLE_ID}.$IOS_SUFFIX
fi
export EXPO_APP_ID=${ATHAN_BUNDLE_ID} EXPO_BUNDLE_ID=${ATHAN_BUNDLE_ID} \
  EXPO_APP_GROUP=$GROUP EXPO_EAS_PROJECT_ID=feadd49a-8467-4860-95c5-8ae0c8bc119b \
  EXPO_PUBLIC_ANDROID_PACKAGE=${ATHAN_BUNDLE_ID} EXPO_PUBLIC_IOS_BUNDLE_ID=${ATHAN_BUNDLE_ID} \
  EXPO_PUBLIC_IOS_WIDGETS=1

others=$(pgrep -fl 'GradleWrapperMain.*assemble' 2>/dev/null)
[[ -z $others ]] || print -u2 -- "NOTE: a Gradle build is running: $others"

# ---- resolve the ref and place the worktree (local refs only; never fetches) --------------------
SHA=$(git -C $REPO rev-parse --verify --quiet "$REF^{commit}") \
  || fail "'$REF' does not resolve to a commit in $REPO (local refs only; this script never fetches)"
SUBJECT=$(git -C $REPO log -1 --format='%h %s' $SHA)
say "ref $REF -> $SHA ($SUBJECT)"
if [[ -e $WT ]]; then
  [[ -e $WT/.git ]] || fail "$WT exists but is not a git worktree"
  common=$(git -C $WT rev-parse --path-format=absolute --git-common-dir) || fail "git cannot read $WT"
  [[ $common == $REPO/.git ]] || fail "$WT belongs to $common, not $REPO"
  dirty=$(git -C $WT status --porcelain --untracked-files=no) || fail "git status failed in $WT"
  [[ -z $dirty ]] || fail "worktree $WT has tracked changes:\n$dirty"
  git -C $WT checkout --quiet --detach $SHA || fail "checkout of $SHA in $WT failed"
  say "worktree $WT moved to $SHA"
else
  git -C $REPO worktree add --detach $WT $SHA > $LOGS/$NAME.worktree.log 2>&1 \
    || fail "git worktree add exited $? (log $LOGS/$NAME.worktree.log)"
  say "worktree $WT created at $SHA"
fi

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
(cd $WT && npx expo prebuild -p ios --no-install --clean) > $LOGS/$NAME.prebuild.log 2>&1 || fail "prebuild exited $? (log $LOGS/$NAME.prebuild.log)"

say "pod install (log $LOGS/$NAME.pod.log)"
(cd $WT/ios && pod install) > $LOGS/$NAME.pod.log 2>&1 || fail "pod install exited $? (log $LOGS/$NAME.pod.log)"

DEST=${IOS_DEST:-generic/platform=iOS}
sim=0; [[ $DEST == *Simulator* ]] && sim=1
args=(build -workspace Athan.xcworkspace -scheme Athan -configuration Release -destination "$DEST" -derivedDataPath $DD)
if (( ! sim )); then
  args+=(-allowProvisioningUpdates CODE_SIGN_STYLE=Automatic DEVELOPMENT_TEAM=$TEAM)
fi
rm -rf $DD && mkdir -p $DD
say "xcodebuild Release $DEST (log $LOGS/$NAME.release.log)"
(cd $WT/ios && xcodebuild "${args[@]}") > $LOGS/$NAME.release.log 2>&1 \
  || { tail -40 $LOGS/$NAME.release.log >&2; fail "xcodebuild exited $? (log $LOGS/$NAME.release.log)"; }

proddir=Release-iphoneos; (( sim )) && proddir=Release-iphonesimulator
APP=$DD/Build/Products/$proddir/Athan.app
[[ -d $APP ]] || fail "no Athan.app at $APP"
rm -rf $OUT && cp -R $APP $OUT || fail "cannot copy .app"

pkg=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' $OUT/Info.plist)
want_pkg=${ATHAN_BUNDLE_ID}${IOS_SUFFIX:+.$IOS_SUFFIX}
[[ $pkg == $want_pkg ]] || fail "bundle id is $pkg, expected $want_pkg"
display=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleDisplayName' $OUT/Info.plist)
ver=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' $OUT/Info.plist)

BIN=$OUT/Athan
size=$(stat -f %z $BIN)
disk=$(du -sk $OUT | cut -f1)
report="APP            $OUT
bundle id      $pkg, version $ver, display $display
source         $REF -> $SHA ($SUBJECT)
env            EXPO_PUBLIC_ENV=$ENVKIND, destination $DEST, app group $GROUP
suffix         ${IOS_SUFFIX:-none} (name suffix $NAME_SUFFIX)
main binary    $size bytes
.app on disk   $disk KiB
phases         total ${SECONDS}s
built          $(date '+%Y-%m-%d %H:%M:%S %Z')"
print -r -- $report > $OUT.build.txt
print -- "\nBUILD-IOS OK\n$report"
