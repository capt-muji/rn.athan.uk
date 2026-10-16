# Ticket 122: The rewritten AVD and adb management in Expo CLI 58: evaluate for the Android harness

| Field | Value |
| --- | --- |
| Brief | Queue row 122: measure what the SDK 58 rewrite of `@expo/cli`'s AVD and adb management changes in practice, whether the e2e harness and the two build scripts should route through it, and whether an AVD lane belongs in the device matrix; she rules before any harness change |
| Planned at | `cf754b25` 2.0.886, 2026-10-16 |
| Planned by | lane 122 (agent-ruled frontier, standing hands-off order 2026-10-16) |
| Needs first | nothing |
| Parent | nothing |
| Group | none (docs-only; the queue row and the two tracked version files (package.json, app.json) serialize as lane weather) |
| Batch budget | 4 weight units |
| Session budget | 4 weight units (one lane session carries all four docs steps) |
| Steps count | 4 (all weight 1, docs) |
| Device | none (the row's own constraint: no device contact, no builds, no emulator boots this wave) |
| Owner decisions still needed | her ruling on the two questions in section 5 (the row ends with her ruling; no repo change before it) |

## 1. Goal

The owner read the SDK 58 changelog, saw "@expo/cli rewrote Android Virtual Device (AVD) and
adb management to be more resilient to failures", called it "very useful for this repo's
Android testing" and ordered this ticket. Nobody has measured what the rewrite actually does,
and this repo's Android harness drives four physical phones over raw `adb`, with no emulator
anywhere in it.

Today the harness carries a documented failure that the rewrite touches directly: `e2e/README.md:128`
records that `expo run:android --device` takes a device name and not an adb serial, because a
serial prebuilds and then fails. It carries no census of what else the rewrite changes. The
two build scripts produce APKs and never call adb at all, so nothing states whether they could
or should route device work through the CLI.

When DONE, the queue row carries: the rewrite's scope and behaviour at the installed version,
one row per axis the ticket names (discovery, boot, install, logcat stability), the harness's
own adb inventory against that behaviour, two questions each answered with options and one
recommendation, the named experiments a live phase would settle and the condition each waits
on, and the unverified list. No file outside `ai/plans/`, the queue row and the two tracked
version files changes before her word.

The owner's rules that govern, quoted:

- `ai/AGENTS.md:76-78`: "- EAS is read-only. Never build on EAS, never push to it. Reading
  configuration (`EXPO_PUBLIC_ENV`, `EXPO_PUBLIC_API_KEY`) is the whole permitted use. Builds
  happen locally on the OnePlus 3T and nowhere else."
- `ai/AGENTS.md:158-160`: "A screenshot reaches a screen. It never proves what is on one. A
  records claim needs a logcat line or a dump." and "`@expo/agent-cli`: `status` and
  `smoke --ios` only. Never `--eas`, `deploy`, `agents:setup` or `skills:sync`, and never
  `smoke --android` while a phone is connected."
- The row's own constraint: it ends with her ruling before any harness change.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who | When | Recorded |
| --- | --- | --- | --- | --- |
| D122.1 | The row's facts are pinned to the installed `@expo/cli` 58.1.10 with `expo` 58.0.12, verified from `node_modules/@expo/cli/build` first, the CLI's own `--help` surfaces second, the changelog entry and pull request `expo/expo#49258` third, and the docs MCP server last | agent-ruled | 2026-10-16 | here, FINDINGS sections 1 and 2; why: the ticket demands verification against the installed CLI, and the installed build is the only artefact that states what the code does |
| D122.2 | Live-command allowlist for the whole row: `npx expo --version`, `npx expo --help`, `npx expo start --help`, `npx expo run:android --help`, `$ANDROID_HOME/emulator/emulator -list-avds`, `$ANDROID_HOME/platform-tools/adb version`, and read-only `ls` of the SDK tree. Never run: any real `expo run:android` or `expo start --android`, `adb devices`, any emulator boot, any build, any install. The two external sources - the package changelog and the pull request's file list - are planning-measured, carried in FINDINGS with their URLs and the 2026-10-16 fetch date, and no step re-fetches them | agent-ruled | 2026-10-16 | here; why: the row bans device contact, builds and emulator boots, and every banned command reaches one of the three; the inventory commands touch no phone and start no process, and the external sources are already recorded |
| D122.3 | The four axes the ticket names are answered as they stand: discovery, boot, install and diagnostics change as FINDINGS section 2 records; logcat gains no handling at all, because the installed build contains zero logcat code (`grep -rni logcat node_modules/@expo/cli/build`, source maps excluded, printed no match), and the one logcat-relevant change is the removal of the adb server start and stop calls, which protects the harness's long-lived `adb logcat` streams from a CLI shutdown | agent-ruled | 2026-10-16 | here, FINDINGS section 2; why: the ticket asks what changes for logcat stability, and the measured answer is "no handling, one hazard removed", which the row must state rather than leave open |
| D122.4 | The deliverable folds into the queue row at DONE; no findings file survives, because nothing in shipped code or config will cite it. Precedent: rows 65, 66, 119 | agent-ruled | 2026-10-16 | here, section 8 |
| D122.5 | Question 1's recommendation is option B: keep every script on raw adb, correct the two stale `--device` lines, and document the serial install-and-launch path; argued twice in FINDINGS section 4 | agent-ruled | 2026-10-16 | here, FINDINGS section 4 |
| D122.6 | Question 2's recommendation is option B: one bounded AVD lane at the 3T's panel, flow smoke and disposable checks only, never a measurement witness; the system-image install is hers to authorise first; argued twice in FINDINGS section 4 | agent-ruled | 2026-10-16 | here, FINDINGS section 4 |
| D122.7 | No harness change lands in this row, including the two stale documentation lines: they are named inside option B and applied only after her ruling. Why this reading rather than the aggressive one: the row's own closing clause is "it ends with her ruling before any harness change", and a documentation line in `e2e/` is harness surface | agent-ruled | 2026-10-16 | here, section 10; why: the conservative reading cannot lose work, while applying a change the row forbids cannot be undone |
| D122.8 | Execution runs in the lane with no executor worker (all four steps are docs-weight measurement and writing with no red-green code loop); the grill and both audit reviewers are dispatched as workers | agent-ruled | 2026-10-16 | LOG.md; why: the planner and executor files carry the same step loop, and a cold worker adds nothing to a docs step while the grill and the blind audit are exactly the worker jobs that add rigour |

### 2.2 The executor must not decide

- A `node_modules/@expo/cli/package.json` version other than 58.1.10: STOP and report. The
  plan's line cites are pinned to that build; a lane that re-pinned the dependency moves them,
  and the lead re-verifies every line cite before any further step. A rebase after
  `yarn.lock` moves requires a fresh `yarn install` in the worktree under `commit.lock`.
- Any command from the D122.2 ban list: STOP before running it; report which step wanted it.
- A live command printing something FINDINGS does not predict: STOP and report the exact
  divergence; never widen the allowlist to investigate it.
- A harness change anywhere: STOP. The row forbids one before her ruling.

## 3. Pre-flight

`scripts/preflight-122.sh`, saved to `$TMPDIR` and executed from the worktree root
(`bash "$TMPDIR/preflight-122.sh"` with the working directory at the worktree root). It
checks: the worktree is on `lane/122` with a clean tree; `origin/uat` is fetched and the local
`uat` ref contains `cf754b25`; the version in `package.json` is not lower than 2.0.886; every
anchor under `scripts/anchors/` counts exactly 1 in its source file; the installed `@expo/cli`
is 58.1.10 and the rewrite's four added modules are present; and
`grep -rni logcat node_modules/@expo/cli/build` prints no match. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Files this row reads (none changes outside the plan folder):

- `ai/plans/README.md` - row 122, the standing parallel order, the status law.
- `ai/AGENTS.md` - the EAS rule (lines 76 to 78), the tool routing table (19 to 34), the
  constraints on the build scripts (143 to 150) and the device-testing rules (152 to 160).
- `e2e/README.md` - the harness's own description, the build command (line 43), the logcat
  stream (line 50) and the `--device` gotcha (lines 128 to 131).
- `e2e/AGENTS.md` - the same gotcha restated (line 17 to 18).
- `e2e/scripts/baseline-compare.sh`, `device-checks.sh`, `frame-audit.sh`, `idle-cpu.sh` -
  every tracked adb call site in the repository.
- `e2e/device-atlas-oneplus3t.md`, `device-atlas-oppo-findx8.md`, `device-atlas-sm-s911b.md`,
  `device-atlas-iphone-xs.md` - the fleet's install and launch recipes and its Android
  versions.
- `.opencode/agents/` and `.agents/skills/` - the lane protocol whose lock family and device
  rules any AVD lane would join.
- `$HOME/athan-gitree/bin/build-prod.zsh`, `build-mock.zsh`, `build-mock-ramadan.zsh`,
  `build-mock-variant.zsh` - the four build scripts, outside the repository, whose only Expo
  CLI surface is `npx expo prebuild`.
- `node_modules/@expo/cli/build/src/start/platforms/android/*` - the rewrite: `ADBServer`,
  `adbProcess`, `adb`, `adbDeviceList`, `adbEndpoint`, `adbDiagnostics`, `getDevices`,
  `emulator`, `AndroidDeviceManager`.
- `node_modules/@expo/cli/build/src/run/android/*` - the only command that reaches it.

Anchors, all under `scripts/anchors/`, each counting exactly 1 at the planned sha:

| Anchor | Source | What it fixes |
| --- | --- | --- |
| `e2e-readme-device-flag.md` | `e2e/README.md` | The stale `--device` gotcha |
| `baseline-serial-logcat.md` | `e2e/scripts/baseline-compare.sh` | The serial default and the long-lived logcat stream |
| `agents-md-build-locality.md` | `ai/AGENTS.md` | The build-locality rule |
| `agents-md-device-testing.md` | `ai/AGENTS.md` | The logcat-or-dump rule and the agent-CLI ban |
| `cli-serial-first.md` | `AndroidDeviceManager.js` | Serial before name |
| `cli-adb-server.md` | `ADBServer.js` | The removed server lifecycle and the bounded query default |
| `cli-bounded-timeout.md` | `adbProcess.js` | The bounded wait, the cleanup and the unknown-completion marker |
| `cli-avd-inventory.md` | `emulator.js` | The AVD list and its filtering |
| `cli-query-limits.md` | `adb.js` | The discovery wait limits, the retry window and the retry predicate |
| `cli-discovery-tolerance.md` | `getDevices.js` | A failed AVD listing tolerated while a device is attached |
| `cli-endpoint.md` | `adbEndpoint.js` | The endpoint resolution from the server-socket variables |
| `cli-diagnostics-advice.md` | `adbDiagnostics.js` | The per-state advice lines |
| `cli-binary-install.md` | `runAndroidAsync.js` | The `--binary` install path |

Facts planning already measured (recorded in FINDINGS sections 1 to 3):

- The rewrite landed in `@expo/cli` 58.0.0, 2026-09-10. Its file list: four added modules
  (`adbProcess`, `adbDeviceList`, `adbEndpoint`, `adbDiagnostics`) and six rewritten
  (`ADBServer`, `AndroidDeviceManager`, `adb`, `adbReverse`, `emulator`, `getDevices`),
  28 files with tests and fixtures.
- The installed build: query operations bounded at 10 s, the host probe at 4 s, mutations
  unbounded; SIGTERM then SIGKILL on cleanup; `start-server` and `kill-server` gone; devices
  matched by serial first; a `transport_id` change between discovery and use refused; the
  AVD list tolerant of failure while a device is attached; the emulator boot polled once a
  second against `init.svc.bootanim` under a 180 s ceiling.
- Zero logcat code in the whole CLI build.
- The harness's adb surface: 36 `adb` word hits across 10 files under `e2e/` - four shell
  scripts, three atlases, `e2e/README.md`, `e2e/AGENTS.md` and `e2e/scripts/idle_cpu.py` - with
  the seven Maestro flows calling adb nowhere; each of the four build scripts carries exactly
  one hit, a comment naming `adb install -r`, and no adb invocation.
- The local toolchain: adb 37.0.1, emulator 37.1.11.0, `emulator -list-avds` empty, no
  system image, platforms android-35, android-36 and android-37.0, an arm64 host, an app
  floor of API 24 against `targetSdkVersion 36`, and arm64-v8a-only build scripts.
- The fleet: the 3T on Android 9, the Find X8 and the S23 on Android 16, the 8T without an
  atlas.

Why the obvious answer is wrong: "the CLI rewrote this, so route the harness through it"
fails on scope, because the CLI implements no measurement operation the harness exists for -
its device management is a side effect of running an app, not a service, and it ships no
logcat handling at all.

## 5. Design

The investigation's shape, one section per question in FINDINGS: the question, the options
with the recommendation first, the two arguments, and the measured ground for each rejection.
The two questions are independent, so each carries its own recommendation and its own
decision record.

**Question 1, routing.** Recommended: option B, keep every script on raw adb, correct the two
stale `--device` lines, and document
`npx expo run:android --binary <apk> --device <serial> --no-bundler` as the install-and-launch
path for an APK that already exists. The rejected alternatives are named with their measured
grounds: routing the scripts (the CLI has no logcat, no dumpsys, no screenrecord and no
SurfaceFlinger surface, and every call would start and stop a Metro server), and copying the
resilience into an in-repo helper (no recorded incident asks for it, and the executor rule
already answers the hang class).

**Question 2, the AVD lane.** Recommended: option B, one bounded AVD lane at the 3T's panel
for flow smoke and disposable destructive checks, explicitly excluded from every measurement
claim. Rejected: the multi-API matrix (no measured coverage gap; two phones already run API
36) and "no lane, only document the boot path" (the lane needs the image either way).

The recommendation argued twice lives in FINDINGS section 4, once per question, each with the
challenge and the flip-check on the strongest rival.

**Acceptance criteria:**

- [R1.1] WHEN the executor reads the installed `@expo/cli` build tree THE SYSTEM SHALL show the four added modules (`adbProcess`, `adbDeviceList`, `adbEndpoint`, `adbDiagnostics`) present with their exported names, cited by path and line, and the six rewritten modules named.
- [R1.2] WHEN the executor runs `grep -rni logcat node_modules/@expo/cli/build | grep -v '\.map:' | wc -l` THE SYSTEM SHALL print `0`, and FINDINGS shall state that the rewrite carries no logcat handling.
- [R1.3] WHEN the executor reads `resolveFromNameAsync` THE SYSTEM SHALL show the device matched by `pid` before `name`, quoted by path and line.
- [R1.4] WHEN the executor runs `grep -rn -e start-server -e stop-server node_modules/@expo/cli/build` THE SYSTEM SHALL print exactly one line, the removal comment at `ADBServer.js:35`, and `grep -rn kill-server node_modules/@expo/cli/build` SHALL print no match.
- [R1.5] WHEN the executor reads FINDINGS sections 1 and 2 THE SYSTEM SHALL carry the changelog line with its version and date, the pull request number, and the module additions and modifications with their line counts, each marked as planning-measured on 2026-10-16 with its source URL.
- [R1.6] WHEN the executor reads the bounded waits in `adbProcess.js` and the wait limits in `adb.js` THE SYSTEM SHALL quote each constant with its value and its path and line.
- [R2.1] WHEN the executor runs `git grep -nw adb -- e2e` THE SYSTEM SHALL list every hit under `e2e/` with its file and line number, SHALL record that the seven Maestro flows call adb nowhere, and SHALL record that each of the four build scripts prints exactly one `grep -n adb` hit, the comment naming `adb install -r`, with no adb invocation.
- [R2.2] WHEN the executor runs `npx expo --help` and `npx expo run:android --help` THE SYSTEM SHALL show no device-inventory command and no emulator command, SHALL show the three agent-command names, and SHALL show the device flag documented as `-d, --device [device]`.
- [R2.3] WHEN the executor lists the local Android toolchain THE SYSTEM SHALL record the adb version, the emulator version, the empty AVD list with its exit code, the empty system-image directory, the installed platforms and the host architecture.
- [R3.1] WHEN the findings name a claim that only a live run settles THE SYSTEM SHALL record it as a numbered experiment with its command and the condition it waits on.
- [R3.2] WHEN the findings name a claim the installed source does not settle THE SYSTEM SHALL list it under the unverified heading with the step that would verify it.
- [R3.3] WHEN the findings present a question THE SYSTEM SHALL carry two to four options, one marked recommended, and one line of measured ground per rejected option.
- [R4.1] WHEN the queue row is updated at DONE THE SYSTEM SHALL carry both questions' options, the recommendation, the measured facts behind each, the named experiments and the unverified list.

## 6. Steps

Checklist (all four in this file, inline; the ledger in `LOG.md`):

- [ ] Step 1 CLI facts at the installed version (R1.1 to R1.6)
- [ ] Step 2 the harness inventory (R2.1 to R2.3)
- [ ] Step 3 the two questions, the experiments and the unverified list (R3.1 to R3.3)
- [ ] Step 4 the ruling pack (R4.1)

### Step 1 - CLI facts at the installed version

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R1.6
Weight: 1
Anchor check: all thirteen anchors count 1 in their sources (the pre-flight covers them). Goal:
FINDINGS sections 1 and 2 hold the rewrite's scope and per-axis behaviour, every claim carrying
its path and line. Branch: `docs/122-1-cli-facts` off `lane/122`, before its first edit run
`git fetch -q origin uat` and confirm the branch still bases on `lane/122`'s tip. Files:
`ai/plans/122-avd-adb/FINDINGS.md` (sections 1 and 2 refined in place from the READY-committed
draft), `ai/plans/122-avd-adb/LOG.md`, `ai/plans/README.md` (status IN PROGRESS, step 1), plus
the two tracked version files (package.json, app.json) under the version lock. Red tests: none, a docs step; the check
is the criteria below. Change contract: re-read each cited file at the installed version and
confirm every quoted line; re-run the logcat grep and record its count; re-run the
`kill-server`/`start-server` grep and record the single line. Green run: each criterion's
command prints what it predicts. Break script: none, a docs step with no code to break; the
done-when gate is the criteria. Version and commit: next patch after `uat`'s `package.json`
under the version lock, message
`<VERSION> - docs(plans): ticket 122 step 1, the CLI facts at 58.1.10`. Review: read the diff
cold against the installed source. Merge: `--no-ff` into `uat` under the uat lock, from the
main tree. Done when: R1.1 to R1.6 hold, every line cite re-checked.

### Step 2 - the harness inventory

Requirements: R2.1, R2.2, R2.3
Weight: 1
Anchor check: as step 1. Goal: FINDINGS section 3 carries every adb hit under `e2e/` with its
lines, the seven flows' measured absence of adb, the build scripts' single comment hit each and
their absent calls, the CLI surfaces the harness already uses, and the local toolchain
inventory. Branch: `docs/122-2-harness` off `lane/122`. Files: FINDINGS section 3, LOG.md,
`ai/plans/README.md` (step 2), plus the two tracked version files (package.json, app.json) under the lock. Change
contract: run `git grep -nw adb -- e2e` and reconcile the list against the section's table line
by line; run `grep -c adb` inside each of the four build scripts and record the counts; re-run
the D122.2 allowlist inventory commands and record each output. Green run: every hit the
sweep prints under `e2e/` appears in the table with its file and line, and the table names no
hit the sweep does not print. Expected outputs: the sweep prints 36 hits across 10 files
(measured 2026-10-16); each build script prints `1`, its comment naming `adb install -r`; the
AVD list prints nothing and exits 0. Review: as step 1. Merge: as step 1. Done when: R2.1 to
R2.3 hold. Version and commit as step 1, message
`<VERSION> - docs(plans): ticket 122 step 2, the harness inventory`.

### Step 3 - the two questions, the experiments and the unverified list

Requirements: R3.1, R3.2, R3.3
Weight: 1
Anchor check: as step 1. Goal: FINDINGS sections 4 and 5 hold both questions with their options, recommendations and
two arguments each, the five named experiments with their waiting conditions, and the six
unverified claims. Branch: `docs/122-3-questions` off `lane/122`. Files: FINDINGS sections 4
and 5, LOG.md, `ai/plans/README.md` (step 3), plus the two tracked version files (package.json, app.json) under the
lock. Change contract: for each rejected option write the measured fact that rejects it, from
sections 2 and 3; for each recommendation write the challenge and the flip-check on its
strongest rival; for each unverified claim name the step that verifies it. Green run: every
option carries either a citation or a measured line, and no claim stands without one. Review:
as step 1. Merge: as step 1. Done when: R3.1 to R3.3 hold. Version and commit as step 1, message
`<VERSION> - docs(plans): ticket 122 step 3, the two questions and the experiments`.

### Step 4 - the ruling pack

Requirements: R4.1
Weight: 1
Anchor check: as step 1. Goal: FINDINGS section 6 states what changes under each recommended option, and the queue
row's outcome text carries both recommendations, the measured grounds, the experiments and
the unverified list. Branch: `docs/122-4-ruling-pack` off `lane/122`. Files: FINDINGS section
6, LOG.md, `ai/plans/README.md` (EXECUTED, the outcome text), plus the two tracked version files
(package.json, app.json) under the lock. Change contract: the row text names question 1's option B and question
2's option B with one line of ground each, the two documentation lines, the system-image
install as the first ask-first act, the exclusion of every measurement claim from the AVD
lane, and, for the section 8 cell's experiment and unverified sentences, the five experiment
names E1 to E5 with their waiting conditions and the six unverified claim names U1 to U6.
Green run: the row text reads as a standalone answer to the row's three clauses
(discovery, boot and install as measured; logcat gains no handling with the server-lifecycle
hazard removed; routing and the AVD lane as recommended). Review: as step 1. Merge: as step 1.
Done when: R4.1 holds. Version and commit as step 1, message
`<VERSION> - docs(plans): ticket 122 executed: the ruling pack`. Finishing: set EXECUTED, the
executed docs commit, merge `--no-ff`, no push.

## 7. Device proof

None. The row's constraint is no device contact, no builds and no emulator boots this wave.
Every command in the D122.2 allowlist is read-only against the repository, the SDK tree or the
npm registry. The experiments that need hardware are named in FINDINGS section 5 with their
waiting conditions.

## 8. Records

- `LOG.md`: every step entry opens `### Step <NN> — <state>` and ends `session: <id>`;
  planning sections use `## Planning (2026-10-16)` and `## Ticket 122`.
- The queue cell the lead applies on DONE (draft, refined by what execution measures):
  `DONE 2026-10-16, audited: the AVD/adb evaluation answers at the installed @expo/cli 58.1.10
  (expo 58.0.12; the rewrite landed in 58.0.0, 2026-09-10, expo/expo#49258, 28 files: added
  adbProcess, adbDeviceList, adbEndpoint, adbDiagnostics; rewritten ADBServer,
  AndroidDeviceManager, adb, adbReverse, emulator, getDevices). What changes in practice:
  discovery retries the transient adb-server messages inside a 10 s deadline and tolerates a
  failed AVD listing while a device is attached; a device is matched by serial first and by
  name only as a fallback, so the harness's own "--device takes a name, not a serial" gotcha
  (e2e/README.md:128) is cured; boot spawns the emulator detached and polls once a second
  against init.svc.bootanim under a 180 s ceiling; installs stay unbounded (`adb install -r -d
  --user 0`) while queries are bounded at 10 s and a cancelled mutation says so; the CLI no
  longer starts or stops a shared adb server, which protects the harness's long-lived logcat
  streams; and logcat gains no handling at all - the CLI ships zero logcat code. Neither the build
  scripts nor the harness scripts should route through it: the four build scripts call adb
  nowhere, and the CLI implements none of the measurement operations the scripts exist for.
  Recommendations for her ruling: question 1, keep raw adb and correct the two stale
  --device lines plus document `npx expo run:android --binary <apk> --device <serial>
  --no-bundler` as the install-and-launch path (option B); question 2, one bounded AVD lane at
  the 3T's panel for flow smoke and disposable destructive checks, excluded from every
  measurement claim, opening with an ask-first system-image install (option B). The five named
  experiments and the conditions they wait on: E1 the serial install path (a phone, an
  existing APK, build.lock), E2 the AVD boot end to end (the system-image install, an AVD, an
  APK), E3 the device-free failure text (no phone attached), E4 the logcat stream against a CLI
  shutdown (an @expo/cli below 58.0.0), E5 the AVD flow replay (E2). Unverified: U1 the old
  CLI's exact failure for `--device <serial>`, U2 the system image's size, U3 the binary path's
  Metro shutdown, U4 the bounded query limit on the fleet, U5 emulator support in the
  automation beyond its documentation, U6 the 8T's Android version. No repo change before her
  word.`
- Docs commit messages: per step, `<VERSION> - docs(plans): ticket 122 ...` as section 6
  gives them.

## 9. Push

None. The lane never pushes; the orchestrator pushes `uat` when every unpushed commit is
audited.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| `node_modules/@expo/cli/package.json` reads a version other than 58.1.10 | STOP and report; the line cites are pinned to 58.1.10 and every one is re-verified before further steps |
| A rewrite module is missing from the installed build | STOP: a lane re-pinned the dependency mid-run; the plan re-pins its line cites first |
| The logcat grep prints a match | STOP: the FINDINGS claim that the CLI ships no logcat handling is wrong, and the row's logcat axis is rewritten before continuing |
| A step wants a command from the D122.2 ban list | STOP and report which step; never widen the allowlist |
| A merge conflict on `ai/plans/README.md` or the two tracked version files (package.json, app.json) | Lane weather: abort, rebase onto `uat`, keep both lanes' rows and the higher version, retry once, then STOP if it still conflicts |
| The pre-commit hook's `Tests:` line missing or coverage below 100 | Never commit; read the hook log first |
| A lane lands a harness change while this row runs (the two stale lines) | Record it in `LOG.md` and continue; the row's recommendation then names what remains |

Anticipated review fixes, word for word: none expected beyond records wording; any finding
lands in `AUDIT.md` with its verdict.

Restore lists: every step's diff touches only `FINDINGS.md`, `LOG.md`, the queue row and the
two tracked version files (package.json, app.json) on its own branch; `git checkout lane/122 -- .` inside the worktree
restores the prior state, and an unmerged branch deletes with `git branch -D`.

## 11. Subagents

Planning: fact questions were measured directly by the lane (the installed source, the CLI's
own output and the toolchain are the primary sources); `athan-plan-griller` grills this draft
cold. Delivery: the lane executes all four docs steps itself (D122.8), recorded in `LOG.md`;
the audit dispatches one `athan-reviewer` blind (the diff plus `ai/AGENTS.md`, re-running the
allowlist commands and the greps to reproduce every number) and one `athan-reviewer`
plan-conformance (this folder plus the diff). `vision` is not needed; no image arises.

## 12. Report to the owner

Plain sentences: the rewrite is measured at the installed 58.1.10; discovery, selection, boot,
install and diagnostics are materially better, logcat gains no handling while the server
start and stop calls are gone (which protects the harness's own logcat streams), and the
harness's own `--device` gotcha is cured by the serial-first change. The
harness and the build scripts should not route through it, because the CLI implements none of
the measurement operations they exist for, and the four build scripts never call adb at all;
the concrete change is two stale documentation lines and one documented install path. One
bounded AVD lane is worth having for flow smoke and disposable checks, at the cost of an
ask-first system-image install, and it must never stand in for a phone proof. Then the
progress table, then the handoff block the lane's final return carries.
