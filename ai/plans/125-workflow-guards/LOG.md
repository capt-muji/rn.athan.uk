# LOG.md - ticket 125

## Planning (2026-10-16)

## Ticket 125

- Worktree `$HOME/athan-gitree/worktrees/lane-125`, branch `lane/125`, base `455571f8` (2.0.937).
- No sibling session live on this ticket: no prior plan folder, no prior lane branch, row read NOT PLANNED before this session.
- Defects re-derived from git before any mechanism was chosen (PLAN.md section 1):
  - unhooked sequence proven by commit/merge timestamps (d5e981fc 19:14:26 vs merge 94aa4df9 19:14:29; hook takes 3-4 min);
  - 13 collision groups enumerated over origin/uat..(uat + local branches except main), content-read from app.json (messages proven lying);
  - reviewer diff-file incident from the queue row and the 595efc22 prose fix;
  - parked-lane class: uat.lock observed held then released during planning; no session died holding it tonight on this machine.
- Frontier argued and recorded in PLAN.md section 2 (D125.1 to D125.12).
- Sibling surfaces untouched: e2e/README.md, ai/UPSTREAM-PRS.md, SDK58-PROGRAMME.md, both phones.
- floor at skeleton: 2.0.937 (uat tip) -> skeleton commit 2.0.938.
- 23:37 lock incident (guard-4 class, live case 3 tonight): uat.lock held since 23:01 with no merge in flight (no MERGE_HEAD, no git process, main-tree tip frozen at ad92825f for 33 min); build.lock recycled 23:28 and device lock taken 23:34 by a live sibling on the XS. The stale uat.lock was removed by this lane after process-level liveness checks, held for one 30-second merge, released. Recorded for the run reply.
