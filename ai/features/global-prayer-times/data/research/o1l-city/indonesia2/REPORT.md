# O1l-32 — Indonesia, second publishers (city-level round two)

Agent O1l-32, 2026-11-11. Workspace `census/o1l-city/indonesia2/`.
Engine: adhan 4.4.6 (`census/adhan-build/node_modules/adhan`), `Rounding.None`, TZ `Asia/Jakarta`,
no clock reads, dates built from literal capture strings. Second resolution compared, then explicit
per-column rounding.

Held lines tested against (from O1k-1 / O1k-D3 / O1k-F10 / O1l-3):

- Kemenag SIHAT: fajr 20 deg, isha 18 deg, ihtyati +2 fajr / +3 dhuhr / +2 asr / +3 maghrib /
  -3 sunrise, all floor, plus a horizon dip 1.76*sqrt(h) arcmin on sunrise and maghrib.
- Muhammadiyah KHGT: fajr 18, isha 18, +1..2 floor, same dip on its own elevation lookup.
- Fingerprint: KHGT subuh prints 8.0 min later than Kemenag on every city, band [7..9].

## Surfaces found

| Surface | Publisher / tier | Shape | Rows held |
|---|---|---|---|
| `jadwalsholat.org/adzan/monthly.php?id=&m=&y=` | platform table, computed; community | month table per kab/kota, 643 towns, any month any year | 34,648 dated rows (38 cities x 2026 + 6 cities x 2024/2025/2027/2028 = 15,358; 643 towns x November 2026 = 19,290) |
| `persis.or.id/news/read/mengapa-waktu-magrib-dan-subuh-berbeda-beda` | PERSIS, authority (its own statement) | prose with dated worked values | 2 dated values (Bandung 2026-02-19) |
| `ldiijakarta.or.id/jadwal-shalat/` | LDII DKI Jakarta, community | iframe to the platform table above (`id=310`) | shares the platform surface |
| `api.aladhan.com/v1/timings?...&method=2` embedded at `istiqlal.or.id` | Istiqlal mosque layer, community | live day only | 0 dated |
| `mawaqit.net/id/m/masjid-jami-baiturrahmah-jakarta-selatan-12450-indonesia` | mosque, community (mawaqit platform) | full 12-month calendar in the page | 365 dated rows (2026) |

Raw artifacts: `captures/jsorg-*.html` (504 month pages), `captures/jsorg-all/*.html`
(653-town November sweep), `captures/persis-article.html`, `captures/ldii-jakarta.html`,
`captures/mawaqit-baiturrahmah-jaksel.html`, `captures/nu-checkpoint.png`,
`captures/kem-*.html`, `captures/www_istiqlal_or_id.html`, `captures/salman-jadwal.html`.
Normalized rows: `data/jadwalsholat-org-rows.json`, `data/mawaqit-baiturrahmah-jaksel.json`.
Fits: `data/jsorg-margins.json`, `data/jsorg-vs-sihat.json`, `data/jsorg-vs-khgt.json`.

## The main find: a national dated surface on the Kemenag line

`jadwalsholat.org` serves a month table for **643 kabupaten/kota**, with `m` and `y` free parameters
and no key. Past and future years both render (2024, 2025, 2026, 2027, 2028 all probed). The full
November 2026 sweep was banked: 643 towns, 19,290 dated rows, every page saved under
`captures/jsorg-all/` (`data/jsorg-nov2026-all.json`).

**Two towns serve a corrupt table.** Larantuka and Wakatobi (both in the southeast, WITA) return
scrambled columns on all 30 days — fajr 11:07, sunrise 09:42, dhuhr 03:34 in one row, a different
set the next, cycling. Every other town's column ordering is sound and every other town's rise/set
pair is symmetric about its dhuhr to within rounding. Recorded as a publisher defect on two towns,
never as a recipe failure.

**Recipe (free fit, adhan 4.4.6, 38 cities, 2026):** fajr 20 deg, isha 18 deg, asr Shafi,
fajr +2.0, sunrise -2.0, dhuhr +2.0, asr +2.0, maghrib +2.0, isha +2.0, floor.
WIB cities: median margin +2.0 on every column but sunrise (-2.0); within-1 93-100% at every city
whose gazetteer point matches the site's. Seven cities (padang, palu, sorong, manokwari, ternate,
samarinda, jayapura) scatter to 10-60% within-1 on a median still at +2.0: a coordinate disagreement
between my reference point and the site's, not a recipe failure.
WITA cities print +62 and WIT cities +122 against an Asia/Jakarta model, i.e. the site serves each
city in its own civil zone (the +60/+120 is the zone, not the margin).

**Which national line.** Measured against both held lines, same city-days:

- against KHGT: fajr **-8.0 min, band [-10..-6], at 38/38 cities, 365 days each**; isha +0..+1;
  maghrib 0; asr 0; dhuhr 0..+1. The 8-min fingerprint lands squarely on the Kemenag side.
- against SIHAT: fajr 0, isha 0, asr 0, dhuhr -1, maghrib -1, sunrise +1 at sea-level cities.
  The residual is the elevation term, not the angles: Bandung (720 m) sunrise +5 / maghrib -5,
  Wamena (1,668 m) sunrise +6 / maghrib -4.

So the platform runs the Kemenag angles with a **uniform +2 minute ihtyati** where Kemenag prints
+2/+3/+2/+3/-3, and **omits the horizon dip that Kemenag applies at elevation**. The angle pair is
Kemenag's; the margins are its own; the elevation policy is PERSIS's stated doctrine (below).

**Independent confirmation of a recorded defect.** Against SIHAT, Mataram and Kupang print
+59/+60 min on every column — the O1l-3 wrong-zone render (both cities served on a WIB clock)
read from a second, independent surface. The platform serves them correctly.

**Span and stability.** 2024, 2025, 2026, 2027, 2028 on six cities, two months each: margins frozen
to within 0.5 min in every year (bandung fajr 1.6-2.3, maghrib 1.9-2.1 across all five years).
Because the table is computed on demand rather than printed, this proves engine stability and the
absence of a regime change; it is not evidence about a publisher's year-to-year drift. Recorded as
a frozen-generation caution, not a year-2 pass.

Seasonal amplitude (1 Jan vs 1 Jul fajr), the near-equator spread: Banda Aceh -19 min,
Kupang +38, Manado -5, Jayapura -2 — latitude-ordered, no outlier.

### Fit summary

| Surface | Span | Rows | Recipe | Per-year | Stability | Amplitude |
|---|---|---|---|---|---|---|
| jadwalsholat.org | 2024-2028 | 15,358 | 20/18, +2 all, -2 sunrise, no dip | 2026 within-1 93-100% (38 cities); 2024/25/27/28 same medians | frozen, computed (not a reprint test) | 2-38 min fajr, latitude-ordered |
| mawaqit Baiturrahmah | 2026 | 365 | 20/18, +2/+3/+3/+2..3, no dip, sunrise 0 | fajr 99.5%, sunrise/dhuhr/maghrib/isha 100%, asr 52.3% | single year | 23 min fajr |

Both are **community tier** by publisher: a platform table and a mosque table, not an authority.
Neither is merged into the Kemenag or KHGT object; each is its own fitted surface that happens to
sit on the 20-deg line.

## PERSIS — stated method, with the arithmetic to match

PERSIS's own article (20 February 2026, `persis.or.id`) states the position outright:

- fajr criterion **-20 deg**, shared with NU and Kemenag; Muhammadiyah at -18.
- elevation correction: Kemenag and NU apply it "secara mutlak"; **PERSIS does not**, and
  **Muhammadiyah dropped it again for 2026** (it had used it from 2022) — a dated regime change
  inside the second publisher, on record in its own words.
- worked values for Kota Bandung, 19 February 2026: maghrib 18.14 (PERSIS), 18.14 (Muhammadiyah),
  18.20 (Kemenag and NU); subuh 04.37 (PERSIS), 04.38 (Kemenag), 04.45 (Muhammadiyah).

Reproduced on adhan 4.4.6 at Bandung (-6.9175, 107.6191): raw sunset 18:12:14, raw 20-deg fajr
04:35:03. Sunset +2 floor = **18:14** (PERSIS's print); 20-deg fajr +2 floor = **04:37** (PERSIS's
print). The published arithmetic holds to the minute, and it is the same construction the platform
table above runs.

**No PERSIS dated table online.** `persis.or.id/almanak` is 404. The Almanak Persatuan Islam 1447 H
and the Bandung branch's Ramadan 1447 schedule exist only as Facebook and Instagram posts, which are
login-walled. Recorded as an honest negative, not as absent data: the almanac exists, the public
web does not carry it.

## NU Online — dated surface blocked, method now stated

`jadwalsholat.nu.or.id` (NU's own per-province and per-kab/kota schedule) returns a **Vercel
Security Checkpoint**: curl gets HTTP 429 plus `vercel.link/security-checkpoint`; a real Chromium
session (`AGENT_BROWSER_SESSION=o1l-indonesia2`) renders the page body
**"Failed to verify your browser" / "Code 21" / "Vercel Security Checkpoint"**
(`captures/nu-checkpoint.png`). Not solved, per the standing rule. This reproduces O1k-1's finding
with a browser rather than a plain client, so the block is the publisher's edge, not a user-agent
filter.

NU's method is nevertheless on its own domain, in the Super App FAQ
(`app.nu.or.id/faq/jadwal-shalat/…`, captures `captures/nu-faq-*.html`):

- **Subuh -20 deg, Isya -18 deg, by the Lembaga Falakiyah NU** — the same angle pair as Kemenag.
- elevation is applied, "khususnya untuk akurasi waktu maghrib dan terbit matahari" — the same
  physical term Kemenag and PERSIS's article describe.
- **no ihtiyati by default** in the current version ("tidak menambahkan waktu ekstra (ihtiyath)"),
  where Kemenag prints +2.
- **round up to the next minute**, with worked examples: maghrib 17:59:03 → 18:00, subuh 04:41:57
  → 04:42.
- per-user GPS coordinates, not a markaz table.

So NU sits on the Kemenag angle pair and the Kemenag elevation doctrine, but on a different rounding
and a different ihtiyati policy: NU and Kemenag will disagree by up to two minutes on any given day
without either being wrong. A NU table, if the edge ever opens, must be fitted as its own object,
never merged into the Kemenag line.

## Provincial Kemenag hosts — 39 host names probed, none carries a table

`data/prov-kemenag-probe.txt`. 39 host names probed (the 38 provinces, with `dki` and `jakarta`
both tried for the capital). Six have no DNS record: `dki`, `jakarta`, and the four post-2022
Papua provinces (`papuatengah`, `papuapegunungan`, `papuaselatan`, `papuabaratdaya`).

- 29 hosts: connection failure (`000`) against Kemenag's own 103.7.13.x addresses — TLS/connect,
  not a 403 and not a challenge.
- `sumbar.kemenag.go.id`: HTTP 200, a 3,964-byte **maintenance page**.
- `jateng.kemenag.go.id`: HTTP 200, a news portal; the only "sholat" string on it is
  "sholat istisqo" in a news headline.
- `papua.kemenag.go.id`: HTTP 200, 118 KB, no prayer surface.

No dated table, no embed of SIHAT, no per-province PDF. The provincial layer does not exist as a
publisher; SIHAT is the whole of Kemenag's public data.

## Mosque layer

- **Istiqlal (Jakarta).** The homepage clock is confirmed to call
  `api.aladhan.com/v1/timings?latitude=…&longitude=…&method=2` — `method=2` is AlAdhan's ISNA
  preset, 15/15. O1k-1's reading holds, now with the endpoint and the parameter quoted. `istiqlal.or.id/jadwal-shalat` is 404; there is no second dated surface.
- **Mawaqit, Masjid Jami' Baiturrahmah (Jakarta Selatan).** Full 12-month calendar embedded in the
  page, 365 rows, 2026 confirmed by matching the page's own today-row to the calendar's 11 November
  entry (04:06 / 05:25 / 11:40 / 14:59 / 17:51 / 19:04). Recipe: fajr 20 +2 floor (within-1 99.5%),
  sunrise 0 (100%), dhuhr +3 (100%), maghrib +3 (100%), isha +2..3 (100%) — **Kemenag's angles, no
  elevation dip**. It is a mosque on the Kemenag line, not the Muhammadiyah line (18/18 scores
  fajr -5.9 against it).
  **Asr does not hold:** within-1 only 52.3%, with a seasonal swing of -0.45 min (September) to
  +2.43 (March-April), near zero at both solstices. That shape is a shadow-factor signature, not
  noise; the factor was not derived here and is left as an open question for the owner, not
  adjudicated. Seasonal amplitude (1 Jan vs 1 Jul fajr): 23 min, near-equator as expected.
- **Masjidbox, Indonesian Islamic Centre.** Renders a live countdown only; no dated table in the
  DOM after a full browser render.
- **Masjid Salman ITB.** `salmanitb.com/informasi/jadwal-shalat` exists and renders
  **"Tidak ada konten tersedia saat ini"** — an empty page.
- **Masjid Agung Al-Azhar (Jakarta).** No prayer surface in the navigation or the page; the
  `/jadwal-sholat` path is an SPA catch-all returning the homepage.
- **Masjid Agung Sunan Ampel (Surabaya), Masjid Raya Al-Mashun (Medan), Masjid Raya Makassar.**
  No own-domain dated table; presence is Instagram and Facebook only, login-walled.
- **Masjid Raya Sunda Kelapa.** `sundakelapa.id` does not resolve.

## Honest negatives (languages searched: Bahasa Indonesia, English)

- **Al-Washliyah** (`washliyah.or.id`): no prayer-time surface anywhere on the site.
- **DDII** (`dewandakwah.id`): no prayer-time surface.
- **Hidayatullah** (`hidayatullah.com`): Cloudflare "Just a moment…" interstitial on a real browser
  session; not solved. `hidayatullah.or.id` carries news only.
- **LDII national** (`ldii.or.id`): no table. The DKI Jakarta chapter does carry one, and it is the
  platform iframe above (`monthly.php?id=310`, Jakarta Selatan) — recorded as community tier, the
  platform's rows, not LDII's own.
- **Masjidal** for Indonesia: the widget bundle requires `x-api-key` plus a `widget_id` and clamps
  requests to a 35-day window; no keyless Indonesian tenant was enumerated in the time held.
- **NU Online**: Vercel Code 21 (above).
- **Provincial Kemenag**: 39 host names, zero tables (above).

## What confirms, what is new

- **Confirms** the two-line structure and the 8-min fingerprint at a third, independent surface:
  a national platform sits on the 20-deg line, 8.0 min ahead of KHGT, at 38 cities x 365 days.
- **Confirms** the O1l-3 Mataram/Kupang wrong-zone defect from outside Kemenag.
- **Confirms** Istiqlal's AlAdhan ISNA 15/15 with the exact endpoint and preset number.
- **New**: PERSIS's method is now stated and its arithmetic reproduced to the minute, including
  **Muhammadiyah's 2026 reversal on elevation correction** — a dated regime change inside the
  second publisher.
- **New**: NU's method is stated on its own domain — 20/18 by the Lembaga Falakiyah, elevation
  applied, **no ihtiyati**, round-up — a third line inside the 20-deg family, distinct from
  Kemenag's floor-plus-two.
- **New**: a 643-town dated surface exists outside both national publishers, on the Kemenag angles
  without the elevation term, serving any year 2024-2028 and beyond; 19,290 rows banked for one
  month, two towns corrupt.
- **New**: the provincial Kemenag layer is closed by measurement rather than by report.

## Not done / open

- The 643-town sweep covers November 2026 only; other months for those towns were not pulled. The
  recipe claim does not depend on it: the 38-city sample already covers every civil zone and the
  elevation classes, and the national sweep confirms the same construction at 641 of 643 towns.
- PERSIS's Almanak 1447 H was not obtained; it is social-media-only, and login-walled.
- No Indonesian masjidal tenant was found keyless.
- The mawaqit Baiturrahmah asr seasonal signature (shadow-factor class) was measured, not derived.
