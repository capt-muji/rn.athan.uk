# Code audit — brief (task 18)

For a fresh session. The uat-2 program (tasks 1–17) is finished and merged; this
brief sets up tasks 19 (findings) and 20 (changes, one at a time).

## What this app is

An alarm clock. A prayer time that is two minutes wrong is a bug, and a
notification that fires on the wrong night is a serious one. Correctness of
*times* outranks everything else — performance, tidiness, style. Judge findings
by that.

## Standing constraints

- **Never commit the API key.** It lives in the session scratchpad and reaches
  builds through the environment only.
- ~~**No package upgrades.** The owner deferred them: if it works, it works.~~
  **SUPERSEDED 2026-09-12**: the owner reopened package upgrades — *"this sounds like a
  good time to upgrade packages"* — as their own programme, briefed at
  `ai/features/upgrades-2026-09/BRIEF.md`. They are still out of scope for *this* audit
  (keep the two efforts separate so a finding is never confused with a version bump),
  but "we cannot change that, it is a dependency" is no longer a valid reason to dismiss
  a finding. Record it and point at the upgrade programme.
- **Nothing may assume London.** v2.0 goes global, and other regions do not
  share London's DST rule — the US switches on different dates, Brazil abolished
  DST in 2019, South Asia has none. `PRAYER_TIMEZONE` in `shared/constants.ts`
  is the single setting; anything that hardcodes London elsewhere is a finding.
- **One change at a time, measured before and after, verified on the device.**
- Version bump in `app.json` + `package.json` on every commit; commit prefix
  `X.Y.Z - `; feature branches off `uat-2`, merged back with `--no-ff`.

## Already settled — do not re-litigate

Re-deriving these wastes a session. Each is device-verified or test-pinned:

- **Night times (ISSUES #29)**: a night belongs to the day that follows it, so
  the Extras list for day D uses D−1's Maghrib and D's Fajr, measured in real
  elapsed time. Verified on the 3T for 12 Sep, 24 Oct and the clocks-go-back
  night of 25 Oct (Last Third 01:00, not ~01:20).
- **Timezone model (ISSUES #30)**: calendar days follow `PRAYER_TIMEZONE`, read
  by Intl from the instant, carried as `YYYY-MM-DD` strings. No date-fns-tz in
  app code. `yarn test:tz` runs the suite under four phone timezones.
- **The API is the source of truth on DST**: its times are local wall-clock
  readings and already shift across both transitions (Dhuhr 12:50 → 11:50 in
  October, 12:11 → 13:10 in March). The app interprets, never corrects.
- **TLS provider (ISSUES #21, #32)**: `modules/tls13`'s ContentProvider must
  keep running before `Application.onCreate`. It costs ~3.1 s of the 3T's 6.6 s
  cold launch and is a no-op on Android 10+. A JS-side install fixes debug and
  fails release. Leave it alone.
- **Launch time (ISSUES #32)**: measured and split. One change was tried
  (deferring `index.tsx`'s settling-window imports), measured as a null result
  and reverted. The remaining ~900 ms is expo-router bootstrap plus the core
  import graph; React needs 1–3 ms from module body to first render.

## Leads already found, not yet acted on

From ISSUES #33 and the launch work. Confirm each before acting — some may be
acceptable as they stand:

1. **Four of six hook test files do not exercise their hook.** `usePrayerAgo`
   (now fixed), `useCountdownBar` and `usePrayerSequence` assert a local
   re-implementation; `useCountdown.test.ts` tests a `shared/time` helper
   instead. There is no renderer in the dependency tree, which is *why* — the
   answer is to export the pure part and test that, as `tipGeometry.ts` and
   `catcherGeometry.ts` do. Adding a renderer means a new dependency, which is
   out of scope without the owner's word.
2. **Three suites seed fake timers from the real clock** and then assert on
   `advanceTimersByTime`: `widgetSettingsSync` (11 advances), `countdown` (14),
   `backgroundTaskDebug` (3). One such test failed about one run in sixty until
   it was pinned (#33). These pass today and the countdown ticker deliberately
   aligns to wall seconds, so they may already compensate — check before
   changing.
3. **`js_to_content` is mislabelled**: despite `perfMeasure('js_to_content',
   'perf_monitor_init')`, the emitted measure starts ~29 ms before
   `index_first_render`, not at the mark. Any reading of that number is wrong by
   ~800 ms.
4. **R8 is off** (`android.enableMinifyInReleaseBuilds` set nowhere) — 6 dex
   files, ~54 MB, in a 141.6 MB four-ABI universal APK. Untested as a lever.
5. **`date-fns-tz` is now used only by three test files.** Whether it should
   move to devDependencies is a dependency-graph change, hence deferred.

## Where to look, in priority order

1. **Times and scheduling** — `shared/time.ts`, `shared/prayer.ts`,
   `shared/notifications.ts`, `stores/notifications.ts`, `stores/schedule.ts`,
   `stores/sync.ts`. Anything that can make a row and its alert disagree, or a
   day boundary land differently in two places, is the highest-value finding.
2. **State that survives restarts** — `stores/database.ts`, `stores/version.ts`,
   the upgrade/wipe paths. Note the trap found in #29: a version *decrease* does
   not trigger `handleAppUpgrade`, so the cache is not wiped.
3. **The background/notification chain** — `device/tasks.ts`,
   `device/notifications.ts`, and the 2-day rolling window.
4. **Everything else** — presentation, widgets, sheets. Real but lower stakes.

## Deliverables

- **Task 19**: findings, ranked by risk to correctness, each with the evidence
  that proves it (a failing test, a device capture, a source citation). Say
  plainly when something is a guess.
- **Task 20**: changes, one at a time, each validated and — where it touches
  times or the device — verified on the 3T before the next one starts.

## Tools that already exist

- `yarn validate` (tsc + biome + jest), `yarn test:tz` (four timezones).
- `yarn check:device` — build identity, permissions, notification channels and
  every armed alarm; fails when nothing is armed.
- `e2e/scripts/` — idle CPU, frame audit, baseline compare.
- `ai/RUNBOOK-performance-testing.md`, `ai/RUNBOOK-background-tasks.md`, and the
  gotcha list in `e2e/README.md`. Read the gotchas: each one cost real time.
