# ADR-001: Rolling Window Notification Buffer

**Status:** Superseded (reduced to 3 days on 2026-01-17)
**Date:** 2026-01-15
**Decision Makers:** muji

---

## Context

The Athan app needs to deliver prayer time notifications reliably on iOS and Android. Several platform constraints shaped this decision:

1. **Platform notification limits**: iOS only allows 64 scheduled local notifications at any time; Android has similar practical limits
2. **Unreliable background refresh**: Background tasks on both iOS and Android are heavily throttled and unpredictable—even with battery optimization disabled, background execution cannot be guaranteed on either platform
3. **User behavior varies**: Some users close the app regularly, others leave it running indefinitely without ever closing it
4. **Debugging difficulty**: Background task execution is extremely difficult to debug and test reliably

The system needs to schedule notifications for multiple daily prayers (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) plus optional extras (Last Third, Suhoor, Duha, Istijaba), each potentially with custom alert offsets.

**Notification count variability**: The number of notifications per day depends on user settings. With basic settings (~10/day), a 6-day window fits under iOS limits. However, planned features like pre-prayer reminders could double this to ~20/day, requiring a shorter window.

## Decision

Implement a **3-day rolling window** for notification scheduling with the following behavior:

1. **Window size**: Schedule notifications for the next 3 days (`NOTIFICATION_ROLLING_DAYS = 3`)
2. **Refresh triggers**:
   - When the app is opened (for users who close the app)
   - When the app is brought to foreground (for users who never close the app)
3. **Refresh frequency**: Re-schedule every 24 hours (`NOTIFICATION_REFRESH_HOURS = 24`)
4. **Debounced scheduling**: When users change alert settings, debounce the re-scheduling to minimize redundant operations
5. **Concurrency guard**: Use `isScheduling` flag to prevent race conditions during scheduling

## Consequences

### Positive
- Reliable notification delivery without depending on background tasks
- Works for both user behavior patterns (app closers and always-on users)
- Self-healing: missed refreshes are caught on next app interaction
- Simple mental model: "notifications always work if you open the app occasionally"

### Negative
- Higher notification count scheduled (3 days × multiple prayers × potential custom offsets)
- Users who don't open the app for 3+ days will miss notifications

### Neutral
- Requires debouncing on settings changes to avoid excessive re-scheduling
- Trade-off between window size (reliability) and notification count (iOS limit headroom)

## Alternatives Considered

### Alternative 1: Real-time Scheduling
**Description:** Schedule each notification only when the previous one fires, using notification callbacks.

**Pros:**
- Minimal notifications scheduled at any time
- Maximum headroom under iOS limit

**Cons:**
- Requires reliable notification callback execution
- Single point of failure: if one notification fails to fire, chain breaks
- No notifications if app is backgrounded/killed before callback

**Why Rejected:** Too fragile. Neither iOS nor Android guarantees notification callbacks execute reliably when app is backgrounded or terminated.

### Alternative 2: Full Calendar Sync
**Description:** Schedule all notifications for a month or year at once.

**Pros:**
- Set-and-forget: schedule once, works for extended periods
- No ongoing refresh logic needed

**Cons:**
- Immediately hits iOS 64-notification limit
- Prayer times change throughout the year; stale data causes inaccurate notifications
- Large scheduling operation on startup

**Why Rejected:** Platform notification limits make this impossible for a multi-prayer app with custom alert offsets.

### Alternative 3: Background Refresh Service (2-day window)
**Description:** Use a smaller 2-day rolling window combined with platform background task APIs to refresh notifications.

**Pros:**
- Fewer notifications scheduled
- More headroom under iOS limit
- Theoretically elegant solution

**Cons:**
- Background tasks are heavily throttled by both iOS and Android
- Impossible to guarantee execution timing on either platform
- Extremely difficult to debug
- Battery optimization further reduces reliability on both platforms

**Why Rejected:** Tested extensively but background refresh never executed reliably on either platform. Even with battery optimization disabled, both iOS and Android throttling made this approach non-viable.

## Implementation Notes

- Constants defined in `shared/constants.ts`: `NOTIFICATION_ROLLING_DAYS`, `NOTIFICATION_REFRESH_HOURS`
- Core scheduling logic in `stores/notifications.ts`
- `isScheduling` flag prevents concurrent scheduling operations
- Debounce on alert preference changes prevents excessive re-scheduling
- `genNextXDays()` helper generates the date range for scheduling
- Smart skipping: past prayer times and non-Friday Istijaba are excluded

## Future Considerations

The ideal long-term solution is to reliably use the **native background scheduling services** built into iOS and Android. If this becomes viable:

- Reduce to a 2-day rolling window
- Remove the manual 24-hour refresh check
- Rely on platform-native scheduling for refresh triggers
- Significantly reduce the number of scheduled notifications

This would require either platform improvements to background task reliability, or discovering a more reliable way to use existing background APIs.

## Planned Feature: Reminder Notifications

A planned feature will allow users to receive **pre-prayer reminder notifications** before the actual prayer time. This feature directly impacts the rolling window size.

### Feature Description
- Users can set reminders for 5, 10, 15, 20, 25, or 30 minutes before each prayer
- Reminders are configured **per-prayer** (each prayer can have its own setting)
- Reminder notifications always include sound
- The reminder is a separate notification from the on-time prayer notification

### Notification Options (with reminders)
| Option | Notifications per prayer |
|--------|-------------------------|
| None | 1 |
| Silent | 1 |
| Sound | 1 |
| Sound + 5min reminder | 2 |
| Sound + 10min reminder | 2 |
| Sound + 15min reminder | 2 |
| Sound + 20min reminder | 2 |
| Sound + 25min reminder | 2 |
| Sound + 30min reminder | 2 |

### Impact on Rolling Window

**Notification math:**
- Without reminders: ~10 notifications/day
- With all reminders enabled: ~20 notifications/day
- iOS limit: 64 notifications

**Window size calculation:**
| Scenario | Per day | 6-day total | 3-day total |
|----------|---------|-------------|-------------|
| No reminders | ~10 | 60 ✓ | 30 ✓ |
| All reminders | ~20 | 120 ✗ | 60 ✓ |

### Required Change

**Status:** ✅ IMPLEMENTED (2026-01-17)

The rolling window has been reduced to improve app responsiveness:

| State | Window | Reason |
|-------|--------|--------|
| **Previous** | 6 days | ~10 notifications/day × 6 = 60 (under limit) |
| **Current** | 3 days | ~10 notifications/day × 3 = 30 (better headroom, improved responsiveness) |
| **With reminders** | 3 days | ~20 notifications/day × 3 = 60 (under limit) |

**Decision:** Reduced `NOTIFICATION_ROLLING_DAYS` from 6 to 3 to improve app responsiveness and provide headroom for future reminder feature.

**Why fixed 3 days, not dynamic?** A dynamic window (calculated based on actual user settings) was considered but rejected in favor of simplicity. A fixed 3-day window is predictable and easier to reason about.

## Related Decisions

- ADR-002: English Midnight Day Boundary (notifications respect day boundaries)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-15 | muji | Initial draft |
| 2026-01-15 | muji | Added Planned Feature: Reminder Notifications section (current: 6 days, future: 3 days) |
| 2026-01-17 | muji | IMPLEMENTED: Reduced NOTIFICATION_ROLLING_DAYS from 6 to 3 to improve app responsiveness |
