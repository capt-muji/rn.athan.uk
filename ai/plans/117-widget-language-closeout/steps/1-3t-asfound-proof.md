# Step 1: the 3T as-found proof

Requirements: R1.1, R1.2, R1.3
Weight: 3

Anchor check: `scripts/anchors/a1-patch-cpp.md` counts 1 in `patches/expo-widgets+58.0.20.patch`;
`scripts/anchors/a7-appjson-locale.md` counts 1 in `app.json`.

Goal: prove row 135's delivered lettered alignment and mirroring on the exact state that
awaits her read, touching nothing.

Branch: none (no repository commit; the transcription lands in `LOG.md` and under
`$HOME/athan-gitree/sessions/117/`, both carried by the next records commit).

Lane-run: this step is run by the lane itself (D117.8), recorded in `LOG.md`.

Files: none changed. Read: the placed widget on the 3T home screen.

Red tests: None (a read-only device step; the failure modes are STOPs in the plan's
symptom table, not red tests).

Change contract: there is no code change. The procedural contract, in order:

1. Take `$HOME/athan-gitree/device-3T_SERIAL.lock` (mkdir pattern, retry in `sleep 15`
   cycles while it exists). Release it the moment the contact ends.
2. Run the bracket from PLAN section 7 and save each reading under
   `$HOME/athan-gitree/sessions/117/step1-bracket-before.txt`. Expected: model
   `ONEPLUS A3003`, fleettest `versionName=2.0.1067`. Anything else is the symptom
   table's first STOP.
3. `input keyevent KEYCODE_HOME`, then read the placed widget: one screenshot saved as
   `sessions/117/step1-widget.png` (never committed) and the live accessibility tree via
   the `agent-device` MCP snapshot.
4. Transcribe into `LOG.md`: every prayer row read (which side the time column sits on,
   the name's script), the countdown label (digit script, unit letters, their case and
   size class relative to the digits), the footer's language, the date line's language.
5. Rerun the bracket into `sessions/117/step1-bracket-after.txt`. All three readings must
   match the before file: same versionName, same locale readings, and the widget still
   renders (screenshot compared by eye).

Green run: `LOG.md` carries the full transcription with the bracket files' readings inline,
and the bracket-after file matches bracket-before on versionName and both locale lines.

Break script: None (no repo state to break; the bracket IS the break check for the phone).

Version and commit: none (no repository change; the records ride step 5's commit).

Review: the lane rereads the transcription against row 135's delivered face description
(the composition mirror: time left, names right, swapped alignments; the label: unpadded
Latin digits, lowercase Latin h m at the ruled sizing, zero-groups dropped, minutes clamped
at 1) and marks each element confirmed or a finding.

Merge: nothing to merge.

Done when: the checklist box 1 is ticked, `LOG.md` holds the entry under
`### Step 1 — as-found proof` ending with a `session:` line, and the bracket files exist
and match.
