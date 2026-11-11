# O1l-48 fallback-sweep — the FALLBACK class, one dated surface attempt per country

Wave: O1l city-level round two, FALLBACK countries sweep. Started 2026-11-11 ~10:0xZ host.
Workspace: `$HOME/athan-gitree/census/o1l-city/fallback-sweep/`.
Engine: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`,
`HighLatitudeRule.MiddleOfTheNight`, Shafi unless stated, TZ pinned per country by the process
`TZ`, dates built from literal capture strings, no clock reads. Harnesses: `mawaqit_extract.py`,
`parse_horaire_ma.py`, `analyse.js` (column forensics), `fit.js` / `fit2.js` (angle + margin scan).

Scope: the span ledger's FALLBACK class (27 rows, 33 countries). Palestine skipped per the mission
(recorded closed). Iran, Libya, Syria were never FALLBACK rows and were not touched.

---

## 1. What this wave lifted — five countries, 4,440 dated rows

| Country | Surface | Tier | Rows | Fit verdict |
|---|---|---|---|---|
| **Central African Republic** | mawaqit `mosquee-saina-youssuf` Bangui (4.3586 N, 18.5373 E) | platform | 365 | **ISNA 15/15, zero margins, 365/365 within-1 on all four solar columns** |
| **Western Sahara** | `horaire-de-priere.ma` Laayoune + Dakhla, November 2026 | platform (Moroccan Habous computation republished) | 30 + 30 | **19/17 confirmed, 30/30 within-1 on all six columns at both cities, on GMT** |
| **Côte d'Ivoire** | seven mawaqit Abidjan mosques | platform | 7 × 365 = 2,555 | hand-set boards: sunrise computed exactly, dhuhr/asr fixed clocks, fajr/isha/maghrib stepped |
| **Madagascar** | three mawaqit mosques: Mahajanga ×2, Nosy Be ×1 | platform | 3 × 365 = 1,095 | computed sunrise 365/365; fajr an angle at two of three; isha and maghrib stepped |
| **Guinea-Bissau** | mawaqit `mesquita-attadamun` Bissau (11.8612 N, −15.6134 E) | platform | 365 | computed sunrise 365/365; maghrib sunset − 2.8 (289/365 within-1); fajr/isha stepped |

Row total 4,440: Côte d'Ivoire 2,555, Madagascar 1,095, Central African Republic 365,
Guinea-Bissau 365, Western Sahara 60. Every file is listed in `data/`.

**Dating anchor for every mawaqit surface.** A mawaqit `confData` calendar carries twelve month
objects and **no year marker**. Each is dated here by its own `lastUpdated` epoch, which lands
inside 2026 in every case (CI 2026-10-18, CF 2026-06-23, GW 2026-10-30, MG 2026-09-28 to
2026-11-10), and by the solar gate: the sunrise column reproduces adhan 4.4.6 at the surface's own
coordinates to 0.0 ±0.5 min across all 365 days, which a stale or mislabelled year would not do at
this precision. The year is the platform's current board, read as 2026 — the same convention every
prior mawaqit wave used.

---

## 2. Central African Republic — Bangui is a computed ISNA table

- Source: `https://mawaqit.net/fr/m/mosquee-saina-youssuf-avenue-udeac-bangui-central-african-republic`
  (live 200, 62,914 B, `captures/cf-bangui-saina.html`; `lastUpdated` 2026-06-23T07:09Z).
- 365 rows, 2026-01-01..2026-12-31 (`data/cf-bangui-saina-2026.json`), Africa/Bangui.

Fit at the mosque's own point, adhan 4.4.6, `Rounding.None`, median margin then nearest rounding:

| column | margin | exact | within-1 | MAE |
|---|---|---|---|---|
| fajr (15°) | 0.0 | 349/365 | **365/365** | 0.04 |
| sunrise | 0.0 | 353/365 | **365/365** | 0.03 |
| maghrib | 0.0 | 352/365 | **365/365** | 0.04 |
| isha (15°) | 0.0 | 346/365 | **365/365** | 0.05 |
| asr (Shafi) | 0.0 | 83/365 | 310/365 | 0.92 |

- **The 15/15 ISNA pair with zero margins reproduces the whole year.** The free angle scan lands
  15.10 (fajr) and 15.30 (isha) with margins +0.4/−1.25, which is the same pair inside the minute
  grid. MAE 0.04-0.05 is the rounding floor: this is a computed table, not a board.
- **dhuhr is a fixed 12:00 clock** (one distinct value all year, median +73.5 min off transit).
  Bangui's solar transit is 10:46 local, so the printed dhuhr is a jama'ah clock, not a transit
  column. Recorded as a site constant, the Mali-Bamako class.
- Asr Shafi sits inside ±1 on 310/365 with a ±1.9 IQR: the same seasonal skew the brief names for
  adhan, not a school difference (Hanafi sits ~46 min away and is refuted outright).
- Seasonal amplitude: fajr Jan 04:51 → Jul 04:36 (+18 min). Near-equator, small, as FIT-RULES 3
  predicts.
- Grade: **provisional** — one published cycle, one recipe, 365/365. A second year is the lift.

---

## 3. Western Sahara — the Habous 19/17 reaches Laayoune and Dakhla, on GMT

- Sources: `https://horaire-de-priere.ma/horaire-priere-laayoune.html` and
  `.../horaire-priere-dakhla.html` (both live 200, `captures/eh-laayoune-horaire.html`,
  `captures/eh-dakhla-horaire.html`). Both pages carry a 30-day November 2026 table
  (`data/eh-laayoune-2026-11.json`, `data/eh-dakhla-2026-11.json`). The page names no year in the
  table body; the page text reads "novembre" and "2026".
- This is a Moroccan republication, not a Sahrawi publisher. It serves the country's own cities
  (Laayoune 27.1536 N, −13.2033 E; Dakhla 23.6848 N, −15.9580 E), so it counts under the mission's
  rule. Tier: platform, derived from the ministry computation.

**The clock is GMT, not UTC+1.** Fitting the same rows under `Africa/Abidjan` gives margins of
0/−3/+5/+1/+4/0; under `Africa/El_Aaiun` every margin shifts by −60. The site prints GMT, which
**confirms that decree 2.26.530 (2026-09-20) reaches the southern provinces** — a dated
confirmation of the record's Morocco clock finding on new geography.

Fit at 19/17, Shafi, both cities:

| column | margin | Laayoune ex/w1 | Dakhla ex/w1 |
|---|---|---|---|
| fajr | 0 | 23/30, 30/30 | 23/30, 30/30 |
| sunrise | −3 | 16/30, 30/30 | 24/30, 30/30 |
| dhuhr | +5 | 22/30, 30/30 | 23/30, 30/30 |
| asr | +1 | 15/30, 30/30 | 15/30, 30/30 |
| maghrib | +4 | 22/30, 30/30 | 29/30, 30/30 |
| isha | 0 | 28/30, 30/30 | 28/30, 30/30 |

- **Every column is 30/30 within-1 at both cities on one recipe.** The margins are exactly the
  record's Morocco set (fajr −1, sunrise −3, dhuhr +5, asr +1, maghrib +4, isha 0), which the
  O1l-39 wave re-measured at 190 cities. **This is a CONFIRMATION, not a new recipe.**
- Grade: **candidate** — 30 days is a month, so it fits, but it is one month of one generation.
  The ledger's "0 own" is now "0 own publisher, 2 dated city-months via the Moroccan computation".

---

## 4. Côte d'Ivoire — seven Abidjan boards, all hand-set

Seven mawaqit tenants, all 365 rows, all Africa/Abidjan, all coordinates inside Abidjan
(`captures/ci-abidjan-*.html`, `data/ci-abidjan-*-2026.json`):

| surface | lat/lon | distinct dhuhr | distinct asr | distinct fajr | sunrise fit |
|---|---|---|---|---|---|
| Mouaz Ibn Djabal (Riviera Faya) | 5.3694, −3.9320 | 1 | 1 | 17 | 359/365 exact |
| Communauté d'Aghien | 5.3822, −3.9933 | 1 | 1 | 7 | 351/365 exact |
| Mosquée Ibrahim | 5.2578, −3.9046 | 1 | 1 | 1 | 354/365 exact |
| Mosquée Rayyane | 5.3611, −3.9577 | 1 | 1 | 2 | 354/365 exact |
| Oumar Ibn Khattab, Bingerville | 5.3577, −3.8829 | 1 | 10 | 22 | 358/365 exact |
| Complexe Firad | 5.4072, −3.9762 | 1 | 1 | 8 | 361/365 exact |
| Riadh As Salihin | 5.3521, −3.9229 | 1 | 1 | 25 | 358/365 exact |

- **The sunrise column is the platform engine's and it reproduces at 0.0 ±0.5 min on all seven.**
  That is the solar gate passing at the mosque's own coordinates.
- **Every other column is hand-set.** dhuhr is one constant value all year on all seven (12:45,
  13:00, 12:30 and so on); asr is one constant on five; fajr has 1-25 distinct values across 365
  days and a 0-19 min January-to-July amplitude, where a computed 18° fajr swings ~20 min. Three
  mosques print the same fajr minute every day of the year.
- No single recipe exists, so no country fit. Recorded as the **hand-set board class** (the New
  Caledonia class), with the platform's own sunrise as the only computed column.
- Grade: **candidate** (dated, no fit). The country leaves FALLBACK: it now holds 2,555 dated rows
  from seven independent installs.

---

## 5. Madagascar — three computed sunrises, one angle fajr pair, stepped evenings

| surface | lat/lon | fajr angle | fajr ex/w1 | isha |
|---|---|---|---|---|
| Mosquée du vendredi, Mahabibo (Mahajanga) | −15.717, 46.320 | 17.85, margin −5.5 | 262/365, 293/365 | stepped, 6 exact |
| Tawhid (Mahajanga) | −15.7249, 46.3218 | 14.60, margin −6.7 | 298/365, 324/365 | stepped, 6 exact |
| Masdjid Jummah Sengeniga (Nosy Be) | −13.3150, 48.2593 | free fit unstable (IQR 24.8) | 75/365 | stepped |

- Sunrise reproduces at 0.0 ±0.5 on all three (361-364/365 exact): the platform engine runs and the
  points are in-country.
- **fajr is an angle at Mahajanga** (two independent mosques, 262/365 and 298/365 exact, IQR 0.57-0.65)
  but a stepped board at Nosy Be. isha and maghrib are stepped at all three (6-9 exact of 365).
- dhuhr is a fixed clock at all three (one distinct value all year).
- Seasonal amplitude fajr: −48 min (Jan 04:05 → Jul 05:01 at Mahabibo), the southern-hemisphere sign.
- Grade: **candidate**. The record's "0 counted" is now 1,095 dated rows from three installs. The
  Antananarivo association (Islam Da'wa Malagasy) publishes a masjidbox page, but it serves a
  **seven-day window only** (`captures/mg-masjidbox-salama.html`, 7 dated days), so it is not
  fit-grade and is recorded as a watch, not a surface.

---

## 6. Guinea-Bissau — Bissau's maghrib is computed, the twilights are not

- Source: `https://mawaqit.net/pt/m/mesquita-attadamun-bissau-2210-guinea-bissau` (live 200,
  67,937 B, `lastUpdated` 2026-10-30T16:45Z), 365 rows, Africa/Bissau, 11.8612 N, −15.6134 E.
- sunrise 361/365 exact (0.0 margin), **maghrib = sunset − 2.83, 250/365 exact and 289/365 within-1**
  — a computed evening column.
- fajr is stepped: 24 distinct values, best free angle 12.65 with a −28.4 margin and a 17.0 min
  residual IQR. isha is stepped: 39 distinct values, best IQR 3.4 min. dhuhr is one constant.
- Grade: **candidate**. 365 dated rows where the record held zero.

---

## 7. Honest negatives — languages and phrasings tried

Each line names the languages searched and how the surface was closed.

- **Rwanda** (Kigali) — English, French, Kinyarwanda ("isaha y'iswala", "umusigiti"). No mawaqit or
  masjidbox tenant exists for the country (a `site:mawaqit.net` sweep returns only shop pages).
  **NEW authority surface found:** the Rwanda Muslim Community's own platform
  (`https://rwandamuslim.org/en`, live 200, 480,033 B, `captures/rw-rwandamuslim.html`) carries a
  "Prayer Times — Today's prayer times for Kigali" panel. It is a **today-only, location-based
  panel** with no dated table and no month or year parameter, so it yields one row a day and no
  fit: the Ethiopia-Addis class. Recorded as an authority today-only panel, not a surface.
- **Burundi** (Bujumbura) — French, Kirundi ("amasaha y'iswala"), English. No platform tenant. The
  Grande Mosquée de Bujumbura / Nyakabiga pages are map listings with no times.
- **South Sudan** (Juba) — English, Arabic. The South Sudan Islamic Council's Facebook page
  (`ssichqs`) renders public and carries an **Eid al-Fitr announcement only** (7:30 AM at
  Al-Zahraa Square, 19 March 2026), not a prayer table. Its stated website `icsouthsudan.org` **does
  not resolve** (DNS, curl exit 6) — the dead-domain class the record holds for Uganda.
- **Liberia** (Monrovia) — English, French. No platform tenant. Only calculators and a US Embassy
  Ramadan post. The T-665 January-class feed remains uncensused and unreachable.
- **Turkmenistan** (Ashgabat) — Turkmen ("namaz wagty"), Russian, Turkish, English. The muftiate
  stays image-only; every result is a Turkish Diyanet-derived calculator (namazvakti, hurriyet,
  vakitci, 5namaz). **Negative reconfirmed** — third independent sweep.
- **Nepal** (Kathmandu) — Nepali (Devanagari), English. `khidmat.org.np/prayer-times.php` is an
  AlAdhan method-4 wrapper (computed, undated). Bhairahawa's mawaqit install stays frozen (ten of
  twelve months one repeated tuple). No dated publisher table found.
- **Myanmar** (Yangon) — Burmese ("နမာဇ် အချိန်ဇယား", "ဆွလာသ်", "နမာဇ်အချိန်"), English. Three
  surfaces examined:
  (a) `mmislamic.znnt.org/adhan-time-table/` and `/adhan/` carry an `id="weeklytable"` shell that is
  **empty in the HTML** and filled by a direct `https://api.aladhan.com/v1/calendar?` call — a
  client-side calculator, not a publisher.
  (b) The authority's Facebook page (`irac.myanmar`, 127K followers) lists its website as
  `iracmyanmar.org`, which **does not resolve** (DNS, curl exit 6). Its one findable monthly
  timetable post (`irac.info`, 24 April 2020) offers a truncated Google Docs download link for a
  **2020** Yangon monthly table — historical, not 2026, and not reachable as a stable artifact.
  (c) Every 2026 Yangon table found is an individual Facebook or TikTok image post.
  No publisher table with a stable URL exists under these terms.
- **Armenia** (Yerevan) — Armenian ("աղոթքի ժամեր", "մզկիթ"), Russian, English, French. The Blue
  Mosque is the country's only working mosque and publishes no timetable; every result is heritage,
  tourism or a calculator.
- **Guyana** (Georgetown) — English, second pass. CIOG's only channel is Facebook (`CIOG786`), with
  no dated table; `gicmasjid.org` is Georgetown, **Texas**. Negative with the same cause as C7.
- **French Polynesia** (Papeete) — French, English, Tahitian phrasings. The Tahiti mosque has press
  coverage of a closure and reopening but no timetable; the Masjidway page stays unclaimed.
- **Papua New Guinea / Solomon Islands / Vanuatu / Samoa / Kiribati** — English, French, plus the
  prior wave's nine languages re-entered with platform-specific phrasings (`mawaqit.net <capital>`).
  No mawaqit or masjidbox tenant in any of the five. `houseofprayerportmoresby.com` is live (904 KB)
  and carries no prayer times. Hohola Mosque has no site.

Platform note: **masjidway is down** — `masjidway.com/` times out and `/prayer/112026` returns 503,
so the Nigeria-wave month walk is unavailable this pass.

---

## 8. Counts

Ledger FALLBACK: 27 rows / 33 countries. Palestine skipped (closed).

- **Lifted by this wave: 5 countries** (Central African Republic, Western Sahara, Côte d'Ivoire,
  Madagascar, Guinea-Bissau) — 4,440 dated rows, 5 fits or classifications.
- **Lifted earlier in this round by other waves** (read from `CONSOLIDATION.md`, not re-probed here):
  North Macedonia, Romania, Eritrea, Comoros, Chad, Ethiopia, Tanzania, Uganda, India, China,
  Azerbaijan, Tonga — 12 countries.
- **Still FALLBACK: 15 countries** — Rwanda, Burundi, South Sudan, Liberia, Turkmenistan, Nepal,
  Myanmar, Armenia, Guyana, French Polynesia, Papua New Guinea, Solomon Islands, Vanuatu, Samoa,
  Kiribati. In ledger rows that is **11 rows** (Rwanda/Burundi/South Sudan one row; the five Pacific
  states one row; Palestine one row).
- **New FALLBACK count: 11 rows** (16 counting Palestine, which the mission put out of scope).

Every "still FALLBACK" is a "not found under these terms" — never a completeness claim.
