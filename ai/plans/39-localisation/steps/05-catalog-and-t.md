# Step 05: the id vocabulary and the catalog land together

The closed `PrayerId` union (space form), the `StoredPrayerId` subset, the English catalog
(flat, `as const`, byte-identical), `t()` behind a one-module loader, `prayerLabel()`, the
plural guard and the en byte-parity test. No call site migrates yet: production still reads
`Prayer.english` until step 06. This step only adds; the one edit inside existing code is the
constants file gaining the id arrays beside the title-case arrays.

Requirements: R3.1, R3.2, R4.2
Weight: 2

- Branch: `feat/38-05-catalog`
- Anchors: `constants-standard`, `constants-extras`, `night-branch`
- Files added: `shared/i18n/en.ts`, `shared/i18n/loader.ts`, `shared/i18n/index.ts`,
  `shared/__tests__/i18n.test.ts`
- Files changed: `shared/constants.ts` (id arrays added beside the name arrays)

## Contracts

1. `shared/constants.ts`:
   - `export const STANDARD_PRAYER_IDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'] as const;`
   - `export const EXTRA_PRAYER_IDS = ['midnight', 'last third', 'suhoor', 'duha', 'istijaba'] as const;`
     (`'last third'` with the space: the stored bytes are canonical, the underscore is a
     filename slug - R15's landmine finding).
   - `export type PrayerId = (typeof STANDARD_PRAYER_IDS)[number] | (typeof EXTRA_PRAYER_IDS)[number];`
   - `export type StoredPrayerId = Exclude<PrayerId, 'midnight' | 'last third'>;` (the nine ids
     with a stored time field; A8).
   - `PRAYER_IDS` = the concatenation, `as const`.
2. `shared/i18n/en.ts`: `export const en = { ... } as const satisfies Record<string, string>;`
   holding the prayer labels as `prayer.fajr: 'Fajr'` through `prayer.istijaba: 'Istijaba'`
   (all 11, byte-identical to `PRAYERS_ENGLISH`/`EXTRAS_ENGLISH` members) and, from this step's
   census pass, the wave-zero strings: the 27 help strings, 14 What's New strings, and the
   Settings labels (`settings.title: 'Settings'`, `'Show seconds'`, `'Show time passed'`,
   `'Show decorations'`, `'Countdown Bar'`, `'Show countdown bar'`, `'Other'`, `"What's new"`,
   `'Help'`). Flat dot keys, one object, no nesting. `export type TranslationKey = keyof typeof en;`
   `export type Catalog = Record<TranslationKey, string>;` and, beside the catalog,
   `export const PRAYER_LABELS: Record<PrayerId, string>` built from the catalog's own
   `prayer.*` members.
3. `shared/i18n/loader.ts`: `export const currentCatalog = (): Catalog => en;` and
   `export const currentPrayerLabels = (): Record<PrayerId, string> => PRAYER_LABELS;` where
   `PRAYER_LABELS` is defined in `en.ts` beside the catalog (breaking the cycle: `en.ts`
   imports nothing from the i18n modules; `index.ts` re-exports it). This is the one module
   step 15's timing experiment may rewrite to `JSON.parse` of an embedded string.
4. `shared/i18n/index.ts`:
   - `export const t = (key: TranslationKey): string => currentCatalog()[key];` Stage-one
     signature carries no locale and no fallback: a missing key is a compile error, and the
     parity test refuses an empty value.
   - `export const prayerLabel = (id: PrayerId): string => currentPrayerLabels()[id];`
   - Placeholder interpolation is NOT built this step (the four interpolating strings join
     with their templates in the waves; the bridge's `{name}` parity test lands in step 07).
     The plural guard below is what stops anyone adding an interpolating plural meanwhile.
5. `shared/__tests__/i18n.test.ts`:
   - `it('pins the en catalog bytes to today's literals')` - for the frozen list of pairs
     (key, literal), `t(key)` equals the literal exactly; includes all 11 prayer labels and
     the Settings/help/whatsNew members.
   - `it('closes the prayer labels over exactly the eleven ids, injectively')` - `Object.keys`
     of `PRAYER_LABELS` sorted equals the 11 ids sorted; values are 11 distinct strings.
   - `it('holds no plural construct in any catalog value')` - every value of `en` matches
     neither `/\{count,|\{n,|<plural|other\}/` (ICU) nor ends with the i18next `_one`/`_other`
     suffixes on its key. Rides the same commit as the first catalog (R16 forced change 4).
   - `it('joins every catalog prayer label to the frozen vocabulary')` - each label equals the
     title-case member of `PRAYERS_ENGLISH`/`EXTRAS_ENGLISH` at the matching id's position.

## Red

Tests 1, 2 and 4 cannot be red against absent code; they land with the module. Write them
first, run, record `Cannot find module '@/shared/i18n'` as the failing line, then build the
modules. Test 3 (plural guard) proves itself in the break.

## Green

`npx jest shared/__tests__/i18n.test.ts shared/__tests__/prayerIdContract.test.ts --watchman=false --selectProjects=unit`
green (the contract test unchanged: nothing it pins moved). tsc, Biome clean.
`shared/__tests__/unusedExports.test.ts` green (everything exported is reachable: `t` and
`prayerLabel` are exercised by the suite; reachability comes from the waves - if the
unused-export gate fires on `t`, add the temporary exemption the gate's own mechanism
provides and remove it in step 08; record the exemption in LOG.md).

## Break script

1. In `en.ts` change `prayer.magrib: 'Magrib'` to `'Maghrib'`. Tests 1 and 4 fail. Restore.
2. In `index.ts` delete one member of `PRAYER_LABELS`. tsc fails (the Record is exhaustive) -
   that is the named failure for the break; record the compiler line. Restore.
3. Add `bad.key: '{count, plural, one {# min} other {# mins}}'` to `en`. Test 3 fails. Restore.
End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): the id vocabulary, the en catalog, t() and prayerLabel land with their gates`

Add by name: the four new files and `shared/constants.ts`.

## Review checklist

The catalog keys are flat and dotted; no nesting, no `as const` missing, no literal re-typed.
The id arrays' bytes equal the step-01 frozen vocabulary (order included). Shipped classes:
Residue (the loader indirection is used by t and prayerLabel, nothing dead).

## Done when

All four i18n tests green, contract test untouched and green, break `ALL AS EXPECTED: 1`, hook
lines as step 01, merged `--no-ff`.

## Restore

Delete the four new files; `git checkout -- shared/constants.ts`.
