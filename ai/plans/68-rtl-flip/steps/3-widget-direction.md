# Step 3: The widget direction stamp

Requirements: R5.1
Weight: 2

## Anchor check

`widgettypes-ios`, `widgettypes-android`, `timeline-entry`. A count other
than 1 is a STOP.

## Goal

Every pushed widget blob carries an `rtl` boolean (schema v8 and v4) as the
schema groundwork the blocked Host application will read; this step touches no
widget module and renders nothing differently.

The blocked half, recorded here: `@expo/ui` 58.0.14's `Host` is
`requireNativeView('ExpoUI', 'HostView')`
(`node_modules/@expo/ui/build/jetpack-compose/Host/index.js:8`), and the
widget runtime has no such node — iOS falls to `ViewRenderer.swift`'s
`default:` (a red box in DEBUG), Android prints `View not found`
(`ExpoWidgetEmittableTree.kt:142-161`). The wrap waits on the runtime
(recorded in P16); the stamp ships so the data is already on the blobs when a
runtime renders it.

## Branch

`git checkout -b feat/68-widget-stamp uat`

## Files

- `shared/widgetTypes.ts` (change)
- `shared/widgetTimeline.ts` (change)
- `shared/__tests__/widgetContract.test.ts` (change: the pins)
- `shared/__tests__/widgetTimeline.test.ts` (change: the stale-entry object
  and the new direction assertions)
- `shared/__tests__/widgetSnapshot.test.ts` (change: the v pin)
- `stores/__tests__/widgetAndroid.test.ts` (change: the v pin)
- `shared/__tests__/widgetSimulation.test.ts` (change: the digest re-gold)

## Red tests

1. In `shared/__tests__/widgetTimeline.test.ts`, extend
   `it('carries the schema version into every entry')` with
   `expect(entries.every((entry) => entry.props.rtl === false)).toBe(true);`
   and add `expect(snapshot?.rtl).toBe(false);` beside the existing
   `buildPrayerWidgetSnapshot` assertions. Under the test locale (en) both
   assert false: the field exists and is boolean.

2. The four version pins become `toBe(8)` and `toBe(4)`:
   `widgetContract.test.ts:470`, `widgetContract.test.ts:485`,
   `widgetSnapshot.test.ts:175`, `stores/__tests__/widgetAndroid.test.ts:161`;
   the two `it` titles that read `stamps v7`/`stamps v3`
   (`widgetContract.test.ts:469,484`) become `stamps v8`/`stamps v4`.

Run the five suites. Expected: the direction assertions fail with
`undefined`; the pins fail `Expected: 8/4, Received: 7/3`; the stale-entry
whole-object assertion fails on the extra field. Every other case passes. Any
other failure is a STOP.

## Change contracts

1. `shared/widgetTypes.ts`: append to each history doc block — iOS
   `v8: every entry carries rtl, the widget direction the runtime will read
   when the Host renders (blocked, P16).` above
   `export const WIDGET_PROPS_VERSION = 8;`; Android `v4: the snapshot
   carries rtl beside its baked strings (blocked, P16).` above
   `export const ANDROID_SNAPSHOT_VERSION = 4;`. Add the field to both
   interfaces, after `stale?: boolean;` on the iOS entry and after
   `strings: WidgetStrings;` on the Android snapshot:

```ts
  /**
   * Whether the app locale this blob was composed for is RTL. Stamped for the
   * widget runtime's direction once it renders a Host; blobs from the prior
   * schema read as false.
   */
  rtl?: boolean;
```

2. `shared/widgetTimeline.ts`: import `localeDirection` and
   `currentLocaleId` from `@/shared/i18n/locale`; stamp
   `rtl: localeDirection(currentLocaleId()) === 'rtl',` as the third
   property in `makeEntry`'s props, in the stale terminal entry's props, and
   in `buildPrayerWidgetSnapshot`'s return.

3. The four pin edits and two title renames from the red section; the stale
   terminal entry's whole-object assertion in `widgetTimeline.test.ts` gains
   `rtl: false`.

4. `shared/__tests__/widgetSimulation.test.ts`: re-gold the twelve
   `REAL_YEAR_TIMELINES` digests per the table's own protocol after the
   version bump (run the suite, copy each `Received:` hex into its row,
   append the history line `Re-golded again when props v8 stamped rtl on
   every entry (job 68).`). A received digest is accepted only when the green
   run passes with every direction assertion green; any serialization delta
   beyond the `rtl` and `v` fields is a STOP.

What the contract must never do: touch any widget module, read the locale
inside a widget function, make the field required, or touch the deferred 67
folder and its saved patch.

## Green run

```
npx jest shared/__tests__/widgetContract.test.ts shared/__tests__/widgetTimeline.test.ts shared/__tests__/widgetSnapshot.test.ts shared/__tests__/widgetSimulation.test.ts shared/__tests__/widgetRenderer.test.ts shared/__tests__/widgetLockRenderer.test.ts shared/__tests__/widgetRuntimeLoads.test.ts shared/__tests__/widgetStaticStrings.test.ts stores/__tests__/widgetAndroid.test.ts stores/__tests__/widgetSettingsSync.test.ts stores/__tests__/widgetIo.test.ts --watchman=false --selectProjects=unit
npx tsc --noEmit
npx biome check . --error-on-warnings
```

All pass; exit 0 each. The renderer, static-strings and settings-sync suites
pass unchanged: the field is optional and the layouts read no direction.

## Break script

`bash scripts/break-step3.sh` from the plan folder, copied to `$TMPDIR`: it
deletes the `rtl` stamp from `makeEntry`'s props, runs the timeline suite,
expects the direction assertion to fail (`Expected: true, Received: false` on
the every-entry check), restores the file, ends `ALL AS EXPECTED: 1`.

## Version and commit

Version command: the next patch under the version lock. Add the seven files
plus `app.json`/`package.json` by name, `ai/plans/README.md` (`IN PROGRESS,
step 3`) and the plan's `PLAN.md` and `LOG.md`. Message:

```
<VERSION> - feat(widgets): rtl stamped on every blob (v8/v4), the Host wrap recorded blocked

iOS entries move to v8 and Android snapshots to v4 carrying rtl; the twelve
simulation digests re-gold under the table's protocol; no widget module
changes (the runtime renders no Host, P16). R5.1.
```

## Review checklist

- The diff is the field, the version constants, the pins and the digest
  table; no widget module changed.
- Both history blocks carry their new line and name the blocked Host.
- The digest table's new note names props v8 and job 68.
- The deferred 67 folder and its saved patch are byte-identical.

## Merge

`git checkout uat && git merge --no-ff feat/68-widget-stamp -m "<VERSION> -
merge feat/68-widget-stamp: step 3, the widget direction stamp"`. A conflict
aborts and STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the heading, shas, hook lines, break
line and `session:` line.
