# Step 1: The reader inventory

Requirements: R1.1
Weight: 1

## Anchor check

```bash
cd "$(git rev-parse --show-toplevel)"
for a in perf-gate:shared/perf.ts present-mark:stores/ui.ts sheet-prop:components/sheets/parts/Sheet.tsx; do
  n="${a%%:*}"; src="${a#*:}"
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
    "ai/plans/65-perfname-map/scripts/anchors/$n.txt" "$src"
done
```

Expected: three lines, each `1`. Any other count: `NEEDS_CONTEXT: NEEDS
REPLAN, <the anchor and its count>`.

## Goal

FINDINGS.md section 1 lists every reader of `perfName`, `perfMark`,
`perfMeasure` and the `EXPO_PUBLIC_PERF_MONITOR` gate with file, line and
role. No code changes.

## Branch

`git checkout -b docs/65-1-inventory uat`

## Files

- `ai/plans/65-perfname-map/FINDINGS.md` (new, section 1)
- `ai/plans/README.md` (ticket line: `IN PROGRESS, step 1`)
- this plan folder's `PLAN.md` and `LOG.md`

## Red

FINDINGS.md does not exist. The step's own commit creates it: the "red" is
the file's absence, recorded as such in LOG.md.

## Change contracts

Search terms, each run from the repository root with `grep -rn`:
`perfName`, `perfMark`, `perfMeasure`, `initPerfMonitor`,
`EXPO_PUBLIC_PERF_MONITOR`, `PERF_ENABLED`, across `app/ components/ shared/
stores/ hooks/ device/ e2e/ scripts/` (exclude `node_modules`, `.codegraph`,
`ai/`). Planning's counts at `2670e596` are the expected row totals:
perfName 21, perfMark 77, perfMeasure 37, initPerfMonitor 22,
EXPO_PUBLIC_PERF_MONITOR 30, PERF_ENABLED 4. A count that differs is the
section 10 contradiction row: re-run the grep before writing. Section 1 of FINDINGS.md is a table with one row per hit: file:line,
the symbol, and its role in one clause (gate, wiring, call site, test,
script). Group the rows: the machinery (`shared/perf.ts`), the wiring
(`Sheet.tsx`), the call sites (screens, parts, stores), the observers
(tests, scripts). End section 1 with the count per group.

## Green run

The table's every `file:line` opens at that line (`sed -n '<line>p' <file>`
prints the hit). Spot-verify five rows by opening them.

## Break script

None for a docs step; the LOG entry records the row count instead.

## Version and commit

Fetch `origin uat` first. Next patch after uat's `package.json`, the three
places, `app.json` first.

```
<VERSION> - docs(plans): 65 step 1, the perfName reader inventory
```

## Review checklist

- No file outside the plan folder and the queue changed.
- Every hit from the greps appears in the table or is named as excluded with
  a reason (`ai/` records, `.codegraph` index).

## Merge

`git checkout uat && git merge --no-ff docs/65-1-inventory -m "<VERSION> - merge docs/65-1-inventory: perfName inventory (65 step 1)"`

## Done when

Checklist ticked, LOG.md entry under `### Step 01 — done` with the
`session:` line.
