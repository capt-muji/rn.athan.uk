# Step 4: The 3T device proof

Requirements: R1.2, R2.1, R3.1, R3.2, R3.3, R4.1
Weight: 3 (device: always dispatches alone)

## Anchor check

None beyond the pre-flight: this step reads the landed steps 1 to 3 and
touches no source file.

## Goal

The flip proven on a phone: the boundary crossing relaunches into a mirrored
shell, the four mirrors render as specified, LTR restores, and the widget
mirrors under an ar stamp.

## Preconditions

- Steps 1 to 3 merged on `uat`.
- The 3T connected (`3T_SERIAL`), the device atlas `e2e/device-atlas-oneplus3t.md`
  read first, and `adb` available.
- `build-mock.zsh` free to run (no other build running; the version lock
  taken by the code steps released).

## Build

`zsh $HOME/athan-gitree/bin/build-mock.zsh uat mocks/simple.ts <out.apk>` per
`$HOME/athan-gitree/BUILD.md` (the script takes the ref, the mocks file and
the output path; it unsets `EXPO_ANDROID_SUFFIX`, so the package stays
production's). It bumps nothing
(the code steps took the versions); it prebuilds from the flipped
`app.json` (the native RTL config regenerates there) and ends
`BUILD-MOCK OK` with the apk outside `/tmp` and the repo. Before install:
`aapt2 dump badging <apk> | grep "^package"` must print
`package: com.mugtaba.athan` (BUILD.md:26, the mock build's documented
package); stop if it does not.

## Proof

1. Install, launch, confirm the en shell is unchanged (one screenshot of the
   list, compared against the atlas).
2. Settings, Language, pick Arabic: the progress face runs, the app
   relaunches (verify in logcat: the process restarts and the launch line
   re-appears), and the shell renders mirrored.
3. Screenshots, read per the atlas coordinates: the prayer list (rows
   mirror: names on the right), the countdown card (the bar fills from the
   right, the tip at the mirrored progress), a sheet holding a SegmentedControl
   (the pill sits on the visually correct segment) and a toggle (the thumb
   travels left when on), and the Extras explanation box (its catchers still
   close the sheet from the same window regions).
4. The launcher home widget, mandatory: one screenshot under ar beside the en
   reference. The stamp is data only (P16: the runtime renders no Host), so
   the card renders exactly as it does today and the screenshot records that
   the unstamped rendering survives the flip; a mirrored card here would mean
   an unplanned consumer, a STOP.
5. Switch back to English: the relaunch fires again and the LTR shell
   restores byte-for-byte against step 1's screenshot.

Every records claim pairs its screenshot read with a logcat line or a dump
(`uiautomator dump` fails silently while the countdown animates: pause on a
static screen first). Transcribe what was read into `LOG.md`; never commit a
screenshot or recording. Evidence copies to `$HOME/athan-gitree/sessions/68/`.

## Break

No break script: the device step's break is the restore check in item 5
failing (the LTR shell differing from step 1's reference is a STOP with both
screenshots transcribed).

## Version and commit

No code changes and no version bump: this step lands as the queue row's
EXECUTED note plus the `LOG.md` evidence entry (docs-only commit carrying
`ai/plans/README.md` and the plan's `PLAN.md` and `LOG.md`; the version
moves only if the hook demands a bump, in which case the next patch under
the lock).

## Review checklist

- The relaunch fired exactly once per crossing (logcat).
- Each mirror site's ar screenshot read recorded.
- The LTR restore matches the step-1 reference.
- No screenshot or recording entered the repository.

## Merge

The docs commit merges `--no-ff` into `uat` with
`<VERSION> - merge docs/68-device-proof: step 4, the 3T proof`.

## Done when

Checklist ticked, `LOG.md` carries the evidence entry with the `session:`
line, the queue row reads EXECUTED.
