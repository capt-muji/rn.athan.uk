# The working code, preserved. NOT app code: reference for the next session.

Every file here is a `.txt` copy of code that **ran on the owner's iPhone XS and was accepted by him**:

🐋  "Functionally, it works fantastic on the iPhone XS. It follows the same as Google Maps and Apple
Maps. Very, very nice. It works amazingly."

It is kept as text rather than left in the working tree because the pre-commit hook enforces 100%
coverage and the drawing has no tests yet, by the owner's own instruction
(🐋  "don't worry about the unit testing yet... this is a prototype"). Committing it here means the
session can end clean without losing a line of proven work.

## What runs, and must NOT be redesigned

| File | What it does | Status |
| --- | --- | --- |
| `shared_qiblaGeometry.ts.txt` | `qiblaBearing`: the great-circle bearing to the Kaaba | **Proven on device** |
| `shared_qiblaAlignment.ts.txt` | `alignmentOffset`, `isAligned`, `shouldTap`: the hysteresis that gives one tap per crossing | **Proven on device** |
| `device_qibla.ts.txt` | `requestQiblaPermission`, `readPosition`, `watchHeading` | **Proven on device** |
| `hooks_useQibla.ts.txt` | Permission, one position read, the heading watch, firing the haptic | **Proven on device** |
| `shared_qiblaCompass.ts.txt` | The face's geometry: ticks, labels, studs, the Rub el Hizb, `unwrapHeading` | Superseded by the chosen design |
| `components_..._QiblaCompass.tsx.txt` | The drawing | **Superseded: redraw to `design/README.md`** |
| `components_..._Qibla.tsx.txt` | The sheet that hosts it | Mostly reusable |
| `*_test.ts.txt` | 31 unit tests over the geometry, the alignment and the device wrapper | All passing |
| `compass.svg.txt` | The diamond compass icon the owner asked for by name, recovered from `15f735cf^` | Keep |
| `wiring.patch.txt` | The diff that wires it in: the settings row, both barrels, the layout mount, the store atom, `COLORS.qibla`, `Icon.COMPASS`, the plist string | Reapply |

## The three things the next session changes

1. **The drawing** becomes the chosen design. `design/README.md` has every radius and colour.
2. **The alignment window** narrows from enter 4 / exit 8 to about enter 1.5 / exit 3, for the owner's
   3-degree window. **The two thresholds must stay different**: a single threshold fired 49 taps in
   100 samples of 0.3-degree jitter.
3. **The aligned state turns GOLD**, not green. `COLORS.qibla` gains its second palette.

## How to restore it

```bash
cd ai/plans/45-qibla-flat-map/working-code
cp shared_qiblaGeometry.ts.txt      ../../../../shared/qiblaGeometry.ts
cp shared_qiblaAlignment.ts.txt     ../../../../shared/qiblaAlignment.ts
cp shared_qiblaCompass.ts.txt       ../../../../shared/qiblaCompass.ts
cp device_qibla.ts.txt              ../../../../device/qibla.ts
cp hooks_useQibla.ts.txt            ../../../../hooks/useQibla.ts
cp components_sheets_screens_Qibla.tsx.txt        ../../../../components/sheets/screens/Qibla.tsx
cp components_sheets_screens_QiblaCompass.tsx.txt ../../../../components/sheets/screens/QiblaCompass.tsx
cp shared___tests___qiblaGeometry.test.ts.txt     ../../../../shared/__tests__/qiblaGeometry.test.ts
cp shared___tests___qiblaAlignment.test.ts.txt    ../../../../shared/__tests__/qiblaAlignment.test.ts
cp device___tests___qibla.test.ts.txt             ../../../../device/__tests__/qibla.test.ts
cp compass.svg.txt                  ../../../../assets/icons/svg/compass.svg
cd ../../../.. && git apply ai/plans/45-qibla-flat-map/working-code/wiring.patch.txt
yarn add expo-location@58.0.9
rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile
```

**That last pair is mandatory, not a contingency.** `yarn add expo-location` reintroduces a nested
`@expo/ui@58.0.7` under `expo-widgets` while the flat pin reads `58.0.5`, and
`widgetRuntimeLoads.test.ts` fails 2 of 3 until it is cleared. It fired during this session exactly as
`ai/AGENTS.md` predicts.

Also delete `shared/__tests__/qiblaRemoved.test.ts`, session 44's guard: it fails the moment any file
named `qibla*` exists, and its job is done.
