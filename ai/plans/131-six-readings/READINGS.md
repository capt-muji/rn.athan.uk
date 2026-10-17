# The six readings, ticket 131

Every quoted line is verbatim from the evidence transcripts under
`$HOME/athan-gitree/sessions/131/` (uncommitted, deleted at DONE). No line contains a
coordinate, address or place name: the probe never logs one. The 3T sat indoors, one
room, on the desk, stationary, for every reading. Builds: the 3T probe at `ca73f5a9`
(fleettest package id `com.mugtaba.athan.fleettest`, mock/local env, aapt2-gated
before install); the XS probe at `0413248c` (2.0.939, the phone's found version,
`com.mugtaba.athan`, local env), rebuilt in the resume session after the stalled
restore install proved to have landed during the channel clear.

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

iOS half (the XS, her full grant, one relaunch; every line landed this time after
the previous session's os_log drop):

    [RD4] classic getLastKnownPositionAsync {"timestamp":1792248498302.841,"accuracy":7.981941113981475,"heading":-1,"speed":-1}
    [RD4] next getPosition timeout 0 {"timestamp":1792248498308.762,"horizontalAccuracy":7.981941113981475,"heading":null,"headingAccuracy":null,"speed":null,"mocked":false}
    [RD4] END verdict different fixes

iOS verdict: not the same object. The two reads carry timestamps 5.9 ms apart with
the same accuracy radius, where Android returned the byte-identical timestamp. The
heading contrast repeats Android's in iOS's idiom: classic reports the invalid
sentinel `-1` where /next reports `null`. Side observation under the reduced grant
(16:11:31): the classic fix read
`{"timestamp":1792249891836.3008,"accuracy":10453.129434975934,"heading":0,"speed":0}`
- the approximate blur at roughly 10 km radius on the same cached fix class.


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

Call: /next `requestForegroundPermissions({ accuracy: 'full' })` while the app holds
`granted` with `accuracy: 'reduced'` (Precise Location off, While Using unchanged).

Precondition verified in the generated plist before install (xs2-plist-key.txt, and the
same key in the restore app's built Info.plist): `ExpoLocationFullAccuracy` -> "Allow
$(PRODUCT_NAME) to access your precise location" under
`NSLocationTemporaryAccuracyDescriptionDictionary`.

Her found grant, read cold before any change (xs-rd.log, 15:48:18):

    [RD0] permission read {"status":"granted","scope":"whenInUse","canAskAgain":true,"accuracy":"full","expires":"never","granted":true}

Host reduced the grant in Settings (Apps > Athan > Location, Precise Location off;
the runner's diff read `[unchecked]`, screenshots rd3-settings-before.png and
rd3-settings-reduced.png are reach evidence). Relaunch under the reduced grant:

    [RD3] perm-watch {"status":"granted","scope":"whenInUse","canAskAgain":true,"accuracy":"reduced","expires":"never","granted":true}
    [RD3] BEGIN reduced grant, requesting full accuracy

The prompt appeared over the app (rd3-prompt.png, reach evidence; the runner's
`alert get` returned the same title). Title and buttons verbatim: `Allow "Athan" to
use your precise location once?`, body `Allow Athan to access your precise location`
(the plist purpose string), buttons `Allow Once` and `Don't Allow`. The affirmative is
the one-time form: a temporary full-accuracy grant, not a flip of the Settings toggle.

The affirmative branch was not exercised: the runner's tap pipeline wedged on the
alert screen (its pre-dispatch accessibility probe aborts over a system alert, the
atlas's snapshot-wedge trap), and the alert closed without an affirmative answer. The
resolution and the read-after, verbatim:

    [RD3] resolved {"status":"granted","scope":"whenInUse","canAskAgain":true,"accuracy":"reduced","expires":"never","granted":true}
    [RD3] after-get {"status":"granted","scope":"whenInUse","canAskAgain":true,"accuracy":"reduced","expires":"never","granted":true}
    [RD0] complete {"rd3":true}

A second ask in a fresh process (relaunch, grant still reduced) fired the same BEGIN
and resolved 44 ms later with no prompt at all (xs-rd.log, 16:11:31.971103 BEGIN,
16:11:32.015814 resolved, both reduced) - iOS suppresses the accuracy prompt after
the first ask in a grant state. The orphaned alert from that ask was dismissed
(`alert dismiss`), not answered.

Verdict: the prompt is the one-time precise-location alert, raised by
`requestForegroundPermissions({ accuracy: 'full' })` under a reduced grant, carrying
the plugin's purpose string, with `Allow Once` as the temporary-full affirmative.
Unanswered, the request resolves with the grant unchanged (`accuracy: 'reduced'`,
`granted: true`, `canAskAgain: true`); a repeat ask presents no prompt and resolves
immediately reduced. Absent form: no alert, immediate reduced resolution - observed
on the second ask.

Restore evidence (R3.2). Precise Location re-enabled in Settings (runner diff
`[checked]`, rd3-settings-restored.png), then a fresh probe relaunch read back:

    [RD3] permission read {"status":"granted","scope":"whenInUse","canAskAgain":true,"accuracy":"full","expires":"never","granted":true}

(xs-rd.log 16:21:06 onward, the post-restore process.) The probe-free restore build
of the found version (0413248c, 2.0.939) was installed over the probe and verified:
`xcrun devicectl device info apps` prints `Athan com.mugtaba.athan 2.0.939 1`, and a
launch rendered the full app face with no crash (xs-restored-launch.png, reach
evidence). Her grant config is exactly as found: While Using plus Precise.

Session note: the row's BLOCKED note said the probe stayed installed and the restore
waited on one command. Ground truth at resume: the stalled lockdown restore install
had completed during the owner's channel clear, so the installed binary was the
restore app (full app face, mock one-minute-apart prayer rows, `MMKV READ: prayer_*`
console lines, no `[RD` markers). The probe was rebuilt at 0413248c from the plan's
own recipe for this reading.


## RD6: an adopted prebuild's exact native deltas

VOID BY RULING. Row 121's DONE cell records her 2026-10-16 ruling: adopt nothing, the
classic heading path and the upstream PR stay. No adopted prebuild exists to diff, and
row 121's record already states both /next native modules compile into every build
today, which makes an adoption's native deltas zero by construction. Not measured, not
forced.
