# Midnight Prayer Feature - Implementation Plan

## Summary

Add "Midnight" prayer to the extras schedule. This is the midpoint between Maghrib (today) and Fajr (tomorrow), representing the Islamic middle-of-the-night prayer time.

## Rationale

The Midnight prayer (Qiyam al-Layl) is a significant voluntary prayer in Islamic tradition, performed at the midpoint of the night. Users have requested this feature to help them identify the optimal time for this prayer.

## How It Will Work

### Calculation
- **Formula:** `(Maghrib + Fajr) / 2` → midpoint of the night
- **Pattern:** Same as Last Third (uses yesterday's Maghrib + today's Fajr during transformation)
- **Result:** Typically 11pm-1am depending on season

### Storage
- **Saved to database** (same as other extras) - NOT calculated on-the-fly at display time
- Calculated during `transformApiData()` when API data is fetched
- Stored in MMKV as part of `prayer_YYYY-MM-DD` entries
- This ensures consistency and performance (calculate once, use many times)

### Order in Extras List
```
NEW:  Midnight → Last Third → Suhoor → Duha → [Istijaba Friday]
OLD:             Last Third → Suhoor → Duha → [Istijaba Friday]
```

### Day Boundary Behavior
- Midnight is the FIRST extra prayer of the Islamic day
- Day advances after LAST prayer (Duha/Istijaba) - unchanged
- When Duha/Istijaba passes, schedule advances and shows countdown to Midnight

---

## Files to Modify

### 1. `shared/types.ts`
Add `midnight: string` field to `ISingleApiResponseTransformed` interface.

### 2. `shared/constants.ts`
Update extras arrays:
```typescript
EXTRAS_ENGLISH = ['Midnight', 'Last Third', 'Suhoor', 'Duha', 'Istijaba']
EXTRAS_ARABIC = ['نصف الليل', 'آخر ثلث', 'السحور', 'الضحى', 'استجابة']
ISTIJABA_INDEX = 4  // was 3
```

### 3. `shared/time.ts`
Add `getMidnightTime()` function:
```typescript
export const getMidnightTime = (magribTime: string, fajrTime: string): string => {
  // Maghrib from yesterday, Fajr from today (same pattern as getLastThirdOfNight)
  // Calculate midpoint (1/2 of night duration)
  // Return HH:mm format
};
```

### 4. `shared/prayer.ts`
Add midnight calculation in `transformApiData()`:
```typescript
midnight: TimeUtils.getMidnightTime(times.magrib, times.fajr),
```

### 5. `components/ModalTimesExplained.tsx`
Add Midnight explanation row (first in extras section).

### 6. `README.md`
Update Extra Prayers documentation.

---

## What Doesn't Need to Change

- **`stores/schedule.ts`** - Uses EXTRAS arrays dynamically
- **`stores/sync.ts`** - Data transformation handles it automatically
- **`stores/notifications.ts`** - Uses prayer name matching
- **Day boundary logic** - Still advances after Duha/Istijaba

---

## Scenario Verification (Confirmed)

| Scenario | Time Now | Midnight Time | Display Date | Next Prayer |
|----------|----------|---------------|--------------|-------------|
| 1 | Wed 5pm | 11pm (in 6h) | Thu 18th | Midnight |
| 2 | Wed 11:30pm | 11pm (30m ago) | Thu 18th | Last Third |
| 3 | Thu 12:30am | 11:30pm (1h ago) | Thu 18th | Last Third |
| 4 | Fri 12:30am | 11:30pm (in 23h) | Fri 19th | Last Third |
| 5 | Fri 6pm (after Istijaba) | 11:30pm (in 5.5h) | Sat 20th | Midnight |

All scenarios follow existing prayer-based day boundary: schedule advances when last prayer (Duha/Istijaba) passes.

---

## Edge Cases

- **Year boundary (Dec 31 → Jan 1):** Handled by date-fns `subDays()` function
- **Daylight saving:** Handled by `createLondonDate()` timezone function
- **Summer nights (short):** Midnight will be around 00:00-01:00
- **Winter nights (long):** Midnight will be around 22:00-23:00

---

## User Preference Migration

Existing notification preference indices shift:
- Old: 0=Last Third, 1=Suhoor, 2=Duha, 3=Istijaba
- New: 0=Midnight, 1=Last Third, 2=Suhoor, 3=Duha, 4=Istijaba

Users will need to reconfigure if they had specific extras enabled. This is acceptable as it's a new feature addition.

---

## Verification Steps

1. Clear app cache and re-sync data
2. Check Midnight appears first in extras list
3. Verify Midnight time is correct (between Magrib and Fajr)
4. Verify Last Third still correct (later than Midnight)
5. Test day advancement when Duha/Istijaba passes
6. Test notifications for Midnight prayer
7. Verify Istijaba still only appears on Fridays (index 4)
8. Test overlay timer for Midnight prayer
9. Check modal explanation shows correct description

---

## Success Criteria

- [ ] Midnight appears as first extra prayer
- [ ] Midnight time calculated correctly (midpoint formula)
- [ ] Notifications work for Midnight prayer
- [ ] Timer counts down correctly to Midnight
- [ ] Istijaba index updated and Friday filtering still works
- [ ] Modal explanation displays "Midpoint between Magrib and Fajr"
- [ ] No TypeScript errors
- [ ] No breaking changes to existing functionality
- [ ] README updated with new prayer count

---

## Technical Notes

- Uses same calculation pattern as `getLastThirdOfNight()`
- No time adjustment applied (pure midpoint)
- Stored during data transformation (not calculated at display time)
- Follows NO FALLBACKS principle (trust data layer)
- Zero defensive code needed (data layer guarantees yesterday data)
