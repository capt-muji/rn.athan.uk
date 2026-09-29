# P0: the error budget, and the number that decides the row

Computed in this planning session, 2026-09-29, with `node` against the great-circle formula the app already
ships (`shared/qibla.ts`, `adhan@4.4.6`). Every figure below is reproducible arithmetic, not a citation.

## The question this answers

Sessions 37 and 40 both shipped correct code and neither made the feature trustworthy. Before designing a
third attempt, one number has to exist: **how wrong is a human aligning a line on a map, compared with how
wrong the sensor already is?** If eye alignment is not materially better than the fused sensor, the map is
not worth building and the row should change.

## 1. Position tolerance, re-confirmed

Worst-case bearing error over all directions of displacement:

| City | Qibla | 1 km | 10 km | 50 km |
| --- | --- | --- | --- | --- |
| London | 119.0 | 0.018 | 0.18 | 0.91 |
| Cairo | 136.1 | 0.048 | 0.48 | 2.40 |
| Jakarta | 295.2 | 0.004 | 0.04 | 0.18 |
| New York | 58.5 | 0.008 | 0.08 | 0.40 |
| Istanbul | 151.6 | 0.030 | 0.30 | 1.49 |
| **Jeddah** | 101.1 | **0.832** | **8.35** | **46.60** |

This matches session 37's finding and adds the 1 km column, which is the one a map needs: at 1 km of
position error the bearing moves under 0.05 degrees everywhere except near Makkah. **A coarse fix is ample
for drawing a map line, and the map's own centring is never the limiting term.** Jeddah remains the
exception that any design must handle.

## 2. The new number: what a human costs when aligning by eye

Decomposed into independent terms, each an engineering estimate flagged as such:

| Term | Degrees | Basis |
| --- | --- | --- |
| Reading the line on screen | 0.5 | Human orientation acuity is sub-degree for a straight line against a reference. UNVERIFIED as a citation; used as a floor, and it is the smallest term either way |
| Judging which way the street runs, on the map | 2.0 | Estimate. A straight street is better, a curved one worse |
| Matching that street to the one they can see | 3.0 | Estimate. The dominant term outdoors |
| Transferring the angle to their own body or mat | 5.0 | Estimate. The dominant term overall, and the one nobody can remove |
| **RSS total** | **6.2** | Independent errors combine in quadrature |
| **Worst case, all aligned** | **10.5** | Every term pushing the same way |

The four terms are estimates, not measurements, and that is stated plainly. R4's literature search should
replace them with published figures where any exist. What matters is the COMPARISON, which is robust to
large changes in any single term.

## 3. The comparison that justifies or kills the row

| Method | Error, degrees | Source |
| --- | --- | --- |
| Map alignment by eye, RSS | 6.2 | Derived above |
| Fused sensor, open floor | 9.7 | Measured on the Find X8, session 40 `LOG.md` |
| Map alignment by eye, worst case | 10.5 | Derived above |
| **Fused sensor, indoors near steel** | **30.0** | Measured in the owner's room, session 40 `LOG.md` |
| `expo-location` raw magnetometer | 71.1 | Measured on the Find X8, session 40 `LOG.md` |

**The row survives this test, and the reason is narrower than the row's own framing.** Eye alignment beats
the fused sensor on open floor by about 3.5 degrees, which alone would not justify a session. It beats the
indoor sensor reading by **24 degrees**, and indoors is where prayer happens. So the map's value is not that
it is more precise; it is that **its error does not grow when the user steps near a wall**, which is exactly
the failure that made the owner ready to scrap the feature.

**The honest counterpoint, for the adversarial review:** the 5-degree body-transfer term applies to the
compass too, and session 40's figures are needle error, not what the user ends up facing. Adding it to both
puts the sensor at 10.9 open-floor against the map's 6.2, and the gap narrows. The indoor comparison is
unaffected and is the one that decides.

## 4. Does the error matter at all?

| City | Distance to Makkah | Kaaba subtends | A 5-degree error misses by |
| --- | --- | --- | --- |
| Jeddah | 69 km | 32.9 arcsec | 6 km |
| Cairo | 1,287 km | 1.76 arcsec | 113 km |
| Istanbul | 2,405 km | 0.94 arcsec | 210 km |
| London | 4,794 km | 0.47 arcsec | 419 km |
| Jakarta | 7,920 km | 0.29 arcsec | 693 km |
| New York | 10,306 km | 0.22 arcsec | 902 km |

**The Kaaba subtends under half an arcsecond from London.** Hitting it geometrically is impossible for
anyone outside Makkah, by five orders of magnitude, whatever the sensor.

This is not a licence to be sloppy. It is the reason the fiqh distinction between `ayn al-Ka'bah` (the
structure itself) and `jihat al-Ka'bah` (its direction) exists, and it tells the design where to aim: the
goal is the DIRECTION being right to a few degrees, and any presentation that claims more than that is
claiming something physically unavailable. R3 sources the scholarly positions and the accepted tolerance.

## What I attacked in my own conclusion

- **The four human-error terms are estimates and the total is the sum of guesses.** Tested by asking what
  breaks the conclusion: the indoor comparison survives even if every term doubles (12.4 RSS against 30).
  Only the open-floor comparison is sensitive, and it is not the one the row rests on.
- **I checked whether the body-transfer term cancels.** It does not cancel, it applies to both methods, and
  including it on both sides is the fair comparison. Recorded above rather than buried, because it weakens
  the row's marketing and does not weaken its case.
- **I tested the 1 km column against the Jeddah exception** rather than quoting the comfortable cities: near
  Makkah a 1 km error is already 0.83 degrees, so the map's own position handling needs the same special
  case the dial needed.
