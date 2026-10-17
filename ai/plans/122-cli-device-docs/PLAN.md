# Ticket 122: correct the two stale `--device` lines in the harness docs

| Field | Value |
| --- | --- |
| Brief | Queue row 122 (order 122), ruling taken 2026-10-16: keep raw adb, correct the two stale `--device` lines, document the install-and-launch path. The AVD half of the row is superseded by row 133's ruling to adopt one bounded lane; row 133 owns those rules. |
| Planned at | `1788e83c`, version 2.0.969, date 2026-10-17 |
| Planned by | lane 122 (planning) |
| Needs first | nothing |
| Parent | none |
| Group | none (e2e docs only; lane 120 holds `shared/notifications.ts` and its plan folder, lane 126 holds `board/`; the queue file and the three version files are the shared surfaces the lock family serializes) |
| Batch budget | 1 |
| Session budget | 2 |
| Steps count | 1 |
| Device | none (her ruling: no phones, no builds, no device work) |
| Owner decisions still needed | none (the ruling is taken in the row) |

## 1. Goal

`e2e/README.md:133-136` and `e2e/AGENTS.md:17-18` claim `expo run:android
--device` takes a device NAME, not an adb serial. At the installed
`@expo/cli` 58.1.10 that claim is false: the CLI matches an attached device by
serial first and by name only as a fallback, and it accepts a prebuilt APK
through `--binary`. Two readers effects follow today: the docs send the
harness builder to a slower route for installs, and the docs state a trap the
CLI cured at 58.0.0 (expo/expo#49258).

When DONE, both files state the serial-first truth, both name
`npx expo run:android --binary <apk> --device <serial> --no-bundler` as the
install-and-launch path, the gradle-plus-adb build route stays, and nothing
else in either file changes. The owner notices the next time an agent
installs a built APK by the documented line instead of hand-rolling
`adb install -r` plus `am start`.

The owner's rules that apply, from queue row 122, her ruling taken 2026-10-16
(written into the row by the 111 planning session):

> keep raw adb, correct the two stale --device lines, no AVD lane for now

and the dispatch's scope fence: ticket 133 owns the adopted AVD lane's rules
when it runs, so this plan writes no AVD rule into the harness docs. The
`ai/AGENTS.md` rules on writing style and placeholders apply to the new text.
`e2e/AGENTS.md` loads on touching e2e files; its traps were read in full.

## 2. Decisions

### 2.1 Taken

| # | Decision | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D1 | Replace the README gotcha bullet with the corrected claim rather than deleting it: the ruling keeps every script on raw adb, so the gradle build route and the `dumpsys package ... | grep versionName` check stay; the cured trap (a serial prebuilds then fails, a tail pipe hides the exit code) goes, because the failure mode it described no longer exists at 58.1.10. Challenge: deleting the whole bullet is leaner. Answer: the bullet's build advice is live and ruling-backed; deleting live advice to remove one stale sentence loses more than it saves. | agent-ruled | 2026-10-17 | this section |
| D2 | Both files carry the corrected claim and the install-and-launch command; the README bullet adds one parenthetical that the CLI's own help text still reads "Device name" while the code matches the serial first, so a reader of `expo run:android --help` does not distrust the doc. The AGENTS.md line stays a four-line bullet with no parenthetical. | agent-ruled | 2026-10-17 | this section |
| D3 | One docs step, weight 1, one commit for both files: the correction is one fact landing in two files; splitting it doubles the version burn and the review surface without isolating anything. | agent-ruled | 2026-10-17 | this section |
| D4 | The exact replacement text is given verbatim in step 1 (the executor pastes it); the wording was measured against the CLI source at 58.1.10 and against each file's voice and wrap width. | agent-ruled | 2026-10-17 | step 1 |
| D5 | The plan's version command is union max plus 1 across `origin/uat..uat` non-merge commits and every live lane branch, per the lane 125 gate; the pre-commit hook re-refuses collisions. | agent-ruled | 2026-10-17 | step 1 |

### 2.2 The executor must not decide

- The replacement wording: it is given verbatim. A wording that reads wrong at
  execution is a `STOP:` return, never a local edit.
- Any edit outside the two fenced passages: files, lines or the queue row's
  other cells. A second stale line found anywhere is a `STOP:` return naming
  it, never a drive-by fix.
- Any contact with a phone, the emulator, or a build script: her ruling bans
  all three for this ticket.

## 3. Pre-flight

Committed at `scripts/preflight-122.sh` in this folder. The executor saves a
copy to `$TMPDIR` and runs it from there with the worktree path as the only
argument. It checks the worktree is on the lane branch at or past `1788e83c`,
the tree is clean, `origin` is fetched, the version in `app.json` is not lower
than 2.0.969, the installed `@expo/cli` is 58.1.10 (a different version is a
`STOP:` return: the doc claim was measured at this version), each anchor
counts exactly 1, and no `AVD` string exists in either target file. It ends
`PREFLIGHT OK`.

## 4. Background the executor needs

Code map, one line per file:

- `e2e/README.md` - the harness manual; the stale passage is the gotcha bullet
  at lines 133-136 of the `1788e83c` checkout (the queue row cites 128-131
  from investigation time; lines shifted since). Anchor
  `scripts/anchors/readme-stale.md`.
- `e2e/AGENTS.md` - the rules file loaded on touching e2e files; the stale
  passage is lines 17-18. Anchor `scripts/anchors/agents-stale.md`.
- `node_modules/@expo/cli/build/src/start/platforms/android/AndroidDeviceManager.js`
  - the matching law, measured at 58.1.10 inside `resolveFromNameAsync`:
  `const device = devices.find((device)=>device.pid === query) ?? devices.find((device)=>device.name === query);`
  Serial (`pid`) first, name only as a fallback. The miss error prints the
  device list and says `Pass a device serial from \`adb devices\` or a name
  from the list above to --device.` Not a plan anchor (the file is not
  tracked); the pre-flight pins the version instead.
- `node_modules/@expo/cli/build/src/run/android/index.js` - the flags: line 81
  parses `--no-bundler` ("Skip starting the bundler", help line 109); line 113
  prints the CLI's own stale help `-d, --device [device]  Device name to run
  the app on`, which the corrected doc names so the reader is not misled.
- `node_modules/@expo/cli/build/src/run/android/runAndroidAsync.js` - the
  install-and-launch path: lines 143-150, `--binary` checks the path exists
  and installs it through `props.device.installAppAsync(binaryPath)` (no
  gradle), then `openCustomRuntimeAsync` launches; with `--no-bundler` the
  manager stops after launch and no Metro stays up.

How the pieces interact: nothing executes these two passages; they are prose
read by every agent that builds or installs for the Android harness, which is
why a wrong claim there costs real time (the row records the investigation's
measured grounds). The existing tests: none cover markdown docs; `yarn
validate` gates the commit (tsc, Biome, Jest all green; the version lockstep
test reads `app.json` and `package.json`, and the worktree carries no
`android/` directory so the lockstep test takes its absent-file branch there;
the main tree's gitignored `android/app/build.gradle` is synced by the lane
after merge under the build lock).

Why the obvious fix is wrong: deleting the two passages outright is the
obvious fix and D1 rejects it for the README (live, ruling-backed advice sits
in the same bullet); and leaving the NAME claim anywhere would keep sending
readers to the slower route the ruling retires.

## 5. Design

The two fenced passages are replaced by the step's verbatim text; nothing
else in either file changes. The invariant, one sentence a command can check:
after the step, grepping both files for `takes a device NAME` finds nothing,
and grepping both for `npx expo run:android --binary` finds one line in each.

Alternatives rejected:

- Route the harness scripts through the CLI's adb layer: rejected by her
  ruling (keep raw adb); also measured in the row: the CLI ships no logcat,
  dumpsys, screenrecord or SurfaceFlinger surface.
- Delete both passages: rejected (D1): live build advice dies with the stale
  sentence.
- Write the AVD lane rules now: rejected; row 133 owns them, and its ruling
  postdates this row's own "no AVD lane" half.

Concurrency trace: none; two prose files, one writer, the lane's lock family
serializes the queue file and the version files against lanes 120 and 126.

Design review: the change is two fenced passages; the risk is wording drift
from the CLI truth, killed by the pre-flight version pin plus the grader's
grep commands.

**Acceptance criteria:**

- [R1.1] WHEN `grep -F "takes a device NAME" e2e/README.md e2e/AGENTS.md` runs at the step commit THE SYSTEM SHALL print no match and exit 1 (the stale claim is gone from both files).
- [R1.2] WHEN `grep -F "matches an adb serial first" e2e/README.md e2e/AGENTS.md` runs at the step commit THE SYSTEM SHALL print one matched line in each file.
- [R1.3] WHEN `grep -F "npx expo run:android --binary <apk> --device <serial> --no-bundler" e2e/README.md e2e/AGENTS.md` runs at the step commit THE SYSTEM SHALL print one matched line in each file.
- [R2.1] WHEN `yarn validate` runs in the step worktree at the step commit THE SYSTEM SHALL exit 0.
- [R3.1] WHEN queue row 122 is read at the step commit THE SYSTEM SHALL carry `IN PROGRESS, step 1` as its leading status, and neither target file contains the string `AVD`.

## 6. Steps

Checklist:

- [x] Step 1 - the two stale `--device` passages replaced (docs)

### Step 1 - the two stale `--device` passages replaced

Requirements: R1.1, R1.2, R1.3, R2.1, R3.1
Weight: 1

Anchor check: `python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/122-cli-device-docs/scripts/anchors/readme-stale.md e2e/README.md`
prints `1` and the same command with `agents-stale.md` against `e2e/AGENTS.md`
prints `1`. Any other count is a STOP.

Goal: both files state the serial-first truth and name the install-and-launch
path.

Branch: `docs/122-device-lines` off the lane branch `lane/122` in the
worktree `$HOME/athan-gitree/worktrees/lane-122` (the lane branch sits at or
past `1788e83c`; the lane merges into `uat` in the main tree, never the
executor).

Files: `e2e/README.md`, `e2e/AGENTS.md`, `app.json`, `package.json`,
`ai/plans/README.md` (row 122: replace only the leading `PLANNING
2026-10-17` with `IN PROGRESS, step 1`; the `four docs steps` fragment
behind `::` is dead-plan history and dies when the DONE cell replaces the
cell), this plan folder's `PLAN.md` checklist tick and `LOG.md`.

Red tests (docs step; the greps are the red): before the change, run and
record in `LOG.md`:

```bash
grep -cF "takes a device NAME" e2e/README.md e2e/AGENTS.md
# expected: e2e/README.md:1 AND e2e/AGENTS.md:1 (the stale claim present)
grep -cF "npx expo run:android --binary" e2e/README.md e2e/AGENTS.md
# expected: e2e/README.md:0 AND e2e/AGENTS.md:0 (the new line absent)
```

Any other counts are a STOP.

Change contracts: replace the anchored passage in `e2e/README.md` with exactly:

```markdown
- **`expo run:android --device` matches an adb serial first, a device name
  only as a fallback** (@expo/cli 58; the CLI's own help text still says
  "Device name", the code matches the serial before the name). Install and
  launch a built APK with
  `npx expo run:android --binary <apk> --device <serial> --no-bundler`.
  Building stays on `./gradlew assembleRelease` + `adb install -r`, and check
  `dumpsys package com.mugtaba.athan | grep versionName` before measuring.
```

Replace the anchored passage in `e2e/AGENTS.md` with exactly (the first
two lines are the Idle bullet the anchor carries; replacing the anchor
without them would delete a live rule):

```markdown
- **Idle is measured past the mock window**: at least 5.5 minutes after cold launch,
  daytime only. Between 00:00 and 06:00 the mock Isha rolls early.
- `expo run:android --device` matches an adb serial first, a name only as a
  fallback (@expo/cli 58). Install and launch a built APK with
  `npx expo run:android --binary <apk> --device <serial> --no-bundler`;
  building stays on `./gradlew assembleRelease` and `adb install -r`.
```

Nothing beyond these two replacements.

Green run: the red commands inverted, recorded in `LOG.md`:

```bash
grep -cF "takes a device NAME" e2e/README.md e2e/AGENTS.md
# expected: no match in either file (grep exits 1)
grep -cF "npx expo run:android --binary <apk> --device <serial> --no-bundler" e2e/README.md e2e/AGENTS.md
# expected: e2e/README.md:1 AND e2e/AGENTS.md:1
grep -cF "matches an adb serial first" e2e/README.md e2e/AGENTS.md
# expected: e2e/README.md:1 AND e2e/AGENTS.md:1
grep -c "AVD" e2e/README.md e2e/AGENTS.md
# expected: no match in either file
```

Then `yarn validate` in the worktree exits 0.

Break script, saved to `$TMPDIR/break-122.sh` and run with `bash` from the
worktree root:

```bash
#!/usr/bin/env bash
set -u
cd "$HOME/athan-gitree/worktrees/lane-122"
s=0
grep -qF "takes a device NAME" e2e/README.md e2e/AGENTS.md && { echo "STALE REMAINS"; s=1; }
grep -qF "npx expo run:android --binary <apk> --device <serial> --no-bundler" e2e/README.md || { echo "README MISSING NEW LINE"; s=1; }
grep -qF "npx expo run:android --binary <apk> --device <serial> --no-bundler" e2e/AGENTS.md || { echo "AGENTS MISSING NEW LINE"; s=1; }
grep -q "AVD" e2e/README.md e2e/AGENTS.md && { echo "AVD RULE LEAKED"; s=1; }
git status --porcelain | grep -vE '^([ MAR?]{2} )?(e2e/README.md|e2e/AGENTS.md|app.json|package.json|ai/plans/README.md|ai/plans/122-cli-device-docs/)' && { echo "UNEXPECTED FILE TOUCHED"; s=1; }
[ "$s" = 0 ] && echo "ALL AS EXPECTED: 1"
```

It must end `ALL AS EXPECTED: 1`; any other line is a STOP.

Version: fetch `origin` under `$HOME/athan-gitree/version.lock` (mkdir
pattern, retry in `sleep 15` cycles, at most 40 cycles; a 41st failed cycle
returns `STOP: BLOCKED, version.lock held ten minutes`, because one bump
holds the lock across its whole commit-and-merge cycle). Remove the lock the
moment the bump is written.
The version is the union max plus 1: the highest `expo.version` in `app.json`
across `git show uat:app.json`, every local branch's `app.json`, and every
non-merge commit in `origin/uat..uat`, plus 1. Write the bump as one script,
saved to `$TMPDIR/version-122.sh`:

```bash
#!/usr/bin/env bash
set -eu
cd "$HOME/athan-gitree/worktrees/lane-122"
git fetch -q origin uat
versions() {
  git show uat:app.json
  git for-each-ref --format='%(refname:short)' 'refs/heads/' | while read -r b; do
    git show "${b}:app.json" 2>/dev/null || true
  done
  git log origin/uat..uat --no-merges --format=%H | while read -r sha; do
    git cat-file -p "${sha}:app.json" 2>/dev/null || true
  done
}
versions | python3 -c '
import json, sys
best = (0, 0, 0)
buf = ""
depth = 0
for ch in sys.stdin.read():
    buf += ch
    depth += ch == "{" 
    depth -= ch == "}"
    if depth == 0 and buf.strip():
        try:
            v = json.loads(buf)["expo"]["version"]
            a, b, c = (int(x) for x in v.split("."))
            best = max(best, (a, b, c))
        except Exception:
            pass
        buf = ""
print(f"{best[0]}.{best[1]}.{best[2] + 1}")
'
```

Expected output at planning time: `2.0.970` or higher (siblings bump
concurrently; any number the script prints is the free next patch). Set the
printed value in `app.json` and `package.json` (both tracked; the worktree
carries no `android/` directory, so the gitignored third file is the lane's
to sync in the main tree after merge, under `$HOME/athan-gitree/build.lock`).

Commit: hold `$HOME/athan-gitree/commit.lock` (mkdir pattern, `sleep 15`
retry cycles) around the commit; the pre-commit hook runs
`check-version-uniqueness.js`, `check-identifiers.js --staged`, lint-staged,
`yarn validate` and `check-changed-coverage.js --staged` and takes minutes:
run `git commit -F "$TMPDIR/msg-1.txt"` in the background with output to a
log and wait for it inside the turn. Message file content, with `<VERSION>`
replaced:

```
<VERSION> - docs(e2e): ticket 122 corrects the stale --device lines; serial-first matching and the --binary install path documented
```

A commit whose log carries no `Tests:` line is unhooked by lane rule: rerun
`yarn validate` by hand, record its tail in `LOG.md`, and only then continue.
Add files by name only: the five listed paths plus this plan folder's changed
files.

Review: read `git show <sha>` cold against this checklist: the two passages
match the contracts byte for byte; no other line of either file changed
(`git show --stat` lists exactly `e2e/README.md`, `e2e/AGENTS.md`,
`app.json`, `package.json`, `ai/plans/README.md`, plan folder files); the
queue row's other cells are untouched; no `AVD` string was introduced.

Merge: the executor does not merge into `uat`. The lane merges
`docs/122-device-lines` into `uat` in the main tree under
`$HOME/athan-gitree/uat.lock` (`git fetch -q origin uat`, run
`node scripts/check-version-uniqueness.js` after the fetch and before the
merge, `git merge --no-ff`), then fast-forwards `lane/122` to the merge and
syncs the gitignored `android/app/build.gradle` `versionName` under
`$HOME/athan-gitree/build.lock`. A conflict on the queue file or the version
files is lane weather: abort, rebase onto `uat`, keep both lanes' rows and
the higher version, retry once, STOP if it still conflicts.

Done when (executor): the break script ends `ALL AS EXPECTED: 1`, `yarn
validate` exits 0, the checklist box above is ticked and `LOG.md` carries
the entry. The lane then merges per the Merge paragraph; the merge is not
the executor's to wait on.

## 7. Device proof

None, by her ruling: no phones (the 3T carries an armed 04:35 alarm tonight
and the XS is mid-proof for lane 120), no builds, no emulator. The proof is
the grep commands in step 1 against the CLI source quotes in section 4,
pinned to 58.1.10 by the pre-flight.

## 8. Records

The findings text written into `LOG.md` under `### Step 01 — executed`:

```
Step 1 done at <VERSION>: both stale --device passages replaced.
Red: "takes a device NAME" counted 1 in each file before the change;
"npx expo run:android --binary" counted 0 in each.
Green: stale gone (grep exit 1), new line counted 1 in each file,
serial-first line counted 1 in each file, no AVD string, yarn validate exit 0.
Break: ALL AS EXPECTED: 1. Hook output tail recorded above.
```

The queue cell text the lane applies on DONE (Status column, replacing the
current cell; the lane checks at the DONE commit that the cell equals this
text with the values filled):

```
DONE 2026-10-17, audited: the two stale --device lines are corrected to the
measured truth at the installed @expo/cli 58.1.10 and the install-and-launch
path is documented. e2e/README.md and e2e/AGENTS.md now state that
`expo run:android --device` matches an adb serial first and a device name
only as a fallback (the CLI's own help text still says "Device name"; the
code at AndroidDeviceManager.resolveFromNameAsync matches `device.pid ===
query` before `device.name === query`), and both name `npx expo run:android
--binary <apk> --device <serial> --no-bundler` as the install-and-launch
path (--binary installs the APK without gradle, --no-bundler leaves no Metro
up, runAndroidAsync.js:143-150 at 58.1.10). The gradle-plus-adb build route
and the dumpsys versionName check stay (her keep-raw-adb ruling). No AVD
rule was written: row 133 owns the adopted lane's rules. One docs step at
<VERSION>, two-reviewer audit, no code, no device, no build. The AVD half of
this row's own ruling is superseded by row 133's adoption ruling.
```

Docs commit message for the DONE commit:

```
<VERSION> - docs(plans): ticket 122 DONE, the two stale --device lines corrected; plan folder and evidence die here
```

## 9. Push

None. The executor worker never pushes. The lane never pushes. The
orchestrator pushes `uat` when every unpushed commit is audited.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| Pre-flight prints a different `@expo/cli` version than 58.1.10 | STOP: return `NEEDS_CONTEXT: NEEDS REPLAN, @expo/cli at <version>, the doc claim was measured at 58.1.10` |
| An anchor count is not 1 | STOP: return `NEEDS_CONTEXT: NEEDS REPLAN, <anchor> count <n>` |
| `yarn validate` fails on tsc, Biome or Jest | STOP: quote the first failing line; the step changed no code, so any failure is a plan defect or a sibling's merge, never fixed locally |
| The break script prints any line but `ALL AS EXPECTED: 1` | Fix nothing; STOP with the printed line |
| Merge conflict on the queue file or the version files | Lane weather: abort, rebase onto `uat`, keep both lanes' rows and the higher version, retry once, STOP if it still conflicts |
| A second stale `--device` or NAME claim appears anywhere in either file | Leave it; STOP naming it; the scope fence binds |

Anticipated review fixes, word for word:

- If the blind reviewer finds the README parenthetical too long: shorten to
  `(@expo/cli 58; the CLI's own help text still says "Device name")`, one
  line saved, meaning kept.
- If a reviewer finds the phrase "Install and launch a built APK" unclear:
  it stays; the ruling's own words are "install-and-launch path" and the
  command carries the meaning.
- If a reviewer flags the missing `dumpsys` check in `e2e/AGENTS.md`: not a
  defect; the AGENTS.md bullet never carried it and the README keeps it.

Restore list: `git checkout -- e2e/README.md e2e/AGENTS.md app.json
package.json` in the worktree; delete the step branch if unmerged.

## 11. Subagents

Planning: `explore` for fact questions (none remained: the facts were
measured directly from `node_modules` in this lane), `athan-plan-griller` for
the grill. Delivery: the lane dispatches the `athan-executor` for step 1 and
the two `athan-reviewer` passes (blind and plan-conformance). Every worker
may call `vision` for an image it cannot see. Nothing else, ever.

## 12. Report to the owner

Plain sentences: the two stale lines are corrected, the install-and-launch
path is documented, nothing else changed, the audit found <n> findings and
fixed <m>. Progress table and the four-line handoff close the run report.
Decisions waiting on the owner: none.
