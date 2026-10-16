# 108: the Rubik cascade - the sheets' pulls, the label gap, the footer clip

| Field | Value |
| --- | --- |
| Brief | The Rubik cascade: the sheets' pulls, the label gap, the footer clip |
| Planned at | `1f534a97` (2.0.824), 2026-10-16 |
| Planned by | The planning phase, this session (the interview waived by the owner's order 2026-10-16: work autonomously, ask nothing; her rulings read from the ticket text) |
| Needs first | nothing |
| Parent | nothing |
| Group | none: `Header.tsx`, `Qibla.tsx`, `Sound.tsx`, `Day.tsx`, `VolumeNote.tsx` and their tests are shared with no open ticket |
| Batch budget | 2 |
| Session budget | 8 |
| Steps | 3 (all code, weight 2 each) |
| Device | none in-plan: JS styling only; the owner's XS read under ar is the visual acceptance, batched at delivery |
| Owner decisions still needed | none: D108.1 to D108.5 taken, section 2.1; the rides from row 104's audit stay pending her call, out of scope by the ticket's own words |

## 1. Goal

Rubik replaced Noto as the Arabic face at 2.0.811 (row 106). The owner's pass-two read on that
build found four cascades the Noto-tuned surfaces carry, plus row 106's own follow-up. (1) The
sheets' -10 subtitle pull-ups (row 87's pattern, tuned against Noto's 2.112em box) now MERGE the
subtitle into the title on the settings, alert and sound sheets under Rubik's 1.185em box. (2)
The qibla sheet carries the same pull-up copy and joins the sweep. (3) The sound sheet's
notification-sound label sits too close to the first list row under ar. (4) The volume footnote
clips Arabic descenders at its bottom under Rubik. (5) The location-date gap under Rubik is
nearly perfect and wants a small dialled gap.

When DONE: under ar every sheet subtitle sits a small positive gap under its title with the -10
pulls gone; the qibla sheet matches; the sound list sits clear of its label; the location-date
gap reads one step wider; the footnote's descenders render whole. Under en and the other four
locales every touched surface renders byte-identically to 2.0.824. The owner notices on her
read.

Owner rules that apply, quoted from their source:

- Her ruling, ticket 108 item 1: "REVERT the negative pulls to the normal line height and give
  a small gap instead, the same treatment as the location-date dial."
- Her ruling, ticket 108 item 3: "push the list down for a gap" (the sound label).
- Her ruling, ticket 108 item 4: "planning measures why the shorter box clips there" (the
  footnote).
- `ai/AGENTS.md`: "Visuals are settled. Fixes change behaviour only. Touch no pixel without
  the owner's say." Every change here is her say, item by item; nothing else moves.
- Row 106's warning, hers: no line-height pin that clips. The footnote's script line box ADDS
  room; it never cuts.
- Row 102 item 6, her scalability law: no per-language spacing values where one value serves.
  The sound label gap joins en at one value; the values her 87/106 pattern already keys per
  locale (the subtitle gap, the date gap) keep the compactArabic key.

## 2. Decisions

### 2.1 Taken

- D108.1 (owner, ticket 108 item 1, 2026-10-16): the subtitle pull-ups die. `Header.tsx`
  subtitle `marginTop: compactArabic ? -10 : SPACING.xs` becomes `compactArabic ? SPACING.py :
  SPACING.xs` (ar +6, en 4 unchanged); the title's `marginBottom: compactArabic ? 0 :
  SPACING.xxs` keeps its ar 0, the small gap riding the subtitle's own margin exactly as the
  location-date dial rides the first line's. 6 is a recorded default; her read dials.
- D108.2 (owner, ticket 108 item 2): the qibla sheet joins through its own subtitle style
  (`Qibla.tsx` `marginTop: compactArabic ? -10 : SPACING.xs` to `compactArabic ? SPACING.py :
  SPACING.xs`), one value, matching the shared header.
- D108.3 (owner, ticket 108 item 3): the sound sheet's list gap: `Sound.tsx`
  `marginTop: compactArabic ? 6 : SPACING.md` becomes `SPACING.md` plain - the compactArabic
  branch dies at the site, ar joins en at 12, and the D94 Noto tightening is dead ground.
- D108.4 (owner, ticket 108 preamble plus row 106's follow-up): the location-date dial:
  `Day.tsx` location `marginBottom: compactArabic ? SPACING.py : SPACING.quart` becomes
  `compactArabic ? SPACING.sm : SPACING.quart` (ar 6 to 8, en 5 unchanged).
- D108.5 (owner, ticket 108 item 4; the measurement is the planner's): the footnote's
  descender room. Measured from the bundled TTFs' own tables: Rubik-Regular carries hhea ascent
  935, descent -250, lineGap 0 (a 1.185em line box with 0.250em of descent) against OS/2
  usWinDescent 466 (0.466em of ink below the baseline): at the note's 14 points the ink
  descends 6.5px while the box reserves 3.5px, 3.0px of ink outside the box, which the shorter
  box cuts where Noto's 2.112em box buried it in leading. Roboto-Regular's own excess at the
  same size is 0.08px, which is why the en note never clipped. The fix is the record's script
  line box, the treatment that already carries the Help questions (23 at 15) and the overlay
  explanation (24 at 16), both owner-confirmed whole: the note's text takes `lineHeight:
  ty.scriptLineHeight?.(TEXT.sizeDetail)` - ar 21, en undefined (no key, byte-identical).

The interview was waived by the owner's order 2026-10-16 ("don't talk to me, don't ask me any
questions... work autonomously"). Every ruling above is her ticket text; every value she did
not pin is a recorded default under her read, the row-106 pattern.

### 2.2 The executor must not decide

- Any value not named above. A read that wants a different number is a STOP: the question is
  "D108.<n> pins <value>; the read wants <observed>; dial it or keep it?", asked by the lead at
  the owner's next moment, never by the executor.
- Any surface not named above. A cascade the executor finds on another sheet is a STOP with
  the file, the line and the reading.
- The rides from row 104's audit (the backgrounding park window, the second-dismiss race, the
  shared-deferral refactor) stay out: the ticket carries them as "her call pending" and no call
  has come.

## 3. Pre-flight

`scripts/preflight-108.sh` is committed in this folder. The executor saves a copy to `$TMPDIR`
and runs it with the repository root as the working directory
(`bash $TMPDIR/preflight-108.sh`). It checks the checkout on `uat`, a clean tree, `origin/uat`
merged in, the version at or above 2.0.826, "Needs first" being nothing, and every anchor
counting exactly 1. It ends `PREFLIGHT OK`; any other output is a STOP. Pre-flight runs once,
in the first executor session before step 1; a resumed session runs only its own steps' anchor
checks, because the earlier steps' merges zero those anchors by design.

## 4. Background the executor needs

The code map, one line per file (anchors under `scripts/anchors/`):

- `components/sheets/parts/Header.tsx` - the shared sheet header every sheet but qibla renders
  (`Sheet.tsx:235`); the title's ar marginBottom 0 and the subtitle's ar marginTop -10 are
  row 87's pull-up pair (anchor: `header-subtitle`).
- `components/sheets/screens/Qibla.tsx` - the qibla sheet's own subtitle node (a cross-fade
  pair with a width donor); its style copies the shared header's pull-up (anchor:
  `qibla-subtitle`).
- `components/sheets/screens/Sound.tsx` - the sound sheet; the list container's ar marginTop 6
  is D94's Noto tightening (anchor: `sound-list-gap`).
- `components/day/Day.tsx` - the location and date lines above both schedules; the location
  line's ar marginBottom is row 106's dial (anchor: `day-dial`).
- `components/sheets/parts/VolumeNote.tsx` - the footnote both sheets close on; the text style
  carries no lineHeight today (anchor: `note-text`).
- `shared/typography.ts` - the per-locale record; `ARABIC.scriptLineHeight` is the script line
  box the note joins (anchor: `script-line-height`).
- `components/__tests__/typographySweep.test.tsx` - the sweep guard; its qibla, sound and
  header-box describes pin today's values (anchors: `sweep-qibla`, `sweep-sound-hint`,
  `sweep-header-boxes`).
- `components/day/__tests__/DayLines.test.tsx` - the Day block's pins (anchor: `daylines-gap`).
- `components/sheets/parts/__tests__/VolumeNote.test.tsx` - the note's suite; the style
  describe pins the en face and centring (anchor: `volume-note-style`).

How the pieces interact: every style object resolves once at module scope through
`typographyFor(currentLocaleId())`. The ar branches run only when the module evaluates under
ar, so the ar-side tests load each module inside the locale: the sweep's `isolateModulesAsync`
pattern, and DayLines' shared-React isolate (Day imports reanimated). The language sheet passes
`subtitle={null}` (`Language.tsx:63`), so nothing reaches it.

The existing tests and what each proves: the sweep's header-box describe proves no lineHeight
pin sits on the header (row 87's law); its qibla describe pins -10 under ar and 4 under en; its
sound describe pins 6/12 and the note gap 32/24 (the note gap is untouched); DayLines pins the
location-date gap 6 under ar and 5 under en; the VolumeNote suite pins the en face, colour,
size, centring and the foot row.

Why the obvious fix is wrong: a bigger negative pull re-creates row 87's clipping under a
tighter box; a lineHeight pin on the header lines breaks row 87's own law (the font's own box
serves the header); paddingBottom on the note moves the box, not the ink room inside each line
- the script line box is the idiom Help and Explanation already owner-confirmed.

## 5. Design

The approach: four style values and one line-box key. Each sits behind the compactArabic key
her pattern already carries, except the sound list gap, where one value now serves both
locales and the branch dies. The invariant as one sentence a test can check: under ar the
sheet subtitles seat +6 under their titles, the sound list +12 under its label, the location
line +8 above the date, and the note's copy carries a 21 point line box; under en every one of
these styles is byte-identical to 2.0.824.

Alternatives rejected: a shared constant for the subtitle gap (the six literal sites are the
guard the break scripts ride, row 81's audit answer); a lineHeight on the header (row 87's
law); touching the note's marginTop pair 32/24 (her report names the clip, not the gap).

The concurrency trace: none. Module-scope style constants resolved once per locale; no store,
no scheduler, no listener.

The design review: every value is her ruling or a recorded default one step from today's; en
byte-identity is guarded by the en-side pins on every touched style; each ar branch is
exercised by an ar-side test that exists or lands red first.

**Acceptance criteria:**

- [x] [R1.1] WHEN a sheet header renders under ar THE SYSTEM SHALL seat the subtitle 6 points
  under the title by a positive margin with no lineHeight key on either line.
- [x] [R1.2] WHEN the qibla sheet's subtitle renders under ar THE SYSTEM SHALL seat it 6 points
  under the title, matching the shared header.
- [x] [R1.3] WHEN a sheet header renders under en THE SYSTEM SHALL keep the title's 2 point bottom
  margin, the subtitle's 4 point top margin and no lineHeight key, byte-identical to 2.0.824.
- [x] [R2.1] WHEN the sound sheet renders under ar THE SYSTEM SHALL seat the list 12 points under
  the notification-sound label, with no locale branch left in the style.
- [x] [R2.2] WHEN a schedule renders under ar THE SYSTEM SHALL dial the location line's bottom
  margin to 8 points.
- [R3.1] WHEN the volume note renders under ar THE SYSTEM SHALL carry a 21 point lineHeight on
  its copy so the measured 3.0px of win-descent ink renders whole.
- [R3.2] WHEN the volume note renders under en THE SYSTEM SHALL leave the copy's line box to
  the font's own metrics with no lineHeight key.

## 6. Steps

Checklist:

1. Step 1 - the subtitle pull-ups revert (`Header.tsx`, `Qibla.tsx`, the sweep) - branch
   `feat/108-subtitle-pulls` - `steps/1-subtitle-pull-revert.md`.
2. Step 2 - the sound label gap and the location-date dial (`Sound.tsx`, `Day.tsx`, the sweep,
   DayLines) - branch `feat/108-gap-dials` - `steps/2-label-gap-and-day-dial.md`.
3. Step 3 - the footnote's script line box (`VolumeNote.tsx`, its suite) - branch
   `feat/108-note-box` - `steps/3-note-descender-room.md`.

Each step subsection lives in its own file under `steps/`, opening with its `Requirements:` and
`Weight:` lines, and carries the anchor check, goal, branch, files, red tests, change
contracts, green run, break script, version and commit, review checklist, merge and done-when.

## 7. Device proof

None in-plan. The changes are JS styling; the pinned suites are the whole proof this plan
runs. The owner's XS read under ar (the sheets' headers, the sound label, the schedule header,
the footnote) is the visual acceptance, batched at delivery; the lead leaves the XS on the
latest dev build with Metro serving.

## 8. Records

Every step entry in `LOG.md` opens `### Step <NN> — <state>` and ends `session: <ses_id>`. The
queue cell the lead applies on DONE is written by the audit. The docs commit message for the
READY commit: `<VERSION> - docs(plans): row 108 READY - the Rubik cascade plan (3 steps: the
subtitle pull revert, the gap dials, the note's script line box)`.

## 9. Push

None.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| A red test stays red after the change | Read the failure line. A value mismatch means the pin and the code disagree; fix the one the decision names, never both. |
| The sweep fails on a describe this plan does not touch | Run the named suite alone, then `yarn validate`. A failure that is not this plan's value is a STOP with the output. |
| The coverage gate refuses a step | An ar branch of a touched style lacks an ar-side evaluation. Add the evaluation to the step's test; never delete a gate. |
| A pre-flight anchor count is not 1 | The source drifted from `1f534a97`. Re-verify the anchor against the file; a code drift is a STOP. |

Anticipated review fixes, word for word:

- "The Header.tsx comment above the styles still explains the pull-up: rewrite it to name the
  6 point gap under Rubik and row 108."
- "The Qibla.tsx comment at the subtitle names the pull-up: rewrite it to name the match."
- "The Sound.tsx D94 comment is not the pinned sentence: make it exactly `// D94: the ar note
  copy clears the list (the preview animation) above it`."
- "The VolumeNote.tsx comment still says pair: drop the word, its sibling half is gone."

Restore lists: step 1 `git checkout uat -- components/sheets/parts/Header.tsx
components/sheets/screens/Qibla.tsx components/__tests__/typographySweep.test.tsx`; step 2
`git checkout uat -- components/sheets/screens/Sound.tsx components/day/Day.tsx
components/__tests__/typographySweep.test.tsx components/day/__tests__/DayLines.test.tsx`;
step 3 `git checkout uat -- components/sheets/parts/VolumeNote.tsx
components/sheets/parts/__tests__/VolumeNote.test.tsx`.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller` grills the draft.
Delivery: the lead dispatches the `athan-executor` and `athan-reviewer` workers. Every worker
may call `vision` for an image it cannot see. Nothing else, ever.

## 12. Report to the owner

Plain sentences: the pull-ups reverted to a 6 point gap on every sheet including qibla, the
sound list clear of its label at one value with en, the location-date gap one step wider, the
footnote's descenders whole on a measured 21 point script box; en byte-identical throughout;
the values she did not pin are recorded defaults her read dials. Then the progress table and
the four-line handoff.
