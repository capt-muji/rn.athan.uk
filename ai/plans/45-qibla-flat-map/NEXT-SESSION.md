# The next session: four steps, in this order

The owner set this sequence himself, and the order is the point: he holds the phone BEFORE the tests
are written, so a rejected look never costs a test suite. Three earlier attempts in this programme
shipped a fully tested design that was rejected on sight.

🐋  "Deep clean, implement number 1, prototype, I will test physically on a device, then you'll do 100%
testing of everything, test coverage, whatever, all 100%. More cleanup, tech debt cleanup, redundancy
cleanups, everything cleanup, making sure everything's good, clean."

**Step 0, the deep clean, was done in the session that wrote this page.** Four steps remain.

---

## THE DESIGN IS SAFE. Read this first.

The owner's stated fear was losing the design between sessions:
🐋  "I don't want to lose my design though, that's the thing, I'm scared of losing any of the design."

**It cannot be lost.** `ai/plans/45-qibla-flat-map/design/` is committed to the repository and holds
the generator, its library, the harness and both rendered states. Copying the three `.txt` files into
an empty directory, renaming them to `.mjs`, and running `node render-one.mjs d1.mjs out` reproduces
the saved SVG **byte for byte**. That was verified before the scratch space was deleted.

**`design/README.md` is the specification**: every radius, every colour, both palettes, and the
rulings from eight rounds so nothing is re-litigated. Read it before writing any code.

---

## Step 1: Implement the chosen design as a prototype

**Goal:** the compass on the phone looks exactly like `design/out/d01-off.png` and `d01-on.png`.

**What exists already, and is PROVEN ON HARDWARE.** The owner tested it and said
🐋  "it works fantastic on the iPhone XS... it follows the same as Google Maps and Apple Maps... it works
amazingly." **Do not change any of it:**

| File | What it does |
| --- | --- |
| `shared/qiblaGeometry.ts` | `qiblaBearing`, the great-circle bearing to the Kaaba |
| `shared/qiblaAlignment.ts` | `alignmentOffset`, `isAligned`, `shouldTap`, the hysteresis |
| `device/qibla.ts` | `requestQiblaPermission`, `readPosition`, `watchHeading` |
| `hooks/useQibla.ts` | Permission, position, the heading watch, and firing the tap |

**What changes** is the drawing, `components/sheets/screens/QiblaCompass.tsx`, and the geometry that
feeds it, `shared/qiblaCompass.ts`.

**Two behaviour changes the design demands:**

1. **The alignment window narrows to about 3 degrees.** The shipped constants are
   `ALIGNMENT_ENTER_DEGREES` 4 and `ALIGNMENT_EXIT_DEGREES` 8. The owner asked for one degree either
   side of the bearing. **The two thresholds must stay different**: session 43 measured a single
   threshold firing 49 taps in 100 samples of 0.3-degree jitter, which is the continuous buzz he
   refuses. Enter 1.5 and exit 3 preserves the same ratio. Decide it deliberately and write down why.
2. **The aligned state is GOLD, not green.** `COLORS.qibla` needs its second palette, and the whole
   face warms: ground, ticks, rings, letters, star, line, arrow and the Kaaba's band.

**The performance architecture is settled and must be kept**: the face is memoised and only the layer
above it rotates, because react-native-svg re-walks its whole pipeline on any attribute change. The
heading writes to a shared value, never to React state, so a twenty-a-second sensor stream costs no
render. Cardinal letters counter-rotate about their own points to stay upright.

**No tests in this step.** The owner's instruction, and the reason the order is what it is.

---

## Step 2: The owner holds the phone

Build Release to the iPhone XS (`00008020-0015585C22D2002E`) through the prebuild ritual in
`ai/AGENTS.md` section 6: bump the version, prebuild, then build.

He judges two things: does it look like the render, and does the haptic land where he faces Makkah.

**If he rejects the look, that is a replan, not a redraw.** The visual is his. Eight rounds of history
say an agent redrawing it from its own judgement is how this goes wrong.

---

## Step 3: 100% coverage, on all four measures

Only after he accepts it. Everything the pre-commit hook demands: statements, branches, functions and
lines all at 100%, `tsc` clean, Biome clean, and `find-unused-exports.py` reporting only its five
pre-existing allow-listed entries.

**Four idioms this repository needs, each learned by a failing draft:**

- A sheet draws nothing until it is presented: fire `change, 0` before asserting.
- A dismiss is fired as `'dismiss'`, never as `change, -1`.
- `renderHook` does not work here at all, so a hook is tested through the screen that uses it.
- There are TWO sheet barrels, not one.

**The whole feature is ONE commit** and this was measured rather than assumed: `unusedExports.test.ts`
reports every new export as unreachable until a production file imports it, so no smaller cut leaves
`uat-2` green.

---

## Step 4: The final cleanup

Dead code, redundancy, comments. Every comment explains WHY, never what or how, and is extremely
compact. `find-unused-exports.py` clean. No `TODO`, no `FIXME`, no `console.log`. Delete anything the
eight design rounds left behind that the shipped feature does not use.

---

## The defect catalogue: read it before drawing anything

`LOG.md` in the parent folder carries the full list. The five that will bite again:

1. **Cardinal letters that rotate with the face** lie on their sides. Session 37 shipped this at 100%
   coverage. Each letter counter-rotates about its own point.
2. **Upright is not the same as PINNED.** Text that counter-rotates stays level but still ORBITS, so
   it collides with a letter at some headings and not others. Pinning needs `heading` added to the
   angle as well.
3. **The Kaaba's counter-rotation is `-heading`, never `BEARING`.** Getting it wrong makes the cube
   spin at double rate and tumble, and **every static frame still looks correct.**
4. **Two rendered states are not proof. Sweep the heading 0 to 360.** Collisions that appear at one
   bearing and not another have bitten this project four times.
5. **A dark shape on a dark ground disappears.** The Kaaba vanished into its own recess once, at
   `rgba(8,10,24,1)` against `rgba(7,14,40,1)`.

**And the method that actually worked: render the picture and LOOK at it.** Every defect above was
invisible in code and obvious in an image. A geometry audit proves a drawing is correct; only an eye
proves it is right.
