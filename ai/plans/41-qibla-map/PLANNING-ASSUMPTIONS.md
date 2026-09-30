# Assumptions taken while writing the plan, 2026-09-30

The owner asked for these rather than questions: 🐋  "work autonomously, don't ask me questions, make
assumptions... at the end, make sure to list the assumptions."

`ASSUMPTIONS.md` holds the research session's. These are the planning session's, taken after the seven
rulings landed. The ones most likely to need correction are marked **REVIEW**.

## What the rulings did not quite settle

| # | Assumption | Why | If it is wrong |
| --- | --- | --- | --- |
| P1 | **The cache cap is 25 MB with least-recently-used eviction, rather than a hard limit of 2 cities.** | The owner said both in one breath: 🐋  "only have 2 cities saved at a time maximum. Or Okay, maybe maybe 25 megabytes worth of date." The megabyte cap is the one that bounds what the worry actually was, the user's storage, and 25 MB is about 15 locations rather than 2. | Nothing breaks; the cache just holds more places than the smaller reading would. One constant changes. |
| P2 | **The sun rung is cut entirely rather than built without its interaction.** | 🐋  "if you ask them to draw a line or put it in the shadow... No, no, no." The sun's accuracy comes from the user aligning a shadow; without that it is only a sentence saying where the sun is, which is not a qibla. **REVIEW** | The solar maths is still free and `adhan` still ships it, so this is addable later as its own row. Nothing in this plan blocks it. |
| P3 | **The compass is deleted, not hidden behind a setting.** | 🐋  "We would rather ditch the compass feature entirely if that's the case." Keeping dead code behind a flag is the thing `ai/AGENTS.md` calls scaffolding rather than furniture. | It is in git history and restorable in one revert. |
| P4 | **No bearing in degrees from north is printed anywhere on the screen.** | The owner's D6 reasoning rather than a direct instruction: the number is what made the dial look right while being 30 degrees wrong. The turn from a named street IS printed, because the user can check it against something they can see. **REVIEW** | A visible change, so it is the owner's to reverse. |

## Design judgements

| # | Assumption | Why | If it is wrong |
| --- | --- | --- | --- |
| P5 | **The map never rotates. North is always up.** | Rotating it needs the magnetometer this row exists to remove. Al-Azan ships north-up by default with rotation off for the same reason. | Additive later, and it would reintroduce the sensor. |
| P6 | **The drawn radius is 122 m.** | Measured: 49 paths and 92 ms on the floor device, still holding 16 roads, against 953 paths and 1.8 s for the whole tile. | One constant. |
| P7 | **A tile is fetched at z15 in a 3 by 3 grid.** | z15 is where the user's own building appears, and 3 by 3 keeps the ray inside the data whatever direction it points. Measured worst case 1.7 MB. | One constant each. |
| P8 | **A location counts as new when the user is more than 500 m from every cached tile centre.** | A z15 tile is 761 m across, so 500 m keeps an ordinary walk inside the cached grid without refetching on every open. **REVIEW** | Costs bandwidth or a stale-looking map, never a wrong direction. |
| P9 | **The straightness floor is 0.95 and the length floor 40 m.** | Chosen because they excluded the streets that read wrong by eye across four cities. This is fixture-blind tuning of exactly the kind this project has been burned by, and it is flagged here for that reason. **REVIEW** | Names an awkward street. It cannot bend the direction, because the turn is recomputed for whatever street is named. |
| P10 | **Buildings are drawn, and are the first thing to drop on a slow device.** | Two thirds of the path cost at every radius. | A plainer map. |
| P11 | **The sentence lives in `shared/qiblaSentence.ts`, not in the component.** | The wording is the product this row delivers, and a string built inside a component can only be tested by rendering one. | None. |
| P12 | **Makkah gets no special state in this plan.** | The 2.985-degree effect is real and bounded, and a user inside the Haram can see it. Writing a special case for the one place nobody needs the feature is worse than naming the limit. **REVIEW** | A user within a few km of the Kaaba sees a slightly worse answer than elsewhere, still inside every school's tolerance. |

## Process

| # | Assumption | Why |
| --- | --- | --- |
| P13 | **Steps 1 to 4 are one commit.** | Proven, not predicted: `unusedExports.test.ts` fails on a module with no production caller, and it named all five exports when the modules landed alone. |
| P14 | **Carried files take a `.txt` suffix.** | The convention session 6b set. Without it Jest discovers the plan's copies and the pre-commit hook runs them as real suites, which is how the first commit attempt failed. |
| P15 | **Only London and Makkah ship as real-tile fixtures.** | 80 KB gzipped for both. They cover the headline sentence and the Arabic path; Jakarta and New York would add 275 KB to prove the same code. |
| P16 | **The Android half of the device proof is deferred.** | No Android phone was connected. It carries forward beside row 40's own outstanding Android proof rather than being silently dropped. |
| P17 | **`device/tiles.ts`, `hooks/useQiblaMap.ts` and `components/qibla/QiblaMap.tsx` are specified rather than carried.** | Each needs mocks or a renderer rather than pure inputs. Every test row, contract and log line is given, so the executor writes them without choosing anything. |

## What I would question first, in the owner's place

1. **P2**, cutting the sun. It was the most accurate method found and it is genuinely free; the ruling was
   about its interaction, not its arithmetic. A version that only tells the user when the sun is usable,
   without asking them to do anything, was not explored.
2. **P9**, the two tuned thresholds, because this project has shipped a constant tuned to one room before.
3. **P4**, removing the number, because it is the most visible change in the plan and the owner has not seen
   the screen without it.
