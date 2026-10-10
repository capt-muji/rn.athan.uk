# Audit record: Job 38

Range: `origin/uat (53eecb99)..uat`, 38 commits, diff 16,589 lines (ai/plans excluded).
Reviewers: plan-conformance, blind, blind threading/lifecycle (all read-only, dispatched in
parallel over the worktree at uat). Adjudication by the lead, every verdict confirmed from the
code or a run.

## Verdicts

| # | Source | Finding | Verdict |
| --- | --- | --- | --- |
| 1 | blind, must | Nested calls as parameters (`Alert.alert(t(..), t(..), ..)` at device/qibla.ts:37, hooks/useNotification.ts:59, shared/notifications.ts:131 and :180, hooks/usePrayerAgo.ts:39, components/prayer/Alert.tsx:183) | Confirmed: the diff lines introduce them; breaks the owner pattern "store each call in a variable". Fix: hoist locals |
| 2 | blind, should | Loading sentinel `id: 'fajr'` (hooks/usePrayer.ts:64) resolves loading/out-of-range Standard rows to canonical index 0, not the row's own index as `english: ''` did via the fallback; stores/notifications.ts:646 doc claims exact old behavior | Confirmed in both halves: the doc's mechanism is false for Standard rows (indexOf('fajr')=0, fallback never fires) and the out-of-range transient draws `Fajr` plus Fajr's bell where 1.29.x drew empty plus the own-row bell, breaking the byte-identical promise (PLAN.md section 1). The list gate (List.tsx:77) hides the primary loading frame, so the delta is the mid-selection transient only. Fix: guard the two consumers, correct the doc |
| 3 | blind, should | i18nBridge.test.ts:41 afterAll `process.exit(0)` runs before Jest computes its exit code, so `yarn i18n:import` cannot fail | Confirmed from the source. Fix: delete the afterAll |
| 4 | blind, should | scan-strings rule 2 flags every bare JSX string attribute, forcing brace churn and per-file SHEET_ICON_COLOR/SETTINGS_PERF_NAME constants | Rejected: narrowing rule 2 to a display-attribute allowlist re-opens the hole the guard closes; the strictness is the plan's own design (R5.1) and the churn is code-shape only. The constant dedup carries to row 39 |
| 5 | blind, nice | widgetTypes `id`/`strings` required but documented absent on v1/v5 entries | Rejected for stage one: plan-given contract (step 13), runtime guards exist and are tested. Carries to row 39 |
| 6 | blind, nice | device/__tests__/notifications.test.ts:40 duplicate test bodies; first named for a lowercasing behavior that no longer exists | Confirmed: both tests assert the same `last third` identifier. Fix: delete the stale one |
| 7 | blind, nice | Stale comments naming deleted constants or the old name field (components/prayer/Alert.tsx:62, shared/constants.ts:15, shared/prayer.ts:544, shared/widgetTypes.ts:54 and :112, stores/version.ts:317, stores/__tests__/notifications.test.ts:257, components/overlay/overlayContent.ts:7) | Confirmed by sampling. Fix: update to the id vocabulary |
| 8 | blind, nice | scripts/i18n-export.mjs + i18n-import.mjs duplicate the yarn entry points command-for-command | Rejected: plan-given stage-two entry points whose docblocks pin the equivalence; row 39 owns the pipeline shape |
| 9 | blind, nice | scan-strings.mjs:141 comment says "no allowlist at all" above allowlist-reading code | Confirmed: means "pinned empty", reads as "ignores allowlists". Fix: reword |
| 10 | threading, nice | Module-scope `t()` bakes five surfaces (Alert.tsx:31,43, ReminderCard.tsx:10, help.ts:48, whatsNew.ts:258) into the launch locale | Rejected as a stage-one defect: unreachable while `CURRENT_LOCALE_ID` is the constant `'en'`. Carries to row 39 |
| 11 | threading, nice | InitialWidthMeasurement.tsx:23 picks the measured row by TITLE length but renders `prayerLabel`, correct only while orderings coincide | Same verdict: carries to row 39 |
| 12 | plan-conf, should | LOG.md records no review verdict for step commits 27cf0014, 8230a9a9, 78d9d957, b7ccb335, a02e1450, 1fe389e6, 790b8f4e while the merges and the row claim "reviewed" | Confirmed: zero Review lines in the step 9-15 sections (the verdicts lived in the ROTATE returns). Fix: append the verdict lines |
| 13 | plan-conf, should | `TEXT.sizeArabic` and `TEXT.lineHeight.arabic` (shared/constants.ts:311-318) dead since step 3 deleted their last reader | Confirmed: no reader outside constants.ts. Fix: delete both members |
| 14 | plan-conf, should | `@param prayerName`/`english` docs on `id`-typed params (stores/notifications.ts:195,199, shared/prayer.ts:288,292,484,490,507, hooks/usePrayer.ts:79) | Confirmed by sampling. Fix: rename the mentions |

Threading pass verified clean on all four hunt areas (seed order before atoms, no import cycle,
worklets untouched, per-fire content builders, byte-identical identifiers, guarded widget props,
synchronous MMKV). Plan-conformance verified all 15 step contracts, identifier bytes, catalog
parity, the version-guarded stamp, widget v6 tolerance and the guard closure, including a vision
read of the prod render frame and a direct epoch comparison of the alarm dumps.

## Fixes (one branch, one version, one commit)

1. Hoisted every nested `t()`/`prayerLabel()` call into locals at all six sites.
2. Guarded the vanished-row frame's NAME only (Prayer.tsx render, Alert.tsx a11y label):
   the atom resolution needed no guard, because the empty-time frame is masked by R5's
   unavailable logic (getShownAlert forces Off, the unavailable sheet reads no atoms), and
   the reviewer's index-guard would have changed hook flow for nothing observable. The
   notifications.ts doc now states the real mechanics. Red tests: Prayer.test.tsx and
   Alert.test.tsx pin the frame at Standard index 6, proven failing before the fix.
   Also found while testing: an out-of-range Extras index crashes the row through the
   fallback atom lookup (`extraPrayerAlertAtoms[9]` undefined) - pre-existing at `origin/uat`
   (the old `''` sentinel took the same fallback), so out of this audit's scope.
3. Deleted the `afterAll` `process.exit(0)`. Red proof: a corrupted `dist/en.json` failed the
   round-trip test yet the run exited 0 before the fix, 1 after.
4. Deleted the stale `lowercases` duplicate test.
5. Updated the stale comments and docblocks to the id vocabulary (EXTRA_PRAYER_IDS, `id`
   params, id examples); reworded the scan-strings allowlist comment.
6. Deleted the dead `TEXT.sizeArabic` and `TEXT.lineHeight.arabic`.
7. Recorded the step 9-15 review verdicts in LOG.md.
