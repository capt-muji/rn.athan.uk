# The 10 degree test: the owner's own desk, one install, a predicted number

The highest-value measurement left in row 41, and it needs no new code. Designed 2026-09-30, from the
finding in `P5` sections 6 and 7 that the owner's phone runs a different constant from the repository.

## Why this test exists

`P2`'s whole design rests on one unproven claim: **that the magnetic error at a fixed spot is REPEATABLE**,
a property of the place rather than noise. If it is repeatable it can be measured once and stored, which is
rung 2 of the ladder. If it wanders, nothing can be stored.

Session 40 has two readings (190 at the desk, 220 on open floor) which are consistent with the claim and do
not establish it, because they were taken once, by eye, on one evening.

**The owner's setup accidentally became the controlled experiment.** His phone lies flat on a fixed surface,
aimed at his wall corner, which he states is the true qibla. And the two builds differ by a known constant:

| | Version | `IOS_AXIS_CORRECTION` |
| --- | --- | --- |
| Installed on the XS | 1.29.120 | **190** |
| `uat-2` today | 1.29.138 | **180** |

**Difference: exactly 10 degrees.** Everything else in the heading path is identical between the two builds,
so the dial must move by exactly that and nothing else.

## The prediction, stated before the test runs

| Observation | What it means | Consequence |
| --- | --- | --- |
| **The dial swings about 10 degrees** | The sensor reading at that spot is repeatable, and the correction is a pure constant offset | **The hypothesis HOLDS.** Rung 2 is a real per-spot calibration, and "calibrate this spot once" is buildable |
| It swings by something clearly different | The reading is not stable between the two observations | **The hypothesis FAILS.** Rung 2 becomes a landmark note ("the qibla is 20 degrees right of your window"), which still works forever and needs no sensor |
| It does not move at all | The new build did not take, or the sheet cached a value | Not a result. Re-check the installed version before concluding anything |

**Writing the prediction down first is the point.** Session 40 tuned six constants by looking at a dial and
asking "does that look right", which is how it reached 270, 180, 190, 180, 170, 190 and 220 without
converging. A test with a number written in advance can fail. A look at a dial cannot.

## What the owner does, exactly

The taps are his: local tooling drives none on a physical iPhone (`ai/AGENTS.md`).

1. **Do not move the phone.** It stays flat, in the same place, pointing the same way, for the whole test.
   Moving it by two metres is worth 30 degrees, which is larger than the effect being measured.
2. **Open the Qibla sheet on the build already installed** (1.29.120) and note where the Kaaba marker sits.
   The owner reports it at 12 o'clock, on his wall corner.
3. **Install `uat-2`** (1.29.138). The build is prepared by this session.
4. **Open the Qibla sheet again, without touching the phone**, and note where the marker sits now.
5. **Report the swing**, as a clock position or an estimate in degrees. Roughly 10 degrees is about a third
   of the gap between two hour marks on a clock face.

## What each outcome does to the plan

**If it holds:** `PROPOSALS.md` D1's rung 2 is confirmed buildable, and the execution plan gets a
"calibrate this spot" step whose accuracy is inherited from whatever established it (the sun at 2.3 degrees).

**If it fails:** rung 2 is rewritten as a stored landmark note. **The ladder does not change shape**, which
is why this test is cheap rather than risky: the sun, the map and the compass rungs are all unaffected.

## The second thing this test delivers

**It puts the defect on the owner's own desk, visibly, in one install.**

Session 40 argued in prose that a room-tuned constant is wrong, and the owner accepted the argument. This
shows it: the marker that currently sits on his wall corner will move off it when the tuned value is
replaced by the honest one. **That swing is the feature's whole problem, rendered on the screen he uses.**

It is also the reason the shipped build is not "worse" than the installed one. 180 is correct geometry and
190 was fitted to one desk. **The dial moving away from the wall corner is the app becoming more honest, not
less accurate**, and that distinction is the thing the row exists to fix.

## Build provenance, for the record

- `app.json` bumped to 1.29.138 **before** prebuild, in that order, because `expo run:*` never re-syncs an
  existing native directory (`ai/AGENTS.md`; violating this order once shipped 1.22.10 code stamped 1.22.9).
- `npx expo prebuild -p ios --no-install`, then `ios/Athan/Info.plist` verified to read **1.29.138**.
- `DEVELOPMENT_TEAM=9V3WAU9Z54 npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E`.
- **Release, not Debug**, even though the owner has since ruled the XS a test device where Debug is
  preferred. This one test compares against the Release build already on the phone, and a Debug reading
  would confound the measurement with a configuration change. Every later prototype is Debug.

## BUILD DONE, 2026-09-30 01:58. The phone is ready and the test is waiting on the owner.

Verified after the build rather than assumed:

```
$ xcrun devicectl device info apps --device 00008020-0015585C22D2002E
Athan   com.mugtaba.athan   1.29.138
```

| | Before | Now |
| --- | --- | --- |
| Version on the XS | 1.29.120 | **1.29.138** |
| `IOS_AXIS_CORRECTION` | 190, tuned to the desk | **180, the honest geometry** |

`Info.plist` in the installed artifact reads 1.29.138, the bundle is 5,992,032 bytes written at 01:58, and
the build reports `0 error(s)`. Built from `uat-2` at `18d6ccca` with only documentation modified.

**The phone has not been moved by this session**, since everything above ran over USB with no taps.

**What is left is four steps of the owner's, in section "What the owner does, exactly":** open the sheet,
see where the marker sits now, and report the swing. The prediction is written above and cannot be edited
after the fact: about 10 degrees means the hypothesis holds.
