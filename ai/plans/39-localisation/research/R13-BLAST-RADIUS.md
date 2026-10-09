# R13. Blast radius census (research agent report, 2026-10-09)

Dispatched by the owner's instruction; every claim cites file:line at `uat` `5ad6aaba`. Test files
excluded. Full report; the pivot file carries the digest.

## 1. PrayerRow `english` / `arabic` field sites

Shape: `shared/types.ts:266-276` (`PrayerRow` declares `english` at :270, `arabic` at :272),
extended by `ReadablePrayer` (:286) and `UnreadablePrayer` (:298).

Writes (rows built):
- `shared/prayer.ts:269-275` - `CreatePrayerParams` carries both names; `createPrayer` writes them at :302-303.
- `shared/prayer.ts:385-393` - `createPrayersForSingleDay` writes the unreadable row's `english: name` / `arabic: namesArabic[index]`.
- `shared/prayer.ts:414-420` - readable row construction passes both names through.
- `hooks/usePrayer.ts:89-92` - loading fallback returns `english: ''`, `arabic: ''`.
- `stores/countdown.ts:45` - initial countdown atom seeds `name: 'Fajr'` as a literal.

Reads (production):
- `shared/prayer.ts:505` - `getPrayerForDate` matches `prayer.english === english` (the single row lookup everything schedules from).
- `shared/prayer.ts:578` - `canonicalDisplayOrder` ranks by `prayers[a].english`.
- `shared/sequence.ts:25` - `listPosition` does `names.indexOf(prayer.english)`; unknown names silently rank last.
- `shared/sequence.ts:194` - `findNextOccurrence` identity is `prayer.english !== row.english`.
- `hooks/usePrayerAgo.ts:36` - ago badge text `${prevPrayer.english} now` / `${prevPrayer.english} ${timeAgo} ago`.
- `components/prayer/Prayer.tsx:74` - passes `Prayer.english` to `rowPress`; renders `{Prayer.english}` (:88-89) and `{Prayer.arabic}` (:92, gated).
- `components/prayer/Alert.tsx:66` - `canonicalPrayerIndex(type, Prayer.english, index)`; :157-158 writes `prayerEnglish`/`prayerArabic` into the sheet state; :185-186 accessibility labels interpolate `Prayer.english`.
- `components/overlay/OverlayInfoBox.tsx:71` - `getOverlayExplanation(type, selectedPrayer.english)`.
- `stores/countdown.ts:413-414, 430` - countdown atom `name` = `selected.english` / `next.english`.
- `stores/schedule.ts:89` - log field; :307 `prayerIdentity` = `${prayer.english}_${prayer.belongsToDate}` (drives the sequence-signature skip at :323-326).
- `stores/notifications.ts:433, 664` - name to canonical index via `getPrayerArrays(...).english.indexOf(...)`.
- `shared/widgetTimeline.ts:135, 188, 247, 303, 306` - every widget name prop comes from `prayer.english`.
- `hooks/usePrayerSequence.ts:98` - inside a doc comment only; no live read.

## 2. Constants consumers

`PRAYERS_ENGLISH` (`shared/constants.ts:9`):
- `shared/prayer.ts:191` (cascade length), `:197` (longest-name index), `:318` (names for date)
- `shared/sequence.ts:24` (list order)
- `stores/notifications.ts:154, 215, 288, 304, 346, 557-558, 1587, 1615` (atom arrays, migration, snapshots)
- `shared/notifications.ts:324` (candidate walk), `:526` (legacy channel deletion)
- `components/ui/InitialWidthMeasurement.tsx:21` (measures widest English name)

`PRAYERS_ARABIC` (`shared/constants.ts:15`):
- `shared/prayer.ts:191` (extras cascade delay uses its `.length` - a quirk), `:318, :325`
- `stores/notifications.ts:155`

`EXTRAS_ENGLISH` (`shared/constants.ts:26`):
- `shared/prayer.ts:197, 324, 329, 574-575`
- `shared/sequence.ts:24`
- `stores/notifications.ts:154, 224, 296, 312, 351, 552, 558, 1618`
- `shared/notifications.ts:325, 526`
- `components/ui/InitialWidthMeasurement.tsx:24`
- `components/overlay/overlayContent.ts:53`

`EXTRAS_ARABIC` (`shared/constants.ts:32`): `shared/prayer.ts:325` (filters `'استجابة'`), `:329`; `stores/notifications.ts:155`.

`EXTRAS_EXPLANATIONS` (`:54`) and `EXTRAS_EXPLANATIONS_ARABIC` (`:1006`): `components/overlay/overlayContent.ts:57-58` only.

`NIGHT_PRAYER_NAMES` (`:39`): `shared/prayer.ts:258` (belongsToDate), `:358` (midnight-crossing shift).

`MIDNIGHT_CROSSING_PRAYERS` (`:47`): `shared/prayer.ts:248`, `:348`.

Name literals that become domain-id comparisons: `shared/prayer.ts:181` (`=== 'Midnight'`), `:324` (`!== 'istijaba'`), `:398-399` (`'Istijaba'`, `'Midnight'`, `'Last Third'`), `:407` (`rawData[name.toLowerCase()]` - the English name is the MMKV record key), `components/prayer/rowPress.ts:33` (`=== 'Istijaba'`), `shared/notifications.ts:88` (`DAILY_PRAYERS` lowercase set), `stores/notifications.ts:487` (`EXTRAS_ENGLISH_PRE_1_0_27` legacy array).

## 3. MMKV keys built from prayer names, and stored shapes

Key builders in `stores/notifications.ts`:
- `:207` - `preference_alert_${type}_${prayerName.toLowerCase()}`
- `:257-260` - `preference_reminder_alert_${type}_${name}${slotSuffix}`
- `:277-280` - `preference_reminder_interval_${type}_${name}${slotSuffix}`
- `:333-337` - `preference_notification_repair_${type}_${prayerName.toLowerCase()}`
- `:536-581` - index-to-name migration (`migrate()` writes the same three key families); pattern `INDEX_KEY_PATTERN` at `:493`; run from `stores/version.ts:289`.

Wipe keep-lists that preserve those keys: `stores/version.ts:144-155+` (`'preference_'`, `'prayer_max_english_width_'`), `stores/sync.ts:363` (`'preference_'` inside `replacePrayerCache`).

Stored day shape: `stores/database.ts:136-145` writes `ISingleApiResponseTransformed` under `prayer_YYYY-MM-DD`. The shape (`shared/types.ts:108-122`) is `date` plus nine lowercase time fields (`fajr...istijaba`) - **no english/arabic name fields stored**, so removing `arabic` from rows does not touch stored days. The catch: `shared/prayer.ts:407` uses the English name (lowercased) as the lookup key into that record.

Bookkeeping records DO store names: `ScheduledNotification` (`shared/notifications.ts:17-24`) holds `englishName` and `arabicName`; written by `device/notifications.ts:130, 248` and the survived-record paths `stores/notifications.ts:877, 1071`; keyed `scheduled_notifications_${type}_${index}_${id}` (`stores/database.ts:193`) and `scheduled_reminders_...` (`:258`).

## 4. OS identifiers and Android channels embedding the English name

- `device/notifications.ts:49-50` - `athan_${scheduleType}_${englishName.toLowerCase()}_${date}` (deterministic replace id).
- `device/notifications.ts:61-66` - `reminder_${scheduleType}_${englishName.toLowerCase()}_${date}_${intervalMinutes}`.
- `shared/notifications.ts:147` - `prayerNameSlug` (lowercase, spaces to underscores).
- `shared/notifications.ts:387-390` - `reminderAndroidChannelId` = `reminder_${slug}_${interval}_v3`.
- `shared/notifications.ts:402-403` - `atTimeAndroidChannelId` branches on `isDailyPrayer(englishName)`.
- `shared/notifications.ts:106` - `isDailyPrayer` matches the lowercase English set (`DAILY_PRAYERS` at `:88`).
- Channel names: `:410` `Athan ${n}`; `:452` `'Extra Times'`; reminder format string `:502` - `` `${englishName} in ${intervalMinutes}m Reminder` ``.
- Notification titles: `:130` `` `${englishName} now` ``; `:181` `` `${englishName} in ${intervalMinutes}m` ``.
- Reminder sound filenames: `:161-162` `reminder_${slug}_${intervalMinutes}.mp3` (Android res/raw naming law: `[a-z0-9_]`).
- Legacy channel sweep built from both name arrays: `shared/notifications.ts:526-531`.

## 5. Widget pipeline

Name and label baking (pure builder): `shared/widgetTimeline.ts:114-116` (`formatDateLabel` calls `formatHijriDateLong`/`formatDateLong`), `:135` (day-list rows `name: prayer.english`), `:188` (`nextName: next.english`), `:247` (stale entry), `:290` (Android day label), `:303/:306` (Android rows). Prop contracts: `shared/widgetTypes.ts:48-53` (`WidgetPrayerRow.name`), `:80-81` (`nextName`), `:127-134` (`AndroidWidgetDayRow.name`).

Push layer: `stores/widget.ts:167-229` (`pushScheduleTimelines` builds and calls `updateTimeline` per kind, `:201-217`), `:237-256` (`refreshPrayerWidgets` entry), `:345-389` (`pushScheduleAndroid` calls `updateSnapshot` at `:374`). Re-push sites: `stores/notifications.ts:1646-1663` (post-reschedule, deferred and awaited), `stores/widget.ts:124-140` (settings sync via `hijriDateEnabledAtom` subscription), `:319-337` (Android minute-flip chain), plus `stores/sync.ts` data landings.

Renderers of the name: `widgets/PrayerWidget.tsx:378` (`next.name.toUpperCase()` - the eyebrow), `:439` (row name), `:611` (`entry.nextName`), `:737` (Row keyed by `row.name`); `widgets/LockPrayerWidget.tsx:140, 169, 283, 313, 450, 466` (`props.nextName` across all six kinds). Footer token-shortening parses the English date label: `widgets/PrayerWidget.tsx:303-310, 545-555`.

## 6. Date/time formatting pinned to English

- `shared/time.ts:25-34` - `prayerClockFormatter` (`en-US`, mechanical h23 digits).
- `shared/time.ts:229-233` - `formatDateLong` via date-fns `'EEE, d MMM yyyy'` (en default locale); callers: `components/day/shownDate.ts:34`, `shared/widgetTimeline.ts:115`.
- `shared/time.ts:243, 318, 329` - Hijri/Ramadan formatters on `en-US-u-ca-islamic-umalqura`.
- `shared/time.ts:528-548` (`formatTime`, "1h 30m" units) and `:564-574` (`formatTimeAgo`, "now"/"Xh Ym").
- `shared/text.ts:25` - `toArabicNumbers`; sole production caller is `components/prayer/Explanation.tsx:80` (the Arabic explanation line, styled at :159-165).
- English-width machinery: `stores/ui.ts:104-107` (`prayer_max_english_width_*` atoms), `components/ui/InitialWidthMeasurement.tsx:21-24`, kept forever by `stores/version.ts:155`.

## 7. showArabicNamesAtom

- `stores/ui.ts:132` - definition, key `preference_show_arabic_names`.
- `components/prayer/Prayer.tsx:36` read, `:91-93` conditional Arabic `<Text>` and its style (`:113-116`).
- `components/sheets/screens/Settings.tsx:37` (`useAtom`), `:128-132` toggle row labelled `'Show arabic names'`.

## 8. Display-copy surface and inventory verification

The inventory at `research/string-inventory.json` holds 194 strings across 43 files; a fresh run
of the classifiers on 2026-10-09 counts 205 capitalised literals, 123 of them display copy across
34 files. Top files by display-copy count: `shared/help.ts` (27), `widgets/PrayerWidget.tsx`
(20), `shared/types.ts` (15), `shared/whatsNew.ts` (13), `Settings.tsx` (11), `Alert.tsx` (10),
`shared/constants.ts` (9), `shared/prayer.ts` (7), `stores/notifications.ts` (6),
`widgets/LockPrayerWidget.tsx` (6).

Spot-checks against uat 5ad6aaba:
- `stores/countdown.ts` "Fajr" - still present, now at `:45`.
- `stores/ui.ts` "Sunrise" at 207 - stale in the inventory; the string only survives in a comment at `:219`.
- `stores/widget.ts` `'Standard' : 'Extras'` - confirmed at `:220` and `:379`.
- `stores/notifications.ts` name literals - now only in JSDoc (`:197`, `:655`) plus the live legacy array at `:487`.

New copy-bearing files since the inventory (qibla, landed in `ffb44acf`):
- `components/sheets/screens/Qibla.tsx:46-47` ("Wake up the compass", "Move your phone like this"), `:62-63` ("Could not find north", "Please try standing in a different location"), `:85, 88` (subtitle pair), `:103-106` (permission paragraph), `:109, 112` ("Open Settings"), `:140` (title 'Qibla'), `:166-168` (place line).
- `device/qibla.ts:36-43` - `Alert.alert` 'Enable Location' / body / 'Cancel' / 'Open Settings'.
- `shared/qiblaCompass.ts:92-97` - cardinal letters `N/E/S/W` (language-pinned glyphs).
- `shared/qiblaPlace.ts:36-47` - `placeName` joins platform-geocoded locality and country; output follows the platform locale, not the app.
- `shared/qiblaWave.ts`, `components/sheets/screens/QiblaCompass.tsx`, `QiblaWave.tsx`, `hooks/useQibla.ts` - no user-facing strings (worklet paths and drawing only).

## 9. Everything else that breaks when the name stops being English text

- `canonicalDisplayOrder` / `EXTRAS_ENGLISH.indexOf`: `shared/prayer.ts:569-579` - a name that misses ranks `EXTRAS_ENGLISH.length` (last), silently misplacing rows; same indexOf seam at `components/overlay/overlayContent.ts:53` (miss yields `EXTRAS_EXPLANATIONS[-1]` = undefined, masked by the null check at `components/overlay/OverlayInfoBox.tsx:73`) and at `stores/notifications.ts:433, 664` (`canonicalPrayerIndex`'s `fallbackIndex` masks a miss by design - a typo'd id would rebind every alert preference to the row index).
- Islamic-day rules: `NIGHT_PRAYER_NAMES.includes` at `shared/prayer.ts:258, 358`; `MIDNIGHT_CROSSING_PRAYERS.includes` at `:248, :348`. A miss moves Suhoor/Isha/Magrib rows to the wrong list day with no error.
- `listPosition` (`shared/sequence.ts:22-27`) feeds `compareListOrder`, `isRowPassed`, `findPreviousRow` - an unknown name corrupts pass-state and the countdown bar's previous row.
- `rowPress` (`components/prayer/rowPress.ts:33`): the passed-Istijaba no-op rule is a name equality.
- Storage lookup `shared/prayer.ts:407` (`rawData[name.toLowerCase()]`): the domain id doubles as the MMKV day-record key.
- `isDailyPrayer` (`shared/notifications.ts:88, 106`): decides athan vs fixed reminder sound and which Android channel is created - a miss swaps the audio silently.
- Migration correctness: `stores/notifications.ts:487-598` maps stored index keys to names; renaming the id vocabulary without a matching migration re-reads user preferences as defaults (the AlertType integer contract at `shared/types.ts:182-202` makes a miss silent).
- `stores/countdown.ts:45` literal `'Fajr'`; `stores/schedule.ts:307` identity strings; `stores/ui.ts` width cache keyed to English glyph metrics.
- `prayerNameSlug`/identifiers (section 4): a changed slug orphans every armed OS notification - the sweep then cancels them as stale (`stores/notifications.ts:1499-1541`) and reminders stop firing with no error.

## Counts per file (production sites to touch)

| File | Sites |
| --- | --- |
| shared/prayer.ts | 24 |
| stores/notifications.ts | 22 |
| shared/notifications.ts | 14 |
| widgets/PrayerWidget.tsx | 9 |
| shared/widgetTimeline.ts | 8 |
| components/sheets/screens/Qibla.tsx | 8 (new) |
| components/prayer/Alert.tsx | 6 |
| shared/widgetTypes.ts | 6 |
| shared/sequence.ts | 5 |
| components/prayer/Prayer.tsx | 5 |
| device/notifications.ts | 5 |
| shared/time.ts | 6 |
| stores/widget.ts | 5 |
| hooks/usePrayer.ts | 4 |
| widgets/LockPrayerWidget.tsx | 6 |
| stores/ui.ts | 5 |
| shared/constants.ts | 8 definitions |
| stores/version.ts | 3 |
| components/sheets/screens/Alert.tsx | 4 |
| components/sheets/screens/Settings.tsx | 3 |
| device/qibla.ts | 3 (new) |
| shared/types.ts | 3 |
| stores/database.ts | 3 |
| hooks/usePrayerAgo.ts, hooks/useNotification.ts, components/overlay/overlayContent.ts, components/overlay/OverlayInfoBox.tsx, components/prayer/Explanation.tsx, components/prayer/rowPress.ts, components/ui/InitialWidthMeasurement.tsx, stores/countdown.ts, stores/schedule.ts, components/day/shownDate.ts, shared/text.ts, stores/sync.ts, shared/qiblaCompass.ts, shared/qiblaPlace.ts | 1-3 each |

## Five riskiest seams (mistakes are silent)

1. **Storage-key duality** - the prayer id lowercases into the MMKV day-record lookup (`shared/prayer.ts:407`) and into three preference-key families plus repair marks (`stores/notifications.ts:207, 258, 278, 335`). Change the vocabulary without a migration and every stored preference and cache read misses, falling back to defaults with no error.
2. **Deterministic OS identifiers and channel ids** - `athan_${type}_${slug}_${date}` / `reminder_...` (`device/notifications.ts:49-66`, `shared/notifications.ts:387-390`). A changed slug orphans armed alarms; the sweep then treats them as stale and cancels them (`stores/notifications.ts:1528-1533`), so the phone goes quiet while the UI shows bells on.
3. **`canonicalPrayerIndex` fallback** (`stores/notifications.ts:663-666`) - a name that misses `indexOf` silently degrades to the row index, rebinding which prayer's bell the sheet edits; the fallback exists to serve the loading frame and will happily mask a rename bug.
4. **Ordering and Islamic-day rules keyed by name** - `listPosition` (`shared/sequence.ts:22-27`), `NIGHT_PRAYER_NAMES`/`MIDNIGHT_CROSSING_PRAYERS` includes (`shared/prayer.ts:248, 258, 348, 358`), `rowPress` (`components/prayer/rowPress.ts:33`). A miss reorders lists, shifts rows across list days, and breaks the passed-Istijaba rule, all without a thrown error.
5. **Widget props contracts across a serialization boundary** - `nextName`/`name` ride JSON into a separate runtime with a schema version (`shared/widgetTypes.ts:14, 48-53, 80-81`); the Android eyebrow also calls `.toUpperCase()` on the name (`widgets/PrayerWidget.tsx:378`) and rows are keyed by name (`:737`). A catalog mismatch renders stale or colliding rows in widgets the app cannot re-push until the next data event.
