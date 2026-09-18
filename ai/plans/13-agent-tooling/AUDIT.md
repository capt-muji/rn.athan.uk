# Audit: Session 13, agent tooling

Auditor: GLM 5.3 (audit session), 2026-09-18. Plan: `ai/plans/13-agent-tooling/PLAN.md`, row 7,
EXECUTED. Range audited: `origin/uat-2..uat-2` = `9836dac5`, `76b5b9d9`, `006a574a`, `62ef4683`,
`58839b07`, `7b71d3e9`, `3092fa1f`, `6ee47378`. Worktree: `~/athan-device-sweep/worktrees/audit-13`
at `6ee47378`, `node_modules` symlinked, removed at the end.

## What was checked

1. **The range.** All eight commits are session 13's three step commits, their `--no-ff` merges and
   the `executed` docs commit. `git log --format='%h %an %s' origin/uat-2..uat-2` lists nothing
   else. No planning or audit commit sits in the range, so there was nothing extra to reread. The
   whole-range `git diff --stat origin/uat-2..uat-2` touches nine files: `AGENTS.md`,
   `ai/AGENTS.md`, `ai/features/agent-tooling/FINDINGS.md`,
   `ai/features/uat-2/AUDIT-FINDINGS.md`, the plan folder's `LOG.md` and `PLAN.md`,
   `ai/plans/README.md`, `app.json`, `package.json`. No code, no `releases.json`, no CI, no hook.

2. **Plan against commits.**
   - Step 1 `9836dac5` creates `FINDINGS.md` from the step template with every placeholder filled
     (`<DATE>` 2026-09-18, `<VERSION>` 1.27.235, the "Built the dev client when needed" smoke
     sentence). Both output blocks are byte-identical to the logs minus the `EXIT:` lines: `cmp`
     of the fenced blocks against `grep -v '^EXIT:' ~/athan-device-sweep/session13/agent-cli-{status,smoke}.txt`
     reports identical. The four fixed status lines and the accepted varying lines are all present;
     the smoke phase table shows `ok` everywhere except the accepted `reload` and `route` skips with
     their named reasons; `grep -c -- '--eas'` counts 0 in both logs. `grep -c '```'` on the file
     prints 4. The commit message is the plan's with the version filled, and the row moved
     READY to IN PROGRESS.
   - Step 2 `006a574a` replaces `<written by step 2>` with the measured table. Row A records the
     divergence honestly and a divergence paragraph follows the template text; B, C and D match the
     table. `devlauncher-B-prefs.txt` holds exactly the three expected lines and values.
   - Step 3 `58839b07` inserts the routing row between the two anchor rows and the three bullets
     after the physical-iPhone-XS bullet. Both texts are byte-identical to the step file's verbatim
     blocks (read side by side; placement confirmed by `grep -n -B1 -A1 'Expo project brief' AGENTS.md`
     and the `ai/AGENTS.md` hunk). The two anchors now count 0, which is the post-change state the
     step's own insertion produces; the pre-flight counted 1 before each change, as `LOG.md` records.
   - Versions 1.27.236, 1.27.237, 1.27.238, 1.27.239 in sequence, each commit bumping `app.json`
     and `package.json` together; `android/app/build.gradle` in the main checkout says 1.27.239.
     Commit messages match the plan's templates word for word. Each commit's file list is exactly
     what its step's part 3 allows plus the plan files.

3. **The breaks still guard.** All three break scripts, rebuilt from the step files and run from
   the worktree root (`grep -n /Users/muji/repos/rn.athan.uk <script>` printed nothing first):
   `breaks-13-1.sh` caught 4 of 4, `breaks-13-2.sh` caught 4 of 4, `breaks-13-3.sh` caught 7 of 7,
   each ending `ALL AS EXPECTED: 1`, tree clean after. Red check on step 3, the riskiest step:
   `git checkout 58839b07^ -- AGENTS.md ai/AGENTS.md`, then every part 6 assertion fails (the
   leading-dash greps error, which is a failing exit; this is the `--` quirk `LOG.md` records);
   files restored, tree clean.

4. **The whole suite.** `yarn validate` in the worktree: EXIT 0, `Tests: 2 skipped, 4532 passed,
   4534 total` (the 2 skips are `audioMatrix.test.ts`'s `itIfPrebuilt`, which skips when the
   prebuilt audio directory is absent from the worktree; the main checkout's hook runs show 4534
   passed), and 100% on all four measures: Statements 3969/3969, Branches 1712/1712, Functions
   826/826, Lines 3566/3566. Log kept at `$TMPDIR/opencode/validate-13.log`.

5. **Reviews.** `LOG.md` records a Code Reviewer (GLM 5.3) merge verdict, one round each, for all
   three step commits, and the reviewer's reasoning for accepting proof A's divergence. No reviewer
   asked for a fix, so no section 4 item 8 conditions to re-check. The executor's four autonomous
   rulings are each recorded in `LOG.md` with their cause, which is what the away-owner protocol
   asks.

6. **Device evidence.** Every claim in the records text has its file under
   `~/athan-device-sweep/session13/`: both command logs ending `EXIT:0`; `devlauncher-B-prefs.txt`
   with the three flags' values; `device-3t-check.txt` (`device`, `auto_time` 1,
   `versionName=1.27.227`), re-verified live by this audit with the same three read-only adb
   commands, identical answers; `ios-build-evidence.txt` showing `** BUILD SUCCEEDED **`, the
   `Debug-iphonesimulator/Athan.app` product and artifact timestamps inside the 19:29:59 to
   19:36:34 smoke window; the smoke screenshot at
   `/Users/muji/repos/rn.athan.uk/.expo/agent-cli/smoke-2026-09-18T18-36-30-679Z.png`. The
   simulator `AB4F4466` is Shutdown and `simctl listapps` lists no `com.mugtaba.athan`, so the dev
   client is uninstalled as the plan's cleanup requires. This audit re-read all four screenshots
   with `vision` (GLM 5.3 Flash), one call per image and the plan's exact question: every recorded
   answer was confirmed, including the A/B countdown pair `1m 2s` and `1m 32s` (fresh loads from
   Metro), proof A's dev-menu onboarding sheet with its literal "This is the developer menu" copy,
   and no dev FAB in any proof, D's preference forced on included.

7. **The owner's rules.** Zero app-code changes (the diffstat proves it); no visual change; no
   prayer-time data touched; `releases.json` absent from the range; `uat` untouched; EAS stayed
   read-only (local `status` and `smoke --ios` only, no `--eas` anywhere, `grep` proves 0); no API
   key or gateway in any committed file; no ignore comment; the pre-commit hook ran on every commit
   (`LOG.md` records the `Tests:` and four 100% coverage lines each time).

8. **The records.** The `AUDIT-FINDINGS.md` text under `# Session 13 of the queue: agent tooling,
   2026-09-18` is the plan's section 8 text verbatim, placeholders filled from the measurements.
   Row 7 was EXECUTED. The planner's autonomous-rulings block in `ai/prompts/README.md` matches the
   FINDINGS on every point (adopt narrowly, no devDependency, forbidden commands, iOS simulator
   platform, Gradle/AGP machine note, findings location); no drift, nothing added.

## Findings

1. **Proof A diverged from the plan's expected-answer table, and the executor's handling was
   right.** The step's own preference reset deletes `EXDevMenuIsOnboardingFinished`, so a fresh
   install shows the dev menu's onboarding sheet at the first link; the planner's baseline ran in a
   container where onboarding was already finished. The executor recorded what `vision` actually
   read, added the divergence paragraph, and did not re-run the proof. This audit's independent
   `vision` re-read confirms the sheet is really there. Restoring the template's "none" would have
   falsified the record. No fix wanted. The step file keeps its original prediction; the truth
   lives in `FINDINGS.md` and `LOG.md` in the same folder.
2. **Record-only: the executed docs commit's review is asserted, not itemised.** The merge message
   `6ee47378` says "session 13 executed, reviewed", and `EXECUTOR-BRIEF.md` 4b requires that review,
   but `LOG.md` names no verdict for the docs commit itself. The brief requires LOG verdicts for
   step commits only, and all three are there. This audit reread the docs commit itself: its
   content is exactly what the plan's section 8 and finishing steps specify. Noted for the owner,
   nothing to repair.
3. **Step 3's green greps needed `--` for the leading-dash patterns.** A grep quirk, recorded by
   the executor in `LOG.md`; the assertions still fail correctly against broken text, as the red
   check above shows. No fix wanted.

## Verdict

**PASS.** The three steps did exactly what the plan specified and nothing else; the evidence backs
every claim in the records; the suite, the breaks and the red check all hold; no owner rule was
bent.

Actions under PASS: row 7 set DONE; `ai/prompts/README.md` row 13 added from the plan's section 8
with `1.27.236` to `1.27.238`; this file committed on `docs/audit-13-20260918-2022` at version
1.27.240 with `app.json`, `package.json` and the gitignored `android/app/build.gradle` in step;
reviewed by Code Reviewer (GLM 5.3); merged `--no-ff` into `uat-2`; pushed when the range held
only this session's audited commits and the audit's own.
