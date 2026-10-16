# Step 3: the 3T release build and the alarm gates

Requirements: R3.1, R3.2, R3.3, R3.4
Weight: 3

## Anchor check

None: the anchors verified at pre-flight and step 1 consumed them.

## Goal

A production build of the re-pin commit on the OnePlus 3T, proving R8 still
holds, the alarm-clock arms read their 3T form, the device checks pass, the
widget runtime loads, and the Metro env behaviour is re-verified against the
e2e README's gotcha (D111.11).

## Branch

No code branch. This step proves the merged uat; any defect it finds opens a
STOP with the output, not an improvised fix.

## Build

The recipe lives outside the repository, at `$HOME/athan-gitree/BUILD.md`; the
script carries the prebuild order itself (it runs
`npx expo prebuild -p android --no-install --clean`, so no separate prebuild
call exists here):

```bash
zsh $HOME/athan-gitree/bin/build-prod.zsh uat $HOME/athan-gitree/sessions/111/3t/athan-uat-prod.apk
```

Expected: the script ends `BUILD-PROD OK` (R3.1) and its identity line prints
`EXPO_PUBLIC_ENV=prod, real API key present in the bundle (not printed)`. The
prebuild order runs `app.json` first; `expo run:*` never re-syncs an existing
native folder. Never run two build scripts at once.

If `checkReleaseAarMetadata` names compileSdk in `modules/qiblaheading`,
`modules/tls13` or `modules/widgetrefresh`: the section 2.2 STOP.

## Install and checks

```bash
adb -s 3T_SERIAL install -r <out.apk>
adb -s 3T_SERIAL shell am start -W com.mugtaba.athan/.MainActivity
yarn check:device 3T_SERIAL
adb -s 3T_SERIAL shell dumpsys alarm | grep -A6 "com.mugtaba.athan" | head -40
```

Expected:

- `yarn check:device` lists every channel and every armed alarm at prayer
  times, failing only if something is unarmed, a channel is missing or a
  trigger is not a prayer time (R3.2). The known unexplained app alarm at
  `when 2104803640505` appears and is named, not counted.
- One armed athan reads `window=0 flags=0x3` with an `Alarm clock:` sub-block
  (R3.3, A3: the 3T form; `flags=0x9` is the windowed form other phones show).
- Alarm TIMES are production-real: the production API fetch must complete
  first (local builds' mock times sit either side of launch; the check script's
  README section binds). Wait for the fetch, rerun the check, record the
  second output.

## Widget runtime load

```bash
adb -s 3T_SERIAL logcat -d -s ReactNativeJS | tail -30
```

Expected: the widget runtime load lines with no error (R3.4); the loaded-
bundle suite in Jest already proved the module graph green in step 1. Place a
widget from the picker if the launcher lost it, read the atlas
(`e2e/device-atlas-oneplus3t.md`) before any screenshot.

## Metro env re-verify (D111.11)

The env bytes live in the JS chunk; `assets/app.config` regenerating proves
nothing (the e2e README's own words). Compare the chunks themselves, in two
named throwaway directories:

```bash
export EXPO_PUBLIC_ENV=prod
npx expo export --platform android --output-dir "$TMPDIR/111-export-prod" 2>&1 | tail -2
export EXPO_PUBLIC_ENV=mock
npx expo export --platform android --output-dir "$TMPDIR/111-export-mock" 2>&1 | tail -2
md5 -q "$TMPDIR"/111-export-prod/_expo/static/js/android/*.js | head -3
md5 -q "$TMPDIR"/111-export-mock/_expo/static/js/android/*.js | head -3
grep -rl "mock" "$TMPDIR"/111-export-mock/_expo/static/js/android/*.js | head -2
```

Expected: the two entry-chunk md5 lines differ (the changed `EXPO_PUBLIC_*`
invalidated the transform cache instead of shipping stale bytes), and the mock
chunk greps its mock marker. Record which behaviour held in `LOG.md`; if the
stale-transform class is healed, step 5 rewrites the e2e README gotcha; if the
chunks are byte-identical, the gotcha text stands (the gradle UP-TO-DATE
deletion may remain) and the record says so.

## Punctuality

No clock change on the 3T (no planned clock work). The punctuality gate rides
the real next prayer: record the armed time from `dumpsys alarm`, wait for the
real fire, capture the notification via `adb shell dumpsys notification --noredact`
and logcat. A miss is a STOP with both captures.

## Records

Every capture lands under `$HOME/athan-gitree/sessions/111/3t/` and the ledger
names each file. No screenshot or recording enters the repository.

## Version and commit

No commit unless a defect is ruled fixable; any fix rides its own branch and
version per the repo rules.

## Review

The reviewer reads the captures against this step's expected outputs, blind to
the executor's prose.

## Done when

R3.1 to R3.4 hold with captures recorded, and the Metro env record is written.

## Restore

The 3T keeps the production install only if the owner's fleet rules allow it
at this moment; otherwise reinstall the previous production APK from the build
directory and note it in the ledger.
