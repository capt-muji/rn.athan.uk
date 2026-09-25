# Audit: Session 21. Every non-SDK package to its absolute latest

Audited 2026-09-25, in a scratch worktree at `~/athan-device-sweep/worktrees/audit-21`, detached at `424f6eda`, with
`node_modules` symlinked from the main checkout.

## Verdict: PASS

Nothing needed fixing. Every check below was run from the scratch worktree, not from the executor's tree, and every
number quoted is one this audit produced itself.

## What was checked

### 1. The range holds only legitimate commits

`git log --oneline origin/uat-2..uat-2 --no-merges` lists 13 commits: 2 planning, 8 package steps, 3 docs. No commit
belongs to any other plan. Versions run **1.27.385 to 1.27.397 with no gap and no repeat**, verified by sorting the
subjects' version prefixes and de-duplicating.

### 2. Each commit does what the plan specified, and nothing else

Read `git show --stat` for all 8 package commits. Every one touches `package.json`, `yarn.lock`, `app.json` and its own
plan bookkeeping, plus exactly the extra files its step declared:

| Commit | Extra files, as the plan declared |
| --- | --- |
| 1.27.387 biome | `biome.json`, 1 line (the `$schema`) |
| 1.27.388 to 1.27.391 | none |
| 1.27.392 lint-staged | none |
| 1.27.393 husky | `.husky/pre-commit`, `.husky/pre-push`, `shared/__tests__/qualityGate.test.ts` |
| 1.27.394 jotai | `stores/sync.ts`, `jest.config.js`, `jest.components.setup.js` |

**No app source file was touched other than `stores/sync.ts`,** which jotai 3 forced. No test was weakened: the single
test assertion that changed is `qualityGate.test.ts`'s `prepare` check, whose premise is unchanged and whose other 8
tests still pass.

### 3. The code, read rather than assumed

The `loadable` wrapper in `stores/sync.ts` matches its contract exactly: the name, the signature
`<Value>(anAtom: Atom<Value>) => Atom<Loadable<Value>>`, the three-state union in jotai 2's shape, the identity
comparison `data === LOADING`, and a `catch` that reports `hasError` rather than rethrowing. It is unexported, correct
because `stores/sync.ts` is the only call site.

`jest.components.setup.js` reads the building-block keys from the library (`internals.INTERNAL_KEY_atomStateMap` and
its five siblings) rather than hardcoding the single letters, which is what the plan required and is the difference
between a loud failure and a silent one at the next rename.

**Comments were audited against the owner's rule** (why, never what, compact). Eight comment lines were added, all one
line each and all under the 120 limit, and each states something the code cannot: why the keys come from the library,
why `.js` is in the transform, why the sentinel is compared by identity, why the `prepare` spelling moved. Net comment
count went **down**: 7 added against 8 removed, because the stale jotai-2 deprecation paragraph in `stores/sync.ts` was
deleted rather than left to rot.

### 4. The tests still guard

All three break scripts were re-run from the scratch worktree, after confirming `grep -n /Users/muji/repos/rn.athan.uk`
prints nothing in each:

| Script | Result |
| --- | --- |
| `breaks-1.sh` | `caught 2 of 2`, `ALL AS EXPECTED: 1` |
| `breaks-7.sh` | `caught 3 of 3`, `ALL AS EXPECTED: 1` |
| `breaks-8.sh` | `caught 5 of 5`, `ALL AS EXPECTED: 1` |

The worktree was clean afterwards, so every script restored what it broke.

The riskiest step's red was re-confirmed by reverting it here: renaming the local `loadable` so `syncLoadable` cannot
reach it, then restoring it and seeing `tsc` return to 0.

### 5. The whole suite

`yarn validate` in the scratch worktree: **exit 0**, `Test Suites: 170 passed, 170 total`,
`Tests: 2 skipped, 4647 passed, 4649 total`, and 100% on statements (4209/4209), branches (1878/1878), functions
(855/855) and lines (3800/3800).

### 6. Reviews

`LOG.md` records a review verdict for all 8 steps, each "merge, one round", and each review's content is specific to
its step rather than boilerplate. Three plan corrections are recorded there with their reasons, and all three are
corrections the executor made to the PLAN rather than to the acceptance criteria, which is the right direction:

- the claim that `@types/react` 19.3.0 would settle the `react-reconciler` peer warning (it does not; the warning names
  the runtime `react`, SDK-pinned at 19.2.3);
- two done-when checks that grepped for the word `lint-staged` in a commit log (lint-staged 17 no longer prints its own
  name, so the check would have read a healthy gate as a missing one);
- two break substitutions that were invalid rather than revealing, both rewritten and recorded.

### 7. The owner's rules

| Rule | Checked | Result |
| --- | --- | --- |
| `releases.json` untouchable | `git diff --name-only` | 0 hits |
| `uat` never touched | `git log origin/uat..uat` | 0 commits |
| No coverage ignore comments | `grep -i "istanbul ignore\|c8 ignore\|v8 ignore"` | 0 |
| No skipped hooks | `grep no-verify` | 0 |
| API key never committed | `grep EXPO_PUBLIC_API_KEY=<value>` | 0 |
| No visual change | diff touches no `components/`, `app/`, or image file | 0 |
| EAS read-only | no EAS command ran; both builds were local | holds |

### 8. Device evidence

Checked against the files under `~/athan-device-sweep/session21/`, not against the executor's prose.

- 3T: `alarms-before.txt` and `alarms-after.txt` both hold the same two alarms, the widget refresh tick and the 2036
  `ACTION_FORCE_STOP_RESCHEDULE` entry. `3t/logcat-after-launch.txt` holds zero `FATAL EXCEPTION` lines.
  `3t/screen-readout.txt` records the six real London times and the countdown, and the arithmetic in it is sound: Asr
  16:07 less the 13:56 clock is the 2h 11m shown.
- The cold-launch figure, 3,136ms against the ~6.6s in ISSUES #32, is a genuine improvement rather than a regression,
  and is reported as such.
- XS: the first build's two failures are recorded honestly as the executor's own invocation errors rather than package
  regressions, with the evidence for that reading (Metro had already logged `Done writing bundle output`; the failing
  script was `ExpoModulesJSI`'s xcframework step; the log names none of the eight packages). The rebuild at 1.27.396
  produced `PlugIns/ExpoWidgetsTarget.appex`, and the owner confirmed both readings on the phone.

### 9. The records

`ai/features/uat-2/AUDIT-FINDINGS.md`'s new section is accurate against everything above: the eight versions, the three
jotai causes, the Babel blocker with its real cause, the measured test and coverage numbers, and both device reports.
The `ai/prompts/README.md` row text from the plan's section 8 is applied on this PASS.

## Findings

**None that require a fix.** Two observations worth recording, neither a defect in this session's work:

1. **The six old iPhone crash reports were investigated and are closed.** All are `SIGABRT` on app_version 1.24.0
   inside a nine-minute window on 2026-09-10, a build `d53d85db` fixed the next day. `uat-2` is 170 patch versions
   past it and today's build crashes on neither phone. Recorded so no future session re-investigates them.
2. **The 3T is left on a production build, not the usual mock one**, because this session's proof needed real prayer
   times. That is a deliberate departure from the standing ruling of 2026-09-16 and is flagged in `LOG.md` so the next
   session reinstalls the mock build when it needs one. Automatic time was never changed, so nothing is owed there.
