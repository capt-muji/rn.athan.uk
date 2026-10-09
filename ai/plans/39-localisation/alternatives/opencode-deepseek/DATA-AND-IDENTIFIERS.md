# Data, storage keys and identifiers

The byte-level contracts the re-architecture must preserve, and the new keys it adds.
Every "frozen" row was read from the source; every "new" row is the design.

## 1. Storage namespace

MMKV id: `athan-storage` for prod and preview, `athan-storage-dev` otherwise
(`stores/database.ts:32`). Unchanged by this design.

## 2. Prayer-time records (unchanged shape)

| Key | Value shape | Source |
| --- | --- | --- |
| `prayer_YYYY-MM-DD` | `ISingleApiResponseTransformed` JSON: `date`, `fajr`, `sunrise`, `dhuhr`, `asr`, `magrib`, `isha`, `suhoor`, `duha`, `istijaba`, each `string \| null` | `stores/database.ts:136-160`, `shared/types.ts:108-122` |
| `fetched_years` | `{ [year: number]: true }` | `stores/database.ts:176-180` |
| `cache_schema_version` | `1` | `stores/version.ts:135-137` |
| `app_installed_version` | version string | `stores/version.ts:42-49` |
| `whats_new_shown_version` | version string | `stores/version.ts:69-76` |

`CACHE_SCHEMA_VERSION` does not move: the record shape is unchanged, so the upgrade
does not wipe (`stores/version.ts:258-263`).

## 3. Alert and reminder preferences (keys frozen)

Built by `stores/notifications.ts:203-208,241,253-261,273-281`:

| Key | Value | Source |
| --- | --- | --- |
| `preference_alert_{standard\|extra}_{id}` | `AlertType` integer as string (`0`, `1`, `2`) | `stores/notifications.ts:207` |
| `preference_reminder_alert_{standard\|extra}_{id}` | `AlertType` integer string, slot 0 | `stores/notifications.ts:241,258` |
| `preference_reminder_alert_{standard\|extra}_{id}_2` | `AlertType` integer string, slot 1 | `stores/notifications.ts:241,258` |
| `preference_reminder_interval_{standard\|extra}_{id}` | `ReminderInterval` integer string, slot 0 | `stores/notifications.ts:241,278` |
| `preference_reminder_interval_{standard\|extra}_{id}_2` | `ReminderInterval` integer string, slot 1 | `stores/notifications.ts:241,278` |
| `preference_notification_repair_{standard\|extra}_{id}` | generation integer string | `stores/notifications.ts:333-338` |

`{id}` is the `PrayerId`, whose value is exactly today's lowercased English name,
including the space in `last third`. The slot suffix is empty for slot 0 and `_2` for
slot 1 (`stores/notifications.ts:241`). Every key in this table is byte-identical after
the change. The `AlertType` integers are a storage contract
(`shared/types.ts:188-202`) and do not move.

## 4. Notification records (keys frozen)

| Key | Value shape | Source |
| --- | --- | --- |
| `scheduled_notifications_{schedule}_{index}_{notificationId}` | `ScheduledNotification` JSON | `stores/database.ts:188-198` |
| `scheduled_reminders_{schedule}_{index}_{notificationId}` | `ScheduledNotification` JSON | `stores/database.ts:253-263` |

`ScheduledNotification` (`shared/notifications.ts:17-24`) is
`{ id, date, time, englishName, arabicName, alertType }`. The design keeps
`englishName` as the `PrayerId` string and **keeps the `arabicName` field on the
written record**, because records already on disk carry it and the reader does not
validate; removing it from new writes would be a needless record-shape change. The
field is documented as retained-only.

`{index}` is the canonical prayer index into `PRAYERS_ENGLISH`/`EXTRAS_ENGLISH`
(`stores/notifications.ts:663-666`). It is not localisation-sensitive (the arrays keep
their order), so no migration is needed. The record key stays index-based, exactly as
today, because changing it would make the post-reschedule sweep treat every live
record as orphaned and cancel armed alarms (`shared/notifications.ts:214-221`).

## 5. Language state (new keys)

| Key | Value | Initial | Source of truth |
| --- | --- | --- | --- |
| `preference_language` | a `LocaleCode` string | resolved device language | `stores/language.ts` |
| `preference_language_chosen` | `true`/`false` | `false` | `stores/language.ts` |
| `preference_language_applied` | a `LocaleCode` string | `''` | `stores/language.ts` |

All three start with `preference_`, which is a keep prefix in both wipes
(`stores/version.ts:151`, `stores/sync.ts:363`), so the language survives an app
upgrade and a cache swap.

## 6. OS notification identifiers (frozen)

| Kind | Shape | Source |
| --- | --- | --- |
| At-time | `athan_{schedule}_{id}_{YYYY-MM-DD}` | `device/notifications.ts:49-50` |
| Reminder | `reminder_{schedule}_{id}_{YYYY-MM-DD}_{interval}` | `device/notifications.ts:61-66` |

`{schedule}` is `'standard'` or `'extra'` (`shared/types.ts:148-153`). `{id}` is the
`PrayerId` string. Determinism is load-bearing: same identifier means idempotent
replace on both platforms (`device/notifications.ts:44-48`). The design changes no
byte. A golden test pins a representative set.

## 7. Android channel ids (generation changes)

Current ids:

| Kind | Shape | Source |
| --- | --- | --- |
| Athan | `athan_{n}_v4` | `shared/notifications.ts:380` |
| Reminder | `reminder_{slug}_{interval}_v3` | `shared/notifications.ts:387-390` |
| Extras | `extras_at_time_v3` | `shared/notifications.ts:396` |

New ids (2.0 generation plus locale):

| Kind | Shape |
| --- | --- |
| Athan | `athan_{n}_v5_{locale}` |
| Reminder | `reminder_{slug}_{interval}_v5_{locale}` |
| Extras | `extras_at_time_v5_{locale}` |

`{slug}` is `id` with spaces replaced by underscores (`shared/notifications.ts:147`).
The locale in the id is what makes a channel name change possible: Android freezes a
channel's name, sound, importance and audio attributes at creation
(`shared/notifications.ts:374-390,409-417`), so a switch must use a new id. Only ids
the app actually creates materialize, so at most one locale's channels exist at a time.

Deletion: `deleteSupersededAndroidChannels(locale)` removes every pre-`_v5` id
(the list already built at `shared/notifications.ts:526-544`) and every
`_v5_<other>` id for `other` in `LOCALE_CODES` minus `locale`. The current locale's
`_v5` channels are never deleted.

Note: channel **identity** is not an OS-notification identifier, so changing it does
not violate the byte-for-byte guarantee on armed notifications. The armed
notification's identifier is unchanged; only the channel it targets is re-pointed by
the reschedule. During the transient window an armed notification that still names a
deleted channel falls back to the Android fallback channel and still fires; the
reschedule then re-points it.

## 8. Audio files (frozen)

| Kind | Filename | Source |
| --- | --- | --- |
| Selected athan | `athan{n}.mp3`, n in 1..32 | `shared/notifications.ts:116`, `assets/audio/index.ts` |
| Extra at-time | `reminder.mp3` | `shared/notifications.ts:94` |
| Reminder | `reminder_{slug}_{interval}.mp3` | `shared/notifications.ts:161-162` |

The 99 files and their names are unchanged. The slug derivation is unchanged, because
it is a function of the `PrayerId` string only.

## 9. Widget prop shapes

`PrayerWidgetProps` and `PrayerWidgetAndroidProps` gain a `strings` object and keep
their other fields; the versions move 5 to 6 and 1 to 2
(`shared/widgetTypes.ts:14,21`). Full shape is `MODULE-CONTRACTS.md` §15. `strings` is
optional, so an entry written by the previous app version still renders (the layouts
fall back to English defaults, `MODULE-CONTRACTS.md` §18).

## 10. Migration summary

| Trigger | Action | Touches |
| --- | --- | --- |
| Upgrading from any 1.x | `migrateLocalisation` removes `preference_show_arabic_names` | nothing else |
| First run with no `preference_language` | resolve device locale, use as the atom's initial value | no write needed |
| First run with no `preference_language_applied` | launch reconcile applies the language to OS surfaces and stamps applied | channels, notifications, widgets |
| Every 1.x upgrade | existing forced reschedule (`stores/version.ts:261-263`) | notifications |
| Cache swap (`stores/sync.ts:337-371`) | existing; keeps `preference_` and `scheduled_*` | prayer records |

No migration rewrites an alert preference key, a notification record key, a
notification identifier or an audio filename. This is the core safety property: the
only user data that changes shape at 2.0.0 is the dead `preference_show_arabic_names`
key, which is removed.

## 11. Identifier and key goldens (test fixtures)

`shared/__tests__/identifiers.test.ts` pins two tables so no future refactor moves a
byte:

Identifiers (expected literals): `athan_standard_fajr_2026-10-09`,
`athan_extra_last third_2026-10-09`, `reminder_standard_isha_2026-10-09_5`,
`reminder_extra_last third_2026-10-09_30`.

Storage keys (expected literals): `preference_alert_standard_fajr`,
`preference_reminder_alert_extra_last third`,
`preference_reminder_interval_extra_last third_2`,
`scheduled_notifications_standard_2_athan_standard_dhuhr_2026-10-09`.

The space in `last third` is the point of the fixture: a future "tidy" to `lastthird`
or `last_third` fails here, before it reaches a store.
