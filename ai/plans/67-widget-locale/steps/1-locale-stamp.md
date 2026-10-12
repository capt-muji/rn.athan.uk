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
- `shared/__tests__/widgetSnapshot.test.ts` (change)
- `stores/__tests__/widgetAndroid.test.ts` (change)
- `shared/__tests__/widgetSimulation.test.ts` (change: digest re-gold)

## Red tests

Write these first, against unchanged code (the resume route below re-proves
the same red from the saved patch instead of hand-writing them):

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
7` and the Android pair); the new locale assertions fail with `undefined`
(the snapshot read) and `false` (the every-entry check). No
other case fails. A failure elsewhere is a STOP.

Resume route (the saved patch): the patch at
`$HOME/athan-gitree/sessions/67-exec/step1-sixfiles.patch` carries the tests
above plus the implementation and applies cleanly at `7011229e`, so red is
re-proved in stages:

1. `git apply "$HOME/athan-gitree/sessions/67-exec/step1-sixfiles.patch"`.
   A reject is a STOP.
2. `git diff -- shared/widgetTypes.ts shared/widgetTimeline.ts widgets/PrayerWidget.tsx > "$TMPDIR/67-impl.patch"`
   (the implementation part, saved off).
3. `git checkout uat -- shared/widgetTypes.ts shared/widgetTimeline.ts widgets/PrayerWidget.tsx`
   (the tree now holds the patch's tests against unchanged implementation).
4. Run the red command above: six failures return, the five recorded plus
   `flips to the stale card at the last readable row when only unreadable
   rows follow it` failing on `locale: 'en'` (the patch carries contract 5's
   expected-object edit against the reverted builder); no other case fails.
   Then `git apply "$TMPDIR/67-impl.patch"`. The patch has already delivered
   contracts 1 to 5: verify each landed, then apply contracts 6, 7 and 8 by
   hand.

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

6. The two missed version pins:
   `shared/__tests__/widgetSnapshot.test.ts:175`
   (`expect(snapshot.v).toBe(3)` inside `it('stamps the version and the
   schedule')`) and `stores/__tests__/widgetAndroid.test.ts:161`
   (`expect(props.v).toBe(3)` inside the updateSnapshot mock assertion) each
   become `toBe(4)`.

7. `shared/__tests__/widgetSimulation.test.ts`: re-gold `REAL_YEAR_TIMELINES`
   per the table's own protocol. After the version bump, the twelve
   `builds byte-identical timelines` cases fail, each printing its full
   `Received:` hex digest. Each received digest must equal the value pinned
   here, measured by the isolated rerun (a scratch worktree at `d6ca9ade`
   plus only the six-file diff; no hash-relevant byte moved since). Any
   difference is a STOP under section 10. The table becomes, in row order:

```ts
    ['2024-01-10', '4d02e13b4d35db0ba78953e1f9dab06fb7e4ca47b2fc8a9b45809fb519d24723'],
    ['2024-02-20', 'ec2140a89ea89741c28cb5f6a45452657d25ef79c978d514230c17f54a1d38ee'],
    ['2024-03-24', 'fa2d3ff4636b950b6b4fb28e82200c50ac51b2668ff76ff6b632bbb1dc7929ca'],
    ['2024-04-15', '0e5619bd614fefbe5475a576da4e62fde50078ffa6ab64c6030d9e668c043433'],
    ['2024-05-06', 'af45d685390d4c85a7275920b3bc128ef47316632c4d5be1f018d23995b1a25a'],
    ['2024-06-14', '90d5225212561f76fdeb85c8230937dea979cb727f480366b291a2520d09ea6b'],
    ['2024-07-01', '7ae75b9d75635deb41cc3848e2d1b6f3385be332bc1bf7ec1c217ef5e3576192'],
    ['2024-08-12', '97b2727ff810ff090717960978d41b888e9eef5e55b376a0d9c900b6682dba74'],
    ['2024-09-02', '6b4c11950f8dc50cb33b2b61a7d7db99fc533e66d3cd1fa6cc21ea5b6abb4a98'],
    ['2024-10-20', '3e0f3fc90d986b9c83b99ba3c0699b29fc862ad110cfb6a5d830510b08929f72'],
    ['2024-11-11', 'f1c351dd036c25fe1962725d60145e3a93bab243dc5b4b3d85e2f66882acc77e'],
    ['2024-12-15', '15afa6b360c381a071646670aca83dd77d5af93a5a131ac8d75bd77b26b45a45'],
```

   Append the block's history note the two earlier re-golds carry:
   `Re-golded again when props v8 stamped the app locale on every entry
   (job 67).` The `locale` value itself stays pinned by
   `widgetTimeline.test.ts`'s assertions, not by these digests.

8. Format: after the contracts above, run
   `npx biome format --write widgets/PrayerWidget.tsx shared/__tests__/widgetRenderer.test.ts`.
   It collapses contract 3's `digitLocaleKey` block to one line and wraps the
   re-keyed `androidProps({ strings, locale: 'ar' })` render line near
   `widgetRenderer.test.ts:516`. The `localiseDigits` keying line (109
   characters, under the 120 line width) is left unchanged — the exact form
   the break script substitutes against. A diff beyond those two shapes is a
   STOP.

What the contract must never do: touch `widgets/LockPrayerWidget.tsx`, the
patch file, `widget-statics.json`, the `STATIC` tables or the null-props path;
read the locale from a module-scope import inside the widget function (the
closure law); make the field required; bump only one of the two versions.

## Green run

Apply contracts 1 to 6 and 8, then:

```
npx jest shared/__tests__/widgetRenderer.test.ts shared/__tests__/widgetContract.test.ts shared/__tests__/widgetTimeline.test.ts shared/__tests__/widgetStaticStrings.test.ts shared/__tests__/widgetSnapshot.test.ts shared/__tests__/widgetSimulation.test.ts shared/__tests__/widgetLockRenderer.test.ts shared/__tests__/widgetRuntimeLoads.test.ts stores/__tests__/widgetSettingsSync.test.ts stores/__tests__/widgetIo.test.ts stores/__tests__/widgetAndroid.test.ts --watchman=false --selectProjects=unit
```

Expected: every case passes except the twelve
`builds byte-identical timelines` cases, each failing with its `Received:`
digest equal to the value contract 7 pins. Apply contract 7, rerun the same
command: all pass. Then:

```
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Both exit 0. `widgetLockRenderer.test.ts` guards R2.2's
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
(`versionName`). Add the nine files, `app.json` and `package.json` by name
(`android/app/build.gradle` is gitignored and untracked: bump it on disk,
never add it), plus `ai/plans/README.md`
(`IN PROGRESS, step 1`) and the plan's `PLAN.md` and `LOG.md`. Message:

```
<VERSION> - feat(widgets): widget digits follow the app locale

Every pushed iOS entry (v8) and Android snapshot (v4) carries the active locale
id; the home widget's digit map, legacy footers and v1 fallback words key off
it, with the device-locale chain kept for blobs predating the field. Static
copy stays device-keyed; the lock widget is untouched. R1.1-R2.2.
```

## Review checklist

- The diff touches only the nine listed files, the three version files, and the
  plan and queue files.
- `LockPrayerWidget.tsx`, the patch and `widget-statics.json` are byte-identical.
- Both version history blocks carry their new line.
- The two new renderer cases exist; both v1 fixtures strip the stamp.
- Both `toBe(4)` pins landed (`widgetSnapshot.test.ts:175`,
  `widgetAndroid.test.ts:161`).
- `REAL_YEAR_TIMELINES` carries the twelve pinned values and the block's
  re-gold line names props v8 and job 67.
- No `locale` read reaches a module-scope reference inside the widget function.

## Merge

`git checkout uat && git merge --no-ff feat/67-widget-locale -m "<VERSION> -
merge feat/67-widget-locale: step 1, app-locale digit keying"`. A conflict
aborts and STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the heading, shas, hook lines, break
line and `session:` line, ticket set EXECUTED per Finishing.
