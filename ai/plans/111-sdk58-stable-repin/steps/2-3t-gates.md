# Step 2: the 3T release build and the alarm gates

Requirements: R3.1, R3.2, R3.3, R3.4, R3.5, R3.6
Weight: 3

## Anchor check

None: the anchors verified at pre-flight and step 1 consumed them (they assert the pre-re-pin
pins, the patch files it regenerates and the notifications option block).

## Goal

A production build of the re-pin commit on the OnePlus 3T, proving `:expo-widgets:compileReleaseKotlin`
now compiles, R8 still holds, the alarm-clock arms read their 3T form, the device checks pass, the
widget runtime loads, and the Metro env behaviour is re-verified against the e2e README's gotcha
(D111.11).

## Branch

No code branch. This step proves the merged uat; a defect it finds opens a STOP with the output,
not an improvised fix.

## Keep the main tree current first

`build-prod.zsh` links the build worktree's `node_modules` to the main checkout's and refuses a
`yarn.lock` that differs from it, so the main tree is the thing that must carry the new packages.
From the main tree, under `commit.lock`:

```bash
cd $HOME/repos/rn.athan.uk && git fetch -q origin uat && git checkout uat && git merge --ff-only origin/uat
yarn install --ignore-engines --force 2>&1 | sed -n '/patch-package/,/^Done/p'
node -e "console.log(require('expo/package.json').version, require('expo-widgets/package.json').version)"
```

Expected: three `✔` lines with no `**ERROR**` and no version-mismatch warning, and the node
line printing `58.0.13 58.0.20`. A stale install here builds the old packages while reporting
success.

## Build

The recipe lives outside the repository, at `$HOME/athan-gitree/BUILD.md`; the script carries the
prebuild order itself (it runs `npx expo prebuild -p android --no-install --clean`, so no separate
prebuild call exists here):

```bash
zsh $HOME/athan-gitree/bin/build-prod.zsh uat $HOME/athan-gitree/sessions/111/3t/athan-uat-prod.apk
```

Expected: the script ends `BUILD-PROD OK` (R3.1) and its identity line prints
`EXPO_PUBLIC_ENV=prod, real API key present in the bundle (not printed)`. The prebuild order runs
`app.json` first; `expo run:*` never re-syncs an existing native folder. Never run two build
scripts at once.

The build is the proof that closed the first attempt's failure: at `expo-widgets 58.0.19` the
task failed with 16 `Unresolved reference` errors on `io.github.jakex7.peek.*`. That log is at
`$HOME/athan-gitree/sessions/111/3t/logs/athan-uat-prod.gradle.log`; the refresh keeps it as the
before-picture. A repeat at 58.0.20 is the section 2.2 STOP.

If `checkReleaseAarMetadata` names compileSdk in `modules/qiblaheading`, `modules/tls13` or
`modules/widgetrefresh`: the section 2.2 STOP.

## Install and checks

```bash
adb -s 3T_SERIAL install -r <out.apk>
adb -s 3T_SERIAL shell am start -W com.mugtaba.athan/.MainActivity
yarn check:device 3T_SERIAL
adb -s 3T_SERIAL shell dumpsys alarm | grep -A6 "com.mugtaba.athan" | head -40
```

Expected:

- `yarn check:device` passes every check it runs on its own: the build identity, the channels and
  their sounds, the permissions, at least one future prayer alert armed, and the known unexplained
  app alarm at `when 2104803640505` named rather than counted (R3.2). The script judges a trigger
  against prayer times only when `expected-times.json` arrives as its third argument, and this
  repository builds no generator for that file, so R3.2 claims only what the bare command proves;
  the armed times themselves go into the ledger.
- If the executor builds `$HOME/athan-gitree/sessions/111/3t/expected-times.json` from the
  timetable the app itself fetched, run `yarn check:device 3T_SERIAL com.mugtaba.athan
  $HOME/athan-gitree/sessions/111/3t/expected-times.json` and record it beside the bare run. No
  criterion depends on that second run.
- One armed athan reads `window=0 flags=0x3` with an `Alarm clock:` sub-block (R3.3, A3: the 3T
  form; `flags=0x9` is the windowed form other phones show).
- Alarm times are production-real: the production API fetch completes first (local builds' mock
  times sit either side of launch; the check script's README section binds). Wait for the fetch,
  rerun the check, record the second output.
- `auto_time` reads 1 before and after the step; no clock change is planned on this phone.

## Widget runtime load

```bash
adb -s 3T_SERIAL logcat -d -s ReactNativeJS | tail -30
```

Expected: the loaded-bundle suite passes (R3.4). The device half is an observation, not a
criterion: place a widget from the picker if the launcher lost it, read the home screen and
transcribe what it renders. The app's own `WIDGET:` lines are Pino lines and a prod build disables
Pino (`shared/logger.ts`), so no logcat line proves a widget loaded; read the atlas
(`e2e/device-atlas-oneplus3t.md`) before any screenshot.

## Metro env re-verify (D111.11)

The env bytes live in the JS chunk; `assets/app.config` regenerating proves nothing (the e2e
README's own words). Compare the chunks themselves, in two named throwaway directories:

```bash
export EXPO_PUBLIC_ENV=prod
npx expo export --platform android --output-dir "$TMPDIR/111-export-prod" 2>&1 | tail -2
export EXPO_PUBLIC_ENV=mock
npx expo export --platform android --output-dir "$TMPDIR/111-export-mock" 2>&1 | tail -2
md5 -q "$TMPDIR"/111-export-prod/_expo/static/js/android/*.js | head -3
md5 -q "$TMPDIR"/111-export-mock/_expo/static/js/android/*.js | head -3
grep -rl "mock" "$TMPDIR"/111-export-mock/_expo/static/js/android/*.js | head -2
```

Expected: the two entry-chunk md5 lines are printed, and the mock chunk greps its mock marker.
Differing md5 sums mean the changed `EXPO_PUBLIC_*` invalidated the transform cache instead of
shipping stale bytes; identical sums mean the gotcha still stands (the gradle UP-TO-DATE deletion
remains). Both outcomes satisfy R3.5, which asks for the two lines and the recorded verdict:
`LOG.md` records whether they differed, and step 4 rewrites the e2e README gotcha only when they
did.

## Punctuality

No clock change on the 3T (no planned clock work). The punctuality gate rides the real next
prayer: record the armed time from `dumpsys alarm`, wait for the real fire, capture the
notification via `adb shell dumpsys notification --noredact` and logcat. A miss is a STOP with
both captures.

## Records

Every capture lands under `$HOME/athan-gitree/sessions/111/3t/` and the ledger names each file. No
screenshot or recording enters the repository.

## Version and commit

No commit unless a defect is ruled fixable; any fix rides its own branch and version per the repo
rules.

## Review

The reviewer reads the captures against this step's expected outputs, blind to the executor's
prose.

## Done when

R3.1 to R3.5 hold with captures recorded, and the Metro env record is written.

## Restore

The 3T keeps the production install (this is the fleet phone the release build exists for); note
the install and its version in the ledger for the owner.
