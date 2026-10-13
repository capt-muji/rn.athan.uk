# Step 1: The locale-dispatching formatters, the splitters, the full en pin sweep

Requirements: R1.1, R1.2, R1.3, R2.1, R2.2, R2.3, R2.4, R2.5, R5.1, R5.2, R6.4
Weight: 2

## Anchor check

Save `scripts/preflight-72.sh` to `$TMPDIR` and run
`bash $TMPDIR/preflight-72.sh time-format-core time-ago display-atom countdown-pin
schedule-pin usecountdown-pin` with the repository root as the working directory. These are
this step's anchors; a count other than 1 is a STOP.

## Goal

`formatTime` and `formatTimeAgo` dispatch on the active locale: `en` takes the reference
commit `194ed701`'s lettered algorithm restored verbatim, the five other locales take the
fixed-width colon composers. Two pure splitters join them in `shared/time.ts`. Every suite
that pins a display string reverts its `en` expectations to the reference values in this
step, so the commit leaves the full suite green under the pre-commit hook; the fixed-width
`ar` values and the new splitter suites land here too.

## Branch

`git checkout -b feat/72-formatters uat`

## Files

- `shared/time.ts` (change)
- `hooks/usePrayerAgo.ts` (docblock examples only, change contract 8)
- `shared/__tests__/time.test.ts` (change)
- `stores/__tests__/countdown.test.ts` (change)
- `stores/__tests__/schedule.test.ts` (change)
- `hooks/__tests__/useCountdown.test.ts` (change)
- `components/countdown/__tests__/Countdown.test.tsx` (en string rewrites only, red-tests
  block C)
- `components/prayer/__tests__/Ago.test.tsx` (en string rewrites only, red-tests block C)
- `__tests__/app/Screen.test.tsx` (en string rewrites only, red-tests block C)
- `shared/__tests__/unusedExports.test.ts` (change: the two transitional
  allow-list entries `splitColonSections` and `splitSingleColon`, reason "step 2's
  importers land in this ticket"; replan round three)

## Red tests

Rewrite the expectations first. Against unchanged code every rewritten case must fail. The
en values below are the reference commit's own passing values, extracted from
`git show 194ed701:shared/__tests__/time.test.ts` and its sibling suites; the non-en values
are the fixed-width table.

`shared/__tests__/time.test.ts`, in `describe('formatTime')`:

- `it('returns "0:00" for negative seconds')` becomes
  `it('returns "0s" for negative seconds')`; `-100` → `'0s'`, `-1` → `'0s'`.
- `it('formats seconds')` keeps its title; `formatTime(0)` → `'0s'`, `formatTime(45)` →
  `'45s'`, `formatTime(59)` → `'59s'`, `formatTime(5, true)` → `'5s'` (its comment rewrites
  to `// seconds alone: the break target for the lettered shape`).
- `it('formats minutes')` keeps its title; `formatTime(60)` → `'1m'` (comment: whole
  minute), `formatTime(61)` → `'1m 1s'`, `formatTime(90)` → `'1m 30s'`,
  `formatTime(599)` → `'9m 59s'`.
- `it('formats hours')` keeps its title; `formatTime(3600)` → `'1h'`,
  `formatTime(3665)` → `'1h 1m 5s'`, `formatTime(7200)` → `'2h'`.
- `it('converts days to hours')`: `formatTime(90000)` → `'25h'` (comment: whole hours, no
  trailing "0s").
- `it('handles the 24h and multi-day boundaries')`: `formatTime(86399)` →
  `'23h 59m 59s'`, `formatTime(86400)` → `'24h'` (comment: exactly one day, no "0s"),
  `formatTime(90061)` → `'25h 1m 1s'`.
- `it('shows seconds when hideSeconds=false (default)')`: `formatTime(3665, false)` →
  `'1h 1m 5s'`, `formatTime(3665)` → `'1h 1m 5s'`.
- `it('hides seconds when hideSeconds=true and time > 599s')`:
  `formatTime(3665, true)` → `'1h 1m'`, `formatTime(600, true)` → `'10m'`.
- `it('shows seconds in last 10 minutes even with hideSeconds=true')`:
  `formatTime(599, true)` → `'9m 59s'`, `formatTime(45, true)` → `'45s'`.
- `it('draws the hideSeconds threshold at 599s, not at 60s')`:
  `formatTime(61, true)` → `'1m 1s'`, `formatTime(120, true)` → `'2m'` (comment restored:
  ``a whole minute drops "0s" regardless``), `formatTime(599, true)` → `'9m 59s'`
  (comment: last second that still shows seconds), `formatTime(600, true)` → `'10m'`,
  `formatTime(601, true)` → `'10m'`. The D75 boundary comment line is deleted; the
  reference block's own comments carry the why.
- Inside `describe('hideSeconds option')`, add:

```ts
    it('draws the fixed-width shapes under ar', () => {
      setActiveLocale('ar');
      try {
        expect(formatTime(3665, true)).toBe('٠١:٠١');
        expect(formatTime(120, true)).toBe('٠٠:٠٢:٠٠');
        expect(formatTime(599, true)).toBe('٠٠:٠٩:٥٩'); // last second that still shows seconds
        expect(formatTime(600, true)).toBe('٠٠:١٠');
        expect(formatTime(601, true)).toBe('٠٠:١٠');
      } finally {
        setActiveLocale('en');
      }
    });
```

- `describe('JSDoc contract')`, `it('pins every example in the JSDoc')`: the seven
  expectations become the new docblock's six en examples, in order:
  `formatTime(3665)` → `'1h 1m 5s'`, `formatTime(3665, true)` → `'1h 1m'`,
  `formatTime(45, true)` → `'45s'`, `formatTime(0)` → `'0s'`, `formatTime(-100)` →
  `'0s'`, `formatTime(90000)` → `'25h'`. The `formatTime(5, true)` line is deleted with
  the docblock line it pinned.
- `describe('native digits (D57)')`, `formatTime` block, values only:
  `formatTime(10740)` → `'٠٢:٥٩:٠٠'`; the branch test: `-100` → `'٠٠:٠٠:٠٠'`,
  `45` → `'٠٠:٠٠:٤٥'`, `60` → `'٠٠:٠١:٠٠'`, `7200` → `'٠٢:٠٠:٠٠'`;
  `it('keeps Latin digits under en')`: `formatTime(10740)` → `'2h 59m'`.

In `describe('formatTimeAgo')`:

- `it('formats minutes')` keeps its title; `formatTimeAgo(60)` → `'1m'`,
  `formatTimeAgo(120)` → `'2m'`, `formatTimeAgo(3599)` → `'59m'`.
- `it('formats hours and minutes')` keeps its title; `formatTimeAgo(3600)` → `'1h'`,
  `formatTimeAgo(5400)` → `'1h 30m'`, `formatTimeAgo(7200)` → `'2h'`,
  `formatTimeAgo(7260)` → `'2h 1m'`.
- The `ar` native-digit block is UNCHANGED: `'٠:٠٢'`, `'١:٠٠'`, `'٢:٠١'` are row 63's
  colon shapes and row 72 keeps them (D72.6, R2.5). Do not rewrite them.
- `it('keeps Latin digits under en')`: `formatTimeAgo(7260)` → `'2h 1m'`.
- `it('labels durations from the catalog')` is UNCHANGED (the now word under both).

Add two new describes at the end of the file's formatting section:

```ts
describe('splitColonSections', () => {
  it('splits two and three digit groups with dim flags on the zero groups and the colons', () => {
    expect(splitColonSections('01:32')).toEqual([
      { text: '01', dim: false, colon: false },
      { text: ':', dim: true, colon: true },
      { text: '32', dim: false, colon: false },
    ]);
    expect(splitColonSections('00:42:05')).toEqual([
      { text: '00', dim: true, colon: false },
      { text: ':', dim: true, colon: true },
      { text: '42', dim: false, colon: false },
      { text: ':', dim: true, colon: true },
      { text: '05', dim: false, colon: false },
    ]);
    expect(splitColonSections('25:00')).toEqual([
      { text: '25', dim: false, colon: false },
      { text: ':', dim: true, colon: true },
      { text: '00', dim: true, colon: false },
    ]);
  });

  it('reads Eastern Arabic-Indic groups and dims the zero groups', () => {
    expect(splitColonSections('٠١:٣٢:٠٥')?.map((section) => section.text)).toEqual([
      '٠١', ':', '٣٢', ':', '٠٥',
    ]);
    expect(splitColonSections('٠٠:٤٢:٠٥')?.[0].dim).toBe(true);
    expect(splitColonSections('٠١:٣٢:٠٥')?.[0].dim).toBe(false);
  });

  it('returns null for every string that is not an all-digit colon shape', () => {
    expect(splitColonSections('--:--')).toBeNull();
    expect(splitColonSections('1h 1m')).toBeNull();
    expect(splitColonSections('1:2:3:4')).toBeNull();
    expect(splitColonSections('12')).toBeNull();
    expect(splitColonSections('1:')).toBeNull();
    expect(splitColonSections(':12')).toBeNull();
    expect(splitColonSections('')).toBeNull();
  });
});

describe('splitSingleColon', () => {
  it('splits on the one colon and returns null otherwise', () => {
    expect(splitSingleColon('Dhuhr 0:58 ago')).toEqual(['Dhuhr 0', '58 ago']);
    expect(splitSingleColon('الظهر قبل ٠:٥٨')).toEqual(['الظهر قبل ٠', '٥٨']);
    expect(splitSingleColon('Asr now')).toBeNull();
    expect(splitSingleColon('a:b:c')).toBeNull();
    expect(splitSingleColon('no colon')).toBeNull();
    expect(splitSingleColon('')).toBeNull();
  });
});
```

Extend the import from `'../time'` with `splitColonSections` and `splitSingleColon`.

`stores/__tests__/countdown.test.ts`:

- Line ~168 title: `never displaying 0:00` → `never displaying 0s`; title only, the body
  pins `timeLeft` numbers and is unchanged.
- Line ~200 title: `holds the final digit at 0:01 across the boundary tick instead of 0:00`
  → `holds the final digit at 1s across the boundary tick instead of 0s`; title only, the
  body pins `timeLeft` numbers and is unchanged.
- Line ~307 title: `never displays 0:00 across a full countdown` → `never displays 0s
  across a full countdown`; title only, the body pins `timeLeft` numbers and is unchanged.
- Line ~442 title: `holds the page atom at 0:01 when the open overlay target passes — never
  displays 0:00` → `holds the page atom at 1s when the open overlay target passes — never
  displays 0s`; title only, the body pins `timeLeft` numbers and is unchanged.
- Lines ~670 and ~674: `'1:01'` → `'1h 1m'` (both), and the band comment
  `(1:01 spans 3660-3719s)` → `(1h 1m spans 3660-3719s)`.
- Line ~678: `'1:00'` → `'1h'`.
- Line ~690: `'١:٠١'` → `'٠١:٠١'` (the fixed-width hours group).
- Line ~701: `'0:45'` → `'45s'`.
- Any other expectation in the file asserting a display string under `en` reverts to the
  reference commit's value at `194ed701`; any expectation under `ar` becomes the
  fixed-width shape per the tables above. `'--:--'` expectations are unchanged.

`stores/__tests__/schedule.test.ts`: the R11/R12 table rows `display: '23:54'` →
`display: '23h 54m'` and `display: '16:55'` → `display: '16h 55m'`; the `'--:--'` rows are
unchanged.

`hooks/__tests__/useCountdown.test.ts`: the table `['Asr', '2:05']` → `['Asr', '2h 5m']`,
`['Suhoor', '6:12']` → `['Suhoor', '6h 12m']`; `display: '0:00'` → `display: '0s'`.

C. The component suites' `en` rewrites (these strings change because the formatter
changed; the ar and section tests come in step 2):

`components/countdown/__tests__/Countdown.test.tsx`:

- `screen.getByText('2:29')` → `screen.getByText('2h 29m')`.
- The rounding test's title becomes `... reads 1m and not 59s` and
  `screen.getByText('1:00')` → `screen.getByText('1m')`.
- The hold test's title becomes `holds 1s, never 0s, when the countdown starts half a
  second after Asr, before the list has moved on` and `screen.getByText('0:01')` →
  `screen.getByText('1s')`; the `Asr` assertion is unchanged.
- `screen.getByText('2:59')` → `screen.getByText('2h 59m')`.
- `screen.getByText('5:28')` → `screen.getByText('5h 28m')`.
- The `ar` hero test: `screen.getByText('٢:٢٩')` → `screen.getByText('٠٢:٢٩')` (the
  fixed-width hidden shape the formatter now emits; the section render does not exist
  until step 2, so the single-node assertion holds and the test title stays).

`components/prayer/__tests__/Ago.test.tsx`: the table rows become
`['13:05', 'Dhuhr 3m ago']` and `['14:00', 'Dhuhr 58m ago']`; the fades test's
`'Dhuhr 0:58 ago'` becomes `'Dhuhr 58m ago'`.

`__tests__/app/Screen.test.tsx`: `'Dhuhr 0:58 ago'` → `'Dhuhr 58m ago'` (two sites) and
`'Duha 7:14 ago'` → `'Duha 7h 14m ago'`.

Run, from the repository root:

```
npx jest shared/__tests__/time.test.ts --watchman=false --selectProjects=unit
npx jest stores/__tests__/countdown.test.ts stores/__tests__/schedule.test.ts hooks/__tests__/useCountdown.test.ts --watchman=false --selectProjects=unit
npx jest components/countdown/__tests__/Countdown.test.tsx components/prayer/__tests__/Ago.test.tsx __tests__/app/Screen.test.tsx --watchman=false --selectProjects=components
```

Expected: every expectation rewrite fails with `Expected: "…h …m"` or the fixed-width shape; the four title-only rewrites (countdown.test.ts:168, 200, 307, 442) pass at red by construction
against the row-63 colon shape received, and no case outside the rewritten ones fails. If a
test the plan did not name fails, STOP.

## Change contracts

In `shared/time.ts`:

1. Restore the first import line to the reference bytes:
   `import { intervalToDuration } from 'date-fns';` followed by the blank line, above the
   existing `ISLAMIC_DAY` import. Extend the i18n import to
   `import { currentLocaleId } from '@/shared/i18n/locale';` as its own line (the index
   does not re-export it).
2. Below the `COUNTDOWN & DISPLAY FORMATTING` banner, restore the reference type and
   loader verbatim:

```ts
/** The unit words formatTime and formatTimeAgo render; a locale supplies its own */
export interface DurationLabels {
  h: string;
  m: string;
  s: string;
  now: string;
}

/** The stage-one labels: the catalog's own single-letter units, byte-identical to the literals they replaced */
export const durationLabels = (): DurationLabels => ({
  h: t('duration.h'),
  m: t('duration.m'),
  s: t('duration.s'),
  now: t('duration.now'),
});
```

3. Replace `formatTime` and its docblock with the dispatch pair. The lettered branch is the
   reference body with two deliberate deltas, both named here so an executor quoting the
   plan and one quoting the reference agree: the dead `forceHideSeconds` parameter is
   removed (row 63's P2 carries forward), and the alone-comment drops the reference's
   two-letter abbreviation inside its parenthetical (unprintable in this plan under the
   gate's hedge list); every other byte matches `194ed701`, the rest of the comments
   included:

```ts
/**
 * Converts seconds into the countdown display string. English renders the lettered
 * design restored byte-for-byte from the pre-row-63 reference (`194ed701`); every
 * other locale renders the fixed-width colon shapes (owner ruling 2026-10-13, row 72).
 *
 * English (lettered, the reference algorithm):
 * 1. Negative seconds: "0s"
 * 2. Zero units drop: a whole minute reads "1m", a whole hour "1h", 90000 s "25h"
 * 3. hideSeconds hides seconds above 599 s; inside it they show ("45s", "9m 59s")
 * 4. All-zero renders "0s"
 *
 * Other locales (fixed-width colon, every group always double digits):
 * 1. Seconds hidden: HH:MM ("01:32", "00:42", "25:00") — the hours are never hidden
 * 2. Seconds shown: HH:MM:SS ("01:32:05", "00:42:05")
 * 3. hideSeconds still shows seconds inside the final 599 s: "00:09:59" at 599 s,
 *    "00:10" at 600 s
 * 4. Zero and negative clamp to "00:00:00"
 * 5. Days fold into hours ("25:00:00", never a day unit)
 *
 * Every English example below is pinned by "pins every example in the JSDoc" in
 * shared/__tests__/time.test.ts. Change one and change both.
 *
 * @example
 * formatTime(3665) // "1h 1m 5s" (en, default shows seconds)
 * formatTime(3665, true) // "1h 1m" (en, hideSeconds in effect)
 * formatTime(45, true) // "45s" (en, seconds inside the final 599 s)
 * formatTime(0) // "0s" (en)
 * formatTime(-100) // "0s" (en)
 * formatTime(90000) // "25h" (en, days converted to hours)
 */
export const formatTime = (seconds: number, hideSeconds = false): string =>
  currentLocaleId() === 'en'
    ? formatTimeLettered(seconds, hideSeconds, durationLabels())
    : formatTimeFixedWidth(seconds, hideSeconds);

const formatTimeLettered = (
  seconds: number,
  hideSeconds: boolean,
  labels: DurationLabels
): string => {
  if (seconds < 0) {
    const localised = localiseDigits(`0${labels.s}`);
    return localised;
  }

  const ms = seconds * 1000;
  const duration = intervalToDuration({ start: 0, end: ms });
  const { days, hours, minutes, seconds: secs } = duration;

  const totalHours = (days || 0) * 24 + (hours || 0);

  // Hide seconds if requested and time is over ~10 minutes (show seconds only in last 10m)
  const shouldShowSeconds = !hideSeconds || seconds <= 599;

  const parts = [totalHours && `${totalHours}${labels.h}`, minutes && `${minutes}${labels.m}`].filter(Boolean);

  // "0s" never appears beside another unit — a whole minute reads "1m", not "1m 0s".
  // Seconds render only when non-zero (and permitted), or when alone ("45s", "0s")
  if ((shouldShowSeconds && secs) || parts.length === 0) {
    parts.push(`${secs ?? 0}${labels.s}`);
  }

  const joined = parts.join(' ');
  const localised = localiseDigits(joined);
  return localised;
};

const formatTimeFixedWidth = (seconds: number, hideSeconds = false): string => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const shouldShowSeconds = !hideSeconds || seconds <= 599;

  // Row 72 rule 2: fixed-width sections, every group always double digits, so a digit
  // change never shifts the screen; rule 3 keeps the hours visible as a dim 00
  const composed = shouldShowSeconds
    ? `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}`
    : `${pad2(hours)}:${pad2(minutes)}`;
  return localiseDigits(composed);
};
```

4. Replace `formatTimeAgo` and its docblock with:

```ts
/**
 * Formats seconds elapsed into the "ago" duration. English renders the lettered
 * design of the pre-row-63 reference (`194ed701`); every other locale keeps row
 * 63's colon shapes (owner ruling 2026-10-13, row 72).
 *
 * @param seconds - Seconds since prayer occurred (0 or positive)
 * @returns "now" (<60 s, the catalog word); en: "2m", "1h", "1h 30m";
 *   other locales: "0:02", "1:00", "1:30"
 *
 * @example
 * formatTimeAgo(45)      // Returns: "now"
 * formatTimeAgo(120)     // Returns: "2m" (en) / "0:02" (other locales)
 * formatTimeAgo(5400)    // Returns: "1h 30m" (en) / "1:30" (other locales)
 * formatTimeAgo(7200)    // Returns: "2h" (en) / "2:00" (other locales)
 * formatTimeAgo(0)       // Returns: "now"
 */
export const formatTimeAgo = (seconds: number): string => {
  if (currentLocaleId() === 'en') {
    return formatTimeAgoLettered(seconds, durationLabels());
  }

  if (seconds < 60) {
    return localiseDigits(t('duration.now'));
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return localiseDigits(`${hours}:${pad2(minutes % 60)}`);
};

const formatTimeAgoLettered = (seconds: number, labels: DurationLabels): string => {
  if (seconds < 60) {
    const localised = localiseDigits(labels.now);
    return localised;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const localised = localiseDigits(`${minutes}${labels.m}`);
    return localised;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    const localised = localiseDigits(`${hours}${labels.h}`);
    return localised;
  }
  const localised = localiseDigits(`${hours}${labels.h} ${remainingMinutes}${labels.m}`);
  return localised;
};
```

5. Below the formatters, add the two splitters:

```ts
/** One rendered piece of a colon display string: a digit group or a colon */
export interface CountdownSection {
  text: string;
  /** True while the group is the all-zero pair, and always for a colon */
  dim: boolean;
  colon: boolean;
}

const ALL_DIGITS = /^[0-9٠-٩]+$/;
const ALL_ZEROS = /^[٠0]+$/;

/**
 * Splits a colon display string into renderable sections, or returns null when the
 * string is not one: every group must be digits and there must be two or three
 * groups. English's lettered strings and the held `--:--` fail the digit test, so
 * they keep the single-node render (row 72's English revert).
 */
export const splitColonSections = (value: string): CountdownSection[] | null => {
  const groups = value.split(':');
  if (groups.length < 2 || groups.length > 3) return null;
  if (!groups.every((group) => ALL_DIGITS.test(group))) return null;

  const sections: CountdownSection[] = [];
  groups.forEach((group, index) => {
    if (index > 0) sections.push({ text: ':', dim: true, colon: true });
    sections.push({ text: group, dim: ALL_ZEROS.test(group), colon: false });
  });
  return sections;
};

/**
 * Splits a display string on its single colon for the ago badge's gap node, or
 * returns null when the string carries no colon, more than one. The badge's words
 * may sit either side, so unlike splitColonSections the halves are not
 * digit-checked.
 */
export const splitSingleColon = (value: string): [string, string] | null => {
  const index = value.indexOf(':');
  if (index === -1 || value.indexOf(':', index + 1) !== -1) return null;
  return [value.slice(0, index), value.slice(index + 1)];
};
```

6. In `getSecondsRemaining`'s docblock, revert the four quoted display strings to the
   reference wording: `displays "0:01" — never "0:00"` becomes `displays "1s" — never
   "0s"`, `a frozen "0:00"` becomes `a frozen "0s"`, `reads "0:42"` becomes `reads "42s"`.
   The body and the rounding model are untouched (R6.4).
7. The `stores/countdown.ts` display atoms are untouched: the anchor `display-atom` must
   still count 1 after this step.
8. In `hooks/usePrayerAgo.ts`'s docblock, the example lines `"Dhuhr 10:15 ago"` and
   `"Asr 2:30 ago"` become `"Dhuhr 10h 15m ago"` and `"Asr 2h 30m ago"` (docblock only; the
   file joins the Files list for this edit alone).

What the contracts must never do: read the real clock; touch `getSecondsRemaining`'s body,
the ticker, `formatTimeSecondsAware` or any widget file; emit a letter in a non-en branch;
pad the ago badge's hours (D72.6).

## Green run

The three commands from the red section, all passing, then `npx tsc --noEmit`,
`npx biome check . --error-on-warnings` and `yarn test:tz`, all exit 0.

## Break script

`bash scripts/break-step1.sh` from this folder, copied to `$TMPDIR` and run from the
repository root against the merged step. It unpads the fixed-width hours group, flips the
en dispatch to an impossible id, runs the two suites, expects the named failures
(`Expected: "٠٢:٥٩:٠٠"` and `Expected: "1h 1m"`), restores the file, and ends
`ALL AS EXPECTED: 1`.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the version lock
(`mkdir $HOME/athan-gitree/version.lock`, retry in a short sleep loop while it exists,
`rmdir` after the merge). Set it in `app.json`, `package.json` and
`android/app/build.gradle` (`versionName`). Add the nine files by name plus
`ai/plans/README.md` (status `IN PROGRESS, step 1`) and this folder's `PLAN.md` and
`LOG.md`. Message:

```
<VERSION> - feat(time): countdown reverts English to the reference letters, fixed-width sections elsewhere

formatTime and formatTimeAgo dispatch on the active locale: en restores the 194ed701
lettered algorithm verbatim, the five other locales render fixed-width colon shapes with
always-double-digit groups. splitColonSections and splitSingleColon prepare the render
split. En pins swept to the reference values across the six suites, component strings
included. R1.1-R1.3, R2.1-R2.5, R5.1, R5.2, R6.4.
```

## Review checklist

- The diff touches only the nine listed files plus plan and queue files.
- No widget file, no `getSecondsRemaining` body change, no non-en catalog edit.
- Both lettered branches match the reference body byte for byte, minus the two named
  deltas in change contract 3.
- Both fixed-width branches pad every group they emit, including the hours.
- The splitters return null on every guard case and dim exactly the zero groups and colons.
- The JSDoc examples equal the pinned test values one for one.

## Merge

`git checkout uat && git merge --no-ff feat/72-formatters -m "<VERSION> - merge
feat/72-formatters: step 1, locale-dispatching formatters"`. A conflict aborts and STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the step heading, commit sha, hook lines, break
line and `session:` line.
