## Planning (2026-10-14)

Skeleton created; the ticket moved to PLANNING.

## Planning (2026-10-14), the interview

Ten owner rulings taken in one round, four in two follow-ups, all recorded in PLAN.md
section 2 as D86.1 to D86.12: the note under each sheet's header as a plain quiet footnote,
the 25 percent on the Standard list margin only, the bar mirroring with the layout, the
loader's new key and wording, the applying row and its key deleted, the loader on every pick
and instant over the sheet, the Arabic gaps pinned to English's, and no executor device step.

## Planning (2026-10-14), the grill

One griller pass over the folder returned 18 findings (9 must, 5 should, 4 nice); all 18
checked against the code and applied. The material ones: the bridge suite's tokened-key pin,
the directional-style gate over the new fill anchor, two break discriminators quoting output
jest never prints, two orphaned imports the plans' own green runs would have caught, and the
`@gorhom` claim about native modals. The locale line box became a non-optional record field
answering `undefined` on the Latin records, which removes the optional-call branch the grill
flagged as uncoverable.

`bash scripts/check-plan.sh` prints `PLAN OK`.

## Ticket 86
Executor session: ses_ec5444514ffeU8qJOpMB0X1uOO (batch 1: steps 1-3)

### Step 1 — merged (uat, 2.0.717, ffb9960b)

Anchor check: PREFLIGHT OK (all counts 1). Red: sweep printed `Expected: 26 / Received: undefined`; day suite printed `Expected: 19 / Received: 24` — both exactly as the plan describes. Green: 37 passed across the two suites; tsc exit 0; biome exit 0. Break script ended `ALL AS EXPECTED: 1`; tree then held only step and plan files. Version 2.0.717 taken under the lock (base origin/uat 2.0.716); set in app.json, package.json, android/app/build.gradle. Commit ffb9960b: hook `Tests: 5637 passed, 5637 total`, four coverage lines 100%. Review: blockLineHeight pinned on ARABIC via LATIN_LINE_RATIO 1.171875, `() => undefined` on LATIN, families/sizes/colours/margins untouched, scriptLineHeight still serves Explanation.tsx, no residue. Merged --no-ff into uat.
session: ses_ec5444514ffeU8qJOpMB0X1uOO

### Step 2 — STOPPED mid-step, not merged (work saved to ~/athan-gitree/sessions/86/step2-unfinished.patch)

Branch feat/86-volume-note created and deleted unmerged; tree restored per the step-2 restore list. Red confirmed as the plan describes (Note suite failed to resolve `../Note`; alert order case `Expected: < 1724 / Received: 20196`; sound order case `Expected: < 1714 / Received: 1864`; sweep ENOENT on the missing Note.tsx). Changes applied, 95 tests passed across the four suites. Then `npx tsc --noEmit` failed with two errors INSIDE the plan-verbatim Note.test.tsx, and `npx biome check` failed on the same file's `styleOf` one-liner exceeding print width. Per the green rule, errors in plan-verbatim code are STOP, never an executor edit. Quoted errors: `Note.test.tsx(22,49): error TS2345: Argument of type 'TestInstance' is not assignable to parameter of type '{ props: { style: unknown; }; }'` and `Note.test.tsx(24,20): error TS2352: Conversion of type 'TestInstance | undefined' to type '{ props: { style: unknown; }; }' may be a mistake because neither type sufficiently overlaps` plus the biome formatter wrap on line 14. The file was verified byte-identical to the plan's block before stopping. No commit, no version taken, lock not held.
session: ses_ec5444514ffeU8qJOpMB0X1uOO

### Replan (2026-10-14, lead)

The step-2 stop adjudicated as a plan defect. The lead re-applied the saved step-2 patch,
reproduced both quoted tsc errors verbatim (TS2345: `TestInstance.props` is
`Record<string, any>` and carries no required `style`; TS2352 on the direct cast) and the
Biome print-width failure, then proved the repaired block in tree: tsc exit 0, Biome clean,
the Note suite 1 passed; tree restored. The repair is the step-1 suite's landed
`flattenStyle(style: unknown)` helper verbatim, and the same defect sat in steps 4 and 5, so
all three step blocks now carry the proven form. Steps 1 to 5 anchors and source untouched.
session: lead (this session)

### Step 2 — merged (uat, 2.0.719, 5389e92a)

Resumed from the saved patch: applied its four test-file hunks, replaced the patch's stale
`styleOf` helper with the plan's repaired `flattenStyle` block (verified byte-identical to the
step file), then applied the four component hunks. Anchor check: `alert-note-foot` 1,
`sound-note-in-card` 1. Red exactly as recorded: Note suite `Cannot find module '../Note'`;
alert order `Expected: < 1724 / Received: 20196`; sound order `Expected: < 1714 / Received:
1864`; sweep ENOENT on the missing Note.tsx. Green: 95 passed across the four suites; tsc
exit 0; biome exit 0. Break script ended `ALL AS EXPECTED: 1`; tree then held only step
files. Version 2.0.719 taken under the lock (ladder shifted: the replan consumed 2.0.718, so
the next patch after uat's 2.0.718 is 2.0.719). First commit attempt failed the hook: the
json.dumps rewrite of app.json expanded arrays Biome wants collapsed; redone as a one-line
surgical version edit, hook then green. Commit 5389e92a: hook `Tests: 5643 passed, 5643
total`, four coverage lines 100%. Review: Note.tsx byte-identical to the plan block, the note
first child of Sheet in both screens, the wording ternary intact, `cardHint` keeps live uses,
module-level `ty` matches the shipped Header/Alert/Sound pattern, no residue. Merged --no-ff
into uat as a285aa32.
session: ses_ec52eba43ffekjpFHnH0Kgzt5O



### Step 3 — merged (uat, 2.0.720, ec053e69)

Anchor check: `list-container` 1. Red: the changed case printed `Expected: 28 / Received:
22.5`, the Extras case stood at 34. Change: container marginBottom 28, import reduced to
`{ SCREEN }`, SPACING had no other use. Green: 13 passed; tsc exit 0; biome exit 0. Break
script ended `ALL AS EXPECTED: 1`; tree then held only step and plan files. Version 2.0.720
taken under the lock (origin/uat still 2.0.716, local uat 2.0.719; next patch 2.0.720), set
surgically in the three version files. Commit ec053e69: hook `Tests: 5643 passed, 5643
total`, four coverage lines 100%; carried this run's plan files and the queue cell moved to
step 3. Review: exactly the contract's diff, Extras 34 untouched, Ago.tsx untouched, no
unused import, no stale comment. Merged --no-ff into uat as 56d3829a.
session: ses_ec52eba43ffekjpFHnH0Kgzt5O

### Steps 4 and 5 — STOPPED before any red run (tree untouched, no branch, no version, lock never held)

The dispatch dictates the step-4 and step-5 blocks byte-identical, but four `it()` names
across their test blocks hold an ASCII apostrophe inside a single-quoted string, which cannot
parse: step 4 `steps/4-tip-mirror.md` line 81 (`'anchors the fill to the track's leading edge
in each direction'`, in the tipGeometry block), lines 110 and 119 (`'...the track's left edge
under English'`, `'...the track's right edge under Arabic'`, in the Bar block), and step 5
`steps/5-language-loader.md` line 102 (`'caps the line's width so a long sentence breaks onto
two centred lines'`, in the LanguageLoader block). Biome's parse of the extracted blocks prints
`expected ',' but instead found 's'` at each apostrophe; jest would die on the SyntaxError
before any red failure the plan describes. This is the step-2 defect class (plan-verbatim code
that does not compile), so per the green rule it is a stop and quote, never an executor edit.
Verified before stopping: all eight anchors for steps 4 and 5 count exactly 1; every other
complete code block in both step files parses clean; both break scripts pass `bash -n`; the
JSON/catalog parse failures biome also printed are the plan's insertion fragments, correct as
written. The repo's own convention exists (Alert.test.tsx:520 escapes the apostrophe as
`\u2019`), but applying it to plan-verbatim test names is the lead's repair to prove, as the
2.0.718 replan was. Working tree holds only the two plan files this run found on arrival.
session: ses_ec52319ebffeE39wJK9foOt5ef

### Replan 2 (2026-10-14, lead)

The steps 4 and 5 stop adjudicated as the step-2 defect class: four plan-verbatim it() names
carried an ASCII apostrophe inside single-quoted literals (a SyntaxError before any red
failure). The lead verified all four lines verbatim, repaired them to the repo's landed
escape convention (Alert.test.tsx:520, \u2019), and proved the four repaired literals in
tree with a scratch spec: jest 4 passed, Biome exit 0; scratch deleted. No other block was
touched; anchors and source untouched.
session: lead (this session)
