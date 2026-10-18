# Ticket 135: Widget mirroring under RTL and the widget countdown face

| Field | Value |
| --- | --- |
| Brief | The queue row 135, owner order 2026-10-17 (transcribed in the row; her words are the spec) |
| Planned at | `cd171855` (uat, 2.0.1013), 2026-10-18 |
| Planned by | Lane 135 (agent-ruled; the owner is hands-off) |
| Needs first | nothing |
| Parent | nothing |
| Group | widget props and modules (`widgets/`, `shared/widgetTypes.ts`, `shared/widgetTimeline.ts`, `patches/expo-widgets`) — no other open ticket touches these files |
| Batch budget | 4 |
| Session budget | 8 |
| Steps count | 4 step files (three code, one device), plus the audit's docs carry with no step file |
| Device | OnePlus 3T (3T_SERIAL) and iPhone XS (IPHONE_UDID) |
| Owner decisions still needed | Her glass read of a placed widget under Arabic on each phone (the acceptance); her veto on the iOS countdown face ruling D135.5 |

## 1. Goal

Under an Arabic app locale the widgets do not mirror: the Android medium row draws the
Arabic name on the left and the time on the right (the English column order), and the
Android countdown label renders Arabic unit letters beside Latin digits (`4 س 20 د`).
On iOS the ticking countdown is the platform's `Text(timerInterval:)` face. The owner
ordered 2026-10-17: mirror every widget variant under RTL on both platforms, driven by
the APP locale, nothing redesigned, the mirrored face identical to the English face
flipped, every LTR locale byte-identical; and the widget countdown matches the app
countdown exactly. ITEM 2 WAS AMENDED BY HER ORDER OF 2026-10-18 (queue commit
`65a88291`, her words): "the ANDROID widget countdown is exactly the app countdown
component's face (Latin digits, lowercase h m s, HEAD sizing); the iOS widget
countdown KEEPS WHAT IT IS NOW (the system timer interval, Latin digits, no letters,
fine for every language) and takes no formatting change - her words: on iOS it is
just what it is right now". Her original framing ("exactly like the app countdown,
as it was before multiple languages") stands for the Android half.

When DONE: a widget placed under an Arabic app locale shows the mirrored face on both
phones (Android time left, name right; the iOS tree flipped by native direction), the
Android countdown reads `4h 20m`-shaped fixed Latin in every language, the iOS
countdown ticks the platform's Latin face, LTR locales render bytes unchanged, the
stamped `rtl` field is consumed (row 129 answered), and the owner reads her acceptance
on glass.

Owner rules that apply, quoted from the row and the governing laws:

- "the APP locale drives direction, never the device locale, never transforms-based
  hacks where the runtime offers a native direction" (row 135, from rows 58/68).
- "nothing redesigned, the mirrored face identical to the English face flipped, and
  every LTR locale byte-identical" (row 135).
- "unpadded Latin digits with lowercase Latin h m s letters (rows 85/102/83 law), no
  Arabic letters, no native numerals, on BOTH platforms" (row 135).
- "exactly like the app countdown, as it was before multiple languages" (row 135).
- Countdown rounds up, 0s never displays (`ai/AGENTS.md`).
- The widget runtime is not React: statically imported modules, JSON-only props with a
  schema version and a `props == null` guard, timeline entry count is the iOS budget,
  `expo-widgets` and `@expo/ui` pinned exact (`ai/AGENTS.md`).
- Visuals are settled: no pixel changes beyond the owner's order.

## 2. Decisions

### 2.1 Taken (all agent-ruled 2026-10-18, recorded here)

**D135.1 Android mirror mechanism: a composition mirror inside the serialized widget
body, keyed off the snapshot's `rtl` field.**
Options: (a) mirror by construction in the layout body (swap child order, alignments,
lead paddings and textAlign under `rtl === true`); (b) patch the Kotlin converter or
the peek library to apply `LocalLayoutDirection`; (c) wrap the body in the `@expo/ui`
Host with `layoutDirection`. For (b): the converter
(`ExpoWidgetEmittableTree.kt`) has no direction concept in its prop maps, the Glance
Emittable IR carries no direction field, and `provideRoot` returns the Emittable
before the peek library composes it, so a CompositionLocal cannot be injected from
repository code; peek ships as a Gradle AAR (`io.github.expo.peek:peek-emittables:0.3.2`),
not a node_modules package, so patch-package cannot reach it and vendoring it is an
ask-first dependency change for zero benefit over (a). (c) is measured dead: row 68's
P16 found the Host compiles to a `HostView` node the widget runtime rejects (iOS red
box, Android `View not found`). Commit (a): fully in-repo, driven by the app locale
through the already-stamped `rtl`, no transforms, and it produces the exact flipped
English face. Survives the challenge; committed.

**D135.2 iOS mirror mechanism: the patch applies SwiftUI's native layout direction
from the entry's `rtl` field at the entry view.**
Options: (a) extend `patches/expo-widgets` so `EntryView.swift` reads
`entry.props?["rtl"]` and applies `.environment(\.layoutDirection, rtl ? .rightToLeft :
.leftToRight)` around `WidgetsDynamicView`; (b) mirror by construction in the JS
layouts (the D135.1 route); (c) a `@expo/ui` Host wrap (dead, P16). The probe
(`~/athan-gitree/tmp-135-probe/`, run 2026-10-18 on the iOS 26 simulator under system
Arabic) measured that `.environment(\.layoutDirection, .rightToLeft)` flips an
`HStack { name, Spacer, countdown }` natively: the Arabic word moved right, the
countdown left. SwiftUI's environment direction is the runtime's native direction
mechanism and the law prefers it over composition mirroring where it exists; the
patch family is precedented (five hunks already apply to this package). Challenge:
the JS body could mirror without touching the patch. Rejected: on iOS the native
mechanism exists and reaches every one of the 14 kinds from one site, including the
leading/trailing paddings and frame alignments the JS would have to swap by hand,
item by item, forever. Committed (a).

**D135.3 The `rtl` field's fate (row 129): consumed, schema versions unchanged.**
Both mechanisms read the field the builder already stamps (`shared/widgetTimeline.ts`
stamps `rtl: localeDirection(currentLocaleId()) === 'rtl'` on every entry and
snapshot, v8/v4 since `a3d8d282`). iOS consumes it in native code (D135.2), Android
in the body (D135.1). No shape change, so `WIDGET_PROPS_VERSION` stays 8 and
`ANDROID_SNAPSHOT_VERSION` stays 4; blobs predating the field read `rtl` as absent,
falsy, and render LTR, which is their correct direction (they were composed by an app
whose layouts never mirrored). The docblock on the field changes from "blocked, P16"
to the two named consumers. Challenge: bump the versions to mark the semantic change.
Rejected: the contract's tolerance rule keys the version on the SHAPE ("Bump when the
props shape changes"), not on which side reads a field. Committed.

**D135.4 Android countdown face: the app countdown component's face at HEAD
sizing, fixed Latin bytes.** Her 2026-10-18 amendment names the face exactly:
Latin digits, lowercase h m s, HEAD sizing. At HEAD the app component
(`components/countdown/Countdown.tsx`) renders each group as a digit run with its
letter tight against it at `UNIT_SIZE_SHARE` 0.95 of the digit size, same ink and
weight, groups separated by the group style's `marginHorizontal: 6` on each side
(12 points between groups at the 26 point digit size). The widget's hero digits
already sit at 26 (`AText(..., 26, 'bold', palette.hero)`), the app's own en
`countdownSize` (`TEXT.sizeLarge`), so the widget delivers the face by composing
the label instead of baking one string: an outer Row of tight inner Rows
(digit `AText` at the hero size, letter `AText` at 0.95 x that size, same colour
and weight) with a fixed-width 12 point Spacer between groups (the converter maps
arrangements to alignments only, so Row spacing cannot carry the gap; a Spacer
can). `ALabel`'s arithmetic already computes the app law at render time: unpadded
digits, zero-valued groups dropped (`45m`, `1h`, `1h 20m`), minutes clamped at 1
(`Math.max(1, Math.ceil(...))`, the rounds-up law); it now returns the parts
instead of one string. The unit bytes: `widgetStrings()` bakes `t('duration.h')` /
`t('duration.m')`, which under ar renders `س` / `د`; the `h`, `m`, `s` fields bake
fixed lowercase Latin bytes in every locale (the measured build site is app-side,
in `shared/widgetTimeline.ts`; the patch's device-locale hunks only feed the
STATIC neutral/stale tables), the docblock's dead "mirror the catalog keys"
rationale rewritten to the never-localising law. `now` stays catalog-localised and
unread (row 130 owns the v1 fallback re-issue; it is parked). The v1 fallback
words inside `androidRender` are already Latin literals. Challenge: a single
one-size string (the widget's pre-i18n shape, row 100's ago-badge single-style
precedent). Rejected: her amendment names the app COMPONENT's face and HEAD's
sizing explicitly; the badge precedent was her ruling for a different surface.
Challenge back: the composed Row is a redesign of the widget label. Answered: the
label's content law is hers, the mechanism (inner Rows, spacer, 0.95 share) is the
runtime's only way to express it, and no other pixel of the trio moves. Committed.

**D135.5 iOS countdown face: unchanged, by the owner's own amendment.**
SUPERSEDED BY HER ORDER 2026-10-18 (`65a88291`): "the iOS widget countdown KEEPS
WHAT IT IS NOW (the system timer interval, Latin digits, no letters, fine for
every language) and takes no formatting change", her words "on iOS it is just
what it is right now"; row 128 is discarded outright on the same order. The
planning evidence agrees with her: the iOS 27.1 SDK's SwiftUICore interface
carries exactly one `Text(timerInterval:)` initializer (`pauseTime`,
`countsDown`, `showsHours` alone; no per-unit overload exists), the repo measured
at row 22 that concatenating a timer `Text` stops it ticking, a baked lettered
label would freeze between boundary entries (she herself recalled "the earlier
attempts' timeline havoc"), and the probe measured the current face rendering
Latin digits with colons even under system Arabic (`1:48:57`, `45:27`, unpadded
hours, auto-dropping hours group). Item 2's iOS half therefore changes NOTHING:
no lettered face, no formatter work, no locale pin, no digit work. The mirror
(item 1) still reaches the iOS tree through the layout direction patch (D135.2).

**D135.6 The conditional locale-pin hunk is dead.** Her amendment's "no
formatting change" on iOS removes the pin branch outright (it was born
conditional on the simulator showing native digits; the iOS 26 probe showed Latin
already, and her order closes the question regardless). Step 4's simulator read
under system Arabic stays as a CONFIRMATORY transcription only: it records what
the untouched face renders on the iOS 18.5 runtime and never patches anything.

**D135.7 Seconds never render in the widget countdown.**
The widget is minutes-resolution and was minutes-resolution before multiple languages
(the v1 words carried `s` unread); adding seconds would be a redesign. The label
clamps at `1m` for the final 59 seconds, matching the app's rounds-up law at the
widget's resolution.

**D135.8 Inline lock faces stay system-laid.**
`accessoryInline` is one concatenated system-rendered line; bidi orders the Arabic
name and the Latin time in reading order without structural mirroring, and the repo measured
an inline line cannot hold a ticking timer. No change.

**D135.9 The countdown label's own script order never mirrors.**
`4h 20m` is a Latin run; it reads left to right inside the mirrored card, exactly as
the app countdown row carries its own `direction: 'ltr'` pin (`Countdown.tsx`
`styles.timerRow`). On Android the label is one `AText` string (bidi keeps the run
LTR); on iOS the timer text is one `Text`. No isolate characters are needed on either
platform because the label never shares a text node with Arabic content.

**D135.10 No `yarn test:tz`.** No date logic changes (the builder's date math is
untouched; only baked string bytes and tree shape change). Named here so the executor
does not guess.

**D135.11 Superseded by the amendment: the widget letters take the app's HEAD
sizing through composition.** The earlier ruling (letters ride the widget's
single text style) held only while the widget label was one string; her
amendment names the app component's face at HEAD sizing, and D135.4's composed
label delivers it (letters at 0.95 x the digit size, tight, 12 point group gap at
the 26 point digit size). The per-locale digit SIZE stays the widget's own settled
26 (the amendment binds the letters' ratio, not the widget's type scale).

**D135.12 Anchors re-pinned to the post-step-1 tree (agent-ruled 2026-10-18,
lead plan repair).** Step 1's merged edits (the owner-amendment reshaping of
`ALabel` into its parts form and the fixed-Latin `widgetStrings` bake)
consumed the planning-time pins of `alabel.txt`, `widget-strings-bake.txt`
and `widget-strings-docblock.txt`, so step 2's anchor check and any preflight
re-run could never pass. Options: (a) re-pin the three anchors to the
post-step-1 text; (b) drop `alabel` from step 2's check and mark the
preflight planning-time. Committed (a): the anchors guard do-not-touch
regions beside the step-2 edit site, and a permanently-failing gate in the
folder misleads any resume; re-pinning keeps the gate truthful and runnable.
The step files need no change (they name the anchors, not their bytes).

**D135.13 The mirrored medium wrapper pins a fixed width (agent-ruled
2026-10-18, lead repair of the step-4 3T stop).** Step 4's first Arabic read
found the hero half collapsed to a zero-width trailing container (the
transcription lives in LOG.md): under rtl the list wrapper draws first still
carrying `fillMaxWidth`, and the Android mapping measures a fill child
against the whole row, starving the fixed-width hero after it — the same
starvation class the file's own REFERENCE comment records from the
pre-snapshot era. The repair swaps the wrapper's width mechanism under rtl
alone: `width(LIST_WIDTH)`, the exact leftover the fill resolved to under
LTR, so both halves carry fixed widths summing to the grant. The mirror
table stands untouched (order, alignments, insets, textAlign); the falsy
tree is byte-identical (R1.2); no pixel constant moves; a red renderer test
plus a mutation pass pin it.

### 2.2 The executor must not decide

- Anything that changes a pixel beyond the owner's order: STOP and route to the plan
  (this plan's mirror table is exhaustive).
- If the 3T or XS widget face on glass disagrees with the plan's expected reading:
  STOP with the screenshot transcribed.
- The iOS countdown takes NO change of any kind (her 2026-10-18 amendment); if a
  review or device read suggests formatting it, STOP and cite D135.5.

## 3. Pre-flight

Committed at `scripts/preflight-135.sh` in this folder. The executor saves a copy to
`$TMPDIR` and runs it from there against the lane worktree. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Code map (anchors under `scripts/anchors/`):

- `widgets/PrayerWidget.tsx` — one serialized body serving all 8 Android home kinds
  and the 8 iOS home kinds. `androidRender` (line 434) computes the label, day list
  and active row at render time. `ALabel` (line 383) composes the countdown label.
  The medium composition (lines 555 to 582) is the mirroring surface; the small
  composition and the stale/neutral cards are centered and direction-neutral. The
  iOS composition (lines 643 to 869) mirrors natively once the patch applies the
  environment direction; its JS is untouched.
- `widgets/LockPrayerWidget.tsx` — the 6 iOS lock kinds (layouts 1/2/3, each times
  two schedules). Untouched: the patch's environment direction flips their HStack
  halves and stacks natively.
- `shared/widgetTypes.ts` — the props contract. `rtl` field docblocks (iOS line 146,
  Android line 243) updated to the consumed truth; versions stay 8 and 4; the
  `WidgetStrings` unit-field docblock (line 174) rewritten to the fixed-Latin law.
- `shared/widgetTimeline.ts` — `widgetStrings()` (line 62) is the measured build
  site of the Arabic unit letters; the builder stamps `rtl` (lines 210, 271, 350).
- `stores/widget.ts` — the push layer; unchanged (it already re-pushes on the
  language switch's convergence pass: `stores/notifications.ts:1616,1627` and
  `stores/sync.ts:253,259`, so `rtl` and the fixed letters re-bake on a switch).
- `patches/expo-widgets+58.0.20.patch` — five hunks today (openApp converter, the
  device-locale injection across four files). Step 3 adds the `EntryView.swift`
  direction hunk.
- `node_modules/expo-widgets/ios/Widgets/EntryView.swift` — the patch site: the
  entry's `props` dictionary is in scope where `WidgetsDynamicView` is built.
- `components/countdown/Countdown.tsx` — the app face at HEAD: lettered groups,
  zero-drop (`spent`), lowercase fixed letters; the law the Android label already
  matches.
- `shared/time.ts` `formatTimeAgo` — the lettered duration law's other expression
  (row 83); reference for the group-join shape, not changed.

Existing tests and what they prove:

- `shared/__tests__/widgetSnapshot.test.ts` — the Android snapshot's baked strings
  and `rtl` stamp; goes red on D135.4 under the ar locale.
- `shared/__tests__/widgetTimeline.test.ts` — the iOS timeline's `rtl` stamp and
  volumes; the stamp tests stay green (D135.3).
- `shared/__tests__/widgetContract.test.ts` — the version numbers and shape
  contracts; stays green (8 and 4 unchanged).
- `shared/__tests__/widgetRenderer.test.ts` — renders the REAL module under both
  platforms' globals; carries the Android mirror reds (tree-order assertions).
- `shared/__tests__/widgetLockRenderer.test.ts` — the lock layouts; stays green (no
  JS change).
- `shared/__tests__/widgetOpenAppPatch.test.ts` — the patch-content guard; its
  exactly-five-hunks assertion goes red and re-pins to six with the direction hunk.
- `shared/__tests__/widgetRuntimeLoads.test.ts` — the widget runtime load suite;
  must run green after the patch changes (`ai/AGENTS.md` install rule).
- `shared/__tests__/androidWidgetGrid.test.ts`, `widgetAssets.test.ts`,
  `widgetStaticStrings.test.ts` — the kinds grid, assets and static tables;
  untouched, must stay green.

Why the obvious fix is wrong: flipping the Android row by wrapping it in a transform
(scaleX -1 on each row plus a counter-flip on each text) is the transform hack the
order bans, and it breaks hit-targets and kerning; reordering only the two row boxes
without swapping alignments and lead paddings produces a half-mirrored face (name
right-aligned inside the left-positioned box). The mirror table swaps every
directional input at once or none.

## 5. Design

Invariant: **the widget tree under `rtl === true` is exactly the LTR tree with every
directional input swapped (child order, start/end alignments, lead paddings,
textAlign), and byte-identical under `rtl` falsy; on iOS the swap is the environment
direction the patch applies, on Android the composition mirror inside the body.**

Rejected alternatives: patching the peek AAR (unreachable, ask-first); the Host wrap
(P16, red box); static lettered iOS face (lies between entries); per-minute iOS
entries (the row 11-era CPU measurement: 5 to 13 CPU-seconds per kind per reload, ten
kinds exceeded the extension budget); retiring the `WidgetStrings` unit fields
(schema churn for zero behaviour).

Concurrency trace: the snapshot and timeline builders are pure; the push layer is
unchanged; the widget body runs single-threaded per render in the widget runtime; the
patch applies at install. No new shared state. The language switch's convergence
re-push is the only writer that changes `rtl` mid-flight, and it already serialises
through the notification commit queue (rows 39/78).

Acceptance criteria:

- [R1.1] WHEN the Android medium widget renders a snapshot whose `rtl` is true THE SYSTEM SHALL draw the time `Box` before the name `Box` in each row's tree order, the time `Box` aligned `centerStart` with textAlign `start` and width `ROW_TIME_WIDTH`, the name `Box` aligned `centerEnd` with width `ROW_NAME_WIDTH`, the list wrapper aligned `centerStart`, its inner box `topEnd`, and the pill and rows columns padded from the END edge by `PILL_LEAD` and `ROWS_LEAD`.
- [R1.2] WHEN the Android medium widget renders a snapshot whose `rtl` is falsy THE SYSTEM SHALL draw the tree byte-identical to the composition at the Planned-at sha.
- [R1.3] WHEN the Android small widget or a stale or neutral card renders under any `rtl` THE SYSTEM SHALL draw the same centered composition as at the Planned-at sha, with no directional input swapped.
- [R2.1] WHEN an iOS timeline entry whose `rtl` is true renders THE SYSTEM SHALL apply `.environment(\.layoutDirection, .rightToLeft)` to the entry's whole tree, read by the patched `EntryView` from `entry.props`.
- [R2.2] WHEN an iOS entry renders with `rtl` absent or false THE SYSTEM SHALL apply `.environment(\.layoutDirection, .leftToRight)`, pinning LTR even on an RTL system locale.
- [R2.3] WHEN the patch file is applied by patch-package THE SYSTEM SHALL carry exactly six `diff --git` headers, all inside `node_modules/expo-widgets/`.
- [R3.1] WHEN the Android countdown label renders under any app locale THE SYSTEM SHALL compose its groups as digit runs at the hero size with lowercase Latin unit bytes tight against each run at 0.95 x the digit size in the same colour and weight, groups 12 points apart, digits unpadded, zero-valued groups dropped, minutes clamped at 1.
- [R3.2] WHEN the snapshot is baked under the Arabic app locale THE SYSTEM SHALL bake `strings.h === 'h'`, `strings.m === 'm'`, `strings.s === 's'`, never `س`, `د`, `ث`.
- [R4.1] WHEN the iOS countdown ticks under any system locale THE SYSTEM SHALL render exactly the Planned-at face with no formatting change (her 2026-10-18 amendment), transcribed once on the iOS 18.5 simulator under system Arabic as confirmation.
- [R5.1] WHEN any LTR app locale renders any of the 14 kinds THE SYSTEM SHALL keep every direction input identical to the Planned-at sha (tree order, alignments, paddings, textAlign), and produce byte-identical snapshot and timeline bytes under `en`; the unit-letter fields follow R3.2 in every locale.
- [R5.2] WHEN the language switches to or from Arabic THE SYSTEM SHALL re-bake the widget props through the existing convergence re-push, with no new wiring.

## 6. Steps

Checklist:

1. Step 1 `steps/01-android-letters.md` — the fixed Latin unit bytes (code, weight 2).
2. Step 2 `steps/02-android-mirror.md` — the composition mirror (code, weight 2).
3. Step 3 `steps/03-ios-direction-patch.md` — the EntryView patch and the consumed
   field (code, weight 2).
4. Step 4 `steps/04-device-proof.md` — builds, 3T and XS reads (device, weight 3,
   alone).
5. The audit's docs commit carries the row text and the deep clean (no step file; the
   lead owns it).

## 7. Device proof

See `steps/04-device-proof.md`. Builds run only after the code merges to `uat`, under
`$HOME/athan-gitree/build.lock`; the fleettest APK is built by step 4's
scratch-worktree ritual (`plan-135`, the suffix exported inside its own prebuild and
build), because `build-mock.zsh` hard-unsets the suffix and cannot produce the
fleettest id; `aapt2 dump badging <apk> | grep "^package"` must print
`com.example.athan.fleettest` before any install (check `aapt2` exists first); every
phone contact holds `$HOME/athan-gitree/device-<SERIAL>.lock`; the XS is the owner's
phone: her app data is never opened, her system settings are never touched, the app
language and any placed state are restored as found, and her glass read is named in
the row. No clock changes are needed (no alarm assertions in
this ticket), so no `dumpsys alarm` read is required by this plan; the mock's Asr
runway makes the countdown target predictable if a mid-hour face is needed.

## 8. Records

The findings text for `LOG.md`, the queue cell text the lead applies on DONE, and the
docs commit message live in `steps/records-135.md`.

## 9. Push

None. The lane never pushes. The orchestrator pushes `uat` when every unpushed commit
is audited.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `widgetOpenAppPatch.test.ts` fails on hunk count after step 3 | the hunk-count pin | re-pin to six in the same commit as the hunk |
| patch-package reports the expo-widgets patch failing to apply | the hunk context drifted after a rebase | regenerate the hunk against the installed 58.0.20 with `npx patch-package expo-widgets`, re-run the load suite |
| the Android renderer test finds the mirrored tree half-swapped | a table row missed in step 2 | compare against R1.1's table line by line; every directional input swaps or none |
| the 3T widget does not change after the language switch | the convergence re-push did not run | re-open the app once (foreground sync re-pushes); if still stale, capture logcat `WIDGET:` lines and STOP |
| the XS widget renders unmirrored after the install | the pod cache kept the old Swift | clean the pod build for the widget extension and rebuild; do not disable the widget flag |
| the iOS 18.5 simulator's countdown shows non-Latin digits under system Arabic | the platform face's own locale behaviour, which her amendment keeps | transcribe it as the confirmatory read; change nothing; name it in the row for her veto |

Anticipated review fixes, word for word: the `WidgetStrings` docblock still
says "catalog keys" after the fix; the
patch test's hunk list names five files where six now apply; the LOG.md ledger misses
the `session:` line on a step heading; a step re-adds an iOS countdown formatting
change her amendment banned.

## 11. Subagents

Planning used `vision` (the probe screenshots; this session cannot see images).
Delivery: the lead dispatches `athan-executor` for steps 1 to 3 and step 4, and
`athan-reviewer` twice for the audit (plan-conformance and blind). Every worker may
call `vision` for an image it cannot see. Nothing else.

## 12. Report to the owner

Plain sentences at DONE: the widgets mirror under an Arabic app locale on both
platforms (Android by a composition mirror keyed off the app locale, iOS by the
platform's own layout direction applied from the stamped field), the Android
countdown label renders the app countdown component's face at HEAD sizing (Latin
digits, lowercase h m at 0.95 x, tight, 12 point group gap) in every language, the
iOS countdown is untouched by her own amendment, LTR locales render byte-identical,
and the `rtl` field is consumed (row 129 closed). Her read of a placed widget under
Arabic on each phone is the acceptance.
