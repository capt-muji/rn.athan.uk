# Performance Campaign — Owner Requirements

> Transcribed from the owner's session brief (2026-09-05). Source of truth for scope.

## Goal

Improve app performance in every way: fast launch, instant-feeling interactions, zero lag,
no UI timeouts, no blocking — a single user (including a "crazy child" spamming every
control) must never be blocked for more than a moment.

## Scope

- **In scope**: everything the user touches in the app — app open/splash→interactive,
  navigating between pages, opening/closing bottom sheets, spam-tapping toggles, playing
  different audio sounds, the large-text overlay, edge cases (tap alert icon then instantly
  tap backdrop, spam sheets/toggles/sounds, rapid switching).
- **Out of scope (this campaign)**:
  - Notifications behavior (awaiting separate PRs) — do not change scheduling semantics.
  - iOS widgets pipeline changes — widgets are broken upstream (expo issue, WIP);
    `stores/widget.ts` may be measured and documented but NOT modified.
  - Post-reboot headless behavior — the app is only expected to work after the user has
    opened it at least once.
  - Simulators/emulators — physical devices only.

## Devices (both physical, plugged in, stay-awake, never reboot)

| Device | Details |
| --- | --- |
| iPhone XS | A12, iOS 18.7.10, UDID `IPHONE_UDID` |
| OnePlus 3T | SD820, Android 9, adb `3T_SERIAL`, 30-min screen timeout + stay-on-while-USB |

Both devices are clean (nothing else installed) — **best case. The device is NEVER the
excuse: every slow number is a codebase finding.** Same targets on both platforms; fixes go
in shared code paths, not platform special-cases.

## Methodology requirements (owner)

1. **Deep research first**: latest React Native/React docs (indexed via docs-mcp at the
   project's exact versions), package source via `opensrc` CLI, performance-test library
   research. Verify against real docs — never training data.
2. **Physical-device measurement** of every action from beginning to end (tap → haptic →
   state write → animation settled → background work finished). Heavy logging for perf
   purposes.
3. **Baseline before / after capture** — performance-wise AND behavior-wise. Performance
   must improve with each iteration; behavior must stay 1:1 feature-wise (only faster,
   snappier, more responsive).
4. **Iterate over and over** — even the smallest things. Pre-compute, cache (MMKV is fast —
   add whatever is needed), compute-on-the-go only where correct. Re-architect code and
   design patterns where warranted. Multiple rebuilds expected.
5. **Nothing takes >1s**; interactions should be milliseconds. No UI timeouts, no blocking.
6. **Quality over quantity** — 200 tasks is fine; absolute perfection is the bar.
7. **Instrumentation stays after the campaign**, gated by a build-time env toggle
   (`EXPO_PUBLIC_PERF_MONITOR`) so local/prod builds pay zero cost; CI can enable it later.
8. **Documentation**: runbook for future sessions (6 months later), ADR for the
   instrumentation architecture, new performance design rules in AGENTS.md for future
   features, ISSUES.md updates.
9. **Build mode**: Release builds (≈ production) as the measurement vehicle; dev builds
   only for flame-graph diagnosis.
10. **Branch**: `perf/testing` created from `fix/background-scheduling` (branch chain:
    widgets → notifications → perf). Owner granted a one-time exception for branch
    creation; all commits remain the owner's.
