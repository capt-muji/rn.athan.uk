# 05. The upgrade from 1.x

Evidence: `evidence/core.md` sections 2, 3 and 6, `evidence/schedule-time.md` section 2,
`evidence/test-infra.md` section 5. Citations are `path:line` at base commit `c3149dfc`.

## The promise

After a 1.x install updates to 2.0.0 and launches once:

1. every stored alert preference key and value is byte for byte what it was;
2. every OS notification identifier that was pending and is still due is pending under the same
   bytes;
3. no alarm was cancelled that the user's settings still ask for;
4. the timetable is on screen without a network.

## Why it holds: nothing is migrated

The design changes how identifiers are computed, never what they are. `shared/identifiers.ts`
(document 01) produces each 1.x string from a registry row whose `legacyKeyToken`, `audioSlug`,
`schedule` and `index` columns are the 1.x values typed out. `main` is at 1.29.291 and builds
the same strings with the same expressions as `uat` (`evidence/core.md` section 2), so "1.x" is
one format, not several.

| Stored thing | 1.x bytes | 2.0.0 action |
| --- | --- | --- |
| `preference_alert_*`, `preference_reminder_alert_*`, `preference_reminder_interval_*` (55 keys: 11 prayers by 5) | `stores/notifications.ts:207`, `:258`, `:278` | read and written under the same keys through the same atoms; never rewritten at upgrade |
| `preference_notification_repair_*` (11 keys) | `stores/notifications.ts:335` | the same |
| `preference_sound`, `preference_last_notification_schedule_check` | `stores/notifications.ts:604`, `:610` | untouched |
| Every other `preference_*` (`stores/ui.ts:117-135`) | | untouched; `preference_show_arabic_names` is no longer read |
| `prayer_max_english_width_standard`, `_extra` | `stores/ui.ts:104-107` | become the `en` name-width keys (document 04, section 5) |
| `prayer_<date>`, `fetched_years` | `stores/database.ts:138`, `:177` | untouched; the stored day's shape does not change |
| `scheduled_notifications_*`, `scheduled_reminders_*` | `stores/database.ts:193`, `:258` | same keys; old values stay readable (below) |
| `app_installed_version`, `cache_schema_version`, `whats_new_shown_version` | `stores/version.ts:44`, `:137`, `:116` | the existing upgrade code updates them |
| Pending OS requests | `device/notifications.ts:50`, `:66` | re-armed in place under the same identifier |
| Android channels | `shared/notifications.ts:380`, `:389`, `:396` | same ids; names synced (document 04, section 3) |
| The 99 audio files and `app.json` `sounds[]` | `app.json:84-184` | untouched |

`CACHE_SCHEMA_VERSION` stays `1` (`stores/version.ts:135`). That is a decision, not an
omission. Bumping it would wipe the timetable on upgrade and leave an offline user with dashes
until a network returns (`stores/version.ts:119-134`), which breaks promise 4. Nothing in this
design changes the shape of a cached value that a reader depends on:

- a stored day is unchanged;
- a 1.x notification record has `englishName` and `arabicName` where a 2.0.0 record has
  `prayerId`, and no reader uses any of the three (`evidence/core.md` section 3). The read type
  is narrowed to `{ id, date }` so the compiler keeps it that way (document 01).

## The first 2.0.0 launch, step by step

| # | Step | Site | Effect at 2.0.0 |
| --- | --- | --- | --- |
| 1 | The background task is defined | `app/_layout.tsx:3` | none |
| 2 | Bootstrap hydrates the lists from the cache | `stores/bootstrap.ts:53-81` | the version rose and the schema marker did not move, so it hydrates. Rows now carry ids; names are drawn from the catalog at render |
| 3 | `stores/language.ts` is evaluated on first import | document 03 | `preference_language` is absent, so the device locale is matched and written |
| 4 | First render | | the timetable, in the detected language, from the cache |
| 5 | `sync()` runs `handleAppUpgrade` | `stores/version.ts:230-292` | upgraded, schema unchanged: no wipe, `forceNotificationReschedule()` reopens the gate (`:261-263`), the version is stamped, the index-key migration finds nothing to do |
| 6 | 1500 ms after first content, notifications initialise | `app/index.tsx:102-111` | channels: legacy ids deleted as before, the default athan and extras channels ensured with catalog names |
| 7 | `refreshNotifications` | `stores/notifications.ts:1794-1843` | the gate is open twice over (step 5, and the language is unbaked). One full pass runs |
| 8 | The pass | document 03 | channel names synced; every row the plan covers re-armed under its 1.x identifier, replacing the pending request in place with a title in the detected language; stale rows cancelled as on any pass; `preference_language_baked` stamped |
| 9 | The widgets are pushed | `stores/notifications.ts:1635-1663` | the new layout strings are registered and new props follow at once |

What the pass at step 8 does to the phone's pending set is exactly what the forced pass of any
1.29.x update does today, with one difference: the title text. The schedule-first order
(`stores/notifications.ts:904-959`) means the phone never holds fewer alarms than it did before
the pass.

For a user whose language is detected as English, step 8 re-arms each alarm with a title that
is byte-identical to the one it replaces. Gate G10 (document 02) and test T-UP-2 (document 06)
pin that.

## What can interrupt it

| Interruption | Result | Recovery |
| --- | --- | --- |
| The app is killed between steps 3 and 7 | preferences untouched, alarms untouched and in English, language chosen | the next launch runs steps 5 to 8 again: the gate is still open because the baked value is still absent |
| The app is killed inside step 8 | some titles new, some old, all alarms present | the same |
| The phone refuses an arm in step 8 | that alarm keeps its old request and its record; the prayer is marked | the next refresh, which the unbaked language keeps full |
| No stored day in reach (a cache from a previous year) | the pass bails, nothing cancelled | the pass after the first sync (`app/index.tsx:141-145`) |
| The update is installed and the app is never opened | Android: the notifications library restores the alarms it holds from its own store after `MY_PACKAGE_REPLACED` (`stores/notifications.ts:1513-1517`); iOS keeps pending requests across an update. Titles stay English | the background task, when the system next runs it, or the first launch |
| The user updates while offline | no fetch is needed: the cache is kept | none needed |
| A widget is on screen during the update | it draws the 1.x layout string with 1.x props until step 9 (`evidence/widgets.md` section 4.6) | step 9. Between the new layout's registration and the new props, the layout's fallbacks draw 1.x props correctly (document 04, section 4) |

## Installs older than the name-keyed preferences

`migrateIndexKeyedAlertPreferences` stays and runs on every launch
(`stores/notifications.ts:525-598`, `stores/version.ts:289`). It is rewritten to resolve
destinations by `PrayerId`, with the pre-1.0.27 Extras order kept as a list of ids
(document 01). Its behaviour is pinned by the existing suite
(`stores/__tests__/notifications.test.ts:223-345`), which keeps its literal keys and values and
changes only the names it calls.

## Downgrade

A 2.0.0 install that is replaced by a 1.x build keeps working: 1.x ignores the two language
keys, reads the same preference keys, and reads only `id` and `date` from records, which 2.0.0
records have. A pending title stays in the 2.0.0 language until 1.x's next pass. Downgrade is
not a supported path and nothing is done for it beyond not breaking it.

## The 2.0.0 What's New entry

`WHATS_NEW` in `shared/whatsNew.ts` is restamped `2.0.0` and gains one item, whose two strings
are `whatsNew.language.title` and `whatsNew.language.body` (`02a-catalog-keys.md` section
2.14). Which of the older items stay beside it is a release-note choice for the owner; the
limit is four shown per release (`shared/whatsNew.ts:131-137`). Every item's strings are
catalog keys, so the modal an upgrading user sees is in the detected language.
