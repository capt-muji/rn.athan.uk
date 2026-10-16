# Step 3: The options and the recommendation

Requirements: R3.1, R3.2
Weight: 1

## Anchor check

The step 1 anchor check, all eight anchors, unchanged. Same expected output, same drift
protocol.

## Goal

`FINDINGS.md` section 5 exists: the option set, the recommendation, row 69's fate, the patch
upstreaming recommendation, the rulings list. The ticket ends EXECUTED. No code changes.

## Branch

```bash
cd "$HOME/athan-gitree/worktrees/lane-117"
git checkout -b docs/117-3-recommendation lane/117
```

## Files

- `ai/plans/117-widget-language-inventory/FINDINGS.md` (section 5, closing the document)
- `ai/plans/README.md` (ticket line: EXECUTED)
- this plan folder's `PLAN.md` (checklist tick) and `LOG.md`

## Red

FINDINGS.md section 5 does not exist; the ticket is IN PROGRESS. The step's commit creates
the section and sets EXECUTED; the "red" is both absences, recorded as such in LOG.md.

## Change contracts

Section 5, in order:

1. The option set, each option's heal and cost, every line citing sections 1 to 4:
   - Option 1, status quo: nothing changes; the seams stand (section 4).
   - Option 2, align the widget countdown's letters with the app's fixed-Latin lettered
     law (rows 83, 85, 102): the Android `ALabel` renders `h`/`m` as fixed Latin letters in
     every language; the `duration.h`/`duration.m` bake stops feeding the label; the
     `WidgetStrings` unit-field retirement and the v1-fallback re-test ride the same job
     (row 69's surviving shape). Cost: one small widget job, her say-so (row 69's ban
     governs timing), and the iOS timer stays system-formatted (the bridge carries no
     format control; replacing it costs per-second timeline entries the CPU budget record
     at `stores/widget.ts:19-31` forbids).
   - Option 3, wider convergence: option 2 plus one job that revisits D79's device-keyed
     rule for the stale faces (bake them app-locale where props exist, keep device-keyed
     only for props-less placeholders) and decides the unread `rtl` field's fate (keep
     stamping until the runtime Host lands, or stop). Cost: touches settled visuals and a
     settled ruling, both hers.
2. The recommendation: option 2 (D117.8), as the shape row 69 resumes into, when she says
   go.
3. Row 69's fate: stays parked under her ban; its colon-format half is superseded in
   substance by rows 85/102's lettered-design law; recorded as the resume-time re-scope
   (D117.6).
4. The patch upstreaming recommendation: one PR under row 51's discipline carrying the
   device-locale injection hunks (both platforms, additive global, defaults unchanged,
   anonymity per `ai/AGENTS.md`), beside PR `expo/expo#51292`; the patch stays until a
   published release carries the change (D117.7).
5. The rulings list left to the owner: pick an option (or none), lift or keep row 69's
   ban, approve or refuse the upstream PR, and decide whether the live-read items
   (section 4) run before any option lands.

## Green run

The scripted citation check extended to section 5; every option line cites its section
number; the ticket line in `ai/plans/README.md` reads EXECUTED in the committed file.

## Break script

None for a docs step; the LOG entry records the counts instead (3 options, 4 rulings).

## Version and commit

The step 1 commands, message:

```
<VERSION> - docs(plans): ticket 117 executed: 3 steps, the widget-language inventory answered
```

## Review checklist

- The recommendation cites sections 1 to 4, and matches D117.8.
- Row 69's fate matches D117.6 and names the supersession.
- The rulings list is complete and asks nothing code already answered.
- No file outside the plan folder, the queue and the version files changed across all three
  steps (R3.2): record the lane fork sha in LOG.md at the preflight (the commit
  `docs/117-3-recommendation` branches from); step 3's check is
  `git diff <fork sha>..docs/117-3-recommendation --stat` in the lane worktree, listing
  only plan-folder files, the queue row and `app.json`/`package.json`.

## Merge

The step 1 merge commands, message `<VERSION> - merge docs/117-3-recommendation: the
options and the ruling list (117 step 3)`, then the lane fast-forward and the main-tree
gradle versionName.

## Done when

Checklist ticked, LOG.md entry under `### Step 03 — done` with the `session:` line, the
ticket row set EXECUTED.
