# Step 1: Our own qibla bearing, with no `adhan`

0. **Anchor check.** None: this step changes whole functions named below, and `shared/qibla.ts` is small enough
   that the contract locates them.

1. **Goal.** Compute the qibla from our own spherical trigonometry and our own sourced coordinates, so the one
   number this app must never get wrong is ours to audit rather than borrowed.

2. **Branch.** `git checkout -b feat/43-own-bearing uat-2`

3. **Files.**
   - `shared/qibla.ts` (changed)
   - `shared/__tests__/qibla.test.ts` (changed: rows added, none removed)

4. **Tests first (red).**

Suite: `shared/__tests__/qibla.test.ts`, existing.

**Every one of the 29 existing tests must keep passing unchanged.** They assert `qiblaBearing` to 3 decimal
places against known cities, and they are the proof that our implementation agrees with the one that shipped.
Do not edit them.

Add these rows to the same suite:

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `reads the Kaaba from the surveyed footprint, not from a library` | The coordinates are the sourced ones | none | `KAABA` equals `{ latitude: 21.4225, longitude: 39.8262 }` exactly |
| `gives the bearing between any two places, not only to the Kaaba` | `bearingTo` is general | `bearingTo({latitude:0,longitude:0},{latitude:0,longitude:10})` | `toBeCloseTo(90, 6)` |
| `agrees with the qibla when the destination is the Kaaba` | The two entry points cannot drift | London `{latitude:51.475,longitude:-0.2015}` | `bearingTo(london, KAABA)` equals `qiblaBearing(london)` |
| `points due north from directly south of the Kaaba` | The formula's north term | `{latitude:0,longitude:39.8262}` | `toBeCloseTo(0, 6)` |

Command:

```bash
npx jest shared/__tests__/qibla.test.ts --watchman=false --selectProjects=unit
```

**Before the change**, the four new rows fail. The first failing line is:

```
Cannot find module '@/shared/qibla' or its corresponding type declarations
```

for `bearingTo`, reported by tsc, and at runtime:

```
TypeError: (0 , _qibla.bearingTo) is not a function
```

If any of the 29 existing tests fails, STOP: the coordinates have changed the answer and that is not this
step's intent.

5. **Change.** This step is **(specified)**: build it from the contracts.

**Delete** the `import { Coordinates, Qibla } from 'adhan';` line. After this step nothing in `shared/`,
`device/`, `hooks/`, `components/`, `app/` or `stores/` imports `adhan`.

**Change the constant.** `KAABA` becomes exactly:

```ts
export const KAABA: Position = { latitude: 21.4225, longitude: 39.8262 };
```

Its doc comment explains WHY these numbers and nothing else. It must say that the value is the independently
sourced one, agreeing with OpenStreetMap's surveyed footprint of the building to 8.27 m, which is 0.34
arcseconds of bearing from London. It must NOT restate what the numbers are.

**Add a module constant** `DEGREES_TO_RADIANS = Math.PI / 180`.

**Add `bearingTo`.**

| Field | Value |
| --- | --- |
| Name | `bearingTo` |
| Signature | `(from: Position, to: Position) => number` |
| Answers | The initial great-circle bearing from one position to another, in degrees clockwise from true north, in `[0, 360)` |
| Never does | Return a rhumb-line bearing, a negative number, or a value at or past 360 |
| Throws | Nothing |
| Logs | Nothing |

It is the spherical law of sines. The two terms are:

```
east  = sin(longitudeSpan) * cos(toLatitude)
north = cos(fromLatitude) * sin(toLatitude) - sin(fromLatitude) * cos(toLatitude) * cos(longitudeSpan)
```

and the bearing is `normaliseHeading(atan2(east, north) / DEGREES_TO_RADIANS)`, where `longitudeSpan` is
`(to.longitude - from.longitude) * DEGREES_TO_RADIANS`. Those five lines are given verbatim because every term
matters and a swapped `east`/`north` produces a plausible wrong answer.

**Change `qiblaBearing`** to `(position: Position): number => bearingTo(position, KAABA)`. Keep its existing
doc comment's point about great circle versus rhumb line.

`normaliseHeading` and `shortestDelta` are unchanged.

6. **Green.** The command in part 4 reports `Tests: 33 passed, 33 total`. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings` both exit 0.

**Proven in the planning session's scratch worktree:** this exact change passes all 29 existing tests with no
edit to any of them, tsc exits 0 and Biome exits 0.

7. **Breaks.** `bash ai/plans/43-qibla-haptic/scripts/breaks-1.sh`, which must end `ALL AS EXPECTED: 1`.

8. **Records.** None: the final step writes them.

9. **Version, commit, review, merge.**

Commit message:

```
<VERSION> - feat(qibla): our own bearing, from our own sourced coordinates

The qibla no longer comes from adhan. The bearing is the spherical law of sines, twelve lines
this repo owns and tests to the arcsecond, and the Kaaba's position is sourced independently.

Five sources were compared: OpenStreetMap's surveyed building footprint (way 103914569, whose
area centroid is 21.4224868, 39.8261262 and whose five sides measure 10.15, 9.15, 2.51, 10.17
and 12.00 m, so it is genuinely the building), Wikidata Q29466, the Wikipedia geo API,
latlong.net, and adhan's own value. They disagree by at most 8.27 metres, which is 0.34
arcseconds of bearing from London.

The maths was never the defect, and this change does not pretend otherwise: it moves the answer
by nine millionths of a degree. It ships because it removes a dependency from the one number the
app must never get wrong. All 29 existing bearing tests pass unchanged, which is the evidence
that our implementation agrees with the one it replaces.
```

Review checklist, read your own diff back cold:
- `adhan` appears nowhere in `shared/`, `device/`, `hooks/`, `components/`, `app/` or `stores/`.
- `KAABA` is exactly `21.4225, 39.8262`.
- The 29 existing tests are byte-identical.
- `east` and `north` are not swapped: London reads 118.876, not something near 61.
- Comments explain why, never what.

Merge:

```
git checkout uat-2 && git merge --no-ff feat/43-own-bearing -m "Merge feat/43-own-bearing into uat-2: session 43 step 1, reviewed"
```

10. **Stopping part-way.** `git checkout -- shared/qibla.ts shared/__tests__/qibla.test.ts app.json package.json`.
