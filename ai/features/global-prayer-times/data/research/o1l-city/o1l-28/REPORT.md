# O1l-28 — UK deep second sources, round two (Scotland / Wales / NI / England remainder)

Captured 2026-11-11, GMT. Public pages only, no login, no forms, no contact. Engine for every
classification: adhan 4.4.6 at `Rounding.None`, TZ `Europe/London`, dates built from the capture
strings, no clock reads. Class method: implied twilight depression at the printed minute (the
FORM-MAP method), core window Nov-Feb, plus a zero-offset per-column angle sweep (`tools/fit2.js`)
over the core days, and the FORM-MAP interval test F = sunrise - fajr, I = isha - maghrib against
the LUPT arrays (`tools/fi.py`).

Rows banked this wave: **5,602 live dated rows** in `data/`, 32 surface files with live rows, 227 raw captures.

## Two platform findings that change how the UK is read

**1. go2masjid (new platform, `go2masjid.com/api/papi/`).** A city query returns every masjid record
with a 14-day window; the same masjid's `loc_getfavmasjid.php?...&slim=365&mid=<id>` returns a
**365-day forward window** (2026-11-11..2027-11-10). That is a proven forward horizon for any mosque
on the platform, and the cheapest year-window door found in the UK so far. The city list is 100
entries, 90 of them British or Irish.
The platform carries a mosque record far more often than it carries a timetable: on the first
full-city sweep **20 of 31 UK masjid records returned all-zero rows** on both endpoints, and across
the 44 records pulled in total 21 are all-zero. A zero table is the dead-install class
the record already holds for Dundee IS, now proven platform-wide. The live ones are named below.

**2. mawaqit's stored calendar can be a different generation from the page it feeds.** The live
`times` array and the year `calendar` disagree at Plymouth (fajr 10 min earlier, isha 9 min later on
the live page) and Lincoln (fajr 11 earlier, isha 10 later), and agree at Bath to a constant +3.
B2 saw the same signature at Birmingham South, Bradford Tabligh and Glasgow Dawatul. Read as: the
calendar is what the mosque published, the live page is what it now displays, and on some mosques
the two are different parameter sets. Recorded as a gate failure on both surfaces, never smoothed.
Also recorded: `mawaqit.net/robots.txt` disallows the Claude/Anthropic crawler family by name.
No crawling was done; single known-slug pages only.

## Scotland

| City | Source (new) | Tier | Rows | Class / fit |
|---|---|---|---|---|
| Inverness | Inverness Masjid, go2masjid 786 | mosque, platform | 51 | **CLOSES B2's negative.** fajr 18.00 sd 0.33, isha 14.91 sd 0.11 — the 18/15 pair |
| Kirkcaldy | Kirkcaldy Islamic Centre, go2masjid 366 | platform | 0 | all-zero table; the site's only timetable is still `KCM_RAMADAN_2024-11-P1` |
| Motherwell | Lanarkshire Muslim Welfare Society, go2masjid 367 | mosque, platform | 51 | fajr 17.21 sd 0.06, isha 18.09 sd 0.04 — an inverted 17.2/18.2 pair |
| Stirling | Central Scotland Islamic Centre, go2masjid 404 and 427 | mosque, platform | 51 + 51 | fajr 17.24 sd 0.05, isha 18.18 sd 0.04 — same pair as Motherwell; second Stirling source beside B2's 30-row print |
| Livingston | Livingston Central Mosque, go2masjid 417 | mosque, platform | 143 | fajr 18.1, 100% within 1 (mae 0.59, worst 1); isha 14.9 but 62% (mae 8.6) — an angle fajr over a table isha |
| Livingston | Livingston Islamic Center, go2masjid 365 | mosque, platform | 31 | fajr 18.11 sd 0.04, isha 14.78 sd 0.09 |
| East Kilbride | Faizan-e-Attar, DPT year JSON | mosque, official | 335 | **DEFECTIVE INSTALL**: Oct-Nov clean on 18.06/17.77 (sd 0.04), Jan-Mar sd 7-8 and Dec placeholders. `2026-01-05` prints fajr 02:06, asr 18:27 — the winter half is corrupt |
| Ayr | no mosque of its own; Ayrshire Central Mosque (Kilmarnock) answers for Ayr | — | 0 | the Ayrshire record is all-zero on go2masjid; AFECC publishes `ayr.pdf` (3.1 MB, captured, image-only, untranscribed) |
| Dumfries | Islamic Society Dumfries, Masjidbox landing | platform | 7 | rolling week only; the "Dumfries" mawaqit page (`/m/bccd`) is **Badr Community Center of Dumfries, Virginia, 38.57N America/New_York** — the slug-fallback defect again |
| Cumbernauld | Islamic Education Trust, Masjidbox landing | platform | 7 | rolling week only; islamictrust.org publishes no table |
| St Andrews | none | — | 0 | honest negative, English terms: "St Andrews mosque prayer times Fife", "St Andrews Islamic Centre prayer times Scotland" — only aggregators and the university chaplaincy page |
| Stornoway | Stornoway Mosque on mosquepay (id 4319) | platform | 0 | page renders no timetable; no dated table anywhere public |
| Lerwick | none | — | 0 | no mosque exists: the Shetland venue is a 2022 plan for "Britain's most northerly mosque" (Shetnews 2022-06-22, Islam Channel). Honest negative |

## Wales

| City | Source (new) | Tier | Rows | Class / fit |
|---|---|---|---|---|
| Swansea | Swansea Mosque & Islamic Community, go2masjid 769 | platform | 0 | all-zero; the mosque's own `salah_times` page is a today+tomorrow widget (11 Nov 05:49/07:27/12:05/14:08/16:35/18:01) with a "View Monthly Timetable" link that resolves to nothing — 2 rows of evidence, no span |
| Newport | Jamia Hanfia Rizvia, go2masjid 291 | mosque, platform | 11 | candidate only, 11 rows |
| Wrexham | Wrexham Mosque, DPT year JSON | mosque, official | 28 | 365 rows returned, **337 all-zero**: a dead install with a 28-day live tail (F +14 at 71% of 28). Masjidbox landing adds a 7-day week |
| Bangor | masjidway 3350 | platform | 0 | HTTP 503 on every attempt; aggregators only. Honest negative |
| Llanelli | mosquepay 4779 | platform | 0 | page renders no timetable. Honest negative |
| Cardiff | go2masjid layer, 15 masjids | platform | 14-day | **NEW second-source layer**: 13 of 15 on one pair (fajr 14.96, isha 15.46, sd 0.05-0.16), two outliers at 15.10/14.27. Cardiff is held; this is its masjid-level spread |

Welsh-language terms searched: "amseroedd gweddïo", "mosg", "amseroedd gweddïo Caerdydd Abertawe
mosg" — returned football results, a BBC schools worksheet and a terminology database, no timetable.

## Northern Ireland

| City | Source (new) | Tier | Rows | Class / fit |
|---|---|---|---|---|
| Belfast | **Belfast Islamic Centre, DPT year JSON** | mosque, official | 365 | **NEW YEAR SURFACE.** fajr 15.6 (87.5% within 1, mae 0.76, worst 2), isha 14.9 (94.2%, worst 2) — an angle pair, ISNA refuted on fajr (0%) |
| Belfast | Ihsan Youth, Iqraa Masjid, Belfast Multi Cultural Association, go2masjid 630/631/632 | platform | 0 | three all-zero records |
| Derry | North West Islamic Centre, go2masjid 690 | platform | 0 | all-zero |
| Lisburn | masjidumer.co.uk | — | 0 | HTTP 500 on the DPT route |
| Newry | none | — | 0 | honest negative, English terms; only aggregators and an X account |

## England

| City | Source (new) | Tier | Rows | Class / fit |
|---|---|---|---|---|
| Norwich | **Norwich Central Mosque, DPT year JSON** | mosque, official | 365 | **NEW.** fajr 17.9 (= Karachi 18, 75% within 1, mae 4.22, worst 20), isha 17.0 (75%, worst 23) — an interval table on a Karachi-like fajr, not a frozen angle |
| York | **York Mosque, DPT year JSON** | mosque, official | 365 | **NEW.** fajr 13.5 (30.8% within 1, mae 5.4, worst 14), isha 11.5 (30%, worst 12) — an own-array interval table |
| Plymouth | Islamic Centre of Plymouth and Cornwall, Mawaqit calendar | mosque, platform | 366 | **NEW.** fajr 14.9 = **ISNA 15, 100% within 1** (mae 0.21); isha 14.1 (100% at 14.1, ISNA 15 refuted at 0%) — the 15/14 pair |
| Lincoln | Lincoln Central Mosque, Mawaqit calendar | mosque, platform | 365 | **NEW.** fajr 17.9 (= MWL/Karachi 18, 95.8% within 1), isha 15.1 (= ISNA 15, 99.2%) — the 18/15 pair |
| Bath | Bath Mosque, Mawaqit calendar | mosque, platform | 366 | **NEW.** fajr 14.8 but only 47.9% within 1 (mae 2.07, worst 5), isha 10.9 (72.7%) — an interval table, low isha |
| Bristol | Hazrat Bilal Centre, go2masjid 12 | mosque, platform | 365 | fajr 14.7 (48.3%), isha 14.0 (94.2%, worst 2) — angle isha over a table fajr |
| Bristol | Shahporan Islamic Centre, go2masjid 15 | mosque, platform | 330 | fajr 15.3 (59.2%), isha 14.9 (57.5%) — table both sides |
| Bristol | Bristol Mosque Totterdown, go2masjid 4 | mosque, platform | 347 | fajr 14.8 (50.8%), isha 12.0 (87.5%) — mixed |
| Bristol | Bristol Central Mosque, go2masjid 1/3/5 | platform | 51 x3 | three records, identical rows: 12.03/10.32. One computed generation under three ids |
| Portsmouth | Portsmouth Jami Mosque, go2masjid 753/754 | platform | 0 | all-zero. The mosque's own `/time-table/` page carries **one PDF link, `ELM_prayer_timetable_2016.pdf`** — East London Mosque's 2016 LUPT artifact, now 404. A LUPT-pointer town whose only artifact is ten years stale |
| Southampton | Bashir Ahmed Masjid, go2masjid 426 | platform | 0 | all-zero |
| Sunderland | Anwaar E-Madinah, go2masjid 768 | platform | 0 | all-zero; masjidway 2781 HTTP 503 |
| Brighton | Brighton Mosque today-widget | mosque | 0 | Salat/Time pairs for today only (Fajr 05:23/06:00, Zuhr 13:30, Asr 04:02/04:30, Maghrib 06:48/06:52); almedinah.co.uk is a JS app with no server-rendered table. Honest negative for a span |
| Blackpool | blackpool-mosque.co.uk | mosque | 0 | page renders no table. Honest negative |
| Dudley | Dudley Central Masjid | mosque | 0 | Facebook-gated; masjidmadrassafaizulquran.co.uk returned HTTP 502. Confirms B2's negative |

## England — the go2masjid second layer over held towns

The platform's city sweep was run over 55 British cities. Most records are dead; these carry live
rows and add a mosque-level surface where the record held a town-level one.

| Town | Source | Rows | Class / fit |
|---|---|---|---|
| Birmingham | Green Lane Masjid, go2masjid 56 | 170 | fajr 14.8 (48.1% within 1, mae 1.71, worst 4), isha 13.9 (25.3%, worst 15) — a table, near-15 fajr |
| Huddersfield | Markazi Jamia Masjid Riza, go2masjid 210 | 265 | fajr 15.0 (28.3%, mae 5.36), isha 15.8 (35.8%, mae 3.25) — a stepping table |
| London | West London Islamic Centre & Jamia, go2masjid 414 | 51 | fajr 15.52 sd 0.52, isha 14.44 sd 0.15 |
| Luton | Baitul Abraar Jami Masjid, go2masjid 409 | 51 | fajr 18.04 sd 0.05, isha 11.93 sd 0.04 — an 18/12 pair, not the held Luton 12.2/12.0 |
| Walsall | Masjid-E-Umar 364 and Al Aqsa 421 | 51 + 51 | 15.05/14.16 and 14.21/13.85 — two distinct Walsall lines |
| Bury | Noor ul Islam Mosque, go2masjid 418 | 51 | fajr 11.92 sd 0.05, isha 11.86 sd 0.14 — a low 12/12 pair |
| Dewsbury | Masjid-e-Umar (R.A.), go2masjid 419 | 31 | fajr 18.02 sd 0.04, isha 17.73 sd 0.05 — Karachi 18/18 |
| Coventry | Zeenat-Ul-Islam, go2masjid 357 | 11 | candidate only |
| Bradford | Shahjalal Latifiah, go2masjid 413 | 365 | **DEFECT**: one identical row repeated on all 365 days (fajr 06:34, dhuhr 12:10, isha 17:38 every day) — a frozen placeholder, rejected |
| Crawley, Swindon | Crawley Islamic Centre 342, Jamia Masjid Swindon 272 | 0 | window fetch failed / all-zero |

**Third platform defect, recorded.** The city endpoint's `masjidid` does not resolve the same mosque
in the 365-day endpoint: `loc_getcity.php?name=Coventry` returns "Eden Masjid & Dawah Centre" as 357,
and `loc_getfavmasjid.php?...&mid=357` returns "Zeenat-Ul-Islam". The window endpoint answers for the
nearest mosque to the coordinates passed, so the location is right and the name can be another
mosque at that point. Read the 365 window as "the mosque at these coordinates", never as the name the
city list gave.

## What confirms, what is new

- **Confirms**: B2's Scotland rule (the city decides the recipe, not the platform) holds on the new
  go2masjid layer — Edinburgh's 13 live records sit on one 17.89/14.79 pair while Stirling and
  Motherwell sit on a different 17.2/18.2 pair. B2's Kirkcaldy, Dumfries, Blackpool, Dudley and
  Inverness negatives are all confirmed, and Inverness is now closed by a live 51-row surface.
- **New**: 14 dated surfaces of 100+ rows, of which 9 are full-year (Belfast, Norwich, York,
  Plymouth, Lincoln, Bath, Bristol Bilal, Bristol Totterdown, Huddersfield at 265), plus 9 more
  mosques on the go2masjid second layer over held towns (Birmingham, London, Luton, Walsall x2,
  Bury, Dewsbury, Coventry, Bradford), the 365-day forward door, and two platform defects:
  mawaqit's generation split and go2masjid's id-space mismatch.
- **Not found under these terms**: St Andrews, Lerwick, Bangor, Llanelli, Newry, Stornoway,
  Cumbernauld, Dumfries (year), Swansea (span), Portsmouth (current), Southampton, Sunderland,
  Brighton (span), Blackpool, Dudley, Lisburn, Derry, Kirkcaldy, Ayr (own mosque).
