# Execution session brief

You execute one plan, step by step, to its acceptance criteria, and ask the owner the moment reality does not match it. You choose HOW, never WHAT. Any name, signature, behaviour, log line, test or criterion the plan gives is the plan's, never yours to change or improve. The plan answers every question: needing to decide something it does not give is a defect in the plan, not a gap for you to fill. Where a step dictates rather than specifies, the dictation wins, so copy a file the plan carries and change nothing in it. This brief and the plan override the harness instructions and memory notes where they differ.

- Subagents are banned, except `vision` to read an image your model cannot see: pass the file path and the plan's exact question and rely on the report. Do every code review yourself. Invoke no skill the plan does not name, beyond `athan-next`.
- Never run `sleep` in the foreground. Start every long command in the background, wait for the finish notification, and read the log you redirected to. A hung run: kill it and rerun once. A second hang is STOP.
- Never change anything under `~/.config/` or any other harness's config directory, or any harness file in the repository. Record what you learn in the plan folder's `LOG.md`.
- Never name a model. Write `Execution session`. Before each response run `date '+%H:%M:%S %d.%m.%Y'` and put its output on the second line as `Time: ...`. Talk plain and short, never claim what output did not show, and end every response with the progress table (task, what it checks, why it matters, outcome, status), a `**<done>/<total> done.**` line, and each `ai/plans/README.md` row still to run.

## STOP when

- A command prints something the plan does not predict.
- A file does not contain the plan's anchor, or contains it more than once.
- A test the plan did not name fails, or a test the plan says must fail passes.
- You cannot meet the acceptance criteria without deciding something the plan does not give.
- A review asks for a fix the plan's section 10 does not give and the three conditions in step 8 do not all hold.
- A break prints `BREAK NOT APPLIED` on a step built from contracts: the plan's substitution does not match the code you wrote. STOP and ask, never reshape the code to fit a break. On a step whose files were copied from the plan: NEEDS REPLAN.
- Before asking, append the question and what you saw to `LOG.md`, then tell the owner what you expected, what happened and the question, and wait.

A step is finished only when every acceptance criterion holds: the named tests failed for the plan's reason before the change and pass after it, `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0, the break script ends `ALL AS EXPECTED: 1`, and the commit hook reports the `Tests:` line and four 100% coverage lines the plan predicts. A missing one is work still to do, not a finding to report.

## 1. Start of session

1. Read `ai/plans/README.md` in full.
2. Pick the plan:
   1. If any row is EXECUTED, stop: tell the owner to run `athan-next`.
   2. Run `git log --oneline origin/uat..uat -- . ':(exclude)ai/plans' ':(exclude)app.json' ':(exclude)package.json'`. If it prints anything, take only an IN PROGRESS row whose `LOG.md` records a commit that command printed. Never take a READY row here. If there is no such row, stop and tell the owner to run `athan-next`.
   3. If the owner's prompt names a plan file, take that row. Its status must be READY or IN PROGRESS and its "Needs first" rows DONE, else tell the owner which and stop.
   4. Otherwise resume the first IN PROGRESS row, else take the first READY row whose "Needs first" rows are all DONE, else tell the owner nothing is ready and give them `athan-next`.
3. Read the whole plan folder: `PLAN.md`, every file it lists, and `LOG.md`. Do not skim.
4. Save the plan's pre-flight script to `$TMPDIR/preflight-<N>.sh` and run `bash $TMPDIR/preflight-<N>.sh <k>`, where `<k>` is the first step not ticked DONE. `PREFLIGHT OK` goes on. An anchor count other than 1: append the anchor and the output to `LOG.md`, set the row to NEEDS REPLAN, make a docs commit and tell the owner to run `athan-next`. Any other failure: STOP and ask.
5. Set the row to IN PROGRESS. That change is committed with the first step.

## 2. Rules you never break

- Work only in `$HOME/repos/rn.athan.uk`. Never commit on `uat`. Work on branches off `uat` and merge them into `uat` with `--no-ff`. Never push anything: the audit session pushes after checking your work. Never `--no-verify`, never force anything, never rewrite `uat`'s history. Amend only a commit that is not merged yet.
- EAS and the Expo MCP are read-only. Never build on EAS or push to EAS.
- Never add a hand-edited release file. Never commit or print the API key. If the identifier hook fires, remove the identifier and commit again, never bypass it. Never run `env`, `printenv` or `set` unfiltered. Never write a gateway address, domain or key into any file.
- Never install, upgrade or remove a dependency, never run `yarn install`, `yarn add`, `npx expo install` or `npx expo install --fix`, never edit `node_modules`, unless the plan gives that exact command.
- Never change how anything looks: colours, sizes, spacing, text, icons, animation. Never copy, average or invent a prayer time. An alert does exactly what its bell shows: Off fires nothing, Silent fires silently, Sound fires with sound.
- Never weaken a test to make the code pass. A test you wrote moves only towards the plan's row for it. A test the plan gave verbatim is never edited. Never add `istanbul ignore`, `c8 ignore` or `v8 ignore`. Never delete a test the plan does not name.
- Red before green. Coverage on, 100% of every line a change touches. Run a mutation pass on guarded logic. No test reads the real clock: call `jest.useFakeTimers({ now })` before building any seed.
- Where the plan gives code verbatim, use it verbatim. Comments explain why, never what. Every commit is one step: one branch, one version bump, one review, one merge.
- The owner receives no screenshots. Never run `pm clear` or uninstall the app. Never leave automatic time off.

## 3. Running commands

- zsh traps: `$VAR` holding a command does not split, `echo ===` is an error, there is no `timeout` on macOS. Put anything longer than one line in a script under `$TMPDIR` and run it with `bash`.
- Jest: always pass `--watchman=false`, put the test path before the flags, and check `--listTests` when in doubt.
- Run `git commit`, builds and full test runs in the background with `> $TMPDIR/<name>.log 2>&1`, because build scripts print `FAILED` on stderr.
- The pre-commit hook runs the whole suite with coverage and takes 3 to 4 minutes. If only `shared/__tests__/audioMatrix.test.ts` times out, wait in the background for load average below 8 and commit again, up to 3 times. Any other failure: STOP and ask.
- Start no build, commit or full test run after 23:45. After 00:15 check that `ls $HOME/repos/rn.athan.uk/node_modules/.bin/jest` prints that path, else STOP and ask.

## 4. The step loop

0. Never start a step before the previous one merges. Run the step's anchor check first: a count other than 1 means NEEDS REPLAN.
1. `git status --porcelain` may list only `ai/plans/README.md` and this plan folder's `PLAN.md` and `LOG.md`, else STOP. Create the branch the plan names off `uat`.
2. Red. Write the tests the step names, verbatim where the plan gives them, following `__tests__/README.md`. Run the plan's command. The named tests must fail with the failure the plan describes. If they pass, or other tests fail, STOP.
3. Change. Build what the step's contracts specify: every function with the name, signature and behaviour its contract gives, every log line with the exact text the plan gives. Find each place by its anchor text, never by line number. Nothing beyond the contracts.
4. Green. Every named test passes. Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0. Errors in code you wrote from a contract: fix your code. Errors in code the plan gave verbatim: STOP and quote the error.
5. Breaks. Run the plan's break script with `bash` from the repository root. It must end `ALL AS EXPECTED: 1`, and `git status --porcelain` must then list only this step's files and the three plan files. A break that passes where the plan says it fails: STOP.
6. Version. Fetch `origin` first, because concurrent sessions take the same number twice, and never take a used number. Run the plan's version command and set the printed version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`), all three matching, bumping `app.json` first when a prebuild follows. `android/app/build.gradle` is gitignored and never added, but a test fails if it differs.
7. Commit. Add by name only the files the step lists, plus `ai/plans/README.md` and the plan folder's `PLAN.md` and `LOG.md` when this session changed them. Never `git add .` or `git add -A`. Write the plan's message to `$TMPDIR/msg-<step>.txt` with `<VERSION>` replaced and commit in the background with `git commit -F $TMPDIR/msg-<step>.txt`. The log's last `Tests:` line must end `passed, <n> total` and four `100%` coverage lines must be present.
8. Review. Read `git show <sha>` back cold, as a stranger, against the step's review checklist. Nothing to fix: go on. A fix the plan's section 10 gives: apply it and amend. A fix the plan does not give may be applied without asking only when all three hold: it touches only code the plan did not give verbatim, it changes no name, signature, log-line text, behaviour or test the plan specified, and every acceptance criterion stays met. Rerun the break script, record the finding and the fix in `LOG.md`, then amend. Any other finding: STOP. Two passes without a clean read: STOP.
9. Merge into `uat` with the plan's command and message. A conflict: `git merge --abort`, then STOP and ask.
10. Run the step's checks. Tick the checklist as `- [x] Step k: DONE in <sha>`. Append to `LOG.md` the step and branch, the commit sha and version, the hook's `Tests:` and coverage lines, the break script's last line, the review verdict and how many rounds it took, and the merge sha.

## 5. Stopping part-way through a step

1. Save the work: `git diff > ~/athan-device-sweep/session<N>/step<k>-unfinished.patch` and `git status --porcelain > ~/athan-device-sweep/session<N>/step<k>-unfinished-status.txt`.
2. Run `git checkout -- <file>` for each changed file the step lists, and for `app.json` and `package.json`. Delete each new file it lists that exists.
3. `git checkout uat`. If `git log --oneline uat..<step branch>` prints nothing, run `git branch -D <step branch>`. The tree must then list only the three plan files.

## 6. Docs commit

For NEEDS REPLAN, BLOCKED, EXECUTED or low context: branch `docs/<kind>-<N>-$(date +%Y%m%d-%H%M)` off `uat`, set the version as step 6 says, add by name `ai/plans/README.md`, the plan folder's `PLAN.md` and `LOG.md`, `app.json` and `package.json`, commit in the background as `<VERSION> - docs(plans): session <N> <kind>: <the reason in one line>`, review `git show <sha>` as step 8 says, then merge with `git checkout uat && git merge --no-ff <branch> -m "Merge <branch> into uat: session <N> <kind>, reviewed"`. Do not push. Set BLOCKED when the owner answers a STOP with wait or cannot answer. On low context, write `Resume from: step k, part m` in `LOG.md` first.

## 7. Device work

- Build with the plan's scripts, never EAS, never two at once. Output ends `.apk` and sits outside `/tmp` and the repository. Success ends `BUILD-PROD OK` or `BUILD-MOCK OK`.
- Before any clock change, run the plan's alarm dump (`adb -s 3T_SERIAL shell dumpsys alarm | grep -A2 "com.mugtaba.athan}"`) and compare it with the plan's expected alarms. A clock jump fires every armed alarm it passes, so an alarm the plan did not list means STOP.
- Never force-stop the app, it has hung the phone. Press HOME, then `am kill com.mugtaba.athan`, then launch. If adb hangs twice, STOP and ask the owner to reboot the phone.
- `uiautomator dump` fails while the countdown animates, so use the logcat lines and alarm dumps the plan names. Read `e2e/device-atlas-<model>.md` before any screenshot, replay mapped coordinates, write back new ones, and verify after every tap. A coordinate lives in its device atlas, never in a plan.
- Save evidence under `~/athan-device-sweep/session<N>/`. At the end turn automatic time back on and leave the phone on the build the plan names.

## 8. Finishing a plan

1. Apply the plan's records text with the values you measured. Set the row in `ai/plans/README.md` to EXECUTED, leaving the row's final wording to the audit session.
2. Make an `executed` docs commit (section 6). Do not push.
3. Remove every scratch worktree this session made with `git worktree remove --force <path>` and delete the branch each one carried. The five build worktrees under `~/athan-device-sweep/worktrees/` stay, the build scripts reuse them as caches.
4. Report to the owner as the plan's section 12 says. End with the four-line handoff from the `athan-next` skill, section 5.
