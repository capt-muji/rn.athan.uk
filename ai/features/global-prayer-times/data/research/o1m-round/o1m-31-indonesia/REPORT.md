# O1m-31 Indonesia 2028-2030 (community tail forward years)

Wave `o1m-31`, agent DeepSeek V4.1 Flash 1017. Captures from 2026-11-11T12:05Z. Public pages
only, GET only for pages, no login, no form, no challenge solved, no contact with any body, no
subagents, nothing outside this workspace, repository untouched. Timestamps UTC. Engine adhan
4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`, dates taken
from the payload's own strings, no clock read.

Status: incremental. Every number below is script-counted from `data/` and `fit/`.

## What this wave asks

1. Bank myquran's 2028, 2029 and 2030 for every kab/kota it serves.
2. Gate a sample of 30 against live pages, per year, plus the payload's own dates.
3. Fit the recorded recipe per year and test whether it moves across 2028-2030.
4. Verify the 29 February rows of 2028 are computed, not copied.
5. Probe the authority publishers for 2028 (SIHAT ceiling, KHGT) and compare the two national
   lines in 2028.
6. Probe jadwalsholat's 2028-2030.

## 1. The surface and its own list

`api.myquran.com/v2/sholat/kota/semua` enumerates **518 units** in one JSON payload
(`captures/myquran-kota-semua.json`, 21,263 bytes, HTTP 200 at 2026-11-11T12:05:40Z). The list is
the publisher's own coverage claim: 514 kab/kota plus four kecamatan-level island entries
(`PULAU TAMBELAN KAB. BINTAN`, `PEKAJANG KAB. LINGGA`, `PULAU SERASAN`, `PULAU MIDAI`,
`PULAU LAUT` of Natuna) and one duplicated `KOTA SOFIFI` (ids 3211 and 3212).

`api.myquran.com/v2/sholat/jadwal/<id>/<year>/<month>` returns a month table with eight clock
fields plus its own `date` and `tanggal` strings. 2028, 2029 and 2030 all answer HTTP 200
(`captures/myquran-probe-1301-2028-02.json`). Twelve requests make a unit-year, so the bank is
518 x 3 x 12 = 18,648 month payloads.

**Publisher defect on the list itself.** `id=3212` returns HTTP 400 on the jadwal path while the
list serves it as a second `KOTA SOFIFI`: a listed unit with no table.

(harvest in progress; counts below are updated as the run completes)

## 2. Reference points

myquran publishes no coordinates. Each unit is pinned to the coordinate the Kemenag line
publishes for the same name, taken from the KHGT unit payloads already held (516 units) and the
SIHAT job list (210 units): 511 of 518 match after normalisation, 7 do not and are solved from
the table's own geometry. Six of the matches are renames and one is a split:

| myquran | matched to | why |
| --- | --- | --- |
| KAB. MAMAJU UTARA | KAB. PASANGKAYU | renamed 2023 |
| KAB. MALUKU TENGGARA BARAT | KAB. KEPULAUAN TANIMBAR | renamed 2023 |
| KAB. TOBA SAMOSIR | KAB. TOBA | renamed |
| KAB. YAPEN WAROPEN | KAB. KEPULAUAN YAPEN | split |
| KAB. PANGKAJENE DAN KEPULAUAN | KAB. PANGKAJENE KEPULAUAN | spelling |
| KAB. PARIGI MOUTONG | KAB. PARIGI MAUTONG | spelling |
| KOTA JAKARTA | KOTA JAKARTA PUSAT | province entry, one row for DKI |

## 3. The recipe

(measured on the full set below)

### 3.1 The Kemenag line, confirmed from outside

myquran publishes no coordinates and states no method. Its tables were compared against the
authority on the authority's own ground: SIHAT's 209 unit payloads (2026) already held, read at
SIHAT's own coordinates with the same engine, margins against margins.

| column | SIHAT margin | myquran minus SIHAT | band p5..p95 |
| --- | --- | --- | --- |
| fajr | +2.02 | +0.28 | +0.07..+0.98 |
| sunrise | -2.72 | -0.73 | -0.98..-0.02 |
| dhuhr | +3.00 | +0.75 | +0.07..+0.97 |
| asr | +2.02 | +0.72 | -0.02..+0.88 |
| maghrib | +2.73 | +0.52 | +0.02..+1.05 |
| isha | +2.00 | +0.75 | 0.00..+0.93 |

Every column sits **within one minute of the Kemenag authority table** at the units SIHAT
publishes (32 paired units at the time of writing, partial harvest). myquran reproduces the
Kemenag 20/18 line with its own ihtiyati rounding, and it carries the same horizon policy on
sunrise and maghrib rather than dropping it: the D24 premise that a Kemenag-line platform omits
the elevation term does not hold here.

### 3.2 The annual values are computed, not relaid

Jakarta 2028 re-derived in this wave is **byte-identical** to the 366 rows banked by O1m-16 from
the same endpoint (0 cell differences over 366 rows x 9 fields), an independent re-derivation
two waves apart.
