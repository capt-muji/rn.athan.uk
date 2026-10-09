# Verification: the 2.0.0 upgrade path

| Field | Value |
| --- | --- |
| Base | `uat` `52109ec0` (1.29.303) |
| Date | 2026-10-09 |
| Claim under test | Version 2.0.0 runs no cache wipe and no schema-version bump. Three key-state-guarded migrations cover it because no stored family changes shape, and every crash window converges through key-absence guards. |
| Result | 10 confirmed, 6 contradicted, 3 uncertain |

## Method

Read in full: `ai/AGENTS.md`, `SINGLE-LANGUAGE-PIVOT.md`, `OWNER-DECISIONS.md`, `PLAN.md`,
`research/R18-UPGRADE-PATH.md`, `research/R8-FIRST-RUN-LOCALE.md`, `research/R13-BLAST-RADIUS.md`,
`research/R15-IDENTIFIER-DESIGN.md`. Code read in full: `stores/version.ts`, `stores/sync.ts`,
`stores/database.ts`, `stores/storage.ts`, `stores/notifications.ts`, `stores/ui.ts`,
`stores/bootstrap.ts`, `stores/widget.ts`, `shared/types.ts`, `shared/notifications.ts`,
`shared/widgetTypes.ts`, `shared/widgetTimeline.ts`, `device/notifications.ts`,
`device/listeners.ts`, `device/tasks.ts`, `hooks/useNotification.ts`, `app/index.tsx`,
`app/_layout.tsx`, `widgets/PrayerWidget.tsx`, `components/ui/InitialWidthMeasurement.tsx`,
`node_modules/expo-widgets/build/Widgets.js`, and the native
`modules/widgetrefresh/.../WidgetRefreshScheduler.kt`. Partial reads are listed under "Not
verified".

Git history, read-only: `git tag` (empty), `git log -S` for the first appearance of each storage
key, `git show <commit>:<file>` for the tree at 1.5.1 (`07e79f00`).

External source: the iTunes Lookup endpoint the app itself calls (`ITUNES_LOOKUP_URL`,
`device/updates.ts:15`), fetched with `curl` on 2026-10-09 into the scratch folder and parsed
whole. No test was run. No device was used.

### Persistence surfaces found

| Surface | Families | Writer and reader |
| --- | --- | --- |
| MMKV `athan-storage` (`stores/database.ts:32-35`) | `prayer_YYYY-MM-DD` | `database.ts:136-145`, `:152-160` |
| | `fetched_years` | `database.ts:176-180`, `sync.ts:54, 68, 294, 394` |
| | `scheduled_notifications_<type>_<index>_<id>` | `database.ts:188-198`, `:211-241` |
| | `scheduled_reminders_<type>_<index>_<id>` | `database.ts:253-304` |
| | `preference_alert_*`, `preference_reminder_alert_*`, `preference_reminder_interval_*`, `preference_notification_repair_*` | `stores/notifications.ts:207, 257-260, 277-280, 333-337` |
| | `preference_sound`, `preference_last_notification_schedule_check` | `stores/notifications.ts:604, 610` |
| | seven `preference_*` UI keys, `popup_update_last_check`, two width keys | `stores/ui.ts:88, 104, 107, 117-135` |
| | `app_installed_version`, `whats_new_shown_version`, `cache_schema_version` | `stores/version.ts:31, 44, 116, 137` |
| | legacy index keys | `stores/notifications.ts:493`, migrated at `:525-598` |
| MMKV `perf-monitor` | perf marks, monitor builds only | `shared/perf.ts:37, 195` |
| OS notification store | armed requests, content frozen at schedule time, no `data` payload | `device/notifications.ts:116-128, 234-246` |
| Android channels | `athan_<n>_v4`, `extras_at_time_v3`, `reminder_<slug>_<interval>_v3` | `shared/notifications.ts:380-403` |
| iOS app group | widget layouts and timeline entries | `app.json:380`, `stores/widget.ts:198-217` |
| Android `SharedPreferences` `expo.modules.widgets` | `__expo_widgets_<kind>_props` snapshot JSON | `WidgetRefreshScheduler.kt:47, 105-115` |
| Task and alarm registrations | background task, widget tick, watchdog | `stores/notifications.ts:1915-1960`, `WidgetRefreshScheduler.kt:173-208` |

No `AsyncStorage`, `SecureStore` or file storage exists in production code (`git grep`).

## Findings

### UPG-1. CONTRADICTED (MAJOR): the published store build gets a cache wipe at its first launch of 2.0.0

- **Record says:** 2.0.0 runs no wipe (`R18` section (a), pivot Q19, `PLAN.md` section 1).
  `PLAN.md` section 7 proves the upgrade by installing over a populated 1.29.x install.
- **Evidence:**
  - `stores/version.ts:170-173`: a missing `cache_schema_version` returns `true` from
    `cacheSchemaChanged()`. `stores/version.ts:258-260`: `upgraded && cacheSchemaChanged()` calls
    `clearUpgradeCache()`.
  - The marker first exists in commit `5da7be0a`, version 1.24.33, 2026-09-12
    (`git log -S"cache_schema_version" -- stores/version.ts`).
  - The iTunes Lookup answer on 2026-10-09 carries `"resultCount": 1`, `"version": "1.5.1"`,
    `"currentVersionReleaseDate": "2026-02-16T00:52:02Z"`.
  - `README.md:25, 29`: the exact-alarm fix "ships with the next store release". That fix landed
    at 1.27.223 (`ccd9ac5e`). `main` sat at 1.17.4 until the 1.29.291 release commit of
    2026-10-09 (`git log main`). The repository holds no tag.
  - The 1.5.1 tree (`07e79f00`) writes `app_installed_version` and has no schema marker, no
    `whats_new_shown_version`, index-keyed alert preferences
    (`preference_alert_${type}_${prayerIndex}`), no notification identifier (the OS assigns one)
    and day records with two extra stored fields, `midnight` and `'last third'`.
- **Attack tried:** walked the startup chain from 1.5.1 state. `bootstrap.ts:65` refuses to
  hydrate. `handleAppUpgrade` wipes every `prayer_*` day, `fetched_years` and every
  `scheduled_*` record (`version.ts:144-156` keeps neither). `sync.ts:531` sends an offline
  launch to the error screen. `stores/notifications.ts:1604-1610` bails the reschedule until the
  refetch lands, and `app/index.tsx:141-145` retries. `migrateIndexKeyedAlertPreferences('1.5.1')`
  moves the index keys (`stores/notifications.ts:525-598`). The first full pass arms
  deterministic identifiers beside the old OS-assigned ones, and the sweep cancels the old ones
  once records exist (`:1528-1533`). The chain converges. The three R18 migrations survive it:
  both keep-lists hold `preference_` and `prayer_max_english_width_`.
- **Consequence:** the design survives, the claim does not. Every cost R18 lists against the
  wipe is paid by any user who reaches 2.0.0 from a build older than 1.24.33, through existing
  code. The plan must (1) name both populations, marker-carrying installs and pre-marker store
  installs, (2) give `upgrade2_0_0.test.ts` and the crash-window suite a pre-marker fixture built
  from 1.5.1 state, since "keeps `prayer_` days" is false there, and (3) add a device proof over
  a store-version install, not only over 1.29.x. If a 1.29.x store release ships first, users who
  skip it still arrive this way.

### UPG-2. CONTRADICTED (BLOCKER): the `en` stamp's key-absence guard pins every fresh install to English

- **Record says:** `migrateToLocaleDefaults()` writes `'en'` when `preference_language` is absent,
  guarded by key state and explicitly not by version (`R18` step 5, crash row 4: "a version gate
  would skip this"). The atom is nullable and null follows the device locale (ruling D33, pivot
  synthesis finding 8). Fresh installs follow the device locale (ruling Q5, `R8` item 3).
- **Evidence:** on a fresh install the key is absent by design, and it stays absent until an
  explicit choice. `handleAppUpgrade` runs on every launch (`stores/sync.ts:523`) and the
  migration slot sits at its end (`stores/version.ts:289`). A guard that reads only key absence
  cannot tell these states apart:

  | State at launch | `app_installed_version` | `preference_language` | Wanted | R18 guard does |
  | --- | --- | --- | --- | --- |
  | Fresh install, first launch | absent | absent | follow device | stamps `en` |
  | Fresh install, any later launch | `2.0.0` | absent | follow device | stamps `en` |
  | Upgrade from 1.x | `1.x` | absent | stamp `en` | stamps `en` |
  | Upgrade, killed after `setStoredVersion` (`version.ts:269`) and before the stamp | `2.0.0` | absent | stamp `en` | stamps `en` |
  | "Clear data" | absent | absent | follow device | stamps `en` |
  | OS restore of a 1.x backup | `1.x` | absent | stamp `en` | stamps `en` |

  Rows 2 and 4 hold identical keys and need opposite answers. No file in the record defines a
  discriminator (`grep` for `migrateToLocaleDefaults`, "stamp", "fresh install" and
  `app_installed_version` across the folder). The older migration table equates the two states
  outright: "No app language value (every existing install)" (`PROPOSALS.md:93`).
- **Attack tried:** looked for any key that separates an existing install from a fresh one after
  `setStoredVersion` has run. None exists. `whats_new_shown_version` is seeded on fresh installs
  (`version.ts:279`), and the width keys are written by the first layout on both.
- **Consequence:** the plan must replace the guard. A design that converges: decide from the
  stored version captured before it is overwritten (the pattern
  `migrateIndexKeyedAlertPreferences(storedVersion)` already uses, `version.ts:285-289`), stamp
  only when it is present and below `2.0.0`, and write the stamp before `setStoredVersion`
  (`version.ts:269`). A kill before the stamp then leaves the old version in place and the next
  launch stamps. A kill after it finds the key present. UPG-3 moves the same check earlier.
  `compareVersions` is numeric per segment (`shared/versionUtils.ts:20-40`), so `1.29.303` and
  `1.5.1` both sort below `2.0.0`. The step also needs a nullable string factory: the existing
  one takes a string default and cannot hold null (`stores/storage.ts:106-119`).

### UPG-3. CONTRADICTED (MAJOR): R18's ordering proof no longer holds, the stamp lands after the first reads

- **Record says:** "the only first-render inputs whose shape changed are the width keys (seeded
  at module eval) and the language atom (absent key defaults to `en`, byte-identical
  rendering)", and nothing `handleAppUpgrade` writes is read by first paint (`R18`, ordering
  proof).
- **Evidence:** ruling D33 makes an absent key mean "follow the device locale", not `en`.
  `handleAppUpgrade` cannot run before module evaluation ends: its callers are the timer at
  `app/_layout.tsx:50` and the first atom read at `app/index.tsx:59`, and
  `stores/bootstrap.ts:60-64` states the same. Persisted atoms read storage once at creation
  (`stores/storage.ts:7-12, 22`). `InitialWidthMeasurement` renders at `app/_layout.tsx:83`,
  above the `Slot` that holds `Index` (`:85`).
- **Attack tried:** traced which readers run between process start and the stamp on an upgraded
  install whose device language is one of the shipped non-English locales. The language atom is
  created with null. Module-evaluation consumers and any component rendered before `Index`
  reaches line 59 resolve the device locale. `PLAN.md` step 11 makes the width measurement read
  the catalog, so the first measurement can run against the wrong language and write the wrong
  locale's width key.
- **Consequence:** move the stamp to module evaluation, beside the width seed and above the
  language atom's definition. `stores/bootstrap.ts:65` already reads `app_installed_version` at
  module evaluation, so the discriminator of UPG-2 is available there. A raw write before the
  atom exists needs no atom write. `handleAppUpgrade` then carries no language step. The
  crash-window table must be rewritten for this order.

### UPG-4. CONTRADICTED (MAJOR): the widget stores are a stored family, they change shape, and the plan names no version bump

- **Record says:** "Verified against every stored family", five rows, none of them a widget store
  (`R18` section (a) table). `PLAN.md` step 10 bakes the widgets' 25 strings into props. Step 13
  makes the prop contracts carry `id`.
- **Evidence:**
  - `shared/widgetTypes.ts:10-14, 17-21`: both `WIDGET_PROPS_VERSION` (5) and
    `ANDROID_SNAPSHOT_VERSION` (1) say "Bump when the props shape changes".
  - No layout reads `v`. The builder writes it (`shared/widgetTimeline.ts:185, 244, 315`) and
    `git grep` finds no reader under `widgets/`. Tolerance today is field presence only
    (`widgets/PrayerWidget.tsx:537-540, 560-562`).
  - Layouts register when the widget module is first evaluated: `createWidget` constructs the
    native widget with the layout (`node_modules/expo-widgets/build/Widgets.js:7-9, 140-142`),
    and `widgets/PrayerWidget.tsx:769-776` registers all eight home kinds at once. The push path
    requires the module lazily, then pushes Standard, then builds and pushes Extras
    (`stores/widget.ts:63-69, 198-217, 254-255`). An empty or throwing Extras build returns
    without pushing (`:187-193, 226-228`).
  - Android keeps each kind's snapshot JSON in `SharedPreferences` and the native tick re-renders
    it every minute with no JS (`WidgetRefreshScheduler.kt:20-28, 105-115`).
  - The props-less paths render literals with no props to read:
    `widgets/PrayerWidget.tsx:520-525, 759`, `widgets/LockPrayerWidget.tsx:81-83`.
- **Attack tried:** looked for a window where the new layout renders entries the old build
  wrote. One exists by construction: after registration the Extras kinds hold the new layout and
  the old entries until the Extras push lands, and for longer when that push fails. A layout that
  reads a baked string from a version 5 entry gets `undefined`. Who holds old entries: the
  published 1.5.1 build has no widgets, so its users hold none. Both widget flags are on and stay
  on from 2026-09-25 (`shared/flags.ts:27-58`), so every install that ran a 1.29.x build holds
  them, which covers the test fleet today and store users once the 1.29.x release line ships.
- **Consequence:** step 13 must bump both versions, make the layouts branch on `v` (or keep
  every new field optional with the current English literal as fallback), and key rows by index
  or by `id ?? name`. Step 10 must state that the props-less placeholder and the `catch` card
  keep in-body literals, because no prop can reach them. R18's family table needs the two widget
  rows.

### UPG-5. CONTRADICTED (MINOR): the freeze gate does not pin the index-keyed record family

- **Record says:** the freeze test pins "the four MMKV key families and both OS identifier
  builders byte-for-byte" (`R18` step 1, `R15` section (c)).
- **Evidence:** a fifth family depends on the id vocabulary through its position:
  `scheduled_notifications_${scheduleType}_${prayerIndex}_${notification.id}`
  (`stores/database.ts:193`, reminders at `:258`). `prayerIndex` is the canonical position in
  `PRAYERS_ENGLISH` or `EXTRAS_ENGLISH` (`stores/notifications.ts:1388-1405`). The per-prayer
  stale cancel reads records by that prefix and cancels every recorded id it did not attempt
  (`stores/notifications.ts:914, 935-943`).
- **Attack tried:** reordered the planned `EXTRA_PRAYER_IDS` on paper. Each prayer then reads
  another prayer's records as its own stale set and cancels that prayer's alarms while the
  other pass arms them in parallel (`:1390-1408`). The freeze table as specified stays green.
  A second unpinned surface is the Android channel name. Channels persist in the OS, and the
  reminder channel's visible name is built from the same parameter as its id:
  `` `${englishName} in ${intervalMinutes}m Reminder` `` (`shared/notifications.ts:492-502`).
  R15 step 3 retypes that parameter to `PrayerId`. The freeze table pins the channel id and the
  sound file, not the name, so a lowercase `fajr in 5m Reminder` passes it.
- **Consequence:** add three assertions to `prayerIdContract.test.ts`: the exact order of both id
  arrays, the record key bytes for one at-time and one reminder record, and the `en` channel
  name bytes. `createReminderAndroidChannel` needs the label beside the id, as
  `genNotificationContent` does in R15.

### UPG-6. CONTRADICTED (MINOR): four slips in R18's text an executor would trip on

- **Record says:** `Database.remove('preference_show_arabic_names')` (step 5). "Copy the number
  with a raw MMKV read and write" (step 2). The forced refresh runs at `app/index.tsx:118 and
  :144` (step 7). The language atom is "a string atom defaulting to `en`" (Assumptions).
- **Evidence:** the export is `removeItem` (`stores/database.ts:64`). Width values are strings on
  disk: written with `value.toString()` and read with `getString` (`stores/storage.ts:60, 73`).
  The first refresh call is at `app/index.tsx:109`, inside the timer that closes at `:118`. The
  second is at `:144`. D33 makes the atom nullable.
- **Attack tried:** read each cited line at `52109ec0`.
- **Consequence:** the step file must name `removeItem` or `database.remove`, copy the width
  with `getString` and a string `set`, and cite `:109`. Drift note only for the line number.

### UPG-7. CONFIRMED: the stored day records hold no name field and no planned change touches their property names

- **Record says:** the day records are `date` plus nine lowercase time fields (`R18` table, `R13`
  section 3).
- **Evidence:** `shared/types.ts:108-122`. Written whole at `stores/database.ts:136-145`. The row
  builder reads `rawData[name.toLowerCase()]` and tolerates a missing key
  (`shared/prayer.ts:407-409`). Rows are rebuilt from storage, never stored
  (`stores/bootstrap.ts:48-49`).
- **Attack tried:** looked for a reader that needs a name inside the record, and for a strict
  shape check. `isSameRecord` compares the union of keys (`stores/sync.ts:109-114`), which only
  reopens the refresh gate. The id values in R15 equal the nine stored property names.
- **Consequence:** none.

### UPG-8. CONFIRMED: no reader of a bookkeeping record requires `arabicName` or `englishName`

- **Record says:** the extra `arabicName` field is ignored by parse (`R18` table and
  Assumptions).
- **Evidence:** records are read with `JSON.parse` and `filter(Boolean)`, no guard
  (`stores/database.ts:42-48, 74-83`). Readers use `id` and `date` only:
  `stores/notifications.ts:126-127, 935, 982, 1133, 1177`, `shared/notifications.ts:218`,
  `device/notifications.ts:168, 277`. `git grep` for `.arabicName` and `.englishName` finds no
  read of a stored record.
- **Attack tried:** searched for a type guard whose failure wipes, resets or drops alarms. None
  exists over these records. The only empty-set rule is the sweep's refusal to cancel when no
  record exists (`stores/notifications.ts:1521-1526`), which errs towards keeping alarms.
- **Consequence:** none. Old-shape records can outlive the first pass where a refused cancel
  keeps its record (`:982-985`). That is harmless.

### UPG-9. CONFIRMED: no MMKV family needs a `CACHE_SCHEMA_VERSION` bump

- **Record says:** a bump is a category error because no stored family changes shape.
- **Evidence:** per family, against `PLAN.md` steps 1 to 15 and R15's rename:

  | Family | Effect of the plan | Class |
  | --- | --- | --- |
  | `prayer_*`, `fetched_years` | none | unchanged |
  | `scheduled_*` records | lose `arabicName` on rewrite, key bytes unchanged | unchanged for readers |
  | four `preference_*` name-keyed families | bytes unchanged while ids equal today's lowercase names | unchanged |
  | width keys | two legacy keys become per-locale keys | changed and migrated (seed) |
  | `preference_show_arabic_names` | deleted | changed and migrated |
  | `preference_language`, `preference_language_commit_pending` | new | additive |
  | version, What's New and schema markers, `popup_update_last_check` | none | unchanged |
  | widget props (both platforms) | gain fields | changed and unhandled, see UPG-4 |

- **Attack tried:** looked for a family where a bump or a targeted invalidation is safer. The
  only family whose shape moves outside the three migrations is the widget props, and its
  versions are separate constants. A cache bump would also not delete the dead key
  (`stores/version.ts:151`).
- **Consequence:** none for the cache marker. The claim "no stored family changes shape" is
  true of MMKV and false of the widget stores (UPG-4), and "no wipe" is false for pre-marker
  installs (UPG-1).

### UPG-10. CONFIRMED: requests armed by an older build keep firing, can be tapped, and are all replaced or swept

- **Record says:** same-identifier replace reconciles copy and records (`R18` step 7).
- **Evidence:** the only handler is `setNotificationHandler` with a constant answer
  (`hooks/useNotification.ts:11-18`). No response or received listener exists (`git grep`).
  Content carries no `data` (`shared/notifications.ts:123-138, 174-189`). Builds from 1.5.3 on
  use the same deterministic identifiers (`9681e866`, `device/notifications.ts:49-66`). The
  per-prayer pass cancels recorded ids it did not attempt (`stores/notifications.ts:935-943`)
  and the sweep cancels OS ids with no record (`:1528-1533`).
- **Attack tried:** requests whose identifier the new plan never generates: OS-assigned ids from
  1.5.1, and days beyond the request budget. Both have no record after the first pass, so the
  sweep takes them. The sweep skips only when no record exists at all (`:1521-1526`).
- **Consequence:** none.

### UPG-11. CONFIRMED: the width seed at module evaluation is sound

- **Record says:** seed `prayer_max_english_width_en_<standard|extra>` from the legacy keys at
  module scope of `stores/ui.ts`, above the atoms, then remove the legacy keys (`R18` step 2).
- **Evidence:** the MMKV instance exists before `stores/ui.ts` evaluates (`stores/ui.ts:6`,
  `stores/storage.ts:20`). Both keep-lists hold the prefix (`stores/version.ts:155`,
  `stores/sync.ts:365`). The 1.5.1 tree uses the same two key names, the same font
  (`Roboto-Regular`) and the same size (18), so the copied number is valid for upgrades from the
  store build.
- **Attack tried:** a kill between the copy and the removal leaves both keys, and the next
  launch skips the copy and removes. A kill between the two schedules leaves one seeded. A
  too-wide legacy value would never shrink under widen-only (`stores/ui.ts:223-230`), and none
  arises because font and names are unchanged. A downgrade re-measures from zero.
- **Consequence:** none beyond the string-typing note in UPG-6.

### UPG-12. CONFIRMED: the dead key is `preference_show_arabic_names` and deleting it is safe

- **Evidence:** defined at `stores/ui.ts:132`. Two consumers: `components/prayer/Prayer.tsx:36`
  and `components/sheets/screens/Settings.tsx:37`. No widget, native module or script reads it
  (`git grep`). It matches `preference_` in both keep-lists (`stores/version.ts:151`,
  `stores/sync.ts:363`), so only an explicit delete removes it. It exists in the 1.5.1 tree too.
- **Attack tried:** a raw delete behind a live atom breaks the rule at `stores/storage.ts:7-12`.
  The atom is removed in the same release, so no atom fronts the key.
- **Consequence:** none.

### UPG-13. CONFIRMED: the forced reschedule exists, runs on every version increase, and rewrites what R18 says

- **Evidence:** `forceNotificationReschedule` resets the gate through the atom
  (`stores/version.ts:194-201`) on both upgrade branches (`:258-263`).
  `shouldRescheduleNotifications` reads it (`stores/notifications.ts:1459-1466`). The pass
  re-arms every enabled prayer and reminder, rewrites their records, cancels stale ids, sweeps
  and pushes the widgets (`:1585-1668`). A bailed pass leaves the gate open (`:1825-1828`).
  Android reopens the gate on every cold launch as well (`:1787-1792`).
- **Attack tried:** a version that did not increase. `wasAppUpgraded` returns false on equal or
  lower versions (`stores/version.ts:93-108`), which no store upgrade produces.
- **Consequence:** none.

### UPG-14. CONFIRMED: What's New needs no upgrade code, for either population

- **Evidence:** `shouldShowWhatsNew` shows when the stamp equals the installed version and the
  shown version is absent or older (`shared/whatsNew.ts:167-179`). The fresh-install seed is at
  `stores/version.ts:279`. A 1.5.1 install has no shown-version key and a stored version, so the
  modal shows once. The key survives the wipe (`stores/version.ts:147`).
- **Attack tried:** the pre-marker wipe path and the fresh-install path.
- **Consequence:** none.

### UPG-15. CONFIRMED: backup and restore converge

- **Evidence:** the generated manifest sets `android:allowBackup="true"` with no backup rules
  (`android/app/src/main/AndroidManifest.xml:23`). A restored install carries
  `app_installed_version`, so it takes the existing-install path. Android reopens the gate on
  cold launch (`stores/notifications.ts:1787-1792`) and creates channels at schedule time
  (`shared/notifications.ts:474-486`, `device/notifications.ts:106-113`). The cold-launch reopen
  is Android only (`:1788`).
- **Attack tried:** a 1.x backup restored under 2.0.0 (upgrade path, gate forced open), and a
  2.0.0 backup of a device-following install (key absent, follows the new device). On iOS a
  restore at the same version waits for the two-hour gate (`shared/constants.ts:143`), which is
  existing behaviour and unrelated to 2.0.0.
- **Consequence:** none, once UPG-2 fixes the guard.

### UPG-16. CONFIRMED: no persisted UI state carries a name field

- **Evidence:** `alertSheetStateAtom`, which holds `prayerEnglish` and `prayerArabic`, is a
  plain atom (`stores/ui.ts:16-26`). The overlay atom is a plain atom holding an index and a
  schedule type (`stores/atoms/overlay.ts:21-25`). Every persisted atom in production code is in
  `stores/ui.ts` or `stores/notifications.ts` (`git grep atomWithStorage`), and none stores a
  name.
- **Consequence:** none.

### UPG-17. UNCERTAIN: which version the Play Store serves

- **Record says:** nothing. `releases.json` is deleted and Android versions come from the in-app
  updates API (`ai/AGENTS.md`, hard rules).
- **Evidence:** only the App Store answer (1.5.1) and `README.md:25, 29` could be read.
- **What would settle it:** the Play Console release list, or `versionName` from
  `dumpsys package` on a phone that installed from the store.

### UPG-18. UNCERTAIN: how long a new layout renders old widget entries on a real device

- **Evidence:** the window exists in code (UPG-4). Whether registering a layout alone reloads a
  kind, and whether the Android tick can fire between registration and `updateSnapshot`, is
  native behaviour not read here.
- **What would settle it:** on the iPhone and the 3T, install over a build with widgets placed,
  open the app offline with an emptied Extras cache, and read the widget process logs for a
  render between layout registration and the next push.

### UPG-19. UNCERTAIN: whether the sync timer fires before the first render

- **Evidence:** `app/_layout.tsx:50` starts `sync` on a zero-delay timer and `app/index.tsx:59`
  starts it at first render. Which comes first decides how many readers see the pre-stamp
  language in the R18 design.
- **What would settle it:** a monitor build's order of `VERSION: Starting upgrade check`
  (`stores/version.ts:231`) against the `index_first_render` mark (`app/index.tsx:55`). UPG-3's
  repair makes the question moot.

## Better alternatives

| Option | First launch | Offline first launch | Alarm continuity | Code | Tests |
| --- | --- | --- | --- | --- | --- |
| A. Targeted no-wipe migration (the record), repaired per UPG-2, UPG-3, UPG-4 | no visible change for marker-carrying installs | full timetable from cache | never zero, records kept, bells manageable | about 30 lines: seed, stamp, delete, two version constants, layout fallbacks | two new suites, each with a marker fixture and a pre-marker fixture |
| B. Bump `CACHE_SCHEMA_VERSION`, keep preferences | spinner and one year refetch for every user | error screen (`stores/sync.ts:531`), its Refresh wipes again | OS keeps alarms, records gone, an offline bell-off cancels nothing (`device/notifications.ts:163`, `stores/notifications.ts:1521-1526`) | one constant, plus the same stamp and delete, because `preference_` survives | existing wipe suites |
| C. Full wipe and refetch | as B, and every preference resets | as B | worst: bells read Off, no record exists, so nothing cancels the armed alarms (`stores/notifications.ts:1395-1396, 1521-1526`) | least | least |

The record's choice, A, is right for installs that carry the marker. It needs the three repairs
before execution. B is not an alternative the plan can avoid: it is what existing code already
does to the published 1.5.1 build (UPG-1), so both paths ship and both need tests. C loses user
settings and orphans alarms, and nothing recommends it.

One hardening is worth the owner's decision, outside this feature's scope: add
`scheduled_notifications_` and `scheduled_reminders_` to `UPGRADE_KEEP_PREFIXES`, as the refresh
wipe already does (`stores/sync.ts:369-370`). Pre-marker upgraders would then keep manageable
alarms through the wipe. It costs two lines and touches notification scheduling logic, which is
ask-first.

## Not verified

- Partial reads: `shared/prayer.ts` lines 366 to 425 only. `widgets/LockPrayerWidget.tsx` lines
  1 to 180, with the guards at 234 and 381 located by `grep`. `shared/whatsNew.ts` lines 60 to
  237. `README.md` lines 23 to 30 and 112 to 135. `shared/perf.ts` lines 185 to 200.
  `device/updates.ts` lines 13 to 15 by `grep`. `ai/plans/README.md`, `ASSUMPTIONS.md`,
  `R7-FINDINGS.md` and `research/R11-LANGUAGE-COMMIT.md` by `grep` only. The Android manifest
  line 23 only. The five other Kotlin files of the widget refresh module were not read.
- `stores/countdown.ts` and `stores/schedule.ts` were searched for persistence calls and not
  read. `stores/overlay.ts`, `stores/atoms/overlay.ts`, `shared/flags.ts` and
  `shared/versionUtils.ts` were read in full after the Method list was written.
- Android's rule that re-creating a channel updates its visible name comes from platform
  knowledge, not from a source read in this session. A `dumpsys notification` on the 3T after a
  renamed re-create would settle it.
- The 1.5.1 tree was inspected through `grep` extracts of five files, not read whole. Whether
  its derived `suhoor`, `duha` and `istijaba` offsets equal today's is not established. The
  missing-marker wipe makes it moot.
- The iTunes Lookup JSON was parsed whole and four fields were extracted. It was not read by
  eye.
- Native stores were not read: the `expo-notifications` Android request store, the iOS pending
  request store, and the `expo-widgets` native layout and timeline storage on either platform.
  UPG-4 rests on the JavaScript side and the scheduler's own comments.
- No test was run and no device was used. Everything under UPG-17 to UPG-19 needs one.
- The iOS native project and its app group entitlement were not opened.
