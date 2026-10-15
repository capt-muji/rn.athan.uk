# Ticket 91 ledger

## Planning (2026-10-15)

- Diagnosis pinned from the two .ips reports (05:27:39 and 09:53:55, 2026-10-15)
  and the pinned module source: the exception backtrace of both reports carries
  the `_simulateLaunchForTaskWithIdentifier:` block, Apple's private selector;
  the only in-process caller is `BackgroundTaskDebugHelper.triggerBackgroundTaskTest`
  behind the DEBUG-only JS `triggerTaskWorkerForTestingAsync`, reached only through
  `runBackgroundTaskDebugSequence` at `app/index.tsx:141`, once per JS context.
  The reply to the simulation's internal pending-request query lands on an XPC
  reply queue where the framework throws its main-thread-only exception;
  uncatchable, EXC_CRASH Abort trap 6.
- The competing caller eliminated: `isWorkerRunning()` wraps
  `BGTaskScheduler.shared.pendingTaskRequests()` on iOS and has no caller in the
  module; `expo-task-manager`'s iOS sources hold no BGTaskScheduler reference.
- Timing corroborates: 09:53 crash 75 s after process launch (her English-to-Arabic
  switch mid-read, the reload context re-arming the sequence about 10 s before the
  abort); 05:27 crash 46 s after a cold launch, no reload implicated, so a
  reload-only gate would not fix it.
- Fix decided (D91.2): platform gate at the arm point, `__DEV__ &&
  Platform.OS === 'android'`. The patch-package main-queue hop rejected: the throw
  rides the reply queue. Production scheduling untouched (D91.4). Upstream report
  offered to the owner at DONE (D91.5).
- Anchors written, ten, each verified to count 1 at f9af66c2 (arm-doc.txt added at
  the grill round). Skeleton committed 2.0.752, merged 9f73e11e, row 91 PLANNING.
- Grill round 1 (2026-10-15): one must (contract 4's extent could orphan the old
  setTimeout tail as valid top-level code that passes tsc and the suite but fails
  the coverage hook), five shoulds (contract extents for the two doc blocks, the
  untouched arm doc block left false, the over-specific red prediction, the
  ambiguous STOP sentence, the misattributed owner-rule quotes), three nices
  (merge output, lock bound, R3.1 overclaim). All nine applied: contracts
  reworded to excerpt-for-excerpt replacements, a fourth doc contract and the
  arm-doc anchor added, the red prediction corrected to Jest's first-assertion
  stop, attribution moved to the run order (D91.7), merge output and lock bound
  written, R3.1 narrowed.
- Grill round 2 (2026-10-15): round 1's nine fixes verified landed and correct;
  two residues (the anchor-check undercount, the red output's destination) applied.
  The plan survived the stranger's read.

## Ticket 91

Executor session: ses_ec0757e9bffe1Rx1fiqaIIcG11 (batch 1: step 1)

### Step 01 — done

Pre-flight from a $TMPDIR copy printed `PREFLIGHT OK` (uat at ad0581e8, clean
tree, row 91 READY, ten anchors each counting 1). Branch
`fix/91-android-only-simulate` off uat. Red: the four verbatim test edits
landed, then the suite printed exactly the predicted failure — `expect(jest.fn()).not.toHaveBeenCalled()`
`Expected number of calls: 0` / `Received number of calls: 1` in
`runBackgroundTaskDebugSequence gating > never simulates on iOS in __DEV__`
(1 failed, 10 passed), Jest stopping at the first assertion; the Android test
passed against today's code as the plan designed. Change: the five contracts
applied verbatim (the Platform import, the three doc blocks, the whole
`runBackgroundTaskDebugSequence` replacement; no orphaned setTimeout tail).
Green: 11 passed, 11 total; `npx tsc --noEmit` exit 0; `npx biome check .
--error-on-warnings` exit 0. Break script: B1, B2 and B3 each flipped its
named test red, last line `ALL AS EXPECTED: 1`; the tree then held only the
step's files. Version 2.0.754 taken under the lock (origin/uat and local uat
both 2.0.753), set in app.json first, then package.json, then the gitignored
`android/app/build.gradle` versionName (never added). Commit 311ba5c8: hook's
last line `Tests: 5656 passed, 5656 total`; coverage `Statements : 100%
( 5336/5336 )`, `Branches : 100% ( 2298/2298 )`, `Functions : 100%
( 1109/1109 )`, `Lines : 100% ( 4778/4778 )`. Review: cold read of
`git show 311ba5c8` against the step checklist clean on the first pass —
contract 5 byte-for-byte, doc blocks 2 to 4 exact, the Platform import under
the expo-task-manager import in both files, both platform tests verbatim with
the afterEach restore, only the Files list changed (stores/, node_modules and
patches/ untouched), no lifecycle, thread, residue or rule exposure, versions
matching in all three places. Merged --no-ff into uat as 71a3a602 (`ort`
strategy, branch deleted). Queue row 91 read `IN PROGRESS, step 1` inside the
step's own commit.

session: ses_ec0757e9bffe1Rx1fiqaIIcG11
