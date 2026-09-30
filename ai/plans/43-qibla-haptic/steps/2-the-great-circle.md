# Step 2: The great-circle path, as drawn positions

0. **Anchor check.** None: this step adds one new file and its suite.

1. **Goal.** Return the path from the user to the Kaaba as a list of positions that bends, so the drawn picture
   agrees with the bearing instead of contradicting it by 14.6 degrees.

2. **Branch.** `git checkout -b feat/43-the-screen uat-2`. This branch carries steps 2, 3 and 4: see step 3's
   sequencing note.

3. **Files.**
   - `shared/greatCircle.ts` (new)
   - `shared/__tests__/greatCircle.test.ts` (new)

4. **Tests first (red).**

Suite: `shared/__tests__/greatCircle.test.ts`, new.

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `starts at from and ends at to` | The path spans the two places | London `{latitude:51.475,longitude:-0.2015}` to `KAABA` | length is `PATH_SEGMENTS + 1`; `path[0].latitude` `toBeCloseTo(51.475, 9)`; `path[PATH_SEGMENTS].longitude` `toBeCloseTo(KAABA.longitude, 9)` |
| `departs along the qibla bearing, which a straight line does not` | **The rhumb-line defect** | London, Los Angeles `{latitude:34.0522,longitude:-118.2437}`, New York `{latitude:40.7128,longitude:-74.006}` | for each, `bearingTo(here, path[1])` `toBeCloseTo(qiblaBearing(here), 3)` |
| `holds the qibla bearing at every point along the path, which is what a great circle means` | The path is a great circle for its whole length, not only at its start | London, LA, New York | for every `point` from `0` to `PATH_SEGMENTS - 1`, `bearingTo(path[point], path[point+1])` `toBeCloseTo(qiblaBearing(path[point]), 3)` |
| `bends away from the straight line between the two places` | The curve is visibly a curve | Los Angeles to `KAABA` | the midpoint's latitude differs from the straight midpoint's by `toBeGreaterThan(30)` |
| `steps an equal arc every segment, which only true interpolation does` | **The three subtle breaks** | London, LA, New York | the hops sum to the direct arc, `toBeCloseTo(1, 6)`, AND `max(hops)/min(hops)` `toBeCloseTo(1, 6)` |
| `returns two points when from and to are the same place` | The zero-arc case cannot divide by zero | `KAABA` to `KAABA` | length `toBe(2)` |

**The last three rows exist because the break script caught this plan's own first draft, and each cost a
diagnosis. Do not weaken them.**

- **The even-spacing assert is the only thing that catches three of the seven breaks.** A linear `toWeight`, a
  halved `arc` and a broken haversine all leave the path ON the great circle and leave both endpoints exactly
  right, so a bearing test and a total-length test both pass. Only the point SPACING changes: measured, a
  correct path gives `max/min` of exactly `1.000000`, while those three give `1.155330`, `1.108577` and
  `1.072947`.
- **Use an arc, never `distanceInMetres`.** That helper's own doc says "nearby positions": it is a flat
  approximation and is wrong over 4,796 km. The test declares its own local `arcBetween`, the angle subtended
  at the centre of the Earth, which is the only length that is exact at this range.
- **Los Angeles must be in the list.** Its straight-line departure is 94.12 degrees against a true 23.86, a
  70.26-degree difference, so it is the case a straight implementation cannot survive. London alone is not
  enough, and the first draft of this suite passed against a linear implementation because of it.

**The `departs along the qibla bearing` row's shape was corrected during planning.** The naive assertion,
that the bearing measured AT `path[1]` equals the qibla, is WRONG and fails: along a great circle the bearing
changes continuously, so at `path[1]` London already reads 120.330 against 118.876. The correct assertion is
the bearing FROM the user TO `path[1]`, which is the direction the drawn curve leaves at, and that matches to
3 decimals. Los Angeles is in the list because its straight-line error is 71.31 degrees, so a straight
implementation cannot pass it.

Command:

```bash
npx jest shared/__tests__/greatCircle.test.ts --watchman=false --selectProjects=unit
```

**Before the change** every row fails with:

```
Cannot find module '@/shared/greatCircle' from 'shared/__tests__/greatCircle.test.ts'
```

5. **Change.** This step is **(specified)**.

Create `shared/greatCircle.ts`.

**`PATH_SEGMENTS`**, exported, `32`. Its comment gives the WHY: enough segments that the drawn curve's
departure agrees with the bearing to under half a degree. Measured at 0.493 degrees in London.

**`greatCirclePath`**

| Field | Value |
| --- | --- |
| Signature | `(from: Position, to: Position) => Position[]` |
| Answers | `PATH_SEGMENTS + 1` positions along the great circle, the first `from` and the last `to` |
| Never does | Interpolate latitude and longitude linearly, which is the rhumb line; divide by zero when the two places coincide |
| Throws | Nothing |
| Logs | Nothing |

The method is spherical linear interpolation, given verbatim because every term matters:

- `arc = 2 * asin(min(1, sqrt(sin²((toLat-fromLat)/2) + cos(fromLat)*cos(toLat)*sin²((toLon-fromLon)/2))))`,
  in radians.
- When `arc` is `0`, return `[from, to]` and do nothing else.
- For each `segment` from `0` to `PATH_SEGMENTS`, with `fraction = segment / PATH_SEGMENTS`:
  - `fromWeight = sin((1 - fraction) * arc) / sin(arc)`
  - `toWeight = sin(fraction * arc) / sin(arc)`
  - `x = fromWeight*cos(fromLat)*cos(fromLon) + toWeight*cos(toLat)*cos(toLon)`
  - `y = fromWeight*cos(fromLat)*sin(fromLon) + toWeight*cos(toLat)*sin(toLon)`
  - `z = fromWeight*sin(fromLat) + toWeight*sin(toLat)`
  - the position is `{ latitude: atan2(z, hypot(x, y)), longitude: atan2(y, x) }`, converted to degrees.

All latitudes and longitudes are converted to radians on entry with a module constant
`DEGREES_TO_RADIANS = Math.PI / 180`.

6. **Green.** `Tests: 3 passed, 3 total`, coverage of `shared/greatCircle.ts` 100% on all four measures, tsc
   and Biome 0.

**Proven in the planning session's scratch worktree**, including the corrected assertion.

7. **Breaks.** `bash ai/plans/43-qibla-haptic/scripts/breaks-2.sh`, ending `ALL AS EXPECTED: 1`.

8. **Records.** None.

9. **Commit.** None of its own: step 4 carries the commit for steps 2, 3 and 4 together.

10. **Stopping part-way.** Delete `shared/greatCircle.ts` and `shared/__tests__/greatCircle.test.ts`.
