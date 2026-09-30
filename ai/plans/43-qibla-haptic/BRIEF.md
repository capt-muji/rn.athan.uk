# Brief: Session 43. The qibla felt, not read

The qibla is a complete rewrite. Row 41's map, street finder and sentence are deleted, and so is every
assumption underneath them. What survives is named below, and nothing else carries over by default.

## Why this row exists

Row 41's Release build reached the owner's hand on 2026-09-30 at 1.29.154. It worked. It rendered the streets
around him, named a real one, and stated the qibla against it. He rejected it in seconds:

🐋  "Stand along Parsons Green Lane, then turn 49 degrees to the left. No user in their mind knows absolutely
what 49 degrees looks like. This is really hard, absolutely not. No."

He is right, and no measurement was needed to see it. **The sentence asked a person to estimate an angle by
eye, which is the one thing a person cannot do.**

**This is the third variant of one failure, and naming it is the most useful thing this brief does.**

| Session | What shipped | Coverage | Why it failed |
| --- | --- | --- | --- |
| 37 | A compass dial | 100% | Every label rendered upside down |
| 40 | A fused-sensor heading | 100% | 71 degrees wrong on the owner's own phone |
| 41 | A street and a turn in degrees | 100% | Correct, and no human can act on it |

Every acceptance criterion in all three measured whether the NUMBER was right. None asked whether a person
could DO anything with it. A green suite has now certified three unusable screens in a row.

## What the owner asked for

🐋  "I would like to see me on a map. Where I'm standing, where Macca is, and the line between both, so
instead of the compass it will be a line... North is always locked in place. And while I'm turning around...
as soon as I line up with Macca, once the line is straight, it will vibrate. Haptic feedback... every time I
touch the line haptic feedback. If I go past it, I come back, haptic feedback. If I'm off, no haptic
feedback."

One tap per crossing. Never a continuous buzz.

**The requirement that decides the architecture:**

🐋  "I don't want to be able to reference anything in the real world. What if I'm inside my room and I need to
know where to pray, or I'm in a very big shopping centre and it takes 30 minutes to go out? We want this to
work on the phone completely in the dark without any reference looking around."

## Why the haptic is the right answer and not merely a different one

**It deletes the number.** The user turns until the phone taps their hand. Nothing is read, estimated,
converted or understood. That removes the exact failure that killed row 41's sentence, and it also serves a
user in the dark, a user who cannot see well, and a user who does not know what a degree is.

It is worth stating plainly that this is the first qibla design in four sessions whose output is not a number
on a screen.

## The cost, stated honestly, and the owner's ruling on it

Only the magnetometer knows which way a phone points. Row 41 named a street precisely BECAUSE a street needs
no heading, so removing the external reference removes the one thing that was carrying the direction.

**The magnetometer is the sensor this programme already rejected twice.** It read 30 degrees wrong in the
owner's bedroom (session 40) and drifted 20 degrees at one fixed spot across a few hours (session 41's
controlled test, prediction written down first).

**OWNER RULING, 2026-09-30, taken with that evidence in front of him: build it and accept the sensor as it
is.** So the haptic will tap at the wrong angle in a room with steel in it, and the app cannot presently tell
when. That is a deliberate trade, not an oversight, and it is recorded here so nobody later mistakes it for
one.

**Two levers were specified and never built. They are the first things to try if the sensor must be rescued.**

1. **The field-magnitude and dip physics check.** `ai/plans/40-heading-rearchitecture/agent-reports/D4-detection-and-honesty.md`.
   The platform's own accuracy band is worthless: the Find X8 reported HIGH while reading 71 degrees wrong,
   then UNRELIABLE while its field was correct. But 80 uT where 48 is expected is steel, and that is physics
   rather than a self-report.
2. **Hard-iron calibration harvested from the turn the user already makes.** A local steel offset biases the
   whole circle, and fitting the readings over a full rotation is the standard correction. The owner's design
   has the user rotating anyway, so it costs no extra interaction, which is the objection that killed D4's sun
   rung. Session 41 proved a STORED calibration cannot work, because the error drifts with time. A calibration
   recomputed DURING the turn is a different claim and is unmeasured.

## The measured traps, so the planning session does not rediscover them

**1. The path to Makkah must be drawn as a CURVE.** A straight line on a north-locked Mercator map IS the
rhumb line. Measured from the owner's own address: the straight line bears **133.74** where the true qibla is
**118.88**, so it is **14.86 degrees wrong**. In Los Angeles the same error is **71.31 degrees**. A shipped app
has already been caught doing exactly this, and it is the documented reason some North American mosques face
the wrong way. Draw the great circle as a curve; the arrow at the user departs along it.

**2. "See the entire city I'm in and the entire city of Mecca" is arithmetically unreachable.** The two are
4,796 km apart. Any zoom fitting both on a phone canvas is about z3, a span of 228x218 px, and **London's
50 km is 4.1 px at that zoom**. Two markers and two labels is the honest picture. There is no zoom where both
are visible as cities.

**3. Pinch-and-zoom is the MOST expensive option offered, not the cheapest.** The owner offered it as a
simplification (🐋  "or if it's easier, just make the map draggable"). It is the reverse: a static picture
decodes nine small tiles once, while pan and zoom needs tiles at every level on demand, a gesture layer and a
real map engine, priced in row 41's research at **+39.9 MB** for MapLibre against **+0.0** for the
`react-native-svg` already installed.

**4. The Kaaba's position is settled to the arcsecond and must not be re-litigated.** Re-sourced independently
on the owner's instruction (🐋  "no adhan qibla maths") from five sources, the strongest being OpenStreetMap's
**surveyed building footprint**, way 103914569, whose area centroid is **21.4224868, 39.8261262** and whose
five sides measure 10.15, 9.15, 2.51, 10.17 and 12.00 m, matching the real building. The five sources disagree
by at most **8.27 metres**, which is **0.34 arcseconds** of bearing from London. The rejected sensor is wrong
by **30 degrees**, which is 320,000 times larger. A hand-written great-circle bearing agrees with a full
Vincenty WGS84 ellipsoid solution to **0.07 to 0.18 degrees** at eight cities.

**The maths was never the defect, and no future session should spend an hour on it again.**

## What survives row 41, and what dies

**Survives, proven and merged:** the PMTiles reader, the MVT decoder, the 25 MB LRU tile cache, `fflate`, the
SVG drawing layer, and the independently sourced coordinates with the hand-written bearing.

**Dies:** the street finder, the street sentence, and the north-up close-in map.

## The acceptance criterion this row is judged on

Not coverage. Three 100%-covered screens have already failed.

**A person who has never seen the app, standing in a room, in the dark, with no view outside, can face the
qibla without reading anything.**
