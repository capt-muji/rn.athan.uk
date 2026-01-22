# Prayer Ago Feature Implementation Plan

## Overview

Add "Asr 4m ago" visual inside Countdown.tsx showing how long ago the previous prayer was. This provides users with context about when the last prayer time occurred, enhancing the prayer time display experience.

## Goals

- [x] Add "X 4m ago" text to countdown
- [x] 60-second throttled updates
- [x] Correct previous prayer calculation
- [x] Handle edge cases (Fajr using yesterday's last prayer)
- [x] Consistent with existing codebase patterns

## Files to Create

- `hooks/usePrayerAgo.ts` - NEW hook for prayer ago calculation

## Files to Modify

- `shared/time.ts` - Add formatTimeAgo() utility
- `components/Countdown.tsx` - Add PrayerAgo inline component

## Task Breakdown

### Task 1: Add formatTimeAgo to shared/time.ts

**Objective**: Create utility function for formatting "ago" text

**Acceptance Criteria**:

- Function returns "now" for <60 seconds
- Function returns "1m" for 1-59 minutes
- Function returns "10h 15m" for 1+ hours
- No seconds displayed in output

**Files**:

- `shared/time.ts`

**Complexity**: Small

**Dependencies**: None

**Implementation Notes**:

- Follow existing time utility patterns in `shared/time.ts`
- Add JSDoc following existing documentation style
- Use similar logic to `formatTime()` but simpler (no seconds, days → hours)

**Example Usage**:

```typescript
formatTimeAgo(45); // "now"
formatTimeAgo(120); // "2m"
formatTimeAgo(3665); // "1h 1m"
```

---

### Task 2: Create usePrayerAgo hook

**Objective**: Hook that returns prayer ago text with 60-second updates

**Acceptance Criteria**:

- Hook returns `{ prayerAgo: string, prayerName: string, isReady: boolean }`
- Updates every 60 seconds (throttled)
- Calculates previous prayer correctly
- Returns "X ago" format (e.g., "4m ago", "1h 15m ago")
- Returns "Fajr now" when <60 seconds

**Files**:

- `hooks/usePrayerAgo.ts` (NEW)

**Complexity**: Medium

**Dependencies**: Task 1 (formatTimeAgo)

**Implementation Notes**:

- Follow `hooks/useCountdown.ts` pattern for React hooks
- Use Jotai atoms: `getPrevPrayer(type)` to get previous prayer
- Calculate time elapsed: `getSecondsBetween(prevPrayer.datetime, now)`
- Use `setInterval` with 60000ms (60 seconds)
- Combine prayer name + formatted time: "Fajr 4m ago"
- Add JSDoc following existing hook documentation style

**Key Logic**:

```typescript
// Previous prayer already available via stores/schedule.ts
const prevPrayer = getPrevPrayer(type);

// Calculate seconds elapsed
const secondsElapsed = getSecondsBetween(prevPrayer.datetime, now);

// Format as "ago" text
const timeAgo = formatTimeAgo(secondsElapsed);

// Combine: "Fajr 4m ago" or "Fajr now" if <60s
const prayerAgo = secondsElapsed < 60 ? `${prevPrayer.english} now` : `${prevPrayer.english} ${timeAgo} ago`;
```

**Edge Cases**:

- Fajr at 1am: Previous prayer is yesterday's Isha (already handled by `getPrevPrayer`)
- Hook returns `isReady: false` if sequence not initialized

---

### Task 3: Add PrayerAgo to Countdown.tsx

**Objective**: Display prayer ago text in component

**Acceptance Criteria**:

- Prayer ago text appears below countdown timer
- Text is centered and styled consistently
- Only shows when countdown is ready and not in overlay mode
- No visual glitches or layout shifts

**Files**:

- `components/Countdown.tsx`

**Complexity**: Small

**Dependencies**: Task 2 (usePrayerAgo)

**Implementation Notes**:

- Use `usePrayerAgo` hook at component level
- Add inline component below countdown text
- Follow existing styling patterns in Countdown.tsx
- Hide in overlay mode (consistency with countdown behavior)
- Use `TEXT.sizeSmall` for consistency with prayer name display

**Placement**:

```tsx
<View>
  <Text style={[styles.text]}>{displayName}</Text>
  <Animated.Text style={[styles.countdown, animatedStyle]}>{formatTime(displayTime, !showSeconds)}</Animated.Text>
  {/* NEW: Prayer ago text */}
  {isReady && !overlay.isOn && prayerAgo && <Text style={[styles.prayerAgo]}>{prayerAgo}</Text>}
  <CountdownBar type={type} />
</View>
```

**Styling**:

- Similar to `styles.text` but different color (COLORS.textSecondary or darker)
- Slightly smaller margin to fit between countdown and progress bar

---

### Task 4: Manual testing

**Objective**: Verify all formats work correctly

**Acceptance Criteria**:

- "Fajr now" displays correctly (<60 seconds)
- "Fajr 1m ago" displays correctly (1-59 minutes)
- "Fajr 10h 15m ago" displays correctly (1+ hours)
- Updates every 60 seconds
- No visual glitches on Standard and Extra schedules
- Works correctly at 1am (Fajr previous prayer is yesterday's Isha)

**Files**: None

**Complexity**: Small

**Dependencies**: Task 3

**Test Scenarios**:

1. Check display immediately after a prayer time (should show "now")
2. Wait 2+ minutes after prayer (should show "2m ago")
3. Check after 10+ hours (should show "10h XXm ago")
4. Switch between Standard and Extra tabs
5. Check at 1am (previous prayer is yesterday's Isha)
6. Verify updates occur every 60 seconds
7. Open overlay mode (prayer ago should hide)

---

## Implementation Details

### formatTimeAgo Function

```typescript
/**
 * Formats seconds elapsed into "ago" text
 * @param seconds - Seconds since prayer occurred
 * @returns "now" (<60s), "1m" (1-59m), "10h 15m" (1h+)
 */
export const formatTimeAgo = (seconds: number): string => {
  // Implementation:
  // 1. If <60s: return "now"
  // 2. Calculate hours/minutes using Math.floor
  // 3. Days → hours (e.g., 48h not 2d)
  // 4. Return "Xm" or "Xh Ym" format
};
```

### usePrayerAgo Hook

```typescript
/**
 * Returns formatted prayer-ago text with 60-second updates
 * @param type - Schedule type (Standard/Extra)
 * @returns { prayerAgo: string, prayerName: string, isReady: boolean }
 */
export const usePrayerAgo = (type: ScheduleType) => {
  // Implementation:
  // 1. Get previous prayer from schedule store
  // 2. Calculate seconds elapsed
  // 3. Format as "ago" text
  // 4. Update every 60 seconds
  // 5. Return prayerAgo, prayerName, isReady
};
```

### PrayerAgo Component Integration

```typescript
// In Countdown.tsx
const { prayerAgo, prayerName, isReady: prayerAgoReady } = usePrayerAgo(type);

// Display below countdown timer
{prayerAgoReady && !overlay.isOn && prayerAgo && (
  <Text style={[styles.prayerAgo]}>{prayerAgo}</Text>
)}
```

## Risks

None identified. Previous prayer calculation is already implemented in `stores/schedule.ts:createPrevPrayerAtom`, which handles edge cases including fetching yesterday's final prayer.

## Testing

Manual testing only. No automated tests required.

### Test Coverage

| Scenario                             | Expected Output    |
| ------------------------------------ | ------------------ |
| <60 seconds after prayer             | "Fajr now"         |
| 1-59 minutes after prayer            | "Fajr 4m ago"      |
| 1+ hours after prayer                | "Fajr 10h 15m ago" |
| Update frequency                     | Every 60 seconds   |
| Standard schedule                    | Works correctly    |
| Extra schedule                       | Works correctly    |
| 1am (previous prayer is yesterday's) | Shows "Isha X ago" |
| Overlay mode                         | Hidden             |

## Success Criteria

- [ ] Prayer ago text displays correctly in Countdown component
- [ ] Format matches specification ("now", "Xm ago", "Xh Xm ago")
- [ ] Updates every 60 seconds (not every second)
- [ ] No visual glitches or layout shifts
- [ ] JSDoc complete on all exported functions
- [ ] Works correctly on Standard and Extra schedules
- [ ] Handles Fajr edge case (yesterday's last prayer)
- [ ] Code follows existing patterns in codebase
