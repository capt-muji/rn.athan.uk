# Execution log: Session 48

## The plan's two steps were ONE commit, and the plan was wrong to split them

Step 1 ran clean to green (preflight OK, red as predicted — `Cannot find module '../qiblaSettle'` — then 16/16,
tsc 0, Biome 0, breaks `ALL AS EXPECTED: 1` at 10 of 10). Then the pre-commit hook refused:

```
FAIL unit shared/__tests__/unusedExports.test.ts
+   "hasSettled",
+   "trailingWindow",
```

`unusedExports.test.ts` fails the moment a module exports a symbol no production file imports. Measured both
ways: **7** unreachable exports after step 1 alone, the pre-existing **5** once step 2 lands. No smaller cut
leaves `uat-2` green; the steps merged into one commit. A defect in the plan, not the execution — the third
session running to meet it (44 and 45 both measured the same). Nothing was committed by the refused attempt.

## Step commit `1c947980` (1.29.201), on `feat/48-1-settle-arithmetic`

Files: `shared/qiblaSettle.ts`, `shared/__tests__/qiblaSettle.test.ts`, `hooks/useQibla.ts`,
`components/sheets/screens/__tests__/Qibla.test.tsx`. Gate suite 32/32, sheet suite 50/50, tsc 0, Biome 0,
`grep -c heldRef hooks/useQibla.ts` = 0, no new unused exports. Breaks: the arithmetic script `caught 10 of
10`, the hook script `caught 6 of 6`, both `ALL AS EXPECTED: 1`. Hook's last `Tests:` line: 4949 passed across
184 suites; coverage 100% on all four measures (4737/2077/983/4250). Review clean on the first read, one
round, checking against `git show 1c947980`: `processReading` in the planned order with **the gate above the
haptic** (a refused reading fires nothing — the accessibility requirement), `samplesRef` cleared in `stop` and
the `NO_HEADING` branch, `heldRef` gone, `trailingWindow` called once per reading, all four carried files
byte-identical to the proven copies, no `Platform` check, and no change to `qiblaAlignment`/`qiblaGeometry`/
`qiblaCompass`/`device/qibla.ts`/`Qibla.tsx`. Merged as `bce99f94`; docs commit `e2de7ba5` (1.29.202), merged
`fc261f38`.

It does not fix the residual error from iron indoors (measured unfixable by any gate reading the stream), and
it does not touch the heading SOURCE — row 49 carries that.

## The owner's device verdict on 1.29.203, and the two defects it found

🐋  "once the compass has actually loaded, it is extremely unresponsive... I have shaken the phone a thousand
times and it doesn't move. And it just loves to move by itself."

**Defect 1, MINE — the gate was re-tested on every reading.** A turning phone is a moving window, so drift
stayed over threshold and updates were DROPPED: the compass advanced only while held still, the inverse of a
compass. Fixed in **1.29.204** by latching: the gate decides once and resets only through `blank()` when the
heading is genuinely lost. The suite could not see it — its only turning assertion was `toBeOnTheScreen`,
which a frozen dial passes; the new tests re-render to publish the live shared value, then assert rotation.

**Defect 2, UPSTREAM — the stream was never fast enough for the latch to matter.** Measured on the 3T with
`dumpsys sensorservice`: hardware ceiling 19.2 ms (52 Hz, magnetometer-bound); what `expo-location` requested
**199.95 ms = 5.00 Hz**; the owner's bar 100 ms. **10.4x of headroom discarded**, while Reanimated in the same
process already pulled `rotation_vector` at 16 ms. The 2-degree emission gate is worse: a user creeping the
last degrees at 2 degrees a second is served **0.83 Hz**, a stationary phone nothing — "it doesn't move, then
it moves by itself" — and it floored the heading's resolution at 2 degrees.

`patches/expo-location+58.0.9.patch` now carries: Android `SENSOR_DELAY_NORMAL`→`_GAME` on both
registrations; Android 2-degree `DEGREE_DELTA` gate removed (50ms rate limit kept); iOS
`headingFilter = kCLHeadingFilterNone` (its 1-degree default rejected **731 of 731** readings of a stationary
phone). Removing the 2-degree constant also removes a magic number of the kind the owner bans.

**Proven on the device, not inferred:** the patched module is compiled from source (the patch removes the
`publication` block that would otherwise resolve a prebuilt AAR), the APK bytecode shows
`const/4 v5, #int 1` (`SENSOR_DELAY_GAME`) on both registrations, and the live qibla sheet on 1.29.205 reads
`selected = 20.00 ms` on both sensors — **50 Hz, up from 5 Hz, a tenfold improvement measured on the floor
device**, confirmed in raw event timestamps 20 ms apart. Trap recorded: `dumpsys sensorservice` lists
historical registrations by pid, so read the rate from the live `active-count` block, not a stale first line.

**The calibration hint, shipped 1.29.205 on his request:** 🐋  "At least put a message there to tell
the user to shake the phone... put like a figure-8 motion for them to shake the phone with a path,
like an 8 figure." — the waiting state reads "Wave the phone in a figure eight to calibrate the compass" over a looping figure of eight.

Phones: 3T and XS both on 1.29.205 production. Still open and NOT claimed fixed: the residual from iron in
the house; row 49 carries the native module.

## The owner accepted it; the hint was rebuilt on his judgement (1.29.207)

🐋  "This works absolutely perfectly. I love it. It's amazing... It's so clear, it's so smooth... both phones
are pointing in the perfect direction."

The hint's travelling dot became a **phone** on his request: 🐋  "I do like the animation that you put
on the screen with the figure 8, but can you actually improve it, because it looks really out of shape
and a bit boring. Does it suit the theme of the app? It doesn't. Can we make the dot look like a phone?
It doesn't show the user to actually do anything." A dot teaches a SHAPE; the instruction is to move a PHONE.
The phone rolls into each turn taken from the curve's own tangent — a phone held rigid through a figure of
eight calibrates nothing; the lean teaches the wrist roll that does. Path dashed and fainter, pass slowed
2400→3200 ms. 21 geometry tests, up from 14; an unused `toDegrees` was deleted on `unusedExports.test.ts`'s
catch — the third time that guard earned its place this session.

**Row 50 queued from his question:** 🐋  "which one was the issue? That's the real question." Four changes
landed together, never tested apart — hypothesis and experiments in `WHAT-FIXED-IT.md`; row 50's VERDICT
resolved it. Three questions answered there: 52 Hz is worse (the magnetometer's own ceiling, drops samples
for no gain); no custom module (three edits to `expo-location`'s source in an existing patch); `GAME` kept
over `UI` (5x his 10 Hz bar vs little margin; `UI` is the one-word fallback if battery ever complains).
