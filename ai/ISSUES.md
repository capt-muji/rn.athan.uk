# Issue Ledger — rn.athan.uk

Last updated: 2026-09-09 (session: large-screen adaptation — #25 ADDED, sound-sheet preview dead first tap after natural clip completion, scheduled for the follow-up session. Earlier 2026-09-09, bug-fix session 1 of 3: #21 FIXED 1.22.10 — Android 9 TLS 1.3-only API blocked all real fetches; ContentProvider-based ProviderInstaller module; widgets feature-flagged OFF pending expo-widgets 57.0.16 (G.1/G.2); What's New became a versioned archive. Upstream watch: #49687 MERGED 2026-09-08T13:10Z, rides SDK 58, no 57.x backport; adoption step + shipped `delivery: 'alarmClock'` API recorded in #17. Earlier 2026-09-03, session 2 of the Android 4-device campaign: #17 bare-expo control — app exonerated, minimal reproducer appended to upstream PR #49687; #18 added — Android force-stop cancels scheduled alarms; #19 MITIGATED — 8T boot re-arm block, Auto-launch causal; #20 added — post-reboot headless task body hang, upstream candidate. Earlier: 2026-09-02 #8 FIXED 1.18.0 device-verified iOS; section G release blockers; #12 closed 1.6.0; #4/#5 DEFERRED; #10 OPEN.) Upstream watch (2026-09-09, post-backport): #49244 (expo-widgets identity, OPEN, in review) + #49687 (MERGED, rides SDK 58; adopted on the throwaway experiment/alarmclock-backport branch, fleet-verified window=0; deletion-day checklist in ai/prompts/alarmclock-backport.md) + #48786 (informational only). Dropped: #44540 (closed upstream via #44646), #43136 (guard shipped, maintainer-confirmed intentional), ISSUES #20 (owner-accepted, unfiled). Audio 30s iOS-cap audit CLEARED: athan15 (longest, 29.975s decoded) verified audible on the XS; mp3-duration overcounts ~2-3 frames of gapless padding — re-verify >30s flags with ffmpeg decoded duration. Fleet: Huawei/Honor phone added 2026-09-09 (owner-installed 1.24.1 via the EAS link; its USB never enumerated on the Mac).

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

### 4. [FIXED 2026-09-11, 1.24.14, fix/year-boundary] Jan 1 redundant previous-year fetch (non-seamless path only)

- **What**: If 2027 was never cached (API late / user skipped December opens), the Jan 1
  open runs Scenario 2: clears cache, fetches 2027, then the Jan-1 branch in
  `initializeAppState` (stores/sync.ts:49-62) finds Dec 31 2026 missing and refetches
  ALL of 2026 just for that one day's Isha (CountdownBar progress needs yesterday).
- **Impact**: One redundant ~365-record request per device per year boundary, only on the
  online path. Data correctness unaffected. Low priority.
- **Possible fix**: Store Dec 31 (or last-day) record separately before clearing, or fetch
  single-date via the API's `date` param instead of full year.
- **Fix (1.24.14)**: `updatePrayerData` reads yesterday's record before the cache wipe and saves it straight back, so on Jan 1 Dec 31 survives and the Jan-1 branch finds it cached: no second download. Dec 31 now matters twice, as yesterday's final prayer for the countdown bar and as the Maghrib that opens the Extras night into Jan 1 (#29). Tests: yesterday is restored right after the wipe; on Jan 1 with Dec 31 cached, last year is not downloaded. Both fail when the restore is removed.

- **Device check (OnePlus 3T, 1.24.15 production configuration, real 2026 data, device clock set to 31 Dec 2026)**: the cache-preservation half of this fix is now proven on hardware. On 31 Dec, `shouldFetchNextYear()` is true (December, 2027 never fetched) and `isCurrentYearCached()` is true, so Scenario 3a fires: fetch **next year only**, no wipe. The API genuinely has no 2027 yet — a direct request returns HTTP 200 with a 28-byte body and **0 day records** — so `fetchYear(2027)` throws "Incomplete data received", is caught, and the sync returns. The page then rendered entirely from cache, matching a prediction computed from the API data *before* looking at the phone: Standard Fajr 06:26, Sunrise 08:03, Dhuhr 12:09, Asr 13:45, Magrib 16:04, Isha 17:41; Extras Midnight **23:14**, Last Third **01:38**, Suhoor 06:06, Duha 08:23, with the countdown and ago-badge agreeing (06:53 GMT → "1h 9m" to Sunrise, "Fajr 27m ago"). Had the cache been wiped, the screen would have been a spinner or the error state. Note the winter extreme: that night is 14 h 23 m, the year's longest, which puts Midnight at 23:14 — *before* midnight.
- **What the device cannot prove, and why that is acceptable**: 1 Jan 2027 itself is not displayable while the API has no 2027 records (they publish around late October). That half is covered in code — `stores/__tests__/sync.test.ts`'s "January 1st edge case" block, in particular *"on 1 Jan keeps 31 Dec through the wipe, so last year is not downloaded again"*, plus `shared/__tests__/nightTimes.test.ts:182` for the boundary night. Worth knowing: that test's `2027-01-01` fixture is not invented — it is field-for-field the real **2026-01-01** data, and the solar geometry a year apart on the same date differs by under a minute (Fajr/Sunrise/Dhuhr identical, Asr/Magrib/Isha +1). Near the solstice the series is flat enough that continuing from 31 Dec 2026 and copying 1 Jan 2026 give the same answer to within a minute.

### 5. [SUPERSEDED 2026-09-11, 1.24.12 — see #29] Dec 31 derived times use same-day Fajr fallback (~1-2 min error)

- **Superseded (1.24.12, #29)**: Midnight and Last Third are no longer stored. The lists work them out from the stored Maghrib and Fajr of two consecutive days, across the year boundary too, so there is nothing left to correct. `correctYearBoundaryDerivedTimes`, `fixYearBoundaryDerivedTimes` and their tests are removed; the history below is kept for context.
- **What**: `transformApiData` (shared/prayer.ts:68) computes Midnight/Last-Third using
  next day's Fajr, falling back to SAME day's Fajr for the last entry of the year —
  because no next-year data exists in the same payload. Slightly wrong for the night of
  Dec 31→Jan 1. Confirmed it does not self-heal: the wrong value, once cached, is never
  revisited even after both years become available.
- **Impact**: Cosmetic at most. With London's real timetable Fajr is flat around the
  new year (06:26 on Dec 30, Dec 31 and Jan 1 in the 2024 data), so the correction is
  usually a no-op; the "1-2 min" figure was never measured (revalidation 2026-09-11). See
  #29 for the related question of which night these values are scheduled on.
- **Fix**: `correctYearBoundaryDerivedTimes` (shared/prayer.ts) recomputes just the
  midnight/last-third fields once the real next-year Fajr is cached; `stores/sync.ts`'s
  `fixYearBoundaryDerivedTimes` calls it at the three points a year-boundary fetch can
  complete a Dec-31/Jan-1 pair (December next-year-only, December both-years, and the
  Jan-1 previous-year fetch). No-op (same object reference, no write) when nothing needs
  correcting. 9 new unit tests (recomputation correctness + sync orchestration), full
  suite green — not device-verified (not practically triggerable live; correctness rests
  on the unit tests given this is core prayer-time data).
- **Tests strengthened (1.24.7, revalidation 2026-09-11)**: the original sync tests passed
  even with the bug re-introduced (every mock record shared one Fajr, and lookups matched
  month/day only). Records now carry distinct Fajr times and lookups match the full date;
  proven to fail on three mutations — Dec 31 paired with its own Fajr (4 failures), the
  wrong year (3), and the both-fetches-succeeded guard removed (1).

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

### 8. [FIXED 1.18.0 — device-verified] Background task never ran — unit bug + re-arm starvation

**Runbook:** every scenario in the verification matrix below is scripted for
replay (incl. the pending 5-device Android campaign) in
`ai/RUNBOOK-background-tasks.md` §1 status tracker + §5 procedures.

- **Root cause 1 (ours, both platforms — PRIMARY)**: `minimumInterval` is documented
  in MINUTES (BackgroundTask.types.d.ts; Android WorkManager TimeUnit.MINUTES at
  BackgroundTaskScheduler.kt:150; iOS BackgroundTaskConsumer.swift:45 reads minutes
  → ×60 → earliestBeginDate). We passed SECONDS (`10800`) → iOS scheduled the
  BGProcessingTaskRequest **+7.5 days out** (BackgroundTaskScheduler.swift:95);
  Android initialDelay 7.5 days (BackgroundTaskScheduler.kt:114
  `Duration.ofMinutes(10800)`). ADR-007's draft carried the seconds mental model over
  from the deprecated expo-background-fetch API.
- **Root cause 2 (compounding starvation)**: `EXTaskService._restoreTasks` resubmits
  the request on EVERY process launch with the PERSISTED options → every app open
  re-armed `earliestBeginDate = now + 7.5 days` → for any user opening the app at
  least weekly, the task was NEVER due. Persisted options never refreshed because
  `registerBackgroundTask` early-returned on `isTaskRegisteredAsync` (expo-task-manager
  persists registrations across launches AND installs-updates).
- **Live evidence (iPhone XS, iOS 18.7.10, 2026-09-02 session)**: native syslog
  `EXTaskService: Restoring tasks configuration: … minimumInterval = 10800`; after fix
  the dasd submission windows prove the arithmetic (`Submitted … (21:05:48 …)` exactly
  +15 min after the 20:50:48 run at the 15-min debug rung).
- **Fix (1.18.0)**: `BACKGROUND_TASK_INTERVAL_MINUTES` in shared/constants.ts —
  resolution order: `EXPO_PUBLIC_BG_INTERVAL_MINUTES` env (ladder experiments) → 15 in
  development builds (fast iteration) → 360 in production (6h — owner retune 2026-09-02
  post-verification: longer intervals are more OS-lenient; 8 attempts per required 1-per-48h;
  ADR-007 rev 3);
  `registerBackgroundTask` now ALWAYS unregisters + registers so persisted options can
  never go stale (self-heals every existing install carrying 10800). Same session:
  foreground gate NOTIFICATION_REFRESH_HOURS 4h → 12h — the foreground layer is now
  the FALLBACK (background task is primary), needing 1 run per 48h.
- **Verification matrix (all on-device, dev build @ 15-min rung unless noted)**:
  - Simulated (`triggerTaskWorkerForTestingAsync`): 3/3 clean full-chain runs ~1.3–2.0s
    (handler → TaskService → JS task → reschedule → verification counts → resubmit).
  - Natural fire, FOREGROUND: 20:50:54 (+14s after due) and 21:06:03 (second cycle,
    zero app interaction — chain self-perpetuates); on the RELEASE build:
    22:53:59 (+58s after due; window re-armed to exactly +15:00).
  - Natural fire, BACKGROUNDED: 21:21:35 (+36s after due; another app foregrounded).
  - Cold-launch HEADLESS (process externally killed): system relaunched the app on
    schedule (runningboardd "DAS Prewarm launch"), but DEV builds cannot load JS
    headlessly — the RN bundle URL requires the dev-client launcher UI; Metro is
    unreachable from a headless cold start. This is structural to dev builds, NOT a
    bug in ours or expo's: RELEASE builds embed JS and work (verified: persisted
    config survives app updates; fresh submit at exactly +15m on Release 1.18.0).
  - dasd rate limit: at 15-min cadence, after ~4 rapid runs dasd logs "Skipping
    processing … their group is full" every ~60s and defers execution → **sub-hour
    intervals are not sustainable**; any multi-hour value sits far under budget (ship value retuned to 360 min).
    Deferrals recover — budget drained at 21:35 admitted the 21:59 execution.
  - REBOOT SURVIVAL (verified 22:18–22:30): device rebooted with the app's pending
    request in flight and the phone left LOCKED post-boot. ~11 min after boot the
    system cold-launched the app headlessly (pid 380), full RN boot re-registered the
    task, and dasd submitted a fresh request with the window at exactly +15:00
    (22:30:04 → 22:45:04). The rolling chain survives unattended reboots on iOS.
  - User FORCE-QUIT: not remotely testable (requires app-switcher swipe; sets a
    runningboard flag that disables background relaunch until the next manual open —
    Apple platform rule for ALL apps). Existing recovery paths: 2-day notification
    buffer (survives force-quit/reboot — UNUserNotificationCenter persists) +
    foreground refresh on next open + widget stale card.
- **Upstream constraints (expo-background-task 57.0.14, ACCEPTED — no local patch)**:
  iOS `BGProcessingTaskRequest.requiresNetworkConnectivity = true` hardcoded
  (BackgroundTaskScheduler.swift:93) — our task is offline-capable (MMKV), so offline
  devices defer needlessly; `getStatusAsync()` never reports Background App Refresh
  disabled (expo/expo#48786) — our "restricted" check is blind to it. Android:
  `NetworkType.CONNECTED` constraint (never runs offline), inForeground skip
  (defers +60 min while app foregrounded), plus OEM killers (#10/#13 family).
  Android unit bug is fixed by the same change but REMAINS DEVICE-UNVERIFIED (no
  Android connected this session).
- **Android reboot/longevity facts (source-verified 2026-09-02, for the next
  Android session)**: WorkManager persists unique work across reboots and process
  death (self-rescheduling OneTimeWorkRequest re-enqueued from the DB), and
  expo-notifications ships a BOOT_COMPLETED receiver (NotificationsService.kt) that
  re-registers persisted triggers after boot — so Android's notification chain
  natively survives reboot; the Android side of the 1-year-unattended goal is
  bounded by the #10 ColorOS exactness problems + OEM killers, not by persistence.
  The BG-task interval fix is symmetric: BackgroundTaskScheduler.kt reads
  `minimumInterval` in minutes (`Duration.ofMinutes`, TimeUnit.MINUTES) — the same
  10800 unit bug delayed Android's worker 7.5 days; 1.18.0 fixes both platforms
  with the one constant.

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
  RE-CONFIRMED against installed expo-notifications 57.0.15 (2026-09-02 session):
  same code at delegates/ExpoSchedulingDelegate.kt:106-114 — still silent, still no
  JS-visible observability. The next Android device session should START with the
  #14 adb ground-truth checklist (`dumpsys package … EXACT` + `deviceidle whitelist`)
  before anything else — it disambiguates suspect 1 (permission actually revoked at
  runtime) from suspect 2 (ColorOS process-freeze deferring delivery).
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

### 17. [OPEN — UPSTREAM FIX MERGED, RIDES SDK 58] OEM windowed delivery of scheduled notifications (root cause of #10's late fires)

- **Status (2026-09-03, deep-dive session with 4-device bench)**: root cause empirically
  characterized; upstream fix proposed as [expo/expo#49687](https://github.com/expo/expo/pull/49687)
  (opt-in `alarmClock: true` on DateTriggerInput → `AlarmManager.setAlarmClock()`).
- **Status (2026-09-08, upstream watch delta)**: #49687 MERGED to `main` at 2026-09-08T13:10Z
  (vonovak). The fix sits in the changelog's Unpublished block, so it rides the SDK 58 line.
  No 57.x backport exists: no backport PR references it, and the newest npm 57.x
  (`57.0.17`, 2026-09-04) predates the merge; the first npm artifact carrying the fix is
  `58.0.0-canary-20260908-e343e6e`. Per owner rule, no speculative SDK 58 upgrade: adoption
  waits for the SDK 58 release (recorded under Owner-facing implications below). Watch
  signal: `npm dist-tag ls expo` gaining `sdk-58`, or a `58.0.0-beta.x` publish; as of
  2026-09-08 only per-commit canaries exist and no beta has been announced.
- **Backport experiment (owner-ordered 2026-09-08, sequenced AFTER the large-screen
  feature, at the very end)**: patch-package backport of the MERGED #49687 state (merge
  commit `257006e` on expo/expo main - includes the maintainer's pre-merge adjustments;
  NOT our draft) onto installed `expo-notifications@57.0.17`. Mechanism per the G.1
  fallback precedent: extract the merged diff for `NotificationScheduler.kt`,
  `NotificationTriggers.kt`, `ExpoSchedulingDelegate.kt`, `NotificationScheduler.types.ts`,
  `Notifications.types.ts`, `scheduleNotificationAsync.ts`; reconcile any main-vs-57.0.17
  drift; `patch-package` devDependency + postinstall (branch-only, never merged);
  add `delivery: 'alarmClock'` to our DateTriggerInputs on the branch; branch
  `experiment/alarmclock-backport` from uat; EAS preview build (Android) for weeks/months
  of owner testing ahead of SDK 58. DELETE branch + patch the day an SDK release carries
  the fix.
- **Shipped API differs from the draft**: the merged option is `delivery: 'alarmClock'`
  (`NotificationDelivery = 'bestEffort' | 'alarmClock'` in `Notifications.types.ts`, default
  `'bestEffort'`, Android-only, degrades to best-effort without the exact-alarm permission)
  on `DateTriggerInput` and the daily/weekly/monthly/yearly triggers. The draft's boolean
  `alarmClock: true` did not ship; the hardware verification below ran on the draft branch,
  the alarm-clock path itself (`setAlarmClock()`, `window=0 flags=0x9`) is unchanged.
- **SDK 58 upgrade flag**: the same Unpublished changelog block carries a breaking change
  ([#49072](https://github.com/expo/expo/pull/49072)): notifications arriving in the
  foreground now present by default unless `setNotificationHandler` says otherwise. Audit
  our handler behavior during the SDK 58 upgrade.
- **Mechanism (all measured, none inferred)**: on OnePlus 8T (OxygenOS 12) and Oppo Find X8
  (ColorOS 16), alarms scheduled through expo-notifications' EXACT path are stored by the OS
  with a 1-hour deferral window (dumpsys: `window=+1h0m0s0ms flags=0x4`) and delivered inside
  it per battery policy — +21s (lenient, charging/screen-on) → +2m21.4s ×3 identical (batching
  quantum) → +2h23m planned worst (unattended state, from ColorOS `policyWhenElapsed`).
  App-side post latency stays ~0.3s throughout; the deferral is 100% OS alarm queue.
- **Bare-metal control** (hand-built receiver-only APK, no expo/RN/Kotlin): `setAlarmClock()`
  delivers **+3–43ms on all four fleet phones** in EVERY tested condition (incl. restricted
  standby bucket, 2-day distance); bare `setExactAndAllowWhileIdle` +12–42ms; inexact APIs
  +20s–5m12s. The OS alarm queues are NOT broken — the windowed storage applied to the
  library-scheduled alarms is the differential.
- **Bisection (all ruled out as the cause of the windowed storage)**: targetSdk 33 vs 36,
  PendingIntent mutability/URI/foreground-flag, alarm count (30+ burst), standby bucket
  (RESTRICTED bare app still exact; ACTIVE expo app still windowed), schedule distance
  (2-day arms), androidx version (single-instruction passthrough verified in the shipped dex),
  shipped delegate bytecode (verified correct). Cause is per-package OS policy, not observable
  from adb — documented in the PR; the alarm-clock channel sidesteps it entirely.
- **Bare-EXPO control (2026-09-03, the level-1 experiment — app exonerated):** a blank
  `create-expo-app --template blank-typescript` + `expo-notifications` only (~10 lines, ONE
  DATE trigger) reproduces the windowed storage **identically**: 8T `window=+7m29s985ms
  flags=0x4` and F8 `window=+7m29s990ms flags=0x4` (WINDOWED, exact-path permission verified
  granted), 3T/5T `window=0 flags=0x5` (EXACT) — 4/4 correlation with the full app.
  Delivery when it fired: 8T **+14.2s** / F8 **+27.8s** (frozen process unfrozen by dispatch)
  vs 3T/5T **+0-1ms**. Conclusion: app weight/behavior (alarm count, channels, other modules)
  is RULED OUT — expo-notifications' exact-path alarms are windowed by these OEM layers
  regardless of which expo app schedules them. PR #49687 body updated with this as the minimal
  reproducer (and an unverified `flags=0x9` claim corrected to `window=0`).
- **PR fix hardware-verified (2026-09-03, same session)**: all three `/verify` defects fixed
  and the alarm-clock path proven on the affected hardware — `DATE` and `DAILY` `alarmClock`
  arms store `window=0 flags=0x9` on both 8T and Find X8 while plain siblings store windowed
  (`flags=0x4`); F8 same-minute delivery **+0ms** (alarmClock) vs **+12.7s** (plain); the
  pinned `serialVersionUID` survived a real install-over update; the sub-API-31 guard works on
  API 28/29. Option extended to daily/weekly/monthly/yearly triggers (measured SUID pins);
  PR retitled to "scheduled triggers".
- **Corroboration**: owner audibly received on-time notifications on the 8T (06:00:11, 06:04:00)
  while the F8's same-instant notifications deferred (+21.6s heard; 06:00 alarm deferred past
  +5m unheard) — the exact lived inconsistency that opened #10.
- **Owner-facing implications**: (a) #49687 merged 2026-09-08 but rides SDK 58, so the
  adoption step is: on the SDK 58 upgrade, set `delivery: 'alarmClock'` on our
  `DateTriggerInput`s for exact Athan/reminder notifications in `stores/notifications.ts`,
  then device-verify on the 4-device bench per the #10/#17 protocol (8T/F8 alarms store
  `window=0 flags=0x9`, same-minute delivery +0ms vs windowed plain siblings); (b) the Play
  app's CURRENT stale alarms
  (1.5.2, scheduled during the revoke-era) remain inexact until the store app updates and
  reschedules — the 1.18.x reschedule-on-open self-heals them on update; (c) "early" fires
  remain #11 clock-skew territory (not app-fixable).

### 18. [ACCEPTED — platform behavior, documented 2026-09-03] Android force-stop cancels ALL scheduled notification alarms (buffer does not survive force-stop)

- **Measured (Scenario D, all four fleet devices)**: `am force-stop com.mugtaba.athan.bgtest`
  → WorkManager job gone AND the entire pending-alarm registry for the package cleared
  (`dumpsys alarm` 0 entries on each device, vs 4+ pending NOTIFICATION_EVENT alarms
  pre-stop); zero alarm dispatches in the windows where the pre-stop alarms were due
  (07:04/07:07 observed). This is AOSP force-stop semantics (alarms removed with the
  package's scheduled work), not OEM-specific.
- **Platform divergence**: on iOS, pending UNUserNotificationCenter requests SURVIVE
  user force-quit (documented + relied on in #8's recovery design). On Android, the 2-day
  buffer does NOT ride out a force-stop — recovery is exclusively the next app open
  (relaunch re-registers the WorkManager chain + reschedules the full buffer from persisted
  triggers — verified on all four, job counters incremented fresh).
- **Implication**: the D-scenario expectation in RUNBOOK §5 ("notifications still fire from
  the existing 2-day set") is WRONG for Android — updated in the runbook. No app-side fix
  possible; this caps Android's force-quit resilience at "next open".   OEM task-killers that
  use force-stop semantics (the 3T's ~04:0x OEM kill) hit the same wall — which is why the
  background-task chain (self-healing on open) matters more than the buffer there.

### 20. [CLOSED 2026-09-09 — ACCEPTED BEHAVIOR, owner rationale: post-reboot app-open within the 2-day buffer is the bare-minimum user expectation] Android: post-reboot headless background-task body NEVER completes (hang→cancel loop); reboot persistence is chain-only

- **Closure (owner, 2026-09-09)**: after a reboot, already-scheduled notifications still fire (BOOT_COMPLETED re-arms the alarm registry natively — the 2-day buffer executes), and every non-reboot path (warm process, process-death headless) completes the refresh task fine. Only the post-reboot headless REFRESH hangs (OS puts apps to sleep until opened — expected platform behavior across OEMs, not worth fighting). Accepted degradation: a user who reboots and does not open the app within the ~2-day horizon goes silent afterward. iOS is unaffected (post-reboot headless relaunch verified with full body execution). Not filed upstream; reopen only if the bare-minimum expectation changes.

- **Measured (2026-09-03, post-reboot cycles on 3T + 5T + Find X8 + 8T — 4/4)**: after every
  reboot, each due cycle fires the worker headlessly (process spawns, RN boots,
  `BackgroundTaskConsumer: didRegister: NOTIFICATION_REFRESH_TASK`, `runTasks: executing`)
  — then `ReactNativeJS: No task registered for key expo-task-manager` at ~+2s, then JS
  silence for exactly 10:00.000 → `WM-WorkerWrapper: CancellationException: Task was
  cancelled` (WorkManager goAsync hard cap) → chain re-enqueues → repeat every cycle.
  The task body (sync + notification reschedule) NEVER runs post-reboot. Warm-process
  cycles complete in ~1s; the pre-reboot headless cold-launch (scenario C, process death
  WITHOUT reboot) completed in +50.3s — the hang is specific to the POST-REBOOT headless
  context.
- **Consequences**: (a) "chain survives reboot" is CHAIN-ONLY — the self-perpetuation is
  the cancel→re-arm loop; (b) alarms re-arm at boot via BOOT_COMPLETED (native path), fire
  as scheduled, but nothing schedules replacements → the notification buffer DRAINS to 0
  within its ~2-day horizon after any reboot unless the app is opened (observed: 3T/5T at
  0 pending alarms within ~40 min of reboot). iOS contrast: post-reboot headless relaunch
  verified FULL body execution (dasd resubmit exact +15).
- **Suspect (upstream)**: expo-background-task / expo-task-manager headless task
  registration after a reboot restore — the `No task registered for key expo-task-manager`
  warning at +2s is the abort signature (the worker's JS bridge never resolves). Not yet
  source-traced — next session: opensrc expo-background-task 57.0.14/15, find the headless
  executor + the "expo-task-manager" key lookup, then file an upstream issue with this
  evidence (4-device, deterministic, ~10:00 signature).
- **Interim owner-facing implication**: after any Android reboot, notifications keep firing
  from the existing buffer but stop refreshing until the next app open (same recovery as
  #18/#19 — self-heal on open). The 2-day buffer bounds the exposure.

### 21. [FIXED 1.22.10] Android 9: TLS 1.3-only API + provider snapshot ordering broke every real-data fetch

- **Symptom (2026-09-08, first production-config local build on the 3T)**: error screen ("Something went wrong") on fresh launch; sync failed with `SSLHandshakeException: Handshake failed` in ~0.5s. Identical APK worked perfectly on the 5T (Android 10) and S23 (Android 14).
- **Root cause chain (all measured)**:
  1. `www.londonprayertimes.com` accepts TLS 1.3 ONLY (mac forcing `--tls-max 1.2` gets a protocol-version alert; `openssl s_client -tls1_2` fails).
  2. Android 9 ships TLS 1.3 DISABLED in its Conscrypt provider (enabled from Android 10 — exactly why the 5T worked). System curl on both old OnePlus phones also cannot handshake with this server (000).
  3. Google Play Services' `ProviderInstaller` is the documented remedy, and `play-services-base` was already in the APK's dependency tree. BUT installing it from JS (early module eval) fixed DEBUG and NOT RELEASE: okhttp-based clients snapshot `SSLContext.getDefault()` when they are BUILT, and the release runtime constructs them before any JS runs. Verified: a raw `SSLSocket` handshake to the API host from the patched JVM succeeded (`handshake-ok:TLSv1.3`) while the app's fetch failed a moment later.
- **Fix (1.22.10)**: `modules/tls13` — a local Expo module whose `Tls13InitProvider` (a ContentProvider, manifest-merged from the module) calls `ProviderInstaller.installIfNeeded` on API < 29. ContentProviders initialize before `Application.onCreate`, hence before React Native and every HTTP client exist. JS side (`device/tls13.ts`) is observability only. No new dependency (play-services-base already shipped); no-op on Android 10+.
- **Masking lesson**: every pre-1.22.10 local build on every device ran launch-relative MOCK data (`EXPO_PUBLIC_ENV` unset → local; `.env` also held a placeholder key). The 3T's real-network path had never been exercised until the first prod-config build; the failure was invisible for weeks of bench testing.
- **Related noise (non-fatal, unfixed)**: on this 3T, fetch threads log `NoClassDefFoundError: android.webkit.PacProcessor` spam — Chrome 138 as WebView provider on API 28 no longer ships the legacy `android.webkit.PacProcessor` stubs, and OxygenOS' webviewupdate minimum-version lock (`372913652`) blocks switching to the ancient standalone WebView package (v74). The errors are caught internally; fetches succeed once TLS works. Only reproducible on OEM-broken WebView states.
- **Production impact**: every real Android 9 user would have hit the error screen on the API's TLS 1.3-only policy; this module fixes the whole population. Device-verified: 3T Release build fetches real data, settles at 22.5% idle CPU (inside the 19-31% campaign band).

### 23. [FIXED 1.22.23, DEVICE-VERIFIED 2026-09-09] Extras at-time notifications play the user's Athan selection instead of a distinct Extras sound

- **Symptom (owner, 2026-09-08, Find X8)**: the "Last Third" notification fired with the correct title but played the athan selected in the sound bottom sheet. Owner: "It should be the Extras sound, but I'm not sure if I actually implemented that."
- **Code-verified (same day): it was never implemented.** `getNotificationSound` (shared/notifications.ts:46-50) returns `athan${soundIndex+1}.mp3` for EVERY prayer regardless of schedule type; `genNotificationContent` and `addOneScheduledNotificationForPrayer` pass the single sound preference through unchanged. Android channels likewise: `athanAndroidChannelId(soundIndex)` for all prayers.
- **Mechanism to mirror exists**: reminders already play per-prayer audio (`reminder_<prayer>_<interval>.mp3`, `getReminderNotificationSound`), so schedule-type/prayer-aware at-time sound selection is a small change to the content + channel selection.
- **Owner spec (2026-09-08, final — audio file located 2026-09-09)**: ONLY the 5 daily prayers (Fajr, Dhuhr, Asr, Magrib, Isha) use the user's selected athan. Sunrise (standard page) and ALL extras at-time notifications (Midnight, Last Third, Suhoor, Duha, Istijaba) use a single fixed built-in audio: **`/Users/muji/Documents/athan-reminders/reminder.mp3`** (244KB, verified on disk). Import into `assets/audio/` (a dedicated subfolder or root, implementer's choice). Pre-prayer reminders are UNCHANGED (66 per-prayer per-interval files, already correct).
- **Full sound mapping (the 3 categories)**:
  1. At-time, 5 daily prayers → `athan${selected}.mp3` (32 options, sound bottom sheet) — no change
  2. At-time, Sunrise + all extras → `reminder.mp3` (the NEW file, fixed, not user-selectable) — the fix
  3. Pre-prayer reminders, all 11 prayers → `reminder_<prayer>_<interval>.mp3` (66 existing) — no change
- **Implementation sketch**: `getNotificationSound` and `genNotificationContent` gain prayer-awareness (not schedule-awareness — Sunrise is on the standard page but uses the extras audio): the 5 daily prayers map to `athan${soundIndex+1}.mp3` + `athanAndroidChannelId(soundIndex)`; Sunrise and all extras map to the new fixed asset + a dedicated Android channel (fresh channel id, `athan_*_v2` pattern — channel sounds are immutable after creation). Update `initializeNotifications` channel creation and the app.json `sounds` array for the new asset.
- **Fixed (1.22.23)**: `reminder.mp3` imported to `assets/audio/reminders/` (244,652 bytes, byte-identical to the owner's source) and added to the app.json `sounds` array (99 entries). `getNotificationSound(alertType, englishName, soundIndex)` maps the 5 daily prayers to the selected athan and everything else at-time (Sunrise + all extras) to the fixed `reminder.mp3` via `isDailyPrayer`/`EXTRAS_NOTIFICATION_SOUND`; `atTimeAndroidChannelId(englishName, soundIndex)` carries the same boundary to Android channels (`extras_at_time`, fresh id, first generation so no `_v2` suffix per the reminder-channel precedent). The extras channel is created in `initializeNotifications` AND at schedule time (module-flag dedup) so headless background-task reschedules that never run UI init still find it. Boundary pinned by tests on both layers: content sound + channel wiring, all 11 prayers.
- **Device-verified (2026-09-09, session 1, local Release build 1.22.24 on the 3T)**: after enabling Sound at-time for Sunrise and for Fajr through the real UI, `dumpsys notification` shows the fleettest app holding BOTH channels correctly: `extras_at_time` (name "Extra Times", importance 5, sound `android.resource://.../raw/reminder`, vibration [0,250,250,250]) and `athan_1_v2` (sound `raw/athan1`); `dumpsys alarm` shows four at-time alarms at the exact London prayer times (Sunrise 06:23/06:24, Fajr 04:51/04:52). `mBypassDnd=false` on both matches the owner's production app channels (platform behavior, pre-existing). Audible firing not waited for (next Sunrise ~2.6h out); wiring is dumpsys-proven up to the fire moment. VERDICT: fix confirmed; closing.

### 24. [FIXED 1.22.24, DEVICE-VERIFIED 2026-09-09] Splash screen holds through the entire first-launch fetch; the loading spinner is never visible to the user

- **Symptom (owner, 2026-09-08/09)**: on a fresh install with real API data (no mock), the splash screen stays up for the entire network fetch (several seconds on the 3T). The app's own loading spinner (ActivityIndicator in app/index.tsx's `!sequenceReady && state === 'loading'` branch) exists in code but the owner has NEVER seen it — the splash covers it until content exists.
- **Current gating (app/index.tsx:101-115)**: `SplashScreen.hideAsync()` fires only when `revealReady = contentExists && masjidIconLoaded && ...`. On a fresh install, `contentExists` requires the sync to complete (network fetch + cache write + sequence hydration), so the splash is the de facto loading screen for the entire fetch duration.
- **Owner directive (2026-09-09)**: "I would rather see a spinner than a splash screen. Hide the splash screen as fast as possible and show the spinner as soon as possible." On warm-cache launches (the 99% case) the data is instant and the splash disappears immediately anyway — this change affects ONLY the cold-install and cache-wiped paths. The spinner already exists; it just needs to become visible.
- **Design direction**: dismiss the splash as soon as the FIRST FRAME renders (the app's own chrome + spinner), not when content exists. The spinner (or a skeleton/placeholder state) is the user's feedback while data loads behind the scenes. Must not regress the warm-cache launch path (splash should still hold through the Masjid icon load on warm launches so the first revealed frame is complete — the 1.22.5 fix; only the no-content case changes).
- **Scheduled**: bug-fix session (ai/prompts/next-session-bugs.md Task C). Devices connected: 3T + Find X8 + iPhone XS for verification.
- **Fixed (1.22.24)**: two-path design in `app/index.tsx`. A first-render snapshot `coldLaunchRef = !sequenceReady && state === 'loading'` classifies the launch once: cold launches hide the splash as soon as the spinner frame commits (the existing ActivityIndicator becomes the loading UI for the fetch), warm launches keep the reveal-ready gate unchanged (content + Masjid icon + Ramadan sprites, the 1.22.5 complete-first-frame fix). Sync completing later can never re-latch the classification, and perf marks keep their content-only semantics on both paths.
- **Device-verified (2026-09-09, session 1, local Release builds, real API data, vision-audited frames)**: 3T fresh install: splash 5.75s (RN cold start on the SD820), then the app's own spinner visible and rotating for the entire 4.25s fetch window, content arrives at t=11.0s complete-on-arrival (no partial state, no flash, no error). iPhone XS fresh install: first capture shows the spinner state mid-fetch (no mosque splash, no content), next capture the complete list. Warm path no-regression: 3T warm relaunch recording shows the first revealed content frame already complete with the mosque icon present (single cross-fade, no pop-in, no staged reveal); XS warm relaunch settles to a fully-rendered defect-free home screen. VERDICT: both paths confirmed; closing. Known accepted trade-off: on the cold path the first content frame is not gated on the Masjid icon (it loaded during the fetch window in all captures, so no pop-in was observed, but the guarantee is warm-path-only by design).

### 22. [FIXED 1.22.19, DEVICE-VERIFIED 2026-09-09] "Sunrise" wraps to two lines on the standard page (3T, EAS build)

- **Symptom (owner, 2026-09-08, OnePlus 3T, EAS preview build 1.22.11, fresh install)**: the English name column renders "Sunrise" across two lines with the trailing "e" alone on its own line. Never reproduced on any prior build; other devices render it fine per the owner. Launch is also slightly slower on the 3T (accepted; other devices fine — likely first-launch measure + sync on the old device).
- **Suspects (debug with the 3T connected)**: the write-once `prayer_max_english_width_*` MMKV measure on fresh installs (AGENTS.md 2026-09-06 lesson: a wiped install re-measures at launch; if the measure lands in a squeezed first-paint state the column stays wrong until the next wipe), and any text-rendering delta between local Release builds (local prebuild, debug keystore) and the EAS build (cloud prebuild, remote keystore). The wrap being device-specific points at measurement, not layout code.
- **CONFIRMED MECHANISM (owner, 2026-09-08)**: Settings > clear cache + clear data (equivalent to a fresh install) FIXED the wrap. The EAS install was already data-fresh (the phone was wiped before install), so two fresh installs of the same build produced two different cached widths — the write-once `prayer_max_english_width_*` measure is NONDETERMINISTIC at first launch and, once wrong, wrong forever (write-once by design, AGENTS 2026-09-06 lesson).
- **Leading hypothesis**: the measure runs during the first-launch paint before the custom font is ready (expo-font async load) and caches the wrong font's metrics. To confirm during the debug session: fresh-install the EAS build on the 3T, read the cached width key immediately, compare against a settled re-measure.
- **Correlated evidence (owner, 2026-09-08)**: the 3T's FIRST open of the EAS build was notably slow, the second open still slow but less — the wrong measure landed inside that congested first-launch window (fonts + hydration + first schedule pass competing on the slowest device). The debug session should capture a fresh-install launch timeline (perf marks: js_to_content et al) and place the width measure within it; if the measure precedes font-settled state, the fix is ordering, not measurement itself.
- **Fix direction**: gate the write-once measurement on confirmed font readiness (never measure with fallback font metrics), or make the cache self-healing (re-measure once after fonts settle and take the max, a single one-time reflow at most). Must preserve the no-reflow-after-settle property that made the cache write-once in the first place.
- **Priority note**: this is production-facing — any real user whose first launch measures wrong keeps wrapped names until they clear data. Worth pulling into its own small fix session rather than waiting for the backport session if the owner prefers.
- **Fix (1.22.19)**: self-healing grow-only cache. `setEnglishWidth` rejects zero/negative measurements and any measurement that does not STRICTLY WIDEN the cache; `InitialWidthMeasurement` keeps its two hidden measuring texts mounted permanently (cost: two invisible single-word Texts riding the layout pass RN performs anyway — `onLayout` reads the number Yoga already computed; steady state measures-equals-cache so no atom write, no subscriber, zero re-renders). The cache is MONOTONIC: a bad narrow first measure heals upward on the next launch and can never flip-flop (alternation would need downward writes, which the guard forbids); correct values are compute-once-forever exactly as designed. Chosen over a font-readiness gate because the font hypothesis is unverified on-device — this heals the whole symptom class regardless of root cause. Caveat recorded: a deliberate future font change must bump the cache keys.
- **Remaining**: device verification on the 3T (backport session, tracker B9) — confirm the healed width persists and no wrap reappears across relaunches.
- **Device-verified (2026-09-09, session 1, local Release build 1.22.24, `com.mugtaba.athan.fleettest` on the 3T, real API data)**: fresh install (the exact condition that previously produced the wrap) renders Sunrise on ONE line with all six English names at identical bounds (`[32,792][245,857]`, w:213 h:65, uniform 150px row pitch; uiautomator), and the bounds are byte-identical across 3 force-stop relaunches (zero width drift, no flicker). Vision-audited pixels agree on both the 3T (35px single-line text band) and the iPhone XS (39px single-line band, column aligned within ±4px). The grow-only cache measured correctly on the congested first launch and stayed stable. VERDICT: fix confirmed; closing.

### 19. [MITIGATED 2026-09-03 — Auto-launch confirmed causal] 8T loses the WorkManager chain AND notification alarms on every reboot (until next app open)

- **Measured (Scenario E, 2026-09-03, reboots #1/#2 with Auto-launch OFF)**: OnePlus 8T /
  OxygenOS 12 — after each reboot (app NOT opened; boot completed; live job + 28 alarms present
  at reboot time): `dumpsys jobscheduler` has NO bgtest job and `dumpsys alarm` has 0
  notification alarms. The 3T (OxygenOS 9), 5T (Android 10) and Find X8 (ColorOS 16) all
  re-armed + fired on schedule headlessly after the same reboots.
- **Mechanism (pinned by elimination)**: the app's BOOT_COMPLETED/REBOOT/QUICKBOOT_POWERON
  receivers ARE in the merged manifest; a manually-sent BOOT_COMPLETED is a protected
  broadcast (SecurityException). Boot delivery to this package simply never occurs — OnePlus'
  per-app "Auto-launch" management (default OFF for sideloaded apps) silences boot receivers
  without any adb-visible state.
- **FIX VERIFIED (reboot #3, owner enabled Allow auto-launch for both apps)**: job
  #u0a27/22 (SAME number as pre-reboot — boot receivers re-armed from persisted state, no app
  launch) + 14/14 alarms present ~2 min after boot. Only delta vs the failing reboots = the
  Auto-launch toggle → causal. NOTE: the re-arm lands up to ~2 min after boot_completed (first
  read at +60s raced it — allow settling time before reading verdicts).
- **Owner-facing**: an OxygenOS-12-class user loses ALL scheduled notifications + the
  background chain on every reboot until the next app open — UNLESS the app's Auto-launch is
  enabled (user action in OnePlus settings; cannot be requested by the app). The real Athan
  app has Auto-launch enabled by the owner as of 2026-09-03. Consider a docs/FAQ note for
  OnePlus users; there is no programmatic fix (by OEM design).

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
    0. **[2026-09-12 — #49244 IS DEAD. THE FIX IS NOW #49810, MERGED BUT
       UNRELEASED, SHIPPING ON THE SDK 58 LINE.]** Verified this session,
       do not re-derive:
       - `#49244` was **closed UNMERGED** on 2026-09-11. Maintainer jakex7:
         *"Thank you, however we decided to take a different approach in
         keeping stable identities, so I'm going to close this PR."*
       - He then implemented it himself: **expo/expo#49810**, "[widgets][iOS]
         Preserve view identity across widget and Live Activity updates",
         commit `d7a46994`, landed on `main` **2026-09-11** (same day).
       - **It ships on SDK 58, not a 57.0.x patch.** The expo-widgets
         CHANGELOG's `## Unpublished` section carries #49810, and the section
         immediately below it is `## 58.0.0 — 2026-09-10`. The old expectation
         of "`expo-widgets@57.0.16`" was based on #49244's changelog placement
         and is void.
       - **57.0.16, 57.0.17 and 57.0.18 each say "This version does not
         introduce any user-facing changes."** A higher version number proves
         nothing here.
       - **Verified in the installed source**, not inferred:
         `node_modules/expo-widgets/ios/Widgets/DynamicView.swift:26` still
         reads `let uuid = NodeIdentityWrapper(id: UUID())` under the comment
         `// TODO(@jakex7): Hack to satisfy ExpoSwiftUI.AnyChild with random
         UUID value`. The root cause is still installed.
       - **Therefore the `widgets` flag stays OFF.** Having the iPhone XS
         connected does not unblock this; there is nothing shipped to verify.
       - **The patch-package fallback below is now LIVE** (merged, unreleased,
         clock started 2026-09-11). Backport target is #49810, NOT #49244, and
         resolve against the installed 57.0.18 sources. Note the old backport
         note's `render()`/#49535 conflict warning refers to #49244's diff and
         may not apply to #49810.
       - **OWNER DECISION 2026-09-12: we WILL patch it, deferred to its own
         session.** *"We will do the same thing we did for the alarm clock. We
         will also patch it, but we're gonna defer that as well."* Shape it like
         `ai/prompts/alarmclock-backport.md`: patch the merged upstream code on
         its own branch, delete the patch when the real release ships. Needs the
         `widgets` flag flipped ON as well as the patch — while it is off,
         `app.config.ts` strips the expo-widgets plugin at prebuild, so there is
         no extension in the build and a patched `node_modules` changes nothing
         observable. Also needs the iPhone XS reconnected (deliberately
         disconnected 2026-09-12) for the acceptance protocol below.
       - Also merged in the same window: **#50038** (Android Gradle build
         failure when no Android widget is configured) — only relevant if
         Android widgets are ever configured.
       - Separately, **#48786 is an open ISSUE, not a PR**:
         `[expo-background-task] iOS getStatusAsync() never reads the real
         Background App Refresh permission`. Unrelated to widgets; relevant to
         our background-task path.

    1. ~~**UPSTREAM FIX TRACKING — expo/expo PR #49244 — THIS IS THE FIX
       (owner: "our bread and butter"). CHECK IT EVERY SESSION.**~~
       **SUPERSEDED — see item 0. Kept for the diagnosis, which still holds.**
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
    app.json + package.json (was 1.17.10 at time of writing — 1.17.8 = Phase 1 prep, 1.17.9 =
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

### G.6 [CLOSED 2026-09-09 — OWNER-ACCEPTED performance] App-wide sluggishness on device

- **Closure (owner, 2026-09-09)**: performance accepted across the fleet — 3T slow but acceptable (the campaign's floor device; all big animations verified at the 30fps floor there), 5T acceptable, everything higher fine. The 2026-09-06 performance campaign already eliminated the measured sluggishness classes (idle CPU 80.6% → 19.3%, sheet-dismiss/foreground bursts deferred off-path, the 89s freeze fixed by the single-player refactor). The two recorded leftovers are moot or upstream: the per-minute widget label-flip pipeline is statically dead while the widgets flag is OFF, and the phantom ~6-7% Choreographer loop is an upstream RN/Expo/Reanimated artifact (performance progress notes #14). Reopen only with a new device report.

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
- **Performance campaign measurement update (2026-09-06, perf/testing branch,
  3T floor device)**: the sluggishness classes above were measured and
  largely eliminated at the source. Idle CPU 80.6% → **19.3%** (invisible
  animation gating, tick consolidation, overlay unmount→pre-mount, per-second
  render elimination); the sheet-dismiss/foreground bursts now defer widget
  pushes past the paint (the iOS 1.1-1.4s dismiss burst → commit 56ms, push
  ~530ms later off-path); the 89s-freeze class (32-AVPlayer teardown) was
  already fixed by the single-player refactor. All big animations verified at
  the 30fps floor — overlay open/close (first+steady, 60fps cadence,
  vision-verified), sheet entrances (alert was 235/202ms gaps → zero >33ms
  misses), pager swipes (60fps). REMAINING known costs: the per-minute widget
  label-flip pipeline (owner-deferred, unchanged) and a phantom 60fps
  Choreographer loop at idle (~6-7% CPU, fresh-process reproducible, root
  cause narrowed to an eternally-active Reanimated frame callback —
  `ai/features/performance/progress.md` #14). Harness: `e2e/` +
  `ai/RUNBOOK-performance-testing.md`.

### G.7 [CLOSED 2026-09-09 — fix shipped 2026-09-02, header lag] widgetSettingsSync "pushes again for a later change" fires a spurious third push ~1–2% of runs

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

## H. UI bugs (2026-09-09)

### 25. [FIXED 2026-09-09, 1.23.2, fix/sound-preview-first-tap — owner-verified on iPhone XS + OnePlus 3T] Sound-sheet preview: first tap after a clip finishes naturally does nothing (audio + countdown); works on the second tap

- **Symptom (owner, 2026-09-09, sound sheet)**: two repros, same underlying state:
  - **Repro A (same row)**: tap a play icon, let the preview FINISH on its own (do not stop it). The countdown disappears and the icon reverts to play (expected). Tap the same play icon: the press bounce animation fires but nothing plays — no audio, no countdown. Tap a second time: playback starts correctly.
  - **Repro B (different row)**: after a naturally-finished preview, tap a DIFFERENT sound's play icon: the row flashes (selection blip, white then back to dimmed) but does not play. The next tap plays correctly.
  - Manually stopping a playing preview (tap while playing) never shows the bug — only natural completion.
- **Root cause (confirmed by source read of expo-audio 57.0.4 + expo useEvent)**: `useAudioPlayerStatus` builds on expo's `useEvent`, which stores the last event payload in `useState` and never re-initializes when the emitter (player instance) swaps. After natural completion the finished-detector nulls the index, the hook releases the player and creates a null-source player that emits nothing — so the status stays the DEAD player's terminal payload (`playing:false, currentTime≈duration`) indefinitely. The next tap arms a fresh player (play-while-loading queues fine natively), but the finished-detector runs in the same commit against the stale terminal status and instantly nulls the index again, releasing the brand-new player mid-load. Nothing retries. Manual stop and rapid-switch never showed it because their stale statuses (`currentTime < duration` / `playing:true`) accidentally guard the detector.
- **Fix (1.23.2)**, three parts in `components/sheets/screens/Sound.tsx` + `components/sheets/parts/SoundItem.tsx` + `assets/audio/index.ts`:
  1. Finished-detector and countdown both ignore status from a non-current player (`status.id !== player.id` — every status payload carries the player UUID on both platforms). Stale terminal status can never match a future player.
  2. Countdown computes `Math.round(duration - currentTime)` (was floor): clip durations are non-round (19.3-30.0s) and iOS reports a provisional duration before refining it — floor flashed one second low at the start (owner-reported iOS "29 then 30"); round holds the correct value through refinement.
  3. `ATHAN_DURATION_SECONDS` (rounded clip lengths, parallel to `ATHAN_AUDIOS`) stands in until the fresh player reports, so the countdown appears in the SAME frame as the icon/text flip (previously ~50-150ms late: player load latency + a 75ms opacity tween). The countdown's opacity snap replaced the fade (owner-approved after the fade read as desync); its color tween is kept. Known trade-off: the table is build-time metadata — replacing an mp3 without regenerating it drifts the FIRST displayed second until live status takes over (~100ms, cosmetic).
- **Pattern review (same session, resolved)**: research verdict keeps the architecture — expo/expo#43136 confirms recreate-on-source-change is intentional upstream and the stale-status window (`useEvent` holds the old player's payload until the new one emits) is known and unfixed on native in 57.0.4, so the id guards are the canonical defense. `Audio.preload()` (32 warm AVPlayers, still no sync duration) and `AudioPlaylist` (no arbitrary-index jump) are both unfit for the picker, and no Expo/RN API derives duration without a player — the table stays as the same-frame source, now pinned by `shared/__tests__/athanDurations.test.ts` (mp3-duration devDep recomputes every clip's duration from the bytes and asserts the table, so swapped audio without regenerating fails validation).

### 26. [CLOSED 2026-09-09, not reproducible — owner-verified on iPad Pro 11 sim, Pixel Tablet AVD, iPhone XS, OnePlus 3T] Android overlay dims the location/date header that iOS keeps bright; "London, UK" absent entirely on the Android overlay

- **Closure**: the owner checked the overlay header ("London, UK" + date) on both large-screen targets and both physical phones — renders correctly and at full brightness on every owned target. The original sighting was a Pixel 10 emulator Release build during the large-screen evidence review and never reproduced elsewhere; closed without a code change. Original report preserved below.

- **Symptom (owner review, 2026-09-09, Pixel 10 emulator, Release build)**: with the focused-prayer overlay open, iOS renders "London, UK" and the date at their normal home-screen brightness; Android dims the date line to ~47% and does not render "London, UK" at all. The owner expects overlay and non-overlay headers to match on both platforms.
- **Pre-existing**: vision-measured pixel-identical in the baseline (pre-large-screen) captures — the large-screen session neither introduced nor altered it. Reported during that session's evidence review; filed here so it is not lost.
- **Where to look**: the per-element overlay chrome fades (ADR-014) — the Day/location header's fade path and the veil layers on Android (`components/overlay/VeilBackdrop.tsx`, `components/day/Day.tsx`, per-row fade gates); iOS and Android diverge in either the fade wiring or the veil composite over the header band.
- **Verify**: open the overlay on an Android device/emulator, compare header brightness against the closed page and against iOS.

### 27. [OPEN, found 2026-09-10, presentation-rearchitecture session] Prayer list shows only one row for a period after a day-roll cascade instead of the full six

- **Symptom (S23, Android 16, mock data, Release build)**: after the sequence cascades past the final prayer of one day into the next (observed via the mock rig's compressed near-term window), the list briefly renders only the new day's Isha row — Fajr, Sunrise, Dhuhr, Asr, and Magrib are entirely absent, not dimmed or collapsed. The countdown hero and date header are correct and the countdown ticks correctly (confirmed across two captures 5 minutes apart, decrementing by exactly 5 minutes). A fresh cold relaunch (which reseeds the mock) showed the full six-row list correctly; continuing to watch the same process past that point also self-resolved to six rows once the display date advanced further into the new day. Not yet confirmed whether this reproduces on real (non-mock) data or only at the specific moment the display date first rolls over.
- **Where to look**: `components/prayer/List.tsx:33`, `components/prayer/ActiveBackground.tsx:24`, `hooks/usePrayer.ts:36`, and `hooks/useSchedule.ts:35` all independently filter `prayers` to `p.belongsToDate === displayDate`; `displayDate` is the `belongsToDate` of the next future prayer (`stores/schedule.ts:184`). Since only Isha rendered, either `displayDate` was set to a value that only Isha's entry matches, or the other five prayers of the same intended day were computed with a different `belongsToDate` than Isha's. `calculateBelongsToDate` (`shared/prayer.ts:141`) only special-cases Isha before its early-morning cutoff hour, which does not apply here (the observed Isha was at 21:31, not early morning) — the mismatch is not explained by that rule, and is not a mock-authoring artifact either (`mocks/simple.ts` stamps one `date` per whole day-block, so a per-prayer date mismatch in the raw fixture is structurally impossible). Root cause not yet found; likely in how the sequence is built or how `displayDate`/`getNextPrayer` is selected across the cascade, in `stores/schedule.ts`.
- **Out of scope for the presentation-rearchitecture fix** (ai/features/presentation-rearchitecture/): this is a schedule/sequence data-layer question, not a Reanimated/animation-ownership one — flagged here rather than folded into that session's work.
- **Verify**: reproduce on the mock rig by watching a day-roll happen live (or forcing one), screenshot immediately after and once more a few minutes later; separately check whether this reproduces against real API data near a real day boundary.

## I. Revalidation findings (2026-09-11)

### 28. [FIXED 2026-09-11, 1.24.9, revalidation; superseded by #29 in 1.24.12] A fetch on the Saturday before a UK clock change shifted every Midnight/Last Third in that fetch by 20–40 minutes

- **What**: `getMidnightTime`/`getLastThirdOfNight` build Maghrib and Fajr on *today's* date (`parseNightBoundaries`, `shared/time.ts:214-230`: `createLondonDate()` for Maghrib, `addDays(…, 1)` for Fajr), not on the record's own date. `transformApiData` runs once per fetched year, so the whole year is computed in the fetch day's DST context.
- **Evidence** (jest with the system clock pinned, identical inputs Maghrib 17:50 / Fajr 05:40): ordinary day → Midnight 23:45, Last Third 01:43. Run on 2026-10-24 → 00:15 / 01:23 (+30 / −20 min). Run on 2026-03-28 → 23:15 / 02:03 (−30 / +20 min).
- **Impact**: anyone whose data is fetched on one of those two Saturdays (fresh install, the December/January fetch, or any app update — every version increase wipes and refetches) gets every Midnight and Last Third, and their notifications, off by 20–40 minutes until the next refetch. Separately, the two real DST nights each year are always computed without the clock change (a plain wall-clock midpoint), about 30 minutes off for those two nights.
- **Also found**: the same Date-based helpers kept the current seconds and milliseconds (`setHours`/`setMinutes` do not reset them), so for nights whose length is not a whole multiple (odd minutes for Midnight, non-multiples of 3 for Last Third) the stored value came out one minute later whenever the fetch ran late in a minute (67% of Maghrib/Fajr pairs at second 45). They also followed the device's own timezone rules rather than London's.
- **Fix (1.24.9, under the owner's "known local fix, no side effects" authority)**: both helpers compute from the two HH:mm strings alone — wall-clock minutes from Maghrib to the next day's Fajr — so the result no longer depends on when or where the calculation runs. The owner's definition (Midnight = midpoint of today's Maghrib and tomorrow's Fajr) and the documented calculation are unchanged.
- **Verification**: bit-identical to the previous code run at second 0 on an ordinary day for every Maghrib 15:00–22:59 × Fajr 01:00–07:59 pair (201,600 pairs, winter and summer). New tests pin five run instants (ordinary second 0, second 45, summer second 59.9, both DST-eve Saturdays); 4 of 5 failed on the old code and all pass on the new. Values change only where the old code drifted: by one minute for some nights of a fetch that ran late in a minute, and by 20–40 minutes for a fetch on a DST-eve Saturday.
- **Unchanged, owner decision if wanted**: the two real DST nights still use the plain wall-clock midpoint (as every ordinary-day fetch always has); computing them from the true elapsed night would shift those two nights by ~30 minutes.
- **Superseded (1.24.12, #29)**: the string helpers are gone. Night times are exact instants measured from the previous day's Maghrib to this day's Fajr, worked out whenever a list is built, and the clock-change nights use the real elapsed night (the owner asked for it on 2026-09-11).

### 29. [FIXED 2026-09-11, 1.24.12, fix/night-times] The Extras Midnight and Last Third were a night late, and alerts could fire on another night than their row

- **Owner rule (2026-09-11, confirmed after research)**: the Islamic date begins at Maghrib and a night belongs to the day that follows it (the night of Friday runs from Thursday's Maghrib to Friday's Fajr). The night runs from Maghrib to Fajr: Midnight is its midpoint and the Last Third starts two-thirds of the way through. So each night uses the Maghrib that starts it and the Fajr that ends it. ADR-004 already defined prayer Midnight as the "midpoint between yesterday's Magrib and today's Fajr"; the code had drifted from it. Sources: IslamQA 164215; Moonsighting UK; IslamWeb 140781 and fatwa 376972 (Ibn Bāz); Darul Iftaa Birmingham (Hanafi); PrayTimes.
- **What was wrong**:
  - `transformApiData` stored record D's Midnight and Last Third from D's Maghrib and D+1's Fajr — the night *after* D — while the Extras list for D shows them on the night *before* D. On London's real 2026 times: 0–2 minutes off on ordinary days; 30 (Midnight) and 39 (Last Third) minutes off on the night before each clock change, and 20–31 minutes on the clock-change night itself. Friday night 23 Oct 2026 would have shown and fired Midnight at 23:28 instead of 23:58, and Last Third at 01:20 instead of 01:59.
  - The arithmetic was clock-face minutes, so a night that crosses a clock change came out about 30 minutes off in real time (left open in #28; the owner asked for it fixed).
  - Notifications and reminders rebuilt their moment from the record's date plus the stored time on the phone's own clock (`genTriggerDate`: device-local `setHours`), with no day shift. A winter Midnight's alert therefore fired a night after its row (the row sits on the evening before its day); an Isha after 00:00 (none in London's data, but v2.0 goes global) would have fired a day early; the repeated hour on the October night resolved to the first 01:xx; and a phone set to another timezone fired at that timezone's clock time.
- **Fix (1.24.12)**:
  - `getNightTimes` (shared/time.ts) measures the night between real instants — the previous date's Maghrib to this date's Fajr — floored to the minute like every time the app shows. On every night without a clock change it is identical to the old clock-face arithmetic (21,896-pair sweep, GMT and BST).
  - Night times are no longer stored. `createPrayerSequence` hands each day's previous record to `getNightTimesForDay`, so a list always uses its own night, across the year boundary too (the #5 Dec 31 patch is gone). Only the first stored day has no previous record; it borrows its own Maghrib one day earlier. (Superseded in session 3 of the uat-2 queue: nothing is borrowed any more, and those two rows show `--:--`. See AUDIT-FINDINGS finding 72.)
  - One source of truth: notifications and reminders fire at `getPrayerForDate(...).datetime`, the very row the list and countdown show. `genTriggerDate`, `genReminderTriggerDate`, `isPrayerTimeInFuture` and `isNotificationOutdated` are removed.
  - `PRAYER_TIMEZONE` (shared/constants.ts) is the one place the timetable's timezone is named, for v2.0.
  - Nothing else changes: rows, order, when a list switches, Suhoor, Duha, Istijaba and the Standard list. One consequence to know: a winter Midnight alert used to be scheduled a night ahead (on the wrong night); it now looks one night ahead, as Fajr, Suhoor and Last Third already did (2-day rolling window, refreshed on every foreground and by the background task).
- **Tests**: `shared/__tests__/nightTimes.test.ts` checks every list of a real London year (2024, both clock changes) against an independent reference (plain UTC arithmetic and London's clock-change rule), the 2026 clock-change nights and 10–12 Sep from the live API, the year boundary, the fallback, the display order, and that `getPrayerForDate` equals the list row for every prayer on every day. Store and device tests check that alerts fire at the row's instant. Proven to fail on three deliberate breaks: the night starting at the day's own Maghrib (13 failures), clock-face night length (10), and an alert rebuilt from the list date plus the time string (2).
- **Performance**: two extra time calculations per listed day, well under a millisecond per list build.
- **Device check (OnePlus 3T, 1.24.12 production configuration, real 2026 data, Fri 11 Sep 2026 20:09)**: read by an Opus vision agent that was not told the expected values. The Extras page shows Saturday 12 Sep's list, opening with tonight's night: Midnight 00:12 (the old code gave 00:11), Last Third 01:46, Suhoor 04:36, Duha 06:48, countdown "Midnight 4h 2m". The Standard page matches the API (Fajr 04:54 … Isha 20:42). What's New showed once, v1.24.12, with its three items. The owner's alerts are all off on this phone, so no alarm was inspected; an alarm-time check joins the on-demand device checks.
- **Clock-change night verified on the device (OnePlus 3T, 1.24.15 production configuration, real 2026 data, 2026-09-12)**: the fix is now confirmed on the date that matters, without waiting for October. **12 Sep**: Midnight 00:12, Last Third 01:46, Suhoor 04:36, Duha 06:48, Standard Fajr 04:56 … Isha 20:39 — every value matching the API. **24 Oct**: Midnight 23:58, Last Third 01:59. **25 Oct, the night the clocks go back**: Midnight 23:58, **Last Third 01:00** — the decisive value, since that night is 12 h 12 m of real elapsed time against the 11 h 12 m its clock face suggests, and a build measuring on the clock lands near 01:20. All three match the instants pinned in `shared/__tests__/nightTimes.test.ts`, and on each date the countdown, the row and the "ago" badge agreed with one another (e.g. 25 Oct at 06:30 GMT: Sunrise 06:39 → "8m 11s", "Fajr 1h 26m ago" against Fajr 05:04).
- **Method, for whoever repeats it**: `adb shell date` is refused on this non-rooted 3T (`Operation not permitted`, no `su`), so the date is driven through the Settings UI — `settings put global auto_time 0`, `am start -a android.settings.DATE_SETTINGS`, tap Set date, pick the day, OK — and `auto_time` restored to 1 afterwards, which snaps the clock back from the network. Android applies the DST rule itself: at 25 Oct the device clock reports GMT rather than BST, which independently confirms the date landed past the transition. One trap: installing an **older** build over a newer one is a version *decrease*, so `handleAppUpgrade` never fires, the prayer cache is not wiped, and the app keeps showing whatever mock data the previous measurement build left behind — `pm clear` first, or the whole check is meaningless (the same masking described in #21).

### 30. [FIXED 2026-09-11, 1.24.14, fix/year-boundary] On a phone set to another timezone, the app read London's calendar from the phone's own clock

- **What**: "which day is it" came from the phone's timezone in several places: the storage key for a day (`formatDateShort`, `getPrayerByDate`), Friday (`isFriday`, so Istijaba), 1 Jan and December (`isJanuaryFirst`, `isDecember`), the year (`getCurrentYear`, the API year), "yesterday" in the download filter (`isDateYesterdayOrFuture`), the notification window (`genNextXDays`), yesterday's final prayer, the refresh's "tomorrow", the widget start day, and the header and Hijri dates. With the phone in New York the full suite failed 36 tests, in Tokyo 9, at UTC+14 32. `createPrayerDatetime` also resolved the repeated October hour differently by phone timezone: date-fns-tz's helpers rebuild a Date on the phone's own clock and can land an hour off when that clock skips or repeats an hour of its own.
- **Impact**: none on phones set to UK time. For travellers and for v2.0 (global): wrong days, a missing "yesterday" (the Jan 1 crash risk noted in the revalidation), Istijaba on the wrong day, and notification windows a day off.
- **Fix (1.24.14)**: calendar days follow `PRAYER_TIMEZONE`, read by Intl straight from the instant (`readPrayerClock` in shared/time.ts), and travel as YYYY-MM-DD strings (`getTodayDateString`, `addDaysToDateString`, `getDayAnchor`, `Database.getPrayerByDateString`). `createPrayerDatetime` takes the offset from the timezone rules alone: the same answer on every phone, with a repeated hour resolving to its later occurrence and a skipped hour to the new offset, as before. `createLondonDate` is the plain instant and `adjustTime` is pure clock arithmetic. No date-fns-tz call remains in app code. Intl is slow on the phone's JavaScript engine, so offsets are remembered: one pair of reads per UTC day, and a reading per quarter hour on the two clock-change days. A whole day of prayer times costs at most six Intl reads, then none, where the first version of this fix read Intl about three times per row (1.24.15).
- **Tests**: `yarn test:tz` runs the whole suite as if the phone were in New York, Tokyo, UTC+14 and UTC−11, and each passes 997/997 (so does London). Breaking the date key back to the phone's clock fails 8 tests in New York and 34 at UTC+14; the old conversion fails the repeated-hour test in New York. Run `yarn test:tz` before merging anything that touches dates. The remembered offsets are checked against Intl at every quarter hour of 2026 and minute by minute across both clock changes; treating every day as change-free fails those checks.
- **Device check (OnePlus 3T, production configuration, real data, 2026-09-11)**: 1.24.14's Standard and Extras pages matched the calculated values exactly, read by an Opus vision agent that was not told them (Sat 12 Sep: Fajr 04:56 … Isha 20:39; Midnight 00:12, Last Third 01:46, Suhoor 04:36, Duha 06:48). With the phone set to New York time (status bar 3:53) the app still showed London's day, times and countdowns exactly as on London time; the phone's automatic London time was restored and verified afterwards. 1.24.15's prayer rows are pixel-identical to 1.24.14's.
- **Launch time (3T, six cold launches per run, A-B-A)**: 1.24.14 measured about 170 ms slower at the median than 1.24.13 (6,752 vs 6,583 ms, twice). 1.24.15, with remembered offsets, measured 6,606 and 6,660 ms against 1.24.13's 6,680 ms: the regression is gone.

### 31. [FIXED 2026-09-11, 1.24.14, fix/year-boundary] After more than 3 days in the background, the stop-gap list skipped today's remaining prayers

- **What**: on return from the background the countdown resync runs first. When the whole 3-day buffer had passed, `refreshSequence` rebuilt it from *tomorrow*, so today's remaining prayers were missing until `sync()` rebuilt the lists from today. On a normal day that happens at once, but not when the sync has to wait for a download, or fails.
- **Fix (1.24.14)**: `refreshSequence` builds from today when nothing from today on is left in the buffer, and from tomorrow otherwise, which is the unchanged normal case.
- **Tests**: a buffer three days old rebuilds from today; a buffer that still reaches today adds only the days after it. The first fails when the start is forced back to tomorrow.

### 32. [CHARACTERISED 2026-09-12, 1.24.17, perf/launch-time] Cold launch on the 3T is 6.6 s, and 3.1 s of it is the Android ≤9 TLS provider install

- **Measured (production build 1.24.15, OnePlus 3T / Android 9, nine cold launches across three methods)**: `am start -W` TotalTime 6,590 / 6,722 / 6,638 ms. Android's own event log splits it: process bound at ~9 ms, `MainActivity.onCreate` at **3,723–3,759 ms**, onStart + onResume within 11 ms, first frame (`Displayed`) **2,843–2,944 ms** after that. The two halves are stable to a few ms across every run.
- **Attribution (atrace `am wm dalvik view sched res pm`)**: `bindApplication` 3,752 ms, and inside it `OpenDexFilesFromOat` 3,127 ms opening `/data/app/com.google.android.gms-…` — the GMS Dynamite module. The main log corroborates step by step: `DynamiteModule: providerinstaller.dynamite not found` (+27 ms) → ~3.1 s → `NativeCrypto: Registering conscrypt's 336 native methods` (+3,391 ms) → `ProviderInstaller: Installed default security provider GmsCore_OpenSSL` (+3,431 ms) → SoLoader (+3,467 ms, itself only 35 ms).
- **This is `modules/tls13`'s `Tls13InitProvider` (ISSUES #21) and it must stay exactly where it is.** ContentProviders initialize inside `bindApplication`, before `Application.onCreate` — the only point earlier than okhttp's `SSLContext.getDefault()` snapshot. #21 proved installing from JS fixes debug and **fails release**, and that a no-TLS control build could not fetch at all. Making it async would race the snapshot and silently break every real Android 9 user's data fetch. It is already gated to `SDK_INT < Q`, so it costs **nothing on Android 10+**: the 3T's 6.6 s is a floor-device worst case, roughly 3.4 s worse than what a modern phone runs.
- **The app's own JS path (react-native-performance marks, measurement build 1.24.18, mark-to-mark, eight cold launches)**: `launch_native` 80–109 ms; `launch_js_bundle` 103–168 ms; then **bundle end → `perf_monitor_init` 273–353 ms** (early module evaluation), **`perf_monitor_init` → `index_first_render` 856–979 ms** (the rest of the import graph plus the router mount — **the largest addressable JS cost**), and **`index_first_render` → `home_content` 645–737 ms** (React mount). Total bundle end → content 1.62–1.95 s, median ≈ 1.90 s. The marks also bracket the pre-JS window independently of atrace: native end → bundle start is 4,147–4,210 ms on every run, the TLS provider install below. The **synchronous cache bootstrap is only 16–20 ms** (`setSequence` ×2 15–18 ms, `startCountdowns` 1–2 ms, stable across all eight), so the pre-render window is import-graph evaluation, not bootstrap work. The Hermes bundle is 4.4 MB of bytecode and mmap'd, so bundle load is not a cost, and no images ship in `assets/` at all (0 image entries in the APK) — neither parse nor asset decode owns any of the launch.
- **Quote a range, not a run, for bundle end → monitor init**: one launch of the eight measured 25 ms against 273–353 ms for the other seven, unexplained. Bundle end lands in the same place every time; it is `perf_monitor_init` that moves, so the variance is in the module evaluation ahead of it (`@/device/tasks`, `@/device/tls13` — which makes a native `requireNativeModule('Tls13').status()` call — and `@/stores/bootstrap`, whose own cost is steady at 16–20 ms). Three runs were not enough to see this; the first n=3 sample produced a "~352 ms" figure that the wider sample does not support.
- **Do not read `js_to_content` as "monitor init → content"**: despite `app/index.tsx` declaring `perfMeasure('js_to_content', 'perf_monitor_init')`, the emitted measure starts ~29 ms before `index_first_render`, not at the mark — 732 ms against the 1,576 ms that `perf_monitor_init` → `home_content` actually spans. The mark-to-mark spans above are the authoritative split; this measure's name overstates what it covers.
- **Two clocks in the ring, never plot them on one axis**: `ts` is a device-uptime axis (`timeOrigin + startTime`, ~1.86e8 on this device) while `detail.at` — present only on marks replayed from the pre-init buffer — is wall epoch (~1.79e12). Mixing them yields spans of ~1.7e12 ms. Replayed marks are meaningful only via their own `at`-deltas.
- **Compilation state is not the cause of the first half**: forcing `cmd package compile -m speed` cut the launch to 5,885–5,938 ms, and the saving came **entirely** from the post-onResume phase (2,843–2,944 → 2,142–2,193 ms) while the pre-onCreate phase stayed identical to the millisecond. So ~720 ms of the React path is Java JIT warm-up that a Play install recovers on its own, and the TLS phase is I/O-bound rather than CPU-bound.
- **Build shape, for reference**: R8 is off (`android.enableMinifyInReleaseBuilds` is set nowhere; `expo-build-properties` configures iOS only) — 6 dex files, ~54 MB, inside a 141.6 MB four-ABI universal APK.
- **What is actually addressable on every device**: the ~1.9 s between the bundle finishing and content appearing — ~308 ms of module evaluation plus the synchronous cache bootstrap (`stores/bootstrap.ts` runs at import time, so it lands *before* `initPerfMonitor()` and is invisible to the current marks), then ~748 ms of React mount to `home_content`. Finer marks are needed to split those; that is task 13's starting point.
- **Task 13's first change, measured and reverted (1.24.23 → 1.24.24)**: deferring `index.tsx`'s five settling-window imports into the 1,500 ms timeout moved nothing. A/B on the 3T, identical marks, both sides at install-time dexopt (`speed-profile`, not the forced `speed` AOT): `perf_monitor_init` → `index_module` was 891/936/944 ms before (median 936) against 910/886/909 ms after (median 909), inside a before-set spanning 53 ms on its own; totals agreed (1,740–1,912 ms against 1,883–1,933 ms). Predicted from the static graph beforehand and confirmed: only `device/backgroundTaskDebug`, `device/listeners` and `device/updates` have no other static importer, while `stores/notifications` stays reachable through `stores/version` and `hooks/useNotification` — both needed during render — and `shared/notifications` arrives behind it. Reverted rather than keep `require()` indirection that buys nothing. The `index_module` mark also shows React needs only **1–3 ms** to get from module body to first render, so the ~900 ms is expo-router bootstrap plus the core import graph, not anything `index.tsx` controls.
- **Measurement gotchas hit while doing this** (both produced false negatives before being caught): this shell's `ls` emits ANSI colour codes, so capturing a path with `$(ls -t …)` yields an unusable filename and shifts `awk` column indexes — use literal paths or `command ls`; and `strings` cannot see Hermes string literals (they live in a packed table), so grepping a bundle for a compiled-in flag proves nothing.

### 33. [FIXED 2026-09-12, 1.24.28, refactor/tidy-ups] A test that failed about one run in sixty, and the pattern behind it

- **Symptom**: `stores/__tests__/widgetIo.test.ts › label-flip re-push scheduler › re-pushes every minute for far-out prayers too` failed a pre-commit hook with "Expected length: 2, Received length: 1", when `yarn validate` on the same working tree had passed 1005/1005 moments before. An earlier failure in the same session (1 failed, 999 passed) went unidentified because that run was piped to `tail -6`, which hid the name — this repo's own pipe-to-tail lesson, relearned the hard way.
- **Root cause**: the suite's `beforeEach` called a bare `jest.useFakeTimers()`, which seeds the fake clock from the real one. A re-push lands on a minute boundary, so the next flip is `60 − s` seconds away, where `s` is whatever second-within-the-minute the run happened to start at. The test advanced exactly 59 s and expected the flip to have happened, which only holds when `s ≥ 1` — so roughly one run in sixty fails. Its sibling test advances `60 s + 300 ms`, so the boundary problem had been met on that test and not this one.
- **Fix (1.24.28)**: the clock is pinned — `jest.useFakeTimers({ now: new Date('2026-09-12T10:30:00.000Z') })` — and the advance goes just past the minute. Copying the sibling's cushion alone would **not** have been enough: from an unpinned clock a 60.3 s advance catches *two* flips whenever `s ≥ 59.7`, which moves the failure window rather than closing it. Pinning removes the dependency entirely. 0/30 failures on the suite alone, 3/3 clean full runs, after.
- **Recorded, deliberately not changed**: three suites pair a real-clock-seeded `useFakeTimers()` with `advanceTimersByTime` — `stores/__tests__/widgetSettingsSync.test.ts` (11 advances), `stores/__tests__/countdown.test.ts` (14) and `device/__tests__/backgroundTaskDebug.test.ts` (3). They pass today, and the countdown ticker deliberately aligns itself to wall seconds so its tests may already compensate; rewriting working suites on suspicion is not warranted. The repo already sidesteps the trap in two places: `widgetFlagOff` uses `doNotFake: ['Date']` and `shared/__tests__/time.test.ts` uses `setSystemTime(...)`.
- **Related finding (for the code audit)**: four of the six files in `hooks/__tests__/` never exercise the hook they are named for. `usePrayerAgo`, `useCountdownBar` and `usePrayerSequence` each define a local re-implementation — "Mirrors the … from the hook" — and assert the copy, so they would pass with the hook deleted; `useCountdown.test.ts` tests `getSecondsBetween` from `shared/time` instead. `useAnimation` and `useNotification` **do** load their modules, through deferred `require` inside the test body, which is why a naive top-level import grep reports a false negative on them — and on the four store tests that use the same idiom. There is no renderer in the dependency tree, which is why the pattern exists at all; the answer is to export the pure part and test that, as `usePrayerAgo` now does (1.24.28) and as `components/overlay/catcherGeometry.ts` and `components/countdown/tipGeometry.ts` already do.

### 34. [FIXED 2026-09-12, 1.24.31, fix/notifications-survive-upgrade] An app update cancelled every armed alert, then stayed quiet for twelve hours

- **Symptom**: after the app updated itself, prayer alerts stopped firing while the alert preferences still read ON. Reproduced on the 3T: installing 1.24.29 over 1.24.15 left Fajr enabled (speaker icon present) with **zero alarms armed**. Android only — iOS notifications survive an update by platform design (#8). It matters most exactly when it is least visible: stores update apps in the background, so the first sign is a prayer that passes in silence.
- **Root cause**, three things compounding: (1) `clearUpgradeCache` wipes `scheduled_notifications_*` — they are not in `UPGRADE_KEEP_PREFIXES` — along with the prayer cache. Seen on-device: `MMKV DELETE: scheduled_notifications_standard_0_athan_standard_fajr_2026-09-13` beside `MMKV KEPT: [preference_alert_standard_fajr, …]`. (2) Android's `MY_PACKAGE_REPLACED` receiver has expo-notifications restore the real alarms, so the OS holds entries the app no longer has records for — and `findStaleScheduledNotificationIds(osIds, [])` returns **every** id (pinned by `notifications.test.ts:475`), so the sweep cancels precisely what was just restored. (3) `refreshNotifications` stamped `lastNotificationScheduleAtom` unconditionally, closing the 12-hour gate over the silence. `clearUpgradeCache`'s own comment — "This ensures old OS-level notifications are cancelled after upgrade" — shows the cancellation was deliberate intent rather than an oversight. It is the wrong intent for an alarm clock.
- **The race that decides whether it bites**: `sync()` calls `handleAppUpgrade()` first (`sync.ts:242`), so the wipe lands before `updatePrayerData()` is even attempted, while `refreshNotifications` fires ~1.5 s after first content from `app/index.tsx:90`. Against the mock API (51 ms) the refetch always wins and the bug never appears; against the real API on the 3T (cold `Displayed … +6s207ms`) the refresh always loses. **A device test on a non-prod build cannot reproduce this** — see the process note below.
- **Fix (1.24.31)**, three guards in `stores/notifications.ts`: `_rescheduleAllNotifications` bails, returning `false`, when `Database.getPrayerByDate(TimeUtils.createInstant())` is empty — before scheduling and before the sweep; the sweep refuses to cancel when it holds no records but the OS has entries, because an empty record set means "we don't know", not "nothing should exist"; and `refreshNotifications` plus `rescheduleAllNotificationsFromBackground` stamp the gate only when a reschedule actually ran, so a bail retries on the next foreground instead of locking in silence.
- **Device proof (3T 8f7ada76, prod build, real data)**: upgrading 1.24.31 → 1.24.32 with an alert armed at **04:03** left that alarm untouched through the upgrade, and a relaunch moved it to the correct real-data Fajr **04:57** (ground truth from the pre-contamination 1.24.29 run: 13 Sep 04:57, 11 Sep 04:49). The 04:03 value is what makes this decisive — it cannot be re-derived from real data, so it could only have come from the pre-upgrade schedule. Its survival proves nothing rescheduled it; its presence proves nothing cancelled it; and the unstamped gate is what let the next launch correct it.
- **Offline proof (same device, same day, race eliminated)**: with wifi and data switched off and unreachability confirmed, upgrading 1.24.32 → 1.24.33 left the alert armed at **04:57 before the install, 04:57 after the install, and 04:57 after opening the app against a wiped cache**. Unchanged, not merely present: with no prayer data the app cannot re-derive that time, so an identical value means nothing touched it. This is the "updated overnight, opened with no signal" case, and it is the version of the test that does not depend on winning or losing a race. Script kept at `e2e/`-style form in the session scratchpad; it aborts rather than reporting a pass if nothing is armed to begin with, if the network is still reachable, or if the install does not report `Success`.
- **Follow-up (1.24.33, same branch) — the wipe now fires only on a cache *schema* change.** The guards above stop an update destroying alerts, but they leave the deeper oddity in place: every version bump cleared the prayer cache and the bookkeeping, and that clearing is what created the dangerous window in the first place. The wipe exists for **schema drift** — data written in an old shape, read by new code, producing a wrong prayer time — which happens on roughly one release in twenty. `stores/version.ts` now carries `CACHE_SCHEMA_VERSION`, bumped deliberately and only when the cached shape changes, and `handleAppUpgrade` asks two separate questions instead of one conflated one: an app-version change still forces a reschedule (new code may schedule differently), while the cache is cleared only when `upgraded && cacheSchemaChanged()`. A missing marker counts as changed, so existing users pay exactly one wipe and never another for an ordinary release. Same-version relaunch and downgrade still never wipe — that was already pinned, and re-reading those tests is what caught an earlier draft of this design that would have wiped on **every relaunch** for anyone without the marker. Also fixes the offline case in its own right: update overnight, open the app with no signal, and the timetable is now still there. Note the tests would have passed without any new coverage — no existing case exercised "upgrade with a matching schema" — so the behaviour change is pinned by three tests added for it, including one asserting the wipe **still** fires on a differing schema, so the protection cannot be silently disabled.
- **Deliberately not done**: adding `scheduled_notifications_` to `UPGRADE_KEEP_PREFIXES`. Preserved records from an older identifier scheme would let old-scheme alarms live on beside new-scheme ones — duplicate alerts for one prayer, which is the thing the sweep exists to prevent.
- **Trade-off, pinned by test**: with prayer data present and every alert off, records are legitimately empty, so a genuine stray is now left armed. A stray alert is a smaller harm than losing every alert after an update, and the per-prayer paths already cancel on switch-off, so the OS set should be empty in that case anyway.
- **Process lessons — both were already gotchas in `e2e/README.md`, re-run the expensive way because the list was not read first**: a non-prod build serves `MOCK_DATA_SIMPLE` and writes mock times into the device's own cache, outliving the build that caused it (the tell is `fajr: addMinutes(-3)`, so a "Fajr" three minutes before the clock is the mock, not a bug); and gradle marks the bundle task UP-TO-DATE on env-only changes, so restarting the daemon is **not** sufficient (correcting AGENTS.md:774) — delete `index.android.bundle` and verify by md5, because `assets/app.config` regenerates independently and a correct `versionName` proves nothing about the JavaScript inside. Both entries have been generalised in `e2e/README.md`.

---

## J. Release distribution & the update prompt (2026-09-12)

### 35. [OPEN, needs its own session] The update prompt depends on a hand-edited file on GitHub, and one failed fetch costs a whole day's check

Raised by the owner on 2026-09-12, during the upgrade-research session: *"I really don't
like having to manually update the releases.json after releasing to the store... if I have
like a million users it's not scalable... does the app break if GitHub errors?"* Researched
read-only, no code changed. This entry records the findings so the decision session does
not start cold.

**How it works today.** `device/updates.ts` fetches a store version once per 24 hours
(`TIME_CONSTANTS.ONE_DAY_MS`, throttled through `getPopupUpdateLastCheck`), compares it to
`Constants.expoConfig.version` with `isNewerVersion` from `shared/versionUtils.ts`, and
sets `popupUpdateEnabled`. Two sources feed it:

- **Production iOS**: `https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb`.
  Fully automatic already. No manual step exists on this path.
- **Everything else** (production Android, UAT iOS, UAT Android):
  `https://raw.githubusercontent.com/capt-muji/rn.athan.uk/main/releases.json`, hand-edited
  on `main` after each store release.

It is called fire-and-forget from `app/index.tsx:101`, inside a `setTimeout(..., 1500)`:
`checkForUpdates().then((hasUpdate) => setPopupUpdateEnabled(hasUpdate))`.

**Question 1: does the app break if GitHub errors? No.** `getStoreVersion()` wraps both
fetches in `try/catch` and returns `false` on any failure, including a 429, a 404, a DNS
failure and malformed JSON. `checkForUpdates()` returns `false` when the store version is
falsy, and it is never awaited on the render path. A GitHub outage produces no popup and no
other symptom. That part of the design is sound.

**Two real defects found while confirming that**, both small, both in `device/updates.ts`:

1. **A failed check burns the 24-hour window.** The `finally` block runs
   `setPopupUpdateLastCheck(now)` unconditionally, so a fetch that threw is recorded as a
   check that happened. A user who launches the app with no signal, which this app is
   explicitly designed to support offline, silently loses that day's check. The stamp
   belongs on the success path, or the throttle needs a shorter retry interval after a
   failure.
2. **Neither fetch has a timeout or an `AbortController`.** A hung connection leaves a
   pending promise for the life of the process. Harmless in practice because nothing awaits
   it, but it means the check neither resolves nor retries within the day.

A third, lower: `openStore()` uses `market://details?id=...` on Android with no
`https://play.google.com/...` fallback. On a device without the Play client,
`Linking.openURL` throws and the failure is only logged, so the button does nothing.

**Question 2: scale and rate limits.** GitHub announced on 2025-05-08 that unauthenticated
rate limits now cover `raw.githubusercontent.com` downloads, and does not publish a number
for raw. The limits are IP-based and abuse-triggered rather than a documented quota. The
shape of the exposure is not what it first looks like: each phone is its own IP making at
most one request per 24 hours, so a million users is a million IPs at one request a day,
not a million requests from one source. The real objections are different and still
decisive:

- `raw.githubusercontent.com` carries no SLA and is not intended as a configuration CDN.
- The limit is IP-based, so users behind carrier-grade NAT share one bucket.
- A file on `main` is a deploy channel with no staging, no rollback and no review gate.
- It is a manual step after every release, which is the failure mode the owner actually
  cares about: forget it and nobody is ever prompted.

**Question 3: can it read the stores directly? Per platform.**

| Channel | Automatic today? | Best available approach |
|---|---|---|
| Production iOS | **Yes** | Already on iTunes Lookup. Two improvements: drop the hard-coded `country=gb`, since a user in another storefront gets a wrong or empty result, and note the listing can lag a release by hours |
| Production Android | No | **Google Play In-App Updates.** Google removed the public "latest version" API deliberately; the sanctioned replacement asks Play itself. It supports a flexible or an immediate flow entirely in-app, with no store redirect. `expo-in-app-updates` (0.12.0, peer `expo: "*"`) wraps it with a config plugin and exposes `checkForUpdate()`, `startUpdate()`, `checkAndStartUpdate()` and update listeners. It also covers iOS by wrapping the same iTunes Search lookup |
| UAT iOS (TestFlight) | No | **No public API exists.** A hosted JSON is the only option |
| UAT Android (internal test) | No | **No public API exists.** Internal-test versions are not publicly queryable |

**Recommended shape**, for the decision session to accept or reject: move production
Android onto Play In-App Updates, keep production iOS on iTunes Lookup, and let
`releases.json` survive as a **testers-only** file. That removes the manual step from every
production release, which is the owner's actual complaint, and it collapses the scale
question entirely, because the remaining consumers are a handful of testers rather than the
whole user base.

**Known constraint on verifying it**: Play In-App Updates only works for builds installed
from Play. A side-loaded `fleettest` APK on the 3T cannot exercise it, so acceptance needs
an internal-test-track install.

**Not done this session.** Session 1 of the upgrades programme is research-only and adds no
dependency. `expo-in-app-updates` is a new native dependency on the release path and
deserves its own session with its own device verification.
