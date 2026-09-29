# Session 37: the qibla finder

**Planned at:** `77eb52fe` (tip of `uat-2` at planning time).
**Branch:** `feat/37-qibla-compass`. **Nothing merges into `uat-2` until execution and audit are both done
and the owner has approved** (owner, 2026-09-28).
**Research:** `RESEARCH.md`, 1,803 lines, whose load-bearing numbers were independently recomputed in
`AUDIT.md` section 3 and all reproduce.

## 1. The goal

Add a Qibla compass to the app: a bottom sheet, reached from a `Qibla` row in Settings beneath
`Change athan`, showing a dial that points to the Kaaba from wherever the phone is standing.

The feature is additive. Prayer times, notifications and widgets never touch location and are not modified
by this session. A user who refuses location loses exactly this one screen.

### 1.1 The governing principle

From `RESEARCH.md` section 10.2, and it decides every ambiguous call below:

> The bearing is exact to four orders of magnitude better than the sensor. **The compass is therefore
> honest about the needle, never about the number.** The app states what it knows and what it does not.

Indoor heading RMSE is about 17.4° even with a purpose-built algorithm (Ettlinger & Weiss, *NAVIGATION*,
2024), and most prayer happens indoors. So the screen must never imply the needle is surveyed-grade.

## 2. The owner's decisions, taken 2026-09-28

| # | Question | Decision | What it settles |
| --- | --- | --- | --- |
| 1 | Where the formula comes from | **Adopt `adhan@4.4.6`** | No hand-written maths. 13.5 KB, zero deps, MIT, formula verified against the theorem it cites, zero qibla bugs in a decade, and its prayer-time fixtures already carry our exact London configuration |
| 2 | Android needle quality | **Ship `expo-location` as shipped** | No native module this session. A follow-up row upgrades it only if the 3T proof shows the needle is unusable |
| 3 | The denied row's look | **Identical to its neighbours, chevron only** | No grey row, no trailing state word. Tapping when denied explains and offers the route to Settings |
| 4 | Android location scope | **Coarse only**, via a config plugin | Qualifies for Play's Minimum Scope exemption; ample, since 10 km of position error is 0.48° of bearing |

Earlier owner rulings this plan is bound by, all from `RESEARCH.md`:

- **A bottom sheet, not a modal** (section 4-OWNER). Modals are for information, sheets are for features.
- **No permission, no compass** (section 18). The city-picker fallback and its ~1 MB dataset are cancelled.
- **60fps is the target, 30fps the floor** (section 4.2). This supersedes Performance Design Rule 1 here.
- **Our own compass design**, not a downloaded one (section 4.1).

### 2.2 What makes the executor STOP and ask

1. `expo install expo-location` resolves anything other than `58.0.8`.
2. `shared/__tests__/widgetRuntimeLoads.test.ts` still fails after the step 1 remedy.
3. Any surveyed fixture misses its published value by more than the 0.05° bound.
4. The 3T frame audit cannot reach the 30fps floor after the architecture in step 5 is built.
5. `yarn validate` reports below 100% on any of the four measures and the cause is not a file this plan
   added.

## 3. The invariant

> **The dial's Kaaba marker points at the true great-circle bearing to the Kaaba from the phone's current
> position, and the screen never claims more confidence than the sensor reports.**

## 4. Architecture

### 4.1 The 60fps constraint decides the shape

`components/ui/Masjid.tsx` measured a 30-path SVG at **40 to 56 ms per full-window record on the SD820**,
which is 2.4x to 3.4x the entire 16.67 ms budget for one 60fps frame. So:

- The dial is drawn **once** as a static tree and rotated as a **whole layer** by a Reanimated `transform`.
  A transform is a compositor operation: no re-record, no JS in the frame loop.
- **`useAnimatedProps` on SVG attributes is rejected.** Four independent sources agree, the strongest being
  react-native-svg's own maintainers: "everything gets redrawn, and there's no caching involved".
- Heading samples arrive at 20 Hz at most (Android's own 50 ms throttle). A sample writes a shared value;
  the animation interpolates between samples at display rate.
- Ornament is free as long as it never re-records. A 72-tick dial that is transform-only is cheaper than an
  8-path dial that re-records each frame.

### 4.2 The four traps that must be coded around

| Trap | Source | What the code must do |
| --- | --- | --- |
| Android `calcTrueNorth` returns a **negative** heading wherever declination is negative (6 of 8 sampled places) | `LocationModule.kt:691`, Kotlin `%` keeps the dividend's sign | Test `=== -1` for the no-permission sentinel **first**, then normalise with `((h % 360) + 360) % 360` |
| Naive rotation **spins the long way**: 359 to 1 travels −358° | measured, `RESEARCH.md` 4.3 | Accumulate onto a continuous unbounded angle via `((to − from + 180) mod 360) − 180`. Never assign a wrapped value to the animated one |
| A sheet is **always mounted**, so a mount-keyed subscription runs from launch forever | `app/_layout.tsx:86` | Key the sensor on **presentation**, not mount. Stop on dismiss, asserted by a test |
| `trueHeading` is **−1 for a period after opening**, even when granted | `LocationModule.kt`, `mGeofield` starts null | Show the acquiring state; never draw a wrong arrow |

### 4.3 Where the code goes

| File | Status | Holds |
| --- | --- | --- |
| `shared/qibla.ts` | new, pure | `qiblaBearing`, `normaliseHeading`, `shortestDelta`, `unwrapAngle`. No React, no native imports, so the `unit` project can test it |
| `device/heading.ts` | new | The `expo-location` boundary: subscribe, normalise, unsubscribe |
| `components/sheets/screens/Qibla.tsx` | new | The sheet, `stackBehavior='push'`, `snapPoints={['85%']}` |
| `components/qibla/Dial.tsx` | new | The static SVG tree, rotated as one layer |
| `stores/qibla.ts` | new | Position, permission state and heading atoms |
| `assets/icons/svg/compass.svg` | new | The row's glyph; 16 SVGs exist, no compass |
| `shared/types.ts` | edit | `COMPASS = 'COMPASS'` in `Icon` |
| `assets/icons/svg/index.ts` | edit | One import, one `ICONS` entry |
| `components/sheets/screens/Settings.tsx` | edit | The row, mirroring `handleAthanPress` exactly |
| `stores/ui.ts` | edit | `qiblaSheetModalAtom`, `showQiblaSheet`, its setter |
| `app/_layout.tsx` | edit | Mount beside the other three sheets |

**The Settings row copies `handleAthanPress` and NOT the modal handlers.** `handleAthanPress` has no
`setTimeout`; the 150 ms delay belongs to the modal rows and copying it here would be a real defect.

## 5. The steps

One finding, one branch off `feat/37-qibla-compass`, one commit, version-bumped, merged `--no-ff` back into
`feat/37-qibla-compass`. Each step leaves the branch green.

| # | Step | Proves | Outcome |
| --- | --- | --- | --- |
| 1 | Install `expo-location@58.0.8` and `adhan@4.4.6`, with the nested-copy remedy | The tree still builds both widget bundles | DONE 1.29.96 |
| 2 | `shared/qibla.ts`: the bearing and the angle maths | The 13 invariants and the surveyed fixtures | DONE 1.29.97 |
| 3 | `device/heading.ts` + `stores/qibla.ts`: the sensor boundary and the permission gate | Negative headings normalise, the `-1` sentinel is distinguished, unsubscribe runs | DONE 1.29.97, landed with step 2 as `device/qibla.ts` |
| 4 | The Settings row, the icon, the sheet shell | The row opens the sheet when granted and explains when denied | DONE 1.29.97 to 1.29.105 |
| 5 | `Dial.tsx`: the static tree, transform-rotated | 60fps on the frame audit, no re-record | DONE 1.29.107, plus 1.29.108 for the two defects the simulator found |
| 6 | Device proof on the 3T and the iOS simulator | The needle tracks and the screen is honest | DONE 1.29.109. **60fps measured on the 3T**, median gap 16.7ms |

### Step 1: the dependencies

`npx expo install expo-location` must resolve **58.0.8** (verified live on the `next` tag this session;
`latest` still points at 57.0.20, so a bare `latest` is wrong). Then `yarn add adhan@4.4.6`.

**The nested-copy trap WILL fire.** It fired in the planning spike and again in session 31 from an unrelated
dependency. After installing:

```bash
rm -rf node_modules/expo-widgets/node_modules
npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit
```

Expect 3 of 3 passing. If it still fails, `yarn install --frozen-lockfile`, then STOP and ask.

`shared/__tests__/unusedExports.test.ts` fails the moment an exported symbol has no production importer, so
**every symbol this session creates is wired up in the same step that creates it.** Never add to that test's
allow-list.

### Step 2: the maths

`qiblaBearing` delegates to `adhan`'s `Qibla`. The tests are ours, because adhan's own 11 reference values
are internally consistent but cite no external source.

Five test layers, none needing a device:

1. **Surveyed fixtures at 0.05°.** Each fixture records its **exact input coordinates** beside its expected
   value, and asserts against the **published survey figure**, never against our own recomputation.
   - UTM Johor Bahru, theodolite and solar observation: coordinates `1.5595 N, 103.6381 E`, published
     **292.9622°** (*IJARPED* 13(4)). This audit computed 292.9616°, inside the bound.
2. **Cross-validation at 0.05°:** adhan's 11 published values, plus independently published London,
   Birmingham and Jakarta.
3. **The thirteen invariants**, headed by invariant 6: **from the Kaaba's own latitude the bearing is NOT
   90° or 270°** (86.3477° from 20°E, 271.8622° from 50°E, both recomputed in `AUDIT.md`). That single test
   catches the rhumb-line and flat-map bugs which, in the published study, put **5 of the 20 most-downloaded
   qibla apps** at a consistent wrong answer.
4. **Coordinate robustness:** all four circulating Kaaba candidates agree within 0.005° (measured: 0.0037°).
5. **Oracle regression** against a WGS84 geodesic at a **0.5°** bound. Not 0.25°: `RESEARCH.md` 23.2
   corrected its own 0.181° twelve-city figure to **0.387°** over a 16,200-point global grid.

### Steps 3 to 6

Specified in full in `steps/` before execution begins, to the contract standard of `PLANNER-BRIEF.md`
section 3 item 7: names, signatures, log lines, the tests with their inputs and assertions, the break
script, the commit message and the review checklist.

## 6. Coverage

100% statements, branches, functions and lines, on every file this session adds. No ignore comments, no
`UNMEASURED` additions. The pure module in `shared/qibla.ts` carries the bulk of the logic precisely so it
is reachable by the `unit` project without React Native in the way.

## 7. Device proof

- **3T (Android 9):** `e2e/scripts/frame-audit.sh` while the dial rotates, read against **16.67 ms** gaps,
  not the harness's default 33 ms verdict. `FRAME_AUDIT=sf` for the gap distribution.
- **iOS simulator (iPhone XS replica, booted):** the sheet opens, the gate behaves in all three permission
  states, and the dial renders.
- A magnetometer sanity check on both fleet devices. **The sun-transit ground truth cannot gate this
  release:** both 2026 windows have passed and the next London-observable dates are 27/28 May 2027.

## 8. Records

On completion: the `ai/plans/README.md` row, the `ai/prompts/README.md` decisions from section 2, and the
`ai/AGENTS.md` entry for the modal-versus-sheet convention and the 60fps dial architecture.
