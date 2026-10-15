# LOG — ticket 83, the time-ago badge takes the lettered format

## Ticket 83

## Planning (2026-10-15)

Lane 83 of the multi-lead run (queue Order section, suspension of 2026-10-15).
Anchor: `d9a4408a` 2.0.734, local `uat` carrying `5a3fba84` (row 85's lettered
countdown, 2.0.733). The owner interview is waived: queue row 83's ruling is the
interview record.

Research done, all verified in the lane worktree:

- The old lettered composer read at `194ed701` (2.0.128): `2m`, `1h 30m`, `2h`
  at a whole hour (zero-minute drop), `now` under 60 s, letters from the
  catalogs and digits through the locale digit map (both localisations now
  dead: rows 82 and 85).
- `formatTimeAgo` today returns `H:MM` (row 82); its only reader is
  `hooks/usePrayerAgo.ts:35`.
- `splitSingleColon` has two readers: `components/prayer/Ago.tsx:55` (this
  ticket) and `components/prayer/Time.tsx:58` (the prayer row time, stays).
- The ruled typography's source: `components/countdown/Countdown.tsx` styles
  `gap: { fontSize: 8 }` and `unitLetter` at `Math.round(ty.countdownSize *
  0.55)`, landed by row 85.
- Affected test surfaces: `shared/__tests__/time.test.ts` (formatTimeAgo
  describe), `components/prayer/__tests__/Ago.test.tsx` (whole file),
  `__tests__/app/Screen.test.tsx` (three assertions),
  `hooks/__tests__/usePrayerAgo.test.ts` (mock strings; mocked, cannot go red).
- No e2e flow asserts the badge (grepped `e2e/flows/`).
- The lane runs the real pre-commit hook: `core.hooksPath` `.husky/_`
  (relative), `npx husky` re-created it, `ls .husky/_/h` prints it. Every lane
  commit runs the four gates by hook; no manual regime holds.
- tsc baseline in the lane: exit 0 (the shared node_modules patches hold).

Planner-adjudicated, recorded in PLAN.md 2.1 for the owner's veto: the letter
span's ink is the badge's own ruled weak-glyph strength, `opacity: 0.4`
(rows 79(3)/81's 60 percent reduction; row 85's letter ink is the same 40
percent figure in a fixed-ink context, unusable here because the badge's colour
animates).

Drafted: PLAN.md, steps/1-lettered-ago.md, handed/Ago.test.tsx.txt,
scripts/preflight-83.sh, scripts/break-1.sh, anchors a1 to a8 (all count 1 at
`d9a4408a`).

Grill (subagent, one round): eight findings; seven applied (the unretuned
`keeps Latin digits under en` test, the break script's wrong-file restore and
its diff-on-dirty-tree check, the handed file's over-120 columns, the docblock
sentence scope, the preflight text mismatch, the Fragment import wording), one
rejected with the file as proof (LOG.md existed with the required headings).
Gate: `bash scripts/check-plan.sh ai/plans/83-ago-letters` printed PLAN OK.

Scratch proof (throwaway, reverted, never committed): the plan's change applied
per contracts in the lane tree. Observed: time.test 130 passed, Ago.test 9
passed, Screen.test 4 passed, usePrayerAgo.test 16 passed, tsc exit 0, biome
exit 0 on all seven changed files. Two proof corrections folded into the step
file (the Screen assertion keeps its four-space indent on one line; the
Fragment import sits under the jotai import). The tree restored clean after.

READY commit: `edadec30` 2.0.735, hook green (`Tests: 2 skipped, 5641 passed,
5643 total`). Ticket READY on lane/83.

Resume from: execution, step 1.

## Execution stop 1 (2026-10-15)

The first executor run stopped clean at the coverage gate: every red and green
prediction held (time.test 4 red as named, `Dhuhr 3 m ago` the first Ago
failure, 130/13/16 green, tsc 0, biome 0, `ALL AS EXPECTED: 1`), but the hook's
global branch threshold failed at 99.95 (2297/2298): the plan-verbatim line
`const index = match.index ?? 0;` in `splitAgoDuration` carries a fallback
branch no test can take, because a non-null `String.match` always has `index`.
Planning missed it: the scratch proof ran per-file jest, never the full
coverage gate.

Repair (planner, this session): the contract now derives the offset with
`value.indexOf(duration)` — always a number, no unreachable branch, no
assertion. The break script's mutation targets are untouched by the change.
The repaired contract is proven under the exact hook gate (`jest --silent
--coverage` full suite) before redispatch: exit 0, 214 suites, 5642 passed +
2 skipped, Statements/Branches/Functions/Lines all 100% (Branches 2296/2296;
the failed run's 2298 included the two unreachable paths the repair removes).
Evidence from
the stop: `~/athan-gitree/sessions/83/step1-unfinished.patch` (the 654-line
working step), `step1-hook-failure.log`, `step1-unfinished-status.txt`.

Resume from: execution, step 1, repaired contract, fresh executor session.

### Step 1 — stopped: hook rejects the plan-verbatim ?? 0 branch

Branch `83-ago-letters` off `lane/83` (`edadec30` 2.0.735). Preflight (copied to
`$TMPDIR`, run from the lane root): `PREFLIGHT OK`.

Red, observed against the unmodified tree exactly as predicted: time.test 4
failed (`formatTimeAgo(60)` received `'0:01'` expected `'1m'`; ar received
`'0:02'` expected `'2m'`; `splitAgoDuration` not a function; the hours rows the
same way), Ago.test first failure `Unable to find an element with text: Dhuhr 3
m ago`, Screen.test `Unable to find an element with text: Dhuhr 58 m ago` (old
colon sentence still rendered). The usePrayerAgo mock retune carries no red
(mocked), as planned.

Change per contracts: `formatTimeAgo` lettered with the zero-minute drop, new
`splitAgoDuration` + `AgoLetterGroup` under it (above `splitSingleColon`, which
stays), `Ago.tsx` splits on `splitAgoDuration`, renders digits + gap span
(fontSize 8) + letter span (55 percent size, opacity 0.4) per group inside the
one animated run, `Fragment` import under jotai, docblock sentence to `Xh Ym`,
`colon` style replaced by `gap`/`unitLetter`.

Green: time.test 130 passed, Ago.test 9 + Screen.test 4 = 13 passed,
usePrayerAgo 16 passed; `npx tsc --noEmit` exit 0; `npx biome check .
--error-on-warnings` exit 0 (439 files).

Break: `bash ai/plans/83-ago-letters/scripts/break-1.sh` printed
`ALL AS EXPECTED: 1` (all four mutations caught: the 59 s now boundary, the
zero-minute drop, the `|\d+m` pattern branch, the letter opacity); tree clean
beyond the step's files and the plan folder.

Version: lock acquired (0 waits), origin fetched, lane at 2.0.735, step takes
2.0.736; app.json first, then package.json, `npx biome check --write` clean on
both; `android/app/build.gradle` absent in this worktree (versionLockstep
skips it). Row 83 set to `IN PROGRESS, step 1`.

STOP at commit: the pre-commit hook rejected the step commit on the coverage
gate. `Branches: 99.95% ( 2297/2298 )` —
`Jest: Coverage for branches (99.95%) does not meet "global" threshold (100%)`,
with `Tests: 2 skipped, 5642 passed, 5644 total`, Functions and Lines at 100%.
The one uncovered branch is `shared/time.ts:669`, the `?? 0` fallback in the
plan-verbatim `splitAgoDuration` line `const index = match.index ?? 0;`
(json coverage: binary-expr path 1, never taken — a non-null `String.match`
always carries `index`). The scratch proof ran per-file jest, never the full
coverage gate, so planning missed it. Fixing it means editing contract code the
plan gave verbatim, which the executor may not do; PLAN.md section 10 does not
anticipate the symptom. Tree restored from `lane/83`, branch deleted (no
commits landed), version lock released, row 83 back to READY. Evidence:
`~/athan-gitree/sessions/83/step1-unfinished.patch` (654 lines, the full
working step against `edadec30`),
`~/athan-gitree/sessions/83/step1-hook-failure.log`.

session: ses_ec20041c0ffeIVE6rF5nrvpGCE

### Step 1 — landed: the repaired contract green under the hook (second run)

Branch `83-ago-letters` off `lane/83` (`edadec30` 2.0.735), the planner's
repair (the `value.indexOf(duration)` offset) carried in the working tree.
Preflight copied to `$TMPDIR`, run from the lane root: `PREFLIGHT OK`.

Red, observed against the unmodified tree exactly as predicted: time.test 4
failed (`formatTimeAgo(60)` received `'0:01'` expected `'1m'`; the hours rows
received `'1:00'`/`'2:00'`; ar received `'0:02'` expected `'2m'`;
`splitAgoDuration` not a function), Ago.test first failure `Unable to find an
element with text: Dhuhr 3 m ago`, Screen.test `Unable to find an element with
text: Dhuhr 58 m ago` (old colon sentence still rendered). The usePrayerAgo
retune carries no red (mocked), as planned.

Change per the repaired contracts: `formatTimeAgo` lettered with the zero-minute
drop, `splitAgoDuration` + `AgoLetterGroup` under it (above `splitSingleColon`,
which stays), `Ago.tsx` splits on `splitAgoDuration`, renders digits + gap span
(fontSize 8) + letter span (55 percent size, opacity 0.4) per group inside the
one animated run, `Fragment` import under jotai, docblock sentence to `Xh Ym`,
`colon` style replaced by `gap`/`unitLetter`.

Green: time.test 130 passed, Ago.test 9 + Screen.test 4 = 13 passed,
usePrayerAgo 16 passed; `npx tsc --noEmit` exit 0; `npx biome check .
--error-on-warnings` exit 0 (439 files).

Break: `bash ai/plans/83-ago-letters/scripts/break-1.sh` printed
`ALL AS EXPECTED: 1` (the 59 s now boundary, the zero-minute drop, the `|\d+m`
pattern branch, the letter opacity: all four mutations caught); tree clean
beyond the step's files and the plan folder. Done-when greps: `splitSingleColon`
and `u2009` both absent from `Ago.tsx`.

Version: lock acquired (0 waits), origin fetched, lane at 2.0.735, step takes
2.0.736; app.json first, then package.json, `npx biome check --write` clean on
both; `android/app/build.gradle` absent in this worktree. Row 83 set to
`IN PROGRESS, step 1`.

session: ses_ec1f69d56ffej6DpMMRlrhWhu8
