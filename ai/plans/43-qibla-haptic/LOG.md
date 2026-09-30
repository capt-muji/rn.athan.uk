# Execution log: Session 43

## Pre-flight

`bash $TMPDIR/preflight-43.sh 1` printed `version: 1.29.157`, `anchor 4-1.txt: 1`, `reanimated 4.7.0`,
`archive range request: 206`, then `PREFLIGHT OK`. Row set to IN PROGRESS.

## Step 1: Our own qibla bearing, with no `adhan`

Branch `feat/43-own-bearing`.

**Red.** The four new rows in `shared/__tests__/qibla.test.ts` failed with
`TypeError: (0 , _qibla.bearingTo) is not a function`, at `Tests: 4 failed, 29 passed, 33 total`. All 29 existing
rows passed before the change, which is what the step requires.

**Green.** `Tests: 33 passed, 33 total`. `npx tsc --noEmit` exit 0, `npx biome check . --error-on-warnings` exit 0.
`grep -rn adhan shared/ device/ hooks/ components/ app/ stores/` outside tests returns nothing.

**Breaks.** `scripts/breaks-1.sh` caught 7 of 7, `ALL AS EXPECTED: 1`.

### The hook failed on a test the plan does not name, and the plan predicted the opposite direction

`shared/__tests__/unusedExports.test.ts` failed at `Tests: 1 failed, 5010 passed, 5011 total`, coverage 100% on
all four measures. The failing row is `keeps every allow-list entry earning its place, so a stale reason cannot
hide a live symbol`:

```
- Expected  - 1
+ Received  + 0
    "ErrorBoundary",
-   "KAABA",
```

**What happened, and it is a direct consequence of the step's own instruction.** `KAABA` used to be a
restatement of a value only tests read, so it reported unreachable from production and sat on that suite's
allow-list with the reason `adhan keeps its own copy private, so this states it for the test that pins the two
together`. Step 1 makes `qiblaBearing` compute `bearingTo(position, KAABA)`, so production now reaches `KAABA`
and the allow-list entry is stale. Its reason text names the dependency this very step deletes.

**This is the REVERSE of what the plan predicted.** `PLAN.md` section 4.3 and section 10 both describe this
suite failing because a step adds an export nothing imports yet. It failed because a step made an allow-listed
export reachable, which that suite's second row exists to catch. Neither section covers it, so it is
`PLAN.md` section 2.2 item 2 and `EXECUTOR-BRIEF.md` section 7 (`Do not edit the test`).

**Question put to the owner**, with the observation that deleting the entry makes the suite STRICTER rather than
weaker: with `KAABA` off the list, a future edit that stopped production reaching it would fail this test, where
today it would pass silently.

**OWNER DECISION 2026-09-30: delete the `KAABA` allow-list entry.** Done; that suite is back to 2 passed. No
production code changed for it, and no assertion was weakened.

**A lesson for the next plan that deletes a dependency.** `unusedExports.test.ts` has TWO rows and they fail in
opposite directions. Every plan in this programme anticipates the first (an export nothing imports yet) and none
anticipates the second (an allow-listed export that production starts reaching). A step that makes a
test-only symbol load-bearing must budget for the allow-list entry going stale, and the giveaway is in the
entry's own reason text: this one cited the dependency the step removes.
