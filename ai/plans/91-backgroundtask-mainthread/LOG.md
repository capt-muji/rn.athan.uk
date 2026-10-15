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
