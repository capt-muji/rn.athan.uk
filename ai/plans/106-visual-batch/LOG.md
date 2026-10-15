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

session: ses_ebe4b003fffeAwFNQg1tM3Sj3I

