#!/usr/bin/env bash
# Pre-flight for ticket 77 (Help modal entrance flash). The executor saves a copy to
# $TMPDIR and runs it from there: bash preflight-77.sh
set -euo pipefail

fail=0
reason() { echo "PREFLIGHT FAIL: $1"; fail=1; }

# 1. The checkout is on uat with a clean tree.
branch="$(git branch --show-current)"
[ "$branch" = "uat" ] || reason "checkout is on $branch, not uat"
[ -z "$(git status --porcelain)" ] || reason "tree is not clean"

# 2. origin/uat is merged in (fetched first).
git fetch origin uat >/dev/null 2>&1 || true
git merge-base --is-ancestor origin/uat uat || reason "origin/uat is not merged into uat"

# 3. The version is not lower than Planned at (uat ad6a1c89, 2.0.203).
version="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
lowest=$(printf '%s\n2.0.203\n' "$version" | sort -V | head -1)
[ "$lowest" = "2.0.203" ] || reason "package.json version $version is lower than 2.0.203"

# 4. Needs first: nothing (queue row 77 carries no Needs-first tickets).
true

# 5. Every anchor counts exactly 1 in its source at this sha.
count() {
  n="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2")"
  [ "$n" = "1" ] || reason "anchor $1 counts $n in $2 (want 1)"
}
A="$(dirname "$0")/anchors"
count "$A/modal-container-entering.txt" components/modals/Modal.tsx
count "$A/modal-entering-constants.txt" components/modals/Modal.tsx
count "$A/help-button-row.txt" components/modals/Help.tsx
count "$A/help-button-row-style.txt" components/modals/Help.tsx
count "$A/slide-in-down-origin.txt" node_modules/react-native-reanimated/lib/module/layoutReanimation/defaultAnimations/Slide.js
count "$A/fade-in-build.txt" node_modules/react-native-reanimated/lib/module/layoutReanimation/defaultAnimations/Fade.js
count "$A/builder-default-duration.txt" node_modules/react-native-reanimated/lib/module/layoutReanimation/animationBuilder/BaseAnimationBuilder.js
count "$A/mock-animated-view.txt" node_modules/react-native-reanimated/src/mock.ts

[ "$fail" = 0 ] || exit 1
echo "PREFLIGHT OK"
