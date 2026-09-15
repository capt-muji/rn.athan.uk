# Session 5: reach 100% test coverage, and gate every commit on it

**Status: queued 2026-09-15 by the owner as the next session.** Follows session 4 (`coverage-sweep.md`), whose record
is "Session 4 of the queue" in `ai/features/uat-2/AUDIT-FINDINGS.md`.

## The owner's ask, 2026-09-15

After session 4 moved statements from 68.49% to 76.18%:

> Why do we not have 100% coverage, that's what I'm trying to figure out. We should have 100% coverage. I don't get
> it. ... The next session should focus on 100% coverage. However, you took such a long, long time just to go from 68%
> to 76%. So how long is it going to take to get to 100%? ... Is it even worth going to 100% coverage? What's not
> covered, which areas are not covered? ... For each new feature that we add or each new change that we make, we must
> get 100% coverage in the code commit. So you're not allowed to commit and push without having 100% coverage. Is it
> difficult to get 100% testing for frontend? Is that the reason, or is it the rest of the tests? To get 100%, is it
> going to be testing meaningless stuff? I honestly feel like we should get to 100%. But of course, I understand some
> things are absolutely meaningless. So feel free to fight back. What's the industry standard on total coverage? Is it
> 100%? Is it 75%? Am I just chasing a dream with 100%?

## Answer these first, plainly, before writing any code

Put the answers in the session's first response, short and direct, with the evidence behind each.

1. **Why 76% and not 100%.** Which areas and files are not covered, with numbers. Session 4's final run is
   `.claude/coverage-sweep/final-coverage/run.txt` (local); measure again at the session's start.
2. **Is the gap frontend.** At 1.27.137: `hooks/`, `api/`, `stores/atoms/` and `components/day/` are at 100%,
   `shared/` 99.74, `stores/` 99.63, `device/` 96.72; `app/` and `components/ui/`, `components/modals/` and
   `components/sheets/` sit at 0 to 12.3%, `components/countdown/` 7.35, `components/prayer/` 36.9 and
   `components/overlay/` 67.69. No React renderer was installed, so component markup could not run in tests. Say how
   much of the 899 uncovered statements is `.tsx` and how much is everything else.
3. **Is 100% worth it, and what would be meaningless to test.** Push back where it is true: generated or pure-style
   code, native glue, dev-only gates, code that only frame evidence can prove. Say what a test would assert in each
   case, or why nothing honest could be asserted.
4. **The industry standard.** Research it rather than recall it, cite sources, and say which search path was used.
   Cover what well-run React Native and TypeScript projects gate on, and what the major style guides say.
5. **How long 100% will take.** An estimate with its basis: the count of uncovered units by kind, the harness work,
   and what slowed session 4 (below). No hand-waving.
6. **Findings 79 and 80, explained simply.** The owner did not understand them. In 79, "Settings" means the
   phone's own notification settings screen that the app sends you to when notifications are refused, not the app's
   alert sheet. Explain when that screen cannot open and what the user sees. For 80, explain what "an exception in
   `sync()` on a warm launch" means, how likely it is, and what the user would see. Then ask the owner whether 79
   should be fixed. The fixes are session 6 (`alert-integrity.md`), not this session.

## The owner's decisions

- **Add a React renderer** so component markup can be tested (approved). Resolve the version from the registry and
  `package.json`, never guess; check the React 19.2 and React Native 0.86 compatibility first.
- **`yarn validate` runs coverage** (approved), so the thresholds bind every commit.
- **No commit and no push without 100% coverage of the change.** Design how the hook enforces it (for example, the
  global thresholds at 100 once reached, plus a per-changed-file check), and prove the gate fails on a real gap.
- **The target is 100% overall.** Anything left out must be a short, reviewed, written exclusion with its reason,
  never a silent one.

## Why session 4 was slow, so this one is not

The owner found session 4 far too slow. What cost the time, from its record:

- The usage limit stopped every agent three times, and each restart re-read large files.
- Agent worktrees started at the wrong commit, and the harness could not resume agents while git was broken.
- Every area went through two full review rounds, and a mutation pass per area ran for tens of minutes.
- Each of about 130 commits was cherry-picked, bumped and validated one by one (about 10 seconds each).
- The device check's first scripts had bugs that cost two reruns.

Plan for throughput from the start: set up the renderer and one shared test harness first, then split the rest by
area with clear file ownership; keep reviews to one thorough pass with the fixture attack in it; run mutation passes on
decision logic, not on markup; and keep the standing rules (every change reviewed, red before green, never edit a test
to make it pass).

## Deliverables

- The answers above.
- A React renderer and a shared harness, with a written note on how component tests are written here.
- Coverage at 100% on every measured area, or reviewed exclusions with reasons.
- The coverage gate in `yarn validate` and the pre-commit hook, proven to fail on a gap.
- A short note in `AUDIT-FINDINGS.md` with the before and after numbers, the exclusions and the gate.
- A 3T check only for production code that changes.
