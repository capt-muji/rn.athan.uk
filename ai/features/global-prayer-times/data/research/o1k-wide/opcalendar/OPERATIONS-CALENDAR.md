# OPERATIONS-CALENDAR — the O1k-wide night's watches and accrual, compiled 2026-11-11

One sheet for the scheduler. Every dated watch and every recurring capture the programme now
needs, consolidated from `decisions/DECISIONS.md` (W1-W5), `CONSOLIDATION.md` returns, the bake
RUNBOOK Part 5 and daily class, and the c29 browser-job mechanisms.

**THE GATE.** Every recurring row (tables 2 and 3) is gated by the owner's open host-and-cadence
decision (W5): accrual needs a host and a cadence, and the open call is host and cadence, not
whether to accrue. That call is his; this sheet only prices the work. Nothing below is scheduled
until he names them. One-shots (table 1) are dates, not crons, and stand regardless.

**Landing conventions.** BAKE = the annual bake pipeline (`raw/<id>.bin` → `artifacts/<id>.json`
+ `bake-ledger.json`), owner-triggered, never CI. CENSUS = the capture tree under
`$HOME/athan-gitree/census/`, in the wave directory named in the row.

**Already landed, no watch stands:** Singapore MUIS 2027 (year-4, parsed tonight) and UAE Awqaf
Jan-2027 (1,860 rows). Saudi and London hold 50+ years. Maldives is not annual.

---

## 1. One-shot watches

| Date (UTC) | Surface | What to check | Where the capture lands |
| --- | --- | --- | --- |
| 2026-11-29 ±3 | **Chile December (W3)** | December publishes then (December 404 tonight); 18 city PDFs at radioislam.cl; Viña del Mar's link has pointed at the stale October file for 3 months — check whether the current file is still unlinked | CENSUS `o1k-wide/americas/` |
| 2026-12-01 | **Morocco Habous/ministry portal** | Probe from 01-12 per RUNBOOK; signal: any `/prieres/` path answers 200, or a `data/horaires-2027-MM.js` appears on the rebuilt ministry portal (Oct+Nov 2026 live tonight; D5 rides on it) | BAKE `ma-habous-rabat` |
| 2026-12-15 | **Indonesia 2027 month 1** | `api.myquran.com` month 1 of 2027 returns rows (probe 15-12, monthly tail to 31-01); Kemenag SIHAT API still 2026-only tonight | BAKE `id-kemenag-jakarta` |
| 2026-12-20 (hard stop 12-31) | **Brunei MORA 2027 (W1)** | OData list still ends 2026-12-31; signal: newest OData `Date` passes 31-12; also recheck the 100-list catalogue for a second prayer list | BAKE `bn-mora-brunei` |
| 2026-12-20 → 2027-01-14 | **Kosovo BIK takvim 2027 (W2)** | No 2027 edition exists yet; last year's landed 14 January, so probe late December and keep the recheck open through mid-January | CENSUS `o1k-wide/balkans2/` |
| 2027-01-01 | **JAKIM e-Solat 2027** | 59 zones, feed always current but still serves 2026 only tonight; signal: first `date` reads `01-Jan-2027` | BAKE `my-jakim-*` |
| 2027-01-01 | **Selangor zone split** | 3 zones split to 9 districts on 2027-01-01; check the zone list changes and whether the SGR01/WLY01 multipoint jitter resolves | BAKE `my-jakim-*` + CENSUS `o1k-wide/sea2/` |
| 2027-01-01 (hard stop 01-05) | **Turkey Diyanet 2027** | Yearly table's first row reads `01 Ocak 2027`; 2027 not served yet tonight | BAKE `tr-diyanet-istanbul` |
| 2027-01-01 (hard stop 01-20) | **Thailand SKTHAI 2027** | New XLSX hashes and a `ปี 2570` edition; CDN 403s non-browser clients, so the proxy fetch path is mandatory | BAKE `th-skthai` |
| 2027-01 (recheck each January) | **Pakistan unified calendar (D13)** | The twin-city 2026 unified edition is unpublished on both ministry registers tonight; if the 2027 edition also fails, close the watch | CENSUS `o1k-wide/southasia2/` |

---

## 2. Monthly captures

All gated by the host-and-cadence decision (W5).

| Publishing window | Surface | Endpoint | What a month looks like | Where it lands |
| --- | --- | --- | --- | --- |
| 05th of month (RUNBOOK) | **Sri Lanka ACJU (W4)** | `acju.lk/prayer-times/` → `wp-content/uploads/<Y>/<M>/` zone files | New `uploads/<Y>/<M>/` for all zones (12 served tonight; RUNBOOK ledger expects 13), JPG+PDF hash-named | BAKE `lk-acju-*` |
| ~29th of prior month | **Chile monthly** | `radioislam.cl/horarios-<mes>/` (Centro Islámico de Chile) | 18 city PDFs x ~30 rows for the new month; 540 rows re-verified 0 mismatches in November | CENSUS `o1k-wide/americas/` |
| 1st of month | **Egypt ESA monthly** | POST `esa.gov.eg/monthlymwaket.aspx` (full VIEWSTATE postback) | The GridView returns 28-31 rows; November replayed 30/30, recipe 180/180 within 1 | BAKE `eg-esa-cairo` |
| Month roll, any year | **Bosnia rijaset echo** | `api.vaktija.ba/vaktija/v1/77/<YYYY>` | 12 `mjesec` arrays x 28-31 days; the 2027-01 echo is byte-identical to 2026-01-01 (frozen signature live) | CENSUS `o1k-wide/balkans2/` |
| Hijri month start | **Kelantan mufti posters** | `facebook.com/MUFTIKELANTAN` monthly posts (public-post crawler render) | Two poster images, zon 1 + zon 2, full Hijri-month tables; SAVE THE IMAGES (the once-described-never-saved gap) | CENSUS `o1k-wide/kel2/` |
| Weekly tables roll; monthly PDF at month turn | **CERFI Senegal** | `cerfi.sn` per-city weekly tables + `cerfi.sn/static/salats/<City>/mois/<City>_<M>.pdf` (rolls with current year) | 4-5 weekly tables (152 cities) + one monthly PDF per city with a text layer; two-dawn convention, fixed-interval gates | CENSUS `o1k-wide/africa/` |
| Monthly image, observed as early as the 31st of the prior month | **Gambia GSIC calendar** | `facebook.com/thegsic` posts (login-walled; capture via the lookaside route: search-visible posts and group shares) | One calendar image, 29-31 days x 11 columns (azaan+iqamah pairs), Greater Banjul | CENSUS `o1k-wide/africa/` |

---

## 3. Daily accrual

All gated by the host-and-cadence decision (W5). Grade citations: the multi-year ruling is R1
(T-667 #6943) — A needs 2 to 3 distinct years on one recipe; the frozen-generation precedent is
R2 (T-668 #6986) — byte-identical editions across years are one computed generation and never
lift provisional to A.

| Surface | Endpoint shape | Retention / quirk | What a year of accrual buys |
| --- | --- | --- | --- |
| **Jordan Awqaf grid** | `awqaf.gov.jo/ar/Pages/PrayerTime`, `MainContent_gvWebparts` 10-day grid | Server-bound today+9; a missed day is recoverable for 10 days; the Fajr-16 December switch question stays open until December is accrued day by day | Year-2 of the Amman authority grid (60/60 within 1 tonight, maghrib +7 cliff fresh-verified). R1: second distinct year on one recipe opens the provisional-to-A path |
| **Qatar MOI portal** | `portal.moi.gov.qa/.../prayertimings/today/en`, HTML fragment, today only | One day per fetch; a missed day is unrecoverable from this surface; `isha - maghrib == 90` every day (the strongest invariant) | The accrual IS the record: year-2 of Doha's rolling capture. R1: second distinct year on the live surface; the recipe ships if the capture ever stops |
| **Yemen Sanaa API** | `awqaf.gov.ye/api/method/blue_theme...get_page_data?fetch_date=`, Frappe app, 31 locations x day | ~10-day retention: uncaught days are gone; a full month needs daily accumulation; disjoint geography from the government feed (fajr +13.3 / isha +14.2, D2 pending) | The capital-row evidence D2 option b names ("the Sanaa API is the capital row, by daily accrual"). R1: a dated multi-location year-1, owner's D2 ruling needed first |
| **Hungary MME** | `regi.iszlamweb.hu/index.php?content_type=salaattimes&content_id=17`; checkbox gate → one live `PHPSESSID`; `salaattimes_city=<id>` cookie per settlement | 5-day rolling window (Ma..+4), no widening exists; same day arrives from 5 settlements' visits — dedupe on (settlement, date); 3,160 fetches/day full, or restrict to wanted towns. Mechanism spec: `census/c29-browserjobs/mme-mechanism.md` | First full year for the MME line (fajr 18.05 / isha 17.3 family, Shafi asr, 3,160-settlement gazetteer held). R1: one published cycle makes it provisional; A waits for years 2-3 |
| **COSIM Côte d'Ivoire today endpoint** | `cosim-ci.org/ressources/prayer-times?city=<name>` with `X-Inertia` headers; `date`/`month`/`year` params all ignored | Today-only; 6 of 19 cities 503 on a server-side geocoder fault; served times are an Aladhan wrapper at ISNA 15/15 with junk coordinates (8.8888/7.7777 for every city) | No grade movement: a computed wrapper accrues no published years, so R1 never engages and R2 has nothing to cap. The series only documents platform continuity as a cross-check; the authority-class monthly JPEG calendar is a separate artifact the owner may add to table 2 |
| **Tunisia meteo.tn archive** | `meteo.tn/horaire_gouvernorat/{date}/{gouv}/{deleg}`, date-addressable | Serves back to 2020: no retention window, a missed day costs one back-request. The back-fill is one-shot (deep2 holds Tunis 2020-2026; tncities extends Kairouan/Gafsa/Sfax) | Redundancy, not grade: the recipe is already frozen across seven years and grade A stands (deep2, fit1, verify3). R1 is satisfied; accrual only widens the span |

**Excluded from accrual:** Libya's awqaf widget and Iran's ut.ac.ir sit behind challenges and are
recorded closed (D10 and D11 both recommend the closed side) — no cron touches them unless the
owner overturns those calls.
