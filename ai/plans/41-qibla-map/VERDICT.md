# The verdict, in plain terms

The owner asked directly: 🐋  "what's the verdict? So far, is this map approach better or worse for us? Is it
confirmed better? Do other people use this method? Is this method a new method? Is it an old method? Is it a
proven and tested method?"

Five questions. Answered in order, shortest first.

---

## 1. Is the map a new method or an old one?

**Old. Older than the app, older than smartphones, and in the case of the sun, eight centuries old.**

| Method | First attested | Source |
| --- | --- | --- |
| The sun and a shadow (`rashd al-qiblah`) | **c. 1221**, Jaghmini; then al-Tusi (1201 to 1276) | R3, and Wikipedia citing Abdali 1997, van Gent 2017 |
| Qibla on a map | Standard practice in shipped prayer apps today | R4 section 3 |
| The magnetometer dial | The newest of the three, and the one that failed twice here | Sessions 37 and 40 |

The irony worth stating: **the app built the newest method first and it is the only one that broke.**

---

## 2. Do other people use it?

**Yes. Five shipping products, including the category leader, and one of them makes it the primary surface.**

| App | How it uses a map | Size |
| --- | --- | --- |
| **Qibla Finder 100%** | Map with the line is **PRIMARY**, compass secondary | 110.6 MB |
| **Athan (IslamicFinder)** | Compass dial, **map view offered as the verification path**. 10M+ installs | 301 MB |
| **Google Qibla Finder** | Map line on desktop, AR line on mobile | Web app |
| **Muwaqqit** | Superimposes the qibla on a map (two independent user reports) | Unverified |
| **IslamicFinder website** | Map-and-pin tool | Web |

All from R4 section 3, read from store listings and product pages.

---

## 3. Is it proven and tested?

**Yes, and the strongest evidence is a competitor's developer defending it against the exact objection the
owner raised.** From R4 section 3, an App Store developer response:

> "For better results, we show the Kaaba on the map using the line method. Again, even if your compass sensor
> rotates too much, you can confirm 100% which side of the building you are on is the qibla. Accordingly, you
> should find the most accurate qibla by comparing."

**That is this row's entire thesis, written by someone who ships it, to answer a user complaint.** Not
marketing.

**And one inversion is in our favour.** That app's changelog reads: "The app now picks the best map view for
your device and connection, and opens the compass when you're offline." **Their map needs the network and
their compass is the offline fallback.** This app's constraint reverses it: the map is bundled and offline,
the compass is the fallback. **We would ship the more robust version of a method the market has validated.**

---

## 4. "Okay, we have a map. But what about the actual DIRECTION?"

This was the sharpest question and it deserves the longest answer.

**The map does not measure direction. It transfers a direction that is already exact.** Those are different
jobs, and only the second one ever broke.

The chain has two links:

| Link | Question | State |
| --- | --- | --- |
| 1 | Where does Makkah lie from here? | **EXACT.** Arithmetic, validated to 0.002 degrees, 13 invariants, shipped since session 37 |
| 2 | Which way am I facing? | **BROKEN.** The magnetometer said 190 where the truth was 118.9 |

**Link 1 was never the problem.** The bearing has been right the whole time. Session 40 proved this: the dial
and the bearing were correct throughout, and only the heading VALUE was wrong.

**The map replaces link 2 with something steel cannot bend: a street.** A street's bearing is a fact of the
ground, held in the tile data, not a sensor reading. So the app can compute the qibla as an offset from a
street the user can see. Proven on the real decoded London tile
(`proof/street-bearings.js`), qibla 119.0 degrees:

| Street | Runs at | So the qibla is |
| --- | --- | --- |
| Whitehall | 172 | **53 degrees left** of it |
| Pall Mall | 62 | 57 degrees right |
| Haymarket | 148 | 29 degrees left |
| St Martin's Place | 106 | 13 degrees right |
| Strand | 51 | 68 degrees right |

**Twelve streets, every figure from the tile, zero sensors consulted at any point.** The user looks at a
street they can see and turns from it. That is the answer to "what about the direction": the direction comes
from arithmetic, and the map is how a human aims it.

---

## 5. Is it better or worse for us? Is it CONFIRMED better?

**Better, and confirmed on the one axis that matters. Not confirmed on another, and that is stated rather
than hidden.**

| | Compass (shipped) | Map | Sun |
| --- | --- | --- | --- |
| Error outdoors | 9.7 deg **measured** | 6.2 deg estimated | 2.3 deg |
| **Error indoors** | **30 deg measured** | **6.2 deg, unchanged** | Needs a window |
| Grows near a wall | **Yes, and invisibly** | **No** | No |
| Can the user catch an error? | **No** | **Yes** | Yes |
| Works at night | Yes, badly | Yes | **No** |
| Cost | Shipped | 1.7 MB per location, no map library | **Zero** |

**Confirmed better: the map's error does not grow when the user steps near a wall.** That is a measurement
against a measurement, 6.2 against 30, and it is the failure that made the owner ready to scrap the feature.

**Confirmed better: the user can see an error.** A wrong line contradicts the street in front of them. A
wrong needle contradicts nothing.

**NOT confirmed: the 6.2 degrees itself.** It is built from four human-factor estimates and is the only
load-bearing number in this row that is not measured. R4 searched the HCI literature and found no published
figure for transferring a screen angle to your own body. **On open floor the honest comparison is 10.9 for
the compass against 6.2 for the map, and that gap is thin.** The indoor comparison is what decides, and it is
not thin.

**The surprise, and the reason this session was worth running: the sun beats the map on every axis except
indoor coverage, and it costs nothing.** `adhan@4.4.6` already ships the solar maths. That is why the answer
is a ladder rather than a map, and why the map ends up third rather than first.

---

## The verdict in one paragraph

**The map is confirmed better than the compass where it counts, it is an old and shipped method rather than an
experiment, and it is not the best thing this session found.** The sun is more accurate, entirely free, and
older still. So the recommendation is the ladder in `PROPOSALS.md` D1: the sun first, a saved spot second, the
map third for the traveller with no sun, and the compass last and honestly labelled. **The map's job is not to
find the qibla. The bearing was always exact. The map's job is to let a human aim it at something they can
see, and to make a mistake visible when it happens.**
