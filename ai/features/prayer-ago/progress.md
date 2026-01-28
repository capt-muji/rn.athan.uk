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

- [x] Function returns "now" for seconds < 60
- [x] Function returns "1m", "59m" for 1-59 minutes
- [x] Function returns "1h", "10h 15m" for 1+ hours
- [x] No seconds displayed
- [x] JSDoc complete

### Task 2: usePrayerAgo hook

- [x] Hook returns { prayerAgo, isReady }
- [x] Uses getPrevPrayer() correctly
- [x] Handles Fajr case (yesterday's Isha)
- [x] Updates every 60 seconds
- [x] JSDoc complete

### Task 3: Countdown.tsx

- [x] Prayer ago text appears in component
- [x] Uses TEXT.sizeSmall, COLORS.textSecondary
- [x] Format: "Fajr now", "Asr 10h 15m ago"
- [x] Hidden in overlay mode

### Task 4: Manual Testing

- [ ] "now" displays correctly (<60s)
- [ ] Minutes display correctly (1-59m)
- [ ] Hours/minutes display correctly (1h+)
- [ ] Fajr shows yesterday's prayer
- [ ] 60-second throttle works

## Notes
