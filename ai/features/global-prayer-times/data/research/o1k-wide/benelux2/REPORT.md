# O1k wide, tag `benelux2` - Belgium, Netherlands, France, Luxembourg (round 2)

Returned 2026-11-10. Six new surfaces, 21 dated data files, 6,966 promoted rows in
`data/`, raw captures in `captures/`.

Method notes that apply to every fit below: prayer times are computed with a NOAA solar
position model (declination + equation of time, true solar noon from longitude), the
zone's own DST offset from `Europe/*`, angle fits on a 0.02-degree grid with a free
half-minute bias, and residuals reported as bias / RMS / max over the whole capture.
A fit is only claimed where RMS is at or under one minute.

---

## Belgium - EMB window boundaries measured, the outside-window isha settled

### Surfaces

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| EMB 2026 calendar | emb-net.be/sites/default/files/horaire_priere_emb_2026.pdf | authority (Executif des Musulmans de Belgique) | full year, 1 Brussels/Antwerpen/Charleroi table + 18 city deltas | 2026 |
| EMB 2025 calendar | emb-net.be/sites/default/files/horaire_priere_emb_2025.pdf | authority (hosted by EMB, printed by Sanabel) | full year | 2025 |
| Sanabel 2026 | sanabel.be/wp-content/uploads/2025/12/Sanabel-horaire-priere-2026.pdf | community printer, same table, "approuvés par le Conseil des Théologiens de Belgique" | full year | 2026 |
| EMB FR page | emb-net.be/fr/horaires-des-prieres | authority | links only (2026, 2025, imsakia 2023) | - |
| EMB NL page | emb-net.be/nl/gebedstijden | authority | links only | - |

The three languages are one artefact: the PDF's own header block prints French, Dutch,
Arabic and Turkish column labels on the same page, and the FR and NL web pages link the
same two files. Sanabel's edition is the second publisher of the identical table: the
parsed 2026 tables agree on all 365 days, all six columns, no exceptions.

### What confirms the record

- **18 published city deltas**, verbatim: Gent +3, Hasselt -4, Liège -5, Luxembourg -6,
  Mons +2, Namur -2, Renaix +3, Tournai +4, Verviers -6, Brugge +5, Kortrijk +5,
  Aalst +1, Maastricht -5, Houthalen -4, Oostende +6, Genk -4, Weert -5, Lokeren +2.
  Note the table serves three countries: Maastricht and Weert (NL), Luxembourg City (LU).
- **Outside-window isha is 18.0, not 17.** Fitting the printed isha of the 262
  non-window days at Brussels (50.8503 N, 4.3517 E) gives angle 18.0 with bias 0.0 and
  RMS 0.52 min, max 1.3. The same fit at 17.0 carries a +7.0 min systematic (RMS 1.14,
  max 4.7). Fajr likewise: 18.0, bias 0.0, RMS 0.96. **The catalog's 18.0 stands, the
  17 object is refuted.** The same holds after the published deltas are applied (Gent
  +3.0, Liège -5.0 fall straight out as pure bias on an otherwise identical residual).

### EMB window-boundary verdict

| Prayer | First day off the real-latitude 18-degree curve | First day back on it | Days |
|---|---|---|---|
| isha | **2026-05-01** | **2026-08-12** (so the window's last day is 08-11) | 103 |
| fajr | **2026-05-10** | **2026-08-02** | 84 |

Measured as the run of days whose residual against the 18-degree time at the city's own
latitude exceeds the rounding tolerance (3-minute level: isha 05-02..08-10, fajr
05-10..07-30, at the 1-minute level the edges extend to 05-01 and 08-11).

**The published window is not the printed window.** The rule printed on page 1 of the
same PDF reads, in French and Arabic, "à partir de la latitude 45, et du début mai à la
fin juillet". The isha start matches (1 May). The end does not: the printed table keeps
a substituted isha until **11 August**, eleven days past "fin juillet".

**The substitution is not a latitude-45 computation, contrary to the record's
"verified literally true".** Three independent reasons:

1. **Flat clock plateaus no solar curve can produce.** Isha prints 23:26 unchanged for
   21 consecutive days (1-21 May) and 23:33 unchanged for 17 days (26 Jul-11 Aug). Fajr
   prints 03:24 unchanged for 21 days (10-30 May) and again for 23 days (10 Jul-1 Aug).
2. **Fajr inside the window dips to 03:08 at the solstice** and returns to 03:24 at both
   edges, a latitude-45 18-degree fajr bottoms out at 03:22 and varies continuously. No
   constant-angle latitude-45 model reproduces 3:08.
3. **The isha arc does track latitude 45, but only in the middle.** For 22 May-25 Jul
   the printed isha matches the latitude-45 18-degree time at Brussels' longitude with
   mean +1.4 min and RMS 1.8 (max 4.6) over 65 days. Outside that middle stretch it does
   not.

The pattern that reproduces the whole window is: isha = max(latitude-45 18-degree value,
the real-latitude value at the adjacent outside day) - a lat-45 arc floored at 23:26 on
the way in and 23:33 on the way out, those two floors being the real-latitude isha on
30 April (23:25) and 12 August (23:33). Fajr is a frozen clock at 03:24 for the two
plateaus with a free arc between. **Any build must carry the plateaus, not a latitude-45
formula.**

### Year-2 finding: the Belgium calendar is perpetual

The 2025 and 2026 editions print **identical times on every month-day of the year**,
differing only on the two DST-transition days, where each edition bakes its own year's
transition date (2025: 29/30 March, 2026: 28/29 March). The table is a day-of-year
series with baked DST dates, not a per-year computation. A second Belgium year therefore
adds no information, the window boundaries are day-of-year constants.

### New

`data/be-emb-bruxelles-2026.json` (365), `be-emb-bruxelles-2025.json` (365),
`be-sanabel-bruxelles-2026.json` (365, identical table), and delta-applied
`be-emb-{gent,liege,mons,brugge,antwerpen,charleroi,luxembourg}-2026.json`. The
delta-applied files are derived from the published offset, not measured per city, and are
labelled so.

### Honest negatives

No 2027 edition exists on either language page (the newest link is 2026). No separate
regional PDF for Wallonia or Flanders: one table plus deltas is the whole country.

---

## Netherlands - the consensus statement found, and the country closed on measurement

### Surfaces

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| VIN declaration | moskeewijzer.nl/wp-content/uploads/2023/12/verklaring-vin-gebedstijden-2024-nl.pdf (+ `-ar.pdf`) | authority (Vereniging Imams Nederland, The Hague, 2 Dec 2023) | method statement, no table | - |
| Consensus catalogue | moskeewijzer.nl/times/2026/<City>_2026.xlsx | community (2023 consensus), 242 city files | full years, day fractions, 7 columns incl. imsak | 2026 |
| Consensus catalogue, 2025 | moskeewijzer.nl/times/2025/<City>_2025.xlsx | community | full years | 2025 |

### The method statement (new to the record)

VIN's declaration is the primary document behind the scheme the census carried second
hand. It states: the International Platform for Prayer Times (salatcalendar.com,
M. Shawkat Odeh) method, **18 degrees fajr, 17 degrees isha**, accurate "nine months of
the year", and for "end of May, June and July", when the signs disappear, **isha capped at
23:30 and fajr floored at 03:30**. Signed The Hague, 2 December 2023, by the VIN board.

### What the measurement says

Eight city-years parsed (Amsterdam, Utrecht, Rotterdam, Ypenburg x 2025 and 2026,
Ypenburg is The Hague's Ypenburg district and stands in for Den Haag, see negatives).
2,920 rows. The published scheme reproduces the printed tables almost exactly:

| City, year | fajr 18deg + 03:30 floor | isha 17deg + 23:30 ceiling |
|---|---|---|
| Amsterdam 2026 | bias +0.06, RMS 0.74, max 2.1 | bias +0.05, RMS 0.70, max 2.1 |
| Amsterdam 2025 | bias +0.06, RMS 0.74 | bias +0.08, RMS 0.66 |
| Utrecht 2026 | bias +0.04, RMS 0.78, max 2.0 | bias +0.02, RMS 0.67, max 2.0 |
| Rotterdam 2026 | bias +0.03, RMS 0.72, max 2.0 | bias +0.02, RMS 0.64, max 2.0 |
| Ypenburg 2026 | bias +0.00, RMS 0.75, max 2.0 | bias -0.03, RMS 0.65, max 2.0 |

Between 214 and 230 of the 365 days match to the exact minute per city-year. The caps are
literal: Amsterdam 2026 prints 03:30 on 98 days and 23:30 on 104 days.

**The caps bind wider than the statement says.** VIN describes "end of May, June, July",
the printed tables floor fajr for **95-99 days from 2-4 May to 6-8 August** and cap isha
for **102-104 days from 1-2 May to 11-12 August**. A build must use the printed span.

Cities are genuinely different tables, not one national table: Amsterdam and Utrecht
differ by 1-2 minutes, Rotterdam by up to 4, consistent with a per-coordinate
computation.

### Verdict

The Netherlands moves from candidate to **measured provisional**: one published scheme,
two independent years, four cities, sub-minute fit, and the publisher's own statement in
hand. The census lift ("fit Essalam's rolling year against the consensus") is satisfied
and exceeded.

### Honest negatives

**Den Haag has no file in the 242-city catalogue** - no `Den_Haag_2026.xlsx`, no
`'s-Gravenhage`, no `Den%20Haag` (all 404, and the string "Haag" does not occur in the
catalogue page at all). The Hague is covered only through Ypenburg, Voorburg, Wassenaar
and Zoetermeer. No 2027 edition (404). Searched in Dutch.

---

## France - a second publisher's monthly table, and two method statements

### Surfaces

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Grande Mosquée de Paris, monthly poster | grandemosqueedeparis.fr/horaire-des-prieres-paris (poster image "HEURES PRIERE - PARIS - GMP - NOVEMBRE 2026.jpg") | authority | November 2026 Paris, 30 rows, transcribed | 2026 |
| GMP city pages | grandemosqueedeparis.fr/horaire-des-prieres-{lyon,lille,toulouse,bordeaux,marseille} | authority | page exists, **no dated table** | - |
| CMR / CTIR harmonisation | cmrofficiel.fr/actions/harmonisation-des-horaires-de-priere/ | authority (Conseil des Mosquées du Rhône) | method statement + observation campaign | 2019- |
| CTIR calendar | cmrofficiel.fr/wp-content/uploads/2025/05/Horaire-CTIR-horaire-2020.pdf | authority (CTIR) | full year 2020, 366 rows | 2020 |
| APBIF methodology | apbif.fr/methodologie-determiner-horaires-priere-apbif | community publisher, stated method | none dated | - |
| Grande Mosquée de Lyon | mosquee-lyon.org/horaires-de-priere/ | community | none: embeds a mawaqit widget | - |

### GMP Paris, November 2026 - new, measured

The Grande Mosquée de Paris publishes its own monthly table as a poster image on its
Paris page. 30 rows transcribed by eye from the 1240x1764 render
(`captures/fr-gmp-paris-novembre-2026.jpg`, `data/fr-gmp-paris-2026-11.json`). Measured
against Paris (48.8566 N, 2.3522 E):

- **isha - maghrib = 87 minutes on all 30 days, zero variance.** A fixed interval, not an
  angle.
- fajr - sunrise = 96 to 98 minutes (mean 97.2), a fixed-interval reading is the honest
  one, an angle fit cannot be separated on one month.
- dhuhr = true solar noon + 5 (max deviation 1 min), maghrib = sunset + 3, asr = Shafi
  - 1, sunrise = standard -0.833.

This is a real dated table from a national authority that the record held only as
"platform", and it carries the same fixed-interval isha signature the Philippines
workstream found. The recipe is not the Algerian ministry's 18/17.

### CTIR / CMR - the French method statement, and a statement-vs-table divergence

The Conseil Théologique des Imams du Rhône adopted a single method on 30 November 2019,
now carried by the Conseil des Mosquées du Rhône: about 40 mosques of the Rhône
department, derived from observation campaigns at Mont Thou (609 m) and Miribel (200 m),
documented with timed photographs, and published against UOIF 12deg, ISNA 15deg and the
18deg astronomical twilight for comparison.

- **The press statement says fajr 13.5deg, isha 14.5deg** (Saphirnews, 3 Dec 2019,
  quoting Azzedine Gaci, rector of the Villeurbanne mosque).
- **The CTIR's own 2020 calendar prints the mirror image.** Fitting all 366 days of
  `Horaire-CTIR-horaire-2020.pdf` at Lyon (45.7640 N, 4.8357 E): fajr best fits **14.5deg**
  (bias +0.37, RMS 0.83, max 1.6) and not 13.5deg (bias -6.63, RMS 1.72), isha best fits
  **13.5deg** (bias +0.66, RMS 0.86, max 1.7) and not 14.5deg (bias -6.31, RMS 2.05).
  Supporting margins: sunrise -0.6, dhuhr +5.5, maghrib +2.7, asr Shafi +0.7.

Recorded as a divergence, not a correction: the printed table is the evidence, the quoted
pair is the statement, and they disagree by 1 degree in opposite directions.

APBIF (Association des Projets de Bienfaisance Islamiques en France) publishes a third
method: observation of the signs, and for the region north of the Strasbourg-Saint-Brieuc
line (48deg33') an estimate from the nearest place where the sign is observable, with an
explicit refutation of 12-degree methods. No dated APBIF table was reachable.

### Honest negatives

- GMP's Lyon, Lille, Toulouse, Bordeaux and Marseille pages exist and return 200 but carry
  no poster or table, only Paris is populated. Marseille therefore has no GMP table.
- The Grande Mosquée de Lyon publishes no table of its own: its horaires page is a
  mawaqit iframe (`mawaqit.net/fr/w/grande-mosquee-de-lyon-lyon-69008-france`), i.e. the
  platform class the record already holds.
- Wayback is a dead route for the GMP page: every snapshot of
  `grandemosqueedeparis.fr/horaire-des-prieres-paris` (2022-2025, 40+ captures) replays as
  an "Age restricted content" consent wall, so earlier months cannot be recovered that way.
- Searched in French: annual mosque PDFs for Lyon and Marseille, federation method pages
  (CFCM, AMIF, UOIF), and French publisher calendars. The annual-calendar sites that rank
  (al-kanz, mektoube, horaire-prieres.fr) are computed feeds, not witnesses, and were not
  banked.

---

## Luxembourg - the record's silence broken

### Surfaces

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Shoura (ACM) 2026 calendar | shoura.lu/wp-content/uploads/2025/12/Horaire-des-prieres-2026-FR.pdf | authority (Assemblée de la Communauté Musulmane du Grand-Duché de Luxembourg) | full year, 12 pages, French | 2026 |
| ACM home | www2.islam.lu | authority | links the Shoura PDF, plus a `Calendrier2022_Verso.pdf` | 2022 |
| EMB delta table | emb-net.be 2026 PDF | authority-adjacent | Luxembourg City at Brussels -6 | 2026 |

### What the table is

365 rows parsed (`data/lu-shoura-luxembourg-2026.json`), French, with Hijri day and
Jumou'a marks. Measured at Luxembourg City (49.6116 N, 6.1319 E):

- **isha = 12.9deg**, bias -0.49, RMS 0.63, max 2 over the full year, no cap and no
  high-latitude rule needed.
- **fajr = 13.0deg**, residual under 2 minutes in every month except one (see defects).
- sunrise and sunset are the standard -0.833 values (bias -0.3 and +0.1), dhuhr = solar
  noon, asr Shafi.

So Luxembourg prints a **13/13 pair** - neither the Belgian 18/18 next door nor the
French fixed-interval table, and a genuinely distinct national practice.

### Source defects worth carrying

- **March maghrib is +6 minutes for the whole month** (1-31 March, every day, against a
  +0.1 baseline for the rest of the year).
- 2026-10-02 dhuhr prints 13:34 where its neighbours are 13:25 and 13:24.
- 2026-10-25, the DST-change day, is not shifted for fajr (06:57 printed where the zone
  says 05:56), the other five columns are correct.
- 2026-11-18 and 11-19 print as "18.10." and "19.10." - the November page carries two
  October-stamped day keys.

### Honest negatives

No 2025 or 2027 edition at the predictable upload paths (404), and the Wayback CDX has no
prayer-horaire capture for the domain. Searched in French and German: the CCIL site, the
Shoura site, masjidbox and mawaqit pages for CCIL Mamer, CCIL Nordstad and the Association
Islamique de Luxembourg (all platform class, none an own table).

---

## Totals

| Country | Surface state | Rows |
|---|---|---|
| Belgium | confirmed + window measured + second publisher | 3,650 |
| Netherlands | confirmed + statement + 8 city-years | 2,555 |
| France | new GMP monthly + CTIR year + two statements | 396 |
| Luxembourg | new national year | 365 |
| **Total** | | **6,966** |

Fits that reached sub-minute RMS and can be built on: Belgium outside-window 18/18
(0.52/0.96), Netherlands 18/17 with the 03:30 and 23:30 caps (0.64-0.78 across eight
city-years), CTIR Lyon 14.5/13.5 (0.83/0.86), Luxembourg 13.0/12.9 (0.96/0.63), GMP Paris
November's fixed 87-minute isha.

Fits that must NOT be built as a single parameter set: the Belgian summer window (plateaus
plus a lat-45 arc plus two floors).
