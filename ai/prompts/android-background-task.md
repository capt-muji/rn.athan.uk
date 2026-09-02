Read ai/AGENTS.md, then execute this campaign end-to-end. Do not ask me to plan — the plan, procedures, and current state already exist. Ask me ONLY for physical actions you cannot perform (RSA prompts, unlock codes, swiping apps away).

# Android Background-Task Verification Campaign

## What this is

The cross-platform background-task fix shipped as 1.18.0 on branch
`fix/background-scheduling` (commit history tells the story). iOS is COMPLETE —
device-verified across the full lifecycle matrix on an iPhone XS / iOS 18.7.10
(2026-09-02): natural fires foreground/backgrounded, headless cold-launch,
reboot survival while locked, OS-object-level interval proof. Android carries
the SAME fix (same unit bug: `minimumInterval` is minutes) but is
**device-unverified**. Your job: run the verification matrix on every Android
device I connect, in parallel, and keep the tracker truthful.

## Mandatory reading (in order, before touching anything)

1. `ai/RUNBOOK-background-tasks.md` — §1 status tracker (YOUR RESUME POINT),
   §3 build matrix, §4 resume protocol, §5 scenario procedures + pass criteria,
   §8 Android brief, §9 upstream tracking.
2. `ai/ISSUES.md` #8 (root cause + iOS evidence), #10–#14 (Android exactness /
  double-notification / manifest / observability history — the adb ground-truth
   checklist in #14 is your FIRST action per device).
3. `ai/adr/007-background-task-notification-refresh.md` — the architecture you
   are verifying (6h background layer + 12h foreground gate per ADR-007 rev 3; schedule-first +
   sweep; always-unregister-then-register).

## Session start protocol

1. `git status` — you must be on `fix/background-scheduling` (or its successor
   containing the 1.18.0 fix). If the fix is missing from the working tree,
   STOP and tell me.
2. Tool checks: `adb version` (expect `~/Library/Android/sdk/platform-tools`),
   `npx eas-cli whoami` (must be logged in), `yarn --version`.
3. `adb devices -l` — inventory connected devices. For each: record
   `model`, Android version (`adb -s <serial> shell getprop ro.build.version.release`),
   skin (`ro.build.version.incremental` / manufacturer) into runbook §1's
   Android table. Ask me to accept the RSA prompt if a device shows `unauthorized`.
4. Determine state: if §1's Android table has any ✅ rows, CONTINUE from the
   first non-done scenario for that device. Otherwise start fresh at the
   ground-truth checklist.

## Per-device first actions (before any testing)

Run ISSUES #14's ground-truth checklist and record results in the tracker:

```
adb -s <serial> shell dumpsys package com.mugtaba.athan | grep -i -A2 EXACT
adb -s <serial> shell dumpsys deviceidle whitelist | grep mugtaba
adb -s <serial> shell dumpsys jobscheduler | grep -A5 mugtaba
```

Interpretation (from ISSUES #10): runtime exact-alarm grant false on ColorOS
13+ = suspect 1 confirmed (silent inexact fallback active); whitelist absent =
OEM killer risk. These explain any ±60s drift you later observe — record, do
not "fix" (owner decisions #13/#14 stand).

## Build matrix

- **Release rung build (the one that matters):** temporarily add
  `"env": {"EXPO_PUBLIC_BG_INTERVAL_MINUTES": "15", "EXPO_PUBLIC_BG_DEBUG": "1"}`
  to the `preview` profile in eas.json, `npx eas-cli build --profile preview
  --platform android --no-wait`, then REVERT eas.json. Install:
  `adb -s <serial> install -r <apk>`.
- **Ship-config build:** preview profile with NO env (360 min / 6h) — final
  resting artifact per device.
- Dev builds only for simulate-trigger work (Metro-dependent; useless for
  headless tests — see runbook §7 lesson 1, it applies to Android too via
  the dev-client URL trap).
- Ladder protocol (15→30→60→120→180) ONLY if 15-min rung exposes Android-side
  throttling; otherwise 15 verifies mechanics and 360 (6h) ships. Android has no
  dasd-style processing budget — WorkManager enforces ≥15 min, which is the floor.

## Scenario matrix (per device — runbook §5 has the full procedures)

Execute A–F in order per device, ALL DEVICES IN PARALLEL (adb `-s` multiplexes;
register all devices first, then watch all windows concurrently; never let a
device's wait wall serialize the others):

- **A Foreground** — app open, screen on. Fire expected ≥ due.
- **B Backgrounded** — `adb -s <serial> shell input keyevent KEYCODE_HOME`.
- **C Headless cold-launch** — `adb -s <serial> shell am kill com.mugtaba.athan`
  (NOT `am force-stop` — that sets user-force-quit semantics; its degraded
  behavior is scenario D). Release build required.
- **D User force-quit** — `am force-stop` + also ask me to swipe-kill once if
  convenient. Expected: chain dead until next manual open; notifications must
  still fire from the existing 2-day set; recovery on open.
- **E Reboot** — `adb -s <serial> reboot`. WorkManager + BOOT_COMPLETED receiver
  must keep the chain (source-verified; empirically confirm).
- **F Sustained cadence** — leave ≥2h; count fires vs expected windows.

**Evidence channels:** `adb -s <serial> logcat -v time` filtered on
`expo.modules.backgroundtask|WM-WorkerWrapper|WorkManager|AlarmManager|expo` —
one background logcat file per device under `/tmp/opencode/bg/<name>-logcat.log`.
KEY native line: `Enqueuing worker … 'N' minutes delay` (interval arithmetic
proof, iOS `Submitted:` equivalent). bgDebug builds log JS snapshots
(`BACKGROUND_TASK_DEBUG: … persistedOptions … pendingNotifications`) — for
Android these appear in logcat directly (no Metro needed, unlike iOS).

**Pass criteria (runbook §5, verbatim):** A/B/C/E fire within minutes of due
and re-arm at exactly +interval; F sustains; D degrades to the 2-day buffer and
recovers on open. Notification accuracy is ISSUES #10/#11 territory — record
observed drift, do not chase it here unless a NEW signature appears.

## Tracker discipline (non-negotiable)

After EVERY scenario on EVERY device: update `ai/RUNBOOK-background-tasks.md`
§1's Android table (status + one-line evidence). This file is the resume point
for the next session — a fresh session must be able to pick up mid-device
mid-matrix with zero rediscovery. Commit tracker/doc updates to the campaign
branch at session end (version-bump convention per AGENTS §6 applies to code
changes only; doc-only commits may skip the bump — match repo history).

## Termination

All connected devices green through A–F → final report (matrix + evidence
summary + tracker final state) + flag anything new for ISSUES.md (a NEW issue
number, not a drive-by edit of #10). The Samsung OneUI device joins later via
this same prompt — its row is waiting in §1.

## Known traps (do not relearn)

- `am kill` vs `am force-stop`: kill = process death (chain must survive);
  force-stop = user-quit semantics (chain legitimately dies until open).
- OEM battery savers (OxygenOS/ColorOS) can freeze WorkManager for
  non-whitelisted apps — that's the #10/#14 territory, record it.
- `NetworkType.CONNECTED` upstream constraint: task never runs offline
  (accepted; document, don't patch).
- inForeground skip: worker defers +60 min while app is foregrounded — scenario
  A fires may be delayed; that is upstream behavior, not a failure. Judge A by
  "fired while foregrounded within ~interval+60m", or background the app
  partway through A if ambiguous.
- If logcat shows the worker running but notifications didn't change, check the
  bgDebug snapshot's `pendingNotifications` — scheduling happens in JS; a
  crashed JS task body surfaces as `BackgroundTaskResult.Failed` in logcat.
