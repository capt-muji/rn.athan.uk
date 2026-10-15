# Ticket 85: Countdown time display: lowercase h m s letters in every language

| Field | Value |
| --- | --- |
| Brief | Queue row 85, `ai/plans/README.md` |
| Planned at | `f70eaf8e`, 2.0.730, 2026-10-15 |
| Planned by | The planning session of 2026-10-15, owner-interviewed live |
| Needs first | nothing |
| Parent | none |
| Group | the countdown display layer: `components/countdown/Countdown.tsx`, `shared/time.ts`, `shared/constants.ts`. Row 83's ago badge (now in the backlog) reads `formatTimeAgo` and `splitSingleColon` in `shared/time.ts`, which this ticket edits: same group, rows serialize (85 first) |
| Batch budget | 2 |
| Session budget | 2 |
| Steps count | 1 |
| Device | none. The owner read the lettered face on her iPhone XS across the live session and ruled it final; jest and review are the proof vehicles |
| Owner decisions still needed | none. The frontier closed 2026-10-15 |

## 1. Goal

The countdown TIME display at the top of both schedules renders the colon design
rows 82/84 landed. The owner ruled on 2026-10-15 that it returns to the lettered
design in EVERY language: unpadded digit groups, each followed by a small lowercase
h, m or s. When DONE the countdown reads `2h 29m` at two and a half hours, `1h`
at a whole hour with seconds hidden, `45s` under a minute, identically in all six
locales, and no remnant of the colon display machinery survives in the repo.

The behaviour is not new design: it is the pre-colon lettered behaviour, byte for
byte. The owner's rule: "it has to match behaviour wise, it has to match exactly
to what we previously had a long time ago... I'm literally only changing the
letter H, the letter M and letter S." The reference is the lettered formatter
that served from 2024-11-17 (`fb42c372` era, `hours && ... , minutes && ...`
falsy-drop composer) through `194ed701` (2.0.128, row 72's pinned pre-63
reference). Her rules that apply:

- Zero groups drop, unpadded digits, `0s` alone never an empty row (the old
  composer, git-verified both eras).
- Lowercase letters, about 55 percent of digit size, faint ink `rgba(160, 200, 255, 0.4)`
  (tuned live with her on the XS from 0.45 through 0.35 to 0.4), digits full brightness.
- Letters ride the digits' baseline inside one text run (the old design's own
  mechanism; two-view alignment was tried and rejected live).
- A 2 point gap between a digit and its letter: a space glyph span at fontSize 8
  (Roboto-Medium's space advance is 510/2048 em, so 8 pt renders 1.99 pt). She
  ruled the gap down from the full space.
- Latin digits in every language (row 82's ruling, unchanged).
- The show-seconds preference still drops the whole seconds group; the store and
  its formatTime are untouched.
- The countdown bar and the mosque SVG stay exactly as they are.
- Visual approval is FINAL, taken live on the device across the session: "This is
  perfect for all languages." No pixel may move. Her standing approval replaces a
  device step: "Current approval stands."

## 2. Decisions

### 2.1 Taken

| What | Who | When | Where |
| --- | --- | --- | --- |
| Lettered design returns for every language, lowercase h m s | owner | 2026-10-15 | row 85, this session |
| Letters 55 percent size, ink `rgba(160, 200, 255, 0.4)`, digits full brightness | owner | 2026-10-15 | live tune 0.45 to 0.35 to 0.4, this session |
| Letters inline on the digits' baseline, one text run | owner | 2026-10-15 | this session, after the two-view alignment read as 2 px off |
| 2 point digit-letter gap (space span, fontSize 8) | owner | 2026-10-15 | this session, "2 spacing instead" |
| Behaviour parity with the old lettered formatter, git-verified | owner | 2026-10-15 | this session; references `fb42c372` era and `194ed701` |
| Space between digit and letter kept (old design had none) | owner | 2026-10-15 | question round, this session |
| No final device read; approval stands; jest and review close the ticket | owner | 2026-10-15 | question round, this session |
| Dead-code sweep: every remnant of the colon countdown designs goes | owner | 2026-10-15 | this session, "production ready" |
| The quick pass's uncommitted implementation is the handed-over file | planner | 2026-10-15 | `handed/Countdown.tsx.txt`, owner-approved on device |

### 2.2 The executor must not decide

- Any visual value: colour, size, gap, spacing, font. The face is approved. A
  test-coverage shortfall that seems to need a visual change is `STOP:` to the
  owner.
- Whether the ago badge, reminder copy, overlay timer or widgets change: they do
  not. The ago badge keeps `formatTimeAgo` and `splitAgoSections` untouched.
- Whether `formatTime`, `formatTimeSecondsAware` or any store selector changes:
  they do not; the display string reaching `Countdown` stays `HH:MM` or
  `HH:MM:SS`.

## 3. Pre-flight

`scripts/preflight-85.sh`, committed with this plan. It checks the `uat`
checkout, a clean tree (only `ai/plans/README.md` and this plan folder's files),
`origin/uat` merged in, the version not lower than 2.0.730, and every anchor
count exactly 1. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Code map (anchors under `scripts/anchors/`, verified at `f70eaf8e`):

- `components/countdown/Countdown.tsx` (a1, a2): the colon-era component. It
  splits the display string with `splitColonSections`, renders per-digit nodes,
  colon dot Views, and a dim/padding-zero colour animation through
  `useDerivedColor`. The lettered rewrite replaces the whole render; the prayer
  name line, the held single-node branch, the overlay scale transform, the bar
  mount and the null guard are carried over unchanged.
- `shared/time.ts` (a3, a4): `splitColonSections` and `CountdownSection` exist
  only to serve the colon countdown; `ALL_DIGITS` and `ALL_ZEROS` exist only
  inside `splitColonSections`. After this ticket the component parses the string
  itself and these four symbols die. `formatTime` (a5) is untouched: it still
  emits `HH:MM`/`HH:MM:SS`, pinned by its own JSDoc examples in
  `shared/__tests__/time.test.ts`. `formatTimeAgo` and `splitSingleColon`
  (the ago badge's helpers, `components/prayer/Ago.tsx`) are NOT part of this
  ticket; the sweep rewords the one `splitColonSections` mention in
  `splitSingleColon`'s JSDoc so the grep gate stays clean.
- `shared/constants.ts` (a6): `COLORS.countdown.dimDigit` and
  `COLORS.countdown.colon` are the colon design's ink. Production readers: none
  after this ticket (`COUNTDOWN_BAR.TRACK_COLOR` carries its own literal;
  `Time.tsx` reads `timeColon`, `nextTimeColon`, `nextTimeColonExtras`, which
  stay).
- `scripts/directional-styles-allowlist.json`: the two
  `components/countdown/Countdown.tsx` entries for the colon ink-compensation
  margins. The lettered render deletes their lines, and the gate holds no
  allowlist entry whose line is gone, so the entries leave with the component.
- `shared/__tests__/time.test.ts` (a7): the `splitColonSections` describe and its
  import die with the helper.
- `shared/__tests__/constants.test.ts` (a8): pins `TRACK_COLOR` to
  `COLORS.countdown.dimDigit`; the pin moves to the literal when the key dies.
- `components/countdown/__tests__/Countdown.test.tsx`: the colon suite. Replaced
  wholesale by `handed/Countdown.test.tsx.txt`.
- `hooks/useCountdown.ts`, `stores/countdown.ts`: read-only context. The display
  selector formats `timeLeft` through `formatTimeSecondsAware` (seconds hidden
  gives `HH:MM`, always hours-first); `timeLeft: null` gives the held
  `--:--` that keeps the single-node branch.
- `__tests__/app/Screen.test.tsx`: asserts the progressbar and page structure
  only. No countdown-digit assertions. Unchanged.

Concurrency: none. The component is a pure render over render-granular atoms;
no timers, no worklets, no subscriptions were added. The overlay transform is
unchanged Reanimated code.

Why the obvious fix is wrong: keeping `splitColonSections` as the parser. Its
`dim` semantics (spent with larger groups spent) are the colon design's rule and
contradict the old lettered rule the owner pinned (a zero minutes group drops
beside live hours, `1h` not `1h 0m`). The component's local parse implements the
lettered rule and leaves no consumer for the helper.

## 5. Design

The countdown draws one lettered group per live digit group: the display string
`HH:MM(:SS)` parses to numbers, each number renders unpadded followed by a
2-point gap and its lowercase unit letter, and a zero-valued group renders nothing
except the seconds at zero alone. The enumerated instants pin the old composer's
zero-drop rule: `2h 29m`, `1h` alone, `42m`, `1h 5s`, `45s`, `9m`, `0s` alone.

Alternatives rejected:
- Rendering letters as sibling Views with flex-end alignment and a computed lift:
  tried live; the owner read sub-pixel drift, and the mechanism cannot guarantee
  the baseline. Inline spans give it by construction.
- Keeping `splitColonSections` and deriving spent from `dim`: contradicts the
  ruled behaviour; also keeps dead machinery the owner ordered swept.
- Per-digit nodes for fade animation: the dim model died with the colon design;
  digits are static full-brightness text.

Acceptance criteria:

- [R1.1] WHEN the display string is `HH:MM` or `HH:MM:SS` THE SYSTEM SHALL render one group per non-zero-valued unit, digits unpadded, each group one text run ending in its lowercase unit letter (h, m, s by group order).
- [R1.2] WHEN a group's value is zero THE SYSTEM SHALL render no node for it, except that the seconds group at zero renders alone as `0s` when no other group renders.
- [R1.3] WHEN the display string is not a colon time THE SYSTEM SHALL render it as one text node, unchanged.
- [R1.4] WHEN the seconds preference is off and the remaining time exceeds 599 s THE SYSTEM SHALL render no seconds group.
- [R1.5] WHILE any of the six locales is active THE SYSTEM SHALL render Latin digits left to right with the same h, m, s letters and ink, each locale at its own `countdownSize`.
- [R1.6] WHEN a group renders THE SYSTEM SHALL draw its letter at `Math.round(0.55 x countdownSize)` in `rgba(160, 200, 255, 0.4)` after a gap span of fontSize 8, its digits at `COLORS.text.primary` with `fontVariant: ['tabular-nums']` and the familyDigits face.
- [R1.7] WHEN a row of groups renders THE SYSTEM SHALL expose the composed unpadded label as its accessibility label (`2h 29m` at 2h29m).
- [R2.1] WHEN both steps merge THE SYSTEM SHALL have zero references in production code to `splitColonSections`, `CountdownSection`, `ALL_DIGITS`, `ALL_ZEROS`, `COLORS.countdown.dimDigit` or `COLORS.countdown.colon`, proven by the step 2 grep printing nothing.
- [R2.2] WHEN the sweep merges THE SYSTEM SHALL keep every other behaviour of `shared/time.ts` and `shared/constants.ts`: the full jest suite green with no test weakened.
- [R3.1] WHEN either step's pre-commit hook runs THE SYSTEM SHALL print a `Tests:` line ending `passed, <n> total` with four `100%` coverage lines.

## 6. Steps

Checklist:

- [ ] Step 0 — Restore the tree (`git checkout uat` after the planning merge;
      the branch `85-countdown-letters` carries no commits beyond `uat`, so
      `git branch -D 85-countdown-letters`; `git restore
      components/countdown/Countdown.tsx opencode.json` — the lettered
      implementation survives verbatim in `handed/Countdown.tsx.txt`). Then copy
      `scripts/preflight-85.sh` to `$TMPDIR`, run it, expect `PREFLIGHT OK`.
- [ ] Step 1 — The lettered countdown lands with the sweep, atomically (`steps/1-lettered-countdown.md`)


Weights: step 1 code 4 — the hook's gates enforce the atomic landing (the
lettered component alone makes the colon allowlist stale and
`splitColonSections` test-only-reachable, so no intermediate commit is green).
Batch budget 4, session budget 4: one executor session, one batch, no device
step. The step subsection lives in `steps/1-lettered-countdown.md` and carries
Requirements, anchors, branch, files, red, change contracts, green run, break
scripts, version, commit message, review checklist, merge and done-when.

## 7. Device proof

None. The owner's live reads across the session are the visual acceptance
(closing decision in section 2.1). No build, no APK, no phone.

## 8. Records

The lead applies on DONE this queue cell text:

`DONE 2026-10-<dd>, audited: the countdown TIME display is the lettered design in every language - unpadded Latin digit groups with small faint lowercase h m s on the digits' baseline (inline spans, 2 pt gap, ink rgba(160, 200, 255, 0.4)), the 2024-11 composer's exact zero-drop behaviour ported and git-verified (1h at a whole hour, seconds never 0s but alone), the colon machinery (splitColonSections, dim inks, per-digit fades) swept dead, bar and mosque untouched; owner-approved live on the XS across the session`

Docs commit message for the planning commit:

`2.0.731 - docs(plans): ticket 85 planned: lettered countdown in every language, old behaviour ported, colon remnants swept`

LOG.md ledger contract: every step entry opens `### Step <NN> - <state>` and ends
`session: <ses_id>`. Planning sections use `## Planning (<date>)` and
`## Ticket <N>`.

## 9. Push

None. The executor never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Meaning | Action |
| --- | --- | --- |
| A handed test passes against uat before the component change | The test does not prove the change | STOP: name the test; do not weaken it |
| `Unable to find an element with text: 2 H` is not the first red | The harness or fixture drifted | STOP: quote the actual failure |
| `grep` after the sweep finds a removed symbol in production code | A reader the plan missed | STOP: the plan's map is wrong, NEEDS REPLAN |
| `time.test.ts` fails outside the removed describe | The sweep touched live behaviour | Revert the sweep edit, STOP |
| The hook rejects the commit on `versionLockstep` | The gradle file lags | Set all three version places, commit again; never `--no-verify` |

Anticipated review fixes, word for word:

- "The gap span reads as a magic fontSize" - none: the derivation (510/2048 em)
  lives in this plan and the queue row, not in a styling comment, per the comment
  rules.
- "The row keeps `direction: 'ltr'` under ar" - correct and ruled: identical in
  every language (R1.5).
- "Held `--:--` keeps `fontVariant: ['tabular-nums']`" - correct: the held
  branch is carried over unchanged.

Restore lists: step 1 restores `components/countdown/Countdown.tsx` and its test
from `uat`; step 2 restores `shared/time.ts`, `shared/constants.ts` and their
tests from `uat`.

## 11. Subagents

Planning: `explore` for facts, `athan-plan-griller` for the grill. Delivery: the
lead dispatches `athan-executor` (steps 1 to 2, one batch, weight 4) and two
`athan-reviewer` passes (plan-conformance, blind). `vision` is not needed: no
images.

## 12. Report to the owner

Plain sentences: the lettered countdown landed with its full test suite at 100
percent coverage, the colon machinery is gone, the reviews passed, `uat` pushed.
Then the progress table and the four-line handoff.
