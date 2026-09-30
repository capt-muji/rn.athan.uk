# Research state: what is finished, what is left, and who can settle it

Written 2026-09-30 by the planning session, after the owner reported the GLM 5.3 research agents had hit a
3-hour quota timeout and asked for their work to be picked up rather than restarted.

## Nothing was lost. Every agent finished.

The quota hit AFTER all six reports were written and committed. Checked file by file rather than assumed:

| Report | Lines | Sections | Closing self-review | State |
| --- | --- | --- | --- | --- |
| `R1-basemap-data-and-delivery.md` | 702 | 10 | Yes | **Complete** |
| `R2-renderer-and-size.md` | 241 | 9 | Yes | **Complete** |
| `R2-renderer-and-stack.md` | 662 | 9 | Yes | **Complete** |
| `R3-sun-and-sensorless-methods.md` | 766 | 11 | Yes | **Complete** |
| `R4-presentation-and-competitors.md` | 700 | 9 | Yes | **Complete** |
| `R5-prior-attempts-and-adversarial.md` | 449 | 7 | Yes | **Complete** |

None ends mid-sentence. Each carries its brief's numbered sections and its own attack on its own conclusion.
**R2 ran twice** because the server restarted mid-wave, and both passes are kept: one measured what a
renderer WEIGHS with the NDK linker, the other found what it BREAKS. They agree on every verdict.

**So there is nothing to redeploy.** A fresh agent would re-derive 3,520 lines of committed work. The
leftovers are not unfinished research; they are verification items the agents correctly refused to guess.

## What the agents left open, classified by who can settle it

This is the useful inventory, because it shows that **more research is the wrong tool for almost all of it.**

### Needs a DEVICE BUILD. No research can settle these.

| Item | Report | Why only a build answers it |
| --- | --- | --- |
| Does `@maplibre/maplibre-react-native` run on RN 0.88? | R2 | Peer range admits it, 0.87 got an explicit fix, nobody upstream builds on 0.88. Their examples sit at 0.83 and 0.85 |
| Does its config plugin survive this repo's prebuild? | R2 | The widget extension is a second Podfile target and issue `#1650` links SPM into every target |
| WebView GL performance on the SD820 and A12 | R2 both passes | No published measurement exists for any device of this class |
| 20+ simultaneous tile `Image`s on the 3T | R2 | Never measured by anyone |
| Skia's real linked size after dead-strip | R2 | Pre-link archives are 83.2 MB; the linked figure needs a build |
| Decode and record cost in Hermes on both floor devices | P4 | The 4.3 ms and 11.3 ms figures are V8 |
| Whether the per-spot magnetic offset is stable | P2 | **The one load-bearing hypothesis in the session** |

**None of these blocks the plan**, because the design that came out of the research needs no map library at
all, which is what makes most of the MapLibre column moot.

### Settled by the planning session after the agents stopped

| Item | Who flagged it | How it was settled |
| --- | --- | --- |
| Metro's resolver against `adhan`'s internals | P1 flagged, R3 settled | R3's own verification pass drove the specifier through real resolver instances: **Metro resolves it**, Jest and tsc do not |
| **R1's Greater London z14 figure** | R1 flagged it as "the one number a five-minute CLI run should confirm" | **Confirmed independently this session.** See below |
| Nine decoded tiles in memory | P4 refused to bet on it | Measured at **1.28 MB** at the design's radius |
| Gzip without Node's `zlib` | P4 | `fflate@0.8.3` browser build, byte-identical output in 4.3 ms, zero `require` calls |

**R1's flagged number, now confirmed.** R1 summed Greater London's tiles by walking the archive's
directories with a dedup-aware Set, and flagged the result because it could not run the `pmtiles` CLI to
check it. Re-derived independently here over the bbox `-0.51,51.28` to `0.334,51.686`:

| Zoom | Grid | Tiles | Unique blobs | Empty | Size |
| --- | --- | --- | --- | --- | --- |
| z12 | 10x9 | 90 | 90 | 0 | 5.71 MB |
| z13 | 20x16 | 320 | 320 | 0 | 12.86 MB |
| z14 | 40x30 | 1,200 | 1,200 | 0 | 28.12 MB |
| **Cumulative z12 to z14** | | **1,610** | | | **46.69 MB** |

R1 reported about 60 MB for the same region and zoom cap. **46.69 MB measured here, so R1's figure was
conservative rather than wrong**, and the difference is bbox choice rather than method: both walked the real
archive and both counted unique blobs once. **Zero empty tiles across all 1,610**, which also confirms the
archive has full coverage of the region rather than gaps.

**This number is for the record and the design does not use it.** A whole-region pack is the alternative the
session rejected: the design needs a 3x3 at z15 around the user, measured at **1.7 MB worst case**, not 47 MB
for a city.

### Genuinely open research questions, and they are small

| Item | Report | Note |
| --- | --- | --- |
| Two competitor app listings read via search snippet rather than fetched | R4 | `umma` and `Muwaqqit`. Affects nothing: the map thesis is already confirmed by four other apps including the category leader |
| The human alignment error terms (0.5, 2, 3, 5 degrees) | P0 | **The only load-bearing estimate in the session.** R4 searched the HCI literature and found north-up versus track-up studies, not a figure for "transferring a screen angle to your own body" |

## The verdict on the map, since the owner asked

**The map method is old, proven, and in production. It is not new and it is not ours.**

| Evidence | Source |
| --- | --- |
| **Qibla Finder 100%** ships the map as PRIMARY and the compass as secondary | R4 section 3, store listing, 110.6 MB |
| **Athan by IslamicFinder** ships a map view as the verification path, 10M+ installs | R4 section 3 |
| **Google's own Qibla Finder** draws the line on a map on desktop | R4 section 3.4 |
| **Muwaqqit** superimposes the qibla on a map, per two independent user reports | R4 section 3 |
| **IslamicFinder's website** tool is map-and-pin based | R4 section 3 |

The decisive quote is a competitor developer answering the exact objection, in R4 section 3:

> "For better results, we show the Kaaba on the map using the line method. Again, even if your compass sensor
> rotates too much, you can confirm 100% which side of the building you are on is the qibla. Accordingly, you
> should find the most accurate qibla by comparing."

**That is this row's thesis in a shipping competitor's own words**, and it was written to answer a user's
complaint rather than to market anything.

**One inversion matters and it is in our favour.** That app's changelog reads: "The app now picks the best map
view for your device and connection, and opens the compass when you're offline." **So their map needs the
network and their compass is the offline fallback.** This app's constraint reverses it: the map is bundled and
offline, and the compass is the fallback. **We would ship the more robust version of a method the market has
already validated.**

**And the shadow method is older still.** `rashd al-qiblah` is attested from Jaghmini around 1221 and
al-Tusi (1201 to 1276), and this session's code reproduces its published dates to the minute. Neither rung
is an invention; both are established practice this app has not implemented yet.

## What this means for redeployment

**Do not redeploy the research agents.** Their reports are complete, committed and pushed, and the open items
are device work rather than desk work. Redeploying would spend quota re-deriving 3,520 committed lines and
would return the same UNVERIFIED marks, because no amount of searching measures an SD820.

**The next agent this row needs is not a researcher.** It is an execution session with a phone, and the
owner has said the Android devices return. Its first job is named in `PLAN.md` step 1 and it is the one
hypothesis everything else rests on.
