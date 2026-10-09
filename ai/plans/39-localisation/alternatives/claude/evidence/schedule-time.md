# Evidence: schedule, time, sync and storage

Facts only, no design. Every citation is `path:line` relative to the repo root at base commit
`c3149dfc`. Section 7 lists what was read in full and what was only located by search.

## 1. API and stored data shapes

### Request

- One endpoint serves a year or a single day: `https://www.londonprayertimes.com/api/times`
  (`api/config.ts:5`).
- The query is `format=json`, `key=<EXPO_PUBLIC_API_KEY>`, then `year=<YYYY>` or
  `date=<YYYY-MM-DD>`, then `24hours=true` (`api/client.ts:19-24`, `api/config.ts:3-7`,
  `shared/config.ts:4`).
- The request is a `GET` with `Cache-Control: no-cache` (`api/client.ts:26`).
- A build that is neither `prod` nor `preview` never calls the network. It serves
  `MOCK_DATA_SIMPLE` for a year (`api/client.ts:124`) and one of its days for a day
  (`api/client.ts:168-172`).

### Raw response

| Shape | Definition | Notes |
| --- | --- | --- |
| Year answer `IApiResponse` | `shared/types.ts:66-71` | `{ city: string, times: Record<YYYY-MM-DD, IApiSingleTime> }` |
| Day row `IApiSingleTime` | `shared/types.ts:12-39` | 13 fields, all strings |
| Single-day answer | `api/client.ts:167-176` | A flat `IApiSingleTime`, not a `times` map |

`IApiSingleTime` fields: `date`, `fajr`, `fajr_jamat`, `sunrise`, `dhuhr`, `dhuhr_jamat`, `asr`,
`asr_2`, `asr_jamat`, `magrib`, `magrib_jamat`, `isha`, `isha_jamat` (`shared/types.ts:12-39`).
Only six are used: `fajr`, `sunrise`, `dhuhr`, `asr`, `magrib`, `isha` (`api/client.ts:48`,
`shared/types.ts:74`).

A single-day body is checked against the requested date, then wrapped as
`{ city: 'london', times: { [date]: body } }` so it goes through the same pipeline
(`api/client.ts:197-199`).

### Pipeline from answer to stored row

| Step | Site | What it does |
| --- | --- | --- |
| HTTP check | `api/client.ts:29-33` | A non-OK status throws `HTTP error! status: N` |
| Empty year | `api/client.ts:39-45` | An empty `times` object throws `Incomplete data received` |
| Date filter | `shared/prayer.ts:39-54` | Keeps yesterday, today and later (`shared/time.ts:280-283`) |
| Field validation | `api/client.ts:78-111` | Each of the six times is kept when it matches `^([01]\d|2[0-3]):[0-5]\d$` (`api/client.ts:51`), otherwise stored as `null` (`api/client.ts:101`) |
| Whole-payload refusal | `api/client.ts:108` | Throws only when no field from today on is readable |
| Transform | `shared/prayer.ts:70-95` | Copies the six times and derives three more |
| Save | `stores/database.ts:136-145` | One MMKV entry per day |

Validation yields `IValidatedApiResponse` (`shared/types.ts:80-83`): the same `city`, and per day
a `Record<RequiredTimeName, string | null>`.

### Stored row

`ISingleApiResponseTransformed` (`shared/types.ts:108-122`), stored as a JSON string under
`prayer_<YYYY-MM-DD>` (`stores/database.ts:138-140`):

| Field | Type | Source |
| --- | --- | --- |
| `date` | `string` (YYYY-MM-DD) | Map key (`shared/prayer.ts:79`) |
| `fajr`, `sunrise`, `dhuhr`, `asr`, `magrib`, `isha` | `string \| null` (HH:mm, 24 hour) | Provider (`shared/prayer.ts:80-85`) |
| `suhoor` | `string \| null` | Fajr minus 20 minutes (`shared/prayer.ts:86`, `shared/constants.ts:227`) |
| `duha` | `string \| null` | Sunrise plus 20 minutes (`shared/prayer.ts:87`, `shared/constants.ts:228`) |
| `istijaba` | `string \| null` | Magrib minus 60 minutes (`shared/prayer.ts:88`, `shared/constants.ts:229`) |

- `istijaba` is stored for every day. The list builder shows it on Fridays only
  (`shared/prayer.ts:314-330`) and takes its instant from Magrib's instant, not from the stored
  string (`shared/prayer.ts:130-138`, `shared/prayer.ts:398-404`).
- Midnight and Last Third are never stored. They are computed from the previous day's Magrib
  and the day's Fajr when a list is built (`shared/prayer.ts:159-176`, `shared/time.ts:406-414`).
- A stored record may lack a key altogether (an edited backup). Readers test
  `typeof value !== 'string'` rather than `=== null` (`shared/prayer.ts:132`,
  `shared/prayer.ts:169`, `shared/prayer.ts:409`).
- Pinned by tests: a fully unreadable day is stored with all nine times `null`
  (`stores/__tests__/syncUnreadableDay.test.ts:117-135`); one unreadable field nulls its derived
  field only (`stores/__tests__/syncFetchBeforeWipe.test.ts:307-315`).

### Where prayer identifiers are defined

| List | Site | Members |
| --- | --- | --- |
| `RequiredTimeName` (type) | `shared/types.ts:74` | `fajr`, `sunrise`, `dhuhr`, `asr`, `magrib`, `isha` |
| `REQUIRED_TIMES` | `api/client.ts:48` | The same six, lowercase |
| Stored field names | `shared/types.ts:108-122` | The six plus `suhoor`, `duha`, `istijaba` |
| `PRAYERS_ENGLISH` | `shared/constants.ts:9` | `Fajr`, `Sunrise`, `Dhuhr`, `Asr`, `Magrib`, `Isha` |
| `PRAYERS_ARABIC` | `shared/constants.ts:15` | Six Arabic names, index-aligned with `PRAYERS_ENGLISH` |
| `EXTRAS_ENGLISH` | `shared/constants.ts:26` | `Midnight`, `Last Third`, `Suhoor`, `Duha`, `Istijaba` |
| `EXTRAS_ARABIC` | `shared/constants.ts:32` | Five Arabic names, index-aligned with `EXTRAS_ENGLISH` |
| `NIGHT_PRAYER_NAMES` | `shared/constants.ts:39` | `Midnight`, `Last Third`, `Suhoor` |
| `MIDNIGHT_CROSSING_PRAYERS` | `shared/constants.ts:47` | `Isha`, `Magrib` |
| `ScheduleType` | `shared/types.ts:148-153` | `standard`, `extra` |

No separate identifier type exists. The English display name is the identifier:

- The stored field is looked up as `rawData[name.toLowerCase()]`, so the display name lowercased
  must equal the stored field name (`shared/prayer.ts:407`).
- Special rows are chosen by comparing the English name to a literal: `'Midnight'`
  (`shared/prayer.ts:181`, `shared/prayer.ts:399`), `'Last Third'` (`shared/prayer.ts:399`),
  `'Istijaba'` (`shared/prayer.ts:398`), and `'istijaba'` after lowercasing
  (`shared/prayer.ts:324`).
- The non-Friday Arabic list is filtered by the Arabic literal for Istijaba
  (`shared/prayer.ts:325`).
- A row's place on its list is `PRAYERS_ENGLISH.indexOf(prayer.english)` or the Extras equivalent
  (`shared/sequence.ts:23-27`).
- A row's identity inside a sequence is `${prayer.english}_${prayer.belongsToDate}`
  (`stores/schedule.ts:307`), used for the write-skip signature (`stores/schedule.ts:323-326`) and
  for the merge (`stores/schedule.ts:425-432`).
- The next occurrence of a row is found by `prayer.english !== row.english`
  (`shared/sequence.ts:194`).
- The canonical Extras order ranks by `EXTRAS_ENGLISH.indexOf(english)`
  (`shared/prayer.ts:573-578`).

### Runtime row shape

`Prayer` is `ReadablePrayer | UnreadablePrayer` (`shared/types.ts:266-307`). Every row carries
`type`, `english`, `arabic` and `belongsToDate`. A readable row adds `datetime: Date` and
`time: string`. An unreadable row has both as `null`. Both names are baked into the row when it
is built (`shared/prayer.ts:386-420`), so every sequence in memory holds an English and an Arabic
string per row.

`CountdownStore` is `{ timeLeft: number | null, name: string }` (`shared/types.ts:329-336`). The
name written is the row's English name (`stores/countdown.ts:413-414`,
`stores/countdown.ts:430`), or `COUNTDOWN_WAITING_NAME` (`stores/countdown.ts:423`). The atoms
start as `{ timeLeft: 10, name: 'Fajr' }` (`stores/countdown.ts:45`).

### Mock data

- `mocks/simple.ts` builds 13 days around the moment of download: two days back, today, ten days
  ahead (`mocks/simple.ts:44-256`). `city` is `'london'` and `times` is a getter that reseeds
  today on every read (`mocks/simple.ts:258-265`). Today's six times are built with
  `formatPrayerTime` from the download instant (`mocks/simple.ts:34-35`, `mocks/simple.ts:90-97`).
- `mocks/full.ts` is one object, `MOCK_DATA_FULL` (`mocks/full.ts:3`). Lines 1 to 120 were read.
  The rest was shape-checked by a throwaway script, not read line by line: 366 days,
  `2024-01-01` to `2024-12-31`, every row with the same 13 keys as `IApiSingleTime`, every time
  matching the 24 hour pattern, every `date` equal to its map key, `city` `'london'`.
- `MOCK_DATA_FULL` is imported only by tests (`shared/__tests__/nightTimes.test.ts:16`,
  `shared/__tests__/widgetSimulation.test.ts:39`).

## 2. MMKV key census for these modules

### The wrapper

- One app store, created at module scope: `createMMKV({ id: DATABASE_ID })`
  (`stores/database.ts:35`).
- The instance id is `athan-storage` for `prod` and `preview` builds and `athan-storage-dev` for
  every other build (`stores/database.ts:32`). The predicate matches the one that serves mock data
  (`api/client.ts:124`). Pinned by `stores/__tests__/database.test.ts:632-656`.
- A second, separate MMKV instance exists for the perf monitor (`shared/perf.ts:195`). It was
  located by search and not read.
- JSON helpers: `getItem` parses (`stores/database.ts:42-48`), `setItem` stringifies
  (`stores/database.ts:55-58`), `removeItem` (`stores/database.ts:64-67`), `getAllWithPrefix`
  (`stores/database.ts:74-83`), `clearPrefix` (`stores/database.ts:89-99`), `clearAllExcept`
  (`stores/database.ts:106-129`). Prefix matching is `key.startsWith(prefix)`.
- `getItem` returns `null` for a missing key and for an empty string (`stores/database.ts:43-44`).
  A number round-trips as a number (`stores/__tests__/database.test.ts:77-85`).

### Persisted atom helpers

All three wrap jotai `atomWithStorage` with `{ getOnInit: true }` (`stores/storage.ts:22`,
`stores/__tests__/storage.test.ts:286-298`).

| Helper | Site | Encoding on disk | Read fallback |
| --- | --- | --- | --- |
| `atomWithStorageNumber` | `stores/storage.ts:54-77` | Decimal string, `value.toString()` | Default when missing, empty, whitespace or not finite (`stores/storage.ts:61-70`) |
| `atomWithStorageBoolean` | `stores/storage.ts:85-98` | Native MMKV boolean | Default when missing |
| `atomWithStorageString` | `stores/storage.ts:106-119` | Raw string, no JSON quotes | Default when missing; an empty string is kept (`stores/__tests__/storage.test.ts:260-266`) |

- Two encodings therefore coexist. A string written with `setItem` is stored with JSON quotes. A
  string written through `atomWithStorageString` is stored bare.
- The rule stated in the file: never write MMKV behind one of these atoms, because the atom reads
  storage once at creation and a later raw write is invisible to `store.get`
  (`stores/storage.ts:7-12`). `resetStoredAtom` is the sanctioned way to clear one from outside
  React (`stores/storage.ts:40-46`).

### Keys read or written by the swept modules

| Key or pattern | Value shape | Writer | Reader | Embeds |
| --- | --- | --- | --- | --- |
| `prayer_${date}` | JSON `ISingleApiResponseTransformed` | `stores/database.ts:138-140`, called from `stores/sync.ts:126`, `stores/sync.ts:373`, `stores/sync.ts:402` | `stores/database.ts:152-160`, `stores/database.ts:167-170`; key scan `stores/sync.ts:72`; prefix read `stores/sync.ts:392`; prefix clear `stores/sync.ts:417` | A date in the key. Prayer names as field names in the value |
| `fetched_years` | JSON `{ [year]: true }` | `stores/database.ts:176-180`, called from `stores/sync.ts:386`, `stores/sync.ts:403`, `stores/sync.ts:419` | `stores/sync.ts:54`, `stores/sync.ts:68`, `stores/sync.ts:294`, `stores/sync.ts:394` | Years in the value |
| `scheduled_notifications_${scheduleType}_${prayerIndex}_${notification.id}` | JSON `ScheduledNotification` | `stores/database.ts:188-198` | `stores/database.ts:219-227` (prefix by schedule), `stores/database.ts:235-241` (prefix by schedule and index); removed at `stores/database.ts:211-212` | Schedule type, prayer index, and the OS identifier |
| `scheduled_reminders_${scheduleType}_${prayerIndex}_${notification.id}` | JSON `ScheduledNotification` | `stores/database.ts:253-263` | `stores/database.ts:271-277`, `stores/database.ts:284-292`; removed at `stores/database.ts:303-304` | Schedule type, prayer index, and the OS identifier |
| `app_installed_version` | JSON string | `stores/version.ts:44` | `stores/version.ts:31`, reached from `stores/bootstrap.ts:65` | Nothing |
| `cache_schema_version` | JSON number, currently `1` (`stores/version.ts:135`) | `stores/version.ts:274` | `stores/version.ts:168`, reached from `stores/bootstrap.ts:65` | Nothing |
| `whats_new_shown_version` | JSON string | `stores/version.ts:71` | `stores/version.ts:57` | Nothing |
| `preference_last_notification_schedule_check` | Number atom, epoch ms, default `0` (`stores/notifications.ts:610`) | Reset from `stores/sync.ts:84`, `stores/version.ts:196`, `stores/notifications.ts:1790`; set at `stores/notifications.ts:1836`, `stores/notifications.ts:1893` | `stores/notifications.ts:1460` | Nothing |

Facts about the two alarm record families:

- `ScheduledNotification` is `{ id, date, time, englishName, arabicName, alertType }`
  (`shared/notifications.ts:17-24`). The English and the Arabic name are both written into every
  stored record.
- The `id` in the key is the OS notification identifier. At-time:
  `athan_${scheduleType}_${englishName.toLowerCase()}_${date}` (`device/notifications.ts:50`).
  Reminder: `reminder_${scheduleType}_${englishName.toLowerCase()}_${date}_${intervalMinutes}`
  (`device/notifications.ts:66`). Both builders were located by search. A fixture shows the
  resulting keys: `scheduled_notifications_standard_0_athan_standard_fajr_2026-09-15` and
  `scheduled_reminders_standard_0_reminder_standard_fajr_2026-09-15_10`
  (`stores/__tests__/syncFetchBeforeWipe.test.ts:98-99`).
- So one alarm record key holds the prayer twice: as its index in `PRAYERS_ENGLISH` or
  `EXTRAS_ENGLISH`, and as its lowercased English name inside the identifier.
- The per-prayer prefix is `scheduled_notifications_${scheduleType}_${prayerIndex}` with no
  trailing underscore (`stores/database.ts:236`, `stores/database.ts:272`). Indices run 0 to 5, so
  no index is a prefix of another today.
- Records are removed one identifier at a time, never by prefix, so the record of a cancel the
  phone refused survives (`stores/database.ts:200-212`).

### The two wipes and what they keep

| Wipe | Site | Keep prefixes |
| --- | --- | --- |
| Full refresh swap | `stores/sync.ts:357-371` | `app_installed_version`, `whats_new_shown_version`, `cache_schema_version`, `preference_`, `prayer_max_english_width_`, `scheduled_notifications_`, `scheduled_reminders_` |
| Upgrade with a changed cache shape, and the error screen's Refresh | `stores/version.ts:144-156`, `stores/version.ts:208-223`, `components/ui/Error.tsx:28` | `app_installed_version`, `whats_new_shown_version`, `cache_schema_version`, `preference_`, `prayer_max_english_width_` |

- Everything not on a keep list is deleted (`stores/database.ts:106-129`). A key without the
  `preference_` prefix does not survive either wipe unless it is added to both lists.
- The upgrade wipe deletes the alarm records. The refresh swap keeps them. A test pins the two
  lists against each other (`stores/__tests__/database.test.ts:558-578`).
- `clearAllExcept` may be called only from `stores/sync.ts` and `stores/version.ts`
  (`stores/__tests__/database.test.ts:500-525`).
- The comment that justifies keeping `prayer_max_english_width_` says names and fonts never
  change (`stores/sync.ts:364-365`, `stores/version.ts:153-155`).
- The upgrade wipe runs only when the version increased and `cache_schema_version` differs from
  `CACHE_SCHEMA_VERSION` or is missing (`stores/version.ts:166-180`, `stores/version.ts:258-260`).
  An ordinary version bump keeps the cache and reopens the notification gate
  (`stores/version.ts:261-263`).

### Keys defined outside the swept modules

Located by search across `app`, `components`, `device`, `hooks`, `shared`, `stores`, `widgets` and
`api`. The defining files were not read in full in this sweep.

| Key or pattern | Helper | Site | Embeds |
| --- | --- | --- | --- |
| `preference_alert_${type}_${prayerName.toLowerCase()}` | Number | `stores/notifications.ts:207` | Schedule type and lowercased English name |
| `preference_reminder_alert_${type}_${prayerName.toLowerCase()}${suffix}` | Number | `stores/notifications.ts:257-259` | Same, plus a slot suffix |
| `preference_reminder_interval_${type}_${prayerName.toLowerCase()}${suffix}` | Number | `stores/notifications.ts:277-279` | Same, plus a slot suffix |
| `preference_notification_repair_${type}_${prayerName.toLowerCase()}` | Number | `stores/notifications.ts:335-337` | Schedule type and lowercased English name |
| Legacy `preference_(alert\|reminder_alert\|reminder_interval)_(standard\|extra)_<index>` | Raw string | Pattern `stores/notifications.ts:493`; migrated at `stores/notifications.ts:537-549`; leftovers removed at `stores/notifications.ts:589-590` | Schedule type and prayer index |
| `preference_sound` | Number | `stores/notifications.ts:604` | Nothing |
| `popup_update_last_check` | Number | `stores/ui.ts:88` | Nothing. On neither keep list |
| `prayer_max_english_width_standard` | Number | `stores/ui.ts:104` | Schedule type |
| `prayer_max_english_width_extra` | Number | `stores/ui.ts:107` | Schedule type |
| `preference_countdownbar_shown` | Boolean | `stores/ui.ts:117` | Nothing |
| `preference_countdownbar_color` | String | `stores/ui.ts:120` | Nothing |
| `preference_hijri_date` | Boolean | `stores/ui.ts:123` | Nothing |
| `preference_show_seconds` | Boolean | `stores/ui.ts:126` | Nothing |
| `preference_show_time_passed` | Boolean | `stores/ui.ts:129` | Nothing |
| `preference_show_arabic_names` | Boolean | `stores/ui.ts:132` | Nothing |
| `preference_decorations_enabled` | Boolean | `stores/ui.ts:135` | Nothing |

The reminder slot suffix is empty for slot 0 and `_2` for slot 1 (`stores/notifications.ts:241`).

No other direct `Database.*` or `database.*` call was found outside `stores/database.ts`,
`stores/storage.ts`, `stores/sync.ts`, `stores/version.ts` and `stores/notifications.ts`.

## 3. Date and time model

### Model

- `PRAYER_TIMEZONE` is `'Europe/London'` (`shared/constants.ts:258`). Its only reader in source is
  `shared/time.ts` (`shared/time.ts:26`, `shared/time.ts:247`, `shared/time.ts:320`,
  `shared/time.ts:331`).
- A calendar day travels as a `YYYY-MM-DD` string and a moment as a `Date`. Device-local getters
  are never read for a prayer day (`shared/time.ts:9-17`).
- The prayer timezone's clock is read with one module-scope `Intl.DateTimeFormat('en-US', ...)`
  using `hourCycle: 'h23'` and numeric two-digit fields, through `formatToParts`
  (`shared/time.ts:25-34`, `shared/time.ts:51-58`). Offsets are cached per UTC day and, on a
  clock-change day, per quarter hour (`shared/time.ts:60-94`).
- `createPrayerDatetime(date, time)` turns a London wall-clock reading into a UTC instant. A
  repeated reading takes the later occurrence and a skipped one the new offset
  (`shared/time.ts:151-165`, pinned at `shared/__tests__/time.test.ts:778-812`).
- `formatDateShort(instant)` gives the London calendar day (`shared/time.ts:265-268`).
  `getTodayDateString` is that for now (`shared/time.ts:210`).
- Day arithmetic is done on the string at UTC noon (`shared/time.ts:190-194`).
- `getDayAnchor(date)` is 12:00 London on that day (`shared/time.ts:218`).
- `isFriday` reads the weekday from the London date with `getUTCDay() === 5`
  (`shared/time.ts:290-296`).
- A list day is not the calendar day. `belongsToDate` is computed per row
  (`shared/prayer.ts:234-264`), and the day on screen is the earliest list day with a readable row
  still to come, with holds until 00:00 London (`shared/sequence.ts:94-105`).
- Countdown targets are UTC instants, so a difference needs no timezone
  (`shared/time.ts:463-466`).

### Formatting sites

| Site | What is formatted | API and exact format | Locale |
| --- | --- | --- | --- |
| `shared/time.ts:175-178` `formatPrayerTime` | A prayer time, shown and stored | Hand-built `` `${pad2(hour)}:${pad2(minute)}` ``, 24 hour | None. Digits come from `String(number)` (`shared/time.ts:23`) |
| `shared/time.ts:265-268` `formatDateShort` | Storage keys and day identity | Hand-built `YYYY-MM-DD` | None |
| `shared/time.ts:229-233` `formatDateLong` | The Gregorian date line | date-fns `format(date, 'EEE, d MMM yyyy')` | date-fns default, no `locale` option passed. Output pinned as `Sun, 18 Jan 2026` (`shared/__tests__/time.test.ts:491-504`) |
| `shared/time.ts:241-254` `formatHijriDateLong` | The Hijri date line | `Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone })`, then a trailing ` AH` is stripped by `/ AH$/` | `en-US`, hard-coded. Output shape pinned by `/\w+\s+\d+,\s+\d{4}$/` (`shared/__tests__/time.test.ts:709-714`). Falls back to `formatDateLong` on a throw |
| `shared/time.ts:310-341` `isRamadan` | Not shown. A season test | Two `Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', ...)` formatters, `month: 'numeric'` and `day: 'numeric'` | `en-US`, hard-coded. The result is compared to the strings `'9'` and `'8'` and parsed with `parseInt` (`shared/time.ts:322-333`) |
| `shared/time.ts:528-549` `formatTime` | The countdown | date-fns `intervalToDuration`, then hand-built `` `${totalHours}h` ``, `` `${minutes}m` ``, `` `${secs}s` `` joined by a space | None. Unit letters are literals |
| `shared/time.ts:564-574` `formatTimeAgo` | The elapsed part of the ago badge | Hand-built `now`, `Xm`, `Xh`, `Xh Ym` | None. Literals |
| `components/day/shownDate.ts:32-35` `formatShownDate` | Chooses between the two date lines | Calls `formatHijriDateLong` or `formatDateLong` | As above |
| `device/tasks.ts:27`, `device/tasks.ts:43`, `device/tasks.ts:55`, `stores/notifications.ts:1479-1480` | Log fields only | date-fns `formatISO` | Not user-visible |

- 24 hour is the only clock form. Nothing in the swept modules produces a 12 hour time or an
  AM or PM marker. The request asks the provider for 24 hour times (`api/client.ts:15-21`).
- The Hijri date exists and is a user preference: `preference_hijri_date` (`stores/ui.ts:123`),
  read in `components/day/Day.tsx:29` and mirrored to widgets (`stores/widget.ts:84-90`).
- Month names and weekday names are produced in exactly two places: `formatDateLong` (date-fns,
  abbreviated, English by default) and `formatHijriDateLong` (the engine's ICU data for `en-US`).
  Neither takes a language argument today.
- Search of non-test source in `app`, `components`, `device`, `hooks`, `shared`, `stores`,
  `widgets`, `api` and `mocks` found no `toLocale*` call, no `date-fns/locale` import, no
  `expo-localization`, no `I18nManager`, no `getLocales`, no `isRTL` and no `writingDirection`.
  Every `Intl` use is in `shared/time.ts`.
- `package.json` lists `date-fns` 4.4.0 and `date-fns-tz` 3.2.0 (`package.json:38-39`). No
  localisation or i18n package is listed. `date-fns-tz` is imported only by a test in these
  directories (`shared/__tests__/time.test.ts:1`).
- `yarn test:tz` runs the suite under four device timezones (`package.json:20`).

## 4. London-only assumptions

| Site | Assumption |
| --- | --- |
| `api/config.ts:5` | One endpoint, on the London provider's host |
| `api/client.ts:19-24` | The request carries no location, only a year or a date |
| `api/client.ts:199` | A single-day body is wrapped with the literal city `'london'` |
| `api/client.ts:110`, `shared/prayer.ts:51` | `city` is copied through and never read or stored |
| `shared/types.ts:66-71` | The answer type has one `city` string and one `times` map |
| `shared/constants.ts:258` | One timezone constant for the whole app |
| `shared/time.ts:25-34` | The clock formatter is built once at module scope with that timezone |
| `shared/time.ts:67-68` | The offset caches are module-scope maps with no timezone in their keys |
| `shared/time.ts:60-65` | The offset cache assumes clocks change at most once a day and on a quarter hour |
| `stores/database.ts:138`, `stores/database.ts:153` | The day key `prayer_<date>` has no place in it |
| `stores/database.ts:177` | `fetched_years` is one global map of years |
| `stores/sync.ts:53-57`, `stores/sync.ts:430-508` | Data is fetched by calendar year, with a December prefetch of the next year |
| `stores/sync.ts:177-219`, `api/client.ts:178-206` | On 1 January the endpoint serves only the new year, so 31 December is asked for by date |
| `stores/sync.ts:66-73`, `stores/sync.ts:293-300`, `stores/sync.ts:317-324` | Whether to fetch is decided from the year marker and the London date |
| `shared/prayer.ts:110-118` | A Magrib after midnight is handled but documented as unreachable for the city shipping today |
| `shared/sequence.ts:39-43` | List order equals time order for London's rows. The comment says the two can part at polar extremes |
| `shared/constants.ts:225-230` | The Extras offsets are fixed minute counts |
| `shared/constants.ts:249` | The small-hours cutoff is fixed at hour 6 |
| `components/day/Day.tsx:48` | The location line is the literal `London, UK` |
| `mocks/simple.ts:259`, `mocks/full.ts:4` | Mock data is London only |
| `widgets/PrayerWidget.tsx:318`, `widgets/PrayerWidget.tsx:524` | Widget copy `Prayer times for London` (located by search, file not read) |
| `device/updates.ts:17` | The App Store link holds the `gb` storefront and a London slug (located by search, file not read) |
| `device/tls13.ts:4` | A TLS note names the provider's host (located by search, file not read) |

Comments in `mocks/simple.ts:25-26` and `shared/constants.ts:255-257` call the worldwide release
v2.0. The brief for this work calls it 3.0.0.

## 5. Sync and refresh lifecycle

### Cold launch, in order

| # | Step | Site | Reschedules alarms | Pushes widget props |
| --- | --- | --- | --- | --- |
| 1 | The background task is defined at module scope | `app/_layout.tsx:3`, `device/tasks.ts:23` | No | No |
| 2 | `stores/bootstrap` runs at import, before React renders | `app/_layout.tsx:10`, `stores/bootstrap.ts:81` | No | No |
| 2a | It refuses to hydrate when a version increase and a changed cache shape are both pending | `stores/bootstrap.ts:65` | No | No |
| 2b | It hydrates when any of today to today+2 is stored: `setSequence` for both schedules, then `startCountdowns` | `stores/bootstrap.ts:39-51`, `stores/bootstrap.ts:70` | No | No |
| 3 | `setTimeout(triggerSyncLoadable, 0)` starts the one launch sync with `deferWidgetRefresh: true` | `app/_layout.tsx:50`, `stores/sync.ts:47`, `stores/sync.ts:140-144` | No | See 3d |
| 3a | `handleAppUpgrade`: optional wipe, gate reopen, version stamp, schema stamp, What's New seed, then the index-key preference migration | `stores/sync.ts:523`, `stores/version.ts:230-292` | Reopens the gate only | No |
| 3b | `needsDataUpdate`, then `updatePrayerData` when needed | `stores/sync.ts:525-527`, `stores/sync.ts:274-286`, `stores/sync.ts:430-508` | Reopens the gate when a day from yesterday to today+2 changed (`stores/sync.ts:125-131`) | No |
| 3c | `initializeAppState`: `setSequence` for both, `startCountdowns`, and on 1 January an unawaited request for 31 December | `stores/sync.ts:234-242` | No | No |
| 3d | Widget push, deferred by a frame and then a macrotask | `stores/sync.ts:250-257` | No | Yes |
| 4 | `app/index.tsx` mount effect registers the AppState listener, which also starts the widget settings subscription | `app/index.tsx:95`, `device/listeners.ts:22-29` | No | No |
| 5 | 1500 ms later: on Android the gate is reopened, then `initializeNotifications` | `app/index.tsx:102-111`, `stores/notifications.ts:1787-1792` | See 5a | See 5a |
| 5a | `initializeNotifications`: Android channels, permission check, `refreshNotifications`, background task registration | `shared/notifications.ts:562-593` | Yes, when the gate is open | Yes, deferred (`stores/notifications.ts:1646-1658`) |
| 6 | When the sync loadable reaches `hasData`, `refreshNotifications` runs again | `app/index.tsx:141-145` | Yes, when the gate is open or a prayer is marked for repair | Yes, deferred |

- `refreshNotifications` skips when fewer than `NOTIFICATION_REFRESH_HOURS` (2,
  `shared/constants.ts:143`) have passed, unless a prayer carries a repair mark
  (`stores/notifications.ts:1794-1810`, `stores/notifications.ts:1459-1487`).
- A full reschedule arms both schedules, sweeps strays, then pushes widgets
  (`stores/notifications.ts:1622-1663`). It bails with nothing armed when no day the windows reach
  is stored (`stores/notifications.ts:1604-1610`).
- The gate is stamped only after a real reschedule during which no download changed the armed
  days (`stores/notifications.ts:1825-1836`).
- The launch sync runs once per process however often the loadable is read
  (`stores/__tests__/syncLoadable.test.ts:132-144`).
- A failed download still shows the lists when any of today to today+2 is stored
  (`stores/sync.ts:528-533`, `stores/sync.ts:134-137`).

### Return to the foreground

| # | Step | Site | Reschedules alarms | Pushes widget props |
| --- | --- | --- | --- | --- |
| 1 | Any return to `active`: overlay boundary check, `resyncCountdowns`, `bumpResync` | `device/listeners.ts:35-43`, `stores/countdown.ts:457-466` | No | No |
| 2 | Return from `background` only: `initializeNotifications`, not awaited | `device/listeners.ts:50` | Yes, when the gate is open | Yes, deferred |
| 3 | `sync()` with no options, so the widget push is awaited | `device/listeners.ts:61`, `stores/sync.ts:258-260` | Reopens the gate when armed days changed | Yes |
| 4 | `refreshNotifications` again, only when `getArmedDayChanges()` moved during that sync | `device/listeners.ts:57-66`, `stores/sync.ts:90-98` | Yes | Yes, deferred |

Launch does not take this path. The listener's comment says so (`device/listeners.ts:59-60`).

### Day rollover and prayer boundaries

- There is no midnight job in these modules.
- Each schedule has one wall-clock ticker (`stores/countdown.ts:236-254`). Every second it
  compares now with `getNextBoundary(type)` (`stores/countdown.ts:315-334`).
- The boundary is the next readable prayer, or 00:00 London ending a list day that is held on
  screen (`stores/schedule.ts:232-244`, `shared/sequence.ts:115-134`).
- When the boundary passes, the ticker calls `refreshSequence` and restarts
  (`stores/countdown.ts:321-331`, `stores/schedule.ts:445-502`).
- The list day normally changes after its last readable row, not at 00:00
  (`shared/sequence.ts:94-105`).
- The ticker never reschedules alarms and never pushes widget props.
- A new calendar day reaches storage at the next sync: today missing triggers a download unless
  it is a gap inside a marked year (`stores/sync.ts:274-286`, `stores/sync.ts:66-73`).
- Year rollover: December prefetches next year (`stores/sync.ts:53-57`,
  `stores/sync.ts:440-490`). On 1 January, 31 December is asked for alone, at most one request in
  flight per 30 seconds (`stores/sync.ts:162-219`).
- Overlapping downloads are ordered by when they began. An older one never replaces a newer one
  (`stores/sync.ts:302-311`, `stores/sync.ts:337-388`).

### Background task

| # | Step | Site | Reschedules alarms | Pushes widget props |
| --- | --- | --- | --- | --- |
| 1 | The OS runs `NOTIFICATION_REFRESH_TASK` | `device/tasks.ts:23`, `shared/constants.ts:153` | No | No |
| 2 | `sync()` is awaited. A failure is logged and the task carries on from the cache | `stores/notifications.ts:1867-1871` | Reopens the gate when armed days changed | Yes, awaited |
| 3 | Under the scheduling lock, a full reschedule with no deferral | `stores/notifications.ts:1873-1878` | Yes, always. The 2 hour gate is not consulted | Yes, awaited (`stores/notifications.ts:1659-1663`) |
| 4 | The gate is stamped unless the reschedule bailed or days changed while it ran | `stores/notifications.ts:1882-1893` | No | No |

The task is registered with a minimum interval of 180 minutes in production
(`shared/constants.ts:168`, `shared/constants.ts:210-214`) and no network requirement
(`stores/notifications.ts:1943-1946`).

### Other triggers seen while tracing

- A change to `preference_hijri_date` re-pushes the widgets after a 1000 ms debounce. It is the
  only setting subscribed (`stores/widget.ts:124-140`, `stores/widget.ts:84-90`).
- `refreshPrayerWidgets` returns early when the platform's widget flag is off
  (`stores/widget.ts:237-256`, `shared/flags.ts:44`, `shared/flags.ts:58`).
- The error screen's Refresh calls `clearUpgradeCache` (`components/ui/Error.tsx:28`, located by
  search).
- `rescheduleAllNotifications` and `commitSoundSelection` reschedule everything under the lock
  with a deferred widget push (`stores/notifications.ts:1686-1741`). Their callers were not traced
  in this sweep.

## 6. English strings produced in these modules

User-visible, or read aloud by a screen reader:

| Site | String | How it is built |
| --- | --- | --- |
| `components/day/Day.tsx:48` | `London, UK` | Literal |
| `components/day/Day.tsx:49` | For example `Sun, 18 Jan 2026` | `formatDateLong`: date-fns `'EEE, d MMM yyyy'` (`shared/time.ts:232`) |
| `components/day/Day.tsx:49` | For example `Rajab 28, 1447` | `formatHijriDateLong`: Intl `en-US` Hijri, ` AH` stripped (`shared/time.ts:243-250`) |
| `components/countdown/Countdown.tsx:47` | The prayer's English name, or `...` | `CountdownStore.name`, written at `stores/countdown.ts:413-414`, `stores/countdown.ts:423`, `stores/countdown.ts:430` |
| `components/countdown/Countdown.tsx:46` | `No prayer time to count down to` | Literal `accessibilityLabel`, used when the name equals `COUNTDOWN_WAITING_NAME` |
| `components/countdown/Countdown.tsx:49` | For example `1h 1m 5s`, `9m 59s`, `45s`, `0s` | `formatTime` (`shared/time.ts:528-549`) with literal unit letters `h`, `m`, `s` (`shared/time.ts:529`, `shared/time.ts:540`, `shared/time.ts:545`), selected at `stores/countdown.ts:83-89` |
| `components/countdown/Countdown.tsx:49` | `--:--` | `UNAVAILABLE_TIME` (`shared/constants.ts:268`), chosen at `stores/countdown.ts:86` |
| `components/countdown/Bar.tsx:166` | `Prayer countdown: N percent remaining` | Template literal `accessibilityLabel` with `Math.round(progress)` |
| `hooks/usePrayerAgo.ts:36` | `Fajr now` | `` `${prevPrayer.english} now` `` when under 60 seconds |
| `hooks/usePrayerAgo.ts:36` | `Asr 2h 30m ago` | `` `${prevPrayer.english} ${timeAgo} ago` ``, with `timeAgo` from `formatTimeAgo` |
| `shared/time.ts:565` | `now` | Literal returned by `formatTimeAgo` under 60 seconds. The hook does not show this branch, because it builds its own `now` string first (`hooks/usePrayerAgo.ts:36`) |
| `shared/time.ts:568`, `shared/time.ts:572-573` | `2m`, `2h`, `1h 30m` | Hand-built with literal `m` and `h` |
| `stores/countdown.ts:45` | `Fajr` | Initial countdown name before the first write |
| `app/index.tsx:211` | `Loading prayer times` | Literal `accessibilityLabel` on the launch spinner (file read for the lifecycle, outside the assigned list) |

Facts about these strings:

- The ago badge fixes English word order: name, then elapsed time, then `ago`
  (`hooks/usePrayerAgo.ts:36`).
- The countdown name is compared by value to `COUNTDOWN_WAITING_NAME` to pick the accessibility
  label (`components/countdown/Countdown.tsx:46`).
- `formatTime` has every JSDoc example pinned by a test (`shared/time.ts:516-526`,
  `shared/__tests__/time.test.ts:114-123`). `formatTimeAgo` outputs are pinned at
  `shared/__tests__/time.test.ts:139-162`.
- The row's own name and time cells are not produced in these modules. `usePrayer` passes
  `english`, `arabic` and `time` through from the sequence row (`hooks/usePrayer.ts:108-119`) and
  returns `ui.maxEnglishWidth` from the two persisted width atoms (`hooks/usePrayer.ts:81`,
  `stores/ui.ts:104-107`).

Not user-visible in these modules:

- Thrown error messages: `HTTP error! status: N` (`api/client.ts:30`),
  `Incomplete data received` (`api/client.ts:42`, `api/client.ts:80`),
  `Malformed prayer times: nothing in the payload is readable` (`api/client.ts:108`),
  `Mock data has no day <date>` (`api/client.ts:170`),
  `Day response is for <x>, not <date>` (`api/client.ts:197`). They reach the logger and the sync
  loadable's `hasError` state. `app/index.tsx:216` and `app/_layout.tsx:41-44` render
  `ErrorScreen` with no message prop.
- Every `SYNC:`, `API:`, `SEQUENCE:`, `SCHEDULE:`, `STORAGE:`, `MMKV` and `VERSION:` string is a
  log line. Some carry the English prayer name as a field (`stores/schedule.ts:89`).

## 7. Files read

Read in full with line counts:

| File | Lines |
| --- | --- |
| `shared/time.ts` | 574 |
| `shared/sequence.ts` | 199 |
| `shared/config.ts` | 16 |
| `shared/flags.ts` | 61 |
| `shared/launchGate.ts` | 48 |
| `shared/versionUtils.ts` | 50 |
| `stores/sync.ts` | 548 |
| `stores/schedule.ts` | 566 |
| `stores/countdown.ts` | 475 |
| `stores/database.ts` | 304 |
| `stores/storage.ts` | 119 |
| `stores/bootstrap.ts` | 81 |
| `api/client.ts` | 206 |
| `api/config.ts` | 7 |
| `mocks/simple.ts` | 265 |
| `mocks/__tests__/simple.test.ts` | 60 |
| `hooks/usePrayer.ts` | 120 |
| `hooks/usePrayerAgo.ts` | 90 |
| `hooks/usePrayerSequence.ts` | 118 |
| `hooks/useSchedule.ts` | 109 |
| `hooks/useCountdown.ts` | 55 |
| `hooks/useCountdownBar.ts` | 66 |
| `components/day/Day.tsx` | 78 |
| `components/day/shownDate.ts` | 35 |
| `components/day/index.ts` | 1 |
| `components/countdown/Bar.tsx` | 230 |
| `components/countdown/Countdown.tsx` | 84 |
| `components/countdown/tipGeometry.ts` | 37 |
| `components/countdown/index.ts` | 2 |
| `stores/__tests__/database.test.ts` | 657 |
| `stores/__tests__/storage.test.ts` | 298 |
| `shared/__tests__/time.test.ts` | 946 |
| `stores/__tests__/sync.test.ts` | 1503 |
| `stores/__tests__/syncFetchBeforeWipe.test.ts` | 1322 |
| `stores/__tests__/syncLateDecember31.test.ts` | 140 |
| `stores/__tests__/syncLoadable.test.ts` | 240 |
| `stores/__tests__/syncUnreadableDay.test.ts` | 329 |

Read in full because the sections above cite them, although they were outside the assigned list:

| File | Lines |
| --- | --- |
| `shared/types.ts` | 342 |
| `shared/prayer.ts` | 579 |
| `stores/version.ts` | 292 |
| `app/_layout.tsx` | 97 |
| `app/index.tsx` | 250 |
| `device/listeners.ts` | 75 |
| `device/tasks.ts` | 62 |

Read in part, and disclosed as partial:

| File | Lines read | Of |
| --- | --- | --- |
| `mocks/full.ts` | 1-120, the rest shape-checked by script | 5497 |
| `shared/constants.ts` | 1-280 | 1012 |
| `stores/notifications.ts` | 1425-1504 and 1600-1960 | 1960 |
| `shared/notifications.ts` | 548-593 | 593 |
| `stores/widget.ts` | 76-270 | 389 |
| `stores/ui.ts` | 80-139 | 237 |

Located by search only, not read: `device/notifications.ts:50`, `device/notifications.ts:66`,
`shared/notifications.ts:17-24`, `stores/notifications.ts:207-337`,
`stores/notifications.ts:493-610`, `shared/perf.ts:195`, `components/ui/Error.tsx:28`,
`widgets/PrayerWidget.tsx:318`, `widgets/PrayerWidget.tsx:524`, `device/updates.ts:17`,
`device/tls13.ts:4`.

Not read: the two test files under `api/__tests__/`, and the tests under `components/day` and
`components/countdown`. They were outside the assigned list.
