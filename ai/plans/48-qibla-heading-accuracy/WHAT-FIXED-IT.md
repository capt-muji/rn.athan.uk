# What actually fixed the compass, and what is still unproven

The owner's verdict on 1.29.205, having tested both phones:

🐋  "This works absolutely perfectly. I love it. It's amazing... It's so clear, it's so smooth... both phones
are pointing in the perfect direction."

**Four changes landed between the build he rejected and the build he loves, never tested apart**, and he asked
the right question: 🐋  "which one was the issue? That's the real question. Because I think one of these three
patches actually fixed it." — **Resolved by row 50**: `ai/plans/50-which-patch-fixed-it/VERDICT.md` isolated
them and named the heroes.

## The four changes, and what each could have done

| # | Change | Where | What it could explain |
| --- | --- | --- | --- |
| 1 | **The settling gate LATCHES** instead of re-testing every reading | `hooks/useQibla.ts`, this app's own code | **The dial not moving at all.** Before it, every update made while the phone turned was DROPPED, so the compass advanced only when held still |
| 2 | **The 2-degree emission gate removed** | `expo-location` patch, Android | **The accuracy.** It served 0.83 Hz during slow alignment and FLOORED the reported heading's resolution at 2 degrees |
| 3 | **5 Hz to 50 Hz** (`SENSOR_DELAY_NORMAL` to `_GAME`) | `expo-location` patch, Android | **The smoothness.** Measured on device: `selected = 20.00 ms` against the old `200.00 ms` |
| 4 | **`headingFilter = kCLHeadingFilterNone`** | `expo-location` patch, iOS | The iPhone's share of both. Its 1-degree default rejected 731 of 731 readings of a stationary phone |

The planner's hypothesis, stated so it could be proven wrong: change 1 necessary, not sufficient; change 2 the
likely hero for ACCURACY (a sample rate cannot make a heading more correct; removing a quantisation floor
does); change 3 the hero for SMOOTHNESS; change 4 unseparable from 2 and 3 by watching Android. The
experiments that settle it (rate alone / gate alone / latch alone / iOS filter) are in row 50's plan.

**A caution that stays true for any future experiment:** the owner's judgement is the instrument, and his
report is about a room full of iron on a particular night. Run experiments back to back in the same place,
not across days.

## Three of his questions, answered so no session re-derives them

**Would 52 Hz be better? 🐋  "if we make this 52 hertz, would it be even better?" — No, worse.** 52 Hz is the
magnetometer's own hardware ceiling (measured 19.2 ms minimum delay from `dumpsys sensorservice`); asking for
it removes all scheduling slack so any delay drops a sample rather than arriving late. Nothing visible is
gained (50 Hz is 5x his own 10 Hz bar) and it costs battery. Nothing would "break": Android clamps the
request. The risk is power and jitter, never correctness.

**Was a native module written? 🐋  "Did you create a custom module for this, a custom native module or what?" — No.** All three patches are
edits to `expo-location`'s own source, carried in `patches/expo-location+58.0.9.patch`, which already existed.
Row 49 remains the only place a native module is planned (`headingAccuracy` in real degrees, Apple's
calibration prompt, Android's Fused Orientation Provider).

**Why `SENSOR_DELAY_GAME` rather than `_UI`? 🐋  "You kept SENSOR_DELAY_GAME 50 Hz rather than UI 15 Hz. I
don't understand."** `NORMAL` is 200 ms / 5 Hz, `UI` 66.7 ms / 15 Hz, `GAME` 20 ms / 50 Hz. `UI` clears his
10 Hz bar with little margin; `GAME` with 5x; the app already pulls a sensor at 16 ms in the same process
through Reanimated. **If battery while the sheet is open ever becomes a complaint, `UI` is the fallback** —
a one-word change; nothing else moves.

## What is NOT fixed, and is not claimed to be

The residual error from iron in the owner's house. `MEASURED.md` sections 3 and 4 measure it as invisible to
any gate reading the heading stream, and the field-physics check cannot bound it either. Nothing in 1.29.204
to 1.29.207 attacks it. Row 49 carries the only remaining lever.
