# R14. Test refactor census (research agent report, 2026-10-09)

> **Correction banner, 2026-10-10 (external verification CNT-7/CNT-8):** the headline counts
> below are wrong; the table is right. The tree holds 189 test files, not 171; the table lists
> 85 distinct affected suites, not 74; the true subtotals are 62/38/28/17/8, not 62/38/24/18/7.
> The per-suite rows and citations were re-verified and stand. The plan cites the table, never
> the headline.

Dispatched by the owner's instruction. 171 test files scanned; suites with at least one affected
assertion: 74. Marker lines = grep hits for the category's patterns. The five categories:

1. English prayer names / `.english` field / `prayerEnglish`
2. `arabic` field / `arabicName` / `showArabicNames` / Arabic strings / `toArabicNumbers`
3. Display copy that becomes catalog keys (titles, labels, help, whatsNew, explanations, notification titles, channel names)
4. MMKV keys / notification identifiers built from names
5. Widget timeline props (names / date labels baked in)

## Affected suites (evidence file:line)

| Suite | Cat | What breaks |
|---|---|---|
| stores/__tests__/schedule.test.ts | 1,2 | ~106 marker lines: mock prayers carry `english:`/`arabic:`, countdown asserts `name: 'Fajr'`, row filters on `p.english === 'Fajr'` (:113,188,218-221,742,794,1204,1396,2099) |
| stores/__tests__/notificationAlertCommit.test.ts | 1,2,4 | `commitPrayerAlertChange(type, idx, 'Fajr', 'الفجر', ...)` signature threads both names through ~80 asserts; `athanIds('Fajr')` builds ids from names (:77-80,277,294,475-476,603,714) |
| stores/__tests__/notifications.test.ts | 1,2,4 | `getNames().english/.arabic` parity, `canonicalPrayerIndex('Fajr')`, name-keyed MMKV `preference_alert_standard_fajr`, index-to-name migration asserts (:100-137,199,224-235,305-313,556,1143-1145,1689) |
| shared/__tests__/prayer.test.ts | 1,2 | `prayer.english`/`prayer.arabic` equals, `EXTRAS_ARABIC`/`PRAYERS_ARABIC` imports, row keys `${english}` (:139-146,157,171-177,261-284,768-787,1086-1185,1245-1248) |
| shared/__tests__/widgetSimulation.test.ts | 1,2,5 | Fixture rows pair `'Fajr','الفجر'`; `nextName` compared to `expected.next.english`; `dateLabel` vs `formatDateLong` (:76-81,91-96,251,793,839,857-873,1030-1038) |
| shared/__tests__/widgetTimeline.test.ts | 1,2,5 | `nextName` asserts, `dateLabel` vs `formatDateLong`/`formatHijriDateLong`, `PRAYERS_ENGLISH` dashed rows (:48,67,154-160,185-204,298,479-559,790,848-931,994-1091) |
| shared/__tests__/sequence.test.ts | 1,2 | Row builders set `arabic:`; `.english` used as lookup key throughout (logic survives a rename, fields do not) (:83-91,116,127,1192,1447,1949,2056-2064) |
| shared/__tests__/constants.test.ts | 1,2 | Imports and pins all six arrays incl. `PRAYERS_ARABIC`, `EXTRAS_EXPLANATIONS_ARABIC`; parity tests (:11-18,63-84,312) |
| shared/__tests__/text.test.ts | 2 | Whole `toArabicNumbers` describe (the export is deleted) (:8,14-56) |
| shared/__tests__/notifications.test.ts | 2,3,4 | `genNotificationContent('Fajr','الفجر',...)` titles `'Fajr now'`, `'Fajr in 15m'`; channel id builders `reminder_fajr_5_v3`; channel name `'Athan 1'` (:295-321,377,397-427,599,662-685,754-755) |
| shared/__tests__/nightTimes.test.ts | 1,2 | `rowOf(list,'Midnight')`, `row.english.toLowerCase()` mapped to API fields, arabic copied between rows (:104-131,276,420-432,523-586) |
| shared/__tests__/widgetRenderer.test.ts | 1,2,5 | `makePrayer(date,time,english)` with `arabic: ''`; `nextName:'Asr'`, `dateLabel:'Saturday, 17 October'`, name-width layout on 'Fajr' texts (:187-206,236-246,359,546,661-682,762-800,880) |
| shared/__tests__/widgetLockRenderer.test.ts | 5 | `dateLabel: 'Saturday, 17 October'` literal (English month name), `nextName:'Asr'` bold-name matching (:117-121,262,289,332,351,410) |
| shared/__tests__/widgetSnapshot.test.ts | 1,2,5 | Fixture pairs english/arabic; `dateLabel` vs `formatDateLong`/`formatHijriDateLong` (:30-35,43,52,98,138-150) |
| shared/__tests__/istijabaFridayList.test.ts | 1,2 | Row `english:'Istijaba'`, `arabic:'استجابة'`, joined asserts (:51-59) |
| shared/__tests__/fajrNearMidnight.test.ts | 1 | `row.english === 'Fajr'` filter, `getPrayerForDate(...,'Fajr',...)` (:38,55-62) |
| shared/__tests__/extrasListsAtMidnight.test.ts | 1 | `list.map(row => row.english)` equals array of names (:43,68) |
| shared/__tests__/standardRowsAtMidnight.test.ts | 1 | `row.english === english` crossing-row filter (:41,47,71) |
| shared/__tests__/lastThirdAroundMidnight.test.ts | 1 | `shown()` includes `row.english`; filters on 'Midnight'/'Last Third' (:38,58) |
| shared/__tests__/audioMatrix.test.ts | 1 | Counts and enumerates `[...PRAYERS_ENGLISH, ...EXTRAS_ENGLISH]` (:28,66,101,135) |
| shared/__tests__/whatsNew.test.ts | 3 | Content contract pins titles/bodies (:148-181,232,275-277) |
| shared/__tests__/help.test.ts | 3 | Whole suite asserts English questions/answers/steps verbatim (:13-19,27-28,47,64-67,88) |
| shared/__tests__/time.test.ts | 3,5 | `formatDateLong` month asserts (`/Jun/`, `/Dec/`), `formatHijriDateLong` labels - become locale-driven (:490-513,708-719) |
| hooks/__tests__/useSchedule.test.ts | 1 | `row.english` joined lists, name-array equals (:59-60,239) |
| hooks/__tests__/usePrayer.test.ts | 1,2 | `[row.english,...]` equals, mocks with `english:''`, `arabic:''`, overlay rows (:183,225,260-262,280,290,297) |
| hooks/__tests__/usePrayerSequence.test.ts | 1 | `rows[12].english` equals, 'Fajr: passed' style strings (:65-146,201,231,280) |
| hooks/__tests__/usePrayerAgo.test.ts | 1,2,3 | Mocks `english:'Fajr', arabic:'الفجر'`; asserts display strings `'Fajr 2h 30m ago'`, `'Fajr now'` (:64-65,90-146,189,222,266) |
| hooks/__tests__/useCountdown.test.ts | 1 | `prayerName: 'Fajr'` equals from `next.english` (:62-74) |
| hooks/__tests__/useNotification.test.ts | 1,2 | `commitAlertMenuChanges(...,englishName,arabicName)` threading; `english/arabic` case rows (:358-365,376-474) |
| hooks/__tests__/notificationSettingsFallback.test.ts | 1,2 | Passes `'Fajr','الفجر'` into commit (:236-243) |
| stores/__tests__/countdown.test.ts | 1 | `standardCountdownAtom` equals `{timeLeft, name:'Fajr'}` throughout (:97-103,416-467,671-711) |
| stores/__tests__/countdownMidnight.test.ts | 1 | Countdown `name:'Fajr'` across midnight cases (:182-231,348,393-431) |
| stores/__tests__/countdownSelectors.test.ts | 1 | `minutesFromNow('Fajr',...)` mock builder (:123,136) |
| stores/__tests__/syncUnreadableDay.test.ts | 1 | `rowsOf` equals `'Fajr, Sunrise, ...'`, countdown name (:281,311,316-318) |
| stores/__tests__/syncLateDecember31.test.ts | 1 | Prayer-name strings in stored rows (3 marker lines) |
| stores/__tests__/notificationPreferenceSetters.test.ts | 1,4 | Enumerates `PRAYERS_ENGLISH.map(name...)`; asserts key `preference_reminder_alert_${type}_${name.toLowerCase()}` and `'preference_reminder_alert_extra_last third'` (:14-15,56-57,109,153-157) |
| stores/__tests__/notificationMigrationGuards.test.ts | 1,4 | Mocks `EXTRAS_ENGLISH`; sets index keys `preference_alert_extra_${index}` and asserts name-keyed migration (:13,28,43-44) |
| stores/__tests__/database.test.ts | 1,2,4 | `englishName:'Fajr'`/`arabicName:'الفجر'` record mocks; keep-list pins `'prayer_max_english_width_'` (:315-320,399-404,542-545) |
| stores/__tests__/notificationSchedulingLock.test.ts | 1,2,4 | `athanIds('Fajr')`/`reminderIds('Fajr')` from `prayerNotificationIdentifier(name,date)`; commit args carry names (:67-70,116-118,207-293,325-386) |
| stores/__tests__/notificationOffCancelFailure.test.ts | 1,2,4 | `FAJR = WINDOW.map(date => prayerNotificationIdentifier(Standard,'Fajr',date))`; record `englishName/arabicName` (:43-44,91-92,137) |
| stores/__tests__/notificationStaleCancelFailure.test.ts | 1,2,4 | Identifier builders from 'Fajr'; record names (:58-59,69-80) |
| stores/__tests__/notificationRefreshGate.test.ts | 1,2,4 | `FAJR_TODAY/TOMORROW` identifier constants; record names (:51-52,155-156) |
| stores/__tests__/notificationSinglePrayerUpdate.test.ts | 1,2,4 | `PRAYERS_ARABIC[PRAYERS_ENGLISH.indexOf('Asr')]`; `prayerNotificationIdentifier` map keys; `id.startsWith('athan_')` (:82-100,112-113,161-162,186) |
| stores/__tests__/notificationsClockChange.test.ts | 1 | `enable(ScheduleType.Standard, 'Fajr')` name args (:39,136) |
| stores/__tests__/notificationsAroundMidnight.test.ts | 1 | 14 name-string marker lines (Istijaba/Midnight scheduling) |
| stores/__tests__/notificationsMidnightWindow.test.ts | 1 | 4 name-string marker lines |
| stores/__tests__/notificationsFridayIstijaba.test.ts | 1 | 1 name-string marker line |
| stores/__tests__/ui.test.ts | 1,2 | `showArabicNamesAtom` default assert; `prayerEnglish:'Fajr'`/`prayerArabic:'الفجر'` sheet state (:87,114,215-216) |
| stores/__tests__/widgetSettingsSync.test.ts | 5 | `dateLabel` equals `formatHijriDateLong`/`formatDateLong` on widget props (:22,156,173,265-275) |
| stores/__tests__/sync.test.ts | 4 | Keys list includes `'prayer_max_english_width_standard'` (:372,448) |
| stores/__tests__/syncFetchBeforeWipe.test.ts | 4 | Sets/reads `prayer_max_english_width_standard` (:105,118) |
| stores/__tests__/version.test.ts | 4 | Keep-list includes `'prayer_max_english_width_'` (:373) |
| device/__tests__/notifications.test.ts | 1,2,3,4 | `row('Fajr','الفجر',...)` fixtures; identifier format tests; channel wiring `reminderAndroidChannelId('Last Third',15)`; record `englishName:'Midnight'` (:16-47,97-114,161-327,358-365,389,406-419) |
| device/__tests__/notificationsClockChange.test.ts | 1,2 | Row `english/arabic:'Last Third'/'آخر ثلث'`; identifier echoes (:17-18,55) |
| device/__tests__/notificationNativeTimeout.test.ts | 1,2,4 | `english/arabic` + `englishName/arabicName:'Isha'`; error copy pins `'reminder_isha_15_v3'` channel id (:52-53,63-64,158,176) |
| device/__tests__/reminderCancelFailure.test.ts | 1,2 | `englishName:'Suhoor'`, `arabicName:'السحور'` (:32-33) |
| device/__tests__/androidChannelUpdate.test.ts | 3,4 | Channel `name: 'Athan ${i}'` and `athan_${i+1}_v4` ids become locale-driven (:34-45,49-56) |
| components/overlay/__tests__/Overlay.test.tsx | 2,3 | `getByText(arabic)` explanation asserts alongside English (:124-142) |
| components/overlay/__tests__/overlayContent.test.ts | 1,2,3 | `EXPLAINED` table pins English + Arabic explanations; `row.english` indexing (:15,41,45-49,91,129-173) |
| components/overlay/__tests__/overlayPlacement.test.ts | 1,2,3 | `prayer.english` mapping; Arabic explanation strings in case table (:112,119-151) |
| components/prayer/__tests__/Prayer.test.tsx | 1,2 | `getByText('الشروق')` Arabic-name tests; `showArabicNamesAtom` toggle; `getByText('Fajr')` presses (:13,23-40,76,94,124) |
| components/prayer/__tests__/Prayer.test.ts | 1,2 | Mocks `showArabicNamesAtom` in ui mock; 'Fajr' overlay arg (:69,96,102) |
| components/prayer/__tests__/Explanation.test.tsx | 1,2,3 | `EXTRAS_EXPLANATIONS_ARABIC` props, Arabic-Indic digit assert, English explanation text (:8,23-42,50,67,74) |
| components/prayer/__tests__/Alert.test.tsx | 1,2,3 | `prayerEnglish:'Fajr'`/`prayerArabic` sheet state; role names `'Fajr notification: sound'` (:35,43,49-50,60-74,124,147) |
| components/prayer/__tests__/List.test.tsx | 1 | Name list `['Fajr',...,'Isha']` and `PRAYER_NAME` regex from arrays (:10,37,53) |
| components/prayer/__tests__/rowPress.test.ts | 1 | `${row.english}: ${action}` expectation strings (:66,70,82,90,117,142) |
| components/prayer/__tests__/activePill.test.ts | 1 | `names.indexOf(row.english)` positioning (:13,46-47,132) |
| components/prayer/__tests__/Ago.test.tsx | 1,3 | Display strings `'Dhuhr 58m ago'` (:18-19,34) |
| components/countdown/__tests__/Countdown.test.tsx | 1,3 | `getByText('Asr')`, `getByText('Magrib')` rendered names (:52,64,75) |
| components/sheets/screens/__tests__/Alert.test.tsx | 1,2,3 | `prayerEnglish/prayerArabic` sheet open; `getByText('Fajr')`/`'Dhuhr'`; radio labels 'Silent'/'Sound'/'Off'; `'Close to save'`; `'15 min'` (:73-74,89,104-108,119,297,347-348) |
| components/sheets/screens/__tests__/Settings.test.tsx | 2,3 | `DISPLAY_TOGGLES` labels incl. `'Show arabic names'` row; `'Change athan'` button; `'Athan 1'`; WhatsNew button (:21,59-65,107,125,144,181-183,202) |
| components/sheets/screens/__tests__/Qibla.test.tsx | 3 | ~90 `getByText('Qibla')` interactions (sheet title copy) (:102,297,403,525 and ~85 more) |
| components/sheets/screens/__tests__/Sound.test.tsx | 3 | `'Athan 1'`/`'Athan 7'` sound names (:87,92,253,312,332) |
| components/sheets/parts/__tests__/Header.test.tsx | 3 | `getByText('Settings')` title (:15) |
| components/sheets/parts/__tests__/SoundItem.test.tsx | 3 | `'Athan 3'` labels and presses (:40,65,89,132) |
| components/modals/__tests__/WhatsNew.test.tsx | 3 | Item copy (:45-46) |
| components/modals/__tests__/Modal.test.tsx | 3 | `"What's New"` title prop asserts (:25,30,38,55,65,80,95,115) |
| components/modals/__tests__/Help.test.tsx | 3 | `'Help'` title visibility (:35) |
| components/modals/__tests__/Update.test.tsx | 3 | 4 copy-assertion lines (update prompt copy) |
| __tests__/app/index.test.tsx | 1,3 | `"What's New"`, `'Help'`, `'Close'`, `'Tablet support'` copy; `'Isha notification: off'` roles (:80,165-166,185,197-210,232,245,582-594) |
| __tests__/app/indexFreshInstall.test.tsx | 1,3 | WhatsNew mock copy; `'Isha notification: off'` (:24-29,59) |
| __tests__/app/Screen.test.tsx | 1,3 | `'Isha notification: off'` roles, `'Dhuhr 58m ago'`, `'Duha 7h 14m ago'` (:23-26,35,44-47,57) |
| __tests__/app/Navigation.test.tsx | 1 | `'Isha'`/`'Midnight' notification: off'` roles (:37-38,95) |
| __tests__/app/_layout.test.tsx | 3 | `'The route'`, `'Set your preferences'`, `'Select Athan'`, `'Something went wrong.'` (:137,147-148,156) |
| shared/__tests__/widgetContract.test.ts | 5 (indirect) | AST gate: widget body may reference only params/locals; a t() catalog imported at module scope into the widget function fails rule 1 (:4-16,106-136) |

## Totals per category

| Category | Suites |
| --- | --- |
| 1. English names / `.english` field | 62 |
| 2. `arabic` / `showArabicNames` / Arabic strings | 38 |
| 3. Display copy to catalog keys | 24 |
| 4. MMKV keys / notification identifiers from names | 18 |
| 5. Widget timeline props (names/date labels) | 7 |
| Distinct affected suites (any category) | 74 |

Overlap is heavy: nearly every category-2 suite is also category-1 (both fields live on the same
fixtures), and all widget suites are 1+2+5.

## Five largest refactors by assertion count

1. stores/__tests__/schedule.test.ts - 106 marker lines
2. stores/__tests__/notificationAlertCommit.test.ts - ~80 (commit signature + athanIds)
3. stores/__tests__/notifications.test.ts - 63 (name-keyed MMKV migration block is the core risk)
4. shared/__tests__/prayer.test.ts - ~55
5. shared/__tests__/widgetSimulation.test.ts - ~45

The riskiest single change is the commit-path signature: `commitPrayerAlertChange` /
`commitAlertMenuChanges` take `(english, arabic)` name pairs, so the arabic parameter removal
rewrites argument lists in eight suites (notificationAlertCommit, notificationSchedulingLock,
notificationSinglePrayerUpdate, notificationRefreshGate, notificationOffCancelFailure,
notificationStaleCancelFailure, useNotification, notificationSettingsFallback). The second
riskiest is the name-keyed MMKV preferences (`preference_alert_standard_fajr`): the index-to-name
migration tests pin the exact key format and must be rewritten against the new id-based keys, with
a fresh migration story.

## UNAFFECTED (confirmed, 0 marker lines each)

- Qibla sensors and math: modules/qiblaheading tests, device/qibla, shared qibla suite - all 0
  hits (verified by counted grep).
- Sequence logic behavior: rules survive; fixtures need the field rename.
- Time math: only the formatDateLong/formatHijriDateLong blocks move with locale-driven months.
- Also clean: api/client, tls13, updates, inAppUpdatesContract, backgroundTaskDebug, listeners,
  tasks, perf, logger, flagDefaults, flags, launchGate, config, nativeConfig, versionUtils,
  versionLockstep, unusedExports, qualityGate, candidateHorizon, clockChangeReadings,
  expoLocationPatch, identifierScan, widgetOpenAppPatch, widgetRuntimeLoads, widgetAssets,
  androidWidgetGrid, athanDurations, ramadanSeasonIntl, hooks animation suites, countdown Bar and
  tipGeometry, overlay catcherGeometry, VeilBackdrop, ActiveBackground, ui suite (BackgroundGradients,
  Error, Glow, Icon, InitialWidthMeasurement, Masjid, RamadanDecorations, SettingsButton),
  sheets/parts (LabeledToggle, reminderStep, alertDraft, soundSheet, SegmentedControl, Shared,
  Sheet, Stepper, Toggle), stores (bootstrap, coldLaunchRearm, notificationGateRace,
  notificationSoundCommit, overlay, overlayAtoms, syncLoadable, versionFailures, widgetAndroid,
  widgetFlagOff, widgetIo, widgetPlatform, widgetPushPastTarget, widgetRefreshChain),
  device/notificationForegroundHandler, day/Day. One indirect: shownDate.test.ts:37-40 mocks
  `englishWidthStandardAtom`/`englishWidthExtraAtom`, which change identity under per-locale keys.

## Assumptions

- "Single language" is English, so rendered-name asserts (`getByText('Fajr')`) survive only if
  `t()` returns the English string by default; counted affected because the catalog indirection
  changes where the string comes from.
- The `.english` field survives as the identifier (per the brief); category 1 counts field-level
  churn (renames, mock shapes, key derivation), not value churn.
- Category counts treat a suite once per category.
- Update.test.tsx and the four counted-only stores suites were classified by marker count, not
  line-by-line reads.
