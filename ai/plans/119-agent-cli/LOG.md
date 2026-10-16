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
