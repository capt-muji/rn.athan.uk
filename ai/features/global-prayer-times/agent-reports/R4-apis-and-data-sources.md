# R4: every prayer-time API and published data source, judged against an offline-first app

Research agent report, 2026-09-30, wave 2 of the global prayer times research. Branch
`research/global-prayer-times`, worktree `/Users/muji/athan-global-wt`.

Scope: the owner asked three practical questions and one deeper one. The practical questions are whether any API
returns a whole year, whether they are free, and which one to use if one must be used. The deeper question is
whether authoritative data can be had without a live API at all. This report answers both, and concludes that the
second question has a better answer than the first.

Conventions, per the brief:

- **measured** means this research ran it. Every measured HTTP number came from `curl` from London on 2026-09-29
  or 2026-09-30, via `data/apis/measure.sh`, with the full result set in `data/apis/measured-endpoints.md`.
- **cited** means a source asserts it, with the URL and the fetch date.
- **UNVERIFIED** means neither.
- Every delta is `X minus Y` in minutes, stated in that order. No prayer time in this report is offered as a
  prayer time. Nothing was averaged or invented.
- Two sub-agents did parallel evidence gathering. Their full reports are
  `data/apis/national-authorities.md` and `data/apis/bulk-datasets.md`. Where this report cites them it says so,
  and the headline claims were re-measured independently here.

Prior art read and not repeated: `ai/features/moonsighting/notes/implementations.md` sections 0, 2 and 2.11, and
`ai/features/moonsighting/RESEARCH-FINDINGS.md` sections 2.4, 2.12 and 2.16. The moonsighting.com
`time_json.php` endpoint is one already-filled row in the table below.

---

## Findings in one page

1. **Every general-purpose prayer-time API computes. None of them is authoritative.** AlAdhan, UmmahAPI,
   `vakti`, `pray.zone` and the RapidAPI listings all run PrayTimes.org or `adhan` behind a URL. AlAdhan's own
   credits page says so in as many words: "Pray Times: the code for the primary API is based almost in its
   entirety on the libraries on this website" (cited, `https://aladhan.com/credits-and-terms`, 2026-09-30). For
   this app an API of that kind is strictly worse than a local library, because it adds a network dependency, a
   privacy cost and an outage risk to a calculation the phone can do offline.

2. **Measured proof of that, across 15 city-method years.** Against a local `adhan` 4.4.6 with the same stated
   angles, AlAdhan matched within 1 minute on Fajr, Sunrise, Maghrib and Isha for 365 of 365 days at Jakarta,
   Kuala Lumpur, Makkah, Singapore, Istanbul, New York and Karachi (measured, section 3). The divergences are
   all explained by a different high-latitude rule or a Dhuhr rounding convention, not by better data.

3. **AlAdhan does return a whole year in one request, and it is small.** `/v1/calendar/2026` for London
   measured 480,831 bytes uncompressed, and **26,715 bytes with `Accept-Encoding: gzip`** (measured). Jakarta
   measured 474,626 bytes uncompressed. A year per city is a 27 KB fetch. The yearly shape the app already uses
   for `londonprayertimes.com` transfers directly.

4. **AlAdhan is free, needs no key, and its rate limit is 12 requests per second per IP.** Measured from the
   `x-ratelimit-limit-second: 12` header on every response and confirmed by watching
   `x-ratelimit-remaining-second` fall 11, 10, 9, 8 across a 20-request burst (measured). For a yearly fetch
   that limit is irrelevant.

5. **AlAdhan's terms disclaim accuracy and say nothing about redistribution.** The full text is: "made
   available in the hope that they will be useful, but WITHOUT ANY WARRANTY ... The prayer times computed may
   not be accurate by some standards" (cited, `https://aladhan.com/credits-and-terms`, 2026-09-30). There is no
   licence grant, no caching clause and no prohibition. It is operated by Islamic Network through Mamluk LLC
   (cited, `https://aladhan.com/about`). Permission to cache and redistribute is **UNVERIFIED** and would need
   asking.

6. **AlAdhan's method 17 does NOT reproduce JAKIM, and method 20 does NOT reproduce Kemenag, despite carrying
   their names.** Measured against JAKIM's own published year for Kuala Lumpur, AlAdhan method 17 labelled
   "Jabatan Kemajuan Islam Malaysia (JAKIM)" was **0 of 365 days exact on Fajr, Dhuhr, Maghrib and Isha**, and
   9 to 12 minutes early on Fajr every single day (measured, section 3.3). This is the most important negative
   finding in the report: an API that names an authority is not serving that authority's times.

7. **Mawaqit is a different and better kind of product, and its terms forbid this app from using it.** Its API
   serves what a specific mosque actually prays by, including congregation (iqama) times, which no computation
   can reproduce. Its own help page says "Our API is currently private and not publicly available" (cited,
   `https://help.mawaqit.net/en/articles/11991838-can-i-use-your-api`, 2026-09-30) and its GitHub sponsor page
   says "Any commercial use is strictly prohibited" (cited, `https://github.com/sponsors/mawaqit`). Its legal
   notice adds that "any reproduction ... of all or part of the elements of the site ... is prohibited, unless
   prior written authorization is obtained" (cited, `https://mawaqit.net/en/legal-notice`, updated 2026-03-24).

8. **Mawaqit's unauthenticated search endpoint still proves the point about authority, and the evidence is
   striking.** `GET https://mawaqit.net/api/2.0/mosque/search?lat=51.5072&lon=-0.1276` returned 200 with no key,
   9,543 bytes, nine central London mosques with their own times (measured). Those nine mosques, all within a
   few kilometres of each other, **disagree by 26 minutes on Fajr and 48 minutes on Asr** (measured, section
   3.5). No calculation method choice can bridge that, because it is not a calculation disagreement.

9. **National authorities are the real find, and five of them serve a whole official year in one keyless
   request.** JAKIM Malaysia, MUIS Singapore, Diyanet Turkey, Brunei KHEU and Saudi Umm al-Qura, all measured
   200 by the authorities sub-agent, with JAKIM re-measured here at 200, 77,257 bytes, 365 rows for zone
   `WLY01`. A national authority's own feed is the only category in this report with a genuine claim on this
   app, because it is the thing a library cannot reproduce.

10. **MUIS Singapore is the only prayer-time source found anywhere with a real open licence.** Its timetable is
    a CSV on `data.gov.sg` under the Singapore Open Data Licence 1.0, which permits commercial use and
    redistribution with attribution. Re-measured here: 200, **57,771 bytes, 1,096 days covering 2024 to 2026**
    (measured, section 4.2). Everything else served data without stating any terms, and absence of a licence is
    not permission.

11. **The correction-table idea works, and this is the report's strongest result.** JAKIM's published year is
    reproduced by a local `adhan` computation plus **six signed integers per zone**. Measured across 5 zones and
    10,950 published values: within 2 minutes on **100.0% of values in all five zones**, and within 1 minute on
    97.6% to 100.0% (measured, section 5.3). The six constants for Kuala Lumpur are Fajr +10, Sunrise -1,
    Dhuhr +3, Asr +2, Maghrib +2, Isha +2.

12. **So the London pattern generalises.** Wave 1 found London's timetable is the Blackburn chart plus 21 hand
    edits. Malaysia's is a computation plus a 6-byte-per-zone offset table. Indonesia's Kemenag is the same
    shape with a spread of only 1 to 2 minutes (measured, section 5.4). These are not random. They are
    institutional safety margins, and Malaysia's is documented as `ihtiyati` in JAKIM's own literature (cited,
    section 5.3).

13. **The byte arithmetic favours corrections by an order of magnitude.** One city-year of six times costs
    43,071 bytes as naive JSON and 1,414 bytes brotli-compressed. The same year as a residual against a
    computed baseline costs **345 bytes brotli** (measured, section 5.5). The whole 60-zone Malaysian
    federation as a **Model A constant table is 360 bytes raw**. Against the app's 4.9 MB JS bundle, 1,000
    city-years of exact residuals is 337 KB, or 6.7% of the JS bundle and 0.49% of the 67 MB release bundle.

14. **A correction table derived from an authority's own published times is on the right side of the
    no-synthesis rule, and a constant-offset model is not.** Shipping the exact per-day residual reproduces the
    authority's published number to the minute, so the app displays what the authority published. Model A's
    six constants leave up to 2 minutes of error, which means the app would display a number the authority
    never printed. That is synthesis. Section 5.6 draws the line explicitly.

15. **Bulk datasets exist but almost none are licensed for this app.** The datasets sub-agent found no prayer
    timetable at all on `data.gov.uk` (count 0), HDX (count 0), `data.gov.my`, Zenodo or any academic
    repository. The largest community scrape, `fortextexe/namaz-data` at 18,644 districts, has no licence. The
    most reusable artefact, `my-prayers/muslim-data`, is Apache-2.0 SQLite with 3,433,472 bytes of prayer
    tables. `ruqqq/prayertimes-database` has Singapore back to 2011 but is GPL-3.0 on the data.

16. **Timetable digitisation is realistic for about 12 countries, of which 5 are already done.** That is the
    datasets sub-agent's conservative count, each row resting on an HTTP response from this session: Singapore,
    Malaysia, Qatar, Maldives and Turkey already digitised; Morocco, Egypt, Bangladesh, Brunei, Indonesia,
    Libya and Jordan obtainable with work. It is not 190 countries, and the report should not pretend it is.

17. **An out-of-date timezone database is a real and measurable defect, worth 103 wrong days.** Node 24.14.1
    ships ICU tz 2025c while this Mac's system zoneinfo is 2026c. Comparing them across 2026,
    `Africa/Casablanca` and `Africa/El_Aaiun` differ on **103 days**, every day from 2026-09-20 to year end, by
    a full hour (measured, section 6.1). A one-year-old tz database makes every prayer time in Morocco an hour
    wrong for a third of the year. Wave 1 saw the same defect from the server side.

18. **Offline coordinate-to-timezone is a solved problem for 88 KB.** `@photostructure/tz-lookup` 11.7.0 is
    CC0-1.0, 88,029 bytes unpacked, and returned the correct IANA zone for **16 of 16 test coordinates**
    including Gaza, Hebron, Kashgar, Tromso and Kathmandu (measured, section 6.2). The alternative, `geo-tz`,
    is 74,179,650 bytes and unshippable.

19. **Elevation matters more than the field generally admits, especially at high latitude.** Computed from the
    geometric horizon dip: at London's latitude, 100 m of elevation moves sunset **2.06 minutes later at the
    equinox and 2.75 minutes at the June solstice**; at Oslo's latitude the solstice figure is **4.51 minutes
    per 100 m** (measured, section 6.4). That is larger than JAKIM's entire safety margin. Most authorities do
    not appear to account for it, and the app's current provider does not expose it.

20. **Recommendation, in one line: no general-purpose API is justified, one authority feed per country is, and
    the strongest non-API route is an authority-derived exact residual table shipped in the bundle.** Section 8
    gives the full reasoning and costs.

---

## 2. The API comparison table

Every row's status, size and latency is **measured** from London unless the cell says cited or UNVERIFIED. The
complete measurement log with headers is `data/apis/measured-endpoints.md`.

### 2.1 The main table

| API | Operator | Base URL | Key | Cost | Rate limit | Whole year? | Year response size | Per-mosque? | Terms permit caching? |
|---|---|---|---|---|---|---|---|---|---|
| **AlAdhan** | Islamic Network / Mamluk LLC | `api.aladhan.com/v1` | none | free | 12 req/s per IP (measured header) | **yes**, `/calendar/{year}` | 480,831 B raw, **26,715 B gzip** (London, measured) | no | silent; no grant, no prohibition (cited) |
| **Mawaqit** | MAWAQIT ASSO, Paris (non-profit) | `mawaqit.net/api/2.0` | yes, account token | free, non-commercial only | UNVERIFIED | UNVERIFIED (401 without token) | n/a | **yes**, plus iqama | **no**: "commercial use is strictly prohibited" (cited) |
| **Mawaqit search** (unauthenticated) | as above | `mawaqit.net/api/2.0/mosque/search` | **none** (measured 200) | free | UNVERIFIED | no, today only | 9,543 B for 9 London mosques (measured) | **yes** | no, as above |
| **JAKIM** (authority) | Jabatan Kemajuan Islam Malaysia | `e-solat.gov.my/index.php?r=esolatApi/takwimsolat` | none | free | UNVERIFIED | **yes**, `period=year` | **77,257 B** raw, 365 rows (measured) | no, 59 zones | no terms stated at the endpoint |
| **MUIS** (authority) | Majlis Ugama Islam Singapura | `data.gov.sg` dataset CSV | none | free | portal limits | **yes**, 3 years in one file | **57,771 B**, 1,096 days (measured) | no, whole island | **yes**, Singapore ODL 1.0 (cited) |
| **Umm al-Qura / KACST** (authority) | KACST, Saudi Arabia | `umqserv.kacst.gov.sa/api/v1/Prayer` | none | free | UNVERIFIED | **yes**, Hijri year | 255,046 B, 355 rows (cited, sub-agent measured) | no | no terms stated |
| **Diyanet public page** (authority) | Diyanet Isleri Baskanligi | `namazvakitleri.diyanet.gov.tr` | none | free | UNVERIFIED | **yes**, table in HTML | 380,972 B, 366 rows (cited, sub-agent measured) | no | no terms stated |
| **Diyanet official API** | as above | `awqatsalah.diyanet.gov.tr` | yes, **by postal application** | free | **10 yearly requests per month** (cited) | yes | UNVERIFIED | no | application-gated |
| **Brunei KHEU** (authority) | Ministry of Religious Affairs | `mora.gov.bn/_api/web/lists/...` | none | free | UNVERIFIED | **yes**, OData `$top=400` | 51,394 B, 367 rows (cited, sub-agent measured) | no | no terms; SharePoint list left open |
| **UAE Awqaf** (authority) | Awqaf, UAE | `mobileappapi.awqaf.gov.ae/APIS/v3` | anonymous bearer token | free | UNVERIFIED | **yes, the whole country** | **13,627,086 B**, 21,900 rows (cited, sub-agent measured) | no, 60 areas, **with iqama** | no terms stated |
| **`londonprayertimes.com`** | London Unified Prayer Timetable | `londonprayertimes.com/api/times/` | yes, issued manually | free | UNVERIFIED | **yes** | 92,372 B, 365 days (cited, sub-agent measured) | no, one timetable | UNVERIFIED |
| **`api.myquran.com`** (third party) | third party, claims Kemenag | `api.myquran.com/v2/sholat` | none | free | UNVERIFIED | no, **one month** | 5,634 B for September (measured) | no, 518 cities | UNVERIFIED |
| **Kemenag Bimas Islam** (authority) | Kementerian Agama, Indonesia | `bimasislam.kemenag.go.id/ajax/getShalatbln` | session-gated | free | n/a | month intended | blocked: `{"status":"Illegal key"}` then `Error Parameter` (measured) | no | no terms stated |
| **UmmahAPI** | UmmahAPI | `ummahapi.com/api/prayer-times` | none | free | 100 req/min (cited) | no, **one month** | 14,013 B for September, London (measured) | no | UNVERIFIED |
| **moonsighting.com** (wave 1) | Ahmed Bu-khamsin personal host | `moonsighting.ahmedbukhamsin.sa/time_json.php` | none | free | none seen in ~60 requests (wave 1) | **yes, only a year** | ~141,128 B (wave 1) | no | **none exist** (wave 1) |
| **`vakit.vercel.app` / `namaz-vakti-api`** | canbax, MIT | `namaz-vakti-api`, self-hostable | none | free | **33 req / 15 min** (cited) | UNVERIFIED | n/a (404 on the paths tried, measured) | no | MIT on the code |
| **`prayertimes.api.abdus.dev`** | abdus, personal | `/api/diyanet/prayertimes` | none | free | n/a | month | **dead**: connect timeout after 75 s, and 422 (measured) | no | UNVERIFIED |
| **`muslimsalat.com`** | MuslimSalat | `muslimsalat.com/{city}.json` | historically yes | free tier | n/a | n/a | **dead**: 404 on `/london.json` and on `/` (measured) | no | n/a |
| **`api.pray.zone`** | pray.zone | `/v2/times/this_year.json` | UNVERIFIED | UNVERIFIED | n/a | claimed year | **dead**: 404 (measured) | no | UNVERIFIED |
| **RapidAPI "Prayer Times" (Yanga)** | third-party reseller | `prayer-times.p.rapidapi.com` | yes, RapidAPI key | Basic tier **$0.00/mo, 500,000 req/mo hard limit** (cited) | tier-dependent | UNVERIFIED | 404 on the bare host (measured) | no | RapidAPI marketplace terms |
| **RapidAPI "Muslim Salat"** | third-party reseller | `muslim-salat.p.rapidapi.com` | yes | UNVERIFIED | UNVERIFIED | UNVERIFIED | not measured | no | marketplace terms |
| **IslamicFinder / Athan** | IslamicFinder | `api.islamicfinder.us` | UNVERIFIED | UNVERIFIED | n/a | UNVERIFIED | **no DNS resolution** (measured, `http_code 000`) | no | **no public API documentation found** |
| **`api.pawan.krd/prayertimes`** | Pawan Osman | `/prayertimes` | yes, now required | free, claimed unlimited | UNVERIFIED | UNVERIFIED | **401 without a key** (measured) | no | UNVERIFIED |
| **Quran.com** | Quran Foundation | `api.quran.com/api/v4` | yes for v4 | free | n/a | **no prayer data at all** | 1 B on the root (measured) | no | n/a |
| **Sunnah.com** | Sunnah.com | `api.sunnah.com/v1` | yes | free with key | n/a | **no prayer data at all** | 403 without a key (measured) | no | n/a |
| **`ezanvakti.emushaf.net`** | third party, mirrors Diyanet | `/vakitler` | none | free | UNVERIFIED | month | 17,759 B (cited, sub-agent measured) | no | UNVERIFIED |

### 2.2 The two cities the brief asked for, measured side by side

| Endpoint | London | Jakarta |
|---|---|---|
| AlAdhan `/calendar/2026` uncompressed | 200, **480,831 B**, TTFB 0.927 s, total 1.842 s | 200, **474,626 B**, TTFB 0.300 s, total 0.764 s |
| AlAdhan `/calendar/2026` with `--compressed` | 200, **26,715 B**, TTFB 0.239 s, total 0.334 s | (not re-measured; the London ratio is 18.0x) |
| AlAdhan `/calendarByCity/2026` | not measured | 200, **475,721 B**, total 1.024 s |
| UmmahAPI month | 200, 14,013 B, total 0.423 s | 200, 1,223 B for one day, total 0.326 s |
| `api.myquran.com` month | n/a, Indonesia only | 200, **5,634 B**, total 0.359 s |
| Mawaqit unauthenticated search | 200, **9,543 B**, 9 mosques, total 0.522 s | not measured |

The first AlAdhan call of the session took 1.842 s and 18.8 s on one later retry through Node; subsequent calls
settled at 0.3 to 1.0 s. Cold-start variance on the Kong gateway in front of it is the likely cause, inference
only.

### 2.3 Transport and headers, measured

| Host | TLS verify | HTTP | Cert CN | Cert expiry | CORS | Cache-Control |
|---|---|---|---|---|---|---|
| `api.aladhan.com` | 0 (valid) | HTTP/2 | `api.aladhan.com` | 2026-12-10 | `*` | `public,max-age=3600`, plus `etag` |
| `www.e-solat.gov.my` | 0 (valid) | HTTP/2 | `e-solat.gov.my` | 2026-11-17 | `*` | `no-store, no-cache, must-revalidate` |
| `api.myquran.com` | 0 (valid) | HTTP/2 | `myquran.com` | 2026-12-24 | `*` | `max-age=86400` |
| `bimasislam.kemenag.go.id` | 0 (valid) | **HTTP/1.1** | `*.kemenag.go.id`, O=Kementerian Agama RI | 2027-02-04 | none seen | n/a |
| `www.mawaqit.net` | 0 (valid) | HTTP/2 | `mawaqit.net` | 2026-11-16 | UNVERIFIED | UNVERIFIED |

All five verified cleanly. AlAdhan is the only one sending an `ETag`, which matters for a yearly refetch: a
conditional request can confirm the cached year is still current for almost no bytes.

AlAdhan also returns `x-cache-status: Miss` and `x-kong-upstream-latency: 176`, so it sits behind a Kong gateway
with a cache layer, and it is served by `FrankenPHP Caddy` with `x-powered-by: Kipchak by Mamluk` (measured).

### 2.4 Archive and uptime record

| Host | Wayback CDX pages | Reading |
|---|---|---|
| `aladhan.com/*` | 5 (measured) | a real archive record for the site |
| `www.e-solat.gov.my/*` | **46** (measured) | the longest record of any host here |
| `mawaqit.net/*` | **62** (measured) | the longest record of all |
| `api.aladhan.com/v1/calendar*` | not obtained; the CDX service returned "Internet Archive: Temporarily Offline" (measured) | UNVERIFIED |
| `api.myquran.com/*`, `bimasislam.kemenag.go.id/*` | same outage, UNVERIFIED | UNVERIFIED |
| moonsighting.com JSON hosts | **0 captures** (wave 1) | no independent record exists |

No operator in this report publishes an uptime page or an SLA. A Wayback page count is a record of the site
being crawled, not of the API being up. Nobody's availability is established.

---

## 3. The trust question: where does each API get its numbers?

This is the crux. The method is simple: fetch a whole year from the API, compute the same year locally with
`adhan` 4.4.6 configured to the API's own stated parameters, and report the per-field delta distribution in
minutes across all 365 days.

Script: `data/apis/trust-compare.mjs`. Year fetcher: `data/apis/fetch-years.sh`. Full output:
`data/apis/results-trust.txt`. Fifteen city-method years were fetched, gzipped, at 19,953 to 27,279 bytes each,
one request every 2 seconds (measured).

One implementation note, recorded because it shaped the method: Node 24's built-in `fetch` could not reach
`api.aladhan.com` from this machine (`UND_ERR_CONNECT_TIMEOUT` after 10 s) while `curl` to the same URL
succeeded. So downloading and comparing are two separate steps, and `trust-compare.mjs` reads a cache that
`fetch-years.sh` fills.

### 3.1 Where the API and the local library agree exactly

These are the cases where an API adds nothing a local computation would not give.

| City | AlAdhan method | Fajr within 1 min | Sunrise | Maghrib | Isha within 1 min |
|---|---|---|---|---|---|
| Jakarta | 20 (Kemenag) | **365/365** | **365/365 exact** | 365/365 | **365/365** |
| Jakarta | 3 (MWL) | **365/365** | **365/365 exact** | 365/365 | **365/365** |
| Kuala Lumpur | 17 (JAKIM) | **365/365** | 365/365 | 365/365 | **365/365** |
| Makkah | 4 (Umm al-Qura) | **365/365** | 365/365 | **365/365 exact** | 335/365, see 3.2 |
| Istanbul | 13 (Turkey) | **365/365** | 365/365 | 365/365 | **365/365** |
| Singapore | 11 (MUIS) | **365/365** | 365/365 | 365/365 | **365/365** |
| New York | 2 (ISNA) | **365/365** | 365/365 | 365/365 | **365/365** |
| Karachi | 1 (Karachi) | **365/365** | 365/365 | 365/365 | **365/365** |
| London | 15 (Moonsighting) | **365/365** | 365/365 | see 3.2 | **365/365** |

At every one of these places, on every day of 2026, the API's Fajr and Isha are within one minute of what the
phone can compute offline. **The API is providing no information the device does not already have.**

### 3.2 Where they differ, and why each difference is a convention, not better data

Four systematic differences appeared, and all four are explained.

| Difference | Where | Size | Explanation |
|---|---|---|---|
| **Dhuhr +1** | everywhere except method 13 and 15 | +1 on 363 of 365 days (measured) | AlAdhan rounds Dhuhr up to the next whole minute; `adhan` rounds to nearest. A presentation convention. |
| **Dhuhr +5, Maghrib +3** | London and Oslo, method 15 | Dhuhr +5 on 363/365, Maghrib +3 on 341/365 (measured) | AlAdhan's method 15 is the `islamic-network` PHP port, which applies the seasonal Fajr/Isha function **only**, with Dhuhr at true noon and Maghrib at sunset. Wave 1 established this (`implementations.md` section 0 item 6). `adhan` adds moonsighting.com's +5 and +3. |
| **Asr ±2 to ±4** | everywhere | London ±4, Oslo ±7 (measured) | Asr shadow-ratio rounding, plus a Madhab default mismatch on some methods. A rounding convention. |
| **Fajr up to -108, Isha up to +113** | London and Oslo only, high-latitude summer | Oslo MWL: Fajr -108 min, Isha +113 min (measured) | **The one substantive divergence.** AlAdhan's default `latitudeAdjustmentMethod` is `ANGLE_BASED`, visible in the response `meta`. `adhan`'s default `highLatitudeRule` is `MiddleOfTheNight`. Two different, both defensible, high-latitude policies. |
| **Isha -30 on exactly 30 days** | Makkah, method 4 | -30 on 30 days, 0 on 335 (measured) | Those 30 days are Ramadan 1447. AlAdhan applies Umm al-Qura's documented Ramadan rule of Maghrib + 120 min instead of + 90 min; `adhan` applies 90 all year. A real rule difference, and AlAdhan is right on it. |

The Oslo case is worth stating plainly, because it is the only place an API's choice could matter to a user: at
Oslo on the June solstice, AlAdhan MWL and local `adhan` MWL differ by nearly two hours on Fajr. But that is a
disagreement between two high-latitude policies, both of which the local library can implement by setting one
option. It is not a disagreement about data.

### 3.3 The significant finding: AlAdhan's authority-named methods do not match those authorities

This is where the trust question bites, and it is the finding the owner most needs.

AlAdhan's `/methods` endpoint lists method 17 as "Jabatan Kemajuan Islam Malaysia (JAKIM)" with parameters
`{"Fajr":20,"Isha":18}` and method 20 as "Kementerian Agama Republik Indonesia" with the same pair (measured).
Both names promise an authority. Neither delivers one.

**Test: AlAdhan method 17 against JAKIM's own published year for Kuala Lumpur, all 365 days of 2026.**
JAKIM's own year came from `e-solat.gov.my`, `period=year&zone=WLY01`, 200, 77,257 bytes (measured).

| Field | n | min delta | max delta | mean delta | exact | within 1 min |
|---|---|---|---|---|---|---|
| Fajr | 365 | +9 | +12 | **+10.29** | **0** | **0** |
| Sunrise | 365 | -1 | 0 | -0.79 | 75 | 365 |
| Dhuhr | 365 | +2 | +3 | **+2.76** | **0** | **0** |
| Asr | 365 | 0 | +4 | +1.79 | 15 | 143 |
| Maghrib | 365 | +1 | +3 | **+1.95** | **0** | 99 |
| Isha | 365 | +1 | +3 | **+1.96** | **0** | 94 |

Delta is JAKIM's published time minus AlAdhan method 17 (measured).

One sample day, 21 June 2026, Kuala Lumpur, as served by each:

| Source | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|---|
| **JAKIM, its own published timetable** | 05:52 | 07:05 | 13:18 | 16:44 | 19:27 | 20:43 |
| AlAdhan method 17, labelled "JAKIM" | 05:41 | 07:06 | 13:15 | 16:42 | 19:24 | 20:40 |

**AlAdhan's "JAKIM" Fajr is 11 minutes early on that day, and 9 to 12 minutes early on every day of the year.**
It never once matches. What AlAdhan has is JAKIM's published angles, which it applies correctly. What it does
not have is JAKIM's published times, which are those angles plus JAKIM's institutional safety margin.

An app that shows AlAdhan method 17 to a Malaysian user and calls it JAKIM is wrong by about 10 minutes on
Fajr, every day. Given the owner's "we need absolute accuracy for this", that is disqualifying for the whole
class of angle-named API methods.

### 3.4 The compute-versus-authoritative split

| APIs that merely COMPUTE (strictly worse than a local library) | Evidence |
|---|---|
| AlAdhan, all 24 methods | its own credits name PrayTimes.org as the engine (cited); matched local `adhan` within 1 min on 365/365 days at 8 of 9 test cities (measured) |
| UmmahAPI | "Built on the Adhan library" (cited, `https://ummahapi.com/prayer-times-api`) |
| `namaz-vakti-api` / `vakti` | "Thanks to adhan-js for prayer time calculations" (cited, its README) |
| `api.pray.zone`, RapidAPI listings, `api.pawan.krd` | UNVERIFIED engine, but all expose the same angle-parameter surface, which is the signature of a PrayTimes or `adhan` wrapper. Inference. |
| moonsighting.com `time_json.php` | a PHP port of PrayTimes.org (wave 1, section 2.6) |

| Sources serving AUTHORITATIVE published data a library cannot reproduce | Evidence |
|---|---|
| **JAKIM Malaysia** | its own year differs from the correct-angle computation by a fixed, documented `ihtiyati` margin no library applies (measured, section 5.3) |
| **MUIS Singapore** | the authority's own file, under an open licence (measured, section 4.2) |
| **Diyanet Turkey** | the authority's own yearly table (cited, sub-agent) |
| **Umm al-Qura / KACST** | the Saudi official calendar's own backend (cited, sub-agent) |
| **UAE Awqaf** | the authority's own times **plus iqama offsets**, which are pure institutional data (cited, sub-agent) |
| **Brunei KHEU** | the authority's own list (cited, sub-agent) |
| **Kemenag Indonesia** | its own published times differ from the correct-angle computation by 2 to 4 minutes (measured, section 5.4) |
| **Mawaqit** | per-mosque times and iqama, set by mosque administrators (measured, section 3.5) |
| **`londonprayertimes.com`** | the London Unified timetable, which wave 1 showed is a chart plus 21 hand edits |

Only the second list has any claim on this app.

### 3.5 Mawaqit, and the evidence that computation is the wrong frame

Mawaqit's unauthenticated search endpoint returns, for a coordinate, the nearby mosques with the times each one
actually uses. Measured: `GET https://mawaqit.net/api/2.0/mosque/search?lat=51.5072&lon=-0.1276` returned 200,
9,543 bytes, nine mosques, with no key and no token.

The nine central London mosques it returned, on 2026-09-30:

| Prayer | earliest | latest | spread | distinct values among 9 mosques |
|---|---|---|---|---|
| Fajr | 05:04 | 05:30 | **26 min** | 2 |
| Sunrise | 06:57 | 06:59 | 2 min | 2 |
| Dhuhr | 12:50 | 13:00 | 10 min | 3 |
| Asr | 15:58 | 16:46 | **48 min** | 3 |
| Maghrib | 18:41 | 18:44 | 3 min | 3 |
| Isha | 20:00 | 20:11 | 11 min | 3 |

All measured. The iqama (congregation) times spread further still: Fajr iqama runs 05:45, 05:50, 05:55, 06:00
and Asr iqama runs 16:13, 16:15, 16:30, 17:15, 17:30 across the same nine mosques (measured).

Two readings follow, and both matter to the v2.0 decision:

- The 48-minute Asr spread is the Hanafi and Shafi split, and the 26-minute Fajr spread is a choice of angle or
  of timetable. So the question "which calculation is correct for London" has no single answer even inside one
  square mile. That is a product question, not a computation question.
- The iqama times are not computable at all. They are what a mosque committee decided. An app that wants to tell
  a user when their congregation actually starts needs per-mosque data, and Mawaqit is the only platform found
  that has it at scale, with 3,000-plus mosques in 70-plus countries (cited, its sponsor page).

But the terms close the door. The help centre says the API is private (cited). The sponsor page says commercial
use is strictly prohibited (cited). The legal notice, last updated 2026-03-24, says any reproduction of any part
of the site's elements is prohibited without prior written authorisation (cited). The search endpoint answering
without a key does not change any of that. **Using Mawaqit in this app would need written permission from
MAWAQIT ASSO, and the report's recommendation is to ask rather than to assume.**

Mawaqit's own open-source repositories were examined. `mawaqit/mawaqit-py` (Apache-2.0) gives the API surface in
`mawaqit/consts.py` and `mawaqit/utils.py`: base `https://mawaqit.net/api`, `2.0/me` for login,
`2.0/mosque/search`, `2.0/mosque/{uuid}/prayer-times` and `3.0/mosque/{uuid}/info` (measured, read from source).
The last two returned **401** without a token (measured). The org also hosts `mawaqit/prayer-times` (LGPL-3.0)
and `mawaqit/prayer-times-moonsighting`, both described in their own READMEs as forks of the
`islamic-network` repositories "which has been deleted from github", which is the same PHP family wave 1
traced.

---

## 4. National authority feeds, the highest-value category

The two sub-agent reports carry the full survey. This section states what was re-measured here and what it
means. Full detail: `data/apis/national-authorities.md`.

### 4.1 JAKIM Malaysia, re-measured here

| Property | Value |
|---|---|
| URL | `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=WLY01` |
| Status, size, latency | 200, **77,257 B**, TTFB 2.114 s, total 2.318 s (measured, first call; 0.63 to 1.34 s on later calls) |
| Rows | **365** (measured) |
| Fields | `hijri, date, day, imsak, fajr, syuruk, dhuha, dhuhr, asr, maghrib, isha` (measured) |
| Extras | `bearing` gives the qibla direction as `292° 31′ 16″` (measured) |
| Key | none (measured) |
| CORS | `access-control-allow-origin: *` (measured) |
| Server | `Apache/2.4.67 PHP/7.1.33` behind CloudFront (measured) |
| Cache | `no-store, no-cache, must-revalidate` (measured) |
| Zones | 59 zone codes cover the federation (cited, sub-agent) |
| Terms | **none stated at the endpoint** |

Five zones were fetched here for the correction analysis: `WLY01`, `SGR01`, `JHR02`, `PLS01`, `SBH01`, all 200
at 77,256 or 77,257 bytes (measured).

Two data quirks a client must handle, both measured. The month abbreviations **mix English and Malay** in one
response: `Jan` through `Jul` in English, then `Ogos`, `Sep`, `Okt`, `Nov`, `Dis`. And `PHP/7.1.33` reached end
of life in December 2019, which is a maintenance signal about the host rather than about the data.

### 4.2 MUIS Singapore, re-measured here, and the only open licence found

| Property | Value |
|---|---|
| Dataset | `d_a6a206cba471fe04b62dd886ef5eaf22` on `data.gov.sg` |
| Flow | `GET https://api-open.data.gov.sg/v1/public/api/datasets/{id}/poll-download` returns 201 with a signed S3 URL (measured) |
| CSV | 200, **57,771 B**, **1,096 data rows** covering 2024-01-01 to 2026-12-31 (measured) |
| Header | `Date,Day,Subuh,Syuruk,Zohor,Asar,Maghrib,Isyak` (measured) |
| Licence | **Singapore Open Data Licence 1.0**: commercial use and redistribution permitted with attribution (cited, `https://data.gov.sg/open-data-licence`, 2026-09-30) |

One trap, measured: the four afternoon and evening columns are **12-hour with no meridiem**. The first row reads
`2024-01-01,Mon,05:44,07:07,01:10,04:34,07:10,08:25`, where `01:10` is 13:10. Parsing it as 24-hour puts Dhuhr
before Fajr.

This is the only source in the entire report that an app can ship today without asking anyone's permission.

### 4.3 What the authority survey establishes, and what it does not

Established (cited, sub-agent, each row backed by an HTTP response):

- Five authorities serve a whole official year in one keyless request: JAKIM, MUIS, Diyanet's public page,
  Brunei KHEU and Saudi Umm al-Qura.
- UAE Awqaf serves the **whole federation** for a year in one 13.6 MB call, with iqama offsets, behind an
  anonymous token that could only be minted in a browser.
- Four authorities publish HTML or PDF one month at a time: Morocco Habous, Oman MARA, Jordan Awqaf, Egypt Dar
  al-Ifta.
- Kemenag Indonesia's endpoint was located but not opened; its province codes remain unknown. `api.myquran.com`
  is the practical Indonesian route and is a third party whose Kemenag provenance is **UNVERIFIED**.
- Kuwait, Pakistan, Bangladesh, Qatar, Bahrain, Tunisia and Iran had nothing machine-readable the sub-agent
  could find. Dubai IACAD returned 403 to everything.
- No open-data portal except `data.gov.sg` carried a reachable prayer dataset.

Not established:

- **Terms.** JAKIM, Diyanet's page, Brunei's OData list, Saudi `umqserv` and UAE Awqaf all served data without
  asking anything and none states terms for reuse. The sub-agent's judgement, which this report endorses, is
  that absence of a licence is not permission.
- **Uptime.** Nobody publishes one.
- **Whether the authorities want the load.** Unasked, in every case.

---

## 5. The offline bulk-data question, and the correction-table result

This section is the most valuable part of the work, and the correction-table result in 5.3 is the single most
actionable finding in the report.

### 5.1 What bulk data exists

Full survey: `data/apis/bulk-datasets.md`. The short version, all from the datasets sub-agent unless re-measured
here:

| Category | Result |
|---|---|
| **Government open-data portals** | Essentially a dead end. `data.gov.uk` returned count 0, HDX count 0, `data.gov.my` "No entries found" (all measured by the sub-agent). The one success is `data.gov.sg`, re-measured here in 4.2. Prayer timetables are ministry artefacts, not statistics-agency datasets. |
| **Zenodo, Figshare, Kaggle, OSF, academic repositories** | **Nothing.** 184,090 hits for "prayer times" on Zenodo and not one timetable (cited, sub-agent). This is structural: a timetable is a religious-administrative output, not a research output. |
| **GitHub, community scrapes** | Plenty, licensing mostly absent. `fortextexe/namaz-data`: 18,644 districts, 211 country codes, Diyanet-sourced, 2,364,430,269 bytes raw, 149 MB packed, **no licence**. `my-prayers/muslim-data`: **Apache-2.0**, SQLite, with only **3,433,472 bytes** of actual prayer tables inside a 28.7 MB geocoder. `ruqqq/prayertimes-database`: Singapore back to 2011 but **GPL-3.0 on the data**. `open-mosque-prayer-times-dataset`: 19,940 mosques in 101 countries, 2,920,076 bytes, **ODbL share-alike**. |
| **Authority annual PDFs and spreadsheets** | Real but per-country work. Qatar's national perpetual timetable is already digitised from the authority PDF into a **14,219 byte MIT CSV** (cited, sub-agent), which is the clearest evidence that PDF-to-dataset is a weekend rather than a project. Morocco's Habous site ignores its own `mois` and `annee` parameters, returning an identical 24,167 bytes for all three variants tried (measured, sub-agent). |
| **Islamic platforms** | Quran.com and Sunnah.com carry **no prayer data at all** (measured here: `api.quran.com/api/v4/` returned 1 byte, `api.sunnah.com/v1/collections` returned 403). The `islamic-network` GitHub org has exactly one 3 KB repository (cited, sub-agent). |

**Digitisation feasibility: about 12 countries.** That is the sub-agent's deliberately conservative count, with
5 already digitised (Singapore, Malaysia, Qatar, Maldives, Turkey) and 7 obtainable with work (Morocco, Egypt,
Bangladesh, Brunei, Indonesia, Libya, Jordan). It is not 190. Trusting unsourced coverage claims would push it
to 19; counting Diyanet's 211 country codes would answer a different question, because Diyanet **computes**
foreign cities rather than republishing each nation's own authority times.

One structural idea from that survey deserves to be lifted out, because it changes the arithmetic. The
**Maldives** dataset stores 202 islands as **42 latitude bands times 366 days in a dummy leap year**, plus a
per-island minute offset. That is 4.8x fewer rows, and because the year is a dummy, **it never expires**. The
same trick appears in `muslim-data`'s schema as `date` stored as `MM-DD` with a `prayer_dependent_id` letting
127 locations reuse a neighbour's timetable.

### 5.2 The byte cost of a city-year, measured on real authority data

Script: `data/apis/correction-table.mjs`. Measured on JAKIM's actual published `WLY01` year, 365 days, six times
per day.

| Encoding | raw B | gzip -9 B | brotli B | raw B/day | brotli B/day |
|---|---|---|---|---|---|
| Naive JSON, `HH:MM` with named keys | 43,071 | 2,452 | **1,414** | 118.0 | 3.9 |
| Compact JSON, array of six `HH:MM` | 18,251 | 1,337 | **759** | 50.0 | 2.1 |
| Minutes-since-midnight JSON | 10,359 | 1,212 | **743** | 28.4 | 2.0 |
| Binary, `uint16` x 6 x days | 4,380 | 1,257 | **755** | 12.0 | 2.1 |
| **Residual JSON, signed minutes vs a computed baseline** | 5,703 | 627 | **540** | 15.6 | 1.5 |
| **Residual binary, `int8` x 6 x days** | 2,190 | 507 | **436** | 6.0 | 1.2 |
| **Residual, 4 bits per value, per-field constant removed** | 1,095 | 368 | **345** | 3.0 | 0.9 |

All measured. Two things stand out. Raw sizes mislead badly: binary is 10x smaller than naive JSON raw but
almost identical after brotli, because brotli already models the repetition in `HH:MM` strings. And **the
residual against a computed baseline is the only encoding that wins after compression**, at 345 bytes against
1,414, a 4.1x saving, because the residual carries far less entropy than the times themselves.

### 5.3 The correction-table result: JAKIM's whole published year is six integers plus a computation

This is the finding the brief asked for, and it holds.

**Method.** Compute each JAKIM zone's year locally with `adhan` 4.4.6 at JAKIM's own published parameters, Fajr
20 degrees, Isha 18 degrees, Shafi Asr. Subtract, per field, per day. Script:
`data/apis/correction-model.mjs`. Output: `data/apis/results-correction-model.txt`.

**Result. The residual is not random. It is a small positive constant per field.**

| Zone | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha | worst error left by these six constants |
|---|---|---|---|---|---|---|---|
| `WLY01` Kuala Lumpur | **+10** | -1 | +3 | +2 | +2 | +2 | **2 min** |
| `SGR01` Selangor west | +10 | -2 | +2 | +1 | +1 | +1 | **2 min** |
| `JHR02` Johor Bahru | +10 | 0 | +3 | +1 | +1 | +1 | **1 min** |
| `PLS01` Perlis | +9 | 0 | +2 | +1 | +1 | +1 | **1 min** |
| `SBH01` Sandakan | +10 | +1 | +3 | +2 | +2 | +2 | **2 min** |

All measured, each row from 2,190 published values.

**Applying those six constants and scoring every published value:**

| Zone | values compared | exact | within 1 min | within 2 min | worst |
|---|---|---|---|---|---|
| `WLY01` | 2,190 | 1,305 (59.6%) | 2,161 (98.7%) | **2,190 (100.0%)** | 2 |
| `SGR01` | 2,190 | 1,309 (59.8%) | 2,138 (97.6%) | **2,190 (100.0%)** | 2 |
| `JHR02` | 2,190 | 1,270 (58.0%) | **2,190 (100.0%)** | 2,190 (100.0%) | 1 |
| `PLS01` | 2,190 | 1,735 (79.2%) | **2,190 (100.0%)** | 2,190 (100.0%) | 1 |
| `SBH01` | 2,190 | 1,485 (67.8%) | 2,166 (98.9%) | **2,190 (100.0%)** | 2 |

All measured, 10,950 values in total. **Six signed bytes per zone reproduce an entire national authority's
published year to within two minutes, everywhere, on every day.**

**Is the +10 on Fajr real, or an artefact of the baseline coordinate?** Tested, because it matters. A coordinate
error cannot produce this pattern:

| baseline lat, lon | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|---|
| 3.139, 101.6869 | +10.29 | -0.80 | +2.77 | +1.76 | +1.94 | +1.97 |
| 3.139, 101.4869 (0.2 deg west) | +9.48 | -1.61 | +1.97 | +0.95 | +1.12 | +1.19 |
| 3.139, 101.8869 (0.2 deg east) | +11.11 | +0.01 | +3.56 | +2.55 | +2.75 | +2.78 |
| 3.0, 101.6869 | +10.28 | -0.80 | +2.77 | +1.74 | +1.94 | +1.99 |
| 3.3, 101.6869 | +10.32 | -0.81 | +2.77 | +1.77 | +1.92 | +1.96 |

All measured. Longitude shifts every field together, which is what a clock offset does. Latitude barely moves
anything. But the **contrasts between fields are coordinate-invariant**, and they are the signal:
`Fajr - Sunrise = +11.09` minutes, `Dhuhr - Sunrise = +3.57`, `Maghrib - Sunrise = +2.74` (measured). No
coordinate can produce an 11-minute gap between Fajr's residual and Sunrise's.

**Is it a different Fajr angle?** No. Sweeping the angle:

| Fajr/Isha angle | Fajr mean residual | Fajr spread | Isha mean residual | Isha spread |
|---|---|---|---|---|
| 18 | +1.88 | 2 | +1.97 | 2 |
| 18.5 | +4.01 | 2 | -0.13 | 2 |
| 19 | +6.10 | 3 | -2.24 | 2 |
| 19.5 | +8.20 | 3 | -4.33 | 3 |
| **20** | **+10.29** | **3** | **-6.45** | **3** |
| 20.5 | +12.38 | 3 | -8.53 | 3 |
| 21 | +14.52 | 3 | -10.64 | 3 |

All measured. No single angle makes both Fajr and Isha land on zero. At 18 degrees both residuals sit at about
+2, which is the same +2 the other four prayers carry. **So the structure is: a uniform safety margin of about
+2 minutes on every prayer, plus roughly 8 further minutes on Fajr.**

That reading is corroborated in Malaysia's own literature. A UMP journal paper refers to "waktu ihtiyati 2 minit
yang telah diputuskan oleh JAKIM", the two-minute safety margin JAKIM decided on (cited,
`https://journal.ump.edu.my/index.php/ijhtc/article/download/6226/2865`, 2026-09-30). And the Mufti of the
Federal Territory published a dedicated ruling titled "ISU TAMBAHAN WAKTU 8 MINIT BAGI PERMULAAN AZAN SUBUH",
the issue of the additional 8 minutes for the start of the Fajr adhan (cited,
`https://www.muftiwp.gov.my/ms/artikel/bayan-linnas/3858-...`, 2026-09-30). Two plus eight is ten. **The +10
this research measured on Fajr is JAKIM's documented institutional policy, not noise.**

The three-model comparison, for completeness:

| Model | stored per zone | worst error left |
|---|---|---|
| **A**: one constant per field | **6 signed bytes** | **1 to 2 min** |
| **B**: constant plus a 12-value monthly table per field | 78 integers | 1 to 2 min, **no better than A** |
| **C**: the exact per-day residual | 345 B brotli | **0, reproduces the published year exactly** |

All measured. Model B is not worth its bytes: the residual has no seasonal structure left for a monthly table to
capture. The real choice is A or C.

### 5.4 The pattern generalises: Kemenag Indonesia, and the counter-example of MUIS Singapore

**Kemenag Indonesia.** A full year of Jakarta was assembled from twelve monthly `api.myquran.com` calls, 365
days, and compared against local `adhan` at Kemenag's stated Fajr 20 / Isha 18.

| Field | n | min | max | spread | mean | mode |
|---|---|---|---|---|---|---|
| Subuh | 365 | +2 | +3 | **1** | +2.51 | +3 (51%) |
| Terbit | 365 | -4 | -3 | **1** | -3.14 | -3 (86%) |
| Dzuhur | 365 | +3 | +4 | **1** | +3.57 | +4 (57%) |
| Ashar | 365 | +2 | +4 | 2 | +2.55 | +3 (54%) |
| Maghrib | 365 | +3 | +4 | **1** | +3.24 | +3 (76%) |
| Isya | 365 | +2 | +3 | **1** | +2.49 | +2 (51%) |

All measured. A spread of **1 minute on five of six fields**. Same shape as Malaysia: a small institutional
margin, tightly bounded, trivially encodable. Note the sign flip on Terbit (sunrise), which is negative because
sunrise **ends** the Fajr window, so a safety margin there must run the other way. That asymmetry is itself
evidence of deliberate policy.

**MUIS Singapore is the important counter-example.** Its licensed CSV for 2026, against local `adhan`
`CalculationMethod.Singapore()`:

| Field | n | min | max | spread | mean | mode share at 0 |
|---|---|---|---|---|---|---|
| Subuh | 365 | -1 | +1 | 2 | **-0.00** | 67% |
| Syuruk | 365 | -1 | +1 | 2 | +0.01 | 73% |
| Zohor | 365 | -1 | +1 | 2 | +0.07 | 77% |
| Asar | 365 | -2 | +1 | 3 | +0.02 | 55% |
| Maghrib | 365 | -1 | +1 | 2 | +0.10 | 73% |
| Isyak | 365 | -1 | +1 | 2 | +0.01 | 81% |

All measured. **Every Model A constant is zero.** MUIS applies no safety margin at all: its published timetable
is the plain 20/18 computation, reproducible by `adhan` to within a minute on every field. Its residual costs
324 bytes brotli and every one of the six constants is 0.

The contrast is the real lesson, and it is sharper than either case alone:

| Authority | Model A constants | What it means for the app |
|---|---|---|
| **MUIS Singapore** | 0, 0, 0, 0, 0, 0 | a local library with the right method **is** the authority's timetable |
| **JAKIM Malaysia** | +10, -1, +3, +2, +2, +2 | a local library is 10 minutes wrong on Fajr unless the correction is shipped |
| **Kemenag Indonesia** | +3, -3, +4, +3, +3, +2 | same, smaller |

**So "use a library with the right angles" is correct for some countries and wrong by ten minutes for others,
and the only way to know which is to obtain the authority's own published times and measure.** That is the
argument for the correction-table approach, and it is now measured rather than asserted.

### 5.5 What it costs to ship a year for many cities

Per-city-year figures are the measured ones from 5.2. Brotli columns:

| Encoding | raw B/city-year | brotli B/city-year | 100 cities | 500 | 1,000 | 5,000 | 20,000 |
|---|---|---|---|---|---|---|---|
| Naive JSON | 43,071 | 1,414 | 138 KB | 690 KB | 1.3 MB | 6.7 MB | 27.0 MB |
| Compact JSON | 18,251 | 759 | 74 KB | 371 KB | 741 KB | 3.6 MB | 14.5 MB |
| Minutes JSON | 10,359 | 743 | 73 KB | 363 KB | 726 KB | 3.5 MB | 14.2 MB |
| Binary `uint16` | 4,380 | 755 | 74 KB | 369 KB | 737 KB | 3.6 MB | 14.4 MB |
| **Residual JSON** | 5,703 | 540 | 53 KB | 264 KB | 527 KB | 2.6 MB | 10.3 MB |
| **Residual `int8`** | 2,190 | 436 | 43 KB | 213 KB | 426 KB | 2.1 MB | 8.3 MB |
| **Residual 4-bit** | 1,095 | **345** | **34 KB** | **168 KB** | **337 KB** | **1.6 MB** | **6.6 MB** |
| **Model A constants only** | 6 | 6 | **0.6 KB** | **2.9 KB** | **5.9 KB** | **29 KB** | **117 KB** |

All derived from measured per-year figures.

**In the app's own terms.** The release bundle is about 67 MB with a 4.9 MB JS bundle.

| What | brotli size | % of the 4.9 MB JS bundle | % of the 67 MB release bundle |
|---|---|---|---|
| 1,000 city-years, naive JSON | 1.35 MB | 27.5% | 2.01% |
| 1,000 city-years, exact residual 4-bit | **0.33 MB** | **6.7%** | **0.49%** |
| Model A constants for all 59 JAKIM zones | **354 B** | 0.007% | 0.0005% |
| Model A constants for 1,000 zones worldwide | **5.9 KB** | 0.12% | 0.009% |
| The whole 60-zone Malaysian federation, exact residual | **20.7 KB** | 0.4% | 0.03% |

All computed from measured per-unit figures. The conclusion is that **size is not the constraint**. Shipping a
correction table for every authority on earth that publishes one is a few tens of kilobytes. Even shipping the
exact per-day residual for a thousand cities is a third of a megabyte, half a percent of the release bundle.
The constraint is licensing and sourcing, not bytes.

### 5.6 Where each option falls against the no-synthesis rule

The standing rule is that the app never invents or averages a prayer time. Each option must be judged against
it, and they do not all land on the same side.

| Option | What the user sees | Verdict against the rule |
|---|---|---|
| **A local library with published angles** | a number the app computed | **Compliant.** It is a computation from a named published method, not an invention. But it is **not the authority's time** wherever the authority applies a margin, so it is compliant and still wrong for Malaysia. |
| **The authority's published times, shipped verbatim** | exactly what the authority printed | **Fully compliant, and the gold standard.** Costs 759 to 1,414 bytes per city-year. |
| **Exact per-day residual on a computed baseline (Model C)** | **exactly what the authority printed**, reconstructed | **Fully compliant.** This is lossless compression of the authority's own numbers, not synthesis. The app displays the authority's digits; the residual is only how they were stored. 345 bytes per city-year. |
| **Constant-offset correction (Model A)** | a number within 1 to 2 minutes of what the authority printed | **NOT compliant.** On 40% of values it shows a time the authority never published. Six bytes per zone is seductive, and the rule should still rule it out for display. |
| **Model A as a validation check** | nothing; it never reaches the user | **Compliant, and useful.** Six constants per zone are a cheap way to detect that a source or a baseline has drifted. |
| **Interpolating between two cities, or averaging two authorities** | a synthesised time | **NOT compliant.** Not investigated further for that reason. |

The distinction between Model A and Model C is the one the report most wants understood. They look like the same
idea and they are on opposite sides of the line. A residual table is only synthesis-free when the residual is
**exact**. The moment it is approximated to save bytes, the app starts printing numbers nobody published, and
the bytes saved are 345 against 6, which is nothing worth having.

---

## 6. Timezone, location and elevation, which an offline app owns

### 6.1 How stale tzdata produces a wrong prayer time, measured

A prayer time is a local wall-clock rendering of a solar event. Get the UTC offset wrong and every prayer that
day is wrong by the error, usually a full hour.

**The measurement.** This machine has two tz databases of different vintages: Node 24.14.1 ships ICU **tz
2025c** (measured, `process.versions.tz`), and the macOS system zoneinfo is **2026c** (measured,
`/var/db/timezone/zoneinfo/+VERSION`). Comparing every day of 2026 across 14 politically volatile zones:

| Zone | days in 2026 where the older 2025c offset differs from 2026c | first differing day |
|---|---|---|
| **`Africa/Casablanca`** | **103** | 2026-09-20: 2025c says +60 min, 2026c says 0 min |
| **`Africa/El_Aaiun`** | **103** | 2026-09-20: same |
| `Asia/Gaza`, `Africa/Cairo`, `Asia/Beirut`, `Asia/Tehran`, `America/Mexico_City`, `Asia/Damascus`, `Asia/Amman`, `Pacific/Apia`, `Asia/Almaty`, `Europe/Kyiv`, `Asia/Hebron`, `Asia/Jerusalem` | 0 | none |

All measured. **A tz database roughly one year out of date makes every prayer time in Morocco and Western Sahara
an hour wrong for 103 consecutive days**, from 20 September to the end of the year. Morocco is a country of
about 37 million people, nearly all Muslim.

Wave 1 found the same defect from the other side: moonsighting.com's server serves Casablanca on the older rule
and a client cannot see the server's timezonedb version (`RESEARCH-FINDINGS.md` section 2.12). So this class of
fault reaches the app whether the times are computed locally on a stale device or fetched from a stale server.

**The recent rule changes that make this a live risk,** all measured against the 2026c database:

| Country | Change | Measured evidence |
|---|---|---|
| **Morocco** | permanent +01 with a Ramadan drop to +00 | 2026 has **3 transitions**: +01 to 0 on 2026-02-15, back to +01 on 2026-03-22, then to 0 on 2026-09-20 |
| **Iran** | abolished DST from 2022 | 2022 had **2 transitions**; **2026 has 0** |
| **Mexico** | abolished DST from October 2022 | 2022 had **2 transitions**; **2026 has 0** |
| **Syria** | abolished DST from October 2022 | 2022 has 1 transition and then none |
| **Jordan** | permanent +03 from February 2022 | 2022 has 1 transition and then none |
| **Egypt** | reinstated DST in 2023 | 2026 has **2 transitions**, 2026-04-24 and 2026-10-30 |
| **Lebanon** | the 2023 dispute | 2023 shows transitions on 2023-03-26 and 2023-10-29 |
| **Palestine** | changes annually | `Asia/Gaza` 2026 has 2 transitions, 2026-03-28 and 2026-10-24 |

Morocco is the hard case and it is not going away. Its Ramadan transitions move with the lunar calendar, so
**every single year needs a tzdata update**, and the app cannot compute the rule itself.

**The device-side risk.** How stale the on-device tzdata actually gets was not measured on real hardware, so the
specific claim is **UNVERIFIED**. What is established is the shape of the exposure:

- Android's `tzdata` is updated through Play Services and mainline modules on newer releases, but an Android 9
  device off the update path keeps whatever it shipped with. Android 9 shipped in 2018.
- iOS ships tzdata in system updates, so a device that stopped receiving them is frozen at that point.
- **JavaScriptCore and Hermes both delegate zone rules to the platform ICU.** So a React Native app inherits the
  device's staleness and cannot override it through `Intl`.
- Measured here: Node's own bundled ICU was already a year behind the system database on a fully updated
  machine. That is the same failure mode, on the most favourable hardware available.

The practical consequence for v2.0: **for any zone whose rules change, the app cannot rely on the device's
tzdata alone.** Either ship a tz rules table and update it with the app, which is what `tzdata` on npm at
427,235 bytes is for (measured), or accept that Morocco will be an hour wrong on old devices.

### 6.2 Offline coordinate to timezone

Measured package sizes from the npm registry, 2026-09-30:

| Package | Version | Licence | Unpacked B | Fit |
|---|---|---|---|---|
| **`@photostructure/tz-lookup`** | 11.7.0 | **CC0-1.0** | **88,029** | **the answer** |
| `tz-lookup` | 6.1.25 | CC0-1.0 | 151,899 | the older original |
| `geo-tz` | 8.1.9 | MIT | **74,179,650** | unshippable, full tz polygons |
| `timezone-support` | 3.1.0 | MIT | 27,043,318 | too large |
| `city-timezones` | 1.3.4 | MIT | 1,923,786 | city names, not coordinates |
| `countries-and-timezones` | 3.10.0 | MIT | 517,168 | metadata, no geometry |
| `@vvo/tzdb` | 6.198.0 | MIT | 175,012 | zone metadata and major cities |
| `tzdata` | 1.0.51 | MIT | 427,235 | the IANA rules as JSON, for 6.1 |
| `expo-localization` | 57.0.2 | MIT | 157,144 | reads the device's own zone |
| `react-native-localize` | 3.7.2 | MIT | 218,737 | same |

**Accuracy test, run here.** `@photostructure/tz-lookup` 11.7.0 against 16 coordinates chosen for difficulty:

| Place | Returned | Expected | Match |
|---|---|---|---|
| London, Jakarta, Makkah, Kuala Lumpur, Istanbul, Singapore, Casablanca, Kathmandu, Adelaide, Tromso, Kashgar, Karachi, Lagos, Dhaka, **Gaza**, **Hebron** | correct in every case | | **16/16** |

All measured. It resolved `Asia/Gaza` and `Asia/Hebron` separately, which many lookups conflate, and
`Asia/Urumqi` for Kashgar rather than the official `Asia/Shanghai`, which is the geographically right answer.
88 KB and CC0-1.0, with the data in a single 73,381-byte `tz.js` (measured).

**Offline coordinate to city name.** Weaker options:

| Package | Licence | Unpacked B | Note |
|---|---|---|---|
| `all-the-cities` | MIT | 6,416,347 | 138,398 cities over 1,000 population, binary-packed |
| `cities.json` | CC-BY-4.0 | 19,569,679 | GeoNames gazetteer, too large |
| `reverse-geocode` | MIT | 7,106,524 | |
| `local-reverse-geocoder` | Apache-2.0 | 64,281 code only, **downloads GeoNames at runtime** | not offline as shipped |

All measured. `all-the-cities` at 6.4 MB is the realistic offline choice and it would more than double the JS
bundle. The cheaper route is to ship city names only for the places the app has timetables for, which is a few
thousand short strings, and fall back to showing coordinates elsewhere.

### 6.3 Reading the device's own timezone offline

This needs no data at all. `Intl.DateTimeFormat().resolvedOptions().timeZone` returns the IANA zone, and it
works with the network off because it reads the platform's own setting. `expo-localization` and
`react-native-localize` wrap the same thing with the calendar and locale alongside. The caveat is 6.1: the
**zone name** is reliable, the **rules** behind it are only as current as the device.

### 6.4 Elevation: how much it matters, computed

A raised observer sees a depressed horizon, so sunrise comes earlier and sunset later. The dip is
`acos(R/(R+h))` with `R = 6,371,000` m.

| Elevation | Horizon dip |
|---|---|
| 50 m | 0.2270 deg |
| **100 m** | **0.3210 deg** |
| 200 m | 0.4540 deg |
| 500 m | 0.7178 deg |
| 1,000 m | 1.0151 deg |
| 2,000 m | 1.4355 deg |

All measured. Recomputing the sunset hour angle with the sun altitude at `-(0.833 + dip)` instead of `-0.833`:

**Minutes that sunset is later at elevation h than at sea level:**

| Latitude | Declination | 100 m | 500 m | 1,000 m | 2,000 m |
|---|---|---|---|---|---|
| 0 (equator) | 0 (equinox) | 1.28 | 2.87 | 4.06 | 5.74 |
| 21.4 (Makkah) | 0 | 1.38 | 3.08 | 4.36 | 6.17 |
| 21.4 | +23.44 (Jun) | 1.53 | 3.43 | 4.85 | 6.86 |
| 31.0 | +23.44 | 1.70 | 3.81 | 5.39 | 7.64 |
| **51.5 (London)** | **0** | **2.06** | 4.61 | 6.53 | 9.23 |
| **51.5** | **+23.44 (Jun)** | **2.75** | 6.18 | 8.77 | 12.48 |
| **59.9 (Oslo)** | **+23.44 (Jun)** | **4.51** | **10.25** | 14.68 | **21.16** |

All measured. Sunrise moves by the same amount in the opposite direction, so the day lengthens by twice these
figures.

**Answering the brief's question directly: per 100 metres, at the equinox, sunset is later by 1.28 min at the
equator, 1.38 min at Makkah's latitude, 2.06 min at London's and 2.56 min at Oslo's.** In high-latitude summer
the same 100 m is worth 4.51 minutes at Oslo.

Three consequences for this app:

1. **It is larger than the margins the app is trying to get right.** JAKIM's entire safety margin is 2 minutes.
   A user 500 m up in the Cameron Highlands has a sunset 3.4 minutes later than the sea-level computation. The
   elevation error exceeds the institutional correction.
2. **Real Muslim cities are high.** Sanaa is about 2,250 m, Kabul about 1,790 m, Tehran about 1,200 m, Addis
   Ababa about 2,355 m, Bogota about 2,640 m, Mexico City about 2,240 m, Denver about 1,610 m. At 2,000 m the
   sunset shift is 6 to 7 minutes at low latitude and over 20 minutes at high latitude.
3. **Whether any authority accounts for it is largely UNVERIFIED, and the evidence points to mostly not.**
   AlAdhan's `/calendar` response `meta` has no elevation field at all (measured). JAKIM's response has none
   (measured). MUIS's CSV has none (measured). The one service found that treats elevation as a first-class
   input is `muwaqqit.com`, whose interface exposes both an elevation and a separate horizon-elevation field
   (cited, `https://www.muwaqqit.com/`, 2026-09-30). Wave 1 found `@tawfeeqmartin/fajr` applying automatic
   registry elevation, which shifted London's sunrise by 1 to 2 minutes (`implementations.md` section 2.16).
   Whether JAKIM, Kemenag, Diyanet or MUIS build elevation into their published tables was not established.

**Offline elevation data.** `srtm-elevation` (ISC, 3,150,360 B) and `geotiff` (MIT, 3,829,334 B) read HGT and
GeoTIFF tiles, but neither ships the tiles (measured). SRTM's global coverage at 30 m resolution is hundreds of
gigabytes. The shippable approach is a coarse elevation value per supported city, which is one 16-bit integer
each, or **2 bytes per city**. For 1,000 cities that is 2 KB, which is nothing. **Elevation is the cheapest
accuracy improvement available to this app and it is currently being left on the table.**

---

## 7. UNVERIFIED and open

1. **Whether AlAdhan permits caching and redistribution.** The terms neither grant nor prohibit it. Needs
   asking Islamic Network.
2. **Whether Mawaqit would grant written authorisation.** Their non-commercial prohibition is explicit, but
   this app's status under it depends on facts about the app the report does not have. Worth asking; a
   per-mosque feed with iqama times would be a better product than anything computed.
3. **Whether JAKIM, Diyanet, Brunei, Saudi and UAE permit reuse.** None states terms. Absence of a licence is
   not permission. Five separate conversations.
4. **AlAdhan's real uptime.** No status page, no published history, and the Wayback CDX service was down
   during this research. Nobody's availability is established, including AlAdhan's.
5. **Whether `api.myquran.com` really carries Kemenag's numbers.** Its residual against a 20/18 computation has
   the same 1-to-2-minute shape as an authority timetable, which is consistent with the claim, but no Kemenag
   page endorses it. The correction measured in 5.4 is therefore a correction to `myquran`, not provably to
   Kemenag.
6. **Kemenag's own endpoint.** Located at `POST /ajax/getShalatbln` with `{x,y,bln,thn}` but not opened. Bare
   POSTs return `{"status":"Illegal key"}`; adding `Referer` and a session cookie got an empty 200 instead. The
   province codes were never learned. Numeric province guesses 1, 2, 3, 11, 12, 31, 32 and 35 all returned
   empty (measured).
7. **How stale device tzdata actually gets on real Android 9 and old iOS hardware.** The exposure is
   established; the distribution is not. This needs measuring on devices and is the single most useful
   follow-up in section 6.
8. **Whether any national authority accounts for elevation in its published tables.** Not established for
   JAKIM, Kemenag, Diyanet or MUIS. A high-altitude city in each country compared against its own sea-level
   computation would settle it.
9. **Whether the JAKIM correction is stable across years.** Only 2026 was measured. JAKIM's `ihtiyati` is a
   policy decision and policies change; the Mufti of WP ruling cited in 5.3 is itself about a change. The 2025
   and 2027 years should be fetched and differenced before anything is built on the constants.
10. **JAKIM's per-zone reference coordinates.** The `takwimsolat` response does not include one, so the
    baselines in 5.3 are town centres chosen here. The contrast analysis shows the conclusion does not depend on
    them, but the exact constants do.
11. **UAE Awqaf's anonymous token flow.** The sub-agent could only mint it inside a browser origin. Whether it
    can be minted from a mobile client is unknown, and the UAE feed is the only one found that carries iqama
    times at national scale.
12. **RapidAPI pricing beyond the Basic tier**, and whether the Yanga listing is anything other than an AlAdhan
    proxy. The bare host returned 404 (measured) and the pricing page was not readable by the fetch tool.
13. **Diyanet's official API terms.** The 10-requests-per-month cap on the yearly endpoint is cited from the
    sub-agent, not read here.
14. **Whether brotli is available in the React Native runtime** for the 4-bit residual encoding. The byte
    figures in 5.5 assume it. If only gzip is available, the residual figures rise from 345 to 368 bytes per
    city-year, which changes nothing material.

---

## 8. RECOMMENDATION

### Is any API justified for this app?

**No general-purpose prayer-time API is justified.** The evidence is that they all compute, with the same
open-source engines the app can run locally, and this research matched AlAdhan to a local `adhan` within one
minute on 365 of 365 days at eight of nine test cities. An API of that kind costs a network dependency, a
privacy exposure and an outage risk, and buys nothing. Finding 6 makes it worse than neutral: AlAdhan's
authority-named methods are 10 minutes wrong against the authority they name, so using one would be less
accurate than the alternative below while also being online.

**A national authority feed is justified, one country at a time.** That is a different thing from a prayer-time
API. It is the only category in this report serving numbers a library cannot reproduce, and for countries like
Malaysia the difference is 10 minutes on Fajr, every day.

### If an API must be used, which one?

**AlAdhan, and only as a convenience, never as an authority.** It is the best of its class: free, keyless, 12
requests per second, a whole year in one 26,715-byte gzipped request, an `ETag` for cheap revalidation, CORS
open, valid TLS, a named operator, and 24 documented methods with custom-parameter support. If the app needs a
fallback for a place it has no data for, this is the one. But its own terms disclaim accuracy, it is a computed
source, and it must never be labelled with an authority's name in the interface.

**Do not use:** `muslimsalat.com`, `api.pray.zone`, `prayertimes.api.abdus.dev` and `api.islamicfinder.us` are
all dead or unreachable (measured). Mawaqit is prohibited without written permission. RapidAPI resellers add a
key, a bill and a middleman to data available free upstream.

### The strongest non-API route to authoritative data

**Ship the authority's own published times inside the app, stored as an exact residual against a locally
computed baseline.** Concretely:

1. **Compute locally with `adhan`**, using each country's published parameters. This is the offline baseline and
   it needs no network ever. For Singapore this is already the complete answer, measured: every Model A constant
   is zero.
2. **For each country whose authority publishes its own timetable, fetch it once, difference it against that
   baseline, and ship the exact per-day residual.** Measured cost: **345 bytes brotli per city-year**, 20.7 KB
   for the whole 60-zone Malaysian federation, 337 KB for a thousand cities, which is 0.49% of the release
   bundle. The app then displays the authority's own digits, offline, with no API at all.
3. **Refresh the residual table with app releases, not from a live endpoint.** This turns a live dependency into
   a build-time one, which is exactly what the owner asked for. The yearly-fetch shape stays available as a
   fallback for places with no shipped data.
4. **Ship `@photostructure/tz-lookup`** (CC0-1.0, 88,029 B, 16/16 correct in testing) for coordinate-to-zone, and
   **ship a tz rules table** rather than trusting device tzdata, because a one-year-old database is wrong on 103
   days in Morocco.
5. **Ship one elevation integer per supported city**, 2 bytes each. It is the cheapest accuracy gain available
   and currently unexploited: 100 m is worth 2.06 minutes of sunset at London's latitude, which exceeds JAKIM's
   entire safety margin.
6. **Hold the no-synthesis line at exactness.** Ship the residual **exactly**, so the app reproduces the
   authority's published number to the minute. Do not ship Model A's constant offsets for display, however
   attractive six bytes per zone looks: they leave up to 2 minutes of error, which means printing times nobody
   published. Keep Model A as a drift check that never reaches the user.
7. **Start with the four countries where this is already achievable**: Singapore (open licence, zero
   correction), Malaysia (keyless year per zone, correction measured), Indonesia (via `myquran`, correction
   measured, provenance to confirm) and the UK (the existing `londonprayertimes.com` relationship). Then ask
   Diyanet, Saudi KACST, Brunei and UAE Awqaf for permission, because five conversations are cheaper than a
   licensing problem.

### The one thing to do before any of it

**Ask.** Every authority feed in this report served data without stating terms, and the report's position is
that this is not permission. Singapore is the only source that can be shipped today on its published licence.
Five emails, to JAKIM, Diyanet, KACST, Brunei KHEU and UAE Awqaf, plus one to MAWAQIT ASSO about the per-mosque
question, would convert most of the risk in this report into either a yes or a definite no. That is a better use
of a week than any amount of further measurement.

---

## 9. Sources

All fetched 2026-09-29 or 2026-09-30 from London.

**AlAdhan**
- `https://api.aladhan.com/v1/calendar/2026?latitude=51.5072&longitude=-0.1276&method=2` measured 200, 480,831 B
- `https://api.aladhan.com/v1/calendar/2026?...` with `--compressed` measured 200, 26,715 B
- `https://api.aladhan.com/v1/calendarByCity/2026?city=Jakarta&country=Indonesia&method=20` measured 200, 475,721 B
- `https://api.aladhan.com/v1/methods` measured 200, 3,554 B, 24 methods
- `https://api.aladhan.com/v1/calendar/2026?...&method=99&methodSettings=18,null,17` measured 200, custom method accepted
- `https://aladhan.com/credits-and-terms` the terms and the PrayTimes credit
- `https://aladhan.com/about` operator, Mamluk LLC, hosted on Bahriya
- `https://aladhan.com/consumers-api` the consumer list
- `https://aladhan.com/terms-and-conditions` measured **404**; the live path is `credits-and-terms`

**Mawaqit**
- `https://mawaqit.net/api/2.0/mosque/search?lat=51.5072&lon=-0.1276` measured 200, 9,543 B, 9 mosques, no key
- `https://mawaqit.net/api/2.0/mosque/search?lat=48.8566&lon=2.3522` measured 200, 9,922 B, 10 mosques
- `https://mawaqit.net/api/2.0/mosque/{uuid}/prayer-times` measured **401**
- `https://mawaqit.net/api/3.0/mosque/{uuid}/info` measured **401**
- `https://help.mawaqit.net/en/articles/11991838-can-i-use-your-api` "Our API is currently private"
- `https://github.com/sponsors/mawaqit` "Any commercial use is strictly prohibited"
- `https://mawaqit.net/en/legal-notice` the reproduction prohibition, updated 2026-03-24
- `https://raw.githubusercontent.com/mawaqit/mawaqit-py/main/mawaqit/consts.py` and `utils.py` the API surface
- `https://api.github.com/orgs/mawaqit/repos` 33 repositories, including `prayer-times` (LGPL-3.0)

**National authorities**
- `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=WLY01` measured 200, 77,257 B, 365 rows; also `SGR01`, `JHR02`, `PLS01`, `SBH01`
- `https://api-open.data.gov.sg/v1/public/api/datasets/d_a6a206cba471fe04b62dd886ef5eaf22/poll-download` measured 201, then the CSV at 200, **57,771 B, 1,096 rows**
- `https://data.gov.sg/open-data-licence` Singapore Open Data Licence 1.0
- `https://api.myquran.com/v2/sholat/jadwal/1301/2026/{1..12}` measured 200, 5,268 to 5,819 B each, 365 days total
- `https://api.myquran.com/v2/sholat/kota/semua` measured 200, 21,263 B, **518 cities**
- `https://bimasislam.kemenag.go.id/jadwalshalat` measured 200, 30,135 B; endpoints read from its inline JS
- `https://bimasislam.kemenag.go.id/ajax/getKabkoshalat` measured 200 with `{"status":"Illegal key"}`

**Other APIs**
- `https://ummahapi.com/api/prayer-times/month?lat=51.5072&lng=-0.1276&month=9&year=2026` measured 200, 14,013 B
- `https://ummahapi.com/api/prayer-times/methods` measured 200, 5,444 B
- `https://ummahapi.com/prayer-times-api` "Built on the Adhan library", 100 req/min
- `https://github.com/canbax/namaz-vakti-api` MIT, 33 req/15 min, "Thanks to adhan-js"
- `https://abdus.dev/projects/prayertimes/` the Diyanet wrapper's documentation
- `https://prayertimes.api.abdus.dev/api/diyanet/search?q=istanbul` measured **connect timeout after 75 s**
- `https://muslimsalat.com/london.json` measured **404**; `https://muslimsalat.com/` measured **404**
- `https://api.pray.zone/v2/times/this_year.json?city=london` measured **404**
- `https://api.islamicfinder.us/v1/prayer_times?...` measured **000**, no DNS resolution
- `https://api.pawan.krd/prayertimes?city=london` measured **401**
- `https://rapidapi.com/Yanga/api/prayer-times/pricing` Basic tier $0.00/mo, 500,000 req/mo
- `https://api.quran.com/api/v4/` measured 200, 1 B, no prayer data
- `https://api.sunnah.com/v1/collections` measured **403**, no prayer data

**Method and correction evidence**
- `https://journal.ump.edu.my/index.php/ijhtc/article/download/6226/2865` JAKIM's 2-minute `ihtiyati`
- `https://www.muftiwp.gov.my/ms/artikel/bayan-linnas/3858-bayan-linnas-khas-isu-tambahan-waktu-8-minit-bagi-permulaan-azan-subuh-dan-hukum-solat-subuh-sebelum-masuk-waktu` the additional 8 minutes on Fajr
- `https://www.e-solat.gov.my/portalassets/files/jurnal_falak_bil1_2015-ilovepdf-compressed.pdf` JAKIM's two-minute zone methodology
- `https://www.muwaqqit.com/` the one service exposing elevation and horizon elevation as inputs

**npm registry**, all measured 2026-09-30 from `https://registry.npmjs.org/{pkg}/latest`
- `@photostructure/tz-lookup` 11.7.0, CC0-1.0, 88,029 B; `tz-lookup` 6.1.25, 151,899 B; `geo-tz` 8.1.9, 74,179,650 B; `tzdata` 1.0.51, 427,235 B; `all-the-cities` 3.1.0, 6,416,347 B; `cities.json` 1.1.64, 19,569,679 B; `srtm-elevation` 2.1.2, 3,150,360 B; `geotiff` 3.0.5, 3,829,334 B; and the others tabulated in 6.2

**Prior art**
- `ai/features/moonsighting/notes/implementations.md` sections 0, 2, 2.11
- `ai/features/moonsighting/RESEARCH-FINDINGS.md` sections 2.4, 2.12, 2.16

**Sub-agent reports, this wave**
- `ai/features/global-prayer-times/data/apis/national-authorities.md`
- `ai/features/global-prayer-times/data/apis/bulk-datasets.md`

---

## 10. Files this report produced

| Path | What |
|---|---|
| `data/apis/measure.sh` | the one-endpoint measurement harness: status, size, latency, headers |
| `data/apis/fetch-years.sh` | polite yearly fetcher, 15 city-method years, 2 s apart |
| `data/apis/trust-compare.mjs` | section 3: API year against local `adhan` with the same stated method |
| `data/apis/correction-table.mjs` | section 5.2 and 5.3: authority year against a computed baseline, plus the encoding costs |
| `data/apis/correction-model.mjs` | section 5.3: the three correction models and what each leaves behind |
| `data/apis/measured-endpoints.md` | every endpoint called, with its measured status, size and latency |
| `data/apis/measurements/*.meta.json` | the raw `curl` timing and status record for each probe |
| `data/apis/results-trust.txt` | full output of `trust-compare.mjs` |
| `data/apis/results-correction.txt` | full output of `correction-table.mjs` |
| `data/apis/results-correction-model.txt` | full output of `correction-model.mjs` |
| `data/apis/national-authorities.md` | sub-agent: every national authority surveyed |
| `data/apis/bulk-datasets.md` | sub-agent: every bulk dataset and publishable timetable found |

Response bodies were not committed. They were measurement evidence, not data to keep, and the numbers taken from
them are in the report and in `measured-endpoints.md`. The working cache of fetched years lives in
`/tmp/athan-r4-trust/`, outside the repository, and `adhan` 4.4.6 was installed there rather than into the app.
