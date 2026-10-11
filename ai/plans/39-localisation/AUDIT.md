# Job 39 audit record (2026-10-12)

Three reviewers: plan-conformance, blind, threading-and-lifecycle. Every finding
adjudicated by the lead against the code. The diff: `origin/uat..uat`, 10,841 lines,
154 files.

| # | Finding (reviewer) | Severity | Verdict | Action |
| --- | --- | --- | --- | --- |
| 1 | Plan-folder deletion breaks `yarn validate`: `nativeLocalesConfig.test.ts:15` and `widgetStaticStrings.test.ts:183` read `ai/plans/39-localisation/catalogs/*.json` the row orders deleted (plan) | must | Confirmed: ENOENT reproduced in the audit worktree with the folder renamed aside | FIX: copy `native-strings.json` and `widget-statics.json` in-repo beside `sourced-names.json` (the step-02 precedent), repoint both suites; move `catalogs/provenance.json` to `ai/plans/provenance-39.json`; the row names the survivors |
| 2 | `WHATS_NEW.version` stamped `2.0.37` can never equal any installed build; the language entry never renders; `whatsNew.test.ts:296` passes vacuously (plan + blind) | should | Confirmed: exact-equality gate at `shared/whatsNew.ts:218` vs app 2.0.53+ | FIX: re-stamp item and release to 2.0.54 (the audit-fix build the owner installs, proving R10.1 on a real device); the public-release row re-stamps at final sizing per D48 |
| 3 | `androidLocaleConfig` gated on `enableAndroidWidgets` (`app.config.ts:66`): a widgets-off Android build ships no `locales_config.xml` and re-risks ExtraTranslation (blind) | should | Confirmed from the config resolution | FIX: register the plugin for every Android resolution, decoupled from the widgets flag |
| 4 | Foreground-convergence comment claims the suspended device-language case the memoised resolver cannot serve (threading + plan + blind) | should | Confirmed: `locale.ts` memoises per process | FIX: delete the false clause (the recompute behaviour is row 66's investigation, not a silent change) |
| 5 | Remount key re-runs the launch effect: `reopenRefreshGateOnColdLaunch` plus `initializeNotifications` force a second full reschedule and widget push ~1.5 s after the convergence pass on every switch (threading) | should | Confirmed: the effect has no latch | FIX: latch at module level, inside the init timeout callback (`firstRenderMarked` pattern; a remount inside the 1.5s window must still run init once the cancelled first timeout never fires). Proven by the index suite's remount test (one render, advance, unmount, render, advance: initializeNotifications still once) plus the reviewer's source trace |
| 6 | `setEnglishWidth` write-time locale resolution lets an in-flight old-locale `onLayout` widen the new locale's key (threading) | nice | Confirmed as real but bounded (widen-only); it is row 61's defect family | CARRY to row 61 |
| 7 | Disabled prayers' channels keep the old language's name until re-enabled (blind) | nice | Confirmed; re-creating all channels changes the OS-visible channel list beyond the plan's letter | CARRY to row 66's convergence investigation |
| 8 | `whatsNew.ts:25` cites renamed `VISIBLE_WHATS_NEW`; `SegmentedControl.tsx:111` example passes renamed `ALERT_OPTIONS` (blind) | nice | Confirmed: stale names in comments | FIX: one line each, riding the fix commit |
| 9 | ~120-line harness duplicated between `widgetContract.test.ts:466` and `widgetStaticStrings.test.ts` (blind) | nice | Confirmed | NOTED: test-only refactor, no behaviour; left |
| 10 | Thai qibla cardinals stay Latin while every other locale localises (blind) | nice | Confirmed as a catalog-values question the owner owns | CARRY to D41 confidence-build verification (she reads every string) |

The fix commit: one branch, version 2.0.54, red tests for findings 1, 2, 3 and 5
first, the comment fixes riding. PASS follows the fix merge.
