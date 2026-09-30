# P5: why the owner's phone reads correctly, and why that is the worst possible outcome

Written 2026-09-30, after the owner's note of the same day: 🐋  "the iPhone is pointing at the corner of my
wall... that's where the real direction is... And it currently is pointing there, but that's because we hard
coded it. We tweaked it specifically for my room, my desk. Which is very, very, very bad. That was the whole
purpose of this entire session."

**The owner is right about the danger and half right about the cause, and the difference matters.**

## 1. What is actually shipped

The desk tuning was **reverted before release**. `components/sheets/screens/Qibla.tsx:49` ships
`IOS_AXIS_CORRECTION = 180`, and the comment above it records why:

> "This is an axis relationship, so it can only be a multiple of 90 and is the same on every iPhone in every
> country. Tuning it to a room's own reading was tried and reverted: the same phone in the same orientation
> wanted 190 beside a laptop and 220 on open floor, and shipping either would export one room's steel to
> everyone."

So no room-specific value is in the build. **The constant is a genuine geometric relationship**, and session
40 was right to refuse 190 and 220.

## 2. So why does it point at the wall?

Because at that one spot the shipped value happens to be close, and the residual is too small to see.

| Where | What that spot WANTED | Shipped 180 is off by |
| --- | --- | --- |
| The desk, beside a MacBook | 190 | **+10 deg** |
| Middle of the room, open floor | 220 | **+40 deg** |

**A 10-degree error on a phone-sized dial is roughly one needle width.** It looks correct. The owner's
observation that it points at his wall corner is therefore consistent with a 10-degree error and is **not
evidence the constant is right**: it is evidence the error is small *at that one spot*.

**This is the worst of the three possible outcomes.** A needle that is obviously wrong gets distrusted and
checked. A needle that is exactly right needs nothing. **A needle that is 10 degrees wrong and looks right
teaches the user to trust it, and then delivers 40 degrees two metres away.** That is the failure mode the
row exists to end, and the owner identified it correctly even though the cause is not a hardcoded room value.

## 3. The honest framing of what is wrong

The fiqh position, sourced in R3: the Hanafi and majority view accepts `jihat al-Ka'bah` outside Makkah, with
a commonly cited **45-degree validity floor** (islamqa 101449, traced to Shurunbulali and al-Tahtawi). So 10
degrees and even 40 leave the prayer valid.

**The defect is therefore not invalidity, it is dishonesty.** The screen prints `119° from north`. Printing a
figure to the degree while delivering 129 or 159 is a claim the app cannot support. A sector would be honest;
a number is not.

This sharpens the row's own governing principle. Session 37 wrote that the compass "is honest about the
needle and never about the number". **The shipped screen does the opposite of its own rule**: the number is
the confident part and the needle is what cannot be trusted.

## 4. What this means for the design, and it is a correction

`P2` put the compass at rung 4 as "the last resort, honestly flagged", and left its reading on screen.
**That is not sufficient.** A flagged 10-degree error still prints a 3-digit number.

The correction: **when the app is on the compass rung it must stop printing a bearing to the degree.** Either
it shows a sector, or it shows the dial with no number at all. The number is only earned on the rungs where
the source supports it: the sun at 2.3 degrees, or a spot calibrated against the sun.

That is a change to what the user sees, so it belongs to the owner. It is added to `PROPOSALS.md`.

## 5. The experiment that settles the hypothesis, and the iPhone XS is enough

`P2`'s load-bearing hypothesis is that the offset is a **repeatable property of a spot** rather than noise.
Session 40's two readings are consistent with it and do not establish it, because they were taken once, at
two places, on one evening.

**The owner has now supplied the missing condition:** the phone sits flat on a fixed surface, aimed at a
known truth. That is a controlled spot with a known answer, which is exactly what the experiment needs.

The test has two variables and needs one phone:

| Variable | Prediction if the hypothesis holds | Prediction if it fails |
| --- | --- | --- |
| **Time**, same spot, readings hours and days apart | The offset is stable, differences near zero | The offset wanders, and no calibration can be stored |
| **Place**, two spots about 2 m apart | The offsets differ by roughly the 30 degrees already measured | The difference is not reproducible, and session 40's 30 was itself noise |

**If time is stable and place differs, the hypothesis holds and rung 2 is a real compass correction.** If
time wanders, rung 2 becomes a landmark note and the ladder still stands. Either way the answer is cheap and
it is the first thing the next session should do.

## What I attacked in my own conclusion

- **I first wrote that the owner was wrong about the hardcoding, and that was too clean.** The tuned value is
  not in the build, so the literal claim is inaccurate; but the owner's underlying judgement, that the
  reading he sees is a property of his room rather than of the app, is **correct and is the more important
  point**. Recorded as half right rather than wrong, because dismissing it would have missed the real defect.
- **I checked whether a 10-degree residual is worth acting on at all**, given that the prayer stays valid.
  It is, and the reason is the printed number rather than the angle: an app that prints three significant
  figures is claiming a precision it does not have, whatever the fiqh says about the sector.
- **The 190 and 220 are two readings, not a distribution.** I have used them to compute "+10" and "+40" as
  though they were the truth at those spots, and they are single observations by eye off a dial. The
  experiment in section 5 exists because of that, and no number in this report should be quoted as a
  measured error until it runs.
