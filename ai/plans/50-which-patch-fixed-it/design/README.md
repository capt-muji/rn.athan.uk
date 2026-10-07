# The calibration hint: ten designs, and the one the owner chose

The owner rejected the shipped figure-eight hint on sight: 🐋  "the animation itself. Really ugly. Super
ugly. Okay, scrap it, redesign it from the ground up."

His requirement was that it teach without words: 🐋  "they should look really, really illustrative
because a lot of people will not read and don't know how to read. So even if you put instructions, no,
people are visual learners."

**He chose design 3, the comet trail.** 🐋  "Very nice. I love it. Let's go for comet, comet Trail,
number 3, comet Trail."

The design work was judged from rendered filmstrips (one card per design, five frames across one loop —
an animation cannot be judged from one frame). The ten generators, the render harness and the three
result PNGs lived in this folder; deleted in the record compression, recoverable from git (`b6949511`
1.29.221 added the designs and the shipped-check render, `e99d2411` 1.29.223 the shake-gate ruling), or regenerable by re-implementing
them: each design was a Node canvas generator; the shipped-geometry check re-implemented `wavePoint`,
`waveTrail`, `waveLean` and `waveRoll` verbatim from `shared/qiblaWave.ts` and rendered them through
the same harness, matching design 3 — same tail, same lean, phone narrowing to edge-on at each
crossing. The port was PROVEN rather than assumed (session 45's rule), because a Node design and its
TypeScript port can drift silently.

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

Design references: Apple's compass HUD (tilt to roll a ball until the ring FILLS — the progress
metaphor designs 2, 5 and 8 borrow), Android's figure-eight prompt, and the app's own Rub el Hizb
jewel and eight-point star from session 45's locked compass design. **Design 9 was weaker than the
rest and is recorded as such rather than defended**: the ripple pool still read as scattered circles
rather than water after a revision pass.

## The revision pass, and what reading the frames back found

Every strip was rendered, read, and redrawn once. The first pass had real faults:

| Fault | Fix |
| --- | --- |
| Everything drawn too small for a sheet held at arm's length | The figure and the phone both grown by about 40% |
| The stars in 5 were spiky rather than Islamic | Inner radius raised from 0.46 to 0.72, so the points are soft |
| The arch in 7 read as a rounded rectangle | Redrawn as a true pointed arch with a keystone and a floor line |
| The ripples in 9 were too faint to see | Stroke and opacity roughly doubled |
| 8's ticks overflowed its cell and its jewel collided with the phone | Scatter reduced, jewel removed |
| 3's tail was a row of circles, reading as a chain | Redrawn as three stacked strokes of one path |

## Two constraints from the owner that shaped the implementation

**The glow is three stacked strokes, not a shadow** (🐋  "with the 1+3T, and Android, can't really do
glows and shadows"). React Native's `shadow*` props do not cross to Android and `elevation` cannot blur
a stroke, so a real glow would be iOS-only. Three passes of one path at falling width and opacity read
as a glow on both platforms, and the owner had already spotted the technique: 🐋  "I see you have like
3 layers of yellow to kind of mimic a glow."

**The phone banks like an aircraft** (🐋  "so that the user knows to actually turn the phone like an
airplane, not just sideways"). `waveRoll` scales the phone horizontally through edge-on at each
crossing, which is how a flat drawing shows a rotation out of the screen. It is driven by the same
angle as the lean, so the bank cannot drift out of step with the path.
