# Brief: Session 45. The qibla on a flat world map, the way a maps app does it

Built from a clean tree, after session 44 has removed every trace of the previous four attempts. **Nothing from
sessions 37, 40, 41 or 43 is carried forward except the measurements in `ai/plans/44-qibla-cleanup/FACTS.md`.**

🐋  "You can forget about the previous research that we've done because I think we've come to the conclusion that all
the previous research is incorrect."

## What the owner asked for, in his own words

🐋  "I want a static map. I want to see a static map, the world globe, just a map. The flat world map, from A to Z, the
whole world map, regardless of where the user is, the whole world map."

🐋  "In Mecca, I want a small tiny Kaaba icon, or a mosque icon. Use the masjid.svg. Or you can find a Kaaba icon."

🐋  "And then where I am standing, I want a dot to render, and I want an arrow pointing to the direction where I am
pointing, so that I know where to look. And then I want a line going from me to the Kaaba. That's the line, that's the
place I should face."

🐋  "Remember, this all has to fit the theme of the app."

🐋  "Every single time I touch the line when I'm perfectly lined up, I feel haptic feedback... it's just a one-time
haptic feedback. Then if I'm off, even by one degree, it stops. But as soon as I come back on it, one haptic feedback.
If I stay on it, I shouldn't feel a constant haptic feedback. It's just one. Touch like ZZ. Not Z, Z, Z, Z, Z. Because
this is going to be useful for blind people, to just feel the haptic feedback once they're on the line."

🐋  "I wanted to be exactly like Google Maps, Apple Maps. That's it. That's the way I want to do it."

🐋  "With the least amount of permissions possible."

🐋  "Try and make this super lightweight and 60 FPS."

🐋  "The current design that you have is super ugly for the map, the arrow, et cetera. It's super, super ugly."

## The one finding that must shape the design

**The platform's own maps are jittery indoors, and that is not a defect to fix but a fact to present.** The owner
walked between four rooms with Google Maps and Apple Maps open and the direction changed substantially in each. The
true qibla moved by **under a ten-thousandth of a degree** across those same metres (`FACTS.md`).

**So an app that draws a single confident needle is lying, and so were all four previous attempts.** Apple's own
answer is in `FACTS.md` and it is the strongest lead this brief has: **Apple Maps draws a CONE whose width is the
reported heading accuracy**, and Apple's documentation says a negative accuracy means the heading is invalid because
of "strong interference from local magnetic fields". The platform does not hide the uncertainty; it draws it.

**The planning session must decide whether this app does the same, and it is the central design question of the row.**
It bears directly on the haptic: a tap that fires at a heading known to be 35 degrees uncertain is a tap at the wrong
angle, and the user cannot tell. Three shapes to weigh, none of them chosen here:

1. Draw the cone, tap only when the line is inside it, and say nothing else.
2. Draw the cone and suppress the haptic entirely while accuracy is poor, so the phone goes quiet rather than lying.
3. Draw a needle as the owner described and accept the error, as row 43 did by explicit ruling.

**A complication that must be resolved before proposing the cone:** `expo-location` BUCKETS Apple's accuracy into
0 to 3 at the 50, 35 and 20 degree boundaries (`LocationUtils.swift:9`), so the exact degrees never reach JavaScript.
A cone drawn from a bucket is a cone of 20, 35 or 50 degrees and nothing between. Whether that is good enough, or
whether it needs a patch or a small native module, is a research question with a real cost attached, and the
least-permissions rule applies to any answer.

## Owner requirements, restated as testable statements

| # | Requirement | How a person checks it |
| --- | --- | --- |
| 1 | Settings has a Qibla row | Press the hex-nut, see Qibla, press it, the sheet opens |
| 2 | The sheet shows the WHOLE flat world map, the same view wherever the user is | Open it in London, see the whole world, not a region |
| 3 | The map fits the app's theme | The owner's eye. Session 43's version was rejected as ugly |
| 4 | A small Kaaba or mosque mark sits on Makkah | Visible at Makkah's position |
| 5 | A dot marks where the user stands | Visible at their position |
| 6 | An arrow shows which way the phone points | It turns as the phone turns |
| 7 | A line runs from the user to the Kaaba | Visible, and it is what they align to |
| 8 | ONE haptic tap when the arrow reaches the line | Turn onto it: one tap |
| 9 | Silence while held on the line | Hold still: nothing further |
| 10 | Silence while off the line | Hold away: nothing |
| 11 | One tap again on returning | Turn off and back: one tap |
| 12 | 60 fps, lightweight | **DEFERRED by the owner, 2026-09-30.** No frame evidence is required to call this row done |
| 13 | Fewest possible permissions | Count what the app asks for |

## Where this is tested, and it is one device (owner, 2026-09-30)

🐋  "we will completely working the iPhone XS for now the physical device, the Android testing comes later. After we
are happy with the iPhone." And on requirement 12: 🐋  "Don't worry about the 60 FPS for now, that's something we can
adjust later."

**The physical iPhone XS is the only device that gives a verdict, and every step's gate is read there.** Android is
out of scope for this row, so trap 5 below (the Android heading) is recorded for the row that brings Android back and
is not this row's problem. `e2e/scripts/frame-audit.sh` is `adb`-only and measures the 3T, so it plays no part here,
which is consistent with requirement 12 being deferred rather than a gap to work around.

**The simulator draws, the phone decides.** A simulator has no magnetometer, no taptic engine and cannot be turned on
the spot, so it cannot test the heading, the haptic or the alignment: what it can do is iterate the PICTURE cheaply,
which is what four rejections were about. Use it for the visual loop only, and never let it produce a verdict.

`agent-device` drives the XS directly, including `press`, `gesture`, `orientation`, `screenshot` and `install`
(measured; `ai/AGENTS.md` carries the detail), so a step needing a tap does not need the owner's hands. What still
needs them is judgement: whether the map is ugly, and whether the tap lands when he faces Makkah.

Requirement 8 and 9 together are hysteresis: enter and leave on different thresholds. Session 43 measured a single
threshold firing **49 taps in 100 samples** of 0.3-degree jitter, which is exactly the buzzing the owner refuses, and
that measurement is in `FACTS.md`. **The planner must also handle the antipode**: a signed offset changes sign both at
the qibla AND at the bearing directly away from it, so an unbounded crossing test taps when the user faces away.

## The traps, each already measured

**1. A straight line on a flat world map is WRONG, and the owner's instruction here needs care.** He said:

🐋  "Based on maps, not based on globe arcing, globe radius, whatever."

His reasoning about the man in space is answered by `FACTS.md`, and it is worth telling him the result, because it
vindicates him: the great-circle bearing and the straight-line-through-the-earth azimuth are **identical to six
decimal places at seven cities**. Cutting through the earth and following the surface give the SAME compass direction.
So there is no arc-versus-chord choice to make about the DIRECTION.

**The choice is only about the DRAWING.** A straight line between two points on a flat Mercator map is the rhumb line,
and its bearing differs from the true one by London 14.86 degrees, New York 42.80, Toronto 48.03, **Los Angeles
71.32**. A shipped app has been caught at exactly this and it is the documented reason some North American mosques
face the wrong way. **The planner must resolve this explicitly and tell the owner what it chose**, because a literal
reading of "based on maps, not globe arcing" would ship the Los Angeles defect. Options include drawing the true
great-circle path as a curve, choosing a projection where the straight line IS correct (an azimuthal equidistant map
centred on the user has exactly this property and is still a flat map), or drawing a short ray at the true bearing
rather than a line spanning the map.

**2. "The whole world map" and "a dot where I stand" are in tension.** At a zoom showing the whole world on a phone,
a city is a few pixels, so the dot is a marker rather than a place. That is fine and must be stated, not discovered.

**3. Session 43's map was rejected on looks.** Requirement 3 is not decoration. The planner should treat the visual as
a first-class deliverable, name the exact theme tokens from `shared/constants.ts`, and expect the owner to judge it on
sight. `ai/AGENTS.md` forbids inventing colours or sizes: `SIZE.contentPadding` and `COLORS.activeBackground` do not
exist and previous sessions invented both.

**4. Where does the world map come from?** Session 41 built a PMTiles and MVT reader for STREET-level tiles, and
session 44 deletes it. A whole-world outline at one fixed zoom is a much smaller problem: a single coastline path is
small enough to ship as an asset, and `react-native-svg` is already a dependency. The planner must price the options,
and the offline rule still stands: 🐋  "this app is completely local, offline, no Wi-Fi connection."

**5. The Android heading is measurably worse than the iOS one.** `expo-location`'s Android heading fuses accelerometer
with the RAW magnetometer, no gyroscope, and gates updates at 2 degrees and 50 ms, which measured **71 degrees wrong
with 2 samples in 40 seconds** on a Find X8. On iOS, `trueHeading` is Core Location's own fused value and needs no
correction. **Any heading correction, axis constant or declination term this app computes itself is forbidden**: that
is what the owner ruled out, and inventing one is how session 43 shipped a reading 90 degrees out.

## Structure the owner asked for

🐋  "Step 1 is a complete cleanup. Step 2 is a complete re-architecture. Step 3 is implementing a prototype, first a
quick prototype. Then the next step is to build it properly, test it properly, have 100% coverage, and then a step
after that is a complete audit. Make sure there's no dead code, all the comments are compact, simplified."

Step 1 is session 44. This row is steps 2 to 5:

| Step | What it does | Gate |
| --- | --- | --- |
| 1 | Re-architecture: the design, the projection, the map source, the cone-or-needle decision | Owner reads it and rules |
| 2 | A rough prototype on the XS, no tests | The owner's hand and eye |
| 3 | Build it properly | 100% on all four measures, breaks caught |
| 4 | Device proof, including frame evidence for 60 fps | The owner's hand |
| 5 | Audit: no dead code, compact why-only comments, nothing left behind | `find-unused-exports.py` clean |

**Step 2 exists because of this session's own history**: four builds were rejected on sight, three of them after a
fully tested implementation. A prototype the owner can hold BEFORE the tests are written is the cheapest way to find
the fifth rejection.

## What "exactly like Google Maps and Apple Maps" means, and what it cannot mean

The owner's instruction is to use the platform's own calibration rather than invent one, and that is settled:
`watchHeadingAsync` gives `trueHeading` and the app adds nothing to it.

**It cannot mean matching their accuracy, because he has now measured that they are jittery too.** So the honest
target is: same input, same treatment of uncertainty, and no invented correction. The planner should say this plainly
in `PLAN.md` so nobody later reads "exactly like Apple Maps" as a promise of precision the platform does not give.

## Permissions

Today the app carries `NSLocationWhenInUseUsageDescription` only, and no motion permission. A qibla needs a POSITION
(only a position says which way Makkah lies: London 118.9, New York 58.5, Jakarta 295.2) and a HEADING (which way the
phone points). `watchHeadingAsync` requires foreground location, which the app already has, so the baseline is one
permission.

**Any proposal that adds a second prompt must be priced and justified against the owner's least-permissions rule**,
including anything needed to read Apple's unbucketed heading accuracy.

## What good looks like

**A person who has never seen the app opens it in a windowless room, turns on the spot, and feels one tap when they
face Makkah, without reading anything.** And when the phone cannot know the direction, the app says so rather than
tapping confidently at the wrong angle.
