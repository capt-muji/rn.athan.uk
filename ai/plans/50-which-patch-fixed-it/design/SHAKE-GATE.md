# The shake gate: how the hint stopped lying, and what it cost

Session 50 measured a defect it could not fix inside its own scope; session 52's wave gate closed it.
This is the record of the gate that was built for that closure, **now itself removed**:
`shared/qiblaShake.ts` shipped in `681c8c59` (1.29.222) and was deleted in `eeebc2ba` (1.29.233),
"the shake is deleted, the settling gate alone decides", when rows 52/53's settling-model work
superseded it. The measured defect and the owner's rulings below stand independently of that removal.

## The defect, measured

The calibration hint asked the user to wave the phone in a figure of eight, and **nothing checked that
it happened**. Measured over 300 runs per case against the shipped settling gate:

| User | Gate opens at | Error of the heading the dial draws |
| --- | --- | --- |
| waves the phone as instructed | 3.7s | **11.88 degrees** |
| ignores the hint, holds still | 9.7s | **2.98 degrees** |

**A user who followed the instruction got a compass four times wronger than one who ignored it.**
`hasSettled` opens when the trailing window's two halves agree within 1.5 degrees, and waving fills
that window with the USER'S motion rather than the sensor's: a sinusoidal wave's two halves average to
nearly the same value, so the window looks settled while the fusion is still 12 degrees from truth.
The prettier the animation, the more people follow it, so redesigning the hint made fixing this more
pressing rather than less.

## What the gate did, and why each rule was that shape

`shared/qiblaShake.ts` was pure arithmetic over accelerometer samples, so every rule was testable
without a device:

| Rule | Why it was that shape |
| --- | --- |
| Gravity subtracted from the magnitude | A phone lying on a desk reads 9.81 on one axis and must come out as ZERO motion, whichever way up it is and however tilted. The owner's own 3T sits slanted on a desk |
| A SHARE of the window above a threshold | Not a mean: a figure of eight is nearly still twice a lap, at the ends of each lobe where the wrist turns, so a mean is dragged under the threshold by exactly the gesture being asked for |
| A minimum reading count | At one sample any share test passes on the first reading above the threshold, so a phone picked up off a table would satisfy the gesture instantly |
| Three seconds counted as time MOVING | The owner's number. Wall time would let a user wait it out; motion time means a user who pauses keeps what they have already done rather than starting again |

## What it could not do, stated plainly

**The gate proves the user waved. It does not prove the wave helped.** Hard iron in the room passes
every heading-stream test by construction (session 48 measured it, session 50 confirmed it): the
settling gate measures DRIFT, and a stable bias does not drift. The figure of eight IS the standard
hard-iron re-estimation and the OS recalibrates from it, so asking for it is right; nothing in the app
can verify the OS acted on it.

## The 3D phone

The owner's report: 🐋  "the phone is actually flipping, so it becomes invisible when it turns to the
side. When actually, no, it should always be facing forward... try and make it look 3D just like we
made the Kaaba 3D."

The first implementation scaled a flat card horizontally, which is how a flat drawing shows a rotation
out of the screen, and at `scaleX` near zero a card IS a line. `phoneSlab` drew the phone the way
`shared/kaabaFigure.ts` draws the Kaaba: a front face that never narrows at any yaw (the face the user
reads, and where the trail leaves its foot), a flank that recedes from the turn-away edge bounded at
46% of the phone's width, and a roof joining them that catches the most light. **Three tones, because
a solid reads as 3D only when its faces differ**; the first attempt filled the flank with
`PALETTE.kaaba`, nearly the front's colour, and the phone read as flat in the rendered frames even
though the geometry was correct.

## What reading the frames back caught, that review did not

Every change was rendered through the design harness and looked at. Three faults were invisible in the
code and obvious in the picture:

1. **The phone read as flat**, because the flank's fill was nearly the front's.
2. **The progress ring cut through the figure.** A ring around a lemniscate crosses both lobes and
   reads as part of the drawing; it became a bar beneath the figure.
3. **The phone was sized wrong twice** before the 3D registered: at 21px wide the flank is 6px and
   invisible, and the first correction overshot.

## What the break script caught, that the tests did not

Thirteen breaks, three of which initially SURVIVED against tests that looked correct:

| Break | Why the test missed it |
| --- | --- |
| `minReadings: 8` to `1` | The test read `SHAKE.minReadings` on BOTH sides, so lowering the constant moved the expectation with it. The same tautology this session already met once in another file |
| The front face narrowing with yaw | The test compared the face's width at one yaw against another, and the break scaled both alike |
| The same break again | Measuring against the phone's own width still missed it: the break moves ONE corner, leaving the span intact and the face a wedge |

**A passing test is not evidence until something has tried to break it**, and the third round is the
one that proves it: two plausible fixes to the same test both still passed a genuinely broken drawing.

## Dead code removed rather than tested around

`phoneScreen` became unreachable once the slab drew its own screen; a `settledRef` guard on the haptic
could never fire (the effect re-runs only when `showsCompass` changes, and the other branch already
resets it). Both were deleted. Writing a test for an unreachable line would have hidden them.

## The test mock this needed

`jest.components.setup.js` gained working `useAnimatedSensor` and `useAnimatedReaction`
implementations. The published Reanimated mock returns one frozen all-zero reading and a NOOP reaction,
which is why session 47 found a sensor hook sitting at 0% coverage and recorded it as untestable. With
both implemented, the hook is tested by writing readings into the very shared value it watches.
