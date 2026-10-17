#!/usr/bin/env bash
# Pre-flight for ticket 133. Run from $TMPDIR with the worktree path as the
# only argument: bash preflight-133.sh <worktree>
set -u
wt="${1:?usage: preflight-133.sh <worktree>}"
fail=0
reason() { echo "PREFLIGHT FAILED: $1"; fail=1; }

cd "$wt" || { echo "PREFLIGHT FAILED: no worktree $wt"; exit 1; }

# Branch and anchor sha.
branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "lane/133" ] || reason "worktree is on $branch, not lane/133"
git merge-base --is-ancestor 39812f50 HEAD || reason "worktree is behind the planned-at sha 39812f50"

# Clean tree.
[ -z "$(git status --porcelain)" ] || reason "tree is not clean"

# Origin fetched and contained in the lane branch.
git fetch -q origin uat || reason "git fetch origin uat failed"
git merge-base --is-ancestor origin/uat HEAD || reason "lane branch does not contain fetched origin/uat; merge uat first"

# Version not lower than planned-at.
v_app="$(python3 -c 'import json;print(json.load(open("app.json"))["expo"]["version"])' 2>/dev/null || echo missing)"
python3 -c 'import sys;sys.exit(0 if sys.argv[1]!="missing" and tuple(map(int,sys.argv[1].split(".")))>=(2,0,979) else 1)' "$v_app" || reason "app.json version $v_app is lower than 2.0.979"

# CLI version pinned in both trees (steps 2 and 4 run npx from the main tree).
v_cli="$(node -e 'console.log(require("@expo/cli/package.json").version)' 2>/dev/null || echo missing)"
[ "$v_cli" = "58.1.10" ] || reason "worktree @expo/cli is $v_cli, not 58.1.10: STOP per the plan"
v_cli_main="$(cd "$HOME/repos/rn.athan.uk" && node -e 'console.log(require("@expo/cli/package.json").version)' 2>/dev/null || echo missing)"
[ "$v_cli_main" = "58.1.10" ] || reason "main tree @expo/cli is $v_cli_main, not 58.1.10: STOP per the plan"

# Emulator binary new enough.
v_emu="$(emulator -version 2>/dev/null | awk 'NR==1{print $4}')"
python3 -c 'import sys;sys.exit(0 if sys.argv[1] and tuple(sys.argv[1].split("."))>=("37","1","11","0") else 1)' "$v_emu" 2>/dev/null || reason "emulator on PATH is '$v_emu', older than 37.1.11.0 or absent"

# No AVD of this name yet (step 1 creates it).
emulator -list-avds 2>/dev/null | grep -qx "athan-smoke-28" && reason "AVD athan-smoke-28 already exists"

# Anchors count exactly 1.
p="$wt/ai/plans/133-avd-lane"
for pair in "readme-30fps-heading:e2e/README.md" "agents-atlas-bullet:e2e/AGENTS.md" "smoke-flow:e2e/flows/smoke.yaml"; do
  a="$p/scripts/anchors/${pair%%:*}.md"
  src="${pair#*:}"
  n="$(python3 -c 'import sys;print(open(sys.argv[1]).read().count(open(sys.argv[2]).read()))' "$wt/$src" "$a")"
  [ "$n" = "1" ] || reason "anchor ${pair%%:*} counts $n in $src (need 1)"
done

# Queue row not DONE.
grep -q "^| 133 |" "$wt/ai/plans/README.md" || reason "queue row 133 missing"
sed -n '/^| 133 |/p' "$wt/ai/plans/README.md" | grep -q "| DONE" && reason "queue row 133 is already DONE"

[ "$fail" -eq 0 ] && echo "PREFLIGHT OK"
exit "$fail"
