# Ticket 100 ledger

## Planning (2026-10-15)

The lane worktree `$HOME/athan-gitree/lanes/100` was created off `uat` at `f9af66c2`
(2.0.751), node_modules symlinked from the main checkout, husky installed, and the
hook wiring verified (`core.hooksPath` is the relative `.husky/_`, so the hook's
four gates run in the lane; a bare `npx tsc --noEmit` exits 0 in the lane, so the
shared node_modules carries its patches). Lane regime recorded in PLAN.md.

The owner interview is waived: row 100 quotes her eight rulings verbatim (rows 92 to
99 folded by her consolidation order, full texts at `b0494991`). Planning took the
code map from the repository at the planned sha and pinned the recorded defaults
D93 to D98, each flagged for her dev-build read.

## Ticket 100

The plan: eight code steps, no device step, her dev-build read the acceptance.

### Pre-flight (2026-10-15, executor steps 1-3) — BLOCKED at the gate, no step run

Fresh executor session (steps 1 to 3) found the tree dirty and the preflight
failing twice; nothing was built, no branch was created.

- `PREFLIGHT FAIL: lane hooks missing` — `.husky/_/h` was 644. The plan's
  remedy (`npx husky`) ran and rewrote the file still 644: husky v9
  `copyFileSync`es `h` from `node_modules/husky/husky`, which is 644 in the
  shared node_modules (the main checkout's own `.husky/_/h` is 644 too). The
  hook chain works regardless (the 755 shims source `h`), but the check wants
  the bit, so `chmod +x .husky/_/h` completed the remedy; gitignored, no
  tracked state touched.
- `PREFLIGHT FAIL: tree not clean` — the standing residue, unresolved:
  `app.json` and `package.json` are modified in the working tree from
  `2.0.752` (HEAD) to `2.0.754`, uncommitted. The tip commit `978eff4f`'s
  message claims `2.0.754` but its tree left both files at `2.0.752` (the two
  earlier planning commits `1534e474` "2.0.753" and `978eff4f` "2.0.754" never
  committed their version files). The working-tree pair matches each other at
  2.0.754, so the lockstep test is green either way.

Everything else passed: lane branch, fetch, version at or above 2.0.751,
planned sha an ancestor, all 14 anchors counting 1.

The stop: the step files say "bump one patch above `lane/100`'s tip", and the
tip's version is ambiguous (message 2.0.754, tree 2.0.752, working tree
2.0.754). Restore the files to HEAD and take 2.0.753 for step 1 (two commits
in history then claim 2.0.753), or absorb the residue as the lane's true
current version and take 2.0.755 (versions stay unique and monotonic; step
1's commit carries the files)? The executor's git-status gate forbids either
choice without a ruling.

session: ses_ec05a5aa7ffe4z2S8I4BJxl0Dx

### Step 1 — RED (branch code/100-ago-plain off lane/100 at 4193bf6a)

Red tests written first; `npx jest shared/__tests__/time.test.ts
components/prayer/__tests__/Ago.test.tsx __tests__/app/Screen.test.tsx
--watchman=false`: 9 failed, 131 passed, 140 total. Failing names and lines:

- `formatTimeAgo › formats minutes under an hour` (time.test.ts:178, Expected
  "⁦1m⁩" Received "1m")
- `formatTimeAgo › formats hours and minutes, dropping a zero-minute group`
  (time.test.ts:184)
- `formatTimeAgo › one design in every locale › draws the minute, whole-hour
  and mixed branches under ar with the same Latin letters` (time.test.ts:197)
- `the Standard badge ... › at 13:05 reads "Dhuhr ⁦3m⁩ ago"` (Ago.test.tsx:27)
- `the Standard badge ... › at 14:00 reads "Dhuhr ⁦58m⁩ ago"` (Ago.test.tsx:28)
- `the Standard badge ... › fades out while the overlay is open`
  (Ago.test.tsx:79)
- `the Standard badge ... › renders the isolated duration as one plain node
  under ar, with no styled letter` (Ago.test.tsx:37)
- `a prayer page ... › shows the Standard countdown, date, list and time since
  Dhuhr on the first frame` (Screen.test.tsx:26)
- `a prayer page ... › shows the Extras countdown, date, list and time since
  Duha once the first frame has passed` (Screen.test.tsx:47)

Screen.test.tsx:58 (the toggle-off hiding query) passes before and after, as
the plan states. Log: `$TMPDIR/red1.log`.

session: ses_ec05a5aa7ffe4z2S8I4BJxl0Dx

### Step 1 — DONE (merged 810af7df on lane/100)

Change: `formatTimeAgo` composes its three lettered returns inside U+2066/U+2069
literal escapes, docblock rewritten to name the isolates, the plain face and the
row 92 RTL swap; `splitAgoDuration` and `AgoLetterGroup` deleted whole;
`PrayerAgoBadge` renders `{prayerAgo}` as `Animated.Text`'s single child, the
`gap` and `unitLetter` styles, the `Fragment` and `Text` imports gone.

Green: `npx jest shared/__tests__/time.test.ts components/prayer/__tests__/Ago.test.tsx
--watchman=false` 136/136; Screen and usePrayerAgo suites 20/20; `npx tsc
--noEmit` 0; `npx biome check . --error-on-warnings` 0. Break:
`bash scripts/breaks/break-01.sh` ended `ALL AS EXPECTED: 1`, first failing
line `Expected: "⁦1m⁩"`, tree restored.

Version 2.0.756 (app.json then package.json, under the lock, fetched). Commit
67021c26 with hook gates: `Tests: 2 skipped, 5650 passed, 5652 total`, four
100% coverage lines (Statements 5324/5324, Branches 2290/2290, Functions
1106/1106, Lines 4768/4768). Queue cell `IN PROGRESS, step 1`.

Review (cold read of 67021c26): no nested Text; isolates wrap the whole run
including the inner space; `grep -rn splitAgoDuration` outside node_modules
prints nothing; docblock names isolates, plain face and why; en content differs
only by zero-width marks. No lifecycle, thread, residue or rule findings.
Merge `--no-ff` 810af7df; lock released.

session: ses_ec05a5aa7ffe4z2S8I4BJxl0Dx

### Step 2 — RED (branch code/100-capitals off lane/100 at 810af7df)

`npx jest components/countdown/__tests__/Countdown.test.tsx --watchman=false`:
12 failed, 4 passed, 16 total. Failing names (Countdown.test.tsx): the capital
retargets at lines 43/44/45 (2 H, 29 M, label 2H 29M), 57-60 (ar, same), 73-74,
84-86, 96-98, 108-110, 120-121, 131, 145, 155-164 (style case reads H at
LETTER_SIZE 0.6), 189's sibling seconds cases, 201-202 (5 H, 28 M), 210 (10 S).
First failure names `getByText('2 H')`. The four passing cases are the
letter-agnostic ones (gap span, unavailable display, bar, renders nothing).
Log: `$TMPDIR/red2.log`.

session: ses_ec05a5aa7ffe4z2S8I4BJxl0Dx

### Step 2 — DONE (merged 6b36e217 on lane/100)

Change: `UNIT_LETTERS = ['H', 'M', 'S']` and `unitLetter.fontSize =
Math.round(ty.countdownSize * 0.6)` (D93); nothing else — the ink, the gap span
at 8, the baseline ride and the `direction: 'ltr'` pin stand byte-identical; no
locale branch.

Green: 16/16 in the countdown suite; `npx tsc --noEmit` 0; `npx biome check .
--error-on-warnings` 0. Break: `bash scripts/breaks/break-02.sh` ended
`ALL AS EXPECTED: 1`, first failing line `Unable to find an element with
text: 2 H`.

Version 2.0.757 (lock, fetched, app.json first). Commit 7bd498e4, hook gates:
`Tests: 2 skipped, 5650 passed, 5652 total`, four 100% coverage lines. Queue
cell `IN PROGRESS, step 2`. Review: the source diff is exactly the two ruled
lines; no lifecycle, thread, residue or rule findings. Merge `--no-ff`
6b36e217; lock released.

session: ses_ec05a5aa7ffe4z2S8I4BJxl0Dx

### Step 3 — RED (branch code/100-note-glyph off lane/100 at 6b36e217)

`npx jest shared/__tests__/i18n.test.ts --watchman=false`: 2 failed, 11
passed, 13 total. Failing:

- `the ar volume note copy › carries no guillemet and no forward slash,
  keeping the row 64 shape` — first failing assertion `not.toContain('«')`
  against the guillemet copy (i18n.test.ts new describe)
- `the information glyph asset › draws a circle around the i, in currentColor,
  inside the square viewBox` — first failing assertion the
  `/<circle[^>]*stroke="currentColor"/` match against today's bare-i asset

Log: `$TMPDIR/red3.log`.

session: ses_ec05a5aa7ffe4z2S8I4BJxl0Dx

### Step 3 — DONE (merged 6f79b0d8 on lane/100)

Change: `info.svg` replaced whole with the circled i (circle
`stroke="currentColor"` stroke-width 1.4, i path `fill="currentColor"`, viewBox
unchanged); `ar.ts`'s `volume.note.ios` becomes the D97 plain copy; i18n.test.ts
gains the two describes verbatim with the `node:fs`/`node:path` imports.

Green: 17/17 across i18n and VolumeNote (the VolumeNote suite untouched and
green, its `svg:info` testID reads the unchanged file name); `npx tsc
--noEmit` 0; `npx biome check . --error-on-warnings` 0. Break:
`bash scripts/breaks/break-03.sh` ended `ALL AS EXPECTED: 1`, first failing
line the `not.toContain('«')` guillemet assertion.

Version 2.0.758 (lock, fetched, app.json first). Commit 958e1be3, hook gates:
`Tests: 2 skipped, 5652 passed, 5654 total`, four 100% coverage lines. Queue
cell `IN PROGRESS, step 3`. Review: circle and i both currentColor, viewBox
byte-identical, ar diff exactly the one value, no lock file changed; no
lifecycle, thread, residue or rule findings. Merge `--no-ff` 6f79b0d8; lock
released.

session: ses_ec05a5aa7ffe4z2S8I4BJxl0Dx

### Lead ruling on the step-0 stop (2026-10-15)

The lead's two planning commits claimed 2.0.753 and 2.0.754 in their messages but
never added the version files; corrective commit 96186624 carries 2.0.754 in the
tree, matching the tip's message. The lane's versions now run monotonically
2.0.751, 2.0.752, 2.0.754, 2.0.754(tree). Step 1 bumps to 2.0.755 and every later
step one patch above the tip it branches from; the version files are added by name
in every commit from here. The chmod on the gitignored .husky/_/h stands.

### Step 4 — RED (branch code/100-qibla-gap off lane/100 at 6f79b0d8)

`npx jest components/__tests__/typographySweep.test.tsx
components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false`: 2 failed,
209 passed, 211 total. Both cases fail pre-change exactly as the step file
states, because `QiblaSubtitle` is module-local until the export lands
(`Element type is invalid ... got: undefined`):

- `the qibla sheet subtitle › pulls up 10 points under ar, matching the shared
  header`
- `the qibla sheet subtitle › keeps its 4 point gap under en`

After the export lands alone, only the ar value assertion stays failing (today
`marginTop` is `SPACING.xs`, 4, in both locales). Log: `$TMPDIR/red4.log`.

session: ses_ec0452379ffexyyf0VsrPCreVt
