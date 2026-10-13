# Step 3: The options and the recommendation

Requirements: R3.1
Weight: 1

## Anchor check

Same seven anchors as step 1, each still counting 1.

## Goal

`FINDINGS.md` section 4 exists: the option set, the recommendation, the ruling list. The row
ends here; the owner rules on reading (D84).

## Branch

`git checkout -b docs/66-3-recommendation uat`

## Files

- `ai/plans/66-restart-investigation/FINDINGS.md` (section 4)
- `ai/plans/README.md` (ticket line: step 3 in flight)
- this plan folder's `PLAN.md` and `LOG.md`

## Red

`FINDINGS.md` holds sections 1 to 3 only. The step's own commit appends section 4: the "red"
is the section's absence, recorded as such in LOG.md.

## Change contracts

Section 4 answers, in order, each line citing sections 1 to 3 by number:

1. The option set, four named options: the status quo (in-place remount, D59's RTL-only
   relaunch); always-restart after convergence through the in-process reload; always-restart
   as a full process restart; the hybrid the evidence names (restart only when a stale-cache
   class from section 2 bites today). Per option: what it heals, what it costs, which
   sections carry the evidence.
2. The recommendation: one option, the reason in one paragraph resting on named sections.
3. The ruling list: the final pick; whether D59 is revised or absorbed; D51's timing; every
   option cost the records could not quantify (D87's unverified claims land here).

## Green run

Section 4 present; sections 1 to 4 read as one document; no open question is left for the
executor.

## Break script

None for a docs step.

## Version and commit

Fetch `origin uat` first. Next patch after uat's `package.json`, the three places, `app.json`
first.

```
<VERSION> - docs(plans): 66 step 3, the options and the recommendation
```

## Review checklist

- The recommendation cites its evidence sections by number.
- The ruling list is complete: nothing in the row waits on the executor.

## Merge

`git checkout uat && git merge --no-ff docs/66-3-recommendation -m "<VERSION> - merge docs/66-3-recommendation: the restart question judged (66 step 3)"`

Then Finishing: records text into LOG.md under `### Finishing — done`, ticket set to
EXECUTED, executed docs commit at the next patch after step 3's, merge, no push.

## Done when

Checklist ticked, LOG.md entry under `### Step 03 — done` with the `session:` line, Finishing
complete.
