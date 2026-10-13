# Step 2: The restart surface

Requirements: R2.1
Weight: 1

## Anchor check

Same seven anchors as step 1, each still counting 1.

## Goal

`FINDINGS.md` section 3 exists: the restart surface, meaning the mechanisms, their costs, the
ordering guarantees and the side effects. No code changes.

## Branch

`git checkout -b docs/66-2-restart-surface uat`

## Files

- `ai/plans/66-restart-investigation/FINDINGS.md` (section 3)
- `ai/plans/README.md` (ticket line: step 2 in flight)
- this plan folder's `PLAN.md` and `LOG.md`

## Red

`FINDINGS.md` holds sections 1 and 2 only. The step's own commit appends section 3: the "red"
is the section's absence, recorded as such in LOG.md.

## Change contracts

Section 3 answers, in order, each claim citing its file:line or its queue record:

1. The two restart mechanisms. The in-process JS reload: `Updates.reloadAsync()`
   (`stores/language.ts:83`), measured by row 68 and recorded in row 71 — pid unchanged, the
   launch line back in about 1.5 s, one non-fatal `AppStateModule.onHostPause` soft exception
   per crossing. The full process restart: search `app/`, `device/`, `modules/` and
   `plugins/` for an exit or restart-native path, record the search terms and the result, and
   name what a restart module would have to do on each platform.
2. What a restart re-runs for free: the launch path's reconciliation
   (`app/index.tsx:115-130`: the latch, the refresh gate, notifications init then the same
   convergence; `device/listeners.ts:70-74`: the foreground retry), read against the
   cold-start hydrate (`app/_layout.tsx:7-10`).
3. The D51 face: what dies at a restart (`components/sheets/screens/Language.tsx:52-56`, the
   busy bracket `stores/language.ts:72-92`) and the brief's "the restart point moves after
   convergence" against the await chain (`stores/language.ts:76`,
   `stores/notifications.ts:1672-1673`).
4. The widget re-push ordering: the awaited push inside the pass
   (`stores/notifications.ts:1672-1673`) against the deferred foreground push
   (`stores/notifications.ts:1652-1662`), the native minute chain (`stores/widget.ts:247`),
   and the race window each restart mechanism opens between the push and the reload.
5. The splash cost: the gate chain (`app/_layout.tsx:49`, `app/index.tsx:78-90`, `hideAsync`
   at `:186` and `:206`) priced from the row 68 measurement, paid once per switch.
6. The status quo baseline: what the in-place remount already delivers (the key on
   `app/_layout.tsx:90-92`), and which defect classes from section 2 it leaves open.

## Green run

Section 3 present and every claim carries its citation; sections 1 to 3 read as one document.

## Break script

None for a docs step.

## Version and commit

Fetch `origin uat` first. Next patch after uat's `package.json`, the three places, `app.json`
first.

```
<VERSION> - docs(plans): 66 step 2, the restart surface
```

## Review checklist

- Each of the brief's named side effects appears with a verdict: the D51 face, the widget
  race, the splash cost, the transient.
- The two mechanisms are never conflated: the pid and the teardown exception belong to the
  in-process reload; process death belongs to the full restart.

## Merge

`git checkout uat && git merge --no-ff docs/66-2-restart-surface -m "<VERSION> - merge docs/66-2-restart-surface: restart surface (66 step 2)"`

## Done when

Checklist ticked, LOG.md entry under `### Step 02 — done` with the `session:` line.
