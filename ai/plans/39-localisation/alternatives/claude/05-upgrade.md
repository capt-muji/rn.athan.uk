# 05. The upgrade from 1.x

Evidence: `evidence/core.md` sections 2, 3 and 6, `evidence/schedule-time.md` section 2,
`evidence/test-infra.md` section 5, and the history of `uat` for the two format boundaries
named below. Citations are `path:line` at base commit `c3149dfc`.

## The promise

After a 1.x install updates to 2.0.0 and launches once:

1. every stored alert preference key and value is byte for byte what it was;
2. every OS notification identifier that was pending and is still due is pending under the same
   bytes;
3. no alarm was cancelled that the user's settings still ask for, and none is missed;
4. the timetable is on screen without a network.

## Which 1.x: three formats, and the promise holds in full for one

"1.x" is not one storage format. Two commits on `uat` changed what an install holds.

| Boundary | Commit | What changed |
| --- | --- | --- |
| 1.5.3 | `9681e866` | alarms get deterministic identifiers, and preference keys are keyed by name. Before it, an alarm was armed with no identifier of the app's own, so the operating system assigned one, and preference keys ended in a list index |
| 1.24.33 | `5da7be0a` | the cache shape marker `cache_schema_version` arrives. Before it, every version increase wiped the cache |

At the 1.5.2 release commit (`3c8220aa`) the arm call passes no identifier
(`device/notifications.ts:38-45` at that commit), the keys are `preference_alert_${type}_${prayerIndex}`
(`stores/notifications.ts:91` at that commit) and the stored day still holds a `midnight` field.

So an install is in one of three classes by the last version it ran:

| Class | Last version run | Promise 1 (preferences) | Promise 2 (identifiers) | Promise 3 (no alarm lost) | Promise 4 (offline timetable) |
| --- | --- | --- | --- | --- | --- |
| A | 1.24.33 or later | holds | holds | holds | holds |
| B | 1.5.3 to 1.24.32 | holds | holds | holds | fails: the missing marker wipes the cache (`stores/version.ts:166-173`, `:258-260`), which is correct, because rows of an unknown shape must not be read |
| C | 1.5.2 or earlier | values hold; the keys are renamed from index to name by the existing migration (`stores/notifications.ts:525-598`) | cannot hold: the pending requests carry identifiers the system chose | holds: the first pass arms the deterministic set before the sweep cancels the old one | fails, as class B |

Nothing in this design causes the class B and C rows. They are what any build from 1.24.33
onward does to such an install, 2.0.0 included, and no design can keep an identifier the app
never chose. This design neither adds to those rows nor removes anything from them: the
migration and the marker logic are kept as they are.

**What the owner must settle before the release.** The code does not record which version is
live in the two stores. `main` is at 1.29.291. If the live build is class A, the promise holds
as written. If it is older, there are two honest options: ship a 1.29.x release first, so that
installs cross both boundaries before 2.0.0 arrives, or accept the class B or C row for the
installs that jump straight to 2.0.0. The rest of this document describes class A, and then
says what differs for B and C.

## Why it holds for class A: nothing is migrated

The design changes how identifiers are computed, never what they are. `shared/identifiers.ts`
(document 01) produces each string from a registry row whose `legacyKeyToken`, `audioSlug`,
`schedule` and `index` columns are the 1.x values typed out. `main` at 1.29.291 builds the same
strings with the same expressions as `uat` (`evidence/core.md` section 2).

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
until a network returns (`stores/version.ts:119-134`), which breaks promise 4 for class A too.
Nothing in this design changes the shape of a cached value that a reader depends on:

- a stored day is unchanged;
- a 1.x notification record has `englishName` and `arabicName` where a 2.0.0 record has
  `prayerId`, and no reader uses any of the three (`evidence/core.md` section 3). The read type
  is narrowed to `{ id, date }` so the compiler keeps it that way (document 01).

## The first 2.0.0 launch for class A, step by step

| # | Step | Site | Effect at 2.0.0 |
| --- | --- | --- | --- |
| 1 | The background task is defined | `app/_layout.tsx:3` | none |
| 2 | Bootstrap hydrates the lists from the cache | `stores/bootstrap.ts:53-81` | the version rose and the schema marker did not move, so it hydrates. Rows now carry ids; names are drawn from the catalog at render |
| 3 | `stores/language.ts` is evaluated on first import | document 03 | `preference_language` is absent, so the device language is matched, and written when it matched |
| 4 | First render | | the timetable, in the resolved language, from the cache |
| 5 | `sync()` runs `handleAppUpgrade` | `stores/version.ts:230-292` | upgraded, schema unchanged: no wipe, `forceNotificationReschedule()` reopens the gate (`:261-263`), the version is stamped, the index-key migration finds nothing to do |
| 6 | `refreshNotifications` is called twice: when the launch sync has data, with no permission check (`app/index.tsx:141-145`), and from notification initialisation 1500 ms after first content, when permission is granted (`app/index.tsx:102-111`, `shared/notifications.ts:562-593`) | `stores/notifications.ts:1794-1843` | whichever comes first finds the gate open twice over (step 5, and the language is unbaked) and runs one full pass. The other finds it closed |
| 7 | The pass | document 03 | channel names synced; every row the plan covers re-armed under its 1.x identifier, replacing the pending request in place with a title in the resolved language; stale rows cancelled as on any pass; `preference_language_baked` stamped |
| 8 | The widgets are pushed | `stores/notifications.ts:1635-1663` | the new layout strings are registered and new props follow at once |

When the pass runs before notification initialisation has created its two default channels, the
arm path creates each channel it needs first, as it does today for a background pass
(`device/notifications.ts:99-113`).

What the pass at step 7 does to the phone's pending set is exactly what the forced pass of any
1.29.x update does today, with one difference: the title text. The schedule-first order
(`stores/notifications.ts:904-959`) means the phone never holds fewer alarms than it did before
the pass.

For a user whose language resolves to English, step 7 re-arms each alarm with a title that is
byte-identical to the one it replaces. Gate G10 (document 02) and test T-UP-2 (document 06)
pin that.

## What differs for classes B and C

| Step | Class B | Class C |
| --- | --- | --- |
| 2 | bootstrap refuses to hydrate: a wipe is coming (`stores/bootstrap.ts:65`). The spinner shows | the same |
| 5 | the wipe removes the timetable and the alarm records and keeps every `preference_` key, the two language keys included (`stores/version.ts:144-156`) | the same, and the migration then moves each index-keyed value to its name key (`stores/notifications.ts:525-598`) |
| 6, 7 before data | the pass bails on the empty cache: nothing armed, nothing cancelled (`stores/notifications.ts:1604-1610`). Every pending alarm stays as 1.x armed it, in English | the same |
| 6, 7 after the download | the pass re-arms every due row under the identifier it already has, in the resolved language, and recreates the records | the pass arms the deterministic set first. The sweep then finds the system-chosen identifiers beyond the records and cancels them (`stores/notifications.ts:1528-1534`). Between the two, both sets are pending |
| Offline | no timetable and no pass until a network returns. Alarms already armed still fire | the same |

In class C, a process that dies between the arm and the sweep leaves both sets pending until
the next pass, so one prayer can notify twice. On Android the second replaces the first in the
shade, because every notification is posted under one shared tag
(`plugins/replacePreviousNotification.js:29-45`). No alarm is missed in either class.

## What can interrupt it

| Interruption | Result | Recovery |
| --- | --- | --- |
| The app is killed between steps 3 and 6 | preferences untouched, alarms untouched and in English, language resolved | the next launch runs steps 5 to 7 again: the gate is still open because the baked value is still absent |
| The app is killed inside step 7 | some titles new, some old, all alarms present | the same |
| The phone refuses an arm in step 7 | that alarm keeps its old request and its record; the prayer is marked | the repair-only pass on the next foreground, and the next full pass for the stamp (document 03, row 4) |
| No stored day in reach (a cache from a previous year) | the pass bails, nothing cancelled | the pass after the first sync (`app/index.tsx:141-145`) |
| The update is installed and the app is never opened | Android: the notifications library restores the alarms it holds from its own store after `MY_PACKAGE_REPLACED` (`stores/notifications.ts:1513-1517`); iOS keeps pending requests across an update. Titles stay English | the background task, when the system next runs it, or the first launch |
| The user updates while offline | class A: no fetch is needed, the cache is kept. Classes B and C: the table above | class A: none needed |
| A widget is on screen during the update | it draws the 1.x layout string with 1.x props until step 8 (`evidence/widgets.md` section 4.6) | step 8. Between the new layout's registration and the new props, the layout's fallbacks draw 1.x props correctly (document 04, section 4) |
| The error screen's Refresh is pressed | records and timetable wiped, preferences and both language keys kept (`components/ui/Error.tsx:28`) | the next pass with data; until it has a record, the sweep is skipped and nothing is stamped (document 03, row 15) |

## Installs older than the name-keyed preferences

`migrateIndexKeyedAlertPreferences` stays and runs on every launch
(`stores/notifications.ts:525-598`, `stores/version.ts:289`). It is rewritten to resolve
destinations by `PrayerId`, with the pre-1.0.27 Extras order kept as a list of ids and the
three index-key templates moved into `shared/identifiers.ts` (document 01). Its behaviour is
pinned by the existing suite (`stores/__tests__/notifications.test.ts:223-345`), which keeps its
literal keys and values.

## Downgrade

A 2.0.0 install that is replaced by a 1.29.x build keeps working: 1.29.x ignores the two
language keys, reads the same preference keys, and reads only `id` and `date` from records,
which 2.0.0 records have. A pending title stays in the 2.0.0 language until that build's next
pass. Downgrade is not a supported path and nothing is done for it beyond not breaking it.

## The 2.0.0 What's New entry

`WHATS_NEW` in `shared/whatsNew.ts` is restamped `2.0.0` and gains one item, whose two strings
are `whatsNew.language.title` and `whatsNew.language.body` (`02a-catalog-keys.md` section
2.14). Which of the older items stay beside it is a release-note choice for the owner; the
limit is four shown per release (`shared/whatsNew.ts:131-137`). Every item's strings are
catalog keys, so the modal an upgrading user sees is in the resolved language.
