# Audit: Session 15c. Tapping an Android widget opens the app

| Field | Value |
| --- | --- |
| Audited | 2026-09-24 |
| Range | `origin/uat-2..uat-2`, eleven commits, `9351fda7` through `394c2ccc` |
| Plan | `ai/plans/15c-android-widget-tap-open/PLAN.md` |
| Worktree | `~/athan-device-sweep/worktrees/audit-15c`, removed after the verdict |
| Verdict | **PASS** |

## What was checked

| # | Check | How | Result |
| --- | --- | --- | --- |
| 1 | The range holds only this session's work | `git log --oneline origin/uat-2..uat-2` | Eleven commits: one planning pair, four step pairs, all session 15c. Nothing foreign |
| 2 | Versions in sequence | `git show <sha>:package.json` for each step | 345, 346, 347, 348, 349, 350, one patch apart, each commit message starting with its own version |
| 3 | No file outside the plan's lists | `git diff --name-only 31416a38 uat-2` | 18 files: the plan folder, `ai/plans/README.md`, `ai/prompts/README.md`, `FINDINGS.md`, `app.json`, `package.json`, the patch, the two test files and the layout. Nothing else |
| 4 | The whole suite | `yarn validate` in the scratch worktree | Exit 0. `Tests: 2 skipped, 4642 passed, 4644 total`, and 100% on statements (4198/4198), branches (1876/1876), functions (853/853) and lines (3789/3789) |
| 5 | Step 2's breaks still guard | The step's script, rewritten to the worktree path, after `grep -c '/Users/muji/repos/rn.athan.uk'` printed 0 | Four `caught:` lines, `caught 4 of 4`, `ALL AS EXPECTED: 1` |
| 6 | Step 3's breaks still guard | Same | Six `caught:` lines, `caught 6 of 6`, `ALL AS EXPECTED: 1`, and the converter back at `openApp` count 2 |
| 7 | The red check reproduces | Reverted `widgets/PrayerWidget.tsx` to `31416a38` in the worktree, keeping the tests | `Tests: 5 failed, 43 passed, 48 total`, exactly the five the plan names |
| 8 | The patch is what the plan specified | Read the patch and the patched converter | One file under `android/src/`, 14 added and 2 removed lines, two imports both used, `openApp` Boolean defaulting false between `modifiers` and `target`, `props.openApp` tested before `props.target`, `launchAppAction` returning `Action?` and naming no activity class, one comment and it says why |
| 9 | The layout change is what the plan specified | Read the diff | One `AOpenApp` helper, one definition, exactly two call sites (`ACard` and the medium return), the wrapper carrying only `openApp` and one `fillMaxSize()` |
| 10 | No visual change | `git diff 31416a38 uat-2 -- widgets/PrayerWidget.tsx` grepped for every geometry constant, colour, font size and weight | No match. `A_ROW_HEIGHT`, `PILL_VPAD`, `FOOTER_BOTTOM_PAD`, `HERO_WIDTH`, `LIST_WIDTH` and every `REFERENCE_` constant are untouched, and the iOS branch has no changed line |
| 11 | Device evidence backs every claim | Read `~/athan-device-sweep/session15c/3t-tap.log` and `emulator-tap.log` | Both `START ... cmp=com.mugtaba.athan/.MainActivity` lines quoted in `FINDINGS.md` are present verbatim, and `grep -c 'Background activity launch blocked'` is 0 in both |
| 12 | The phone was left as the plan says | Read-only adb | `auto_time` 1, 8 placements intact, the 1.27.349 production build installed, the emulator killed |
| 13 | The owner's rules | Grepped the range | No `releases.json`, no `uat`, no EAS, no API key, no ignore comment, no `--no-verify` |
| 14 | Reviews recorded | `LOG.md` | A verdict for all four steps, each listing the checks it ran |

## Findings

**None that change the code.** Three things are recorded because the audit should say them plainly, not because
anything needs fixing.

1. **Step 1's merge carried the commit without its review paragraph, and `LOG.md` says so itself.** The paragraph was
   added by an amend (`b9885fa1`) that the `git checkout uat-2` before the merge left behind, so `6e5bb262` merged
   `0a7d72ab`. `git diff 0a7d72ab b9885fa1` is `LOG.md` and 11 insertions, nothing else, and the text was restored in
   step 2's commit. `uat-2` was not rewritten to fix a documentation-only difference, which is the right call.
2. **The plan was corrected twice while it ran, and both corrections are in the range.** The planning session found
   that a type-only break proves nothing under `@babel/preset-typescript`; the execution session found the same
   substring trap a second time, in step 3's Glance-import assertion, where `actionStartActivityGone` still contains
   `actionStartActivity`. The test now asserts the trailing newline and the break is caught. Both are written into
   `PLAN.md`, so the plan records what shipped.
3. **The 2036 alarm's id and instant differ from the plan's.** The plan named `2104803640505`; the dump showed
   `2105564951212` for `com.mugtaba.athan`. Same class of self-rearming alarm, same year, re-armed since the plan was
   written. Nothing unexpected was armed, and this session changed no clock.
4. **The plan's section 8 gave a replacement row for `ai/prompts/README.md` that has no row to replace.** That file's
   live table holds one row, session 11; every finished session lives in its "Closed prompts (index)" list instead,
   and that list had already fallen behind at 13, missing 15, 15b and 15d. The audit added 15c to the index in the
   list's own one-line form rather than inventing a table row the file does not use. Sessions 15, 15b and 15d are
   still missing from it, which is not this session's work to fix.

## The evidence for the session's one claim

Tapping an Android widget opens the app, with the app dead beforehand, on both the oldest Android the project
supports and a modern one:

| Device | Android | Before | After |
| --- | --- | --- | --- |
| OnePlus 3T | 9 (API 28) | `pidof` empty | pid 22537, `MainActivity` resumed |
| athan_test_avd | 15 (API 35) | `pidof` empty | pid 3944 |

The Android 15 line carries `(BAL_ALLOW_VISIBLE_WINDOW)`, which is the system stating that the
background-activity-launch check ran and passed. That is the risk the owner's rejected option B could never have
retired on a phone running Android 9.

## Verdict

**PASS.** The row moves to DONE and `uat-2` is pushed.
