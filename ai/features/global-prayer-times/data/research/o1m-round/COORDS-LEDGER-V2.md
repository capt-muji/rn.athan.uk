# Coordinate ledger v2: every surface the round holds, and the round's gazetteers

Built 2026-11-11 from the o1l ledger (1,547 surfaces, carried unchanged) and the ten
point-bearing layers this round banked. One record per surface in `coords-ledger-v2.json`,
one record per gazetteer point in the same file, and the reading of both on this page.

The question is the o1l question, asked of a larger record: given a surface's dated rows,
what point on the earth do they describe, and how firmly does the record support it. A
surface either carries a point its publisher states, a reference point its publisher names
for a zone, a point recovered from its own solar columns, or no point with the reason
stated. Two evidence types the o1l method had no class for arrive with this round and are
named, not folded in: a point the wave geocoded from a place name, and a point that is a
grid node rather than a settlement.

## The four classes, and the fifth

| Class | Meaning | Records | Share |
| --- | --- | --- | --- |
| **PUBLISHED** | the publisher states the point of the surface's own location, or serves it as the table's own database | 9,583 | 40.1% |
| **DERIVED** | recovered from the surface's own columns, with its residual recorded | 13,705 | 57.4% |
| **ANCHOR** | a zone reference point the publisher names for a wider area | 154 | 0.6% |
| **LOOKUP** | a geocoded place name, new in v2, usable only when corroborated | 151 | 0.6% |
| **UNKNOWN** | no point, with the reason stated | 300 | 1.3% |

**15,175 of 23,893 surfaces (63.5%) carry a usable point.** The o1l spine alone is unchanged at 1,247 of 1,547 (80.6%): this round added records, it did not repair the old ones.

Three states hide inside those totals and are counted separately below: a DERIVED record
with a latitude and no longitude (8,405 records, all Diyanet tree cities), a LOOKUP record whose point no second witness corroborates (13 records), and a record whose point falls outside its own country envelope (30 records, flagged, never demoted).

**Why LOOKUP exists.** The o1l rule is that a point is never looked up from a gazetteer. That
rule is right for a table that names a mosque, because the name does not say which of two
hundred same-named villages the mosque is in. It is wrong for a table that names a settlement
as its own subject: turktakvim prints one table per settlement and nothing else. Folding those
points into DERIVED would claim a solar recovery that did not happen; folding them into
UNKNOWN would discard the settlement the publisher named. LOOKUP states the evidence and the
gate that makes it usable.

## What the round added, layer by layer

| Layer | Records | Usable | Class | Point comes from |
| --- | --- | --- | --- | --- |
| Diyanet tree cities (o1m-r7 / o1m-11) | 8,894 | 489 | derived | latitude from day length; longitude only where the noon curve was solved |
| tawkit city tables (o1m-3) | 8,708 | 8,708 | published | the publisher's own settlement database (GeoNames, credited on its page) |
| Latin America solved (o1m-22) | 4,075 | 4,075 | derived | solved per city from its own six columns |
| o1l spine | 1,547 | 1,247 | published/derived/anchor/unknown | the o1l ledger, carried unchanged |
| Saudi lattice (o1m-6, o1m-27) | 225 | 225 | published | the coordinate the endpoint computed at (request-carried) |
| turktakvim fitted cities (o1m-4) | 138 | 135 | lookup | the wave's geocode of the settlement the publisher prints |
| Small states and territories (o1m-45) | 111 | 111 | published | the publisher's own settlement point |
| Kazakhstan settlements (o1m-25) | 96 | 96 | published | the ministry gazetteer's own decimal string |
| Oman ministry areas (o1m-40) | 86 | 86 | derived | solved per area from its own rows; ministry gazetteer as witness |
| Lebanon al-Manar (o1m-24) | 7 | 0 | lookup | the wave's geocode of the city the PDF names |
| Yemen ministry feeds (o1m-6) | 6 | 3 | lookup | the wave's geocode of the governorate the selector names |

The largest layer is also the weakest and the reason is structural. **The Diyanet tree
prints no coordinates at all.** The tree carries an id, a Turkish name and an English name per
city, in `live_tree.json` and in every city page; a scan of the captured pages returns zero
coordinate tokens. Its 8,894 city tables are therefore placeable only by solving, and a day-length solve returns a latitude: 8,405 cities hold a latitude and no longitude. The 489 cities that do hold both are the ones where a second solve recovered the noon curve (East Asia, o1m-11).

## The gate

Carried from o1l unchanged: the solar core is checked against adhan 4.4.6 at a known point
before any surface is solved (Cairo, six dates across the year; sunrise and transit within
10.8 s, asr within 60.3 s). Two gates are new, and both exist because the new layers rest on
evidence the old ones did not.

**The corroboration gate, for LOOKUP.** A geocoded name is usable when one of two witnesses
agrees with it: a second publisher places the same name within 25 km, or the table's own
sunrise and transit reproduce at the point within 1 minute of median residual. The second
witness is a coordinate witness and it is sharp: one minute of transit is 0.25 degrees of
longitude, so a passing fit bounds the point to about 25 km at the equator. 151 LOOKUP records
carry the class; 138 pass.

**The envelope flag, for every record.** Every point is tested against its country's envelope
with two degrees of slack, the o1l rule. A failure sets `envelopeFail` and never demotes: the
flag catches three different things and the prose, not the class, separates them. 30 records carry it: publisher junk slugs on tawkit (a German slug at 1.5 E, an Indian slug at 175 E), offshore possessions the mainland envelope cannot hold (Galapagos, Fernando de Noronha), and two Tunisia solves that land in Chad. The last two are the solver's failures, not the publisher's, and the ledger's own point for those surfaces is PUBLISHED, so nothing depends on the failed solve.

## The cross-check

Where a surface's point is both published and solved, the two must agree. The o1l five
families are recomputed here from the same two artefacts (`data/published.json` and
`data/solved.json`), so the v2 page and the o1l page are the same measurement, and three new
families are added: Oman's ministry gazetteer against the point solved from each area's own
table, turktakvim's geocodes against tawkit's settlement points, and the two independent
solves of the same Diyanet tables.

| Family | Surfaces | Median (deg) | p90 (deg) | Worst (deg) | Within 1 deg | Median (km) |
| --- | --- | --- | --- | --- | --- | --- |
| Bosnia and the vaktija federation | 61 | 0.435 | 1.561 | 2.419 | 73.8% | - |
| Tunisia (INM delegation points) | 273 | 0.440 | 0.818 | 19.924 | 98.9% | - |
| Indonesia (Kemenag city register) | 38 | 0.440 | 0.454 | 1.275 | 94.7% | - |
| Oman (ministry mosque gazetteer vs solved point) | 86 | 0.043 | 0.311 | 1.291 | 98.8% | 4.84 |
| Thailand (CICOT printed reference points) | 154 | 0.164 | 0.179 | 2.998 | 98.7% | - |
| turktakvim geocodes vs tawkit settlement points | 52 | 0.009 | 0.161 | 1.194 | 98.1% | 0.96 |
| Diyanet East Asia, r7 latitude vs o1m-11 second solve | 489 | 0.040 | 0.120 | 0.200 | 100.0% | 4.45 |
| Egypt (ESA implied points, same method) | 78 | 0.038 | 0.065 | 0.101 | 100.0% | - |

**The two worst families are the two o1l families, and both fail for a reason that is not the
solver.** Bosnia and the vaktija federation carries a p90 of 1.56 degrees and only 73.8% of its
61 surfaces within one degree: the federation computes one table per zone at a named reference
point, so the published point and the point the rows imply are two different objects by
design. Trebinje and Bileca sit 2.1 to 2.4 degrees out, which is the zone machinery, not an
error. Tunisia carries a 19.9-degree worst row: two archived delegation surfaces solve into
Chad while the same delegation's other surface solves within 1 degree of the printed point,
so the failure is a broken solve on a table with no sunrise row, and the ledger's point for
both surfaces is PUBLISHED.

**The round's three new families land an order of magnitude tighter.** Oman: median 0.043
degrees over 86 areas, 98.8% within one, median 4.84 km from the ministry's own surveyed
mosques. The two Diyanet solves of one table agree to 0.04 degrees over 489 cities. turktakvim
against tawkit: 0.009 degrees median over 52 name-matched settlements. The conclusion the o1l
page could not draw is now drawable: the disagreement lives in the publisher's zone and
reference machinery, and the recovery method is not what moves the numbers.

## Per-country resolver inputs

The assignment rule is unchanged: a point-in-envelope test, a user coordinate inside a
country's envelope resolves to that country, two degrees of slack applied to a derived point.
Zones are the IANA zones the record carries. A country whose envelope is marked `points held`
had no o1l envelope; its box is the range of the points this round holds, padded one degree,
and it is an operating bound, not a border.

| Country | Records | PUB | DER | ANC | LOOK | UNK | Lat only | Usable | Share | Envelope (lat0 lat1 lon0 lon1) | Zones carried |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BR | 1,922 | 0 | 1,922 | 0 | 0 | 0 | 163 | 1,759 | 91.5% | -34.0 5.3 -74.0 -34.7 | America/Sao_Paulo<br>America/Manaus<br>America/Fortaleza<br>America/Belem |
| TR | 1,277 | 391 | 886 | 0 | 0 | 0 | 869 | 408 | 31.9% | 35.8 42.2 25.6 44.9 | Europe/Istanbul |
| DE | 1,255 | 8 | 1,247 | 0 | 0 | 0 | 1,241 | 14 | 1.1% | 47.2 55.1 5.8 15.1 | Europe/Berlin |
| RU | 1,122 | 860 | 241 | 0 | 0 | 21 | 241 | 860 | 76.6% | 41.1 82.0 19.6 180.0 | Europe/Moscow<br>Asia/Yekaterinburg<br>Asia/Novosibirsk<br>Asia/Krasnoyarsk<br>Asia/Irkutsk<br>Asia/Yakutsk<br>Asia/Vladivostok<br>Europe/Kaliningrad<br>Europe/Samara<br>Asia/Omsk<br>Asia/Magadan<br>Asia/Kamchatka |
| FR | 1,056 | 463 | 593 | 0 | 0 | 0 | 587 | 469 | 44.4% | 41.3 51.2 -5.2 9.6 | Europe/Paris |
| ES | 674 | 615 | 53 | 0 | 0 | 6 | 53 | 615 | 91.2% | 27.5 43.9 -18.3 4.6 | Europe/Madrid<br>Atlantic/Canary |
| ID | 651 | 560 | 88 | 0 | 0 | 3 | 0 | 648 | 99.5% | -11.1 6.1 95.0 141.1 | Asia/Jakarta<br>Asia/Makassar<br>Asia/Jayapura<br>Asia/Pontianak |
| US | 603 | 7 | 485 | 0 | 0 | 111 | 485 | 7 | 1.2% | 18.8 71.5 -179.2 -66.9 | America/New_York<br>America/Chicago<br>America/Denver<br>America/Los_Angeles<br>America/Phoenix<br>America/Anchorage<br>Pacific/Honolulu<br>America/Detroit<br>America/Indiana/Indianapolis |
| AR | 576 | 1 | 575 | 0 | 0 | 0 | 58 | 518 | 89.9% | -55.1 -21.7 -73.6 -53.6 | America/Argentina/Buenos_Aires |
| IN | 576 | 461 | 115 | 0 | 0 | 0 | 115 | 461 | 80.0% | 6.5 35.6 68.1 97.5 | Asia/Kolkata |
| VE | 573 | 0 | 573 | 0 | 0 | 0 | 30 | 543 | 94.8% | 0.6 12.3 -73.4 -59.7 | America/Caracas |
| TN | 534 | 493 | 38 | 0 | 2 | 1 | 8 | 525 | 98.3% | 30.2 37.6 7.4 11.7 | Africa/Tunis |
| KZ | 519 | 361 | 158 | 0 | 0 | 0 | 125 | 394 | 75.9% | 40.5 55.5 46.4 87.4 | Asia/Almaty<br>Asia/Aqtobe<br>Asia/Atyrau<br>Asia/Qyzylorda<br>Asia/Qostanay |
| AU | 502 | 275 | 216 | 0 | 0 | 11 | 216 | 275 | 54.8% | -44.0 -10.0 112.9 153.7 | Australia/Sydney<br>Australia/Melbourne<br>Australia/Brisbane<br>Australia/Adelaide<br>Australia/Perth<br>Australia/Darwin<br>Australia/Hobart |
| PK | 483 | 453 | 30 | 0 | 0 | 0 | 28 | 455 | 94.2% | 23.6 37.1 60.8 77.9 | Asia/Karachi |
| SA | 451 | 429 | 22 | 0 | 0 | 0 | 10 | 441 | 97.8% | 16.3 32.2 34.5 55.7 | Asia/Riyadh |
| PE | 386 | 0 | 386 | 0 | 0 | 0 | 20 | 366 | 94.8% | -18.4 0.0 -81.4 -68.6 | America/Lima |
| OC | 357 | 0 | 357 | 0 | 0 | 0 | 357 | 0 | 0.0% | not carried | not carried |
| GB | 349 | 101 | 238 | 0 | 0 | 10 | 159 | 180 | 51.6% | 49.8 61.0 -8.7 2.0 | Europe/London |
| YE | 326 | 313 | 7 | 0 | 6 | 0 | 6 | 317 | 97.2% | 12.1 19.0 42.5 54.6 | Asia/Aden |
| AF | 326 | 307 | 19 | 0 | 0 | 0 | 19 | 307 | 94.2% | 29.3 38.5 60.4 74.9 | Asia/Kabul |
| SY | 319 | 287 | 32 | 0 | 0 | 0 | 32 | 287 | 90.0% | 32.2 37.4 35.6 42.4 | Asia/Damascus |
| CO | 298 | 0 | 297 | 0 | 0 | 1 | 40 | 257 | 86.2% | -4.3 12.5 -79.1 -66.8 | America/Bogota |
| NL | 293 | 1 | 292 | 0 | 0 | 0 | 283 | 10 | 3.4% | 50.7 53.6 3.3 7.2 | Europe/Amsterdam |
| MA | 286 | 262 | 22 | 0 | 2 | 0 | 16 | 269 | 94.1% | 27.6 36.0 -13.3 -0.9 | Africa/Casablanca |
| NG | 271 | 202 | 60 | 0 | 4 | 5 | 28 | 238 | 87.8% | 4.2 13.9 2.6 14.7 | Africa/Lagos |
| CL | 262 | 0 | 242 | 0 | 0 | 20 | 24 | 218 | 83.2% | -56.0 -17.4 -76.0 -66.3 | America/Santiago<br>Pacific/Easter |
| EG | 260 | 149 | 109 | 0 | 2 | 0 | 23 | 237 | 91.2% | 21.9 31.8 24.6 36.9 | Africa/Cairo |
| MY | 246 | 179 | 67 | 0 | 0 | 0 | 31 | 215 | 87.4% | 0.8 7.4 99.6 119.3 | Asia/Kuala_Lumpur<br>Asia/Kuching |
| IR | 244 | 202 | 42 | 0 | 0 | 0 | 42 | 202 | 82.8% | 25.0 39.8 44.0 63.4 | Asia/Tehran |
| AT | 241 | 48 | 193 | 0 | 0 | 0 | 191 | 50 | 20.7% | 46.3 49.1 9.5 17.2 | Europe/Vienna |
| CN | 240 | 18 | 222 | 0 | 0 | 0 | 0 | 240 | 100.0% | 18.1 53.6 73.5 135.1 | Asia/Shanghai<br>Asia/Urumqi |
| TH | 235 | 56 | 25 | 154 | 0 | 0 | 16 | 219 | 93.2% | 5.5 20.6 97.2 105.7 | Asia/Bangkok |
| BE | 232 | 1 | 231 | 0 | 0 | 0 | 221 | 11 | 4.7% | 49.4 51.6 2.5 6.5 | Europe/Brussels |
| BO | 205 | 0 | 205 | 0 | 0 | 0 | 37 | 168 | 82.0% | -22.9 -9.6 -69.7 -57.4 | America/La_Paz |
| TZ | 204 | 185 | 14 | 0 | 3 | 2 | 11 | 190 | 93.1% | -11.8 -0.9 29.3 40.5 | Africa/Dar_es_Salaam |
| SE | 203 | 32 | 171 | 0 | 0 | 0 | 165 | 38 | 18.7% | 55.3 69.1 11.0 24.2 | Europe/Stockholm |
| OM | 193 | 91 | 102 | 0 | 0 | 0 | 6 | 187 | 96.9% | 16.6 26.4 52.0 59.9 | Asia/Muscat |
| IQ | 173 | 145 | 28 | 0 | 0 | 0 | 25 | 148 | 85.5% | 29.0 37.4 38.7 48.7 | Asia/Baghdad |
| IT | 152 | 2 | 150 | 0 | 0 | 0 | 144 | 8 | 5.3% | 35.4 47.1 6.6 18.6 | Europe/Rome |
| CH | 151 | 0 | 151 | 0 | 0 | 0 | 147 | 4 | 2.6% | 45.8 47.9 5.9 10.5 | Europe/Zurich |
| JP | 150 | 0 | 148 | 0 | 0 | 2 | 0 | 148 | 98.7% | 24.0 45.6 122.9 153.9 | Asia/Tokyo |
| JO | 147 | 142 | 4 | 0 | 0 | 1 | 4 | 142 | 96.6% | 29.1 33.4 34.9 39.4 | Asia/Amman |
| NO | 144 | 40 | 102 | 0 | 0 | 2 | 86 | 56 | 38.9% | 57.9 71.2 4.5 31.1 | Europe/Oslo |
| UZ | 141 | 86 | 52 | 0 | 0 | 3 | 50 | 88 | 62.4% | 37.1 45.6 55.9 73.2 | Asia/Tashkent<br>Asia/Samarkand |
| KG | 141 | 83 | 57 | 0 | 0 | 1 | 55 | 85 | 60.3% | 39.1 43.3 69.2 80.3 | Asia/Bishkek |
| PY | 138 | 0 | 138 | 0 | 0 | 0 | 6 | 132 | 95.7% | -27.7 -19.2 -62.7 -54.2 | America/Asuncion |
| CA | 111 | 1 | 81 | 0 | 0 | 29 | 80 | 2 | 1.8% | 41.6 83.2 -141.1 -52.6 | America/Toronto<br>America/Vancouver<br>America/Edmonton<br>America/Winnipeg<br>America/Halifax<br>America/St_Johns<br>America/Regina |
| BD | 109 | 104 | 4 | 0 | 0 | 1 | 4 | 104 | 95.4% | 20.5 26.7 88.0 92.7 | Asia/Dhaka |
| BA | 109 | 61 | 48 | 0 | 0 | 0 | 47 | 62 | 56.9% | 42.5 45.3 15.7 19.7 | Europe/Sarajevo |
| UA | 106 | 0 | 106 | 0 | 0 | 0 | 106 | 0 | 0.0% | 44.3 52.4 22.1 40.3 | Europe/Kyiv |
| EC | 105 | 0 | 105 | 0 | 0 | 0 | 23 | 82 | 78.1% | -5.1 1.5 -81.1 -75.1 | America/Guayaquil |
| LK | 99 | 89 | 9 | 0 | 0 | 1 | 7 | 91 | 91.9% | 5.8 9.9 79.5 81.9 | Asia/Colombo |
| ET | 96 | 81 | 12 | 0 | 3 | 0 | 12 | 84 | 87.5% | 3.3 14.9 32.9 48.1 | Africa/Addis_Ababa |
| MX | 95 | 0 | 95 | 0 | 0 | 0 | 95 | 0 | 0.0% | 14.5 32.8 -118.4 -86.7 | America/Mexico_City<br>America/Tijuana<br>America/Monterrey<br>America/Cancun |
| BF | 92 | 80 | 10 | 0 | 2 | 0 | 9 | 83 | 90.2% | 9.4 15.1 -5.6 2.4 | Africa/Ouagadougou |
| SD | 87 | 75 | 9 | 0 | 3 | 0 | 9 | 78 | 89.7% | 8.6 22.2 21.8 38.6 | Africa/Khartoum |
| DZ | 86 | 64 | 19 | 0 | 3 | 0 | 18 | 68 | 79.1% | 18.9 37.2 -8.7 12.0 | Africa/Algiers |
| CD | 86 | 65 | 16 | 0 | 5 | 0 | 16 | 70 | 81.4% | -13.5 5.4 12.1 31.3 | Africa/Kinshasa<br>Africa/Lubumbashi |
| DK | 85 | 1 | 84 | 0 | 0 | 0 | 83 | 2 | 2.4% | 54.5 57.8 8.0 15.3 | Europe/Copenhagen |
| LY | 77 | 64 | 11 | 0 | 2 | 0 | 11 | 66 | 85.7% | 19.5 33.2 9.3 25.2 | Africa/Tripoli |
| FI | 73 | 0 | 73 | 0 | 0 | 0 | 71 | 2 | 2.7% | 59.7 70.1 19.5 31.6 | Europe/Helsinki |
| SO | 72 | 56 | 14 | 0 | 2 | 0 | 9 | 63 | 87.5% | -1.7 12.0 40.9 51.5 | Africa/Mogadishu |
| SN | 71 | 53 | 7 | 0 | 5 | 6 | 6 | 59 | 83.1% | 12.2 16.7 -17.6 -11.3 | Africa/Dakar |
| CI | 68 | 56 | 5 | 0 | 2 | 5 | 5 | 58 | 85.3% | 4.3 10.8 -8.7 -2.4 | Africa/Abidjan |
| MN | 68 | 0 | 68 | 0 | 0 | 0 | 0 | 68 | 100.0% | 41.5 52.2 87.7 119.9 | Asia/Ulaanbaatar |
| KE | 64 | 51 | 9 | 0 | 4 | 0 | 6 | 58 | 90.6% | -4.8 5.1 33.9 41.9 | Africa/Nairobi |
| NE | 56 | 44 | 8 | 0 | 4 | 0 | 8 | 48 | 85.7% | 11.6 23.5 0.1 16.0 | Africa/Niamey |
| RO | 53 | 0 | 53 | 0 | 0 | 0 | 53 | 0 | 0.0% | 43.6 48.3 20.2 29.8 | Europe/Bucharest |
| BG | 52 | 0 | 52 | 0 | 0 | 0 | 49 | 3 | 5.8% | 41.2 44.3 22.3 28.7 | Europe/Sofia |
| UG | 48 | 37 | 9 | 0 | 2 | 0 | 6 | 42 | 87.5% | -1.6 4.3 29.5 35.1 | Africa/Kampala |
| UY | 48 | 0 | 48 | 0 | 0 | 0 | 15 | 33 | 68.8% | -35.0 -30.1 -58.5 -53.0 | America/Montevideo |
| AZ | 46 | 0 | 41 | 0 | 0 | 5 | 37 | 4 | 8.7% | 38.3 41.9 44.7 50.4 | Asia/Baku |
| GR | 46 | 0 | 45 | 0 | 0 | 1 | 44 | 1 | 2.2% | 34.7 41.8 19.3 29.7 | Europe/Athens |
| PL | 46 | 0 | 46 | 0 | 0 | 0 | 46 | 0 | 0.0% | 49.0 54.9 14.1 24.2 | Europe/Warsaw |
| KR | 44 | 1 | 43 | 0 | 0 | 0 | 0 | 44 | 100.0% | 33.0 38.7 124.5 132.0 | Asia/Seoul |
| AO | 42 | 26 | 12 | 0 | 4 | 0 | 11 | 31 | 73.8% | -18.1 -4.3 11.6 24.1 | Africa/Luanda |
| CZ | 41 | 0 | 41 | 0 | 0 | 0 | 41 | 0 | 0.0% | 48.5 51.1 12.0 18.9 | Europe/Prague |
| MR | 39 | 19 | 17 | 0 | 3 | 0 | 16 | 23 | 59.0% | 14.7 27.3 -17.1 -4.8 | Africa/Nouakchott |
| PH | 39 | 0 | 39 | 0 | 0 | 0 | 36 | 3 | 7.7% | 4.5 21.2 116.9 126.7 | Asia/Manila |
| GE | 38 | 0 | 38 | 0 | 0 | 0 | 36 | 2 | 5.3% | 41.0 43.6 40.0 46.8 | Asia/Tbilisi |
| ZA | 38 | 0 | 34 | 0 | 4 | 0 | 31 | 7 | 18.4% | -35.0 -22.1 16.4 33.0 | Africa/Johannesburg |
| PA | 38 | 26 | 12 | 0 | 0 | 0 | 12 | 26 | 68.4% | 7.2 9.7 -83.1 -77.1 | America/Panama |
| PT | 37 | 0 | 21 | 0 | 0 | 16 | 21 | 0 | 0.0% | 36.9 42.2 -9.6 -6.1 | Europe/Lisbon<br>Atlantic/Azores |
| PS | 37 | 25 | 12 | 0 | 0 | 0 | 12 | 25 | 67.6% | 31.2 32.6 34.2 35.6 | Asia/Gaza<br>Asia/Hebron |
| ME | 35 | 0 | 35 | 0 | 0 | 0 | 22 | 13 | 37.1% | 41.8 43.6 18.4 20.4 | Europe/Podgorica |
| BY | 35 | 0 | 35 | 0 | 0 | 0 | 34 | 1 | 2.9% | 51.2 56.2 23.1 32.8 | Europe/Minsk |
| MK | 35 | 0 | 35 | 0 | 0 | 0 | 35 | 0 | 0.0% | 40.8 42.4 20.4 23.1 | Europe/Skopje |
| NZ | 33 | 1 | 31 | 0 | 0 | 1 | 28 | 4 | 12.1% | -47.4 -34.4 166.3 178.6 | Pacific/Auckland |
| ML | 33 | 21 | 9 | 0 | 3 | 0 | 4 | 29 | 87.9% | 10.1 25.0 -12.3 4.3 | Africa/Bamako |
| HU | 33 | 0 | 33 | 0 | 0 | 0 | 33 | 0 | 0.0% | 45.7 48.6 16.1 22.9 | Europe/Budapest |
| TM | 33 | 0 | 33 | 0 | 0 | 0 | 33 | 0 | 0.0% | 35.1 42.9 52.4 66.7 | Asia/Ashgabat |
| RS | 31 | 0 | 31 | 0 | 0 | 0 | 30 | 1 | 3.2% | 42.2 46.2 18.8 23.1 | Europe/Belgrade |
| BJ | 24 | 0 | 22 | 0 | 2 | 0 | 14 | 10 | 41.7% | 6.1 12.5 0.7 3.9 | Africa/Porto-Novo |
| HR | 24 | 0 | 24 | 0 | 0 | 0 | 22 | 2 | 8.3% | 42.3 46.6 13.4 19.5 | Europe/Zagreb |
| VN | 23 | 0 | 23 | 0 | 0 | 0 | 22 | 1 | 4.3% | 8.1 23.4 102.1 109.5 | Asia/Ho_Chi_Minh |
| LT | 22 | 0 | 21 | 0 | 0 | 1 | 21 | 0 | 0.0% | 53.8 56.5 20.9 26.9 | Europe/Vilnius |
| AL | 21 | 1 | 20 | 0 | 0 | 0 | 20 | 1 | 4.8% | 39.6 42.7 19.2 21.1 | Europe/Tirane |
| AM | 21 | 18 | 3 | 0 | 0 | 0 | 3 | 18 | 85.7% | 38.8 41.3 43.4 46.6 | Asia/Yerevan |
| CY | 20 | 0 | 20 | 0 | 0 | 0 | 20 | 0 | 0.0% | 34.5 35.8 32.2 34.7 | Asia/Nicosia |
| SK | 20 | 0 | 20 | 0 | 0 | 0 | 20 | 0 | 0.0% | 47.7 49.6 16.8 22.6 | Europe/Bratislava |
| LU | 18 | 0 | 18 | 0 | 0 | 0 | 17 | 1 | 5.6% | 49.4 50.2 5.7 6.6 | Europe/Luxembourg |
| TD | 18 | 0 | 16 | 0 | 2 | 0 | 16 | 2 | 11.1% | 7.4 23.5 13.4 24.1 | Africa/Ndjamena |
| HN | 17 | 0 | 17 | 0 | 0 | 0 | 17 | 0 | 0.0% | 12.9 16.6 -89.4 -83.1 | America/Tegucigalpa |
| LB | 16 | 0 | 7 | 0 | 7 | 2 | 7 | 0 | 0.0% | 33.0 34.7 35.1 36.7 | Asia/Beirut |
| TW | 16 | 0 | 11 | 0 | 0 | 5 | 0 | 11 | 68.8% | 21.8 25.4 119.3 122.1 | Asia/Taipei |
| BS | 16 | 0 | 16 | 0 | 0 | 0 | 16 | 0 | 0.0% | not carried | not carried |
| GH | 15 | 0 | 11 | 0 | 4 | 0 | 9 | 6 | 40.0% | 4.7 11.2 -3.3 1.2 | Africa/Accra |
| AE | 15 | 8 | 6 | 0 | 0 | 1 | 6 | 8 | 53.3% | 22.6 26.1 51.5 56.4 | Asia/Dubai |
| SL | 15 | 0 | 11 | 0 | 4 | 0 | 10 | 5 | 33.3% | 6.9 10.0 -13.4 -10.2 | Africa/Freetown |
| BI | 15 | 6 | 6 | 0 | 3 | 0 | 6 | 9 | 60.0% | -4.5 -2.3 29.0 30.9 | Africa/Bujumbura |
| XK | 15 | 0 | 15 | 0 | 0 | 0 | 15 | 0 | 0.0% | not carried | not carried |
| DO | 15 | 0 | 15 | 0 | 0 | 0 | 15 | 0 | 0.0% | 17.5 20.0 -72.1 -68.3 | America/Santo_Domingo |
| NI | 15 | 0 | 15 | 0 | 0 | 0 | 15 | 0 | 0.0% | 10.7 15.1 -87.7 -83.1 | America/Managua |
| TJ | 14 | 10 | 1 | 0 | 0 | 3 | 0 | 11 | 78.6% | 36.6 41.1 67.3 75.2 | Asia/Dushanbe |
| MZ | 14 | 0 | 11 | 0 | 3 | 0 | 8 | 6 | 42.9% | -26.9 -10.4 30.2 41.0 | Africa/Maputo |
| RW | 14 | 11 | 2 | 0 | 1 | 0 | 2 | 12 | 85.7% | -2.9 -1.0 28.8 30.9 | Africa/Kigali |
| MM | 14 | 0 | 14 | 0 | 0 | 0 | 14 | 0 | 0.0% | 9.7 28.6 92.1 101.2 | Asia/Yangon |
| CU | 14 | 0 | 14 | 0 | 0 | 0 | 14 | 0 | 0.0% | 19.7 23.3 -85.1 -74.0 | America/Havana |
| CM | 13 | 0 | 9 | 0 | 4 | 0 | 8 | 5 | 38.5% | 1.6 13.1 8.4 16.2 | Africa/Douala |
| SI | 12 | 0 | 12 | 0 | 0 | 0 | 12 | 0 | 0.0% | 45.4 46.9 13.3 16.7 | Europe/Ljubljana |
| CF | 12 | 0 | 9 | 0 | 3 | 0 | 9 | 3 | 25.0% | 2.2 11.0 14.4 27.5 | Africa/Bangui |
| GT | 12 | 0 | 12 | 0 | 0 | 0 | 12 | 0 | 0.0% | 13.7 17.9 -92.3 -88.2 | America/Guatemala |
| ZM | 12 | 0 | 8 | 0 | 4 | 0 | 8 | 4 | 33.3% | -18.1 -8.2 21.9 33.7 | Africa/Lusaka |
| MV | 11 | 0 | 11 | 0 | 0 | 0 | 1 | 10 | 90.9% | -0.7 7.1 72.6 73.8 | Indian/Maldives |
| IE | 11 | 0 | 9 | 0 | 0 | 2 | 8 | 1 | 9.1% | 51.3 55.5 -10.6 -5.9 | Europe/Dublin |
| ZW | 11 | 0 | 7 | 0 | 4 | 0 | 5 | 6 | 54.5% | -22.5 -15.6 25.2 33.1 | Africa/Harare |
| FJ | 10 | 0 | 6 | 0 | 0 | 4 | 3 | 3 | 30.0% | -21.3 -12.2 176.8 180.0 | Pacific/Fiji |
| DJ | 10 | 0 | 10 | 0 | 0 | 0 | 4 | 6 | 60.0% | 10.9 12.8 41.7 43.5 | Africa/Djibouti |
| MG | 10 | 0 | 6 | 0 | 4 | 0 | 5 | 5 | 50.0% | -25.6 -11.9 43.2 50.5 | Indian/Antananarivo |
| EE | 10 | 0 | 10 | 0 | 0 | 0 | 10 | 0 | 0.0% | 57.5 59.7 21.7 28.3 | Europe/Tallinn |
| KN | 10 | 10 | 0 | 0 | 0 | 0 | 0 | 10 | 100.0% | 16.1 18.4 -63.8 -61.6 | not carried |
| TG | 9 | 0 | 5 | 0 | 3 | 1 | 3 | 4 | 44.4% | 6.0 11.2 -0.2 1.9 | Africa/Lome |
| KH | 9 | 0 | 9 | 0 | 0 | 0 | 8 | 1 | 11.1% | 10.3 14.7 102.3 107.7 | Asia/Phnom_Penh |
| LA | 9 | 0 | 9 | 0 | 0 | 0 | 7 | 2 | 22.2% | 13.9 22.5 100.0 107.7 | Asia/Vientiane |
| QA | 9 | 5 | 3 | 0 | 0 | 1 | 3 | 5 | 55.6% | 24.4 26.2 50.7 51.7 | Asia/Qatar |
| MW | 9 | 0 | 7 | 0 | 2 | 0 | 3 | 6 | 66.7% | -17.2 -9.3 32.6 35.9 | Africa/Blantyre |
| LV | 9 | 0 | 9 | 0 | 0 | 0 | 9 | 0 | 0.0% | 55.6 58.1 20.9 28.3 | Europe/Riga |
| SV | 9 | 0 | 9 | 0 | 0 | 0 | 9 | 0 | 0.0% | 13.1 14.5 -90.2 -87.6 | America/El_Salvador |
| PG | 9 | 0 | 9 | 0 | 0 | 0 | 9 | 0 | 0.0% | -10.8 -1.3 140.8 155.9 | Pacific/Port_Moresby |
| SM | 9 | 9 | 0 | 0 | 0 | 0 | 0 | 9 | 100.0% | 42.9 45.0 11.4 13.5 | not carried |
| KW | 8 | 1 | 5 | 0 | 0 | 2 | 4 | 2 | 25.0% | 28.5 30.1 46.5 48.5 | Asia/Kuwait |
| GN | 8 | 0 | 6 | 0 | 2 | 0 | 5 | 3 | 37.5% | 7.1 12.7 -15.1 -7.6 | Africa/Conakry |
| ST | 8 | 8 | 0 | 0 | 0 | 0 | 0 | 8 | 100.0% | -0.1 1.7 6.4 7.6 | Africa/Sao_Tome |
| TT | 7 | 0 | 3 | 0 | 0 | 4 | 3 | 0 | 0.0% | 10.0 11.4 -61.9 -60.5 | America/Port_of_Spain |
| HK | 7 | 0 | 5 | 0 | 0 | 2 | 0 | 5 | 71.4% | 22.1 22.6 113.8 114.5 | Asia/Hong_Kong |
| GA | 7 | 0 | 5 | 0 | 2 | 0 | 5 | 2 | 28.6% | -4.0 2.4 8.6 14.5 | Africa/Libreville |
| BW | 7 | 0 | 7 | 0 | 0 | 0 | 7 | 0 | 0.0% | -26.9 -17.7 19.9 29.4 | Africa/Gaborone |
| ER | 7 | 0 | 6 | 0 | 1 | 0 | 6 | 1 | 14.3% | 12.3 18.1 36.4 43.2 | Africa/Asmara |
| BZ | 7 | 0 | 7 | 0 | 0 | 0 | 7 | 0 | 0.0% | 15.8 18.5 -89.3 -87.7 | America/Belize |
| IL | 7 | 0 | 7 | 0 | 0 | 0 | 7 | 0 | 0.0% | 29.4 33.4 34.2 35.9 | Asia/Jerusalem |
| BH | 6 | 2 | 4 | 0 | 0 | 0 | 3 | 3 | 50.0% | 25.7 26.4 50.3 50.9 | Asia/Bahrain |
| LR | 6 | 0 | 3 | 0 | 3 | 0 | 2 | 4 | 66.7% | 4.3 8.6 -11.5 -7.4 | Africa/Monrovia |
| NA | 6 | 0 | 6 | 0 | 0 | 0 | 5 | 1 | 16.7% | -28.9 -16.9 11.7 25.3 | Africa/Windhoek |
| MD | 6 | 0 | 6 | 0 | 0 | 0 | 6 | 0 | 0.0% | 45.4 48.5 26.6 30.2 | Europe/Chisinau |
| HT | 6 | 0 | 6 | 0 | 0 | 0 | 6 | 0 | 0.0% | 18.0 20.1 -74.5 -71.6 | America/Port-au-Prince |
| CR | 6 | 0 | 6 | 0 | 0 | 0 | 6 | 0 | 0.0% | 8.0 11.3 -86.0 -82.5 | America/Costa_Rica |
| CG | 6 | 5 | 0 | 0 | 1 | 0 | 0 | 6 | 100.0% | -5.1 3.8 11.1 18.7 | Africa/Brazzaville |
| GW | 6 | 3 | 0 | 0 | 3 | 0 | 0 | 6 | 100.0% | 10.8 12.7 -16.8 -13.6 | Africa/Bissau |
| MP | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 6 | 100.0% | 13.2 16.2 144.2 146.8 | not carried |
| VC | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 6 | 100.0% | 12.0 14.3 -62.3 -60.2 | not carried |
| IS | 5 | 0 | 3 | 0 | 0 | 2 | 1 | 2 | 40.0% | 63.2 66.6 -24.6 -13.4 | Atlantic/Reykjavik |
| GQ | 5 | 0 | 2 | 0 | 3 | 0 | 2 | 3 | 60.0% | 0.9 3.8 8.4 11.4 | Africa/Malabo |
| PR | 5 | 0 | 5 | 0 | 0 | 0 | 5 | 0 | 0.0% | not carried | not carried |
| NP | 5 | 0 | 5 | 0 | 0 | 0 | 5 | 0 | 0.0% | 26.3 30.5 80.0 88.3 | Asia/Kathmandu |
| GM | 5 | 0 | 2 | 0 | 3 | 0 | 2 | 3 | 60.0% | 13.0 13.9 -17.0 -13.7 | Africa/Banjul |
| SS | 5 | 0 | 2 | 0 | 3 | 0 | 2 | 3 | 60.0% | 3.4 12.3 23.4 35.9 | Africa/Juba |
| KY | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 5 | 100.0% | 18.3 20.4 -82.4 -80.1 | not carried |
| JE | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 5 | 100.0% | 48.2 50.2 -3.2 -1.0 | not carried |
| MH | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 5 | 100.0% | 4.9 10.4 166.7 172.5 | not carried |
| NR | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 5 | 100.0% | -1.6 0.5 165.9 167.9 | not carried |
| SX | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 5 | 100.0% | 17.0 19.1 -64.1 -62.0 | not carried |
| SZ | 4 | 0 | 2 | 0 | 2 | 0 | 1 | 3 | 75.0% | -27.4 -25.7 30.7 32.2 | Africa/Mbabane |
| MU | 4 | 0 | 2 | 0 | 1 | 1 | 2 | 1 | 25.0% | -20.6 -19.9 57.3 57.9 | Indian/Mauritius |
| AW | 4 | 3 | 1 | 0 | 0 | 0 | 1 | 3 | 75.0% | 11.3 13.6 -71.0 -68.9 | not carried |
| MT | 4 | 0 | 4 | 0 | 0 | 0 | 4 | 0 | 0.0% | 35.7 36.1 14.1 14.6 | Europe/Malta |
| KM | 4 | 0 | 1 | 0 | 3 | 0 | 1 | 3 | 75.0% | -12.5 -11.3 43.2 44.6 | Indian/Comoro |
| JM | 4 | 0 | 4 | 0 | 0 | 0 | 4 | 0 | 0.0% | 17.7 18.6 -78.4 -76.1 | America/Jamaica |
| YT | 4 | 0 | 1 | 0 | 3 | 0 | 1 | 3 | 75.0% | -13.8 -11.7 44.1 46.3 | not carried |
| SH | 4 | 3 | 1 | 0 | 0 | 0 | 1 | 3 | 75.0% | -38.1 -6.9 -13.3 -4.7 | not carried |
| BL | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 4 | 100.0% | 16.9 18.9 -63.8 -61.8 | not carried |
| SR | 3 | 0 | 2 | 0 | 0 | 1 | 2 | 0 | 0.0% | 1.7 6.0 -58.1 -53.9 | America/Paramaribo |
| NC | 3 | 0 | 2 | 0 | 0 | 1 | 2 | 0 | 0.0% | not carried | not carried |
| AD | 3 | 2 | 1 | 0 | 0 | 0 | 1 | 2 | 66.7% | 41.5 43.5 0.5 2.5 | not carried |
| AG | 3 | 1 | 2 | 0 | 0 | 0 | 2 | 1 | 33.3% | 16.0 18.2 -62.8 -60.8 | not carried |
| LI | 3 | 0 | 3 | 0 | 0 | 0 | 3 | 0 | 0.0% | not carried | not carried |
| BM | 3 | 0 | 3 | 0 | 0 | 0 | 3 | 0 | 0.0% | not carried | not carried |
| GY | 3 | 0 | 3 | 0 | 0 | 0 | 3 | 0 | 0.0% | 1.1 8.6 -61.4 -56.4 | America/Guyana |
| SJ | 3 | 1 | 2 | 0 | 0 | 0 | 2 | 1 | 33.3% | 62.2 79.2 14.6 16.6 | not carried |
| BB | 3 | 0 | 3 | 0 | 0 | 0 | 3 | 0 | 0.0% | not carried | not carried |
| TK | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 3 | 100.0% | -10.4 -8.2 -172.8 -170.2 | not carried |
| TC | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 3 | 100.0% | 20.3 22.5 -72.2 -70.1 | not carried |
| ?? | 2 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0.0% | not carried | not carried |
| LS | 2 | 0 | 2 | 0 | 0 | 0 | 1 | 1 | 50.0% | -30.7 -28.5 27.0 29.5 | Africa/Maseru |
| SG | 2 | 0 | 2 | 0 | 0 | 0 | 1 | 1 | 50.0% | 1.1 1.5 103.6 104.1 | Asia/Singapore |
| AI | 2 | 1 | 1 | 0 | 0 | 0 | 1 | 1 | 50.0% | 17.2 19.3 -64.1 -62.1 | not carried |
| GD | 2 | 1 | 1 | 0 | 0 | 0 | 1 | 1 | 50.0% | 11.1 13.1 -63.4 -61.4 | not carried |
| BN | 2 | 0 | 2 | 0 | 0 | 0 | 2 | 0 | 0.0% | 4.0 5.1 114.0 115.4 | Asia/Brunei |
| SC | 2 | 0 | 1 | 0 | 1 | 0 | 1 | 1 | 50.0% | -5.0 -3.7 55.2 56.0 | Indian/Mahe |
| CV | 2 | 0 | 2 | 0 | 0 | 0 | 2 | 0 | 0.0% | 14.7 17.3 -25.5 -22.6 | Atlantic/Cape_Verde |
| MS | 2 | 0 | 2 | 0 | 0 | 0 | 2 | 0 | 0.0% | not carried | not carried |
| GP | 2 | 0 | 2 | 0 | 0 | 0 | 2 | 0 | 0.0% | not carried | not carried |
| BQ | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | 100.0% | 11.1 18.6 -69.3 -62.2 | not carried |
| FO | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | 100.0% | 61.0 63.2 -7.8 -5.6 | not carried |
| EH | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | 100.0% | 20.2 27.7 -14.1 -10.7 | not carried |
| AX | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 100.0% | 59.1 61.1 18.9 20.9 | not carried |
| AS | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 100.0% | -15.2 -13.2 -171.7 -169.7 | not carried |
| MC | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | 43.7 43.8 7.3 7.5 | Europe/Monaco |
| VA | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | 41.8 42.0 12.4 12.5 | Europe/Vatican |
| GL | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | not carried | not carried |
| VU | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | -20.3 -13.0 166.5 170.3 | Pacific/Efate |
| CW | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | not carried | not carried |
| FM | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | not carried | not carried |
| MQ | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | not carried | not carried |
| MO | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 100.0% | 21.3 23.3 112.4 114.4 | not carried |
| RE | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | not carried | not carried |
| DM | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | not carried | not carried |
| TO | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | -21.5 -18.5 -175.4 -173.6 | Pacific/Tongatapu |
| LC | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | 13.7 14.2 -61.1 -60.8 | America/St_Lucia |
| KP | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 100.0% | 37.6 43.0 124.2 130.7 | Asia/Pyongyang |
| PW | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | not carried | not carried |
| BT | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | not carried | not carried |
| GU | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | not carried | not carried |
| TL | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | -9.6 -8.1 124.0 127.4 | Asia/Dili |
| NU | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | not carried | not carried |
| PN | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | not carried | not carried |
| WS | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | -14.1 -13.4 -172.9 -171.3 | Pacific/Apia |
| IM | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0.0% | not carried | not carried |
| IO | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 100.0% | -8.3 -6.3 71.4 73.4 | not carried |
| VG | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 100.0% | 17.4 19.4 -65.6 -63.6 | not carried |
| CX | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 100.0% | -11.4 -9.4 104.7 106.7 | not carried |
| CK | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 100.0% | -22.2 -20.2 -160.8 -158.8 | not carried |
| FK | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 100.0% | -52.7 -50.7 -58.9 -56.9 | not carried |
| NF | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 100.0% | -30.0 -28.0 166.9 168.9 | not carried |
| GS | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 100.0% | -55.3 -53.3 -37.5 -35.5 | not carried |
| TV | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 100.0% | -9.5 -7.5 178.2 180.2 | not carried |
| WF | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 100.0% | -14.3 -12.3 -177.2 -175.2 | not carried |

## Countries the o1l table did not carry

The o1l envelope table held 103 countries. v2 holds 235, and the new ones are the round's small-state territory: Faroe, Svalbard, San Marino, Tuvalu, Nauru, Jersey, the Cook Islands, Western Sahara and their like, most of them one or two surfaces, all of them now placeable. Where no o1l envelope existed the box is the range of the points held padded one degree, marked `points held`: an operating bound for the resolver's point-in-envelope test, not a border, and wrong by the pad wherever a country is bigger than its published points.

| Country | Region | Records | Usable | Envelope | Basis |
| --- | --- | --- | --- | --- | --- |
| FO | EUROPE | 2 | 2 | 61.0 63.2 -7.8 -5.6 | points held, 1 deg pad |
| SJ | EUROPE | 3 | 1 | 62.2 79.2 14.6 16.6 | points held, 1 deg pad |
| GL | EUROPE | 1 | 0 | not carried | not carried |
| NI | AMERICAS | 15 | 0 | 10.7 15.1 -87.7 -83.1 | o1l country envelope |
| SR | AMERICAS | 3 | 0 | 1.7 6.0 -58.1 -53.9 | o1l country envelope |
| MN | SSEA | 68 | 68 | 41.5 52.2 87.7 119.9 | o1l country envelope |
| SM | EUROPE | 9 | 9 | 42.9 45.0 11.4 13.5 | points held, 1 deg pad |
| TV | OCEANIA | 1 | 1 | -9.5 -7.5 178.2 180.2 | points held, 1 deg pad |
| NR | OCEANIA | 5 | 5 | -1.6 0.5 165.9 167.9 | points held, 1 deg pad |
| AD | EUROPE | 3 | 2 | 41.5 43.5 0.5 2.5 | points held, 1 deg pad |
| XK | EUROPE | 15 | 0 | not carried | not carried |
| TL | SSEA | 1 | 0 | -9.6 -8.1 124.0 127.4 | o1l country envelope |

Two of those boxes are not usable and the table says so. Greenland and Kosovo hold Diyanet
city tables with a latitude and no longitude, so neither can carry an envelope at all: a
latitude band is not a country. Nicaragua and Suriname carry the o1l envelope and no usable
point: their Diyanet entries are latitude-only, and the round's own Managua and Paramaribo
surfaces are not yet transcribed into this ledger. That is the first item of `REPORT.md`'s
NEXT.

## Region verdict

| Region | Records | Usable | Share | PUBLISHED | DERIVED | ANCHOR | LOOKUP | UNKNOWN | Countries |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EUROPE | 6,916 | 2,427 | 35.1% | 2,254 | 4,601 | 0 | 0 | 61 | 52 |
| AMERICAS | 5,562 | 4,155 | 74.7% | 79 | 5,317 | 0 | 0 | 166 | 51 |
| SSEA | 4,565 | 3,840 | 84.1% | 2,988 | 1,397 | 154 | 0 | 26 | 36 |
| MENA | 4,536 | 3,395 | 74.8% | 3,102 | 1,388 | 0 | 38 | 8 | 25 |
| AFRICA | 1,365 | 1,051 | 77.0% | 859 | 373 | 0 | 113 | 20 | 48 |
| OCEANIA | 590 | 307 | 52.0% | 301 | 272 | 0 | 0 | 17 | 23 |
| ocean | 357 | 0 | 0.0% | 0 | 357 | 0 | 0 | 0 | 1 |
| unassigned | 2 | 0 | 0.0% | 0 | 0 | 0 | 0 | 2 | 1 |

The Americas is the region the round changed. Its o1l record was 1 usable surface in 167,
all of it zone-degenerate platform tables. v2 holds 5,562 surfaces at 74.7% usable: the round did not repair those 166 records, it added a different surface layer in the same countries, one named city per table with a point solved from the table itself. A resident of Chicago is still not placed by the o1l Masjidal table; a resident of a named Brazilian, Peruvian or Venezuelan city is placed by the o1m layer.

## The ten widest gaps

Two lists, because the round created a second failure mode that the o1l list would hide.

**Surfaces with no point at all.**

| Country | No point | Records | Usable |
| --- | --- | --- | --- |
| US | 111 | 603 | 7 |
| CA | 29 | 111 | 2 |
| RU | 21 | 1122 | 860 |
| CL | 20 | 262 | 218 |
| PT | 16 | 37 | 0 |
| AU | 11 | 502 | 275 |
| GB | 10 | 349 | 180 |
| SN | 6 | 71 | 59 |
| ES | 6 | 674 | 615 |
| NG | 5 | 271 | 238 |

**Surfaces with a latitude and no longitude.** The Diyanet day-length solve, country by
country. This is the round's largest single limitation.

| Country | Latitude only | Records | Usable |
| --- | --- | --- | --- |
| DE | 1,241 | 1,255 | 14 |
| TR | 869 | 1,277 | 408 |
| FR | 587 | 1,056 | 469 |
| US | 485 | 603 | 7 |
| OC | 357 | 357 | 0 |
| NL | 283 | 293 | 10 |
| RU | 241 | 1,122 | 860 |
| BE | 221 | 232 | 11 |
| AU | 216 | 502 | 275 |
| AT | 191 | 241 | 50 |

Germany, Turkey, France and the United States lead the second list because the Diyanet tree
is densest there: 1,255 German city tables, 1,241 of them latitude-only. The first list is
now short and its mechanism is unchanged: a table with one solar column, or a clock the record
does not name.

## The gazetteer point layer

9,579 points carry a coordinate but no dated table of their own. They are the resolver's candidates, not its proofs.

| Gazetteer | Points | Level | Class | Source |
| --- | --- | --- | --- | --- |
| Oman ministry mosque workbook | 3,885 | 63 wilayats<br>3,822 villages | PUBLISHED | 18,191 mosque rows with coordinates, median per settlement; 18,214 rows in the workbook, 3 carrying NULL |
| Kazakhstan muftyat gazetteer | 5,694 | settlements | PUBLISHED | api.muftyat.kz/cities, 57 pages, 18 regions |

The Oman workbook's own defects are worth carrying because they set the layer's accuracy:
9 rows write the pair the wrong way round, which puts them outside the country, and 3 carry
NULL. The wilayat point is a median of surveyed mosques, not a boundary, so it sits 4.8 km
from the town the ministry computes at on median and 0.98 km from the nearest surveyed mosque.

## Does the round move the Americas' one per cent

Yes, and by adding surfaces rather than by repairing the old ones. The o1l Americas record is
unchanged: 167 surfaces, 1 usable. The v2 Americas record is %s surfaces at %s, carried by the Latin American solve (%s cities) and by tawkit's American settlement points. What the round still cannot do is place an anonymous Masjidal or masjidbox table in the United States, and
485 of the 603 US records are Diyanet city tables with a latitude and no longitude. The
American gap is now two specific holes, not a continental one: anonymous platform tables, and
the Diyanet longitude.

## What this ledger cannot do

- **It cannot place a table that prints one solar column.** Unchanged from o1l: seventeen
  surfaces, and the number has not moved because the defect is in the publication, not the
  record.
- **It cannot place a table whose clock is a civil zone the record does not name.** The
  zone-degenerate class, 196 o1l surfaces, every one in a multi-zone country. The round
  them. The round added named surfaces in the same countries (tawkit's seven United States
  cities among them), which is coverage beside the defect, not a solve of it.
- **It cannot separate a printed dhuhr margin from a longitude shift.** Where the horizon pair
  exists the ledger uses it; where it does not, the point carries margin/4 degrees of bias and
  the record says so.
- **It cannot see a table that is not solar at all but is smooth.** The LUPT family is printed
  from interval tables; the April 2027 block solves to 55.0 N, 1.2 W at sigma 0.14 degrees,
  precise and 3.5 degrees wrong.
- **New: it cannot recover a longitude from a day-length solve.** 8,405 Diyanet city tables
  hold a latitude and no longitude. A day-length curve fixes the latitude; the longitude needs
  the noon curve or a known dhuhr margin, and Diyanet prints neither. The bound is 0.25
  degrees per minute of unknown margin, which is 28 km at the equator, so the record refuses
  the point rather than pick a zone band.
- **New: it cannot turn a grid node into a place.** The 225 Saudi records are coordinates the
  endpoint computed at. They prove a recipe; they do not say a settlement exists there. The
  same is true of the 357 Diyanet "Atlantic Ocean" entries, an ocean grid at half-degree
  spacing that the publisher calls cities.
- **New: it cannot make a gazetteer point a surface.** 9,579 points carry coordinates with no
  dated table behind them. They are the resolver's candidates and they are why a country can
  now carry an envelope before it carries a table.
- **New: it cannot corroborate a geocode from one source.** The seven Lebanon al-Manar cities
  and three of the six Yemen governorates hold LOOKUP points with no second publisher. They
  are recorded, marked, and refused as usable.
- It still does not name a country for two surfaces whose file names resolve to no country on
  record. They are UNKNOWN, not guessed.

## Files

| File | Content |
| --- | --- |
| `coords-ledger-v2.json` | one record per surface and per gazetteer point: id, country, point, class, tier, citation, timezone, residual |
| `data/by-country.json` | the per-country roll-up behind the table above |
| `data/crosscheck.json` | the eight families, computed from the artefacts |
| `data/o1l-bbox.json` | the o1l country envelopes and zones, exported once |
| `build/sources.py` | one loader per layer: what each wave banked, transcribed |
| `build/assemble.py` | class, gate, corroboration, envelope, roll-up |
| `build/gen_md.py` | this page, generated so no figure is hand-copied |

Run order: `build/assemble.py`, `build/gen_md.py`.
