# Prayer Ago - Progress

## Status: 📝 Ready for Implementation

Created: 2026-01-22

## Reference

- [Plan](./plan.md)
- [Description](./description.md)

## Tasks

- [ ] **Task 1:** Add formatTimeAgo to shared/time.ts
- [ ] **Task 2:** Create usePrayerAgo hook
- [ ] **Task 3:** Add PrayerAgo to Countdown.tsx
- [ ] **Task 4:** Manual testing

## Detailed Checklist

### Task 1: formatTimeAgo

- [ ] Function returns "now" for seconds < 60
- [ ] Function returns "1m", "59m" for 1-59 minutes
- [ ] Function returns "1h", "10h 15m" for 1+ hours
- [ ] No seconds displayed
- [ ] JSDoc complete

### Task 2: usePrayerAgo hook

- [ ] Hook returns { prayerAgo, isReady }
- [ ] Uses getPrevPrayer() correctly
- [ ] Handles Fajr case (yesterday's Isha)
- [ ] Updates every 60 seconds
- [ ] JSDoc complete

### Task 3: Countdown.tsx

- [ ] Prayer ago text appears below countdown timer
- [ ] Uses TEXT.sizeSmall, COLORS.textSecondary
- [ ] Format: "Fajr now", "Asr 10h 15m ago"
- [ ] Uses React.memo

### Task 4: Manual Testing

- [ ] "now" displays correctly (<60s)
- [ ] Minutes display correctly (1-59m)
- [ ] Hours/minutes display correctly (1h+)
- [ ] Fajr shows yesterday's prayer
- [ ] 60-second throttle works

## Notes
