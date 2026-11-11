# O1m-9 Oceania and Pacific completion — wave report

Workspace `$HOME/athan-gitree/census/o1m/o1m-9-oceania/`. Read `BRIEF.md` and `FIT-RULES.md`.
Prior inputs: `o1l-city/CONSOLIDATION.md` blocks O1l-19r, O1l-35, O1l-54; workspaces `o1l-19r/`,
`pacific2/`, `nz-finish/`, `o1m-3-platforms/` (Diyanet tree, tawkit census).
Engine: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`Rounding.None`, `HighLatitudeRule.MiddleOfTheNight`, timezone pinned per surface from the
publisher's own field, dates built from the capture's literal strings, no clock read. The repo
is never touched. Leaf agent: no subagents.

**36,516 dated rows across 94 surfaces** in `data/`, 30 MB of raw captures in `captures/`,
per-surface fits in `fit/logs/` with the table in `fit/SUMMARY.tsv`, and the surface ledger in
`MANIFEST.txt`.

---

## Headline

1. **The Pacific gains an authority layer.** Diyanet's own service
   (`namazvakitleri.diyanet.gov.tr`) carries a full-year table for **20 Oceania cities** in nine
   countries, one page each. Eighteen of the twenty fit **one recipe**: fajr 18, isha 17, zero
   twilight margins, 365/365 within-1, with the publisher's own solar margins (sunrise +7,
   dhuhr -5, asr -4, maghrib -7). Samoa, Tonga, Guam, Palau, Niue, Vanuatu, New Caledonia and
   nine Papua New Guinea towns now hold dated rows where the record held nothing or a negative.
2. **Australia's mosque layer is 55 dated surfaces** beside the 218 Diyanet grid points:
   29 masjidbox tenants (371 rows each), 23 mawaqit tenants (365 rows each) and 3 masjidal
   tenants at three years each (1,096 rows each). Every capital is on the layer, and so are
   Gold Coast, Shepparton, Geelong, Bendigo, Wollongong, Newcastle, Wagga Wagga, Rockhampton,
   Townsville, Alice Springs and Shellharbour. **The layer is thinner than its row count**: 25
   of the 38 Australian masjidbox tenants and 5 of the 23 Australian mawaqit tenants publish a
   jama'ah board rather than an athan table, so only about a third of the tenants carry a
   reproducible table.
3. **New Zealand's year-round buy is met.** Sixteen dated year surfaces replace the Ramadan-only
   FIANZ sheets: thirteen masjidbox tenants and three mawaqit tenants, across Auckland,
   Wellington, Christchurch, Hamilton, Palmerston North, New Plymouth, Lincoln and Nelson.
4. **Fiji 2026 re-captured whole** from the league's own widget (365 rows, iqamah included);
   1,456 of 1,460 cells identical to the edition banked last round, so the edition is one
   generation and it is now proven on the live route rather than on the 2024 image set.

---

## 1. Australia — the mosque layer

**Discovery.** Platform ids were read from each mosque's own homepage and from search, never
guessed. masjidbox tenants were resolved by the platform's own payload, whose
`settings.timezone` also exposes name collisions: `isbc-melbourne`, `icc`, `icnvt`, `mav`,
`mtu` are United States tenants and were dropped after the probe (`captures/mbj-probe.tsv`).

**masjidbox — 29 Australian tenants, 371 dated rows each (2026-01-01..2027-01-06).**
`api.masjidbox.com/1.0/masjidbox/landing/athany/<slug>?get=at&days=7&begin=<date>`, one raw
capture per window in `captures/mbj/<slug>/`. The API serves seven days per request whatever
`days` asks for, so a year is 53 windows. The payload's rows carry local ISO literals, so the
wall clock is the published time.

Tenants: Adelaide City Mosque, Adelaide Bosniaks, Maryam Masjid (Adelaide); Campbellfield,
BICM, La Trobe, Markaz Abu Bakr St Albans (Melbourne); Grand Omar Auburn, Quba, IMAA,
Dawat-e-Islami, Australian Bosnian Islamic Centre (Sydney); Moorooka, Camira, IMCQ, Darra,
As-Sunnah (Brisbane); Masjid Khadijah, Perth Islamic Society, Furqan (Perth); Canberra Masjid,
Taqwa Spence (Canberra); UMNT Darwin Musalla; Afghan Mosque Alice Springs; Townsville Islamic
Society; Rockhampton Masjid; Masjid Omar Wollongong; Newcastle Muslim Centre; Marwa Mosque
Wagga Wagga.

**mawaqit — 23 Australian tenants, 365 dated rows (2026).** One page fetch per mosque; the page's
`confData.calendar` is twelve month objects of six-string rows. Tenants: Quakers Hill, Marsden
Park, Riverstone, Rouse Hill, Dural, Smithfield, Masjid Al Noor, Bankstown, HIA Centre Baulkham
Hills, Masjidul Rahman Minto (Sydney); La Trobe, Al Bayyinah, IMCV Coburg, OneSpace Springvale,
RCC Springvale (Melbourne); Moorooka (Brisbane); ICMG Parafield Gardens (Adelaide); UMNT Darwin;
Afghan Mosque Larapinta (Alice Springs); Bendigo BICC; Uthman Mosque Shellharbour; Geelong;
Kellyville.

**masjidal — three tenants at three years each.** The range API is keyless and serves whole
years: `masjidal.com/api/v1/time/range?masjid_id=<id>&masjid_detail=yes&from_date=&to_date=`.
Ids came from the platform census. **Southport Masjid (Gold Coast)** and **Shepparton Albanian
Islamic Society** each reproduce **1,096/1,096 within-1 on all six columns at 18/17** across
2024, 2025 and 2026; Ravenhall Masjid Ar-Rahma carries its own margins (maghrib sunset+1,
fajr +0.9). Three AU tenants were already banked at three years by the platform census (Doveton,
Logan Central, Newport).

**The fits, counted.** 95 surfaces were fitted on their full span at their own point. The
classification below is script-counted over `fit/SUMMARY.tsv` and `fit/logs/`:

| class | surfaces | evidence |
|---|---|---|
| 18/17 on both twilights, 95 pc+ within-1 | **43 of 95** | Diyanet 18 of 20, mawaqit 11 of 25, masjidbox 8 of 43, masjidal 3 of 3, Fiji 3 of 3 |
| another angle pair, 95 pc+ within-1 | **14** | the free fit moves the pair (15/15 at Al Bayyinah and IMCV, 18/18 at Adelaide City and the Alice Springs Afghan mosque, 17.85/17.15 at BICM) |
| below 95 pc on a twilight | **38** | hand-set boards and defects (below) |
| Hanafi asr | **22** | the asr column takes a zero residual only under Hanafi |

Two masjidal tenants are the cleanest surfaces in the wave: **Southport Masjid (Gold Coast)**
and **Shepparton Albanian Islamic Society** reproduce **1,096/1,096 within-1 on all six columns
at 18/17** across 2024, 2025 and 2026 — three years, one recipe, no drift.

The 38 below-threshold surfaces are mostly not defects but **jama'ah boards**: a fixed clock in
the athan column. The pattern is uniform — fajr pinned near 05:20, dhuhr near 13:50, asr near
18:20, isha near 21:40 all year, with only sunrise and maghrib tracking the sun. Moorooka is the
clearest case: sunrise exact 367/371 while dhuhr sits a pinned 56 minutes after solar noon.
The same shape appears in New Zealand (section 2): Auckland's Masjid e Umar prints dhuhr 13:50,
asr 18:20 and isha 21:40 on all 371 days. That is the answer to the mission's Auckland question:
the mosque is on the platform, but what it publishes is a jama'ah board.

**Negatives with evidence.** **Hobart**: `hobartmosque.com.au` publishes a today-only
adhan/iqama block managed by the mosque administrator, and `awqat.com.au/tas/hmt/` is a
client-side calculator form with an adjustable fajr angle. **Cairns**: the only hit is gopray's
place page, which prints iqamah only ("Not prayed" for fajr). Both are honest negatives under
English terms.

## 2. New Zealand — the year-round buy

Thirteen dated year surfaces from masjidbox and three from mawaqit, where the record held
Ramadan sheets only:

- **masjidbox (13, 371 rows each)**: NZ Islamic Cultural Trust, Masjid-E-Umar, Masjid Al-Ameen
  and Aman Islamic Trust (Auckland); Waikato Muslim Association (Hamilton); Manawatu Muslims
  Association (Palmerston North); Linwood Islamic Center and University of Canterbury MSA
  (Christchurch); Wellington Islamic Centre Kilbirnie and VicMuslims Club (Wellington); Muslim
  Association of Taranaki (New Plymouth); Masjid Al-Manar; Lincoln University Musalla.
- **mawaqit (3, 365 rows each)**: Birkenhead Islamic Centre (Auckland), Al-Makhtoom Airport
  Masjid (Auckland), Nelson Islamic Centre.
- **Quality caveat, per surface**: the solar columns are honest on Lincoln, Masjid Al-Manar,
  Taranaki, Waikato (370/371 sunrise) and Manawatu (349/371), and on all three mawaqit tenants
  (365/365 sunrise) — but their dhuhr is a clock, 27-45 minutes after solar noon on the
  Auckland pages with qibla-adjusted schedules. Masjid-E-Umar is the extreme: all four clock
  columns fixed all year. The rest are jama'ah schedules. The twenty-year FIANZ pair therefore
  keeps the authority tier and these stay community, candidate.

`masjidbox/prayer-times/masjid-e-umar-185187` is the Auckland Masjid e Umar the mission names.
Ponsonby's Al-Masjid Al-Jamie publishes through `nzma.kiwi.nz`, which carries no timetable and
no widget, so it stays a negative.

**The FIANZ pair keeps the authority tier.** `fianz.com/prayer-times/` was re-fetched: it links
nothing but the Ramadan calendar, so no year-round FIANZ surface exists under these terms. The
year-round data is mosque-level and community tier.

## 3. Fiji — 2026 whole, on the live route

`fml.com.fj/wp-admin/admin-ajax.php action=get_monthly_timetable&month=N` answers with a dated
table carrying the Gregorian date, the Hijri date, the weekday and a begins/iqamah pair per
prayer. Twelve months captured (`captures/fj-fml-dpt-2026-*.json`), **365 rows**
(`data/fj-fml-dpt-2026.json`), iqamah layer included.

- **Fit**: 18/17 Shafi at Suva, zero margins, **365/365 within-1 on all six columns**; asr
  221/365 at the one-minute floor.
- **One generation, confirmed on the live route**: 1,456 of 1,460 cells identical to the
  edition banked last round; the four that differ are the 2026-01-01 am/pm inversion.
- **Six am/pm inversions** across 2026 print the afternoon as morning; each was repaired
  against its own month's median and the repair list ships with the data file.
- **December**: the image sheet is still `uploads/2024/06/December.jpg` (captured, unchanged);
  the widget serves December 2026. The December watch is answered by the widget, not the sheet.
- **Other cities**: the league exposes no per-city route (`fml.com.fj/wp-json/` returns 403 and
  the widget's city selection is server-side). Lautoka, Levuka and Suva hold Diyanet full years.

## 4. The Pacific authority layer — Diyanet, 20 cities

`namazvakitleri.diyanet.gov.tr/en-US/<cityId>/<slug>-prayer-times` renders all three tabs,
including a **365-row yearly table**. One request per city; the year parameter is ignored
(`?yil=` and `?year=` return the current year byte-identically), so this is a current-year
surface like mawaqit.

| country | cities | rows |
|---|---|---|
| New Caledonia | Noumea, Koumac | 730 |
| Tonga | Nuku'alofa | 365 |
| Palau | Koror | 365 |
| Guam | Agana | 365 |
| Niue | Alofi | 365 |
| Fiji | Suva, Lautoka, Levuka | 1,095 |
| Samoa | Apia | 365 |
| Vanuatu | Port Vila | 365 |
| Papua New Guinea | Port Moresby, Lae, Madang, Wewak, Vanimo, Alotau, Buna, Daru, Morobe | 3,285 |

**One recipe at eighteen of the twenty**: fajr 18, isha 17, zero twilight margins, 365/365
within-1 on both twilights, with sunrise +6.9..+7.5, dhuhr -4.6..-5.1, asr -3.5..-4.1 and
maghrib -6.8..-7.1 on the solar columns. Two exceptions: **Alofi** holds 18/17 on fajr
(355/365) but its isha reaches only 293/365 within-1 with a -1.7..+1.4 spread, and **Morobe**
reaches 224/365 on fajr with a ±1.8 min spread on the solar columns, so its label is not the
town's point (flagged).

**Fajr amplitude** runs 5 min at Vanimo (2.7S) to 74 min at Noumea (22S), monotone in latitude
as the framing predicts.

**Tonga date-line defect, new.** Nuku'alofa's rows are six hours ahead of UTC, so a plain
reading puts every column ten hours late and the surface scores 0/365. Selecting the instant
that carries the row's own local date resolves it to 18/17 at 365/365 (fajr exact 306, isha
297). This is a harness duty, now recorded: a surface east of the date line needs the local-date
selection or the fit is meaningless.

## 5. Samoa — the hole is filled at the authority tier

The turktakvim gazetteer's 36 Samoa entries stay empty (verified last round, not re-argued).
**Apia now holds 365 dated rows** from Diyanet: 18/17, 365/365 within-1 on the twilights.
Searched in English and Samoan (masjid, faletua, tatalo, Samoa Muslim League); the Apia
community's web presence is a public Facebook page with no timetable, and masjidway's "Samoa"
hit resolves to a Texas mosque.

## 6. Small states, place by place

| place | result |
|---|---|
| Guam | **covered**: Diyanet Agana 365 rows. Masjid An-Noor and the Muslim Association of Guam publish no timetable (guampedia article and the mosque's Facebook page carry none) |
| Saipan (NMI) | negative this pass (English and Chamorro terms): no tenant on mawaqit, masjidbox, masjidal, masjidi or masjidway. The athanpro month held from the earlier round remains the only dated surface |
| Palau | **covered**: Diyanet Koror 365 rows |
| Niue | **covered**: Diyanet Alofi 365 rows |
| Marshall Islands (Majuro) | negative (English): the Ahmadiyya mosque page gives capacity and history, no times; `AhmadiyyaRMI` is walled; no platform tenant |
| FSM | negative (English): no tenant, no timetable; the Palikir closure stands |
| Nauru, Tuvalu, Tokelau | negative (English): aggregators only; the Ahmadiyya Tuvalu mosque page gives no times |
| Cook Islands (Rarotonga) | negative (English and Cook Islands Maori): news coverage of Masjid Fatimah, no dated table |
| American Samoa | not re-opened: tawkit's Pago Pago year is already banked by the platform census |
| Kiribati | the Ahmadiyya Ramadan-2026 Tarawa post is an image with no extractable asset through the public route; the turktakvim 5,475 cells banked earlier stand as the dated layer |
| Solomon Islands | negative (English and Pijin): no tenant, no dated table |
| Vanuatu | **covered**: Diyanet Port Vila 365 rows |
| Papua New Guinea | **covered**: Diyanet nine towns, 3,285 rows |

## 7. New Caledonia 2027 and Tonga year two

- **New Caledonia 2027: not published.** Re-probed: mawaqit's `?year=2027` rewrites the date
  column while serving the same 2026 values; Diyanet ignores the year parameters; masjidway
  serves a rolling window of about one month. Noumea holds three 2026 surfaces: mawaqit 365,
  Diyanet 365 and masjidway Mar-Jun 122 (18/17, 122/122 within-1).
- **Tonga year two: not met.** Mawaqit is current-year only (Niutoua 365 rows held from last
  round), Diyanet is current-year only, and the Wayback CDX answered 503 on three attempts.
  The buy stays open.

## 8. Defects, traps and new rules

1. **mawaqit always serves a 29-day February.** All **26** mawaqit surfaces carry a phantom
   `2026-02-29`; each file lists it under `phantom_dates` and the row is excluded.
2. **masjidbox timezone labels lie on real tenants**: `perth-islamic-society` and
   `newcastle-muslim-centre` declare `Europe/London`, `nmc` `Africa/Johannesburg`,
   `islamic-society-newcastle-university` `Etc/GMT`, `al-taqwa` `Europe/Helsinki`. The rows are
   local wall clock. The timezone field is not provenance.
3. **masjidway name traps**: `masjid/5508` is "Fiji Jam'atul Islam of America", `5360` a US Omar
   Mosque, `5264` the Islamic Guidance Center of Queens, `5228` ISGH Masjid Maryam Texas. Every
   Pacific-looking hit resolved to North America; the platform's one real Oceania tenant is
   **3820, Centre Islamique de Nouméa**. masjidway also answers 502 and drops connections before
   a rotating host serves 200, and its table window is about one month.
4. **Fiji widget am/pm inversions**: six cells in 2026 print the afternoon as morning; repaired
   against the month median, list in `inversion_repairs`.
5. **Diyanet PNG Morobe** publishes at a point that is not the town (±1.8 min spread).
6. **ICMG Parafield Gardens** carries a fajr defect: 177/365 within-1 on an otherwise clean
   18/17 surface, residuals to -70 min (a hand-entered block).
7. **The asr school must be fitted** (above): a Shafi-only sweep reports a false -52 min asr
   defect on every Hanafi tenant.
8. **Date-line surfaces need the local-date selection** (Tonga, above).
9. **New Zealand's tenants publish boards, not athan tables.** Masjid-E-Umar's four clock
   columns are constant all year (dhuhr 13:50, asr 18:20, isha 21:40); NZ Islamic Cultural
   Trust and Wellington Kilbirnie pin dhuhr 45 minutes after solar noon; Linwood's dhuhr is
   +6.4 with only 180/370 days inside a minute. The DST change is handled correctly on those
   that do track the sun (Linwood dhuhr 13:32 on 2026-04-04 against 12:50 on 2026-04-06), so the
   defect is the hand-set times, not the clock.

## 9. Privacy scrub

Twenty-two captured pages carried the occupying entity's name inside Diyanet's own country
selector; every occurrence was replaced with `[redacted]` in the raw capture. The prayer tables
are untouched. No dataset name, path or report line carries it.

## 10. Open items

- Solomon Islands, Kiribati, Nauru, Tuvalu, Tokelau, Cook Islands, Marshall Islands and FSM hold
  no dated table; every platform pass is negative under the languages named. The next buy is a
  community publisher's own image post, captured and OCR'd with the local Vision binary.
- Tonga year two and New Caledonia 2027 stay open behind current-year-only routes and a 503
  Wayback endpoint at probe time.
- Cairns and Hobart hold no dated table (evidence above). Two of the mission's named cities
  remain negatives, not closures.
- Samoa's second surface would need the Apia community's own page.
