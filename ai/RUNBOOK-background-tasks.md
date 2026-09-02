# Runbook — Background Task & Notification Scheduling (iOS ✅ / Android ⏳)

**Purpose:** replicate the 2026-09-02 iOS deep-dive on any device, any session,
with zero re-discovery. Read §1 (status), then run §4 (resume protocol).
Companion docs: ISSUES.md #8 (root cause + evidence), ADR-007 (architecture),
AGENTS.md "Recent Decisions" 2026-09-02 (lessons).

---

## 1. STATUS TRACKER (update after every session)

### iOS — COMPLETE 2026-09-02 (iPhone XS, iOS 18.7.10)

| Scenario | Build | Result | Evidence |
|---|---|---|---|
| Simulated trigger ×3 | dev 1.17.10 | ✅ 3/3 clean, 1.3–2.0s | Metro start.log |
| Natural fire — foreground | dev | ✅ +14s, +0s after due (2×) | dasd Submitted 20:50/21:06 |
| Natural fire — backgrounded | dev | ✅ +36s after due | dasd 21:21:35 |
| Natural fire — headless cold-launch (process killed) | RELEASE | ✅ fired at due, resubmit exact +15:00 | dasd 21:59:25→22:14:25 |
| Natural fire — foreground | RELEASE | ✅ +58s after due | dasd 22:53:59→23:08:59 |
| Reboot survival (locked, no passcode) | RELEASE | ✅ app relaunched headlessly ~11min post-boot, re-armed exact +15:00 | dasd 22:29:50/22:30:04/22:34:28 |
| Sustained cadence 15-min | dev+RELEASE | ✅ chain self-perpetuates; ⚠️ dasd rate-limits after ~4 rapid runs ("group is full", recovers) | overnight.log |
| User force-quit | — | ❌ not remotely testable (Apple disables bg relaunch until next open; platform rule). Recovery: 2-day buffer + next-open refresh | docs |
| Rate limit | RELEASE | ⚠️ sub-hour intervals unsustainable; 180-min ship value far under budget | dasd skips 21:35–21:59 |
| Config persistence | RELEASE | ✅ task registration survives app updates (upgrade install) | EXTaskService restore 21:43 |
| Object-level proof | RELEASE | ✅ `submitTaskRequest: <BGProcessingTaskRequest: … earliestBeginDate: +15:00, requiresExternalPower=0, requiresNetworkConnectivity=1>` | overnight.log 22:38:01 |

**iOS resting state:** Release 1.17.10 preview build (15-min interval, bgDebug on)
installed on the XS; overnight filtered syslog capture at
`/tmp/opencode/bg/overnight.log` (recreate via §5.4). Ship config = 180 min,
verified in code + arithmetic; no further iOS work pending except
(optional) owner force-quit test + morning soak review.

### Android — PENDING (fix already shipped in 1.17.10, needs device verification)

| # | Device / OS skin | Status | Notes |
|---|---|---|---|
| 1 | OnePlus 5T (Android ≤10) | ⏳ not started | `SDK_INT < S` → always exact alarms |
| 2 | OnePlus 8T (ColorOS 13+) | ⏳ not started | ISSUES #10 primary suspect |
| 3 | Oppo Find X8 (ColorOS) | ⏳ not started | ISSUES #10 |
| 4 | Samsung (OneUI) | ⏳ not started | |
| 5 | (Android 14/15/16 spare) | ⏳ not started | |

**Android-first-actions on each device (before anything else):**
ISSUES #14 adb ground-truth checklist —
`adb shell dumpsys package com.mugtaba.athan | grep -i -A2 EXACT` (runtime exact-alarm grant)
+ `adb shell dumpsys deviceidle whitelist | grep mugtaba` (power allowlist).

---

## 2. THE FIX UNDER TEST (shipped 1.17.10 — same on both platforms)

1. `minimumInterval` is **MINUTES** (expo-background-task docs; iOS ×60 for
   earliestBeginDate; Android `Duration.ofMinutes`). We passed 10800 SECONDS
   = 7.5 DAYS on both platforms. Now: `BACKGROUND_TASK_INTERVAL_MINUTES`
   (shared/constants.ts) — env `EXPO_PUBLIC_BG_INTERVAL_MINUTES` → dev 15 → prod 180.
2. `registerBackgroundTask` (stores/notifications.ts) ALWAYS unregisters-then-
   registers — persisted options can never go stale (self-heals old installs).
3. Task body (`rescheduleAllNotificationsFromBackground`) awaits `sync()` first
   (year-boundary guard, best-effort — reschedule proceeds from cache on failure).
4. Behavior is UNCHANGED for the user (identical UI/UX, sounds, schedules);
   the previously-broken promise (notifications rolling forever unattended)
   now actually holds.

## 3. BUILD & FLAG MATRIX

| Build | Command | Interval | Notes |
|---|---|---|---|
| Dev (JS via Metro) | `yarn start` + installed dev build | 15 (dev default) | CANNOT run headless bg tasks (Metro trap) — foreground/simulate testing only |
| Release @ rung N | eas.json preview profile + `"env": {"EXPO_PUBLIC_BG_INTERVAL_MINUTES": "N", "EXPO_PUBLIC_BG_DEBUG": "1"}` then `npx eas-cli build --profile preview --platform ios --no-wait` | N | embedded JS — REQUIRED for headless/natural-fire scenarios; revert eas.json after kick |
| Ship config | preview profile, NO env | 180 | final resting artifact |
| Android dev/release | `eas build --profile development|preview --platform android` | same constants | install via `adb install -r <apk>` |

Env vars are baked at bundle time — each interval rung needs its own build
(iOS) / Metro restart (dev). Verify the rung landed via the diagnostics
snapshot log (`persistedOptions.minimumInterval`).

## 4. RESUME PROTOCOL (fresh session)

1. Read this file §1 + ISSUES.md #8.
2. Tools check (mac): `xcrun devicectl list devices` (iOS),
   `adb devices` (Android), `/tmp/opencode/bg/pymd3-venv/bin/pymobiledevice3 version`.
   If venv gone: `python3 -m venv /tmp/opencode/bg/pymd3-venv && …/bin/pip install pymobiledevice3`.
3. iOS log channel: `…/pymobiledevice3 syslog live | grep --line-buffered -iE "expo.modules.backgroundtask|Athan\{React\}|group is full|Prewarm"`
   (idevicesyslog is DEAD on iOS 18 — do not use).
   Android log channel: `adb -s <serial> logcat -v time | grep --line-buffered -iE "backgroundtask|WorkManager|expo|AlarmManager"`
4. App control (iOS): `xcrun devicectl device process launch|info processes|terminate --device <UDID>`;
   terminate needs `--pid <pid> --kill` (get pid from `info processes`).
5. Debug snapshots (bgDebug builds): per-launch log line
   `BACKGROUND_TASK_DEBUG: launch snapshot {persistedOptions, pendingNotifications, …}`.
6. Simulate a trigger (dev builds only — native fatalError on release):
   auto-armed 8s after each launch by `device/backgroundTaskDebug.ts`.
7. Confirm the native request object (iOS): grep syslog for `submitTaskRequest:`
   — prints earliestBeginDate/constraints verbatim.

## 5. SCENARIO PROCEDURES (repeat verbatim per device)

Register fresh (launch app once) → note the `submitTaskRequest`/dasd submit
time T. Due = T + interval. NEVER relaunch the app mid-window (relaunch
re-arms +interval and resets the observation).

**A. Foreground** — app open, screen on, do nothing; watch for fire ≥ due.
**B. Backgrounded** — iOS: launch another app via devicectl (`com.apple.mobilesafari`);
   Android: `adb shell input keyevent KEYCODE_HOME`. Watch for fire ≥ due.
**C. Headless cold-launch** — kill the app (iOS devicectl terminate; Android
   `adb shell am force-stop com.mugtaba.athan` — NOTE: force-stop on Android
   ≈ user force-quit semantics for WorkManager: it marks the app stopped until
   manually opened — for a "process death" simulation use
   `adb shell am kill` (kills background process only) instead). Watch fire at
   due: system must relaunch the app headlessly and run the task. Dev builds
   CANNOT do this (Metro trap) — Release builds only.
**D. User force-quit** — needs hands: swipe-kill the app (iOS) / Recents-dismiss
   or `am force-stop` (Android). Expected: NO background relaunch until next
   manual open (both platforms document this). Verify notifications still fire
   from the existing 2-day set; verify recovery on next open.
**E. Reboot** — iOS: `xcrun devicectl device reboot --device <UDID>`;
   Android: `adb -s <serial> reboot`. Watch post-boot: chain must re-arm
   (WorkManager + BOOT_COMPLETED receiver make Android persistence native;
   iOS verified empirically 2026-09-02 — request survived, app relaunched
   headlessly ~11 min post-boot while locked).
**F. Sustained cadence** — leave the device ≥2h; count fires vs windows;
   iOS expects dasd rate-limit deferrals at sub-hour intervals (they recover).
**G. Rate-limit probe (iOS)** — hammer the trigger 4–5× rapidly, then watch
   `group is full` deferrals and recovery latency. Informs the floor for the
   interval; 180 min is the chosen ship value.

**Pass criteria (all devices):** A/B/C/E fire within minutes of due and re-arm
at exactly +interval (iOS dasd `Submitted:` window / Android: WorkManager
`Enqueuing worker … 'N' minutes delay` + next enqueue after run); F sustains;
D degrades gracefully to the 2-day buffer and recovers on open.

## 6. MULTI-DEVICE PARALLELISM

- Yes: `adb` multiplexes arbitrarily many devices — every command takes
  `-s <serial>` (from `adb devices`). Run one logcat + one poll loop per
  device in background files: `/tmp/opencode/bg/<name>-logcat.log`.
- iOS equally supports several via distinct CoreDevice UDIDs in devicectl.
- The wait walls (§5 windows) run CONCURRENTLY across devices — register all
  devices first, then watch all windows in parallel loops. 5 devices ≈ same
  wall-clock as 1.
- Per-device state lives in §1 table; update it as each scenario lands.

## 7. iOS-SPECIFIC GOTCHAS (learned 2026-09-02, do not relearn)

- Dev builds cannot cold-load JS headlessly (dev-client launcher needs UI) —
  natural-fire/kill tests REQUIRE Release builds (embedded bundle).
- `triggerTaskWorkerForTestingAsync` exists in DEBUG only; calling it on a
  release build = native fatalError. The debug module gates it on __DEV__.
- Known upstream trap expo/expo#44540 ("Could not find TaskService module")
  when simulating too early after boot — trigger after full app init.
- `getStatusAsync()` never reports Restricted for Background App Refresh
  disabled (#48786) — check Settings → General → Background App Refresh manually.
- Low Power Mode suppresses processing tasks; dasd logs show `LPM state`.
- EAS dev builds embed a build-machine bundle URL — headless launches can't
  reach Metro. Local `expo run:ios` needs local signing (not set up on this
  Mac as of 2026-09-02 — EAS is the build path).
- jest moduleNameMapper: specific `^@/…$` mocks MUST precede `^@/(.*)$`
  catch-all (logger's entry was silently shadowed — fixed 2026-09-02).

## 8. ANDROID-SPECIFIC BRIEF (from source, pre-verified)

- Same unit fix applies (BackgroundTaskScheduler.kt reads minutes:
  `setInitialDelay(Duration.ofMinutes(N))` + `TimeUnit.MINUTES` periodic).
- Upstream constraints: `NetworkType.CONNECTED` (never runs offline — our task
  is offline-capable), inForeground skip (defers +60 min while foregrounded),
  self-rescheduling OneTimeWorkRequest (Android 8+) keeps the chain alive.
- Persistence: WorkManager survives reboot/process death natively; expo-
  notifications ships a BOOT_COMPLETED receiver that re-registers triggers.
- Exactness (ISSUES #10/#12/#13/#14): silent inexact fallback confirmed still
  present in installed 57.0.15 (ExpoSchedulingDelegate.kt:106-114). Run the
  §1 ground-truth dumpsys checklist FIRST on every ColorOS device.
- adb WorkManager introspection:
  `adb shell dumpsys jobscheduler | grep -A5 mugtaba` and
  `adb shell am dumpheap` not needed — prefer logcat tag
  `expo.modules.backgroundtask` + `WM-WorkerWrapper`.

## 9. UPSTREAM TRACKING

- expo/expo#48786 — getStatusAsync blind to Background App Refresh (accepted).
- expo/expo#44540 — simulate-trigger TaskService race (known trap).
- `requiresNetworkConnectivity=true` hardcoded — candidate upstream PR
  (would remove needless offline deferral; our task is offline-capable).
  Owner decision 2026-09-02: accept + document, no patch-package.
