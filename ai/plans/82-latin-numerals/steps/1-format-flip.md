# Step 1: the format flip — one countdown design for every locale

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R1.6, R3.3
Weight: 2

## Anchor check

Run the pre-flight with these anchors only:

```bash
bash $TMPDIR/preflight-82.sh dispatcher ago-dispatcher duration-labels countdown-gate countdown-styles ago-gate typography-arabic typography-pin time-en-pin time-ar-pin selector-pin selector-ar-pin countdown-pin countdown-ar-pin ago-pin
```

Expected output ends `PREFLIGHT OK`. Any other output is STOP.

## Goal

English joins the fixed-width colon design. `formatTime` and `formatTimeAgo` lose their
en dispatch and compose the colon shapes for every locale, the lettered helpers and the
duration-label plumbing in `time.ts` die, the two render gates die so every locale
renders section nodes, and the typography map carries one Latin digits family for the
timer line. Arabic keeps drawing Arabic-Indic digits in this step (the digit map dies in
step 2), so every non-en pin is untouched here.

## Branch

```bash
git checkout -b feat/82-format-flip uat
```

## Files

Source: `shared/time.ts`, `shared/typography.ts`, `components/countdown/Countdown.tsx`,
`components/prayer/Ago.tsx`.
Tests: `shared/__tests__/time.test.ts`, `stores/__tests__/countdown.test.ts`,
`stores/__tests__/schedule.test.ts`, `components/countdown/__tests__/Countdown.test.tsx`,
`components/prayer/__tests__/Ago.test.tsx`, `__tests__/app/Screen.test.tsx`,
`shared/__tests__/typography.test.ts`.

## Red tests

Rewrite the named tests first (values below), then run each suite and record the exact
failing lines in LOG.md. Measured against `a4d0b8c6` with only the two dispatchers
flipped in a scratch worktree (planning proof, 2026-10-13):

```bash
npx jest shared/__tests__/time.test.ts --watchman=false --selectProjects=unit
```

`Tests: 15 failed, 118 passed, 133 total`. The 15 are every en lettered pin:
`formatTime` > `returns "0s" for negative seconds`, `formats seconds`, `formats minutes`,
`formats hours`, `converts days to hours`, `handles the 24h and multi-day boundaries`,
`hideSeconds option` > all four its, `JSDoc contract` > `pins every example in the JSDoc`,
and the en pin of `native digits (D57)` (`time.test.ts:162`); `formatTimeAgo` >
`formats minutes`, `formats hours and minutes`, and its en pin at `time.test.ts:204`.
First failing line shapes, one per composer: `formatTime(60)` expects `"1m"` and
receives `"00:01:00"`; `formatTimeAgo(60)` expects `"1m"` and receives `"0:01"`.

```bash
npx jest components/countdown/__tests__/Countdown.test.tsx components/prayer/__tests__/Ago.test.tsx --watchman=false --selectProjects=components
```

`Tests: 8 failed, 12 passed, 20 total`. Countdown fails its five en display pins
(`names Asr...at 14:00` expects `2h 29m` and receives `02:29` as one node with no
sections; `rounds the time left up...`; `holds 1s, never 0s...`; `swaps to Magrib the
instant Asr comes`; `counts down to the prayer the overlay opens on`). Ago fails its
three en pins (`at 13:05 reads "Dhuhr 3m ago"` receives `Dhuhr 0:03 ago`; `at 14:00
reads "Dhuhr 58m ago"`; `fades out while the overlay is open`).

```bash
npx jest stores/__tests__/countdown.test.ts --watchman=false --selectProjects=unit
```

`Tests: 2 failed, 26 passed, 28 total`: `display selector emits the formatted string —
identical displayed strings stay identical` (3665 s now reads `01:01`) and `display
selector follows the seconds preference (last-10-minutes rule)`. The ar selector pin
(`٠١:٠١`) passes: ar is untouched in this step.

The new `familyDigits` pins in `shared/__tests__/typography.test.ts` fail red by
absence: `Expected: "Roboto-Medium", Received: undefined`.

Two suites outside the five composer suites pin the en lettered form too; the full
run reddens them as well:

```bash
npx jest __tests__/app/Screen.test.tsx --watchman=false --selectProjects=components
npx jest stores/__tests__/schedule.test.ts --watchman=false --selectProjects=unit
```

`Screen.test.tsx` fails its en ago pins (`:26` expects `Dhuhr 58m ago`, receives
`Dhuhr 0\u2009:\u200958 ago`; `:47` expects `Duha 7h 14m ago`, receives
`Duha 7\u2009:\u200914 ago`); `schedule.test.ts` fails its two display rows (`:2099`
`23h 54m` -> `23:54`, `:2123` `16h 55m` -> `16:55`). `Screen.test.tsx:58`'s negative query
also flips (see contract 5) so it does not become a query for a string that can never
exist.

## Change contracts

1. `shared/time.ts` — `formatTime(seconds: number, hideSeconds = false): string`
   composes today's `formatTimeFixedWidth` body for every locale. Delete
   `formatTimeLettered`, `formatTimeAgoLettered`, `durationLabels`, the
   `DurationLabels` interface and the `intervalToDuration` import (no other line uses
   it). `formatTimeAgo(seconds: number): string` loses its en branch; its body is the
   current non-en body, `localiseDigits` wrapper kept until step 2. The fixed-width
   composer may stay a separate private function or fold into `formatTime`; its bytes
   and behaviour do not change. Re-derive both JSDoc blocks to the one-design truth
   with these examples, and change the JSDoc-contract test to match:
   `formatTime(3665)` -> `"01:01:05"`, `formatTime(3665, true)` -> `"01:01"`,
   `formatTime(45, true)` -> `"00:00:45"`, `formatTime(0)` -> `"00:00:00"`,
   `formatTime(-100)` -> `"00:00:00"`, `formatTime(90000)` -> `"25:00:00"`;
   `formatTimeAgo(45)` -> the catalog `now` word, `formatTimeAgo(120)` -> `"0:02"`,
   `formatTimeAgo(5400)` -> `"1:30"`, `formatTimeAgo(7200)` -> `"2:00"`. The
   `splitColonSections` docblock drops its "English's lettered strings" mention: only
   the held `--:--` fails the digit test now.
2. `shared/typography.ts` — `LocaleTypography` gains `familyDigits: string`;
   both `ARABIC` and `LATIN` set `familyDigits: TEXT.family.medium`. One docblock
   line: the timer's digits are Latin glyphs in every locale (row 82), so the digits
   face is the Latin medium everywhere while word styles stay per-locale.
3. `components/countdown/Countdown.tsx` — the render gate becomes
   `const sections = splitColonSections(displayTime);` (the string's shape decides,
   never the locale). `styles.countdown` sets `fontFamily: ty.familyDigits`. The
   prayer-name style keeps `ty.arabic ? ty.familyRegular : undefined` (the sweep pins
   that expression). The doc comment on `CountdownSectionText` drops its "non-English"
   wording.
4. `components/prayer/Ago.tsx` — the render gate becomes
   `const parts = splitSingleColon(prayerAgo);`. The component docblock drops its
   lettered example and names the colon duration inside the catalog sentence.
5. Test re-derivations, value by value. The rule first, then the values: a default
   call (seconds shown) renders `HH:MM:SS`; a `hideSeconds=true` call renders
   `HH:MM:SS` at 599 s and below and `HH:MM` above. The en pins:
   `formatTime(-100)` and `formatTime(-1)` and `formatTime(0)` -> `"00:00:00"`,
   `formatTime(45)` -> `"00:00:45"`, `formatTime(59)` -> `"00:00:59"`,
   `formatTime(60)` -> `"00:01:00"`, `formatTime(61)` -> `"00:01:01"`,
   `formatTime(90)` -> `"00:01:30"`, `formatTime(599)` -> `"00:09:59"`,
   `formatTime(3600)` -> `"01:00:00"`, `formatTime(3665)` -> `"01:01:05"`,
   `formatTime(7200)` -> `"02:00:00"`, `formatTime(86399)` -> `"23:59:59"`,
   `formatTime(86400)` -> `"24:00:00"`, `formatTime(90000)` -> `"25:00:00"`,
   `formatTime(90061)` -> `"25:01:01"`, `formatTime(10740)` -> `"02:59:00"`;
   with `true`: `formatTime(5, true)` -> `"00:00:05"`, `formatTime(45, true)` ->
   `"00:00:45"`, `formatTime(61, true)` -> `"00:01:01"`, `formatTime(120, true)` ->
   `"00:02:00"`, `formatTime(599, true)` -> `"00:09:59"`, `formatTime(600, true)` and
   `formatTime(601, true)` -> `"00:10"`, `formatTime(3665, true)` -> `"01:01"`.
   The ago pins: `formatTimeAgo(60)` -> `"0:01"`, `formatTimeAgo(120)` -> `"0:02"`,
   `formatTimeAgo(3599)` -> `"0:59"`, `formatTimeAgo(3600)` -> `"1:00"`,
   `formatTimeAgo(5400)` -> `"1:30"`, `formatTimeAgo(7200)` -> `"2:00"`,
   `formatTimeAgo(7260)` -> `"2:01"`. The describe and it names drop their lettered
   wording ("0s" -> the clamp shape). The ar pins (`٠١:٠١` block, `٢:٥٩:٠٠`, the ago
   `٠:٠٢` set) stay byte-identical.
   - `stores/__tests__/countdown.test.ts`: the en selector pins flip
     (3665 -> `"01:01"`, 3700 -> `"01:01"`, 3600 -> `"01:00"`; the seconds-preference
     test's en values flip the same way). The ar pin stays.
   - `Countdown.test.tsx`: the five en tests assert the section render: at 14:00 the
     timer draws `02` and `29` group nodes and one gapped colon
     (`'\u2009:\u2009'`), with no single `"02:29"` node; the round-up test at 59.4 s
     reads `00:01:00` (three groups: 60 s with the seconds preference off still shows
     seconds, the kept 599 s rule); the 1s hold reads `00:00:01`; the Magrib swap
     reads `02:59`; the overlay test reads `05:28`. Keep the existing ar tests
     untouched.
   - `Ago.test.tsx`: the en gate dies, so `parts = splitSingleColon(prayerAgo)` and
     the badge renders one outer `Text` whose children are the two halves around the
     gap node. React Native Testing Library matches a `Text`'s whole concatenated
     content, so the halves are not separately queryable; query the outer node with
     the identity normalizer and the gap node separately:

     ```ts
     const GAP_COLON = '\u2009:\u2009';

     it.each([
       ['13:05', 'Dhuhr 0\u2009:\u200903 ago'],
       ['14:00', 'Dhuhr 0\u2009:\u200958 ago'],
     ])('at %s reads "%s"', async (time, sentence) => {
       showLondonDay('2026-09-11', time);
       await render(<PrayerAgo type={ScheduleType.Standard} />);

       expect(screen.getByText(sentence, { normalizer: (s) => s })).toBeVisible();
       expect(screen.getByText(GAP_COLON, { normalizer: (s) => s })).toBeOnTheScreen();
     });
     ```

     The overlay-fade test asserts the outer node not visible:
     `getByText('Dhuhr 0\u2009:\u200958 ago', { normalizer: (s) => s }).not.toBeVisible();`
     (the fade rides the badge's outer node). The ar gap test stays as it is. The
     `now` test keeps its single-node query (no gap node).
   - `typography.test.ts`: `expectArabicRecord` and the latin record block each gain
     `expect(ty.familyDigits).toBe('Roboto-Medium');`.
   - `Screen.test.tsx`: the en ago badge query flips to the outer node with the identity
     normalizer — `:26` `getByText('Dhuhr 0\u2009:\u200958 ago', { normalizer: (s) => s })`,
     `:47` `getByText('Duha 7\u2009:\u200914 ago', { normalizer: (s) => s })`, and `:58`'s
     negative query uses that same first sentence.
   - `schedule.test.ts`: the two display rows flip `23h 54m` -> `23:54` (`:2099`) and
     `16h 55m` -> `16:55` (`:2123`).

## Green run

All five suites pass, then:

```bash
npx tsc --noEmit && npx biome check . --error-on-warnings
```

Both exit 0.

## Break script

`scripts/break-step1.sh` in this folder. It re-inserts the en render gate in
`Countdown.tsx` (mutation asserted found once), runs `Countdown.test.tsx`, and catches
the en section pins failing (`Unable to find an element with text: 02`), restores the
file, verifies `git diff --quiet`, prints `ALL AS EXPECTED: 1`.

## Version and commit

Version command: the next patch after uat's `package.json` at branch time. Set it in
`app.json`, `package.json` and `android/app/build.gradle` (`versionName`), matching,
`app.json` first. Commit message:

```
<VERSION> - feat(82): one countdown design for every locale, en joins the fixed-width colon format
```

Files added by name: the four source files, the seven test files, this plan folder's
`PLAN.md` and `LOG.md`, and `ai/plans/README.md` (the IN PROGRESS flip the executor's
loop step 1 makes).

## Review checklist

- No locale branch survives in `formatTime`, `formatTimeAgo`, `Countdown.tsx` or
  `Ago.tsx`.
- `currentLocaleId` imports remain only where the module-scope typography still uses
  them.
- No dim level, colour, gap width or size token changed against row 72's landed values.
- The ar pins in every touched suite are byte-identical to before this step.
- The JSDoc examples and the JSDoc-contract test state the same values.

## Merge

```bash
git checkout uat && git merge --no-ff feat/82-format-flip -m "<VERSION> - merge feat/82-format-flip: step 1, the countdown format flip"
```

## Done when

Checklist ticked, LOG.md entry appended with the red lines and the hook's `Tests:` and
coverage lines, merge landed on uat.
