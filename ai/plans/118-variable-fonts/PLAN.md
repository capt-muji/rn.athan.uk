# Ticket 118: Variable fonts, one file per family, the investigation

| Field | Value |
| --- | --- |
| Brief | Which variable font files exist for the four bundled families, their measured line boxes and glyph advances against today's statics, the byte saving, whether expo-font 58 covers what the app needs, then one recommendation. No code before the recommendation |
| Planned at | `50f96266` (2.0.857), 2026-10-16 |
| Planned by | lane-118 planning |
| Needs first | nothing |
| Parent | none |
| Group | none: this plan touches `ai/plans/README.md`, this plan folder and the three version files; lane 111's files are disjoint |
| Batch budget | 4 |
| Session budget | 4 |
| Steps count | 4 |
| Device | none: desk investigation, no device contact and no builds this wave |
| Owner decisions still needed | none: the standing hands-off order covers the recommendation, tabled for her veto |

## 1. Goal

The owner ordered an investigation (row 118, 2026-10-16): SDK 58's expo-font gained
variable-font support, and the eight static TTFs bundled today (Roboto Regular+Medium,
Rubik Regular+Medium, NotoSansDevanagari Regular+Medium, NotoSansThai Regular+Medium)
might collapse toward one variable file per family and shrink the app. Her words: "it
might work for us, it might not work for us, definitely worth investigating, address it
later". The ticket is INVESTIGATION FIRST: the row ends with options and one
recommendation, and no code lands before her ruling.

DONE when: the four families' variable candidates are identified upstream, their line
boxes and glyph advances are measured against today's statics from the files' own
tables, the byte saving is measured raw and deflated, the expo-font support at the
installed version is weighed from node_modules source, and one agent-ruled
recommendation is folded into the queue row.

Owner rules that apply:

- "INVESTIGATION FIRST: which variable files exist for the four families, their measured
  line boxes and digit advances against today's statics, the byte saving, then her
  ruling; no code before it" (row 118).
- "Visuals are settled. Fixes change behaviour only. Touch no pixel without the owner's
  say" (`ai/AGENTS.md`). This plan changes no app code and no assets.
- "Never name a model in any file" (`ai/AGENTS.md`).
- The standing hands-off order: the recommendation is taken agent-ruled and tabled.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who | When | Where |
| --- | --- | --- | --- | --- |
| D118.1 | Candidate source is the google/fonts repository at commit `47d54ca1ebb14fd864695f1d39dc734f39017c33`; the four files are fetched to scratch and never committed | agent-ruled | 2026-10-16 | this section |
| D118.2 | Measurement runs through the committed `scripts/measure-fonts.py` on fontTools 4.67.0 (present in the environment); gzip -9 stands in for store deflate | agent-ruled | 2026-10-16 | this section |
| D118.3 | Instancing pins wght 400 and 500 only, the two weights the app bundles, and wdth 100 when that axis exists | agent-ruled | 2026-10-16 | this section |
| D118.4 | The findings fold into the queue row; no findings file survives, because this row ships no code or config that would cite it | agent-ruled | 2026-10-16 | this section |
| D118.5 | The recommendation is taken agent-ruled under the standing hands-off order and tabled in the lane's final reply | agent-ruled | 2026-10-16 | this section |
| D118.6 | No device contact and no builds this wave; the one question a device could settle (API 28 XML-route instancing) is recorded as an open condition, not guessed | agent-ruled | 2026-10-16 | this section |

Why, one line each: D118.1 the four families are Google OFL families whose upstream
ships exactly one variable file per family; D118.2 fontTools reads the files' own
tables and is the tool Google builds these fonts with; D118.3 the app pins 400 and 500
only, so other weights measure nothing this row needs; D118.4 the records rule says a
ticket's documentation dies with its merge unless shipped work cites it; D118.5 the
owner's standing order replaces her answer; D118.6 the dispatch order bans device work
this wave and the recommendation does not turn on that one leg.

### 2.2 The executor must not decide

Every predicted number in section 6 that comes out different is a STOP with the two
numbers quoted, never a judgement call. A family upstream carrying no variable file is
a finding recorded verbatim, not a reason to substitute a different foundry's file.

## 3. Pre-flight

The script `scripts/preflight-118.sh` in this folder. The executor saves a copy to
`$TMPDIR` and runs `bash preflight-118.sh <lane-worktree-root>`. It checks: the branch
and a clean tree, `origin/uat` merged in, the version at or above 2.0.857, all four
anchors counting exactly 1, all eight static files present, fontTools importable. It
ends `PREFLIGHT OK`.

## 4. Background the executor needs

Code map, one line per file, anchors under `scripts/anchors/`:

- `app.json` (anchor `appjson-fonts.txt`): the eight statics are embedded natively by
  the expo-font config plugin. No runtime `useFonts` or `Font.loadAsync` call exists in
  app code: fonts load entirely through this list.
- `shared/constants.ts` (anchor `constants-families.txt`): `TEXT.family` names
  Roboto-Regular and Roboto-Medium, the Latin pair every non-script locale rides.
- `shared/typography.ts` (anchor `typography-arabic.txt`): the per-locale records name
  each family's Regular and Medium by family name, digits ride the locale's medium face
  and row times its regular face, and `scriptLineHeight` pins (ar 1.5, hi 1.5, th none)
  were derived from the statics' own boxes.
- `components/countdown/Countdown.tsx` (anchor `countdown-tabular.txt`): the timer sets
  `fontVariant: ['tabular-nums']`, so the no-shift digit rule (row 79) rides the font's
  tnum feature, not its default digit advances.

The pinned metrics a swap must not move, each from a DONE row's record and each
re-measured by this plan's script:

- Rubik: hhea box 1.185em, win ink 1.532em, the 21pt footer box from row 108.
- Hindi: hhea box 1.304em, win descent 558 (row 110's taller script box).
- Thai: own 1.511em box serves, no script pin (row 110, the row-87 law).
- Roboto digits tabular by default: 562 per 1000em at 400, 568 at 500.
- Rubik digits proportional by default and equal only under tnum: 619 at 400, 641 at 500.

Installed source facts, each verified by reading the package at `node_modules`:

- `expo-font@58.0.7`, `android/.../FontLoaderModule.kt`: the runtime variable path is
  gated `Build.VERSION.SDK_INT >= Q` (API 29), with the comment "Below API 29,
  `android.graphics.fonts.FontFamily` doesn't exist, so only the default face loads and
  Android synthesizes bold/italic from it".
- `expo-font@58.0.7`, `android/.../VariableTypefaces.kt`: on API 29 to 34 it reads the
  fvar wght axis and builds one font per 100-step weight; on API 35+ Android builds the
  continuous family.
- `expo-font@58.0.7`, `plugin/build/withFontsAndroid.js`: the object form of the fonts
  config writes one `res/font` XML per family with `app:fontWeight` and
  `app:fontVariationSettings` ("Instances a variable font at the declared weight and
  axes, so that one file can back several definitions"), and registers each family via
  `ReactFontManager.addCustomFont`. `planFontCopies` throws when two declared files map
  to one destination name.
- `expo-font@58.0.7`, `ios/FontLoaderModule.swift`: `loadAsync` aliases "every name the
  file provides, one per named instance for a variable font", making weights reachable
  through `fontWeight`. The plugin's string form embeds files through `UIAppFonts`.
- `react-native` RN 0.88, `React/Views/RCTFont.mm`: iOS resolves `fontFamily` plus
  `fontWeight` against the member font names of the family, which is how a variable
  font's named instances become reachable.
- `react-native` RN 0.88, `ReactAndroid/.../ReactFontManager.kt`: `TypefaceStyle.apply`
  calls `Typeface.create(typeface, weight, italic)` on API 28+ and falls back to
  nearest style (normal, bold) below.
- The fleet floor: the 3T runs Android 9 (API 28) and is the build machine. The 8T, S23
  and Find X8 sit above it. The XS runs iOS 16 or newer, where variable named instances
  resolve.

How the pieces interact: app.json hands the files to the plugin; the plugin embeds them
natively per platform; styles address each weight as its own family name; the pinned
line boxes and tnum advances ride the statics' tables.

Why the obvious swap is wrong: a variable file is one family with a weight axis, so the
per-weight family names die unless the config lists the same file under two families,
and the plugin's copy planner refuses duplicate destination names for distinct sources.
The wiring cost is real even where the bytes work out.

Existing tests: `shared/__tests__/typography.test.ts` pins the records' family names
and pins; no test in the repo reads font binaries. This plan changes no code, so no
test runs red.

## 5. Design

Method: measure the eight statics, fetch the four upstream candidates, instance them at
wght 400 and 500, compare advances and line boxes against the statics, measure bytes
raw and gzip-deflated, weigh the installed expo-font and RN source against the fleet's
floor, then write options and one recommendation into the row.

Invariant: every number in the findings comes from a font file's own tables read by the
committed script, and every coverage claim quotes installed source by path and line.

Alternatives rejected: rendering-based measurement (needs builds, banned this wave);
reading docs instead of installed source (the ticket orders source first, docs second);
building subsetted candidates now (that is one of the options to recommend on, not a
measurement input).

**Acceptance criteria:**

- [R1.1] WHEN `python3 measure-fonts.py file` runs on the eight bundled statics THE SYSTEM SHALL print one block per file carrying family name, usWeightClass, unitsPerEm, the hhea trio, the usWin pair, the typo trio, both em-boxes per 1000em, the pinned glyph advances per 1000em, glyph count, cmap codepoint count and byte size.
- [R1.2] WHEN the four google/fonts variable files at commit `47d54ca1` are fetched to scratch THE SYSTEM SHALL let `measure-fonts.py file` print the same block per file plus each fvar axis with minimum, default and maximum.
- [R2.1] WHEN `measure-fonts.py instance` runs on each candidate at wght 400 and wght 500 THE SYSTEM SHALL print the instanced file's block with its advances, boxes and byte size.
- [R2.2] WHEN the instanced blocks and the static blocks are compared THE SYSTEM SHALL record per family and weight the advance delta per 1000em for every pinned glyph and the line-box delta.
- [R2.3] WHEN `measure-fonts.py tnum` runs on Rubik and Roboto at 400 and 500 THE SYSTEM SHALL print the default and the tnum-substituted digit advances per 1000em with an equal or NOT equal verdict per column.
- [R3.1] WHEN the coverage verdict is recorded THE SYSTEM SHALL quote verbatim, with file path and line numbers, the expo-font API 29 gate, the plugin variation-settings writer, the plugin duplicate-destination refusal, the RN Android weight branch and the androidx impl selection.
- [R4.1] WHEN the investigation closes THE SYSTEM SHALL fold into row 118 the byte table, the metrics verdict, the coverage verdict and one agent-ruled recommendation naming every option it weighed.

Concurrency: none. The script reads files and writes only inside `$TMPDIR/lane118-fonts`.

Design review: the only judgment in the flow is the recommendation itself, and section
2 records the rules it must obey (hands-off, no code, her ruling to come). Every other
output is a mechanical comparison.

## 6. Steps

Checklist:

- [ ] Step 1: statics baseline and candidate fetch (R1.1, R1.2)
- [ ] Step 2: instanced metrics, comparison, tnum, sizes (R2.1, R2.2, R2.3)
- [ ] Step 3: expo-font coverage verdict (R3.1)
- [ ] Step 4: options, recommendation, records (R4.1)

### Step 1: statics baseline and candidate fetch

Requirements: R1.1, R1.2
Weight: 1
Anchor check: `bash scripts/preflight-118.sh` copy in `$TMPDIR` prints `PREFLIGHT OK`.
Goal: one metrics block per static file, and the four upstream variable files in
scratch with their fvar axes read.
Branch: `docs/118-statics` off `uat` in the lane worktree.
Files: this plan folder's `LOG.md` only (the script already lives in the folder).
Commands, run from the worktree root with the script copied to `$TMPDIR`:

1. `mkdir -p $TMPDIR/lane118-fonts && cd $TMPDIR/lane118-fonts`
2. `curl -s "https://api.github.com/repos/google/fonts/commits?per_page=1"` and record
   the sha in `SOURCE.txt`. Expected: `47d54ca1ebb14fd864695f1d39dc734f39017c33`; if
   upstream moved, record the sha seen and proceed.
3. Fetch the four files:

   ```
   curl -sL "https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto%5Bwdth%2Cwght%5D.ttf" -o Roboto-VF.ttf
   curl -sL "https://raw.githubusercontent.com/google/fonts/main/ofl/rubik/Rubik%5Bwght%5D.ttf" -o Rubik-VF.ttf
   curl -sL "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf" -o NotoSansDevanagari-VF.ttf
   curl -sL "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansthai/NotoSansThai%5Bwdth%2Cwght%5D.ttf" -o NotoSansThai-VF.ttf
   ```

   Expected: four files; `python3 measure-fonts.py file *.ttf` parses all four. A 404 on
   any family is a finding: record the family and stop that family's later steps.
4. `cd <worktree>` then `python3 $TMPDIR/measure-fonts.py file assets/fonts/*.ttf > $TMPDIR/lane118-fonts/statics.txt`
   Expected: eight blocks. The Rubik-Regular block must read:

   ```
   file Rubik-Regular.ttf
     fullName Rubik Regular weight 400 upm 1000 glyphs 1075 cps 885
     hhea 935/-250/0 win 1066/466 typo 935/-250/0
     embox win 1532/1000em hhea 1185/1000em bytes 174992
     advances/1000em 0:635 1:428 5:594 7:513 h:609 m:889 s:510 ::256  :245 .:252
   ```

   Any block differing in the hhea, win or advance numbers is a STOP with both numbers.
5. `python3 $TMPDIR/measure-fonts.py file $TMPDIR/lane118-fonts/*-VF.ttf > $TMPDIR/lane118-fonts/vfs.txt`
   Expected: four blocks. The Rubik block must read `fvar=wght:300/300/900` (default
   300, the Light instance) and the other three `wght:100/400/900` with `wdth:62/100/100`
   on the Noto pair and `wdth:75/100/100` on Roboto.
Break: `echo garbage > $TMPDIR/notafont.ttf && python3 $TMPDIR/measure-fonts.py file $TMPDIR/notafont.ttf`
Expected: a nonzero exit from the TTFont parse. A zero exit is a STOP.
Version and commit: bump the patch in `app.json` and `package.json` (the gradle file is
absent in the worktree and the lockstep test tolerates that), message
`<VERSION> - docs(plans): ticket 118 step 1, statics baseline and candidates fetched`.
Review: the LOG.md entry carries both output files' full text.
Merge: `--no-ff` into `uat` in the main tree under `uat.lock`.
Done when: LOG.md holds eight static blocks and four VF blocks with axes, and the queue
row reads `IN PROGRESS, step 1`.

### Step 2: instanced metrics, comparison, tnum, sizes

Requirements: R2.1, R2.2, R2.3
Weight: 2
Anchor check: unchanged from step 1.
Goal: instanced blocks at 400 and 500 for all four families, the advance and line-box
deltas against the statics, the tnum verdicts, and the byte table raw and gzip-deflated.
Branch: `docs/118-instances` off `uat`.
Files: this plan folder's `LOG.md` only.
Commands:

1. For each VF file, `python3 $TMPDIR/measure-fonts.py instance <vf> wght=400` and
   `wght=500`, eight runs total, output captured. Expected: the instanced Rubik at 500
   reports `fullName Rubik Medium weight 500` and this advance line, identical to the
   static Rubik-Medium:

   ```
   advances/1000em 0:657 1:463 5:620 7:543 h:629 m:902 s:532 ::274  :229 .:268
   ```

2. The comparison the executor records in LOG.md, per family and weight, is the delta
   between each instanced block and the static block: advance deltas per 1000em for the
   pinned set and the hhea and win deltas. Expected: every delta is 0 for every family
   at both weights, because the statics upstream cut are instances of these same
   variable fonts. A nonzero delta is recorded verbatim and flagged, not rounded away.
3. `python3 $TMPDIR/measure-fonts.py tnum <path> --pin wght=<n>` for Rubik-VF and
   Roboto-VF at 400 and 500. Expected:

   - Rubik at 400: default NOT equal (0:635 1:428 2:587 3:601 4:621 5:594 6:603 7:513
     8:636 9:593), tnum equal (619 each digit).
   - Rubik at 500: default NOT equal, tnum equal (641 each digit).
   - Roboto at 400 and 500: both columns equal (562 at 400, 568 at 500).
4. `python3 $TMPDIR/measure-fonts.py sizes assets/fonts/*.ttf $TMPDIR/lane118-fonts/*-VF.ttf`
   Expected totals, recorded in LOG.md as the byte table:

   ```
   statics-8 raw 1,250,804 gzip9 579,325
   vfs-4     raw 1,708,984 gzip9 905,837
   ```

   Per family raw: Roboto 336,904 vs 488,584; Rubik 350,588 vs 359,804; Devanagari
   487,236 vs 641,944; Thai 76,076 vs 218,652. gzip9: Roboto 176,846 vs 280,238; Rubik
   156,382 vs 146,358; Devanagari 207,127 vs 347,745; Thai 38,970 vs 131,496.
Break: rerun `instance` on `$TMPDIR/notafont.ttf`; expected a nonzero exit.
Version and commit: patch bump, message
`<VERSION> - docs(plans): ticket 118 step 2, instanced metrics measured, deltas zero, bytes grow`.
Review: LOG.md carries the eight instanced blocks, the tnum verdicts and the byte table.
Merge: `--no-ff` into `uat`.
Done when: the deltas, verdicts and byte table sit in LOG.md and the queue row reads
`IN PROGRESS, step 2`.

### Step 3: expo-font coverage verdict

Requirements: R3.1
Weight: 1
Anchor check: unchanged.
Goal: the coverage verdict, quoting installed source, on whether expo-font 58.0.7's
variable support covers what this app needs.
Branch: `docs/118-coverage` off `uat`.
Files: this plan folder's `LOG.md` only.
Commands, each quoting what it finds into LOG.md:

1. `sed -n '58,66p' node_modules/expo-font/android/src/main/java/expo/modules/font/FontLoaderModule.kt`
   Expected: the `familyTypeface` API 29 gate and the comment "Below API 29,
   `android.graphics.fonts.FontFamily` doesn't exist, so only the default face loads".
2. `grep -n "fontVariationSettings\|both become" node_modules/expo-font/plugin/build/withFontsAndroid.js | head -6`
   Expected: the variation-settings writer comment "Instances a variable font at the
   declared weight and axes, so that one file can back several definitions" and the
   duplicate-destination refusal "both become ... only one of them can be embedded".
3. `sed -n '95,110p' node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/common/assets/ReactFontManager.kt`
   Expected: `Typeface.create(typeface, weight, italic)` on API 28+, nearest style below.
4. The androidx leg, quoted from the fetched source saved at `$TMPDIR/TypefaceCompat*.java`
   in planning (re-fetch with `curl -s "<url>?format=TEXT" | base64 -D` if absent):
   impl selection `SDK_INT >= 29 -> TypefaceCompatApi29Impl`, and `setFontVariationSettings`
   present only in Api29Impl. Expected conclusion, recorded verbatim: the runtime path
   cannot instance below API 29; the XML route's pre-29 behaviour depends on androidx
   forwarding `FontVariationAxis` through hidden platform APIs, which this desk
   investigation does not resolve; a device proof on the 3T would settle it and is
   recorded as an open condition.
Version and commit: patch bump, message
`<VERSION> - docs(plans): ticket 118 step 3, coverage verdict quoted from source`.
Merge: `--no-ff`.
Done when: LOG.md carries the four quotes with paths and line numbers and the verdict
paragraph, and the queue row reads `IN PROGRESS, step 3`.

### Step 4: options, recommendation, records

Requirements: R4.1
Weight: 1
Anchor check: unchanged.
Goal: the options and the one recommendation, folded into the queue row's final text.
Branch: `docs/118-recommendation` off `uat`.
Files: this plan folder's `LOG.md` and `ai/plans/README.md` row 118.
The executor records in LOG.md, under `### Records`, the options table and the
recommendation this plan's planning round ruled (section 2, D118.5), then sets the row
to `EXECUTED`. The audit phase sets DONE with the final cell text from section 8.
Options to record, one line each:

1. Keep the eight statics. Zero risk, smaller bytes on every family but gzipped Rubik,
   every weight renders on every fleet device including the 3T.
2. Swap all four families to the upstream variable files. Refuted by measurement: raw
   bytes grow by 458,180 (36.8 percent) and deflated bytes by 326,512 (56.3 percent);
   the 3T (API 28) cannot instance at runtime, and Rubik's default instance is Light
   300, so Arabic would render Light there; the per-weight family names die and the
   wiring crosses the settled visual surface for no visual change.
3. Swap one family where bytes win: Rubik alone, gzipped saving 10,024 bytes. The
   runtime gate and the Rubik default 300 both still bite the 3T, so this option needs
   the XML config route with a 3T device proof and still pays the wiring change.
4. Hand-subset the variable files to the app's codepoints and re-default Rubik to 400.
   A build pipeline that ships non-upstream font bytes; it forfeits provenance and
   still pays the wiring change and the 3T question, to chase bytes that today sit
   458,180 ahead.

Recommendation (agent-ruled, D118.5): option 1, keep the eight statics. The byte
hypothesis is refuted, the metrics are already identical, and the only device that
would regress is the build machine itself. Revisit triggers to record: the 3T retiring
as floor device, a locale plan needing more than two weights, or an upstream variable
Rubik whose default is 400.
Version and commit: patch bump, message
`<VERSION> - docs(plans): ticket 118 step 4, options and recommendation recorded, row EXECUTED`.
Merge: `--no-ff`.
Done when: LOG.md holds the records block and the row reads `EXECUTED`.

## 7. Device proof

None. The dispatch order bans device contact and builds this wave, and every finding
comes from font files' own tables and installed source. The one question a device
could settle, whether the 3T's Android 9 applies `app:fontVariationSettings` through
the androidx pre-29 path, is recorded as an open condition inside the recommendation,
not proof. If the owner later orders a swap attempt, that device proof is its first
step.

## 8. Records

The findings text lands in `LOG.md` under `### Records` at step 4. The queue cell text
the audit applies at DONE:

`DONE 2026-10-16, audited: the variable-font investigation answers in row text - all
four families ship one variable file upstream (google/fonts 47d54ca1), their vertical
metrics are byte-identical to today's statics (Rubik hhea 935/-250, win 1066/466;
Roboto 1900/-500, win 1946/512; Devanagari 896/-408, win 1348/558; Thai 1061/-450,
win 1061/450) and every pinned advance matches at both weights (digits, h m s, colon,
space, period; Rubik tnum 619/641, Roboto tabular 562/568), so no line-box or no-shift
pin reopens; the byte hypothesis is REFUTED: the four variable files total 1,708,984
bytes raw and 905,837 deflated against the eight statics' 1,250,804 and 579,325, a
growth of 36.8 percent raw, because the statics are Google's subset builds (Thai pair
140 glyphs against the variable's 467); expo-font 58.0.7's runtime variable path gates
at Android 10 (API 29), so the 3T (Android 9) renders a variable file at its default
instance only and Rubik's variable defaults to Light 300, which would lighten the whole
Arabic face on the build machine; the plugin's XML route pins weights per family but
its pre-29 instancing rides androidx and stays unproven on the 3T; recommendation
(agent-ruled, her veto pending): keep the eight statics - revisit when the 3T retires
as floor device, a locale needs more than two weights, or upstream re-defaults Rubik to
400; no code changed`

Docs commit message at DONE: `<VERSION> - docs(plans): ticket 118 DONE, variable-font
investigation folded into the row, plan folder closed`.

## 9. Push

None. The executor never pushes. The orchestrator pushes `uat` after the audit.

## 10. When something goes wrong

| Symptom | What it means | Action |
| --- | --- | --- |
| A curl fetch returns 404 for one family | upstream moved or dropped the file | record the family and the URL, continue with the other three, note it in the row text |
| A metrics block differs from this plan's predicted numbers | the statics or upstream changed | STOP with both numbers quoted; the lane re-plans the predicted outputs |
| `python3 -c 'import fontTools'` fails | the environment changed | STOP; do not pip install anything to work around it |
| instancer raises `KeyError: 'wdth'` | a candidate gained or lost an axis | the script pins only existing axes; if it still raises, STOP with the traceback |
| An anchor count is not 1 | the tree moved under the plan | `NEEDS CONTEXT: NEEDS REPLAN, <anchor and count>` |
| The pre-commit hook fails on an unrelated suite | tree churn from the parallel lane | rerun once after `yarn install` under `commit.lock`; a second failure is a STOP |

Restore lists: every step writes only `LOG.md` inside the plan folder and scratch under
`$TMPDIR/lane118-fonts`, so `git checkout -- ai/plans/118-variable-fonts/LOG.md` and
`rm -rf $TMPDIR/lane118-fonts` undo any step.

## 11. Subagents

Planning ran inside the lane with no explore dispatch: every fact was read directly
from the repository, node_modules and the fetched files. Delivery: the lane executes
the steps itself. Audit: the lane dispatches one `athan-reviewer` blind over the
records diff (the worktree, the diff file and `ai/AGENTS.md`; never this plan). No
image work, so `vision` is not called.

## 12. Report to the owner

The lane's final reply states: which variable files exist, that the metrics already
match, that the bytes grow rather than shrink, that the 3T cannot instance at runtime
and Rubik's variable default is Light, the recommendation to keep the eight statics
with its revisit triggers, and the decisions table. The progress table follows.
