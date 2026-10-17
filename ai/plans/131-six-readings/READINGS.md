# The six readings, ticket 131

Every quoted line is verbatim from the evidence transcripts under
`$HOME/athan-gitree/sessions/131/` (uncommitted, deleted at DONE). No line contains a
coordinate, address or place name: the probe never logs one. The 3T sat indoors, one
room, on the desk, stationary, for every reading. Build: the plan's probe shell at
`ca73f5a9`, fleettest package id `com.mugtaba.athan.fleettest`, mock/local env,
aapt2-gated before install.

## RD1: whether the GMS provider reports a bearing on a stationary phone (3T)

Call: /next `getPosition({ maxCachedAge: 0, timeout: 30 })`, both grants on, services
on, phone flat on the desk.

Lines (3t-rd.log):

    [RD0] provider Fallback: GMS -> Android
    [RD1] BEGIN fresh stationary fix, phone flat on desk indoors
    [RD1] fresh fix {"timestamp":1792165061462,"horizontalAccuracy":100,"heading":null,"headingAccuracy":null,"speed":null,"mocked":false,"ageMs":57904675}
    [RD1] END verdict heading absent null

Verdict: no bearing. The /next stack on this 3T does not select GMS at runtime: the
selected provider name reads `Fallback: GMS -> Android`. No fresh fix arrived indoors
within 30 s, so the call fell back to the last-known fix (ageMs 57904675, about 16.1 h
old), which carries no bearing. Absent form: `"heading":null` and
`"headingAccuracy":null` on the returned fix.

Contrast recorded beside it (RD4's line, same fix): the CLASSIC
`getLastKnownPositionAsync` reports `"heading":0` for the same cached fix where /next
reports `null`. Android's `hasBearing()` is false for this fix; /next gates the field
behind it, classic surfaces the raw zero. A classic `heading: 0` is an unvouched zero.

## RD4: whether getPosition returns the same cached fix getLastKnownPositionAsync returns

Call: classic `getLastKnownPositionAsync()`, then /next `getPosition({ timeout: 0 })`.

Lines, full grant (3t-rd.log):

    [RD4] classic getLastKnownPositionAsync {"timestamp":1792165061462,"accuracy":100,"heading":0,"speed":0}
    [RD4] next getPosition timeout 0 {"timestamp":1792165061462,"horizontalAccuracy":100,"heading":null,"headingAccuracy":null,"speed":null,"mocked":false}
    [RD4] END verdict same-timestamp fix

Lines, coarse-only grant (same fix, blurred):

    [RD4] classic getLastKnownPositionAsync {"timestamp":1792165061462,"accuracy":2000,"heading":0,"speed":0}
    [RD4] next getPosition timeout 0 {"timestamp":1792165061462,"horizontalAccuracy":2000,"heading":null,"headingAccuracy":null,"speed":null,"mocked":false}
    [RD4] END verdict same-timestamp fix

Lines, services off (cold start):

    [RD4] classic getLastKnownPositionAsync null
    [RD4] next getPosition timeout 0 null
    [RD4] END verdict both null

Verdict: yes, same fix. Both reads return the identical timestamp under every grant
state, with the accuracy radius re-blurred to 2000 m under coarse-only. With location
services off, both return null. Absent form: `null` from both, services off.

## RD5: how a coarse-only Android grant reports on a position request (3T)

State: `pm grant ACCESS_COARSE_LOCATION` with `pm revoke ACCESS_FINE_LOCATION` on the
fleettest package. The revoke killed the app process (Android restarts apps on revoke);
the probe relaunched and read the state cold.

Lines (3t-rd.log):

    [RD0] permission read {"expires":"never","canAskAgain":true,"scope":"always","accuracy":"reduced","granted":true,"status":"granted"}
    [RD5] perm-watch {"expires":"never","canAskAgain":true,"scope":"always","accuracy":"reduced","granted":true,"status":"granted"}
    [RD5] BEGIN coarse-only grant
    [RD5] permission read {"expires":"never","canAskAgain":true,"scope":"always","accuracy":"reduced","granted":true,"status":"granted"}
    [RD5] getPosition resolved {"timestamp":1792165061462,"horizontalAccuracy":2000,"heading":null,"headingAccuracy":null,"speed":null,"mocked":false}
    [RD5] END

Verdict: the /next permission read reports the grant as `granted:true`,
`status:"granted"`, `accuracy:"reduced"` (and `scope:"always"` from this app's
manifest set), and a position request RESOLVES rather than throwing: the same cached
fix served at `horizontalAccuracy` 2000 m, `heading` null. Absent form: none owed, the
call resolves; a throw would have logged `getPosition THREW` and none did.

Restore evidence:

    [RD5] perm-watch {"expires":"never","canAskAgain":true,"scope":"always","accuracy":"full","granted":true,"status":"granted"}

(the `pm grant` restore, read back by the probe). The fleettest package was then
uninstalled (`Success`, `pm list packages` count 0): phone as found.

## RD2: whether enableLocationServices shows an in-app dialog or opens Settings (3T)

State: `settings put secure location_providers_allowed -gps,-network`, probe
cold-started so its waiter saw services off.

Lines (3t-rd.log):

    [RD1] skipped services off
    [RD2] BEGIN services off, calling enableLocationServices
    [RD2] resolved true
    [RD2] services after true
    [RD2] END

Focus dump between BEGIN and resolution (rd2-focus.txt):

    mCurrentFocus=Window{6621e9c u0 com.google.android.gms/com.google.android.location.settings.LocationSettingsCheckerActivity}

The screenshot (rd2-dialog2.png, reach evidence only) shows a Google Play services
Location Accuracy dialog over the dimmed app: title "To continue, your device will
need to use Location Accuracy", body naming Device location, Wi-Fi scanning and
Location Accuracy, buttons "No thanks" and "Turn on". Tapping "Turn on" restored the
providers (`settings get secure location_providers_allowed` prints `gps,network`) and
the promise resolved `true`.

Verdict: the in-app dialog form, not Settings. The call surfaced a GMS activity
(`LocationSettingsCheckerActivity`) over the app, the promise stayed pending until it
was answered, and the affirmative answer restored services and resolved true. Absent
form (the other branch): had it opened Settings, the focus dump would name
`com.android.settings`; it does not.

Side observations recorded as part of the reading:

- Turning services off while the probe's waiter loop ran STOPPED the loop's logging
  from 08:45:53 to 08:48:11 while GMS's own `LocationOffWarningActivity`
  (`com.google.android.gms/.location.settings.LocationOffWarningActivity`, title "No
  location access", buttons "Close" and "Turn on location", screenshot rd2-dialog.png)
  held focus, without any enableLocationServices call from the probe. The loop
  resumed logging the moment that dialog was answered. The probe therefore never
  observed the off state until cold-started under it. The dump and the log gap are
  the evidence; no mechanism is claimed.
- The GMS Location Accuracy dialog's button row sits at y about 1593 on this panel
  today ("No thanks" (658,1593), "Turn on" (878,1593)); the 3T atlas's session-37
  row recorded y 1543 for the same dialog. The atlas files belong to other lanes, so
  the drift is recorded here instead.
- The `[RD0] complete` line never printed: the two waiters fired in different
  processes (the revoke restart split them), and the second process was uninstalled
  before its 15-minute deadline. Every reading's own END line did print.

## RD3: the XS temporary-full-accuracy prompt under a reduced grant

BLOCKED mid-reading 2026-10-17 by the XS automation channel dying (row 124's fault
class). What the session captured before the block:

- The probe app (com.mugtaba.athan, 2.0.939 content, ENV=local so it opens
  athan-storage-dev and never reads the owner's athan-storage) installed over the
  found build (found state: 2.0.939, xs-found-apps.txt) and ran. Her grant read
  When Using plus Precise ON on every poll and was NEVER changed: the reduce drive
  never ran, so there is no grant restoration owed. Lines (xs-rd.log):
  `[RD0] permission read {"status":"granted","scope":"whenInUse","canAskAgain":true,"accuracy":"full","expires":"never","granted":true}`
- The purpose key precondition verified in the generated plist before install:
  `ExpoLocationFullAccuracy` -> "Allow $(PRODUCT_NAME) to access your precise
  location" (the prebuild log).
- RD4's iOS half, partial: the classic line landed once
  (`[RD4] classic getLastKnownPositionAsync {"timestamp":1792224225850.885,"accuracy":5.638395719850306,"heading":-1,"speed":-1}`),
  then the /next line and the verdict line never surfaced: Release-build console
  lines riding os_log drop non-deterministically on this XS (observed twice; the
  2-second loop lines all arrive; the drops hit lines that follow a location await).
  RD4's criterion stands on the 3T evidence; the iOS half stays open with the drop
  recorded.
- The channel timeline: devicectl install and launch worked 09:01 to 09:05; from
  09:08 every CoreDevice RSD call fails with row 124's signature
  (`Failed to allocate RSD device`, `_AMDeviceCreateWithRemoteDeviceUUIDAndTypeWithError`),
  spreading to device-info calls; agent-device's runner prepare timed out twice
  (15 s command timeout); a Maestro drive hung after device detection; the
  pymobiledevice3 lockdown install stalled; its tunnel path needs a sudo tunneld.
  DVT stayed alive throughout (screenshots, process kill). The taps RD3 needs
  (the Settings reduce drive and the prompt's answer) have no channel that survives
  the wedge, and row 124's ladder is owner-hands by nature (reboot, replug, sudo).
- The phone at close: unlocked, charging, the probe app's process killed via DVT
  (pid reads 0), the probe BINARY still installed. The probe-free restore build of
  the found version's content (0413248c, 2.0.939) is built and waiting at
  `$HOME/athan-gitree/sessions/131/restore-Athan.app`; one install command lands it
  once any install channel returns. No owner data, notification or preference was
  touched: the probe shell mounts none of the app's machinery.

Resume: clear the channel (row 124's ladder), install the restore app (or rebuild
from step 2's recipe), re-run step 2's choreography for RD3 with the probe build,
restore the grant after the reduce, then step 3.

## RD6: an adopted prebuild's exact native deltas

VOID BY RULING. Row 121's DONE cell records her 2026-10-16 ruling: adopt nothing, the
classic heading path and the upstream PR stay. No adopted prebuild exists to diff, and
row 121's record already states both /next native modules compile into every build
today, which makes an adoption's native deltas zero by construction. Not measured, not
forced.
