#!/bin/bash
# Pre-flight for plan 134. Run from a copy in $TMPDIR, the lane worktree root as cwd.
set -euo pipefail
ROOT=$PWD
[[ -f app.config.ts && "$(git rev-parse --show-toplevel 2>/dev/null)" == "$ROOT" ]] || {
  echo "not a git worktree root holding app.config.ts: $ROOT"; exit 1;
}
BR=$(git rev-parse --abbrev-ref HEAD)
[[ $BR == lane/134 || $BR == fix/* ]] || { echo "unexpected branch $BR"; exit 1; }

# worktree clean, nothing on origin/uat missing from the branch
[[ -z $(git status --porcelain) ]] || { echo "tree dirty"; exit 1; }
git fetch -q origin uat
git merge-base --is-ancestor origin/uat HEAD || { echo "origin/uat has commits missing here"; exit 1; }

# version not lower than Planned at
PLANNED=2.0.1002
CUR=$(python3 -c 'import json;print(json.load(open("app.json"))["expo"]["version"])')
[[ "$(printf '%s\n' "$PLANNED" "$CUR" | sort -V | tail -1)" == "$CUR" ]] || { echo "version $CUR below Planned at $PLANNED"; exit 1; }

# Needs first: nothing (verify the queue holds no open dependency)
grep -q "^| 134 |" ai/plans/README.md || { echo "ticket row missing"; exit 1; }

# anchors count exactly 1
A=ai/plans/134-lint-gate/scripts/anchors
declare -A SRC=(
  [resolve-config.txt]=app.config.ts
  [plugin-defaults.txt]=plugins/androidLocaleConfig.js
  [flags-strip-test.txt]=shared/__tests__/flags.test.ts
  [native-pin.txt]=shared/__tests__/nativeLocalesConfig.test.ts
)
for k in "${!SRC[@]}"; do
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$k" "${SRC[$k]}")
  [[ $n == 1 ]] || { echo "anchor $k counts $n in ${SRC[$k]}"; exit 1; }
done
n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/cli-no-platform.txt" node_modules/@expo/config/build/Config.js)
[[ $n == 1 ]] || { echo "anchor cli-no-platform.txt counts $n"; exit 1; }
n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/build-mock-env.txt" "$HOME/athan-gitree/bin/build-mock.zsh")
[[ $n == 1 ]] || { echo "anchor build-mock-env.txt counts $n"; exit 1; }

echo "PREFLIGHT OK"
