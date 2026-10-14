# Ticket 76: digit and string gaps under ar (the overlay's Latin numerals, the Qibla instruction's ellipsis, the cardinal ring rebuilt as numbers)

| Field | Value |
| --- | --- |
| Brief | Queue row 76, `ai/plans/README.md` |
| Planned at | `1b0d5229` (2.0.402), 2026-10-14, worktree `$HOME/athan-gitree/run-76`, branch `ticket/76` |
| Planned by | The lead, autonomous run under the owner's run order of 2026-10-14 (she is not interviewable this run; every decision below records its source) |
| Needs first | nothing |
| Parent | none |
| Group | the digit map and the qibla sheet copy (declared files disjoint from tickets 75 and 80) |
| Batch budget | 3 weight units |
| Session budget | 7 weight units (steps sum to 7; step 3, the device weight, always dispatches alone) |
| Steps count | 4 (weights 2, 1, 3, 1) |
| Device | none (waived by the owner's run order; one iOS simulator session allowed for visual proofs, dev/mock only; the owner is final QA) |
| Owner decisions still needed | none open for this ticket; the merge to uat and the DONE cell are the orchestrator's after this run |

## 0. Amendment 2026-10-14: the compass ring rebuilt as numbers (owner ruling)

**Source: the owner's instruction of 2026-10-14, carried on queue row 76.** The compass
ring's cardinal LETTERS (English and Arabic alike) are REPLACED by LATIN NUMBERS, each
with a small degree circle at its top right: north 0, east 90, south 180, west 270,
identical in every language, so the compass depends on no language at all.

This supersedes the planning verdict on item (c) (D76.4, "the letters are correct; no
change ships"). Item (c) is re-scoped from verify-the-Arabic-letters to this rebuild.
The test the step-2 execution committed at 2.0.604
(`shared/__tests__/qiblaCompass.test.ts`, "the cardinal letters") asserted the old
letters and is replaced by number-and-degree-circle assertions that hold under all six
locales. The four `qibla.cardinal.*` keys leave the six catalogs, because the ring no
longer reads copy: the four bearings are module data (`CARDINAL_ANGLES`), so the compass
module imports no catalog and the per-locale provenance for those keys retires with them.
The catalog lock is re-taken (`node scripts/catalog-lock.mjs`), the key parity gate holds
because all six catalogs change together, and the `ar-cardinals` pre-flight anchor's
subject is deleted (the anchor file is the step-0 gate and stays). This is the one
sanctioned departure from section 2.2's "no catalog change" rule; it is the ruling's own
consequence.

The ruler sits above the numeral law (the native digits everywhere except the countdown,
its bar and the prayer times): the owner's explicit words are LATIN numbers "identical in
every language", so the compass numbers stay Latin under ar too, and the ring joins the
countdown and the row times as a language-free surface.

## 1. Goal

The owner's RTL test of 2026-10-13 reported three things under ar. Two are defects at
her test's build; one is a verification ask. What is true when DONE:

1. (a) Every Extras info box sentence renders its digits in Eastern Arabic-Indic under
   ar, and byte-for-byte from the catalog under the other five locales. At the anchor
   this already holds in shipped code (row 84's law landed at `1b30469a`, 2.0.250,
   2026-10-14, one day after her test); this ticket locks it with a six-locale sweep
   test over all five boxes and proves it on the simulator.
2. (b) The Qibla sheet's subtitle shows its full sentence in every language. Today the
   line laid out absolutely (the ready sentence) truncates with three dots under any
   locale whose ready sentence is wider than its waiting sentence (ar and so qualify),
   because the box shrink-wraps to the in-flow line. The catalog is complete in all six
   languages; the defect is layout, and the fix sizes the box to the wider sentence.
3. (c) The compass ring's cardinals are the four LATIN bearing numbers 0, 90, 180 and
   270, each with a small degree circle at its top right, identical in every language
   (the owner's 2026-10-14 ruling, section 0). At the anchor the ring prints catalog
   letters per language (ش ق ج غ under ar); this ticket rebuilds the ring as numbers and
   removes the ring's language dependency.

Owner rules that govern, with source:

- "the compass ring's cardinal letters are replaced by Latin numbers with a small degree
  circle at the top right of each number: north 0, east 90, south 180, west 270,
  identical in every language, so the compass depends on no language at all" (the
  owner's instruction, 2026-10-14). This is the ruling recorded in section 0.
- "the Extras boxes take Arabic-Indic ٢٠ under ar" and "the countdown and prayer-time
  components keep Latin digits always" (the owner's run order, 2026-10-14, restating
  row 84's boundary). The shipped boundary also keeps the list row times Latin
  (`shared/typography.ts:18-19`, landed with row 84); this ticket touches neither the
  countdown, nor its bar, nor the row times.
- "determine whether the string is truncated by the layout (numberOfLines/ellipsizeMode)
  or incomplete in the catalog, and fix it to the full sentence" (queue row 76, her
  RTL test). Determined: truncated by layout; the catalog is complete.
- "en and the other non-ar locales stay byte-identical except where a fix lands in all
  six catalogs by design" (the owner's run order). No catalog value changes in this
  ticket, so every non-ar byte and every en pixel stays as shipped.
- "Her confirmation recorded: the location name staying English at the sheet's foot is
  correct" (queue row 76; the device-keyed statics, D44/D79). The `qibla-place` line is
  out of scope and stays untouched.
- Qibla is locked (ai/AGENTS.md): no heading is drawn the phone has not vouched for.
  This ticket changes no heading, gate or drawing arithmetic.
- Visuals are settled (ai/AGENTS.md). The one layout change here is the one her
  ellipsis report orders; it moves no pixel under en (measured below and proven in
  step 3).

The numeral-law lineage, recorded per the run order: row 57 (2026-10-12) ruled native
numerals per language; row 82 (2026-10-13) reversed it to Latin digits in every
language; row 84 (2026-10-13, landed as `1b30469a` 2.0.250 with "every locale rule
made data") set the boundary that ships at the anchor: the countdown, its bar and the
list row times keep Latin glyphs in every locale, every other sentence and value takes
the locale's own digits (`NATIVE_DIGITS` in `shared/i18n/locale.ts:27`, ar =
`٠١٢٣٤٥٦٧٨٩`). Under that boundary the Extras info boxes are native-digit surfaces, and
the shipped `localizeDigits` call at `components/prayer/Explanation.tsx:74` (added by
that same commit) serves them. The owner added one boundary to that law on 2026-10-14
(section 0): the compass ring's bearings are Latin numbers in every language, so the ring
joins the countdown, its bar and the row times as a language-free surface. Her 2026-10-13
test ran a build from before 2.0.250, so
her Latin 20 was real then and is healed at the anchor. Nothing in the shipped code
contradicts the boundary on any surface this ticket touches, so no sub-item is scoped
out as owner-owned.

## 2. Decisions

### 2.1 Taken (all autonomous; source for each: the owner's run order, 2026-10-14, plus the evidence named)

- **D76.1** Item (a) is a verification-and-lock job, not a code fix. Evidence:
  `Explanation.tsx:74` passes the rendered sentence through `localizeDigits`, whose ar
  table ships at `locale.ts:27`, and `Explanation.test.tsx:60-73` already locks the
  Suhoor box under ar. The remaining gap is coverage: the other four boxes and the
  non-ar byte-freeze have no sweep. Step 2 closes it.
- **D76.2** Item (b) is layout truncation. Evidence: all six catalogs hold complete
  sentences for both subtitle keys (six-file grep recorded in LOG.md); both subtitle
  lines render with `numberOfLines={1}` (`Qibla.tsx:91,94`) whose default tail mode
  appends the dots; the box shrink-wraps to the in-flow waiting line while the ready
  line is absolute, and the repo's own test comment (`Qibla.test.tsx:258-260`) names
  the mechanism with measured en widths (158.6dp in flow against 150.4dp absolute).
  Under ar the order flips (ready wider than waiting), so the absolute line truncates.
- **D76.3** The fix is a zero-height, in-flow width donor carrying the ready sentence,
  so the box width is the max of the two sentences in every language. Rejected: swapping
  which line is in flow (breaks under the opposite locale); `numberOfLines={2}` (still
  truncates, changes header height); dropping the absolute overlay for a negative-margin
  stack (per-locale line heights make the margin unknowable in CSS). The waiting line
  stays in flow, the ready line stays absolute, `numberOfLines` stays 1, the cross-fade
  and the one-line header height are unchanged.
- **D76.4 (SUPERSEDED 2026-10-14 by the owner ruling, section 0)** The planning verdict
  was "the letters are correct; no change ships": the catalog held n=ش, e=ق, s=ج, w=غ
  (`ar.ts:177-180`) and `resolveCardinals` mapped them to 0/90/180/270 degrees
  (`shared/qiblaCompass.ts:99-104`), matching five independent Arabic qibla services
  (al-harameen.com/qibla, hijriyan.com, tarikhak.com, wmadaat.com, manarquraan.co.uk).
  The owner rejected the per-language ring outright on 2026-10-14. See D76.8.
- **D76.8** Item (c) is the rebuild the owner ordered (section 0). The ring prints the
  four bearings as LATIN numbers with a degree circle, identical in every language.
  Design: `shared/qiblaCompass.ts` exports `CARDINAL_ANGLES = [0, 90, 180, 270]` as
  module data (no catalog read, the `t` import and `resolveCardinals`/`DialCardinal`
  retire); `QiblaCompass.tsx` draws each number as SVG text at its own bearing through
  `facePoint(angle, radius * FACE.cardinal)`, with the degree circle a smaller
  `TSpan` raised by `baselineShift={'super'}` at the number's top right. The four
  `qibla.cardinal.*` keys are deleted from all six catalogs; the catalog lock is
  re-taken; the `ar-cardinals` pre-flight anchor is retired. Evidence: the ring reads
  the same four numbers under every locale because it reads no locale at all (the
  stringGuard test proves the module holds no catalog key), and the render sweep in
  `Qibla.test.tsx` proves the drawn labels are identical under all six.
- **D76.5** Version range deviation: the run order reserved 2.0.500 to 2.0.599, but
  `origin/uat` has moved to `f5c608ed` (2.0.600) and consumed 2.0.403 through 2.0.600
  while sibling branches run at 2.0.406 (ticket/80) and 2.0.450 (ticket/75). The repo
  law (ai/AGENTS.md: fetch origin first, never take a taken number) governs over the
  stale reservation. This ticket versions from 2.0.601 upward (planning commit 2.0.601;
  step 1 at 2.0.602; the step-2 stop record at 2.0.603; step 2 at 2.0.604; this owner
  amendment at 2.0.605; the compass rebuild at 2.0.606; step 3 at 2.0.607; step 4 at
  2.0.608; audit fixes after). `android/` is gitignored
  and absent in the worktree; `shared/__tests__/versionLockstep.test.ts` accepts the
  absent file and asserts the gitignore instead, so only `app.json` and `package.json`
  are bumped.
- **D76.6** Simulator visual proof is step 3, one dispatch, dev/mock only via
  `npx @expo/agent-cli smoke --ios` plus the agent-device MCP. If the simulator
  environment cannot deliver (build or smoke failure), the step records the failure in
  LOG.md and the visual proof falls to the owner's final QA; it blocks nothing else.
- **D76.7** The queue row is not set DONE this run (the owner's run order). Step 4
  sets the row's status text to the executed-and-audited state and records the DONE
  cell text and docs commit message for the orchestrator's merge (PLAN.md section 8).

### 2.2 The executor must not decide

- Any change to a file in ticket 80's or ticket 75's list (80: `stores/bootstrap.ts`,
  `stores/language.ts`, `shared/i18n/locale.ts`, `app/_layout.tsx`, `app/index.tsx`,
  `device/listeners.ts`, `stores/notifications.ts`,
  `components/sheets/screens/QiblaWave.tsx`, `shared/qiblaWave.ts`,
  `components/ui/Error.tsx`; 75: the mosque SVG component(s), the sheet/modal/screen
  scroll containers, the Toggle part component). If a fix seems to need one, STOP with
  the file name; the orchestrator sequences it after those tickets merge.
- Any finding that the ar digits render Latin at the anchor (a red sweep that stays red
  after the break script is reverted is that finding). STOP; that contradicts D76.1 and
  needs a replan.
- Any catalog value change, EXCEPT the one the owner ruling orders: the four
  `qibla.cardinal.*` keys are deleted from all six catalogs in step 2b (section 0). No
  other value in the six catalogs changes.
- Any merge to uat, any push, any production build, any EAS use, any install on the
  owner's iPhone XS (the owner's run order). The iPhone XS may be driven read-only for
  a visual check and nothing is ever installed on it.

## 3. Pre-flight

`scripts/preflight-76.sh` in this folder. First the lead commits the plan folder plus
the version bump on `ticket/76`: both `app.json` and `package.json` at 2.0.601,
message `2.0.601 - docs(plans): ticket 76 planned: the digit sweep lock, the subtitle width donor, the cardinal verdict`.
The executor then copies the script to `$TMPDIR`, runs it from the worktree root
(`bash $TMPDIR/preflight-76.sh`), and it prints `PREFLIGHT OK` when: the tree is the
worktree at `$HOME/athan-gitree/run-76` on branch `ticket/76` with a clean status;
HEAD descends from `1b0d5229`; `app.json` and `package.json` both read 2.0.601;
`node_modules` is present; every anchor under `scripts/anchors/` counts exactly 1 in
its source file in the clean working tree (HEAD-equal, which the clean check
guarantees). Any other output is a STOP with the printed reason. The pre-flight and its
anchors are the step-0 gate, evaluated at 2.0.601 before step 1; they are not re-run once
execution starts, and step 2b deletes the subject of the `ar-cardinals` anchor (the
anchor file itself is the historical gate and stays).

## 4. Background the executor needs

Code map (anchors under `scripts/anchors/`):

- `components/sheets/screens/Qibla.tsx` — the sheet; `QiblaSubtitle` (lines 82-99) is
  the changed surface. The Sheet header (`components/sheets/parts/Header.tsx:31-37`)
  lays the title-plus-subtitle column and the 40pt icon in one `space-between` row, so
  the icon's x position is pinned by the row's ends and cannot move when the subtitle
  column widens; that is what makes the en rendering pixel-stable under the fix. The
  header column itself is as wide as `min(window, 500) - 2*20 (content padding) -
  2*16 (header padding) - 40 (icon)` gives: 278dp on a 390pt phone, 276dp counting the
  sheet background's 1pt border on each side (`components/sheets/parts/Shared.tsx`,
  `renderSheetBackground`).
- `components/sheets/screens/__tests__/Qibla.test.tsx` — the sheet's suite; lines
  236-276 cover the subtitle pair and line 261 locks today's en-only wider-line
  choice; lines 207-209 hold the `subtitleOpacity` helper that moves to testIDs.
- `components/prayer/Explanation.tsx` — the one renderer of every Extras info box
  (verified: `PrayerExplanation`'s only caller is `OverlayInfoBox`; the five catalog
  keys `EXTRAS_EXPLANATIONS` (`shared/constants.ts:65`) are the whole family). Line 74
  wraps the sentence in `localizeDigits`. Not changed by this ticket.
- `components/prayer/__tests__/Explanation.test.tsx` — locks the Suhoor box under ar
  (lines 60-73); step 2 extends it to the five-box, six-locale sweep.
- `shared/i18n/locale.ts` — `NATIVE_DIGITS` (line 27) and `localizeDigits` (29-32),
  the digit law as data. Read-only here; ticket 80 owns it.
- `shared/i18n/{en,ar,ms,so,hi,th}.ts` — the six catalogs. Byte-frozen here except the
  four `qibla.cardinal.*` keys, which step 2b deletes from all six by the owner ruling
  (section 0). The two subtitle keys are quoted in the anchors and LOG.md.
- `shared/qiblaCompass.ts` — the ring's bearings. Step 2b replaces `resolveCardinals`
  (99-104, the catalog letters mapped to 0/90/180/270 degrees) with `CARDINAL_ANGLES`, a
  locale-free data constant, and drops the module's `t` import.
- `shared/typography.ts` — the row-time and countdown Latin rules (18-19) that this
  ticket must not disturb.
- `app.json`, `package.json` — version bumps each commit (D76.5).

How the pieces interact: `t(key)` reads the active catalog; `localizeDigits` rewrites
ASCII digits to the active locale's table (identity outside ar); `QiblaSubtitle`
cross-fades two stacked one-line texts inside a shrink-wrapped box. The defect is that
the box's width comes from one member of the pair only.

Existing tests and what each proves: `Qibla.test.tsx` 244-249 both lines stay mounted;
251-256 one-line cap; 261-269 which line is in flow (en widths); 271-276 and 334-341
the cross-fade follows the compass. `Explanation.test.tsx` 21-29 the en sentence;
60-73 the ar digits for Suhoor. The typography sweep
(`components/__tests__/typographySweep.test.tsx:128-129`) renders PrayerExplanation
under ar and must stay green.

Why the obvious fix is wrong: raising or removing `numberOfLines` truncates less but
resizes the header mid-fade, the exact jank the two-line stack exists to avoid;
swapping the in-flow line trades the ar defect for an en one; a fixed `minWidth`
hardcodes one locale's measurement and breaks the next language.

## 5. Design

The subtitle box sizes itself to the wider of its two sentences in the active
language: the waiting line stays in flow, a zero-height invisible donor carrying the
ready sentence joins it in flow to contribute width, and the ready line stays absolute
on top. One sentence a test can check: under every shipped locale, both subtitle
sentences are laid out at full length on one line, and under en no rendered pixel
moves.

Concurrency trace: none. The component holds no state beyond the fade shared values;
the donor is static text in the same render. No timers, no sensors, no stores.

Design review: the donor duplicates one `t()` read; the string guard reads catalog
keys, not literals, so no new constant travels outside the catalog. The donor carries
`accessibilityElementsHidden` and `importantForAccessibility={'no-hide-descendants'}`
(the pair the wave figure already uses, `Qibla.test.tsx:1384-1386`), so the screen
reader hears each sentence once.

The compass ring (step 2b, section 0): the four cardinals are no longer copy. The module
holds `CARDINAL_ANGLES = [0, 90, 180, 270]`; the dial draws each as SVG text on its own
bearing, with the degree circle a smaller `TSpan` raised by `baselineShift={'super'}` at
the number's top right. `baselineShift={'super'}` is a keyword, not a measured offset, so
no per-font number enters the module; both react-native-svg platforms resolve it from the
font's own superscript data (`RNSVGTSpan.mm`, `TSpanView.java`). One sentence a test can
check: the dial draws the same four numbers, each with its degree circle, under every
shipped locale, because it reads no locale at all.

**Acceptance criteria:**

- [R1.1] WHEN the Qibla sheet renders under any of the six shipped locales THE SYSTEM SHALL lay out both subtitle sentences at full length on one line each, with no ellipsis.
- [R1.2] WHILE the Qibla sheet renders under en THE SYSTEM SHALL keep the waiting sentence in flow, the ready sentence absolute, both at one line, and the icon pinned at the header row's end by the space-between layout.
- [R1.3] WHEN the subtitle box is measured in the test tree THE SYSTEM SHALL carry a zero-height in-flow text holding the ready sentence alongside the waiting line, with the ready line absolute on top.
- [R2.1] WHEN any of the five Extras explanation boxes renders under ar THE SYSTEM SHALL display every digit in its sentence as Eastern Arabic-Indic glyphs and no ASCII digit.
- [R2.2] WHEN any of the five Extras explanation boxes renders under en, ms, so, hi or th THE SYSTEM SHALL display the catalog sentence byte-for-byte with its digits unchanged.
- [R3.1] WHEN the compass dial renders under any of the six shipped locales THE SYSTEM SHALL draw the four bearings as the Latin numbers 0, 90, 180 and 270, each with a small degree circle at its top right, the same four labels under every locale.
- [R3.2] WHEN the compass module is read THE SYSTEM SHALL hold the four bearings as module data and no `qibla.cardinal.*` catalog key, so the ring depends on no language.

## 6. Steps

Checklist (LOG.md carries one `### Step NN` heading per step, each ending with its
`session:` line):

- [ ] Step 1 — the subtitle width donor (`steps/1-subtitle-donor.md`, weight 2, R1.1 R1.2 R1.3)
- [ ] Step 2 — the five-box digit sweep and the cardinal lock (`steps/2-digit-sweep.md`, weight 1, R2.1 R2.2 R3.1)
- [ ] Step 2b — the compass ring's cardinal numbers (`steps/2b-cardinal-numbers.md`, weight 2, R3.1 R3.2; the owner's rebuild, section 0)
- [ ] Step 3 — simulator visual proof, ar and en (`steps/3-simulator-proof.md`, weight 3, R1.1 R1.2 R2.1 R3.1; dispatches alone)
- [ ] Step 4 — records and the queue row (`steps/4-records.md`, weight 1, closes the ticket's run)

Steps live in `steps/`. Every step: one branch off `ticket/76`, one commit, versions
per D76.5 (step 1 commits as 2.0.602, step 2 as 2.0.604 after its stop record consumed
2.0.603, the owner amendment as 2.0.605, step 2b as 2.0.606, step 3 as 2.0.607, step 4
as 2.0.608), red tests before the change where the step changes code, `yarn validate`
green before the commit (the pre-commit hook runs it and takes 3 to 4 minutes;
`node_modules` must be symlinked into the worktree before the first commit). Step 2b
supersedes step 2's R3.1 work: the cardinal-lock test step 2 committed is replaced, and
its record is kept as written (LOG.md) with the supersession noted beside it.

## 7. Device proof

None on a phone (the owner's run order waives it; she is final QA). The simulator
session is step 3: dev/mock only, `npx @expo/agent-cli smoke --ios` (never `--eas`,
never `deploy`), agent-device drives, findings transcribed into LOG.md, no screenshot
or recording committed. The e2e gotchas apply (e2e/README.md read at planning): local
builds serve the mock API, which is fine for reading static strings; a screenshot
reaches a screen and never proves what is on one, so every visual claim is a
transcribed read of live text from the accessibility tree or the screen reader of the
snapshot, and the string assertions of steps 1, 2 and 2b carry the proof weight.

## 8. Records

LOG.md holds, under `## Planning (2026-10-14)`: the numeral-law lineage and D76.1's
evidence; the six-catalog subtitle quotes and the truncation verdict (D76.2); the
original item (c) verdict (D76.4, superseded by section 0) and the owner's rebuild
ruling (D76.8); the version-range deviation with the measured tips (D76.5). Each step
appends its findings under its own heading.

The queue cell text the orchestrator applies at DONE (recorded here now because the
plan folder dies with the merge):

> DONE 2026-10-14, audited on branch ticket/76: the Extras info boxes verified on
> Arabic-Indic digits across all five sentences with a six-locale sweep lock (row 84's
> law had healed the surface her 2026-10-13 test saw; the fix landed 2026-10-14 at
> 2.0.250), the Qibla subtitle's three dots diagnosed as layout truncation (the
> catalog complete in all six) and fixed with a zero-height width donor so the box
> fits the wider sentence in every language, en pixels unchanged, and the compass ring
> rebuilt on the owner's 2026-10-14 ruling: the cardinal letters leave the catalogs for
> the four Latin bearing numbers 0, 90, 180, 270, each with a small degree circle,
> identical in every language. Simulator-proven on the iOS mock build under ar
> and en. Versions 2.0.601-2.0.6xx on ticket/76 off `1b0d5229`.

The docs commit message for that merge:

> 2.0.6xx - docs(plans): ticket 76 DONE: the ar digit sweep lock, the Qibla subtitle width donor, the compass rebuilt as degree numbers; folder and evidence die with the merge

## 9. Push

None. The executor never pushes; this run merges nothing to uat (the owner's run
order, 2026-10-14).

## 10. When something goes wrong

| Symptom | What it means | Action |
| --- | --- | --- |
| The donor test stays red after the change | The donor is out of flow or contributes height | Check the donor's style carries `height: 0` and no `marginTop`; the box's height must equal one line |
| `getByText` throws on multiple matches in old subtitle tests | The donor duplicates the ready sentence, as designed | The step-1 test edits move those queries to testIDs; no other file renders these strings (the catalog lock `shared/__tests__/i18n.test.ts` compares values, it never renders) |
| The typography sweep fails under ar | The donor changed which texts the sweep sees | The sweep renders PrayerExplanation only, which step 1 does not touch; if it still fails, STOP with the diff |
| The ar sweep stays red with the code unchanged | D76.1's premise is false at the anchor | STOP; replan (section 2.2) |
| `smoke --ios` fails or no simulator exists | Step 3's environment | Record the failure line in LOG.md, mark step 3 BLOCKED-on-environment, continue to step 4; the visual proof falls to the owner's QA (D76.6) |
| A commit needs a file from section 2.2's forbidden list | Parallel-ticket overlap | STOP with the file name; the orchestrator sequences it |
| The pre-commit hook fails on coverage | A changed line lacks coverage | Cover the line or revert it; never disable the hook |
| The compass number sweep stays red after step 2b | The ring still reads a catalog key or draws per locale | Check the module holds `CARDINAL_ANGLES` with no `qibla.cardinal.*` and the dial reads it, not `t()` |
| The catalog lock fails after the key deletion | The six catalogs changed but the lock was not re-taken | Run `node scripts/catalog-lock.mjs` in the same commit |

Anticipated review fixes, word for word: the donor's style must not inherit
`styles.subtitle`'s `marginTop` (it would add 4dp to the header); the donor's
`numberOfLines={1}` must stay (a wrapped donor sizes to its longest fragment and
understates the sentence); the replaced wider-line test's measured en widths move into
the new test's comment, not the trash; the degree circle's size is a `FACE` ratio, not a
number invented at the draw site; the ring's four keys leave every catalog, not only ar.

Restore lists: step 1 reverts `Qibla.tsx` and `Qibla.test.tsx` to the previous commit;
step 2 reverts `Explanation.test.tsx` and, when the break script ran, `Explanation.tsx`
too; step 2b reverts `shared/qiblaCompass.ts`, `components/sheets/screens/QiblaCompass.tsx`,
`shared/__tests__/qiblaCompass.test.ts`, `shared/__tests__/stringGuard.test.ts`, the six
catalogs and `shared/i18n/catalog-lock.json`; step 4 reverts `ai/plans/README.md` and the
plan folder.

## 11. Subagents

Planning used the lead's own reads plus web verification through the TinyFish MCP
(announced per the global tool-routing rules). Delivery: the lead dispatches
`athan-executor` for steps 1, 2 and 4 (steps 1 and 2 may share one batch, weight 3,
within the batch budget; step 4 after step 3), one `athan-executor` dispatch for step 3
alone, and (added by the owner's 2026-10-14 ruling) one `athan-executor` dispatch for
step 2b alone; `athan-reviewer` reads the diff blind and against this plan at audit;
`vision` reads any image the runners cannot. Nothing else.

## 12. Report to the owner

Plain sentences: what the run proved (the digits already healed by row 84, locked
across all five boxes and six locales; the ellipsis was layout, fixed by the width
donor; the compass ring rebuilt on her 2026-10-14 ruling as the four Latin bearing
numbers 0, 90, 180, 270 with degree circles, identical in every language), the simulator
readings, the version-range deviation and its evidence, and the branch-and-worktree state
awaiting the orchestrator's merge. The progress table and the four-line handoff close
it.
