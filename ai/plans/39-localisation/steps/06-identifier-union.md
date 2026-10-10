# Step 06: the identifier union takes the row

`PrayerRow.english` becomes `id: PrayerId`. Every display read becomes `prayerLabel(id)`
(byte-identical). Every builder takes `PrayerId` and stops lowercasing. The record lookup
narrows through `StoredPrayerId` and the unsafe cast dies. The migration is rewritten line by
line. The firewall fixtures join the contract test.

Requirements: R1.1, R2.1, R3.1

- Branch: `feat/38-06-union`
- Anchors: `prayerrow-type`, `namesforDate`, `unreadable-row`, `night-branch`, `atom-factory`,
  `reminder-atoms`, `migration-core`, `migration-loop`, `migration-calls`,
  `multi-schedule-sig`, `reschedule-head`, `reschedule-generations`, `useprayer-sentinel`,
  `countdown-seed`, `countdown-selected`, `countdown-next`, `ago-text`,
  `rowpress-istijaba`, `sequence-listposition`, `plan-key`, `athan-identifier`,
  `reminder-identifier`, `slug`, `reminder-sound`, `scheduled-record-type`
- Files: every file in R13 sections 1 to 4 (the census is the map); the suites R14's table
  names for categories 1 and 4 (the same fixtures as step 04, now re-keyed to ids)

## The migration rewrite, line by line (`stores/notifications.ts`, `migration-core`,
`migration-loop`, `migration-calls` anchors)

- `const extrasSourceNames = usesPreMidnightExtras(storedVersion) ? EXTRAS_ENGLISH_PRE_1_0_27 : EXTRAS_ENGLISH;`
  becomes `... : EXTRAS_TITLES` where `EXTRAS_TITLES` is the title-case rendering derived once:
  `EXTRA_PRAYER_IDS.map(idToTitle)` is forbidden (no derived title-casing); instead
  `shared/constants.ts` keeps `PRAYERS_ENGLISH`/`EXTRAS_ENGLISH` renamed to
  `STANDARD_PRAYER_TITLES`/`EXTRA_PRAYER_TITLES` with the same members, documented as the
  migration-era legacy spelling of the ids. `EXTRAS_ENGLISH_PRE_1_0_27` stays verbatim (it
  describes old stored keys, R15 b5).
- `const currentNames: readonly string[] = isStandard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;`
  becomes `isStandard ? STANDARD_PRAYER_TITLES : EXTRA_TITLES` (same strings, new names).
- The atom factories' `prayerName.toLowerCase()` calls become the id itself: the factory
  parameter retypes to `PrayerId` and the template drops `.toLowerCase()` (`atom-factory`,
  `reminder-atoms`). The derived keys do not move by one byte - the freeze table proves it.
- `const name = prayerName.toLowerCase();` in the migration loop stays (its sources are
  title-case legacy arrays), keeping the loop's key bytes identical.

## Change contracts

1. `shared/types.ts`: `PrayerRow.id: PrayerId` replaces `english: string`.
2. `shared/prayer.ts`: builders take and write `id`; `getPrayerNamesForDate` returns
   `PrayerId[]` (the id arrays with the Friday filter on `'istijaba'`); the night-row branch
   (`night-branch`) narrows: `const isNightRow = type === ScheduleType.Extra && (id === 'midnight' || id === 'last third');`
   and the record lookup becomes `rawData[id as StoredPrayerId]` - then delete the cast by
   restructuring: `if (id === 'midnight' || id === 'last third')` already returned above, so
   after the istijaba/night early return the remaining `id` is `StoredPrayerId` and the lookup
   is `rawData[id]` with no assertion. `NIGHT_PRAYER_NAMES` and `MIDNIGHT_CROSSING_PRAYERS`
   retype to `readonly PrayerId[]` (lowercase members, same order); their `as` casts at the
   includes-sites delete.
3. Display reads become `prayerLabel(row.id)`: `Prayer.tsx` render, `Alert.tsx` labels and
   sheet write (`prayerEnglish` becomes `prayerId: PrayerId` in `AlertSheetState`), the ago
   badge (`ago-text`: `` `${prayerLabel(prevPrayer.id)} now` ``), the countdown name slot and
   seed (`countdown-selected`, `countdown-next`, `countdown-seed`: `'fajr'`), the widget
   timeline name props
   (`timeline-names`, `timeline-next`: `prayerLabel(prayer.id)`) - byte-identical output.
4. Builders retype: `prayerNotificationIdentifier(scheduleType, id: PrayerId, date)` drops
   `.toLowerCase()` (`athan-identifier`, `reminder-identifier`); `prayerNameSlug(id)` becomes the derived underscore
   rendering of the space form and keeps its exact output; `DAILY_PRAYERS` becomes a
   `ReadonlySet<PrayerId>`; `isDailyPrayer(id: PrayerId)`; both channel-id builders take
   `PrayerId`; `atTimeAndroidChannelId(id, soundIndex)`; `genNotificationContent` splits its
   parameter: `(id: PrayerId, alertType, soundIndex)` builds the title from
   `` `${prayerLabel(id)} now` `` and the sound from the id; the reminder twin likewise
   (R15's param split). The plan-key walk (`plan-key`) keys by `id`.
5. The loading sentinel (`useprayer-sentinel`): the loading return sets `id: 'fajr'` with the
   existing `time: ''`/`date: ''` emptiness flags; the suite pins that the loading frame's
   name slot is never drawn (existing empty-state assertions hold).
6. `rowPress`'s Istijaba equality becomes `row.id === 'istijaba'`; `sequence.ts`'s
   `listPosition` takes the id arrays; `canonicalPrayerIndex(type, id, fallbackIndex)` keeps
   its fallback semantics exactly (R13 seam 3 - the fallback exists for the loading frame).
7. `prayerIdContract.test.ts` gains the firewall: `// @ts-expect-error display strings never
   reach key builders` above a call passing `prayerLabel('fajr')` to
   `prayerNotificationIdentifier`, `createPrayerAlertAtom`, `reminderAndroidChannelId` and
   `getReminderNotificationSound`. The step-01 table's builder calls change their arguments
   from `'Last Third'` to `'last third'` (same outputs - that is the pin working).

## Red

1. `shared/__tests__/prayer.test.ts`: `it('keys the stored-day lookup by the id')` - build an
   Extra list where `midnight`/`last third` rows carry instants; assert rows carry `id` and
   no `english`. Fails today.
2. `device/__tests__/notifications.test.ts`: `it('builds the space-form identifier from the id')` -
   `prayerNotificationIdentifier(ScheduleType.Extra, 'last third', '2026-08-28')` equals the
   frozen byte. Fails today (signature takes a title-case string and lowercases; passing the
   id form yields a double-lowercased but identical string - so the red comes from the type:
   record the tsc error on the old signature expecting `string` receiving the new
   `PrayerId`-typed fixture. State this in LOG.md as a type-red, not runtime-red).
3. The category-1/4 suites re-key fixtures from names to ids with the surface, keeping every
   behaviour assertion.

## Green

Every named suite green; tsc clean is the step's main gate (the rename is compiler-driven).
Biome clean. Contract test green with unchanged frozen outputs.

## Break script

1. In `shared/prayer.ts` revert the night-branch narrowing (`id === 'midnight'` back to a
   `String(id)` comparison against `'Midnight'`). Named test 1 fails (night rows unreadable).
   Restore.
2. In `device/notifications.ts` make the at-time builder slugify (`prayerNameSlug` style).
   The contract test's space-form pins fail. Restore.
3. In `stores/notifications.ts` change the alert-key factory template to
   `preference_alert_${type}_${id}_x`. Contract test test 2 fails. Restore.
4. Widen `isDailyPrayer` to `(x: string)`: the contract test's firewall
   `@ts-expect-error` lines go stale and the suite fails (that is the firewall's job).
   Restore. End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): the row carries PrayerId, display reads prayerLabel, builders retype`

## Review checklist

Hunt by name: any surviving `.english` read, any `toLowerCase()` left on an id path (dead
code), any display string reaching a key builder (the firewall proves the type edge). Shipped
classes: Residue (deleted title-case arrays outside their migration-era home), Rule (no key or
identifier byte moved - the contract test is the proof, name it in the review).

## Done when

`grep -rn '\.english' shared/ stores/ components/ hooks/ device/ widgets/ --include='*.ts*' | grep -v '__tests__'`
returns nothing; contract test green; break `ALL AS EXPECTED: 1`; hook lines as step 01;
merged `--no-ff`.

## Restore

`git checkout --` each changed file; delete any new file the step created.
