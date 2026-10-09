# Verification: identifiers

| Field | Value |
| --- | --- |
| Base | `uat` `52109ec0` (1.29.303) |
| Date | 2026-10-09 |
| Claim under test | The prayer identifier becomes a closed lowercase slug union in the space form (`last third`), because the stored MMKV keys and the armed OS notification identifiers already carry those bytes. The underscore form is a derived filename slug only, and a four-part `prayerIdContract.test.ts` freezes the bytes. |
| Result | 8 confirmed, 5 contradicted, 1 uncertain |

## Method

Read in full: `ai/AGENTS.md`, `SINGLE-LANGUAGE-PIVOT.md`, `OWNER-DECISIONS.md`, `PLAN.md`,
`research/R15-IDENTIFIER-DESIGN.md`, `research/R13-BLAST-RADIUS.md`, `research/R18-UPGRADE-PATH.md`,
`NOTIFICATION-EVIDENCE.md`, `scripts/identifier-contract.py`, `stores/notifications.ts` (1960 lines,
three consecutive chunks), `device/notifications.ts`, `shared/notifications.ts`, `shared/prayer.ts`,
`shared/types.ts`, `shared/widgetTypes.ts`, `stores/database.ts`, `stores/storage.ts`,
`stores/version.ts`, `e2e/scripts/device-checks.sh`, `plugins/replacePreviousNotification.js`, and
`node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/service/delegates/SharedPreferencesNotificationsStore.kt`.

Ran, read-only:

- `scripts/identifier-contract.py` from the worktree root, and its preference-key regular
  expression against `stores/notifications.ts` at `5ad6aaba`, `500e5037`, `cd47c70c` and `52109ec0`.
- `git log -S` for the commits that introduced name-keyed preferences, deterministic identifiers
  and the cache schema marker. `git show 9681e866^:<file>` for the builders before that commit.
- `git grep` for `toLocaleLowerCase`, `toLocaleUpperCase`, `.toLowerCase()`, `.toUpperCase()`,
  storage writes, notification `data` and category fields, and widget version reads.
- A scratch type-check (`tsc --noEmit --strict --ignoreConfig` on one file under the scratch
  folder) to test the narrowing claim in R15 against the real shape of `shared/prayer.ts:398-407`.

External primary sources, fetched raw into the scratch folder:

- Hermes `lib/VM/JSLib/String.cpp`, `lib/Platform/Unicode/PlatformUnicodeCF.cpp` and
  `lib/Platform/Unicode/java/com/facebook/hermes/unicode/AndroidUnicodeUtils.java` from
  `https://raw.githubusercontent.com/facebook/hermes/main/`.
- The public store lookup `https://itunes.apple.com/lookup?bundleId=<bundleIdentifier from app.json:18>&country=gb`.
- The public Play listing page `https://play.google.com/store/apps/details?id=<package from app.json:34>`,
  searched for its embedded version string only.

No test suite was run. No code was changed.

## Findings

### ID-1. CONFIRMED: every key and identifier builder, with the bytes each one emits

- **Record says:** four MMKV families and two OS builders emit the lowercase space form. Channel
  ids and sound files emit the underscore form (R15 section a, table).
- **Evidence:** every builder lowercases the Title Case literal from `shared/constants.ts:9` and
  `:26` with plain `.toLowerCase()`. Only `prayerNameSlug` replaces whitespace.

| Surface | Builder | Form | Bytes for Last Third |
| --- | --- | --- | --- |
| Alert preference | `stores/notifications.ts:207` | space | `preference_alert_extra_last third` |
| Reminder alert, slot 0 and 1 | `stores/notifications.ts:258`, suffix at `:241` | space | `preference_reminder_alert_extra_last third`, `..._last third_2` |
| Reminder interval, slot 0 and 1 | `stores/notifications.ts:278` | space | `preference_reminder_interval_extra_last third`, `..._last third_2` |
| Repair mark | `stores/notifications.ts:335` | space | `preference_notification_repair_extra_last third` |
| OS at-time identifier | `device/notifications.ts:49-50` | space | `athan_extra_last third_2026-08-28` |
| OS reminder identifier | `device/notifications.ts:61-66` | space | `reminder_extra_last third_2026-08-28_15` |
| Bookkeeping record key | `stores/database.ts:193`, `:258` | canonical index plus the OS identifier | `scheduled_notifications_extra_1_athan_extra_last third_2026-08-28` |
| Bookkeeping record value | `device/notifications.ts:130`, `:248`, `stores/notifications.ts:877`, `:1071` | Title Case and Arabic | `"englishName":"Last Third","arabicName":"آخر ثلث"` |
| Reminder channel id | `shared/notifications.ts:387-390` | underscore | `reminder_last_third_15_v3` |
| Reminder channel name | `shared/notifications.ts:502` | Title Case | `Last Third in 15m Reminder` |
| Reminder sound | `shared/notifications.ts:161-162`, `:503` | underscore | `reminder_last_third_15.mp3` |
| Legacy channel ids deleted | `shared/notifications.ts:529-530` | underscore | `reminder_last_third_15`, `reminder_last_third_15_v2` |
| Notification title | `shared/notifications.ts:130`, `:181` | Title Case | `Last Third now`, `Last Third in 15m` |
| Widget props | `shared/widgetTimeline.ts:135`, `:188`, `:247`, `:303`, `:306` | Title Case under `name` and `nextName` | `Last Third` |
| Legacy preference keys | `stores/notifications.ts:493`, `:575-580` | index | `preference_alert_extra_1` |
| In-memory plan key | `shared/notifications.ts:252-253` | Title Case, never stored | `extra_Last Third` |

  The other ten prayers are single words, so the space and underscore forms coincide: `fajr`,
  `sunrise`, `dhuhr`, `asr`, `magrib`, `isha`, `midnight`, `suhoor`, `duha`, `istijaba`. Standard
  prayers take `standard` where the table shows `extra`. The at-time sound is not per prayer:
  `athan<n>.mp3` on channel `athan_<n>_v4` for the five daily prayers, `reminder.mp3` on
  `extras_at_time_v3` for Sunrise and the extras (`shared/notifications.ts:88`, `:112-117`, `:380`,
  `:396`, `:402-403`). The notification content carries no `data` payload and no category
  (`shared/notifications.ts:129-137`, `:180-188`), and no response listener exists in the tree.
- **Attack tried:** looked for a third lowercase form (kebab, camel, API field name). None exists.
  Five forms reach persisted or armed state in total: space, underscore, Title Case, Arabic and
  canonical index.
- **Consequence:** none for the union itself. The index and Title Case forms feed ID-4, ID-6 and ID-10.

### ID-2. CONFIRMED: no stored byte depends on the device locale

- **Record says:** the lowercase forms are the bytes on disk (R15 section a).
- **Evidence:** `git grep -E "toLocaleLowerCase|toLocaleUpperCase"` over tracked source returns
  nothing. Every key and identifier builder calls `.toLowerCase()`: `device/notifications.ts:50`,
  `:66`, `shared/notifications.ts:106`, `:147`, `shared/prayer.ts:324`, `:407`,
  `stores/notifications.ts:207`, `:258`, `:278`, `:335`, `:570`. Hermes routes that call to
  `convertCase(runtime, ..., false, false)` (`String.cpp:924-936`), and with `useCurrentLocale`
  false an all-ASCII string takes a bitwise path that never asks the platform (`String.cpp:852-912`,
  `ch = c | (isUpper << 5)`). Non-ASCII input would reach Android with `Locale.ENGLISH`
  (`AndroidUnicodeUtils.java:50`) and Apple platforms with a null locale
  (`PlatformUnicodeCF.cpp:147-153`). All eleven source literals are ASCII.
- **Attack tried:** the Turkish, Azerbaijani and Lithuanian dotless-i case on `Isha`, `Istijaba`,
  `Midnight`, `Sunrise` and `Last Third`. It cannot fire through `.toLowerCase()`.
- **Consequence:** none. The one locale-neutral upper-case call, `widgets/PrayerWidget.tsx:378`,
  is display only and belongs to the copy theme.

### ID-3. CONFIRMED: a space inside the identifier is legal and unmangled on every surface that carries it

- **Record says:** the space form is canonical for the OS identifiers (R15 section a).
- **Evidence:** Android stores each request under `"notification_request-" + identifier` with no
  encoding (`SharedPreferencesNotificationsStore.kt:18`, `:117-118`). The alarm's `PendingIntent`
  takes its identity from a data URI built with `Uri.Builder.appendPath(identifier)`, which
  percent-encodes the segment, plus the raw string as an extra. The request code is the receiver
  class hash, the same for every alarm (`NotificationsService.kt:417-445`). The posting layer swaps
  the identifier for one shared tag and never parses it (`plugins/replacePreviousNotification.js:20-47`).
  `patches/` holds no patch for `expo-notifications`. iOS passes the string straight to the request
  (`ios/ExpoNotifications/Notifications/Scheduling/SchedulerModule.swift:119-141`, located by grep).
  MMKV keys are arbitrary strings.
- **Attack tried:** looked for a split, a hash of a token, or a regular expression that assumes
  no whitespace. `e2e/scripts/device-checks.sh:152-164` matches only `extras_at_time` and
  `athan_<n>` channel ids inside quotes. `e2e/scripts/device_checks.py:20` states the alarm dump
  carries no per-notification identifier. `e2e/flows` holds no identifier. The surfaces where a
  space is illegal (Android resource names, the `app.json:117-182` sound list) already use the
  underscore slug.
- **Consequence:** none. A device dump showing an armed `last third` alarm would close the last gap.

### ID-4. CONTRADICTED (MAJOR): the space-form bytes are not on disk for any public store install

- **Record says:** the ids are the byte-exact forms already on disk and already armed on phones,
  so zero migration and zero orphaned alarms follow (R15 section a, "Migration risk", and
  `SINGLE-LANGUAGE-PIVOT.md` design direction).
- **Evidence:** name-keyed preferences and deterministic identifiers both arrive in commit
  `9681e866` (2026-08-28). Its parent builds `preference_alert_${type}_${prayerIndex}`,
  `preference_reminder_alert_${type}_${prayerIndex}` and `preference_reminder_interval_${type}_${prayerIndex}`
  and passes no `identifier` to `scheduleNotificationAsync`. The App Store lookup returns version
  `1.5.1`, released 2026-02-16, six months before that commit. The Play listing page embeds
  `1.5.2`. The last commit before that release date, `3c8220aa` (package version 1.5.2), builds
  the same three index keys at `stores/notifications.ts:91`, `:123` and `:137`, and its
  `device/notifications.ts` never mentions an identifier. A store install therefore holds index
  keys (`preference_alert_extra_1`) and library-generated identifiers. It also holds no
  `cache_schema_version` marker (absent at `3c8220aa`, introduced in `5da7be0a`, 2026-09-12), so
  its first upgrade wipes the days and the bookkeeping records regardless of the 2.0.0 design
  (`stores/version.ts:166-173`, `:258-260`). The space-form bytes exist only on devices that ran a
  local build from `9681e866` onward.
- **Attack tried:** looked for any released build after `9681e866`. `git tag` is empty and neither
  store shows one. The claim survives only for development and test devices.
- **Consequence:** the design stays safe, but three plan items change. First, for the store fleet
  `migrateIndexKeyedAlertPreferences` (`stores/notifications.ts:525-598`) is the code that writes
  the name bytes for the first time, so the freeze table must pin the index-to-name mapping, both
  for today's order and for `EXTRAS_ENGLISH_PRE_1_0_27` (`:487`). Second, the device proof in
  `PLAN.md` section 7 installs over a populated 1.29.x build. It must also install over a populated
  store build, which is the upgrade real users take. Third, the cost of the alternatives changes
  (see "Better alternatives"): no store user holds a space-form key today.

### ID-5. CONTRADICTED (MAJOR): R15 tells the executor to delete the arrays the migration reads, and to leave the migration alone

- **Record says:** step 5 deletes `PRAYERS_ENGLISH` and `EXTRAS_ENGLISH` outside test fixtures and
  keeps the Title Case `EXTRAS_ENGLISH_PRE_1_0_27`. Step 6 leaves the migration alone (R15 section b).
- **Evidence:** the migration reads both arrays at `stores/notifications.ts:552`, `:557` and `:558`,
  and resolves the destination with `currentNames.indexOf(prayerName)` at `:567`. Both operands
  are annotated `readonly string[]` (`:557-558`), so swapping `currentNames` to the lowercase id
  array compiles. A Title Case source name then misses, the loop returns at `:568`, and the sweep
  at `:589-590` deletes the unmigrated index keys. An install last run before 1.0.27 would lose
  every extras bell setting.
- **Attack tried:** checked whether the compiler stops it. It does not, because of the explicit
  `readonly string[]` annotations. A test does: `stores/__tests__/notifications.test.ts:295-340`
  holds pre-1.0.27 cases (located by grep, suite not read in full), so the naive edit goes red
  and the executor stops on a failure no step names. The defect is unlikely to ship. The
  instruction conflict remains.
- **Consequence:** step 05 must specify the migration edit line by line: keep a private Title Case
  pair for the migration, or lowercase the legacy array and both operands together. The plan forbids
  the executor from deciding, and R15's two steps cannot both be followed.

### ID-6. CONTRADICTED (MAJOR): the freeze table misses stored families and the positional contract

- **Record says:** the freeze table pins the four MMKV families, both OS builders, the reminder
  channel id and the sound filename, and R18 calls every later step safe because those bytes do
  not move (R15 section c, R18 section b step 1).
- **Evidence:** six MMKV families embed the prayer vocabulary, not four. The two bookkeeping
  families carry the canonical index and the whole OS identifier in the key
  (`stores/database.ts:193`, `:258`) and are read back by index prefix (`:236`, `:272`). Every atom
  array is positional (`stores/notifications.ts:215`, `:224`, `:287-313`, `:346-353`, `:677-682`).
  A reordered id array makes one prayer's pass read another prayer's records and cancel them as
  stale after its own arm (`stores/notifications.ts:914`, `:935-943`), while the other pass arms the
  same identifiers concurrently (`:1390-1408`). The freeze table as specified pins bytes per id and
  says nothing about position, and R15 step 2 declares the two id arrays without stating their
  order. Today's only order pin is `shared/__tests__/constants.test.ts:84`, on an array step 5
  removes. Also outside the table: the at-time sound and channel choice per
  prayer (`shared/notifications.ts:88`, `:402-403`) and the legacy channel ids (`:529-530`).
- **Attack tried:** searched for a regression class the four assertions pass over. Found four:
  array order, the index-key migration map (ID-4), the daily-versus-extras sound boundary, and a
  call site handing the right builder the wrong prayer. A fifth candidate does not hold: a file on
  disk but missing from the `app.json:84-183` sound list is already caught, because
  `shared/__tests__/audioMatrix.test.ts:98-111` derives 99 files from code and compares them with
  `app.json` (located by grep, suite not read in full). R15's disk join overlaps that suite.
- **Consequence:** step 01 adds to the freeze table: the exact order of both id arrays, one
  bookkeeping key per family, the `isDailyPrayer` truth table for all eleven ids, and the
  legacy channel ids. The disk join should extend `audioMatrix.test.ts` or cite it, not repeat it.

### ID-7. CONTRADICTED (MAJOR): three of the type-safety claims do not hold as written

- **Record says:** once ids are literals the night-row branch narrows the id, so the cast at
  `shared/prayer.ts:407` deletes itself. A vocabulary miss becomes a compile error at every seam.
  The empty loading sentinel stops type-checking, which is the point (R15 sections a and b).
- **Evidence:**
  1. The branch tests `type === ScheduleType.Extra && name === ...` through two aliased constants
     (`shared/prayer.ts:398-400`). Its false side cannot exclude any name. A scratch file with that
     exact shape, the eleven-member union and the nine-field record fails with `TS7053: Property
     'last third' does not exist on type`. The cast survives unless the branch is rewritten.
  2. `Database.getItem` returns `any` from `JSON.parse` (`stores/database.ts:42-48`), and so does
     `getAllWithPrefix` (`:74-83`). The same scratch file passes `stored.englishName` into a
     `PrayerId` parameter with no error. Widget props cross the same kind of boundary.
  3. `hooks/usePrayer.ts:90-92` returns `english: ''`, and `canonicalPrayerIndex` exists to turn
     that miss into the row index (`stores/notifications.ts:656-666`, called at
     `components/prayer/Alert.tsx:66`). R15 does not say what the sentinel becomes. Any real id
     makes every loading row read that one prayer's bell atom.
- **Attack tried:** checked that the firewall itself can work. It can: `tsconfig.json` includes
  every `.ts` file, `yarn validate` runs `tsc --noEmit`, and the pre-commit hook runs
  `yarn validate`. A stale `@ts-expect-error` fails the type-check. It does not fail the Jest
  suite as R15 words it, because the suites compile through Babel (`jest.config.js:17-20`).
- **Consequence:** step 05 must specify (1) the rewritten branch, for example a name-only guard
  that narrows to the stored-time subset, (2) that stored records and widget props never feed a
  `PrayerId` parameter, with the record reader typed, and (3) the loading row's type, for example
  a discriminated `id: null` that keeps the row-index fallback.

### ID-8. CONTRADICTED (MINOR): the counts 27 and 11 are not what the script measures

- **Record says:** 27 MMKV preference keys, 2 OS identifier builders, 11 audio-slug sites,
  5 ordering and day-rule sites, 67 reminder mp3s (`SINGLE-LANGUAGE-PIVOT.md` fact 2). R15 says
  27 sites. `PLAN.md` section 1 says 27 storage keys.
- **Evidence:** the script prints 8 preference-key lines at `52109ec0`, and its regular expression
  matches 8 lines at `5ad6aaba`, `500e5037` and `cd47c70c` too (`stores/notifications.ts:207`, `:258`,
  `:278`, `:335`, `:575`, `:576`, `:578`, `:579`). The distinct name-keyed keys number 66: 11 alert,
  22 reminder alert, 22 reminder interval, 11 repair. The 11 audio lines include the athan
  filenames and a doc comment (`shared/notifications.ts:116`, `:145`). The real slug callers are
  `:161`, `:388`, `:498` and `:529`. The 2, the 5 and the 67 reproduce (67 files: 66 plus
  `reminder.mp3`). The script's own slug parse splits on `_` and prints `last`, not `last_third`.
- **Attack tried:** looked for a commit where 27 holds. Found none. `MEASURED.md:45` carries the
  number without a derivation (located by grep, file not read in full).
- **Consequence:** correct the figures to 66 keys in 4 preference families from 8 source lines.
  The design is unaffected. The 5 ordering sites are one file's hits. R13 section 9 lists the rest.

### ID-9. CONFIRMED: the day-record keys are a strict subset of the proposed union, same spelling

- **Record says:** day records hold `date` plus nine lowercase time fields, and nine of the eleven
  ids are those field names (R13 section 3, R15 "API alignment").
- **Evidence:** `shared/types.ts:108-122` declares `fajr`, `sunrise`, `dhuhr`, `asr`, `magrib`,
  `isha`, `suhoor`, `duha`, `istijaba`. `midnight` and `last third` are never stored
  (`shared/types.ts:96-98`, `shared/prayer.ts:159-176`). A third vocabulary, `RequiredTimeName`
  (`shared/types.ts:74`), holds the six provider names. The raw API adds `*_jamat` and `asr_2`
  (`shared/types.ts:12-39`). The lookup reaches the record for eight names only, because
  Istijaba takes the instant path (`shared/prayer.ts:398-407`).
- **Attack tried:** looked for a spelling split between the API and the names. None: `magrib`
  matches on both sides.
- **Consequence:** one union must not be reused as the record's key type. `Record<PrayerId, ...>`
  would demand two stored night fields the repository forbids. Step 05 should name the subset
  (`Exclude<PrayerId, 'midnight' | 'last third'>`) and assert it equals the record's keys minus
  `date` at the type level. That subset is also what ID-7 item 1 needs.

### ID-10. CONFIRMED: renaming `english` to `id` changes no persisted property name

- **Record says:** rows are never persisted. Bookkeeping records keep `englishName`, and an old
  record with `arabicName` still parses (R15 step 4, R18 section a).
- **Evidence:** the only persisted objects with name properties are the bookkeeping records
  (`shared/notifications.ts:17-24`). Nothing reads `englishName` or `arabicName` back: the readers
  use `id` and `date` only (`stores/notifications.ts:124-134`, `:935`, `:982`, `:1528`,
  `shared/notifications.ts:218`). The reader is untyped `JSON.parse` (`stores/database.ts:42-48`).
  Widget props use `name` and `nextName`, not `english` (`shared/widgetTypes.ts:48-53`, `:80-81`,
  `:127-134`). `prayerEnglish` and `prayerArabic` live in a plain in-memory atom
  (`stores/ui.ts:26`, written at `components/prayer/Alert.tsx:154-160`).
- **Attack tried:** searched every `database.set`, `setItem` and `atomWithStorage` call for an
  object carrying `english`, `arabic`, `englishName` or `arabicName`. Only the records qualify.
- **Consequence:** none for safety. One gap: R15 keeps `englishName` as a display snapshot, which
  under a non-English locale stores a localised string in a field named English. Step 04 should
  write the id there, or rename the field, since nothing reads it.

### ID-11. UNCERTAIN: what the new widget code does with a timeline the old build pushed

- **Record says:** widget props carry a schema version and a `props == null` guard. The payload
  carries the id when its schema next bumps (`ai/AGENTS.md`, R15 seam 5, `PLAN.md` step 13).
- **Evidence:** the version is written (`shared/widgetTimeline.ts:185`, `:244`, `:315`) and never
  read: no file under `widgets/` references `WIDGET_PROPS_VERSION`, `ANDROID_SNAPSHOT_VERSION` or
  `.v`. Tolerance today rests on optional fields (`shared/widgetTypes.ts:72`, `:79`, `:104`). Rows
  are keyed by name at `widgets/PrayerWidget.tsx:737`. If step 13 keys rows by `row.id`, an entry
  from the old build has no `id` and every row gets the same undefined key.
- **Attack tried:** looked for a version gate that would drop or adapt an old entry. None exists.
- **Consequence:** the claim cannot be settled from code, because the widget runtime is not React
  and its handling of duplicate keys is undocumented here. It settles with a widget runtime load
  test that renders a version 5 fixture through the step 13 layout, on both platforms. Step 13
  must state the version bumps (5 to 6, 1 to 2), keep `id` optional, and fall back to the name.

### ID-12. CONFIRMED: the `last_third` spelling would silently switch the Last Third bell off

- **Record says:** an underscore id makes every stored Last Third preference miss, orphans every
  armed Last Third alarm, and the sweep then cancels the orphans (R15 section a).
- **Evidence:** a missing key reads the default `AlertType.Off` (`stores/notifications.ts:207`,
  `stores/storage.ts:60-61`), and a full reschedule clears every recorded alarm of a prayer whose
  bell is Off (`stores/notifications.ts:1394-1397`, `:973-990`).
- **Attack tried:** traced the mechanism. Drift note: the alarms are not orphaned and the sweep is
  not what removes them. The per-prayer clear cancels them by record. The identifier half is
  self-healing on its own: a pass arms the new identifiers first, then cancels the recorded old
  ones (`stores/notifications.ts:926-943`). The damage comes from the six preference keys alone.
- **Consequence:** none for the verdict. It lowers the true cost of the underscore alternative below.

### ID-13. CONFIRMED: the legacy path is read correctly, and it deletes any numeric-suffixed key

- **Record says:** `migrateIndexKeyedAlertPreferences` writes the same name keys the design keeps,
  and the fallback in `canonicalPrayerIndex` masks a miss (R15 step 6, R13 seam 3).
- **Evidence:** the migration lowercases the name at `stores/notifications.ts:570` and writes
  through the atoms (`:536-550`, `:575-581`). It runs on every launch (`stores/version.ts:289`). Its
  sweep removes every key matching `INDEX_KEY_PATTERN` (`stores/notifications.ts:493`, `:589-590`).
  Slot-1 keys end in `_2` after a name, so they do not match.
- **Attack tried:** tested the numeric-id alternative against the sweep. A key such as
  `preference_alert_extra_1` matches the pattern and is deleted at every launch.
- **Consequence:** none for the record. A numeric or enum id cannot share these key prefixes.

### ID-14. CONFIRMED: R15's line citations hold at `52109ec0`

- **Record says:** line numbers verified at `cd47c70c`.
- **Evidence:** `stores/notifications.ts:207`, `:258`, `:278`, `:335`, `:487`, `:525-598`,
  `:663-666`, `:1528-1533`, `shared/prayer.ts:181`, `:258`, `:324`, `:358`, `:398-401`, `:407`,
  `shared/notifications.ts:112-117`, `:130-131`, `:147`, `:161-162`, `:387-390`,
  `device/notifications.ts:49-66`, `stores/database.ts:193`, `:258`, `hooks/usePrayer.ts:89-92` and
  `device/__tests__/notifications.test.ts:46-50` all match. No drift found between `cd47c70c` and
  `52109ec0` on these lines.
- **Attack tried:** none beyond the read.
- **Consequence:** none.

## Better alternatives

| Alternative | Migration risk | Lines and tests | Failure mode | Verdict |
| --- | --- | --- | --- | --- |
| Space-form union (the record) | None to keys or alarms. The existing index migration stays load-bearing for store installs (ID-4) | About 30 read sites plus the builders. One contract test, extended per ID-6 | A later "tidy the space" change. The freeze test answers it | Right choice |
| Underscore-form union with a one-time migration | Six keys for one prayer, on devices that ran a build from `9681e866` onward. No store install holds them today (ID-4). Identifiers self-heal (ID-12) | About 30 more lines through the atoms, a migration suite, and a new preference-key write that needs the owner's sign-off under the ask-first rule | A missed or late migration switches the Last Third bell off | Cheaper than the record states, still not worth it |
| Branded opaque id | None | A constructor or cast at every literal and fixture. Loses exhaustive `switch` and compile-time catalog closure | Casts spread, and `any` still passes (ID-7) | Worse than the union |
| Numeric or enum id with a legacy-string map | High. Numeric-suffixed keys are deleted every launch by the legacy sweep (ID-13). Two maps must reproduce the strings | Two maps, a migration, every fixture | Preferences vanish at launch, or a map drifts and alarms miss | Rejected, as the record says |

The underscore form would remove the one derived mapping and make ids equal to file names and
channel ids. It would also make composite identifiers ambiguous to split on `_`, where the space
form is not. The window in which it costs nothing for store users closes when the first build
from `9681e866` onward reaches a store. The record's choice stands. Its stated reason needs the
correction in ID-4: the bytes bind the test fleet today, and the store fleet from the next release.

One addition beats nothing in the record and costs a few lines: name the stored-time subset as its
own type (ID-9). It removes the cast at `shared/prayer.ts:407` for real and stops the union from
being reused as the day-record key type.

## Not verified

- Store versions beyond one storefront each. The Play figure is a pattern match on the listing
  page's embedded data, not an API answer, and the page was not read in full.
- Whether any build from `9681e866` onward reached external testers.
- Device behaviour: an armed `last third` alarm in a dump, the widget runtime on a version 5
  entry (ID-11), and the upgrade from the store build. On iOS that upgrade briefly holds the old
  library-generated requests beside the new ones against the 64-request ceiling. That needs a device.
- Partial reads: `shared/constants.ts` (lines 1 to 70 of 1012), `NotificationsService.kt`
  (lines 385 to 449 of 878, plus a grep of identifier uses), `widgets/PrayerWidget.tsx` (lines 80
  to 139 of 776, plus a grep), `shared/widgetTimeline.ts` (lines 100 to 320 of 320),
  `hooks/usePrayer.ts` (lines 78 to 96), `components/prayer/Alert.tsx` (lines 58 to 70 and 150
  to 190), `device/__tests__/notifications.test.ts` (lines 1 to 80 of 427),
  `e2e/scripts/device_checks.py` (grep only), `MEASURED.md` (grep only), Hermes `String.cpp`
  (lines 836 to 945 of 2673) and `PlatformUnicodeCF.cpp` (lines 130 to 165 of 199). The Hermes
  files come from the `main` branch, not the exact revision bundled with React Native `0.88.0-rc.3`.
- Not read beyond a grep: `widgets/LockPrayerWidget.tsx`, `stores/widget.ts`, `stores/ui.ts`,
  `stores/schedule.ts`, `stores/countdown.ts`, `shared/sequence.ts`,
  `components/prayer/rowPress.ts`, `components/overlay/overlayContent.ts`, `app.json`,
  `jest.config.js`, the iOS scheduler source, and the migration and audio suites named in ID-5
  and ID-6. Citations to those files are grep hits or R13's, and are marked as such.
- Widget kinds, App Group defaults and Android widget storage were not traced. The grep found no
  prayer-keyed widget kind.
- The claim that TypeScript admits any number into a numeric enum was not re-tested.
