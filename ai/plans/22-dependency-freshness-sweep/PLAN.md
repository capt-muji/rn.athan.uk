# Plan: Session 22. Dependency freshness sweep

| Field | Value |
| --- | --- |
| Brief | `ai/plans/README.md`, "How a dependency upgrade is split into sessions" (owner, 2026-09-25), queued as the next session by the owner on 2026-09-26 |
| Planned at | `55df8421` (version 1.28.25), 2026-09-26 |
| Planned by | Planning session on 2026-09-26 |
| Needs first | 20 (session 21, DONE) |
| Steps | 2, each one branch, one commit, one version |
| Device | None. Neither package reaches a phone: one is TypeScript typings erased at build, the other is a commit-time tool that never enters a bundle |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

Session 21 put every non-SDK package on its absolute latest release on 2026-09-25. A day later the registry has moved
on, and the job of this session is to re-measure every one of them and ship whatever has drifted. The measurement was
run while planning: **28 of 30 non-SDK packages are still at their absolute latest, and two have moved**,
`@types/node` 26.6.2 to 26.6.3 and `lint-staged` 17.5.1 to 17.6.0. When this plan is DONE, both sit at their latest
and the full gate is green. The owner would notice nothing in the app, which is the expected result for a sweep: the
value is the measurement, and the proof that nothing is quietly rotting.

The owner's rules that apply, quoted:

🐋  "I want to absolutely update all my packages to the latest versions, okay? In the latest version, that's what I'm
asking you to do." (owner, 2026-09-26, while planning this session). This settles the scope: both movers ship, and no
extra flag, option or hardening rides along with them.

🐋  "the longer we leave a package out of date, the more security risks it has and the harder it becomes to upgrade."
(owner, 2026-09-25). This is why a one-patch drift is still shipped rather than waited on.

🐋  "address each package in its own branch. So do 1 package at a time, and in its own branch, just each package,
updating it to the latest, absolute latest version" (owner, 2026-09-25). Two packages, so two branches and two
commits, even though both are trivial.

## 2. Decisions

### 2.1 Taken

1. **Both movers ship, and nothing else rides with them.** Owner, 2026-09-26, quoted above. The planner offered to add
   `--hide-unstaged` to the pre-commit hook alongside the `lint-staged` bump, as a guard against that release's new
   auto-staging behaviour. The owner declined the framing and asked only for latest versions. The guard is therefore
   NOT in this plan, and section 5 records the measurement that shows it is not needed here.
2. **`@types/node` moves to 26.6.3.** Planner, from the registry: released 2026-09-25, and the `latest` dist-tag.
   `ai/AGENTS.md` notes this package is deliberately ahead of its own `latest` tag at times because that tag tracks the
   Node LTS line; the note does not apply here, because 26.6.3 IS the current `latest` and is newer than what is
   installed.
3. **`lint-staged` moves to 17.6.0.** Planner, from the registry: released 2026-09-26, a minor. Its dependencies are
   byte-identical to 17.5.1's (`tinyexec@^1.3.1`, `picomatch@^4.0.7`, `string-argv@^0.3.2`) and its `engines.node`
   floor is unchanged at `>=22.22.1`, which this machine's v24.14.1 clears.
4. **Babel stays at 7, and this is not re-litigated.** Planner, re-verified against the installed tree on 2026-09-26:
   `babel-preset-expo@58.0.3` still depends on 36 Babel 7 packages, and `@react-native/babel-preset@0.88.0-rc.0` still
   pins `@babel/core ^7.25.2`. The four `@babel` packages therefore stay where `ai/plans/README.md` row 18 puts them,
   with the SDK 58 stable re-pin. Re-measured, not assumed: the check is in section 5.
5. **The SDK-pinned set is out of scope.** Planner, applying the owner's standing boundary from session 21 decision 6.
   `expo/bundledNativeModules.json` is the mechanical test. `npx expo install --check` reports 18 packages as
   outdated on 2026-09-26; every one of them is SDK-pinned or deliberately ahead, so all 18 belong to row 18.
6. **No device proof.** Planner. Session 21 proved both phones against a tree that included `@types/node` and
   `lint-staged` at the versions this session moves from. Neither package can reach a phone: `@types/node` is
   TypeScript typings, erased at build, and `lint-staged` runs at commit time and is never bundled. The owner also
   recorded on 2026-09-26 that the Find X8 has gone back to them, and `ai/plans/README.md` row 21 already says this
   session needs no device.
7. **No new test is written.** Planner. Neither bump changes a decision this project's code makes, so there is no new
   behaviour to pin. The existing suite at 100% coverage is the guard, and section 6's steps re-run it in full.

### 2.2 The executor must not decide

1. Any anchor count other than 1. Ask: "Anchor `<file>` counted `<n>`, not 1. The plan is stale. Should I set the row
   to NEEDS REPLAN?"
2. A test failing that this plan does not expect. Ask: "`<test name>` failed and the plan does not predict it. The
   failure line is `<line>`. What should it be?"
3. A break printing `BREAK NOT APPLIED`. Ask: "Break `<label>` changed nothing, so the substitution no longer matches
   the code. Should I set the row to NEEDS REPLAN?"
4. A reviewer finding that section 10 does not answer and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8.
5. **A package whose latest version changed between this plan and the run.** The versions in section 6 were read on
   2026-09-26. Ask: "`<package>` latest is now `<new>`, not the `<planned>` this plan names. Should I take the newer
   one?"
6. **A new major appearing in a bump this plan calls a patch or a minor.** Ask the same question as item 5.
7. **A third package having moved by the time the run starts.** The sweep's measurement is section 5's table. Ask:
   "`<package>` has moved to `<new>` since this plan was measured. Should it get a third step?"
8. Anything the step does not answer that the executor would otherwise have to decide, with the question "The plan
   does not say `<X>`. What should it be?"
9. Anything touching visuals, prayer times, `releases.json`, `uat` or EAS.

## 3. Pre-flight

Saved to `$TMPDIR/preflight-22.sh` and run as `bash $TMPDIR/preflight-22.sh <k>`. Given in full in
`scripts/preflight.sh`.

## 4. Background the executor needs

### Code map

| File | What it does | Which step changes it |
| --- | --- | --- |
| `package.json` | Holds both version strings, and the `lint-staged` task config block | both steps |
| `yarn.lock` | The resolved tree; `yarn add --dev` rewrites it | both steps |
| `app.json` | Carries `expo.version`, bumped in lockstep with `package.json` | both steps |
| `.husky/pre-commit` | Runs `npx lint-staged`, then `yarn validate`, then the coverage gate | neither; read only |
| `shared/__tests__/qualityGate.test.ts` | Pins the gate's shape, including that the hook runs `lint-staged` | neither; it must keep passing |

Neither step edits a source file. `@types/node` has no runtime at all, and `lint-staged`'s config block in
`package.json` is not touched: its two tasks are `biome check --write --no-errors-on-unmatched` and
`jest --bail --findRelatedTests --passWithNoTests`, both binaries taking filenames.

### How the pieces interact

The pre-commit hook is the only quality gate in this repo; there is no CI. It runs `npx lint-staged`, which hands each
staged file to those two tasks, then `yarn validate` (tsc, Biome with `--error-on-warnings`, the full Jest suite with
coverage at 100% thresholds), then `scripts/check-changed-coverage.js --staged`. So **the `lint-staged` bump is proven
by the very commit that ships it**: if 17.6.0 could not run, that commit could not be made.

`@types/node` is consumed only by `tsc --noEmit`, which `yarn validate` runs, and by the editor. Nothing imports it at
runtime.

### Existing tests that cover this code

| Suite | What it proves |
| --- | --- |
| `shared/__tests__/qualityGate.test.ts` | The hook is tracked, executable, runs `lint-staged` and `yarn validate`, and `prepare` arms husky |
| `shared/__tests__/versionLockstep.test.ts` | `app.json`, `package.json` and the gradle `versionName` agree |

### Why the obvious simple fix is wrong

The obvious reading of "a sweep found only two trivial bumps" is that the session is not worth running. It is worth
running for two reasons that the measurement itself provides. First, the measurement IS the deliverable: this is the
first time the freshness of all 30 non-SDK packages has been re-checked since session 21, and "28 of 30 unchanged" is
only knowable by checking. Second, the owner's standing rule is that staleness compounds, so a one-day drift is
shipped while it is still a one-line change rather than left to become a migration.

## 5. Design

**None in the behavioural sense: this plan changes no code.** Both steps move a version string, and section 6 gives
the acceptance for each. What follows is the measurement that made the plan, because that is this session's real
content.

**The sweep, measured on 2026-09-26** against `node_modules` at `55df8421`, reading each package's `latest` dist-tag
from `registry.npmjs.org`. The scope is every package in `package.json` that is NOT in
`expo/bundledNativeModules.json` and is not `expo`, an `expo-*`, an `@expo/*`, a `@react-native/*`, `react`,
`react-dom`, `react-native` or `jest-expo`, which is the mechanical boundary session 21 established.

| Package | Installed | Latest | Verdict |
| --- | --- | --- | --- |
| `@types/node` | 26.6.2 | **26.6.3** | **MOVED**, step 1 |
| `lint-staged` | 17.5.1 | **17.6.0** | **MOVED**, step 2 |
| `@babel/core` | 7.29.7 | 8.0.6 | Blocked upstream, row 18 (decision 4) |
| `@babel/plugin-transform-modules-commonjs` | 7.29.7 | 8.0.1 | Blocked upstream, row 18 |
| `@babel/plugin-transform-react-jsx` | 7.29.7 | 8.0.1 | Blocked upstream, row 18 |
| `@babel/preset-typescript` | 7.29.7 | 8.0.1 | Blocked upstream, row 18 |
| `@biomejs/biome` | 2.5.14 | 2.5.14 | current |
| `@gorhom/bottom-sheet` | 5.2.14 | 5.2.14 | current |
| `@jest/create-cache-key-function` | 30.5.1 | 30.5.1 | current |
| `@testing-library/react-native` | 14.0.1 | 14.0.1 | current |
| `@types/jest` | 30.0.0 | 30.0.0 | current |
| `@types/react` | 19.3.0 | 19.3.0 | current |
| `date-fns` | 4.4.0 | 4.4.0 | current |
| `date-fns-tz` | 3.2.0 | 3.2.0 | current |
| `husky` | 9.1.7 | 9.1.7 | current |
| `jest` | 30.5.2 | 30.5.2 | current |
| `jotai` | 3.0.0 | 3.0.0 | current |
| `mp3-duration` | 1.1.0 | 1.1.0 | current |
| `patch-package` | 8.0.1 | 8.0.1 | current |
| `pino` | 10.3.1 | 10.3.1 | current |
| `pino-pretty` | 13.1.3 | 13.1.3 | current |
| `postinstall-postinstall` | 2.1.0 | 2.1.0 | current |
| `react-native-edge-to-edge` | 1.8.2 | 1.8.2 | current |
| `react-native-mmkv` | 4.3.2 | 4.3.2 | current |
| `react-native-nitro-modules` | 0.37.1 | 0.37.1 | current |
| `react-native-performance` | 7.0.0 | 7.0.0 | current |
| `react-native-svg-transformer` | 1.5.3 | 1.5.3 | current |
| `reanimated-color-picker` | 5.1.3 | 5.1.3 | current |
| `test-renderer` | 1.3.0 | 1.3.0 | current |
| `typescript` | 7.0.2 | 7.0.2 | current |

`yarn audit` reports **0 vulnerabilities**, so nothing is shipped here for a security reason; both bumps are freshness
alone.

**What the spike proved, in the scratch worktree `~/athan-device-sweep/worktrees/plan-22` at `55df8421`,** with
`node_modules` symlinked from the main checkout:

1. `@types/node@26.6.3` alone: `tsc --noEmit` exit 0, `biome check . --error-on-warnings` exit 0, and the full suite
   `Test Suites: 170 passed, 170 total`, `Tests: 2 skipped, 4660 passed, 4662 total`, with 100% on statements
   (4234/4234), branches (1892/1892), functions (857/857) and lines (3825/3825).
2. `lint-staged@17.6.0` on top: `npx lint-staged --version` prints `17.6.0`, `tsc` exit 0, Biome exit 0, and the full
   suite reports the identical totals and the identical four 100% lines. So the two bumps together move no test count
   and no coverage number.
3. The install is clean: `yarn add --dev` reapplied both `patch-package` patches (`expo-background-task@58.0.3 ✔` and
   `expo-widgets@58.0.3 ✔`) and re-armed husky.

**The one behavioural change in `lint-staged` 17.6.0, read and dismissed with a reason.** Release 17.6.0 changes
lint-staged to stage tasks' edits to ALL tracked files a task modifies, including files that were never staged. That
matters for a config whose task rewrites files it was not given, such as `() => "prettier --write ."`. It does not
reach this project: both tasks here receive the staged filenames as arguments and write only those files, and the repo
has no snapshot tests, which are the other common source of a task writing an unstaged file (`find . -name
__snapshots__` returns nothing and no test calls `toMatchSnapshot`). The owner declined the optional
`--hide-unstaged` guard on 2026-09-26 (decision 1), and the measurement above is why the plan is safe without it.

**Alternatives rejected.**

| Alternative | Why rejected |
| --- | --- |
| Batch both bumps into one commit | The owner ruled one package per branch (2026-09-25), and `yarn.lock` is one resolved graph, so two packages in a commit cannot be reverted apart |
| Defer `lint-staged` to its own session | The owner asked for every package at latest now (decision 1). The bump is a minor with identical dependencies, and the commit that ships it is itself the proof it runs |
| Add `--hide-unstaged` to the pre-commit hook | The owner declined it (decision 1), and the measurement shows neither task writes an unstaged file |
| Move the four `@babel` packages to 8 | Hard upstream blocker, re-verified (decision 4). It belongs to row 18 |
| Close the row without shipping | The two movers are real, and the owner's rule is that staleness compounds |

**The design review.** Reviewed by this planning session against the spike's own measurements, on 2026-09-26, under
the owner's standing ruling that the session does its own reviewing and the audit is the independent gate. What the
review changed: the first draft carried a third step adding `--hide-unstaged` to `.husky/pre-commit`, which the
owner's answer removed; the first draft also asserted the Babel blocker from session 21's record, and the review
required it to be re-measured against the installed tree rather than inherited, which is now decision 4.

## 6. Steps

- [ ] Step 1: `@types/node` 26.6.2 to 26.6.3 (specified)
- [ ] Step 2: `lint-staged` 17.5.1 to 17.6.0 (specified)

Each step's detail is in `steps/<k>-<name>.md`.

**The order is serial, not parallelisable.** Both steps write `package.json` and `yarn.lock`, and `yarn.lock` is one
resolved graph: two branches editing it at once conflict by construction. Each step also bumps the version in three
files, which `shared/__tests__/versionLockstep.test.ts` checks, and each version is the next patch after the previous
step's. `@types/node` goes first because it cannot affect the commit gate, so if anything is wrong with the tree it
shows before `lint-staged`, the package the gate itself runs, is touched.

## 7. Device proof

**None.** Decision 6 gives the reason in full: neither package reaches a phone, and `ai/plans/README.md` row 21
records that this session needs no device. The gate in section 6 (tsc, Biome, the full suite at 100%, and the
pre-commit hook on each commit) is the whole proof.

## 8. Records

Given in `steps/3-records.md`.

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after
a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `yarn add` warns `incorrect peer dependency "react@^19.3.0"` from `react-reconciler` | `test-renderer@1.3.0` bundles a reconciler built for React 19.3, and React is SDK-pinned at 19.2.3 | Expected, and inherited from session 21 (its section 5, item 3). Both call sites are type-only. Carry on |
| `npx lint-staged --version` prints something other than `17.6.0` after step 2 | The install did not resolve to the planned version | STOP (section 2.2, item 5) |
| The commit log shows no task output from lint-staged | lint-staged 17 does not print its own name; the ticked task lines are the evidence | Read the task lines, not the word `lint-staged`. If no task line appears at all, STOP |
| An unstaged file appears in a commit's diff | 17.6.0's new auto-staging reached a file a task rewrote | STOP and ask. Section 5 measured this as unreachable here, so it would be a real finding |
| `versionLockstep.test.ts` fails | The three version numbers differ | Set all three to the step's version and commit again |
| The hook fails only because `audioMatrix.test.ts` timed out | The machine is busy | `EXECUTOR-BRIEF.md` section 3: wait for the load to fall and commit again, up to 3 times |
| Anything else | | `EXECUTOR-BRIEF.md` section 7 |

**Anticipated review fixes.** None. Each step's change is one version string in `package.json`, the resolved
`yarn.lock`, and the version in `app.json`. A reviewer finding that meets all three conditions in
`EXECUTOR-BRIEF.md` section 4, item 8 is applied by the executor and recorded in `LOG.md`; those three conditions are
not restated here.

**Stopping part-way.** For either step: `git checkout -- package.json yarn.lock app.json`, then `yarn install` to put
`node_modules` back to the tree's state. Neither step creates a new file, and neither step edits a source file, so
there is nothing else to restore.

## 11. Subagents in this plan

**None.** The owner ruled on 2026-09-26 that this session does the planning, the execution and the audit itself, with
no subagents, which matches the standing rulings of 2026-09-20, 2026-09-24 and 2026-09-25. Every review in this plan
is the session's own recorded diff review; the audit is the independent gate.

## 12. Report to the owner

Given in `steps/3-records.md`.
