# Step 15: the Android 15+ tall-font proof

**Requirements:** R11.3
Weight: 3 (device; dispatches alone)

## Goal

An Android 15+ fleet phone draws the tall font variants of Arabic, Devanagari and Thai
without clipping on the list, the sheets and the widgets (FONT-6: target SDK 36 draws
variants the 3T never draws).

## Branch

`docs/device-39-a15` off `uat`.

## Device

The Android 15+ fleet phone (`S23_SERIAL`; if absent from the fleet, STOP and report —
the check does not substitute the 3T).

## Build and install

`zsh $HOME/athan-gitree/bin/build-prod.zsh` (the same production vehicle; never two
builds at once). Install on the phone. The owner's fleet rules apply: install over, no
`pm clear`.

## Checks, transcribed, under `$HOME/athan-gitree/sessions/39/`

1. **Arabic.** Switch the app language to العربية: the prayer names, the sheets, the
   help modal and the What's New text render the tall Arabic variants fully inside their
   rows and cards (the 57px row's name line shows one unclipped line; the 1.70em span
   clears).
2. **Devanagari.** हिन्दी: the छोटी मात्राएँ (subjoined matras) draw without overlap on
   the names column and the countdown; the width column reflows wide and the time column
   stays aligned.
3. **Thai.** ไทย: the tone marks and the tall vowels draw inside the row height; the
   widest Thai name (ช่วงสุดท้ายของคืน) fits after the one reflow, `--` never appears in
   place of a name.
4. **Widgets.** Place the home widget under Thai and Arabic: names and `dateParts`
   weekdays draw unclipped at both sizes.
5. Any clipped or truncated label is a STOP with the transcription (the per-locale
   line-height constants are post-2.0.0 work per R17; the finding goes to the owner, not
   into a pixel change).

## Records

`LOG.md` under `## Step 15`: each script's rendering verdict.

## Version and commit

`<VERSION> - docs(plans): job 39 step 15, Android 15+ tall-font proof recorded`.

## Merge

`git checkout uat && git merge --no-ff docs/device-39-a15 -m "Merge docs/device-39-a15 into uat: job 39 step 15"`.

## Done when

All five checks recorded; the row reads `IN PROGRESS, step 15`.
