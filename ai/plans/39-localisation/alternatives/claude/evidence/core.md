# Core evidence: prayer identity, notifications, storage, upgrade

Every citation is `path:line` at base commit `c3149dfc` (the `uat` tip this branch starts from).
The files named here were read in full. Facts only. The design that answers them is in the
numbered documents one folder up.

## 1. One string does twelve jobs

The English display name is the prayer's identity today. Nothing else names a prayer.

| Job | How the name is used | Example for Last Third | Site |
| --- | --- | --- | --- |
| Display | drawn as is | `Last Third` | `components/prayer/Prayer.tsx:89` |
| Canonical order and index | position in the name array | `1` | `shared/constants.ts:9`, `shared/constants.ts:26`, `stores/notifications.ts:663-666` |
| Preference key | `.toLowerCase()` | `preference_alert_extra_last third` | `stores/notifications.ts:207`, `:258`, `:278` |
| Repair mark key | `.toLowerCase()` | `preference_notification_repair_extra_last third` | `stores/notifications.ts:335` |
| OS notification identifier | `.toLowerCase()` | `athan_extra_last third_2026-10-24` | `device/notifications.ts:49-50`, `:61-66` |
| Reminder audio file | `prayerNameSlug` | `reminder_last_third_5.mp3` | `shared/notifications.ts:147`, `:154-163` |
| Android channel id | `prayerNameSlug` | `reminder_last_third_5_v3` | `shared/notifications.ts:387-390` |
| Stored-row field | `.toLowerCase()` as an object key | `rawData['suhoor']` | `shared/prayer.ts:407` |
| Behaviour switch | string comparison | `name === 'Last Third'` | `shared/prayer.ts:181`, `:324`, `:398-399`, `shared/notifications.ts:88`, `:106`, `components/prayer/rowPress.ts:33`, `shared/constants.ts:39`, `:47` |
| Budget plan key | `${scheduleType}_${englishName}` | `extra_Last Third` | `shared/notifications.ts:252-253` |
| Sequence row identity | `${english}_${belongsToDate}` | `Last Third_2026-10-24` | `stores/schedule.ts:307` |
| Baked text | template literal | `Last Third now` | `shared/notifications.ts:130`, `:181`, `:502`, `hooks/usePrayerAgo.ts:36`, `stores/countdown.ts:413-430` |

The Arabic name rides beside it as a second display string and is never an identifier:
`shared/constants.ts:15`, `:32`, carried on every row at `shared/types.ts:270-272`, drawn at
`components/prayer/Prayer.tsx:91-93`, and passed through the notification paths only to be
ignored (`shared/notifications.ts:125`, `:176`).

A census of the non-test files that touch these names: `stores/notifications.ts` 97 lines,
`shared/notifications.ts` 43, `shared/prayer.ts` 39, `device/notifications.ts` 16, then 22 more
files with seven or fewer each (`grep -rnE` over `shared stores device hooks components app
widgets` for `english`, `arabic`, `englishName`, `arabicName`, `prayerEnglish`, `prayerArabic`
and the four name arrays).

## 2. The byte formats a 1.x install holds

These are the strings already on users' phones. `main` is at 1.29.291 and builds every one of
them with the same expressions (compared with `git show main:device/notifications.ts`,
`main:stores/notifications.ts` and `main:stores/version.ts`).

| Family | Template | Site |
| --- | --- | --- |
| At-time alert preference | `preference_alert_{standard\|extra}_{name lower}` | `stores/notifications.ts:207` |
| Reminder alert, slot 0 | `preference_reminder_alert_{type}_{name lower}` | `stores/notifications.ts:241`, `:258` |
| Reminder alert, slot 1 | `preference_reminder_alert_{type}_{name lower}_2` | `stores/notifications.ts:241`, `:258` |
| Reminder interval, slot 0 and 1 | `preference_reminder_interval_{type}_{name lower}` and the same with `_2` | `stores/notifications.ts:278` |
| Repair mark | `preference_notification_repair_{type}_{name lower}` | `stores/notifications.ts:335` |
| Athan choice | `preference_sound` | `stores/notifications.ts:604` |
| Refresh gate | `preference_last_notification_schedule_check` | `stores/notifications.ts:610` |
| At-time OS identifier | `athan_{type}_{name lower}_{YYYY-MM-DD}` | `device/notifications.ts:49-50` |
| Reminder OS identifier | `reminder_{type}_{name lower}_{YYYY-MM-DD}_{minutes}` | `device/notifications.ts:61-66` |
| At-time record key | `scheduled_notifications_{type}_{index}_{identifier}` | `stores/database.ts:193` |
| Reminder record key | `scheduled_reminders_{type}_{index}_{identifier}` | `stores/database.ts:258` |
| Athan audio | `athan{1..32}.mp3` | `shared/notifications.ts:116`, `app.json:85-116` |
| Reminder audio | `reminder_{slug}_{5..30}.mp3` | `shared/notifications.ts:162`, `app.json:117-182` |
| Extras audio | `reminder.mp3` | `shared/notifications.ts:94`, `app.json:183` |
| Athan channel | `athan_{1..32}_v4` | `shared/notifications.ts:380` |
| Reminder channel | `reminder_{slug}_{minutes}_v3` | `shared/notifications.ts:387-390` |
| Extras channel | `extras_at_time_v3` | `shared/notifications.ts:396` |
| Stored day | `prayer_{YYYY-MM-DD}` | `stores/database.ts:138` |
| Alert value | `"0"`, `"1"`, `"2"` | `shared/types.ts:195-202`, `stores/storage.ts:73` |

Two forms of one prayer's name are frozen and differ: the lower-cased name keeps its space
(`last third`) in preference keys and OS identifiers, and the slug swaps it for an underscore
(`last_third`) in audio and channel ids. The audio folder holds 99 files: 32 athans, 66 reminders
(11 prayers by 6 intervals) and `reminder.mp3` (`find assets/audio -type f`, less `index.ts`).

## 3. Notification records

- Value shape: `{ id, date, time, englishName, arabicName, alertType }`
  (`shared/notifications.ts:17-24`).
- Writers: `device/notifications.ts:130`, `:248` and the refused-arm paths at
  `stores/notifications.ts:877`, `:1071`.
- Readers use two fields only. `id`: `shared/notifications.ts:218`,
  `stores/notifications.ts:935`, `:943`, `:982`, `:1133`, `:1177`, `device/notifications.ts:168`,
  `:277`. `date`: `stores/notifications.ts:124-134`.
- `englishName`, `arabicName`, `time` and `alertType` are written and never read back. The only
  two `.englishName` reads in non-test code are on a `CandidateRow` and on `armingNow`
  (`shared/notifications.ts:277`, `stores/notifications.ts:428`), neither of which is a record.
- Record keys are indexed by canonical position, not by name (`stores/database.ts:193`, `:258`).
- Records are not in the upgrade keep list, so a cache wipe removes them
  (`stores/version.ts:144-156`). The sweep refuses to cancel anything when no record exists
  (`stores/notifications.ts:1513-1526`).

## 4. Scheduling machinery

| Mechanism | What it guarantees | Site |
| --- | --- | --- |
| Queue lock | operations run one at a time and none is dropped | `stores/notifications.ts:45-79` |
| Same-identifier replace | arming an identifier that is already pending replaces it in place | `device/notifications.ts:43-50`, `:115-128` |
| Schedule first, cancel stale after | the phone never holds fewer alarms than before a pass | `stores/notifications.ts:904-959`, `:1094-1155` |
| Refused arm keeps its record | a refused re-arm leaves the old alarm and a record that protects it | `stores/notifications.ts:871-881`, `:1066-1075` |
| Sweep with an empty-record guard | strays are cancelled, a wiped record set cancels nothing | `stores/notifications.ts:1499-1541` |
| Repair marks | a prayer whose bell and alarms may disagree is retried at the next refresh | `stores/notifications.ts:320-409`, `:1553-1573`, `:1794-1810` |
| Refresh gate | a full pass at most every 2 hours in the foreground | `stores/notifications.ts:1459-1487`, `:1794-1843` |
| Cold-launch reopen | Android re-arms on every cold launch | `stores/notifications.ts:1787-1792`, `app/index.tsx:102-111` |
| Empty-cache bail | a pass with no stored day arms nothing and cancels nothing | `stores/notifications.ts:1604-1610` |
| Budget plan | rows armed whole, in time order, inside 64 requests | `shared/notifications.ts:268-284`, `:294-328`, `shared/constants.ts:75` |
| Native call timeout | a call that never answers is refused after 15 s and reopens the gate | `shared/notifications.ts:32-79`, `stores/notifications.ts:66-68` |
| Background pass | a full pass with no gate, every 3 hours at best | `stores/notifications.ts:1860-1900`, `device/tasks.ts:23-60` |

A full pass re-arms every row its plan covers, clears every prayer whose bell is Off, and ends
by pushing the widgets (`stores/notifications.ts:1585-1668`). It takes no language input today.

## 5. Where language is baked today

| Surface | Baked when | Text | Site |
| --- | --- | --- | --- |
| At-time notification title | at arm time | `${englishName} now` | `shared/notifications.ts:123-138`, `device/notifications.ts:91` |
| Reminder notification title | at arm time | `${englishName} in ${intervalMinutes}m` | `shared/notifications.ts:174-189`, `device/notifications.ts:221` |
| Athan channel name | at channel creation | `Athan ${n}` | `shared/notifications.ts:409-417` |
| Extras channel name | at channel creation | `Extra Times` | `shared/notifications.ts:450-451` |
| Reminder channel name | at channel creation | `${englishName} in ${intervalMinutes}m Reminder` | `shared/notifications.ts:501-502` |
| Widget text | at props push | see `widgets.md` | `stores/widget.ts` |
| Widget gallery names | at build | `Next Prayer (Light)` and 13 more | `app.json:204-379` |
| Permission purpose strings | at build | two sentences | `app.json:24-25` |

Channel creation is skipped for the rest of the process once an id has been created
(`shared/notifications.ts:431-437`, `:447`, `:478`, `:496`), so a second call with a new name
never reaches Android today. A channel's sound, importance and audio attributes cannot change
after creation (`shared/notifications.ts:373-379`); the comment at `:467-472` records that
re-creating an existing channel with identical settings changes nothing.

Silent alerts carry no `channelId` (`device/notifications.ts:96-97`, `:224-226`), so they post
to the notifications library's own fallback channel, whose name the app does not set.

## 6. Upgrade machinery

- `handleAppUpgrade` runs once per launch inside `sync()` (`stores/version.ts:230-292`). A
  version increase with an unchanged cache shape keeps every key and reopens the refresh gate
  (`:261-263`, `:194-201`). A changed shape wipes everything outside the keep list
  (`:258-260`, `:208-223`).
- The keep list is `app_installed_version`, `whats_new_shown_version`, `cache_schema_version`,
  every `preference_` key and every `prayer_max_english_width_` key (`stores/version.ts:144-156`).
- `CACHE_SCHEMA_VERSION` is `1` on `uat` and on `main` (`stores/version.ts:135`).
- The index-key migration runs on every launch and is a no-op after the first
  (`stores/notifications.ts:487-598`, called at `stores/version.ts:289`).
- The synchronous bootstrap asks the same two questions before first paint and refuses to
  hydrate when a wipe is coming (`stores/bootstrap.ts:53-81`).
- A persisted atom reads storage once, at module evaluation, so a value changed behind it is
  invisible until the process restarts (`stores/storage.ts:7-12`). `resetStoredAtom` is the only
  sanctioned way round that (`stores/storage.ts:40-46`).

## 7. Launch and resume order

1. `app/_layout.tsx:3` defines the background task. `:10` runs the synchronous bootstrap.
   `:50` queues `sync()` on a zero timeout.
2. `app/index.tsx:95` registers the app-state listeners at mount. `:102-118` waits 1500 ms,
   reopens the gate on Android, then initialises notifications.
3. `shared/notifications.ts:562-593` deletes legacy channels, creates the default athan channel
   and the extras channel, and refreshes only when permission is granted (`:579-589`).
4. `app/index.tsx:141-145` refreshes again when the first sync lands.
5. On a return from the background `device/listeners.ts:45-69` runs the same initialisation,
   then a sync, then a refresh when the sync changed an armed day.
6. The background task runs `sync()` best-effort and then a full pass
   (`stores/notifications.ts:1860-1900`).

The widgets are pushed at the end of every full pass (`stores/notifications.ts:1635-1663`).
A phone with notification permission refused never reaches a full pass through steps 3 to 5.

## 8. The prayer row

- Row: a horizontal flex container 57 high (`components/prayer/Prayer.tsx:101-105`,
  `shared/constants.ts:984`).
- Name: fixed width equal to the cached widest-name width plus 20 left padding
  (`components/prayer/Prayer.tsx:65-67`, `:88-90`, `:110-112`).
- Arabic name: `flex: 1`, right-aligned, drawn only while the toggle is on
  (`components/prayer/Prayer.tsx:91-93`, `:113-116`).
- Time: `flex: 1`, centred, left margin 15 (`components/prayer/Time.tsx:62-72`).
- Alert icon: right, 20 right padding (`components/prayer/Alert.tsx:204-213`).
- With the Arabic toggle off the row is already name, time, icon.
- The widest name is chosen by character count (`shared/prayer.ts:196-209`) and measured from
  one hidden `Text` per schedule (`components/ui/InitialWidthMeasurement.tsx:17-28`).
- The measured width is persisted, only ever grows, and survives every wipe
  (`stores/ui.ts:104-107`, `:216-231`, `stores/version.ts:153-155`).
- Font: `Roboto-Regular` at 18 (`components/prayer/Prayer.tsx:106-109`, `shared/constants.ts:281-289`).
  The bundled fonts are two Roboto weights (`app.json:74-79`).

## 9. Settings

- The sheet has four cards: Prayer, Display, Countdown Bar, Other
  (`components/sheets/screens/Settings.tsx:85-185`).
- A chevron row already exists in two cards and is the pattern for a row that opens another
  sheet (`components/sheets/screens/Settings.tsx:87-98`, `:173-184`, styles at `:213-230`).
- The bilingual toggle is `Show arabic names` (`components/sheets/screens/Settings.tsx:128-132`),
  backed by `preference_show_arabic_names`, default on (`stores/ui.ts:131-132`).
- No locale library is installed. `package.json:32-76` lists no `expo-localization`, no i18n
  package and no Intl polyfill.
