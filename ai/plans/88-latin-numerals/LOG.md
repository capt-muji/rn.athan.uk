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

### Step 01 — native-digit map dead, every composed surface Latin (2.0.743)

Branch `ticket/88-step1` off `lane/88` (package.json printed 2.0.742 at the
branch point, so the step version is 2.0.743; lane/88's READY docs commit had
already consumed 2.0.742). Preflight `PREFLIGHT OK` with all 13 anchors at 1.

Red: the 8 named tests failed exactly as the plan predicts, nothing else:
the two flipped dateLocalized pins (received Arabic-Indic), the new widget
label sweep under both date preferences, the Explanation ar pin and the two
ar sweep sentences carrying digits (suhoor, duha), the new Stepper ar case,
and the new Help ar sweep (the cutoff answer's 30). locale.test.ts is a
deletion with no red run.

Change: `NATIVE_DIGITS` and `localizeDigits` deleted with the doc comment and
one blank line from `shared/i18n/locale.ts`; the twelve wrapper expressions
unwrapped across `shared/time.ts`, `Help.tsx`, `Explanation.tsx`,
`Stepper.tsx`; the typography RECORDS comment lost its numerals clause; the
Hijri doc comment reads "with Latin digits in every locale (row 88)".
Biome reflowed the stepper value container's opening tag onto one line after
the unwrap (its own formatter fix, same attributes in the same order). A
post-change grep finds no `localizeDigits` or `NATIVE_DIGITS` anywhere.

Green: unit 83 passed 83 total, components 80 passed 80 total, tsc exit 0,
biome exit 0. Break script staged-green run: all four breaks red as expected,
last line `ALL ASPECTED: 1`, tree back to the step's files only.

Version 2.0.743 set in app.json first, then package.json, under the version
lock (fetch origin exit 0). Row 88's status cell reads `IN PROGRESS, step 1`.

Review: cold read of the staged diff against the step checklist and the
shipped classes: clean. No file outside the list, RTL_IDS untouched, stepper
styles and words untouched, every flipped test asserts Latin bytes at least
once, no lifecycle, thread or rule ground touched.

session: ses_ec1a59d01ffeT0aP4L8M1z8Ccr

### Step 01 — STOPPED at the commit gate (unreproducible plan defect)

The pre-commit hook rejects the step commit, twice, identically (background
run and a fresh foreground run): the related-files jest pass fails
`components/sheets/screens/__tests__/Alert.test.tsx` — `renders the visible
reminder interval with the locale digits under ar`, line 144,
`expect(screen.getByText('\u0661\u0665'))` — the alert sheet's consumer pin
of the stepper's Arabic-Indic value under ar. R1.4 flips exactly that value
to Latin, so the pin can never pass with the step applied. The file is in
neither the step's Files list ("No other file loses or gains a line") nor
the plan's section 4 test map; the map's completeness claim broke, the jest
form of the plan's own `tsc` STOP row. Hook summary both runs:
`Tests: 1 failed, 193 passed, 194 total`, then `husky - pre-commit script
failed (code 1)`. Not the audioMatrix timeout; no retry rule applies.

Question for the lead: amend step 1 to add
`components/sheets/screens/__tests__/Alert.test.tsx` to the Files list with
a contract flipping that pin to the Latin `15` and rewording its comment
(it cites the 2026-10-14 numeral ruling row 88 supersedes), or route
otherwise.

Work saved, tree restored: patch at
`$HOME/athan-gitree/sessions/88/step1-unfinished.patch` (551 lines), status
beside it, hook and red logs copied there. The step branch carried no
commits and is deleted; the version lock is released; 2.0.743 is unused.

session: ses_ec1a59d01ffeT0aP4L8M1z8Ccr

## Planning repair (2026-10-15)

Step 1's first run STOPped at the hook: Alert.test.tsx line 144 pins the
alert sheet's stepper value as escaped codepoints (`\u0661\u0665`), a pin
the section 4 map missed because the map's grep matched Arabic-Indic bytes
and escapes carry none. The executor restored the tree clean, saved the
patch and logs under `$HOME/athan-gitree/sessions/88/`, and asked. Ruling
(lead, planner seat): the plan is repaired, not the step improvised — the
owner's Latin ruling covers the pin, so the flip is mechanical. The repair
adds Alert.test.tsx to section 4's map, step 1's Files and red test 7 (the
pin to Latin `15`, the not-native assertion, the comment reworded off the
superseded 2026-10-14 ruling), the green run's components command, the
restore list, the symptom row for escaped pins, and fresh version
expectations (repair 2.0.743, step 1 2.0.744, step 2 2.0.745). The gate
re-runs PLAN OK; step 1 re-dispatches fresh from red.

### Step 01 — redone after the plan repair

Branch `ticket/88-step1` off `lane/88` at `f4485aa2`, fresh from red per the
repair. Preflight `PREFLIGHT OK` (clean tree, all 13 anchors at 1, row 85
DONE). package.json printed 2.0.743 at the branch point, so the step version
is 2.0.744.

Red: unit 3 failed / 80 passed (the two flipped dateLocalized ar pins
receiving `الأحد, ١١ أكتوبر ٢٠٢٦` and `ربيع الآخر ٣٠, ١٤٤٨`, and the new
widget prop sweep catching the localized `dateLabel` under both date
preferences); components 6 failed / 105 passed (the Explanation ar pin and
the suhoor and duha ar sweep rows, the new Stepper ar case, the new Help ar
sweep at the cutoff topic's 30, and the flipped Alert pin). locale.test.ts is
a deletion with no red run. Nothing outside the named tests failed.

Change: the contracts as written. `NATIVE_DIGITS` and `localizeDigits` deleted
from `shared/i18n/locale.ts` with the doc comment and one blank line; the
twelve wrapper expressions unwrapped across `shared/time.ts`, `Help.tsx`,
`Explanation.tsx`, `Stepper.tsx`; the typography RECORDS comment lost its
numerals clause; the Hijri doc comment reads "with Latin digits in every
locale (row 88)". Biome reflowed the stepper value container's opening tag
onto one line after the unwrap (its own formatter fix, same attributes in the
same order). A post-change grep finds no `localizeDigits` or `NATIVE_DIGITS`
anywhere in the repository.

Green: unit 83 passed 83 total, components 111 passed 111 total, tsc exit 0,
biome exit 0 (after the reflow). Break script written verbatim to
`ai/plans/88-latin-numerals/scripts/break-88-step1.sh`, run staged-green: all
four breaks red as expected, last line `ALL ASPECTED: 1`, tree back to the
step's files only.

Version 2.0.744 set in app.json first, then package.json, under the version
lock (acquired with no retry, fetch origin exit 0). Row 88's status cell
reads IN PROGRESS, step 1. One plan transcription note: the step file's
quoted Alert assertion carries a stray closing paren (`toBeOnTheScreen());`);
the file's real line ends `toBeOnTheScreen();` and the balanced form landed.

Review: cold read of the commit against the step checklist and the shipped
classes: clean. No file outside the list, no wrapper survived, no import
names `localizeDigits`, `RTL_IDS` untouched, stepper styles and words
untouched, every flipped test asserts Latin bytes at least once, no
lifecycle, thread or rule ground touched.

session: ses_ec193d88affep7AvJ3lo6ptnl9

