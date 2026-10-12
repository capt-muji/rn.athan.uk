## Ticket 62

## Planning (2026-10-12)

- Owner away run: three disjoint tickets planned to READY (61, 62, 65).
- Facts gathered and anchors verified; draft and grill follow.
- Grill round 1 (11 findings, all applied): anchor loop tokens renamed to the
  on-disk stopAfterRestart names; i18n.test.ts's two pinned literals joined
  in Files and the green run; dist is gitignored, verified by per-locale
  i18n:import round trips; the lock and export expected outputs corrected;
  the red summary and the it.each split fixed; PLAN repaired (twelve anchors,
  execution resume, narrowed invariant, full path).
- Grill round 2 (2 findings, both applied): the red summary is 23 total with
  21 skipped; the pinned-row locator is lines 59-62 and 77.
- Ticket set READY, planned at uat 2670e596.

## Execution (2026-10-12)

### Step 01 — done

- Branch `code/62-1-join-help-breaks` off uat `23824946` (2.0.110); preflight
  `PREFLIGHT OK`; the twelve anchors each counted 1.
- Red: both `it.each` rows failed on the pristine catalogs, printing each
  received string with the break visible; summary verbatim:
  `Tests:       2 failed, 21 skipped, 23 total`.
- Change: the twelve joins applied (six catalogs, the two keys D75 names, one
  space each per D76); the two pinned literals in `i18n.test.ts` joined
  identically; `yarn i18n:lock` printed `catalog lock written for ar, ms, so,
  hi, th` and moved all five hashes once to `856541b1...`; six exports wrote
  dist (each `Running one project: unit`, `● process.exit called with "0"`, no
  suite); six import round trips each `Tests:       7 passed, 7 total`.
- Green: 4 suites `Tests:       39 passed, 39 total`; `npx tsc --noEmit` exit 0;
  `npx biome check . --error-on-warnings` exit 0.
- Break script last line: `ALL AS EXPECTED: 1`; tree back to the step's files
  only.
- Commit `ad025204`, version 2.0.111 (app.json first, package.json, gradle
  versionName). Hook: `Tests:       5471 passed, 5471 total`; coverage
  `Statements : 100% ( 5206/5206 )`, `Branches : 100% ( 2242/2242 )`,
  `Functions : 100% ( 1082/1082 )`, `Lines : 100% ( 4662/4662 )`.
- Review: cold read of `git show ad025204`; all five checklist items hold
  (exactly twelve catalog lines, literals identical to catalogs, lock changed
  once, every dist round trip passed, no component file); lifecycle, thread,
  residue and rule hunted and clear. No findings, no fixes.
- Merged into uat as `39b53d10`, no conflicts; `code/62-1-join-help-breaks`
  deleted.

session: ses_ecedc0972ffeOETW89VSY14fNR
