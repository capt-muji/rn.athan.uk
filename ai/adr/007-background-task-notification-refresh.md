# ADR-007: Two refresh layers for the notification buffer

**Status:** Accepted
**Current as of:** rev 4, 2026-09-23 (issue #36). Checked against the code on 2026-10-07 (1.29.265).
**Related:** ADR-001 (the buffer, the lock, the gate and every trigger)

## Decision

Two layers re-arm the buffer. Both run the same full pass through `withSchedulingLock`.

| Layer | Role | Runs | Constant |
| --- | --- | --- | --- |
| Background task (`expo-background-task`) | Primary. It keeps the buffer rolling with the app closed, and it alone recovers a phone that lost its alarms while nobody opens the app. | No sooner than every 3 hours, at a moment the OS chooses. Never gated. | `BACKGROUND_TASK_INTERVAL_HOURS = 3` |
| Foreground refresh (launch and return from background) | Fallback for a starved background layer: force-quit, OEM kill, a suppressed boot broadcast, a new install. | When 2 hours have passed since the last full pass, or the gate was reopened. | `NOTIFICATION_REFRESH_HOURS = 2` |

## Why these numbers (rev 4)

- The background interval is the ceiling on how long an unattended phone stays silent after losing its alarms. At 6 hours the measured latency was `+5h59m59s998ms`, and two prayers passed unrecovered (issue #36). That ceiling sizes the interval. The length of the buffer does not.
- 3 hours is not an aggressive cadence. Every iOS scheduler deferral measured was at 15 minutes or below, and 180 minutes was verified delivering on schedule (issue #8).
- `earliestBeginDate` is a floor, not a request rate. A shorter interval cannot make iOS run the task less often.
- The foreground gate is the shorter of the two on purpose. It costs one timestamp comparison and no OS scheduler, so nothing rations it, and every opened app is a free chance to notice lost alarms.
- The two intervals do not differ to avoid collisions. The lock is a queue, so overlapping passes run in turn.

## Alternatives rejected

| Alternative | Why it lost |
| --- | --- |
| Background task only | The OS may delay or skip it, and an opened app would have to wait for it. |
| Foreground refresh only | A phone nobody opens runs out of buffer. |
| Server push to wake the app | It needs a backend. The app has none by design. |
| 6 hour background and 12 hour foreground gate (rev 3, 2026-09-02) | Sized only against how long the buffer may go unrefreshed. It ignored recovery after lost alarms. |

## Where it lives

`shared/constants.ts` (intervals and their reasons), `device/tasks.ts` (task definition), `stores/notifications.ts` (`registerBackgroundTask`, `rescheduleAllNotificationsFromBackground`, `refreshNotifications`).
