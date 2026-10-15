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
- Anchors written, nine, each verified to count 1 at f9af66c2. Skeleton committed.
