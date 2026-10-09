# Test plan

The gates are already strict: `yarn validate` is `tsc && biome && jest --coverage`
(`package.json`), the global coverage threshold is 100 per cent
(`jest.config.js:131-138`), and a per-file gate refuses a commit whose changed source
is not fully covered (`scripts/check-changed-coverage.js`). This plan adds tests that
pin the localisation contracts and names every existing suite the change adapts.

Baseline measured on the untouched branch: 189 suites, 5252 passed, 2 skipped, 100 per
cent on all four metrics, 43.18 seconds. New tests are pure and cheap; the suite should
stay under a minute.

## 1. New unit tests (`*.test.ts`, unit project)

| File | What it pins |
| --- | --- |
| `shared/__tests__/i18nCatalog.test.ts` | Every locale has exactly the `en` key set; no empty values; placeholders `{name}`/`{n}`/`{platform}` present wherever `en` has them; the on-disk catalog files equal `LOCALE_CODES` (a filesystem read, so an unregistered file fails). |
| `shared/__tests__/i18nLocale.test.ts` | `isLocaleCode` true/false; `resolveDeviceLanguage('ar-EG') = 'ar'`, `('so') = 'so'`, `('id-ID') = 'en'`, `(null) = 'en'`, `('') = 'en'`, `('EN_gb') = 'en'`. |
| `shared/__tests__/i18nTranslate.test.ts` | `interpolate` replaces known tokens, leaves unknown ones verbatim, stringifies numbers; `translate` returns the right value per locale; `prayerLabel` for all eleven ids in all six locales; `extraExplanation` null for daily prayers; `durationLabels`; `widgetStrings` field set; `prayerIdOf('Last Third') = 'last third'` and `prayerIdOf('Nonsense') = null`. |
| `shared/__tests__/i18nDigits.test.ts` | For every locale, `formatDateLong`, `formatHijriDateLong`, `formatTime`, `formatTimeAgo` and `translate('notification.reminder')` output only ASCII digits and no Arabic-Indic range, so the Latin-digit rule cannot regress. |
| `shared/__tests__/arabicCatalogPinned.test.ts` | The `ar` prayer labels equal the historical `PRAYERS_ARABIC`/`EXTRAS_ARABIC` values and the `ar` extra explanations equal `EXTRAS_EXPLANATIONS_ARABIC`, read from the constants before they are deleted or from a fixture copy. |
| `shared/__tests__/identifiers.test.ts` | Golden identifier and key strings (`DATA-AND-IDENTIFIERS.md` §11), including the space in `last third`, so no refactor moves a byte. |
| `stores/__tests__/language.test.ts` | `localeAtom` resolves device, storage wins when valid, falls back on corruption; `setLanguage` writes requested and chosen; the unchosen launch re-resolves and the chosen launch does not. |
| `stores/__tests__/languageSwitch.test.ts` | With fake deps: apply order is reschedule, widgets, delete superseded, then stamp applied; `switchLanguage` commits before deps run; `reconcile` no-ops when applied equals requested and re-runs otherwise; a rejected dep leaves applied unstamped and the next reconcile retries; two rapid switches converge on the last. |
| `stores/__tests__/localisationMigration.test.ts` | `migrateLocalisation` removes `preference_show_arabic_names` and no other key; it leaves `preference_alert_*`, `scheduled_notifications_*` and `scheduled_reminders_*` untouched. |
| `shared/__tests__/widgetLocalisation.test.ts` | `buildPrayerWidgetTimeline` and `buildPrayerWidgetSnapshot` bake localized `nextName`/row names, a locale-aware `dateLabel`, and a `strings` object for both `en` and `ar`; the stale entry carries `strings`. |
| `shared/__tests__/ltrRow.test.ts` | Reads `components/**/*.tsx` and fails on `row-reverse`, `I18nManager.forceRTL`, or `allowRTL(true)`, so the frozen row cannot be mirrored. Follows the file-scanning pattern of `shared/__tests__/widgetContract.test.ts`. |

## 2. New component tests (`*.test.tsx`, components project)

| File | What it pins |
| --- | --- |
| `components/sheets/screens/__tests__/Language.test.tsx` | The sheet lists the six endonyms in order, marks the current one, and selecting a row calls `switchLanguage` with that code. |
| `components/prayer/__tests__/Prayer.test.tsx` (adapted) | Renders one localized name under `en` and under `ar`; the Arabic name is absent under `en`; there is no second name node. |
| `components/day/__tests__/Day.test.tsx` (adapted) | The location line and the date render in the current locale. |
| `components/prayer/__tests__/Explanation.test.tsx` (adapted) | Renders one localized explanation; no Arabic-Indic digits. |
| `components/modals/__tests__/Help.test.tsx` (adapted) | Topic question, text and steps come from the locale; the DND action label is localized. |
| `components/modals/__tests__/Update.test.tsx`, `WhatsNew.test.tsx` (adapted) | Titles, body, buttons and platform-only suffix localize. |
| `components/ui/__tests__/Error.test.tsx` (new or adapted) | The four error strings localize. |
| `components/countdown/__tests__/Countdown.test.tsx` (adapted) | The waiting accessibility label localizes. |

## 3. Existing suites the change adapts, and why

The `arabic` field and the `arabicName` parameter appear in about forty test files.
The design removes the field and the parameter, so these suites are updated
mechanically. The list, from a repository-wide search, is the build session's checklist:

- `arabic` field on a `Prayer`: `shared/__tests__/prayer.test.ts:140,146,157,172,262,273,284,768,778,1086,1094,1102,1110,1125,1135,1177,1185`;
  `shared/__tests__/sequence.test.ts:85,91`; `shared/__tests__/widgetSimulation.test.ts:91,96,111,117,120,382`;
  `shared/__tests__/widgetSnapshot.test.ts:43,52`; `shared/__tests__/istijabaFridayList.test.ts:52`;
  `hooks/__tests__/usePrayer.test.ts:261`; `hooks/__tests__/usePrayerAgo.test.ts:65`;
  `device/__tests__/notifications.test.ts:26,33,365`;
  `device/__tests__/notificationNativeTimeout.test.ts:53`;
  `device/__tests__/notificationsClockChange.test.ts:18`;
  `stores/__tests__/notificationSinglePrayerUpdate.test.ts:83,96`.
- `arabicName` argument or fixture: `shared/__tests__/notifications.test.ts:755`;
  `stores/__tests__/notificationSchedulingLock.test.ts:117`,
  `notificationStaleCancelFailure.test.ts:59`, `notificationOffCancelFailure.test.ts:92`,
  `notificationRefreshGate.test.ts:156`, `notificationAlertCommit.test.ts:156,414`,
  `database.test.ts:320,404`; `device/__tests__/reminderCancelFailure.test.ts:33`.
- The bilingual row and its setting: `components/prayer/__tests__/Prayer.test.tsx:13,23,32,35`,
  `components/prayer/__tests__/Prayer.test.ts:69`,
  `components/sheets/screens/__tests__/Settings.test.tsx:21,63`,
  `stores/__tests__/ui.test.ts:87,114,216`,
  `components/sheets/screens/__tests__/Alert.test.tsx:74,348`,
  `components/prayer/__tests__/Alert.test.tsx:50`,
  `hooks/__tests__/useNotification.test.ts:359,365,464,465,466,472,474`.
- The explanation box: `components/overlay/__tests__/Overlay.test.tsx:124,128,142`,
  `overlayContent.test.ts:129,133,141,146,148,173`,
  `overlayPlacement.test.ts:119,141,151`,
  `components/prayer/__tests__/Explanation.test.tsx:25,33,38,50,67`.
- `usePrayer` return shape: `hooks/__tests__/usePrayer.test.ts` (`arabic: ''` drop).
- `genNotificationContent`/`genReminderNotificationContent` signature:
  `shared/__tests__/notifications.test.ts`.
- `getPrayerArrays` return shape: `stores/__tests__/notifications.test.ts:105-140`.
- Channel ids: `device/__tests__/androidChannelUpdate.test.ts`, `shared/__tests__/notifications.test.ts`
  (the `_v4`/`_v3` expected strings move to `_v5_{locale}`).
- Widget contract and renderer suites: `shared/__tests__/widgetContract.test.ts` (unchanged
  rules; the layouts still reference only params and globals),
  `widgetRenderer.test.ts`, `widgetLockRenderer.test.ts`, `widgetOpenAppPatch.test.ts`,
  `widgetRuntimeLoads.test.ts`, `widgetAssets.test.ts`, `widgetTimeline.test.ts`,
  `widgetSnapshot.test.ts` (expect localized strings under a set locale).
- `shared/__tests__/time.test.ts`: keep the English cases unchanged (the default locale),
  add a locale case per shipped locale and a Latin-digit assertion.
- `shared/__tests__/text.test.ts`: deleted with `shared/text.ts`.
- `shared/__tests__/unusedExports.test.ts`: unchanged rules; new exports must be reachable
  from production, so no speculative export is added.
- `shared/__tests__/versionLockstep.test.ts`: unchanged; each commit bumps the three
  version files.

## 4. Coverage strategy

- Every new pure module (`shared/i18n/*`, `stores/language.ts`) is tested to 100 per cent
  by its own suite; the changes skew toward removing branches, which lowers the risk of a
  coverage regression in edited files.
- Edited components keep their existing suites, which already reach 100 per cent for those
  files; literal-for-key substitutions add no branches. Where a branch is removed (the
  bilingual row, the digit substitution), coverage can only improve.
- `widgets/` stays unmeasured for line coverage (`scripts/check-changed-coverage.js:38-41`);
  the widget change is guarded by the AST contract suite and the renderer suites, which is
  the existing mechanism for that tree.
- The per-file gate (`scripts/check-changed-coverage.js`) is the commit gate; the global
  100 per cent threshold is the cross-check that no test was weakened.

## 5. What is deliberately not tested

- The actual translation wording of the five new locales beyond the pinned Arabic anchors
  and the structural rules. A human reviews wording; the tests refuse a missing key, an
  empty value, a lost placeholder and a wrong digit script.
- `Intl` locale coverage on the device. Unit tests run under Node's full ICU; the design
  isolates device-locale reading to one function (`PROPOSAL.md` §17) so a device
  difference is a one-line swap, not a redesign.
- Visual snapshots. The repo has no snapshot tests (`Snapshots: 0`), and the only intended
  visual change is the removal of the second name.
