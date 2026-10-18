# Step 1 - The Duo glass matrix and the record

Weight: 3

Requirements: R1.1, R1.2, R1.3, R2.1, R2.2, R2.3, R3.1, R4.1, R4.2

## Anchor check

Run from the repository root before the branch. Each anchor must occur exactly once.

```bash
for entry in screen-content-cap:app/Screen.tsx navigation-pager:app/Navigation.tsx size-content-max-width:shared/constants.ts window-dimensions-hook:hooks/useWindowDimensions.ts portrait-lock:app.json; do
  anchor="ai/plans/116-iphone-duo/scripts/anchors/${entry%%:*}.txt"
  source="${entry##*:}"
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor" "$source")"
  printf '%s %s\n' "$count" "$source"
done
```

Expected: `1` on every line. Any other count is a STOP and a NEEDS REPLAN.

## Goal

Re-run the planning glass matrix cold, on the booted iPhone Duo simulator under Xcode 27.1, and record every reading. Prove the app shows one schedule in both poses through the shipped layout, that a fold keeps the process alive, and that the range carries no app-surface change.

## Branch

Branch `step/116-duo-glass-matrix` off `uat`, fetched first.

## Files

Changed by this step:

- `ai/plans/116-iphone-duo/LOG.md` (the readings and the findings)
- `ai/plans/README.md` (the ticket's status and the findings summary)
- `ai/plans/116-iphone-duo/PLAN.md` (the checklist tick)
- `app.json`, `package.json` (the version bump)
- `android/app/build.gradle` (`versionName`, gitignored and never added)

No file under `app/`, `components/`, `hooks/`, `modules/`, `shared/` or `stores/` is touched.

## Red

This step changes no production line, so there is no red test. The negative proof runs before and after the matrix and must print nothing both times:

```bash
git diff --name-only origin/uat -- app components hooks modules shared stores
```

## Device matrix

Run section 7 of `PLAN.md` in order. Record each reading in `LOG.md` under `### Step 01 - the glass matrix` as it lands, with the screenshot's file name and the value read.

The matrix is:

1. The pre-flight (`bash ai/plans/116-iphone-duo/scripts/preflight-116.sh`, ends `PREFLIGHT OK`).
2. Closed pose: application rect, one schedule, both schedules by swipe, overlay, settings sheet, screenshots.
3. Open pose: display rect, application rect, one schedule, both schedules by swipe, overlay, settings sheet, screenshots.
4. Fold transitions with an overlay open: the pid stays the same and the overlay stays open both ways.
5. Cold launch in the open pose: the Standard schedule in the same window.
6. Restore: folded closed, Standard schedule, screenshots kept outside the repository.

## Green

```bash
npx tsc --noEmit
npx biome check . --error-on-warnings
yarn validate
```

Expected: all three exit 0. A failure on a file the range does not touch is a STOP; this step is a regression gate, not a repair.

## Break

None: the step changes no code and its proof is the glass matrix, whose expected readings are section 7.2 of `PLAN.md`. A reading outside its band is a STOP, named in section 10.

## Version and commit

Run from `uat`'s current `package.json`: the next patch. Set it in `app.json` first, then `package.json`, and set `android/app/build.gradle`'s `versionName` to the same value. Fetch `origin` under the version lock and retry the number if a sibling took it.

Commit message: `<VERSION> - docs(plans): 116 the Duo glass matrix on the one-schedule path, both displays read`.

## Merge

`git checkout uat && git merge --no-ff step/116-duo-glass-matrix` with the same message. A conflict on `ai/plans/README.md` or the version files is lane weather: abort, rebase, keep both rows and the higher version, retry once, then STOP.

## Review

Read the commit back cold and check:

- the readings match section 7.2's bands;
- every criterion R1.1 to R3.1 has a recorded reading;
- the negative proof printed nothing;
- no screenshot or device identifier entered the repository;
- the row's summary names the open display's presentation and its cause;
- `LOG.md` carries the step heading and its `session:` line.

## Done when

Every criterion has a reading in `LOG.md`, the evidence exists under `$HOME/athan-gitree/sessions/116/`, `yarn validate` exits 0, the negative proof is empty, the commit is merged, and the ticket is set EXECUTED.
