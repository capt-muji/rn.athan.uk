# O1k Americas: USA, Canada, Chile, Brazil, Peru, Argentina, Colombia, Trinidad, Mexico

Agent `americas`, 2026-11-10. Research only. Every capture is under `captures/`, normalised
rows under `data/`. Reading of the record: `census/world-table-v2.md`, Region 5 (Americas),
plus the pool row and `c30`/`c36`/`c42` prior sweeps.

## Method

- dpt probe: `GET https://<domain>/?rest_route=/dpt/v1/prayertime&filter=year`, HIT = HTTP 200
  and a body opening `[[{"d_date"`. 139 candidate domains across the 20 largest US metros and
  the five Canadian cities, two waves, 1 s pacing, plus a homepage fetch on every miss to look
  for a Masjidal `masjid_id` (script `probe_na.zsh`, results `probe_na.tsv`, `probe_na2.tsv`).
- Masjidal range API: `masjidal.com/api/v1/time/range?masjid_id=…&masjid_detail=yes`.
- Gates: an install whose rendered page loads the plugin's own JS or hits the REST route is a
  client of the feed, so the page cannot contradict it; an install whose page renders a
  DIFFERENT platform is gated against that platform. Angle fits use pristine adhan-js 4.4.6
  from `$HOME/athan-gitree/census/adhan-build/`.

---

## 1. FCNA / ISNA: the current official wording

| Source | URL | Tier | What it states |
|---|---|---|---|
| Fiqh Council of North America, "How should the times of Fajr and Isha be calculated?" (published 2021-11-08, modified 2026-08-13) | `https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/` | authority (the council) | 15/15 for the USA, **13/13 for Canada**, throughout the year, "corresponds to 'Islamic Society of North America' in most prayer apps"; minute-caution recommended, "not a requirement" |
| FCNA, "Fifteen or Eighteen Degrees" (2024-09-18, modified 2026-08-13) | `https://fiqhcouncil.org/fifteen-or-eighteen-degrees-calculating-prayer-fasting-times-in-islam/` | authority | the reasoning, with the ISNA 15/15 row in its own method table |
| FCNA Islamic Calendar | `https://fiqhcouncil.org/calendar/` | authority | 8°/5° crescent criteria, Hijri 1440-1467; moon-sighting only, no prayer angles |

The council's own page is the current statement, and it names both the US and the Canadian
pair. The record's "published FCNA 15/15 is PRINTED BY ALMOST NOBODY" stands; what is new is
the primary citation, the Canadian 13/13 in the same sentence, and the recommendation that
communities may add a few caution minutes (which is one honest explanation for the
at-or-earlier fajr columns the record measured).

---

## 2. USA

### Surfaces captured

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| dpt full-year JSON, Islamic Association of North Texas | `iant.com/?rest_route=/dpt/v1/prayertime&filter=year` | community | 364 dated rows, athan + jamah | 2026 |
| Masjidal range API, same mosque | `masjidal.com/api/v1/time/range?masjid_id=xdy03lAX` | community | 365 dated rows, athan + iqamah | any month |
| dpt full-year JSON, Dar Al-Hijrah (Falls Church VA) | `hijrah.org/?rest_route=/dpt/v1/prayertime&filter=year` | community | 365 dated rows, athan + jamah | 2026 |

`daralhijrah.org` now 301s to `hijrah.org`; the record's 365-row capture came from the old
host. Same mosque, new domain, fresh year.

### The Manchester trap, US instance: IANT runs two feeds that contradict each other

Islamic Association of North Texas (Richardson, Dallas metro) renders a Masjidal widget
(`masjid_id=xdy03lAX`) on its own home page AND answers the dpt year route. Across all 364
days of 2026 the two disagree on exactly the two twilight prayers:

| Column | Masjidal (what the page shows) minus dpt | Range |
|---|---|---|
| fajr | **+15.6 min** | +14 to +19 |
| isha | **-10.5 min** | -13 to -9 |
| sunrise, zuhr, asr, maghrib | -0.2 to -0.1 min | -2 to +1 |

Fitted angle pairs, 364 days, MAE:

| Feed | fajr | isha | MAE |
|---|---|---|---|
| dpt install | 17.95° | 17.00° | 0.26 / 0.33 min |
| Masjidal widget (live page) | 15.00° | 15.00° | 0.03 / 0.08 min |

The dpt install is the FCNA-era 18/17 pair; the live page is plain 15/15 ISNA. Any capture of
`iant.com`'s dpt route must be gated against the widget, and the widget wins. This is the
strongest US evidence yet that a dpt feed can be an orphaned install on a working site, and it
is the exact shape of the Manchester defect.

### Dar Al-Hijrah: 15/15, and no independent gate exists

Fitted 14.90° / 15.05°, MAE 0.39 / 0.69 min over 365 days. `hijrah.org/prayer-timing/` loads
`dpt.js` and calls `rest_route=/dpt/v1/prayertime&filter=year` itself, so the page renders the
feed and the two cannot diverge; the honest gate is a fitted angle pair, not a page comparison.

### Pool expansion

Two Masjidal ids not on the record, both found by the widget-URL index: `nL1JggAa` (Muslim
American Society Tarbiyah Center, `America/Detroit`) and `6adJ5qAk` (Ethiopian Muslim
Association of Seattle, `America/Los_Angeles`). Neither is a big-metro flagship.

Honest negative on the 20 largest metros: 139 candidate domains probed, 5 hits, of which 2 are
US. The flagships that were tried and expose no keyless year feed include the Islamic Cultural
Center of New York, King Fahad Mosque (LA), the Islamic Center of Southern California, EPIC and
Valley Ranch (Dallas), ADAMS and ISGH (Houston), the Islamic Center of Washington DC, ISBCC
(Boston), Al-Farooq (Atlanta), ISC San Diego, ISTABA (Tampa), the Colorado Muslim Society, ISB
(Baltimore), and the Islamic Society of Orange County. The pool's indexed widget URLs are
exhausted: every city-shaped query now returns ids already on the record.

Per metro, from the labelled waves (`probe_na.tsv`, `probe_na2.tsv`):

| Metro | Domains probed | Year feed |
|---|---|---|
| New York | 4 | none |
| Los Angeles | 4 | none |
| Chicago | 4 | none |
| Dallas-Fort Worth | 4 | 1 (`iant.com`, gated, see above) |
| Houston | 4 | none |
| Washington DC | 4 | 1 (`hijrah.org`) |
| Philadelphia | 4 | none |
| Miami | 3 | none |
| Atlanta | 4 | none |
| Boston | 3 | none |
| Phoenix | 3 | none |
| San Francisco Bay | 4 | none |
| Riverside-San Bernardino | 3 | none |
| Detroit | 4 | none |
| Seattle | 4 | none |
| Minneapolis | 3 | none |
| San Diego | 3 | none |
| Tampa | 2 | none |
| Denver | 3 | none |
| Baltimore | 3 | none |
| Toronto | 4 | 2 |
| Vancouver | 3 | none |
| Montreal | 2 | none |
| Calgary | 2 | none |
| Ottawa | 2 | none |

The Montreal slot is worth naming: `islamiccentre.ca` was probed as a Montreal guess and hit,
but the site is the Islamic Centre of Southwest Ontario in London, Ontario, and its feed is the
broken one. Montreal therefore returns zero, not one.

---

## 3. Canada

Five full-year dpt feeds, four usable, one broken. All five were fitted day by day.

| Mosque | Domain | Rows | Fajr | Isha | Notes |
|---|---|---|---|---|---|
| Islamic Institute of Toronto (Scarborough) | `islamicinstitute.ca` | 365 | 14.9° (MAE 0.45) | **maghrib + 90 min, every one of 365 days** | DST handled (06:31 → 05:34 at 1 Nov); the site loads the plugin's asset, no separate prayer page link surfaced |
| Masjid Toronto (MAC, Dundas St W) | `masjidtoronto.com` | 365 | 14.9° (MAE 0.38) | **maghrib + 80 min, every one of 365 days** | only the standard asr column is populated; the Hanafi column is `00:00:00` on all 365 days, so the school cannot be read from the feed |
| Saskatoon Mosque | `saskatoonmosque.com` | 365 | 14.7-15.3° | 12.7-15.1° by month | Saskatchewan runs no DST and the feed matches; site also publishes `salat-timetable-2025-website.pdf` (no 2026 overlap) |
| Brandon Islamic Centre (Brandon MB) | `bicmanitoba.ca` | 365 | 15.0° Jan-Feb | 15.0° Jan-Feb | **November 2026 block printed 60 min late** (see below) |
| Islamic Centre of Southwest Ontario (London ON) | `islamiccentre.ca` | 364 | unusable | unusable | each column carries a different offset: fajr -6:17, sunrise -6:20, zuhr -5:26, maghrib -4:28, isha -4:01 against the city's real times |

**The Canadian parameter statement, in practice.** The two largest Toronto mosques publish
fajr at 15° and isha as a FIXED INTERVAL after maghrib, 90 and 80 minutes respectively, on
every day of the year. Neither publishes any isha angle; neither uses FCNA's 13/13. The
interval reproduces the record's "implied seasonal angle" wobble exactly, which is what a fixed
interval looks like when it is read as a depression angle: 17.5° in October, 12.3° in June.

**A dpt month-boundary DST defect, characterised.** Brandon's install is 15/15 for ten months
and then prints November 2026 on CDT: 30 Nov sunrise 09:16, 1 Dec sunrise 08:17, a 59-minute
fall at the month line, where the civil change happened on 1 November. Normalising the November
block by -60 min puts it back on the 15/15 line. This is a distinct defect class from the
record's "serving-2020 stale install": the plugin's month cache was generated before the
timezone rule changed.

`islamiccentre.ca` is a second distinct class: a live install whose six columns each carry a
different offset, so it is neither shifted nor stale, it is arithmetically inconsistent.

---

## 4. Chile: November 2026 re-captured, and December still absent

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Centro Islámico de Chile, November page | `https://radioislam.cl/horarios-noviembre/` | community | 18 city PDFs, 30 rows each | 2026-11 |
| December page | `https://radioislam.cl/horarios-diciembre/` | community | 404 today | none |

All 18 November PDFs re-captured independently and parsed: **540 rows, 3240 time values, 0
mismatches** against C17's own capture of the same month. The record's numbers stand exactly.

The Viña del Mar pattern repeats this month: the page's button for city 7 still points at
`2026/10/Octubre-2026.xlsm-Grupo_Parte7.pdf` while `2026/10/Noviembre-2026-7.pdf` returns 200
with 30 dated rows and no page links it. Two consecutive months of the same defect makes it a
publishing habit, not a one-off.

December: `horarios-diciembre/` 404, and both plausible upload paths
(`uploads/2026/11/Diciembre-2026-1.pdf`, `uploads/2026/10/Diciembre-2026-1.pdf`) 404. As the
record says, expect it around 29 November.

---

## 5. Brazil: the IIB surface found, 25 cities, exact recipe

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| IIB city page (inline `window.__IIB_SALAT_PRELOAD__`) | `https://institutoislamico.org.br/horarios-salat?city=Sao+Paulo` | community | today + 7 days + the whole current month, per city | any month |
| IIB keyless month API | `https://institutoislamico.org.br/api/prayer/times?city=<City>&country=Brazil&view=month&cal=greg&m=<M>&y=<Y>` | community | every date of the month, 6 columns | any month, any year (2025-08 answered) |
| IIB month export | `/api/prayer/export?…` (referenced by the page's own JS) | community | PDF or image of the month | any month |

The publisher's own payload names the method: `"method": {"name": "Muslim World League"}` and
the timezone per city. Its city picker lists exactly 25 cities.

Captured: **25 cities × 2 months (2026-11 and 2026-02) = 1450 dated rows**
(`data/br_iib_25cities.json`), each with its timezone as the API states it.

Fit: adhan-js MuslimWorldLeague (18/17), Shafi asr, at city-centre coordinates the capturer
chose (the publisher states none) reproduces **all 25 cities** to a worst MAE of 0.26 min
(Brasília maghrib); 16 of the 25 reproduce every column to 0.00.

What this settles for the record:

- The `18/17 Shafi` recipe fitted on São Paulo is not a fit, it is the publisher's literal
  configuration, and it holds across 34 degrees of latitude and the equator.
- The "24 cities unfitted" debt is discharged at the surface level: one keyless request per city
  per month, any year, 25 cities.
- The single-city provenance flag can be raised: the surface is one API serving all 25 cities,
  so a second city-year costs nothing.

---

## 6. Peru, Argentina, Colombia, Trinidad, Mexico

| Country | Surface examined | Tier | Result |
|---|---|---|---|
| Peru | `mawaqit.net/es/m/mezquita-de-magdalena-del-mar-lima-07921-peru` | platform | page carries `confData` with calendar and 10 iqama fields, a real payload, kept as a LEAD: the mawaqit suite (today-row anchoring, solar gate, byte-identity-vs-default, TZ distrust) was not run here |
| Argentina | `https://islam.com.ar/mezquita/` (CIRA, Mezquita Al Ahmad, Buenos Aires) | community | today only; the salat plugin exposes no REST route (`/wp-json/` lists no salat or prayer namespace); the page's "Descargá los horarios del Salat" button downloads `uploads/2020/11/noviembre-2020.pdf`, a **November 2020** sheet. No dated surface. |
| Argentina | Mar del Plata and Córdoba | platform | mawaqit-hosted per the record; not re-probed |
| Colombia | `masjidbox.com/prayer-times/mezquita-de-muhammad-1747848830940` (Cartagena) | platform | landing page carries today only (Fajr 4:43 AM, matching the record's 2026-11-09 row); no month payload inline, no keyless history |
| Trinidad | `masjidbox.com/prayer-times/masjid-chaguanas-tt`, `…/masjid-ul-mu%27mineen` | platform | today only via the meta description; **the known artifact is still live**: Chaguanas Fajr 3:47 AM against Guaico 4:46 AM on the same day, a one-hour split on one platform |
| Mexico | `https://centro-islamico.com/horario-de-oracion/` | community | HTTP 403, blocked; recorded and abandoned |
| Mexico | Guadalajara, Monterrey, Islam en México, Instituto Islámico | community | unchanged from the record: today-only displays or no prayer page |

---

## 7. What deserves a fit

1. **Brazil, now, at the publisher's own parameters.** Take 12 months of the IIB API for São
   Paulo and one equatorial city (Manaus) and one southern city (Porto Alegre); the expectation
   the fit should test is MWL 18/17 Shafi at round-to-minute with no offset, which the two-month
   check already predicts to 0.00 min.
2. **Dar Al-Hijrah, DC.** 365 rows of clean 15/15 with jamah columns; a second US anchor for the
   15-degree line to sit beside IANT's widget.
3. **Toronto, as an interval source.** IIT and Masjid Toronto give a reproducible
   `isha = maghrib + N` rule (N = 90 and 80). If the app ever models a mosque-authored isha, this
   is the cleanest interval pair in the hemisphere, and it is the sharpest available rebuttal to
   the assumption that Canadian mosques follow 13/13.
4. **Chile, unchanged.** The November re-capture confirms the record; no new fit is implied.

## 8. Honest negatives

- USA: 139 candidate domains across the 20 largest metros produced no keyless year feed beyond
  the two above. The dpt install base in the US is thin and its indexed surface is exhausted at
  the widget level.
- Canada: three of the five hits are the same plugin serving three cities; no national body
  publishes prayer times (the record's finding stands).
- Argentina: the flagship's only download is a 2020 sheet; the daily plugin is unqueryable.
- Colombia: Masjidbox landing pages carry one day, not a month.
- Trinidad: nothing beyond today's row; the platform's own defect persists.
- Mexico: the one site that looked promising blocked the request (403).
- Chile: December is not published yet; the Viña del Mar November sheet exists only as an
  unlinked file.
