# Step 3: the guidance wired into `AGENTS.md` and `ai/AGENTS.md`

Part of `ai/plans/13-agent-tooling/PLAN.md`. Kind: **specified**.

0. **Anchor check:** the pre-flight counts for anchors `scripts/anchors/3-1.txt` (against
   `AGENTS.md`) and `scripts/anchors/3-2.txt` (against `ai/AGENTS.md`) are both exactly 1. Run
   both Python counts again now. Any other count means NEEDS REPLAN.
1. **Goal:** every future session discovers `@expo/agent-cli`, the dev-launcher launch URL and
   Device Hub from the two instruction files.
2. **Branch:** `git checkout -b docs/agent-tooling-routing uat-2`.
3. **Files:** `AGENTS.md`, `ai/AGENTS.md`, plus `app.json`, `package.json` and
   `ai/plans/README.md` and this plan folder's `PLAN.md` and `LOG.md` when changed. Nothing else.
4. **Tests first (red).** None: documentation only; part 6 carries the assertions.
5. **Change.**
   1. In `AGENTS.md` (repo root), between the rows `| iOS build / simulator | `xcodebuildmcp` |`
      and `| Expo/EAS API question | the matching `expo-*` / `eas-*` skill |` of the Tool Routing
      table (the two rows anchor `3-1.txt` pins), insert exactly this row:

      ```
      | Expo project brief, dev-server smoke loop | `npx @expo/agent-cli status` / `smoke --ios` (rules in ai/AGENTS.md §6) |
      ```

   2. In `ai/AGENTS.md`, at the end of the "AI Tooling (project-scoped)" bullet list (after the
      "Physical iPhone XS (project-only)" bullet, where anchor `3-2.txt` ends: after the words
      `this repo is their only consumer.` and before the blank line and the
      `## 7. Boundaries & Permissions (Three-Tier)` heading), add a blank line and exactly these
      three bullets:

      ```
      - **`@expo/agent-cli`** (experimental, SDK 58 era; `ai/features/agent-tooling/FINDINGS.md` holds the measured results and the rulings): agent-native wrapper over the Expo CLI family, always via `npx @expo/agent-cli@latest <command>`, deliberately NOT a devDependency (planner ruling, revisit at the SDK 58 stable re-pin). Use `status` for a one-screen project brief (SDK, CNG/dev-client, Expo Go compatibility, connected devices, local build ability; starts nothing) and `smoke --ios` for the dev-loop gate: it starts its own dev server, builds the iOS dev client when no build is recorded for the fingerprint (pod install plus xcodebuild Debug; minutes on a clean machine, incremental after), boots a simulator, opens the app through the `athan://` deep link, reads runtime errors and answers with one exit code. NEVER pass `--eas` (bills EAS credits until stopped; EAS is read-only here), NEVER run `deploy`, `agents:setup` or `skills:sync` (they write harness/user-home config and managed AGENTS.md blocks), and NEVER `smoke --android` while the 3T is connected: it targets the connected Android device, which holds the owner's app. Local Android debug builds from the main checkout are currently blocked by a Gradle/AGP mismatch (see the FINDINGS machine notes).
      - **Dev-launcher launch URL (dev builds)**: open a dev build onto Metro with `athan://expo-development-client/?url=<URL-encoded Metro URL>`; the `exp+athan` scheme works too (both registered in the generated manifest). Flags go on the OUTER link: a flag inside the encoded `url` value is ignored, and each value must be exactly `1`. The flags: `disableFab=1` (hides the dev-menu floating button; persists), `disableAutoLaunch=1` (no dev menu or onboarding at launch; persists), `disableOnboarding=1` (skips the launcher onboarding only). Verified on the iOS simulator dev build (session 13): the link loads the app from Metro and the flags write the dev menu's persisted preferences exactly; on iOS 26.5 scene-life-cycle builds the dev-menu FAB (an opaque blue circle with a white gear, NOT the app's own translucent hex-nut settings button at bottom-centre) never renders at all, so `disableFab`'s visible effect there is nothing to hide. The Android parse is source-verified (`DevLauncherController.kt`), not device-verified. iOS simulator: `xcrun simctl openurl <udid> 'athan://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081&disableFab=1&disableAutoLaunch=1'`. Android emulator: `adb shell "am start -a android.intent.action.VIEW -d 'athan://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081&disableFab=1&disableAutoLaunch=1'"` (the Metro host is `10.0.2.2:8081` on an emulator, and the inner quotes protect the `&`).
      - **Device Hub (Xcode 27)**: Simulator.app is gone; the devices window lives at `/Applications/Xcode.app/Contents/Applications/DeviceHub.app`. The screen-share spinner is a known Xcode 27 beta rough edge. `simctl`, mobile-mcp, Maestro and xcodebuildmcp are unaffected; SDK 57-era CLIs that look for Simulator.app may not know it.
      ```

   3. Nothing else in either file changes: no reflow of neighbouring lines, no reordering, no
      rewording of existing rows or bullets.
6. **Green.**

   ```bash
   grep -F '| Expo project brief, dev-server smoke loop |' AGENTS.md
   python3 -c 'import sys;print(open("AGENTS.md").read().count("| Expo project brief, dev-server smoke loop |"))'
   grep -F '- **`@expo/agent-cli`** (experimental, SDK 58 era' ai/AGENTS.md
   grep -F '- **Dev-launcher launch URL (dev builds)**' ai/AGENTS.md
   grep -F '- **Device Hub (Xcode 27)**' ai/AGENTS.md
   python3 -c 'import sys;print(open("ai/AGENTS.md").read().count("- **Device Hub (Xcode 27)**"))'
   ```

   Each prints its line; the two Python counts print `1`. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, exit 0 (Biome does not check markdown; if it flags
   anything, the insert touched a measured file: STOP).
7. **Breaks.** Save as `$TMPDIR/breaks-13-3.sh`, run from the repository root:

   ```bash
   #!/bin/bash
   # Session 13 step 3 breaks: each flips a piece of the fixed guidance text;
   # the assertion that finds the correct text must fail.
   set -u
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
   A=AGENTS.md; I=ai/AGENTS.md
   # 1. The routing row's pointer to the rules.
   brk "routing-row" "$A" 'rules in ai/AGENTS.md §6' 'rules nowhere' "grep -F 'rules in ai/AGENTS.md §6' $A"
   # 2. The no-devDep ruling is carried in the guidance.
   brk "no-devdep" "$I" 'deliberately NOT a devDependency' 'a devDependency since today' "grep -F 'deliberately NOT a devDependency' $I"
   # 3. The EAS prohibition.
   brk "eas-ban" "$I" 'NEVER pass `--eas`' 'SOMETIMES pass `--eas`' "grep -F 'NEVER pass \`--eas\`' $I"
   # 4. The outer-link rule.
   brk "outer-link" "$I" 'Flags go on the OUTER link' 'Flags go anywhere' "grep -F 'Flags go on the OUTER link' $I"
   # 5. The flag value rule.
   brk "flag-value" "$I" 'each value must be exactly `1`' 'values are flexible' "grep -F 'each value must be exactly \`1\`' $I"
   # 6. The Device Hub bullet itself (its opening fact; the path also appears in an older
   # memory entry, so the bullet's lead is the unique target).
   brk "devicehub-entry" "$I" '- **Device Hub (Xcode 27)**: Simulator.app is gone' '- **Device Hub (Xcode 27)**: Simulator.app is back' "grep -F 'Simulator.app is gone' $I"
   # 7. The 3T guard on smoke --android.
   brk "smoke-android" "$I" 'NEVER `smoke --android` while the 3T is connected' 'FEEL FREE to `smoke --android`' "grep -F 'NEVER \`smoke --android\` while the 3T is connected' $I"
   echo "caught=$caught missed=$missed"
   [ "$missed" -eq 0 ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   Expected: `caught=7 missed=0`, `ALL AS EXPECTED: 1`.
8. **Version and commit.** Same version command. Add by name: `AGENTS.md`, `ai/AGENTS.md`,
   `app.json`, `package.json`, plus the plan files when changed. Commit message:

   ```
   <VERSION> - docs(agent-tooling): agent-cli, dev-launcher URL and Device Hub wired into the tool routing

   One row in the root AGENTS.md routing table; three bullets in ai/AGENTS.md §6 AI
   Tooling: the npx-based agent-cli usage with its forbidden commands, the verified
   dev-launcher launch URL with its flags, what is and is not verified about them, and the
   Android adb form; and the Device Hub location with its caveat. Zero app-code changes.
   ```

   The hook runs the full suite; the log's last `Tests:` line ends `passed, <n> total` and the
   four `100%` coverage lines are present. Then, before the merge, run `git show --stat HEAD`:
   it lists exactly `AGENTS.md`, `ai/AGENTS.md`, `app.json`, `package.json` and the plan files
   this session changed, and nothing else. Anything else in the listing: STOP.

9. **Review.** `Code Reviewer` (GLM 5.3), isolation `worktree`, prompt:

   ```
   Run git checkout --detach <sha>. Review this docs commit against
   ai/plans/13-agent-tooling/steps/3-tool-routing-docs.md. Check: the root AGENTS.md gained
   exactly one table row with the exact text the plan gives, inserted between the xcodebuildmcp
   row and the Expo/EAS skill row; ai/AGENTS.md §6 "AI Tooling (project-scoped)" gained exactly
   the three bullets the plan gives, after the physical-iPhone-XS bullet and before section 7,
   and nothing else in either file moved or was reworded; the facts match
   ai/features/agent-tooling/FINDINGS.md. Reply merge or fix first.
   ```

   Verdicts as step 1; PLAN section 10's anticipated fix 3 covers the finding this step can
   meet.
10. **Merge.** `git checkout uat-2 && git merge --no-ff docs/agent-tooling-routing -m "Merge docs/agent-tooling-routing into uat-2: session 13 step 3, reviewed"`.
11. **Done when:** part 6's greps and both counts pass, `tsc` and Biome exit 0, the break script
    ended `ALL AS EXPECTED: 1`, the hook printed its lines, `git show --stat HEAD` (run in part 8,
    before the merge) listed exactly `AGENTS.md`, `ai/AGENTS.md`, `app.json`, `package.json` and
    the plan files this session changed, and the reviewer said merge.
