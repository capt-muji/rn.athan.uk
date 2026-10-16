#!/usr/bin/env bash
# Pre-flight for ticket 118. The executor saves a copy to $TMPDIR and runs it
# from there against the lane worktree root passed as $1 (default: the repo).
# Prints PREFLIGHT OK when every check passes.
set -u
ROOT="${1:-$HOME/repos/rn.athan.uk}"
cd "$ROOT" || { echo "PREFLIGHT FAILED: no checkout at $ROOT"; exit 1; }

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "branch $BRANCH"

if [ -n "$(git status --porcelain | grep -v '^?? plan-preflight' | grep -v '^?? ai/plans/118-variable-fonts/')" ]; then
  echo "PREFLIGHT FAILED: tree not clean"
  git status --porcelain | head -5
  exit 1
fi

git fetch -q origin uat
if ! git merge-base --is-ancestor origin/uat HEAD; then
  echo "PREFLIGHT FAILED: origin/uat not merged into HEAD"
  exit 1
fi

VERSION="$(python3 -c "import json;print(json.load(open('app.json'))['expo']['version'])")"
echo "version $VERSION"
TOO_LOW="$(python3 -c "import sys;print('yes' if tuple(map(int,'$VERSION'.split('.')))<(2,0,857) else 'no')")"
if [ "$TOO_LOW" = "yes" ]; then
  echo "PREFLIGHT FAILED: version below the Planned-at floor 2.0.857"
  exit 1
fi

PLAN="ai/plans/118-variable-fonts"
check_anchor() {
  local anchor="$1" source="$2"
  local count
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
    "$PLAN/scripts/anchors/$anchor" "$source")"
  if [ "$count" != "1" ]; then
    echo "PREFLIGHT FAILED: anchor $anchor counts $count in $source"
    exit 1
  fi
}
check_anchor typography-arabic.txt shared/typography.ts
check_anchor appjson-fonts.txt app.json
check_anchor countdown-tabular.txt components/countdown/Countdown.tsx
check_anchor constants-families.txt shared/constants.ts

for f in assets/fonts/Roboto-Regular.ttf assets/fonts/Roboto-Medium.ttf \
         assets/fonts/Rubik-Regular.ttf assets/fonts/Rubik-Medium.ttf \
         assets/fonts/NotoSansDevanagari-Regular.ttf assets/fonts/NotoSansDevanagari-Medium.ttf \
         assets/fonts/NotoSansThai-Regular.ttf assets/fonts/NotoSansThai-Medium.ttf; do
  if [ ! -f "$f" ]; then
    echo "PREFLIGHT FAILED: $f missing"
    exit 1
  fi
done

if ! python3 -c 'import fontTools' 2>/dev/null; then
  echo "PREFLIGHT FAILED: fontTools absent from python3"
  exit 1
fi

echo "PREFLIGHT OK"
