#!/usr/bin/env bash
# Pre-flight for ticket 122 step 1. Usage: bash preflight-122.sh <worktree>
# bash 3.2 compatible. Ends PREFLIGHT OK on success.
set -u
wt="${1:?usage: preflight-122.sh <worktree>}"
fail=0
step() { printf '%s\n' "$1"; }
bad() { printf 'PREFLIGHT FAIL: %s\n' "$1"; fail=1; }

[ -d "$wt" ] || { printf 'PREFLIGHT FAIL: no worktree %s\n' "$wt"; exit 1; }
cd "$wt" || exit 1

branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "lane/122" ] || bad "worktree is on $branch, expected lane/122"

git merge-base --is-ancestor 1788e83c HEAD || bad "HEAD is not past the planned-at sha 1788e83c"

[ -z "$(git status --porcelain)" ] || bad "tree is not clean: $(git status --porcelain | head -3)"

git fetch -q origin uat || bad "git fetch origin uat failed"

v="$(python3 -c 'import json;print(json.load(open("app.json"))["expo"]["version"])')"
python3 -c "import sys;v='$v'.split('.');sys.exit(0 if tuple(map(int,v))>=(2,0,969) else 1)" || bad "app.json version $v is lower than the planned-at 2.0.969"

cli="$(node -e 'console.log(require("./node_modules/@expo/cli/package.json").version)')"
[ "$cli" = "58.1.10" ] || bad "@expo/cli is $cli, the doc claim was measured at 58.1.10"

count() { python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"; }

n="$(count ai/plans/122-cli-device-docs/scripts/anchors/readme-stale.md e2e/README.md)"
[ "$n" = "1" ] || bad "readme-stale anchor count $n, expected 1"
n="$(count ai/plans/122-cli-device-docs/scripts/anchors/agents-stale.md e2e/AGENTS.md)"
[ "$n" = "1" ] || bad "agents-stale anchor count $n, expected 1"

grep -q "AVD" e2e/README.md e2e/AGENTS.md && bad "an AVD string already exists in a target file"

if [ "$fail" = "0" ]; then step "PREFLIGHT OK"; exit 0; fi
exit 1
