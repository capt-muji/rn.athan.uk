# Device proof: both phones, from the final tree

Not a commit of its own. It runs after step 8 is merged, before the records are written, on the tree `uat-2` then
holds. Nothing in this plan changes app behaviour, so this proof is looking for the opposite of a new feature: the app
must launch, show real prayer times, keep its alarms and render its widgets exactly as it did before.

**Why both phones.** The owner's ruling of 2026-09-25: 🐋  "You have 2 phones connected to iPhone XS, and the Android
1 +3 T, which is our baseline, based our cheapest phone, so you should definitely work on both these phones." The 3T
is Android 9 on an SD820, the slowest device this app supports, so a regression in launch cost shows there first. The
XS is the only iOS device and the only place the widget extension runs.

**Why a production build, not a mock one.** jotai 3 is the store layer behind every atom, and `stores/sync.ts`, the
file step 8 rewrites, is the launch sync that fetches and caches real prayer times. A mock build's prayers sit either
side of launch, so it cannot show that the real API path still works (`ai/AGENTS.md`: alarm times only mean anything
on a production build).

## Safety, before anything else

No step here changes the clock, so no armed alarm is fired by this proof. Read the alarms anyway, before and after,
because the point of the proof is that they survive:

```bash
adb -s 8f7ada76 shell dumpsys alarm | grep -A2 "com.mugtaba.athan}" > ~/athan-device-sweep/session21/alarms-before.txt
```

Every 3T dump lists one app alarm at `when 2104803640505` (a date in 2036, never identified). That one is expected.
If any OTHER alarm appears that the app did not arm, STOP.

## 1. The OnePlus 3T (`8f7ada76`), Android 9

```bash
zsh ~/athan-device-sweep/session3/bin/build-prod.zsh uat-2 ~/athan-device-sweep/session21/athan-3t-prod.apk
```

Run it in the background with its log. Success ends `BUILD-PROD OK`; a `FAILED` line is a STOP. A build takes about
four minutes.

The widget flags must be present at prebuild and bundle time or the APK silently ships with no widget providers at
all (`ai/AGENTS.md`, the 2026-09-25 durable lesson). Verify before installing, which must print a non-zero count:

```bash
aapt dump xmltree ~/athan-device-sweep/session21/athan-3t-prod.apk AndroidManifest.xml | grep -c PrayerWidgetProvider
```

Then install, keeping the app's data:

```bash
adb -s 8f7ada76 install -r ~/athan-device-sweep/session21/athan-3t-prod.apk
```

| Check | Command | Expected |
| --- | --- | --- |
| Cold launch reaches content | `python3 ~/athan-device-sweep/session5/bin/devcheck.py cold` | The prayer list renders; no error screen |
| The launch sync ran | `python3 ~/athan-device-sweep/session5/bin/devcheck.py logs` then grep for the sync's own lines | A completed sync, no `hasError` |
| Real times, not mock | Read the rendered list | Times match London for today; Fajr is not seconds from launch |
| Alarms re-armed | `adb -s 8f7ada76 shell dumpsys alarm \| grep -A2 "com.mugtaba.athan}"` | The same set as `alarms-before.txt`, plus the 2036 entry |
| Widgets render | `adb -s 8f7ada76 shell dumpsys appwidget \| grep -c "com.mugtaba.athan"` | Non-zero, and each placed widget shows times |
| Resume is clean | `python3 ~/athan-device-sweep/session5/bin/devcheck.py resume` | The countdown continues; no blank list |

Save `cold`, `resume` and `logs` from `~/athan-device-sweep/session5/mockcheck/` into
`~/athan-device-sweep/session21/3t/`.

**The launch-cost comparison that matters.** jotai 3 changes how atoms are built, and `metro.config.js` runs with
`inlineRequires`, so module evaluation order on device is not Jest's. Compare cold launch against the last recorded
figure for this phone rather than against a fixed number:

```bash
adb -s 8f7ada76 shell am start -W -n com.mugtaba.athan/.MainActivity
```

Record `TotalTime`. The 3T's documented cold launch is about 6.6s (`ai/AGENTS.md`, ISSUES #32). A reading within a
second of that is unchanged. A reading two seconds or more above it is a regression: STOP and report it with both
numbers, and do not write the records.

## 2. The iPhone XS (`00008020-0015585C22D2002E`)

The owner holds this phone and does its taps; touch automation is not available on a physical iPhone (`ai/AGENTS.md`).

```bash
npx expo prebuild -p ios --no-install
grep -A1 CFBundleShortVersionString ios/Athan/Info.plist
```

The plist must show the version step 8 left in `app.json`. Then build and install:

```bash
npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E
```

| Check | How | Expected |
| --- | --- | --- |
| Launches to content | `xcrun devicectl device process launch --console --terminate-existing --device 00008020-0015585C22D2002E com.mugtaba.athan` | The prayer list renders; no error screen |
| No crash on launch | `pymobiledevice3 crash ls` | No new crash for Athan |
| Real times | Ask the owner what the list shows | Today's London times |
| Widgets still render | Ask the owner to look at the placed widgets | All eight home kinds show times, no black card |

The widget question for the owner, in these words: "On the iPhone, do all the placed Athan widgets still show prayer
times, and is any of them blank or black?" The owner's answer is the verdict; the owner receives no screenshots.

## State both phones are left in

- The 3T: the production build from this proof, automatic time ON, unlocked with Athan open and "Stay awake" on
  (`ai/prompts/README.md`, the standing ruling of 2026-09-16). Note in `LOG.md` that this leaves a production build
  rather than the usual mock one, because this session's proof needs real times; the next session that needs the mock
  reinstalls it.
- The XS: the Release build from this proof.
