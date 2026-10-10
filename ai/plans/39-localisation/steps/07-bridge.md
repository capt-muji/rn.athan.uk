# Step 07: the bridge and interpolation

`t()` gains typed `{name}`-style interpolation, and the flat-JSON bridge lands with its
round-trip parity test. The transfer format is the catalog itself: flat key-value JSON,
`{token}` placeholders, no i18next reserved shapes (RECONCILIATION, ARCH-14/A3).

- Branch: `feat/38-07-bridge`
- Anchors: `content-builders`, `reminder-content` (both files hold the post-step-04 text;
  step 06 first retypes them to `(id: PrayerId, ...)` with `prayerLabel` titles - edit
  against that shape)
- Files added: `scripts/i18n-export.mjs`, `scripts/i18n-import.mjs`,
  `shared/__tests__/i18nBridge.test.ts`
- Files changed: `shared/i18n/index.ts` (interpolation),
  `shared/i18n/en.ts` (the two notification templates join as
  `notification.now: '{name} now'` and `notification.reminder: '{name} in {n}m'`),
  `shared/notifications.ts` (the two builders consume the templates via `t`),
  `package.json` (two script entries: `i18n:export`, `i18n:import`)

## Contracts

1. `t` becomes `t(key: TranslationKey, params?: Record<string, string | number>): string` -
   every `{token}` in the value is replaced by `String(params[token])`; a token with no
   parameter throws `Error(\`i18n: missing parameter '${token}' for key '${key}'\`)`. Parameter
   keys are typed per key: `export type ParamsOf<K extends TranslationKey> = ...` mapping keys
   holding `{name}` to `{ name: string | number }` and `{n}` to `{ n: number }` (A6; the
   mapping is a four-line conditional type over `TranslationKey`).
2. The bridge is one mechanism: `shared/__tests__/i18nBridge.test.ts` doubles as the script
   runner. When `process.env.I18N_BRIDGE === 'export'`, the suite writes
   `shared/i18n/dist/en.json` from the imported `en` and exits 0; when
   `process.env.I18N_BRIDGE === 'import'`, it reads `shared/i18n/dist/<locale>.json` and
   asserts round-trip identity against the imported catalog. Run bare (no flag) it asserts
   only the parity invariants, so CI covers the bridge on every commit with zero new
   dependencies. `shared/i18n/dist/` is gitignored.
3. `i18nBridge.test.ts` parity assertions: `en` exported to JSON re-imports to a
   deep-equal object; values are flat strings; keys match `TranslationKey` exactly; every
   `{token}` in a value is covered by the key's typed params.
4. `shared/notifications.ts`: `genNotificationContent` builds
   `title: t('notification.now', { name: prayerLabel(id) })` and the reminder twin
   `t('notification.reminder', { name: prayerLabel(id), n: intervalMinutes })` - byte-identical
   output to today (the templates reproduce the exact current strings).
5. `package.json`: `"i18n:export": "I18N_BRIDGE=export npx jest shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit"`,
   `"i18n:import": "I18N_BRIDGE=import npx jest shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit"`.

## Red

1. `i18nBridge.test.ts`: `it('replaces {name} and {n} and throws on a missing parameter')` -
   fails before the interpolation lands (`t` takes no second argument; record the tsc line).
2. `shared/__tests__/notifications.test.ts`: the title pins (`'Fajr now'`, `'Fajr in 15m'`)
   keep passing after the change - they are the byte-parity proof. Add
   `it('builds the titles from the catalog templates')` asserting the same bytes through
   `genNotificationContent` with the new signature. Fails before (signature).

## Break script

1. Change `notification.now` to `'{name} NOW'`. The notifications title pin fails. Restore.
2. In the interpolation, drop the missing-parameter throw (return the template with the token
   intact). The bridge test's throw assertion fails. Restore.
3. Nest one value (`en['settings.title'] = { nested: 'x' }` as any). The parity test's
   flat-string assertion fails. Restore. End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): {name} interpolation, flat-JSON bridge with round-trip parity, titles from the catalog`

## Review checklist

No i18next shape anywhere (`{{`, `_one`, `_other`, `$t(`). The templates reproduce today's
title bytes exactly (the notifications suite's existing pins prove it - name them). Shipped
classes: Residue (no `dist/` artefact committed; the export writes gitignored paths).

## Done when

Bridge tests green, notifications title pins unchanged and green, break
`ALL AS EXPECTED: 1`, hook lines as step 01, merged `--no-ff`.

## Restore

`git checkout -- shared/i18n/index.ts shared/i18n/en.ts shared/notifications.ts package.json`;
delete the two added scripts and the test file if uncommitted.
