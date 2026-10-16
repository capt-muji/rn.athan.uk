#!/usr/bin/env bash
# Pre-flight for ticket 120 (docs-only investigation). Run from the worktree root:
#   bash "$TMPDIR/preflight-120.sh"
# It ends with the single line PREFLIGHT OK, or PREFLIGHT FAILED and the reasons.
set -u

PLANNED_SHA="b329d543"
PLANNED_VERSION="2.0.900"
PINNED_NOTIFICATIONS="58.1.5"
ANCHOR_DIR="ai/plans/120-notification-center/scripts/anchors"
fail=0

reason() {
  echo "- $1"
  fail=1
}

# 1. The branch is the lane's, and the base sha is in its history.
branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "lane/120" ] || reason "on branch $branch, expected lane/120"
git rev-parse --verify --quiet "$PLANNED_SHA" >/dev/null || reason "planned-at sha $PLANNED_SHA is not in this history"
git merge-base --is-ancestor "$PLANNED_SHA" HEAD 2>/dev/null || reason "$PLANNED_SHA is not an ancestor of HEAD"

# 2. origin/uat is fetched, and the local uat ref is at or past the plan's base.
git rev-parse --verify --quiet refs/remotes/origin/uat >/dev/null || reason "origin/uat is not fetched"
git merge-base --is-ancestor "$PLANNED_SHA" uat 2>/dev/null || reason "the local uat ref is behind $PLANNED_SHA (fetch origin and rebase)"

# 3. The tree is clean apart from the plan folder, the queue row and the two tracked version files.
stray="$(git status --porcelain | awk '{print $2}' | grep -v -e '^ai/plans/README.md$' -e '^ai/plans/120-notification-center/' -e '^app.json$' -e '^package.json$' || true)"
[ -z "$stray" ] || reason "unexpected changed paths: $(echo "$stray" | tr '\n' ' ')"

# 4. The version is not lower than the plan's base.
version="$(python3 -c "import json;print(json.load(open('package.json'))['version'])")"
appjson="$(python3 -c "import json;print(json.load(open('app.json'))['expo']['version'])")"
[ "$version" = "$appjson" ] || reason "package.json $version and app.json $appjson disagree"
python3 - "$version" "$PLANNED_VERSION" <<'PY' || reason "version $version is lower than $PLANNED_VERSION"
import sys
a = tuple(int(x) for x in sys.argv[1].split('.')[:3])
b = tuple(int(x) for x in sys.argv[2].split('.')[:3])
sys.exit(0 if a >= b else 1)
PY

# 5. Every anchor counts exactly 1 in its own source file.
count_anchor() {
  local anchor="$1" source="$2"
  [ -f "$anchor" ] || { reason "missing anchor $anchor"; return; }
  [ -f "$source" ] || { reason "missing anchor source $source"; return; }
  local n
  n="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor" "$source")"
  [ "$n" = "1" ] || reason "$(basename "$anchor") counts $n in $source, expected 1"
}
count_anchor "$ANCHOR_DIR/a1-genNotificationContent.txt" shared/notifications.ts
count_anchor "$ANCHOR_DIR/a2-genReminderNotificationContent.txt" shared/notifications.ts
count_anchor "$ANCHOR_DIR/a3-prayerIdentifier.txt" device/notifications.ts
count_anchor "$ANCHOR_DIR/a4-armingCall.txt" device/notifications.ts
count_anchor "$ANCHOR_DIR/a5-foregroundHandler.txt" hooks/useNotification.ts
count_anchor "$ANCHOR_DIR/a6-androidDelegate.txt" plugins/replacePreviousNotification.js
count_anchor "$ANCHOR_DIR/a7-mockContentInput.txt" shared/__mocks__/expo-notifications.ts
count_anchor "$ANCHOR_DIR/a10-initPermissionBranch.txt" shared/notifications.ts

# 6. The pinned package is the pin this plan was written against.
installed="$(python3 -c "import json;print(json.load(open('node_modules/expo-notifications/package.json'))['version'])" 2>/dev/null || echo missing)"
[ "$installed" = "$PINNED_NOTIFICATIONS" ] || reason "expo-notifications installed is $installed, plan pinned $PINNED_NOTIFICATIONS"

# 7. The pinned-source facts the plan cites by path and line.
iOS_RECORDS="node_modules/expo-notifications/ios/ExpoNotifications/Notifications/NotificationRecords.swift"
iOS_PRESENT="node_modules/expo-notifications/ios/ExpoNotifications/Notifications/Presenting/PresentationModule.swift"
ANDROID_BUILDER="node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/notifications/ArgumentsNotificationContentBuilder.java"
grep -q "content.threadIdentifier = threadIdentifier" "$iOS_RECORDS" || reason "the iOS thread assignment is missing from $iOS_RECORDS"
grep -q "removeAllDeliveredNotifications()" "$iOS_PRESENT" || reason "dismissAllNotificationsAsync no longer routes to removeAllDeliveredNotifications in $iOS_PRESENT"
grep -q "deliveredNotifications()" "$iOS_PRESENT" || reason "getPresentedNotificationsAsync no longer reads deliveredNotifications() in $iOS_PRESENT"
grep -q "setGroup(getGroup(payload))" "$ANDROID_BUILDER" || reason "the Android group-key mapping is missing from $ANDROID_BUILDER"
grep -q 'data\["threadIdentifier"\]' node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/notifications/model/NotificationData.kt || reason "the Android threadIdentifier-to-group binding is missing from NotificationData.kt"
grep -q "content: content.toUNMutableNotificationContent()" node_modules/expo-notifications/ios/ExpoNotifications/Notifications/Scheduling/SchedulerModule.swift || reason "the iOS scheduler no longer builds content through the thread-identifier record"
grep -q "removeDeliveredNotifications(withIdentifiers: \[identifier\])" "$iOS_PRESENT" || reason "dismissNotificationAsync no longer routes to removeDeliveredNotifications in $iOS_PRESENT"
grep -q "notificationManager.cancelAll()" node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/service/delegates/ExpoPresentationDelegate.kt || reason "the Android dismissal route no longer reaches cancelAll()"
grep -q "fun dismissAll(context: Context" node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/service/NotificationsService.kt || reason "the Android dismissal entry point moved from NotificationsService.kt:175"
grep -q "\[ios\] Add support for grouping notifications via .threadIdentifier." node_modules/expo-notifications/CHANGELOG.md || reason "the iOS grouping changelog entry (58.0.0) is missing"
grep -q "\[Android\] Add support for grouping notifications via .threadIdentifier." node_modules/expo-notifications/CHANGELOG.md || reason "the Android grouping changelog entry (58.1.1) is missing"
grep -q "threadIdentifier?: string" node_modules/expo-notifications/build/Notifications.types.d.ts || reason "the JS content input no longer declares threadIdentifier"
if grep -q "summaryArgument" node_modules/expo-notifications/build/Notifications.types.d.ts && \
   python3 - <<'PY'
import re
s = open('node_modules/expo-notifications/build/Notifications.types.d.ts').read()
start = s.index('export type NotificationContentInput')
end = s.index('};', start)
raise SystemExit(0 if 'summaryArgument' in s[start:end] else 1)
PY
then
  reason "the JS content input now exposes summaryArgument; D120.4 must be re-argued before a step continues"
fi

# 8. The app tree carries no delivered-notification handling.
sweep="$(grep -rn "dismissAllNotificationsAsync\|dismissNotificationAsync\|getPresentedNotificationsAsync\|setBadgeCountAsync" app device hooks shared stores plugins --include='*.ts' --include='*.tsx' --include='*.js' 2>/dev/null || true)"
[ -z "$sweep" ] || reason "app code now calls a delivered-notification API: $(echo "$sweep" | head -3 | tr '\n' ' ')"

# 9. The Android delegate still posts under the one shared tag.
grep -q '"athan-notification"' plugins/replacePreviousNotification.js || reason "the shared notification tag moved"

if [ "$fail" -eq 0 ]; then
  echo "PREFLIGHT OK"
  exit 0
fi
echo "PREFLIGHT FAILED"
exit 1
