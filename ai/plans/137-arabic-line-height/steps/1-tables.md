# Step 1: the expectation table from the shipped TTFs

Requirements: R1.1
Weight: 1

Anchor check: every anchor under `scripts/anchors/` counts exactly 1 at the "Planned at"
sha, by the count command in `ai/plans/TEMPLATE.md`.

Goal: one committed table of every candidate line-box height the two phones could render
for the measured surfaces, derived from the shipped Rubik bytes, plus the RN citation
re-check. The later steps match measurements against this table and nothing else.

Branch: `step-137/tables` off `uat`, in the lane worktree. Files: this plan folder's
`LOG.md` (append), `EXPECTATIONS.md` (new, plan folder).

Red tests: none. A docs step of an investigation; no code changes, so no test can go red.
The plan's contracts for this step are the script's printed numbers.

Change contracts:

- Run `python3 ai/plans/137-arabic-line-height/scripts/tables-137.py` from the worktree
  root. It prints, for `assets/fonts/Rubik-Regular.ttf` and
  `assets/fonts/Rubik-Medium.ttf`: hhea, typo, usWin and head-bbox sets in em; then the
  candidate single-line heights in layout pixels for sizes 13, 14, 15 and 22 at scales
  2.625 (the 3T) and 3 (the XS), each as the unrounded value and the nearest integer.
- Verify the RN citations of PLAN.md section 4 still hold, by grep, printing each hit:
  `grep -n "CustomLineHeightSpan" node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/views/text/TextLayoutManager.kt | head -4`,
  `grep -n "setIncludePad" node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/views/text/TextLayoutManager.kt`,
  `grep -n "setIncludeFontPadding(true)" node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/views/text/ReactTextView.java`,
  and `grep -n "enumerateLineFragmentsForGlyphRange" node_modules/react-native/ReactCommon/react/renderer/textlayoutmanager/platform/ios/react/renderer/textlayoutmanager/RCTTextLayoutManager.mm`.
  Any grep printing nothing is a STOP: the pinned dependency moved.
- Write `EXPECTATIONS.md` holding the script's full output verbatim and one line per
  surface naming its nominal size, face and pin state, from the anchors.

Green run: the script exits 0 and prints both fonts' blocks; the four greps print their
hits; `EXPECTATIONS.md` exists and holds the output.

Break script: none. A docs step; nothing can break at runtime. The reviewer re-derivation
replaces it: rerunning the script must reproduce `EXPECTATIONS.md` byte for byte.

Version and commit: bump the patch version in `app.json` and `package.json` under the
version and commit locks; `android/app/build.gradle` does not exist in this worktree
(`android/` is gitignored) and is never committed from it. Commit message:
`<VERSION> - docs(plans): 137 step 1, the line-box expectation table from the shipped TTFs`.
Add by name: `ai/plans/137-arabic-line-height/EXPECTATIONS.md`,
`ai/plans/137-arabic-line-height/LOG.md`, `ai/plans/README.md` (the row moves to
`IN PROGRESS, step 1`), and the two committed version files, `app.json` and
`package.json`, by name. The gradle `versionName` is never committed from a worktree:
`android/` is gitignored here, and the lead syncs it in the main tree under the build
lock after the merge.

Review: read the diff cold. The numbers must come from the script, never from memory or
from row 118's rounded history.

Merge: into `uat` in the main tree, `--no-ff`, under the `uat` lock with the
version-uniqueness check first; the gradle `versionName` sync is the lead's main-tree
action under the build lock, never a worktree commit.

Done when: `EXPECTATIONS.md` is committed, LOG.md holds `### Step 01 — tables` with the
script's tail lines, the row reads `IN PROGRESS, step 1`, and the merge landed.
