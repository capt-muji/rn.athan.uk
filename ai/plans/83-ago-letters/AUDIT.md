# AUDIT — ticket 83, the lettered ago badge

Range audited: `d9a4408a..a94f2d65` on `lane/83` (the diff excludes
`ai/plans`). Two reviewer passes: plan-conformance with the plan folder, blind
without it. The lead adjudicated every finding from the code.

## Pass 1: plan-conformance

`## FINDINGS: None.` Every contract verbatim against the step file, every named
test present, `Ago.test.tsx` byte-identical to the handed file, versions in
sequence (2.0.735 planning, 2.0.736 step, 2.0.737 executed docs), commit
messages matching the plan, LOG.md carrying red-before-green, `PREFLIGHT OK`,
`ALL ASPECTED: 1`, the hook's `Tests: 2 skipped, 5642 passed, 5644 total` and
four 100 percent lines. The reviewer corrected the lead's dispatch on one
point: the row flip order was the orderly one (IN PROGRESS in the step commit,
EXECUTED in the executed docs commit). Its one caution: LOG.md's `Review, two
passes cold against git show c0584999: clean, no finding` clause names the
executor's pre-merge self-review, not this audit; this file is the record of
the audit's own two passes, one of which returned findings below.

## Pass 2: blind

Three findings, adjudicated:

1. [should] `shared/time.ts:675` — `splitSingleColon`'s docblock still says it
   splits "for the ago badge's gap node" and that "the badge's words may sit
   either side"; the ago badge now reads `splitAgoDuration` and the only caller
   is the prayer row time (`components/prayer/Time.tsx:58`). **Confirmed**: a
   stale comment naming a reader that no longer exists. Fixed: the docblock now
   names the row time. Comment-only, no behaviour, so no red test exists to
   write; the full hook gate re-runs on the fix commit.
2. [nice] `components/prayer/Ago.tsx:95` — the letter ratio 0.55 and the 8 pt
   gap size duplicate `Countdown.tsx`'s styles; hoist both into
   `shared/constants`. **Rejected**: `Countdown.tsx` is row 85's owner-approved
   landed face, outside this ticket's ruled surface; the lockstep between the
   two components is the owner's ruling itself (the badge rides the countdown's
   ruled typography), not accidental duplication, and reopening the countdown's
   style block would touch an approved pixel face for zero behaviour. A future
   ticket may consolidate on the owner's word.
3. [nice] `shared/time.ts:656` — `AgoLetterGroup` exported but never imported
   outside its module. **Confirmed**: its sibling `LetteredGroup` in
   `Countdown.tsx` stays private and nothing here imports it. Fixed: the
   `export` keyword drops. Type-only, no runtime behaviour, no red test
   applies; tsc and the suite prove it.

## Fix commit

Both confirmed fixes in one commit on `83-audit-fixes`, version bumped, hook
gates green, merged `--no-ff` into `lane/83`.

## Verdict

PASS. The lettered ago badge is contract-faithful, the suites prove the ruled
behaviour at 100 percent coverage on all four measures, and the audit's two
confirmed findings are cosmetic residue fixed in the fix commit. The one plan
defect found in execution (the unreachable `?? 0` branch) was repaired by the
planner and is documented in LOG.md with the failing gate log as evidence.
