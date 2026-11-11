# Coordinate ledger: one point per surface

Built 2026-11-11 from the census index and the archive behind it. Scope: every surface the
census index holds, 1547 of them across 103 countries and territories. One record
per surface in `coords-ledger.json`; this page is the reading of it.

The question it answers: given a surface's dated rows, what point on the earth do they describe,
and how firmly does the record support that point. Nothing here is looked up from a gazetteer,
guessed from a city name, or copied from a neighbour. A surface either carries a point its
publisher states, a reference point its publisher names for a zone, a point recovered from its
own solar columns, or no point at all with the reason stated.

## The four classes

| Class | Meaning | Count | Share |
| --- | --- | --- | --- |
| **PUBLISHED** | the publisher states the point of the surface's own location, carried verbatim with its citation | 443 | 28.6% |
| **DERIVED** | recovered from the surface's own sunrise, transit and asr columns by `derive/solve.mjs`, with its residual recorded | 650 | 42.0% |
| **ANCHOR** | a zone reference point the publisher names, where the table is computed at that point for a wider area | 154 | 10.0% |
| **UNKNOWN** | no point, with the reason stated in the record | 300 | 19.4% |

**1247 of 1547 surfaces (80.6%) carry a usable point.**

## Method

Longitude comes from the table's own transit or horizon columns; latitude from the seasonal
shape of its sunrise and asr columns; a joint refinement settles both. The transit column is
used only where no other pair of columns can pin the longitude, because a printed dhuhr margin
is indistinguishable from a longitude shift and biases the point by margin/4 degrees.

Two rules keep the class honest. A surface whose rows do not move with the sun (a fixed table, a
partly fixed table) yields no point. A surface whose table reproduces at longitudes a whole
civil-zone step apart, with no point named by the record, yields its latitude only: the record
cannot say which zone band the mosque is in, and the ledger does not pick one.

### The gate

The solar core is checked against adhan 4.4.6 at a known point before any surface is solved
(`derive/validate.mjs`, Cairo, six dates across the year): sunrise within 10.8 s, transit
within 10.8 s, asr within 60.3 s. The asr gap is a model difference between two formulations
of the afternoon shadow, not a solver error, and it is why asr carries the lowest weight in the
fit.

### The cross-check

Where the record already names a point and the solver recovers one from the same table, the two
must agree. That is the only test that licenses the DERIVED class elsewhere.

| Family | Surfaces | Median disagreement | Within 0.5 deg | Within 1 deg |
| --- | --- | --- | --- | --- |
| Egypt (ESA implied points, same method) | 78 | 0.04 deg | 100% | 100% |
| Thailand (CICOT printed reference points) | 154 | 0.16 deg | 99% | 99% |
| Indonesia (Kemenag city register) | 38 | 0.44 deg | 95% | 95% |
| Bosnia and the vaktija federation | 61 | 0.43 deg | 64% | 74% |
| Tunisia (INM delegation points) | 273 | 0.54 deg | 38% | 90% |

Tunisia is the weakest family and the reason is understood: its tables print no sunrise row, so
the point rests on asr alone, and its printed dhuhr carries a margin. The record's own points
are PUBLISHED for Tunisia, so nothing in the ledger depends on that recovery.

Two publisher defects fall out of the same comparison. The CICOT workbook for Nan prints a
longitude 3.17 degrees from the point its own rows imply, the typo the Thailand job already
recorded; the solver reproduces the rows, not the typo. Bosnia's Trebinje and Bileca sit 2.1 to
2.4 degrees from the federation's own register point, which is the zone-reference machinery, not
a solver error.

## Per-country resolver inputs

The assignment rule is a point-in-envelope test: a user coordinate inside a country's envelope
resolves to that country. The envelope below is deliberately generous (two degrees of slack is
applied when a derived point is tested against it). Zones are the IANA zones the solver tried;
where a country carries more than one, the surface's own record decides which one it is, and a
surface that cannot decide is UNKNOWN rather than guessed.

| Country | Surfaces | PUBLISHED | DERIVED | ANCHOR | UNKNOWN | Usable | Envelope (lat0 lat1 lon0 lon1) | Zones carried |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TN | 370 | 339 | 30 | 0 | 1 | 369 | 30.2 37.6 7.4 11.7 | Africa/Tunis |
| TH | 163 | 0 | 9 | 154 | 0 | 163 | 5.5 20.6 97.2 105.7 | Asia/Bangkok |
| ID | 134 | 43 | 88 | 0 | 3 | 131 | -11.1 6.1 95.0 141.1 | Asia/Jakarta<br>Asia/Makassar<br>Asia/Jayapura<br>Asia/Pontianak |
| US | 111 | 0 | 0 | 0 | 111 | 0 | 18.8 71.5 -179.2 -66.9 | America/New_York<br>America/Chicago<br>America/Denver<br>America/Los_Angeles<br>America/Phoenix<br>America/Anchorage<br>Pacific/Honolulu<br>America/Detroit<br>America/Indiana/Indianapolis |
| GB | 89 | 0 | 79 | 0 | 10 | 79 | 49.8 61.0 -8.7 2.0 | Europe/London |
| EG | 86 | 0 | 86 | 0 | 0 | 86 | 21.9 31.8 24.6 36.9 | Africa/Cairo |
| BA | 62 | 61 | 1 | 0 | 0 | 62 | 42.5 45.3 15.7 19.7 | Europe/Sarajevo |
| NG | 37 | 0 | 32 | 0 | 5 | 32 | 4.2 13.9 2.6 14.7 | Africa/Lagos |
| MY | 36 | 0 | 36 | 0 | 0 | 36 | 0.8 7.4 99.6 119.3 | Asia/Kuala_Lumpur<br>Asia/Kuching |
| KZ | 33 | 0 | 33 | 0 | 0 | 33 | 40.5 55.5 46.4 87.4 | Asia/Almaty<br>Asia/Aqtobe<br>Asia/Atyrau<br>Asia/Qyzylorda<br>Asia/Qostanay |
| CA | 30 | 0 | 1 | 0 | 29 | 1 | 41.6 83.2 -141.1 -52.6 | America/Toronto<br>America/Vancouver<br>America/Edmonton<br>America/Winnipeg<br>America/Halifax<br>America/St_Johns<br>America/Regina |
| RU | 21 | 0 | 0 | 0 | 21 | 0 | 41.1 82.0 19.6 180.0 | Europe/Moscow<br>Asia/Yekaterinburg<br>Asia/Novosibirsk<br>Asia/Krasnoyarsk<br>Asia/Irkutsk<br>Asia/Yakutsk<br>Asia/Vladivostok<br>Europe/Kaliningrad<br>Europe/Samara<br>Asia/Omsk<br>Asia/Magadan<br>Asia/Kamchatka |
| CL | 20 | 0 | 0 | 0 | 20 | 0 | -56.0 -17.4 -76.0 -66.3 | America/Santiago<br>Pacific/Easter |
| NO | 18 | 0 | 16 | 0 | 2 | 16 | 57.9 71.2 4.5 31.1 | Europe/Oslo |
| TR | 17 | 0 | 17 | 0 | 0 | 17 | 35.8 42.2 25.6 44.9 | Europe/Istanbul |
| PT | 16 | 0 | 0 | 0 | 16 | 0 | 36.9 42.2 -9.6 -6.1 | Europe/Lisbon<br>Atlantic/Azores |
| ME | 13 | 0 | 13 | 0 | 0 | 13 | 41.8 43.6 18.4 20.4 | Europe/Podgorica |
| SA | 12 | 0 | 12 | 0 | 0 | 12 | 16.3 32.2 34.5 55.7 | Asia/Riyadh |
| AU | 11 | 0 | 0 | 0 | 11 | 0 | -44.0 -10.0 112.9 153.7 | Australia/Sydney<br>Australia/Melbourne<br>Australia/Brisbane<br>Australia/Adelaide<br>Australia/Perth<br>Australia/Darwin<br>Australia/Hobart |
| MV | 10 | 0 | 10 | 0 | 0 | 10 | -0.7 7.1 72.6 73.8 | Indian/Maldives |
| BE | 10 | 0 | 10 | 0 | 0 | 10 | 49.4 51.6 2.5 6.5 | Europe/Brussels |
| OM | 10 | 0 | 10 | 0 | 0 | 10 | 16.6 26.4 52.0 59.9 | Asia/Muscat |
| AZ | 9 | 0 | 4 | 0 | 5 | 4 | 38.3 41.9 44.7 50.4 | Asia/Baku |
| NL | 9 | 0 | 9 | 0 | 0 | 9 | 50.7 53.6 3.3 7.2 | Europe/Amsterdam |
| BJ | 8 | 0 | 8 | 0 | 0 | 8 | 6.1 12.5 0.7 3.9 | Africa/Porto-Novo |
| SN | 7 | 0 | 1 | 0 | 6 | 1 | 12.2 16.7 -17.6 -11.3 | Africa/Dakar |
| JP | 7 | 0 | 5 | 0 | 2 | 5 | 24.0 45.6 122.9 153.9 | Asia/Tokyo |
| FJ | 7 | 0 | 3 | 0 | 4 | 3 | -21.3 -12.2 176.8 180.0 | Pacific/Fiji |
| ES | 6 | 0 | 0 | 0 | 6 | 0 | 27.5 43.9 -18.3 4.6 | Europe/Madrid<br>Atlantic/Canary |
| FR | 6 | 0 | 6 | 0 | 0 | 6 | 41.3 51.2 -5.2 9.6 | Europe/Paris |
| IT | 6 | 0 | 6 | 0 | 0 | 6 | 35.4 47.1 6.6 18.6 | Europe/Rome |
| TW | 6 | 0 | 1 | 0 | 5 | 1 | 21.8 25.4 119.3 122.1 | Asia/Taipei |
| DE | 6 | 0 | 6 | 0 | 0 | 6 | 47.2 55.1 5.8 15.1 | Europe/Berlin |
| SE | 6 | 0 | 6 | 0 | 0 | 6 | 55.3 69.1 11.0 24.2 | Europe/Stockholm |
| DJ | 6 | 0 | 6 | 0 | 0 | 6 | 10.9 12.8 41.7 43.5 | Africa/Djibouti |
| MA | 6 | 0 | 6 | 0 | 0 | 6 | 27.6 36.0 -13.3 -0.9 | Africa/Casablanca |
| CI | 5 | 0 | 0 | 0 | 5 | 0 | 4.3 10.8 -8.7 -2.4 | Africa/Abidjan |
| UZ | 5 | 0 | 2 | 0 | 3 | 2 | 37.1 45.6 55.9 73.2 | Asia/Tashkent<br>Asia/Samarkand |
| ML | 5 | 0 | 5 | 0 | 0 | 5 | 10.1 25.0 -12.3 4.3 | Africa/Bamako |
| SO | 5 | 0 | 5 | 0 | 0 | 5 | -1.7 12.0 40.9 51.5 | Africa/Mogadishu |
| TZ | 5 | 0 | 3 | 0 | 2 | 3 | -11.8 -0.9 29.3 40.5 | Africa/Dar_es_Salaam |
| TT | 4 | 0 | 0 | 0 | 4 | 0 | 10.0 11.4 -61.9 -60.5 | America/Port_of_Spain |
| NZ | 4 | 0 | 3 | 0 | 1 | 3 | -47.4 -34.4 166.3 178.6 | Pacific/Auckland |
| TJ | 4 | 0 | 1 | 0 | 3 | 1 | 36.6 41.1 67.3 75.2 | Asia/Dushanbe |
| CH | 4 | 0 | 4 | 0 | 0 | 4 | 45.8 47.9 5.9 10.5 | Europe/Zurich |
| IS | 4 | 0 | 2 | 0 | 2 | 2 | 63.2 66.6 -24.6 -13.4 | Atlantic/Reykjavik |
| MW | 4 | 0 | 4 | 0 | 0 | 4 | -17.2 -9.3 32.6 35.9 | Africa/Blantyre |
| TG | 3 | 0 | 2 | 0 | 1 | 2 | 6.0 11.2 -0.2 1.9 | Africa/Lome |
| KW | 3 | 0 | 1 | 0 | 2 | 1 | 28.5 30.1 46.5 48.5 | Asia/Kuwait |
| IQ | 3 | 0 | 3 | 0 | 0 | 3 | 29.0 37.4 38.7 48.7 | Asia/Baghdad |
| LK | 3 | 0 | 2 | 0 | 1 | 2 | 5.8 9.9 79.5 81.9 | Asia/Colombo |
| IE | 3 | 0 | 1 | 0 | 2 | 1 | 51.3 55.5 -10.6 -5.9 | Europe/Dublin |
| KR | 3 | 0 | 3 | 0 | 0 | 3 | 33.0 38.7 124.5 132.0 | Asia/Seoul |
| BG | 3 | 0 | 3 | 0 | 0 | 3 | 41.2 44.3 22.3 28.7 | Europe/Sofia |
| KG | 3 | 0 | 2 | 0 | 1 | 2 | 39.1 43.3 69.2 80.3 | Asia/Bishkek |
| KE | 3 | 0 | 3 | 0 | 0 | 3 | -4.8 5.1 33.9 41.9 | Africa/Nairobi |
| MZ | 3 | 0 | 3 | 0 | 0 | 3 | -26.9 -10.4 30.2 41.0 | Africa/Maputo |
| UG | 3 | 0 | 3 | 0 | 0 | 3 | -1.6 4.3 29.5 35.1 | Africa/Kampala |
| PH | 3 | 0 | 3 | 0 | 0 | 3 | 4.5 21.2 116.9 126.7 | Asia/Manila |
| ZA | 3 | 0 | 3 | 0 | 0 | 3 | -35.0 -22.1 16.4 33.0 | Africa/Johannesburg |
| ?? | 2 | 0 | 0 | 0 | 2 | 0 | not carried | not carried |
| GH | 2 | 0 | 2 | 0 | 0 | 2 | 4.7 11.2 -3.3 1.2 | Africa/Accra |
| GE | 2 | 0 | 2 | 0 | 0 | 2 | 41.0 43.6 40.0 46.8 | Asia/Tbilisi |
| LB | 2 | 0 | 0 | 0 | 2 | 0 | 33.0 34.7 35.1 36.7 | Asia/Beirut |
| AT | 2 | 0 | 2 | 0 | 0 | 2 | 46.3 49.1 9.5 17.2 | Europe/Vienna |
| LA | 2 | 0 | 2 | 0 | 0 | 2 | 13.9 22.5 100.0 107.7 | Asia/Vientiane |
| GR | 2 | 0 | 1 | 0 | 1 | 1 | 34.7 41.8 19.3 29.7 | Europe/Athens |
| HR | 2 | 0 | 2 | 0 | 0 | 2 | 42.3 46.6 13.4 19.5 | Europe/Zagreb |
| HK | 2 | 0 | 0 | 0 | 2 | 0 | 22.1 22.6 113.8 114.5 | Asia/Hong_Kong |
| FI | 2 | 0 | 2 | 0 | 0 | 2 | 59.7 70.1 19.5 31.6 | Europe/Helsinki |
| ZW | 2 | 0 | 2 | 0 | 0 | 2 | -22.5 -15.6 25.2 33.1 | Africa/Harare |
| PK | 2 | 0 | 2 | 0 | 0 | 2 | 23.6 37.1 60.8 77.9 | Asia/Karachi |
| CM | 1 | 0 | 1 | 0 | 0 | 1 | 1.6 13.1 8.4 16.2 | Africa/Douala |
| AE | 1 | 0 | 0 | 0 | 1 | 0 | 22.6 26.1 51.5 56.4 | Asia/Dubai |
| BD | 1 | 0 | 0 | 0 | 1 | 0 | 20.5 26.7 88.0 92.7 | Asia/Dhaka |
| CO | 1 | 0 | 0 | 0 | 1 | 0 | -4.3 12.5 -79.1 -66.8 | America/Bogota |
| KH | 1 | 0 | 1 | 0 | 0 | 1 | 10.3 14.7 102.3 107.7 | Asia/Phnom_Penh |
| MN | 1 | 0 | 1 | 0 | 0 | 1 | 41.5 52.2 87.7 119.9 | Asia/Ulaanbaatar |
| VN | 1 | 0 | 1 | 0 | 0 | 1 | 8.1 23.4 102.1 109.5 | Asia/Ho_Chi_Minh |
| SL | 1 | 0 | 1 | 0 | 0 | 1 | 6.9 10.0 -13.4 -10.2 | Africa/Freetown |
| SR | 1 | 0 | 0 | 0 | 1 | 0 | 1.7 6.0 -58.1 -53.9 | America/Paramaribo |
| LU | 1 | 0 | 1 | 0 | 0 | 1 | 49.4 50.2 5.7 6.6 | Europe/Luxembourg |
| BH | 1 | 0 | 1 | 0 | 0 | 1 | 25.7 26.4 50.3 50.9 | Asia/Bahrain |
| YE | 1 | 0 | 1 | 0 | 0 | 1 | 12.1 19.0 42.5 54.6 | Asia/Aden |
| MG | 1 | 0 | 1 | 0 | 0 | 1 | -25.6 -11.9 43.2 50.5 | Indian/Antananarivo |
| JO | 1 | 0 | 0 | 0 | 1 | 0 | 29.1 33.4 34.9 39.4 | Asia/Amman |
| QA | 1 | 0 | 0 | 0 | 1 | 0 | 24.4 26.2 50.7 51.7 | Asia/Qatar |
| BY | 1 | 0 | 1 | 0 | 0 | 1 | 51.2 56.2 23.1 32.8 | Europe/Minsk |
| DK | 1 | 0 | 1 | 0 | 0 | 1 | 54.5 57.8 8.0 15.3 | Europe/Copenhagen |
| LT | 1 | 0 | 0 | 0 | 1 | 0 | 53.8 56.5 20.9 26.9 | Europe/Vilnius |
| DZ | 1 | 0 | 1 | 0 | 0 | 1 | 18.9 37.2 -8.7 12.0 | Africa/Algiers |
| MR | 1 | 0 | 1 | 0 | 0 | 1 | 14.7 27.3 -17.1 -4.8 | Africa/Nouakchott |
| NC | 1 | 0 | 0 | 0 | 1 | 0 | not carried | not carried |
| BF | 1 | 0 | 1 | 0 | 0 | 1 | 9.4 15.1 -5.6 2.4 | Africa/Ouagadougou |
| GN | 1 | 0 | 1 | 0 | 0 | 1 | 7.1 12.7 -15.1 -7.6 | Africa/Conakry |
| LR | 1 | 0 | 1 | 0 | 0 | 1 | 4.3 8.6 -11.5 -7.4 | Africa/Monrovia |
| AO | 1 | 0 | 1 | 0 | 0 | 1 | -18.1 -4.3 11.6 24.1 | Africa/Luanda |
| LS | 1 | 0 | 1 | 0 | 0 | 1 | -30.7 -28.5 27.0 29.5 | Africa/Maseru |
| SZ | 1 | 0 | 1 | 0 | 0 | 1 | -27.4 -25.7 30.7 32.2 | Africa/Mbabane |
| NA | 1 | 0 | 1 | 0 | 0 | 1 | -28.9 -16.9 11.7 25.3 | Africa/Windhoek |
| MU | 1 | 0 | 0 | 0 | 1 | 0 | -20.6 -19.9 57.3 57.9 | Indian/Mauritius |
| SG | 1 | 0 | 1 | 0 | 0 | 1 | 1.1 1.5 103.6 104.1 | Asia/Singapore |
| RS | 1 | 0 | 1 | 0 | 0 | 1 | 42.2 46.2 18.8 23.1 | Europe/Belgrade |

## Region verdict

The same six regions the world table uses, rolled up from the country table above.

| Region | Surfaces | Usable | Share | PUBLISHED | DERIVED | ANCHOR | UNKNOWN | Countries |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Middle East and North Africa | 516 | 508 | 98% | 339 | 169 | 0 | 8 | 16 |
| South, Southeast, Central and East Asia | 432 | 406 | 94% | 43 | 209 | 154 | 26 | 23 |
| British Isles and Europe | 295 | 234 | 79% | 61 | 173 | 0 | 61 | 26 |
| West, Central, East and Southern Africa | 112 | 92 | 82% | 0 | 92 | 0 | 20 | 27 |
| Americas | 167 | 1 | 1% | 0 | 1 | 0 | 166 | 6 |
| Oceania | 23 | 6 | 26% | 0 | 6 | 0 | 17 | 4 |

The Middle East and North Africa is resolver-ready: one national point per surface, 98% of it,
and its 8 gaps are three fixed tables, two short samples, one table with a single solar column
and two fitted points outside their country's envelope. South and Southeast Asia is
resolver-ready through its zone tables, with Thailand's 154 anchors and Indonesia's published
city register carrying it. Europe is usable at 79% and its gaps are concentrated in Portugal and
Spain (mainland versus island zone bands) and Russia (twelve zones). The Americas is the one
region the record cannot serve from coordinates at all: 166 of 167 surfaces carry no placeable
point, and every one of them fails for the same reason.

## Zone-table anchors

A zone table computes one set of rows at a named reference point for a wider area. Those points
are the resolver's anchors, and the ledger carries them with the publisher's own name.

| Country | Anchors | What they are |
| --- | --- | --- |
| Thailand | 154 | CICOT provincial workbooks, row 1 printed coordinate, one district reference point per province (77 provinces, normal and leap blocks) |
| Malaysia | 0 carried as anchor, 36 derived | the JAKIM Lampiran B register is on record as a PDF and text capture but the zone-to-zone-code join is not resolved here; the derived points reproduce the register's own longitudes to 0.02 to 0.08 degrees, as the Malaysia job measured |
| Bosnia and Herzegovina | 61 | vaktija.eu location register, one point per location id, published by the federation |
| Tunisia | 339 | INM delegation points, echoed in every archive row |
| Indonesia | 43 | Kemenag city register, point and timezone per city |

## The ten widest gaps

Ranked by surfaces with no usable point.

| Country | Unknown | Usable | Share unknown | Dominant reason |
| --- | --- | --- | --- | --- |
| US | 111 of 111 | 0 | 100% | civil-zone degenerate: latitude only |
| CA | 29 of 30 | 1 | 97% | civil-zone degenerate: latitude only |
| RU | 21 of 21 | 0 | 100% | civil-zone degenerate: latitude only |
| CL | 20 of 20 | 0 | 100% | civil-zone degenerate: latitude only |
| PT | 16 of 16 | 0 | 100% | civil-zone degenerate: latitude only |
| AU | 11 of 11 | 0 | 100% | civil-zone degenerate: latitude only |
| GB | 10 of 89 | 79 | 11% | fewer than two solar columns |
| SN | 6 of 7 | 1 | 86% | fitted point falls outside the country |
| ES | 6 of 6 | 0 | 100% | civil-zone degenerate: latitude only |
| NG | 5 of 37 | 32 | 14% | transit and horizon columns disagree |

The United States is the single largest gap and it is a clean result: 101 of its 111 surfaces
are platform tables (Masjidal, masjidbox) whose rows reproduce at four or five longitudes a
civil-zone step apart, and neither the capture nor the record names the mosque's point. Those
records carry a latitude and no longitude. Russia, Chile, Portugal, Australia, Spain and Canada
fail the same way, each between two zone bands. The United Kingdom is the opposite case: 79 of
89 surfaces carry a point, and its ten gaps are tables with one solar column or a transit that
contradicts the horizon pair.

## What this ledger cannot do

- It cannot place a table that prints one solar column. Seventeen surfaces are in that state.
- It cannot place a table whose clock is a civil zone the record does not name. That is the
  zone-degenerate class, 196 surfaces, all in multi-zone countries.
- It cannot separate a printed dhuhr margin from a longitude shift. Where the horizon pair
  exists the ledger uses the horizon pair; where it does not, the point carries the bias and the
  record says so through `lonBasis: dhuhr`.
- It cannot see a table that is not solar at all but is smooth. The LUPT family is printed
  from interval tables, not from a horizon angle; the April 2027 block derives a point at
  55.0 N, 1.2 W, which is precise (sigma 0.14 deg) and 3.5 degrees from London. Precision is
  reported per record as sigmaLatDeg and sigmaLonDeg, and it measures the fit, not the truth.
- It does not name a country for two surfaces whose file names resolve to no country on record
  (`timetable-aghien.json`, `timetable-mosqueerayyane.json`). They are UNKNOWN, not guessed.

## Files

| File | Content |
| --- | --- |
| `coords-ledger.json` | one record per surface: id, country, point, class, citation, timezone, residual |
| `data/by-country.json` | the per-country roll-up behind the table above |
| `derive/solve.mjs` | the solver: transit and horizon longitude, latitude by least squares |
| `derive/solar.mjs` | the solar core |
| `derive/validate.mjs` | the adhan gate |
| `derive/crosscheck.mjs` | the published-versus-derived check |
| `derive/extract-published.mjs` | the five published and anchor sources, carried verbatim |
| `derive/countries.mjs` | country assignment, IANA zones, country envelopes |
| `derive/rowsource.mjs` | fallback row reader for tables the index normalised to one column |
| `derive/assemble.mjs`, `derive/report.mjs` | the ledger and this page |
| `derive/export.sh` | regenerates `data/surfaces.psv` and `data/rows.psv` from `census-index.db` |

Run order: `export.sh`, `extract-published.mjs`, `solve.mjs`, `crosscheck.mjs`, `assemble.mjs`,
`report.mjs`.
