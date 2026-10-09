# R15. Identifier design, adversarially reviewed (research agent report, 2026-10-09)

Dispatched by the owner's instruction. Line numbers verified against `uat` tip `cd47c70c`.
Web claims verified.

## (a) Verdict

**Candidate A, hardened: a closed slug union whose values are the byte-exact lowercase key forms
already on disk, `last third` space included, carried on a field renamed `id`, with the underscore
form demoted to a derived filename slug.** Anything else either orphans armed alarms (B, or a
mis-spelled A) or is cosmetic (C).

The owner's rejection of "keep what is there" does not apply here, because the recommendation does
not rest on habit. It rests on three frozen surfaces no design can negotiate with: the API record
keys (`fajr`..`istijaba`, shared/types.ts:108-122), 67 audio files named
`reminder_<slug>_<interval>.mp3` (verified on disk; Android res/raw admits `[a-z0-9_]` only, AAPT
enforces it, shared/notifications.ts:142), and the OS identifier bytes already armed on phones.
Where breaking is free, the design breaks: the field name, the row shape, the sentinel values,
the casts.

### The hostile finding against the repo's own plan

Plan row 38.1 (`SPLIT.md`:30) already picks A, and R5 sketches it as `PRAYER_IDS` as const. But
two plan documents wrote the extras id as `last_third`, underscore: `SINGLE-LANGUAGE-PIVOT.md`
and `MEASURED.md`:95. That spelling is a landmine, because the two frozen families disagree about
Last Third today:

| Surface | Form today | Evidence |
| --- | --- | --- |
| MMKV preference keys (4 families, 27 sites) | `last third` (space) | `preference_alert_${type}_${prayerName.toLowerCase()}` from `'Last Third'` (stores/notifications.ts:207, 258, 278, 335; shared/constants.ts:26) |
| OS notification identifiers | `last third` (space) | `englishName.toLowerCase()` (device/notifications.ts:50, 66), pinned byte-exact by `athan_extra_last third_2026-08-28` (device/__tests__/notifications.test.ts:47-49) |
| Day-record lookup | single words only | `rawData[name.toLowerCase()]` (shared/prayer.ts:407); Midnight and Last Third never reach it (branch at :398-401) |
| Audio files and Android channel ids | `last_third` (underscore) | `prayerNameSlug` (shared/notifications.ts:147, 161-162, 387-390) |

If 38.1 lands with `'last_third'`, every stored Last Third preference misses and re-reads
defaults silently, every armed Last Third alarm orphans, and the stale sweep then cancels those
orphans as garbage (stores/notifications.ts:1528-1533). That is R13 seam 1 and seam 2 firing
together, self-inflicted, for one prayer, for zero benefit. The union canonizes the **space form**
as the id, and `prayerNameSlug` stays as the derived underscore rendering for res/raw-constrained
surfaces only.

### The second hostile finding: "typed to it" is not a split

38.1 said `Prayer.english` gets typed to the union. A field named `english` carrying a
non-English-forever id is a lie the compiler cannot catch: `` title: `${prayer.english} now` ``
typechecks forever, because `PrayerId` is a string. The rename to `id: PrayerId` is therefore
part of the design, not polish. The sharpest live example of the confusion:
`genNotificationContent` takes one `englishName` param and spends it on both the display title
and the sound decision via `isDailyPrayer(englishName)` (shared/notifications.ts:112-117,
130-131). Display text currently reaches a channel-selection decision through a shared
parameter. The split cuts that param in two: sound from `id`, title from `label`.

### Why the recommended shape serves each judged axis

- **Silent-failure surface (R13's five seams).** All five seams are name-vocabulary misses: key
  duality (seam 1), deterministic ids (seam 2), `canonicalPrayerIndex` fallback (seam 3,
  stores/notifications.ts:663-666), ordering and Islamic-day rules (seam 4, shared/prayer.ts:248,
  258, 348, 358), widget contracts (seam 5). A closed union makes a vocabulary miss a compile
  error at every one of those sites. Seam 5 also wants the widget payload to carry the id when
  its schema next bumps (row 39.6's re-push path), so React keys survive a language switch
  (widgets/PrayerWidget.tsx:737 keys rows by name today).
- **Migration risk.** Zero MMKV migration, zero orphaned alarms, because the ids are the stored
  bytes.
- **Type safety.** A closed string union admits nothing outside its 11 literals. Once ids are
  literals, the night-row branch at shared/prayer.ts:398-401 narrows the id before the record
  lookup, so the load-bearing unsafe cast at :407 deletes itself, and the two
  `as (typeof NIGHT_PRAYER_NAMES)[number]` casts at :258 and :358 go with it.
- **Logs and MMKV dumps.** `athan_standard_fajr_2026-08-28` stays self-describing and
  grep-able.
- **API alignment.** Nine of the eleven ids are already the record's own field names; the
  owner's provenance split (6 API-derived, 5 computed) becomes two `as const` arrays whose
  concatenation is `PRAYER_IDS`, so the domain story is encoded in the type rather than in
  comments.
- **Notification-id freeze law.** The id feeds both builders (device/notifications.ts:49-66)
  unchanged; the freeze test below pins the bytes.

### The candidates compared

| | A (slug union, space form) | B (numeric enum) | C (branded TitleCase) |
| --- | --- | --- | --- |
| Stored keys and OS ids | byte-identical, no migration | every family rewritten, full preference migration, alarms orphan unless a map reproduces the legacy strings byte-for-byte | unchanged, but casing remains the id, so every builder still lowercases: the seam where confusion lives stays open |
| Display string into a key builder | compile error (param is `PrayerId`) | compile error in principle, but unsound (below) | typechecks: a branded string is still a string |
| API record alignment | direct: 9 ids are the field names | needs enum-to-slug map to read `rawData` | needs `.toLowerCase()` anyway |
| Logs, dumps, crash reports | readable | opaque numbers | readable |
| New failure modes | "normalise the space" pull requests, answered by the freeze test | two drift-prone maps (space form for keys, underscore for files) | none removed |

## (b) Migration, step-numbered

No step changes any OS notification identifier. No step writes MMKV migration code.

1. **Pin today's bytes first.** Add the freeze table test (see (c)) against the current
   builders, before any production change.
2. **Declare the vocabulary.** In shared/constants.ts: `STANDARD_PRAYER_IDS` and
   `EXTRA_PRAYER_IDS` (`'last third'` with the space, deliberately), `PRAYER_IDS` their
   concatenation, `type PrayerId`. Retype `NIGHT_PRAYER_NAMES` and `MIDNIGHT_CROSSING_PRAYERS`
   as `readonly PrayerId[]` lowercase.
3. **Type the pure builders, signatures only.** `prayerNotificationIdentifier` and
   `reminderNotificationIdentifier`, `prayerNameSlug`, `DAILY_PRAYERS`, `isDailyPrayer`, both
   channel-id builders, and the four key factories take `PrayerId`. The `.toLowerCase()` calls
   inside them become no-ops that then delete. Steps 3 and 4 land in one commit.
4. **Rename the row field.** `PrayerRow.english` becomes `id: PrayerId`; `arabic` leaves the
   row and resolves via catalog (stored days carry no name fields; rows are never persisted, so
   nothing on disk notices). Update the ~30 read sites per R13 section 1. Display reads become
   `prayerLabel(prayer.id)` against the English catalog, byte-identical rendering. The loading
   sentinel `english: ''` (hooks/usePrayer.ts:89-92) no longer typechecks, which is the point;
   the countdown seed `'Fajr'` (stores/countdown.ts:45) becomes `'fajr'`. Bookkeeping records
   keep their display-snapshot `englishName` strings for logs; they are keyed by index and OS id
   (stores/database.ts:193, 258), so their vocabulary is uncoupled.
5. **Delete the dead machinery.** The cast at shared/prayer.ts:407, the literal comparisons at
   :181, :324, :398-399, rowPress's `'Istijaba'` (components/prayer/rowPress.ts:33), and the
   title-case arrays `PRAYERS_ENGLISH`/`EXTRAS_ENGLISH` outside test fixtures. The 1.0.27 legacy
   array `EXTRAS_ENGLISH_PRE_1_0_27` (stores/notifications.ts:487) stays; it describes old stored
   keys, which are unchanged.
6. **Leave the sweep, the budget walk, and the migration alone.**
   `migrateIndexKeyedAlertPreferences` (:525-598) writes the same name keys this design keeps.

## (c) The test gate: `prayerIdContract.test.ts`

One file, `shared/__tests__/prayerIdContract.test.ts`, in the repo's established
source-contract tradition (`widgetContract.test.ts`, `flags.test.ts` as precedent). Four
assertions:

1. **Freeze table.** For all 11 ids, the derived bytes equal a frozen 2026 table: the four MMKV
   families including both reminder slots (`preference_alert_extra_last third`,
   `preference_reminder_alert_extra_last third_2`, ...), both OS builders (`athan_extra_last
   third_2026-08-28`, `reminder_extra_last third_2026-08-28_15`), the channel id
   (`reminder_last_third_15_v3`), and the sound filename (`reminder_last_third_15.mp3`).
2. **Disk join.** Every id times every interval resolves to an existing file under
   `assets/audio/reminders`, and the directory holds nothing unmapped (67 files, 66 plus
   `reminder.mp3`). A missing binary looks identical to a typo'd slug unless the test reads the
   directory.
3. **Catalog closure.** Every locale's prayer-name map has exactly the 11 ids as keys and
   injective values, so a catalog typo cannot silently render `undefined` names.
4. **Firewall fixtures.** `// @ts-expect-error` on a call passing a localized label to
   `prayerNotificationIdentifier` and the key builders. If someone widens a signature back to
   `string`, the expect-error goes stale and the suite fails.

## (d) Where numeric genuinely wins

Nowhere in this codebase, and the review looked for the win honestly. Numeric wins in the
abstract on three counts: script-neutrality in the strong sense (`fajr` is still an English word
a future maintainer can "correct", while `3` tempts nobody), compactness in binary stores (MMKV
keys here are strings, so that buys nothing), and free ordinality (canonical order is a product
decision, and the 1.0.27 Midnight insertion proves order is a hazard, not an asset).

Against that, three hard losses. Numeric enums are unsound: TypeScript admits any number into a
numeric enum type (TypeScript handbook, type compatibility; microsoft/TypeScript#26362), so B's
claimed type-safety edge over a string union is inverted. B forfeits both natural alignments
(API field names, audio filenames) and must maintain two maps to reach them, which can drift.
And unless B's map reproduces the legacy identifier strings byte-for-byte, it orphans every
armed alarm; a design whose safety depends on a map that imitates existing strings is those
strings with extra steps. The repo has already paid for this lesson once:
`migrateIndexKeyedAlertPreferences` exists because index keys only map to the intended prayer
while data is canonical (stores/notifications.ts:649-652). Numeric ids are index keys with
better manners.

## Assumptions

- Display follows locale, stored strings do not; the identifier ruling holds regardless of the
  open notification-copy question.
- The id for Last Third keeps its space rather than normalizing, because the stored-bytes
  evidence (the pinned space form in device tests) outranks the underscore spellings in the plan
  documents, which are filename slugs misdescribed as ids.
- Widget payload schema changes ride row 39.6's re-push; this design only requires the id to
  exist so that bump has something stable to carry.
