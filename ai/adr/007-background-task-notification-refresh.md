# ADR-007: Background Task Notification Refresh

**Status:** Accepted (implemented 1.5.x; ADR corrected 2026-08-29 — see Revision History)
**Date:** 2026-01-26
**Decision Makers:** muji

---

## Context

ADR-001 established a rolling window notification buffer that refreshes when the app is foregrounded. The original decision rejected background tasks because they "never executed reliably" during testing. However, the current approach has a critical gap:

**Problem:** Users who don't open the app for 2+ days will miss notifications because there's no mechanism to refresh the rolling window when the app is closed.

**New requirements:**

1. Reduce foreground refresh interval from 12 hours to 4 hours for faster responsiveness
2. Add background task with 3-hour minimum interval as a redundant refresh mechanism (offset from foreground to reduce collision risk)
3. System delays are acceptable as long as background task runs at least once within 24 hours
4. Both iOS and Android support required

**Platform capabilities have evolved:**

- `expo-background-fetch` is deprecated
- `expo-background-task` is the replacement with improved APIs
- iOS requires `processing` in `UIBackgroundModes`
- Android uses `WorkManager` with 15-minute minimum intervals

**Key constraints:**

- Background tasks are still throttled by both platforms
- iOS doesn't support background tasks on simulators
- Task execution timing is system-controlled, not guaranteed
- Tasks stop if user force-closes the app

## Decision

Implement a **dual-layer notification refresh strategy**:

### Layer 1: Foreground Refresh (Primary)

- Reduce `NOTIFICATION_REFRESH_HOURS` from 12 to 4 hours
- Continue triggering on app foreground and launch
- This remains the primary, most reliable mechanism

### Layer 2: Background Task (Redundant/Fallback)

- Register a background task using `expo-background-task`
- Set minimum interval to 3 hours (10800 seconds)
- Task performs the same refresh operation as foreground refresh
- Both layers share the existing `withSchedulingLock()` guard to prevent concurrent scheduling

### Design Principles

1. **Always reschedule**: Both layers always perform a full reschedule when they run (cancel all → schedule fresh). This ensures consistency and reliability over optimization.

2. **Offset intervals**: Foreground (4 hours) and background (3 hours) use different intervals to reduce the chance of simultaneous execution hitting the scheduling lock.

3. **Extensive logging**: Background tasks are notoriously difficult to debug. Both layers log extensively to aid troubleshooting.

4. **Concurrent execution handling**: If both layers attempt to run simultaneously, `withSchedulingLock()` serializes them — operations are chained in a sequential queue, a second caller waits its turn, and no operation is ever dropped. (The original draft described a skip-based lock where the second caller returns immediately; the shipped implementation is a queue — see `withSchedulingLock` in `stores/notifications.ts`.)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION REFRESH SYSTEM                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐      ┌──────────────────────┐            │
│  │  FOREGROUND REFRESH  │      │  BACKGROUND TASK     │            │
│  │  (Primary Layer)     │      │  (Redundant Layer)   │            │
│  ├──────────────────────┤      ├──────────────────────┤            │
│  │ Trigger: App launch  │      │ Trigger: System      │            │
│  │ Trigger: Foreground  │      │ Interval: ~3 hours   │            │
│  │ Interval: 4 hours    │      │ (system may delay)   │            │
│  │ Reliability: HIGH    │      │ Reliability: MEDIUM  │            │
│  └──────────┬───────────┘      └──────────┬───────────┘            │
│             │                              │                        │
│             └──────────┬───────────────────┘                        │
│                        │                                            │
│                        ▼                                            │
│             ┌──────────────────────┐                               │
│             │  withSchedulingLock  │                               │
│             │  (Dedup Guard)       │                               │
│             └──────────┬───────────┘                               │
│                        │                                            │
│                        ▼                                            │
│             ┌──────────────────────┐                               │
│             │  shouldReschedule?   │                               │
│             │  (4 hour check)      │                               │
│             └──────────┬───────────┘                               │
│                        │                                            │
│                        ▼                                            │
│             ┌──────────────────────┐                               │
│             │ rescheduleAllNotifs  │                               │
│             │ - Cancel all         │                               │
│             │ - Schedule 2-day     │                               │
│             └──────────────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Details

1. **New constant:** `BACKGROUND_TASK_NAME = 'NOTIFICATION_REFRESH_TASK'`

2. **Task definition** (must be at module level):

   ```typescript
   import * as TaskManager from 'expo-task-manager';
   import * as BackgroundTask from 'expo-background-task';

   TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
     try {
       await refreshNotificationsFromBackground();
       return BackgroundTask.BackgroundTaskResult.Success;
     } catch (error) {
       logger.error({ error }, 'BACKGROUND_TASK: Failed to refresh notifications');
       return BackgroundTask.BackgroundTaskResult.Failed;
     }
   });
   ```

3. **Task registration** (in notification initialization):

   ```typescript
   await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
    minimumInterval: BACKGROUND_TASK_INTERVAL_MINUTES, // 180 — MINUTES, not seconds (ISSUES #8)
   });
   ```

    IMPORTANT: `minimumInterval` is documented in MINUTES. The original draft passed
    `3 * 60 * 60` (seconds), which iOS interpreted as 10800 MINUTES = a +7.5-day
    `earliestBeginDate` — re-armed on every launch by the native restore path, the task
    was never due (ISSUES #8, fixed 1.17.10). Registration also unregisters first when
    already registered, so the persisted options can never go stale.

   Registration runs on cold launch (`app/index.tsx`) AND on every foreground-return
   (`device/listeners.ts` → `initializeNotifications(..., registerBackgroundTask)`).
   This is idempotent: `registerBackgroundTask` early-returns via
   `TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME)`, so re-invocation only
   re-checks registration (covering the case where the OS dropped the task while the
   app process stayed alive across many background stints).

4. **iOS configuration** (automatic via expo prebuild):
   - `UIBackgroundModes` includes `processing`

5. **Duplicate prevention:**
   - Both layers use `withSchedulingLock()` to prevent concurrent execution
   - Foreground checks `shouldRescheduleNotifications()` (4-hour elapsed time) to avoid excessive rescheduling on frequent app switches
   - Background task always reschedules when system executes it (OS controls the 3-hour minimum)
   - When rescheduling occurs, it's always a full reschedule (cancel all → schedule fresh) for consistency

## Consequences

### Positive

- **Improved reliability**: Background task provides redundancy for users who rarely open the app
- **Faster refresh**: 4-hour foreground / 3-hour background intervals instead of 12 hours means more responsive notification updates
- **Self-healing**: If foreground refresh fails, background task can recover
- **Works when closed**: Notifications can refresh even when app is not in foreground (when system allows)

### Negative

- **Not guaranteed**: Background task execution timing is system-controlled; may be delayed or skipped
- **Testing difficulty**: iOS background tasks don't work on simulators; must test on physical devices
- **Battery impact**: Background execution consumes battery (mitigated by 3-hour minimum interval and system throttling)
- **Force-close breaks it**: If user force-closes app, background task stops

### Neutral

- **Complexity increase**: Two refresh mechanisms instead of one, but they share the same core logic
- **Platform differences**: iOS and Android behave differently; need to accept variability

## Alternatives Considered

### Alternative 1: Background Task Only (No Foreground Refresh)

**Description:** Remove foreground refresh entirely, rely only on background task.

**Pros:**

- Simpler single mechanism
- No redundant code paths

**Cons:**

- Background task execution is unreliable
- Users would wait for system-controlled timing even when opening the app

**Why Rejected:** Foreground refresh is significantly more reliable. Removing it would degrade user experience.

### Alternative 2: Push Notifications for Refresh Trigger

**Description:** Use server-side push notifications to wake the app and trigger refresh.

**Pros:**

- Server controls timing
- More predictable than background task

**Cons:**

- Requires backend infrastructure
- Adds complexity and ongoing server costs
- Privacy concerns: server needs to know when to wake each user's app

**Why Rejected:** Overkill for this use case. Project explicitly avoids cloud/server dependencies.

### Alternative 3: Keep 12-Hour Interval, Add Background Task

**Description:** Add background task but keep 12-hour foreground refresh interval.

**Pros:**

- Less battery usage from foreground checks

**Cons:**

- Slower response to setting changes
- Background task likely runs ~once per day anyway due to throttling

**Why Rejected:** 4-hour foreground refresh is acceptable and improves responsiveness.

## Implementation Notes

### Files to Create/Modify

| File                          | Change                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `shared/constants.ts`         | Change `NOTIFICATION_REFRESH_HOURS` from 12 to 4, add `BACKGROUND_TASK_NAME`, add `BACKGROUND_TASK_INTERVAL_HOURS = 3` |
| `stores/notifications.ts`     | Add task definition, registration, background refresh function, and extensive logging                                  |
| `app.json` or `app.config.ts` | Add `processing` to `UIBackgroundModes` for iOS (expo-background-task plugin handles this via prebuild)                |

### Testing Strategy

1. **Unit tests**: Mock `expo-background-task` and verify task definition
2. **iOS physical device**: Test background task execution with physical device
3. **Android emulator**: Test WorkManager-based execution
4. **Regression**: Verify foreground refresh still works as primary mechanism
5. **Debug tool**: Use `BackgroundTask.triggerTaskWorkerForTestingAsync()` for debug builds

### Monitoring Consideration

Background task execution is difficult to observe in production. Extensive Pino logging will capture execution events locally. If production monitoring is needed in the future, consider adding telemetry to track:

- Background task execution count and success rate
- Time since last successful refresh
- Platform-specific execution patterns

### Rollback Plan

If background tasks cause issues:

1. Call `BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME)`
2. Remove task definition
3. Foreground refresh continues working independently

### Platform-Specific Considerations

**iOS:**

- Background task requires physical device for testing
- System heavily throttles based on battery, network, usage patterns
- `processing` background mode enables longer-running tasks

**Android:**

- WorkManager handles task scheduling
- 15-minute minimum interval enforced
- OEM battery optimization may affect task execution
- Some devices (Xiaomi, Huawei, etc.) are more aggressive about killing background work

## Related Decisions

- **ADR-001: Rolling Window Notification Buffer** - This ADR extends ADR-001 by:
  - Changing `NOTIFICATION_REFRESH_HOURS` from 12 to 4 (supersedes ADR-001's value)
  - Adding background task layer (new capability not in ADR-001)
  - Retaining the 2-day rolling window and full reschedule approach from ADR-001

---

## Revision History

| Date       | Author | Change        |
| ---------- | ------ | ------------- |
| 2026-01-26 | muji   | Initial draft |
| 2026-08-29 | muji   | Corrected §Decision 4 + architecture diagram: `withSchedulingLock` is a sequential queue (no skip, no drops), not the skip-based lock the draft described. Documented that task registration runs on launch AND foreground-return (idempotent `isTaskRegisteredAsync` guard) — the foreground-return path previously omitted registration (ISSUES #9). Status: Proposed → Accepted. |
| 2026-09-02 | muji   | Unit correction + always-re-register (ISSUES #8 fix, 1.17.10): `minimumInterval` is MINUTES — the draft's `3 * 60 * 60` seconds scheduled the task +7.5 days out on iOS and Android. `registerBackgroundTask` now unregisters before registering so persisted options refresh every launch (the old `isTaskRegisteredAsync` early-return let a stale 10800 persist forever). Device-verified on iPhone XS/iOS 18.7.10: natural fires in foreground/backgrounded states, dasd windows match the interval exactly, dasd rate-limits sub-hour cadences (180-min value is safe). |
