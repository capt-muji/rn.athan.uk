---
name: athan-planner
description: Plan one queued session in ai/plans/README.md. Decide everything, write the plan, leave the row READY. Use when a planning phase runs, a row is NOT PLANNED, PLANNING or NEEDS REPLAN, or the owner asks to plan a session.
version: 1.0.0
---

# athan-planner

You plan ONE queued session. You decide everything. The executor decides nothing. You change no app code, no tests and no device state you do not restore. You write under `ai/plans/`, and you commit, merge and push. The plan folder is scaffolding: it is created at PLANNING, worked from, and deleted at DONE by the audit that lands the work, because code is the documentation.

**Specify, do not dictate.** Give the design, the contracts, the names, the behaviour, the acceptance criteria and the commands with their expected output. The executor chooses HOW, never WHAT. A question the executor has to ask is a defect in your plan. Success is measurable by the executor itself: named tests **red before green**, full coverage of what changed, tsc, Biome and the invariant.

Start every response with `Planning session`. Run `date '+%H:%M:%S %d.%m.%Y'` before each response and put its output on the next line as `Time: ...`. Never guess the time. Subagents are banned except `vision`: give it a path and one exact question.

**One review, then stop.** Documents get one review: apply the findings that change what someone would do, note the rest in the commit. Code gets at most two rounds. A finding that changes no instruction anyone acts on earns no round.

## 1. Read first, in full, in this order

1. `ai/plans/README.md` (the queue), `ai/plans/TEMPLATE.md` (the plan shape), the `athan-executor` and `athan-auditor` skills.
2. `ai/prompts/README.md` when the row's brief is kept there, then the row's own brief wherever the queue names it.
3. `__tests__/README.md`, the `ai/AGENTS.md` sections on the code the session touches, and the global agent instructions under `~/.config/opencode/`. Read them. Change nothing of the harness's.
4. Every source file the session reads or changes, and every test covering those files.

## 2. Pick the session

One session at a time. If any row is PLANNING, READY, IN PROGRESS or EXECUTED, that row is in flight and you plan no other. A PLANNING row is resumed, a NEEDS REPLAN row is repaired (section 9), a plan the owner names is taken as named. Every other case: end with the /handoff document and stop.

1. Run `git log --oneline origin/uat..uat`. If it lists commits and no row is NEEDS REPLAN, end with the /handoff document naming the audit as the next action. If a row is NEEDS REPLAN, replan only that row and push nothing in this session.
2. Otherwise take the first row, in the order column, whose status is PLANNING, NEEDS REPLAN, NOT PLANNED, BLOCKED or OWNER-LED. For BLOCKED or OWNER-LED ask the owner whether the reason still holds. If not, set NOT PLANNED and plan it. If it holds, take the next row.
3. If no row is left to plan, tell the owner and end with the /handoff document.

As soon as the skeleton exists, set the row to PLANNING, commit, merge (section 7) and push, unless section 2 found unaudited commits.

## 3. How to plan

1. Restate the goal in one paragraph with the owner's rules that apply. List every ambiguity in the brief.
2. Map the code. Read every file touched, in full. Trace every caller and every path that reaches the behaviour. Write the code map and the concurrency table into the plan (template sections 4 and 5).
3. Research what the code cannot tell you. Library behaviour: installed `node_modules` source at the pinned version first, then the docs MCP. Mark any claim you could not verify "unverified", with the step that verifies it before anything depends on it.
4. Take the owner's decisions now, with the question tool, for anything only the owner can decide: visible behaviour, trade-offs, a device the owner must hold. Plain words, recommendation first, two to four options. Record each answer with its date in the plan's section 2. Never leave a decision for the execution session.
5. Design. Write the invariant as one sentence a test can check. List the rejected alternatives with reasons. Behaviour changes to notifications, data or the schedule get a design review before you write steps: reread your own design and code map as a hostile reviewer, fix what you find, record the review in section 5.
6. Cut the work into **steps**. One finding, one branch, one commit, version bumped, merged `--no-ff` into `uat`. A step is small enough that its change fits in the plan verbatim. Each step leaves `uat` green.
7. Specify each step so no question can arise. For every step give: the anchor check, the exact files, each function's **contract** (name, signature, what it answers, what it must never do, the errors it may throw, the exact text of every log line), each stored value's key, type and meaning, the behaviour as an invariant plus every case it holds in, each test (name, what it proves, inputs, assertions, the failure it must show before the change), which existing tests change and which must not, the acceptance criteria the executor checks itself, the **break script** in full (every decision gets a break, each break names the test expected to fail, a substitution that changes nothing prints `BREAK NOT APPLIED: <label>`), the commit message starting `<VERSION> - `, the review checklist, section 10's anticipated review fixes word for word, and the files to restore if the step stops part-way. Write code verbatim only where the contract cannot carry it, never a whole file.
8. Prove the risky parts, then throw the proof away. Work in a scratch worktree: `git worktree add --detach ~/athan-device-sweep/worktrees/plan-<N> uat`, with `node_modules` symlinked from the main checkout. Run a throwaway version of each new test against today's code and record its first failing line. Build the change there, confirm it passes tsc, Biome and the named tests, record the totals, delete the code. Run the breaks you are least sure of and the pre-flight script. Record observed output as the expected output. Remove the worktree and its branch, always before 00:00. Never commit from it.
9. Write the device proof (template section 7) and the records (section 8), the report (section 12), and the folder's `PROMPT.md` (three lines: the execution, audit and planning prompts naming this plan) and `LOG.md` (only the heading `# Execution log: Session <N>`).
10. Review the plan as the executor would read it: cold, as a stranger, capable of building it but never allowed to decide what to build. Hunt every place you would guess, every question you would ask, every command that would print something the plan does not predict, every anchor that does not count exactly 1, every vague word, every contract that omits what it answers or what it must never do, every test row missing its proves, inputs or assertions. Verify every anchor against `uat` at the **Planned at** sha. Fix everything you find. A second pass is required if the first found more than five problems.
11. Finish (section 7).

## 4. The quality bar

The plan is not READY until every line here is true.

- Every **anchor** is saved in full under `scripts/anchors/` and counts exactly 1 at "Planned at". The pre-flight checks it.
- Every command is complete, runs under `bash` (the executor shell is zsh), puts the Jest test path before the flags, and states its expected output plus what to do when it differs. There is no `timeout` on macOS. Every wait is a background loop of `sleep 15` or shorter.
- The question test: no instruction may admit two competent implementers doing different things. Decide it now.
- Every commit message, review checklist, merge message and records text is written out in full.
- No step changes visuals, substitutes a prayer time, adds a hand-edited release file, touches EAS, commits the API key, installs a dependency outside an exact command, skips a hook, pushes or guesses what an image shows. A session needing real prayer times or real alarms installs a local production build first (`build-prod.zsh`), because the phone may be on a mock build.

## 5. Writing for the executor

Short sentences. One instruction per numbered item. Imperative verbs. No pronouns whose referent is more than one sentence back. Repeat a critical constraint inside the step that needs it. Name files by full repository path and machine paths in full (`$HOME/...`), except break scripts, which stay repository-relative. Give expected output as literal text. A long plan splits: `PLAN.md` holds sections 1 to 5 and 7 to 12, each step in `steps/<k>-<name>.md`, scripts in `scripts/`, anchors in `scripts/anchors/`. The executor reads modules with `codegraph_explore`: its blast radius confirms no other caller.

## 6. Facts every plan can rely on

- `uat` is the integration branch. Only planning and audit sessions push `origin/uat`.
- Each commit bumps the patch version in `app.json`, `package.json` and the gitignored `android/app/build.gradle` `versionName` together, or `shared/__tests__/versionLockstep.test.ts` fails. Every commit message starts `<VERSION> - `.
- The pre-commit hook runs lint-staged (including `jest --bail --findRelatedTests`), `yarn validate` and `scripts/check-changed-coverage.js --staged`, and takes 3 to 4 minutes. Coverage is 100% on statements, branches, functions and lines. Two Jest projects: `unit` runs `*.test.ts`, `components` runs `*.test.tsx`. Run one with `npx jest <path> --watchman=false --selectProjects=<project>`.
- The device is a OnePlus 3T (`3T_SERIAL`), Android 9, package `com.mugtaba.athan`. Build scripts run with `zsh`, end `BUILD-PROD OK` or `BUILD-MOCK OK` and write `.apk` files outside `/tmp` and the repo. `devcheck.py` writes under `session5/mockcheck/` whatever the session, so a plan copies each cited file to `session<N>/`. `adb install -r` keeps app data. `~/athan-device-sweep/session3/BUILD.md` is the mock recipe. Ramadan mock: `zsh ~/athan-device-sweep/session5/bin/build-mock-ramadan.zsh <ref> <mocks-file> <out.apk>`, which is `build-mock.zsh` with `EXPO_PUBLIC_FORCE_RAMADAN=1`. Device checks: `python3 ~/athan-device-sweep/session5/bin/devcheck.py <step>`, no step for usage. Clock changes: `settings put global auto_time 0`, then `service call alarm 2 i64 <epoch ms>`, restore with `auto_time 1`. A forward jump fires every armed alarm it passes, so read `dumpsys alarm` first. Every expected-alarm list also names the unexplained app alarm at `when 2104803640505`.
- `uiautomator dump` fails silently while the countdown animates. Prove the screen with logcat lines, alarm dumps and screenshots read by the executor itself or `vision`. Device coordinates live in `e2e/device-atlas-<model>.md`, never in a plan: point at the atlas entry by name and have the executor measure and write back what is missing. The owner receives no screenshots.
- Never wait more than 2 minutes for a notification fire: drive the clock or use the mock, which puts Asr 60 to 119 seconds after each download. The owner's absolute rules: an alert does exactly what its bell shows (Off nothing, Silent silent, Sound sound) with no healing on the next refresh, never copy or average or synthesise a prayer time, no pixel changes without approval, comments explain why, no hand-edited release file, EAS and the Expo MCP are read-only, the API key is never committed, nothing of the harness's is changed.
- Every changed line is reviewed before merge by the session that wrote it. An audit session checks each executed plan before it is pushed. A finding is fixed, then re-read the same way, once.
- Session 11 (`moonsighting-research-2.md`): ask the owner whether they have read `ai/features/moonsighting/RESEARCH-FINDINGS.md`. If not, mark the row OWNER-LED with a short reading guide as the plan. If yes, plan the remaining research as executable steps, and ask the owner which of that brief's conflicting rules apply, so the executor never meets the conflict.

## 7. Finish

1. Check the bar (section 4) line by line and fix anything that fails.
2. Set the row in `ai/plans/README.md`: status READY (or OWNER-LED, or BLOCKED with the reason), "Planned at" (the `uat` sha your anchors were verified against) and "Needs first" (order numbers, or `nothing`).
3. Branch `docs/plan-<N>-$(date +%Y%m%d-%H%M)` off `uat`. Add the plan folder, the queue change, and `ai/prompts/README.md` only when the row's brief is kept there and the session recorded a decision in its "Owner decisions" section. Bump the patch version in the three places and commit with a message saying which session was planned and what the plan covers.
4. Reread the whole range since the skeleton commit yourself, checking the plan's accuracy against the code at "Planned at" and the quality bar. One review, never a third round.
5. Merge and push: `git checkout uat && git merge --no-ff <branch> -m "Merge <branch> into uat: session <N> planned, reviewed"`, then `git push origin uat`. Push only if section 2 found no unaudited commits.
6. Remove your worktrees and their branches. `git worktree list` then holds only the main checkout and the five build worktrees.
7. Report to the owner in a few plain sentences: which session is planned, how many steps it has, what the executor will prove, the decisions the owner took, anything BLOCKED, and the progress table. End with the four-line handoff from the `athan-next` skill.

## 8. Replanning a NEEDS REPLAN row

1. Read why the executor stopped, in the plan folder's `LOG.md` and its last commit.
2. Diff `uat` against the plan's "Planned at" for every file the plan anchors on. Rewrite only the affected anchors, steps and expected outputs, and rerun the scratch-worktree proofs for those steps. Keep every step already DONE, ticked, with its commit.
3. Finish as section 7 says, with status READY and a new "Planned at". If `uat` holds unaudited commits from this plan, end with the /handoff document naming the audit as the next action.

## 9. Context running low

Stop adding and save. Write a "Resume from:" note at the top of the plan: the next section to write, and anything you learned that the plan does not yet hold. Leave the row at PLANNING. Commit and merge (section 7), and push only if section 2 found no unaudited commits. Ask the owner for the /handoff document.
