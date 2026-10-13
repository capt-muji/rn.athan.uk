# Step 4: Device proof on the 3T

Requirements: R7.1, R7.2, R7.3, R7.4
Weight: 3

## Anchor check

Save `scripts/preflight-72.sh` to `$TMPDIR` and run
`bash $TMPDIR/preflight-72.sh display-atom cascade-pair derived-color` with the
repository root as the working directory. These three survive every earlier step's edits
(hero-render and ago-render quoted element blocks step 2 replaces); a count other than 1
is a STOP. This step changes no
repository file; the anchor check still runs, because the proof reads the merged code.

## Goal

The ruled faces are seen on the phone: the Arabic timer in three double-digit groups with
dim colons and a dim 00 hours group, the Arabic timer in two groups with white hours, the
English lettered hero and badge, and the gapped Arabic badge colon.

## Branch

None. The step records evidence; its commit is a docs commit on a
`docs/72-device-proof-<date>` branch merged `--no-ff` into `uat`.

## Build and install

```
zsh build-mock.zsh          # ends BUILD-MOCK OK; the .apk lands outside /tmp and the repo
aapt2 dump badging <apk> | grep "^package"   # prints the fleettest id, else STOP
adb -s 3T_SERIAL install -r <apk>
```

## Checks

Save every reading under `$HOME/athan-gitree/sessions/72/`. A screenshot is read by the
reader itself or `vision`; the transcription is the record, never the file. Read
`e2e/device-atlas-3T.md` before any screenshot and replay mapped coordinates.

1. R7.1: with the language on `ar`, download the mock data and wait inside the final window
   (the mock puts Asr 60 to 119 s after each download, so the hero sits in the
   seconds-showing band). The hero shows three double-digit groups, the hours group dim
   `٠٠`, both colons dim and gapped. Transcribe the exact glyphs.
2. R7.4: moments after Asr fires, the badge under the passed row shows its colon with the
   thin-space gaps. Transcribe the badge line.
3. R7.2: move the clock forward past the final window so the next prayer is more than 599 s
   away. The hero shows two double-digit groups with white hours. Before the change:
   `adb shell dumpsys alarm`, compare the armed list against the app's expected alarms and
   name the unexplained app alarm at `when 2104803640505`; any other unexplained alarm is a
   STOP. Restore automatic time (`settings put global auto_time 1`) afterwards.
4. R7.3: switch the language to `en` (Settings). The ar-to-en switch is an RTL crossing and
   relaunches the app (row 68): wait until the launch line re-appears in logcat, about
   1.5 s per row 71's measurement, and treat 10 s without it as a STOP. The hero shows
   `Xh Ym` letters and the badge shows `Xm ago`. Then read
   `adb shell dumpsys notification` and name the reminder channel
   `... in 5m Reminder` where a reminder channel exists; its absence is recorded, not
   treated as failure.

No clock change runs in checks 1, 2 or 4. Every clock change repeats the dump-compare-
restore cycle of check 3. Never leave automatic time off.

## Green run

`git status --porcelain` lists no repository file; the evidence lives outside the repo and
the transcriptions in `LOG.md`.

## Version and commit

Branch `docs/72-device-proof-<date>` off `uat`. Version command: the next patch after
`uat`'s `package.json` under the version lock; set it in `app.json`, `package.json` and
`android/app/build.gradle` (`versionName`). Add `ai/plans/README.md` (status
`EXECUTED`) and this folder's `LOG.md`. Message:

```
<VERSION> - docs(plans): ticket 72 executed: the ruled faces proven on the 3T
```

Merge `--no-ff` into `uat` with `<VERSION> - merge docs/72-device-proof: ticket 72
executed, device evidence recorded`.

## Done when

The four transcriptions sit in `LOG.md` under `### Step 4 — done`, with the commit sha, the
build's last line, and the `session:` line; the phone is left on the mock build with
automatic time on.
