# Step 2: dev-launcher launch URL verified on the iOS simulator dev build, recorded

Part of `ai/plans/13-agent-tooling/PLAN.md`. Kind: **specified**.

0. **Anchor check:** `grep -cF '<written by step 2>' ai/features/agent-tooling/FINDINGS.md`
   prints `1`. Not 1: NEEDS REPLAN if it is gone, STOP if there is more than one.
1. **Goal:** prove on the dev build, with screenshots read by `vision` (GLM 5.3 Flash) and with
   the dev menu's persisted preferences read from the app's plist, that the dev-launcher deep
   link loads the app from Metro and that the flags write the preferences exactly; and record it
   in the FINDINGS, replacing `<written by step 2>`.
2. **Branch:** `git checkout -b docs/devlauncher-url-proof uat-2`.
3. **Files:** `ai/features/agent-tooling/FINDINGS.md` only, plus `ai/plans/README.md` and this
   plan folder's `PLAN.md` and `LOG.md` when changed. Screenshots and logs go to
   `~/athan-device-sweep/session13/` and are never committed. The planning session's own baseline
   captures live there under `planner-` prefixes; the executor's un-prefixed files are the
   canonical evidence, and overwriting or ignoring the planner's is expected.
4. **Tests first (red).** None: documentation only; part 6 carries the assertions.
5. **Change.** The simulator is `AB4F4466-05CC-4C7F-A451-187E1DC6C6A0` (iPhone 17 Pro Max);
   `$SIM` below means that UDID.
   1. Confirm the dev client is installed (step 1's smoke leaves it installed):
      `xcrun simctl get_app_container AB4F4466-05CC-4C7F-A451-187E1DC6C6A0 com.mugtaba.athan`
      prints a path. If it errors, build it with the exact fallback, in the background:
      `npx expo run:ios --configuration Debug -d AB4F4466-05CC-4C7F-A451-187E1DC6C6A0 --no-bundler`
      (`--no-bundler` keeps it from starting a dev server, so part 5 item 4's Metro owns port
      8081; it runs `pod install` and `xcodebuild`, and success ends with the app installed and
      launched), then wait for the background command to finish and
      `xcrun simctl terminate AB4F4466-05CC-4C7F-A451-187E1DC6C6A0 com.mugtaba.athan || true`.
      If the fallback build fails: STOP with the failing lines.
   2. Boot and wait: `xcrun simctl boot $SIM || true` then
      `xcrun simctl bootstatus $SIM` (prints until booted).
   3. Reset the dev menu's preferences to the fresh-install state (idempotent; they are usually
      absent after a fresh smoke install):

      ```bash
      xcrun simctl terminate $SIM com.mugtaba.athan || true
      xcrun simctl spawn $SIM defaults delete com.mugtaba.athan EXDevMenuShowFloatingActionButton || true
      xcrun simctl spawn $SIM defaults delete com.mugtaba.athan EXDevMenuShowsAtLaunch || true
      xcrun simctl spawn $SIM defaults delete com.mugtaba.athan EXDevMenuIsOnboardingFinished || true
      APPC=$(xcrun simctl get_app_container $SIM com.mugtaba.athan data)
      plutil -p "$APPC/Library/Preferences/com.mugtaba.athan.plist" 2>/dev/null | grep -E 'EXDevMenuShowFloatingActionButton|EXDevMenuShowsAtLaunch|EXDevMenuIsOnboardingFinished' && echo "PREFS PRESENT" || echo "PREFS ABSENT"
      ```

      Expected last line: `PREFS ABSENT` (a line naming one of the three reset keys prints only
      when the reset failed: STOP). Other `EXDevMenu*` keys (motion and touch gestures) may
      legitimately remain; they are not the three this step reads.
   4. Start Metro in the background with this script (`$TMPDIR/step2-metro.sh`):

      ```bash
      #!/bin/bash
      # Session 13 step 2: serve the dev bundle; stopped at the end of the step.
      npx expo start --port 8081 > ~/athan-device-sweep/session13/metro.log 2>&1
      ```

      Wait for readiness with a loop in the background that checks every 10 seconds, up to 3
      minutes, for `grep -F 'Waiting on http://localhost:8081' ~/athan-device-sweep/session13/metro.log`
      printing a line. It never does: read `metro.log` and STOP (PLAN section 2.2).
   5. **Proof A, the plain link.** Terminate any running app
      (`xcrun simctl terminate $SIM com.mugtaba.athan || true`), then:

      ```bash
      xcrun simctl openurl $SIM 'athan://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081'
      sleep 10; sleep 10
      xcrun simctl io $SIM screenshot ~/athan-device-sweep/session13/devlauncher-A-default.png
      ```

   6. **Proof B, both flags.** Terminate the app, then:

      ```bash
      xcrun simctl openurl $SIM 'athan://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081&disableFab=1&disableAutoLaunch=1'
      sleep 10; sleep 10
      xcrun simctl io $SIM screenshot ~/athan-device-sweep/session13/devlauncher-B-flags.png
      APPC=$(xcrun simctl get_app_container $SIM com.mugtaba.athan data)
      plutil -p "$APPC/Library/Preferences/com.mugtaba.athan.plist" | grep -E 'EXDevMenuShowFloatingActionButton|EXDevMenuShowsAtLaunch|EXDevMenuIsOnboardingFinished' > ~/athan-device-sweep/session13/devlauncher-B-prefs.txt
      ```

      Expected `devlauncher-B-prefs.txt`, exactly these three lines and values (other EXDevMenu
      keys, such as the gesture ones, are outside this grep and their presence or absence is not
      a finding):

      ```
      "EXDevMenuIsOnboardingFinished" => true
      "EXDevMenuShowFloatingActionButton" => false
      "EXDevMenuShowsAtLaunch" => false
      ```

      Any other value, or a missing key: STOP (the flags did not reach the preferences).
   7. **Proof C, persistence.** Terminate the app, plain-launch it
      (`xcrun simctl launch $SIM com.mugtaba.athan`), `sleep 10; sleep 10`, screenshot
      `devlauncher-C-persist.png`.
   8. **Proof D, the FAB control.** Terminate the app, force the FAB preference on, load the app
      again through the plain link, and read the screen:

      ```bash
      xcrun simctl terminate $SIM com.mugtaba.athan || true
      xcrun simctl spawn $SIM defaults write com.mugtaba.athan EXDevMenuShowFloatingActionButton -bool true
      xcrun simctl openurl $SIM 'athan://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081'
      sleep 10; sleep 10
      xcrun simctl io $SIM screenshot ~/athan-device-sweep/session13/devlauncher-D-fabcontrol.png
      ```

   9. **Ask `vision` (GLM 5.3 Flash), one call per image, with exactly this question** (the
      screenshot's path goes in the first line):

      ```
      Look at this iOS app screenshot: <path>
      The app is a dark-purple prayer-times app. It has its OWN settings button: a translucent
      dark-purple circle with a hexagon-nut glyph at bottom-centre above two small pager dots;
      that button is always there and is NOT what this question asks about. This question asks
      about the DEVELOPER floating button: an OPAQUE system-blue circle about 42pt wide
      containing a WHITE gear (cog) glyph, usually near a screen corner or edge, and about any
      developer menu overlay (a sheet with buttons such as Reload, Home, Debug, or a welcome or
      onboarding screen). Answer:
      (1) Is the opaque blue circle with the white gear visible anywhere? YES or NO, and where.
      (2) Is the prayer-times app itself visible (a countdown and a list of prayer rows)? YES or
      NO, and read out the countdown time it shows.
      (3) Is any developer menu, onboarding or welcome screen covering the app? Name it or say
      none.
      (4) Is an iOS system notification-permission alert ("Athan" Would Like to Send You
      Notifications) visible? YES or NO.
      Report exactly what the pixels show; do not guess.
      ```

      Expected answers, each proof:

      | Proof | (1) blue gear FAB | (2) app visible | (3) dev menu/onboarding | (4) permission alert |
      | --- | --- | --- | --- | --- |
      | A `devlauncher-A-default.png` | NO | YES, with a countdown time read out | none | YES or NO (both accepted) |
      | B `devlauncher-B-flags.png` | NO | YES, with a countdown time read out, a DIFFERENT time from A's | none | YES or NO (both accepted) |
      | C `devlauncher-C-persist.png` | NO | YES, with a countdown time read out | none | YES or NO (both accepted) |
      | D `devlauncher-D-fabcontrol.png` | NO | YES, with a countdown time read out | none | YES or NO (both accepted) |

      Why these are the expectations: A and B reading different countdown times proves each link
      re-loaded the app from Metro (the dev mock re-seeds on every load). B's plist (part 6)
      proves the flags wrote the preferences. D is the control for the FAB: with the preference
      forced on, the blue FAB STILL does not render on this iOS 26.5 scene-life-cycle build,
      which is the planner's measured finding (2026-09-18): the dev-menu FAB never shows here at
      all, so `disableFab`'s visible effect on this configuration is nothing to hide; its effect
      is the persisted preference, which the plist proves. Any other answer to any part: re-ask
      once with the same question; still other: STOP with vision's exact words.
   10. Clean up: stop Metro (kill the background command), then `rm -f expo-env.d.ts` (starting
       Metro regenerates this gitignored file, and `tsc` then fails with `position: "fixed"`
       errors in five component files; the owner ruled in session 12 that the file stays deleted
       whenever an Expo command recreates it), then
       `xcrun simctl uninstall $SIM com.mugtaba.athan` and
       `xcrun simctl shutdown $SIM || true`.
   11. In `ai/features/agent-tooling/FINDINGS.md`, replace the line `<written by step 2>` with
       exactly this text, with `<DATE>` today's date in `YYYY-MM-DD` form and `<A_TIME>`,
       `<B_TIME>`, `<C_TIME>`, `<D_TIME>` the countdown times vision read out for each proof,
       copied verbatim from vision's answer (for example `1m 12s`):

       ````markdown
       ### Measured on the iPhone 17 Pro Max simulator (AB4F4466-05CC-4C7F-A451-187E1DC6C6A0), <DATE>

       | Proof | What was opened | Screenshot | vision's answer (GLM 5.3 Flash) |
       | --- | --- | --- | --- |
       | A: plain link | `athan://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081` | `devlauncher-A-default.png` | no dev FAB, no dev menu, app up, countdown <A_TIME> |
       | B: both flags | `…&disableFab=1&disableAutoLaunch=1` (same link, flags appended) | `devlauncher-B-flags.png` | no dev FAB, no dev menu, app up, countdown <B_TIME> |
       | C: plain relaunch | `simctl launch com.mugtaba.athan` | `devlauncher-C-persist.png` | no dev FAB, no dev menu at launch, app up, countdown <C_TIME> |
       | D: FAB control | preference forced on (`defaults write … EXDevMenuShowFloatingActionButton -bool true`), then the plain link | `devlauncher-D-fabcontrol.png` | still no dev FAB, app up, countdown <D_TIME> |

       The exact launch URL shape, verified: the flags belong on the OUTER link (a flag inside
       the encoded `url` value is ignored; expo-dev-launcher's own tests pin that), and the
       value must be exactly `1`. Proof B's plist read-back
       (`~/athan-device-sweep/session13/devlauncher-B-prefs.txt`): after the flagged link,
       `EXDevMenuShowFloatingActionButton => false`, `EXDevMenuShowsAtLaunch => false`,
       `EXDevMenuIsOnboardingFinished => true`, all three persisted through proof C's plain
       relaunch. The different countdown times between A and B prove each link re-loaded the app
       from Metro (the dev mock re-seeds at every load). The iOS 26.5 finding: the dev-menu FAB
       (an opaque blue circle with a white gear, a different thing from the app's own
       translucent hex-nut settings button at bottom-centre) never renders on this
       scene-life-cycle dev build, with the preference forced on (proof D), so `disableFab`'s
       visible effect here is nothing to hide; its effect is the persisted preference. Android
       parses the same flags (`DevLauncherController.kt:144-151`, value exactly `1`) and the
       generated manifest registers `athan` and `exp+athan`; on an Android emulator the Metro
       host is `10.0.2.2:8081`. Source-verified only, not device-verified, because the local
       Android debug-build path is blocked (machine notes above).
       ````

6. **Green.**

   ```bash
   grep -F '### Measured on the iPhone 17 Pro Max simulator' ai/features/agent-tooling/FINDINGS.md
   grep -F 'devlauncher-D-fabcontrol.png' ai/features/agent-tooling/FINDINGS.md
   grep -F '"EXDevMenuShowFloatingActionButton" => false' ~/athan-device-sweep/session13/devlauncher-B-prefs.txt
   grep -cF '<written by step 2>' ai/features/agent-tooling/FINDINGS.md || echo "0 left"
   ls ~/athan-device-sweep/session13/devlauncher-A-default.png ~/athan-device-sweep/session13/devlauncher-B-flags.png ~/athan-device-sweep/session13/devlauncher-C-persist.png ~/athan-device-sweep/session13/devlauncher-D-fabcontrol.png
   ```

   The greps print their lines; the count is `0` and `0 left` prints; `ls` lists the four files.
   Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, exit 0.
7. **Breaks.** Save as `$TMPDIR/breaks-13-2.sh`, run from the repository root:

   ```bash
   #!/bin/bash
   # Session 13 step 2 breaks: flip recorded facts; the assertions must fail.
   set -u
   F=ai/features/agent-tooling/FINDINGS.md
   caught=0; missed=0
   brk() {
     label="$1"; file="$2"; from="$3"; to="$4"; check="$5"
     cp "$file" "$file.bak"
     BRK_FROM="$from" BRK_TO="$to" perl -pi -e 's{\Q$ENV{BRK_FROM}\E}{$ENV{BRK_TO}}' "$file"
     if cmp -s "$file" "$file.bak"; then echo "BREAK NOT APPLIED: $label"; missed=$((missed+1))
     elif bash -c "$check" >/dev/null 2>&1; then echo "NOT CAUGHT: $label"; missed=$((missed+1))
     else echo "caught: $label"; caught=$((caught+1)); fi
     mv "$file.bak" "$file"
   }
   # 1. The flags and their exact spelling are the fact.
   brk "disableFab-value" "$F" 'disableFab=1&disableAutoLaunch=1' 'disableFab=0&disableAutoLaunch=1' \
     "grep -F 'disableFab=1&disableAutoLaunch=1' $F"
   # 2. The Android emulator host.
   brk "android-host" "$F" '10.0.2.2:8081' '127.0.0.1:8081 on Android too' \
     "grep -cF '10.0.2.2:8081' $F | grep -qv ^0$"
   # 3. The persisted-preference proof.
   brk "persist-proof" "$F" 'all three persisted through proof C' 'all three reverted instantly' \
     "grep -F 'all three persisted through proof C' $F"
   # 4. The FAB control finding.
   brk "fab-control" "$F" 'never renders on this' 'always renders on this' \
     "grep -F 'never renders on this' $F"
   echo "caught=$caught missed=$missed"
   [ "$missed" -eq 0 ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   Expected: `caught=4 missed=0`, `ALL AS EXPECTED: 1`. (`brk "android-host"` substitutes into
   the one `10.0.2.2:8081` occurrence and its assertion then finds zero.)
8. **Version and commit.** Same version command as step 1 (next patch after `uat-2`). Add by
   name: `ai/features/agent-tooling/FINDINGS.md`, `app.json`, `package.json`, plus the plan files
   when changed. Commit message:

   ```
   <VERSION> - docs(agent-tooling): dev-launcher launch URL verified on the iOS simulator dev build

   The athan://expo-development-client link loads the app from Metro (a fresh mock seed per
   link, proven by the countdown moving); disableFab=1 and disableAutoLaunch=1 write the
   dev menu's persisted preferences exactly (plist read-back), and they survive a plain
   relaunch. The iOS 26.5 finding recorded with its control: the dev-menu FAB never
   renders on this scene-life-cycle build, preference forced on or not. Android form
   source-verified. Four screenshots read by vision (GLM 5.3 Flash).
   ```

9. **Review.** `Code Reviewer` (GLM 5.3), isolation `worktree`, prompt:

   ```
   Run git checkout --detach <sha>. Review this docs commit: the "Dev-launcher URL verification"
   section added to ai/features/agent-tooling/FINDINGS.md by
   ai/plans/13-agent-tooling/steps/2-devlauncher-url.md. Check: the table carries the four
   proofs with their exact URLs and screenshot names; the recorded vision answers match the
   plan's expected-answer table (no dev FAB anywhere, no dev menu, app visible with a countdown
   each time, A and B reading different times); the plist expectations and the outer-link,
   value-exactly-1, 10.0.2.2 and FAB-control facts are present worded as the plan gives them;
   and nothing else changed. Read ~/athan-device-sweep/session13/devlauncher-B-prefs.txt and
   confirm it holds the three expected lines. Reply merge or fix first.
   ```

   Verdicts as step 1.
10. **Merge.** `git checkout uat-2 && git merge --no-ff docs/devlauncher-url-proof -m "Merge docs/devlauncher-url-proof into uat-2: session 13 step 2, reviewed"`.
11. **Done when:** the four screenshots and `devlauncher-B-prefs.txt` exist under
    `~/athan-device-sweep/session13/`, the four vision answers matched the table, part 6's checks
    pass, the break script ended `ALL AS EXPECTED: 1`, the hook printed its `Tests:` and coverage
    lines, the reviewer said merge, and the simulator is shut down with the dev client
    uninstalled.
