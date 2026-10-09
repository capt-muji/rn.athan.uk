# 07. Commit-level sequencing

Each step is one commit on a branch off `uat`. Documents 01 to 06 define what each step builds.
This document fixes the order, the file list, the tests and the exit gate.

## Rules for every step

1. Fetch `origin` and take the next patch version. Bump it in `app.json`, `package.json` and,
   when the folder exists, `android/app/build.gradle` (`ai/AGENTS.md`, Hard rules;
   `shared/__tests__/versionLockstep.test.ts:58-75`).
2. Write the step's new tests first and see them fail for the right reason.
3. `yarn validate` exits zero. `node scripts/check-changed-coverage.js --staged` exits zero.
   Steps that touch `shared/time.ts` also run `yarn test:tz`.
4. No export lands without a production caller in the same commit
   (`shared/__tests__/unusedExports.test.ts:16-54`). The order below is built around that rule.
5. A test is deleted only together with the function or behaviour it tested, and the step names
   its replacement.
6. Steps S1 to S11 change no pixel for an English user and no byte a 1.x install already holds.
   S12 and S13 are the visible ones.

Approvals a step needs before it starts are from `ai/AGENTS.md` ("Ask first").

## The steps

### S1. Registry and wire format

- **Adds:** `shared/prayers.ts`, `shared/identifiers.ts` (document 01), and a transitional
  `shared/prayerNames.ts` exporting `prayerIdFor(scheduleType, englishName): PrayerId | undefined`.
  It folds the name's case and matches the schedule exactly, so it answers `undefined` for a
  pair that names no prayer.
- **Changes:** the bodies, not the signatures, of the builders whose arguments already name one
  prayer, so that each delegates to `shared/identifiers.ts`:
  - by schedule and name: the atom and mark factories at `stores/notifications.ts:203-208`,
    `:253-281`, `:333-338`, and the migration's keys at `:487-493`, `:575-579`;
  - by schedule and index, through `prayerIdsFor(scheduleType)[prayerIndex]`: the record keys
    and prefixes at `stores/database.ts:193`, `:212`, `:236`, `:258`, `:272`, `:304`, and by
    schedule alone at `:222`, `:287`;
  - by name alone, which is unique across the two lists: audio and channel builders and the
    legacy channel list at `shared/notifications.ts:88-117`, `:147-163`, `:380-403`, `:523-552`.
- **Left for S2:** the two identifier builders at `device/notifications.ts:49-50`, `:61-66`.
  One existing case hands them a schedule and a name that do not belong together
  (`device/__tests__/notifications.test.ts:58-61`), which only their present bodies can answer.
- **Tests:** T-ID-1, T-ID-6, and T-ID-2 and T-ID-4 for keys, records, audio and channels. Their
  rows for the two OS identifier builders join in S2, when those builders gain a caller. Every
  existing suite passes unedited.
- **Exit:** no existing test file changed.

### S2. Rows carry an id

- **Approval:** notification scheduling logic (signatures only; no behaviour).
- **Changes:** `shared/types.ts:266-276` (row), `:329-336` (countdown); `shared/prayer.ts`
  (every name comparison becomes a registry read; `getPrayerForDate`,
  `firstStillDueListDayForPrayer`, `calculateBelongsToDate` take ids); `shared/sequence.ts:25`,
  `:194`; `stores/schedule.ts:89`, `:307`; `stores/countdown.ts:45`, `:413-430`; the signature
  table of document 01 in `stores/notifications.ts`, `device/notifications.ts`,
  `stores/database.ts`, `shared/notifications.ts`, `hooks/useNotification.ts:210-266`;
  `stores/ui.ts:16-23`; `components/prayer/Alert.tsx:65-66`, `:154-160`;
  `components/prayer/rowPress.ts:13-33`; `components/overlay/overlayContent.ts:51-56`;
  `components/sheets/screens/Alert.tsx`; `shared/widgetTimeline.ts:135`, `:188`, `:247`,
  `:303`, `:306`.
- **Display** still comes from the two name arrays through `englishNameOf(id)` and
  `arabicNameOf(id)` in `shared/prayerNames.ts`. The screen is unchanged.
- **Also changes:** the two identifier builders S1 left, `device/notifications.ts:49-50`,
  `:61-66`, and the hook's loading frame (`hooks/usePrayer.ts:87-102`, document 01).
- **Deletes:** `canonicalPrayerIndex`, `getPrayerArrays`, `schedulePlanKey`, `isDailyPrayer`,
  `prayerNameSlug`, `NIGHT_PRAYER_NAMES`, `MIDNIGHT_CROSSING_PRAYERS`, `prayerIdFor`. The cases
  that go with them, and what replaces each, are the S2 rows of the table in document 06.
- **Tests:** T-ID-3, T-ID-5, and the loading-frame cases in the hook, row and bell suites.
- **Exit:** every expected literal in the pinned-byte suites is unchanged.

### S3. One string through the whole pipe

- **Approval:** installing `expo-localization`.
- **Adds:** `shared/locales/types.ts`, `en.ts` (every key of `02a-catalog-keys.md`),
  `index.ts` (registry with `en` only), `match.ts`, `notes.json`; `shared/i18n.ts`;
  `stores/language.ts` with detection and `catalogAtom`; `hooks/useT.ts`;
  `shared/__mocks__/expo-localization.ts` and its mapper line. Each module exports only what the
  export table below gives it for this step.
- **Changes:** the first consumers, so every export is reached: the row's name
  (`components/prayer/Prayer.tsx:89`) and the countdown's name
  (`components/countdown/Countdown.tsx:46-47`) draw `t(prayerNameKey(id))`.
- **Tests:** T-CAT-T, T-FMT, T-LANG-1, T-LANG-2, gates G2 to G5, G8, G10 to G12 over the one
  pack.
- **Exit:** every screen test passes unedited.

### S4. Home screen strings

- **Changes:** `shared/time.ts:229-254`, `:528-574` (formatters take a catalog; `readHijriParts`
  added; `isRamadan` rebuilt on it); `hooks/usePrayerAgo.ts:36`; `components/day/Day.tsx:48-49`;
  `components/day/shownDate.ts:32-35`; `components/countdown/Bar.tsx:166`; `app/index.tsx:211`;
  the overlay and explanation text (`components/overlay/overlayContent.ts`,
  `components/prayer/Explanation.tsx`), English line only.
- **Deletes:** `EXTRAS_EXPLANATIONS` (`shared/constants.ts:54-60`), which has no reader left and
  would trip the unused-export guard. The one assertion on it,
  `shared/__tests__/constants.test.ts:71-73`, goes in the same commit; G8 and the catalog's
  five `explanation.*` keys replace it.
- **Tests:** T-PAR-1. `yarn test:tz`.
- **Device:** D-10, before the step merges.

### S5. Sheet strings

- **Changes:** every literal of `02a-catalog-keys.md` sections 2.8 to 2.12 and the matching
  rows of 2.20: `components/sheets/screens/Settings.tsx`, `Alert.tsx`, `ReminderCard.tsx`,
  `Sound.tsx`, `ColorPicker.tsx`, `Qibla.tsx`, `QiblaCompass.tsx`, `QiblaWave.tsx`,
  `components/sheets/parts/Stepper.tsx`, `SoundItem.tsx`, `SegmentedControl.tsx`,
  `shared/qiblaPlace.ts:46`, `components/prayer/Alert.tsx:30-34`, `:183-190`.

### S6. Modals, error screen, native dialogs

- **Changes:** `shared/help.ts` and `shared/whatsNew.ts` hold keys in place of strings;
  `components/modals/Help.tsx`, `WhatsNew.tsx`, `Update.tsx`; `components/ui/Error.tsx`;
  `hooks/useNotification.ts:57-67`; `device/qibla.ts`.
- **Exit of S4 to S6 together:** a source-text guard added in S6 finds no string literal inside
  a JSX text position or an `accessibilityLabel`, `accessibilityHint`, `title` or `subtitle`
  attribute under `app/` and `components/`, other than the symbols listed in
  `02a-catalog-keys.md` section 7.

### S7. The Arabic pack and the full gate

- **Adds:** `shared/locales/ar.ts` at `tier: 'preview'`, produced by the procedure of document
  02 and seeded from `02a-catalog-keys.md` section 5; `shared/locales/lock/ar.json`;
  `scripts/catalog-lock.js`; the registry line.
- **Tests:** gates G0, G6, G7, G9 and G13 join the suite. T-LANG-3, which needs a preview pack.
- **Exit:** a non-production build on a phone set to Arabic starts in Arabic. Titles, channels
  and widgets are still English until S10 and S11.

### S8. The name column width, per language

- **Changes:** `stores/ui.ts:104-107`, `:216-231` (`nameWidthAtoms`, `nameWidthKey`,
  `setNameWidth`); `components/ui/InitialWidthMeasurement.tsx` (one hidden text per prayer id,
  keyed by language); `hooks/usePrayer.ts:81`, `:100`, `:117` (`ui.nameWidth`);
  `components/prayer/Prayer.tsx:65-67` (reads the renamed field).
- **Deletes:** `getLongestPrayerNameIndex` (`shared/prayer.ts:196-209`) and its tests.
- **Tests:** T-ROW-2, T-ROW-3.
- **Exit:** in English the two 1.x width keys are read and written as before, so no row
  reflows. In Arabic the column fits the Arabic names.

### S9. The imminent reminder

- **Approval:** notification scheduling logic.
- **Changes:** `stores/notifications.ts:1040-1051` (document 04, section 2).
- **Tests:** T-N-2, red first on the step's parent commit.

### S10. Notification titles, channel names, the baked marker

- **Approval:** notification scheduling logic; one new MMKV key
  (`preference_language_baked`).
- **Changes:** `shared/notifications.ts:123-138`, `:174-189`, `:409-417`, `:445-514`,
  `:562-593`; `device/notifications.ts:32-41`, `:82-137`, `:212-255`; in
  `stores/notifications.ts` every function between the pass and the arm call, so that each
  carries the catalog: `:826-882`, `:904-959`, `:1012-1076`, `:1094-1155`, `:1201-1241`,
  `:1271-1309`, `:1330-1372`, `:1382-1454`; the sweep's result at `:1499-1541`; the pass at
  `:1585-1668`; the gate at `:1794-1796` (document 03, "What a pass now does with language");
  the callers that hand a catalog to `initializeNotifications` (`app/index.tsx:109`,
  `device/listeners.ts:50`); `stores/language.ts` gains the baked atom and its three functions.
- **Adds:** `syncAndroidChannelNames`, `channelNameFor`, `parseChannelId`; the harness pieces of
  document 06, the `resetAlarms` change included.
- **Tests:** T-N-1, T-CH-1, and every T-SW case that does not call `commitLanguageSelection`:
  T-SW-1, T-SW-3 to T-SW-8, T-SW-11, T-SW-13, T-SW-15, T-SW-17. The suites set the language
  through the atom, because `setLanguage` arrives in S13.
- **Device:** D-2, D-3.

### S11. Widgets

- **Changes:** `shared/widgetTypes.ts`, `shared/widgetTimeline.ts`, `stores/widget.ts:84-90`,
  `:124-140`, `widgets/PrayerWidget.tsx`, `widgets/LockPrayerWidget.tsx` (document 04,
  section 4), the rename of each layout's second parameter included.
- **Tests:** T-W-1 to T-W-6. The twelve digests at
  `shared/__tests__/widgetSimulation.test.ts:645-686` are re-pinned in this commit and no other,
  after T-W-4 is green. Run the widget runtime load suite.
- **Device:** D-4, and D-5 for `en` and `ar`.

### S12. The single-language row

- **Approval:** `app.json` (one plugin entry); the two owner-visible consequences of document
  04, section 5 (the time moves; a right-to-left phone stops mirroring).
- **Adds:** `plugins/ltrOnly.js`.
- **Changes:** `components/prayer/Prayer.tsx` (the wrapper, one name, no Arabic text);
  `stores/ui.ts:131-132`; `components/sheets/screens/Settings.tsx:22`, `:37`, `:128-132`;
  `components/prayer/Explanation.tsx` and the overlay (the Arabic line goes); `app.json`
  (the plugin entry).
- **Deletes:** `showArabicNamesAtom`, `PRAYERS_ENGLISH`, `EXTRAS_ENGLISH`, `PRAYERS_ARABIC`,
  `EXTRAS_ARABIC`, `EXTRAS_EXPLANATIONS_ARABIC`, `shared/prayerNames.ts`, `shared/text.ts`,
  `TEXT.sizeArabic`, `TEXT.lineHeight.arabic` (`02a-catalog-keys.md` section 4). Tests that go
  with them: `shared/__tests__/text.test.ts`, the bilingual cases at
  `components/prayer/__tests__/Prayer.test.tsx:23-41`, the toggle cases at
  `components/sheets/screens/__tests__/Settings.test.tsx:59-65`, `:256-267`,
  `shared/__tests__/constants.test.ts:63-85`. Replacements: T-ROW-1, T-ROW-5, T-ID-1.
- **Device:** D-1, D-6.

### S13. The language row and sheet

- **Approval:** the globe drawing.
- **Adds:** `components/sheets/screens/Language.tsx`, `assets/icons/svg/globe.svg`,
  `Icon.GLOBE`, `e2e/flows/language-switch.yaml`; `setLanguage` in `stores/language.ts`;
  `commitLanguageSelection` in `stores/notifications.ts`.
- **Changes:** `components/sheets/screens/Settings.tsx` (the row), `stores/ui.ts` (the sheet
  ref), `components/sheets/index.ts`, `app/_layout.tsx:88-91`.
- **Tests:** T-ROW-4, T-SW-0, T-SW-9, T-SW-10, T-SW-12, T-SW-16, T-SW-N.

### S14a to S14d. Hindi, Malay, Somali, Thai

One commit per pack: the pack file, its lock file, one registry line. Data only. Each passes
G0 to G12 with no test edit.

### S15. The upgrade proof and the release entry

- **Adds:** `stores/__tests__/upgradeFixture.ts`, `__tests__/app/upgradeTo2.test.tsx`.
- **Changes:** `shared/whatsNew.ts` (the 2.0.0 entry), and the version becomes `2.0.0`.
- **Precondition:** the owner has named the version that is live in the stores
  (document 05, "Which 1.x").
- **Tests:** T-UP-1 to T-UP-9. The mutation pass of document 06.
- **Device:** D-7, on an install of the live store version.

### S16. Release tiers

One data commit per pack that changes `tier` to `release`, after D-5 and D-8 pass for it and a
native reader has used the confidence build.

## Exports, and the step each one appears in

The unused-export guard matches `export const`, `function`, `type`, `interface` and `enum`
alike, and counts an import only from another production file
(`scripts/find-unused-exports.py:29-30`, `:25-26`). A symbol used only in its own file, or only
by tests, is reported as dead. So each symbol below is exported in the step named and not
before. Until then a test reaches it through its exported caller. Anything in documents 01 to
04 that is not in this table is module-private.

| Module | Exported | First production importer | Step |
| --- | --- | --- | --- |
| `shared/prayers.ts` | `PrayerId`, `ExtraPrayerId`, `definitionOf`, `prayerIdsFor` | `shared/identifiers.ts`, `stores/database.ts` | S1 |
| `shared/prayers.ts` | `PRAYER_IDS`, `STANDARD_PRAYER_IDS`, `prayerIdsOnListDay` | `stores/notifications.ts`, `shared/prayer.ts` | S2 |
| `shared/identifiers.ts` | every key, record, audio and channel builder; the three index-key builders; the two legacy constants | the three modules S1 rewires | S1 |
| `shared/identifiers.ts` | `atTimeNotificationId`, `reminderNotificationId` | `device/notifications.ts` | S2 |
| `shared/prayerNames.ts` | `prayerIdFor`, then `englishNameOf`, `arabicNameOf` | the S1 and S2 call sites; the file is deleted in S12 | S1, S2 |
| `shared/identifiers.ts` | `parseChannelId` | `shared/notifications.ts` | S10 |
| `shared/locales/types.ts` | `MessageKey`, `ParamsOf`, `Catalog`, `LocaleMeta`, `LocalePack` | `shared/i18n.ts`, `shared/locales/index.ts`, `shared/locales/en.ts` | S3 |
| `shared/locales/types.ts` | `TranslationOf` | `shared/locales/ar.ts` | S7 |
| `shared/locales/index.ts` | `LocaleCode`, `DEFAULT_LOCALE`, `SELECTABLE_LOCALES`, `isLocaleCode`, `catalogFor`, `metaFor` | `shared/locales/match.ts`, `stores/language.ts` | S3 |
| `shared/locales/index.ts` | `LOCALES` | none: the catalog gate iterates it | S3 |
| `shared/locales/match.ts` | `matchDeviceLocale`, `readStoredLanguage` | `stores/language.ts` | S3 |
| `shared/i18n.ts` | `Translator`, `translatorFor`, `prayerNameKey` | `hooks/useT.ts`, `components/prayer/Prayer.tsx` | S3 |
| `shared/i18n.ts` | `format`, `weekdayShortKey`, `monthShortKey`, `hijriMonthKey`, `EXPLANATION_KEYS` | `shared/time.ts`, `components/overlay/overlayContent.ts` | S4 |
| `shared/i18n.ts` | `prayerHeroKey`, `hijriMonthShortKey` | `shared/widgetTimeline.ts`, `shared/time.ts` (`formatWidgetFooter`) | S11 |
| `stores/language.ts` | `catalogAtom` | `hooks/useT.ts` | S3 |
| `stores/language.ts` | `getCatalog` | `hooks/useNotification.ts` | S6 |
| `stores/language.ts` | `languageAtom` | `components/ui/InitialWidthMeasurement.tsx`, `hooks/usePrayer.ts` | S8 |
| `stores/language.ts` | `getLanguage`, `languageNeedsBake`, `markLanguageBaked`, `clearLanguageBaked` | `stores/notifications.ts` | S10 |
| `stores/language.ts` | `setLanguage` | `stores/notifications.ts` | S13 |
| `stores/ui.ts` | `nameWidthAtoms`, `setNameWidth` | `hooks/usePrayer.ts`, `components/ui/InitialWidthMeasurement.tsx` | S8 |
| `stores/ui.ts` | `showLanguageSheet`, `setLanguageSheetModal` | `components/sheets/screens/Settings.tsx`, `Language.tsx` | S13 |
| `stores/notifications.ts` | `commitLanguageSelection` | `components/sheets/screens/Language.tsx` | S13 |
| `shared/notifications.ts` | `syncAndroidChannelNames` | `stores/notifications.ts` | S10 |
| `shared/time.ts` | `formatWidgetFooter` | `shared/widgetTimeline.ts` | S11 |
| `shared/widgetTypes.ts` | `WidgetStrings` | `shared/widgetTimeline.ts` | S11 |

`LOCALES` is the one addition to the guard's allow list
(`shared/__tests__/unusedExports.test.ts:16-22`), with the reason "the catalog gate iterates the
registry at test time". The four existing entries of the same kind are limits enforced only by
tests. No production file may import `LOCALES`, or the guard's second test fails
(`:48-53`): production code uses `SELECTABLE_LOCALES`, `catalogFor` and `metaFor`.

In S3, `matchDeviceLocale` reads each pack's `match` list through `metaFor`, which is what makes
`metaFor` reachable before the language sheet exists.

## Effort and order of risk

Effort is execution-session working time for one engineer, tests included, review excluded.

| Step | Effort | Files touched (source, tests) | Reversible alone |
| --- | --- | --- | --- |
| S1 | 4 h | 6, 3 | yes |
| S2 | 12 h | 26, about 40 | yes |
| S3 | 6 h | 9, 6 | yes |
| S4 | 5 h | 9, 6 | yes |
| S5 | 5 h | 13, 4 | yes |
| S6 | 4 h | 8, 5 | yes |
| S7 | 4 h plus the translation procedure | 4, 1 | yes |
| S8 | 3 h | 4, 3 | yes |
| S9 | 2 h | 1, 1 | yes |
| S10 | 10 h plus two device gates | 4, 8 | yes |
| S11 | 10 h plus two device gates | 5, 7 | yes |
| S12 | 5 h plus two device gates | 7, 7 | no: it removes a stored preference's only reader |
| S13 | 6 h | 7, 3 | yes |
| S14 | 1 h each plus the translation procedure | 2 each | yes |
| S15 | 6 h plus one device gate | 2, 2 | yes |
| S16 | minutes each | 1 each | yes |

About 85 hours of engineering before translation and device time. S2 is the largest step and
the least risky per line: it moves no byte and every pinned suite watches it. S10 is the
riskiest step, because it edits the pass that arms alarms.

Steps S1 to S9 can ship to users as ordinary 1.29.x releases. They change nothing a production
user can see, and each one that ships shrinks what 2.0.0 itself has to prove.
