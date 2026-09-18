# Plan: Session 12. SDK 58 beta upgrade + alarmClock + largeIcon

| Field | Value |
| --- | --- |
| Brief | `ai/plans/SDK58-PROGRAMME.md` §12 |
| Planned at | `a2498afa` (version 1.27.220), 2026-09-18 |
| Planned by | Planning session on 2026-09-18, GLM 5.3 (design review: Software Architect on GLM 5.3); resumed the same day after the planning skeleton |
| Needs first | nothing (the env refresh is DONE: macOS 27 and Xcode 27.0 were the owner's; this planning session upgraded the `android-studio` cask to 2026.1.4.7 and verified build-tools 37.0.0 and platform android-37.0 present; the pre-flight checks all of it) |
| Steps | 5, each one branch, one commit, one version; then the device proof, section 7 |
| Device | OnePlus 3T with a local production build (real prayer times), then the final Asr-next mock build |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

`uat-2` runs the Expo SDK 58 beta (expo ~58.0.0-preview.3, RN 0.88.0-rc.0) with the full package wave
the beta prescribes, every notification the app schedules asks Android for alarm-clock class delivery
(the fix upstream #49687 ships for the OEM deferral ISSUES #17 measured on the 8T and Find X8), and
every Android notification carries the owner-chosen large icon. Everything else is visually and
behaviourally identical, proven on the 3T. The owner would notice: prayers that never drift late on
battery-aggressive phones, a mosque icon beside every notification, and, to observe honestly, a small
alarm-clock icon in the status bar while alarms are armed (the platform offers no way to hide it; the
owner asked, the planner checked, the answer is no: it is the system's own indicator for
`setAlarmClock` alarms, with no suppressing API).

The owner's rules that apply, quoted:

- `ai/plans/SDK58-PROGRAMME.md`, programme rules, 2026-09-18: "Bleeding edge on purpose. `uat-2` moves
  to the SDK 58 beta now and rides it. No store or production release from the session 12 merge until
  session 16 (stable re-pin) is DONE and RN 0.88 is out of release candidate."
- Same source, rule 6: "All dependencies move to latest compatible versions in session 12,
  expo-managed and third-party, every package named explicitly. Never `npx expo install --fix`." The
  owner narrowed this while planning: strictly the SDK wave; the everything-to-latest sweep is its own
  later session (section 2.1, decision 5).
- The owner, 2026-09-18, on the delivery class: "We want to always, always to be alarmed. Okay, alarm
  clock always." Silent alerts and reminders included.
- The owner, 2026-09-18, on the large icon: the full-square art (`icon-ios.png`), and "I want to see a
  before and after, so take screenshots of both. I don't know, maybe I will revert to this."
- The standing rules: no visual change beyond the large icon, `releases.json` untouched, EAS and the
  Expo MCP read-only, the API key never committed, nothing of OpenCode's changed.

## 2. Decisions

### 2.1 Taken

1. **Alarm-clock delivery for EVERY alert and reminder, silent included.** Owner, 2026-09-18,
   answering this session's first question. One class everywhere: an alert the phone defers is an
   alert missed, whatever it sounds like. Recorded in `ai/prompts/README.md`.
2. **The status-bar alarm icon stays; it cannot be hidden.** The owner asked to hide it if possible;
   the planner's answer: `AlarmManager.setAlarmClock` arms make the system show its own alarm icon in
   the status bar, and no app API suppresses that while the alarm-clock class is used. The device
   proof observes and reports what the 3T actually shows; the owner sees the proof's screenshots
   description and can order the whole adoption reverted (the rollback is `uat-2`'s merge revert, per
   the programme's risk row).
3. **The large icon is `assets/icons/config/icon-ios.png`.** Owner, 2026-09-18, from the vision read
   of both candidates at 64dp (the adaptive-icon foreground collapses to a speck). The device proof
   captures the notification shade before and after and leaves both screenshots at paths given to the
   owner, who looks with their own eyes and may revert.
4. **`react-native-edge-to-edge` stays, at 1.8.2; the built-in switch is its own later session.**
   Owner, 2026-09-18: only the 3T can verify today, and the package's navigation-bar-contrast setting
   guards Android 10+ behaviour this session cannot screenshot. The later session waits on an Android
   10+ device; queued in `ai/plans/README.md`'s waiting list.
5. **Dependency scope: strictly the SDK wave.** Owner, 2026-09-18: the bump-everything-to-latest
   session is separate and later. So `jotai` stays 2.20.3, `@biomejs/biome` 2.5.13, `test-renderer`
   1.2.0, `husky` 8.0.3, `lint-staged` 15.5.2; `jest`/`@types/jest`/`typescript` stay deliberately
   ahead of the SDK's expectations. Queued in the waiting list.
6. **The delivery value is one shared constant, `ALARM_CLOCK_DELIVERY`.** Planner, adopting the design
   review's finding 12: expo-notifications 58 throws `InvalidArgumentException` on any delivery
   string but the two constants, so a typo at one of two literals would refuse every Android schedule
   and read as a phone refusal. One constant in `shared/notifications.ts` feeds both trigger sites.
7. **The jest resolution map targets file paths, not bare specifiers.** Planner, adopting finding 8:
   a `react-native/src/private/$1` target re-enters exports-respecting resolution and fixes nothing.
   The spike proved the file-path form.
8. **The two RN 0.88 type migrations are exactly as the spike found them.** Planner: `ViewInstance`
   for the list ref (the strict types type `View` as a function component, so `useRef<View>` holds the
   wrong thing), and a 3-tuple `transformOrigin` with `z = 0` (the CSS default; scaleY ignores z, so
   the pivot does not move).
9. **The design review ran before the steps were written.** Software Architect (GLM 5.3), 2026-09-18:
   13 findings, "design sound". All folded in: the icon decision moved to the owner (decision 2), the
   shade before/after pair added to the proof, the 3T dumpsys baseline corrected (the 3T is already
   exact: `window=0 flags=0x5` today, `flags=0x9` after; the brief's "was windowed +1h" described the
   8T/Find X8, not the 3T), the bottom-sheet/gesture-handler-3 device check added to the proof, and
   the `USE_EXACT_ALARM` Play-policy note carried to the records.

### 2.2 The executor must not decide

At minimum the standing five:

- any anchor count other than 1;
- a test failing that the plan does not expect;
- a break printing `BREAK NOT APPLIED`;
- a reviewer finding the plan's section 10 does not answer and that does not meet all three
  conditions in `EXECUTOR-BRIEF.md` section 4, item 8;
- anything touching visuals, prayer times, `releases.json`, `uat` or EAS.

And this session's own:

- **A tsc error appears anywhere in the tree after step 1's change that step 1's migrations do not
  cover.** The spike ran `npx tsc --noEmit` clean on the whole tree after the wave; a new error means
  the tree differs from the spike. Ask: "The plan does not say what to do with a strict-types error
  in `<file>`. What should it be?"
- **A sheet (Settings, the sound selector, an alert menu) does not open or animate on the 3T after
  the wave.** `@gorhom/bottom-sheet` 5.2.14 sits on gesture-handler 3.2.1 across a major; the peer
  range is satisfied but only the device can prove it. Ask: "The `<name>` sheet breaks under
  gesture-handler 3. What should it be?"
- **The dumpsys reading after adoption is not `window=0` with the alarm-clock flag (`flg=0x9`).**
  Ask: "The alarm dump shows `<reading>` where the plan predicts `window=0 flg=0x9`. What should it
  be?"
- **`expo prebuild` fails on a missing Android SDK component.** Ask: "Prebuild wants `<component>`.
  Install it into `~/Library/Android/sdk`, or something else?" (build-tools 37.0.0 and platform
  android-37.0.0 are verified present; the plan expects it not to fire.)
- **`yarn install` warns of an unmet peer dependency the plan's table does not name.** Ask with the
  warning's text.
- **The owner, shown the before/after shade screenshots, wants the large icon reverted.** That is
  NEEDS REPLAN with the owner's words; nothing is reverted by the executor's own hand.

## 3. Pre-flight

Save as `$TMPDIR/preflight-12.sh` and run as `bash $TMPDIR/preflight-12.sh <k>`, where `<k>` is the
first step in section 6's checklist not ticked DONE:

```bash
#!/bin/bash
set -u
k="${1:-1}"
cd /Users/muji/repos/rn.athan.uk || { echo "PREFLIGHT FAIL: not the repo"; exit 1; }
[ "$(git branch --show-current)" = "uat-2" ] || { echo "PREFLIGHT FAIL: not on uat-2"; exit 1; }
git fetch origin uat-2 || { echo "PREFLIGHT FAIL: fetch"; exit 1; }
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "PREFLIGHT FAIL: origin/uat-2 not merged"; exit 1; }
status=$(git status --porcelain)
bad=$(printf '%s' "$status" | grep -vE 'ai/plans/README\.md|ai/plans/12-sdk58-beta-upgrade/(PLAN|LOG)\.md' || true)
[ -z "$bad" ] || { echo "PREFLIGHT FAIL: unexpected dirty files:"; echo "$bad"; exit 1; }
ver=$(node -p "require('./package.json').version")
echo "version $ver"
node -e "const a=require('./package.json').version.split('.').map(Number),b=[1,27,220];if(a[0]<b[0]||(a[0]===b[0]&&(a[1]<b[1]||(a[1]===b[1]&&a[2]<b[2]))))process.exit(1)" || { echo "PREFLIGHT FAIL: version below 1.27.220"; exit 1; }

# The env refresh (SDK58-PROGRAMME.md): done by 2026-09-18, checked here so it cannot rot quietly
[ "$(sw_vers -productVersion | cut -d. -f1)" -ge 27 ] || { echo "PREFLIGHT FAIL: macOS below 27"; exit 1; }
xcodebuild -version >/dev/null 2>&1 || { echo "PREFLIGHT FAIL: no Xcode"; exit 1; }
brew list --cask --versions android-studio 2>/dev/null | grep -q 2026.1.4.7 || { echo "PREFLIGHT FAIL: android-studio cask not 2026.1.4.7"; exit 1; }
[ -x "$HOME/Library/Android/sdk/build-tools/37.0.0/aapt" ] || { echo "PREFLIGHT FAIL: build-tools 37.0.0 missing"; exit 1; }
[ -d "$HOME/Library/Android/sdk/platforms/android-37.0" ] || { echo "PREFLIGHT FAIL: platform android-37.0 missing"; exit 1; }
node -e "const v=process.versions.node.split('.').map(Number);if(v[0]<24||(v[0]===24&&v[1]<3))process.exit(1)" || { echo "PREFLIGHT FAIL: node below 24.3"; exit 1; }
[ "$(adb -s 8f7ada76 get-state 2>/dev/null)" = "device" ] || { echo "PREFLIGHT FAIL: 3T not connected"; exit 1; }

# Anchors: every one for steps k..5 counts exactly 1 (TEMPLATE.md section 3's command)
A=ai/plans/12-sdk58-beta-upgrade/scripts/anchors
anchor_src() {
  case "$1" in
    1-1|1-2|1-3|1-4|1-5|1-6|1-7|1-8|1-9|1-10) echo package.json;;
    1-11|1-12|1-13) echo components/prayer/List.tsx;;
    1-14) echo components/ui/RamadanDecorations.tsx;;
    1-15) echo jest.config.js;;
    1-16) echo jest.components.setup.js;;
    1-17) echo components/prayer/__tests__/List.test.tsx;;
    2-1) echo shared/notifications.ts;;
    2-2|2-3) echo device/notifications.ts;;
    2-4) echo device/__tests__/notifications.test.ts;;
    3-1|4-1|4-2) echo app.json;;
    5-1|5-2) echo ai/AGENTS.md;;
  esac
}
fail=0
for f in "$A"/*.txt; do
  step="${f##*/}"; step="${step%%-*}"
  [ "$step" -lt "$k" ] && continue
  src=$(anchor_src "$(basename "${f##*/}" .txt)")
  count=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$f" "$src")
  [ "$count" = "1" ] || { echo "PREFLIGHT FAIL: anchor ${f##*/} counts $count in $src"; fail=1; }
done
[ "$fail" = 0 ] || exit 1
echo "PREFLIGHT OK"
```

An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### Code map

| File | What it is | This plan |
| --- | --- | --- |
| `package.json` / `yarn.lock` | The dependency tree | Step 1: the wave |
| `components/prayer/List.tsx` | The day's prayer rows; measures its window place for the overlay | Step 1: idle-callback migration, `ViewInstance` |
| `components/prayer/__tests__/List.test.tsx` | The suite covering the list's rows and measurements | Step 1: one test appended |
| `components/ui/RamadanDecorations.tsx` | Seasonal decorations; the lantern wire pivots by scaleY | Step 1: the 3-tuple |
| `jest.config.js` | The two Jest projects and their transforms | Step 1: the src/private map |
| `jest.components.setup.js` | The components project's globals and library mocks | Step 1: the idle pair |
| `shared/notifications.ts` | Notification content, channels, the native-call timeout | Step 2: `ALARM_CLOCK_DELIVERY` |
| `device/notifications.ts` | The two scheduling calls into expo-notifications | Step 2: both triggers carry delivery |
| `device/__tests__/notifications.test.ts` | Identifiers, channel wiring, trigger instants | Step 2: two tests appended |
| `app.json` | App config incl. the notifications plugin and widget entries | Steps 3 and 4 |
| `shared/__tests__/nativeConfig.test.ts` | New: reads `app.config.ts`'s plugin config | Steps 3 and 4 |
| `ai/AGENTS.md` §2 | The stack table and the ahead-pins table | Step 5 |

### How the pieces interact

Both trigger sites sit behind `withNativeTimeout` inside the scheduling lock
(`stores/notifications.ts`); every caller (launch sync, return from background, the headless
background task, the post-sync refreshes, the alert-sheet commit) funnels through the same two
functions in the same order. The delivery field changes no sequence, holds no state and stores
nothing: it rides the existing call. The stored record's `id` comes back unchanged, so the
reconciliation sweep and the repair paths see the same world.

### Existing tests that cover this code

`device/__tests__/notifications.test.ts`: identifier determinism, the identifier echo, channel wiring
per prayer/alert type, and the trigger instants (ISSUES #29: the row's own moment). Step 2's tests
join the last family. `components/prayer/__tests__/List.test.tsx`: which rows draw, when the list
measures, when it re-measures. Step 1's test joins the last family.

### What the spike proved (planning session, 2026-09-18, scratch worktree since removed)

- The whole tree on the wave passes `npx tsc --noEmit` (0 errors), `npx biome check .
  --error-on-warnings` (clean) and `npx jest --silent --coverage` (160 suites, 4533 passed + 2
  skipped in the bare worktree; in the main checkout, whose gitignored `android/` and `ios/` exist,
  the two conditional audioMatrix tests run instead of skipping, so 4535 of 4535).
- `TZ=America/New_York` full suite: green.
- Red checks: the two delivery tests fail `Expected: "alarmClock" / Received: undefined`; the
  nativeConfig tests fail `Expected: "./assets/icons/config/icon-ios.png" / Received: undefined` and
  the nested-form assertion fails `Expected: true / Received: false`; step 1's idle test at red (the
  SDK 57 tree) fails at `jest.spyOn(globalThis, 'requestIdleCallback')` with "Cannot spy the
  requestIdleCallback property because it is not a function; undefined given instead" (no idle pair
  exists anywhere in the SDK 57 jest setup; verified in `@react-native/jest-preset@0.86.3` and
  `jest-expo@57.0.5` source).
- Breaks: all ten substitutions the steps name were dry-run in the spike and each failed its named
  tests.
- `npx expo install --check` against the wave prints: `@types/jest@30.0.0 - expected 29.5.14`,
  `jest@30.5.1 - expected ~29.7.0`, `typescript@7.0.2 - expected ~6.0.3`, and nothing else
  (reanimated 4.6.0 and worklets 0.12.2 are SDK 58's own pins now).

### Spike lessons that shaped the steps

- RN 0.88's `StyleSheet.create` inference collapses to the imprecise supertype when ANY entry fails
  the styles constraint: the 2-tuple `transformOrigin` alone caused 12 cascade errors on every
  `styles.sprite` use. Fix the tuple, everything passes.
- `jest.components.setup.js` is loaded by Node directly: TypeScript annotations do not parse there.
- A test-loading config must set `EXPO_PUBLIC_WIDGETS` itself: flags tests delete the variable in the
  same worker, and the spike watched the suite fail only in full runs (order dependence).
- The idle mock's cancel must actually cancel: fake timers hand back timer objects, so a numeric
  `clearTimeout(handle)` cancels nothing and a superseded re-measure still fires.

### Why the obvious simple fix is wrong, where it applies

- Setting `delivery: 'alarmClock'` only on at-time triggers (leaving reminders best-effort) is wrong
  by the owner's ruling: a deferred reminder is a missed reminder.
- Opting RN's strict types out via `customConditions: ["react-native-legacy-deep-imports"]` is wrong:
  the programme's verified facts record the opt-out is removed after 0.88, so it only postpones the
  migration onto a harder upgrade.
- Dropping `react-native-edge-to-edge` now (the README of 1.8.x recommends the built-in flag on
  RN ≥0.86) is wrong this session: the 3T cannot verify the Android 10+ navigation-bar behaviour the
  package's settings guard (owner, 2026-09-18; decision 4).

## 5. Design

**The invariant, one sentence a test can check:** every notification request the app sends to
`scheduleNotificationAsync` carries `delivery` equal to `'alarmClock'`, at-time and reminder alike.

Alternatives rejected:

- **Per-site string literals** (the design the brief sketched): rejected for the shared constant
  (review finding 12; a typo refuses every Android schedule and masquerades as a phone refusal).
- **`alarmClock` only for Sound alerts**: rejected by the owner (decision 1); silent alerts deferred
  are missed.
- **Keeping `InteractionManager` via the legacy deep import**: rejected; the API is removed, not
  deprecated; the DEV getter throws.

Concurrency trace: every caller of `addOneScheduledNotificationForPrayer` and
`addOneScheduledReminderForPrayer` (launch, return-to-foreground, headless background task, post-sync
refresh, alert-sheet commit, the repair pass) reaches the same two trigger literals inside the same
scheduling lock. Before the change each call sends a trigger without `delivery`; after, the identical
call sends one field more. No new awaits, no reordering, no stored state. The alarm-clock class
changes when Android fires the alarm, never what the app does around the call.

Design review: Software Architect (GLM 5.3), 2026-09-18, isolation none (read-only by absolute path).
Verdict "design sound" with 13 findings, all folded into this plan (decisions 2, 6, 7; the proof's
shade pair, dumpsys baseline, sheet check and alarm-count row; the records' Play-policy note). The
findings and their consequences are recorded in this folder's `LOG.md`.

## 6. Steps

- [x] Step 1: The SDK 58 package wave and the RN 0.88 migrations (specified) — `steps/1-sdk58-package-wave.md` — DONE in a7cad721
- [ ] Step 2: Every notification moves to alarm-clock delivery (specified) — `steps/2-alarm-clock-delivery.md`
- [ ] Step 3: The Android notification large icon (specified) — `steps/3-notification-large-icon.md`
- [ ] Step 4: The widget entries move to the nested ios form (specified) — `steps/4-nested-widgets-config.md`
- [ ] Step 5: ai/AGENTS.md stack table re-derived against SDK 58 (specified) — `steps/5-agent-md-stack-docs.md`

Each step: anchor check, branch, red, change, green, breaks, version, commit, review, merge, done-when.
The five are ordered so `uat-2` is green after each: the wave first (everything else compiles against
it), the delivery adoption on the installed SDK, then config, then docs.

## 7. Device proof

Work on the 3T (`8f7ada76`), which the mock build of 1.27.159 has run since session 5. The phone
stays unlocked with Athan open and "Stay awake" on (owner's standing state); nothing in this proof
changes that.

### 7.0 Before any device work

1. In `/Users/muji/repos/rn.athan.uk` on `uat-2` (all five steps merged), run `yarn install`. The
   main checkout's `node_modules` must match the merged `yarn.lock` before any build script runs
   (they link it). Expected end: `Done in …`.
2. Read the fingerprint policy the updates client will use (programme §12 step 9), capturing npx's
   own exit code rather than grep's:

   ```bash
   npx expo config --type prebuild > ~/athan-device-sweep/session12/runtimeversion.txt 2>&1; echo "exit $?"
   grep -i runtimeversion ~/athan-device-sweep/session12/runtimeversion.txt
   ```

   Expected: `exit 0` and no grep output (neither `app.json` nor `eas.json` sets a `runtimeVersion`
   policy; the SDK's `balanced` fingerprint default changes nothing for a project that never opted
   into fingerprint runtime versions). Record both lines in LOG.md; a non-zero exit reads the same as
   "no policy", which is why the exit is the tell.

### 7.1 The shade BEFORE (the owner's first screenshot)

The current build's notification look is the baseline the owner compares against. Do not install
anything yet.

1. Cold-launch the app (`adb -s 8f7ada76 shell am kill com.mugtaba.athan`, then the launcher intent).
   The mock seeds Asr 60 to 119 seconds after each download, so a silent notification is due within
   two minutes with no clock change.
2. Arm the wait as a background loop (never a foreground sleep over 15 seconds), started within 15
   seconds of the launch, replacing `<T>` with 125 past the launch's epoch seconds:

   ```bash
   T=$(( $(date +%s) + 125 )); until [ "$(date +%s)" -ge "$T" ]; do sleep 10; done
   ```

   Run it in the background and wait for its notification. Then open the shade with
   `adb -s 8f7ada76 shell cmd statusbar expand-notifications` and take
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-device-sweep/session12/shade-before.png`
   and
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-device-sweep/session12/shade-before-open.png`
   within 5 seconds of opening it (it auto-collapses).
3. Ask `vision` (GLM 5.3 Flash), prompt: "Look at
   /Users/muji/athan-device-sweep/session12/shade-before-open.png. Describe the notification's left
   side: is there any square image beside the title, and what does the small icon look like? Reply in
   two sentences."
4. Expected: no large square image; only the small white glyph. Record vision's two sentences in
   LOG.md.

### 7.2 The production build

```bash
zsh ~/athan-device-sweep/session3/bin/build-prod.zsh uat-2 ~/athan-device-sweep/session12/athan-sdk58-prod.apk
```

Run in the background with its log; success ends `BUILD-PROD OK` (about 4 minutes; the script does
its own `prebuild --clean`, which regenerates `android/` and `ios/` in its throwaway worktree at the
SDK 58 template). Then grep the build log for R8 missing-class warnings:
`grep -c "Missing class" <build log>` — record the count (0 expected; any number above 0 is recorded,
not fixed: programme rule 8 keeps R8 on unless the first build misbehaves).

Install keeping the owner's data: `adb -s 8f7ada76 install -r
~/athan-device-sweep/session12/athan-sdk58-prod.apk`. Verify:
`adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan | grep -E "versionName|targetSdk" | head -2`
records the new version (compared: it is the merged head's version) and the new targetSdk (recorded,
not compared: the SDK 58 template's value is whatever prebuild emitted, and the plan does not predict
it). One throwaway launch (the What's-New note appears and marks itself shown): HOME, `am kill`,
launch again.

### 7.3 The alarm dump (the alarm-clock class, and the count)

1. `adb -s 8f7ada76 shell dumpsys alarm | grep -A2 "com.mugtaba.athan}" > ~/athan-device-sweep/session12/alarms-after.txt`.
   Also `adb -s 8f7ada76 shell dumpsys alarm | grep -c "com.mugtaba.athan"` for the row count.
2. Expected, per alarm row: `when=<real prayer instant> whenElapsed=… window=0 … flg=0x9`. The 3T
   stored `flg=0x5` before (ISSUES #17's bare-expo control measured it exactly); 0x9 adds the
   alarm-clock flag and is the adoption's signature. `window=0` it already had. The row count equals
   the app's armament (0 with every alert off, more with the owner's preferences; record both the
   count and, from the app's logcat
   `adb -s 8f7ada76 logcat -d -s ReactNativeJS | grep -c "Scheduled:"`, the same number).
3. Any `window=` other than 0, or `flg=` other than 0x9 on a row whose app is ours, is the section
   2.2 STOP.
4. Every 3T dump also lists one app alarm at `when 2104803640505` (year 2036, not identified): it is
   expected and named here so it is not a surprise.

### 7.4 A prayer fires at the minute, foreground, silent

1. Read `alarms-after.txt` and pick the SOONEST armed alarm (if none is armed, arm one: open the app,
   tap the bell of the next prayer on the Standard page, choose Silent, Done; then re-read the dump).
2. With the app in the FOREGROUND, drive the clock to just before that alarm (the safety ritual:
   `adb -s 8f7ada76 shell settings put global auto_time 0`, then
   `adb -s 8f7ada76 shell service call alarm 2 i64 <epoch ms of 40 seconds before the alarm>`), and
   wait in the same background loop shape (10-second passes, `<T>` the alarm's epoch seconds plus
   10):

   ```bash
   T=<alarm epoch seconds + 10>; until [ "$(date +%s)" -ge "$T" ]; do sleep 10; done
   ```

   Never more than 2 minutes of waiting: the clock IS the wait.
3. At the minute: `adb -s 8f7ada76 shell cmd statusbar expand-notifications` and
   `devcheck.py shot ~/athan-device-sweep/session12/fire-foreground.png`. Logcat holds the delivery:
   `adb -s 8f7ada76 logcat -d | grep -E "NotificationsService|NotificationService" | tail -5`.
4. Ask `vision`: "Look at /Users/muji/athan-device-sweep/session12/fire-foreground.png. Describe the
   notification: its title, and exactly what appears on its left side (any square image? describe
   it). Reply in three sentences." Expected: the prayer's name as the title, and the mosque art as a
   square image on the left.
5. Restore the clock: `adb -s 8f7ada76 shell settings put global auto_time 1`.

### 7.5 The shade AFTER (the owner's second screenshot)

With the notification from 7.4 still posted (or a second Silent fire if it expired), capture
`~/athan-device-sweep/session12/shade-after-open.png` exactly as in 7.1. Ask `vision` the same
question as 7.1's. Expected: a square mosque image on the left that was not there before.

Then give the owner both paths, in the execution report and in LOG.md:
`/Users/muji/athan-device-sweep/session12/shade-before-open.png` and
`/Users/muji/athan-device-sweep/session12/shade-after-open.png`, with the sentence "the owner looks
at these two files and may order the large icon reverted" (section 2.2's last stop). The owner
receives no screenshots in chat; they open the files themselves.

### 7.6 The status-bar alarm icon (disclose and observe)

With alarms armed (7.3's state), collapse the shade and take
`devcheck.py shot ~/athan-device-sweep/session12/statusbar-armed.png`. Ask `vision`: "Look at
/Users/muji/athan-device-sweep/session12/statusbar-armed.png. List every icon in the status bar's
right cluster, right to left. Is there an alarm-clock icon (a clock with hands)? Reply with the list
and a yes/no." Record the answer. Whatever it is, it is a disclosure, not a gate: the owner's
decision (2.1, decision 2) was taken knowing the icon may show; the 3T's answer is reported so the
owner knows what their own phone does.

### 7.7 Sheets, the countdown bar toggle and the overlay (the review's device checks)

1. Sheets under gesture-handler 3 (review finding 7): open Settings (the Masjid icon), the sound
   selector (Change athan) and one prayer's alert sheet, closing each before the next. One
   screenshot of the open Settings sheet, and `vision`: "Look at
   /Users/muji/athan-device-sweep/session12/sheet-settings.png. Is a bottom sheet visible with a
   title and rows? Any visual glitch (missing background, misplaced rows)? Two sentences." Expected:
   a normal sheet, no glitch.
2. The idle-callback re-measure (review finding 10): in Settings, toggle "Show countdown bar" off,
   close the sheet, tap a prayer row to open the overlay, and screenshot
   `overlay-after-toggle.png`; `vision`: "Look at
   /Users/muji/athan-device-sweep/session12/overlay-after-toggle.png. Does the highlight box point
   at the tapped row's position on screen? One sentence." Expected: yes (the re-measure ran).
3. Nothing here is a clock change; the phone's own time is untouched.

### 7.8 The phone left behind

`zsh ~/athan-device-sweep/session3/bin/build-mock.zsh uat-2
/Users/muji/repos/rn.athan.uk/mocks/simple.ts
~/athan-device-sweep/session12/athan-sdk58-mock.apk`
(success ends `BUILD-MOCK OK`), `adb -s 8f7ada76 install -r` it, one throwaway launch, then leave:
automatic time ON (verify `adb -s 8f7ada76 shell settings get global auto_time` prints `1`), the
phone unlocked, Athan open, the mock build of the merged `uat-2` head with Asr next at every opening.
The production APK stays at `~/athan-device-sweep/session12/` for the audit.

## 8. Records

### Findings text

Add to `ai/features/uat-2/AUDIT-FINDINGS.md`, under a new heading `# Session 12 of the queue: the
SDK 58 beta wave, alarm-clock delivery and the large icon, <date>`:

> `uat-2` moved to the SDK 58 beta (expo <EXPO_VERSION>, RN 0.88.0-rc.0) with the wave's full pin
> set, and every notification the app schedules now asks Android for alarm-clock class delivery
> (upstream #49687; ISSUES #17's fix). Every Android notification carries the full-square mosque
> art as its large icon (owner's asset choice, from a vision read of both candidates at 64dp).
> RN 0.88's API removals this repo met: `InteractionManager.runAfterInteractions` (the prayer
> list's re-measure moved to the `requestIdleCallback` pair) and the 2-tuple `transformOrigin`
> (now `['50%', '0%', 0]`; RN 0.88 invariants exactly three values). Jest 30 consults RN's
> narrowed `exports` allow-list, so the `react-native/src/private/*` deep imports RN's own
> virtualized-lists still makes are mapped to files by path in `jest.config.js`.
>
> Measured on the 3T, production build <VERSION>: every armed alarm reads `window=0 flg=0x9` (was
> `flg=0x5`: exact before, alarm-clock class now); a prayer fired at the minute in the foreground
> with the banner, the mosque large icon on the notification's left and no deferral; the alarm row
> count equalled the app's armament (<COUNT> rows, <SCHEDULED> logged schedules); R8 release build
> with <R8_MISSING> missing-class warnings; sheets, the countdown-bar toggle re-measure and the
> overlay all correct under gesture-handler 3. The status-bar alarm icon: <ICON_ANSWER>. The
> notification shade before/after pair is at `~/athan-device-sweep/session12/shade-before-open.png`
> and `shade-after-open.png` for the owner's own eyes. jest totals <TESTS_AFTER>. Known carried
> notes: `USE_EXACT_ALARM` is Play-policy reserved for alarm-like apps, which this app is; the
> store release gate stays closed until session 16.

Every placeholder in angle brackets is a value the executor measures.

### Table rows

The executor sets this row to EXECUTED. The auditor, on PASS, sets `ai/plans/README.md`'s row 6 to
DONE and applies this exact cell text as a new row in `ai/prompts/README.md`'s table:

`| 12 | **SDK 58 beta upgrade + alarmClock + largeIcon**: the beta wave, alarm-clock delivery on every notification, the mosque large icon | \`ai/plans/SDK58-PROGRAMME.md\` §12 | **DONE** <date>, <versions>: RN 0.88.0-rc.0, every alarm `window=0 flg=0x9`, the mosque icon on every notification; proven on the 3T |`

### Docs commit

The `executed` docs commit message: `<VERSION> - docs(plans): session 12 executed: SDK 58 wave,
alarm-clock delivery, the large icon`.

### The planning handoff (why the tree is clean when execution starts)

The planning session's own final commit lands this whole folder (PLAN.md, steps/, scripts/ and its
anchors, PROMPT.md, LOG.md), the `ai/plans/README.md` row change and the `ai/prompts/README.md`
decisions section, so the only files that can be dirty when an execution session begins are the
three the pre-flight allows (`ai/plans/README.md`, this folder's `PLAN.md` and `LOG.md`).

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session
pushes `uat-2` after a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| tsc error in code no step touched, after step 1 | An RN 0.88 strict-types change the spike did not meet (its tree ran clean) | STOP; section 2.2's question |
| A full-suite failure naming no plan test after step 1 | The wave moved a library's mock or runtime | STOP; give the failing names |
| `BREAK NOT APPLIED` on any step's substitution | The plan's text no longer matches the file | Every step of this plan is `(specified)`, so per `EXECUTOR-BRIEF.md` section 7's own row this table wins: STOP and ask, with the label that printed |
| The 3T dump shows `window=` other than 0 or `flg=` other than 0x9 on our rows | The delivery class did not reach the alarm manager | STOP; section 2.2's question |
| A sheet does not open or animates wrongly | bottom-sheet 5.2.14 on gesture-handler 3.2.1 (review finding 7) | STOP; section 2.2's question |
| `build-prod.zsh` prints `FAILED` | Build env or template issue | STOP; quote the line |
| The phone shows the error screen, or adb hangs twice | Device | STOP; ask the owner to reboot the phone |
| `yarn install` resolves an unexpected peer warning | The wave drifted (a 58.0.x patch landed mid-row) | STOP with the warning text |
| The owner wants the large icon reverted after seeing 7.5 | The owner's reserved right (decision 3) | NEEDS REPLAN; the owner's words are the reason |

Anticipated review fixes, word for word (the only fixes the executor may apply to what this plan
fixed, beyond `EXECUTOR-BRIEF.md` section 4 item 8's three conditions, which are written there and
never restated here):

- A reviewer asking for the jest.config comment to be shortened or rewrapped: apply it; it changes no
  instruction anyone acts on.
- A reviewer asking for a more precise word in a commit message body: apply it, keeping the version
  prefix and the Tests line.
- A reviewer asking that the new tests' names be made more specific where the plan's rows already fix
  what they prove: do NOT apply; the plan's names are the contract. STOP if it is pressed.

Stopping part-way, per step (files to `git checkout --`, new files to delete; `app.json` and
`package.json` are restored by the executor brief's 4a in every case):

- Step 1: restore `package.json`, `components/prayer/List.tsx`, `components/prayer/__tests__/List.test.tsx`,
  `components/ui/RamadanDecorations.tsx`, `jest.config.js`, `jest.components.setup.js`; restore
  `yarn.lock` with `git checkout -- yarn.lock` then `yarn install` (the tree must match the lock
  before the next step or build); delete nothing (no new files).
- Step 2: restore `shared/notifications.ts`, `device/notifications.ts`, `device/__tests__/notifications.test.ts`.
- Step 3: restore `app.json`; delete `shared/__tests__/nativeConfig.test.ts`.
- Step 4: restore `app.json`, `shared/__tests__/nativeConfig.test.ts`.
- Step 5: restore `ai/AGENTS.md`.

## 11. Subagents in this plan

| Step | Agent type | Model | Isolation | Why | Prompt |
| --- | --- | --- | --- | --- | --- |
| Step 1 | `Code Reviewer` (a `general` subagent) | GLM 5.3 | `worktree` | The commit's review | `steps/1-sdk58-package-wave.md`, part 9 |
| Step 2 | `Code Reviewer` (a `general` subagent) | GLM 5.3 | `worktree` | The commit's review | `steps/2-alarm-clock-delivery.md`, part 9 |
| Step 3 | `Code Reviewer` (a `general` subagent) | GLM 5.3 | `worktree` | The commit's review | `steps/3-notification-large-icon.md`, part 9 |
| Step 4 | `Code Reviewer` (a `general` subagent) | GLM 5.3 | `worktree` | The commit's review | `steps/4-nested-widgets-config.md`, part 9 |
| Step 5 | `Code Reviewer` (a `general` subagent) | GLM 5.3 | `worktree` | The commit's review | `steps/5-agent-md-stack-docs.md`, part 9 |
| Docs commit | `Code Reviewer` (a `general` subagent) | GLM 5.3 | `worktree` | The `executed` docs commit | `EXECUTOR-BRIEF.md` section 4b, item 5 |
| 7.1, 7.4, 7.5, 7.6, 7.7 | `vision` | GLM 5.3 Flash | none | The executor cannot read images | The prompts in section 7 |
| Any | `Test Results Analyzer` (a `general` subagent) | GLM 5.3 | `worktree` | Only when a full-suite run fails in a way section 10 does not cover; it reports the cause, and the executor then STOPs | "Read `<log path>` in full and name the cause of each failing test, with file and line. Change nothing." |

Only the agents listed may be used, and no `model` override is ever passed: every subagent inherits
GLM 5.3, except `vision`, which runs on GLM 5.3 Flash.

## 12. Report to the owner

The final message starts with `🤖  Model: GLM 5.3 (execution session)` and a `Time:` line from
`date '+%H:%M:%S %d.%m.%Y'`, then:

- a few plain sentences: the wave landed (RN 0.88.0-rc.0), every notification is alarm-clock class,
  the mosque icon rides every Android notification, and what the 3T proved (the `flg=0x9` dump, the
  on-the-minute fire, the icon answer, the sheets and overlay checks);
- the two shade screenshot paths, with the sentence that the owner looks at them and may order the
  large icon reverted;
- the progress table (format in `EXECUTOR-BRIEF.md` section 6);
- any decision now waiting on the owner (the large icon's fate, if the owner has not answered);
- the four-line handoff from the `athan-next` skill, section 5.
