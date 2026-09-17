# Execution log: Session 8

## Execution entries, 2026-09-17 (GLM 5.3, no subagents per the owner's instruction)

**18:04, pre-flight round 1 caught three carried-script bugs** (fixed in 1.27.207, `7c029c6f`):
an invalid BSD-grep pattern in the tree check, a devicectl cold-start without a retry, and
`pipefail` plus `grep -q` SIGPIPE-ing every successful wait in all three scripts. Re-run:
`PREFLIGHT OK`.

**18:14, build round 1: variant A built, variant B failed on a wrong assumption.** The plan
assumed CocoaPods copies expo-notifications into `ios/Pods`; it does not: the Pods project
compiles the pod straight from `node_modules` (`path =
"../../../../../repos/rn.athan.uk/node_modules/expo-notifications/ios"` in
`ios/Pods/Pods.xcodeproj/project.pbxproj`), which in the worktree is a symlink to the main
checkout. Variant A built and signed fine (`VARIANT A OK`, `** BUILD SUCCEEDED **`); the pod
splice then failed with `FileNotFoundError: ios/Pods/expo-notifications/.../NotificationRecords.swift`.
Fix (build-study.sh + plan section 7.1, decision 8): variant B now replaces the worktree's
`node_modules` symlink with per-package symlinks plus one real, patched copy of
expo-notifications, and re-runs pod install. Also tightened the profile grep to `-F` (the raw
pattern's dots are regex-any and matched the keychain line, where the plist dump renders dots as
spaces).

**18:56, study round 1 stopped at the first wait: the harness itself had a bug.** The study app
launched, syslog capture worked, and the harness logged
`NOTIFY-STUDY PERM {"granted":false,"status":"undetermined","iosStatus":3}` (provisional granted,
no dialog; the plan had predicted `iosStatus:2`, wrong: 3 is the provisional raw value, now
corrected in section 7.2) and then never logged `RUN`. A relaunch reproduced it exactly. Cause,
found by reading the installed source: the harness imported `{ activate, deactivate }` from
expo-keep-awake, which exports `activateKeepAwakeAsync` and `deactivateKeepAwake` instead; the
import bound `undefined`, the call threw into the floating `runNotifyStudy()` promise, and the
harness died silently after PERM. Fix (carried harness + plan): import the real names and await
the activation.

**19:0x, study round 2 looped at cursor 0 for ~50 minutes.** The harness kept its cursor in the
app's MMKV (`stores/database`), and every relaunch read it back as 0: 58 identical phase-1 runs
(17:39 to 18:15, `study-syslog.txt.20260917-*`), each completing P1 and writing cursor 1 that the
next launch never saw. Root cause not isolated (the real app's own MMKV use works); routed out
instead: the cursor is now a never-firing pending notification in iOS's own notification store
(`study-cursor-N`, schedule-then-cancel, `CURSOR-SET` logged), natively persistent by
construction. The driver also gained a stuck-cursor guard (three identical cursors ends the run)
and the harness's own keep-awake import was the round-1 fix above. An incremental xcodebuild
(JS bundle only, ~4 minutes; one transient signing-lookup failure retried successfully) replaced
the harness without a full build.

**18:21 to 18:26, study round 3: COMPLETE, end to end, no questions.** Driver
(`$TMPDIR/study.log`): baseline shot, variant B installed, six launches, the kill between
cursors 1 and 2 (`KILLED pid=43172`), six screenshots, `P5 CLEANED`,
`UNINSTALLED com.mugtaba.athan.experiments`, `STUDY RUN DONE`. The owner unlocked the phone once
at ~18:15 (offered unprompted; phases then ran with the app active, `STATE active` throughout).

Measured, from `~/athan-device-sweep/session8/study-syslog.txt` (this run only):

- `PERM {"granted":false,"status":"undetermined","iosStatus":3}` on every launch: provisional
  authorization, no dialog, six times.
- **Phase 1:** `P1-AFTER-FIRST DELIVERED [{"id":"x1","title":"P1 first"}]`, then the same
  identifier scheduled again, then
  `P1-FINAL DELIVERED [{"id":"x1","title":"P1 second"}]`: ONE entry, the second. The plan
  predicted two; the phone replaces the delivered notification. 60 consistent observations
  (58 in round 2, 2 in round 3). The mechanism (flip at add-time or at fire-time) is not
  distinguished by the dumps; the net behaviour is.
- **Phase 3:** `P3-BEFORE DELIVERED` held FOUR entries: x3a, x3b, x3c delivered with the app
  killed between launches, plus phase 1's leftover x1 (the plan predicted three and forgot the
  leftover; corrected in the plan). `P3 DISMISSED-ALL` then `P3-AFTER DELIVERED []`: one call
  cleared all four.
- **Phase 4:** `P4 PROBE {"patched":true,...}`, and `P4-FINAL DELIVERED` held four entries, every
  one `"thread":"athan-study"`: the two-line pod patch reaches the system content.
- **Phase 2 (app active):** three HANDLER/CLEARED pairs — x2a cleared 4 (phase 4's leftovers),
  x2b cleared 1, x2c cleared 1; `incomingPresent:false` each time (the arriving notification is
  NOT in the delivered set when the handler runs); `P2-FINAL DELIVERED [{"id":"x2c",...}]`:
  exactly the newest remained.
- **Cleanup:** `P5 DISMISSED-ALL`, `P5-FINAL DELIVERED []`, `P5 CLEANED`; the study app was then
  uninstalled and the owner's Athan (1.26.28) was never touched by any step.

Screenshots `00-baseline.png` through `05-after-p2.png` sit in `~/athan-device-sweep/session8/`
as corroboration; no claim rests on them. Round-2 evidence is preserved in the timestamped
syslog rotations beside them.

## Planning entry, 2026-09-17 (GLM 5.3)

The owner instructed, before planning began: "Do everything yourself. Do not use any subagents for
now." Every phase of this session therefore ran without subagents, including the plan review the
planner brief would otherwise have spawned.

**Owner decisions taken while planning (the `question` tool, 16:52):**
1. The study runs on the iPhone XS as throwaway builds; the plan is the experiments plus the
   finding with options. Nothing is built.
2. Hands during the study: "you do everything". No taps, no gestures. The design carries this:
   provisional authorization removes the permission dialog, the phone is driven with
   `xcrun devicectl` and `pymobiledevice3`, and the one thing that could still need the owner
   (a locked phone at the foreground phase) is a designed STOP with one unlock ask.
3. The study build runs under its own app id, `com.mugtaba.athan.experiments`; on a provisioning
   failure the executor stops and asks, never falling back to the owner's app id.

**Research (this session, recorded in the plan's section 4.2 with sources):** expo-notifications
57.0.18's installed iOS source and Apple's own documentation pages, fetched through TinyFish.
The facts that shaped the design: no API replaces a delivered notification; the service extension
is remote-only; expo 57.0.18 never applies `threadIdentifier` (a two-line gap); the dismiss APIs
exist; provisional authorization is wired end to end and needs no dialog.

**Spike (planner brief section 3, item 8):** the study build was built for real in
`~/athan-device-sweep/worktrees/plan-8` (removed afterwards): worktree at `fa3337b3`,
`node_modules` symlinked, `app.json` repointed at `com.mugtaba.athan.experiments`, `expo prebuild`,
`pod install`, `xcodebuild ... DEVELOPMENT_TEAM=9V3WAU9Z54 -allowProvisioningUpdates build`.
Result: `** BUILD SUCCEEDED **` (`/Users/muji/athan-device-sweep/plan8-xcodebuild.log`),
`TeamIdentifier=9V3WAU9Z54`, and the embedded profile's
`application-identifier 9V3WAU9Z54.com.mugtaba.athan.experiments`: on-the-fly provisioning works.
Not spiked, deliberately: installing and running on the phone (device state); those behaviours are
the study's own measurements, every wait is bounded, and every unpredicted line is a STOP.

**Plan review (planner brief section 3, item 11, done by this session per the owner's instruction):
findings and fixes.**
1. The cursor was reordered so the foreground-dependent phase runs last: a locked phone now costs
   nothing until the final phase, and the phase retries by relaunch.
2. The phase-4 handler gate was off by one against the reordered cursor (would have made phase 2's
   handler inert). Fixed.
3. Variant A could have consumed phase 4's cursor while unpatched, making the thread result
   unreachable. Fixed with a probe notification that reports which build is running and refuses to
   advance the cursor unpatched; the driver also installs variant B as phase 3 completes.
4. `splice-index.py`'s const-line anchor expected a following blank line `app/index.tsx` does not
   have: the splice would have failed mid-build. Verified against the file and fixed.
5. Delivered-set dumps sat 2 seconds after their trigger fires; widened to 6 or more seconds.
6. Phase 3a's first fire was 6 seconds out, inside the kill's latency window; moved to 12 seconds
   so all three deliver with the app dead.
7. `study.sh` rotated the syslog to a fixed name, so a second restart would have overwritten the
   first run's evidence; it now rotates to a timestamped name and the digest spans every capture.
8. A kill that found no pid would have silently measured delivery with the app alive; the script
   now fails loudly.
9. The `PERM` prediction was wrong about expo's mapping of provisional authorization
   (`iosStatus` 2 with `granted` false, `status` undetermined); corrected, and the study never
   gates on those fields.
10. Phase 2's handler counts are predicted against phase 4's leftovers (the phase runs after it),
    not against an empty tray.

**State left by planning:** `uat-2` at the plan's commit, pushed; the spike worktree removed; no
device state changed (the phone was only read). The plan is READY.
