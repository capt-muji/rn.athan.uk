# LOG

## Planning (2026-10-16)

## Ticket 108

Frontier taken from the ticket text; the interview waived by the owner's order 2026-10-16
("don't talk to me, don't ask me any questions... work autonomously"). Her rulings are the
ticket's own words:

- D108.1 the sheets' subtitle pull-ups revert to a small positive gap (SPACING.py, 6) under
  ar, the title's own box serving both lines; the gap rides the subtitle's margin, the
  location-date dial's shape. En byte-identical.
- D108.2 the qibla sheet's own subtitle style mirrors the shared header's change.
- D108.3 the sound sheet's list joins en at SPACING.md (12); the compactArabic branch and D94's
  Noto tightening die at the site.
- D108.4 the location-date dial opens one step: SPACING.py (6) to SPACING.sm (8) under ar.
- D108.5 the footnote takes the record's script line box (21 at the note's 14) so the measured
  win-descent ink renders; en keeps the font's own box.

Planner measurements (from the bundled TTFs' own tables, 2026-10-16):

- Rubik-Regular: upm 1000; hhea ascent 935, descent -250, lineGap 0 (1.185em box, 0.250em
  descent); OS/2 usWinDescent 466 (0.466em ink). At 14px: box descent 3.5px, ink descent
  6.5px, 3.0px outside the box. That outside ink is the clip her read saw: Noto's 2.112em box
  buried it in leading, Rubik's tight box cuts it.
- Roboto-Regular: upm 2048; hhea ascent 1900, descent -500 (1.172em box, 0.244em descent);
  usWinDescent 512 (0.250em ink). At 14px the excess is 0.08px: no clip under en, ever.
- scriptLineHeight at 14 is 21 (round(14 * 1.5)), the same treatment as Help's 23 at 15 and
  the explanation's 24 at 16, both owner-confirmed whole on the same read family.

Facts verified by the planner against `1f534a97`:

- All sheets except qibla render the shared Header through `Sheet.tsx:235`; the language sheet
  passes `subtitle={null}` (`Language.tsx:63`) and needs nothing.
- The sweep's note-gap pair (32/24) is D94's and untouched by this plan.
- The tests pin every value this plan moves: the sweep (qibla -10/4, sound 6/12, header boxes),
  DayLines (6/5), and the VolumeNote suite pins the en face.

Grill (one round, the hostile reading; all seven findings applied):

1. MUST the preflight floor 2.0.827 was unreachable at dispatch (uat 2.0.825 plus the READY
   bump is 2.0.826); the floor is now 2.0.826 in the script and section 3.
2. MUST step 2 left `compactArabic` (Sound.tsx:227) unused, which Biome's warning gates fail;
   the contract now kills the declaration with the branch and the break perl re-introduces a
   literal, not an identifier.
3. SHOULD the pulls break ran one case (`-t "gap under ar"`), never proving the header pin;
   the filter is gone, the whole sweep runs.
4. SHOULD step 3's isolate pattern needs `RNTL_SKIP_AUTO_CLEANUP` (the sweep sets it at its
   line 17); the prerequisite is now in the red-test contract.
5. SHOULD R1.3 named the en title's 2 point margin with no pin observing it; the header-boxes
   en case now asserts it.
6. NICE the "D94's pair:" prefix outlived its sibling; the surviving sentence is pinned
   verbatim in step 2 and the VolumeNote half is step 3's to fix.
7. NICE the preflight is once-only by construction; section 3 now says so.

The grill found seven findings, all sentence-level repairs on confirmed-correct structure, so
no second round ran (the rule's condition is permission, and nothing a second round could
change remains).

### Step 01 — done

Branch `feat/108-subtitle-pulls` off `uat` (2.0.826). Pre-flight `PREFLIGHT OK` from
`$TMPDIR/preflight-108.sh`.

Red, before any change (`npx jest components/__tests__/typographySweep.test.tsx
--watchman=false`), exactly the two rewritten ar cases and nothing else (44 passed, 46 total):

- `the qibla sheet subtitle > carries the 6 point gap under ar, matching the shared header`:
  `typographySweep.test.tsx:298:61` - `Expected: 6`, `Received: -10`
- `the sheet header line boxes > leaves the ar title and subtitle to the font own box, so no
  glyph clips`: `typographySweep.test.tsx:332:32` - `Expected: 6`, `Received: -10`

Green: the sweep 46 passed, 46 total; `yarn validate` all suites green. Hook (commit
`25bf928c`, version 2.0.827):

- `Tests:       5681 passed, 5681 total` (last Tests: line, 215/215 suites)
- Statements 100% (5356/5356), Branches 100% (2312/2312), Functions 100% (1116/1116),
  Lines 100% (4797/4797)

Break: `bash ai/plans/108-rubik-cascade/scripts/break-108.sh pulls` from the repo root - last
line `BREAK OK` (both margins reverted to -10, the whole sweep ran, exactly the two rewritten ar
cases red at the same two lines, files restored from the backups; `git status --porcelain` then
listed only this step's files and the plan files).

Review, read cold against the checklist: the only value changes are the two `-10` to
`SPACING.py` ternary branches and the test pins (the two expectations plus the plan-ordered en
`SPACING.xxs` pin and its import); both comments rewritten, no stale pull copy survives (grepped);
no pixel beyond the ruling; en branches byte-identical. No lifecycle, thread, residue or rule
exposure. Nothing to fix; section 10's anticipated comment fixes were pre-applied.

Merged: `e4c75ba8` (`2.0.827 - merge feat/108-subtitle-pulls: the sheets' subtitle gap`), uat
holds the merge; the sweep re-run on uat: 46 passed, 46 total.

session: ses_ebdd8f1e7ffegri756dWa13K04

### Step 02 — done

Branch `feat/108-gap-dials` off `uat` (e4c75ba8, 2.0.827). Anchors `sound-list-gap`, `day-dial`,
`sweep-sound-hint`, `daylines-gap` each counted 1.

Red, before any change (`npx jest components/__tests__/typographySweep.test.tsx
components/day/__tests__/DayLines.test.tsx --watchman=false`), exactly the two rewritten cases
and nothing else (47 passed, 49 total):

- `the sound sheet spacing under ar > seats the list 12 points under the label under ar, one
  value with en`: `typographySweep.test.tsx:308:46` - `Expected: 12`, `Received: 6`
- `the location and date lines > dials the location-to-date gap to 8 points under ar`:
  `DayLines.test.tsx:78:96` - `Expected: 8`, `Received: 6`

Green: both suites 49 passed, 49 total; `yarn validate` all green. Hook (commit `404e2b0c`,
version 2.0.828; the first hook run died with a turn boundary, the re-run landed the same single
commit):

- `Tests:       5681 passed, 5681 total` (215/215 suites)
- Statements 100% (5355/5355), Branches 100% (2310/2310), Functions 100% (1116/1116),
  Lines 100% (4796/4796)

Breaks, both from the repo root before the commit:

- `bash ai/plans/108-rubik-cascade/scripts/break-108.sh sound` - last line `BREAK OK` (the
  literal 6 returned, the `one value with en` case red: 1 failed, 45 skipped)
- `bash ai/plans/108-rubik-cascade/scripts/break-108.sh day` - last line `BREAK OK`
  (SPACING.py returned, the `8 points under ar` case red: 1 failed, 2 skipped)

Both restored from the backups; `git status --porcelain` then listed only this step's files and
the plan files.

Review, read cold against the checklist: two style values (`SPACING.py` to `SPACING.sm` in
Day.tsx; the Sound ternary collapsed to `SPACING.md` plain), two test expectations, one dead
branch (the `compactArabic` declaration died with its one use, `currentLocaleId` still feeds
`typographyFor`), one comment halved to the pinned sentence byte-for-byte; en branches
byte-identical; nothing else moved. No lifecycle, thread, residue or rule exposure. Nothing to
fix.

Merged: `a36594f7` (`2.0.828 - merge feat/108-gap-dials: the label gap and the date dial`), uat
holds the merge; both suites re-run on uat: 49 passed, 49 total.

session: ses_ebdd8f1e7ffegri756dWa13K04

### Step 03 — done

Branch `feat/108-note-box` off `uat` (a36594f7, 2.0.828). Anchors `note-text`,
`script-line-height`, `volume-note-style` each counted 1.

Red, before any change (`npx jest components/sheets/parts/__tests__/VolumeNote.test.tsx
--watchman=false`), exactly the one new ar case and nothing else (4 passed, 5 total):

- `the volume footnote > takes the 21 point script line box under ar, so the measured descender
  ink renders`: `VolumeNote.test.tsx:70:31` - `Expected: 21`, `Received: undefined`

(The first red run failed on a missing outer `setActiveLocale` import in the finally block, a
defect in my test edit, not the plan's; the import was added and the run repeated before any
code change.)

Green: the suite 5 passed, 5 total; `yarn validate` all green. Hook (commit `36e16535`, version
2.0.829, run in the foreground and waited out):

- `Tests:       5682 passed, 5682 total`
- Statements 100% (5355/5355), Branches 100% (2310/2310), Functions 100% (1116/1116),
  Lines 100% (4796/4796)

Break, from the repo root before the commit: `bash
ai/plans/108-rubik-cascade/scripts/break-108.sh note` - last line `BREAK OK` (the lineHeight
line deleted, the `script line box` case red: 1 failed, 4 skipped; the file restored from the
backup and `git status --porcelain` listed only this step's files and the plan files).

Review, read cold against the checklist: one style key (`lineHeight:
ty.scriptLineHeight?.(TEXT.sizeDetail)` after `fontSize`) with its one-line why comment, one
comment losing the word "pair", one new ar test on the sweep's isolate shape with the
RNTL_SKIP_AUTO_CLEANUP prerequisite, one en guard assertion; nothing else moved. En carries no
live lineHeight key. No lifecycle, thread, residue or rule exposure. Nothing to fix.

Merged: `2139d79c` (`2.0.829 - merge feat/108-note-box: the note's script line box`), uat holds
the merge; the suite re-run on uat: 5 passed, 5 total.

session: ses_ebdd8f1e7ffegri756dWa13K04

