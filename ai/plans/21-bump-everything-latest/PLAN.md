# Plan: Session 21. Bump every non-SDK package to its absolute latest

| Field | Value |
| --- | --- |
| Brief | `ai/plans/README.md`, "Waiting on the owner": the bump-everything-to-latest session (owner, 2026-09-18), scoped by the owner again on 2026-09-25 |
| Planned at | `3df9733c` (version 1.27.384), 2026-09-25 |
| Planned by | Planning session on 2026-09-25 |
| Needs first | nothing |
| Steps | 8, each one branch, one commit, one version |
| Device | Both: OnePlus 3T (`8f7ada76`, Android 9, the baseline phone) and iPhone XS (`00008020-0015585C22D2002E`) |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

Every package this project owns, rather than the ones Expo's SDK pins, is behind its latest release. Some are one
patch behind; three are whole majors behind (`jotai` 2 to 3, `husky` 8 to 9, `lint-staged` 15 to 17), and a major
brings deleted APIs with it. When this plan is DONE, every non-SDK dependency sits at its absolute latest version,
the code that each major broke has been rewritten rather than pinned around, and both phones run a build from the
upgraded tree. The owner would notice nothing at all in the app: that is the point of the session, and the device
proof on both phones is what establishes it.

The owner's rules that apply, quoted:

🐋  "every package not already moved by the SDK wave, major versions included (`jotai` 3, `husky` 9, `lint-staged` 17,
`@biomejs/biome`, `test-renderer`), on its own branch with the full gates" (owner, 2026-09-18, recorded in
`ai/plans/README.md`).

🐋  "the SDK wave is strictly the SDK wave; this is everything else" (owner, 2026-09-18).

🐋  "address each package in its own branch. So do 1 package at a time, and in its own branch, just each package,
updating it to the latest, absolute latest version, even if it breaks stuff. I want you to upgrade it. If it breaks,
fix the code, update the code because of course it's gonna break stuff. That's the whole point of this migration is
we're gonna fix it as we go along." (owner, 2026-09-25, while planning this session).

🐋  "You have 2 phones connected to iPhone XS, and the Android 1 +3 T, which is our baseline, based our cheapest
phone, so you should definitely work on both these phones." (owner, 2026-09-25, while planning this session).

## 2. Decisions

### 2.1 Taken

1. **One package per branch, per commit, even where several are trivial.** Owner, 2026-09-25, quoted above. This
   overrides the planner's first draft, which batched the five no-code-change bumps into a single step. Recorded here
   and in `ai/prompts/README.md`.
2. **A major that breaks the code is fixed in the code, not avoided.** Owner, 2026-09-25, quoted above. So jotai 3
   ships in this session with its migration, rather than being deferred to a row of its own.
3. **`jotai` 3 is in scope and its two blockers are solved as step 6 specifies.** Planner, from the spike: jotai 3 is
   ESM-only and deletes `loadable`. Both were reproduced and both fixes were proven in the scratch worktree before
   this plan was written (section 5).
4. **Babel 7 stays.** Planner, from the spike, and it is not a judgement call: `@babel/core` 8 and the Babel 7
   plugins are a hard npm peer conflict (`peer @babel/core@"^7.0.0-0" from @babel/preset-typescript@7.29.7`), and a
   Babel 7 plugin loaded by Babel 8 throws `BABEL_VERSION_UNSUPPORTED` from `assertVersion(7)`. The blocker is not
   ours to fix: `babel-preset-expo@58.0.3`, which the SDK owns, depends on ~37 Babel 7 plugins. Moving to Babel 8
   means moving the SDK's own preset, which is row 18's job. Recorded in section 8 so the next attempt starts from
   this fact rather than rediscovering it.
5. **`@types/react` moves to 19.3.0.** Owner, 2026-09-25: 🐋  "Don't try not to revert anything. Try not to fall back
   to the an old version at all... the longer we leave a package out of date, the more security risks it has and the
   harder it becomes to upgrade." The planner's first draft held it back at the `~19.2.4` line, reasoning that
   typings ahead of their runtime would declare APIs the installed React does not have. The owner's rule sent it back
   to be tested instead of assumed, and the assumption was wrong: `@types/react@19.3.0` against `react` 19.2.3 gives
   `tsc` 0, the full suite 170 passed and 100% coverage. Types are erased at build and never reach either phone, so
   the runtime is untouched either way.

   **Corrected during execution, 2026-09-25.** This decision first claimed that step 5 would also settle the
   `react-reconciler@0.34.0` peer warning step 4 introduces. It does not, and the claim was wrong: that warning names
   `react@^19.3.0`, the runtime package, which the SDK pins at 19.2.3, not `@types/react`. The warning is expected to
   remain until React itself moves in row 18. It is inert here for the reason step 4 already gives, that both
   `test-renderer` call sites are type-only imports, and every suite passes.
6. **The SDK-pinned packages are out of scope, by the owner's own boundary.** Planner, applying decision 2's quote:
   `react-native`, `react`, `react-dom`, `react-native-reanimated`, `react-native-worklets`, `react-native-screens`,
   `react-native-pager-view`, `react-native-gesture-handler`, `react-native-svg`, `react-native-safe-area-context`,
   every `expo-*`, `@expo/*`, `jest-expo` and `expo-dev-client`. Each is listed in
   `expo/bundledNativeModules.json`, which is the mechanical test for "the SDK wave". `npx expo install --check`
   reports four of them as outdated; that is row 18's report, not this session's.
7. **The three deliberately-ahead packages are not touched to make a checker happy.** Planner, from
   `ai/AGENTS.md`: `jest`, `@types/jest` and `typescript` are ahead of the SDK's pins on purpose, and
   `npx expo install --fix` is never run. `jest` is at 30.5.2 under `^30.4.2` and 30.5.2 IS latest, so it needs no
   change; `typescript` 7.0.2 and `@types/jest` 30.0.0 are already latest.
8. **Device proof runs on both phones.** Owner, 2026-09-25, quoted above. The 3T is the baseline and the cheapest
   phone, so a regression shows there first; the XS is the only iOS device and the only place the widget extension
   runs. Both get a production build from the final tree.

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
   2026-09-25. Ask: "`<package>` latest is now `<new>`, not the `<planned>` this plan names. Should I take the newer
   one?"
6. **A new major appearing in a bump this plan calls a patch.** Ask the same question as item 5.
7. Anything the step does not answer that the executor would otherwise have to decide, with the question "The plan
   does not say `<X>`. What should it be?"
8. Anything touching visuals, prayer times, `releases.json`, `uat` or EAS.

## 3. Pre-flight

Saved to `$TMPDIR/preflight-21.sh` and run as `bash $TMPDIR/preflight-21.sh <k>`. Given in full in
`scripts/preflight.sh`.

## 4. Background the executor needs

### Code map

| File | What it does | Which step changes it |
| --- | --- | --- |
| `package.json` | The dependency set, and the `prepare`/`husky` scripts husky 9 renames | every step |
| `yarn.lock` | The resolved tree; `yarn install` rewrites it | every step |
| `biome.json` | Biome's config, whose `$schema` names the CLI version | step 1 |
| `shared/__tests__/qualityGate.test.ts` | Pins the pre-commit gate, including `prepare: "husky install"` | step 5 |
| `.husky/pre-commit`, `.husky/pre-push` | The only quality gate; husky 9 changes their shape | step 5 |
| `stores/sync.ts` | The launch sync; `syncLoadable` is built with jotai's `loadable` | step 7 |
| `jest.config.js` | Two Jest projects; neither can load ESM from `node_modules` | step 7 |
| `jest.components.setup.js` | Builds ONE jotai store over replaceable state containers, through jotai's `INTERNAL_` API, so every component test starts from a fresh install | step 7 |
| `app/index.tsx` | Reads `syncLoadable`'s `state` to choose the launch screen | step 7, read only |

### How the pieces interact

`stores/sync.ts` builds `syncLoadable` at module evaluation. `app/index.tsx` reads its `state` through
`useAtomValue`, and `triggerSyncLoadable` reads it through `getDefaultStore().get`. The three states
(`loading`, `hasData`, `hasError`) are what the launch screen switches on, so the replacement wrapper has to report
exactly the same three, with the same identity rule for "still loading".

`metro.config.js` sets `inlineRequires`, so module evaluation ORDER on device differs from Jest's eager graph
(`ai/AGENTS.md`, audit finding 2). jotai is imported in 67 places, so a jotai change is felt at launch on device even
when every suite passes, which is why both phones are proved.

### Existing tests that cover this code

| Suite | What it proves |
| --- | --- |
| `stores/__tests__/sync.test.ts` | The whole sync flow, 99 tests, including that `syncLoadable` is defined |
| `stores/__tests__/syncLoadable.test.ts` | The launch sync's three states, read through `store.get(syncLoadable)` |
| `shared/__tests__/qualityGate.test.ts` | The hook is tracked, executable, runs lint-staged and validate, and `prepare` arms it |
| `shared/__tests__/versionLockstep.test.ts` | `app.json`, `package.json` and the gradle `versionName` agree |

### Why the obvious simple fix is wrong

For jotai 3, the obvious fix is to keep `loadable` by pinning jotai at 2. The owner ruled that out directly. The
second obvious fix is to make `stores/sync.ts` build the loadable shape by hand with `useState`-style flags; that
would duplicate what `unwrap` already does and would lose the identity rule that separates "loading" from "resolved
to undefined". jotai's own deprecation notice gives the intended replacement, and section 5 uses it.

For the Jest ESM problem, the obvious fix is `--experimental-vm-modules`. It was tried in the spike and rejected:
Jest 30's native `require(esm)` path is additionally gated on `canResolveSync()`, which the `components` project
fails because it sets a custom resolver, so the flag fixes one project and not the other. Transforming jotai to CJS
fixes both with one line per project and no flag on any command.

## 5. Design

**The invariant, as one sentence a test can check:** `syncLoadable` reports `loading` before the launch sync settles,
`hasData` once it resolves, and `hasError` carrying the thrown error when it rejects, exactly as it did on jotai 2.

**The chosen approach.** Each package moves in its own branch and commit, in an order that puts the lowest-risk
bumps first so the tree is never broken by two things at once. The two majors that change project plumbing (husky,
jotai) come last, after the trivial bumps have already proven the tree is green.

`loadable` is replaced by the wrapper jotai's own deprecation notice specifies, over `unwrap`, local to
`stores/sync.ts` because that is the only call site. The `LOADING` sentinel is compared by identity, because a
resolved value may itself be `undefined` and only identity separates the two cases.

The Jest ESM problem is solved by transforming jotai's own `.js` through the same Babel transform the app's files
use, and narrowing `transformIgnorePatterns` to let jotai through. The `components` project already has such a list;
the `unit` project gains one.

**Alternatives rejected.**

| Alternative | Why rejected |
| --- | --- |
| Batch the five trivial bumps into one commit | The owner ruled one package per branch (decision 1) |
| Keep jotai at 2.20.3 | The owner ruled the migration in scope (decision 2) |
| `--experimental-vm-modules` for jotai's ESM | Gated on `canResolveSync()`, which the `components` project fails; fixes one project only |
| Hand-rolled loading flags instead of `unwrap` | Duplicates `unwrap` and loses the identity rule for a resolved `undefined` |
| Babel 8 | Hard peer conflict, and `babel-preset-expo` is Babel 7 only (decision 4) |
| `@types/react` 19.3.0 | Describes React 19.3; React is SDK-pinned at 19.2.3 (decision 5) |

**What the spike proved, in the scratch worktree `~/athan-device-sweep/worktrees/plan-bump` at `3df9733c`:**

1. The five trivial bumps together: `tsc` 0, `biome` 0, and the full suite `Test Suites: 170 passed, 170 total`,
   `Tests: 2 skipped, 4647 passed, 4649 total`, with 100% on all four coverage measures.
2. Biome 2.5.14 exits 0 but prints `The configuration schema version does not match the CLI version 2.5.14` until
   `biome.json`'s `$schema` moves too. So the `$schema` bump belongs in the same commit.
3. `test-renderer@1.3.0` pulls `react-reconciler@0.34.0`, which warns `incorrect peer dependency "react@^19.3.0"`.
   It is inert here: both call sites are `import type { TestInstance }`, a types-only import, and all 40 component
   suites passed.
4. jotai 3 before the fixes: `Test Suites: 82 failed, 88 passed, 170 total`. THREE distinct causes, each found only
   after the one before it was fixed, which is why the step fixes all three at once:
   1. `error TS2305: Module '"jotai/utils"' has no exported member 'loadable'` from `tsc`;
   2. `Must use import to load ES Module: <repo>/node_modules/jotai/dist/index.js` from Jest, in BOTH projects;
   3. `TypeError: buildStore is not a function` from `jest.components.setup.js`, which took 30 component suites with
      it. jotai renamed `INTERNAL_buildStoreRev3` to `INTERNAL_buildStoreRev4` AND changed its signature from six
      positional arguments to one `Partial<BuildingBlocks>` object keyed by single-letter constants
      (`KEY_atomStateMap` is `'a'`, `KEY_mountedMap` is `'m'`, `KEY_invalidatedAtoms` is `'i'`).
5. jotai 3 after all three fixes: `stores/__tests__/sync.test.ts` `Tests: 99 passed, 99 total`,
   `__tests__/app/Navigation.test.tsx` `Tests: 8 passed`, and `tsc` exits 0.
6. husky 9 installs, moves `core.hooksPath` from `.husky` to `.husky/_`, and its generated `.husky/_/pre-commit`
   resolves back to our tracked `.husky/pre-commit`, which ran the real gate: lint-staged, `yarn validate`, and the
   four 100% coverage lines. One test then failed, and it is a guard doing its job, not a break:
   `qualityGate.test.ts` expects `prepare` to contain `husky install`, and husky 9 renames the script to `husky`.
   Step 5 updates that test with the change.
7. Babel 8: `npm error peer @babel/core@"^7.0.0-0" from @babel/preset-typescript@7.29.7`, and the all-8 set installs
   only when every Babel package moves together, which `babel-preset-expo` prevents.
8. `@types/react` 19.3.0 against the SDK-pinned `react` 19.2.3: `tsc` 0, `Test Suites: 170 passed, 170 total`, 100%
   on all four measures, and the `react-reconciler` peer warning from step 4 gone.
9. All three break scripts were run in the scratch worktree and each ends `ALL AS EXPECTED: 1`: `breaks-1.sh` caught
   2 of 2, `breaks-7.sh` 3 of 3, `breaks-8.sh` 5 of 5, and each restored every file it touched.
10. **One break had to be rewritten, and the first version is recorded here because it is the more useful fact.**
    `breaks-8.sh`'s first break replaced the sentinel's identity comparison (`data === LOADING`) with a value
    comparison (`JSON.stringify(data) === JSON.stringify(LOADING)`) and was NOT caught. That is not a gap in the
    suite: this app's launch sync resolves to `undefined`, and `JSON.stringify(undefined)` is `undefined` rather than
    a string, so both comparisons answer `false` and the substitution changes no observable behaviour. An uncaught
    break is not automatically a missing test; it can be an invalid break, and the difference is decided by reading
    what the substitution actually does. The break was replaced by one that collapses the branch outright, which is
    caught.
11. **A second break had to be rewritten, for the same reason.** `breaks-1.sh` first turned Biome's `noConsole` from
    `error` to `off`, and was NOT caught: this codebase has zero `console` calls outside tests and mocks, so the rule
    guards against a future edit rather than a present one, and disabling it reports nothing. It was replaced by a
    break on the `$schema` version, which is the defect step 1 actually closes. That break asserts on Biome's message
    rather than its exit code, because Biome exits 0 on a schema mismatch.

**The design review.** This plan's design was reviewed by the planning session itself, against the spike's
measurements, on 2026-09-25 (the owner's standing ruling of 2026-09-24: the session does its own reviewing, and the
audit is the independent gate). What the review changed: the first draft batched the five trivial bumps into one
step, which the owner's one-package-per-branch ruling then overrode; the first draft also placed jotai before husky,
and the review moved jotai last, because jotai touches app state at launch and husky touches only the gate, so a
jotai failure is easier to read when the gate has already been proven under its new version.

## 6. Steps

- [x] Step 1: DONE in 1.27.387
- [x] Step 2: DONE in 1.27.388
- [x] Step 3: DONE in 1.27.389
- [x] Step 4: DONE in 1.27.390
- [x] Step 5: DONE in 1.27.391
- [ ] Step 6: `lint-staged` 15.5.2 to 17.5.1 (specified)
- [ ] Step 7: `husky` 8.0.3 to 9.1.7, with the hooks and the gate's own test (specified)
- [ ] Step 8: `jotai` 2.20.3 to 3.0.0, with the `loadable` replacement, the Jest ESM fix and the internals rename (specified)

Each step's detail is in `steps/<k>-<name>.md`.

**The order is deliberate and it is serial, not parallelisable.** Every step writes `package.json` and `yarn.lock`,
and `yarn.lock` is one resolved graph: two branches editing it at once conflict by construction, and a hand-resolved
`yarn.lock` is exactly the file no one can safely merge by hand. Each step also bumps the version in three files,
which `shared/__tests__/versionLockstep.test.ts` checks, and a version is the next patch after the PREVIOUS step's,
so the steps cannot be reordered or run concurrently. The owner offered a parallel swarm on 2026-09-25 and the
planner declined for these reasons: 🐋  "speed is not important for us. It's not breaking anything, that's
important." The trivial bumps come first so that when husky and jotai land, every earlier version is already proven
green; husky before jotai because husky touches only the gate while jotai touches app state at launch.

## 7. Device proof

Both phones, from the final tree after step 8 is merged. Given in full in `steps/9-device-proof.md`, which is not a
commit of its own: it is the proof that runs before the records are written.

## 8. Records

Given in `steps/10-records.md`.

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after
a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `yarn install` warns `incorrect peer dependency "react@^19.3.0"` from `react-reconciler` | `test-renderer@1.3.0` bundles a reconciler built for React 19.3 | Expected, and recorded in section 5, item 3. Both call sites are type-only. Carry on |
| Biome prints `The configuration schema version does not match` | `biome.json`'s `$schema` still names the old version | Step 1 moves it in the same commit. If it appears after step 1, STOP |
| `error TS2305: ... has no exported member 'loadable'` | jotai 3 deleted it | Expected in step 7 before the change; it is the step's red |
| `Must use import to load ES Module` naming a jotai path | jotai 3 is ESM only | Expected in step 7 before the change; it is the step's red |
| `qualityGate.test.ts` fails on `husky install` | husky 9 renames the `prepare` script to `husky` | Expected in step 6 before the change; it is the step's red |
| A hook does not run at all after step 6 | `core.hooksPath` still points at `.husky` | Run `yarn husky`, then confirm `git config core.hooksPath` prints `.husky/_`. If it does not, STOP |
| `versionLockstep.test.ts` fails | The three version numbers differ | Set all three to the step's version and commit again |
| Anything else | | `EXECUTOR-BRIEF.md` section 7 |

**Anticipated review fixes.** None. Every step's change is a version string plus, in steps 6 and 7, the code those
majors break, which the steps specify. A reviewer finding that meets all three conditions in `EXECUTOR-BRIEF.md`
section 4, item 8 is applied by the executor and recorded in `LOG.md`; those three conditions are not restated here.

**Stopping part-way.** For every step: `git checkout -- package.json yarn.lock app.json` and any file the step
lists, then `yarn install` to put `node_modules` back. Step 1 also restores `biome.json`; step 6 also restores
`.husky/pre-commit`, `.husky/pre-push` and `shared/__tests__/qualityGate.test.ts`; step 7 also restores
`stores/sync.ts` and `jest.config.js`.

## 11. Subagents in this plan

None. The owner ruled on 2026-09-25 that this session does the planning, the execution and the audit itself, with no
subagents, and the same ruling stands from 2026-09-20 and 2026-09-24. Every review in this plan is the session's own
recorded diff review; the audit is the independent gate.

## 12. Report to the owner

Given in `steps/10-records.md`.
