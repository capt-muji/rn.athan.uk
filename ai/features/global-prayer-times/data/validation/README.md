# R7 validation suite

Scripts, fixtures and raw output for `agent-reports/R7-library-validation.md`.
Research artefacts. Nothing here is app code and nothing here is a repository
dependency.

## Running

Packages live in the scratch tree, never in this repository:

```sh
ln -s /Users/muji/athan-global-scratch/harness/node_modules node_modules
```

That tree holds `adhan@4.4.6`, `adhan@4.4.3` (aliased `adhan-443`),
`praytime@3.2.0` and `astronomy-engine@2.1.19`. `node_modules` is gitignored.

Every script needs `TZ=UTC`, because `adhan` reads the calendar date off the
`Date`'s LOCAL getters (`PrayerTimes.ts` L52-56).

```sh
TZ=UTC node presets.mjs  > presets.txt   # Part 1, the four untested presets
TZ=UTC node highlat.mjs  > highlat.txt   # Part 2, the high-latitude rules
TZ=UTC node polar.mjs    > polar.txt     # Part 3, the polar resolutions
TZ=UTC node verify.mjs   > verify.txt    # Part 4, the fixture suite
TZ=UTC node attack.mjs   > attack.txt    # Part 5, the case against adhan
```

`verify.mjs --gate` is the CI shape: terse to stderr, exit 1 on any failure.

## Re-fetching the fixtures

Both fetchers skip files that already exist, so a re-run resumes rather than
re-downloads. Neither needs to be re-run to reproduce the reported numbers.

```sh
./usno_fetch.sh ./usno              # 20 cities x 20 dates, rise/set/transit
./usno_twilight_fetch.sh ./usno_year # 20 cities x 4 whole-year tables
node authority_fetch.mjs            # MWL, Egypt and FCNA, their own output
```

## What is here

| path | what |
|---|---|
| `lib.mjs` | shared helpers: angle inversion, transit-anchored solving, adhan drivers |
| `presets.mjs`, `presets.txt` | `MuslimWorldLeague`, `Egyptian`, `Karachi` and `NorthAmerica` against the authorities |
| `highlat.mjs`, `highlat.txt` | every high-latitude rule, 11 cities, a full year, plus the latitude threshold table |
| `polar.mjs`, `polar.txt` | `AqrabBalad`, `AqrabYaum` and `Unresolved` across a polar year |
| `verify.mjs`, `verify.txt` | the two-layer USNO verification suite and its gate |
| `attack.mjs`, `attack.txt` | the five charges against adhan, each tested |
| `usno_fetch.sh`, `usno/` | 400 USNO rise/set/transit responses, JSON verbatim |
| `usno_twilight_fetch.sh`, `usno_year/` | 80 USNO whole-year tables at -6, -12 and -18 degrees, HTML verbatim |
| `authority_fetch.mjs`, `authority/` | the MWL portal, the Egyptian ESA table and the FCNA ruling, verbatim |

## Sources and terms

USNO data (`usno/`, `usno_year/`) is US Government work, not subject to
domestic copyright, so it is committed verbatim. The `ID` parameter in the
request URLs is the USNO's own unique-user counter, not authentication, and
carries no secret.

`authority/` holds three third-party captures kept as evidence for a research
report, not redistributed as a product. Their terms are not established, which
is recorded as an open item in the report.

## Traps these scripts close

Each cost a wrong table before it was found, and each is commented at the point
it is handled:

1. **Refraction in the angle inversion.** `Horizon(..., 'normal')` adds
   refraction; prayer angles are geometric. Using it recovered Egypt's Fajr at
   18.99 against its known 19.5, which is nothing but the 0.52-degree
   refraction term.
2. **Search direction.** `astronomy-engine`'s `SearchAltitude` takes +1 for an
   ASCENDING crossing, so morning twilight is +1 and evening is -1.
3. **Day pairing, three times over.** Anchoring a solar search on 00:00 UTC
   rather than on transit returns the neighbouring solar day's event. It bites
   west of about 90 degrees longitude (Anchorage, Calgary) AND east of about 60
   (Singapore, Dhaka, Tashkent), in opposite directions. R3 documented the
   western half; the eastern half is new here.
4. **Fixed-width USNO tables.** The whole-year tables must be sliced by column,
   not split on whitespace: February's blank day-29 to day-31 cells shift every
   later month left by one pair and attribute March times to February.
5. **Rounding.** The USNO rounds to nearest; `Date.getUTCMinutes()` floors,
   which invents a -0.50 minute bias. `mins()` rounds.
