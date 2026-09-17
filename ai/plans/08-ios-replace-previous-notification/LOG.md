# Execution log: Session 8

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
