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

### Step 01 — DONE

Executor STOP at the tsc gate: the plan's verbatim tests failed TS2339 on the
`.mock`/`mockRejectedValueOnce`/`mockReturnValue` uses of the module-mapped import. D120.8
rules the use-site `as jest.Mock` cast (this file's own six-site pattern) over a
`require` restructure. The red phase itself matched the plan exactly (three named reds at
lines 680, 712, 731, dismiss called 0 times, fences green, tasks suite 7/7); the change had
gone in verbatim and both suites were 89/89 on jest before the revert. The executor's saved
patch: `$HOME/athan-gitree/sessions/120/step1-unfinished.patch` (apply, add the three casts,
continue).

session: ses_eb984c07cffevLsDy2LZkfwyWu

Executed 2026-10-16 from the replanned step file, fresh from the plan (the saved patch supplied
the artifacts, the three D120.8 casts added at the use sites; every artifact matches the step
file verbatim). Lane weather first: uat had moved to 2.0.931 (lane 119 DONE) and the preflight
demanded the rebase; `git rebase uat` conflicted on app.json and package.json only, resolved
per protocol keeping the higher 2.0.931 (rebased replan commit a07f9515), preflight then
printed `PREFLIGHT OK` (every anchor 1, NOTE: uat past the planned-at sha).

Red: `npx jest shared/__tests__/notifications.test.ts --watchman=false --selectProjects=unit`
gave exactly the three planned reds, each "Expected number of calls: 1, Received number of
calls: 0" (dismiss called 0 times): 'clears the delivered stack on iOS before the refresh when
permission is granted' (first failing line 680), 'a failed clear never stops the refresh'
(712), 'a clear that never answers is given up on and the refresh still runs' (731); both fence
tests green, 3 failed / 79 passed. device/__tests__/tasks.test.ts green pre-change, 7/7 with
the new fence test. The change then went in verbatim after `deleteLegacyAndroidAudioChannels`
and at anchor a1. One recorded deviation: biome's formatter (lineWidth 120) collapsed the
`withNativeTimeout(...)` call onto one 114-char line — the plan's multi-line form cannot pass
`biome check`; names, signature, behaviour and log lines unchanged (lane 111's LOG records the
same formatter precedent, the makeTree collapse).

Green: both suites 89/89; `yarn validate` exit 0 — tsc clean, biome clean, `Test Suites: 217
passed, 217 total`, `Tests: 2 skipped, 5715 passed, 5717 total`, coverage Statements 100%
(5400/5400), Branches 100% (2326/2326), Functions 100% (1130/1130), Lines 100% (4837/4837).

Mutation pass, each mutant run over both suites, its red recorded, then restored
(`git checkout -- <file>` followed by re-materializing the uncommitted green file; the working
diff's shasum was identical before and after the whole pass, 962de952): M1 platform gate
deleted reddened 'does not clear the delivered stack on Android'; M2 the clear hoisted above
the permission branch reddened 'does not clear the delivered stack when permissions are
denied'; M3 the try/catch dropped reddened 'a failed clear never stops the refresh' (and 'a
clear that never answers is given up on and the refresh still runs'); M4 the clear moved after
the refresh reddened 'clears the delivered stack on iOS before the refresh when permission is
granted' on the ordering assertion; M5 the bare await without withNativeTimeout reddened 'a
clear that never answers is given up on and the refresh still runs'; M6 the task body leaking
a clear reddened 'never dismisses delivered notifications: the clear is an open-time act' in
tasks.test.ts.

Break script: the perl pattern verified against a scratch copy first (the anticipated review
fix), then applied for real — 'clears the delivered stack on iOS before the refresh when
permission is granted' red alone (1 failed, 81 passed), the restore greened it (82/82).

Version and commit: uat moved again mid-step, to 2.0.932 (69280a0e, lane 111's overnight
staging), and is no longer an ancestor of lane/120 — that lane weather is left to the lane
lead's merge. Next patch after the higher 2.0.932: 2.0.933, app.json first then package.json
by in-place string replace, version.lock acquired with 0 waits and released. Commit 92b61a40
`2.0.933 - feat(notifications): iOS clears the delivered stack on app open` on lane/120 under
commit.lock, hook live, its output carrying `Tests: 2 skipped, 5715 passed, 5717 total` and the
four 100% coverage lines. The queue row moved to IN PROGRESS, step 1. Not merged (the lane lead
merges), nothing pushed.

session: ses_eb973afe7ffeO50Yv8UzPlkMpp
