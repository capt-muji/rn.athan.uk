# LOG

## Planning (2026-10-15)

## Ticket 106

Frontier taken across three interview rounds with the owner:

- D106.1 the Arabic face becomes RUBIK, her pick from the twenty-font specimen
  ($HOME/athan-gitree/sessions/106/arabic-font-specimen.html, kept by her instruction); Rubik
  under ar only - words, Latin digits, h m s letters, row times - every other locale
  byte-identical (round 3 confirmed the scope).
- D106.2 the arrow: bigger, same shape - base 36, height 15, overlap 6 as recorded defaults her
  read dials; the prayer card unmoved.
- D106.3 the countdown letter gap: her zero rule; the ago badge carries no gap span (verified,
  shared/time.ts composes one string), so it needs nothing.
- D106.4 acceptance is her batched XS read under ar and en; dials land as pinned follow-ups.
- D106.5 planner measurement: the bundled NotoSansArabic TTFs carry a 2.112em hhea box (the
  gap's root); Rubik v31 TTFs carry 1.185em with Arabic and Latin digits in file - one family
  serves her whole ruling.

Facts (explore worker, verified by the planner):

- The Day gap is the stacked half-leading of the two line boxes; the margins are already
  minimal (ar 2, D95); the sheets' -10 pull-up pattern exists but her ruling banned pulls for
  this fix.
- The ar record sends digits and row times to Roboto today (familyDigits, familyRowTime), so
  the "digits and letters in Rubik" ruling flips real switches.
- The arrow is one SVG in Explanation.tsx (30x12); TIP_OVERLAP (4) is the knob the placement
  tests import.
- The countdown gap is a space span at fontSize 8 (about 1.99pt), pinned by a node-count test.

## Planning (2026-10-15), second entry

Plan drafted through the gate: 4 steps, 6 anchors, preflight and break script committed. The
grill ran cold (athan-plan-griller); findings adjudicated in the READY commit message.

### Step 1 - DONE

Branch `feat/ar-rubik-face` off `uat` (2.0.802). Preflight (from the `$TMPDIR` copy, repository
root as working directory): `PREFLIGHT OK` - branch, clean tree, origin merged in, version floor
2.0.787, all 6 anchors count exactly 1.

Reds (the pins re-pointed first; 5 failed, 45 passed, 50 total across the two files, no other
case moved):

- `typographyFor › resolves ar to the Arabic faces at the pinned factor table` - first failing
  line `shared/__tests__/typography.test.ts:31:28`, `Expected: "Rubik-Regular" / Received:
  "NotoSansArabic-Regular"`.
- `live resolution through currentLocaleId › returns the ar record once setActiveLocale("ar")
  has run` - same expectation through `expectArabicRecord` at
  `shared/__tests__/typography.test.ts:31:28` (via `:86:7`).
- `the sheet header title › renders the Arabic medium face at the unchanged size under ar` -
  first failing line `components/__tests__/typographySweep.test.tsx:241:30`,
  `Expected: "Rubik-Medium" / Received: "NotoSansArabic-Medium"`.
- `the help question › renders the Arabic medium face at the unchanged size under ar` - first
  failing line `components/__tests__/typographySweep.test.tsx:258:33`, same expected/received
  pair.
- `the row time face › is the Latin regular face under ar, so a row time reads like the English
  row` - first failing line `components/__tests__/typographySweep.test.tsx:281:48`,
  `Expected: "Rubik-Regular" / Received: "Roboto-Regular"`.

TTF verification (stdlib python read of the sfnt tables, per the contract): both pinned v31
downloads landed (174992 and 175596 bytes) and measured `upem 1000`, `hhea ascender 935 /
descender -250` (box 1.185em), cmap format 4 covering U+0627 and U+0031, in BOTH files;
`usWeightClass 400` in `Rubik-Regular.ttf` and `500` in `Rubik-Medium.ttf` (the transposition
guard reads clean). md5 `2bf8ca4cf599f470baaa1da8ae8fe2de` and `0649dcd64c7b6e6bdbaf0b41f632964a`.

Change: the ARABIC record's four values (`familyRegular: 'Rubik-Regular'`,
`familyMedium: 'Rubik-Medium'`, `familyDigits: 'Rubik-Medium'`, `familyRowTime:
'Rubik-Regular'`), the two TTFs under `assets/fonts/`, and the app.json expo-font line pair
after the four existing entries. No Day.tsx byte, no lineHeight, no scriptLineHeight, no other
record touched.

Green: the three named suites 53/53 (the Day pins green untouched - lineHeight undefined on
both lines, margins 2 and 5); `yarn validate` green - tsc, Biome, Jest 215 suites / 5678 tests,
coverage `Statements 100% (5356/5356)`, `Branches 100% (2312/2312)`, `Functions 100%
(1116/1116)`, `Lines 100% (4797/4797)`.

Break: `bash $TMPDIR/break-106.sh face` from the repository root - the four family values
swapped back to Noto/Roboto, the typography test red (2 failed, 2 passed), the file restored
from the backup copy, `BREAK OK`; `git status --porcelain` then listed only this step's files.

Version 2.0.803 (next patch after uat's 2.0.802, taken under the version lock; origin/uat at
`c27e4797` 2.0.786, an ancestor of the branch): app.json first, then package.json, then
android/app/build.gradle `versionName` (gitignored, never added).

Ticket 106 set to `IN PROGRESS, step 1` in `ai/plans/README.md` in this commit.

Cold review of the first diff (read back as a stranger): the checklist held - two binary
assets, the app.json line pair, the four record values, the seven re-pinned test lines, no
Day.tsx byte, no lineHeight, no other record. One residue finding, applied and amended per the
review rules (a comment the change made untrue): the `familyRowTime` field's interface comment
still claimed the row time "reads exactly like the English row wherever the list is drawn",
false under ar once the record names `Rubik-Regular`; the comment now states the why that
survives ("the record names its regular face for them"). No name, signature, behaviour or test
moved; the named suites rerun green (50/50) and the break script rerun ended `BREAK OK`.

Commit `e2307873` (2.0.803) on `feat/ar-rubik-face`. The hook's lines from the commit:
`Test Suites: 215 passed, 215 total`; `Tests:       5678 passed, 5678 total`; coverage
`Statements   : 100% ( 5356/5356 )`, `Branches     : 100% ( 2312/2312 )`,
`Functions    : 100% ( 1116/1116 )`, `Lines        : 100% ( 4797/4797 )`. The amend that
carried the review fix reran the hook to the same lines.

Merged `5ff173a0` (2.0.803) into `uat` with
`git merge --no-ff feat/ar-rubik-face -m "2.0.803 - merge feat/ar-rubik-face: the Rubik face"`,
no conflict, tree clean. Never pushed.

The step 1 checklist box in `PLAN.md` rides its own small docs commit (the ledger commit missed
it, the 2.0.790 precedent).

session: ses_ebe4b003fffeAwFNQg1tM3Sj3I

### Step 2 - DONE

Branch `feat/info-box-arrow` off `uat` (2.0.805). Preflight (from the `$TMPDIR` copy, repository
root as working directory): one FAIL - `ar-record.anchor` counts 0 in `shared/typography.ts`;
the anchor pins the pre-step-1 Noto values that step 1's merged commit replaced with Rubik, the
expected state after step 1 (the lead's dispatch note pre-adjudicated it). Every other check
green: branch, clean tree, origin merged in, version floor 2.0.787, the other five anchors
counting exactly 1, including this step's `explanation-arrow` and `infobox-placement`, both
re-verified 1 by the preflight's own counting method.

Reds (3 failed, 36 passed, 39 total in Explanation.test.tsx, no other case moved):

- `draws the up arrow at 36 by 15` - first failing line
  `components/prayer/__tests__/Explanation.test.tsx:79:30`, `Expected: 36 / Received: 30`.
- `draws the down arrow at 36 by 15 mirrored` - first failing line
  `components/prayer/__tests__/Explanation.test.tsx:99:30`, `Expected: 36 / Received: 30`.
- `overlap-into-the-row constant is 6` - first failing line
  `components/prayer/__tests__/Explanation.test.tsx:109:25`, `Expected: 6 / Received: 4`.

Query note: root-wide `RNSVGSvgView`/`RNSVGPath` queries read the InfoBadge's own 13pt SVG
first when the arrow renders below the box, so the pins scope through `drawnParts()` to the
arrow's part - the step's proven `Alert.test.tsx` query pattern, aimed at the arrow subtree.

Change: both arrows `width={36} height={15} viewBox={'0 0 36 15'}`; the four d strings exactly
as the contract writes them (up `M0 15 L14.4 4.4 Q18 1.3 21.6 4.4 L36 15` plus the fill's
` Z`, down `M0 0 L14.4 10.6 Q18 13.7 21.6 10.6 L36 0` mirrored); `export const TIP_OVERLAP = 6;`
in `components/overlay/OverlayInfoBox.tsx`. The 1pt side-edge stroke, the fills, the placement
arithmetic and `SPACING.overlap` untouched.

Green: the three named suites 51/51 (the placement arithmetic green through the imported
constant); `yarn validate` green after one Biome format pass on the new pins (their two-line
arrays collapse to one) - tsc, Biome, Jest 215 suites / 5681 tests, coverage
`Statements 100% (5356/5356)`, `Branches 100% (2312/2312)`, `Functions 100% (1116/1116)`,
`Lines 100% (4797/4797)`.

Break: `bash $TMPDIR/break-106.sh arrow` from the repository root - `TIP_OVERLAP` restored to 4,
the constant pin red (1 failed, 38 skipped, 39 total), the file restored from the backup copy,
`BREAK OK`; `git status --porcelain` then listed only this step's files.

Version 2.0.806 (next patch after uat's 2.0.805, taken under the version lock; origin/uat still
at 2.0.786, an ancestor of the branch): app.json first, then package.json, then the gitignored
`android/app/build.gradle` `versionName` (never added).

Ticket 106 moved to `IN PROGRESS, step 2` in `ai/plans/README.md` in this commit.

Cold review of the diff (read back as a stranger): the checklist held - four path strings, four
dimension values, one constant, three pins, nothing else; the placement arithmetic untouched; no
per-locale value anywhere; the SVG comments still true against the new paths. No finding, no
amend.

Commit `d249500b` (2.0.806) on `feat/info-box-arrow`. The hook's lines from the commit:
`Test Suites: 215 passed, 215 total`; `Tests:       5681 passed, 5681 total`; coverage
`Statements   : 100% ( 5356/5356 )`, `Branches     : 100% ( 2312/2312 )`,
`Functions    : 100% ( 1116/1116 )`, `Lines        : 100% ( 4797/4797 )`.

Merged `f47c38d5` (2.0.806) into `uat` with
`git merge --no-ff feat/info-box-arrow -m "2.0.806 - merge feat/info-box-arrow: the bigger arrow"`,
no conflict, tree clean. Never pushed.

session: ses_ebe3fe569ffetxtEJJuHDPUQZd

### Step 3 - DONE

Branch `feat/countdown-letter-gap` off `uat` (2.0.807). Preflight (from the `$TMPDIR` copy, repository
root as working directory): two FAILs, both this ticket's own earlier steps invalidating planning-time
anchors - `ar-record.anchor` counts 0 in `shared/typography.ts` (step 1 replaced the Noto values, the
ledger's step 2 record) and `explanation-arrow.anchor` counts 0 in `components/prayer/Explanation.tsx`
(step 2 replaced the 30x12 geometry the anchor pins). Every state check green (branch uat, clean tree,
origin/uat merged in, version 2.0.807 over the 2.0.787 floor); `infobox-placement` counts 1 and this
step's own `countdown-gap` and `countdown-gap-style` count exactly 1 by the preflight's own counting
method.

Red (1 failed, 15 passed, 16 total in Countdown.test.tsx, no other case moved):

- `the lettered countdown on the Standard schedule › renders no gap node between digits and letters` -
  first failing line `components/countdown/__tests__/Countdown.test.tsx:187:18`,
  `Expected length: 0 / Received length: 2` (two gap nodes per two-group display, the plan's own
  prediction).

Change: the gap span line and the `styles.gap` block deleted from `components/countdown/Countdown.tsx`
(two deletions, nothing else - the letter style, the group margins and every other value untouched);
the suite's sixteen `getByText` display strings re-written `'N x'` to `'Nx'`; the `rowLabel` pins
(`'2h 29m'`) untouched. The rewritten gap case counts zero gap nodes and reads each group's child
sequence as digits then letter (`['2','h']`, `['29','m']`).

Green: the suite 16/16; `yarn validate` green - tsc, Biome, Jest 215 suites / 5681 tests, coverage
`Statements 100% (5356/5356)`, `Branches 100% (2312/2312)`, `Functions 100% (1116/1116)`,
`Lines 100% (4797/4797)`.

Break: `bash $TMPDIR/break-106.sh gap` from the repository root - the span re-inserted, the predicate
threw on it inside queryAll (`styles.gap` no longer exists, exactly the plan's word), the case red
(1 failed, 15 skipped, 16 total), the file restored from the backup copy, `BREAK OK`;
`git status --porcelain` then listed only this step's files.

Version 2.0.808 (next patch after uat's 2.0.807, taken under the version lock; origin/uat still at
2.0.786, an ancestor of the branch): app.json first, then package.json, then the gitignored
`android/app/build.gradle` `versionName` (never added).

Ticket 106 moved to `IN PROGRESS, step 3` in `ai/plans/README.md` in this commit.

Cold review of the diff (read back as a stranger): the checklist held - two deletions in one file, one
rewritten test, sixteen re-strings, nothing else; no letter or digit style value moved; the residue
sweep (`styles.gap`, `fontSize: 8`, the spaced display strings) finds nothing anywhere in components
or shared. No finding, no amend.

Commit `0680c5ab` (2.0.808) on `feat/countdown-letter-gap`. The hook's lines from the commit:
`Test Suites: 215 passed, 215 total`; `Tests:       5681 passed, 5681 total`; coverage
`Statements   : 100% ( 5356/5356 )`, `Branches     : 100% ( 2312/2312 )`,
`Functions    : 100% ( 1116/1116 )`, `Lines        : 100% ( 4797/4797 )`.

Merged `0a745292` (2.0.808) into `uat` with
`git merge --no-ff feat/countdown-letter-gap -m "2.0.808 - merge feat/countdown-letter-gap: tight letters"`,
no conflict, tree clean. Never pushed.

session: ses_ebe31e37fffeNkB8QPBu6xfXgu

### Step 4 - build ready

Release dev build 2.0.811 (uat `f3d5015a`) on the XS, per the `e2e/device-atlas-iphone-xs.md` recipe: prebuild `--clean` with `EXPO_PUBLIC_IOS_WIDGETS=1`, plist 2.0.811 with both bundle ids checked, metro cache cleared, Release xcodebuild with `EXPO_PUBLIC_PERF_MONITOR=1` in the build env and the cached team inline (`BUILD SUCCEEDED`, artifact verified 2.0.811 before install, Rubik-Regular and Rubik-Medium in the bundle), installed through devicectl as `com.mugtaba.athan` (the device's app list reads 2.0.811), one throwaway launch so the What's New sheet marks itself shown and her read starts clean. A first 2.0.809 build went stale before install (the 2.0.811 audit fix landed first) and never reached the phone; this 2.0.811 rebuild supersedes it and carries the audit's arrow fix (the tip sinks deeper, TIP_OVERLAP 7, card unmoved) that her read must judge. session: ses_ebe230fc5ffeppyXZJv9k510Uw

