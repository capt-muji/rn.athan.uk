# Ticket 79: Countdown dim levels and the no-shift rule

| Field | Value |
| --- | --- |
| Brief | Queue row 79, `ai/plans/README.md` |
| Planned at | uat `9cf6f43d`, version 2.0.231, 2026-10-13 |
| Planned by | Planning session 2026-10-13. The owner was unavailable by her instruction; her rulings come from queue row 79 and her three messages this session |
| Needs first | nothing (rows 72 and 74, the named grounds, are DONE) |
| Parent | none |
| Group | The countdown format and digit layer: `components/countdown/Countdown.tsx`, `shared/constants.ts` countdown entries, the `Countdown.test.tsx` suite. Shared with open row 81, which runs immediately after this ticket by the owner's instruction |
| Batch budget | 3 weight units |
| Session budget | 5 weight units |
| Steps count | 2 |
| Device | The delivery step installs the dev build on the owner's iPhone XS. The owner does every test on iOS herself, by her instruction; no agent drives or reads the phone |
| Owner decisions still needed | Her read of the two dim values on the dev build (D79.1). Everything else is taken from her written rulings |

## 1. Goal

What is wrong today: the timer's dim treatment reads too strong. Both a spent
`00` group and every colon paint the blue-grey muted colour
`rgba(138, 169, 214, 0.38)`, so the dim parts of the timer carry a hue shift and
a depth the owner never ruled. And the no-shift property is unpinned: nothing in
the render guarantees that digit glyphs advance equally, so a future font or
style change could make `20` to `19` slide the timer sideways.

What is true when DONE: a spent group paints white reduced 30 percent
(`rgba(255, 255, 255, 0.7)`), every colon paints white reduced 60 percent
(`rgba(255, 255, 255, 0.4)`), both through the existing slow colour fade, and
the timer's text style carries `fontVariant: ['tabular-nums']`, the tabular
figures mechanism, honored on both platforms at the pinned React Native. The
owner notices on her dev build: dimmer but still-white spent groups and colons,
and a timer whose layout never moves except the digit pair that changes.

The owner's rules that apply, from queue row 79 (her 3T and XS test,
2026-10-13):

- Rule 1, quoted: "DIM LEVELS - on the countdown timer, dim digits reduce by
  30%, colons reduce by 60% consistently (her corrected figures; the landed dim
  treatment reads too strong)".
- Rule 2, quoted: "NO-SHIFT - nothing in the countdown may ever shift
  horizontally except the digit pair that changes: going 20 to 19 must not shift
  because the glyph 2 is wider than 1 - the sections need equal-width digit
  rendering (tabular figures or per-glyph fixed boxes) for the Arabic-Indic
  digits too". Row 82 since made every locale's digits Latin, and its row
  restates: "the no-shift rule - Latin digits still need the equal-width
  rendering".
- Her instructions this session, quoted: "line up ticket 81 to be done after it
  immediately", "use dev builds on ios", "dont do any testing of youre own on
  the ios. i will do the testing", "we justneed 100% coverage as always on the
  codebase. maintain 100%".
- Row 79's own scope amendment, quoted: "this row keeps the countdown dim
  levels and the no-shift rule".

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who, when | Where recorded |
| --- | --- | --- | --- |
| D79.1 | The dim figures are reductions of white: digits `rgba(255, 255, 255, 0.7)`, colons `rgba(255, 255, 255, 0.4)`. The bright digit colour stays `COLORS.text.primary` (`#ffffff`). Her dev-build read is the acceptance bar | Owner's queue ruling 1; interpreted by planning 2026-10-13 while she was unavailable | Queue row 79, this plan, step 1 |
| D79.2 | The no-shift mechanism is tabular figures: `fontVariant: ['tabular-nums']` on the timer style, which she named first among two mechanisms. Verified at planning: React Native 0.88.0-rc.3 maps it to `'tnum'` font features on Android (`ReactAndroid/.../TextAttributeProps.kt`, `setFontVariant` to `setFontFeatureSettings`) and through CoreText on iOS, and the type union carries `tabular-nums` (`types_generated/Libraries/StyleSheet/StyleSheetTypes.d.ts:803,819`). The shipped Roboto-Medium is equal-advance by its own metrics: all ten digits advance 1164 units (colon 543), parsed from `assets/fonts/Roboto-Medium.ttf` at planning, so the property holds today and the pin holds it against font changes | Owner's queue ruling 2; mechanism chosen by planning 2026-10-13 | Queue row 79, this plan, step 1 |
| D79.3 | Per-glyph fixed boxes are rejected: a larger render-tree change (a View row of boxed Text nodes cannot nest inside the timer's `Animated.Text` on Android), accessibility churn, and unnecessary given D79.2's two verified facts | Planning 2026-10-13 | This section |
| D79.4 | Scope is the countdown timer only. The prayer-list treatments (the ago badge's colon, the prayer-time colon, the list gaps) belong to row 81 per row 79's own amendment, and row 81 runs immediately after this ticket by her instruction. The en-route defects recorded in row 79 item 4 belong to rows 80 and 66 | Owner's queue amendment and her session instruction | Queue rows 79, 80, 81 |
| D79.5 | Verification model: no agent-run iOS testing anywhere in this ticket. The delivery step builds and installs the Debug dev-client build on her connected iPhone XS and leaves Metro serving; she tests. The audit reads code and tests only, and her verdict, when it arrives, lands in the queue cell through the lead | Owner's session instruction 2026-10-13 | Step 2, section 7 |
| D79.6 | The delivery step bumps the three version files and runs no prebuild: no native file changes, so the committed `ios/` workspace builds as it stands. The dev build's bundle version label may lag one patch behind the repository version, which is cosmetic on a dev build and is recorded in `LOG.md` | Planning 2026-10-13 | Step 2 |

### 2.2 The executor must not decide

- Any colour value other than the two ruled strings in step 1. A hook, a
  reviewer or the owner's later read asking for different figures is a `STOP:`
  naming the ruled strings.
- Any file beyond step 1's list, or any change to `COLORS.text`, the gap text
  `'\u2009:\u2009'`, `splitColonSections`, the Bar, the ago badge, or the
  seconds preference path. Row 81 owns the seconds dim carve-out and the gap
  doubling.
- The delivery build's configuration or target: Debug, dev client, the
  connected iPhone XS, resolved at run time. A different device, simulator or
  configuration is a `STOP:`.
- Any interaction with the installed app beyond `expo run:ios`'s own install
  and single open. No taps, no screenshots, no reads of the running app: the
  owner tests.
- If TypeScript rejects `fontVariant` (it must not, per D79.2's verified type
  union), that is a `STOP:` quoting the error.

## 3. Pre-flight

`scripts/preflight-79.sh` in this folder. The executor saves a copy to
`$TMPDIR` and runs it from the repository root. It checks the `uat` checkout,
the clean tree, `origin/uat` merged in, the version at or above 2.0.231, rows
72 and 74 DONE, and every anchor count equal to 1. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

### Code map

| File | Role in this ticket |
| --- | --- |
| `components/countdown/Countdown.tsx` | The one timer surface. Both schedule pages render it; while the overlay is open the page countdown atom itself carries the selected prayer's countdown (ADR-014 countdown merge), so there is no second timer component to change. `CountdownSectionText` renders one digit group, `styles.countdown` is the timer text style every section inherits, `styles.countdownColon` paints the colon nodes, and the gap text `'\u2009:\u2009'` sits between them |
| `shared/time.ts` | `splitColonSections` (anchored) splits the display string into groups and colons and marks an all-zero group `dim`. Read-only context: row 79 changes no logic here. `formatTime` already pads every group to two digits, so a group is always two glyphs |
| `shared/constants.ts` | `COLORS.text` holds `primary: '#ffffff'` and `muted: 'rgba(138, 169, 214, 0.38)'`; `COLORS.countdown` holds the bar background and gains this ticket's two entries. `muted` has readers across the app (passed prayer rows, the ago badge, timestamps), so it must not change |
| `shared/typography.ts` | `familyDigits` is the Latin medium face in every locale (row 82), so the timer's font is one face everywhere and one `fontVariant` pin covers all six locales |
| `components/countdown/__tests__/Countdown.test.tsx` | The covering suite. Its existing colon-dim test anchors the edit; the rest prove the countdown values, the held `--:--` render, the boundary holds and the bar, none of which this ticket moves |
| `hooks/useAnimation.ts` | `useDerivedColor` fades a colour between two anchors. Read-only context: the step keeps the hook and changes only the `fromColor` it is given |

### How the pieces interact

`useCountdown` reads the display atom; `splitColonSections` splits it;
`Countdown` maps sections to colon `Text` nodes and `CountdownSectionText`
group nodes; the group fades between `fromColor` and `COLORS.text.primary`
over `ANIMATION.durationSlow`. Text style inheritance flows from the parent
`Animated.Text` (`styles.countdown`) into every nested section node, which is
where the `fontVariant` pin sits so the held `--:--` render and every group
carry it. The Reanimated Jest mock does not surface `useDerivedColor`'s output
as a readable style, which is why the suite mocks that one hook
deterministically at its two anchors: the component's contract under test is
which colours it feeds the fade.

### The existing tests and what each proves

The suite's countdown-value tests prove the fixed-width two-digit groups, the
round-up, the `00:00:01` hold and the prayer swap; the held-display test proves
`--:--` renders as one node; the bar tests prove the preference flip; the
overlay test proves the merge. None asserts a section colour today except the
colon-dim test this ticket replaces, and none can break from a colour or
`fontVariant` change because they query text, not style.

### Why the obvious fix is wrong

- Reusing `COLORS.text.muted` with a smaller alpha keeps the blue-grey hue
  shift the owner never ruled; her figures are reductions of the bright white.
- Changing `COLORS.text.muted` itself drags every passed row, the ago badge and
  every timestamp in the app into a countdown ruling they were never part of.
- `opacity` on the section nodes dims the text shadow with the glyphs and
  bypasses the existing fade hook; a colour fade between two whites is what the
  render already does between muted and white.
- Per-glyph fixed boxes: D79.3.
- Asserting the new values through the `COLORS.countdown` constants in the
  tests would let the break script's constant substitution pass silently, so
  the tests assert the ruled literal strings with the rule named in a comment,
  the one style-value assertion `__tests__/README.md` allows.

## 5. Design

The approach and its invariant, one sentence a test can check: every colon
display the timer renders paints its colons `rgba(255, 255, 255, 0.4)` and its
spent groups `rgba(255, 255, 255, 0.7)` fading to `#ffffff`, on a text style
carrying `fontVariant: ['tabular-nums']`.

Alternatives rejected: D79.3's per-glyph boxes; an opacity prop; a new fade
hook; changing `muted` (all in section 4).

Concurrency: none. The change is static style constants and one hook argument.
No timer, store, subscription or thread is touched; the concurrency table is
empty by inspection of the diff.

Design review: the ruled 599-second format boundary stays (row 72's ruling) and
remains the only group-count change, so within one format the pinned tabular
advance plus the two-glyph padding make every group a fixed-width slot; the
changing digit pair may re-center inside its own group, which her rule allows.
Row 81's seconds dim carve-out and gap doubling land on top of this baseline
next.

**Acceptance criteria:**

- [R1.1] WHEN the timer renders a colon THE SYSTEM SHALL paint it `rgba(255, 255, 255, 0.4)`
- [R1.2] WHEN a digit group renders all zeros THE SYSTEM SHALL paint it `rgba(255, 255, 255, 0.7)` through the slow fade between the dim colour and white
- [R1.3] WHEN a digit group renders above zero THE SYSTEM SHALL paint it `#ffffff`
- [R2.1] WHILE the timer renders any colon display, held or live THE SYSTEM SHALL carry `fontVariant: ['tabular-nums']` on the timer text style, so digit glyphs advance equally and only the changing digit pair may move
- [R4.1] WHEN the delivery step runs THE SYSTEM SHALL install the Debug dev-client build on the connected iPhone XS and leave Metro serving, with no agent-driven interaction with the device

## 6. Steps

- [x] Step 1: the ruled dim levels and the tabular pin (`steps/1-dim-and-tabular.md`, weight 2)
- [x] Step 2: the iOS dev build on the owner's phone (`steps/2-dev-build-delivery.md`, weight 3, dispatches alone)

Batches: step 1 is one batch (weight 2). Step 2 is a device step, its own batch,
and the executor session is replaced after it per the session budget.

## 7. Device proof

None agent-run, by the owner's instruction. Step 2 delivers: the Debug
dev-client build installs on the connected iPhone XS and Metro stays serving.
Her read of the dev build is the acceptance bar for the two dim values (D79.1);
her verdict, when she gives it, lands in the queue cell through the lead. The
audit that closes this ticket reads code and tests only. Evidence for the
delivery lives under `$HOME/athan-gitree/sessions/79/` and dies with the merge.

## 8. Records

The LOG.md entry heading for each step: `### Step 01 — done` and
`### Step 02 — done`, each ending with `session: <ses_id>`.

Step 1's entry records: the branch and commit, the version, the three red lines
from the step's Red tests section, the hook's `Tests:` line and the four
coverage lines, the break script's last line, the review verdict, the merge
sha.

Step 2's entry records: the device state (`device resolved: yes`), the two
build markers with their literal text, the log path under
`$HOME/athan-gitree/sessions/79/`, the Metro pid check line, the version-label
lag note (D79.6), the merge sha.

The queue cell text the lead applies on DONE:

> DONE 2026-10-13, audited: the timer's dim levels land on her corrected
> figures (a spent 00 group white reduced 30 percent, every colon white reduced
> 60 percent, one design in every locale) and the no-shift rule is pinned: the
> timer style carries tabular figures, honored on both platforms at the pinned
> React Native, over the equal-advance Roboto-Medium verified at planning, so
> only the changing digit pair can move; muted untouched for every other
> reader; her dev-build read on the XS is the acceptance bar (she tests, per
> her instruction); row 81 lands next on this baseline

The docs commit message for the DONE merge:

> 2.0.239 - docs(plans): ticket 79 DONE: countdown dim levels and the no-shift
> rule; the plan folder and evidence die with the merge

Step 2 preflights against 2.0.235. The audit fix runs at 2.0.238. The DONE
merge bumps `app.json` (first), `package.json` and `android/app/build.gradle`
to 2.0.239 in the same commit; the
gradle file is gitignored and is never added, only edited on disk.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | What it means | Action |
| --- | --- | --- |
| `tsc` rejects `fontVariant` | The verified type union moved | `STOP:` quoting the error; the lead replans |
| A break substitution assert fails | Step 1's code does not match the contracts | `BREAK NOT APPLIED`, `STOP:` per the executor rules |
| Another suite fails after the mock | The mock escaped its suite or the change leaked | `STOP:` naming the suite and its first failing line |
| The coverage gate flags `shared/constants.ts` | A typo in an entry name | Fix the entry; anything else is `STOP:` |
| `device resolved:` prints empty | The iPhone XS is not connected | Return `BLOCKED:`; the lead tells the owner |
| `xcodebuild` signing failure in the dev build | Signing needs attention the plan cannot give | `STOP:` with the log's last 10 lines; the lead handles it |
| Metro dies after install | Only the server stopped | Restart Metro detached per step 2 item 6 |
| The owner reports different dim figures from her read | D79.1's values are vetoed | A new queue row with her figures; not an executor concern |

Anticipated review fixes: none beyond wording of the two rule comments; if a
reviewer proposes re-anchoring the tests on the `COLORS.countdown` constants,
reject it with section 4's break-script reason.

Per-step restore lists: step 1 restores `shared/constants.ts`,
`components/countdown/Countdown.tsx`,
`components/countdown/__tests__/Countdown.test.tsx`, `app.json`,
`package.json`, and deletes no file (step 1 adds none). Step 2 restores
`ai/plans/README.md`, the plan folder files, `app.json`, `package.json`, and
kills the detached process it started.

## 11. Subagents

Planning used `explore` facts through the codegraph index and scratch proofs in
a removed worktree. Delivery: the lead dispatches the `athan-executor` for
steps 1 and 2 and the `athan-reviewer` twice (blind and plan-conformance) at
audit. No other worker.

## 12. Report to the owner

Plain sentences: the timer's dim parts now sit at her two corrected figures,
the timer carries tabular digits so nothing shifts but the changing pair, the
dev build is on her iPhone with Metro running, and row 81 runs next. The
progress table, then the four-line handoff, close the report.