# Issue Ledger — rn.athan.uk

Last updated: 2026-08-29 (session: #15 zero-notification-window fix — schedule-first-then-cancel-stale + post-reschedule sweep; #7/#16 platform-split dropped by owner — both platforms stay identical at 2 days; #14 module dropped in favour of the adb ground-truth checklist; #11 dropped as unfixable in-app; #8 stays parked)

Status legend: [FIXED 1.5.3] shipped in commit 438f8e5 / PR #164 · [OPEN] not yet fixed · [DEFERRED] accepted, revisit later · [ACCEPTED] intended behavior, documented

---

## A. Sync / data layer

### 1. [FIXED 1.5.3] Empty-year API response treated as success

- **Symptom**: Requesting an unpublished year (e.g. year=2027 during 2026) returns
  HTTP 200 with `{"city":"london","times":{}}`. Old validation only checked `data?.city`,
  so the empty dataset passed validation, saved 0 prayers, and still called
  `markYearAsFetched(2027)`. Once flagged, `shouldFetchNextYear()` returned false for the
  rest of December → the app NEVER retried → Jan 1 required network on first open,
  breaking the seamless switchover.
- **Root cause**: `api/client.ts` `validateApiResponse` — validation checked structure,
  not content. The "retry until populated" loop only worked for thrown errors
  (network/HTTP), never for empty-200 responses.
- **Fix**: `if (Object.keys(data?.times ?? {}).length === 0) throw new Error('Incomplete data received')`
  — replaces the `city` check entirely (non-empty times implies well-formed response;
  null/malformed data also caught). Empty year = real failure at the single source of truth.
- **Tests**: `api/__tests__/client.test.ts` (new file, 4 tests: empty dataset, null data,
  HTTP error, valid+transform pipeline).

### 2. [FIXED 1.5.3] All-or-nothing December dual-year fetch

- **Symptom**: With the new validation throwing for empty 2027, the old
  `Promise.all([fetchYear(2026), fetchYear(2027)])` would reject AFTER the cache was
  already wiped (`clearAllExcept`) → both years unsaved → error state on every sync until
  the API publishes → worse than the original bug.
- **Fix**: `stores/sync.ts` December branch uses `Promise.allSettled`; each year
  saves/flags independently; next-year failure logs a warning and stays unflagged
  (retried on every sync); current-year failure still throws.
- **Tests**: 4 new cases in `stores/__tests__/sync.test.ts` (partial failure saves
  current year, app initializes when only next-year fails, retry loop across syncs,
  both-fail still throws).

### 3. [FIXED 1.5.3] Redundant cache wipe + full current-year refetch on every December retry

- **Symptom**: Every December retry while 2027 was unpublished wiped the entire cache and
  re-downloaded all ~365 records of 2026 just to re-attempt 2027. Also made December
  retries network-dependent for current-year data.
- **Fix**: New `isCurrentYearCached()` guard (checks `fetched_years[currentYear]` AND
  today's prayer record exists). Scenario 3a: cached → fetch next year ONLY, cache
  untouched. Scenario 3b: uncached (fresh install/upgrade in Dec) → wipe + allSettled both.
- **Tests**: 2 new December cases (next-year-only fetch when cached; retry loop preserves
  cache across syncs). Suite total: 695 tests green via `yarn validate`.

### 4. [DEFERRED] Jan 1 redundant previous-year fetch (non-seamless path only)

- **What**: If 2027 was never cached (API late / user skipped December opens), the Jan 1
  open runs Scenario 2: clears cache, fetches 2027, then the Jan-1 branch in
  `initializeAppState` (stores/sync.ts:49-62) finds Dec 31 2026 missing and refetches
  ALL of 2026 just for that one day's Isha (CountdownBar progress needs yesterday).
- **Impact**: One redundant ~365-record request per device per year boundary, only on the
  online path. Data correctness unaffected. Low priority.
- **Possible fix**: Store Dec 31 (or last-day) record separately before clearing, or fetch
  single-date via the API's `date` param instead of full year.

### 5. [DEFERRED] Dec 31 derived times use same-day Fajr fallback (~1-2 min error)

- **What**: `transformApiData` (shared/prayer.ts:68) computes Midnight/Last-Third using
  next day's Fajr, falling back to SAME day's Fajr for the last entry of the year —
  because no next-year data exists in the same payload. Slightly wrong for the night of
  Dec 31→Jan 1.
- **Impact**: Cosmetic-level (1-2 min) on derived extras only, one night per year.
- **Possible fix**: After both years cached, recompute Dec 31 entry using Jan 1 Fajr.

### 6. [ACCEPTED] Year-end data retention — how old-year cleanup actually behaves

- **Verified behavior** (this is what the code does today, by design):
  - `filterApiData` (shared/prayer.ts:44 → `isDateYesterdayOrFuture`, shared/time.ts:96)
    saves only yesterday-and-future dates at fetch time → each year's stored payload is
    bounded from its fetch date onward; a full-year fetch in December stores ~13 months.
  - **Seamless path (December prefetch succeeded)**: on Jan 1, `needsDataUpdate()` is
    false (today's data exists, not December anymore) → NO wipe runs → the previous
    year's records (roughly one year's worth, incl. its Dec tail) simply linger in MMKV
    through the new year. There is NO active purge of old `prayer_` keys.
  - **Dec 31 of the previous year is intentionally retained**: `getYesterdayFinalPrayer`
    (stores/schedule.ts:58-60) reads yesterday's record with a non-null assertion
    ("Sync layer ensures data exists", ADR-004) — the CountdownBar needs yesterday's
    Isha/Istijaba before the first Fajr of the new year. The Jan-1 branch
    (stores/sync.ts:49-62) re-fetches the previous year ONLY if Dec 31 is missing
    (non-seamless path).
  - **Full wipes happen in exactly two places**: `updatePrayerData`
    (`clearAllExcept(['app_installed_version', 'preference_'])`, stores/sync.ts:135 —
    runs only when a full refresh is needed) and `clearUpgradeCache`
    (stores/version.ts:105 — runs on every app version upgrade, whitelist keeps only
    version key + `preference_` prefix). Confirmed by grep: no other cleanup call sites.
- **Assessment**: stale prev-year records are bounded (~13 months max, small JSON per
  day) and harmless to correctness — the app only ever reads today/yesterday/tomorrow
  keys. MMKV growth is negligible (~1 year of records between upgrades). Old year "not
  mattering anymore" is satisfied implicitly: nothing reads it.
- **Optional future improvement** (not needed now): during December Scenario 3a (after
  next-year data lands), purge `prayer_` keys older than yesterday — would keep MMKV at
  a strict 2-3 day working set year-round.

---

## B. Notifications — 2-day window & background tasks

### 7. [CLOSED — WONTFIX by owner] 2-day rolling notification horizon is the ceiling

- **What**: `NOTIFICATION_ROLLING_DAYS = 2` (shared/constants.ts:68) → `genNextXDays(2)`
  → only [today, tomorrow] ever scheduled (stores/notifications.ts:406,527). No code
  path anywhere extends this. Notifications stop after ~2 days without an app open —
  by design (ADR-001), chosen to stay under iOS's 64-pending-notification cap.
- **Goal from owner**: go at least 1 week without opening the app and still get athans.
- **Constraint — iOS**: system silently keeps only the soonest 64 pending requests
  (UNUserNotificationCenter; verified SchedulerModule.swift uses add(request)).
  ~11 prayers+reminders/day × N days must stay « 64 on iOS → keep iOS at 2 days.
- **Constraint — Android**: ~500 alarms per app limit; 16/day × 14 days ≈ 224 → safe.
- **Decision (owner, 2026-08-29)**: platform-split REJECTED — "both platforms should
  work exactly the same, identical." Horizon stays 2 days on both platforms; the
  1-week-without-opening goal is dropped. (#16 closes with this.)

### 8. [OPEN] Background task has effectively never worked

- **Native facts** (expo-background-task 1.0.10 source, verified):
  - Android 8+: self-rescheduling OneTimeWorkRequest with `NetworkType.CONNECTED`
    constraint (BackgroundTaskScheduler.kt:93-95) — never runs offline; ALSO skipped
    whenever app is foregrounded (runTasks inForeground check).
  - Android <8: PeriodicWorkRequest WITHOUT the network constraint (inconsistency).
  - iOS: `BGProcessingTaskRequest` with `requiresNetworkConnectivity=true`,
    `requiresExternalPower=false` (BackgroundTaskScheduler.swift:106-113) — processing
    tasks are opportunistic (idle+charging, often deferred days).
- **OEM facts**: ColorOS/OxygenOS-family suppress BOOT_COMPLETED and defer WorkManager
  for non-whitelisted backgrounded apps (documented across Notifee upstream issues,
  dontkillmyapp.com/oneplus + /oppo).
- **App-side facts**: task registered ONLY on cold launch (app/index.tsx:27 →
  registerBackgroundTask arg); the foreground-return path (device/listeners.ts:26) calls
  initializeNotifications with only 2 args — no registration.
- **Owner conclusion**: foreground refresh (4h gate) is the only layer that has ever
  worked in practice.

### 9. [FIXED 1.5.3] ADR-007 documentation drift + registration gap

- ADR-007 line 61 claimed skip-based lock; `withSchedulingLock`
  (stores/notifications.ts:29-54) is a sequential queue. Background task registration
  missing from foreground-return path (see #8).
- **Fix (2026-08-29)**: ADR corrected (lock semantics + architecture-diagram label +
  Status Proposed → Accepted, revision history row added); `device/listeners.ts`
  foreground-return now passes `registerBackgroundTask` to `initializeNotifications`
  (idempotent — guarded by `isTaskRegisteredAsync`).

---

## C. Notifications — ColorOS-family timing problems (OnePlus 8T, Oppo Find X8)

### 10. [OPEN] ±60s LATE — silent inexact-alarm fallback + process freezing

- **Native code (verified, unchanged in latest)**: expo-notifications `setupAlarm`
  (ExpoSchedulingDelegate.kt:105-121, both installed 0.32.16 AND current main/57.0.11):
  `if (SDK_INT < S || canScheduleExactAlarms()) setExactAndAllowWhileIdle else setAndAllowWhileIdle`
  — SILENT fallback, no log, no error, no JS-visible state.
- **Device matrix confirms mechanism**: iPhone (UNUserNotificationCenter) = perfect;
  OnePlus 5T (Android ≤10, `SDK_INT < S` → always exact) = perfect; Galaxy = perfect;
  ONLY the two ColorOS-family Android 13+ phones (8T, Find X8) drift.
- **Already tried by owner (eliminated)**: battery optimization off, app priority,
  "Alarms & reminders" special-access toggle on/off — no luck.
- **Surviving suspects**:
  1. Runtime `canScheduleExactAlarms()` actually false despite toggle UI (ColorOS
     revoke layer / permission stripped from shipped manifest — see #13).
  2. ColorOS freezing the cached app process: alarm fires on time but broadcast
     delivery is queued until unfreeze → delayed + clumped deliveries.
- **Inexact alarm guarantees** (Android docs): never early; batched in idle/maintenance
  windows → the observed ~1-min-late signature.
- **Key evidence on library choice**: prayer app on flutter_local_notifications #2369
  reports prayers delivered EXACTLY 4 HOURS LATE even with `alarmClock` schedule mode —
  OEM delivery deferral beats even setAlarmClock in some configurations.
  DECISION: stay on expo-notifications; no library swap without new evidence.

### 11. [CLOSED — WONTFIX by owner] ±60s EARLY — device clock skew (hypothesis, testable)

- No Android alarm API can fire early (platform guarantee). Alarms are `RTC_WAKEUP` =
  device wall-clock. Offline secondary phones drift; OnePlus "Sleep Standby Optimization"
  cuts network at night (dontkillmyapp.com/oneplus) → no NTP correction → clock ahead →
  alarms fire "early" in real time.
- **Decision (owner, 2026-08-29)**: dropped — "not something we can handle" in-app.
  If it resurfaces, the informal test remains: compare phone clock vs a reference when
  a notification fires early; mitigation is keeping the phone online (NTP correction).

### 12. [OPEN] DOUBLE notifications — orphan-alarm race (missing deterministic IDs)

- **Race (code-verified)**: `scheduleNotificationForDate` does
  `await scheduleNotificationAsync()` THEN `await Database.addOneScheduledNotification...`
  (stores/notifications.ts:370-379). ColorOS kills aggressively; process death between
  the two steps leaves an orphan alarm with NO DB record. Per-prayer cancels
  (updatePrayerNotifications → clearAllScheduledNotificationForPrayer) only cancel
  DB-recorded IDs → orphan survives → next schedule adds a second alarm for the same
  prayer → both fire → true double.
- **Aggravator**: app never passes `identifier` to scheduleNotificationAsync → expo
  generates a fresh UUID every call → no native replacement semantics; dedup relies
  entirely on fragile DB bookkeeping.
- **Verified fix available in expo-notifications**: `NotificationRequestInput.identifier?`
  exists; native PendingIntent is built FROM the identifier (NotificationsService.kt:405-420)
  and store is keyed by identifier → same-ID schedule = idempotent REPLACE, cancels
  reliable even with lost DB records. Planned: `${scheduleType}_${prayerIndex}_${date}_${kind}`.
- **Ruled out**: reminder clumping (owner tested reminders on/off — no change); ghost
  re-arm of past triggers (DISPROVEN: DateTrigger.nextTriggerDate() returns null for past
  → stale entries REMOVED, never re-fired, ExpoSchedulingDelegate.kt:61-64); JS re-post
  duplicates (same tag+id replaces, ExpoPresentationDelegate.kt:108-112).

### 13. [CLOSED 1.5.3 — manifest half] Shipped Android manifest never verified (CNG + Play policy risk)

- **VERIFIED 2026-08-29 (ground truth)**: `npx expo prebuild --platform android --no-install` +
  `./gradlew assembleRelease` (19m20s, clean) → `aapt dump permissions app-release.apk` on the
  MERGED manifest. Both exact-alarm permissions survive prebuild merging:
  - `USE_EXACT_ALARM` ✓ (manifest line 25) — Play-policy review remains an owner/Play-Console
    matter (alarm-clock core-function app is defensible), not a code issue.
  - `SCHEDULE_EXACT_ALARM` ✓ (line 23) — denied-by-default on Android 13+ fresh installs;
    runtime-grant observability stays open under #14.
- Full dump (app.json-declared first): RECEIVE_BOOT_COMPLETED, POST_NOTIFICATIONS,
  USE_EXACT_ALARM, SCHEDULE_EXACT_ALARM, WAKE_LOCK, ACCESS_NOTIFICATION_POLICY; lib-injected:
  INTERNET, ACCESS_NETWORK_STATE, VIBRATE, MODIFY_AUDIO_SETTINGS, RECORD_AUDIO (expo-audio),
  FOREGROUND_SERVICE + FOREGROUND_SERVICE_MEDIA_PLAYBACK, SYSTEM_ALERT_WINDOW,
  READ/WRITE_EXTERNAL_STORAGE (maxSdk 32), C2DM RECEIVE + Finsky INSTALL_REFERRER
  (expo-updates/play-services), DYNAMIC_RECEIVER_NOT_EXPORTED (AndroidX), plus a block of
  harmless launcher-badge permissions (ShortcutBadger via notifications stack:
  Samsung/HTC/Sony/Huawei/Oppo/OPPO generic READ/WRITE_SETTINGS badge perms).
- **Ground-truth check on a phone (run once per affected phone)**:
  `adb shell dumpsys package com.mugtaba.athan | grep -i -A2 EXACT`
- If permission absent at RUNTIME (Android 13+ default-deny) → all exactness bets are off
  regardless of the manifest → #14 observability module + guided grant flow
  (ACTION_REQUEST_SCHEDULE_EXACT_ALARM).

### 14. [CLOSED — WONTFIX by owner, adb checklist instead] No exact-alarm / power-state observability

- expo-notifications exposes NO canScheduleExactAlarms API (docs verified; no open Expo
  feature request either). App cannot detect degraded mode; logs show nothing.
- Planned was a ~30-line LOCAL Expo module (repo modules/ dir, no npm dep) exposing
  `canScheduleExactAlarms()` + `isIgnoringBatteryOptimizations()`; logged every refresh;
  optional one-time settings banner.
- **Decision (owner, 2026-08-29)**: module REJECTED — it would only ever run on dev
  builds with adb available (prod silences logs), and `adb shell dumpsys` reads the same
  system state with zero code. Ground-truth checklist on each affected phone instead:
  1. `adb shell dumpsys package com.mugtaba.athan | grep -i -A2 EXACT` (runtime grant —
     answers #10 suspect 1: canScheduleExactAlarms actually false despite toggle UI)
  2. `adb shell dumpsys deviceidle whitelist | grep mugtaba` (power allowlist state)
  Fold into the same phone sitting as the F.7 / #12 / back-gesture confirms.

---

## D. Notifications — structural risks

### 15. [FIXED 1.6.0] Zero-notification window during global reschedule

- **Symptom**: `_rescheduleAllNotifications` (stores/notifications.ts) ran
  `cancelAllScheduledNotificationsAsync()` globally and wiped ALL DB records
  BEFORE scheduling new ones. Process death mid-batch (ColorOS kills
  aggressively) → app has ZERO scheduled notifications and no DB records;
  recovery only on next successful refresh trigger (launch/foreground/4h gate).
- **Fix (schedule-first-then-cancel-stale, enabled by deterministic IDs from
  #12's d20ccf5)**:
  - Global reschedule no longer bulk-cancels or bulk-wipes anything. Same-ID
    scheduling atomically replaces every notification (Android PendingIntent
    and iOS UNUserNotificationCenter both key on the identifier).
  - Per-prayer paths (at-time + reminders): read old records → clear DB
    bookkeeping only → schedule the new window → cancel only identifiers no
    longer attempted. Identical windows schedule with ZERO cancels; an
    interval change briefly holds two reminders, never zero.
  - Failed scheduling attempts record a "survived" DB record for the
    attempted identifier — whatever OS notification it already had stays
    alive and the sweep will not remove it.
  - Prayers/reminders whose preferences are Off are actively cleared during
    global reschedule (heals an interrupted settings commit — records and OS
    entries for disabled prayers can no longer linger and keep firing).
  - Post-reschedule sweep (`_sweepStaleScheduledNotifications`): compares
    OS pending identifiers vs DB records (the intended set) and cancels
    anything extra — turned-off prayers, superseded intervals, pre-#12 UUID
    orphans, strays from an upgrade's record wipe (OS notifications survive
    app updates; the sweep heals the desync on first reschedule).
    Warn on anything swept; info verification log of dbRecords/osPending/
    staleCancelled counts. Sweep failure surfaces (rejects) — callers log.
- **Tests**: 28 new across shared/__tests__/notifications.test.ts (pure
  one-directional diff), stores/__tests__/database.test.ts (schedule-level
  reminder reader), stores/__tests__/notifications.test.ts (frozen-clock
  suite with an in-memory OS model: no-bulk-cancel pins for all three entry
  points, zero-cancel identical window, stale-after-schedule ordering,
  failed-attempt survival for notifications and reminders, interval change
  ordering, sweep healing incl. upgrade scenario + verification logging +
  failure propagation, single-prayer toggle paths, extras path, Off-healing).
  `yarn validate`: 26 suites / 767 green.
- **Result**: the OS never holds fewer notifications than before at any
  instant during a reschedule; process death mid-batch leaves previously
  scheduled notifications firing and the next refresh heals bookkeeping.

### 16. [CLOSED with #7] iOS 64-pending hard cap constrains any horizon increase

- Any iOS horizon increase silently loses farthest notifications (system keeps soonest
  64). Must stay 2 days on iOS (see #7). Trivially handled by platform-split constant —
  now moot: owner rejected the platform split; horizon stays 2 days on both platforms.

---

## E. Decisions & pending diagnostics (context for future sessions)

- **1.5.3 sync fix deployment state (verified 2026-08-18)**: remote uat = 68443fe,
  remote main = 438f8e5 (PR #164, rebase-merged — repo allows rebase merges only).
  Local main may show stale tracking labels; remote state is authoritative.
- **NO library swap** (owner decision, evidence-backed): notify-kit/Notifee offer
  setAlarmClock + BOOT_COUNT recovery, but OEM delivery deferral can beat even
  alarmClock (4h-late prayer report, flutter_local_notifications #2369); migration cost
  unjustified without first exhausting in-place fixes.
- **Partial-year API publication**: ruled out by owner — will never happen. Validation
  non-emptiness check is sufficient; no min-count validation needed.
- **Phase 0 diagnostics pending (owner's phones)**:
  1. `adb shell dumpsys package com.mugtaba.athan | grep -i -A2 EXACT` on 8T + Find X8
  2. Clock-skew test next time a notification fires early
  3. System-wide Battery → Deep optimization / Adaptive Battery / Sleep Standby
     Optimization off on 8T (these are DIFFERENT toggles from per-app battery
     optimization already tried)
- **Phase 1 implementation order** (all in-repo, no new deps): deterministic IDs →
  platform-split horizon (14d Android / 2d iOS) → local diagnostics module + allowlist
  flow → post-refresh verification logging → close #8/#9 doc rot in ADR update.

---

## F. SDK 57 migration findings (2026-08-28 session)

### 1. [FIXED] Render crash when selecting a prayer during a schedule refresh

- **Symptom**: On the SDK 57 dev build, tapping a prayer row at the exact moment a
  prayer transition fired (05:02–05:04, Duha) crashed the overlay with
  `Cannot read property 'isPassed' of undefined` at `usePrayer.ts:56`
  (`const { isPassed, isNext } = prayer`). Full-screen Render Error, dismissed fine.
- **Root cause**: `hooks/usePrayer.ts` filtered the sequence to `displayDate` and
  indexed it unguarded. When the background sequence refresh ("filtered passed
  prayers") lands between selection and render, `todayPrayers[index]` is `undefined`
  for the previously-selected index. Pre-existing race — identical unguarded code ran
  on SDK 54; the crash had simply never been hit. RN 0.86 / React 19.2 render timing
  made the window easier to hit in practice.
- **Fix**: `if (!isReady || !prayer)` — extends the hook's existing loading-state
  placeholder contract to out-of-range indices. No behavior change on any happy path;
  converts the crash into the already-defined placeholder render.
- **Residual**: SDK 54 exposure of the same race is unknown (never reproduced there);
  the guard is correct under both.

### 2. [REVERTED] @expo/ui community bottom sheets → back to @gorhom/bottom-sheet 5.2.14

- **Outcome**: the @expo/ui sheets migration (d5ec3a5) was tried and reverted by
  owner decision after four escalating attempts. Final state:
  `@gorhom/bottom-sheet@5.2.14` restored verbatim from 500087b (`Sheet.tsx`,
  `Shared.tsx`, sheets barrel re-exports, `stores/ui.ts` modal atoms back to
  `BottomSheetModal` refs, `SheetControls` type removed, `_layout.tsx`
  `BottomSheetModalProvider` re-wrapped). `@expo/ui` later removed ENTIRELY
  (2026-08-29): the home pager reverted to react-native-pager-view@8.0.2 after the
  native pager's shifted child coordinate space broke overlay positioning (F.9) —
  nothing in the app references @expo/ui anymore.
- **Why the native drop-in failed (d5ec3a5)**: on iOS 26, fractional-height sheets
  render as floating cards with side margins; the backdrop dim is system-controlled
  (too weak); the drag indicator is glued to the top edge and unstyleable;
  backdrop-tap behavior differs. Owner rejected the look.
- **Why custom replacements failed**: inline Reanimated sheet (e989435) fixed the
  visuals but drag-to-dismiss only worked on the header (the Alert sheet's header
  zone was dead to drags). A gorhom-style coordination rewrite (RNGH ScrollView +
  `simultaneousWithExternalGesture`) crashed with a fatal JS exception (SIGABRT via
  RCTExceptionsManager) when dragging the scrollable sheets —
  `~/Library/Logs/DiagnosticReports/Athan-2026-08-28-22*.ips`. A manual-activation
  pan + plain RN ScrollView was stable but drags starting on content never handed
  off to the sheet, and scrollable sheets showed parallax (content separating from
  the panel). The coordination layer proved too complex.
- **One addition on top of the revert**: Android hardware back now dismisses any
  open sheet instead of exiting the app — `BackHandler` in `Sheet.tsx`, gated on
  presented state (`onChange` index !== −1), so LIFO registration order dismisses
  the top sheet when Sound stacks over Settings. The pre-revert app did not have
  this; Android emulator/device verification pending.
- **Verification**: `yarn validate` green (26 suites / 710 tests); Release sim pass —
  all three sheets flush to the bottom + full width, drag-anywhere dismisses as one
  piece (no parallax), native scroll with header scroll-away + elastic top bounce,
  Sound opens at 80% with default scroll indicator, Alert compact + commits changes,
  dark 0.9 backdrop that does NOT close on tap (drag-only dismissal, by design),
  home pager intact.

### 3. [ACCEPTED] Per-prayer alert config is index-keyed, not name-keyed

- **Context**: Alert-menu state and scheduled-notification keys use the row index
  (`scheduled_reminders_standard_4`, `alert_standard_<index>`) rather than prayer name + date.
- **Exposure**: With chronologically sane data, index↔name always align with
  `PRAYERS_ENGLISH`, so this is safe in production. It only misbinds with synthetic
  mock data whose times invert the canonical order (e.g. mock day1 has
  isha 13:59 < maghrib 16:14, so post-rollover index 4 = Isha).
- **Decision**: no change now (zero-loss mandate; production parity). Future
  hardening candidate: key alert config by prayer name + date.

### 4. [FIXED 1.5.3] Friday Extra-page display order differs from the canonical array

- **Invariant (owner, 2026-08-29 — never re-litigate)**: Extras page order is fixed by
  the data model and can never change: **Midnight 1st, Last Third 2nd, Suhoor 3rd,
  Duha 4th, Istijaba 5th (Friday-only, always last)**.
- **Origin (corrected 2026-08-29)**: the pre-refactor app (production through May 2025,
  `f3d7ce0`) rendered extras POSITIONALLY from the fixed array — Istijaba last by
  construction, no ordering logic to get wrong. The Jan-2026 ADR-005 timing refactor
  replaced that with the chronological sequence render (`todayPrayers.map`), which on
  Fridays pushed Istijaba mid-list. It was logged as an SDK-57 "migration finding"
  only because migration-era builds were the first the owner saw — NOT a migration
  regression.
- **Fix (500087b, owner decision)**: Extras display follows the canonical array via
  `canonicalDisplayOrder(prayers, type)` (`shared/prayer.ts`); `List.tsx` renders in
  canonical order while rows keep their sequence indices, so selection/countdown/
  notification semantics are unchanged. Verified on sim (Friday 2026-08-28) + 4 unit
  tests; owner-confirmed matching long-observed behavior. **Closed — no further
  verification needed** (the order is an invariant, unit-pinned).

### 5. [FIXED] Global font-scaling guard was dead code on SDK 57 (React 19 defaultProps removal)

- **Finding**: the app-wide `Text.defaultProps = { allowFontScaling: false, ... }`
  mutation in `app/_layout.tsx` stopped applying after the SDK 57 migration. RN 0.86
  turned `Text` into a function component (`Libraries/Text/Text.js` exports a bare
  `TextImpl` function), and React 19 removed defaultProps support for function
  components. The handoff watch-item ("verify font-scaling on device") was confirmed:
  at OS accessibility text size `accessibility-XXXL` the app scaled every label
  ~3x and the layout broke (overlapping header text, wrapped row names).
- **Why not render-patching / createElement patching**: React calls function
  components directly (`Text.render` is never invoked), and React 19's `createElement`
  export is getter-frozen (mutation throws `Invariant`).
- **Fix**: `jsx-runtime-shim.ts` + a Metro `resolveRequest` hook
  (`metro.config.js`) that redirects `react/jsx-runtime` / `react/jsx-dev-runtime`
  imports through the shim, which injects `allowFontScaling: false` +
  `maxFontSizeMultiplier: 1` into every Text element created via the automatic JSX
  runtime — same coverage as the old defaultProps for all app code and for
  precompiled libs that render text via the JSX runtime (reanimated's
  `Animated.Text` verified to import `react/jsx-runtime`). Boundary: elements created
  via classic `React.createElement` inside npm libs are NOT intercepted (frozen
  exports) — no lib-rendered Text exists in the app today.
- **Verification**: sim at `accessibility-XXXL` — pre-fix screenshot showed scaled,
  overlapping text; post-fix screenshot identical to normal-size rendering with the
  countdown ticking normally. Content size restored to default afterwards.

### 6. [FIXED 1.5.3] Countdown final-seconds intermittent stretch

- **Symptom**: the countdown's last ~2s occasionally stretch on screen; sometimes the
  final digit froze at "2s" and jumped straight to the next prayer.
- **Root cause (proven by TICK instrumentation, 2026-08-29 sim baseline)**:
  1. Every ticker was a plain `setInterval(fn, 1000)`, which re-arms from ACTUAL
     delivery time — JS-thread latency compounds. Measured on a clean run: median
     inter-tick gap 1016ms, phase marching +17ms/s (516ms→717ms in one minute).
     At transitions the cascade (refreshSequence + atom churn + re-render) spiked
     delivery to 1500-3000ms gaps right at `computed <= 1` — the visible stretch.
  2. `floor` rounding produced computed=0 during the entire final second; the
     hold-latch masked it as "1s" but any transition slowness stretched that digit.
  3. Sync re-entrancy (loadable double-eval + AppState foreground storms) could
     leave MULTIPLE store intervals alive per key (6 concurrent std tickers
     observed for 15 min) — each doing `createLondonDate()` (full tz format+parse)
     per tick: self-inflicted ~12-18 tz round-trips/sec.
- **Fix** (`fix/f6-f7-countdown-tick-integrity`):
  - Wall-second self-correcting chain: each tick scheduled as
    `setTimeout(tick, 1000 - (Date.now() % 1000))` — digits flip just after :000
    like the status bar, and any late delivery is absorbed by the next shorter
    delay (drift cannot accumulate).
  - Per-tick diffs computed as `target.getTime() - Date.now()` against the stored
    UTC-instant targets (offset cancels; no tz work per tick; full ms precision).
  - Ceil display contract: last visible digit is 1s, 0s never displays, the swap
    to the next prayer happens at the boundary instant (hold at 1 across the
    refresh gap). Owner-specified rule, pinned by unit tests.
  - Single-ticker-by-construction: every start clears + replaces under an
    ownership guard, so re-entrant `startCountdowns()` can never stack intervals.
- **Verified**: transitions fire 5ms/4ms after the minute boundary (were 400-900ms);
  tick phase locked at 9-16ms across entire runs and across process restarts;
  no computed value < 1 anywhere; 739 tests green incl. ticker-integrity suite
  (re-entrancy immunity, alignment, self-correction, full-sweep never-0s,
  transition no-leak, overlay hold-at-1s) and pinned DST-crossing windows.

### 7. [FIXED 1.5.3 in code — on-device confirm pending] Android minute-boundary skew (status bar vs countdown)

- **Symptom**: on some Android phones (OnePlus 8T, Oppo Find X8) the status bar
  flips to the prayer minute while the app still shows ~2-10s remaining.
- **Owner's decisive logic (2026-08-29)**: status bar and `Date.now()` read the
  SAME system clock — device-clock skew cannot produce an intra-device
  disagreement. The app can only lag its own device via (a) stale displayed
  values (tick delivery latency) or (b) deterministic phase misalignment.
- **Root cause (mechanism (a), proven on sim)**: the old `setInterval` tickers
  drifted +17ms/s under load (weaker Android hardware drifts faster — 2-10s of
  accumulated skew matches minutes-to-hours of app-open time) plus arbitrary
  start phase (up to ~1s structural offset). Both eliminated by the F.6 fix:
  wall-second alignment (digits flip at :000 with the status bar) and
  self-correcting scheduling (no accumulation).
- **On-device confirm protocol (OnePlus 8T, dev build)**: at a prayer minute,
  watch the status bar flip vs the app's 1s→swap. Expect the swap within ~100ms
  of the flip. Optionally capture `adb logcat` TICK debug lines: every `computed`
  write should carry `phase < 100` and the swap at `transitionMs` small.
- The countdown path remains platform-agnostic — no Platform checks exist there.

### 8. [FIXED 1.5.3] Biome useExhaustiveDependencies backlog

- 72 warn-level hits + 5 noArrayIndexKey (77 warnings total), pre-existing from
  the Biome migration (9a116f6). **Cleared 2026-08-29** (merged e2d679e): stable
  deps (Reanimated shared values, useCallback-stable animate fns) added to
  arrays where provably identity-stable; deliberate omissions/extra-deps
  suppressed with per-line justifications (re-fire signals, per-render closures,
  static list keys). `biome check .` reports zero warnings; rule never disabled.

### 9. [FIXED 1.5.3] Overlay renders ~70px above the tapped prayer row (was pixel-perfect pre-migration)

- **Symptom (owner, 2026-08-29, iOS)**: tapping a prayer row (e.g. Asr) opens the
  large-text overlay, but the overlay's copy of the row sits ~70px HIGHER than the
  actual row it should cover pixel-perfectly. Survived cache clears + full reinstalls
  (`yarn reset` ×2) — real regression, not stale data.
- **Root cause**: the `@expo/ui/community/pager-view` native pager (d5ec3a5) hosts
  pages in a native container whose coordinate space is offset from the JS view
  hierarchy by roughly the status-bar inset. The overlay's one-shot
  `measureInWindow` (components/prayer/List.tsx, Day.tsx) returned coordinates in
  that shifted space, while the overlay itself is absolutely positioned from the
  window origin (components/overlay/Overlay.tsx container) — every overlay copy
  landed ~62pt (~70px) high. The measurement architecture itself was innocent.
- **Fix (owner decision: revert the pager, keep the original architecture)**:
  react-native-pager-view@8.0.2 restored (import + `overdrag` prop, app/Navigation.tsx);
  @expo/ui removed entirely (Navigation.tsx was its last consumer — with the sheets
  already back on @gorhom, nothing references it). The load-time one-shot
  measurement design (measure once via onLayout, position from cached page
  coordinates) is deliberately KEPT as-is — it was correct pre-migration and the
  press-time re-measure alternative was considered and rejected by the owner
  (unnecessary inefficiency).
- **Verification**: owner-confirmed 2026-08-29 on a clean debug build (fresh prebuild,
  fresh install, MMKV wiped) — overlay pixel-perfect on tapped rows on both pages,
  pager swipe + overdrag intact.
