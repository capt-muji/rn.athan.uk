# Bug Fix Plan: Prayer Timing System Post-Refactor Issues

**Created:** 2026-01-19
**Status:** APPROVED (ReviewerQA 100/100)
**Branch:** `refactor_time_from_cleanup_prayer`
**Related:** ai/adr/005-timing-system-overhaul.md

---

## Context

After refactoring from date-centric to prayer-centric model (ADR-005), manual testing at 03:16am on Jan 19th revealed 5 bugs. ReviewerQA scored initial plan 75/100 - final iteration achieved 100/100.

---

## Implementation Order (Critical)

1. **Bug 5 (Store Mutation)** - First, affects reliability of other fixes
2. **Bug 3 (Timezone)** - Second, fundamental data layer issue
3. **Bug 1 (Midnight)** - Third, requires correct timezone handling
4. **Bug 2 (Overlay)** - Fourth, depends on Bug 1 filtering logic
5. **Bug 4 (Cycles)** - Last, warning not runtime bug

---

## Bug 5: Store Mutation During Atom Read

**Warning:** "Detected store mutation during atom read"

**Root Cause Location:** `stores/schedule.ts` lines 195-217

```typescript
export const getNextPrayer = (type: ScheduleType): Prayer | null => {
  const nextPrayer = store.get(nextPrayerAtom);
  if (!nextPrayer) {
    if (sequence) {
      refreshSequence(type);  // ← MUTATION during read!
      return store.get(nextPrayerAtom);
    }
  }
  return nextPrayer;
};
```

**Why It's Called During Atom Read:**
- `stores/overlay.ts:39` calls `getNextPrayer()` in `canShowOverlay()`
- Derived atoms may trigger this during render

**Fix:** Make `getNextPrayer()` pure read-only.

**File:** `stores/schedule.ts`

```typescript
/**
 * Gets the next upcoming prayer from the sequence
 * Pure read operation - does NOT trigger refresh
 * Callers must handle null case and refresh if needed
 */
export const getNextPrayer = (type: ScheduleType): Prayer | null => {
  const nextPrayerAtom = type === ScheduleType.Standard ? standardNextPrayerAtom : extraNextPrayerAtom;
  return store.get(nextPrayerAtom);
};
```

**Callers Already Handle Null:**
- `stores/countdown.ts:57-67` already has fallback: `if (!nextPrayer) { refreshSequence(type); ... }`
- No changes needed to callers

**Verification:**
- Run app, check console - no "store mutation during atom read" warning

---

## Bug 3: Progress Bar Shows 0%

**Symptom:** Progress bar empty despite countdown counting down correctly.

**Root Cause Location:** `shared/time.ts` lines 275-278

```typescript
export const createPrayerDatetime = (date: string, time: string): Date => {
  return new Date(`${date}T${time}:00`);  // System-local timezone!
};
```

But `createLondonDate()` at line 23-27 uses London timezone:
```typescript
const londonTime = formatInTimeZone(targetDate, 'Europe/London', 'yyyy-MM-dd HH:mm:ssXXX');
return new Date(londonTime);
```

**Why Progress is 0:**
1. `useCountdownBar.ts:44-45` gets `prevPrayer` from atom
2. `createPrevPrayerAtom` at `stores/schedule.ts:57-70` finds previous prayer via `datetime > now`
3. If `prayer.datetime` (system-local) differs from `now` (London), comparison fails
4. `nextIndex <= 0`, so `prevPrayer` is null
5. `useCountdownBar.ts:48` returns `{ progress: 0, isReady: false }`

**Fix:** Create prayer datetimes in London timezone.

**File:** `shared/time.ts` lines 275-278

```typescript
/**
 * Creates a full Date object from date and time strings
 * Used to combine API data (separate date/time) into Prayer.datetime
 *
 * IMPORTANT: Prayer times from API are in London timezone.
 * This function creates dates in London timezone to match createLondonDate().
 */
export const createPrayerDatetime = (date: string, time: string): Date => {
  // Create ISO string in London timezone format
  // The API returns times for London, so we must interpret them as London times
  const isoString = `${date}T${time}:00`;

  // Parse as London time and convert to a Date that represents that moment
  // formatInTimeZone outputs the London time with timezone info
  const londonFormatted = formatInTimeZone(
    new Date(isoString),
    'Europe/London',
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );

  return new Date(londonFormatted);
};
```

**Users Outside London:** The app is for London prayer times. All comparisons use `createLondonDate()` for "now", so using London timezone for prayer times ensures correct comparisons regardless of user's device timezone.

**DST Handling:** `formatInTimeZone` with 'Europe/London' automatically handles GMT/BST transitions. No additional logic needed.

**Verification:**
- Set device to non-London timezone (e.g., PST)
- Open app at 03:16am London time
- Progress bar should show ~60-70% (between Isha and Fajr)

---

## Bug 1: Midnight Not Showing on Extras Schedule

**Symptom:** Only Last Third, Suhoor, Duha show. Midnight missing.

**Root Cause Location:** The interaction between two systems:

1. `stores/schedule.ts:140` - `refreshSequence()` removes passed prayers:
   ```typescript
   const futurePrayers = sequence.prayers.filter((p) => p.datetime > now);
   ```

2. `hooks/useSchedule.ts:28` - Display filters by `belongsToDate`:
   ```typescript
   const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);
   ```

**Timeline at 03:16am Jan 19:**
1. Midnight at 23:17 on Jan 18 has `belongsToDate = "2026-01-19"` (correct per ADR-004)
2. When countdown hits 0, `refreshSequence()` removes Midnight (datetime < now)
3. Display filters to `belongsToDate === "2026-01-19"`
4. Midnight is gone - it was deleted before it could be displayed

**Fix Strategy:** Keep passed prayers that belong to current display date.

**Memory Bloat Prevention:** Only keep passed prayers for current display date, not all passed prayers. When display date changes, old passed prayers are naturally excluded.

**When Cleanup Runs:** `refreshSequence()` is called in two places:
1. `stores/countdown.ts:89` - When countdown hits 0 (prayer passes)
2. `stores/countdown.ts:62` - When `getNextPrayer()` returns null in countdown startup

This ensures passed prayers are cleaned up immediately when a prayer passes, not on every tick.

**File:** `stores/schedule.ts` - Modify `refreshSequence()` (lines 128-179)

```typescript
export const refreshSequence = (type: ScheduleType): void => {
  const sequenceAtom = getSequenceAtom(type);
  const sequence = store.get(sequenceAtom);

  if (!sequence) {
    logger.warn('SEQUENCE: Cannot refresh - sequence not initialized', { type });
    return;
  }

  const now = TimeUtils.createLondonDate();

  // Find the next future prayer to determine the current display date
  const nextFuturePrayer = sequence.prayers.find((p) => p.datetime > now);
  const currentDisplayDate = nextFuturePrayer?.belongsToDate ?? null;

  // Filter prayers: keep future prayers OR passed prayers for current display date
  // This ensures Midnight (23:17 Jan 18, belongsTo Jan 19) is kept when displaying Jan 19
  // Memory-safe: passed prayers for OTHER dates are removed
  const relevantPrayers = sequence.prayers.filter((p) => {
    // Always keep future prayers
    if (p.datetime > now) return true;
    // Keep passed prayers that belong to current display date (for display purposes)
    if (currentDisplayDate && p.belongsToDate === currentDisplayDate) return true;
    return false;
  });

  // Check if we need more prayers (less than 24 hours of buffer)
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const lastPrayer = relevantPrayers[relevantPrayers.length - 1];
  const needsMorePrayers = !lastPrayer || lastPrayer.datetime.getTime() - now.getTime() < TWENTY_FOUR_HOURS_MS;

  if (needsMorePrayers) {
    // ... existing fetch more days logic (unchanged)
  } else {
    store.set(sequenceAtom, { type, prayers: relevantPrayers });
  }

  // ... existing logging
};
```

**Edge Case - Empty Filtered Sequence:** If all prayers for `displayDate` are passed and tomorrow's prayers haven't loaded yet:
- `todayPrayers.filter(p => p.belongsToDate === displayDate)` could return empty
- `usePrayer.ts:26-43` already handles this with fallback return values
- `hooks/usePrayerSequence.ts:78-83` returns `isReady: sequence !== null`
- Components check `isReady` before rendering (e.g., `useCountdownBar.ts:48-50`)

This is already handled by existing loading state logic - no additional changes needed.

**Verification:**
- Open Extras at 03:16am Jan 19 (after Midnight but before Last Third)
- Midnight should appear (grayed/passed)
- Last Third should be highlighted as next
- Suhoor and Duha should appear as future

---

## Bug 2: Overlay Shows Wrong Prayer Data

**Symptom:** Tapping Last Third shows Midnight's time; countdown shows 0s.

**Root Cause Location:** `stores/countdown.ts` lines 121-123

```typescript
const todayPrayers = sequence?.prayers.filter((p) => p.belongsToDate === displayDate) ?? [];
const selectedPrayer = todayPrayers[overlay.selectedPrayerIndex];
```

This doesn't match `hooks/usePrayer.ts:45-55` which has tomorrow prayer fallback:

```typescript
const tomorrowPrayers = prayers.filter((p) => p.belongsToDate !== displayDate);
const tomorrowPrayer = tomorrowPrayers[index];
const displayPrayer = isPassed && isOverlay && tomorrowPrayer ? tomorrowPrayer : prayer;
```

**Fix:** Match `usePrayer.ts` logic exactly in `startCountdownOverlay()`.

**File:** `stores/countdown.ts` - Modify `startCountdownOverlay()` (lines 110-139)

```typescript
const startCountdownOverlay = () => {
  const overlay = store.get(overlayAtom);
  const isStandard = overlay.scheduleType === ScheduleType.Standard;

  // Get sequence and displayDate for selected schedule type
  const sequenceAtom = getSequenceAtom(overlay.scheduleType);
  const displayDateAtom = isStandard ? standardDisplayDateAtom : extraDisplayDateAtom;

  const sequence = store.get(sequenceAtom);
  const displayDate = store.get(displayDateAtom);

  if (!sequence || !displayDate) {
    clearCountdown('overlay');
    store.set(overlayCountdownAtom, { timeLeft: 0, name: 'Prayer' });
    return;
  }

  const now = TimeUtils.createLondonDate();

  // Get today's prayers and selected prayer by index
  // This matches hooks/usePrayer.ts:22-23
  const todayPrayers = sequence.prayers.filter((p) => p.belongsToDate === displayDate);
  let selectedPrayer = todayPrayers[overlay.selectedPrayerIndex];

  // Check if selected prayer has passed
  const isPassed = selectedPrayer ? selectedPrayer.datetime < now : false;

  // Tomorrow prayer fallback for passed prayers (matches usePrayer.ts:46-55)
  // When a prayer is passed in overlay, show tomorrow's same prayer
  if (isPassed && selectedPrayer) {
    const tomorrowPrayers = sequence.prayers.filter((p) => p.belongsToDate !== displayDate);
    const tomorrowPrayer = tomorrowPrayers[overlay.selectedPrayerIndex];
    if (tomorrowPrayer) {
      selectedPrayer = tomorrowPrayer;
    }
  }

  // Calculate countdown from prayer datetime
  const timeLeft = selectedPrayer ? TimeUtils.getSecondsBetween(now, selectedPrayer.datetime) : 0;
  const name = selectedPrayer?.english ?? 'Prayer';

  clearCountdown('overlay');
  store.set(overlayCountdownAtom, { timeLeft, name });

  countdowns.overlay = setInterval(() => {
    const currentTime = store.get(overlayCountdownAtom).timeLeft - 1;
    if (currentTime <= 0) return clearCountdown('overlay');

    store.set(overlayCountdownAtom, { timeLeft: currentTime, name });
  }, 1000);
};
```

**Verification:**
- Open Extras at 03:16am Jan 19
- Tap on Last Third row
- Overlay shows "Last Third" name (not "Midnight")
- Countdown shows time until Last Third (not 0s)
- Date shows correctly

---

## Bug 4: Require Cycles

**Warnings:**
1. `stores/notifications.ts` → `device/notifications.ts` → `stores/notifications.ts`
2. `stores/notifications.ts` → `device/notifications.ts` → `shared/notifications.ts` → `stores/notifications.ts`
3. `stores/overlay.ts` → `stores/countdown.ts` → `stores/overlay.ts`

**Scope Clarification:**
- Cycles 1 & 2 (notifications) don't affect the Schedule model - notifications use `Database.getPrayerByDate()` directly and are decoupled from the timing refactor (per Task 7.6 review)
- Cycle 3 (overlay/countdown) is the primary concern for this refactor
- All 3 should be fixed to eliminate warnings and prevent future issues

### Fix Cycle 1 & 2: Notification Imports

**Problem:**
- `stores/notifications.ts:5`: `import * as Device from '@/device/notifications'`
- `device/notifications.ts:8`: `import * as NotificationStore from '@/stores/notifications'`
- `shared/notifications.ts:8`: `import { refreshNotifications } from '@/stores/notifications'`

**Fix A:** `device/notifications.ts` - Use dependency injection for `getSoundPreference`

**File:** `device/notifications.ts`

```typescript
// REMOVE: import * as NotificationStore from '@/stores/notifications';

export const addOneScheduledNotificationForPrayer = async (
  englishName: string,
  arabicName: string,
  date: string,
  time: string,
  alertType: AlertType,
  soundPreference: number  // Add parameter instead of import
): Promise<NotificationUtils.ScheduledNotification> => {
  const triggerDate = NotificationUtils.genTriggerDate(date, time);
  const content = NotificationUtils.genNotificationContent(englishName, arabicName, alertType, soundPreference);
  // ... rest unchanged
};
```

**File:** `stores/notifications.ts` - Update caller

```typescript
// In _addMultipleScheduleNotificationsForPrayer:
const sound = getSoundPreference();
const promise = Device.addOneScheduledNotificationForPrayer(
  englishName, arabicName, dateI, prayerTime, alertType, sound  // Pass sound
)
```

**Fix B:** `shared/notifications.ts` - Remove circular import

**File:** `shared/notifications.ts`

```typescript
// REMOVE: import { refreshNotifications } from '@/stores/notifications';

export const initializeNotifications = async (
  checkPermissions: () => Promise<boolean>,
  refreshFn: () => Promise<void>  // Inject instead of import
) => {
  try {
    await createDefaultAndroidChannel();
    const hasPermission = await checkPermissions();
    if (hasPermission) await refreshFn();
    else logger.info('NOTIFICATION: Notifications disabled, skipping refresh');
  } catch (error) {
    logger.error('NOTIFICATION: Failed to initialize notifications:', error);
  }
};
```

Caller (app initialization) passes `refreshNotifications` when calling.

### Fix Cycle 3: Overlay/Countdown Imports

**Problem:**
- `stores/overlay.ts:13`: `import { startCountdownOverlay, ... } from '@/stores/countdown'`
- `stores/countdown.ts:13`: `import { overlayAtom } from '@/stores/overlay'`

**Fix:** Extract `overlayAtom` to separate file.

**New File:** `stores/atoms/overlay.ts`

```typescript
import { atom } from 'jotai';
import { OverlayStore, ScheduleType } from '@/shared/types';

export const overlayAtom = atom<OverlayStore>({
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: ScheduleType.Standard,
});
```

**File:** `stores/overlay.ts` - Update import

```typescript
// CHANGE: import from new location
import { overlayAtom } from '@/stores/atoms/overlay';

// Re-export for backward compatibility
export { overlayAtom };
// ... rest unchanged
```

**File:** `stores/countdown.ts` - Update import

```typescript
// CHANGE: import from new location
import { overlayAtom } from '@/stores/atoms/overlay';
```

**Verification:**
- Run `yarn start`
- No "require cycle" warnings in console

---

## Files Modified Summary

| File | Bug | Changes |
|------|-----|---------|
| `stores/schedule.ts` | 5, 1 | Pure `getNextPrayer()`, smarter `refreshSequence()` |
| `shared/time.ts` | 3 | London timezone in `createPrayerDatetime()` |
| `stores/countdown.ts` | 2, 4 | Tomorrow fallback in overlay, new atom import |
| `device/notifications.ts` | 4 | Dependency injection for sound preference |
| `shared/notifications.ts` | 4 | Dependency injection for refresh function |
| `stores/atoms/overlay.ts` | 4 | NEW: Extracted overlayAtom |
| `stores/overlay.ts` | 4 | Import from new atom location |

---

## Verification Checklist

### After Bug 5 Fix
- [ ] Run app, console shows no "store mutation" warning

### After Bug 3 Fix
- [ ] Set device to PST timezone
- [ ] Progress bar shows ~60-70% at 03:16am London

### After Bug 1 Fix
- [ ] Open Extras at 03:16am
- [ ] Midnight appears (passed/grayed)
- [ ] Last Third highlighted as next

### After Bug 2 Fix
- [ ] Tap Last Third row
- [ ] Overlay shows "Last Third" name
- [ ] Countdown shows correct time (not 0s)

### After Bug 4 Fix
- [ ] No "require cycle" warnings on start

### Edge Cases
- [ ] Test at Isha time (evening)
- [ ] Test at Fajr time (morning)
- [ ] Test year boundary (Jan 1)
- [ ] DST transitions are handled by `formatInTimeZone` automatically

---

## Lessons Learned

1. **Timezone consistency is critical** - All datetime creation must use the same timezone as comparison functions
2. **Prayer display vs prayer time** - `belongsToDate` (Islamic day) can differ from `datetime` (actual time)
3. **Keep passed prayers for current display** - Don't remove prayers that belong to the current Islamic day even if they've passed
4. **Avoid store mutations in atom reads** - Jotai warns about this and it can cause unpredictable behavior
5. **Match hook logic in store functions** - If a hook has fallback logic, store functions using same data should match it
