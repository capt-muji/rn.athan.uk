#!/usr/bin/env bash
# Pre-flight for ticket 75. The executor saves this copy to $TMPDIR and runs it
# from there: bash preflight-75.sh
set -u
fail=0
reason() { echo "PREFLIGHT FAIL: $1"; fail=1; }

WT="$HOME/athan-gitree/run-75"
PLAN="$WT/ai/plans/75-visual-polish"
cd "$WT" || { echo "PREFLIGHT FAIL: worktree missing at $WT"; exit 1; }

# 1. The run's single branch, descended from the anchor.
branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" = "ticket/75" ] || reason "checkout is on $branch, expected ticket/75"
git merge-base --is-ancestor 1b0d5229 HEAD || reason "HEAD is not descended from the anchor 1b0d5229"

# 2. Clean tree.
[ -z "$(git status --porcelain)" ] || reason "worktree is not clean"

# 3. Version floor and ceiling: the owner reserved 2.0.450 to 2.0.499.
pkg=$(node -p "require('./package.json').version")
appv=$(node -p "require('./app.json').expo.version")
[ "$pkg" = "$appv" ] || reason "app.json version $appv differs from package.json $pkg"
node -e "const p=require('./package.json').version.split('.').map(Number);process.exit(p[0]===2&&p[1]===0&&p[2]>=402&&p[2]<500?0:1)" || reason "package.json version $pkg sits outside 2.0.402 to 2.0.499"

# 4. node_modules present (symlinked or installed).
[ -d node_modules ] || reason "node_modules missing in the worktree"

# 5. Anchors: each excerpt counts exactly 1 in its source file.
count() { python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"; }
check_anchor() {
  n=$(count "$PLAN/scripts/anchors/$1" "$WT/$2")
  [ "$n" = "1" ] || reason "anchor $1 counts $n in $2 (expected 1)"
}
check_anchor masjid-image.txt components/ui/Masjid.tsx
check_anchor sheet-contentwrapper.txt components/sheets/parts/Sheet.tsx
check_anchor toggle-track.txt components/sheets/parts/Toggle.tsx
check_anchor toggle-travel.txt components/sheets/parts/Toggle.tsx
check_anchor settings-card.txt components/sheets/screens/Settings.tsx
check_anchor constants-interactive.txt shared/constants.ts

# 6. Parallel invariant: no sibling-claimed file differs from the anchor.
# Ticket 80 owns the first eleven, ticket 76 the last four.
for f in stores/bootstrap.ts stores/language.ts shared/i18n/locale.ts \
  app/_layout.tsx app/index.tsx device/listeners.ts stores/notifications.ts \
  components/sheets/screens/QiblaWave.tsx shared/qiblaWave.ts components/ui/Error.tsx \
  components/sheets/screens/ColorPicker.tsx \
  components/sheets/screens/Qibla.tsx components/sheets/screens/QiblaCompass.tsx \
  components/overlay/OverlayInfoBox.tsx components/prayer/Explanation.tsx; do
  git diff --quiet 1b0d5229 HEAD -- "$f" || reason "parallel-invariant file changed: $f"
done

if [ "$fail" -eq 0 ]; then echo "PREFLIGHT OK"; exit 0; fi
exit 1
