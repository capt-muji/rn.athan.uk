# Step 4: The screen: the world map, the arrow and the haptic

0. **Anchor check.**

```bash
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/43-qibla-haptic/scripts/anchors/4-1.txt components/sheets/screens/Qibla.tsx
```

Must print `1`. Anything else is NEEDS REPLAN.

1. **Goal.** Replace the street screen with a north-locked world map carrying the user, the Kaaba, the curved
   path and a facing arrow, and tap the user's hand once each time they turn onto the line.

2. **Branch.** `feat/43-the-screen`, already created in step 2. Do not branch again.

3. **Files.**

**Deleted:**
- `hooks/useQiblaMap.ts` and `hooks/__tests__/useQiblaMap.test.ts`
- `components/qibla/QiblaMap.tsx` and `components/qibla/__tests__/QiblaMap.test.tsx`
- `components/qibla/mapProjection.ts` and `components/qibla/__tests__/mapProjection.test.ts`
- `shared/qiblaStreet.ts` and `shared/__tests__/qiblaStreet.test.ts`
- `shared/qiblaSentence.ts` and `shared/__tests__/qiblaSentence.test.ts`

**Changed:**
- `components/sheets/screens/Qibla.tsx`
- `device/tiles.ts` (gains `tilesForWorld`)

**New:**
- `components/qibla/WorldMap.tsx` and `components/qibla/__tests__/WorldMap.test.tsx`
- `hooks/useQiblaWorld.ts` and `hooks/__tests__/useQiblaWorld.test.ts`

**Before deleting anything, confirm nothing else imports it:** run `codegraph_explore` with the symbol names
`nearbyStreets rankStreets qiblaFromStreet qiblaSentence useQiblaMap projectToCanvas rayEndpoint` and read its
blast radius. If any caller outside the deleted set appears, STOP and ask.

4. **Tests first (red).**

**Suite `hooks/__tests__/useQiblaWorld.test.ts`, new.** Follow `hooks/__tests__/` conventions; the `unit`
project has its own `hookHarness.ts` and **`renderHook` does not exist there** (session 41 met this).

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `reads nothing until start is called` | Performance Design Rule 7 | mount only | `readPosition` not called; state is `{status:'looking'}` |
| `reports unavailable when there is no position` | The honest empty state | `readPosition` resolves null | state `{status:'unavailable'}` |
| `carries the qibla and the path once the position is known` | The screen's inputs | `readPosition` resolves London | `status` is `'ready'`; `qibla` `toBeCloseTo(118.876, 3)`; `path` length `PATH_SEGMENTS + 1` |
| `still reports ready when no tile could be fetched` | **A map with no coastline is degraded, not broken** | `tilesForWorld` rejects | `status` is `'ready'` and `land` is `[]` |

**Suite `components/qibla/__tests__/WorldMap.test.tsx`, new**, in the `components` project.

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `draws the path as many segments, never as one straight line` | **The rhumb-line defect** | a 33-point path | the element with `testID` `qibla-path` has a `d` prop with at least 32 `L` commands |
| `marks the user and the Kaaba` | Both ends are visible | London and `KAABA` | `qibla-here` and `qibla-kaaba` are both present |
| `names both places and nothing else` | 🐋  "hide all the names except..." | `cityName` `'London'` | exactly two `Text` nodes, reading `London` and `Makkah` |
| `turns the arrow to the heading it is given` | The arrow is the only moving part | `heading` `90` | `qibla-facing` carries a transform whose `matrix` encodes a quarter turn |

Assert on the **`matrix` prop**, never on `rotate`: `react-native-svg` resolves any transform into a matrix,
and asserting on `rotate` printed SURVIVED against a genuinely broken dial in session 37.

Command:

```bash
npx jest hooks/__tests__/useQiblaWorld.test.ts --watchman=false --selectProjects=unit
npx jest components/qibla/__tests__/WorldMap.test.tsx --watchman=false --selectProjects=components
```

**Before the change** both fail with `Cannot find module`.

5. **Change.** This step is **(specified)**.

### 5.1 `device/tiles.ts` gains `tilesForWorld`

| Field | Value |
| --- | --- |
| Signature | `(here: Position) => Promise<DecodedTile[]>` |
| Answers | The decoded z3 tiles whose grid bounds the user and the Kaaba |
| Never does | Fetch more than the bounding grid; throw when a tile is missing from the archive |
| Throws | Nothing. A tile that cannot be fetched is omitted from the result |
| Logs | On a failed tile, `logger.warn({ tile }, 'Tile unavailable for the world map')` |

Add a module constant `WORLD_ZOOM = 3`, whose comment gives the WHY: the level where the user and the Kaaba
fit one phone canvas, measured at a 2 by 2 grid for London. Reuse the existing fetch, cache and decode path;
only the zoom and the grid differ from `tilesAround`.

### 5.2 `hooks/useQiblaWorld.ts`

Returns `{ state, start }`, in the shape `useQiblaMap` used, so the sheet's `onPresent` wiring is unchanged.

```ts
export type QiblaWorldState =
  | { status: 'looking' }
  | { status: 'unavailable' }
  | {
      status: 'ready';
      here: Position;
      qibla: number;
      path: Position[];
      land: Position[][];
      cityName: string;
    };
```

`start` reads the position, and on null sets `unavailable`. Otherwise it computes `qiblaBearing(here)` and
`greatCirclePath(here, KAABA)`, then awaits `tilesForWorld(here)` and takes the `earth` layer's parts as
`land`. **A failure or an absent `earth` layer leaves `land` as `[]` and the status still `ready`**: the path
and the markers are what the user acts on, and a missing coastline must never blank the screen.

`cityName` comes from the nearest feature in the tiles' `places` layer, or `'You'` when none is found.

**Nothing runs at mount.**

### 5.3 `components/qibla/WorldMap.tsx`

Props: `here`, `kaaba`, `path`, `land`, `cityName`, and `heading: SharedValue<number>`.

It draws, in this order: the `land` shapes in `COLORS.text.muted`, the `path` as one `Path` with `testID`
`qibla-path`, a `Circle` `qibla-here` at the user, a `Circle` `qibla-kaaba` at the Kaaba, the two `Text`
labels, and last the facing arrow `qibla-facing`, a `Path` rotated by `heading` about the user's point.

The projection is equirectangular in longitude and Mercator in latitude, bounded by the two places plus a
3-degree margin, which is what the planning session measured the 27.4 px curve sag against.

**Memoise the map on everything except `heading`.** The arrow is animated with `useAnimatedProps` so only it
re-records: `react-native-svg` re-walks its whole pipeline on any attribute change, measured at 1.33 to 1.87 ms
per path.

**Visuals:** reuse `COLORS`, `SPACING`, `RADIUS` and `TEXT` from `shared/constants`. Introduce no new colour
and no new size. **`SIZE.contentPadding` and `COLORS.activeBackground` do not exist**; session 41 invented both.

### 5.4 `components/sheets/screens/Qibla.tsx`

Keep `Sheet`, its title, subtitle, icon, snap points, `perfName` and `stackBehavior` exactly as they are.

The sensor lives in a child rendered only while the sheet is open, because `useAnimatedSensor` subscribes for
its component's life and every sheet is mounted from launch:

```tsx
const HeadingSensor = ({ heading, qibla, onCrossed }: {
  heading: SharedValue<number>;
  qibla: number;
  onCrossed: () => void;
}) => {
  const rotation = useAnimatedSensor(SensorType.ROTATION, {
    interval: SENSOR_INTERVAL_MS,
    iosReferenceFrame: IOSReferenceFrame.XTrueNorthZVertical,
  });
  ...
};
```

**`iosReferenceFrame: IOSReferenceFrame.XTrueNorthZVertical` is mandatory and is given verbatim.** Reanimated's
default is `Auto`, which resolves to an ARBITRARY frame whose yaw zero is wherever the phone woke up, so a
compass built on the default points at nothing. This cost session 40 a whole session to find.

`SENSOR_INTERVAL_MS` is `100`.

The reaction reads `rotation.sensor.value.yaw`, turns it into a bearing with
`normaliseHeading(-yaw / DEGREES_TO_RADIANS + IOS_AXIS_CORRECTION)` on iOS and
`normaliseHeading(-yaw / DEGREES_TO_RADIANS)` on Android, writes it to `heading`, then calls `stepAlignment`
with a state held in a `useSharedValue`. When `hasCrossed` is true it calls `runOnJS(onCrossed)()`.

`IOS_AXIS_CORRECTION` is `180`, and its comment must record that it is an axis relationship, so only a multiple
of 90 is defensible, and that tuning it to a room's reading was tried and reverted.

**The declination correction is NOT applied on iOS.** `XTrueNorthZVertical` is already true-north referenced,
so correcting again bends the needle by twice the local declination.

`onCrossed` is `() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`, matching the ten existing call
sites in this repo.

**One `runOnJS` per crossing, never per sample.** That is the whole reason `stepAlignment` returns a boolean.

6. **Green.** Both commands in part 4 pass. Coverage of every new file is 100% on all four measures. tsc and
   Biome exit 0. `shared/__tests__/unusedExports.test.ts` passes, because this step adds the consumers for
   steps 2 and 3.

7. **Breaks.** `bash ai/plans/43-qibla-haptic/scripts/breaks-4.sh`, ending `ALL AS EXPECTED: 1`.

**Run `npx biome check . --write` BEFORE the break script, never after.** A formatter that rewraps an
assignment moves a break's search text and the break silently stops testing anything (session 41, measured).

8. **Records.** None: step 5 writes them.

9. **Version, commit, review, merge.** This one commit covers steps 2, 3 and 4.

```
<VERSION> - feat(qibla): the direction is felt, not read

The Qibla screen is a north-locked world map with the user, the Kaaba, the great-circle path
between them and an arrow showing where the phone points. The user turns their body until the
phone taps their hand once. Nothing has to be read.

The screen this replaces stated "turn 49 degrees to the left", and no person can estimate that
by eye. It also needed a street the user could see, which is no use in a windowless room or a
shopping centre, and that requirement is what brings the sensor back.

The path is drawn as a great-circle curve, never a straight line. A straight line on a
north-locked map is the rhumb line, which departs 14.583 degrees from the true qibla in London
and 71.31 in Los Angeles. The curve departs 0.493 out.

The haptic uses hysteresis, entering alignment at 4 degrees and leaving at 8. A single threshold
was measured firing 49 taps in 100 samples of 0.3-degree jitter, which is the continuous buzz
the owner refused. A crossing is also bounded to 90 degrees from the line, because the signed
offset changes sign at the antipode too, so an unbounded test taps when the user faces away
from Makkah.

The heading is the OS-fused rotation vector through Reanimated, with the iOS reference frame set
explicitly to XTrueNorthZVertical: the default is an arbitrary frame whose yaw zero is wherever
the phone woke up. The sensor is mounted only while the sheet is open.

Known and accepted: the magnetometer measured 30 degrees wrong indoors and drifts at a fixed
spot, so the tap can arrive at the wrong angle in a room with steel in it. The owner ruled to
ship on it as it is. The two unbuilt rescue levers are named in the row's brief.
```

Review checklist, reading your own diff back cold:
- `iosReferenceFrame` is `XTrueNorthZVertical`, spelled exactly.
- Declination is not applied on iOS.
- The sensor child is rendered only while the sheet is open.
- `runOnJS` fires once per crossing, not per sample.
- The path element has many segments, not two points.
- No new colour, size or spacing value, and no invented constant.
- Nothing outside the listed files changed.
- Comments explain why, never what.

Merge:

```
git checkout uat-2 && git merge --no-ff feat/43-the-screen -m "Merge feat/43-the-screen into uat-2: session 43 steps 2 to 4, reviewed"
```

10. **Stopping part-way.** `git checkout -- components/sheets/screens/Qibla.tsx device/tiles.ts app.json package.json`, restore every deleted file with `git checkout -- <path>`, and delete the new files listed in part 3.
