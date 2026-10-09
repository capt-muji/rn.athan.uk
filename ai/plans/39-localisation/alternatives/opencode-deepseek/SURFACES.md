# Surfaces that bake language

Three surfaces capture text at a moment rather than at render, so a language switch
must rebuild them. A fourth (the screen) re-renders itself from the catalog. This file
lists each surface, the exact strings, and the rebuild path.

## 1. Notifications

Text is captured at schedule time (`device/notifications.ts:82-137,212-255`), so a
language switch reschedules. The identifiers do not change, so the reschedule replaces
each pending alarm in place.

| Message | Key | English | Built with |
| --- | --- | --- | --- |
| At-time title | `notification.now` | `{name} now` | `translate(locale, key, { name: prayerLabel(locale, id) })` |
| Reminder title | `notification.reminder` | `{name} in {n}m` | `translate(locale, key, { name, n: intervalMinutes })` |

`{name}` is the localized prayer label, for example Arabic `الفجر الآن`, Hindi
`फ़ज्र अभी`, Thai `ฟัจร์ ตอนนี้`. `{n}` is a Latin-digit number, because it is
`String(number)`, not an `Intl` number (`MODULE-CONTRACTS.md` §4).

Body: none. Sound: unchanged (`shared/notifications.ts:112-117,154-163`). Colour,
priority, interruption level, delivery class: unchanged (`shared/notifications.ts:123-138,174-189`).
Android at-time channel targeting: unchanged except the id's new locale suffix
(§2).

Rebuild path on a switch: `rescheduleNotifications` (the existing
`refreshNotifications`, `stores/notifications.ts`), which is
schedule-first-then-cancel-stale (`stores/notifications.ts:884-959`), so the phone
never holds fewer alarms than before.

## 2. Android channels

A channel's name is user-visible in Android Settings, and Android freezes a channel's
name, sound, importance and audio attributes at creation
(`shared/notifications.ts:374-390,409-417,445-463,492-514`). A language switch therefore
creates the channels again under new, locale-keyed ids and deletes the previous
generation afterwards.

| Channel | Id | Name (key) |
| --- | --- | --- |
| Athan n | `athan_{n+1}_v5_{locale}` | `Athan {n+1}` (a brand token, not translated) |
| Extras at-time | `extras_at_time_v5_{locale}` | `Extra Times` -> `widget`-style catalog key, translatable |
| Reminder | `reminder_{slug}_{interval}_v5_{locale}` | `{name} in {n}m Reminder`, `{name} = prayerLabel(locale, id)` |

The two channel-name templates become catalog keys (`channel.athan` = `Athan {n}`,
`channel.extras` = `Extra Times`, `channel.reminder` = `{name} in {n}m Reminder`) so the
`Extra Times` and reminder names localize. `Athan {n}` is a proper noun and may stay
identical in every locale; leaving it as a catalog key keeps the option open without a
code change.

Definition order on a switch is forced: (1) reschedule, which creates the new ids on
demand (`shared/notifications.ts:474-514`) and re-points every pending alarm; (2)
delete the superseded channels, including the current generation for every other
locale, with `deleteSupersededAndroidChannels(locale)`. Init keeps today's order
(delete legacy, then reschedule, `shared/notifications.ts:570-577`).

## 3. Widgets

The iOS timeline and the Android snapshot are built from the sequence
(`shared/widgetTimeline.ts:161-197,277-320`), so a switch re-pushes with localized
values. Widget layouts cannot import a catalog (the `'widget'` directive serializes
the function body only, and the runtime resolves only `@expo/ui` globals,
`shared/__tests__/widgetContract.test.ts:94-144`), so every string is a prop value.

| Field | Source after the change |
| --- | --- |
| `nextName` | `prayerLabel(settings.locale, next.id)` |
| `prayers[].name`, Android row `name` | `prayerLabel(settings.locale, prayer.id)` |
| `dateLabel` | `formatDateLabel(belongsToDate, settings.hijriDate, settings.locale)` |
| `strings` | `widgetStrings(settings.locale)` |

`strings` fields and their English defaults, all used by the layouts
(`MODULE-CONTRACTS.md` §18):

| Field | English | Where used |
| --- | --- | --- |
| `neutralTitle` | `Athan` | home neutral card |
| `neutralSubtitle` | `Prayer times for London` | home neutral card, home error card |
| `openToLoad` | `Open to load times` | lock neutral |
| `staleTitle` | `Out of date` | home and lock stale |
| `staleRefresh` | `Open Athan to refresh` | home stale, medium |
| `staleOpen` | `Open Athan` | home stale, small, line one |
| `staleToRefresh` | `to refresh` | home stale, small, line two |
| `refreshLine` | `Open app to refresh` | lock stale |
| `inlineNeutral` | `Athan — prayer times` | lock inline neutral |
| `inlineStale` | `Athan — open to refresh times` | lock inline stale |
| `brandUpper` | `ATHAN` | lock neutral brand line |

The layouts read `props.strings?.field ?? '<english default>'`. The fallback keeps an
entry written by the previous app version renderable, which is the cross-release
tolerance the `v` field exists for (`shared/widgetTypes.ts:9-14`). The push path is
`stores/widget.ts`; it re-pushes on launch (`stores/sync.ts:250-260`) and on a language
change via the `languageAtom` subscription (`MODULE-CONTRACTS.md` §17).

## 4. The screen

Everything on screen re-renders from `useTranslation()` when `localeAtom` changes, so
the switch has no display work beyond the state write. The bilingual row and the Arabic
explanation line are removed; the row shows one localized name
(`MODULE-CONTRACTS.md` §19). The row keeps `direction: 'ltr'` and `textAlign: 'left'`
so no locale mirrors the frozen layout.

## 5. The English catalog (source of truth)

The complete `en` catalog. Values are final; keys are the interface. `{...}` are
interpolation placeholders.

```
common.close = Close
common.cancel = Cancel
common.openSettings = Open Settings
common.later = Later
common.update = Update
settings.title = Settings
settings.subtitle = Set your preferences
settings.card.prayer = Prayer
settings.card.display = Display
settings.card.countdown = Countdown Bar
settings.card.other = Other
settings.changeAthan = Change athan
settings.qibla = Qibla
settings.showHijri = Show hijri date
settings.showSeconds = Show seconds
settings.showTimePassed = Show time passed
settings.showCountdownBar = Show countdown bar
settings.showDecorations = Show decorations
settings.whatsNew = What's new
settings.help = Help
settings.language = Language
language.title = Language
language.subtitle = Choose your language
alert.subtitle = Close to save
alert.cardAthan = Athan
alert.hintAtTime = Notification at prayer time
alert.reminder1 = Reminder 1
alert.reminder2 = Reminder 2
alert.hintBefore = Notification before prayer time
alert.sound = Sound
alert.before = Before
alert.unitMin = min
alert.option.off = Off
alert.option.silent = Silent
alert.option.sound = Sound
alert.unavailable = This prayer's time isn't available\nright now, so no alert will go off.\n\nYour alert setting is kept and will\nreturn once a time is available.
sound.title = Select Athan
sound.subtitle = Close to save
sound.hint = Notification sound
countdown.units.hours = h
countdown.units.minutes = m
countdown.units.seconds = s
countdown.now = now
countdown.waitingLabel = No prayer time to count down to
day.location = London, UK
app.loading = Loading prayer times
error.heading = Oh no!
error.body = Something went wrong.
error.hint = Try refreshing!
error.refresh = Refresh
update.title = Update Available!
update.body = A new version is available.\nWould you like to update now?
whatsNew.title = What's New
whatsNew.platformOnly =  ({platform} only)
help.title = Help
help.action.dndAccess = Grant Do Not Disturb access
help.q1..q7.q = (the seven questions, shared/help.ts:51-130)
help.qN.ios.t / help.qN.ios.sM = (iOS answer text and steps)
help.qN.android.t / help.qN.android.sM = (Android answer text and steps)
qibla.title = Qibla
qibla.subtitle.waiting = Follow below instructions
qibla.subtitle.ready = Hold flat and turn slowly
qibla.headline = Wake up the compass
qibla.instruction = Move your phone like this
qibla.lost = Could not find north
qibla.lostHint = Please try standing in a different location
qibla.permission = The qibla is worked out from where you are, so it needs location access. Turn it on in Settings, then open this sheet again.
prayer.fajr = Fajr
prayer.sunrise = Sunrise
prayer.dhuhr = Dhuhr
prayer.asr = Asr
prayer.magrib = Magrib
prayer.isha = Isha
prayer.midnight = Midnight
prayer.last third = Last Third
prayer.suhoor = Suhoor
prayer.duha = Duha
prayer.istijaba = Istijaba
extra.explanation.midnight = Halfway between Magrib and Fajr
extra.explanation.last third = Start of the last third of the night
extra.explanation.suhoor = 20 mins before Fajr
extra.explanation.duha = 20 mins after Sunrise
extra.explanation.istijaba = 1 hour before Magrib (Fridays only)
notification.now = {name} now
notification.reminder = {name} in {n}m
notification.permission.title = Enable Notifications
notification.permission.body = Prayer time notifications are disabled. Would you like to enable them in settings?
channel.athan = Athan {n}
channel.extras = Extra Times
channel.reminder = {name} in {n}m Reminder
widget.neutralTitle = Athan
widget.neutralSubtitle = Prayer times for London
widget.openToLoad = Open to load times
widget.staleTitle = Out of date
widget.staleRefresh = Open Athan to refresh
widget.staleOpen = Open Athan
widget.staleToRefresh = to refresh
widget.refreshLine = Open app to refresh
widget.inlineNeutral = Athan — prayer times
widget.inlineStale = Athan — open to refresh times
widget.brandUpper = ATHAN
```

The seven help questions and their answers come from the existing `HELP_ENTRIES`
(`shared/help.ts:51-130`); they move verbatim into the catalog behind
`getHelpTopics(os, locale)`.

## 6. Locale list

| Code | Endonym | English | Intl tag |
| --- | --- | --- | --- |
| `en` | English | English | `en-GB` |
| `ar` | العربية | Arabic | `ar` |
| `ms` | Bahasa Melayu | Malay | `ms` |
| `so` | Soomaali | Somali | `so` |
| `hi` | हिन्दी | Hindi | `hi` |
| `th` | ไทย | Thai | `th` |

The Settings sheet lists endonyms, in `LOCALE_CODES` order, so a user who cannot read
the current language can still find their own row.

## 7. Translation acceptance rules

Every new locale's catalog must satisfy, beyond the compiler:

1. No empty or whitespace-only value.
2. Same key set as `en`.
3. Every `PrayerId` label present; the `ar` labels equal the historical Arabic
   constants (`shared/constants.ts:15,32`).
4. Every extra explanation present; the `ar` explanations equal the historical Arabic
   explanations (`shared/constants.ts:1006-1012`).
5. No non-Latin digits in any rendered date, time or count (checked by rendering each
   formatter under every locale).
6. Interpolation placeholders preserved exactly (`{name}`, `{n}`, `{platform}`); a
   missing placeholder is a test failure even though it compiles.
