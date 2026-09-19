# Session 16a — iOS widgets: "Please adopt containerBackground API"

Status: **ROOT CAUSE FOUND AND PROVEN.** All 8 iOS widget kinds render on the XS for the first time.
Work is NOT finished: the device build carries deliberate diagnostics that must be reverted, and a
design decision is open. Nothing is committed or pushed.

Date: 2026-09-19 (evening, single long session). Device: iPhone XS, iOS 18.7.10, UDID
`00008020-0015585C22D2002E`. Build on device at handoff: **1.27.306**.

---

## 1. The headline

The black widgets showing "Please adopt containerBackground API" were **never** about the
containerBackground modifier. We call it on every iOS return path and always did.

**Root cause: timeline entry count against WidgetKit's archive budget.**

WidgetKit renders and archives a view for EVERY timeline entry, and the total must fit the widget
extension's ~30 MB budget (Apple's own WWDC wording: "A timeline is made up of multiple timeline
entries... The resulting views are archived." Plus FB8832751: "you have to keep it to under 30 MB in
total for all"). We were pushing **~372 entries per kind, to 10 kinds**.

When a render cannot be produced, iOS masks the empty result with the containerBackground
diagnostic. That is why the message was so misleading.

Cutting entries from ~372 to ~54 made all 8 kinds render immediately. That was the fix.

### Why the evidence looked so confusing

Every kind that worked was small; every kind that failed was large, because archive size is
(entry count x view size):

| Kind | View | Result before the entry cut |
| --- | --- | --- |
| Gallery preview (no props) | neutral card, ~4 views | always rendered |
| small light | hero only, ~12 views | always rendered |
| small dark | hero + 4 blurred circles | black |
| medium light | hero + 6-row list + pill | black |
| medium dark | both | black |

This also explains why **Android was flawless throughout on much older hardware** (OnePlus 3T):
Glance stores ONE snapshot and re-renders it, so there is no archive and no per-entry cost.

---

## 2. Two other real problems found and fixed on the way

These were genuine, measured, and are worth keeping. They masked the root cause.

### 2a. The per-minute push storm (fixed, keep)

`stores/widget.ts` re-pushed **all 10 kinds every minute** while the app was in the foreground
(`scheduleLabelFlipPush`). Each push calls `reloadTimelines`, which makes WidgetKit rebuild that
kind's entire timeline. Measured cost from the G.1 dossier: 5-13 CPU-seconds per kind per reload on
an A12. Ten kinds a minute = 50-130 CPU-seconds per minute against a budget of 90 seconds per 180.

**It bought nothing.** iOS suspends JS timers the moment the app leaves the foreground, so those
pushes only ever ran while the widget was impossible to look at. Removing it changed nothing
user-visible.

Result: **86 lines deleted** from `stores/widget.ts`, plus the now-vestigial prayer-sequence cache
(it existed only so per-minute pushes would not re-read MMKV). Android behaviour untouched.

### 2b. expo-widgets renders with no memoisation (patched, keep)

Symbolicated from the device crash reports against the exact build:

```
WidgetsEntryView.body.getter
 -> WidgetsViewRenderer.render()            ViewRenderer.swift:26
    -> updateChildren() -> render() -> ...  recurses the whole tree
       -> TextViewProps.init(rawProps:)     [ExpoUI]
          -> ViewProps.updateRawProps()     [ExpoModulesCore, reflection]
```

Every `body` evaluation re-runs the JS layout, rebuilds the entire Swift view tree and re-converts
every node's props by reflection. Nothing is cached. `WidgetsEntryView` also declares
`@Environment(\.self)`, which subscribes it to EVERY environment value.

Patch written: `patches/expo-widgets+58.0.3.patch` (via `patch-package`, wired into `postinstall`).
It memoises the built view per (kind, entry, environment) with a 5-second lifetime. **PR-ready as
written** — the owner wants to consider upstreaming it. I deliberately did NOT touch
`@Environment(\.self)`; memoisation makes repeat evaluations cheap and a smaller diff is a better PR.

**CPU kill evidence:** six `ExpoWidgetsTarget.cpu_resource` reports existed, four of them during this
session. After the storm removal + patch: **zero new reports**, across heavy testing. The newest
report is 18:53 on 1.27.298 (which still had orbs).

---

## 3. Chronology of builds and what each proved

| Version | Change | Result |
| --- | --- | --- |
| 1.27.294 | (state at session start) | 2 kinds rendering, CPU kills recurring |
| 1.27.297 | push storm removed | no CPU kill for a while, widgets still black |
| 1.27.298 | + memoisation patch | CPU kills stopped, widgets still black |
| 1.27.299 | pill `shadow` + `strokeBorder` removed | more kinds rendered |
| 1.27.300 | list capped to 4 rows | standard mediums still black |
| 1.27.301 | `footerLift = 0`, 6 rows restored | standard mediums still black |
| **1.27.302** | **`TIMELINE_DAYS` 14->1, `STEPPED_COUNTDOWN_HOURS` 24->4 (~54 entries)** | **ALL 8 RENDER** |
| 1.27.303 | `TIMELINE_DAYS` 1->3 | fixes premature "Out of date" |
| 1.27.304 | A/B: extras `dateStyle relative`, standard `timerInterval` | both tick, relative too long |
| 1.27.305 | all 8 on `timerInterval` | colon clock, ticks live |
| 1.27.306 | mock spread to a 1min..7h range | current build on device |

Orbs were removed earlier as a diagnostic (before 1.27.299) and **are still disabled**.

---

## 4. Working tree state — READ THIS BEFORE DOING ANYTHING

Nothing committed, nothing pushed. `git status` will show the files below.

### 4a. KEEP (real fixes)

- `stores/widget.ts` — push storm removed, sequence cache deleted, ~86 lines lighter.
- `stores/__tests__/widgetIo.test.ts`, `widgetSettingsSync.test.ts`, `widgetPushPastTarget.test.ts` —
  rewritten to pin the NEW contract (pushes ride data, never a clock).
- `stores/__tests__/widgetAndroid.test.ts` — two added tests covering `msUntilMinuteFlip` edges that
  the removed iOS tests used to cover incidentally.
- `patches/expo-widgets+58.0.3.patch` + `patch-package` devDependency + `"postinstall": "patch-package"`.

### 4b. MUST BE REVERTED (diagnostics — these are NOT design decisions)

All in `widgets/PrayerWidget.tsx`:

1. **`Blobs` early return** — `return null;` at the top of the component with a
   `biome-ignore lint/correctness/noUnreachable` on the original body. **All orbs are disabled on
   every dark kind.** The orbs were proven to be a real archive cost, so they should come back as a
   pre-rendered PNG, not as runtime `blur`.
2. **Pill modifiers stripped** — `shadow(...)` and `strokeBorder(...)` removed from `ActivePill`.
   Same reasoning: bring them back baked into the pill PNG.
3. **`footerLift = 0`** — hardcoded, replacing
   `const footerLift = isMedium && rows.length >= 6 ? 0.5 : 0;`. This was a wrong hypothesis of mine
   (see section 8); the original line should simply be restored.
4. **`TickingTextEl` + `heroModifiers` scaffolding** — a local cast that carries `date`/`dateStyle`/
   `timerInterval`/`countsDown` past the swift-ui typings, and the hero now renders
   `timerInterval` instead of `entry.countdownLabel`. This is the A/B experiment. Keep or remove
   depending on the design decision in section 6.
5. **`monospacedDigit()` removed from the hero countdown** — this one is a genuine owner-requested
   improvement from earlier in the session (fixed-width digits made "11h 55m" read as separate
   digits). Keep it, but note it is moot if the hero becomes a `timerInterval`.

Also changed as diagnostics/tuning:

- `shared/widgetTimeline.ts` — `STEPPED_COUNTDOWN_HOURS` 24 -> **4**
- `stores/widget.ts` — `TIMELINE_DAYS` 14 -> **3**
- `mocks/simple.ts` — today's offsets spread to give a range (see section 5). Owner asked for this;
  it is not a bug, but it replaced the previous standing resting state.

### 4c. Test suite is RED

`yarn validate` fails. Causes:
- Two renderer tests assert the dark kinds draw 4 `Circle`s (orbs disabled).
- Timeline volume tests assert the old entry counts (~380) and 24h stepped horizon.
- Coverage gate (100%) fails as a consequence.

---

## 5. Current mock data (`mocks/simple.ts`)

Today's prayers, relative to `asrAt` (= first whole minute at least 1 minute after the app
downloads). Owner asked for a spread so every countdown scale is observable:

```
fajr:    asrAt - 4   (about 3 min in the past)
sunrise: asrAt + 0   (about 1 min away)
dhuhr:   asrAt + 5   (about 6 min away)
asr:     asrAt + 49  (about 50 min away)
magrib:  asrAt + 59  (about 1 hour away)
isha:    asrAt + 419 (about 7 hours away)
```

**Important:** the PREVIOUS standing resting state (Fajr -3, Asr next at +1, Isha +3, every prayer
1 minute apart) is gone. If it needs restoring, it was:

```
fajr: asrAt - 4, sunrise: asrAt - 3, dhuhr: asrAt - 2, asr: asrAt + 0, magrib: asrAt + 1, isha: asrAt + 2
```

**Why the old mock is untestable for iOS widgets:** WidgetKit refuses timeline entries closer than
5 minutes apart, so prayers 1 minute apart cannot be represented at all. Widgets would exhaust their
entries within minutes and fall to the "Out of date" card. Any iOS widget testing needs prayers
spaced 5+ minutes.

---

## 6. The open design decision (this is the next real step)

The owner has now seen both options live on device.

### What was learned about self-ticking text

`@expo/ui` 58.0.3 `TextView.swift` exposes everything SwiftUI offers:
`timerInterval` + `countsDown` + `pauseTime`, and `date` + `dateStyle` in
{`timer`, `relative`, `offset`, `date`, `time`}. These update **every second with zero timeline
entries**, because iOS re-renders them in its own process.

**They cannot be custom-formatted.** The widget extension is not running while the text ticks; the
system renders those specific Text types itself with its own locale formatter. No Expo module,
config plugin or hand-written Swift widget can change this — verified by reading the source and by
the mechanism itself. `Duration.UnitsFormatStyle` produces exactly "3h 50m" but is STATIC, so it is
equivalent to what `formatCountdownMinutes` already does.

Device findings:
- `dateStyle: 'relative'` renders like "16 min, 30 sec" — **too long, truncates with an ellipsis in
  the small widget. Owner rejected it.**
- `timerInterval` renders a colon clock: `7:00:00`, `0:50:xx`, `0:01:00`. Ticks live. Currently
  shipped on all 8.
- Some widgets stalled at `0:00` and did not roll to the next prayer — believed to be the old
  1-minute mock spacing colliding with the 5-minute entry floor. **Needs re-verification on the new
  spread mock (1.27.306).** If it still stalls with 5+ minute gaps, it is a genuine bug.

### Recommended design: the HYBRID

- **More than 10 minutes out:** our own `Text` with the exact `3h 50m` format (static per entry).
- **Inside the final 10 minutes:** `timerInterval`, ticking live every second.

Cost: **one entry per prayer boundary + one entry at T-10min = about 12 entries a day** for the
standard schedule, against the ~372 that caused every black widget. This removes the root cause by
design rather than tuning around it, and frees enough archive budget to bring the orbs, pill shadow
and stroke back.

Owner's stated preference, in their words: no seconds while the countdown is hours long, seconds
when it actually matters. The hybrid matches that. The only compromise is the format inside the last
10 minutes, which is `9:59` rather than `9m 59s` — Apple's format, not negotiable.

---

## 7. Next steps, in order

1. **Re-verify rollover** on 1.27.306 with the spread mock: when Sunrise passes, does the widget
   move to Dhuhr or stall at `0:00`?
2. **Decide the design** (hybrid vs pure timerInterval vs pure custom format).
3. **Revert the diagnostics** in section 4b.
4. **Restore the design cheaply:** regenerate the orb glow and the pill as pre-rendered PNGs.
   `scripts/generate-widget-assets.py` already bakes the IDENTICAL orb geometry for Android (the
   values in it match `PrayerWidget.tsx` exactly: top 85/30/-38/blur38, bottom 130/-70/60/blur40,
   center 34/0/8/blur30, corner 130/70/60/blur40). Android's cards are OPAQUE by design; iOS needs
   TRANSLUCENT variants so the card stays see-through. Android pill PNGs already exist too
   (`athan_widget_pill_standard_light` etc.).
5. **Restore `footerLift`** to its original expression.
6. **Retune the constants** once the final entry shape is known: `TIMELINE_DAYS` (now 3) and
   `STEPPED_COUNTDOWN_HOURS` (now 4) were chosen to be safely under budget, not optimised. If the
   hybrid lands, the stepped horizon may become unnecessary entirely.
7. **Fix the tests:** renderer tests (orbs), timeline volume tests (new counts), restore 100%
   coverage, `yarn validate` green.
8. **Decide the mock:** keep the spread range or restore the old resting state.
9. **Consider upstreaming** `patches/expo-widgets+58.0.3.patch` as a PR (owner wants to, but asked
   for explicit permission before any PR is opened).

---

## 8. Mistakes I made — do not repeat these

1. **Declared fixes prematurely.** I called the memoisation patch "the fix" before it was proven. It
   fixed the CPU kills but not the black widgets.
2. **A bisection with a hole.** I capped the list to 4 rows to test row count, but `footerLift` reads
   `rows.length` (unsliced), so it stayed at 0.5 for standard. I then presented "4 rows + lift" vs
   "6 rows + no lift" as a clean separation. It was not. The combination "4 rows + no lift" was never
   tested, and `footerLift` was ultimately a red herring.
3. **Cut `TIMELINE_DAYS` to 1 without thinking it through.** One day means the sequence covers today
   only, so after the last prayer the widget has nothing to roll into and shows "Out of date". A
   widget timeline must always span past today's final prayer.
4. **Skipped a version bump on one diagnostic build**, so two different builds both reported as
   1.27.298 and crash attribution had to be done by timestamp. Bump every build.
5. **Chased effects as the whole story.** Removing `blur`/`shadow`/`strokeBorder` genuinely helped
   (they add archive size), but they were contributing factors, not the cause.

---

## 9. Verification commands

Health check (the single most useful signal — a NEW report means a regression):

```
pymobiledevice3 crash ls --udid 00008020-0015585C22D2002E | grep ExpoWidgets
```

Six reports exist at handoff; newest `ExpoWidgetsTarget.cpu_resource-2026-09-19-185536.ips`.
Memory kills file separately as `JetsamEvent-*` (only one, from 2026-09-06).

Full build + install + launch + reboot (the reboot is REQUIRED: after repeated installs over the
same bundle id, iOS drops the widget extension from the gallery until the device restarts — this bit
us about four times):

```
cd /Users/muji/repos/rn.athan.uk && \
export EXPO_PUBLIC_WIDGETS=1 EXPO_PUBLIC_ENV=local EXPO_PUBLIC_API_KEY=key && \
xcodebuild -workspace ios/Athan.xcworkspace -scheme Athan -configuration Release \
  -destination 'id=00008020-0015585C22D2002E' DEVELOPMENT_TEAM=9V3WAU9Z54 \
  -allowProvisioningUpdates build && \
xcrun devicectl device install app --device 00008020-0015585C22D2002E \
  ~/Library/Developer/Xcode/DerivedData/Athan-eiktisvjxxpitlewblhekjwkglra/Build/Products/Release-iphoneos/Athan.app && \
xcrun devicectl device process launch --terminate-existing --device 00008020-0015585C22D2002E com.mugtaba.athan && \
sleep 8 && xcrun devicectl device reboot --device 00008020-0015585C22D2002E
```

Notes:
- Run `npx expo prebuild -p ios --no-install` ONLY when app.json changes, and ALWAYS follow it with
  `(cd ios && pod install)` — prebuild deletes the workspace that CocoaPods generates. Forgetting
  this cost one build cycle.
- Bump `app.json` AND `package.json` together before any build (a lockstep test enforces it, and the
  Android `versionName` must match too if `android/` exists).
- Pino logging is dev-only, so a Release build prints no `WIDGET:` lines to the console. Crash
  reports are the evidence channel.

---

## 10. Platform constraints established (durable lessons)

1. **WidgetKit archives a rendered view per timeline entry**, and the total must fit ~30 MB. Entry
   count x view size is the real budget. This is THE constraint for this app.
2. **Minimum 5 minutes between timeline entries.** Custom-drawn content cannot update faster than
   that with the app closed. The app's countdown has never updated per-minute on iOS.
3. **Custom-format text cannot self-tick.** Only Apple's `Text(date, style:)` and
   `Text(timerInterval:)` update without a timeline entry, and their format is system-controlled.
   No native module can change this.
4. **Rasterised effects (`blur`, `shadow`, `strokeBorder`) are expensive** in the widget render
   path. Pre-render them as PNGs — which is exactly what the Android/Glance path was forced into,
   and why Android never had any of these problems.
5. **`reloadTimelines` is only useful from the foreground**, which is when the widget cannot be seen.
   Push on data changes, never on a clock.
6. **iOS drops the widget extension from the gallery after repeated reinstalls.** Reboot after every
   install.
7. `@expo/ui` ships iOS as a prebuilt XCFramework; `expo-widgets` ships raw Swift. So expo-widgets is
   patchable with `patch-package` and takes effect normally, while patching `@expo/ui` or
   `expo-modules-core` Swift would need a build-from-source flag.

---

## 11. Upstream state

- **#46200** (open) "Expo Widgets - Please adopt containerBackground API" — the community workaround
  is the modifier we already apply. Not our cause.
- **#48452** (closed, ours) auto-closed for lacking a minimal repro.
- **PR #49244** (stable SwiftUI view identity) — **CLOSED, never merged.** The G.1 dossier was
  waiting on it. The `__expoWidgetIdentity` mechanism IS present in 58.0.3 via other work, so that
  part landed, but the CPU/memoisation problem was never addressed upstream.
- `expo-widgets@58.0.3` is the newest published (`next` tag; `latest` is still 57.0.20). Nothing
  newer to adopt. The canary's `EntryView.swift` is byte-identical to ours.

---

## 12. Git

Nothing committed, nothing pushed, per the owner's instruction. To park this work on a branch, the
owner runs (agents must not run git write commands in this repo):

```
git checkout -b fix/ios-widget-archive-budget
git add -A
git commit -m "1.27.306 - wip: iOS widget archive budget investigation (diagnostics included, do not ship)"
git push -u origin fix/ios-widget-archive-budget
```

Remember the diagnostics in section 4b are in that diff and must not reach `uat-2`.
