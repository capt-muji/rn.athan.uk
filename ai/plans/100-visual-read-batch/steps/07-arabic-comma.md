# Step 7 — the Arabic comma in the date labels

Requirements: R7.1, R7.2, R7.3, R9.1
Weight: 2

## Anchor check

`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' scripts/anchors/11-date-comma.md shared/time.ts`
prints `1`, `scripts/anchors/12-hijri-comma.md` against `shared/time.ts` prints `1`,
and `scripts/anchors/13-locale-direction.md` against `shared/i18n/locale.ts` prints
`1`. Any other count is `NEEDS_CONTEXT: NEEDS REPLAN`.

## Goal

The Gregorian and Hijri labels compose their separators through a per-locale comma
that belongs to the sentence: the Arabic comma U+060C under the RTL set's locales,
the Latin comma everywhere else, with the digits Latin in every locale per row 88.

## Branch

`git checkout -b code/100-arabic-comma lane/100`

## Files

- `shared/i18n/locale.ts` (changed, one helper)
- `shared/time.ts` (changed, two lines)
- `shared/__tests__/locale.test.ts` (changed, new describe)
- `shared/__tests__/dateLocalized.test.ts` (changed, new cases and two retargets)

## Red tests

In `shared/__tests__/locale.test.ts`, add a describe following the file's own
locale-switching pattern:

```ts
describe('sentenceComma', () => {
  it('carries the Arabic comma under ar', () => {
    setActiveLocale('ar');
    try {
      expect(sentenceComma()).toBe('\u060C');
    } finally {
      setActiveLocale('en');
    }
  });

  it.each(['en', 'ms', 'so', 'hi', 'th'])('keeps the Latin comma under %s', (locale) => {
    setActiveLocale(locale);
    try {
      expect(sentenceComma()).toBe(',');
    } finally {
      setActiveLocale('en');
    }
  });
});
```

Import `sentenceComma` with the file's existing locale imports.

In `shared/__tests__/dateLocalized.test.ts`, following the file's own seeding shape,
add under ar (its fixture dates follow the file's existing cases):

```ts
it('joins the weekday with the Arabic comma under ar', () => {
  setActiveLocale('ar');
  try {
    expect(formatDateLocalized('2026-10-15')).toBe('الخميس\u060C 15 أكتوبر 2026');
  } finally {
    setActiveLocale('en');
  }
});

it('joins day and year with the Arabic comma under ar', () => {
  setActiveLocale('ar');
  try {
    expect(formatHijriDateLocalized('2026-10-15')).toBe('جمادى الأولى 4\u060C 1448');
  } finally {
    setActiveLocale('en');
  }
});
```

Derive the expected weekday and Hijri values from the catalog keys at run time the
way the file's existing cases do if it composes expectations from the catalog; if it
hardcodes expected strings, hardcode these the same way. The two existing ar cases
at lines 63 and 85 retarget their expected commas to U+060C
(`'الأحد\u060C 11 أكتوبر 2026'` and `'ربيع الآخر 30\u060C 1448'`); they assert
today's Latin comma and fail first. Record the failing names and lines in `LOG.md`.

## Change contracts

`shared/i18n/locale.ts`, beside `directionGlyph`:

```ts
/** The comma a composed sentence carries: the Arabic comma inside the RTL script, the
 * Latin comma outside it. The separator belongs to the sentence, never the number. */
export const sentenceComma = (): string =>
  localeDirection(currentLocaleId()) === 'rtl' ? '\u060C' : ',';
```

`shared/time.ts`:

- `formatDateLocalized`'s composed template joins the weekday through
  `${sentenceComma()}` in place of the literal `, ` (the space after the comma
  stays a literal space).
- `formatHijriDateLocalized`'s composed template joins the year through
  `${sentenceComma()}` the same way.
- Import `sentenceComma` from `@/shared/i18n/locale` beside the existing i18n
  imports.
- No other composer changes: `footerFor` carries no comma, and `qiblaPlace.ts` is
  out of scope (its sentence is device-keyed static copy, D44/D79).

## Green run

`npx jest shared/__tests__/locale.test.ts shared/__tests__/dateLocalized.test.ts --watchman=false`
exits 0, then `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.
The widget date-label suites (`stores/__tests__/widget*`) stay green untouched: the
widgets under en compose Latin commas exactly as before.

## Break script

`bash scripts/breaks/break-07.sh` from the lane root, created in this step as:

```bash
#!/usr/bin/env bash
set -u
cp shared/i18n/locale.ts "$TMPDIR/break07-locale.ts"
python3 - <<'EOF'
from pathlib import Path
p = Path('shared/i18n/locale.ts')
s = p.read_text()
old = "localeDirection(currentLocaleId()) === 'rtl' ? '\\u060C' : ',';"
new = "','"
assert old in s, 'anchor for break missing'
p.write_text(s.replace(old, new))
EOF
npx jest shared/__tests__/locale.test.ts --watchman=false -t 'sentenceComma' >"$TMPDIR/break07.log" 2>&1
status=$?
mv "$TMPDIR/break07-locale.ts" shared/i18n/locale.ts
if [ $status -ne 0 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED"
fi
```

The first failing line names the Arabic comma expectation. The script restores the
file and ends `ALL AS EXPECTED: 1`.

## Version and commit

Fetch under the version lock, bump `app.json` then `package.json` one patch above
`lane/100`'s tip. Commit message:
`<VERSION> - feat(i18n): the date and Hijri sentences carry the Arabic comma under ar`

## Review checklist

- Under en both composers emit byte-identical output to the planned sha.
- The helper reads the live locale, so a switch follows without a reload.
- No catalog value changed; the lock stays green.

## Merge

`git checkout lane/100 && git merge --no-ff code/100-arabic-comma -m "<VERSION> - merge code/100-arabic-comma: the Arabic comma carries the ar date sentences"`

## Restore list

`git checkout -- shared/i18n/locale.ts shared/time.ts shared/__tests__/locale.test.ts shared/__tests__/dateLocalized.test.ts` and delete `scripts/breaks/break-07.sh` if untracked.

## Done when

The checklist box is ticked, the merge landed on `lane/100`, and `LOG.md` carries the
step entry with the hook's `Tests:` line.
