# What actually fixed the compass, and what is still unproven

The owner's verdict on 1.29.205, having tested both phones:

🐋  "This works absolutely perfectly. I love it. It's amazing... It's so clear, it's so smooth...
both phones are pointing in the perfect direction."

**This page exists because nobody yet knows WHICH change did it.** Four things landed between the
build he rejected and the build he loves, and they were never tested apart. The owner asked the right
question: 🐋  "which one was the issue? That's the real question. Because I think one of these three
patches actually fixed it."

The honest answer is that it is unproven, and the next session's job is to separate them.

---

## The four changes, and what each could have done

| # | Change | Where | What it could explain |
| --- | --- | --- | --- |
| 1 | **The settling gate LATCHES** instead of re-testing every reading | `hooks/useQibla.ts`, this app's own code | **The dial not moving at all.** Near-certainly necessary: before it, every update made while the phone turned was DROPPED, so the compass advanced only when held still |
| 2 | **The 2-degree emission gate removed** | `expo-location` patch, Android | **The accuracy.** It served 0.83 Hz during slow alignment and FLOORED the reported heading's resolution at 2 degrees |
| 3 | **5 Hz to 50 Hz** (`SENSOR_DELAY_NORMAL` to `_GAME`) | `expo-location` patch, Android | **The smoothness.** Measured on device: `selected = 20.00 ms` against the old `200.00 ms` |
| 4 | **`headingFilter = kCLHeadingFilterNone`** | `expo-location` patch, iOS | The iPhone's share of both. Its 1-degree default rejected 731 of 731 readings of a stationary phone |

## The planner's hypothesis, stated so it can be proven wrong

**Change 1 was necessary and is not sufficient.** It is the only one that explains a dial that refused
to move while turning, and no amount of sensor rate fixes a gate that discards the reading.

**Change 2 is the likely hero for ACCURACY, and that is the surprising part.** The owner reports both
phones now point perfectly, which is a different complaint from smoothness. A higher sample rate does
not make a heading more correct; it makes it arrive more often. **Removing a 2-degree quantisation
floor does change correctness**, because the reading the app drew was previously snapped to the last
value that differed by more than 2 degrees. That is the one change with a mechanism for "it points
perfectly" rather than "it moves nicely".

**Change 3 is the likely hero for SMOOTHNESS and may matter less than it appears.** 10x the samples is
exactly what "so clear, so smooth" sounds like, and nothing more.

**Change 4 cannot be separated from 2 and 3 by watching Android**, because it only affects the iPhone.
That the XS improved at the same time is evidence it did something, but not how much.

## The experiments that would settle it

Each isolates ONE variable against the build the owner has already judged. All four are a patch edit
and a rebuild; none needs new code.

| Experiment | Build | What it proves |
| --- | --- | --- |
| **A. Rate alone** | Restore `SENSOR_DELAY_NORMAL`, keep everything else | If accuracy survives and only smoothness drops, **change 2 is the hero** and the rate is polish. This is the owner's own proposed test: 🐋  "What if we dropped it back down to 5 Hz?" |
| **B. Gate alone** | Restore the 2-degree gate, keep 50 Hz | If accuracy degrades while smoothness holds, it **confirms A from the other side** |
| **C. Latch alone** | Revert the latch, keep both patches | Expected to break completely. Worth one run because it bounds how much the patches alone could ever have done |
| **D. iOS filter** | Restore the 1-degree `headingFilter`, iPhone only | The only way to size change 4 |

**A and B are the valuable pair**, because between them they answer the owner's actual question. C is
a control. D is iOS housekeeping.

A caution for whoever runs these: the owner's judgement is the instrument, and his report is about a
room full of iron on a particular night. Run each experiment back to back in the same place, not
across days.

## Would 52 Hz be better? No, and it would be worse

The owner asked: 🐋  "if we make this 52 hertz, would it be even better?"

**52 Hz is the MMC3416PJ magnetometer's own hardware ceiling**, measured from `dumpsys sensorservice`
as a 19.2 ms minimum delay. `SENSOR_DELAY_GAME` asks for 20 ms and gets 50 Hz, which sits just inside
it with headroom.

Asking for the exact ceiling is worse for three reasons:

1. **Delivery gets less consistent, not more.** A sensor asked for its own maximum has no slack, so
   any scheduling delay drops a sample rather than arriving late.
2. **Nothing visible is gained.** 50 Hz is already 5x the owner's own stated bar of 10 Hz, and the
   compass is redrawn far below that rate anyway.
3. **It costs battery while the sheet is open**, for samples nothing consumes.

**Nothing would "break"**, which was the owner's worry: Android clamps a request to what the hardware
allows rather than failing. The risk is power and jitter, never correctness.

## Was a native module written? No

🐋  "Did you create a custom module for this, a custom native module or what?"

**No.** All three patches are edits to `expo-location`'s own source, carried in
`patches/expo-location+58.0.9.patch`, which already existed in this repo for an unrelated fix. No new
module, no new dependency, no new permission.

**Row 49 is still where a native module would go**, and it remains unbuilt. What it would add is what
patching cannot reach: `headingAccuracy` in real degrees, Apple's calibration prompt, and Android's
Fused Orientation Provider.

## Why `SENSOR_DELAY_GAME` rather than `_UI`

🐋  "You kept SENSOR_DELAY_GAME 50 Hz rather than UI 15 Hz. I don't understand."

The three documented constants are `NORMAL` (200 ms, 5 Hz), `UI` (66.7 ms, 15 Hz) and `GAME` (20 ms,
50 Hz). `UI` would have cleared the owner's 10 Hz bar with little margin; `GAME` clears it with 5x.
The app already pulls a sensor at 16 ms in the same process through Reanimated, so this rate is
demonstrably affordable on the floor device.

**If battery while the sheet is open ever becomes a complaint, `UI` is the fallback**, and it is a
one-word change. Nothing else would need to move.

## What is NOT fixed, and is not claimed to be

The residual error from iron in the owner's house. `MEASURED.md` sections 3 and 4 measure it as
invisible to any gate reading the heading stream, and the field-physics check cannot bound it either.
Nothing in 1.29.204 to 1.29.207 attacks it. Row 49 carries the only remaining lever.
