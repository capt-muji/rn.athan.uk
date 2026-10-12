## Ticket 65

## Planning (2026-10-12)

- Owner away run: three disjoint tickets planned to READY (61, 62, 65).
- Facts gathered and anchors verified; draft and grill follow.
- Grill round 1 (13 findings, all applied): the reader map rewritten to the
  true surface; the probe rescoped to the sheet wiring; the scan-strings hit
  named; D82 (FINDINGS.md folds into the queue cell at DONE); counts,
  headings, fetch-origin, Finishing heading, alternatives.
- Grill round 2 (6 findings, all applied): SETTINGS_PERF_NAME named; the two
  part suites' tap-mark failures predicted; the baselines JSON's seven
  sheet_* keys expected and its orphaning fed to the cost list; 24 non-test
  files not 21; the observer row carries all four suites; R2.1 names the tap
  marks.
- Ticket set READY, planned at uat 2670e596.

### Step 01 — done (2026-10-12, executor ses_ecec909deffeRmqw7Sywass3u5)

- Branch: `docs/65-1-inventory` off `uat`. Preflight copy run from `$TMPDIR`
  per PLAN.md section 3: `PREFLIGHT OK`. Anchor check: three anchors
  (perf-gate, present-mark, sheet-prop), each count 1.
- Red: `FINDINGS.md` did not exist before this step, as the plan predicts;
  this commit creates it.
- Change: the six greps from the step's contract, run from the repository
  root over app/ components/ shared/ stores/ hooks/ device/ e2e/ scripts/
  (node_modules, .codegraph, ai/ excluded). Totals: perfName 21, perfMark 77,
  perfMeasure 37, initPerfMonitor 22, EXPO_PUBLIC_PERF_MONITOR 30,
  PERF_ENABLED 4 — every one matching planning's counts at `2670e596`.
  191 hits on 174 distinct lines in 30 files (6 test suites, 24 non-test).
  FINDINGS.md section 1 carries one row per hit, grouped: machinery 13,
  machinery tests and mock 61, sheet wiring 20, call sites 60, UI-suite
  observers 32, scripts and gate usage 5. The e2e paragraph records that the
  seven flows and frame-audit.sh read nothing, baseline-compare.sh is the one
  reader (PERF_MEASURE logcat extraction at :36), and the baselines JSON
  carries seven sheet_* keys.
- Green: a scripted check opened every one of the 191 file:line rows and
  found the symbol on the line (0 mismatches); five rows spot-opened with
  sed (Sheet.test.tsx:208, notifications.ts:1621, e2e/README.md:43,
  loader.ts:15, Overlay.tsx:63).
- Break: none for a docs step; the row count stands in: 191.
- Version: 2.0.115 (origin fetched under the version lock at 2.0.114;
  app.json, package.json, android/app/build.gradle all set, app.json first).
- Commit: `1fbf8d07`. Hook: `Tests: 5471 passed, 5471 total`; coverage
  100% statements (5206/5206), branches (2242/2242), functions (1082/1082),
  lines (4662/4662).
- Review: read `git show 1fbf8d07` cold. Checklist holds: only the plan
  folder, the queue and the version files changed; every grep hit is a table
  row or named excluded (ai/ records, .codegraph index). No identifiers in
  the docs. One pass, nothing to fix.
- Merge: `85c2142e` (no-ff into uat; the merge commit carries no hook run,
  husky leaves pre-merge-commit empty).

session: ses_ecec909deffeRmqw7Sywass3u5

### Step 02 — done (2026-10-12, executor ses_ecec909deffeRmqw7Sywass3u5)

- Branch: `docs/65-2-probe` off `uat`. Anchor check: three anchors, each
  count 1.
- Red: FINDINGS.md held section 1 only; this commit appends section 2.
- Probe (D80): detached worktree `$HOME/athan-gitree/worktrees/probe-65` at
  `85c2142e`, node_modules symlinked, nine files edited to the step's list,
  nothing committed. Results, verbatim in FINDINGS.md section 2:
  - `npx tsc --noEmit` exit 1: four TS2353 errors, all naming
    `components/sheets/parts/__tests__/Sheet.test.tsx` (:208, :217, :225,
    :236), `perfName` gone from `Partial<SheetProps>`.
  - `npx biome check . --error-on-warnings` exit 1: noUnusedImports on
    Sheet.tsx:15, SoundItem.tsx:10, LabeledToggle.tsx:4, stores/ui.ts:6;
    noUnusedFunctionParameters on Sheet.tsx:153 (`toIndex`); one format
    error in Alert.tsx (the prop line carried the JSX bracket).
  - `npx jest components/sheets stores/__tests__/ui.test.ts` exit 1:
    9 failed / 430 passed (439), 3 suites failed / 16 passed — exactly the
    predicted three suites (Sheet marks/measures, LabeledToggle:60 toggle_tap,
    SoundItem:92,100 select/play taps). `stores/__tests__/ui.test.ts` and the
    five screen suites pass: the present marks break nothing at Jest level.
  - e2e/scripts grep after deletion: exactly the expected four files plus
    the seven baselines lines; no contradiction to section 1.
- Deviation recorded: the plan's `--selectProjects=components,unit` selects
  no projects under this Jest (comma form rejected); the run passed the flag
  twice, same projects and suites, rest verbatim. Noted in FINDINGS.md
  section 2.
- Cleanup before anything else: node_modules symlink removed, worktree
  deleted (`git worktree list` shows no probe-65; the two build worktrees
  stay). `git status --porcelain` on uat lists only plan and queue files.
- Break: none for a docs step; the probe's failure counts stand in.
- Version: 2.0.116 (origin fetched under the version lock at 2.0.115;
  app.json, package.json, android/app/build.gradle all set, app.json first).
- Commit: (filled in the step 3 commit, with the hook line)
- Review: (filled in the step 3 commit)
- Merge: (filled in the step 3 commit)

session: ses_ecec909deffeRmqw7Sywass3u5
