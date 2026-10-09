# 01. Prayer domain model and identifiers

Evidence for every claim about today's code is in `evidence/core.md` and
`evidence/schedule-time.md`. Citations are `path:line` at base commit `c3149dfc`.

## The problem in one sentence

A prayer has no identity of its own. Its English display name is its identity, so the string a
user reads is also a storage key fragment, an OS notification identifier fragment, an audio file
name fragment, an object key into the stored day and the operand of nine string comparisons
(`evidence/core.md` section 1). The name cannot be translated while it holds those jobs.

## Decision

Introduce a closed `PrayerId` and one registry that owns every fact about a prayer except its
display name. The display name moves to the string catalog (document 02) and is looked up by id
at the moment of drawing or baking. No code outside the registry and the identifier module may
spell a prayer.

The eleven ids are the audio slugs the 99 files already use, so two of the three frozen token
families are the id itself.

```ts
// shared/prayers.ts (new)
export const STANDARD_PRAYER_IDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'] as const;
export const EXTRA_PRAYER_IDS = ['midnight', 'last_third', 'suhoor', 'duha', 'istijaba'] as const;
export const PRAYER_IDS = [...STANDARD_PRAYER_IDS, ...EXTRA_PRAYER_IDS] as const;

export type StandardPrayerId = (typeof STANDARD_PRAYER_IDS)[number];
export type ExtraPrayerId = (typeof EXTRA_PRAYER_IDS)[number];
export type PrayerId = (typeof PRAYER_IDS)[number];

/** A stored day's time fields, as `ISingleApiResponseTransformed` names them */
export type StoredTimeField = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'magrib' | 'isha' | 'suhoor' | 'duha';

/** How a row gets its moment */
export type PrayerSource =
  | { readonly kind: 'stored'; readonly field: StoredTimeField }
  | { readonly kind: 'night'; readonly part: 'midnight' | 'lastThird' }
  | { readonly kind: 'beforeMagrib' };

export interface PrayerDefinition {
  readonly id: PrayerId;
  readonly schedule: ScheduleType;
  /** Position on its list and in every record key. Frozen. */
  readonly index: number;
  /** The 1.x token inside preference keys and OS notification identifiers. Frozen. */
  readonly legacyKeyToken: string;
  /** The token inside reminder audio file names and Android channel ids. Frozen. */
  readonly audioSlug: string;
  readonly source: PrayerSource;
  /** A Sound at-time alert plays the chosen athan (true) or `reminder.mp3` (false) */
  readonly playsAthan: boolean;
  /** A Standard row whose small-hours time is the next calendar day's */
  readonly crossesMidnight: boolean;
  /** An Extras row whose afternoon or evening time is the previous calendar day's */
  readonly wrapsFromEvening: boolean;
  /** On its list on Fridays only */
  readonly fridayOnly: boolean;
}
```

### The registry table

This table is the specification. The module builds `PRAYERS: Readonly<Record<PrayerId,
PrayerDefinition>>` from exactly these rows.

| id | schedule | index | legacyKeyToken | audioSlug | source | playsAthan | crossesMidnight | wrapsFromEvening | fridayOnly |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `fajr` | standard | 0 | `fajr` | `fajr` | stored `fajr` | true | false | false | false |
| `sunrise` | standard | 1 | `sunrise` | `sunrise` | stored `sunrise` | false | false | false | false |
| `dhuhr` | standard | 2 | `dhuhr` | `dhuhr` | stored `dhuhr` | true | false | false | false |
| `asr` | standard | 3 | `asr` | `asr` | stored `asr` | true | false | false | false |
| `magrib` | standard | 4 | `magrib` | `magrib` | stored `magrib` | true | true | false | false |
| `isha` | standard | 5 | `isha` | `isha` | stored `isha` | true | true | false | false |
| `midnight` | extra | 0 | `midnight` | `midnight` | night `midnight` | false | false | true | false |
| `last_third` | extra | 1 | `last third` | `last_third` | night `lastThird` | false | false | true | false |
| `suhoor` | extra | 2 | `suhoor` | `suhoor` | stored `suhoor` | false | false | true | false |
| `duha` | extra | 3 | `duha` | `duha` | stored `duha` | false | false | false | false |
| `istijaba` | extra | 4 | `istijaba` | `istijaba` | beforeMagrib | false | false | false | true |

Where each column comes from:

| Column | Replaces | Site today |
| --- | --- | --- |
| order and `index` | positions in `PRAYERS_ENGLISH`, `EXTRAS_ENGLISH` | `shared/constants.ts:9`, `:26` |
| `legacyKeyToken` | `name.toLowerCase()` | `stores/notifications.ts:207`, `device/notifications.ts:50` |
| `audioSlug` | `prayerNameSlug(name)` | `shared/notifications.ts:147` |
| `source: stored` | `rawData[name.toLowerCase()]` | `shared/prayer.ts:407` |
| `source: night` | `name === 'Midnight' \|\| name === 'Last Third'` | `shared/prayer.ts:181`, `:399` |
| `source: beforeMagrib` | `name === 'Istijaba'` | `shared/prayer.ts:398` |
| `playsAthan` | `DAILY_PRAYERS` | `shared/notifications.ts:88`, `:106` |
| `crossesMidnight` | `MIDNIGHT_CROSSING_PRAYERS` | `shared/constants.ts:47`, `shared/prayer.ts:248`, `:348` |
| `wrapsFromEvening` | `NIGHT_PRAYER_NAMES` | `shared/constants.ts:39`, `shared/prayer.ts:258`, `:358` |
| `fridayOnly` | the Istijaba filters and the row-press rule | `shared/prayer.ts:322-327`, `components/prayer/rowPress.ts:33` |

### Registry API

```ts
const PRAYERS: Readonly<Record<PrayerId, PrayerDefinition>>;                  // module-private
export const definitionOf = (id: PrayerId): PrayerDefinition => PRAYERS[id];
export const prayerIdsFor = (schedule: ScheduleType): readonly PrayerId[];   // list order
/** The ids on a list day: every id of the schedule, less `fridayOnly` ids when the day is not a Friday */
export const prayerIdsOnListDay = (schedule: ScheduleType, isFriday: boolean): readonly PrayerId[];
```

`prayerIdsFor` returns the same frozen array instance on every call. `PRAYERS` and every
definition are frozen with `Object.freeze`.

The repository fails any exported symbol, type or value, that no other production file imports
(`scripts/find-unused-exports.py:29-30`, `shared/__tests__/unusedExports.test.ts:16-54`). So the
`export` keywords in the blocks of this document show intent, and `07-sequencing.md` has the
binding list: which symbol is exported, by which step, for which importer. `PrayerDefinition`,
`PrayerSource`, `StoredTimeField` and `StandardPrayerId` stay module-private, because nothing
outside the registry needs to name them.

## The wire format lives in one file

Every frozen template moves into one pure module. It imports the registry and nothing else.
No other file under `stores/`, `device/` or `shared/` may build one of these strings. A
source-scan test (document 06, T-ID-3) reads the non-comment code of those three folders and
fails on the substrings `preference_alert_`, `preference_reminder_`,
`preference_notification_repair_`, `athan_`, `reminder_`, `scheduled_notifications_`,
`scheduled_reminders_` and `.mp3`. Its allow-list is the two keep lists, whose entries are
prefixes that an existing suite pins as source literals (`stores/sync.ts:357-371`,
`stores/version.ts:144-156`, `stores/__tests__/database.test.ts:558-578`). The scan stops at
those three folders on purpose: a widget layout names its drawables `athan_widget_...` and
cannot import anything (`widgets/PrayerWidget.tsx:235-243`), and `assets/audio/index.ts` must
spell each file in a static `require`.

```ts
// shared/identifiers.ts (new)
import type { ReminderInterval, ReminderSlot, ScheduleType } from '@/shared/types';

// MMKV preference keys (stores/notifications.ts:207, :241, :258, :278, :335)
export const alertPreferenceKey = (id: PrayerId): string;
//   `preference_alert_${schedule}_${legacyKeyToken}`
export const reminderAlertPreferenceKey = (id: PrayerId, slot: ReminderSlot): string;
//   `preference_reminder_alert_${schedule}_${legacyKeyToken}${slot === 0 ? '' : `_${slot + 1}`}`
export const reminderIntervalPreferenceKey = (id: PrayerId, slot: ReminderSlot): string;
//   `preference_reminder_interval_${schedule}_${legacyKeyToken}${slot === 0 ? '' : `_${slot + 1}`}`
export const repairMarkKey = (id: PrayerId): string;
//   `preference_notification_repair_${schedule}_${legacyKeyToken}`

// The index-keyed keys older installs hold, read once by the migration (stores/notifications.ts:575-579)
export const legacyIndexAlertKey = (schedule: ScheduleType, index: number): string;
//   `preference_alert_${schedule}_${index}`
export const legacyIndexReminderAlertKey = (schedule: ScheduleType, index: number): string;
//   `preference_reminder_alert_${schedule}_${index}`
export const legacyIndexReminderIntervalKey = (schedule: ScheduleType, index: number): string;
//   `preference_reminder_interval_${schedule}_${index}`

// OS notification identifiers (device/notifications.ts:49-50, :61-66)
export const atTimeNotificationId = (id: PrayerId, listDay: string): string;
//   `athan_${schedule}_${legacyKeyToken}_${listDay}`
export const reminderNotificationId = (id: PrayerId, listDay: string, minutes: ReminderInterval): string;
//   `reminder_${schedule}_${legacyKeyToken}_${listDay}_${minutes}`

// MMKV record keys and prefixes (stores/database.ts:193, :222, :236, :258, :272, :287)
export const atTimeRecordKey = (id: PrayerId, notificationId: string): string;
//   `scheduled_notifications_${schedule}_${index}_${notificationId}`
export const atTimeRecordPrefixForPrayer = (id: PrayerId): string;
//   `scheduled_notifications_${schedule}_${index}`
export const atTimeRecordPrefixForSchedule = (schedule: ScheduleType): string;
//   `scheduled_notifications_${schedule}`
export const reminderRecordKey = (id: PrayerId, notificationId: string): string;
export const reminderRecordPrefixForPrayer = (id: PrayerId): string;
export const reminderRecordPrefixForSchedule = (schedule: ScheduleType): string;
//   the same three with `scheduled_reminders_`

// Audio (shared/notifications.ts:94, :116, :162)
export const EXTRAS_AUDIO_FILE = 'reminder.mp3';
export const athanAudioFile = (soundIndex: number): string;           // `athan${soundIndex + 1}.mp3`
export const reminderAudioFile = (id: PrayerId, minutes: ReminderInterval): string;
//   `reminder_${audioSlug}_${minutes}.mp3`

// Android channels (shared/notifications.ts:380, :387-390, :396)
export const EXTRAS_CHANNEL_ID = 'extras_at_time_v3';
export const athanChannelId = (soundIndex: number): string;           // `athan_${soundIndex + 1}_v4`
export const reminderChannelId = (id: PrayerId, minutes: ReminderInterval): string;
//   `reminder_${audioSlug}_${minutes}_v3`
export const atTimeChannelId = (id: PrayerId, soundIndex: number): string;
//   playsAthan ? athanChannelId(soundIndex) : EXTRAS_CHANNEL_ID

/** Reads a channel id back into what it names, or null when the id is not one of this app's */
export const parseChannelId = (
  channelId: string
):
  | { kind: 'athan'; soundIndex: number }
  | { kind: 'extras' }
  | { kind: 'reminder'; prayerId: PrayerId; minutes: ReminderInterval }
  | null;
```

`schedule` in every template is `definitionOf(id).schedule`, whose two values are the strings
`standard` and `extra` (`shared/types.ts:148-153`). The legacy index-key pattern
(`stores/notifications.ts:493`) and the pre-1.0.27 Extras order (`:487`) move here too, as
`LEGACY_INDEX_KEY_PATTERN` and `EXTRA_IDS_BEFORE_1_0_27: readonly ExtraPrayerId[] =
['last_third', 'suhoor', 'duha', 'istijaba']`.

## Data shapes that change

### The list row

```ts
// shared/types.ts
interface PrayerRow {
  type: ScheduleType;      // kept: 40 call sites read it, and it equals definitionOf(id).schedule
  id: PrayerId;            // replaces `english` and `arabic`
  belongsToDate: string;
}
```

`ReadablePrayer` and `UnreadablePrayer` keep their `datetime` and `time` fields unchanged
(`shared/types.ts:286-301`). No row holds a display string any more, so a language switch never
rebuilds a sequence.

### The loading frame

`usePrayer` answers with empty strings while the sequence loads or the row index is out of
range (`hooks/usePrayer.ts:87-102`), and `canonicalPrayerIndex` exists to keep that frame from
handing `useAtomValue` an undefined atom (`stores/notifications.ts:656-660`,
`components/prayer/Alert.tsx:66`). With ids the rule is:

- `usePrayer` returns `id: PrayerId | null`. It is `null` exactly where `english` is `''` today.
- It also returns `alertId: PrayerId`, never null: the row's id when there is one, otherwise
  `prayerIdsFor(type)[index] ?? prayerIdsFor(type)[0]`. That is today's fallback to the row
  index, made total.
- `components/prayer/Prayer.tsx` draws `''` for a null id and the catalog name otherwise.
  `prayerNameKey` is never called with null.
- `components/prayer/Alert.tsx` reads the atom of `alertId`, builds its spoken label with `''`
  for the name on a null id, and ignores a press on a null id.
- `getRowPressAction` returns `'none'` for a null id.

### The countdown

`CountdownStore` (`shared/types.ts:329-336`) becomes
`{ timeLeft: number | null; prayerId: PrayerId | null }`. `null` is the waiting state that
`COUNTDOWN_WAITING_NAME` stands for today (`stores/countdown.ts:423`). The component draws
`COUNTDOWN_WAITING_NAME` when the id is `null` and the catalog name otherwise, and picks its
accessibility label on `prayerId === null`, not on string equality
(`components/countdown/Countdown.tsx:46`). The initial value is `{ timeLeft: 10, prayerId: 'fajr' }`
(`stores/countdown.ts:45`).

### The alert sheet state

`AlertSheetState` (`stores/ui.ts:16-23`) becomes `{ prayerId: PrayerId; isUnavailable: boolean }`.
The four fields it drops (`type`, `index`, `prayerEnglish`, `prayerArabic`) are all derivable.

### The notification record

```ts
// shared/notifications.ts
/** What a new record holds */
export interface ScheduledNotification {
  id: string;
  date: string;
  time: string;
  prayerId: PrayerId;
  alertType: AlertType;
}
/** What may be read from a record. A 1.x record has `englishName` and `arabicName` and no `prayerId`. */
export type StoredNotificationRecord = Pick<ScheduledNotification, 'id' | 'date'>;
```

Every function that returns records from storage returns `StoredNotificationRecord[]`
(`stores/database.ts:219-241`, `:271-292`). The type makes it a compile error to read a field a
1.x record lacks. No record is rewritten and `CACHE_SCHEMA_VERSION` stays `1`: the two fields
readers use are present in both shapes (`evidence/core.md` section 3).

## Function signatures that collapse

A prayer was passed as up to four arguments (`scheduleType`, `prayerIndex`, `englishName`,
`arabicName`). It is now one. The two index spaces the store documents at
`stores/notifications.ts:640-666` stop existing, because a row carries its id.

| Today | Becomes | Site |
| --- | --- | --- |
| `createPrayerAlertAtom(scheduleType, prayerName)` | `alertAtoms: Readonly<Record<PrayerId, StoredNumberAtom>>` built once at module evaluation from `PRAYER_IDS` | `stores/notifications.ts:203-226` |
| the four reminder atom arrays | `reminderAlertAtoms` and `reminderIntervalAtoms`: `Readonly<Record<PrayerId, PerReminderSlot<StoredNumberAtom>>>` | `stores/notifications.ts:253-313` |
| the two repair-mark arrays | `repairMarks: Readonly<Record<PrayerId, { key: string; atom: StoredNumberAtom }>>` | `stores/notifications.ts:333-361` |
| `getPrayerAlertAtom(scheduleType, prayerIndex)` | `getPrayerAlertAtom(id)` | `stores/notifications.ts:677-682` |
| `getPrayerAlertType`, `setPrayerAlertType`, the six reminder getters and setters | the same names taking `(id, ...)` | `stores/notifications.ts:623-808` |
| `canonicalPrayerIndex(scheduleType, prayerName, fallbackIndex)` | deleted; "The loading frame" above replaces its fallback | `stores/notifications.ts:663-666`, `components/prayer/Alert.tsx:66` |
| `getPrayerArrays(scheduleType)` | deleted; callers use `prayerIdsFor(schedule)` | `stores/notifications.ts:151-157` |
| `commitPrayerAlertChange(scheduleType, prayerIndex, englishName, arabicName, next, previous)` | `commitPrayerAlertChange(id, next, previous)` | `stores/notifications.ts:1330-1372` |
| `commitAlertMenuChanges(scheduleType, prayerIndex, englishName, arabicName, original, current)` | `commitAlertMenuChanges(id, original, current)` | `hooks/useNotification.ts:210-266` |
| `Device.addOneScheduledNotificationForPrayer(scheduleType, date, prayer, alertType, sound)` | `(date, prayer, alertType, sound, catalog)`; the id comes from the row | `device/notifications.ts:82-137` |
| `Device.addOneScheduledReminderForPrayer(scheduleType, date, prayer, minutes, alertType)` | `(date, prayer, minutes, alertType, catalog)` | `device/notifications.ts:212-255` |
| `Device.clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex)` and the reminder twin | `(id)` | `device/notifications.ts:159-192`, `:268-298` |
| `Database.*ForPrayer(scheduleType, prayerIndex, ...)` (six functions) | `(id, ...)`, keys from `shared/identifiers.ts` | `stores/database.ts:188-304` |
| `RequestCostReader = (scheduleType, englishName) => number` | `(id: PrayerId) => number` | `shared/notifications.ts:249` |
| `schedulePlanKey(scheduleType, englishName)` | deleted; the plan is `Map<PrayerId, string[]>` | `shared/notifications.ts:252-253`, `:268-284` |
| `CandidateRow { scheduleType, englishName, ... }` | `CandidateRow { prayerId, date, instant, requestCost }` | `shared/notifications.ts:234-241` |
| `PrayerUtils.getPrayerForDate(type, english, date)` | `getPrayerForDate(id, date)` | `shared/prayer.ts:504-505` |
| `firstStillDueListDayForPrayer(type, englishName, now)` | `(id, now)` | `shared/prayer.ts:521-527` |
| `calculateBelongsToDate(type, prayerEnglish, calendarDate, prayerDateTime)` | `(id, calendarDate, prayerDateTime)` | `shared/prayer.ts:234-264` |
| `prayerIdentity(prayer)` returning `${english}_${belongsToDate}` | `${id}_${belongsToDate}` | `stores/schedule.ts:307` |
| `PrayerFilter { standard: Set<number>; extra: Set<number> }` | `ReadonlySet<PrayerId>` | `stores/notifications.ts:459-472` |
| `getOverlayExplanation(type, english)` | `getOverlayExplanation(id)` returning catalog keys | `components/overlay/overlayContent.ts:51-56` |
| `getRowPressAction({ isStandard, english, ... })` | `({ prayerId, isPassed, isSelectedForOverlay })`; the Istijaba rule reads `fridayOnly` | `components/prayer/rowPress.ts:13-33` |

### Behaviour that must not move while the names go

- `getCascadeDelay` returns `(6 - index) * ANIMATION.cascadeDelay` for both schedules today,
  because its Extras branch reads the Standard Arabic array's length
  (`shared/prayer.ts:189-194`). Animation timing is a settled visual. The rewrite uses
  `STANDARD_PRAYER_IDS.length` for both branches and a test pins the eleven values.
- `calculateBelongsToDate` and `adjustPrayerDateForMidnightCrossing` are a matched pair
  (`shared/prayer.ts:243-247`). Both read `crossesMidnight` and `wrapsFromEvening`, so they
  still cannot drift apart.
- `canonicalDisplayOrder` ranks by registry `index` (`shared/prayer.ts:569-579`).
- The migration of index-keyed preferences keeps its exact behaviour, including the pre-1.0.27
  Extras order (`stores/notifications.ts:525-598`). It resolves destinations by id.
- `deleteLegacyAndroidAudioChannels` builds the same 231 ids from `audioSlug`
  (`shared/notifications.ts:523-552`).

## What is deleted

| Deleted | Site | Why |
| --- | --- | --- |
| `PRAYERS_ENGLISH`, `EXTRAS_ENGLISH` | `shared/constants.ts:9`, `:26` | identity moves to the registry, names to the catalog |
| `PRAYERS_ARABIC`, `EXTRAS_ARABIC`, `EXTRAS_EXPLANATIONS`, `EXTRAS_EXPLANATIONS_ARABIC` | `shared/constants.ts:15`, `:32`, `:54-60`, `:1006-1012` | become catalog entries in the `en` and `ar` packs |
| `NIGHT_PRAYER_NAMES`, `MIDNIGHT_CROSSING_PRAYERS` | `shared/constants.ts:39`, `:47` | registry flags |
| `DAILY_PRAYERS`, `isDailyPrayer`, `prayerNameSlug` | `shared/notifications.ts:88`, `:106`, `:147` | registry fields |
| `getLongestPrayerNameIndex` | `shared/prayer.ts:196-209` | character count is not width in any script but Latin (document 04) |
| `english`, `arabic` on rows; `englishName`, `arabicName` parameters everywhere | `shared/types.ts:266-276` and 26 files | replaced by `id` |

## Why not smaller, why not larger

- **Keeping English as the id and translating at the edge** would leave `'Last Third'` in the
  code as both a key and a comparison operand. Every future string change to the English pack
  would then be a storage migration. Rejected.
- **Numeric ids** are what a database would use. They would make every log line and every OS
  identifier unreadable and gain nothing, because the frozen tokens have to be kept in a table
  either way. Rejected.
- **Rewriting stored keys to the new ids** (for example `last third` to `last_third`) would be
  a migration of alert preferences and a re-keying of armed alarms. The constraint is that both
  survive byte for byte, so the old tokens stay as data and are never migrated. The cost is one
  column in the registry.

## Version 3.0.0 seam

Nothing in the registry or the identifier module names a place. A location change at 3.0.0
changes stored times, not identifiers, so the same-identifier replace that carries a language
switch also carries a location switch. The registry's `source` column is where a calculated
(non-provider) time source would plug in. No 3.0.0 code is specified here.
