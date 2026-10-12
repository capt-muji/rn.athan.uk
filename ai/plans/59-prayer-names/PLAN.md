# Ticket 59: Prayer names: shortest context-sufficient forms in every language

| Brief | Prayer names: shortest context-sufficient forms in every language |
| --- | --- |
| Planned at | `d6ca9ade`, version 2.0.123, 2026-10-12 (anchors verified and proof run at this sha) |
| Planned by | Planning session 2026-10-12 |
| Needs first | nothing (61 DONE; executes only after row 63 is DONE: both edit the six catalog files) |
| Parent | none |
| Group | the six i18n catalog files plus the name-width store (serializes with rows 63 and 64 on the catalogs; disjoint from the widget rows) |
| Batch budget | 4 (two code steps; no device step) |
| Session budget | 4 |
| Steps count | 2 (two code steps) |
| Device | none: the measurement suites render real Texts and assert the stored keys; the confidence build carries the face |
| Owner decisions still needed | none. D81 taken 2026-10-12 (live instruction: plan READY without the in-planning D42 pass; the owner vetoes the string table at audit) |

## 1. Goal

Three non-English prayer names read as phrases where English carries short headers:
ms renders Last Third as `Sepertiga akhir malam` ("the last third of the
night"), hi renders Midnight as `इस्लामी आधी रात` ("the Islamic midnight"), th
renders Last Third as `ช่วงสุดท้ายของคืน` ("the last period of the night"). The
owner's rule: prayer names are table-column headers, the shortest
context-correct form, drop the/of/the/night.

When DONE: ms Last Third reads `Sepertiga malam` (her example, verbatim), hi
Midnight reads `आधी रात`, th Last Third reads `ช่วงสุดท้าย`; every other name in
every language keeps its bytes (each already satisfies the rule); the sourced
glossary carries the two superseded values; the name-width reserve re-measures
from zero under a renamed key family so the shorter names actually tighten the
list instead of keeping the old widest-name slack forever.

The owner's rules that apply: no pixel changes beyond this ruled copy change;
the catalog gates hold; visuals are settled and this change is her own ruling.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who, when | Recorded |
| --- | --- | --- | --- |
| D42 (superseded shape) | The drafts land planned-READY without the in-planning string-verification pass; the owner vetoes the three-string table at audit | Owner, 2026-10-12, live instruction to work autonomously | This table and the queue row |
| D81 | The three target strings: ms `Sepertiga malam` (her example, verbatim), hi `आधी रात`, th `ช่วงสุดท้าย` | Owner (ms, her example) and planner (hi, th: mechanical drops of the adjective `इस्लामी` and the particle phrase `ของคืน` under her rule), 2026-10-12 | This table |
| P6 | Every other name in every language keeps its bytes: each already satisfies the shortest-context-correct rule (ar `نصف الليل`, `آخر ثلث`; ms `Tengah malam`; so `Habeennimo dhexe`, `Seddexaad u dambeeya`; hi `अंतिम तिहाई`; th `เที่ยงคืน`). so is left unchanged deliberately: no sourced shorter Somali form exists in the glossary and her example covered ms only | Planner, from the rule and `shared/i18n/sourced-names.json` | Step 1 |
| P7 | The glossary supersedes its two sourced entries by owner ruling (ms Last Third, hi Midnight); th carries no sourced entry today and gains none | Planner, from D81 | Step 1 |
| P8 | The width reset happens by key-family rename (`prayer_max_english_width_` to `prayer_max_name_width_`) with unconditional removal of the old keys, no seed copy: the cache re-measures from zero, accepting one first-launch narrow measure that self-heals on the next launch (the ISSUES #22 grow-toward-truth argument), because the alternative is permanent reserve slack holding the OLD widest name's width | Planner, from the owner's "width reset question answered by planning" | Step 2 |
| P9 | The measuring functions rename with the keys (`setEnglishWidth` to `setNameWidth`, `englishWidthAtomFor` to `nameWidthAtomFor`): the old names lie about what they measure, and the rename is four production files | Planner | Step 2 |

### 2.2 The executor must not decide

- Any string beyond the three in D81. A name that seems to need shortening is a
  STOP: record it for the owner.
- Any reset mechanism beyond P8 (no seeding, no version counter).
- Whether `en` changes: it does not.

## 3. Pre-flight

`scripts/preflight-59.sh`, committed in this folder. The executor saves a copy
to `$TMPDIR` and runs `bash $TMPDIR/preflight-59.sh` with the repository root as
the working directory. It checks: `uat` checked out, clean tree, `origin/uat`
merged in, `package.json` version at 2.0.123 or higher, row 63 DONE in
`ai/plans/README.md` (the catalog serialization), and every anchor counting
exactly 1. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

- The eleven names per catalog: `prayer.*` keys at `shared/i18n/<loc>.ts:12-22`,
  closed into `PRAYER_LABELS` at the file's foot. en is the reference set.
- The sourced glossary: `shared/i18n/sourced-names.json`, per-locale `names`
  with `text` values. The gate `catalogGates.test.ts:112` ("matches the sourced
  prayer names verbatim") compares each locale's catalog to the glossary through
  `sourcedNames()` (line 56). ms and hi carry sourced texts; th's entries are
  `null`, so th is unpinned today.
- Other gates that hold: the 24-char prayer-name budget
  (`catalogGates.test.ts:166`), the en-echo exemption for `PRAYER_NAME_KEYS`
  (`:137`), the injective `PRAYER_LABELS` closure (`i18n.test.ts:205`).
- `en` is untouched, so `catalog-lock.json` stays valid and `dist/en.json`
  stays true; no lock re-take, no export.
- The width layer: `stores/ui.ts` keys `prayer_max_english_width_<locale>_<side>`
  built in `englishWidthAtomFor` (line 130), a legacy-key seed loop above it
  (line 108), `setEnglishWidth` (line 261) accepting only widening measures
  (ISSUES #22 self-heal). `components/ui/InitialWidthMeasurement.tsx` writes it
  from hidden mounted Texts; `hooks/usePrayer.ts:90` reads it per row as the
  name-column reserve. The key prefix appears in the inventories
  `stores/version.ts:155` and `stores/sync.ts:365`, and in `components/ui/Error.tsx`'s
  docblock mention. Row 61 made the reserve the widest rendered label per name;
  widen-only means shorter names never tighten it (P8).
- The proof (scratch worktree, deleted): with the three strings applied, every
  suite passed that does not pin the strings (85 tests: no existing test pins
  the old values except the glossary gate); with the width renames applied,
  `tsc` flagged the two suites' imports and the failing list ran to: the five
  `setEnglishWidth` describes in `stores/__tests__/ui.test.ts` (rename), the
  isolated-atom references there (`:393-409`), the
  `components/ui/__tests__/InitialWidthMeasurement.test.tsx` import and its
  measurement cases, and the two glossary-gate rows (ms, hi) until the glossary
  is updated. Biome clean on the changed sources.

Concurrency: none new. Catalog constants and a storage key family; the measure
path is synchronous onLayout.

## 5. Design

The approach: change three catalog values, supersede the two glossary entries
that pinned them, pin all three (th included, which no gate covers) in one new
test, then reset the width cache by renaming its key family and its functions
so the reserve re-measures against the shorter names.

The invariant, one sentence a test can check: the three named values equal D81
byte-for-byte, every other `prayer.*` value in all six catalogs is
byte-identical to `Planned at`, and no `prayer_max_english_width_` key survives
a launch.

Alternatives rejected: shortening more names (P6: nothing sourced supports
it); resetting widths by seeding the new keys from the old values (that copies
the stale slack P8 exists to drop); a catalog-version counter in storage (more
machinery for the same one-shot reset); leaving the width keys alone (the
reserve would hold the old widest name's width forever: ms drops from 21 to 15
characters at the widest name).

**Acceptance criteria:**

- [R1.1] WHEN the ms catalog renders Last Third THE SYSTEM SHALL read `Sepertiga malam`
- [R1.2] WHEN the hi catalog renders Midnight THE SYSTEM SHALL read `आधी रात`
- [R1.3] WHEN the th catalog renders Last Third THE SYSTEM SHALL read `ช่วงสุดท้าย`
- [R1.4] WHEN any other `prayer.*` value in any of the six catalogs is compared to `Planned at` THE SYSTEM SHALL be byte-identical
- [R2.1] WHEN the sourced glossary is read for ms Last Third and hi Midnight THE SYSTEM SHALL carry the two D81 values
- [R3.1] WHEN the app launches THE SYSTEM SHALL remove every `prayer_max_english_width_` key and measure the reserve fresh under `prayer_max_name_width_` keys
- [R3.2] WHEN a narrower measure arrives after a wider one THE SYSTEM SHALL keep the wider value (grow-toward-truth unchanged)

## 6. Steps

Checklist:

1. Step 1 — the three strings, the glossary supersession, the pins
   (`steps/1-short-names.md`)
2. Step 2 — the width key-family reset and renames (`steps/2-width-reset.md`)

Scope guard: `en.ts` values, `catalog-lock.json`, `dist/`, every widget file
and the notification copy are out. The three strings and the width family are
the whole ticket.

## 7. Device proof

None beyond the confidence build: the measurement suites render real Texts and
assert the stored keys, en is byte-identical, and the three changed names are
the owner's own ruling. Her D41-style check rides the next confidence build,
and her audit veto covers the string table (D42 superseded shape).

## 8. Records

The findings text the executor appends to `LOG.md` under
`## Ticket 59 (2026-10-12)`:

```
Three prayer names shortened per the owner's header rule: ms Last Third
Sepertiga malam (her example), hi Midnight (adjective drop), th Last Third
(particle-phrase drop); the glossary's two sourced entries superseded by
ruling; every other name byte-identical. The name-width cache renamed to
prayer_max_name_width_ with the old keys removed, so the reserve re-measures
against the shorter names instead of holding the old widest-name slack.
```

The queue cell the lead applies on DONE:

```
DONE <date>, audited: three names shortened under the header rule (D81, the
owner's ms example verbatim; hi and th mechanical drops), glossary superseded
on the two sourced entries, width cache reset by key rename so the reserve
tightens; all other names byte-identical.
```

Docs commit message: `<VERSION> - docs(plans): ticket 59 READY: shortest
prayer names, width reset, 2 steps`.

## LOG.md ledger contract

Every step entry in `LOG.md` opens with the heading `### Step <NN> — <state>` and
ends with a line `session: <ses_id>`. Planning sections use
`## Planning (<date>)` and `## Ticket <N>`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| The glossary gate fails on ms or hi | The catalog changed without the glossary (or the reverse) | The two sides of D81 must land in one commit; check `sourced-names.json` holds the same two values |
| A suite still imports `englishWidthAtomFor` after step 2 | A file the proof enumerated was missed | The proof's list is exhaustive at `Planned at`; a NEW reference is a STOP (a later ticket added one) |
| The width keys tests fail on literal key names | The tests assert `prayer_max_english_width_` literals | They rename with the family: `prayer_max_name_width_` |
| The owner rejects a string at audit | D81's table is her veto surface | Revert that one value and its glossary entry in a follow-up commit; the rest of the ticket stands |

Anticipated review fixes, word for word:

- A docblock still saying "the longest English prayer name": rewrite to "the
  widest active-locale prayer name".
- `components/ui/Error.tsx`'s docblock naming the old key prefix: rewrite to
  `prayer_max_name_width_`.
- A `so` or `ar` name changed beyond D81: revert it (P6).

Restore list: step 1 reverts `shared/i18n/ms.ts`, `hi.ts`, `th.ts`,
`sourced-names.json` and `catalogGates.test.ts`; step 2 reverts `stores/ui.ts`,
`stores/version.ts`, `stores/sync.ts`, `hooks/usePrayer.ts`,
`components/ui/InitialWidthMeasurement.tsx`, `stores/__tests__/ui.test.ts` and
`components/ui/__tests__/InitialWidthMeasurement.test.tsx`.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller` grills
the draft. Delivery: the lead dispatches the `athan-executor` and
`athan-reviewer` workers. Every worker may call `vision` for an image it cannot
see. Nothing else, ever.

## 12. Report to the owner

Plain sentences on what changed and what was proven, the progress table, the
three-string veto table for her audit, the four-line handoff.
