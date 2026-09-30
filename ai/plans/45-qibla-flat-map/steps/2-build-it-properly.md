# Step 2: Build it properly, at 100%

0. **Anchor check.**

   ```bash
   C() { python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "ai/plans/45-qibla-flat-map/scripts/anchors/$1.txt" "$2"; }
   C 1-1 shared/__tests__/qiblaRemoved.test.ts
   C 2-1 app/_layout.tsx
   C 2-2 components/sheets/index.ts
   C 3-1 components/sheets/screens/Settings.tsx
   C 3-2 components/sheets/screens/Settings.tsx
   C 3-3 stores/ui.ts
   ```

   Expected: `1` six times. Any other count means NEEDS REPLAN.

1. **Goal:** the whole feature, tested to 100% on all four measures, in one commit that leaves `uat-2` green.

2. **Branch:** `git checkout -b feat/45-qibla-flat-map uat-2`

3. **Files.** Nothing else may change, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

   | File | What |
   | --- | --- |
   | `shared/worldPath.ts` | New, copied byte for byte from `ai/plans/45-qibla-flat-map/files/worldPath.ts.txt` |
   | `shared/qiblaGeometry.ts` | New |
   | `shared/qiblaAlignment.ts` | New |
   | `device/qibla.ts` | New |
   | `hooks/useQibla.ts` | New |
   | `components/sheets/screens/Qibla.tsx` | New |
   | `shared/__tests__/qiblaGeometry.test.ts` | New, **copied from `files/qiblaGeometry.test.ts.txt`** |
   | `shared/__tests__/qiblaAlignment.test.ts` | New, **copied from `files/qiblaAlignment.test.ts.txt`** |
   | `device/__tests__/qibla.test.ts` | New, **copied from `files/qibla.device.test.ts.txt`** |
   | `components/sheets/screens/__tests__/Qibla.test.tsx` | New, **copied from `files/Qibla.test.tsx.txt`** |
   | `shared/__tests__/qiblaRemoved.test.ts` | **DELETED** |
   | `components/sheets/screens/Settings.tsx` | The Qibla row (anchors 3-1, 3-2) |
   | `components/sheets/screens/__tests__/Settings.test.tsx` | The Qibla row's tests |
   | `components/sheets/screens/index.ts` | Export `Qibla`. **There are TWO barrels and both need the export**: this one, and the parent below |
   | `components/sheets/index.ts` | Re-export `Qibla` and `BottomSheetQibla` (anchor 2-2) |
   | `app/_layout.tsx` | Mount the new sheet (anchor 2-1) |
   | `__tests__/app/_layout.test.tsx` | The new sheet in its expectations |
   | `stores/ui.ts` | The qibla sheet's atom and actions (anchor 3-3) |
   | `app.json` | `NSLocationWhenInUseUsageDescription`, and the version |
   | `package.json`, `yarn.lock` | `expo-location@58.0.9`, and the version |

   **THE WHOLE FEATURE IS ONE COMMIT AND CANNOT BE SPLIT.** Measured while planning: `unusedExports.test.ts` reports
   every new export as unreachable until a production file imports it (adding the geometry alone reports 6), and
   `qiblaRemoved.test.ts` fails the moment any file named `qibla*` exists (adding two modules fails it with 12 hits).
   So any smaller cut leaves `uat-2` red, exactly as session 44 found for its own deletion. Session 44's guard is
   deleted here: its job was to protect an empty tree, and the tree is no longer empty.

4. **Tests first (red).**

   Read `__tests__/README.md` before writing the first test. Four new suites and two edited ones.

   ### `shared/__tests__/qiblaGeometry.test.ts` (project `unit`, new)

   Two helpers above the `describe` blocks: `screenAngle(from, to)`, degrees clockwise from straight up, as
   `((Math.atan2(to.x - from.x, from.y - to.y) * 180) / Math.PI + 360) % 360`; and `firstSegment(data)`, taking the
   first two points out of an SVG `d` string.

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `reads %s as %p degrees` | The bearing across the range, including a qibla north of east, which is the case a flat-map straight line gets 71 degrees wrong and which London alone would not catch | `it.each` over London 51.475/-0.2015, New York 40.7128/-74.006, Los Angeles 34.0522/-118.2437, Jakarta -6.2088/106.8456, Sydney -33.8688/151.2093, Cairo 30.0444/31.2357 | `qiblaBearing` `toBeCloseTo(expected, 3)` of 118.8756, 58.4817, 23.8571, 295.1517, 277.4996, 136.1373 |
   | `answers 0 to under 360 rather than a negative angle west of Makkah` | The wrap | Los Angeles, and 60/100 | `>= 0` and `< 360` |
   | `puts the equator and the prime meridian at the centre` | The projection's origin and scale | `{ latitude: 0, longitude: 0 }`, size 350 | `toEqual({ x: 175, y: 175 })` |
   | `clamps beyond the projection limit rather than running to infinity` | A polar position still draws | latitude 89.9, size 350 | `y` `toBeCloseTo` the y at `MERCATOR_MAX_LATITUDE` to 9 places, and `Number.isFinite(y)` is `true` |
   | `leaves the user at the true bearing, so the arrow and the line agree` | **The invariant** | London and Los Angeles, size 350 | `screenAngle(...firstSegment(d))` `toBeCloseTo(qiblaBearing(city), 0)` |
   | `curves rather than running straight, so Los Angeles never points east` | The rhumb-line trap: true 23.9, straight line 95.2, so a straight implementation fails by 50 degrees | Los Angeles, size 350 | the first segment's screen angle `toBeLessThan(45)` |
   | `breaks into two sub-paths where the route leaves the map edge` | An antimeridian route is drawn in two pieces, not streaked across the map | Honolulu 21.3069/-157.8583, and London | Honolulu's `d` splits on `M` into 2 pieces, London's into 1 |
   | `ends at Makkah` | The path reaches its destination | London, size 350 | the last point `toBeCloseTo` `projectMercator(KAABA, 350)` to 1 place on both axes |
   | `returns the start itself when the user is at Makkah, rather than dividing by zero` | The degenerate case | `greatCirclePoint(KAABA, 0.5)` | `toEqual({ latitude: KAABA.latitude, longitude: KAABA.longitude })` |

   ### `shared/__tests__/qiblaAlignment.test.ts` (project `unit`, new)

   One helper above the `describe` blocks: `tapsOver(headings, bearing)`, which walks the headings keeping the
   aligned flag and counts `shouldTap`, exactly as the hook does.

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `%s is %p degrees` | The offset is signed and takes the short way, including across north | `it.each`: (110, 118) is 8; (126, 118) is -8; (350, 10) is 20; (10, 350) is -20; (0, 180) is 180 | `alignmentOffset` `toBe` each |
   | `never answers outside a half turn, so a tap can never fire at the antipode` | The bound is structural rather than a separate check | every heading 0 to 359 against 118.876 | `Math.abs(...)` `<= 180` |
   | `needs the tighter angle to arrive and the wider one to leave` | Hysteresis exists | offset 6, both previous states | `isAligned(6, false)` `false`, `isAligned(6, true)` `true` |
   | `at %p degrees, having been %p, reads %p` | Both thresholds, both sides, at and just past each boundary | `it.each` over `ENTER`, `ENTER + 0.1`, `EXIT`, `EXIT + 0.1`, `-ENTER`, `-EXIT - 0.1` with the matching previous state | `isAligned` `toBe` expected |
   | `fires once on arriving and not again while held there` | The crossing rule | all four was/now combinations | `shouldTap` `true` only for `(false, true)` |
   | `fires once for a turn that crosses the line, even with the phone jittering` | **The owner's rule.** A single threshold fires 27 taps here | offsets -40 to +40, each heading repeated with 0.3 degrees of jitter | taps `toBe(1)` |
   | `fires once per return, so turning away and back gives exactly two` | One tap per crossing, both directions | that sweep, then its reverse | taps `toBe(2)` |
   | `stays silent for a whole turn that never reaches the line` | No tap without a crossing | offsets 20 to 90 | taps `toBe(0)` |
   | `never taps when the phone faces directly away from Makkah` | The antipode defect session 43 measured | offsets 170 to 190 in steps of 0.5 | taps `toBe(0)` |
   | `taps twice, not fifty, for two full revolutions` | The whole machine over a realistic turn | every degree 0 to 359, twice | taps `toBe(2)` |

   ### `device/__tests__/qibla.test.ts` (project `unit`, new)

   Mocks `expo-location` in the suite, beside the imports, with a comment saying why (it is the platform this file
   exists to wrap).

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `asks for foreground location, which is what both the position and the heading need` | One permission, the least the feature can ask | `requestForegroundPermissionsAsync` resolves `{ granted: true }` | `requestQiblaPermission()` is `true`, and `requestForegroundPermissionsAsync` was called |
   | `answers false when the user refuses` | The denial path | resolves `{ granted: false }` | `requestQiblaPermission()` is `false` |
   | `reads the position at the coarsest accuracy, because 3 km moves the qibla under 0.15 degrees` | The least-invasive fix | `getCurrentPositionAsync` resolves coords 51.475/-0.2015 | the result is `{ latitude: 51.475, longitude: -0.2015 }`, and the call's `accuracy` is `Location.Accuracy.Lowest` |
   | `reports each heading the platform gives` | The callback is wired | a captured `watchHeadingAsync` callback invoked with `{ trueHeading: 42, magHeading: 40, accuracy: 3 }` | the `onReading` spy was called with `{ trueHeading: 42 }` |
   | `stops the watch when its returned function is called` | The subscription is removable, which is what keeps the magnetometer off | a subscription whose `remove` is a spy | calling the returned function calls `remove` |

   ### `hooks/useQibla.ts` has NO suite of its own, and this was measured rather than chosen

   **`renderHook` does not work in this repository and no existing suite uses it.** Measured while planning: in the
   `unit` project it throws, because that project replaces React Native with a hand-written mock that cannot render;
   in the `components` project RNTL 14's `renderHook` returns an object with **no keys at all** and `result`
   `undefined`, so every `result.current` read is a `TypeError`. A grep confirms no suite in the repository calls it.

   So the hook is tested **through the screen that uses it**, which is what `__tests__/README.md` asks for anyway:
   test what a person or the phone can observe, never internals. Its rows are in the screen's suite below, and the
   hook reaches 100% coverage from there. **Do not write `hooks/__tests__/useQibla.test.ts`.**

   ### `components/sheets/screens/__tests__/Qibla.test.tsx` (project `components`, new, CARRIED)

   **Copy `ai/plans/45-qibla-flat-map/files/Qibla.test.tsx.txt` to this path and change nothing in it.** It was
   written and run green in a scratch worktree while this plan was written, at 13 of 13, and it encodes four idioms
   that each cost a failing draft to find. The rows below describe what it asserts, for the review and the audit.

   Mocks `@/device/qibla`. SVG elements carry a `testID` and are found with `screen.getByTestId`; a `Path`'s geometry
   is read from `props.d` and a `Circle`'s from `props.cx` and `props.cy`. **Measured while planning: a `Path`
   renders as `RNSVGPath` with its `d` intact, and a `Circle` as `RNSVGCircle`, so the drawn geometry is assertable.**

   **THE SHEET MUST BE PRESENTED OR IT DRAWS NOTHING, and rendering alone does not present it.** `Sheet.tsx` fires
   `onPresent` from its `handleChange`, so the sensors arm only when the library reports a change to index 0. The
   idiom is the one `Settings.test.tsx` already uses, and a first draft of this suite failed 5 of 8 without it:

   ```tsx
   // The sheet arms its sensors on present, which the library reports as a change to index 0
   const openSheet = async () => {
     await render(<QiblaSheet />);
     await fireEvent(screen.getByText('Qibla'), 'change', 0);
     await act(async () => {});
   };
   ```

   The mock captures the `watchHeading` callback into an array, so a test drives a reading with
   `await act(async () => { for (const watcher of watchers) watcher({ trueHeading }); })`. Reset that array, the
   granted flag and the position in a `beforeEach`.

   **The map's size in a test is `Math.min(width - SPACING.xl * 2, SIZE.contentMaxWidth)`**, computed from the
   window the harness reports; compute it the same way in the suite rather than hard-coding a number, so a harness
   change cannot make the assertions silently compare two wrong values.

   **16 tests. All 16 were written and run green in a scratch worktree while this plan was written, and they take
   `hooks/useQibla.ts` to 100% on all four measures on their own.**

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `draws the whole world map, the same one wherever the user is` | 🐋  "the whole world map, regardless of where the user is" | open at London | the world path's `d` is `WORLD_PATH` |
   | `marks Makkah` | Requirement 4 | open at London | the mark's `x`/`y` are `projectMercator(KAABA, size)` less half the mark's 10 px |
   | `puts the dot where the user stands` | Requirement 5 | open at London | the dot's `cx`/`cy` are `projectMercator(LONDON, size)` |
   | `draws the dot somewhere else for a user somewhere else` | The dot is not a fixed decoration | open at Los Angeles | the dot's `cx` is `projectMercator(LOS_ANGELES, size).x`, which differs from London's |
   | `draws the line from the user to Makkah` | Requirement 7 | open at London | the qibla path's `d` is exactly `qiblaPathData(LONDON, size)` |
   | `turns the arrow to follow the phone` | Requirement 6 | headings 0, then 90 | at 0 the arrow's `y2 < y1` (it points up); at 90 its `x2 > x1` (it points right) |
   | `draws no arrow while the phone cannot tell which way it points` | The honest empty state, and the `-1` sentinel matched exactly because Android reports a negative `trueHeading` wherever declination is negative | a reading of `-1` | `queryByTestId('qibla-arrow')` is `null` |
   | `explains that it needs location when the user refuses` | The owner's absolute rule: say so rather than point | permission refused | the text `The qibla needs your location.` is on screen, and neither the dot nor the line is drawn |
   | `reads no sensor until the sheet is presented` | **Performance Design Rule 7.** Every sheet in this app is mounted from launch, so a watch armed at mount would run the magnetometer for the life of the process | `render` without firing the present | `watchHeading` was not called |
   | `taps once when the phone turns onto the line` | The whole point of the feature | headings 130, 125, 120, 119 at London, whose qibla is 118.876 | `Haptics.impactAsync` called exactly once, with `ImpactFeedbackStyle.Medium` |
   | `does not tap again while the phone holds on the line` | 🐋  "Not Z, Z, Z, Z, Z" | headings 119, 119.2, 118.9, 119.1 | `Haptics.impactAsync` called exactly once in total |
   | `taps again when the phone turns away and comes back` | One tap per crossing | headings 119, 140, 119 | `Haptics.impactAsync` called exactly twice |
   | `stops the heading watch when the sheet closes` | The magnetometer is disarmed | open, then `fireEvent(screen.getByText('Qibla'), 'dismiss')` | the unwatch function returned by `watchHeading` was called |
   | `asks for nothing more when the sheet closes while the permission prompt is still up` | The sheet can close mid-`await`, and the prompt then resolves into a closed sheet | a `requestQiblaPermission` that resolves only when the test releases it, dismissed before that | `readPosition` was not called |
   | `draws nothing when the sheet closes while the position is still being read` | The same race one step later | a `readPosition` that resolves only when the test releases it, dismissed before that | `watchHeading` was not called and no dot is drawn |
   | `stops a heading watch that finished setting up after the sheet had already closed` | **The narrowest race, which the plan's own design review found**: `watchHeadingAsync` is asynchronous, so it can resolve after the cleanup has already run | a `watchHeading` that resolves only when the test releases it, dismissed before that | the unwatch function was called anyway |

   **Those last three are what take the hook to 100%**, and each holds its promise open with a captured `resolve` so
   the dismiss lands in the middle of the `await`. Without them `useQibla.ts` measures 92.85% of statements and 75%
   of branches, and the three uncovered lines are exactly its three "the sheet closed while I was waiting" guards.

   **The dismiss is fired as `'dismiss'`, not as a change to -1.** `Sheet.tsx` routes every close path through
   `handleDismiss`, and `Sound.test.tsx` already uses exactly this idiom
   (`fireEvent(screen.getByText('Select Athan'), 'dismiss')`). A draft using `'change', -1` failed this test.

   ### `components/sheets/screens/__tests__/Settings.test.tsx` (project `components`, edited)

   **Two tests added, no existing test changed.** The suite gains an import of `QiblaSheet`, `qiblaSheetModalAtom`
   and `onPlatform`, plus a mock of `@/device/qibla` beside its existing mocks, with this comment: `// The qibla
   sheet reaches the platform the moment it presents; the settings suite only needs it to exist`.

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `closes itself and opens the qibla sheet with a haptic when Qibla is pressed` | Requirement 1 | render `<SettingsSheet />` and `<QiblaSheet />` together at Friday 11 September 2026 14:00, spying on each sheet's own modal exactly as the `Change athan` test does | pressing the `Qibla` button calls the settings sheet's `dismiss` once and the qibla sheet's `present` once, and `Haptics.impactAsync` was called with `ImpactFeedbackStyle.Medium` |
   | `shows no Qibla row on Android, where the heading has no gyroscope in it` | **Owner ruling 2.1.2** | `onPlatform('android')` before the render | `screen.queryByRole('button', { name: 'Qibla' })` is `null`, AND `Change athan` is still there, so the test cannot pass by the whole sheet failing to render |

   Measured while planning: the file goes from 15 tests to 17, and all 15 existing ones still pass.

   ### `__tests__/app/_layout.test.tsx` (project `components`, edited)

   One existing test changes: `mounts the Settings, Athan and alert sheets once the first frame has passed` is
   renamed to `mounts the Settings, Athan, alert and qibla sheets once the first frame has passed` and gains one
   assertion, `expect(screen.getByText('Turn until it taps')).toBeOnTheScreen()`, which is the qibla sheet's
   subtitle. Nothing else in the file changes, and its other 11 tests must still pass.

   ### The command, and the expected red

   ```bash
   npx jest shared/__tests__/qiblaGeometry.test.ts shared/__tests__/qiblaAlignment.test.ts \
     device/__tests__/qibla.test.ts --watchman=false --selectProjects=unit
   npx jest components/sheets/screens/__tests__/Qibla.test.tsx \
     components/sheets/screens/__tests__/Settings.test.tsx __tests__/app/_layout.test.tsx \
     --watchman=false --selectProjects=components
   ```

   **Expected before the change:** every new suite fails to run, each with
   `Cannot find module '../qiblaGeometry'` or the matching specifier for the module it imports.
   `Settings.test.tsx` runs and fails its two new tests with `Unable to find an element with role "button" and name
   "Qibla"`. If any new suite runs green, STOP.

5. **Change.** This step is **`(specified)` for every source file and `(files)` for its four test suites**: the
   production code is built from the contracts below, and the four suites are copied from `files/` and changed in no
   way. Where a step dictates rather than specifies, the dictation wins (`EXECUTOR-BRIEF.md`).

   **Copy these four first, before writing any production code**, so the red is the plan's own red:

   ```bash
   P=ai/plans/45-qibla-flat-map/files
   cp $P/qiblaGeometry.test.ts.txt shared/__tests__/qiblaGeometry.test.ts
   cp $P/qiblaAlignment.test.ts.txt shared/__tests__/qiblaAlignment.test.ts
   cp $P/qibla.device.test.ts.txt device/__tests__/qibla.test.ts
   cp $P/Qibla.test.tsx.txt components/sheets/screens/__tests__/Qibla.test.tsx
   ```

   ### The install, first, because the rest depends on it

   ```bash
   yarn add expo-location@58.0.9
   git diff package.json
   ```

   `git diff package.json` must show exactly one added line, `"expo-location": "58.0.9",`, and nothing else.
   Anything else is section 2.2's question 7.

   **Then, mandatorily and not as a contingency:**

   ```bash
   rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile
   npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit
   ```

   **This is not optional. Measured during planning: `yarn add expo-location@58.0.9` DID reintroduce a nested
   `@expo/ui@58.0.7` under `expo-widgets` while the flat pin still read 58.0.5, and `widgetRuntimeLoads.test.ts`
   failed with 2 of 3 tests down.** The two commands above fixed it and the suite went green at 3 of 3. This is the
   trap `ai/AGENTS.md` documents, and it fires on an install that touches neither package.

   ### `shared/worldPath.ts`

   **Copy `ai/plans/45-qibla-flat-map/files/worldPath.ts.txt` and change nothing in it.** It exports `WORLD_PATH`, a
   `string`: the world's coastline as one SVG path in unit Mercator space, x and y both 0 to 1, y downward, 26,515
   characters over 69 rings. Natural Earth 1:110m land, public domain.

   ### `shared/qiblaGeometry.ts`

   | Export | Signature | What it answers | What it must never do |
   | --- | --- | --- | --- |
   | `Coordinates` | `interface { latitude: number; longitude: number }` | A position on the earth | — |
   | `MapPoint` | `interface { x: number; y: number }` | A point on the drawn map, in map pixels from its top-left corner | — |
   | `KAABA` | `Coordinates` | `{ latitude: 21.4225, longitude: 39.8262 }` | Never be recomputed or rounded further |
   | `MERCATOR_MAX_LATITUDE` | `number` | `85.05112877980659` | — |
   | `QIBLA_PATH_POINTS` | `number` | `64` | — |
   | `qiblaBearing` | `(from: Coordinates) => number` | The great-circle initial bearing to the Kaaba, degrees clockwise from true north | Never return a negative angle or 360 |
   | `projectMercator` | `(point: Coordinates, size: number) => MapPoint` | Where a position sits on a square Web Mercator map of that pixel size, y downward | Never return a non-finite y: clamp the latitude first |
   | `greatCirclePoint` | `(from: Coordinates, fraction: number) => Coordinates` | The position that fraction along the great circle to the Kaaba | Never divide by zero: coincident points return `from`'s own values |
   | `qiblaPathData` | `(from: Coordinates, size: number) => string` | The path to the Kaaba as an SVG `d` string | Never join two points on opposite edges of the map |

   `qiblaBearing` is the spherical law of sines:

   ```
   y = sin(deltaLongitude) * cos(kaabaLatitude)
   x = cos(fromLatitude) * sin(kaabaLatitude) - sin(fromLatitude) * cos(kaabaLatitude) * cos(deltaLongitude)
   bearing = (atan2(y, x) in degrees + 360) mod 360
   ```

   `projectMercator` is Web Mercator over a unit square, scaled by `size`:

   ```
   clamped = max(-MERCATOR_MAX_LATITUDE, min(MERCATOR_MAX_LATITUDE, latitude))
   x = ((longitude + 180) / 360) * size
   y = (0.5 - ln(tan(PI/4 + clamped/2)) / (2 * PI)) * size
   ```

   `greatCirclePoint` is spherical linear interpolation; the angular distance comes from the haversine, and a zero
   distance returns `from` unchanged rather than dividing by `sin(0)`.

   `qiblaPathData` builds `QIBLA_PATH_POINTS` points at fractions `index / (QIBLA_PATH_POINTS - 1)`, projects each,
   breaks the list wherever consecutive points' `x` differ by more than `size / 2`, and renders each run of 2 or more
   points as `M<x>,<y>L<x>,<y>...` with **each coordinate at `toFixed(2)`**, runs joined by a single space.

   **THE SPACING IS UNIFORM AND THIS IS LOAD-BEARING.** Bunching the points near the user improves the formula and
   ruins the drawing: with a squared ramp the first segment is 0.017 px long in London, the `toFixed(2)` rounding
   destroys its direction, and the drawn angle reads 116.565 against a true 118.876. Uniform spacing puts the first
   point about 1 px out and draws 119.211. **A one-line comment says why**, because the next reader will otherwise
   "improve" it back.

   ### `shared/qiblaAlignment.ts`

   | Export | Signature | What it answers | What it must never do |
   | --- | --- | --- | --- |
   | `ALIGNMENT_ENTER_DEGREES` | `number` | `4` | — |
   | `ALIGNMENT_EXIT_DEGREES` | `number` | `8` | Never equal `ALIGNMENT_ENTER_DEGREES`: that is the buzz |
   | `NO_HEADING` | `number` | `-1`, what `expo-location` reports with no fix, on both platforms | — |
   | `alignmentOffset` | `(heading: number, bearing: number) => number` | The signed turn to the qibla, the short way: negative left, positive right, over -180 to 180 | Never answer outside -180 to 180, which is what would let a tap fire at the antipode |
   | `isAligned` | `(offset: number, wasAligned: boolean) => boolean` | Whether the user is on the line now, given whether they were | Never use one threshold for both directions |
   | `shouldTap` | `(wasAligned: boolean, nowAligned: boolean) => boolean` | Whether this reading earns a tap | Never return `true` while the user holds still on the line |

   `alignmentOffset` takes `(bearing - heading) % 360`, subtracts 360 when that is above 180 and adds 360 when it is
   at or below -180. `isAligned` compares `Math.abs(offset)` against `ALIGNMENT_EXIT_DEGREES` when `wasAligned` and
   `ALIGNMENT_ENTER_DEGREES` otherwise. `shouldTap` is `!wasAligned && nowAligned`.

   ### `device/qibla.ts`

   The only file that imports `expo-location`, so everything above it is testable without a device.

   | Export | Signature | What it answers | What it must never do |
   | --- | --- | --- | --- |
   | `HeadingReading` | `interface { trueHeading: number }` | What the screen needs from a heading reading | Never carry the accuracy bucket: nothing reads it (owner ruling 2.1.1) |
   | `requestQiblaPermission` | `() => Promise<boolean>` | Whether the app may read the user's position, via `requestForegroundPermissionsAsync` | Never ask for background or precise location, nor any motion permission |
   | `readPosition` | `() => Promise<Coordinates>` | Where the user is, via `getCurrentPositionAsync` at `Location.Accuracy.Lowest` | Never ask for a finer accuracy: 3 km moves the qibla under 0.15 degrees |
   | `watchHeading` | `(onReading: (reading: HeadingReading) => void) => Promise<() => void>` | Starts `watchHeadingAsync` and returns the function that stops it | Never adjust `trueHeading`: no axis constant, no reference frame, no declination term |

   `trueHeading` is Core Location's own fused, declination-corrected value, the one Apple Maps points with. A
   correction of our own is exactly what the owner ruled out and what shipped a reading 90 degrees out in session 43.
   A one-line comment says so.

   ### `hooks/useQibla.ts`

   | Export | Signature | What it answers |
   | --- | --- | --- |
   | `QiblaState` | `interface { position: Coordinates \| null; bearing: number \| null; heading: number \| null; permissionDenied: boolean }` | What the screen draws |
   | `useQibla` | `() => QiblaState & { start: () => Promise<void>; stop: () => void }` | The sheet's whole behaviour |

   `useQibla` holds three refs and one state:

   - `alignedRef`, whether the user was on the line at the previous reading;
   - `activeRef`, whether the sheet is open, so an `await` that resolves after it closed writes nothing;
   - `unwatchRef`, the function that stops the heading watch.

   `start` sets `activeRef`, asks permission, and returns early whenever `activeRef` has gone false. On refusal it
   sets `permissionDenied` and stops. Otherwise it reads the position once, computes the bearing, then starts the
   heading watch. Each reading: `NO_HEADING` clears `alignedRef` and sets `heading` to `null`; any other value
   computes `isAligned(alignmentOffset(trueHeading, bearing), alignedRef.current)`, fires
   `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` when `shouldTap` says so, then stores both.

   **The watch can finish setting up after the sheet has closed**, because `watchHeadingAsync` is asynchronous and
   the cleanup has already run by then. So `start` stores the unwatch function only while `activeRef` is still true,
   and otherwise calls it at once. A one-line comment says why; the plan's own design review found this race.

   `stop` clears `activeRef` and `alignedRef`, calls `unwatchRef.current?.()` and clears it. An effect returns `stop`
   so unmounting disarms the sensors too.

   ### `components/sheets/screens/Qibla.tsx`

   A default-exported `BottomSheetQibla`, following `Sound.tsx` and `Settings.tsx`. It renders a `Sheet` with these
   props exactly:

   | Prop | Value | Why this one |
   | --- | --- | --- |
   | `setRef` | `setQiblaSheetModal` | |
   | `title` | `'Qibla'` | |
   | `subtitle` | `'Turn until it taps'` | |
   | `icon` | `<QuestionIcon width={16} height={16} color='rgba(165, 180, 252, 0.8)' />`, importing `@/assets/icons/svg/question.svg` | Matches `Settings.tsx`'s own icon call exactly, including the colour literal it already uses |
   | `onPresent` | `start` | **Not `onFirstPresent`.** `Sheet.tsx`'s own doc says `onPresent` is "for work that is undone on dismiss and must be redone on the next open, such as a sensor subscription, which `onFirstPresent` would arm once and never again". This is that case exactly |
   | `onDismiss` | `stop` | Disarms the heading watch |
   | `perfName` | `'sheet_qibla'` | Matches the naming of `sheet_settings` and `sheet_sound` |
   | `scrollable` | `false` | The map is one fixed square; nothing scrolls |
   | `enableDynamicSizing` | `true` | The sheet is as tall as the map plus its message, rather than a guessed percentage |
   | `contentCap` | `0.85` | The cap `Alert.tsx` already uses, so a small phone never slides the sheet under the notch |

   The map's pixel size is `width - SPACING.xl * 2`, where `width` comes from `useWindowDimensions()` (this repo's
   own re-export of React Native's live hook, at `@/hooks/useWindowDimensions`), and it is capped at
   `SIZE.contentMaxWidth` so a tablet does not draw a 500 px world. Compute it once into a `size` constant and pass
   it to every geometry call, so the drawn elements can never disagree about the map they sit on.

   Inside, one `Svg` of `width - SPACING.xl * 2` square, holding in this order:

   | Element | `testID` | What it draws |
   | --- | --- | --- |
   | `Rect` | `qibla-sea` | The sea: the whole square, `COLORS.surface.sheet`, `rx={RADIUS.md}` |
   | `Path` in a `G` with `scale={size}` | `qibla-world` | `WORLD_PATH`, filled `rgba(99, 102, 241, 0.18)` and stroked `rgba(165, 180, 252, 0.35)` at `0.4 / size` |
   | `Path` | `qibla-line` | `qiblaPathData(position, size)`, stroked `COLORS.text.secondary`, no fill. Absent without a position |
   | Makkah mark | `qibla-makkah` | A `Rect` 10 px square centred on `projectMercator(KAABA, size)`, `COLORS.icon.primary`, `rx={RADIUS.xs}`, with a 3 px `Rect` door in `COLORS.surface.sheet` at its foot |
   | `Circle` | `qibla-dot` | The user, r 4, `COLORS.text.primary`, centred on `projectMercator(position, size)`. Absent without a position |
   | `Line` | `qibla-arrow` | From the dot, 14 px at the heading, `COLORS.feedback.warning`, `strokeWidth` 2.5, `strokeLinecap='round'`. **Absent while `heading` is null** |

   **The arrow is 14 px because the curve bends away from it.** Measured at that length the line diverges from the
   arrow by at most 4.04 degrees across ten cities, which is 1.14 px sideways in the worst of them; at 25 px it is
   8.12 degrees.

   Below the map, only when `permissionDenied`: a `Text` reading exactly `The qibla needs your location.`, styled
   `COLORS.text.secondary`, `TEXT.family.regular`, `TEXT.sizeDetail`.

   **Every colour, size, spacing and radius comes from `shared/constants.ts`. Invent none**: `ai/AGENTS.md` records
   that `SIZE.contentPadding` and `COLORS.activeBackground` do not exist and previous sessions invented both.

   ### `stores/ui.ts` (anchor 3-3)

   | Export | What |
   | --- | --- |
   | `qiblaSheetModalAtom` | `atom<BottomSheetModal \| null>(null)`, beside `settingsSheetModalAtom` |
   | `setQiblaSheetModal` | `(modal: BottomSheetModal \| null) => void` |
   | `showQiblaSheet` | `() => void`, marking `sheet_qibla_present` then presenting, exactly as `showSettingsSheet` does |

   ### `components/sheets/screens/Settings.tsx` (anchors 3-1, 3-2)

   A `Qibla` row in the Other card, **above** the What's new row, drawn exactly like the Help row: the same
   `whatsNewButton` style, the same `infoButton` circle, `Icon.QUESTION`'s place taken by `Icon.WIDGET`, the label
   `Qibla`, the same chevron, `accessibilityLabel='Qibla'` and `accessibilityRole='button'`. Its handler matches
   `handleAthanPress` exactly: medium haptic, `hideSettingsSheet()`, `showQiblaSheet()`.

   **The row renders on iOS only** (owner ruling 2.1.2), gated by `Platform.OS === 'ios'`, because Android's heading
   fuses the accelerometer with the raw magnetometer and measured 71 degrees wrong. A one-line comment says why.

   ### The two barrels and `app/_layout.tsx` (anchors 2-2, 2-1)

   **There are TWO barrel files and both need the export**, which a first pass missed:

   - `components/sheets/screens/index.ts`: `export { default as Qibla } from './Qibla';`
   - `components/sheets/index.ts` (anchor 2-2): add `Qibla` to the `./screens` re-export list, and
     `export { default as BottomSheetQibla } from './screens/Qibla';` beside the other three.

   Then `app/_layout.tsx` (anchor 2-1) imports `BottomSheetQibla` and mounts `<BottomSheetQibla />` inside the
   `chromeDeferred` fragment beside the other three sheets.

   ### The screen reads no bearing

   `useQibla` returns `bearing`, and the screen does NOT destructure it: only the tap needs it, and the drawn line
   comes from `qiblaPathData`. Destructuring it fails `noUnusedVariables`, which is how this was found.

   ### `app.json`

   Restore `NSLocationWhenInUseUsageDescription` under `ios.infoPlist`, with exactly this text:

   ```
   Your location is used to work out which way Makkah is from where you are. It never leaves your phone.
   ```

6. **Green.**

   ```bash
   npx jest shared/__tests__/qiblaGeometry.test.ts shared/__tests__/qiblaAlignment.test.ts \
     device/__tests__/qibla.test.ts --watchman=false --selectProjects=unit
   npx jest components/sheets/screens/__tests__/Qibla.test.tsx \
     components/sheets/screens/__tests__/Settings.test.tsx __tests__/app/_layout.test.tsx \
     --watchman=false --selectProjects=components
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

   Expected, measured in a scratch worktree while this plan was written:

   ```
   Test Suites: 3 passed, 3 total      (the unit suites)
   Tests:       38 passed, 38 total
   ```

   and, for the component suites, 16 in `Qibla.test.tsx`, 17 in `Settings.test.tsx` (15 before this step) and 12 in
   `_layout.test.tsx`. `tsc` and Biome exit 0.

   Then the whole suite, which must now be green because every export is reachable and the guard is gone:

   ```bash
   npx jest --watchman=false --coverage --silent
   ```

   **Expected, and this was measured rather than estimated:**

   ```
   Statements   : 100% ( 4535/4535 )
   Branches     : 100% ( 2015/2015 )
   Functions    : 100% ( 938/938 )
   Lines        : 100% ( 4077/4077 )

   Test Suites: 181 passed, 181 total
   Tests:       2 skipped, 4840 passed, 4842 total
   ```

   The two skips are `audioMatrix.test.ts`'s prebuild-gated assertions, which no scratch worktree can run; the main
   checkout runs them and reports 4842 passing with no skips. A count within a few of these is fine and is recorded
   in `LOG.md`; anything below 100% on any measure is not.

7. **Breaks.** Save as `$TMPDIR/breaks-45.sh` and run `bash $TMPDIR/breaks-45.sh` from the repository root. It is
   given in full in `ai/plans/45-qibla-flat-map/scripts/breaks.sh`; copy that file.

   **Expected: `caught 18 of 18` then `ALL AS EXPECTED: 1`.** Every one of the 18 was run in a scratch worktree
   while this plan was written and every one was caught.

   **Run `npx biome check --write` BEFORE this script, never after** (session 41's lesson): the formatter can rewrap
   a line and move text a break substitutes, which prints `BREAK NOT APPLIED` on a rerun.

8. **Version and commit.**

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   ```

   Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). The gradle file is
   gitignored and is never added, but a test fails if it differs.

   Add, by name, every file in part 3, plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`. Never
   `git add .`.

   Commit message, to `$TMPDIR/msg-2.txt`, with `<VERSION>` replaced:

   ```
   <VERSION> - feat(qibla): a flat world map, a curved line to Makkah, and one tap when you face it

   The qibla returns, rebuilt from nothing after session 44 deleted four rejected attempts. A static
   Web Mercator world map in the app's own colours, a mark on Makkah, a dot for the user, an arrow
   for the phone's heading, and a great-circle line between them. One haptic tap each time the arrow
   crosses onto that line, silence while held there, silence while away, one tap on returning.

   The design rests on Mercator being CONFORMAL, and that is what makes the drawing honest. A straight
   line on a flat map is the rhumb line, 14.86 degrees wrong in London and 71.32 in Los Angeles, and a
   shipped app has been caught at exactly this. A conformal projection preserves angles at a point, so
   the great circle drawn as a curve leaves the user's dot at the true bearing exactly and the arrow
   drawn at that bearing lies along it.

   The trap inside that fix is that bunching the path's points near the user makes the DRAWING worse
   while making the formula better: coordinates round to two decimal places of a pixel, so a sub-pixel
   first segment loses its direction to the rounding and London draws 116.565 where the bearing is
   118.876. Uniform spacing is right, and the test measures the drawn string rather than the formula.

   Two owner rulings. A needle rather than Apple's accuracy cone, because expo-location buckets that
   accuracy to 20, 35 or 50 degrees and nothing between; the screen goes quiet only when the phone
   itself reports its heading invalid. And iOS only, because Android's heading has no gyroscope in it
   and measured 71 degrees wrong with 2 samples in 40 seconds.

   One SVG path of 26,515 characters replaces the whole tile pipeline, drawn with the react-native-svg
   already installed. expo-location returns at exactly 58.0.9 and one foreground permission carries
   both the position and the heading, so the app asks for what it asked before and nothing more. The
   position is read once at the coarsest accuracy the platform offers, because 3 km of error moves the
   qibla by under 0.15 degrees.

   Session 44's guard is deleted in this commit and could not be deleted in any other: it fails the
   moment a file named qibla exists, so either ordering left uat-2 red. It protected an empty tree,
   and the tree is no longer empty.
   ```

   Commit with `git commit -F $TMPDIR/msg-2.txt` in the background. In the log, the last `Tests:` line ends
   `passed, <n> total`, and four `100%` coverage lines are present.

9. **Review.** Read `git show <sha>` back cold, as a stranger, against this checklist:

   - [ ] Every export has the exact name and signature its contract gives.
   - [ ] `qiblaPathData` spaces its points UNIFORMLY, at `toFixed(2)`, splitting at `size / 2`, with a one-line
         comment saying why the spacing is uniform.
   - [ ] `alignmentOffset` can never answer outside -180 to 180.
   - [ ] `ALIGNMENT_ENTER_DEGREES` is 4 and `ALIGNMENT_EXIT_DEGREES` is 8.
   - [ ] `device/qibla.ts` is the only file importing `expo-location`, asks for foreground location only, and
         adjusts `trueHeading` by nothing.
   - [ ] `useQibla` reads no sensor until `start`, and `stop` calls the unwatch function.
   - [ ] The Qibla row is gated to iOS.
   - [ ] Every colour, size, spacing and radius comes from `shared/constants.ts`. None was invented.
   - [ ] `shared/worldPath.ts` is byte for byte the plan's file:
         `diff shared/worldPath.ts ai/plans/45-qibla-flat-map/files/worldPath.ts.txt` prints nothing.
   - [ ] `shared/__tests__/qiblaRemoved.test.ts` is deleted.
   - [ ] `package.json` gained `expo-location` and nothing else.
   - [ ] Every comment explains WHY. No comment explains what or how.
   - [ ] No file outside part 3's list changed.
   - [ ] No `console.log`, no `istanbul ignore`, no `any`.

   A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff feat/45-qibla-flat-map \
      -m "Merge feat/45-qibla-flat-map into uat-2: the qibla on a flat world map, reviewed"
    ```

11. **Done when:**

    ```bash
    npx jest --watchman=false --coverage --silent | tail -6
    # four 100% lines, 0 failing
    bash $TMPDIR/breaks-45.sh | tail -2
    # caught 18 of 18
    # ALL AS EXPECTED: 1
    npx tsc --noEmit && npx biome check . --error-on-warnings && echo CLEAN
    python3 scripts/find-unused-exports.py | tail -8
    # only the five pre-existing allow-listed entries
    diff shared/worldPath.ts ai/plans/45-qibla-flat-map/files/worldPath.ts.txt && echo WORLD-IDENTICAL
    ```
