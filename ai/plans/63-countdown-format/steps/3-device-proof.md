# Step 3: Device proof on the 3T

Requirements: R1.2, R1.3, R1.4, R2.1, R3.2
Weight: 3 (device; dispatches alone)

## Anchor check

None new: this step changes no repository file. The pre-flight from step 1
still holds.

## Goal

The phone itself shows the colon formats: the hero countdown inside the
seconds-showing window, the ago badge, and a reminder channel label.

## Build

The mock build, with the repository's own mocks fixture (its Asr re-seed lands
60 to 119 s after each download):

```
zsh $HOME/athan-gitree/bin/build-mock.zsh uat $HOME/repos/rn.athan.uk/mocks/simple.ts $HOME/athan-gitree/builds/63-step3-mock.apk
```

Expected: the output ends `BUILD-MOCK OK`. Before install, verify the package:

```
aapt2 dump badging <apk> | grep "^package"
```

Expected: `package: name='com.mugtaba.athan'` (BUILD.md: the mock build always
carries the production id, because `build-mock.zsh` unsets the suffix). Stop if
it is not. Install on `3T_SERIAL`.

## Checks

1. Launch the app, wait for the mock download. The mock puts Asr 60 to 119 s
   after each download, so the hero lands inside the seconds band. Read the
   hero countdown via screenshot: it renders `0:0X`, digits only, no `s`.
   Under an `ar` locale switch in Settings, re-read: `٠:٠X`.
2. After Asr passes, the ago badge under the Asr row reads the `now` word,
   then `0:0X` inside the `time.ago` template. Screenshot both moments.
3. `adb -s $3T_SERIAL shell dumpsys notification | grep -A2 "in 5 Reminder"`:
   where a 5-minute reminder channel exists, its label shows no unit token.
   Absence of a reminder channel is recorded, not treated as failure.

Save transcriptions and screenshots under
`$HOME/athan-gitree/sessions/63/`. Never commit a screenshot to the
repository; transcribe what was read into `LOG.md`.

No clock change runs in this step. If a later repair needs one: read
`dumpsys alarm` first; a forward jump fires every armed alarm it passes, and
the expected-alarm list must name the unexplained app alarm at
`when 2104803640505`.

## Version and commit

No app code changes. If `LOG.md` or queue files moved, commit them with the
next patch version and message `<VERSION> - docs(plans): ticket 63 step 3
device evidence recorded`. If nothing moved, no commit.

## Merge

None beyond the docs commit, if any.

## Done when

The three checks are transcribed in `LOG.md` with the evidence paths, the
ticket is set EXECUTED per the executor's Finishing, and the phone is left on
the build this step names.
