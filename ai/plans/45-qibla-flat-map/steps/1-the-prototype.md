# Step 1: The chosen compass as a prototype the owner can hold, no tests, never committed

**REFRESHED 2026-09-30.** The map this step originally specified was built, put on the XS, and rejected on looks
while its FUNCTION was accepted. This step now builds the compass the owner locked in after eight design rounds.
`design/README.md` is its specification and it is authoritative over every number below.

0. **Anchor check.**

   ```bash
   C() { python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "ai/plans/45-qibla-flat-map/scripts/anchors/$1.txt" "$2"; }
   C 1-1 shared/__tests__/qiblaRemoved.test.ts
   C 2-1 app/_layout.tsx; C 2-2 components/sheets/index.ts
   C 3-1 components/sheets/screens/Settings.tsx; C 3-2 components/sheets/screens/Settings.tsx
   C 3-3 stores/ui.ts
   ```

   Expected: `1` six times.

1. **Goal:** the compass on the phone looks exactly like `design/out/d01-off.png` and `d01-on.png`, and taps once
   each time the user turns onto the line.

2. **Branch:** none, and **nothing is committed in this step.** The pre-commit hook enforces 100% coverage and
   `unusedExports.test.ts` reports every new export as unreachable, so a prototype fails it twice over and
   `--no-verify` is forbidden. The owner deferred the tests for this iteration by name: 🐋  "No need to do any
   testing or unit testing or any coverage because it's just a prototype... I will do the testing physically on the
   device."

3. **Files.**

   | File | What |
   | --- | --- |
   | `shared/qiblaGeometry.ts`, `shared/qiblaAlignment.ts`, `device/qibla.ts`, `hooks/useQibla.ts` | Restored from `working-code/`. **Proven on the owner's phone; do not redesign** |
   | `shared/qiblaCompass.ts` | New: the face's geometry |
   | `components/sheets/screens/QiblaCompass.tsx` | New: the drawing |
   | `components/sheets/screens/Qibla.tsx` | New: the sheet |
   | `shared/constants.ts` | `COLORS.qibla`, the design's two palettes |
   | `assets/icons/svg/compass.svg`, `shared/types.ts`, `assets/icons/svg/index.ts` | The diamond icon the owner asked for by name, and `Icon.COMPASS` |
   | `stores/ui.ts`, both barrels, `app/_layout.tsx`, `Settings.tsx`, `app.json` | The wiring |
   | `shared/__tests__/qiblaRemoved.test.ts` | **Deleted**: it fails the moment any `qibla*` file exists |

4. **Tests first (red).** None, by the owner's instruction above.

5. **Change.**

   ### The two behaviour changes the design demands

   1. **The window narrows to the owner's 3 degrees**: `ALIGNMENT_ENTER_DEGREES` 1.5 and `ALIGNMENT_EXIT_DEGREES` 3
      (🐋  "one degree on the left, one degree in the middle perfectly, one degree on the right"). **The two must
      stay different, and the RATIO is what matters**: a single threshold fired 49 taps in 100 samples of
      0.3-degree jitter in session 43, and 28 on this session's own control. Keeping 2:1 preserves what was proven.
   2. **The aligned state is GOLD, not green**, and the WHOLE instrument warms at once: ground, ticks, rings,
      letters, jewel, line, arrow and the Kaaba's band.

   ### The geometry, from `design/README.md`

   Every radius is a share of the face's radius and lives in one `FACE` object, so no number is invented at a call
   site. Centre outward: the gold pivot dot `0.034`, the Rub el Hizb jewel outline `0.125` with a second at
   `0.083`, the line and its barbed head as ONE closed path (barbs on `0.600`, notch `0.648`, tip `0.715`, barb
   half-width `0.046`, shaft `0.0125` tapering to `0.0110`), the inner circle `0.6`, the letters `0.760` at size
   `0.096` **always plain ink and never gold**, the ticks every 15 degrees hanging inward from `0.905` in three
   weights, the rim disc `0.985` and one ring `0.945`, the Kaaba on the edge at `0.88` sized `0.116`, and the qibla
   arc at `0.9815` spanning `±6.5`. **Nothing is drawn above the dial**: the owner removed the fixed marker
   deliberately.

   ### The transform composition, which is where this has gone wrong three times

   The face carries `rotate(-heading)`. Anything that must stay upright on the card counter-rotates by **`+heading`
   about its own point**, which CANCELS the face's turn. Passing `-heading` makes it spin at double rate and
   tumble, **and every still frame still looks correct**, so a single render cannot catch it.

   ### The performance architecture, which is settled

   The face is memoised and only the layer above it rotates, because `react-native-svg` re-walks its whole drawing
   pipeline on any attribute change. The heading writes to a SHARED VALUE, never to React state, so a
   twenty-a-second sensor stream costs no render. The two palettes are stacked and cross-faded on opacity, so
   turning gold never redraws the face.

6. **Green.** `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0. The full suite is NOT run
   and is expected to fail: this step has no tests and unreachable exports.

7. **Breaks.** None. There are no tests to break.

8. **Prove the drawing before spending a build on it.** Render the SHIPPED component's own geometry and draw order
   to SVG, convert with `rsvg-convert`, and LOOK at it. Three checks, each of which caught something here:

   - **Against the approved design**: the port must reproduce `lib.mjs`'s primitives exactly, and the generator must
     still reproduce `design/out/*.svg` byte for byte.
   - **Across a heading sweep**, not two states: 0, 40, 95, 160, 200, 250, 300, plus a southward bearing. A Kaaba
     that collides with a letter appears at some bearings and not others.
   - **Bounded numerically over every bearing**, because the eye cannot sweep 1,440 of them: the Kaaba against each
     letter, the arrow tip against the Kaaba, the Kaaba's corner against the rim arc, and the letters against the
     deepest tick.

9. **Build and install on the iPhone XS.** `expo-location` is in the native tree, so a JS reload cannot carry it.
   Bump the version FIRST, then prebuild, then build: `expo run:ios` never re-syncs an existing native directory.

   ```bash
   npx expo prebuild -p ios --no-install
   grep -A1 CFBundleShortVersionString ios/Athan/Info.plist
   grep -A1 NSLocationWhenInUseUsageDescription ios/Athan/Info.plist
   npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E
   ```

   `yarn add expo-location@58.0.9` reintroduces a nested `@expo/ui` under `expo-widgets`. This is mandatory, not a
   contingency: `rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile`, then
   `widgetRuntimeLoads.test.ts` must pass 3 of 3.

10. **The owner's verdict.** He opens Settings, presses Qibla, allows location, and judges two things: does it look
    like the render, and does the haptic land where he faces Makkah. **If he rejects the look, that is a replan,
    never a redraw from the session's own judgement.** Eight rounds of history say so.

11. **Review.** None: nothing is committed.

12. **Merge.** None.

13. **Done when:** the build is installed on the phone, `LOG.md` records what was built and measured, and the tree
    holds only this feature's files plus the plan folder's own.
