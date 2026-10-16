# Step 4: bookkeeping and records

Requirements: R5.1
Weight: 1

## Anchor check

None: the anchors verified at pre-flight and step 1 consumed them.

## Goal

The repository's records carry the refreshed truth after the re-pin: the README stack line, the
upstream patch record, the programme facts, the e2e README gotcha if step 2 recorded it healed, and
the queue cell.

## Branch

`docs/111-records` off uat, one commit.

## Files

- `README.md` (the stack line naming the Expo SDK and React Native versions; the `ai/AGENTS.md`
  stack tables were deleted by the owner's compaction order at `b2096c4a` and stay gone)
- `ai/UPSTREAM-PRS.md` (the three rows at their new versions, with the widgets row recording BOTH
  hunks, `openApp` and the device-locale injection, and the locale hunk's upstreaming question
  marked moved to row 117; PR states re-checked with
  `gh api repos/expo/expo/pulls/<n> --jq '.state'`)
- `ai/plans/SDK58-PROGRAMME.md` section 16 (the re-pin's versions, the expo-widgets 58.0.19 Android
  defect and its 58.0.20 fix, the durable lessons, the Babel 8 re-measurement with the preset
  versions that blocked it, and the trigger line updated to the next re-pin)
- `e2e/README.md` (only if step 2 recorded the env gotcha healed; the rewrite states the new cache
  behaviour and what remains manual, the gradle UP-TO-DATE deletion, if it remains)
- `ai/plans/README.md` (no edit here; the lead sets DONE)

## Change contracts

Facts only, no prose drift. Each table row cites a version a command printed. The programme's
section 16 stays the only SDK-58 brief survivor cited by an open row, and if no open row cites it
after this ticket, the whole file is deleted in this commit and the queue's DONE cell says so.

## Green run

```bash
yarn validate && bash scripts/check-plan.sh ai/plans/111-sdk58-stable-repin || true
```

Expected: validate green (docs-only change, still the gate). The plan check may print nothing after
DONE; the plan folder dies at the audit merge.

## Break script

None (docs step). The reviewer verifies each recorded number against a live command
(`npm view expo dist-tags`, `node -e require(...)` on the installed tree).

## Version and commit

Next patch; `<VERSION> - docs: 111 records (stack tables, upstream patch record, programme facts,
e2e gotcha verdict)`.

## Review

The reviewer re-runs every number's command and diffs it against the recorded value.

## Merge

```bash
git checkout uat && git merge --no-ff docs/111-records -m "<VERSION> - merge docs/111-records"
```

## Done when

R5.1 holds and the lead has the DONE cell text from PLAN.md section 8.

## Restore

`git checkout uat -- ai/ e2e/README.md README.md`.
