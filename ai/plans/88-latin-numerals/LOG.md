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

## Planning grill (2026-10-15)

The griller returned five musts, six shoulds and nices. Every must was
confirmed against the repository before applying:

- The jest projects are `unit` and `components` (jest.config.js lines 45,
  62); every `--selectProjects=shared` in the steps matched no project and
  would have run zero tests. All commands now say `unit`.
- The catalog lock hashes the ENGLISH catalog each translation came from
  (catalogLock.test.ts line 11), not the translated bytes; the en edit
  stales all five hashes. Step 2 now re-takes the lock with
  `yarn i18n:lock` (D49) and adds `catalog-lock.json` to its files; the
  decision is recorded in section 2.1.
- notifications.test.ts pins the old title at lines 311 and 321 beyond the
  a12 block; both flips are now named.
- `git checkout -- <file>` restores from the index, which is empty at break
  time; both steps now stage their files before the break runs.
- Deleting the a01 and a13 blocks leaves doubled blank lines Biome refuses;
  both contracts now take one blank line with the block.

Applied shoulds: twelve call expressions (nine was the site count), the
widget sweep covers both date preferences, the ar Help sweep is a new red
test with its own break, the swapped suite counts fixed, the version-lock
retry bounded at 30 attempts, the fetch-origin and version wording pinned.
The gate re-runs PLAN OK after the edits.
