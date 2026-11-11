# O1l-35 pacific2 — Pacific islands, second pass

Wave: O1l city-level round two, Pacific islands. Started 2026-11-11 ~05:20 host.
Workspace: `$HOME/athan-gitree/census/o1l-city/pacific2/`.
Engine: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`,
`HighLatitudeRule.MiddleOfTheNight`, TZ pinned per country via the process `TZ`, dates built from
literal capture strings, no clock reads. Harness: `fit.js`, `fmlval.js`, `fml3.js`.

---

## 1. Fiji — FULL YEAR BANKED (2024), plus a 2026 edition

**NEW: the lift condition is met.** The record's lift for Fiji was "a full-year capture set". The
Fiji Muslim League public page still serves the 2024 image set (unchanged since the o1k note), and
all twelve 2024 monthly sheets are now captured and transcribed: **365 dated rows**.

- Source: `https://www.fml.com.fj/prayer-time/` (live, HTTP 200, 251,794 B, captured
  `captures/fml-prayer-time.html`). The page's twelve links are still
  `wp-content/uploads/2024/06/<Month>.jpg` — the live site has NOT advanced past 2024.
- Captures: `captures/fml-2024/{January..December}.jpg` (12 files, 2.6 MB).
- Transcription: `data/fml-2024-01.json` … `data/fml-2024-12.json` (raw printed strings, 12-hour,
  as the artifact prints them); normalised `data/fiji-fml-2024.json` (365 rows, Suva reference,
  `asr` = Shafi, `asr_hanafi` carried separately).
- Tier: community (national federation).

### Fit — one recipe, 365/365 within 1 on five columns

Reference point: Suva -18.1416, 178.4419 (the table's own base, the town ladder rides on it).

| column | model | exact | within 1 | MAE | worst |
|---|---|---|---|---|---|
| fajr | 18.0 deg | 159/365 | **365/365** | 0.56 | 1 |
| fajr | free fit 17.85 deg | 276/365 | 365/365 | 0.24 | 1 |
| sunrise | 0.833 deg (adhan default) | 154/365 | **365/365** | 0.58 | 1 |
| dhuhr | transit + 6 | 187/365 | **365/365** | 0.49 | -1 |
| dhuhr | transit + 5 | 178/365 | 365/365 | 0.51 | 1 |
| asr (Shafi) | shadow 1, no offset | 170/365 | **365/365** | 0.53 | 1 |
| maghrib | sunset + 3 | 210/365 | **365/365** | 0.42 | 1 |
| isha | interval table (see below) | — | — | — | — |

- **fajr 18.0 CONFIRMED** at the 1-minute resolution (365/365 within 1). The free fit lands at
  17.85 (MAE 0.24 vs 0.56), i.e. the artifact is very slightly EARLIER than a clean 18.0; the two
  are indistinguishable inside the table's minute grid.
- **maghrib sunset+3 CONFIRMED** exactly as recorded.
- **asr dual CONFIRMED**: both schools printed, each exact in its madhab (Shafi 365/365 within 1).
  Hanafi column carried in the data, not fitted here.
- **dhuhr is NOT +3.** The record's "dhuhr +3" does not reproduce: at +3 the fit is **0/365 within
  1, MAE 2.51, worst 3**. The measured relation over the full year is **transit + 5..6 (mean
  +5.5)**, 365/365 within 1. Reported as drift, not adjudicated.
- **isha is an INTERVAL table, not an angle.** Against 17 deg the residual runs +5..+11 and no
  single angle reaches within 1 anywhere (best 19.15 deg: 161/365). Measured directly:
  isha − maghrib is **exactly 75 min for all of Mar–Sep**, and 75..80 in Oct–Feb
  (Jan 78–80, Feb 75–78, Oct 75–78, Nov 78–80, Dec 80 flat). The record's "+5–9 past 17 deg"
  describes the same artifact from the angle side; the interval form is the cleaner statement.
- **Seasonal amplitude**: fajr Jan 04:11 → Jun 05:20 (69 min); maghrib Jan 18:48 → Jun 17:40
  (68 min). Near-equator: small, as FIT-RULES 3 predicts.
- **Stability**: one recipe across all 12 months, no regime break, no DST (Fiji has none).
- **Grade**: the span now supports **A** on the letter of the rule (2024 full year here; Dec 2025
  and Nov 2026 on the same recipe). Note the caveat in the next section before lifting.

### Two editions — the 2024 = 2026 identity CONFIRMED on a fourth artifact

The FML Facebook page published "November prayer timetable." on **Friday 30 October 2026 at 05:55**
(`https://www.facebook.com/fijimuslimleague/posts/november-prayer-timetable/1521399353348153/`,
public-post render, agent-browser session `o1l-pacific2`). The attached image is saved as
`captures/fml-nov2026-sheet.jpg` (1080×1528) and transcribed to `data/fml-2026-11.json`.

**November 2026 = November 2024, cell for cell: 30 rows × 7 columns, 210 cells, ZERO differences.**
A pixel diff of the two sheets (after rescale) shows a mean absolute difference of 6.6 grey levels
and only 4.4 % of pixels differing by more than 30 — same table, different render.

This is the D3 frozen-generation question answered with data rather than by assertion: the 2024
table is genuinely COMPUTED per year (it fits the solar recipe across all twelve months, which no
frozen reprint could do), and 2024 and 2026 land on the same minutes because the solar geometry of
November repeats at a one-minute grid. Two editions, one computed generation.

- **December sheet**: NOT YET PUBLISHED as of 2026-11-11. The Facebook page's latest timetable post
  is November's (30 Oct 2026); the site still serves 2024. Watch, not a negative: re-probe after
  2026-11-25.
- **Widget edition**: the FML PWA (`https://www.fml.com.fj/pwa-manifest.json`, captured) exposes no
  prayer API; the widget's +5 dhuhr delta recorded in O1k stands unmeasured here. No second
  edition captured this pass.

### Town ladder — printed verbatim on every 2024 sheet

Suva base; **later**: Rakiraki, Dobuilevu, Navua +1; Tavua +2; Ba, Varavu, Rarawai +3; Lautoka,
Sabeto, Nadi, Maro, Sigatoka +4. **Earlier**: Levuka −1; Savusavu, Labasa −4; Taveuni, Rabi, Moala
−6; Lakeba −11. Two artifact notes: **March 2024 omits the Levuka row** (11 of 12 sheets carry it),
and **October 2024 omits the whole Time Difference block**.

---

## 2. Tonga — NEW SURFACE WITH TIMES (full year)

The record held "mosque-layer surface confirmed (no times posted)". That is now superseded: the
Niutoua mosque publishes a **full-year dated calendar**.

- Source: MAWAQIT, `https://mawaqit.net/en/m/masjid-al-taiyab-taufaahau-road-niutoua-tonga`
  (HTTP 200, 61,873 B → `captures/mawaqit-tonga-al-taiyab.html`; embedded conf →
  `captures/mawaqit-tonga-conf.json`).
- Mosque: **Masjid Al-Taiyab**, Taufaahau Road, Niutoua, Tongatapu. Coordinates -21.148063,
  -175.209382. TZ `Pacific/Tongatapu`.
- Rows: **365 dated rows, 2026-01-01..2026-12-31**, six columns
  (`data/tonga-2026.json`). Live-page gate passed: the page's own `times` array for 2026-11-11
  (04:32, 12:24, 15:42, 18:56, 20:12) equals the calendar row for that date exactly.
  The conf emits 366 day-keys; 2026-02-29 does not exist and is dropped. Unlike Nouméa, Tonga's
  spurious key continues the daily progression rather than duplicating 02-28, so the drop is a
  deletion, not a de-duplication.
- Tier: community (mosque), platform-published. **Engine: MAWAQIT platform table.**

### Fit — MWL 18/17, floor rounding, zero margins

| column | exact | within 1 | MAE | worst |
|---|---|---|---|---|
| fajr | 313/365 | **365/365** | 0.14 | -1 |
| sunrise | 295/365 | **365/365** | 0.19 | -1 |
| dhuhr | 304/365 | **365/365** | 0.17 | -1 |
| asr | 53/365 | 253/365 (69.3 %) | 1.16 | +2 |
| maghrib | 313/365 | **365/365** | 0.14 | -1 |
| isha | 313/365 | **365/365** | 0.14 | -1 |

- **One recipe: MWL 18/17.** Five columns 365/365 within 1 at zero margins; the residual is
  uniformly {0, −1}, i.e. the publisher FLOORS to the minute.
- **asr is the engine artefact**, not a recipe difference: residual spreads −2..+2 with 14.5 %
  exact. This is the adhan-on-MAWAQIT asr skew the brief names. Record it with the fit.
- Iqama: a single constant offset set for all 365 days — fajr +10, dhuhr +10, asr +10, maghrib +5,
  isha +10 (frozen at creation, no seasonal variant). `jumua` unset; `hijriAdjustment` −1.
- **Grade: provisional** (one published cycle, 365 rows, one recipe). Lift: a second year.
- **Ceiling**: 2026 only. MAWAQIT serves the current year; no future year on the page.

---

## 3. New Caledonia — the board is now machine-readable (full year)

The record holds Nouméa's Centre Islamique as a hand-maintained board (fajr 18, 5-minute grid on
dhuhr/asr, isha 19:45 floor 243 days, then sunset+85). It is now published through a platform, so
the whole year is captured as JSON instead of transcribed.

- Source: MAWAQIT, `https://mawaqit.net/en/mosquee-de-noumea-noumea-98800-new-caledonia`
  (HTTP 200, 65,525 B → `captures/mawaqit-noumea.html`; conf →
  `captures/mawaqit-noumea-conf.json`). Association: Association des Musulmans de Nouvelle
  Calédonie, site `https://www.amnc.org/`. Coordinates -22.269036, 166.453258. TZ `Pacific/Noumea`.
- Rows: **365 dated rows** (`data/noumea-2026.json`). The conf emits 366 day-keys; 2026-02-29 is
  a padded duplicate of 02-28 and is dropped.
- Live-page gate passed: page `times` for 2026-11-11 = calendar row exactly.

### What the year confirms

- **fajr 18 CONFIRMED**: 317/365 exact, 365/365 within 1, residual ±1 (nearest-minute rounding).
- **sunrise** 323/365 exact, 365/365 within 1.
- **maghrib = sunset + 5**: 313/365 exact at +5, 365/365 within 1.
- **isha 19:45 floor = 243 days CONFIRMED exactly** (the record's 243/365 reproduces on a different
  artifact). Outside the floor, isha − sunset runs +80..+128, **median +85** — the recorded
  "sunset+85 (~17.7 deg)" holds as the median, on a 5-minute hand grid.
- **dhuhr and asr are hand blocks on a 5-minute grid**: all 365 dhuhr and all 365 asr values sit on
  the grid; dhuhr = transit + 25..+37 (median +32, so the recorded "transit+30" reads as +30 then
  rounded up the grid); asr − Shafi runs −7..+16 (median +2). A clean solar model does not
  reproduce either column, which is the signature of a hand table, not an engine.
- fajr is NOT on the grid (68/365) — it is the plain 18-degree calculation. Two columns computed,
  four hand-set: the board is half engine, half decision.
- **Iqama**: constant offsets all year, fajr +10, dhuhr +10, asr +10, maghrib +5, isha +10;
  **jumua 12:00**. This is a NEW edition layer the record did not carry.
- **Grade**: community, confirmed; the platform adds a machine-readable year and the iqama layer.

---

## 4. French Polynesia — still FALLBACK, closed surface re-confirmed

`https://en.masjidway.com/masjid/3814/prayer/042030` (HTTP 200, 40,491 B →
`captures/masjidway-tahiti.html`). The page still renders "If you are the manager of this masjid,
go to the subscription page to get the right to manage this page" — **unclaimed**, so its times are
the platform calculator, not a publication. Dated row held for the record only:
2026-11-11 sobh 03:58, dhuhr 11:42, asr 14:52, maghrib 18:13, isha 19:22. Citable, never a surface.

---

## 5. Honest negatives — searched again, new phrasings and languages

Every negative below was closed the same way: no mosque-published timetable on any reachable public
page, and the platform hits are calculators or wrong-country false positives.

- **Papua New Guinea.** English: "Port Moresby mosque prayer time timetable 2026", "PNG mosque
  timetable". Tok Pisin: `"taim bilong lotu" Moslem Papua Niugini`. Hiri Motu:
  `Papua New Guinea Muslim "diba"`. Results: aggregators (muslimpro, islamicfinder, aladhan,
  athanpro) and Wantok Niuspepa back-issues; no mosque or Islamic society page with times. The
  record's "empty Prayer Times heading" stands.
- **Solomon Islands.** English: "Honiara mosque prayer times", "Solomon Islands Islamic society".
  Results: aggregators only (praywatch, muslimpro, athanpro city lists). No Honiara mosque page.
- **Vanuatu.** English: "Vanuatu Muslim prayer times Port Vila mosque". Bislama:
  `"taem blong prea" mosk`, `Bislama Muslim Vanuatu prea taim`. Results: Wikipedia, Facebook news
  pages about the Port Vila Grand Mosque open day, and Bislama liturgical material — no times.
- **Samoa.** English: "Samoa Apia mosque prayer times Muslim". Samoan:
  `Samoa "taimi o le tatalo" Muslim Apia` (1 result, a Samoa Observer news post). Results:
  Masjid Mariam photo posts and aggregators. No published timetable.
- **Kiribati.** English: "Kiribati Tarawa mosque prayer time". Gilbertese:
  `Kiribati "taim n te bong" Muslim`. Results: LDS temple page, dictionaries, aggregators. No
  mosque page. The record's "five languages" negative stands and is extended.
- **Fiji Hindi.** `Fiji Hindi "namaaz ke waqt" Fiji Muslim League` — returns only the League's own
  English pages; the League publishes in English only.
- **Tuvalu, Nauru, Cook Islands, Niue, Tokelau.** English plus the nearest-language forms above.
  Aggregators only; no mosque or community page with a timetable. No mosque is listed on MAWAQIT,
  Masjidbox, Masjidal, AthanPlus, dpt or Baab for any of the five.
- **Marshall Islands, Micronesia (FSM), Palau** — see below.

---

## 6. First passes — the ten territories

| territory | surface found | verdict |
|---|---|---|
| Guam | Baab: Masjid al-Noor, Mangilao (`openbaab.com/masjid/masjid-al-noor-10`) | **FALLBACK** — platform calculator |
| Northern Mariana Islands | Baab: Saipan Baitus Salam, Saipan Central Mosque | **FALLBACK** — platform calculator |
| Palau | `palaucentralmosque.com` (own domain, HTTP 200) | **FALLBACK** — theme placeholder |
| Marshall Islands | none | **FALLBACK** — honest negative |
| Micronesia (FSM) | none | **FALLBACK** — honest negative |
| Nauru | none | **FALLBACK** — honest negative |
| Tuvalu | none | **FALLBACK** — honest negative |
| Cook Islands | none | **FALLBACK** — honest negative |
| Niue | none | **FALLBACK** — honest negative |
| Tokelau | none | **FALLBACK** — honest negative |

The three closed surfaces, with their reason:

- **Guam / NMI (Baab).** All three mosque pages state, in the page's own words, "Calculated for this
  location; the masjid has not posted iqama times", and "the masjid has not posted iqama times yet".
  A platform calculating for an address is the Tahiti class: citable, never a surface. Dated rows
  held for the record (2026-11-11): Mangilao fajr 5:18, dhuhr 12:06, asr 3:23, maghrib 5:51,
  isha 6:52; both Saipan pages fajr 5:16, dhuhr 12:02, asr 3:19, maghrib 5:45, isha 6:46. Captures:
  `captures/baab-*.html`.
- **Palau.** `palaucentralmosque.com` (140,542 B → `captures/palau-central-mosque.html`) carries a
  hard-coded prayer block with `data-offset="9"`: Fajr 7:50 AM, Zuhr 2:42 PM, Asr 5:52 PM, Magrib
  8:14 PM, Isha 9:44 PM, Sunrise 9:10 AM, Sunset 8:14 PM. Those are not Koror's solar geometry
  (equatorial: sunrise ~06:00, sunset ~18:10, dhuhr ~11:50) — they are a theme's demo content.
  A mosque address with a template's numbers. Never a surface.
- **Marshall Islands / FSM.** The Majuro Ahmadiyya mosque and the Pohnpei community have news
  coverage and no public timetable. Nothing on any platform.

---

## 7. What this pass changes in the record

1. **Fiji**: lift condition met (full-year 2024, 365 rows, one recipe, 365/365 within 1 on five
   columns). Grade moves provisional → A on the letter of the rule; the owner should decide whether
   the 2024=2026 identity blocks it (it should not: the table is proven computed).
2. **Fiji record correction candidate**: "dhuhr +3" → measured **transit +5..6** (the +3 scores
   0/365 within 1). Flagged, not adjudicated.
3. **Fiji record refinement**: isha is an **interval table** (maghrib + 75 exact Mar–Sep, +75..+80
   Oct–Feb), not an angle-plus-offset.
4. **Tonga**: "mosque layer, no times" is superseded — **365 dated rows, MWL 18/17**, one mosque,
   MAWAQIT platform table, asr engine artefact ±2.
5. **New Caledonia**: the board is now platform-published; full year machine-readable, isha 19:45
   floor re-confirmed at exactly 243 days, iqama layer new.
6. **Ten territories**: first passes complete; three documented closed surfaces, seven honest
   negatives. No territory reaches candidate.

## Assumptions

- The MAWAQIT calendars are the year 2026: the page's own `times` array for 2026-11-11 matches the
  calendar row for that date in both mosques, and the Nouméa search snippet is dated "Monday, Nov 9,
  2026".
- The 2024 FML image set is the current publication of that page: the twelve `href`s still point at
  `uploads/2024/06/`, and no newer month exists on the page.
- Tonga's MAWAQIT table is the mosque's publication rather than a bare platform default: the mosque
  has its own conf (iqama offsets, association fields) and the table floors to the minute, which a
  platform default does not.
- The Palau block is demo content: its sunrise/sunset cannot occur at Koror on any date.

## Blocked / not done

- **Facebook**: direct HTTP fetch of FML posts returns HTTP 400 on `www`, `m` and `mbasic`; the
  public-post render works only through agent-browser. Used for the November 2026 sheet.
- **December 2026 FML sheet**: not published as of 2026-11-11. Re-probe after 2026-11-25.
- **Fiji widget edition**: no API behind the PWA; the widget's +5 dhuhr delta is unmeasured here.
