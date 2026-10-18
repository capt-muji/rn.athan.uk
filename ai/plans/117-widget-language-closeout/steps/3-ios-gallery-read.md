# Step 3: the iOS simulator gallery fallback read

Requirements: R3.1
Weight: 3

Anchor check: `scripts/anchors/a7-appjson-locale.md` counts 1 in `app.json`.

Goal: read what the iOS widget gallery's Athan entries show when the system language is
outside the six supported languages, from a build of current `uat` content.

Branch: none (no repository commit).

Lane-run: this step is run by the lane itself (D117.8), recorded in `LOG.md`.

Files: none changed in the repo. Read: the simulator's widget gallery.

Red tests: None (a read-only step; failure modes are STOPs).

Change contract, in order:

1. Take `$HOME/athan-gitree/build.lock` (mkdir pattern, `sleep 15` retries). It guards
   the Xcode work and stays held through the build and install; release it when the build
   and install end, before the gallery reading (the reading is not toolchain work).
2. Verify the main tree `$HOME/repos/rn.athan.uk` is checked out on `uat`, clean, at a
   sha at or after this plan's "Planned at". The lane's commits are records only, so the
   tree's content is the content under proof.
3. Resolve the simulators: `xcrun simctl list devices | grep -E "Athan-7[67]"` gives
   `SIMULATOR_UDID` (the `Athan-77` device) and `SIMULATOR_UDID_FALLBACK` (`Athan-76`).
   Boot `SIMULATOR_UDID`; if it fails to boot, boot `SIMULATOR_UDID_FALLBACK` and record
   the substitution.
4. Record the simulator's current language settings:
   `xcrun simctl spawn <udid> defaults read .GlobalPreferences AppleLanguages`.
   Set the system language to French:
   `xcrun simctl spawn <udid> defaults write .GlobalPreferences AppleLanguages -array "fr-FR" "en"`
   then `xcrun simctl shutdown <udid>` and boot again.
5. Build and install the app for the booted simulator from the main tree with the
   `xcodebuildmcp` MCP (call `session_show_defaults` first per its card; if no defaults
   are set, discover the project and scheme, then build for the simulator). Then
   `xcrun simctl launch <udid> com.example.athan` once, so the widget kinds register, and
   press HOME. Release the build lock after the install.
6. Open the gallery: long-press the wallpaper, tap the `+` at the top-left, search
   `Athan`, and read the app's gallery card with the `agent-device` MCP (snapshot for the
   tree, screenshot for the pixels saved as `sessions/117/step3-gallery-fr.png`, never
   committed).
7. Transcribe into `LOG.md`: every widget entry's display name and description with its
   language. The expected reading per the committed config: the English base names from
   `app.json`'s widget displayNames, because the per-locale native strings exist only for
   the six languages and the bundle's development region is English. Record whatever
   actually renders.
8. Restore the simulator's recorded pre-step `AppleLanguages` value (or erase the
   simulator with `xcrun simctl erase <udid>` when the recorded value is unreadable), then
   shut it down (`xcrun simctl shutdown <udid>`).

Green run: `LOG.md` carries the gallery transcription with the build provenance (the `uat`
sha the main tree sat at) and the simulator's UDID and language settings.

Break script: None (no repo state to break).

Version and commit: none.

Review: the lane rereads the transcription against `app.json` and records the verdict:
English fallback held, or the mismatch as a finding for the row.

Merge: nothing to merge.

Done when: the checklist box 3 is ticked, the `LOG.md` entry under
`### Step 3 — gallery read (iOS)` ends with a `session:` line, the simulator is shut
down, and the build lock is released.
