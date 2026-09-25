# Records and the report

## Findings text

Add to `ai/features/uat-2/AUDIT-FINDINGS.md`, under the exact heading `## Session 21: every non-SDK package at latest`:

```markdown
## Session 21: every non-SDK package at latest

Eight packages moved to their absolute latest release, one per commit. Three were majors, and two of those broke the
project on contact, which is the point: the owner's ruling was that a break is fixed forward, in the code, never by
pinning back (owner, 2026-09-25).

| Package | From | To | What it cost |
| --- | --- | --- | --- |
| `@biomejs/biome` | 2.5.13 | 2.5.14 | `biome.json`'s `$schema`, one line |
| `@types/node` | 26.4.0 | 26.6.2 | nothing |
| `@jest/create-cache-key-function` | 29.7.0 | 30.5.1 | nothing; it was the last Jest 29 package in the tree |
| `test-renderer` | 1.2.0 | 1.3.0 | nothing; both call sites are type-only |
| `@types/react` | 19.2.18 | 19.3.0 | nothing, and it settles `test-renderer`'s reconciler peer warning |
| `lint-staged` | 15.5.2 | 17.5.1 | nothing; two majors, no breaking change reaching this config |
| `husky` | 8.0.3 | 9.1.7 | both hooks lose the v8 shim, `prepare` becomes bare `husky`, one guard assertion follows |
| `jotai` | 2.20.3 | 3.0.0 | three separate breakages, below |

**jotai 3 broke 82 of 170 suites, in three distinct ways, each hidden behind the one before it.**

1. It is ESM-only, and both Jest projects load CommonJS. Fixed by transforming jotai's own `.js` through the same
   Babel transform the app's files use: the `unit` project widened its transform to `.js` and gained a
   `transformIgnorePatterns`, and the `components` project appended `jotai` to the list it already had.
   `--experimental-vm-modules` was tried and rejected, because Jest 30's native `require(esm)` is additionally gated
   on `canResolveSync()`, which the `components` project fails for having a custom resolver, so the flag fixes one
   project and not the other.
2. It deleted `loadable`, which `stores/sync.ts` used to report the launch sync's three states to the launch screen.
   Replaced by the wrapper jotai's own deprecation notice specifies, over `unwrap`, local and unexported because
   `stores/sync.ts` is the only call site.
3. It renamed `INTERNAL_buildStoreRev3` to `INTERNAL_buildStoreRev4` and changed its signature from six positional
   building blocks to one `Partial<BuildingBlocks>` object keyed by single-letter constants. That took 30 component
   suites with it, because `jest.components.setup.js` builds one store over replaceable containers so every component
   test starts from a fresh install. The keys are now read from the library rather than written as literals.

**Two packages did NOT move, and neither is a judgement call.**

- **Babel stays at 7.** `@babel/core` 8 and the Babel 7 plugins are a hard npm peer conflict, and a Babel 7 plugin
  loaded by Babel 8 throws `BABEL_VERSION_UNSUPPORTED` from `assertVersion(7)`. The blocker is not ours:
  `babel-preset-expo@58.0.3` depends on 36 Babel 7 plugins, so Babel 8 arrives when the SDK's own preset moves,
  which is row 18's job.
- **Every SDK-pinned package stays.** `expo/bundledNativeModules.json` is the mechanical test for "the SDK wave", and
  the owner's boundary is that this session is everything else. `npx expo install --check` reports four of them as
  outdated; that is row 18's report.

**Verified:** `<TESTS_AFTER>` with 100% on all four coverage measures, `tsc` and Biome exiting 0, all three break
scripts ending `ALL AS EXPECTED: 1`. Proven on both phones from a production build: the 3T (Android 9) cold launched
in `<3T_LAUNCH>` against its documented ~6.6s, kept its alarms and rendered its widgets; the iPhone XS launched, did
not crash, and the owner confirmed its widgets still show prayer times.

**Durable lesson: an uncaught break is not automatically a missing test.** Two of this session's breaks were invalid
rather than revealing. Turning `noConsole` off caught nothing because this codebase has zero `console` calls, so the
rule guards a future edit rather than a present one. Swapping the launch sync's sentinel identity check for a value
check caught nothing because that sync resolves to `undefined`, and `JSON.stringify(undefined)` is not a string, so
both comparisons answer `false` and nothing observable changed. Read what a substitution actually does before
concluding the suite has a hole.
```

## Table rows

The executor sets the `ai/plans/README.md` row 20 to EXECUTED. The auditor applies this text to the row on PASS.

For `ai/prompts/README.md`, add to the closed-prompts index:

```markdown
- 21. `ai/plans/21-bump-everything-latest/PLAN.md` — DONE 2026-09-25 — eight non-SDK packages at their absolute
  latest, one commit each. jotai 3 cost three fixes (ESM-only, the deleted `loadable`, and the renamed store
  internals); husky 9 cost both hook files and one guard assertion. Babel stays at 7 because `babel-preset-expo`
  pins 36 Babel 7 plugins, and the SDK-pinned set stays for row 18.
```

## Docs commit

```
<VERSION> - docs(plans): session 21 executed: every non-SDK package at latest
```

## The report to the owner

Starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`. A few plain sentences on what
moved and what was proven, then the progress table in `EXECUTOR-BRIEF.md` section 6's format, then any decision
waiting on the owner, then the four-line handoff from the `athan-next` skill, section 5.
