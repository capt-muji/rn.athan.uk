# R3: the offline calculation library decision

Research agent report, 2026-09-30, wave 2 of `ai/features/global-prayer-times`. Scope: which prayer-time
calculation library this app should depend on for a worldwide, network-off v2.0, decided on measured evidence.

Every number below is marked **measured** (this agent ran it), **cited** (with URL and fetch date) or
**UNVERIFIED**. Scripts and raw summaries are in `ai/features/global-prayer-times/data/libraries/`. Packages were
installed into `/Users/muji/athan-global-scratch/`, never into the repository.

Prior art read in full and not repeated: `ai/features/moonsighting/notes/adhan.md` (the line-by-line
`MoonsightingCommittee` audit) and `ai/features/moonsighting/notes/implementations.md` (the catalogue of about
thirty npm packages and the endpoint measurement). This report answers the broader question those two left open:
not "is adhan's MC method faithful to Shaukat" but "is adhan the right library at all, and how would this project
ever prove it".

---

## Findings in one page

1. **`adhan@4.4.6` is the recommendation, and the reason is not that it is the most accurate.** Its astronomy is
   indistinguishable from the best alternative (measured: identical declination to 0.005 arcseconds). It wins on
   licence (MIT), on maintenance, on a six-language family sharing byte-identical test fixtures, and on being the
   only candidate whose high-latitude and polar behaviour is explicit and configurable rather than accidental.

2. **The accuracy question is settled and it is not close to being the deciding factor.** Against the US Naval
   Observatory's own rise/set/transit service, over 10 cities and 6 dates, **no library disagreed by 2 minutes or
   more on any of sunrise, transit or sunset** (measured, `data/libraries/oracle.txt`). `adhan` matched the USNO
   exactly on 106 of 116 sunrises and 117 of 118 transits, mean bias +0.01 minutes. Three independently written
   engines all clear the bar a minute-resolution app needs.

3. **The libraries' solar astronomy is accurate to about 12 arcseconds of declination and 2.5 seconds of the
   equation of time** (measured, `data/libraries/astronomy.txt`). Below 65 degrees latitude that is worth under 5
   seconds of clock time. At Tromso (69.6N) the same error is worth up to 89 seconds, because the sensitivity is
   7.6 seconds of sunrise per arcsecond there against 0.12 at London.

4. **`adhan` and `pray-calc` return the same declination despite claiming different algorithms**, and the shared
   residual traces to the truncated equation of the centre, not to either implementation (measured: adhan's
   apparent ecliptic longitude is 31.5 arcsec off the oracle on 2026-04-11, which projects to 11.5 arcsec of
   declination). `pray-calc`'s dependency `nrel-spa` advertises ±0.0003 degrees; the delivered accuracy is 11.7
   arcsec. **That advertised figure does not survive measurement.**

5. **Almost every delta between libraries is a PRESET or a ROUNDING RULE, not astronomy.** Measured
   (`data/libraries/causes.txt`): adhan's MWL Dhuhr is +1 minute by preset (`CalculationMethod.ts` L8), which alone
   produces a 364-of-365-day disagreement that looks like an engine fault. `praytime@3.2.0` defaults Maghrib to
   sunset + 1 minute (`praytime.js` L45), producing another. Zero both and London Dhuhr agrees on 364 of 365 days.
   With every rule matched and rounding off, the two engines differ by a **mean of 0.4 seconds** at Dhuhr.

6. **The single largest real difference between libraries is what "the night" means in the high-latitude rule.**
   `adhan` uses `tomorrowSunrise - sunset` (`PrayerTimes.ts` L109); `praytime` uses `24 + sunrise - sunset` of the
   same day (`praytime.js` L296). Measured at Anchorage with `MiddleOfTheNight`: Fajr spread -5 to +28 minutes.
   Switch both to `SeventhOfTheNight` and the spread collapses to -1 to +1 on all 365 days. **The rule choice
   matters more than the library choice, by an order of magnitude.**

7. **Rounding alone moves a time by a minute and looks exactly like a correctness bug.** Measured: holding the
   astronomy constant, `praytime`'s four rounding modes give means of +0.01, -0.52, +0.49 and -0.52 minutes
   against adhan's `Nearest`. `adhan` rounds nearest by default; `praytimes@0.0.5` and `@praytime/core` emit
   unrounded floats; `adhan`'s `Up` adds `60 - s` even when `s` is 0.

8. **The correctness oracle problem is solved, for the astronomy.** The USNO API (v4.0.1, live, tested) publishes
   sunrise, sunset, transit and civil twilight for any coordinate, and `astronomy-engine` agrees with it on 114 of
   116 sunrises and 118 of 118 transits. `astronomy-engine` in turn agrees with Skyfield driven by JPL DE440s to
   **0.45 arcsec mean and 1.17 arcsec max** (measured). This gives the project a two-deep, fully offline,
   permissively licensed verification chain it can commit as fixtures.

9. **No oracle can verify Fajr, Isha or Asr, and that is a permanent limit, not a gap to close.** No astronomical
   authority publishes an 18-degree twilight, a seasonal twilight curve or a shadow-ratio Asr, because those are
   juristic definitions. What the USNO's civil twilight at -6 degrees proves is that the libraries' twilight
   *solver* is correct; the *angle* is a fiqh input the project must take from an authority and cannot check.

10. **`praytime@3.2.0` is the runner-up and it is a genuinely strong one.** It is Hamid Zarrabi-Zadeh's own
    maintained package, MIT since 2025 (the old `praytimes` was LGPL-3.0 with an attribution condition), 2.4 KB
    minified and gzipped against adhan's 4.6 KB, and it iterates its Asr declination where adhan uses the noon
    value. It loses on having no Moonsighting Committee method, no polar-circle resolution, and no cross-language
    fixture family.

11. **Two packages carry defects that disqualify them, newly measured here.** `praytimes@0.0.5` keeps `setting`
    and `offset` on the **prototype** (`praytimes.js` L126-131, L137), so `adjust()` and `tune()` leak across every
    instance and into instances constructed later (measured: `a.setting === b.setting` is `true`; after
    `a.adjust({highLats:'None'})` a brand-new instance reports `None`). `@praytime/core@1.0.2` clamps the
    out-of-range cosine, so at Tromso in midnight sun it returns Fajr = Sunrise = Maghrib = Isha = `"22:46"` as
    plausible-looking clock times rather than admitting no answer exists.

12. **GPL blocks the whole AlAdhan PHP lineage for this app.** `islamic-network/prayer-times` and
    `islamic-network/prayer-times-moonsighting` are both GPL-3.0-or-later on Packagist (cited, fetched
    2026-09-30), as is `@praytime/core`, its TypeScript port. For a closed-source app store binary that is a hard
    stop regardless of technical merit.

13. **Performance is a non-issue on the floor device.** Measured on an Apple M1: `adhan` computes a full year for
    one city in 11.6 ms warm and 16.4 ms cold, and 20 cities x 365 days (7,300 computations) in 240 ms. Even at a
    conservative 20x penalty for a Snapdragon 820, a whole-year precompute for one city is about a quarter of a
    second. **The yearly-cache architecture the owner wants is comfortably affordable, and so is computing on
    demand.**

14. **A fourth architecture exists that nobody has raised: ship the authority's own timetable as data.**
    `@thani-sh/prayer-time-lk@5.1.0` (MIT, cited) does exactly this, encoding 29 Sri Lankan cities x 365 days x 6
    prayers as minute integers in 608 KB. It is the only approach that reproduces a country's published timetable
    exactly, and it is the only answer to finding 15. It does not scale worldwide but it is the right tool for a
    handful of countries whose published tables are hand-edited.

15. **The honest limit: no library can reproduce a hand-edited national timetable, and this is measurable.**
    adhan's own fixture files declare the tolerance each authority needed: Doha, Makkah and London-Moonsighting
    pass exactly, but Dubai and Tehran need `variance: 1` and Ankara, Kuwait and Singapore need `variance: 2`
    (measured, `data/libraries/fixtures.txt`). Those are the library's own maintainers conceding that a
    calculation cannot hit a published table to the minute.

16. **adhan's entire CI correctness evidence is 462 fixture days, and 4 of its 13 methods have no fixture at
    all.** Measured: `MuslimWorldLeague`, `Egyptian`, `Karachi` and `NorthAmerica` are untested against any
    authority, and those are among the most widely used. Singapore contributes 366 of the 462 days. The
    Moonsighting Committee fixture is 12 days at one city with hand-adjusted values.

---

## Part 1: the candidate field

### The serious JavaScript candidates

Facts from `npm view` and the registry download API, fetched 2026-09-30. Install size is `du -sk` of the
installed tree; bundle size is `esbuild --bundle --minify` of a realistic import, then gzip -9 (all measured).

| package | version | licence | last publish | releases 2023-2026 | weekly dl | deps | installed | min+gzip | test fixtures | offline, no native |
|---|---|---|---|---|---|---|---|---|---|---|
| `adhan` | 4.4.6 | MIT | 2026-08-31 | 3 (4.4.4, 4.4.5, 4.4.6, all 2026) | 50,992 | 0 | 751 KB | 4.6 KB | 8 JSON files, 462 days, vs 8 named authorities | yes |
| `praytime` | 3.2.0 | MIT | 2025-07-17 | 4 (all 2025) | 144 | 0 | 32 KB | 2.4 KB | `tests/test.js`, contents not audited here | yes |
| `praytimes` | 0.0.5 | LGPL-3.0 + attribution | 2019-04-06 (modified 2022-05-13) | 0 | 111 | 0 | 32 KB | 3.0 KB | none in tarball | yes |
| `@praytime/core` | 1.0.2 | GPL-3.0-or-later | 2026-09-19 | 3 (2026) | 13 | 0 | 164 KB | 4.8 KB | `bun test`, not shipped | yes |
| `pray-calc` | 2.4.0 | MIT | 2026-08-22 | 17 | 234 | 1 (`nrel-spa`) | 352 KB | not measured | `test.mjs`, not shipped | yes |
| `adhan-extended` | 6.1.0 | MIT | 2023-09-09 | 0 | 318 | 0 | 1,064 KB | not measured | inherits adhan's | yes |
| `namaz` | 4.4.0 | MIT | 2023-12-23 | 0 | 30 | 0 | 360 KB | not measured | inherits adhan's | yes |
| `@calgiellc/azan` | 1.3.0 | MIT | 2026-01-05 | 1 | 125 | 0 | 3,960 KB unpacked | not measured | inherits adhan's | yes, but see below |
| `@masaajid/prayer-times` | 1.0.1 | MIT | 2025-09-17 | 1 | 45 | 0 | 124 KB | not measured | not shipped | yes |
| `react-native-adhan` | 1.0.5 | MIT | 2025-08-03 | 0 | 81 | 0 | 271 KB | n/a | inherits adhan-swift/kotlin | **no, native module** |
| `@thani-sh/prayer-time-lk` | 5.1.0 | MIT | 2026-09-19 | active | n/a | 0 | 608 KB dist | n/a | the data IS the authority's table | yes |

Wrappers that add nothing and inherit adhan's numbers, confirmed by wave 1 and re-checked for version drift here:
`prayers-call@1.7.0` (MIT, 21/wk), `adhanline@0.1.2` (MIT, 8/wk), `@tawfeeqmartin/fajr@1.9.3` (MIT, 37/wk, but
applies its own up-rounding and an automatic city-registry elevation correction, so its numbers are **not**
adhan's).

Packages verified today as unusable, extending wave 1 rather than restating it:

| package | version today | state |
|---|---|---|
| `@islam-kit/prayer-times` | 1.0.0, unchanged since 2026-01-07 | mislabelled MC (plain 18/18); `midDay` has no timezone term |
| `@misque/prayer-times` | 0.2.1, unchanged; **0 weekly downloads** | `hourAngle` uses `+sin(angle)`, so Fajr solves above the horizon. Unusable |
| `salat-first` | 1.0.4, unchanged | no equation of time; writes UTC hours onto the host clock |
| `masjiduna-waqt` | 1.0.2, AGPL-3.0, 4/wk | AGPL; `preinstall` downloads an unchecksummed binary when `BUN_INSTALL` is set |
| `@masaajid/prayer-times` | 1.0.1, unchanged | Abyad coefficients on the General Isha path; throws unless the Date is exactly 00:00 UTC |
| `adhan.js` | 0.0.2, GPL-2.0-only, 2025-12-18 | **not a calculator**: a REST client for the AlAdhan API (`src/rest/endpoints/`). Fails the offline constraint outright |
| `adhan.ts`, `islamic-adhan` | 1.0.6 / 1.0.8, ISC | tarball grep finds `280.459` and `0.98560028`: PrayTimes.org lineage under a different name. Not separately run |
| `praytimess` | 2.3.3, ISC | tarball credits Zarrabi and praytimes.org. A rename, not a new implementation |
| `salat`, `azaan`, `salat-times` | current | CLI tools with runtime dependencies (`ink`, `react`, `node-fetch`), not embeddable libraries |
| `adhan-time-turkiye` | 2.0.5 | depends on `cheerio`: it **scrapes** the Diyanet site. Not offline |
| `prayer-times-mcp`, `@pipeworx/mcp-prayer-times` | 2026-09 | MCP servers wrapping an API. Not offline |

### The adhan multi-language family

The brief's hypothesis was that a multi-language family with mutually consistent fixtures is stronger evidence
than a single package. **Measured: the hypothesis holds, with one caveat.**

Repository facts via `gh api`, fetched 2026-09-30:

| repo | language | licence | last push | stars | forks | open issues |
|---|---|---|---|---|---|---|
| `batoulapps/adhan-js` | TypeScript | MIT | 2026-09-17 | 535 | n/a | n/a |
| `batoulapps/adhan-swift` | Swift | MIT | 2026-08-21 | 232 | n/a | n/a |
| `batoulapps/adhan-kotlin` | Kotlin | MIT | 2026-08-21 | 222 | 58 | 9 |
| `batoulapps/adhan-testdata` | JSON only | none stated | 2021-06-16 | 2 | n/a | n/a |
| `batoulapps/Adhan` | docs only (README + LICENSE) | MIT | 2023-03-29 | 411 | n/a | n/a |
| `iamriajul/adhan-dart` | Dart | MIT | 2025-09-19 | 107 | 44 | 18 |
| `insha/salah` | Rust | MIT | 2026-08-06 | 49 | 10 | 5 |
| `alphahm/adhanpy` | Python | MIT | 2024-04-06 | 35 | 7 | 7 |
| `davidpet86/Adhan-csharp` | C# | MIT | 2019-05-10 | 19 | 11 | 1 |
| `radcheb/Adhan` | Swift + C | MIT | 2019-05-31 | 15 | 4 | 2 |
| `mnadev/adhango` | Go | MIT | 2023-03-25 | 7 | 2 | 0 |

Two corrections to the brief's list. There is **no `adhan-java`**: the repo redirects to `adhan-kotlin` (measured:
`gh api repos/batoulapps/adhan-java` returns `full_name: batoulapps/adhan-kotlin`). There is **no
`adhan-cpp`/`adhan-go`/`adhan-rust` under `batoulapps`**; those are third-party ports the family README links, and
only `insha/salah` is currently maintained. `batoulapps/adhan-data` is an empty placeholder (README is the single
line `# adhan-data`).

**The fixture cross-consistency, measured.** I downloaded all eight fixture JSON files from four locations
(`adhan-js/Shared/Times`, `adhan-swift/Tests/Resources/Times`, `adhan-kotlin/Shared/Times`,
`adhan-testdata/Times`) and compared SHA-256:

| fixture | js | swift | kotlin | testdata |
|---|---|---|---|---|
| `Ankara-Turkey` | `80b72287` | same | same | same |
| `Doha-Qatar` | `9ac5beac` | same | same | same |
| `Kuwait City-Kuwait` | `48482183` | same | same | same |
| `London-MoonsightingCommittee` | `ff7eb8cb` | same | same | same |
| `Singapore-Singapore` | `e43a6219` | same | same | same |
| `Dubai-Gulf` | `83b2af73` | `b67eec5b` | `b67eec5b` | `b67eec5b` |
| `Makkah-UmmAlQura` | `11bfaab8` | `54fe3141` | `54fe3141` | `54fe3141` |
| `Tehran-Tehran` | `03046fc2` | same | **absent** | same |

So 5 of 8 are byte-identical across all four repos. The caveat: the JS repo has **drifted ahead**. Commit
`b414ab4f` (2026-08-15, "fix(test): use 2018 dates matching source in Dubai-Gulf fixture") corrected dates that
said 2016 while the cited source rows were 2018; the Swift and Kotlin copies still carry the wrong dates. The
Makkah difference is a one-character typo fix (`1/5/16` versus `1/5/15`) inside a source comment. Kotlin has no
Tehran fixture at all.

**Reading.** The family is real evidence: five files are provably identical across three independent language
implementations that each assert against them in CI, and the sixth and seventh differ only by metadata the JS
repo fixed and the others have not yet pulled. But the shared corpus is small, and the drift shows the subtree
merges are manual and lag. This is meaningfully stronger than a single package's self-consistency, and much
weaker than an independently maintained conformance suite.

### PrayTimes.org, the ancestor

`praytimes.org/calculation` (cited, fetched 2026-09-30 via `curl`, TinyFish returned a Synology 404 page for this
host) names its own sources: "The Determination of Salat Times, by Dr. Monzur Ahmed", "**Approximate Solar
Coordinates, by U.S. Naval Observatory**", and "The Islamic Prayer Times, by Professor Tariq Muneer". It documents
the three high-latitude rules (Middle of the Night, One-Seventh, Angle-Based) that adhan also ships, and states
Dhuhr as `12 + TimeZone - Lng/15 - EqT`.

The lineage matters because it is everywhere. Two npm packages are the direct descendants:

| package | line | licence | maintained |
|---|---|---|---|
| `praytime@3.2.0` | Zarrabi's own current package, "praytime.js (v3.2)", `Copyright (c) 2007-2025 Hamid Zarrabi-Zadeh` | **MIT** | yes, 2025 |
| `praytimes@0.0.5` | a third party's (`brothersincode`) repackaging of "PrayTimes.js (ver 2.5)" | **LGPL-3.0** plus "credit is given to the original work with a link back to PrayTimes.org" | no, 2019 |

**This is a finding wave 1 missed.** Zarrabi relicensed his own library to MIT and rewrote it as an ES class with
proper per-instance state. The widely-linked `praytimes` package is an abandoned LGPL snapshot of the old v2.5
code with a prototype-state bug. Anyone reaching for "the PrayTimes library" should take `praytime`, not
`praytimes`.

The endpoint lineage also traces here: moonsighting.com's own `pray.php` credits "Original code by PrayTimes.org"
(cited, wave 1 `implementations.md` section 2.2), so the site's published tables and adhan share an ancestor.

### The AlAdhan PHP stack

| package | licence (Packagist, fetched 2026-09-30) | total downloads | monthly | versions |
|---|---|---|---|---|
| `islamic-network/prayer-times` | GPL-3.0-or-later | 21,767 | 1,065 | 1.0.0 to 1.0.29, latest tagged 2020-07-13 |
| `islamic-network/prayer-times-moonsighting` | GPL-3.0-or-later | 20,039 | 1,068 | 1.0, 1.1, both 2020-07-22 |

Both now live at `https://1x.ax/islamic-network/libraries/`, off GitHub. Wave 1 established the technical facts:
the host library is "a PHP edition of the Prayer Times Library (v2.3) originally written in JavaScript by Hamid
Zarrabi-Zadeh", it applies only the seasonal function for MC with no 18-degree bound and no 1/7 rule, and it
clamps the out-of-range cosine so polar dates return clock values.

**The new fact is the licence, and it is decisive.** GPL-3.0-or-later cannot be linked into a closed-source app
store binary. The same applies to `@praytime/core@1.0.2`, its TypeScript port, which is GPL-3.0-or-later and which
wave 1 identified as replicating the PHP's DYY off-by-one. This rules out the entire AlAdhan calculation lineage
for this app on legal grounds before any technical argument.

### Mawaqit

Surveyed the whole `mawaqit` GitHub org (`gh api search/repositories?q=org:mawaqit`, fetched 2026-09-30): 21
repositories. **Only two contain any prayer-time calculation**, and both are the forks wave 1 already audited:
`mawaqit/prayer-times` (LGPL-3.0, one commit 2025-10-03, described as "A fork of islamic-network/prayer-times
which has been deleted from gihub") and `mawaqit/prayer-times-moonsighting` (no licence file, same date).
Everything else is app plumbing: `home-assistant` (Apache-2.0, Python, 104 stars), `alexa`, Flutter/Dart TV
packages, i18n bundles, keypad firmware. Mawaqit has no independent calculation engine to evaluate.

### Non-JavaScript references worth knowing

**ITL / libitl (`arabeyes-org/ITL`)** is the most technically interesting non-JS candidate and deserves more
credit than it usually gets. Facts via `gh api`, fetched 2026-09-30: LGPL-2.1 (`COPYING`), 92 stars, 21 forks,
last commit `07de1851` 2024-05-27, 102 commits, C with CMake and autoconf. Its `prayertime/astro.c` header states
it is "based upon a subset of the VSOP87 planetary theory developed by Jean Meeus", citing "Astronomical
Algorithms. Willmann-Bell, second edition, 1998".

It has two things **no JavaScript library has**:

- `computeTopAstro`, a **topocentric** correction, where every JS library computes geocentric coordinates only;
- `getRefraction`, a pressure and temperature dependent refraction model, where every JS library hardcodes a
  single horizon constant.

Its `prayertime/doc/method-info.md` ships 11 methods with per-country attribution, including method 10
"Moonsighting Committee Worldwide (MWC)" with "Fajr and Isha calculated with different values based on the season"
and method 11 "Morocco Awqaf Ministry" with a Zuhr offset of 5 minutes. LGPL-2.1 is usable in a closed app via
dynamic linking, but in a React Native app it means a native module, which breaks the "no native code"
requirement and adds a build surface to both platforms. **Its real value to this project is as a second opinion in
a verification harness, not as the shipping dependency.**

`libpraytimes`: searched and **not found** as a distinct project. The name appears to be a colloquial reference to
either `libitl` or a PrayTimes.org port. Status: UNVERIFIED that any such library exists.

Egyptian and Turkish official software: no published source found. The Diyanet's times are reachable only by
scraping (which is what `adhan-time-turkiye` does, via `cheerio`), and adhan's `Turkey()` preset is documented in
`METHODS.md` as "**An approximation** of the Diyanet method ... less accurate outside the region of Turkey"
(cited). No official Egyptian General Authority of Survey code was located. Status: UNVERIFIED whether either
publishes source.

### Astronomical foundations: which library implements what

This is the heart of the accuracy question, answered from source rather than from README claims.

| foundation | stated accuracy | which candidate uses it | evidence |
|---|---|---|---|
| USNO "Computing Approximate Solar Coordinates" | "about 1 arcminute within two centuries of 2000" (cited, `aa.usno.navy.mil/faq/sun_approx`, fetched 2026-09-30) | `praytime@3.2.0`, `praytimes@0.0.5`, `@praytime/core`, and the whole PHP lineage | `praytime.js` L246-260 carries the exact constants `357.529`, `0.98560028`, `280.459`, `0.98564736`, `1.915`, `0.020`, `23.439`, `0.00000036` from the USNO page |
| Meeus, *Astronomical Algorithms* ch.25 (solar), ch.22 (nutation), ch.12 (sidereal), ch.15 (rise/set) | book claims 0.01 degree for the low-accuracy method, about 1 arcsecond for the full VSOP87 reduction | `adhan` | `Astronomical.ts` L15-330 cites a page number per function ("page 163", "page 144", "page 165", "page 102", "page 24", "page 60"). `batoulapps/Adhan` README claims "All astronomical calculations are high precision equations directly from the book" |
| VSOP87 (subset) | sub-arcsecond for the full series | `arabeyes-org/ITL` | `prayertime/astro.c` header, quoted above |
| NREL SPA (Reda and Andreas) | "+/- 0.0003 degrees" = 1.08 arcsec, years -2000 to 6000 (cited, NREL TP-560-34302 via `tinyfish.search`, 2026-09-30) | `pray-calc@2.4.0` via `nrel-spa@2.x` | `pray-calc` `package.json` dependency; `getAngles` documented as solving with NREL SPA |
| NOAA solar calculator | "accurate to within a minute for locations between +/- 72 degrees latitude, and within 10 minutes outside" (cited, `gml.noaa.gov/grad/solcalc/calcdetails.html`, fetched 2026-09-30) | none directly; `a-saab/PrayerTimes` (Arduino) uses its day-of-year series | NOAA states it is "based on equations from Astronomical Algorithms, by Jean Meeus" |
| JPL DE440 / DE440s | the reference the USNO and HMNAO publish against | used here only as the verification oracle, via Skyfield | `data/libraries/oracle_crosscheck.py` |
| ELP (lunar) | n/a | **none.** No candidate needs the Moon for prayer times | adhan uses `meanLunarLongitude` only for the nutation terms (`Astronomical.ts` L26-33) |

**Measured accuracy against a JPL-anchored oracle** (`data/libraries/astronomy.txt`, daily for a whole year, three
years):

| engine | year | decl mean (arcsec) | decl max (arcsec) | EoT mean (s) | EoT max (s) |
|---|---|---|---|---|---|
| `adhan@4.4.6` | 1950 | 1.7 | 4.7 | 0.46 | 1.80 |
| `adhan@4.4.6` | 2026 | 3.3 | 11.7 | 0.83 | 2.17 |
| `adhan@4.4.6` | 2100 | 1.8 | 5.1 | 0.51 | 1.74 |
| `pray-calc@2.4.0` (`nrel-spa`) | 1950 | 1.7 | 4.7 | n/a | n/a |
| `pray-calc@2.4.0` (`nrel-spa`) | 2026 | 3.3 | 11.7 | n/a | n/a |
| `pray-calc@2.4.0` (`nrel-spa`) | 2100 | 1.8 | 5.0 | n/a | n/a |
| `praytime@3.2.0` | 1950 | 6.1 | 12.0 | 0.55 | 1.75 |
| `praytime@3.2.0` | 2026 | 7.2 | 15.2 | 0.98 | 2.50 |
| `praytime@3.2.0` | 2100 | 8.1 | 20.5 | 1.04 | 2.41 |
| `praytimes@0.0.5` | all three | identical to `praytime@3.2.0` | | | |

Three readings, all measured.

**(a) The three test years are not a trend, and the 2026 peak is not an anomaly.** Sampling `adhan` every two
years from 2010 to 2046 gives signed annual peaks of +7.50, +7.83, +8.42, -10.63, +6.69, -7.58, +6.39, -7.15,
+11.67, -7.90, -7.17, -11.41, +8.22, +7.55, +7.35, -9.33, +7.05, -6.69, +6.96 arcsec. The error **oscillates in
sign with no secular drift**, which is the signature of a truncated periodic series rather than a diverging one.
2026 is simply a high year, so the max column is a fair worst case.

**(b) `nrel-spa`'s advertised ±0.0003 degrees does not survive measurement.** `adhan` and `pray-calc` return the
same declination to 0.005 arcseconds (8.24260433 versus 8.24260558 degrees on 2026-04-11), and both are 11.7
arcsec from the oracle. Tracing one step up the chain: adhan's apparent ecliptic longitude on that date is
21.126636 degrees against the oracle's 21.117897, an error of **31.5 arcsec in the longitude**. The projection
factor onto declination is about 0.37 in April, giving the 11.7 arcsec. The fault is the truncated equation of the
centre (`Astronomical.ts` L58-67: three sine terms), which omits the planetary perturbations VSOP87 includes.
Neither library is a 1-arcsecond ephemeris whatever its dependency advertises.

**(c) The PrayTimes lineage is about twice as inaccurate as adhan, and it degrades with time.** Its declination
error grows 6.1 to 8.1 arcsec mean and 12.0 to 20.5 arcsec max from 1950 to 2100, consistent with a two-term
series and with the USNO's own "degrades gradually beyond its four-century window". adhan's does not degrade.

**What the arcseconds cost in clock time.** Differentiating the sunrise hour angle gives the sensitivity
(measured, `data/libraries/astronomy.txt`):

| latitude | seconds of sunrise per arcsec of declination error | adhan max error costs | praytime max error costs |
|---|---|---|---|
| 0 (equator) | 0.0005 | 0.0 s | 0.0 s |
| 21.4 (Makkah) | 0.0319 | 0.4 s | 0.5 s |
| 40.7 (New York) | 0.0741 | 0.9 s | 1.1 s |
| 51.5 (London) | 0.1204 | 1.4 s | 1.8 s |
| 59.9 (Oslo) | 0.2127 | 2.5 s | 3.2 s |
| 64.1 (Reykjavik) | 0.3998 | 4.7 s | 6.1 s |
| 69.6 (Tromso) | 7.6063 | **88.8 s** | **115.8 s** |

**This is the single most useful number in the report.** Below 65 degrees the entire astronomy debate is worth
under 5 seconds, which cannot change a time quoted to the minute. Above the polar circle the same error is worth
a minute and a half, which is why every library's polar behaviour disagrees and why no amount of ephemeris
precision fixes it.

---

## Part 2: the measured delta tables

### How the comparison was set up

`data/libraries/compare.mjs`, run as `TZ=UTC node compare.mjs`. 20 cities from `cities.json`, all 365 days of
2026, every method each library shares with `adhan` (12 for `@praytime/core`, 8 for `praytime`, 7 for
`praytimes`). Every library is normalised to **UTC epoch minutes of the instant**, so a delta is a real clock
difference and not a formatting artefact. `TZ=UTC` is mandatory because adhan reads the calendar date from the
`Date`'s local getters (`PrayerTimes.ts` L52-56), a trap wave 1 documented.

Full output is `data/libraries/deltas.txt` (the MWL, MWLHanafi and Turkey sections are kept; the eight
near-duplicate method sections were dropped to keep the committed file small).

### MWL, the method all four share. Cells are days equal / |delta|=1 / |delta|>=2

`praytime@3.2.0` minus `adhan@4.4.6`, n=365 per cell:

| city | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|
| London | 283/75/7 [-3,10] | 344/21/0 | 0/364/1 | 91/246/28 [-2,2] | 14/339/12 | 258/97/10 [-14,6] |
| Makkah | 362/3/0 | 363/2/0 | 2/361/2 | 239/126/0 | 0/365/0 | 354/11/0 |
| Jakarta | 361/4/0 | 365/0/0 | 0/362/3 | 316/49/0 | 0/363/2 | 357/8/0 |
| Istanbul | 348/17/0 | 353/12/0 | 1/364/0 | 171/194/0 | 5/356/4 | 319/46/0 |
| Karachi | 363/2/0 | 359/6/0 | 2/363/0 | 267/98/0 | 4/360/1 | 346/19/0 |
| Lagos | 362/3/0 | 364/1/0 | 0/361/4 | 268/97/0 | 1/364/0 | 361/4/0 |
| NewYork | 350/15/0 | 352/13/0 | 1/363/1 | 98/250/17 [-2,2] | 10/347/8 | 306/59/0 |
| SaoPaulo | 365/0/0 | 361/4/0 | 1/362/2 | 191/174/0 | 0/364/1 | 340/25/0 |
| CapeTown | 355/10/0 | 357/8/0 | 1/362/2 | 202/163/0 | 4/358/3 | 324/41/0 |
| KualaLumpur | 362/3/0 | 364/1/0 | 1/364/0 | 322/43/0 | 4/361/0 | 359/6/0 |
| Dhaka | 363/2/0 | 361/4/0 | 0/364/1 | 279/86/0 | 1/362/2 | 348/17/0 |
| Cairo | 357/8/0 | 357/8/0 | 0/365/0 | 202/163/0 | 3/359/3 | 335/30/0 |
| Oslo | 216/112/37 [-3,4] | 319/46/0 | 3/360/2 | 64/151/150 [-3,2] | 25/310/30 | 198/150/17 [-24,8] |
| Reykjavik | 185/66/114 [-4,4] | 288/77/0 | 0/365/0 | 37/93/235 [-6,5] | 45/270/50 | 162/161/42 [-18,16] |
| Tromso | 141/41/114 [-15,26] (69 both null) | 131/93/24 [-5,13] (116 both null) | 2/362/1 | 42/85/238 [-2279,605] | 62/118/67 [-3,20] | 127/56/113 [-27,11] |
| Singapore | 362/3/0 | 362/3/0 | 1/363/1 | 305/60/0 | 1/363/1 | 358/7/0 |
| Dubai | 362/3/0 | 363/2/0 | 0/362/3 | 243/122/0 | 1/362/2 | 352/13/0 |
| Casablanca | 350/15/0 | 362/3/0 | 1/362/2 | 176/189/0 | 5/359/1 | 334/31/0 |
| Tashkent | 349/16/0 | 353/12/0 | 0/363/2 | 212/153/0 | 7/355/3 | 324/41/0 |
| Anchorage | 207/115/43 [-5,28] | 295/70/0 | 1/363/1 | 32/68/265 [-5,5] | 37/286/42 | 183/161/21 [-36,11] |

**Read this table with care, because most of it is not what it looks like.** The Dhuhr column reads as a total
disagreement (0 or 1 exact days everywhere) and the Maghrib column nearly so. Both are **entirely preset
offsets**, proven in the next section. Sunrise, the one column with no preset on either side, is 344 of 365 exact
at London and 288 at Reykjavik. That is the honest astronomy comparison, and the two engines agree.

`@praytime/core@1.0.2` minus `adhan@4.4.6`, MWL, selected rows:

| city | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|
| London | 274/84/7 [-3,10] | 341/24/0 | 0/360/5 | 88/245/32 [-2,2] | 341/24/0 | 258/98/9 [-14,7] |
| Makkah | 359/6/0 | 361/4/0 | 0/359/6 | 222/143/0 | 362/3/0 | 352/13/0 |
| Oslo | 216/91/58 [-3,4] | 324/41/0 | 0/357/8 | 58/150/157 [-3,3] | 312/53/0 | 224/127/14 [-24,8] |
| Reykjavik | 182/57/126 [-4,4] | 288/77/0 | 0/360/5 | 38/108/219 [-5,5] | 279/86/0 | 197/138/30 [-18,16] |
| **Tromso** | 138/44/114 (**69 adhan-null, core answers**) | 132/90/27 (**116 adhan-null, core answers**) | 0/361/4 | 40/75/250 [-2280,612] | 117/107/25 (**116 adhan-null**) | 137/93/66 (**69 adhan-null**) |

The Tromso row is the important one: `@praytime/core` returns a value on **every** day where adhan correctly
returns `Invalid Date`. That is the cosine clamp, and it is worse than no answer.

### Why the disagreements happen: cause by cause, from source

`data/libraries/causes.mjs`, output `data/libraries/causes.txt`. Each cause is neutralised and the deltas
recounted, which is how a preset is distinguished from an engine fault.

**Cause 1: the Dhuhr preset.** `adhan` `CalculationMethod.ts` L8 sets `methodAdjustments.dhuhr = 1` for MWL.
`praytime` `praytime.js` L49 defaults `dhuhr: '0 min'`.

| series | n | mean | min | max | histogram |
|---|---|---|---|---|---|
| London Dhuhr, adhan as shipped | 365 | -1.003 | -2 | -1 | -2:1 -1:364 |
| London Dhuhr, adhan `dhuhr` adjustment 0 | 365 | -0.003 | -1 | 0 | -1:1 0:364 |
| Makkah Dhuhr, adhan as shipped | 365 | -1.000 | -2 | 0 | -2:2 -1:361 0:2 |
| Makkah Dhuhr, adhan `dhuhr` adjustment 0 | 365 | 0.000 | -1 | 1 | -1:2 0:361 +1:2 |

A one-line preset turned 364 agreeing days into 364 disagreeing days.

**Cause 2: the Maghrib preset, which differs between the two PrayTimes generations.** `praytime@3.2.0`
`praytime.js` L45 defaults `maghrib: '1 min'` and its MWL entry at L35 does not override it, so MWL Maghrib is
sunset + 1. `praytimes@0.0.5` `praytimes.js` L62 sets `maghrib: '0 min'` for MWL. `adhan` `PrayerTimes.ts`
L183-191 uses sunset exactly.

| series | n | mean | min | max | histogram |
|---|---|---|---|---|---|
| London Maghrib, `praytime@3.2.0` as shipped | 365 | 0.995 | 0 | 2 | 0:14 +1:339 +2:12 |
| London Maghrib, `praytime@3.2.0` with `maghrib: "0 min"` | 365 | -0.005 | -1 | 1 | -1:14 0:339 +1:12 |
| London Maghrib, `praytimes@0.0.5` as shipped | 365 | -0.005 | -1 | 1 | -1:14 0:339 +1:12 |
| Makkah Maghrib, `praytime@3.2.0` as shipped | 365 | 1.000 | 1 | 1 | +1:365 |
| Makkah Maghrib, `praytime@3.2.0` with `maghrib: "0 min"` | 365 | 0.000 | 0 | 0 | **0:365** |

Zeroing one default makes Makkah agree on all 365 days exactly. **Two versions of the same author's library
disagree by a minute because of a default, and that is the entire Maghrib column.**

**Cause 3: the Asr declination epoch.** `adhan` `SolarTime.ts` L93-99 computes the shadow angle from the **noon**
declination and solves the hour angle once; that function carries the comment `// TODO source shadow angle
calculation`. `praytime` `praytime.js` L279-284 evaluates the declination **at the Asr time**, and L169-170 re-runs
the whole pass `iterations` times.

| series | n | mean | min | max | histogram |
|---|---|---|---|---|---|
| London Asr, praytime `iterations=1` | 365 | -0.016 | -2 | 2 | -2:16 -1:122 0:91 +1:124 +2:12 |
| London Asr, praytime `iterations=3` | 365 | -0.008 | -2 | 2 | -2:7 -1:123 0:107 +1:122 +2:6 |
| Oslo Asr, `iterations=1` | 365 | -0.014 | -3 | 2 | -3:6 -2:69 -1:75 0:64 +1:76 +2:75 |
| Reykjavik Asr, `iterations=1` | 365 | -0.030 | -6 | 5 | -6:3 -5:23 -4:17 -3:30 -2:40 -1:53 0:37 +1:40 +2:54 +3:26 +4:23 +5:19 |
| Reykjavik Asr, `iterations=3` | 365 | -0.025 | -6 | 5 | -6:3 -5:23 -4:15 -3:28 -2:33 -1:61 0:45 +1:47 +2:44 +3:24 +4:22 +5:20 |

Raising `iterations` moves praytime slightly **toward** adhan at London (91 to 107 exact days), which confirms the
mechanism is the declination epoch. The mean is about zero everywhere, so this is a spread and not a bias. This
reproduces wave 1's Asr finding against the moonsighting endpoint from an entirely different direction, which is
useful corroboration: **adhan's Asr is the weakest part of its astronomy, and its own source says so.**

**Cause 4: what "the night" means. This is the big one.** `adhan` `PrayerTimes.ts` L109 defines
`night = tomorrowSunrise - sunset`, spanning the real night. `praytime` `praytime.js` L296 uses
`24 + times.sunrise - times.sunset`, both from the **same** day.

| series | n | mean | min | max | histogram |
|---|---|---|---|---|---|
| London Fajr, `MiddleOfTheNight` / `NightMiddle` | 365 | 0.022 | -3 | **10** | -3:1 -2:2 -1:38 0:283 +1:37 +2:3 +10:1 |
| London Fajr, `SeventhOfTheNight` / `OneSeventh` | 365 | 0.000 | **-1** | **1** | -1:30 0:305 +1:30 |
| London Fajr, `TwilightAngle` / `AngleBased` | 365 | 0.000 | -1 | 1 | -1:32 0:301 +1:32 |
| Oslo Fajr, `MiddleOfTheNight` | 365 | -0.005 | -3 | 4 | -3:2 -2:16 -1:58 0:216 +1:54 +2:18 +4:1 |
| Oslo Fajr, `SeventhOfTheNight` | 365 | 0.005 | **-1** | **1** | -1:55 0:253 +1:57 |
| Reykjavik Fajr, `MiddleOfTheNight` | 365 | 0.016 | -4 | 4 | -4:1 -3:1 -2:54 -1:34 0:185 +1:32 +2:52 +3:5 +4:1 |
| Reykjavik Fajr, `SeventhOfTheNight` | 365 | -0.036 | **-1** | **1** | -1:75 0:228 +1:62 |
| Anchorage Fajr, `MiddleOfTheNight` | 365 | 0.066 | -5 | **28** | -5:1 -2:20 -1:58 0:207 +1:57 +2:21 +28:1 |
| Anchorage Fajr, `SeventhOfTheNight` | 365 | 0.014 | **-1** | **1** | -1:64 0:232 +1:69 |
| Anchorage Fajr, `TwilightAngle` | 365 | -0.014 | -2 | 2 | -2:4 -1:72 0:215 +1:73 +2:1 |

**With `SeventhOfTheNight` the two independent engines agree within one minute on every single day at all four
high-latitude cities.** With `MiddleOfTheNight` they reach 28 minutes apart. The rule is not a tie-breaker between
libraries; it is the dominant term, and it is a fiqh choice the app must make explicitly.

**Cause 5: the residual in seconds, with every rule matched.** adhan with `Rounding.None` and `dhuhr` 0; praytime
with `round('none')` and `maghrib: '0 min'`. What remains is two solar engines and nothing else.

| city | prayer | n | mean (s) | min (s) | max (s) |
|---|---|---|---|---|---|
| Makkah | dhuhr | 365 | 0.43 | -0.6 | 1.5 |
| Makkah | sunrise | 365 | 0.49 | -1.0 | 2.0 |
| Makkah | maghrib | 365 | 0.39 | -1.0 | 1.7 |
| London | dhuhr | 365 | 0.40 | -0.5 | 1.5 |
| London | sunrise | 365 | 0.47 | -7.4 | 7.5 |
| London | maghrib | 365 | 0.49 | -7.2 | 8.0 |
| Oslo | dhuhr | 365 | 0.44 | -0.5 | 1.5 |
| Oslo | sunrise | 365 | 0.56 | -15.1 | 16.2 |
| Oslo | maghrib | 365 | 0.57 | -16.2 | 16.2 |
| Reykjavik | dhuhr | 365 | 0.44 | -0.5 | 1.4 |
| Reykjavik | sunrise | 365 | 0.78 | -25.4 | 30.8 |
| Reykjavik | maghrib | 365 | 0.73 | -30.2 | 29.0 |

**This is the whole astronomy disagreement between the PrayTimes lineage and adhan: under a second at Dhuhr
everywhere, and growing with latitude at sunrise exactly as the arcsecond sensitivity table predicts** (2 s at
Makkah, 7.5 s at London, 16 s at Oslo, 31 s at Reykjavik). The Dhuhr column is flat because the equation of time
carries no latitude amplification. Everything in the minute-level tables above is presets, rounding and rules.

Note: the report's earlier hypothesis that the horizon constant explains this was **tested and rejected**. adhan
uses `-50.0 / 60.0` exactly (`SolarTime.ts` L35); praytime hardcodes `0.833` (`praytime.js` L182). The gap is
0.0003 degrees, which the same sensitivity turns into 0.08 s at Makkah and 0.21 s at Tromso. It is real but two
orders of magnitude too small to matter.

**Cause 6: the rounding rule, with the astronomy held constant.**

| series | n | mean | min | max | histogram |
|---|---|---|---|---|---|
| London Sunrise, praytime `round("nearest")` vs adhan `Nearest` | 365 | 0.014 | -1 | 1 | -1:8 0:344 +1:13 |
| London Sunrise, praytime `round("down")` | 365 | -0.515 | -1 | 0 | -1:188 0:177 |
| London Sunrise, praytime `round("up")` | 365 | 0.485 | 0 | 1 | 0:188 +1:177 |
| London Sunrise, praytime `round("none")` | 365 | -0.515 | -1 | 0 | -1:188 0:177 |

### Rounding behaviour, stated explicitly per library

The brief asked for this because rounding alone produces a one-minute disagreement that looks like a correctness
bug. Read from source:

| library | default | available rules | source |
|---|---|---|---|
| `adhan@4.4.6` | **round half up at >= 30 s** | `Nearest`, `Up`, `None` | `DateUtils.ts` L22-35 `roundedMinute`. `Up` adds `60 - s` unconditionally, so it **moves a time even when `s` is 0**. `Singapore()` overrides the default to `Up` (`CalculationMethod.ts` L77) |
| `praytime@3.2.0` | **`nearest`** = `Math.round` | `up` (`Math.ceil`), `down` (`Math.floor`), `nearest` (`Math.round`), anything else returns the raw timestamp | `praytime.js` L230-240 |
| `praytimes@0.0.5` | **none for `Float`**; string formats truncate | no rounding API | `praytimes.js` `getFormattedTime` |
| `@praytime/core@1.0.2` | **none for `Float`** | `24h`, `12h`, `12hNS`, `Float`, `iso8601` formats | `dist/index.d.ts` `TimeFormat` |
| USNO reference service | **round half up**, measured | n/a | measured: comparing with `getUTCMinutes()` (which floors) gives a -0.500 mean bias over 12 rise events; rounding gives exactly 0.000 |

**The USNO measurement is the useful one and it cost this report two wrong tables.** Any harness comparing against
a published timetable must round, not truncate, or it invents a half-minute bias that reads as a library defect.

### High latitude and polar behaviour, measured

`data/libraries/polar.mjs`, output `data/libraries/polar.txt`. Tromso 69.6492N, times UTC.

**2026-06-21, midnight sun:**

| configuration | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|
| `adhan` Unresolved (default) | Invalid Date | Invalid Date | 10:47 | 15:58 | Invalid Date | Invalid Date |
| `adhan` AqrabBalad | 22:46 | 23:06 | 10:47 | 15:43 | 22:26 | 22:46 |
| `adhan` AqrabYaum | 22:19 | 23:05 | 10:52 | 15:37 | 21:58 | 22:43 |
| `praytime@3.2.0` NightMiddle (default) | `"-----"` | `"-----"` | `"10:46"` | `"15:58"` | `"-----"` | `"-----"` |
| `praytime@3.2.0` OneSeventh | `"-----"` | `"-----"` | `"10:46"` | `"15:58"` | `"-----"` | `"-----"` |
| `praytimes@0.0.5` NightMiddle | `"-----"` | `"-----"` | `"10:46"` | `"15:58"` | `"-----"` | `"-----"` |
| `@praytime/core` MIDDLE_OF_THE_NIGHT | `"22:46"` | `"22:46"` | `"10:46"` | `"15:58"` | `"22:46"` | `"22:46"` |
| `@praytime/core` NONE | `"22:46"` | `"22:46"` | `"10:46"` | `"15:58"` | `"22:46"` | `"22:46"` |

**2026-12-21, polar night:**

| configuration | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|
| `adhan` Unresolved | 05:28 | Invalid Date | 10:43 | 11:14 | Invalid Date | 15:44 |
| `adhan` AqrabBalad | 05:19 | 10:07 | 10:43 | 10:47 | 11:18 | 15:54 |
| `adhan` AqrabYaum | 04:50 | 09:57 | 10:32 | 09:52 | 11:06 | 16:00 |
| `praytime@3.2.0` | `"05:28"` | `"-----"` | `"10:42"` | `"11:14"` | `"-----"` | `"15:44"` |
| `praytimes@0.0.5` | `"05:28"` | `"-----"` | `"10:42"` | `"11:14"` | `"-----"` | `"15:44"` |
| `@praytime/core` | `"05:28"` | `"10:42"` | `"10:42"` | `"11:14"` | `"10:42"` | `"15:44"` |

Days per year with no usable value at Tromso:

| configuration | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|
| `adhan` Unresolved (default) | 69 | 116 | 0 | 0 | 116 | 69 |
| `adhan` AqrabBalad | 0 | 0 | 0 | 0 | 0 | 0 |
| `adhan` AqrabYaum | 0 | 0 | 0 | 0 | 0 | 0 |
| `praytime@3.2.0` NightMiddle | 69 | 117 | 0 | 0 | 118 | 69 |
| `praytime@3.2.0` OneSeventh | 69 | 117 | 0 | 0 | 118 | 69 |
| `praytime@3.2.0` None | 174 | 117 | 0 | 0 | 118 | 169 |
| `praytimes@0.0.5` NightMiddle | 69 | 117 | 0 | 0 | 118 | 69 |
| `@praytime/core` any rule | 0 | 0 | 0 | 0 | 0 | 0 |

**Four distinct behaviours, and the app must handle whichever it chooses.**

- `adhan` returns a `Date` whose `getTime()` is `NaN`, which prints as `Invalid Date`. Detect with `isNaN(d)`.
  It offers three explicit strategies, and both `AqrabBalad` and `AqrabYaum` eliminate all nulls at the cost of
  **also moving Dhuhr and Asr**, which moonsighting.com's own FAQ says are always calculable.
- `praytime` and `praytimes` return the string `"-----"`. It cannot be mistaken for a time, but it is a string
  where a `Date` is expected, so the type is a lie. Their high-latitude rules do **not** resolve the polar case at
  all: the count is 69 with `NightMiddle` and 69 with `OneSeventh`, identical.
- `@praytime/core` returns plausible clock times on every day by clamping the cosine, which is the worst of the
  four because nothing downstream can detect it. Note `"22:46"` for Fajr, Sunrise, Maghrib and Isha
  simultaneously on the midnight-sun solstice: four different prayers at the same instant.
- Nobody throws. That is at least consistent.

The equinox control rows (in `polar.txt`) show all four agreeing within 1 to 3 minutes at Tromso when the sun does
rise and set, which confirms the divergence is the polar rule and not the engine.

**Asr at high latitude breaks in every library.** Measured (`deltas.txt`, largest disagreements): at Tromso on
2026-01-19 the Asr delta between `@praytime/core` and `adhan` is **-2,284 minutes**, and on 2026-11-23 it is
**+612**. Wave 1 found the same runaway against the endpoint and traced it to the noon solar altitude dropping
below about 2 degrees. Confirmed independently here: this is a property of the shadow-ratio definition near the
polar circle, not of any one library, and no library returns "no Asr".

### Performance and size

`data/libraries/polar.mjs` Part B, best of 5 runs with warm-up, on node v24.14.1, darwin arm64, Apple M1
(36.4 M `Math.sin`/s measured as the scaling marker).

| library | one day (ms) | full year (ms) | days/second | entry file | installed | min+gzip bundle |
|---|---|---|---|---|---|---|
| `adhan@4.4.6` | 0.0048 | 1.8 | 208,489 | 2.6 KB (re-export shim) | 751 KB | **4.6 KB** |
| `praytime@3.2.0` | 0.0341 | 12.5 | 29,309 | 11.9 KB | 32 KB | **2.4 KB** |
| `praytimes@0.0.5` | 0.0038 | 1.4 | 260,043 | 22.5 KB | 32 KB | **3.0 KB** |
| `@praytime/core@1.0.2` | 0.0442 | 16.1 | 22,640 | 24.0 KB | 164 KB | **4.8 KB** |

The `installed` column is misleading for `adhan` (751 KB) because the published tarball ships `lib/cjs`,
`lib/esm`, `lib/types` and sourcemaps; a bundler takes one of them. The `min+gzip` column is the number that
matters for an app binary, and there `adhan` is 4.6 KB. **Every candidate is small enough that size is not a
decision input.**

The realistic workload, measured with the actual Moonsighting Committee method:

| workload | measured on M1 |
|---|---|
| `adhan` MC, full year, one city, cold (first call, no warm-up) | 16.4 ms |
| `adhan` MC, full year, one city, warm | 11.6 ms |
| `adhan` MC, 20 cities x 365 days = 7,300 computations | 240 ms |

**On the OnePlus 3T floor device.** I could not run on the device, so this is a scaled estimate and marked as
such. A Snapdragon 820 under Hermes is conservatively 10x to 20x slower than an M1 under V8 for this kind of
trigonometry-heavy scalar code. That puts a full-year single-city precompute at **roughly 0.15 to 0.35 seconds**,
and the 20-city sweep at 2.4 to 4.8 seconds. Status of the multiplier: **UNVERIFIED**, it needs one run on the
device. The conclusion survives a wide error bar either way: the owner's "fetch the whole year once and cache it"
architecture costs a fraction of a second of CPU, and computing six times on demand costs under a millisecond.

---

## Part 3: the correctness oracle question

The owner's constraint: he cannot verify hand-written mathematics. So the question is what this project can
actually prove about a library it did not write.

### Every oracle, what it proves and what it does not

| oracle | what it can prove | what it cannot prove | licence and terms for use as a committed test fixture |
|---|---|---|---|
| **US Naval Observatory API** (`aa.usno.navy.mil/api/rstt/oneday`, v4.0.1, tested live 2026-09-30, HTTP 200 in 1.24 s) | Sunrise, sunset, solar transit and civil/nautical/astronomical twilight for any coordinate and any date 1700-2100, to the whole minute. **Measured: all three libraries agree with it within 1 minute everywhere.** | Fajr, Isha, Asr or Maghrib, because it publishes no 18-degree twilight and no shadow ratio. Nothing about fiqh | US Government work, not subject to domestic copyright. The API docs request an `ID` parameter "so we can keep track of how many unique users we have" (cited). They publish a separate "Astronomical Data Used for Litigation" page, which signals data they stand behind. **Usable. Fetch once, commit the JSON, never call at runtime** |
| **HM Nautical Almanac Office** | The same quantities, as the UK authority, and it is the body the UK's own published tables derive from | Same limits as the USNO | **UNVERIFIED.** `astro.ukho.gov.uk/nao/` was fetched but returned no usable licence text in this session, and HMNAO historically licenses its data commercially. Do not assume it is free to commit. Needs a direct check before use |
| **NOAA solar calculator** | Sunrise, sunset and solar position from Meeus | Same limits, plus it is explicitly **unmaintained** | The page carries "Please be advised that the NOAA/GML Solar Calculator is **no longer actively supported or maintained** by our team ... we cannot guarantee its accuracy or functionality" (cited, fetched 2026-09-30). Its own stated accuracy is "within a minute for locations between +/- 72 degrees latitude, and **within 10 minutes outside** of those latitudes". **Do not use as an oracle.** A ten-minute tolerance is useless for this purpose, and an unmaintained source is not a reference |
| **Skyfield + JPL DE440s** | The reference ephemeris itself. **Measured: agrees with `astronomy-engine` to 0.45 arcsec mean and 1.17 arcsec max declination over 365 days of 2026, and 0.06 s mean on the equation of time** | Nothing about prayer times. It gives the sun's position, and the rest is definitions | Skyfield is MIT. DE440s is a NASA/JPL public data product. **Usable as the deepest layer, offline after the one-time 32 MB kernel download.** Best used to generate fixtures once, not shipped |
| **`astronomy-engine`** (2.1.19, 191,739 weekly downloads) | Sunrise, sunset, transit and arbitrary-altitude twilight by direct search, in JavaScript. **Measured: matches the USNO on 114/116 sunrises, 118/118 transits, 112/114 civil dawns, 114/114 civil dusks** | Nothing about prayer times | MIT. **Usable, and it is the practical choice for a generated fixture suite** because it runs in the same language as the app with no Python and no ephemeris file |
| **`arabeyes-org/ITL`** | An independent second opinion with a **topocentric** correction and a real refraction model that no JS library has | Nothing more than the JS libraries about fiqh | LGPL-2.1. Usable as a development-time cross-check. Not shippable without a native module |
| **The adhan family's own cross-consistency** | That six language implementations agree with each other and with 8 authorities' published tables on 462 days. **Measured: all 8 fixtures pass inside their own declared variance** | Nothing independent, because they all descend from one Swift implementation of 2016-02-21 and share the fixture files. Agreement between siblings is not verification | MIT throughout. Usable, and worth keeping as a regression net, but it must not be mistaken for external proof |
| **An authority's published annual timetable, digitised** | The **only** thing that can verify Fajr, Isha and Asr, because it is the only source that encodes the fiqh | Nothing about the astronomy independently, and it embeds the authority's hand edits, so a mismatch is ambiguous between a library bug and an editorial adjustment | **Per authority, and mostly unclear.** adhan's own fixtures cite `islam.gov.qa`, `awqaf.gov.ae`, `ummulqura.org.sa`, `muis.gov.sg`, `yenisafak.com` and `moonsighting.com/pray.php`. None of those grants a redistribution licence that I could verify. **This is the real licensing risk in the whole verification plan** |

### Measured: the libraries against the USNO

`data/libraries/oracle.mjs` and `usno_fetch.sh`. 10 cities x 12 dates (6 cardinal and mid-season dates plus the
following day of each, needed for correct instant pairing), tz=0 so everything is UTC, method offsets zeroed.
Cells are days equal / |delta|=1 / |delta|>=2.

| source | sunrise | transit (solar noon) | sunset |
|---|---|---|---|
| `astronomy-engine 2.1.19` (the oracle itself) | 114/2/0 mean -0.02 | **118/0/0 mean 0.00** | 112/4/0 mean 0.02 |
| `adhan@4.4.6` | 106/10/0 mean -0.05 | 117/1/0 mean 0.01 | 87/9/0 mean 0.03 |
| `praytime@3.2.0` | 104/12/0 mean -0.02 | 117/1/0 mean 0.01 | 82/14/0 mean 0.02 |
| `praytimes@0.0.5` | 104/12/0 mean -0.02 | 115/3/0 mean 0.03 | 81/15/0 mean 0.03 |

And on civil twilight, which is the proof the twilight solver works:

| quantity | `astronomy-engine` minus USNO |
|---|---|
| begin civil twilight (-6 degrees) | 112/2/0 mean 0.00 |
| end civil twilight (-6 degrees) | 114/0/0 mean 0.00 |

**No library disagreed with the USNO by 2 minutes or more, on any quantity, at any city, on any date.** Mean bias
is within 0.05 minutes for all three.

**Two harness traps this cost me, recorded because any future fixture suite will hit both.**

1. **The USNO prints the events inside a UTC day with no day marker, in clock order.** At Anchorage
   (longitude -149.9) sunset always falls after 00:00 UTC, so the USNO's `Set` for day N is the sunset that
   follows day **N-1**'s sunrise. A prayer library instead returns the sunset that follows the **same** day's
   sunrise, because Maghrib must come after Sunrise on one card. Pairing by label produced a flat 3-minute error
   at Anchorage for all three libraries at once. **Three libraries agreeing on an error is the signature of a
   harness fault.** `oracle.mjs` now builds two separate pinnings and documents why.
2. **The USNO rounds to nearest; `Date.getUTCMinutes()` floors.** That invented a -0.50 mean bias across every
   row, which read exactly like a systematic library defect. Measured and corrected: rounding gives 0.000.

### The proposed verification strategy

Concrete, and buildable without writing any astronomy.

**Layer 1: the astronomy, verified externally and committed as fixtures.**

- Source: the USNO API, fetched once with `usno_fetch.sh`, response JSON committed verbatim.
- Cities: the 20 in `cities.json`, which already span the equator to 69.6N, both hemispheres, half-hour zones
  (Dhaka at +6, Karachi at +5), the DST-anomaly zones wave 1 identified (Cairo, Casablanca), and the polar circle.
- Dates: the 4 cardinal dates, the 2 equation-of-time extremes (2026-02-11 and 2026-11-03, the -14m06s and
  +16m33s peaks PrayTimes.org documents), each DST transition day and the day either side, plus the day after each
  for instant pairing. About 20 dates per city, so about 400 fixture rows.
- Quantities: sunrise, sunset, transit, and the three twilights.
- **Tolerance: 1 minute, and it is defensible** because the USNO itself publishes only to the minute, and because
  the measured agreement is already 106/116 exact with zero 2-minute misses. A 1-minute gate would have caught
  every real defect this report found and would not have produced a single false alarm.
- At Tromso and above, widen to **3 minutes** for sunrise and sunset only, because the measured sensitivity is 7.6
  seconds per arcsecond there and the libraries' 12-arcsec error is worth 89 seconds before any rule applies.

**Layer 2: the twilight solver, verified at an angle an authority publishes.**

- The USNO's civil (-6), nautical (-12) and astronomical (-18) twilights exercise the exact code path an
  18-degree Fajr uses, with a constant swapped. **Astronomical twilight is -18 degrees, which is numerically the
  MWL and Karachi Fajr angle.** Committing those rows verifies the Fajr solver against a government source, even
  though the USNO never calls it Fajr.
- Tolerance: 1 minute below 60 degrees; above that the twilight may not occur at all, and the fixture should
  record the non-occurrence rather than a time.

**Layer 3: the fiqh, which cannot be verified, only pinned.**

- Keep adhan's 8 fixture files as a regression net (all 8 pass today, measured), and treat them as **"this is
  what the library did when we shipped"**, not as proof of correctness.
- For each country the app claims to support, digitise one authority timetable and record the delta distribution
  rather than asserting a tolerance. A non-zero delta is information, not a failure.
- **Do not commit a digitised national timetable without checking its terms.** This is the one place the plan has
  a real legal exposure.

**Layer 4: cross-implementation agreement, as a cheap continuous check.**

- Run `adhan` and `praytime` over the same grid with **matched presets, matched rounding and matched
  high-latitude rule**, and gate on the residual staying under 1 minute. Measured today that residual is under a
  second at Dhuhr and under 31 seconds at sunrise at 64N. Two independently written engines drifting apart would
  be a strong signal that one changed.
- This costs nothing at runtime and catches the class of regression that a single-library fixture cannot.

---

## Part 4: the honest limits

**No library can reproduce a hand-edited published timetable, and adhan's own test suite concedes it.** Measured
(`data/libraries/fixtures.txt`), the `variance` each authority needed:

| fixture | method | days | declared variance | worst measured delta | verdict | cited source |
|---|---|---|---|---|---|---|
| `Doha-Qatar` | Qatar | 12 | **0 (exact)** | 0 | PASS | `islam.gov.qa` |
| `Makkah-UmmAlQura` | UmmAlQura | 12 | **0 (exact)** | 0 | PASS | `ummulqura.org.sa` |
| `London-MoonsightingCommittee` | MoonsightingCommittee | 12 | **0 (exact)** | 0 | PASS | `moonsighting.com/pray.php`, source lines annotated "adjusted +/- 1 minute" |
| `Dubai-Gulf` | Dubai | 12 | 1 | 1 | PASS | `awqaf.gov.ae` |
| `Tehran-Tehran` | Tehran | 12 | 1 | 1 | PASS | `praytimes.org` |
| `Ankara-Turkey` | Turkey | 24 | **2** | 2 | PASS | `yenisafak.com` |
| `Kuwait City-Kuwait` | Kuwait | 12 | **2** | 2 | PASS | a Mac App Store app |
| `Singapore-Singapore` | Singapore | 366 | **2** | 2 | PASS | `muis.gov.sg` |

Total: **462 fixture days**, of which Singapore is 366. The three that pass exactly do so partly because their
source rows were **hand-annotated**: the London fixture's source lines carry `+1` and `-1` markers on 12 of 72
values, and Makkah's carry six. So even the "exact" fixtures were fitted.

**Quantified: two of adhan's eight shipped presets need 2 minutes of slack against the authority's own published
table.** That is the floor on what calculation can achieve against a real timetable, and it is not a library
defect. Turkey's is documented as an approximation; Kuwait's and Singapore's are not.

**Four of adhan's 13 methods have no fixture at all** (measured): `MuslimWorldLeague`, `Egyptian`, `Karachi` and
`NorthAmerica`. Those are among the most widely used methods in the world, and the library has no CI evidence that
its parameters match those authorities' published values. This report did not source the authorities' own
published angles independently, so whether the presets are right is **UNVERIFIED**. It is the obvious next
research question.

**A mosque's local adjustment cannot be known from any calculation.** Wave 1 measured a concrete instance:
`@tawfeeqmartin/fajr` applies an automatic elevation correction from its own city registry, which moves Bradford's
Maghrib by 2.28 minutes and London's by 0.68. That is the library guessing at a local adjustment, and it makes its
output differ from the published tables it is trying to match. The correct handling is a per-location offset the
user or a curated dataset supplies, not a formula.

**A fiqh dispute cannot be resolved by a library, and the size of the disagreement is large.** Measured here, at
London for 2026 with everything else held identical: Hanafi versus Shafi Asr differs by a mean of **51.4 minutes**
(from wave 1's `tables.md` section 4, cited). adhan's three `Shafaq` variants at London on 21 June give Isha times
spanning from Ahmer to Abyad; wave 1 measured the endpoint's m1 versus m2 at 23:52 against 22:41, **71 minutes**.
Those are correct answers from correct authorities. No amount of ephemeris accuracy addresses a 71-minute
juristic gap, and any claim of "absolute accuracy" has to be scoped to a chosen convention first.

**What "accurate" can honestly mean for this app**, stated as a hierarchy from the measurements:

| layer | achievable accuracy | evidence |
|---|---|---|
| solar position | 12 arcsec of declination, 2.5 s of equation of time | measured, `astronomy.txt` |
| sunrise, sunset, transit | within 1 minute of the USNO everywhere tested | measured, `oracle.txt` |
| Fajr and Isha given a chosen angle | within 1 minute of a correct solver | measured, `causes.txt` cause 5 |
| Fajr and Isha given a chosen high-latitude rule | 1 minute, if the rule is `SeventhOfTheNight`; up to 28 minutes of library-to-library spread if `MiddleOfTheNight` | measured, `causes.txt` cause 4 |
| Asr | 2 minutes at London, 6 at 64N, unbounded inside the polar circle | measured, `causes.txt` cause 3, `deltas.txt` |
| agreement with a national published table | 0 to 2 minutes, authority-dependent | measured, `fixtures.txt` |
| agreement between two defensible conventions | up to 71 minutes | cited, wave 1 |

---

## UNVERIFIED and open

1. **The OnePlus 3T multiplier.** The 10x to 20x scaling from M1 to Snapdragon 820 under Hermes is an estimate. It
   needs one run on the device. The conclusion (performance is a non-issue) survives any plausible multiplier, but
   the number should not be quoted as measured.
2. **Whether adhan's presets match the authorities' own published values.** Four of 13 methods have no fixture,
   and I did not independently source MWL's, Egypt's, Karachi's or ISNA's published angles. `Turkey()` is
   self-documented as an approximation. This is the biggest open correctness question in the report.
3. **HM Nautical Almanac Office terms.** Not established. Their data may be commercially licensed, which would
   rule it out as a committed fixture. Needs a direct enquiry or a licence page.
4. **Redistribution terms for every national timetable.** `islam.gov.qa`, `awqaf.gov.ae`, `ummulqura.org.sa` and
   `muis.gov.sg` publish tables that adhan's fixtures quote. Whether this project may commit digitised copies is
   unknown for all four, and it is the main legal risk in the verification plan.
5. **`praytime@3.2.0`'s test suite contents.** The tarball ships `tests/test.js` but I did not audit what it
   asserts or against which source. Its fixture quality is therefore unknown, in contrast to adhan's, which I read
   in full.
6. **`pray-calc`'s primary method.** I measured only its `solarEphemeris`. Its headline feature is a dynamic
   twilight angle model with Fourier smoothing and elevation correction, which is neither a named authority's
   method nor verifiable against one. Wave 1 read the source; I did not measure its prayer times. It is not a
   candidate for this app precisely because its main path is novel, but the measurement gap is real.
7. **`arabeyes-org/ITL` numerically.** No C toolchain run in this session. Its topocentric and refraction
   corrections are read from source, not measured. Its value as a cross-check is asserted, not demonstrated.
8. **`adhan.ts` and `islamic-adhan`.** Identified as PrayTimes.org lineage by tarball grep only (`280.459`,
   `0.98560028`). Not run, not read in full.
9. **The `@thani-sh/prayer-time-lk` data provenance.** Its README credits no authority explicitly and the package
   name says `acju` (All Ceylon Jamiyyathul Ulama) in the data filenames. Whether the tables are licensed for
   redistribution, and whether the MIT licence on the code extends to the data, is unknown.
10. **`@calgiellc/azan`'s packaging defect on a case-sensitive filesystem.** Wave 1 proved the `main`/`exports`
    case mismatch by tarball listing but never ran it on Linux. Irrelevant to the recommendation, still unproven.
11. **Whether any Egyptian or Turkish official body publishes source.** Searched, nothing found. Absence of
    evidence only.
12. **The 2 of 116 sunrises where `astronomy-engine` differs from the USNO by 1 minute.** Not individually
    investigated. Most likely the USNO's own rounding at a half-minute boundary, but that is an inference.

---

## Sources

All fetched 2026-09-30 unless stated. Tool named per fact, as the brief requires.

**Registry and repository facts** (via `npm view`, `curl` to `api.npmjs.org`, and `gh api`):
- `https://registry.npmjs.org` via `npm view` for every package's version, licence, publish date, dependency list
  and `dist.unpackedSize`.
- `https://api.npmjs.org/downloads/point/last-week/<pkg>` for all weekly download counts.
- `https://github.com/batoulapps/{adhan-js,adhan-swift,adhan-kotlin,adhan-testdata,adhan-data,Adhan,ITL}` via
  `gh api`, including `git/trees/<branch>?recursive=1` for file listings and `contents/` for fixture bodies.
- `https://github.com/{iamriajul/adhan-dart,alphahm/adhanpy,mnadev/adhango,insha/salah,davidpet86/Adhan-csharp,radcheb/Adhan}`
  via `gh api`.
- `https://github.com/arabeyes-org/ITL` via `gh api`, including `COPYING`, `prayertime/astro.c` and
  `prayertime/doc/method-info.md`.
- `https://api.github.com/search/repositories?q=org:mawaqit` via `gh api`, 21 repositories.
- `https://packagist.org/packages/islamic-network/prayer-times.json` and
  `.../prayer-times-moonsighting.json` via `curl`, for licence and download counts.

**Authority and algorithm documentation:**
- `https://aa.usno.navy.mil/data/api` (API v4.0.1 docs), `https://aa.usno.navy.mil/faq/RST_defs` (rise/set
  definitions), `https://aa.usno.navy.mil/faq/sun_approx` (the "about 1 arcminute within two centuries of 2000"
  claim and the exact constants), `https://aa.usno.navy.mil/data/RS_OneYear` (the litigation-use note). First two
  via `tinyfish.fetch_content`; `sun_approx` via `curl` after TinyFish returned the navigation chrome only.
- `https://gml.noaa.gov/grad/solcalc/` and `https://gml.noaa.gov/grad/solcalc/calcdetails.html` (the
  "no longer actively supported" notice and the "within a minute ... within 10 minutes outside" accuracy claim).
  First via `tinyfish.fetch_content`, second via `curl`.
- `https://praytimes.org/calculation` and `https://praytimes.org/manual` (the USNO algorithm, the three
  high-latitude rules, the equation-of-time extremes, the method table). `manual` via `tinyfish.fetch_content`;
  `calculation` via `curl` because TinyFish returned a Synology 404 page for that host. Announced as required by
  the global tool-routing rules.
- NREL SPA's ±0.0003 degree uncertainty and -2000 to 6000 range, via `tinyfish.search`, corroborated by
  `docs.nlr.gov/docs/fy08osti/34302.pdf`, `pvpmc.sandia.gov` and `docs.rs/solar-positioning`.
- `https://github.com/arabeyes-org/ITL` blob `prayertime/astro.c` for the VSOP87/Meeus attribution.

**Source code read** (via `opensrc` for `adhan`, and directly from the installed trees in
`/Users/muji/athan-global-scratch/harness/node_modules/` for the rest):
- `adhan@4.4.6`: `src/Astronomical.ts` (L15-330, read in full), `src/SolarCoordinates.ts` (L1-55, in full),
  `src/SolarTime.ts` (L25-105), `src/CalculationMethod.ts` (in full), `METHODS.md` (in full),
  `LICENSE`. `opensrc path npm:adhan@4.4.6` resolved to
  `/tmp/opensrc/repos/github.com/batoulapps/adhan-js/4.4.6`.
- `praytime@3.2.0`: `src/praytime.js` (397 lines, read in full), `LICENSE`, `package.json`, `README.md`.
- `praytimes@0.0.5`: `src/praytimes.js` (the header, `methods`, `setting` at L120-165, `adjust` at L238-245,
  `adjustHighLats` at L538-563, `nightPortion` at L565-580), `LICENSE`.
- `@praytime/core@1.0.2`: `dist/index.d.ts` (in full), `package.json`.
- `pray-calc@2.4.0`: `dist/index.d.ts` (the civil-date, types and constants sections), `package.json`.
- `@thani-sh/prayer-time-lk@5.1.0`: tarball listing, `dist/data/acju.colombo.js`, `README.md`, `LICENSE`.
- `adhan.js@0.0.2`: tarball listing, which shows `src/rest/endpoints/` and `src/rest/Client.js`.

**Scripts and raw data written by this report**, all under
`ai/features/global-prayer-times/data/libraries/`:

| file | what it does |
|---|---|
| `cities.json` | the 20 test cities with IANA zones |
| `compare.mjs` | the main delta harness, 4 libraries x 20 cities x 365 days x every shared method |
| `deltas.txt` | its output, trimmed to the MWL, MWLHanafi and Turkey sections plus the disagreement list |
| `astronomy.mjs` | declination and equation-of-time accuracy against `astronomy-engine`, plus the latitude sensitivity derivation |
| `astronomy.txt` | its output |
| `causes.mjs` | the six cause-isolation experiments |
| `causes.txt` | its output |
| `polar.mjs` | Tromso polar behaviour for 9 configurations, plus the performance and size measurements |
| `polar.txt` | its output |
| `usno_fetch.sh` | fetches the USNO fixtures, 10 cities x 12 dates, 1.2 s apart, with a URL and status log |
| `oracle.mjs` | every library and the oracle against the USNO, with both instant pairings |
| `oracle.txt` | its output |
| `oracle_crosscheck.py` | Skyfield + JPL DE440s, to verify the oracle itself |
| `fixtures.mjs` | runs `adhan` against its own 8 shared fixtures and reports method coverage |
| `fixtures.txt` | its output |

Environment for every measurement: node v24.14.1, darwin arm64 (Apple M1), `TZ=UTC`, Python 3.14.4 with
`skyfield 1.55` and `astropy 8.0.1` in `/Users/muji/athan-global-scratch/venv`, `astronomy-engine@2.1.19`,
`esbuild` for bundle sizing. Nothing was installed into the repository.

---

## RECOMMENDATION

### Primary: `adhan@4.4.6` (npm `adhan`, MIT, `batoulapps/adhan-js`)

**The reasoning, in the order it actually matters.**

1. **Licence.** MIT, cleanly, with the same licence across the whole six-language family. The two strongest
   alternatives on the calculation side, `islamic-network/prayer-times` and `@praytime/core`, are both
   GPL-3.0-or-later and cannot ship in a closed app store binary. That eliminates them before any technical
   comparison.

2. **It is the only candidate whose polar and high-latitude behaviour is a deliberate design rather than an
   accident.** Measured: it returns `Invalid Date` by default and offers `AqrabBalad` and `AqrabYaum` as named,
   documented strategies; `@praytime/core` silently clamps the cosine and returns four different prayers at
   `"22:46"` on the midnight-sun solstice; `praytime` returns the string `"-----"` and its high-latitude rules do
   not resolve the polar case at all (69 null Fajr days with `NightMiddle` and 69 with `OneSeventh`, identical).
   For an app going worldwide, a library that tells you it cannot answer is worth more than one that guesses.

3. **It ships the Moonsighting Committee method, which wave 1 already audited line by line and found faithful to
   Shaukat's published figures.** No other maintained candidate has a correct MC implementation. Given that wave 1
   established the London timetable's relationship to that method, discarding the one library the previous wave
   verified would throw away the project's own prior work.

4. **The six-language family with five byte-identical fixture files is real, if limited, corroboration.**
   Measured: 5 of 8 fixtures match by SHA-256 across `adhan-js`, `adhan-swift`, `adhan-kotlin` and
   `adhan-testdata`, and all 8 pass inside their declared variance. Three independent implementations asserting
   against the same bytes is meaningfully stronger than one package's self-consistency.

5. **Its astronomy is as good as the best alternative and better than the PrayTimes lineage.** Measured: 11.7
   arcsec max declination error, identical to `pray-calc`'s NREL-SPA path to 0.005 arcsec, against 15.2 for
   `praytime` and 20.5 by 2100. Its equation of time is 2.17 s max against 2.50. And critically, its error does
   not degrade with time while the PrayTimes lineage's does.

6. **Maintained, in 2026.** Three releases this year (4.4.4, 4.4.5, 4.4.6) after a three-year gap, 50,992 weekly
   downloads (350x the runner-up), and the 2026 commits are real fixes: `d8d247f` named the
   `HIGH_LATITUDE_THRESHOLD` constant and `b414ab4f` corrected wrong dates in a fixture.

7. **Performance and size are non-issues.** Measured: 4.6 KB minified and gzipped, 11.6 ms for a full year at one
   city, 240 ms for 20 cities x 365 days. The owner's yearly-cache architecture is affordable by a wide margin.

**The conditions I would attach to this recommendation**, because the measurements imply them:

- **Set `highLatitudeRule` explicitly and do not leave it at the default.** This is the largest single lever in
  the whole report. Measured, `SeventhOfTheNight` makes two independent engines agree within 1 minute on every day
  at Oslo, Reykjavik, Anchorage and London, while `MiddleOfTheNight` lets them drift 28 minutes apart. adhan's own
  `HighLatitudeRule.recommended()` picks `SeventhOfTheNight` above 48 degrees, and adhan's `METHODS.md` recommends
  it "for locations above 48 degrees latitude to prevent prayer times that would be difficult to perform" (cited).
  Note the trap wave 1 found: `highLatitudeRule` is silently **ignored** by the MoonsightingCommittee path.
- **Keep `rounding` at `Nearest`.** Measured, it is the only rule with a mean near zero; `Up` and `None` shift
  every time by half a minute in expectation, and `Up` moves a time even when the seconds are exactly 0.
- **Decide the polar policy in the app, not by default.** `Unresolved` producing `Invalid Date` on 69 to 116 days
  a year at Tromso is correct behaviour, but the UI must have an answer for it. Both resolution strategies move
  Dhuhr and Asr, which moonsighting.com's own FAQ says are always calculable, so neither is free.
- **Treat Asr above about 60 degrees as unreliable and say so.** Measured: 6 minutes of library disagreement at
  64N and thousands of minutes inside the polar circle. adhan's `SolarTime.afternoon` carries a
  `// TODO source shadow angle calculation` comment in shipped code.
- **Build the USNO fixture suite described in Part 3 before writing any feature code.** It costs one fetch script
  and about 400 committed JSON rows, it needs no astronomy written by this project, and it would have caught every
  real defect in this report. It is the direct answer to "we can't verify if it's correct or not".

### Runner-up: `praytime@3.2.0` (npm `praytime`, MIT, Hamid Zarrabi-Zadeh)

A genuinely good library that this research wave nearly missed, because wave 1 only looked at the abandoned
LGPL `praytimes` package. It is the ancestor of most of this software, written by the author of the algorithm
nearly every other implementation copies, relicensed to **MIT** in 2025, maintained, 2.4 KB minified and gzipped
(**half** adhan's), zero dependencies, and per-instance state done correctly. Its Asr iterates the declination at
the Asr time where adhan uses the noon value, which is arguably the better physics. Measured, it matches the USNO
on 104 of 116 sunrises, statistically indistinguishable from adhan.

It loses on four things, all measured: no Moonsighting Committee method; no polar-circle resolution at all; a
solar series about twice as inaccurate as adhan's that degrades with time; and no cross-language fixture family.

### What would make me switch

- **To `praytime@3.2.0`:** if the project decided against the Moonsighting Committee method, and accepted
  returning `"-----"` inside the polar circles. Its smaller bundle, cleaner state handling and better Asr epoch
  would then make it the better choice. Also switch if adhan goes unmaintained again and `praytime` does not.
- **To a precomputed-table approach like `@thani-sh/prayer-time-lk`'s, for specific countries:** if research
  establishes that a target country's published timetable is hand-edited beyond what calculation can reach.
  Measured evidence that this happens: adhan's own Kuwait and Singapore fixtures need 2 minutes of variance. For
  such a country, shipping the authority's table as data is not a compromise, it is the only correct answer.
  608 KB for 29 cities x 365 days x 6 prayers is affordable for a handful of countries and not for the world.
- **To `arabeyes-org/ITL` via a native module:** only if the project ever needs topocentric or
  pressure-corrected times, which would mean it had decided elevation and atmospheric conditions matter. Nothing
  in these measurements suggests they do at minute resolution.
- **Away from adhan on evidence:** if the open question in UNVERIFIED item 2 resolves badly. If adhan's
  `MuslimWorldLeague`, `Egyptian`, `Karachi` or `NorthAmerica` presets turn out not to match those authorities'
  published values, that is a correctness failure in the four most-used methods with no fixture to catch it, and
  it would change the recommendation. **Sourcing those four authorities' published angles is the highest-value
  next research task in this area.**
