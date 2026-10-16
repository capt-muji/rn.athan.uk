# Step 2: The landed state and the seams

Requirements: R2.1, R2.2
Weight: 1

## Anchor check

The step 1 anchor check, all eight anchors, unchanged. Same expected output, same drift
protocol.

## Goal

`FINDINGS.md` sections 3 and 4 exist: what rows 39 and 88 shipped, D44/D79's device-keyed
ground, row 69 verbatim, the patch's hunks and PR state; and the seams. No code changes.

## Branch

```bash
cd "$HOME/athan-gitree/worktrees/lane-117"
git checkout -b docs/117-2-landed-state lane/117
```

## Files

- `ai/plans/117-widget-language-inventory/FINDINGS.md` (sections 3 and 4)
- `ai/plans/README.md` (ticket line: IN PROGRESS, step 2)
- this plan folder's `PLAN.md` (checklist tick) and `LOG.md`

## Red

FINDINGS.md sections 3 and 4 do not exist. The step's commit creates them; the "red" is
their absence, recorded as such in LOG.md.

## Change contracts

Section 3, the landed state: row 39's widget half (the precomposed footer, props v7, commit
`ed8ce964` 2.0.32; the widget-runtime locale patch, 2.0.34 fixed 2.0.46, with the D44
device-keyed STATIC tables and `shared/i18n/widget-statics.json`; the per-locale native
strings, `app.json` locales plus `shared/i18n/native-strings.json`, pinned by
`shared/__tests__/nativeLocalesConfig.test.ts`; the language-switch convergence re-push,
`stores/language.ts:85-97` through `stores/notifications.ts:1616, 1627`). Row 88's widget
half (the native-digit map deleted at `3c1b620f` 2.0.744; every composed byte Latin by
construction, the regression pin at `shared/__tests__/widgetTimeline.test.ts:224-241`; the
SwiftUI ticking countdown left system-formatted, named in the row's record). D79's rule.
Row 69's parked scope quoted verbatim from its queue cell. The patch's two hunk families:
the openApp action (Android, PR `expo/expo#51292` per `ai/UPSTREAM-PRS.md:12`) and the
device-locale injection (Android `LocaleList.getDefault().get(0).language` through
WidgetsJSRuntime.kt and the cpp runtime; iOS `Locale.current` in WidgetsJSRuntime.swift; no
PR today). The versions table note: `ai/UPSTREAM-PRS.md` still names the patch
`expo-widgets+58.0.5` while the file is `expo-widgets+58.0.14.patch` (or newer after
ticket 111's rebuild); record the live filename.

Section 4, the seams, each with file:line and, where code cannot settle it, the live read:

1. The stale-card keying asymmetry: iOS home and lock stale faces read the device locale
   (`widgets/PrayerWidget.tsx:588-615` staticRow; `widgets/LockPrayerWidget.tsx` stale
   faces), Android's v2+ stale card reads the app-locale baked `strings`
   (`widgets/PrayerWidget.tsx:414-432, 439-448`): an app-locale/device-locale mismatch
   shows two different languages across platforms for the same state.
2. The Android unit letters localise (`shared/widgetTimeline.ts:63-64` bakes
   `t('duration.h')`/`t('duration.m')`) while every app surface's letters are fixed Latin
   by rows 83, 85 and 102: under ar the widget renders `1س 12د` beside an app rendering
   `1h 12m`.
3. The iOS countdown is system-formatted (no format control crosses the `@expo/ui` bridge),
   so its digits and separators follow the device's settings, outside both the app locale
   and row 88's Latin-everywhere ruling; a device set to a numbering system other than
   Latin may render non-Latin countdown glyphs. Live read: a simulator run per device
   language, reading the widget face (D117.3 defers it).
4. The `rtl` field is stamped (v8/v4) and read by nothing in either widget module (row 68's
   P16, the Host application blocked): Arabic widget content lays out in an LTR shell; the
   list rows and the name-time order do not mirror.
5. The gallery falls back to the English base strings on a device set to a language outside
   the six.
6. The v1-snapshot fallback words: unit letters `h`/`m`/`s`/`now` as Latin literals with
   device-locale stale words (`widgets/PrayerWidget.tsx:439-448`); tolerated legacy from
   before v2 snapshots.

## Green run

The scripted citation check from step 1, extended to sections 3 and 4 (0 mismatches); the
queue-cell quote of row 69 byte-compared against `ai/plans/README.md` (record the diff
command and its `0`).

## Break script

None for a docs step; the LOG entry records the counts instead (6 landed-state rows, 6
seams).

## Version and commit

The step 1 commands, message:

```
<VERSION> - docs(plans): 117 step 2, the landed state and the seams
```

## Review checklist

- Row 69's quote is verbatim.
- Every landed-state claim carries its commit sha or its queue record.
- Each seam names both sides of the inconsistency with file:line.

## Merge

The step 1 merge commands, message `<VERSION> - merge docs/117-2-landed-state: the landed
state and the seams (117 step 2)`, then the lane fast-forward and the main-tree gradle
versionName.

## Done when

Checklist ticked, LOG.md entry under `### Step 02 — done` with the `session:` line.
