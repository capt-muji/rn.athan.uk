# Step 4: the device proof on both phones

This step ships no code. It is the proof that the three commits before it changed nothing a person can see, and it
is the only thing that can establish that: the two risks this session carries, the `frame()` split and Reanimated's
new engine, are both invisible to the suite.

0. **Anchor check:** none.

1. **Goal:** the 3T and the XS both run a production build of the finished tree, the Android patches are shown
   working on device, the widgets render as they did before, and the modal meets ADR-013's 30fps floor.

2. **Branch:** none. This step commits nothing of its own; its evidence goes into the records commit that follows
   (`steps/5-records.md`).

3. **Files:** none in the repository. Evidence is saved under `~/athan-device-sweep/session23/`, and any coordinate
   measured is written back to `e2e/device-atlas-oneplus3t.md` in the records commit.

4. **Tests first (red).** None. This step measures; it does not change code.

## The 3T (`8f7ada76`)

**Build.** A production build, because the widget and alarm behaviour being proven needs real prayer times
(`PLANNER-BRIEF.md` section 4): a mock build installs under `com.mugtaba.athan.fleettest`, whose widget providers
are never placed.

```bash
zsh ~/athan-device-sweep/session3/bin/build-prod.zsh uat-2 ~/athan-device-sweep/session23/athan-prod.apk
```

Run it in the background with its log (`EXECUTOR-BRIEF.md` section 3). Success ends `BUILD-PROD OK`; a build takes
about 4 minutes. If it prints `FAILED`, STOP and quote the line.

**Before installing, verify the APK declares its widget providers.** `ai/AGENTS.md` records a build that shipped
widget-less because a flag was off, and it could not be undone by reinstalling:

```bash
aapt dump xmltree ~/athan-device-sweep/session23/athan-prod.apk AndroidManifest.xml | grep -c PrayerWidgetProvider
```

It must print a non-zero number. Zero means the build is widget-less: STOP, and do not install over the working
build. Grepping for a bare `appwidget` is a FALSE positive, because the Glance trampoline receivers are always
present.

**Install**, keeping the app's data:

```bash
adb -s 8f7ada76 install -r ~/athan-device-sweep/session23/athan-prod.apk
```

**Check 1: the alarms survive, which proves the background-task patch is compiled in.** Before anything else:

```bash
adb -s 8f7ada76 shell dumpsys alarm | grep -A2 "com.mugtaba.athan}" > ~/athan-device-sweep/session23/alarms-after-install.txt
yarn check:device
```

Expect the app's prayer alarms plus the widget-refresh tick, and the one alarm every 3T dump shows at
`when 2104803640505` (year 2036, not identified). `yarn check:device` FAILS on nothing armed, a missing channel, or
a trigger that is not a prayer time. If it fails, STOP: the `expo-background-task` patch is the first suspect,
because a patch that does not compile is silent (`ai/AGENTS.md`, 2026-09-24: a native patch is verified by RUNTIME
behaviour, never by a green build).

**Check 2: the widget tap opens the app, which proves the expo-widgets patch is compiled in.** This is session
15c's behaviour, carried by the rebuilt patch. Read `e2e/device-atlas-oneplus3t.md` first: the launcher and
widget-picker coordinates are already mapped, so measure only what is missing, and write back anything new.

With a widget on the home screen, tap it and confirm the app comes to the foreground:

```bash
adb -s 8f7ada76 shell input tap <x> <y>          # the widget body, from the atlas
adb -s 8f7ada76 shell dumpsys activity activities | grep -m1 "mResumedActivity"
```

The resumed activity must name `com.mugtaba.athan`. If the tap does nothing, the patch did not compile: STOP.

**Check 3: the modal against the 30fps floor.** This is the Reanimated 4.7 engine question, and it is the reason
this step exists.

```bash
e2e/scripts/frame-audit.sh
```

It records the animation, extracts per-frame compositor timestamps and builds a contact sheet. Read the frames
yourself if your model can see images; if it cannot, call the `vision` subagent with the contact-sheet path and
this exact question: "In this contact sheet of a modal opening, does the card slide up smoothly, or does it jump,
stutter, flash, or appear already in place in the first frame? Answer in one sentence, naming the frame numbers of
any jump."

The floor is ADR-013's: frame gaps at or under 33ms, and no multi-frame freeze. If the audit is below the floor, or
the frames show a stutter the old engine did not have, STOP and ask (`PLAN.md` section 2.2, item 7). The recorded
fallback is `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY`, and the owner decides with the measurement in hand.

Save the audit output and the contact sheet under `~/athan-device-sweep/session23/`.

**Leave the phone** on the production build, with automatic time on (it was never changed in this step, since no
clock work is needed).

## The iPhone XS (`00008020-0015585C22D2002E`)

The XS is where the `frame()` split is judged, because the widgets it changes are the iOS home widgets.

**Build**, following `ai/AGENTS.md`'s native-version ritual, and in this ORDER, because `expo run:ios` never
re-syncs an existing native directory:

```bash
npx expo prebuild -p ios --no-install
grep -A1 CFBundleShortVersionString ios/Athan/Info.plist   # must show the app.json version
npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E
```

The build must carry `EXPO_PUBLIC_IOS_WIDGETS=1` and the real API key, as session 21's proof did.

**Check 4: the widgets render unchanged.** The `frame()` split touched the medium layout's row height and its day-list
column width. Look at a medium widget and confirm, against what the phone showed before this session:

- every prayer name is complete, not clipped from either side;
- the times stay right-aligned in their column;
- the day list occupies the same share of the card;
- the active pill sits on the correct row.

**The owner is the judge of this.** Describe what you see; send no screenshot (`EXECUTOR-BRIEF.md` section 2). If
anything differs, STOP and ask (`PLAN.md` section 2.2, item 6). Never tune the geometry to taste: the owner chose
the stacked-frame form precisely so the render would not change.

**Check 5: the modal on iOS.** Open a modal and confirm the card still springs up with the 220ms duration-form
spring rather than jumping or easing differently. Same rule: the owner judges, and a difference is a STOP.

5. **Change.** None.

6. **Green.** Every check above passes, with its evidence file under `~/athan-device-sweep/session23/`.

7. **Breaks.** None: this step changes no code.

8. **Version and commit.** None. The evidence is committed by `steps/5-records.md`.

9. **Review.** None: nothing changed.

10. **Merge.** None.

11. **Done when:**
    - `build-prod.zsh` ended `BUILD-PROD OK` and the APK's provider count was non-zero before installing;
    - `yarn check:device` passed on the 3T, with its output saved;
    - the widget tap resumed `com.mugtaba.athan`;
    - `frame-audit.sh` met the 30fps floor, and the frames show no stutter;
    - the owner confirmed the widgets and the modal look unchanged on the XS;
    - every evidence file named above exists under `~/athan-device-sweep/session23/`.
