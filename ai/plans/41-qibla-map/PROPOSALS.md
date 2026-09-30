# Owner decisions, session 41

The research is finished and it proved more than the row asked for. These are the seven decisions only the
owner can take, each with a recommendation and the measurement behind it. `PLAN.md` is deliberately unwritten
until they land, which is the precedent row 39 set.

Nothing here asks the owner to read a report. Each item is self-contained.

---

## D1. The feature is a LADDER, not a map. Is that accepted?

**What the research found.** The row asked for a map because the compass reads 30 degrees wrong indoors. The
map works and is proven. But two better things were found on the way, and one of them is free.

The honest ordering, by how wrong each method is:

| Rung | Method | Error | Works when |
| --- | --- | --- | --- |
| 1 | **The sun**, shadow on a flat phone | **2.3 deg** | The sun is out and between 5 and 65 degrees high |
| 2 | **A saved spot** | Whatever saved it | Always, once saved: indoors, at night, overcast |
| 3 | **The map**, streets around you | 6.2 deg estimated | Anywhere with streets in the data |
| 4 | **The compass**, named as the last resort | 9.7 outdoors, **30 indoors** | Always, and trusted least |

**Recommendation: accept the ladder.** The map alone leaves the user with nothing at night and nothing
indoors without landmarks, which is most prayers. The ladder covers every case and is honest about which
rung the user is on.

**The cost of accepting:** the Qibla screen becomes four states rather than one dial, which is more design
than the row imagined. **The cost of refusing:** the compass stays the primary answer, and it is the thing
that measured 30 degrees wrong in your own bedroom.

---

## D2. How do the map tiles reach the phone?

**The constraint you set:** 🐋  "this app is completely local, offline, no Wi-Fi connection."

**What the research measured.** A usable offline map of one location is a 3 by 3 grid of tiles at zoom 15,
plus a coarser ring for district context. Measured out of the real archive:

| Place | Size |
| --- | --- |
| London | 1,631 KB |
| Jakarta | 1,441 KB |
| New York | 1,194 KB |
| Makkah | 331 KB |
| Rural Wales | 71 KB |

The whole planet at street detail is 35.7 GB, which cannot ship. One location is under 1.7 MB.

**The three options:**

| Option | Offline rule | What the user gets |
| --- | --- | --- |
| **A. Bundle London only** | Fully satisfied, no network ever | The map works in London and nowhere else. The app is London-only today, so this matches it |
| **B. Bundle London, fetch once for anywhere else** | Satisfied in use, needs a network ONCE per new place | Works everywhere. A traveller taps once on arrival, on hotel wifi, and it is then permanent |
| **C. Fetch on demand always** | Broken: no network means no map | Rejected, it contradicts the rule outright |

**Recommendation: B.** It satisfies the rule as you stated it, since the feature works offline in use, and
the one-time fetch is the difference between a London feature and a world feature. The 1.7 MB download is
smaller than a single athan file.

**If you want A instead, say so and nothing is lost:** the sun rung already works everywhere with no data at
all, so a London-only map is a bonus rather than the feature.

---

## D3. Does the compass stay?

**What happened.** Sessions 37 and 40 built it and it is good engineering: 60fps on the floor device, a
correct bearing, an honest interference warning. It is also the thing that pointed 30 degrees wrong in your
room, which is why this row exists.

| Option | Consequence |
| --- | --- |
| **Keep it as rung 4, labelled as the last resort** | Nothing is thrown away. A user with no sun, no saved spot and no map still gets an answer, and the screen says it is the least reliable one |
| Delete it | Honest, and leaves a user in a windowless room at night with nothing at all |
| Keep it as the primary, add the others as extras | Rejected: it puts the least accurate method first |

**Recommendation: keep it as rung 4.** The work is done, it costs nothing to keep, and a hedged answer beats
no answer as long as the hedge is visible.

---

## D4. The sun screen asks the user to do something physical. Is that acceptable?

**The interaction, which the measurements chose rather than the design:** the user lays the phone flat, a
real shadow falls across the screen, and they rotate a drawn line to match it. The phone never consults the
magnetometer, and the accelerometer gives level to half a degree.

Measured budget: **2.29 degrees**, against 6.2 for the map and 30 for the compass indoors.

**The catch, stated plainly:** most users will never do this. It needs sun, it needs them to go outside or to
a window, and it gives a benefit they collect later. So this rung raises the ceiling for a committed user far
more than it raises the floor for everyone.

**Recommendation: build it anyway**, because it is the only rung that is both nearly free and nearly exact,
and because it is what makes the saved spot trustworthy. A saved spot is only as good as the method that
established it.

**One alternative, reported and not built** as you asked for on 2026-09-29: the app could simply announce the
twice-yearly moment when the sun stands directly over the Kaaba, which needs no interaction at all. That is
`rashd al-qiblah`, 28 May at 09:18 UTC and 15 July at 09:27 UTC, and the code reproduces both to the minute.
It is charming and it is useless as the main answer, because a user needs the qibla today rather than in May.

---

## D5. One new dependency, 91 KB, or the map cannot read its own tiles

**The repo rule:** no new dependencies without approval. So this is a decision rather than a detail.

Map tiles arrive gzipped and nothing in the app can inflate them. React Native has no `zlib`, and the repo
has no compression library at all.

**`fflate@0.8.3` is the recommendation, and it was measured rather than picked:**

| Check | Result |
| --- | --- |
| Browser build size | **91 KB** of pure JavaScript |
| Transitive dependencies | **Zero** |
| Node builtins it needs | **Zero**, verified by grep on the shipped file |
| Inflates a real tile | Yes, 62 KB to 113 KB in **4.3 ms** |
| Output correctness | **Byte-identical** to Node's own `zlib`, checked element by element |
| Against the alternative | `pako` is 2.49 MB unpacked against `fflate`'s 0.80 MB, for the same job |

**Everything else the pipeline needs is already installed:** `react-native-svg` draws it, and
`expo-file-system`'s `File` reads raw bytes because it implements `Blob`.

**Recommendation: approve `fflate`.** It is the cheapest possible shape for a new dependency, and the
alternative is that rung 3 does not work.

**Note this does not affect the sun rung**, which needs no new dependency at all.

---

## D6. On the compass rung, should the app stop printing a bearing to the degree?

**Why this is now a question.** You noted your phone points at your wall corner and called the hardcoding
"very, very, very bad". The tuned value was actually reverted before release, so the build ships the honest
`180`. **But your underlying judgement is right and is the more important point:** what you are seeing is a
property of your room, not of the app.

Measured from session 40's own readings: at your desk the shipped constant is about **10 degrees off**, and
on open floor about **40**. A 10-degree error on a phone-sized dial is roughly one needle width, so **it
looks correct**.

**That is the worst of the three possible outcomes.** An obviously wrong needle gets checked. An exactly
right needle needs nothing. A needle that is 10 degrees wrong and looks right **teaches you to trust it**,
then delivers 40 degrees two metres away.

**The prayer stays valid either way.** The Hanafi and majority position accepts `jihat al-Ka'bah` outside
Makkah with a commonly cited 45-degree floor (islamqa 101449). **So the defect is not invalidity, it is
dishonesty:** the screen prints `119° from north`, and printing three figures while delivering 129 or 159 is
a claim the app cannot support.

It also breaks session 37's own rule, that the compass "is honest about the needle and never about the
number". The shipped screen inverts it.

| Option | What the user sees on the compass rung |
| --- | --- |
| **Show a sector, not a number** | "The qibla is in this direction, within about 30 degrees." Honest about what a magnetometer can deliver indoors |
| **Show the dial with no figure** | The needle and the Kaaba marker, and no digits to over-trust |
| Keep the number, keep the warning | What ships today, and what made your phone look right while being wrong |

**Recommendation: show a sector.** The number is earned only on the rungs whose source supports it, which is
the sun at 2.3 degrees or a spot calibrated against the sun. This is a visible change, so it is yours.

---

## D7. Is a fifth rung wanted: "where does my mosque face"?

**What the research found.** OpenStreetMap holds about 290,000 to 339,000 muslim places of worship, so the
nearest mosque can be drawn on the map as a second reference the user can verify by walking to it.

**Why it is not straightforward:** OSM records no orientation tag for any building, and studies of real
mosques find measurable deviation, with one survey of 70 mosques finding only 30% within 2 degrees. So a
mosque is a REFERENCE, never a truth.

**Recommendation: not this session.** It is a genuine addition and it needs its own data decision, and the
ladder is already four rungs. Recorded here so it is not lost.

---

## What I assumed, where you were unavailable

Listed in full in `ASSUMPTIONS.md`. The five that most affect what gets built:

1. **Size is off the table for now**, on your ruling, so nothing was rejected for weighing too much and every
   megabyte is still reported.
2. **The research was widened** from "ship a map" to "how does the user verify the direction". The map is a
   means; a trustworthy direction is the end. This is why the sun was found at all.
3. **The map's 6.2-degree figure is an estimate**, built from four human-factor terms that are engineering
   judgement rather than measurement. The sun's 2.3 and the compass's 30 are measured.
4. **The per-spot magnetic offset is a hypothesis**, resting on session 40's two readings. Verifying it is the
   first job of the execution session, and if it fails, rung 2 becomes a landmark note instead.
5. **A one-time download is treated as compatible with the offline rule**, which is D2 and is exactly the
   kind of call that should be yours rather than mine.
