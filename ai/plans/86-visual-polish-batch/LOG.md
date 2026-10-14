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
