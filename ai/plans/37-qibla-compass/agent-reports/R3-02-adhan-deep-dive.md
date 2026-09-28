# Round 3, agent 2: the `adhan` deep dive

Returned 2026-09-28, after the owner flagged the library as "a very interesting one". **The most rigorous
report of the nine**, and it reverses this session's provisional recommendation.

Planner's ruling in `RESEARCH.md` section 21.

---

## 1. Size, and the tree-shaking trap

| Metric | Value |
| --- | --- |
| Full library, minified | **13,538 B** |
| Full library, min+gzip | **4,662 B** |
| Qibla-only subset (Qibla + Coordinates + MathUtils) | ~1.5 KB raw, **under 1 KB minified** |
| Runtime dependencies | **zero** |

**But the 1.5 KB version is not reachable, and the agent is precise about why:**

- `Adhan.ts` is a **barrel** re-exporting all 12 public symbols.
- **`sideEffects` is not set** in `package.json`, so Expo's tree-shaking will not remove the rest.
  **Independently verified by this session against the npm registry: the field is absent.**
- The `exports` map exposes **only `"."`**, so a deep import of `adhan/lib/esm/Qibla.js` is **blocked**
  wherever package-exports resolution is on, which Metro enables by default in recent SDKs.
  **Independently verified: the map contains exactly one key.**

> **The agent's ruling, which this session adopts: accept the 13 KB, do not fight for the 1.5 KB. "Thirteen
> kilobytes of Hermes bytecode is a rounding error; a bundler workaround is a real liability."**

## 2. The test suite, and what it proves

**Seven vitest files, 77 test blocks, about 495 assertions.**

**The qibla tests specifically: 11 cities, each asserted with `toBeCloseTo(value, 3)`, so agreement to
0.001°**, roughly one arcsecond:

| City | Asserted | City | Asserted |
| --- | --- | --- | --- |
| Washington DC | 56.560 | Sydney | 277.499 |
| New York | 58.481 | Auckland | 261.197 |
| San Francisco | 18.843 | **London** | **118.987** |
| Anchorage | 350.883 | Paris | 119.163 |
| Oslo | 139.027 | Islamabad | 255.882 |
| Tokyo | 293.021 | | |

**London's asserted value is 118.987, which is the figure this session computed independently.**

**The honest caveat the agent flags:** these reference values are **hardcoded and cite no external source.**
They are the family's canonical numbers, identical across ports. So they prove internal consistency and
regression safety, not external correctness.

**The prayer-time tests DO use a sourced dataset:** 8 JSON fixtures in a dedicated `batoulapps/adhan-testdata`
repo, each embedding its own `source` and `variance`. **One of them is London / MoonsightingCommittee /
Hanafi / MiddleOfTheNight, which is this app's exact current configuration.**

**Historical bugs: several in prayer times, NONE EVER IN QIBLA.** An issue search for "qibla" returns six
results and zero correctness reports. The bugs that do surface are increasingly exotic polar-circle cases,
"the signature of a library whose core has been stable for a decade".

## 3. The ports agree byte-for-byte

The agent read adhan-js, adhan-swift and adhan-java/kotlin: **identical Kaaba constant, identical formula,
and the same source comment in every one**. Kotlin's suite adds two cities (Cape Town 118.004, Cairo
136.137) on top of the shared 11.

Community ports exist in C#, C, Rust, Dart, Python and Go.

## 4. THE CITATION CHECKS OUT, AND THAT IS THE REAL SIGNAL

The agent was asked to verify the comment *"Equation from 'Spherical Trigonometry For the use of colleges
and schools' page 50"*, as a proxy for how carefully the library was built. **It did, in the actual text.**

The book is **Isaac Todhunter, revised by J. G. Leathem (Macmillan)**, read on archive.org
(`sphericaltrigono00todh`, digitised from the University of Toronto).

**Printed page 50 is Article 76: Napier's Rules, the "Rules of Circular Parts" for right-angled spherical
triangles**: "sine of the middle part = product of tangents of adjacent parts; sine of the middle part =
product of cosines of opposite parts."

**And the formula adhan implements is exactly what Napier's rules yield** for the right spherical triangle
formed by dropping a perpendicular from the Kaaba to the observer's meridian.

> **"The citation is genuine, points at the right theorem, and tells you the authors derived the bearing
> from a classical source rather than copy-pasting a blog post."**

## 5. Maintenance

- **Maintainer: Batoul Apps**, the company behind the commercial Guidance prayer app, which ships
  adhan-swift in production. **Dogfooded corporate code, not a hobby repo.**
- **Latest release 4.4.6 on 2026-08-31; last push 2026-09-17.** 21 versions since 2016.
- semantic-release, commitlint, husky, GitHub Actions CI, vitest coverage.
- **Nine open issues**, several of them a 2026 burst of polar-circle edge-case PRs, which the agent reads
  as an active correctness culture rather than neglect.
- **48,154 weekly downloads**; 481 dependent repositories.
- React Native compatibility was asked and answered affirmatively (issue #175, 2025): pure JS, zero deps,
  no Node APIs. `dist.test.ts` verifies the published builds load.

## 6. The Kaaba coordinate's provenance is UNDOCUMENTED

`21.4225241, 39.8261818` has been in every port since roughly 2016. **No geodetic survey is cited anywhere
in the family**, and a web search for the exact constant returns nothing outside adhan-derived code.

An unmerged 2026 PR glosses it as "Official coordinates: 21°25′21.1″N, 39°49′34.3″E", **which does not
exactly reproduce the constants**, so even the maintainers' own documentation of their constant is a
rounding gloss. Seven decimals is about 1 cm.

**Practical impact: zero.** The difference from Wikipedia's value is under 0.0001° of bearing anywhere on
Earth.

## 7. What adhan would give us for v2.0

- **12 named calculation methods**: MuslimWorldLeague, Egyptian, Karachi, UmmAlQura, Dubai, Qatar, Kuwait,
  **MoonsightingCommittee** (recommended for the UK), Singapore, Turkey, Tehran, NorthAmerica, Other.
- **Madhab**: Shafi and Hanafi asr, which is the UK-relevant switch.
- **Shafaq**: General, Ahmer, Abyad, for moonsighting isha.
- **High latitude**: three rules plus `recommended()`. **A live 2026 PR (#209) reports that `recommended()`
  ignores the southern hemisphere.**
- **Polar**: AqrabBalad, AqrabYaum, Unresolved.

**The two-sources risk, and its mitigation:** while our API serves prayer times and adhan serves only the
qibla, the outputs do not overlap, so no inconsistency is visible. **The risk appears only at v2.0 if both
compute prayer times.** The mitigation: "treat adhan as the single calculation engine and the API as a
temporary data source, never both live for the same output."

## 8. Sun-transit: partially possible through the public API

**`SolarTime`, `SolarCoordinates` and `Astronomical` are INTERNAL**, absent from the 12 public exports, and
**there is no sun-azimuth function anywhere in the library.**

**But a public path exists:** `new PrayerTimes(makkahCoordinates, date, params).dhuhr` is solar transit at
the Kaaba. On the two annual dates when solar declination matches the Kaaba's latitude, that instant IS the
rasd al-qibla.

So adhan can compute the verification instants from its public API; only the declination-matching date
selection is missing.

## 9. The agent's recommendation: ADOPT

> **Adopt `adhan@4.4.6`, import it as `import { Qibla } from 'adhan'`, and treat it as the v2.0 calculation
> engine rather than a qibla helper.**

Its reasoning, in its order of weight:

1. **Correctness is settled.** Our own global comparison at 0.0006°, plus 11 city tests at 0.001°,
   byte-identical across four official ports, zero qibla bugs in a decade, and a formula traceable to
   Todhunter §76 verified in the original text.
2. **The v2.0 optionality is worth more than the 13 KB.** Going global means methods, madhabs and polar
   handling we have not built, tested against fixtures that **already include our exact current London
   configuration**.
3. **Five-year maintenance risk is low and asymmetric.** "The DIY path's risk isn't that the math rots, it's
   that your 30 lines never grow into the polar/high-latitude/method matrix v2.0 needs."
4. **Accept the 13 KB.**

**The sanctioned fallback if bundle purity ever becomes hard:** vendor the 25-line `Qibla.ts` **with its MIT
header**, not a hand-rewrite, and re-adopt the package at v2.0.

## Key sources

- npm registry and bundlephobia for adhan@4.4.6
- `batoulapps/adhan-js` source, tests and issues; `batoulapps/adhan-testdata`
- adhan-swift `Sources/Qibla.swift`; adhan-java `QiblaUtil`
- **Todhunter, *Spherical Trigonometry for the Use of Colleges and Schools*, archive.org
  `sphericaltrigono00todh`, page 50, Article 76 (Napier's Rules)**
- Expo tree-shaking guide: `docs.expo.dev/guides/tree-shaking`
- adhan-js issues #175, #202, #209, #214, #221
