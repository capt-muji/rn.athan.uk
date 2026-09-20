# Plan: Session 16a. iOS widgets: finish the containerBackground work — lock centring, nebula verdict, rollover and patch verification

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/ios-widget-container-background.md` |
| Planned at | `0506f608` (version 1.27.312), the tip of `wip/16a-ios-widget-archive-budget`, which this plan's step 1 lands on `uat-2` |
| Planned by | Planning session on 2026-09-20, GLM 5.3, the owner answering four decisions live |
| Needs first | nothing (rows 1 to 10 above this one are DONE or CANCELLED) |
| Steps | 8 (steps 2 and 3 change code; steps 4 to 7 are device and measurement work; step 1 is a merge; step 8 is records) |
| Device | iPhone XS `00008020-0015585C22D2002E` (iOS 18.7.10, all 12 kinds placed, build 1.27.312), simulator "iPhone XS replica (18)" `EB00ED20-949A-4834-99A9-668F971EB53C`, OnePlus 3T `8f7ada76` |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |
| Subagents | None, in any step. The owner ruled 2026-09-20: "I want you to do everything yourself, no subagents", and re-ruled for this plan that they, not a vision model, eyeball every screen. Every review in this session is the session's own recorded diff review in `LOG.md`; the audit session is the independent gate |

## 1. Goal

The "Please adopt containerBackground API" mystery is solved and its fixes are built: the root causes were the missing `EXPO_PUBLIC_WIDGETS` flag reaching the iOS bundle and, mainly, timeline entry count against WidgetKit's ~30 MB archive budget (about 372 entries per kind pushed to 10 kinds; now one entry per boundary, about 99 entries, countdowns ticking via `Text(timerInterval:)` at zero entry cost). That work sits on `wip/16a-ios-widget-archive-budget`, validate-green at 1.27.312, six commits ahead of `uat-2`, and the owner has lived with it on the XS.

This plan finishes session 16a: it lands that checkpoint on `uat-2` (step 1), centres all four Lock Screen kinds with a real SwiftUI attribute, no Spacers (step 2, owner ruling 2026-09-20), settles the dark kinds' nebula orbs with the owner steering one simulator iteration and then landing the verdict (step 3), proves on devices that the remaining fears are gone (steps 4 to 7: all kinds render and centre, a fresh placement is not a placeholder, the countdown flips instantly on a spread mock, the memoisation patch is measured with and without, the Android side compiles and installs), and closes the row (step 8).

The owner notices it is DONE when: all four lock widgets sit centred, the dark home kinds wear whatever the owner picked in the iteration round, the countdown never sits at `0:00` on a 5-minute-gap schedule, and the queue row reads EXECUTED awaiting audit.

The owner's rules that apply, quoted:

- 🐋 "I want you to do everything yourself, no subagents." (2026-09-20)
- 🐋 Lock centring "must come from a real attribute — an alignment modifier, a stack alignment prop, or whatever the runtime honours in the accessory slot. No empty-view tricks, nothing hacky that can break across iOS versions." (2026-09-20, the §29 ruling: no Spacers)
- 🐋 On the memoisation patch: "we're going to remove this patch and try and see if it works without it and see the difference in CPU before versus after... Maybe it's not even a fix we want to do... Just make sure it's keep a note of it." (2026-09-20)
- Standing: visuals are settled, `releases.json` is untouchable, EAS is read-only, never copy or synthesise a prayer time, comments explain why.

## 2. Decisions

### 2.1 Taken

1. **The containerBackground root cause and fix are closed** (owner, 2026-09-19 evening, LOG parts 1 to 8). Never re-litigate: the flag, the entry budget, the push-storm removal, the memoisation patch, `TIMELINE_DAYS = 14`, boundary-only entries, `timerInterval` countdowns, `countdownLabel` deleted, transparent `containerBackground` on every lock path, footers day-only.
2. **Both lock layouts centre** (owner, 2026-09-20, this session's first question). Layout 1's two-line block and Layout 2's one-liner both centre in the rectangular slot; the inline faces are untouched.
3. **The centring attribute is `containerRelativeFrame({ axes: 'horizontal' })`** (planner, 2026-09-20, from the LOG §27 finding). The accessory slot proposes no width a root can stretch into, so a frame's `maxWidth` cannot act; `containerRelativeFrame` takes the widget container's own width regardless of the proposal. It is registered in the extension's modifier registry (`@expo/ui/ios/Modifiers/ViewModifierRegistry.swift` line 2100). It needs iOS 17; the deployment target is 16.4, so iOS 16 renders the current leading look. That degradation is accepted (planner decision; the owner's devices run 18.x, and the owner's no-Spacer ruling leaves no attribute alternative that works without a proposal).
4. **Nebula: adjust first, then verdict** (owner, 2026-09-20, second question). One owner-steered iteration round on the simulator (the LOG §18 loop), then the owner rules keep-as-runtime-blur, keep-and-bake-PNG, or drop. Each verdict's landing contract is written in step 3; a second full round is the owner's call mid-step, and deferring the verdict is a legitimate end that changes nothing.
5. **The memoisation patch is measured before any PR decision** (owner, 2026-09-20, third question). Step 6 runs the same reload burst against the extension with and without `patches/expo-widgets+58.0.3.patch` and records the CPU evidence. The PR is NOT opened in this session; the ruling is recorded in `ai/prompts/README.md`.
6. **The owner eyeballs every screen** (owner, 2026-09-20, fourth question). No vision subagent exists in this plan. Every visual checkpoint is the owner looking at the actual device or simulator and answering the plan's exact question. Pixel arithmetic (red-error scans) stays a script.
7. **The six commits on `wip/16a-ios-widget-archive-budget` are this session's work** (planner, 2026-09-20). They predate this plan, were built with the owner live, and are enumerated in section 4 so the audit reads them as 16a's. `25ffe2ee` carries diagnostics in its own tree state that `83ff87a3` and later reverted; the merge carries history, not that tree.
8. **The dash-day question is closed** (owner, 2026-09-20, LOG §24): held dashes list plus hero to the next readable prayer stays as-is.
9. **The standing mock resting state stays** (owner's standing state, re-confirmed by the LOG §30 analysis): Fajr/Sunrise/Dhuhr passed by 3/2/1 minutes, Asr/Magrib/Isha at +1/+2/+3 past the anchor. The spread mock of step 5 is a throwaway build, never merged.
10. **The 5-minute entry floor is explained and accepted** (owner, 2026-09-20, LOG §30): the feared "3 minutes left, timer stuck at 0" scenario does not happen; what the owner saw was the 1-minute mock spacing. Step 5 proves it on a 5-minute-gap build.

### 2.2 The executor must not decide

At minimum, each of these makes the executor STOP and ask the owner:

- any anchor count other than the count section 4 lists for it;
- a test failing that the plan does not expect, or a named red test passing before the change;
- a break printing `BREAK NOT APPLIED`;
- the centring attribute not visible on the device (the owner's question: "containerRelativeFrame did not centre the lock content on the glass. Do you want to reconsider the no-Spacer ruling, keep leading, or take this to Apple as a bug report?");
- the countdown stalling at `0:00` on the spread mock (the question: "The stall reproduces even with 5-minute gaps. This is a genuine bug in the boundary spacing. Do you want it fixed in this session or a new one?");
- a freshly placed widget showing the neutral placeholder with the app closed (the question: "First placement shows the placeholder. The initial-props route is the fix candidate. Plan it as a follow-up?");
- anything about the memoisation patch beyond measuring (the question: "The A/B numbers are recorded. Keep the patch, remove it, or leave it and decide later?");
- the nebula iteration running past what the owner has patience for (after each round, offer: continue, land the current look, or drop);
- anything touching visuals beyond the literals step 3 names, prayer times, `releases.json`, `uat` or EAS;
- anything the step does not answer, with the question "The plan does not say `<X>`. What should it be?"

## 3. Pre-flight

Save to `$TMPDIR/preflight-16a.sh` and run as `bash $TMPDIR/preflight-16a.sh <k>`, where `<k>` is the first step in section 6's checklist not ticked DONE. Expected end: `PREFLIGHT OK`. An anchor count other than the listed one means NEEDS REPLAN. Any other failure means STOP.

```bash
#!/bin/bash
set -u
k="$1"
cd /Users/muji/repos/rn.athan.uk || exit 1
[ "$(git branch --show-current)" = "uat-2" ] || { echo "FAIL: not on uat-2"; exit 1; }
dirty=$(git status --porcelain)
echo "$dirty" | grep -v -E 'ai/plans/README\.md|ai/plans/16a-ios-widget-container-background/' && { echo "FAIL: unexpected dirty files"; exit 1; }
git fetch -q origin uat-2 || exit 1
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "FAIL: uat-2 behind origin"; exit 1; }

# The checkpoint branch this plan lands in step 1
[ "$(git rev-parse --short wip/16a-ios-widget-archive-budget)" = "0506f608" ] || { echo "FAIL: wip branch moved"; exit 1; }

version=$(python3 -c "import json;print(json.load(open('package.json'))['version'])")
echo "version $version"
if [ "$k" -ge 2 ]; then
  python3 - "$version" <<'PY' || { echo "FAIL: version below 1.27.312"; exit 1; }
import sys
major, minor, patch = (int(part) for part in sys.argv[1].split('.'))
ok = (major, minor, patch) >= (1, 27, 312)
sys.exit(0 if ok else 1)
PY
fi

# Anchor counts (step k onward only). Expected count is in the filename map.
A=ai/plans/16a-ios-widget-container-background/scripts/anchors
check() { # anchor file, source file, expected count
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$1" "$2")
  [ "$n" = "$3" ] || { echo "FAIL: anchor $1 count $n, expected $3"; exit 1; }
}
if [ "$k" -le 2 ]; then
  check 2-1-import.txt widgets/LockPrayerWidget.tsx 1
  check 2-2-vstack-6sp.txt widgets/LockPrayerWidget.tsx 3
  check 2-3-vstack-8sp.txt widgets/LockPrayerWidget.tsx 2
  check 2-4-vstack-l2live.txt widgets/LockPrayerWidget.tsx 1
  check 2-5-module-doc.txt widgets/LockPrayerWidget.tsx 1
  check 2-6-test-modifiers.txt shared/__tests__/widgetLockRenderer.test.ts 1
  check 2-7-test-tail.txt shared/__tests__/widgetLockRenderer.test.ts 1
fi
if [ "$k" -le 3 ]; then
  check 3-1-nebula-consts.txt widgets/PrayerWidget.tsx 1
  check 3-2-orblight.txt widgets/PrayerWidget.tsx 1
  check 3-3-dark-card.txt widgets/PrayerWidget.tsx 1
  check 3-4-renderer-nebula-test.txt shared/__tests__/widgetRenderer.test.ts 1
fi
if [ "$k" -le 5 ]; then check 5-1-today-block.txt mocks/simple.ts 1; fi
if [ "$k" -le 6 ]; then check 6-1-postinstall.txt package.json 1; fi

# Every "Needs first" row DONE
grep -q '^| 1 |.*| DONE |' ai/plans/README.md || { echo "FAIL: needs-first rows"; exit 1; }

# Tools and devices (code steps 1 to 3 need none of them)
if [ "$k" -ge 4 ]; then
  grep -q '^EXPO_PUBLIC_WIDGETS=1$' .env || { echo "FAIL: EXPO_PUBLIC_WIDGETS missing from .env"; exit 1; }
  grep -q '^EXPO_PUBLIC_ENV=' .env || { echo "FAIL: EXPO_PUBLIC_ENV missing"; exit 1; }
  grep -q '^EXPO_PUBLIC_API_KEY=' .env || { echo "FAIL: EXPO_PUBLIC_API_KEY missing"; exit 1; }
  xcrun simctl list devices | grep -q 'EB00ED20-949A-4834-99A9-668F971EB53C' || { echo "FAIL: simulator missing"; exit 1; }
  xcrun devicectl list devices | grep -q '00008020-0015585C22D2002E' || { echo "FAIL: XS not paired"; exit 1; }
fi
if [ "$k" -ge 7 ]; then
  adb -s 8f7ada76 get-state | grep -q device || { echo "FAIL: 3T not connected"; exit 1; }
fi
ls node_modules/.bin/jest >/dev/null || { echo "FAIL: node_modules missing"; exit 1; }
echo "PREFLIGHT OK"
```

Notes: the version check is stdlib-only by design. The step 4 device checks run with the same tool list.

## 4. Background the executor needs

### The inherited range (step 1 lands this; the audit reads it as 16a's)

`git log --oneline uat-2..wip/16a-ios-widget-archive-budget`, oldest first, each already version-bumped and validate-green at its tip:

| Commit | Version | What it did |
| --- | --- | --- |
| `25ffe2ee` | 1.27.306 | The evening investigation's tree: push storm removed, memoisation patch, entry-count discovery. Carries diagnostics (orbs off, pill stripped, `footerLift` 0) that later commits reverted; its tree state never ships |
| `d9c9f29b` | 1.27.306 | Docs: the styling restore list |
| `83ff87a3` | 1.27.307 | Part 2: pure `timerInterval` on all kinds, stepped grid deleted, `TIMELINE_DAYS` back to 14, diagnostics reverted, `countdownLabel` deleted (`WIDGET_PROPS_VERSION` 5), suite green |
| `e4149396` | 1.27.310 | Owner rulings: dark card royal-purple lean, periwinkle text ladder, tight minute-ladder mock |
| `7166c9fb` | 1.27.312 | Four lock kinds in two layouts, transparent lock `containerBackground`, day-only footers on all kinds, nebula orb study on dark |
| `0506f608` | 1.27.312 | Docs: the part 7/8 handoff (LOG.md §26 to §31) |

The LOG at `ai/plans/16a-ios-widget-container-background/LOG.md` holds the full story; read §26 to §31 before step 2.

### Code map

| File | One line |
| --- | --- |
| `widgets/LockPrayerWidget.tsx` | Two self-contained layout functions registered under four kinds; every rectangular return is a `VStack` with `frame({maxWidth/maxHeight: Infinity})` and a transparent `containerBackground`; the live paths carry the ticking `timerInterval` Text |
| `widgets/PrayerWidget.tsx` | One function under eight home kinds (iOS entry path + Android snapshot path in one body); `OrbLight` draws the nebula on dark; `HeroColumn` centers the trio; the medium adds the day list and the active pill |
| `stores/widget.ts` | IO layer: pushes per-schedule timelines to six kinds each (iOS) or snapshots (Android); `TIMELINE_DAYS = 14`; no clock-driven pushes |
| `shared/widgetTimeline.ts` | Pure builder: one entry per boundary, 5-minute minimum spacing with first-entry backdating and crowded-flip waiting, terminal stale entry |
| `shared/widgetTypes.ts` | Props contract, `WIDGET_PROPS_VERSION = 5` |
| `mocks/simple.ts` | Mock API data; today seeded per download (the standing resting state); every other day realistic London values |
| `patches/expo-widgets+58.0.3.patch` | Memoises the extension's per-entry render for 5 seconds; applied by `postinstall: patch-package` |
| `scripts/generate-widget-assets.py` | Bakes the Android widget PNGs (opaque cards; iOS keeps translucent runtime cards) |
| `shared/__tests__/widgetLockRenderer.test.ts` | Renders both lock layouts against stubbed swift-ui globals; pins every branch |
| `shared/__tests__/widgetRenderer.test.ts` | The home layout suite; pins the nebula (3 Circles on dark, 0 on light), the pill, the hero |
| `shared/__tests__/widgetContract.test.ts` | AST guards: no module-scope refs in widget bodies, palette literals pinned to an allowed list, static imports, one widget-directive function pair per module |
| `shared/__tests__/widgetTimeline.test.ts` | Entry budget guard (entries never exceed prayers-ahead plus two), spacing, stale entry |
| `node_modules/expo-widgets/ios/Widgets/TimelineProvider.swift` | `getTimeline` reads the stored timeline from the app group; placement calls it (the first-placement question's mechanism) |
| `node_modules/@expo/ui/ios/Modifiers/ViewModifierRegistry.swift` | Registers `containerRelativeFrame` at line 2100, `frame` at 1841 |

### Anchors

Under `scripts/anchors/`, verbatim at `0506f608` (line numbers are hints):

| Anchor | Locates | Count |
| --- | --- | --- |
| `2-1-import.txt` | The swift-ui modifiers import in `widgets/LockPrayerWidget.tsx` (line 2) | 1 |
| `2-2-vstack-6sp.txt` | The 6-space leading `VStack` shape: fn1 neutral (57), fn1 live (152), fn2 neutral (215) | 3 |
| `2-3-vstack-8sp.txt` | The 8-space leading `VStack` shape: the two stale paths (104, 255) | 2 |
| `2-4-vstack-l2live.txt` | The L2 live root `VStack` (298) | 1 |
| `2-5-module-doc.txt` | The module docstring | 1 |
| `2-6-test-modifiers.txt` | The `MODIFIERS` stub list in the lock renderer suite | 1 |
| `2-7-test-tail.txt` | The suite's last test and closing braces | 1 |
| `2-8-live-l1.txt` | The L1 live return block (for reading, not editing) | 1 |
| `3-1-nebula-consts.txt` | The three `NEBULA_*` constants | 1 |
| `3-2-orblight.txt` | The `OrbLight` opening | 1 |
| `3-3-dark-card.txt` | `DARK.card` | 1 |
| `3-4-renderer-nebula-test.txt` | The nebula renderer test | 1 |
| `5-1-today-block.txt` | The mock's `[today]` block | 1 |
| `6-1-postinstall.txt` | The `postinstall` line in `package.json` | 1 |

### How the pieces interact

- **Push path (iOS):** `refreshPrayerWidgets()` (launch/foreground sync, notification reschedule, settings change, background task) builds per-schedule timelines and calls `updateTimeline` on six kinds each. The extension's provider reads the app-group store on placement AND on reload. There is no clock-driven push (deliberately removed; `reloadTimelines` only helps from the foreground, which is when nobody looks at the widget).
- **Countdown:** every entry carries `prevEpochMs`/`nextEpochMs`; the layouts render `Text(timerInterval:)` which iOS redraws every second in its own process. Entry flips happen only at prayer boundaries.
- **Concurrency:** none new. Steps 2 and 3 are synchronous layout code; the device steps are sequential rituals. The only interleaving risk is the owner interacting with the phone mid-ritual, which every step's checkpoints invite deliberately.

### Existing tests covering this code

- `widgetLockRenderer.test.ts`: 8 tests pinning both layouts' live/stale/placeholder/error branches per family.
- `widgetRenderer.test.ts`: the home suites including `draws the three-orb nebula on dark and nothing on light`.
- `widgetContract.test.ts`: 10 tests; the allowed-literal block pins the three nebula literals (lines 234 to 236).
- `widgetTimeline.test.ts`: the budget guard and spacing (no changes in this plan).
- `stores/__tests__/widgetIo.test.ts`, `widgetSettingsSync.test.ts`, `widgetPushPastTarget.test.ts`, `widgetAndroid.test.ts`: the push contract; untouched by this plan.

### Why the obvious simple fixes are wrong

- **Spacer pairs for centring:** banned by the owner (§29): "no empty-view tricks, nothing hacky that can break across iOS versions."
- **More timeline entries for freshness:** the root cause of the whole failure; one entry per boundary is the ceiling by design.
- **`reloadTimelines` from the background task:** budget-limited and useless; the data is already correct for 14 days.
- **Removing the memoisation patch without measuring:** the owner explicitly wants the with/without numbers first (step 6).

## 5. Design

- **Lock centring (step 2).** Invariant, one sentence a test can check: *every rectangular return path of both lock layouts carries `containerRelativeFrame({ axes: 'horizontal' })` as its innermost modifier and no `alignment='leading'` prop anywhere.* Mechanism: the accessory slot proposes no width, so `frame({maxWidth: Infinity})` cannot stretch the root (the LOG §27 finding, same class as the "Infinity frames do not make stacks greedy" lesson); `containerRelativeFrame` sizes the root to the widget container's own width, and the stack's default centre alignment then has room. Inline faces are untouched (a single system line; centring is meaningless there). Spike-proven 2026-09-20 in `~/athan-device-sweep/worktrees/plan-16a`: red 7 failed / 8 passed with `expect(relativeIndex).toBe(0)` receiving `-1` and `alignment` receiving `"leading"`; green 15 passed; `tsc` and Biome exit 0; both breaks caught. The spike's code is NOT this plan's code; the executor rebuilds from the contracts below.
- **Nebula (step 3).** One owner-steered iteration round on the simulator (Metro loop, no builds), then one of three landings, each fully specified: keep-as-runtime (literals land, contract pins them), keep-and-bake (PNG pipeline gains translucent iOS dark card + baked orbs; the layout swaps runtime Circles for one full-bleed Image), or drop (OrbLight and literals deleted, renderer pins zero Circles, contract list shrinks). Deferring the verdict is a fourth, code-free ending.
- **Rollover proof (step 5).** A throwaway build carrying the part-1 spread mock (5-plus-minute gaps) on the simulator; the Sunrise-to-Dhuhr flip lands exactly on the floor's spacing; the owner watches it flip. No clock change is involved at any point.
- **First placement (part of step 4).** With the app closed, the owner places a fresh kind; the provider serves the stored timeline, so content (not the placeholder) is expected within a few seconds.
- **Patch A/B (step 6).** The same forced-reload burst against the extension, once with the patch applied and once with a pristine `expo-widgets`, on the simulator; cumulative CPU time and crash counters are the evidence. No PR, no removal decision inside this plan unless the owner answers during the session.
- **Alternatives rejected:** `multilineTextAlignment` (a Text-scoped attribute; does nothing for a stack root), the frame's `alignment` param (no effect while the frame hugs), `fixedSize` (the opposite direction), waiting for the upstream identity PR (closed unmerged; LOG §11).

The design review (PLANNER-BRIEF section 3, item 5) ran as the owner's live questioning plus this planner's own attack pass during the spike; the spike's red/green/break evidence is the review record. No behaviour change touches notifications, data or the schedule, so no separate design-review subagent was chartered (none may exist: no subagents).

## 6. Steps

Checklist (the executor ticks one line per finished step):

- [x] Step 1: Land the 16a checkpoint on `uat-2` (merge) DONE in `61346fa7`
- [x] Step 2: Centre all four lock kinds with `containerRelativeFrame` (specified) DONE in `0448b271`
- [x] Step 3: Nebula iteration and verdict landing (specified, branch-dependent) DONE, branch D: deferred 2026-09-20 (owner), committed study state stands
- [ ] Step 4: XS build and the owner's eyeball pass (device)
- [ ] Step 5: Spread-mock rollover proof on the simulator (device, throwaway build)
- [ ] Step 6: Memoisation patch A/B measurement (device, throwaway builds)
- [ ] Step 7: Android compile and 3T install (device)
- [ ] Step 8: Records and EXECUTED (docs)

Each step is specified in `steps/<k>-<name>.md` in this folder, with the parts the template requires. Steps 1 and 4 to 8 change no app code (step 8 changes docs only); their "Tests first" and "Breaks" parts say "None" with the reason.

## 7. Device proof

In the step files, not here: step 4 (XS eyeball pass), step 5 (simulator rollover), step 6 (simulator CPU), step 7 (3T). Shared facts:

- The iOS build ritual (from LOG §9, verbatim expectations): version bump in `app.json` FIRST, `.env` already carries `EXPO_PUBLIC_WIDGETS=1` + `EXPO_PUBLIC_ENV=local` + `EXPO_PUBLIC_API_KEY`, then `export EXPO_PUBLIC_WIDGETS=1 EXPO_PUBLIC_ENV=local EXPO_PUBLIC_API_KEY=key` and the `xcodebuild -workspace ios/Athan.xcworkspace -scheme Athan -configuration Release -destination 'id=00008020-0015585C22D2002E' DEVELOPMENT_TEAM=9V3WAU9Z54 -allowProvisioningUpdates build`, install with `xcrun devicectl device install app`, launch, and REBOOT the phone (repeated installs drop the widget extension from the gallery until a restart; this bit the evening four times). Run `npx expo prebuild -p ios --no-install` ONLY when `app.json` changed beyond its version, and ALWAYS follow it with `(cd ios && pod install)`.
- Release builds print no pino logs; crash reports are the evidence channel: `pymobiledevice3 crash ls --udid 00008020-0015585C22D2002E | grep ExpoWidgets` (counter at checkpoint: 9; two of them install-time `cpu_resource` kills since the orbs returned).
- `expo start` regenerates `expo-env.d.ts`, which poisons `tsc`: delete the file if a validate goes red after a Metro session (LOG §17.1).
- No clock is changed anywhere in this plan; no `dumpsys alarm` read is required. The 3T step installs a build and reads the screen; automatic time stays on.
- The owner receives no screenshots and needs none: they look at the glass itself.
- The phone ends the session on the final build of step 4 (rebooted, automatic time on, unlocked, Athan open, Stay awake on). The 3T ends on the step 7 build.

## 8. Records

**Findings text.** Add to `ai/features/uat-2/AUDIT-FINDINGS.md` under the heading `# Session 16a of the queue: iOS widgets, containerBackground to verdict, 2026-09-20`, in the executor's docs commit:

> The black widgets were the archive budget, not the modifier: about 372 timeline entries per kind against WidgetKit's ~30 MB ceiling, masked by iOS as "Please adopt containerBackground API", with the missing `EXPO_PUBLIC_WIDGETS` flag as the first cause (both fixed on `wip/16a-ios-widget-archive-budget` through 1.27.312; landed on `uat-2` by step 1 of this plan's execution). This execution finished the row: all four Lock Screen kinds centre via `containerRelativeFrame({ axes: 'horizontal' })` (no Spacers, owner ruling), verified on the XS by the owner; the dark kinds wear `<NEBULA_VERDICT>` (owner-steered iteration, LOG `<NEBULA_LOG_PART>`); the countdown flips instantly on a 5-minute-gap spread mock (`<ROLLOVER_RESULT>`); a freshly placed widget with the app closed shows content, not the placeholder (`<PLACEMENT_RESULT>`); the memoisation patch measured `<PATCH_WITH>` CPU-seconds with and `<PATCH_WITHOUT>` without across identical reload bursts (`<PATCH_CRASH_NOTE>`), PR decision deferred by the owner; the Android side compiles and installs clean on the 3T (`<ANDROID_RESULT>`); the XS crash counter moved `<CRASH_DELTA>` through the whole session.

**Table rows.** The executor sets the `ai/plans/README.md` row 11 to EXECUTED. The auditor, on PASS, sets `ai/prompts/README.md`'s programme table row for 16a to: `**DONE** 20 September 2026, 1.27.313 to <FINAL_VERSION>: the archive-budget fix landed (one entry per boundary, self-ticking countdowns), all four lock kinds centred with a real attribute, the nebula settled by the owner, rollover and first-placement proven, the memoisation patch measured, Android verified`.

**Docs commit.** `<VERSION> - docs(16a): session executed — records and row to EXECUTED`.

## 9. Push

None. The audit session pushes `uat-2` after its PASS verdict.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `git merge` of the wip branch conflicts | Someone moved `uat-2` since planning | `git merge --abort`, STOP and ask |
| Anchor `2-2` counts other than 3 (post-merge) | The lock file changed under the plan | NEEDS REPLAN |
| Red tests pass before the step 2 change | The spike's code leaked into `uat-2` | STOP and ask; do not reshape tests |
| `containerRelativeFrame` compiles but nothing centres on glass | The accessory container geometry is not what §27 assumed | STOP with section 2.2's question |
| Widget gallery loses Athan after installs | Known: reboot the device; it restores | Reboot and retry once; twice means STOP |
| validate red after a Metro session | `expo-env.d.ts` regenerated | Delete the file, run validate again |
| The spread build's flip does not come within 90 seconds of the boundary | Either the mock edit or a genuine spacing bug | Confirm the mock block matches anchor 5-1's shape; then STOP with section 2.2's question |
| A/B numbers indistinguishable | Measurement noise | Rerun the burst once; still flat means record "no measurable difference" and move on |
| 3T build fails at Gradle/AGP | Known machine issue (session 13 findings) | STOP and ask; do not upgrade anything |
| Hook fails only on `audioMatrix.test.ts` timeout | Busy machine | Wait for load, recommit, up to 3 times |
| Anything else | — | The general table in `EXECUTOR-BRIEF.md` section 7 |

**Anticipated review fixes.** No subagents review this session's commits (owner ruling). The executor's own diff review findings are handled per `EXECUTOR-BRIEF.md` section 4, item 8's three conditions, recorded in `LOG.md`. Section 10 of this plan gives no code fixes because no reviewer exists to generate them; anything the executor cannot answer is section 2.2's STOP.

**Stopping part-way.** Per step: step 1 has no working tree (a merge only); steps 2 and 3 restore `widgets/LockPrayerWidget.tsx` / `widgets/PrayerWidget.tsx`, `shared/__tests__/widgetLockRenderer.test.ts` / `widgetRenderer.test.ts` / `widgetContract.test.ts`, `scripts/generate-widget-assets.py`, `assets/widgets/*.png`, plus `app.json` and `package.json` via `git checkout --`; new files (none expected beyond regenerated PNGs) are deleted. Step 5's and 6's throwaway branches are deleted with `git branch -D`; their builds stay outside the repo under `~/athan-device-sweep/`. The plan files (`PLAN.md`, `LOG.md`, `ai/plans/README.md`) always ride the docs commit.

## 11. Subagents in this plan

None. The owner's instruction of 2026-09-20 ("do everything yourself, no subagents") and their answer that they eyeball every screen. Reviews are the session's own recorded diff reviews; the independent gate is the audit session that follows.

## 12. Report to the owner

Start with `🤖  Model: GLM 5.3 (execution session)` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`, then a few plain sentences on what changed and what was proven, the progress table:

| Task | Model | What it checks | Why it matters | Outcome | Status |
| --- | --- | --- | --- | --- | --- |

with one row per step plus the row's status, then `**<done>/8 done.**`, the rows still to run, any decision waiting on the owner, and the four-line handoff from the `athan-next` skill, section 5.
