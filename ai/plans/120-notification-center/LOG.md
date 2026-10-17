# LOG: ticket 120

Resume from: Step 2, the XS glass pair, then the audit. DONE so far: step 1 merged (b89c0d3f, 2.0.934) and the SIMULATOR LEG COMPLETE (sessions/120/SIM-LEG-RECORD.md: four timestamped deliveries 01:57:00/02:04:00/02:13:00/02:14:00, the lock-screen pair one-entry-at-02:02 -> logged open 02:11:28 -> zero-at-02:11:44, the RN-log-line void recorded). REMAINING: (a) the XS glass pair - the mock build is installed on the phone (keyless bundle verified); the phone's agent-device claim was held by a sibling all night, so the read route is EITHER the diagnostic build from a scratch worktree at uat (initializeNotifications logs getPresentedNotificationsAsync().length before and after the clear; never committed to uat; scratch worktree removed after) OR the center read if the claim frees (fling -> screenshot within 2 s, the lock-screen route per SIM-LEG-RECORD.md); one closed-app fire first (devicectl terminate by PID - the name form of terminate is broken on this devicectl; banner race at +2..6 s). (b) Return the phone to the prod build (the plan's final act: EXPO_PUBLIC_ENV=prod + key + widgets flag, metro cache cleared, bundle-key check PRESENT). (c) The three-pass audit (blind + plan-conformance + the threading/lifecycle blind), fixes, DONE row, plan folder and sessions evidence deleted, worktree and branch removed. uat was at 2.0.941 and moving; take the next patch under version.lock. Instruments tonight: bay clean, all locks released, sim left booted with the mock install.

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

### Step 02 — IN PROGRESS 2026-10-16 (the doctrine rewrite)

Progress 2026-10-17 02:30: the simulator leg is complete and recorded at
`$HOME/athan-gitree/sessions/120/SIM-LEG-RECORD.md` (the pair, the delivery
timestamps, the void, the instrument notes). The XS glass leg landed its build
(mock Release installed and live on the phone, the bundle verified keyless) and
one closed-app fire at 02:21:00, but every center/gesture read was blocked: the
phone's agent-device claim is held by a sibling workspace session (DEVICE_IN_USE
from three fresh cwds; never forced - two automation stacks on the owner's phone
is the corruption class the lane rules fear), and no WDA or other gesture route
exists on this machine. The resume shape (the diagnostic build, or the claim
freeing) sits in the Resume-from note above. The phone still carries the mock
build: the resume's prod return is mandatory before DONE.

session: (the lane lead, in-session)

The glass leg, 2026-10-17 06:45-07:15: the phone freed (lane 111 DONE), the claim gone. The
cycle per the resume note, devicectl-only (every agent-device interaction treated as a
potential open): seed launch 06:53:25, terminate 06:53:43, and the DELIVERY ON GLASS captured
by a wall-clock-synced screenshot at 06:55:03 - the banner "TIME SENSITIVE / Sunrise in 30 /
now" (the armed Sunrise reminder firing 06:55:00 with the app closed). The neutral open at
06:55:07 (devicectl launch). The center-zero read is a RECORDED VOID: three gesture routes
failed on the phone tonight (the sibling-claim era, the fling over home, the fling over the
app - the last leaves the screen untouched, both screenshots pixel-identical); the mechanism's
zero half stands on the simulator's complete logged pair, and the owner's eyeball is the
glass verdict per the repo's own iOS doctrine. The wake-time stack limitation (overnight
deliveries still stack until the first open) is recorded in the row and the corrected
docblock.

The audit, 2026-10-17 ~07:00: three passes (plan-conformance, blind, threading/lifecycle).
Plan-conformance: conforms, two NICE (the Platform.OS double-default, the persistent
mockReturnValue) - both applied. Threading: one SHOULD (a timed-out clear arms
nativeCallTimedOut, which the lock consumes hours later on an unrelated pass - a false
timeout log and a gate reopen that resets a fresh stamp) - CONFIRMED and fixed: the clear's
catch consumes its own flag via takeNativeCallTimedOut(), pinned red-first by the timeout
test's new assertion. Blind: one SHOULD (the docblock promised "a sleeper never wakes to a
stack", which open-time clearing cannot deliver overnight) - CONFIRMED and fixed by scoping
the docblock to "every app open empties the center"; the threadIdentifier suggestion REJECTED
(the row's own ground: one thread equals the app-level group iOS already gives); one SHOULD
on the tasks fence stubbing the whole stores path - CONFIRMED and fixed with a real-path
fence line in the rescheduleAllNotificationsFromBackground suite plus the task-body title
narrowed; one NICE (the unused export) REJECTED on sibling consistency
(deleteLegacyAndroidAudioChannels carries the same shape). The drive-by: lane 125's
check-version-uniqueness.js failed biome's useTemplate in this tree - four template-literal
fixes applied to unblock the hook, noted in the commit message.



Lane 111's overnight capture scripts hold the physical XS until morning, and the Release
install is instrumented and foregrounded: never kill, relaunch or reinstall over it. The
capture windows (23:57 rollover, 01:53 fire, 07:14-07:28 Sunrise delivery) are waited out in
15-second poll cycles through `$HOME/athan-gitree/device-<XS serial>.lock`, never contended.
Step 2 starts when lane 111's captures end and the lock frees.

The merge weather at step 1's landing: uat moved to 2.0.932 (lane 111's overnight staging)
mid-step; the merge resolved to the higher 2.0.934 after one aborted attempt (a first hook run
failed the lockstep while the bay's gradle lagged at 2.0.929, its killed jest workers wedged
two continuations, and the station was reset); the redo synced gradle first and landed clean
as `b89c0d3f`.

session: (the lane lead holds step 2 for the morning window)
