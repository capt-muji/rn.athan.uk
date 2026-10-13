# Step 2: the iOS dev build on the owner's phone

Requirements: R4.1
Weight: 3 (device step: it installs on the owner's iPhone; it never drives the
device, and the owner does all testing, by her instruction of 2026-10-13)

## Anchor check

Run `bash ai/plans/79-countdown-dim-noshift/scripts/preflight-79-step2.sh` from
the repository root (a saved copy in `$TMPDIR` runs the same), after step 1 is
merged. It checks the `uat` checkout, the clean tree, `origin/uat` merged in,
the version at or above 2.0.232, rows 72 and 74 DONE, and the three anchors
step 1 does not consume (`countdown-colon-render`, `time-splitcolonsections`,
`constants-colors-text`) each counting 1. It must end `PREFLIGHT OK`.

## Goal

The Debug dev-client build carrying step 1's uat is installed on the connected
iPhone XS, Metro is left serving for the owner's own testing, and the handover
is recorded. No agent interacts with the app on the phone: no taps, no
screenshots, no logcat reads of the running app. The owner tests.

## Branch

```
git checkout -b docs/79-dev-delivery uat
```

## Files

- `ai/plans/README.md` (ticket 79 reads `IN PROGRESS, step 2`)
- This plan folder's `LOG.md`
- Version files: `app.json`, `package.json`, `android/app/build.gradle`

No source file changes in this step.

## Commands, in order

Run items 1 to 7 in one shell, so `$UDID` and `$TEAM_ID` persist to item 5.

1. Resolve the connected iPhone XS at run time. Never write its identifier into
   any committed file; `$TMPDIR` logs and the evidence folder may hold it:

```
UDID=$(xcrun devicectl list devices | grep connected | grep 'iPhone XS' | grep -oE '[0-9A-F]{8}-[0-9A-F]{16}' | head -1)
echo "device resolved: ${UDID:+yes}"
```

   An empty `UDID` prints `device resolved: ` and the step returns `BLOCKED: the
   iPhone XS is not connected`.

2. Resolve the signing team from the keychain the same way, because no Xcode
   account session and no project file carries it (the iPhone XS atlas pins
   `DEVELOPMENT_TEAM` as part of the working invocation):

```
TEAM_ID=$(security find-identity -v -p codesigning | grep -m1 -oE '\(([A-Z0-9]{10})\)' | tr -d '()')
echo "team resolved: ${TEAM_ID:+yes}"
```

   An empty `TEAM_ID` prints `team resolved: ` and the step is a `STOP:` quoting
   `security find-identity -v -p codesigning` output with identities redacted.

3. Confirm no build or Metro is already running (two builds at once are banned):

```
pgrep -fl 'expo start|expo run|xcodebuild' || echo "no build running"
```

   Any live match is a `STOP:` with the matched lines.

4. Save the state the step changes: none. This step touches no Android device,
   changes no clock, and edits no source file.

5. Start the dev build detached. `expo run:ios` compiles the committed `ios/`
   workspace in Debug, installs on the device and opens the app once (its own
   final action, not agent testing), then keeps Metro serving:

```
mkdir -p $HOME/athan-gitree/sessions/79
DEVELOPMENT_TEAM="$TEAM_ID" nohup npx expo run:ios --device "$UDID" > $HOME/athan-gitree/sessions/79/devbuild.log 2>&1 &
echo "metro pid $!" | tee $TMPDIR/79-devbuild.pid
```

6. Poll the log in a background loop of `sleep 15` or shorter, for at most 30
   minutes. Success is both markers present:

```
grep -q 'BUILD SUCCEEDED' $HOME/athan-gitree/sessions/79/devbuild.log
grep -qE 'Installing|Launching' $HOME/athan-gitree/sessions/79/devbuild.log
```

   Expected output when both fire: the two greps exit 0 and the loop prints
   `dev build installed`. A signing failure, a scheme error or 30 minutes
   without `BUILD SUCCEEDED` is a `STOP:` quoting the log's last 10 lines.

7. Verify Metro is alive and leave it running:

```
kill -0 "$(cut -d' ' -f3 $TMPDIR/79-devbuild.pid)" && echo "metro alive"
```

   If Metro died after the install, restart only Metro detached:
   `nohup npx expo start > $HOME/athan-gitree/sessions/79/metro.log 2>&1 &`.

## Version and commit

The version command (same as step 1) prints `2.0.232`, so the step version is
`2.0.233`. Set it in `app.json` (first), `package.json` and
`android/app/build.gradle`, all three matching. No prebuild and no native
change: the dev build's bundle version label may lag one patch behind the
repository version, which is cosmetic on a dev build and recorded in `LOG.md`
(D79.6).

Commit, adding by name: `ai/plans/README.md`, this plan folder's `PLAN.md` and
`LOG.md`, `app.json`, `package.json`. Message:

```
2.0.233 - docs(79): the dev build installed for the owner's own iOS read
```

## Review checklist

- No source file changed.
- No device identifier, screenshot or recording in any committed file.
- The evidence log lives under `$HOME/athan-gitree/sessions/79/`.
- The LOG entry transcribes the build markers, names the log path, and states
  that Metro was left running.

## Merge

```
git checkout uat && git merge --no-ff docs/79-dev-delivery -m "2.0.233 - merge docs/79-dev-delivery: step 2, ticket 79"
```

## Done when

The build markers are in the evidence log, Metro is alive, the LOG entry and
queue cell are written, the merge is on uat, and the tree is clean. The step
ends with the handover; the owner's read of the dev build is the acceptance bar
and arrives on her schedule.