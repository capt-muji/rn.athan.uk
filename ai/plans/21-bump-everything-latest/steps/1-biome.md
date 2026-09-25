# Step 1: `@biomejs/biome` 2.5.13 to 2.5.14, with `biome.json`'s `$schema`

0. **Anchor check.** From the repository root; must print `1`:

   ```bash
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/21-bump-everything-latest/scripts/anchors/1-1.txt biome.json
   ```

   Any count other than `1` means NEEDS REPLAN (section 2.2, item 1).

1. **Goal:** Biome runs at 2.5.14 and `biome.json` names that same version in its `$schema`.

2. **Branch:** `git checkout -b chore/bump-biome-2-5-14 uat-2`

3. **Files:** `package.json`, `yarn.lock`, `biome.json`, `app.json`.

4. **Tests first (red).** No new test. The red is Biome itself reporting the schema mismatch. Install first:

   ```bash
   yarn add --dev @biomejs/biome@2.5.14 && npx biome check . --error-on-warnings
   ```

   It exits 0 but MUST print these lines, which is the defect this step closes:

   ```
   i The configuration schema version does not match the CLI version 2.5.14
   i   Expected:                     2.5.14
       Found:                        2.5.13
   ```

   If those lines do not appear, STOP: the version relationship is not what the plan expects.

5. **Change.** This is a `(specified)` step. Edit exactly one line of `biome.json`, the `$schema` value, from
   `https://biomejs.dev/schemas/2.5.13/schema.json` to `https://biomejs.dev/schemas/2.5.14/schema.json`.

   Edit it in place, as a one-line text edit. Do NOT rewrite `biome.json` with a JSON parser and re-serialise it: the
   planning session tried that in the spike and `JSON.stringify` reflowed 17 unrelated lines, which Biome's own
   formatter then rejected. The diff for this file must be exactly one line changed.

   2.5.14 adds three lint rules (`noReturnInFinally`, `noSvelteAtDebugTags`, `useValidTestTitle`). All three are
   `nursery`, and `biome.json` selects the `recommended` preset, which does not enable nursery rules, so no rule
   becomes active and no source file changes in this step.

6. **Green.**

   ```bash
   npx biome check . --error-on-warnings
   npx tsc --noEmit
   npx jest --silent --coverage
   ```

   Biome exits 0 and prints `Checked 342 files` with NO `i The configuration schema version does not match` line.
   `tsc` exits 0. The suite prints `Test Suites: 170 passed, 170 total` and
   `Tests: 2 skipped, 4647 passed, 4649 total`, with four `100%` coverage lines.

7. **Breaks.** `bash ai/plans/21-bump-everything-latest/scripts/breaks-1.sh`, which ends `ALL AS EXPECTED: 1`.

8. **Version and commit.** Version command:

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   ```

   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add by name: `package.json`,
   `yarn.lock`, `biome.json`, `app.json`, plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

   ```
   <VERSION> - chore(deps): biome 2.5.14

   Biome 2.5.14 exits 0 against the old config but reports the schema version
   mismatch on every run, so `biome.json`'s $schema moves in the same commit.

   The three rules 2.5.14 adds are all nursery, and this project selects the
   recommended preset, so none becomes active and no source file changes.
   ```

9. **Review.** No subagent (section 11). The session reviews its own diff: `biome.json` is one line, no source file
   changed, and the mismatch notice is gone. Recorded in `LOG.md`.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/bump-biome-2-5-14 -m "Merge chore/bump-biome-2-5-14 into uat-2: biome 2.5.14"
    ```

11. **Done when:**
    - `node -p "require('./node_modules/@biomejs/biome/package.json').version"` prints `2.5.14`;
    - `grep -c "2.5.14" biome.json` prints `1`;
    - `npx biome check . --error-on-warnings` exits 0 and prints no schema-mismatch line;
    - `git show --stat HEAD -- biome.json` shows `1 insertion(+), 1 deletion(-)`.
