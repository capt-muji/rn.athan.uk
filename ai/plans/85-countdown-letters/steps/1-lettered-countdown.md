## Step 1 — The lettered countdown lands with the sweep, atomically

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R1.6, R1.7, R2.1, R2.2, R3.1
Weight: 2

Anchor check: every anchor in `scripts/anchors/` counts exactly 1 at `uat`
(the preflight ran it; rerun if the tree changed since).

Goal: the countdown TIME display renders the lettered design in every language
with the old zero-drop behaviour, and every remnant of the colon designs that
loses its reader lands dead in the SAME commit. The hook enforces the atomicity:
the lettered component makes the colon allowlist entries stale
(`directionalStyleGate`) and `splitColonSections` test-only-reachable
(`unusedExports`), so a letters-only commit can never pass it.

Branch: `85/lettered-countdown` off `uat`.

Files:
- `components/countdown/Countdown.tsx` — replaced by `handed/Countdown.tsx.txt`
  byte for byte.
- `components/countdown/__tests__/Countdown.test.tsx` — replaced by
  `handed/Countdown.test.tsx.txt` byte for byte.
- `shared/time.ts` — delete `splitColonSections`, the `CountdownSection`
  interface, `ALL_DIGITS`, `ALL_ZEROS`, and the JSDoc block that documents them.
  In `splitSingleColon`'s JSDoc, `may sit either side, so unlike
  splitColonSections the halves are not digit-checked.` becomes `may sit either
  side, so the halves are not digit-checked.` `formatTime`, `formatTimeAgo`,
  `splitSingleColon` untouched (anchor a5 pins `formatTime`'s doc head in
  place).
- `shared/__tests__/time.test.ts` — delete the `splitColonSections` entry from
  the import list and the whole `describe('splitColonSections')` block.
  Nothing else.
- `shared/constants.ts` — delete the `dimDigit` and `colon` keys from
  `COLORS.countdown`. The other countdown keys stay.
- `shared/__tests__/constants.test.ts` — the empty-track pin (anchor a8) asserts
  the literal `'rgba(160, 200, 255, 0.08)'` in place of `COLORS.countdown.dimDigit`,
  and the now-unused `COLORS` entry leaves the import on line 8.
- `scripts/directional-styles-allowlist.json` — delete the two
  `components/countdown/Countdown.tsx` entries whose snippets are the colon
  ink-compensation margins (`marginLeft: digitSections[index - 1]...` and
  `marginRight: digitSections[index + 1]...`); their lines die with the colon
  render, and the gate holds no entry whose line is gone.
- `ai/plans/README.md` — ticket set `IN PROGRESS, step 1`.

Red: copy `handed/Countdown.test.tsx.txt` over the test path, then run:

    npx jest components/countdown/__tests__/Countdown.test.tsx --watchman=false --selectProjects=components

Expected: 13 of 16 fail on the lettered assertions, the first being
`Unable to find an element with text: 2 h`; the three carrier tests pass (the
bar pair and the renders-nothing guard). Any other suite failing, or these
passing, is STOP. Record each test's exact first failing line in LOG.md.

Change: copy `handed/Countdown.tsx.txt` over the component path, then make the
sweep edits above. Nothing else: the component file is the owner-approved
implementation, and one character of drift from the handed file is a review
finding.

Green: the named suite passes, the full jest suite passes (the three gates
realign: `unusedExports` heals by the deletion, `directionalStyleGate` by the
allowlist trim, `versionLockstep` by the version set below), then
`npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0, and:

    grep -rn "splitColonSections\|CountdownSection\|ALL_DIGITS\|ALL_ZEROS\|dimDigit\|COLORS.countdown.colon" --include="*.ts" --include="*.tsx" shared components app hooks stores widgets | grep -v __tests__

prints nothing. A hit is STOP: the plan's map missed a reader (NEEDS REPLAN).

Breaks: `bash $TMPDIR/break-1.sh` then `bash $TMPDIR/break-2.sh` (copied from
`scripts/`). The first applies two one-line mutations to the component, runs
the suite after each, expects the whole-hour test (`1h alone`) to fail each
time, and restores the file. The second writes a one-line scratch import of
`splitColonSections`, expects `npx tsc --noEmit` to fail with
`has no exported member`, deletes the scratch file, then asserts the grep above
still prints nothing. Each ends `ALL ASPECTED: 1`. A mutation the suite
survives, or a break that passes where the plan says it fails, is STOP.

Version: fetch `origin` under the version lock, then:

    node -p "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;v.join('.')"

Set the printed version in `app.json`, `package.json` and
`android/app/build.gradle` (`versionName` equals the app.json value exactly;
`versionLockstep` demands it), all three matching.

Commit message:

    <VERSION> - feat(countdown): the lettered time display in every language - the old zero-drop behaviour, lowercase h m s on the digits' baseline; the colon machinery dies with its last reader

Review checklist:
- `diff <(git show HEAD:components/countdown/Countdown.tsx) <path to handed/Countdown.tsx.txt>`
  is empty; same for the test file.
- The diff deletes only the four symbols with their docs and tests, the two
  colour keys, the import entries, and the two allowlist entries.
  `git show --stat` lists exactly the eight files plus the queue row.
- The track pin still proves the bar's colour, from the literal.
- No visual value differs from PLAN.md section 1.
- The hook's last `Tests:` line ends `passed, <n> total`; four `100%` lines.

Merge: `git checkout uat && git merge --no-ff 85/lettered-countdown -m "<VERSION> - merge 85/lettered-countdown"`.

Done when: merged, checklist ticked, LOG.md entry appended under
`### Step 01 — merged` ending with the `session:` line, then the executor's
Finishing runs (the EXECUTED docs commit per its own agent file).
