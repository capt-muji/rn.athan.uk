# Step 1: The inventory

Requirements: R1.1, R1.2
Weight: 1

## Anchor check

```bash
cd "$HOME/athan-gitree/worktrees/lane-117"
plan=ai/plans/117-widget-language-inventory
for a in alabel:widgets/PrayerWidget.tsx static-resolver:widgets/PrayerWidget.tsx lock-pair:widgets/LockPrayerWidget.tsx widget-strings:shared/widgetTimeline.ts footer-for:shared/time.ts ar-units:shared/i18n/ar.ts appjson-gallery:app.json; do
  n="${a%%:*}"; src="${a#*:}"
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
    "$plan/scripts/anchors/$n.txt" "$src"
done
```

Expected: seven lines, each `1`. Then the patch anchor, counted across every matching patch
file because ticket 111 may have renamed it:

```bash
cat patches/expo-widgets+*.patch | python3 -c 'import sys;print(sys.stdin.read().count(open(sys.argv[1]).read()))' \
  "$plan/scripts/anchors/patch-locale.txt"
```

Expected: `1`. Any other count: the PLAN.md section 10 drift protocol, then
`NEEDS_CONTEXT: NEEDS REPLAN` if the protocol does not cover it.

## Goal

`FINDINGS.md` sections 1 and 2 exist: the kind inventory and the per-surface, per-language
table. No code changes.

## Branch

```bash
cd "$HOME/athan-gitree/worktrees/lane-117"
git checkout -b docs/117-1-inventory lane/117
```

Record the fork sha (`git rev-parse lane/117`) in LOG.md: step 3's R3.2 check diffs from it.

## Files

- `ai/plans/117-widget-language-inventory/FINDINGS.md` (new, sections 1 and 2)
- `ai/plans/README.md` (ticket line: IN PROGRESS, step 1)
- this plan folder's `PLAN.md` (checklist tick) and `LOG.md`

## Red

`FINDINGS.md` does not exist. The step's own commit creates it: the "red" is the file's
absence, recorded as such in LOG.md.

## Change contracts

Section 1, the kind inventory: one row per kind, grouped under its shared composition per D117.5. The 8 home kinds (one
composition; schedule, theme and size named as the per-kind differences; both platforms) and
the 6 lock kinds (three compositions x 2 schedules; iOS only), each kind named, each with its
`createWidget` registration line.

Section 2, the per-surface table: one row per surface, columns surface / locale input /
bytes per language / citation. The surfaces: gallery display name and description; neutral
card; iOS stale card; Android stale card; catch card; the iOS countdown faces (home hero,
lock Layout 1, lock Layout 3, the inline fallback faces); the Android countdown hero; prayer
names (hero, list rows, inline); times; the footer; the unit letters; the `rtl` field. Fill
the six-language column from the catalogs and the inline STATIC tables (read
`shared/i18n/{en,ar,ms,so,hi,th}.ts` and both widget modules; the duration unit values are
`duration.h`, `duration.m`; the stale/neutral words are `widget.*` and the STATIC rows). The
iOS countdown row states system-formatting and marks the per-language glyphs `unverified`
with the live read that would settle them (a simulator per device language, reading the
widget face).

## Green run

A scripted check opens every file:line citation in both sections and finds the claimed
symbol or statement within 3 lines of the cited line (0 mismatches); five citations
spot-opened with `sed` and pasted into LOG.md. Sections 1 and 2 read as one document.

## Break script

None for a docs step; the LOG entry records the row counts instead (14 kind rows across 2
groups, 12 surface rows).

## Version and commit

Fetch `origin uat` first, under the version lock. Next patch after uat's `package.json`,
set in `app.json` and `package.json` with a line-targeted `sed` (never a JSON rewriter: the
hook's Biome pass rejects a reformatted file), the main tree's gitignored
`android/app/build.gradle` `versionName` matches after the merge.

```
<VERSION> - docs(plans): 117 step 1, the widget-language inventory
```

Commit in the lane worktree under the commit lock; the pre-commit hook runs the full
validate (3 to 4 minutes).

## Review checklist

- No file outside the plan folder and the queue changed.
- All 14 kinds appear, grouped per D117.5, every kind named.
- Every surface row names its locale input and cites file:line.
- The six-language column carries real catalog bytes, not placeholders.

## Merge

In the main tree, under the uat lock:

```bash
cd "$HOME/repos/rn.athan.uk"
git fetch -q origin uat
git merge --no-ff docs/117-1-inventory -m "<VERSION> - merge docs/117-1-inventory: the widget-language inventory (117 step 1)"
```

Then merge uat back into `lane/117` in the worktree (fast-forward) so the lane branch tracks
the merged state, and set the main tree's `android/app/build.gradle` `versionName` to
`<VERSION>`.

## Done when

Checklist ticked, LOG.md entry under `### Step 01 — done` with the `session:` line.
