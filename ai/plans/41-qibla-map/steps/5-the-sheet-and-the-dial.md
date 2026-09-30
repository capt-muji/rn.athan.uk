# Step 5: The Qibla sheet becomes the map, and the dial is deleted

0. **Anchor check.**

```
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/41-qibla-map/scripts/anchors/5-1.txt components/sheets/screens/Qibla.tsx
```

Must print `1`.

1. **Goal.** The sheet shows the map and the sentence, and every line of magnetometer code leaves the
   repository.

2. **Branch.** `git checkout -b feat/41-sheet-is-the-map uat-2`

3. **Files.**

| File | Kind |
| --- | --- |
| `components/sheets/screens/Qibla.tsx` | rewritten |
| `components/qibla/Dial.tsx` | **deleted** |
| `components/qibla/dialGeometry.ts` | **deleted** |
| `components/qibla/__tests__/Dial.test.tsx` | **deleted** |
| `components/qibla/__tests__/dialGeometry.test.ts` | **deleted** |
| `shared/qibla.ts` | changed: the heading helpers go |
| `shared/__tests__/qibla.test.ts` | changed: their tests go |
| `device/qibla.ts` | changed: `readDeclination` goes |
| `device/__tests__/qibla.test.ts` | changed |
| `components/sheets/screens/__tests__/Qibla.test.tsx` | rewritten |

Before deleting anything, confirm with codegraph that nothing else reaches it:

```
codegraph_explore: "Dial dialGeometry headingFromYaw dialAngleFromYaw unwrapAngle isFieldTrustworthy readDeclination callers"
```

Its blast radius answers exactly this. If any caller outside the files listed above appears, STOP.

4. **Tests first (red).** `components/sheets/screens/__tests__/Qibla.test.tsx` is rewritten:

| Test | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `shows that it is finding the position when the sheet opens` | The first state | present the sheet | the text `Finding your position` |
| `shows the street and the turn once the map is ready` | The product | a mocked London position and tile | `Stand along Whitehall, then turn 53 degrees to the left` |
| `draws the map when the map is ready` | The picture ships with the sentence | the same | the map is rendered |
| `says the location is unavailable when there is no position` | Refused permission | `readPosition` returns null | `Your location is not available right now`, and no map |
| `says there is no map data when no street is usable` | The rural case | a tile with no named road | `No map data for this spot`, and no sentence |
| `reads no position until the sheet is presented` | Performance Design Rule 7 | render without presenting | `readPosition` was not called |
| `never reads a sensor` | The invariant of the whole plan | present the sheet | `useAnimatedSensor` was not called |

`shared/__tests__/qibla.test.ts` keeps its coverage of `qiblaBearing` and `normaliseHeading` and loses the
tests for the deleted helpers. `device/__tests__/qibla.test.ts` loses its `readDeclination` tests.

Commands:

```
npx jest components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components
npx jest shared/__tests__/qibla.test.ts device/__tests__/qibla.test.ts --watchman=false --selectProjects=unit
```

5. **Change.**

`components/sheets/screens/Qibla.tsx` keeps its `Sheet`, its title, its subtitle, its icon, its snap point
and its `perfName`, all unchanged: those are settled visuals. What changes inside it:

- `HeadingSensor` is deleted whole, with its two `useAnimatedReaction` calls and every
  `react-native-reanimated` import.
- `IOS_AXIS_CORRECTION`, `SENSOR_INTERVAL_MS`, `HINT` and `INTERFERENCE` are deleted.
- The `heading` and `correction` shared values are deleted.
- `handlePresent` calls `useQiblaMap`'s `start` instead of reading a declination.
- The body renders `QiblaMap` for `ready`, and the card renders the sentence for the state.

From `shared/qibla.ts`, delete `headingFromYaw`, `dialAngleFromYaw`, `unwrapAngle` and `isFieldTrustworthy`,
with `FIELD_MIN` and `FIELD_MAX`. **Keep `shortestDelta`**, which `device/qibla.ts` uses, and keep
`normaliseHeading` and `qiblaBearing`.

From `device/qibla.ts`, delete `readDeclination` and `NO_HEADING`. If `shortestDelta`'s only remaining
caller was `readDeclination`, delete it from `shared/qibla.ts` too, and the dead-code guard will say so.

**The invariant:** `grep -rn "useAnimatedSensor\|MAGNETIC_FIELD\|SensorType" components/ shared/ device/ hooks/`
returns nothing.

6. **Green.** Both commands pass. The whole suite runs at commit. tsc and Biome exit 0.

`shared/__tests__/unusedExports.test.ts` must pass: deleting a helper whose caller is also deleted is
exactly what it checks.

7. **Breaks.** `bash ai/plans/41-qibla-map/scripts/breaks-5.sh`, ending `ALL AS EXPECTED: 1`.

8. **Version and commit.** Next patch. Commit message:

```
<VERSION> - feat(qibla): the sheet is the map, and the compass is deleted

The Qibla sheet shows the streets around the user with the qibla ray on them, and a sentence
naming the street to stand along. The magnetometer dial is gone, and with it every heading
helper, the iOS axis correction, the field-strength check and the declination read.

The owner's ruling, after the dial read 30 degrees wrong in his own bedroom on a build whose
geometry is correct: "30 degrees is a big difference. We don't want that at all. We would
rather ditch the compass feature entirely if that's the case."

Sessions 37 and 40 each shipped correct, audited, fully covered code and the feature still
failed, because the failure was never in the arithmetic. The bearing was exact throughout.
Only the heading was wrong, and no sensor this app can reach reports it reliably indoors.
```

9. **Review.** Read the diff back cold and check: the sheet's visuals are untouched, no sensor import
   survives anywhere, `shortestDelta` is kept or deleted with its last caller, and the deleted files have no
   remaining importer.

10. **Merge.**

```
git checkout uat-2 && git merge --no-ff feat/41-sheet-is-the-map -m "Merge feat/41-sheet-is-the-map into uat-2: session 41 step 5, reviewed"
```

11. **Done when.** The suites pass, the grep in part 5 returns nothing, and the merge is in `uat-2`.

12. **Stopping part-way.** `git checkout -- components/sheets/screens/Qibla.tsx shared/qibla.ts device/qibla.ts`
    and restore the deleted files with `git checkout -- components/qibla/`.
