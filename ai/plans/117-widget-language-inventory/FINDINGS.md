# FINDINGS: ticket 117, the widget-language inventory

The inventory of what every widget surface shows in each of the six languages (en ar ms so hi
th), what rows 39 and 88 left behind, what row 69 wanted, and what the patch carries. Every
load-bearing claim cites `file:line` in this lane's tree (`be3f5cd4`, uat tip 2.0.864; the
plan's map at `50f96266` held throughout, all eight anchors counting 1). One claim class is
marked `unverified` with the live read that would settle it (D117.3, D117.4). Investigation
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
| OS native layer | The `locales` block `app.json:401-681`, written from `shared/i18n/native-strings.json` (D43/D46), pinned by `shared/__tests__/nativeLocalesConfig.test.ts:1-9` | The gallery (picker) names and descriptions: iOS `Localizable.strings` keyed by the English literals the generated Swift carries, Android `values-b+<lang>/strings.xml` under plugin-derived resource names. Follows the device's system language; a device outside the six shows the en base strings |

The 12 surfaces:

| Surface | Locale input | Bytes per language (en · ar · ms · so · hi · th) | Citation |
| --- | --- | --- | --- |
| Gallery display name + description (all 14 kinds, per kind) | OS native layer, per kind; follows the device's system language, not the app locale | Home light-small example, name: `Next Prayer (Light)` · `الصلاة التالية (فاتح)` · `Solat Seterusnya (Cerah)` · `Salaadda Xigta (Ifiin)` · `अगली नमाज़ (हल्की)` · `ละหมาดถัดไป (สว่าง)`; description: `A countdown to the next prayer.` · `عد تنازلي إلى الصلاة التالية.` · `Kiraan detik ke solat seterusnya.` · `Hoos-u-tiris illaa salaadda xigta.` · `अगली नमाज़ तक काउंटडाउन।` · `นับถอยหลังสู่การละหมาดครั้งถัดไป`; lock Layout 1 name: `Next Prayer (Layout 1)` · `الصلاة التالية (تصميم 1)` · `Solat Seterusnya (Susun atur 1)` · `Salaadda Xigta (Hab-rajiska 1)` · `अगली नमाज़ (लेआउट 1)` · `ละหมาดถัดไป (เลย์เอาต์ 1)` | en base at `app.json:224-225`, `:344-345`; ar home name `app.json:428`, ar lock name `:444`; ms `:484`, `:500`; so `:540`, `:556`; hi `:596`, `:612`; th `:652`, `:668`; source `shared/i18n/native-strings.json`, pinned by `shared/__tests__/nativeLocalesConfig.test.ts` |
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
