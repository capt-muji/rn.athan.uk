# Issue Ledger — rn.athan.uk

Last updated: 2026-08-28 (sessions: December sync loop fix + notification reliability research + SDK 54→57 migration)

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

### 7. [OPEN] 2-day rolling notification horizon is the ceiling

- **What**: `NOTIFICATION_ROLLING_DAYS = 2` (shared/constants.ts:68) → `genNextXDays(2)`
  → only [today, tomorrow] ever scheduled (stores/notifications.ts:406,527). No code
  path anywhere extends this. Notifications stop after ~2 days without an app open —
  by design (ADR-001), chosen to stay under iOS's 64-pending-notification cap.
- **Goal from owner**: go at least 1 week without opening the app and still get athans.
- **Constraint — iOS**: system silently keeps only the soonest 64 pending requests
  (UNUserNotificationCenter; verified SchedulerModule.swift uses add(request)).
  ~11 prayers+reminders/day × N days must stay « 64 on iOS → keep iOS at 2 days.
- **Constraint — Android**: ~500 alarms per app limit; 16/day × 14 days ≈ 224 → safe.
- **Planned fix**: platform-split constant: Android 14 days, iOS 2 days.
  Background task then becomes optional repair, not a load-bearing component.

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

### 9. [OPEN] ADR-007 documentation drift + registration gap

- ADR-007 line 61 claims skip-based lock; `withSchedulingLock`
  (stores/notifications.ts:29-54) is a sequential queue. Background task registration
  missing from foreground-return path (see #8). Minor, fold into next notification
  ADR/update.

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

### 11. [OPEN] ±60s EARLY — device clock skew (hypothesis, testable)

- No Android alarm API can fire early (platform guarantee). Alarms are `RTC_WAKEUP` =
  device wall-clock. Offline secondary phones drift; OnePlus "Sleep Standby Optimization"
  cuts network at night (dontkillmyapp.com/oneplus) → no NTP correction → clock ahead →
  alarms fire "early" in real time.
- **Test procedure**: when a notification fires early on 8T/Find X8, immediately compare
  phone clock vs a reference (iPhone). Also check Settings date/time auto-sync state.
- **If confirmed**: unfixable in-app (RTC is the only correct primitive for wall-clock
  times); mitigate via owner keeping phone online or accepting skew on secondary device.

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

### 13. [OPEN] Shipped Android manifest never verified (CNG + Play policy risk)

- Repo is CNG (no android/ dir). app.json declares USE_EXACT_ALARM + SCHEDULE_EXACT_ALARM
  (correct structure for prebuild merge). BUT `USE_EXACT_ALARM` is Play-policy-restricted
  to alarm-clock/calendar core-function apps — Review may strip it from shipped builds.
  `SCHEDULE_EXACT_ALARM` is denied-by-default on Android 13+ fresh installs
  (developer.android.com schedule-exact-alarms page) and also denied after
  backup-restore to Android 14+.
- **Ground-truth check (run once per affected phone)**:
  `adb shell dumpsys package com.mugtaba.athan | grep -i -A2 EXACT`
- If permission absent → all exactness bets are off regardless of toggles → add
  runtime check + guided grant flow (ACTION_REQUEST_SCHEDULE_EXACT_ALARM).

### 14. [OPEN] No exact-alarm / power-state observability

- expo-notifications exposes NO canScheduleExactAlarms API (docs verified; no open Expo
  feature request either). App cannot detect degraded mode; logs show nothing.
- Planned: ~30-line LOCAL Expo module (repo modules/ dir, no npm dep) exposing
  `canScheduleExactAlarms()` + `isIgnoringBatteryOptimizations()`; logged every refresh;
  optional one-time settings banner. Power allowlist also grants exact-alarm exemption
  (Android docs: allowlisted apps always permitted setExact) — one flow fixes both.

---

## D. Notifications — structural risks

### 15. [OPEN] Zero-notification window during global reschedule

- `_rescheduleAllNotifications` (stores/notifications.ts:695-724): global
  cancelAllScheduledNotificationsAsync + wipe DB records BEFORE scheduling new ones.
  Process death mid-batch → app has ZERO scheduled notifications and no DB records;
  recovery only on next successful refresh trigger (launch/foreground/4h gate).
  Per-date failures are swallowed (.catch(logger.error)) — partial batches don't abort.
- **Planned**: schedule-first-then-cancel-stale strategy (enabled cleanly by
  deterministic IDs from #12), plus post-refresh verification: compare
  getAllScheduledNotificationsAsync() count vs expected; log mismatch.

### 16. [OPEN] iOS 64-pending hard cap constrains any horizon increase

- Any iOS horizon increase silently loses farthest notifications (system keeps soonest
  64). Must stay 2 days on iOS (see #7). Trivially handled by platform-split constant.

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

### 2. [DEFERRED] @gorhom/bottom-sheet → @expo/ui/community/bottom-sheet

- **Context**: SDK 56+ ships `@expo/ui` drop-in replacements for `@gorhom/bottom-sheet`
  and `react-native-pager-view`, backed by native SwiftUI sheet / Compose
  ModalBottomSheet instead of Reanimated + GestureHandler.
- **Why deferred (owner decision)**: the drop-in intentionally changes the presentation
  and animation layer (native modal presentation vs Reanimated-driven inline modals,
  different backdrop handling, no persistent inline peek). Zero-visual-drift mandate
  makes the swap a deliberate future session with side-by-side visual review and real
  Android device testing — not part of a version bump.
- **Status**: staying on `@gorhom/bottom-sheet@5.2.14` (bug-fix-only 5.2.8→5.2.14,
  peers verified). Revisit as a standalone UI-refresh initiative.

### 3. [ACCEPTED] Per-prayer alert config is index-keyed, not name-keyed

- **Context**: Alert-menu state and scheduled-notification keys use the row index
  (`scheduled_reminders_standard_4`, `alert_standard_<index>`) rather than prayer name + date.
- **Exposure**: With chronologically sane data, index↔name always align with
  `PRAYERS_ENGLISH`, so this is safe in production. It only misbinds with synthetic
  mock data whose times invert the canonical order (e.g. mock day1 has
  isha 13:59 < maghrib 16:14, so post-rollover index 4 = Isha).
- **Decision**: no change now (zero-loss mandate; production parity). Future
  hardening candidate: key alert config by prayer name + date.

### 4. [OPEN] Friday Extra-page display order differs from the canonical array

- **Expected (owner)**: Midnight, Last Third, Suhoor, Duha, and — Fridays only —
  Istijaba last.
- **Actual**: `createPrayerSequence` sorts chronologically
  (`shared/prayer.ts:323`), so on a real Friday Istijaba (magrib − 60 min) appears
  between Midnight and Last Third. On non-Fridays chronological order equals the
  canonical array, which is why this is invisible most of the week.
- **Status**: pre-existing in production (SDK 54 identical) — NOT a migration
  regression; kept as-is for zero-loss parity. Owner to decide: keep chronological
  (document) or switch Extra display to canonical-with-Istijaba-last.
