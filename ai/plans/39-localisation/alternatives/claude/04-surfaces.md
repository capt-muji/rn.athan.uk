# 04. Surfaces: what bakes text, what draws it live

Evidence: `evidence/core.md` sections 5, 8 and 9, `evidence/widgets.md`,
`evidence/ui-strings.md`, `evidence/schedule-time.md` sections 3 and 6. Citations are
`path:line` at base commit `c3149dfc`.

Every surface is in exactly one of four classes.

| Class | Surfaces | How the language reaches it |
| --- | --- | --- |
| Live | every screen, sheet, modal, native alert dialog and screen-reader label | `useT()` at render, or `getCatalog()` at the moment a dialog opens |
| Baked at arm time | pending notification titles | a `Catalog` passed to the content builders by the pass (document 03) |
| Baked at creation, renamed in place | Android channel names | `syncAndroidChannelNames(catalog)` on every full pass |
| Baked at push time | widget props | the builders take the language from the widget settings snapshot |

A fifth class is outside the app's reach at 2.0.0 and is listed at the end.

## 1. Pure formatters take a catalog

No formatter reads a store, a locale API or `Intl` for a name. Each takes a `Catalog` and
returns a string. Digits come from `String(number)` and are therefore ASCII in every language.

| Function | Today | Becomes |
| --- | --- | --- |
| `formatDateLong(date)` | date-fns `EEE, d MMM yyyy`, English (`shared/time.ts:229-233`) | `formatDateLong(date, catalog)`: reads the London weekday, day, month and year as numbers, then fills `date.gregorian` with `date.weekdayShort.N`, the day, `date.monthShort.N` and the year |
| `formatHijriDateLong(date)` | `Intl` `en-US` Hijri with a long month, ` AH` stripped (`shared/time.ts:241-254`) | `formatHijriDateLong(date, catalog)`: reads the Hijri day, month and year as numbers through `readHijriParts(date)`, then fills `date.hijri` with `date.hijriMonth.N` |
| new `readHijriParts(date)` | the three numeric formatters inside `isRamadan` (`shared/time.ts:310-341`) | `{ day: number; month: number; year: number } \| null`. Three `Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', ...)` formatters, one numeric field each, parsed with `parseInt`. `null` when `Intl` throws. `isRamadan` is rewritten on top of it |
| new `formatWidgetFooter(date, hijri, catalog)` | cut inside the layout from the date label (`widgets/PrayerWidget.tsx:303-310`, `:545-555`) | Gregorian: `date.weekdayShort.N`. Hijri: `date.hijriShort` filled with `date.hijriMonthShort.N` and the day |
| `formatTime(seconds, showSeconds)` | literal `h`, `m`, `s` (`shared/time.ts:528-549`) | `formatTime(seconds, showSeconds, catalog)`: the same parts, each through `duration.hours`, `duration.minutes`, `duration.seconds`, joined by one space |
| `formatTimeAgo(seconds)` | literal `m`, `h`, `now` (`shared/time.ts:564-574`) | `formatTimeAgo(seconds, catalog)`: the same parts through the `duration.*` keys. Its `now` branch is deleted: its only caller never reaches it (`hooks/usePrayerAgo.ts:36`) |
| ago text | `` `${english} now` ``, `` `${english} ${timeAgo} ago` `` (`hooks/usePrayerAgo.ts:36`) | `ago.now` and `ago.since` with `{prayer}` and `{duration}` |

`Intl` stays in exactly the role it has in `isRamadan` today: calendar arithmetic under a fixed
`en-US` locale, producing numbers. It never produces a name. The `en` pack's values reproduce
today's English output byte for byte (document 06, T-CAT-7), so an English user sees no change.

When `readHijriParts` returns `null`, `formatHijriDateLong` falls back to `formatDateLong`, as
it does today on a throw (`shared/time.ts:251-253`).

## 2. Notification titles

```ts
// shared/notifications.ts
export const genNotificationContent = (
  id: PrayerId, alertType: AlertType, soundIndex: number, catalog: Catalog
): Notifications.NotificationContentInput;
//   title: format(catalog, 'notification.atTime', { prayer: catalog[prayerNameKey(id)] })
//   sound: alertType !== Sound ? false : playsAthan ? athanAudioFile(soundIndex) : EXTRAS_AUDIO_FILE
//   every other field as today (shared/notifications.ts:129-137)

export const genReminderNotificationContent = (
  id: PrayerId, minutes: ReminderInterval, alertType: AlertType, catalog: Catalog
): Notifications.NotificationContentInput;
//   title: format(catalog, 'notification.reminder', { prayer: ..., minutes })
//   sound: alertType !== Sound ? false : reminderAudioFile(id, minutes)
//   every other field as today (shared/notifications.ts:180-188)
```

- The unused Arabic parameter goes (`shared/notifications.ts:125`, `:176`).
- Sound file names come from `shared/identifiers.ts` and do not depend on the language. The 99
  audio files are untouched. A reminder's spoken audio stays what it is today in every language.
- With the `en` pack the two titles are `Fajr now` and `Fajr in 15m`, the bytes the tests pin
  today (`evidence/test-infra.md` section 5.3).

### The imminent reminder

A reminder due in under 30 seconds is skipped at arm time (`stores/notifications.ts:1040-1051`,
`shared/constants.ts:114`). A skipped day returns no identifier, so the reminder's existing
record counts as stale and its pending request is cancelled (`stores/notifications.ts:1130-1139`).
Any pass that runs inside those 30 seconds therefore cancels a reminder that was about to fire.
Today such a pass needs the 2 hour gate or a background run to land on that window. A language
switch is a pass the user starts at a moment of their choosing, so 2.0.0 raises the exposure.

The fix is one branch in `scheduleReminderNotificationForDate`: when the reminder's moment is
still ahead and inside the buffer, and a record with its identifier already exists, return
`{ identifier, refused: false }` without arming. The pending request stays, in the previous
language, and fires within 30 seconds. With no existing record the day is skipped as today.

This changes notification scheduling logic, which needs the owner's approval
(`ai/AGENTS.md`, Hard rules). Sequencing step S9 lands it first, alone, with a red test that
shows the cancel on `uat`.

## 3. Android channels

Channel ids, sounds, importance, vibration and audio attributes do not change
(`shared/notifications.ts:368-417`, `:445-463`, `:492-514`). Only names do.

| Channel | Name key | English value |
| --- | --- | --- |
| `athan_{n}_v4` | `channel.athan` with `{number}` | `Athan 1` |
| `extras_at_time_v3` | `channel.extras` | `Extra Times` |
| `reminder_{slug}_{minutes}_v3` | `channel.reminder` with `{prayer}`, `{minutes}` | `Fajr in 15m Reminder` |

The three creators take a `Catalog` and build the name from it:
`createAthanAndroidChannel(soundIndex, catalog)`, `createExtrasAndroidChannel(catalog)`,
`createReminderAndroidChannel(id, minutes, catalog)`. `athanAndroidChannelConfig(soundIndex,
catalog)` stays the single definition both athan paths share (`shared/notifications.ts:405-417`).
`initializeNotifications` and `Device.updateAndroidChannel` pass `getCatalog()`.

### Renaming in place

Android updates the name of an existing channel when a channel with the same id is created
again. The library's `setNotificationChannelAsync` always builds a channel object and calls the
system's create
(`node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/notifications/channels/managers/AndroidXNotificationsChannelManager.java:79-86`).
Sound, importance and audio attributes of an existing channel are ignored by the system on such
a call, which is the property the code already relies on (`shared/notifications.ts:467-472`).

```ts
// shared/notifications.ts
/** Brings every channel this app owns to the catalog's name. Never throws. */
export const syncAndroidChannelNames = async (catalog: Catalog): Promise<boolean>;
```

1. Off Android: return `true`.
2. `channels = await withNativeTimeout(Notifications.getNotificationChannelsAsync(), ...)`.
3. For each channel, `expected = channelNameFor(channel.id, catalog)`. `channelNameFor` parses
   the id against the three id patterns of `shared/identifiers.ts` and returns `null` for an id
   that is not this app's (the library's fallback channel, for example).
4. When `expected` is not null and differs from `channel.name`: call
   `setNotificationChannelAsync(channel.id, config)` with the same config its creator builds,
   inside `withNativeTimeout`.
5. Any rejection is logged and makes the result `false`. The rest still run. The whole function
   is wrapped so it cannot reject.

It runs at step 3 of every full pass (document 03). On a phone whose names already match it
costs one native call. The per-process creation sets (`shared/notifications.ts:431-437`) stay
valid, because they guard ids, and ids do not change.

Whether the rename shows in the system settings without an app restart is a device gate
(document 06, D-2). A phone that ignores the rename leaves an old channel name in system
settings and nothing else: `channelsInSync` then depends only on the call resolving, not on a
read-back.

Not reachable: Silent alerts carry no channel id (`device/notifications.ts:96-97`, `:224-226`)
and post to the library's own channel, named `Miscellaneous` by a string resource in the
library (`node_modules/expo-notifications/android/src/main/res/values/strings.xml:3`). The app
cannot rename it without patching the library. It stays as it is at 2.0.0.

## 4. Widgets

A layout function is shipped to the widget process as a string of its own source. It can reach
its parameters, its own locals, the `@expo/ui` exports and a fixed list of JavaScript built-ins,
and nothing else: no import, no module constant, no `Intl`
(`evidence/widgets.md` sections 3.2 and 3.4). So the catalog can never be read inside a layout.
Every string a layout draws must arrive in props, or be a literal in its body.

### Decisions

1. **The app bakes every string a layout draws while it has props.** Names, the hero form of
   the name, the footer, the stale and error card text and the Android countdown unit templates
   all arrive in props.
2. **Layouts stop doing string work on words.** No upper-casing, no comma or space splitting,
   no three-character cut (`widgets/PrayerWidget.tsx:303-310`, `:378`, `:545-555`, `:606`).
3. **One English fallback table stays inside each layout function.** It is used when a prop
   string is absent. That happens in two cases: no props at all (the neutral card, drawn before
   the app's first push), and props written by 1.x that are still on disk when the new layout
   string is registered (`evidence/widgets.md` section 4.6). The widget process cannot know the
   language in either case. This is the one place outside the `en` pack where English literals
   remain, and the only widget text that can appear in the wrong language.
4. **The iOS ticking countdown is pinned to Latin digits** with the `environment` modifier's
   `locale` key (`node_modules/@expo/ui/src/swift-ui/modifiers/environment.ts:3-23`), value
   `en_US_POSIX`. It draws digits and colons only, so no word is affected. This is a device
   gate (document 06, D-4); if the modifier does not behave on a device, the step is dropped
   and the countdown keeps the device's numbering system, as it does today.

### Prop shapes

```ts
// shared/widgetTypes.ts
export const WIDGET_PROPS_VERSION = 6;        // was 5
export const ANDROID_SNAPSHOT_VERSION = 2;    // was 1

export interface PrayerWidgetSettings {
  hijriDate: boolean;
  language: LocaleCode;                       // new
}

/** Every string a layout may be handed. All optional: a layout falls back per key. */
export interface WidgetStrings {
  brand?: string;            // widget.brand
  errorBody?: string;        // widget.errorBody
  staleTitle?: string;       // widget.staleTitle
  staleBody?: string;        // widget.staleBody
  staleBodyLine1?: string;   // widget.staleBodyLine1
  staleBodyLine2?: string;   // widget.staleBodyLine2
  lockInlineStale?: string;  // widget.lock.inlineStale
  lockStaleBody?: string;    // widget.lock.staleBody
  hours?: string;            // duration.hours, Android only
  minutes?: string;          // duration.minutes, Android only
}

export interface WidgetPrayerRow { name: string; time: string }          // unchanged shape

export interface PrayerWidgetProps {
  v: number;
  schedule?: 'standard' | 'extra';
  theme?: WidgetTheme;
  nextName: string;          // catalog prayer.<id>
  nextNameHero?: string;     // new: catalog prayerHero.<id>
  nextTime: string;
  nextEpochMs: number;
  prevEpochMs: number;
  footer?: string;           // new: replaces dateLabel
  prayers?: WidgetPrayerRow[];
  activeIndex?: number;
  stale?: boolean;
  strings?: WidgetStrings;   // new
}

export interface AndroidWidgetDayRow { name: string; hero: string; time: string; epochMs: number }  // hero is new
export interface AndroidWidgetDay { footer: string; startEpochMs: number; rows: AndroidWidgetDayRow[] }  // footer replaces dateLabel
export interface PrayerWidgetAndroidProps {
  v: number; schedule: 'standard' | 'extra'; theme: WidgetTheme; size: 'small' | 'medium';
  grantedWidthDp?: number; days: AndroidWidgetDay[]; horizonEpochMs: number;
  strings: WidgetStrings;    // new
}
```

Which strings each payload carries, to keep the iOS timeline small (each of about 23 entries
repeats its props, `evidence/widgets.md` section 4.2):

| Payload | `strings` holds |
| --- | --- |
| iOS normal entry | `brand`, `errorBody` |
| iOS stale entry | `brand`, `errorBody`, `staleTitle`, `staleBody`, `staleBodyLine1`, `staleBodyLine2`, `lockInlineStale`, `lockStaleBody` |
| Android snapshot | `staleTitle`, `staleBody`, `staleBodyLine1`, `staleBodyLine2`, `hours`, `minutes` |

`dateLabel` leaves both shapes. No layout draws it; they draw only what they cut from it
(`evidence/widgets.md` section 2.5).

### Builders

`buildPrayerWidgetTimeline` and `buildPrayerWidgetSnapshot` (`shared/widgetTimeline.ts:161-257`,
`:277-320`) keep their signatures. They read `settings.language`, call `catalogFor`, and:

- set `nextName` and each row `name` to `catalog[prayerNameKey(row.id)]`
  (`shared/widgetTimeline.ts:135`, `:188`, `:247`, `:303`, `:306`);
- set `nextNameHero` and each Android row `hero` to `catalog[prayerHeroKey(row.id)]`;
- set `footer` with `formatWidgetFooter` in place of `formatDateLabel`
  (`shared/widgetTimeline.ts:114-116`);
- attach `strings` per the table above.

`readWidgetSettings` (`stores/widget.ts:84-90`) returns `{ hijriDate, language: getLanguage() }`.
`initWidgetSettingsSync` (`stores/widget.ts:124-140`) subscribes to `languageAtom` as well as
the Hijri atom, so a switch pushes the widgets one second later whether or not the
notification pass succeeds.

### Layout changes

Inside each of the four layout functions (`widgets/PrayerWidget.tsx:81`,
`widgets/LockPrayerWidget.tsx:44`, `:197`, `:338`):

1. Declare `FALLBACK`, an object literal with today's English bytes for every `WidgetStrings`
   key the function draws, plus the neutral-card literals it already holds.
2. Declare `text(key)`: returns `props.strings[key]` when `props`, `props.strings` and that
   value are a non-empty string, else `FALLBACK[key]`.
3. Replace each stale and error literal with `text(...)`
   (`evidence/widgets.md` section 7, items 8, 9 and 12).
4. Hero name: draw `nextNameHero` when it is a string, else `nextName.toUpperCase()`. Remove
   the `textCase('uppercase')` modifier (`widgets/PrayerWidget.tsx:606`) and the call at `:378`.
   For English props the pixels are the same.
5. Footer: draw `footer` when it is a string. Otherwise run today's cut on `dateLabel`, kept
   verbatim as `legacyFooter`, so 1.x props still draw their footer.
6. Android countdown (`widgets/PrayerWidget.tsx:292-299`): build each part with
   `text('hours').split('{n}').join(String(hours))` and the same for minutes, joined by one
   space. Plain string `split`, because the iOS runtime does not split on a regular expression
   (`widgets/PrayerWidget.tsx:542-544`) and the same source runs on both.
7. iOS countdown text nodes (`widgets/PrayerWidget.tsx:615-619`,
   `widgets/LockPrayerWidget.tsx:171-183`, `:473-483`): add
   `environment({ key: 'locale', value: 'en_US_POSIX' })` to their modifier lists.
8. `widgets/PrayerWidget.tsx:90`: change `props !== null` to `props != null`. iOS passes
   `undefined` for absent props and `'days' in undefined` throws outside the `try`
   (`evidence/widgets.md` section 1.4). It is an existing defect in the same guard this work
   edits, and the new `text` helper reads `props` on the same path.
9. The neutral cards (`evidence/widgets.md` section 7, items 7 and 11) keep their literals.
   They are drawn only with no props.

The inline lock face stays name, a space, time (`widgets/LockPrayerWidget.tsx:140`, `:283`,
`:450`). The row key stays the name (`widgets/PrayerWidget.tsx:737`): names are unique within a
list in every pack, which the catalog gate checks (document 02, G8).

### Fit

Widget text is single-line everywhere, and the Android list draws names in a fixed box sized
for English (`evidence/widgets.md` section 2.8). The catalog gate holds every `prayer.*` and
`prayerHero.*` value to 12 visible characters (document 02, G6). Fit on a real widget in each
shipped language is a device gate (document 06, D-5).

## 5. The prayer row

The row is today's row with the Arabic text removed and nothing else moved. That is the state a
1.x user already sees with `Show arabic names` off.

`components/prayer/Prayer.tsx`:

- Delete the `showArabicNamesAtom` read (`:36`), the Arabic `Animated.Text` (`:91-93`) and the
  `arabic` style (`:113-116`).
- The name text draws `t(prayerNameKey(Prayer.id))` (`:88-90`).
- The fixed width and the left padding move from the text to a wrapping `View` with
  `alignItems: 'flex-start'`: `{ width: nameWidth + STYLES.prayer.padding.left, paddingLeft:
  STYLES.prayer.padding.left }` (`:65-67`, `:110-112`). The text inside it has no width of its
  own and gains `numberOfLines={1}`. A text box that hugs its content and sits at the start of
  an unmirrored row is on the physical left whatever its script, with no reliance on how either
  platform reads `textAlign` for a right-to-left paragraph. For an English name that fits its
  column the pixels are the same as today.
- Height, padding, font, size and the order name, time, icon are untouched (`:100-112`,
  `components/prayer/Time.tsx:62-72`, `components/prayer/Alert.tsx:204-213`).

### Never mirrored, by configuration

React Native mirrors every row on Android when three things hold: the manifest declares
`android:supportsRtl="true"`, the app has not disallowed it, and the device's first language is
right-to-left
(`node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/i18nmanager/I18nUtil.kt:21-23`,
`:30-32`, `:63-67`). The prebuilt manifest declares `android:supportsRtl="true"`, and nothing
in the source disallows it (`evidence/ui-strings.md` section 4). So a 1.x install on a phone set
to Arabic is mirrored today, before any of this work.

`I18nManager.allowRTL(false)` is not the fix. It writes a preference that the next launch
reads (`I18nUtil.kt:39-44`), so the first launch on such a phone would still be mirrored.

The fix is one config plugin, `plugins/ltrOnly.js`, modelled on `plugins/portraitOnlyIpad.js`:
`withAndroidManifest` sets `android:supportsRtl` to `"false"` on the application node. It is
idempotent, because prebuild re-runs over an existing folder. It is registered in `app.json`
`plugins` beside the other three local plugins (`app.json:196-198`). With the flag off,
`isRTL` is false from the first frame of the first launch.

iOS mirrors only when the app bundle's own preferred localisation is right-to-left
(`node_modules/react-native/React/Modules/RCTI18nUtil.m:32-41`, `:101-105`). The bundle declares
no localisations, so it never is. Two rules keep it so: `app.json` gains no `locales` key and no
`CFBundleLocalizations`, and `shared/__tests__/nativeConfig.test.ts` pins both absences and the
plugin's presence (document 06, T-ROW-5).

For a user on a right-to-left phone this is a visible change at 2.0.0: the row stops being
mirrored. It is the constraint as stated, and it is listed for the owner in the proposal.

**A consequence the owner must see before S12 merges.** The Arabic column and the time column
share the free width equally today (`components/prayer/Prayer.tsx:113-116`,
`components/prayer/Time.tsx:63-66`). With the Arabic column gone the time centres in all of that
width, so for every user who had the toggle on, which is the default (`stores/ui.ts:132`), the
time moves left. That is what "names left, time centre, icons right" means on today's styles.
Nothing in this design can avoid it short of keeping an empty column.

Two device gates cover what Jest cannot measure (document 06): a right-to-left name sits on the
physical left on both platforms (D-1), and a phone whose system language is right-to-left does
not mirror the row on its first launch (D-6).

### The name column width

The width is measured from one hidden `Text` per schedule, chosen by character count, cached
under a key with no language in it, and never allowed to shrink
(`components/ui/InitialWidthMeasurement.tsx:17-28`, `shared/prayer.ts:196-209`,
`stores/ui.ts:104-107`, `:216-231`). Character count is not width outside Latin script, and a
cache that only grows would pin the widest language ever used.

```ts
// stores/ui.ts
/** One atom per locale and schedule, built once at module evaluation */
export const nameWidthAtoms: Readonly<Record<LocaleCode, Readonly<Record<ScheduleType, StoredNumberAtom>>>>;
export const nameWidthKey = (locale: LocaleCode, schedule: ScheduleType): string;
//   locale === 'en' ? `prayer_max_english_width_${schedule}`
//                   : `prayer_max_english_width_${schedule}_${locale}`
export const setNameWidth = (locale: LocaleCode, schedule: ScheduleType, width: number): void;  // grow-only, as today
```

- The `en` keys are the 1.x keys, so an upgrading English user keeps the cached width and sees
  no reflow.
- Every key keeps the `prayer_max_english_width_` prefix, so both keep lists already cover them
  (`stores/version.ts:155`, `stores/sync.ts:364-365`). The word `english` in a key that holds
  another language's width is a frozen token, not a description.
- `InitialWidthMeasurement` draws one hidden `Text` per prayer id (eleven), each keyed
  `${language}:${id}` so a switch remounts and re-measures them, and reports each width to
  `setNameWidth(language, schedule, width)`. The maximum wins through grow-only.
- `usePrayer` reads `nameWidthAtoms[language][schedule]` and returns it as `ui.nameWidth`
  (`hooks/usePrayer.ts:81`, `:100`, `:117`).

The first frames after a switch to a language never measured use width 0, then the measured
width, exactly as a fresh install does today in English.

## 6. Settings row and language sheet

`components/sheets/screens/Settings.tsx`:

- Delete the `Show arabic names` toggle (`:128-132`) and its atom (`:22`, `:37`).
- Add one chevron row as the first child of the Display card, above the toggle list
  (`:114-116`). It is the same element tree and the same styles as the Help row (`:173-184`,
  styles `:222-247`): circle, icon, label, chevron. Label `t('settings.language.label')`.
  `accessibilityLabel` is `a11y.settings.language` filled with the current endonym.
- Its press handler mirrors `handleAthanPress` (`:41-45`): medium haptic, `hideSettingsSheet()`,
  `showLanguageSheet()`.
- The icon is `Icon.GLOBE`, a new member of the `Icon` enum (`shared/types.ts:243-258`) with a
  new file `assets/icons/svg/globe.svg` registered in `assets/icons/svg/index.ts`. It is the one
  new drawing in this design and needs the owner's approval on a device before S13 merges.

`components/sheets/screens/Language.tsx` (new), exported as `BottomSheetLanguage`:

- Built on the `Sheet` part with `title={t('sheet.language.title')}`,
  `subtitle={t('sheet.language.subtitle')}`, the default scrollable body
  (`components/sheets/parts/Sheet.tsx:110-124`, `:205`) and `snapPoints={['85%']}` like the
  other full sheets.
- One row per entry of `SELECTABLE_LOCALES`, in registry order. Each row is a `Pressable` with
  the Help row's container style, the locale's endonym as its label and `Icon.CHECK` in the
  trailing position on the selected row only. An endonym is pack metadata in its own script and
  is never translated.
- Press: medium haptic, `commitLanguageSelection(code)` not awaited, dismiss the sheet.
- `accessibilityLabel`: `a11y.sheet.language.selected` on the selected row,
  `a11y.sheet.language.option` on the rest.

Wiring: `languageSheetModalAtom`, `setLanguageSheetModal`, `showLanguageSheet` in `stores/ui.ts`
beside the three existing sheet refs (`stores/ui.ts:90-97`, `:144-175`). The sheet mounts beside
the other four in `app/_layout.tsx:88-91` and is exported from `components/sheets/index.ts`.

## 7. Native alert dialogs

The permission dialog (`hooks/useNotification.ts:57-67`) and the qibla location dialog read
`getCatalog()` when they open. They are built at the moment of display, so they are live, not
baked. Their keys are in `02a-catalog-keys.md`.

## 8. Outside the app's reach at 2.0.0

| Text | Why | State at 2.0.0 |
| --- | --- | --- |
| Widget gallery names and descriptions, 14 kinds | compiled into the native project at build (`app.json:204-379`, `evidence/widgets.md` section 2.6); the system picks a translation by device language, never by an in-app choice | English |
| App name, two permission purpose strings | the same (`app.json:3`, `:23-25`) | English |
| The library's fallback channel name | a string resource inside the library | `Miscellaneous` |
| Widget neutral card | drawn with no props (decision 3 above) | English |
| Widget library error boxes | drawn by the library (`evidence/widgets.md` section 2.7) | English |
| Digits in the iOS widget countdown, if D-4 fails | drawn by the system | device numbering system |

The first two rows can follow the device language later through native string resources
generated from the catalog at prebuild. That is a 2.x step and is not specified here.
