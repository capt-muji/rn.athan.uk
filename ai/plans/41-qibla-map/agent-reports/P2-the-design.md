# P2: the design, and the finding that session 40 called unfixable was the answer

Computed in this planning session, 2026-09-30, continuing `P0-error-budget.md` and `P1-solar-proof.md`.

## The finding that reframes everything

`P1` proved the sun's azimuth to 0.54 arcminutes with zero new dependencies. The obvious next move is to
show the user a sun-relative instruction at prayer time. **A coverage sweep kills that, and it is the most
useful negative result of the session.**

Solar altitude at each of the five prayers, London, computed from `adhan`'s own `PrayerTimes`:

| Month | Fajr | Dhuhr | Asr | Maghrib | Isha |
| --- | --- | --- | --- | --- | --- |
| March | -17 | 38 | 25 | -1 | -16 |
| June | -13 | 62 | 41 | -1 | -12 |
| September | -17 | 44 | 27 | -1 | -16 |
| December | -18 | 15 | 12 | -1 | -17 |

**Fajr is before sunrise. Maghrib is at sunset. Isha is night. Dhuhr in summer is above the 65-degree gate.**
Only Asr, and Dhuhr in winter, sit inside the usable band by construction, because prayer times are DEFINED
by solar geometry that puts three of the five where the sun is unusable.

Across a full year of all five prayers:

| City | Prayers per year | With sun in the 5 to 65 band | Fraction |
| --- | --- | --- | --- |
| London | 1,825 | 730 | **40%** |
| Tromso | 1,571 | 537 | 34% |
| Cairo | 1,825 | 570 | 31% |
| Jakarta | 1,825 | 440 | **24%** |

**So the sun serves at most 40% of prayers and as few as 24%.** A sun-only feature is unavailable most of the
time a user needs it. `P1`'s 365-days-a-year figure was right and measured the wrong thing: the sun is
available every day at SOME hour, and mostly not at the hours that matter.

## The reframe: the sun CALIBRATES, it does not point

The sun does not have to be present when the user prays. It has to be present **once**, while they establish
the truth at a place they will return to. Every mosque in the world was oriented this way, and it is what
`rashd al-qiblah` is for: a twice-yearly moment used to fix a building that then faces correctly forever.

Two things can be stored at the moment of calibration, and they differ in power.

**(a) A landmark note.** "The qibla at home is 20 degrees right of the window." Correct forever, needs no
sensor, works at night and indoors. Weak because it is per-room and human-recalled.

**(b) The magnetic offset at that spot**, which is `compass_reading - true_heading_from_sun`. This is
standard survey practice: calibrate the instrument against a celestial reference.

**Option (b) is the discovery, and session 40 already measured it while calling it unfixable.** From
`ai/plans/40-heading-rearchitecture/LOG.md`:

| Where | Correction that read perfectly |
| --- | --- |
| On the desk, beside a MacBook | 190 |
| Middle of the room, open floor | 220 |

Session 40's conclusion was that no constant satisfies both, so the tuning could never converge, and **that
conclusion is correct and remains correct.** What it missed is what the same data says: the offset is not
noise. It is **repeatable at a fixed spot**, because a steel stud does not move. Session 40 could not SHIP
either number, because shipping one room's steel to every user on Earth is exactly the error the owner
caught. But the app can MEASURE it, per user, per spot, on demand, against the sun.

**The needle that failed was an uncalibrated instrument. The sun is the calibration source it never had.**

## The design

Four situations, each with the best method available in it, ordered by trust:

| Situation | Method | Error | Coverage |
| --- | --- | --- | --- |
| Sun visible, altitude 5 to 65 | Establish truth directly from the shadow | **2.3 deg** | Every day of the year, at some hour, outside the polar night |
| A saved spot, calibrated earlier | Recall the stored answer | The error of the method that saved it, plus nothing | **100% once saved**: indoors, at night, overcast, offline |
| No sun, no save, recognisable surroundings | Map alignment | 6.2 deg estimated | Where map data covers the place |
| No sun, no save, nothing recognisable | The compass, honestly flagged | 9.7 outdoors, 30 indoors, both measured | Always, and least trusted |

**The ladder is what makes this honest, and it inverts the current app.** Today the compass is the whole
feature and its uncertainty is a hint under a confident needle. Here the compass is the last resort, named as
such, and the two methods above it are both immune to the room.

**The map keeps a real job in this design and it is a smaller one than row 41 proposed.** It is the fallback
for a user who has no sun and no saved spot, which is the traveller in an unfamiliar city: exactly the user
the owner's own traveller ruling of row 37 was about. It is no longer the primary surface, so it does not
need planet-scale street-zoom coverage to be worth shipping, which is the constraint R5 shows no shipped app
has ever met.

## What the sun cannot be replaced by, checked rather than assumed

| Candidate | Verdict |
| --- | --- |
| The moon | `adhan` has `meanLunarLongitude` and `ascendingLunarNodeLongitude`, but they feed the NUTATION terms only. There is no lunar position solution in the package, and a real one needs ELP-class theory. The moon is also only usable when bright and up, which is worse coverage than the sun for more work. Rejected. |
| Polaris | It is true north to within about 0.7 degrees at this epoch, and it needs a clear night sky, the northern hemisphere, and a user who can find it. The southern hemisphere has no bright pole star. Rejected on coverage, kept as a note because it is free to mention in help text. |
| Gyroscope hold | Immune to magnetic distortion and useful for holding a reference across a turn, not for establishing one. It is a consumer of the calibration, never a source. Worth measuring for drift in the plan, not a method on its own. |

## What I attacked in my own conclusion

- **I found the 24 to 40% coverage figure by testing my own previous report's recommendation, and it
  contradicted it.** `P1` said the sun works 365 days a year, which is true, and I had not asked whether
  those hours coincide with prayer times. They mostly do not. Recorded as the correction it is rather than
  smoothed over, because the earlier framing would have shipped a feature unavailable three times in four.
- **The per-spot magnetic offset is a hypothesis with two measurements behind it, not a proven mechanism.**
  Session 40's 190 and 220 are two readings at two spots on one evening, which is consistent with a
  repeatable offset and does not establish one. The plan must measure stability directly: same spot, same
  phone, readings separated by hours and by days, and the offset held or not. If it drifts, option (b) falls
  and option (a), the landmark note, carries the design on its own. **This is the single most important
  thing for the execution session to verify before building on it.**
- **I checked whether "save the answer" is just hiding staleness**, which is the trap the owner caught in
  row 37 when he rejected a cached position. It is different in kind: a cached POSITION goes stale when the
  user travels, silently. A saved SPOT is explicitly bound to one place the user named, so leaving it is
  visible to them. The design still owes a rule for what happens when the position has moved materially from
  where a spot was saved, and that rule is not yet written.
- **The strongest objection I could not dismiss:** this design asks the user to do something once, in
  advance, in the sun, for a benefit they receive later. Most users will never do it. So the ladder's bottom
  two rungs carry the real traffic, and the honest reading is that this design improves the CEILING for the
  committed user far more than it improves the floor for everyone. That is still worth building, and it is
  not the whole win the arithmetic above makes it look.

## Addendum: the one hard geometry rule for any map, verified independently

R4 raised this and it reproduces exactly. **A straight line on a Mercator map is the RHUMB line, not the
great circle**, so drawing a long line "to Makkah" on a flat map ships the error session 37 spent its
research rejecting:

| City | Great circle | Rhumb line | Error |
| --- | --- | --- | --- |
| Cairo | 136.14 | 138.13 | 1.99 |
| Jakarta | 295.15 | 292.79 | 2.36 |
| **London** | 118.99 | 133.83 | **14.84** |
| Sydney | 277.50 | 297.50 | 20.00 |
| New York | 58.48 | 101.28 | 42.80 |
| Toronto | 54.58 | 102.61 | 48.03 |
| **Los Angeles** | 23.86 | 95.17 | **71.31** |

A user caught a shipped app doing this (R4 section 1). The fix is to draw a SHORT ray at the great-circle
initial bearing and never a line to the destination. Drift measured against the true geodesic:

| Ray length | Drift from the initial bearing |
| --- | --- |
| 100 m | 0.001 deg |
| 1 km | 0.010 deg |
| 20 km | 0.197 deg |
| 100 km | 0.977 deg |

**A ray of about 1 km is safe to 0.01 degrees**, which is invisible, and it is also all the user needs,
because the ray's job is to point past the buildings they can see rather than to reach Arabia.
