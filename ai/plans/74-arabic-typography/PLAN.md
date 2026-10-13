# Plan 74: Arabic typography parity — size and weight

| | |
| --- | --- |
| Brief | Queue row 74 (owner's RTL test, 2026-10-13): Arabic text renders too small and carries no bold weight |
| Planned at | `cfb9b837` (uat line, 2.0.201, 2026-10-13; uat tip `eb4582b1` 2.0.202 differs only in row 72's plan folder and the routine version bump) |
| Planned by | lane/74 planner |
| Needs first | 72 |
| Parent | none |
| Group | the typography and per-locale styling layer (rows 38/39 ground); shares components/countdown/Countdown.tsx and components/prayer/Ago.tsx with row 72, sheet files with row 73 |
| Batch budget | 4 |
| Session budget | 7 |
| Steps | 3 (weights 2 + 2 + 3 = 7) |
| Device | iPhone XS (`e2e/device-atlas-iphone-xs.md`), iOS simulator as fallback; step 3 only, last |
| Owner decisions still needed | none at execution; section 2.3 carries the owner-rules-at-audit list |

## 1. Goal

Today every Text in the app sets one of two bundled Latin fonts (`shared/constants.ts:293-298`,
`TEXT.family.regular = 'Roboto-Regular'`, `TEXT.family.medium = 'Roboto-Medium'`) at the
`TEXT` size tokens (14 to 28, `shared/constants.ts:299-315`). Roboto carries no Arabic glyphs,
so under `ar` the OS substitutes a per-glyph fallback face (Noto Naskh Arabic UI on the 3T's
Android 9; Geeza Pro on iOS). The fallback has no medium weight, so every surface styled
`TEXT.family.medium` — Help questions, step instructions, card titles, sheet and modal titles —
renders plain, and the rendered letterforms come from a book face the app never chose. The owner
tested this face on 2026-10-13 and ruled:

> "everything in Arabic feels much smaller and is hard to read — people will find this impossible
> to read — and the black text carries no heaviness: the Help questions and step instructions that
> read clearly bold-weighted in English are plain black in Arabic, so questions and answers are
> hard to tell apart (English: question black and heavy, description grey and regular; Arabic:
> both plain)."

Her observation that Arabic question marks render as they should stands recorded: the fallback chain
already supplies U+061F, and the fix keeps it supplied.

When DONE: under `ar` the app renders every catalog Text in a bundled Arabic UI face at sizes
scaled to read at parity with English, and every surface that sets a weight today renders a real
medium weight. Under the five other locales not one rendered byte of styling changes. The owner
notices by opening the Help modal under Arabic: questions read heavy and black over a grey
regular body, at a size that no longer needs squinting.

Owner rules that bind this plan (source: queue row 74 brief, 2026-10-13):

- Size parity and the bold Arabic weight are HER ruling; the measurements that achieve parity are
  the planner's to derive and cite (dispatch instructions, 2026-10-13).
- Visuals are settled: this ticket changes the Arabic rendering behaviour her report describes and
  nothing else (`ai/AGENTS.md` hard rules).
- Animated components render their first frame settled; no timing change is in scope here.
- Widgets are out: the owner's hard ban on widget internals holds (rows 67 and 69, both DEFERRED).

## 2. Decisions

### 2.1 Taken

- **D74.1 (font choice):** bundle Noto Sans Arabic v2.013 hinted statics, Regular and Medium,
  from the notofonts/arabic release, and register them through the existing expo-font plugin
  array (`app.json:81-86`, the same mechanism as the two Roboto files). Grounding: it is the one
  mechanism that ships a real Arabic medium weight identically on both platforms; the PostScript
  names inside the files (`NotoSansArabic-Regular`, `NotoSansArabic-Medium`) equal the basenames,
  which is what the plugin registers and RN resolves (verified from the `name` tables and from
  `expo-font/plugin/build/withFontsAndroid.js` family derivation); OFL licence ships beside them.
  Rejected: `fontWeight` synthesis over the OS fallback (device-dependent, cannot produce a real
  medium — it is the bug being fixed); Noto Naskh Arabic (book face, thinner strokes, the reading
  complaint stands); Cairo or Almarai (no Noto-grade metric documentation, weaker pairing with
  Roboto's proportions).
- **D74.2 (parity factor 1.15):** under `ar`, every fontSize and lineHeight resolves through
  `Math.round(n * 1.15)`. Derivation, all measured from the font files themselves (glyf bounding
  boxes and OS/2 tables, scripts of record in `ai/plans/74-arabic-typography/FONT-MEASUREMENTS.md`):
  Roboto cap band 0.711 em (sCapHeight 1456/2048), x band 0.528 em (sxHeight 1082/2048);
  Noto Sans Arabic alif band 0.714 em (U+0627 ymax 714/1000), flat-letter band 0.403 em
  (U+0628/U+0633 top 403/1000). Tall-letter parity ratio 0.711/0.714 = 0.996; text-mass parity
  ratio 0.528/0.403 = 1.310; geometric mean sqrt(0.996 * 1.310) = 1.142, rounded to the nearest
  0.05, which is 1.15. The
  geometric mean keeps tall letters between Roboto's cap band and ascender band while lifting the
  reading mass to 88 percent of the English x band, which is the deficit her report describes.
  Rejected: 1.0 (mass stays at 76 percent — the complaint survives); 1.31 (mass parity alone;
  alifs grow to 0.93 em, past Roboto's ascender — the list reads as shouting); per-surface
  hand-tuned tables (25 files of duplicated numbers, no single source, untestable as one contract).
- **D74.3 (letter spacing 0 under ar):** Arabic script joins; tracking distorts the joins. The
  seven styles that set letterSpacing on catalog text resolve it to 0 under ar and keep their
  value in the other locales: Help.tsx question (0.2, `Help.tsx:213`), Update.tsx message (0.2,
  `Update.tsx:55`), WhatsNew.tsx version, title and body (0.2, `WhatsNew.tsx:85,114,121`),
  Header.tsx title (-0.3, `Header.tsx:60`), Modal.tsx title (+0.3, `TEXT.letterSpacing.wide`,
  `Modal.tsx:172`).
- **D74.4 (module-scope resolution):** a new pure module `shared/typography.ts` maps
  `currentLocaleId()` to a typography record; each swept component resolves it once at module
  scope beside its `StyleSheet.create`. Sound because the typography answer changes only on an
  ar-to-non-ar crossing, and every such crossing relaunches the whole JS context
  (`stores/language.ts:77-89`, D59's post-convergence `Updates.reloadAsync()`); non-ar switches
  remount the tree through `localeVersionAtom` (`app/_layout.tsx:85`) with a typography answer
  that has not changed. A launch straight into ar resolves before any render.
- **D74.5 (scope: the app's RN tree only):** widgets keep their own native text path; the owner's
  widget ban (rows 67/69) holds. `shared/widgetTimeline.ts` untouched.
- **D74.6 (decorative glyphs untouched):** styles that render fixed glyphs, never catalog text —
  Help chevron (`\u2304`), stepMark (`\u00BB`), titleBadgeGlyph (`?`), Settings and ColorPicker
  chevrons (`fontWeight: '300'` glyphs), the QiblaCompass dial letters' proportional
  `fontSize={radius * FACE.cardinalSize}` — keep their sizes; the dial letters swap family only,
  so the instrument keeps its weight parity without disturbing its geometry.
- **D74.7 (ar only):** `ms`, `so`, `hi`, `th` keep Roboto and identity mapping. Their own
  fallback faces (Thai, Devanagari) are a sibling defect outside this brief; section 2.3 carries
  it to the owner.
- **D74.8 (en byte-identity):** the five non-ar locales resolve to identity functions and the
  Roboto families, so every swept style keeps its exact pre-change numbers. The sweep-guard test
  pins this as a table, so a regression in English is a red test, not a discovery.

### 2.2 The executor must not decide

- The downloaded TTFs fail their sha256 check: STOP. Report the digest mismatch and the release
  URL; do not substitute a build, a variable-font file or another release. Exact question for the
  owner: "the pinned Noto Sans Arabic v2.013 artefacts do not match; which artefact replaces
  them?"
- A swept style in the inventory no longer exists at execution (row 72 landed first and renamed
  it): STOP after recording the drifted file list in LOG.md; the plan takes a bounded replan to
  re-pin (section 10, first row). Do not invent a mapping onto row 72's landed names.
- The expo-font plugin rejects a new entry or prebuild fails on the fonts: STOP with the plugin
  error text. Exact question: "the expo-font plugin at the pinned version rejects the Noto
  entries; which registration route replaces the plugin array?"
- Coverage drops below the repo's 100 percent gate on any touched line: fix the test list in the
  step; never weaken a gate.

### 2.3 Owner rules at audit

- The `app.json` edit (two font entries) touches an ask-first file (`ai/AGENTS.md` hard rules)
  while the owner is away. It is grounded in her "ships a bold Arabic weight" ruling — registration
  is the only mechanism — and the lead's audit should sight it against that ruling.
- The 1.15 factor is a cited derivation, not her measurement; her read of the confidence build
  stays the acceptance bar she has always held (the D41-style veto pattern).
- `hi` and `th` render their scripts through OS fallbacks today, with the same weight loss class
  as this defect. Out of brief; a future row is hers to queue.

## 3. Pre-flight

`bash scripts/preflight-74.sh` from the repository root, saved to `$TMPDIR` first (the executor
copies it out of the plan folder before running). Expected-drifted anchor names pass as arguments.
It exits non-zero with a numbered list when any check fails and prints `PREFLIGHT OK` when all
hold:

1. The checkout sits on `uat` with a clean tree.
2. `origin/uat` is fetched and is an ancestor of HEAD.
3. `package.json` version is at least 2.0.201 (the "Planned at" version).
4. Queue row 72 shows DONE in `ai/plans/README.md` (Needs first).
5. Every anchor file under `scripts/anchors/` counts exactly 1 in its named source file
   (python count, the template command), except the anchors named as arguments. The drift
   schedule this plan itself creates: step 1 runs it as `preflight-74.sh 09` (row 72's countdown
   rewrite is a Needs-first precondition and drifts 09 the moment it lands); step 2 runs
   `preflight-74.sh 04 09` (step 1's fonts array replaces what anchor 04 quotes; 09 re-pins or
   stays drifted per the bounded replan); step 3 runs
   `preflight-74.sh 04 05 06 07 08 09 10` (step 2's sweep rewrites every quoted style block).
   A drifted anchor outside the named set is a failure and takes the section 10 replan.

## 4. Background the executor needs

Code map (anchors under `scripts/anchors/`, verified at `cfb9b837`):

- `shared/constants.ts:292-323` — the `TEXT` token layer: families `Roboto-Regular` /
  `Roboto-Medium`, sizes 14/16/18/20/26/28, lineHeight 22, letterSpacing 0.2/0.3. Anchor
  `01-text-tokens.txt`.
- `assets/fonts/` — exactly two faces, Roboto Regular and Medium. No Arabic-capable file ships.
- `app.json:81-86` — the expo-font plugin array registering both Roboto files; family name equals
  file basename. Anchor `04-appjson-fonts.txt`.
- 25 component files carry the roughly 50 text styles (the full inventory with per-style
  treatment sits in `steps/2-per-locale-sweep.md`). Every one of them renders catalog text or
  localised digits except the decorative-glyph styles D74.6 names.
- `stores/language.ts:65-93` — the language pick: converge, then on an RTL boundary crossing
  force direction and `Updates.reloadAsync()`. Anchor `02-relaunch-rtl.txt`. This relaunch is what
  makes module-scope typography resolution safe (D74.4).
- `shared/i18n/locale.ts:41-52` — `currentLocaleId()` and `setActiveLocale`; `app/_layout.tsx:85`
  reads `localeVersionAtom` to remount the tree per switch (R3.1 of job 39).
- `stores/ui.ts:113-131` — the per-locale width keys `prayer_max_name_width_<locale>_<side>`,
  seeded 0, widen-only on measure. Anchor `03-width-keys.txt`.
- `components/ui/InitialWidthMeasurement.tsx:42-50` — the hidden measurement Texts render every
  prayer label at `TEXT.family.regular` + `TEXT.size`; the widest measured label in rendered
  points is the row's name reserve (the row 61 heal). Anchor `07-width-measure-hidden.txt`.
  `components/prayer/Prayer.tsx:68-70` applies the reserve. Anchor `08-prayer-row-text.txt`.
- `components/modals/Help.tsx:207-255` — the surfaces the owner named: `question`
  (Roboto-Medium 15), `cause` (Roboto-Regular 13, grey), `stepText` (Roboto-Medium 13). Anchor
  `05-help-question.txt`.
- `components/sheets/parts/Header.tsx:56-68` — sheet titles (22, Roboto-Medium, letterSpacing
  -0.3) and subtitles. Anchor `06-header-title.txt`. `components/modals/Modal.tsx:169` — modal
  titles, same family.
- `components/countdown/Countdown.tsx:64-84` — the countdown name (`TEXT.sizeSmall`) and timer
  (`TEXT.sizeLarge`, Roboto-Medium). Anchor `09-countdown-styles.txt`. Row 72 owns this file's
  render treatment; this ticket only re-points its typography.
- `components/sheets/screens/QiblaCompass.tsx:138-146` — the dial letters' inline Text. Anchor
  `10-qibla-dial-font.txt`.
- Row 57's `localiseDigits` (`shared/i18n/digits.ts`) renders Eastern Arabic-Indic digits under
  ar, so the digit paths ride the same faces; the Latin digits Noto Sans Arabic maps never show
  under ar.

Interaction: a locale pick persists, remounts the tree, converges notifications and widgets, and
relaunches on the ar boundary; the width layer re-measures on the new per-locale key. The
typography layer sits beside the token layer: the styles keep their tokens as inputs and resolve
the rendered numbers through the locale record.

Existing tests that guard this ground: `shared/__tests__/versionLockstep.test.ts` (three-file
version agreement), the catalog lock and width seed suites from job 39, the component suites
under `components/**/__tests__/`. None pins a font family or a size today — the defect class was
unmeasured until this plan.

Why the obvious fix is wrong: adding `fontWeight: 'bold'` to the weight surfaces only asks the OS
fallback to synthesize a weight it may refuse (Android's per-glyph fallback does not honour
fontWeight for a missing family's script — the plain rendering the owner photographed is that
refusal). Scaling `TEXT.size` itself changes English. Per-component fontSize tables duplicate
25 files of numbers with no single contract to test.

## 5. Design

Invariant, test-checkable: **the locale typography map is total and pure — `ar` resolves to the
bundled Arabic faces at the pinned factor, every other locale resolves to the exact pre-change
numbers, and every text style in the app resolves its rendered numbers through that map.**

The module (`shared/typography.ts`):

```ts
export const ARABIC_SIZE_FACTOR = 1.15;

export interface LocaleTypography {
  familyRegular: string;
  familyMedium: string;
  size: (n: number) => number;
  lineHeight: (n: number) => number;
  letterSpacing: (n: number) => number;
}

export const typographyFor = (locale: LocaleId): LocaleTypography =>
  locale === 'ar' ? ARABIC : LATIN;
```

`ARABIC`: families `NotoSansArabic-Regular` / `NotoSansArabic-Medium`; `size` and `lineHeight`
`Math.round(n * ARABIC_SIZE_FACTOR)`; `letterSpacing` returns 0; `arabic` is true. `LATIN`: the
Roboto families read from `TEXT.family`; identity functions; `arabic` is false. The record also
carries `arabic: boolean`, read by the one style that sets no family today (Countdown.tsx `text`):
under ar it gains `fontFamily: ty.familyRegular` so the countdown name leaves the OS fallback;
under any other locale the property stays unset (`fontFamily: ty.arabic ? ty.familyRegular :
undefined`), so English keeps the system face it renders today. No react import, so logic suites
keep loading it.

Consumers: `const ty = typographyFor(currentLocaleId());` at module scope beside
`StyleSheet.create`; styles read `ty.familyMedium`, `ty.size(15)`, `ty.lineHeight(20)`,
`ty.letterSpacing(TEXT.letterSpacing.default)`. Tokens stay as the inputs; the map owns the
rendered numbers. The module exports only `ARABIC_SIZE_FACTOR`, the `LocaleTypography` interface
and `typographyFor` — the resolution lives at the consumer, never inside the module.

Pinned size table under ar (`Math.round`):

| n | 10 | 13 | 14 | 15 | 16 | 18 | 20 | 22 | 26 | 28 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ar | 12 | 15 | 16 | 17 | 18 | 21 | 23 | 25 | 30 | 32 |

lineHeight: 16 to 18, 20 to 23, 22 to 25. `TEXT.sizeDetail - 1` (13) resolves to 15 through the
same call.

Alternatives rejected: a `useTypography` hook (adds re-render plumbing 25 files do not need; the
remount-and-relaunch semantics already re-resolve), RN's `allowFontScaling`/`maxFontSizeMultiplier`
(device font-scale, not locale — wrong axis), per-platform fallback tuning (unverifiable from the
repo; the bundled face removes the lottery).

Concurrency trace: language pick → `commitLanguagePreference` → `setActiveLocale` (bump
`localeVersionAtom`, remount) → converge surfaces → RTL boundary? force direction +
`Updates.reloadAsync()`. Typography reads happen at module scope per file; the relaunch reloads
every module; a non-ar switch never changes a typography answer. The width layer measures through
the same resolved styles, so ar reserves land on ar's own key, widen-only.

Design review: the map is total over `LOCALE_IDS` (six cases, tested), pure, and the only
branching in the consumer path is the module-scope resolution. No new component pattern; the
styles keep their shape.

**Acceptance criteria:**

- [R1.1] WHEN the repository holds the step-1 commit, THE SYSTEM SHALL carry assets/fonts/NotoSansArabic-Regular.ttf and assets/fonts/NotoSansArabic-Medium.ttf whose sha256 digests equal the pinned values in step 1.
- [R1.2] WHEN the two pinned Noto TTFs are parsed, THE SYSTEM SHALL report usWeightClass 400 for Regular and 500 for Medium, so the shipped weight is a real face.
- [R1.3] WHEN app.json's expo-font plugin entry is read, THE SYSTEM SHALL list four font paths with the two Roboto entries unchanged ahead of the two Noto entries.
- [R1.4] WHEN assets/fonts/OFL.txt is digested, THE SYSTEM SHALL equal the pinned sha256 recorded in step 1.
- [R1.5] WHEN typographyFor is called with 'ar', THE SYSTEM SHALL return familyRegular 'NotoSansArabic-Regular', familyMedium 'NotoSansArabic-Medium', and size and lineHeight mappings equal to Math.round(n * 1.15) across the pinned table.
- [R1.6] WHEN typographyFor is called with 'en', 'ms', 'so', 'hi' or 'th', THE SYSTEM SHALL return the Roboto families with identity size, lineHeight and letterSpacing.
- [R1.7] WHEN typographyFor resolves letterSpacing for 'ar', THE SYSTEM SHALL return 0 for every input.
- [R1.8] WHEN setActiveLocale('ar') runs and a module evaluates typographyFor(currentLocaleId()), THE SYSTEM SHALL return the ar record: the Noto families, the Math.round size and lineHeight table, letterSpacing 0, arabic true.
- [R1.9] WHEN setActiveLocale('en') runs and a module evaluates typographyFor(currentLocaleId()), THE SYSTEM SHALL return the Roboto record with identity size, lineHeight and letterSpacing, arabic false.
- [R1.10] IF ARABIC_SIZE_FACTOR or a family constant is mutated away from its pinned value, THE SYSTEM SHALL fail at least one test in shared/__tests__/typography.test.ts.
- [R2.1] WHEN a swept component renders a catalog-text Text under 'ar', THE SYSTEM SHALL style it with the Noto family the inventory row names for it (the weight it renders today; a style with no family today gains the Arabic regular under ar only) and with fontSize equal to Math.round(pre-change value * 1.15).
- [R2.2] WHEN a swept component renders the same Text under any non-ar locale, THE SYSTEM SHALL style it with the same family as before the change (Roboto where set today, the property unset where unset today) and the same fontSize, lineHeight and letterSpacing numbers as before the change.
- [R2.3] WHEN a swept style sets lineHeight or letterSpacing, THE SYSTEM SHALL resolve them through the locale typography (ar: Math.round(n * 1.15) and 0).
- [R2.4] WHEN InitialWidthMeasurement renders its hidden prayer-label Texts under 'ar', THE SYSTEM SHALL style them with the Arabic regular family at fontSize Math.round(18 * 1.15), so the width reserve measures the rendered rows.
- [R2.5] WHEN the decorative-glyph styles are compared against the pre-change source, THE SYSTEM SHALL show no change in Help.tsx chevron, stepMark and titleBadgeGlyph, Settings.tsx chevron, ColorPicker.tsx chevron, and QiblaCompass.tsx keeps its radius-proportional fontSize with only the family re-pointed.
- [R2.6] WHEN every file in the step-2 inventory is read, THE SYSTEM SHALL import typographyFor and hold no remaining raw `fontFamily: TEXT.family` reference outside the styles D74.6 names untouched.
- [R2.7] IF a swept file's family or size mapping is reverted to its raw TEXT form, THE SYSTEM SHALL fail the sweep-guard test named in step 2.
- [R3.1] WHEN the Help modal renders under Arabic on the iPhone XS or the iOS simulator, THE SYSTEM SHALL show the question row and step lines visibly heavier than the answer body, read by the vision subagent and transcribed into sessions/74/.
- [R3.2] WHEN the prayer list renders under Arabic, THE SYSTEM SHALL show names and times at the scaled size with no clipped or wrapped row at the 57px row height.
- [R3.3] WHEN the same screens render under English on the post-change build, THE SYSTEM SHALL show no visible weight or size change against the pre-change screenshots.
- [R3.4] WHEN the pre-change build renders the Help modal under Arabic, THE SYSTEM SHALL show the plain-weight questions the owner reported, recorded as the step-3 red.

## 6. Steps

- [ ] Step 1: Arabic fonts bundled and the locale typography module (`steps/1-arabic-fonts-and-typography-module.md`, Weight: 2)
- [ ] Step 2: the per-locale sweep of every text style (`steps/2-per-locale-sweep.md`, Weight: 2)
- [ ] Step 3: device proof on the iPhone XS (`steps/3-device-proof.md`, Weight: 3)

Each step file carries its own anchor check, goal, branch, files, red tests, change contracts,
green run, break script, version and commit, review checklist, merge and done-when. Steps 1 and 2
are code steps (weight 2 each, one batch); step 3 is the device step (weight 3), runs last, and
must not start before steps 1 and 2 are merged.

## 7. Device proof

Step 3 owns it in full; the shape only here. Build on the iPhone XS per
`e2e/device-atlas-iphone-xs.md` (placeholders `IPHONE_UDID`, paid-team id; prebuild with
`EXPO_PUBLIC_IOS_WIDGETS=1`, Release `run:ios` with the team inline), or the iOS simulator when
the XS is unavailable. The pre-change ar screenshot is the red (R3.4); the post-change reads are
screenshots transcribed by the vision subagent (R3.1 to R3.3). No clock change, no alarm work:
pure rendering. Record everything under `$HOME/athan-gitree/sessions/74/`.

## 8. Records

- LOG.md entries land under their step headings in the ledger contract shape below: step 1's
  entry carries the digest verification output lines, step 2's carries the inventory drift check
  (empty is a pass) and the mutation-pass first failures, step 3's carries the vision
  transcriptions verbatim.
- Queue cell text for DONE (the lead applies it): "DONE: Arabic renders in bundled Noto Sans
  Arabic Regular/Medium at the 1.15 parity factor on every app text style, weight surfaces render
  a real medium (help questions, step instructions, card titles, sheet and modal titles), en and
  the other four locales byte-identical; width reserve re-measures on ar's own key; device-proven
  on the iPhone XS."
- Docs commit message: `74: arabic typography parity (Noto Sans Arabic, factor 1.15)`.

### LOG.md ledger contract (ticket 56)

Every step entry opens with `### Step <NN> — <state>` and ends with a line
`session: <ses_id>`. Planning sections use `## Planning (2026-10-13)` and `## Ticket 74`.

The DONE merge keeps `ai/plans/74-arabic-typography/FONT-MEASUREMENTS.md` (cited by
`shared/typography.ts`'s docblock, the `27-silent-mode-bypass/FINDINGS.md` precedent); the rest of
the folder dies with the merge.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| Preflight names an anchor drifted that the step's expected-drift list does not carry | An edit to a cited file from row 72's landing, another ticket, or this plan's own landed steps outside the schedule | The planner re-pins and re-reads the file; no anchor survives a blind count fix |
| sha256 mismatch on a Noto file | Release artefact changed or a partial download | STOP per section 2.2; re-download once; a second mismatch goes to the owner |
| `yarn validate` coverage gate drops | A swept file lacks an importing test | Add the file to the sweep-guard table; never weaken the gate |
| Arabic text renders with mixed faces on device | A catalog-text style outside the inventory kept the system path | Record the surface in LOG.md, extend the inventory, re-run the sweep-guard red first |
| A relaunch does not follow an ar pick | Row 68's relaunch regressed | STOP: this plan's module-scope resolution depends on it; file the defect against the language pick, not this plan |

Anticipated review fixes, word for word:

- "The factor derivation belongs beside the module as a committed artefact, not a plan footnote."
  -> `FONT-MEASUREMENTS.md` ships in the plan folder and survives per the records rule only if
  cited; the module's docblock cites it by path.
- "The sweep-guard test is a source grep, not a render probe." -> Both: the guard walks the
  inventory over source, the render probes pin Help and Header under both locales.

Per-step restore lists:

- Step 1: revert `app.json` to the two Roboto entries, delete the two TTFs, `OFL.txt`,
  `shared/typography.ts` and its test. No stored state touched.
- Step 2: revert the 25 component files. No stored state touched; the width keys self-heal by
  their widen-only rule.
- Step 3: uninstall the build from the XS (two apps per the atlas), remove screenshots from the
  phone; transcriptions stay in `sessions/74/`.

## 11. Subagents

Planning: the planner mapped the code directly (the worktree constraint kept codegraph off this
lane) and dispatches one `athan-plan-griller` on the finished draft. Delivery: the lead dispatches
the `athan-executor` and `athan-reviewer` workers; step 3's screenshots are read by the `vision`
subagent. Every worker may call `vision` for an image it cannot see. Nothing else, ever.

## 12. Report to the owner

Arabic now renders in a bundled Noto Sans Arabic Regular and Medium at sizes scaled by the
measured 1.15 parity factor, so the Help questions, step instructions, card titles and sheet
titles carry a real heavy weight instead of the OS's plain fallback, and the body text reads at
the size the English list reads. English and the other four languages are byte-identical to
before, pinned by a table test. The width reserve re-measures on Arabic's own key, so the prayer
rows never wrap. Proven by unit tables over all six locales, a mutation pass on the factor and
family mappings, and an iPhone XS before-and-after read by the vision subagent. Decisions waiting
on the owner: none at execution; the audit sights the app.json font registration against her
ruling, and the hi/th fallback faces are a future row if she wants one.
