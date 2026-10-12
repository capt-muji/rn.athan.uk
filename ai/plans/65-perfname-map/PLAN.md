# Ticket 65: perfName remnants, the investigation

| Field | Value |
| --- | --- |
| Brief | Queue row 65, owner ask 2026-10-12: investigation only, no code changes in this row |
| Planned at | PENDING (skeleton) |
| Planned by | Planning session 2026-10-12 (owner away; her questions are the brief) |
| Needs first | nothing |
| Parent | none |
| Group | none: produces findings only, touches no code |
| Batch budget | 3 |
| Session budget | 3 |
| Steps count | 3 |
| Device | none |
| Owner decisions still needed | none: the row ends with options and a recommendation; the owner rules on reading |

Resume from: skeleton. The reader surface is already mapped in outline:
`shared/perf.ts` (the gate and the marks), `Sheet.tsx` (the wiring), five
sheet screens and two sheet parts (the prop), `stores/ui.ts` (present marks),
`components/overlay` (one test hit). `e2e/` and `scripts/` grep clean for
`perfName`, which already answers half the load-bearing question.

## 1. Goal

The owner asks why `perfName={SHEET_PERF_NAME}` props remain across sheets
after the performance-era cleanup, suspects they are load-bearing for e2e,
and wants: every reader mapped, what breaks if they are removed, and whether
removal is worth its own job. No code changes in this row.

DONE when `FINDINGS.md` in this folder answers all three with file:line
evidence, the removal probe has run in a throwaway worktree, and the
recommendation states its terms.

## 2. Decisions

### 2.1 Taken

| ID | What | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D80 | The probe is a detached worktree deleted before the step merges; `uat` never carries probe code. | planning | 2026-10-12 | this section |
| D81 | The row ends with a recommendation, not a removal. The owner rules on reading (the queue row's own text). | planning | 2026-10-12 | queue row 65 |

### 2.2 The executor must not decide

- Removing anything on `uat`. The row is investigation only.
- Recommending without the probe's evidence: the recommendation cites
  FINDINGS.md sections by number.

## 3. Pre-flight

`scripts/preflight-65.sh`: uat checkout, clean tree, origin merged, version at
or above Planned at, the plan's anchors each count 1. Ends `PREFLIGHT OK`.

## 4. Background the executor needs

| File | Role |
| --- | --- |
| `shared/perf.ts` | The machinery: `PERF_ENABLED` gate (`process.env.EXPO_PUBLIC_PERF_MONITOR === '1'` and not prod), `perfMark`, `perfMeasure`, `initPerfMonitor`. |
| `components/sheets/parts/Sheet.tsx` | The wiring: the `perfName` prop, `handleChange`/`handleAnimate` marks and measures. |
| `components/sheets/screens/{Settings,Sound,Alert,Language,Qibla}.tsx`, `components/sheets/parts/{SoundItem,LabeledToggle}.tsx` | The prop's call sites. |
| `stores/ui.ts:177-227` | `perfMark('sheet_*_present')` on each present path. |
| `e2e/`, `scripts/` | Grep clean for `perfName` (planning fact, 2026-10-12); the probe re-verifies against the marks themselves. |
| `components/overlay/__tests__/Overlay.test.tsx` | The one test hit outside sheets; the probe checks what it asserts. |

## 5. Design

Three investigation steps, each writing its section into FINDINGS.md as it
lands. Invariant: `uat` diff for the whole ticket is docs only.

**Acceptance criteria:**

- [R1.1] WHEN the reader inventory lands THE SYSTEM SHALL record every `perfName`, `perfMark` and `perfMeasure` reader with its file, line and role in FINDINGS.md section 1
- [R2.1] WHEN the removal probe ends THE SYSTEM SHALL record in FINDINGS.md section 2 what fails with the machinery deleted, and what does not, each claim naming the test or script that proved it
- [R3.1] WHEN the recommendation lands THE SYSTEM SHALL state in FINDINGS.md section 3 whether removal is worth its own ticket, with its cost, its risk and the evidence sections it rests on

## 6. Steps

- [ ] Step 1: the reader inventory (`steps/1-inventory.md`)
- [ ] Step 2: the removal probe (`steps/2-probe.md`)
- [ ] Step 3: the recommendation (`steps/3-recommendation.md`)

## 7. Device proof

None. The investigation is static analysis plus suites in a worktree.

## 8. Records

LOG.md entries under `### Step 0N — done` for each step, the standard fields
adapted to docs steps (no red tests; the "red" is FINDINGS.md absent before
the step), each ending with the `session:` line.

Queue cell text the lead applies on DONE:

`DONE <date>, audited: the perfName investigation answers the owner's three questions in FINDINGS.md (summarise in one line: reader count, what breaks, the recommendation); no code changed`

Docs commit message: `<VERSION> - docs(plans): ticket 65 executed: 3 steps, perfName mapped and judged`

## 9. Push

None. The executor never pushes. The lead pushes after review.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| The probe worktree will not build | Detached HEAD without node_modules | Symlink the repo's node_modules, as planning did |
- A probe finding that contradicts section 1 | The inventory missed a reader | Correct section 1 in the same step, recording both

Anticipated review fixes, word for word:

- "Delete the machinery now" - rejected: D81, the row is investigation only.

## 11. Subagents

Planning: codegraph reads and greps. Delivery: one `athan-executor` dispatch
(weight 3 total, one session), then `athan-reviewer` blind and
plan-conformance on the findings' accuracy.

## 12. Report to the owner

One paragraph: how many readers, what actually breaks, whether a removal job
is worth it. The progress table, then the four-line handoff.
