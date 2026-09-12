# uat-2 program — progress tracker

The owner approved this program on 2026-09-11. Feature branches come off `uat-2` and merge back into it with `--no-ff`. The owner tests `uat-2` and says when to merge it into `uat`. After that, `uat` is merged into `experiment/alarmclock-backport`. **Never commit the API key.**

Principles:

- The app is an alarm clock: every time must be exactly right.
- Nothing else changes. Rows, order and when a list switches stay as they are.
- Nothing may assume London. Version 2.0 goes global.
- Measure before and after. Change one thing at a time. Verify on the device.

Legend: ✅ done · 🔀 merged into uat-2 · 🚧 in progress · ⏳ to do · 👤 owner · ❌ deferred

| # | Task | Branch | Status |
|---|---|---|---|
| 1 | Create uat-2 from uat | `uat-2` | ✅ |
| 2 | Tracker saved in the repo | `uat-2` | ✅ |
| 3 | #29: night times from the right Maghrib/Fajr pair | `fix/night-times` | 🔀 uat-2 |
| 4 | Clock-change nights measured in real elapsed time | `fix/night-times` | 🔀 uat-2 |
| 5 | Notifications and reminders fire exactly when their row says (one source of truth) | `fix/night-times` | 🔀 uat-2 |
| 6 | Night times worked out when the list is built (stored night fields and the Dec 31 patch removed) | `fix/night-times` | 🔀 uat-2 |
| 7 | Heavy tests, a 3T check, and a 5-minute test for the owner | `fix/night-times` | 🔀 uat-2 (3T ✅; owner's 5-minute test pending) |
| 8 | Phones set to other timezones: dates follow the prayer timezone (needed for v2.0) | `fix/year-boundary` | 🔀 uat-2 (3T ✅, New York time ✅) |
| 9 | The extra download on 1 Jan (ISSUES #4) | `fix/year-boundary` | 🔀 uat-2 |
| 10 | More than 3 days in the background: the stop-gap list starts from tomorrow | `fix/year-boundary` | 🔀 uat-2 |
| 11 | Device checks: one command, run on demand | `test/device-checks` | ✅ `yarn check:device` — build identity, permissions, notification channels and every armed alarm; fails when nothing is armed. Optional expected-times file checks the alarm times themselves (no API key) |
| 12 | Launch time: measure a production build on the 3T | `perf/launch-time` | 🚧 baseline 6.6–6.7 s to first frame (3T, production build); profile next |
| 13 | Launch time: one change at a time, checked frame by frame | `perf/launch-time` | ⏳ |
| 14 | "Ago" badge moved onto the shared clock tick | `refactor/tidy-ups` | ✅ 1.24.28 — subscribes to the countdown atom with `store.sub` (no extra timer, and no extra render: `useAtomValue` would re-render every second). Its test now calls the hook's real `calculatePrayerAgo` instead of a local copy |
| 15 | Popups tracked by prayer name, not row number | `refactor/tidy-ups` | ✅ already true since 1.24.7 — `Overlay.tsx` looks the explanation up by name (`EXTRAS_ENGLISH.indexOf`). Verified, no change needed; the remaining index-keyed atoms are row *selection*, which is legitimately positional |
| 16 | Countdown bar 2px too long when full | `refactor/tidy-ups` | ✅ 1.24.26 — the tip oval is centred on `left`, so it overhung the track by 0.6dp at full (≈2 physical px at 3x) and 2.4dp at empty. Clamped in `components/countdown/tipGeometry.ts`, pure and unit-tested; mid-range positions unchanged |
| 17 | Internal renames (one timezone setting) | `refactor/tidy-ups` | ✅ 1.24.27 — `createLondonDate` → `createInstant` (it was literally `new Date()`), 40 refs across 20 files. `PRAYER_TIMEZONE` stays the single setting for v2.0; the user-facing "London, UK" is copy, not a name |
| 18 | Code audit brief | `uat-2` | ⏳ |
| 19 | Code audit: findings | next session | ⏳ |
| 20 | Code audit: changes, one at a time | next session | ⏳ |
| 21 | Owner's manual test of uat-2 | — | 👤 |
| 22 | iOS check on the XS | — | 👤 |
| 23 | Merge uat-2 → uat (on the owner's word) | `uat` | ⏳ |
| 24 | Update the alarm clock branch from uat | `experiment/alarmclock-backport` | ⏳ |
| — | ISSUES #27: a single row after the day roll | — | ❌ deferred (unreproduced) |
| — | Popup frame drops on the 3T | — | ❌ deferred (old device) |
| — | 236ms switch at prayer time | — | ❌ accepted |
| — | Package upgrades | — | ❌ future session |
