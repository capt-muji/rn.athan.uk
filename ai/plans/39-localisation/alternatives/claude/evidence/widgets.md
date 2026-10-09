# Evidence: the widget pipeline

Facts only, read from the code at base commit `c3149dfc`. Every claim cites `path:line` relative to
the repo root. Section 8 lists what was read in full and what was read in part.

Terms used below:

- **Kind**: one registered widget name. There are 14: eight home kinds and six lock kinds
  (`app.json:206-378`).
- **Layout function**: a function carrying the `'widget'` directive. There are four: one in
  `widgets/PrayerWidget.tsx:81` and three in `widgets/LockPrayerWidget.tsx:44`, `:197`, `:338`.
- **Widget runtime**: the separate JavaScript context the OS widget process runs the layout in.

## 1. Props contract

### 1.1 iOS timeline entry: `PrayerWidgetProps`

Declared at `shared/widgetTypes.ts:62-118`. All 14 kinds on iOS receive this shape.

| Field | Type | Declared | Built at | Value |
| --- | --- | --- | --- | --- |
| `v` | `number` | `shared/widgetTypes.ts:64` | `shared/widgetTimeline.ts:185`, `:244` | `WIDGET_PROPS_VERSION`, which is `5` (`shared/widgetTypes.ts:14`) |
| `schedule` | `'standard' \| 'extra'`, optional | `shared/widgetTypes.ts:72` | `shared/widgetTimeline.ts:186`, `:245` | `sequence.type` |
| `theme` | `'light' \| 'dark'`, optional | `shared/widgetTypes.ts:79`, `:30` | `shared/widgetTimeline.ts:187`, `:246` | the caller's theme argument |
| `nextName` | `string` | `shared/widgetTypes.ts:81` | `shared/widgetTimeline.ts:188`, `:247` | `next.english` |
| `nextTime` | `string` | `shared/widgetTypes.ts:83` | `shared/widgetTimeline.ts:189`, `:248` | `next.time`, `HH:mm` |
| `nextEpochMs` | `number` | `shared/widgetTypes.ts:85` | `shared/widgetTimeline.ts:190`, `:249` | the next prayer's instant |
| `prevEpochMs` | `number` | `shared/widgetTypes.ts:91` | `shared/widgetTimeline.ts:191`, `:250` | the previous row's instant, or the entry date when there is none |
| `dateLabel` | `string` | `shared/widgetTypes.ts:93` | `shared/widgetTimeline.ts:192`, `:251` | `formatDateLabel(next.belongsToDate, settings.hijriDate)` |
| `prayers` | `WidgetPrayerRow[]`, optional | `shared/widgetTypes.ts:104` | `shared/widgetTimeline.ts:193` | the day list, absent on the stale entry |
| `activeIndex` | `number`, optional | `shared/widgetTypes.ts:111` | `shared/widgetTimeline.ts:194` | index of the next prayer in `prayers`, or `-1` |
| `stale` | `boolean`, optional | `shared/widgetTypes.ts:117` | `shared/widgetTimeline.ts:252` | `true` on the terminal entry only |

`WidgetPrayerRow` is `{ name: string; time: string }` (`shared/widgetTypes.ts:48-53`). It is built
at `shared/widgetTimeline.ts:135` as `{ name: prayer.english, time: prayer.time ?? UNAVAILABLE_TIME }`.

The builder is `buildPrayerWidgetTimeline` (`shared/widgetTimeline.ts:161-257`). Normal entries come
from `makeEntry` (`shared/widgetTimeline.ts:173-197`). The stale entry is pushed at
`shared/widgetTimeline.ts:241-254`.

The wrapper around each props object is `WidgetTimelineEntry`, which is `{ date: Date; props }`
(`node_modules/expo-widgets/src/Widgets.types.ts:146-154`). The library converts each entry to
`{ timestamp: entry.date.getTime(), props: entry.props }` before it crosses to native
(`node_modules/expo-widgets/src/Widgets.ts:57-59`).

### 1.2 Android snapshot: `PrayerWidgetAndroidProps`

Declared at `shared/widgetTypes.ts:154-173`. Only the eight home kinds receive it. Lock kinds have
`"android": null` in config (`app.json:332`, `:341`, `:350`, `:359`, `:368`, `:377`).

| Field | Type | Declared | Built or stamped at |
| --- | --- | --- | --- |
| `v` | `number` | `shared/widgetTypes.ts:156` | `shared/widgetTimeline.ts:315`. `ANDROID_SNAPSHOT_VERSION` is `1` (`shared/widgetTypes.ts:21`) |
| `schedule` | `'standard' \| 'extra'` | `shared/widgetTypes.ts:158` | `shared/widgetTimeline.ts:316` |
| `theme` | `'light' \| 'dark'` | `shared/widgetTypes.ts:160` | stamped per kind at `stores/widget.ts:374` from the table at `stores/widget.ts:272-288` |
| `size` | `'small' \| 'medium'` | `shared/widgetTypes.ts:162` | stamped per kind at `stores/widget.ts:374`. Rewritten natively at `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshScheduler.kt:113` |
| `grantedWidthDp` | `number`, optional | `shared/widgetTypes.ts:168` | written natively only, at `WidgetRefreshScheduler.kt:113`. Key constant at `WidgetRefreshScheduler.kt:67` |
| `days` | `AndroidWidgetDay[]` | `shared/widgetTypes.ts:170` | `shared/widgetTimeline.ts:317` |
| `horizonEpochMs` | `number` | `shared/widgetTypes.ts:172` | `shared/widgetTimeline.ts:318`, computed at `:304` |

`AndroidWidgetDay` is `{ dateLabel: string; startEpochMs: number; rows: AndroidWidgetDayRow[] }`
(`shared/widgetTypes.ts:141-147`), built at `shared/widgetTimeline.ts:289-297`.

`AndroidWidgetDayRow` is `{ name: string; time: string; epochMs: number }`
(`shared/widgetTypes.ts:127-134`). A readable row is built at `shared/widgetTimeline.ts:303`. An
unreadable row is built at `shared/widgetTimeline.ts:306` with `time: UNAVAILABLE_TIME` and
`epochMs: 0`. Zero is used because JSON null cannot cross the Kotlin bridge inside nested maps
(`shared/widgetTypes.ts:120-126`).

The builder is `buildPrayerWidgetSnapshot` (`shared/widgetTimeline.ts:277-320`). It returns the
shape without `theme` and `size` (`shared/widgetTimeline.ts:280`). It returns `null` when no row is
readable (`shared/widgetTimeline.ts:310-312`).

### 1.3 The schema version field

- Both builders stamp `v` (`shared/widgetTimeline.ts:185`, `:244`, `:315`).
- No layout function reads `v`. A search of `widgets/*.tsx` for a read of `.v` finds none.
- The native scheduler does not read `v` either (`WidgetRefreshScheduler.kt:109-113` reads `size`
  and `grantedWidthDp` only).
- Layouts tolerate older shapes by checking fields instead:
  - `'days' in props` picks the Android shape (`widgets/PrayerWidget.tsx:90`).
  - `props?.theme ?? fallbackTheme` (`widgets/PrayerWidget.tsx:127`).
  - `props?.schedule === 'extra'` (`widgets/PrayerWidget.tsx:125`).
  - Both segment bounds must be numbers or the stale card shows (`widgets/PrayerWidget.tsx:537-540`,
    `widgets/LockPrayerWidget.tsx:86-87`, `:239-240`, `:388-389`).
  - `Array.isArray(entry.prayers)` and a numeric `activeIndex` gate the medium list
    (`widgets/PrayerWidget.tsx:560-562`).
  - A row epoch that is not greater than now is skipped, which covers `0` and a stored `null`
    (`widgets/PrayerWidget.tsx:352-353`).
- Tests pin the stamp: `shared/__tests__/widgetTimeline.test.ts:235-239`,
  `shared/__tests__/widgetSnapshot.test.ts:169-174`, `stores/__tests__/widgetAndroid.test.ts:151-164`,
  `stores/__tests__/widgetSettingsSync.test.ts:351`.
- Renderer fixtures pass `v: 4` to the home layout (`shared/__tests__/widgetRenderer.test.ts:233`,
  `:342`, `:522`) and `v: 5` to the lock layouts (`shared/__tests__/widgetLockRenderer.test.ts:114`).
  Both render the same, which matches the layouts never reading it.

### 1.4 The absent-props guard

| Site | Guard | Result |
| --- | --- | --- |
| `widgets/PrayerWidget.tsx:90` | `props !== null && 'days' in props` | picks the Android shape |
| `widgets/PrayerWidget.tsx:131` | `props === null ? null : props` | `entry` |
| `widgets/PrayerWidget.tsx:520-525` | `entry == null` | neutral card |
| `widgets/PrayerWidget.tsx:527-532` | Android runtime and `androidProps === null` | neutral card |
| `widgets/LockPrayerWidget.tsx:81-83` | `props == null` | `neutralForFamily()` |
| `widgets/LockPrayerWidget.tsx:234-236` | `props == null` | `neutralForFamily()` |
| `widgets/LockPrayerWidget.tsx:381-383` | `props == null` | `neutralForFamily()` |

How absent props arrive, by platform:

- iOS passes JavaScript `undefined` when the entry has no props
  (`node_modules/expo-widgets/ios/Widgets/WidgetsJSRuntime.swift:20-23`). An entry has no props when
  no timeline is stored and no initial props exist
  (`node_modules/expo-widgets/ios/Widgets/Utils.swift:17-20`,
  `node_modules/expo-widgets/ios/Widgets/TimelineProvider.swift:4-6`). No `createWidget` call in this
  repo passes initial props (`widgets/PrayerWidget.tsx:769-776`, `widgets/LockPrayerWidget.tsx:192-193`,
  `:335-336`, `:494-495`).
- Android passes an empty object. `Arguments.makeNativeMap(null)` returns an empty map
  (`node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/bridge/Arguments.kt:102-106`),
  called at `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsJSRuntime.kt:18-22`.
  An empty object has no `days`, so the home layout reaches the neutral card through
  `widgets/PrayerWidget.tsx:527-530`.

One observation on the home layout, not verified on a device in this sweep. The first guard is
strict (`props !== null`, `widgets/PrayerWidget.tsx:90`) and sits outside the `try` that starts at
`widgets/PrayerWidget.tsx:534`. In JavaScript `'days' in undefined` throws a `TypeError`. The
renderer suite passes `null`, never `undefined`, for the props-less case
(`shared/__tests__/widgetRenderer.test.ts:380`, `:440`, `:513`, `:915`). The lock layouts use the
loose `props == null`, which covers both.

## 2. Every piece of text a widget draws

"Baked" means the app wrote the string into props before the push. "Literal" means the string is
typed inside the layout function. "OS" means the operating system formats it at draw time.

### 2.1 Home layout, iOS composition (`widgets/PrayerWidget.tsx`)

| `file:line` | Text | Source | Format |
| --- | --- | --- | --- |
| `widgets/PrayerWidget.tsx:611` | next prayer name | baked: `nextName`, from `next.english` (`shared/widgetTimeline.ts:188`) | English name from `PRAYERS_ENGLISH` or `EXTRAS_ENGLISH` (`shared/constants.ts:9`, `:26`). Drawn upper case by the `textCase('uppercase')` modifier (`widgets/PrayerWidget.tsx:606`), with `kerning(0.5)` (`:607`) |
| `widgets/PrayerWidget.tsx:615-619` | countdown | OS: SwiftUI `Text(timerInterval:)` from `prevEpochMs` and `nextEpochMs` | The layout passes two `Date` objects (`widgets/PrayerWidget.tsx:616`). The native view builds the timer text (`node_modules/@expo/ui/ios/TextView.swift:48-57`). No string and no digit comes from the app. `monospacedDigit()` is applied (`widgets/PrayerWidget.tsx:592`) |
| `widgets/PrayerWidget.tsx:627` | next prayer time | baked: `nextTime`, from `next.time` (`shared/widgetTimeline.ts:189`) | `HH:mm` built from zero-padded numbers (`shared/time.ts:175-178`, `:23`) |
| `widgets/PrayerWidget.tsx:640` | footer | derived in the layout from baked `dateLabel` | See 2.5 |
| `widgets/PrayerWidget.tsx:668` | list row name | baked: `prayers[i].name`, from `prayer.english` (`shared/widgetTimeline.ts:135`) | English name. Also used as the React key of the row (`widgets/PrayerWidget.tsx:737`) |
| `widgets/PrayerWidget.tsx:678` | list row time | baked: `prayers[i].time` (`shared/widgetTimeline.ts:135`) | `HH:mm`, or `--:--` (`UNAVAILABLE_TIME`, `shared/constants.ts:268`) |
| `widgets/PrayerWidget.tsx:493` | `Out of date` | literal | stale card title |
| `widgets/PrayerWidget.tsx:495` | `Open Athan to refresh` | literal | stale card, medium |
| `widgets/PrayerWidget.tsx:498` | `Open Athan` | literal | stale card, small, line 1 |
| `widgets/PrayerWidget.tsx:499` | `to refresh` | literal | stale card, small, line 2 |
| `widgets/PrayerWidget.tsx:524` | `Athan` and `Prayer times for London` | literal | neutral card, no props |
| `widgets/PrayerWidget.tsx:759` | `Athan` and `Open the app to refresh` | literal | neutral card after a render error |

### 2.2 Home layout, Android composition (`widgets/PrayerWidget.tsx`)

| `file:line` | Text | Source | Format |
| --- | --- | --- | --- |
| `widgets/PrayerWidget.tsx:378` | next prayer name | baked: `row.name`, from `prayer.english` (`shared/widgetTimeline.ts:303`) | upper-cased in the layout with `next.name.toUpperCase()` |
| `widgets/PrayerWidget.tsx:380` | countdown | computed in the layout by `ALabel` (`widgets/PrayerWidget.tsx:292-299`) | Minutes rounded up, never below 1. Three literal templates: `${minutes}m`, `${hours}h`, `${hours}h ${minutes}m` (`:296-298`). The unit letters `h` and `m` are literals in the layout |
| `widgets/PrayerWidget.tsx:382` | next prayer time | baked: `row.time` (`shared/widgetTimeline.ts:303`) | `HH:mm` |
| `widgets/PrayerWidget.tsx:283`, `:456` | footer | derived in the layout by `AFooter` (`widgets/PrayerWidget.tsx:303-310`) from baked `day.dateLabel` (`shared/widgetTimeline.ts:290`) | See 2.5 |
| `widgets/PrayerWidget.tsx:439` | list row name | baked: `row.name` (`shared/widgetTimeline.ts:303`, `:306`) | English name |
| `widgets/PrayerWidget.tsx:442` | list row time | baked: `row.time` (`shared/widgetTimeline.ts:303`, `:306`) | `HH:mm` or `--:--` |
| `widgets/PrayerWidget.tsx:316` | `Athan` | literal | neutral card |
| `widgets/PrayerWidget.tsx:318` | `Prayer times for London` | literal | neutral card |
| `widgets/PrayerWidget.tsx:328` | `Out of date` | literal | stale card |
| `widgets/PrayerWidget.tsx:331` | `Open Athan to refresh` | literal | stale card, medium |
| `widgets/PrayerWidget.tsx:334` | `Open Athan` | literal | stale card, small |
| `widgets/PrayerWidget.tsx:336` | `to refresh` | literal | stale card, small |

The Android composition has no error-fallback card of its own. A layout evaluation failure falls to
the library, which draws its own English message
(`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsUtils.kt:28-32`,
`:46-53`).

### 2.3 Lock layouts (`widgets/LockPrayerWidget.tsx`), iOS only

The three layout functions repeat the same fallback strings. Lines are given for Layout 1, Layout 2
and Layout 3 in that order.

| `file:line` | Text | Source | Format |
| --- | --- | --- | --- |
| `:169`, `:313`, `:466` | next prayer name | baked: `nextName` | English name, no case change |
| `:171-183`, `:473-483` | countdown (Layouts 1 and 3) | OS: SwiftUI timer text from the two epochs (`:127`, `:435`) | as 2.1 |
| `:325`, `:470` | next prayer time (Layouts 2 and 3) | baked: `nextTime` | `HH:mm` |
| `:140`, `:283`, `:450` | inline face | baked name and time, joined in the layout as `{props.nextName} {props.nextTime}` | name, one space, time. The order is fixed in the layout |
| `:60`, `:213`, `:358` | `Athan — prayer times` | literal | inline placeholder. The dash is U+2014 |
| `:73`, `:226`, `:371` | `ATHAN` | literal | rectangular placeholder, line 1 |
| `:75`, `:228`, `:373` | `Open to load times` | literal | rectangular placeholder, line 2 |
| `:97`, `:250`, `:399` | `Athan — open to refresh times` | literal | inline stale. The dash is U+2014 |
| `:112`, `:265`, `:417` | `Out of date` | literal | rectangular stale, title |
| `:115`, `:268`, `:420` | `Open app to refresh` | literal | rectangular stale, line 2 |

The render-error path of each lock layout reuses `neutralForFamily()` (`widgets/LockPrayerWidget.tsx:187-189`,
`:330-332`, `:486-489`).

### 2.4 Where the baked names and times come from

- `Prayer.english` and `Prayer.arabic` are both fields of every row (`shared/types.ts:270`, `:272`).
- Names are assigned from the constant arrays in `createPrayersForSingleDay`
  (`shared/prayer.ts:382-389`, `:415-417`), fed by `getPrayerNamesForDate` (`shared/prayer.ts:314-329`).
- No widget code path reads `arabic`. The builders read `english` only
  (`shared/widgetTimeline.ts:135`, `:188`, `:247`, `:303`, `:306`). The layout header says the list
  shows no Arabic names (`widgets/PrayerWidget.tsx:69`).
- `time` is the stored `HH:mm` string, or `formatPrayerTime` output for computed rows
  (`shared/prayer.ts:405`, `shared/time.ts:175-178`).

### 2.5 The date label and the footer

The app bakes one label string per entry or per day:

- `formatDateLabel` picks the formatter from the Hijri preference (`shared/widgetTimeline.ts:114-116`).
- Gregorian: `formatDateLong` uses date-fns `format` with the pattern `EEE, d MMM yyyy` and no locale
  argument (`shared/time.ts:229-233`, import at `shared/time.ts:1`). The doc comment gives
  `Fri, 20 Nov 2024` as the shape (`shared/time.ts:227`).
- Hijri: `formatHijriDateLong` uses `Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', ...)` with a
  long month, then strips a trailing ` AH` with a regex (`shared/time.ts:241-254`). The doc comment
  gives `Rajab 1, 1447` as the shape (`shared/time.ts:239`). It falls back to `formatDateLong` on a
  throw (`shared/time.ts:251-253`).

The layout then cuts the label down itself, with string operations on that English shape:

1. Take the text before the first comma: `label.split(',')[0]` (`widgets/PrayerWidget.tsx:304`, `:546`).
2. Split that on a single space (`widgets/PrayerWidget.tsx:305`, `:547`).
3. One token: the footer is that token (`widgets/PrayerWidget.tsx:306`, `:549-550`). This is the
   Gregorian case, where the token is the weekday abbreviation.
4. More than one token: the footer is the first three characters of the first token, a space, and
   the last token (`widgets/PrayerWidget.tsx:307-309`, `:552-554`). This is the Hijri case, giving a
   shape like `Raj 1`.

A comment records that the iOS widget runtime does not split on a regex separator, so only plain
string separators are used (`widgets/PrayerWidget.tsx:542-544`).

Tests pin this: `shared/__tests__/widgetRenderer.test.ts:260-262` (weekday kept whole),
`:358-361` and `:541-552` (`Rajab 1, 1448` becomes `Raj 1`), `:455-462` (empty label gives an empty
footer).

The lock layouts never draw `dateLabel`.

### 2.6 Text fixed at build time, outside the layouts

| `file:line` | Text | Where it lands |
| --- | --- | --- |
| `app.json:207`, `:222`, `:237`, `:252`, `:267`, `:282`, `:297`, `:312`, `:327`, `:336`, `:345`, `:354`, `:363`, `:372` | `displayName` of each kind, for example `Next Prayer (Light)`, `Extra Times (Dark)`, `Next Prayer (Layout 1)` | iOS: a Swift string literal in `.configurationDisplayName(...)` (`node_modules/expo-widgets/plugin/build/ios/withWidgetSourceFiles.js:336`, `:454`). Android: a `strings.xml` resource used as `android:label` (`node_modules/expo-widgets/plugin/build/android/withAndroidWidgetFiles.js:197`, `node_modules/expo-widgets/plugin/build/android/withAndroidWidgetManifest.js:26`) |
| `app.json:208`, `:223`, `:238`, `:253`, `:268`, `:283`, `:298`, `:313`, `:328`, `:337`, `:346`, `:355`, `:364`, `:373` | `description` of each kind, for example `A countdown to the next prayer.` | iOS: `.description(...)` (`withWidgetSourceFiles.js:337`, `:455`). Android: a `strings.xml` resource used as `android:description` (`withAndroidWidgetFiles.js:198`, `:157`) |
| `app.json:3`, `:23` | app name `Athan` | `name` and `CFBundleDisplayName`. `app.config.ts:18` and `:27` append a suffix only for suffixed test builds |
| `app.json:24-25` | two iOS permission strings in English | `infoPlist` |

Each kind has one `displayName` and one `description`. `app.json` has no `locales` key, no
`CFBundleLocalizations` and no `CFBundleDevelopmentRegion`. `package.json` lists no localisation
package. `app.config.ts` contains no locale or language logic (`app.config.ts:1-108`).

### 2.7 Text drawn by library code

- iOS red box when no layout is stored: `No layout found for <group>::<kind>`
  (`node_modules/expo-widgets/ios/Widgets/EntryView.swift:32`).
- iOS red box with the JavaScript error message when evaluation fails
  (`node_modules/expo-widgets/ios/Widgets/Utils.swift:65-77`).
- Android `No layout found for <kind>`
  (`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetsPeekWidget.kt:25-26`).

### 2.8 Typography and direction facts

- No layout sets a font family. iOS text uses `font({ size, weight })` only
  (`widgets/PrayerWidget.tsx:483`, `:493`, `:514-515`, `:588`, `:604`, `:622`, `:633`, `:663`, `:673`).
  Android text passes size and weight only (`widgets/PrayerWidget.tsx:248-252`, `:254-258`).
- The app's font plugin registers two Roboto files (`app.json:74-79`). Neither is referenced by a
  widget layout.
- No layout sets a locale or a layout direction. The imported modifier lists contain neither
  (`widgets/PrayerWidget.tsx:14-21`, `:23-38`; `widgets/LockPrayerWidget.tsx:2-13`).
- The installed `@expo/ui` has an environment modifier that accepts a `locale` key
  (`node_modules/@expo/ui/ios/Modifiers/EnvironmentModifier.swift:6-11`, `:69-74`). No layout uses it.
- iOS list rows put the name first and the time last in an `HStack` with a `Spacer`
  (`widgets/PrayerWidget.tsx:654-680`). Android list rows use two fixed-width boxes, name box
  aligned `centerStart` and time box aligned `centerEnd` (`widgets/PrayerWidget.tsx:437-444`).
- Android list text size scales with the granted width between 10 and 13
  (`widgets/PrayerWidget.tsx:196`, `:224`, `:423`). The comment names `Last Third` as the string that
  clips first (`widgets/PrayerWidget.tsx:421-422`). The name box width scales from a reference of
  82 at 347 inner width (`widgets/PrayerWidget.tsx:221-222`, `:413`).
- iOS name text shrinks with `minimumScaleFactor(0.6)` in the hero and `0.8` in list rows
  (`widgets/PrayerWidget.tsx:609`, `:666`). Lock names use `0.6` (`widgets/LockPrayerWidget.tsx:165`,
  `:309`). Layout 3 sets no scale factor on its name (`widgets/LockPrayerWidget.tsx:465-467`).
- Every text is single-line: `lineLimit(1)` on iOS and `maxLines={1}` on Android
  (`widgets/PrayerWidget.tsx:249`, `:255`, `:483`, `:590`, `:608`, `:625`, `:636`, `:665`, `:676`).

## 3. Runtime constraints

### 3.1 What the layout modules import today

`widgets/PrayerWidget.tsx`:

- `@expo/ui/jetpack-compose` (`:9`), `@expo/ui/jetpack-compose/modifiers` (`:14-21`).
- `@expo/ui/swift-ui` (`:22`), `@expo/ui/swift-ui/modifiers` (`:23-38`).
- `expo-widgets`: `createWidget` and the type `WidgetEnvironment` (`:39`).
- Type-only: `react` (`:40`) and `@/shared/widgetTypes` (`:42`).

`widgets/LockPrayerWidget.tsx`:

- `@expo/ui/swift-ui` (`:1`), `@expo/ui/swift-ui/modifiers` (`:2-13`).
- `expo-widgets` (`:14`).
- Type-only: `react` (`:15`) and `@/shared/widgetTypes` (`:17`).

Neither file imports a value from any app module. Neither file declares a module-level constant
other than the layout functions and the `createWidget` exports.

### 3.2 Why a layout function cannot use a module constant or an import

1. The Babel preset adds a widgets plugin when `expo-widgets` is installed
   (`node_modules/babel-preset-expo/build/configs/expo.js:88-89`).
2. That plugin finds every function whose body has the `'widget'` directive
   (`node_modules/babel-preset-expo/build/plugins/widgets-plugin.js:117-122`) and replaces the
   function with a template literal holding its own generated source text (`:92-103`, `:130-135`).
3. Only the function's parameters and body go into the string (`:131`). A name declared outside
   the function is not in it.
4. `createWidget` passes that string to native as the layout
   (`node_modules/expo-widgets/src/Widgets.ts:35-39`). Native stores it under the kind's layout key
   (`node_modules/expo-widgets/ios/WidgetObject.swift:8`,
   `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetObject.kt:13`).
5. The widget runtime evaluates the string as an expression and calls it
   (`node_modules/expo-widgets/ios/Widgets/WidgetsJSRuntime.swift:106-122`, `:20-22`;
   `node_modules/expo-widgets/bundle/index.ts:59-71`).
6. The only names that resolve there are JavaScript built-ins and the globals the runtime bundle
   installs: the React stub, the JSX runtime stub, the React Native stub and every export of
   `@expo/ui` for that platform (`node_modules/expo-widgets/bundle/index.ts:104-112`,
   `node_modules/expo-widgets/bundle/ui-globals.ts:1-2`,
   `node_modules/expo-widgets/bundle/ui-globals.android.ts:1-2`).

So a layout function may reference its two parameters, its own locals, `@expo/ui` export names
under their original spelling, and JavaScript built-ins. Helper functions and constants must be
declared inside the function body. The in-file comments say the same
(`widgets/PrayerWidget.tsx:76-79`, `:95`; `widgets/LockPrayerWidget.tsx:39-41`, `:195-196`).

The runtime engines differ. iOS uses JavaScriptCore (`WidgetsJSRuntime.swift:2`, `:71`). Android
uses Hermes (`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsJSRuntime.kt:6`,
`:39-44`). The React in that runtime is a stub: hooks return their initial value and effects do
nothing (`node_modules/expo-widgets/bundle/react-stub.ts:49-66`).

### 3.3 The Android embedded layout

Each home kind names `./widgets/PrayerWidget` as its Android `initialLayout`
(`app.json:217`, `:232`, `:247`, `:262`, `:277`, `:292`, `:307`, `:322`). At build time a script
imports that file and captures the layout strings
(`node_modules/expo-widgets/scripts/build-layout-registry.mjs:61-81`, `:115-120`). That build
resolves every bare module specifier other than `expo-widgets` to an empty module
(`node_modules/expo-widgets/layout-registry.metro.config.js:12-26`). Only relative imports are
followed. The captured string is the fallback when no layout is stored yet
(`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsLayoutRegistry.kt:16-19`).

No kind sets an iOS `initialLayout`, and the iOS plugin reads only `widget.ios?.initialLayout`
(`node_modules/expo-widgets/plugin/build/ios/withWidgetSourceFiles.js:105`, `:198-200`). So iOS has
no embedded layout: until the app's JavaScript registers one, the iOS widget draws the library's
red box (`node_modules/expo-widgets/ios/Widgets/EntryView.swift:28-33`).

### 3.4 How the rules are enforced

| Rule | Enforced by |
| --- | --- |
| A layout function references only its params, locals, `@expo/ui` imports and a fixed list of built-ins | `shared/__tests__/widgetContract.test.ts:94-144`, test name `references only its own params, locals, and @expo/ui globals`. The allowed built-ins are `Date`, `Math`, `JSON`, `Infinity`, `NaN`, `undefined`, `String`, `Number`, `Boolean`, `Array`, `Object` (`:37-49`). `Intl` is not on the list |
| Every colour literal in both files is on an allow list | `shared/__tests__/widgetContract.test.ts:243-295`, with anchors at `:192-241` |
| The home file imports the jetpack sources and detects Android by `typeof Column` | `shared/__tests__/widgetContract.test.ts:303-308` |
| No `@expo/ui` import is aliased | `shared/__tests__/widgetContract.test.ts:310-332` |
| No dynamic `import()` in a layout file | `shared/__tests__/widgetContract.test.ts:336-341` |
| `stores/widget.ts` loads layouts by synchronous `require` and pushes all eight home kinds | `shared/__tests__/widgetContract.test.ts:343-371` |
| The home file holds one layout function and the lock file three | `shared/__tests__/widgetContract.test.ts:378-399` |
| Every Android drawable the layout names exists, and the generator's colours stay inside the layout palette | `shared/__tests__/widgetAssets.test.ts:32-86` |
| The open-app patch names the installed version and still applies | `shared/__tests__/widgetOpenAppPatch.test.ts:22-63` |
| Both widget packages are pinned to an exact version | `shared/__tests__/widgetRuntimeLoads.test.ts:64-72`; `package.json:58` |

One limit of the closure test: `findWidgetFunction` returns the first directive function in a file
(`shared/__tests__/widgetContract.test.ts:73-88`, the `!found` check at `:81`). In
`widgets/LockPrayerWidget.tsx` that is Layout 1 only. Layouts 2 and 3 are not walked by that test.
They are executed by the renderer suite (`shared/__tests__/widgetLockRenderer.test.ts:126-131`).

No lint rule covers these constraints. `biome.json` has no widget entry.

### 3.5 What the widget runtime load suite checks

`shared/__tests__/widgetRuntimeLoads.test.ts` builds the library's runtime bundle for each platform
with the library's own script (`:12`, `:32`) and evaluates it in the Node VM (`:38`). It asserts the
bundle evaluates without throwing on Android (`:48-54`) and on iOS (`:56-62`). The bundle entry is
the library's `bundle/index.ts` (`node_modules/expo-widgets/scripts/build-bundle.mjs:51-52`). It does
not include or run the app's layout functions. It catches a module-scope failure inside `@expo/ui`
(`shared/__tests__/widgetRuntimeLoads.test.ts:19-25`).

### 3.6 How the layouts are tested

- Jest maps `@/widgets/PrayerWidget` and `@/widgets/LockPrayerWidget` to mocks
  (`jest.config.js:27-28`; `shared/__mocks__/widgets/PrayerWidget.ts:9-23`;
  `shared/__mocks__/widgets/LockPrayerWidget.ts:6-18`).
- The renderer suites load the real files by relative path with the `@expo/ui` sources mocked as
  marker components (`shared/__tests__/widgetRenderer.test.ts:118-138`;
  `shared/__tests__/widgetLockRenderer.test.ts:67-82`).
- `widgets/**` is inside coverage collection (`jest.config.js:106-119`).
- The renderer suites assert literal English strings. Examples:
  `shared/__tests__/widgetRenderer.test.ts:365-370`, `:380`, `:388`, `:405-407`, `:428-436`,
  `:514-515`; `shared/__tests__/widgetLockRenderer.test.ts:252-257`, `:315-316`, `:326-327`.
- A model suite hashes the builder's full JSON output over a year of real data. Twelve SHA-256
  digests are pinned (`shared/__tests__/widgetSimulation.test.ts:645-686`). The hashed JSON contains
  `nextName`, row names and `dateLabel`. The comment says a mismatch means what the widgets show
  changed (`:637-644`).

### 3.7 How helper code is shared

- Home: one layout function is registered under eight kinds (`widgets/PrayerWidget.tsx:769-776`).
  All helpers, both palettes and both platform compositions live inside it
  (`widgets/PrayerWidget.tsx:81-761`).
- Lock: three separate layout functions, two kinds each (`widgets/LockPrayerWidget.tsx:192-193`,
  `:335-336`, `:494-495`). Each repeats its own `WHITE`, `WHITE_MUTED`, `neutralForFamily` and stale
  branches (`:47-79`, `:200-232`, `:342-377`). A comment states that nothing can be shared across
  layouts (`:195-196`).
- Nothing is shared between the two files.

## 4. Timeline and refresh

### 4.1 How iOS entries are built

- One entry per boundary. A boundary is a readable prayer's instant, or London midnight ending a
  held day (`shared/widgetTimeline.ts:140-151`).
- A segment is the next readable prayer, the list day on screen and the boundary
  (`shared/widgetTimeline.ts:82-105`), computed with helpers from `shared/sequence.ts:55`, `:94`, `:127`.
- The loop walks segment by segment from `now` (`shared/widgetTimeline.ts:199-229`).
- Adjacent entries stay at least five minutes apart. `MIN_ENTRY_SPACING_MS` is set at
  `shared/widgetTimeline.ts:60`. The first entry is backdated when a boundary is close
  (`:209-215`). A crowded later flip waits (`:216-221`) or is dropped (`:225`).
- The timeline ends with one stale entry at the last readable prayer (`shared/widgetTimeline.ts:231-254`).
- An empty array is returned when nothing readable is ahead (`shared/widgetTimeline.ts:170-171`).
- Light and dark timelines differ only in `theme` (`shared/__tests__/widgetTimeline.test.ts:259-270`).

### 4.2 The entry-count budget

- `TIMELINE_DAYS = 3` (`shared/widgetTimeline.ts:76`). The comment gives the cost: 23 entries and
  about 9.8 KB at three days (`shared/widgetTimeline.ts:62-70`).
- The push layer builds the sequence over `TIMELINE_DAYS + 1` days starting from yesterday
  (`stores/widget.ts:115-116`, `:172-182`).
- Tests: the horizon is pinned to 3 (`shared/__tests__/widgetTimeline.test.ts:707-713`). Entries
  stay under 22 for the fixture (`:704`, `:746`). Entries never exceed the prayers ahead plus two
  (`:699`). The serialised payload stays under 200,000 characters (`:725-726`, `:748-749`).
- Each entry carries the full props, including up to six row names and the date label
  (`shared/widgetTimeline.ts:182-196`). String length in props therefore multiplies by entry count.
- An over-budget timeline shows a black widget with no error
  (`shared/widgetTimeline.ts:68-70`; `shared/__tests__/widgetTimeline.test.ts:685-691`).

### 4.3 How pushes reach the kinds

iOS (`stores/widget.ts:167-229`):

- Builds a light and a dark timeline per schedule (`:184-185`).
- Skips the push when either is empty (`:187-193`).
- Standard: light entries to `PrayerWidget`, `PrayerWidgetMedium` and the three `PrayerLockWidget`
  kinds, dark entries to the two dark home kinds (`:198-207`).
- Extra: the same for the `Extras` kinds (`:208-218`).
- Any error is logged and swallowed for that schedule (`:226-228`).
- The layout modules are loaded by a lazy synchronous `require` on first use (`stores/widget.ts:50-77`).
  Loading a module runs its `createWidget` calls, which store the layout strings.

Android (`stores/widget.ts:345-389`):

- Builds one snapshot per schedule (`:357`), skips when it is `null` (`:358-361`).
- Calls `updateSnapshot` on the four home kinds with `theme` and `size` stamped (`:373-375`).
- Always arms the JavaScript flip chain in `finally` (`:386-388`).
- After both schedules, arms the native refresh chain (`stores/widget.ts:241-251`).

The library's `updateTimeline` is a no-op on Android (`node_modules/expo-widgets/src/Widgets.ts:53-56`).
Its `updateSnapshot` on Android stores the props and reloads the kind
(`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetObject.kt:25-28`).
On iOS `updateTimeline` stores the entries and reloads the kind's timelines
(`node_modules/expo-widgets/ios/WidgetObject.swift:20-27`, `:16-18`).

### 4.4 Every trigger, app side

All pushes start from `refreshPrayerWidgets` (`stores/widget.ts:237-256`), which returns early when
the platform's flag is off (`:238-239`).

| Trigger | Path | Awaited or deferred |
| --- | --- | --- |
| Launch sync | `stores/sync.ts:47` calls `sync({ deferWidgetRefresh: true })`, then `initializeAppState` (`stores/sync.ts:543`, `:234-261`) | deferred past the first paint (`stores/sync.ts:250-257`) |
| Sync on return from background | `device/listeners.ts:61` calls `sync()` | awaited (`stores/sync.ts:258-259`) |
| Full notification reschedule | end of `_rescheduleAllNotifications` (`stores/notifications.ts:1646-1663`). It returns before the push when no prayer data is stored (`:1604-1610`) | depends on the caller |
| Its caller: alert and reminder commits | `rescheduleAllNotifications` (`stores/notifications.ts:1686-1696`) | deferred (`:1690`) |
| Its caller: athan sound commit | `commitSoundSelection` (`stores/notifications.ts:1711-1721`), and again on its undo path (`:1731-1732`) | deferred (`:1720`) |
| Its caller: foreground refresh gate | `refreshNotifications` (`stores/notifications.ts:1794-1843`), full pass at `:1820`, narrowed repair at `:1808`. Nothing runs when the gate is closed and no prayer is marked (`:1795-1800`) | deferred |
| Its caller: background task | `rescheduleAllNotificationsFromBackground` (`stores/notifications.ts:1860-1878`), started by the task at `device/tasks.ts:23-35`. It also calls `sync()` first (`stores/notifications.ts:1868`), which pushes once on its own | awaited (`:1878`, `:1661`) |
| Widget-visible setting changed | `initWidgetSettingsSync` subscribes to `hijriDateEnabledAtom` only (`stores/widget.ts:139`). One push after a 1000 ms debounce (`stores/widget.ts:94`, `:131-137`) | fire and forget (`:135`) |
| Android minute flip | `scheduleLabelFlipReload` reloads the four kinds each minute while the target is ahead and re-pushes once it has passed (`stores/widget.ts:319-337`) | timer |

`initWidgetSettingsSync` is started once from `initializeListeners` (`device/listeners.ts:22-29`),
which the home screen calls at mount (`app/index.tsx:95`). It is idempotent
(`stores/widget.ts:124-128`).

`readWidgetSettings` returns one field, `hijriDate` (`stores/widget.ts:84-90`).
`PrayerWidgetSettings` has that one field (`shared/widgetTypes.ts:38-41`). The comment says a new
widget-visible setting means a new field there and a new subscription
(`stores/widget.ts:79-83`).

iOS has no timer-driven push. Tests pin that (`stores/__tests__/widgetIo.test.ts:181-190`;
`stores/__tests__/widgetSettingsSync.test.ts:295-316`; `stores/__tests__/widgetPushPastTarget.test.ts:21-43`).
The reason is the reload cost per kind (`stores/widget.ts:19-30`).

### 4.5 Every trigger, native side (Android only)

| Component | Fires on | Does |
| --- | --- | --- |
| `armWidgetRefreshChain` (`modules/widgetrefresh/index.ts:17-27`) | each Android refresh (`stores/widget.ts:246-250`) | calls the native function when the module exists |
| `WidgetRefreshModule` function (`modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshModule.kt:25-32`) | that call | arms the alarm, enqueues the watchdog, registers the system listener |
| `WidgetRefreshModule` `OnCreate` (`WidgetRefreshModule.kt:16-19`) | module creation | registers the system listener |
| `WidgetRefreshReceiver` (`WidgetRefreshReceiver.kt:13-27`) | the minute alarm | re-renders all, re-arms while a widget is placed |
| `WidgetRefreshBootReceiver` (`WidgetRefreshBootReceiver.kt:13-26`; manifest `modules/widgetrefresh/android/src/main/AndroidManifest.xml:6-13`) | `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED` | re-renders all, re-arms, re-enqueues the watchdog |
| `WidgetRefreshSystemListener` (`WidgetRefreshSystemListener.kt:43-49`, `:51-60`) | `ACTION_TIME_TICK` and `ACTION_SCREEN_ON` | re-renders all, never re-arms |
| `WidgetRefreshWatchdogWorker` (`WidgetRefreshWatchdogWorker.kt:21-26`) | every 15 minutes (`WidgetRefreshScheduler.kt:57`, `:173-184`) | re-arms the alarm, never renders |

The Kotlin files above all sit in
`modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/`.

What a native re-render does (`WidgetRefreshScheduler.kt`):

- `updateAll` sends the update broadcast twice, 2500 ms apart (`:132-136`, `:64`).
- `broadcastUpdate` walks the eight home kind names (`:69-78`, `:138-151`), patches the stored
  props, then sends `ACTION_APPWIDGET_UPDATE` to each kind's provider (`:145-149`).
- `patchCompositionSize` reads the stored props JSON and rewrites two fields only: `size` and
  `grantedWidthDp` (`:95-116`).
- `armNext` sets an exact alarm 500 ms past the next minute edge (`:186-208`).

No native code in this repo draws or formats text. Every native re-render runs the stored layout
string against the stored props, so the text comes from the layout literals and the props already
on disk. The JavaScript app process is not needed for a re-render
(`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetsPeekWidget.kt:18-32`).

### 4.6 What is on disk between app runs

- The stored layout string is preferred over the embedded one on both platforms
  (`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsLayoutRegistry.kt:16-19`;
  `node_modules/expo-widgets/ios/Widgets/WidgetsLayoutRegistry.swift:9-19`).
- The stored layout is replaced only when the app's JavaScript evaluates the layout module again
  (`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetObject.kt:12-13`;
  `node_modules/expo-widgets/ios/WidgetObject.swift:6-8`), which happens on the first push of a
  process (`stores/widget.ts:63-77`).
- So after an app update, and after `MY_PACKAGE_REPLACED` re-renders, a placed widget keeps drawing
  the previous version's layout string with the previous version's props until the new version's
  first push. The contract comment expects layouts to tolerate older entries
  (`shared/widgetTypes.ts:10-13`).
- iOS reads the stored timeline again when it ends: the provider uses the `.atEnd` policy
  (`node_modules/expo-widgets/ios/Widgets/TimelineProvider.swift:32-35`). Each read re-parses the
  same stored entries (`node_modules/expo-widgets/ios/Widgets/Utils.swift:17-35`).
- The iOS countdown is drawn by the OS inside the widget process between entries
  (`shared/widgetTimeline.ts:5-10`).

## 5. Storage

### 5.1 App store (MMKV)

The instance id is `athan-storage` for prod and preview builds and `athan-storage-dev` otherwise
(`stores/database.ts:32-35`).

| Key | Value shape | Writer | Reader on the widget path |
| --- | --- | --- | --- |
| `prayer_YYYY-MM-DD` | JSON string of one stored day (`ISingleApiResponseTransformed`) | `stores/database.ts:136-140` | `stores/database.ts:152-158`, reached through `createPrayerSequence` (`shared/prayer.ts:446`) from `stores/widget.ts:115-116` |
| `preference_hijri_date` | boolean | the atom at `stores/ui.ts:123`, set from `components/sheets/screens/Settings.tsx:34`, through the adapter at `stores/storage.ts:85-98` | `stores/widget.ts:88` |

The widget push layer writes no MMKV key. `stores/widget.ts` does not import the database
(`stores/widget.ts:37-48`).

### 5.2 Android native store

SharedPreferences file `expo.modules.widgets`
(`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsStorage.kt:7`). The
same name is hard-coded in the repo's scheduler (`WidgetRefreshScheduler.kt:47`).

| Key | Value shape | Writer | Reader |
| --- | --- | --- | --- |
| `__expo_widgets_<Kind>_layout` | the layout function source string | `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetObject.kt:13` | `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsLayoutRegistry.kt:17` |
| `__expo_widgets_<Kind>_props` | JSON string of `PrayerWidgetAndroidProps` | `WidgetObject.kt:26` (same directory); patched at `WidgetRefreshScheduler.kt:106-115` | `WidgetsLayoutRegistry.kt:22`; `WidgetRefreshScheduler.kt:107` |
| `__expo_widgets_<Kind>_initial_props` | not used: removed at registration | `WidgetObject.kt:17` | `WidgetsLayoutRegistry.kt:27` |

Other persistent Android registrations: the WorkManager unique work
`expo.modules.widgetrefresh.watchdog` (`WidgetRefreshScheduler.kt:50`) and one alarm on a
`PendingIntent` with request code 0 (`WidgetRefreshScheduler.kt:194-199`).

### 5.3 iOS native store

App-group `UserDefaults`. The suite name comes from the Info.plist key
`ExpoWidgetsAppGroupIdentifier` (`node_modules/expo-widgets/ios/WidgetsStorage.swift:2-3`). The
group is configured at `app.json:380`.

| Key | Value shape | Writer | Reader |
| --- | --- | --- | --- |
| `__expo_widgets_<Kind>_layout` | the layout function source string | `node_modules/expo-widgets/ios/WidgetObject.swift:8` | `node_modules/expo-widgets/ios/Widgets/WidgetsLayoutRegistry.swift:10` |
| `__expo_widgets_<Kind>_timeline` | array of `{ timestamp, props }` | `node_modules/expo-widgets/ios/WidgetObject.swift:24` | `node_modules/expo-widgets/ios/Widgets/Utils.swift:18` |
| `__expo_widgets_<Kind>_initial_props` | not used: removed at registration | `node_modules/expo-widgets/ios/WidgetObject.swift:12` | `node_modules/expo-widgets/ios/Widgets/WidgetsLayoutRegistry.swift:22` |

`<Kind>` is one of the 14 names in `app.json:206-378`. The eight home names are repeated as a
Kotlin list at `WidgetRefreshScheduler.kt:69-78`.

### 5.4 In-memory state

`stores/widget.ts` keeps the loaded layout modules (`:60-61`), the settings debounce timer and the
init flag (`:105-106`), and one flip timer per schedule (`:110-113`). None is persisted.

## 6. Assets

- `scripts/generate-widget-assets.py` writes ten PNG files into `assets/widgets/` (`:151-172`):
  four cards (`:159-162`), four pills (`:163-166`) and two moon marks (`:167-168`).
- Its drawing calls are a rounded rectangle (`:86`, `:101`), ellipses (`:120`, `:125`) and a
  polygon (`:135`). It imports `Image` and `ImageDraw` only (`:19`) and loads no font. No asset
  contains rendered text.
- The committed files match that list (`assets/widgets/*.png`; pinned at
  `shared/__tests__/widgetAssets.test.ts:33-46`).
- `plugins/androidWidgetAssets.js` copies every `.png` from `assets/widgets/` into
  `android/app/src/main/res/drawable-nodpi/` at prebuild (`:19-26`). It is added only on the
  Android widget resolution (`app.config.ts:63`).
- `plugins/androidWidgetGrid.js` removes `android:targetCellWidth` and `android:targetCellHeight`
  from each widget provider XML (`:24-36`). It produces no asset. It is registered before
  `expo-widgets` so it runs after it (`app.config.ts:55-62`).
- The Android layout names drawables by string: card (`widgets/PrayerWidget.tsx:235-241`), moon
  (`:242`) and pill (`:243`). None of the names depends on text.
- iOS uses the system symbol `moon.stars.fill` (`widgets/PrayerWidget.tsx:492`;
  `widgets/LockPrayerWidget.tsx:110`, `:263`, `:415`) and draws its card and pill as shapes
  (`widgets/PrayerWidget.tsx:489`, `:693-707`).
- `patches/expo-widgets+58.0.14.patch` adds an `openApp` flag to the Android button converter
  (`:17-31`, `:36-40`, `:44-48`). It touches no text handling.

## 7. What a language change would have to touch

Sites where a different display language needs different bytes. No design is implied.

Strings the app bakes into props:

1. Next prayer name: `shared/widgetTimeline.ts:188`, `:247`.
2. iOS day-list row names: `shared/widgetTimeline.ts:135`.
3. Android row names: `shared/widgetTimeline.ts:303`, `:306`.
4. Date label, Gregorian: `shared/time.ts:229-233`, called from `shared/widgetTimeline.ts:114-116`,
   used at `:179`, `:251`, `:290`.
5. Date label, Hijri: `shared/time.ts:241-254`, same call sites.
6. The prop field docs that say "English": `shared/widgetTypes.ts:49`, `:80`, `:128`.

Literals typed inside layout functions:

7. Home neutral card: `widgets/PrayerWidget.tsx:316`, `:318`, `:524`.
8. Home render-error card: `widgets/PrayerWidget.tsx:759`.
9. Home stale card: `widgets/PrayerWidget.tsx:328`, `:331`, `:334`, `:336`, `:493`, `:495`,
   `:498`, `:499`. The small card splits the sentence across two lines by hand
   (`:333-337`, `:497-500`).
10. Android countdown units `h` and `m`: `widgets/PrayerWidget.tsx:296-298`.
11. Lock placeholders: `widgets/LockPrayerWidget.tsx:60`, `:73`, `:75`, `:213`, `:226`, `:228`,
    `:358`, `:371`, `:373`.
12. Lock stale cards: `widgets/LockPrayerWidget.tsx:97`, `:112`, `:115`, `:250`, `:265`, `:268`,
    `:399`, `:417`, `:420`.

String handling inside layout functions that assumes the English shape:

13. Footer derivation: comma split, space split, first three characters of the first token:
    `widgets/PrayerWidget.tsx:303-310`, `:545-555`.
14. Upper-casing the next prayer name: `widgets/PrayerWidget.tsx:378` (JavaScript) and `:606`
    (SwiftUI modifier).
15. Inline lock face joins name then time with a space: `widgets/LockPrayerWidget.tsx:140`,
    `:283`, `:450`.
16. The iOS day-list row uses the displayed name as its React key: `widgets/PrayerWidget.tsx:737`.
17. Fixed text boxes sized against English name lengths on Android: `widgets/PrayerWidget.tsx:221-224`,
    `:413-423`.

Text the OS formats:

18. The iOS ticking countdown: `widgets/PrayerWidget.tsx:615-619`; `widgets/LockPrayerWidget.tsx:171-183`,
    `:473-483`. The layout sets no locale for it (see 2.8).

Text fixed at build time:

19. Gallery names and descriptions of the 14 kinds: `app.json:206-378` (see 2.6).
20. App name and the two permission strings: `app.json:3`, `:23-25`.

What re-triggers a push when the language changes:

21. The settings subscription list has one atom today: `stores/widget.ts:139`.
22. The settings snapshot has one field today: `stores/widget.ts:84-90`; `shared/widgetTypes.ts:38-41`.
23. Stored props and stored layout strings on both platforms keep the old text until the next push
    (see 4.6 and section 5).

Tests that pin the current bytes:

24. Literal strings in the renderer suites: `shared/__tests__/widgetRenderer.test.ts:258-262`,
    `:359-360`, `:365-370`, `:380`, `:388`, `:405-407`, `:414-422`, `:428-436`, `:514-515`,
    `:527-528`, `:762`; `shared/__tests__/widgetLockRenderer.test.ts:220`, `:234-235`, `:252-257`,
    `:273`, `:308-310`, `:315-316`, `:326-327`, `:337`, `:341-346`.
25. Builder output by name: `shared/__tests__/widgetTimeline.test.ts:154`, `:185`, `:246`, `:481`,
    `:493`, `:560`, `:791-798`; `shared/__tests__/widgetSnapshot.test.ts:98-100`.
26. The twelve pinned digests: `shared/__tests__/widgetSimulation.test.ts:645-660`.
27. Date label parity with the two formatters: `shared/__tests__/widgetTimeline.test.ts:160`, `:298`;
    `shared/__tests__/widgetSnapshot.test.ts:138-146`; `stores/__tests__/widgetSettingsSync.test.ts:156`,
    `:265-266`.
28. The closure allow list, which excludes `Intl`: `shared/__tests__/widgetContract.test.ts:37-49`.

## 8. Files read

### 8.1 Read in full

Repo source and config:

| File | Lines |
| --- | --- |
| `widgets/PrayerWidget.tsx` | 776 |
| `widgets/LockPrayerWidget.tsx` | 495 |
| `shared/widgetTimeline.ts` | 320 |
| `shared/widgetTypes.ts` | 173 |
| `stores/widget.ts` | 389 |
| `shared/flags.ts` | 61 |
| `stores/storage.ts` | 119 |
| `device/listeners.ts` | 75 |
| `device/tasks.ts` | 62 |
| `modules/widgetrefresh/index.ts` | 27 |
| `modules/widgetrefresh/expo-module.config.json` | 6 |
| `modules/widgetrefresh/android/build.gradle` | 26 |
| `modules/widgetrefresh/android/src/main/AndroidManifest.xml` | 15 |
| `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshBootReceiver.kt` | 27 |
| `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshModule.kt` | 34 |
| `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshReceiver.kt` | 28 |
| `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshScheduler.kt` | 209 |
| `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshSystemListener.kt` | 61 |
| `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshWatchdogWorker.kt` | 27 |
| `plugins/androidWidgetAssets.js` | 32 |
| `plugins/androidWidgetGrid.js` | 42 |
| `scripts/generate-widget-assets.py` | 176 |
| `app.config.ts` | 108 |
| `app.json` | 393 |
| `patches/expo-widgets+58.0.14.patch` | 51 |
| `shared/__mocks__/widgets/PrayerWidget.ts` | 23 |
| `shared/__mocks__/widgets/LockPrayerWidget.ts` | 18 |

Tests:

| File | Lines |
| --- | --- |
| `shared/__tests__/widgetContract.test.ts` | 399 |
| `shared/__tests__/widgetRenderer.test.ts` | 944 |
| `shared/__tests__/widgetLockRenderer.test.ts` | 430 |
| `shared/__tests__/widgetTimeline.test.ts` | 1100 |
| `shared/__tests__/widgetSimulation.test.ts` | 1169 |
| `shared/__tests__/widgetSnapshot.test.ts` | 175 |
| `shared/__tests__/widgetRuntimeLoads.test.ts` | 73 |
| `shared/__tests__/widgetAssets.test.ts` | 116 |
| `shared/__tests__/widgetOpenAppPatch.test.ts` | 64 |
| `shared/__tests__/androidWidgetGrid.test.ts` | 64 |
| `shared/__tests__/flags.test.ts` | 264 |
| `shared/__tests__/flagDefaults.test.ts` | 99 |
| `shared/__tests__/nativeConfig.test.ts` | 60 |
| `stores/__tests__/widgetIo.test.ts` | 238 |
| `stores/__tests__/widgetAndroid.test.ts` | 290 |
| `stores/__tests__/widgetSettingsSync.test.ts` | 387 |
| `stores/__tests__/widgetAndroidFlagOff.test.ts` | 81 |
| `stores/__tests__/widgetFlagOff.test.ts` | 102 |
| `stores/__tests__/widgetPlatform.test.ts` | 64 |
| `stores/__tests__/widgetPushPastTarget.test.ts` | 44 |
| `stores/__tests__/widgetRefreshChain.test.ts` | 99 |
| `modules/widgetrefresh/__tests__/index.test.ts` | 32 |

There are no test files under `widgets/`. No file under the root `__tests__/` has widget or runtime
in its name.

Installed packages, read-only:

| File | Lines |
| --- | --- |
| `node_modules/expo-widgets/README.md` | 26 |
| `node_modules/expo-widgets/src/Widgets.ts` | 271 |
| `node_modules/expo-widgets/src/ExpoWidgets.native.ts` | 18 |
| `node_modules/expo-widgets/src/index.ts` | 18 |
| `node_modules/expo-widgets/bundle/index.ts` | 112 |
| `node_modules/expo-widgets/bundle/decorator.ts` | 69 |
| `node_modules/expo-widgets/bundle/react-stub.ts` | 91 |
| `node_modules/expo-widgets/bundle/react-native-stub.ts` | 31 |
| `node_modules/expo-widgets/bundle/jsx-runtime-stub.ts` | 31 |
| `node_modules/expo-widgets/bundle/ui-globals.ts` | 2 |
| `node_modules/expo-widgets/bundle/ui-globals.android.ts` | 2 |
| `node_modules/expo-widgets/bundle/layout-registry-stub.ts` | 52 |
| `node_modules/expo-widgets/bundle/layout-registry-entry.js` | 5 |
| `node_modules/expo-widgets/bundle/expo-stub.ts` | 19 |
| `node_modules/expo-widgets/bundle/expo-modules-core-stub.ts` | 1 |
| `node_modules/expo-widgets/bundle/async-require-stub.ts` | 28 |
| `node_modules/expo-widgets/scripts/build-bundle.mjs` | 69 |
| `node_modules/expo-widgets/scripts/build-layout-registry.mjs` | 159 |
| `node_modules/expo-widgets/layout-registry.metro.config.js` | 29 |
| `node_modules/expo-widgets/metro.config.js` | 80 |
| `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsStorage.kt` | 36 |
| `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetObject.kt` | 29 |
| `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsJSRuntime.kt` | 52 |
| `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsLayoutRegistry.kt` | 63 |
| `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsUpdater.kt` | 55 |
| `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetsPeekWidget.kt` | 33 |
| `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsUtils.kt` | 62 |
| `node_modules/expo-widgets/ios/WidgetsStorage.swift` | 58 |
| `node_modules/expo-widgets/ios/WidgetObject.swift` | 48 |
| `node_modules/expo-widgets/ios/WidgetsRecords.swift` | 38 |
| `node_modules/expo-widgets/ios/Widgets/WidgetsJSRuntime.swift` | 148 |
| `node_modules/expo-widgets/ios/Widgets/WidgetsLayoutRegistry.swift` | 48 |
| `node_modules/expo-widgets/ios/Widgets/TimelineProvider.swift` | 45 |
| `node_modules/expo-widgets/ios/Widgets/EntryView.swift` | 35 |
| `node_modules/expo-widgets/ios/Widgets/Utils.swift` | 136 |
| `node_modules/expo-widgets/ios/Widgets/WidgetModifiers.swift` | 102 |
| `node_modules/babel-preset-expo/build/plugins/widgets-plugin.js` | 155 |
| `node_modules/@expo/ui/ios/TextView.swift` | 75 |
| `node_modules/@expo/ui/ios/Modifiers/EnvironmentModifier.swift` | 83 |

### 8.2 Read in part

These sit outside the sweep's scope and were opened only for the lines cited above.

| File | Lines read of total |
| --- | --- |
| `stores/notifications.ts` | 1560-1739 and 1770-1894 of 1960 |
| `stores/sync.ts` | 200-279 and 505-548 of 548, plus line 47 by search |
| `app/index.tsx` | 60-139 of 250 |
| `shared/time.ts` | 15-74 and 140-274 of 574 |
| `shared/prayer.ts` | 376-420 of 579, plus a search for `english` |
| `stores/database.ts` | 1-40 and 128-172 of 304 |
| `shared/types.ts`, `shared/sequence.ts`, `shared/constants.ts`, `stores/ui.ts` | search hits only |
| `jest.config.js` | 20-30 and 100-122 |
| `jest.setup.js` | 1-14 |
| `.env.example`, `package.json`, `biome.json` | search hits only |
| `device/__tests__/listeners.test.ts`, `__tests__/README.md` | search hits only |
| `node_modules/expo-widgets/src/Widgets.types.ts` | 50-66 of 328, plus search hits |
| `node_modules/expo-widgets/plugin/build/**` | search hits only |
| `node_modules/babel-preset-expo/build/configs/expo.js` | search hits only |
| `node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/bridge/Arguments.kt` | 102-126, by search |
| `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt` | only the hunks shown in the patch |

### 8.3 Not read

- 24 other files under `stores/__tests__/` (the notification, sync and database suites and
  `alarmHarness.ts`) that a search shows mentioning widgets. None has widget in its name.
- `shared/help.ts` and `shared/whatsNew.ts`, which hold in-app copy about widgets
  (`shared/whatsNew.ts:94-99`). They are app UI strings, not widget pipeline.
- `assets/icons/svg/widget.svg`, an in-app icon. Nothing under `widgets/` references it.
- The remaining native files of `expo-widgets` and `@expo/ui`.
