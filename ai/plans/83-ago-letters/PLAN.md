# Ticket 83: The time-ago badge: the countdown's lettered format

| Field | Value |
| --- | --- |
| Brief | Queue row 83, `ai/plans/README.md` |
| Planned at | `d9a4408a`, 2.0.734, 2026-10-15 (the lane's anchor: local `uat` carrying `5a3fba84`, the lettered countdown) |
| Planned by | The planning session of 2026-10-15, lane 83 of the multi-lead run (owner rulings from the queue row; interview waived) |
| Needs first | 85 (landed: `5a3fba84` 2.0.733 is an ancestor of the lane's HEAD; the row's DONE fold may land separately on the main checkout and does not block this lane) |
| Parent | none |
| Group | the ago badge surface: `shared/time.ts` (`formatTimeAgo`, the new `splitAgoDuration`), `components/prayer/Ago.tsx`, their tests. Row 88 (Latin numerals everywhere; the notification unit word) waits behind this ticket on `shared/time.ts` and the catalogs: this plan touches no catalog and no notification, widget, sheet, date or info-box surface |
| Batch budget | 2 |
| Session budget | 2 |
| Steps count | 1 |
| Device | none. The badge's letters ride the countdown's ruled typography, owner-settled by row 85's live XS approval; jest and review are the proof vehicles |
| Owner decisions still needed | none. The row's ruling is the interview record; the one planner-adjudicated detail (the letter span's ink) carries its lineage in section 2.1 |

## 1. Goal

The badge under the prayer list says how long ago the previous prayer was. Today it
renders the colon shape row 82 landed: `formatTimeAgo` returns `H:MM` (`0:58`), and
`Ago.tsx` splits the composed sentence on that colon and draws it with thin-space
gaps at 40 percent strength. The owner ruled on 2026-10-15 (queue row 83) that the
badge takes the countdown timer's lettered format instead, reversing row 82's badge
shape on the same grounds as row 85:

> "the badge takes the countdown timer's lettered format EXACTLY as the old design
> held it - hours and minutes only, no seconds: `5h 20m` at five hours twenty, `33m`
> under an hour, the unpadded Latin digits and lowercase h m letters FIXED in every
> language (they never localise), only the surrounding words localising (the ago
> word, the `now` word under 60 seconds, from the catalogs)."

When DONE the badge reads `Dhuhr 58m ago` at fifty-eight minutes, `Duha 7h 14m ago`
at seven hours fourteen, `Dhuhr 3h ago` at a whole three hours, in all six locales
with the same unpadded Latin digits and the same lowercase `h` `m` letters, the
catalog `now` sentence unchanged inside the final 60 seconds. The letters draw at
55 percent of the badge's digit size on the digits' baseline inside one text run,
each behind a 2 point gap span, exactly the ruled typography row 85's landed
component holds. No remnant of the badge's colon machinery survives in `Ago.tsx`.

The behaviour is the pre-row-63 lettered composer, git-verified at `194ed701`
(2.0.128, row 72's pinned reference): `formatTimeAgo` returned `2m` under an hour,
`1h 30m` at ninety minutes, `2h` at a whole hour (the zero-minute group drops),
`now` under 60 seconds. The old composer took its letters from the catalogs and its
digits from the locale digit map; both localisations are gone from the app (rows 82
and 85), and this row's ruling fixes the letters and digits Latin, so the port
keeps the shape and drops the localisation.

## 2. Decisions

### 2.1 Taken

| What | Who | When | Where |
| --- | --- | --- | --- |
| The badge takes the lettered format: `5h 20m`, `33m`, `Xh` at a whole hour, no seconds ever | owner | 2026-10-15 | queue row 83 |
| Unpadded Latin digits and lowercase `h` `m` fixed in every language; only the ago word and the `now` word localise, from the catalogs | owner | 2026-10-15 | queue row 83 |
| The letters ride the countdown's ruled typography: 55 percent size, the digits' baseline, inline spans, the 2 point gap span, as row 85's landed component holds it | owner | 2026-10-15 | lane instruction grounding row 85's live XS approval |
| The catalog keys `time.ago`, `time.now`, `duration.now` stay byte-identical; no catalog file changes | owner | 2026-10-15 | queue row 83 (the surrounding words localise from the catalogs) |
| Zero-minute group drops beside live hours (`3h`, never `3h 0m`), the old composer's rule | owner | 2026-10-15 | queue row 83 ("EXACTLY as the old design held it"); composer verified at `194ed701` |
| The letter span draws at 40 percent of the badge's own ink (style `opacity: 0.4`) | planner | 2026-10-15 | adjudicated, not defaulted: rows 79(3) and 81 ruled the badge's weak glyph at 60 percent reduction (40 percent strength), the mechanism the badge's colon span already carries at `opacity: 0.4`; row 85's letter ink `rgba(160, 200, 255, 0.4)` is the same 40 percent figure in the countdown's own fixed-ink context. The badge's colour animates (prayerAgo text to feedback success), so a relative opacity is the only implementation that holds in both states. Recorded here for the owner's veto |
| One step, one commit: the formatter, the splitter, the badge render and every test land atomically | planner | 2026-10-15 | this session; the hook's coverage gate enforces the atomic landing |

### 2.2 The executor must not decide

- Any visual value: colour, size, gap, opacity, font, baseline. The face is ruled.
  A coverage shortfall that seems to need a visual change is `STOP:` to the owner.
- Whether the prayer row time (`components/prayer/Time.tsx`), the countdown, the
  overlay, reminder titles, widgets or notifications change: they do not.
  `splitSingleColon` stays in `shared/time.ts` because `Time.tsx` reads it.
- Whether any catalog key, the catalogs' lock file, or anything row 88's row names
  changes: it does not. This ticket's surface is `formatTimeAgo`, the new
  `splitAgoDuration`, `Ago.tsx` and their tests.
- Whether `usePrayerAgo`'s contract changes: it does not. Its JSDoc examples and
  its tests' mock strings follow the new duration shape, nothing else.

## 3. Pre-flight

`scripts/preflight-83.sh`, committed with this plan. It checks the lane worktree
on `lane/83`, a clean tree beyond the plan folder,
`5a3fba84` an ancestor of HEAD (row 85 landed, the "Needs first" fact), the
version not lower than 2.0.735, and every anchor count exactly 1. It ends
`PREFLIGHT OK`.

## 4. Background the executor needs

Code map (anchors under `scripts/anchors/`, verified at `d9a4408a`):

- `shared/time.ts` (a1, a2): `formatTimeAgo` (a1) returns the catalog `now` word
  under 60 seconds and `H:MM` otherwise, pinned by its own JSDoc examples in
  `shared/__tests__/time.test.ts`. The rewrite keeps the `now` branch and the
  seconds floor, replaces the colon composition with the lettered groups, and
  drops the `pad2` use from this function (`pad2` keeps its other readers).
  `splitSingleColon` (a2) stays untouched: `Time.tsx` reads it for the prayer row
  time. The new `splitAgoDuration` lands directly under `formatTimeAgo`.
- `components/prayer/Ago.tsx` (a3, a4): the badge. `usePrayerAgo` hands it the
  composed sentence (`t('time.ago', { name, duration })`), today split on the
  single colon (a3) and drawn with a thin-space colon span whose style block (a4)
  is `colon: { opacity: 0.4 }`. The rewrite splits the sentence around the
  lettered duration with `splitAgoDuration`, renders the surrounding words plain,
  and renders each duration group as digits plus a gap span plus a letter span,
  the same three-node shape `Countdown.tsx` renders for its groups.
- `components/countdown/Countdown.tsx` (read-only, the ruled typography's
  source): `gap: { fontSize: 8 }` and `unitLetter` at
  `Math.round(ty.countdownSize * 0.55)`, inline `Text` spans inside the digit
  run. The badge ports the shape at its own digit size
  `ty.size(TEXT.sizeDetail)` (14 in every locale today), so its letter size is
  `Math.round(ty.size(TEXT.sizeDetail) * 0.55)`.
- `hooks/usePrayerAgo.ts` (read-only): composes the sentence. No contract change.
- `shared/__tests__/time.test.ts` (a5): the `formatTimeAgo` describe pins the
  colon values and the one-design-in-every-locale rule; the `splitSingleColon`
  describe below it stays. The `formatTimeAgo` tests are rewritten to the
  lettered values, and a `splitAgoDuration` describe is added beside
  `splitSingleColon`'s.
- `components/prayer/__tests__/Ago.test.tsx` (a6): pins the badge's sentences,
  the ar render, the now sentence, the fade and the row-81 styling (the weak
  glyph at 0.4, the badge lifted to `marginTop: -4`). Rewritten to the lettered
  sentences and letter-span styling.
- `__tests__/app/Screen.test.tsx` (a7): three composed-sentence assertions carry
  the thin-space colon; they move to the lettered sentences with the default
  text normalizer.
- `hooks/__tests__/usePrayerAgo.test.ts` (a8): mocks `formatTimeAgo`, so its
  assertions cannot go red; its mock strings and expected sentences retune to
  the lettered shape for fidelity.
- `shared/i18n/*.ts` (read-only): `time.ago`, `time.now`, `duration.now` keys in
  six catalogs. The duration placeholder receives the lettered string; the
  placeholder position varies (`قبل` before the duration in ar, `ที่แล้ว` glued
  after it in th), which is why the badge splits the composed sentence rather
  than concatenating parts.

Concurrency: none. The badge is a pure render over a hook that rides the shared
wall-clock tick; no timers, no worklets, no subscriptions change.

Why the obvious fix is wrong: keeping `splitSingleColon` and feeding it a colon.
The ruled duration carries no colon, so the helper would return null and the
badge would fall back to a plain unstyled sentence; the letters would draw full
size and full ink, which the row's typography ruling forbids.

## 5. Design

`formatTimeAgo` composes the lettered duration with the old composer's zero-drop
rule, fixed Latin: `Xm` under an hour, `Xh Ym` at five hours twenty, `Xh` at a
whole hour, the catalog `now` word under 60 seconds. `splitAgoDuration` finds that
duration inside any catalog sentence (digits appear nowhere else in the sentence,
so the pattern cannot match elsewhere) and returns the surrounding words with the
duration's digit-letter groups. `Ago.tsx` renders the words plain and each group
as digits, gap span, letter span, inside the one animated text run.

The design's invariant, one sentence a test checks: in every locale the badge's
composed text is the catalog sentence with the lettered duration in place, and
every unit letter is a span at 55 percent of the badge's digit size and 40
percent opacity.

Alternatives rejected:

- Restructuring `usePrayerAgo` to return name, duration and words separately: the
  catalog interpolation would move into the component, re-implementing `t()` per
  locale word order (ar puts `قبل` before the duration, th glues `ที่แล้ว` after
  it). Splitting the composed sentence keeps one interpolation path.
- Rendering the letters as sibling Views with flex-end alignment: row 85 tried
  and rejected this live (sub-pixel baseline drift); inline spans give the
  baseline by construction.
- Keeping the thin-space gap spans around the letters (the badge's colon
  treatment): the ruled gap is the countdown's 2 point span, one per letter, not
  thin spaces on both sides of a colon.

Acceptance criteria:

- [R1.1] WHEN at least 60 seconds have elapsed since the previous prayer THE SYSTEM SHALL compose the ago duration as unpadded Latin digits with lowercase h m letters, hours and minutes only: `Xm` under an hour, `Xh Ym` with both groups live, `Xh` at a whole hour with the zero-minute group dropped.
- [R1.2] WHEN fewer than 60 seconds have elapsed THE SYSTEM SHALL show the catalog `now` sentence unchanged, with no letter span and no gap span.
- [R1.3] WHILE any of the six locales is active THE SYSTEM SHALL keep the duration's digits and h m letters identical Latin bytes, with only the surrounding catalog words localising.
- [R1.4] WHEN a duration renders inside the badge THE SYSTEM SHALL draw each letter as an inline span at `Math.round(0.55 x the badge's digit size)` with `opacity: 0.4`, preceded by a gap span holding a space at `fontSize: 8`, the digits and the surrounding words inheriting the badge's own animated style.
- [R1.5] WHEN the composed sentence reaches the badge THE SYSTEM SHALL split it around the lettered duration, rendering the words before and after as plain inherited text.
- [R2.1] WHEN the step merges THE SYSTEM SHALL leave `Ago.tsx` with no colon span, no `splitSingleColon` import and no thin-space literal, while `shared/time.ts` still exports `splitSingleColon` for `Time.tsx`.
- [R2.2] WHEN the step merges THE SYSTEM SHALL keep every other behaviour green: the full jest suite passes with no test weakened, and `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.
- [R3.1] WHEN the step's pre-commit hook runs THE SYSTEM SHALL print a `Tests:` line ending `passed, <n> total` with four `100%` coverage lines.

## 6. Steps

Checklist:

- [ ] Step 1 — The lettered ago badge lands with its suite, atomically (`steps/1-lettered-ago.md`)

Weights: step 1 code 2. Batch budget 2, session budget 2: one executor session,
one batch, no device step. The step subsection lives in `steps/1-lettered-ago.md`
and carries Requirements, anchors, branch, files, red, change contracts, green
run, break script, version, commit message, review checklist, merge and
done-when.

## 7. Device proof

None. The badge's typography is owner-settled through row 85's live XS approval
and the row 83 ruling; jest and the two review passes are the proof vehicles. No
build, no APK, no phone.

## 8. Records

The lead applies on DONE this queue cell text:

`DONE 2026-10-<dd>, audited: the ago badge renders the countdown's lettered duration in every language - unpadded Latin digits with lowercase h m at 55 percent size on the digits' baseline behind the 2 point gap span (the badge's own ink at 40 percent), 5h 20m at five hours twenty, 33m under an hour, the zero-minute group dropping, seconds never; the surrounding catalog words alone localise and the now sentence is unchanged; the badge's colon shape is gone while splitSingleColon stays for the row time`

Docs commit message for the planning commit:

`2.0.735 - docs(plans): ticket 83 planned: the ago badge takes the lettered duration, fixed Latin letters, the colon shape dies in the badge`

Docs commit message for the executed commit:

`2.0.737 - docs(plans): ticket 83 executed: the lettered ago badge in every language`

LOG.md ledger contract: every step entry opens `### Step <NN> — <state>` and ends
`session: <ses_id>`. Planning sections use `## Planning (<date>)` and
`## Ticket <N>`.

Lane record: the hook regime. The lane runs the real pre-commit hook
(`core.hooksPath` is the relative `.husky/_`, `npx husky` re-created it in the
lane worktree, verified `ls .husky/_/h` prints it), so every lane commit runs the
four gates by hook and the executor captures the `Tests:` line and the four
coverage lines into LOG.md. No manual-gate regime holds.

## 9. Push

None. The executor never pushes. The lead merges the lane into the main
checkout's `uat` under the version lock and pushes only the audited result.

## 10. When something goes wrong

| Symptom | Meaning | Action |
| --- | --- | --- |
| `formatTimeAgo` lettered tests pass before the code change | The tests do not prove the change | STOP: name the test; do not weaken it |
| `splitAgoDuration` matches inside a prayer name or catalog word | A locale carries digits in a word | STOP: quote the sentence; the owner rules the exception |
| `time.test.ts` fails outside the rewritten describes | The change touched live behaviour | Revert the edit, STOP |
| The hook rejects the commit on `versionLockstep` | The gradle file lags | Set all three version places, commit again; never `--no-verify` |
| `Ago.test.tsx` cannot find `'Dhuhr 58 m ago'` | The composed text differs from the plan's prediction | Quote `screen.debug()` output; STOP before weakening the matcher |

Anticipated review fixes, word for word:

- "The letter span's ink should be row 85's `rgba(160, 200, 255, 0.4)`" - no: the
  badge's colour animates between two states; the ruled 40 percent strength is
  carried as `opacity: 0.4` on the span, the mechanism the badge's weak glyph
  already uses (decision 2.1, with lineage).
- "The gap between the two groups renders as a plain space" - correct: the ruled
  2 point gap span sits between a digit and its letter; the group separator is
  the sentence's own space, matching `formatTimeAgo`'s output.
- "`splitSingleColon` is dead after this" - no: `components/prayer/Time.tsx:58`
  reads it; only the badge's import goes.

Restore lists: step 1 restores `shared/time.ts`, `components/prayer/Ago.tsx`,
`shared/__tests__/time.test.ts`, `components/prayer/__tests__/Ago.test.tsx`,
`__tests__/app/Screen.test.tsx`, `hooks/__tests__/usePrayerAgo.test.ts`,
`hooks/usePrayerAgo.ts`, `app.json`, `package.json` from `lane/83`.

## 11. Subagents

Planning: `athan-plan-griller` for the grill. Delivery: the lead dispatches one
`athan-executor` (step 1, one batch, weight 2) and two `athan-reviewer` passes
(plan-conformance, blind). `vision` is not needed: no images.

## 12. Report to the owner

Plain sentences: the lettered ago badge landed with its full test suite at 100
percent coverage, the colon shape died in the badge, the reviews passed, the lane
merged. Then the progress table and the four-line handoff.
