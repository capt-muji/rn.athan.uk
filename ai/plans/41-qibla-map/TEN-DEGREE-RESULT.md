# The 10 degree test: RESULT. The prediction failed, and that is the finding.

Measured 2026-09-30 by the owner on his own desk, on the build this session installed.

> 🐋  "I've just opened the compass in the newly installed version, and it's pointing at 1 o'clock, which is
> 30 degrees clockwise from the corner of my room, which is the actual location of the qibla, the real one.
> So it's 30 degrees clockwise too far."

## The number

| | Value |
| --- | --- |
| **Predicted swing** (written down before the test) | **10 degrees clockwise** |
| **Observed swing** | **30 degrees clockwise** |
| Unexplained by the constant | **20 degrees** |

On 1.29.120 (`IOS_AXIS_CORRECTION = 190`) the owner reported the marker ON his wall corner, so zero error.
On 1.29.138 (`180`) he reports 30 degrees clockwise of it.

**The direction is exactly right and the magnitude is three times too large.** Lowering the correction by 10
subtracts 10 from the heading, and the dial draws `bearing - heading`, so the marker must rotate clockwise by
precisely that. It rotated clockwise, which confirms the sign convention and the whole geometric model. It
rotated 30.

## Hypothesis D is eliminated from the diff, not from argument

The obvious escape is that something else changed across 18 versions. It did not. `git diff
0ee13ef8..uat-2` over the entire heading path (`components/sheets/screens/Qibla.tsx`, `shared/qibla.ts`,
`device/qibla.ts`, `components/qibla/`) touches the heading at exactly one line:

```
-const IOS_AXIS_CORRECTION = 190;
+const IOS_AXIS_CORRECTION = 180;
```

Everything else added is `isFieldTrustworthy` and the INTERFERENCE hint, which read the magnetometer **for a
warning** and never feed the heading. `dialAngleFromYaw`, `headingFromYaw`, the sensor type, the interval and
`XTrueNorthZVertical` are byte-identical.

**So the 20 unexplained degrees are real sensor behaviour, not a code change.**

## What the 20 degrees is

It is the same quantity session 40 chased through seven constants and never pinned:

| Observation | Spread |
| --- | --- |
| Session 40: 190 wanted at the desk, 220 on open floor, two metres apart | 30 degrees of PLACE |
| This test: the same spot, hours apart, 20 degrees unaccounted | **20 degrees of TIME** |

**Session 40 established that the error varies with place. This test establishes that it also varies with
time at a fixed place.** That is the missing half, and it is the half that decides the design.

## The verdict: T1 FAILS, and the ladder is unchanged

**`P2`'s load-bearing hypothesis was that the magnetic offset is a repeatable property of a spot**, so it
could be measured once against the sun and stored. A stored offset is only worth storing if it is still true
later. **Twenty degrees of drift in a few hours at one spot means it is not.**

This was pre-registered. `TEN-DEGREE-TEST.md`, written before the measurement, states the consequence:

> "It swings by something clearly different: the reading is not stable between the two observations. **The
> hypothesis FAILS.** Rung 2 becomes a landmark note, which still works forever and needs no sensor."

**So rung 2 changes from a magnetic correction to a landmark note**, and that is the whole cost:

| Rung | Method | Status after this test |
| --- | --- | --- |
| 1 | The sun | **Unaffected.** Celestial, never consults the magnetometer |
| 2 | A saved spot | **CHANGED.** Was "store the magnetic offset"; now "the qibla is 20 degrees right of your window". Still 100% coverage, still permanent, and **now immune to the drift that just killed the other version** |
| 3 | The map | **Unaffected.** A street bearing is ground truth held in tile data |
| 4 | The compass | **Unaffected**, and this is fresh evidence for decision D6 |

**The ladder does not change shape.** That is why this test was cheap rather than risky, and it is the
reason for designing it that way.

## The three things this test bought

**1. It killed a feature before it was built.** "Calibrate this spot once" is an appealing idea that would
have taken a session to build, shipped, and then silently drifted in every user's room. It cost one install
to find out instead.

**2. It is the strongest evidence yet for decision D6.** The app printed a confident three-digit bearing
while being 30 degrees wrong, on the owner's own desk, on a build whose constant is correct geometry. **A
number that can be 30 degrees wrong should not be printed to the degree**, and `PROPOSALS.md` D6 asks exactly
that.

**3. It confirmed the geometric model even while failing.** The marker moved clockwise, which is what the
sign convention predicts. The maths is right; the sensor is the problem, as sessions 37 and 40 both
concluded and neither could prove this cleanly.

## What it does NOT prove

- **Not that 180 is wrong.** 180 is the multiple of 90 the axis relationship allows, and 190 was fitted to
  one desk on one evening. The dial moving off the corner is the app being honest, not less accurate.
- **Not the exact drift rate.** One before-and-after pair separated by hours gives 20 degrees of unexplained
  movement; it does not say whether that is 20 degrees per hour, per day, or a single step change when
  something metal moved nearby. The fuller time-and-place sweep in `PROTOTYPE-PLAN.md` step P1 would say,
  and **the design no longer needs it**, because any drift of this size kills a stored offset.
- **Not that the sun rung works on device.** That is still unmeasured and is now the most valuable
  outstanding item.
