# Ticket 81: Typography refinements from her green-build read

| Field | Value |
| --- | --- |
| Brief | Queue row 81, `ai/plans/README.md` |
| Planned at | uat `742186fa`, version 2.0.239, 2026-10-13 |
| Planned by | Planning session 2026-10-13. The owner was unavailable by her instruction; her rulings come from queue row 81 and her session messages (row 81 immediately after 79; dev builds on iOS; she tests; coverage stays 100) |
| Needs first | nothing (row 74, the ground, is DONE; row 79 landed the dim baseline) |
| Parent | none |
| Group | 74's ground, the typography map and its consumers: `components/countdown/Countdown.tsx`, `components/prayer/Time.tsx`, `components/prayer/Ago.tsx`, `components/prayer/List.tsx`, `shared/typography.ts`, `shared/time.ts`. No other open ticket touches these files |
| Batch budget | 4 weight units |
| Session budget | 6 weight units |
| Steps count | 5 |
| Device | none agent-run: the owner reads the dev build on her iPhone XS (Metro serving from ticket 79's delivery); no agent drives or reads the phone |
| Owner decisions still needed | Her read of every visual figure this plan pins by default: the ar countdown size (24), the doubled gaps, the 40 percent colons, the 22.5 gap, the 4-point badge lift |

## 1. Goal

What is wrong today, from her live read of 74's green build: the countdown
timer under ar is too large and pushes the page down; the timer's colons and
digits read squashed together; the prayer TIME column's colon has no gaps and
no dim treatment; the time-ago badge's colon likewise, and the badge still
touches the round settings button; and the seconds group of the timer mis-dims
at the one-minute instant (her additional ruling: seconds never dim).

What is true when DONE: the timer under ar renders two points smaller; every
colon the timer, the time column and the ago badge render carries two thin
spaces per side at 40 percent strength; the seconds group never dims while
hours and minutes keep the row-79 dim treatment; the gap below the prayer list
is 75 percent of its old value with the badge nudged up four points; and Metro
serves the merged uat to her dev build for her read.

The owner's rules that apply, from queue row 81 (her green-build read,
2026-10-13), quoted:

- (a) "the countdown timer under ar is too large and pushes everything down -
  reduce it slightly".
- (b) "the timer's colon spacing doubles - one more thin space on the left and
  right of EACH colon (four gaps total), everything still squashed together".
- (c) "the prayer TIME column's colon gains the same thin-space gaps and dims
  to the 60% styling, on the next-prayer and past-prayer rows".
- (d) "the time-ago badge still touches the round settings button - reduce the
  gap below the prayer list by 25% and push the badge up a little".
- (e) "verify the Standard and Extras schedules' list-to-ago gaps are identical
  (she suspects a difference; may be her eyes)".
- The additional ruling, quoted: "the SECONDS group never dims - at exactly one
  minute (00:01:00) it renders 00 while staying bright, because seconds are
  constantly ticking and are never a spent category; only hours (under an hour
  to go) and minutes (under a minute to go) take the dim treatment. The current
  all-zero dim rule mis-dims the seconds at the 1:00 instant; the render's dim
  mapping carves seconds out".
- Row 79 item 3, routed here by 79's D79.3: "the time-ago badge's colon takes
  the 60% reduction in ALL languages including English ... and the numerals
  need breathing space around the colon like the timer".
- Her session instructions: row 81 runs immediately after 79; dev builds on
  iOS; the owner does every test; 100 percent coverage holds.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who, when | Where recorded |
| --- | --- | --- | --- |
| D81.1 | "Reduce it slightly" for the ar countdown pins at 24 points, two under the shared 26 token (`TEXT.sizeLarge - 2`), expressed as a `countdownSize` field on the locale typography map (Latin 26, ar 24). Only the timer's digits shrink; the timer's name line, the container height and every other locale stay | Owner's ruling (a) with the figure chosen by planning 2026-10-13, owner unavailable; her read vetoes | Queue row 81, step 2 |
| D81.2 | The doubled gap text is exactly two U+2009 thin spaces on each side of the colon: `'\u2009\u2009:\u2009\u2009'`, on the timer, the time column and the ago badge alike (one gap text everywhere) | Owner's ruling (b) with (c)'s "the same thin-space gaps" and 79 item 3's "like the timer" | Steps 2 to 4 |
| D81.3 | "Dims to the 60% styling" on the time column and the ago badge rides each surface's own digit colour at 40 percent opacity on the colon node, so the colon tracks the row state it sits in (bright, muted, recent) exactly as its digits do; this equals a 60 percent reduction of the colon relative to its digits on every row state, and equals the timer's fixed 40 percent white on the bright rows | Owner's rulings (c) and 79 item 3, interpreted by planning 2026-10-13; her read vetoes | Steps 3 and 4 |
| D81.4 | The colon treatment applies to every prayer row, not only the rows she named: the colour rides the row's own animated state, so next, passed and future rows each get their own 40 percent colon with no row-class branching | Planning 2026-10-13, from her words naming where she looked | Step 3 |
| D81.5 | The gap below the prayer list is the List container's `marginBottom: SPACING.xxxl` (30), reduced by her 25 percent to `SPACING.xxxl * 0.75` (22.5); the badge is then raised four more points (`marginTop: -SPACING.xs` on the badge style), the "push the badge up a little" half | Owner's ruling (d) with the figures computed from the constants | Step 4 |
| D81.6 | Item (e) is verified by construction and needs no change: both schedules render the same `Screen`, `List` and `PrayerAgo` components and `List.tsx` carries no per-type style branch (`app/Screen.tsx:39-43`, `components/prayer/List.tsx:90-95`), so the list-to-ago gap is one shared number | Planning 2026-10-13 | This section; no step |
| D81.7 | The seconds carve-out lives in `splitColonSections`: a three-group display's third group never carries `dim`, whatever its digits; two-group displays keep the minutes dim at 00 | Owner's additional ruling, quoted in section 1 | Step 1 |
| D81.8 | The split time keeps one accessibility label carrying the whole `HH:MM` string, so a screen reader hears the time unchanged while the colon becomes its own node; the unread sentinel `--:--` stays one unsplit node, as the timer's held display already does | Planning 2026-10-13 | Step 3 |

### 2.2 The executor must not decide

- Any figure beyond the pinned defaults: the ar countdown size (24), the gap
  text (two thin spaces per side), the colon opacity (0.4), the list gap
  (22.5), the badge lift (-4). A reviewer or the owner's later read asking for
  different figures is a `STOP:` naming the pinned value.
- Any file beyond a step's list, or any change to `formatPrayerTime`,
  `formatTimeAgo`, `splitSingleColon`, the width-measurement layer, the
  reminder catalog, or the widget surfaces.
- Any interaction with the phone or the running app: the owner tests. Checking
  Metro's HTTP status on this Mac is the only permitted verification.
- If a step's red tests pass before the change, or any test the step did not
  name fails: `STOP:` per the executor contract.

## 3. Pre-flight

`scripts/preflight-81.sh <step>` in this folder, one parameterized script: the
executor saves a copy to `$TMPDIR` and runs it from the repository root with
the step number. It checks the `uat` checkout, the clean tree, `origin/uat`
merged in, the version floor for that step (2.0.240 plus the step number),
rows 74 and 79 DONE, and that step's anchors each counting 1. It ends
`PREFLIGHT OK`.

## 4. Background the executor needs

### Code map

| File | Role in this ticket |
| --- | --- |
| `shared/time.ts` | `splitColonSections` builds the timer's sections and marks an all-zero group `dim`; step 1 carves the seconds group out. `splitSingleColon` splits the ago badge's string and, from step 3, the time column's; it is not digit-checked, so the time column guards the unread sentinel itself. `formatPrayerTime` and `formatTimeAgo` are untouched: the strings stay `HH:MM`, only the render splits |
| `components/countdown/Countdown.tsx` | The timer. The colon `Text` renders the gap literal at line 75; `styles.countdown.fontSize` reads `ty.size(TEXT.sizeLarge)`; both change in step 2. Row 79's dim colours and the tabular pin stay byte-identical |
| `shared/typography.ts` | The per-locale map (row 74). Step 2 adds `countdownSize`: Latin `TEXT.sizeLarge`, ar two points under it. The map's other fields are untouched |
| `components/prayer/Time.tsx` | The time column: one `Animated.Text` fades between muted and primary per row state. Step 3 splits the readable time into parts around a colon node and labels the whole string |
| `components/prayer/Ago.tsx` | The badge: already splits on its single colon with one thin space per side; the badge's colours animate between `prayerAgo.text` and `feedback.success`. Step 4 doubles the gaps, dims the colon at 0.4 opacity and lifts the badge four points |
| `components/prayer/List.tsx` | The list container's `marginBottom: SPACING.xxxl` (30) is the gap below the list; step 4 sets it to `SPACING.xxxl * 0.75` |
| `components/prayer/__tests__/Time.test.tsx` | The only suite that queries rendered times by text; step 3 moves its readable-time queries to the accessibility label and adds the colon pins |
| `components/prayer/__tests__/Ago.test.tsx` | Pins the badge's sentence with the gap literal inside; step 4 updates the literal and adds the colon pins |
| `components/countdown/__tests__/Countdown.test.tsx` | Pins `GAP_COLON`; step 2 doubles the constant, red first |
| `shared/__tests__/time.test.ts`, `shared/__tests__/typography.test.ts` | The splitColonSections contract and the locale map pins; steps 1 and 2 extend both |

### How the pieces interact

Both schedules render the same `Screen` column: `Countdown`, `Day`, `List`,
then `PrayerAgo` behind the `showTimePassed` preference, then a flex spacer;
the settings button floats in `Navigation`'s dots container above the page
dots. The list-to-ago gap is therefore the List container's bottom margin plus
the badge's own top margin, one shared pair of numbers for both schedules
(D81.6). The time column's colour is the row's animated state (muted passed,
bright current), so a colon that rides the same state at 40 percent opacity
lands on each row exactly 60 percent under its own digits (D81.3). The timer's
seconds group is the third group of a three-group display only; two-group
displays have no seconds group, and their minutes keep the dim treatment
(D81.7).

### The existing tests and what each proves

`time.test.ts` pins the section split and the dim flags; `typography.test.ts`
pins the ar size table and families; `Countdown.test.tsx` pins the gap text,
the dim colours and the tabular pin from row 79; `Time.test.tsx` pins own
times, next-day overlay times and the sentinel; `Ago.test.tsx` and
`Screen.test.tsx` pin the badge sentence with its gap literal inside (four
literal sites across the two files), the `now` word as one node and the
overlay fade; `List.test.tsx` never queries a time string, so the split
render cannot break it.

### Why the obvious fix is wrong

- A fixed white 40 percent colon on the time column (copying the timer's
  constant) would render BRIGHTER than the muted digits of a passed row: the
  colon must ride the row's own colour (D81.3).
- Second `useDerivedColor` hooks per surface with hand-multiplied alpha
  constants duplicate what one opacity style entry does exactly.
- Doubling the gap by changing `SPACING` tokens would move every consumer of
  the tokens; the gap is a text literal in exactly two components.
- Carving the seconds in `Countdown.tsx` instead of `splitColonSections` would
  leave the pure function's contract lying and its suite unable to prove the
  rule.
- Asserting the new visuals through the `COLORS` constants repeats row 79's
  lesson: the tests pin the ruled literals (24, the doubled gap text, 0.4,
  22.5) with the rule named in a comment beside each.

## 5. Design

The invariant, one sentence a test can check: the timer renders its seconds
group bright always, every colon on the timer, the time column and the ago
badge carries `'\u2009\u2009:\u2009\u2009'` at 40 percent of its own digits'
strength, the timer under ar sets its digits at 24 points, and the badge sits
22.5 plus 4 points closer to the list.

Alternatives rejected: section 4's five. Concurrency: none; every change is a
pure function's flag, a style entry, a text literal or an opacity constant. No
timer, store, subscription or thread is touched. Design review: the unread
sentinels (`--:--` in the column, the held timer) stay single nodes; the
width-measurement layer measures prayer names only, and the time column is a
flex-centered child whose rendered width nothing pins, so the gap text cannot
break layout; row 79's tabular pin inherits to the time column's split parts
through the shared text style only if that style sets it, which it does not
and need not (list times are static strings, nothing shifts).

**Acceptance criteria:**

- [R1.1] WHEN the timer renders a three-group display whose seconds group reads 00 THE SYSTEM SHALL paint that group bright, never dim
- [R1.2] WHEN a display's hours group or minutes group reads 00 THE SYSTEM SHALL paint it dim exactly as before
- [R2.1] WHEN the timer renders a colon THE SYSTEM SHALL pad it with `'\u2009\u2009:\u2009\u2009'`
- [R2.2] WHILE the timer renders under ar THE SYSTEM SHALL set its digit font size to 24 points
- [R3.1] WHEN a prayer row's time is readable THE SYSTEM SHALL render its colon as a node padded `'\u2009\u2009:\u2009\u2009'` at opacity 0.4, with the whole `HH:MM` string as one accessibility label
- [R3.2] WHEN a prayer row's time is the unread sentinel THE SYSTEM SHALL render it as one unsplit node
- [R4.1] WHEN the ago badge renders its duration colon THE SYSTEM SHALL pad it `'\u2009\u2009:\u2009\u2009'` at opacity 0.4
- [R5.1] WHEN the prayer list renders THE SYSTEM SHALL set the gap below it to 22.5 points and raise the badge 4 further points
- [R7.1] WHEN step 5 completes THE SYSTEM SHALL have Metro serving the merged uat to the owner's dev build, verified by its status endpoint on this Mac

## 6. Steps

- [x] Step 1: the seconds group never dims (`steps/1-seconds-never-dim.md`, weight 2)
- [x] Step 2: the timer's doubled colon gaps and the ar countdown size (`steps/2-timer-gaps-ar-size.md`, weight 2)
- [x] Step 3: the prayer time column splits its colon (`steps/3-time-column-colon.md`, weight 2)
- [ ] Step 4: the ago badge colon, the list gap and the badge lift (`steps/4-ago-list-gap.md`, weight 2)
- [ ] Step 5: records and the handover (`steps/5-handover.md`, weight 1)

Batches by the weights: steps 1 and 2 in one batch (4 units), steps 3 and 4
in the next (4 units), step 5 alone. The session budget 6 admits one code
batch plus the handover: two executor sessions, the first running steps 1 and
2, the second running steps 3, 4 and 5.

## 7. Device proof

None agent-run, by the owner's instruction. Metro has served her dev build
since ticket 79's delivery step; every step here is JavaScript, so the merged
`uat` reaches her dev build on its next open, and step 5 verifies Metro's
status endpoint on this Mac (the server, never the phone). Her read of the dev
build is the acceptance bar for every pinned default in section 2.1; her
verdict, when it arrives, lands in the queue cell through the lead.

## 8. Records

The LOG.md entry heading for each step: `### Step <NN> — done`, each ending
with `session: <ses_id>`.

Each step's entry records: the branch and commit, the version, the red lines
the step predicted, the hook's `Tests:` line and the four coverage lines, the
break script's last line, the review verdict, the merge sha.

The queue cell text the lead applies on DONE:

> DONE 2026-10-13, audited: her green-build refinements land - the timer under
> ar two points smaller (24), every colon on the timer, the time column and
> the ago badge padded with two thin spaces per side at 40 percent of its own
> digits' strength, the seconds group never dimming while hours and minutes
> keep the row-79 treatment, the list gap down to 22.5 with the badge lifted
> four points; the two schedules' list-to-ago gaps verified identical by
> construction (one shared Screen, List and Ago); every figure pinned by
> default while she was unavailable, her dev-build read the acceptance bar
> (Metro serving since 79's delivery); row 79's dim baseline and tabular pin
> untouched

The audit fix and the DONE merge each run the version command and take the
next free patch number after the executed commit; the lead verifies at the
moment, the same way the executor does.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | What it means | Action |
| --- | --- | --- |
| A red test passes before its change | The anchor or the prediction is wrong | `STOP:` with the test name |
| A suite the step did not name fails | The change leaked beyond the contract | `STOP:` naming the suite and its first failing line |
| `tsc` rejects `countdownSize` | The map edit did not land before the consumer | Fix the order inside the step; anything else is `STOP:` |
| Metro's status endpoint is not 200 in step 5 | The dev-server stopped | Restart it detached per step 5's command; a second failure is `STOP:` |
| The owner reports different figures from her read | A pinned default is vetoed | A new queue row with her figures; not an executor concern |

Per-step restore lists sit in each step file.

## 11. Subagents

Planning used scratch proofs in a removed worktree. Delivery: the lead
dispatches the `athan-executor` for the batches above and the `athan-reviewer`
twice (blind and plan-conformance) at audit. No other worker.

## 12. Report to the owner

Plain sentences: the five refinements landed, the figures pinned by default
await her dev-build read, Metro serves the merged uat to her phone. The
progress table, then the four-line handoff, close the report.