# Verification 03: 2.0.0 upgrade path (no wipe, no schema bump)

Independent adversarial verification of the upgrade design: 2.0.0 does NO `clearUpgradeCache` wipe and
NO `CACHE_SCHEMA_VERSION` bump, only three key-state-guarded migrations (width seed, language stamp,
dead toggle-key delete), because no stored family changes shape. Stored families checked directly.
Branch `verify/39-localisation-deepseek-20261009` at `52109ec0`. No file was modified.

## Findings

### F1. The day-record shape is name-free and unchanged. CONFIRMED.
`shared/types.ts:108-122` is `date` plus nine lowercase time fields, all `string | null`. The only
writer emits exactly those ten keys (`shared/prayer.ts:70-95`, stored at `stores/database.ts:136-145`).
Reads are `JSON.parse` with no validation (`stores/database.ts:42-48,152-160`). The row-shape change
(`english` to `id`, `arabic` removed) touches in-memory rows only, which are rebuilt from storage every
launch (`shared/prayer.ts:376-420`). The stored lookup key is derived from the in-memory id
(`shared/prayer.ts:407`), not from a stored name.

### F2. Bookkeeping records tolerate the `arabicName` change. CONFIRMED.
`shared/notifications.ts:17-24` holds `id, date, time, englishName, arabicName, alertType`. Writers:
`device/notifications.ts:130,248` and `stores/notifications.ts:877,1071`. Keys are schedule + canonical
index + OS id (`stores/database.ts:193,258`). No production site reads a parsed record's
`englishName` or `arabicName`: `canStillFire` reads `record.date` (`stores/notifications.ts:124-133`),
the cancel and sweep paths read `record.id` (`:935,977-987,1500-1533`). Dropping `arabicName` on write
and ignoring it on read cannot change any parsed read.

### F3. The wipe whitelists keep the prefixes the design relies on. CONFIRMED.
`stores/version.ts:144-156` keeps `preference_` (`:151`) and `prayer_max_english_width_` (`:155`).
`stores/sync.ts:357-371` keeps the same two (`:363,365`). `preference_show_arabic_names`
(`stores/ui.ts:132`) matches `preference_` and therefore survives a wipe, which is exactly why R18
rejects the wipe: it would keep the one dead key the release exists to delete.

### F4. The bump law and marker are as the record states. CONFIRMED.
`CACHE_SCHEMA_VERSION = 1` (`stores/version.ts:135`). The law is verbatim at `:122-125`: bump only
when a release changes the shape of cached data so that data written by the previous version can no
longer be read correctly. `cacheSchemaChanged` (`:166-180`) compares the stored marker, so a
marker-stable upgrade returns false and `handleAppUpgrade` skips the wipe (`:258-266`).

### F5. The insertion points are free and no second migration exists. CONFIRMED.
`handleAppUpgrade` (`stores/version.ts:230-292`) calls `forceNotificationReschedule` (`:194-201`) and
`migrateIndexKeyedAlertPreferences` at `:289`. A repository-wide search finds no other migration.
The R18 proposal to insert `migrateToLocaleDefaults` after `:289` is free.

### F6. No stored family is torn by the rename. CONFIRMED.
Only two MMKV instances exist (`stores/database.ts:32-35`, `shared/perf.ts:37`), no AsyncStorage. The
persisted app keys are `prayer_*`, `scheduled_*`, `preference_*`, `prayer_max_english_width_*`,
`fetched_years`, `app_installed_version`, `whats_new_shown_version`, `cache_schema_version`,
`popup_update_last_check` (`stores/ui.ts:88`). None stores a prayer name as a readable value except the
bookkeeping records, whose names nothing reads.

### F7. The width key rename is not a bump trigger. CONFIRMED.
The legacy keys are orphaned, not misread. New code reads the new keys and, if the seed is skipped, the
atom sits at 0 and re-measures (`stores/ui.ts:104-107,216-231`). No stale-shaped read yields a wrong
value, so the bump law's condition is absent.

### F8. The nullable language atom invalidates the key-absence guard. CONTRADICTED.
`preference_language` is absent on a fresh install too, and `handleAppUpgrade` runs on fresh installs:
`wasAppUpgraded` returns true when no stored version (`stores/version.ts:82-90`), and the migrations run
unconditionally (`:279,289`). R18's `migrateToLocaleDefaults` (`R18-UPGRADE-PATH.md:77-82`) is guarded
by `preference_language` absence, so it would stamp `'en'` for every new 2.0.0 user. The pivot makes the
atom nullable, null meaning follow the device (`SINGLE-LANGUAGE-PIVOT.md:236-239`), and Q5 rules that
first run matches the device locale (`:303`). A key-absence guard pins new users to English and defeats
device-following.

The same root cause has a second effect on upgrading installs: bootstrap hydrates and content paints
before `handleAppUpgrade` runs inside `sync()` (`stores/bootstrap.ts:39-78`, `app/index.tsx:59-62,102-118`).
The language atom is read on that first paint, so a non-English-device existing install renders in the
device locale, then snaps to `'en'` when the stamp lands. R18's ordering proof
(`R18-UPGRADE-PATH.md:103-107`) assumes "absent key defaults to `en`", which the nullable pivot
invalidates.

### F9. The no-wipe, no-bump core survives every attack. CONFIRMED.
No persisted family changes shape. The width keys are a data carry, not a compatibility requirement.
No guard depends on a bumped marker except `cacheSchemaChanged`, which correctly reads "no change". The
only genuine defect is the language stamp guard (F8), which is orthogonal to the wipe and bump verdict.

## Break attempts

- Any persisted name read functionally: none. Bookkeeping names are write-only. Widget `name` props
  persist in the native store, governed by `WIDGET_PROPS_VERSION`, not the cache schema.
- Width-key rename as a shape change: not a trigger, the old key is orphaned and the new key
  self-heals by re-measuring.
- Day lookup depends on a stored name: false, the key is derived from the in-memory id.
- A guard relying on a bumped marker: only `cacheSchemaChanged`, which reads "unchanged" correctly.
- Missed families or snapshot keys: `atomWithStorage` maps directly to the MMKV key
  (`stores/storage.ts:54-119`). No side-channel snapshot key.
- Language stamp against the nullable atom: the one real break, F8.

## Better alternative and real cost

Keep no wipe and no bump. Move the language stamp out of the key-absence guard. Two options. Cheapest:
pass the already-captured `storedVersion` (`stores/version.ts:242,289`) into `migrateToLocaleDefaults`
and stamp only when it is non-null, which excludes fresh installs and converges the crash window
because a death after `setStoredVersion` leaves a non-null version. Stronger: move the stamp to
module-eval time beside the width seed (`stores/ui.ts`) so it lands before the first paint, guarded by
`app_installed_version` being present. Cost: one guard change plus a crash-window test for the
fresh-install case, and for the stronger option the language atom must be defined after the seed with
one permitted raw read/write.
