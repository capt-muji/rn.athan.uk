### Step 4 — the executed records

Requirements: R1.1, R1.2, R1.3, R2.1, R2.2, R2.3, R2.4, R2.5, R3.1, R3.2 (the records say each landed)
Weight: 1

**Anchor check.** None: this step touches no production file.

**Goal.** The ticket's records land: the findings text in `LOG.md`, the queue row at `EXECUTED`, the checklist boxes ticked.

**Branch.** None beyond `ticket/80`, per the run order.

**Files.**

- `ai/plans/80-layout-follows-app-language/PLAN.md` (checklist boxes)
- `ai/plans/80-layout-follows-app-language/LOG.md` (findings text)
- `ai/plans/README.md` (row 80's status cell only)
- `app.json`, `package.json`

**Red tests.** None: a docs step. The hook's `Tests:` line still lands because the hook runs the whole staged suite.

**Change contracts.**

1. `PLAN.md`: tick all four checklist boxes in section 6.
2. `LOG.md`: the findings text under `## Findings (executed)`, with the measured values in place of each `<...>`:

```md
## Findings (executed)

- The React tree's root (`GestureHandlerRootView`, app/_layout.tsx) and the picker modal's
  overlay host (the app's one native-host root, ColorPicker.tsx) carry
  `direction: localeDirection(currentLocaleId())`: the layout follows the SELECTED app
  language in every launch state, and the system locale resolves the initial default only
  (her XS ruling). Proven red-first: `<the two _layout failures>` and
  `<the two picker-modal failures>`, green `<n>/<n>` cases per suite; mutations `<a, b, c
  each failing its named case>`; break `<last line>`.
- The crossing's relaunch context consumes a one-shot handoff marker
  (`preference_language_relaunch_handoff`, owner-delegated) written before `reloadAsync`
  and cleared on a refused reload, and the launch init skips the cold-launch
  refresh-gate reopen on that answer: an in-process reload cancels no alarm, so the reopen
  stays a cold-launch concern (row 78's aggravator closed). Convergence itself is
  untouched: `reconcileLanguageSurfaces` still runs in every launch context, the
  stamp semantics and the languageConvergence suite unchanged (all `<n>` green). The
  notification-language diagnosis recorded: an English Maghrib while the app spoke Arabic
  was convergence not yet landed — copy is baked at arm time — now bounded by row 78's
  10 s cap, the relaunch, and the relaunch context's own reconcile.
- The Qibla calibration wave mirrors on the locale's own direction (row 73's reported
  sibling read folded in), proven by the new suite's ar case red-first against the bridge
  read; the picker keeps its snapshot keying with both premise comments restated.
- The en-countdown colon observation needs no fix: row 82 ruled one colon design in every
  language (row 84 carries it; row 85 would restore the en letters only when she says go).
- Versions 2.0.405, 2.0.406, 2.0.407 landed on `ticket/80` (2.0.403 planning, 2.0.404 the
  ready plan, 2.0.408 this commit); `yarn validate` green at the head; the identifier
  gate clean. Device work waived by the owner's run order 2026-10-14: her device test is
  the acceptance bar.
```

3. `ai/plans/README.md`: row 80's status cell (the cell after the brief) becomes
   `EXECUTED 2026-10-14, awaiting audit` and nothing else in the row changes.

**Green run.** `npx tsc --noEmit`, `npx biome check . --error-on-warnings`, and the hook's full suite on the commit.

**Break script.** None: a docs step.

**Version and commit.** Version 2.0.408. Commit message:

```
2.0.408 - docs(plans): ticket 80 executed: the layout follows the app language, the relaunch handoff, the wave's own direction
```

**Review.** The findings text carries only values the steps measured; the queue row's pipes still parse (five pipes per row).

**Done when.** The commit is on `ticket/80` and LOG.md's step-4 entry ends with its `session:` line.
