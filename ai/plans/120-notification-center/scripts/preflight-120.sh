#!/usr/bin/env bash
# Pre-flight for ticket 120. Run from a copy saved to $TMPDIR, from the lane worktree root.
# bash 3.2 compatible. Ends PREFLIGHT OK or names the first failure.
set -u
fail=""

die() { echo "PREFLIGHT FAILED: $1"; exit 1; }

# 1. The lane worktree on lane/120.
branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "lane/120" ] || die "not on lane/120 (on $branch)"

# 2. Clean tree.
[ -z "$(git status --porcelain)" ] || die "tree not clean: $(git status --porcelain | head -3)"

# 3. uat merged into the branch.
git fetch -q origin uat || die "cannot fetch origin uat"
git merge-base --is-ancestor uat HEAD || die "uat is not an ancestor of lane/120: rebase first"

# 4. Version not lower than planned (2.0.924).
version="$(node -p 'require("./package.json").version')"
lowest="$(printf '%s\n' "2.0.924" "$version" | sort -V | head -1)"
[ "$lowest" = "2.0.924" ] || die "version $version is lower than the planned 2.0.924"

# 5. Planned-at sha is the merge base.
[ "$(git merge-base uat HEAD)" = "$(git rev-parse d1ce39d9^{commit} 2>/dev/null || echo d1ce39d9)" ] \
  || echo "NOTE: uat moved past the planned-at sha d1ce39d9; anchors re-verified below decide"

# 6. Every anchor counts exactly 1.
anchors_dir="$(git rev-parse --show-toplevel)/ai/plans/120-notification-center/scripts/anchors"
[ -d "$anchors_dir" ] || die "no anchors directory at $anchors_dir"
pairs="
a1-initialize-insert-point.txt shared/notifications.ts
a2-platform-gate-precedent.txt shared/notifications.ts
a3-mock-insert-point.txt shared/__mocks__/expo-notifications.ts
a4-test-describe-head.txt shared/__tests__/notifications.test.ts
a5-background-task-fence.txt device/tasks.ts
a6-foreground-handler.txt hooks/useNotification.ts
a7-cold-launch-caller.txt app/index.tsx
a8-foreground-caller.txt device/listeners.ts
"
echo "$pairs" | while read -r anchor src; do
  [ -n "$anchor" ] || continue
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchors_dir/$anchor" "$src")
  [ "$n" = "1" ] || { echo "PREFLIGHT FAILED: anchor $anchor counts $n in $src"; exit 1; }
done
[ "$?" = "0" ] || exit 1

# 7. The installed library still exposes the call.
grep -q "export { dismissAllNotificationsAsync }" node_modules/expo-notifications/src/index.ts \
  || die "expo-notifications no longer exports dismissAllNotificationsAsync"
grep -q "removeAllDeliveredNotifications" \
  node_modules/expo-notifications/ios/ExpoNotifications/Notifications/Presenting/PresentationModule.swift \
  || die "the iOS native side no longer routes to removeAllDeliveredNotifications"

echo "PREFLIGHT OK"
