# FIT-INDEX ROUND 3B: the diff against the 12:34 cut

One page. `FIT-INDEX-ROUND3.md` (154 entries, 12:34) stands unedited beside
`FIT-INDEX-ROUND3B.md` (162 entries, this cut). Same schema, same generator, same wording rules:
`entries_refresh.py` is a new entry table and `build.py` / `build_md.py` are the originals with the
output name changed and the new table appended to the load order. No existing entry changed a byte.

## What was folded

| Wave | Its report | Effect on the register |
|---|---|---|
| o1m-28 pakistan | 25 cities, 9,120 chart-days, 63,227 cells | one entry subsuming round two's four single-city charts; the "charts blocked" reading superseded |
| o1m-30 maghreb | Algeria 1448, Tunisia's normalisation, Morocco and Libya negatives | three entries and two rows with no entry |
| o1m-31 indonesia | its own words: incremental, harvest in progress | no entry; the object is already carried, R79 records the addition |
| o1m-32 caappeal | Kyrgyzstan 115 settlements; Tatarstan, Tajikistan, Uzbekistan, Bashkortostan measured | one entry and three rows with no entry |
| o1m-35 lupt | the +2 asr break at 2027-01-01 | one entry |
| o1m-43 luptyears | the fifty-year block, 18,263 days | one entry |
| o1m-29 kaznational | a PENDING skeleton; its fits landed after the report | no entry; stays in flight with what is on disk |
| o1m-26, o1m-27 | already in the 12:34 cut | nothing |
| o1m-37, o1m-42 | a decisions sheet and a corrections register, neither measuring | no entry; R76 and R77 map them |

One country the 12:34 cut missed, from a wave that returned before it: **Aruba**, named as B3 in the
corrections register and absent from the index. It is folded here as AW-ORANJESTAD-SAVANETA.

## Entries added (8)

| Id | Country | Tier | Grade | Span verdict | Basis |
|---|---|---|---|---|---|
| PK-CHART-25-CITIES | Pakistan | community | provisional | untestable-single-template | 25 city charts decoded by cluster labelling from the chart's own day column; 18.0/18.0 Hanafi, three margin sets, no cell beyond 4 min in 63,227 |
| DZ-MARW-1448-ALGER | Algeria | authority | A | frozen-recomputed | the 1448 book: 219 verified days over eight months, 219/219 within-1 on all six, a second recomputed Hijri year |
| TN-INM-NORM2026 | Tunisia | authority | provisional | no | 1,102 rows on 36 dates; 20 of 22 Kairouan/Sidi Bouzid delegations normalise to exactly 18.00/18.00, permanent from between 2025-12-16 and 2026-01-10 |
| ZZ-MAGHREB-CROSSCHECK | four countries | measured | measured | untestable-short-sample | four national lines against four platform families: none reproduces one at zero margins |
| KG-115-SETTLEMENTS | Kyrgyzstan | authority | provisional | frozen-reprint | the whole published set, 41,975 rows, one recipe; the endpoint is year-blind |
| GB-LUPT-ASR-BREAK-2027 | United Kingdom | authority | provisional | no | asr +0 through 2026-12-31 and +2 from 2027-01-01, both mithls, stated by the publisher |
| GB-LUPT-BLOCK-2076 | United Kingdom | authority | A | frozen-recomputed | 18,263 days, asr exact on 18,263 of 18,263 both columns, one generation recomputed per year |
| AW-ORANJESTAD-SAVANETA | Aruba | community | provisional | untestable-single-year | 365 rows at 14.8/14.8 Shafi, all six within-1 |

## Counts changed

| Measure | 12:34 cut | This cut | Delta |
|---|---:|---:|---:|
| Entries | 154 | 162 | +8 |
| Countries and territories | 87 | 89 | +2 |
| Multi-country families (ZZ) | 15 | 16 | +1 |
| Grade A | 31 | 33 | +2 |
| Grade provisional | 85 | 90 | +5 |
| Grade candidate | 25 | 25 | 0 |
| Grade community | 11 | 11 | 0 |
| Grade measured | 2 | 3 | +1 |
| Entries with a conflict note | 82 | 90 | +8 |
| Entries with a flag | 11 | 14 | +3 |
| Span yes | 33 | 33 | 0 |
| Span no | 7 | 9 | +2 |
| Span frozen-recomputed | 0 | 2 | +2 |
| Span frozen-reprint | 5 | 6 | +1 |
| Span untestable-single-year | 80 | 81 | +1 |
| Span untestable-single-template | 8 | 9 | +1 |
| Span untestable-short-sample | 21 | 22 | +1 |
| Reconciliation rows | 59 | 81 | +22 |
| Flag rows | 15 | 23 | +8 |
| Conflict rows | 40 | 49 | +9 |

## Movements added

Twenty-two reconciliation rows, R60 to R81. The load-bearing ones:

- **Pakistan leaves the blocked list.** The charts are readable, the federal dhuhr clock is 0 of 365 in
  all 26, the four "absent" cities exist, and the family's 18/18 Hanafi pair corroborates tawkit's
  453-city line rather than conflicting with it.
- **Algeria gains a second recomputed Hijri year** and the isha 17.00/0 ceil is confirmed on it.
- **Tunisia's span verdict moves yes to no**: the parameter change is an angle normalisation, permanent,
  with the horizon untouched; 2027 is closed.
- **Kyrgyzstan widens from 20 cities to 115** on one recipe, with two new publisher constants named.
- **The LUPT seam is dated**, and the fifty-year block behind it is one of the round's two
  `frozen-recomputed` grades and the only one spanning fifty years.
- **No entry changes grade except by addition.** One prior reading is corrected where the later
  measurement governs: O1m-35's "the same-MM-DD values repeat year for year".

Two stale rows are marked superseded rather than deleted: R17 (Pakistan blocked) by R60, and R54
(the Maghreb wave has not returned) by R63 to R68. The PK-TAWKIT-453 conflict row now reads as
corroboration. The "Not fitted" list loses Rawalpindi and Faisalabad and gains Quetta, Mardan,
Peshawar, Swat, Morocco's December and 2027, Algeria's four lost months, Libya's year-2,
Uzbekistan's second year, Bashkortostan before 2025 and Tatarstan before 2025.

## Flags and conflicts added

Flags, eight rows: Morocco's span evidence; Oman's rule against point; Qatar's exactness climb;
Bahrain's regime date (2021-08-05 against the index's 2021-08-09); Pakistan's Hyderabad; Pakistan's
Quetta panels; Sri Lanka's Mannar; and the LUPT block's three tie cells, which set an exact-match
ceiling of 127,838 of 127,841 for any reimplementation.

Conflicts, nine rows: Karachi's two tables; the chart family against tawkit (corroboration); Sialkot's
quarter medians; Algeria's two isha descriptions; Tunisia's dip against its angle; Kyrgyzstan's asr at
52-63 pc against 100 pc; the baked LUPT artifact's two generations; the LUPT block's reprint reading
against its recomputation; and the Maghreb cross-check's four families against four national lines.

## In flight, rewritten

The eight in-flight rows of the 12:34 cut named five waves that have since returned a report
(28, 30, 31, 32, 35) and one whose report is still a skeleton. The re-cut lists only what is still
open: o1m-29 (PENDING report, fits on disk, 2,002 of 5,676 coordinates captured), o1m-31 (report
present and incremental), o1m-39, o1m-40, o1m-41, o1m-44, o1m-45, and the two empty support
directories. Each row now states what the next cut can enter in one step.
