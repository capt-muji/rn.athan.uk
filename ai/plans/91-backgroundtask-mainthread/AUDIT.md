# Ticket 91 audit

Three reviewer passes over `origin/uat..uat` (the range 2.0.753 to 2.0.755 at
adjudication): plan-conformance, blind, and a third blind pass focused on
threading and lifecycle (this ticket touches the notification periphery). The
lead adjudicated every finding against the code.

| # | Pass | Finding | Verdict | Action |
| --- | --- | --- | --- | --- |
| 1 | plan-conformance | None. | Clean | None |
| 2 | blind | `device/__tests__/backgroundTaskDebug.test.ts:142` - the release-guard tests run on iOS, so the platform conjunct alone blocks the simulate there; the mutant deleting `__DEV__ &&` from `device/backgroundTaskDebug.ts:109` survives the whole suite, breaking the owner's mutation-pass rule on the ticket's entire guard. | Confirmed (the lead reproduced the surviving mutant before fixing) | Fixed at 2.0.756: the env-enabled test runs as Android, `__DEV__` the sole blocker |
| 3 | blind | `device/backgroundTaskDebug.ts:82` - the simulate doc still described the iOS private-selector path and its iOS-only console diagnostic while its own header declared the function Android-only. | Confirmed (the Android delegate runs WorkManager now, `BackgroundTaskModule.kt:26-36`; the "No task request" line was BGTaskScheduler's) | Fixed at 2.0.756: the doc names the Android WorkManager run and why iOS never reaches it |
| 4 | threading-lifecycle | The same `__DEV__` conjunct gap, proposed as a new test (env-enabled Android, dev false, trigger never fires). | Confirmed, merged with finding 2 | The one-line platform flip in the existing env test was taken over a new test: the env-plus-iOS combination distinguishes nothing (both conjuncts false either way) and dev-iOS already pins no-trigger on iOS |

The threading pass also cleared, with citations: every thread and queue reaching
the changed lines (one production caller, the launch effect's 1.5 s timer on the
JS thread); the reload lifecycle (`commitLanguagePreference` → `Updates.reloadAsync`
rebuilding the JS context and re-arming the sequence, the 09:53 crash path, now
returning before arming on iOS); no timer, subscription or promise outliving its
context; production scheduling byte-identical (`isDebugEnabled()` false in store
builds returns before any scheduling-adjacent call; the register path, the
scheduling lock and the convergence are untouched); and the fake-timer behaviour
of the nested 8 s + 5 s chain.

The audit fix, red first: the mutant `Platform.OS === 'android'` (dev conjunct
deleted) was applied against the fixed suite and failed
`logs snapshots but NEVER simulates when env-enabled outside __DEV__` (1 failed,
10 passed); restored, the suite passed 11 of 11 with tsc and Biome clean. The full
four-mutant pass then ran: platform clause dropped, platform inverted, armed log
frozen, dev conjunct dropped - each flipped a named test red, last line
`ALL AS EXPECTED: 1`. Commit 605d2985, hook `Tests: 5656 passed, 5656 total`,
merged --no-ff into uat. The fix diff read cold once: one test line, one doc
block, nothing else.

PASS.
