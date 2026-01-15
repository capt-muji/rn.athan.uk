# ADR-001: Rolling Window Notification Buffer

**Status:** Accepted
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

## Decision

Implement a **6-day rolling window** for notification scheduling with the following behavior:

1. **Window size**: Schedule notifications for the next 6 days (`NOTIFICATION_ROLLING_DAYS = 6`)
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
- Higher notification count scheduled (6 days × multiple prayers × potential custom offsets)
- Approaches the iOS 64-notification limit with many prayers enabled
- Users who don't open the app for 6+ days will miss notifications

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

## Related Decisions

- None yet

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-15 | muji | Initial draft |
