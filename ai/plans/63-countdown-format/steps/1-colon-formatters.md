# Step 1: The colon formatters and the app-side test sweep

Requirements: R1.1, R1.2, R1.3, R1.4, R2.1, R2.2, R4.1
Weight: 2

## Anchor check

Run the pre-flight: save `scripts/preflight-63.sh` to `$TMPDIR` and run
`bash $TMPDIR/preflight-63.sh` with the repository root as the working
directory. Anchors this step
edits against: `time-imports`, `time-labels`, `time-format-core`, `time-ago`,
`countdown-pin`, `countdown-ar-pin`, `schedule-pin`, `hero-pin`, `screen-pin`,
`ago-pin`. A count other than 1 is a STOP.

## Goal

`formatTime` and `formatTimeAgo` emit the ruled colon shapes; the six test files
that pin the old letter strings pin the new shapes instead; the label machinery
in `shared/time.ts` is deleted; the two docblocks quoting old shapes are
rewritten.

## Branch

`git checkout -b feat/63-colon-formatters uat`

## Files

- `shared/time.ts` (change)
- `shared/__tests__/time.test.ts` (change)
- `stores/__tests__/countdown.test.ts` (change)
- `stores/__tests__/schedule.test.ts` (change)
- `components/countdown/__tests__/Countdown.test.tsx` (change)
- `__tests__/app/Screen.test.tsx` (change)
- `hooks/usePrayerAgo.ts` (docblock examples only, change contract item 6)
- `components/prayer/__tests__/Ago.test.tsx` (change)

## Red tests

Rewrite the expectations first. Against unchanged code every rewritten case must
fail. The exact new values:

`shared/__tests__/time.test.ts`, in `describe('formatTime')`:

- `it('returns "0s" for negative seconds')` becomes
  `it('returns "0:00" for negative seconds')`; both expectations become
  `'0:00'`.
- The seconds block `it` is renamed to `'formats seconds'` (dropping its
  trailing adverb); `formatTime(0)` → `'0:00'`,
  `formatTime(45)` → `'0:45'`, `formatTime(59)` → `'0:59'`, and add
  `expect(formatTime(5, true)).toBe('0:05');` with the comment
  `// zero-padded seconds group: the break target for the M:SS shape`.
- The minutes block `it` is renamed to `'formats minutes'`;
  `formatTime(60)` → `'1:00'` (comment:
  whole minute), `formatTime(61)` → `'1:01'`, `formatTime(90)` → `'1:30'`,
  `formatTime(599)` → `'9:59'`.
- The hours block `it` is renamed to `'formats hours'`;
  `formatTime(3600)` → `'1:00:00'`,
  `formatTime(3665)` → `'1:01:05'`, `formatTime(7200)` → `'2:00:00'`.
- `it('converts days to hours')`: `formatTime(90000)` → `'25:00:00'`.
- `it('handles the 24h and multi-day boundaries')`: `formatTime(86399)` →
  `'23:59:59'`, `formatTime(86400)` → `'24:00:00'` (comment: exactly one day),
  `formatTime(90061)` → `'25:01:01'`.
- `it('shows seconds when hideSeconds=false (default)')`:
  `formatTime(3665, false)` → `'1:01:05'`, `formatTime(3665)` → `'1:01:05'`.
- `it('hides seconds when hideSeconds=true and time > 599s')`:
  `formatTime(3665, true)` → `'1:01'`, `formatTime(600, true)` → `'0:10'`.
- `it('shows seconds in last 10 minutes even with hideSeconds=true')`:
  `formatTime(599, true)` → `'9:59'`, `formatTime(45, true)` → `'0:45'`.
- `it('draws the hideSeconds threshold at 599s, not at 60s')`:
  `formatTime(61, true)` → `'1:01'`, `formatTime(120, true)` → `'2:00'`
  (comment: a whole minute drops the seconds group),
  `formatTime(599, true)` → `'9:59'` (comment: last second that still shows
  seconds), `formatTime(600, true)` → `'0:10'`, `formatTime(601, true)` →
  `'0:10'`; the 599/600 pair carries the boundary comment
  `// the ruled shapes flip at the cutoff: 9:59 at 599 s, 0:10 at 600 s (D75)`.
- `JSDoc contract` describe, `it('pins every example in the JSDoc')`:
  `formatTime(3665)` → `'1:01:05'`, `formatTime(3665, true)` → `'1:01'`,
  `formatTime(45, true)` → `'0:45'`, `formatTime(5, true)` → `'0:05'`,
  `formatTime(0)` → `'0:00'`, `formatTime(-100)` → `'0:00'`,
  `formatTime(90000, true)` → `'25:00'`. The describe's leading comment names
  `formatTime(45, true, true)` among the wrong examples it guards against;
  rewrite that clause to name `formatTime(45, true)`, the call that replaces it.
- Delete `it('lets forceHideSeconds suppress seconds only beside another unit')`
  and every three-argument `formatTime` call (the parameter is deleted, P2).
- `native digits (D57)` describes keep their inputs and change values only: the
  `formatTime` block pins `formatTime(10740)` → `'٢:٥٩:٠٠'` (its `en` twin reads
  `'2:59:00'`) and `formatTime(7200)` → `'٢:٠٠:٠٠'`; the branch test's four
  expectations become `'٠:٠٠'` (negative), `'٠:٤٥'` (seconds-only), `'١:٠٠'`
  (whole minute), `'٢:٠٠:٠٠'` (whole hour). The `en` cases keep Latin digits
  with colons.

In `describe('formatTimeAgo')`:

- `formatTimeAgo(45)` → `'now'`, `formatTimeAgo(0)` → `'now'`.
- Minute cases: `formatTimeAgo(60)` → `'0:01'`, `formatTimeAgo(120)` →
  `'0:02'`, and every other minute input `X` renders
  `'0:' + pad2(floor(X / 60))`.
- Hour cases: `formatTimeAgo(5400)` → `'1:30'`, `formatTimeAgo(7200)` →
  `'2:00'`; a whole-hour input `H*3600` renders `'{H}:00'`. The hours-and-minutes
  block `it` drops its trailing adverb too.
- Rewrite `it('labels durations from the catalog')` to pin the `now` word from
  the active catalog: under `en`, `formatTimeAgo(30)` is `'now'`; inside
  `setActiveLocale('ar')` with restoration in `finally`, it is `'الآن'`.
- `ar` digit cases keep their inputs and change values only:
  `formatTimeAgo(120)` → `'٠:٠٢'`, `formatTimeAgo(3600)` → `'١:٠٠'`,
  `formatTimeAgo(7260)` → `'٢:٠١'`; the `en` block's single site (`7260`)
  reads `'2:01'`.

`stores/__tests__/countdown.test.ts`:

- Line ~670 and ~674: `'1h 1m'` → `'1:01'` (both), and the band comment
  `(1h 1m spans 3660-3719s)` → `(1:01 spans 3660-3719s)`.
- Line ~678: `'1h'` → `'1:00'`.
- Line ~690: `'١س ١د'` → `'١:٠١'`.
- Line ~701: `'45s'` → `'0:45'`.

`stores/__tests__/schedule.test.ts` R11/R12 table: `display: '23h 54m'` →
`'23:54'`; `display: '16h 55m'` → `'16:55'`.

`components/countdown/__tests__/Countdown.test.tsx`: `'2h 29m'` → `'2:29'`,
`'1m'` → `'1:00'` (59.4 s left ceils to 60 s, so the colon renderer emits
`1:00`), `'1s'` → `'0:01'`, `'2h 59m'` → `'2:59'`,
`'5h 28m'` → `'5:28'`, and the native-digits hero pin `'٢س ٢٩د'` → `'٢:٢٩'`.
The two titles pinning the old shapes in prose become `reads 1:00 and not
0:59` and `holds 0:01, never 0:00`.

`__tests__/app/Screen.test.tsx`: `'Dhuhr 58m ago'` → `'Dhuhr 0:58 ago'`
(two sites), `'Duha 7h 14m ago'` → `'Duha 7:14 ago'`.

`components/prayer/__tests__/Ago.test.tsx`: table row `'Dhuhr 3m ago'` →
`'Dhuhr 0:03 ago'`, `'Dhuhr 58m ago'` → `'Dhuhr 0:58 ago'`, and the visibility
assertion follows the same string.

Run, from the repository root:

```
npx jest shared/__tests__/time.test.ts --watchman=false --selectProjects=unit
npx jest stores/__tests__/countdown.test.ts stores/__tests__/schedule.test.ts --watchman=false --selectProjects=unit
npx jest components/countdown/__tests__/Countdown.test.tsx __tests__/app/Screen.test.tsx components/prayer/__tests__/Ago.test.tsx --watchman=false --selectProjects=components
```

Expected: every rewritten case fails with `Expected: "…:<digits>"` against
`Received: "…h …m"` shapes, and no case outside the rewritten ones fails.
`tsc` stays clean once the three-argument calls are deleted with the rewrite;
`TS2554: Expected 1-2 arguments, but got 3` appears only if the parameter is
deleted before its test calls. If a test the plan did not name fails, STOP.

## Change contracts

In `shared/time.ts`:

1. Delete the `intervalToDuration` import line and the blank line that follows
   it (Biome flags the import once `formatTime` stops calling it, and the
   blank line would double up).
2. Delete `DurationLabels` and `durationLabels()` wholesale (the anchor
   `time-labels` block, fifteen lines ending `});`) plus one adjacent blank
   line.
3. Replace `formatTime` and its docblock with exactly:

```ts
/**
 * Converts seconds into the colon countdown format (owner ruling 2026-10-12:
 * numbers and colons only, every language)
 *
 * Formatting rules:
 * 1. Seconds hidden: H:MM — minutes zero-padded, hours not ("0:42", "1:32", "25:00")
 * 2. Seconds shown: H:MM:SS over an hour, M:SS under ("9:45", "1:01:05")
 * 3. With hideSeconds, seconds still render inside the final 599s, so the ruled
 *    shapes flip at the cutoff: "9:59" at 599 s, "0:10" at 600 s
 * 4. Zero and negative clamp to "0:00"
 * 5. Days fold into hours ("25:00", never a day unit)
 *
 * @param seconds Time in seconds (negative clamps to "0:00")
 * @param hideSeconds If true, hides seconds beyond the final 599s (default: false)
 * @returns Formatted time string
 *
 * Every example below is pinned by "pins every example in the JSDoc" in
 * shared/__tests__/time.test.ts. Change one and change both.
 *
 * @example
 * formatTime(3665) // "1:01:05" (default shows seconds)
 * formatTime(3665, true) // "1:01" (hideSeconds in effect)
 * formatTime(45, true) // "0:45" (shows seconds inside the final 599s)
 * formatTime(5, true) // "0:05" (zero-padded seconds group)
 * formatTime(0) // "0:00"
 * formatTime(-100) // "0:00"
 * formatTime(90000, true) // "25:00" (days converted to hours)
 */
export const formatTime = (seconds: number, hideSeconds = false): string => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const shouldShowSeconds = !hideSeconds || seconds <= 599;

  const composed = shouldShowSeconds
    ? hours > 0
      ? `${hours}:${pad2(minutes)}:${pad2(secs)}`
      : `${minutes}:${pad2(secs)}`
    : `${hours}:${pad2(minutes)}`;
  return localiseDigits(composed);
};
```

4. Replace `formatTimeAgo` and its docblock with exactly:
```ts
/**
 * Formats seconds elapsed into the colon "ago" format, minute resolution
 *
 * @param seconds - Seconds since prayer occurred (0 or positive)
 * @returns "now" (<60s, the catalog word), else H:MM ("0:02", "1:30", "2:00")
 *
 * @example
 * formatTimeAgo(45)      // Returns: "now"
 * formatTimeAgo(120)     // Returns: "0:02"
 * formatTimeAgo(5400)    // Returns: "1:30"
 * formatTimeAgo(7200)    // Returns: "2:00"
 * formatTimeAgo(0)       // Returns: "now"
 */
export const formatTimeAgo = (seconds: number): string => {
  if (seconds < 60) {
    return localiseDigits(t('duration.now'));
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return localiseDigits(`${hours}:${pad2(minutes % 60)}`);
};
```

5. In `getSecondsRemaining`'s docblock, rewrite the four quoted display
   strings to the colon shapes they now render: `displays "1s" — never "0s"`
   becomes `displays "0:01" — never "0:00"`, `a frozen "0s"` becomes
   `a frozen "0:00"`, and `reads "42s"` becomes `reads "0:42"`. The rounding
   model itself is untouched.
6. In `hooks/usePrayerAgo.ts`'s docblock, the two example lines
   `"Dhuhr 10h 15m ago"` and `"Asr 2h 30m ago"` become `"Dhuhr 10:15 ago"`
   and `"Asr 2:30 ago"` (docblock only; the file joins the Files list for
   this edit alone).

What the contract must never do: read the real clock; keep any `labels`
parameter; touch `widgetStrings()` or any widget file; change
`getSecondsRemaining`'s rounding model; emit a space or a letter.

## Green run

The three commands from the red section, all passing, then `npx tsc --noEmit`
and `npx biome check . --error-on-warnings`, both exit 0.

## Break script

`bash scripts/break-step1.sh` from the plan folder, copied to `$TMPDIR` and run
from the repository root against the merged step. It unpads both minute groups
and the seconds group in `shared/time.ts`, runs the two formatter suites,
expects the named failures (`'0:05'`, `'0:02'`, `'1:01'` shapes break), restores
the file, and ends `ALL AS EXPECTED: 1`.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the version
lock (`mkdir $HOME/athan-gitree/version.lock`, retry while it exists, `rmdir`
after merge). Set it in `app.json`, `package.json` and
`android/app/build.gradle` (`versionName`). Add the eight files by name plus
`ai/plans/README.md` (status `IN PROGRESS, step 1`) and this folder's `PLAN.md`
and `LOG.md`. Message:

```
<VERSION> - feat(time): colon countdown formats, H:MM and seconds shapes

formatTime renders H:MM, H:MM:SS over an hour, M:SS under while seconds show,
0:00 clamp; formatTimeAgo renders H:MM and keeps duration.now; DurationLabels,
durationLabels, the forceHideSeconds parameter and the date-fns import are
deleted. Test sweep across the six pinning suites. R1.1-R2.2, R4.1.
```

## Review checklist

- The diff touches only the eight listed files plus plan and queue files.
- No widget file, no `widgetStrings()`, no `duration.h/m/s` catalog key changed.
- Both formatters wrap in exactly one `localiseDigits` call.
- The JSDoc examples equal the pinned test values one for one.
- The boundary comment sits on the 599/600 cases.

## Merge

`git checkout uat && git merge --no-ff feat/63-colon-formatters -m "<VERSION> -
merge feat/63-colon-formatters: step 1, colon formatters"`. A conflict aborts
and STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the step heading, commit sha, hook
lines, break line and `session:` line.
