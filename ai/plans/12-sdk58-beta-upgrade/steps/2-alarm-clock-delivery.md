# Step 2: Every notification moves to alarm-clock delivery

**Kind: specified.** The executor builds this step from the contracts below. `(specified)` in
PLAN.md's checklist repeats this.

## 0. Anchor check

Run the PLAN.md section 3 anchor check for this step's anchors (`2-*.txt`). Every count must print
`1`. Any other count means NEEDS REPLAN.

## 1. Goal

Every at-time notification and every reminder the app schedules asks Android for alarm-clock class
delivery, so no OEM battery policy may defer a prayer alert again (ISSUES #17, the fix #49687 ships
in SDK 58).

## 2. Branch

```bash
git checkout -b feat/alarm-clock-delivery uat-2
```

## 3. Files

Exactly these, plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`:

- `shared/notifications.ts`
- `device/notifications.ts`
- `device/__tests__/notifications.test.ts`

## 4. Tests first (red)

One suite changes: `device/__tests__/notifications.test.ts` (existing, appended to). Append this
block at the end of the file, after the last `describe`, separated by one blank line:

```ts
// =============================================================================
// DELIVERY CLASS (ISSUES #17: alarm-clock alarms are never deferred by OEM battery policy)
// =============================================================================

describe('trigger delivery class', () => {
  beforeEach(() => {
    (scheduleNotificationAsync as jest.Mock).mockClear();
  });

  it('arms the at-time notification in the alarm-clock class', async () => {
    await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      '2026-09-01',
      row('Isha', 'العشاء', '2026-09-01', '21:00'),
      AlertType.Silent,
      0
    );

    const trigger = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0].trigger;
    expect(trigger.delivery).toBe('alarmClock');
  });

  it('arms the reminder in the alarm-clock class', async () => {
    await addOneScheduledReminderForPrayer(
      ScheduleType.Standard,
      '2026-09-01',
      row('Isha', 'العشاء', '2026-09-01', '21:00'),
      15,
      AlertType.Silent
    );

    const trigger = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0].trigger;
    expect(trigger.delivery).toBe('alarmClock');
  });
});
```

Both tests use Silent: the delivery class is the same for every alert type (owner, 2026-09-18: all
alerts, silent included), and Silent inputs prove the class does not depend on sound being on.
`row(...)`, `addOneScheduledNotificationForPrayer`, `addOneScheduledReminderForPrayer`,
`scheduleNotificationAsync`, `ScheduleType` and `AlertType` are already imported by the file.

| Test | Proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `arms the at-time notification in the alarm-clock class` | The at-time trigger carries the alarm-clock delivery class, whatever the alert type | Standard Isha, 2026-09-01 21:00, Silent, athan 0 | `trigger.delivery` is exactly `'alarmClock'` |
| `arms the reminder in the alarm-clock class` | The reminder trigger carries the same class | Standard Isha, 15 minutes, Silent | `trigger.delivery` is exactly `'alarmClock'` |

Run:

```bash
npx jest device/__tests__/notifications.test.ts --watchman=false --selectProjects=unit
```

Expected: both new tests FAIL with

```text
Expected: "alarmClock"
Received: undefined
```

and the file's other 23 tests pass. Any other failure, or these passing, is a STOP.

## 5. Change

This step is `(specified)`: build everything below from its contract; nothing here is a file to copy.

### 5a. The one constant

In `shared/notifications.ts`, immediately after the `EXTRAS_NOTIFICATION_SOUND` export (anchor 2-1),
add:

```ts
/**
 * The Android delivery class every trigger this app schedules asks for. Alarm-clock alarms are
 * never deferred by OEM battery policy (ISSUES #17), which is why every at-time alert and every
 * reminder carries it, silent ones included.
 */
export const ALARM_CLOCK_DELIVERY: Notifications.NotificationDelivery = 'alarmClock';
```

One constant, not two literals: expo-notifications 58's `usesAlarmClock` throws
`InvalidArgumentException` on any string but `'bestEffort'` and `'alarmClock'`, so a typo at one
trigger site would refuse every Android schedule and read as a phone refusal (design review finding
12). `NotificationDelivery` is exported from `expo-notifications`, which this file already imports as
`Notifications`.

### 5b. The two trigger sites

In `device/notifications.ts`, the at-time trigger (anchor 2-2) becomes:

```ts
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: atTimeChannelId,
          delivery: NotificationUtils.ALARM_CLOCK_DELIVERY,
        },
```

and the reminder trigger (anchor 2-3) becomes:

```ts
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: reminderChannelId,
          delivery: NotificationUtils.ALARM_CLOCK_DELIVERY,
        },
```

Nothing else changes. The identifiers, the channel wiring, `withNativeTimeout`, the cancellation
paths and the stored records are untouched: the field rides the same calls, in the same order, under
the same scheduling lock.

Platform behaviour this buys, verified from `expo-notifications@58.0.3` source while planning:

- Android below 12 (the 3T): `AlarmManager.setAlarmClock(...)` with the app's launch intent as the
  icon target; `dumpsys alarm` will show `window=0` with the alarm-clock flag (0x5 → 0x9).
- Android 12+ with `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM` (both already in `app.json`): the same
  alarm-clock class.
- Android 12+ without the permission: degrades to `setAndAllowWhileIdle`, today's behaviour.
- iOS: the field is Android-only; `DateTriggerRecord` declares no `delivery` field and ExpoModulesCore
  records ignore undeclared keys, so iOS drops it and schedules as before.

## 6. Green

```bash
npx jest device/__tests__/notifications.test.ts --watchman=false --selectProjects=unit
```

Expected: `Tests: 25 passed, 25 total`. Then:

```bash
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Both exit 0. Full suite (the hook runs it anyway):

```bash
npx jest --silent --coverage
```

ends `Tests: 4533 passed, 4533 total`.

## 7. Breaks

Save as `$TMPDIR/breaks-12-2.sh`, run with `bash $TMPDIR/breaks-12-2.sh` from the repository root:

```bash
#!/bin/bash
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
caught=0
missed=0

break_one() {
  label="$1"; file="$2"; sub="$3"; expect="$4"
  cp "$file" "$file.break-bak"
  perl -0pi -e "$sub" "$file"
  if cmp -s "$file" "$file.break-bak"; then
    echo "BREAK NOT APPLIED: $label"
    missed=$((missed + 1))
  else
    out=$(npx jest device/__tests__/notifications.test.ts --watchman=false --selectProjects=unit 2>&1)
    if echo "$out" | grep -qE "$expect"; then
      echo "caught: $label"
      caught=$((caught + 1))
    else
      echo "NOT CAUGHT: $label"
      echo "$out" | grep -E "Tests:|✕" | head -5
      missed=$((missed + 1))
    fi
  fi
  cp "$file.break-bak" "$file"; rm "$file.break-bak"
}

# 1. The constant's value is the whole decision; a wrong value refuses every schedule on Android
break_one "constant becomes bestEffort" shared/notifications.ts \
  "s/export const ALARM_CLOCK_DELIVERY: Notifications\.NotificationDelivery = 'alarmClock';/export const ALARM_CLOCK_DELIVERY: Notifications.NotificationDelivery = 'bestEffort';/" \
  "2 failed"

# 2. The at-time site carries the field
break_one "at-time delivery dropped" device/notifications.ts \
  "s/channelId: atTimeChannelId,\n          delivery: NotificationUtils\.ALARM_CLOCK_DELIVERY,/channelId: atTimeChannelId,/" \
  "arms the at-time notification in the alarm-clock class"

# 3. The reminder site carries the field
break_one "reminder delivery dropped" device/notifications.ts \
  "s/channelId: reminderChannelId,\n          delivery: NotificationUtils\.ALARM_CLOCK_DELIVERY,/channelId: reminderChannelId,/" \
  "arms the reminder in the alarm-clock class"

echo "caught=$caught missed=$missed"
[ "$missed" -eq 0 ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
```

Expected: `caught=3 missed=0` then `ALL AS EXPECTED: 1`. Break 1 expects `2 failed` (both tests); breaks
2 and 3 each expect their one test's name in the failure list.

## 8. Version and commit

```bash
v=$(node -p "const s=require('./package.json').version.split('.');s[2]=String(Number(s[2])+1);s.join('.')") && echo "$v"
```

Set the version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add, by
name: `shared/notifications.ts`, `device/notifications.ts`,
`device/__tests__/notifications.test.ts`, `app.json`, `package.json`, plus the three plan files when
this session changed them. Commit message (`$TMPDIR/msg-2.txt`, `<VERSION>` replaced):

```text
<VERSION> - feat(notifications): every trigger asks for alarm-clock delivery

expo-notifications 58 carries upstream #49687: DateTriggerInput.delivery
'bestEffort' | 'alarmClock'. One shared constant, ALARM_CLOCK_DELIVERY, feeds both
trigger literals (at-time and reminder), so the two sites cannot drift; the
scheduler throws on any other string. Silent alerts carry it too, by owner
ruling 2026-09-18: an alert the phone defers is an alert missed, whatever it
sounds like. Android below 12 and Android 12+ with the exact-alarm permission
get AlarmManager.setAlarmClock (never deferred by OEM battery policy, ISSUES
#17); without the permission it degrades to today's best-effort class. iOS
ignores the field.

Tests: 4533 passed, 4533 total; coverage 100% statements/branches/functions/lines.
```

## 9. Review

Spawn `Code Reviewer` (a `general` subagent), isolation `worktree`, no `model`, prompt:

```text
Run git checkout --detach <sha>. Review this commit against
/Users/muji/repos/rn.athan.uk/ai/plans/12-sdk58-beta-upgrade/steps/2-alarm-clock-delivery.md (read
it first, in full). Check: the constant exists once in shared/notifications.ts with exactly the
plan's contract; both trigger literals in device/notifications.ts carry
delivery: NotificationUtils.ALARM_CLOCK_DELIVERY and nothing else in either file changed; the two
new tests match their rows (names, inputs, the exact 'alarmClock' assertion); no other file
changed beyond the plan's list and the three plan files. Reply "merge" or "fix first: <findings>".
```

A "fix first" verdict is handled as `EXECUTOR-BRIEF.md` section 4, item 8 says.

## 10. Merge

```bash
git checkout uat-2 && git merge --no-ff feat/alarm-clock-delivery -m "Merge feat/alarm-clock-delivery into uat-2: every notification alarm-clock class, step 2 of session 12"
```

## 11. Done when

The green command ends `Tests: 25 passed, 25 total`; `npx tsc --noEmit` and
`npx biome check . --error-on-warnings` exit 0; the full suite ends
`Tests: 4533 passed, 4533 total`; `bash $TMPDIR/breaks-12-2.sh` ends `ALL AS EXPECTED: 1`;
`git status --porcelain` lists only this step's files and the three plan files.
