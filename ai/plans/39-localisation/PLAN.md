# Session 38: the single-language overhaul, stage one (of two, inside release 2.0.0)

| Field | Value |
| --- | --- |
| Brief | `SINGLE-LANGUAGE-PIVOT.md` (governs), `OWNER-DECISIONS.md` D17 to D29, research R8 to R18 |
| Planned at | `uat` `500e5037` (1.29.296), 2026-10-09 |
| Planned by | Planning session (interview + adversarial research rounds, owner-present) |
| Needs first | row 37 DONE (verified in the queue) |
| Steps | 15 (stage one; stage two is row 39, replanned separately) |
| Device | OnePlus 3T (`3T_SERIAL`), Android 9; iPhone XS for the iOS-side checks |
| Owner decisions still needed | Q20 launch set (rides row 39), Q21 RTL prose alignment (rides row 39 stage two; single-line labels are stage-one-safe left), `preference_language` and `preference_language_commit_pending` key names (sign-off list), OTA: none at 2.0.0 (recommendation, stands unless moved) |

## 1. Goal

**What is wrong today:** the app renders two languages at once (English chrome, Arabic second
column and explanation line), every string is a hardcoded literal, and the English prayer name
doubles as the domain identifier without any type-level separation, so a future catalog could
silently corrupt 27 storage keys, 2 OS identifier families and 67 audio slugs.

**What is true when DONE (stage one):** the Arabic column, the Arabic explanation line, the
"Show arabic names" toggle, its atom and its stored key are gone; every user-visible string
renders through a typed flat catalog (`t()`, `keyof typeof` key safety, English catalog
byte-identical to today's literals); the prayer identifier is the closed space-form slug union
on a field named `id`, pinned by `prayerIdContract.test.ts`; the width cache is per-locale with
the `en` keys seeded from today's values; the 2.0.0 upgrade is the targeted no-wipe migration
(R18); a hardcoded-string guard, a plural-construct guard and a catalog-JSON round-trip parity
test run in the existing pre-commit chain. The app looks byte-identical to 1.29.x in English.

**How the owner notices:** he cannot (that is the point of stage one); the row shows one name,
the box one explanation, and `yarn validate` carries three new gates.

**Owner rules that apply (sources):** D17 to D29 (`OWNER-DECISIONS.md`); the hard rules in
`ai/AGENTS.md` (never substitute a prayer time; visuals settled, and this plan's visible deltas
are exactly the removals the owner ruled in Q1/Q2; full coverage, red before green; version
lockstep; no `console.log`; comments explain why only). The executor changes no pixel beyond
the ruled removals.

## 2. Decisions

**2.1 Taken** (each with date and source): D17 one language everywhere; D18 all-or-nothing
switch (stage two); D19 2.0.0 release, 3.0.0 global; D20 qibla sensor untouched; D21 Latin
numerals everywhere; D22 audio unchanged; D23 month names localise (month machinery is stage
two; stage one changes no date code); D24 missing names transliterate; D25 release workflow
(main PR-only, already landed PR #168); D26 native names in the picker (stage two); D27 the
five daily prayers transliterate everywhere, İmsak banned; D28 the switch's failure face
(stage two); D29 upgrade-connectivity assumption. Q1 to Q11, Q13 to Q15, Q18, Q19 as recorded
in the pivot's frontier. Verdicts adopted: R15 identifiers, R16 architecture with its six
forced changes, R17 scale, R18 upgrade.

**2.2 The executor must not decide.** Any output the plan does not predict: STOP and ask. The
four open owner items (Q20, Q21, the two key names, OTA) do not block stage one: stage one
renders English only and builds no picker; the key names ship in stage one's storage work and
carry the recorded names unless the owner moves them at review, which the decision block
makes explicit before execution is scheduled.

## 3. Pre-flight

Saved to `scripts/preflight-38.sh` in this folder. Checks: checkout on `uat`, clean tree,
`origin/uat` merged in, version not lower than 1.29.296, row 37 DONE, every anchor under
`scripts/anchors/` counts exactly 1 at the planned-at sha. Ends `PREFLIGHT OK`.

## 4. Background the executor needs

The code map IS `research/R13-BLAST-RADIUS.md` (every file:line to touch, counts per file, the
five silent seams) and the test census IS `research/R14-TEST-CENSUS.md` (74 suites affected,
the five largest refactors, the eight commit-signature suites). The upgrade design is
`research/R18-UPGRADE-PATH.md`; the transaction is `research/R11-LANGUAGE-COMMIT.md` (stage
two); the identifier design with its test gate is `research/R15-IDENTIFIER-DESIGN.md`. The
executor reads those four in full before step 1. Anchors: `scripts/anchors/` holds the verbatim
excerpts each step edits against, extracted at the planned-at sha.

Why the obvious fix is wrong: renaming `Prayer.english` in place, or "translating" the arrays,
orphan alarms and reset preferences silently (R13 seams 1-2; the `last third` space-form
landmine, R15). JSON catalogs (R5/R16): rejected as design, kept as pre-decided contingency.
Any wipe on upgrade: rejected on measurement (R18, D29).

## 5. Design

**Invariant (one sentence a test can check):** after every stage-one commit, the app renders
exactly the bytes 1.29.296 rendered in English, every stored key and armed identifier is
unchanged byte-for-byte, and every user-visible string reaches the screen through `t()`.

**The approach:** remove the Arabic surfaces first (they are self-contained), then land the
identifier union with its freeze gate before any catalog exists, then build the catalog and
`t()` with the bridge and guards, then migrate the 123 display strings file by file in R13's
measured order, then the width per-locale keys with the module-eval seed, then the storage
row-shape change and the upgrade migrations, then the source-scan guard switched on last (so
it flags only what remains, which is nothing).

**Alternatives rejected:** numeric identifiers (R15d); a wipe upgrade (R18a); a library (R16);
wrapping the removal and the catalog in one step (the removal must land alone so a revert of
the catalog work never resurrects the column); doing the row-shape change before the freeze
test exists (the freeze must be red-proof before the first byte moves).

**Concurrency trace:** stage one touches no scheduling logic except the record shape; the
scheduler runs unchanged against `id` because the bytes are identical. The width seed runs at
module evaluation of `stores/ui.ts` before any atom exists over the new keys (R18 step 2) -
the only ordering hazard in the stage, and it is designed around, not tested around.

**Design review:** the synthesis pass (`SINGLE-LANGUAGE-PIVOT.md`, "Synthesis pass") played the
hostile reviewer across the whole record; its 23 findings are repaired there, and its two owner
items are pinned to the decision block, not silently assumed.

## 6. Steps (checklist; each step is a file under `steps/`)

1. `01-freeze-test.md` - `prayerIdContract.test.ts` freeze table + disk join (red-proof pin,
   no production change).
2. `02-arabic-removal-row.md` - the row's second column, `showArabicNamesAtom` consumers in
   `Prayer.tsx`, `Time.tsx` untouched.
3. `03-arabic-removal-chrome.md` - the Settings toggle row, the explanation box's Arabic line,
   `toArabicNumbers` deleted, `overlayContent`'s Arabic fields.
4. `04-arabic-data-plumbing.md` - `PrayerRow.arabic` dies end to end (row builders, sheet
   state, commit signatures, bookkeeping writes; the eight commit-signature suites, R14).
5. `05-identifier-union.md` - `STANDARD_PRAYER_IDS` / `EXTRA_PRAYER_IDS` (space form),
   `PrayerId`, `id` field rename, builders retyped, dead casts deleted, firewall fixtures on
   the contract test (R15 b and c complete).
6. `06-catalog-and-t.md` - `shared/locales/en.ts` (flat, `as const`, byte-identical), `t()`,
   `prayerLabel(id)`, the plural guard, the `en` byte-parity test.
7. `07-bridge.md` - `i18n:export` / `i18n:import` and the round-trip parity CI test (R16
   forced change 1).
8. `08-strings-wave-1.md` - `shared/help.ts` (27), `shared/whatsNew.ts` (14),
   `Settings.tsx` (12).
9. `09-strings-wave-2.md` - `Alert.tsx` sheets (10), `constants.ts` display strings,
   `ColorPicker.tsx`, `Explanation.tsx`, qibla copy files.
10. `10-strings-wave-3.md` - the remaining copy files to zero, widgets' 25 strings resolved in
    the app and baked into props.
11. `11-width-per-locale.md` - locale-keyed atoms, the module-eval seed, measurement reads the
    catalog, whitelist interactions, `InitialWidthMeasurement` extension.
12. `12-upgrade-migrations.md` - `migrateToLocaleDefaults`, the width seed, R18's crash-window
    suite, `upgrade2_0_0.test.ts`.
13. `13-widget-props.md` - widget prop contracts carry `id`, React keys off the name, payload
    guard re-run.
14. `14-source-guard.md` - the hardcoded-string Jest source-scan, switched on against a
    zero-length exclusion list.
15. `15-pre-flights.md` - the 3T first-catalog require-timing experiment with the JSON.parse
    decision, the month-name probe for `ur bn fr de`, record the numbers.

Step contracts, red tests, break scripts, commit messages and review checklists: `steps/*.md`
(as each is written; see LOG.md's Resume-from note for progress).

## 7. Device proof

Stage one proves on the 3T with a local production build (`build-prod.zsh`): the row renders
one name, times aligned; `dumpsys alarm` shows the same armed identifiers as the 1.29.x build
(unchanged bytes); the width measurement lands in the seeded `en` keys; logcat carries the
catalog require timing. The upgrade path is proven by installing the stage-one build over a
populated 1.29.x install: preferences survive, the dead key is gone, no alarm orphan appears in
the sweep logs. Details per step in `steps/`.

## 8. Records

Row 38's cell on PASS: "DONE: stage one of the single-language overhaul landed as 2.0.0-stage-1
on uat; Arabic surfaces removed, identifier union frozen by contract test, t() pipeline with
bridge and guards, per-locale width keys with seed, the R18 targeted upgrade. Stage two is row
39." The plan folder survives until its merge per the repo rule; R8 to R18 stay (cited by the
row as the surviving artefacts).

## 9. Push

None. The executor never pushes; the audit session pushes after PASS.

## 10. When something goes wrong

Any anchor count other than 1: NEEDS REPLAN. A test failing that the step did not name: STOP.
Anticipated fixes: (a) a suite asserting the removed Arabic strings - delete the assertions
with the surface (they are the change), never the suite; (b) `versionLockstep` at commit time -
the gitignored `android/app/build.gradle` lags branch switches; align it before committing;
(c) the hook's `audioMatrix` timeout - wait for load average below 8 and retry (three tries).
Per-step restore lists live in each step file.

## 11. Subagents

None. Vision only, if an image must be read.

## 12. Report to the owner

Plain sentences: what landed, what the device proved, the three gates now in the chain, and
the four decision-block items standing before stage two schedules. Progress table. The
four-line handoff.

## Resume from

Step files 01 to 15 are outlined (section 6); none is written out yet. **Before any step file is
written, the next planning session reconciles the four external branches the owner dispatched on
2026-10-09**: two verification branches (`verify/39-localisation-<runner>-<date>`, findings
documents) and two architecture branches (`arch/39-localisation-<runner>-<date>`,
design-only alternatives specified completely enough to build from, but NO code: the owner
rescinded the build mandate the same evening), one pair per external harness, all off `uat`.
Every finding and every competing design gets adjudicated against this record, point by point;
whatever wins on the merits is merged into the plan before the step files are authored. If any
external branch carries code commits despite the rescission, read only its documents and note
the code as discarded. Fetch and list `verify/39-localisation-*` and `arch/39-localisation-*`
to find them.

Next: reconcile those branches, then write `steps/01-freeze-test.md` first (it pins the bytes
everything else depends on), then in order. Everything the step files need is in R13, R14, R15,
R16, R18 and the anchors under `scripts/anchors/`. LOG.md carries execution progress from here.
