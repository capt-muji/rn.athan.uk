# Step 4: The drawn map

0. **Anchor check.** None; this step adds files and is the first caller of steps 1 to 3.

1. **Goal.** Draw the streets around the user with the qibla ray on them, and make every export from steps 1
   to 3 reachable from production code, which is what lets this branch commit at all.

2. **Branch.** Same branch as step 1. **This is the commit point for steps 1 to 4.**

3. **Files.**

| File | Kind |
| --- | --- |
| `components/qibla/mapProjection.ts` | new, copied from `files/components/qibla/mapProjection.ts.txt` |
| `components/qibla/__tests__/mapProjection.test.ts` | new, copied |
| `shared/qiblaSentence.ts` | new, copied from `files/shared/qiblaSentence.ts.txt` |
| `shared/__tests__/qiblaSentence.test.ts` | new, copied |
| `components/qibla/QiblaMap.tsx` | new, built from the contract in part 5 |
| `components/qibla/__tests__/QiblaMap.test.tsx` | new, built from the rows in part 4 |
| `hooks/useQiblaMap.ts` | new, built from the contract in part 5 |
| `hooks/__tests__/useQiblaMap.test.ts` | new, built from the rows in part 4 |

The four copied files are a `(files)` sub-step: copy them and strip the `.txt`. All four were built,
typechecked, linted, tested at 100% and break-tested by the planning session, which measured 15 tests for
the projection and 8 for the sentence. The component and the hook are `(specified)`.

4. **Tests first (red).**

`components/qibla/__tests__/mapProjection.test.ts` and `shared/__tests__/qiblaSentence.test.ts` are carried
whole, 23 tests between them. What they prove: the user at the centre, each of the four compass directions
placed on the right side of it, the radius reaching the canvas edge, the ray at each quarter turn, the ray
drawn at exactly the bearing it is given, and the sentence in each of its forms including a name in another
script.

`hooks/__tests__/useQiblaMap.test.ts`, the state machine:

| Test | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `starts by looking for the position` | The first state | freshly mounted | status `looking` |
| `reports the street and the turn once the tiles arrive` | The happy path | a mocked position and the real London tile | status `ready`, street `Whitehall`, turn 53, side `left` |
| `reports that the location is unavailable when no position comes back` | Permission refused or no fix | `readPosition` returns null | status `unavailable` |
| `reports that there is no map here when the tiles hold no usable street` | The measured rural case | a tile with no named road | status `nomap` |
| `reports that there is no map here when the archive cannot be reached` | Offline, never visited | `tilesAround` returns empty | status `nomap` |
| `reads nothing until it is asked to` | Performance Design Rule 7 | mounted but never started | `readPosition` was not called |

`components/qibla/__tests__/QiblaMap.test.tsx`, what a person sees:

| Test | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `draws a path for every street it is given` | The streets are drawn | 4 streets | 4 street paths are rendered |
| `draws the qibla ray` | The answer is on screen | any state | the ray element is present |
| `names the street in the sentence` | The sentence is the product | Whitehall, 53, left | the text `Stand along Whitehall, then turn 53 degrees to the left` |
| `says the qibla runs along the street when the turn is under 5 degrees` | The degenerate case reads naturally | turn 3 | the text `The qibla runs along Gang Bhakti IV` |
| `says nothing about a street when there is no usable one` | The honest empty state | status `nomap` | the text `No map data for this spot` and no sentence |

Commands, both projects:

```
npx jest components/qibla/__tests__/mapProjection.test.ts hooks/__tests__/useQiblaMap.test.ts --watchman=false --selectProjects=unit
npx jest components/qibla/__tests__/QiblaMap.test.tsx --watchman=false --selectProjects=components
```

Expected before the change: `Cannot find module` for each new path.

5. **Change.**

**`components/qibla/mapProjection.ts`** and **`shared/qiblaSentence.ts`**, copied. Their contracts:

| Export | Signature | Answers | Must never |
| --- | --- | --- | --- |
| `DRAWN_RADIUS_METRES` | `122` | The ground radius drawn | Exceed the measured 49-path budget |
| `projectToCanvas` | `(here: Position, target: Position, canvas: number) => CanvasPoint` | Where a position falls on the canvas | Rotate with the phone |
| `rayEndpoint` | `(bearing: number, canvas: number) => CanvasPoint` | Where the qibla ray ends | Be drawn from anywhere but the centre |
| `qiblaSentence` | `(answer: QiblaFromStreet) => string` | The line under the map | State a turn under 5 degrees, which the map's own alignment cannot support |

**`hooks/useQiblaMap.ts`:**

| Export | Signature | Answers | Must never |
| --- | --- | --- | --- |
| `QiblaMapState` | a discriminated union on `status`: `looking`, `unavailable`, `nomap`, `ready` | What the screen shows | Have a `ready` state without a street |
| `useQiblaMap` | `() => { state: QiblaMapState; start: () => Promise<void> }` | The screen's whole state | Read a position, a tile or a sensor at mount; `start` is called from `onPresent` |

**`components/qibla/QiblaMap.tsx`**, drawing with `react-native-svg`, already installed:

- The street paths, then the qibla ray on top, then a dot at the centre for the user.
- **Memoised on the decoded streets and the bearing**, the lesson from the dial: `react-native-svg`
  re-walks its whole drawing pipeline on any attribute change, measured at 1.33 to 1.87 ms per path on the
  floor device, so a tree that re-records per frame is unaffordable. Nothing here animates, so it records
  once per open.
- **Buildings are drawn beneath the streets and are the first thing to drop** if a device cannot afford
  them: two thirds of the path cost at every radius.

The street sentence comes from `qiblaSentence`, which the plan carries. The three state strings the screen
adds are verbatim, because a person reads them:

- `No map data for this spot` for `nomap`
- `Finding your position` for `looking`
- `Your location is not available right now` for `unavailable`, which is the string the sheet already ships

**The invariant:** every value the screen renders derives from the position and the tile data alone.

6. **Green.** Both commands pass, 100% coverage of the four new modules, tsc and Biome at 0.

**`shared/__tests__/unusedExports.test.ts` must now PASS**, because this step is the caller for steps 1 to 3.
If it still names a symbol, that symbol is genuinely unreachable and the step is incomplete: STOP.

7. **Breaks.** Run `npx biome check --write` FIRST, then
   `bash ai/plans/41-qibla-map/scripts/breaks-4.sh`. The planning session ran it against the formatted code
   and it printed `caught 9 of 9` and `ALL AS EXPECTED: 1`.

8. **Version and commit.** This is the commit for steps 1 to 4.

```
node -e "const p=require('./package.json').version.split('.');p[2]=+p[2]+1;console.log(p.join('.'))"
```

Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`), all three in
step, editing only the version line in each. Add by name: the six files from step 1, the three from step 2,
the four from step 3, the six from this step, `metro.config.js`, `package.json`, `yarn.lock`, `app.json`,
`ai/plans/README.md`, `ai/plans/41-qibla-map/PLAN.md` and `ai/plans/41-qibla-map/LOG.md`.

Commit message, in a heredoc to `$TMPDIR/msg-step4.txt`:

```
<VERSION> - feat(qibla): the qibla against a street the user can see

The qibla screen stops asking the phone which way it is pointing. It reads the map tiles
around the user, finds the nearest street they could sight along, and states the qibla as a
turn from it.

Why a street. A street's bearing is a fact of the ground held in the tile data, so no steel
in the room can bend it. Measured over 300 samples per cell, an error of 100 m in the
position names a different street four times out of five in Manhattan and still delivers the
direction to three decimal places, because the turn is recomputed for whichever street is
named. Position accuracy buys recognisability, not correctness.

Pointing at a landmark instead was measured and rejected: bearing error to a target is
atan(positionError / distance), so a cafe 28 m away is 36 degrees wrong on an ordinary 20 m
fix, and a target far enough to be safe is one the user cannot see.

The tile reader is 200 lines over Uint8Array and TextDecoder, with no Node builtins, no map
library and no API key. fflate carries the gzip at 91 KB with zero transitive dependencies.

Steps 1 to 4 are one commit because the dead-code guard refuses an export with no production
caller, so the modules and their first caller cannot be split.
```

The hook runs the full suite: the last `Tests:` line ends `passed, <n> total`, and four `100%` coverage
lines are present.

9. **Review.** Read `git show <sha>` back cold, as a stranger, and check:

- every contract in steps 1 to 4 matches what was built: names, signatures, and the exact log-line text;
- the sentence strings are exactly as written above;
- no magnetometer, accelerometer or gyroscope is read anywhere in the diff;
- nothing draws a straight Mercator line toward Makkah;
- no tile is fetched, read or decoded at mount;
- comments explain why, never what;
- `metro.config.js` changed only inside the anchor;
- nothing beyond the listed files changed.

A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

```
git checkout uat-2 && git merge --no-ff feat/41-tile-reader -m "Merge feat/41-tile-reader into uat-2: session 41 steps 1 to 4, reviewed"
```

11. **Done when.** Both test commands pass, `unusedExports` passes, coverage is 100% on all four measures,
    tsc and Biome exit 0, the break scripts for steps 1 to 4 each end `ALL AS EXPECTED: 1`, and the merge is
    in `uat-2`.

12. **Stopping part-way.** `git checkout -- metro.config.js app.json package.json` and delete every new file
    listed in steps 1 to 4.
