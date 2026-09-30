# Step 2: The invariant that keeps it gone

This step is **(files)**: it copies one finished test file the plan carries, and changes nothing in it.

**This step is the session's only deliverable.** Step 1 deletes; a deletion leaves nothing behind that
can fail, so without this step the cleanup is unguarded and the next session reintroduces an artefact
by copying a neighbour that still imports one. This converts `BRIEF.md`'s manual `grep` judgement into
a test the suite runs on every commit forever.

0. **Anchor check.** None: this step adds one new file and edits nothing. Instead, confirm step 1 landed:

   ```bash
   grep -rniE 'qibla|kaaba|pmtiles|tilecache' app/ components/ device/ hooks/ shared/ stores/ widgets/ api/
   ```

   It must print nothing. If it prints anything, step 1 is incomplete: STOP.

1. **Goal.** A test refuses any future file that mentions the qibla feature in its content or its
   filename, anywhere in a shipped directory.

2. **Branch.** `git checkout -b test/44-qibla-stays-deleted uat-2`

3. **Files.**

   Added:
   - `shared/__tests__/qiblaRemoved.test.ts`

   Edited:
   - `app.json`, `package.json` (the version bump)

   Nothing else, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).**

   Copy the file the plan carries:

   ```bash
   cp ai/plans/44-qibla-cleanup/files/qiblaRemoved.test.ts.txt shared/__tests__/qiblaRemoved.test.ts
   ```

   Change nothing in it. Then prove it can FAIL, by planting exactly what it exists to catch:

   ```bash
   printf 'export const qiblaBearing = (): number => 118.9;\n' > shared/qiblaReborn.ts
   npx jest shared/__tests__/qiblaRemoved.test.ts --watchman=false --selectProjects=unit
   ```

   Expected: the suite FAILS, with the first failing test
   `the qibla work removed by session 44 › leaves no trace of itself in any shipped directory, tests included`
   and a diff naming `shared/qiblaReborn.ts:qibla`. Measured in the scratch worktree: `Tests: 1 failed, 1 passed, 2 total`.

   Then remove the planted file, and the suite must pass:

   ```bash
   rm shared/qiblaReborn.ts
   npx jest shared/__tests__/qiblaRemoved.test.ts --watchman=false --selectProjects=unit
   ```

   Expected: `Tests: 2 passed, 2 total`.

   If the suite passes WITH the planted file present, it guards nothing: STOP.

   No existing test changes in this step.

5. **Change.** None beyond the copied file. The file is carried rather than specified because every term
   in it is load-bearing, and three of them were found the hard way while planning:

   - **The words are built from fragments** (`'qib' + 'la'`) and the file excludes itself by path,
     because a suite that lists forbidden words CONTAINS them: the first draft's only failure was
     itself.
   - **Content and filename use different word lists.** `mvt` is forbidden in a FILENAME, where it
     catches the two binary `.mvt.gz` fixtures that a content search of `.ts` files can never read, and
     allowed in content, where it would match ordinary prose.
   - **The search's own coverage is pinned by a second test**, because widening the self-exclusion from
     one file to every test file left the first draft passing while a planted artefact went unseen.

6. **Green.**

   ```bash
   npx jest --watchman=false --coverage 2>&1 | tail -12
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

   Expected, measured in the scratch worktree at `4d734cfc`:

   ```
   Statements   : 100% ( 4401/4401 )
   Branches     : 100% ( 1977/1977 )
   Functions    : 100% ( 912/912 )
   Lines        : 100% ( 3961/3961 )

   Test Suites: 178 passed, 178 total
   Tests:       4786 passed, 4786 total
   ```

   The coverage numbers are unchanged from step 1 because a test file is not measured source. Both `tsc`
   and Biome exit 0.

7. **Breaks.** Save to `$TMPDIR/breaks-44-2.sh` and run `bash $TMPDIR/breaks-44-2.sh` from
   `/Users/muji/repos/rn.athan.uk`.

   Breaks 1 and 2 plant an artefact and expect the guard to catch it. Break 3 attacks the guard itself,
   which is the one that mattered: it SURVIVED the first draft and is the reason the second test exists.

   ```bash
   #!/bin/bash
   # Breaks for session 44, step 2. Run from the repository root.
   set -u
   SUITE=shared/__tests__/qiblaRemoved.test.ts
   CAUGHT=0
   TOTAL=0

   judge() {
     local label="$1"
     TOTAL=$((TOTAL + 1))
     if npx jest "$SUITE" --watchman=false --selectProjects=unit > "$TMPDIR/break-44-2.log" 2>&1; then
       echo "SURVIVED: $label"
     else
       echo "CAUGHT: $label"
       CAUGHT=$((CAUGHT + 1))
     fi
   }

   # 1. A new source file names the feature.
   printf 'export const qiblaBearing = (): number => 118.9;\n' > shared/qiblaReborn.ts
   judge "a new shared/ file naming the feature"
   rm -f shared/qiblaReborn.ts

   # 2. One word creeps back as a comment in a file that legitimately survives.
   cp stores/ui.ts stores/ui.ts.bak44
   printf '\n/** Reference to the qibla sheet */\n' >> stores/ui.ts
   judge "a comment in a surviving file"
   mv stores/ui.ts.bak44 stores/ui.ts

   # 3. The guard's own self-exclusion is widened to hide a planted artefact. Without the coverage
   #    test this SURVIVES, which is exactly what the first draft did.
   cp "$SUITE" "$SUITE.bak44"
   perl -0pi -e "s|if \(path === SELF\) continue;|if (path.includes('__tests__')) continue;|" "$SUITE"
   if cmp -s "$SUITE" "$SUITE.bak44"; then
     echo "BREAK NOT APPLIED: the guard's self-exclusion widened"
     TOTAL=$((TOTAL + 1))
   else
     printf 'export const qiblaBearing = (): number => 118.9;\n' > shared/__tests__/sneak.test.ts
     judge "the guard's self-exclusion widened to every test file"
     rm -f shared/__tests__/sneak.test.ts
   fi
   mv "$SUITE.bak44" "$SUITE"

   echo "caught $CAUGHT of $TOTAL"
   [ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   Expected: three `CAUGHT` lines, `caught 3 of 3`, `ALL AS EXPECTED: 1`. Afterwards
   `git status --porcelain` lists only this step's files and the three plan files, and no `.bak44` or
   `sneak.test.ts` remains. A `SURVIVED` or `BREAK NOT APPLIED` line is a STOP (section 2.2, item 3).

8. **Version and commit.**

   ```bash
   node -p "const v=require('/Users/muji/repos/rn.athan.uk/package.json').version.split('.');v[2]=+v[2]+1;v.join('.')"
   ```

   Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`).

   Add by name: `shared/__tests__/qiblaRemoved.test.ts`, `app.json`, `package.json`, plus
   `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

   Write to `$TMPDIR/msg-2.txt`, replacing `<VERSION>`:

   ```
   <VERSION> - test(qibla): no shipped file may name the deleted feature, step 2 of session 44

   A deletion leaves nothing behind that can fail, so this is what makes step 1 stick: no file under
   api/, app/, components/, device/, hooks/, shared/, stores/ or widgets/ may name the qibla feature
   in its content or its filename, except this suite.

   Three properties are load-bearing and each was found by spiking the suite before specifying it.
   The words are built from fragments and the file excludes itself by path, because a suite listing
   forbidden words contains them: the first draft's only failure was itself. Filenames and content use
   different word lists, since mvt catches the two binary fixtures a content search of .ts files can
   never read while matching ordinary prose. And a second test pins the search to every shipped file
   but one, because widening the self-exclusion to every test file left the first draft green while a
   planted artefact went unseen.
   ```

   Commit with `git commit -F $TMPDIR/msg-2.txt` in the background. In the log, the last `Tests:` line
   must end `passed, 4786 total`, and four `100%` coverage lines must be present.

9. **Review.** Read `git show <sha>` back cold and check:
   - the added file is byte for byte the plan's: `diff ai/plans/44-qibla-cleanup/files/qiblaRemoved.test.ts.txt shared/__tests__/qiblaRemoved.test.ts` prints nothing;
   - no other file changed except the two version files and the three plan files;
   - the suite's header comment says WHY it exists, not what it does;
   - the version is bumped and the two files match;
   - nothing beyond the step.

   A clean read finds nothing to change. A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff test/44-qibla-stays-deleted -m "Merge test/44-qibla-stays-deleted into uat-2: the qibla cannot come back unnoticed, reviewed"
    ```

11. **Done when.**
    - `npx jest shared/__tests__/qiblaRemoved.test.ts --watchman=false --selectProjects=unit` reports `Tests: 2 passed, 2 total`;
    - `npx jest --watchman=false 2>&1 | tail -3` reports 178 suites and 4786 tests passing;
    - `python3 scripts/find-unused-exports.py | tail -7` reports exactly the five pre-existing allow-listed entries;
    - the step is ticked in `PLAN.md` section 6 as `- [x] Step 2: DONE in <sha>`.
