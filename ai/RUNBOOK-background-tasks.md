# Runbook — Background Task & Notification Scheduling (iOS ✅ / Android ⏳)

**Purpose:** replicate the 2026-09-02 iOS deep-dive on any device, any session,
with zero re-discovery. Read §1 (status), then run §4 (resume protocol).
Companion docs: ISSUES.md #8 (root cause + evidence), ADR-007 (architecture),
AGENTS.md "Recent Decisions" 2026-09-02 (lessons).

**Pending EAS artifacts — RESOLVED 2026-09-03 (line kept for history):** Android 15-min rung build `2f6e9948` was CANCELED (superseded by the local build installed on all four); iOS ship-config build `f00cd1ff` FINISHED — its IPA **is** `~/bg-evidence/athan-1.18.1-ship360.ipa`, installed on the XS at 01:18, soak live. No EAS artifacts outstanding.

**⏸ SESSION-END RESUME POINT #3 (2026-09-03 ~07:2x — read this first in the next session):**

## DONE this session (evidence in ~/bg-evidence/scenario-d.log + below)
1. **BARE-EXPO EXPERIMENT ✓ — THE DECISIVE RESULT (owner-requested; bottom-up methodology: level 0 raw SDK ✅ → level 1 bare expo → level 100 full app).**
   A blank `create-expo-app --template blank-typescript` (SDK 57.0.19) + `expo-notifications` 57.0.16 ONLY, ~10 lines (permissions → channel `bare` → ONE DATE trigger +10 min), package `com.muji.bareexpo`, local EAS build (~2 min on warm caches). Sources: `/tmp/opencode/bg/bare-expo/`; APK preserved `~/bg-evidence/bareexpo-level1.apk`.
   - **Storage matrix (dumpsys alarm, fresh schedule, exact path ACTIVE — 8T SCHEDULE_EXACT_ALARM granted, F8 USE_EXACT_ALARM granted, 3T/5T SDK<S):** 8T `window=+7m29s985ms flags=0x4` **WINDOWED**; F8 `window=+7m29s990ms flags=0x4` **WINDOWED**; 3T/5T `window=0 flags=0x5` EXACT — **identical to the full app on all four (4/4 correlation). OUR APP IS EXONERATED; the windowing is an expo-notifications↔OEM interplay that applies to ANY expo app.**
   - **Delivery deltas when it fired:** 3T +1ms / 5T +0ms (alarm trigger vs due) vs **8T +14.2s, F8 +27.8s** (frozen process unfrozen by dispatch — same signature as the full app). Windowed storage = seconds-late delivery even for a single-notification minimal app in favorable conditions.
   - PR #49687 body UPDATED with this as the minimal reproducer (+ corrected an unverified `flags=0x9` claim to the load-bearing `window=0`). PR still OPEN, no human review yet.
   - NOTE: window display shrinks toward due (nominal +1h at distance → +7m30s at 10-min distance); `policyWhenElapsed` carries the policy detail.
2. **SCENARIO D ✓ (all four, deliberate force-stop 06:46:19):** chain dies (job gone ✓) AND — the real finding — **force-stop CANCELS ALL scheduled notification alarms** (alarm registry 0 bgtest entries on all four; zero dispatches in the 07:04/07:07 windows where 8T/F8/3T alarms were pre-stop pending). **The 2-day buffer does NOT survive force-stop on Android** — platform divergence from iOS (pending UNNotificationRequests survive force-quit there). Recovery verified: relaunch all four → fresh WorkManager registration (job #16→18 / #14→16 / #14→17 / #17→18) + full alarm reschedule from persisted triggers. So D degrades to "no buffer until next open" — recovery is the same self-heal.
3. **iOS ship-soak first-window review (07:18:46 due):** NO fire at due — app (pid 3041) foreground continuously since ≤03:52 (owner's phone in active use, widget churn visible in log). dasd defers processing tasks for foregrounded apps → expected, not a failure; no recent resubmission (due stands from the 01:18:46 registration). **Next review: after the app backgrounds (tonight/later today).** Soak capture live (`ship-soak2.log`, ~115MB and growing).
4. barealarm APKs copied to `~/bg-evidence/com.muji.barealarm{,36}.apk` ✓ (was "do first" item).

## Scenario E results (2026-09-03 07:39–07:53 — reboot ×1 fleet-wide, ×2 on 8T; app NEVER opened post-boot)
- **3T ✓ / 5T ✓ / F8 ✓ — chain survives reboot (chain-only — see #20 below).** Post-boot
  headless fires at due ~07:39:45: 3T +0.7s, 5T +0.4s (both headless cold-launches; task
  REGISTERED + Executed). Notification alarms re-armed via BOOT_COMPLETED on all three
  (22/22/12).
  **⚠️ SUPERSEDED "dev-build only" CAVEAT — the post-reboot headless task-body hang is
  ALL-ANDROID, 4/4 devices (ISSUES #20):** every post-reboot cycle fires → `No task
  registered for key expo-task-manager` at +2s → JS silence for exactly 10:00.000 → goAsync
  `CancellationException` → re-enqueue. F8 (08:46 capture on the 8T too) included — the
  earlier "F8 completed FULL normal cycles" read was actually the same cancel→re-arm loop
  (job-counter growth does NOT prove task success). Chain self-perpetuates; task body
  (sync + reschedule) NEVER runs post-reboot → buffers drain to 0 within ~2 days of a
  reboot without an app open (3T/5T observed flat-0 for 60+ min). Warm-process and
  process-death (no reboot) headless runs COMPLETE fine — the hang is specific to the
  post-REBOOT headless context. Upstream candidate: expo-background-task/task-manager
  headless registration after reboot restore.
- **8T ✗ — OxygenOS 12 blocks boot re-arm entirely (ISSUES #19).** Both reboots: job GONE +
  0 notification alarms despite boot_completed=1, receivers registered (BOOT_COMPLETED/REBOOT/
  QUICKBOOT_POWERON + NOTIFICATION_EVENT in manifest), and a live job #21 + 28 alarms at
  reboot #2. Manual BOOT_COMPLETED = protected broadcast (SecurityException) — delivery to
  this package simply never happens (OnePlus auto-launch management suspected; sideloaded app
  defaults OFF). Self-heal on open verified (job #21 + 28 alarms from one launch).
  Owner-facing: an 8T-class user loses ALL notifications on every reboot until next app open.
- **8T USB lesson (repeated):** after EVERY reboot the 8T failed to re-enumerate on adb
  (charge-only USB default / RSA flap). Fixes that worked: owner replug + USB-mode → File
  Transfer, or USB-debugging off/on. Expect it every 8T reboot; the other three phones are stable.

## PENDING (next session, in order)
1. **PR #49687 — @vonovak ran `/verify`; ALL THREE defects fixed + HARDWARE-VERIFIED
   (2026-09-03 session)**: `5453e21` (non-null showIntent, SDK_INT guard, pinned DateTrigger
   SUID) then `8c0eecb` (extension to daily/weekly/monthly/yearly, measured SUIDs). On-device:
   alarmClock arms store `window=0 flags=0x9` on 8T+F8 (plain siblings windowed); F8 +0ms vs
   +12.7s; SUID pin survived install-over; sub-31 guard works. NO human review verdict yet —
   CHECK THE PR FIRST next session and respond to any findings (anonymous).
2. **iOS soak** — app stayed foreground through the 07:18:46 due (dasd deferral, expected);
   grep ship-soak2.log AFTER the phone backgrounds for the first 360-min fire + exact +6:00:00
   re-arm. Next due = last app launch + 6h (any open resets it). Still no fire at 09:06
   (app in active use all morning).
3. **BENCH CHANGE (owner, 2026-09-03 08:15): F8 + 3T + 8T left ARMED for a MULTI-DAY
   UNATTENDED SOAK; owner regains access "in a few days".** Phones stay bench-connected +
   charging; do NOT wipe/reboot/unplug them. **Owner is disabling the OS NOTIFICATION
   PERMISSION (App-Info → Notifications — NOT the in-app alert toggles, which would trigger
   the app's reschedule logic and CANCEL the mock alarm set). Display-only by design:
   alarms still dispatch, chain still cycles, everything stays adb-observable (logcat
   AlarmManager lines = the delivery channel while muted; notification-history/deltas
   resume when re-enabled). Apps stay installed; on return the owner re-enables the
   permission and the soak resumes audibly. VERIFY on return-check: on the F8 (only A13+
   phone) confirm the alarm registry KEPT REFRESHING across cycles while permission was
   revoked — if our scheduling is permission-gated anywhere, its buffer would have drained
   to 0 (the 3T/8T use the legacy pre-13 toggle; no runtime-permission semantics).**
   5T + XS remain the reachable bench. On phone return, run the RETURN OBSERVATION (see
   scenario-d.log soak-start block): job-counter growth vs soak start (8T #22 / F8 #27 /
   3T #20), alarm registries, notification history delivery deltas for the mock alarms
   (8T's 14 incl. overnight 00:15/01:43), any natural reboot behavior (8T Auto-launch),
   F8 windowed drift over multi-day distance. KNOWN RISK: 3T had 0 pending alarms at soak
   start (its 10-min-hang → cancelled reschedules may starve the buffer on A9) — if still
   0 on return, escalate the A9/A10 headless hang to a real prod-config investigation; if
   healed, it was transient.
4. Upstream #49244 (expo-widgets identity fix) still in re-verification — unchanged.

**RESOLVED mid-session (2026-09-03 08:07 — for the record):** 8T Auto-launch test **PASS**.
Owner enabled Allow auto-launch for both apps → reboot #3 → job #u0a27/22 (same number as
pre-reboot = boot receivers re-armed from persisted state, no app launch) + 14/14 alarms
present ~2 min after boot. Reboots #1/#2 (Auto-launch OFF) never re-armed; only delta = the
toggle → causal (ISSUES #19 → MITIGATED). Gotcha: the re-arm lands up to ~2 min AFTER
sys.boot_completed=1 — never read a verdict at +60s. The 8T's 14-alarm schedule (owner-audible):
today 09:38/11:01/12:01/13:01 + Sep-4 00:15/01:43/12:51/13:06/13:11/13:13/13:33/16:44.

## Standing environment facts (unchanged, verify cheaply)
- Serials: 8T `543e5ac2` · 3T `8f7ada76` · Find X8 `G6RWBAQ4VKWWEAIZ` · 5T `a2b9dbf`
- Test app: `com.mugtaba.athan.bgtest` v1.18.1 (15-min rung, bgDebug, mock data — env=local
  couples mock-gate to logging-gate; API wipe-refetch every cycle is dev-build-normal).
  APK preserved at `~/bg-evidence/athan-bgtest-1.18.1-15min-rung.apk`.
- Bare rigs installed: `com.muji.barealarm` (targetSdk 33) + `com.muji.barealarm36` (36, has
  BURST + fidelity arms) + `com.muji.bareexpo` (blank SDK-57 expo app, the level-1 experiment rig).
  APK copies SAFE in `~/bg-evidence/`: `com.muji.barealarm.apk`, `com.muji.barealarm36.apk`,
  `bareexpo-level1.apk` (+ sources `/tmp/opencode/bg/bare-expo/`, `/tmp/opencode/bg/bare-alarm/` —
  may not survive Mac reboot).
- **adb install lesson (2026-09-03, do not relearn): Play Protect consent dialogs BLOCK adb install
  with no output until answered.** The 8T popped `PlayProtectDialogsActivity` ("Send app for a
  security check?") — its shell CANNOT disable the verifier (WRITE_SECURE_SETTINGS denied, §8 quirk),
  so: `uiautomator dump` → tap **"Don't send"** → install proceeds (one dismissal sufficed for the
  retry). The F8/3T/5T use `settings put global package_verifier_enable 0` + `verifier_verify_adb_installs 0`
  (restore after). Symptom signature: `adb install` hangs indefinitely with zero output; check
  `dumpsys window | grep mCurrentFocus` for the PlayProtect dialog FIRST.
- Logcat pipelines (filtered) + 8T keepalive (10s WAKEUP loop — 8T refuses svc stayon) +
  caffeinate need re-arming if the Mac slept; see §1 macOS daemon lessons (nohup+disown, never
  in a command that might time out, wrap pipelines in bash -c).
- Screen state: keep-awake armed on all phones; 8T PIN-locks anyway (keepalive wakes to lock
  screen; UI automation needs the owner to unlock — ask ONLY if a pending step needs UI).
- ColorOS 16 logcat quota drops app logs (dumpsys is authoritative); install dialogs need
  uiautomator taps; Play Protect blocks self-signed installs (verifier settings toggle).
*(Superseded mid-session 01:33 pause block: build completed locally as build-1788398966295.apk
after the queue sat >1h; the 01:42/Fajr natural experiments were extracted and are recorded in
the §1 verdict blocks below. Historical record only.)*
- **Background daemons (nohup + disown, verified surviving tool-call boundaries)**: caffeinate -dims; 4× per-device FILTERED logcat pipelines at `/tmp/opencode/bg/<name>-logcat.log` (pattern: backgroundtask|workermanager|WM-WorkerWrapper|AlarmManager|expo|mugtaba|ReactNativeJS|NotificationService|frozen|standby); 8T WAKEUP keepalive (10s loop); EAS build watcher (`/tmp/opencode/bg/build-watch.log`). Verify on resume: `pgrep -f "grep --line-buffered" | wc -l` (expect 4-8) + `tail build-watch.log`.
  **macOS daemon lessons (do not relearn)**: (1) no `setsid` on macOS — use `nohup … & disown` (zsh builtin). (2) A bash-tool command that hits its TIMEOUT SIGKILLs its whole process group INCLUDING nohup'd background jobs started in it — never start long-lived daemons in a command that might time out. (3) `nohup adb logcat | grep > f &` protects only adb — nohup the `bash -c` pipeline wrapper or the grep dies with the shell and adb dies on SIGPIPE.
- **iOS**: ship soak live (`~/bg-evidence/ship-soak.log`, full unfiltered syslog); registration verified `earliestBeginDate` = submit + exactly 6:00:00; first expected fire ~07:18 BST — grep `Athan{BackgroundTasks}` + dasd `Submitted`/`DASActivity` lines.
- Working tree committed+pushed at session end (1.18.2 checkpoint: runbook + ISSUES + app.config.ts; owner instructed).
- Upstream check done this session: PR #49244 open, in re-verification (key/index namespace fix committed; no expo-widgets release yet).

**TEST APP DEPLOYED (2026-09-03 03:04–03:09):** `build-1788398966295.apk` (local eas build, ~15 min
— queue bypass; remote queue had sat >1h) = `com.mugtaba.athan.bgtest` v1.18.1 "Athan BGTest",
15-min rung + bgDebug + env-pinned. Installed + launched on ALL FOUR. Registration evidence:
8T/3T/5T `Enqueuing worker … '15' minutes delay` at 03:04:31-32 (due 03:19:3x); Find X8
initially SILENT — two ColorOS-16 lessons:
1. **`pm grant POST_NOTIFICATIONS` does NOT suppress the app's permission dialog** (dialog
   appeared despite pre-grant attempt) — and **the dialog BLOCKS app boot/registration** until
   answered (adb-tap Allow via uiautomator coordinates; then job appeared immediately:
   `Minimum latency: +14m59s997ms`, due 03:23:45).
2. **ColorOS 16 per-process logcat quota**: `LOG_FLOWCTRL: ==LOGS OVER PROC QUOTA(300) … DROPPED==`
   — boot chatter exhausts a 300-row budget and ALL subsequent app logs (incl.
   BackgroundTaskScheduler/ReactNativeJS evidence) are dropped. Use dumpsys
   (jobscheduler/alarm) as the authoritative channel on this phone; logcat evidence may
   recover after the rate window.
**SCENARIO A PASS #1 (2026-09-03 03:19–03:24, first natural fires at 15-min rung, app foreground):**
| Device | Due | Fired | Delta | Body | Re-arm |
|---|---|---|---|---|---|
| 8T | 03:19:31.155 | 03:19:31.209 | **+54ms** | EXECUTED (sync+reschedule, 0.5s) | ✅ '15' min exact |
| 3T | 03:19:32.294 | 03:19:32.371 | **+77ms** | foreground-skip (min(60,15)=15 deferral) | ✅ |
| 5T | 03:19:32.275 | 03:19:32.342 | **+67ms** | foreground-skip | ✅ |
| Find X8 | 03:23:45 | ~03:23:45 | at due (dumpsys job #0→#1) | (logcat quota-blind) | ✅ +14m59s993ms |
Notes: 8T body executed because its app wasn't foreground (keepalive/lock state) — B-like datapoint.
Fresh-install alert defaults are ALL OFF (preference snapshot alert:0 reminder:0 ×6) → 0 bgtest
alarms is correct; enabling alerts via UI automation next (delivery A/B needs scheduled
notifications). Test build is env=local ⇒ `APP_CONFIG.isDev` ⇒ `needsDataUpdate()` true always
(shared/config.ts + sync.ts:84) — every 15-min cycle wipe-refetches the API: expected dev-build
behavior, NOT a bug; production no-ops on fresh cache.

**SCENARIO A PASS #2 (03:34-35, all four via dumpsys job-ID increments — the authoritative
channel; device logcat buffers rotate):** 8T `#u0a27/2` +14m59s990ms · 3T `#u0a113/2`
+14m59s971ms · 5T `#u0a696/2` +14m59s984ms · F8 `#u0a43/2` +14m59s997ms. Re-arm arithmetic
exact within 30ms across 4 devices/OEMs.

**Alerts enabled via UI automation (03:2x-03:37)** — bell-icon → Athan sheet → Sound ×6 standard
prayers, per phone: **F8 18 alarms / 3T 24 / 5T 24** (8T deferred: PIN-locked, no UI access;
chain unaffected — fires fine). NOTE: fresh alarms on the GRANTED exact path STILL show
`window=+1h0m0s0ms exactAllowReason=policy_permission flags=0x4` on ColorOS 16 — same nominal
window as the Play app's stale alarms (flags differ: 0x4 vs 0x8) ⇒ either ColorOS displays
exact alarms with a nominal window or silently downgrades them to windowed; the mock-instant
delivery deltas will discriminate empirically. Also noted: test build uses MOCK prayer data
(env=local gates `api/client.ts:37` mock branch — mock-gate ≡ logging-gate, they cannot be
decoupled without code change) — irrelevant for chain verification; mock instants are still
exact alarm targets for delivery-precision measurement.

**One-shot entry point:** `ai/prompts/android-background-task.md` — the
executable campaign prompt. Point a fresh session at it ("read and execute")
for the Android verification campaign; it drives off this runbook's tracker.

---

## 1. STATUS TRACKER (update after every session)

### iOS — COMPLETE 2026-09-02 (iPhone XS, iOS 18.7.10)

| Scenario | Build | Result | Evidence |
|---|---|---|---|
| Simulated trigger ×3 | dev 1.18.0 | ✅ 3/3 clean, 1.3–2.0s | Metro start.log |
| Natural fire — foreground | dev | ✅ +14s, +0s after due (2×) | dasd Submitted 20:50/21:06 |
| Natural fire — backgrounded | dev | ✅ +36s after due | dasd 21:21:35 |
| Natural fire — headless cold-launch (process killed) | RELEASE | ✅ fired at due, resubmit exact +15:00 | dasd 21:59:25→22:14:25 |
| Natural fire — foreground | RELEASE | ✅ +58s after due | dasd 22:53:59→23:08:59 |
| Reboot survival (locked, no passcode) | RELEASE | ✅ app relaunched headlessly ~11min post-boot, re-armed exact +15:00 | dasd 22:29:50/22:30:04/22:34:28 |
| Sustained cadence 15-min | dev+RELEASE | ✅ chain self-perpetuates; ⚠️ dasd rate-limits after ~4 rapid runs ("group is full", recovers) | overnight.log |
| User force-quit | — | ❌ not remotely testable (Apple disables bg relaunch until next open; platform rule). Recovery: 2-day buffer + next-open refresh | docs |
| Rate limit | RELEASE | ⚠️ sub-hour intervals unsustainable; ship value since retuned to 360 min | dasd skips 21:35–21:59 |
| Config persistence | RELEASE | ✅ task registration survives app updates (upgrade install) | EXTaskService restore 21:43 |
| Object-level proof | RELEASE | ✅ `submitTaskRequest: <BGProcessingTaskRequest: … earliestBeginDate: +15:00, requiresExternalPower=0, requiresNetworkConnectivity=1>` | overnight.log 22:38:01 |

**iOS resting state:** Release preview build @ commit 70dac78 (15-min interval, bgDebug on; labeled 1.17.10 pre-minor-bump — code identical to 1.18.0)
installed on the XS; overnight filtered syslog capture at
`~/bg-evidence/overnight.log` (recreate via §4). Ship config = 360 min (6h),
verified in code + arithmetic; no further iOS work pending except
(optional) owner force-quit test + morning soak review.
**UPDATE 2026-09-03 01:18:** ship-config IPA (athan-1.18.1-ship360.ipa) INSTALLED on the XS over the rung build,
cold-boot registration verified live: `submitTaskRequest: <BGProcessingTaskRequest: … earliestBeginDate: 06:18:46 +0000>`
= submit + EXACTLY 6:00:00 — object-level proof of the 360-min ship arithmetic (persisted-config-survives-update re-confirmed
in passing: the cancel×2→submit sequence = the always-unregister-then-register self-heal flow re-running on the new binary).
Unfiltered soak capture running at `~/bg-evidence/ship-soak.log`; first expected fire ~07:18 BST. NOTE: a devicectl launch
immediately after install can attach to a stale/racing instance that never registers — terminate by pid + relaunch to verify.
Ship build has NO bgDebug (no JS logs expected; dasd/BackgroundTasks subsystem lines only).

### Android — IN PROGRESS (2026-09-03 session; fix shipped 1.18.0, verifying on live fleet)

Fleet connected (all `adb` shell-verified, RSA accepted, `svc power stayon usb` armed,
per-device logcats at `/tmp/opencode/bg/<name>-logcat.log`):

| # | Device / OS (serial) | Ground truth (ISSUES #14) | Play app | Live BG job (dumpsys) | Status |
|---|---|---|---|---|---|
| 1 | OnePlus 3T / Android 9 (`8f7ada76`) | SDK<12: always-exact; deviceidle whitelist ✓ | 1.2.9 | ⚠️ `+7d11h59m59s` job live | Ground truth ✅ |
| 2 | OnePlus 5T / Android 10 (`a2b9dbf`) | SDK<12: always-exact; whitelist ✗ (absent) | 1.5.2 | ⚠️ `+7d11h59m59s` job live | Ground truth ✅ |
| 3 | OnePlus 8T / Android 12 (`543e5ac2`) | `SCHEDULE_EXACT_ALARM: granted=true`; whitelist ✓; standby-optimization OFF (user) | 1.5.2 | ⚠️ `+7d11h59m59s` job live | Ground truth ✅ |
| 4 | Oppo Find X8 / Android 16 (`G6RWBAQ4VKWWEAIZ`) | `USE_EXACT_ALARM: granted=true` (carries exactness); `POST_NOTIFICATIONS: granted=true`; whitelist ✓; sleep-standby OFF (user); quota trackers calm | 1.5.2 | ⚠️ `+7d11h59m59s` job live | Ground truth ✅ |
| 5 | Samsung (OneUI) | — (joins later via campaign prompt) | — | — | ⏳ |

**Ground-truth verdicts (2026-09-03):**
- **#10 suspect 1 (runtime exact-alarm revoke → silent inexact fallback) DISCONFIRMED on both
  suspect phones** — 8T grants SCHEDULE_EXACT_ALARM at runtime; Find X8 carries USE_EXACT_ALARM
  install-grant. The exact path (`setExactAndAllowWhileIdle`) is ACTIVE on both. Residual ±60s
  drift must be delivery-side (suspect 2: ColorOS process-freeze / broadcast delivery deferral) —
  investigate during natural-fire deltas.
- **Unit bug empirically live on ALL FOUR production installs**: every phone's persisted
  WorkManager job shows `Minimum latency: +7d11h59m59s` (7.5 days = 10800 passed as minutes) —
  device-level confirmation of ISSUES #8's Android half (was source-verified only).
- **NEW #10 lead (2026-09-03 01:16 dumpsys alarm baseline → CORRECTED 01:50 with policy detail)**:
  both suspects' pending Play-app alarms are **INEXACT while-idle** (`window=+1h0m0s0ms`,
  `flags=0x8` = ALLOW_WHILE_IDLE without exact window) — scheduled during the owner's earlier
  exact-alarm-toggle-off period and NEVER re-scheduled since (1.5.2's BG task is the dead
  +7d11h job; app unopened for ages). The CURRENT runtime grant is true on both phones
  (ground truth above) — so #10 suspect 1 (silent inexact fallback) is CONFIRMED RETROSPECTIVELY
  as the historical scheduling-time cause; the inexact alarms it produced are still live.
  **ColorOS exposes `policyWhenElapsed` per alarm with decomposed deferral penalties** — the
  04:11 Fajr-cluster alarm currently carries `app_standby=-53m38s device_idle=-1h31m59s
  battery_saver=-5m6s` and a net planned `adjustment=+2h23m43s` (delivery ~06:34 if policy
  doesn't improve before then). This is the multi-minute drift the owner sees on unattended
  days. A/B test tonight: 1.5.2's stale inexact alarms vs 1.18.1 test app's fresh EXACT
  (window-zero) alarms on the same phones.
- Natural-experiment windows (all Play-app alarms, same instants across phones):
  01:42:00 + Fajr cluster 04:11/04:21/04:36 + 06:33 — delivery deltas being recorded per
  phone (alarm dispatch vs notification post vs scheduled instant).

**01:42 EXPERIMENT RESULT (2026-09-03, captured live):**
- **Find X8 (ColorOS 16, INEXACT while-idle alarm [see policy correction above], all conditions
  favorable: charging/screen-on/whitelisted/permission granted): dispatch +81.4s late** —
  AlarmManager `sending alarm origWhen 01:42:00.000` logged 01:43:21.421. App-side then FAST:
  cold `Start proc` 01:43:21.430 (+9ms after dispatch), notification posted ~01:43:21.704
  (~+284ms). **Deferral is in the OS alarm dispatch layer, BEFORE any app code runs** — and
  this was the SOFT case (favorable conditions softened the policy penalties; the same alarm
  class carries a planned +2h23m adjustment in unattended state). Also: post went to
  `expo_notifications_fallback_notification_channel` flags=SILENT (1.5.2 scheduled request's
  channel unresolvable at cold post).
- **8T (OxygenOS 12, INEXACT-window alarm): dispatch +11.0s** (01:42:11.021 cold Start proc).
  Counterintuitive: the "worse" alarm on the "older" OS was 7× more punctual tonight.
- **Controls did not participate — and that is ITSELF evidence**: 5T + 3T have NO pending
  notification alarms (only WorkManager's 10-year ACTION_FORCE_STOP_RESCHEDULE placeholder);
  their 2-day buffers expired because the BG task never ran (the live 7.5-day jobs) — the exact
  unattended-rot the 1.18.0 fix addresses.
- **Owner report (2026-09-03, user testimony — deliberately VAGUE, do not cite as measurement):
  Find X8 drift in daily use is "sometimes ~60s, sometimes minutes" — both directions, unquantified.**
  "Early" ⇒ clock-skew signature (#11: offline NTP drift), "late" ⇒ alarm-queue deferral
  (tonight's +81s best-case measurement is its floor). Device-clock skew now logged at
  every fire event (baseline: all four ±3s vs Mac at 01:16).
- **AOSP docs (fetched 2026-09-03, the authoritative fix-case citation):** `setExactAndAllowWhileIdle`
  = "a **nearly** precise time" (Google's own hedge — OEMs exploit the slack; our +81s fits);
  `setAlarmClock` = "a **precise** time … the system **never adjusts their delivery time** …
  most critical … leaves low-power modes if necessary". Inexact `set()`/`setAndAllowWhileIdle()`
  on 12+ = "within one hour" unless battery restrictions. USE_EXACT_ALARM: auto-granted,
  not user-revocable, Play-policy-gated (we declare both — fine).
- **ColorOS freezer machinery observed live** (OplusHansManager cycling WhatsApp frozen↔unfrozen
  in the capture window) — the freeze layer exists and runs constantly; not implicated in THIS
  event (process was dead; dispatch itself deferred) but available for worse deferrals.
- IMPLICATION: the fix path for #10-late is upstream `setAlarmClock()` (dedicated high-priority
  queue, Doze-exempt, OEM clock-app treatment) — expo-notifications exposes nothing today
  (grep-verified). Empirical soak data (Fajr cluster + test-app 15-min cycle) to build the case.
- **User-visible corroboration (owner, 01:57)**: both suspect phones' lock screens show the
  Last Third notification (the 01:42 experiment's payload, not dismissed) — the logcat-derived
  deltas (+11s 8T / +81s F8) are real delivered notifications, not log artifacts.
- **Fajr cluster observed (F8, stale inexact alarms under policy)**: 04:11 → dispatched
  04:13:21.421 (**+2m21.4s**); 04:21 → 04:23:21.421 (**+2m21.4s**); 04:36 → 04:38:21.429
  (**+2m21.4s**) — THREE IDENTICAL deltas: the ColorOS deferral is a deterministic coalescing
  quantum (~141.42s in this policy state), not random jitter. Combined with the 01:42 (+81.4s
  best-case) and the policyWhenElapsed planned +2h23m worst-case, deferral is a conditions-
  dependent CONTINUUM matching the owner's reported 60s-to-minutes drift. App-side post latency
  ~0.3s throughout — deferral is 100% OS alarm queue.

**APP NOTIFICATION DELIVERY — FINAL EMPIRICAL BLOCK (06:00–06:05, mock-instant alarms,
owner-audible corroboration included):**
| Event | 8T (A12) | Find X8 (A16) |
|---|---|---|
| 06:00:00 Sunrise | fired 06:00:11.8 (+11.8s) — **owner HEARD it** ("Adan number one, at 6:00") | deferred deep into its +17m window — NOT dispatched by 06:05, no post record; **owner did NOT hear it** |
| 06:04:00 Asr | fired 06:04:00.078 (**+78ms**) — owner heard | dispatched 06:04:21.6 (**+21.6s**) — owner heard |
| Dhuhr 04:41 | — | posted late (record present at 06:05; window-deferred) |

**Synthesis — the #10 story is closed-loop:** the app's alarms land WINDOWED on both OEMs
(per-package OS policy; every call-parameter differential ruled out via bare bisection).
Windowed delivery = on-time when the OS is lenient (8T +78ms..+12s tonight), seconds-to-minutes
late as policy pressure grows (F8 +21.6s tonight → +2m21.4s quantum in deeper state → +2h23m
planned worst-case unattended). The owner's "sometimes 60s, sometimes minutes, sometimes early"
= the lenient/pressurized continuum (+ clock-skew for "early"). Bare exact/alarm-clock alarms
are immune in every tested condition (sub-150ms, even RESTRICTED bucket, even 2-day distance).
**FIX: prayer notifications must move to `setAlarmClock` (upstream expo-notifications PR —
never proposed, grep-verified) — proven viable on all four devices.**
**BARE-METAL CONTROL EXPERIMENT (2026-09-03 05:03–05:29 — the session's decisive data):**
Hand-built receiver-only APK (`com.muji.barealarm`/`barealarm36`, plain javac+d8+aapt2, zero
expo/RN/Kotlin; schedules via explicit `am broadcast`) run on all four phones. API arms fired:

| API | 3T (A9) | 5T (A10) | 8T (A12) | Find X8 (A16) |
|---|---|---|---|---|
| setExactAndAllowWhileIdle | **+13ms** | **+41ms** | **+42ms** | **+15ms / +12ms** |
| exact + FLAG_MUTABLE pi | — | — | +124ms | +11ms |
| setAlarmClock | +18ms | +43ms | pending | pending |
| setAndAllowWhileIdle (inexact) | **+5m12s** | **+2m0s** | — | — |
| plain set() | +71.6s | +2m53s | +20.3s | — |

**VERDICTS:** (1) All four phones deliver EXACT and ALARMCLOCK alarms within ~10–125ms — even
from a RESTRICTED-bucket (50) app; the OS alarm queues are NOT broken. (2) INEXACT alarms drift
2–5.2 MINUTES — precisely the owner's #10 symptom. (3) Mutable PendingIntent innocent. (4)
setAlarmClock stores window=0 at ANY distance (2-day arm verified) — the viable fix channel.
**Bisection of why the expo app's exact calls store windowed (+1h, flags=0x4) while byte-equivalent
bare calls store exact (window=0, flags=0x5) — ALL RULED OUT:** targetSdk (33 vs 36 — bare36 exact
at both), permissions (bgtest grants verified granted=true), PendingIntent mutability/URI/foreground-
flag (fidelity arms), alarm count (30+ burst all window=0), schedule distance (2-day arms window=0),
standby bucket (bare RESTRICTED=50 still exact; app ACTIVE=10 still windowed), androidx version
(single-instruction passthrough verified in the app's own dex), shipped delegate bytecode (verified
correct gate + call). The differential is OS-side per-package policy (OEM app-classification
suspected — not observable from adb). Irrespective of cause: whenever the app's alarms land
windowed, delivery drifts minutes-scale (owner's symptom); setAlarmClock is immune in every
tested condition → upstream PR is THE fix. Play Protect blocks self-signed sideloads on ColorOS 16
(disable via `settings put global package_verifier_enable 0` + `verifier_verify_adb_installs 0`
then restore); Android 8+ requires EXPLICIT-component broadcasts to manifest receivers.
**SCENARIO B (backgrounded, KEYCODE_HOME at 03:49:20) — PASSING:**
- **SCENARIO C PASS (5T, 04:49)**: process dead since 04:34 → due 04:49:02.963 → WorkManager
  COLD-LAUNCHED the dead app headlessly (new pid 20774), `doWork: Running worker` at
  04:49:53.278 (**+50.3s incl. cold process spawn**), re-enqueued '15' minutes — **chain
  survives process death** (the core C criterion, matching the iOS cold-launch result).
- 5T hard evidence: fired 04:03:59.798 (due ~04:04), body EXECUTED (`Task successfully
  finished`), re-armed +15 exact → **B pass #1**. Fires continue on ~15-min cadence.
- **dumpsys gotcha (do not relearn)**: the `Minimum latency` field on OxygenOS/ColorOS is a
  STATIC display of the requested delay (+14m59s9xx constant between reads) — NOT live
  remaining. Authoritative fire evidence = JOB # increments per enqueue + logcat timestamps.
- **OEM-killer live event (3T, OxygenOS 9) at ~04:0x**: backgrounded bgtest app was FORCE-STOPPED
  by the OS (`stopped=true`, job cancelled, no fire — scenario-D semantics invoked by the OEM).
  Same-family A/B: 5T (Android 10) keeps its chain. Recovery verified: relaunch → re-registers
  instantly (job #4, fresh +15). The 3T now doubles as the OEM-killer observatory — expect its
  chain to die whenever backgrounded; each relaunch self-heals.
- Fajr-cluster Play-app deltas on F8 (stale inexact alarms): 04:11 → +2m21.4s (see above).
- 5T lacks the deviceidle whitelist (only fleet member) — useful A/B observatory for OEM killer effects.
- OEM battery killers neutralized by owner at session start (8T sleep-standby OFF; Find X8
  sleep-standby OFF, balanced mode, no adaptive-battery option on ColorOS 16).
- Device clock skew baseline (vs Mac): all four within ±3s.

**Session artifacts:** test build side-by-side via `applicationIdSuffix` — `app.config.ts`
(env `EXPO_ANDROID_SUFFIX`, no-op without it) + eas.json preview env
(`EXPO_PUBLIC_BG_INTERVAL_MINUTES=15`, `EXPO_PUBLIC_BG_DEBUG=1`, suffix `bgtest`) →
`com.mugtaba.athan.bgtest` "Athan BGTest", fresh EAS keystore, versionCode 1.
Build `b894b302-b7d5-4914-b453-69944da9b297` (superseded `4efab297`, cancelled pre-run).
Play Store apps on all phones remain untouched (signatures differ; install-over impossible).
**ENV PINNING (critical, learned the hard way):** the preview-profile env MUST pin all three:
`EXPO_PUBLIC_ENV=local` (server-side EAS environments hold `preview`/`prod` values that would
DISABLE pino logging + bgDebug snapshots via shared/logger.ts's isProd/isPreview gate) and
`EXPO_PUBLIC_API_KEY=<real>` (the repo's committed `.env` holds the DEV placeholder `key`,
which the londonprayertimes API rejects with 403 — sync would fail on fresh installs).
Precedence (expo docs, EAS Workflows §environment): profile `env` > EAS server environment >
.env files — profile env is the only layer that deterministically wins.

**Android-first-actions on each device (before anything else):**
ISSUES #14 adb ground-truth checklist —
`adb shell dumpsys package com.mugtaba.athan | grep -i -A2 EXACT` (runtime exact-alarm grant)
+ `adb shell dumpsys deviceidle whitelist | grep mugtaba` (power allowlist).

---

## 2. THE FIX UNDER TEST (shipped 1.18.0; intervals retuned same session — same on both platforms)

1. `minimumInterval` is **MINUTES** (expo-background-task docs; iOS ×60 for
   earliestBeginDate; Android `Duration.ofMinutes`). We passed 10800 SECONDS
   = 7.5 DAYS on both platforms. Now: `BACKGROUND_TASK_INTERVAL_MINUTES`
   (shared/constants.ts) — env `EXPO_PUBLIC_BG_INTERVAL_MINUTES` → dev 15 → prod **360 (6h)**. Foreground gate: `NOTIFICATION_REFRESH_HOURS` = **12h** (pure fallback; background layer is primary). ADR-007 rev 3.
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
| Ship config | preview profile, NO env | 360 (6h) | final resting artifact |
| Android dev/release | `eas build --profile development|preview --platform android` | same constants | install via `adb install -r <apk>` |

Env vars are baked at bundle time — each interval rung needs its own build
(iOS) / Metro restart (dev). Verify the rung landed via the diagnostics
snapshot log (`persistedOptions.minimumInterval`).

## 4. RESUME PROTOCOL (fresh session)

1. Read this file §1 + ISSUES.md #8.
2. Tools check (mac): `xcrun devicectl list devices` (iOS),
   `adb devices` (Android), `/tmp/opencode/bg/pymd3-venv/bin/pymobiledevice3 version`.
   If venv gone: `python3 -m venv /tmp/opencode/bg/pymd3-venv && …/bin/pip install pymobiledevice3`.
   Prefer evidence files under `~/bg-evidence/` (survives /tmp cleanup).
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
  manual open (both platforms document this). ~~Verify notifications still fire
  from the existing 2-day set~~ **CORRECTED 2026-09-03 (issue #18): on Android,
  force-stop CANCELS all scheduled alarms — the buffer does NOT survive; verify
  instead that the alarm registry is empty and that recovery on next open
  re-registers the chain + full buffer.** iOS: buffer survives (verified).
  Verify recovery on next open.
**E. Reboot** — iOS: `xcrun devicectl device reboot --device <UDID>`;
   Android: `adb -s <serial> reboot`. Watch post-boot: chain must re-arm
   (WorkManager + BOOT_COMPLETED receiver make Android persistence native;
   iOS verified empirically 2026-09-02 — request survived, app relaunched
   headlessly ~11 min post-boot while locked).
**F. Sustained cadence** — leave the device ≥2h; count fires vs windows;
   iOS expects dasd rate-limit deferrals at sub-hour intervals (they recover).
**G. Rate-limit probe (iOS)** — hammer the trigger 4–5× rapidly, then watch
   `group is full` deferrals and recovery latency. Informs the floor for the
   interval; 360 min (6h) is the chosen ship value (owner, post-verification).

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

## 8. ANDROID-SPECIFIC BRIEF (source-verified 2026-09-03 against installed 57.0.15/57.0.14)

- Unit chain CONFIRMED end-to-end: JS `registerTaskAsync(name, {minimumInterval: N})` →
  `BackgroundTaskConsumer.kt:51` reads N (minutes, no transform) → `Duration.ofMinutes(N)`
  initial delay + `Enqueuing worker … 'N' minutes delay` log (BackgroundTaskScheduler.kt:101).
  The old 10800 value = `+7d11h59m59s` — matches the live persisted jobs found on all four
  fleet phones 2026-09-03 (dumpsys jobscheduler ground truth).
- Chain mechanics (BackgroundTaskScheduler.kt): self-rescheduling OneTimeWorkRequest (O+)
  re-enqueues APPEND with fresh +interval after each run (line 250-252). WorkManager persists
  unique work across reboot/process death natively; expo-notifications ships BOOT_COMPLETED
  (NotificationsService SETUP_ACTIONS) re-arming persisted triggers.
- **Every app launch resets the window**: our always-unregister-then-register → counter 0 →
  stopWorker CANCELS the enqueued work → fresh +interval enqueue. (Guard at line 88-94 only
  skips replace when ENQUEUED/RUNNING — our unregister cancels first, so it never fires.)
  NEVER relaunch mid-window on Android either.
- inForeground deferral is `min(60, interval)` (line 226): at the 15-min rung that's +15 min,
  NOT +60 — judge scenario A accordingly. Trigger: OnActivityEntersForeground/Background flags.
- Upstream constraints: `NetworkType.CONNECTED` (never runs offline), OEM killers (#10/#13).
- Delivery path (expo-notifications, NotificationsService.kt): alarm PendingIntent →
  BroadcastReceiver IN THE APP PROCESS → `onReceive` goAsync + raw thread → present +
  re-schedule. Frozen/cold process = delivery latency risk (#10 suspect 2).
- Exactness branch (ExpoSchedulingDelegate.kt:105-121): `SDK<S || canScheduleExactAlarms()` →
  `setExactAndAllowWhileIdle`, else SILENT `setAndAllowWhileIdle` fallback.
  Ground truth 2026-09-03: exact path ACTIVE on both suspects (8T runtime grant, Find X8
  USE_EXACT_ALARM install-grant) → #10 drift is delivery-side, not permission-side.
- **setAlarmClock() is NOT exposed anywhere in expo-notifications** (grep-verified 2026-09-03)
  — the highest-reliability channel (Doze-exempt, OEM-protected, user-intent signal) is the
  upstream fix candidate if delivery-side drift is empirically confirmed.
- JS logs in release builds surface as `ReactNativeJS` tag logcat lines (pino→console). Logger
  is enabled in our preview builds ONLY because `EXPO_PUBLIC_ENV` is unset (env 'local');
  if a future profile sets `EXPO_PUBLIC_ENV=preview`, bgDebug snapshots vanish silently.
- adb WorkManager introspection: `dumpsys jobscheduler | grep -A5 mugtaba` (look for
  `Minimum latency` on the SystemJobService job = live window), logcat tags
  `BackgroundTaskScheduler` + `WM-WorkerWrapper`.
- OnePlus/Oppo quirk (8T/OxygenOS 12): `svc power stayon` does NOT stick and shell CANNOT
  write settings (WRITE_SECURE_SETTINGS/WRITE_SETTINGS denied) — keep-awake there requires a
  polling WAKEUP loop (10s cycles) instead of the one-shot used on the other phones.

## 9. UPSTREAM TRACKING

- **expo/expo#49687 (FILED 2026-09-03 by this campaign)** — opt-in `alarmClock` DateTriggerInput
  → `AlarmManager.setAlarmClock()`; fixes OEM windowed delivery (ISSUES #17 / #10 root cause).
  Fork branch: capt-muji:notifications-android-alarm-clock. CHECK STATUS EVERY SESSION — once
  merged, adopt for prayer-time notifications and retire the drift observatory.
- expo/expo#48786 — getStatusAsync blind to Background App Refresh (accepted).
- expo/expo#44540 — simulate-trigger TaskService race (known trap).
- `requiresNetworkConnectivity=true` hardcoded — candidate upstream PR
  (would remove needless offline deferral; our task is offline-capable).
  Owner decision 2026-09-02: accept + document, no patch-package.
