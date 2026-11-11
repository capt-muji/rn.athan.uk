# O1m-17 India state layer (round o1m, wave 17)

Mission: the waqf boards and the second-city mosque tables behind the fourteen-city mosaic, and the
isha-17 line question. Standing orders `../BRIEF.md`, fit rules `../FIT-RULES.md`. Workspace
`$HOME/athan-gitree/census/o1m/o1m-17-india/`. The repository was not touched.

Status: incremental. Every number below is script-counted from `data/`, `fit/` and `captures/`.

## Headline

1. **India gains a national publisher layer of 70 cities on one recipe.** The Islamic Academy
   (Plano, Texas) publishes a perpetual Hanafi timetable per city with declared coordinates and a
   text layer. All 70 city tables are parsed, fitted and graded: **one recipe, fajr 18.0, isha 18.15,
   Hanafi, margins dhuhr +1, asr +1, maghrib +4**, at **24,768 of 25,200 cells within one minute
   (98.3 percent)**. This is the largest single Indian surface the programme has found, and it covers
   Lucknow, Kanpur, Nagpur, Patna, Bhopal, Indore, Surat, Vadodara, Vijayawada and Delhi,
   every one of them a standing negative in the record.
2. **Twenty-three new mosque-tier cities fit A, two dated years each at zero margins.** 37
   tenant-years are harvested across eight states. Twenty-six classify as solar tables, and **24 tenant-years
   (23 new cities) hold 99 percent or more of all-six columns within one minute on both 2025 and
   2026**. Every one is validated by the address its own page prints in JSON-LD.
   Fifteen more tenants are iqamah clocks and are recorded as such.
3. **Lucknow is no longer negative.** A mawaqit tenant, Masjid al-Khizr, reproduces **365 of 365 days
   at 18/18 Hanafi with a maghrib pad of three minutes**. The city the record has held closed since
   O1l now carries a dated mosque table.
4. **The isha-17 line is not one national line.** At mosque tier 19 of 43 tables reproduce isha at
   17 degrees and 10 at 18. At publisher tier all 70 reproduce at 18. The 17-degree reading is
   **4.22 to 5.12 minutes earlier** than 18 and the gap correlates **0.978 with latitude**. Both
   lines are real, and the choice between them tracks the publisher.
5. **No waqf board that answered publishes a daily table.** Nine boards were probed and six were read
   from their own menus. Three are unreachable from this network and hold no claim either way. The
   record's authority-tier negative stands on a second, wider pass in eight languages.

## Method

- Points are published, not guessed: the mawaqit pages carry latitude and longitude, and the Islamic
  Academy PDFs print the coordinate pair the table was computed for. Where a table names no point,
  the point is solved from its own sunrise and transit columns, because those two columns carry no
  angle term.
- Engine: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
  `Rounding.None`, timezone pinned to `Asia/Kolkata`, dates from the literal capture strings. No
  clock is read anywhere.
- Tenant identity: every masjidbox tenant is validated by the `PostalAddress` in its own JSON-LD
  (`data/mbx-address-validation.json`, pages in `captures/mbx-page-*.html`). Slug text carries no
  location weight.
- Tools: TinyFish for discovery, curl with a browser user agent for capture, agent-browser for the
  one Inertia SPA (West Bengal), `pypdf` for the timetable PDFs, the local Vision OCR binary for
  nothing (no capture this wave needed it).

## Front 1: the waqf boards

Nine board surfaces were opened. Six answered and their own navigation was read. Five serve property,
regulation, recruitment and UMEED notices only, and one serves a marriage and divorce registry. Three
state boards are unreachable from this network.

| board | surface read | prayer table |
|---|---|---|
| Uttar Pradesh Sunni Central Waqf Board | `upsunniwaqfboard.org`, full menu captured | no. Menu carries Waqf Act, rules, WAMSI, holidays, FAQ, AUQAF registration, district AUQAF property lists, UMEED |
| Madhya Pradesh Waqf Board | `mpwaqfboard.org`, full menu captured | no. Regulations, circulars, forms, property PDFs |
| Maharashtra State Board of Wakf | `mahawakf.com`, menu plus `Qazat` page read | no. `Qazat` is the Kazi (marriage registrar) system, 200 years old in Marathwada, not a timetable |
| West Bengal Board of Auqaf | `auqafboardwb.org`, Inertia SPA rendered, notice board opened | no. Notice board holds an auction of Mazar chadars, an OSD recruitment notice and a hostel admission notice |
| Kerala State Wakf Board | `keralastatewakfboard.in`, menu captured | no. UMEED forms, gazette, circulars, cause lists |
| Tamil Nadu Wakf Board | `bcmbcmw.tn.gov.in/wakfboard.htm` read; it points to `tnwb.tn.gov.in`, which does not answer | no, on the one page that does answer |
| Telangana State Waqf Board | `waqf.telangana.gov.in` does not answer; `waqf.zestwings.com/eqazzath_web/` read in full | no. eQAZZATH is a marriage, divorce and khula certificate portal |
| Karnataka State Board of Auqaf | `karwaqf.karnataka.gov.in` does not answer; `kswcwd.com` read | no. Council pages, schemes, RTI |
| Gujarat State Waqf Board | `waqfboard.gujarat.gov.in` does not answer; `/PTRs/Index` indexed, not fetched | not read, network block |

The three that do not answer (`waqf.telangana.gov.in`, `karwaqf.karnataka.gov.in`,
`waqfboard.gujarat.gov.in`, plus `mahawaqf.maharashtra.gov.in` and `tnwb.tn.gov.in`) time out at 30
seconds from this host. They are recorded as unreachable from this network. No claim is made about their contents.

**The Wayback replay is filtered by this network.** `web.archive.org` returns an ISP content-filter
page titled "Age restricted content" on every request, while `archive.org/wayback/available` answers
normally and reports snapshots for both blocked boards (Telangana 2026-04-26, Karnataka 2023-12-09).
The dated archive of those boards is therefore known to exist and is not readable from this session.

**Language pass.** Eight languages were searched for a board timetable beside English: Hindi
(`नमाज़ का समय सारणी वक्फ बोर्ड उत्तर प्रदेश`), Urdu (`نماز اوقات وقف بورڈ تلنگانہ حیدرآباد`),
Kannada, Telugu, Tamil, Malayalam, Bengali and Gujarati. Every hit was a computed aggregator
(islamicfinder, salah.com, praytime, dawateislami, sajda.com, ezani, hamariweb) or a political news
item about the Waqf Amendment Bill. No board publishes a dated prayer table as text, in either
script.

## Front 2: mosque tier, 37 tenant-years, 23 new A cities

Discovery ran state by state with the state name inside the query, which is how the platform's
own address text is indexed, then every tenant was validated by its JSON-LD address. Harvest route:
`api.masjidbox.com/1.0/masjidbox/landing/athany/<slug>?get=at&days=7&begin=<date>`, seven-day
windows, three concurrent workers, 429 backoff.

### The solar tables, 18/17 and 18/18, zero margins

Both years, 99 percent or more of all six columns within one minute, at the point solved from the
table's own sunrise and transit:

| city | state | point | recipe | 2025 | 2026 |
|---|---|---|---|---|---|
| Anantapur | Andhra Pradesh | 14.66 / 77.48 | 18 / 17 Shafi, zero | 365/365 | 365/365 |
| Asansol | West Bengal | 23.66 / 86.86 | 18 / 18 **Hanafi**, zero | 351/351 | 365/365 |
| Bhavnagar | Gujarat | 21.78 / 72.02 | 18 / 17 Shafi, zero | 365/365 | 351/351 |
| Bidar | Karnataka | 17.90 / 77.40 | 18 / 17 Shafi, zero | 365/365 | 365/365 |
| Bishnupur | West Bengal | 22.38 / 88.14 | 18 / 17 Shafi, zero | 351/351 | 351/351 |
| Etawah | Uttar Pradesh | 26.80 / 78.90 | 18 / 17 Shafi, zero | 365/365 | 351/351 |
| Guntur | Andhra Pradesh | 16.32 / 80.30 | 18 / 17 Shafi, zero | 344/344 | 344/344 |
| Howrah | West Bengal | 22.58 / 88.18 | 18 / 17 Shafi, zero | 365/365 | 365/365 |
| Jaigahan | Uttar Pradesh | 26.16 / 82.86 | 18.2 / 17.9 Shafi, -1 on the solar three | 351/351 | 365/365 |
| Kalamb | Maharashtra | 18.88 / 73.06 | 18.2 / 17.9 Shafi, -1 on the solar three | 344/344 | 344/344 |
| Kodagu (Siddapura) | Karnataka | 12.24 / 75.76 | 18 / 17 Shafi, zero | 351/351 | 351/351 |
| Mughalsarai | Uttar Pradesh | 25.26 / 83.00 | 18 / 17 Shafi, zero | 351/351 | 351/351 |
| Mumbai (Ghatkopar) | Maharashtra | 19.12 / 72.78 | 18 / 17 Shafi, zero | 358/358 | 351/351 |
| Murshidabad (Raigram) | West Bengal | 23.82 / 87.96 | 18 / 17 Shafi, zero | 351/351 | 351/351 |
| Ramagundam | Telangana | 18.80 / 79.38 | 18 / 17 Shafi, zero | 351/351 | 351/351 |
| Ramanagara | Karnataka | 12.68 / 77.16 | 18 / 17 Shafi, zero | 344/344 | 344/344 |
| Robertsonpet (KGF) | Karnataka | 12.98 / 78.08 | 18 / 18 Shafi, dhuhr +1 | 351/351 | 351/351 |
| Shahabad | Uttar Pradesh | 27.64 / 79.82 | 18 / 17 Shafi, zero | 351/351 | 350/350 |
| Solapur | Maharashtra | 17.64 / 75.78 | 18 / 17 Shafi, zero | 365/365 | 365/365 |
| Thenhipalam | Kerala | 11.08 / 75.76 | 18 / 18 Shafi, zero | 351/351 | 351/351 |
| Utelwa | Uttar Pradesh | 26.48 / 81.44 | 18 / 17 Shafi, zero | 351/351 | 365/365 |
| Vijayapura | Karnataka | 16.80 / 75.56 | 18 / 17 Shafi, zero | 351/351 | 365/365 |
| Vylathur | Kerala | 10.56 / 75.90 | 18 / 18 Shafi, zero | 351/351 | 351/351 |
| Wanaparthy | Telangana | 16.40 / 77.80 | 18 / 17 Shafi, zero | 351/351 | 365/365 |

Twenty-three of these are new cities beyond the thirteen already held. Mumbai is a second-layer
tenant at Ghatkopar.

The two years are genuinely recomputed: comparing the same month-day across the pair, the **median
tenant moves 41.4 percent of its printed rows**, and the range runs to 56.7 percent (Saharanpur). The
four pairs that move nothing at all are a relabelled edition, and none of them rises to A.

### The two-year test that fails, and why

- **Chelambra (Paingottoor), Kerala**: 17.95 / 18.10, 330/344 in 2025 and 350/365 in 2026, and its
  two year files print the same value on every shared month-day. One computed generation relabelled,
  so it stays provisional.
- **Perintalmanna, Kerala**: a different family, 19.55 / 18.60 with dhuhr +3, 261/365 and 90/351.
  Candidate. Kerala's mosque tables are not the north Indian pair.
- **Saharanpur**: 18.1 / 17.75 with the solar three at -1, 344/351 in 2026. Provisional.

### Lucknow, and the Kanpur near miss

| surface | city | point | recipe | score |
|---|---|---|---|---|
| Masjid al-Khizr (mawaqit) | Lucknow | 26.890 / 80.970 | 18 / 18 **Hanafi**, maghrib +3 | 365/365 |
| Masjid Umar bin Khattab (mawaqit) | Kanpur | 26.474 / 80.340 | 18 / 18 Shafi, dhuhr +1, **isha +17 fixed** | 7/365 |

Lucknow's table is, to the minute, the Islamic Academy Lucknow table for the same date. On 1 January
the mosque prints fajr 5:32, sunrise 6:55, zawal 12:10, asr 15:48, maghrib 17:27 and isha 18:47, and
the publisher prints 5:32, 6:55, 12:10, 15:49, 17:28 and 18:47. A mosque and an overseas publisher
printing one generation is the cleanest cross-tier agreement this wave found. It puts the city's line
at 18/18 Hanafi, beside the 18/17 that the southern Shafi tenants carry.

Kanpur's isha sits a fixed 17 minutes above 18 degrees while its other five columns are solar, the
same fixed-interval class as Vientiane.

## Front 3: the publisher layer, 70 cities on one recipe

The Islamic Academy (`islamicacademy.org`) serves an India index of 100 entries over 96 city names.
Half the entries are a PDF, half a page that links an Excel workbook. The PDFs carry a full text
layer, the city's coordinate pair printed in the header, and twelve months of eight columns. 70
distinct cities were fetched and parsed. The rest of the index is a duplicate entry (`Madras` for
Chennai, `Calicut` for Kozhikode, `Banka` for Bhagalpur) or an Excel-only workbook not taken.

Parsed shape: `{date: {fajr, sunrise, zawal, asr, maghrib, isha}}`, 365 rows per city. The printed
"Zuhr" column is zawal (transit), so the fit reads it as transit, not as a padded zuhr.

**One recipe across all 70:** fajr angle 17.90 to 18.10, isha angle 18.10 to 18.25, Hanafi asr, and
one margin set, **dhuhr +1, asr +1, maghrib +4, everything else zero**, on 64 of 72 tables. Total
24,768 of 25,200 cells within one minute, 98.3 percent. Thirty-three tables hold 100 percent of
all-six days.

Best and worst of the family:

| city | point | fajr | isha | all six |
|---|---|---|---|---|
| Ajmer | 26.43 / 74.62 | 17.95 | 18.15 | 360/360 |
| Hyderabad | 17.37 / 78.47 | 18.00 | 18.15 | 360/360 |
| Nagpur | 21.13 / 79.08 | 18.00 | 18.25 | 360/360 |
| Pune | 18.52 / 73.87 | 17.95 | 18.15 | 360/360 |
| Delhi | 28.60 / 77.20 | 18.00 | 18.10 | 356/360 |
| Lucknow | 26.85 / 80.92 | 17.95 | 18.15 | 356/360 |
| Kanpur | 26.47 / 80.33 | 17.95 | 18.10 | 358/360 |
| Patna | 25.60 / 85.12 | 17.90 | 18.15 | 339/360 |
| Mahagama (Bihar) | 25.02 / 87.32 | 18.00 | 18.15 | 319/360 |

The family degrades eastward and at the Bihar and Bengal margin, where the printed minute grid is
coarser against a rising horizon. Grade **provisional, community tier**: a perpetual undated table
is one published cycle that a later round can re-test against a datable edition.

## Front 4: the isha line, measured at both tiers

The question was asked at both tiers.

**Publisher tier, 70 cities, 8.07 to 30.12 north.** At 18 degrees the median residual is one minute
late. At 17 it is five minutes late and **not one city reproduces 17**. The 17-versus-18 gap runs
**4.22 to 5.09 minutes** and correlates **0.978 with latitude**.

**Mosque tier, 43 tables, all eight states.** 19 tables reproduce isha at 17 within a minute and 10
reproduce it at 18. The rest are iqamah clocks. The gap again runs 4.22 to 5.12 minutes.

The result: the 17-degree isha belongs to the mosque and platform tier. It is the plurality there
and it is absent from the publisher tier, so both readings are printed by real publishers for the
same country on the same days. The earlier record's "india isha 17 from ten city
tables" is the southern and western Shafi tenant line, and it does not extend to the northern and eastern
publishers.

## Front 5: iqamah clocks, recorded as clocks

Fifteen tenants serve an iqamah schedule rather than a solar table. Their sunrise column still tracks
the sun in three of them, which is the Rampur signature. The rest freeze the whole sheet.

| tenant | city | signature |
|---|---|---|
| Masjid al ansar | Hyderabad | one repeated tuple for all 371 days, both years |
| Touheed Educational Trust | Bengaluru | one repeated tuple, both years |
| GM E City Town Prayer Hall | Bengaluru | fajr and maghrib tied, dhuhr 677 minutes off the solar day |
| Jamiya Masjid Bhoopasandra | Bengaluru | same class, both years |
| Madeena Masjid | Chennai | dhuhr +36, isha +37 |
| Khaja Jumma Masjid | Koothanallur | dhuhr -670 (a 12-hour face), both years |
| Al Madina Jumma Masjid | Pudukkottai | 47 distinct tuples in a year |
| Masjid al Noor | Anand | 86 distinct tuples, dhuhr +5, maghrib -52 |
| Masjid e Ihsan | Bardoli | sunrise -18, dhuhr +21 |
| Masjid e Aaisha | Valsad | sunrise -16, maghrib -14 |
| Sunni Jama Masjid Varedia | Varedia | sunrise -16, dhuhr +28 |
| Masjid e Khaleelullah, Masjid e Samad, Masjid Talha, Sondlapara Jama Masjid | Bengaluru, Lucknow, Kolkata | dhuhr +19 to +97 |

## Negatives, with the terms searched

- **Nagpur, Delhi and Patna at mosque tier**: no masjidbox or mawaqit tenant under the city name,
  searched in English and Hindi. Patna's earlier masjidbox hit remains the Turku, Finland decoy.
- **Kerala's print-only route**: the Islamic Academy layer reaches Kerala at four cities (Kozhikode,
  Trivandrum, Fort Cochin, Kayalpattinam) and the mosque tier adds three more (Thenhipalam,
  Vylathur, Chelambra), so the earlier "print-only negative" now has a computed surface. The
  Suprabhatham e-paper was not opened this pass. That stays a queue item.
- **Madhya Pradesh at mosque tier**: no tenant surfaced for Bhopal or Indore in English or Hindi.
  The state board serves no table. Bhopal and Indore hold only the publisher layer.
- **Gujarat's board**: unreachable, so the state's Ahmedabad and Surat tables rest on tenant and
  publisher surfaces only.

## Defects found this pass

1. **The masjidbox API caps the window at seven days whatever `days` asks.** `days=31`, `366` and
   `400` all return seven rows, which is 53 requests per tenant-year and the reason a 37-tenant
   harvest takes half an hour.
2. **mawaqit prints a 29 February in 2026** in all six pages captured, the fourth leap-shaped table
   in the programme after Ireland, Maldives and ACJU. The fit drops it, so each mawaqit tenant scores
   on 365 days not 366.
3. **mawaqit's `/en/m/<slug>` is a redirect to `/en/<slug>`**, and without a following request the
   host answers with a Cloudflare content stub of 733 bytes that looks like a page.
4. **The Islamic Academy PDF prints 31 days in February and stops March at 28**, so February 29 to 31
   carry March 1 to 3 values and March 29 to 31 are absent. A perpetual table cannot know a leap
   year. The fit drops the impossible dates and loses three March days.
5. **Four tenants solve to the corner of their state box.** Anand, Bardoli, Valsad and Varedia have
   no solar core for the solver to lock onto. Each is an iqamah clock and should never have been
   given to a solar solve.
6. **The Wayback replay host is filtered by this network.** `web.archive.org` returns an ISP content
   filter page for every URL, while `archive.org/wayback/available` works. Two blocked waqf boards
   have dated snapshots that this session cannot read.
7. **A centred spread cannot identify a zero-margin fit.** The first sweep ranked candidate angles by
   median absolute deviation about their own median, which a constant offset scores as zero. It
   returned 15 degrees with a 16-minute margin for tables that reproduce exactly at 18/17 with none.
   Ranking on the raw mean absolute residual fixes it, and the corrected sweep finds the true pair at
   every solar table.

## Data held

- `data/`: 150 dated-row files, **54,317 dated rows**. 70 Islamic Academy city-years (25,550 rows,
  `data/iaac/`), 37 masjidbox tenant-years of 2025 and 2026, 6 mawaqit tenant-years, plus
  `data/INDEX.json`, `data/iaac-cities.json`, `data/mbx-address-validation.json` and
  `data/tenant-classification-2026.json`.
- `fit/`: 152 files. One per tenant-year (point, sweeps, madhab probe, margins, per-column
  exact/within-1/worst, seasonal amplitude), one per Islamic Academy city, plus
  `isha-line-india-2026.txt`, `isha-line-mosques-2026.json` and the canonical-recipe probe.
- `captures/`: 205 raw artifacts, 32 MB. 72 timetable PDFs, the India index, nine board pages, the
  rendered West Bengal notice board, six mawaqit pages with their `confData`, and every validated
  masjidbox page.

## NEXT

1. **The Excel-only cities**: Mysore, Nashik, Mumbai, Madurai, Coimbatore, Srinagar, Trichy, Agra,
   Amritsar, Meerut, Chandigarh and Porbandar are served as a 2004-era `.xls` behind `TMS.php`.
   Reading them needs a spreadsheet path this session does not have. Twelve cities sit behind one
   dependency.
2. **The Islamic Academy year test**: the tables are perpetual, so the only way to lift them from
   provisional is a datable edition. Watch the site for a 2027 print, or find a mosque printing the
   same generation and date it.
3. **Kerala's mosque family**: Perintalmanna runs 19.55 / 18.60, which is nowhere near the northern
   pair. Four Kerala tables are banked, and the state needs its own sweep before any recipe is claimed.
4. **The three blocked boards.** Telangana, Karnataka and Gujarat need a fetch that resolves from an
   Indian address, or a dated snapshot read through a host the network does not filter.
5. **Nagpur, Delhi and Patna at mosque tier** remain negative. The publisher layer covers all three.
   An authority or mosque surface does not.
6. **The isha line at authority tier** is still unmeasured, because no board prints a table. If one
   ever does, the 17-versus-18 question can be settled at the tier that matters.
