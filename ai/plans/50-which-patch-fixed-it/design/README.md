# The calibration hint: ten designs, and the one the owner chose

The owner rejected the shipped figure-eight hint on sight: 🐋  "the animation itself. Really ugly. Super
ugly. Okay, scrap it, redesign it from the ground up."

His requirement was that it teach without words: 🐋  "they should look really, really illustrative
because a lot of people will not read and don't know how to read. So even if you put instructions, no,
people are visual learners."

**He chose design 3, the comet trail.** 🐋  "Very nice. I love it. Let's go for comet, comet Trail,
number 3, comet Trail."

## What is here

| File | What it is |
| --- | --- |
| `designs.mjs.txt` | All ten designs, verbatim, as the generator that drew them |
| `render.mjs.txt` | The filmstrip harness: one card per design, five frames across one loop |
| `palette.mjs.txt` | `COLORS.qibla.away`, copied verbatim from `shared/constants.ts` |
| `verify.mjs.txt` | The SHIPPED geometry, re-implemented from `shared/qiblaWave.ts`, rendered through the same harness |
| `out/ALL-TEN.png` | All ten strips on one page, which is what the owner judged from |
| `out/CHOSEN-comet-trail.png` | Design 3 alone, at full size |
| `out/SHIPPED-check.png` | What the app's own geometry draws, for comparison against the design |

To redraw: copy the four `.txt` files into a directory, rename them to `.mjs`, and run
`node render.mjs designs.mjs out`.

## Why a filmstrip rather than a still

An animation cannot be judged from one frame, and the owner judges by eye. Each design is sampled at
five points through one loop and laid out left to right, so the motion is readable from a still image.

## The ten, and what each was trying to do

| # | Design | The idea |
| --- | --- | --- |
| 1 | Lantern on a chain | A masjid lantern swings the figure, so the shape is learned from a familiar object |
| 2 | Ring that fills | Apple's own metaphor: the ring FILLS, so the user can see when to stop |
| 3 | **Comet trail** | **CHOSEN.** A glowing tail leaves the whole shape visible after the phone has passed |
| 4 | Hand holding the phone | Shows a PERSON doing it. The most literal, and the best for a non-reader |
| 5 | Lanterns lighting up | Eight-point stars light one by one along the path |
| 6 | The phone paints the path | A calligraphic stroke, painted by the phone itself |
| 7 | Masjid arch | The gesture inside a pointed arch with its own lamp and keystone |
| 8 | The compass assembles | The dial the user is waiting for pulls itself together as they wave |
| 9 | Ripple pool | Rings spread like a stone dropped on water |
| 10 | Needle finding north | A needle settles as the phone waves: cause and effect in one picture |

**Design references consulted**: Apple's own compass HUD, which asks the user to tilt the phone to roll
a ball around a ring until it FILLS (a progress metaphor rather than a bare instruction, which is what
designs 2, 5 and 8 borrow); Android's figure-eight prompt; and the app's own Rub el Hizb jewel and
eight-point star from the compass design locked in at session 45.

**One design was weaker than the rest and is recorded as such rather than defended**: 9, the ripple
pool, still reads as scattered circles rather than water even after a revision pass.

## The revision pass, and what reading them back found

Every strip was rendered, read, and redrawn once. The first pass had real faults:

| Fault | Fix |
| --- | --- |
| Everything drawn too small for a sheet held at arm's length | The figure and the phone both grown by about 40% |
| The stars in 5 were spiky rather than Islamic | Inner radius raised from 0.46 to 0.72, so the points are soft |
| The arch in 7 read as a rounded rectangle | Redrawn as a true pointed arch with a keystone and a floor line |
| The ripples in 9 were too faint to see | Stroke and opacity roughly doubled |
| 8's ticks overflowed its cell and its jewel collided with the phone | Scatter reduced, jewel removed |
| 3's tail was a row of circles, reading as a chain | Redrawn as three stacked strokes of one path |

## How the port was proven, rather than assumed

The design is a Node generator; the app is TypeScript. Session 45 established that the port must be
PROVEN, because the two can drift silently. `verify.mjs.txt` re-implements the shipped `wavePoint`,
`waveTrail`, `waveLean` and `waveRoll` verbatim from `shared/qiblaWave.ts` and renders them through the
same harness. `out/SHIPPED-check.png` is the result, and it matches design 3: the same tail, the same
lean, and the phone visibly narrowing to edge-on at each crossing.

## Two constraints from the owner that shaped the implementation

**The glow is three stacked strokes, not a shadow** (🐋  "with the 1+3T, and Android, can't really do
glows and shadows"). React Native's `shadow*` props do not cross to Android and `elevation` cannot blur
a stroke, so a real glow would be iOS-only. Three passes of one path at falling width and opacity read
as a glow on both platforms, and the owner had already spotted the technique in the design: 🐋  "I see
you have like 3 layers of yellow to kind of mimic a glow."

**The phone banks like an aircraft** (🐋  "so that the user knows to actually turn the phone like an
airplane, not just sideways"). `waveRoll` scales the phone horizontally through edge-on at each
crossing, which is how a flat drawing shows a rotation out of the screen. It is driven by the same
angle as the lean, so the bank cannot drift out of step with the path.
