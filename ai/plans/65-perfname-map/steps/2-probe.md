# Step 2: The removal probe

Requirements: R2.1
Weight: 1

## Anchor check

Same three anchors as step 1, each still counting 1 (step 1 changed no code).

## Goal

FINDINGS.md section 2 records what fails with the machinery deleted, and
what does not, each claim naming the test or script that proved it. No code
changes land on `uat` (D80).

## Branch

`git checkout -b docs/65-2-probe uat`

## Files

- `ai/plans/65-perfname-map/FINDINGS.md` (section 2)
- `ai/plans/README.md` (ticket line: `IN PROGRESS, step 2`)
- this plan folder's `PLAN.md` and `LOG.md`

## The probe

```bash
git worktree add --detach "$HOME/athan-gitree/worktrees/probe-65" uat
ln -s "$HOME/repos/rn.athan.uk/node_modules" "$HOME/athan-gitree/worktrees/probe-65/node_modules"
```

In the worktree: delete the `perfName` prop and its marks/measures from
`components/sheets/parts/Sheet.tsx`, the `perfName`/`SHEET_PERF_NAME`
call sites in the five screens and two parts, the `perfMark('sheet_*')`
calls in `stores/ui.ts`, and the exports the probe can drop from
`shared/perf.ts` once nothing calls them. Then run, from the worktree:

```bash
npx tsc --noEmit
npx biome check . --error-on-warnings
npx jest components/sheets stores/__tests__/ui.test.ts components/overlay --watchman=false --selectProjects=components,unit
```

Record every failure verbatim (file, test name, assertion) and every suite
that passes. Also grep `e2e/` and `scripts/` for `perfMark`, `perfMeasure`
and `sheet_` mark names to confirm the flows and the frame/baseline scripts
reference none (planning's grep found none; the probe re-proves it against
the mark names themselves).

Cleanup, before anything else:

```bash
rm "$HOME/athan-gitree/worktrees/probe-65/node_modules"
git worktree remove --force "$HOME/athan-gitree/worktrees/probe-65"
```

Never commit from the worktree.

## Green run

Section 2 written; the worktree is gone (`git worktree list` shows the five
build worktrees only); `git status --porcelain` on uat lists only the plan
and queue files.

## Version and commit

Next patch after uat's `package.json`, the three places, `app.json` first.

```
<VERSION> - docs(plans): 65 step 2, the removal probe results
```

## Review checklist

- No code file in the commit.
- Every "breaks" claim names a failing test; every "holds" claim names the
  passing suite.

## Merge

`git checkout uat && git merge --no-ff docs/65-2-probe -m "<VERSION> - merge docs/65-2-probe: removal probe (65 step 2)"`

## Done when

Checklist ticked, LOG.md entry under `### Step 02 — done` with the
`session:` line.
