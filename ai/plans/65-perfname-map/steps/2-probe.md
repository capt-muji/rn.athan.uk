# Step 2: The removal probe

Requirements: R2.1
Weight: 1

## Anchor check

Same three anchors as step 1, each still counting 1 (step 1 changed no code).

## Goal

FINDINGS.md section 2 records what fails with the sheet wiring deleted (the
`perfName` prop, its marks and measures, the present marks, the sheet-part
tap marks), and what does not, each claim naming the test or script that
proved it. No code changes land on `uat` (D80). The machinery in
`shared/perf.ts` stays: callers outside the sheets keep every export alive.

## Branch

`git checkout -b docs/65-2-probe uat`

## Files

- `ai/plans/65-perfname-map/FINDINGS.md` (section 2)
- `ai/plans/README.md` (ticket line: `IN PROGRESS, step 2`)
- this plan folder's `PLAN.md` and `LOG.md`

## Red

FINDINGS.md holds section 1 only. The step's own commit appends section 2:
the "red" is the section's absence, recorded as such in LOG.md.

## The probe

```bash
git worktree add --detach "$HOME/athan-gitree/worktrees/probe-65" uat
ln -s "$HOME/repos/rn.athan.uk/node_modules" "$HOME/athan-gitree/worktrees/probe-65/node_modules"
```

In the worktree, delete the sheet wiring only:

- from `components/sheets/parts/Sheet.tsx`: the `perfName` prop, its type
  entry, and the marks and measures in `handleAnimate`/`handleChange`;
- from the five screens: the `perfName={...}` props and their now-unused
  constants (`SHEET_PERF_NAME` in Sound, Qibla, Alert and Language;
  `SETTINGS_PERF_NAME` in Settings);
- from `components/sheets/parts/{SoundItem,LabeledToggle}.tsx`: the
  `perfMark` tap calls (neither part takes a `perfName` prop);
- from `stores/ui.ts`: the five `perfMark('sheet_*_present')` calls.

Leave `shared/perf.ts`, every non-sheet mark, `app/index.tsx`,
`app/Navigation.tsx`, `stores/countdown.ts`, `stores/notifications.ts`,
`stores/overlay.ts`, `stores/bootstrap.ts`, `hooks/useNotification.ts` and
`shared/i18n/loader.ts` untouched: their callers keep the exports alive.

Then run, from the worktree:

```bash
npx tsc --noEmit
npx biome check . --error-on-warnings
npx jest components/sheets stores/__tests__/ui.test.ts --watchman=false --selectProjects=components,unit
```

Expected: tsc fails naming `components/sheets/parts/__tests__/Sheet.test.tsx`
and any now-unused import it can see (if tsc instead exits 0, record that
nothing breaks at type level); Biome fails on unused constants and imports
the deletions orphan (if it exits 0, record that); Jest fails in
`Sheet.test.tsx:208-254` (the sheet marks), `LabeledToggle.test.tsx:60`
(`toggle_tap`) and `SoundItem.test.tsx:92,100` (`sound_select_tap`,
`sound_play_tap`) - the three suites asserting the deleted marks (a suite
that instead passes is itself a finding: record it). Record every failure
verbatim (file, test name, assertion) and every suite that passes. Any other
failure is a reader section 1 missed: record it and correct section 1 in the
same step.

Also grep `e2e/` and `scripts/` for `perfName`, `perfMark`, `perfMeasure` and
the `sheet_` mark names. The expected hits are four:
`scripts/scan-strings.mjs:23` (a `NON_DISPLAY_CALLEES` regex listing the
symbol names, a non-caller), `e2e/scripts/baseline-compare.sh:6,39` and
`e2e/README.md:43` (the gate's env usages, not the sheet marks), and seven
lines in `e2e/baselines/android-3t.json` (`sheet_alert_open`,
`sheet_settings_open`, `sheet_sound_open`, `sheet_settings_close` medians
and notes: mark-name data keys, not callers). Record the baselines file in
section 2 as an orphaning cost: removing the measures orphans its entries.
A hit beyond these four is a contradiction to record.

Cleanup, before anything else:

```bash
rm "$HOME/athan-gitree/worktrees/probe-65/node_modules"
git worktree remove --force "$HOME/athan-gitree/worktrees/probe-65"
```

Never commit from the worktree.

## Green run

Section 2 written; the worktree is gone (`git worktree list` shows no
probe-65 entry); `git status --porcelain` on uat lists only the plan and
queue files.

## Break script

None for a docs step; the LOG entry records the probe's failure counts
instead.

## Version and commit

Fetch `origin uat` first. Next patch after uat's `package.json`, the three
places, `app.json` first.

```
<VERSION> - docs(plans): 65 step 2, the removal probe results
```

## Review checklist

- No code file in the commit.
- Every "breaks" claim names a failing test or command; every "holds" claim
  names the passing suite.

## Merge

`git checkout uat && git merge --no-ff docs/65-2-probe -m "<VERSION> - merge docs/65-2-probe: removal probe (65 step 2)"`

## Done when

Checklist ticked, LOG.md entry under `### Step 02 — done` with the
`session:` line.
