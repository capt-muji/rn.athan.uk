# LOG.md - ticket 119

## Planning (2026-10-16)

Frontier worked agent-ruled per the standing hands-off order; decisions D119.1 to D119.6 in
PLAN.md section 2. Facts measured directly from the CLI at 1.0.19 (help surface, workflow
contract, per-command help captured under `~/athan-gitree/sessions/119/cli-help/`, 30 files,
1321 lines), the bundled source in the npx cache, and the installed `@expo/cli` 58.1.10.
Anchors verified at `1ea6ceff` 2.0.875.

## Ticket 119

Planning skeleton landed; the draft, grill, gate and READY follow.

Grill round 1 (2026-10-16): nine findings, all applied - the census arithmetic (nine
groups, 35 names, 34 distinct; `stop` an alias), the missing `help` row and the `dev:run`
relabel in the census table, typecheck's group cell, 22 skill folders at the planned sha
(not 23), the `--eas` family widened to `runtime:reload` and the `stop` alias, FINDINGS.md
committed at READY with steps refining in place, the pre-flight run-from wording,
`skills:show` struck from the allowlist (nothing to print), and the section 1 scope
sentence naming the version files. Round 2 dispatched per the more-than-five rule.

Grill round 2 (2026-10-16): eight findings - seven applied (every step's Files line and
the restore list name the three version files; the bans-table membership made decidable
from the census Verdict column; the queue-cell draft's duplicated --eas family mention
removed; FINDINGS' help-capture count corrected to 29 plus the alias with the five
uncaptured named; `doctor --json` added to the allowlist and R3.2 reworded to the parse
key's values; the installer argv quoted faithfully with the bunx note; step 1's diff
target pointed at the FINDINGS census table), one rejected on the code: the pre-flight
merge-base ref stays the local `uat` (the integration branch holding the unpushed
audited commits; origin/uat lags them, so basing the check on origin/uat would fail
every mid-flight lane) - the section 3 wording now names the local ref instead.

### Step 1 — DONE (census verified)

Branch `docs/119-1-census` off `lane/119`, commit `2.0.880`. Pre-flight `PREFLIGHT OK` run
cold from `$TMPDIR` before the branch. Live `npx --yes @expo/agent-cli@1.0.19 --help` run
in the worktree: the 35 printed command names match the FINDINGS section 1 table row for
row (six Develop, four Understand, nine Debug, one Create, one Deployment, five
Agent-setup, three Learn, one Feedback, four Account), `stop` printed as `dev:stop`'s
alias, the fallback prose naming the eleven Expo CLI commands. FINDINGS section 1 opens
with the verification paragraph. Queue row set IN PROGRESS, step 1. The LOG entry rode the
amend (sequencing slip: the entry was written after the commit started; the commit was
still unmerged).
session: lane-119 in-lane execution (D119.6; no executor worker dispatched)

### Step 2 — DONE (source pins verified)

Branch `docs/119-2-source-pins` off `lane/119` at `d8fab58e`, commit `2.0.881`. Every pin
greps back from the npx cache at its cited line, run as a script: 2461.index.js:1352
(`id: 'opencode'`), :1354 (`skillsDir: '.agents/skills'`); 271.index.js:620 (the managed
block marker), :632 (the redirect sentence), :643 (`install --fix`), :644 (`lint`), :654
(`deploy web and native`), :145 (`function buildInstallerPlans`); 5565.index.js:316-321
(the doctor fallback comment), :322 (`resolveTypeScriptCli`), :307 (`TSC_ARGS`). The
detector paragraph and the installer list item de-duplicated against the pins. Queue row
set IN PROGRESS, step 2. The FINDINGS section 2 pins and the section-1 verification
paragraph both refined in place per the READY-commit rule.
session: lane-119 in-lane execution (D119.6; no executor worker dispatched)

### Step 3 — DONE (live read-only runs recorded)

Branch `docs/119-3-live-runs` off `lane/119` at `189a870e`, commit `2.0.882`. The seven
allowlist commands run in the worktree: status 0 (the project/freshness/dev server/auth/
next lines), doctor --json 20 (parse full, 16 of 20, expo-doctor v1.21.4 fetched per run,
the four failures recorded with the ahead-of-pin class named), typecheck 0 (no type
errors, 738ms), skills:list 0 (no package skills), docs:search widget 0 (auto-sync 9.9M
into ~/.expo/agent-cli/docs, ranked hits with file and line), expo command:ps 0 (the TSV
header and cross-lane session rows), expo command:events --help 0 (the JSONL replay
line). FINDINGS section 3 carries the table. Queue row set IN PROGRESS, step 3.
session: lane-119 in-lane execution (D119.6; no executor worker dispatched)

### Step 4 — DONE (the ruling pack)

Branch `docs/119-4-ruling-pack` off `lane/119` at `ae253cea`, commit `2.0.883`. FINDINGS
section 4 written: the three options with option B recommended, the bans table (every
census Verdict beginning `stays out` or `banned` plus the banned sub-forms, each with its
measured one-line ground), the unverified list (the bundled eas-cli version, the
whole-CLI experimental label), and the four-row routing delta option B amounts to. The
queue row set EXECUTED with the outcome text. R4.1 holds: the row carries the options,
the recommendation, the bans with grounds, and the unverified list.
session: lane-119 in-lane execution (D119.6; no executor worker dispatched)
