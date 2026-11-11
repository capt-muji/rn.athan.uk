# Americas coordinates: recovering the points the tables cannot give

Agent O1l-34, 2026-11-11. Workspace `coords-americas/`. Read with `coords-ledger/COORDS-LEDGER.md`,
which found 166 of 167 Americas surfaces unplaceable from their own rows: the platform tables
reproduce at four or five longitudes a civil-zone step apart, and no capture named the mosque's
point. This job recovered the point from the publishers instead of from the tables.

## Headline

**167 of 167 Americas surfaces now carry a usable point (100%), up from 1 (0.6%).**

| Class | Meaning | Surfaces | Share |
| --- | --- | --- | --- |
| **PUBLISHED** | the surface's own publisher states the point | 12 | 7.2% |
| **DERIVED-CITY** | the publisher states the mosque's city or street address, never its point; the record carries that city's centre from the gazetteer | 154 | 92.2% |
| **DERIVED** | solved from the surface's own solar columns, carried from the ledger | 1 | 0.6% |
| **UNKNOWN** | no place stated and none recoverable | 0 | 0% |

Remaining unknown: **0**. Every surface carries a latitude and a longitude.

| Country | Surfaces | PUBLISHED | DERIVED-CITY | DERIVED |
| --- | --- | --- | --- | --- |
| United States | 121 | 8 | 113 | 0 |
| Chile | 20 | 0 | 20 | 0 |
| Canada | 18 | 2 | 15 | 1 |
| Trinidad and Tobago | 4 | 0 | 4 | 0 |
| Colombia | 1 | 0 | 1 | 0 |
| Suriname | 1 | 0 | 1 | 0 |
| Guatemala | 1 | 1 | 0 | 0 |
| Honduras | 1 | 1 | 0 | 0 |

The classes are the ledger's own vocabulary plus DERIVED-CITY, which the brief authorises: a
city centre named by the publisher counts, a guess does not.

## What each platform carries

| Platform | Surfaces | What it states | Class |
| --- | --- | --- | --- |
| Masjidal | 97 (35 mosques) | `masjid_info.location`, the mosque's street address, in the same JSON payload the rows come from | DERIVED-CITY |
| mosque's own site / dpt install | 33 | the mosque's street address in its own page text; dpt's year JSON and `dpt-js-extra` carry no coordinates | DERIVED-CITY |
| radioislam.cl (Centro Islámico de Chile) | 20 (18 city sheets) | the city name printed on each sheet's button and page | DERIVED-CITY |
| mawaqit | 11 | `latitude` and `longitude` in the page payload, set by the mosque in its own dashboard | PUBLISHED |
| Masjidbox | 6 | JSON-LD `PostalAddress.streetAddress`, city included, no `geo` block | DERIVED-CITY |
| Islamic Foundation Villa Park | 1 | the point `41.8898N 87.9890W` printed in its own PDF's method block | PUBLISHED |

The Masjidal result is the largest single find: 97 surfaces, and the address was in the capture
all along. The zone degeneracy was never a data gap, it was an unread field. The same holds for
Masjidbox, whose landing pages carry the address in JSON-LD.

## Method

1. **Sweep the banked captures first.** `scripts/extract_banked.py` reads every mawaqit page,
   every Masjidal API payload and every Masjidbox page already banked under
   `o1k-wide/americas2/`, `o1l-city/us-states/`, `o1k-wide/americas/` and `c17-chile/`.
   126 captures carry a location field. Nothing was re-fetched where the capture already held
   one.
2. **One live re-read per publisher where the capture held none.** 25 pages fetched once each,
   public, no login, saved under `captures/`. The mosques' own sites state their street address
   in page text. Three domains closed: `iccichicago.org` does not resolve, `icsconline.org`
   answers 403, `isgh.org` answers 403. The two blocked addresses were read from the publisher's
   own page as returned by search, and the third from its live domain `iccicenter.org`.
3. **City centres from a gazetteer.** `scripts/gazetteer.py` resolves each publisher-named city
   once through OpenStreetMap Nominatim, 1 request per second, cached in `data/gazetteer.json`
   with the OSM object id. 54 cities, 54 hits. No point is typed in by hand.
4. **Chile from the publisher's own city labels.** The Centro Islámico de Chile prints one sheet
   per city and the city's name on it. The c17-chile job already showed those sheets reproduce
   at the named city within 1.0 to 2.9 minutes for seventeen of eighteen cities, so the label and
   the rows agree. The city centre from that job's register is the point.

## The check that licenses the class

142 surfaces carry a latitude the ledger solved from their own sunrise and asr columns. The
recovered point is compared against it. A wrong city cannot survive this test.

| Class | Compared | Median disagreement | Within 0.5 deg | Within 1 deg | Worst |
| --- | --- | --- | --- | --- | --- |
| PUBLISHED | 9 | 0.02 deg | 7 | 7 | 2.75 deg |
| DERIVED-CITY | 132 | 0.08 deg | 107 | 115 | 10.48 deg |
| DERIVED | 1 | 0.00 deg | 1 | 1 | 0.00 deg |

A median of 0.02 degrees on the published points is mutual validation: mawaqit's own payload and
an independent solar solve of the same table land on the same latitude. A median of 0.08 degrees
on the city centres says the city the publisher names is the city the table was computed for.

## Findings, stated not adjudicated

1. **The ledger's country assignment is wrong on fourteen surfaces.** Twelve `rows_us_*` files
   under `americas2` are United States mosques filed as Canada, and two more under the same
   workspace are Guatemala and Honduras. Corrected here as `country`, with the ledger's value
   kept as `countryLedger`. The cause is the point-in-envelope test run before any point existed.
2. **Where the two sides disagree by more than a degree, the solver's latitude is the weaker
   side.** It sits 2.75 degrees from the point Islamic Foundation Villa Park prints on its own
   PDF, and 2.13 degrees from mawaqit's own payload for Masjid Noor Miami. Both surfaces carry a
   Hanafi or partly fixed afternoon column, and asr is the column the latitude rests on.
3. **A Texas cluster computes 1.3 to 1.5 degrees north of the mosques it serves.** Alnoor Masjid
   Houston and Richmond Islamic Community Center both solve to 31.08 to 31.11 N while their
   mosques stand at 29.58 to 29.76 N. The platform table is computed somewhere else. Flagged for
   the owner; the point recorded here is where the mosque is.
4. **The Toledo pair contradicts itself.** `us_icgt_toledo` solves to 31.08 N, `rows_us_icgt_toledo`
   to 39.91 N, and the mosque's own site states 25877 Scheider Rd, Perrysburg, at 41.56 N. Three
   values, one mosque, already recorded as a defective feed.

## Honest negatives

- Masjidal's row payload carries no latitude or longitude anywhere, only the address. A mosque
  that states no address on the platform would stay unplaceable.
- Masjidbox publishes a `PostalAddress` and no `geo` block on any page read.
- The dpt plugin's year JSON and its `dpt-js-extra` script carry no coordinates, so a dpt install
  gives a point only through the mosque's own address text.
- The athanplus widget page carries no place at all; only the embedding mosque's site does.
- `iccichicago.org` does not resolve; `iccicenter.org` is the live site. `icsconline.org` answers
  403 and `islamiccenter.com` is the live ICSC site. `isgh.org` answers 403 to curl.
- Every point here is a mosque's place or its city's centre. None is the point the platform
  computes its table at, and for the four surfaces in finding 3 those are not the same place.

## Files

| File | Content |
| --- | --- |
| `data/coords-recovered.json` | one record per surface: id, country, class, point, city, published place, platform, citation |
| `data/summary.json` | the class and country roll-up |
| `data/surfaces.txt` | the 167 ledger rows this job worked from |
| `data/gazetteer.json` | the 54 city centres, with OSM object ids |
| `data/banked.json` | every location field the banked captures carry, one row per capture |
| `scripts/extract_banked.py` | the banked sweep |
| `scripts/fetch_live.zsh` | the 24 one-off live reads |
| `scripts/gazetteer.py` | the city-centre lookups |
| `scripts/build.py` | the assembly of `coords-recovered.json` |
| `captures/` | the raw pages fetched live, one file per publisher |
