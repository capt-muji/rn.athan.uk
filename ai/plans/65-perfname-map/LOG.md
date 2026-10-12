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
- Commit: (filled in the step 2 commit, with the hook line)
- Review: (filled in the step 2 commit)
- Merge: (filled in the step 2 commit)

session: ses_ecec909deffeRmqw7Sywass3u5
