## Ticket 71

## Planning (2026-10-13)

- Owner-away run: her rulings are the brief (queue row 71) and the queue records (rows 66 and
  68). No question was asked; none was available to ask.
- Facts verified at uat `053ffaab` (2.0.187): the switch commit and its D59 reload branch
  (`stores/language.ts:77-89`), the three AppState listener sites (`device/listeners.ts:79`,
  `shared/perf.ts:205`, `hooks/useNotification.ts:37`), and the full native chain read line by
  line in node_modules (RN 0.88.0-rc.3, expo-updates as pinned): reload entry
  (`UpdatesModule.kt:65-68`), the restart extension
  (`RestartReactAppExtensions.kt:28-32`), the reload's pause of the dying context
  (`ReactHostImpl.kt:1330-1336`), the listener fan-out (`ReactContext.java:321-334`), the
  module's emit and guard (`AppStateModule.kt:46-49`, `:63-76`), the drop and raise
  (`ReactHostImpl.kt:916-926`, `:897-908`), the soft logger
  (`ReactSoftExceptionLogger.kt:68-77`). Fourteen anchors extracted; each counts 1.
- The row's question is answered from source: no (D88). The throw path is native-internal; the
  repo's JS listeners sit downstream of the emitting module and cannot suppress the exception.
  The fix-if-so branch stays untaken.
- D89: the device proof runs once to pin the exception line verbatim, because row 68's
  evidence died in its merge and the record's line text is otherwise uncited. D90: a
  contradicted reading is NEEDS REPLAN, never an executor repair.
- Shape: two steps - the verdict doc (weight 1), the 3T crossing proof (weight 3, alone in its
  batch). Batch budget 3, session budget 4.
- Row 66's investigation-only pricing (folded in its queue cell) is not carried further: row 66 priced the restart
  question; this row pins a log line whose evidence is gone.
- Ticket set READY, planned at uat `053ffaab`.

Grill round one (twelve findings: six must, four should, two nice), all applied:
the preflight's Needs-first check accepts the row's `none` note so a pre-READY run cannot
wedge at step 0 (1); the aapt2 expected line rewritten to the format aapt2 prints, matching
the build script's own badging regex (2); the mocks argument replaced with the repo's own
`mocks/simple.ts` and the stale BUILD.md pointer dropped (3); the marker count corrected to 2
with the `logcat -c` reason and the wrong count-of-2 branch removed (4); the watcher's
removal line repointed `:43` to `:44` (5); the executed commit re-contracted to the executor
agent file's own Finishing definition (6); the build artefact's versionName reading predicted
(7); the build tail shape corrected to the `BUILD-MOCK OK` line plus the report block (8);
the discarded-launch wait bounded at 15 s (9); hop 5 rewritten from "races the teardown" to
the ordered reset-then-pause mechanism the sources carry, with five new anchors pinning the
task ref's initial value, the guard's instance flag, its delegate and the destroy step (10);
the stack-walk window widened to 30 lines and the `test -x` gate given its expected silence
(11, 12).

### Step 1 — executed

- Branch `docs/71-1-verdict` off `uat` at 730a3756 (2.0.189); origin/uat 053ffaab already an
  ancestor, nothing to merge in.
- Preflight: `bash "$TMPDIR/preflight-71.sh"` printed `PREFLIGHT OK`.
- Anchor check: nineteen lines, every count `1`, run before and after the change.
- Red: FINDINGS.md absent.
- Read-against-source: every citation opened at its lines and read as claimed —
  `stores/language.ts:38,77-89,83`; `device/listeners.ts:17,24-25,27,79`; `app/index.tsx:100,108`;
  `shared/perf.ts:34,205`; `hooks/useNotification.ts:37,44`; `components/ui/Error.tsx:30`;
  `AppStateModule.kt:46-49,63-72` (guard read at `:68`); `ReactContext.java:321-334`;
  `ReactHostImpl.kt:129-130,347-348,897-908,916-926,1316-1317,1330-1336,1385-1392` (the `:1387`
  line carries the `4: Destroying ReactInstance` marker, the field cleared at `:1392`);
  `BridgelessReactContext.kt:109,159-164`; `ReactSoftExceptionLogger.kt:68-77`;
  `RestartReactAppExtensions.kt:28-32`; `UpdatesModule.kt:65-68`.
- Green: `GREEN`; `grep -c "file:line\|file:line citation" FINDINGS.md` printed `1`; anchor
  check nineteen `1`.
- Break script: none; the step writes documentation.
- Version 2.0.190 taken under the lock: local 2.0.189, origin/uat 2.0.187, next patch over the
  higher; set in `app.json`, then `package.json`, then `android/app/build.gradle` `versionName`.
- Commit 7cce6f1e: hook printed `Tests: 5500 passed, 5500 total` and 100% on statements,
  branches, functions and lines. Review (two passes, `git show` read cold): checklist items 1
  to 5 all pass; section 3, 4 and 6 blockquotes byte-identical to the step file's; section 5
  copied verbatim from PLAN.md items 1 to 4 as dictated, whose internal PLAN.md section
  pointers therefore read as FINDINGS pointers inside the doc (the plan's own text, noted, not
  repaired); no code or test file in the diff; no lifecycle, worklet, residue or rule finding
  (docs-only change).

session: ses_ecbdc9399ffeRTygBGwGfVM2xy

### Step 2 — stopped (NEEDS REPLAN)

- Dispatcher premise stale: step 1 was already merged on uat (63dbb429) before this session
  began; no merge was needed. Preflight `PREFLIGHT OK`; anchor check nineteen `1`.
- Device verified: the connected `3T_SERIAL` placeholder device, the floor test device. Version 2.0.191 taken under the
  lock and later restored (nothing committed); build-mock 2.0.190 (uat 63dbb429)
  `BUILD-MOCK OK`, aapt2 gate passed, install `Success` 08:43.
- The agent-device MCP server is broken on this box (`Cannot find module .../agent-device-client.js`);
  the whole drive ran on the agent-device CLI (same tool, mirror commands).
- Start state: the app sat on the Arabic face (leftover preference). PLAN section 10's
  recovery applied: crossed to English before baselining, discarded.
- Drive 1 (pid 21009): crossing 1 en→ar produced the full textbook cycle —
  `reactInstance is null. Dropping work.` W+E lines 08:45:33.305/.306, stack frame
  `AppStateModule.onHostPause`, marker 08:45:34.702, span 1.397 s, pid unchanged, 0 FATAL.
  Crossing 2 ar→en flipped the face but never reloaded: no exception, no marker, no
  expo-updates restart, no `LANGUAGE:` warn; a recheck dump two minutes later confirmed
  the counts. Readings: blocks-per-crossing 1 then 0 (contract: exactly 1 each), markers 1
  (contract: 2) — D90 contradiction.
- Drive 2 (fresh process, pid 22599): crossing 1 en→ar starved the same way ~10 s after
  start with the launch refresh in flight; the refresh later completed, the pass still
  never dequeued, no reload.
- Drive 3 (fresh process, pid 23273): recovery ar→en DID reload (block + marker within 5 s,
  discarded). Baseline with the queue drained (Refresh complete 09:01:42). Crossing 1
  en→ar: face flipped, 45 s of polls read dropping=0 markers=0; post-mortem dump shows no
  exception, no marker, zero `dev.expo` lines, and the once-per-process deferred launch
  init (`launchInitRan` latch, app/index.tsx) firing at 09:03:27.9, four minutes after
  process start — mount/timer timing around the language commits contradicts the plan's
  model. Stopped per PLAN section 2.2 item 1 and D90: NEEDS REPLAN, not repaired.
- Evidence under `~/athan-gitree/sessions/71/`: `NOTES.md` (the drive table and the
  signature), `logcat-drive1-full.txt` (the textbook block verbatim),
  `logcat-drive2-window.txt`, `logcat-drive3-en-ar-starved.txt`,
  `pid/alarm` files per drive, `app-mock.apk` + build report, `step2-unfinished.patch`
  (the restored 2.0.191 bump), `step2-unfinished-status.txt`.
- Teardown: HOME then `am kill`, relaunch, crossed back to English (`Fajr` wait passed),
  agent-device session closed. Automatic time on throughout, no clock change, no
  screenshots, no force-stop, no `pm clear`. The mock install stays on the phone.
- No commit: the step's deliverable never met its readings. Version files restored to
  2.0.190; branch `docs/71-2-crossing-proof` deleted unmerged (was at uat 63dbb429).

session: ses_ecbd3be8fffeAIL7Gj7gStVrpf

## Planning (2026-10-13)

Replan round one, from step 2's D90 stop. The device work ran to completion (build,
aapt2 gate, install, three drives, six crossings) and the readings came back against the
record: three crossings produced the textbook cycle, three starved silently (face flips,
preference stores, no convergence dequeue, no reload, no exception, app ticks on in the
new locale; the drive 3 post-mortem shows the once-per-process launch init firing over
four minutes late). Ruled D91: the verdict needs one pinned cycle and drive 1 captured
it (the verbatim block, span 1.397 s, pid unchanged, 0 FATAL, all preserved under
sessions/71/); step 2 is re-planned as a recording step over that evidence, and the
starvation becomes FINDINGS.md section 8 plus queue row 78 (added from this evidence,
the same commit as this replan). The section 6 verdict is untouched: the drop is ordered
and log-only whenever the reload fires, and the starved crossings log no exception at
all. Evidence: sessions/71/NOTES.md and the per-drive captures.

### Step 2 — done

- Branch `docs/71-2-crossing-proof` off `uat` at daa30fec (2.0.191); origin/uat 053ffaab
  already an ancestor, nothing to merge in.
- Anchor check: nineteen lines, every count `1`, run before and after the change;
  `STEP1-OK` and `VERDICT-OK` printed.
- Red: sections 7 and 8 absent (FINDINGS.md ended at section 6); no test runs red, the
  step is a transcription.
- Change: sections 7 and 8 appended per the re-planned contracts. The verbatim block:
  29 lines transcribed byte-for-byte from `logcat-drive1-full.txt` lines 7737-7765, the
  threadtime W line at 08:45:33.305 through the stack's last frame (26 `at` frames, the
  `AppStateModule.onHostPause` frame present), fenced as a code block. The capture
  carries no blank line anywhere, so the block ends at the stack's final frame
  (ZygoteInit.main); the next capture line is a later, different-tag entry (08:45:33.307,
  `Stopping all React Native surfaces`). D91 accepts the captured evidence as-is. The
  drive table copied row for row from NOTES.md (six rows). Unrelated soft exceptions in
  the capture: none (all four `SoftException` occurrences sit inside the one block,
  capture lines 7737-7739). The contract's conditional ruling-list line was not added:
  FINDINGS.md carries no ruling list.
- Green: drive-table rows 6/6 present in section 8; diff of the fenced block against the
  capture lines empty; `grep -c 'Dropping work' FINDINGS.md` printed 2, both lines inside
  section 7's transcription; anchor check nineteen `1`.
- Break script: none (docs step); the green run's row counts stand in for it (6/6 rows,
  byte diff empty, count 2 confined to section 7).
- Version 2.0.192 taken under the lock: local 2.0.191, origin/uat 2.0.187, next patch
  over the higher; set in `app.json`, then `package.json`, then
  `android/app/build.gradle` `versionName` (gitignored, never added). Queue row 71 moved
  to `IN PROGRESS, step 2` in this step's commit.

