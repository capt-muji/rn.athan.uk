# Ticket 81 ledger

## Planning (2026-10-13)

Planned from uat 742186fa (2.0.239), ticket 79's DONE merge. The owner was
unavailable by her instruction; her rulings come from queue row 81 and her
session messages. All 17 anchors counted 1 at the planned-at sha. Blast
radius measured: only Time.test.tsx queries rendered times by text, so the
time-column split touches one suite. Both schedules share Screen, List and
Ago, so item (e) holds by construction (D81.6). Every visual figure the owner
did not pin is a recorded default under her dev-build read (D81.1, D81.3,
D81.5).

## Ticket 81

Step entries open `### Step <NN> — <state>` and end `session: <ses_id>`.

Grill round 1 (2026-10-14, 13 findings: seven must, four should, two nice).
Applied: the third Ago sentence literal (line 62) and Screen.test's three
badge-sentence literals (lines 26, 47, 58) joined step 4's red set and file
list; break-step2's ar substitution re-indented to the object's two spaces;
break-step3 and break-step4 restructured into restored single-substitution
phases with the opacity flipped to 1 rather than deleted; step 1 extends the
CountdownSection.dim doc line; the session plan names two executor sessions
(steps 1 and 2, then 3 to 5); step 2's GAP_COLON instruction cites the
constant directly; steps 3 and 4 predict only the observable red lines; the
List test's title dropped its both-schedules claim. Rejected: adding
android/app/build.gradle to the add-by-name lists (the whole /android tree is
gitignored, .gitignore:14, and the executor contract edits it on disk without
adding it - the same finding ticket 79's grill made and its audit rejected),
and a component-level guard for the ar timer size (a module-scope style is
unreachable from a test without the fresh-React dance the test README
reserves for platform switches; the map pin and the break's map phase guard
the ruled number).

Owner ruling, 2026-10-14 00:15: the nightly cleanup around 00:00 is none of
the work's concern. Work runs straight through it; at most a commit avoids the
23:59 to 00:02 minute, and a wiped node_modules is a yarn install, not a stop.
The 30-minute commit block (23:45 to 00:15) is removed from
.opencode/agents/athan-executor.md, ai/AGENTS.md and the planner skill in the
READY commit.

### Step 1 — done

Branch `feat/81-seconds-bright` off `uat` (`c2ea0d48`, 2.0.241). Preflight
`PREFLIGHT OK`, both anchors count 1. Red matched the plan's line exactly: the
new test failed `Expected: false Received: true` on its first assertion
(`splitColonSections('00:01:00')?.[4].dim`), 1 failed / 133 passed / 134
total, no other test moved. Change contract applied verbatim: the seconds
carve in `splitColonSections` with its comment, and the `CountdownSection.dim`
doc line. Green: the suite 134 passed / 134 total, `npx tsc --noEmit` exit 0,
`npx biome check . --error-on-warnings` exit 0. Version 2.0.242 set in
`app.json` (first), `package.json` and `android/app/build.gradle`, all three
matching, under the version lock (origin/uat held at 2.0.239, the number
free).

Commit `7423922f`: the hook's first run died to a jest-worker SIGSEGV under
load average 8.30 (every test that ran passed, 5543 total, an infrastructure
flake, no test failed); the retry under load 7.63 ran green. Hook lines:
`Test Suites: 209 passed, 209 total`, `Tests: 5544 passed, 5544 total`;
coverage Statements 100% (5245/5245), Branches 100% (2263/2263), Functions
100% (1091/1091), Lines 100% (4699/4699).

Review: read `git show 7423922f` cold against the checklist. Only the listed
files touched; the colons' own `dim: true` line byte-identical; the comment
verbatim on its own line; the four assertions exact; no lifecycle, thread or
residue class, no ruled value touched. No fix needed.

Break script on uat after the merge: `caught: seconds dim again`, last line
`ALL AS EXPECTED: 1`, tree clean after. Merge `07018de7`.

session: ses_ec8723c63ffehAF73Q6q2sJym7

### Step 2 — done

Branch `feat/81-timer-gaps-ar-size` off `uat` (`07018de7`, 2.0.242).
Preflight `PREFLIGHT OK`, all eight anchors count 1. Red matched the plan: the
countdown suite failed its gap queries five times `Unable to find an element`
(the component still rendered one thin space per side), 5 failed / 10 passed /
15 total; the typography suite failed `Expected: 24` twice and `Expected: 26`
twice (the field did not exist), 4 failed / 4 total; no other test moved. All
four change contracts applied verbatim: the doubled gap literal, the
`fontSize: ty.countdownSize` read, the interface field with its doc line, and
the two map entries (`TEXT.sizeLarge - 2` under ar, `TEXT.sizeLarge` under
Latin). Green: both suites pass (15/15 and 4/4), `npx tsc --noEmit` exit 0,
`npx biome check . --error-on-warnings` exit 0. Version 2.0.243 set in
`app.json` (first), `package.json` and `android/app/build.gradle`, all three
matching, under the version lock (origin/uat still held at 2.0.239).

The commit's sha, hook line, review verdict, break line and merge sha are
recorded by the step-3 commit's LOG update (the ticket-82 pattern: a step's
own commit cannot cite what lands after it).

Commit `5527905e`. Session 1's context closed before its hook output was
captured, so the step-3 session re-measured the same tree (the merge `5c0212b6`
checked out clean into a scratch worktree): `Test Suites: 209 passed, 209
total`, `Tests: 5544 passed, 5544 total`; coverage Statements 100% (5245/5245),
Branches 100% (2263/2263), Functions 100% (1091/1091), Lines 100% (4699/4699).
The worktree lacks the gitignored prebuilt audio dirs, so its run printed
`2 skipped, 5542 passed`; both audioMatrix prebuild tests pass with their dirs
present, and the hook's own line carries no skip.

Review, read cold at step-3 time (`git show 5527905e` against the step-2
checklist): only the listed files touched; the gap literal doubled to two thin
spaces per side; the `fontSize: ty.countdownSize` read; the interface field
with its doc line and both map entries (`TEXT.sizeLarge - 2` under ar,
`TEXT.sizeLarge` under Latin) verbatim; row 79's dim colours and the tabular
pin byte-identical; no lifecycle, thread, residue or rule class. No fix needed.

Break script on uat after the merge: `caught: single gap again` and `caught: ar
countdown size 26 again`, both catches fired, last line `ALL AS EXPECTED: 1`,
tree clean after. Merge `5c0212b6`.

session: ses_ec8723c63ffehAF73Q6q2sJym7

### Step 3 — done

Branch `feat/81-time-colon` off `uat` (`5c0212b6`, 2.0.243). Preflight
`PREFLIGHT OK`, all three anchors count 1. Red matched the plan: the label and
gap queries failed `Unable to find an element` (the label and the split did not
exist), the sentinel tests passed before and after, 7 failed / 5 passed / 12
total, no other suite moved. Change contract applied verbatim: the `Text`
import, the `splitSingleColon` import in Biome's order, the parts render with
the whole-string label and the unsplit sentinel, and the `colon` style at
opacity 0.4 (Biome's formatter put the `Animated.Text` attributes on one line;
the code is the contract's, the line breaks the formatter's). Green: the suite
12 passed / 12 total, `npx tsc --noEmit` exit 0, `npx biome check .
--error-on-warnings` exit 0, and the leak-proof run (Prayer, List, Screen)
24 passed / 24 total. Version 2.0.244 set in `app.json` (first), `package.json`
and `android/app/build.gradle`, all three matching, under the version lock
(origin/uat still held at 2.0.239).

The commit's sha, hook line, review verdict, break line and merge sha are
recorded by the step-4 commit's LOG update.

Commit `bc070dae`. The first `git commit -F` read a stale `msg-3.txt` left by
ticket 82's session in the shared `$TMPDIR` and committed its message by
mistake; nothing had merged, so the commit was amended with the step's own
message before any merge. Hook lines from the amended run: `Test Suites: 209
passed, 209 total`, `Tests: 5547 passed, 5547 total`; coverage Statements 100%
(5246/5246), Branches 100% (2269/2269), Functions 100% (1091/1091), Lines 100%
(4700/4700).

Review: read `git show bc070dae` cold against the checklist. The sentinel path
renders `displayTime` with the label left undefined; the split path labels the
whole `HH:MM` string; the colour fade and its timings byte-identical; only the
listed files touched; no lifecycle, thread, residue or rule class (the strings
themselves unchanged, only the render split). No fix needed.

Break script on uat after the merge: `caught: gap back to single` and `caught:
colon opacity gone`, both catches fired, last line `ALL AS EXPECTED: 1`, tree
clean after. Merge `866b9982`.

session: ses_ec86711f7ffeZ93dcv3VZjG3T2

### Step 4 — done

Branch `feat/81-ago-list-gap` off `uat` (`866b9982`, 2.0.244). Preflight
`PREFLIGHT OK`, all four anchors count 1. Red matched the plan: the sentence
and gap queries failed `Unable to find an element` (Ago's two `it.each` rows,
the ar gap split, the overlay fade, the new badge pin, and Screen's two
`getByText` badge sentences), the list pin failed `Expected: 22.5` against
`Received: 30`, 8 failed / 16 passed across the three suites, no other suite
moved; the opacity and badge-lift pins sat behind a throwing query. The plan's
List test needed two mechanical substitutions to run on this tree: the
renderer's traversal is `queryAll` not `findAll` (the repo's own idiom, Help
and Modal tests), and `screen.root` is the List container itself, so the call
carries `{ includeSelf: true }` and the repo's `?? []` null guard; with those
the red is the plan's own `Expected: 22.5` against the old 30. Biome's
formatter reshaped three lines the plan gave (a wrapped Screen assertion and
the two ternary style reads); the code is the plan's, the line breaks the
formatter's. Change contracts applied verbatim: the badge colon `Text` with
`styles.colon` and the doubled gaps, `marginTop: -SPACING.xs` after
`alignSelf`, the `colon` style at opacity 0.4, and the List `marginBottom:
SPACING.xxxl * 0.75`. Green: the three suites 24 passed / 24 total, `npx tsc
--noEmit` exit 0, `npx biome check . --error-on-warnings` exit 0. Version
2.0.245 set in `app.json` (first), `package.json` and
`android/app/build.gradle`, all three matching, under the version lock
(origin/uat still held at 2.0.239).

The commit's sha, hook line, review verdict, break line and merge sha are
recorded by the step-5 commit's LOG update.

Commit `32b6d6e7`: hook lines `Test Suites: 209 passed, 209 total`, `Tests:
5549 passed, 5549 total`; coverage Statements 100% (5246/5246), Branches 100%
(2269/2269), Functions 100% (1091/1091), Lines 100% (4700/4700).

Review: read `git show 32b6d6e7` cold against the checklist. The badge's recent
and normal colour paths byte-identical (only the colon node and the badge's top
margin changed); the `now` word still renders one unsplit node with no gap
node; both schedules read the same components, no per-type branch; only the
listed files touched. No fix needed.

Break script on uat after the merge: `caught: ago gap back to single`,
`caught: ago colon opacity gone`, `caught: badge lift gone` and `caught: list
gap back to 30`, all four catches fired, last line `ALL AS EXPECTED: 1`, tree
clean after. Merge `2aa3076d`.

session: ses_ec86711f7ffeZ93dcv3VZjG3T2

### Step 5 — done

Branch `docs/81-handover` off `uat` (`2aa3076d`, 2.0.245). Preflight
`PREFLIGHT OK`. No source file changed. Metro verified serving from this Mac:
`curl http://localhost:8081/status` answered `metro status 200` on the first
read, the same server serving since ticket 79's delivery; the merged `uat` is
the tree it watches, so her dev build reads the refinements on its next open.
The owner's read of that build is the acceptance bar for every pinned default.
Version 2.0.246 set in `app.json` (first), `package.json` and
`android/app/build.gradle`, all three matching, under the version lock
(origin/uat still held at 2.0.239).

The commit's sha, hook line and merge sha are recorded by the executed docs
commit's LOG update.

session: ses_ec86711f7ffeZ93dcv3VZjG3T2
