# FINDINGS: ticket 117, the widget-language inventory

The inventory of what every widget surface shows in each of the six languages (en ar ms so hi
th), what rows 39 and 88 left behind, what row 69 wanted, and what the patch carries. Every
load-bearing claim cites `file:line` in this lane's tree (`be3f5cd4`, uat tip 2.0.864; the
plan's map at `50f96266` held throughout, all eight anchors counting 1). Two claim classes
are marked `unverified` with the live read that would settle them (D117.3, D117.4). Investigation
only: no code changed (D117.1).

## 1. The 14 kinds and their compositions

Four compositions render all 14 kinds: one layout function backs the 8 home kinds, three
self-contained functions back the 6 lock kinds (D117.5). The `'widget'` directive serializes
each function body into every kind's slot, so kinds sharing a composition can never drift
structurally; only the named per-kind inputs differ (`widgets/PrayerWidget.tsx:44-57`,
`widgets/LockPrayerWidget.tsx:39-41`).

### Group A: the 8 home-screen kinds, one composition, both platforms

One function (`AthanHomeWidget`, `widgets/PrayerWidget.tsx:81`) registered under 8 names. The
only rendered differences: `schedule` picks the extras pill palette (`isExtra`,
`widgets/PrayerWidget.tsx:125`, `pillFill` at `:145`, `:169-170`), `theme` picks the Light or
Dark palette (`:127`, palettes `:135-178`), and the size picks the small trio or the medium
trio-plus-list composition (`:129`, iOS `environment.widgetFamily`, Android the snapshot's
`size`). Both platforms render it: iOS systemSmall and systemMedium
(`app.json:227`, `:257`) and the Android home screen (`android` blocks with
`initialLayout: ./widgets/PrayerWidget`, `app.json:230-235`, `:260-265`, `:290-295`,
`:305-310`, `:320-325`, `:335-340`).

| Kind | Registration | Schedule | Theme | Size |
| --- | --- | --- | --- | --- |
| PrayerWidget | `widgets/PrayerWidget.tsx:883` | standard | light | small (iOS systemSmall, `app.json:227`; Android minWidth 160, `app.json:231`) |
| ExtrasWidget | `widgets/PrayerWidget.tsx:884` | extra | light | small (`app.json:242`, `:246`) |
| PrayerWidgetMedium | `widgets/PrayerWidget.tsx:885` | standard | light | medium (iOS systemMedium, `app.json:257`; Android minWidth 310, `app.json:261`) |
| ExtrasWidgetMedium | `widgets/PrayerWidget.tsx:886` | extra | light | medium (`app.json:272`, `:276`) |
| PrayerWidgetDark | `widgets/PrayerWidget.tsx:887` | standard | dark | small (`app.json:287`, `:291`) |
| ExtrasWidgetDark | `widgets/PrayerWidget.tsx:888` | extra | dark | small (`app.json:302`, `:306`) |
| PrayerWidgetDarkMedium | `widgets/PrayerWidget.tsx:889` | standard | dark | medium (`app.json:317`, `:321`) |
| ExtrasWidgetDarkMedium | `widgets/PrayerWidget.tsx:890` | extra | dark | medium (`app.json:332`, `:336`) |

### Group B: the 6 lock-screen kinds, three compositions, iOS only

Three self-contained compositions, each registered twice (standard and extras schedules
share the body byte-for-byte; only the timeline pushed per kind differs,
`stores/widget.ts:5-11`). iOS only: every lock kind carries `"android": null`
(`app.json:349`, `:358`, `:367`, `:376`, `:385`, `:394`), families accessoryRectangular and
accessoryInline (`app.json:347`, `:356`, `:365`, `:374`, `:383`, `:392`).

| Kind | Registration | Composition | Schedule |
| --- | --- | --- | --- |
| PrayerLockWidget | `widgets/LockPrayerWidget.tsx:283` | Layout 1, `AthanLockWidgetCountdownPair` (`:44`): name plus ticking countdown | standard |
| ExtrasLockWidget | `widgets/LockPrayerWidget.tsx:284` | Layout 1 | extra |
| PrayerLockWidget2 | `widgets/LockPrayerWidget.tsx:517` | Layout 2, `AthanLockWidgetCentred` (`:288`): name plus absolute time, no countdown | standard |
| ExtrasLockWidget2 | `widgets/LockPrayerWidget.tsx:518` | Layout 2 | extra |
| PrayerLockWidget3 | `widgets/LockPrayerWidget.tsx:767` | Layout 3, `AthanLockWidgetStacked` (`:520`): name plus time, countdown beneath | standard |
| ExtrasLockWidget3 | `widgets/LockPrayerWidget.tsx:768` | Layout 3 | extra |

## 2. The per-surface table

Three locale inputs drive the surfaces. Every prop-bearing face re-bakes on a language
switch through the convergence re-push (`stores/language.ts:85-97` reaching
`stores/notifications.ts:1616`, `:1627`); the props-less faces never move with the app
locale.

| Input | Source | Reaches |
| --- | --- | --- |
| App locale, baked into props | `shared/widgetTimeline.ts:62-71` (`widgetStrings` reads `t()`), `:212`/`:273`/`:333` (`prayerLabel`), `:217`/`:278`/`:318` (`footerFor`), `:210`/`:271`/`:350` (the `rtl` stamp); pushed by `stores/widget.ts` on data, settings and language-convergence events | Every prop-bearing face on both platforms: prayer names, HH:mm times, the footer, the Android unit letters and stale-card copy, the `rtl` field |
| Device locale, read by the widget process | The patch's `__expoWidgetDeviceLocale` global: Android `LocaleList.getDefault().get(0).language` injected through the Hermes runtime (`patches/expo-widgets+58.0.19.patch`, the `WidgetsJSRuntime.kt` and `WidgetsHermesRuntime.kt`/`.cpp` hunks), iOS `Locale.current.language.languageCode` (the `WidgetsJSRuntime.swift` hunk); consumed by the STATIC resolvers at `widgets/PrayerWidget.tsx:312-316` and `widgets/LockPrayerWidget.tsx:133-137`, `:377-381`, `:610-614` | The props-less faces: iOS neutral and stale cards and the lock stale faces, the render-catch cards, the Android v1-snapshot fallback; exact-or-prefix match over the six codes, unknown falls to en (`widgets/PrayerWidget.tsx:313-316`) |
| OS native layer | The `locales` block `app.json:401-681`, written from `shared/i18n/native-strings.json` (D43/D46), pinned by `shared/__tests__/nativeLocalesConfig.test.ts:1-9` | The gallery (picker) names and descriptions: iOS `Localizable.strings` keyed by the English literals the generated Swift carries, Android `values-b+<lang>/strings.xml` under plugin-derived resource names. Follows the device's system language; a device outside the six showing the en base strings is `unverified` (D117.4: only config structure supports it), settled by seam 5's live read |

The 12 surfaces:

| Surface | Locale input | Bytes per language (en · ar · ms · so · hi · th) | Citation |
| --- | --- | --- | --- |
| Gallery display name + description (all 14 kinds, per kind) | OS native layer, per kind; follows the device's system language, not the app locale (the rendered bytes on a device set outside the six are `unverified`, seam 5's live read) | Home light-small example, name: `Next Prayer (Light)` · `الصلاة التالية (فاتح)` · `Solat Seterusnya (Cerah)` · `Salaadda Xigta (Ifiin)` · `अगली नमाज़ (हल्की)` · `ละหมาดถัดไป (สว่าง)`; description: `A countdown to the next prayer.` · `عد تنازلي إلى الصلاة التالية.` · `Kiraan detik ke solat seterusnya.` · `Hoos-u-tiris illaa salaadda xigta.` · `अगली नमाज़ तक काउंटडाउन।` · `นับถอยหลังสู่การละหมาดครั้งถัดไป`; lock Layout 1 name: `Next Prayer (Layout 1)` · `الصلاة التالية (تصميم 1)` · `Solat Seterusnya (Susun atur 1)` · `Salaadda Xigta (Hab-rajiska 1)` · `अगली नमाज़ (लेआउट 1)` · `ละหมาดถัดไป (เลย์เอาต์ 1)` | en base at `app.json:224-225`, `:344-345`; ar home name `app.json:428`, ar lock name `:444`; ms `:484`, `:500`; so `:540`, `:556`; hi `:596`, `:612`; th `:652`, `:668`; source `shared/i18n/native-strings.json`, pinned by `shared/__tests__/nativeLocalesConfig.test.ts` |
| Neutral card (no props: gallery placeholder, jiggle mode, first add before any push) | Device locale (D44); the title stays the brand | Title `Athan`/`ATHAN` in every language. Subtitle: `Prayer times for London` · `أوقات الصلاة في لندن` · `Waktu solat untuk London` · `Waqtiyada salaadda London` · `लंदन के नमाज़ के समय` · `เวลาละหมาดสำหรับลอนดอน`; lock inline form `Athan — prayer times` · `Athan - أوقات الصلاة` · `Athan - waktu solat` · `Athan - waqtiyada salaadda` · `Athan - नमाज़ के समय` · `Athan - เวลาละหมาด`; lock rect form `ATHAN` + `Open to load times` · `افتح لتحميل الأوقات` · `Buka untuk muat waktu` · `Fur si aad u soo dejinto waqtiyada` · `समय लोड करने के लिए खोलें` · `เปิดเพื่อโหลดเวลา` | STATIC tables `widgets/PrayerWidget.tsx:232-311` (en at `:234`), resolver `:312-316`; home draw `:633` (iOS), `:404-412` (Android); lock tables `widgets/LockPrayerWidget.tsx:53-132`, `:297-376`, `:530-609`, resolvers `:133-137`, `:377-381`, `:610-614`, draws `:139-170`, `:383-414`, `:619-650`; pinned against `shared/i18n/widget-statics.json` by `shared/__tests__/widgetStaticStrings.test.ts` |
| Stale card, iOS (home StaleCard, all three lock stale faces) | Device locale (D44, D79) | Title/body: `Out of date`/`Open app to refresh` · `غير محدّث`/`افتح التطبيق للتحديث` · `Tidak dikemas kini`/`Buka apl untuk muat semula` · `Cusboonaysi la'aan`/`Fur aplka si aad u cusboonaysiiso` · `पुराना`/`रिफ्रेश के लिए ऐप खोलें` · `ข้อมูลเก่า`/`เปิดแอปเพื่อรีเฟรช`; home refresh line `Open Athan to refresh` · `افتح Athan للتحديث` · `Buka Athan untuk muat semula` · `Fur Athan si aad u cusboonaysiiso` · `रिफ्रेश के लिए Athan खोलें` · `เปิด Athan เพื่อรีเฟรช`; lock inline stale `Athan — open to refresh times` and siblings per the same tables | Home `widgets/PrayerWidget.tsx:588-615` (title `:601`, lines `:604-608`), STATIC `:232-311`; lock Layout 1 `widgets/LockPrayerWidget.tsx:178-210` (inline `:188`, rect `:201-207`), Layout 2 `:422-453`, Layout 3 `:662-697` |
| Stale card, Android (v2+ snapshots) | App locale, baked `strings` at push | `widget.stale`/`widget.refresh`/`widget.refreshLead`/`widget.refreshTail`: the same six bytes as the iOS row when app locale equals device locale (the catalogs and the STATIC tables carry identical words); the two inputs diverge when they differ (section 4, seam 1) | Baked `shared/widgetTimeline.ts:62-71` (`:67-70` the four keys), drawn `widgets/PrayerWidget.tsx:414-432`; catalog keys `shared/i18n/en.ts:189-192`, `ar.ts:171-174`, `ms.ts:174-177`, `so.ts:175-178`, `hi.ts:172-175`, `th.ts:170-173` |
| Catch card (a render error, never a dead surface) | Device locale | `Open the app to refresh` · `افتح التطبيق للتحديث` · `Buka aplikasi untuk muat semula` · `Fur app-ka si aad u cusboonaysiiso` · `रिफ्रेश के लिए ऐप खोलें` · `เปิดแอปเพื่อรีเฟรช` (title `Athan`) | Home catch `widgets/PrayerWidget.tsx:870-874`; lock catches return the neutral face `widgets/LockPrayerWidget.tsx:278-280`, `:512-514`, `:759-762` |
| Countdown hero, iOS (home hero, lock Layouts 1 and 3; the inline faces carry no timer) | None of the three: SwiftUI `Text(timerInterval:)` is system-formatted, following the device's locale and numbering settings, outside both the app locale and the baked props | Per-language glyphs `unverified` (D117.3): no format string crosses the `@expo/ui` bridge, so code cannot name the glyphs. Live read that settles it: a simulator run per device language, reading the widget face (row 88's record already names this surface system-formatted) | Home cast `widgets/PrayerWidget.tsx:691-695`, ticking element `:729-733`; lock Layout 1 cast `widgets/LockPrayerWidget.tsx:212-216`, element `:262-274`; Layout 3 cast `:702-706`, element `:746-756`; the inline faces fall back to name plus absolute time (a concatenated timer stops ticking): `:222-233`, `:456-468`, `:714-726` |
| Countdown hero, Android (render-time `ALabel`) | App locale (baked unit letters) with render-time Latin digits | `1h 12m` · `1س 12د` · `1j 12m` · `1sa 12da` · `1घं 12मि` · `1ชม. 12น.` (72 minutes throughout; under an hour `42m` and its five siblings, whole hour `1h`) | Computed `widgets/PrayerWidget.tsx:383-390`, drawn `:487`; units baked `shared/widgetTimeline.ts:63-64` from `duration.h`/`duration.m`: `en.ts:170-171`, `ar.ts:156-157`, `ms.ts:158-159`, `so.ts:159-160`, `hi.ts:156-157`, `th.ts:155-156` |
| Prayer names (home hero eyebrow, list rows both platforms, lock rect and inline faces) | App locale, baked `prayerLabel(id)` at push | Fajr: `Fajr` · `الفجر` · `Subuh` · `Subax` · `फज्र` · `ซุบฮิ`; Isha: `Isha` · `العشاء` · `Isyak` · `Cishaa'i` · `ईशा` · `อิชาอฺ`; extras Midnight: `Midnight` · `نصف الليل` · `Tengah malam` · `Saqda dhexe` · `आधी रात` · `เที่ยงคืน`; the home hero renders the name uppercased (`textCase`/`.toUpperCase()`) | Baked `shared/widgetTimeline.ts:212` (nextName), `:156` (iOS rows), `:333`, `:339` (Android rows); drawn `widgets/PrayerWidget.tsx:725` (uppercased `:720`), `:546`, `widgets/LockPrayerWidget.tsx:260`, `:495`, `:739` (rect), `:231`, `:465`, `:723` (inline); catalogs `shared/i18n/en.ts:12-22` and the same block in each catalog |
| Times (hero absolute time, list row times, inline faces) | The provider's HH:mm bytes, carried verbatim | Latin digits in every language by construction (row 88), e.g. `05:35`; unreadable rows `--:--` | Carried `shared/widgetTimeline.ts:157`, `:213`, `:334`, `:339`; drawn `widgets/PrayerWidget.tsx:741`, `:549`; the Latin pin `shared/__tests__/widgetTimeline.test.ts:224-241` |
| Footer (under the hero and list, both platforms) | App locale, precomposed | Gregorian preference (weekday alone, Friday shown): `Fri` · `الجمعة` · `Jum` · `Jmc` · `शुक्र` · `ศุกร์`; Hijri preference (Rajab 1 shown): `Raj 1` · `رجب 1` · `Rej 1` · `Raj 1` · `रजब 1` · `รอจ 1` (the month's first three graphemes plus a Latin day) | Composed `shared/time.ts:324-349` (Hijri slice `:337`, weekday `:348`), Latin by `:286-290`; baked `shared/widgetTimeline.ts:217`, `:278`, `:318`; drawn `widgets/PrayerWidget.tsx:754`, `:473`, `:563`; weekday keys `en.ts:215`, `ar.ts:196`, `ms.ts:199`, `so.ts:200`, `hi.ts:197`, `th.ts:195`; Hijri month keys `en.ts:224`, `ar.ts:205`, `ms.ts:208`, `so.ts:209`, `hi.ts:206`, `th.ts:204` |
| Unit letters (`WidgetStrings` `h`/`m`; `s` and `now` ride unread, the countdown being minutes-only) | App locale | `h`/`m` · `س`/`د` · `j`/`m` · `sa`/`da` · `घं`/`मि` · `ชม.`/`น.` | Shape `shared/widgetTypes.ts:181-193` (the unread-`s`/`now` note `:177-179`); baked `shared/widgetTimeline.ts:63-66`; row 69's retirement question (section 3) |
| The `rtl` field (v8 props, v4 snapshot) | App locale, stamped at push | `true` under ar, `false` in the other five; read by nothing in either widget module (row 68's P16: the Host application is blocked on the widget runtime), so Arabic content lays out in an LTR shell today | Stamped `shared/widgetTimeline.ts:210`, `:271`, `:350`; shape `shared/widgetTypes.ts:20-23`, `:34-36`, fields `:145-152`, `:243-248` |

## 3. The landed state: rows 39 and 88, D44/D79's ground, row 69's parked scope, the patch's hunks

Six rows carry what the widget surfaces inherited. Queue records cited by their line in
`ai/plans/README.md`.

| # | What landed | Evidence |
| --- | --- | --- |
| 1 | The precomposed localized footer (row 39's widget half, props v7): every iOS entry and every Android day carries a `footer` composed by `footerFor` in the app locale at push, so the footer follows a language switch without a layout change; entries and snapshots from before v7 still parse their old `dateLabel` (the tolerance fallbacks) | Commit `ed8ce964` 2.0.32 (row 39's record, `ai/plans/README.md:132`); composed `shared/time.ts:324-349`; baked `shared/widgetTimeline.ts:217`, `:278`, `:318`; the v7 contract `shared/widgetTypes.ts:17-19`, `:31-33`; the parse fallbacks `widgets/PrayerWidget.tsx:654-669`, `:394-402` |
| 2 | The widget-runtime locale patch and the D44 device-keyed STATIC tables: the patch installs `__expoWidgetDeviceLocale` in the widget process; both widget modules resolve their props-less copy from six inline STATIC tables, mirrored in `shared/i18n/widget-statics.json` and pinned by `shared/__tests__/widgetStaticStrings.test.ts`. D44: the null-props card's static strings are keyed by the device locale the widget process itself reads; D79: static copy (null-props placeholders, stale cards) stays device-keyed per D44, and the iOS stale faces still follow it (section 2, rows 2-3) | Commits `203fabf0` 2.0.34, compile-fixed `2fc2bc4e` 2.0.46 (row 39's record, `ai/plans/README.md:132`); D44/D79 ruled in row 67's cell (`ai/plans/README.md:148`); resolvers `widgets/PrayerWidget.tsx:312-316`, `widgets/LockPrayerWidget.tsx:133-137`, `:377-381`, `:610-614`; the patch hunks (row 6 below) |
| 3 | The per-locale native strings (row 39): the gallery names and descriptions for all 14 kinds reproduce from committed config into the `locales` block on every prebuild, iOS `Localizable.strings` keyed by the English literals and Android `values-b+<lang>/strings.xml` under plugin-derived names | `app.json:401-681` written from `shared/i18n/native-strings.json`, byte-pinned by `shared/__tests__/nativeLocalesConfig.test.ts:1-9`; en base at `app.json:224-225` |
| 4 | The language-switch convergence re-push (row 39): one locked pass re-arms notification copy at schedule time and re-pushes both schedules' timelines and snapshots, so every prop-bearing face re-bakes in the new locale; the props-less faces never move (D44) | `stores/language.ts:85-97` (`reconcileLanguageSurfaces`, the last-armed stamp) through `stores/notifications.ts:1616`, `:1627` to `stores/widget.ts`; row 39's record names the convergence ("forward-only convergence over notifications, channels and widgets") |
| 5 | Row 88's widget half: the native-digit map deleted, so every byte the app composes into the widget props is Latin by construction (footers and rows bake through the shared formatters); the regression pin refuses an Arabic-Indic digit in any prop string under ar. The iOS SwiftUI ticking countdown stays system-formatted, named in row 88's own record as "row 69's owner-blocked ground" | Commit `3c1b620f` 2.0.744; row 88's record (`ai/plans/README.md:207`); the pin `shared/__tests__/widgetTimeline.test.ts:224-241`; the Latin-by-construction notes `shared/time.ts:286-290` |
| 6 | The patch's two hunk families (live file `patches/expo-widgets+58.0.19.patch`, rebuilt at ticket 111's re-pin; `ai/UPSTREAM-PRS.md:12` still names the patch `expo-widgets+58.0.5`, its measured-era name, and the table's other two rows likewise carry older version strings than the live files `patches/expo-background-task+58.0.11.patch` and `patches/expo-location+58.0.16.patch`). (a) The openApp action, Android only: `openApp` on the Jetpack `Button`, default `false`, a tap launching the app through `actionStartActivity`; PR `expo/expo#51292` opened 2026-10-09, awaiting review. (b) The device-locale injection, no PR today: Android `LocaleList.getDefault().get(0).language` passed through `WidgetsJSRuntime.kt` and the jni `WidgetsHermesRuntime.kt` into `WidgetsHermesRuntime.cpp`'s `setProperty(rt, "__expoWidgetDeviceLocale", ...)`; iOS `Locale.current.language.languageCode` set in `WidgetsJSRuntime.swift`; additive global, every default unchanged | `ai/UPSTREAM-PRS.md:12` (the #51292 row); the patch: the openApp hunks in `ExpoWidgetEmittableTree.kt`, the locale hunks in `WidgetsJSRuntime.kt`, `jni/WidgetsHermesRuntime.kt`, `android/src/main/cpp/WidgetsHermesRuntime.cpp`, `ios/Widgets/WidgetsJSRuntime.swift` (`patches/expo-widgets+58.0.19.patch:38`, `:102`, `:112`, `:158`); row 51's discipline (`ai/plans/README.md:134`) |

Row 69's parked scope, quoted verbatim from its queue cell (`ai/plans/README.md:150`, the
brief column):

> Split from row 63 by D77 (2026-10-12): the Android widget's ALabel renders `1h 12m` from the snapshot's `strings`; this job moves it to the colon format (`0:42`, `1:12`, `2:00`), decides whether the unit fields retire from `WidgetStrings` (shape and fallback work), and re-tests the v1 fallback words. Group: widget props and modules, serialized with rows 67 and 68. OWNER-BLOCKED 2026-10-12 (her hard ban, until she says go)

Its status column reads "DEFERRED 2026-10-13 by the owner's priority call (not anytime soon;
the D77 split from row 63)"; its waiting-on column reads "owner says go". Nothing folds into
this ticket: no code runs before her ruling.

## 4. The seams

Each inconsistency the inventory found, both sides named. Where code cannot settle a seam,
the exact live read that would is named (D117.3).

1. **The stale-card keying asymmetry.** iOS home stale faces read the device-locale
   `staticRow` (`widgets/PrayerWidget.tsx:588-615`) and so do all six lock stale faces
   (`widgets/LockPrayerWidget.tsx:178-210`, `:422-453`, `:662-697`), per D44/D79
   (`ai/plans/README.md:148`). Android's v2+ stale card reads the app-locale baked
   `strings` (`shared/widgetTimeline.ts:67-70` baked, drawn `widgets/PrayerWidget.tsx:414-432`).
   An app locale different from the device locale shows two different languages across
   platforms for the same stale state: app ar on an en device renders the Android stale card
   in Arabic and the iOS stale card in English.
2. **The Android countdown's unit letters localise against the app's fixed-letter law.**
   The bake reads the catalogs (`shared/widgetTimeline.ts:63-64`), so under ar the widget
   renders `1س 12د` (section 2, row 7) while every app surface renders fixed Latin letters:
   row 83's record ("lowercase h m letters FIXED in every language (they never localise)",
   `ai/plans/README.md:202`), row 85's lettered design in every language
   (`ai/plans/README.md:206`), row 102's typography (`ai/plans/README.md:221`); the app-side
   implementation composes literal `h`/`m` (`shared/time.ts:646-661`). The widget is the one
   surface contradicting the law.
3. **The iOS countdown is system-formatted.** No format string crosses the `@expo/ui`
   bridge (`widgets/PrayerWidget.tsx:691-695`; `widgets/LockPrayerWidget.tsx:212-216`,
   `:702-706`): SwiftUI `Text(timerInterval:)` follows the device's locale and numbering
   settings, outside both the app locale and row 88's Latin-everywhere ruling (`ai/plans/README.md:207`,
   which names the surface "row 69's owner-blocked ground"). A device set to a numbering
   system other than Latin may render non-Latin countdown glyphs. Live read that settles it:
   a simulator run per device language and numbering setting, reading the widget face;
   deferred by D117.3 and marked `unverified` in section 2.
4. **The `rtl` field is stamped and read by nothing.** Stamped on every push
   (`shared/widgetTimeline.ts:210`, `:271`, `:350`; shape `shared/widgetTypes.ts:20-23`,
   `:34-36`), read by no line in either widget module: row 68's record names the Host
   application "blocked on the widget runtime" (P16, `ai/plans/README.md:149`). Arabic
   content lays out in an LTR shell: the medium list keeps name-left/time-right and the lock
   faces keep their LTR name-time order. Live read that would show it: a placed widget under
   app-locale ar, reading the medium list face; the code settles that nothing reads the
   field; the read confirms the visual.
5. **The gallery falls back to English outside the six.** The native layer covers exactly
   ar, ms, so, hi, th over the en base (`app.json:401-681`,
   `shared/i18n/native-strings.json`); a device set to a seventh language gets the en base
   strings through the OS's own fallback. Live read that settles the rendered bytes: a
   device language outside the six, reading the widget gallery.
6. **The v1-snapshot fallback words.** A snapshot stored by a pre-v2 app carries no
   `strings`; the Android layout then bakes `h`/`m`/`s`/`now` as Latin literals with
   device-locale stale words (`widgets/PrayerWidget.tsx:439-448`): unit letters Latin by
   accident of their era, stale words device-keyed. Tolerated legacy from before v2
   snapshots; row 69's scope names its re-test ("re-tests the v1 fallback words").

## 5. The option set, the recommendation, row 69's fate, the patch, the rulings

Every line below cites the sections carrying its evidence.

### The option set

**Option 1, status quo.** Heal: none. The seams of section 4 stand, among them the widget
contradicting the fixed-letter law (seam 2) and the cross-platform stale-card split
(seam 1). Cost: none. Sections 1 and 2 remain the inventory of what ships today.

**Option 2, align the widget countdown's letters with the app's fixed-Latin lettered law
(rows 83, 85, 102).** Heal: the Android `ALabel` renders `h`/`m` as fixed Latin letters in
every language, so section 2's countdown row reads `1h 12m` under all six and seam 2 closes;
the `duration.h`/`duration.m` bake stops feeding the label, taking the app locale off that
surface entirely (section 2's three-input map); the `WidgetStrings` unit-field retirement
and the v1-fallback re-test ride the same job, closing seam 6 (row 69's surviving shape
(section 3's quote). Cost: one small widget job under her say-so, since row 69's ban governs
timing (section 3); and the iOS timer stays system-formatted, seam 3 standing, because the
bridge carries no format control (section 2's countdown row) and replacing it costs
per-second timeline entries, which the CPU budget record at `stores/widget.ts:19-31`
forbids (measured 5 to 13 CPU-seconds per kind per reload on an A12; ten kinds a minute
exceeded the extension's budget).

**Option 3, wider convergence.** Heal: option 2 plus one job that revisits D79's
device-keyed rule for the stale faces (bake them app-locale where props exist, keep
device-keyed only for the props-less placeholders, section 4 seam 1) and decides the
unread `rtl` field's fate: keep stamping until the runtime Host lands (row 68's P16,
seam 4) or stop stamping. Cost: touches settled visuals and a settled ruling, both hers
(D79, section 3); the gallery fallback (seam 5) stays regardless, being OS behavior.

### The recommendation (D117.8)

Option 2, as the shape row 69 resumes into, when she says go. Her own later rulings (rows
83, 85 and 102's fixed Latin letters, row 88's Latin digits) made the lettered law app-wide
on every other surface (sections 3 and 4), which leaves the widget's localised unit letters
(section 2's countdown row; seam 2) the one surface contradicting it. The recommendation
names the shape, not the timing: the row ends at her ruling.

### Row 69's fate (D117.6)

Stays parked under her own ban; its waiting-on cell reads "owner says go" (section 3). Its
colon-format half (`0:42`, `1:12`, `2:00`) is superseded in substance by rows 85/102's
lettered-design law: the resume shape is option 2's fixed letters, not colons. That
supersession is recorded here as the resume-time re-scope, not acted on. Nothing folds into
this ticket and no code ran before her ruling (D117.1).

### The patch upstreaming recommendation (D117.7)

File the device-locale injection hunks (section 3, row 6b: both platforms, one additive
global, every default unchanged) as one upstream PR under row 51's discipline, beside the
openApp PR `expo/expo#51292`; anonymity per `ai/AGENTS.md`. The patch stays until a
published release carries the change. The hunk spans C++, Kotlin and Swift, the costliest
to rebuild at every re-pin, and ticket 111 rebuilt it again this week (section 3's versions
note). The global is a general widget-runtime capability no app-side change can
replace: the props-less faces have no app locale to bake from (D44's ground, sections 2 and
3).

### The rulings left to the owner

1. Pick an option, or none: 1 the status quo, 2 the lettered alignment (recommended),
   3 the wider convergence (section 5's option set).
2. Lift or keep row 69's ban: option 2 is its resume shape, and the ban governs timing
   (section 3).
3. Approve or refuse the upstream PR for the device-locale hunks (this section, D117.7).
4. Decide whether the live-read items run before any option lands: the SwiftUI glyphs per
   device language and numbering setting, the gallery on a device outside the six, the
   Arabic face in its LTR shell (section 4's seams 3 to 5; D117.3 deferred them).

The investigation ends here. No code, config or test changed on any surface (D117.1); the
rulings wait on her.
