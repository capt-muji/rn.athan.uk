# Ticket 61: The prayer-name reserve is the widest label, not the longest by characters

| Field | Value |
| --- | --- |
| Brief | Queue row 61, owner-reported defect 2026-10-12 |
| Planned at | uat `2670e596`, version 2.0.105, 2026-10-12 |
| Planned by | Planning session 2026-10-12 (owner away; her defect report is the ruling) |
| Needs first | 39 (DONE) |
| Parent | none |
| Group | prayer list width layer (row 59's verification and row 66's investigation read this layer; neither holds code) |
| Batch budget | 2 |
| Session budget | 2 |
| Steps count | 1 |
| Device | none (proof is component-level; the confidence build carries the face) |
| Owner decisions still needed | none: a defect fix, behaviour only |

Resume from: execution, step 1. The grill's six findings are applied (the suite exists and is extended, the coverage gate, the orphaned import, the grep scope); the plan is READY. Diagnosis complete: the measurer remounts per switch
(`app/_layout.tsx:90` keys it on `localeVersion`), so recalibration happens;
the defect is `getLongestPrayerNameIndex` picking the longest label by code
points while the reserve needs the widest in rendered points.

## 1. Goal

Under `so`, Sunrise ("Waaberi") wraps its last letter to a second line
although space remains. The reserve comes from one measured label per list:
the longest by character count (`getLongestPrayerNameIndex`,
`shared/prayer.ts:195`). Character count is not rendered width: a shorter
name with wide glyphs overflows the reserve by its last letters. The owner's
report names the symptom; the fix is behavioural.

DONE when every prayer name on both lists is measured and the reserve is the
widest label in points under every locale, so no name wraps while space
remains.

## 2. Decisions

### 2.1 Taken

| ID | What | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D77 | The defect is the picker, not the recalibration: `app/_layout.tsx:90` already remounts the measurer per switch (R3.1, R5.2). | planning | 2026-10-12 | this section, verified from code |
| D78 | Fix shape: measure every name, keep the widen-only store. One hidden Text per prayer id on both lists; `setEnglishWidth` already accepts only widening writes, so the true max lands regardless of which label is widest. | planning | 2026-10-12 | this section |
| D79 | `getLongestPrayerNameIndex` and its tests die with the fix: the measurer was its only caller. | planning | 2026-10-12 | grep: `shared/prayer.ts:195`, `InitialWidthMeasurement.tsx:5`, `shared/__tests__/prayer.test.ts:308` |

### 2.2 The executor must not decide

- Keeping `getLongestPrayerNameIndex` "in case": dead code stays dead; D79.
- Touching the store (`stores/ui.ts`): widen-only semantics are unchanged and
  already tested (`stores/__tests__/ui.test.ts`).
- Any visual restyle of the rows. The reserve may only grow, which is the
  defect fix itself.

## 3. Pre-flight

`scripts/preflight-61.sh`: uat checkout, clean tree, origin merged, version at
or above Planned at, row 39 DONE, the plan's anchors each count 1. Ends
`PREFLIGHT OK`.

## 4. Background the executor needs

### Code map

| File | Role |
| --- | --- |
| `components/ui/InitialWidthMeasurement.tsx` | The measurer. Two hidden Texts today, one per list, each the codepoint-longest label. Changes to one Text per prayer id. |
| `app/_layout.tsx:90` | `<InitialWidthMeasurement key={localeVersion} />`: remounts per language switch. Read only. |
| `hooks/usePrayer.ts:90` | Rows read `englishWidthAtomFor(type)` inside the hook, so the remount re-subscribes under the new locale's key. Read only. |
| `components/prayer/Prayer.tsx:68-70` | `width: Prayer.ui.maxEnglishWidth + STYLES.prayer.padding.start`: the reserve. Read only. |
| `stores/ui.ts:134-143, 261-275` | Per-locale widen-only atoms keyed `prayer_max_english_width_<locale>_<side>`. Untouched. |
| `shared/prayer.ts:195-211` | `getLongestPrayerNameIndex`: dies (D79). |
| `shared/__tests__/prayer.test.ts:305-330` | Its describe block and import entry: die with it. |
| `components/ui/__tests__/InitialWidthMeasurement.test.tsx` | The existing suite since 2.0.24 (three per-locale describes firing both lists' layout events), extended with the two new tests. |

### Why the obvious variants are wrong

- Fixing the picker to estimate width from character count times a glyph
  factor: an estimate, and the repo measures instead of estimating (the file's
  own history, ISSUES #22).
- Reserving `auto` width per row: the reserve exists so every row's time
  column aligns (the design's one-line comment in `Prayer.tsx`); per-row auto
  width misaligns the lists.

## 5. Design

Every prayer name renders in a hidden measurer Text under the row style's
exact typography; each layout event reports into the widen-only store, so the
per-locale key converges to the widest label in points. A test can check
both: all labels mounted, and a wider layout event from a single name widens
the reserve.

Concurrency trace: none. Mount-time measurement only; no timers, no
subscriptions. The remount per switch re-runs the map under the new locale.

**Acceptance criteria:**

- [R1.1] WHEN the measurers mount THE SYSTEM SHALL render one hidden Text per prayer id on both lists, in the row typography
- [R1.2] WHEN any single name's layout event reports a width wider than the cached reserve THE SYSTEM SHALL widen the reserve to it

## 6. Steps

- [x] Step 1: measure every name (`steps/1-measure-every-name.md`)

## 7. Device proof

None at execution. The proof is component-level (layout events drive the
store). The rendered face under `so` heals on the confidence build from row
39's deferred tail (D41), which row 59's prayer-name work also rides.

## 8. Records

LOG.md entry under `### Step 01 — done`: the standard fields (branch, commit
sha, version, hook `Tests:` and coverage lines, red failure line verbatim,
break last line, review verdict, merge sha), ending with the `session:` line.

Queue cell text the lead applies on DONE:

`DONE <date>, audited: the prayer-name reserve is now the widest label in rendered points, measured per name on both lists (the Somali Sunrise wrap healed at the root: character count picked the longest, not the widest); getLongestPrayerNameIndex and its tests deleted; widen-only store unchanged`

Docs commit message: `<VERSION> - docs(plans): ticket 61 executed: 1 step, widest-label measurement`

## 9. Push

None. The executor never pushes. The lead pushes after review.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| The new suite's first test passes on pristine code | Labels already all mounted | `STOP:` with output |
| `prayer.test.ts` fails after the deletion | The describe block was left partially | Delete the whole block and the import entry |
| Row alignment shifts in en screenshots | The en widest label differs from the codepoint-longest | That is the fix landing; verify no test pins pixel widths, then record |
| The store narrows after a switch | Widen-only broken | `STOP:`; the store was touched against D78 |
| The commit is refused on coverage | A list's layout event is never fired | Fire one per list in the suite; the existing per-locale describes already do |

Anticipated review fixes, word for word:

- "Measure only the three longest candidates" - rejected: ten hidden Texts
  cost nothing (the file's own comment) and any candidate list re-derives the
  character-count assumption the fix removes.
- "Keep getLongestPrayerNameIndex for future use" - rejected: D79, dead code.

## 11. Subagents

Planning: codegraph reads; the red tests mirror the house RNTL pattern (fire
`layout` events, read the default store). Delivery: one `athan-executor`
dispatch, then `athan-reviewer` blind and plan-conformance.

## 12. Report to the owner

The Somali wrap healed by measuring every name instead of guessing the
longest; the reserve can only grow, so no language regresses. The progress
table, then the four-line handoff.
