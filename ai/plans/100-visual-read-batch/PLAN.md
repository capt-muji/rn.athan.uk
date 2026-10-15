# Ticket 100: the owner's visual read batch, eight fixes in one lane

| | |
| --- | --- |
| Brief | Row 100 in `ai/plans/README.md` (her consolidation order 2026-10-15; rows 92 to 99 folded) |
| Planned at | `f9af66c2` (2.0.751, the lane's anchor commit on `lane/100`), 2026-10-15 |
| Planned by | The lead, planning phase (the owner interview is waived: the row quotes her eight rulings verbatim) |
| Needs first | nothing |
| Parent | nothing |
| Group | the batch's components and catalogs (`components/`, `shared/i18n/`, `shared/time.ts`, `assets/icons/svg/`); disjoint from ticket 91's background-task ground |
| Batch budget | 6 weight units |
| Session budget | 10 weight units |
| Steps count | 8 code steps, no device step |
| Device | None. Her dev-build read after the merge is the visual acceptance for every item |
| Owner decisions still needed | none interactive; the recorded defaults D93 to D98 below are read at her next dev-build pass |

## Lane regime (read before any step)

This ticket runs inside the lane worktree `$HOME/athan-gitree/lanes/100`, not the main
checkout. The lane rules override the repo defaults everywhere they conflict:

- The integration branch is `lane/100`. Every step branches off `lane/100` and merges
  `--no-ff` back into `lane/100`. Never touch `uat`, never touch the main checkout at
  `$HOME/repos/rn.athan.uk`, never run Metro there.
- `node_modules` is a symlink to the main checkout's. Never run `yarn install` or any
  install command in the lane. If `npx tsc --noEmit` fails on
  `expo-background-task`, `expo-location` or `expo-widgets` types, report `BLOCKED:
  patches lost from the shared node_modules`; the lead restores them from the main
  checkout root with `npx patch-package` (node_modules only, no git state).
- The pre-commit hook runs in the lane (`core.hooksPath` is the relative `.husky/_`).
  If a commit ever runs without the hook's four gates, stop and report; do not
  reproduce the gates by hand and do not use `--no-verify`.
- The version bumps `app.json` and `package.json` together each commit. The third
  version file `android/app/build.gradle` is gitignored and absent in the lane; the
  lockstep test skips its assertion when the file is absent, so no step creates it.
- The version lock protocol is unchanged: `mkdir $HOME/athan-gitree/version.lock`
  wins for one session only, retry in a short sleep loop while it exists, `rmdir`
  after the merge.

## 1. Goal

Her 2026-10-15 XS read found eight visual defects. This ticket lands all eight in one
lane so the dev build she reads afterwards carries the whole set. What is wrong today
and what is true when DONE, item by item:

1. The ago badge under ar renders the digit-letter run reordered (`2h 35m` reads with
   the groups swapped). DONE: the run reads `2h 35m` left to right inside the Arabic
   line, and the letters are plain lowercase h m at the digits' own font size, colour
   and face, like the design many versions ago, not the timer's small faint letters.
2. The countdown's lowercase h m s at 55 percent read super small. DONE: the letters
   are capitals H M S slightly larger than 55 percent, everything else from row 85
   standing.
3. The volume note's glyph is a bare letter i and the ar iOS copy renders Help-page
   guillemets and a forward slash. DONE: a proper circled i glyph, and plain
   localized ar copy.
4. The qibla sheet's title-to-subtitle gap is far larger than the settings, alert and
   sound sheets she confirmed perfectly spaced. DONE: it matches them under ar.
5. The sound sheet under ar crowds its preview block: the pair above the list sits too
   far apart and the note's Arabic text below the list sits too close to it. DONE:
   the upper pair tightens and the note clears the list.
6. Help questions under ar sit above their row's vertical centre and clip dots and
   descenders, open rows included. DONE: the question centres in its row with its
   glyphs whole.
7. The date and Hijri labels under ar carry the Latin comma. DONE: the Arabic comma
   carries the sentence while the digits stay Latin.
8. The location and date lines on both schedule pages sit too far apart. DONE: the
   pair tightens under ar.

The owner's rules that apply, from `ai/AGENTS.md` and the row: visuals are settled,
fixes change behaviour only, every value is either ruled in the row, a recorded
default she reads, or a stop; tests never read the real clock; red before green with
100 percent coverage of what changed; version bump on every commit with `app.json`
first; her dev-build read is the acceptance, jest and review prove the landing.

## 2. Decisions

### 2.1 Taken (the owner, 2026-10-15, recorded in row 100 and rows 92 to 99 at `b0494991`)

- Item 1: the badge's h and m are plain lowercase English letters at the digits' own
  font size, colour and face, the same everything as the digits; row 83's zero-drop
  format and fixed never-localising letters stand.
- Item 2: her option A, capitals, made slightly larger than 55 percent; the ink, the
  baseline, the gap span and everything else from row 85 stand.
- Item 3: a proper circled i glyph; the ar iOS path copy is plain localized text, no
  glyph path, no stray slash; row 64's wording the base, row 89's placement, centring
  and padding standing.
- Item 4: the compass sheet's gap matches the sheets she confirmed.
- Item 5: tighten the pair above the animation, open the space and push the Arabic
  text below the animation down off it.
- Item 6: the questions vertically centre in their rows under ar, the answers are fine.
- Item 7: the separator belongs to the sentence, not the number; digits stay Latin
  per row 88.
- Item 8: tighten the location-to-date pair, no clipping remains.

### 2.2 Recorded defaults (the lead's pins, D93 to D98; her next dev-build read is the acceptance)

- **D93** Item 2's ratio: capitals at `Math.round(ty.countdownSize * 0.6)`. Her words
  were "slightly, slightly larger" than 55; 60 is the smallest step that reads clearly
  larger with capitals' taller caps. En letters go 14 to 16 points, ar 13 to 14.
- **D94** Item 5's mapping and values. The sound sheet's stack under ar, top to
  bottom: the card hint (dim) above the list, the list whose playing row is white and
  carries the ticking preview countdown (the animation), and the volume note's Arabic
  text below the list. "The white line and the dim line above it" is the playing row
  and the card hint; their gap is `listContainer.marginTop`, 12 under ar today,
  pinned to 6. "The Arabic text below the animation" is the note copy; its gap is
  `VolumeNote`'s `foot.marginTop`, 24 today, pinned to 32 under ar. Rejected
  readings: the shared sheet header's title and subtitle (the same component renders
  settings, alert and sound, which she confirmed perfectly spaced in the same read,
  so their geometry cannot be the defect); the rows inside the list (the list gap is
  one uniform value and cannot sit too far apart above the playing row while too
  close below it); the reminder card on the alert sheet (not the surface her words
  name).
- **D95** Item 8's value: `location.marginBottom` under ar goes from 5 (`SPACING.quart`)
  to 2 (`SPACING.xxs`).
- **D96** Item 6's mechanism: the Help question's line box under ar takes the script
  line height `ty.scriptLineHeight?.(15) ?? ty.lineHeight(20)`, 23 points at the
  15 point question size, following `components/prayer/Explanation.tsx:152` (row 87's
  law: the Arabic font's own box serves, a pinned smaller box clips).
- **D97** Item 3's ar copy: `'يعمل بصوت الرنين والتنبيهات. الوضع الصامت وأوضاع التركيز تكتمه.'`
  (row 64's two-sentence base, the guillemets and the slash removed, the Ringer and
  Alerts path and the muting causes kept).
- **D98** Item 1's mechanism: `formatTimeAgo` composes its lettered duration inside
  Unicode left-to-right isolates (U+2066 before, U+2069 after). The countdown timer
  row pins its run with `direction: 'ltr'` on a View; the badge's run is inline text
  inside one sentence, where a View cannot go, and the isolate pair is the same pin
  at the text level: under the RTL base direction the space between `2h` and `35m`
  resolves RTL and swaps the groups (the defect she read), and the isolate wraps the
  whole run so it composes as one left-to-right island inside the Arabic sentence.
  The marks are zero-width in every locale and one code path serves all six.

### 2.3 The executor must not decide

- Any visual value beyond D93 to D98 and the row's rulings. A test that forces a
  different value is a `STOP:` naming the test and the pinned value.
- Any surface beyond the eight items', even a near-identical defect beside a ruled
  one. It opens its own row; the plan does not widen.
- The glyph drawing beyond the asset contract in step 3 (a circle plus the i, both
  `currentColor`, inside the existing viewBox).
- Anything about `qiblaPlace.ts:46`: its comma was examined and excluded because the
  place name is device-keyed static copy (D44/D79), not an app-locale sentence.

## 3. Pre-flight

`scripts/preflight-100.sh` in this folder. The executor saves a copy to `$TMPDIR`,
runs it with `bash` from the lane root, and expects the last line `PREFLIGHT OK`. It
checks: the lane branch, a clean tree, `origin` fetched, the version at or above the
planned 2.0.751, and every anchor counting exactly 1 at the planned sha.

## 4. Background the executor needs

The code map. Every file read or changed, one line each:

- `shared/time.ts` — the ago composer `formatTimeAgo` (changed, step 1), the date and
  Hijri composers `formatDateLocalized` and `formatHijriDateLocalized` (changed, step
  7), and `splitAgoDuration` with `AgoLetterGroup` (deleted, step 1; only `Ago.tsx`
  and the test import them, verified at the planned sha).
- `components/prayer/Ago.tsx` — the badge (changed, step 1: one plain sentence, the
  split rendering and its `gap` and `unitLetter` styles deleted).
- `components/countdown/Countdown.tsx` — the timer (changed, step 2: `UNIT_LETTERS`
  capitals, the `unitLetter` size ratio 0.6).
- `assets/icons/svg/info.svg` — the information glyph (replaced, step 3: circled i).
- `shared/i18n/ar.ts` — the ar catalog (changed, step 3: the iOS note copy only).
- `components/sheets/screens/Qibla.tsx` — the compass sheet (changed, step 4: its own
  subtitle style takes the shared header's ar pull-up).
- `components/sheets/parts/Header.tsx` — the shared header (read only: `compactArabic`
  and the -10 pull-up are the pattern steps 4, 5, 6 and 8 copy).
- `components/sheets/screens/Sound.tsx` — the sound sheet (changed, step 5: the list's
  ar top margin).
- `components/sheets/parts/VolumeNote.tsx` — the note (changed, step 5: the foot's ar
  top margin).
- `components/modals/Help.tsx` — the Help modal (changed, step 6: the question's ar
  line box).
- `shared/i18n/locale.ts` — the locale core (changed, step 7: `sentenceComma` beside
  `directionGlyph`, keyed off the RTL set).
- `components/day/Day.tsx` — the schedule header (changed, step 8: the location
  line's ar bottom margin).

How the pieces interact: the badge composes its sentence once in
`hooks/usePrayerAgo.ts` through `t('time.ago', { name, duration })`, so the isolate
marks belong in the composer and every caller follows. The date and Hijri labels are
composed per render in `shared/time.ts` from catalog month names, so the separator
helper reads the live locale the same way `directionGlyph` does. The per-locale style
values (steps 4, 5, 6, 8) resolve at module scope through `typographyFor` and a
`compactArabic` read of `currentLocaleId()`, exactly as `Header.tsx` already does;
that is safe because every ar switch crosses the RTL boundary and the D59 relaunch
re-resolves module scope. The jest harness for per-locale style assertions is
`components/__tests__/typographySweep.test.tsx` (`jest.isolateModulesAsync` with the
locale set before the component loads); steps 4, 5 and 6 add their probes there,
and step 8 uses `DayLines.test.tsx`'s own shared-React `isolateModules` dance, which
that file already carries.

The existing tests and what each proves:

- `shared/__tests__/time.test.ts` — `formatTimeAgo` shapes and `splitAgoDuration`
  splits (step 1 rewrites the former with isolates and deletes the latter's block).
- `components/prayer/__tests__/Ago.test.tsx` — the badge's sentences, letters, gap
  spans and fade (step 1 rewrites the letter and gap cases for the plain face).
- `components/countdown/__tests__/Countdown.test.tsx` — the timer's groups, letters
  and sizes (step 2 updates letter case and `LETTER_SIZE`).
- `components/sheets/parts/__tests__/VolumeNote.test.tsx` — the note's copy, glyph
  and foot layout (step 5 adds the ar margin case; step 3's copy change only touches
  ar, which this file does not assert).
- `shared/__tests__/i18n.test.ts` — pins the en note copy only, unaffected.
- `shared/__tests__/dateLocalized.test.ts` — the date and Hijri compositions (step 7
  adds the ar comma cases).
- `shared/__tests__/locale.test.ts` — the locale core (step 7 adds `sentenceComma`).
- `components/sheets/screens/__tests__/Qibla.test.tsx` — the compass sheet (read
  only: step 4 leaves its content assertions untouched).
- `components/__tests__/typographySweep.test.tsx` — the per-locale style sweep
  (steps 4, 5 and 6 add probes).
- `components/day/__tests__/DayLines.test.tsx` — the schedule header lines (step 8
  adds the ar gap probe).

Why the obvious fix is wrong, per item: item 1 cannot copy the timer row's View pin
because the badge is one text run (D98); item 2 cannot raise the ink or reshape the
gap span (row 85 stands); item 3 cannot redraw the glyph per sheet (one asset serves
`VolumeNote` and the Settings What's New row, and the circled i is the correct
information glyph at both); item 4 cannot restyle the shared header (it already
matches; the qibla sheet's own subtitle bypasses it because `Header` renders a node
subtitle raw); item 6 cannot centre with a transform (the clip is the line box, and
the taller ar box centres the row's content by construction).

## 5. Design

The approach: eight independent styling and composition fixes, one step each, every
en-language byte outside the ruled faces identical (the isolate marks are zero-width
and invisible). The invariant: `WHEN any step's surfaces render under en THE SYSTEM
SHALL keep every style value and composed string byte it had at the planned sha,
apart from the faces the row rules (the capital letters, the circled glyph) and the
zero-width isolate marks.`

Alternatives rejected: a locale-keyed stylesheet abstraction for the four ar-only
margins (four isolated values do not earn a new pattern; `compactArabic` inline is
the established idiom); moving the ar-only values into the typography record (the
record carries type metrics, not layout margins); fixing item 1 inside `Ago.tsx` at
render time by re-splitting the sentence (the composer owns the run's bytes and the
splitter dies, which is the point).

The concurrency trace: none. No timer, subscription, worklet or store write changes.
`Ago.tsx` and `Countdown.tsx` keep their Reanimated derived styles untouched; only
their static children and StyleSheet values change, so the first-frame-settled rule
holds with no new work.

The design review: every change is ar-keyed or universal-by-ruling, each step's diff
is one surface, and each red test names its pinned value so her read can veto any
single number without reopening the others.

**Acceptance criteria:**

- [R1.1] WHEN the ago badge renders under ar with a lettered duration THE SYSTEM SHALL compose the duration inside Unicode left-to-right isolates so the digits and letters read `2h 35m` left to right inside the Arabic sentence.
- [R1.2] WHEN the ago badge renders its letters THE SYSTEM SHALL draw lowercase h m inheriting the badge text's own font size, colour and face with no gap span and no separate letter style.
- [R1.3] WHEN the ago badge renders the now sentence THE SYSTEM SHALL render the catalog sentence unchanged with no isolates.
- [R1.4] WHEN the ago sentence carries a single-group duration THE SYSTEM SHALL compose the isolate pair around that group exactly as around a two-group duration.
- [R2.1] WHEN the countdown timer renders its unit letters THE SYSTEM SHALL draw capitals H M S at 60 percent of the timer's digit size with row 85's ink, baseline and gap span unchanged.
- [R3.1] WHEN the information glyph is drawn THE SYSTEM SHALL draw a circle and the letter i from one asset in `currentColor` inside the existing square viewBox.
- [R3.2] WHEN the volume note renders under ar on iOS THE SYSTEM SHALL draw plain localized copy carrying no guillemet and no forward slash.
- [R4.1] WHEN the qibla sheet header renders under ar THE SYSTEM SHALL pull its subtitle up 10 points to match the shared header's confirmed gap.
- [R5.1] WHEN the sound sheet renders under ar THE SYSTEM SHALL set the card hint to list gap at 6 points.
- [R5.2] WHEN the sound sheet renders under ar THE SYSTEM SHALL set the note's gap under the list at 32 points.
- [R6.1] WHEN a Help question renders under ar THE SYSTEM SHALL give it the Arabic script line box (23 points at the 15 point size) so dots and descenders render and the text centres in its row.
- [R7.1] WHEN the Gregorian date label composes under ar THE SYSTEM SHALL join its parts with the Arabic comma U+060C.
- [R7.2] WHEN the Hijri label composes under ar THE SYSTEM SHALL join day and year with the Arabic comma U+060C.
- [R7.3] WHEN the date and Hijri labels compose under any locale outside the RTL set THE SYSTEM SHALL keep the Latin comma with byte-identical output to the planned sha.
- [R8.1] WHEN a schedule header renders under ar THE SYSTEM SHALL set the location-to-date gap at 2 points.
- [R9.1] WHEN any changed surface renders under en THE SYSTEM SHALL keep every style value identical to the planned sha apart from the ruled faces (capitals, circled glyph) and the zero-width isolate marks.

## 6. Steps

Checklist (all weight 2, code):

- [x] Step 1 — the ago badge: plain letters, LTR isolates (`steps/01-ago-plain-letters.md`)
- [x] Step 2 — countdown capitals at 60 percent (`steps/02-countdown-capitals.md`)
- [x] Step 3 — the circled i and the plain ar note copy (`steps/03-note-glyph-copy.md`)
- [x] Step 4 — the qibla header's ar gap (`steps/04-qibla-header-gap.md`)
- [x] Step 5 — the sound sheet's ar spacing pair (`steps/05-sound-preview-spacing.md`)
- [ ] Step 6 — the Help question's ar line box (`steps/06-help-question-centre.md`)
- [ ] Step 7 — the Arabic comma in the date labels (`steps/07-arabic-comma.md`)
- [ ] Step 8 — the schedule header's ar tighten (`steps/08-schedule-header-tighten.md`)
- [ ] Finishing — the executed docs commit on the lane (in this file, below)

Each step file carries its own anchor check, goal, branch, files, red tests, change
contracts, green run, break script, version and commit, review checklist, merge and
done-when. The batch budget is 6: the lead packs steps 1 to 3, then 4 to 6, then 7
and 8 with Finishing.

Finishing: apply section 8's records text into `LOG.md`, set the ticket EXECUTED in
`ai/plans/README.md`, make the executed docs commit (branch
`docs/executed-100-<date>` off `lane/100`, version bumped, plan files and queue added
by name, message `<VERSION> - docs(plans): ticket 100 executed: the owner's visual read batch, eight fixes landed`), merge `--no-ff` into `lane/100`, do not push.

## 7. Device proof

None. No device step exists in this plan. The owner's dev-build read after the merge
is the visual acceptance for every item; jest and review prove the landing.

## 8. Records

The findings text the executor appends to `LOG.md` under
`## Ticket 100 executed (<date>)`:

```
Eight items landed on lane/100 through <last version>: the ago badge renders 2h 35m
left to right inside the Arabic sentence with plain full-size lowercase letters
(isolates in the composer, the splitter deleted); the countdown letters are capitals
at 60 percent with row 85's ink and gap; the note carries a circled i glyph and plain
ar iOS copy; the qibla header matches the confirmed sheets under ar; the sound sheet
tightens its hint-to-list pair to 6 and opens the note's gap to 32 under ar; the Help
questions take the ar script line box and centre; the date and Hijri labels carry the
Arabic comma under ar with Latin digits; the schedule header's location-to-date gap
is 2 under ar. No device step; her dev-build read is the acceptance.
```

The queue cell text the lead applies on DONE:

```
DONE 2026-10-15, audited: the eight visual fixes landed - the ago badge's lettered
run isolated LTR inside the Arabic sentence with plain full-size letters, the
countdown's capitals at 60 percent (D93), the circled i glyph and plain ar note copy,
the qibla header's ar gap matching the confirmed sheets, the sound sheet's ar pair at
6 and 32 (D94), the Help question's ar line box at 23 (D96), the Arabic comma in the
date and Hijri labels, and the schedule header's ar gap at 2 (D95). Her dev-build
read after the merge is the visual acceptance for every item; no device step ran
```

The docs commit message: `<VERSION> - docs(plans): ticket 100 executed: the owner's visual read batch, eight fixes landed`.

## LOG.md ledger contract

Every step entry in `LOG.md` opens with `### Step <NN> — <state>` and ends with a
line `session: <ses_id>`. Planning sections use `## Planning (<date>)` and
`## Ticket <N>`.

## 9. Push

None. The executor never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | What it means | Action |
| --- | --- | --- |
| `npx tsc --noEmit` fails on expo-background-task, expo-location or expo-widgets types | the shared node_modules lost its patch-package patches | Return `BLOCKED: patches lost from the shared node_modules`; the lead restores them from the main checkout root |
| A commit runs without the hook's four gates printing | the lane's hook wiring broke | Stop, report, never `--no-verify`, never hand-run the gates |
| A red test passes before the change | the plan's expectation is wrong for the code | `STOP:` naming the test and the anchor |
| `git status --porcelain` lists files outside the step's list and the plan files | stray work | Restore per the step's restore list before continuing |
| A merge into `lane/100` conflicts | two steps touched one file | `git merge --abort`, then `STOP:`; the steps are disjoint by design so a conflict means a defect |
| `check-changed-coverage.js --staged` reports under 100 on any measure | a changed line lacks cover | Add the missing case in the step's own tests, never an ignore |

Anticipated review fixes, word for word:

- Step 1: "the docblock on `formatTimeAgo` still says the letters ride the digits'
  baseline" — rewrite it to name the isolates and the plain face.
- Step 3: "the `svg:info` testID assertion in `VolumeNote.test.tsx` is the only glyph
  check and would pass on any asset" — keep it, the asset's own test in step 3
  carries the circle assertion.
- Step 5: "`VolumeNote` reads `compactArabic` but the file has no locale import" —
  it has one (`currentLocaleId` at line 6 for the typography); reject.
- Step 7: "`sentenceComma` is exported but only `time.ts` calls it" — that is the
  seam's shape (`directionGlyph` has the same), not dead code; reject.

Per-step restore lists sit in each step file.

## 11. Subagents

Planning: the `athan-plan-griller` grilled this draft against the lane. Delivery: the
lead dispatches `athan-executor` for the step batches and `athan-reviewer` twice
(plan-conformance and blind). A threading-lifecycle third pass does not run: the plan
touches styling and composition only, no animated or stateful surface beyond
styling. Every worker may call `vision` for an image it cannot see.

## 12. Report to the owner

Plain sentences: the eight fixes landed on the lane and merged; jest suites and the
hook's `Tests:` line prove the landing; the recorded defaults D93 to D98 (the capital
ratio 0.60, the sound sheet's 6 and 32, the header gap 2, the Help line box 23, the
ar note copy) are the numbers her next dev-build read accepts or vetoes, one row per
veto. Then the progress table and the four-line handoff.
