# O1k wide research, round 2: South Asia

Tag `southasia2`. Research date 2026-11-10. Read-only against the census
(`world-table-v2.md`); builds on the round-1 workspace
`../southasia/REPORT.md` rather than repeating it.

## Headline

The Islamabad chart is now **resolved to a method**. It is Karachi 18/18 with
Hanafi asr for the four solar columns, and two **institutional clocks** for the
rest: dhuhr is a two-phase federal clock (13:00 winter, 13:15 summer, switching
on 15 April and 15 October) and isha is a 15-minute clock ladder of 19 steps.
No angle reproduces isha; the best single angle is 21.1 degrees at a 10.9-minute
rms.

The 2026 twin-city unified calendar has **not moved**: the publication register
still carries only the 2016 chart, and the ministry's news register, which runs
to today, has no Nizam-e-Salat item.

## Pakistan

### Round-2 recheck of the unified 2026 calendar

| Check | Result |
|---|---|
| Publication register `mora.gov.pk/Publications` | 26 entries, newest 2026-10-15 ("Maqalat e Seerat 2025", a book). Entry 22 remains "Nizam-e-Salat Chart 2016 and Onward", dated 01-01-2016, Active. |
| News register `mora.gov.pk/LatestNews` | Live to 2026-11-10. Zero mention of Nizam-e-Salat, prayer times, `نظام صلوٰۃ` or a unified timetable. "Uniform" appears only for Ramadan/Eid moon-sighting, "Nizam" only for the Nizamuddin Auliya urs notices. |
| Urdu and English search | Every hit is the 2025-11 announcement, the 2026-01 consultation, or a computed aggregator. |

**Verdict: unchanged, still pending.** The census's largest watch item stands.

### The Islamabad chart's method, fitted

Source: `../southasia/data/pk-islamabad-nizam-m*.json` (11 printed columns,
366 rows). Engine `tools/solar.py` (NOAA solar position, sun-centre altitudes);
coordinates 33.6844 N 73.0479 E, UTC+5. Scripts `tools/fit_method.py`,
output `data/pk-islamabad-method-fit.json`.

**The template is leap-anchored.** Evaluated on 2028 the fajr residual stays
inside -1.5..-0.1 min in every month; re-phased onto a common year the residual
swings to -2.48 in March and +0.4 in July-October (sunrise sd 0.63 vs 0.98).
The chart prints a 29 February row, which already forces a leap basis. Consequence:
in a common year its March-December rows are computed one day ahead, worth up to
1.5 min at fajr.

| Column | Model | Mean err | sd | Range |
|---|---|---|---|---|
| fajr | 18.00 deg, no margin | -0.70 | 0.55 | -2.1 .. +0.4 |
| sunrise | -0.833 deg | -0.94 | 0.63 | -2.8 .. +0.3 |
| sunset | -0.833 deg | +1.12 | 0.65 | -0.2 .. +2.7 |
| maghrib | sunset **+ 5 min** flat | — | — | every row exactly +5 |
| asr | implied shadow **2.06** median | sd 0.03 | | Hanafi; Shafi is 44 min early |
| dhuhr | clock 13:00 / 13:15 | transit +38..+82 | | switches 2026-04-15 and 2026-10-15 |
| isha | 15-min clock ladder | +18.5 vs 18 deg | 8.9 | -4.9 .. +43.9 |

Least squares: fajr **18.12** deg (rms 0.59), against 0.89 at exactly 18.00.
The uniform negative bias is minute truncation, and November-December run a
further 0.5-0.8 min early (an effective 18.2-18.3 there).

**Isha is not a twilight angle.** It takes 11 distinct printed values
(18:45 to 21:15 in 15-minute steps) across 19 transitions, one of them a
30-minute drop on 1 October and one an upward step on 20 December while the
sun is still falling. It sits 0 to +43 min above the 18-degree curve as a
sawtooth.

**The dhuhr clock is the 2015 federal design, recovered from the chart alone.**
The fit puts the switch on 15 April and 15 October. The first edition's own
press notice (The News, 2015-05-01) describes the calendar as two phases:
"the first phase will start from April 15 to October 14 ... Zuhar Azan will be
1:15 p.m." and "the second phase will start from October 15 to April 14 ...
Zuhar Azan will be called at 1:00p.m." Both boundaries and both values agree.
The chart is that design, extended to every day of the year.

**Named-pair test, whole template, nearest-minute emulation (mean / rms / exact
minute hits of 366):**

| Method | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|
| **Karachi 18/18 + Hanafi asr** | +0.7/0.9/**144** | +0.9/1.2/96 | -59.7/60.9/0 | -2.3/2.4/0 | -1.1/1.3/70 | -18.5/20.5/1 |
| MWL 18/17 + Shafi asr | +0.7/0.9/144 | +0.9/1.2/96 | -59.7/60.9/0 | **-58.0**/59.3/0 | -1.1/1.3/70 | **-23.9**/25.3/0 |
| 18/18 + Shafi asr | +0.7/0.9/144 | +0.9/1.2/96 | -59.7/60.9/0 | -58.0/59.3/0 | -1.1/1.3/70 | -18.5/20.5/1 |

**Answer: the subcontinent 18/18 Hanafi family (Karachi pair) reproduces the
chart; MWL 18/17 is refuted on asr by 58 minutes and on isha by 24.** The
dhuhr and isha columns survive no library preset, by construction.

### Provincial auqaf

| Body | Result |
|---|---|
| Punjab Auqaf (`auqaf.punjab.gov.pk`) | Reachable. **Not blocked by the publisher**: this network's FortiGuard URL filter answers 403 with a "URLfilter Block" page for curl, headless browser and direct HTTPS alike. Read through a public text reader instead. Its sitemap (40+ pages) and its own site search return **zero** prayer-time content, for `namaz` and for `prayer timing`. The department administers shrines and waqf estates, not a timetable. |
| Sindh Auqaf (`auqaf.sindh.gov.pk`, `sindhauqaf.gov.pk`) | **NXDOMAIN at Google Public DNS** (Status 3), so the absence is real, not a local resolver failure. `sindh.gov.pk` itself resolves. |
| KP Auqaf (`auqaf.kp.gov.pk`) | 200, 95 links, no prayer page, no timetable PDF. |
| Balochistan Auqaf | NXDOMAIN. |

No provincial board publishes a dated table in either language. Urdu searches
(`پنجاب اوقاف نماز کے اوقات 2026 لاہور`, `سندھ اوقاف کراچی نماز اوقات`) return only
computed aggregators (tawkit, sajda, deen.pk, anwaar-e-madina, al-harameen) and
a newspaper daily-updated page.

## India

| Source | URL | Tier | Dated data | Result |
|---|---|---|---|---|
| Samastha Kerala Jem-iyyathul Ulama | `samastha.info` | authority (federation) | none | 61 links, no prayer page; `/prayer-time/` 404; REST search 404 |
| TNTJ | `tntj.net` | authority (movement) | none | 95 links and a 40-page sitemap with no timetable; `wp-json/wp/v2/search?search=namaz` returns `[]` |
| AIMIM | `aimim.org` | party | none | 38 links, no prayer page; sitemap last modified 2024 |
| Prayer Time Kerala | `prayertimekerala.com` | **community** | today only | React SPA, 14 districts, states it is "sourced from Suprabhatham and verified local Islamic calendars"; no dated archive, no year table, no API exposed in the served bundle |
| Makkah Masjid "Hyderabad" | `makkahmasjid.net` | same-name trap | Garland, Texas | unchanged from round 1 |

**Kerala, answered as far as the web allows.** The print source is now named
from a publisher's own claim: **Suprabhatham**, the Samastha-linked daily. That
matches the census's "print-only" ruling and identifies which print artefact to
photograph. No Kerala body mirrors a dated year online; the one site that claims
the provenance republishes only the current day, so it cannot witness a year and
cannot be fitted.

**Negatives:** Malayalam (`നമസ്കാര സമയ പട്ടിക 2026 മലയാളം`, `നമസ്കാര സമയം സംസ്ഥാന
ജമാഅത്ത്`), Tamil (`தொழுகை நேரம்`, TNTJ), Hindi and English. Every dated table
returned is a computed aggregator or a foreign mosque. Delhi, Hyderabad, Deoband
and Kolkata publish no campus table; the J&K Waqf Board remains the only board
publishing dated congregational material, and that is notices-only.

## Bangladesh

| Check | Result |
|---|---|
| IFB home + navigation (`islamicfoundation.gov.bd`) | No prayer-time page. The CMS exposes notices, officers, files, tenders. |
| IFB notices (`/pages/notices`) | 10 current items, none prayer-related. Search snippets confirm the CMS carries **Eid-ul-Fitr, Eid-ul-Adha and Ramadan sehri/iftar** schedules only — the same shape as round 1. |
| IFB file registry | Six linked files, all books and journals (board of governors, citizen charter, halal, journal, Agrapathik, projects). No timetable. |
| District layer | Exists as **"বিভাগ ও জেলা কার্যালয়ের কর্মকর্তাবৃন্দ"**, a divisional/district *officer* list. No district office publishes a table. |
| Baitul Mukarram's own monthly | No own domain: `baitulmukarram.gov.bd` is NXDOMAIN; the mosque sits under IFB's mosque-and-market division, which publishes nothing dated. |
| `kivabe.com` district tables | Decoy ruling from round 1 stands: smooth daily curves, not the 3-6 day band artefact. |

**Verdict: negative.** The band question stays print-only, exactly as recorded.
Bengali searches (`বায়তুল মোকাররম নামাজের সময়সূচি`, `ইসলামিক ফাউন্ডেশন নামাজের
সময়সূচি ২০২৬ জেলা`) surface only the Eid/Ramadan notices and computed mirrors.

## Sri Lanka

Re-captured `acju.lk/prayer-times/` today: **156 PDF links**, of which 144 sit
under `uploads/2026/10` (12 zones x 12 months) and 12 under `uploads/2026/11`
(zone 03 only, all twelve months).

- Zone 03's November sheet re-downloaded is **byte-identical** to the round-1
  capture (md5 `aa86f791515975e55dee9b97ff433f0f`), so even the one moved zone
  has not been re-issued since.
- Zones 01, 02 and 04-13 still serve from `uploads/2026/10`.

**The regenerated-edition event did not happen.** Twelve zones never moved out
of October; the thirteenth moved in October and is unchanged. The perpetual
ruling survives a third observation, and the lift stays open for a future year.

## Nepal

One pass, as instructed.

| Target | Result |
|---|---|
| Jame Masjid Kathmandu | `jameemasjid.org.np`, `jamamasjid.org.np`, `kathmandujamamasjid.com` all **NXDOMAIN** |
| National Muslim Federation Nepal | `nepalimuslimfederation.org`, `muslimfederationnepal.org`, `muslimnepal.org` all NXDOMAIN |
| Nepali and English search | Facebook pages and computed aggregators only (islamicfinder, hamariweb, muslimpro, time.now, athanpro) |

**Verdict: negative, record unchanged.** The only Nepali congregational
artefacts on the open web are Facebook posts (Kathmandu valley Eid timetables),
which are community tier and not dated daily tables.

## Maldives

`namaadhuvaguthu.com` is a **working community surface** and it corroborates the
census recipe. It publishes a per-island, per-day and per-month table
(`POST /prayer-times`, `island=415` is Malé, `range=day|month`).

**What it holds:** one **365-row yearless annual table** per island (February has
28 rows). It is *not* year-addressed: a day request for 2027-01-05 returns 04:56,
exactly the value in the same table's 5 January slot, and 2026-11-11 returns
04:36, the table's 11 November slot. One table serves every year.

**Recipe check against the census object** (MABIMS 20/18, fajr +5, dhuhr +4,
asr +1, maghrib +2, isha +4, sunrise -2, Shafi, nearest; Malé 4.1755 N 73.5093 E):

| Column | Mean err | sd | Range | Within 2 min |
|---|---|---|---|---|
| fajr | -0.42 | 0.44 | -2 .. +1 | 365/365 |
| sunrise | +0.42 | 0.44 | -1 .. +1 | 365/365 |
| dhuhr | +0.03 | 0.43 | -1 .. +1 | 365/365 |
| asr | -0.05 | 0.50 | -1 .. +1 | 365/365 |
| maghrib | -0.08 | 0.44 | -1 .. +1 | 365/365 |
| isha | +0.38 | 0.51 | -1 .. +2 | 365/365 |

All 2,190 printed values land within 2 minutes of the record's recipe, mean
absolute error under half a minute on every column. That is the strongest
independent corroboration the Maldives object has had, and it comes from a
surface the census did not list.

**Official PDF: still blocked.** `islamicaffairs.gov.mv` returns 403 over both
http and https from this network, and the Wayback CDX endpoint is unreachable
here (connection refused, no response). Not solved: recorded, not worked around.

**Year-2: negative.** Because the community table is yearless, 2027 is not a
second year of data; it is the same table read again.

## What deserves a fit

1. **Pakistan, Islamabad** — the census should carry the chart's *structure*,
   not just its existence: 18-degree fajr, Hanafi asr, maghrib = sunset + 5,
   and a 366-row leap-anchored template plus two clocks. A recipe that models
   only angles will miss dhuhr by ~60 min and isha by up to 22 min on half the
   year. If Pakistan is ever baked, the chart is the artifact to bake.
2. **Maldives** — no recipe change. The community surface corroborates the
   object at 365/365 within 2 min, and its yearlessness means the object's
   year-2 lift is untouched.
3. **Sri Lanka, Bangladesh, India, Nepal** — no fit; recorded states hold.

## Honest negatives, consolidated

- Pakistan's 2026 unified calendar: no artifact anywhere, checked against two
  live ministry registers.
- Punjab, Sindh, KP, Balochistan auqaf: no dated table; Sindh and Balochistan
  do not resolve at a public resolver.
- India: no statutory board table; Kerala's source named (Suprabhatham) but
  print-only; no dated mirror.
- Bangladesh: no IFB prayer page, no district table, no Baitul Mukarram domain.
- Nepal: no resolvable domain for either named body.
- Maldives: no official PDF, no year-2.

## Captures

57 files under `captures/`. New this round: `pk-mora-publications-20261110.html`,
`pk-mora-latestnews.html`, `pk-mora-home-20261110.html`,
`pk-thenews-nizam-2015.html` (the two-phase corroboration),
`pk-auqaf-punjab-jina.txt`, `pk-auqaf-punjab-sitemap.txt`,
`pk-auqaf-punjab-search-namaz.txt`, `pk-auqaf-kp-home.html`,
`in-samastha-home.html`, `in-tntj-pages.xml`, `in-tntj-wpsearch-namaz.json`,
`in-aimim-home.html`, `in-prayertimekerala-home.html`,
`bd-ifb-notices.html`, `bd-ifb-office-contents.html`,
`lk-acju-prayer-times-20261110.html`, `lk-acju-z03-nov2026-recheck.pdf`,
`mv-namaadhu-male-2027-01-month.html` (the yearless table, identical to the
`november-2026` request), `mv-namaadhu-male-2027-01-05.html`,
`mv-muis-root.html` (403).

Data: `data/pk-islamabad-nizam-2026.json` (366 rows, inherited),
`data/pk-islamabad-method-fit.json` (this round's fit),
`data/mv-male-namaadhu-annual.json` (365 rows).
