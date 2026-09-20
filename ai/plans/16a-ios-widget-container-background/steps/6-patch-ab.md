# Step 6: Memoisation patch A/B measurement (device, throwaway builds)

0. **Anchor check:** anchor `6-1-postinstall.txt` counts 1 in `package.json`.
1. **Goal:** Measure the expo-widgets render-cache patch's real cost/benefit at the new entry count, with and without it, same burst, same sim. The owner's words: "see the difference in CPU before versus after... Just make sure it's keep a note of it."
2. **Branch:** none for the working tree (the flip happens in `node_modules`, gitignored). A note rides `LOG.md`.
3. **Files:** none in git. `node_modules/expo-widgets` is flipped between patched and pristine; `patches/expo-widgets+58.0.3.patch` and `package.json` NEVER change.
4. **Tests first (red):** None. This is a measurement.
5. **Change (the protocol).**

   **Preparation, once:**
   - Boot the sim `EB00ED20-949A-4834-99A9-668F971EB53C` with the four dark home widgets placed (LOG §28 state).
   - The burst script, saved to `$TMPDIR/16a-burst.sh`:
     ```bash
     #!/bin/bash
     # 10 forced extension restarts; each one re-renders every placed kind's
     # current entries. Prints cumulative CPU time of the extension process
     # before and after, and any new crash reports.
     set -u
     udid=EB00ED20-949A-4834-99A9-668F971EB53C
     cpu_of() { ps -axo time,command | grep '[E]xpoWidgetsTarget' | head -1 | awk '{print $1}'; }
     crashes() { ls -1 ~/Library/Logs/DiagnosticReports/ 2>/dev/null | grep -c 'ExpoWidgetsTarget' || true; }
     before_cpu=$(cpu_of); before_crash=$(crashes)
     echo "before cpu=$before_cpu crashes=$before_crash"
     for i in $(seq 1 10); do
       pkill -f ExpoWidgetsTarget || true
       sleep 12
     done
     after_cpu=$(cpu_of); after_crash=$(crashes)
     echo "after cpu=$after_cpu crashes=$after_crash"
     echo "RESULT $1 cpu:$before_cpu->$after_cpu crashes:$before_crash->$after_crash"
     ```
   - A fresh Release-style check is unnecessary; the Debug app on Metro is the iteration rig and its extension binary is what the burst exercises. Both sides of the A/B use the SAME app build; only the extension's Swift differs (the patch lives in the extension's linked sources).

   **Side 1, WITH the patch (the committed state):**
   1. `rm -rf ~/Library/Developer/Xcode/DerivedData/Athan-*` (a stale incremental build silently broke the app group once, LOG §17.2; both sides start from clean).
   2. Build and install the sim Debug app, one route only:
      ```
      cd /Users/muji/repos/rn.athan.uk && \
      export EXPO_PUBLIC_WIDGETS=1 EXPO_PUBLIC_ENV=local EXPO_PUBLIC_API_KEY=key && \
      xcodebuild -workspace ios/Athan.xcworkspace -scheme Athan -configuration Debug \
        -destination 'id=EB00ED20-949A-4834-99A9-668F971EB53C' \
        build > "$TMPDIR/16a-sim-build1.log" 2>&1
      xcrun simctl install EB00ED20-949A-4834-99A9-668F971EB53C \
        ~/Library/Developer/Xcode/DerivedData/Athan-*/Build/Products/Debug-iphonesimulator/Athan.app
      ```
      (the glob resolves to the one DerivedData dir just built). Success ends `** BUILD SUCCEEDED **`.
   3. Launch, wait for `WIDGET: Standard timeline pushed` in the Metro log, terminate the app.
   4. `bash $TMPDIR/16a-burst.sh with-patch` and record the RESULT line.

   **Side 2, WITHOUT the patch (pristine expo-widgets):**
   1. Flip the package pristine WITHOUT touching git or yarn.lock:
      ```
      cd /Users/muji/repos/rn.athan.uk
      mv patches/expo-widgets+58.0.3.patch "$TMPDIR/16a-patch-aside.patch"
      rm -rf node_modules/expo-widgets
      yarn install --force > "$TMPDIR/16a-yarn.log" 2>&1
      ```
      `yarn install --force` here is the exact command this plan permits: patch-package finds no patch file and the package reinstalls pristine from the lockfile. Verify: `grep -c "WidgetsRenderCache" node_modules/expo-widgets/ios/Widgets/EntryView.swift` prints `0`. If `git status --porcelain` lists `yarn.lock` after this: STOP (the lockfile must not move).
   2. Restart Metro so it cannot serve from the old cache: kill the running `yarn start` process, then `yarn start` again (it clears the cache by itself).
   3. Clean DerivedData again, rebuild, install, launch, wait for the push, terminate.
   4. `bash $TMPDIR/16a-burst.sh without-patch` and record the RESULT line.
   5. Restore the patch NO MATTER WHAT (the removal decision is the owner's, later):
      ```
      mv "$TMPDIR/16a-patch-aside.patch" patches/expo-widgets+58.0.3.patch
      rm -rf node_modules/expo-widgets
      yarn install --force > "$TMPDIR/16a-yarn2.log" 2>&1
      grep -c "WidgetsRenderCache" node_modules/expo-widgets/ios/Widgets/EntryView.swift   # prints a nonzero count
      ```
      Restart Metro once more the same way.
   6. `git status --porcelain` must list only the plan files; `patches/` clean.

   **Reading:** CPU time strings are `mm:ss.cc` (or `hh:mm:ss.cc`); the delta across the burst is the number that matters; the crash delta is the sharper signal (a `cpu_resource` report on the without-patch side at ~99 entries is the patch's whole case; zero difference at this entry count is the "not needed anymore" case the owner suspected). Record both RESULT lines verbatim in `LOG.md`, then present them to the owner and record their reading: keep for now, remove in a follow-up, or defer. The PR question stays closed either way (their 2026-09-20 ruling).

6. **Green:** both RESULT lines recorded; the patch restored and verified present; tree clean.
7. **Breaks:** None.
8. **Version and commit:** none (measurement only). The findings ride step 8's docs commit and the records text's `<PATCH_WITH>`/`<PATCH_WITHOUT>`/`<PATCH_CRASH_NOTE>` placeholders.
9. **Review:** the executor's own check, recorded: the patch file's sha matches before and after (`git diff --stat patches/` empty; `shasum patches/expo-widgets+58.0.3.patch` noted in `LOG.md`).
10. **Merge:** none.
11. **Done when:** `LOG.md` holds both RESULT lines, the owner's reading, and the patch-restore verification; the tree is clean.
