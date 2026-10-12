# Ticket 62: Help answers flow as one paragraph in every language

| Field | Value |
| --- | --- |
| Brief | Queue row 62, owner ask 2026-10-12 |
| Planned at | uat `2670e596`, version 2.0.105, 2026-10-12 |
| Planned by | Planning session 2026-10-12 (owner away; her queue text is the ruling) |
| Needs first | 39 (DONE) |
| Parent | none |
| Group | i18n catalogs (row 63 touches the same catalog files when it plans; same-group rows serialize) |
| Batch budget | 2 |
| Session budget | 2 |
| Steps count | 1 |
| Device | none |
| Owner decisions still needed | none: her ask names the exact edit |

Resume from: execution, step 1. The grill's eleven findings are applied
(anchor names, the pinned literals in `i18n.test.ts`, dist is gitignored,
exact command outputs); the plan is READY.

## 1. Goal

The two multi-sentence help answers are broken into two lines with a literal
`\n`, a layout decision made for English alone. Six languages later the break
sits mid-thought in scripts that wrap differently. The owner's ruling
(2026-10-12): remove the specific breaks and let the width wrap naturally.

DONE when the two named values in every catalog carry no `\n` and join with
one space, the pinned literals in `i18n.test.ts` match, the catalog lock is
re-taken against the edited English, and every dist round trip passes
(dist is gitignored pipeline output, verified by `i18n:import`).

## 2. Decisions

### 2.1 Taken

| ID | What | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D74 | Remove the hard breaks; the view wraps. The queue text is the specification: "Remove the specific breaks and let the width wrap naturally." | owner | 2026-10-12 | queue row 62 |
| D75 | Exactly two keys change: `help.a.stopAfterRestart` and `help.a.cutoff`, in all six catalogs. Nothing else in the catalogs changes, so no translation verification is owed (D42 applies to new copy, not to joining two lines of already-verified copy). | planning | 2026-10-12 | this section |
| D76 | The join is one space in every language, including Thai, where a space between clauses is standard typography. | planning | 2026-10-12 | this section |

### 2.2 The executor must not decide

- Any other catalog value. Twelve values change, all named by key.
- Skipping the lock re-take or the dist regeneration: both are step commands
  with expected outputs.

## 3. Pre-flight

`scripts/preflight-62.sh`: uat checkout, clean tree, origin merged, version at
or above the Planned at, row 39 DONE, the twelve catalog anchors each count 1.
Ends `PREFLIGHT OK`.

## 4. Background the executor needs

### Code map

| File | Role |
| --- | --- |
| `shared/i18n/en.ts` | Source catalog. Lines 54-55 (`help.a.stopAfterRestart`, wrapped literal) and 70 (`help.a.cutoff`). |
| `shared/i18n/{ar,ms,so,hi,th}.ts` | The same two keys per file, each carrying `\n`. |
| `shared/__tests__/help.test.ts` | Logic suite over help content; gains the red test. Pins no `\n` today. |
| `shared/__tests__/catalogLock.test.ts` | D49: hashes the landed English catalog against `shared/i18n/catalog-lock.json` per locale. An English edit without a lock re-take fails here. |
| `scripts/catalog-lock.mjs` | `yarn i18n:lock` re-writes the lock. |
| `scripts/i18n-export.mjs` / `shared/__tests__/i18nBridge.test.ts` | `I18N_LOCALE=<id> yarn i18n:export` writes `shared/i18n/dist/<id>.json` from the landed catalog. Bare mode gates parity only, so dist regeneration is hygiene, not a gate. |
| `components/modals/Help.tsx` | Renders the values. No component change: without `\n` the Text wraps at the view width. `components/modals/__tests__/Help.test.tsx:125` matches a substring that survives the join. |

### Why the obvious variant is wrong

Keeping the break in English and removing it elsewhere: the owner's rule is
"the width wraps naturally", with no language singled out; a per-language
break policy is exactly what she retired.

## 5. Design

One mechanical edit, twelve values, one space join. Invariant: the two
named values carry no `\n` in any of the six catalogs, asserted by the new
test across all of them.

Concurrency trace: none. Catalog edits are static data; no runtime path
changes.

**Acceptance criteria:**

- [R1.1] WHEN any of the six catalogs is read THE SYSTEM SHALL carry no hard line break inside `help.a.stopAfterRestart` or `help.a.cutoff`

## 6. Steps

- [ ] Step 1: the twelve joins, the red test, the lock, the dist (`steps/1-join-values.md`)

## 7. Device proof

None. The change is catalog data; the suites and the bridge cover it. The
rendered face changes only in that two answers wrap at the view width instead
of breaking at a fixed point, which is the owner's stated want.

## 8. Records

LOG.md entry under `### Step 01 — done`: branch, commit sha, version, the
hook's `Tests:` line and coverage lines, the red failure line verbatim, the
break script's last line, review verdict, merge sha, each ending with the
`session:` line.

Queue cell text the lead applies on DONE:

`DONE <date>, audited: the two multi-sentence help answers flow as one paragraph in all six languages (the owner's 2026-10-12 ruling), catalog lock re-taken, dist regenerated; no other value changed`

Docs commit message: `<VERSION> - docs(plans): ticket 62 executed: 1 step, help breaks joined`

## 9. Push

None. The executor never pushes. The lead pushes after review.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| The red test passes on pristine code | It guards nothing | `STOP:` with output |
| `catalogLock.test` fails after the edit | The lock was not re-taken | Run `yarn i18n:lock`, add the lock file |
| A `dist/<id>.json` differs from its catalog | The export for that locale was skipped | Re-run `I18N_LOCALE=<id> yarn i18n:export` |
| Any test pins the old two-line strings | An unlisted consumer | `STOP:` with the assertion |

Anticipated review fixes, word for word:

- "Also strip `\n` from other keys" - rejected: D75 names the two keys the
  owner's report covers; other keys are not help answers.

## 11. Subagents

Planning: codegraph reads, no worktree proof needed (pure data edit whose red
test mirrors an existing suite's shape). Delivery: one `athan-executor`
dispatch (session budget 2), then `athan-reviewer` blind and plan-conformance
for the audit.

## 12. Report to the owner

Two help answers now wrap naturally in every language; nothing else moved.
The progress table, then the four-line handoff.
