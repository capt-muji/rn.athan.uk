# Step 12: `migrateToLocaleDefaults`, the version-guarded stamp

The 2.0.0 upgrade migration: stamp `preference_language` to `'en'` for upgrading installs
ONLY (the captured `storedVersion`, read before `setStoredVersion` overwrote it, non-null and
below `2.0.0`), and delete the dead `preference_show_arabic_names` key. No schema bump, no
wipe, no keep-list change (D35). The forced reschedule stays as-is: `en` bytes are identical,
so the re-arm is a no-op replace.

Requirements: R6.1, R6.2
Weight: 2

- Branch: `feat/38-12-upgrade`
- Anchors: `version-captured`, `version-cacheclear`, `version-stamp`, `version-migrate-call`,
  `version-keeplist`, `version-keeplist-prefs`, `migration-core`
  (post-step-06: the migration loop walks ids and the retitled legacy arrays)
- Files: `stores/version.ts`, and the new suites `stores/__tests__/upgrade2_0_0.test.ts`,
  `stores/__tests__/upgrade2_0_0CrashWindows.test.ts`; extended:
  `stores/__tests__/version.test.ts` (the stamp call joins its existing migration-order pins)

## Contracts

1. In `stores/version.ts`, after `migrateIndexKeyedAlertPreferences(storedVersion)` (which
   stays LAST among the existing migrations), add `migrateToLocaleDefaults(storedVersion)`:
   - `if (storedVersion !== null && compareVersions(storedVersion, '2.0.0') < 0 &&
     Database.getItem('preference_language') === null)
     Database.setItem('preference_language', 'en');` - a raw write is correct in stage one:
     no atom over the key exists, so R18's atom-snapshot argument does not apply; row 39 moves
     resolution to module evaluation when the atom lands (RECONCILIATION, UPG-2/UPG-3).
   - `Database.removeItem('preference_show_arabic_names');` - idempotent by nature.
   - Logs one line on stamp: `logger.info('VERSION: Stamped upgrade language to en')` and one
     on the removal only when the key existed:
     `logger.info('VERSION: Removed the dead arabic-names toggle key')`.
2. `CACHE_SCHEMA_VERSION` stays 1. `UPGRADE_KEEP_PREFIXES` unchanged (D35).

## Red (the new suites)

1. `upgrade2_0_0.test.ts`: `it('stamps en for an upgrading 1.29.x install and not for a fresh install')` -
   two populations: (a) stored version `'1.29.305'` pre-set, run `handleAppUpgrade`, assert
   `preference_language === 'en'`; (b) no stored version (fresh), run it, assert the key is
   ABSENT. Fails today (no migration exists; (a) fails on absence).
2. Same suite: `it('keeps days, records and preferences through the upgrade with no schema bump')` -
   seed days, bookkeeping records and preferences; run; assert every family intact and
   `cache_schema_version === '1'`. Fails today only through the missing assertions' setup -
   it lands with the suite and guards the no-bump law.
3. Same suite: `it('carries a pre-marker population through the existing wipe')` - no
   `cache_schema_version`, stored version `'1.5.1'`; run; assert the wipe ran (days gone),
   `preference_*` survived, the stamp ran, and no orphan sweep path threw (UPG-1's fixture).
4. `upgrade2_0_0CrashWindows.test.ts`: one test per R18 crash-table row as corrected - the
   row-4 rewrite is the load-bearing one: `it('converges when death lands between the version
   write and the stamp')` - seed the mid-state (version key already `2.0.0`-era, no
   `preference_language`, stored-version memory of `1.x` lost), re-run the launch path, assert
   convergence to the same end state as an uninterrupted upgrade. Stage-one convergence is:
   the dead key gone; the stamp is version-guarded and never re-runs off the overwritten key,
   which the test proves by asserting the stamp's idempotence guard reads the CAPTURED value,
   not the stored key.
5. `version.test.ts`: the migration-order pin gains `migrateToLocaleDefaults` after the
   index-keyed migration (the R18 synthesis order ruling).

## Break script

1. Guard the stamp on key absence alone (the BLOCKER's original shape). Named test 1's fresh
   branch fails (fresh install stamped). Restore.
2. Swap the migration order (locale defaults before index-keyed). The version-test order pin
   fails. Restore.
3. Delete the `removeItem` call. The dead-key assertion in test 2 fails. Restore.
4. Bump `CACHE_SCHEMA_VERSION` to 2. Named test 2 fails (days gone). Restore.
End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): migrateToLocaleDefaults with the version-guarded stamp and the dead-key removal`

## Review checklist

The stamp's guard reads `storedVersion`, the value captured at `version-captured`, never the
overwritten key. No keep prefix touched. Shipped classes: Rule (a fresh install must never be
pinned; the test proves it), Residue (no legacy key survives the migration).

## Done when

Both suites green, version pins green, break `ALL AS EXPECTED: 1`, hook lines as step 01,
merged `--no-ff`.

## Restore

`git checkout -- stores/version.ts stores/__tests__/version.test.ts`; delete the two new suites.
