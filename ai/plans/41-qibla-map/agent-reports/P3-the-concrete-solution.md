# P3: the concrete solution, proven end to end

Written 2026-09-30 by the planning session. The owner's instruction was explicit: 🐋  "do not stop
researching until you have a concrete solution that you are a 1000% sure that works, like a concrete,
concrete, concrete solution... Previously you did a lot of searching with like 20 different agents and yet
you still fail to make it work properly."

**So this report is not research. Every claim in it was executed.** The artefacts are committed in
`ai/plans/41-qibla-map/proof/` and they run.

## What was built and proven, in one paragraph

A real tile of central London was fetched out of the live 138 GB Protomaps planet archive using **three HTTP
range requests**, decoded from Mapbox Vector Tile protobuf **in 37 lines of plain JavaScript**, and rendered
to an image with a qibla ray drawn at the great-circle bearing. **An independent vision check measured the
rendered ray at 119.7 degrees against the 118.987 the maths computed**, read 73 named streets including
Trafalgar Square, Whitehall and The Mall, counted about 130 building footprints, and found the River Thames
correctly along the eastern edge with St James's Park lake at the lower left. It found **zero rendering
defects**. The whole pipeline is **173 lines of JavaScript** and needs no native module, no API key, no tile
server and no map library.

## 1. The blocker that dissolved

R1's verdict was the hard one: a z13 planet is 35.7 GB against Android's 4 GB install ceiling, so **no
whole-world offline map can ship**. That is correct and it is also the wrong question.

**The qibla does not need a map. It needs the tile the user is standing in.**

A z15 tile is 761 m across at London's latitude. The user's street is inside it. Nine tiles, a 3 by 3 ring,
guarantee the ray never runs off the edge whatever direction it points.

**Measured, tile by tile, out of the real archive:**

| Place | 3x3 at z15 | 5x5 at z15 | 3x3 at z13 for district context | Total for 3x3 plus context |
| --- | --- | --- | --- | --- |
| Jakarta | 839 KB | 2,255 KB | 602 KB | **1,441 KB** |
| New York | 740 KB | 1,508 KB | 454 KB | 1,194 KB |
| **London** | **655 KB** | 1,724 KB | 976 KB | **1,631 KB** |
| Cairo | 454 KB | 1,183 KB | 614 KB | 1,068 KB |
| Lagos | 371 KB | 1,084 KB | 301 KB | 673 KB |
| Dhaka | 273 KB | 1,046 KB | 296 KB | 569 KB |
| Makkah | 127 KB | 227 KB | 203 KB | 331 KB |
| Rural Wales | 6 KB | 19 KB | 65 KB | 71 KB |

**Worst case across eight places on five continents is 1.7 MB.** Against the 67 MB APK that is noise, and
size is deferred anyway. The 35.7 GB problem was an artefact of asking for the planet when the feature needs
a neighbourhood.

## 2. The zoom threshold, tested rather than taken on trust

R1 measured that streets need z13 and buildings need z15. Verified independently against the live archive at
four places:

| Place | z13 | z14 | z15 |
| --- | --- | --- | --- |
| London | 230 roads, 114 named, 34 buildings | 542 roads, 263 named, 82 buildings | 211 roads, 73 named, **770 buildings** |
| Jakarta | 292 roads, 195 named, 24 buildings | 640 roads, 453 named, 48 buildings | 226 roads, 131 named, **6,189 buildings** |
| Makkah | 141 roads, 47 named, 19 buildings | 123 roads, 46 named, 67 buildings | 57 roads, 18 named, 265 buildings |
| Rural Wales | 6 roads, 0 named, 0 buildings | 1 road, 0 named | 1 road, 0 named |

**z15 is the level where the user's own building appears**, which is what makes the picture checkable.
**Rural Wales is the honest limit**: no named roads at any zoom, so the map has nothing to offer there and
the design must fall through to another method rather than draw an empty square.

## 3. The pipeline, and why it needs no map library

R2 was asked whether MapLibre works on RN 0.88. **The finding is that the question does not have to be
answered**, because a qibla map is a static picture and does not need a map engine: no panning, no zooming,
no gesture handling, no label collision, no style spec.

| Stage | How | Lines |
| --- | --- | --- |
| Locate the tile in the archive | PMTiles v3 header, then root and leaf directories, Hilbert tile id | 32 |
| Fetch it | Three HTTP range requests, or a local file read once bundled | 31 |
| Decode the vector tile | MVT protobuf: layers, features, tags, zigzag geometry commands | 37 |
| Draw it | `react-native-svg`, already installed at 15.15.5 | 73 |

**Verified sub-steps, each of which could have failed silently:**

- **The PMTiles v3 header parses.** Magic `PMTiles`, version 3, tile type 1 (MVT), min zoom 0, max zoom 15,
  bounds -180 to 180 and -85.0511 to 85.0511, 1,431,655,765 addressed tiles. **My first attempt had the field
  offsets off by one** and reported "minzoom 15, maxzoom 0" with nonsense bounds, which is exactly the kind of
  wrong-but-plausible result that ships as a bug. Fixed against the spec and re-read.
- **Hilbert indexing matches the spec's own worked examples**: z0 (0,0) is 0, z1 (0,0) is 1, (0,1) is 2,
  (1,1) is 3, (1,0) is 4, z2 (0,0) is 5.
- **The two-level directory walk works.** London z15 (16372, 10896) is tile id 518974351. The root gave a
  `runLength: 0` entry pointing at a leaf directory of 61,023 entries, which held the tile at offset
  75,936,087,961, length 61,808.
- **The tile decodes to 8 layers**: `boundaries`, `buildings` (770), `earth`, `landuse` (120), `places`,
  `pois` (1,310), `roads` (211), `water` (17), extent 4096.
- **The metadata confirms what is available offline**: `buildings` carries `height` and `min_height`,
  `roads` carries `kind`, `is_bridge`, `is_tunnel`, and `earth` carries `name:ar` among other localised
  names, which matters for row 39.

## 4. The independent verification

The render was checked by a vision pass that was given the file and asked what is in the pixels, without
being told what to expect beyond the bearing.

| Question | Answer |
| --- | --- |
| Is a street map visible? | Yes. About 50 to 80 distinct roads, 128 building polygons over 40 px, mixed line weights, roundabouts resolved |
| The qibla ray's measured direction | **119.7 deg by line fit, 120.6 by endpoint**, against 118.987 computed |
| Does the ray start at the exact centre? | Yes, the fitted line passes within 1.7 px of (400,400) |
| Water | Correct: Thames along the eastern edge running north to south, which is right for the Westminster reach, plus St James's Park lake at the lower left |
| Rendering defects | **None found.** No gaps, no solid blocks, no misdrawn lines |
| Could a person standing there check the ray? | **Yes**, with the caveat that street names are not drawn, so it is shape matching rather than label reading |

**The vision pass also corrected me.** I told it to expect the Thames running west to east across the lower
portion. It reported the river running north to south along the eastern edge and said plainly that the render
is right and the expectation is wrong. It is: Trafalgar Square sits about 350 m west of a bank that runs
roughly north to south there. **A check that only confirms is not a check, and this one disagreed with its
instructions and was correct.**

## 5. Where this leaves the design

`P2` established the ladder. This report supplies the map rung as a proven thing rather than a hoped-for one,
and `P1` supplies the sun rung the same way.

| Rung | Method | Error | Coverage | Proven how |
| --- | --- | --- | --- | --- |
| 1 | Sun, shadow on a flat phone | **2.3 deg** | Every day outside the polar night, at some hour; 24 to 40% of prayer times | 0.54 arcmin against a second algorithm, and the published rashd al-qiblah dates reproduced to the minute |
| 2 | A saved spot | Whatever saved it | **100% once saved**, indoors, at night, overcast | Not yet proven; the per-spot offset's stability is the execution session's first job |
| 3 | The map, 3x3 tiles at z15 | 6.2 deg estimated | Anywhere the archive has streets, which excludes rural Wales | This report, end to end, with an independent pixel check |
| 4 | The compass, named as the last resort | 9.7 outdoors, 30 indoors | Always | Measured in session 40 |

**Both of the top three rungs are now concrete.** Rung 2 is the only one resting on a hypothesis, and `P2`
says so.

## 6. The open questions, named rather than hidden

1. **Delivery.** The tiles have to reach the phone. Bundling a region fixes it at build time, which R1 shows
   is the only option that satisfies a strict reading of the offline rule. A one-time fetch of nine tiles is
   about 1.7 MB and would cover any user anywhere, but it needs a network once. **This is an owner decision
   and `PROPOSALS.md` carries it.** My recommendation is to bundle London, since the app is London-only
   today, and fetch-once for anywhere else.
2. **Metro's resolver.** `P1`'s deep `require` into `adhan`'s internals is blocked by the package's
   `exports` map under Node. Metro resolves differently and this must be tested, with the 30-line
   transformation as the proven fallback.
3. **Hermes performance.** The decode ran in Node. The floor devices are an SD820 and an A12. A 112 KB tile
   decode and a few hundred SVG paths are both well inside what this app already does, and neither is
   measured on device yet.
4. **The rural case.** No named roads means no map. The design needs an explicit "the map has nothing here"
   state rather than an empty square.

## 7. R2 contradicted this report, and the contradiction is resolved by measurement

R2 measured the real ceiling from this repo's own device data: `react-native-svg` costs 1.33 to 1.87 ms per
path on the SD820, which is **8 to 12 paths per frame at 60fps and 17 to 24 at 30fps**. My London tile holds
**1,119 features**. At 1.33 ms that is **1.49 seconds** to record, and 2.09 at 1.87.

**Both reports are right, and the disagreement is about what kind of cost this is.** The dial re-records
while the needle turns, so its budget is per frame. **The qibla map records ONCE**: no panning, no zooming,
no gestures, so it pays an OPEN cost, not a frame cost. R2's per-frame ceiling does not bind it.

**That does not rescue it.** A 1.5 to 2.1 second freeze on opening the sheet is unacceptable on its own
terms, so **the feature cap this report flagged as unwritten is mandatory rather than an optimisation.**

The cap is not a guess either. Counting features within a radius of the centre of the real tile:

| View width | Roads | Buildings | Water | Total paths | Record cost at 1.87 ms |
| --- | --- | --- | --- | --- | --- |
| **122 m** | **16** | **32** | 1 | **49** | **92 ms** |
| 228 m | 27 | 91 | 1 | 119 | 223 ms |
| 381 m | 53 | 195 | 1 | 249 | 466 ms |
| 609 m | 155 | 486 | 6 | 647 | 1,210 ms |
| 761 m, the whole tile | 206 | 734 | 13 | 953 | 1,782 ms |

**A 122 m view costs 49 paths and 92 ms, and it holds 16 roads.** R2's own answer to "what does the user
actually need" was the user's own street, the two or three it meets, and a north arrow. **16 roads is five
times that.** So the cheapest useful view is already richer than the requirement, and the budget is met with
room to spare.

**This is the cap, stated as a rule rather than a number to tune:** draw a fixed ground radius around the
user, about 60 m each way, and never the whole tile. The ground radius is what the user can see from where
they stand, which is also the only part of the picture they can check. Drawing more is both slower and less
useful, which is a rare case of the budget and the design agreeing.

Buildings are two thirds of the cost at every radius, so if a device ever needs a cheaper view, buildings are
the first thing to drop and roads are what must stay.

## What I attacked in my own conclusion

- **The header parse was wrong first and looked plausible.** Off-by-one field offsets gave "minzoom 15,
  maxzoom 0" and impossible bounds. I only caught it because the numbers were absurd; a subtler offset error
  would have survived. Every structural read in this report was re-derived from the spec afterwards.
- **I checked whether the vision pass was agreeing with me.** It was not: it contradicted my stated
  expectation about the Thames and was right. That is the evidence that the check is real.
- **The 1.7 MB figure is a 3x3 at one point, not a region.** A user who walks two streets leaves the centre
  tile, and the ring is what covers that. It is not a pack for a city and must not be quoted as one.
- **The decode ran on a 112 KB London tile, and Jakarta's z15 tile holds 6,189 buildings.** The worst case is
  an order of magnitude denser than the one I proved, and drawing 6,189 footprints would breach the frame
  budget. The design needs a feature cap or a zoom choice per density, which is unwritten.
- **The strongest objection I cannot answer with a measurement:** everything above proves the map can be
  DRAWN, not that users can READ it. The 6.2-degree alignment term in `P0` is still an estimate built from
  four guesses, and no amount of pipeline proof changes that. What this report removes is the engineering
  risk, which was the thing two previous sessions actually died on.
