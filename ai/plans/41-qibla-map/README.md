# Session 41: the qibla, made checkable

Research complete, 2026-09-30. **Read `PROPOSALS.md` first** if you are the owner: it holds the seven
decisions and nothing else. Read this file if you are the next session.

## What this session concluded

The row asked for an offline map, because the compass reads 30 degrees wrong indoors. **The map works and is
proven end to end.** The research also found something better and free, so the answer is a ladder rather
than a map:

| Rung | Method | Error | Proven how |
| --- | --- | --- | --- |
| 1 | The sun, shadow on a flat phone | **2.3 deg** | 0.54 arcmin against a second algorithm; the published `rashd al-qiblah` dates reproduced to the minute |
| 2 | A saved spot | Whatever saved it | **Hypothesis.** Session 40's two readings are consistent with it and do not establish it |
| 3 | The map, streets around the user | 6.2 deg, estimated | A real London tile fetched, decoded and drawn, checked in the pixels by an independent pass |
| 4 | The compass, as the last resort | 9.7 outdoors, 30 indoors | Measured in session 40 |

## The three findings that matter most

**1. `adhan@4.4.6` already ships the solar maths, so the best rung costs nothing.** No new dependency, no
megabytes, no native code. Sessions 37 and 40 both assumed the magnetometer was the only way to know which
way the phone points.

**2. The planet-map blocker was the wrong question.** A street-detail planet is 35.7 GB against Android's 4
GB ceiling, so no whole-world offline map can ship, and R1 was right about that. But the qibla does not need
a map: it needs the tile the user is standing in. A zoom-15 tile is 761 m across, so their street is inside
it. Measured worst case for a 3 by 3 grid plus district context: **1.7 MB**.

**3. No map library and almost no new code is needed.** One 91 KB dependency (`fflate`, for gzip) and
nothing else: `react-native-svg` draws it and `expo-file-system` reads the bytes, both already installed. A qibla map is a static picture with no panning, zooming or gestures, so the
whole pipeline is 173 lines of JavaScript over the `react-native-svg` already installed. The alternative was
priced honestly at +39.9 MB of native binary.

## The documents

| File | What it is |
| --- | --- |
| `PROPOSALS.md` | **The seven owner decisions.** Start here |
| `BRIEF.md` | The research brief, the constraints, and the size ruling |
| `ASSUMPTIONS.md` | Every judgement taken unattended, with the five likeliest to need correction flagged |
| `PROTOTYPE-PLAN.md` | **The next thing to do.** Three theories to test on the iPhone XS, cheapest first, merging nothing |
| `RESEARCH-STATE.md` | What each agent finished, and who can settle every open item |
| `proof/` | **The executed proof.** Eight scripts that run, plus the rendered output |

### The planning session's own work, in order

| File | What it proves |
| --- | --- |
| `agent-reports/P0-error-budget.md` | The error budget that justifies the row, and the finding that the map's value is wall-proximity rather than precision |
| `agent-reports/P1-solar-proof.md` | The solar method, validated two ways, with the altitude gate swept and the formulation that fails in North America |
| `agent-reports/P2-the-design.md` | The ladder, the 24 to 40% coverage finding that forced it, and the per-spot offset hypothesis |
| `agent-reports/P3-the-concrete-solution.md` | The map, executed end to end, with the feature cap measured |
| `agent-reports/P4-hermes-viability.md` | That the pipeline runs in Hermes: every Node dependency eliminated and gzip proven |
| `agent-reports/P5-why-the-owners-phone-lies.md` | Why a phone that points the right way is the worst outcome, and the experiment that settles the hypothesis |

### The six research reports, from five agents

| File | What it answers |
| --- | --- |
| `agent-reports/R1-basemap-data-and-delivery.md` | The tile data and how it reaches a phone. Read the real archive over range requests rather than trusting the docs |
| `agent-reports/R2-renderer-and-size.md` | What a renderer weighs, measured with the NDK linker |
| `agent-reports/R2-renderer-and-stack.md` | What a renderer breaks. The server restarted and R2 ran twice; the two passes are complementary and agree |
| `agent-reports/R3-sun-and-sensorless-methods.md` | The sun, the fiqh tolerance with real citations, and why the gyroscope and GPS course both fail as primaries |
| `agent-reports/R4-presentation-and-competitors.md` | Which picture lets a human catch an error, ranked, and what shipping apps and their users prove |
| `agent-reports/R5-prior-attempts-and-adversarial.md` | **The settled-findings register, 38 rows, and 20 durable lessons.** Read this before re-deriving anything about the qibla |

## For the next session

**Do not re-derive anything in R5's register.** It exists because sessions 37 and 40 each shipped correct
code that missed the goal, and it lists every number already proven with its source.

**The first job is not building.** It is verifying the one hypothesis the design rests on: whether the
magnetic offset at a fixed spot is stable across hours and days. Same spot, same phone, readings separated by
time. If it holds, rung 2 is a compass correction. If it drifts, rung 2 becomes a landmark note and the
ladder still stands.

**What is still unproven, named as such.** `P4` closed the Hermes question, so the list is shorter than it
was: Metro's resolver against `adhan`'s internals (with a 30-line fallback already written), the decode and
record cost on the actual SD820 and A12 rather than under V8, whether nine decoded tiles fit in memory on a
2016 phone, and above all that the map can be DRAWN rather than that users can READ it. The 6.2-degree
alignment figure is the only load-bearing number in the whole session that is an estimate.

## Status

Row 41 is **RESEARCH COMPLETE**, awaiting the seven rulings. `PLAN.md` is deliberately unwritten until the
`PROPOSALS.md` decisions land, because all seven change what the steps build. Everything in this folder is
committed and pushed to `origin/uat-2`.
