# The street sentence is self-correcting, and that is what makes this feature work

Measured 2026-09-30 by the planning session, against four real tiles pulled from the live
Protomaps `20260929` planet archive. Every number below is executed, not estimated. The scripts are in
`proof/`.

This document exists because **the naive reading of my own first measurement said the feature fails, and it
was wrong.** The correction is the most useful thing in the session.

---

## 1. What the owner asked for, and what it forces

🐋  "The map and the landmark approach are very, very interesting. I would prioritise those 2"

🐋  "We do not want the user to have to do anything... if you ask them to draw a line or put it in the shadow
or, you know, something stupid like that. No, no, no."

Those two rulings together decide the architecture. The user opens the sheet and reads an answer. Nothing is
laid flat, nothing is rotated, nothing is aimed. So the screen's product is **a sentence and a picture**,
computed from position alone, with no sensor in the path.

---

## 2. Three candidate sentences, and only one survives

| Form | Example | Verdict |
| --- | --- | --- |
| A. Point at a landmark | "The qibla points toward Trafalgar Square" | **REJECTED**, section 3 |
| B. Turn from a street | "Stand along Whitehall, then turn 53 degrees left" | **Ambiguous as written**, fixed in section 5 |
| C. The drawn map | a picture of the streets with the ray on it | **Kept**, it is what makes B checkable |

---

## 3. Pointing at a landmark is REJECTED, and the arithmetic is brutal

A named target near the user looked like the ideal answer, and the tiles are full of them. Measured
candidates within 25 degrees of the qibla ray: London had "Former Whitehall Palace Steps" 1 degree off at
181 m, New York had "CoCo Fresh Tea & Juice" 0 degrees off at 28 m.

**The bearing to a target degrades as `atan(positionError / targetDistance)`, and that is catastrophic at
exactly the distances that make a landmark recognisable.**

| Target distance | 10 m fix error | 20 m | 50 m | 100 m |
| --- | --- | --- | --- | --- |
| **28 m** | **19.7 deg** | **35.5** | **60.8** | **74.4** |
| 50 m | 11.3 | 21.8 | 45.0 | 63.4 |
| 100 m | 5.7 | 11.3 | 26.6 | 45.0 |
| 200 m | 2.9 | 5.7 | 14.0 | 26.6 |
| 600 m | 1.0 | 1.9 | 4.8 | 9.5 |
| 1000 m | 0.6 | 1.1 | 2.9 | 5.7 |

The café 28 m away, the most recognisable target in the New York sample, is **36 degrees wrong on a
perfectly ordinary 20 m GPS fix**. A target far enough to be safe, beyond 600 m, is a target the user cannot
see from a window. **The requirement contradicts itself**, so the form is dead and no tuning rescues it.

This also disposes of the mosque idea in `PROPOSALS.md` D7 on stronger grounds than were available then: a
mosque 300 m away inherits 3.8 degrees from a 20 m fix before any question of how the building is oriented.

---

## 4. The street bearing is IMMUNE to position error, because it is intrinsic

A street's compass bearing is a fact of the ground held in the tile. It does not depend on where the user is
standing, so **position error cannot bend it.** It can only cause the app to name a *different* street.

That distinction is everything, and the first measurement hid it. Asking "does position error change which
street we name", the answer looks alarming:

| Place | 20 m | 50 m | 100 m |
| --- | --- | --- | --- |
| London | 100% same | 76% | 49% |
| Jakarta | 100% | 100% | 89% |
| Makkah | 93% | 65% | 51% |
| **New York** | **80%** | **49%** | **21%** |

**Read naively, New York at 21% says the feature is broken.** It says nothing of the kind.

---

## 5. The correction: the sentence self-corrects, measured at 0.000 degrees

The instruction is `turn = qibla - bearing(street)`. If position error makes the app name a different
street, it also recomputes the turn **for that street**. The user executes it against the street they can
see, whose bearing is the true one. The two errors cancel exactly.

Measured by executing the instruction from the TRUE position, for whatever street the error-shifted fix
named, 300 samples per cell:

| Place | Position error | Named the same street | **Mean delivered error** | Worst | Over 5 deg |
| --- | --- | --- | --- | --- | --- |
| London | 100 m | 49% | **0.001 deg** | 0.00 | 0/300 |
| Jakarta | 100 m | 89% | **0.000 deg** | 0.00 | 0/300 |
| **New York** | **100 m** | **21%** | **0.000 deg** | 0.00 | 0/300 |
| Makkah | 20 m | 93% | 0.679 deg | 1.50 | 0/300 |
| Makkah | 50 m | 65% | 1.738 deg | 3.82 | 0/300 |
| **Makkah** | **100 m** | **51%** | **2.985 deg** | **7.66** | **56/300** |

**New York names a different street four times out of five and still delivers the qibla to three decimal
places.** The naming accuracy is a *findability* measure, not an accuracy measure: it says how often the
user is pointed at the road they expected, never how wrong the direction is.

**So position accuracy buys recognisability, not correctness.** That inverts the requirement and it is the
opposite of what the previous session assumed when it specified a 1 km position column.

---

## 6. The one real exception, and it is the place that matters most

**Makkah is the only place where the delivered error is not zero**, reaching 2.985 degrees mean and 7.66
worst at a 100 m fix, with 56 of 300 samples over 5 degrees.

The cause is not the street rule. It is the settled near-Makkah geometry: within a few kilometres of the
Kaaba the qibla bearing changes rapidly with position, so the `qibla` term genuinely moves while the street
term does not, and the cancellation stops being exact. Session 37 measured the same effect from Jeddah,
where a 50 km error swings the bearing 49.4 degrees.

**This is a known, bounded, local effect and the design must name it rather than average it away.** Inside
Makkah the honest answer is that the user can see the Haram, and no app should be telling someone in the
Haram which way to face.

---

## 7. The ambiguity defect, found and fixed before it shipped

"Stand along Whitehall, then turn 53 degrees to the left" is **180-degree ambiguous**. A street is a line
with two directions. A user facing north along Whitehall and a user facing south along it both follow that
instruction faithfully and end up 106 degrees apart.

Resolving it needs a facing, and a facing needs the compass this feature exists to avoid. **So the sentence
can never stand alone: it must be read against the drawn map**, where the ray is shown against the street
pattern and the ambiguity disappears because the picture has only one orientation.

That is the argument for drawing the map at all, and it is stronger than the original one. The map is not a
nicer presentation of the sentence. **The map is what makes the sentence unambiguous.** The sentence is what
makes the map checkable. Neither ships alone.

---

## 8. The filter, built from the tag data rather than guessed

The first probe named **"IRT Lexington Avenue Line"** as New York's reference. That is a subway: invisible
from the pavement, and a user who went looking for it would find nothing. Enumerating every `kind` across
the four tiles gave the rule:

| Rejected | Why | Seen as |
| --- | --- | --- |
| `rail/*` | Underground or fenced off | "IRT Lexington Avenue Line", "Jubilee Line", "Northern Line" |
| `path/sidewalk`, `path/crossing` | Shares its parent road's bearing, and names the same thing twice | "The Mall", "Victoria Embankment" |
| `path/steps`, `path/corridor` | Not a line anyone sights along | "Watergate Walk" |
| `minor_road/service` | Car parks and delivery lanes, rarely signposted | "Lower Robert Street" |
| any `is_tunnel` | Cannot be seen | Makkah's `نفق طريق الملك عبدالعزيز` |
| chord under 40 m | Too short to sight along | "Scotland Place", 45 m |
| straightness under 0.95 | A bent road has no single direction | measured as chord over path length |

Kept: `highway`, `major_road`, `minor_road`, `other/living_street`, which is what Jakarta's kampung lanes
are tagged as and they are the real streets there.

**`name` is present and the localised `name:ar`, `name:id`, `name:ur`, `name:tr`, `name:bn`, `name:fr`,
`name:de` keys are all in the roads layer**, which row 39 will want. Makkah's tile returns
`طريق المسجد الحرام` in Arabic already.

---

## 9. What this changes in the plan

1. **The landmark rung and the map rung are ONE feature, not two.** They were separate rungs in
   `PROPOSALS.md`. They cannot be: the sentence is ambiguous without the picture and the picture is
   uncheckable without the sentence.
2. **Pointing at a POI is cut**, with the arithmetic in section 3 as the reason. So is the mosque rung.
3. **Position accuracy is a findability requirement, not an accuracy one**, so `Balanced` accuracy is
   correct and nothing needs tightening.
4. **Makkah needs its own state**, section 6.
5. **The street filter is specified**, section 8, from the data rather than from judgement.

## 10. What I attacked in my own conclusion

- **The first reading of my own table was wrong and I nearly shipped it.** "New York 21% same street" was
  written down as a failure before I asked what reaches the user. The self-consistency script exists
  because the number was suspiciously bad for a method whose terms are both intrinsic.
- **0.000 degrees is a suspicious number and I checked it is not a tautology.** It is not: the script
  computes the turn from the BELIEVED position's qibla and executes it against the TRUE street bearing, so
  the two are genuinely different quantities. Makkah returning 2.985 on the same code path is the proof
  that the measurement can produce a non-zero answer.
- **Four tiles is a thin sample** and three of the four are dense downtowns. Rural coverage is measured
  separately and is the known hole: `P3` found rural Wales has no named road at any zoom.
- **The straightness and length thresholds are judgement**, not measurement. 0.95 and 40 m were chosen
  because they excluded the cases that looked wrong by eye in the four samples, which is exactly the kind
  of fixture-blind tuning this project has been burned by. They are recorded as assumptions.
