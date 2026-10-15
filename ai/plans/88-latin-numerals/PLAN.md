# Ticket 88: Latin numerals absolutely everywhere; the notification unit word drops

| Field | Value |
| --- | --- |
| Brief | Queue row 88, `ai/plans/README.md` |
| Planned at | `718eb060`, 2.0.740, 2026-10-15 |
| Planned by | The lane planning session of 2026-10-15; the owner's row rulings stand in for the interview (she is asleep; the row is the interview record) |
| Needs first | 85 (DONE) |
| Parent | none |
| Group | the digit and catalog layer: `shared/i18n/locale.ts`, `shared/time.ts`, `shared/i18n/en.ts`, the three sentence-rendering components. No open ticket shares these files |
| Batch budget | 2 |
| Session budget | 4 |
| Steps count | 2 |
| Device | none. The owner's own device read is the acceptance bar for the ar face; jest and review are the proof vehicles. The lane runs with no device work |
| Owner decisions still needed | none. The row carries every ruling; the two readings the row left open are decided in section 2.1 from the row's own words, with the evidence quoted |

## 1. Goal

Under locale `ar` the app still renders Eastern Arabic-Indic digits on every
surface outside the countdown: the Gregorian date label reads
`الأحد, ١١ أكتوبر ٢٠٢٦`, the Hijri label `ربيع الآخر ٣٠, ١٤٤٨`, the Extras
info boxes open Suhoor with `٢٠ دقيقة`, the Help modal's sentences carry
Arabic-Indic numbers, the alert sheet's reminder stepper shows `١٥`, and the
widget props bake those same native-digit date labels. Under `en` the reminder
notification title carries a unit letter: `Fajr in 15m`.

The owner ruled on 2026-10-15 (row 88): "no native numerals anywhere, ever:
every digit on every surface in every language is a Latin digit (1 2 3). The
surfaces: the notifications, the widgets, the bottom sheets, the date and
Hijri labels, the info boxes, anywhere a digit renders." And the rider: "the
notification titles drop the unit word: `Fajr in 5`, never `Fajr in 5
minutes` nor its translation (too much text; the number is enough context)."
The carve-out she named: "the alert sheet's reminder steppers (Latin number
followed by the native-language word for minutes) are perfect and stay
untouched."

When DONE: every digit the app composes renders Latin in all six locales, the
native-digit mechanism (`NATIVE_DIGITS` and `localizeDigits`) is deleted with
its tests, the en reminder title reads `Fajr in 15`, and the owner's ar device
face shows Latin digits everywhere she looks. The iOS widget's SwiftUI
ticking countdown stays system-formatted (mapped in section 4, out of the
app's reach without row 69's owner-blocked format change).

## 2. Decisions

### 2.1 Taken

| What | Who | When | Where |
| --- | --- | --- | --- |
| Latin digits on every surface in every language; the native-digit map dies | owner | 2026-10-15 | row 88 |
| Notification titles drop the unit word (`Fajr in 5`) | owner | 2026-10-15 | row 88 rider |
| The steppers keep the number-then-word design; their unit word never drops | owner | 2026-10-15 | row 88 carve-out |
| The steppers' digits go Latin with the map's death | planner | 2026-10-15 | this session. The row's headline "every digit on every surface in every language... anywhere a digit renders" is absolute and the stepper renders digits; the carve-out's parenthetical describes the design she preserved against the titles' dropped word, not an exemption from the digit law |
| Only `en` changes its title: the five translated titles keep their prepositions | planner | 2026-10-15 | verified in all six catalogs: `ar` `{name} بعد {n}`, `hi` `{name} {n} में`, `ms` `{name} dalam {n}`, `so` `{name} {n} gudahood`, `th` `{name} อีก {n}` carry a preposition meaning "in" and no unit word; the locked bytes stay (the `catalog-lock.json` hashes cover all five) |
| The Android channel labels keep their unit letter | planner | 2026-10-15 | the rider names "the notification titles"; a channel name is not a title, and `ai/AGENTS.md` freezes channel names at creation (a new generation means new ids), so regenerating them is scheduling ground the sleeping owner owns |
| The catalog lock is consciously re-taken after the en title edit (`yarn i18n:lock`, the D49 process); the five translations stay byte-identical | planner | 2026-10-15 | this session. The lock hashes the English catalog each translation came from (`shared/__tests__/catalogLock.test.ts` line 11), so any en edit stales all five entries until the re-take; the re-take records that the translations were checked against the new English, not re-translated |
| The iOS SwiftUI ticking countdown stays as it renders | planner | 2026-10-15 | `Text(timerInterval:)` is formatted by SwiftUI per the system locale; the pinned `@expo/ui` exposes no locale parameter (`node_modules/@expo/ui/ios/TextView.swift` builds the Text with no locale argument). Forcing Latin there means replacing the ticking timer with baked labels, which is row 69's owner-blocked widget-format ground |
| No widget module file changes | planner | 2026-10-15 | the baked `dateLabel` bytes change through the shared formatters; `footerFor` composes `Intl` `en-US` fields (Latin) and every carried time rides `prayer.time` (HH:mm, Latin by construction), both pinned by the existing test `bakes Latin digits into every carried time under ar` |
| Notification scheduling is untouched: the new title text reaches devices through the existing re-arm paths only | planner | 2026-10-15 | `ai/AGENTS.md` ask-first ground; titles are baked at arm time and the convergence pass re-arms on language change with no code change here |

### 2.2 The executor must not decide

- Whether any scheduling behavior changes: identifiers, channels, arming,
  re-arm triggers, cancellation sweeps. Nothing in this ticket touches them.
  A coverage or test failure that seems to need one is `STOP:`.
- Whether the stepper's unit word drops: it does not. Whether the stepper is
  redesigned: it is not.
- Whether `channel.reminder`, `channel.athan`, `alert.reminder` or any key
  outside `notification.reminder` changes its bytes: they do not.
- Whether `RTL_IDS`, `localeDirection`, `directionGlyph` or `chevronFor`
  change: direction is a different axis; they stay exactly as they are.
- Whether `footerFor` changes: it composes Latin digits today and this ticket
  changes nothing in it.
- Any visual value: colour, size, spacing, font, layout. This ticket changes
  digit glyphs and one title string only.

## 3. Pre-flight

`scripts/preflight-88.sh`, committed with this plan. The executor saves a copy
to `$TMPDIR` and runs it from the lane worktree root (`$HOME/athan-gitree/lanes/88`).
It checks the lane checkout (`lane/88`), a clean tree (only `ai/plans/README.md`
and this plan folder dirty), `uat` contained in `HEAD`, the version floor
2.0.740, row 85 DONE, and all 13 anchor counts equal to 1. It ends
`PREFLIGHT OK`.

## 4. Background the executor needs

The native-digit read-site map, every site named with file and symbol. The
mechanism is single: no other transliteration exists (verified: every
`Intl.DateTimeFormat` in the app builds from `en-US`; no `toLocaleString`
call anywhere; the widget runtime's `ALabel` composes JavaScript number
strings, which are Latin).

The mechanism (dies in step 1):

- `shared/i18n/locale.ts` (a01): `NATIVE_DIGITS` (line 27, `ar` maps to
  `٠١٢٣٤٥٦٧٨٩`) and `localizeDigits` (lines 29-32), the only code that turns
  Latin digits into native ones. `RTL_IDS` above it stays.

App read sites, every caller of `localizeDigits` (the grep set is exactly
these four files plus tests):

- `shared/time.ts` `formatDateLocalized` (a02, line 281): wraps day and year.
  The Gregorian date label above both schedules, through
  `components/day/shownDate.ts` line 34.
- `shared/time.ts` `formatHijriDateLocalized` (a03, line 306): wraps day and
  year. The Hijri date label, same consumer.
- `components/modals/Help.tsx` (a04, lines 80, 87, 99): the cause text, the
  fix steps and the action label. The help sentences carry digits
  (`help.a.cutoff`: "limited to 30 seconds").
- `components/prayer/Explanation.tsx` (a05, line 74): the Extras info-box
  sentence (`extras.explanation.suhoor`: "20 mins before Fajr" and its
  translations).
- `components/sheets/parts/Stepper.tsx` (a06, lines 62, 75, 77, 82): the
  alert sheet's reminder steppers, visible value and the three screen-reader
  labels. The carve-out surface; the digits join Latin, the design and the
  unit word stay.

Baked consumers (no file of their own changes; their bytes change through
the formatters):

- `shared/widgetTimeline.ts` `formatDateLabel` (line 134) bakes
  `formatHijriDateLocalized`/`formatDateLocalized` into every iOS timeline
  entry's `dateLabel` (lines 202, 277) and every Android snapshot day's
  `dateLabel` (line 317). `footerFor` (lines 217, 278, 318) composes Latin
  digits today. Rows' `time` (lines 157, 213, 274, 334) and `nextTime` ride
  `prayer.time`, an `HH:mm` string that `formatPrayerTime` builds with `pad2`
  or the API hands over Latin. The existing test `bakes Latin digits into
  every carried time under ar` pins the times; this ticket adds the label
  sweep beside it.

Notification sites (step 2):

- `shared/notifications.ts` `genReminderNotificationContent` (line 182)
  composes `t('notification.reminder', { name, n: intervalMinutes })`.
  `t` (`shared/i18n/index.ts` lines 41-49) interpolates `String(supplied)`
  with no digit treatment, so notification digits are Latin in every locale
  today; the rider is title copy alone.
- `shared/i18n/en.ts` (a07, line 92): `'notification.reminder': '{name} in
  {n}m'`. The five translated values carry prepositions only (section 2.1).
  `channel.reminder` (line 195) keeps its `m`.

The map's out-of-reach surface (no step touches it): the iOS widgets' ticking
countdowns, `widgets/PrayerWidget.tsx` lines 691-695 and 729-733 and
`widgets/LockPrayerWidget.tsx` lines 263 and 747, render
`Text(timerInterval:)`, which SwiftUI formats per the system locale. The
pinned `@expo/ui` passes no locale to the SwiftUI `Text` (verified in
`node_modules/@expo/ui/ios/TextView.swift`). An Arabic-locale iPhone renders
those digits Arabic-Indic; no app-side bake reaches them. Row 69 owns the
widget countdown format and sits owner-blocked.

Existing tests and what each proves:

- `shared/__tests__/locale.test.ts` (a13): the `localizeDigits` describe
  (lines 139-150) pins the ar map. It dies with the function; the rest of the
  file (resolution, preference, chevron) is untouched ground.
- `shared/__tests__/dateLocalized.test.ts` (a09): pins the Gregorian label
  against a date-fns oracle for every day of 2026 (en, Latin today and after)
  and the ar/Hijri labels with Arabic-Indic expectations (lines 61-64, 81-85).
  The ar expectations flip to Latin.
- `components/prayer/__tests__/Explanation.test.tsx` (a10): the ar describe
  (lines 60-73) asserts the Suhoor sentence shows `٢٠`; the six-locale sweep
  (lines 75-97) asserts every locale shows `localizeDigits(t(key))`. Both
  flip: every locale shows `t(key)` bytes with Latin digits.
- `components/sheets/parts/__tests__/Stepper.test.tsx`: pins the en labels
  (`'15 min'`, `'Decrease to 10 min'`). Stays; step 1 adds the ar case.
- `shared/__tests__/widgetTimeline.test.ts`: entry generation and the ar
  Latin-times test (lines 197-221). Stays; step 1 adds the label sweep.
- `shared/__tests__/i18nBridge.test.ts` (a11): pins `t` interpolation
  (`'Fajr in 15m'`, `'Last Third in 30m'`, the channel line). Step 2 flips
  the two title lines, keeps the channel line.
- `shared/__tests__/notifications.test.ts` (a12): pins the reminder title
  bytes `'Fajr in 15m'` (lines 311 and 694), `'Dhuhr in 5m'`, `'Asr in 30m'`
  (lines 320-321), and the ar title `'العصر بعد 15'` (line 315, Latin
  digits through plain `t` interpolation today and after). Step 2 flips the
  en pins, keeps the ar pin.
- `shared/__tests__/prayerIdContract.test.ts` line 113 pins the en channel
  bytes `'{name} in {n}m Reminder'`: unchanged, and the test proves the
  channel boundary holds.
- `shared/__tests__/catalogLock.test.ts` hashes the English catalog and
  compares each of the five stored hashes against it: an en edit stales all
  five until the lock is consciously re-taken with `yarn i18n:lock`. Step 2
  re-takes it; the re-take plus the review diff (no translated file in it)
  proves the five titles keep their bytes.
- `shared/__tests__/versionLockstep.test.ts`: the lane worktree has no
  `android/` folder (prebuild output, gitignored), so the gradle leg is
  skipped and `package.json`/`app.json` agreement is enforced.

Why the obvious fix is wrong: keeping `localizeDigits` as an identity
function (or emptying `NATIVE_DIGITS`) leaves a dead export and a dead table
the residue rule forbids, and keeps four call sites wrapping values in a
function that does nothing. The map dies and the wrappers go with it.

## 5. Design

The approach: delete the single native-digit mechanism and unwrap its
twelve call expressions across four files; flip the pinned tests to Latin
expectations; drop the `m` from one en catalog value. The invariant, one
sentence a test can check: after this ticket no code path in the repository
converts a Latin digit to a native one, and the six-locale renders show
catalog bytes with Latin digits only.

Alternatives rejected: an identity `localizeDigits` (dead code, residue
rule); a per-surface Latin switch (multiplies branches for one global law);
re-keying the digit map off the app locale (row 67's plan; the row's
supersession kills it, and row 88's DONE fold writes that cell).

Concurrency trace: none worth guarding. All composition is synchronous
string building on the render or bake path. A language switch bumps
`localeVersionAtom` and remounts the tree; the next render composes Latin
bytes. Widget props re-bake on the next push; already-baked entries carry
their own bytes and age out on the timeline's own schedule. Notification
titles bake at arm time; the convergence pass re-arms on a language switch
with no code change here.

Design review: the rider's blast radius was checked for scheduling coupling.
`genReminderNotificationContent` changes nothing but the bytes `t` returns;
identifiers (`reminder_${slug}_${intervalMinutes}`) and channel ids read
numbers, never the title. The identifier hook and the scheduling lock are
untouched.

**Acceptance criteria:**

- [R1.1] WHEN `formatDateLocalized('2026-10-11')` runs under locale `ar` THE SYSTEM SHALL return `الأحد, 11 أكتوبر 2026` with no Arabic-Indic digit.
- [R1.2] WHEN `formatHijriDateLocalized('2026-10-11')` runs under locale `ar` THE SYSTEM SHALL return `ربيع الآخر 30, 1448` with no Arabic-Indic digit.
- [R1.3] WHEN an Extras info box or the Help modal renders a catalog sentence under any of the six locales THE SYSTEM SHALL render the catalog's own bytes with every digit Latin (the Extras six-locale sweep and the ar Help sweep are the observing tests).
- [R1.4] WHEN the alert sheet's reminder stepper renders under locale `ar` THE SYSTEM SHALL show the Latin interval number followed by the ar catalog's word for minutes.
- [R1.5] WHEN the module `shared/i18n/locale` is read THE SYSTEM SHALL export no `localizeDigits` and hold no `NATIVE_DIGITS` table.
- [R1.6] WHEN the widget timeline builder or the snapshot builder bakes props under locale `ar` with the Hijri preference on or off THE SYSTEM SHALL bake no Arabic-Indic digit into any prop string.
- [R2.1] WHEN `genReminderNotificationContent('fajr', 15, AlertType.Sound)` runs under locale `en` THE SYSTEM SHALL return the title `Fajr in 15`.
- [R2.2] WHEN `t('notification.reminder', { name, n })` runs under `ar`, `ms`, `so`, `hi` or `th` THE SYSTEM SHALL return that catalog's locked bytes unchanged, each carrying its preposition and no unit word (observed by the ar pin `'العصر بعد 15'` in `shared/__tests__/notifications.test.ts` line 315 and by the step 2 diff carrying no translated file).
- [R2.3] WHEN `t('channel.reminder', { name: 'Fajr', n: 15 })` runs under locale `en` THE SYSTEM SHALL return `Fajr in 15m Reminder`.

## 6. Steps

Checklist:

- [ ] Step 1 `steps/01-digit-map-dies.md` — the native-digit map dies, every surface renders Latin. Weight 2. Requirements R1.1 to R1.6.
- [ ] Step 2 `steps/02-notification-title-rider.md` — the en reminder title drops its unit letter. Weight 2. Requirements R2.1 to R2.3.

The lane discipline, which overrides the branch words in the executor's own
file: every step creates its branch off `lane/88`
(`git checkout -b ticket/88-step<k> lane/88`), commits once, and merges
`--no-ff` back into `lane/88` (`git checkout lane/88 && git merge --no-ff
ticket/88-step<k> -m "<VERSION> - merge step <k>: <one line>"`), then deletes
the step branch. The executor never pushes. The version lock
(`mkdir $HOME/athan-gitree/version.lock`, retry while it exists, `rmdir`
after the merge) serializes every bump. The pre-commit hook runs the four
gates in the lane (verified 2026-10-15: `core.hooksPath` is the relative
`.husky/_`, and `ls .husky/_/h` prints it).

## 7. Device proof

None. The lane runs with no device work. The owner's own device read of the
ar face is the acceptance bar for the glyph change; the jest suites and the
three-reviewer audit are this ticket's proof vehicles.

## 8. Records

The findings text the executor writes into `LOG.md` under
`## Ticket 88 findings`:

```
The native-digit map is dead: NATIVE_DIGITS and localizeDigits deleted from
shared/i18n/locale.ts, the twelve wrapper expressions unwrapped across
shared/time.ts, Help.tsx, Explanation.tsx and Stepper.tsx. Under ar the
Gregorian label reads <Latin fixture>, the Hijri label <Latin fixture>, the
Suhoor box opens 20 in Latin, the Help sentences carry Latin digits, the
stepper shows 15 with the ar word for minutes, and the widget props bake no
Arabic-Indic digit under either date preference. The en reminder title reads
Fajr in 15 (no unit letter); the five translated titles and every channel
label keep their locked bytes. The iOS SwiftUI ticking countdown stays
system-formatted (row 69's ground). Versions <v1> and <v2> on lane/88.
```

The queue cell text the lead applies on DONE:

```
DONE 2026-10-<date>, audited: every digit the app composes renders Latin in
every language — the native-digit map (NATIVE_DIGITS, localizeDigits) is
deleted with its tests, the ar date and Hijri labels, the Extras info boxes,
the Help sentences and the alert sheet's stepper values carry Latin digits
(carve-out kept: number then the native word for minutes, design untouched),
and the widget props bake Latin bytes through the shared formatters (footers
and rows Latin by construction; the iOS SwiftUI ticking countdown stays
system-formatted, row 69's owner-blocked ground). The en reminder title drops
its unit letter (`Fajr in 15`); the five translated titles keep their
prepositions (none carried a unit word) and the channel labels keep theirs
(not titles, frozen at creation). Scheduling untouched
```

The docs commits: planning `<VERSION> - docs(plans): ticket 88 planned: Latin
numerals everywhere, the native-digit map dies, the en reminder title drops
its unit letter`; executed `<VERSION> - docs(plans): ticket 88 executed:
<one line from the findings>`; the DONE fold also rewrites row 67's status
cell to `SUPERSEDED 2026-10-15 by row 88: Latin numerals everywhere kill the
mixed-script widget face; the defect class dies with the native-digit maps`
followed by the date, keeping row 67's brief text intact (the owner's
standing order to this lane).

## 9. Push

None. The executor worker never pushes. The lane lead pushes after the
reviews pass, and only the audited `uat`.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| A red test passes before the change | The pinned expectation was already Latin on that surface | Record it in `LOG.md`, continue with the tests that did fail; if every named red test passes, `STOP:` |
| `tsc` fails on `localizeDigits` after the deletion | A call site the map above does not name | `STOP:` with the file and symbol; the map claimed completeness and the claim broke |
| A jest project fails outside the named files | The shared node_modules lost its patch-package patches | The lead runs `npx patch-package` from the main checkout root (touches only node_modules); retry once, then `STOP:` |
| The hook times out on `shared/__tests__/audioMatrix.test.ts` | Load average | Wait in the background for load below 8 and commit again, up to 3 times |
| A break prints `BREAK NOT APPLIED` | The substitution text drifted | `STOP:`; never repair an anchor or a break in flight |
| `merge-base --is-ancestor uat HEAD` fails in the pre-flight | Another lane landed on uat | The lead re-anchors the plan; `STOP:` |

Anticipated review fixes, word for word:

- The `import { localizeDigits }` line left behind in any of the four files:
  delete the identifier from the import list (Biome flags it first).
- A doc comment still describing digit localisation in `formatHijriDateLocalized`
  or `dateLocalized.test.ts`'s header: reword to "Latin digits in every
  locale (row 88)".
- The typography `RECORDS` comment still naming `NATIVE_DIGITS`: the numerals
  clause is deleted in step 1's contract; if it survives, that is the fix.

Restore lists: step 1 touches `shared/i18n/locale.ts`, `shared/typography.ts`,
`shared/time.ts`, `components/modals/Help.tsx`,
`components/prayer/Explanation.tsx`, `components/sheets/parts/Stepper.tsx`,
`shared/__tests__/locale.test.ts`, `shared/__tests__/dateLocalized.test.ts`,
`components/prayer/__tests__/Explanation.test.tsx`,
`components/sheets/parts/__tests__/Stepper.test.tsx`,
`components/modals/__tests__/Help.test.tsx`,
`shared/__tests__/widgetTimeline.test.ts`. Step 2 touches
`shared/i18n/en.ts`, `shared/i18n/catalog-lock.json`,
`shared/__tests__/i18nBridge.test.ts`,
`shared/__tests__/notifications.test.ts`. A stopped step runs
`git checkout -- <each file>` and deletes no file; both steps edit only
existing files.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller`
grilled this draft against the lane worktree. Delivery: the lead dispatches
`athan-executor` per the weights above and three `athan-reviewer` passes
(plan-conformance, blind, and a threading-and-lifecycle blind pass for the
notification surface). Every worker may call `vision` for an image it cannot
see. Nothing else.

## 12. Report

Plain sentences: the native-digit map died and every surface the app
composes now renders Latin digits in every language; the en reminder
notification title lost its unit letter; the translated titles, the channel
labels and the steppers' words kept their bytes; the iOS widget countdown
stays system-formatted on row 69's ground. The progress table and the
four-line handoff close the run.
