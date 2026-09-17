# Step 1: The sequence starts from the earliest list day that is still current

This file is part of `ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md`. Run every command from
`/Users/muji/repos/rn.athan.uk`. This step is **specified**: you build it from the contracts below.

0. **Anchor check.** Run `bash ai/plans/09-keep-still-due-rows-after-midnight/scripts/check-anchors.sh 1`.
   Expected: one line per anchor `1-1` to `1-14`, each ending in `1`, then `ANCHORS OK`. Any count
   other than `1`: NEEDS REPLAN (`EXECUTOR-BRIEF.md` section 1, item 4).

1. **Goal:** a sequence built at any instant holds every list day that still has a readable row to
   come, so the list on screen after 00:00 is yesterday's while yesterday still has a row due, and
   the countdown, the bar and the "ago" badge measure into that row instead of hiding until the next
   day's Fajr.

2. **Branch:** `git checkout -b fix/keep-still-due-lists-on-screen uat-2`.

3. **Files.** Only these change, apart from `app.json`, `package.json`, the local
   `android/app/build.gradle` and the three plan files:
   - `shared/prayer.ts`;
   - `stores/schedule.ts`;
   - `stores/__tests__/schedule.test.ts`;
   - `shared/__tests__/prayer.test.ts`.

   Nothing under `app/`, `components/`, `hooks/`, `device/`, `stores/notifications.ts`,
   `shared/notifications.ts`, `stores/countdown.ts`, `stores/sync.ts`, `stores/bootstrap.ts`,
   `mocks/`, `e2e/` or `node_modules/` changes.

4. **Tests first (red).**

   **In `shared/__tests__/prayer.test.ts`** (existing suite, `unit` project): add
   `firstStillDueListDay,` to the named import from `'../prayer'` (anchor `1-13` shows the import
   list's neighbourhood; Biome's organize-imports places the new name between `filterApiData,` and
   `getCascadeDelay,`). Then append, at the very end of the file (after anchor `1-14`'s last line),
   this block verbatim:

   ```ts

   // =============================================================================
   // firstStillDueListDay: the earliest list day that is still current (finding 74; owner 2026-09-13:
   // a day stays current until its last readable row has passed)
   // =============================================================================

   /** Stores the given days (FIELDS order) as a download is stored, replacing whatever was stored */
   const storeTimes = (days: Record<string, string[] | (string | null)[]>) => {
     const times: IValidatedApiResponse['times'] = {};
     for (const [date, values] of Object.entries(days)) {
       const entry = {} as Record<Field, string | null>;
       FIELDS.forEach((field, index) => {
         entry[field] = values[index] ?? null;
       });
       times[date] = entry;
     }

     stored.clear();
     for (const record of transformApiData({ city: 'London', times })) stored.set(record.date, record);
   };

   describe('firstStillDueListDay', () => {
     // 2026-06-20's Isha falls at 00:01 BST on the 21st, so between 00:00 and 00:01 the 20th is still current
     const ISHA_AT_0001 = ['02:40', '04:43', '13:02', '17:20', '21:25', '00:01'];
     const days = Object.fromEntries(
       ['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'].map((d) => [d, ISHA_AT_0001])
     );

     it("answers yesterday while yesterday's list still has a readable row to come", () => {
       storeTimes(days);
       expect(firstStillDueListDay(ScheduleType.Standard, new Date('2026-06-20T23:00:30.000Z'))).toBe('2026-06-20');
     });

     it("answers today once yesterday's last row has passed", () => {
       storeTimes(days);
       expect(firstStillDueListDay(ScheduleType.Standard, new Date('2026-06-21T01:00:00.000Z'))).toBe('2026-06-21');
     });

     it('answers today when yesterday is not stored', () => {
       storeTimes({ '2026-06-21': ISHA_AT_0001 });
       expect(firstStillDueListDay(ScheduleType.Standard, new Date('2026-06-20T23:00:30.000Z'))).toBe('2026-06-21');
     });

     it("answers today when every row of yesterday's list is unreadable", () => {
       storeTimes({
         '2026-06-20': ['02:40', '04:43', '13:02', '17:20', '21:25', '00:01'].map(() => null),
         '2026-06-21': ISHA_AT_0001,
       });
       expect(firstStillDueListDay(ScheduleType.Standard, new Date('2026-06-20T23:00:30.000Z'))).toBe('2026-06-21');
     });

     it('answers today for London days, whose last row always falls before midnight', () => {
       storeDays(['2026-10-16', '2026-10-17', '2026-10-18']);
       expect(firstStillDueListDay(ScheduleType.Standard, new Date('2026-10-17T23:30:00.000Z'))).toBe('2026-10-18');
     });

     it("answers yesterday for the Extras list while its Friday Istijaba is still to come", () => {
       // 26 June 2026 is a Friday; its Istijaba falls at 00:20 BST on the Saturday
       const shape = ['01:32', '02:58', '13:31', '17:31', '01:20', '01:44'];
       storeTimes(Object.fromEntries(['2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28'].map((d) => [d, shape])));
       expect(firstStillDueListDay(ScheduleType.Extra, new Date('2026-06-26T23:05:00.000Z'))).toBe('2026-06-26');
     });
   });
   ```

   The six `it`s, one behaviour each:

   | # | `it` name | Proves | Inputs | Asserts |
   | --- | --- | --- | --- | --- |
   | 1 | `answers yesterday while yesterday's list still has a readable row to come` | The look-back answers yesterday while a row of yesterday is after now | The four Isha-00:01 days stored; now `2026-06-20T23:00:30.000Z` (00:00:30 BST on the 21st) | `'2026-06-20'` |
   | 2 | `answers today once yesterday's last row has passed` | The hand-over is the last row's passing, not a wider window | Same days; now `2026-06-21T01:00:00.000Z` (02:00 BST, Isha long past) | `'2026-06-21'` |
   | 3 | `answers today when yesterday is not stored` | An unstored yesterday is never due | Only `2026-06-21` stored; now as in 1 | `'2026-06-21'` |
   | 4 | `answers today when every row of yesterday's list is unreadable` | An unreadable row has no moment to be due by | `2026-06-20` all-null, `2026-06-21` stored; now as in 1 | `'2026-06-21'` |
   | 5 | `answers today for London days, whose last row always falls before midnight` | London's behaviour is byte-identical | The suite's real London days 16 to 18 October 2026; now `2026-10-17T23:30:00.000Z` (00:30 BST on the 18th) | `'2026-10-18'` |
   | 6 | `answers yesterday for the Extras list while its Friday Istijaba is still to come` | The Extras list gets the same rule through its own still-due row | The four Istijaba-shape days stored (26 June 2026 is a Friday); now `2026-06-26T23:05:00.000Z` (00:05 BST on the 27th) | `'2026-06-26'` |

   **In `stores/__tests__/schedule.test.ts`** (existing suite, `unit` project), four edits:

   1. Extend the `@/shared/prayer` mock (anchor `1-5` and `1-6`): above the `jest.mock` call, after the
      two existing `const mock...` declarations, add:

      ```ts
      // The scripted describes above the real builder need no look-back, so the default answers today
      const mockFirstStillDueListDay = jest.fn((_type: ScheduleType, now: Date) =>
        jest.requireActual('@/shared/time').formatDateShort(now)
      );
      ```

      and inside the `jest.mock('@/shared/prayer', ...)` factory object add the property:

      ```ts
        firstStillDueListDay: (type: ScheduleType, now: Date) => mockFirstStillDueListDay(type, now),
      ```

   2. Replace the region that starts at anchor `1-7`'s line (the comment `// Session 7's high-latitude
      shapes...`) and ends at the line BEFORE anchor `1-8`'s `it.each([` (the `['Friday: its
      Istijaba'` block), that is the old comment, the old `postMidnightIsha` fixture and the two old
      `it.each` blocks, with this block verbatim:

      ```ts
          // The high-latitude shapes finding 74 was proven on: a list's last rows fall after 00:00, and the
          // owner ruled a day stays current until its last readable row has passed, not until 00:00
          // (2026-09-13, confirmed with the dashed-times rule 2026-09-17). A launch after 00:00 therefore
          // builds from yesterday while yesterday still has a row to come
          const postMidnightIsha = [
            {
              title: 'Isha at 00:01',
              days: Object.fromEntries(
                ['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'].map((date) => [
                  date,
                  ['02:40', '04:43', '13:02', '17:20', '21:25', '00:01'],
                ])
              ),
              launch: '2026-06-20T23:00:30.000Z',
              yesterday: '2026-06-20',
              next: row('Isha', '2026-06-20', '2026-06-20T23:01:00.000Z'),
              previous: row('Magrib', '2026-06-20', '2026-06-20T20:25:00.000Z'),
              isha: row('Isha', '2026-06-20', '2026-06-20T23:01:00.000Z'),
              ishaAt: '2026-06-20T23:01:00.000Z',
              listDay: '2026-06-21',
              fajrAt: '2026-06-21T01:40:00.000Z',
              sunriseAt: '2026-06-21T03:43:00.000Z',
            },
            {
              title: 'Magrib at 00:40 and Isha at 01:30',
              days: {
                '2026-09-24': ['03:00', '05:00', '13:00', '17:00', '22:30', '23:40'],
                '2026-09-25': ['02:30', '04:30', '13:00', '17:30', '00:40', '01:30'],
                '2026-09-26': ['02:00', '04:00', '13:00', '17:30', '22:00', '23:30'],
                '2026-09-27': ['00:10', '03:00', '13:00', '17:00', '21:00', '22:30'],
                '2026-09-28': ['03:00', '05:00', '13:00', '17:00', '20:58', '22:30'],
              },
              launch: '2026-09-25T23:00:30.000Z',
              yesterday: '2026-09-25',
              next: row('Magrib', '2026-09-25', '2026-09-25T23:40:00.000Z'),
              previous: row('Asr', '2026-09-25', '2026-09-25T16:30:00.000Z'),
              isha: row('Isha', '2026-09-25', '2026-09-26T00:30:00.000Z'),
              ishaAt: '2026-09-26T00:30:00.000Z',
              listDay: '2026-09-26',
              fajrAt: '2026-09-26T01:00:00.000Z',
              sunriseAt: '2026-09-26T03:00:00.000Z',
            },
          ];

          it.each(postMidnightIsha)(
            "keeps yesterday's list on screen from a launch after 00:00, with the bar measured into its still-due rows: $title",
            ({ days, launch, yesterday, next, previous, isha, ishaAt, listDay, fajrAt }) => {
              keepSubscribed(standardNextPrayerAtom, standardDisplayDateAtom, getBarAvailableAtom(STANDARD));

              Object.assign(LONDON_2026, days);
              storeDays(Object.keys(days));
              launchAt(launch);

              expect(observe(STANDARD)).toMatchObject({
                displayDate: yesterday,
                next,
                previous,
                barAvailable: true,
              });

              // The app stays open past yesterday's last row, the boundary the list was waiting for
              jest.advanceTimersByTime(Date.parse(ishaAt) + 5 * 60 * 1000 - Date.parse(launch));

              expect(observe(STANDARD)).toMatchObject({
                displayDate: listDay,
                next: row('Fajr', listDay, fajrAt),
                previous: isha,
                barAvailable: true,
              });
            }
          );

          it.each(postMidnightIsha)(
            "never takes a still-to-come row from storage as the previous row, whatever the sequence holds: $title",
            ({ days, launch, isha, ishaAt, listDay, fajrAt }) => {
              Object.assign(LONDON_2026, days);
              storeDays(Object.keys(days));
              jest.setSystemTime(new Date(launch));

              // The sequence a build before this fix produced, starting at the new calendar day: without
              // yesterday, so the row above next is looked for in storage. A future edit that brings such a
              // sequence back must not measure the bar from a row that has not happened
              getDefaultStore().set(standardSequenceAtom, {
                type: STANDARD,
                prayers: actualPrayer().createPrayerSequence(STANDARD, new Date(`${listDay}T12:00:00Z`), 3).prayers,
              });

              const next = row('Fajr', listDay, fajrAt);
              // Whenever the previous row is looked up, the sequence has just been written
              moveClockTo(new Date(Date.parse(ishaAt) - 1).toISOString());
              refreshSequence(STANDARD);
              expect(observe(STANDARD)).toMatchObject({ next, previous: null, barAvailable: false });

              moveClockTo(ishaAt);
              refreshSequence(STANDARD);
              expect(observe(STANDARD)).toMatchObject({ next, previous: isha, barAvailable: true });
            }
          );
      ```

      The rewritten tests, one behaviour each:

      | # | `it` name (both cases of `$title`) | Proves | Inputs | Asserts |
      | --- | --- | --- | --- | --- |
      | 1a | `keeps yesterday's list on screen from a launch after 00:00, with the bar measured into its still-due rows` | The screen half of the owner's ruling, and gap map item 17's list half | The case's days stored; launch at `launch` (00:00:30 BST) | First: `displayDate` is `yesterday`, `next` and `previous` the case's rows, `barAvailable` true. Then, timers advanced past `ishaAt` + 5 min: `displayDate` is `listDay`, next the next day's Fajr at `fajrAt`, previous the passed Isha, bar available |
      | 1b | `never takes a still-to-come row from storage as the previous row, whatever the sequence holds` | The `findPreviousPrayer` storage guard, now that the fixed build cannot produce such a sequence itself | Same days; the sequence atom hand-set to a build starting at `listDay` (the pre-fix shape) | At `ishaAt` minus 1 ms: previous null, bar unavailable; at `ishaAt` exactly: previous the passed Isha, bar available |

      These REWRITE the two interim blocks the brief names (`hides the bar from a launch after 00:00
      until Fajr...` and `takes yesterday's post-midnight Isha as the previous row only from its own
      instant`); none of their cases is deleted.

   3. Change the assertion of anchor `1-9`'s test (`creates a 3-day sequence using PrayerUtils`) from
      `expect(mockCreatePrayerSequence).toHaveBeenCalledWith(ScheduleType.Standard, date, 3);` to:

      ```ts
          // Nothing is stored, so the earliest still-due list day is today and the build starts at its anchor
          expect(mockCreatePrayerSequence).toHaveBeenCalledWith(
            ScheduleType.Standard,
            new Date('2026-01-20T12:00:00.000Z'),
            3
          );
      ```

   4. Change the assertion of anchor `1-10`'s test (`sets the sequence in the correct atom for Extra`)
      from `expect(mockCreatePrayerSequence).toHaveBeenCalledWith(ScheduleType.Extra, date, 3);` to
      `expect(mockCreatePrayerSequence).toHaveBeenCalledWith(ScheduleType.Extra, new
      Date('2026-01-20T12:00:00.000Z'), 3);`.

   5. In the `on the real builder` `beforeEach`, extend the destructure of anchor `1-11` to
      `const { createPrayerSequence, createPrayersForDate, firstStillDueListDay } = actualPrayer();`
      and add after anchor `1-12`'s line, at the same four-space depth as it:

      ```ts
          mockFirstStillDueListDay.mockImplementation(firstStillDueListDay);
      ```

   **Existing tests that must not change:** every other test in both suites, including `gap map L3:
   the bar measures from the list before when the sequence starts after it`, the R8/R11 blocks, the
   `setSequence signature` blocks and every London-data test. `stores/__tests__/bootstrap.test.ts`,
   `stores/__tests__/sync.test.ts`, `stores/__tests__/countdown.test.ts` and
   `stores/__tests__/widgetSettingsSync.test.ts` are not edited and stay green.

   Run: `npx jest stores/__tests__/schedule.test.ts shared/__tests__/prayer.test.ts --watchman=false --selectProjects=unit > $TMPDIR/red-1.log 2>&1`.

   Expected in `$TMPDIR/red-1.log`: `Tests: 10 failed, 211 passed, 221 total`, failing exactly:
   - `firstStillDueListDay › answers yesterday while yesterday's list still has a readable row to come`
     and the five other `firstStillDueListDay ›` cases, each failing with
     `TypeError: (0 , _prayer.firstStillDueListDay) is not a function`;
   - `keeps yesterday's list on screen from a launch after 00:00, with the bar measured into its
     still-due rows: Isha at 00:01` and `... : Magrib at 00:40 and Isha at 01:30`, failing on the
     first `toMatchObject` with the received `displayDate` naming the day after `yesterday`;
   - `setSequence › creates a 3-day sequence using PrayerUtils` and `setSequence › sets the sequence in
     the correct atom for Extra`, failing with `Expected: "standard", 2026-01-20T12:00:00.000Z, 3` /
     `Received: "standard", 2026-01-20T00:00:00.000Z, 3` (and the Extra pair).

   And passing, by design: both cases of `never takes a still-to-come row from storage as the previous
   row, whatever the sequence holds` (the guard they pin exists today). Any other test failing, or any
   of the named ten passing: STOP and ask "the step 1 red run printed `<Tests line>`; the plan expects
   exactly the ten named failures; what do I do?".

5. **Change.** Build the contracts:

   - **`shared/prayer.ts`, new export `firstStillDueListDay`** (inserted immediately after anchor
     `1-2`'s `getPrayerForDate` block, before the `canonicalDisplayOrder` doc comment):

     ```ts
     /**
      * The earliest list day a sequence must start from: yesterday while yesterday's list still has a
      * readable row to come, today otherwise.
      *
      * A day stays current until its last readable row has passed, not until 00:00 (owner, 2026-09-13), and
      * a row filed under yesterday can fall after midnight (a Magrib or Isha in the small hours, a Friday
      * Istijaba beside them; finding 74). A build that started at today's calendar day left those rows off
      * the screen the moment the list was rebuilt. No earlier day can qualify: a row of the day before
      * yesterday's list falls no later than 05:59 on yesterday, which any moment today is already past.
      *
      * @param type Schedule type (Standard or Extra)
      * @param now The instant the start day is worked out for
      * @returns The YYYY-MM-DD of the earliest list day that is still current
      */
     export const firstStillDueListDay = (type: ScheduleType, now: Date): string => {
       const today = TimeUtils.formatDateShort(now);
       const yesterday = TimeUtils.getPreviousDateString(today);

       return findNextReadable(createPrayersForDate(type, yesterday), now) ? yesterday : today;
     };
     ```

     Contract: answers the earliest list day that is still current; reads only yesterday's list from
     storage through the real `createPrayersForDate`; never writes storage; never throws (an unstored
     or unreadable yesterday answers today); `today` comes from `formatDateShort(now)`, never from the
     clock, so the whole answer hangs on the one instant it is given. `shared/prayer.ts` also gains the
     import `import { findNextReadable } from '@/shared/sequence';` on its own line between anchor
     `1-1`'s two lines (after `} from '@/shared/constants';`, before `import * as TimeUtils from
     '@/shared/time';`). It logs nothing.

   - **`stores/schedule.ts`, `setSequence`** (anchor `1-3`): the three replaced lines become, verbatim:

     ```ts
     export const setSequence = (type: ScheduleType, date: Date): void => {
       const sequenceAtom = getSequenceAtom(type);
       // One instant decides the whole build. After 00:00 it starts from yesterday while yesterday's list
       // still has a row to come, or a rebuild drops those rows off the screen (finding 74)
       const firstDate = PrayerUtils.firstStillDueListDay(type, date);
       const built = PrayerUtils.createPrayerSequence(type, TimeUtils.getDayAnchor(firstDate), 3);
     ```

     and the `extendUntilReadable` call in the same function changes its third argument from
     `TimeUtils.createInstant()` to `date`, so one instant decides the start day and the extension.
     Both log lines of the function (the identical-skip and the set) change their `startDate` field
     from `TimeUtils.formatDateShort(date)` to `firstDate`, so the log names the day the sequence
     really starts from. The log texts `SEQUENCE: Set sequence skipped (identical)` and
     `SEQUENCE: Set sequence` are unchanged. The guard of anchor `1-4` is untouched.

     Contract: `setSequence(type, date)` keeps its signature; every caller (bootstrap, sync's
     `initializeAppState`, sync's `rebuildSequences`, tests) passes the instant the build is for, and
     that one instant now also decides the look-back. It must never re-read the clock inside the
     build. It never logs a new line.

6. **Green.**
   1. Run the red command again, writing to `$TMPDIR/green-1.log`. Expected: `Test Suites: 2 passed,
      2 total`, `Tests: 221 passed, 221 total` (the same 221 tests the red run counted, now green).
   2. Run `npx tsc --noEmit`. Expected: exit 0 and no output. (If Biome has not yet organized the
      edited files' imports, run `npx biome check --write shared/prayer.ts stores/schedule.ts
      stores/__tests__/schedule.test.ts shared/__tests__/prayer.test.ts` once, then this and the next
      check again.)
   3. Run `npx biome check . --error-on-warnings`. Expected: exit 0, ending `No fixes applied.`.
   4. Any difference: STOP and ask "step 1 green printed `<line>`; what do I do?".

7. **Breaks.** Run `bash ai/plans/09-keep-still-due-rows-after-midnight/scripts/breaks-1.sh > $TMPDIR/breaks-1.log 2>&1`
   in the background. It takes about 40 seconds. Expected: three lines starting `BREAK 1`, each saying
   `AS EXPECTED` (1a and 1c each with `Tests: 2 failed, 225 passed, 227 total`; 1b with
   `Tests: 27 failed, 200 passed, 227 total`, because inverting the look-back mis-sizes every London
   sequence too), and the last line `ALL AS EXPECTED: 1`. A line saying `NOT AS EXPECTED` or `the
   substitution did not change`: STOP and ask "break `<name>` did not behave as the plan says:
   `<that line>`; what do I do?". Afterwards, `git status --porcelain` must list only this step's
   files and the three plan files.

8. **Version and commit.**
   1. Run `bash ai/plans/09-keep-still-due-rows-after-midnight/scripts/set-version.sh`. Expected: two
      lines, `VERSION <x.y.z>` and `VERSIONS MATCH`. Any other output: STOP and ask
      "set-version.sh printed `<output>`; how do I set the version?".
   2. Add exactly these files by name: `shared/prayer.ts`, `stores/schedule.ts`,
      `stores/__tests__/schedule.test.ts`, `shared/__tests__/prayer.test.ts`, `app.json`,
      `package.json`, and `ai/plans/README.md`,
      `ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md` and
      `ai/plans/09-keep-still-due-rows-after-midnight/LOG.md` when this session changed them. Run
      `git status --porcelain` afterwards. Every changed file must be staged. Any other line: STOP and
      ask "git status shows `<line>` before the step 1 commit; what do I do?".
   3. Write the commit message below to `$TMPDIR/msg-1.txt`, with `<VERSION>` replaced by the version
      `set-version.sh` printed.
   4. Run `git commit -F $TMPDIR/msg-1.txt > $TMPDIR/commit-1.log 2>&1` in the background, with the
      hang check from `EXECUTOR-BRIEF.md` section 3.
   5. Expected in `$TMPDIR/commit-1.log`: the last `Tests:` line is
      `Tests: 2 skipped, 4515 passed, 4517 total` with no `failed`; the lines `Statements   : 100%`,
      `Branches     : 100%`, `Functions    : 100%` and `Lines        : 100%`; no line starting
      `Coverage gate:`. If only `shared/__tests__/audioMatrix.test.ts` timed out, follow
      `EXECUTOR-BRIEF.md` section 3. Any other failure: STOP and ask "the step 1 commit failed with
      `<first failing line>`; what do I do?".

   The commit message:

   ```text
   <VERSION> - fix(schedule): the sequence starts from the earliest list day that is still current

   Finding 74, screen half. A Magrib or Isha that falls after 00:00 belongs to its own list day, but a
   sequence rebuilt after 00:00 started at the calendar day, so those rows left the screen on the next
   launch or foreground sync, and the bar and the ago badge hid until the next day's Fajr.

   - firstStillDueListDay (shared/prayer.ts) answers yesterday while yesterday's list still has a
     readable row to come, today otherwise. No earlier day can qualify: a row of the day before
     yesterday's list falls no later than 05:59 on yesterday.
   - setSequence builds from that day's anchor and uses the caller's one instant for the whole build;
     its log now names the day the sequence really starts from.
   - The interim behaviour tests are rewritten for the ruling's behaviour (display date, next,
     previous and bar all measured into yesterday's still-due rows), and the storage guard in
     findPreviousPrayer is re-pinned through a hand-built pre-fix sequence.
   - London is unchanged: yesterday's last row always falls before midnight there, so the answer is
     always today and every London sequence and window stays byte-identical (suite-pinned).
   ```

9. **Review.** Spawn a `Code Reviewer` subagent (a `general` subagent prompted as the reviewer),
   isolation `worktree`, with no `model`, and this prompt, with `<sha>` replaced by the step 1
   commit's sha:

   ```text
   Run git checkout --detach <sha>. Your worktree starts at the wrong branch.

   You review one commit in the rn.athan.uk repository, a React Native prayer-times app. The commit is
   step 1 of the plan ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md, executed by another
   model. Read these files in full, with no partial reads:
   ai/plans/09-keep-still-due-rows-after-midnight/steps/1-sequence-starts-from-still-due-day.md,
   ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md sections 4 and 5, __tests__/README.md,
   shared/prayer.ts, stores/schedule.ts, stores/__tests__/schedule.test.ts and
   shared/__tests__/prayer.test.ts.

   Check each item and report every problem you find:
   1. git show <sha> changes exactly the files the step's "Files" part lists, plus app.json and
      package.json, and plan files under ai/plans/ only where they record status or the log.
   2. The contracts hold: firstStillDueListDay answers per its doc comment and reads the clock not at
      all (today from formatDateShort(now)); setSequence uses the caller's instant for the look-back
      AND the extendUntilReadable call, keeps its signature, and both its log lines name the real
      start day; the findPreviousPrayer guard is untouched.
   3. The test edits match the step's verbatim blocks and table rows exactly: the six new
      firstStillDueListDay tests with their inputs and assertions, the rewritten postMidnightIsha
      fixture and both rewritten it.each blocks, the two scripted setSequence assertions, the extended
      prayer mock with its default-answers-today implementation, and the real-builder beforeEach
      wiring.
   4. Every test follows __tests__/README.md, asserts what its row says, and would fail if the line it
      guards were broken; the red run's ten named failures and the two by-design passes are exactly
      what the step predicts.
   5. Comments explain why, never what, and no comment restates the code.
   6. The version in app.json and package.json is the next patch after the parent commit's
      package.json, and both match; the commit message equals the step's message with <VERSION> filled
      in.
   7. Nothing else changed: no visual, no prayer-time value, no other file.

   Reply with numbered findings (file, line, problem, exact fix), then a final line that is exactly
   "merge" or "fix first".
   ```

   A "merge" verdict is a final line that is exactly `merge`. On "fix first", apply only a fix that
   `PLAN.md` section 10 gives word for word, or one that meets all three of `EXECUTOR-BRIEF.md`
   section 4, item 8's conditions (record it in `LOG.md`, rerun the breaks, amend, resend the same
   reviewer); anything else is a STOP.

10. **Merge.**
    `git checkout uat-2 && git merge --no-ff fix/keep-still-due-lists-on-screen -m "Merge fix/keep-still-due-lists-on-screen into uat-2: sequences start from the still-due list day, reviewed"`.

11. **Done when.**
    1. `git branch --show-current` prints `uat-2`.
    2. `git log -1 --format=%s` prints `Merge fix/keep-still-due-lists-on-screen into uat-2: sequences
       start from the still-due list day, reviewed`.
    3. `git status --porcelain` lists nothing but the three plan files.
    4. In `PLAN.md` section 6, replace the whole line that starts `- [ ] Step 1:` with `- [x] Step 1:
       DONE in <merge sha>`, and append the step's record to `LOG.md`: the branch, the commit sha and
       version, the hook's last `Tests:` line and its coverage lines, the break script's last line,
       the review verdict with the reviewer's model (GLM 5.3) and how many rounds it took, and the
       merge sha.
