# Localisation re-architecture for Athan 2.0.0

Planning-only deliverable. No production code is written, changed, or committed on
this branch: this folder holds the architecture, in enough detail that an engineer
can build it without asking a question. Every claim about the current code carries a
`file:line` citation. Costs are measured or explicitly labelled as estimates.

Branch: `arch/39-localisation-opencode-deepseek-20261009` (off `uat`, commit
`9f1c0350`). Runner: opencode-deepseek.

## 0. What was verified for this document

The only commands run against the tree were read-only or baseline gates:

- `git worktree add` off `uat` (`9f1c0350`), then `yarn validate` on the untouched
  worktree. Result: `tsc` clean, Biome clean (385 files), Jest `189 suites / 5252
  passed / 2 skipped`, coverage `100%` statements, branches, functions and lines,
  `43.18s`. This is the cost of the full gate a build session must keep green.
- Every `file:line` below was read from the source on this branch.

The temporary `node_modules` symlink and the draft code files used to reach that
reading have been removed. `git status` is clean.

## 1. Where this architecture differs most from the code

Today the app is bilingual by construction and English-only by accident: a prayer
carries its own Arabic string beside its English one (`shared/types.ts:266-276`), the
row draws both (`components/prayer/Prayer.tsx:88-95`), and every other user-visible
string, notification title, widget caption and Android channel name is an English
literal compiled into the source (`shared/notifications.ts:130,181,452,502`,
`widgets/PrayerWidget.tsx:316-336,493-499`). This design keeps one identity per prayer
(a closed, typed `PrayerId` whose literal values are exactly today's lowercased
English names, because those strings are frozen into OS notification identifiers and
MMKV keys), deletes the second display name, and moves one hundred per cent of
display text into a type-checked catalog of six locales that grows by pure data. The
language becomes first-class state with a durable switch transaction, and the three
surfaces that bake text at schedule or push time (notifications, Android channel
names, widgets) are rebuilt from the catalog under the same deterministic identifiers
so no armed alarm is ever dropped.

## 2. Goals and the non-negotiables, mapped to design

Product facts (2.0.0): one language at a time, chosen in Settings by one row, chevron
and sheet; first run follows the device locale with English fallback; the bilingual
prayer row is removed; every user-visible string renders in the selected language,
including prayer names, notification titles, widget text and month names; six locales
ship first (English, Arabic, Malay, Somali, Hindi, Thai); growing to fifty is pure
data work.

| Non-negotiable | Where it is honoured |
| --- | --- |
| Fully offline after first sync | No new network call. Catalogs are bundled TS (`CATALOGS`, §6). Evidence that the app is offline-first: `stores/sync.ts:274-286`, `api/client.ts`. |
| A scheduled alarm is never missed, orphaned or silently dropped, including across upgrade and language switch | Identifiers never change (§5, §8, §9). The reschedule keeps schedule-first-then-cancel-stale (`stores/notifications.ts:884-959`) and the repair-mark sweep (`stores/notifications.ts:333-390,448-472`). The switch adds a durable applied/requested pair and a launch reconcile (`UPGRADE-AND-RECOVERY.md`). |
| Stored alert preferences and armed OS identifiers survive 2.0.0 byte-for-byte | Storage keys and identifier bodies are unchanged (§5, `DATA-AND-IDENTIFIERS.md`). `preference_` is already a keep prefix (`stores/version.ts:151`); `CACHE_SCHEMA_VERSION` does not move (`stores/version.ts:135`). |
| Prayer row layout frozen: names left, time centre, alert icons right, 57px, never mirrored, left-aligned in every language | `STYLES.prayer.height = 57` (`shared/constants.ts:982-996`) is untouched; the row renders one name in the same left slot (`components/prayer/Prayer.tsx:88-95`). An explicit `direction: 'ltr'` and a guard test keep it unmirrored (§7). |
| Digits stay Latin in every language at 2.0.0 | Every formatter passes `numberingSystem: 'latn'`; the digit-substitution helper is deleted (§6, `shared/text.ts:25-27`). A test asserts ASCII digits for all six locales. |
| The 99 audio files never change | Filenames are derived from the stable identity only (`shared/notifications.ts:147,380,387,396`); no audio is renamed or re-encoded (§5). |
| A solo maintainer runs everything, no translation staff | Catalogs are TS objects with compile-time key parity; adding a locale is one file plus two lines (§6, §10). |
| Widget layouts may not import libraries | Widget text is baked into pushed props, not resolved at render (`shared/widgetTypes.ts:62-118`, §8). |

## 3. How the code works today (evidence)

The load-bearing facts, each cited:

- The prayer row is a `type`, a stable English name, a parallel Arabic name and a
  `belongsToDate`; readable rows add `datetime`/`time`
  (`shared/types.ts:266-307`).
- The six API times are a closed union of strings (`shared/types.ts:74`); derived
  extras are `suhoor`, `duha`, `istijaba` (`shared/types.ts:108-122`).
- Prayer times are stored one JSON record per calendar day under `prayer_YYYY-MM-DD`
  (`stores/database.ts:136-160`); the record has no prayer names, only times
  (`shared/types.ts:108-122`).
- The stable identity today is the English name, lowercased, in four places:
  preference keys `preference_alert_{standard|extra}_{name.toLowerCase()}`
  (`stores/notifications.ts:203-208,253-261,273-281`); OS at-time identifiers
  `athan_{schedule}_{name.toLowerCase()}_{date}` (`device/notifications.ts:49-50`);
  OS reminder identifiers `reminder_{schedule}_{name.toLowerCase()}_{date}_{interval}`
  (`device/notifications.ts:61-66`); and audio slugs `name.toLowerCase()` with spaces
  to underscores (`shared/notifications.ts:147,154-163`). A name such as `Last Third`
  therefore appears with a literal space in keys and identifiers, and as
  `last_third` only in `res/raw`.
- Notification record keys are `scheduled_notifications_{schedule}_{prayerIndex}_{id}`
  (`stores/database.ts:188-198`) and `scheduled_reminders_...`
  (`stores/database.ts:253-263`); each record carries `englishName`, `arabicName`,
  `time`, `date`, `alertType` (`shared/notifications.ts:17-24`).
- Notification titles are English literals built at schedule time:
  `` `${englishName} now` `` (`shared/notifications.ts:130`) and
  `` `${englishName} in ${intervalMinutes}m` `` (`shared/notifications.ts:181`).
  The Arabic name parameter is already ignored (`shared/notifications.ts:123-138,174-189`).
- Android channel names, sounds, importance and audio attributes are immutable once
  created; the code encodes its own proof in `_v4`/`_v3` generations
  (`shared/notifications.ts:374-390,409-417,445-463,492-514`) and deletes superseded
  generations (`shared/notifications.ts:516-552`).
- iOS widget text is baked from the builder: `nextName` and each row `name` come from
  `prayer.english` (`shared/widgetTimeline.ts:133-138,188-195,247-251,303`), and the
  layouts hold fixed English captions (`widgets/PrayerWidget.tsx:316-336,493-499`;
  `widgets/LockPrayerWidget.tsx:60,73-76,97,112-115,140`).
- The Android widget is a snapshot rendered at render time; row `name` is a string
  (`shared/widgetTypes.ts:127-147`), so it too is baked by the push
  (`shared/widgetTimeline.ts:277-320`).
- Dates are `date-fns` format strings with hardcoded English month tokens
  (`shared/time.ts:229-233`) and an `en-US` Hijri `Intl` formatter
  (`shared/time.ts:241-254`). Countdown units are hardcoded `h/m/s` and `now`
  (`shared/time.ts:528-549,564-574`).
- The bilingual row is gated by `showArabicNamesAtom`
  (`stores/ui.ts:131-132`, `components/prayer/Prayer.tsx:36,91-93`) and a Settings
  toggle (`components/sheets/screens/Settings.tsx:37,129-132`). Extra-prayer
  explanations render English and Arabic beside each other
  (`components/overlay/overlayContent.ts:51-59`, `components/prayer/Explanation.tsx:77-80`)
  and the Arabic digits are substituted by `toArabicNumbers` (`shared/text.ts:25-27`).
- The upgrade path wipes only on a shape change (`stores/version.ts:135,258-263`) and
  keeps `preference_` (`stores/version.ts:144-156`); it always forces a reschedule
  (`stores/version.ts:194-201,261-263`). The cache swap keeps the same prefixes and
  the notification records (`stores/sync.ts:357-371`).
- The gates: `yarn validate` is `tsc && biome && jest --coverage` (`package.json`),
  global coverage thresholds are 100 per cent (`jest.config.js:131-138`), a per-file
  gate refuses a commit whose changed source is not fully covered
  (`scripts/check-changed-coverage.js`), `widgets/` is deliberately unmeasured
  (`scripts/check-changed-coverage.js:38-41`), version lockstep is tested
  (`shared/__tests__/versionLockstep.test.ts:58-75`), and no export may be unreachable
  from production (`shared/__tests__/unusedExports.test.ts:39-53`).

## 4. Architecture overview

New units (names are final):

```
shared/i18n/
  locales.ts     LocaleCode, LOCALE_CODES, LOCALE_META, isLocaleCode, resolveDeviceLanguage
  en.ts          the English catalog, TranslationKey, Catalog
  ar.ts ms.ts so.ts th.ts   one catalog each, typed Catalog
  index.ts       CATALOGS, translate, interpolate, PrayerId, PRAYER_IDS, prayerIdOf,
                 prayerLabel, EXTRA_EXPLANATION_KEY, extraExplanation,
                 durationLabels, widgetStrings, WidgetStrings
shared/time.ts            locale-aware date/time formatters (edited, not new)
stores/language.ts        languageAtom, getLanguage, resolveOnFirstRun,
                          languageAppliedAtom, isLanguageApplied, markLanguageApplied,
                          applyLanguageSurfaces, reconcileLanguageSurfaces
hooks/useTranslation.ts   useTranslation()
```

Edited units, with the reason: prayer domain (`shared/types.ts`, `shared/prayer.ts`),
notifications (`shared/notifications.ts`, `device/notifications.ts`,
`stores/notifications.ts`), channels (`shared/notifications.ts`), widgets
(`shared/widgetTypes.ts`, `shared/widgetTimeline.ts`, `stores/widget.ts`,
`widgets/*.tsx`), UI surfaces (`components/**`, `app/**`, `hooks/**`), storage and
upgrade (`stores/version.ts`, `stores/ui.ts`), and the Settings sheet.

Dependency direction (no new cycles):

```
shared/i18n  <-  stores/language  <-  hooks/useTranslation, stores/notifications,
                                     stores/widget, components/**, app/**
shared/i18n  <-  shared/time, shared/prayer, shared/help, shared/whatsnew
stores/notifications  <-  stores/languageSurfaces logic in stores/language (deps injected)
```

`stores/language.ts` imports only `shared/i18n` and `stores/storage`. The OS-facing
work (reschedule, channel rebuild, widget push) is injected into
`applyLanguageSurfaces` by the caller, mirroring the dependency injection already used
by `initializeNotifications` (`shared/notifications.ts:562-566`). This deliberately
avoids introducing a `stores/language -> stores/notifications` import, which would add
a third edge to the existing `stores/notifications <-> stores/sync` cycle
(`stores/notifications.ts:39`, `stores/sync.ts:17`).

Module contracts, signatures and exact data shapes are in `MODULE-CONTRACTS.md`.

## 5. Prayer domain model and identifiers

The central decision: **English stays the permanent identity, now as a closed type.**
A new `PrayerId` is a union of eleven literals whose values are exactly today's
lowercased English names:

```
'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'magrib' | 'isha'
      | 'midnight' | 'last third' | 'suhoor' | 'duha' | 'istijaba'
```

The two with a space (`'last third'`) keep it, because that literal is already inside
frozen preference keys and notification identifiers (`stores/notifications.ts:207`,
`device/notifications.ts:50`). `prayerIdOf(english)` is the one boundary that converts
a stored or literal `string` to the union; every other consumer holds the union.

`PrayerRow` changes from `{ type, english: string, arabic: string, belongsToDate }`
(`shared/types.ts:266-276`) to `{ type, id: PrayerId, belongsToDate }`. The `arabic`
field is deleted from the model. This is safe for storage because no `Prayer` object
is persisted (only `prayer_YYYY-MM-DD` time records, `stores/database.ts:136-145`, and
notification records whose own `englishName` string is unchanged,
`shared/notifications.ts:17-24`). Display resolves `prayerLabel(locale, id)` from the
catalog; the Arabic catalog's prayer names are pinned by a test to the values that
used to live in `PRAYERS_ARABIC`/`EXTRAS_ARABIC` (`shared/constants.ts:15,32`), so the
translation cannot silently drift.

Identifiers are frozen byte-for-byte:

| Identifier | Shape | Source today | Change |
| --- | --- | --- | --- |
| At-time OS id | `athan_{schedule}_{id}_{YYYY-MM-DD}` | `device/notifications.ts:49-50` | none |
| Reminder OS id | `reminder_{schedule}_{id}_{YYYY-MM-DD}_{interval}` | `device/notifications.ts:61-66` | none |
| Alert pref key | `preference_alert_{standard\|extra}_{id}` | `stores/notifications.ts:207` | none |
| Reminder alert key | `preference_reminder_alert_{standard\|extra}_{id}[_{2}]` | `stores/notifications.ts:241,258` | none |
| Reminder interval key | `preference_reminder_interval_{standard\|extra}_{id}[_{2}]` | `stores/notifications.ts:241,278` | none |
| Notification record key | `scheduled_notifications_{schedule}_{index}_{id}` | `stores/database.ts:193` | none |
| Reminder record key | `scheduled_reminders_{schedule}_{index}_{id}` | `stores/database.ts:258` | none |
| Athan audio | `athan{n}.mp3` | `shared/notifications.ts:116` | none |
| Reminder audio | `reminder_{id_spaces_to_underscores}_{interval}.mp3` | `shared/notifications.ts:147,161-162` | none |

A golden test (`shared/__tests__/identifiers.test.ts`) pins a representative set of
identifier strings and storage keys so a future refactor of the identity type cannot
move a byte. The full table, including the record `englishName` field and the channel
ids, is in `DATA-AND-IDENTIFIERS.md`.

## 6. String catalog system

A catalog is a flat object of `message.id` to string. English is the source of truth
and defines the key type (`shared/i18n/en.ts`):

```ts
export const en = { 'settings.title': 'Settings', /* ... */ } as const;
export type TranslationKey = keyof typeof en;
export type Catalog = Record<TranslationKey, string>;
```

Every other locale is `const ar: Catalog = { ... }`. Type safety is the compiler's:
a missing key is an error (the object is short of the record type) and an invented key
is an error (excess property check on the literal). No runtime schema is needed for
key parity, though a test asserts parity anyway for a friendlier failure and to refuse
empty strings.

Resolution:

```ts
translate(locale, key, params?)            // pure; interpolates {name}, {n}, {platform}
useTranslation(): { locale, t }            // React, subscribes to languageAtom
```

`translate` reads `CATALOGS[locale][key]` and replaces `{token}` placeholders
(`interpolate`). Nothing is fetched: the six catalogs are in the bundle.

Prayer labels and extra explanations are catalog entries addressed by identity, not by
position: `prayerLabel(locale, id)` uses `PRAYER_LABEL_KEY: Record<PrayerId, TranslationKey>`
and `extraExplanation(locale, id)` uses `EXTRA_EXPLANATION_KEY`. A test asserts both
maps cover every `PrayerId` in every catalog.

Dates and durations keep Latin digits by construction:

- `formatDateLong(date, locale)` and `formatHijriDateLong(date, locale)` build
  `Intl.DateTimeFormat(LOCALE_META[locale].intlLocale, { ..., numberingSystem: 'latn' })`.
  English keeps `en-GB` so its output matches today's `EEE, d MMM yyyy`
  (`shared/time.ts:232`); this is asserted by the existing date tests, adapted.
- `formatTime`/`formatTimeAgo` take a `DurationLabels` object
  (`{ hours, minutes, seconds, now }`) from `durationLabels(locale)`; the default stays
  English so the pure-function tests (`shared/__tests__/time.test.ts`, which pins every
  JSDoc example at `shared/time.ts:516-526`) keep passing unchanged.
- `toArabicNumbers` (`shared/text.ts:25-27`) and its test are deleted; a guard test
  asserts no formatter produces Arabic-Indic digits for any shipped locale.

Production and gating: `bun`/CI has no translation staff, so the gates are the
compiler plus tests. The gating tests are enumerated in `TEST-PLAN.md`:

1. Key parity and non-empty for every locale (runtime twin of the compiler check).
2. Locale registry matches the catalog files on disk (a new file that nobody
   registered, or a registered locale with no file, both fail).
3. Every `PrayerId` and every extra explanation has a key in every catalog.
4. Digits are Latin for every locale.
5. The Arabic prayer names equal the historical constants.
6. No catalog value is referenced by key position; keys are the interface.

Adding a locale (pure data): append the code to `LOCALE_CODES`
(`shared/i18n/locales.ts:11`), add its `LOCALE_META` row (`shared/i18n/locales.ts:31`),
add `<code>.ts` typed `Catalog`, and add it to `CATALOGS`. One file and a list entry;
tests 1 to 5 then cover it. Costs: a catalog of about 110 keys.

## 7. Language state, first-run detection, switch transaction

State (keys under `preference_`, so every existing wipe keeps them,
`stores/version.ts:151`):

| Key | Type | Meaning |
| --- | --- | --- |
| `preference_language` | string (`LocaleCode`) | The language the UI renders |
| `preference_language_chosen` | boolean | True once the user picked in Settings |
| `preference_language_applied` | string (`LocaleCode`) | The language the OS surfaces last rendered |

First-run detection is the absence of `preference_language`, not a version compare, so
a fresh install and a 1.x upgrade take the same path. The default is computed once at
module evaluation:

```ts
const deviceLanguage = resolveDeviceLanguage(Intl.DateTimeFormat().resolvedOptions().locale);
export const languageAtom = atomWithStorageString('preference_language', deviceLanguage);
```

`resolveDeviceLanguage` (`shared/i18n/locales.ts`) reads only the language subtag, so
`ar-EG`, `ar-SA` and bare `ar` all map to Arabic and an unshipped language maps to
English. When `preference_language_chosen` is false, the launch path re-resolves the
device locale and writes only if it changed; once the user chooses, storage wins
forever. Reading the atom never writes during render: the initial value already
resolved from the device, so `useTranslation` is a pure subscription.

The switch transaction is a durable requested/applied pair, because the work it
describes (OS scheduling, channel recreation, widget push) cannot be made atomic:

1. `setLanguage(next)`: through the atom, write `preference_language = next` and
   `preference_language_chosen = true`. This is the commit point; the UI re-renders
   immediately because every component subscribes to `languageAtom`.
2. `applyLanguageSurfaces(next, deps)`: rebuild Android channels under the new
   locale-keyed ids, run a full notification reschedule, push both widget timelines.
3. On success of 2, write `preference_language_applied = next`.

Crash or failure between 1 and 3 leaves `applied != requested` on disk. Every launch
calls `reconcileLanguageSurfaces(deps)` from `initializeAppState`
(`stores/sync.ts:234-261`), which reruns 2 and 3 when they differ. This makes the
switch idempotent and crash-safe without a journal table: the mismatch itself is the
journal.

Alarm safety through the switch does not depend on the transaction. The OS identifiers
are identical before and after (§5), so the reschedule is an in-place replace under
deterministic ids (`device/notifications.ts:44-50`), the arming path is
schedule-first-then-cancel-stale (`stores/notifications.ts:884-959`), and any refusal
is recorded as a repair mark (`stores/notifications.ts:333-390`) for the sweep. A
switch can therefore never leave fewer armed alarms than before; at worst it leaves
titles in the previous language until the retry, which the reconcile guarantees.

Failure modes and their recoveries are tabulated in `UPGRADE-AND-RECOVERY.md`.

Row direction: the layout is frozen LTR (`§2`). The design forces
`direction: 'ltr'` on the row container and asserts in a test that no styled
`flexDirection: 'row-reverse'` or `I18nManager` call exists in the row, so an
Arabic device cannot mirror the frozen layout.

## 8. Surfaces that bake language

Three surfaces capture text at a moment, not at render: notifications, Android
channels, widgets. Each is rebuilt from the catalog by `applyLanguageSurfaces`.

- Notifications. `genNotificationContent` and `genReminderNotificationContent`
  (`shared/notifications.ts:123-138,174-189`) take the locale and build the title with
  `translate`: `notification.now` = `{name} now`, `notification.reminder` =
  `{name} in {n}m`, `{name}` from `prayerLabel(locale, id)`. The identifiers and the
  sound selection are unchanged. The caller in `device/notifications.ts:82-137,212-255`
  passes the locale. Rescheduling under the same ids localises every pending alarm in
  place.
- Android channels. Channel id gains the locale: `athan_{n}_v5_{locale}`,
  `reminder_{slug}_{interval}_v5_{locale}`, `extras_at_time_v5_{locale}`; channel
  names come from the catalog (`shared/notifications.ts:409-417,445-463,492-514`). A
  language switch uses new ids (Android cannot rename a channel), and
  `deleteLegacyAndroidAudioChannels` (`shared/notifications.ts:516-552`) is extended to
  delete every prior generation plus the current-generation ids for every other shipped
  locale, enumerated from `LOCALE_CODES`. Ordering matters and is specified: the
  reschedule targets the new ids first (schedule-first-then-cancel-stale), then the old
  channels are deleted, exactly as the existing init already deletes legacy channels
  before the reschedule (`shared/notifications.ts:570-577`) and relies on the Android
  fallback channel for the transient window.
- Widgets. `PrayerWidgetSettings` gains `locale`; `readWidgetSettings`
  (`stores/widget.ts:84-90`) reads `getLanguage()`; `initWidgetSettingsSync`
  (`stores/widget.ts:124-140`) subscribes to `languageAtom` so a switch re-pushes after
  the one-second debounce. The timeline and snapshot builders (`shared/widgetTimeline.ts:161-197,277-320`)
  bake `prayerLabel(locale, id)`, locale-aware `dateLabel`, and a new `strings` object
  of the fixed captions (`WidgetStrings`). `WIDGET_PROPS_VERSION` moves 5 to 6 and
  `ANDROID_SNAPSHOT_VERSION` 1 to 2 (`shared/widgetTypes.ts:14,21`); the layouts read
  `props.strings?.x ?? 'default'` so an entry written by an older app still renders
  (the cross-release tolerance `v` exists for, `shared/widgetTypes.ts:9-14`). The
  layouts gain no import: `strings` is a prop field, which the widget contract test
  permits because `props` is a parameter (`shared/__tests__/widgetContract.test.ts:94-144`).

Because the widget layouts sit in the unmeasured `widgets/` tree
(`scripts/check-changed-coverage.js:38-41`), their changes are guarded by the AST
contract test and the renderer suites rather than line coverage (`TEST-PLAN.md`).

## 9. Upgrade path from 1.x

The upgrade is deliberately small because the shape of cached data does not change:

- `CACHE_SCHEMA_VERSION` stays 1 (`stores/version.ts:135`), so
  `handleAppUpgrade` does not wipe (`stores/version.ts:258-263`). The timetable and
  the armed alarms survive an update that installs overnight.
- `preference_` is already a keep prefix (`stores/version.ts:144-156`), so alert
  preferences, the sound choice and the new language keys survive even a forced wipe.
- `handleAppUpgrade` already forces one reschedule on a version change
  (`stores/version.ts:194-201,261-263`). After localisation, that reschedule renders
  the resolved language because the language is resolved at module evaluation, before
  `initializeNotifications` runs (`app/index.tsx:102-118`).
- A one-time migration `migrateLocalisation(storedVersion)` runs inside
  `handleAppUpgrade` beside `migrateIndexKeyedAlertPreferences`
  (`stores/version.ts:289`). It removes the now-dead `preference_show_arabic_names`
  key (`stores/ui.ts:132`); it writes nothing else. It never touches
  `scheduled_notifications_*` or `scheduled_reminders_*`, and it does not move any
  identifier.
- If `preference_language_applied` is absent or differs, the launch reconcile (§7)
  applies the language to the OS surfaces. For an upgrading user this is the first
  launch with the new build.
- Widgets are re-pushed on the launch path (`stores/sync.ts:250-260`,
  `stores/widget.ts:167-256`) with the resolved locale.

Migration, storage-key and identifier details are in `UPGRADE-AND-RECOVERY.md` and
`DATA-AND-IDENTIFIERS.md`.

## 10. Test strategy

The strategy has three layers, sized to the gates.

- Compile-time: the `Catalog` type is the first gate. A catalog missing or inventing a
  key fails `tsc`, which the author already runs.
- Runtime guards (unit project, `*.test.ts`): catalog parity and non-empty; registry
  versus disk; prayer-label and explanation coverage; Latin-digit policy; Arabic
  prayer names equal the historical constants; locale resolution table; interpolation;
  identifier and storage-key goldens; the switch transaction and reconcile state
  machine against fake dependencies; the upgrade migration; widget timeline/snapshot
  strings; per-locale date and duration formatting.
- Component project (`*.test.tsx`): the language sheet renders endonyms and commits a
  switch; the prayer row renders one localized name and never two; Settings shows a
  Language row and no "Show arabic names"; Day, Countdown, Ago and Explanation render
  under a set locale; the modals render localized under `ar`; the widget renderer
  suites read the baked strings.

Coverage discipline: the global threshold is 100 per cent (`jest.config.js:131-138`)
and the per-file gate refuses partially covered changed source
(`scripts/check-changed-coverage.js`), so every new pure module is tested to 100 per
cent and every edited component keeps its existing suite at 100 per cent. The changes
skew toward removing branches (deleting the bilingual row and the digit substitution),
which reduces coverage risk. `widgets/` stays unmeasured and AST-guarded. Every test is
in `TEST-PLAN.md`, including which existing suites must be adapted and why.

## 11. Failure modes and recovery

The full matrix is in `UPGRADE-AND-RECOVERY.md`. The load-bearing rows:

| Failure | Effect without design care | Design response |
| --- | --- | --- |
| Process death after the language commit, before scheduling | UI in the new language, alarms in the old | Durable `applied != requested`; launch reconcile |
| A scheduling call refused mid-switch | An alarm possibly unlocalised, never dropped | Identifiers unchanged; repair marks; sweep |
| Android channel deleted while an alarm references it | Alarm fires on the fallback channel | Reschedule to the new ids before delete; delete happens at init where the existing code already accepts the transient |
| Corrupt stored locale | Crash or blank UI | `isLocaleCode` guard falls back to the device locale then English |
| Device locale unshipped | Wrong language | `resolveDeviceLanguage` returns English |
| `Intl` unsupported at runtime | Formatters throw | The Hijri formatter already has a Gregorian fallback (`shared/time.ts:251-253`); the Gregorian formatter is a documented fallback path with a test |
| A prayer has no readable time | A localised title for an alarm that must not fire | Existing skip remains (`stores/notifications.ts:847-850`); nothing new |

## 12. Effort and risk

Estimates in engineer-days for the solo maintainer, assuming the existing gate stays
green throughout. Baseline gate cost is measured: full `yarn validate` is about 43
seconds (`§0`), so a build session pays under a minute per full run plus the local
`jest --findRelatedTests`.

| Workstream | Days | Risk | Notes |
| --- | --- | --- | --- |
| `shared/i18n` core plus six catalogs plus guards | 2.5 | low | Content is the bulk; the type system catches key errors |
| Domain model change (`PrayerId`, drop `arabic`) and test adaptation | 2.0 | medium | Mechanical, wide; the 40-odd test files touching `arabic` are the cost |
| Language state, switch transaction, reconcile | 1.5 | medium | New state machine; needs careful fake-dependency tests |
| Notification and channel localisation | 1.5 | high | Channel immutability and delete ordering; alarm safety |
| Widget localisation (props, layouts, versions, suites) | 2.0 | medium | AST contract plus renderer suites |
| UI localisation across components, app and modals | 3.0 | medium | Mostly literal replacements; coverage of edited files |
| Upgrade migration and version bumps per commit | 0.5 | low | Small, well-bounded |
| Documentation and review per step | 1.0 | low | Repo law |
| Total | about 14 | | Excludes store submission |

The numbers are estimates; the only measured cost above is the gate runtime.

## 13. The three riskiest decisions

1. **Keep English as the permanent identity, typed, rather than move to opaque ids.**
   The identifiers and preference keys already embed the lowercased English name
   (`device/notifications.ts:50`, `stores/notifications.ts:207`), and the hard
   constraint is that armed identifiers survive byte-for-byte. Opaque ids would force a
   migration that rewrites live identifiers, which is exactly the operation capable of
   orphaning an alarm. The cost is that one English string is load-bearing forever; the
   `PrayerId` union constrains it so it cannot become free-form, and the golden tests
   pin the bytes.
2. **Locale-keyed Android channel ids with delete-after-reschedule.** Android channel
   names are immutable (`shared/notifications.ts:374-390`), and the product requires
   channel names to follow the language, so a switch must create new ids. The risk is
   the transient window where an alarm references a deleted channel; the mitigation is
   ordering (reschedule to the new ids first), the Android fallback channel (the alarm
   still fires), and the repair sweep. The alternative, freezing channel names in
   English, fails the product requirement.
3. **A durable requested/applied language pair as the recovery mechanism.** A language
   switch edits OS state that cannot be updated atomically with MMKV, so a single write
   cannot be enough. The pair makes an interrupted switch self-describing and makes the
   retry a no-op when it completed, at the cost of one extra reschedule after a crash
   and a reconcile call on every launch. The alternative, best-effort without a marker,
   can leave a phone with a new-language UI and old-language alarms indefinitely.

## 14. The from-scratch ideal, constraints ignored

If the frozen-identifier and single-maintainer constraints did not exist, the design
would look different, and it is worth naming so the constraints are visible:

- Opaque `PrayerId` values decoupled from any language, with localized names as pure
  data and a one-time rename of identifiers under a controlled migration window.
- A real message-format library (ICU MessageFormat or `FormatJS`) with plural and
  gender rules, rather than `{token}` interpolation, because Hindi, Arabic and Thai
  pluralise differently.
- Bundled per-locale fonts and full RTL for Arabic, rather than forcing LTR and
  relying on system font fallback.
- Server-delivered, versioned catalogs and a translation pipeline, rather than six
  hand-written TS files, once the count reaches the tens.
- Per-locale calendars and numerals where the product wants them, which 2.0.0
  explicitly does not.
- A formal localisation database of record (a `.po` or `.arb` format) with a
  pseudo-locale and screenshot tests per locale.

Each is rejected here because it adds a dependency, a network surface, or a migration
window, and the product chose determinism, offline behaviour and a solo maintainer over
those.

## 15. What is kept because it is already right, and what is torn out

Kept, unchanged: the prayer-centric sequence model and its rules
(`stores/schedule.ts`, `shared/sequence.ts`); deterministic identifiers and
schedule-first-then-cancel-stale (`stores/notifications.ts:884-959`); the repair-mark
and sweep machinery (`stores/notifications.ts:333-390,448-472`); the storage keys and
the `preference_` keep prefix (`stores/version.ts:151`); `PRAYER_TIMEZONE` as the one
place a city changes (`shared/constants.ts:258`); the widget timeline builder and its
boundary-only shape (`shared/widgetTimeline.ts:1-29`); the 64-request budget planner
(`shared/notifications.ts:268-284`); the icon-set and storybook-free component
structure.

Torn out: the parallel Arabic name in the model (`shared/types.ts:272`) as a display
source; the bilingual row and its setting (`stores/ui.ts:131-132`,
`components/prayer/Prayer.tsx:91-93`, `components/sheets/screens/Settings.tsx:129-132`);
the Arabic half of the explanation box
(`components/overlay/overlayContent.ts:58`, `components/prayer/Explanation.tsx:80`);
`toArabicNumbers` (`shared/text.ts:25-27`); every hardcoded user-visible string across
the surfaces (citations in `SURFACES.md`); and the accidental assumption that display
text is English.

## 16. Commit-level sequencing

Fourteen commits, each green, each bumping the patch version in `package.json`,
`app.json` and `android/app/build.gradle` as the repo law requires. The full plan, with
the gate each commit must pass and why the order is forced, is in `SEQUENCING.md`.
Summary: i18n core and catalogs; catalog guards; `PrayerId` and model; language state;
switch transaction and reconcile; notification titles; channel ids and names; widget
types and builder; widget layouts and suites; UI surfaces part one and two; upgrade
migration; version and documentation.

## 17. Assumptions and open questions

- Device locale source: the design reads
  `Intl.DateTimeFormat().resolvedOptions().locale`. If a device build shows this
  always returns `en-US` under Hermes, the fallback is the platform locale via
  `NativeModules.SettingsManager` (iOS) and `I18nManager.localeIdentifier` (Android),
  behind the same `resolveDeviceLanguage` boundary. This is the single unverified
  runtime behaviour in the design; it is isolated to one function so it can be swapped
  without touching a caller.
- `Intl.formatToParts` is assumed available; the Hijri formatter already depends on
  `Intl.DateTimeFormat` (`shared/time.ts:243`), and the era-suffix stripping uses
  `formatToParts`.
- The channel-name requirement is read as "the names Android shows in Settings", which
  is the only user-visible channel surface.
- The only visual change intended is the removal of the second name in the row, which
  is the requirement itself; no colour, spacing, size or animation changes.

## Appendices

- `MODULE-CONTRACTS.md` - every module, signature, type and data shape.
- `DATA-AND-IDENTIFIERS.md` - storage keys, identifiers, audio, channel ids, shapes.
- `SURFACES.md` - notifications, channels and widgets, string by string.
- `UPGRADE-AND-RECOVERY.md` - migration steps and the failure-mode matrix.
- `TEST-PLAN.md` - every test, its purpose, and the existing suites it adapts.
- `SEQUENCING.md` - the fourteen commits and their gates.
- `EVIDENCE.md` - the reading log and the measured baseline.
