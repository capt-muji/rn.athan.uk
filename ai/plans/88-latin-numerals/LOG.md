# Ticket 88 ledger

## Planning (2026-10-15)

Lane `lane/88` created off `uat` at `718eb060` (2.0.740). Hooks verified in
the lane: `core.hooksPath` is `.husky/_` (relative), `ls .husky/_/h` prints
it, so every lane commit runs the four gates natively. No manual gate regime
holds. `node_modules` symlinked from the main checkout; no install run.

The owner interview is waived: the row's rulings are the interview record
(the owner is asleep; the standing order for this run says so). The
native-digit read-site map was surveyed from the repository before any step
was drafted:

- The mechanism: `NATIVE_DIGITS` + `localizeDigits` in
  `shared/i18n/locale.ts` — the only transliteration in the app (every
  `Intl` call is `en-US`; no `toLocaleString`; the Android widget `ALabel`
  composes JavaScript number strings).
- App read sites: `formatDateLocalized` and `formatHijriDateLocalized`
  (`shared/time.ts`), `Help.tsx` lines 80/87/99, `Explanation.tsx` line 74,
  `Stepper.tsx` lines 62/75/77/82.
- Baked consumers: `formatDateLabel` in `shared/widgetTimeline.ts` (iOS
  entries and the Android snapshot). Footers and row times are Latin by
  construction and stay.
- Notification sites: `genReminderNotificationContent` composes
  `notification.reminder`; `t()` interpolates plainly, so digits are Latin
  today; the rider is en title copy alone.
- Out of reach, mapped: the iOS `Text(timerInterval:)` ticking countdowns
  are formatted by SwiftUI per the system locale; the pinned `@expo/ui`
  passes no locale (verified in `TextView.swift`). Row 69 owns that format
  and sits owner-blocked.

Anchors a01 to a13 extracted at `718eb060`, each counted 1. The grill and
the gate notes land below when they run.
