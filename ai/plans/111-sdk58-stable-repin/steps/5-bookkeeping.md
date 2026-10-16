# Step 5: bookkeeping and records

Requirements: R5.1
Weight: 1

## Anchor check

None: the anchors verified at pre-flight and step 1 consumed them.

## Goal

The repo's records carry the stable truth after the re-pin: the README stack
line, the upstream patch record, the programme facts, the e2e README gotcha if
healed, and the queue cell.

## Branch

`docs/111-records` off uat, one commit.

## Files

- `README.md` line 75 (the stack line `Expo SDK 58 (preview), React Native
  0.88, React 19` becomes the stable wording; the ai/AGENTS.md stack tables
  were deleted by the owner's compaction order at `b2096c4a` and stay gone)
- `ai/UPSTREAM-PRS.md` (the three rows rebuilt at their new versions; the
  widgets row records BOTH hunks, openApp and the device-locale injection,
  with the locale hunk's upstreaming question marked moved to row 117; PR
  states re-checked with `gh api repos/expo/expo/pulls/<n> --jq '.state'`)
- `ai/plans/SDK58-PROGRAMME.md` section 16 (the stable re-pin's versions,
  incidents and durable lessons from this run; the Babel 8 re-measurement with
  the preset versions that blocked it; the trigger line updated to the next
  re-pin)
- `e2e/README.md` (only if step 3 recorded the env gotcha healed; the rewrite
  states the new cache behaviour and what remains manual, the gradle
  UP-TO-DATE deletion, if it remains)
- `ai/plans/README.md` (no edit here; the lead sets DONE)

## Change contracts

Facts only, no prose drift. Each table row cites a version a command printed.
The programme's section 16 stays the only SDK-58 brief survivor cited by an
open row, and if no open row cites it after this ticket, the whole file is
deleted in this commit and the queue's DONE cell says so.

## Green run

```bash
yarn validate && bash scripts/check-plan.sh ai/plans/111-sdk58-stable-repin || true
```

Expected: validate green (docs-only change, still the gate). The plan check
may print nothing after DONE; the plan folder dies at the audit merge.

## Break script

None (docs step). The reviewer verifies each recorded number against a live
command (`npm view expo dist-tags`, `node -e require(...)` on the installed
tree).

## Version and commit

Next patch; `<VERSION> - docs: 111 records (stack tables, upstream patch
record, programme facts, e2e gotcha verdict)`.

## Review

The reviewer re-runs every number's command and diffs it against the recorded
value.

## Merge

`git checkout uat && git merge --no-ff docs/111-records -m "<VERSION> - merge docs/111-records"`

## Done when

R5.1 holds and the lead has the DONE cell text from PLAN.md section 8.

## Restore

`git checkout uat -- ai/ e2e/README.md`.
