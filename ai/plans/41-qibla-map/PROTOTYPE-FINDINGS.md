# Prototype findings

Running `PROTOTYPE-PLAN.md`. Written as each step reports, newest last. Nothing here is merged into the app;
every code change is reverted from its own diff once its number is recorded.

---

## Step P2a, part 1: the import route is decided, and NOT the way R3 recommended

**Question.** `P4` section 5 found that Metro, Jest and tsc disagree about a deep import into `adhan`'s
internals: Metro resolves `adhan/lib/cjs/SolarTime.js`, Jest and tsc refuse it. R3 measured a public-API-only
route as the alternative at "0.288 degrees mean, 1.350 worst" and called it the fallback. **If the public
route is good enough, the disagreement disappears entirely and no config change is needed.**

So I rebuilt the public route from scratch and swept it far wider than R3 did: 10 cities, all 12 months,
seven times a day, keeping only samples inside the design's own 5 to 65 degree altitude gate.

**Result: the public route is NOT good enough, and the reason is a genuine singularity rather than a bug.**

| Measure | Value |
| --- | --- |
| Samples in the gate | 419 |
| Mean error | **0.484 deg** |
| **Worst error** | **7.847 deg**, at Singapore in January |

R3's 1.350 worst came from a 5-city sample that happened to miss the failure. **Mine found it by adding
Singapore, Lagos and Reykjavik**, which is the fixture-blind-spot rule catching a real defect for the second
time in this session.

### The root cause, measured

The public route recovers the sun's declination from the length of the day, because `PrayerTimes` gives
`sunrise` and `sunset` but not declination. **How well that works depends entirely on latitude**, because
near the equator the day length barely changes across the year:

| Place | Latitude | How much the half-day angle moves across a whole year |
| --- | --- | --- |
| **Singapore** | 1.35 | **1.17 deg** |
| Jakarta | -6.21 | 5.41 deg |
| Lagos | 6.52 | 5.68 deg |
| Karachi | 24.86 | 23.18 deg |
| London | 51.51 | 66.12 deg |

**`adhan` rounds its prayer times to the whole minute.** So near the equator the solve is reading declination
out of rounding noise. Measured directly, the cost of one minute of rounding:

| Place | Declination error from 1 minute of rounding |
| --- | --- |
| **Singapore** | **9.07 deg** |
| Lagos | 2.17 deg |
| Karachi | 0.54 deg |
| London | 0.20 deg |

**That is structural and no amount of care fixes it.** Inverting a function that is flat is ill-conditioned,
and the flatness is astronomy rather than an implementation choice.

**Decision: use the deep import, and treat the three-resolver disagreement as a config item rather than a
risk.** R3 already measured the remedy as one Jest config line, and `tsc` needs the same kind of declaration.
The public route is documented here as rejected **with its failure latitude named**, so nobody revisits it on
the strength of a temperate-latitude test.

### Two mistakes I made getting here, both recorded because they are the interesting part

1. **My first public-route implementation was 21 degrees wrong on average**, far worse than R3's figure. The
   cause was a **bisection direction assumed rather than tested**: the day-length function increases with
   declination in the northern hemisphere and decreases in the southern, and I had hardcoded one direction.
   It failed on exactly the cases that reveal it, Jakarta and Sydney, showing a declination of -23.5 where
   the truth was +23.3, a perfect sign flip. Fixed by scanning for the sign change instead of assuming it.
2. **Even after that fix the mean was 6.2 degrees**, because the equatorial cases were still being solved out
   of noise and one produced a 60.9-degree error. Only separating "is this a bug or a singularity" gave the
   real answer. **A single fix that improves a number from 21 to 6 looks like progress and was still wrong.**

**The generalisable lesson, which belongs in the plan:** a monotonic solve whose direction depends on a sign
must scan for its bracket, never assume it, and any inversion of a nearly-flat function needs its
conditioning measured before its accuracy is quoted.

---

## Step P2a, part 2: the module builds, typechecks, tests and covers. Three config items found.

**What was built.** `shared/solarAzimuth.ts` as it would really live in the app: `solarPosition(at, position)`
returning azimuth and altitude, plus `isSunUsable(altitude)` holding the 5-to-65 gate. It reads `adhan`'s
`SolarCoordinates` through the deep import that part 1 chose. Written to this repo's conventions (no nested
calls, why-only comments, JSDoc contracts), not as a spike.

**It works, and the three toolchains each needed something.**

| Gate | First result | What it needed |
| --- | --- | --- |
| `tsc --noEmit` | **FAILED**, `TS2307: Cannot find module 'adhan/lib/cjs/SolarCoordinates'` | One ambient declaration |
| `npx jest` | **FAILED**, `Cannot find module` from `jest-resolve` | One `moduleNameMapper` line |
| `biome check` | Format only, two long lines | `--write` |
| Coverage | **100% on all four measures** (20/20 statements, 2/2 branches, 2/2 functions, 19/19 lines) with 4 tests | Nothing |

**So R3's prediction was exactly right and the remedies are both one-liners.** They are recorded verbatim so
the execution session does not rediscover them:

The Jest mapper, following the shape of the twelve entries already in `appModuleMocks`:

```js
// adhan publishes only its package root, so Jest's resolver refuses the solar series while Metro reaches it
'^adhan/lib/cjs/(.*)$': '<rootDir>/node_modules/adhan/lib/cjs/$1',
```

The tsc fix is an ambient module in a new `types/adhan-internals.d.ts`. **The root cause is worth naming:**
`tsconfig.json` extends `expo/tsconfig.base`, which sets `moduleResolution: "bundler"`, and bundler resolution
honours a package's `exports` map. `adhan`'s map publishes `"."` only. Declaring the one module the app reaches
keeps tsc and Metro agreeing **without loosening resolution for the whole project**, which is the cheaper of
the two fixes and the one that cannot leak.

**The four tests that passed, because they are the ones worth keeping:**

1. The June solstice altitude at London matches the closed form `90 - latitude + obliquity`.
2. The sun is due south at London transit and due north at Sydney transit, which catches a hemisphere error.
3. **The sun is above 89.5 degrees at Makkah at the published `rashd al-qiblah` instant**, 2026-05-28 09:18Z.
   That is the strongest single assertion available: it pins the implementation against a figure published by
   historians of Islamic astronomy rather than against our own arithmetic.
4. `isSunUsable` refuses 4.9 and 65.1 and accepts 5 and 65.

### The guard that stopped it, and it is correct

`yarn validate` then failed, and **not on my code**. `shared/__tests__/unusedExports.test.ts` reported both new
symbols as unreachable, because nothing in production imports them yet:

```
shared/solarAzimuth.ts: isSunUsable
shared/solarAzimuth.ts: solarPosition
```

That guard exists because "Biome's `noUnusedImports` only sees imports, never an export nobody imports, so a
symbol can sit at 100% coverage from its own tests while nothing on screen reaches it".

**It is right and it was not weakened.** A module with no caller is dead code by this repo's definition, and
the honest options were to add it to the allow-list (lying: it is not reached by a framework) or to wire it
into the Qibla screen (which is execution, not prototyping). **So the code came out**, exactly as
`PROTOTYPE-PLAN.md` said it would: the numbers are recorded here and `shared/`, `types/` and `jest.config.js`
are byte-identical to `uat-2` again, verified by `git status` and a green 182 suites / 4901 tests.

**The useful consequence for the execution plan: the solar module and its first caller must land in the SAME
commit.** They cannot be split into two steps, because the first would fail the suite on its own. That is a
sequencing constraint the plan has to carry, and it was found by building rather than by reasoning.

---

## Step P3, part 1: how tiles get into the app. The trap was real, and the fix is two lines.

`PROTOTYPE-PLAN.md` flagged as unproven whether Metro will bundle a binary tile at all. **It will not, by
default.** Read from Expo's own resolver config rather than assumed:

```
total assetExts: 33
  .mp3       BUNDLED
  .mvt       not an asset ext
  .pmtiles   not an asset ext
  .pbf       not an asset ext
  .bin       not an asset ext
```

So a `require('./tile.mvt')` fails today. Three routes out, each measured on the real London tile:

| Route | Bytes for one tile | Cost |
| --- | --- | --- |
| **Raw gzipped, via `assetExts`** | **62,219** | Two lines in `metro.config.js` |
| Base64 in a `.ts` module | 82,960 | **+33.3%**, the classic 4/3, and no config change |
| Decompressed MVT, skipping `fflate` | 112,968 | +82%, but removes the one new dependency |

For the design's 3x3 pack, using London's measured 655 KB: raw is **655 KB**, base64 is **873 KB**, so the
config-free route costs **218 KB extra per location**.

**Recommendation: add the extensions to `assetExts`.** Two lines is cheaper than 33% of bytes, and **the repo
already edits that exact array** (it removes `svg` so the SVG transformer can own it), so the pattern exists
and needs no new concept.

**The base64 route also carries an unmeasured risk that tips the decision.** `ai/AGENTS.md` records for row
39 that "the `JSON.parse`-beats-literals trick is a V8 result that does NOT transfer to Hermes
(facebook/hermes#1046)". A 873 KB string literal is exactly the shape that warning is about, and its Hermes
parse cost is unmeasured. The `assetExts` route avoids the question entirely rather than betting on it.

**The byte-read path is confirmed by the compiler, not by documentation.** `P4` claimed
`expo-file-system`'s `File` gives raw bytes because it declares `implements Blob`. Verified by writing a
probe and running `tsc`:

```ts
const f = new File(uri);
const ab: ArrayBuffer = await f.arrayBuffer();
const u8: Uint8Array = await f.bytes();
const s: ReadableStream<Uint8Array> = f.readableStream();
```

**`tsc --noEmit` exits 0 with no cast.** So all three reads are real, typed, and in the installed tree.

---

## Running total: what the prototype has settled

| Theory | Status |
| --- | --- |
| Solar azimuth belongs to the deep import, not the public API | **Settled.** Public route fails at 7.8 deg near the equator, and the cause is a measured singularity |
| The module builds, typechecks, tests and covers | **Settled.** 100% on four measures; two one-line config fixes recorded verbatim |
| The solar module and its first caller must ship in ONE commit | **Settled**, by the dead-code guard refusing a caller-less export |
| Tiles need `assetExts`, and the alternative costs 33% | **Settled**, with the Hermes string-literal risk as the tie-breaker |
| Bundled tiles can be read as bytes | **Settled** by `tsc`, no cast needed |

## Still to run

| Step | Theory | Blocked on |
| --- | --- | --- |
| P1 | The magnetic offset is a repeatable property of a spot | **Nothing.** The highest-value item left |
| P2a part 3 | The solar azimuth agrees ON DEVICE to 0.1 deg | An instrumented build on the XS |
| P2b | The shadow interaction is usable | Daylight, and the owner's judgement |
| P3 part 2 | Decode and record timings in Hermes on the A12 | A prototype screen on the XS |
