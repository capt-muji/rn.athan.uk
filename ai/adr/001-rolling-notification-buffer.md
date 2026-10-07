# ADR-001: Rolling notification buffer

**Status:** Accepted. A request budget replaced the day-count window on 2026-09-27 (queue row 28).
**Current as of:** 2026-10-07 (1.29.265)
**Related:** ADR-007 (the two refresh layers and their intervals)

## Decision

Every alert is a local scheduled notification. The app holds a rolling buffer of them and re-arms it on each refresh.

- **Sized by request budget, not by days.** iOS keeps the 64 soonest pending requests per app and drops the rest, so `NOTIFICATION_REQUEST_BUDGET` is 64. Rows still due are taken in time order, each row whole (its at-time alert plus its armed reminders), until the next row does not fit.
- **Schedule first.** Identifiers are deterministic, so scheduling one again replaces it in place. Nothing is bulk-cancelled. A final sweep cancels what the OS holds beyond the stored records.
- **One queue.** Every pass runs inside `withSchedulingLock`. Passes run one at a time and none is dropped.
- **Commit on close.** A settings change commits when its sheet closes, only if something changed, and all or nothing.
- **A refresh gate.** A full pass runs when 2 hours (`NOTIFICATION_REFRESH_HOURS`) have passed since the last one, or when an event below has reopened the gate.

The reason for each rule sits beside its code in `stores/notifications.ts` and `shared/notifications.ts`.

## Alternatives rejected

| Alternative | Why it lost |
| --- | --- |
| Each notification schedules the next | Neither OS runs the callback reliably for a backgrounded or killed app. One miss breaks the chain. |
| Schedule a month or a year at once | iOS drops everything past 64 requests. |
| A fixed day-count window (6, 3 and 2 days shipped in turn) | A day is the wrong unit. Three alerts per row left room for one day only, and the next Fajr then sat outside the window for most of the year. |

## Reschedule triggers

Passes that schedule:

| # | Trigger | Entry point | What runs |
| --- | --- | --- | --- |
| 1 | Cold launch, after 1.5 s, with notification permission | `refreshNotifications` | Full pass if the gate is open. Otherwise a pass narrowed to prayers marked for repair, or nothing. |
| 2 | Prayer data lands after a launch with an empty cache | `refreshNotifications` | Same rule. A no-op when trigger 1 already stamped the gate. |
| 3 | Return from background, with notification permission | `refreshNotifications` | Same rule. |
| 4 | The foreground sync's download changed an armed day | `refreshNotifications` | Full pass, queued behind trigger 3. |
| 5 | Background task | `rescheduleAllNotificationsFromBackground` | Best-effort data sync, then a full pass that ignores the gate. |
| 6 | Sound sheet closes with a new athan | `commitSoundSelection` | Preference, Android channel and full pass in one lock acquisition. All three go back on failure. |
| 7 | Alert sheet closes with a change | `commitPrayerAlertChange` | One prayer: its at-time alert and both reminders, with undo. The prayer stays marked for repair until its alarms match its settings. |

Triggers 1 to 5 stamp the gate after a full pass that rescheduled and saw no armed day change while it ran. A narrowed pass and a sheet commit never stamp it.

Events that reopen the gate and schedule nothing themselves:

| # | Event | Where | Why |
| --- | --- | --- | --- |
| 8 | Android cold launch | `reopenRefreshGateOnColdLaunch` | A force-stop or reboot removes alarms without touching the gate. |
| 9 | App version changed, cache shape unchanged | `handleAppUpgrade` | New code may schedule differently. |
| 10 | `CACHE_SCHEMA_VERSION` changed | `clearUpgradeCache` | The wipe removes the alarm records. |
| 11 | Refresh on the error screen | `clearUpgradeCache` | Same wipe. |
| 12 | A download changes a stored day from yesterday to today + 2 | `stores/sync.ts` | An earlier pass stamped the gate over days it could not read. |
| 13 | A native notification call exceeds 15 s | `withSchedulingLock` | A call given up on can still land and arm an alarm with no record. |
