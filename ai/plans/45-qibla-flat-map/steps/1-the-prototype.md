# Step 1: A rough prototype the owner can hold, no tests, never committed

0. **Anchor check.** Run the section 3 counts for anchors `2-1`, `2-2`, `3-1`, `3-2`:

   ```bash
   C() { python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "ai/plans/45-qibla-flat-map/scripts/anchors/$1.txt" "$2"; }
   C 2-1 app/_layout.tsx; C 2-2 components/sheets/index.ts
   C 3-1 components/sheets/screens/Settings.tsx; C 3-2 components/sheets/screens/Settings.tsx
   ```

   Expected: `1` four times. Any other count means NEEDS REPLAN.

1. **Goal:** put the picture in the owner's hands before a single test is written, because four builds have been
   rejected on sight and three of them after a full test suite.

2. **Branch:** none, and **nothing is committed in this step.** Work in the working tree of `uat-2` itself.

   **A prototype cannot be committed to `uat-2` at all**, and this is measured rather than assumed: the pre-commit
   hook runs the full suite at 100% coverage plus `unusedExports.test.ts`, so untested code and unreachable exports
   both fail it, and `--no-verify` is forbidden. Session 43 met the same wall and its prototype branch died
   unmerged. So this step builds from the working tree, installs, gets the owner's verdict, and then **restores the
   tree completely**. What survives is the owner's ruling, written into `LOG.md`.

3. **Files.** Created in the working tree and **all deleted or restored at the end of this step**:

   | File | What |
   | --- | --- |
   | `shared/qiblaGeometry.ts`, `shared/qiblaAlignment.ts`, `shared/worldPath.ts` | New, exactly as step 2 specifies them |
   | `device/qibla.ts`, `hooks/useQibla.ts`, `components/sheets/screens/Qibla.tsx` | New, exactly as step 2 specifies them |
   | `shared/__tests__/qiblaRemoved.test.ts` | Deleted for the build, restored at the end |
   | `app/_layout.tsx`, `components/sheets/index.ts`, `components/sheets/screens/index.ts`, `components/sheets/screens/Settings.tsx`, `stores/ui.ts` | Edited as step 2 specifies |
   | `app.json` | `NSLocationWhenInUseUsageDescription` restored |

4. **Tests first (red).** None. This step writes no tests, by the owner's own structure: 🐋  "Step 3 is
   implementing a prototype, first a quick prototype. Then the next step is to build it properly, test it properly,
   have 100% coverage".

5. **Change.** Build exactly what step 2 specifies, in full. Read `steps/2-build-it-properly.md` completely first
   and build every contract in it. The prototype and the tested version are the SAME code: this step is about
   showing it, not about writing something throwaway.

   The one install command, run once:

   ```bash
   yarn add expo-location@58.0.9
   ```

   Then confirm nothing else moved, and that the widget runtime still loads (`ai/AGENTS.md`: any `yarn add` can
   reintroduce a nested `@expo/ui` copy):

   ```bash
   git diff package.json
   npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit
   ```

   `git diff package.json` must show one added line, `"expo-location": "58.0.9",`, and nothing else. If it shows
   anything else, or the suite fails, STOP and ask section 2.2's question 7.

6. **Green.** `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0. The full suite is NOT run
   and is expected to fail: this step has no tests and unreachable exports.

7. **Breaks.** None. There are no tests to break.

8. **Build and install on the iPhone XS.**

   `expo-location` is back in the native tree, so a JS reload cannot carry it: the native project must be
   regenerated. Follow `ai/AGENTS.md` section 6's ritual, in this order, because `expo run:ios` never re-syncs an
   existing native directory:

   ```bash
   npx expo prebuild -p ios --no-install
   grep -A1 CFBundleShortVersionString ios/Athan/Info.plist
   grep -A2 NSLocationWhenInUseUsageDescription ios/Athan/Info.plist
   ```

   The plist must show the `app.json` version, and must carry the location usage string. If the string is absent,
   STOP: the prebuild did not pick up `app.json`.

   Then build and install, in the background with a log (`EXECUTOR-BRIEF.md` section 3):

   ```bash
   npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E
   ```

9. **The owner's verdict, which is the whole point of this step.**

   Ask the owner to open Settings, press Qibla, allow location, and look. Then ask him exactly this, in one message:

   > The Qibla sheet is on your phone. Two questions.
   >
   > **1. The look.** Does the map, the arrow, the line, your dot and the Makkah mark fit the app? Anything you want
   > changed, name it: the colours, the sizes, the thickness of the line, the mark on Makkah, the whole layout.
   >
   > **2. The feel.** Turn slowly on the spot. Does it tap once when the arrow reaches the line, stay quiet while you
   > hold there, stay quiet while you are away, and tap once more when you come back? Does it ever buzz repeatedly?

   Take a screenshot for your own reading, and read it yourself if your model can see images:

   ```bash
   # agent-device, which drives the physical XS (measured 2026-09-30, ai/AGENTS.md)
   screenshot the device 00008020-0015585C22D2002E to ~/athan-device-sweep/session45/prototype.png
   ```

   The question to ask of that image, whether you read it or `vision` does: **"On this phone screenshot of a dark
   world map, is a recognisable world map visible with identifiable continents; is there exactly one small mark on
   Saudi Arabia, one dot elsewhere, one short line from that dot, and one curved line joining the dot to the mark;
   and does the curved line stay on the map rather than streaking across it edge to edge?"** The owner receives no
   screenshots.

   **Write the owner's answer into `LOG.md` verbatim, marked with `🐋  `.**

   - **If the owner accepts the look:** go to part 10, then step 2 builds exactly this, tested.
   - **If the owner wants anything changed:** that is a visual change, which is his alone. Write it into `LOG.md`,
     set the row to NEEDS REPLAN, make a docs commit as `EXECUTOR-BRIEF.md` section 4b says, and tell him a planning
     session will fold his changes into step 2. **Never redraw it from your own judgement.**

10. **Restore the tree completely.**

    ```bash
    git checkout -- app/_layout.tsx components/sheets/index.ts components/sheets/screens/index.ts \
      components/sheets/screens/Settings.tsx stores/ui.ts \
      app.json package.json yarn.lock shared/__tests__/qiblaRemoved.test.ts
    rm -f shared/qiblaGeometry.ts shared/qiblaAlignment.ts shared/worldPath.ts device/qibla.ts hooks/useQibla.ts \
      components/sheets/screens/Qibla.tsx
    git status --porcelain
    ```

    `git status --porcelain` must list nothing but `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

    **`node_modules` keeps `expo-location`**, because `git checkout -- package.json yarn.lock` does not uninstall it
    and step 2 adds it back by the same command. Nothing else in the tree references it, so the suite is unaffected.

11. **Review.** None: nothing is committed.

12. **Merge.** None.

13. **Done when:**

    ```bash
    git status --porcelain
    # only ai/plans/README.md and this folder's PLAN.md and LOG.md
    grep -c '🐋' ai/plans/45-qibla-flat-map/LOG.md
    # at least 1: the owner's verdict is recorded
    ```

    And `LOG.md` records: the build succeeded, the owner held the phone, and his answer to both questions in his own
    words.
