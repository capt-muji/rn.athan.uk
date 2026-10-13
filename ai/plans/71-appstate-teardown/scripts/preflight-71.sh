#!/usr/bin/env bash
# Pre-flight for ticket 71. Run from the repository root:
#   bash "$TMPDIR/preflight-71.sh"
# The script locates the repository and the plan folder on its own, so a copy in
# $TMPDIR works. Ends PREFLIGHT OK, exit 0, when every check holds.
set -u
fail=0

REPO="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "PREFLIGHT FAILED: not inside a git repository"; exit 1; }
PLAN="$REPO/ai/plans/71-appstate-teardown"
cd "$REPO" || exit 1

fail_line() { echo "PREFLIGHT FAILED: $1"; fail=1; }

# 1. On uat, clean tree, origin merged in.
branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "uat" ] || fail_line "on $branch, not uat"
[ -z "$(git status --porcelain)" ] || fail_line "dirty tree"
git fetch origin || fail_line "git fetch origin failed"
git merge-base --is-ancestor origin/uat uat || fail_line "origin/uat is not merged into uat"

# 2. Version not lower than the Planned at 2.0.187.
v="$(node -p "require('./package.json').version")"
node -e '
const v = process.argv[1].split(".").map(Number);
const p = [2, 0, 187];
const ok = v[0] > p[0] || (v[0] === p[0] && (v[1] > p[1] || (v[1] === p[1] && v[2] >= p[2])));
process.exit(ok ? 0 : 1);
' "$v" || fail_line "version $v is below the Planned at 2.0.187"

# 3. Needs first: none. Checked by reading the queue row; `none` or `nothing` both pass.
awk -F'|' '/^\| 71 \|/ { gsub(/ /, "", $6); if ($6 != "" && $6 != "nothing" && $6 !~ /^none/) { print "PREFLIGHT FAILED: row 71 Needs first reads: " $6; exit 1 } }' \
  "$REPO/ai/plans/README.md" | grep -q . && fail_line "row 71 Needs first is not empty"

# 4. Every anchor counts exactly 1 against its source.
count() { python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"; }
for pair in \
  "language-reload-branch.txt:stores/language.ts" \
  "listeners-registration.txt:device/listeners.ts" \
  "listeners-call-site.txt:app/index.tsx" \
  "appstate-onhostpause.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/appstate/AppStateModule.kt" \
  "appstate-sendevent-guard.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/appstate/AppStateModule.kt" \
  "reactcontext-onhostpause.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/bridge/ReactContext.java" \
  "reacthostimpl-reload-pause.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt" \
  "reacthostimpl-taskref-reset.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt" \
  "reacthostimpl-decls.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt" \
  "reacthostimpl-isinitialized.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt" \
  "reacthostimpl-destroy-step.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt" \
  "bridgeless-hasactive.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/BridgelessReactContext.kt" \
  "reacthostimpl-drop.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt" \
  "softexception-logger.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/bridge/ReactSoftExceptionLogger.kt" \
  "expo-restart-extension.txt:node_modules/expo-updates/android/src/main/java/expo/modules/updates/procedures/RestartReactAppExtensions.kt" \
  "updates-module-reload.txt:node_modules/expo-updates/android/src/main/java/expo/modules/updates/UpdatesModule.kt" \
  "error-screen-reload.txt:components/ui/Error.tsx" \
  "perf-listener.txt:shared/perf.ts" \
  "usenotification-listener.txt:hooks/useNotification.ts"
do
  a="$PLAN/scripts/anchors/${pair%%:*}"; f="${pair#*:}"
  [ -f "$a" ] || { fail_line "missing anchor $a"; continue; }
  [ -f "$REPO/$f" ] || { fail_line "missing anchor source $f"; continue; }
  n="$(count "$a" "$REPO/$f")"
  [ "$n" = "1" ] || fail_line "anchor ${pair%%:*} counts $n in $f"
done

if [ "$fail" -eq 0 ]; then
  echo "PREFLIGHT OK"
  exit 0
fi
exit 1
