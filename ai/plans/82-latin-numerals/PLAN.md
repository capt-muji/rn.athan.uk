# Plan 82: Latin numerals everywhere; the countdown identical in every language

| | |
| --- | --- |
| Brief | Queue row 82 (her discovery ruling from the XS green-build read, 2026-10-13 ~17:3x): Latin digits only in every language, the countdown timer identical across all languages |
| Planned at | `a4d0b8c6` (uat, 2.0.218, 2026-10-13) |
| Planned by | lane/82 planner |
| Needs first | nothing (ground rows 57, 72 and 74 are DONE; runs ahead of row 81 by the lead's dispatch) |
| Parent | none |
| Group | the countdown format and digit layer (rows 57/63/72 ground; shares components/countdown/Countdown.tsx and components/prayer/Ago.tsx with rows 79/81) |
| Batch budget | 4 |
| Session budget | 7 |
| Steps | 3 (weights 2 + 2 + 3 = 7) |
| Device | iOS simulator (placeholder `SIMULATOR_UDID`); the iPhone XS (`IPHONE_UDID`, `e2e/device-atlas-iphone-xs.md`) stays the owner's own read; step 3 only, last |
| Owner decisions still needed | none at execution; section 2 records every ruling and every planner decision with its evidence |

## 1. Goal

Today the app renders two digit scripts and two countdown designs. Under `ar` every
composed number passes through `localiseDigits` (`shared/i18n/digits.ts:26`) and draws
Eastern Arabic-Indic glyphs, and the countdown timer renders one design per language:
English the lettered design (`1h 1m`, `shared/time.ts:637`), every other locale the
fixed-width colon design (`01:01` with dim gapped colons). The owner read the green
build on her iPhone XS on 2026-10-13 (~17:3x) and reversed her two earlier rulings
(rows 57 and 72), verbatim from queue row 82:

> "(1) DITCH the non-Latin numerals - Latin digits only (1 2 3 4 5 6 7 8 9) in EVERY
> language; Arabic switches from Eastern Arabic-Indic to Latin (this supersedes row 57's
> D54/D57/D58 native-numeral ruling for ar; Somali/hi/th/ms were already Latin); (2) the
> COUNTDOWN TIMER IS IDENTICAL ACROSS ALL LANGUAGES - Latin digits, the dim colours, the
> gapped colons, the fixed-width sections, no letters anywhere: English loses the 1h 1m
> lettered design it regained in row 72's revert (her words: 'no more 1h 1m, the
> letters'), and the en reminder titles and channel labels keep their row 72 reverted
> unit word (she named only the countdown timer). Rows 79/81's refinements all stand
> (dim digits -30%, colons -60%, the seconds-never-dim rule, the no-shift rule - Latin
> digits still need the equal-width rendering)."

When DONE: every user-visible number in the app and in the app-baked widget strings is
Latin digits in all six locales, the countdown timer (both schedule countdowns and the
ago badge's duration) renders the same fixed-width colon design in every language with
no unit letters anywhere, and the English reminder titles and channel labels keep their
unit word byte-identical. The owner notices on her next read: the Arabic face shows
`04:59` counting down in the same shape as the English face, and no `1h 1m` anywhere.

## 2. Decisions

### 2.1 Taken

| ID | What | Who, when | Evidence |
| --- | --- | --- | --- |
| D82.1 | Latin digits only in every language; the digit map dies | Owner, 2026-10-13 ~17:3x | Queue row 82 clause (1), quoted in section 1 |
| D82.2 | The countdown timer is identical across all languages; English loses the lettered design; the en reminder titles and channel labels keep the row 72 unit word | Owner, 2026-10-13 ~17:3x | Queue row 82 clause (2), quoted in section 1 |
| D82.3 | Rows 79/81's refinements (dim -30%/-60%, doubled colon gaps, seconds-never-dim, equal-width digit rendering) stand but stay in their own rows; this plan lands the identical baseline at row 72's current treatment (`COLORS.text.muted` colons and 00 groups, single thin-space gap `'\u2009:\u2009'`) | Owner (the refinements stand) and planner (the split), 2026-10-13 | Queue row 82 final clause; rows 79 and 81 remain open NOT PLANNED rows |
| D82.4 | Row 82 runs ahead of row 81 despite the queue's "sequence behind 81" note | Planner, 2026-10-13, on the lead's dispatch | The lead's dispatch names 82 the one in-flight ticket; the row's Needs first cell is `nothing`; 81's refinements are defined against the identical design this row lands |
| D82.5 | The ago badge joins the colon format under en (the duration inside the catalog sentence, `now` word kept inside the final 60 s) | Planner, 2026-10-13 | Row 72 rule 2 made the badge match the timer's treatment for non-en; row 79 item (3) rules its colon dims "in ALL languages including English"; row 82 removes the en lettered design; D75 (row 63) kept the `now` word |
| D82.6 | The countdown digits' font family is the Latin medium family in every locale, carried by the typography map as one shared field (`familyDigits`), because the timer's content is Latin digits in every locale; the prayer-name style keeps its per-locale face | Planner, 2026-10-13 | "IDENTICAL across ALL LANGUAGES" (row 82 clause 2); row 74's carried finding records the bundled Arabic faces as Arabic-only, so Latin content under ar takes the platform fallback face and the timer would differ by locale |
| D82.7 | The widget render-time digit map (`WIDGET_DIGITS`) and the app-side baking calls die with the app map; the iOS native timers (`Text(timerInterval:)`) keep rendering device-formatted digits | Planner, 2026-10-13 | "in EVERY language" over row 57's surface list (which named widget times and dates); the widget map is row 57's digit map, this row's named ground; the native timer renders in iOS's own process with no app-side format hook, and replacing it is row 69's owner-blocked widget-label work, so the D58 supersession is recorded on the queue and the native timer waits for her go |
| D82.8 | Reminder titles and channel labels change only in digit bytes under ar (through `t()`); no catalog value changes, no channel-id generation bump | Planner, 2026-10-13 | Row 82: "the en reminder titles and channel labels keep their row 72 reverted unit word (she named only the countdown timer)"; channel ids encode audio generations, never name text (`shared/notifications.ts:380-390`); no catalog file carries Arabic-Indic bytes (verified by grep over `shared/i18n/*.ts`, `native-strings.json`, `widget-statics.json`, `dist/`) |
| D82.9 | The device proof runs on the iOS simulator; the XS stays the owner's own read; the 3T is not connected | Planner, 2026-10-13, on the lead's dispatch | The lead's dispatch: "Plan any device proof on the XS or the simulator"; row 74's precedent (the owner verifies live on her XS) |
| D82.10 | Row 76 item (a) (the extras info boxes' Latin numerals under ar) is superseded by this row, and row 67's digit-map half dies with it; recorded in the DONE cell for the lead | Planner, 2026-10-13 | Row 76(a) exists only because the digit map missed that surface; row 67's mixed-script defect needs two digit scripts and one remains |

### 2.2 The executor must not

- Change any dim level, colour token, gap width or size: `COLORS.text.muted`,
  `COLORS.text.primary` and the single thin-space gap `'\u2009:\u2009'` are row 72's
  landed treatment and rows 79/81 refine them later. STOP on any pressure to touch them.
- Touch any widget countdown label format (letters, shape) or any native timer: row 69
  is owner-blocked. The only widget change this plan names is deleting the digit map and
  its call wrappers.
- Edit any catalog file, `catalog-lock.json`, `dist/` or `native-strings.json`: no value
  changes. STOP if a copy edit seems needed.
- Change channel ids, notification scheduling, or any armed alert's behaviour.
- Change `formatPrayerTime`'s `HH:mm` shape, the held `--:--` sentinel, or the
  `now` word's 60-second threshold.
- Decide any locale's design alone: one design serves all six. A locale that seems to
  need its own branch is a STOP, not a branch to add.

## 3. Pre-flight

`scripts/preflight-82.sh` in this folder. The executor saves a copy to `$TMPDIR` and runs
it from there, from the repository root, before step 1. It checks the `uat` checkout, a
clean tree, `origin/uat` merged in, the version at or above 2.0.218, row 82's Needs first
tickets all DONE, and every anchor count equal to 1. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

### 4.1 The code map

Every file this plan reads or changes, one line each. Anchors live under
`scripts/anchors/`.

| File | Role |
| --- | --- |
| `shared/i18n/digits.ts` | Row 57's digit map: `ARABIC_INDIC` and `localiseDigits`, deleted by step 2 |
| `shared/i18n/index.ts` | The `t()` read surface; its interpolation runs every `{n}` through `localiseDigits` (line 47), unwrapped by step 2 |
| `shared/time.ts` | The composers: `formatTime` dispatches en-lettered vs fixed-width (637), `formatTimeAgo` the same (701); `formatTimeFixedWidth` and `splitColonSections` are row 72's colon machinery; `formatPrayerTime`, `formatDateLocalized`, `formatHijriDateLocalized`, `footerFor` compose and digit-localise |
| `stores/countdown.ts` | The display selector `makeCountdownDisplayAtom` (90-96) calls `TimeUtils.formatTime`; no locale logic of its own, unchanged |
| `components/countdown/Countdown.tsx` | The timer render: locale gate at 54, section nodes with dim groups and gapped colons, module-scope `typographyFor` styles |
| `components/prayer/Ago.tsx` | The ago badge render: locale gate at 55, `splitSingleColon` gap node |
| `hooks/usePrayer.ts` | `getShownTime` (42-46) digit-localises the list row time, unwrapped by step 2 |
| `shared/typography.ts` | The per-locale map (row 74): `ARABIC` bundles Noto Sans Arabic, `LATIN` Roboto; step 1 adds the shared `familyDigits` field |
| `shared/widgetTimeline.ts` | Widget snapshot baking: `localiseDigits` at 157, 213, 274, 334, unwrapped by step 2 |
| `components/sheets/parts/Stepper.tsx` | Sheet count display, `localiseDigits` at 54, unwrapped by step 2 |
| `components/sheets/parts/SoundItem.tsx` | The preview countdown `formatTime` (20-25), `localiseDigits` at 24, unwrapped by step 2 |
| `widgets/PrayerWidget.tsx` | The widget's own render-time digit map `WIDGET_DIGITS` + `localiseDigits` (321-335), keyed off the device locale; callers at 406-408 (Android countdown label), 417-420 and 682-686 (footers); step 2 deletes the map |
| `shared/i18n/en.ts` | `{name} in {n}m`, `Athan {n}`, `duration.h/m/s/now`: unchanged, byte-pinned by step 2 |
| `widgets/LockPrayerWidget.tsx` | The iOS lock-screen widget: renders baked props and native timers, no digit map of its own, unchanged |

### 4.2 How the pieces interact

The display string is the contract. `formatTime` composes it, the countdown display atom
caches it, and the renderers decide its shape: `splitColonSections` splits a colon string
into dim-aware section nodes, and a non-colon string (`--:--`, and today's English
lettered strings) renders as one node. The English lettered design lives in three places:
the `formatTime`/`formatTimeAgo` dispatchers, and the render gates at `Countdown.tsx:54`
and `Ago.tsx:55` that skip the section render for `en`. Killing the lettered design means
killing all three; the render then follows the string's shape alone, which is the
identical-design rule in code form.

The digit map is the second axis: `localiseDigits` wraps every composer's return and the
`t()` interpolation, and the widget carries its own copy because its runtime imports
nothing from the app. One script must survive everywhere or nowhere: a map left alive on
one surface gives the mixed-script face row 67 chased.

### 4.3 The existing tests and what each proves

- `shared/__tests__/time.test.ts` pins every JSDoc example of `formatTime` and
  `formatTimeAgo` under en and ar, `formatPrayerTime`'s ar digits, and
  `splitColonSections`' shape rules.
- `stores/__tests__/countdown.test.ts` pins the display selector's string output,
  including the identical-string band rule and the ar digits.
- `components/countdown/__tests__/Countdown.test.tsx` pins the rendered sections, the
  gapped colon, the dim colon colour, the held `--:--` single node, and the en lettered
  strings this row removes.
- `components/prayer/__tests__/Ago.test.tsx` pins the badge's sentence, its gap node
  under ar, and the `now` single node.
- `shared/__tests__/digits.test.ts` pins the map itself; it dies with its subject.
- `shared/__tests__/dateLocalized.test.ts`, `notifications.test.ts`, `widgetTimeline.test.ts`,
  `widgetRenderer.test.ts`, `widgetSimulation.test.ts`, `components/prayer/__tests__/Time.test.tsx`,
  `components/sheets/parts/__tests__/SoundItem.test.tsx`,
  `components/sheets/screens/__tests__/Sound.test.tsx` and `Alert.test.tsx` pin today's
  Arabic-Indic bytes on each surface; step 2 flips them to Latin.
- `shared/__tests__/typography.test.ts` pins the per-locale map; step 1 extends it with
  the `familyDigits` pin. `components/__tests__/typographySweep.test.tsx` pins the
  no-raw-`TEXT.family` rule and the countdown name's ar-only expression; both stay true.
- The en lettered form is pinned beyond the five composer suites by
  `__tests__/app/Screen.test.tsx` (the ago badge sentence, three queries) and
  `stores/__tests__/schedule.test.ts` (two display rows); step 1 flips them to the colon
  shape.

### 4.4 Why the obvious fix is wrong

- Keeping `localiseDigits` as an identity function leaves dead indirection on 23 call
  sites and a test file guarding a map that no longer maps; the repo deletes dead code.
- Gating the section render on locale (today's line 54) instead of the string's shape
  re-creates the locale-keyed format read class her row 79/80 reports chased; the
  string's shape is the single decision point.
- Forcing Latin through an Intl numbering-system override would move composition into
  formatters, but strings, not formatters, are the contract the display atom caches and
  the renderers split.

### 4.5 Concurrency table

| Interaction | Rule |
| --- | --- |
| Module-scope `typographyFor(currentLocaleId())` in `Countdown.tsx` and `Ago.tsx` | Styles resolve once per module load; a language switch relaunches (row 68's D59 in-process reload), so both re-resolve under the new locale. No new cache. |
| The countdown display atom | Written once per wall second by the sequence ticker; step changes only the string it caches. No timing change. |
| `t()` interpolation | Pure; called from render paths and notification composition alike. Removing the wrapper changes no timing. |
| Widget timeline baking | Runs inside the scheduling lock on the timeline push path; the unwrap changes bytes only, no entry shape, no props version bump. |

## 5. Design

The plan removes the two locale axes from the number pipeline. Step 1 removes the format
axis: `formatTime` and `formatTimeAgo` lose their en dispatch and compose the fixed-width
colon shapes for every locale, the lettered helpers and duration labels in `time.ts` die,
the two render gates die so every locale renders sections, and the typography map carries
one digits family for the timer. Step 2 removes the script axis: the digit map dies in
the app and the widget, and every `localiseDigits` wrapper unwraps. Step 3 proves the
identical design on the simulator under en and ar.

Invariant, one sentence a test can check: for the same remaining seconds and seconds
preference, `formatTime` and `formatTimeAgo` return the same string under every locale,
the string is Latin digits and colons only, and the render splits it into dim-aware
sections in every locale.

Alternatives rejected:

- Revert rows 72 and 57 wholesale by replaying their patches backwards. Rejected: row 72's
  non-en colon machinery and row 74's typography are wanted; only the en lettered branch
  and the digit map die, and rows 79/81's refinements build on what stays.
- A per-locale numbering-system setting inside the composers. Rejected: two code paths
  again, the exact shape this ruling retires.
- Keeping the en lettered design for the ago badge only. Rejected: row 79 item (3) rules
  the badge's colon dims in all languages including English, which presumes the colon
  badge under en.

Design review: the flip is two-axis removal, each axis one step, each step red-first on
the suites that pin today's bytes. The measured red lists sit in each step file. The
risky edge is the widget map (separate runtime), covered by its own renderer pins. The
device step reads the two designs that must now be one.

Concurrency trace: none new. No timer, subscription, stored key or schema changes. The
only cross-file contract is the display string's shape, and `splitColonSections` already
accepts it.

Acceptance criteria:

- [R1.1] WHEN formatTime composes for any of the six locales THE SYSTEM SHALL return the fixed-width colon string (HH:MM, or HH:MM:SS while seconds show) of Latin digits with no unit letters.
- [R1.2] WHEN the countdown renders in any of the six locales THE SYSTEM SHALL split the display into section nodes with a dim gapped colon (thin space, `COLORS.text.muted`) between the digit groups.
- [R1.3] WHEN a digit group reaches 00 THE SYSTEM SHALL render it as a dim group and never hide the hours.
- [R1.4] WHEN the display is held at `--:--` THE SYSTEM SHALL render it as one node with no sections.
- [R1.5] WHEN the countdown digits style resolves in any locale THE SYSTEM SHALL set the map's digits family (Latin medium) from one shared field.
- [R1.6] WHEN formatTimeAgo composes for any of the six locales THE SYSTEM SHALL return the catalog `now` word inside the final 60 seconds and the H:MM Latin-digit duration otherwise, with no unit letters.
- [R2.1] WHEN t() interpolates a numeric parameter under any locale THE SYSTEM SHALL render the parameter's digits as Latin.
- [R2.2] WHEN a list time, date label, footer, stepper value or sound-preview countdown renders under ar THE SYSTEM SHALL draw Latin digits.
- [R2.3] WHEN a widget snapshot bakes times or footers under ar THE SYSTEM SHALL bake Latin-digit strings.
- [R2.4] WHEN the widget renders its countdown label or a footer at render time under a device locale of ar THE SYSTEM SHALL draw Latin digits.
- [R2.5] WHEN the module graph is type-checked after step 2 THE SYSTEM SHALL find no reference to `localiseDigits` or `ARABIC_INDIC`.
- [R3.1] WHEN an en reminder title or channel label composes THE SYSTEM SHALL keep the row 72 unit word byte-identical (`{name} in {n}m`, `Athan {n}`).
- [R3.2] WHEN a channel is created or a notification arms THE SYSTEM SHALL use the same channel ids and audio configuration as before this change.
- [R3.3] WHEN formatTime or formatTimeAgo composes for two locales at the same inputs THE SYSTEM SHALL return identical strings.
- [R4.1] WHEN the app runs on the iOS simulator under en and then under ar after an in-app language switch THE SYSTEM SHALL render the countdown in the same Latin-digit colon design in both reads.

## 6. Steps

Checklist (the executor ticks as each lands):

- [ ] Step 1: the format flip (steps/1-format-flip.md)
- [ ] Step 2: the digit map dies (steps/2-digit-map-dies.md)
- [ ] Step 3: the simulator proof (steps/3-device-proof.md)

Each step file carries its own Requirements line, anchor check, goal, branch, files, red
tests, contracts, green run, break script, version and commit, review checklist, merge
command and done-when.

## 7. Device proof

Step 3 owns it in full; the shape only here. Build the app for the iOS simulator
(placeholder `SIMULATOR_UDID`; the repo's `ios/` folder prebuilds from `app.json`
first), install, drive with `agent-device` (open, Settings sheet, language pick to
`ar`, the row 68 relaunch lands the switch), and read the countdown, the ago badge and a
list time from screenshots under both locales. No clock change, no alarm work, no
notification fires. Evidence lands under `$HOME/athan-gitree/sessions/82/` and never in
the repository. The iPhone XS is the owner's own read, per D82.9.

## 8. Records

- LOG.md entries land under their step headings in the ledger contract shape below.
  Step 1's entry carries the red list verbatim from Jest; step 2's the same plus the
  deleted-file list; step 3's the vision transcriptions and the screenshot inventory.
- Queue cell text for DONE (the lead applies it): "DONE: Latin digits render in every
  language and the countdown timer is one design everywhere - fixed-width colon
  sections, dim gapped colons, dim 00 groups, no unit letters under any locale, the ago
  badge's duration colon-shaped with the `now` word kept, the en reminder titles and
  channel labels keeping their row 72 unit word; the digit map (app and widget) is
  deleted with its tests; rows 79/81's refinements land on this baseline; row 76(a) and
  row 67's digit-map half are superseded; simulator-proven under en and ar."
- Docs commit message: `docs(plans): ticket 82 READY: Latin numerals everywhere, the
  countdown identical in every language`.

### LOG.md ledger contract (ticket 56)

Every step entry opens with `### Step <NN> — <state>` and ends with a line
`session: <ses_id>`. Planning sections use `## Planning (2026-10-13)` and `## Ticket 82`.

The DONE merge deletes this plan folder and the evidence under
`$HOME/athan-gitree/sessions/82/` per the records rule. No artefact survives: nothing in
shipped code cites this folder.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| A re-derived pin fails after its step's green run | A surface this plan missed still localises digits | Grep the file for `localiseDigits`; if the call site is in this plan's file list, fix it; if not, STOP with the file and line |
| A test outside the named suites fails after step 2 | A pin this plan's inventory missed | Record the test name and failure line in LOG.md and STOP; the planner re-derives it |
| `typographySweep` fails on Countdown.tsx | A raw `TEXT.family` reference crept in | Route the family through the map's `familyDigits`; never exempt the file |
| The simulator build fails on widget targets | The prebuild carried widget env from an earlier build | Clean the `ios/` derivation and prebuild plain per the step; never edit widget config |
| The ar read on device still shows Arabic-Indic digits | A cached snapshot (widget) or an unbaked surface | App surfaces: STOP. Widget: the timeline re-bakes on the next push, record the wait and re-read |
| Row 81 lands first and changes the dim levels | Parallel planning raced this row | The steps' anchors fail their count check; NEEDS REPLAN, never merge over |

Anticipated review fixes, word for word:

- "The countdown digits family belongs in the countdown style, not the map." -> The
  sweep guard pins the map discipline (no raw `TEXT.family` outside Help's glyph), and
  the map is the one source of face decisions; `familyDigits` is that field.
- "Deleting digits.test.ts weakens coverage." -> Its subject is deleted with it; the
  Latin behaviour is pinned where it lives, in each surface suite plus the t()
  interpolation pins in notifications.

Per-step restore lists:

- Step 1: `git checkout uat -- shared/time.ts shared/typography.ts components/countdown/Countdown.tsx components/prayer/Ago.tsx` plus the seven test files named there. No stored state touched.
- Step 2: restore the eight source files and twelve test files by name from uat;
  recreate `shared/i18n/digits.ts` and `shared/__tests__/digits.test.ts` from
  `git show uat:...`. No stored state touched.
- Step 3: uninstall the simulator app, delete `sessions/82/` screenshots. No stored state touched.

## 11. Subagents

Planning: the planner mapped the code directly, proved both flips in a scratch worktree
(measured red lists recorded in the step files), and dispatches one `athan-plan-griller`
on this draft. Delivery: the lead dispatches the `athan-executor` and `athan-reviewer`
workers; step 3's screenshots are read by the `vision` subagent. Every worker may call
`vision` for an image it cannot see. Nothing else, ever.

## 12. Report to the owner

Latin digits render everywhere and the countdown is one design in every language. Three
steps prove it: the format flip (en joins the colon design, jest red to green on the
pinned examples), the map death (every Arabic-Indic pin flips Latin, the module and its
test die), and the simulator read (en and ar faces of the same timer). The reminder
titles keep their unit word. Rows 79 and 81 refine this baseline next.
