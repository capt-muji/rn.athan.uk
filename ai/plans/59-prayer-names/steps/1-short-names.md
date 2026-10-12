# Step 1: The four strings, the glossary supersession, the pins

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R2.1, R2.2
Weight: 2

## Anchor check

`ms-lastthird`, `hi-midnight`, `th-lastthird`, `so-midnight`. A count other
than 1 is a STOP.

## Goal

The four D81 and D83 strings land in the catalogs, the glossary and the dist
round-trip files; every other name
stays byte-identical, and one new test pins all four.

## Branch

`git checkout -b feat/59-short-names uat`

## Files

- `shared/i18n/ms.ts` (change)
- `shared/i18n/hi.ts` (change)
- `shared/i18n/th.ts` (change)
- `shared/i18n/so.ts` (change)
- `shared/i18n/sourced-names.json` (change)
- `shared/i18n/dist/ar.json` (regenerate)
- `shared/i18n/dist/en.json` (regenerate)
- `shared/i18n/dist/ms.json` (regenerate)
- `shared/i18n/dist/hi.json` (regenerate)
- `shared/i18n/dist/th.json` (regenerate)
- `shared/i18n/dist/so.json` (regenerate)
- `shared/__tests__/catalogGates.test.ts` (change)
- `shared/__tests__/i18nRuntime.test.ts` (change: the `prayerLabel('last third')`
  expectation under th at line 23 becomes `ช่วงสุดท้าย`)
- `components/ui/__tests__/InitialWidthMeasurement.test.tsx` (change: the
  `getByText('ช่วงสุดท้ายของคืน')` argument at line 40 becomes `ช่วงสุดท้าย`)

## Red tests

In `shared/__tests__/catalogGates.test.ts`, inside
`describe('the landed catalogs against the R2 gates')`, add:

```ts
  it('carries the owner-ruled re-shortened names (D81 and D83, 2026-10-12)', () => {
    expect(CATALOGS.ms['prayer.last third']).toBe('Sepertiga malam');
    expect(CATALOGS.hi['prayer.midnight']).toBe('आधी रात');
    expect(CATALOGS.th['prayer.last third']).toBe('ช่วงสุดท้าย');
    expect(CATALOGS.so['prayer.midnight']).toBe('Saqda dhexe');
  });
```

Run:

```
npx jest shared/__tests__/catalogGates.test.ts --watchman=false --selectProjects=unit
```

Expected: the new case fails on its first assertion (`Expected: "Sepertiga
malam"`, `Received: "Sepertiga akhir malam"`); the hi and th assertions sit
behind the failed first one and go green with the change contracts. Every other
case passes (the glossary still matches the old catalogs). Any other failure is
a STOP.

## Change contracts

1. In `shared/i18n/ms.ts`, `hi.ts`, `th.ts` and `so.ts`, replace exactly these
   values (each counts 1 at `Planned at`; count with `grep -F` first):

| File | Old | New |
| --- | --- | --- |
| `ms.ts` | `'prayer.last third': 'Sepertiga akhir malam',` | `'prayer.last third': 'Sepertiga malam',` |
| `hi.ts` | `'prayer.midnight': 'इस्लामी आधी रात',` | `'prayer.midnight': 'आधी रात',` |
| `th.ts` | `'prayer.last third': 'ช่วงสุดท้ายของคืน',` | `'prayer.last third': 'ช่วงสุดท้าย',` |
| `so.ts` | `'prayer.midnight': 'Habeennimo dhexe',` | `'prayer.midnight': 'Saqda dhexe',` |

2. In `shared/i18n/sourced-names.json`, set the `ms` `names` `Last Third`
   `text` to `Sepertiga malam` and the `hi` `names` `Midnight`
   `text` to `आधी रात`, byte-identical to the catalog values. Set the `so`
   `names` `Midnight` entry to
   `"text": "Saqda dhexe", "source": "opentran-so-dictionary", "confidence": "medium"`
   with the note `The dictionary's primary midnight pair; carried in Somali religious prose and news; no Islamic-time table attestation found.`,
   and add the slug to `_meta.sourceSlugs`:
   `"opentran-so-dictionary": "opentran.net English-Somali dictionary pair pages (en-so)"`.
   The th entries stay `null`.

3. Regenerate every dist round-trip file from the landed catalogs, never by
   hand. The dist files are stale at `Planned at` beyond the prayer lines:
   row 63's D76 reminder copy (`notification.reminder` and `channel.reminder`,
   the unit letter dropped) reached the six catalogs but no dist file. After
   the catalog edits above, run for each locale in
   `ar en ms hi th so`:

   ```
   I18N_BRIDGE=export I18N_LOCALE=<loc> npx jest shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit
   ```

   Each exits 0 and rewrites `shared/i18n/dist/<loc>.json` from the landed
   catalog. Predicted diff: `git diff <PLANNED_AT_SHA> -- shared/i18n/dist/`
   touches exactly the six files; ms, hi, th and so each change one
   `prayer.*` line; all six change the two reminder keys. Any other line
   moving is a STOP.

What the contract must never do: touch any other `prayer.*` value, `en.ts`,
`catalog-lock.json`, or any dist file by hand (regeneration only).

## Green run

```
npx jest shared/__tests__/catalogGates.test.ts shared/__tests__/i18n.test.ts shared/__tests__/catalogLock.test.ts shared/__tests__/i18nRuntime.test.ts --watchman=false --selectProjects=unit
npx jest components/ui/__tests__/InitialWidthMeasurement.test.tsx --watchman=false
I18N_BRIDGE=import I18N_LOCALE=ar npx jest shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit
I18N_BRIDGE=import I18N_LOCALE=en npx jest shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit
I18N_BRIDGE=import I18N_LOCALE=ms npx jest shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit
I18N_BRIDGE=import I18N_LOCALE=hi npx jest shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit
I18N_BRIDGE=import I18N_LOCALE=th npx jest shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit
I18N_BRIDGE=import I18N_LOCALE=so npx jest shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit
npx tsc --noEmit
npx biome check . --error-on-warnings
```

All pass; all ten commands exit 0. The lock suite passing unchanged proves en's
catalog values were not touched, and each import run prints its round-trip
case green (`re-imports the exported <loc> file to the same catalog`),
proving every dist file matches its landed catalog, the two stale reminder
keys included (R2.2).

## Break script

`bash scripts/break-step1.sh` from the plan folder, copied to `$TMPDIR`: it
restores the old ms value, runs the gate suite, expects the D81 case to fail
with `Expected: "Sepertiga malam"` and `Received: "Sepertiga akhir malam"`,
restores the file, ends `ALL AS EXPECTED: 1`.

## Version and commit

Version command: the next patch after `uat`'s `package.json`
(`mkdir $HOME/athan-gitree/version.lock`, retry in a short sleep loop while it
exists, `rmdir` it after the merge). Set in `app.json` and `package.json`, and
in the gitignored `android/app/build.gradle` (`versionName`) when a prebuild
is present; the gradle file is never added. Add the fourteen files and
`app.json`/`package.json` by name plus `ai/plans/README.md` (`IN PROGRESS,
step 1`) and the plan's `PLAN.md` and `LOG.md`. Message:

```
<VERSION> - feat(i18n): four prayer names shortened per the header rule

ms Last Third reads Sepertiga malam (the owner's example), hi Midnight drops
the adjective, th Last Third drops the particle phrase, so Midnight reads
Saqda dhexe (the owner's flag, planner-sourced); the glossary's two sourced
entries superseded by ruling and so's first sourced Midnight entry added;
every other name byte-identical. R1.1-R2.2.
```

## Review checklist

- Exactly four catalog values, two glossary texts and one new glossary entry
  changed:
  `git diff <PLANNED_AT_SHA> -- shared/i18n/ms.ts shared/i18n/hi.ts shared/i18n/th.ts shared/i18n/so.ts | grep -c '^-.*prayer\.'`
  prints exactly 4.
- The dist diff matches the predicted shape: six files touched;
  `git diff <PLANNED_AT_SHA> -- shared/i18n/dist/ | grep -c '^-  "'`
  prints exactly 16 (four prayer lines plus the six files' two reminder keys
  each).
- The D81/D83 test pins all four, th and so included.
- `catalog-lock.json` untouched.

## Merge

`git checkout uat && git merge --no-ff feat/59-short-names -m "<VERSION> -
merge feat/59-short-names: step 1, the four short names"`. A conflict aborts
and STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the heading, shas, hook lines, break
line and `session:` line.
