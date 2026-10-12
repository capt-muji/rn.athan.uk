# AUDIT — job 56 (ticket board)

Range: `origin/uat..uat` through `07abfd07` (2.0.72 to 2.0.80), diff at
`$TMPDIR/audit-56.diff` (865 lines, 11 files, ai/plans excluded). Reviewers:
one plan-conformance, one blind, dispatched in parallel. No third pass: the job
touches no notifications, data or schedule logic.

Every finding below was adjudicated by the lead against the code; the fix
commit carries the confirmed ones.

## Plan-conformance findings

| # | Finding | Verdict |
| --- | --- | --- |
| C1 | `reader.mjs` `stepWeight` matches the unpadded step number (`1-`) against zero-padded filenames (`01-`), so every served `steps[].weight` is the default 1; R2.2 requires the declared 1,2,2,2,2,1 | Confirmed (`board.json` measured all 1). Fixed: padded prefix also matched; green assertion added |
| C2 | `index.html` hardcodes `STALE_MS = 30000`; R6.4 and the schema define stale as twice `reconcileMs` | Confirmed. Fixed: computed from `board.reconcileMs * 2`, constant deleted |
| C3 | `rollupEl`'s `children.length === 0` branch is unreachable (siblings always contain the ticket) | Confirmed. Fixed: branch deleted |
| C4 | A Blocked ticket with no unmet needs renders "blocked on " dangling | Confirmed. Fixed: suffix only when the unmet list is non-empty |

## Blind findings

| # | Finding | Verdict |
| --- | --- | --- |
| B1 | Compose hardcodes the container port 8788 in both mapping sides while the command passes no `--port`, so a per-project port change breaks silently | Confirmed. Fixed: `--port ${BOARD_PORT:-8788}` in the command, both mapping sides follow `BOARD_PORT` |
| B2 | The README quick start never sets `OPENCODE_DIR`, so `/var/empty` mounts and `activeNow` can never light on the documented command | Confirmed. Fixed: `OPENCODE_DIR="$HOME/.local/share/opencode"` in the command; the env sentence names both variables |
| B3 | The executor agent file says "the ticket board parses both" the step heading and the session line; the reader parses only `session:` lines | Confirmed (`parseLogSessions` matches `^session: ` only; step states come from the PLAN.md checklist). Fixed: sentence now names the session line. TEMPLATE.md's contract line makes no parsing claim and stands |
| B4 | Done column shows the five highest-order DONE rows, not the five most recent | Rejected: the plan's settled mechanics elect "the 5 highest-order DONE rows"; the conformance reviewer verified 57/55/53/52/50 as correct against that rule |
| B5 | Dead branch (see C3, fixed) plus: DONE children outside the top-5 undercount the parent rollup | First half fixed with C3. Second half confirmed latent: no parent row exists in the queue, the fix needs schema fields beyond pinned version 1. Deferred to a board iteration row |
| B6 | `stepWeight` and the `n`/`weight` fields are never rendered; delete them | Rejected: R2.2 mandates the Weight derivation and schema v1 carries `weight`; the defect was the value (C1), not the field |
| B7 | First-table CANCELLED/SUPERSEDED rows sit in neither `doneOrders` nor the open-row lookup, so a need naming one reads unmet forever, contradicting the comment at reader `:325` | Confirmed by trace (`isMet` falls through both branches). Fixed: first-table closed rows feed a settled set that satisfies needs; `doneCount` stays pure DONE. No live row needs a retired row; red proof on a scratch queue |
| B8 | `generatedAt` changes every reconcile, so the server's byte comparison never spares a push; every open page refetches each 15 s | Confirmed as behavior, deferred: the plan's own interaction text says push on byte difference, R5.1 reads literally the same, the page shows no flicker, and the 60-line cap (exactly 60 today) leaves no room. Board iteration row |
| B9 | No compose restart policy, reader stdio ignored, no startup log | Deferred: the compose file is byte-pinned by the step 4 contract and the board is a dev tool started by hand; a crash is visible as a dead container. Board iteration row |
| B10 | No Host header check, so DNS rebinding could read `/board.json` | Deferred: localhost-only dev surface carrying no secrets, and the 60-line cap blocks a cheap add. Board iteration row |

## Fixes

One branch `fix/audit-56`, one version 2.0.81, one commit. Red checks recorded
before the change, green after: the C1 weight assertion (failed all-1, passed
1,2,2,2,2,1), the B7 scratch-queue proof (need on a first-table CANCELLED row
read unmet, then met), and the grep reds for the wiring and text fixes.
