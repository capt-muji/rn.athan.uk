#!/bin/zsh
: "${ATHAN_BUNDLE_ID:?set locally - the real bundle id is never committed}"
# build-mock.zsh <commit-or-branch> <mocks-file> <out.apk>
#
# Builds a MOCK-SERVING Android release APK of Athan from any commit or local branch of
# $HOME/repos/rn.athan.uk. EXPO_PUBLIC_ENV=local, so api/client.ts serves MOCK_DATA_SIMPLE
# (the given mocks file, copied over mocks/minutes.ts) and stores/database.ts opens
# athan-storage-dev, never the owner's athan-storage. versionCode 1000000 and the debug keystore,
# so `adb install -r` goes on over the owner's local production build. Recipe: ../BUILD.md.
#
# Never touches the main checkout's working tree, index or branches: it builds in its own
# detached worktree (default ~/athan-device-sweep/worktrees/mock-build), never fetches, never
# calls EAS. Re-running with a branch name moves the worktree to wherever that branch points now.
#
# Env overrides: MOCK_WT (worktree path), MOCK_ARCHS (default arm64-v8a, the 3T's ABI).

emulate -L zsh
setopt pipe_fail no_unset

REPO=$HOME/repos/rn.athan.uk
SWEEP=$HOME/athan-gitree
WT=${MOCK_WT:-$SWEEP/worktrees/mock-build}
ARCHS=${MOCK_ARCHS:-arm64-v8a}
SDK=${ANDROID_HOME:-$HOME/Library/Android/sdk}
BT=$SDK/build-tools/37.0.0
PKG=${ATHAN_BUNDLE_ID}
EXPECTED_VC=1000000
# The Android Debug certificate the owner's installed build carries (state/owner-before.txt)
EXPECTED_CERT=fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c

fail() { print -u2 -- "\nBUILD-MOCK FAILED: $*"; exit 1; }
say() { print -- "== $*"; }

(( $# == 3 )) || fail "usage: ${0:t} <commit-or-branch> <mocks-file> <out.apk>"
REF=$1
MOCKS=${2:A}
OUT=${3:A}
NAME=${OUT:t:r}
LOGS=${OUT:h}/logs
BUILD_TMP=${WT:h}/.tmp-${WT:t}   # Metro's cache lives under TMPDIR; kept outside the worktree
SECONDS=0

# ---- arguments and toolchain ----------------------------------------------------------------
[[ -s $MOCKS ]] || fail "mocks file missing or empty: $MOCKS"
grep -q 'export const mockMinutesSnapshot' $MOCKS || fail "$MOCKS does not export mockMinutesSnapshot"
[[ $OUT == *.apk ]] || fail "output must end in .apk: $OUT"
case $OUT in (/tmp/*|/private/tm[p]/*|$REPO/*) fail "output must not be under /tmp or inside the repo: $OUT";; esac
case $WT in (/tmp/*|/private/tm[p]/*|$REPO/*) fail "worktree must not be under /tmp or inside the repo: $WT";; esac
[[ -x $BT/aapt && -x $BT/apksigner ]] || fail "aapt or apksigner missing in $BT"
export ANDROID_HOME=$SDK
[[ -n ${JAVA_HOME:-} ]] || export JAVA_HOME=$(/usr/libexec/java_home -v 17) || fail "no JDK 17"
mkdir -p $LOGS ${OUT:h} ${WT:h} || fail "cannot create $LOGS"

# Only this build's variables reach prebuild, Metro and Gradle: no API key, no package suffix
unset -m 'EXPO_PUBLIC_*'
unset EXPO_ANDROID_SUFFIX EXPO_NAME_SUFFIX 2>/dev/null
export EXPO_PUBLIC_ENV=local CI=1 EXPO_NO_TELEMETRY=1

# The store ids are not in the repository. They arrive here, from outside it, and prebuild writes
# them into the git-ignored native project; the app group must match the provisioning profile.
BUNDLE=${ATHAN_BUNDLE_ID}
GROUP=group.${ATHAN_BUNDLE_ID}
EAS_ID=feadd49a-8467-4860-95c5-8ae0c8bc119b
export EXPO_APP_ID=$PKG EXPO_BUNDLE_ID=$BUNDLE EXPO_APP_GROUP=$GROUP EXPO_EAS_PROJECT_ID=$EAS_ID
export EXPO_PUBLIC_ANDROID_PACKAGE=$PKG EXPO_PUBLIC_IOS_BUNDLE_ID=$BUNDLE

others=$(pgrep -fl 'GradleWrapperMain.*assemble|export:embed|react-native-xcode' 2>/dev/null)
[[ -z $others ]] || fail "another Android build or bundler is running; it shares node_modules:\n$others"

# ---- resolve the ref (local refs only) -------------------------------------------------------
SHA=$(git -C $REPO rev-parse --verify --quiet "$REF^{commit}") \
  || fail "'$REF' does not resolve to a commit in $REPO (local refs only; this script never fetches)"
SUBJECT=$(git -C $REPO log -1 --format='%h %s' $SHA)
git -C $REPO cat-file -e $SHA:mocks/minutes.ts 2>/dev/null || fail "$SHA has no mocks/minutes.ts"
say "ref $REF -> $SHA ($SUBJECT)"

# ---- worktree: create, or move the existing one to SHA -----------------------------------------
if [[ -e $WT ]]; then
  [[ -e $WT/.git ]] || fail "$WT exists but is not a git worktree"
  common=$(git -C $WT rev-parse --path-format=absolute --git-common-dir) || fail "git cannot read $WT"
  [[ $common == $REPO/.git ]] || fail "$WT belongs to $common, not $REPO"
  if git -C $WT cat-file -e HEAD:mocks/minutes.ts 2>/dev/null; then
    git -C $WT checkout --quiet HEAD -- mocks/minutes.ts || fail "cannot restore mocks/minutes.ts in $WT"
  fi
  dirty=$(git -C $WT status --porcelain --untracked-files=no) || fail "git status failed in $WT"
  [[ -z $dirty ]] || fail "worktree $WT has tracked changes besides the mock; inspect it:\n$dirty"
  git -C $WT checkout --quiet --detach $SHA || fail "checkout of $SHA in $WT failed"
  say "worktree $WT moved to $SHA"
else
  git -C $REPO worktree add --detach $WT $SHA > $LOGS/$NAME.worktree.log 2>&1 \
    || fail "git worktree add exited $? (log $LOGS/$NAME.worktree.log)"
  say "worktree $WT created at $SHA"
fi
[[ $(git -C $WT rev-parse HEAD) == $SHA ]] || fail "worktree HEAD is not $SHA"

# ---- node_modules: the main checkout's when yarn.lock matches, else the worktree's own -----------
main_lock=$(shasum -a 256 < $REPO/yarn.lock | cut -c1-64)
wt_lock=$(shasum -a 256 < $WT/yarn.lock | cut -c1-64)
if [[ $main_lock == $wt_lock ]]; then
  if [[ -L $WT/node_modules ]]; then
    [[ ${${:-$WT/node_modules}:A} == ${REPO:A}/node_modules ]] || fail "$WT/node_modules links somewhere else"
  else
    [[ -d $WT/node_modules ]] && { rm -rf $WT/node_modules || fail "cannot remove the worktree's own node_modules"; }
    ln -s $REPO/node_modules $WT/node_modules || fail "cannot link node_modules"
  fi
  say "node_modules: linked to the main checkout (yarn.lock identical)"
else
  [[ -L $WT/node_modules ]] && { rm -f $WT/node_modules || fail "cannot unlink node_modules"; }
  stamp=$WT/node_modules/.build-mock-yarn-lock
  if [[ ! -s $stamp || $(<$stamp) != $wt_lock ]]; then
    rm -rf $WT/node_modules
    say "node_modules: yarn.lock differs from the main checkout, installing (log $LOGS/$NAME.yarn.log)"
    (cd $WT && HUSKY=0 yarn install --frozen-lockfile --non-interactive) > $LOGS/$NAME.yarn.log 2>&1 \
      || fail "yarn install exited $? (log $LOGS/$NAME.yarn.log)"
    print -r -- $wt_lock > $stamp
  fi
  say "node_modules: the worktree's own install"
fi

# ---- .env: the committed catalog, forced to a local build ----------------------------------------
if [[ -s $WT/.env.example ]]; then
  grep -vE '^EXPO_PUBLIC_(ENV|ANDROID_PACKAGE|IOS_BUNDLE_ID)=|^EXPO_(APP_ID|BUNDLE_ID|APP_GROUP|EAS_PROJECT_ID)=' $WT/.env.example > $WT/.env || fail "cannot write $WT/.env"
else
  : > $WT/.env
fi
print -- 'EXPO_PUBLIC_ENV=local' >> $WT/.env

# ---- prebuild: --clean whenever a prebuild input changed since the last build --------------------
inputs=$(for p in app.json app.config.ts package.json yarn.lock plugins assets; do
  print -r -- "$p $(git -C $WT rev-parse -q --verify HEAD:$p 2>/dev/null || print missing)"
done; print -r -- "node_modules $wt_lock")
stamp=$WT/android/.build-mock-prebuild-inputs
clean=()
[[ -d $WT/android && -s $stamp && $(<$stamp) == $inputs ]] || clean=(--clean)
say "expo prebuild -p android --no-install $clean (log $LOGS/$NAME.prebuild.log)"
(cd $WT && npx expo prebuild -p android --no-install $clean) > $LOGS/$NAME.prebuild.log 2>&1 \
  || fail "expo prebuild exited $? (log $LOGS/$NAME.prebuild.log)"
print -r -- $inputs > $stamp

GRADLE_FILE=$WT/android/app/build.gradle
APP_VERSION=$(cd $WT && node -p "require('./app.json').expo.version") || fail "cannot read app.json version"
grep -q "applicationId '$PKG'" $GRADLE_FILE || fail "applicationId is not $PKG: $(grep applicationId $GRADLE_FILE)"
grep -q "versionName \"$APP_VERSION\"" $GRADLE_FILE || fail "versionName is not $APP_VERSION: $(grep versionName $GRADLE_FILE)"
if ! grep -qE "^ *versionCode $EXPECTED_VC\$" $GRADLE_FILE; then
  # A commit whose app.json predates versionCode 1000000 would be refused as a downgrade
  print -- "NOTE: prebuild wrote '$(grep -m1 versionCode $GRADLE_FILE | tr -s ' ')'; patching it to $EXPECTED_VC"
  sed -i '' -E "s/^( *versionCode )[0-9]+\$/\1$EXPECTED_VC/" $GRADLE_FILE || fail "cannot patch versionCode"
  grep -qE "^ *versionCode $EXPECTED_VC\$" $GRADLE_FILE || fail "versionCode patch did not take"
fi

# ---- the mock, fresh outputs, isolated Metro cache ----------------------------------------------
cp $MOCKS $WT/mocks/minutes.ts && cmp -s $MOCKS $WT/mocks/minutes.ts || fail "cannot copy the mock into $WT"
APK_BUILT=$WT/android/app/build/outputs/apk/release/app-release.apk
rm -f $APK_BUILT
[[ -d $WT/android/app/build ]] && find $WT/android/app/build -name 'index.android.bundle*' -delete
rm -rf $BUILD_TMP && mkdir -p $BUILD_TMP || fail "cannot reset $BUILD_TMP"

# ---- gradle -------------------------------------------------------------------------------------
say "gradlew assembleRelease --no-daemon -PreactNativeArchitectures=$ARCHS (log $LOGS/$NAME.gradle.log)"
(cd $WT/android && TMPDIR=$BUILD_TMP ./gradlew assembleRelease --no-daemon -PreactNativeArchitectures=$ARCHS) \
  > $LOGS/$NAME.gradle.log 2>&1
code=$?
git -C $WT checkout --quiet HEAD -- mocks/minutes.ts   # leave the worktree clean; the APK has the mock
if (( code != 0 )); then
  tail -40 $LOGS/$NAME.gradle.log >&2
  fail "gradle exited $code (log $LOGS/$NAME.gradle.log)"
fi
grep -q '^BUILD SUCCESSFUL' $LOGS/$NAME.gradle.log || fail "gradle exited 0 without BUILD SUCCESSFUL"
[[ -s $APK_BUILT ]] || fail "gradle succeeded but $APK_BUILT is missing"
[[ -n $(command ls $BUILD_TMP/metro-cache 2>/dev/null) ]] \
  || print -u2 -- "WARNING: Metro wrote nothing under $BUILD_TMP/metro-cache; its cache may be shared"
cp $APK_BUILT $OUT || fail "cannot copy the APK to $OUT"

# ---- verify the artefact ------------------------------------------------------------------------
badging_all=$($BT/aapt dump badging $OUT 2>/dev/null) || fail "aapt dump badging failed on $OUT"
badging=${${(M)${(f)badging_all}:#package:*}[1]:-}
re="name='([^']+)' versionCode='([0-9]+)' versionName='([^']+)'"
[[ $badging =~ $re ]] || fail "cannot parse badging: $badging"
got_pkg=$match[1]; got_vc=$match[2]; got_vn=$match[3]
[[ $got_pkg == $PKG ]] || fail "package is $got_pkg, not $PKG"
[[ $got_vc == $EXPECTED_VC ]] || fail "versionCode is $got_vc, not $EXPECTED_VC"
[[ $got_vn == $APP_VERSION ]] || fail "versionName is $got_vn, app.json says $APP_VERSION"

cert=$($BT/apksigner verify --print-certs $OUT 2>/dev/null | grep -m1 'certificate SHA-256 digest' | awk '{print $NF}')
[[ $cert == $EXPECTED_CERT ]] || fail "signer $cert is not the owner's debug certificate; install -r would be refused"

BUNDLE=$BUILD_TMP/index.android.bundle
unzip -p $OUT assets/index.android.bundle > $BUNDLE && [[ -s $BUNDLE ]] || fail "no assets/index.android.bundle in $OUT"
[[ $(xxd -l 8 -p $BUNDLE) == c61fbc03c103191f ]] || fail "bundle is not Hermes bytecode"
missing=()
dates=(${(f)"$(grep -oE "'20[0-9]{2}-[0-9]{2}-[0-9]{2}'" $MOCKS | tr -d "'" | sort -u)"})
for d in $dates; do LC_ALL=C grep -aqF -- $d $BUNDLE || missing+=$d; done
(( ${#missing} == 0 )) || fail "the bundle lacks dates from the mock (stale bundle?): $missing"

size=$(stat -f %z $OUT)
sha=$(shasum -a 256 $OUT | cut -c1-64)
report="APK            $OUT
size           $size bytes ($(( size / 1048576 )) MiB)
package        $got_pkg
versionCode    $got_vc
versionName    $got_vn
signer         $cert (owner's debug certificate)
sha256         $sha
source         $REF -> $SHA ($SUBJECT)
mock           $MOCKS (sha256 $(shasum -a 256 $MOCKS | cut -c1-64))
env            EXPO_PUBLIC_ENV=local, archs $ARCHS, Hermes bundle, ${#dates} mock dates found
worktree       $WT
logs           $LOGS/$NAME.{prebuild,gradle}.log
built          $(date '+%Y-%m-%d %H:%M:%S %Z') in ${SECONDS}s"
print -r -- $report > $OUT.build.txt
print -- "\nBUILD-MOCK OK\n$report"
