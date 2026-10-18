# Step 2: the 3T gallery fallback read, rehearsed on the AVD

Requirements: R2.1, R2.2, R1.3
Weight: 3

Anchor check: `scripts/anchors/a8-atlas-picker.md` counts 1 in
`e2e/device-atlas-oneplus3t.md`; `scripts/anchors/a7-appjson-locale.md` counts 1 in
`app.json`.

Goal: read what the widget picker's Athan entries show when the device locale is outside
the six supported languages, and leave the 3T exactly as found.

Branch: none (no repository commit; the transcription lands in `LOG.md` and under
`$HOME/athan-gitree/sessions/117/`).

Lane-run: this step is run by the lane itself (D117.8), recorded in `LOG.md`.

Files: none changed. Read: the 3T's language settings and widget picker; the AVD
`athan-smoke-28` for the rehearsal.

Red tests: None (a read-only device step with a restore; failure modes are STOPs).

Change contract: the rehearsal first, the witness second.

Rehearsal (AVD, disposable, never a witness - `e2e/README.md` names language-switch
exercises as its ground):

1. Boot `athan-smoke-28` headless exactly as `e2e/README.md` prints it. Wait for
   `getprop sys.boot_completed` to print `1`, polling in `sleep 15` cycles, giving up
   after 8 cycles (2 minutes) with a STOP.
2. Install a current fleettest APK onto the AVD only if one already exists under
   `$HOME/athan-gitree/builds/` (check with `ls`; if none exists, skip the install - the
   rehearsal is about the language mechanics, not the app). Never build for this.
3. `adb -s emulator-5554 shell am start -a android.settings.LOCALE_SETTINGS`, add
   `Français (France)`, drag it to the top of the list, and record: the exact tap points
   used, whether the locale applies without reboot (`getprop persist.sys.locale` prints a
   value beginning `fr` on this API class; record the exact string), and the removal path
   that restores the previous top language.
4. Write the verified coordinates and the restore sequence into the AVD notes under
   `sessions/117/step2-avd-rehearsal.md`, then shut the AVD down (`adb -s emulator-5554 emu kill`).

Witness (the 3T):

1. Take `$HOME/athan-gitree/device-3T_SERIAL.lock` (mkdir pattern, `sleep 15` retries).
2. Run the bracket (PLAN section 7) into `sessions/117/step2-bracket-before.txt`. Expected
   as in step 1.
3. `am start -a android.settings.LOCALE_SETTINGS`, then replay the rehearsed sequence:
   add `Français (France)`, drag to top. Verify `getprop persist.sys.locale` prints `fr`
   and record both locale readings.
4. `input keyevent KEYCODE_HOME`, open the long-press sheet per the atlas, tap WIDGETS
   (atlas coordinates), scroll the app list to the Athan section with SHORT in-list
   swipes per the atlas warning, screenshot the section (`sessions/117/step2-gallery-fr.png`,
   never committed) and read the live tree for the labels.
5. Transcribe into `LOG.md`: every Athan entry's label language (English base names such
   as "Next Prayer (Dark)", Arabic names, or French). The expected reading per the
   committed config: the English base displayNames, because `fr` has no
   `values-fr` entry and the locale map carries only the six languages. Record whatever
   actually renders.
6. Restore: reopen the language list, replay the rehearsed restore (drag the recorded
   original language back to the top, or remove `Français (France)`), verify
   `getprop persist.sys.locale` equals the bracket-before reading and
   `settings get system system_locales` equals its bracket-before reading.
7. Rerun the bracket into `sessions/117/step2-bracket-after.txt`: versionName, both locale
   readings and the placed-widget render must match bracket-before. Release the device
   lock.

Green run: `LOG.md` carries the gallery transcription, both bracket files, and the
restore verification lines.

Break script: None (the bracket and the restore verification are the break checks).

Version and commit: none.

Review: the lane rereads the transcription against `app.json`'s displayName fields and
locale map and records the verdict: English fallback held, or the mismatch as a finding
for the row.

Merge: nothing to merge.

Done when: the checklist box 2 is ticked, the `LOG.md` entry under
`### Step 2 — gallery read (Android)` ends with a `session:` line, the AVD is shut down,
and the device lock is released.
