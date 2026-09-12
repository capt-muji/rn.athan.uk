# Session: close the test-coverage gaps

**Status: NOT STARTED. Queued by the owner on 2026-09-12, to run after the code-audit sessions.**

## The ask, in the owner's framing

A session purely about writing more tests. **Spawn multiple agents to scour the codebase for
gaps** — code and branches that nothing exercises. *"We have a 1000 tests, but I'm sure there's a
lot more gaps that we need to cover, a lot more branches."* The target named was 100% coverage
everywhere.

This is the right shape for parallel agents: the work divides cleanly by directory, and each
agent can own an area end to end.

## Where it actually stands, measured 2026-09-12 at 1.25.44

`npx jest --coverage`, 45 suites and 1,080 tests, all passing:

| Area | Stmts | Branch | Funcs | Lines |
| --- | ---: | ---: | ---: | ---: |
| **All files** | **85.77** | **78.80** | **78.29** | **87.20** |
| `shared/` | 98.27 | 94.77 | 97.58 | 99.27 |
| `stores/` | 91.51 | 86.05 | 87.76 | 93.09 |
| `stores/atoms/` | 22.22 | 0 | 0 | 25 |
| `hooks/` | **33.03** | **21.78** | **15.87** | 35.14 |

## Two structural problems to fix before chasing a number

**1. Most of the app is not measured at all.** `jest.config.js`'s `collectCoverageFrom` lists
only `hooks/**`, `stores/**` and `shared/**`. So `components/` (50 files), `app/`, `device/`,
`api/`, `widgets/` and `modules/` contribute nothing to the percentage and their gaps are
invisible. The 85.77% headline is therefore flattering: it is 85.77% *of the measured third*.
Widen `collectCoverageFrom` first, take a true baseline, and expect the real number to drop.

**2. The thresholds are set below the current state,** so they ratchet nothing:
`branches: 60, functions: 60, lines: 70, statements: 70` against actuals of 78.8/78.29/87.2/85.77.
They cannot fail, which means they are documentation rather than a gate. Raise them to just
under wherever the sweep lands, so coverage can never silently regress — that is what makes this
session stick rather than decay.

## The gaps, worst first

Nine hooks sit at literal **0% statements and 0% functions**: `useCountdown`, `useCountdownBar`,
`usePrayer`, `usePrayerSequence`, `useSchedule`, `useAlertAnimations`, `useAlertSwapBounce`,
`useChromeDeferred`, `usePrevious`, `useWindowDimensions`. `useAnimation` is at 14.92% and
`usePrayerAgo` at 56.52%. `hooks/` is the single biggest lever in the repository.

Also at or near zero: `stores/bootstrap.ts` (0%), `stores/atoms/overlay.ts` (22.22%, 0% branch).
Partial branch gaps worth a look: `stores/database.ts` (60% branch, lines 95-115),
`stores/countdown.ts` (74.32% branch), `stores/schedule.ts` (81.66% branch), `stores/sync.ts`
(54.54% functions).

## How to run it

- Agents in parallel, one per area: `hooks/`, `components/`, `stores/` remainder, `device/` +
  `api/`, `widgets/`. Each reports the branches it could not reach and why.
- **100% is the direction, not a quota to game.** A test written only to touch a line is worse
  than no test: it locks in current behaviour without asserting intent, and it makes every later
  refactor more expensive. Where a branch is genuinely unreachable, delete the branch or record
  why it stays — that is a better outcome than covering it.
- The audit's standing rules still apply: never edit a test to make it pass, break each new test
  deliberately to prove it bites, one concern per commit, version bump on every commit, branch
  off `uat-2` and merge back with `--no-ff`.
- Animation hooks need care. Reanimated worklets and `useSharedValue` do not behave under jest
  the way they do on device, and AGENTS.md §4 is explicit that frame quality is only ever proven
  with frame evidence. Test the logic these hooks compute; do not claim they prove smoothness.

## Deliverable

A true baseline with the widened config, the gaps closed area by area, thresholds raised to lock
the result in, and a short note in the findings document recording the before and after numbers
and anything deliberately left uncovered.
