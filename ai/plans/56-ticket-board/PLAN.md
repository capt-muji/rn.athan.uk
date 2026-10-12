# Job 56: Ticket board, a read-only local mirror of the queue and its runs

Resume from: skeleton. Interview round 1 not yet asked. Facts gathered (2026-10-12):
oc-handoff `contextPct(watermark, window)` at `~/.config/opencode/plugins/oc-handoff/lib.js:163`,
cache `.local-handoffs/` (index.json array entries `{file, title, sourceSession, updatedMs, status}`,
doc frontmatter `context_pct`, `watermark_tokens`, `source_session`); `session_v2` in
`~/.local/share/opencode/opencode.db` (id, parent_id, directory, title, agent, time_created,
time_updated, tokens_*) readable read-only through `node:sqlite` (node 24.14.1, ExperimentalWarning
only); LOG.md de-facto step headings `### Step NN — …` under `## Job N` (job 55 LOG.md, git
history); coverage gate `scripts/check-changed-coverage.js` UNMEASURED list; biome
`files.includes` negations; `.local-handoffs/.gitignore` self-ignore pattern; docker 29.4.0 and
compose v5.1.2 installed; LOG format not contractually pinned anywhere.

| Field | Value |
| --- | --- |
| Brief | `ai/plans/README.md` row 56 (the queue cell is the brief; fully decided 2026-10-10, amended three rulings, trajectory ruled) |
| Planned at | (set at finish: the `uat` sha the anchors were verified against) |
| Planned by | planning session 2026-10-12 |
| Needs first | nothing |
| Parent | none |
| Group | none (board/ and repo-tooling files disjoint from every other open row) |
| Batch budget | (set when steps are drafted) |
| Session budget | (set when steps are drafted) |
| Steps count | (set when steps are drafted) |
| Device | none: the proof is local node, docker compose and a browser, never a phone |
| Owner decisions still needed | round 1: board code location; gates regime; README target; LOG contract pin |

## 1. Goal

What is wrong today: the queue is a markdown table the owner reads as text; run state (which step
is running, how far a session got, context pressure) lives in LOG.md files, git history and the
opencode database, visible only by opening each one.

What is true when DONE: one local web board mirrors the queue and its runs live, read-only, from
committed state plus machine-local caches, per the design and rulings recorded in row 56.

## 2. Decisions

### 2.1 Taken

Recorded in the queue row 56 (2026-10-10, the owner): the whole elected design (A5 stripped dark,
columns, card template, pills, needs chips, parent rollup, dotted group border, blocked order
list, 390px phone page), the three amended rulings (platform tag computed by the reader, "Run
order" dependency list, two-in-flight hero cards), determinism rules (reconciling timer, full
recompute, idempotent, staleness stamp, `yarn validate` gates nothing), portability rules
(per-project config, unmapped-status bucket, machine-local state isolation), deploy shape
(reader + self-contained HTML + under-60-line Node-stdlib SSE server + one pinned
`node:24-alpine` compose service, board directory mounted read-only, no database, no editing, no
drag, no token), and the trajectory (board iterations are queue rows; no separate board skill
until a second project adopts it).

### 2.2 The executor must not decide

(set during drafting)

## 3. Pre-flight

(scripts/preflight-56.sh, written during drafting)

## 4. Background the executor needs

(code map, anchors, written during drafting)

## 5. Design

(written during drafting)

## 6. Steps

(written during drafting)

## 7. Device proof

None: no phone work in this job. The proof section covers local node, compose and browser checks
instead.

## 8. Records

(written during drafting)

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

(written during drafting)

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller` grills the draft.
Delivery: the lead dispatches the `athan-executor` and `athan-reviewer` workers. Nothing else.

## 12. Report to the owner

(written during drafting)
