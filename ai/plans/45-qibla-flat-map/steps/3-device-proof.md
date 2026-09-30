# Step 3: Device proof on the iPhone XS

0. **Anchor check.** None: this step changes no source file. It builds what step 2 merged.

1. **Goal:** prove on the owner's own phone that the map draws, the arrow follows the phone, and the tap lands when
   he faces Makkah.

2. **Branch:** `git checkout -b proof/45-device uat-2`. The only committed change is the version bump and `LOG.md`.

3. **Files:** `app.json`, `package.json`, `ai/plans/README.md`, and this folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** None. This step measures a phone.

5. **Build and install.**

   `expo-location` returned to the native tree in step 2, so a JS reload cannot carry it: the native project must be
   regenerated. **The order matters and violating it once shipped code stamped with the wrong version**
   (`ai/AGENTS.md` section 6): bump the version first, then prebuild, then build.

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   # set that version in app.json, package.json and android/app/build.gradle
   npx expo prebuild -p ios --no-install
   grep -A1 CFBundleShortVersionString ios/Athan/Info.plist
   grep -A1 NSLocationWhenInUseUsageDescription ios/Athan/Info.plist
   ```

   The plist must show the version just set, and must carry the location string
   `Your location is used to work out which way Makkah is from where you are. It never leaves your phone.` If the
   string is absent, STOP: the prebuild did not pick up `app.json`, and the app will crash on the permission request
   rather than showing a prompt.

   Then build, in the background with its log (`EXECUTOR-BRIEF.md` section 3):

   ```bash
   npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E > $TMPDIR/build-45.log 2>&1
   ```

   A failure line in that log is a STOP. Quote it.

6. **Safety.** **No clock is changed and no alarm is touched**, so the `dumpsys alarm` reading that precedes a clock
   change does not apply here: it is an `adb` command and this device is an iPhone. Nothing in this session arms,
   cancels or reads a notification, so no armed alarm can fire. The 3T is not involved.

7. **The checks.** Save every artefact under `~/athan-device-sweep/session45/`.

   `agent-device` drives the physical XS directly, including `press`, `screenshot` and `orientation` (measured
   2026-09-30, `ai/AGENTS.md`). Use it for navigation; the owner's hands are needed only for check 4.

   | # | Check | How | Expected reading | Saved as |
   | --- | --- | --- | --- | --- |
   | 1 | The app launches with `expo-location` in the tree | Launch it and watch for a crash. `xcrun devicectl device info processes --device 00008020-0015585C22D2002E \| grep -i athan` | The process is listed and stays listed | `launch.txt` |
   | 2 | The Qibla row exists | Press the hex-nut, screenshot the Settings sheet | A `Qibla` row in the Other card, above What's new | `settings.png` |
   | 3 | The sheet draws | Press Qibla, allow location, screenshot | The whole world map, a mark on Saudi Arabia, a dot on the UK, a short arrow at the dot, a curved line from the dot to the mark | `sheet.png` |
   | 4 | **The tap lands, which is the owner's hands and the verdict that counts** | The owner turns slowly on the spot in a windowless room | One tap as the arrow reaches the line, nothing while held, nothing while away, one tap on returning | his words in `LOG.md` |
   | 5 | The arrow follows the phone | Screenshot at two orientations the owner reports | The arrow's direction differs between them | `arrow-a.png`, `arrow-b.png` |
   | 6 | No second permission prompt | Close the sheet and reopen it | No prompt on the second open | `reopen.png` |

   **The question to ask of `sheet.png`**, whether the executor reads it or `vision` does: **"On this phone
   screenshot of a dark world map, is a recognisable world map visible with identifiable continents; is there
   exactly one small mark on Saudi Arabia, one dot elsewhere, one short line from that dot, and one curved line
   joining the dot to the mark; and does the curved line stay on the map rather than streaking across it from edge
   to edge?"**

   **The owner receives no screenshots.** Describe what the image showed.

   **Ask the owner check 4 in exactly these words:**

   > The Qibla sheet is on your phone. Please turn slowly on the spot, right round.
   >
   > 1. Does it tap once when the arrow reaches the line?
   > 2. Does it stay quiet while you hold there?
   > 3. Does it stay quiet while you are turned away?
   > 4. Does it tap once more when you come back onto the line?
   > 5. Does it ever buzz repeatedly?
   >
   > And, separately: does the map look right to you? Anything you want changed, name it.

   **Write his answer into `LOG.md` verbatim, marked with `🐋  `.**

8. **Version and commit.** The version was set in part 5. Add `app.json`, `package.json`, `ai/plans/README.md`,
   `PLAN.md` and `LOG.md`. Commit message:

   ```
   <VERSION> - proof(qibla): the map, the arrow and the tap on the iPhone XS

   Built Release from uat-2 with expo-location back in the native tree, installed on the owner's own
   phone, and checked on hardware: <one line per check, with what was read>.

   The owner turned on the spot and reported: <his words>.
   ```

9. **Review.** Read `git show <sha>` back cold, against this checklist:

   - [ ] `LOG.md` records what each of the six checks actually READ, not what it was expected to read.
   - [ ] The owner's words are quoted verbatim, marked with `🐋  `, not paraphrased.
   - [ ] Every artefact the checks name exists under `~/athan-device-sweep/session45/`.
   - [ ] No screenshot was sent to the owner; each one is described in words instead.
   - [ ] Nothing but `app.json`, `package.json` and the records changed. No source file is in the diff.
   - [ ] Automatic time was never turned off, and no alarm was touched.

   A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff proof/45-device \
      -m "Merge proof/45-device into uat-2: the qibla proven on the iPhone XS, reviewed"
    ```

11. **Done when:** every check above has a reading saved under `~/athan-device-sweep/session45/`, and `LOG.md`
    carries the owner's own words on the tap.

    **If the owner rejects the look or the feel:** write it into `LOG.md`, set the row to NEEDS REPLAN, make a docs
    commit (`EXECUTOR-BRIEF.md` section 4b), and tell him a planning session will fold his changes in. **Never
    redraw it from your own judgement**: the visual is his, and four builds have been rejected on sight already.

12. **The phone is left** on this build, unlocked, with the app closed. No setting is changed.
