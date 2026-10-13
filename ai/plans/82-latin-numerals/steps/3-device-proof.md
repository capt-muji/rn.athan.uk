# Step 3: the simulator proof — one timer face, two languages

Requirements: R4.1, and device witness for R1.2, R2.2
Weight: 3

## Anchor check

None. This step reads the landed build of steps 1 and 2 and changes no source. Verify
instead that `ai/plans/README.md` shows row 82 `IN PROGRESS, step 3` and that
`git log --oneline -2 uat` names the two landed steps.

## Goal

Read the countdown, the ago badge and a list time on the iOS simulator under en and
then under ar after an in-app language switch, from screenshots, and show the two
reads describe one design: Latin digits, fixed-width sections, gapped dim colons, no
unit letters, Arabic words around unchanged digits.

## Branch

```bash
git checkout -b feat/82-device-proof uat
```


## Build

No clock change, no alarm work, no notification fires; the app fetches London times
over the simulator's network and the countdown runs against the real clock. The
countdown animates, and the device atlas records that interactive snapshots wedge on
animated screens: screenshots are the read, `vision` the reader.

Sequence, in order (the repo's ignored `ios/` folder holds a stale derivation at
2.0.45, so the version commit's bump must flow through a clean prebuild before any
build):

1. Bump this step's version in the working tree first (`app.json`, `package.json`,
   `android/app/build.gradle`, all three matching, `app.json` first), so the prebuild
   and the build carry the step's own version; the commit lands after the proof with
   the same bump.
2. `npx expo prebuild -p ios --clean` with the production env inline, sourced from
   the owner's key staging and never printed or written anywhere:
   `EXPO_PUBLIC_ENV=prod EXPO_PUBLIC_API_KEY="$(cat ~/.config/athan/.api_key)"`
   prefixed to the command. Expected: the prebuild rewrites `ios/` and exits 0.
   Leave `EXPO_PUBLIC_IOS_WIDGETS` unset: this proof reads app surfaces only.
3. Build and run through the iOS build MCP. Call `session_show_defaults` first; when
   project (the freshly prebuilt `ios/` workspace), scheme `Athan` and simulator are
   set, `build_run_sim` immediately with configuration Release (it boots the
   simulator; any booted iPhone serves, placeholder `SIMULATOR_UDID`).
4. Expected: the build exits clean, the app installs and launches, and the home screen
   shows the Standard list with its countdown. Anything else is STOP with the log
   tail.

## Checks

The app id on the simulator is `com.mugtaba.athan`. Drive with `agent-device`:
`open { app: "com.mugtaba.athan", foreground: true }` answers the first snapshot; a
press on a row opens the overlay; the Settings tab opens the settings sheet.

1. **en read.** Screenshot the home screen to
   `$HOME/athan-gitree/sessions/82/step3-en-home.png`. `vision` answers, one question
   per call:
   - "List every text node in the countdown block above the prayer list, top to
     bottom, with the exact characters." Expected: an English prayer name, then digit
     groups and colons only (`HH:MM`, or `HH:MM:SS` when inside the final ten
     minutes), no `h`, `m` or `s` letter anywhere in the timer line.
   - "Does any colon in the timer line have space on both sides, and is it lighter
     than the digits beside it?" Expected: yes to both.
   - "Quote the badge under the prayer list and one row's time." Expected: the
     sentence `Name H:MM ago` shaped badge (or `Name now` inside the first minute)
     and a `HH:MM` Latin row time.
2. **Switch to ar.** Open Settings, tap the Language row, pick `العربية`. The row 68
   relaunch lands (an in-process reload, about 1.5 s of dead window). Wait 15 s, then
   screenshot `$HOME/athan-gitree/sessions/82/step3-ar-home.png`. `vision` answers:
   - "List every text node in the countdown block above the prayer list, with the
     exact characters." Expected: an Arabic prayer name, then the same Latin digit
     groups and gapped colons as the en read, byte-identical in shape and treatment.
   - "Are any digits in the timer, the badge or the list times Eastern Arabic-Indic
     glyphs?" Expected: none.
   - "Quote the badge under the prayer list." Expected: the Arabic sentence words
     around a Latin `H:MM` duration (or the Arabic `now` word inside the first
     minute).
3. **Identity.** Transcribe both timer lines side by side in LOG.md. The digit groups,
   colon nodes and their treatment match; only the prayer name's words differ by
   locale. This is R4.1's evidence.

Save every screenshot under `$HOME/athan-gitree/sessions/82/` only; nothing enters the
repository.

## Break

None. A device step proves; it breaks nothing. When a read mismatches this plan's
expected transcriptions, STOP with the screenshot path and the transcription: the
defect is in the landed steps, never fixed on device.

## Version and commit

Next patch after uat's `package.json`, three files, `app.json` first. The commit
carries this plan folder's `LOG.md` (the transcriptions) and `ai/plans/README.md`
(the step cursor). Message:

```
<VERSION> - docs(82): step 3, the en and ar simulator reads show one timer face
```

## Review checklist

- Both screenshots exist under `sessions/82/` and are named in LOG.md.
- The transcriptions quote exact characters, never paraphrase.
- No repository file beyond the plan files and the queue changed.

## Merge

```bash
git checkout uat && git merge --no-ff feat/82-device-proof -m "<VERSION> - merge feat/82-device-proof: step 3, the simulator proof"
```

## Done when

Checklist ticked, transcriptions in LOG.md, merge landed, then Finishing runs (the
`docs/executed-82-<date>` commit, ticket set EXECUTED, worktrees and branches
removed). Finishing never pushes.
