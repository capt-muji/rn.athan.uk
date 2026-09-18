# Step 1: `@expo/agent-cli` status and smoke against this repo, findings and rulings recorded

Part of `ai/plans/13-agent-tooling/PLAN.md`. Kind: **specified**.

0. **Anchor check:** none for existing files; the pre-flight already asserted
   `ai/features/agent-tooling/FINDINGS.md` does not exist. Re-run that one check now:
   `test ! -e ai/features/agent-tooling/FINDINGS.md && echo OK`. Anything else means STOP.
1. **Goal:** run the brief's two commands against this repository and write
   `ai/features/agent-tooling/FINDINGS.md` with their verbatim outputs, the not-run table, the
   five rulings and the machine notes.
2. **Branch:** `git checkout -b docs/agent-cli-findings uat-2`.
3. **Files:** `ai/features/agent-tooling/FINDINGS.md` (new), plus `ai/plans/README.md` and this
   plan folder's `PLAN.md` and `LOG.md` when this session changed them. Nothing else may change.
   The command outputs also land under `~/athan-device-sweep/session13/` (outside the
   repository), and `.expo/` changes on disk (gitignored, never added).
4. **Tests first (red).** None: this step writes documentation only. The checks this step runs
   instead of tests are the assertions in part 6.
5. **Change.**
   1. Save this script as `$TMPDIR/step1-agent-cli.sh` and run it with
      `bash $TMPDIR/step1-agent-cli.sh` in the background (it runs a native build; section 3 of
      `EXECUTOR-BRIEF.md`), then read its two log files:

      ```bash
      #!/bin/bash
      # Session 13 step 1: run the brief's two agent-cli commands and keep their output.
      set -u
      mkdir -p ~/athan-device-sweep/session13
      npx -y @expo/agent-cli@1.0.16 status  > ~/athan-device-sweep/session13/agent-cli-status.txt 2>&1
      echo "EXIT:$?" >> ~/athan-device-sweep/session13/agent-cli-status.txt
      npx -y @expo/agent-cli@1.0.16 smoke --ios > ~/athan-device-sweep/session13/agent-cli-smoke.txt 2>&1
      echo "EXIT:$?" >> ~/athan-device-sweep/session13/agent-cli-smoke.txt
      echo DONE
      ```

      It is one script on purpose: `smoke` pays for the dev-client build inside its own budget,
      and nothing else may interleave with it. Expect several minutes; the tool itself prints
      "nothing is stuck" while building.
   2. **Expected output, `agent-cli-status.txt`.** Last line `EXIT:0`. Fixed lines, each exact:
      - `project     athan · SDK 58.0.0-preview.3 · CNG · dev client · no web`
      - `expo go     not compatible (14 reasons)`
      - `auth        mugtaba · per expo whoami`
      - `build       local · this machine has Xcode — Xcode 27.0 at /Applications/Xcode.app/Contents/Developer.`

      Varying lines, with what they may say: the `freshness` block (`local stale · eas unknown`
      with `no recorded build` and `EAS was not asked — pass --explain`, or fresh wording naming a
      recorded build), `dev server` (`not running (http://127.0.0.1:8081)`, or a running one),
      `device` (`android 8f7ada76`, or absent when the 3T is disconnected), and the `next` line
      (`npx @expo/agent-cli dev --ios → dev-client-stale: expo prebuild --platform ios (+1 more
      step)` while no build is recorded, other wording after). Any other line, or any other exit:
      STOP (PLAN section 2.2).
   3. **Expected output, `agent-cli-smoke.txt`.** Last line `EXIT:0`. Fixed lines, each exact:
      - `… Looking for a dev server`
      - `… Starting a dev server for this run`
      - `smoke       passed`
      - `environment started the dev server · stopped again`

      The line about the build is either the planner's `Building the ios development build first,
      on this machine. This project has none for its current fingerprint, and a native build
      takes some minutes — nothing is stuck.` or reuse wording naming an existing build: both are
      accepted. The phase table follows: `ok` for `dev-server`, `bundler-ready`, `bundle`, `app`,
      `runtime`, `errors` and `screenshot`; `skipped` is accepted for `start-dev-server` (when a
      server already ran) and for `reload` and `route` (their skip lines name the reasons: the run
      opened the app itself, and no `--route` was given). Every duration (`413.8s`, `15.6s`,
      `took 450.7s` in the planner's run) varies. The `screenshot` line names a path under
      `/Users/muji/repos/rn.athan.uk/.expo/agent-cli/`. Planner baseline (2026-09-18, first run):
      `smoke passed`, zero runtime errors, `took 450.7s`. If the exit is not 0, or any phase is
      neither `ok` nor an accepted `skipped`: copy the file into the FINDINGS verbatim, record
      the exit, and STOP (PLAN section 2.2).
   4. **Create `ai/features/agent-tooling/FINDINGS.md`** with exactly this content, replacing the
      placeholders with the measured values: `<DATE>` today's date in `YYYY-MM-DD` form,
      `<VERSION>` the `version` value from `package.json` as it stands at this moment (the tree's
      version before this step's bump), `<STATUS_OUTPUT>` the body of `agent-cli-status.txt`
      without its `EXIT:` line, `<SMOKE_OUTPUT>` the body of `agent-cli-smoke.txt` without its
      `EXIT:` line, `<SMOKE_EXIT>` the recorded exit (`0`), `<SMOKE_SENTENCE>` chosen by this
      rule: when the smoke log's build line is the "Building the ios development build first"
      form, the first sentence below; when it is the reuse wording, the second. The file has
      exactly two fenced code blocks and no others:

      ````markdown
      # Agent tooling findings (session 13, <DATE>)

      `ai/plans/SDK58-PROGRAMME.md` §13, measured against this repository at `<VERSION>`. Zero
      app-code changes. Command outputs are verbatim; the logs also live in
      `~/athan-device-sweep/session13/`. The planning session ran the same two commands on
      2026-09-18 as the baseline: status identical, smoke `passed` in 450.7 s with the first
      build at 413.8 s.

      ## Commands run

      ### `npx -y @expo/agent-cli@1.0.16 status` (exit 0)

      ```
      <STATUS_OUTPUT>
      ```

      Fixed lines the plan predicted: `project`, `expo go`, `auth`, `build`. Varying lines:
      `freshness`, `dev server`, `device`, `next`.

      ### `npx -y @expo/agent-cli@1.0.16 smoke --ios` (exit <SMOKE_EXIT>)

      ```
      <SMOKE_OUTPUT>
      ```

      <SMOKE_SENTENCE>

      ## Not run, on purpose

      | Command | Reason |
      | --- | --- |
      | `agents:setup` | writes user-home and project instruction files; OpenCode's and Claude's configuration and a managed `AGENTS.md` block are off limits |
      | `skills:sync` | creates skill symlinks under `.agents/skills/`, repo content beyond this session |
      | `status --explain`, `status --build`, `--assert` | they ask EAS for build state; EAS stays read-only and unbothered |
      | every `--eas` flag | routes to EAS Simulator/Build and spends credits; a session is billed until `simulator:stop` |
      | `deploy` | ships to EAS Hosting |
      | `smoke --android` | the connected OnePlus 3T would be the target, and it holds the owner's installed app |
      | `new`, `install`, `doctor`, `typecheck`, `runtime:*`, `navigate`, `dev` | outside the brief's two commands |

      ## Machine notes

      - The local Android debug-build path fails today (measured by the planning session on the
        `athan_test_avd` emulator, 2026-09-18, both attempts preserved in the session record):
        `npx expo run:android --variant debug` first fails at
        `Failed to apply plugin 'com.android.internal.version-check'` because the generated
        wrapper pins Gradle 9.3.1 while AGP demands at least 9.4.1; with the wrapper moved to
        9.4.1 it fails at `Cannot add extension with name 'kotlin', as there is an extension
        already registered with that name`. The wrapper was put back to 9.3.1. This blocks any
        local Android dev build from the main checkout and is why the dev-launcher verification
        ran on the iOS simulator. Not fixed here; whoever owns the local Android build path
        (the SDK 58 stable re-pin session at the latest) picks it up.
      - The iOS build smoke drives leaves `ios/Pods` and Xcode build artifacts in place, so later
        smoke runs are incremental and faster than the 450.7 s baseline.

      ## Rulings (autonomous, 2026-09-18; the owner was away)

      1. **Adopt, narrowly.** `status` and `smoke` are documented in `ai/AGENTS.md` §6 and the
         root `AGENTS.md` routing table; nothing is installed or hooked. Four commands are
         forbidden in sessions: `agents:setup`, `skills:sync`, `deploy`, every `--eas` flag; and
         `smoke --android` is forbidden while the 3T is connected. Revisit at the SDK 58 stable
         re-pin (session 16).
      2. **No devDependency.** npx keeps the experimental CLI opt-in per session. Revisit at
         session 16.
      3. **iOS simulator is the verification platform.** The 3T holds the owner's app; the smoke
         run builds the dev client on the simulator anyway; the Android form is source-verified
         (`DevLauncherController.kt` parses the same flags; the manifest registers `athan` and
         `exp+athan`) and its local build path is blocked (machine notes).
      4. **These findings live here**, per the moonsighting `ai/features/` precedent.
      5. **Out of scope:** everything in the not-run table.

      The owner can overturn any ruling by editing this file and `ai/AGENTS.md` §6.

      ## Dev-launcher URL verification

      <written by step 2>
      ````

      The `<SMOKE_SENTENCE>`, when smoke passed, is exactly: `Built the dev client when needed,
      opened the app through the athan:// link, read zero runtime errors over the 3-second
      window, and stopped the dev server it had started.` If smoke's phases say the build was
      reused, the sentence is exactly: `Reused the recorded dev-client build, opened the app
      through the athan:// link, read zero runtime errors over the 3-second window, and stopped
      the dev server it had started.` (This branch only exists when the exit was 0.)
6. **Green.** Run, from the repository root:

   ```bash
   grep -F 'project     athan · SDK 58.0.0-preview.3 · CNG · dev client · no web' ~/athan-device-sweep/session13/agent-cli-status.txt
   grep -F 'EXIT:0' ~/athan-device-sweep/session13/agent-cli-status.txt
   grep -F 'EXIT:0' ~/athan-device-sweep/session13/agent-cli-smoke.txt
   grep -F '# Agent tooling findings (session 13,' ai/features/agent-tooling/FINDINGS.md
   grep -F '## Rulings (autonomous, 2026-09-18; the owner was away)' ai/features/agent-tooling/FINDINGS.md
   grep -c '```' ai/features/agent-tooling/FINDINGS.md
   ```

   Each `grep -F` prints its line (exit 0); the count prints `4` (two fenced blocks). Then
   `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exit 0.
   `git status --porcelain` lists only `?? ai/features/agent-tooling/` plus the three plan files
   when changed.
7. **Breaks.** Save as `$TMPDIR/breaks-13-1.sh` and run with `bash $TMPDIR/breaks-13-1.sh` from
   the repository root:

   ```bash
   #!/bin/bash
   # Session 13 step 1 breaks: each flips a fact the FINDINGS must carry, and the
   # assertion that proves the fact must fail.
   set -u
   F=ai/features/agent-tooling/FINDINGS.md
   caught=0; missed=0

   brk() {
     label="$1"; file="$2"; from="$3"; to="$4"; check="$5"
     cp "$file" "$file.bak"
     BRK_FROM="$from" BRK_TO="$to" perl -pi -e 's{\Q$ENV{BRK_FROM}\E}{$ENV{BRK_TO}}' "$file"
     if cmp -s "$file" "$file.bak"; then
       echo "BREAK NOT APPLIED: $label"; missed=$((missed+1))
     elif bash -c "$check" >/dev/null 2>&1; then
       echo "NOT CAUGHT: $label"; missed=$((missed+1))
     else
       echo "caught: $label"; caught=$((caught+1))
     fi
     mv "$file.bak" "$file"
   }

   # 1. The version pin is part of the record.
   brk "version-pin" "$F" '@expo/agent-cli@1.0.16' '@expo/agent-cli@9.9.9' \
     "grep -F '@expo/agent-cli@1.0.16' $F"
   # 2. The EAS prohibition must stay a prohibition.
   brk "eas-verb" "$F" 'routes to EAS Simulator/Build and spends credits' 'is fine occasionally' \
     "grep -F 'spends credits' $F"
   # 3. The status exit is part of the record.
   brk "status-exit" "$F" 'status` (exit 0)' 'status` (exit 1)' \
     "grep -F 'status\` (exit 0)' $F"
   # 4. The Android blockage is a fact, not a suggestion (target sits inside one template line).
   brk "android-blockage" "$F" 'local Android dev build from the main checkout' 'minor inconvenience for now' \
     "grep -F 'local Android dev build from the main checkout' $F"

   echo "caught=$caught missed=$missed"
   [ "$missed" -eq 0 ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   Expected: four `caught:` lines, `caught=4 missed=0`, `ALL AS EXPECTED: 1`. Afterwards
   `git status --porcelain` lists only this step's files and the plan files.
8. **Version and commit.** Version command:
   `node -p "const v=require('./package.json').version.split('.');v[2]=String(Number(v[2])+1);v.join('.')"`
   (`1.27.236` when `uat-2` is at the planning version `1.27.235`; always the printed value). Set
   it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add by name:
   `ai/features/agent-tooling/FINDINGS.md`, `app.json`, `package.json`, plus
   `ai/plans/README.md` and this plan folder's `PLAN.md` and `LOG.md` when changed. Commit
   message:

   ```
   <VERSION> - docs(agent-tooling): agent-cli status and smoke run against this repo, findings and rulings recorded

   status exits 0 with the project brief the plan predicted; smoke --ios built the iOS
   dev client locally, opened the app through the athan:// link and reported zero runtime
   errors. FINDINGS.md carries both outputs verbatim, the not-run table, the machine notes
   (local Android debug builds blocked by a Gradle/AGP mismatch) and the five autonomous
   rulings.
   ```

   The hook runs the full suite; the log's last `Tests:` line ends `passed, <n> total` and the
   four `100%` coverage lines are present.
9. **Review.** `Code Reviewer` (GLM 5.3), isolation `worktree`, prompt:

   ```
   Run git checkout --detach <sha>. Review this docs commit: ai/features/agent-tooling/FINDINGS.md
   against ai/plans/13-agent-tooling/steps/1-agent-cli-findings.md. Check: the file carries the
   two command outputs verbatim from ~/athan-device-sweep/session13/agent-cli-status.txt and
   agent-cli-smoke.txt (read those two files), the four fixed status lines the plan predicts, the
   not-run table with all seven rows, the machine notes, the five rulings worded as the plan gives
   them, exactly two fenced code blocks, and nothing else changed in the commit. Reply merge or
   fix first.
   ```

   A "merge" verdict goes on. A "fix first" verdict is handled as `EXECUTOR-BRIEF.md` section 4,
   item 8 says; PLAN section 10's anticipated fixes 1 and 2 cover the findings this step can
   meet, and any other is a STOP.
10. **Merge.** `git checkout uat-2 && git merge --no-ff docs/agent-cli-findings -m "Merge docs/agent-cli-findings into uat-2: session 13 step 1, reviewed"`.
11. **Done when:** part 6's greps all print their lines and the count is `4`, `tsc` and Biome
    exit 0, the break script ended `ALL AS EXPECTED: 1`, the commit hook printed the `Tests:`
    and four `100%` lines, the reviewer said merge, and `~/athan-device-sweep/session13/` holds
    `agent-cli-status.txt` and `agent-cli-smoke.txt` with both `EXIT:0` lines.
