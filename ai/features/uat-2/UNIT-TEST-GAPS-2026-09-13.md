# Unit-test gap map: 00:00, London DST, unreadable times, first stored day

Repo `rn.athan.uk`, commit `7075290` (1.26.28), analysed 2026-09-13. Read-only.

**Method.**
- **Scope.** I read every test that touches the five scenarios and traced each one against the code.
- **"Would it fail if broken?"** means a realistic break turns the test red:
  - the midnight shift removed
  - a cutoff off by one
  - one half of a matched pair drifting
  - the alarm path diverging from the list
- **Lines.** The line cited is the `it(` line.
- **Clock dependence was measured.** I ran the unmodified suite with the clock pinned through an inline `jest --config` JSON (`fakeTimers.now`, Jest 30.5.1).
- **What was written.** Nothing except Jest's own cache under `$TMPDIR` (`/var/folders/...`) and the original of this map.
- **"By trace".** Items marked this way were reasoned from code, not executed.

**Working tree during the analysis.** A 1.26.29 version bump was staged in the checkout while this ran. The runs made after that (the 23:59:41 and 25 October rows below) also failed `shared/__tests__/versionLockstep.test.ts`, because the local Android `versionName` still said 1.26.28. No analysed source or test file differs from `7075290`.

**Oracle.** The independent standard-library recomputation of every 2026 London row, described in `AUDIT-FINDINGS.md` under "Session 1 of the queue".

**Device evidence since this map was drafted (`AUDIT-FINDINGS.md`, findings 72 to 77), and what it changes here.**
- **What the device and the differential established.**
  - uat against uat-2 found no regression: 842 of 6,248 rows differ, and every one is an intended fix.
  - Every Isha, Magrib, Istijaba, Suhoor and night row either side of 00:00 fired on its armed second (high-latitude mock, 17 of 17).
  - Both 2026 London clock changes fired exactly.
  - Finding 72's substituted Magrib fired 21 minutes late: the 29 Mar list's Last Third was armed at `2026-03-29T01:15:00.000Z`, against the true `00:54:00.000Z`.
- **The verdicts below are unchanged.** A device pass proves this build once. This map asks whether a unit test would catch the next break.
- **L1 and L2 were since confirmed on the device (finding 74).** The first high-latitude pass armed its rows from Friday's commits and fired them with no reschedule in between, so it could not show L1. A later run returned to the app after 00:00 (Friday's 00:40 Magrib and 01:30 Isha left the screen), then rescheduled (both alarms cancelled), and nothing fired at 00:40 or 01:30.
- **C6 was seen on the device.** In the first high-latitude pass, the Midnight rows at 00:00, 23:59 and 00:01 were never armed, because re-committing Magrib alone does not roll the Midnight window.

Path abbreviations used in the tables:

| Abbreviation | File |
|---|---|
| `P` | `shared/__tests__/prayer.test.ts` |
| `N` | `shared/__tests__/nightTimes.test.ts` |
| `T` | `shared/__tests__/time.test.ts` |
| `SHN` | `shared/__tests__/notifications.test.ts` |
| `DN` | `device/__tests__/notifications.test.ts` |
| `SN` | `stores/__tests__/notifications.test.ts` |
| `SCH` | `stores/__tests__/schedule.test.ts` |
| `CD` | `stores/__tests__/countdown.test.ts` |
| `SY` | `stores/__tests__/sync.test.ts` |
| `API` | `api/__tests__/client.test.ts` |
| `AUDIT` | `ai/features/uat-2/AUDIT-FINDINGS.md` |

## Gaps per scenario

| Scenario | Sub-cases | Covered | GAP |
|---|---:|---:|---:|
| A. Rows either side of 00:00 | 18 | 3 | **15** |
| B. London DST 2026 | 10 | 6 | **4** |
| C. Clock reaches 00:00 while running | 7 | 0 | **7** |
| D. Unreadable API times | 9 | 2 | **7** |
| E. First stored day's night rows | 5 | 0 | **5** |
| **Total** | **49** | **11** | **38** |

## Measured: tests that fail by time of day, not because the code broke

| Pinned clock (London) | Result |
|---|---|
| 12:00 BST, full suite, 1,222 tests (control) | 13 failures that appear identically in every pinned run below (hooks/useNotification dialogs, athanDurations, audioMatrix, one sync parallel-fetch case). Not clock-dependent |
| **00:00:00 BST**, full suite | control plus 8: `API:127, :133, :140, :146, :152, :156, :183, :215` |
| 00:30 BST and 00:59 BST, `API` only | 8 of 15 fail |
| 01:00 BST, and 00:30 GMT on 1 Dec, `API` only | 15 of 15 pass |
| 23:59:41 BST, full suite | control plus `stores/__tests__/widgetSettingsSync.test.ts:321` "flip pushes reuse the cached sequence instead of re-reading the prayer DB" (AUDIT Lead 2, reproduced), plus versionLockstep (environmental, above) |
| 01:30 BST on 25 Oct (first pass of the repeated hour), full suite | control plus versionLockstep only. Nothing DST-specific |

**Cause of the eight.**
- `API:117`, `:167`, `:228` and `:250` build "today" from `toISOString()`, which is the UTC date.
- `validateApiTimes` uses London's date (`api/client.ts:60`).
- From 00:00 to 00:59 BST, the fixture's "today" is therefore London's yesterday.
- So every day-shape test fails for that hour each summer night. That fails the pre-commit gate for any commit made in that hour, since `yarn validate` runs the whole suite.

## Latent defects found while mapping (by trace, not executed)

| # | Defect | Where | Reach |
|---|---|---|---|
| L1 | A reschedule after 00:00 cancels the still-due alarm of a row filed under yesterday's list. The window starts at the calendar day, and the stale-cancel removes every recorded id it did not re-attempt | `shared/notifications.ts:157-161`; `stores/notifications.ts:625-643`, `:769-795` | Isha or Magrib after 00:00; Friday Istijaba when Magrib is 01:00 or later. None in London 2026 (the oracle found 0 such readings) |
| L2 | A sequence built after 00:00 drops those rows. It is rebuilt on every cold launch and every foreground sync | `shared/prayer.ts:419-439`; `stores/sync.ts:82-83` via `device/listeners.ts:54` | as L1 |
| L3 | `getYesterdayFinalPrayer` rebuilds yesterday's last row from its clock string with no midnight shift. A post-midnight Isha, or an Istijaba from a Magrib at 01:00 or later, comes out 24 h early for the progress bar | `stores/schedule.ts:82-92` | as L1 |
| L4 | Suhoor for a Fajr before 00:20 falls the evening before its list day but gets the base window. Nothing is armed between that Suhoor and the next reschedule (finding 12's buffer loss, now for Suhoor) | `shared/notifications.ts:170`, `:183-187` | Fajr before 00:20 (high latitude) |
| L5 | The first stored day, and the day after a dropped day, get a substituted Magrib. It is armed as well as rendered | `shared/prayer.ts:149-150`, used by `getPrayerForDate` at `:468-477` | London list 2026-01-01 (finding 72); any day after a dropped day. Proven on the device: the 29 Mar list fired 21 min late |
| L6 | On 1 January with no 31 December record, a rejected previous-year fetch rejects `sync()` | `stores/sync.ts:65-78` | Only if the endpoint serves the current year alone, as measured in finding 69 |

## Tests that give false confidence

- **They pin the substitution the owner forbade.** `N:194` and `N:212` both assert the substituted Magrib (finding 70).
- **They never call the code.** `SCH:685` "filters out passed prayers not belonging to current display date" and `SCH:712` "keeps previous prayer for progress bar calculation" re-implement the filter inline.
- **They test copies.**
  - `hooks/__tests__/usePrayerSequence.test.ts:50-66` is a copy of the hook.
  - `hooks/__tests__/useCountdown.test.ts:12-32` mocks `@/shared/time` and then asserts its own mock (AUDIT Lead 1).
- **Titles contradict the assertion.**
  - `P:81` "assigns Midnight at 00:30 (stored on previous calendar day) to next day" asserts the same day.
  - `P:98` "assigns Suhoor to next day when hour >= 12" uses 05:30 and asserts the same day.
  - `T:809` "maps the nonexistent skipped hour via the pre-transition offset" expects `00:30Z`, which is the post-change offset.
- **They test a path production never takes.** `P:90`, `P:230` and `P:273` exercise `calculateBelongsToDate` under the names "Last Third" and "Midnight". Production never sends those rows through it (`shared/prayer.ts:366-378`).

---

## A. Rows either side of 00:00

| # | Sub-case | Tests (file:line "title") | Would it fail if broken? | Verdict |
|---|---|---|---|---|
| A1 | Isha 23:59: instant on D, list D, at-time and reminder armed | None at hour 23. Nearest: `P:42` "assigns Isha at 21:00 to current day (normal evening)"; `N:301` "leaves every other row on its own stored time and day (Suhoor, Duha, Istijaba and all six prayers)" (London 2024, Isha at most 22:44) | No. No Isha at hour 23 is asserted anywhere, so a cutoff that also shifted hour 23 passes. Nothing armed | GAP |
| A2 | Isha 00:00 and 00:01: instant D+1, list D, armed | `N:245` "stays on its own day's list at the next calendar day's instant, and getPrayerForDate agrees" (00:30). `P:29` "assigns Isha at 00:45 to previous day". `P:73` "handles January 1st rollover to previous year". `P:203` "assigns summer Isha at 00:45 to previous Islamic day". `P:210` "...at 01:15...". `P:238` "handles Isha rollover from Jan 1 to Dec 31" | Partly. The rule reads the hour only, so hour 0 is pinned at 00:30 on the list and on the alarm-read path. The boundary minutes are never stated. Nothing armed | GAP |
| A3 | Isha 05:59 and 06:00 (EARLY_MORNING_CUTOFF) | `P:36` "assigns Isha at 05:59 to previous day (before 6am cutoff)"; `P:216` "does NOT assign Isha at 06:00 to previous day (cutoff boundary)" | Partly. The grouping half is pinned on both sides. The instant half (`shared/prayer.ts:328`) has no 05:59/06:00 list case, so a change to that half alone survives. Nothing armed | GAP |
| A4 | Post-midnight Isha or Magrib armed, then a reschedule between 00:00 and the instant | None. Every reschedule test is frozen at `2026-08-29T08:00:00Z` (`SN:1045`) | No test exists; L1 passes unseen | GAP |
| A5 | Magrib 23:59, not shifted | None. `P:66` "assigns Magrib to current day" is 17:45. `N:472` "crosses into the post-midnight season without a discontinuity" has Magrib 23:58 in its fixture but asserts only the spacing of Midnight | No. No Magrib at hour 22 or 23 is asserted | GAP |
| A6 | Magrib 00:00 and 00:01 | `N:377` "places the Magrib instant on the next calendar day, not 23h56m early" (00:04); `N:397` "keeps the row on its own list day, so 21 June still shows a Magrib"; `N:463` "gives the notification path the same instant the list shows" | Partly. Hour 0 pinned at 00:04. Boundary minutes unstated. Nothing armed | GAP |
| A7 | Magrib 05:59 and 06:00 | None | No. The cutoff is pinned only through Isha (`P:216`), so a Magrib-specific cutoff passes | GAP |
| A8 | Friday Istijaba, Magrib 00:40, Istijaba Fri 23:40 | `N:441` "puts Istijaba an hour before a Magrib at %s, date and all", row `:444`; `N:419` "keeps Istijaba exactly an hour before a Magrib at %s" (gap only) | List: yes (literal date, clock and list day). Alarm: no; no store test ever enables Istijaba | GAP |
| A9 | Friday Istijaba, Magrib 01:20, Istijaba Sat 00:20 | `N:441`, row `:443` | List: yes. Alarm, and a reschedule between Sat 00:00 and 00:20 (L1): no | GAP |
| A10 | Istijaba excluded from non-Friday lists across 00:00 | `N:226` "returns null for Istijaba outside Fridays (not on that day's list)" (London, Sat 12 Sep); `N:319` "keeps each Extras list in display order: Midnight, Last Third, Suhoor, Duha, then Istijaba on Fridays" (London 2024) | No for a post-midnight Magrib. Deciding Friday from Istijaba's own instant (Thursday list, Magrib 01:20, instant Fri 00:20) passes both. No alarm test | GAP |
| A11 | Suhoor for Fajr 00:10, 00:19, 00:20 and 00:21 (list) | `N:514` "stays twenty minutes before a Fajr at %s, on Fajr’s own list" (00:00, 00:10, 00:19, 00:20, 00:45, 02:38); `N:531` "gives the notification path the same instant the list shows" (00:10 gives 23:50 on D-1) | Yes. Both halves of the pair, both sides of the wrap (finding 65). 00:21 is the same hour class as 00:20 and 00:45 | Covered |
| A12 | Suhoor armed (at-time, reminder, window) for Fajr before 00:20 | None. `SHN:100` "leaves Suhoor on the base window, since its instant is on its own date" asserts a premise that is false for this case (L4) | No | GAP |
| A13 | Fajr near 00:00: absolute instant, list day, armed | Only relative: `N:514` (Fajr minus Suhoor is 20 min); `P:48` "assigns Fajr at 06:15 to current day" | Partly. Shifting Fajr alone is caught through the gap. The absolute instant, list day and alarm are never asserted | GAP |
| A14 | Extras Midnight exactly 00:00:00 (real London lists 17 and 18 Oct 2026) | `T:189` "puts the midpoint of a 12-hour night exactly at 00:00" (instant only) | Partly. No list row ('00:00', list day), no alarm, and no test of skipping at equality (`<=`, `stores/notifications.ts:569`) | GAP |
| A15 | Midnight at 23:59, and two list days' Midnight on one calendar day (18 Oct: list 18 at 00:00:00, list 19 at 23:59) | `N:153` "list %s: Midnight %s (%s), Last Third %s (%s)", rows `:159-:160` (23:58); `SN:1583` "schedules a Midnight that falls before 00:00 on the evening before its list day" (23:45 BST) | No for 23:59 and for the pair. Neither identifier nor either alarm is asserted | GAP |
| A16 | Midnight 00:01 | `N:153`, rows `:156-:158` (00:18, 00:12); `SN:1539` "schedules the Extras night rows at the exact moment their list row shows" (00:10 BST, literal trigger) | Yes. An exact-instant row with no hour branch, and neighbouring minutes are pinned on both list and alarm | Covered |
| A17 | Last Third after 00:00 | `N:153` (00:54 to 01:59); `N:271` "gives every Extras list the Midnight and Last Third of the night leading into it" (2024); `SN:1539` (00:35 BST); `DN:349` "fires in the repeated hour of the clock-change night at the exact instant (01:00 GMT, not 01:00 BST)" | Yes | Covered |
| A18 | Last Third before and at 00:00 (short nights) | None on the list. `P:90` "assigns Last Third to next day when hour >= 12" tests a path Last Third never takes | No | GAP |

## B. London DST, 29 March and 25 October 2026

| # | Sub-case | Tests | Would it fail if broken? | Verdict |
|---|---|---|---|---|
| B1 | Night length in real elapsed time | `T:203` "measures the spring clock-change night in real time (9h 37m, not the 10h 37m on the clock face)"; `T:212` "measures the autumn clock-change night in real time (12h 12m, not the 11h 12m on the clock face)"; `T:222` "keeps Midnight before the last third, and both inside the night"; `T:271` "gives the same instants when run at %s" | Yes. Clock-face arithmetic gives 23:48 / 23:28 and fails the literal instants | Covered |
| B2 | Midnight and Last Third, lists 28, 29 and 30 Mar | `N:153`, rows `:154-:156` (instant, label, list day); `N:271` (2024, independent reference) | Yes | Covered |
| B3 | Lists 24, 25 and 26 Oct | `N:153`, rows `:159-:161`; `N:236` "gives a night row its night-before instant, still keyed to its own list day"; `N:271` | Yes | Covered |
| B4 | Repeated 01:00-01:59; the second 01:00 is Last Third on the 25 Oct list | `N:153`, row `:160`; `T:212`; `T:826` "maps the duplicated hour to the LATER occurrence"; `T:662` "matches Intl minute by minute across both 2026 clock changes" | Yes (list and instant) | Covered |
| B5 | Skipped hour, 29 Mar | `T:809` "maps the nonexistent skipped hour via the pre-transition offset" (01:30 only, and the title is wrong); `T:662` (display only) | Partly. One reading. 01:00, 01:59 and 02:00 are unpinned | GAP |
| B6 | Standard rows the morning after each change | `N:175` "leaves Suhoor where it was: 20 minutes before the day's own Fajr" (25 Oct, 29 Mar); `N:301` and `N:337` "getPrayerForDate returns exactly the row the list shows, for every prayer on every day" (all of 2024, including 31 Mar and 27 Oct); `T:816`, `T:833`, `T:944`, `T:958` | Yes, for any offset error | Covered |
| B7 | Armed at-time instants on DST dates | `DN:334` "fires the at-time notification at the row datetime, keyed by its list day" (23:58 BST); `DN:349` (01:00Z). Both use hand-built rows, and there is no store reschedule on any DST date | Partly. Device layer only. Fajr 25 Oct 05:04 GMT and Fajr 29 Mar 05:07 BST are never armed in a test | GAP |
| B8 | Reminders across a change. The 25 Oct Last Third reminders fire in the first 01:30-01:55 BST; a reminder can also straddle the March jump | `DN:365` "fires the reminder exactly its interval before the row datetime" (23:58 BST minus 15; no change inside) | No | GAP |
| B9 | Skip rule and window with now inside the repeated hour (00:30Z is the first pass, 01:30Z the second) | None | No | GAP |
| B10 | Countdown across both changes | `T:944` "countdown window crossing the October fallback counts the real elapsed time (8.5h, not 7.5h)"; `T:958` "countdown window crossing the March spring-forward counts the real elapsed time (6.5h, not 7.5h)" | Yes | Covered |

## C. The device clock reaching 00:00 while the app runs

| # | Sub-case | Tests | Would it fail if broken? | Verdict |
|---|---|---|---|---|
| C1 | Countdown atoms from 23:59:59 to 00:00:00 with no row at 00:00 | None. `CD:161` "refreshes the sequence when the wall clock reaches the prayer time, never displaying 0s" and `CD:300` "never displays 0s across a full countdown and swaps at the boundary" run at 06:14-06:15Z with `@/stores/schedule` mocked | No | GAP |
| C2 | A row exactly at 00:00:00 (Extras Midnight, 17 and 18 Oct): one Extras transition on the 00:00:00.000 tick, Standard untouched | None. The countdown suite mocks `getNextPrayer` and `refreshSequence` | No | GAP |
| C3 | Sequence atoms at 00:00: no rewrite without a boundary; exactly one rewrite for a 00:00:00 Midnight, keeping that list's passed row | `SCH:685` and `SCH:712` (never call the code); `SCH:751` "rebuilds from today, not tomorrow, when nothing from today on is left (a long suspension)" (10:00Z); `SCH:770` "adds only the days after today while today is still in the buffer" (21:00Z) | No | GAP |
| C4 | Display-date atom (findings 7 and 51) across 00:00. It reads the clock inside a derived atom whose only dependency is the sequence, so it should not move at 00:00 unless a row passes | `SCH:490` "returns null when every prayer in the sequence has passed" (23:30 on 31 Dec); `SCH:536` "returns belongsToDate which may differ from calendar date" (02:00); `SCH:936` "handles prayer at midnight boundary" (23:30, before a 23:52 row); `T:513` "throws on an empty date rather than returning a placeholder" (the Day.tsx premise) | No. Each is one-sided with a mocked clock, and none crosses 00:00 | GAP |
| C5 | Hooks at 00:00 (`isPassed`, `isNext`, the `useSchedule` day filter) | `hooks/__tests__/usePrayerSequence.test.ts:50-66` (copy of the hook); `hooks/__tests__/useCountdown.test.ts:12-32` (asserts its own mock) | No. The hooks are never imported | GAP |
| C6 | A reschedule or state change at 00:00 | None. The code has no midnight trigger (`device/listeners.ts:32-55`, plus the background task). No test pins the window either side of 00:00 ([D, D+1] against [D+1, D+2]; three days for the night rows) | No | GAP |
| C7 | Cold launch or foreground sync just after 00:00 (L2, L3) | `SCH:326` "fetches yesterday final prayer when nextIndex === 0 (day boundary)" (`createPrayer` mocked); `SY:186` "initializes app state with current London date" (`setSequence` mocked) | No | GAP |

## D. Unreadable API times

| # | Sub-case | Tests | Would it fail if broken? | Verdict |
|---|---|---|---|---|
| D1 | One unreadable field on a future day: what `fetchYear` returns | `API:183` "keeps the readable days around an unreadable one" (tomorrow `isha: ''`) | Yes, but it also fails when nothing is broken, 00:00-00:59 BST (measured). It pins the whole-day drop that spec R3 reverses | Covered (fetch only) |
| D2 | A whole far-future day | `API:169` "does not let an unreadable day months away take down the day the user is standing on"; `API:202` "survives a whole polar-summer window of unreadable days" | Yes, at fetch level | Covered (fetch only) |
| D3 | What `sync` caches from that result, and whether a future hole triggers a refetch | None. `SY` mocks `fetchYear` throughout | No | GAP |
| D4 | What is rendered with a hole: the sequence, the display date, finding 70's "tomorrow shown as today" | None for the app. `shared/__tests__/widgetTimeline.test.ts:502` "degrades gracefully across a missing cache day" is widget-only | No | GAP |
| D5 | Alarms for a hole: at-time and reminder skipped, earlier alarms for that day cancelled, window not widened, the next day's night rows | None. `SN:1405` "does not cancel the OS alarms when the prayer cache is empty (post-upgrade)", `SN:1419` "leaves the refresh gate open after bailing, so the next foreground retries" and `SN:1429` "does not stamp the background reschedule when the cache is empty" cover an empty cache only | No | GAP |
| D6 | A whole week unreadable from tomorrow, inside the 3-day list window and the 2-3-day alarm window | None. The 60-day case at `API:202` starts 100 days out | No | GAP |
| D7 | Today unreadable | `API:127` "rejects a time that is not zero-padded HH:mm", `API:133` "rejects a missing time rather than calling split on undefined", `API:140` "rejects a non-time placeholder, which is what high latitude sends for polar day", `API:146` "rejects an out-of-range time", `API:152` "rejects a day with no times at all", `API:156` "names the offending day, so the failure is diagnosable from one log line" | Partly. Single-day payloads cannot tell "today dropped" apart from "nothing readable", so a guard that throws only when both hold survives. All six also fail 00:00-00:59 BST (measured) | GAP |
| D8 | Finding 67: wipe, then fetch; the next launch repeats it; `fetched_years` is lost | `SY:291` "clears cache except app version, What’s New tracker, and preferences before fetching"; `SY:328` "throws on API error"; `SY:584` "propagates API errors"; `SY:670` "saves yesterday's record back straight after the cache wipe"; `SY:684` "on 1 Jan keeps 31 Dec through the wipe, so last year is not downloaded again" | No. Nothing asserts what survives a failed refetch, or what a second launch does | GAP |
| D9 | `--:--` per prayer, spec R1-R6 (`ai/prompts/unavailable-times-dashes.md`, session 3) | None (not implemented) | n/a | GAP |

## E. The first stored day's night rows

| # | Sub-case | Tests | Would it fail if broken? | Verdict |
|---|---|---|---|---|
| E1 | Is the fallback pinned? | `N:194` "borrows the day's own Magrib one day earlier when the day before is not stored" asserts `2026-09-10T23:11Z` and `2026-09-11T00:45Z`, where the true values at `N:205` "pairs the previous day's Magrib with this day's Fajr" are 23:12 and 00:46. `N:212` "never lets a record that is not the day before stand in for it" asserts equality with the fallback | Yes. Removing the substitution fails both, so the suite enforces what finding 70 forbids | GAP (invert) |
| E2 | Does anything assert it must not happen? | None. The year sweeps skip day one: `N:274` starts at index 1, and `N:304`, `:322`, `:340` use `dates.slice(1)`. Real reach: London list 2026-01-01 (finding 72). On the device, the 29 Mar list's Last Third fired 21 min late from a substituted Magrib | No | GAP |
| E3 | Alarms: no Midnight or Last Third armed from a substituted Magrib | None. `SN:1583` hits the fallback for today, but that instant is already past at 09:00, so it is unobservable | No | GAP |
| E4 | The day after a dropped day (`previousDayData = null`, `shared/prayer.ts:430-432`) | None | No | GAP |
| E5 | 1 January, no 31 December record, previous-year fetch rejected (L6) | `SY:503` "fetches previous year data when not cached", `SY:524` "saves previous year data for CountdownBar progress", `SY:534` "marks previous year as fetched", `SY:649` "completes January 1st edge case flow" (success paths only) | No | GAP |

---

## Missing tests, in priority order

**How to read these.**
- **Record notation.** `{fajr, sunrise, dhuhr, asr, magrib, isha}`; build records with `day()` from `N:101`.
- **Instants** are ISO UTC.
- **Identifiers** follow `device/notifications.ts:33-46`.
- **Red today** means the test fails against `7075290` by trace. It codifies behaviour the owner should approve before it is added.

### Priority 1: owner rulings, real London dates, measured-broken fixtures, defects

#### 1. "never builds Midnight or Last Third from a Magrib the payload did not give"

- **File:** `N`. Red today. Inverts `N:194` and `N:212`.
- **Records:** 2026-01-01 `{06:26, 08:03, 12:09, 13:46, 16:05, 17:42}` and 2026-01-02 `{06:26, 08:03, 12:10, 13:47, 16:06, 17:43}`. No 2025-12-31.
- **Expect:**
  - List 2026-01-01 has no Midnight at `2025-12-31T23:15:00.000Z` and no Last Third at `2026-01-01T01:39:00.000Z`.
  - `getPrayerForDate(Extra, 'Midnight' | 'Last Third', '2026-01-01')` returns neither.
  - List 2026-01-02 Midnight is `2026-01-01T23:15:00.000Z`.
- **Second case: the one the device fired, where a clock change makes the error largest.**
  - Records: 2026-03-29 `{05:07, 06:40, 13:10, 16:35, 19:32, 20:49}` and 2026-03-30 `{05:05, 06:38, 13:10, 16:36, 19:34, 20:51}`. No 2026-03-28.
  - List 2026-03-29 has no Midnight at `2026-03-28T23:49:00.000Z` (true value `23:18:00.000Z`).
  - List 2026-03-29 has no Last Third at `2026-03-29T01:15:00.000Z` (true value `00:54:00.000Z`).
- **Closes:** E1, E2.

#### 2. "arms no alarm from a substituted Magrib on the first stored day"

- **File:** `SN`. Red today.
- **Setup:** the same records, frozen at `2026-01-01T00:30:00Z`, with Midnight and Last Third set to Silent.
- **Expect:**
  - `athan_extra_last third_2026-01-01` is not scheduled.
  - `athan_extra_midnight_2026-01-02` at `2026-01-01T23:15:00.000Z`.
  - `athan_extra_last third_2026-01-02` at `2026-01-02T01:39:00.000Z`.
- **March case (what the device armed and fired):** with the 29 and 30 Mar records from test 1, frozen at `2026-03-29T00:30:00Z`, `athan_extra_last third_2026-03-29` is not scheduled. At `7075290` it is scheduled at `2026-03-29T01:15:00.000Z`.
- **Closes:** E3.

#### 3. "opens the 17 and 18 October lists at exactly 00:00:00 and the 19 October list at 23:59 on the 18th"

- **File:** `N`. Real London 2026 data.
- **Records:**

  | Day | Times |
  |---|---|
  | 2026-10-16 | `{05:51, 07:23, 12:51, 15:31, 18:08, 19:31}` |
  | 2026-10-17 | `{05:52, 07:25, 12:51, 15:30, 18:06, 19:29}` |
  | 2026-10-18 | `{05:54, 07:27, 12:51, 15:28, 18:04, 19:27}` |
  | 2026-10-19 | `{05:55, 07:28, 12:51, 15:26, 18:02, 19:25}` |
  | 2026-10-20 | `{05:57, 07:30, 12:50, 15:25, 18:00, 19:23}` |

- **Expect:**

  | List day | Midnight | Last Third |
  |---|---|---|
  | 2026-10-17 | `2026-10-16T23:00:00.000Z` ('00:00') | `2026-10-17T00:57:00.000Z` ('01:57') |
  | 2026-10-18 | `2026-10-17T23:00:00.000Z` ('00:00') | `2026-10-18T00:58:00.000Z` ('01:58') |
  | 2026-10-19 | `2026-10-18T22:59:00.000Z` ('23:59') | `2026-10-19T00:58:00.000Z` ('01:58') |
  | 2026-10-20 | `2026-10-19T22:59:00.000Z` ('23:59') | `2026-10-20T00:58:00.000Z` ('01:58') |

  `belongsToDate` equals the list day in every row, and `getPrayerForDate` returns the same row.
- **Closes:** A14 and A15 (list).

#### 4. "arms both 18 October Midnight alarms under their own list-day identifiers"

- **File:** `SN`.
- **Setup:** records as test 3. Midnight Silent, with a Silent 5-minute reminder.
- **Frozen at `2026-10-17T21:00:00Z`, expect:**
  - `athan_extra_midnight_2026-10-18` at `2026-10-17T23:00:00.000Z`.
  - `athan_extra_midnight_2026-10-19` at `2026-10-18T22:59:00.000Z`.
  - `reminder_extra_midnight_2026-10-18_5` at `2026-10-17T22:55:00.000Z`.
  - `reminder_extra_midnight_2026-10-19_5` at `2026-10-18T22:54:00.000Z`.
  - Nothing for 2026-10-17.
- **Frozen at `2026-10-17T23:00:00.000Z` (now equals the instant), expect:**
  - No `_2026-10-18` at-time and no `_2026-10-18` reminder.
  - `_2026-10-19` scheduled.
  - `athan_extra_midnight_2026-10-20` at `2026-10-19T22:59:00.000Z`.
- **Frozen at `2026-10-17T22:59:45Z`, expect:** the 18 Oct at-time scheduled, but not its reminder.
- **Closes:** A14 and A15 (alarm).

#### 5. "crossing 00:00:00 with the app running advances only the Extras sequence, once, and neither display date moves"

- **File:** a new describe in `CD` that uses the real `@/stores/schedule` and `@/shared/prayer`, with `@/stores/database` mocked as at `N:28`.
- **Setup:**
  1. Records as test 3.
  2. `setSequence(Standard | Extra, new Date('2026-10-17T21:00:00Z'))`.
  3. Fake timers at `2026-10-17T22:59:58.000Z`.
  4. `startCountdowns()`, then advance 3000 ms.
- **Expect:**
  - `extraSequenceAtom` is written exactly once, on the `23:00:00.000Z` tick.
  - The `standardSequenceAtom` object is unchanged.
  - The Extra countdown reads Midnight 2, then 1, then Last Third 7080 at 23:00:00Z.
  - The Standard countdown reads Fajr 21242 down to 21239.
  - Neither countdown ever shows 0.
  - `standardDisplayDateAtom` and `extraDisplayDateAtom` are both `'2026-10-18'` before and after.
- **Closes:** C1, C2, C3, C4.

#### 6. "keeps yesterday's list Isha armed when a reschedule runs between 00:00 and its 00:01 instant"

- **File:** `SN`. Red today (L1).
- **Setup:** records 2026-06-19 to 2026-06-22, each `{02:40, 04:43, 13:02, 17:20, 21:25, 00:01}`. Isha Silent, with a Silent 5-minute reminder.
- **Steps and expectations:**
  1. Frozen at `2026-06-20T20:00:00Z`: `athan_standard_isha_2026-06-20` at `2026-06-20T23:01:00.000Z`, and `reminder_standard_isha_2026-06-20_5` at `2026-06-20T22:56:00.000Z`.
  2. `setSystemTime('2026-06-20T23:00:30Z')` and reschedule again: that at-time id is never passed to cancel and is still held.
- **Same table, more cases:**
  - Magrib `00:01`, with Isha `00:25`.
  - Friday Istijaba:
    - Records 2026-06-25 to 2026-06-28, each `{01:32, 02:58, 13:31, 17:31, 01:20, 01:44}`.
    - First reschedule at `2026-06-26T20:00:00Z`; Istijaba is at `2026-06-26T23:20:00.000Z`.
    - Second reschedule at `2026-06-26T23:05:00Z`.
- **Closes:** A4, A9.

#### 7. Fix the UTC fixture, then add "rejects the payload when today is unreadable even though every other day reads"

- **File:** `API`.
- **Fixture fix:** replace `:117`, `:167`, `:228` and `:250` with `formatInTimeZone(Date.now() + offset, PRAYER_TIMEZONE, 'yyyy-MM-dd')`, as `P:21` does.
- **Payload for the new test:**
  - Yesterday: valid.
  - Today: `{...valid, isha: '-----'}`.
  - Tomorrow and the day after: valid.
- **Expect:** rejects with `Malformed prayer time: <today> is unreadable`.
- **Regression guard:** also run the day-shape describe once under `jest.useFakeTimers({ now: Date.parse('2026-09-13T23:30:00Z') })`.
- **Closes:** D7 and the measured flake.

### Priority 2

#### 8. "fires the 25 October Last Third at the second 01:00 and its reminders in the first 01:xx"

- **File:** `SN`.
- **Setup:** records `N:132-:135` (23 to 26 Oct). Frozen at `2026-10-24T21:00:00Z`. Last Third Silent, with one case per reminder interval.
- **At-time:** `athan_extra_last third_2026-10-25` at `2026-10-25T01:00:00.000Z`.
- **Reminders:** `reminder_extra_last third_2026-10-25_<n>`:

  | n | Trigger |
  |---:|---|
  | 5 | `00:55:00.000Z` |
  | 10 | `00:50:00.000Z` |
  | 15 | `00:45:00.000Z` |
  | 20 | `00:40:00.000Z` |
  | 25 | `00:35:00.000Z` |
  | 30 | `00:30:00.000Z` |

- **Frozen at `2026-10-25T00:50:00Z` (01:50 BST, first pass):**
  - The at-time is scheduled.
  - At interval 15 the reminder is not scheduled.
  - At interval 5 it is scheduled at `00:55:00.000Z`.
- **Frozen at `2026-10-25T01:30:00Z` (01:30 GMT, second pass):** the at-time is not scheduled.
- **Same 21:00Z run:** `athan_standard_fajr_2026-10-25` at `2026-10-25T05:04:00.000Z`.
- **March:** records `N:125-:128`, frozen at `2026-03-28T21:00:00Z`:
  - `athan_standard_fajr_2026-03-29` at `2026-03-29T04:07:00.000Z`.
  - `athan_extra_suhoor_2026-03-29` at `2026-03-29T03:47:00.000Z`.
- **Closes:** B7, B8, B9.

#### 9. "fires a reminder across the March clock change at its real interval"

- **File:** `DN`.
- **Row:** datetime `2026-03-29T01:10:00.000Z` (02:10 BST), list day `2026-03-29`, interval 30.
- **Expect:** trigger `2026-03-29T00:40:00.000Z`.
- **Closes:** B8 (March).

#### 10. Finding 67 characterisation

**Titles:** "keeps every cached prayer day and fetched_years when the refetch after a missing today fails" and "does not wipe and re-download again on a second launch the same day".

- **File:** `SY`. Red today, and needs the owner's decision.
- **Setup:**
  - The Map-backed storage from `SY:690`.
  - Stored days 2026-09-12, -13, -15 and -16, with `fetched_years` `{2026: true}`.
  - Clock `2026-09-14T08:00:00Z`.
  - `fetchYear` rejects with `Malformed prayer time: 2026-09-14 is unreadable`.
- **Expect:**
  - After `sync()` rejects, those days and `fetched_years` are still stored.
  - A second `sync()` wipes at most once.
- **Closes:** D8.

#### 11. "treats an unreadable tomorrow as absent without borrowing a Magrib"

- **Files:** `N` and `SN`. Red today (E).
- **Records:** 2026-09-12 `{04:56, 06:28, 13:02, 16:27, 19:25, 20:39}`, 2026-09-13 `{04:57, 06:29, 13:02, 16:26, 19:23, 20:37}` and 2026-09-15 `{05:00, 06:32, 13:01, 16:23, 19:18, 20:33}`. No 2026-09-14.
- **List expectations:**
  - `createPrayerSequence(Standard, new Date('2026-09-13T11:00:00Z'), 3)` has 12 rows, none on `2026-09-14`.
  - List 2026-09-15 has no Midnight at `2026-09-14T23:09:00.000Z` and no Last Third at `2026-09-15T00:46:00.000Z`. Those are the borrowed-Magrib values.
- **Alarm expectations:** frozen at `2026-09-13T08:00:00Z`, with Fajr, Isha and Midnight Silent:
  - No id ending `_2026-09-14`.
  - No `athan_extra_midnight_2026-09-15`.
  - A pre-seeded `athan_standard_fajr_2026-09-14` is cancelled.
- **Closes:** D4, D5, E4.

#### 12. "caches the readable days around an unreadable one and does not refetch until that day is today"

- **File:** `SY`.
- **Setup:** `fetchYear` resolves 13, 15 and 16 Sep.
- **Expect:**
  - At `2026-09-13T08:00:00Z`, `saveAllPrayers` receives no `2026-09-14`, and a second `sync()` does not fetch.
  - At `2026-09-14T08:00:00Z` it does fetch.
- **Closes:** D3.

#### 13. "keeps a Standard row on its own list at the midnight and 06:00 boundaries"

- **File:** `N`. An `it.each` over Isha and Magrib, with X in {23:59, 00:00, 00:01, 05:59, 06:00}.
- **Records:** 2026-06-20 and 2026-06-21.
  - Isha case: `{02:40, 04:43, 13:02, 17:20, 21:25, X}`.
  - Magrib case: `{01:30, 02:55, 13:30, 17:30, X, 00:30}`.
- **Instants:**

  | X | Instant |
  |---|---|
  | 23:59 | `2026-06-20T22:59:00.000Z` |
  | 00:00 | `2026-06-20T23:00:00.000Z` |
  | 00:01 | `2026-06-20T23:01:00.000Z` |
  | 05:59 | `2026-06-21T04:59:00.000Z` |
  | 06:00 | `2026-06-20T05:00:00.000Z` |

  `belongsToDate` is `'2026-06-20'` in every case, and `getPrayerForDate` returns the same row.
- **Closes:** A1, A2, A3, A5, A6, A7 (list).

#### 14. "arms a Standard row at its shifted instant either side of 00:00"

- **File:** `SN`. The same table as test 13.
- **Setup:** records 2026-06-19 to 2026-06-22, frozen at `2026-06-20T12:00:00Z`, Silent with a 5-minute reminder.
- **Expect, per X:**

  | X | `..._2026-06-20` | `..._2026-06-21` |
  |---|---|---|
  | 23:59 | `2026-06-20T22:59:00.000Z` | `2026-06-21T22:59:00.000Z` |
  | 00:00 | `2026-06-20T23:00:00.000Z` | `2026-06-21T23:00:00.000Z` |
  | 00:01 | `2026-06-20T23:01:00.000Z` | `2026-06-21T23:01:00.000Z` |
  | 05:59 | `2026-06-21T04:59:00.000Z` | `2026-06-22T04:59:00.000Z` |
  | 06:00 | not scheduled (past) | `2026-06-21T05:00:00.000Z` |

  Each reminder fires 5 minutes earlier.
- **Closes:** A1, A2, A3, A5, A6, A7 (alarm).

#### 15. "keeps Istijaba off non-Friday lists across 00:00, and arms it only for the Friday list"

- **Files:** `N` and `SN`.
- **Records:** 2026-06-25 to 2026-06-28, each `{01:32, 02:58, 13:31, 17:31, M, I}`, with (M, I) = (00:40, 01:04) or (01:20, 01:44).
- **List expectation:** `getPrayerForDate(Extra, 'Istijaba', '2026-06-25' | '2026-06-27')` is null for both values of M.
- **Frozen at `2026-06-25T20:00:00Z`, expect:**
  - `athan_extra_istijaba_2026-06-26` at `2026-06-26T22:40:00.000Z` when M is 00:40, or `2026-06-26T23:20:00.000Z` when M is 01:20.
  - `_5` reminders 5 minutes earlier.
  - Nothing for 2026-06-25.
- **Frozen at `2026-06-26T20:00:00Z`, expect:** nothing for 2026-06-27.
- **Closes:** A8, A10.

### Priority 3

#### 16. "places a Last Third before and at 00:00 on its own list and arms it"

- **Files:** `N` and `SN`.
- **Records:** 2026-06-20 `{02:40, 04:43, 13:02, 15:00, M, 19:00}` and 2026-06-21 `{F, 04:43, 13:02, 15:00, 19:00, 20:00}`.
- **Before 00:00 (M 17:00, F 02:00):** list 21 Midnight `2026-06-20T20:30:00.000Z`, Last Third `2026-06-20T22:00:00.000Z` (23:00 BST).
- **At 00:00 (M 18:00, F 03:00):** Midnight `2026-06-20T21:30:00.000Z`, Last Third `2026-06-20T23:00:00.000Z` ('00:00').
- **Both cases:** `belongsToDate` is `'2026-06-21'`. Frozen at `2026-06-20T19:00:00Z`, `athan_extra_last third_2026-06-21` is armed at those instants.
- **Closes:** A18.

#### 17. Yesterday's post-midnight Isha, on the list and on the progress bar

**Titles:** "a sequence built at 00:00:30 keeps yesterday's list Isha due at 00:01 as the next prayer" and "gives the progress bar yesterday's post-midnight Isha at its real instant".

- **Setup:** real modules, records as test 6. Red today (L2, L3).
- **List:** `createPrayerSequence(Standard, new Date('2026-06-20T23:00:30Z'), 3)` holds Isha, `belongsToDate '2026-06-20'`, at `2026-06-20T23:01:00.000Z`, and it is the first row after now.
- **Progress bar:** with the sequence built at `2026-06-21T01:00:00Z`, `standardPrevPrayerAtom` should be `2026-06-20T23:01:00.000Z` on `'2026-06-20'`. Today it is `2026-06-19T23:01:00.000Z` on `'2026-06-19'`.
- **Closes:** C7.

#### 18. "a reschedule either side of 00:00 moves every window by exactly one list day, and nothing reschedules at 00:00 by itself"

- **File:** `SN`.
- **Setup:** records as test 3; Fajr and Midnight Silent.
- **Frozen at `2026-10-17T22:59:30Z`:** Fajr `{_2026-10-18}`; Midnight `{_2026-10-18, _2026-10-19}`.
- **Frozen at `2026-10-17T23:00:30Z`:** Fajr `{_2026-10-18, _2026-10-19}`; Midnight `{_2026-10-19, _2026-10-20}`.
- **No trigger at 00:00:** after `startCountdowns()` and a fake-timer advance from `22:59:58Z` to `23:00:02Z`, the number of `scheduleNotificationAsync` calls is unchanged.
- **Closes:** C6.

#### 19. "states Fajr's own instant and list day when Fajr is near 00:00"

- **Files:** `N` and `SN`.
- **Records:** `nightsWithFajr` (`N:506`) with Fajr 00:00, 00:10, 00:19 and 00:20.
- **Expect:**
  - Fajr on list 21 at `2026-06-20T23:00:00.000Z`, `23:10:00.000Z`, `23:19:00.000Z` and `23:20:00.000Z`, each on `'2026-06-21'`.
  - Frozen at `2026-06-20T20:00:00Z`, `athan_standard_fajr_2026-06-21` is armed at the same instants.
- **Closes:** A13.

#### 20. "keeps a Suhoor armed for the next list day after tonight's has fired, when Fajr is before 00:20"

- **File:** `SN`. Red today (L4), and the window change needs the owner's decision.
- **Setup:** records 2026-06-19 to 2026-06-23, each `{00:10, 02:55, 13:00, 17:30, 23:30, 23:54}`. Suhoor Silent, with a 5-minute reminder.
- **Frozen at `2026-06-20T20:00:00Z`:** `athan_extra_suhoor_2026-06-21` at `2026-06-20T22:50:00.000Z`, with its reminder at `22:45:00.000Z`.
- **Frozen at `2026-06-20T22:55:00Z`:** `athan_extra_suhoor_2026-06-22` at `2026-06-21T22:50:00.000Z` is armed.
- **Closes:** A12.

#### 21. "an unreadable week from tomorrow arms only today's readable rows"

- **File:** `SN`.
- **Setup:** records 2026-09-12 and 2026-09-13 only. Frozen at `2026-09-13T08:00:00Z`, every row Silent.
- **Expect:**
  - Only ids ending `_2026-09-13`.
  - No `athan_extra_midnight_2026-09-14`.
  - `refreshNotifications()` at `2026-09-14T08:00:00Z` leaves `lastNotificationScheduleAtom` at 0.
- **Closes:** D6.

#### 22. Session 3, spec R1-R6: "a broken Friday Magrib dashes Friday's Istijaba and Saturday's Midnight and Last Third, and arms none of them"

- **Records:** 2026-10-16 `{05:51, 07:23, 12:51, 15:31, '-----', 19:31}` and 2026-10-17 `{05:52, 07:25, 12:51, 15:30, 18:06, 19:29}`.
- **Expect:** Friday's other five rows, and Saturday's Suhoor and Duha, keep their times and stay armed.
- **Also add:** the spec's per-field, all-fields and each-window-position cases.
- **Closes:** D9.

#### 23. "a rejected previous-year fetch on 1 January still initialises today"

- **File:** `SY`. Red today (L6), and needs the owner's decision.
- **Setup:**
  - `isJanuaryFirst` true, clock `2027-01-01T10:00:00Z`.
  - A 2027-01-01 record exists, and `2026-12-31` returns null.
  - `fetchYear(2026)` rejects with `Incomplete data received`.
- **Expect:** `sync()` resolves, and `setSequence` is called twice.
- **Closes:** E5.

#### 24. Skipped and repeated clock readings

**Titles:** "resolves every skipped reading on 29 March with the post-change offset" and "resolves every repeated reading on 25 October to the later occurrence".

- **File:** `T`. Also retitle `T:809`.
- **29 March:**

  | Reading | Instant |
  |---|---|
  | 00:59 | `2026-03-29T00:59:00.000Z` |
  | 01:00 | `2026-03-29T00:00:00.000Z` |
  | 01:30 | `2026-03-29T00:30:00.000Z` |
  | 01:59 | `2026-03-29T00:59:00.000Z` |
  | 02:00 | `2026-03-29T01:00:00.000Z` |

  00:59 and 01:59 share an instant by design.
- **25 October:**

  | Reading | Instant |
  |---|---|
  | 00:59 | `2026-10-24T23:59:00.000Z` |
  | 01:00 | `2026-10-25T01:00:00.000Z` |
  | 01:59 | `2026-10-25T01:59:00.000Z` |
  | 02:00 | `2026-10-25T02:00:00.000Z` |

- **Closes:** B5.

#### 25. Replace the tests that do not execute the code

- **Schedule:** replace `SCH:685` and `SCH:712` with real `refreshSequence` calls at `2026-10-17T23:00:00.000Z`, using the records from test 3. Expect list 18's passed Midnight kept and list 17's rows dropped.
- **Hook:** extract the pure part of `hooks/usePrayerSequence.ts:66-84`. Test that `isNext` moves from list 18's Midnight to its Last Third between `2026-10-17T22:59:59.999Z` and `2026-10-17T23:00:00.000Z`.
- **Remove:** delete `hooks/__tests__/useCountdown.test.ts` and `hooks/__tests__/useCountdownBar.test.ts`, as AUDIT Lead 1 recommends.
- **Closes:** C3, C5.
