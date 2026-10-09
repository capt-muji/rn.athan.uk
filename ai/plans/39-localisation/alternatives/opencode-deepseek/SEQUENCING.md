# Commit-level sequencing

Fourteen commits. Each is independently buildable and each passes `yarn validate` and
the pre-commit gate (`.husky/pre-commit`: identifier scan, lint-staged, validate,
changed-coverage). Each bumps the patch version in `package.json`, `app.json` and
`android/app/build.gradle` together, as the repo law and
`shared/__tests__/versionLockstep.test.ts:58-75` require. The order is forced where a
later commit depends on an earlier contract; that dependency is named per commit.

Baseline for every gate: `yarn validate` is about 43 seconds, 189 suites, 100 per cent
coverage (`PROPOSAL.md` §0).

| # | Commit | Contents | Depends on | Gate that matters |
| --- | --- | --- | --- | --- |
| 1 | `feat(i18n): locales and the English catalog` | `shared/i18n/locales.ts`, `shared/i18n/en.ts`, `shared/i18n/index.ts` with `translate`, `interpolate`, `durationLabels`, `widgetStrings`; tests `i18nLocale`, `i18nTranslate` | none | tsc; unit |
| 2 | `feat(i18n): five catalogs and the catalog guards` | `ar/ms/so/hi/th` catalogs, `CATALOGS`, and `i18nCatalog`, `arabicCatalogPinned`, `i18nDigits` tests | 1 | four suites at 100 per cent |
| 3 | `refactor(prayer): a typed PrayerId, drop the Arabic display name` | `PrayerRow.id`, `prayerIdOf`, `PRAYER_BY_ENGLISH`, `prayerLabel`, `extraExplanation`, all `english`-to-`id` call sites, delete `PRAYERS_ARABIC`/`EXTRAS_ARABIC`/explanations constants and the `arabic` test fixtures | 2 | wide but mechanical; all adapted suites |
| 4 | `feat(language): first-run resolution and persistence` | `stores/language.ts` atoms, `getLanguage`, `setLanguage`, `hooks/useTranslation.ts`, `stores/__tests__/language.test.ts` | 3 | unit; no UI consumer yet |
| 5 | `feat(language): the switch transaction and launch reconcile` | `LanguageSurfaceDeps`, `switchLanguage`, `reconcileLanguageSurfaces`, `stores/languageSurfaces.ts`, `stores/__tests__/languageSwitch.test.ts`; call `reconcile` from `initializeAppState` | 4 | unit; `stores/sync.ts` edited, its suite must stay 100 per cent |
| 6 | `feat(notifications): localized titles under frozen identifiers` | `genNotificationContent`/`genReminderNotificationContent` locale params, `device/notifications.ts` and `stores/notifications.ts` `id` migration, `identifiers.test.ts` added first (red), then green | 3, 5 | identifier goldens; notification suites |
| 7 | `feat(channels): locale-keyed ids and localized names` | channel id builders, configs, `deleteSupersededAndroidChannels`, `androidChannelUpdate` suite | 6 | device channel suite; alarm-safety review |
| 8 | `feat(widgets): localized props and copies` | `widgetTypes` versions 6/2, `strings` on props, `widgetTimeline` locale, `stores/widget.ts` locale and subscription, `widgetLocalisation.test.ts` | 3, 6 | builder suites |
| 9 | `feat(widgets): layouts read localized props with fallback` | `widgets/*.tsx` captions from `props.strings`, contract and renderer suites updated | 8 | AST contract; renderer suites |
| 10 | `feat(ui): localize the primary surfaces` | Settings, Language sheet, Alert, ReminderCard, Sound, Qibla, Countdown, Ago, and the new `Language.test.tsx` | 5 | component suites |
| 11 | `feat(ui): localize the remaining surfaces` | Prayer row (remove bilingual), Explanation, overlayContent/OverlayInfoBox, Day, Error, Update, WhatsNew, Help, `app/index.tsx`, `useNotification` permission dialog | 3, 10 | component suites; `ltrRow` guard |
| 12 | `chore(upgrade): drop the dead Arabic-names preference` | `migrateLocalisation` in `stores/version.ts`, `localisationMigration.test.ts` | 3 | migration suite; upgrade suite |
| 13 | `docs(i18n): the maintainer's add-a-locale runbook` | a short runbook in the code tree (not this folder), listing the four edits and the gates | 2 | docs only |
| 14 | `chore: dates, digits and the final sweep` | `formatDateLong`/`formatHijriDateLong`/`formatTime` locale params, delete `shared/text.ts` and its test, per-locale date tests | 2, 3 | `test:tz` plus the suite |

Two notes on ordering:

- Commit 6's golden test is written first, against the current code, so it is green
  before the refactor and stays green after; that is the "red before green" discipline
  the repo asks for on guarded logic, applied to a contract that must not move.
- Commits 7 and 8 both touch the scheduling surface. They are separate so a channel
  regression is bisectable apart from a title regression, which is the repo's stated
  reason for one concept per commit.

The seven documentation files in this folder are committed as their own commit
(`docs(localisation): the 2.0.0 architecture`) before commit 1, with no version bump,
because they ship no code and the repo's version law exists to keep runtime artefacts in
step. This is the one deliberate departure from "bump on every commit" and it is stated
here so the reviewer can reject it if the law is read strictly.

## Version math

`1.29.304` is the base. The plan targets `2.0.0` as the feature minor at the point the
localisation feature completes, with the intervening commits as patch bumps. Because
concurrent sessions have taken the same number twice, each commit fetches `origin`
before choosing (`ai/AGENTS.md` "Version bump on every commit").
