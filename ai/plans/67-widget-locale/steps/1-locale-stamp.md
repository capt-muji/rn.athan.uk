# Step 1: The locale stamp and the digit re-key

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R2.1, R2.2
Weight: 2

## Anchor check

Run the pre-flight (`scripts/preflight-67.sh`, copied to `$TMPDIR`, run from the
repository root). Anchors this step edits against: `types-ios-version`,
`types-android-version`, `types-stale-field`, `types-strings-field`,
`timeline-import`, `timeline-entry`, `timeline-stale`, `timeline-snapshot`,
`widget-localekey`, `widget-digitcomment`, `widget-localise`, `renderer-ar`,
`renderer-v1`, `contract-ios`, `contract-android`. A count other than 1 is a
STOP.

## Goal

Every pushed widget props blob carries the active app locale id; the home
widget's digit map keys off it with the device-locale fallback; the pinning and
renderer suites assert the new keying.

## Branch

`git checkout -b feat/67-widget-locale uat`

## Files

- `shared/widgetTypes.ts` (change)
- `shared/widgetTimeline.ts` (change)
- `widgets/PrayerWidget.tsx` (change)
- `shared/__tests__/widgetRenderer.test.ts` (change)
- `shared/__tests__/widgetContract.test.ts` (change)
- `shared/__tests__/widgetTimeline.test.ts` (change)

## Red tests

Write these first, against unchanged code:

1. In `shared/__tests__/widgetRenderer.test.ts`, inside the Android-path
   describe, add (the Arabic `strings` object is the one the `:500` test
   carries: `androidProps` bakes English units under the `en` test locale, and
   the label joins digits to the unit word):

```ts
    it('draws ar digits from the stamped app locale while the device reads en', () => {
      // The defect row 67 exists for: an Arabic app on an English-configured
      // phone rendered 19د beside ٠٣:٣٠ rows. The stamp decides, not the device.
      (globalThis as { __expoWidgetDeviceLocale?: string }).__expoWidgetDeviceLocale = 'en';
      try {
        freezeNow(at(DAY_ONE, '15:01') + 30_000);
        const strings: WidgetStrings = {
          h: 'س',
          m: 'د',
          s: 'ث',
          now: 'الآن',
          staleTitle: 'غير محدّث',
          refreshLine: 'افتح Athan للتحديث',
          refreshLead: 'افتح Athan',
          refreshTail: 'للتحديث',
        };
        const tree = renderTree(
          layouts.PrayerWidget(androidProps({ strings, locale: 'ar' }), { colorScheme: 'light' })
        );

        expect(textsOf(tree)).toContain('١٩د');
        expect(textsOf(tree)).not.toContain('19د');
      } finally {
        delete (globalThis as { __expoWidgetDeviceLocale?: string }).__expoWidgetDeviceLocale;
      }
    });

    it('falls back to the device locale when the blob carries no stamp or one it does not know', () => {
      // Blobs from v7 entries and v3 snapshots predate the field, and a lying
      // blob can carry anything: both keep the D61 resolver's answer,
      // byte-identical to today. This case pins unchanged behaviour: it is
      // green at red and must stay green after the change.
      (globalThis as { __expoWidgetDeviceLocale?: string }).__expoWidgetDeviceLocale = 'ar';
      try {
        freezeNow(at(DAY_ONE, '15:01') + 30_000);
        const strings: WidgetStrings = {
          h: 'س',
          m: 'د',
          s: 'ث',
          now: 'الآن',
          staleTitle: 'غير محدّث',
          refreshLine: 'افتح Athan للتحديث',
          refreshLead: 'افتح Athan',
          refreshTail: 'للتحديث',
        };
        const { locale: _drop, ...unstamped } = androidProps({ strings });
        const unstampedTree = renderTree(layouts.PrayerWidget(unstamped, { colorScheme: 'light' }));
        expect(textsOf(unstampedTree)).toContain('١٩د');

        const lyingBlob = { ...androidProps({ strings }), locale: 'fr' };
        const lyingTree = renderTree(layouts.PrayerWidget(lyingBlob, { colorScheme: 'light' }));
        expect(textsOf(lyingTree)).toContain('١٩د');
      } finally {
        delete (globalThis as { __expoWidgetDeviceLocale?: string }).__expoWidgetDeviceLocale;
      }
    });
```

2. In `shared/__tests__/widgetContract.test.ts`, change the two pins:
   `expect(WIDGET_PROPS_VERSION).toBe(7)` becomes `toBe(8)`;
   `expect(ANDROID_SNAPSHOT_VERSION).toBe(3)` becomes `toBe(4)`, and each
   `it` title's `v7`/`v3` mention becomes `v8`/`v4`.

3. In `shared/__tests__/widgetTimeline.test.ts`, extend
   `it('carries the schema version into every entry')` (lines 292-295) with
   `expect(entries.every((entry) => entry.props.locale === 'en')).toBe(true);`
   and add `expect(snapshot?.locale).toBe('en');` beside the existing
   `buildPrayerWidgetSnapshot` assertions (around line 157).

Run:

```
npx jest shared/__tests__/widgetRenderer.test.ts shared/__tests__/widgetContract.test.ts shared/__tests__/widgetTimeline.test.ts --watchman=false --selectProjects=unit
```

Expected: the stamped-locale case fails with `Received array` holding `19د`;
the fallback case passes at red (it pins unchanged behaviour) and must stay
green after the change; the two version pins fail (`Expected: 8`, `Received:
7` and the Android pair); the new locale assertions fail with `undefined`. No
other case fails. A failure elsewhere is a STOP.

## Change contracts

1. `shared/widgetTypes.ts`: append to each history doc block the line the proof
   wrote — iOS `v8: every entry carries the app locale its strings were
   composed for, keying the render-time digit map (D78).` above
   `export const WIDGET_PROPS_VERSION = 8;`; Android `v4: the snapshot carries
   the app locale its baked strings were composed for, keying the render-time
   digit map (D78).` above `export const ANDROID_SNAPSHOT_VERSION = 4;`. Add the
   field to both interfaces, after `stale?: boolean;` on the iOS entry and
   after `strings: WidgetStrings;` on the Android snapshot:

```ts
  /**
   * The app locale this blob's strings were composed for. The render-time
   * digit map and legacy-footer parsing key off it (D78). Absent on blobs
   * from the prior schema, which key off the device locale (D61's resolver).
   */
  locale?: 'en' | 'ar' | 'ms' | 'so' | 'hi' | 'th';
```

2. `shared/widgetTimeline.ts`: add
   `import { currentLocaleId } from '@/shared/i18n/locale';` beside the i18n
   import; stamp `locale: currentLocaleId(),` as the second property in
   `makeEntry`'s props, in the stale terminal entry's props, and in
   `buildPrayerWidgetSnapshot`'s return.

3. `widgets/PrayerWidget.tsx`: between the `staticRow` pick and the digit map,
   add the stamp resolution, and key `localiseDigits` off it:

```ts
  // The digits follow the APP locale stamped on the props (D78), falling back
  // to the device locale the widget process itself reads (D61) when the blob
  // predates the field: the baked strings key off the app locale, so a
  // device-keyed digit map renders one card in mixed scripts.
  const stampedLocale = props == null ? undefined : (props as { locale?: string }).locale;
  const digitLocaleKey = (['en', 'ar', 'ms', 'so', 'hi', 'th'] as const).find(
    (code) => stampedLocale === code
  );
```

   and the map's keying line becomes
   `(digitLocaleKey ?? localeKey) === 'ar'`. The `STATIC` row, `staticRow` and
   the null-props path keep the device key (D79, R2.1).

4. `shared/__tests__/widgetRenderer.test.ts`: re-key the ar-device cases to
   stamp `locale: 'ar'` in their fixtures (the app and the device both ar:
   the real Arabic user; only the two Android-path cases break, the iOS v6
   case's hand-built fixture survives through the fallback and the stamp pins
   the new path there too), strip `locale` from both v1 fixtures (the
   tolerance case around line 528 and the ar fallback case around line 543) so
   each stays a true v1 blob, and keep the two new cases from the red section.

5. `shared/__tests__/widgetTimeline.test.ts`: the stale terminal entry's
   whole-object assertion (line 1132, the only one of its shape) gains
   `locale: 'en'` in its expected object.

What the contract must never do: touch `widgets/LockPrayerWidget.tsx`, the
patch file, `widget-statics.json`, the `STATIC` tables or the null-props path;
read the locale from a module-scope import inside the widget function (the
closure law); make the field required; bump only one of the two versions.

## Green run

```
npx jest shared/__tests__/widgetRenderer.test.ts shared/__tests__/widgetContract.test.ts shared/__tests__/widgetTimeline.test.ts shared/__tests__/widgetStaticStrings.test.ts shared/__tests__/widgetSnapshot.test.ts shared/__tests__/widgetSimulation.test.ts shared/__tests__/widgetLockRenderer.test.ts shared/__tests__/widgetRuntimeLoads.test.ts stores/__tests__/widgetSettingsSync.test.ts stores/__tests__/widgetIo.test.ts stores/__tests__/widgetAndroid.test.ts --watchman=false --selectProjects=unit
npx tsc --noEmit
npx biome check . --error-on-warnings
```

All pass; all three commands exit 0. `widgetLockRenderer.test.ts` guards R2.2's
unchanged lock widget, and `widgetRuntimeLoads.test.ts` loads the widget bundle
in the cut-down runtime, the closure-law guard for the file this step edits.

## Break script

`bash scripts/break-step1.sh`: reverts the `localiseDigits` keying line to
`localeKey === 'ar'` (the stamp ignored), runs the renderer suite, expects
`draws ar digits from the stamped app locale while the device reads en` to fail
with `19د` in the received array, restores the file, ends `ALL AS EXPECTED: 1`.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the version
lock. Set in `app.json`, `package.json` and `android/app/build.gradle`
(`versionName`). Add the six files, `app.json`, `package.json` and
`android/app/build.gradle`, by name plus `ai/plans/README.md`
(`IN PROGRESS, step 1`) and the plan's `PLAN.md` and `LOG.md`. Message:

```
<VERSION> - feat(widgets): widget digits follow the app locale

Every pushed iOS entry (v8) and Android snapshot (v4) carries the active locale
id; the home widget's digit map, legacy footers and v1 fallback words key off
it, with the device-locale chain kept for blobs predating the field. Static
copy stays device-keyed; the lock widget is untouched. R1.1-R2.2.
```

## Review checklist

- The diff touches only the six listed files, the three version files, and the
  plan and queue files.
- `LockPrayerWidget.tsx`, the patch and `widget-statics.json` are byte-identical.
- Both version history blocks carry their new line.
- The two new renderer cases exist; both v1 fixtures strip the stamp.
- No `locale` read reaches a module-scope reference inside the widget function.

## Merge

`git checkout uat && git merge --no-ff feat/67-widget-locale -m "<VERSION> -
merge feat/67-widget-locale: step 1, app-locale digit keying"`. A conflict
aborts and STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the heading, shas, hook lines, break
line and `session:` line, ticket set EXECUTED per Finishing.
