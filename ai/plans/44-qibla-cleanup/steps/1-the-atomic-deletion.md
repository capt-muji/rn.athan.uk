# Step 1: The whole feature, in one cut

This step is **(specified)**: build it from the contracts below, except for the two files the plan
carries under `files/`, which are copied byte for byte (part 5 says which).

**This step is large on purpose, and the reason is measured rather than stylistic.** The planning
session tried to split it two ways and both left `uat-2` red, so a smaller step is not available:

- Deleting the screen alone breaks `components/sheets/screens/__tests__/Settings.test.tsx`, which
  imports `../Qibla` (`Cannot find module '../Qibla'`).
- Deleting the screen and the Settings row together still fails
  `shared/__tests__/unusedExports.test.ts`, because `readPosition`, `tilesAround` and `qiblaBearing`
  become unreachable the moment their last caller goes, and that suite reports exactly that. Measured:
  `Test Suites: 1 failed, 187 passed`, with those three symbols named in the diff.

That suite is a tripwire against half-deleted code, and it is right. The feature comes out in one
commit.

0. **Anchor check.** Run, from `/Users/muji/repos/rn.athan.uk`:

   ```bash
   A=ai/plans/44-qibla-cleanup/scripts/anchors
   for pair in "1-ui-atom.txt stores/ui.ts" "1-ui-helpers.txt stores/ui.ts" \
     "1-sheets-index.txt components/sheets/index.ts" \
     "1-screens-index.txt components/sheets/screens/index.ts" \
     "1-layout-import.txt app/_layout.tsx" "1-layout-render.txt app/_layout.tsx" \
     "2-settings-import.txt components/sheets/screens/Settings.tsx" \
     "2-settings-alert.txt components/sheets/screens/Settings.tsx" \
     "2-settings-handler.txt components/sheets/screens/Settings.tsx" \
     "2-settings-row.txt components/sheets/screens/Settings.tsx" \
     "2-icon-enum.txt shared/types.ts" \
     "2-icon-import.txt assets/icons/svg/index.ts" \
     "2-icon-map.txt assets/icons/svg/index.ts" \
     "2-whatsnew-item.txt shared/whatsNew.ts" \
     "3-package-location.txt package.json" "3-package-fflate.txt package.json" \
     "3-jest-location.txt jest.config.js" "3-appjson-permission.txt app.json"; do
     set -- $pair
     echo "$1 $(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$1" "$2")"
   done
   ```

   All 18 lines must end in ` 1`. Any other count means NEEDS REPLAN.

1. **Goal.** Every qibla artefact is off `uat-2`: the screen, the hook, the drawn map, the store
   helpers, the Settings row, the icon, the What's New item, the whole tile pipeline, the location
   boundary, the committed fixtures, and the `expo-location` and `fflate` dependencies.

2. **Branch.** `git checkout -b chore/44-delete-the-qibla uat-2`

3. **Files.**

   **Deleted (use `git rm`, and `git rm -r` for the two directories):**

   ```
   components/qibla                                  (the whole directory, __tests__ included)
   components/sheets/screens/Qibla.tsx
   components/sheets/screens/__tests__/Qibla.test.tsx
   hooks/useQiblaMap.ts
   hooks/__tests__/useQiblaMap.test.ts
   shared/qibla.ts
   shared/__tests__/qibla.test.ts
   shared/qiblaStreet.ts
   shared/__tests__/qiblaStreet.test.ts
   shared/qiblaSentence.ts
   shared/__tests__/qiblaSentence.test.ts
   shared/tileGeometry.ts
   shared/__tests__/tileGeometry.test.ts
   shared/vectorTile.ts
   shared/__tests__/vectorTile.test.ts
   shared/tileCache.ts
   shared/__tests__/tileCache.test.ts
   shared/pmtiles.ts
   shared/__tests__/pmtiles.test.ts
   shared/__tests__/pmtilesLive.test.ts
   shared/__tests__/realTile.test.ts
   shared/__tests__/fixtures                         (the whole directory: London.mvt.gz, Makkah.mvt.gz)
   device/qibla.ts
   device/__tests__/qibla.test.ts
   device/tiles.ts
   device/__tests__/tiles.test.ts
   shared/__mocks__/expo-location.ts
   assets/icons/svg/compass.svg
   ```

   **Edited:**

   ```
   stores/ui.ts
   components/sheets/index.ts
   components/sheets/screens/index.ts
   app/_layout.tsx
   components/sheets/screens/Settings.tsx                        (copied, see part 5)
   components/sheets/screens/__tests__/Settings.test.tsx         (copied, see part 5)
   shared/types.ts
   assets/icons/svg/index.ts
   shared/whatsNew.ts
   jest.config.js
   package.json
   yarn.lock                                                     (written by yarn, never by hand)
   app.json
   e2e/device-atlas-oneplus3t.md
   ```

   Nothing else may change, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** **This step writes no new test, and that is deliberate**: it deletes code and
   its tests together, so there is no new behaviour to prove. Step 2 writes the guard, and step 2's red
   check is the one that proves this session is worth anything.

   Record the totals BEFORE any change:

   ```bash
   npx jest --watchman=false 2>&1 | tail -6
   ```

   Expected before: `Test Suites: 192 passed, 192 total`, `Tests: 5011 passed, 5011 total`.

   **Existing tests that change, and why.** One file only:
   `components/sheets/screens/__tests__/Settings.test.tsx` loses six tests, because each drives a
   control this step removes. They are, verbatim:
   - `opens the qibla sheet when the permission is already granted`
   - `asks for the permission on the tap, then opens the sheet once it is granted`
   - `opens nothing when the permission is refused`
   - `offers the route to Settings when the refusal is permanent`
   - `does not offer Settings while asking again could still work`
   - `asks again on the next tap after a refusal`

   **Existing tests that MUST NOT change,** and every one must still pass: the other ten tests in that
   same file (the athan row, the What's New and Help buttons, the decorations season, the vector
   glyphs), every test in `__tests__/app/_layout.test.tsx`, `shared/__tests__/whatsNew.test.ts` (whose
   archive bounds and parked-widgets pin both still hold after the qibla item goes, measured), and
   `shared/__tests__/unusedExports.test.ts`, whose five allow-listed symbols are unchanged after the
   cut, measured.

5. **Change.**

   There is no contract to add: this step only removes. Two files are given to you finished, because
   each is a large edit to a file full of surviving code where a hand edit would risk a non-qibla test:

   | Copy this file | Over this path |
   | --- | --- |
   | `ai/plans/44-qibla-cleanup/files/Settings.tsx` | `components/sheets/screens/Settings.tsx` |
   | `ai/plans/44-qibla-cleanup/files/Settings.test.tsx` | `components/sheets/screens/__tests__/Settings.test.tsx` |

   Copy each with `cp`, and change nothing in either.

   Everything else is a removal, by anchor:

   **`stores/ui.ts`.** Delete the block in `scripts/anchors/1-ui-atom.txt` and the blank line after it.
   Delete the block in `scripts/anchors/1-ui-helpers.txt` and the blank line after it. Leave exactly one
   blank line where each block sat. `perfMark` stays imported and used, because `showSettingsSheet` and
   `showSheet` both call it.

   **`components/sheets/screens/index.ts`.** Delete the line in `scripts/anchors/1-screens-index.txt`.

   **`components/sheets/index.ts`.** Replace the line in `scripts/anchors/1-sheets-index.txt` with:

   ```typescript
   export { Alert, ColorPicker, Settings, Sound } from './screens';
   ```

   and delete the line `export { default as BottomSheetQibla } from './screens/Qibla';`.

   **`app/_layout.tsx`.** Replace the line in `scripts/anchors/1-layout-import.txt` with:

   ```typescript
   import { BottomSheetAlert, BottomSheetSettings, BottomSheetSound } from '@/components/sheets';
   ```

   and delete the line in `scripts/anchors/1-layout-render.txt`.

   **`shared/types.ts`.** Delete the line in `scripts/anchors/2-icon-enum.txt`.

   **`assets/icons/svg/index.ts`.** Delete the lines in `scripts/anchors/2-icon-import.txt` and
   `scripts/anchors/2-icon-map.txt`.

   **`shared/whatsNew.ts`.** Replace the block in `scripts/anchors/2-whatsnew-item.txt` with exactly:

   ```
     ],
   ```

   That anchor spans the parked qibla item and the array's closing bracket, so the replacement removes
   the item and keeps the bracket.

   **`jest.config.js`.** Delete the line in `scripts/anchors/3-jest-location.txt`.

   **`app.json`.** Delete the `NSLocationWhenInUseUsageDescription` entry in
   `scripts/anchors/3-appjson-permission.txt`, and the comma that ends the line before it, so
   `infoPlist` ends:

   ```json
         "infoPlist": {
           "CFBundleDisplayName": "Athan",
           "NSUserNotificationsUsageDescription": "Receive prayer time notifications"
         },
   ```

   **`e2e/device-atlas-oneplus3t.md`.** Delete this row, whose coordinate now addresses nothing:

   ```
   | Settings sheet: Qibla row | (540, 977) | second row of the Sound card (session 37) |
   ```

   **The two dependencies.** Run exactly this one command, which is the only install this plan
   authorises:

   ```bash
   yarn remove expo-location fflate
   ```

   Then, because `ai/AGENTS.md` records that ANY install can restore the nested `@expo/ui` copy under
   `expo-widgets`, run:

   ```bash
   npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit
   ```

   It must pass. If it fails, run
   `rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile`, then run it again.
   A second failure is a STOP (section 2.2, item 5).

   Confirm `yarn.lock` lost only those two packages and whatever was theirs alone:

   ```bash
   git diff --stat yarn.lock
   ```

   Comments explain why, never what. No comment is added by this step.

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

   Test Suites: 177 passed, 177 total
   Tests:       4786 passed, 4786 total
   ```

   Both `tsc` and Biome exit 0 with no diagnostic.

   **A note on those numbers, so a difference is judged correctly.** The scratch worktree reported
   `2 skipped, 4784 passed, 4786 total`, because `audioMatrix.test.ts` gates two assertions on the
   prebuilt `android/` and `ios/` folders, which no worktree has. The main checkout HAS both, so those
   two RUN and it reports `4786 passed, 4786 total` with no skips. Either shape is correct for where it
   ran; the total of 4786 is the same. A count differing in any other way is a STOP (section 2.2,
   item 4).

7. **Breaks.** Save to `$TMPDIR/breaks-44-1.sh` and run `bash $TMPDIR/breaks-44-1.sh` from
   `/Users/muji/repos/rn.athan.uk`.

   **Why these breaks have this shape.** A deletion adds no decision to mutate, so each break puts a
   deleted artefact BACK and expects a suite to reject it. Each substitution targets text this plan
   fixes, which is an anchor's content or a line this step writes verbatim.

   ```bash
   #!/bin/bash
   # Breaks for session 44, step 1. Run from the repository root.
   set -u
   CAUGHT=0
   TOTAL=0

   attempt() {
     local label="$1" file="$2" sub="$3" check="$4"
     TOTAL=$((TOTAL + 1))
     cp "$file" "$file.bak44"
     perl -0pi -e "$sub" "$file"
     if cmp -s "$file" "$file.bak44"; then
       echo "BREAK NOT APPLIED: $label"
       mv "$file.bak44" "$file"
       return
     fi
     if eval "$check" > "$TMPDIR/break-44-1.log" 2>&1; then
       echo "SURVIVED: $label"
     else
       echo "CAUGHT: $label"
       CAUGHT=$((CAUGHT + 1))
     fi
     mv "$file.bak44" "$file"
   }

   # 1. The barrel re-exports a screen that no longer exists.
   attempt "sheets barrel re-exports the deleted screen" \
     components/sheets/index.ts \
     "s|export \{ Alert, ColorPicker, Settings, Sound \} from './screens';|export { Alert, ColorPicker, Qibla, Settings, Sound } from './screens';|" \
     "npx tsc --noEmit"

   # 2. The layout imports a component nothing exports.
   attempt "the layout imports the deleted sheet" \
     app/_layout.tsx \
     "s|import \{ BottomSheetAlert, BottomSheetSettings, BottomSheetSound \} from '\@/components/sheets';|import { BottomSheetAlert, BottomSheetQibla, BottomSheetSettings, BottomSheetSound } from '\@/components/sheets';|" \
     "npx tsc --noEmit"

   # 3. An unreachable store helper comes back: the unused-exports tripwire must report it.
   attempt "the store keeps a helper nothing reaches" \
     stores/ui.ts \
     "s|/\*\* Sets the sound selection bottom sheet modal reference \*/|/** Presents the qibla bottom sheet */\nexport const showQiblaSheet = () => store.get(settingsSheetModalAtom)?.present();\n\n/** Sets the sound selection bottom sheet modal reference */|" \
     "npx jest shared/__tests__/unusedExports.test.ts --watchman=false --selectProjects=unit"

   # 4. The icon map keeps an entry whose enum member is gone.
   attempt "the icon map keeps the compass entry" \
     assets/icons/svg/index.ts \
     "s|  \[Icon.CHECK\]: CheckIcon,|  [Icon.COMPASS]: CompassIcon,\n  [Icon.CHECK]: CheckIcon,|" \
     "npx tsc --noEmit"

   echo "caught $CAUGHT of $TOTAL"
   [ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   Expected: four `CAUGHT` lines, `caught 4 of 4`, `ALL AS EXPECTED: 1`. All four were measured in the
   scratch worktree.

   **A fifth break was written, run, and MOVED to step 2, which is worth knowing because it says what
   this step can and cannot prove.** Putting the "Qibla compass" item back into `shared/whatsNew.ts`
   does NOT fail `shared/__tests__/whatsNew.test.ts`: that suite checks an item's length, uniqueness and
   version stamp, and an item stamped for a release that is not the installed one is a perfectly valid
   ARCHIVE entry, so it passes. Nothing in the tree rejects it until step 2's guard exists, which is
   where that break now lives. Do not add a break here that expects `whatsNew.test.ts` to catch it. Afterwards
   `git status --porcelain` lists only this step's files and the three plan files, and no `.bak44` file
   remains. A `SURVIVED` or `BREAK NOT APPLIED` line is a STOP (section 2.2, item 3).

8. **Version and commit.**

   ```bash
   node -p "const v=require('/Users/muji/repos/rn.athan.uk/package.json').version.split('.');v[2]=+v[2]+1;v.join('.')"
   ```

   Set that version in `app.json` (`expo.version`), `package.json` (`version`) and
   `android/app/build.gradle` (`versionName`). All three must match; the gradle file is gitignored and
   is never added.

   Add by name: every deleted path, every edited path from part 3 including `yarn.lock`, plus
   `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`. Never `git add .`.

   Write to `$TMPDIR/msg-1.txt`, replacing `<VERSION>`:

   ```
   <VERSION> - chore(qibla): delete the whole feature, step 1 of session 44

   Four sessions built a qibla screen and a device proof rejected every one, so it is removed rather
   than fixed. Gone: components/qibla/, the Qibla sheet and its Settings row, hooks/useQiblaMap.ts,
   shared/qibla.ts, shared/qiblaStreet.ts, shared/qiblaSentence.ts, the tile pipeline
   (pmtiles, vectorTile, tileCache, tileGeometry, device/tiles.ts), the 78 KB of committed tile
   fixtures, device/qibla.ts, the COMPASS icon and its SVG, the parked What's New item, the iOS
   location permission string, and the expo-location and fflate dependencies. adhan stays: it
   computes the prayer times.

   One commit rather than several, because it cannot be split: unusedExports.test.ts reports an
   export the moment its last caller goes, so every partial cut leaves uat-2 red. Measured both ways
   while planning.

   Six tests leave Settings.test.tsx with the row they drove. Its other ten still pass unchanged.
   ```

   Commit with `git commit -F $TMPDIR/msg-1.txt` in the background. In the log, the last `Tests:` line
   must end `passed, 4786 total`, and four `100%` coverage lines must be present.

9. **Review.** Read `git show <sha>` back cold, as a stranger who did not write it, and check:
   - every path in part 3 changed, and no other file did;
   - `components/qibla/` and `shared/__tests__/fixtures/` are gone entirely;
   - the two copied files are byte for byte the plan's (`git diff --no-index` against
     `ai/plans/44-qibla-cleanup/files/` prints nothing);
   - `stores/ui.ts` keeps `perfMark` and every non-qibla atom and helper;
   - `Settings.tsx` still has the Change athan row, the What's New button, the Help button, every
     display toggle and the colour picker, and no longer imports `Alert`;
   - the ten surviving tests in `Settings.test.tsx` are untouched, and exactly the six named in part 4
     are gone;
   - `package.json` lost `expo-location` and `fflate` and KEPT `adhan`;
   - `app.json` lost only the one `infoPlist` key, and `ios.entitlements` is untouched;
   - no comment was added, and no surviving comment explains what rather than why;
   - the only visual change is the Qibla row leaving Settings, which is what the owner's cleanup
     instruction authorises;
   - nothing beyond the step: no prayer time, no notification, no widget, no release file, no `uat`, no
     EAS.

   A clean read finds nothing to change. A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/44-delete-the-qibla -m "Merge chore/44-delete-the-qibla into uat-2: the whole qibla feature deleted, reviewed"
    ```

11. **Done when.**
    - `ls components/qibla shared/__tests__/fixtures` prints `No such file or directory` for both;
    - `grep -rniE 'qibla|kaaba|pmtiles|tilecache' app/ components/ device/ hooks/ shared/ stores/ widgets/ api/` prints nothing;
    - `grep -n 'expo-location\|fflate' package.json` prints nothing, and `grep -n 'adhan' package.json` prints one line;
    - `npx jest --watchman=false 2>&1 | tail -3` reports 177 suites and 4786 tests passing;
    - the step is ticked in `PLAN.md` section 6 as `- [x] Step 1: DONE in <sha>`.
