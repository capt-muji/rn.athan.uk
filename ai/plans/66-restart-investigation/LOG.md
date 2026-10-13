## Ticket 66

## Planning (2026-10-13)

- Owner-away run: her rulings are the brief and the queue records (rows 57, 58, 61, 68, 71).
- Facts verified at uat `29eb2dee`: the switch path, the remount key, the width keys, the
  convergence await chain, the widget push, the launch reconciliation and the splash gates
  read line by line (the PLAN.md section 4 map). Seven anchors extracted from source and
  each counted 1.
- D84 to D87 taken (investigation only, the FINDINGS.md fold, no new device work, citation
  discipline); no open question blocks planning.
- The plan models the row 65 investigation shape: three docs steps, FINDINGS.md the
  deliverable, no device proof, weight 1 each, batch and session budget 3.
- Ticket set READY, planned at uat `29eb2dee`.

Grill round one (ten findings: two must, six should, two nice), all applied:
the concurrency trace corrected to the code's real order (the D59 restart
inside the commit, then the commit settling, then the dismiss in
pickLanguage's `.then`; the D51 face dies at the reload on a direction
change), the DONE queue-cell template extended to carry the inventory's
cache classes and each option's priced cost (they would otherwise die with
the folder), step 1's wrong cross-reference replaced with the explicit hop
list, R1.2's floor-and-scope sentence added, the splash price repointed to
row 71's recorded span with the gate share unquantified per D87, the row 57
audit record pinned to `ca077a32`, the preflight invocation written into
step 1's flow, the "keep preferences" verdict made a required step-2 item,
and the two nice fixes (the section 4 ambiguity, the stop-and-ask relay).

### Step 01 — done

- Branch `docs/66-1-switch-map` off uat `10676812` (2.0.181); origin/uat at `29eb2dee`,
  already an ancestor, nothing to merge in. Preflight copy run from `$TMPDIR`:
  `PREFLIGHT OK`, exit 0.
- Anchor check: seven anchors, each count 1 (switch-restart, remount-key, width-key,
  widget-await, converge-stamp, countdown-name, launch-converge).
- Red: `FINDINGS.md` absent before the step's commit, recorded here as the red.
- Change: FINDINGS.md sections 1 and 2 written; every hop and cache row opened in source
  before writing. Two drift fixes against PLAN.md's section 4 expectations, both found by
  the green run and corrected in the doc, not in source: the iOS timeline pushes sit at
  `stores/widget.ts:254-255` (the plan said 255-256; 256 closes the function), and the
  countdown sources sit at `stores/countdown.ts:51` and `:54` (the plan's map row said
  53/56 through the section-4 shorthand; the 74-78/90-94 selector ranges matched). Both
  readings recorded per the section 10 contradiction row.
- Green run: scripted check of 84 file:line-to-symbol pairs across sections 1 and 2,
  `mismatches=0`, `GREEN OK`; five rows spot-opened with sed (Language.tsx:44,
  app/_layout.tsx:90, stores/notifications.ts:1673, widgetTimeline.ts:350,
  countdown.ts:353), each showing the claimed statement.
- Break script: none for a docs step; row counts recorded instead. Section 1: 10 hops;
  section 2: 10 inventory rows (the plan's six plus the busy atom, the module locale
  state, the legacy width-key sweep folded into the width row, the preference row) plus
  the confirmed transient mechanism.
- Version: lock acquired, origin/uat fetched and confirmed merged; 2.0.181 to 2.0.182 in
  app.json, package.json, android/app/build.gradle, app.json first. Tests: none run —
  docs-only step, no code file touched (the ticket's diff on uat is docs).
- Commit: `2.0.182 - docs(plans): 66 step 1, the switch map and the cache inventory`;
  merge `--no-ff` into uat with the plan's message.

### Step 02 — done

- Branch `docs/66-2-restart-surface` off uat `7af4674e` (2.0.182). Anchor check: the same
  seven anchors, each count 1. Red: FINDINGS.md held sections 1 and 2 only; the commit
  appends section 3.
- Change: section 3 written per the six contract items. The full-process-restart search
  ran `exit(`, `killProcess`, `System.exit`, `terminateApp`, `restartApp`, `relaunch`,
  `reloadAsync`, `moveTaskToBack` over `app/ device/ modules/ plugins/` for
  `.ts .tsx .kt .java .swift`: no exit or restart-native path in any of the four; the
  only repo-wide `reloadAsync` sites are the D59 branch (`stores/language.ts:83`) and the
  error screen (`components/ui/Error.tsx:30`). The Android relaunch pattern and the iOS
  no-self-exit rule are marked unverified per D87 (platform facts, not repo records) and
  join section 4's ruling list with the settling checks named.
- Green run: scripted check of 43 file:line-to-statement pairs across section 3,
  `mismatches=0`, `GREEN OK`. One drift fix before the run: the refresh-chain watchdog
  comment starts at
  `WidgetRefreshScheduler.kt:167`, not 168 (citation corrected in the doc; source
  untouched).
- Break script: none for a docs step. Side-effect verdicts recorded: the D51 face dies
  at the reload, not the dismiss; the widget race opens only if the restart moves before
  the awaited push (the in-commit point keeps push first); the splash span is row 71's
  ~1.5 s with the gates' share unquantified (D87, ruling list); the transient closes in
  one wall-clock second. Preference and stamp survival cited MMKV-first
  (`stores/storage.ts:106-114`, `Error.tsx:15` owner ruling).
- Version: lock held across the merge; origin/uat fetched and confirmed merged;
  2.0.182 to 2.0.183 in app.json, package.json, android/app/build.gradle, app.json
  first. Tests: none run, docs-only step.
- Commit: `2.0.183 - docs(plans): 66 step 2, the restart surface`; merge `--no-ff` into
  uat with the plan's message.

session: ses_ecc503abeffeGjW9lWw7YwOI31

### Step 03 — done

- Branch `docs/66-3-recommendation` off uat `e4869125` (2.0.183). Anchor check: the same
  seven anchors, each count 1. Red: FINDINGS.md held sections 1 to 3 only; the commit
  appends section 4.
- Change: section 4 per the three contract items. Four options (status quo,
  always-restart through the in-process reload, always-restart as a full process
  restart, the hybrid), each with heals, costs and its evidence sections; one
  recommendation (option 1, the status quo) resting on named sections; the ruling list
  carries the final pick, the D59 revise-or-absorb question, D51's timing, and the four
  D87-unquantified costs with their settling checks.
- Green run: sections 1 to 4 read as one document; 31 section-number citations in
  section 4; no open question left for the executor (the ruling list holds everything
  for the owner). Style scan clean.
- Break script: none for a docs step.
- Version: lock held; origin/uat fetched and confirmed merged; 2.0.183 to 2.0.184 in
  app.json, package.json, android/app/build.gradle, app.json first. Tests: none run,
  docs-only step.
- Commit: `2.0.184 - docs(plans): 66 step 3, the options and the recommendation`; merge
  `--no-ff` into uat with the plan's message.

session: ses_ecc503abeffeGjW9lWw7YwOI31

### Finishing — done

- All three steps executed and merged: step 1 `7af4674e` (2.0.182), step 2 `e4869125`
  (2.0.183), step 3 `b0525f99` (2.0.184); step branches deleted after their merges; the
  whole ticket's diff on uat is docs plus the three version bumps. No code file touched.
- Ticket set to EXECUTED; executed docs commit at 2.0.185; no push (the lead pushes
  after review, and applies the D85 fold of FINDINGS.md into the queue cell at DONE:
  the option set, the recommendation (option 1, the status quo), the ruling list, the
  inventory's cache classes and each option's priced cost).

session: ses_ecc503abeffeGjW9lWw7YwOI31
