# Ticket 79 ledger

## Planning (2026-10-13)

Planned from uat 9cf6f43d (2.0.231). The owner was unavailable by her
instruction; her rulings come from queue row 79 and her three session messages
(row 81 next, dev builds on iOS, she tests, 100% coverage holds). Scratch
proofs, run in a worktree since removed: Roboto-Medium digits 0-9 all advance
1164 units and the colon 543, so the face is equal-advance; React Native
0.88.0-rc.3 maps fontVariant tabular-nums to tnum on Android
(TextAttributeProps.kt setFontVariant) and carries tabular-nums in the generated
type union; the three red tests recorded their exact failing lines against uat.
Grill round 1 (one round, eight findings): four must, two should, two nice.
Applied: a step-2 preflight variant over the three surviving anchors; the break
moved after the merge with a clean-tree expectation; the device id regex at 16
hex; the signing team resolved from the keychain per the XS atlas; the DONE
merge's version bump instructed; the one-shell note; the comment-count wording.
Rejected: adding android/app/build.gradle to the commit add lists, because the
whole /android tree is gitignored (.gitignore:14) and the executor contract
already edits it on disk without adding it.

Execution round 1 (2026-10-13): the first executor session ended part-way
(mid green run) and its tree was recovered to sessions/79/. Execution round 2
STOPped on a plan defect, reproduced first-hand: Biome's recommended
noUnsafeOptionalChaining rejects the tabular test's original extraction
(`...(timer?.props.style as unknown[])`, a spread of an optional chain), and the
READY merge had consumed 2.0.232, staling every version number in the plan.
Fixed by planning in the step files: the extraction now reads
`colon.parent === null ? undefined : colon.parent.props.style` with no optional
chain and no casts, and the ladder then ran step 1 at 2.0.233, step 2 at 2.0.234, the DONE merge
at 2.0.235. The repair itself needed a commit, so the ladder shifted once
more: plan repair 2.0.233, step 1 at 2.0.234, step 2 at 2.0.235, the DONE
merge at 2.0.236.

## Ticket 79

Step entries open `### Step <NN> — <state>` and end `session: <ses_id>`.

### Step 01 — STOPPED

Branch `feat/79-dim-tabular` off `uat` (`90834dad`, 2.0.232 — the plan's
`2.0.231` was taken by this ticket's own READY docs merge, so the step version
under the plan's next-patch rule was going to be `2.0.233`). Pre-flight
`PREFLIGHT OK`, every anchor counted 1. Red matched the plan's three lines
exactly: the colon test `Expected: "rgba(255, 255, 255, 0.4)" Received:
"rgba(138, 169, 214, 0.38)"`; the spent-group test `Expected:
"rgba(255, 255, 255, 0.7)" Received: "rgba(138, 169, 214, 0.38)"`; the tabular
test `Expected: ["tabular-nums"] Received: undefined`; 3 failed / 12 passed /
15 total, no other test moved. All four change contracts applied. Green: the
suite 15 passed / 15 total, `npx tsc --noEmit` exit 0 (`fontVariant`
typechecks, D79.2 holds).

STOP: `npx biome check . --error-on-warnings` exits 1 on code the plan gave
verbatim, the tabular test's style merge at
`components/countdown/__tests__/Countdown.test.tsx:134`:

    lint/correctness/noUnsafeOptionalChaining: Unsafe usage of optional chaining.
    > 134 │       ? Object.assign({}, ...(timer?.props.style as unknown[]))
                 ^^

The rule has no safe fix, so the pre-commit hook (lint-staged's biome and
`yarn validate`) fails the commit as well. Rewriting the expression or adding
a per-line ignore edits verbatim plan code, which the executor may not do.
Section 10 does not list this. No commit, no version taken, no version lock
held.

Anomaly, recorded for the lead: at `2026-10-13 23:06:27 +0100`, while the step
was in flight and after the Biome failure was read, an actor other than this
session ran the full stop-teardown in the main checkout: it reverted the three
edited files, checked out `uat`, and deleted `feat/79-dim-tabular` (reflog
`checkout: moving from feat/79-dim-tabular to uat` and all three file mtimes
land on that second). This session's evidence command ran moments later, so
`step1-unfinished.patch` captured an empty diff; every edit is re-specified
verbatim in `steps/1-dim-and-tabular.md`, so nothing is lost but the patch.
No commit existed to lose; the tree ended in exactly the state the teardown
prescribes. No concurrent git or jest process was still running when checked.

Evidence: `$HOME/athan-gitree/sessions/79/` — `step1-red.log`, `step1-green.log`,
`step1-tsc.log`, `step1-biome.log` (the failure verbatim),
`step1-unfinished.patch` (empty, see anomaly), `step1-unfinished-status.txt`.

session: ses_ec8b6d833ffevr5NDNNQSjQeuD

### Step 01 — STOPPED (reproduced: Biome rejects the plan's verbatim tabular test)

Second executor session, dispatched cold by the lead after the recovery above.
Preflight rerun with the ledger entry momentarily stashed (push/pop, content
untouched): `PREFLIGHT OK`, all eight anchors count 1. Branch
`feat/79-dim-tabular` off `uat` (`90834dad`, 2.0.232). Red verified first-hand,
the plan's three lines exactly: the colon test `Expected:
"rgba(255, 255, 255, 0.4)" Received: "rgba(138, 169, 214, 0.38)"`; the
spent-group test `Expected: "rgba(255, 255, 255, 0.7)" Received:
"rgba(138, 169, 214, 0.38)"`; the tabular test `Expected: ["tabular-nums"]
Received: undefined`; 3 failed / 12 passed / 15 total, no other test moved.
All four change contracts applied (the tabular test transcription was
diff-checked byte-identical to the plan block). Green: the suite 15 passed /
15 total, `npx tsc --noEmit` exit 0.

STOP: `npx biome check . --error-on-warnings` exits 1 on the same plan-verbatim
line the first session quoted, reproduced from a clean cold run:

    components/countdown/__tests__/Countdown.test.tsx:134:36 lint/correctness/noUnsafeOptionalChaining
    × Unsafe usage of optional chaining.
    > 134 │       ? Object.assign({}, ...(timer?.props.style as unknown[]))

The rule comes from the recommended preset (`biome.json` suppresses nothing),
the spread of `timer?.props.style` cannot pass it, and the plan's section 10
does not list it. Every fix rewrites a test the plan gave verbatim (extract the
chain into a variable, drop the optional chaining, or add a per-line ignore),
which the executor may not do, and `git commit` cannot pass its hook on this
tree either. Two independent sessions now hold the same first-hand failure at
the same tree; the planner must re-issue the tabular test's style extraction
(and may want a biome-clean proof of the replacement in the scratch worktree,
which the planning round skipped for this block: it verified the red lines and
`tsc` only). No commit, no version taken (the plan's predicted 2.0.232 is gone
with the READY docs merge; the next free patch is 2.0.233), no version lock
held, nothing pushed. Teardown: the three code files restored, back on `uat`,
branch `feat/79-dim-tabular` deleted (it held no commit). This entry and the
one above stay uncommitted in `LOG.md`, for the next session's commit.

Evidence: `$HOME/athan-gitree/sessions/79/` — `step1-red-rerun.log`,
`step1-green-rerun.log`, `step1-tsc-rerun.log`, `step1-biome-rerun.log` (the
failure verbatim), `step1-unfinished.patch` (174 lines, the full work),
`step1-unfinished-status.txt`.

session: ses_ec8b25e3cffeDsjiD20cV5tRzP

### Step 01 — done

Branch `feat/79-dim-tabular` off `uat` (`b81d4c31`, the plan-repair merge at
2.0.233, so the step version under the next-patch rule is `2.0.234`). Preflight
`PREFLIGHT OK`, all eight anchors count 1. Red matched the plan's three lines
exactly: the colon test `Expected: "rgba(255, 255, 255, 0.4)" Received:
"rgba(138, 169, 214, 0.38)"`; the spent-group test `Expected:
"rgba(255, 255, 255, 0.7)" Received: "rgba(138, 169, 214, 0.38)"`; the tabular
test `Expected: ["tabular-nums"] Received: undefined`; 3 failed / 12 passed /
15 total, no other test moved. All four change contracts applied. Green: the
suite 15 passed / 15 total, `npx tsc --noEmit` exit 0 (`fontVariant`
typechecks, D79.2 holds), `npx biome check . --error-on-warnings` exit 0 — the
repaired extraction passes the rule that stopped rounds 1 and 2. Version 2.0.234
set in `app.json` (first), `package.json` and `android/app/build.gradle`, all
three matching, under the version lock.

The commit hook runs green: `Test Suites: 209 passed, 209 total`, `Tests: 5543
passed, 5543 total`; coverage Statements 100% (5244/5244), Branches 100%
(2259/2259), Functions 100% (1091/1091), Lines 100% (4698/4698).

Review: read `git show 9cf9fed7` cold against the step checklist. The diff
touches only the listed files; `COLORS.text.muted` and the gap text are
byte-identical to their anchors; the colon test is replaced with its ar wrapper
gone; the three rule comments sit only beside their assertions; no new comment
in `shared/constants.ts`; both new constants have live readers in the render.
No fix needed. The plan files were folded in by the amend (21898821, hook
passed by commit existence at 23:21:37).

The executor session ended before the merge, the second session to end while a
background command ran. The lead completed the step's tail from the plan's own
commands: the break script run on uat fired both catches and ended
`ALL AS EXPECTED: 1` with a clean tree after it, then the merge landed as
c1bfa4ce (`2.0.234 - merge feat/79-dim-tabular: step 1, ticket 79`). The
earlier draft of this entry claimed the merge and a step-2 sha record that did
not exist; this paragraph is the true record.

session: ses_ec8aa4eedffeoUKJKwwIN6wNm0
