# Step 4: Audit the tree: no dead code, compact why-only comments

0. **Anchor check.** None: this step's target is found by a search, not by an anchor.

1. **Goal:** leave nothing behind. The owner asked for it in his own structure: 🐋  "a step after that is a complete
   audit. Make sure there's no dead code, all the comments are compact, simplified."

2. **Branch:** `git checkout -b chore/45-audit-the-tree uat-2`

3. **Files:**

   | File | What |
   | --- | --- |
   | `metro.config.js` | Remove `pmtiles` and `mvt` from `assetExts` |
   | `app.json`, `package.json` | Version bump |

   Plus whatever the sweep in part 5 finds, which the executor lists in `LOG.md` before changing anything.

4. **Tests first (red).** None of its own: this step deletes configuration nothing reaches and tightens comments.
   The whole suite is the gate, and coverage must stay at 100% on all four measures.

5. **The sweep.** Run each of these and write what it printed into `LOG.md`.

   ### 5.1 The tile pipeline's leftovers in `metro.config.js`

   ```bash
   grep -n "pmtiles\|mvt" metro.config.js
   ```

   Expected: one line, the `assetExts` line, carrying both. **Session 44 missed this because its guard searched only
   the shipped directories** (`api app components device hooks shared stores widgets`), and `metro.config.js` is at
   the repository root. Remove both extensions and the comment above them that explains why a binary tile was
   carried, because no binary tile is carried any more. The line returns to:

   ```js
   assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
   ```

   `metro.config.js` is in `UNMEASURED` and is excluded from Biome, so nothing tests it: **prove the change by
   building**, part 7.

   ### 5.2 Dead exports

   ```bash
   python3 scripts/find-unused-exports.py | tail -10
   ```

   Expected: only the five pre-existing allow-listed entries (`ErrorBoundary` and the four `MAX_WHATS_NEW_*`). Any
   qibla symbol listed is dead code: **delete the symbol and its tests together**, to a fixpoint, because a private
   helper left with no caller is the same debt one level down (owner ruling, 2026-09-27). **Never add anything to
   the allow list.**

   ### 5.3 Comments

   ```bash
   grep -n "//" shared/qiblaGeometry.ts shared/qiblaAlignment.ts device/qibla.ts hooks/useQibla.ts \
     components/sheets/screens/Qibla.tsx
   ```

   Read every one against the owner's rule, quoted in full because this is the step that enforces it:

   🐋  "the comments should be extremely compact, and they should only explain the why, and they should never explain
   the how or the what, because those two should be self-explanatory from your code. If it's not self-explanatory,
   then it's not clean enough, it's not good enough, it's not refactored enough."

   For each comment, in order:

   1. Does it explain WHY? Keep it, and cut it to one line if it runs longer and one line will do.
   2. Does it explain WHAT or HOW? **Delete it, and fix the code instead**: rename the symbol, split the function, or
      flatten the expression. A comment is never the fix for unclear code.
   3. Would removing it lose nothing? Remove it.
   4. Is it a styling or layout annotation, a date, a history note or a provenance line? Remove it: that belongs in
      `ai/AGENTS.md`.

   Four comments are load-bearing and **must survive**, because each records a trap that cost measurement:

   | File | What it must still say |
   | --- | --- |
   | `shared/qiblaGeometry.ts` | Why the path's points are evenly spaced rather than bunched at the user |
   | `shared/qiblaGeometry.ts` | Why the line is a curve rather than straight |
   | `device/qibla.ts` | Why `trueHeading` is used untouched |
   | `hooks/useQibla.ts` | Why the watch can finish setting up after the sheet closed |

   ### 5.4 Nothing left over anywhere

   ```bash
   grep -rn "TODO\|FIXME\|XXX\|console\.log" shared/qibla*.ts device/qibla.ts hooks/useQibla.ts \
     components/sheets/screens/Qibla.tsx
   git status --porcelain
   ls ~/athan-device-sweep/worktrees/
   git worktree list
   git branch
   ```

   The first returns nothing. `git status --porcelain` lists only this step's files. `git worktree list` holds the
   main checkout and the five build worktrees and nothing else. `git branch` holds no branch this session made
   beyond the current one: **delete any this session left**, because 400 branches accumulated once
   (`ai/AGENTS.md` section 7).

   ### 5.5 The plan's own record is true

   Reread `PLAN.md` and every step file against what actually shipped. Where the plan was wrong, **correct the step
   file**, so the plan records what shipped rather than what was intended (`AUDITOR-BRIEF.md` section 4's rule,
   applied here by the session itself).

6. **Green.**

   ```bash
   npx jest --watchman=false --coverage --silent
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

   Four `100%` lines, and the same passing count as step 2 unless part 5.2 deleted something, in which case
   `LOG.md` says what and why.

7. **The build still works after the metro change.** `metro.config.js` is untested by anything, so the only proof is
   a bundle:

   ```bash
   npx expo export --platform ios --output-dir $TMPDIR/export-45 > $TMPDIR/export-45.log 2>&1
   ```

   Expected: it completes and writes a bundle. A failure naming `pmtiles`, `mvt` or an unresolved asset means
   something still references them, which is a STOP: quote the line. Delete `$TMPDIR/export-45` afterwards.

8. **Breaks.** Rerun step 2's script, because this step edits the files it substitutes into:

   ```bash
   bash $TMPDIR/breaks-45.sh | tail -2
   ```

   Expected: `caught 18 of 18`, `ALL AS EXPECTED: 1`. **A `BREAK NOT APPLIED` here means a comment edit moved text a
   break searches for**, which is session 41's lesson in its second form: rerun a break script after a REFACTOR, not
   only after a change. That is a STOP, because the plan's search text must match what shipped.

9. **Version and commit.**

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   ```

   Commit message:

   ```
   <VERSION> - chore(qibla): the tree after the map, swept

   metro.config.js still listed pmtiles and mvt in assetExts, left by session 41's tile pipeline and
   missed by session 44 because its guard searched only the shipped directories and metro.config.js
   sits at the root. Nothing carries a binary tile any more, so both come out, proven by a bundle
   rather than by a test, since metro.config.js is measured by nothing.

   Comments read one by one against the owner's rule: why only, never what or how, extremely compact.
   <what changed, or "every comment already explained why">

   Dead exports: <what the sweep found, or "none beyond the five pre-existing allow-listed entries">.
   ```

10. **Review.** Read `git show <sha>` back cold, against this checklist:

    - [ ] `metro.config.js` no longer names `pmtiles` or `mvt`, and the comment that explained them is gone with them.
    - [ ] Every surviving comment explains WHY, in one line wherever one line does.
    - [ ] The four load-bearing comments in part 5.3 all survive.
    - [ ] No comment carries a date, a history note or a provenance line.
    - [ ] `find-unused-exports.py` reports only the five pre-existing entries, and nothing was added to the allow list.
    - [ ] No behaviour changed: no test's expectation moved.
    - [ ] The break script still catches 18 of 18.

11. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/45-audit-the-tree \
      -m "Merge chore/45-audit-the-tree into uat-2: the tree swept after the map, reviewed"
    ```

12. **Done when:**

    ```bash
    grep -c "pmtiles\|mvt" metro.config.js
    # 0
    python3 scripts/find-unused-exports.py | tail -8
    # only the five pre-existing allow-listed entries
    npx jest --watchman=false --coverage --silent | tail -6
    # four 100% lines, 0 failing
    bash $TMPDIR/breaks-45.sh | tail -2
    # caught 18 of 18 / ALL AS EXPECTED: 1
    git worktree list | wc -l
    # 6: the main checkout and the five build worktrees
    ```
