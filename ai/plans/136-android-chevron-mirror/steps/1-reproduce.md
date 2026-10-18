### Step 1 - reproduce on the 3T, before-evidence both directions

Requirements: R3.1
Weight: 3 (device; dispatches alone)

Anchor check: the eleven repo anchors count 1 (pre-flight covers this).

Goal: the owner's read reproduced on the 3T with the 2.0.996 FleetTest build,
both directions, transcribed before any code lands.

Branch: `docs/136-step1-repro` off `uat` in the lane worktree. No app code
changes; the commit carries `LOG.md` and the queue row only.

Procedure:

1. Read `e2e/device-atlas-oneplus3t.md` and `e2e/README.md` in full. Hold
   `$HOME/athan-gitree/device-3T_SERIAL.lock` (mkdir lock, retried in
   `sleep 15` cycles) for every phone contact in this step; remove it the
   moment the last read lands.
2. Verify the artefact before any install (`aapt2`, never `aapt`; check the
   tool exists first):

   ```bash
   BT=$HOME/Library/Android/sdk/build-tools/37.0.0
   [ -x $BT/aapt2 ] || { echo "aapt2 missing"; exit 1; }
   $BT/aapt2 dump badging \
     $HOME/athan-gitree/builds/fleettest-65981367/athan-fleettest-2.0.996.apk \
     | grep "^package"
   ```

   Expected, exact: `package: name='com.example.athan.fleettest'
   versionCode='1000000' versionName='2.0.996'`. Anything else: STOP, install
   nothing.
3. Install and settle:

   ```bash
   adb -s 3T_SERIAL install -r \
     $HOME/athan-gitree/builds/fleettest-65981367/athan-fleettest-2.0.996.apk
   adb -s 3T_SERIAL shell monkey -p com.example.athan.fleettest \
     -c android.intent.category.LAUNCHER 1
   ```

   One throwaway launch (the What's New modal shows after any upgrade and
   marks itself shown): dismiss it, press HOME, then
   `adb -s 3T_SERIAL shell am kill com.example.athan.fleettest`, launch
   again. Never force-stop outside a flow.
4. Switch the app language to Arabic with this flow, saved to
   `$TMPDIR/136-ar-hold.yaml` and run with
   `export PATH="$HOME/.maestro/bin:$PATH"` and
   `maestro --device 3T_SERIAL test $TMPDIR/136-ar-hold.yaml` (the drive
   shape is `e2e/flows/language-switch-x1.yaml`, first half only, holding the
   Arabic state):

   ```yaml
   appId: com.example.athan.fleettest
   name: 136-ar-hold
   ---
   - launchApp
   - extendedWaitUntil:
       visible: 'London, UK'
       timeout: 15000
   - tapOn:
       point: '540, 1830'
   - waitForAnimationToEnd:
       timeout: 2500
   - tapOn: 'Language'
   - waitForAnimationToEnd:
       timeout: 2500
   - tapOn: 'العربية'
   - extendedWaitUntil:
       notVisible: 'جارٍ التطبيق…'
       timeout: 60000
   - waitForAnimationToEnd:
       timeout: 2500
   ```

   The settings button point is the atlas row; every row tap goes by text.
   If `London, UK` is absent after 15 s, take one screenshot, read it, and
   proceed from what it shows; if the Arabic wait times out, STOP.
5. Open Settings and capture the defect:

   ```bash
   adb -s 3T_SERIAL shell input tap 540 1830
   sleep 3
   adb -s 3T_SERIAL exec-out screencap -p \
     > $HOME/athan-gitree/sessions/136/2.0.996-ar-settings.png
   ```

   Read the screenshot yourself (or `vision` with one question: "do the row
   chevrons point left or right?"). Expected: every chevron on every visible
  row (Change athan, Qibla, Language, What's New when its row shows, Help,
   the colour-picker row) points RIGHT. This is R3.1. Scroll the sheet once
   with `input swipe 540 1400 540 700 400` and capture
   `2.0.996-ar-settings-scrolled.png` to cover the rows below the fold.
   Transcribe each read.
6. Switch back to English (the same flow's second half: settings tap,
   `tapOn: 'اللغة'`, `tapOn: 'English'`, wait for `Fajr`), open Settings,
   capture `2.0.996-en-settings.png`. Expected: every chevron points RIGHT
   with the English layout (the before-image for R3.3's identity read).
7. Press HOME, `am kill`, leave automatic time on (it was never off), remove
   the device lock.

LOG.md, under `### Step 01 — done`:

```
### Step 01 — done
Reproduced on the 3T, 2.0.996 fleettest build (badging re-read before
install: <the exact line>). Arabic: chevrons RIGHT on <rows read>, sheet
mirrored otherwise (icons and rows read ar layout). English: chevrons RIGHT,
layout en. Shots: sessions/136/2.0.996-ar-settings.png (+scrolled), 
2.0.996-en-settings.png. R3.1 met.
session: <ses_id>
```

Version and commit: none on app files; the docs commit bumps the version
next after the planning commits and carries `PLAN.md` (unchanged), `LOG.md`
and the queue row set to `IN PROGRESS, step 1`, message
`<VERSION> - docs(plans): ticket 136 step 1, the defect reproduced on the 3T`.
Merge per the lane protocol under `uat.lock`.

Done when: the reads are transcribed, the queue row reads IN PROGRESS step 1,
the commit is merged, and no lock is held.
