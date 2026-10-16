# LOG: ticket 120

## Planning (2026-10-16)

Anchors extracted and verified (each counts 1) at `d1ce39d9` (uat 2.0.924). Library facts
verified from the installed `node_modules/expo-notifications@58.1.5`: JS export
`src/index.ts:20`, iOS native route to `removeAllDeliveredNotifications`
(`PresentationModule.swift:19-21,37-39`), Android route to `cancelAll`
(`ExpoPresentationDelegate.kt:275-278`, the reason the iOS gate is mandatory). Jest project
name for the suite is `unit` (jest.config.js). The house fake-timer pattern sits in
`device/__tests__/notificationNativeTimeout.test.ts`. Lane 111's step-3 file
(`ai/plans/111-sdk58-stable-repin/steps/3-xs-loop.md`) supplied the iOS build-and-proof
vehicle: the env flags, the inline team, the throwaway launch, the unified-log delivery line.

Decisions D120.0 through D120.7 recorded in PLAN.md section 2.1. No open questions remain:
the frontier is empty.

## Ticket 120

### Planning — DONE 2026-10-16

Two grill rounds, both cold on the plan folder. Round one: ten findings (four must, five
should, one nice), all applied - the red-run filter skipped the tests it claimed red, tests 4
and 5 passed before the change, the suite needed its own mock reset (no clearMocks in the unit
project), the mock seed story was false at the planned sha (Asr seeds in the past; Maghrib and
Isha are what fire), the contracts carried the history their own review fixes repudiated, the
error log line had no asserting test, the swipe route and env leaks were unpinned. Round two
(read against the skeleton by mistake of the dispatcher, adjudicated against the revised text):
five real findings, all applied - the capture now starts before the reseed, the env switch
between builds clears the Metro cache and proves its transform by the bundle-key check
(mirroring build-prod.zsh), mutant M1 became a gate deletion (the flip reddened nothing), the
background fence gained its asserting test in tasks.test.ts, and the docs commits name their
version and locks. `bash scripts/check-plan.sh` prints `PLAN OK` after each round. The cold
executor reread found no question the plan does not answer.

session: ses_eb9b00605ffesG6MRL0iHvUlVT, ses_eb9a15744ffeZJMHzdZFXRz7Pb

Lane weather at the READY merge: lane 119's commits moved uat to 2.0.928 and the merge
conflicted on the version files and the queue. Resolved per protocol: merge aborted, lane/120
rebased onto uat, row 119 kept at its later EXECUTED state, row 120 kept at READY, the version
kept at the higher 2.0.929. One retry.

### Step 01 — pending

session:
