#!/usr/bin/env bash
# Pre-flight for ticket 122. Save a copy to $TMPDIR and run it from the worktree root,
# while the worktree is still on lane/122 with a clean tree.
set -u
fail=0
reason() { echo "PREFLIGHT FAIL: $1"; fail=1; }

# Worktree and branch
[ "$(git branch --show-current)" = "lane/122" ] || reason "not on lane/122 ($(git branch --show-current))"
[ -z "$(git status --porcelain)" ] || reason "tree not clean"

# uat fetched and the branch anchored at the planned sha
git fetch -q origin uat
git merge-base --is-ancestor cf754b25 uat || reason "local uat does not yet contain planned sha cf754b25"

# Version not lower than planned
ver=$(node -e "console.log(require('./package.json').version)")
node -e "const p=a=>a.split('.').map(Number);const [x,y]=['$ver','2.0.886'].map(p);process.exit(x[0]>y[0]||(x[0]===y[0]&&x[1]>y[1])||(x[0]===y[0]&&x[1]===y[1]&&x[2]>=y[2])?0:1)" \
  || reason "version $ver is lower than planned 2.0.886"

# The CLI this plan cites, and the rewrite it names
cli_ver=$(node -e "console.log(require('./node_modules/@expo/cli/package.json').version)" 2>/dev/null)
[ "$cli_ver" = "58.1.10" ] || reason "@expo/cli is $cli_ver, plan cites 58.1.10"
for m in adbProcess adbDeviceList adbEndpoint adbDiagnostics; do
  [ -f "node_modules/@expo/cli/build/src/start/platforms/android/$m.js" ] || reason "rewrite module $m is missing from the installed build"
done

# The CLI ships no logcat handling
n=$(grep -rni logcat node_modules/@expo/cli/build 2>/dev/null | grep -v '\.map:' | wc -l | tr -d ' ')
[ "$n" = "0" ] || reason "the logcat grep printed $n match(es); FINDINGS claims zero"

# Anchors: each counts exactly 1 in its source
F=ai/plans/122-avd-adb/scripts/anchors
CLI=node_modules/@expo/cli/build/src
for pair in \
  "e2e-readme-device-flag.md:e2e/README.md" \
  "baseline-serial-logcat.md:e2e/scripts/baseline-compare.sh" \
  "agents-md-build-locality.md:ai/AGENTS.md" \
  "agents-md-device-testing.md:ai/AGENTS.md" \
  "cli-serial-first.md:$CLI/start/platforms/android/AndroidDeviceManager.js" \
  "cli-adb-server.md:$CLI/start/platforms/android/ADBServer.js" \
  "cli-bounded-timeout.md:$CLI/start/platforms/android/adbProcess.js" \
  "cli-avd-inventory.md:$CLI/start/platforms/android/emulator.js" \
  "cli-query-limits.md:$CLI/start/platforms/android/adb.js" \
  "cli-discovery-tolerance.md:$CLI/start/platforms/android/getDevices.js" \
  "cli-endpoint.md:$CLI/start/platforms/android/adbEndpoint.js" \
  "cli-diagnostics-advice.md:$CLI/start/platforms/android/adbDiagnostics.js" \
  "cli-binary-install.md:$CLI/run/android/runAndroidAsync.js" ; do
  a="${pair%%:*}"; src="${pair#*:}"
  [ -f "$F/$a" ] || { reason "anchor $a is missing"; continue; }
  [ -f "$src" ] || { reason "anchor $a source $src is missing"; continue; }
  c=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$F/$a" "$src")
  [ "$c" = "1" ] || reason "anchor $a counts $c in $src (want 1)"
done

[ "$fail" = "0" ] && echo "PREFLIGHT OK"
exit "$fail"
