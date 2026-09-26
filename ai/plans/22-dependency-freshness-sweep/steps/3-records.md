# Records and the report

## Findings text

Add to `ai/features/uat-2/AUDIT-FINDINGS.md`, under the exact heading `## Session 22: the dependency freshness sweep`:

```markdown
## Session 22: the dependency freshness sweep

The first re-measurement of every non-SDK package since session 21 put them all at their absolute latest on
2026-09-25. **28 of the 30 were still at their latest a day later, and two had moved.** Both shipped, one commit each.

| Package | From | To | What it cost |
| --- | --- | --- | --- |
| `@types/node` | 26.6.2 | 26.6.3 | nothing; typings, erased at build |
| `lint-staged` | 17.5.1 | 17.6.0 | nothing; same three dependencies, same Node floor |

**The measurement is the deliverable.** A sweep that finds almost nothing is not a wasted session: "28 of 30
unchanged" is only knowable by checking, and the check is what stops a one-day drift becoming a migration. The
scope is every package NOT in `expo/bundledNativeModules.json` and not `expo`, an `expo-*`, an `@expo/*`, a
`@react-native/*`, `react`, `react-dom`, `react-native` or `jest-expo`, which is the mechanical boundary session 21
established. `yarn audit` reported 0 vulnerabilities, so neither bump was a security fix.

**`lint-staged` 17.6.0 carries one behavioural change, and it was read rather than assumed.** It now stages a task's
edits to every tracked file the task modifies, including files that were never staged, which matters for a config
whose task rewrites files it was not handed (`() => "prettier --write ."`). It cannot reach this project: both
staged tasks take the staged filenames as arguments and write only those files, and the repo has no snapshot tests,
the other common source of a task touching an unstaged file. The owner was offered the `--hide-unstaged` guard and
declined it, so `.husky/pre-commit` is unchanged. 🐋  "I just want to be on the latest packages." (owner,
2026-09-26)

**Babel stays at 7, re-measured rather than inherited.** `babel-preset-expo@58.0.3` still depends on 36 Babel 7
packages and `@react-native/babel-preset@0.88.0-rc.0` still pins `@babel/core ^7.25.2`, so the four `@babel`
packages at 8.x remain blocked upstream and stay with row 18, the SDK 58 stable re-pin. Session 21 recorded this
blocker; this session re-checked it against the installed tree rather than trusting the record, which is the point
of a sweep.

**The SDK-pinned set stays too.** `npx expo install --check` reports 18 outdated packages on 2026-09-26; every one
is SDK-pinned or deliberately ahead (`jest`, `@types/jest`, `typescript`, per `ai/AGENTS.md`). All 18 are row 18's
report, not this session's.

**Verified:** `<TESTS_AFTER>` with 100% on all four coverage measures, `tsc` and Biome exiting 0. No device proof:
neither package can reach a phone, one being typings erased at build and the other a commit-time tool that is never
bundled.
```

## Table rows

The executor sets the `ai/plans/README.md` row 21 to EXECUTED. The auditor applies this text to the row on PASS.

For `ai/prompts/README.md`, add to the closed-prompts index:

```markdown
- 22. `ai/plans/22-dependency-freshness-sweep/PLAN.md` — DONE 2026-09-26 — the first freshness re-measurement after
  session 21. 28 of 30 non-SDK packages were still at their absolute latest; `@types/node` 26.6.3 and `lint-staged`
  17.6.0 had moved and both shipped, one commit each. Babel 8 re-confirmed blocked by `babel-preset-expo`'s 36
  Babel 7 dependencies, so it stays with row 18.
```

## Docs commit

```
<VERSION> - docs(plans): session 22 executed: the dependency freshness sweep
```

## The report to the owner

Starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`. A few plain sentences on what
moved and what was proven, then the progress table in `EXECUTOR-BRIEF.md` section 6's format, then any decision
waiting on the owner, then the four-line handoff from the `athan-next` skill.
