# Issue Ledger — rn.athan.uk

Last updated: 2026-09-02 (TestFlight device-test session: section G added — six open issues from iPhone XS / iOS 18.7.7 / 1.17.4 release testing, ALL G.1–G.5 marked release blockers by owner. Earlier: #12 closed as FIXED 1.6.0 — on-device double-notification confirm still pending; #4/#5 stay DEFERRED, #8/#10 stay OPEN — untouched by owner decision.)

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

### 12. [FIXED 1.6.0 — on-device confirm pending] DOUBLE notifications — orphan-alarm race (missing deterministic IDs)

- **Status (2026-08-30)**: closed in code. The deterministic identifiers
  (`${scheduleType}_${prayerIndex}_${date}_${kind}`, d20ccf5) shipped with the
  #15 reschedule rework — same-ID scheduling replaces idempotently on both
  platforms, and the post-reschedule sweep cancels anything the DB doesn't
  know about (healing pre-fix UUID orphans on first reschedule). Owner
  on-device confirmation that doubles are gone is still outstanding; reopen
  if a double is ever observed again.

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
- **Fixed at source 1.12.3**: RECORD_AUDIO (expo-audio) removed — app.json plugin now sets
  `microphonePermission: false` + `recordAudioAndroid: false` (playback-only app; privacy.html
  claims no microphone). Re-run the merged-manifest dump on the next release APK to confirm.
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
- **Phase 1 implementation order**: resolved/outdated as of 2026-08-30 — deterministic IDs shipped (d20ccf5); the platform-split horizon (#7/#16) and the diagnostics module (#14) were rejected/wontfixed by the owner, so the remaining ordering is moot.

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
- **Android verified 2026-08-29** (emulator, Pixel 10 / API 35 / edge-to-edge,
  fresh 1.6.0 Release build): hardware-back dismissed the Settings sheet and
  left the app alive — BackHandler confirmed on a real Android runtime.
  On-device (ColorOS gesture nav) confirm still open.
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
  isha 13:59 < magrib 16:14, so post-rollover index 4 = Isha).
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

### 10. [FIXED 1.6.0 — pending review] Android overlay renders one status-bar too LOW (edge-to-edge coordinate realignment)

- **Symptom (owner, 2026-08-29, Android emulator Pixel 10 / API 35)**: tapping a
  prayer row opens the overlay shifted DOWN by exactly the status-bar height
  (measured 63px at 420dpi); header/countdown fine; iOS unaffected. uiautomator
  evidence: real Fajr row [32,600][1049,749] vs overlay copy [32,663] — delta 63px.
- **Root cause (git + RN source verified, not assumed)**:
  - The Jan-2025 correction `+ (Platform.OS === 'android' ? insets.top : 0)` in
    Overlay.tsx (commit d747bc3, Expo 51 / RN 0.74.5 old-arch /
    react-native-edge-to-edge@1.4.0) was CORRECT then: RN 0.74.5's old-arch
    measureInWindow returned screen-absolute coords ("including things like the
    status bar", UIImplementation.java:534) while the root view sat BELOW the
    status bar — the overlay's absolute origin was insets.top down-screen, so
    the manual +insets.top closed the gap.
  - On SDK 57 (RN 0.86.3 new arch + react-native-edge-to-edge@1.8.1 +
    targetSdk 35) both halves changed: measureInWindow is window-absolute
    (ReactCommon DOM.cpp: measureInWindow → getLayoutMetricsFromRoot with
    includeViewportOffset=true) AND the root spans the full window
    (EdgeToEdgeModuleImpl.kt:72 WindowCompat.setDecorFitsSystemWindows(false)).
    Raw pageY is now the exact on-screen position; the old correction
    double-counted the status bar.
- **Fix**: removed the Android `+ insets.top` term at all four sites in
  Overlay.tsx (date, prayer row, info box below/above). No constants, no
  per-device math — the inset is embodied exactly once inside the measurement,
  so software/hardware status bars, notches, and any density resolve
  identically. Countdown header keeps its intentional insets.top (it WANTS to
  sit below the bar). iOS path byte-identical (the removed term added 0 there).
- **Verification (fresh pm-cleared 1.6.0 Release install on emulator)**:
  overlay Fajr [32,600] == real [32,600] exact; deep row Isha (index 5)
  [32,1348][1049,1498] identical; date element identical. One ±1px bottom-edge
  rounding on the top row only = DIP→px rounding, not misalignment.

---

## G. TestFlight device test — release blockers (iPhone XS, iOS 18.7.7, 2026-09-02)

Context: first release+real-device widget/audio validation (all prior widget work
was verified debug/release on iOS 26 simulator). Device: iPhone XS (A12, 4GB RAM,
iOS 18.7.7 — XS cannot go past iOS 18), factory reset, only this app installed,
build 1.17.4 TestFlight. Owner ruling: every G.1–G.5 must be fixed before
production release; G.6 noted but deferred by owner.

### G.1 [OPEN — RELEASE BLOCKER] Five home screen widgets permanently blank

- **STATUS (end of session 2026-09-02)**: failure chain PROVEN on device and
  REPRODUCED on an iOS 18.5 simulator as sustained ~100% CPU render loop.
  Construct-level bisection STARTED (two data points in, see Bisect Log) —
  this is the exact resume point for the next session.
- **STATUS (end of session 2026-09-02, ROUND 2 — ROOT CAUSE FOUND AND
  SOURCE-PROVEN; construct bisection CLOSED)**: the "render loop" is NOT a
  livelock and NOT construct-specific. It is expo-widgets' own view-identity
  architecture making every SwiftUI body re-evaluation a full-tree teardown:
  bursts of 100% CPU per reload that scale with widget count/tree mass
  (~5–13 CPU-seconds per kind-placement), which converge (decay) only when
  WidgetKit's post-reload update sequence stops. Per-minute pushes × 10 kinds
  overlap the bursts → permanent saturation on-device. Full mechanism and fix
  options below ("ROOT CAUSE — SOURCE-PROVEN" + "FIX DESIGN — decision
  needed").
- **THE FAILURE CHAIN (all steps evidenced from the XS via USB syslog +
  crash reports)**: the widget extension gets CPU-saturated by an in-widget
  SwiftUI render oscillation → it misses WidgetKit's ~30s watchdog for
  `getTimelines` → syslog signature: `CHSErrorDomain Code=1050
  "timelineReloadFailed"` wrapping `Code=1001 "Watchdog provision violated
  for getTimelines(1)"` → chronod schedules the next retry **+1 HOUR out**
  → the app's every-minute pushes keep spawning replacement attempts that
  merge into the same doomed task → kinds that lose the render race stay
  blank "permanently" (recovery is perpetually an hour away), and kinds
  whose retry budget exhausts stop being served at all. The rendered output
  of a kind that DID succeed once stays visible as a stale good snapshot
  even while its reloads fail (observed: `PrayerWidget` visually working
  while its own reloads timed out).
- **Device evidence, enumerated**:
  1. Four `ExpoWidgetsTarget.cpu_resource-*.ips` on 2026-09-02 alone
     (01:54, 02:59, 04:29, 04:53 — spanning TestFlight, baseline dev build
     and fix dev build): "90 seconds cpu time over 136 seconds (66% cpu
     average), exceeding limit of 50% cpu over 180 seconds". Heaviest stack
     = DEEP RECURSIVE SwiftUICore/AttributeGraph traversal (render churn,
     not JSON/parse work).
  2. Every `reload:` begin → 30 s → `Reload failed` (watchdog) in the
     syslog window; the cycle repeats every ~30 s for as long as watched.
  3. Render-side read storm (NOT request-side): layout-key lookups in the
     app-group prefs at `PrayerWidget` 1,519 / 2 min (~12/sec),
     `PrayerWidgetMedium` 848, `ExtrasWidget` 548, `PrayerWidgetDark` 333,
     `PrayerLockWidget` 4,212 (~35/sec while the lock screen was visible),
     while `ExtrasWidgetMedium` + `ExtrasWidgetDarkMedium` got only **2**
     (retry budgets exhausted — the permanently-blank set) and actual
     chronod→extension `Request began` events were only **22** in the same
     window.
  4. One-by-one re-add experiment on device (owner narrated): FIRST kind
     added (`PrayerWidget` light small) renders; every subsequent kind red —
     first-come-first-served CPU starvation, NOT a per-kind defect. Gallery
     previews flipped from red to rendering as load eased mid-experiment.
  5. Only JetsamEvent on device is 2026-03-24 (predates all testing) —
     **memory-kill theory is DEAD**.
  6. Lock Screen widgets unaffected throughout (tiny trees, same process,
     same storage).
- **Ruled out (with evidence)**:
  - Storage/entitlements: dissected the EAS dev IPA (`/tmp/fixipa`) — both
    binaries carry `ExpoWidgetsAppGroupIdentifier=group.com.mugtaba.athan`
    in Info.plist AND in code-signature entitlements; both ad-hoc profiles
    (`*[expo] com.mugtaba.athan [ExpoWidgetsTarget] AdHoc …`) allow the
    group; XS UDID provisioned. The app-side pushes pass expo-widgets'
    updateTimeline no-layout guard (it throws if the layout key is
    missing), proving layouts+timelines are written and readable. Lock
    widgets read the same suite fine.
  - Dev-vs-release extension runtime: `ExpoWidgets.bundle` inside the dev
    build's extension is a PRODUCTION Metro bundle (`__DEV__=false`) —
    identical in dev and release builds.
  - Request storm as the primary driver: only 22 timeline requests in the
    device window (see #3) — the storm is the render side.
  - Data volume, mute switch, build config: ruled out earlier (see below).
- **Simulator experiments (iOS 18.5 runtime 22F77 on sim `iPhone-185`,
  created this session — Xcode 26 refuses to download 18.7; 18.5 runs under
  Rosetta x86_64 which is FINE, the slower host even helps)**:
  - All 8 kinds RENDER correctly and within seconds on the sim (owner
    eyewitnessed placements + previews). The sim never blanks — the host is
    too fast for the watchdog to trip. The loop shows up ONLY as CPU.
  - **THE REPRO**: home screen visible with widget placements → extension
    ramps 0 → 90 → ~100% CPU sustained. App foregrounded (screen showing
    the app): extension IDLES at 0% between the ~2-per-30s push requests.
    Measurement: `EXT_PID=$(pgrep -x ExpoWidgetsTarget | head -1); top
    -pid $EXT_PID -l 8 -s 3`.
  - iOS 26.5 control (iPhone 16 sim): 4 requests/30s, renders fine — but
    NOTE: only request-rate was sampled there; CPU was never sampled with
    the home screen visible. Do not cite 26.5 as "calm" until re-measured
    the same way.
  - **BISECT LOG (removal-based, screen visible, no code changes needed —
    remove widgets via jiggle mode, sample CPU after each)**:
    1. Light page visible: 2 light smalls + 2 light mediums → **~100%**.
    2. Removed BOTH light mediums (2 light smalls remain visible) → **0%**.
       ⇒ LIGHT SMALLS ARE CALM; the light MEDIUM composition loops.
    3. Dark page visible: dark extras medium + 2 dark smalls → **~100%**.
    4. Removed the dark medium (2 dark SMALLS remain visible) → **~100%**.
       ⇒ DARK SMALLS LOOP — orbs implicated independent of the medium tree.
    5. NOT YET RUN: light mediums re-added alone (re-confirm #2 was not a
       fluke of page/position); the code-level construct bisect (orbs-off
       variant — an early `return null;` was inserted in `Blobs` at session
       end and REVERTED before handoff; redo it as step one).
    - **ROUND 2 CORRECTIONS (2026-09-02 session 2, all re-measured with an
      explicit ignition protocol)**: the previous session's page model was
      partly an illusion — the oscillating extension serves TORN frames, so
      element-tree snapshots mid-churn showed arbitrary subsets of ONE widget
      page as if they were separate pages. Points 2 and 4's attributions do
      not survive ignition control:
      - "Calm" readings taken WITHOUT fresh reload requests are meaningless:
        after sim boot (or any quiet period) the extension sits at 0.0% no
        matter what is placed; the loop only ignites when fresh
        `reloadTimelines` requests arrive (app foreground push → HOME).
        Point 2 and the 06:15 idle reading were both un-ignited states.
      - Orb removal (Blobs early `return null`, cold-evaluated via pkill +
        relaunch): dark set STILL ignites 91→100%. ⇒ **orbs EXONERATED**
        (point 4's "orbs implicated" is dead).
      - 2 light smalls alone, ignited: 0→86→100→99.7→88→0 — a ~10–12 s
        BURST that DECAYS. Repeatable. ⇒ point 2's "light smalls calm" was
        an un-ignited misread; even the tiniest trees burst.
      - 4 smalls (light pair + dark pair, orbless), ignited: ~52 s at ~100%,
        then decay to 0. Burst length scales with widget count/tree mass.
      - 1 light medium + 3 smalls, ignited: burst ≥ measured window; mediums
        behave as mass-scaling, not as a distinct livelock (mechanism below
        makes construct-bisection moot).
      - Loop persists with NO Athan widget on-screen (App Library visible,
        adjacent-page render trees stay live in SpringBoard) and across
        extension respawns (poisoned reload queue re-ignites each new
        process) — "sustained 100%" readings were overlapping bursts from
        still-firing per-minute pushes.
  - **ROOT CAUSE — SOURCE-PROVEN (2026-09-02 session 2; read from the pinned
    node_modules sources, `sample` stack, and measurements)**:
    1. `expo-modules-core` `SwiftUIViewDefinition.swift:22` — `Children()` =
       `ForEach(props.children ?? [], id: \.id)`, keyed on `ObjectIdentifier`.
    2. `expo-widgets` `Widgets/DynamicView.swift:26` — every `WidgetsDynamicView`
       struct init generates a FRESH RANDOM UUID (`NodeIdentityWrapper(id:
       UUID())`; upstream TODO literally calls it a "Hack"). `updateChildren`
       (line 155) rebuilds the whole child array on EVERY parent body eval.
       ⇒ every body evaluation produces an all-new identity set → ForEach
       removes+reinserts the ENTIRE subtree → recursive
       `DynamicViewList.applyNodes` / `SubgraphElements.makeElements` /
       AttributeGraph update storm (exact `sample` stack: 1263/1263 main
       thread samples in `AG::Graph::update_attribute` + friends).
    3. `expo-widgets` `Widgets/EntryView.swift:27-31` — the ROOT body reads
       the app-group UserDefaults layout key AND `@Environment(\.self)` (the
       whole environment as a dependency) and re-runs the JS layout eval +
       environment JSON serialization per evaluation. This is the device's
       12/sec per-kind layout-read storm.
    4. `expo-widgets` `ios/WidgetObject.swift:21` — every JS
       `updateTimeline()` call ends in its own
       `WidgetCenter.shared.reloadTimelines(ofKind:)`. Our
       `refreshPrayerWidgets()` calls it 10× (8 home kinds + 2 lock kinds)
       per minute-flip → 10 reload tasks/minute, each triggering the burst
       above for that kind's visible placements.
    5. Net effect: each kind-placement costs ~5–13 CPU-seconds of render
       churn per reload pass. On A12: bursts overlap the per-minute cadence →
       `getTimelines` misses the ~30 s watchdog → chronod +1 h backoff → the
       label-flip scheduler keeps spawning doomed reloads → first-come-
       first-served starvation → permanent blanks (G.1) and delayed first
       renders (G.2). On fast hosts bursts are ms-scale → widgets "work".
    6. **Upstream status**: expo/expo@main STILL carries the random-UUID hack
       (identical file, fetched via opensrc 2026-09-02). No fixed version
       exists to upgrade to. No public issue/report found — we are the first
       to characterize this (it needs many kinds + per-minute reloads +
       slow hardware to surface). Filing an upstream issue is worthwhile.
    7. Timeline archive itself is HEALTHY (348 entries, 285× exactly-5-min
       steps + boundary flips; verified from the sim app-group plist) —
       entry density is NOT a driver.
  - Interpretation so far: the calm tree is the light small (hero trio
    only). Both ORBS (dark smalls) and the MEDIUM composition (2-col
    HStack + day list + floating pill + footerLift) oscillate. No single
    shared construct — either two independent loops, or a size/depth-
    triggered recursive layout path in iOS 18's AttributeGraph.
- **Construct suspects (all inside `widgets/PrayerWidget.tsx`; known-fragile
  geometry per ai/AGENTS.md lessons)**: oversized-orb rendering (94pt frame
  + `scaleEffect(size/94)` + `blur(blur/scale)` — 1.17.0 lesson),
  `Spacer`-centering inside `maxHeight: Infinity` stacks (1.14.0 lesson),
  the medium pill track (`RoundedRectangle` + `strokeBorder` + `shadow` +
  `offset`), `footerLift` half-point offset (offset applies at DOUBLE
  strength in the widget runtime — 1.17.0 lesson), translucent
  `containerBackground` (`rgba(255,250,253,0.55)` on light kinds).
  Lock layout uses NONE of these and never loops.
  - **FIX DESIGN — decision taken 2026-09-02 (owner): WAIT for the upstream
    fix as the primary path; our-side hygiene landed as 1.17.8.**
    1. **UPSTREAM FIX TRACKING — expo/expo PR #49244 — THIS IS THE FIX
       (owner: "our bread and butter"). CHECK IT EVERY SESSION.**
       <https://github.com/expo/expo/pull/49244> — "[expo-widgets][iOS]
       Keep SwiftUI view identity stable across updates so animations work"
       by mahdidavoodi7, opened 2026-08-22, last activity 2026-09-01.
       It replaces the random-UUID-per-render identity with stable
       path-based identities (honoring JSX `key` — our day-list rows use
       `key={row.name}`), deliberately EXCLUDES `entryIndex` so timeline
       advances update in place instead of demolishing the tree, with a
       bounded 4096-entry LRU identity cache. Expo's review bot verified
       "the diagnosis in this pull request is correct"; maintainer jakex7
       (author of the original hack) ran verify/review passes 2026-08-31;
       bot status "Ready for human review". This kills the G.1/G.2 failure
       chain at the root: renders drop from ~5–13 CPU-s per widget to
       millisecond in-place updates.
       - **Watch procedure**: `curl -s
         https://api.github.com/repos/expo/expo/pulls/49244 | jq
         '.state, .merged_at, .updated_at'` + the expo-widgets releases:
         `curl -s
         https://api.github.com/repos/expo/expo/releases?per_page=100 |
         jq '.[] | select(.tag_name | contains("expo-widgets")) |
         .tag_name' | head -5` — or watch
         <https://github.com/expo/expo/blob/main/packages/expo-widgets/CHANGELOG.md>.
         The PR sits in the UNRELEASED 57.0.x bug-fix section of the
         changelog → expected to ship as `expo-widgets@57.0.16` (patch
         bump, `npx expo install`), NOT an SDK-58 upgrade.
       - **On release**: bump `expo-widgets` + matching `@expo/ui`, re-run
         the sim ignite-protocol burst measurement (expect ms-scale),
         EAS dev build, XS acceptance protocol (all 8 home kinds render +
         stay ≥10 min, zero new cpu_resource reports, zero watchdog
         lines). WATCH-ITEM: stable identity may enable system default
         update animations (text fades) — owner's no-settling rule says
         suppress if visible (one-line layout change).
       - **Fallback if merged-but-unreleased past ~a week** and the XS
         needs fixing sooner: patch-package backport of the MERGED code
         (low risk at that point — human-approved). Delete the patch at
         57.0.16. Backport note: one hunk touches `render()`, which main
         has changed separately (#49535, unreleased) — resolve against
         57.0.15's file.
       - **Not fixed by the PR (ours)**: the JS push-path cost (G.6) and
         the 10-reloads/min floor (10 kinds × minute-exact labels is the
         UX; minute-aligned London times make both schedules flip at every
         wall-clock :00 together, so per-schedule timers coincide by
         design — reload count is unchanged and becomes harmless once
         renders are cheap).
    2. **Landed 2026-09-02 (1.17.8) — `stores/widget.ts` rework (our-side
       prep)**: PER-SCHEDULE label-flip timers + pushers (a flip re-pushes
       only that schedule's five kinds; schedules fail independently; one
       empty schedule no longer blocks the other's timer) + a London-date-
       keyed prayer-sequence cache so the per-minute flip pushes never
       re-read the prayer DB or re-run the tz sequence math (the G.6 JS
       cost) — full refreshes always rebuild before caching, so data wipes
       and settings changes can never serve stale. Pinned by two new
       tests in `stores/__tests__/widgetSettingsSync.test.ts` (flip pushes
       each schedule's kinds only; flip pushes reuse the cached sequence
       across a DB wipe). `yarn validate` 33 suites / 895 tests green.
    3. Tree-mass reduction in layouts — deferred: owner walked every pixel
       of the design; visual risk for a linear gain.
  - **SHIP + VERIFY protocol (after the 57.0.16 update)**: bump BOTH
    app.json + package.json (1.17.10 — 1.17.8 = Phase 1 prep, 1.17.9 =
    the session-2 docs/branch sync; neither shipped to a store), `yarn
    validate`, `npx eas-cli build --profile development --platform ios
    --non-interactive --no-wait`, owner verifies on the XS: all 8 home kinds
    render AND stay rendered ≥10 min, zero new `ExpoWidgetsTarget.
    cpu_resource` reports, zero `Watchdog provision violated` lines in a
    fresh `idevicesyslog` capture. Sim-side smoke: ignite protocol (foreground
    app → push → HOME) shows bursts ≤ a few seconds and full decay between
    minute-flips.
- **Evidence files (all in /tmp — survive until reboot)**:
  `/tmp/xs-syslog.txt` (full device syslog, ~1.5M lines; analysis window
  offset in `/tmp/syslog-mark.txt` = 906268; slice at `/tmp/window.log`),
  `/tmp/xs-crashlogs/` (4× cpu_resource + JetsamEvent-2026-03-24 + old
  Athan-2026-08-17 crash), `/tmp/sim18-ext.log` (sim chronod+extension
  stream, session 1), `/tmp/sim18-live.log` (session-2 live log stream —
  kind-level Request/liveView lines + "Ignored view update for reason:
  [timelineAdvancedOrNewArchive]"), `/tmp/extsample1.txt` (macOS `sample`
  of the burning extension — the DynamicViewList/AttributeGraph stack),
  `/tmp/fix-build.ipa` + `/tmp/fixipa/` (dissected dev build),
  `/tmp/build18.log`, `/tmp/build18d.log`, `/tmp/metro-athan-baseline.log`
  (89 s JS-freeze evidence), `/tmp/metro-athan-fix-session1.log` (session-1
  fix-build log, archived) + `/tmp/metro-athan-fix.log` (session-2 log).
  App-group archive for kind timelines (sim):
  `~/Library/Developer/CoreSimulator/Devices/15DD…/data/Containers/Shared/
  AppGroup/AA2FE8C7…/Library/Preferences/group.com.mugtaba.athan.plist`.
  Device syslog tooling: `idevicesyslog`/`idevicecrashreport` installed via
  brew (libimobiledevice); pairing validated for XS UDID
  `00008020-0015585C22D2002E` — replug + re-trust if asked.
- **RED boxes note (dev builds only)**: DEBUG `DynamicView.swift` renders
  failures as red boxes; release maps them to invisible `EmptyView`.
  Two red sources exist: `EntryView` "No layout found for
  `<group>::<Kind>`" and unknown-node `Unable to get the view for: <type>`
  (red + text). The owner's red boxes showed no readable text on-device —
  never resolved which; irrelevant now that the CPU/watchdog chain is
  proven, but remember red ≠ necessarily "layout string missing".
- **Symptom**: `PrayerWidgetMedium`, `ExtrasWidgetMedium`,
  `PrayerWidgetDarkMedium`, `ExtrasWidgetDarkMedium` (all four mediums) and
  `ExtrasWidgetDark` (small) render a blank system-tinted surface (purple on
  light kinds, dark on dark kinds) permanently — never render content across
  30+ minutes of watching, a device restart (app reopened, waited 10 + 10 min
  again), and app relaunches. Tapping them opens the app correctly.
- **Working on the same device**: `PrayerWidget`, `ExtrasWidget`,
  `PrayerWidgetDark` (the three non-dark-extras smalls) render instantly and
  stay correct. Both Lock Screen kinds were blank at placement but recovered
  after ~60 s and work perfectly (delayed first render — see G.2, not a
  permanent blank).
- **Why this is hard**: `ExtrasWidgetDark` shares the EXACT same serialized
  layout function, render path, and props shape as the working
  `PrayerWidgetDark`/`ExtrasWidget` smalls (only color/data fields differ) —
  no layout-code difference can explain it. All 10 kinds share one extension
  process; 5 widgets render fine there, so the runtime/bundle/storage work
  generally.
- **Ruled out** (with evidence): data volume/slowness (owner rebuttal upheld —
  same data renders in three working smalls); build configuration (owner
  confirmed Release config was verified working on simulator, incl. mediums);
  global expo-widgets regression (upstream #47963 "widgets render blank on
  SDK 57/iOS 26" — closed unresolved without repro; our locks recovering and
  5 healthy widgets contradict a global failure); reload-budget throttle as
  the primary cause (fresh pushes after restart never healed the blanks);
  `Toast`/layout code path for ExtrasWidgetDark (identical to working kinds).
- **Release-build observability trap**: `expo-widgets` `DynamicView.swift`
  maps render failures/unknown nodes to `EmptyView()` outside `#if DEBUG` —
  every failure mode is an invisible blank on TestFlight. The simulator's
  release pass proves the layouts are correct code; the failure is
  environmental to the device (iOS 18 / A12 / 4GB).
- **Candidate root causes (SUPERSEDED — root cause found above, kept for
  history)**:
  1. Per-process widget-extension memory ceiling (jetsam): all 10 placed
     widgets render in one process; mediums are the heaviest trees (6-row
     list + pill + stroke/shadow; dark kinds add 4 blurred orbs — blur up to
     82, corner orb 255pt/blur 75). A deterministic kill mid-render freezes
     the same set blank on every retry; the recovered locks (tiny text-only
     trees) fit. NOTE: per-process ceiling is unrelated to free RAM/storage —
     an empty factory-reset phone does not exonerate this.
  2. iOS-18-specific failure in medium-only modifiers (pill
     `strokeBorder`/`shadow`/`offset`) — cannot explain ExtrasWidgetDark.
  3. App-group UserDefaults write failures for specific kind keys — silent
     `cfprefsd` losses are documented platform-wide; we write ~10 × ~155KB
     timeline arrays every minute while foregrounded. Would explain
     ExtrasWidgetDark if its key specifically fails.
- **Agreed diagnostics (Phase 0, owner's phone, no code)**:
  1. Clean page → add ONLY `PrayerWidgetMedium` → wait 2 min. Renders ⇒
     load-dependent ⇒ memory. Blank alone ⇒ medium-path bug.
  2. Clean page → add ONLY `ExtrasWidgetDark` → wait 2 min. Renders ⇒
     load-dependent. Blank alone ⇒ its storage key.
  3. Settings → Privacy & Security → Analytics & Improvements → Analytics
     Data → `JetsamEvent-*.ips` timestamped during blank episodes = positive
     proof of memory kills.
  - Follow-ups: dev-signed Release build on device → Console.app WidgetKit
    per-widget render results (`Request ended for <kind> — success/error`);
    container download → inspect `group.com.mugtaba.athan` plist for the 5
    kinds' `__expo_widgets_*_timeline`/`*_layout` keys; in-app `getTimeline()`
    readback diagnostic after each push.
- **Fix branches per verdict**: memory ⇒ lighten medium render cost (orbs/
  blur/corner-orb design trade-offs — owner decision, no device branch exists
  in the widget layout env); iOS-18 modifier bug ⇒ bisect medium composition
  with diagnostic layouts; storage ⇒ reliable persistence (file-in-container
  patch for expo-widgets' hardcoded UserDefaults path).

### G.2 [OPEN — RELEASE BLOCKER] ~60 s blank window when adding any widget

- **Symptom**: a freshly added widget shows the blank/purple placeholder for
  up to ~60 s before its first render (observed: extras light small blank
  until "the widget updates"; both lock widgets ~60 s). Users will read this
  as broken widgets on first use.
- **Suspected mechanism**: first-render delivery latency — the same ~60 s
  WidgetKit reload latency already documented in ai/AGENTS.md under push
  barrages. `stores/widget.ts` label-flip scheduler re-pushes all 10 widgets
  every minute while foregrounded (~10 `WidgetCenter` reloads/min against
  Apple's documented 40–70 reloads/day per widget budget).
- **Owner constraint**: minute-accurate label updates must stay — cadence
  reduction is REJECTED. Fix must preserve visible freshness while making a
  freshly placed widget render immediately from already-stored timelines
  (stored timelines exist at placement — the delay is delivery, not data).
  Candidates: ensure placement-time snapshot renders without waiting for a
  reload; consolidate reload calls (one `reloadAllTimelines` instead of 10
  per-kind reloads per push); push on launch/backgrounding/settings/data
  changes while relying on the precomputed 5-min step entries between.
- **2026-09-02 update**: G.1's root cause (render-loop CPU saturation →
  watchdog → +1 h retry backoff) explains most of this window on-device;
  the same consolidation (one `reloadAllTimelines` per flip) is the leading
  candidate fix for BOTH G.1 and G.2. Re-assess the residual delay after
  the G.1 layout fix lands. Sim note: on iOS 18.5 sim placements render
  within seconds (owner witnessed), so ~60 s is largely a DEVICE/
  reload-latency phenomenon.

### G.3 [FIXED — device-verified 2026-09-02, dev build v1.17.6] Settings toggle thumb desyncs from track/value

- **Symptom**: toggle track stays purple (on) and the preference is active,
  but the white thumb sits in the OFF position. Repro: with "Show hijri date"
  disabled → disable "Show seconds" → enable "Show hijri date" → enable
  "Show seconds" → hijri toggle shows knob-off/track-purple while hijri is
  enabled. Closing and reopening the sheet shows the correct ON state — the
  value and persisted state were always correct; only the thumb animation is
  wrong.
- **Root cause**: `components/sheets/parts/Toggle.tsx` drives the thumb via
  `useEffect` + `withTiming` on a shared value (with an `isFirstRender`
  skip) — an interrupted/stale animation leaves the thumb at its old position
  while the track color derives synchronously from the `value` prop and stays
  correct.
- **Fix (implemented 2026-09-02, DEVICE-VERIFIED same day)**: replaced the
  effect-driven animation with a reactive
  `useDerivedValue(() => withTiming(value ? X : 0))` — the thumb re-derives
  from `value` on the UI thread and cannot desync. Owner spammed hijri +
  seconds toggles 30 s+ on the XS dev build (v1.17.6): knob always in the
  correct position, no crash (also closes G.8's repro).

### G.4 [FIXED — device-verified 2026-09-02, dev build v1.17.6] Sound preview plays no audio on iOS device

- **Symptom**: Sounds sheet → tap a preview's play button → no audio at all
  on the iPhone XS TestFlight build. Worked previously.
- **Facts established (2026-09-02)**: `SoundItem.tsx`/`Sound.tsx` have had NO
  functional changes since the 1.5.3 era (git log verified) — the regression
  window is the **1.15.0 audio restructure** (wav→mp3, `ATHAN_AUDIOS` in
  `assets/audio/index.ts` created then) and/or the SDK 57 expo-audio bump.
  The app configures **no audio mode anywhere** (no `setAudioModeAsync` /
  audio-session setup in the codebase) — on iOS the playback category is
  never set, so previews are at the mercy of the default session (silent
  switch / no playback guarantees).
- **Simulator release build PASSES (2026-09-02, twice — the second pass on
  the rebuild with the single-player refactor + audio mode)**: audio audible
  + countdown ticking on iPhone 16 sim / iOS 26 Release — code, mp3 assets,
  and bundling are all fine. The failure is device-specific (XS / iOS 18.7.7,
  ring mode ON at 100% volume — the mute-switch theory is RULED OUT by the
  owner).
- **Upstream investigated**: expo#40448 (local assets fail silently in iOS
  release builds) was real but fixed in expo-audio 1.0.14 — our 57.0.4
  (latest 57.x) includes the fix, and our sim release build plays, so that
  is not our bug. No later 57.x patch exists to bump to.
- **Leading root cause**: the sounds sheet created **one native AVPlayer per
  row — 32 concurrent players** (each with periodic time observers and its
  own session activity), a count that DOUBLED from 16 to 32 in 1.15.0 —
  exactly the regression window. On an A12/4GB device running iOS 18 this
  exhausts audio resources; the sim (iOS 26, no mute switch, desktop
  resources) never notices.
- **Device A/B baseline (2026-09-02, EAS dev build v1.17.5 on the XS, Metro
  logs)**: previews STILL silent and countdown still absent in debug config —
  reproduces outside TestFlight/release wrappers. Play icon and selection
  state change correctly (JS tap path healthy) and the Metro log contains
  zero audio/player events during the taps (baseline ships no sound-sheet
  logging) — consistent with players being created but never actually
  producing audio/status.
- **Fix (implemented 2026-09-02, device verify pending)** — two parts:
  1. **Single shared player**: `Sound.tsx` owns ONE `useAudioPlayer` keyed
     to the playing row's source (the hook releases/recreates per source —
     never more than one live instance); `SoundItem` is now presentational
     (props: isSelected/isPlaying/status + callbacks; visuals identical).
     Playback arms from an effect that runs after the source swap;
     finish-clear logic moved to the sheet verbatim.
  2. **Explicit audio mode**: `app/_layout.tsx` calls
     `setAudioModeAsync({ playsInSilentMode: true })` at startup — until a
     mode is set, the app runs iOS's default `.soloAmbient` category, which
     the ring/silent switch mutes (expo-audio configures nothing on its
     own). Previews must be audible in silent mode regardless; partial
     payload is safe (every native AudioMode field has a default;
     `interruptionMode` stays `mixWithOthers`).
  Verify on the XS: previews play + countdown ticks.
- **DEVICE VERDICT (2026-09-02, dev build v1.17.6)**: owner confirmed
  previews audible, spammable, stoppable — "everything works great with the
  audio" (muted-switch test not explicitly re-run; re-check on the
  TestFlight release round).

### G.5 [FIXED — device-verified 2026-09-02, dev build v1.17.6] Sound preview countdown no longer displays

- **Symptom**: while a preview plays, the seconds counter beside the play
  icon (e.g. ticking through a 29 s track) no longer appears.
- **Root cause (likely shared with G.4)**: `SoundItem.tsx` gates the countdown
  on `isPlaying && status.playing && remainingTime > 0` where
  `remainingTime = status.duration - status.currentTime`. If expo-audio never
  reports `playing`/`duration` (player not actually started, or mp3 metadata
  not loaded), the countdown stays hidden. Fixing G.4's playback should
  restore the status stream; verify both together on device.
- **Simulator release build PASSES (2026-09-02)**: countdown ticks alongside
  audible audio — confirms the G.4/G.5 pair is device-side; retest on the XS
  after the audio-mode fix.
- **Device A/B baseline (2026-09-02, dev build)**: countdown absent alongside
  the silent previews on the XS — pairs exactly with G.4 as expected.
- **DEVICE VERDICT (2026-09-02, dev build v1.17.6)**: countdown ticks beside
  the play icon while previews play — FIXED alongside G.4.

### G.6 [OPEN — noted, deferred by owner] App-wide sluggishness on device

- **Symptom**: "everything feels very slow" on the XS TestFlight build.
- **Suspected contributor**: the per-minute widget pipeline on the JS thread
  (2 × 15-day prayer sequences, 4 timelines × ~380 entries, ~1.5 MB bridge
  serialization, 10 UserDefaults writes + 10 reloads every minute while
  foregrounded — `stores/widget.ts` label-flip scheduler).
- **Owner ruling**: update cadence stays as-is; not a release gate. Optional
  future optimization if pursued: cache sequences/timelines and rebuild only
  the head entry's label per minute.
- **Additional device report (2026-09-02, fix build)**: after the app sat
  MINIMIMIZED and was relaunched, the owner hit severe sluggishness (~2 FPS
  feel, unresponsive taps) that cleared after a full close+restart —
  consistent with the foreground-return coalesced burst (accumulated
  timers/pushes firing at once). Sim corroboration same day: the app
  foregrounded = extension idles between the per-minute push requests, so
  the pressure is episodic (bursty), not constant. The 89 s freeze
  (baseline build, G.4's 32-AVPlayer teardown) is FIXED by the single-player
  refactor — but ordinary push/reschedule bursts can still stall low-end
  devices; revisit cadence engineering (consolidated reloads, cached
  timeline rebuilds) only if the owner reopens this.
- **Measured on dev build (2026-09-02, XS, Metro log)**: the sluggishness is
  episodic JS-thread FREEZES, not constant slowness. The per-second TICK logs
  show exactly ONE 89,299 ms total JS stall all session — beginning right
  after sound-preview taps (which fired `rescheduleAllNotifications` + both
  widget-timeline pushes) and Sounds-sheet close. During the freeze every tap
  was dead (no haptics, no sheet, no overlay) while pager swipes kept working
  (UI thread unaffected); after ~90 s the app snapped back all at once.
  Outside that window the JS thread showed ZERO gaps >400 ms. Prime suspect:
  the baseline's 32-AVPlayer creation/teardown (G.4 architecture) piled on
  the reschedule burst — the single-player refactor is the candidate
  remediation. Also observed post-freeze: the settings sheet closed itself
  once ("crashed" without killing the app) and afterwards its button fired
  haptic + press animation but no longer presented, while the alert sheet and
  overlay still opened — sheet-stack corruption under saturation (cross-ref
  G.8).

### G.7 [OPEN — flaky test] widgetSettingsSync "pushes again for a later change" fires a spurious third push ~1–2% of runs

- **Observed (2026-09-02)**: pre-commit `yarn validate` rejected a docs-only
  commit — `stores/__tests__/widgetSettingsSync.test.ts:168` expected 2
  pushes, got 3. Passes in isolation immediately after (8/8).
- **Mechanism**: the test's first debounced push arms the label-flip
  `setTimeout` (`scheduleLabelFlipPush`, delay = ms to the target's next
  minute flip, computed from the faked-but-real-anchored clock). When the
  second `advanceTimersByTimeAsync(1000)` happens to cross that flip window
  (depends on the real wall-clock second the suite started at, ~750/60000 of
  runs), a third `refreshPrayerWidgets` fires inside the assertion window.
- **Planned fix (own commit)**: pin the clock — `jest.setSystemTime` to a
  fixed instant aligned safely inside a minute (e.g. :30) — or
  advance/settle the flip timer explicitly before asserting counts.
- **Fix implemented (2026-09-02, ships with G.3's change)**: fake clock
  pinned to :30 of the seeded minute in the subscription describe's
  beforeEach — flip timer now ~30 s from any test's ≤2 s advances.

### G.8 [FIXED — device-verified 2026-09-02, dev build v1.17.6; intermittent, watch for recurrence] Rapid settings-toggle pressing crashed the app (iOS)

- **Symptom (owner, iPhone XS TestFlight 1.17.4, 2026-09-02)**: rapid-pressing
  settings toggles (hijri date and others) crashed the app to springboard
  once. Did NOT reproduce after an app restart with identical actions —
  intermittent, state-dependent. Android untested.
- **No crash log captured yet** (restart cleared the repro; report should
  still exist on device). If it recurs: Settings → Privacy & Security →
  Analytics & Improvements → Analytics Data → `Athan-2026-09-02-*.ips`, or
  Xcode → Organizer → Crashes. Attach the exception thread/frames to this
  entry before any further fix attempts.
- **Suspects (ranked)**:
  1. Reanimated JS→UI shared-value assignment race under rapid `withTiming`
     interruptions in `Toggle.tsx` — the same subsystem as the G.3 knob
     desync (proven misbehaving under exactly this interaction). The G.3 fix
     (useDerivedValue rewrite) removes the entire JS-side assignment path;
     animation re-derivation now happens reactively on the UI thread.
  2. JS-thread saturation from the widget pipeline mid-toggle (G.6)
     widening the race window.
- **Action taken**: G.3's Toggle fix implemented as the candidate remediation
  (same commit). Retest rapid toggling on the next build; if a crash recurs,
  pull the .ips and reopen with the stack.
- **Release-sim verification (2026-09-02, iPhone 16 / iOS 26, Release build
  with the Toggle fix)**: owner spammed the settings icon, sheet open/close,
  and every toggle for a full session — zero crash reports in
  DiagnosticReports, zero fatal/exception lines in the unified log, app and
  widget-extension processes alive at the end. No crash reproduced. The XS
  TestFlight retest remains the final gate (the original crash was
  intermittent).
- **Second release-sim pass (same day, rebuild with ALL fixes: Toggle,
  single-player sound sheet, audio mode)**: everything working; sustained
  5-second toggle spam shows only a ≤0.5 s lag tail (JS-thread contention
  under deliberate spam — accepted by owner, not a defect).
- **Dev-build corroboration (2026-09-02, XS)**: during the 89 s JS freeze
  (see G.6) the settings sheet closed itself and stopped presenting while
  haptics still fired — state-dependent instability under JS saturation,
  matching the intermittent nature of the original crash. The freeze source
  (32-player teardown, G.4 fix) and the Toggle rewrite are both on the fix
  branch; retest there.
- **DEVICE VERDICT (2026-09-02, dev build v1.17.6)**: 30 s+ of sustained
  toggle spam (hijri, seconds, others) — NO crash, no sheet corruption;
  sluggish-then-recovered by full app restart. Original crash never
  reproduced with the fix. Keep this header's "watch for recurrence" caveat
  through the next TestFlight release round.
