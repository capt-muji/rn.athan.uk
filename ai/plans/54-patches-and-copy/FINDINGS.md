# Row 54: what was established, and where the row stands

Planned, executed and audited by one session on 2026-10-07, against the brief
`ai/plans/NEXT-SESSION-PATCHES-AND-COPY.md`. **The row is not finished.** The owner paused all app work part way
through, so the hygiene check is complete and the other two jobs stop where section 4 says.

## 1. Job A: the three patches

| Patch | What it does | Still needed | Tested with and without | Upstream |
| --- | --- | --- | --- | --- |
| `expo-background-task+58.0.7` | Adds `requiresNetworkConnectivity` to `BackgroundTaskOptions`, default `true`. The app passes `false` (`stores/notifications.ts`), so the notification refresh runs with no network | **Yes** | Yes, on 2026-09-24: unpatched, the job sat unrun behind `CONNECTIVITY`. Patched, it ran on three phones, one of them with the radio off (`ai/ISSUES.md` #37) | expo/expo#50581, **open** since 2026-09-24, no review yet, checks green |
| `expo-widgets+58.0.5` | Adds `openApp` to the Android widget `Button`, so a tap on a widget opens the app | **Yes** | Yes, session 15c: before, a tap did nothing. After, the app opened from dead on Android 9 and on Android 15 | **None.** No pull request and no issue exists |
| `expo-location+58.0.9` | Android: 50Hz sensors, no 2 degree emission gate, the module compiled from source. iOS: `kCLHeadingFilterNone` | **The iOS line: yes. The three Android hunks: no longer reached**, section 2 | Yes, session 50, each change on its own. Not since session 53 changed the Android reader | None. Row 51 |

**How "still needed" was established, for the first two.** The newest published SDK 58 builds were downloaded and
read, not assumed:

| Package | Installed | Newest published | What the newest holds |
| --- | --- | --- | --- |
| `expo-background-task` | 58.0.7 | 58.0.10 | `setRequiredNetworkType(NetworkType.CONNECTED)` and `requiresNetworkConnectivity = true`, both still hardcoded |
| `expo-widgets` | 58.0.5 | 58.0.14 | No `openApp`, no `actionStartActivity`, no `getLaunchIntentForPackage`. Its changelog from 58.0.6 to 58.0.14 names no such change |
| `expo-location` | 58.0.9 | 58.0.12 | `SENSOR_DELAY_NORMAL`, the 2 degree gate, and no `headingFilter` anywhere under `ios/` |

So the belief that the widgets change had landed in SDK 58 is not borne out, and the background-task pull request
is open, not merged. A competing draft for the same option, expo/expo#48469, has not moved since 2026-08-04.

**What to do with each.** Keep all three. Each is rebuilt against its new version at row 18. The widgets change
is a general capability and is worth a pull request of its own. Nothing is owed on #50581 until a maintainer
reviews it.

## 2. The `expo-location` patch, which is the open question

**The Android half is dead on any phone that carries Google's fused sensor, by the code and by one reading.**

| Evidence | What it shows |
| --- | --- |
| `hooks/useQibla.ts`, the branch on `hasFusedHeading()` in `start` | A fused phone calls `watchFusedHeading` and never calls `watchHeading`, which is the only caller of `Location.watchHeadingAsync`. The patched Kotlin runs only inside that watch |
| The same file, `processReading` | A phone without the fused sensor is drawn only when its accuracy is inside the bar or on a warm reopen. `watchHeadingAccuracy` exists on the iPhone side alone, so such an Android phone is never drawn a compass |
| OnePlus 3T, build 1.29.256, which carries the Android hunks, with the qibla sheet open | `dumpsys sensorservice`: the accelerometer, the magnetometer, the uncalibrated magnetometer and the uncalibrated gyroscope are all held by Google Play services. The app's own uid holds no connection |

**What was NOT done, and it is the proof the brief asks for:** no build without the three Android hunks was made,
so "a fused phone is unaffected" rests on the code and on the reading above, not on a second build. Removing the
hunks was started and put back: `patches/expo-location+58.0.9.patch` is unchanged and
`scripts/verify-expo-location-patch.sh` prints `PATCH AS SHIPPED`.

**A session that removes them must also move the guard.** That script and
`shared/__tests__/expoLocationPatch.test.ts` assert the Android hunks are present, so both change with the patch.
The guard's last check looks for `android/local-maven-repo`, and the package ships its prebuilt library at
`local-maven-repo` in the package root, so that check can never fire as written.

**The iOS line is still needed, by the code:** the iPhone's heading still arrives through
`Location.watchHeadingAsync`, where CoreLocation's default 1 degree filter applies. It was last tested with and
without in session 50 (experiment D, judged not smooth without it). Testing it again needs the owner's eye, and
the compass is locked.

**Is it specific to a qibla, and would it regress others.** The brief's answer stands: each hunk corrects
something any compass meets, and each should be offered upstream as an option with today's behaviour as the
default. That is row 51.

## 3. Job B: the line of copy

*Just a moment* becomes *Follow below instructions*. The change was written, tested and committed on the local
branch `fix/qibla-subtitle-copy`, one commit ahead of `uat-2`. **Merged into `uat-2` on 2026-10-08; the owner waived
the phone proof the same day and confirmed the wording is what he wants.**

| What | Result |
| --- | --- |
| The two stacked lines, measured in the bundled Roboto Regular at the subtitle's size with `hb-shape` | *Follow below instructions* 158.6dp, *Hold flat and turn slowly* 150.4dp. *Just a moment* was 94.0dp |
| So the line left in flow | The new one, which is the wider. The two lines swap places in `QiblaSubtitle` |
| Tests | Three renamed to the new wording, and two new ones that pin which line shows on which side of the fade. Nothing guarded the fade before |
| Red first | Five failures against the unchanged component, each `Unable to find an element with text: Follow below instructions` |
| Breaks | Five of five caught: the fades swapped, the narrower line in flow, the cap removed, the old wording, both lines shown at once |
| The suite at that commit | 188 suites, 5200 tests, 100% on all four measures |
| **Not done** | The build on a phone, and the reading of the header's height when the compass arrives. **Waived by the owner, 2026-10-08** |

## 4. Job C: the hygiene check, and what is left of the row

**The check is complete**, 1.29.263: the records use the rule's placeholders throughout, and the rule in
`ai/AGENTS.md` names four more of them.

| Left to do | Waits on |
| --- | --- |
| ~~Merge `fix/qibla-subtitle-copy`, build it, and read the line on a phone~~ Merged 2026-10-08, phone proof waived by the owner | Nothing |
| The build without the Android hunks, and the decision to remove them | The owner's word to resume app work |
| Whether comments in the code that name the owner as a role are reworded: 147 lines in 62 files, 69 of them in app source | His answer |
| The build worktrees under `$HOME/athan-device-sweep/worktrees/` | Nothing. `build-mock.zsh` and `build-prod.zsh` create one on their first run |
