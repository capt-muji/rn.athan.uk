# Verification 02: prayer identifiers (space-form slug union)

Independent adversarial verification of the identifier design: the prayer identifier becomes a
closed lowercase slug union in the SPACE form (`last third`, not `last_third`), on a row field
renamed `id` (from `english`), because stored MMKV keys and armed OS identifiers already carry those
bytes. The underscore form is the audio-filename / Android res-raw slug. Numeric enums are rejected.
Every key family and builder checked byte-for-byte. Branch `verify/39-localisation-deepseek-20261009`
at `52109ec0`. No file was modified.

## Findings

### F1. The four MMKV preference key families use the space form. CONFIRMED.
All apply only `.toLowerCase()` and preserve the space.
- `stores/notifications.ts:207` `preference_alert_${type}_${prayerName.toLowerCase()}` gives
  `preference_alert_extra_last third`.
- `stores/notifications.ts:241` `reminderSlotSuffix` appends `_2` for slot 1, giving
  `preference_reminder_alert_extra_last third_2`.
- `stores/notifications.ts:257-260` `preference_reminder_alert_extra_last third` and `..._2`.
- `stores/notifications.ts:277-280` `preference_reminder_interval_extra_last third` and `..._2`.
- `stores/notifications.ts:333-337` `preference_notification_repair_extra_last third`.
Pinned tests agree: `stores/__tests__/notificationPreferenceSetters.test.ts:133` expects the literal
`preference_reminder_alert_extra_last third`.

### F2. The OS notification identifiers use the space form. CONFIRMED.
`device/notifications.ts:49-50` `athan_${scheduleType}_${englishName.toLowerCase()}_${date}` and
`:61-66` `reminder_..._${intervalMinutes}`. Frozen bytes: `device/__tests__/notifications.test.ts:47-49`
asserts `athan_extra_last third_2026-08-28` explicitly ("so casing never produces a second identity").

### F3. Audio filenames use the underscore form, and there are 67. CONFIRMED.
`shared/notifications.ts:147` `prayerNameSlug` replaces whitespace with `_`, giving `last_third`.
`assets/audio/reminders/` holds 67 files (11 prayers x 6 intervals = 66, plus `reminder.mp3`). The
extras files carry the underscore form (`reminder_last_third_15.mp3`, `reminder_midnight_30.mp3`).
The Android res/raw `[a-z0-9_]` constraint is cited at `shared/notifications.ts:142`.

### F4. The underscore form is also the Android reminder channel id. CONTRADICTED (claim wording).
The claim says the underscore form is only the audio filename / res-raw slug.
`shared/notifications.ts:387-390` builds `reminder_${slug}_${intervalMinutes}_v3`, so the reminder
channel id is `reminder_last_third_15_v3`, a system channel id, not a res/raw resource. The daily and
extras at-time channels carry no prayer name (`:380` `athan_N_v4`, `:396` `extras_at_time_v3`).
Substantively the underscore form is confined to Android audio and channel surfaces, so the design
conclusion is unaffected, but the design's wording should say "audio filename and Android reminder
channel id".

### F5. The day-record lookup never sees the space form. CONFIRMED.
`shared/types.ts:108-122` stores `date` plus nine lowercase single-word fields (`fajr`..`istijaba`), no
name fields. `shared/prayer.ts:407` does `rawData[name.toLowerCase()]`, but `shared/prayer.ts:398-401`
returns early for `Midnight` and `Last Third` (confirmed by `:179-182`), so the space-form id never
reaches the lookup. The nine single-word ids map byte-for-byte onto the record keys.

### F6. There is no persisted surface with a third form. CONFIRMED.
The only two forms are the space form (keys, OS ids) and the underscore form (audio file, Android
reminder channel id). Two persisted value carriers hold Title Case but are not identifier surfaces:
bookkeeping records store `englishName` as a value with the key built from the space-form OS id, and
the widget timeline stores `name`/`nextName` as display copy (`shared/widgetTypes.ts:48-53,80-81`).

### F7. Widget schema is unaffected by the rename. CONFIRMED, with a display dependency.
The JSON field names are `name`/`nextName`, not the value form, so renaming `PrayerRow.english` to
`id` changes neither `WIDGET_PROPS_VERSION` (`shared/widgetTypes.ts:14`) nor the snapshot version.
But `shared/widgetTimeline.ts:135` `name: prayer.english` and `:188` `nextName: next.english` are
display reads. They must become `prayerLabel(prayer.id)` or the widget renders lowercase ids, and the
eyebrow at `widgets/PrayerWidget.tsx:378` (`.toUpperCase()`) and the row key at `:737` carry them.
Keys stay unique. R15 seam 5 already requires the label resolver.

### F8. The migration and the 1.0.27 legacy array already use the space form. CONFIRMED.
`stores/notifications.ts:487` `EXTRAS_ENGLISH_PRE_1_0_27 = ['Last Third', 'Suhoor', 'Duha', 'Istijaba']`.
`stores/notifications.ts:525-598` `migrateIndexKeyedAlertPreferences` writes the same space-form keys
(`:570` `prayerName.toLowerCase()`). `INDEX_KEY_PATTERN` (`:493`) matches only numeric-suffix keys, so
it never touches already-name-keyed preferences. After the union lands, `.toLowerCase()` on an
already-lowercase literal is a no-op, so the written bytes are unchanged.

### F9. The space form is the only candidate with zero migration and zero re-arm. CONFIRMED.
The record's rejection of the underscore form and of numeric enums is sound. The underscore form
would rewrite four preference families (27 name keys) and orphan every armed OS identifier unless a
compatibility map reproduced the space form byte-for-byte, which is the space form with extra steps.
Numeric enums are additionally unsound in TypeScript and forfeit the API-record and audio-name
alignments. See `R15-IDENTIFIER-DESIGN.md` section (d).

### F10. A sequencing dependency is load-bearing and must be stated. CONFIRMED.
If only the row field is renamed and the literal comparisons at `shared/prayer.ts:181,324,398-399`,
`components/prayer/rowPress.ts:33` and the night arrays stay Title Case, then an id of `last third`
fails `isNightRow`, falls through to `rawData['last third']` (undefined), and the row renders
unreadable with no error. R15 names this. It is a step-ordering requirement, not a defect in the
space-form choice.

## Break attempts

- A different stored form: none found on any key or identifier surface. Values that hold Title Case
  are display copy only.
- A builder that transforms the name so a lowercase literal would miss: 23 `.toLowerCase()` sites,
  all pure lowercasing. The only `.replace()` is `prayerNameSlug`, the intended underscore
  derivation. A lowercase literal is a fixed point.
- A React key, JSON field or log identity the rename breaks: the widget React key is value-based so
  uniqueness survives, JSON field names are unaffected, and the log identities (`schedulePlanKey`,
  `prayerIdentity`) are in-memory only.
- A third form: none.
- The single-word record lookup unsafe for the space-form id: safe, the night-row branch returns
  first.

## Better alternative and real cost

None beats the space-form union on cost. The single worthwhile refinement is to widen the record's
own wording from "audio-filename / res-raw slug" to "audio filename and Android reminder channel id",
and to keep the R15 freeze table's channel row (`reminder_last_third_15_v3`) so the underscore
rendering is pinned beside the space-form identifiers. Cost: one sentence and one table row.
