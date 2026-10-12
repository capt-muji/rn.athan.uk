# Ticket 65: perfName remnants, the investigation

| Field | Value |
| --- | --- |
| Brief | Queue row 65, owner ask 2026-10-12: investigation only, no code changes in this row |
| Planned at | uat `2670e596`, version 2.0.105, 2026-10-12 |
| Planned by | Planning session 2026-10-12 (owner away; her questions are the brief) |
| Needs first | nothing |
| Parent | none |
| Group | none: produces findings only, touches no code |
| Batch budget | 3 |
| Session budget | 3 |
| Steps count | 3 |
| Device | none |
| Owner decisions still needed | none: the row ends with options and a recommendation; the owner rules on reading |

Resume from: skeleton. The grill's first round (13 findings) rewrote the
reader map: the machinery spans 24 non-test files (30 grep files minus 6 test suites), and no export of
`shared/perf.ts` is droppable, so the probe deletes the sheet wiring only.
Section 4 is authoritative over any earlier outline.

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
| D82 | FINDINGS.md is the ticket's only deliverable and dies with the folder: at DONE the lead folds its reader-table summary and its recommendation into the ticket's final queue cell, so any follow-up row carries the findings without the file. | planning | 2026-10-12 | this section |

### 2.2 The executor must not decide

- Removing anything on `uat`. The row is investigation only.
- Recommending without the probe's evidence: the recommendation cites
  FINDINGS.md sections by number.

## 3. Pre-flight

`scripts/preflight-65.sh`: uat checkout, clean tree, origin merged, version at
or above Planned at, the plan's anchors each count 1. Ends `PREFLIGHT OK`.

## 4. Background the executor needs

The machinery spans 24 non-test files (the six greps list 30 files, 6 of
them test suites; planning's grep at `2670e596`, re-proved by step 1). No export of `shared/perf.ts` is droppable: the app
root, the countdown, notifications, the overlay, bootstrap and the i18n
loader all call the marks. The owner's question is the sheet remnant, so the
probe removes the sheet wiring only.

| Group | Files | Role |
| --- | --- | --- |
| Machinery | `shared/perf.ts` | The gate (`PERF_ENABLED`), `perfMark`, `perfMeasure`, `initPerfMonitor`, the background flush. Untouched by the probe: callers exist outside sheets. |
| Machinery tests | `shared/__tests__/perf.test.ts`, `shared/__tests__/perfBackgroundFlush.test.ts`, `shared/__mocks__/react-native-performance.ts` | The suites and the mock pinning the machinery. |
| App-root marks | `app/index.tsx`, `app/_layout.tsx` (`initPerfMonitor`), `app/Navigation.tsx` | Launch and navigation marks. |
| Sheet wiring | `components/sheets/parts/Sheet.tsx` | The `perfName` prop and its `handleChange`/`handleAnimate` marks and measures. |
| Sheet call sites | `components/sheets/screens/{Settings,Sound,Alert,Language,Qibla}.tsx` | The `perfName={...}` props (`SHEET_PERF_NAME` in four screens, `SETTINGS_PERF_NAME` in Settings). |
| Sheet-part tap marks | `components/sheets/parts/{SoundItem,LabeledToggle}.tsx` | `perfMark` calls on row taps; neither takes a `perfName` prop. |
| Non-sheet marks | `components/overlay/Overlay.tsx`, `stores/{countdown,notifications,overlay,ui,bootstrap}.ts`, `hooks/useNotification.ts`, `shared/i18n/loader.ts` | Runtime marks outside the sheets. |
| The observers | `components/sheets/parts/__tests__/Sheet.test.tsx:208-254`, `LabeledToggle.test.tsx:60`, `SoundItem.test.tsx:92,100`, `components/overlay/__tests__/Overlay.test.tsx:152-156` | The four suites asserting the sheet marks, the tap marks and the overlay measure. |
| Baseline data | `e2e/baselines/android-3t.json` | Seven `sheet_*` measure keys (medians and notes): mark-name data, orphaned if the measures die. |
| Scripts and docs | `e2e/scripts/baseline-compare.sh:6,39`, `e2e/README.md:43`, `scripts/scan-strings.mjs:23` | The gate's env usages; scan-strings lists the symbol names in a `NON_DISPLAY_CALLEES` regex and never calls them (a non-caller). |

## 5. Design

Three investigation steps, each writing its section into FINDINGS.md as it
lands. Invariant: `uat` diff for the whole ticket is docs only.

Alternatives rejected: deleting the machinery in the probe (no export is
droppable; the failures would be unrelated noise); probing on `uat` (D80,
`uat` never carries probe code).

**Acceptance criteria:**

- [R1.1] WHEN the reader inventory lands THE SYSTEM SHALL record every `perfName`, `perfMark`, `perfMeasure`, `initPerfMonitor` and `EXPO_PUBLIC_PERF_MONITOR` reader with its file, line and role in FINDINGS.md section 1, including the e2e flows and the frame and baseline scripts
- [R2.1] WHEN the removal probe ends THE SYSTEM SHALL record in FINDINGS.md section 2 what fails with the sheet wiring deleted (the `perfName` prop, its marks and measures, the present marks, and the sheet-part tap marks), and what does not, each claim naming the test or script that proved it
- [R3.1] WHEN the recommendation lands THE SYSTEM SHALL state in FINDINGS.md section 3 whether removal is worth its own ticket, with its cost, its risk and the evidence sections it rests on

## 6. Steps

- [x] Step 1: the reader inventory (`steps/1-inventory.md`)
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
