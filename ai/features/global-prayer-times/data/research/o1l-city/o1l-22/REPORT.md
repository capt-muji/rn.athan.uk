# O1l-22 Europe second cities — France, Italy, Spain, Portugal

Probe window: 2026-11-11, ~04:30-06:10Z. Engine for every fit: adhan 4.4.6
(`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`, TZ pinned per
country (Europe/Paris, Europe/Rome, Europe/Madrid, Europe/Lisbon), dates built from literal capture
strings, no clock reads. Rounding applied per column after second resolution.

## Blocks recorded this pass

- **Wayback is offline.** `web.archive.org/cdx/search/cdx` answered with the "Internet Archive
  services are temporarily offline" page (saved: `captures/es-ccim-cdx-2026.txt`). Every backward
  harvest in this wave is closed at the tool, not at the publisher. Re-run when it returns.
- **mawaqit's public API needs a key.** `api/2.0/mosque/search` returns 401, `api/3.0` 404,
  `sitemap.xml` 404 against its own `robots.txt`. Mosque discovery ran through search-engine
  `site:` queries and then the public mosque page, whose `confData` blob carries the whole year.

---

# France

## Paris — GMP monthly accrual: December not posted

Source: `grandemosqueedeparis.fr/horaire-des-prieres-paris` (Wix page). Authority tier.
The live page still serves `HEURES PRIERE - PARIS - GMP - NOVEMBRE 2026.jpg`
(`fb33fe_4ce1f951fbe74b659543de9b69db2d24~mv2.jpg`). There is no December asset and no post
carrying one. November is held from O1k-W9 (isha = maghrib + 87 exactly); nothing new to bank.
**Honest negative:** December 2026 not published as of the probe. The poster filename is dated, so
the negative is read off the artifact, not inferred.

## Strasbourg — GMS December, held parse reproduced exactly

Source: `www.mosquee-strasbourg.com/wp-content/uploads/pdf-prieres/gms-cal-2026-12.pdf`
(the apex host fails TLS; `www` serves). Community tier.
**31 dated rows, 2026-12-01..31** (`data/fr-gms-strasbourg-2026-12.json`). The two-panel trap is
live and handled: the PDF's text layer draws days 17-31 first, then 1-16. Parse order mapped by the
day-number panel, not by sunrise. **Cross-check: 31/31 rows, 0 differences** against the held
`o1k-wide/europe/data/fr-gms-strasbourg-2026-12.json` on all six columns. That CONFIRMS the held
December parse and the panel remap. Sample: 12-01 06:06 07:52 12:23 14:21 16:43 18:17; 12-31
06:26 08:14 12:37 14:29 16:49 18:25.

## Lyon — two mosques, 730 rows (NEW)

| Surface | URL | Tier | Rows |
|---|---|---|---|
| Grande mosquée de Lyon | `mawaqit.net/en/m/grande-mosquee-de-lyon-lyon-69008-france` | platform/community | 365 (2026) |
| Masjid Attawba, Lyon | `mawaqit.net/en/m/attawba-lyon` | platform/community | 365 (2026) |

Grande mosquée de Lyon (45.7368, 4.8902): **fajr 14.42, isha 13.54**, sunrise 0, dhuhr **+6**,
asr +1, maghrib +3. Scores: fajr 313/365, sunrise 361/365, dhuhr 365/365, asr 345/365,
maghrib 360/365, isha 321/365, all six 258/365. Amplitude fajr 179 min, isha 302 min.
Attawba (45.7883, 4.7931): same fajr 14.42, isha 13.47, sunrise -1, dhuhr +5, maghrib +2; fajr
329/365, isha 325/365, all six 254/365. Two mosques in one city landing on the same fajr angle and
a 0.07-degree isha difference is a shared local convention, not two independent choices.
The +5/+6 dhuhr and +3 maghrib margins are the mosque layer's own, and they sit on top of the
record's CTIR 14.5/13.5 (the Lyon body's 2020 year, mirrored pair). **The Grande Mosquée's isha is
13.5, matching CTIR's printed-mirrored 13.5, not the 14.5 its statement leads with.**

## Lille — one clean surface, one defective (NEW)

| Surface | URL | Tier | Rows |
|---|---|---|---|
| Grande Mosquée de Lille | `mawaqit.net/en/m/grande-mosquee-de-lille-lille-59000-france` | platform/community | 365 (2026) |
| Mosquée Assalam, Lille | `mawaqit.net/en/m/assalam-lille` | platform/community | 365, **fails the gate** |

Grande Mosquée (50.6135, 3.0613): **fajr 12.51, isha 12.66**, sunrise 0, dhuhr +5, maghrib +3.
fajr 302/365, isha 283/365, sunrise/dhuhr/maghrib 365/365, all six 42/365. At 50.6 N the isha
crosses midnight for a midsummer run and the sheet prints it as `00:00`-`00:03`; read literally
that is a 1,440-minute error, so the fit adds 24 h to any isha earlier than maghrib (MAE falls from
76 to 1.30 min). Its asr is the weakest column in the wave (120/365, MAE 2.00).
Assalam is **defective**: its dhuhr margin scatters +5..+29 across the year and its sunrise carries
-59-minute outliers on five days. The columns are hand-edited, not computed. Recorded as a
platform table that fails the suite; not fitted, not banked as a recipe.

## Marseille — two mosques, 730 rows (NEW)

| Surface | URL | Tier | Rows |
|---|---|---|---|
| Mosquée Mariam (Centre Musulman de Marseille) | `mawaqit.net/en/m/mosquee-mariam-marseille-13015-france` | platform/community | 365 (2026) |
| Mosquée Khalid ibn al-Walid | `mawaqit.net/en/m/mosquee-khalid-ibn-al-walid-marseille` | platform/community | 365 (2026) |

Mariam (43.3353, 5.3605): **fajr 13.03, isha 13.02**, sunrise 0, dhuhr +5, asr +1, maghrib +3;
fajr 284/365, isha 288/365, all six 125/365. Khalid (43.3050, 5.3720): **fajr 12.92, isha 12.84**,
sunrise +1, dhuhr +5, maghrib +4, asr 0; fajr 305/365, isha 265/365, asr 365/365, all six 259/365.
Both print 13/13 with a summer softening to 12.7 implied; the month-by-month implied angle falls
smoothly from 13.1 (October) to 12.7 (June) and back, which is a seasonal sweep, not a frozen pair.
No frozen adhan parameter set expresses it. **GMP's Marseille page carries no table** - and neither
does any other GMP city page: all **14** `horaire-des-prieres-<city>` slugs were probed this pass
(Amiens, Besançon, Bordeaux, Clermont-Ferrand, Lille, Lyon, Marseille, Metz, Mulhouse, Orléans,
Poitiers, Rouen, Strasbourg, Toulouse, Tours); 13 return 200 with no poster asset, one slug 404s, and
**Paris is the only populated page**. The Marseille layer exists only on mawaqit.

---

# Italy

## Rome — December PNG not posted; the held poster re-read and the fit closed

Source: `grandemoscheadiroma.org/orario-della-preghiera/` (PNG poster). Authority-adjacent
(the mosque's own body). The live page still serves `uploads/2026/11/novembre.png`; probes for
`2026/12/dicembre.png`, `2026/12/dicembre-2026.png`, `2026/11/dicembre.png` all 404.
The served poster is titled **"Gumādā II 1448h. (novembre – dicembre 2026)"** and runs
**2026-11-11 .. 2026-12-10**, so its tail already carries 10 December rows, all held.
**Honest negative:** no December-2026-prefixed poster exists yet; the accrual is the Gumada II
poster's December tail, already banked.

**Fit (this closes the FIT-INDEX gap "the Rome PNG unfitted"), 30 rows, 2026-11-11..12-10,
41.9353 N / 12.4936 E, Europe/Rome:**
- **fajr 19.02** (30/30 within 1, MAE 0.03)
- sunrise -1 (30/30, MAE 0.40), dhuhr +1 (30/30, 0.00), asr Shafi +1 (30/30, 0.10),
  maghrib +1 (30/30, 0.00)
- **isha = maghrib + 90 exactly, 30/30 rows, one distinct value**
- all six 30/30; amplitude over the 30-day window fajr 28 min, isha 14 min
The record's "fajr 19.1 + isha maghrib + 90" is CONFIRMED and now carries a scored fit. Grade stays
candidate (one published cycle, 30 rows); the lift is a second hijri month, which the poster
rotation will supply.

## Milan, Turin, Bologna — mosque layer (NEW)

| City | Surface | Rows | Recipe | Scores |
|---|---|---|---|---|
| Milan | `mawaqit.net/it/m/moschea-viale-marche-milano-20159-italy` | 365 | 18.00/17.01, all margins 0 | fajr/isha 365/365; all six 204/365 |
| Turin | `mawaqit.net/en/m/moschea-taiba-torino-msjd-tyb-torino-10152-italy` | 365 | **15.00/14.99**, all margins 0 | fajr/isha 365/365; all six 150/365 |
| Bologna | `mawaqit.net/en/m/moschea-annur-bologna-40138-italy` | 365 | 18.00/16.98, all margins 0 | fajr/isha 365/365; all six 224/365 |

Amplitudes: Milan fajr 200 / isha 319; Turin 174 / 302; Bologna 186 / 305. Turin is the outlier at
bare ISNA 15/15, which is a genuine per-mosque choice and not the national line. Five of six columns
sit at zero margin on all three, which is the PrayTimes-v2-family signature the brief names; the
asr column is the platform's known skew (Turin 150/365, Bologna 224/365) and is not a publisher
defect. **The UCOII wrapper was not used as evidence anywhere in this wave**, as instructed: the
mosques' own configured tables are the whole Italy layer here.

---

# Spain

## Madrid — December 2026 is still the hole

Source: `centro-islamico.com/Doc/Horario/2026/<Mes>-2026.pdf`. Community tier (CCIM M-30).
November 2026 returns a valid PDF (403,808 bytes, PDF 1.7) - the control passes.
**`Diciembre-2026.pdf` 404**, and three alternative spellings (`12-Diciembre-2026`,
`Diciembre-2026-v2`, `diciembre`, `DIC-2026`) 404 too. The 2025 edition's December file returns 200
on the same pattern, so the pattern is right and the month is simply unpublished.
**Honest negative, calibrated:** CCIM has not published December 2026. The record's hole stands.
The site's own index page answers 403 to a browser UA, so the listing route is closed as well.

## Granada — two more mosques (NEW, third and fourth surfaces)

| Surface | URL | Rows | Recipe | Scores |
|---|---|---|---|---|
| Masjid An-Noor, Granada | `mawaqit.net/es/m/masjid-an-noor-granada-18011-spain` | 365 | 18.00/17.00, **maghrib +3**, sunrise/dhuhr/asr 0 | all six 306/365 |
| Masjid Omar, Granada | `mawaqit.net/en/m/omar-granada` | 365 | **18.00/18.00**, all margins 0 | all six 274/365 |

Amplitudes 122/240 and 122/241. Both CONFIRM the held Granada 18/17 zero-margin reading (the
Mezquita Mayor's own table), and An-Noor's +3 maghrib is the first Granada-side margin on record.
Omar's 18-degree isha is a third distinct Granada position: the city is not one recipe.
(The Omar page prints a duplicated fajr column; the leading duplicate is dropped at parse.)

## Barcelona, Valencia, Sevilla — three city layers (NEW)

| City | Surface | Rows | Recipe | all six |
|---|---|---|---|---|
| Barcelona | `mawaqit.net/en/m/centre-cultural-islamic-catala-barcelona-08018-spain` | 365 | 18.00/16.99, all margins 0 | 280/365 |
| Valencia | `mawaqit.net/en/m/gran-mezquita-de-valencia-valencia-46021-spain` | 365 | 18.00/16.99, all margins 0 | 339/365 |
| Sevilla | `mawaqit.net/es/m/comunidad-islamica-carretera-amarilla-sevilla-41007-spain` | 365 | 18.00/17.00, asr +2 | 265/365 |
| Sevilla (2nd) | `mawaqit.net/en/m/mezuita-alwahda-sevilla-41920-spain` | 365 | 18.00/17.00, asr +2 | 170/365 |

Amplitudes: Barcelona 153/274, Valencia 138/257, Sevilla 124/241 (both mosques). Barcelona closes
the record's "Tariq's site expired" gap: the city now has a full year on its own mosque's
configuration. Valencia is the cleanest Spanish surface in the wave (339/365 all six, every column
at zero margin except the platform asr skew).

---

# Portugal

## Lisboa, Porto, Coimbra — monthly accrual, and a two-artifact divergence at Porto

Source: `irp.cdn-website.com/cce0f1db/files/uploaded/<slug>_<month>.pdf` (CIL Lisboa hub).
Community tier. Captured for the current month: `lisboa_nov`, `porto_nov`, `coimbra_nov`
(`data/pt-monthly-2026-11.json`).

**Lisboa (26 of 30 rows; the four Friday rows carry a different jumu'ah layout):** every computed
column is **byte-identical to the 2026 annual PDF** - fajr, sunrise, dhuhr, asr, maghrib all at
delta 0 across the month. The sheet drops the 12 deg + 3 isha column and prints the `01:20`
(maghrib + 77) column, plus a five-column jama'ah block. **CONFIRMS** the annual and adds a jama'ah
layer the record does not hold.

**Coimbra (25 of 30, same Friday exclusion):** also **delta 0 on all five computed columns** against
the annual, and prints fajr/sunrise/dhuhr/asr/maghrib plus the 12 deg + 3 isha. **CONFIRMS.**

**Porto (30 of 30): the monthly sheet is a different artifact from the annual.** Sunrise and maghrib
match the annual exactly (delta 0 every day), but the other four columns do not:

| column | monthly minus annual, Nov 2026 |
|---|---|
| fajr | **+3 .. +20** (two-step: 5:45 then 6:15) |
| dhuhr | **+1 .. +6** (fixed 12:30) |
| asr | **+39 .. +54** (15:45 then 15:30) |
| isha | fixed 19:00 then 18:50 |

The monthly prints a half-month convention schedule under the same six column headings as the
annual's "Início da hora das Orações". This is the round-two algorithm-vs-timetable question in
miniature: the hub's computed table and the mosque's posted monthly disagree by up to 54 minutes on
asr. **Not adjudicated**, flagged for the owner. It also means Porto's jama'ah block is not the
annual's times plus an offset.

**Braga: no monthly sheet exists** - the hub serves only `braga_2026.pdf` and `braga_2027.pdf`, with
no `_nov`/`_dez`/`_out` variants. Honest negative; the annual stays the ceiling for Braga.

**Future harvest:** `porto_2028.pdf`, `braga_2028.pdf`, `coimbra_2028.pdf` all return **403**, the
CDN's calibrated absent signal. 2027 remains the forward edge for every Portuguese city.

---

# Cross-country notes

- **The mosque layer does not share one recipe per country.** France: 12.5/12.7 (Lille), 13/13
  (Marseille), 14.4/13.5 (Lyon), each with a summer softening no frozen set expresses. Italy:
  18/17 (Milan, Bologna) and 15/15 (Turin). Spain: 18/17 with four different margin sets, plus one
  18/18 (Granada Omar). The national rows in the census are federation positions; the mosques are
  not.
- **Engine.** Every mawaqit surface in this wave reproduces five of six columns at zero margin on
  adhan 4.4.6. The asr column is the only systematic gap, and its size varies by surface
  (0.47 to 1.63 min MAE). Recorded per FIT-RULES as a platform engine, not a publisher recipe.
- **Span and ceiling.** All platform fits are one year (2026, 365 rows after dropping the Feb-29
  slot the platform ships). One published cycle is a **provisional/community** grade, never A. The
  forward edge for Portugal is 2027 (2028 absent); the mosque layer serves the current year only.
- **Rows banked this wave: 5,490 platform rows** (15 surfaces) + 31 GMS Strasbourg + 30 Rome +
  81 Portugal monthly rows = **5,632 dated rows**, all under `data/`.
- **Raw captures:** 34 artifacts in `captures/`, including the four PDFs, the Rome PNG, the GMP
  Paris and city pages, and the CCIM probes.

# Honest negatives

- GMP Paris December 2026: not published (live page carries the NOVEMBRE poster).
- Rome December 2026: not published (page carries the Gumada II poster; 3 asset paths 404).
- CCIM Madrid December 2026: 404 on five name variants, control 200 for 2025's December.
- Braga monthly: no monthly artifact exists on the hub.
- Lille Assalam: platform table fails the suite (hand-edited columns), not fitted.
- GMP city pages: 14 slugs probed, Paris is the only one carrying a poster.
- Wayback: entire service offline at probe time, so no backward harvest ran this pass.
- mawaqit discovery: no public search API, no sitemap; discovery depended on search-engine
  `site:` queries, so the per-city mosque lists here are **not exhaustive**.
