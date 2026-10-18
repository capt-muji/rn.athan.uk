# Blind review: b5bee6a9..a1c6347a (uat), diff surface of ticket 135 (widget RTL mirror + label face)

Verified from the repository: the four widget suites pass (107/107), `tsc --noEmit`
exits 0, Biome clean on all seven touched files, the EntryView hunk reverse- and
forward-applies cleanly to the installed node_modules copy, and the patch filename
matches the exact pin `expo-widgets@58.0.20` (package.json:62).

## RTL mirroring logic (widgets/PrayerWidget.tsx)

No half-mirror found. Every directional input swaps together under `rtl === true`:
row child order (timeBox/nameBox, lines 593-594), both box alignments (581, 588),
the time Text's textAlign (345), the halves' order (636-637), the wrapper
alignment and its fill-to-fixed width swap (611-612), the inner list box
alignment (613), and both lead paddings (614, 622). The LTR path is proven
byte-identical under rtl falsy by test (widgetRenderer.test.ts:1046-1063), and
the small and stale compositions are direction-neutral by test (:1110-1124). No
finding.

## Countdown label composition (widgets/PrayerWidget.tsx:404-423)

1. [SHOULD] widgets/PrayerWidget.tsx:416 - the inner `<Row>` of each label group
   carries no `verticalAlignment`, and the converter defaults a Row's children to
   `Alignment.Top` (node_modules/.../ExpoWidgetEmittableTree.kt:507-521), so the
   24.7sp letter top-aligns against the 26sp digit and its baseline rides about
   1sp high. The app component whose face this replicates nests the letter inside
   the digit's Text (components/countdown/Countdown.tsx:90-93), which aligns the
   baselines; the test asserts size, colour and weight parity
   (widgetRenderer.test.ts:800-804) but nothing vertical. - Add
   `verticalAlignment='center'` to the inner Row (the converter exposes no
   baseline alignment; center is the closest expressible) and assert it in the
   composition test.

Zero-drop (hours===0, minutes===0 branches), the Math.max(1, ceil) clamp, the
12dp inter-group Spacer, and the 26/26*0.95 sizes all verified correct against
the fixture arithmetic. No further finding.

## Schema and contract safety

`rtl` is a boolean (JSON-safe), stamped on iOS entries and the stale guard entry
(widgetTimeline.ts:211, 272) and on the Android snapshot (:351). Absent-field
guards are correct on both sides (`input.rtl === true` at PrayerWidget.tsx:485;
`(entry.props?["rtl"] as? Bool) ?? false` in the patch, where
TimelineEntry.props is `[String: Any]?` so the optional chain is sound and
NSNumber bridges to Bool). Versions v8/v4 already carried rtl before this range,
so no bump was needed and none was taken. No finding.

## Patch content (patches/expo-widgets+58.0.20.patch:150-170)

The hunk reverse-applies to the installed EntryView.swift and forward-applies
again (verified with `patch -p1 --dry-run` both ways), the added lines are valid
Swift against the real `WidgetsDynamicView` signature, the falsy default is
pinned byte-for-byte by widgetOpenAppPatch.test.ts:56-58, and the patch touches
nothing but the layout direction: the iOS countdown's timer interval, modifiers
and text stay untouched. widgetOpenAppPatch.test.ts:43 pins the header count at
6 so a stray hunk fails. No finding.

## Stale comments and dead code

2. [NICE] shared/widgetTypes.ts:21,34 - the v8/v4 version-history comments still
   describe rtl as "(blocked, P16)" being read "when the Host renders": the
   field is now consumed, by the patched EntryView on iOS and the composition
   mirror on Android, and no Host read exists. The field docblocks above
   (:147-151, :246-250) were corrected but the history lines were left saying
   blocked, and widgetContract.test.ts:61 pins the stale words in place. -
   Reword the two history lines to the shipped mechanism and update or drop the
   split-count expectation in the contract test.

3. [NICE] shared/i18n/{en,ar,ms,so,hi,th}.ts:~155-160 - the `duration.h`,
   `duration.m` and `duration.s` catalog keys are now read by nothing: this
   change removed the last reader (widgetTimeline.ts:64-66 bakes fixed literals;
   the app's Countdown hardcodes UNIT_LETTERS at components/countdown/Countdown.tsx:27).
   Eighteen dead lines across six catalogs plus the three rows in the i18n test
   table (shared/__tests__/i18n.test.ts:179-181). - Delete the keys and the test
   rows, `duration.now` stays (time.ts:644, widgetTimeline.ts:67).

## Test honesty

The renderer suite loads the real layout module with marker stubs, the patch
suite reads the real node_modules files, the snapshot suite proves the fixed
Latin letters can fail (ar catalog holds `س`/`د`), and the mirror suite asserts
exact structure keyed to the swap rather than indexes. Nothing mocked away its
subject. The two fixed-letter snapshot tests overlap (the every-locale sweep
subsumes the ar case); harmless, not reported as a finding.

## Surfaces outside the described change

The iOS lock widgets also flip under the patched environment modifier via
logical leading/trailing, which is the feature's stated intent, and the Android
small composition is deliberately unmirrored. Nothing outside the named surfaces
changed behaviour.

Verdict: PASS
