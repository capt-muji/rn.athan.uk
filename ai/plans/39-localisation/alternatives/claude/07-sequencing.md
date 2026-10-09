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
  `shared/prayerNames.ts` exporting `prayerIdForEnglishName(name): PrayerId`.
- **Changes:** the bodies, not the signatures, of every key and identifier builder so that each
  delegates to `shared/identifiers.ts`: `stores/notifications.ts:203-208`, `:253-281`,
  `:333-338`, `:487-493`; `device/notifications.ts:49-50`, `:61-66`; `stores/database.ts:193`,
  `:212`, `:222`, `:236`, `:258`, `:272`, `:287`, `:304`; `shared/notifications.ts:88-117`,
  `:147-163`, `:380-403`, `:523-552`.
- **Tests:** T-ID-1 to T-ID-4, T-ID-6. Every existing pinned-byte suite passes unedited.
- **Exit:** no literal in an existing test changed.

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
- **Deletes:** `canonicalPrayerIndex`, `getPrayerArrays`, `schedulePlanKey`, `isDailyPrayer`,
  `prayerNameSlug`, `NIGHT_PRAYER_NAMES`, `MIDNIGHT_CROSSING_PRAYERS`, `prayerIdForEnglishName`.
  Their tests go with them (`stores/__tests__/notifications.test.ts:98-170`, `:515-571`;
  `shared/__tests__/constants.test.ts:31-56`; the plan-key lines at
  `shared/__tests__/notifications.test.ts:124-125`, `:187-188`), replaced by T-ID-1 and T-ID-2.
- **Tests:** T-ID-5. Record-shape expectations at `stores/__tests__/database.test.ts:315-322`,
  `:399-406` change to the new shape, and a new case reads a 1.x-shaped record.
- **Exit:** the pinned-byte suites still hold their literals.

### S3. One string through the whole pipe

- **Approval:** installing `expo-localization`.
- **Adds:** `shared/locales/types.ts`, `en.ts` (every key of `02a-catalog-keys.md`),
  `index.ts` (registry with `en` only), `notes.json`; `shared/i18n.ts`; `stores/language.ts`
  without `setLanguage` and `markLanguageBaked`; `hooks/useT.ts`;
  `shared/__mocks__/expo-localization.ts` and its mapper line.
- **Changes:** the first consumers, so every export is reached: the row's name
  (`components/prayer/Prayer.tsx:89`) and the countdown's name
  (`components/countdown/Countdown.tsx:46-47`) draw `t(prayerNameKey(id))`.
- **Tests:** T-CAT-T, T-FMT, T-LANG-1 to T-LANG-3, gates G2 to G5, G8, G10 to G12 over the one
  pack.
- **Exit:** every screen test passes unedited.

### S4. Home screen strings

- **Changes:** `shared/time.ts:229-254`, `:528-574` (formatters take a catalog; `readHijriParts`
  added; `isRamadan` rebuilt on it); `hooks/usePrayerAgo.ts:36`; `components/day/Day.tsx:48-49`;
  `components/day/shownDate.ts:32-35`; `components/countdown/Bar.tsx:166`; `app/index.tsx:211`;
  the overlay and explanation text (`components/overlay/overlayContent.ts`,
  `components/prayer/Explanation.tsx`), English line only.
- **Deletes:** `EXTRAS_EXPLANATIONS` (`shared/constants.ts:54-60`).
- **Tests:** T-CAT-7. `yarn test:tz`.

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
- **Tests:** gates G0, G6, G7, G9 join the suite.
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
  `:562-593`; `device/notifications.ts:32-41`, `:82-137`, `:212-255`;
  `stores/notifications.ts:1382-1454`, `:1585-1668`, `:1794-1796` (document 03, "What a full
  pass now does"); `stores/language.ts` gains `bakedLanguageAtom`, `languageNeedsBake`,
  `markLanguageBaked`.
- **Adds:** `syncAndroidChannelNames`, `channelNameFor`; the harness pieces of document 06.
- **Tests:** T-N-1, T-CH-1, T-SW-1, T-SW-2, T-SW-4, T-SW-7, T-SW-8. The suites set the language
  through the atom, because `setLanguage` arrives in S13.
- **Device:** D-2, D-3.

### S11. Widgets

- **Changes:** `shared/widgetTypes.ts`, `shared/widgetTimeline.ts`, `stores/widget.ts:84-90`,
  `:124-140`, `widgets/PrayerWidget.tsx`, `widgets/LockPrayerWidget.tsx` (document 04,
  section 4).
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
- **Tests:** T-ROW-4, T-SW-0, T-SW-9, T-SW-10, T-SW-11, T-SW-N.

### S14a to S14d. Hindi, Malay, Somali, Thai

One commit per pack: the pack file, its lock file, one registry line. Data only. Each passes
G0 to G12 with no test edit.

### S15. The upgrade proof and the release entry

- **Adds:** `stores/__tests__/upgradeFixture.ts`, `__tests__/app/upgradeTo2.test.tsx`.
- **Changes:** `shared/whatsNew.ts` (the 2.0.0 entry), and the version becomes `2.0.0`.
- **Tests:** T-UP-1 to T-UP-7. The mutation pass of document 06.
- **Device:** D-7.

### S16. Release tiers

One data commit per pack that changes `tier` to `release`, after D-5 and D-8 pass for it and a
native reader has used the confidence build.

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
