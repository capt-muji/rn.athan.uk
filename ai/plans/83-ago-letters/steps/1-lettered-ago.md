# Step 1 — The lettered ago badge lands with its suite, atomically

**Requirements:** R1.1, R1.2, R1.3, R1.4, R1.5, R2.1, R2.2, R3.1
Weight: 2

## Anchor check

Run `bash ai/plans/83-ago-letters/scripts/preflight-83.sh` from the lane root
after copying it to `$TMPDIR` (it must print `PREFLIGHT OK`). Every anchor under
`scripts/anchors/` counts exactly 1 in its file. A count other than 1 is STOP.

## Goal

`formatTimeAgo` composes the lettered duration fixed in every locale, the new
`splitAgoDuration` finds it inside the composed catalog sentence, and `Ago.tsx`
renders it with the countdown's ruled letter typography. Every affected test
moves to the lettered expectations in the same commit.

## Branch

```
git checkout -b 83-ago-letters lane/83
```

Expected: `Switched to a new branch '83-ago-letters'`. Anything else is STOP.

## Files

Changed by name: `shared/time.ts`, `components/prayer/Ago.tsx`,
`shared/__tests__/time.test.ts`, `components/prayer/__tests__/Ago.test.tsx`,
`__tests__/app/Screen.test.tsx`, `hooks/__tests__/usePrayerAgo.test.ts`,
`hooks/usePrayerAgo.ts`, plus `ai/plans/README.md` and this plan folder's
`PLAN.md`/`LOG.md` if this run changed them.

## Red

Write these tests first. Each named test must fail with the failure described
against the unmodified tree. Run with
`npx jest <path> --watchman=false --selectProjects=<project>`
(unit for `shared/__tests__` and `hooks/__tests__`, components for
`components/` and `__tests__/app/`).

1. `shared/__tests__/time.test.ts`, inside the existing `formatTimeAgo`
   describe: replace `formats minutes`, `formats hours and minutes` and the
   nested `keeps Latin digits under en` (its 7260 case is re-pinned by the new
   hours test) with the two its below; the two `now` tests and `labels
   durations from the catalog` stay.

   ```ts
   it('formats minutes under an hour', () => {
     expect(formatTimeAgo(60)).toBe('1m');
     expect(formatTimeAgo(120)).toBe('2m');
     expect(formatTimeAgo(3599)).toBe('59m');
   });

   it('formats hours and minutes, dropping a zero-minute group', () => {
     expect(formatTimeAgo(3600)).toBe('1h');
     expect(formatTimeAgo(5400)).toBe('1h 30m');
     expect(formatTimeAgo(7200)).toBe('2h');
     expect(formatTimeAgo(7260)).toBe('2h 1m');
   });
   ```

   Proves R1.1's composition. Red now: `formatTimeAgo(60)` returns `'0:01'`,
   expected `'1m'` (and every other row the same way).

2. Same file, replace the `one design in every locale` describe's ar test body:

   ```ts
   it('draws the minute, whole-hour and mixed branches under ar with the same Latin letters', () => {
     setActiveLocale('ar');
     expect(formatTimeAgo(120)).toBe('2m');
     expect(formatTimeAgo(3600)).toBe('1h');
     expect(formatTimeAgo(7260)).toBe('2h 1m');
   });
   ```

   Proves R1.3. Red now: returns `'0:02'` under ar, expected `'2m'`.

3. Same file, new describe beside `splitSingleColon`'s (import
   `splitAgoDuration` at the top):

   ```ts
   describe('splitAgoDuration', () => {
     it('splits a sentence around its lettered duration and returns null otherwise', () => {
       expect(splitAgoDuration('Dhuhr 58m ago')).toEqual({
         before: 'Dhuhr ',
         groups: [{ digits: '58', letter: 'm' }],
         after: ' ago',
       });
       expect(splitAgoDuration('Duha 7h 14m ago')).toEqual({
         before: 'Duha ',
         groups: [
           { digits: '7', letter: 'h' },
           { digits: '14', letter: 'm' },
         ],
         after: ' ago',
       });
       expect(splitAgoDuration('الظهر قبل 2h 1m')).toEqual({
         before: 'الظهر قبل ',
         groups: [
           { digits: '2', letter: 'h' },
           { digits: '1', letter: 'm' },
         ],
         after: '',
       });
       expect(splitAgoDuration('ฟัจร์ 2h 30mที่แล้ว')).toEqual({
         before: 'ฟัจร์ ',
         groups: [
           { digits: '2', letter: 'h' },
           { digits: '30', letter: 'm' },
         ],
         after: 'ที่แล้ว',
       });
       expect(splitAgoDuration('Dhuhr 3h ago')).toEqual({
         before: 'Dhuhr ',
         groups: [{ digits: '3', letter: 'h' }],
         after: ' ago',
       });
       expect(splitAgoDuration('Asr now')).toBeNull();
       expect(splitAgoDuration('الآن')).toBeNull();
       expect(splitAgoDuration('Dhuhr 58 ago')).toBeNull();
       expect(splitAgoDuration('')).toBeNull();
     });
   });
   ```

   Proves R1.5. Red now: `splitAgoDuration` is not a function (import fails).

4. `components/prayer/__tests__/Ago.test.tsx`: rewrite the whole file to the
   content in `handed/Ago.test.tsx.txt` (committed with this plan). Proves
   R1.1, R1.2, R1.3, R1.4 and the fade. Red now:
   `Unable to find an element with text: Dhuhr 3 m ago` is the first failure.

5. `__tests__/app/Screen.test.tsx`: three assertions change, default
   normalizer, no thin spaces:

   - line with `'Dhuhr 0\u2009\u2009:\u2009\u200958 ago'` in the first-frame
     test becomes `screen.getByText('Dhuhr 58 m ago')`
   - line with `'Duha 7\u2009\u2009:\u2009\u200914 ago'` becomes
     `screen.getByText('Duha 7 h 14 m ago')`
   - the `queryByText` in the Show-time-passed-off test becomes
     `screen.queryByText('Dhuhr 58 m ago')`

   Proves R1.1 end to end through the page. Red now: the old colon sentence is
   still rendered, the lettered one is not found.

Also retune, same commit, no red possible (the hook mocks `formatTimeAgo`):
`hooks/__tests__/usePrayerAgo.test.ts` mock strings `'0:01'` to `'1m'`,
`'2:30'` to `'2h 30m'`, `'12:00'` to `'12h'`, `'0:05'` to `'5m'`, `'0:06'` to
`'6m'`, and the expected sentences `'Magrib 0:01 ago'` to `'Magrib 1m ago'`,
`'Fajr 2:30 ago'` to `'Fajr 2h 30m ago'`, `'Isha 12:00 ago'` to
`'Isha 12h ago'`, `'Dhuhr 0:05 ago'` to `'Dhuhr 5m ago'`, `'Fajr 0:06 ago'`
to `'Fajr 6m ago'`. `hooks/usePrayerAgo.ts` JSDoc examples: `Asr 2:30 ago`
becomes `Asr 2h 30m ago`, `Dhuhr 10:15 ago` becomes `Dhuhr 10h 15m ago`.

## Change contracts

### `formatTimeAgo` in `shared/time.ts`

Replaces the body and docblock at anchor a1. Keeps the signature
`(seconds: number): string`. JSDoc:

```ts
/**
 * Formats seconds elapsed into the "ago" duration: the catalog `now` word inside
 * the final 60 seconds, the lettered shape otherwise, fixed in every locale
 * (owner ruling 2026-10-15, row 83): unpadded Latin digits with lowercase h m
 * letters that never localise, hours and minutes only, a zero-minute group
 * dropping beside live hours.
 *
 * @param seconds - Seconds since prayer occurred (0 or positive)
 * @returns "now" (<60 s, the catalog word); "2m", "1h", "2h 1m" otherwise
 *
 * @example
 * formatTimeAgo(45)      // Returns: "now"
 * formatTimeAgo(120)     // Returns: "2m"
 * formatTimeAgo(3600)    // Returns: "1h"
 * formatTimeAgo(5400)    // Returns: "1h 30m"
 * formatTimeAgo(7200)    // Returns: "2h"
 * formatTimeAgo(0)       // Returns: "now"
 */
export const formatTimeAgo = (seconds: number): string => {
  if (seconds < 60) {
    return t('duration.now');
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};
```

What it answers: the duration string the ago sentence interpolates. What it must
never do: show seconds, pad a digit, localise a digit or letter, or return an
empty string.

### `splitAgoDuration` in `shared/time.ts`

New export, placed directly under `formatTimeAgo`, above `splitSingleColon`:

```ts
/** One digit run of the ago duration with its unit letter: 20 and m in 5h 20m */
export interface AgoLetterGroup {
  digits: string;
  letter: string;
}

/**
 * Splits a composed ago sentence around its lettered duration, or returns null
 * when the sentence carries none (the now sentence). Digits appear nowhere else
 * in the sentence, so the pattern cannot match elsewhere.
 */
export const splitAgoDuration = (value: string): { before: string; groups: AgoLetterGroup[]; after: string } | null => {
  const match = value.match(/\d+h(?: \d+m)?|\d+m/);
  if (match === null) return null;
  const index = match.index ?? 0;
  const groups = [...match[0].matchAll(/(\d+)([hm])/g)].map((entry) => ({ digits: entry[1], letter: entry[2] }));
  return { before: value.slice(0, index), groups, after: value.slice(index + match[0].length) };
};
```

What it answers: the words before the duration, the duration's digit-letter
groups, and the words after. What it must never do: match outside the duration,
return an empty groups array, or throw on any catalog sentence.

### `PrayerAgoBadge` in `components/prayer/Ago.tsx`

Replaces anchor a3's split-and-colon block. The import changes from
`splitSingleColon` to `splitAgoDuration`; add a new
`import { Fragment } from 'react';` line (the file has no react import today;
biome's organize-imports places it). The render becomes:

```tsx
  const parts = splitAgoDuration(prayerAgo);

  return (
    <Animated.Text style={[styles.prayerAgo, prayerAgoOpacityStyle, prayerAgoColorStyle, prayerAgoBackgroundStyle]}>
      {parts === null ? (
        prayerAgo
      ) : (
        <>
          {parts.before}
          {parts.groups.map((group, index) => (
            <Fragment key={group.letter}>
              {index > 0 ? ' ' : null}
              {group.digits}
              <Text style={styles.gap}> </Text>
              <Text style={styles.unitLetter}>{group.letter}</Text>
            </Fragment>
          ))}
          {parts.after}
        </>
      )}
    </Animated.Text>
  );
```

The docblock sentence `Shows "now" for the first 60 seconds, then the colon
duration (H:MM) inside the catalog sentence.` becomes `Shows "now" for the
first 60 seconds, then the lettered duration (Xh Ym) inside the catalog
sentence.`; the animates and fades sentences stay. Nothing else in
the file changes: the colour animations, the overlay fade, the mount-on-ready
guard and the badge's own style are untouched.

### The style block at anchor a4

`colon: { opacity: 0.4 }` is replaced by two styles, nothing else in
`StyleSheet.create` changes:

```ts
  gap: {
    fontSize: 8,
  },
  unitLetter: {
    fontSize: Math.round(ty.size(TEXT.sizeDetail) * 0.55),
    opacity: 0.4,
  },
```

The digits and surrounding words set no style of their own: they inherit the
badge's animated colour, font and size.

## Green

Every test named above passes. Then `npx tsc --noEmit` exits 0 and
`npx biome check . --error-on-warnings` exits 0. Errors in code written from
these contracts: fix your code. Errors in the contract text itself: STOP and
quote the error.

## Break script

`bash ai/plans/83-ago-letters/scripts/break-1.sh` from the lane root. It
applies four mutations one at a time and must end `ALL AS EXPECTED: 1`:

1. `seconds < 60` becomes `seconds < 59` in `formatTimeAgo` — the unit suite's
   `returns the catalog now word for < 60 seconds` fails at 59.
2. `remainingMinutes === 0` becomes `remainingMinutes === 1` — the unit suite's
   `formats hours and minutes, dropping a zero-minute group` fails at 3600.
3. `|\d+m` is dropped from `splitAgoDuration`'s pattern — the components suite
   fails at `Dhuhr 58 m ago`.
4. `opacity: 0.4` is dropped from `unitLetter` — the components suite's styling
   test fails on the letter span's opacity.

After the script, `git status --porcelain` lists only this step's files and the
plan files.

## Version and commit

Fetch `origin` under the version lock (`mkdir $HOME/athan-gitree/version.lock`,
retry in a short sleep loop while it exists, `rmdir` after the merge). The
version is the next patch after `lane/83`'s `package.json` (2.0.735 after the
planning commit, so the step takes 2.0.736 unless a lane commit moved it: take
`node -p "require('./package.json').version"` on `lane/83` and add one patch).
Set it in `app.json` first, then `package.json`, then
`android/app/build.gradle`'s `versionName` (gitignored, never added, but a test
fails if it lags).

Commit in the background with `git commit -F $TMPDIR/msg-83-1.txt`, message:

```
2.0.736 - feat(prayer): the ago badge takes the lettered duration in every language - the old zero-drop shape in fixed Latin h m letters; the badge's colon shape dies, splitSingleColon kept for the row time
```

(Replace 2.0.736 with the printed version.) The log's last `Tests:` line must
end `passed, <n> total` and four `100%` coverage lines must be present. If only
`shared/__tests__/audioMatrix.test.ts` times out, wait in the background for
load average below 8 and commit again, up to 3 times.

## Review checklist

Read `git show <sha>` cold against:

- No catalog file, no widget, no notification, no sheet file in the diff.
- `splitSingleColon` still exported and its describe still present.
- The gap span holds a space at fontSize 8; the letter span carries exactly
  fontSize and opacity, no colour.
- The badge's own style, animations and mount guard are byte-identical.
- No comment explains what; the two docblocks carry why (the ruling, the
  digit-free-sentence fact).
- The Screen test assertions use the default normalizer.
- Shipped classes: no lifecycle, thread, residue or rule defect (the shipped
  classes list in the executor contract). The letters are static text: no
  timer, no worklet, no subscription.

## Merge

```
git checkout lane/83 && git merge --no-ff 83-ago-letters -m "2.0.736 - merge 83/lettered-ago-badge"
```

(Version as printed.) A conflict: `git merge --abort`, then STOP.

## Done when

- Every checklist item above holds, `PREFLIGHT OK` and `ALL AS EXPECTED: 1`
  are in LOG.md with the `Tests:` line and four coverage lines.
- `grep -F "splitSingleColon" components/prayer/Ago.tsx` prints nothing.
- `grep -F "u2009" components/prayer/Ago.tsx` prints nothing.
- The step's box in PLAN.md section 6 is ticked and LOG.md ends with the
  `session:` line.
