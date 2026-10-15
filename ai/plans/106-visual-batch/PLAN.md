# 106: the Arabic location-date gap, the overlay info-box arrow, the countdown letter gap

| Field | Value |
| --- | --- |
| Brief | The Arabic location-date gap, the overlay info-box arrow, the countdown letter gap |
| Planned at | `c27e4797` (2.0.786), 2026-10-15 |
| Planned by | The planning phase, this session |
| Needs first | nothing |
| Parent | nothing |
| Group | none: `shared/typography.ts`, `Explanation.tsx`, `Countdown.tsx` and their tests are shared with no open ticket (row 103 touches `app/Navigation.tsx`; row 104 touches the sheets) |
| Batch budget | 2 |
| Session budget | 8 |
| Steps | 4 (step 1 code, weight 2; step 2 code, weight 2; step 3 code, weight 2; step 4 owner read, weight 1) |
| Device | the owner's XS read under ar and en, batched with the other lanes' owner moments; no other device step |
| Owner decisions still needed | none: D106.1 to D106.4 taken, section 2.1 |

## 1. Goal

Three ruled visual defects. (1) Under Arabic the location and date lines above the prayer list
sit a massive gap apart while English stays compact: the bundled Noto Sans Arabic face carries a
2.112em line box (measured from the bundled TTF's own tables) and the two stacked boxes bury the
lines in leading. (2) The overlay explanation's arrow is too small: it must read wider and
taller, its points further outward, sinking deeper into the prayer row. (3) The countdown
timer's h m s letters sit too far from the digits they follow. When DONE: under Arabic every
glyph renders Rubik with the gap carried by Rubik's own 1.185em box, no lineHeight pin, no
margin change, no pull of any kind; the arrow draws at the bigger geometry; each letter sits
immediately against its digits; every non-Arabic locale renders byte-identically to today. The
owner notices on her read.

Owner rules that apply, quoted from their source:

- Her item-1 ruling, 2026-10-15: "Don't do any clipping, don't do any negative pulls, any
  positive pulls, pushing all that stuff. No." The font's own box is the whole fix.
- `ai/AGENTS.md`: "Visuals are settled. Fixes change behaviour only. Touch no pixel without the
  owner's say." Every change here is her say, item by item; nothing else moves.
- Row 102 item 6, her scalability law: no per-language spacing values. This plan adds none: the
  gap heals by font metrics, not by a locale-keyed value.
- The specimen at `$HOME/athan-gitree/sessions/106/arabic-font-specimen.html` stays (her
  instruction: "dont delete the fonts yet maybe i will change it later").

## 2. Decisions

### 2.1 Taken

- D106.1 (owner, 2026-10-15, the specimen read): the Arabic face becomes RUBIK, her pick from
  the twenty-font specimen. Scope (her round-3 answer): Rubik under ar ONLY - the Arabic words,
  the Latin digits (1 2 3), the h m s letters, the row times; English and the other four
  locales keep today's faces untouched, byte-identical. The two Rubik TTFs join app.json's
  expo-font list as the ruling's bundling consequence (app.json is ask-first ground; this is
  the asked answer).
- D106.2 (owner, 2026-10-15, interview): the arrow becomes bigger with the SAME shape - base
  30 to 36, viewBox height 12 to 15, the row-band overlap 4 to 6 - the prayer card unmoved, the
  curve and fill unchanged in character. The three numbers are recorded defaults her read dials.
- D106.3 (owner, 2026-10-15, the ticket report): the countdown letter gap dies - her rule, "if
  they're 2 points away, make it 0"; each letter sits tightly against the number it follows.
  The ago badge carries no gap span (verified: `shared/time.ts` composes it as one string), so
  it needs nothing.
- D106.4 (owner, 2026-10-15, interview): acceptance is her read on the XS dev build under ar
  and en, batched with the other lanes' owner moments; a value that reads shy or greedy lands as
  one small follow-up commit with the pins re-taken.
- D106.5 (planner, from measurement): the bundled NotoSansArabic TTFs measure hhea box 2.112em;
  the Google Fonts Rubik TTFs (v31, weights 400 and 500) measure hhea box 1.185em and carry both
  the Arabic script and the Latin digits in the same file, which is what makes one family serve
  her whole ar ruling.

### 2.2 The executor must not decide

- The Rubik download URL, weights or file names differ from the contract: STOP with what was
  found; a different Rubik cut changes the measured box the ruling stands on.
- Any test outside the named files fails for a reason the plan does not name: STOP with the
  failing name and its first failing line.
- A value dial from her read: the dial lands as one follow-up commit per surface with its pins
  re-taken; the executor invents no value and leaves no TODO.

## 3. Pre-flight

`scripts/preflight-106.sh`, committed in this folder. The executor saves a copy to `$TMPDIR`
and runs it with the repository root as the working directory. It checks: the checkout is on
`uat`, the tree is clean, `origin/uat` is merged in, the version is not lower than 2.0.787,
Needs first is nothing, and all 6 anchors count exactly 1. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

The code map (anchors under `scripts/anchors/`, verbatim at `c27e4797`):

- `shared/typography.ts` (anchor `ar-record`): the ARABIC locale record. `familyRegular` and
  `familyMedium` name the bundled Noto faces; `familyDigits` is `TEXT.family.medium` (Roboto
  Medium) and `familyRowTime` is `TEXT.family.regular` (Roboto) - under ar today the digits,
  letters and row times render Roboto while the words render Noto. Her ruling moves all four to
  Rubik. `scriptLineHeight` (n * 1.5) stays untouched: it serves settled word surfaces (Help,
  explanations) and this ticket's item is the Day gap alone.
- `app.json` (the expo-font plugin, lines 83-89): the four bundled TTFs are registered here;
  the two Rubik files join the list.
- `components/day/Day.tsx` (anchor `day-styles`): the location and date lines and their margins
  (ar location margin 2, D95; en 5). Step 1 changes NOTHING in this file: the gap heals by the
  font's own box, which is her ruling's whole point.
- `components/prayer/Explanation.tsx` (anchor `explanation-arrow`): the arrow SVG - `width={30}
  height={12}`, the up path `M0 12 L12 3.5 Q15 1 18 3.5 L30 12 Z`, the mirrored down path, a
  1pt stroke on the side edges.
- `components/overlay/OverlayInfoBox.tsx` (anchor `infobox-placement`): `TIP_OVERLAP = 4` and
  the placement arithmetic that keeps the prayer card motionless. `overlayPlacement.test.ts`
  imports the constant, so the arithmetic tests survive a value change untouched.
- `components/countdown/Countdown.tsx` (anchors `countdown-gap`, `countdown-gap-style`): each
  group renders digits, then the gap span (a space at fontSize 8, about 1.99pt advance), then
  the letter. The gap span dies whole; `styles.gap` with it.

Existing tests and what each proves:

- `shared/__tests__/typography.test.ts:31-32` pins the ar record's two Noto family names (red
  first, re-pinned to Rubik).
- `components/__tests__/typographySweep.test.tsx:241,258` pins `NotoSansArabic-Medium` on
  weight surfaces and `:281` pins the ar row-time family as Roboto Regular (red first, all
  three re-pinned to Rubik); its inventory cases (30-58, 206-214) pin that Day
  resolves families through the record - unchanged.
- `components/day/__tests__/DayLines.test.tsx:21-90`: lineHeight stays undefined on both lines
  under ar and en (row 87's law - this plan keeps it trivially, it touches no lineHeight), and
  the margins 2/5 stay.
- `components/overlay/__tests__/overlayPlacement.test.ts`: the anchor arithmetic through
  `TIP_OVERLAP` - survives the value change by construction.
- `components/prayer/__tests__/Explanation.test.tsx`: pins the arrow's SIDE and the six-locale
  byte sweep of the sentence; it pins no sizes today, so step 2 adds the geometry pins.
- `components/countdown/__tests__/Countdown.test.tsx:176-188`: counts the gap nodes (2 today) -
  step 3 rewrites it to count 0; `:151-174` pins letter size and ink and `:52-67` pins ar
  letters LTR - both stay green with their sixteen display strings re-written (the joined text
  loses the span's space).
- `shared/__tests__/catalogLock.test.ts` and `constants.test.ts:384` (block 54): untouched, both
  stay green.

Why the obvious fixes are wrong: a pull-up or margin change on the date line is banned by her
item-1 ruling; shrinking the SVG without the overlap knob leaves the tip floating at the old
depth; keeping any gap span contradicts her zero rule.

## 5. Design

Three independent one-surface steps. The invariant, one sentence a test can check per item: the
ar record names Rubik everywhere a family is named while every other record and every pinned
non-ar byte stays identical; the arrow draws at 36 by 15 with overlap 6 and the placement
arithmetic unchanged; the countdown group's children are digits then letter with no gap node
between them.

Alternatives rejected: locale-keyed Day margins or a date pull-up (her ban); Readex or Almarai
(her pick overrode the measurement's ranking - the specimen stays for a later re-look);
removing `scriptLineHeight` (a settled-surface change this ticket does not rule); a font stack
with Noto fallback (one family serves both scripts; a stack reintroduces the mixed-face risk).

Concurrency trace: none. All three steps are static style and asset changes with no async path,
no timers, no scheduling.

Acceptance criteria:

- [R1.1] WHEN the app locale is Arabic THE SYSTEM SHALL resolve the record's familyRegular, familyMedium, familyDigits and familyRowTime to the bundled Rubik faces.
- [R1.2] WHEN the app locale is any non-Arabic locale THE SYSTEM SHALL render byte-identically to the pre-change build with every non-ar record and pinned surface unchanged.
- [R1.3] WHEN the Day block renders under Arabic THE SYSTEM SHALL carry the location-date gap from Rubik's own line box with no lineHeight pin and no change to any Day.tsx value.
- [R2.1] WHEN the overlay explanation renders THE SYSTEM SHALL draw the arrow at width 36 height 15 with the row-band overlap 6 and the placement arithmetic unchanged.
- [R3.1] WHEN the countdown timer renders a digit group with its letter THE SYSTEM SHALL place the letter immediately after the digits with no gap node between them.
- [R4.1] WHEN the owner reads the dev build under Arabic and English after the steps THE SYSTEM SHALL show the healed gap, the bigger arrow and the tight letters, with dials landing as pinned follow-up commits (her read, the acceptance).

## 6. Steps

Checklist:

- [x] Step 1: the Rubik face under ar (`steps/1-rubik-face.md`)
- [x] Step 2: the arrow geometry (`steps/2-arrow.md`)
- [ ] Step 3: the letter gap dies (`steps/3-letter-gap.md`)
- [ ] Step 4: the owner's read (`steps/4-owner-read.md`)

Steps carry their own Requirements, Weight, anchor check, goal, branch, files, red tests, change
contracts, green run, break script, version and commit, review checklist, merge and done-when.

## 7. Device proof

No lane-driven device step. Her read on the XS dev build under ar and en is the acceptance
(D106.4), batched with the other lanes' owner moments; the build lands on the phone through the
atlas recipe at step 4. The two measured font facts this plan stands on were taken at planning
time from the TTFs' own tables and are recorded in D106.5; nothing on device re-measures them.

## 8. Records

`LOG.md` carries the ledger: every step entry opens `### Step NN - <state>` and ends
`session: <ses_id>`; planning sections use `## Planning (2026-10-15)` and `## Ticket 106`. The
queue cell the lead applies on DONE: "DONE <date>, audited: under Arabic the whole face renders
Rubik (words, digits, h m s, row times) and the location-date gap rides Rubik's own 1.185em box
with no pin and no pull, the info-box arrow draws at 36 by 15 sunk 6 into the row, and each
countdown letter sits against its digits with the gap span deleted; every non-ar locale
byte-identical; owner-read on the XS". The docs commit message: "<VERSION> - docs(plans): row
106 READY, the visual batch plan".

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | What it means | Action |
| --- | --- | --- |
| The Rubik URL serves a different cut (wrong size, no Arabic cmap) | The pinned v31 URLs moved | STOP per 2.2, first row, with the file's tables (a quick python read of hhea and cmap as planning did) |
| An ar snapshot or byte pin fails after the family swap outside the three named test files | A consumer hard-codes the Noto name the sweep missed | STOP per 2.2, second row, with the failing name |
| The arrow's placement tests fail after the knob change | The arithmetic reads the constant, so a failure means the constant moved twice | Re-read the diff: only TIP_OVERLAP and the SVG geometry change |
| The rewritten gap test cannot go red | The span was already gone or the selector changed shape | STOP: the plan's premise moved; NEEDS REPLAN |

Anticipated review fixes, word for word:

- "The Rubik files carry the upstream names (Rubik-Regular.ttf, Rubik-Medium.ttf): keep the
  app.json list alphabetized as the plugin prints it."
- "Delete the dead `styles.gap` with the span: a style with no reader is lint debt."

Restore lists: step 1 touches `app.json`, `assets/fonts/` (two new files), `shared/typography.ts`
and two test files; step 2 touches `components/prayer/Explanation.tsx`, `components/overlay/OverlayInfoBox.tsx`
and one test file; step 3 touches `components/countdown/Countdown.tsx` and one test file. Each
break run restores its files from their backup copies; `git checkout uat -- <file>` is only for
abandoning a step entire.

## 11. Subagents

Planning used `explore` for the ground map and the owner's own eyes for the specimen. Delivery:
the lead dispatches `athan-executor` per step and `athan-reviewer` twice (plan-conformance and
blind). A worker that cannot see a screenshot calls `vision`. Nothing else, ever.

## 12. Report to the owner

Plain sentences: Arabic now renders Rubik end to end and the Day gap is the font's own box, the
arrow reads bigger and sinks deeper, the timer's letters sit tight on their digits, and every
other locale did not move. Then the progress table, then the four-line handoff block, nothing
after it.
