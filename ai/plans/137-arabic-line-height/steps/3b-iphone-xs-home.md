# Step 3b: the XS home and overlay measurement, read-only

Requirements: R3.1 (the sheet void stands as recorded), R3.2, R3.3
Weight: 3. A device step, dispatches alone.

Anchor check: as step 2b. A count other than 1 is a STOP.

Goal: the same home and overlay surfaces' rendered frames on the owner's iPhone
XS as step 2b read on the 3T (D137.11), read-only contact, the app left exactly
as found.

Branch: `step-137/xs-home` off `uat`, in the lane worktree. Files: this plan
folder's `LOG.md` and `FINDINGS-XS-HOME.md` (new); evidence under
`$HOME/athan-gitree/sessions/137/`.

Red tests: none. A device measurement step.

The whole contact runs under `$HOME/athan-gitree/device-IPHONE_UDID.lock`, taken
before the first devicectl or agent-device command and removed the moment the
app is terminated. Read the atlas `e2e/device-atlas-iphone-xs.md` before the
first contact and replay its routes; her athan storage is never opened, no
system setting is touched, no install is ever made.

Change contracts:

1. Resolve the device and the build: as step 3, `xcrun devicectl list devices`
   prints a line with `IPHONE_UDID`; `xcrun devicectl device info apps --device
   IPHONE_UDID` yields the installed Athan version, at or past 2.0.811 (else
   record and stop per D137.5).
2. Launch the app by the plan's devicectl launch command; the arrival language
   reads from the home tree (step 3 found ar; record what is found, that state
   is what gets restored). When the launch popup presents, tap its backdrop once
   as step 3 did, navigation only.
3. Language branch, D137.4 exactly as step 3: when the found language is not ar,
   no round trip happens here; STOP and yield to the lead. When it is ar,
   measure and say so in the LOG.
4. Home reads, the step-3 instrument, agent-device snapshot frames,
   label-matched refs, never blind taps, on the static home screen:
   - the day location label `لندن، المملكة المتحدة`, 16 Rubik-Regular,
     unpinned
   - the day date label (the form the screen shows), 18 Regular, unpinned
   - one prayer row name, 18 Regular, unpinned
   - one row time, 18 Regular, unpinned, Latin digits
   - the countdown word beside the countdown digits, 17 Regular, unpinned
   One screenshot into `$HOME/athan-gitree/sessions/137/xs-home.png` for the
   vision corroboration. When a snapshot wedges or returns no frames, the
   pixel fallback of step 3 applies: the screenshot is the record the lead's
   vision reader transcribes; the LOG records the wedge.
5. The overlay: swipe one page to the Extras schedule (under RTL the Extras
   page sits left; the snapshot confirms the page by the Extras row labels),
   settle, tap an extra row that is not a passed Istijaba, one second, then
   read frames for:
   - the explanation title, the extra prayer's Arabic name, 18 Rubik-Medium,
     unpinned
   - the explanation body, the Arabic explanation sentence, 16 Regular,
     pinned 24, multi-line: record the whole element's frame; the lead's
     vision read fixes the line count later
   One screenshot `xs-overlay.png`. Tap the SAME row again (the overlay
   closes), verify from the snapshot that it closed, swipe back to the
   Standard page, verify the six-row face.
6. Record into `FINDINGS-XS-HOME.md`: one line per surface, frame verbatim,
   height px, nominal size and face, computed em at scale 3, nearest candidate
   with px gap from the extended EXPECTATIONS.md table, the pin line for the
   body (frame divided by the vision line count once the lead records it,
   marked pending until then), plus the installed version line and the arrival
   language line.
7. Restore as found: the overlay closed and verified, the Standard page shown
   and verified, the language matches the arrival state verified from the
   face, the app terminated through devicectl (pid resolved, signal sent,
   `process-id-for-bundle-id` then prints 0), no system setting touched, the
   lock removed once the app is gone.

Green run: `FINDINGS-XS-HOME.md` holds seven surface lines plus the version and
language lines; the LOG holds the arrival and restore states.

Break script: none. The reviewer re-derives em ratios from the recorded frames.

Version and commit: as step 3. Message: `<VERSION> - docs(plans): 137 step 3b,
the XS home and overlay line boxes, the app restored as found`.

Merge: as step 1, under the `uat` lock; the gradle sync is the lead's
main-tree action under the build lock.

Done when: the readings and the restore note are merged, and the row reads
`IN PROGRESS, step 4`.
