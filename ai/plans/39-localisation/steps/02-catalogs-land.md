# Step 02: the five catalogs land

**Requirements:** R2.1, R2.2, R2.3
Weight: 2
**Anchors:** `en-catalog-head` (shared/i18n/en.ts), `bridge-import-mode` (shared/__tests__/i18nBridge.test.ts).

## Goal

Every `TranslationKey` exists in ar, ms, so, hi and th, gated mechanically, with a lock
file that fails when the English source moves under them. English rendering is unchanged
(the 40 new keys are additions, no value edits).

## Branch

`feat/39-02-catalogs` off `uat`.

## Files

- `shared/i18n/en.ts` (the 40 new keys), `shared/i18n/ar.ts`, `ms.ts`, `so.ts`, `hi.ts`, `th.ts` (new)
- `shared/i18n/index.ts` (the tokened-key coverage), `shared/i18n/sourced-names.json` (new, copied from the plan's research)
- `shared/i18n/catalog-lock.json` (new), `scripts/catalog-lock.mjs` (new)
- `shared/__tests__/catalogGates.test.ts` (new), `shared/__tests__/catalogLock.test.ts` (new)
- `shared/__tests__/i18nBridge.test.ts` (per-locale export and import modes, the pinned token list)
- `shared/__tests__/unusedExports.test.ts` (the `REACHED_WITHOUT_AN_IMPORT` additions)
- `package.json` (the `i18n:lock` script)

## Red tests

1. `shared/__tests__/catalogGates.test.ts` - imports all six catalogs and fails first on the missing locale modules (`Cannot find module './ar'`).
2. `shared/__tests__/catalogLock.test.ts` - fails on the absent `catalog-lock.json`.
3. The bridge import mode with `I18N_LOCALE=ar` fails: `I18N_BRIDGE=import I18N_LOCALE=ar npx jest shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit` fails on the missing ar catalog.

Record each first failing line.

## Change contracts

1. `shared/i18n/en.ts` gains exactly the 40 keys of `catalogs/en-full.json` that are absent from today's file: `calendar.monthShort.1..12`, `calendar.weekdayShort.1..7`, `calendar.hijri.1..12`, `qibla.cardinal.n|e|s|w`, `settings.language`, `language.applying`, `channel.reminder`, `whatsNew.title.language`, `whatsNew.body.language` - values byte-identical to `catalogs/en-full.json`. No existing value changes.
2. Each new `shared/i18n/<loc>.ts`:
   - Header docblock: one line on why the file is flat (Hermes compiles large nested literals slowly, hermes#1046) and that the values came from the planning draft verbatim.
   - `import type { PrayerId } from '@/shared/constants';` and `import type { Catalog } from './en';`
   - `export const <loc> = { ... } as const satisfies Catalog;` - the object holds every `TranslationKey`, values byte-identical to `catalogs/<loc>.json` (import order = en.ts's order; run the values through the JSON file with a throwaway node one-liner, never retype them by hand).
   - `export const PRAYER_LABELS: Record<PrayerId, string> = { ... }` built from the file's own `prayer.*` members exactly as `en.ts` builds its own.
3. `shared/__tests__/i18nBridge.test.ts`: the export mode honors `I18N_LOCALE` (with a locale set it writes `shared/i18n/dist/<loc>.json` from the landed `<loc>` catalog; unset stays `dist/en.json`); the import mode with `I18N_BRIDGE=import I18N_LOCALE=<loc>` reads `shared/i18n/dist/<loc>.json` and asserts deep equality against the landed `<loc>` catalog. The bridge's pinned tokened-key list gains `channel.reminder: [name, n]`.
4. `shared/i18n/index.ts`: the `ParamsOf` placeholder inference covers the new tokened key automatically through its existing literal scan; if the scan's key list is pinned anywhere else, that pin gains `channel.reminder`. `t('channel.reminder', { name, n })` typechecks and throws on a missing parameter.
5. `shared/__tests__/unusedExports.test.ts`: the five locale exports are production-unreachable until step 03's loader map imports them, and property-position `require` calls do not resolve as imports, so all five (`ar`, `ms`, `so`, `hi`, `th` from `shared/i18n/*.ts`) join the suite's `REACHED_WITHOUT_AN_IMPORT` list in this step with a one-line reason each.
6. `shared/__tests__/catalogGates.test.ts` re-implements, in-process over the six imported catalogs, the gate rules of `scripts/gate-catalogs.mjs` in the plan folder (same list): key parity with en; placeholder token sets equal; `error.heading|body|hint|refresh` keep leading/trailing spaces; paragraph-break keys keep `\n\n`; `widget.refresh` and `widget.refreshLead` keep the `Athan` brand bytes and no other key adds stray brand bytes; prayer names equal the sourced values of the plan's `research/prayer-names.json` where that file is non-null (copied to `shared/i18n/sourced-names.json` in this step, committed, and read by the suite); no value exceeds 3x the English length beyond 90 chars; no value echoes its English source (exempt: `day.location`, `calendar.*`, the historical whatsNew stand-ins, and the prayer names themselves, which legitimately repeat); ar holds no Latin runs outside tokens and the brand; prayer names are at most 24 plain characters. The plan-folder provenance check (drafted fills recorded) has no in-repo twin by design: the provenance file is a planning artefact that dies with the folder, and the shipped suite pins the values against `sourced-names.json` instead.
7. `scripts/catalog-lock.mjs` writes `shared/i18n/catalog-lock.json`: `{ "<loc>": "<sha256 of the JSON.stringify of the en catalog>" }` for the five locales. `package.json` gains `"i18n:lock": "node scripts/catalog-lock.mjs"`. `shared/__tests__/catalogLock.test.ts` recomputes the en hash and fails with the message `catalog lock stale for <loc>: the English source changed; re-translate or run yarn i18n:lock` on mismatch.

## Green run

All new suites pass; `yarn validate` passes (the string guard stays green: the new files are data modules with no JSX); `npx tsc --noEmit` clean.

## Break script

Copy `shared/i18n/ar.ts` to `$TMPDIR`; `sed -i '' "s/{name} الآن/{name}/" shared/i18n/ar.ts` (drops a placeholder); run `npx jest shared/__tests__/catalogGates.test.ts --watchman=false --selectProjects=unit`, expect the placeholder-parity failure naming `notification.now`; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Version per the lock. Message: `<VERSION> - feat(language): five catalogs land at 197 keys with gates and lock file`. Add by name the files above plus the plan files this run changed.

## Review checklist

- Every locale value equals its `catalogs/<loc>.json` byte for byte (spot-check ten values per locale against the JSON).
- en gained keys only; `git diff shared/i18n/en.ts` shows additions, no value edits.
- The lock hash is of the CURRENT en (the one this step landed).

## Merge

`git checkout uat && git merge --no-ff feat/39-02-catalogs -m "Merge feat/39-02-catalogs into uat: job 39 step 02"`.

## Done when

Checklist ticked in `LOG.md`; row reads `IN PROGRESS, step 2`.
