# Ticket 119 - The agent CLI: the read-only set lands in ai/AGENTS.md

## Ticket 119

Lane 119 carries the option-B landing: four routing rows and one widened ban paragraph in
`ai/AGENTS.md`, nothing installed. Worktree `$HOME/athan-gitree/worktrees/lane-119`, branch
`lane/119`. The lane merges into `uat` in the main tree under `uat.lock`; the executor never
touches `uat`, the main tree, or a device.

## Planning (2026-10-16)

The frontier: the owner's option-B ruling is taken (row 119), so every planning question was
a fact or a wording choice, answered agent-ruled in PLAN.md section 2.1 (D1 to D7).

Measurements re-derived live 2026-10-16 against `uat` `d1ce39d9` (2.0.924), engine versions
`@expo/agent-cli` 1.0.19 (npm `dist-tags.latest` 1.0.19, npx cache; no repo dependency) and
`@expo/cli` 58.1.10 (`npx expo --version`):

- `--help` census: 35 command names, `stop` an alias of `dev:stop`, 34 distinct.
- `doctor`: exit 20 while any check fails; today `Checks 17/20 passed`, `Failed 3`, each
  advisory in substance (husky script conflict, app.json beside app.config.ts, the deliberate
  ahead-of-pin class: jest 30.5.2 over ~29.7.0, @types/jest 30.0.0 over 29.5.14, typescript
  7.0.2 over ~6.0.3). expo-doctor arrives via the npx cache; nothing enters package.json.
- `typecheck`: help text "Read-only... the project's own node_modules/.bin/tsc --noEmit. No
  compiler is ever fetched"; live exit 0, no type errors, 1241 ms.
- `docs:sync`/`docs:search`: cache `~/.expo/agent-cli/docs` measured 9.9M, SDK-matched
  (v58.0.0 tree); live `docs:search layoutDirection --limit 4` returned four ranked hits with
  file and line; sync downloads only changed bundles.
- `npx expo command:ps --json`: a JSON session array holding a live `expo run:ios` session in
  this repo; `command:events` replays retained events as JSONL, `--tail` follows live.
- Ban grounds from each command's own help: `--eas` starts a paid EAS Simulator session
  (smoke, dev, navigate, runtime:stop, runtime:reload); `deploy --web` is `eas deploy`, the
  native form stops at launch.expo.dev; `agents:setup` writes the governed `.agents/skills/`
  and creates or updates AGENTS.md; `skills:sync` links managed skills; `skills:clean`
  removes them; `install` writes packages and forwards `--fix` (hard-banned); `new`
  scaffolds; `feedback` is outbound; the account family acts on the shared `~/.expo`
  session; `status --explain` queries EAS; `--device` launches or binds a phone;
  `smoke --android` boots and binds a local Android device.

Break-script needles measured against today's `ai/AGENTS.md`: every new name counts 0;
`--eas`, `deploy`, `agents:setup`, `skills:sync` and `smoke --android` each count 1 today and
keep count 1 after the rewrite; the routing table holds 11 lines and becomes 15.

Plan drafted, gate next.

## Planning (2026-10-16), grill

One athan-plan-griller pass (session ses_eb9b0dec4ffebGGckdI22TYvcL), four findings, all
applied: the break script's table-count awk exited at the blank line under the heading
(fixed to count table lines first, verified 11 today and 15 on a simulated landing); the
`--device` needle spanned the contract's line wrap (split into two single-line checks);
section 3 now names the lane's pre-dispatch duty (docs commit merged to uat, lane/119
rebased, clean tree); the step's queue-row swap closes its parenthesis. The griller's
byte-level simulation of both edits against a temp copy passed every needle, and this lane
re-ran the fixed break script on its own simulation: ALL AS EXPECTED: 1, all 24 checks.

## Planning (2026-10-16), READY

The skeleton (complete plan, grilled, gate PLAN OK) landed as 5d259b2d (2.0.926, hooked:
Tests: 2 skipped, 5709 passed, 5711 total, 100% on all four measures) and merged as
fdd43a4f after one lane-weather cycle: lane 120's 2.0.925 skeleton reached uat first, the
first merge conflicted on package.json, the abort-rebase-resolve cycle kept both lanes'
rows and the higher version (2.0.926), and the one retry merged clean. The build bay's
gitignored build.gradle versionName synced to 2.0.926 under build.lock. This commit sets
READY and aligns the step's queue-row find-string with the READY cell.

Weather note: the skeleton's rebase resolution (lane 120's 2.0.925 versus this lane's
2.0.926) left a duplicate `version` key in app.json and package.json - rebase replay skips
the hook, so it reached uat inside fdd43a4f unseen; biome caught it at this commit's hook.
This commit heals both files to exactly one version key (2.0.927). The lesson matches row
120's recorded exception: after any rebase, verify the version files hold one key before
the next commit trusts them.

### Step 01 — done
Branch docs/119-agents-md-rows, commit 94ffdaa7, version 2.0.928, merge 55efc70f on lane/119.
Hook: Tests: 2 skipped, 5709 passed, 5711 total; Statements 100% (5392/5392), Branches 100%
(2324/2324), Functions 100% (1129/1129), Lines 100% (4830/4830).
Break: ALL AS EXPECTED: 1 (24 ok checks).
Review: clean on a cold read - both contracts byte-for-byte, the screenshot bullet and every
other table row untouched, only the listed files moved, message starts 2.0.928 -.
session: ses_eb9a40340ffeNBxnYk1MfifEp1

## Audit (2026-10-16)

Two reviewers (blind, plan-conformance). Blind verified every routed claim live against the
installed CLI and every parenthetical from the bundled source; one must: the executed docs
commit 46b93596 carried no version bump (2.0.928 twice, the row-120 precedent class;
history is merged, so the heal is the next commit's bump). Plan-conformance: three findings
(the stale docs-message template in PLAN.md section 8, this LOG's missing no-bump record,
and the break script's root-relative path that does not resolve from the worktree root).
All four findings confirmed and repaired on branch docs/audit-119-20261016; none rejected.
