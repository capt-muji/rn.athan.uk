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
`components/countdown/__tests__/Countdown.test.tsx`,
`components/prayer/__tests__/Ago.test.tsx`, `shared/__tests__/typography.test.ts`.

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
First failing line shape: `Expected: "1m" / Received: "0:01"`.

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
   `formatTimeAgo(5400)` -> `"1:30"`, `formatTimeAgo(7200)` -> `"2:00"`.
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
5. Test re-derivations, value by value:
   - `time.test.ts`: the 15 en pins above flip to the colon values from the JSDoc
     contract (`formatTime(60)` -> `"00:01"`, `formatTime(90)` -> `"00:01:30"`,
     `formatTime(599)` -> `"00:09:59"`, `formatTime(3600)` -> `"01:00"`,
     `formatTime(86399)` -> `"23:59:59"`, `formatTime(86400)` -> `"24:00:00"`,
     `formatTime(90061)` -> `"25:01:01"`, `formatTime(5, true)` -> `"00:00:05"`;
     `formatTimeAgo(60)` -> `"0:01"`, `formatTimeAgo(3599)` -> `"0:59"`,
     `formatTimeAgo(3600)` -> `"1:00"`, `formatTimeAgo(7260)` -> `"2:01"`). The
     describe and it names drop their lettered wording ("0s" -> the clamp shape). The
     ar pins (`٠١:٠١` block, `٢:٥٩:٠٠`, the ago `٠:٠٢` set) stay byte-identical.
   - `stores/__tests__/countdown.test.ts`: the en selector pins flip
     (3665 -> `"01:01"`, 3700 -> `"01:01"`, 3600 -> `"01:00"`; the seconds-preference
     test's en values flip the same way). The ar pin stays.
   - `Countdown.test.tsx`: the five en tests assert the section render: at 14:00 the
     timer draws `02` and `29` group nodes and one gapped colon
     (`'\u2009:\u2009'`), with no single `"02:29"` node; the round-up test at 59.4 s
     reads `00:01`; the 1s hold reads `00:00:01`; the Magrib swap reads `02:59`; the
     overlay test reads `05:28`. Keep the existing ar tests untouched.
   - `Ago.test.tsx`: `at 13:05 reads "Dhuhr 0:03 ago"` and
     `at 14:00 reads "Dhuhr 0:58 ago"`, both with the gapped-colon node present; the
     overlay-fade test queries `"Dhuhr 0:58 ago"`.
   - `typography.test.ts`: `expectArabicRecord` and the latin record block each gain
     `expect(ty.familyDigits).toBe('Roboto-Medium');`.

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

Files added by name: the four source files, the five test files, this plan folder's
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
