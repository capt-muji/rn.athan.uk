# Session 16a — iOS widgets: "Please adopt containerBackground API"

Status: **ROOT CAUSE FOUND AND PROVEN.** Part 2 (2026-09-20) reverted every diagnostic, took the
design decision, and rebuilt. See section 13 at the bottom for part 2; sections 1 to 12 are the
evening of 2026-09-19 and are kept as written, including the parts part 2 corrects.

Two claims below were wrong and are corrected in section 13: the hybrid's entry-count arithmetic
(§6) and "nothing is committed" (§12).

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

### 4bb. STYLING RESTORE LIST — exact originals, copy/paste

Owner's read (and I agree): **the real cost was entry count, not styling.** Effects only mattered
because each one multiplied across ~372 archived views. At ~6-12 entries the archive budget has
roughly 30-60x more headroom, so **expect ALL of this to come back as it was**. Restore it, then
verify on device; only fall back to PNGs if something still fails.

All four are in `widgets/PrayerWidget.tsx`.

**1. Orbs / blobs — restore the dark-theme glow**

Currently the component early-returns. Delete the diagnostic `return null;` and its
`biome-ignore lint/correctness/noUnreachable` comment so the body reads:

```tsx
  const Blobs = () => {
    if (!orbs) {
      return null;
    }
```

Everything below it (the four `Circle`s with `blur`, `scaleEffect`, `offset`, `foregroundStyle`) is
untouched and still correct. This restores: top orb, bottom-left orb, centre orb and the corner orb,
on dark kinds only. Light kinds never drew orbs.

**2. Active pill — restore the outline and the depth shadow**

In `ActivePill`, the modifiers array was reduced to three entries. Restore it to:

```tsx
          modifiers={[
            foregroundStyle(palette.pillFill),
            strokeBorder({
              color: palette.pillStroke,
              style: { lineWidth: 1 },
              shape: 'roundedRectangle',
              cornerRadius: ROW_CORNER_RADIUS,
            }),
            shadow({ radius: pillShadow.radius, x: pillShadow.x, y: pillShadow.y, color: pillShadow.color }),
            frame({ height: ROW_HEIGHT + 2 * PILL_VPAD }),
            offset({ y: pillY - PILL_VPAD }),
          ]}
```

and delete the `// DIAGNOSTIC 2026-09-19: shadow and strokeBorder dropped...` comment above it.

**3. Footer lift — restore the half-point nudge**

Replace the hardcoded `const footerLift = 0;` (and its three-line diagnostic comment) with the
original:

```tsx
    const footerLift = isMedium && rows.length >= 6 ? 0.5 : 0;
```

This was a wrong hypothesis of mine, never a real fault. It exists because the medium's 6-row list
lays the hero column 1pt short of the smalls' inset, and the runtime applies Text `offset()` at
double strength.

**4. Hero countdown — decide first, then restore**

Currently renders `TickingTextEl` with `timerInterval` (Apple's colon clock) for all 8 kinds. The
original custom-format hero was:

```tsx
          {typeof entry.countdownLabel === 'string' && entry.countdownLabel.length > 0 ? (
            <Text
              modifiers={[
                font({ size: 26, weight: 'bold' }),
                foregroundStyle(palette.hero),
                lineLimit(1),
                minimumScaleFactor(0.6),
              ]}>
              {entry.countdownLabel}
            </Text>
          ) : null}{' '}
```

Note `monospacedDigit()` is deliberately ABSENT from that list — the owner asked for it earlier in
the session because fixed-width digits made "11h 55m" read as loose separate digits. Keep it absent.

If the hybrid (section 6) is chosen, this branches on time-to-prayer instead: custom label beyond
10 minutes, `timerInterval` inside the final 10. If pure `timerInterval` is chosen, delete the
`TickingTextEl` cast and `heroModifiers` only if they become unused.

**5. Imports to re-check after restoring**

`blur`, `scaleEffect`, `shadow` and `strokeBorder` are imported at the top of the file. They are
currently unused-or-unreachable while the diagnostics are in place; after restoring 1 and 2 they are
all used again. If the hero drops `TickingTextEl`, confirm `font`/`lineLimit`/`minimumScaleFactor`
are still referenced.

**6. Nothing else was touched visually.** Palettes, card colours, row colours, fonts, sizes,
spacings, the eyebrow kerning, the footer text and the Android composition are all untouched.

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

---

# Part 2 — 2026-09-20

## 13. What part 2 changed

Version **1.27.307**. `yarn validate` green: tsc, biome, 4611 tests, 100% coverage.

### 13a. Two corrections to the record above

**§12 "nothing is committed" was stale.** The work was already on
`wip/16a-ios-widget-archive-budget` as `25ffe2ee` plus the docs commit `d9c9f29b`.

**§6's hybrid arithmetic was wrong.** It claimed the hybrid would cost "about 12 entries a day"
from one entry per boundary plus one at T-10min. A static label is frozen for the whole life of its
entry, so with boundary-only entries a 19:30 Magrib to 21:00 Isha segment would still read
"1h 30m" at 20:55. The static branch always needed its 5-minute grid; `timerInterval` only removes
the last two steps of a segment. The hybrid would have cost roughly what the stepped design cost.

### 13b. The design decision the owner took

**Pure `timerInterval` on all 10 kinds. No hybrid.** iOS redraws `Text(timerInterval:)` every
second in its own process, so the countdown needs no timeline entries at all. That let the entire
stepped-countdown mechanism be deleted:

| Knob | Session start | Part 1 | Part 2 |
| --- | --- | --- | --- |
| `STEPPED_COUNTDOWN_HOURS` | 24 (288 entries) | 4 (48 entries) | **deleted** |
| `TIMELINE_DAYS` | 14 (~98 entries) | 3 (~21) | **14 (~98)** |
| Entries per push | ~388 (black) | ~54 (rendered) | **~99** |

The two knobs cost wildly different amounts: a stepped hour is 12 entries, a timeline day is about
7. The old tuning spent 74% of its archive on one day of countdown freshness and 25% on two weeks
of offline runway. Part 1 cut both; part 2 deletes the expensive one and restores the cheap one.

`TIMELINE_DAYS` also feeds the **Android** snapshot window, so part 1's cut to 3 had silently
shortened Android's carried window from 14 days to 3. Restoring 14 fixes that too.

Rejected: `TIMELINE_DAYS = 1`. The sequence would cover today only, so the stale card would appear
after every Isha and sit there until the next push — hours, every night. This is §8.3's recorded
mistake. The background task cannot cover it: it is 6 hours in production (not 3), `dasd` defers
it, a force-quit kills it until the next app open, and Background App Refresh off kills it
entirely. Timeline length is the safety net for exactly the users the task cannot reach.

### 13c. Diagnostics reverted (§4b / §4bb, all of them)

- Orbs restored (the `return null` and its `biome-ignore` deleted).
- Pill `strokeBorder` and `shadow` restored.
- `footerLift` restored to `isMedium && rows.length >= 6 ? 0.5 : 0`.
- The stale A/B comment about `dateStyle 'relative'` deleted, and the stray `{' '}` after the hero.

### 13d. Two device bugs the owner reported, both diagnosed

**Extras mediums showing `1 min, 10 secs`.** That is `dateStyle: 'relative'`, which only ever
existed in the 1.27.304 A/B build. The current source has no `relative` path at all: line 622 was
a stale comment while the JSX rendered `timerInterval` unconditionally. Those two kinds were
serving **archived views from two builds earlier**. Most likely every kind was, and only the
extras mediums revealed it. Confirm after this build: if they still lag, it is a genuine per-kind
push failure.

**The hero countdown sitting left instead of centred.** Root cause found in SwiftUI, not in our
layout: `Text(timerInterval:)` reserves a fixed worst-case width so the card does not jiggle as
digits change, and parks its glyphs against the leading edge of that reserved box. The `VStack`
centres the view; the digits sit left inside it. Never visible before because the static
`Text(countdownLabel)` sized itself to its content. Fixed with `multilineTextAlignment('center')`.
`monospacedDigit()` is back on the hero for the same class of reason: it was removed in part 1
because fixed-width digits made a static "11h 55m" read as loose digits, but a clock redrawing
every second needs fixed widths or the whole string shuffles sideways.

### 13e. Dead code removed

`countdownLabel` is gone from the props contract (`WIDGET_PROPS_VERSION` 4 to 5), from the builder,
and from both layouts. `formatCountdownMinutes` in `shared/time.ts` went with it: it had zero
callers left. Android is unaffected, it carries its own copy inside the widget body because the
`'widget'` directive cannot reference module scope.

`accessoryInline` is the one place that lost a countdown. SwiftUI stops updating a timer Text once
it is concatenated, and inline is a single system-rendered line, so it now shows the name and the
absolute time only. The rectangular face keeps the countdown, in an `HStack` so the timer stays a
Text of its own.

### 13f. Tests

The suite moved from 5 red files to green, and the shape changed rather than the thresholds:

- **New budget guard** in `widgetTimeline.test.ts`: entries may not exceed the prayers still ahead
  plus two. That is the guard that would have caught the original ~380-entry regression, and
  nothing in the suite had one.
- **Countdown honesty** rewritten. The old tests measured a label the builder wrote against the
  truth. There is no label now, so they sweep every minute of a production span asserting the
  segment always ends at the true next prayer, plus a new test that no entry outlives its own
  boundary (an entry whose upper bound is behind the clock is exactly the frozen `0:00` the owner
  saw).
- **12 golden SHA-256 digests re-golded.** Their old premise ("same bytes as before unreadable rows
  landed") died with a deliberate builder change, so they are renamed `REAL_YEAR_TIMELINES` and
  documented as a byte-stability pin to re-gold on purpose, never to silence.
- `mocks/__tests__/simple.test.ts` rewritten for the spread mock, with a new test that every prayer
  still ahead is at least 5 minutes from the next. Fajr sits 4 minutes before Sunrise, which is
  fine: a passed prayer is only the segment's lower bound and never becomes an entry.
- The renderer harness was missing `multilineTextAlignment`, so the layout threw and every iOS test
  silently asserted against the `NeutralCard` fallback. Worth remembering: a missing modifier stub
  does not fail loudly, it swaps the whole tree.

### 13g. Still open

1. **Device verification of this build.** Do all 10 kinds render with the orbs, pill stroke and
   shadow back at ~99 entries? That combination has never run. If anything blacks out, the styling
   is the variable to drop first, and the fallback is pre-rendered PNGs (§7 item 4).
2. **Do the extras mediums heal?** See 13d.
3. **Rollover.** With the spread mock the flips to watch are Sunrise to Dhuhr at about +6 minutes
   from launch (a 5-minute gap, exactly on WidgetKit's floor) and Dhuhr to Asr at about +50
   (comfortable). A stall on the first and a clean roll on the second is a spacing artifact, not a
   bug.
4. **Queue row 13 (session 17, "timeline horizon 14 to 30 days") is now cheap.** At one entry per
   boundary, 30 days is roughly 200 entries. Whether that fits is the same device question as 1.
5. **The expo-widgets memoisation patch** still wants an explicit owner decision before any PR.

---

# Part 3 — 2026-09-20, late

Baseline `83ff87a3` (part 2) was committed and pushed to the branch first, per the owner. Everything
below is UNCOMMITTED on top of it, awaiting the owner's device review. Version **1.27.308**.

## 14. Part 3 changes

All five owner rulings from the 1.27.307 review:

1. **Orbs deleted everywhere.** iOS: `Blobs`, both orb palettes, the oversize-orb machinery, the
   `Circle`/`blur`/`scaleEffect` imports, and the stale-card's usage. Android: the orb blocks in
   `scripts/generate-widget-assets.py`; the dark card PNGs regenerated flat (31KB to 2KB). Tests:
   the two orb renderer tests replaced by one that pins zero `Circle`s on every theme and size;
   the contract test's anchors and allowed-literal lists updated. Blur was the single most
   expensive effect in the widget archive, so this also widens the archive margin again.
2. **iOS medium list squeezed ~10%**: `MEDIUM_LIST_WIDTH = 146` (Android keeps its own 162).
3. **The hero trio now centers between the card's left edge and the list**: the list column went
   from a half-share greedy column to a fixed-width block flush against the right inset, and the
   hero column takes everything left over. Equal air both sides of the trio.
4. **Hero countdown 26pt to 24pt**: six digits plus two colons ("12:00:00") must fit the medium's
   now-narrower left region.
5. **Footer faded 25% on all themes, both platforms** (the palette is shared): light 0.34 to 0.255
   alpha, dark 0.54 to 0.405. Note for review: the dark footer sat at 0.54 precisely because the
   old 0.38-alpha wash "faded into the card" (owner finding 2026-09-19). 0.405 is between the two;
   judge it on glass.

## 15. The new mock resting state

Fajr -3, Sunrise -2, Dhuhr -1 (passed), Asr +12h, Magrib +12h+1m, Isha +12h+2m — built to show the
six-digit colon clock. Two implementation constraints shaped it:

- Times are same-day `HH:mm` strings, so "+12h" crosses midnight after a noon launch. The long
  block is keyed on whichever day it actually lands on: tomorrow after noon, today before it. At
  any launch time the countdown reads exactly twelve hours.
- The passed rows anchor on the download's own minute floor, not the rounded-up anchor minute: an
  `anchor - 1` row lands up to a minute in the FUTURE on a mid-minute download and becomes the
  next prayer, defeating the point. Caught by the sub-minute `it.each` cases, not by eye.

The 5-minute-spacing mock test from part 2 is gone: Magrib and Isha sit 1 minute after Asr by
design here, which WidgetKit will coalesce. This resting state is for LOOKING at the countdown,
not for rollover testing; the part 2 spread was the rollover rig.
