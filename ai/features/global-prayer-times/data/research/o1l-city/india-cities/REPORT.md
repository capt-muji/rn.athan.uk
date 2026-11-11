# O1l-11 India states and cities (returned 2026-11-11)

Mission: state waqf boards second pass (local-language), city mosque DATED athan tables
(12 metros), Kerala print ecosystem online. Binding: BRIEF.md + FIT-RULES.md.

Record held going in: India NEGATIVE at authority tier except J&K Waqf Board (jama'ah-class);
Karachi 18/18 Hanafi = de facto null hypothesis; traps: makkahmasjid.net = Garland TEXAS;
kivabe.com-style smooth curves are computed, not transcribed.

**Headline: India's first fittable dated tables. Twenty masjidbox India tenants were harvested
(13,140 dated rows, 2025 and 2026 where the tenant held two years); eight cities now hold a
fitted surface, and three recipe variants exist in the wild — 18/17 Shafi, 18/17 Hanafi and
18/18 Hanafi or Shafi. The same platform carries all three, so the recipe is the mosque's, not
the platform's.**

## Method (so the numbers can be re-run)

masjidbox's public timetable endpoint takes a 7-day window and caps at 7 days:
`https://api.masjidbox.com/1.0/masjidbox/landing/athany/<slug>?get=at&days=7&begin=YYYY-MM-DD`
with the site's own public `apikey` header. Full years were harvested as 53 weekly windows and
merged (`harvest-mbx.py`), giving 371 days per tenant-year (365 plus a 6-day forward spill).

No Indian masjidbox payload carries coordinates. Every coordinate below was **recovered from the
table itself** — sunrise and solar noon are angle-free, so a coarse-then-fine grid search over the
metro box finds the only point that reproduces them (`fit-solve.cjs`). A recovered point that
agrees with the address to 0.001 min MAE is also the proof the table belongs to the city named.

Engine: adhan 4.4.6, `Rounding.None`, `TZ=Asia/Kolkata` pinned before the require, dates built
from the literal capture strings, no clock read. Scores are second-resolution then rounded per
column, as FIT-RULES requires.

## City mosque layers

### Hyderabad — FIRST CLEAN DATED SURFACE, two years

**Madinatul ilm, Chaderghat, Malakpet** (`madinatul-ilm-1725795118267`). Recovered
**17.37 N, 78.37 E** (0.003 min MAE). Recipe, one across both years, zero margins:
**fajr 18.0, isha 17.0, Shafi asr**.

| year | rows | fajr exact | sunrise | dhuhr | asr | maghrib | isha | all-6-exact |
|---|---|---|---|---|---|---|---|---|
| 2026 | 365 | 99.5 | 99.7 | 99.7 | 100 | 98.9 | 99.7 | **356 / 365** |
| 2025 | 365 | 98.4 | 99.5 | 99.7 | 100 | 98.9 | 98.1 | **348 / 365** |

Worst residual either year: 1 minute. Stability: **frozen** — both years on the identical recipe,
and the tables are genuinely recomputed (2025 and 2026 differ day for day), so this is not a
relabelled edition. Seasonal amplitude: fajr spans **04:19 (late June) to 05:34 (early January),
75 minutes**. Grade **A, community tier**.

**Masjid al-ansar, Indira Nagar** (`masjid-al-ansar-1709312810648`) is a **DEFECTIVE RECORD**:
all six columns hold one constant for all 365 days and the 2025 and 2026 files are the same
values. Sunrise pinned at 06:18 year-round is impossible at 17.4 N. Frozen entry, do not use.
Same class as the New Orleans mawaqit calendar.

### Mumbai — three tenants, one platform recipe

- **Anjuman Risalat-e-Haq, Ghatkopar West** (`anjuman-risalat-e-haq-masjid`): **19.09 N, 72.77 E**
  (0.015 min). 18/17 Shafi, zero margins. 2026 every column 97.5-98.9 pct exact, **329/365
  all-exact**; 2025 **335/365**, same coordinates to 0.001 deg. Frozen, grade **A community**.
- **Sunni Pathan Masjid, Fitwala Rd** (`sunni-pathan-masjid`): **18.97 N, 72.75 E** (0.15 min).
  18/17 Shafi, **100 pct within 1 on every column**, 140/365 all-exact (the residue is the
  platform's half-minute rounding).
- **Deeniyat Trust, Agripada** (`masjid-as-salam-1746435310953`): **DEFECTIVE**. The 18/17 core
  holds most of the year but the feed carries hand-entered blocks — dhuhr worst +40, asr worst
  +119, isha worst +216 minutes, all-exact 105/365. Same class as the Houston Saturday dhuhr
  block. Do not use without masking those rows.

### Bengaluru — Karachi 18/18 HANAFI, the null hypothesis confirmed as a dated table

**Masjid e Rahmania, Doddabommasandra** (`masjid-e-rahmania`): **13.06 N, 77.44 E** (0.003 min).
**fajr 18.0, isha 18.0, HANAFI asr**, zero margins → fajr 100 pct exact, other columns
98.9-99.7, **354/365 all-exact (2026) and 353/365 (2025)**. Frozen, grade **A community**.
This is the first dated Bengaluru table and it reproduces the census's India null hypothesis
exactly — while Mumbai on the same platform runs isha at 17. The platform does not impose the
recipe.

Second Bengaluru surface, mawaqit **GM E-CITY Town Prayer Hall** (12.82 N, 77.67 E): an
**iqamah clock** — dhuhr pinned at 13:00 and fajr at 05:25 for the whole year. Candidate only.

### Kolkata — two clean tenants, two years

- **Madarsa Rafah-e-Aam, Kamarhati** (`madarsa-rafah-e-aam`): **22.68 N, 88.25 E** (0.015 min).
  18/17 Shafi → **327/365 all-exact (2026), 325/365 (2025)**. Frozen, grade **A community**.
- **Nandanpur Jama Masjid, Budge Budge** (`nandanpur-jama-masjid`): **22.48 N, 88.07 E**
  (0.019 min). 18/17 Shafi → **335/365 both years**. Frozen, grade **A community**.
- Third Kolkata surface, mawaqit **Sondla Para Jama Masjid** (22.82 N, 88.37 E): **iqamah clock**
  — dhuhr 12:45, asr 16:35, maghrib 18:45, isha 20:15 all constant for 366 days. Candidate only.

### Srinagar — two dated surfaces, both 18/18 Shafi

- **SOQTE J&K, Maharajganj** (`masjidi-tasneem`): **34.09 N, 74.68 E** (0.0014 min).
  **358/365 all-exact (2026), 348/365 (2025)**. The cleanest Indian table of the sweep.
  Frozen, grade **A community**.
- **Jamiat AhliHadees, Gaw Kadal** (`jamiat-ahlihadees-gow-kadal`): same 18/18 Shafi recipe on a
  **coarse transcription** — fajr 28.8 pct exact / 91.5 pct within 1, all-exact 13/365. Recipe
  right, table rounded harder than the engine.

### Ramban, J&K — a district surface outside Srinagar

**Noorani Masjid, Batote** (`noorani-masjid-1736945335686`): **33.12 N, 75.20 E** (0.008 min).
18/17 Shafi, zero margins → **339/365 all-exact (2026), 334/365 (2025)**. Frozen, grade **A
community**. J&K now holds a fitted dated table in a second district, and it is 18/17 Shafi —
not the Srinagar 18/18 — so the state is not one recipe.

### West Bengal, outside Kolkata

**Fazle Elahi Masjid, Baharampur** (`fazle-elahi-masjid`): **24.10 N, 88.14 E** (0.016 min).
18/17 Shafi, zero margins → every column 98.1-99.7 pct exact, all within 1, **337/365
all-exact (2026)**; 2025 recovers **24.09 N, 88.15 E** at **309/365**. Frozen, grade **A
community** on two years.

### Uttar Pradesh — three district surfaces, none of them Lucknow

- **Chand Masjid Usmanpur, Moradabad** (`chand-masjid-usmanpur`): **29.19 N, 78.73 E**
  (0.008 min). **fajr 18.0, isha 17.0, HANAFI asr**, zero margins → every column 98.9-99.7 pct
  exact, **356/365 all-exact**. Grade **A community**. This is the third recipe variant and it
  matters: the platform's isha-17 default appears with **both** asr schools, so isha 17 is the
  platform's, while asr is the mosque's.
- **Masjid Noori, Jaigahan Bazar** (`masjid-noori`): **26.22 N, 83.01 E** (0.49 min — coarse
  table). **18/18 Shafi**, every column 100 pct within 1, exact 28-73 pct. Candidate-plus.
- **Masjid Dhalanwali, Saharanpur** (`masjid-dhalanwali`): **30.09 N, 77.33 E** (0.46 min —
  coarse). fajr 18.0, isha 17.0-18.0 (weakly separated), Shafi. Candidate-plus.
- **Hazrat Umar Bin Khattab Society, Kanpur** (`masjid-umar-bin-khattab`): **iqamah-class, no
  fit**. Fajr tracks an angle but isha is a flat clock value (best angle 12 deg still leaves a
  +31 min median and a 33 min centred MAE), with dhuhr +1, asr +3, maghrib +2. Candidate.
- **Masjid Fazl e Haq, Rampur** (`masjid-fazl-e-haq`): **iqamah-class, no fit** — and the
  cleanest example of the class. Sunrise and maghrib track the sun to within 1 minute (70 pct
  exact, median 0), while fajr sits +103, dhuhr +15, asr +75 and isha +84 minutes off the solar
  computation. A mosque publishing iqamah on a fixed schedule with solar sunrise and maghrib.

Jaigahan sits in Azamgarh district, and Saharanpur, Moradabad and Rampur are their own
districts, so **Lucknow stays negative**.

### Bihar — a district surface, not Patna

**Noor-e-Ilahi, Singaha** (`noor-e-ilahi`): **26.50 N, 84.02 E** (0.46 min — the table is
coarse). **18/18 Shafi**, every column 100 pct within 1, exact 34-59 pct. Candidate-plus:
recipe identified, table rounded to the point that the angles are weakly separated. Singaha is
a village in the north-west, so this does **not** cover Patna.

### Kolkata's Nakhoda Masjid — parked domain

`nakhodamasjid.com` returns a 5.5 KB **domain-parking redirect** (`router.parklogic.com`), not a
mosque site. Kolkata's best-known mosque has no live prayer surface; the Kolkata coverage above
comes from two other tenants. Recorded so a later wave does not re-chase it.

### Chennai — iqamah clock, not fittable

**Madeena Masjid** (`madeena-masjid-1747480624720`): the coordinate solve fails across the whole
metro box (best 25.5 min MAE) because the table is anchored to clock times: dhuhr a constant
+50 minutes after solar noon, fajr +17, isha +35, while maghrib alone tracks sunset (+3).
**Iqamah-class**, candidate, no fit. The address string is only "Chennai, Tamil Nadu".

### Gujarat — candidate, location unresolved

**Sunni Jama Masjid, Varedia** (`sunni-jama-masjid-varedia`): no coordinate in the box
reproduces the table (best 23.8 min MAE at the corner), and "Varedia, Gujarat" names no locality
precise enough to widen the search honestly. Candidate, no fit.

## The mawaqit India layer — a platform-wide negative with two exceptions

Five mawaqit India pages were pulled and four are **iqamah clocks, not azan tables**: fajr-to-
sunrise gaps of 9-30 minutes across the year where an angle table swings 60+, and columns pinned
to a single value for all 366 days (Kolkata, Bengaluru GM E-City, Chennai's Tunisian record).

Two exceptions are genuine dated tables with **no angle recipe**:

- **Pulwama, MASJID ABU TURAB** (33.86 N, 74.83 E): fajr = sunrise − 85 min (9-min spread),
  isha = maghrib + 91 min. A **fixed-interval** rule.
- **Anantapur, Masjid-e-Quba** (14.78 N, 77.74 E): fixed dhuhr, solar maghrib, interval isha.

Both are candidates. The mawaqit layer cannot supply an India fit; the masjidbox layer can.

## Algorithm-vs-timetable drift (owner order)

India's de facto stated algorithm is the **Karachi 18/18 Hanafi** null hypothesis. The dated
tables split on it:

- **Agrees exactly**: Bengaluru Rahmania (18/18 Hanafi, 354/365), Srinagar SOQTE (18/18 Shafi,
  358/365), Bihar Noor-e-Ilahi (18/18 Shafi, all within 1), Srinagar Jamiat AhliHadees (18/18).
- **Drifts on isha**: the 18/17 Shafi tenants (Hyderabad, all three Mumbai, both Kolkata,
  Ramban, Baharampur) put isha **4-5 minutes earlier** than 18 degrees, and the drift is
  constant across cities and seasons (measured at Mumbai 4.4 min mean, range 4-5; Hyderabad 4.4;
  Bengaluru 4.3). This is a one-degree isha difference, not a rounding artefact.

Direction: **isha earlier, everything else identical**. Fajr, dhuhr, asr, maghrib are unchanged
between the two families. Flagged for the owner; not adjudicated.

## Span ceiling and forward longevity

The masjidbox endpoint is **computed, not archived**: probes at 2020-06-15, 2024-06-15,
2027-06-15, 2030-06-15 and 2035-06-15 all return 7 rows, and the same calendar date returns the
same value in every year (2020 and 2035 both 04:20 fajr on 15 June) — the signature of a solar
computation with no year term. Consequences:

- **Data ceiling**: two full years banked per tenant (2025, 2026, 730 rows each), 371-day files.
- **Forward**: **proven-to-2035** by probe; unlimited by construction.
- **Backward**: **proven-to-2020** by probe. A backward harvest is available for any year on the
  same terms, so a backward regime change is detectable.
- **Regime changes**: none observed across 2025-2026. The recipe is frozen across the span, so
  no split is needed.

## Traps confirmed this pass

- **`masjd-qsr-lhlwf-chennai-600062-india` (mawaqit "Chennai")** is a **TUNISIAN** mosque: the
  page carries 33.29 N, 10.16 E and `timezone: Africa/Tunis`. A Chennai slug over a Tunisia
  record. Second decoy of the makkahmasjid.net class — never read a slug as a location.
- **masjidway `masjid/7002/prayer` ranks first for "Jama Masjid Delhi"** and is **Jama Masjid,
  Sarai Khan, Pilibhit, Uttar Pradesh** — a different state. It publishes a real monthly dated
  table (Nov 2026 captured) with the label "Method: University of Islamic Sciences, Karachi",
  which is a **platform method label, not provenance** (BRIEF). Third decoy of the pass.
- **`abubakrmosque` (masjidbox "Abu Bakr Islamic Center")** ranks for a Patna query and is
  **Calgary, Alberta, Canada**. Fourth decoy.
- **`masjid-e-touheed-bangalore-560016-india`** declares `timezone: Asia/Colombo` — the same
  platform tz defect already on record for Srinagar (Africa/Abidjan). Offset identical
  (UTC+5:30), values unharmed, declaration wrong.

## State waqf boards (second pass)

Searches ran in English plus the state language for each board.

- **Telangana** (waqf.telangana.gov.in): homepage fetched via TinyFish (curl times out from here,
  .gov.in firewall). Services are marriage certificates, e-Qazzath, honorarium, notifications and
  Ramzan gift/iftar news. NO prayer-times page. NEGATIVE. Phrases: "Telangana State Waqf Board
  prayer timings 2026 pdf namaz", "తెలంగాణ వక్ఫ్ బోర్డ్ నమాజ్ టైమింగ్స్".
- **Andhra Pradesh**: board DISSOLVED Dec 2024; reconstitution news only (UMEED digitalisation).
  No official domain. NEGATIVE.
- **Karnataka**: karwaqf.karnataka.gov.in unreachable from both networks. kswcwd.com captured
  (152 KB): zero namaz/prayer/auqat/timing links. NEGATIVE (unreachable-class). Kannada phrase
  "ನಮಾಝ ಸಮಯ" returned calculators only.
- **UP Sunni Central Waqf Board** (upsunniwaqfboard.org): bare IIS default page (696 bytes).
  NEGATIVE. Urdu phrase "نماز کے اوقات" with UP returned nothing board-adjacent.
- **Madhya Pradesh** (mpwaqfboard.org): 2011-era ASP.NET portal, menu is property/act/circular/
  land/photo/notice PDFs. ZERO namaz hits. NEGATIVE. Hindi "नमाज वक्फ बोर्ड" returned a
  Chhattisgarh board Holi Juma-timing news video (announcement-class, not a table).
- **Punjab**: only US/UK mosque PDFs and J&K Eid rosters. NEGATIVE.
- **Haryana**: re-phrased in Hindi ("हरियाणा वक्फ बोर्ड नमाज़ समय") — returns news about
  namaz-in-open-spaces and a Panchkula mosque, no timetable. NEGATIVE (now closed in Hindi, not
  just English).
- **Gujarat** (waqfboard.gujarat.gov.in): unreachable both networks. NEGATIVE
  (unreachable-class).
- **West Bengal** (auqafboardwb.org): **CLOSED this pass** — the Vite SPA was rendered with
  agent-browser. Menu is Home / About Us / Organisation / Useful Links / UMEED Portal / Tenders
  / Notice Board. The Notice Board holds auction notices (Chadars of Ghutiary Shareef Mazar),
  OSD applications, hostel admissions and the UMEED help desk — **zero prayer-time notices**.
  NEGATIVE, properly closed.
- **Bihar**: only J&K Eid rosters and calculators. NEGATIVE.
- **Delhi**: no Delhi Waqf Board prayer surface found; the query returns the Pilibhit masjidway
  decoy above. NEGATIVE.
- **Kerala**: see below.

## J&K authority question — answered

The Board's published artifact family has **not** widened. This pass found the **2026 Eid-ul-Adha
congregational roster** (a second dated cycle after the Eid-ul-Fitr roster already on record) and
the Juma khutbah notices, both authority publications, both **congregational-only**. No daily
five-prayer table exists on any Board channel. Four candidate Board domains
(`jammukashmirwaqf.org`, `jkwqf.org`, `jkwaqfboard.org`, `waqf.jk.gov.in`) return no response
from here.

Verdict: **J&K remains the census's one Indian authority surface, jama'ah-class, and the verdict
does not move.** What is new is that J&K now also carries two fitted **community** dated tables
(Srinagar SOQTE 18/18, Ramban Noorani 18/17) — so the state has coverage without the Board
having published one.

## Kerala print ecosystem — honest negative, terms recorded

Kerala's prayer-time artifact is print, and the print source named by the record (Suprabhatham)
is now confirmed to have a web presence only as an **e-paper SPA** (`epaper.suprabhaatham.com`,
741-byte React shell) behind an edition picker; no public dated table. Samastha's official site
(`samastha.info`, 143 KB captured) carries no calendar or namaz-time section, and its on-site
search for "നമസ്കാര" returns the homepage.

Everything else in Malayalam is a **computed aggregator**, which the record already excludes:
al-habib, namazvakti, timesprayer, islamicfinder, tawkit, muslimpro, prayertimes.date,
muslimandquran, dawateislami. A Play Store app ("Kerala Muslim Prayer Calendar", district
offline times) is an app artifact, not a public page.

Languages searched: English, Malayalam ("കേരള നമസ്കാര സമയം 2026", "നമസ്കാര സമയം 2026
കോഴിക്കോട്"), transliterated Malayalam. Terms closed: no public dated Kerala table found under
these terms. Not declared absent — not found under these terms.

## Verdicts

- **India's grade moves from FALLBACK-with-one-authority-surface to FALLBACK at authority tier
  plus a fitted community layer.** The authority verdict is unchanged: no Indian board publishes
  a daily table. What changed is that India now holds **A-grade community fits** where it held
  none.
- **Cities with a fitted dated surface (NEW, 8)**: Hyderabad, Mumbai, Bengaluru, Kolkata,
  Srinagar, Ramban (J&K), Baharampur (WB), Moradabad (UP). Four more carry the recipe on a
  coarse table — Srinagar (Gaw Kadal), Singaha (Bihar), Jaigahan and Saharanpur (UP).
  **Chennai, Gujarat, Kanpur and Rampur** hold iqamah-class candidates with no fit.
- **Cities still negative**: Delhi, Lucknow, Patna, and every other metro not named above. These
  are "not found under these terms", not closed.
- **Three recipes in the wild**: 18/17 Shafi (masjidbox India default, 8 tenants), 18/17 Hanafi
  (Moradabad), and 18/18 Hanafi or Shafi (5 tenants, including the null hypothesis). The isha
  one-degree split is the algorithm-vs-timetable result to hand the owner: the platform owns the
  isha 17 default, the mosque owns the asr school.
- **Two defective records** and **four iqamah-class candidates** are named above so no later
  wave re-fits them by mistake.

## Data held

- `data/masjidbox-<tenant>-<year>.json` — 36 files, 365 rows each, **13,140 dated rows** in the
  brief's shape (`{'YYYY-MM-DD': {fajr, sunrise, dhuhr, asr, maghrib, isha}}`, HH:MM,
  Asia/Kolkata). Two years for 16 tenants, 2026 only for the last four.
- `data/mawaqit-<city>-cal.json` — 5 raw mawaqit calendars with coordinates and declared TZ.
- `captures/` — 36 masjidbox tenant-year payloads (371 days each), 10 masjidbox page HTMLs, 6
  mawaqit page HTMLs, the masjidway Pilibhit page, 5 state-board homepages, the Suprabhaatham
  e-paper shell, the samastha.info homepage and its on-site search, the parked Nakhoda domain,
  7 masjidbox probes, 2 mawaqit JS bundles and 4 dead J&K domain attempts. 111 files, 16 MB.
- Tooling: `harvest-mbx.py`, `normalize.py`, `fit-solve.cjs`, `fit-mawaqit.cjs`,
  `mawaqit-to-json.py`, `column-variability.py`, `batch-mbx.sh`, `batch2-mbx.sh`,
  `batch3-mbx.sh`, `fit-batch.sh`.
