# Step 3: The recommendation

Requirements: R3.1
Weight: 1

## Anchor check

Same three anchors as step 1, each still counting 1.

## Goal

FINDINGS.md section 3 recommends whether removal is worth its own ticket,
with cost, risk and the sections the claim rests on. The owner rules on
reading (D81).

## Branch

`git checkout -b docs/65-3-recommendation uat`

## Files

- `ai/plans/65-perfname-map/FINDINGS.md` (section 3)
- `ai/plans/README.md` (ticket line: `IN PROGRESS, step 3`)
- this plan folder's `PLAN.md` and `LOG.md`

## Change contracts

Section 3 answers, in order, each citing section 1 or 2:

1. What removal costs: files touched, tests deleted or rewritten, the
   `EXPO_PUBLIC_PERF_MONITOR` launch-diagnosis capability given up.
2. What removal risks: the probe's failures name the live dependencies.
3. The recommendation: remove, keep, or keep the machinery and drop the prop
   - one of the three, with the reason in one sentence.

## Green run

Section 3 present; sections 1 to 3 read as one document.

## Version and commit

Next patch after uat's `package.json`, the three places, `app.json` first.

```
<VERSION> - docs(plans): 65 step 3, the recommendation
```

## Review checklist

- The recommendation cites its evidence sections.
- No new question is left open for the executor: the row ends here.

## Merge

`git checkout uat && git merge --no-ff docs/65-3-recommendation -m "<VERSION> - merge docs/65-3-recommendation: perfName judged (65 step 3)"`

Then Finishing: records text into LOG.md, ticket set to EXECUTED, executed
docs commit, merge, no push.

## Done when

Checklist ticked, LOG.md entry under `### Step 03 — done` with the
`session:` line, Finishing complete.
