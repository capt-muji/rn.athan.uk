# O1m-19 — Caribbean and Central America depth (year-2 and second surfaces)

Wave O1m-19, opened 2026-11-11. Scope: year-2 for every held Caribbean and Central
American surface, second mosques behind the ten country firsts, the Chaguanas clock
defect, and the Central American tail (Guatemala, Honduras, Nicaragua, El Salvador).
Workspace `$HOME/athan-gitree/census/o1m/o1m-19-caribbean/`. Raw artifacts in
`captures/`, dated rows in `data/`, fits in `fit/`.

## Method that binds the numbers

- **Engine.** adhan 4.4.6 at `Rounding.None`, `HighLatitudeRule.MiddleOfTheNight`
  (never binds below 24N), timezone pinned per surface, dates built from literal
  capture strings. Every fit states its own timezone.
- **Clock by value, never by label.** Each surface was fitted under its declared zone
  and, where the label was in doubt, under the civil zone as well. A wrong label shows
  as a residual that collapses to ~0.2 min MAE on one reading and blows out by 60 on
  the other. The Chaguanas profile is the worked example (section 3).
- **Year resolution.** A mawaqit page carries no year. Each calendar was resolved by
  matching the page's own `times` row against the calendar body: every surface matched
  month 11, so every calendar here is 2026. No system clock enters any dataset.
- **Window degeneracy, measured not assumed.** A fit on a sub-month window cannot
  separate angle from offset at low latitude. Wherever the window is shorter than a
  season, the angle is reported **underdetermined** and only the solar columns carry
  weight. This was tested: on the thirty-day Nassau window every isha angle from 14.0
  to 20.0 deg reproduces at MAE 0.33 with a one-minute offset (section 2.5).
- **Phantom 29 February.** Every mawaqit calendar carries 366 entries with February at
  29 days in 2026. The parser drops 2026-02-29; a platform defect, not a transcription
  error.
- **Grade.** A = 2-3+ distinct fitted years on one recipe; provisional = one published
  cycle; candidate = dated data with no season-long fit.
- **Machine-readable summary.** `fit/FIT-SUMMARY.tsv` carries one row per fit: timezone,
  days held, fajr and isha angle plus offset, asr school and its offset and MAE, the
  three solar offsets, and a window flag that marks every fit too short to determine an
  angle.

---

## 1. Year-2: three doors, three closures

The mission names three year-2 routes. All three were probed against the held surfaces
and each closes with a mechanism rather than an assumption.

### Per-country verdict at a glance

| country | held surface | year-2 verdict | second surface this pass |
|---|---|---|---|
| Cuba | Havana mawaqit 365 | closed (1.1) | none — aggregators only |
| Dominican Republic | Santo Domingo masjidbox 7 | closed (1.2) | none; full recipe read, candidate |
| Puerto Rico | San Juan + Ponce mawaqit 365 each | closed (1.1) | none |
| Haiti | Port-au-Prince mawaqit 365 | closed (1.1) | none — Cap-Haitien is aggregators only |
| Barbados | Bridgetown masjidbox 7 | closed (1.2) | none |
| Belize | Belize City mawaqit 365 | closed (1.1) | none — Belmopan is Facebook only |
| Panama | Panama City mawaqit 365 | closed (1.1) | **+3 tenants**, section 2.2 |
| Costa Rica | San Jose mawaqit 365 (Luz y Fe, Merced) | closed (1.1) | none |
| El Salvador | San Salvador mawaqit 730 | closed (1.1) | none (the second table is also mawaqit) |
| Jamaica | Kingston athanpro 30 | n/a (frozen edition) | none |
| Trinidad | Ilmul Islam 365 | closed (1.1) | **Princes Town 365, San Fernando 7** |
| Bahamas | none held (negative) | n/a | **Nassau athanpro 30**, section 2.5 |
| Nicaragua | none held (FALLBACK) | n/a | **Managua 365**, section 2.1 |
| Suriname | none held | n/a | **Paramaribo 365**, section 2.4 |
| Guatemala | Zona 9 mawaqit 365 | closed (1.1) | none |
| Honduras | San Pedro Sula mawaqit 365 | closed (1.1) | Tegucigalpa stays closed |
| Guyana | none held (negative) | n/a | none — CIOG carries no table |

### 1.1 mawaqit confData year tables — CLOSED

`confData.calendar` is twelve months of six columns — seven where the mosque turns on
`displayingSabahImsak`, which duplicates fajr in a leading column — computed
server-side. It carries **no year field**: the only dated keys are
`hijriDateEnabled`, `hijriAdjustment`, `sabahImsakStartDate` and `sabahImsakEndDate`,
and the last two are null on every surface checked.

Probes against the Belize City tenant:

| probe | result |
|---|---|
| `?year=2025` | HTTP 200, calendar **identical** to base |
| `?y=2025` | HTTP 200, identical |
| `?date=2025-06-01` | HTTP 200, identical |

Captures `captures/probe_bz?year=2025.html` and siblings. The platform serves exactly
one computed cycle, the current Gregorian year.

API routes: `api/2.0/mosque/<slug>/calendar?year=2025` answers **404**; the search
route `api/2.0/mosque/search?q=` answers **401**. No unauthenticated year door.

Wayback CDX holds snapshots for three of the eleven held slugs (Havana 2025-09-11,
Ponce 2025-08-15, San Salvador Dar Ibrahim 2025-04-24 and 2026-05-15). **Every replay
returns a 10,319-byte OneTrust "Age restricted content" page** with no `confData`, on
both the `id_` and plain forms. The archived bytes are not readable through the public
replay. Recorded as a block, not as a country finding.

**Verdict: mawaqit year-2 is unavailable before the 2027 cycle.** Havana, Belize City,
Costa Rica, Guatemala Zona 9, San Pedro Sula, Port-au-Prince, Panama Madina, San Juan,
Ponce and both San Salvador tables therefore stay on one published cycle.

### 1.2 masjidbox dated routes — CLOSED

Santo Domingo Masjid Al Noor (`masjid-al-noor-1703425482723`):

| probe | result |
|---|---|
| base | seven-day window 2026-11-10..2026-11-16 |
| `?date=2025-06-15` | HTTP 200, **identical ld+json** event list |
| `?year=2025` | HTTP 200, identical |
| `/2025-06-15` path form | HTTP 200, 3,847-byte error shell |

The public page is a rolling seven-day server render; `api.masjidbox.com` answers "no
Route matched" on every path. Wayback holds no snapshot of any of the three masjidbox
slugs checked. **Verdict: masjidbox year-2 is closed.**

### 1.3 Own-site annual PDFs

Jamaica Islamic Centre's own site (`jamaicaislamiccentre.com`) carries no prayer block
in its served HTML and no timetable link. Trinidad's Darul Uloom keeps a today-only
block and a monthly table published as an image; the image route was not attempted
this pass and is carried to NEXT.

**No held surface gained a second year this pass.** The ten held mawaqit surfaces were
re-gated live instead (section 2.6) and are unchanged.

---

## 2. New surfaces and second mosques

### 2.1 NICARAGUA — first surface, Managua (NEW COUNTRY)

- **Source:** mawaqit, Mezquita de Managua, `mezquita-de-managua-14038-managua-nicaragua`.
  Capture `captures/mawaqit_ni_managua.html`, rows `data/mawaqit_ni_managua.json`,
  fit `fit/fit_ni_managua.json`.
- **Geometry:** 12.1132 N, 86.2730 W, field `America/Managua`.
- **Rows:** 365 dated rows, 2026.

  | column | recipe | exact | within 1 | MAE | worst |
  |---|---|---|---|---|---|
  | fajr | 15.00 +0 | 354/365 | 365 | 0.25 | 0.52 |
  | sunrise | +0 | 357 | 365 | 0.27 | 0.52 |
  | dhuhr | transit +0 | 357 | 365 | 0.26 | 0.50 |
  | asr | Shafi +0 | 82 | 292 | 1.00 | 2.08 |
  | maghrib | sunset +2 | 358 | 365 | 0.25 | 0.50 |
  | isha | 15.00 +5 | 350 | 365 | 0.25 | 0.53 |

- **Seasonal amplitude:** January fajr 05:03-05:10, July 04:20-04:30 — a 43-minute swing.
- **Grade: provisional**, platform tier, one published cycle. Nicaragua was
  FALLBACK-by-default; this is its first dated surface.

### 2.2 PANAMA — three more Panama City tenants

The held Panama surface is Madina Masjid (365 rows, 18/18.5, maghrib +6). Three further
mawaqit tenants sit inside Panama City, all 365 rows, 2026:

| surface | coordinates | fajr | isha | dhuhr | asr | maghrib | sunrise |
|---|---|---|---|---|---|---|---|
| Musalla Central Panama | 8.9589, -79.5409 | 18.5 +2 | 16.85 +6 | +10 | **Hanafi +1** | +6 | +0 |
| Musallah de Perejil | 8.9752, -79.5372 | 18.5 +2 | 17.05 +5 | +10 | Hanafi +1 | +6 | +0 |
| Musallah La Loceria | 8.9951, -79.5395 | 18.5 +2 | 17.05 +5 | +10 | Hanafi +1 | +6 | +0 |

The three agree on fajr and on every solar column and split on isha between 16.85 +6 and
17.05 +5 — a pair the 9 N year cannot separate cleanly (MAE 0.52 against 0.51), so the
isha angle here is quoted as a near-degenerate pair, not a single number.

Scored on Musalla Central (`fit/fit_pa_musallacentral.json`): maghrib 365/365 within 1
(MAE 0.31), sunrise 365/365 (0.31), asr **Hanafi** 357/365 (0.64) where the Shafi
variant scores 70/365. A second Panamanian line on the Hanafi shadow, distinct from the
held Madina surface.

- **Defect, fajr.** 361/365 within 1 with worst **22.1 min**: 2026-06-08 prints 04:19
  against a 04:41 model. A single hand-edited cell, recorded and not dropped.
- **Defect, sunrise quantisation.** 2026-10-01..10-24 print a constant 06:06 while the
  solar day moves six minutes; maghrib in the same window moves daily.
- **Grade: provisional**, platform tier, one cycle. Perejil and Loceria are a second
  and third Panamanian congregation on the same recipe.

### 2.3 TRINIDAD — Princes Town, and San Fernando's mosque profile

**Masjid-Ul-Ahad, Princes Town** (mawaqit,
`masjid-ul-ahad-aldana-st-850412-princes-town-trinidad-tobago`), 365 rows, 2026,
10.2691 N / 61.3709 W, field `America/Port_of_Spain`:

| column | recipe | exact | within 1 | MAE | worst |
|---|---|---|---|---|---|
| fajr | 15.00 +0 | 358/365 | 365 | 0.25 | 0.52 |
| sunrise | +0 | 356 | 365 | 0.24 | 0.50 |
| dhuhr | +0 | 362 | 365 | 0.24 | 0.50 |
| asr | Shafi +0 | 138 | 365 | 0.63 | 1.48 |
| maghrib | +0 | 359 | 365 | 0.25 | 0.50 |
| isha | 15.00 +0 | 351 | 365 | 0.24 | 0.53 |

**Zero margins on every column** — the cleanest pair of the region beside Belize.
Grade provisional, platform tier.

**San Fernando Jama Masjid** (masjidbox, `san-fernando-jama-masjid`), seven dated rows
2026-11-10..16, offsets `-04:00`, `data/masjidbox_tt_sanfernando.json`. Solar columns
reproduce at zero margin (sunrise 0.24, dhuhr 0.23, maghrib +3 at 0.17) and the asr
column is **Hanafi at zero margin** (0.21) where Shafi sits 53 minutes off. The fajr and
isha angles are underdetermined on seven days and are not claimed.

**Two Trinidad masjidbox profiles disagree on the school.** San Fernando prints Hanafi
asr (16:03) and Chaguanas prints Shafi (15:10 corrected). Both are correct for their own
configuration; the record must not average them.

### 2.4 SURINAME — Paramaribo, first dated year (NEW COUNTRY)

- **Source:** namazvakti.com `Monthly.php?cityID=15847`, twelve monthly pages,
  `captures/nv_sr_paramaribo_2026_01..12.html`, rows
  `data/namazvakti_sr_paramaribo_2026.json`.
- **Geometry:** 5.8422 N, 55.2037 W; the page declares `Time Zone -03:00`, which is
  `America/Paramaribo` with no DST, and the fit confirms the label by value.
- **Rows:** 365 dated rows, 2026, seven printed columns (Fajr-as-imsak, Morning-as-fajr,
  Tulu-as-sunrise, Zuhr, Asr, Maghrib, Isha).

  | column | recipe | exact | within 1 | MAE | worst |
  |---|---|---|---|---|---|
  | fajr | 18.35 +2 | 348/365 | 365 | 0.25 | 0.55 |
  | sunrise | -4 | 211 | 365 | 0.44 | 1.10 |
  | dhuhr | transit +7 | 340 | 365 | 0.26 | 0.58 |
  | asr | Shafi +7 | 225 | 365 | 0.42 | 1.07 |
  | maghrib | sunset +5 | 210 | 365 | 0.44 | 1.08 |
  | isha | 16.75 +8 | 344 | 365 | 0.26 | 0.57 |

- **Tier: platform calculator, not a mosque table.** Its temkin set is sunrise -4,
  dhuhr +7, asr +7, maghrib +5 — the Diyanet-abroad family. Recorded as a recipe,
  **candidate** for provenance: Suriname still lacks a mosque-published surface, and the
  SIV Keizerstraat mosque publishes nothing machine-readable.

### 2.5 BAHAMAS — Nassau on athanpro, frozen edition

- **Source:** `athanpro.com/countries/bahamas/nassau`, capture
  `captures/athanpro_bs_nassau.html`, rows `data/athanpro_bs_nassau_sep2026.json`.
- **Rows:** 30 dated rows, **September 2026 only**. The page's own text promises "today
  and the full current month"; the table served is September, and `?date`, `?month` and
  `?year` all return the same 150,642 bytes. Consistent with the frozen-September build
  the record already carries.
- **Solar columns reproduce at zero margin** (maghrib 30/30 exact, sunrise 29/30, dhuhr
  29/30), so the coordinates and the clock are sound.
- **Angles are underdetermined.** A one-month window at 25 N cannot separate angle from
  offset: every isha angle from 14.0 to 20.0 deg reproduces at MAE 0.33 with a
  one-minute offset. The page's own label, "Muslim World League", is therefore neither
  confirmed nor refuted by this table and is not claimed.
- **Grade: candidate.** This is a platform calculator, **not the Bahamian mosque**. The
  real institution is Jamaa' Ahlus Sunnah; its Facebook and directory pages carry no
  dated table (section 5).

### 2.6 THE HELD SURFACES, RE-GATED LIVE

All ten held mawaqit surfaces were fetched fresh and their `confData.calendar` compared
to the O1l capture. **Every calendar is identical**, on every month and every column:
Belize City, Costa Rica Mercedes, Guatemala Zona 9, Honduras San Pedro Sula, Haiti
Chalon, Panama Madina, Puerto Rico Ponce and San Juan, El Salvador Dar Ibrahim and
La Luz. Trinidad's Ilmul Islam is identical too. No regime change, no drift, no silent
edit in the span between the two waves.

---

## 3. THE CHAGUANAS DEFECT — read live, mechanism proven

- **Artifact:** `captures/mb_tt_chaguanas_live.html` (89,493 bytes, live 2026-11-11),
  rows `data/masjidbox_tt_chaguanas.json`, fit `fit/fit_tt_chaguanas.json`.
- **Slug:** `masjidbox.com/prayer-times/masjid-chaguanas-tt`. It has moved since the
  original hold; the held slug no longer resolves.
- **Coordinates:** the page names Newton Street, Chaguanas and carries no latitude or
  longitude. The fit uses the town's 10.5167 N, 61.4167 W. A coordinate error of a few
  kilometres moves the solar columns by under half a minute, so the 0.2-0.4 MAE result
  below does not depend on the exact point.
- **What the platform serves.** The mosque settings blob reads
  `{"country":"TT","verified":true,"settings":{"language":"en",
  "timezone":"America/New_York","azan":150}}`. All seven published rows carry the offset
  **`-05:00`**.

| date | fajr | shuruq | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|
| 2026-11-10 | 03:47 | 04:59 | 10:50 | 14:10 | 16:40 | 17:48 |
| 2026-11-11 | 03:47 | 05:00 | 10:50 | 14:10 | 16:40 | 17:48 |
| 2026-11-13 (Jumuah) | 03:47 | 05:00 | 10:50 | 14:10 | 16:40 | 17:48 |

**The mechanism, measured.** Fitting those rows under the profile's own declared zone:

| column | recipe on the New York clock | exact | within 1 | MAE |
|---|---|---|---|---|
| sunrise | +0 | 7/7 | 7 | 0.26 |
| dhuhr | +0 | 7/7 | 7 | 0.25 |
| asr | Shafi +0 | 7/7 | 7 | 0.22 |
| maghrib | +0 | 6/7 | 7 | 0.35 |
| fajr | 20.55 deg +11 (window underdetermined) | 7/7 | 7 | 0.21 |
| isha | 18.1 deg -5 (window underdetermined) | 5/7 | 7 | 0.25 |

Every solar column reproduces at **0.2-0.4 min MAE on the New York clock** at Chaguanas
coordinates. The platform computes the correct Trinidad solar events and then renders
the local clock with the `America/New_York` offset. Trinidad runs fixed AST (UTC-4) all
year; New York runs UTC-5 from the first Sunday in November to the second Sunday in
March. The consequence is exact:

- **November to early March: every column prints exactly 60 minutes early.** 03:47
  against a correct 04:47; 16:40 against San Fernando's 17:43.
- **March to November: the table is correct by accident**, because New York's daylight
  offset equals Trinidad's fixed offset.

This is the "value flips before the label" the record named. The printed clock follows
the wrong zone's DST rule, so the **values** move an hour on the US switch dates while
the profile's `country` field still reads `TT`. The label lies and the value follows it.

**Fix note for the record, not an adjudication.** The single change that repairs the
profile is `settings.timezone` set to `America/Port_of_Spain`. Nothing in the recipe
moves: the solar columns already reproduce at zero margin, and the asr school is Shafi.

**Correction to O1l-9.** O1l recorded the defect as "a full hour early against San
Fernando's same-day 04:46 / 11:50 / 17:43". Confirmed live, and now with the mechanism
and the season attached: it is 60 minutes early **in the northern winter only**.

---

## 4. Central America

- **NICARAGUA:** from no surface to Managua (section 2.1). First country surface.
- **PANAMA:** four Panama City tenants now (Madina held plus three, section 2.2).
- **GUATEMALA, HONDURAS, EL SALVADOR, COSTA RICA, BELIZE:** all held surfaces re-gated
  live and byte-identical (section 2.6); year-2 closed by section 1.1.
- **HONDURAS Tegucigalpa:** stays closed. `islamhn.org` is live (31,490 bytes) and its
  homepage carries **zero clock patterns**; O1l-30 found none on any of its nav pages
  either. mawaqit returns no HN tenant beyond San Pedro Sula, and the capitals wave
  recorded athanpro with no Honduras city.
- **EL SALVADOR second table year-2:** both San Salvador tables are mawaqit and both sit
  on the current cycle; the Dar Ibrahim Wayback snapshot (2025-04-24) is gated.

---

## 5. Honest negatives, with the languages searched

| place | searched | result |
|---|---|---|
| Dominican Republic, Santiago | ES, EN | Centro Islamico de Santiago "Mezquita Nur Al-Din" is Instagram-only; every dated table is an aggregator (IslamicFinder, Muslim Pro, horarios-salat) |
| Dominican Republic, Santo Domingo (second mosque) | ES, EN | one masjidbox tenant only; no second surface |
| Dominican Republic, Puerto Plata | ES, EN | aggregators only |
| Cuba, Santiago de Cuba | ES, EN | aggregators only; press describes Havana's Mezquita Abdallah as the country's only mosque |
| Haiti, Cap-Haitien | FR, Kreyol, EN | aggregators only; no mosque surface |
| Belize, Belmopan | EN, ES | Ahmadiyya Belize (Masjid Noor, Baitul Lateef) is Facebook/Instagram-only; no dated table |
| Bahamas, Nassau | EN | geocities.ws/nassaumasjid returns 403 and is stale; Jamaa' Ahlus Sunnah has no dated table; cmzapp's page carries no clock values; the held trap (masjidbilalnassau1.org = Farmingdale NY) stands |
| Guyana, Georgetown and Anna Regina | EN | ciog.org is live (26,690 bytes) with **zero fajr hits and no timetable link**; community pages are Facebook-only; athanpro carries Georgetown only |
| Jamaica, Kingston | EN | jamaicaislamiccentre.com serves no prayer block in its HTML; Masjidal's monthly widget serves today+18 and refuses past dates |
| Suriname, Paramaribo | NL, EN | the Surinaamse Moeslim Associatie's own `smawebsite.com/salat-timings/` page **renders with no table** (browser-rendered and checked); no mawaqit tenant; SIV Keizerstraat has no timetable page; the namazvakti grid is a calculator |
| Bahamas (second pass) | EN | `prayers.masjidi.app/the-bahamas` is a settlement directory with no times and no mosque tenant; athanpro's Nassau table is section 2.5 |

Searches were also run for mawaqit tenants by city name in Spanish, Dutch and English
for every country in scope. The only tenants found beyond the held set are the three
Panama City ones, Princes Town and Managua.

The athanpro country index was used for navigation only and is not retained: it is a
list of country slugs carrying no prayer data.

---

## 6. Defects recorded this pass

1. **Chaguanas (masjidbox)** — local clock rendered on `America/New_York`; exactly 60
   minutes early in the northern winter, correct in summer; recipe reproduces at
   0.2-0.4 MAE when put back on the declared clock. Section 3.
2. **Musalla Central Panama (mawaqit)** — one hand-edited fajr cell (2026-06-08, -22
   min) and a 24-day constant sunrise (06:06) where the solar day moves six minutes.
3. **athanpro Nassau** — the page promises "today and the full current month" and
   serves September 2026; `?date`, `?month` and `?year` all return the same bytes.
4. **mawaqit phantom 29 February** — all calendars carry 366 entries with February at
   29 days in 2026.
5. **mawaqit Wayback replay** — every archived snapshot returns a OneTrust age gate
   instead of the page, blocking the only backward-harvest route for that platform.

---

## 7. NEXT

- **January is the mawaqit year-2 window.** The 2027 cycle appears by itself; re-fetch
  every tenant in the region the first week of January and the whole mawaqit block
  moves from provisional toward A on one recipe.
- **Trinidad Darul Uloom** publishes a monthly table as an image. The local Vision OCR
  binary is now available; transcribe it for a second Trinidad mosque surface.
- **Suriname** needs a mosque surface (SIV Keizerstraat, SMSA). The calculator grid is
  a recipe, not a congregation.
- **Guyana** — the CIOG Ramadan sheet the Chronicle reproduces each year is the next
  target; the domain itself has no table.
- **Bahamas** — Jamaa' Ahlus Sunnah needs an own-domain surface; none exists today. The
  masjidi directory lists Bahamian settlements but carries no times.
- **Second mosques still absent by city:** Santiago (DR), Puerto Plata, Santiago de
  Cuba, Cap-Haitien, Belmopan, Anna Regina, Kingston.
