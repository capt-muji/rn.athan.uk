# Step 01: the freeze test

Pin today's identifier bytes before any production byte moves. This step is a pin, not a
red-first change: the suite lands green against unchanged code, and the break script proves
each guarded line by mutation.

Requirements: R2.1

- Branch: `feat/38-01-freeze-test`
- Files added: `shared/__tests__/prayerIdContract.test.ts` (unit project, `*.test.ts`)
- Files changed: `stores/notifications.ts` (one word: `export` on
  `EXTRAS_ENGLISH_PRE_1_0_27`, the frozen legacy array the suite pins)
- Anchors: `constants-arrays`, `atom-factory`, `reminder-atoms`, `slug`, `channel-reminder`, `channel-configs`, `extras-channel`, `device-ids`, `db-record-add`, `scheduled-record-type`, `migration-core`

## The suite

`shared/__tests__/prayerIdContract.test.ts`, doc comment: "The frozen 2026 identifier bytes: the prayer vocabulary, the keys and OS ids it derives, the audio files it joins, and the legacy families it must keep reading."

Imports: `fs` and `path` from node, `ScheduleType, AlertType` from `@/shared/types`, `PRAYERS_ENGLISH, EXTRAS_ENGLISH` from `@/shared/constants`, `prayerNameSlug, getReminderNotificationSound, reminderAndroidChannelId, athanAndroidChannelId, extrasAndroidChannelId, atTimeAndroidChannelId, isDailyPrayer, EXTRAS_ENGLISH_PRE_1_0_27` from `@/shared/notifications` (the pre-1.0.27 array is exported by `stores/notifications.ts`; import it from there), `prayerNotificationIdentifier, reminderNotificationIdentifier` from `@/device/notifications`.

`const DATE = '2026-08-28';` and `const INTERVALS = [5, 10, 15, 20, 25, 30] as const;`

Tests, each one behaviour:

1. `it('pins the eleven ids in canonical order, both arrays')` - the derived list
   `[...PRAYERS_ENGLISH, ...EXTRAS_ENGLISH].map((n) => n.toLowerCase())` equals the frozen
   literal array `['fajr','sunrise','dhuhr','asr','magrib','isha','midnight','last third','suhoor','duha','istijaba']`.
   This pins order as well as membership (ID-6: a reordered array makes one prayer cancel
   another's alarms).
2. `it('pins the four preference-key families including both reminder slots')` - for a frozen
   table of exact strings, each literal appears in the derived set built as
   `preference_alert_${type}_${id}`, `preference_reminder_alert_${type}_${id}${suffix}`,
   `preference_reminder_interval_${type}_${id}${suffix}` for both schedules and suffixes
   `''` and `'_2'`. The frozen table includes at minimum:
   `preference_alert_standard_fajr`, `preference_alert_extra_last third`,
   `preference_reminder_alert_extra_last third`,
   `preference_reminder_alert_extra_last third_2`,
   `preference_reminder_interval_standard_sunrise`,
   `preference_reminder_interval_extra_istijaba_2`, and one member of every family for both
   schedules. Derivation mirrors `atom-factory` and `reminder-atoms` byte for byte.
3. `it('pins both OS identifier builders with the space form')` -
   `prayerNotificationIdentifier(ScheduleType.Extra, 'Last Third', DATE)` equals
   `'athan_extra_last third_2026-08-28'` and
   `reminderNotificationIdentifier(ScheduleType.Extra, 'Last Third', DATE, 15)` equals
   `'reminder_extra_last third_2026-08-28_15'`, plus the same two for `'Fajr'` on Standard
   (`athan_standard_fajr_2026-08-28`, `reminder_standard_fajr_2026-08-28_15`).
4. `it('pins the Android channel ids including the underscore forms')` -
   `reminderAndroidChannelId('Last Third', 15)` equals `'reminder_last_third_15_v3'`,
   `athanAndroidChannelId(0)` equals `'athan_1_v4'`, `extrasAndroidChannelId` equals
   `'extras_at_time_v3'`, and `atTimeAndroidChannelId('Sunrise', 3)` equals
   `'extras_at_time_v3'` while `atTimeAndroidChannelId('Asr', 3)` equals `'athan_4_v4'`.
5. `it('pins the channel-name formats in English')` - a frozen-literal check that the name
   format strings exist verbatim in `shared/notifications.ts` source (read the file with `fs`
   and assert `.includes("name: `Athan ${soundIndex + 1}`")`, `.includes("name: 'Extra Times'")`,
   and the reminder name pattern `` `${englishName} in ${intervalMinutes}m Reminder` ``).
   Source-text pins are allowed here because the names are frozen English until row 39.
6. `it('pins the daily-prayer truth table')` - for every one of the 11 title-case names,
   `isDailyPrayer(name)` equals the frozen per-name boolean (`true` for Fajr, Dhuhr, Asr,
   Magrib, Isha; `false` for Sunrise, Midnight, Last Third, Suhoor, Duha, Istijaba).
7. `it('pins one bookkeeping record key per family')` - the format strings
   `` `scheduled_notifications_${scheduleType}_${prayerIndex}_${notification.id}` `` and the
   reminders twin appear verbatim in `stores/database.ts` source (fs read), and a composed
   literal `'scheduled_notifications_standard_0_athan_standard_fajr_2026-08-28'` equals the
   format with the step-3 identifier filled in.
8. `it('pins the index-keyed legacy family and its migration map')` - the pattern source text
   in `stores/notifications.ts` pins
   `/^preference_(alert|reminder_alert|reminder_interval)_(standard|extra)_\d+$/` exactly
   (fs read of the `INDEX_KEY_PATTERN` line), and `EXTRAS_ENGLISH_PRE_1_0_27` equals
   `['Last Third', 'Suhoor', 'Duha', 'Istijaba']` frozen verbatim with its order (the
   pre-1.0.27 array carries no Midnight). This step adds `export` to that const
   (`stores/notifications.ts:487`, a one-word diff) so the suite can import it.
9. `it('joins every id and interval to an existing audio file, and the directory holds nothing unmapped')` -
   `fs.readdirSync(path.join(__dirname, '../../assets/audio/reminders'))` returns exactly 67
   files; for every one of the 11 names and every interval,
   `getReminderNotificationSound(AlertType.Sound, name, interval)` names a file in that
   directory; the set difference between the directory and the mapped names plus
   `'reminder.mp3'` is empty.

## Green

`npx jest shared/__tests__/prayerIdContract.test.ts --watchman=false --selectProjects=unit` -
all pass, `Tests: 9 passed`. Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.

Planner's scratch-worktree proof at `c3149dfc` (2026-10-10): a draft of this table passed
8/8; mutating `prayerNameSlug`'s underscore to a hyphen failed exactly the channel-id and
disk-join tests. Expect the same numbers.

## Break script

`$TMPDIR/break-38-01.sh`, run from the repository root with bash. It applies one mutation at a
time, runs only the named test, expects the failure, and restores:

1. In `shared/notifications.ts` change `replace(/\\s+/g, '_')` to `replace(/\\s+/g, '-')` in
   `prayerNameSlug`. Tests 4 and 9 must fail (channel id and filenames).
2. In `device/notifications.ts` change the at-time template's `${englishName.toLowerCase()}`
   to `${englishName.toLowerCase().replace(/ /g, '_')}`. Tests 3 and 7 must fail.
3. In `shared/constants.ts` swap the order of `'Magrib'` and `'Isha'` in `PRAYERS_ENGLISH`.
   Test 1 must fail.
4. Delete `'midnight'` from the frozen literal in test 1's assertion list (edit the test file).
   Test 1 must fail with a diff naming the missing member.

Each block ends by restoring the file (`git checkout -- <file>`) and printing `BREAK k: AS EXPECTED`.
The script ends `ALL AS EXPECTED: 1` only if every mutation produced its named failure.

## Version and commit

Version per the version command. Commit message:
`<VERSION> - feat(i18n): prayerIdContract freeze test pins the 2026 identifier bytes`

Add by name: `shared/__tests__/prayerIdContract.test.ts`, `stores/notifications.ts`.

## Review checklist

Read `git show <sha>` cold. The suite pins bytes, it does not describe intent: no test may
import a production builder and re-derive its own expectation from the same builder. Shipped
classes: Residue (no helper exported that nothing reads). The fs reads use `__dirname`-relative
paths that resolve on both macOS runners. No coverage ignore.

## Done when

Suite green, tsc and Biome clean, break script ends `ALL AS EXPECTED: 1`, hook reports the
`Tests:` line and four 100% lines, merged `--no-ff`.

## Restore

`git checkout -- shared/notifications.ts device/notifications.ts shared/constants.ts`; delete
`shared/__tests__/prayerIdContract.test.ts` if uncommitted.
