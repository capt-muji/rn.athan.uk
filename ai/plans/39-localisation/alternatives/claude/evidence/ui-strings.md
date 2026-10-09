# Evidence: UI strings, prayer names, fonts and text layout

Facts only. Every citation is `path:line` from the repo root at base commit `c3149dfc`. No design
is proposed here.

Scope read in full: every non-test file under `components/`, `app/` and `hooks/`, ten `shared/`
modules, three store modules and two device modules. Section 7 lists them. Helper modules outside
that scope were read in part, only to cite the line where an imported string or formatter is
defined. Section 7 lists those partial reads too.

How to read the tables:

- One row per source literal. A literal that is drawn and also spoken by a screen reader from a
  second source line gets a second row.
- "Data" means the text is not a literal at the cited line. It is a field or a function result,
  and the row says where it comes from.
- Verbatim text sits in backticks. `\n` marks a real line break in the string.

## 1. User-visible strings

### 1.1 Home screen: loading, countdown, date, prayer rows, overlay, error

| ID | file:line | Exact text | Surface | How it is built | Owner |
| --- | --- | --- | --- | --- | --- |
| H01 | `app/index.tsx:211` | `Loading prayer times` | accessibilityLabel | Static | `Index`, loading View with role `progressbar` |
| H02 | `components/countdown/Countdown.tsx:47` (source `stores/countdown.ts:413`, `:414`, `:430`) | Prayer name, for example `Fajr` | Text | Data: the `english` field of the next prayer, or of the overlay's selected prayer, copied into the countdown atom | `Countdown` through `useCountdown` (`hooks/useCountdown.ts:47`) |
| H03 | `shared/constants.ts:275` (written `stores/countdown.ts:423`, drawn `components/countdown/Countdown.tsx:47`) | `...` | Text | Static constant `COUNTDOWN_WAITING_NAME`, used while the list waits for its day to end | `writeDisplayCountdown` |
| H04 | `components/countdown/Countdown.tsx:46` | `No prayer time to count down to` | accessibilityLabel | Static. Picked when the drawn name equals `...`, otherwise no label | `Countdown` |
| H05 | `components/countdown/Countdown.tsx:49` (built `stores/countdown.ts:86`, `shared/time.ts:540`, `:545`, `:548`) | Countdown, for example `1h 1m`, `9m 59s`, `45s` | Text (Animated.Text) | Template: `${totalHours}h`, `${minutes}m`, `${secs}s`, joined with one space. Unit letters are hard-coded | `formatTime` |
| H06 | `shared/time.ts:529` | `0s` | Text | Static return for a negative input | `formatTime` |
| H07 | `shared/constants.ts:268` (drawn `components/countdown/Countdown.tsx:49` through `stores/countdown.ts:86`, and `components/prayer/Time.tsx:35`, `:57`) | `--:--` | Text | Static constant `UNAVAILABLE_TIME` | Countdown display atom, `PrayerTime` |
| H08 | `components/countdown/Bar.tsx:166` | `Prayer countdown: ${Math.round(progress)} percent remaining` | accessibilityLabel | Template with one rounded number | `CountdownBar` |
| H09 | `components/day/Day.tsx:48` | `London, UK` | Text | Static | `Day` |
| H10 | `components/day/Day.tsx:49` (built `components/day/shownDate.ts:34`, `shared/time.ts:232`) | Gregorian date, for example `Fri, 20 Nov 2024` | Text | date-fns `format(date, 'EEE, d MMM yyyy')` with no locale argument, so English weekday and month abbreviations | `formatDateLong` |
| H11 | `components/day/Day.tsx:49` (built `components/day/shownDate.ts:34`, `shared/time.ts:243-250`) | Hijri date, for example `Rajab 1, 1447` | Text | `Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura')` with numeric day, long month, numeric year. A trailing ` AH` is removed by regex. Falls back to H10 on a throw | `formatHijriDateLong` |
| H12 | `components/prayer/Prayer.tsx:89` (defined `shared/constants.ts:9`, `:26`; assigned `shared/prayer.ts:388`, `:416`) | `Fajr`, `Sunrise`, `Dhuhr`, `Asr`, `Magrib`, `Isha`, `Midnight`, `Last Third`, `Suhoor`, `Duha`, `Istijaba` | Text (Animated.Text) | Data: `Prayer.english` | `Prayer` row |
| H13 | `components/prayer/Prayer.tsx:92` (defined `shared/constants.ts:15`, `:32`; assigned `shared/prayer.ts:389`, `:417`) | `الفجر`, `الشروق`, `الظهر`, `العصر`, `المغرب`, `العشاء`, `نصف الليل`, `آخر ثلث`, `السحور`, `الضحى`, `استجابة` | Text (Animated.Text) | Data: `Prayer.arabic`. Drawn only while `showArabicNamesAtom` is true (`components/prayer/Prayer.tsx:91`) | `Prayer` row |
| H14 | `components/prayer/Time.tsx:57` | Prayer time, for example `06:12` | Text (Animated.Text) | Data: the row's `time` string in `HH:mm`, stored or made by `formatPrayerTime` (`shared/time.ts:175-178`). `--:--` when null | `PrayerTime` |
| H15 | `components/prayer/Alert.tsx:185` | `${Prayer.english} notification: unavailable` | accessibilityLabel | Template with the English name | Row bell `Alert` |
| H16 | `components/prayer/Alert.tsx:186` with `:31` | `${Prayer.english} notification: off` | accessibilityLabel | Template. The state word is `ALERT_CONFIGS[alertAtom].spoken` | Row bell `Alert` |
| H17 | `components/prayer/Alert.tsx:186` with `:32` | `${Prayer.english} notification: silent` | accessibilityLabel | Same template | Row bell `Alert` |
| H18 | `components/prayer/Alert.tsx:186` with `:33` | `${Prayer.english} notification: sound` | accessibilityLabel | Same template | Row bell `Alert` |
| H19 | `components/prayer/Alert.tsx:189` | `Explains why no alert can be set for this prayer` | accessibilityHint | Static, conditional pick | Row bell `Alert` |
| H20 | `components/prayer/Alert.tsx:189` | `Opens the alert options for this prayer` | accessibilityHint | Static, conditional pick | Row bell `Alert` |
| H21 | `components/prayer/Ago.tsx:54` (built `hooks/usePrayerAgo.ts:36`) | `${prevPrayer.english} now` | Text (Animated.Text) | Template: English name, then the word `now`. Used under 60 seconds | `calculatePrayerAgo` |
| H22 | `components/prayer/Ago.tsx:54` (built `hooks/usePrayerAgo.ts:36`, `shared/time.ts:568`, `:572`, `:573`) | `${prevPrayer.english} ${timeAgo} ago`, for example `Asr 2h 30m ago` | Text (Animated.Text) | Template: English name, a duration (`Xm`, `Xh` or `Xh Ym`), then the word `ago`. Word order is fixed in code | `calculatePrayerAgo`, `formatTimeAgo` |
| H23 | `shared/time.ts:565` | `now` | Not drawn today | Static return of `formatTimeAgo` under 60 seconds. `calculatePrayerAgo` handles that case itself, so this value does not reach the screen | `formatTimeAgo` |
| H24 | `components/overlay/Overlay.tsx:109` | `Close prayer details` | accessibilityLabel | Static. Shared by every press-catcher region, up to four | `Overlay` |
| H25 | `components/prayer/Explanation.tsx:67` (source `components/overlay/OverlayInfoBox.tsx:71`, `components/overlay/overlayContent.ts:56`) | Extras prayer English name | Text | Data: `selectedPrayer.english` | `PrayerExplanation` |
| H26 | `shared/constants.ts:55` (drawn `components/prayer/Explanation.tsx:77`) | `Halfway between Magrib and Fajr` | Text | Static array entry, picked by the position of the English name in `EXTRAS_ENGLISH` (`components/overlay/overlayContent.ts:53`, `:57`) | `EXTRAS_EXPLANATIONS` |
| H27 | `shared/constants.ts:56` (drawn `components/prayer/Explanation.tsx:77`) | `Start of the last third of the night` | Text | Same | `EXTRAS_EXPLANATIONS` |
| H28 | `shared/constants.ts:57` (drawn `components/prayer/Explanation.tsx:77`) | `20 mins before Fajr` | Text | Same | `EXTRAS_EXPLANATIONS` |
| H29 | `shared/constants.ts:58` (drawn `components/prayer/Explanation.tsx:77`) | `20 mins after Sunrise` | Text | Same | `EXTRAS_EXPLANATIONS` |
| H30 | `shared/constants.ts:59` (drawn `components/prayer/Explanation.tsx:77`) | `1 hour before Magrib (Fridays only)` | Text | Same | `EXTRAS_EXPLANATIONS` |
| H31 | `shared/constants.ts:1007` (drawn `components/prayer/Explanation.tsx:80`) | `نصف الليل بين المغرب والفجر` | Text | Static array entry, picked the same way (`components/overlay/overlayContent.ts:58`), then passed through `toArabicNumbers` | `EXTRAS_EXPLANATIONS_ARABIC` |
| H32 | `shared/constants.ts:1008` (drawn `components/prayer/Explanation.tsx:80`) | `عند بداية الثلث الأخير من الليل` | Text | Same | `EXTRAS_EXPLANATIONS_ARABIC` |
| H33 | `shared/constants.ts:1009` (drawn `components/prayer/Explanation.tsx:80`) | `20 دقيقة قبل الفجر` | Text | Same. The digits `20` are turned into Arabic-Indic digits at draw time (`shared/text.ts:25-27`) | `EXTRAS_EXPLANATIONS_ARABIC` |
| H34 | `shared/constants.ts:1010` (drawn `components/prayer/Explanation.tsx:80`) | `20 دقيقة بعد الشروق` | Text | Same, digits converted | `EXTRAS_EXPLANATIONS_ARABIC` |
| H35 | `shared/constants.ts:1011` (drawn `components/prayer/Explanation.tsx:80`) | `ساعة قبل المغرب (الجمعة فقط)` | Text | Same | `EXTRAS_EXPLANATIONS_ARABIC` |
| H36 | `components/ui/Error.tsx:37` | `Oh no!` with one leading and one trailing space inside the literal | Text | Static | `ErrorScreen` |
| H37 | `components/ui/Error.tsx:38` | `Something went wrong.` with one leading and one trailing space | Text | Static | `ErrorScreen` |
| H38 | `components/ui/Error.tsx:39` | `Try refreshing!` with one leading and one trailing space | Text | Static | `ErrorScreen` |
| H39 | `components/ui/Error.tsx:42` | `Refresh` with one leading and one trailing space | Button text | Static. The Pressable has no accessibilityRole and no accessibilityLabel (`components/ui/Error.tsx:41`) | `ErrorScreen` |

The error screen is also what the root `ErrorBoundary` renders (`app/_layout.tsx:41-44`), so it
can draw before any store has loaded.

### 1.2 Modals: update, what's new, help

| ID | file:line | Exact text | Surface | How it is built | Owner |
| --- | --- | --- | --- | --- | --- |
| M01 | `components/modals/Update.tsx:15` (drawn `components/modals/Modal.tsx:101`) | `Update Available!` | Modal title | Static | `ModalUpdate` |
| M02 | `components/modals/Update.tsx:17` | `A new version is available.` | Text | Static. First child of one Text node | `ModalUpdate` |
| M03 | `components/modals/Update.tsx:18` | `Would you like to update now?` | Text | Static. Same Text node as M02, after an explicit `{'\n'}` | `ModalUpdate` |
| M04 | `components/modals/Update.tsx:25` | `Later` | accessibilityLabel | Static | `ModalUpdate` |
| M05 | `components/modals/Update.tsx:26` | `Later` | Button text | Static | `ModalUpdate` |
| M06 | `components/modals/Update.tsx:32` | `Update` | accessibilityLabel | Static | `ModalUpdate` |
| M07 | `components/modals/Update.tsx:33` | `Update` | Button text | Static | `ModalUpdate` |
| M08 | `components/modals/WhatsNew.tsx:28` (drawn `components/modals/Modal.tsx:101`) | `What's New` | Modal title | Static | `ModalWhatsNew` |
| M09 | `components/modals/WhatsNew.tsx:29` | `v{version}`, for example `v1.26.32` | Text | Template: the letter `v`, then the installed version | `ModalWhatsNew` |
| M10 | `components/modals/WhatsNew.tsx:45` | ` (iOS only)` or ` (Android only)` | Text, nested in the body Text | Template: ` (`, a platform word picked by condition, ` only)` | `ModalWhatsNew` |
| M11 | `components/modals/WhatsNew.tsx:52` | `Close` | accessibilityLabel | Static | `ModalWhatsNew` |
| M12 | `components/modals/WhatsNew.tsx:53` | `Close` | Button text | Static | `ModalWhatsNew` |
| M13 | `shared/whatsNew.ts:79` (drawn `components/modals/WhatsNew.tsx:41`) | `Tablet support` | Text | Static item title, stamped `1.26.32` | `WHATS_NEW` |
| M14 | `shared/whatsNew.ts:80` (drawn `components/modals/WhatsNew.tsx:43`) | `Athan now supported on tablets` | Text | Static item body | `WHATS_NEW` |
| M15 | `shared/whatsNew.ts:84` | `Athan sounds` | Text | Static item title, stamped `1.26.32` | `WHATS_NEW` |
| M16 | `shared/whatsNew.ts:85` | `New Athan sounds added` | Text | Static item body | `WHATS_NEW` |
| M17 | `shared/whatsNew.ts:89` | `Reminder sounds` | Text | Static item title, stamped `1.26.32` | `WHATS_NEW` |
| M18 | `shared/whatsNew.ts:90` | `Every reminder now has its own sound` | Text | Static item body | `WHATS_NEW` |
| M19 | `shared/whatsNew.ts:96` | `Home & Lock widgets` | Text | Static item title. Parked: `version: null`, flag `iosWidgets` | `WHATS_NEW` |
| M20 | `shared/whatsNew.ts:97` | `Add prayer times to your Home and Lock Screen` | Text | Static item body, parked | `WHATS_NEW` |
| M21 | `shared/whatsNew.ts:106` | `A second reminder` | Text | Static item title, parked | `WHATS_NEW` |
| M22 | `shared/whatsNew.ts:107` | `Each prayer can now carry two reminders, each with its own sound and timing` | Text | Static item body, parked | `WHATS_NEW` |
| M23 | `shared/whatsNew.ts:112` | `Help page` | Text | Static item title, parked | `WHATS_NEW` |
| M24 | `shared/whatsNew.ts:113` | `Settings now answers why an athan was not heard, and opens the setting that caused it` | Text | Static item body, parked | `WHATS_NEW` |
| M25 | `shared/whatsNew.ts:119` | `Qibla compass` | Text | Static item title, parked | `WHATS_NEW` |
| M26 | `shared/whatsNew.ts:120` | `Turn until it vibrates: the compass taps once when you face Makkah, so nothing needs reading` | Text | Static item body, parked | `WHATS_NEW` |
| M27 | `components/modals/Help.tsx:126` (drawn `components/modals/Modal.tsx:101`) | `Help` | Modal title | Static | `ModalHelp` |
| M28 | `components/modals/Help.tsx:133` | `?` | Text | Static glyph in the title badge | `ModalHelp` |
| M29 | `components/modals/Help.tsx:71` | U+2304 (down arrowhead) | Text (Animated.Text) | Static glyph, rotated by animation | `Topic` |
| M30 | `components/modals/Help.tsx:83` | U+00BB (`»`) | Text | Static glyph, one per step | `Topic` |
| M31 | `components/modals/Help.tsx:97` | U+203A (`›`) | Text | Static glyph after the action label | `Topic` |
| M32 | `components/modals/Help.tsx:151` | `Close` | accessibilityLabel | Static | `ModalHelp` |
| M33 | `components/modals/Help.tsx:152` | `Close` | Button text | Static | `ModalHelp` |
| M34 | `shared/help.ts:47` (drawn `components/modals/Help.tsx:95`, `:96`) | `Grant Do Not Disturb access` | Button text and accessibilityLabel | Static record value, looked up by action id | `HELP_ACTION_LABELS` |

Help topics. Each question is drawn at `components/modals/Help.tsx:70` and spoken at `:66`. Each
answer text is drawn at `:77`. Each step is drawn at `:84`. `getHelpTopics` picks the iOS or the
Android answer (`shared/help.ts:138-144`, called at `components/modals/Help.tsx:120`).

| ID | file:line | Exact text | Surface | How it is built | Owner |
| --- | --- | --- | --- | --- | --- |
| M35 | `shared/help.ts:54` | `Why don't I get any notifications?` | Text and accessibilityLabel | Static question | `HELP_ENTRIES` |
| M36 | `shared/help.ts:56` | `Without permission, notifications cannot be shown.` | Text | Static, iOS answer | `HELP_ENTRIES` |
| M37 | `shared/help.ts:57` | `Turn on Allow Notifications in the app settings` | Text | Static, iOS step | `HELP_ENTRIES` |
| M38 | `shared/help.ts:60` | `Without permission, notifications cannot be shown.` | Text | Static, Android answer | `HELP_ENTRIES` |
| M39 | `shared/help.ts:61` | `Turn on notifications in the app settings` | Text | Static, Android step | `HELP_ENTRIES` |
| M40 | `shared/help.ts:61` | `Leave the athan categories on` | Text | Static, Android step | `HELP_ENTRIES` |
| M41 | `shared/help.ts:65` | `Why did notifications stop after a few days?` | Text and accessibilityLabel | Static question | `HELP_ENTRIES` |
| M42 | `shared/help.ts:67` | `Two settings stop new notifications being sent.` | Text | Static, iOS answer | `HELP_ENTRIES` |
| M43 | `shared/help.ts:68` | `Turn on Background App Refresh in the app settings` | Text | Static, iOS step | `HELP_ENTRIES` |
| M44 | `shared/help.ts:68` | `Turn off Low Power Mode` | Text | Static, iOS step | `HELP_ENTRIES` |
| M45 | `shared/help.ts:71` | `Battery optimisation stops new notifications being sent.` | Text | Static, Android answer | `HELP_ENTRIES` |
| M46 | `shared/help.ts:72` | `Set battery usage to Unrestricted in the app settings` | Text | Static, Android step | `HELP_ENTRIES` |
| M47 | `shared/help.ts:72` | `Turn off Battery Saver` | Text | Static, Android step | `HELP_ENTRIES` |
| M48 | `shared/help.ts:76` | `Why did notifications stop after a restart?` | Text and accessibilityLabel | Static question | `HELP_ENTRIES` |
| M49 | `shared/help.ts:78` | `After rebooting the phone, the app is terminated.\nThis stops new notifications being sent.` | Text | Static, iOS answer, one hard line break | `HELP_ENTRIES` |
| M50 | `shared/help.ts:79` | `Open this app after rebooting the phone` | Text | Static, iOS step | `HELP_ENTRIES` |
| M51 | `shared/help.ts:82` | `After rebooting the phone, the app is terminated.\nThis stops new notifications being sent.` | Text | Static, Android answer, one hard line break | `HELP_ENTRIES` |
| M52 | `shared/help.ts:83` | `Open this app after rebooting the phone` | Text | Static, Android step | `HELP_ENTRIES` |
| M53 | `shared/help.ts:89` | `Why does a notification show but play no sound?` | Text and accessibilityLabel | Static question | `HELP_ENTRIES` |
| M54 | `shared/help.ts:91` | `A silent phone mutes notification sound.` | Text | Static, iOS answer | `HELP_ENTRIES` |
| M55 | `shared/help.ts:92` | `Take the phone out of silent mode` | Text | Static, iOS step | `HELP_ENTRIES` |
| M56 | `shared/help.ts:95` | `A silent phone mutes notification sound.` | Text | Static, Android answer | `HELP_ENTRIES` |
| M57 | `shared/help.ts:96` | `Take the phone out of silent mode` | Text | Static, Android step | `HELP_ENTRIES` |
| M58 | `shared/help.ts:100` | `Why are notifications silenced at certain times?` | Text and accessibilityLabel | Static question | `HELP_ENTRIES` |
| M59 | `shared/help.ts:102` | `Focus and Do Not Disturb modes silence notifications until this app is allowed through.` | Text | Static, iOS answer | `HELP_ENTRIES` |
| M60 | `shared/help.ts:103` | `Allow Time Sensitive Notifications in the app settings` | Text | Static, iOS step | `HELP_ENTRIES` |
| M61 | `shared/help.ts:103` | `Allow this app in each Focus you use` | Text | Static, iOS step | `HELP_ENTRIES` |
| M62 | `shared/help.ts:106` | `Do Not Disturb mode silences notifications until this app is allowed through.` | Text | Static, Android answer | `HELP_ENTRIES` |
| M63 | `shared/help.ts:107` | `Allow Do Not Disturb access` | Text | Static, Android step. This topic carries the `dndAccess` action (`shared/help.ts:108`) | `HELP_ENTRIES` |
| M64 | `shared/help.ts:112` | `Why is the athan so quiet?` | Text and accessibilityLabel | Static question. Android only: the iOS answer is null (`shared/help.ts:113`) | `HELP_ENTRIES` |
| M65 | `shared/help.ts:115` | `It plays at alarm volume, not ring volume.` | Text | Static, Android answer | `HELP_ENTRIES` |
| M66 | `shared/help.ts:116` | `Raise the Alarm volume in your sound settings` | Text | Static, Android step | `HELP_ENTRIES` |
| M67 | `shared/help.ts:122` | `Why does the athan cut off early?` | Text and accessibilityLabel | Static question | `HELP_ENTRIES` |
| M68 | `shared/help.ts:124` | `Notification sounds are limited to 30 seconds.\nEvery athan is trimmed to fit.` | Text | Static, iOS answer, one hard line break | `HELP_ENTRIES` |
| M69 | `shared/help.ts:127` | `Notification sounds are limited to 30 seconds.\nEvery athan is trimmed to fit.` | Text | Static, Android answer, one hard line break | `HELP_ENTRIES` |

Strings used as identity in the modals:

- The question string is the React key and the open-state value (`components/modals/Help.tsx:121`,
  `:142-145`). The step string is the React key of its row (`components/modals/Help.tsx:82`).
- The item title is the React key in What's New (`components/modals/WhatsNew.tsx:32`).
- `iOS` and `Android` at `shared/whatsNew.ts:234-236` and `components/modals/WhatsNew.tsx:10-13`
  are lookup keys for badge glyphs. They are not drawn as text.

### 1.3 Sheets: settings, colour picker, alert, sound, qibla

| ID | file:line | Exact text | Surface | How it is built | Owner |
| --- | --- | --- | --- | --- | --- |
| T01 | `components/sheets/screens/Settings.tsx:75` (drawn `components/sheets/parts/Header.tsx:31`) | `Settings` | Sheet title | Static | `BottomSheetSettings` |
| T02 | `components/sheets/screens/Settings.tsx:76` (drawn `components/sheets/parts/Header.tsx:32`) | `Set your preferences` | Sheet subtitle | Static | `BottomSheetSettings` |
| T03 | `components/sheets/screens/Settings.tsx:86` | `Prayer` | Text, card title | Static | `BottomSheetSettings` |
| T04 | `components/sheets/screens/Settings.tsx:91` | `Change athan` | accessibilityLabel | Static | `BottomSheetSettings` |
| T05 | `components/sheets/screens/Settings.tsx:96` | `Change athan` | Button text | Static | `BottomSheetSettings` |
| T06 | `components/sheets/screens/Settings.tsx:97`, `:109`, `:170`, `:183` | U+203A (`›`) | Text | Static chevron glyph, four rows | `BottomSheetSettings` |
| T07 | `components/sheets/screens/Settings.tsx:103` | `Qibla` | accessibilityLabel | Static | `BottomSheetSettings` |
| T08 | `components/sheets/screens/Settings.tsx:108` | `Qibla` | Button text | Static | `BottomSheetSettings` |
| T09 | `components/sheets/screens/Settings.tsx:115` | `Display` | Text, card title | Static | `BottomSheetSettings` |
| T10 | `components/sheets/screens/Settings.tsx:118` | `Show hijri date` | Text and accessibilityLabel | Static prop. `LabeledToggle` draws it (`components/sheets/parts/LabeledToggle.tsx:31`) and gives it to the row and the switch as their label (`:30`, `:32`) | `BottomSheetSettings` |
| T11 | `components/sheets/screens/Settings.tsx:122` | `Show seconds` | Text and accessibilityLabel | Same | `BottomSheetSettings` |
| T12 | `components/sheets/screens/Settings.tsx:124` | `Show time passed` | Text and accessibilityLabel | Same | `BottomSheetSettings` |
| T13 | `components/sheets/screens/Settings.tsx:129` | `Show arabic names` | Text and accessibilityLabel | Same | `BottomSheetSettings` |
| T14 | `components/sheets/screens/Settings.tsx:135` | `Show decorations` | Text and accessibilityLabel | Same. Shown only in the decoration season (`components/sheets/screens/Settings.tsx:39`, `:133`) | `BottomSheetSettings` |
| T15 | `components/sheets/screens/Settings.tsx:145` | `Countdown Bar` | Text, card title | Static | `BottomSheetSettings` |
| T16 | `components/sheets/screens/Settings.tsx:148` | `Show countdown bar` | Text and accessibilityLabel | Same as T10 | `BottomSheetSettings` |
| T17 | `components/sheets/screens/Settings.tsx:158` | `Other` | Text, card title | Static | `BottomSheetSettings` |
| T18 | `components/sheets/screens/Settings.tsx:164` | `What's new` (straight apostrophe) | accessibilityLabel | Static | `BottomSheetSettings` |
| T19 | `components/sheets/screens/Settings.tsx:169` | `What’s new` (U+2019, written as `&#8217;`) | Button text | Static | `BottomSheetSettings` |
| T20 | `components/sheets/screens/Settings.tsx:177` | `Help` | accessibilityLabel | Static | `BottomSheetSettings` |
| T21 | `components/sheets/screens/Settings.tsx:182` | `Help` | Button text | Static | `BottomSheetSettings` |
| T22 | `components/sheets/screens/ColorPicker.tsx:107` | `Countdown bar color` | accessibilityLabel | Static | `ColorPickerSettings` |
| T23 | `components/sheets/screens/ColorPicker.tsx:108` | `Countdown bar color` | Text | Static | `ColorPickerSettings` |
| T24 | `components/sheets/screens/ColorPicker.tsx:116` | `Reset to the default colour` | accessibilityLabel | Static | `ColorPickerSettings` |
| T25 | `components/sheets/screens/ColorPicker.tsx:121` | `Reset` | Button text | Static | `ColorPickerSettings` |
| T26 | `components/sheets/screens/ColorPicker.tsx:126` | U+203A (`›`) | Text | Static chevron glyph | `ColorPickerSettings` |
| T27 | `components/sheets/screens/ColorPicker.tsx:140` | `Cancel` | accessibilityLabel | Static, icon-only button | `ColorPickerSettings` |
| T28 | `components/sheets/screens/ColorPicker.tsx:144` | `Select Color` | Text, picker title | Static | `ColorPickerSettings` |
| T29 | `components/sheets/screens/ColorPicker.tsx:151` | `Done` | accessibilityLabel | Static, icon-only button | `ColorPickerSettings` |
| T30 | `components/sheets/screens/Alert.tsx:95` (drawn `components/sheets/parts/Header.tsx:31`) | English prayer name, or an empty string | Sheet title | Data: `sheetState.prayerEnglish`, set at `components/prayer/Alert.tsx:157` | `BottomSheetAlert` |
| T31 | `components/sheets/screens/Alert.tsx:96` | `Close to save` | Sheet subtitle | Static | `BottomSheetAlert` |
| T32 | `components/sheets/screens/Alert.tsx:41-47` (drawn `:105`) | `This prayer's time isn't available\nright now, so no alert will go off.\n\nYour alert setting is kept and will\nreturn once a time is available.` | Text | Five literals joined with `\n`. The line breaks are fixed in code | `UNAVAILABLE_MESSAGE` |
| T33 | `components/sheets/screens/Alert.tsx:222` | `Athan` | Text, card title | Static | `AlertSheetBody` |
| T34 | `components/sheets/screens/Alert.tsx:223` | `Notification at prayer time` | Text, card hint | Static | `AlertSheetBody` |
| T35 | `components/sheets/screens/Alert.tsx:31` (drawn `components/sheets/parts/SegmentedControl.tsx:96`, spoken `:85`) | `Off` | Text and accessibilityLabel | Static option label | `ALERT_OPTIONS` |
| T36 | `components/sheets/screens/Alert.tsx:32` | `Silent` | Text and accessibilityLabel | Static option label | `ALERT_OPTIONS` |
| T37 | `components/sheets/screens/Alert.tsx:33` | `Sound` | Text and accessibilityLabel | Static option label | `ALERT_OPTIONS` |
| T38 | `components/sheets/screens/Alert.tsx:235` (drawn `components/sheets/screens/ReminderCard.tsx:57`) | `Reminder 1` | Text, card title | Static, numeral inside the literal | `AlertSheetBody` |
| T39 | `components/sheets/screens/Alert.tsx:247` (drawn `components/sheets/screens/ReminderCard.tsx:57`) | `Reminder 2` | Text, card title | Static, numeral inside the literal | `AlertSheetBody` |
| T40 | `components/sheets/screens/Alert.tsx:236`, `:248` (drawn `components/sheets/screens/ReminderCard.tsx:58`) | `Notification before prayer time` | Text, card hint | Static, written twice | `AlertSheetBody` |
| T41 | `components/sheets/screens/ReminderCard.tsx:10` (drawn `components/sheets/parts/SegmentedControl.tsx:96`, spoken `:85`) | `Silent` | Text and accessibilityLabel | Static option label | `SOUND_OPTIONS` |
| T42 | `components/sheets/screens/ReminderCard.tsx:11` | `Sound` | Text and accessibilityLabel | Static option label | `SOUND_OPTIONS` |
| T43 | `components/sheets/screens/ReminderCard.tsx:65` | `Sound` | Text, row label | Static | `ReminderCard` |
| T44 | `components/sheets/screens/ReminderCard.tsx:70` | `Before` | Text, row label | Static | `ReminderCard` |
| T45 | `components/sheets/screens/ReminderCard.tsx:75` (default `components/sheets/parts/Stepper.tsx:43`, drawn `:71`) | `min` | Text | Static unit prop. Not pluralised | `ReminderCard`, `Stepper` |
| T46 | `components/sheets/parts/Stepper.tsx:70` | Reminder minutes, one of `5`, `10`, `15`, `20`, `25`, `30` | Text | Data: the number rendered directly (`shared/constants.ts:95`) | `Stepper` |
| T47 | `components/sheets/parts/Stepper.tsx:58` | `Decrease to ${nextDown ?? value} ${unit}` | accessibilityLabel | Template: number and unit | `Stepper` |
| T48 | `components/sheets/parts/Stepper.tsx:69` | `${value} ${unit}` | accessibilityLabel | Template: number and unit | `Stepper` |
| T49 | `components/sheets/parts/Stepper.tsx:75` | `Increase to ${nextUp ?? value} ${unit}` | accessibilityLabel | Template: number and unit | `Stepper` |
| T50 | `components/sheets/parts/Stepper.tsx:67` | U+2212 (`−`) | Button text | Static glyph | `Stepper` |
| T51 | `components/sheets/parts/Stepper.tsx:84` | `+` | Button text | Static glyph | `Stepper` |
| T52 | `components/sheets/screens/Sound.tsx:165` | `Select Athan` | Sheet title | Static | `BottomSheetSound` |
| T53 | `components/sheets/screens/Sound.tsx:166` | `Close to save` | Sheet subtitle | Static | `BottomSheetSound` |
| T54 | `components/sheets/screens/Sound.tsx:178` | `Notification sound` | Text, card hint | Static | `BottomSheetSound` |
| T55 | `components/sheets/parts/SoundItem.tsx:102` (drawn `:114`, spoken `:113`) | `Athan ${index + 1}`, `Athan 1` to `Athan 32` | Text and accessibilityLabel | Template: the word `Athan`, a space, a one-based number. 32 rows (`assets/audio/index.ts:3`) | `SoundItemImpl` |
| T56 | `components/sheets/parts/SoundItem.tsx:117` (built `:17-21`) | Preview countdown, for example `0:27` | Text (Animated.Text) | Template: minutes, a colon, seconds padded to two digits with `padStart` | `formatTime` local to `SoundItem.tsx` |
| T57 | `components/sheets/parts/SoundItem.tsx:127` | `Stop previewing ${name}` | accessibilityLabel | Template around T55, conditional pick | `SoundItemImpl` |
| T58 | `components/sheets/parts/SoundItem.tsx:127` | `Preview ${name}` | accessibilityLabel | Template around T55, conditional pick | `SoundItemImpl` |
| T59 | `components/sheets/screens/Qibla.tsx:140` | `Qibla` | Sheet title | Static | `BottomSheetQibla` |
| T60 | `components/sheets/screens/Qibla.tsx:85` | `Follow below instructions` | Sheet subtitle (Animated.Text) | Static. One line only (`numberOfLines={1}`, `:84`) | `QiblaSubtitle` |
| T61 | `components/sheets/screens/Qibla.tsx:88` | `Hold flat and turn slowly` | Sheet subtitle (Animated.Text) | Static. One line only, stacked over T60 and cross-faded | `QiblaSubtitle` |
| T62 | `components/sheets/screens/Qibla.tsx:46` | `Wake up the compass` | Text | Static | `QiblaCalibration` |
| T63 | `components/sheets/screens/Qibla.tsx:47` | `Move your phone like this` | Text | Static | `QiblaCalibration` |
| T64 | `components/sheets/screens/Qibla.tsx:62` | `Could not find north` | Text | Static | `QiblaLost` |
| T65 | `components/sheets/screens/Qibla.tsx:63` | `Please try standing in a different location` | Text | Static | `QiblaLost` |
| T66 | `components/sheets/screens/Qibla.tsx:104-105` | `The qibla is worked out from where you are, so it needs location access. Turn it on in Settings, then open this sheet again.` | Text | Static JSX text across two source lines | `QiblaPermissionDenied` |
| T67 | `components/sheets/screens/Qibla.tsx:109` | `Open settings` | accessibilityLabel | Static | `QiblaPermissionDenied` |
| T68 | `components/sheets/screens/Qibla.tsx:112` | `Open Settings` | Button text | Static | `QiblaPermissionDenied` |
| T69 | `components/sheets/screens/Qibla.tsx:167` (built `shared/qiblaPlace.ts:46`, read `device/qibla.ts:68-70`) | Place name, shaped `${locality}, ${country}`, or one space | Text | Data from the OS reverse geocoder. The app adds only the `, ` joiner. One line only (`numberOfLines={1}`, `:166`) | `placeName` |
| T70 | `shared/qiblaCompass.ts:93` (drawn `components/sheets/screens/QiblaCompass.tsx:141`) | `N` | SVG Text | Static cardinal letter | `CARDINALS` |
| T71 | `shared/qiblaCompass.ts:94` | `E` | SVG Text | Static cardinal letter | `CARDINALS` |
| T72 | `shared/qiblaCompass.ts:95` | `S` | SVG Text | Static cardinal letter | `CARDINALS` |
| T73 | `shared/qiblaCompass.ts:96` | `W` | SVG Text | Static cardinal letter | `CARDINALS` |
| T74 | `components/ui/SettingsButton.tsx:35` | `Settings` | accessibilityLabel | Static, icon-only button | `SettingsButton` |

The cardinal letter is also the React key of its SVG Text (`components/sheets/screens/QiblaCompass.tsx:133`).

### 1.4 Native alert dialogs

| ID | file:line | Exact text | Surface | How it is built | Owner |
| --- | --- | --- | --- | --- | --- |
| N01 | `hooks/useNotification.ts:58` | `Enable Notifications` | Native Alert title | Static | `showSettingsDialog` |
| N02 | `hooks/useNotification.ts:59` | `Prayer time notifications are disabled. Would you like to enable them in settings?` | Native Alert message | Static | `showSettingsDialog` |
| N03 | `hooks/useNotification.ts:62` | `Cancel` | Native Alert button | Static | `showSettingsDialog` |
| N04 | `hooks/useNotification.ts:67` | `Open Settings` | Native Alert button | Static | `showSettingsDialog` |
| N05 | `device/qibla.ts:37` | `Enable Location` | Native Alert title | Static | `showQiblaLocationDialog` |
| N06 | `device/qibla.ts:38` | `The qibla is worked out from where you are, so it needs location access. Would you like to enable it in settings?` | Native Alert message | Static | `showQiblaLocationDialog` |
| N07 | `device/qibla.ts:40` | `Cancel` | Native Alert button | Static | `showQiblaLocationDialog` |
| N08 | `device/qibla.ts:41` | `Open Settings` | Native Alert button | Static | `showQiblaLocationDialog` |

### 1.5 What the sweep did not find

- No toast. `ToastAndroid` and `Toast.` have zero matches in `components/`, `app/`, `hooks/`,
  `device/`, `shared/` and `stores/`.
- No text input and no placeholder. `TextInput` has zero matches in `components/`, `app/` and
  `hooks/`.
- No user-visible string in `stores/ui.ts`, `stores/overlay.ts`, `stores/atoms/overlay.ts`,
  `device/updates.ts`, `shared/qiblaWave.ts`, `shared/qiblaWaveGate.ts`, `shared/qiblaAlignment.ts`,
  `shared/qiblaSettle.ts`, `shared/kaabaFigure.ts`, `components/ui/RamadanDecorations.tsx` or any
  `app/` file other than `app/index.tsx:211`.
- No string catalogue, no translation function and no localisation dependency. `package.json`
  has no match for `localization`, `i18n`, `intl`, `lingui` or `formatjs`.

Seen outside this sweep's scope, not counted above: `app.json:23-25` holds the display name
`Athan` and two OS permission texts. `hooks/useNotification.ts:213-214`, `:249-250` and
`components/sheets/screens/Alert.tsx:85-86` hand both prayer names to the notification store,
which was not read here.

## 2. Prayer name rendering

### 2.1 Where the names come from

- The English names are two string arrays: `PRAYERS_ENGLISH` (`shared/constants.ts:9`) and
  `EXTRAS_ENGLISH` (`shared/constants.ts:26`). The Arabic names are two parallel arrays:
  `PRAYERS_ARABIC` (`shared/constants.ts:15`) and `EXTRAS_ARABIC` (`shared/constants.ts:32`).
- Each row object carries both as fields `english` and `arabic` (`shared/types.ts:270`, `:272`),
  filled by index when the day's rows are built (`shared/prayer.ts:388-389`, `:416-417`).
- `usePrayer` spreads the row, so every consumer reads `Prayer.english` and `Prayer.arabic`
  (`hooks/usePrayer.ts:108-119`). While loading it returns empty strings for both
  (`hooks/usePrayer.ts:89-101`).

### 2.2 Every read or draw of a name in the swept files

| file:line | Field | Use | Style or effect |
| --- | --- | --- | --- |
| `components/prayer/Prayer.tsx:89` | `english` | Drawn, row name | `Roboto-Regular`, size 18 (`:106-109`). `paddingLeft` 20 (`:110-112`). Fixed `width` of the cached name width plus 20 (`:65-67`). No `textAlign`, no `numberOfLines`. Colour animated between muted and primary (`:57-62`) |
| `components/prayer/Prayer.tsx:92` | `arabic` | Drawn, row name, only when the setting is on (`:36`, `:91`) | `Roboto-Regular`, size 18 (`:106-109`). `flex: 1`, `textAlign: 'right'` (`:113-116`). Same colour animation |
| `components/prayer/Prayer.tsx:74` | `english` | Logic: passed to `getRowPressAction` | `components/prayer/rowPress.ts:33` compares it with the literal `Istijaba` |
| `components/prayer/Alert.tsx:66` | `english` | Logic: `canonicalPrayerIndex(type, Prayer.english, index)` | Resolves the alert index by name |
| `components/prayer/Alert.tsx:157-158` | `english`, `arabic` | Passed into the alert sheet state | `stores/ui.ts:16-23` |
| `components/prayer/Alert.tsx:185-186` | `english` | Spoken, bell label | Rows H15 to H18 |
| `components/sheets/screens/Alert.tsx:95` | `prayerEnglish` | Drawn, sheet title | Header title: `Roboto-Medium`, size 22, letter spacing -0.3 (`components/sheets/parts/Header.tsx:56-62`). No `numberOfLines` |
| `components/sheets/screens/Alert.tsx:85-86` | `prayerEnglish`, `prayerArabic` | Passed to `commitAlertMenuChanges` | `hooks/useNotification.ts:210-217`, `:246-253` |
| `components/countdown/Countdown.tsx:47` | `english`, by way of the countdown atom (`stores/countdown.ts:413`, `:414`, `:430`) | Drawn, name above the countdown | `textAlign: 'center'`, size 16, text shadow, no `fontFamily` (`components/countdown/Countdown.tsx:63-72`) |
| `components/countdown/Countdown.tsx:46` | Drawn name | Logic: compared with `...` to pick the screen-reader label | Row H04 |
| `hooks/usePrayerAgo.ts:36` | `english` of the previous prayer | Drawn inside the "ago" badge | `Roboto-Regular`, size 14, `textAlign: 'center'`, pill, `alignSelf: 'center'` (`components/prayer/Ago.tsx:59-69`) |
| `components/overlay/OverlayInfoBox.tsx:71` | `english` | Passed to `getOverlayExplanation` | `components/overlay/overlayContent.ts:53` finds the explanation by `EXTRAS_ENGLISH.indexOf(english)` |
| `components/prayer/Explanation.tsx:67` | `prayerName` (the English name) | Drawn, explanation title | `Roboto-Medium`, size 18 (`:147-151`) |
| `components/ui/InitialWidthMeasurement.tsx:21`, `:24` | Longest entry of `PRAYERS_ENGLISH` and of `EXTRAS_ENGLISH` | Drawn hidden, measured by `onLayout` (`:20`, `:23`) | `Roboto-Regular`, size 18, opacity 0, absolute (`:30-37`) |

Reads seen in helper modules while tracing definitions (partial reads):

- `shared/prayer.ts:196-209` picks the "longest" name by character count (`name.length`), not by
  drawn width.
- `shared/prayer.ts:191` takes the cascade length from `PRAYERS_ENGLISH.length` for Standard and
  from `PRAYERS_ARABIC.length` for Extras.
- `shared/prayer.ts:324-325` drops Istijaba on other days by comparing the lower-cased English
  name and the Arabic literal `استجابة`.
- `shared/prayer.ts:398-399` branches on the literals `Istijaba`, `Midnight` and `Last Third`, and
  `shared/prayer.ts:407` lower-cases the English name to use it as the key into the stored day
  record.

### 2.3 The bilingual row, exactly

Container: `AnimatedPressable` with `flexDirection: 'row'`, `alignItems: 'center'` and
`height: STYLES.prayer.height` (`components/prayer/Prayer.tsx:83-87`, `:101-105`). It has no
accessibility label of its own.

The 57 comes from `STYLES.prayer.height` (`shared/constants.ts:984`). The same constant positions
the active pill (`components/prayer/ActiveBackground.tsx:31`, `:81`), the explanation card
(`components/overlay/OverlayInfoBox.tsx:62`, `:69`) and the overlay press-catchers
(`components/overlay/catcherGeometry.ts:42-43`).

The list that holds the rows has `marginHorizontal: 12` (`components/prayer/List.tsx:91-94`) inside
a page capped at 500 wide (`app/Screen.tsx:30`, `shared/constants.ts:606`).

Children, in source order:

1. English name. `Animated.Text` at `components/prayer/Prayer.tsx:88-90`. Fixed width:
   `Prayer.ui.maxEnglishWidth + STYLES.prayer.padding.left` (`:65-67`), where the padding is 20
   (`shared/constants.ts:987`) and the width is the cached measurement (`hooks/usePrayer.ts:81`).
2. Arabic name. `Animated.Text` at `components/prayer/Prayer.tsx:91-93`, present only when
   `showArabicNamesAtom` is true. `flex: 1`, `textAlign: 'right'` (`:113-116`). The setting is
   stored under `preference_show_arabic_names` and defaults to true (`stores/ui.ts:132`). Its
   switch is row T13.
3. Time. `components/prayer/Time.tsx:56-58`. Container `flex: 1`, `justifyContent: 'center'`
   (`:63-66`). Text `Roboto-Regular`, size 18, `textAlign: 'center'`, `marginLeft: 15`
   (`:67-72`, with `SPACING.lg` 16 at `shared/constants.ts:365`).
4. Bell. `components/prayer/Alert.tsx:168-200`. Container `flexDirection: 'row'`, `height: '100%'`
   (`:205-208`). Icon box `paddingRight: 20`, `paddingLeft: 13` (`:209-213`, with `SPACING.mid` 14
   at `shared/constants.ts:361`). Icon 20 by 20 (`:194`, `shared/constants.ts:535`).

Consequence of items 2 and 3 as coded: with the Arabic name shown, the Arabic text and the time
each take half of the space left between the name column and the bell. With it hidden, the time
takes all of that space. The centre of the time therefore sits at a different x in the two states.

## 3. Fonts and text measurement

### 3.1 Font files and loading

- Two files: `assets/fonts/Roboto-Regular.ttf` and `assets/fonts/Roboto-Medium.ttf`.
- Loaded by the `expo-font` config plugin at build time (`app.json:75-77`). No runtime font load
  exists: `useFonts` and `Font.loadAsync` have zero matches in tracked source.
- Family names are two constants: `TEXT.family.regular` is `Roboto-Regular`
  (`shared/constants.ts:284`) and `TEXT.family.medium` is `Roboto-Medium`
  (`shared/constants.ts:286`). Every `fontFamily` in the swept files reads one of the two. There
  are 55 such sites, all in `components/`.
- Measured from the two files' character maps: each maps 896 code points. Both cover Basic Latin,
  Latin-1, Latin Extended-A, Greek and Cyrillic. Both map zero code points in Arabic
  (U+0600 to U+06FF), Devanagari (U+0900 to U+097F) and Thai (U+0E00 to U+0E7F). Both lack U+2304,
  the Help chevron. So the Arabic names and explanations on screen today are drawn by an OS
  fallback face, although their style names `Roboto-Regular` (`components/prayer/Prayer.tsx:92`,
  `:107`; `components/prayer/Explanation.tsx:80`, `:162`).
- Text nodes with no `fontFamily`: the name above the countdown
  (`components/countdown/Countdown.tsx:63-72`), the chevrons
  (`components/sheets/screens/Settings.tsx:265-270`,
  `components/sheets/screens/ColorPicker.tsx:226-231`, `components/modals/Help.tsx:210-217`) and
  the Help step mark (`components/modals/Help.tsx:239-243`).

### 3.2 Global text scaling

- Every `Text` element gets `allowFontScaling: false` and `maxFontSizeMultiplier: 1` from a JSX
  runtime shim (`jsx-runtime-shim.ts:28`, `:45-52`), wired in by the Metro resolver
  (`metro.config.js:39-53`). The OS text size setting does not change any layout.
- No `adjustsFontSizeToFit` and no `ellipsizeMode` exist in `components/`, `app/` or `hooks/`.

### 3.3 Measurements and fixed sizes that assume a known string

| file:line | What is fixed or measured | Assumption |
| --- | --- | --- |
| `components/ui/InitialWidthMeasurement.tsx:20-25`, `shared/prayer.ts:196-209` | Hidden Text of the "longest" English name per schedule, measured by `onLayout` | Longest by character count is the widest drawn. Today that picks `Sunrise` and `Last Third` |
| `stores/ui.ts:216-231` | `setEnglishWidth` accepts only a measurement wider than the cached one | The right width never gets smaller |
| `stores/ui.ts:104`, `:107` | The cache is persisted under `prayer_max_english_width_standard` and `prayer_max_english_width_extra`, default 0 | One width per schedule, with no language in the key |
| `stores/version.ts:155`, `stores/sync.ts:365` | The `prayer_max_english_width_` prefix is on the keep list of the upgrade and resync cache clears | The measurement stays valid across app versions |
| `components/prayer/Prayer.tsx:65-67` | Name column width is the cached width plus 20 | The cached width fits every name on that schedule |
| `shared/constants.ts:984`, `components/prayer/Prayer.tsx:104` | Row height 57 | One line of size 18 text |
| `shared/constants.ts:980`, `components/countdown/Countdown.tsx:58` | Countdown block height 60 | One line of name, one line of countdown, the bar |
| `components/sheets/screens/ReminderCard.tsx:128-133` | Row label column `width: 100`, size 13 | `Sound` and `Before` fit in 100 |
| `components/sheets/parts/SegmentedControl.tsx:201-212`, `:222-225` | Options are equal shares of the control (`flexGrow: 1`, `flexBasis: 0`), label size 13, 13-wide icon, gap 8 | `Off`, `Silent`, `Sound` each fit a third, or a half beside the 100-wide label |
| `shared/constants.ts:590`, `components/modals/Help.tsx:273`, `components/modals/WhatsNew.tsx:106`, `components/modals/Update.tsx:59` | Modal buttons 160 wide (a `maxWidth` in the update modal) | `Close`, `Later`, `Update` fit in 160 |
| `components/modals/Modal.tsx:135-136`, `shared/constants.ts:588`, `:621` | Compact modal card width 85 percent, capped at 400 | Title and copy fit the card |
| `components/prayer/Explanation.tsx:124`, `shared/constants.ts:583` | Explanation box `minWidth: 300` | None on text length. The box is `width: '100%'` of the list (`components/overlay/OverlayInfoBox.tsx:68-69`) |
| `components/sheets/screens/Qibla.tsx:82-89`, `:222-226` | Two one-line subtitles stacked. The one left in layout flow is the first, and the code comment says it must be the wider one | `Follow below instructions` is wider than `Hold flat and turn slowly` |
| `components/sheets/screens/Qibla.tsx:166` | Place name limited to one line | Longer names are cut by the platform |
| `components/sheets/screens/Alert.tsx:36-47`, `:317-324` | Five hand-broken lines, `minHeight: 220`, horizontal padding 30. The comment says each line fits a 360dp phone at the default font size | The English line lengths |
| `components/modals/Update.tsx:17-18` | Hard line break between the two sentences | The English sentence lengths |
| `shared/whatsNew.ts:131-137` | Limits: 4 items shown, title 32 characters, body 96 characters, enforced by a test named in the comment at `:127` | Character counts of the English copy |
| `components/modals/Help.tsx:21`, `:138`, `:42`, `:203`, `:211` | Answer list capped at 62 percent of window height and scrollable. Question takes `flex: 1` beside a 20-wide chevron | None on length. Questions wrap |
| `components/modals/WhatsNew.tsx:80-87` | Badge column 24 wide, text column `flex: 1` | None on length. Text wraps |
| `components/sheets/parts/LabeledToggle.tsx:38-48`, `shared/constants.ts:549` | Label and 44-wide switch in a `space-between` row. The label has no `flex` and no `flexShrink` | The label is short enough to leave room for the switch |
| `components/sheets/screens/ColorPicker.tsx:180-202` | Label and a right-hand group (Reset, swatch, chevron) in a `space-between` row. The label has no `flex` | Same |
| `components/sheets/screens/Settings.tsx:241-247`, `:258-264` | Row labels take `flex: 1` between a 20-wide icon and the chevron | None on length. Labels wrap |
| `components/sheets/parts/Header.tsx:40-55` | Title block and a 40 by 40 icon in a `space-between` row. The title block has no `flex` | Title and subtitle are short |
| `components/day/Day.tsx:59-66` | Location and date column beside the masjid icon in a `space-between` row. No width cap on the text | The date string is short |
| `components/sheets/parts/Stepper.tsx:125-141` | Number and unit side by side, unit `marginLeft: 3` | Number first, then unit |
| `components/sheets/screens/Sound.tsx:89-97`, `:103` | First sound row measured once. Its height positions the selection indicator for all 32 rows | Every row is the same height, so every name is one line |
| `components/prayer/List.tsx:40-47` | The list rect is measured for the overlay press-catchers | Rows are exactly 57 high (`components/overlay/catcherGeometry.ts:42-43`) |

Fixed `lineHeight` values on text: `components/modals/Help.tsx:179`, `:205`, `:215`, `:229`,
`:241`, `:249`; `components/modals/Update.tsx:46`; `components/modals/WhatsNew.tsx:65`, `:98`;
`components/prayer/Explanation.tsx:156`, `:164`; `components/sheets/screens/Alert.tsx:331`;
`components/sheets/screens/Qibla.tsx:209`; `components/sheets/screens/Settings.tsx:269`;
`components/sheets/screens/ColorPicker.tsx:230`. The presets are 22 for body text and 24 for
Arabic (`shared/constants.ts:303-308`).

## 4. Direction and alignment

Plain statement: `I18nManager` is not referenced anywhere in tracked source. Neither are
`forceRTL`, `allowRTL`, `isRTL`, `writingDirection`, `supportsRTL` or `supportsRtl`. The search
covered every tracked `.ts`, `.tsx`, `.js` and `.json` file outside `node_modules`, `coverage`,
`ai/` and the generated `android/` and `ios/` folders, which are not in the worktree. A second
search of `modules/` and `plugins/`, native sources included, for `supportsRtl`, `layoutDirection`
and `semanticContentAttribute` also found nothing. `app.json` and `app.config.ts` have no locale
or direction entry. No logical style property (`paddingStart`, `marginEnd`, `borderStart` and the
like) is used anywhere in `components/`, `app/` or `hooks/`.

Every `textAlign`:

| file:line | Value | Text |
| --- | --- | --- |
| `components/prayer/Prayer.tsx:115` | `right` | Arabic prayer name |
| `components/prayer/Explanation.tsx:163` | `right` | Arabic explanation |
| `components/prayer/Time.tsx:70` | `center` | Prayer time |
| `components/prayer/Ago.tsx:61` | `center` | "ago" badge |
| `components/countdown/Countdown.tsx:64`, `:76` | `center` | Countdown name and countdown |
| `components/modals/Update.tsx:44` | `center` | Update message |
| `components/modals/WhatsNew.tsx:63` | `center` | Version line |
| `components/modals/Help.tsx:213` | `center` | Chevron glyph |
| `components/sheets/screens/Alert.tsx:330` | `center` | Unavailable message |
| `components/sheets/screens/Qibla.tsx:178`, `:184`, `:203`, `:210` | `center` | Action, headline, message, place |
| `components/sheets/screens/QiblaCompass.tsx:139` | `textAnchor='middle'` | Cardinal letters (SVG) |

No text sets `textAlign` to `left`, `start`, `end` or `auto`. The English prayer name sets none
(`components/prayer/Prayer.tsx:106-112`), so it uses the platform default.

Every `flexDirection: 'row'` that orders text or text beside a control:

| file:line | Order of children |
| --- | --- |
| `components/prayer/Prayer.tsx:102` | English name, Arabic name if shown, time, bell |
| `components/prayer/Alert.tsx:206` | Bell icon box |
| `components/prayer/Explanation.tsx:128` | Title, info icon |
| `components/day/Day.tsx:61` | Location and date column, masjid icon |
| `components/modals/Modal.tsx:149` | Icon and title, or title and trailing icon |
| `components/modals/Update.tsx:52` | `Later`, `Update` |
| `components/modals/WhatsNew.tsx:76` | Platform badges, title and body |
| `components/modals/Help.tsx:194`, `:236`, `:252` | Question and chevron. Step mark and step. Action label and chevron |
| `components/sheets/parts/Header.tsx:41` | Title and subtitle block, icon |
| `components/sheets/parts/LabeledToggle.tsx:39` | Label, switch |
| `components/sheets/parts/SegmentedControl.tsx:183`, `:206` | Options left to right. Icon then label inside each |
| `components/sheets/parts/SoundItem.tsx:141`, `:153` | Name, then countdown and play button |
| `components/sheets/parts/Stepper.tsx:97`, `:126` | Minus, value, plus. Number then unit |
| `components/sheets/screens/ReminderCard.tsx:104`, `:124` | Title and hint, switch. Row label, control |
| `components/sheets/screens/Settings.tsx:214`, `:223` | Icon, label, chevron |
| `components/sheets/screens/ColorPicker.tsx:181`, `:199`, `:254`, `:310` | Label, right group. Reset, swatch, chevron. Cancel, title, done. Swatches |
| `components/sheets/screens/Alert.tsx:285`, `:305` | Style entries defined but not used by this file's JSX |
| `components/ui/Error.tsx:73` | Refresh button |
| `app/Navigation.tsx:141` | Two page dots |

Side-specific spacing on the home screen rows: `components/prayer/Prayer.tsx:111` (`paddingLeft`),
`components/prayer/Time.tsx:71` (`marginLeft`), `components/prayer/Alert.tsx:210-211`
(`paddingRight`, `paddingLeft`), `components/day/Day.tsx:64-65` (`paddingRight`, `paddingLeft`).
The segmented control's selection pill is placed with `left: 3` and a positive `translateX`
percentage by option index (`components/sheets/parts/SegmentedControl.tsx:140-142`, `:154`,
`:191-194`). The switch thumb moves by a positive `translateX`
(`components/sheets/parts/Toggle.tsx:36-47`). The countdown bar grows from the left edge and its
tip uses `left` (`components/countdown/Bar.tsx:138-149`).

## 5. Number, date and time formatting at the UI layer

`toLocaleString`, `toLocaleDateString`, `toLocaleTimeString` and `Intl.` have zero matches in
`components/`, `app/` and `hooks/`. Every format below is built by hand or by the shared time
module with an English locale tag.

| file:line | What | Format |
| --- | --- | --- |
| `shared/time.ts:23` | `pad2` helper | `String(value).padStart(2, '0')` |
| `shared/time.ts:175-178` | Prayer time for computed rows | `${pad2(hour)}:${pad2(minute)}`, 24 hour |
| `components/prayer/Time.tsx:35` | Prayer time drawn | The stored `HH:mm` string as is, or `--:--` |
| `shared/time.ts:528-549` (used `stores/countdown.ts:86`, `:89`) | Countdown | `${totalHours}h`, `${minutes}m`, `${secs}s` joined by a space. Days fold into hours. Seconds show when the setting is on or 599 seconds or fewer remain. `0s` for a negative input. Uses date-fns `intervalToDuration` (`shared/time.ts:532`) |
| `shared/time.ts:564-574` | Elapsed time for the badge | `now`, `${minutes}m`, `${hours}h`, `${hours}h ${remainingMinutes}m` |
| `hooks/usePrayerAgo.ts:36` | Badge sentence | `${english} now` or `${english} ${timeAgo} ago` |
| `shared/time.ts:229-233` (used `components/day/shownDate.ts:34`) | Gregorian date | date-fns `format(..., 'EEE, d MMM yyyy')`, default English locale |
| `shared/time.ts:241-254` (used `components/day/shownDate.ts:34`) | Hijri date | `Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone })`, then `.replace(/ AH$/, '')` |
| `shared/time.ts:25-34` | Prayer timezone clock reader | `Intl.DateTimeFormat('en-US', ...)` with `hourCycle: 'h23'`, read through `formatToParts`. Not drawn |
| `shared/time.ts:318`, `:329` | Ramadan check | `Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura')`, numeric month and day, compared with the strings `9` and `8`. Not drawn |
| `components/sheets/parts/SoundItem.tsx:17-21` | Preview countdown | `${mins}:${secs.toString().padStart(2, '0')}` |
| `components/sheets/parts/SoundItem.tsx:102` | Sound name | `Athan ${index + 1}` |
| `components/sheets/parts/Stepper.tsx:58`, `:69`, `:75` | Spoken stepper values | `${number} ${unit}` with the unit `min` for every value |
| `components/sheets/parts/Stepper.tsx:70-71` | Drawn stepper value | The number, then the unit `min` in a second Text |
| `components/countdown/Bar.tsx:166` | Spoken progress | `Math.round(progress)` then the word `percent` |
| `components/modals/WhatsNew.tsx:29` | Version line | `v` then the version string |
| `components/prayer/Explanation.tsx:80`, `shared/text.ts:2-13`, `:25-27` | Digits in the Arabic explanation | Each of `0` to `9` replaced by the Arabic-Indic digit. This is the only digit conversion in the swept files |
| `shared/constants.ts:57-59` | Units inside the English explanations | `20 mins`, `1 hour`, written into the literals |
| `shared/help.ts:124`, `:127` | A unit inside help copy | `30 seconds`, written into the literal |
| `components/sheets/screens/Alert.tsx:235`, `:247` | Ordinals in reminder titles | `Reminder 1`, `Reminder 2`, written into the literals |

No plural logic exists. `min` is used for every reminder value, and `mins` and `hour` are fixed
words in fixed sentences.

## 6. Hazards

Each item is something that breaks or moves pixels when a string becomes longer, shorter, a
different script or a different language.

- **Name column width is tied to English.** The measured string is the longest English name by
  character count (`shared/prayer.ts:196-209`, `components/ui/InitialWidthMeasurement.tsx:20-25`).
  The cache only ever widens (`stores/ui.ts:216-231`), has no language in its key
  (`stores/ui.ts:104`, `:107`) and survives the upgrade and resync clears (`stores/version.ts:155`,
  `stores/sync.ts:365`). A language with narrower names keeps the old wider column. A language
  whose widest name is not its longest by character count is under-measured.
- **A name wider than the cached width wraps inside a 57-high row.** The name has a fixed width
  and no line limit (`components/prayer/Prayer.tsx:65-67`, `:88-90`, `:104`). The comment at
  `stores/ui.ts:217-222` records this having happened to `Sunrise`.
- **Removing the Arabic column moves the time.** The Arabic name and the time are both `flex: 1`
  (`components/prayer/Prayer.tsx:113-116`, `components/prayer/Time.tsx:63-66`). Without the Arabic
  name the time takes the whole remainder, which is today's layout only for users who turned the
  setting off. The default is on (`stores/ui.ts:132`).
- **The bundled fonts draw only Latin, Greek and Cyrillic.** Section 3.1 has the measurement.
  Arabic, Devanagari and Thai text falls to an OS face whose metrics the app does not control,
  inside a row fixed at 57 (`shared/constants.ts:984`), a countdown block fixed at 60
  (`shared/constants.ts:980`) and the fixed line heights listed in section 3.3.
- **Nothing sets or blocks right-to-left layout.** Section 4 has the search. `components/` and
  `app/` hold 30 `flexDirection: 'row'` style entries, and the home rows use left and right
  paddings (`components/prayer/Prayer.tsx:111`, `components/prayer/Time.tsx:71`,
  `components/prayer/Alert.tsx:210-211`, `components/day/Day.tsx:64-65`). Whether a device set to a right-to-left language already
  mirrors the app is decided by generated native configuration that is not in tracked files. It
  needs a device check.
- **The English name has no `textAlign`.** `components/prayer/Prayer.tsx:106-112`. A
  right-to-left script in that Text takes the platform default alignment inside the fixed-width
  column. Whether that is left or right on each platform needs a device check.
- **Sentences are assembled in English word order.** `hooks/usePrayerAgo.ts:36` (name, duration,
  `ago`), `components/prayer/Alert.tsx:185-186` (name, `notification:`, state),
  `components/countdown/Bar.tsx:166`, `components/sheets/parts/Stepper.tsx:58`, `:69`, `:75`,
  `components/sheets/parts/SoundItem.tsx:102`, `:127`, `components/modals/WhatsNew.tsx:45`.
- **Unit letters are hard-coded.** `h`, `m`, `s` at `shared/time.ts:540`, `:545`, `:568`,
  `:572-573`. `min` at `components/sheets/screens/ReminderCard.tsx:75` and
  `components/sheets/parts/Stepper.tsx:43`.
- **The English name is also an identifier.** It is compared or looked up at
  `components/prayer/rowPress.ts:33`, `components/overlay/overlayContent.ts:53`,
  `components/prayer/Alert.tsx:66`, `shared/prayer.ts:324-325`, `:398-399`, `:407` and
  `components/countdown/Countdown.tsx:46`. If the `english` field came to hold a translated
  string, each of these would stop matching.
- **Copy strings are React keys and state.** The help question is the open-state value and key
  (`components/modals/Help.tsx:121`, `:142-145`), the help step is a key (`:82`), and the What's New
  title is a key (`components/modals/WhatsNew.tsx:32`). Two answers on one platform that translate
  to the same string would collide.
- **Dates are English by construction.** date-fns runs with its default locale
  (`shared/time.ts:232`) and both `Intl` formatters name `en-US` (`shared/time.ts:243`). The Hijri
  clean-up strips the English suffix ` AH` by regex (`shared/time.ts:250`), which matches only the
  English pattern.
- **Digits are converted in one place.** The Arabic explanation is passed through
  `toArabicNumbers` (`components/prayer/Explanation.tsx:80`, `shared/text.ts:25-27`), so Arabic-Indic
  digits are on screen today whenever an Extras explanation with a number is open.
- **Hand-fitted copy.** Line breaks and sizes tuned to the English text:
  `components/sheets/screens/Alert.tsx:36-47`, `components/modals/Update.tsx:17-18`,
  `shared/help.ts:78`, `:82`, `:124`, `:127`, the subtitle width rule at
  `components/sheets/screens/Qibla.tsx:82-89`, and the 32 and 96 character caps at
  `shared/whatsNew.ts:135-137`.
- **Fixed-width controls.** The 100-wide label column (`components/sheets/screens/ReminderCard.tsx:132`),
  equal-share segment options (`components/sheets/parts/SegmentedControl.tsx:201-212`), 160-wide
  modal buttons (`shared/constants.ts:590`) and the unshrinking labels beside the switch and the
  colour row (`components/sheets/parts/LabeledToggle.tsx:38-48`,
  `components/sheets/screens/ColorPicker.tsx:180-192`).
- **The sound list assumes one-line rows.** One measured row height positions the selection
  indicator for all rows (`components/sheets/screens/Sound.tsx:89-97`, `:103`).
- **Spoken and drawn text are separate literals.** Ten pairs must be kept in step by hand:
  `components/modals/Update.tsx:25-26`, `:32-33`; `components/modals/WhatsNew.tsx:52-53`;
  `components/modals/Help.tsx:151-152`; `components/sheets/screens/Settings.tsx:91` and `:96`, `:103`
  and `:108`, `:164` and `:169`, `:177` and `:182`; `components/sheets/screens/ColorPicker.tsx:107-108`;
  `components/sheets/screens/Qibla.tsx:109` and `:112`. Three pairs already differ in spelling,
  case or apostrophe: `color` against `colour` (`components/sheets/screens/ColorPicker.tsx:107`,
  `:116`, `:144`), `Open settings` against `Open Settings`
  (`components/sheets/screens/Qibla.tsx:109`, `:112`) and the two apostrophes at
  `components/sheets/screens/Settings.tsx:164`, `:169`.
- **Explanations embed prayer names as plain words.** `Magrib`, `Fajr` and `Sunrise` are written
  inside `shared/constants.ts:55-59`, apart from the name arrays.
- **Padding spaces live inside literals.** `components/ui/Error.tsx:37-39`, `:42`.
- **Some text does not come from the app.** The place name is whatever the OS geocoder returns
  (`device/qibla.ts:68-70`), joined with `, ` (`shared/qiblaPlace.ts:46`). Native alert buttons are
  laid out by the OS (`hooks/useNotification.ts:57-97`, `device/qibla.ts:36-43`).
- **London is written into the UI layer.** `London, UK` at `components/day/Day.tsx:48`, and the
  store lookup pinned to one storefront and one listing slug at `device/updates.ts:15`, `:17`.
- **A setting and its stored key go away with the bilingual row.** `Show arabic names`
  (`components/sheets/screens/Settings.tsx:128-132`) writes `preference_show_arabic_names`
  (`stores/ui.ts:132`), read only at `components/prayer/Prayer.tsx:36`.
- **The error screen can draw before any state exists.** It is the root error boundary
  (`app/_layout.tsx:41-44`) and the sync failure screen (`app/index.tsx:216`), so its four strings
  cannot depend on anything that might itself have failed to load.

## 7. Files read

Read in full, with line counts.

`app/` (4 files, 548 lines):

| Lines | File |
| --- | --- |
| 150 | `app/Navigation.tsx` |
| 51 | `app/Screen.tsx` |
| 97 | `app/_layout.tsx` |
| 250 | `app/index.tsx` |

`components/` (59 files, 6983 lines):

| Lines | File |
| --- | --- |
| 230 | `components/countdown/Bar.tsx` |
| 84 | `components/countdown/Countdown.tsx` |
| 2 | `components/countdown/index.ts` |
| 37 | `components/countdown/tipGeometry.ts` |
| 78 | `components/day/Day.tsx` |
| 1 | `components/day/index.ts` |
| 35 | `components/day/shownDate.ts` |
| 285 | `components/modals/Help.tsx` |
| 192 | `components/modals/Modal.tsx` |
| 81 | `components/modals/Update.tsx` |
| 119 | `components/modals/WhatsNew.tsx` |
| 4 | `components/modals/index.ts` |
| 129 | `components/overlay/Overlay.tsx` |
| 100 | `components/overlay/OverlayInfoBox.tsx` |
| 77 | `components/overlay/VeilBackdrop.tsx` |
| 56 | `components/overlay/catcherGeometry.ts` |
| 3 | `components/overlay/index.ts` |
| 60 | `components/overlay/overlayContent.ts` |
| 84 | `components/prayer/ActiveBackground.tsx` |
| 70 | `components/prayer/Ago.tsx` |
| 214 | `components/prayer/Alert.tsx` |
| 166 | `components/prayer/Explanation.tsx` |
| 95 | `components/prayer/List.tsx` |
| 117 | `components/prayer/Prayer.tsx` |
| 73 | `components/prayer/Time.tsx` |
| 62 | `components/prayer/activePill.ts` |
| 7 | `components/prayer/index.ts` |
| 35 | `components/prayer/rowPress.ts` |
| 21 | `components/sheets/index.ts` |
| 69 | `components/sheets/parts/Header.tsx` |
| 49 | `components/sheets/parts/LabeledToggle.tsx` |
| 226 | `components/sheets/parts/SegmentedControl.tsx` |
| 58 | `components/sheets/parts/Shared.tsx` |
| 244 | `components/sheets/parts/Sheet.tsx` |
| 166 | `components/sheets/parts/SoundItem.tsx` |
| 142 | `components/sheets/parts/Stepper.tsx` |
| 93 | `components/sheets/parts/Toggle.tsx` |
| 9 | `components/sheets/parts/index.ts` |
| 50 | `components/sheets/parts/reminderStep.ts` |
| 333 | `components/sheets/screens/Alert.tsx` |
| 313 | `components/sheets/screens/ColorPicker.tsx` |
| 234 | `components/sheets/screens/Qibla.tsx` |
| 247 | `components/sheets/screens/QiblaCompass.tsx` |
| 167 | `components/sheets/screens/QiblaWave.tsx` |
| 134 | `components/sheets/screens/ReminderCard.tsx` |
| 271 | `components/sheets/screens/Settings.tsx` |
| 235 | `components/sheets/screens/Sound.tsx` |
| 83 | `components/sheets/screens/alertDraft.ts` |
| 5 | `components/sheets/screens/index.ts` |
| 71 | `components/sheets/screens/soundSheet.ts` |
| 16 | `components/ui/BackgroundGradients.tsx` |
| 80 | `components/ui/Error.tsx` |
| 45 | `components/ui/Glow.tsx` |
| 59 | `components/ui/Icon.tsx` |
| 38 | `components/ui/InitialWidthMeasurement.tsx` |
| 42 | `components/ui/Masjid.tsx` |
| 924 | `components/ui/RamadanDecorations.tsx` |
| 55 | `components/ui/SettingsButton.tsx` |
| 8 | `components/ui/index.ts` |

`hooks/` (14 files, 1461 lines):

| Lines | File |
| --- | --- |
| 15 | `hooks/useAlertAnimations.ts` |
| 81 | `hooks/useAlertSwapBounce.ts` |
| 155 | `hooks/useAnimation.ts` |
| 22 | `hooks/useChromeDeferred.ts` |
| 55 | `hooks/useCountdown.ts` |
| 66 | `hooks/useCountdownBar.ts` |
| 298 | `hooks/useNotification.ts` |
| 120 | `hooks/usePrayer.ts` |
| 90 | `hooks/usePrayerAgo.ts` |
| 118 | `hooks/usePrayerSequence.ts` |
| 15 | `hooks/usePrevious.ts` |
| 310 | `hooks/useQibla.ts` |
| 109 | `hooks/useSchedule.ts` |
| 7 | `hooks/useWindowDimensions.ts` |

Named `shared/`, `stores/` and `device/` files (15 files, 1735 lines):

| Lines | File |
| --- | --- |
| 144 | `shared/help.ts` |
| 237 | `shared/whatsNew.ts` |
| 27 | `shared/text.ts` |
| 47 | `shared/qiblaPlace.ts` |
| 139 | `shared/qiblaWave.ts` |
| 77 | `shared/qiblaWaveGate.ts` |
| 160 | `shared/qiblaCompass.ts` |
| 39 | `shared/qiblaAlignment.ts` |
| 76 | `shared/qiblaSettle.ts` |
| 148 | `shared/kaabaFigure.ts` |
| 237 | `stores/ui.ts` |
| 79 | `stores/overlay.ts` |
| 119 | `stores/atoms/overlay.ts` |
| 115 | `device/updates.ts` |
| 91 | `device/qibla.ts` |

Also read in full, because the swept files import their strings and sizes from them:

| Lines | File |
| --- | --- |
| 1012 | `shared/constants.ts` |
| 57 | `jsx-runtime-shim.ts` |

Read in part, only for the definition lines cited above. These are not covered by this sweep:

| File | Lines read |
| --- | --- |
| `shared/time.ts` | 1 to 70, 160 to 349, 500 to 574 |
| `stores/countdown.ts` | 60 to 124, 390 to 434 |
| `shared/prayer.ts` | 180 to 204, 262 to 426 |
| `shared/types.ts` | 250 to 289 |
| `app.json` | 68 to 80, and search hits at lines 3 to 7 and 23 to 25 |
| `metro.config.js` | Search hits at lines 39 to 53 |
| `package.json` | Search for localisation packages only |
| `assets/audio/index.ts` | Search hits at lines 3, 38 and 43, and a count of its 32 `require` calls |
| `stores/version.ts`, `stores/sync.ts`, `device/notifications.ts` | One search hit each: lines 155, 365 and 20 |

Font files: `assets/fonts/Roboto-Regular.ttf` (168260 bytes) and `assets/fonts/Roboto-Medium.ttf`
(168644 bytes). Their character map tables were parsed to count mapped code points per script.
