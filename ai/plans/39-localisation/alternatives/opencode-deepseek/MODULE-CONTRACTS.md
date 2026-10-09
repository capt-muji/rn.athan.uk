# Module contracts

Every module the localisation re-architecture adds or edits, with exact signatures,
data shapes, invariants and the existing code it touches. Signatures are TypeScript;
`readonly` and `const` are shown where the design requires them. An engineer can build
from this file alone.

Conventions used: `LocaleCode` and `PrayerId` are the two closed unions; `store` means
`getDefaultStore()` from `jotai` unless stated; "catalog key" is a `TranslationKey`.

---

## 1. `shared/i18n/locales.ts` (new)

```ts
export const LOCALE_CODES = ['en', 'ar', 'ms', 'so', 'hi', 'th'] as const;
export type LocaleCode = (typeof LOCALE_CODES)[number];

export interface LocaleMeta {
  readonly endonym: string;   // the language's own name, its own script
  readonly englishName: string;
  readonly intlLocale: string; // tag handed to Intl; English is 'en-GB'
}

export const LOCALE_META: Record<LocaleCode, LocaleMeta>;

export const isLocaleCode = (value: string): value is LocaleCode;
export const resolveDeviceLanguage = (rawLocale: string | null | undefined): LocaleCode;
```

Invariants:

- `LOCALE_CODES` order is the order the Settings sheet lists languages.
- `LOCALE_META.en.intlLocale === 'en-GB'` so Gregorian output matches the current
  `EEE, d MMM yyyy` (`shared/time.ts:232`).
- `resolveDeviceLanguage` reads only the language subtag: lower-case, `_` to `-`, split
  on `-`, take `[0]`; return it when `isLocaleCode`, else `'en'`. `null`/`undefined`
  returns `'en'`.

Evidence for the device-locale fallback shape: the app already relies on `Intl` for
calendar reads (`shared/time.ts:25-34,241-254`), so the same API is the lowest-cost
source; the platform alternatives are named in `PROPOSAL.md` §17.

---

## 2. `shared/i18n/en.ts` (new, source of truth)

```ts
export const en = { /* about 110 'namespace.key': 'string' entries */ } as const;
export type TranslationKey = keyof typeof en;
export type Catalog = Record<TranslationKey, string>;
```

The full key list is `SURFACES.md` §7 and `TEST-PLAN.md` §1. Two invariants:

- Every value is non-empty after trim; a test enforces this.
- Interpolation placeholders are `{name}`, `{n}`, `{platform}`; no other brace syntax.

---

## 3. `shared/i18n/{ar,ms,so,hi,th}.ts` (new, one per locale)

```ts
import type { Catalog } from '@/shared/i18n/en';
export const ar: Catalog = { /* same keys as en */ };
```

Compile-time gate: missing key or extra key is a `tsc` error (record type plus excess
property check on the object literal). Runtime gates are in `TEST-PLAN.md` §2.

The Arabic prayer names equal the values that ship today in `PRAYERS_ARABIC` and
`EXTRAS_ARABIC` (`shared/constants.ts:15,32`); a test pins that equality so the
translation cannot drift from the historical data.

---

## 4. `shared/i18n/index.ts` (new)

```ts
import type { Catalog, TranslationKey } from '@/shared/i18n/en';
import type { LocaleCode } from '@/shared/i18n/locales';

export interface TranslationParams { readonly [name: string]: string | number }

export const CATALOGS: Record<LocaleCode, Catalog>;

export const interpolate = (template: string, params?: TranslationParams): string;
export const translate = (locale: LocaleCode, key: TranslationKey, params?: TranslationParams): string;

export const PRAYER_IDS: readonly PrayerId[];
export type PrayerId = (typeof PRAYER_IDS)[number];

export const PRAYER_LABEL_KEY: Record<PrayerId, TranslationKey>;
export const PRAYER_BY_ENGLISH: Readonly<Record<string, PrayerId>>;
export const prayerIdOf = (english: string): PrayerId | null;
export const prayerLabel = (locale: LocaleCode, id: PrayerId): string;

export const EXTRA_EXPLANATION_KEY: Readonly<Record<string, TranslationKey>>;
export const extraExplanation = (locale: LocaleCode, id: PrayerId): string | null;

export interface DurationLabels { readonly hours: string; readonly minutes: string; readonly seconds: string; readonly now: string }
export const durationLabels = (locale: LocaleCode): DurationLabels;

export interface WidgetStrings {
  readonly neutralTitle: string;
  readonly neutralSubtitle: string;
  readonly openToLoad: string;
  readonly staleTitle: string;
  readonly staleRefresh: string;
  readonly staleOpen: string;
  readonly staleToRefresh: string;
  readonly refreshLine: string;
  readonly inlineNeutral: string;
  readonly inlineStale: string;
  readonly brandUpper: string;
}
export const widgetStrings = (locale: LocaleCode): WidgetStrings;
```

`PRAYER_IDS` literal values, in order, exactly:

```
'fajr' 'sunrise' 'dhuhr' 'asr' 'magrib' 'isha'
'midnight' 'last third' 'suhoor' 'duha' 'istijaba'
```

The literal `'last third'` carries a space because that exact string is already inside
live preference keys (`stores/notifications.ts:207`) and notification identifiers
(`device/notifications.ts:50`). `PRAYER_LABEL_KEY` maps each to `prayer.<id>`.
`EXTRA_EXPLANATION_KEY` maps the five extras to `extra.explanation.<id>`; the six daily
prayers are absent, so `extraExplanation` returns `null` for them.

`interpolate` replaces `/\{(\w+)\}/g`; an unknown placeholder is left verbatim; a
`number` is stringified with `String(value)` (Latin digits, because the source number is
rendered by JS, not by a locale-aware formatter).

---

## 5. `hooks/useTranslation.ts` (new)

```ts
export interface Translation {
  readonly locale: LocaleCode;
  readonly t: (key: TranslationKey, params?: TranslationParams) => string;
}
export const useTranslation = (): Translation;
```

Implementation: `const locale = useAtomValue(localeAtom); return useMemo(() => ({ locale, t: (key, params) => translate(locale, key, params) }), [locale]);`.
Subscribes to `localeAtom` (`stores/language.ts`), so a language switch re-renders every
consumer. No write during render.

---

## 6. `stores/language.ts` (new)

```ts
import type { LocaleCode } from '@/shared/i18n/locales';

export const languageAtom: WritableAtom<string, [string | typeof RESET], void>; // 'preference_language'
export const localeAtom: Atom<LocaleCode>;

export const getLanguage = (): LocaleCode;
export const setLanguage = (next: LocaleCode): void; // commits requested + chosen

export interface LanguageSurfaceDeps {
  readonly rescheduleNotifications: () => Promise<void>;
  readonly refreshWidgets: () => Promise<void>;
  readonly deleteSupersededChannels: (locale: LocaleCode) => Promise<void>;
}

export const switchLanguage = (next: LocaleCode, deps: LanguageSurfaceDeps): Promise<void>;
export const reconcileLanguageSurfaces = (deps: LanguageSurfaceDeps): Promise<void>;
```

Storage keys and types:

| Key | Atom | Initial | Notes |
| --- | --- | --- | --- |
| `preference_language` | `languageAtom` | resolved device language | a `LocaleCode` string |
| `preference_language_chosen` | `languageChosenAtom` | `false` | true once the user picks |
| `preference_language_applied` | `languageAppliedAtom` | `''` | the language the OS surfaces last rendered |

Behaviour:

- `DEVICE_LANGUAGE = resolveDeviceLanguage(readDeviceLocale())` computed at module
  evaluation; `readDeviceLocale = () => Intl.DateTimeFormat().resolvedOptions().locale`
  (internal, not exported).
- `languageAtom = atomWithStorageString('preference_language', DEVICE_LANGUAGE)`.
- `localeAtom = atom((get) => { const s = get(languageAtom); return isLocaleCode(s) ? s : DEVICE_LANGUAGE; })`.
- `getLanguage = () => store.get(localeAtom)`.
- `setLanguage(next)`: `store.set(languageAtom, next); store.set(languageChosenAtom, true)`.
- Launch path (called from `initializeAppState`, `stores/sync.ts:234`): when
  `get(languageChosenAtom)` is false, recompute `DEVICE_LANGUAGE2 = resolveDeviceLanguage(readDeviceLocale())`
  and write it only if it differs from the stored value. Once chosen, never re-derive.
- `switchLanguage(next, deps)`: `setLanguage(next)`, then
  `await deps.rescheduleNotifications(); await deps.refreshWidgets(); await deps.deleteSupersededChannels(next); markLanguageApplied(next)`.
  Order matters: the reschedule creates the new channel ids before the superseded
  channels are deleted (`SURFACES.md` §2).
- `reconcileLanguageSurfaces(deps)`: if `getLanguage() === get(languageAppliedAtom)`
  return; else run the same body as `switchLanguage` without re-committing the language
  (call an internal `applyLanguageSurfaces`). Called once per launch.

`markLanguageApplied` and `isLanguageApplied` stay internal (not exported) so
`unusedExports` is satisfied and callers cannot stamp applied out of order.

Invariants:

- The atom write in `setLanguage` is the commit point; `localeAtom` changes and the UI
  re-renders before any OS work begins.
- No component ever writes the language during render.
- `reconcileLanguageSurfaces` is idempotent: a no-op when applied equals requested.

---

## 7. `shared/time.ts` (edited)

New shape:

```ts
export interface DurationLabels { readonly hours: string; readonly minutes: string; readonly seconds: string; readonly now: string }

export const formatDateLong = (date: string, locale: LocaleCode = 'en'): string;
export const formatHijriDateLong = (date: string, locale: LocaleCode = 'en'): string;
export const formatTime = (seconds: number, hideSeconds = false, forceHideSeconds = false, labels?: DurationLabels): string;
export const formatTimeAgo = (seconds: number, labels?: DurationLabels): string;
```

Changes, against the current file:

- `formatDateLong` (`shared/time.ts:229-233`) stops using `date-fns` `format(..., 'EEE, d MMM yyyy')`
  and uses a per-locale `Intl.DateTimeFormat(LOCALE_META[locale].intlLocale, { weekday:'short', day:'numeric', month:'short', year:'numeric', numberingSystem:'latn' })`,
  cached in a `Map<LocaleCode, Intl.DateTimeFormat>`. `en-GB` reproduces today's output;
  a test asserts the English output against the current expected string before the edit.
- `formatHijriDateLong` (`shared/time.ts:241-254`) takes the locale, keeps the umalqura
  calendar and `PRAYER_TIMEZONE`, adds `numberingSystem: 'latn'`, and strips the era
  token via `formatToParts` (filter `era`, drop a trailing literal of only whitespace)
  instead of the English ` AH$` regex (`shared/time.ts:250`). The `catch` fallback to
  the Gregorian formatter is kept and tested.
- `formatTime` (`shared/time.ts:528-549`) and `formatTimeAgo` (`shared/time.ts:564-574`)
  take `DurationLabels`, defaulting to a module `ENGLISH_DURATION_LABELS`
  (`{ hours:'h', minutes:'m', seconds:'s', now:'now' }`). The default parameter keeps
  the existing JSDoc-pinned tests (`shared/time.ts:516-526`) passing untouched.
- Nothing else in the file changes: `createPrayerDatetime`, `getNightTimes`,
  `formatPrayerTime`, `addDaysToDateString`, the offset caches and `PRAYER_TIMEZONE`
  are all untouched.

`toArabicNumbers` (`shared/text.ts:25-27`) and `shared/__tests__/text.test.ts` are
deleted; a guard test asserts no shipped formatter yields Arabic-Indic digits.

---

## 8. `shared/types.ts` (edited)

`PrayerRow` (`shared/types.ts:266-276`):

```ts
interface PrayerRow {
  type: ScheduleType;
  id: PrayerId;            // was: english: string; arabic: string
  belongsToDate: string;
}
```

`ReadablePrayer` (`shared/types.ts:286-291`) and `UnreadablePrayer`
(`shared/types.ts:298-301`) are unchanged except they inherit `id`. `Prayer`
(`shared/types.ts:307`) is unchanged. `RequiredTimeName`
(`shared/types.ts:74`) is unchanged. `AlertType`, `ReminderInterval`, `ReminderSlot`
and their storage-contract comments (`shared/types.ts:182-220`) are unchanged.

Deleting `arabic` is storage-safe: no `Prayer` is persisted (the only persisted prayer
shape is `ISingleApiResponseTransformed`, `shared/types.ts:108-122`, which has no name
field) and notification records keep their own `englishName` string
(`shared/notifications.ts:17-24`).

---

## 9. `shared/prayer.ts` (edited)

- `CreatePrayerParams` (`shared/prayer.ts:269-275`) becomes `{ type, id: PrayerId, date, time }`.
- `createPrayer` (`shared/prayer.ts:296-308`) sets `id` and drops `arabic`.
- `getPrayerNamesForDate` (`shared/prayer.ts:314-330`) returns `readonly PrayerId[]`.
  The Friday filter currently compares `name.toLowerCase() !== 'istijaba'` and
  `name !== 'استجابة'` (`shared/prayer.ts:324-325`); both become `name !== 'istijaba'`.
- `createPrayersForSingleDay` (`shared/prayer.ts:376-422`) and `createPrayersForDate`
  (`shared/prayer.ts:477-483`) carry `id`.
- `getPrayerForDate` (`shared/prayer.ts:504-505`) compares `prayer.id === english`
  after `prayerIdOf(english)`; a `null` id means no match (the current `.find` on
  `english` would also never match an unknown name).
- `calculateBelongsToDate` (`shared/prayer.ts:234-264`) and
  `adjustPrayerDateForMidnightCrossing` (`shared/prayer.ts:337-364`) keep their string
  comparisons against `MIDNIGHT_CROSSING_PRAYERS` and `NIGHT_PRAYER_NAMES`; those
  constants (`shared/constants.ts:39,47`) become `PrayerId`-typed tuples, so the
  comparisons stay string equality on the same bytes.
- `getLongestPrayerNameIndex` (`shared/prayer.ts:196-209`) is replaced by
  `longestLabelId(type, locale)`: the `PrayerId` whose `prayerLabel(locale, id)` is
  longest. `InitialWidthMeasurement` (`components/ui/InitialWidthMeasurement.tsx:20-25`)
  measures this per schedule and per current locale, so the frozen name column tracks
  the actual longest name in the selected language (the store already grows only
  toward truth, `stores/ui.ts:216-231`).

---

## 10. `shared/constants.ts` (edited)

- `PRAYERS_ARABIC` (`shared/constants.ts:15`) and `EXTRAS_ARABIC`
  (`shared/constants.ts:32`) are deleted; their values move to the `ar` catalog.
- `EXTRAS_EXPLANATIONS` (`shared/constants.ts:54-60`) and
  `EXTRAS_EXPLANATIONS_ARABIC` (`shared/constants.ts:1006-1012`) are deleted; the
  English values move to the `en` catalog and the Arabic to `ar`.
- `PRAYERS_ENGLISH` (`shared/constants.ts:9`) and `EXTRAS_ENGLISH`
  (`shared/constants.ts:26`) become `readonly PrayerId[]` with the same values and
  order; every consumer (`stores/notifications.ts:215,224,287,...`,
  `shared/notifications.ts:324-325`, `shared/widgetTimeline.ts`, `InitialWidthMeasurement`)
  keeps working because the values are unchanged strings.
- `MIDNIGHT_CROSSING_PRAYERS` (`shared/constants.ts:47`) and `NIGHT_PRAYER_NAMES`
  (`shared/constants.ts:39`) become typed tuples of the same literals.
- `TEXT.sizeArabic` and `TEXT.lineHeight.arabic` (`shared/constants.ts:300-307`) are
  deleted with the Arabic explanation line; `TEXT` is otherwise untouched.
- `PRAYER_TIMEZONE` (`shared/constants.ts:258`) is untouched.

---

## 11. `stores/ui.ts` (edited)

- Delete `showArabicNamesAtom` (`stores/ui.ts:131-132`).
- `AlertSheetState` (`stores/ui.ts:16-23`) drops `prayerArabic`; `showAlertSheet`
  (`stores/ui.ts:178-182`) and its callers pass `{ type, index, prayerEnglish, isUnavailable }`.

Everything else in `stores/ui.ts` is untouched.

---

## 12. `shared/notifications.ts` (edited)

- `genNotificationContent` (`shared/notifications.ts:123-138`) signature becomes
  `(id: PrayerId, alertType, soundIndex, locale: LocaleCode)`. The title becomes
  `translate(locale, 'notification.now', { name: prayerLabel(locale, id) })`. The
  `_arabicName` parameter is removed. `getNotificationSound` and the rest of the body
  are unchanged.
- `genReminderNotificationContent` (`shared/notifications.ts:174-189`) signature becomes
  `(id, intervalMinutes, alertType, locale)`, title
  `translate(locale, 'notification.reminder', { name: prayerLabel(locale, id), n: intervalMinutes })`.
- `prayerNameSlug` (`shared/notifications.ts:147`) takes a `PrayerId`; the body
  (lower-case, spaces to underscores) is unchanged, so `'last third'` to `last_third`.
- Channel id builders gain the locale:
  `athanAndroidChannelId(soundIndex, locale) = \`athan_${soundIndex + 1}_v5_${locale}\``
  (`shared/notifications.ts:380`), `reminderAndroidChannelId(id, interval, locale)`
  (`shared/notifications.ts:387-390`), `extrasAndroidChannelId(locale)`
  (`shared/notifications.ts:396`). `atTimeAndroidChannelId` (`shared/notifications.ts:402-403`)
  threads the locale.
- `athanAndroidChannelConfig(soundIndex, locale)` (`shared/notifications.ts:409-417`)
  and the extras and reminder configs (`shared/notifications.ts:445-463,492-514`) take
  localized `name` values from the catalog via `translate`.
- `deleteSupersededAndroidChannels(locale)` replaces
  `deleteLegacyAndroidAudioChannels` (`shared/notifications.ts:516-552`): it deletes the
  pre-`_v5` generations exactly as today, plus `_v5_<other>` ids for every locale in
  `LOCALE_CODES` other than `locale`. The current locale's `_v5` channels are left
  alone.
- `createDefaultAndroidChannel` / `createExtrasAndroidChannel` / `createAthanAndroidChannel`
  / `createReminderAndroidChannel` (`shared/notifications.ts:419-514`) take the locale
  and build the id and name from it. The per-session dedup sets
  (`shared/notifications.ts:431-437`) key on the full id, so a new locale is a new id
  and is created.

Sound file names (`shared/notifications.ts:112-117,154-163`) are unchanged.

---

## 13. `device/notifications.ts` (edited)

- `prayerNotificationIdentifier` (`device/notifications.ts:49-50`) takes
  `(scheduleType, id: PrayerId, date)`; the body is byte-identical to today because
  `id` is the lowercased English string.
- `reminderNotificationIdentifier` (`device/notifications.ts:61-66`) takes an id.
- `addOneScheduledNotificationForPrayer` (`device/notifications.ts:82-137`) reads
  `prayer.id` instead of `prayer.english` and passes `getLanguage()` (or a `locale`
  argument) to `genNotificationContent` and the channel helpers. The record it writes
  keeps `englishName` as the id string, so record readers are unchanged.
- `addOneScheduledReminderForPrayer` (`device/notifications.ts:212-255`) mirrors it.

The locale is passed in explicitly from `stores/notifications.ts` rather than read
inside `device/`, so the device layer stays a thin adapter as it is today.

---

## 14. `stores/notifications.ts` (edited)

- `getPrayerArrays` (`stores/notifications.ts:151-157`) drops `arabic` and returns
  `{ ids: readonly PrayerId[] }`; the name arrays it returns come from
  `PRAYERS_ENGLISH`/`EXTRAS_ENGLISH` (now `PrayerId[]`).
- `createPrayerAlertAtom` (`stores/notifications.ts:203-208`),
  `createReminderAlertAtom` (`stores/notifications.ts:253-261`) and
  `createReminderIntervalAtom` (`stores/notifications.ts:273-281`) take a `PrayerId`;
  the keys they build are byte-identical because the id is the same lowercased string.
- `scheduleNotificationForDate` (`stores/notifications.ts:826-882`),
  `_addMultipleScheduleNotificationsForPrayer` (`stores/notifications.ts:904-959`),
  `scheduleReminderNotificationForDate` (`stores/notifications.ts:1012-1076`),
  `_addMultipleScheduleRemindersForPrayer` (`stores/notifications.ts:1094-1155`),
  `applyPrayerAlerts` (`stores/notifications.ts:1201+`),
  `commitPrayerAlertChange`, `undoPrayerAlertChange` and the schedule-wide
  `addMultipleScheduleNotifications` / `addMultipleScheduleReminders`
  (`stores/notifications.ts:1388,1427`) all take `id: PrayerId` in place of
  `englishName`/`arabicName`. The `arabicName` parameter is deleted throughout
  (`stores/notifications.ts:831,877,908,928,1017,1071,1098,1122,1205,1225,1234,1275,1293,1334,1349,1355,1368,1403,1447`).
  Every storage key and identifier body is unchanged, so the whole notification
  safety machinery is untouched in behaviour.
- The locale for a reschedule is read once at the top of each scheduling entry point
  with `getLanguage()` and passed down; the value is the same for the whole pass.

`migrateIndexKeyedAlertPreferences` (`stores/notifications.ts:525-598`) keeps its
shape; its `EXTRAS_ENGLISH_PRE_1_0_27` array (`stores/notifications.ts:487`) keeps the
same string literals, now typed `PrayerId`.

---

## 15. `shared/widgetTypes.ts` (edited)

```ts
export const WIDGET_PROPS_VERSION = 6;        // was 5 (shared/widgetTypes.ts:14)
export const ANDROID_SNAPSHOT_VERSION = 2;    // was 1 (shared/widgetTypes.ts:21)

export interface PrayerWidgetSettings {
  hijriDate: boolean;
  locale: LocaleCode;                          // new
}

export interface WidgetStrings { /* same fields as shared/i18n WidgetStrings */ }

export interface PrayerWidgetProps {
  v: number;
  schedule?: 'standard' | 'extra';
  theme?: WidgetTheme;
  nextName: string;        // now the localized label, baked at push
  nextTime: string;
  nextEpochMs: number;
  prevEpochMs: number;
  dateLabel: string;       // now locale-aware
  prayers?: WidgetPrayerRow[]; // name is now localized
  activeIndex?: number;
  stale?: boolean;
  strings?: WidgetStrings;     // new; absent on entries from older builds
}

export interface PrayerWidgetAndroidProps {
  v: number;
  schedule: 'standard' | 'extra';
  theme: WidgetTheme;
  size: 'small' | 'medium';
  grantedWidthDp?: number;
  days: AndroidWidgetDay[];    // row.name is now localized
  horizonEpochMs: number;
  strings?: WidgetStrings;     // new
}
```

`WidgetPrayerRow` (`shared/widgetTypes.ts:48-53`) and `AndroidWidgetDayRow`
(`shared/widgetTypes.ts:127-134`) keep their shape; only the string values change.

---

## 16. `shared/widgetTimeline.ts` (edited)

- `formatDateLabel(belongsToDate, hijriDate, locale)` (`shared/widgetTimeline.ts:114-116`)
  passes the locale to the formatters.
- `buildDayList` (`shared/widgetTimeline.ts:133-138`) maps
  `name: prayerLabel(locale, prayer.id)`.
- `buildPrayerWidgetTimeline` (`shared/widgetTimeline.ts:161-197`) reads
  `settings.locale`, sets `nextName: prayerLabel(locale, next.id)`,
  `dateLabel`, `strings: widgetStrings(locale)`, and the terminal stale entry
  (`shared/widgetTimeline.ts:241-254`) carries `nextName` and `strings` too.
- `buildPrayerWidgetSnapshot` (`shared/widgetTimeline.ts:277-320`) maps
  `name: prayerLabel(locale, prayer.id)` and sets `strings: widgetStrings(locale)`.

The builder stays pure: it reads no clock and imports nothing new beyond
`shared/i18n`.

---

## 17. `stores/widget.ts` (edited)

- `readWidgetSettings` (`stores/widget.ts:84-90`) returns
  `{ hijriDate: store.get(hijriDateEnabledAtom), locale: getLanguage() }`.
- `initWidgetSettingsSync` (`stores/widget.ts:124-140`) adds
  `store.sub(languageAtom, schedulePush)` beside the existing
  `store.sub(hijriDateEnabledAtom, schedulePush)`.
- `pushScheduleTimelines` (`stores/widget.ts:167-229`) and `pushScheduleAndroid`
  (`stores/widget.ts:345-389`) are unchanged except they consume the new settings.

---

## 18. `widgets/PrayerWidget.tsx` and `widgets/LockPrayerWidget.tsx` (edited)

Every fixed caption becomes a read of `props.strings?.<field> ?? '<english default>'`.
The widget contract test forbids module-scope references inside the widget body, and
`props` is a parameter of the body (`shared/__tests__/widgetContract.test.ts:94-144`),
so this is permitted. The affected literals and the field they read:

| File:line | Literal | Field |
| --- | --- | --- |
| `widgets/PrayerWidget.tsx:316,524,759` | `Athan` | `neutralTitle` |
| `widgets/PrayerWidget.tsx:318,524,759` | `Prayer times for London` / `Open the app to refresh` | `neutralSubtitle` |
| `widgets/PrayerWidget.tsx:328,493` | `Out of date` | `staleTitle` |
| `widgets/PrayerWidget.tsx:331,495` | `Open Athan to refresh` | `staleRefresh` |
| `widgets/PrayerWidget.tsx:334,498` | `Open Athan` | `staleOpen` |
| `widgets/PrayerWidget.tsx:336,499` | `to refresh` | `staleToRefresh` |
| `widgets/LockPrayerWidget.tsx:60,97,213,250,358,399` | `Athan — prayer times` / `Athan — open to refresh times` | `inlineNeutral` / `inlineStale` |
| `widgets/LockPrayerWidget.tsx:73,226,371` | `ATHAN` | `brandUpper` |
| `widgets/LockPrayerWidget.tsx:75,228,373` | `Open to load times` | `openToLoad` |
| `widgets/LockPrayerWidget.tsx:112,265,417` | `Out of date` | `staleTitle` |
| `widgets/LockPrayerWidget.tsx:115,268,420` | `Open app to refresh` | `refreshLine` |

`entry.nextName`, `entry.nextTime`, row `name` and `dateLabel` already flow from props,
so no layout logic changes for those.

---

## 19. UI surfaces (edited)

String-to-key mapping and structural changes, file by file:

- `components/prayer/Prayer.tsx`: drop `showArabicNamesAtom`
  (`components/prayer/Prayer.tsx:36,91-93`); the name text becomes
  `prayerLabel(locale, Prayer.id)` using `useTranslation`. Add `direction: 'ltr'` to
  `styles.container` (`components/prayer/Prayer.tsx:100-105`). Delete `styles.arabic`
  (`components/prayer/Prayer.tsx:113-116`). `computedStyleEnglish` measures the longest
  localized name.
- `components/prayer/Explanation.tsx`: drop `explanationArabic` and the
  `toArabicNumbers` line (`components/prayer/Explanation.tsx:6,32,79-80,159-165`);
  render one explanation string.
- `components/overlay/overlayContent.ts`: `OverlayExplanation` drops
  `explanationArabic`; `getOverlayExplanation(type, id, locale)` returns
  `{ prayerName, explanation }` where `prayerName = prayerLabel(locale, id)` for extras
  and `explanation = extraExplanation(locale, id)`.
- `components/overlay/OverlayInfoBox.tsx`: consumes the new shape
  (`components/overlay/OverlayInfoBox.tsx:71-73,80-85`).
- `components/sheets/screens/Settings.tsx`: replace the six literals with keys
  (`settings.title`, `settings.subtitle`, `settings.card.*`, `settings.changeAthan`,
  `settings.qibla`, `settings.showHijri`, `settings.showSeconds`,
  `settings.showTimePassed`, `settings.showCountdownBar`, `settings.showDecorations`,
  `settings.whatsNew`, `settings.help`); delete the `Show arabic names` toggle
  (`components/sheets/screens/Settings.tsx:37,128-132`); add a Language row that calls
  `showLanguageSheet()` in the Prayer card.
- `components/sheets/screens/Language.tsx` (new): a `Sheet` titled
  `language.title` / `language.subtitle`, listing `LOCALE_CODES` mapped to
  `LOCALE_META[code].endonym`; selecting calls
  `switchLanguage(code, defaultLanguageDeps())` and dismisses. It reads
  `localeAtom` to mark the current row.
- `components/sheets/screens/Alert.tsx`: keys `alert.subtitle`, `alert.cardAthan`,
  `alert.hintAtTime`, `alert.reminder1`, `alert.reminder2`, `alert.hintBefore`,
  `alert.sound`, `alert.before`, `alert.unitMin`, `alert.option.*`,
  `alert.unavailable` (`components/sheets/screens/Alert.tsx:30-34,41-47,93-101,218-256`).
- `components/sheets/screens/ReminderCard.tsx`: keys `alert.sound`, `alert.before`
  (`components/sheets/screens/ReminderCard.tsx:9-12,65,70`).
- `components/sheets/parts/Stepper.tsx`: `unit` stays a prop; the caller passes
  `t('alert.unitMin')`; the accessibility labels interpolate the localized unit.
- `components/sheets/screens/Sound.tsx`: keys `sound.title`, `sound.subtitle`,
  `sound.hint` (`components/sheets/screens/Sound.tsx:163-178`).
- `components/sheets/screens/Qibla.tsx`: keys `qibla.*`
  (`components/sheets/screens/Qibla.tsx:46-47,62-64,84-89,103-113,140`).
- `components/day/Day.tsx`: `day.location` for the location text
  (`components/day/Day.tsx:48`); `formatShownDate(dateSource, hijriEnabled, locale)`.
- `components/countdown/Countdown.tsx`: `countdown.waitingLabel` accessibility label
  (`components/countdown/Countdown.tsx:46`).
- `components/modals/Update.tsx`: keys `update.title`, `update.body`, `common.later`,
  `common.update` (`components/modals/Update.tsx:15-33`).
- `components/modals/WhatsNew.tsx`: keys `whatsNew.title`, `whatsNew.platformOnly`,
  `common.close` (`components/modals/WhatsNew.tsx:28,45,52-53`).
- `components/modals/Help.tsx`: keys `help.title`, `common.close` in the chrome
  (`components/modals/Help.tsx:126,151-153`); the topic content comes localized from
  `getHelpTopics(os, locale)`.
- `components/ui/Error.tsx`: keys `error.heading`, `error.body`, `error.hint`,
  `error.refresh` (`components/ui/Error.tsx:37-42`).
- `app/index.tsx`: `app.loading` for the progressbar label (`app/index.tsx:211`).
- `hooks/useNotification.ts`: the permission dialog strings
  (`hooks/useNotification.ts:58-59`) become keys (`notification.permission.title`,
  `notification.permission.body`, `common.cancel`, `common.openSettings`); add those
  four keys to the catalog.

`components/sheets/screens/Settings.tsx` and the new `Language.tsx` are the only
structural additions; every other component edit is a literal-for-key substitution
plus, in `Prayer.tsx`, `Explanation.tsx` and `Day.tsx`, the removal of the bilingual
path.

---

## 20. `shared/help.ts` (edited)

`HELP_ACTION_LABELS` (`shared/help.ts:46-48`) and the story text
(`shared/help.ts:51-130`) become key references. `getHelpTopics(os, locale)`
(`shared/help.ts:138-144`) builds the same `HelpTopic[]` by translating. The
per-platform, per-step structure stays in `help.ts` as a table of keys, so the catalog
holds strings only.

---

## 21. `stores/version.ts` (edited)

- `handleAppUpgrade` (`stores/version.ts:230-292`) gains a call to
  `migrateLocalisation(storedVersion)` beside
  `migrateIndexKeyedAlertPreferences(storedVersion)` (`stores/version.ts:289`).
- `migrateLocalisation` (new, same file): removes `preference_show_arabic_names`
  (`stores/ui.ts:132`) with `Database.database.remove`; does nothing else. It does not
  write `preference_language` (first-run resolution owns that) and does not touch any
  `scheduled_*` key.
- `CACHE_SCHEMA_VERSION` (`stores/version.ts:135`) and `UPGRADE_KEEP_PREFIXES`
  (`stores/version.ts:144-156`) are unchanged.

---

## 22. `stores/sync.ts` (edited)

`initializeAppState` (`stores/sync.ts:234-261`) calls
`reconcileLanguageSurfaces(defaultLanguageDeps()).catch(log)` before the widget push,
so an interrupted switch is retried on the launch that has fresh data. The default
dependency bundle lives in a small module `stores/languageSurfaces.ts` that imports
`refreshNotifications`, `refreshPrayerWidgets` and
`deleteSupersededAndroidChannels` and returns them as `LanguageSurfaceDeps`. That
module is imported by `stores/sync.ts` and by the Settings language screen, which keeps
the direction one-way (see `PROPOSAL.md` §4).

---

## 23. Deletions

- `shared/text.ts` and `shared/__tests__/text.test.ts`.
- `components/prayer/__tests__/Explanation.test.tsx` Arabic-digit cases (replaced by a
  Latin-digit assertion).
- The `PRAYERS_ARABIC`, `EXTRAS_ARABIC`, `EXTRAS_EXPLANATIONS`,
  `EXTRAS_EXPLANATIONS_ARABIC` constants and every import of them.
