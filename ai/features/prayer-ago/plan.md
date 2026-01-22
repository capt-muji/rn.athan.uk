# Implementation Plan: prayer-ago

**Feature:** Display "X ago" for passed prayers
**Status:** Ready for Implementation
**Created:** 2026-01-22
**Complexity:** Small

---

## Overview

Display a relative time indicator showing how long ago a prayer passed (e.g., "Asr 4m ago"). This provides quick context for users viewing prayer times after a prayer has completed. The implementation follows the same pattern as the countdown bar's time-since-calculation using `prevPrayer`.

## Architecture

```
PrayerTime.tsx
├── usePrayer hook (provides isPassed, datetime)
├── New: usePrayerAgo hook (calculates elapsed time for passed prayers)
└── Render: time + " ago" suffix when isPassed
```

## Tasks

### Task 1: Add `formatTimeAgo` utility function

**Files to modify:** `shared/time.ts`

**Description:** Create a utility function that formats elapsed time as "X ago" string. Uses similar logic to `formatTime` but for past durations.

**Acceptance Criteria:**

- [ ] Function accepts elapsed seconds (positive number)
- [ ] Returns "Just now" for elapsed < 1 minute
- [ ] Returns "Xm ago" for elapsed minutes < 60 (e.g., "4m ago")
- [ ] Returns "Xh Ym ago" for elapsed hours (e.g., "1h 30m ago")
- [ ] All strings properly formatted with unit suffix
- [ ] Function exported and added to module exports

**Complexity:** Small
**Estimated Time:** 30 minutes

---

### Task 2: Create `usePrayerAgo` hook

**Files to create:** `hooks/usePrayerAgo.ts`

**Description:** Create a hook that calculates and returns the elapsed time since a prayer passed. Updates in real-time (every second) like the countdown.

**Acceptance Criteria:**

- [ ] Hook accepts prayer datetime and isPassed flag
- [ ] Returns formatted "X ago" string
- [ ] Updates every 60 seconds via setInterval (text only changes at minute boundaries)
- [ ] Returns null for upcoming prayers (no "ago" display)
- [ ] Returns "Just now" for prayers passed < 1 minute
- [ ] Memoized to prevent unnecessary re-renders

**Dependencies:** Task 1 (formatTimeAgo)
**Complexity:** Small
**Estimated Time:** 45 minutes

---

### Task 3: Modify PrayerTime to show "ago" for passed prayers

**Files to modify:** `components/PrayerTime.tsx`

**Description:** Update PrayerTime component to display "ago" text for passed prayers using the new hook.

**Acceptance Criteria:**

- [ ] Import and use `usePrayerAgo` hook
- [ ] Only show "ago" text when prayer is passed
- [ ] "Ago" text updates every 60 seconds
- [ ] Visual styling matches existing time text (same font, size, color)
- [ ] No visual clutter or layout shifts
- [ ] Works for both Standard and Extra schedules
- [ ] Add `accessibilityLabel` for screen readers (e.g., "Asr prayer, 4 minutes ago")
- [ ] Add `aria-live="polite"` to prevent screen reader spam

**Dependencies:** Task 2
**Complexity:** Small
**Estimated Time:** 45 minutes

---

### Task 4: Verify visual integration

**Files to verify:** `components/Prayer.tsx`, `components/PrayerTime.tsx`

**Description:** Verify the "ago" display integrates visually with the prayer row. No design changes needed per feature spec, but confirm:

- Spacing is correct
- Colors match (passed prayers already have different color)
- No overlapping or alignment issues

**Acceptance Criteria:**

- [ ] "Ago" text appears inline after time
- [ ] Prayer row height remains consistent
- [ ] Text alignment is centered and readable
- [ ] User verification: visual appearance meets expectations

**Dependencies:** Task 3
**Complexity:** Small
**Estimated Time:** 30 minutes

---

## Dependency Graph

```
Task 1 (formatTimeAgo)
    ↓
Task 2 (usePrayerAgo)
    ↓
Task 3 (PrayerTime update)
    ↓
Task 4 (Visual verification)
```

## Files Summary

| File                        | Change                               |
| --------------------------- | ------------------------------------ |
| `shared/time.ts`            | Add `formatTimeAgo` function         |
| `hooks/usePrayerAgo.ts`     | **Create new hook**                  |
| `components/PrayerTime.tsx` | Add "ago" display for passed prayers |

## Technical Notes

### Existing Code Reference

The `useCountdownBar` hook in `hooks/useCountdownBar.ts:40-65` shows the pattern for calculating elapsed time:

```typescript
// This pattern is already implemented for progress bar
const now = TimeUtils.createLondonDate();
const elapsedMs = now.getTime() - prevPrayer.datetime.getTime();
const progress = (elapsedMs / totalMs) * 100;
```

The `usePrayer` hook in `hooks/usePrayer.ts:41` already provides `isPassed` status:

```typescript
const { isPassed, isNext } = prayer;
```

### Time Calculation Logic

For a passed prayer at `prayer.datetime`:

```typescript
const now = TimeUtils.createLondonDate();
const elapsedSeconds = Math.floor((now.getTime() - prayer.datetime.getTime()) / 1000);
```

### Formatting Rules

| Elapsed Time | Display     |
| ------------ | ----------- |
| < 1 minute   | "Just now"  |
| 1-59 minutes | "Xm ago"    |
| 1+ hours     | "Xh Ym ago" |

## Edge Cases Handled

| Scenario                      | Behavior                                           |
| ----------------------------- | -------------------------------------------------- |
| Prayer just passed (< 1 min)  | Shows "Just now"                                   |
| Prayer passed 1+ hours ago    | Shows "Xh Ym ago" (e.g., "1h 30m ago")             |
| Midnight boundary crossing    | Works correctly (datetime comparison handles this) |
| Day change (after Isha)       | Works correctly (datetime comparison handles this) |
| Clock moves while app running | Next 60s update recalculates correctly             |
| Upcoming prayers              | No "ago" text shown                                |

## Testing (Manual)

Per feature spec, testing is manual only:

1. [ ] Open app, wait for a prayer to pass
2. [ ] Verify "X ago" appears next to passed prayer time
3. [ ] Verify "X ago" updates as time passes (wait 1 minute)
4. [ ] Verify formatting changes (e.g., "5m ago" → "1h ago")
5. [ ] Verify upcoming prayers show no "ago" text
6. [ ] Verify both Standard and Extra schedules work
7. [ ] Verify visual integration with prayer row

## Rollout

1. **Development:** Tasks 1-4 in sequence
2. **Review:** Code review + user manual verification
3. **Release:** Deploy with standard release process
