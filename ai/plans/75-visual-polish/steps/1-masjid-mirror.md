# Step 1: the mosque mark mirrors under RTL

**Requirements:** R1.1, R1.2, R1.3
Weight: 2

## Anchor check

Run from the worktree root. `masjid-image.txt` counts exactly 1 in
`components/ui/Masjid.tsx`: Run:

```bash
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/75-visual-polish/scripts/anchors/masjid-image.txt components/ui/Masjid.tsx
```

Expected output: `1`. Anything else: stop.

## Goal

Under an RTL locale the drawn `Image` carries `transform: [{ scaleX: -1 }]`; under an
LTR locale it carries no transform. Both variants, one rule, one component.

## Branch

`ticket/75`, the run's single branch. No step branch, no `uat` merge, no push.

## Files

- `components/ui/Masjid.tsx` (changed)
- `components/ui/__tests__/Masjid.test.tsx` (extended)

## Red tests

Add two describe blocks to `Masjid.test.tsx`, importing `setActiveLocale` from
`@/shared/i18n/locale` and `StyleSheet` from `react-native`:

Under `the mosque icon under the Arabic locale` (`setActiveLocale('ar')` in
`beforeEach`, back to `'en'` in `afterEach`, the Toggle suite's pattern):

1. `mirrors the mark under the Arabic locale` - render `<Masjid />`, assert
   `drawnImage()` has style `{ transform: [{ scaleX: -1 }] }`.
2. `mirrors the Ramadan variant under the Arabic locale on the same rule` - fake
   timers at `createPrayerDatetime('2027-02-20', '12:00')`, `decorationsEnabledAtom`
   set true, the same assertion.

In its own describe block beside the first, with no locale preset:

3. `draws the mark unmirrored under the English locale` - starts with an explicit
   `setActiveLocale('en')` so it never inherits the other block's locale, renders,
   asserts `StyleSheet.flatten(drawnImage().props.style).transform` is `undefined`.

Run them before the change:

```bash
npx jest components/ui/__tests__/Masjid.test.tsx --watchman=false --selectProjects=components 2>&1 | tail -20
```

Record the exact failing lines in `LOG.md`. Tests 1 and 2 must fail on the missing
transform; test 3 must pass (the LTR face is unchanged). Any other outcome: stop.

## Change contracts

In `components/ui/Masjid.tsx`:

- Import `currentLocaleId, localeDirection` from `@/shared/i18n/locale`.
- Inside the component body: `const isRTL = localeDirection(currentLocaleId()) === 'rtl';`
  with a one-line comment naming why the locale's own direction and not the bridge
  snapshot: a starved crossing renders Arabic while the bridge reports the launch
  direction (rows 73 and 78). Do not copy the Toggle comment; one line.
- The `Image` style becomes `style={[styles.icon, { height, width }, isRTL && styles.mirrored]}`
  with `mirrored: { transform: [{ scaleX: -1 }] }` added to the stylesheet. An empty
  `false` entry in a style array is ignored by React Native, so the LTR face keeps its
  exact style objects.
- Nothing else changes: the sources, the variants, the splash gate callback, the
  sizing, the container.

## Green run

```bash
npx jest components/ui/__tests__/Masjid.test.tsx --watchman=false --selectProjects=components 2>&1 | tail -5
```

All suites in the file pass, including the pre-existing variant, gate and sizing
claims. Then `yarn validate`.

## Version and commit

Bump `app.json` then `package.json` to `2.0.451` (they must agree; the lockstep test
enforces it). Commit:

```
2.0.451 - the mosque mark mirrors under RTL: the locale's own direction drives a
scaleX flip on both art variants, LTR untouched
```

## Break script

Runs after the step's commit. The script strips the transform from the committed
file, the mirror tests go red, then `git checkout --` restores the committed change:

```bash
node -e '
const fs = require("fs");
const p = "components/ui/Masjid.tsx";
fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(", isRTL && styles.mirrored", ""));
' && npx jest components/ui/__tests__/Masjid.test.tsx -t "mirrors" --watchman=false --selectProjects=components 2>&1 | tail -5
```

Expected: the two mirror tests fail (the transform is gone). Then
`git checkout -- components/ui/Masjid.tsx` and rerun the suite green.

## Review checklist

- The travel comment pattern was linked, not copied.
- No `Platform` check, no `I18nManager` read, no new asset.
- The LTR render path compiles to the same style array shape as before.

## Merge

None this run. The commit stays on `ticket/75`.

## Done when

Both mirror tests and the LTR test are green, the break script proved them red, the
pre-commit hook's `Tests:` and coverage lines are in `LOG.md`, and the commit carries
2.0.451.
