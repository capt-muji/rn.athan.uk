# HANDOFF — Notification Horizon & Observability (#14 → #7/#16 → #15) + Owner Device Confirms

Project: Athan.uk — React Native prayer-times app for London (Expo SDK 57, RN 0.86.3,
React 19.2.3, TypeScript 7.0.2 strict, Jotai, MMKV, Reanimated 4.5.1, Yarn 1, Biome 2.5.11).
Repo: /Users/muji/repos/rn.athan.uk, branch **uat**, clean, pushed (HEAD after last
session: e0a37df + the F.4-ledger/docs commit that carries this handoff).
Tests: **26 suites / 739 green** (`yarn validate`). Biome: **0 warnings**.

FIRST: read `ai/AGENTS.md` in full, then this file in full. This handoff assumes you
have NO memory of previous sessions — everything you need is here or pointed to.
The authoritative backlog is `ai/ISSUES.md` (read the issue numbers cited below).

---

## 1. WHAT THE LAST SESSIONS ACCOMPLISHED (context — do not redo, do not regress)

### Countdown tick integrity — F.6 + F.7 FIXED (merged d07a1b5)

The entire countdown ticker pipeline was reworked after instrumentation proved the old
model wrong. The CURRENT architecture (all in stores/countdown.ts + hooks/useCountdown.ts):

- **Wall-second self-correcting chain** (`startWallClockTicker`, stores/countdown.ts):
  each tick is scheduled as `setTimeout(loop, 1000 − (Date.now() % 1000))` — digits flip
  just after :000 with the status bar, and JS-thread delivery latency self-corrects (a
  plain 1s `setInterval` measured +17ms/s of compounding phase drift — the root cause of
  both F.6 stretch and F.7 status-bar skew).
- **Single-ticker-by-construction + ownership guard**: every start clears + replaces the
  key's handle; the loop checks `countdowns[key] !== invocationId` after `tick()` so a
  transition-restart can never be clobbered by its parent chain. (Sync re-entrancy had
  leaked up to SIX concurrent intervals — re-entrancy immunity is unit-tested.)
- **Display contract (owner-specified, unit-pinned)**: ceil rounding — the last visible
  digit is **1s**, **0s never displays anywhere** (also in formatTime: whole values read
  "1m"/"1h", never "1m 0s"), and the swap to the next prayer happens at the boundary.
  Helpers: `getSecondsRemaining` / `getWallSecondDelay` in shared/time.ts.
- **Timezone model (settled — do not touch)**: prayer datetimes are TRUE UTC instants
  (`createPrayerDatetime` = `fromZonedTime(..., 'Europe/London')`); per-tick diffs are
  `target.getTime() − Date.now()` — offset cancels, no timezone work per tick. DST is
  handled at target creation (pinned by tests: Oct fallback window = 8.5h real, Mar
  spring-forward = 6.5h real). `createLondonDate()` remains ONLY in sequence/display
  logic (stores/schedule.ts, sync.ts) where wall-clock London is genuinely needed.
- **Verification numbers**: transitions fire 5–18ms after the minute (were 400–900ms),
  tick phase locked 9–19ms (was drifting), median inter-tick 1000ms, `transitionMs: 3`.
  TICK debug logs remain in the code (logger.debug) — invisible in prod, streamable in
  dev builds (see §4 gotchas).
- **F.7 status**: fixed in code; ONE remaining item is the owner's on-device confirm on
  his OnePlus 8T (see §5 owner checklist).

### Other completed items

- **#13 APK permission audit — CLOSED**: prebuild + gradle assembleRelease + `aapt dump`
  ground truth: USE_EXACT_ALARM + SCHEDULE_EXACT_ALARM both survive into the merged
  manifest (full dump in the ledger). `android/` dir exists and is KEPT (gitignored,
  regenerable) for future gradle work.
- **F.8 Biome — CLOSED**: 77 → 0 warnings. Pattern for suppressions:
  `// biome-ignore lint/<group>/<rule>: <why>` directly above the diagnostic line
  (for JSX attributes, between the attribute lines, not above the element).
- **F.4 Extras order — CLOSED, invariant recorded** (see §2 rules).
- **formatTime**: "0s" suffix eliminated next to other units.
- **Mock cascade runbook** (mocks/simple.ts offsets + night-testing constraint) in
  `ai/USAGE.md` § "Mock cascade simulation" — READ IT before any sim testing. Key
  points: offsets are minutes-from-launch in the `[today]` block; relaunch via
  `xcrun simctl launch` (NOT the dev-client URL the build auto-opens); during
  00:00–05:59 the intended midnight rules claim a night Isha (datetime → tomorrow,
  belongsTo → yesterday), so the Maghrib→Isha handoff can only be simulated
  06:00–23:59. Both midnight rules are OWNER-INTENDED and dormant in production.

---

## 2. HARD RULES — things that are settled and must NOT be re-litigated or touched

1. **Bottom sheets**: @gorhom/bottom-sheet 5.2.14 + BackHandler in
   components/sheets/parts/Sheet.tsx — owner-verified.
2. **Home pager**: react-native-pager-view@8.0.2 with `overdrag`. @expo/ui is REMOVED
   from the project — never re-add it (its native pager's shifted coordinate space
   caused the F.9 overlay regression).
3. **Overlay measurement architecture**: one-shot load-time `measureInWindow` in
   List.tsx/Day.tsx/Overlay.tsx — owner rejected press-time re-measure. Don't touch.
4. **Notification scheduling logic**: any change = ASK FIRST (AGENTS.md tier) and it is
   the SUBJECT of this session's work, so read §5 before editing.
5. **`calculateBelongsToDate` + `adjustPrayerDateForMidnightCrossing`** (shared/prayer.ts):
   OWNER: "working as intended — do not change." Standard Isha 00:00–06:00 → belongs to
   previous Islamic day + datetime on next calendar day; Extras night prayers ≥12:00 →
   belong to next day. Dormant with real London data; night-mock artifacts are expected.
6. **No `Platform` checks in the countdown path** — the countdown pipeline is
   platform-agnostic by mandate. (A Platform split in NOTIFICATION constants — §5 — is
   a different path and is allowed; that rule is countdown-specific.)
7. **Timezone handling is settled** (see §1). Never reintroduce per-tick
   `createLondonDate()` in tick/diff paths.
8. **0s never displays anywhere** — ceil contract + formatTime rule, both unit-pinned.
9. **Extras order invariant (owner, verbatim)**: Midnight 1st, Last Third 2nd, Suhoor
   3rd, Duha 4th, Istijaba 5th (Friday-only, always last). Enforced by
   `canonicalDisplayOrder` + `EXTRAS_ENGLISH`; never re-litigate.
10. **Biome useExhaustiveDependencies is never disabled** (globally or in biome.json).
11. **Pino only** — `console.log` is a Biome error. Logger is message-first:
    `logger.info('MSG', { data })`, from `shared/logger`. Level is 'debug' (needed so
    TICK debug lines emit in dev builds; prod still silences everything).
12. **Commit convention**: `1.5.3 - <description>`. Branch per issue, merge to uat,
    push. `yarn validate` before every commit (pre-commit hook runs it anyway, ~30s).

---

## 3. KEY FILES (the countdown/time system as it NOW stands)

- stores/countdown.ts — store tickers (std/extra/overlay), `startWallClockTicker`,
  ownership guard, transition → `refreshSequence(type)` → recursive restart.
- hooks/useCountdown.ts — header countdown hook (same wall-second chain, ceil clamp).
- hooks/useCountdownBar.ts — render-time progress from `Date.now()` (no interval).
- shared/time.ts — `getSecondsRemaining` (ceil, ≥1), `getWallSecondDelay`,
  `createLondonDate` (wall-clock London — sequence/display use only),
  `createPrayerDatetime` (fromZonedTime → true UTC instants), `formatTime` (no 0s
  suffix), `getSecondsBetween` (floor — internal logic only).
- stores/schedule.ts — sequence atoms, `createNextPrayerAtom` (derived:
  `find(datetime > now)`), `refreshSequence` + `filterRelevantPrayers`
  (keeps passed prayers of current display date + the immediate previous prayer),
  `mergeAndDeduplicatePrayers`, display-date atoms.
- shared/prayer.ts — `createPrayerSequence(type, date, 3-day buffer)`,
  `calculateBelongsToDate`, `adjustPrayerDateForMidnightCrossing`,
  `canonicalDisplayOrder`, extras derivation (Suhoor = Fajr−20, Duha = Sunrise+20,
  Istijaba = Magrib−60 Friday-only, Midnight/LastThird from night span).
- stores/notifications.ts — scheduling (2-day rolling buffer,
  `NOTIFICATION_ROLLING_DAYS` in shared/constants.ts:68, `genNextXDays`,
  `_rescheduleAllNotifications` at :695-724, `withSchedulingLock`).
- stores/sync.ts — `sync()` → `initializeAppState` → `startCountdowns()`; re-entrant
  by design (launch + every foreground-return + loadable re-evals) — tickers are
  immune (§1), but be aware sync runs multiple times per foreground.
- mocks/simple.ts + ai/USAGE.md — simulation runbook (READ FIRST).

---

## 4. ENVIRONMENT & GOTCHAS

- **Simulator**: iPhone 16, UDID `8FB33B9F-A3D4-4776-A4E6-4BE17228E9DC`, iOS 26.5.
  Build: `npx expo run:ios --configuration Release` (incremental ~4-6 min; first build
  ~15). After install, ALWAYS clean-relaunch:
  `xcrun simctl terminate <UDID> com.mugtaba.athan; xcrun simctl launch <UDID> com.mugtaba.athan`
  — the build's auto-launch opens a dev-client URL that parks the app on a
  "connecting to Metro" screen (JS still boots; hooks/pages do NOT mount).
- **Logs**: JS logs surface as `com.facebook.react.log:javascript` entries.
  INFO-level: `xcrun simctl spawn <UDID> log show --info --predicate 'eventMessage
  CONTAINS "..."' --last 5m`. DEBUG-level (TICK lines): **stream-only** —
  `log stream --predicate ... --level debug` (os_log does not persist Debug entries;
  `log show --debug` retrieves nothing). Poll in short cycles (owner preference:
  ~5s sleeps, never long blocking sleeps).
- **Android**: `$ANDROID_HOME` set, build-tools 34–37 (aapt), JDK 17. `android/`
  exists (gitignored). Gradle gotcha: if a run dies, `pkill -9 -f GradleDaemon;
  pkill -9 -f KotlinCompileDaemon` FIRST (journal locks), and run builds in background
  with a log file. **No Android emulator AVD is installed** — if on-emulator testing
  is needed, one must be created in Android Studio (owner pre-approved this).
- **Jest**: babel hoists ESM imports above `jest.mock` factories — reference mocks only
  via `mock`-prefixed vars; `require()` the module under test after mock declarations;
  factories may not reference out-of-scope variables (use `jest.requireActual` spread
  for pass-through). Date-sensitive tests: use the `londonDate(offsetMs)` helper
  (formatInTimeZone 'Europe/London') — NEVER `toISOString()` for London-day
  expectations. `jest.useFakeTimers()` + `jest.setSystemTime()` drive the tickers
  deterministically (see stores/__tests__/countdown.test.ts "ticker integrity").
- **EXPO_PUBLIC_ENV**: default 'local' keeps mock data + logging alive in Release
  builds. Prod/preview disable logging entirely.

---

## 5. THE WORK — NEXT SESSION(S), IN PRIORITY ORDER

### Priority 0 — Owner device checklist (NO code; hand the owner this list)

One sitting on the OnePlus 8T with a dev/debug build:
1. **F.7 confirm**: at a prayer minute, watch the status bar flip vs the app's 1s→swap.
   PASS = swap within ~100ms of the flip. (Optional: `adb logcat` TICK lines — every
   `computed` write should carry phase <100ms.)
2. **#12 confirm**: no double notifications (fix d20ccf5 deterministic IDs — code
   already merged; needs on-device confirmation to close).
3. **Android back-gesture**: hardware-back dismissal of bottom sheets (BackHandler in
   Sheet.tsx — sim-verified only).

### Priority 1 — Issue #14: exact-alarm / power-state observability module (CODE)

The keystone: unblocks diagnosis of #10/#11 and future Play-policy questions. Spec
(from the ledger; keep it small):
- ~30-line LOCAL Expo module in the repo (`modules/` dir — NO npm dependency; follow
  the expo-module skill / Expo Modules API for SDK 57).
- Expose two functions: `canScheduleExactAlarms(): Promise<boolean>` (Android:
  AlarmManager.canScheduleExactAlarms; iOS: resolve true) and
  `isIgnoringBatteryOptimizations(): Promise<boolean>` (iOS: true).
- Log both at every notification refresh; optionally a one-time settings banner if
  degraded (exact-alarm denied OR not power-allowlisted).
- Note: power allowlisting grants an exact-alarm exemption (Android docs) — one
  guided flow (`ACTION_REQUEST_SCHEDULE_EXACT_ALARM` /
  REQUEST_IGNORE_BATTERY_OPTIMIZATIONS) fixes both.
- The manifest half is settled (#13: both permissions present); the risk is RUNTIME
  denial on Android 13+ (SCHEDULE_EXACT_ALARM default-deny) and ColorOS revoke layers.
- Deliverable: module + wiring + logs, unit tests where testable, sim smoke (iOS true
  path), ledger #14 update. Then the owner runs one phone session to capture ground
  truth on the 8T/Find X8 → feeds #10/#11.

### Priority 2 — Issues #7 + #16: platform-split notification horizon (CODE, ASK FIRST)

Owner goal: open the app once a week, still get athans. Plan (ledger-backed):
- `NOTIFICATION_ROLLING_DAYS` (shared/constants.ts:68) → platform-split: **Android 14
  days, iOS stays 2** (iOS silently keeps only the soonest 64 pending; Android ~500
  alarm cap vs 16/day × 14 ≈ 224 — safe).
- This changes notification scheduling logic → AGENTS.md "ask first" tier; the owner
  has already endorsed the direction in the ledger, but confirm scope before editing
  (e.g. whether to also gate on #14's exact-alarm state).
- Interacts with #15 (reschedule window) — consider doing them together or #15 first.

### Priority 3 — Issue #15: zero-notification window during global reschedule (CODE)

`_rescheduleAllNotifications` cancels ALL + wipes DB BEFORE scheduling new ones →
process death mid-batch = zero notifications, no records. Fix: schedule-first-then-
cancel-stale (deterministic IDs from d20ccf5 make this clean) + post-refresh
verification: compare `getAllScheduledNotificationsAsync()` count vs expected, log
mismatch.

### Parked / low-ROI (do not start without owner)

- #10/#11 (ColorOS ±60s late/early): blocked on #14 data.
- #8 (background task): native constraints documented in the ledger; foreground 4h
  refresh is the only layer that has ever worked; low ROI until #7 lands (horizon
  extension makes the background layer optional, not load-bearing).
- Deferred #4 (Jan 1 redundant fetch), #5 (Dec 31 derived times ±1-2min).

---

## 6. REFERENCE COMMITS (recent → older)

- e0a37df..(HEAD of last session) F.4 ledger closure + night-constraint docs.
- d07a1b5 merge fix/f6-f7-countdown-tick-integrity (the ticker rework; read its diff
  if you need the before/after of stores/countdown.ts + hooks/useCountdown.ts).
- e2d679e merge fix/f8-biome-exhaustive-deps (77 → 0 warnings).
- c2f42bd merge chore/apk-permission-audit-13 (#13 ground truth).
- f252ad9 formatTime no-0s-suffix; 8fd1ec0 mock cascade + runbook.
- Earlier, pre-session context: 73be02a (pager revert, F.9), 788e984 (sheets revert),
  d20ccf5 (deterministic notification IDs, #12), 7ea441f (#9 ADR-007 fix),
  500087b (F.4 canonical order), 0e7adcb (SDK 54→57 migration itself).

Final state to drive to: owner device confirms done; #14 merged (logs flowing on a
real phone); #7/#16 platform-split decision made or merged; #15 hardened; ledger
updated; everything `yarn validate`-green (739+ tests), zero Biome warnings, pushed.
