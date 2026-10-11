# Step 13: the 3T production proof

**Requirements:** R11.1, R4.3, R9.1
Weight: 3 (device; dispatches alone)

## Goal

The production build on the 3T proves the frozen identifiers survive a language switch,
channels rename in place under their frozen ids with catalog names, notifications carry
Arabic titles, and the six-catalog require stays under the D36 5 ms rule.

## Branch

`docs/device-39-3t` off `uat`.

## Pre-flight on the device

1. Read the device atlas `e2e/device-atlas-<model>.md` first; replay mapped coordinates only.
2. `adb -s $3T_SERIAL shell dumpsys alarm | grep -A 2 com.mugtaba.athan` — save to `$HOME/athan-gitree/sessions/39/alarms-before.txt`. This is the identifier baseline. No clock changes in this step, so no alarm-fire risk from the dump itself.

## Build and install

`zsh $HOME/athan-gitree/bin/build-prod.zsh` (never two builds at once; success ends `BUILD-PROD OK`). Install the produced apk on the 3T. The owner's bells are armed (D38): install over, never `pm clear`, never uninstall.

## Checks, each saved under `$HOME/athan-gitree/sessions/39/`

1. **Identifiers frozen.** After install and first launch, `dumpsys alarm` again (`alarms-after-en.txt`): the com.mugtaba.athan identifiers equal the baseline byte for byte (compare the identifier columns only; `when` values move with time).
2. **Channel rename.** `adb -s $3T_SERIAL shell dumpsys notification | grep -A 3 'NotificationChannel'` before the switch (`channels-before.txt`): names are English. Switch to العربية through the flow's taps. Dump again (`channels-after-ar.txt`): the SAME channel ids (`athan_1_v4` shape, `extras_at_time_v3`, the `reminder_*_v3` family) now carry the Arabic names from the ar catalog (`أذان 1` shape, `تنبيه ... بعد ... د`). If any id changed or any name stayed English under an armed channel, STOP (the plan's section 10 fallback row).
3. **Arabic re-arm.** `dumpsys alarm` after the switch (`alarms-after-ar.txt`): identifiers still equal the baseline (a re-arm replaces in place; never fewer alarms).
4. **Arabic notification copy.** Drive the clock is NOT needed: the mock vehicle's Asr-after-download property is unavailable on the production build; instead read the armed request titles from `dumpsys notification --noredact | grep -B 2 -A 8 com.mugtaba.athan` (or `dumpsys alarm`'s operation extras where titles surface) and record that an armed athan's title reads `{name} الآن` shaped Arabic. If the dump does not surface titles on this Android version, record that limitation and rely on check 5.
5. **Live fire (one).** With the owner's bells armed, wait for the next natural athan (never move the clock on the owner's phone without the alarm dump and the owner's rules; if the wait exceeds the session, mark this check deferred to the owner's daily use and record it as such).
6. **Require timing (D36 re-run).** Build the e2e monitor release build (`EXPO_PUBLIC_PERF_MONITOR=1`, `e2e/README.md`), install, launch cold, and read the `catalog_require_start`/`catalog_require_end` epochs from the buffered detail log. The pair brackets the six-catalog require (all six are in the MODULES map; Hermes evaluates them at loader eval). Above 5 ms of JS-thread time: the loader switches to `JSON.parse` of embedded JSON constants per the D36 rule — that change is a NEW step 13b branch, one commit, same tests re-run; at or under, record and stop.

## Records

`LOG.md` under `## Step 13`: each check's file, the compared bytes, the timing number, and the decision rule outcome. The queue row moves to `IN PROGRESS, step 13`.

## Version and commit

`<VERSION> - docs(plans): job 39 step 13, 3T production proof recorded`. Add the session evidence by path reference only (never commit device output into the repo).

## Merge

`git checkout uat && git merge --no-ff docs/device-39-3t -m "Merge docs/device-39-3t into uat: job 39 step 13"`.

## Done when

Every check's evidence file exists, the identifiers compare clean, and the timing decision is recorded.
