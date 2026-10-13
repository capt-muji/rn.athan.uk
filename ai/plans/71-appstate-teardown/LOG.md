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
- Row 66's D86 no-device ruling is not carried into this row: row 66 priced the restart
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
