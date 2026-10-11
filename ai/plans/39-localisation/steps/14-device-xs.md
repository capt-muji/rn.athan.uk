# Step 14: the iPhone XS Arabic-locale proof

**Requirements:** R11.2, R7.3, R8.1
Weight: 3 (device; dispatches alone)

## Goal

On an Arabic device locale, the XS pins LTR on the first frame (no mirror), the widgets
draw Arabic with left-anchored layout, and the permission prompt reads Arabic (RTL-4,
RTL-13, C5/C7).

## Branch

`docs/device-39-xs` off `uat`.

## Setup

The owner sets the XS device language to العربية (or the executor does with the owner's
phone in hand per D38's preference for XS testing; the Settings change is the owner's
call if she prefers). Build via the iOS path the repo's scripts carry (xcodebuildmcp
drives the simulator builds; the XS device build follows the build-prod iOS flow if
present, else TestFlight-free local install). Record the build vehicle in `LOG.md`.

## Checks, each transcribed (never screenshots committed; transcribe what was read)

1. **First frame LTR.** Cold launch with the Arabic locale: the prayer names column sits
   LEFT, the time column centre, the alert icons right — exactly the English geometry.
   Any mirror is a STOP (the RTL pin failed natively; no JS patch, per R10).
2. **First-run language.** The app renders Arabic with NO in-app choice made
   (`preference_language` absent on a fresh install): rows الفجر, الشروق, الظهر,dates
   `الأحد, 11 أكتوبر 2026` shaped.
3. **Permission prompt.** Trigger the location prompt (qibla first open): the purpose
   string reads the Arabic `NSLocationWhenInUseUsageDescription` from
   `catalogs/native-strings.json`. English text is a STOP (the expo.locales wiring
   failed).
4. **Widgets.** Place the home widget and one lock layout: the neutral card (before
   first app open) reads the Arabic row of `catalogs/widget-statics.json`; after the app
   opens and arms, the live card draws Arabic names and `dateParts` weekdays,
   left-anchored, Latin digits. The gallery list shows the Arabic displayNames.
5. **Script sweep.** Switch the XS language through हिन्दी and ไทย (owner permitting):
   Devanagari and Thai render on the list and sheets without clipping on the XS's iOS
   version; the countdown name draws in the row's face (FONT-15 observed, recorded, no
   code change in this job).

## Records

`LOG.md` under `## Step 14`: each check, what was read, pass or STOP. Evidence
(transcriptions) under `$HOME/athan-gitree/sessions/39/`.

## Version and commit

`<VERSION> - docs(plans): job 39 step 14, XS Arabic-locale proof recorded`.

## Merge

`git checkout uat && git merge --no-ff docs/device-39-xs -m "Merge docs/device-39-xs into uat: job 39 step 14"`.

## Done when

All checks recorded; the row reads `IN PROGRESS, step 14`.
