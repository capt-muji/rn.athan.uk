# Execution log: Session 31

## Planning session, 2026-09-27

The plan is complete and its pre-flight passes. Execution has not started.

### Two things the planning session found and fixed before handing over

The planning commit's first attempt failed its pre-commit hook with 7 failures, none in files this session touched.
Three causes, each measured rather than guessed:

1. **`shared/__tests__/widgetRuntimeLoads.test.ts` failed with `(0 , n.memo) is not a function`.** This session's own
   `yarn add expo-in-app-updates@0.12.0` re-resolved the tree and put a NESTED `@expo/ui@58.0.7` under
   `node_modules/expo-widgets/node_modules/` while the flat pin still read `58.0.5`. `ai/AGENTS.md` already documented
   the nested-copy trap, but said it came from pinning `@expo/ui` alone; **any `yarn add` can cause it**, and that
   wider trigger is now written into the same entry (1.29.24). Remedy applied:
   `rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile`. The guard worked exactly as
   designed: the suite that builds and loads the real bundle is what caught it. The same install also left three
   copies of `@react-native/codegen` at three versions, which `yarn check --verify-tree` shows.
2. **`shared/__tests__/versionLockstep.test.ts`** was a transient of that reinstall and passes.
3. **`stores/__tests__/notifications.test.ts`, 5 failures: a real latent bug, ISSUES #41, now FIXED** in 1.29.23 on
   `fix/41-clock-independent-notification-tests`, merged and pushed. It predated session 30, reproducing at
   `a265ec1d`, `182a3e32`, `475c532f` and `5c3f2f00`.

### ISSUES #41, and the owner's ruling that settled it

The suite's `rescheduleAllNotificationsFromBackground` `beforeEach` seeded today's prayers **all at `12:00`**, taking
the DAY off the real clock via `TimeUtils.getTodayDateString()`. After 12:00 London every seeded row is in the past,
session 28's time-ordered scheduler arms nothing, and five assertions about a completed reschedule fail. Every commit
that day ran between 10:29 and 10:33, so the hook was green all morning and red at 13:56.

The planning session first logged it as out of scope and handed it back. **The owner rejected that**, and was right:
🐋  "a test should not be based on what time of date being run. Our test should be mocking the time... everything
should be mocked so that we can properly test the scenarios. That's the whole point of a test." A test that depends on
the hour is a defect, not a scheduling problem, so it was fixed immediately rather than queued.

The fix pins the clock with `jest.useFakeTimers({ now: london(SEEDED_DAY, '09:00') })` BEFORE the seed is built, takes
the day from a fixed constant, spreads the nine prayers `12:00` to `12:08`, and restores real timers in an
`afterEach`. Proof it guards rather than merely passes: removing the pin fails exactly those five again, and restoring
it returns `160 passed`. `yarn validate` is green at 4774 tests and 100% on all four measures, run after noon. The
rule and the trap are written into `__tests__/README.md` and `ai/AGENTS.md`.

### One correction this makes to the plan

Step 1 installs a dependency, so it must run the nested-copy remedy afterwards. Section 10's symptom table carries it.
