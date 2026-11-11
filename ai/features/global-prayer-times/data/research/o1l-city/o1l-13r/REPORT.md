# O1l-13r Bangladesh district cities (returned 2026-11-11 ~05:0xZ)

Scope: the seven divisions' district Islamic Foundation offices (Bengali + English), and the
city mosque layer with dated athan tables (Baitul Mukarram, Chittagong, Sylhet, Khulna,
Rajshahi, Bogura, Comilla) on mawaqit / masjidbox / masjidal / dpt. Engine: adhan 4.4.6,
`Rounding.None`, TZ Asia/Dhaka, dates built from literal capture strings, no clock read.

## THE FINDING: the IFB band artifact is online, dated, and parse-clean

`mawaqit.net/en/bolura-sylhet` (বলাউরা কসকালিকা জামে মসজিদ, 24.9136N 91.7825E, Asia/Dhaka)
serves a 365-row 2026 table whose every column is quantized into 4-7 day bands and whose
dhuhr is a fixed clock. That is the IFB permanent-schedule signature, and it is the first
dated digital witness of it — the record's "the band question is PRINT-ONLY" is now lifted
by one online surface.

Band census (365 days, `data/bolura-sylhet-bands.json`, 68 bands):

| band length | 4d | 5d | 6d | 7d | 9d | 10d | 15d |
|---|---|---|---|---|---|---|---|
| count | 12 | 42 | 4 | 7 | 1 | 1 | 1 |

- dhuhr: ONE value, 13:10, all 365 days (fixed clock, not solar).
- fajr / sunrise / maghrib / isha change on the same day (boundaries aligned).
- asr quantizes more coarsely (58 runs), as expected where the shadow curve is flat.

### Fit (one recipe, 365 days, 2026)

fajr 19.25, isha 18.65, **asr HANAFI**, maghrib = sunset + 3, sunrise plain, dhuhr = clock 13:10.

| column | margin | within 1 min | note |
|---|---|---|---|
| fajr | +2 | 45% | band quantization caps it by construction |
| sunrise | 0 | 61% | |
| dhuhr | +76 (median) | 11% | not solar: fixed 13:10 |
| asr | 0 | 76% | Hanafi decisive; Shafi misses by 58 min |
| maghrib | +3 | 64% | |
| isha | -2 | 45% | |

Seasonal amplitude: fajr 05:11 (Jan) to 03:34 (Jul) = 97 min; isha 18:39 to 20:14 = 95 min.
Span: one published cycle (2026), permanent by construction. Grade: provisional (community
surface reproducing an authority artifact). The 45% fajr/isha accuracy CONFIRMS the record's
"band quantization caps any recipe near 50 pc exact BY CONSTRUCTION".

### One object or a zone table? — measured, not settled

What the evidence decides:
1. The band table's implied reference point, fitted over sunrise+maghrib with the recipe fixed,
   is **25.15N 91.30E** (MAE 1.99 min) against the mosque's own 24.91N 91.78E. The table is
   therefore not mosque-local: it is computed for a reference point ~0.5 deg away.
2. The five Dhaka-area mosques on the same platform carry **no band artifact at all** — each
   pins its own clocks on a smooth platform table. So the band artifact is not a platform-wide
   national object.
3. Rangamati's district office publishes its schedule titled **"রাঙ্গামাটি জেলার নামাজ ও রোযার
   স্থায়ী সময়সূচি"** — a DISTRICT schedule, not a national one.

What it does not decide: no second city's band table was recovered, so bands could not be
compared city-to-city. The zone/district-table hypothesis is supported and unproven. The
measurement that would close it: any one other district's band table (one row per band is
enough) compared against `data/bolura-sylhet-bands.json`.

## City layer (mawaqit, community tier, platform engine)

Five mosques hold a full 2026 calendar in the page's `confData` (`calendar` is 366 slots with a
padded Feb 29; index 59 is padding — verified: Uttara reproduces 2026 solar at MAE 0.01 min
under that mapping and 1.7 min under a leap-year mapping).

| mosque | coords | rows | fajr | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|---|
| Bolura, Sylhet | 24.914 91.782 | 365 | 19.25 | clock 13:10 | Hanafi | sunset+3 | 18.65 |
| Uttara 7no Sector, Dhaka | 23.870 90.398 | 365 | 15.00 (100%) | clock 13:30 | frozen 17:00 | sunset (100%) | frozen 20:15 |
| Mirpur DOHS Central, Dhaka | 23.836 90.368 | 365 | frozen 05:30 | clock 13:15 | Hanafi | sunset | pinned 19:45 |
| Mirpur DOHS 3, Dhaka | 23.841 90.366 | 365 | coarse bands (15/10/16d) | clock 12:50 | Hanafi +9 | sunset+4 (94%) | coarse bands |
| Sara Builder, Dhaka | 23.750 90.348 | 365 | floor 05:00 (263d) | clock 13:00 | Hanafi | sunset | ceiling 20:00 |

Structural result: the Bangladeshi mosque layer is **five independent configurations on one
platform engine** (mawaqit default fajr 15.00, maghrib = sunset, asr Hanafi). Each mosque pins
its own zuhr clock (12:50 / 13:00 / 13:10 / 13:15 / 13:30) and its own fajr floor or isha
ceiling. No shared national table exists at this layer.

Defect recorded: Sara Builder's maghrib freezes at 17:24 from 2026-10-26 to year end (page
`lastUpdated` 2026-10-30) — a stale tail, not a rule.

## District Islamic Foundation offices — honest negative, with one exception

- 21 district subdomains probed (`captures/ifb-district-sweep/`): dhaka, chittagong, khulna,
  rajshahi, sylhet, barisal, rangpur, mymensingh, comilla, bogura, jashore, dinajpur, faridpur,
  patuakhali, noakhali, coxsbazar, tangail, kushtia (+ the jessore/bogra/cumilla aliases).
  All 200. **None links a prayer page**; `/pages/internal-eservices` carries no সময়সূচি hit on
  any of the 12 probed.
- The predecessor slot's 24 divisional captures (`../bangladesh-cities/captures/`, 04:0xZ) hold
  officer lists and news only: zero prayer tables, one clock glyph per page. Confirms
  O1k-W17's "district layer is officer lists".
- **Exception, NEW surface:** `islamicfoundation.rangamati.gov.bd` publishes
  "রাঙ্গামাটি জেলার নামাজ ও রোযার স্থায়ী সময়সূচি" as an unlinked static page carrying a
  3595x5385 poster (10.2 MB, CMYK, scanned rotated and mirrored). Header read at zoom:
  তারিখ | সাহরীর শেষ সময় | ফজর | সূর্যোদয়ের সময় | যোহর | আছর | সূর্যাস্ত | মাগারিব ও ইফতার |
  এশা — the permanent-schedule format including sahr and iftar columns.
  Banked: `captures/ifb-rangamati-permanent-schedule.jpg` (+ upright PNGs).
  **Not transcribed this wave**: the scan's orientation resists automated correction and the
  digit glyphs do not resolve reliably at the crops obtained. The artifact is saved, which is
  the Kelantan requirement; transcription is one vision pass away.

## Traps caught

- `masjidbox.com/namajera-samaya/baitul-mukarram-masjid-...` prints a Bengali schedule and is
  **Baitul Mukarram Masjid, Regent Street, Haslingden, Rossendale BB4 5HQ, UK** — a third
  same-name trap for Baitul Mukarram (after Arlington US and Southall).
- `mawaqit.net/en/m/baitul-mukarram-masjid-arlington-22204-united-states` — the recorded US trap,
  still the only "Baitul Mukarram" on mawaqit.
- masjidbox "Baitul Aman Jame Mosque", "Masjid Baitul Amaan" (UK) and "Baitul Aman Masjid"
  (Danforth, Japan): all diaspora, none Khulna.
- `jagonews24.com` daily IFB schedule articles: Cloudflare block (403 to curl, challenge to a
  real browser). Not solved, per rules.

## Honest negatives

- Chittagong (Andarkilla), Sylhet (Shah Jalal), Khulna, Rajshahi, Bogura, Comilla: no mosque with
  a dated table. Results are calculator/aggregator feeds (prayertimes.date, islamicfinder,
  hamariweb, timesprayer, prayersconnect, muslimpro) — computed, not printed, and not witnesses.
- mawaqit bulk directory: `api/2.0/mosque/search` is 401 without a key; `sitemap.xml` is 404.
  Discovery was search-engine only, so the Bangladesh mawaqit population is not enumerated —
  five is a floor, not a ceiling.
- `salat.habibur.com` (64 district pages) is a computed daily page with second-level values
  ("হিসাবে আসে") — a comparator, not the band artifact.
- `kivabe.com` remains the decoy on record (smooth curves, IFB provenance claimed).

## What this CONFIRMS vs what is NEW

- CONFIRMS: Hanafi asr decisive; fajr ridge ~19.25; isha 18.65; maghrib sunset+3; band
  quantization 4-7 days with a fixed zuhr clock; ~45-50% exact is structural, not a bad fit.
- NEW: the band artifact exists as a dated online table (Sylhet); the mosque layer's five-way
  independent configuration; the district-office schedule as an image artifact (Rangamati);
  the Haslingden Baitul Mukarram trap.

## Files

`captures/` 5 mawaqit pages, 1 masjidbox page, 21 district homepages, 12 internal-eservices
pages, the Rangamati poster (10.2 MB) and its derived uprights, the predecessor's 24 divisional
captures referenced in place. `data/` five 365-row dated tables + the 68-band table.
