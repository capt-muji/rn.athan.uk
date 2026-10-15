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

### Lead ruling on the step-0 stop (2026-10-15)

The lead's two planning commits claimed 2.0.753 and 2.0.754 in their messages but
never added the version files; corrective commit 96186624 carries 2.0.754 in the
tree, matching the tip's message. The lane's versions now run monotonically
2.0.751, 2.0.752, 2.0.754, 2.0.754(tree). Step 1 bumps to 2.0.755 and every later
step one patch above the tip it branches from; the version files are added by name
in every commit from here. The chmod on the gitignored .husky/_/h stands.
