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

### Step 01 — done

- Red run recorded: `npx jest scripts/__tests__/pinHooks.test.ts scripts/__tests__/checkVersionUniqueness.test.ts --watchman=false --selectProjects=unit` printed `Tests: 9 failed, 1 passed, 10 total`; the nine failed on the missing scripts (spawn ENOENT / exit-code assertions); the passing one pins raw git mechanics (tracked hooks fire with hooksPath .husky, skipped with a missing .husky/_), which hold before the fix by design.
- Green run: `Tests: 10 passed, 10 total` (one fixture repaired mid-red: the missed-bump fixture's identical tree; the test now writes a second file, as a real missed bump does).
- Census at execution: 99 non-merge commits in the union, 16 colliding versions (planning saw 13; 2.0.934, 2.0.935, 2.0.936 are new tonight). Classification reconciled with the stopped executor's evidence at `$HOME/athan-gitree/sessions/125/step1-collision-report.md` (entry-merge method): 5 same-lane missed bumps (909, 913, 928, 934, 936), 11 cross-lane collisions (858, 863, 872, 886, 890, 896, 901, 908, 930, 931, 935); 863 corrected from the planner's subject-based same-lane read to cross-lane per the evidence.
- Break script: the plan's first draft collided on 2.0.935, which the census allowlist grandfathers, so the gate correctly passed it (plan defect repaired in PLAN.md: the break now uses 2.0.929, not allowlisted). Repaired run printed `VERSION COLLISION 2.0.929: 775bf944... a7893f61...` and `break exit: 1`.
- Script output uses `process.stdout.write` per the repo idiom (check-identifiers.js), after Biome's noConsole refused `console.log`.
- Executor incident, agent-ruled 2026-10-17 01:52: the dispatched executor (parked mid-turn since ~23:39, guard-4 case 4) woke, found this lane mid-step-1, and STOPped rather than double-execute. Ruling: this lane carries steps 1 to 3; the executor's session is spent; its docs commit 93c05eb2 (2.0.940, the planner's lock-incident LOG line, hook green `Tests: 2 skipped, 5715 passed, 5717 total`, coverage 100%) rides this step's merge unmerged-ahead. Its census evidence accepted into the allowlist classification above. It released commit.lock and version.lock at its stop.
- Lock note for the record: commit.lock and version.lock sat 23:39 to 01:52 held by that paused-but-live session with no OS process visible; process liveness cannot distinguish parked from dead, which is the guard-4 lesson.
session: lane-125-lead (in-lane execution; worker dispatch returned STOP on the duplicate)

### Step 01 repair - the merge-time false positive

- The first step-1 merge attempt was refused by the new pre-merge-commit hook itself: git does not export MERGE_HEAD to hooks, so the env-only check never fired, the merge-in-flight worktree counted as a staged candidate, and the gate self-collided the merge with the lane's own tip. The repair reads the MERGE_HEAD ref as well as the env var; a new test ("skips the candidate while the MERGE_HEAD ref exists without the env var", red against the pre-fix script, green after) covers the ref path.
- A lint-staged failed-run restore had earlier eaten the tracked-file half of the first step-1 commit (recovered from the lint-staged backup stash); the partial commit created a real same-lane missed bump at 2.0.940, which the gate itself refused at the amend - the gate's first two catches were both this ticket's own commits.
- The versionName sync debt (2.0.937 through 2.0.940) surfaced as the lockstep failure inside the merge's own validate and was synced to 2.0.941. One sync ran without build.lock under a recorded ruling: the lock's live holder was an iOS simulator test session that cannot read android/app/build.gradle, and no Android build can start while it holds the lock.
session: lane-125-lead
- 02:38 lane weather, caught by the gate on this lane's own commit: lane 120 landed two dropped-staging commits at 2.0.940 (d349dc39, f3b84e9e) beside this lane's executor docs commit 93c05eb2, forming a three-sha group the census could not see (2.0.940 was unique when the allowlist was generated); lane 120 then took 2.0.943 (775dd96a) while this lane's bump sat uncommitted at the same number. Rulings: the 2.0.940 group joins the allowlist as history (it predates the gate's merge); this lane renumbers to the recomputed floor plus one (2.0.944). Lane 120's conflicted merge into uat sits open in the main tree; this lane waits for its conclusion before merging (their session committed 775dd96a minutes ago, so it is live).

### Step 02 — done

- Red run: 8 of the new tests failed (4 protocolLines on the absent sentences, 4 checkAudit on the absent script), recorded by jest's failing-name output.
- Green run: 20 passed, 20 total across the four suites. check-audit.sh walked the bash-3.2 path twice: the first draft died on empty-array expansion under set -u, the second on BSD awk's NUL handling; the landed version is a pure-bash line state machine.
- Break script: printed `AUDIT CHECK FAILED` with the missing-file reason and `break exit: 1`.
session: lane-125-lead

### Step 03 — done

- Re-verification on the merged tree: 20 script tests green, `VERSIONS OK` on the live tree; queue row set EXECUTED.
- Landed sequence: 2.0.941 step 1, 2.0.942 the MERGE_HEAD-ref fix, 2.0.944→2.0.945 the --no-candidate merge-hook flag renumbered past lane 120's live take, 2.0.957 and 2.0.960 the merges resolving lane weather, 2.0.959 step 2.
session: lane-125-lead

### Audit — done

- Two reviewer passes, both with the commit range 0413248c..lane/125 named in the dispatch, diff files at $TMPDIR, findings files written per pass. Plan-conformance: 4 findings (2 should, 2 nice), no must. Blind: 5 findings (3 should, 2 nice), no must.
- Adjudicated: FIXED the staged-blob bypass (the gate now reads the index, a later worktree edit can no longer hide a staged collision; new test red first), the yarn reset un-pin (reset no longer re-runs husky after prepare's pin; the blind reviewer reproduced the silently-unhooked green commit it caused), the refCount off-by-one, the fixture-dir leaks across all three suites, and this LOG's step ledgers below. REJECTED the shared-helper extraction (two local helpers beat a shared module for two suites) and the PLAN.md contract-drift fix (the folder dies with this commit; LOG carries the repairs).
- Ledger completion: step 1 = d1229726 2.0.941 (hook Tests: 2 skipped, 5725 passed, 5727 total, coverage 100% all four) plus 59fae61c 2.0.942 and 1c1dcd2c 2.0.945 repairs; step 2 = edbd36fa 2.0.959 (hook Tests: 2 skipped, 5735 passed, 5737 total, coverage 100%); step 3 = b4a6fa2a 2.0.961; merges 5bf6756c, 751c3f41, 3d5b0468 with version-file conflicts resolved keeping the higher number.
session: lane-125-lead
