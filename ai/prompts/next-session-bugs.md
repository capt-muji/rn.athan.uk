# Next Session: Bug-Fix Session — #22 Width Verify + #23 Extras Sound + #24 Splash Minimization (session 1 of 3)

Read `ai/AGENTS.md` first, act as Orchestrator. This is session 1 of an owner-ordered 3-session autonomous chain: (1) bugs, (2) widescreen (`ai/prompts/large-screen-adaptation.md`), (3) alarmClock patch (`ai/prompts/alarmclock-backport.md`). At session end, hand the owner the widescreen paste-block.

Repo state: `uat` @ 1.22.20. Read `ai/ISSUES.md` #22 and #23 in full before starting. The owner has connected all 3 devices: OnePlus 3T, Oppo Find X8, and iPhone XS (check `adb devices` + `xcrun devicectl list devices` to confirm serials; they may disconnect during the session — proceed without them and note what couldn't be verified).

## Task A — ISSUES #22 device verification (branch `fix/width-verify-extras-sound` from uat)

1. Create the branch. Kick an EAS preview build from uat (`eas build --platform android --profile preview --non-interactive --no-wait` — global `eas` CLI, never `npx eas-cli` inside the repo; cloud env has the API key).
2. When the 3T is attached: uninstall any Athan app, `adb install -r` the new APK (doubled `am start` ritual), verify the English column renders "Sunrise" on ONE line, relaunch 3+ times confirming no wrap and no width flicker (uiautomator dumps). Optional if instrumenting: a dev build with `EXPO_PUBLIC_PERF_MONITOR=1` to capture the fresh-install launch timeline for the wrong-measure window (font race confirmation).
3. Record the verdict in ISSUES #22 (tracker + issue body). If the fix fails on device: document evidence, do NOT thrash — the monotonic design analysis is in the issue; escalate in the report.

## Task B — ISSUES #23 extras at-time sound (same branch)

The full spec is in the issue: only the 5 daily prayers (Fajr, Dhuhr, Asr, Magrib, Isha) use the selected athan; Sunrise + all extras (Midnight, Last Third, Suhoor, Duha, Istijaba) use a separate built-in audio the owner created but has NOT imported.

1. Import the audio: copy `$HOME/Documents/athan-reminders/reminder.mp3` into `assets/audio/` (244KB, verified on disk 2026-09-09). This is the fixed built-in sound for Sunrise + all extras at-time notifications. See ISSUES #23 for the full 3-category sound mapping.
2. Implement per the sketch in the issue (schedule/prayer-aware `getNotificationSound`, dedicated Android channel with a fresh id — channel sounds are immutable after creation, `athan_*_v2` pattern, app.json `sounds` array entry, `initializeNotifications` channel creation).
3. `yarn validate` green; tests for the new mapping (the 5 vs everything-else boundary is the critical assertion).
4. Commit (version-bumped, silent What's New), push the branch, merge to uat per tonight's standing flow (owner has authorized commit/push/merge for these autonomous sessions).

## Task C — ISSUES #24 splash minimization (same branch)

The splash currently holds through the entire first-launch network fetch because `SplashScreen.hideAsync()` gates on `contentExists` (which requires sync completion). The spinner (ActivityIndicator) already exists in the `!sequenceReady && state === 'loading'` branch but the user never sees it. The owner wants: "hide the splash as fast as possible, show the spinner as soon as possible."

1. Read `app/index.tsx` lines 96-115 (the splash gate effect) and `app/_layout.tsx` (the `SplashScreen.preventAutoHideAsync()` call). Understand the two paths:
   - Warm-cache (99% of launches): sequence hydrates synchronously from MMKV, content exists at first commit, splash hides on the first complete frame — ALREADY FAST, must not regress.
   - Cold/fresh-install: no cache, sync fetches from the API, `state === 'loading'` until data arrives — splash currently holds the ENTIRE time. THIS is what changes.
2. Design: on the cold path, dismiss the splash as soon as the app's own chrome + spinner render (first JS frame), not when content exists. The warm path keeps its current gating (Masjid icon + content + splash-holds-for-complete-first-frame, the 1.22.5 fix). The distinction may need a "content exists at mount" check: if `sequenceReady` is false and `state === 'loading'` at mount time (cold), hide splash immediately; if content hydrated synchronously (warm), keep the current reveal-ready gate.
3. Verify on the connected devices:
   - 3T (slowest Android): fresh install (uninstall + install a build from this branch), confirm the spinner is visible during fetch, confirm prayer times render after sync, confirm no crash or flash-of-empty-content.
   - iPhone XS: same fresh-install check.
   - Warm-cache relaunch on both: confirm splash is still brief and the first revealed frame is complete (no icon pop-in regression from 1.22.5).
4. `yarn validate` green; commit with a clear message describing the two-path design.

## Session end

1. Update this file's tracker below and the ISSUES entries with dated outcomes.
2. Report: what was done, evidence, blockers.
3. Hand the owner this paste-block for session 2:

```
Read ai/AGENTS.md and act as Orchestrator. Then read ai/prompts/large-screen-adaptation.md —
it is the full brief and live tracker for this feature. FIRST ACTION: create the feature
branch from uat (feat/large-screen-adaptation). Full autonomous authority as scoped in the
file: install simulators, build, screenshot/video loops, iterate without check-ins; keep
every artifact inside the repo. Constraints: adapt-not-redesign (decided — do not
re-litigate), zero regression on phones, no new dependencies, version bump every commit,
git write operations per the standing flow. Do NOT touch the alarmClock backport — session
3 of 3. At session end: hand the owner the paste-block from
ai/prompts/alarmclock-backport.md.
```

## TRACKER

| Step | Status |
| --- | --- |
| A1 Branch created, EAS preview build kicked | not started |
| A2 3T: fresh install, Sunrise one-line, stable across relaunches | not started |
| A3 ISSUES #22 verdict recorded | not started |
| B1 Extras audio located (or blocker documented) | not started |
| B2 5-vs-rest sound mapping implemented + channels + app.json | not started |
| B3 validate green, committed, pushed, merged to uat | not started |
| C1 Splash two-path design implemented (cold = spinner ASAP, warm = unchanged) | not started |
| C2 Verified on 3T + XS: spinner visible on fresh install, warm path unchanged | not started |
| Session end: tracker + report + widescreen paste-block handed | not started |
