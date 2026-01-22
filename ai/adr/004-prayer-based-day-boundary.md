# ADR-004: Prayer-Based Day Boundary

**Status:** Accepted
**Date:** 2026-01-18
**Decision Makers:** muji
**Supersedes:** ADR-002 (English Midnight Day Boundary)

---

## Context

The Athan app displays prayer schedules for a given date with two independent schedules:
- **Standard Schedule**: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha (6 prayers)
- **Extras Schedule**: Midnight, Last Third, Suhoor, Duha, Istijaba (5 prayers, Istijaba only on Fridays)

### The Problem with ADR-002

ADR-002 used English midnight (00:00) as the day boundary. This created several issues:

1. **Countdown visibility**: Countdown hidden after last prayer until 00:00 (dead period)
2. **Edge cases deferred**: Isha after midnight, Last Third before midnight
3. **New complexity**: The Midnight prayer (Maghrib-Fajr midpoint) can occur before or after 00:00

### The Midnight Prayer Confusion

The term "midnight" now has two distinct meanings:
- **Midnight (prayer)**: The midpoint between Maghrib and Fajr (~23:00-00:30 depending on season)
- **System midnight**: 00:00 on the system clock (English midnight)

This ADR resolves the ambiguity and establishes clear rules for all timing scenarios.

## Terminology

| Term | Definition |
|------|------------|
| Midnight (prayer) | Midpoint between yesterday's Maghrib and today's Fajr. Can occur before or after 00:00. |
| System midnight | 00:00 on the system clock (English midnight). The app does NOT use this as a trigger. |
| Day boundary (Standard) | After Isha passes. Schedule advances to tomorrow, date updates. |
| Day boundary (Extras) | After Duha passes (non-Friday) or after Istijaba passes (Friday). |
| Yesterday | The previous day's schedule data. Used for ProgressBar and Extra prayers that span nights. |
| Schedule advancement | When the last prayer passes, schedule.today becomes schedule.yesterday, schedule.tomorrow becomes schedule.today, and new tomorrow data is fetched. |

## Decision

Use **prayer-based day boundaries** where each schedule advances independently after its last prayer passes.

### Core Principles

1. **NO 00:00 reset**: The app never uses system midnight as a trigger or boundary
2. **Prayer times are immutable**: A prayer fetched for "2026-01-17" belongs to that date even if the time is 01:00
3. **Each schedule is independent**: Standard and Extras can show different dates simultaneously
4. **Countdown always visible**: Always counting down to the next prayer (no "finished" state)
5. **Trust the data layer**: UI never has fallbacks; data layer always provides complete data

### 24-Hour Cycle Diagrams

```
STANDARD SCHEDULE:
┌──────────────────────────────────────────────────────────────────┐
│  Fajr → Sunrise → Dhuhr → Asr → Maghrib → Isha [ADVANCE]        │
│   ↑                                              ↓               │
│   │                                    Schedule shifts to        │
│   │                                    tomorrow, nextIndex=0     │
│   └──────────────────────────────────────────────────────────────┘
```

```
EXTRAS SCHEDULE (Non-Friday):
┌──────────────────────────────────────────────────────────────────┐
│  Midnight → Last Third → Suhoor → Duha [ADVANCE]                │
│   ↑                                  ↓                          │
│   │                        Schedule shifts to tomorrow,         │
│   │                        nextIndex=0 (Midnight)               │
│   └──────────────────────────────────────────────────────────────┘

Note: After Duha passes (~9am), schedule advances but Midnight (~23:00)
is still hours away. The yesterday fallback handles this.
```

```
EXTRAS SCHEDULE (Friday):
┌──────────────────────────────────────────────────────────────────┐
│  Midnight → Last Third → Suhoor → Duha → Istijaba [ADVANCE]     │
│   ↑                                           ↓                 │
│   │                              Schedule shifts to tomorrow,   │
│   │                              nextIndex=0 (Midnight)         │
│   └──────────────────────────────────────────────────────────────┘
```

## Implementation

### Key Files

| File | Responsibility |
|------|----------------|
| `shared/time.ts` | `calculateCountdown()` with yesterday fallback logic |
| `stores/schedule.ts` | `advanceScheduleToTomorrow()` - shifts schedules, resets nextIndex |
| `stores/sync.ts` | `initializeAppState()` - advances schedules on app open if last prayer passed |
| `stores/countdown.ts` | Countdown that triggers advancement when countdown hits 0 |
| `hooks/usePrayer.ts` | `isPassed` calculation checking both date AND time |

### Schedule Advancement Flow

```
Countdown hits 0
    ↓
incrementNextIndex(type)
    ↓
Is nextIndex now 0? (wrapped)
    ↓ Yes
advanceScheduleToTomorrow(type)
    ↓
1. Close overlay (prevent stale state)
2. Fetch dayAfterTomorrow data
3. Shift: today→yesterday, tomorrow→today, new→tomorrow
4. Reset nextIndex to 0
5. Update date atom
    ↓
startCountdownSchedule(type)
    ↓
calculateCountdown() uses yesterday fallback if needed
```

### The Yesterday Fallback (Critical for Extras)

The Extras schedule has an **inverted temporal structure**: the first prayer (Midnight ~23:00) comes after the last prayer (Duha ~9am or Istijaba ~12:30pm).

**Problem scenario:**
- It's 10:00 on Jan 18
- Duha passed at 09:15
- Schedule advances: today becomes Jan 19
- Next prayer is Midnight at 23:23 on Jan 18 (yesterday's date)
- But the schedule shows tomorrow (Jan 19)

**Solution in `calculateCountdown()` (shared/time.ts:251-289):**

```typescript
// If schedule has advanced (todayPrayer is tomorrow)
if (todayPrayer.date !== today) {
  const isNextPrayer = index === schedule.nextIndex;
  if (isNextPrayer) {
    const yesterdayTimeLeft = secondsRemainingUntil(yesterdayPrayer.time, yesterdayPrayer.date);
    // If yesterday's prayer is still in the future, use it
    if (yesterdayTimeLeft > 0) {
      return { timeLeft: yesterdayTimeLeft, name: yesterdayPrayer.english };
    }
  }
  // Otherwise use today's prayer (chronologically tomorrow)
  return { timeLeft: secondsRemainingUntil(todayPrayer.time, todayPrayer.date), name: todayPrayer.english };
}
```

## Scenarios

### Scenario 1: Normal Day - Standard Schedule

**Context:** Typical day, all prayers in expected order.

```
Time: 14:30 (2:30pm) on 2026-01-18
Standard Schedule: date = 2026-01-18
Prayers: Fajr 06:12, Sunrise 07:48, Dhuhr 12:14, Asr 14:15, Maghrib 16:45, Isha 18:15
nextIndex: 4 (Maghrib)
Countdown: 2h 15m until Maghrib
```

**Flow:** Countdown counts down. At 16:45, nextIndex becomes 5 (Isha). At 18:15, nextIndex wraps to 0, schedule advances to Jan 19.

---

### Scenario 2: Normal Day - Extras Schedule

**Context:** Typical day, extra prayers.

```
Time: 14:30 on 2026-01-18
Extras Schedule: date = 2026-01-18
Prayers: Midnight 23:23, Last Third 02:40, Suhoor 05:32, Duha 08:08
nextIndex: 0 (Midnight - first prayer not yet arrived)
Countdown: 8h 53m until Midnight
```

**Flow:** All Extras prayers already passed earlier (last night's Midnight, Last Third, Suhoor, morning's Duha). Wait until 23:23 for tonight's Midnight.

---

### Scenario 3: Isha Before System Midnight (Normal Case)

**Context:** London winter, Isha is early.

```
Time: 19:00 on 2026-01-18
Isha: 18:15 (already passed)
Standard Schedule: date = 2026-01-19 (advanced after Isha)
nextIndex: 0 (Fajr tomorrow)
Countdown: 11h 12m until Fajr
```

**Behavior:** Schedule already advanced at 18:15. Showing tomorrow's Fajr countdown.

---

### Scenario 4: Isha After System Midnight (CRITICAL)

**Context:** London summer, Isha is very late.

```
Time: 00:30 on 2026-06-22 (just after system midnight)
Isha: 00:45 on 2026-06-22 (but belongs to June 21's schedule)
Standard Schedule: date = 2026-06-21
nextIndex: 5 (Isha)
Countdown: 15m until Isha
```

**Critical rule:** Isha at 00:45 belongs to June 21. The schedule does NOT advance at 00:00. It advances after Isha passes at 00:45.

**Flow:**
1. At 00:00: Still showing June 21 schedule, counting down to Isha
2. At 00:45: Isha passes, schedule advances to June 22
3. Countdown now shows countdown to Fajr on June 22

---

### Scenario 5: Midnight Prayer Before System Midnight

**Context:** Early winter, Midnight prayer is before 00:00.

```
Time: 22:00 on 2026-12-15
Midnight prayer: 22:45 (midpoint of Maghrib 16:00 and Fajr 06:30)
Extras Schedule: date = 2026-12-15
nextIndex: 0 (Midnight)
Countdown: 45m until Midnight
```

**Behavior:** Normal countdown, no special handling needed.

---

### Scenario 6: Midnight Prayer After System Midnight (CRITICAL)

**Context:** Summer, nights are short, Midnight prayer is after 00:00.

```
Time: 23:30 on 2026-06-21
Midnight prayer: 00:15 on 2026-06-22 (but belongs to June 21's Extras)
Extras Schedule: date = 2026-06-21
nextIndex: 0 (Midnight)
Countdown: 45m until Midnight
```

**Critical rule:** The Midnight prayer calculated from June 21's Maghrib and June 22's Fajr belongs to June 21's Extras schedule, even though its time is 00:15 on June 22.

---

### Scenario 7: App Opened After Last Prayer Passed

**Context:** User opens app late at night after Isha.

```
Time: 22:00 on 2026-01-18
Isha: 18:15 (passed 4 hours ago)
App not used since morning
```

**Flow in `initializeAppState()` (stores/sync.ts:65-103):**
1. Initialize schedules with today's date (Jan 18)
2. Check if Standard's last prayer (Isha 18:15) passed → YES
3. Call `advanceScheduleToTomorrow(Standard)` → date becomes Jan 19
4. Check if Extras' last prayer (Duha/Istijaba) passed → YES (passed this morning)
5. Call `advanceScheduleToTomorrow(Extra)` → date becomes Jan 19
6. Start countdowns

**Result:** Both schedules showing Jan 19, countdowns counting to respective next prayers.

---

### Scenario 8: New Year Boundary (Dec 31 → Jan 1)

**Context:** Year boundary handling.

```
Time: 23:00 on 2026-12-31
Isha: 17:30 (passed)
Standard Schedule: date = 2027-01-01 (already advanced)
```

**Pre-condition:** December triggers proactive fetch of next year's data (stores/sync.ts:50-53).

**January 1st special handling (stores/sync.ts:66-81):**
```typescript
if (isJanuaryFirst(date)) {
  const prevYearLastDate = new Date(date.getFullYear() - 1, 11, 31);
  const prevYearData = Database.getPrayerByDate(prevYearLastDate);

  if (!prevYearData) {
    // Fetch previous year's data for ProgressBar yesterday calculation
    const prevYearData = await Api.fetchYear(date.getFullYear() - 1);
    Database.saveAllPrayers(prevYearData);
  }
}
```

This ensures ProgressBar has Dec 31's Isha time for calculating progress on Jan 1.

---

### Scenario 9: Friday with Istijaba

**Context:** Friday adds Istijaba as the last Extra prayer.

```
Time: 11:00 on 2026-01-24 (Friday)
Extras Schedule: date = 2026-01-24
Prayers: Midnight 23:23, Last Third 02:40, Suhoor 05:32, Duha 08:08, Istijaba 12:00
nextIndex: 4 (Istijaba)
Countdown: 1h until Istijaba
```

**Behavior:** Extra schedule advances after Istijaba passes at 12:00, not after Duha at 08:08.

---

### Scenario 10: Both Schedules on Different Dates (CRITICAL)

**Context:** The two schedules can legitimately show different dates.

```
Time: 09:30 on 2026-01-18 (Saturday)
Standard: Isha at 18:15 NOT passed → date = 2026-01-18
Extras: Duha at 08:08 PASSED → date = 2026-01-19
```

**This is correct behavior:**
- Standard is waiting for Isha to pass before advancing
- Extras already passed Duha, so it advanced to tomorrow

**Independent date atoms (stores/sync.ts:21-22):**
```typescript
export const standardDateAtom = atomWithStorageString('display_date_standard', '');
export const extraDateAtom = atomWithStorageString('display_date_extra', '');
```

---

### Scenario 11: Countdown Countdown Wrapping to Next Day

**Context:** When today's prayer passed, countdown uses tomorrow's prayer.

```
Time: 15:00 on 2026-01-18
Standard Schedule: date = 2026-01-18
Dhuhr: 12:14 (passed at 12:14)
nextIndex: 3 (Asr)
Asr today: 14:15 (passed at 14:15)
Asr tomorrow: 14:16
Countdown: 23h 16m until Asr tomorrow
```

**Logic in calculateCountdown() (shared/time.ts:282-283):**
```typescript
const prayer = isTimePassed(todayPrayer.time) ? tomorrowPrayer : todayPrayer;
```

---

### Scenario 12: Extras "Midnight Still Upcoming After Duha" (CRITICAL)

**Context:** The inverted temporal structure edge case.

```
Time: 10:00 on 2026-01-18 (Saturday)
Duha: 08:08 (passed 2 hours ago)
Schedule advanced: today is now Jan 19
nextIndex: 0 (Midnight)
Today's Midnight (Jan 19): 23:25 tomorrow
Yesterday's Midnight (Jan 18): 23:23 tonight
```

**The problem:** Countdown would show 37+ hours if using today's prayer (Jan 19 at 23:25).

**The solution:** Yesterday fallback in calculateCountdown():
```typescript
if (todayPrayer.date !== today) {
  if (isNextPrayer) {
    const yesterdayTimeLeft = secondsRemainingUntil(yesterdayPrayer.time, yesterdayPrayer.date);
    if (yesterdayTimeLeft > 0) {
      return { timeLeft: yesterdayTimeLeft, name: yesterdayPrayer.english };
    }
  }
}
```

**Result:** Countdown shows 13h 23m until tonight's Midnight (Jan 18 at 23:23).

---

### Scenario 13: isPassed Calculation After Schedule Advancement

**Context:** Determining if a prayer row should appear "passed" (greyed out).

```
Time: 10:00 on 2026-01-18
Extras advanced: today = 2026-01-19
Midnight: 23:23 (time not passed, but date is tomorrow)
```

**Problem:** Simply checking `isTimePassed("23:23")` returns false, but this would incorrectly show tomorrow's Midnight as "not passed yet" when it hasn't even arrived.

**Solution in usePrayer.ts:**
```typescript
const isPassed = todayPrayer.date === today && isTimePassed(time);
```

The prayer is only considered "passed" if:
1. The prayer's date matches today's date, AND
2. The prayer's time has passed

If the schedule has advanced (prayer.date !== today), the prayer is NOT marked as passed.

---

### Scenario 14: ProgressBar Yesterday's Data

**Context:** ProgressBar needs previous Isha to calculate "time since last prayer".

```
Time: 03:00 on 2026-01-18
Current prayer: waiting for Fajr (06:12)
Previous prayer: Yesterday's Isha (18:15 on Jan 17)
```

**The ProgressBar calculation needs:**
- Previous prayer end time (yesterday's Isha)
- Next prayer start time (today's Fajr)
- Current time

**This is why `schedule.yesterday` exists:**
```typescript
// stores/schedule.ts
store.set(scheduleAtom, {
  yesterday: schedule.today,    // Old today becomes yesterday
  today: schedule.tomorrow,     // Tomorrow becomes today
  tomorrow: newTomorrow,        // Fetch new tomorrow
  nextIndex: 0,
});
```

## Consequences

### Positive

- **No dead periods**: Countdown always shows countdown to next prayer
- **Clear ownership**: Each prayer belongs to exactly one date
- **Independent schedules**: Standard and Extras advance based on their own logic
- **Edge cases handled**: Summer Isha, Midnight prayer timing, year boundaries all work correctly

### Negative

- **Complexity**: Two dates displayed simultaneously can confuse users initially
- **Data requirements**: Must maintain yesterday, today, and tomorrow data at all times
- **Testing difficulty**: Edge cases require specific time/date simulation

### Neutral

- **Storage overhead**: Three days of data per schedule (minimal)
- **No user-facing impact** when schedules differ (each screen shows its own date)

## Alternatives Considered

### Alternative 1: Keep English Midnight (ADR-002)

**Why rejected:** Dead countdown period, deferred edge cases, incompatible with Midnight prayer.

### Alternative 2: Single Day Boundary for Both Schedules

**Why rejected:** Would require artificial delays or premature advances. Each schedule has different "last prayer" timing.

### Alternative 3: Islamic Day Start (Maghrib)

**Why rejected:** User confusion - displayed date wouldn't match phone/calendar. Users expect date to match their device.

## Related Decisions

- ADR-001: Rolling Notification Buffer
- ADR-002: English Midnight Day Boundary (SUPERSEDED)
- ADR-003: Prayer Explanation Modal Removal

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-18 | muji | Initial draft - supersedes ADR-002 |
