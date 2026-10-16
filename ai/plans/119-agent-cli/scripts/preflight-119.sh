#!/usr/bin/env bash
# Pre-flight for ticket 119. Save a copy to $TMPDIR and run it from there.
set -u
fail=0
reason() { echo "PREFLIGHT FAIL: $1"; fail=1; }

# Worktree and branch
[ "$(git branch --show-current)" = "lane/119" ] || reason "not on lane/119 ($(git branch --show-current))"
[ -z "$(git status --porcelain)" ] || reason "tree not clean"

# uat fetched and the branch anchored at or past the planned sha
git fetch -q origin uat
base=$(git merge-base lane/119 uat)
git merge-base --is-ancestor 1ea6ceff "$base" 2>/dev/null || reason "merge base $base is before planned sha 1ea6ceff"

# Version not lower than planned
ver=$(node -e "console.log(require('./package.json').version)")
node -e "process.exit(require('semver').gte('$ver','2.0.875')?0:1)" 2>/dev/null || \
  node -e "const p=a=>a.split('.').map(Number);const [x,y]=['$ver','2.0.875'].map(p);process.exit(x[0]>y[0]||(x[0]===y[0]&&x[1]>y[1])||(x[0]===y[0]&&x[1]===y[1]&&x[2]>=y[2])?0:1)" || \
  reason "version $ver is lower than planned 2.0.875"

# Anchors: each counts exactly 1 in its source
F=ai/plans/119-agent-cli/scripts/anchors
for pair in "agents-md-routing.md:ai/AGENTS.md" "agents-md-ban.md:ai/AGENTS.md" \
            "agents-md-eas-rule.md:ai/AGENTS.md" "agents-md-skills-dir.md:ai/AGENTS.md" \
            "package-json-expo.md:package.json" "root-agents-redirect.md:AGENTS.md"; do
  a="${pair%%:*}"; src="${pair##*:}"
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$F/$a" "$src")
  [ "$n" = "1" ] || reason "anchor $a counts $n in $src (want 1)"
done

# The CLI version this plan investigates is still the npm latest
v=$(npm view @expo/agent-cli version 2>/dev/null)
[ "$v" = "1.0.19" ] || reason "npm latest is $v, plan is pinned to 1.0.19"

[ "$fail" = "0" ] && echo "PREFLIGHT OK"
exit "$fail"
