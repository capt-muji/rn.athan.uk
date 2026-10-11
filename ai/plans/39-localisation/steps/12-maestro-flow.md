# Step 12: the Maestro language-switch flow

**Requirements:** R12.1
Weight: 2
**Anchors:** `flows-sheets-head` (the house shape: appId, launch, assertions).

## Goal

One flow proves the switch end to end on the 3T: open Settings, open the language sheet,
pick العربية, wait out the progress row, see the Arabic list, switch back to English.

## Branch

`feat/39-12-flow` off `uat`.

## Files

- `e2e/flows/language-switch-x1.yaml` (new), `e2e/README.md` (the flow list row)

## Red test

The flow does not exist. Writing it is the step; "red" here is the run against the
pre-step build: `maestro test e2e/flows/language-switch-x1.yaml` fails at the first
Arabic assertion because the sheet does not exist yet on the base build - record the
first failing tap or assertion. Then land step 05's already-merged UI (the branch carries
no app code) and the flow passes.

## Change contracts

1. `language-switch-x1.yaml`, following the house shape of `sheets-x10.yaml` (appId, `launchApp`, taps by id or label, `assertVisible`):
   - launch, open Settings (the atlas carries the coordinates), tap the Language row, assert the sheet title `Language`,
   - assert the six native names are visible,
   - tap `العربية`, assert the progress line disappears (extended wait, up to 60 s, polling every 5 s),
   - assert a prayer row label `الفجر` is visible,
   - tap the Language row again, tap `English`, assert `Fajr` visible again.
2. `e2e/README.md` gains the flow in its list with a one-line description. No other flow changes (the six English flows assert English on an English device and stay).

## Green run

Before any install over the owner's armed bells: `adb -s $3T_SERIAL shell dumpsys alarm | grep -A 2 com.mugtaba.athan > $HOME/athan-gitree/sessions/39/alarms-step12-baseline.txt`. Then build and install the current uat build, and `export PATH="$HOME/.maestro/bin:$PATH" && maestro test e2e/flows/language-switch-x1.yaml` passes on the 3T (the atlas rules apply; no clock changes; no force-stop outside flows). After the run, the alarm dump's identifiers equal the baseline byte for byte.

## Break script

Not applicable to a flow-only step per the plan template; the green run above is the check. Record the flow's pass line in `LOG.md`.

## Version and commit

Message: `<VERSION> - test(e2e): language-switch flow proving the Arabic round trip`.

## Review checklist

- The flow uses ids/labels from the atlas, never invented coordinates.
- The 60 s progress wait polls; it never sleeps once for 60 s.

## Merge

`git checkout uat && git merge --no-ff feat/39-12-flow -m "Merge feat/39-12-flow into uat: job 39 step 12"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 12`.
