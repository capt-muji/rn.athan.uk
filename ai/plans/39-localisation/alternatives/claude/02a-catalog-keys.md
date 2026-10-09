# 02a. The English catalog, key by key

This appendix lists every key of the English source pack and its exact value. It is typed in as
written. Evidence for each row is in `evidence/ui-strings.md`, `evidence/widgets.md`,
`evidence/schedule-time.md` and `evidence/core.md`. Citations are `path:line` at base commit
`c3149dfc`. Where an evidence row was unclear the source line was opened and the bytes copied.

## 1. Conventions

1. A key is dot-separated segments. A segment is lowerCamel ASCII letters and digits, or a plain
   number in the date name tables. The catalog is a flat map: one key, one string.
2. A prayer's key segment is its id, except `last_third`, whose segment is `lastThird`.
3. A placeholder is `{name}`, lowerCamel ASCII. Numbers arrive as ASCII-digit strings.
4. There is no plural logic. A constant count is typed into a whole sentence. A varying count sits
   in a template whose wording does not depend on it.
5. `\n` inside a value is one line feed. No value starts or ends with white space: where today's
   literal carries padding spaces, the code keeps them.
6. A spoken label shares the key of drawn text when the bytes and the meaning are the same.
   Otherwise it has its own key under `a11y.`.
7. A button or line with one meaning on several surfaces has one key under `common.`.
8. `frozen` in a note means 1.x installs and tests pin the English bytes. They never change.
9. Not keys: strings the OS owns at build time, text a library draws, log lines, thrown errors
   that never reach a user, and symbols that carry no words. Section 7 lists them.
10. The note column carries a length budget wherever the evidence shows a fixed box or a
    one-line limit. Every `prayer.<id>` and `prayerHero.<id>` value has a budget of 12 visible
    characters, set in document 02 ("The notes file"), whether or not its row repeats it.

## 2. The English catalog

Columns: key, English value, placeholders, where the string is drawn today, note. "Spoken" in a
note means a screen reader reads the same key at the cited line.

### 2.1 Prayer names

Defined at `shared/constants.ts:9` and `:26`. Drawn in the list row
(`components/prayer/Prayer.tsx:89`), above the countdown (`components/countdown/Countdown.tsx:47`),
as the alert sheet title (`components/sheets/screens/Alert.tsx:95`), as the explanation title
(`components/prayer/Explanation.tsx:67`), in widget list rows and lock widgets
(`shared/widgetTimeline.ts:135`, `:188`, `:247`, `:303`, `:306`), and inside every templated key
that has a `{prayer}` placeholder.

Budget for all eleven: one line everywhere. The row draws the name in a measured column inside a
row 57 high (`components/prayer/Prayer.tsx:65-67`, `:104`). The Android widget list draws it in a
fixed box, and `Last Third` (10 characters) is the string that clips first
(`widgets/PrayerWidget.tsx:221-224`, `:413-423`). The English value is also a part of the frozen
notification titles and channel names in 2.18.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `prayer.fajr` | `Fajr` | none | `shared/constants.ts:9` | Standard |
| `prayer.sunrise` | `Sunrise` | none | `shared/constants.ts:9` | Standard |
| `prayer.dhuhr` | `Dhuhr` | none | `shared/constants.ts:9` | Standard |
| `prayer.asr` | `Asr` | none | `shared/constants.ts:9` | Standard |
| `prayer.magrib` | `Magrib` | none | `shared/constants.ts:9` | Standard |
| `prayer.isha` | `Isha` | none | `shared/constants.ts:9` | Standard |
| `prayer.midnight` | `Midnight` | none | `shared/constants.ts:26` | Extras. Islamic midnight, not 00:00 |
| `prayer.lastThird` | `Last Third` | none | `shared/constants.ts:26` | Extras. The id is `last_third` |
| `prayer.suhoor` | `Suhoor` | none | `shared/constants.ts:26` | Extras |
| `prayer.duha` | `Duha` | none | `shared/constants.ts:26` | Extras |
| `prayer.istijaba` | `Istijaba` | none | `shared/constants.ts:26` | Extras, Fridays only |

### 2.2 Widget hero names

The large name on the home widget. Today the layouts upper-case the baked name themselves: with
`next.name.toUpperCase()` on Android (`widgets/PrayerWidget.tsx:378`) and with
`textCase('uppercase')` on iOS (`widgets/PrayerWidget.tsx:606`, drawn at `:611`). The layouts stop
upper-casing, so the pack holds the form to draw.

Budget for all eleven: one line. iOS shrinks the text to 0.6 of its size before it clips
(`widgets/PrayerWidget.tsx:608-609`). A language with no letter case repeats its `prayer.<id>`
value here.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `prayerHero.fajr` | `FAJR` | none | `widgets/PrayerWidget.tsx:378`, `:611` | |
| `prayerHero.sunrise` | `SUNRISE` | none | same | |
| `prayerHero.dhuhr` | `DHUHR` | none | same | |
| `prayerHero.asr` | `ASR` | none | same | |
| `prayerHero.magrib` | `MAGRIB` | none | same | |
| `prayerHero.isha` | `ISHA` | none | same | |
| `prayerHero.midnight` | `MIDNIGHT` | none | same | |
| `prayerHero.lastThird` | `LAST THIRD` | none | same | The longest. One space |
| `prayerHero.suhoor` | `SUHOOR` | none | same | |
| `prayerHero.duha` | `DUHA` | none | same | |
| `prayerHero.istijaba` | `ISTIJABA` | none | same | |

### 2.3 Extras explanations

Whole sentences, drawn in the overlay's explanation box (`components/prayer/Explanation.tsx:77`).
Prayer names are typed into the sentence as plain words, so each translation must spell them as
that pack's `prayer.<id>` values do. The numbers are constants and stay ASCII digits. The box is
as wide as the list and the text wraps, so there is no length budget.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `explanation.midnight` | `Halfway between Magrib and Fajr` | none | `shared/constants.ts:55` | Names Magrib and Fajr |
| `explanation.lastThird` | `Start of the last third of the night` | none | `shared/constants.ts:56` | |
| `explanation.suhoor` | `20 mins before Fajr` | none | `shared/constants.ts:57` | Constant 20. Names Fajr |
| `explanation.duha` | `20 mins after Sunrise` | none | `shared/constants.ts:58` | Constant 20. Names Sunrise |
| `explanation.istijaba` | `1 hour before Magrib (Fridays only)` | none | `shared/constants.ts:59` | Constant 1. Names Magrib |

### 2.4 Home screen

The rows draw `prayer.<id>` and a time in `HH:mm`. The only other drawn string on the home screen
that is not in 2.5 or 2.6 is the location line.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `home.location` | `London, UK` | none | `components/day/Day.tsx:48` | One line beside the masjid icon. The place is fixed at 2.0.0 |

Spoken-only strings of the home screen are in 2.20: `a11y.home.loading`, `a11y.bell.*`.

### 2.5 Countdown and the ago badge

The code builds a duration from the parts that apply, in hour, minute, second order, joined by
one space. The countdown uses all three units (`shared/time.ts:528-549`). The ago badge and the
Android widget countdown use hours and minutes only (`shared/time.ts:564-574`,
`widgets/PrayerWidget.tsx:292-299`). `0s` is `duration.seconds` with `n` at `0`.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `duration.hours` | `{n}h` | `n` | `shared/time.ts:540`, `:572-573`, `widgets/PrayerWidget.tsx:297-298` | One line in a block 60 high. Keep it as short as a unit letter |
| `duration.minutes` | `{n}m` | `n` | `shared/time.ts:540`, `:568`, `:573`, `widgets/PrayerWidget.tsx:296`, `:298` | Same |
| `duration.seconds` | `{n}s` | `n` | `shared/time.ts:529`, `:545` | Same. Not used by the ago badge or the widgets |
| `ago.now` | `{prayer} now` | `prayer` | `hooks/usePrayerAgo.ts:36`, drawn `components/prayer/Ago.tsx:54` | Under 60 seconds since the prayer. One line in a pill |
| `ago.since` | `{prayer} {duration} ago` | `prayer`, `duration` | `hooks/usePrayerAgo.ts:36`, drawn `components/prayer/Ago.tsx:54` | `duration` is the joined parts, for example `2h 30m`. One line in a pill |

Spoken-only strings are in 2.20: `a11y.countdown.waiting`, `a11y.countdown.bar`.

### 2.6 Day and dates

The date line is drawn at `components/day/Day.tsx:49`. Today the Gregorian line comes from
date-fns with the pattern `EEE, d MMM yyyy` and no locale (`shared/time.ts:229-233`), and the
Hijri line from `Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura')` with a long month, less a
trailing ` AH` (`shared/time.ts:241-254`). The widget footer is cut from the same label: the
weekday for a Gregorian date, the first three characters of the month and the day for a Hijri one
(`widgets/PrayerWidget.tsx:303-310`, `:545-555`).

A throwaway script, run from `$TMPDIR` with this repo's Node (v24.14.1, ICU 78.2, CLDR 48.0),
printed the seven `EEE` values, the twelve `MMM` values and the twelve Hijri long names below.
The Hijri names are what that Node prints. A phone's own ICU data was not checked against them.
Four of the Hijri long names hold U+02BB (modifier letter turned comma), marked in the notes.

Patterns:

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `date.gregorian` | `{weekday}, {day} {month} {year}` | `weekday`, `day`, `month`, `year` | `shared/time.ts:232` | Gives `Sun, 18 Jan 2026`. `day` has no leading zero. One line |
| `date.hijri` | `{month} {day}, {year}` | `month`, `day`, `year` | `shared/time.ts:243-250` | Gives `Rajab 29, 1447`. No era suffix. One line |

Weekday names, short. Sunday is 0. Used by `date.gregorian` and by the widget footer.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `date.weekdayShort.0` | `Sun` | none | `shared/time.ts:232` | Widget footer: one line, short |
| `date.weekdayShort.1` | `Mon` | none | same | |
| `date.weekdayShort.2` | `Tue` | none | same | |
| `date.weekdayShort.3` | `Wed` | none | same | |
| `date.weekdayShort.4` | `Thu` | none | same | |
| `date.weekdayShort.5` | `Fri` | none | same | |
| `date.weekdayShort.6` | `Sat` | none | same | |

Gregorian month names, short. January is 1.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `date.monthShort.1` | `Jan` | none | `shared/time.ts:232` | |
| `date.monthShort.2` | `Feb` | none | same | |
| `date.monthShort.3` | `Mar` | none | same | |
| `date.monthShort.4` | `Apr` | none | same | |
| `date.monthShort.5` | `May` | none | same | |
| `date.monthShort.6` | `Jun` | none | same | |
| `date.monthShort.7` | `Jul` | none | same | |
| `date.monthShort.8` | `Aug` | none | same | |
| `date.monthShort.9` | `Sep` | none | same | |
| `date.monthShort.10` | `Oct` | none | same | |
| `date.monthShort.11` | `Nov` | none | same | |
| `date.monthShort.12` | `Dec` | none | same | |

Hijri month names, long. Muharram is 1.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `date.hijriMonth.1` | `Muharram` | none | `shared/time.ts:243-250` | |
| `date.hijriMonth.2` | `Safar` | none | same | |
| `date.hijriMonth.3` | `Rabiʻ I` | none | same | U+02BB after `Rabi`, then a space and capital `I` |
| `date.hijriMonth.4` | `Rabiʻ II` | none | same | U+02BB after `Rabi` |
| `date.hijriMonth.5` | `Jumada I` | none | same | |
| `date.hijriMonth.6` | `Jumada II` | none | same | |
| `date.hijriMonth.7` | `Rajab` | none | same | |
| `date.hijriMonth.8` | `Shaʻban` | none | same | U+02BB after `Sha` |
| `date.hijriMonth.9` | `Ramadan` | none | same | |
| `date.hijriMonth.10` | `Shawwal` | none | same | |
| `date.hijriMonth.11` | `Dhuʻl-Qiʻdah` | none | same | U+02BB twice: after `Dhu` and after `Qi`. ASCII hyphen |
| `date.hijriMonth.12` | `Dhuʻl-Hijjah` | none | same | U+02BB after `Dhu`. ASCII hyphen |

Hijri month names, short. English values are the first three characters of each long name, which
is what the widget footer cuts today. Four pairs share a short name in English. That is today's
output and it is kept.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `date.hijriMonthShort.1` | `Muh` | none | `widgets/PrayerWidget.tsx:307`, `:552` | Widget footer: one line, short |
| `date.hijriMonthShort.2` | `Saf` | none | same | |
| `date.hijriMonthShort.3` | `Rab` | none | same | Same as month 4 |
| `date.hijriMonthShort.4` | `Rab` | none | same | Same as month 3 |
| `date.hijriMonthShort.5` | `Jum` | none | same | Same as month 6 |
| `date.hijriMonthShort.6` | `Jum` | none | same | Same as month 5 |
| `date.hijriMonthShort.7` | `Raj` | none | same | |
| `date.hijriMonthShort.8` | `Sha` | none | same | Same as month 10 |
| `date.hijriMonthShort.9` | `Ram` | none | same | |
| `date.hijriMonthShort.10` | `Sha` | none | same | Same as month 8 |
| `date.hijriMonthShort.11` | `Dhu` | none | same | Same as month 12 |
| `date.hijriMonthShort.12` | `Dhu` | none | same | Same as month 11 |

The Hijri widget footer joins the short month and the day through one pattern, so a language can
order them its own way:

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `date.hijriShort` | `{month} {day}` | `month`, `day` | `widgets/PrayerWidget.tsx:307-309`, `:552-554` | Widget footer for a Hijri day, for example `Raj 1`. One line, short |

### 2.7 Overlay

The overlay has no drawn key of its own. Its explanation box draws `prayer.<id>` as the title and
`explanation.<id>` as the body. Its one spoken string, `a11y.overlay.close`, is in 2.20.

### 2.8 Alert sheet

The sheet title is `prayer.<id>`. The subtitle is `common.closeToSave`.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `sheet.alert.unavailable` | `This prayer's time isn't available\nright now, so no alert will go off.\n\nYour alert setting is kept and will\nreturn once a time is available.` | none | `components/sheets/screens/Alert.tsx:41-47`, drawn `:105` | Five lines broken by hand, the third empty. Each line must fit a 360dp phone without wrapping. The longest English line is 35 characters. Straight apostrophes |
| `sheet.alert.athan.title` | `Athan` | none | `components/sheets/screens/Alert.tsx:222` | Card title. The call to prayer, not the app's name |
| `sheet.alert.athan.hint` | `Notification at prayer time` | none | `components/sheets/screens/Alert.tsx:223` | Card hint |
| `sheet.alert.option.off` | `Off` | none | `components/sheets/screens/Alert.tsx:31`, drawn `components/sheets/parts/SegmentedControl.tsx:96` | Spoken at `SegmentedControl.tsx:85`. One of three equal segments, size 13, beside a 13-wide icon |
| `sheet.alert.option.silent` | `Silent` | none | `components/sheets/screens/Alert.tsx:32`, `components/sheets/screens/ReminderCard.tsx:10` | Spoken. A third of the control in the athan card, a half in a reminder card beside the 100-wide label |
| `sheet.alert.option.sound` | `Sound` | none | `components/sheets/screens/Alert.tsx:33`, `components/sheets/screens/ReminderCard.tsx:11` | Spoken. Same boxes as `silent` |
| `sheet.alert.reminder1.title` | `Reminder 1` | none | `components/sheets/screens/Alert.tsx:235`, drawn `components/sheets/screens/ReminderCard.tsx:57` | The number is typed in |
| `sheet.alert.reminder2.title` | `Reminder 2` | none | `components/sheets/screens/Alert.tsx:247`, drawn `components/sheets/screens/ReminderCard.tsx:57` | The number is typed in |
| `sheet.alert.reminder.hint` | `Notification before prayer time` | none | `components/sheets/screens/Alert.tsx:236`, `:248`, drawn `components/sheets/screens/ReminderCard.tsx:58` | Written twice today, one key |
| `sheet.alert.reminder.soundLabel` | `Sound` | none | `components/sheets/screens/ReminderCard.tsx:65` | Row label for the sound choice. Column 100 wide, size 13 (`ReminderCard.tsx:128-133`) |
| `sheet.alert.reminder.before` | `Before` | none | `components/sheets/screens/ReminderCard.tsx:70` | Row label for the minutes. Same column |
| `sheet.alert.reminder.unit` | `min` | none | `components/sheets/screens/ReminderCard.tsx:75`, drawn `components/sheets/parts/Stepper.tsx:71` | Drawn after the number in a second Text. Must read correctly after 5, 10, 15, 20, 25 and 30 |

The reminder switch has no spoken label today (`components/sheets/screens/ReminderCard.tsx:60`).
None is added here. Spoken-only strings of the stepper are in 2.20: `a11y.stepper.*`.

### 2.9 Sound sheet

The subtitle is `common.closeToSave`.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `sheet.sound.title` | `Select Athan` | none | `components/sheets/screens/Sound.tsx:165` | Sheet title. Short: the title block has no flex beside a 40-wide icon |
| `sheet.sound.hint` | `Notification sound` | none | `components/sheets/screens/Sound.tsx:178` | Card hint |
| `sheet.sound.item` | `Athan {number}` | `number` | `components/sheets/parts/SoundItem.tsx:102`, drawn `:114` | Spoken at `:113`. `number` runs 1 to 32. One line: one measured row height places the selection for all 32 rows. Keep it in step with `channel.athan` |

Spoken-only strings are in 2.20: `a11y.sound.preview`, `a11y.sound.stopPreview`.

### 2.10 Settings sheet

Toggle labels are drawn and spoken from one prop (`components/sheets/parts/LabeledToggle.tsx:30-32`).
Each sits beside a 44-wide switch and does not shrink, so each must stay on one line.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `sheet.settings.title` | `Settings` | none | `components/sheets/screens/Settings.tsx:75` | Sheet title. Also the spoken label of the settings button (`components/ui/SettingsButton.tsx:35`) |
| `sheet.settings.subtitle` | `Set your preferences` | none | `components/sheets/screens/Settings.tsx:76` | Sheet subtitle |
| `settings.prayer.title` | `Prayer` | none | `components/sheets/screens/Settings.tsx:86` | Card title |
| `settings.prayer.changeAthan` | `Change athan` | none | `components/sheets/screens/Settings.tsx:96` | Spoken at `:91`. Row label, wraps |
| `settings.prayer.qibla` | `Qibla` | none | `components/sheets/screens/Settings.tsx:108` | Spoken at `:103`. Row label |
| `settings.display.title` | `Display` | none | `components/sheets/screens/Settings.tsx:115` | Card title |
| `settings.display.showHijriDate` | `Show hijri date` | none | `components/sheets/screens/Settings.tsx:118` | Toggle label, spoken. One line |
| `settings.display.showSeconds` | `Show seconds` | none | `components/sheets/screens/Settings.tsx:122` | Toggle label, spoken. One line |
| `settings.display.showTimePassed` | `Show time passed` | none | `components/sheets/screens/Settings.tsx:124` | Toggle label, spoken. One line |
| `settings.display.showDecorations` | `Show decorations` | none | `components/sheets/screens/Settings.tsx:135` | Toggle label, spoken. Shown in the decoration season only. One line |
| `settings.countdown.title` | `Countdown Bar` | none | `components/sheets/screens/Settings.tsx:145` | Card title |
| `settings.countdown.show` | `Show countdown bar` | none | `components/sheets/screens/Settings.tsx:148` | Toggle label, spoken. One line |
| `settings.countdown.color` | `Countdown bar color` | none | `components/sheets/screens/ColorPicker.tsx:108` | Spoken at `:107`. One line beside Reset, a swatch and a chevron. The label does not shrink. American spelling, as the source has it |
| `settings.countdown.reset` | `Reset` | none | `components/sheets/screens/ColorPicker.tsx:121` | Button text. Its spoken label is `a11y.settings.resetColor` |
| `settings.colorPicker.title` | `Select Color` | none | `components/sheets/screens/ColorPicker.tsx:144` | Picker title, between two icon buttons |
| `settings.other.title` | `Other` | none | `components/sheets/screens/Settings.tsx:158` | Card title |
| `settings.other.whatsNew` | `What’s new` | none | `components/sheets/screens/Settings.tsx:169` | U+2019 apostrophe, written `&#8217;` in the source. Its spoken label has a straight apostrophe and is `a11y.settings.whatsNew` |
| `settings.other.help` | `Help` | none | `components/sheets/screens/Settings.tsx:182` | Spoken at `:177`. Row label |

### 2.11 Language sheet

All new. `{language}` in the spoken keys of 2.20 is the language's own name as its pack states
it, not a catalog key.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `settings.language.label` | `Language` | none | new | Row label in the settings sheet, with a chevron |
| `sheet.language.title` | `Language` | none | new | Sheet title |
| `sheet.language.subtitle` | `Choose the app language` | none | new | Sheet subtitle |

### 2.12 Qibla sheet

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `sheet.qibla.title` | `Qibla` | none | `components/sheets/screens/Qibla.tsx:140` | Sheet title |
| `sheet.qibla.subtitle.waiting` | `Follow below instructions` | none | `components/sheets/screens/Qibla.tsx:85` | One line. The code leaves this line in layout flow and assumes it is the wider of the two subtitles (`Qibla.tsx:82-89`) |
| `sheet.qibla.subtitle.ready` | `Hold flat and turn slowly` | none | `components/sheets/screens/Qibla.tsx:88` | One line, stacked over the waiting line |
| `sheet.qibla.calibration.headline` | `Wake up the compass` | none | `components/sheets/screens/Qibla.tsx:46` | Centred. No word for calibrating, by the comment at `:44-45` |
| `sheet.qibla.calibration.message` | `Move your phone like this` | none | `components/sheets/screens/Qibla.tsx:47` | Centred, above a drawing of the motion |
| `sheet.qibla.lost.title` | `Could not find north` | none | `components/sheets/screens/Qibla.tsx:62` | Centred |
| `sheet.qibla.lost.advice` | `Please try standing in a different location` | none | `components/sheets/screens/Qibla.tsx:63` | Centred |
| `sheet.qibla.denied.message` | `The qibla is worked out from where you are, so it needs location access. Turn it on in Settings, then open this sheet again.` | none | `components/sheets/screens/Qibla.tsx:104-105` | One paragraph across two source lines. `Settings` is the phone's settings app |
| `sheet.qibla.place` | `{locality}, {country}` | `locality`, `country` | `shared/qiblaPlace.ts:46`, drawn `components/sheets/screens/Qibla.tsx:167` | Both values come from the OS geocoder in the phone's language. One line |
| `sheet.qibla.cardinal.north` | `N` | none | `shared/qiblaCompass.ts:93`, drawn `components/sheets/screens/QiblaCompass.tsx:141` | One letter on the dial |
| `sheet.qibla.cardinal.east` | `E` | none | `shared/qiblaCompass.ts:94` | One letter |
| `sheet.qibla.cardinal.south` | `S` | none | `shared/qiblaCompass.ts:95` | One letter |
| `sheet.qibla.cardinal.west` | `W` | none | `shared/qiblaCompass.ts:96` | One letter |

The denied state's button is `common.openSettings`. Its spoken label differs by one capital and is
`a11y.qibla.openSettings`. The cardinal letter is the React key of its SVG text today
(`components/sheets/screens/QiblaCompass.tsx:133`), so the key must come from the angle instead.

### 2.13 Help modal

The close button is `common.close`. Section 6 has the counts.

Rules for a translator, from the header of `shared/help.ts:1-15`: an answer names what to turn on
and never the route to it, and the app is never named. Setting names such as `Allow
Notifications`, `Background App Refresh`, `Low Power Mode`, `Time Sensitive Notifications`,
`Focus`, `Do Not Disturb`, `Battery Saver`, `Unrestricted` and `Alarm` are labels the phone's own
settings show, so each translation uses the label the OS shows in that language.

Each question is drawn at `components/modals/Help.tsx:70` and spoken at `:66`. Each answer text
is drawn at `:77` and each step at `:84`. Text wraps, so there is no length budget.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `modal.help.title` | `Help` | none | `components/modals/Help.tsx:126` | Modal title |
| `modal.help.action.dndAccess` | `Grant Do Not Disturb access` | none | `shared/help.ts:47`, drawn `components/modals/Help.tsx:96` | Spoken at `:95`. Android only |
| `help.noNotifications.question` | `Why don't I get any notifications?` | none | `shared/help.ts:54` | Both platforms. Straight apostrophe |
| `help.noNotifications.text` | `Without permission, notifications cannot be shown.` | none | `shared/help.ts:56`, `:60` | Both platforms, same bytes |
| `help.noNotifications.ios.step1` | `Turn on Allow Notifications in the app settings` | none | `shared/help.ts:57` | iOS |
| `help.noNotifications.android.step1` | `Turn on notifications in the app settings` | none | `shared/help.ts:61` | Android |
| `help.noNotifications.android.step2` | `Leave the athan categories on` | none | `shared/help.ts:61` | Android |
| `help.stoppedAfterDays.question` | `Why did notifications stop after a few days?` | none | `shared/help.ts:65` | Both platforms |
| `help.stoppedAfterDays.ios.text` | `Two settings stop new notifications being sent.` | none | `shared/help.ts:67` | iOS |
| `help.stoppedAfterDays.ios.step1` | `Turn on Background App Refresh in the app settings` | none | `shared/help.ts:68` | iOS |
| `help.stoppedAfterDays.ios.step2` | `Turn off Low Power Mode` | none | `shared/help.ts:68` | iOS |
| `help.stoppedAfterDays.android.text` | `Battery optimisation stops new notifications being sent.` | none | `shared/help.ts:71` | Android |
| `help.stoppedAfterDays.android.step1` | `Set battery usage to Unrestricted in the app settings` | none | `shared/help.ts:72` | Android |
| `help.stoppedAfterDays.android.step2` | `Turn off Battery Saver` | none | `shared/help.ts:72` | Android |
| `help.stoppedAfterRestart.question` | `Why did notifications stop after a restart?` | none | `shared/help.ts:76` | Both platforms |
| `help.stoppedAfterRestart.text` | `After rebooting the phone, the app is terminated.\nThis stops new notifications being sent.` | none | `shared/help.ts:78`, `:82` | Both platforms, same bytes. One hard line break |
| `help.stoppedAfterRestart.step1` | `Open this app after rebooting the phone` | none | `shared/help.ts:79`, `:83` | Both platforms, same bytes |
| `help.noSound.question` | `Why does a notification show but play no sound?` | none | `shared/help.ts:89` | Both platforms |
| `help.noSound.text` | `A silent phone mutes notification sound.` | none | `shared/help.ts:91`, `:95` | Both platforms, same bytes |
| `help.noSound.step1` | `Take the phone out of silent mode` | none | `shared/help.ts:92`, `:96` | Both platforms, same bytes |
| `help.silencedAtTimes.question` | `Why are notifications silenced at certain times?` | none | `shared/help.ts:100` | Both platforms |
| `help.silencedAtTimes.ios.text` | `Focus and Do Not Disturb modes silence notifications until this app is allowed through.` | none | `shared/help.ts:102` | iOS |
| `help.silencedAtTimes.ios.step1` | `Allow Time Sensitive Notifications in the app settings` | none | `shared/help.ts:103` | iOS |
| `help.silencedAtTimes.ios.step2` | `Allow this app in each Focus you use` | none | `shared/help.ts:103` | iOS |
| `help.silencedAtTimes.android.text` | `Do Not Disturb mode silences notifications until this app is allowed through.` | none | `shared/help.ts:106` | Android |
| `help.silencedAtTimes.android.step1` | `Allow Do Not Disturb access` | none | `shared/help.ts:107` | Android. This answer carries the `dndAccess` action |
| `help.quietAthan.question` | `Why is the athan so quiet?` | none | `shared/help.ts:112` | Android only: the iOS answer is null (`:113`) |
| `help.quietAthan.android.text` | `It plays at alarm volume, not ring volume.` | none | `shared/help.ts:115` | Android |
| `help.quietAthan.android.step1` | `Raise the Alarm volume in your sound settings` | none | `shared/help.ts:116` | Android |
| `help.cutOff.question` | `Why does the athan cut off early?` | none | `shared/help.ts:122` | Both platforms |
| `help.cutOff.text` | `Notification sounds are limited to 30 seconds.\nEvery athan is trimmed to fit.` | none | `shared/help.ts:124`, `:127` | Both platforms, same bytes. One hard line break. Constant 30. No steps |

The question string is the React key and the open-state value today, and the step string is a
React key (`components/modals/Help.tsx:82`, `:121`, `:142-145`). Two translated strings may
collide, so both must key on the topic id and the step position.

### 2.14 What's New modal

The close button is `common.close`. Section 6 says how the visible items are chosen. A title may
hold at most 32 characters and a body at most 96 (`shared/whatsNew.ts:135-137`, enforced by the
test named at `:127`). Those limits apply to every pack.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `modal.whatsNew.title` | `What's New` | none | `components/modals/WhatsNew.tsx:28` | Modal title. Straight apostrophe, capital `N` |
| `modal.whatsNew.version` | `v{version}` | `version` | `components/modals/WhatsNew.tsx:29` | `version` is the installed version, for example `1.29.305` |
| `modal.whatsNew.iosOnly` | `(iOS only)` | none | `components/modals/WhatsNew.tsx:45` | Follows an item body after one space, which the code supplies |
| `modal.whatsNew.androidOnly` | `(Android only)` | none | `components/modals/WhatsNew.tsx:45` | Same |
| `whatsNew.tabletSupport.title` | `Tablet support` | none | `shared/whatsNew.ts:79` | Stamped `1.26.32`. Title, 32 at most |
| `whatsNew.tabletSupport.body` | `Athan now supported on tablets` | none | `shared/whatsNew.ts:80` | Stamped `1.26.32`. Body, 96 at most. `Athan` is the app |
| `whatsNew.athanSounds.title` | `Athan sounds` | none | `shared/whatsNew.ts:84` | Stamped `1.26.32` |
| `whatsNew.athanSounds.body` | `New Athan sounds added` | none | `shared/whatsNew.ts:85` | Stamped `1.26.32` |
| `whatsNew.reminderSounds.title` | `Reminder sounds` | none | `shared/whatsNew.ts:89` | Stamped `1.26.32` |
| `whatsNew.reminderSounds.body` | `Every reminder now has its own sound` | none | `shared/whatsNew.ts:90` | Stamped `1.26.32` |
| `whatsNew.widgets.title` | `Home & Lock widgets` | none | `shared/whatsNew.ts:96` | Parked: `version: null`, flag `iosWidgets`, iOS only |
| `whatsNew.widgets.body` | `Add prayer times to your Home and Lock Screen` | none | `shared/whatsNew.ts:97` | Parked |
| `whatsNew.secondReminder.title` | `A second reminder` | none | `shared/whatsNew.ts:105` | Parked |
| `whatsNew.secondReminder.body` | `Each prayer can now carry two reminders, each with its own sound and timing` | none | `shared/whatsNew.ts:106` | Parked |
| `whatsNew.helpPage.title` | `Help page` | none | `shared/whatsNew.ts:112` | Parked |
| `whatsNew.helpPage.body` | `Settings now answers why an athan was not heard, and opens the setting that caused it` | none | `shared/whatsNew.ts:113` | Parked |
| `whatsNew.qiblaCompass.title` | `Qibla compass` | none | `shared/whatsNew.ts:119` | Parked |
| `whatsNew.qiblaCompass.body` | `Turn until it vibrates: the compass taps once when you face Makkah, so nothing needs reading` | none | `shared/whatsNew.ts:120` | Parked. 92 characters in English, the longest body |
| `whatsNew.language.title` | `Choose your language` | none | new | The 2.0.0 item. Title, 32 at most |
| `whatsNew.language.body` | `Settings now has a Language row` | none | new | The 2.0.0 item. Body, 96 at most |

The item title is the React key today (`components/modals/WhatsNew.tsx:32`). It must key on the
item id.

### 2.15 Update modal

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `modal.update.title` | `Update Available!` | none | `components/modals/Update.tsx:15` | Modal title |
| `modal.update.message` | `A new version is available.\nWould you like to update now?` | none | `components/modals/Update.tsx:17-18` | One Text, one hard line break between the two sentences. Centred in a card 85 percent wide, 400 at most |
| `modal.update.later` | `Later` | none | `components/modals/Update.tsx:26` | Spoken at `:25`. Button 160 wide at most |
| `modal.update.update` | `Update` | none | `components/modals/Update.tsx:33` | Spoken at `:32`. Button 160 wide at most |

### 2.16 Error screen

Today each literal has one leading and one trailing space inside it
(`components/ui/Error.tsx:37-39`, `:42`). The values below carry none and the code keeps the
spaces, so the drawn width does not change. This screen is also the root error boundary
(`app/_layout.tsx:41-44`), so it can draw before any store has loaded.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `error.heading` | `Oh no!` | none | `components/ui/Error.tsx:37` | Heading |
| `error.message` | `Something went wrong.` | none | `components/ui/Error.tsx:38` | |
| `error.advice` | `Try refreshing!` | none | `components/ui/Error.tsx:39` | |
| `error.refresh` | `Refresh` | none | `components/ui/Error.tsx:42` | Button text. The button has no role and no spoken label today |

### 2.17 Native alert dialogs

The OS lays these out. The buttons are `common.cancel` and `common.openSettings`.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `alert.notifications.title` | `Enable Notifications` | none | `hooks/useNotification.ts:58` | Dialog title |
| `alert.notifications.message` | `Prayer time notifications are disabled. Would you like to enable them in settings?` | none | `hooks/useNotification.ts:59` | Dialog message |
| `alert.location.title` | `Enable Location` | none | `device/qibla.ts:37` | Dialog title |
| `alert.location.message` | `The qibla is worked out from where you are, so it needs location access. Would you like to enable it in settings?` | none | `device/qibla.ts:38` | Dialog message |

### 2.18 Notifications and channels

All five are frozen. With the English pack each must produce the bytes a 1.x install already
holds, for every prayer, interval and athan number.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `notification.atTime` | `{prayer} now` | `prayer` | `shared/notifications.ts:130` | frozen. Title of the at-time alert, for example `Fajr now` |
| `notification.reminder` | `{prayer} in {minutes}m` | `prayer`, `minutes` | `shared/notifications.ts:181` | frozen. Title of a reminder, for example `Fajr in 15m`. `minutes` is 5, 10, 15, 20, 25 or 30 |
| `channel.athan` | `Athan {number}` | `number` | `shared/notifications.ts:410` | frozen. Android channel name, `number` 1 to 32 |
| `channel.extras` | `Extra Times` | none | `shared/notifications.ts:451` | frozen. Android channel name |
| `channel.reminder` | `{prayer} in {minutes}m Reminder` | `prayer`, `minutes` | `shared/notifications.ts:502` | frozen. Android channel name, for example `Last Third in 5m Reminder` |

`ago.now` has the same English bytes as `notification.atTime`. They are separate keys because
the surfaces and the meanings differ.

### 2.19 Widgets

Every widget text is one line (`evidence/widgets.md` 2.8). The values are today's literals inside
the layout functions. How a layout reaches them is document 04's subject. The Android widget
countdown uses `duration.hours` and `duration.minutes` from 2.5. The home widget's large name is
`prayerHero.<id>`. List rows and lock widgets draw `prayer.<id>`.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `widget.brand` | `Athan` | none | `widgets/PrayerWidget.tsx:759` | The app's name. Title of the error card. The neutral card's title at `:316` and `:524` stays a literal |
| `widget.errorBody` | `Open the app to refresh` | none | `widgets/PrayerWidget.tsx:759` | Home card after a render error, iOS |
| `widget.staleTitle` | `Out of date` | none | `widgets/PrayerWidget.tsx:328`, `:493`, `widgets/LockPrayerWidget.tsx:112`, `:265`, `:417` | Stale card title, home and lock |
| `widget.staleBody` | `Open Athan to refresh` | none | `widgets/PrayerWidget.tsx:331`, `:495` | Stale card, medium widget, one line. Holds the app's name |
| `widget.staleBodyLine1` | `Open Athan` | none | `widgets/PrayerWidget.tsx:334`, `:498` | Stale card, small widget, first of two lines. The sentence of `widget.staleBody` is split by hand |
| `widget.staleBodyLine2` | `to refresh` | none | `widgets/PrayerWidget.tsx:336`, `:499` | Second of the two lines. Read with line 1 it must make the sentence |
| `widget.lock.inlineStale` | `Athan — open to refresh times` | none | `widgets/LockPrayerWidget.tsx:97`, `:250`, `:399` | Inline lock stale. The dash is U+2014 with a space each side |
| `widget.lock.staleBody` | `Open app to refresh` | none | `widgets/LockPrayerWidget.tsx:115`, `:268`, `:420` | Rectangular lock stale, line 2 under `widget.staleTitle` |

Four widget strings are not keys. They belong to the neutral card, which is drawn when a widget
has no props, when the Android snapshot is missing, and as the lock layouts' fallback after a
render error. They stay English literals inside the layout functions (document 04, section 4,
decision 3):

| Literal | Site |
| --- | --- |
| `ATHAN` | `widgets/LockPrayerWidget.tsx:73`, `:226`, `:371` |
| `Prayer times for London` | `widgets/PrayerWidget.tsx:318`, `:524` |
| `Athan — prayer times` | `widgets/LockPrayerWidget.tsx:60`, `:213`, `:358` |
| `Open to load times` | `widgets/LockPrayerWidget.tsx:75`, `:228`, `:373` |

### 2.20 Accessibility-only

Read by a screen reader and never drawn.

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `a11y.home.loading` | `Loading prayer times` | none | `app/index.tsx:211` | The launch spinner |
| `a11y.countdown.waiting` | `No prayer time to count down to` | none | `components/countdown/Countdown.tsx:46` | Read in place of the drawn `...` |
| `a11y.countdown.bar` | `Prayer countdown: {percent} percent remaining` | `percent` | `components/countdown/Bar.tsx:166` | `percent` is a whole number, 0 to 100 |
| `a11y.bell.unavailable` | `{prayer} notification: unavailable` | `prayer` | `components/prayer/Alert.tsx:185` | The row's bell when its time cannot be read |
| `a11y.bell.off` | `{prayer} notification: off` | `prayer` | `components/prayer/Alert.tsx:186` with `:31` | Whole sentence per state, so the state word can agree with the rest |
| `a11y.bell.silent` | `{prayer} notification: silent` | `prayer` | `components/prayer/Alert.tsx:186` with `:32` | |
| `a11y.bell.sound` | `{prayer} notification: sound` | `prayer` | `components/prayer/Alert.tsx:186` with `:33` | |
| `a11y.bell.hintUnavailable` | `Explains why no alert can be set for this prayer` | none | `components/prayer/Alert.tsx:189` | Hint |
| `a11y.bell.hint` | `Opens the alert options for this prayer` | none | `components/prayer/Alert.tsx:189` | Hint |
| `a11y.overlay.close` | `Close prayer details` | none | `components/overlay/Overlay.tsx:109` | Shared by every press-catcher region of the overlay |
| `a11y.settings.whatsNew` | `What's new` | none | `components/sheets/screens/Settings.tsx:164` | Straight apostrophe. The drawn text is `settings.other.whatsNew` |
| `a11y.settings.resetColor` | `Reset to the default colour` | none | `components/sheets/screens/ColorPicker.tsx:116` | British spelling, as the source has it |
| `a11y.colorPicker.done` | `Done` | none | `components/sheets/screens/ColorPicker.tsx:151` | Icon-only button |
| `a11y.stepper.decrease` | `Decrease to {minutes} min` | `minutes` | `components/sheets/parts/Stepper.tsx:58` | `minutes` is the value the press moves to |
| `a11y.stepper.value` | `{minutes} min` | `minutes` | `components/sheets/parts/Stepper.tsx:69` | The current value |
| `a11y.stepper.increase` | `Increase to {minutes} min` | `minutes` | `components/sheets/parts/Stepper.tsx:75` | |
| `a11y.sound.preview` | `Preview {name}` | `name` | `components/sheets/parts/SoundItem.tsx:127` | `name` is `sheet.sound.item` already filled in |
| `a11y.sound.stopPreview` | `Stop previewing {name}` | `name` | `components/sheets/parts/SoundItem.tsx:127` | |
| `a11y.qibla.openSettings` | `Open settings` | none | `components/sheets/screens/Qibla.tsx:109` | Lower-case `s`. The drawn text is `common.openSettings` |
| `a11y.settings.language` | `Language: {language}` | `language` | new | The language row, naming the language in force |
| `a11y.sheet.language.option` | `{language}` | `language` | new | A row of the language list that is not selected |
| `a11y.sheet.language.selected` | `{language}, selected` | `language` | new | The row of the language in force |

### 2.21 Common

| Key | English value | Placeholders | Drawn today | Note |
| --- | --- | --- | --- | --- |
| `common.cancel` | `Cancel` | none | `hooks/useNotification.ts:62`, `device/qibla.ts:40` | Native alert button. Also the spoken label of the colour picker's icon-only cancel (`components/sheets/screens/ColorPicker.tsx:140`) |
| `common.openSettings` | `Open Settings` | none | `hooks/useNotification.ts:67`, `device/qibla.ts:41`, `components/sheets/screens/Qibla.tsx:112` | Native alert button and the qibla sheet's action. Opens the phone's settings |
| `common.close` | `Close` | none | `components/modals/WhatsNew.tsx:53`, `components/modals/Help.tsx:152` | Spoken at `WhatsNew.tsx:52`, `Help.tsx:151`. Button 160 wide |
| `common.closeToSave` | `Close to save` | none | `components/sheets/screens/Alert.tsx:96`, `components/sheets/screens/Sound.tsx:166` | Subtitle of the alert sheet and the sound sheet |

## 3. Strings built by concatenation or word order today

Each site below fixes English word order in code. The right column is what replaces it.

| Site | Built today | Replaced by |
| --- | --- | --- |
| `hooks/usePrayerAgo.ts:36` | name, a space, `now` | `ago.now` with `prayer` |
| `hooks/usePrayerAgo.ts:36` | name, duration, `ago` | `ago.since` with `prayer`, `duration` |
| `shared/time.ts:540-548` | number and unit letter, parts joined by a space | `duration.hours`, `duration.minutes`, `duration.seconds`, each with `n`. The join and the part order stay in code |
| `shared/time.ts:564-574` | `Xm`, `Xh`, `Xh Ym` | `duration.hours`, `duration.minutes` |
| `widgets/PrayerWidget.tsx:296-298` | the same three shapes inside the Android layout | `duration.hours`, `duration.minutes` |
| `shared/time.ts:229-233` | date-fns pattern `EEE, d MMM yyyy` | `date.gregorian` with `weekday`, `day`, `month`, `year`, fed by `date.weekdayShort.<n>` and `date.monthShort.<n>` |
| `shared/time.ts:241-254` | Intl long Hijri date, then ` AH` stripped by regex | `date.hijri` with `month`, `day`, `year`, fed by `date.hijriMonth.<n>` |
| `widgets/PrayerWidget.tsx:303-310`, `:545-555` | footer cut from the date label by comma split, space split and `slice(0, 3)` | `date.weekdayShort.<n>` for a Gregorian day. `date.hijriShort` with `month`, `day`, fed by `date.hijriMonthShort.<n>`, for a Hijri day |
| `widgets/PrayerWidget.tsx:378`, `:606` | upper-casing the baked name in the layout | `prayerHero.<id>` |
| `widgets/PrayerWidget.tsx:333-337`, `:497-500` | one sentence typed as two literals for two lines | `widget.staleBodyLine1`, `widget.staleBodyLine2` |
| `components/prayer/Alert.tsx:185-186` with `:31-33` | name, `notification:`, a state word picked from a table | `a11y.bell.unavailable`, `a11y.bell.off`, `a11y.bell.silent`, `a11y.bell.sound`, each with `prayer` |
| `components/countdown/Bar.tsx:166` | prefix, rounded number, suffix | `a11y.countdown.bar` with `percent` |
| `components/sheets/parts/Stepper.tsx:58`, `:69`, `:75` | verb, number, and a `unit` prop | `a11y.stepper.decrease`, `a11y.stepper.value`, `a11y.stepper.increase`, each with `minutes`. The unit word is inside the sentence |
| `components/sheets/parts/SoundItem.tsx:102` | `Athan`, a space, a number | `sheet.sound.item` with `number` |
| `components/sheets/parts/SoundItem.tsx:127` | verb, then the sound's name | `a11y.sound.preview`, `a11y.sound.stopPreview`, each with `name` |
| `components/modals/WhatsNew.tsx:29` | `v`, then the version | `modal.whatsNew.version` with `version` |
| `components/modals/WhatsNew.tsx:45` | ` (`, a platform word, ` only)` | `modal.whatsNew.iosOnly`, `modal.whatsNew.androidOnly`, whole strings |
| `components/sheets/screens/Alert.tsx:41-47` | five literals joined with line feeds | `sheet.alert.unavailable`, one string |
| `components/modals/Update.tsx:17-18` | two JSX text children with a line feed between | `modal.update.message`, one string |
| `components/sheets/screens/Alert.tsx:235`, `:247` | `Reminder` with a numeral typed in | `sheet.alert.reminder1.title`, `sheet.alert.reminder2.title` |
| `shared/qiblaPlace.ts:46` | locality, comma and space, country | `sheet.qibla.place` with `locality`, `country` |
| `shared/notifications.ts:130`, `:181` | name and a suffix | `notification.atTime`, `notification.reminder` |
| `shared/notifications.ts:410`, `:502` | word, number or name, suffix | `channel.athan`, `channel.reminder` |
| `shared/constants.ts:55-59` | prayer names typed into the explanations | `explanation.<id>`, whole sentences with no placeholder |
| `components/ui/Error.tsx:37-39`, `:42` | padding spaces inside the literal | `error.*` values without them. The code keeps the spaces |

Two sites keep a fixed order in code and get no key here:

- `components/sheets/parts/Stepper.tsx:70-71` draws the number and then `sheet.alert.reminder.unit`
  in two Text nodes.
- `widgets/LockPrayerWidget.tsx:140`, `:283`, `:450` draw the name, one space, then the time on
  the inline lock face.

## 4. Leaving the code

Strings and helpers that are removed and not replaced by a key.

| Leaving | Site | Why |
| --- | --- | --- |
| The toggle label `Show arabic names` | `components/sheets/screens/Settings.tsx:128-132` | The bilingual row goes |
| `showArabicNamesAtom` and its only reader | `stores/ui.ts:131-132`, `components/prayer/Prayer.tsx:36`, `:91` | Same. The stored key `preference_show_arabic_names` is no longer read |
| The Arabic name in the row | `components/prayer/Prayer.tsx:91-93`, style at `:113-116` | Same |
| The bilingual explanation line | `components/prayer/Explanation.tsx:79-80`, style at `:159-165`, prop at `:11`, `:32` | The box draws one language |
| `explanationArabic` in the overlay content | `components/overlay/overlayContent.ts:19`, `:58`, `components/overlay/OverlayInfoBox.tsx:71`, `:73`, `:83` | Same |
| `toArabicNumbers` and the whole of `shared/text.ts` | `shared/text.ts:1-27`, used only at `components/prayer/Explanation.tsx:6`, `:80`, tested by `shared/__tests__/text.test.ts` | Its one caller goes, and digits stay Latin |
| `TEXT.sizeArabic` and `TEXT.lineHeight.arabic` | `shared/constants.ts:300-301`, `:306-307`, read only at `components/prayer/Explanation.tsx:161`, `:164` | Only the bilingual line reads them |
| `PRAYERS_ARABIC`, `EXTRAS_ARABIC`, `EXTRAS_EXPLANATIONS_ARABIC` | `shared/constants.ts:15`, `:32`, `:1006-1012` | The bytes move to the Arabic pack (section 5) |
| The Arabic literal used as a filter | `shared/prayer.ts:325` | An identifier use of a display string |
| The `now` return of `formatTimeAgo` | `shared/time.ts:565` | Never drawn: the hook builds its own string first (`hooks/usePrayerAgo.ts:36`). `ago.now` covers the case |
| The ` AH` strip | `shared/time.ts:250` | It matches the English suffix only. `date.hijri` has no era |
| The `unit` prop of the stepper and its default | `components/sheets/parts/Stepper.tsx:43`, `components/sheets/screens/ReminderCard.tsx:75` | One caller, one unit. The spoken sentences hold the unit word |
| `ALERT_CONFIGS[...].spoken` | `components/prayer/Alert.tsx:30-34` | The state words move inside the four `a11y.bell.*` sentences |

## 5. Arabic bytes already in the code

Every Arabic-script literal in non-test source (searched `shared`, `stores`, `device`, `hooks`,
`components`, `app`, `widgets`, `api`, `mocks`, `modules`, `plugins` and `app.json` for U+0600 to
U+06FF). The key column is the key each one seeds in the Arabic pack, byte for byte.

| Site | Arabic bytes | Seeds |
| --- | --- | --- |
| `shared/constants.ts:15` | `الفجر` | `prayer.fajr` |
| `shared/constants.ts:15` | `الشروق` | `prayer.sunrise` |
| `shared/constants.ts:15` | `الظهر` | `prayer.dhuhr` |
| `shared/constants.ts:15` | `العصر` | `prayer.asr` |
| `shared/constants.ts:15` | `المغرب` | `prayer.magrib` |
| `shared/constants.ts:15` | `العشاء` | `prayer.isha` |
| `shared/constants.ts:32` | `نصف الليل` | `prayer.midnight` |
| `shared/constants.ts:32` | `آخر ثلث` | `prayer.lastThird` |
| `shared/constants.ts:32` | `السحور` | `prayer.suhoor` |
| `shared/constants.ts:32` | `الضحى` | `prayer.duha` |
| `shared/constants.ts:32` | `استجابة` | `prayer.istijaba` |
| `shared/constants.ts:1007` | `نصف الليل بين المغرب والفجر` | `explanation.midnight` |
| `shared/constants.ts:1008` | `عند بداية الثلث الأخير من الليل` | `explanation.lastThird` |
| `shared/constants.ts:1009` | `20 دقيقة قبل الفجر` | `explanation.suhoor` |
| `shared/constants.ts:1010` | `20 دقيقة بعد الشروق` | `explanation.duha` |
| `shared/constants.ts:1011` | `ساعة قبل المغرب (الجمعة فقط)` | `explanation.istijaba` |

Notes:

- Arabic script has no upper case, so the same eleven names also seed `prayerHero.<id>`.
- The source bytes at `shared/constants.ts:1009-1010` hold the ASCII digits `20`. Today they are
  drawn as Arabic-Indic digits through `toArabicNumbers` (`components/prayer/Explanation.tsx:80`).
  The pack keeps the source bytes, so the drawn digits become Latin.
- `shared/prayer.ts:325` repeats `استجابة` as a filter operand. It seeds nothing new.
- `shared/prayer.ts:289`, `:293` and `shared/types.ts:271` hold `الفجر` and `العشاء` in comments.
- `shared/text.ts:3-12` holds the ten Arabic-Indic digits, and `:16`, `:22` repeat some in
  comments. They leave with the helper and seed nothing.
- No other key has Arabic bytes in the code. The rest of the Arabic pack is new translation.

## 6. What's New and Help content

### What's New

- The content is one release object, `WHATS_NEW`, stamped `1.26.32`, with seven items
  (`shared/whatsNew.ts:75-124`). Each item is a title and a body: 14 strings.
- `VISIBLE_WHATS_NEW` keeps the items whose `version` equals the release's and whose flags are
  all on (`shared/whatsNew.ts:194-199`, `:210-220`). Three items pass today: `Tablet support`,
  `Athan sounds`, `Reminder sounds`. Four are parked with `version: null`.
- The modal opens by itself only when `WHATS_NEW.version` equals the installed version and the
  shown version differs (`shared/whatsNew.ts:167-179`). The installed version at the base commit
  is 1.29.305 (`app.json:5`), so it does not open by itself.
- The settings row still opens it, with the three visible items under the installed version
  number (`components/sheets/screens/Settings.tsx:159-172`, `app/index.tsx:220-226`). The row is
  hidden when nothing is visible.
- Limits: 4 items shown per release, 20 kept in the archive, 32 characters a title, 96 a body
  (`shared/whatsNew.ts:131-137`).
- Cost today: 6 visible strings and 8 parked ones, plus 4 modal strings. Cost of a later release
  that shows a modal: at most 8 new strings in every pack.

### Help

- `shared/help.ts` holds 36 literals: 7 questions, 13 answer texts, 15 steps and 1 action label
  (`shared/help.ts:46-130`).
- Four answer texts and two steps are the same bytes on both platforms, so 30 distinct strings
  remain: 7 questions, 9 answer texts, 13 steps and the action label.
- With the modal's title and its close button the Help modal holds 32 distinct strings. Its four
  glyphs are in section 7.
- iOS shows six topics and Android seven: `help.quietAthan` has no iOS answer
  (`shared/help.ts:113`, `:138-144`).

## 7. Outside the catalog at 2.0.0

Strings the OS owns at build time. They are compiled into the app and follow the phone's
language, never the app's setting.

| String | Site | Count |
| --- | --- | --- |
| App name `Athan` | `app.json:3`, `:23` | 1 |
| `Your location is used to work out which way Makkah is from where you are. It never leaves your phone.` | `app.json:24` | 1 |
| `Receive prayer time notifications` | `app.json:25` | 1 |
| Widget gallery names: `Next Prayer (Light)`, `Next Prayer (Dark)`, `Extra Times (Light)`, `Extra Times (Dark)`, and `Next Prayer` and `Extra Times` each with `(Layout 1)`, `(Layout 2)`, `(Layout 3)` | `app.json:207-372` | 14 kinds, 10 distinct |
| Widget gallery descriptions: `A countdown to the next prayer.`, `A countdown to the next extra time.`, `Countdown to the next prayer.`, `Countdown to the next extra time.`, `Next prayer time.`, `Next extra time.`, `Next prayer time with a countdown.`, `Next extra time with a countdown.` | `app.json:208-373` | 14 kinds, 8 distinct |

Text the app does not write:

- The ticking countdown on iOS widgets, which the OS formats (`widgets/PrayerWidget.tsx:615-619`,
  `widgets/LockPrayerWidget.tsx:171-183`, `:473-483`).
- The widget library's own messages when no layout is stored or a layout fails
  (`evidence/widgets.md` 2.7).
- The name of the notifications library's fallback channel, which silent alerts post to
  (`device/notifications.ts:96-97`, `:224-226`).
- The place names the OS geocoder returns for the qibla sheet (`device/qibla.ts:68-70`).

Symbols and number shapes that stay in code, because they carry no words:

| Symbol | Site |
| --- | --- |
| `--:--`, the unreadable time | `shared/constants.ts:268` |
| `...`, the waiting countdown name | `shared/constants.ts:275` |
| `HH:mm` prayer times | `shared/time.ts:175-178`, `components/prayer/Time.tsx:57` |
| The sound preview countdown, for example `0:27` | `components/sheets/parts/SoundItem.tsx:17-21` |
| The reminder minutes, `5` to `30` | `components/sheets/parts/Stepper.tsx:70` |
| U+203A chevron | `components/sheets/screens/Settings.tsx:97`, `:109`, `:170`, `:183`, `components/sheets/screens/ColorPicker.tsx:126`, `components/modals/Help.tsx:97` |
| U+2304 chevron, U+00BB step mark, `?` badge | `components/modals/Help.tsx:71`, `:83`, `:133` |
| U+2212 minus and `+` | `components/sheets/parts/Stepper.tsx:67`, `:84` |

Also not keys: every log line, and the thrown messages at `api/client.ts:30`, `:42`, `:80`,
`:108`, `:170`, `:197`, which reach the logger and the error state but never the screen. The
badge lookup words `iOS` and `Android` at `shared/whatsNew.ts:234-236` are not drawn.

## 8. Totals

| Area | Section | Keys |
| --- | --- | --- |
| Prayer names | 2.1 | 11 |
| Widget hero names | 2.2 | 11 |
| Extras explanations | 2.3 | 5 |
| Home screen | 2.4 | 1 |
| Countdown and ago | 2.5 | 5 |
| Day and dates | 2.6 | 46 |
| Overlay | 2.7 | 0 |
| Alert sheet | 2.8 | 12 |
| Sound sheet | 2.9 | 3 |
| Settings sheet | 2.10 | 18 |
| Language sheet | 2.11 | 3 |
| Qibla sheet | 2.12 | 13 |
| Help modal | 2.13 | 31 |
| What's New modal | 2.14 | 20 |
| Update modal | 2.15 | 4 |
| Error screen | 2.16 | 4 |
| Native alerts | 2.17 | 4 |
| Notifications and channels | 2.18 | 5 |
| Widgets | 2.19 | 8 |
| Accessibility-only | 2.20 | 22 |
| Common | 2.21 | 4 |
| **All** | | **230** |

Of the 230, eight are new for the language feature (three in 2.11, three in 2.20 and the two
What's New strings for 2.0.0), five are frozen, and eight are parked What's New strings that no
build draws at the base commit.
