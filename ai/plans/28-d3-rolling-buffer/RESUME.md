# Session 28 (D3): where this stopped, and what the next session does

Written 2026-09-27, mid-build, with the work on branch `design/d3-reminder-explorations` and nothing merged.
`uat-2` is clean and unchanged. Read `INVESTIGATION.md` in this folder first: it holds the measurements this
page's decisions rest on.

## 1. The one thing that must be settled before any more code

**The rolling window is an open owner decision, and the half-built code currently has it wrong.**

`shared/constants.ts` holds `NOTIFICATION_ROLLING_DAYS = 1`, set to make the second reminder fit 64. Measured
against a real London year that leaves the next Fajr unarmed for **79.9% of the year** and arms nothing at all
for 15.7% of every day. It must not ship.

The owner ruled "keep 1 day, second reminder everywhere" BEFORE the Fajr consequence was known, then asked for
the investigation that found it. So the ruling stands on facts that have since changed, and the next session
re-asks it with the numbers in `INVESTIGATION.md` section 4:

| Model | Worst horizon | Both reminders | Next Fajr always armed |
| --- | --- | --- | --- |
| 2 list days, 1 reminder (ships today) | 44.0h | no | yes |
| 1 list day, 2 reminders (current code) | **0h** | yes | **no, 79.9% unarmed** |
| Request budget, 2 reminders (recommended) | 47.1h | yes | yes |

The recommendation is the request budget: keep `NOTIFICATION_ROLLING_DAYS = 2` as a source of CANDIDATES, then
arm the soonest N requests rather than every request in the window. It beats what ships today on every axis.

**Do not finish the test repair until this is settled**, because the failing suites' expected values are a
direct function of the window.

## 2. What is built and green

- `shared/types.ts`: `ReminderSlot`, `REMINDER_SLOTS`, `ReminderSetting`; `AlertMenuState.reminders` is now a
  two-slot tuple replacing the flat `reminderAlert` / `reminderInterval` pair.
- `shared/constants.ts`: `DEFAULT_REMINDER_SLOT_INTERVALS = [5, 30]` (owner's defaults).
- `components/sheets/parts/reminderStep.ts`: `stepReminderInterval(value, step, taken)` skips the taken minute;
  `freeReminderInterval` moves a reminder off a taken minute when it switches on. **Both fully tested, green.**
- `components/sheets/parts/Stepper.tsx`: takes `taken`, greys the arrow that has nothing left to reach, and its
  accessibility labels now name the true destination. **Tested, green** including the owner's two cases.
- `components/sheets/screens/ReminderCard.tsx`: one reminder's card, Design 1.
- `components/sheets/screens/Alert.tsx`: two cards, Reminder 2 locked until Reminder 1 is on.
- `stores/notifications.ts`, `device/notifications.ts`, `hooks/useNotification.ts`: slot-aware throughout,
  both slots armed in ONE pass (a per-slot pass makes each cancel the other's alarms as stale).
- `tsc` is clean across the whole repo.

## 3. What is not done

- **122 tests failing in 14 suites.** Almost all are the window change, not the reminder change: they assert a
  two-day set of identifiers. They are reporting correctly and must not be "fixed" by pasting in whatever the
  code now prints.
- `components/sheets/screens/__tests__/Alert.test.tsx` needs cases for the second card: locked until Reminder 1
  is on, each slot keeping its own sound, and the skip behaviour end to end.
- **What's New entry, owner-requested this session, both platforms.** Not started. Pattern and the `flags`
  mechanism are in `ai/AGENTS.md` under Feature Flags.
- Coverage must return to 100%; `ReminderCard.tsx` currently has no test of its own.
- No device proof on either phone. Android has no 64 cap, so iOS is where the window matters.

## 4. Facts established this session, so nobody re-derives them

- **The window counts LIST DAYS, not hours.** `genScheduleDatesForPrayer` returns `[today]` at one day. Rows of
  today already past are skipped, so the horizon shrinks through the day and reaches zero.
- **Two reminders on one prayer need no new identifier field.** The interval is already in the identifier
  (`reminder_standard_fajr_2026-06-20_5` beside `..._30`), and the sheet cannot put both on one minute, so they
  cannot collide. Verified end to end: both armed, distinct, at the right instants.
- **No new audio.** All 66 prayer x interval reminder sounds already exist, so a second reminder at a different
  interval already has its sound. Two reminders at the SAME interval would have collided, which is the deeper
  reason the sheet forbids it.
- **Slot 0 keeps the single-reminder MMKV keys**, slot 1 takes a `_2` suffix, so every existing user's reminder
  survives with no migration. `reminderSlotSuffix` in `stores/notifications.ts` is the one place that decides it.
- **`setPrayerAlertType` forces every slot Off** when the at-time alert goes Off; that invariant now loops over
  `REMINDER_SLOTS` and a new slot joins it automatically.

## 4b. All or nothing now spans THREE alerts (owner, 2026-09-27)

A prayer commits three alarms at once: the at-time alert and both reminders. Finding 81's rule is unchanged by
the count, but the failure it must survive is bigger, because by the time the third refuses the other two are
already armed on the phone AND written to MMKV.

**The existing mechanism already covers it, verified rather than assumed.** With all three genuinely armed and
recorded and the third then refused: `committed: false`, all three preferences back to Off, `DB records left: 0`,
`OS alarms left: []`. `commitPrayerAlertChange` marks the prayer, `applyPrayerAlerts` reports the refusal,
and `undoPrayerAlertChange` re-applies the previous settings, whose own clear path cancels the two that landed.

Seven tests in `notificationAlertCommit.test.ts` now pin it, under "a prayer whose three alerts are committed
together": all three arm, each of the three refusing in turn puts the whole prayer back, no record outlives its
alarm, all three turn off together, and the three go to the phone IN PARALLEL rather than one after another.

DURABLE LESSON from writing them: `triggers()` is a log of every scheduling ATTEMPT, including ones later
cancelled, while `osIdentifiers()` is what the phone still holds. Reading the first to judge a rollback reports
a leak that is not there. Judge cleanup with `osIdentifiers()` and the DB records, never with `triggers()`.

## 5. The conflict rule, as the owner settled it

Two reminders may never hold the same minute. The stepper **skips** the taken value (10 -> skip 15 -> 20) and
**greys out** at the ends, exactly as it already does at 5 and 30. No error, no warning, no popup: the bad state
cannot be expressed. The owner's two cases, both green:

- R1 = 5, R2 = 10: R2's minus is disabled, nothing below 10 is free.
- R2 = 5, R1 = 10: R1's minus is disabled, the mirror case.

## 6. Order for the next session

1. Put the window decision to the owner with section 1's table. Nothing else starts first.
2. Implement it, and pin the INVARIANTS rather than counts: the next Fajr is always armed, and the worst-case
   horizon across a real year never drops below 24h. A request count is a consequence and will drift; these do not.
3. Repair the 14 suites against the settled window.
4. Alert sheet tests, then the What's New entry.
5. Coverage to 100%, `yarn validate`, then device proof on the XS and the 3T.
