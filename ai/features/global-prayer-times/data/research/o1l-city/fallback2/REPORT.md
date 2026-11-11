# O1l-53 FALLBACK round 2 — the 15 with new phrasings and languages, plus the Masjidway retry

Wave: O1l city-level round two, second FALLBACK pass. Started 2026-11-11 ~06:18Z host.
Workspace: `$HOME/athan-gitree/census/o1l-city/fallback2/`.
Engine: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`,
`HighLatitudeRule.MiddleOfTheNight`, Shafi unless stated, TZ pinned per surface by `FIT_TZ`,
dates built from literal capture strings, no clock reads. Harnesses: `fit-rw.js` (angle scan and
margins), `angle-rw.js` (residual-flatness forensics), `report-rw.js` (per-month and total),
`parse-tawkit.py`, `parse-masjidway.py`, `fetch.sh` (UA, retries, `--compressed`).

**Headline: four of the fifteen now hold dated rows — Rwanda (authority), Burundi, Armenia,
French Polynesia — 1,201 rows. Masjidway is NOT closed: it serves, then fails, then serves.**

---

## 1. What this wave lifted

| Country | Surface | Tier | Rows | Cities | Fit verdict |
|---|---|---|---|---|---|
| **Rwanda** | RMC monthly timetables (X images) + Tawkit | **authority** | 121 + 330 | Kigali, Musanze + 11 Tawkit cities | **MWL 18/17, zero margins, 91/91 days exact on fajr and sunrise; 121/121 within-1 on all six columns across 2025 and 2026** |
| **Burundi** | `tawkit.net` 6 cities | platform | 180 | Bujumbura, Gitega, Muyinga, Ngozi, Rutana, Ruyigi | **MWL 18/17, constant +0.5 min on every column, 180/180 within-1 on all six** |
| **Armenia** | `tawkit.net` 18 cities | platform | 540 | Yerevan + 17 | **MWL 18/17, sub-minute margins, 540/540 within-1 on all six** |
| **French Polynesia** | masjidway `masjid/3814` (Centre Islamique de Tahiti) | platform | 30 | Papeete | **MWL 18/17, maghrib sunset+4.0, 30/30 within-1 on all six** |

Row total 1,201. Every file is in `data/`; every raw page and image is in `captures/`.

---

## 2. Rwanda — the RMC's own monthly timetable, MWL 18/17 at zero margins

The record held FALLBACK with the reason "no surface", and the prior pass found only a today-only
panel on `rwandamuslim.org`. The authority publishes a **monthly printed timetable**, as an image
on its own X account, in Kinyarwanda and English, headed
"Ingengabihe y'Iswala y'ukwezi kwa … — PRAYER TIMES — UMUJYI WA KIGALI/KIGALI CITY", stamped
"B.P. 594 KIGALI RWANDA OFFICE". Three Kigali months and one province month were recovered and
transcribed:

| month | post | artifact | rows |
|---|---|---|---|
| April 2025 | `x.com/islamrwanda/status/1908644633422274770` | `GnzeLcJWoAA7Fu1` | 30 |
| June 2025 | `x.com/islamrwanda/status/1929781674599965137` | `GseNheiXoAAlshP` | 30 |
| May 2026 | `x.com/islamrwanda/status/2052508906178445749` | `HHv5-PNXUAIOKNp` | 31 |
| June 2025, Northern Province | `x.com/islamrwanda/status/1929781698293575713` | `Gsf2NvMWgAAG8qE` | 30 |

The images were reached through the public syndication endpoint
`https://cdn.syndication.twimg.com/tweet-result?id=<id>` (no login), then downloaded from
`pbs.twimg.com` at `name=orig` and saved. Kigali coordinates −1.9441, 30.0619, `Africa/Kigali`.

Fit at Kigali, all three months, one recipe:

| column | margin | exact | within-1 | MAE |
|---|---|---|---|---|
| fajr (18°) | −0.02 | **91/91** | 91/91 | 0.00 |
| sunrise | −0.07 | **91/91** | 91/91 | 0.00 |
| dhuhr | −0.08 | 90/91 | 91/91 | 0.01 |
| asr (Shafi) | +0.23 | 70/91 | 91/91 | 0.23 |
| maghrib | −0.02 | 90/91 | 91/91 | 0.01 |
| isha (17°) | −0.05 | 89/91 | 91/91 | 0.02 |

The angle scan is unambiguous: fajr's residual series is flattest at **18.0°** (IQR 0.55, range
1.0 min) and isha's at **17.0°** (IQR 0.48), both at zero margin. Every column sits inside one
minute on all 91 days.

**Between-year stability: parameters frozen.** April 2025, June 2025 and May 2026 fit the same
18/17 with the same zero margins, per-month margins within ±0.2 min of each other. **Seasonal
amplitude** (Kigali, near-equator): fajr 04:52 in April to 04:43 in June, +9 min; isha 19:11 to
19:08. Small, as FIT-RULES 3 predicts.

**Northern Province** is one table for the whole province with no town named. Fitting it at
Musanze (−1.4998, 29.634) reproduces **30/30 within-1 on all six columns, 179/180 exact** on the
same recipe, which recovers and validates the reference point.

**Second witness.** Tawkit's independent platform table for 11 Rwandan cities (Kigali, Musanze,
Rwamagana, Butare, Kibuye, Gisenyi, Byumba, Cyangugu, Gitarama, Kibungo, Nzega), November 2026,
330 rows, fits **18/17 with a constant +0.5 min** on every column, 330/330 within-1. A second
publisher's engine lands on the authority's angle pair.

**Southern Province — captured, not validated.** The June 2025 Southern Province table was
transcribed (`captures/rw-rmc-2025-06-prov-south.jpg`, 30 rows) and does **not** reproduce at Huye:
margins +0.73 fajr to +1.52 isha, with only 15-27 of 30 inside a minute, and the offset growing
with time of day. A coarse coordinate inversion over the province (−3.0..−1.9 N, 29.4..30.0 E)
reaches 180/180 within-1 only at about −2.85, 29.50 with 68/180 exact, against 179/180 exact at
Musanze for the Northern table. The reference point is therefore **not recoverable to the Selangor
standard**, so Southern Province is recorded as a captured authority table and **not counted as a
city**. Its rows were removed from `data/` rather than filed under a town it cannot be shown to be.

- Grade: **A** on the FIT-RULES definition (two distinct fitted years, one recipe reproduces both),
  with the caveat recorded plainly: the span is 3 months of 2025-2026, not two full cycles.
- Ceiling: 3 months of 24 published by this route; the X account posts monthly, so the backward
  harvest is the way to a full span.
- Forward longevity: **stable across 2 years**; no regime change dated in the span held.

---

## 3. Burundi — six cities, one platform recipe

`https://bi.tawkit.net/fr/` redirects to `https://www.tawkit.net/en/prayer-times/burundi/`, which
lists six cities and states each carries "today's prayer times and the timetable of the month".
Each city page embeds its own coordinates in JSON-LD, so the reference point is recoverable
without guessing. All six captured and parsed, November 2026, 30 rows each.

| city | lat | lon | fajr ex | sunrise ex | dhuhr ex | asr ex | maghrib ex | isha ex |
|---|---|---|---|---|---|---|---|---|
| Bujumbura | −3.38193 | 29.36142 | 11/30 | 18/30 | 12/30 | 15/30 | 18/30 | 23/30 |
| Gitega | −3.42708 | 29.92463 | 18/30 | 18/30 | 20/30 | 13/30 | 21/30 | 22/30 |
| Muyinga | −2.84510 | 30.34140 | 13/30 | 20/30 | 14/30 | 15/30 | 21/30 | 23/30 |
| Ngozi | −2.90750 | 29.83060 | 15/30 | 18/30 | 14/30 | 15/30 | 21/30 | 23/30 |
| Rutana | −3.92790 | 29.99200 | 19/30 | 21/30 | 21/30 | 14/30 | 19/30 | 22/30 |
| Ruyigi | −3.47639 | 30.24861 | 14/30 | 10/30 | 22/30 | 16/30 | 21/30 | 24/30 |

All six columns are **180/180 within-1** at all six cities on one recipe: **fajr 18°, isha 17°,
Shafi, constant +0.5 min on every column**, MAE 0.2-0.6 min. The uniform +0.4/+0.5 min offset
across every column and every city is a rounding convention (the platform rounds up where adhan
rounds nearest), not a tuned margin. Angle forensics: fajr flattest at 18.0 (margin +0.51, IQR
0.55), isha flattest at 17.2 (margin −0.60) with 17.0 at margin +0.25.

- Grade: **candidate** — one month, one computed generation, six cities.
- Defect worth recording: the city page's live panel contradicts its own monthly table. Bujumbura
  11-11-2026 reads Asr 15:09 in the panel and 15:05 in the table, Isha 19:03 against 19:01. The
  panel is a separate computation from the table on the same page.

---

## 4. Armenia — eighteen cities, one platform recipe

`https://www.tawkit.net/en/prayer-times/armenia/` lists 18 cities; all 18 captured and parsed
(November 2026, 30 rows each, 540 rows). TZ `Asia/Yerevan`.

**MWL 18/17, Shafi, sub-minute margins on every column: fajr +0.20, sunrise +0.23, dhuhr +0.05,
asr +0.42, maghrib −0.22, isha −0.10. 540/540 within-1 on all six columns** (fajr 424/540 exact,
dhuhr 509/540, isha 482/540). Angle forensics: fajr flattest at 14.4-15.3 with a −15 to −19 min
margin, which is the near-equator degeneracy breaking down at 40 N; the zero-margin 18.0 lands
inside one minute, so 18/17 is the recipe.

- Grade: **candidate** — one month, platform tier.
- This is the country's first dated surface of any kind. It is not the Blue Mosque's board: the
  mosque publishes nothing, and the tier stays platform.

---

## 5. French Polynesia — Tahiti's masjidway month, and what it is

`https://fr.masjidway.com/masjid/3814/prayer/112026` returned 200 (40,900 B) with a full dated
month: 30 rows, 2026-10-31..2026-11-29 (`captures/mw-tahiti-112026.html`). Page states
"Méthode: Australia", which is a **platform method label and never provenance**.

Fit at Papeete (−17.5373, −149.5665), `Pacific/Tahiti`:

| column | margin | exact | within-1 |
|---|---|---|---|
| fajr (18°) | +0.07 | 30/30 | 30/30 |
| sunrise | +0.03 | 30/30 | 30/30 |
| dhuhr | +0.08 | 30/30 | 30/30 |
| asr (Shafi) | −0.02 | 16/30 | 30/30 |
| maghrib | **sunset + 3.98** | 30/30 after margin | 30/30 |
| isha (17°) | −0.10 | 28/30 | 30/30 |

- **What this is and is not.** The tenant is unclaimed: the page carries "Si vous êtes le
  représentant de cette mosquée…" and is the platform's computation at the mosque's address. The
  record's verdict — "a calculator with a mosque's address, citable, never" — stands for authority
  and community. What is NEW is that the same page serves a **dated month**, and that month
  reproduces adhan 4.4.6 at zero margins on five columns with a 4-minute maghrib interval. The
  country therefore holds a dated platform surface; it does not hold a publisher.
- The platform serves **any** month and year (`/prayer/042030` is indexed, i.e. April 2030), so
  this is one computed generation, not a published cycle. It can never lift above candidate.
- Grade: **candidate (platform tier)**, flagged for the owner: whether a platform computation at an
  unclaimed tenant's address counts as coverage is an owner ruling, not mine. FALLBACK reason if
  the ruling is no: "platform calculator only, tenant unclaimed".

---

## 6. Masjidway — the verdict

**It is not closed.** The prior pass recorded 503 and treated the month walk as unavailable. This
pass found a working window at 06:24-06:26Z:

| URL | result |
|---|---|
| `https://en.masjidway.com/masjid/3462/prayer/112026/` (trailing slash) | **200, 39,962 B, full November 2026 table** |
| `https://www.masjidway.com/masjid/3462/prayer` | 200, 39,966 B |
| `https://fr.masjidway.com/masjid/3814/prayer/112026` | **200, 40,900 B, full November 2026 table** |
| `https://en.masjidway.com/masjid/3462/prayer/112026` (no trailing slash) | 503, 19 B |
| `https://en.masjidway.com/prayer/112026` | 504, 16 B |

Then, from 06:29Z onward, every form degraded: 502 (16 B), 503 (19 B), and 20-45 s timeouts across
`www`, `en`, `fr`, including URLs that had answered 200 four minutes earlier. `sitemap.xml` is 503;
`robots.txt` is a 31-byte "Service Unavailable" stub; the homepage is a 14.9 KB JS shell with no
country browse and no masjid links.

**Verdict: a flaky backend behind Cloudflare, not a closure.** The month route is
`/masjid/<id>/prayer/<MMYYYY>`, it works on a rotating host, and it needs retries and a
trailing-slash variant. A walk must be attempted in a retry window, host by host, and it will
partially fail. The table it serves is a plain HTML month with weekday-dated rows and six columns
(`parse-masjidway.py`).

Tenant inventory found by search (no browse route exists): **French Polynesia** `masjid/3814`
(Centre Islamique de Tahiti) and **United Kingdom** `masjid/3462` (Southall). No masjidway tenant
was found for Rwanda, Burundi, South Sudan, Liberia, Turkmenistan, Nepal, Myanmar, Armenia, Guyana,
Papua New Guinea, Solomon Islands, Vanuatu, Samoa or Kiribati — `site:masjidway.com <country>`
returned nothing for each, and the country browse that would settle it is not served.

---

## 7. Honest negatives — the phrasings and languages actually tried

Each line names the languages searched and how the surface was closed. Every one is "not found
under these terms".

- **South Sudan** (Juba) — English, Arabic. The South Sudan Islamic Council's Facebook page carries
  an Eid al-Fitr announcement only; its stated site `icsouthsudan.org` does not resolve (curl exit
  6, reconfirmed). New this pass: Tawkit's country list covers Sudan, not South Sudan; no masjidway
  or masjidbox tenant. Every 2026 Juba table found is a calculator (al-habib, NU Online,
  islamicfinder, quranbookk).
- **Liberia** (Monrovia) — English, French. No platform tenant. T-665's January-class feed was not
  located under any phrasing tried; every surface is a calculator. The record's "candidate,
  uncensused" is unchanged and still uncensused.
- **Turkmenistan** (Ashgabat) — Turkmen ("namaz wagty", "Aşgabat namaz wagtlary"), Russian
  ("время намаза Ашхабад", "намаз вагты"), Turkish, English. **Fourth independent sweep, same
  result.** The muftiate stays image-only. New phrasings returned only Diyanet-derived calculators
  (5namaz, 1namaz, moynamaz, raspisanienamaza, namaz.today, azaneum, islam.global, namazvakti,
  islamery) and state news pages that use the word "namaz" without a table.
- **Nepal** (Kathmandu) — Nepali (Devanagari "नमाज समय तालिका", "काठमाडौं"), English. The khidmat
  wrapper is unchanged and still computed. New: `nepalimuslim` (Facebook) publishes an **Eid** table
  only, and Darul Ifta Nepal's "12 Months Namaz Time Table of Kathmandu" is a Facebook post
  republishing an Indian society's table, not a Nepali publisher's own. The country's one mawaqit
  tenant — `mawaqit.net/en/m/jama-masjid-rahmaniya-45800-siddharthanagar-nepal`, Siddharthanagar,
  the Nepali name for Bhairahawa, 27.506 N 83.449 E — was pulled whole (67,609 B,
  `captures/np-siddharthanagar-mawaqit.html`) and **the record's frozen verdict is reconfirmed on
  the full twelve months**: 50 distinct tuples across 366 days, January one tuple repeated 31
  times, dhuhr a fixed 13:30 all year. A frozen board is not a table. No dated publisher table.
- **Myanmar** (Yangon/Rangoon) — Burmese ("နမာဇ်အချိန်", "ဆွလာသ်အချိန်ဇယား", "ရန်ကုန်"),
  English. `mmislamic.znnt.org/adhan-time-table/` was re-fetched in full (49,545 B): it is an
  AlAdhan **client calculator** with a location and method picker, 4 aladhan references, and its
  own banner asks the visitor to use a VPN. The dated rows a search snippet shows are that API's
  output, not a table. The Islamic Centre's domain still does not resolve. New: a private account
  (`lumaw.lumaw.94651`) posts a **daily** Yangon timetable image ("ဆွလာသ်အချိန်ဇယား(ရန်ကုန်)
  2-11-2026"), community tier, one day per post, no month.
- **Guyana** (Georgetown) — English, second pass. CIOG and the Guyana Islamic Trust publish only on
  Facebook, with Ramadan-village announcements and no dated table. `gicmasjid.org` is Georgetown,
  Texas. No platform tenant.
- **Papua New Guinea** (Port Moresby), **Solomon Islands** (Honiara), **Vanuatu** (Port Vila),
  **Samoa** (Apia), **Kiribati** (Tarawa) — English, French, plus the local languages this round:
  Tok Pisin ("prayer taim"), Bislama ("prea taem"), Samoan ("tatalo", "taimi"), Gilbertese
  ("tataro"). No mawaqit, masjidbox, masjidway or Tawkit tenant in any of the five. Every result is
  a calculator. Kiribati's Ahmadiyya community posts Jalsa Salana material, never a timetable.

**Two false leads, recorded so the next pass does not chase them.** A "January 2026 Salāh
Timetable" Facebook post reached through agent-browser resolved to **Masjid E Usman, Bradford,
United Kingdom**, not South Sudan. A "September 2026 timetable — Jamia Masjid Haroonia Islamic
Centre" post is likewise not Myanmar's Islamic Centre. Facebook answers curl with 400; agent-browser
renders the public post text but the timetables are images inside it, so a post is only evidence
once its image is captured, and neither of these is in-country.

---

## 8. Counts

- **Lifted from FALLBACK by this wave: 4 countries** — Rwanda (authority, 451 rows), Burundi
  (platform, 180), Armenia (platform, 540), French Polynesia (platform, 30). **1,201 dated rows.**
- **Still FALLBACK: 11** — South Sudan, Liberia, Turkmenistan, Nepal, Myanmar, Guyana, Papua New
  Guinea, Solomon Islands, Vanuatu, Samoa, Kiribati. In ledger rows that is **8 rows** (Rwanda/
  Burundi/South Sudan was one row and is now partly lifted; the five Pacific states remain one row;
  Palestine stays out of scope).
- Masjidway: **available intermittently**, month route usable in a retry window.

Nothing here is a completeness claim. Every negative is "not found under these terms".
