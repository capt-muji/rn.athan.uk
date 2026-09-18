# Execution log: Session 13

## AUTONOMOUS RULINGS (executor; owner away for the whole run)

1. **Worktree isolation for reviewers is a harness mapping here.** The plan names a
   `Code Reviewer` subagent with isolation `worktree`; this harness offers no agent of that
   name (the `general` agent given the plan's prompt IS the Code Reviewer, as PLAN section 11
   already rules) and its subagent tool has no isolation parameter. The reviewer's prompt
   begins `git checkout --detach <sha>` on the exact commit under review, which is the branch
   tip at review time, so the detach is a no-op on content; the executor restores its branch
   (`git checkout <branch>` or the merge's `git checkout uat-2`) immediately after each
   verdict. No reviewer disturbed the tree; each left `git status --porcelain` empty.

## Step 1: agent-cli findings — branch `docs/agent-cli-findings`

- Commit `9836dac5`, version `1.27.236` (from 1.27.235; `android/app/build.gradle`
  versionName set to match, gitignored, never added).
- Pre-flight: `PREFLIGHT OK` at version 1.27.235; row marked IN PROGRESS (committed here).
- `status` log `~/athan-device-sweep/session13/agent-cli-status.txt` ends `EXIT:0`; all four
  fixed lines exact; varying lines in accepted forms (`freshness` no-recorded-build wording,
  `dev server not running (http://127.0.0.1:8081)`, `device android 8f7ada76`,
  `next dev-client-stale` wording).
- `smoke --ios` log `agent-cli-smoke.txt` ends `EXIT:0`: `smoke passed`, took 394.6s; build
  line is the "Building the ios development build first" form; phases all `ok` (incl.
  `start-dev-server` and `install-app`) except accepted skips `reload` and `route` with named
  reasons; screenshot under `.expo/agent-cli/`; no `--eas` suggestion anywhere.
- FINDINGS created from the step template; `grep -c '```'` = 4; tsc initially failed with the
  plan-predicted `position: "fixed"` errors in the five named files (smoke's Expo run
  regenerated `expo-env.d.ts`), fixed per PLAN section 10 with `rm -f expo-env.d.ts`; tsc and
  Biome then exit 0.
- Breaks `breaks-13-1.sh`: four `caught:`, `caught=4 missed=0`, `ALL AS EXPECTED: 1`.
- Hook: `Tests:       4534 passed, 4534 total`; coverage lines `Statements/Branches/Functions/Lines` all `100%`.
- Review: Code Reviewer (GLM 5.3), 1 round, verdict **merge** (outputs verified byte-identical
  against the two logs).
- Merge `76b5b9d9` into `uat-2` (`--no-ff`, reviewed).

## Step 2: dev-launcher URL proof — branch `docs/devlauncher-url-proof`

### AUTONOMOUS RULING 2: the preference reset runs as `plutil -remove` on the app's plist

The plan's reset (three `xcrun simctl spawn $SIM defaults delete com.mugtaba.athan <key>`)
could not remove `EXDevMenuShowsAtLaunch`, which existed only in the plist file on disk:
`defaults delete` answers `Domain (com.mugtaba.athan) not found` immediately after a cold
simulator boot (cfprefsd has never loaded the domain this session) and never touches the
file, so the plan's expected `PREFS ABSENT` printed `PREFS PRESENT` instead — a STOP case,
ruled on here because the owner is away. Fix: the same three keys removed directly with
`plutil -remove` from `<data container>/Library/Preferences/com.mugtaba.athan.plist` (the
same tool the step reads the plist with), leaving every other key untouched. End state
identical to the plan's intent: `PREFS ABSENT`, motion/touch gesture keys intact. Proof B's
flag write then worked through the app itself, as the plan expected.

### AUTONOMOUS RULING 3: proof A's onboarding sheet recorded honestly, not re-run

Vision's answer for proof A was off-prediction on part (3): it read the dev menu's
first-run onboarding sheet ("This is the developer menu…", verbatim expo-dev-menu copy)
covering the lower screen, where the plan's table says "none". Deterministic cause: the
step's own reset deleted `EXDevMenuIsOnboardingFinished`, and a genuinely fresh install
shows the launcher's onboarding at the first link; the planner's baseline A ran in a
container where onboarding was already finished. Not re-asked (the read carries the sheet's
literal text; pixels cannot change) and not re-run (re-running A after B would be
evidence-shopping). The FINDINGS row A records what vision saw, plus a divergence
paragraph; everything else in the section is the plan's template text. B, C and D matched
the table exactly (`1m 2s` / `1m 32s` / `1m 3s` / `1m 38s`; A and B different seeds).

- Dev client was already installed by step 1's smoke (`get_app_container` printed the
  bundle path; no fallback build needed).
- `devlauncher-B-prefs.txt` holds exactly the three expected lines: onboarding finished
  `true`, FAB `false`, shows-at-launch `false`.
- Cleanup: Metro stopped, `expo-env.d.ts` removed (Metro had regenerated it), dev client
  uninstalled, simulator shut down.
- Breaks `breaks-13-2.sh`: `caught=4 missed=0`, `ALL AS EXPECTED: 1`. tsc and Biome exit 0.
- Commit `006a574a`, version `1.27.237`; hook `Tests:       4534 passed, 4534 total`,
  coverage lines `Statements/Branches/Functions/Lines` all `100%`.
- Review: Code Reviewer (GLM 5.3), 1 round, verdict **merge** (it independently re-derived
  and accepted ruling 3: the expected-answer table was inconsistent with the step's own
  reset, and restoring the template wording would falsify vision's reading).
- Merge `62ef4683` into `uat-2` (`--no-ff`, reviewed).


