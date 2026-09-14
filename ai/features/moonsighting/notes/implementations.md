# Implementations of, and clients for, the moonsighting.com prayer-time method (excluding the npm `adhan` audit)

Researcher notes, 2026-09-14. Scope: every client of the moonsighting.com endpoint and every implementation
that claims Khalid Shaukat's Moonsighting Committee Worldwide method, other than the `adhan` package itself
(another researcher audits that; it appears here only as a comparison row).

Conventions:
- "Endpoint" means `moonsighting.ahmedbukhamsin.sa/time_json.php` unless stated.
- Every endpoint response is cached in `~/athan-research/endpoint/`. The metadata for each probe (exact
  request, status, headers, timings, fetch time) is in `~/athan-research/endpoint/probes/<name>.meta.json`
  and `.headers.txt`, and all probes are logged in `~/athan-research/impls/probe.log` (122 requests, all on
  2026-09-14 between 05:15 and 05:35 BST, at least 1.1 s apart).
- Sources are copied into `~/athan-research/src/<owner>-<repo>`, and npm tarballs are in
  `~/athan-research/impls/npm/<pkg>/package`.
- Times are local wall-clock `HH:MM`. A "diff" is implementation minus endpoint, in minutes.
- Nothing here is a prayer time for the app. No time was copied, averaged or invented. Each number comes from
  a cached response or from a script whose path is given.

---

## 0. Findings in one page

1. **The site's own timetable and the bukhamsin endpoint are the same computation.**
   - moonsighting.com's generator page `pray.php` loads `assets/js/apple_map.js`, which calls
     `praytable.php?year=&tz=&lat=&lon=&method=&both=&time=` (apple_map.js:276).
   - `praytable.php` HTML and bukhamsin `time_json.php` JSON agree to the minute on every cell of 16 full-year
     tables: London m0/m1/m2/m3, Oslo m0/m1/m2, Tromsø m0/m1/m2, Chicago, Reykjavik, Longyearbyen, Sydney.
     They also agree on where the `-----` dashes fall (§3.1).
   - The page credits "Developed by Ahmed Bu-khamsin" and "Original code by PrayTimes.org" (pray.php:117-118).
   - The bukhamsin host is his: GitHub commits by Ahmed Bukhamsin, on his personal `.sa` domain.
2. **`www.moonsighting.com/time_json.php` is broken, and not because of a request detail.**
   - Every GET with parameters returns HTTP 500 with a 0-byte body. That held for 13 variants, including
     `both` 0/1/true, `time=1`, `year=2025`, a Referer plus browser User-Agent, a trailing slash, the no-www
     host and the README's own example URL.
   - Without parameters, or as a POST, it returns 200 with a single `\n`. So the script runs and fails once it
     reads parameters. The root cause is UNVERIFIED because the body is empty.
   - `praytable.php` on the same host works.
3. **The published generator does not follow the written high-latitude rules.** A rules model reproduces it
   within ±1 minute on every day of 2026 in London, Oslo, Reykjavik, Chicago and Karachi.
   - It follows how-we.html for: Dhuhr = noon + 5; Maghrib = sunset + 3; seasonal Fajr/Isha bounded by the
     18° time; the 1/7-of-night bound above 55°.
   - It does **not** follow how-we.html's "above 60° slide down to 60° in summer". Reykjavik (64.1°) gets 1/7
     at its own latitude on all 365 days.
   - It does **not** follow faq_pt.html 1.2's "decrease the latitude by 0.1 degrees until the sun sets".
     Instead:
     - In polar night, Fajr/Isha are the plain 18° times and Sunrise/Maghrib are `-----`.
     - In midnight sun, Fajr, Sunrise, Maghrib and Isha are all `-----`: Tromsø 69 days, Longyearbyen 128.
   - Details are in §2.9.
   - **The southern hemisphere behaves the same** (§2.7b). Ushuaia, Cape Horn (56°S), Palmer (64.8°S) and
     Rothera (67.6°S) fit the same model within ±1 minute, with 1/7 deciding 133-175 days a year.
   - At McMurdo (77.8°S) the polar edge breaks the model. Fajr and Isha print as the same after-midnight time
     for days (Mar 31-Apr 04, Sep 08-12), and Isha runs 30-105 min off beside those runs.
4. **New endpoint defect: DST applied one day early east of UTC.**
   - On the day before a DST transition, all six fields are shifted by one hour. This happens whenever the
     transition instant falls before 01:00 UTC of the next day.
   - Measured wrong: Sydney (Apr 4, Oct 3), Auckland (Apr 4, Sep 26), Beirut (Mar 28, Oct 24), Cairo (Apr 23,
     Oct 29), Jerusalem (Mar 26, Oct 24), Adelaide (Apr 4, Oct 3, a half-hour zone) and McMurdo (Apr 4,
     Sep 26). McMurdo was predicted before fetching.
   - Measured correct: London, Oslo, Chicago, Santiago.
   - The site's `praytable.php` has the same defect, since its Sydney table is identical. See §2.10.
5. **Every published copy of the seasonal functions has the same coefficients.** They match Shaukat's booklet
   §11 (booklet-fajr-isha.pdf pp. 24-25), transcribed in §4.1.
   - PHP family (the same file with namespaces changed): islamic-network/prayer-times-moonsighting (the
     original, Meezaan-ud-Din for AlAdhan, now hosted at 1x.ax), kskhan77, mawaqit, muballighapp, adamarnap.
   - Independent implementations: pray-calc, RagibHasin/adhaan, sniper1720/mawaqit (Rust), arahmancsd (C#),
     Musallah, and adhan with its forks.
   - Musallah has a typo in the abyad coefficient: `45.1` for `81.84` (prayerCalc.ts:220).
6. **The islamic-network family, and what depends on it, applies only the seasonal function.** It has no 18°
   bound, no 1/7 rule, no +5 Dhuhr and no +3 Maghrib (PrayerTimes.php:281-296). That covers AlAdhan method 15,
   @praytime/core, pray-calc's MSC and the four PHP copies.
   - They match the endpoint's Fajr/Isha at London to ±1.
   - Dhuhr is 5 early and Maghrib 3 early everywhere.
   - At Oslo on 21 June, Fajr is 83 minutes early and Isha 37 late.
   - Above the polar circle they emit clamped nonsense (Tromsø 21 Dec: Fajr 09:51, Sunrise = Dhuhr =
     Maghrib 11:42).
7. **adhan and its forks sit closest to the endpoint** (adhan-extended, namaz, @calgiellc/azan):
   - London is exact on all five fields for all four dates.
   - Oslo is exact except one −1.
   - Tromsø polar dates give Invalid Date, where the endpoint gives 18° times in December.
8. **Several packages that advertise "Moonsighting Committee" do not implement it.**
   - Plain 18°/18° angles: libmuslim (C), @islam-kit/prayer-times, @misque/prayer-times (also broken
     outright), salat-first (no equation of time, host-clock output) and masjiduna-waqt's
     `computePrayerTimes`. masjiduna's seasonal functions are exported but never called; when the angle is
     unreachable it uses middle of night, so London on 21 Jun reads −101/+140.
   - salahapi-php silently computes MWL. piazan's MOONSIGHTING has Fajr/Isha angles of 0, so it returns about
     sunrise and sunset.
   - @masaajid/prayer-times implements the seasonal rules but puts **Abyad coefficients on its General Isha
     path** (London 21 Jun Isha +70). Its seasonal times also depend on the input's UTC time of day, so every
     call that is not exactly at 00:00 UTC, including the default `new Date()`, throws. The earlier "throws
     12 of 12" run passed the date inside the config object, where it is ignored (corrected in §4.12).
   - Among adhan wrappers, @tawfeeqmartin/fajr adds up-rounding and automatic registry elevation
     (London: Sunrise −1/−2, Maghrib +1/+2).
   - @calgiellc/azan's `main` points to `Azan.js` while the file is `azan.js`, which resolves only on
     case-insensitive filesystems. adhan-extended, namaz and calgiellc lack adhan 4.4.6's International Date
     Line guard.
   - masjiduna-waqt's preinstall hook downloads an unchecksummed native binary whenever Bun is installed.
9. **No other moonsighting body is implemented under this name.** Every implementation that does anything
   seasonal traces to Shaukat's booklet or to adhan's copy of it. The only other bodies seen are metadata:
   moonsighting.pk in @fehu-zone and a "UK Moonsighting Committee" label in @masaajid's README. See §7.
10. **A worldwide v2.0 cannot depend on the endpoint directly as it stands.** It is a single-person host with no
   terms of use, no SLA, no Wayback history, no single-day parameter, and PHP errors served as HTTP 200. It also
   has the DST defect and dashes at high latitude. It is still the only public way to get the site's own
   numbers. See §2.11.
11. **Judged globally, for the v2.0 plan where moonsighting is the only worldwide source.**
    - **Timezones.** Across 26 measured IANA zones (27 cities), Dhuhr shows noon + 5 with a residual of 0/−1 on every correct day,
      so the astronomy is sound everywhere. That includes half-hour and 45-minute offsets, +14/−11 and
      Morocco's Ramadan switches.
    - **Two zone faults.** (a) The day-early DST day, in every zone whose transition falls before 01:00 UTC of
      the next day (Australia, New Zealand and Antarctica/McMurdo, the Levant, Egypt). (b) The server's
      timezonedb version, which is invisible to clients: Casablanca after 2026-09-20 follows the older rule
      (§2.10b).
    - **Latitudes.** Up to about 66° in both hemispheres, the output is rule-consistent to ±1 min. Inside the
      polar circles it serves dashes, evening values after midnight with no day marker, and at 78°
      unexplained Fajr = Isha runs.
    - **Host and parameters.** The only working JSON host is `moonsighting.ahmedbukhamsin.sa/time_json.php`,
      with `year`, `tz` (IANA), `lat`, `lon`, `method`, `both` and `time` all present. Omitting `both` or
      `time` corrupts the JSON. m0 is Shafaq General with Hanafi Asr in `asr`; m2 is Ahmer with Shafi Asr.
    - **Implementations.** None of them reproduces the endpoint everywhere. adhan and its faithful copies
      (adhan-extended, namaz apart from Dhuhr +1, calgiellc) are closest: exact below 55° and within 1 min at
      Oslo. They differ in polar cases (Invalid Date against the endpoint's 18° times) and on DST days, where
      they are right and the endpoint is wrong.

---

## 1. PrayerTimeResearch/PrayerTimeAPI

Source: `~/athan-research/src/PrayerTimeAPI` (opensrc copy, without `.git`). Metadata comes from the GitHub API,
2026-09-14.

| Item | Value |
|---|---|
| Owner | GitHub org `PrayerTimeResearch`, created 2018-04-13, 1 public repo. Description: "This project has results of research for calculating Muslim Prayer Times for any place on the globe" |
| Authors | Ahmed Bukhamsin: `ahmed.bukhamsin@five-tech.com` (2020 commits), `ambu50@gmail.com` (2024-25). Contributors `ambu50` (10 commits) and `abukhams` (9) |
| Repo | created 2020-04-23; last push 2025-02-12; Apache-2.0 (`LICENSE`); 34 stars, 2 forks |
| Commit history | first commits 2020-04-23; `7739eae` 2020-04-24 "update the server name"; `1bd4fe1`/`0a8cfc7` 2024-10-31; `5c77419` 2025-02-12 "corrects the expected returned data type"; `eb4ea07` 2025-02-12 "revirt back the changes" |
| Demo | https://prayertimeresearch.github.io/PrayerTimeAPI/ returns HTTP 200 (fetched 2026-09-14, `last-modified: Wed, 12 Feb 2025 07:53:43 GMT`) and loads `main-es2015.cffaf914efc3e22bb648.js`. Cached at `endpoint/prayertimeresearch.github.io_demo.html` |

**Where the host moved.** From the commit patches (GitHub API):
- `7739eae` (2020-04-24) changed `url_prefix` from `https://www.five-tech.com/ambu50/moonsigting-adaptive/time_json.php?`
  to `https://www.moonsighting.com/time_json.php?`. The API began on the author's employer's host.
- `1bd4fe1` (2024-10-31) added to the README "Or if above doesn't work:
  https://moonsighting.ahmedbukhamsin.sa/time_json.php?...".
- `0a8cfc7` (2024-10-31) commented out the www line and switched the app to bukhamsin.
- Inference: the www endpoint was unreliable by October 2024. UNVERIFIED, because Wayback has no captures of
  it (§2.11).

**The request.** From `src/app/app.component.ts`:
- Lines 39-40: `url_prefix = "https://moonsighting.ahmedbukhamsin.sa/time_json.php?"`, then
  `year=${this.year}&tz=${this.tz}&lat=${this.lat}&lon=${this.lng}&method=${this.method}&both=${this.both}&time=${this.format}`.
- Defaults (lines 16-23): `year` is the current year; `tz` is `Intl.DateTimeFormat().resolvedOptions().timeZone`;
  lat/lng 21.42664/39.82563 ("default to Makkah"), replaced by `navigator.geolocation` if granted (lines 29-34);
  `method = "0"`; `both = false`, a JS boolean, so the string sent is `false`/`true`; `format = "0"`.
- The whole year comes back in one call (line 42), and `data.times` goes straight to a Material table.

**Parameter semantics.**
- `both`: the README (line 20) says "0 or 1". The code sends `true`/`false`. The server ignores it for the
  output (§2.6).
- The client uses `both` only for columns: lines 47-51 show `asr_s` and `asr_h` when
  `query.both == "true" && query.method < 3`, otherwise `asr`. Sending `both=1` would never show the two Asr
  columns in this client, because it compares with the string `"true"`.
- Method labels:
  - README lines 26-29: 0 "Hanafi general", 1 "Hanafi Shafag Abyad", 2 "Shafi Shafag Ahmar", 3 "Shia Jafari".
  - app.component.html lines 20-23: "Hanafi (Shafaq General)", "Hanafi (Shafaq Abyad)", "Shafi'im Maliki,
    Hanbali", "Jafari (Ithna Ashari)".
  - pray.php's own `<select>` uses the same four labels.
- `time`: 0 is 24-hour, 1 is 12-hour (README line 21).

**Rendering.** `app.component.html` lines 39-77 is a `mat-table` with columns day, fajr, sunrise, dhuhr,
asr_s/asr_h or asr, maghrib, isha. The strings are printed verbatim, trailing spaces included.

**Environments and deploy.**
- `src/environments/environment*.ts` hold only `production: true|false`.
- `HOW_TO_DEPLOY.sh` is 4 lines: `npm run deploy`, `git commit -a -m ""`, `git push`.
- `package.json` `build`: `ng build --configuration production --base-href=/PrayerTimeAPI/`.

**The built bundle** (`docs/main-es2015.cffaf914efc3e22bb648.js`, `docs/main-es5.*`):
- The only non-framework URL is `https://moonsighting.ahmedbukhamsin.sa/time_json.php?`.
- The bundle carries the same `make()` logic as the source (`"true"==n.both&&n.method<3`).
- No hidden host; `docs/index.html` loads only Google Fonts besides the bundles.

---

## 2. The endpoint, measured

### 2.1 Hosts and who operates them

| Host | Stack evidence | Operator evidence |
|---|---|---|
| `www.moonsighting.com` | `server: cloudflare`, `x-turbo-charged-by: LiteSpeed`, `cf-cache-status: DYNAMIC`, `access-control-allow-origin: *` (probes/www.moonsighting.com_london_2026_m0_hdr.headers.txt). A 104.21.90.227 / 172.67.162.51; NS adel/ian.ns.cloudflare.com. TLS CN=moonsighting.com, Google Trust Services WE1, 2026-09-01 to 2026-11-30 | Khalid Shaukat's site; pray.php credits Bu-khamsin as developer |
| `moonsighting.ahmedbukhamsin.sa` | Cloudflare edge (A 172.67.162.55, 104.21.90.231; NS princess/ricardo.ns.cloudflare.com). JSON responses: `x-powered-by: PHP/8.2.27`. Root `/` returns 403 `Apache/2.4.62 (Debian) Server at moonsighting.ahmedbukhamsin.sa Port 80` with `x-cloud-trace-context`, which suggests a Google Cloud origin (inference). PHP errors disclose `/var/www/html/time_json.php`. TLS CN=ahmedbukhamsin.sa, SAN `*.ahmedbukhamsin.sa`, GTS WE1, 2026-08-13 to 2026-11-11 (`impls/tls_bukhamsin.txt`) | `whois -h whois.nic.sa ahmedbukhamsin.sa` shows only the name servers and "DNSSEC: unsigned"; no registrant is published (`impls/whois_ahmedbukhamsin_sa.txt`). The domain name and GitHub authorship point to Ahmed Bu-khamsin |

**Mirror or proxy.** It is a separate deployment, not a proxy of www:
- The server stacks differ: LiteSpeed on www, Apache with PHP 8.2 on bukhamsin.
- www `time_json.php` returns 500 while bukhamsin answers.
- The output is minute-identical to www `praytable.php`.

Conclusion: the same PHP computation is deployed twice. The bukhamsin copy's source is not public (UNVERIFIED
whether it is literally the same file).

### 2.2 The site's own generator (the "published tables")

- The menu entry "Prayer Times" points to `pray.php` (moonsightingmenu.js:129).
- "API Prayer Times for Programmers" points to github.com/PrayerTimeResearch/PrayerTimeAPI
  (moonsightingmenu.js:132).
- pray.php:116-118: "Calculation method by moonsighting.com", "Developed by Ahmed Bu-khamsin" (twitter.com/techi50),
  "Original code by PrayTimes.org". It also links the Sky Prayers apps (com.techiapps.skyprayers, iOS
  id439409680), which were not examined.
- `assets/js/apple_map.js` (header "This is the new file 01/08/2022"), function `loadXMLDoc()` lines 241-278:
  `xmlhttp.open("GET", url + "praytable.php?year=" + year + "&tz=" + timezoneID + "&lat=" + lat + "&lon=" + lon + "&method=" + method + "&both=" + both + "&time=" + time, true)`
  (line 276), relative to the page. `both` is the checkbox value `"true"` or the string `"false"`
  (lines 252-255). The crawler's 404 for `assets/js/praytable.php` came from resolving that relative path
  wrongly.
- how-we.html (updated March 1, 2024), lines 115-117: "Moonsighting.com method for prayer times is used by the
  following resources: 1. https://github.com/PrayerTimeResearch/PrayerTimeAPI 2.
  https://github.com/islamic-network/prayer-times-moonsighting".

### 2.3 Why www `time_json.php` returns 500

All probes 2026-09-14; bodies in `endpoint/www.moonsighting.com_*`.

| Variant | Status | Body |
|---|---|---|
| base `year=2026&tz=Europe/London&lat=51.5072&lon=-0.1276&method=0&both=false&time=0` | 500 | 0 B |
| `both=0`, `both=1`, `both=true`, `time=1`, both+time omitted | 500 each | 0 B |
| `year=2025` | 500 | 0 B |
| Referer `https://www.moonsighting.com/pray.php` + Safari User-Agent | 500 | 0 B |
| `/time_json.php/?...` | 500 | 0 B |
| `https://moonsighting.com/time_json.php?...` (no www) | 500 | 0 B |
| README example `year=2020&tz=Asia/Riyadh&lat=26.574848&lon=50.0105216&...` | 500 | 0 B |
| `http://www...` | 301 to https | - |
| no query string | 200 | 1 B (`0a`) |
| POST, parameters in body, no query | 200 | 1 B (`0a`) |
| `praytable.php` no query | 200 | 25 B `</tbody>\n</table>\n</div>\n` |
| `praytable.php` with the base query | 200 | 61,567 B, 365 rows |

Reading: the PHP file exists and runs. It fails (fatal error, `display_errors` off) only once GET parameters are
present, and the working `praytable.php` has the same parameter set. The cause is UNVERIFIED. It is probably the
JSON-emitting branch on this host, not the calculation, since praytable computes the same numbers.

### 2.4 Headers, CORS, caching, latency (bukhamsin)

- JSON responses carry:
  - `content-type: application/json`
  - `access-control-allow-origin: *`
  - `cache-control: public, max-age=300, s-maxage=600`
  - `cf-cache-status: DYNAMIC` (Cloudflare does not cache it)
  - `x-powered-by: PHP/8.2.27`
  - No `ETag`, no `Last-Modified`, no rate-limit headers.
- An `OPTIONS` request with an `Origin` header returns 200 with the full JSON body. There is no
  `Access-Control-Allow-Methods`, but a simple GET needs no preflight.
- Latency, London m0 full year, 3 samples from London:

  | Sample | connect | TLS | TTFB | total |
  |---|---|---|---|---|
  | 1 | 0.019 s | 0.049 s | 0.299 s | 0.616 s |
  | 2 | 0.038 s | 0.068 s | 0.359 s | 0.668 s |
  | 3 | 0.020 s | 0.045 s | 0.273 s | 0.482 s |

  Body 141,128 B (probes/…_latency{1,2,3}.meta.json).
- No throttling was seen in about 60 requests at 1.1 s spacing. Rate limits are UNVERIFIED; they were not stress-tested.
- Later data point, 2026-09-14 17:05-17:06 BST: four more full-year requests (§2.7b), all HTTP 200 in 0.60-0.83 s,
  about 12 hours after the first probes. That makes two observation windows on the same day with no failures.
  It is not an uptime record.

### 2.5 Response shape

```
{"query":{"latitude":"51.5072","longitude":"-0.1276","timeZone":"Europe\/London","method":"0","year":"2026","both":"false","time":"0"},
 "times":[{"day":"Jan 01 Thu","times":{"fajr":"06:25   ","sunrise":"08:06   ","dhuhr":"12:09   ","asr":"14:16   ","asr_s":"13:46   ","asr_h":"14:16   ","maghrib":"16:05   ","isha":"17:39   "}}, ...]}
```

- The `query` block echoes every parameter as a string, or `null` when missing.
- Valid times are `HH:MM` plus three spaces. Unavailable times are `-----` with no trailing spaces.
- `day` is `Mon DD Ddd`, with no year and no ISO date.
- Entries run in calendar order from Jan 01: 365 entries, or 366 in a leap year (§2.6).

### 2.6 Parameters and edge behaviour (bukhamsin; files `moonsighting.ahmedbukhamsin.sa_london_*`)

| Probe | Result |
|---|---|
| `both=true` / `1` / `0` / `false` | 365 days identical to the base; `both` is only echoed; `asr_s` and `asr_h` are always present |
| `time=1` | every field in 12-hour form without the padding: `"06:25 am"`, `"02:16 pm"` |
| `both` and `time` omitted | HTML `Warning: Undefined array key "both" in /var/www/html/time_json.php on line 10` (and `"time"` line 11) **prepended to the JSON**, so the body does not parse |
| `method=1` | Isha Abyad (London 21 Jun 23:52); Asr Hanafi |
| `method=2` | Isha Ahmer (21 Jun 22:41); `asr` = Shafi (`asr_s`) |
| `method=3` (Jafari) | `asr` = Jafari (21 Jun 16:26); **`asr_s: -1, asr_h: -1` as JSON numbers**; Maghrib = sunset + 17 (21:39); Isha 22:41 |
| `method=9` | `Warning: Undefined variable $prayTime … line 67` + `Fatal error: Uncaught Error: Call to a member function setTimeFormat() on null … line 67`, **HTTP 200 application/json** |
| `tz=Invalid/Zone` | `Fatal error: Uncaught Exception: DateTimeZone::__construct(): Unknown or bad timezone (Invalid/Zone) in /var/www/html/time_json.php:70`, HTTP 200 |
| `tz` omitted | warning line 5 + deprecation + the same fatal error, HTTP 200 |
| `lat=95` | accepted; 365 days of garbage with many `-----` (Jan 01 Fajr 00:10, Isha 23:32) |
| `lon=200` | accepted; every time shifted (Jan 01 Fajr 17:05) |
| `lat` and `lon` omitted | two warnings (lines 8, 9) and nothing else (222 B) |
| `year` omitted | warning line 7, then valid JSON with `"year":null,"times":[]` |
| `year=1900`, `2014`, `2027`, `2100` | served, with correct weekday labels (1900 Jan 01 Mon, 2014 Wed, 2027 Fri, 2100 Fri) |
| `year=2028` | 366 entries including `Feb 29 Tue` |
| extra `date=2026-06-21&month=6&day=21` | ignored; 365 days identical. **There is no single-day or month parameter** |
| `praytable.php`, bad tz | 404 B: the header "the timezone is Invalid/Zone" and an empty table |
| `praytable.php`, no lat/lon | 25 B closing tags |

The warning line numbers outline the script: parameters are read at lines 5-11; a `$prayTime` object is chosen
per method, and anything other than 0-3 leaves it undefined; `setTimeFormat` is at line 67;
`new DateTimeZone` at line 70. This is consistent with a PHP port of PrayTimes.org, as pray.php's credit says.
Inference only.

**Cross-check against islamic-network's own test.** The endpoint's London `year=2014` output for 24 April gives
Fajr 04:04 and Isha 21:21. islamic-network's `TimingsMoonSightingTest.php` expects exactly those two values for
2014-04-24 at 51.508515,-0.1254872. The endpoint's Dhuhr is 13:04 and Maghrib 20:15, where that test expects
12:59 and 20:12.

### 2.7 High latitude: exact strings (bukhamsin 2026; the same in praytable.php, §3.1)

Script: `impls/highlat_strings.txt`, produced inline (runs of non-`HH:MM` values).
- Tromsø 69.6492,18.9553 Europe/Oslo. Identical runs for m0, m1 and m2.
  - `fajr` and `isha` are `-----` May 18 to Jul 25 (69 days).
  - `sunrise` is `-----` Jan 01 to Jan 14 (14 d), May 18 to Jul 25 (69 d) and Nov 28 to Dec 31 (34 d).
  - `maghrib` is `-----` Jan 01 to Jan 14, May 18 to Jul 25, and **Nov 27** to Dec 31 (35 d). On Nov 27 sunrise
    exists but maghrib does not.
  - `dhuhr`, `asr`, `asr_s` and `asr_h` always hold times.
  - 21 Jun: `{"fajr":"-----","sunrise":"-----","dhuhr":"12:51   ","asr":"19:30   ",…,"maghrib":"-----","isha":"-----"}`.
  - 21 Dec: `{"fajr":"06:28   ","sunrise":"-----","dhuhr":"11:47   ","asr":"12:28   ",…,"maghrib":"-----","isha":"16:56   "}`.
    Polar night still gives Fajr and Isha, which are the 18° times (§2.9).
  - Ten evening values are printed after midnight with no day marker. Examples: May 15 isha `00:02`; May 16
    maghrib `00:02` and isha `00:12`; Jul 28 isha `00:07`.
- Longyearbyen 78.2232,15.6267 Arctic/Longyearbyen.
  - `fajr` is `-----` Apr 19 to Aug 24 (128 d) and `isha` Apr 18 to Aug 23 (128 d).
  - `sunrise` is `-----` Jan 01 to Feb 15, Apr 19 to Aug 24 and Oct 27 to Dec 31; `maghrib` Jan 01 to Feb 14,
    Apr 18 to Aug 23 and Oct 27 to Dec 31.
  - **Apr 18 `fajr` is `23:36`**: the previous evening, printed as a clock time on the wrong side of midnight.
  - Twenty Isha values fall after 00:00 (Mar 05 `00:11` through Oct 08 `00:43`).
- Reykjavik 64.1466,-21.9426 Atlantic/Reykjavik: never a dash. 64 evening values fall after midnight
  (May 31 isha `00:01` through Jul 15). On 21 Jun: fajr `02:31`, sunrise `02:55`, maghrib `00:07`, isha `00:28`.
- Across all fields and cities: no empty strings, no value of 24:00 or more, and no other sentinel. The only
  forms are `"HH:MM   "` and `"-----"`, plus the numeric `-1` for `asr_s`/`asr_h` under method 3.

### 2.7b Southern high latitudes beyond −55° (coordinator request; `impls/south_analysis.py`, `.txt`)

Four new cached requests on 2026-09-14 (`probe.py south`, 17:05-17:06 BST, all HTTP 200, 139-141 KB,
0.60-0.83 s): Cape Horn −55.9833,−67.2667 America/Punta_Arenas; Palmer Station −64.7743,−64.0531
Antarctica/Palmer; Rothera −67.5695,−68.1270 Antarctica/Rothera; McMurdo −77.8419,166.6863 Antarctica/McMurdo.
Ushuaia (−54.80, already cached) is the control just north of 55°S.

| City | Dashes (`-----`) | Evening values after 00:00 | Rules model E (§2.9), endpoint − model | 1/7 decides (model) |
|---|---|---|---|---|
| Ushuaia −54.8 | none | none | all 365 days within ±1 on every field | 0 days (below 55°) |
| Cape Horn −56.0 | none | none | all within ±1 | 165 days (Jan 01-Mar 13, Sep 30-Dec 31) |
| Palmer −64.8 | none | 57 (Jan 01 maghrib `00:00` … Dec 31 isha `00:22`) | all within ±1 | 175 days |
| Rothera −67.6 | 202 cells | 49 | all within ±1 except one edge day each for maghrib and isha | 133 days |
| McMurdo −77.8 | 708 cells | 33 | **61 cells off by >1 min**, see below | 62 days |

Readings:
- **The southern hemisphere follows the same rules as the northern:** Dhuhr = noon + 5 (residual 0/−1),
  Maghrib = sunset + 3, seasonal functions with DYY from 21 June, the 18° bound, and the 1/7 bound at
  |lat| > 55. The 1/7 bound is used at the station's own latitude: Palmer (64.8°S) gets no slide to 60°, the
  same as Reykjavik (§2.9).
- **Rothera (polar circle).** Polar night Jun 14-27 gives `sunrise`/`maghrib` `-----` while Fajr/Isha stay
  the plain 18° times (21 Jun `fajr=08:13 … isha=18:56`). Midnight sun Nov 30-Jan 11/12 gives all four
  `-----`. Edge rows print evening times after midnight with no day marker: Jan 12 `maghrib=01:24 isha=02:34`
  while Fajr and Sunrise are still dashes; Nov 29 `fajr=01:38 sunrise=01:42 … maghrib=01:19 isha=01:20`.
- **McMurdo, new polar-edge anomaly (not explained by the model, mechanism UNVERIFIED):**
  - For several days before polar night begins and after it ends, **Fajr and Isha are printed as the same
    clock time after midnight**: Mar 31 `fajr=01:56 … isha=01:56`, Apr 01-03 `01:55`/`01:55`, Apr 04
    `00:54`/`00:54` (also the DST day), Sep 08 `fajr=01:04 isha=00:53`, Sep 09-12 `00:53`, `00:52`,
    `00:52`, `00:52`. The model gives Fajr about 07:13 and Isha about 20:16 on Mar 31. The equal values look
    like a middle-of-night fallback, which is PrayTimes.org's default high-latitude adjustment (inference).
  - Next to those runs, Isha is 30-105 min later than the model (Mar 26-30, Apr 05-07, Apr 22-24,
    Aug 19-21, Sep 05-18) and Fajr is 13-88 min earlier on some days (Apr 24 `fajr=08:48` against 10:16).
  - Dash transitions leave impossible orderings: Feb 19 `fajr=----- sunrise=----- … maghrib=01:44
    isha=02:48`; Oct 23 `fajr=00:07 sunrise=02:03 … maghrib=----- isha=-----`.
  - The earlier Longyearbyen (Feb 16-Mar 1) and Tromsø (Nov 27) edge misfits (§8 item 4) are the same class,
    now shown to reach hours at 78°.
- **McMurdo DST, predicted and confirmed.** Antarctica/McMurdo follows New Zealand: tzdata transitions
  2026-04-04 14:00 UTC and 2026-09-26 14:00 UTC. The endpoint is one day early on **Apr 04** (served +12, tzdata
  +13) and **Sep 26** (served +13, tzdata +12), exactly as for Auckland (§2.10). Palmer, Rothera, Cape Horn and
  Ushuaia have no 2026 transitions and no offset mismatches.
- **For v2.0:** below about 66° in both hemispheres the endpoint is rule-consistent to ±1 min. Inside the
  polar circles it serves dashes, after-midnight evening values without a day marker, and at 78° days with
  Fajr = Isha after midnight. A client needs an explicit policy for each of these, and none of the published
  rules describes them.

### 2.8 The www host versus the bukhamsin host
Covered in §2.1 and §2.3: the www JSON returns nothing to diff. Its `praytable.php` equals bukhamsin, §3.1.

### 2.9 Which rules the generator actually applies (rules model)

Script: `impls/rules_model.py`. Output: `impls/rules_model.txt` and `impls/rules_model.json`.
- **This is a hypothesis test, not a source of times.**
- Model components:
  - Sun positions: a PrayTimes.org v2.3 one-pass calculation, with an out-of-range cosine treated as
    "undefined" instead of clamped.
  - Offset: the tz offset at local noon.
  - MIN: the booklet functions with calendar DYY.
  - Dhuhr = noon + 5; Maghrib = sunset + 3.
  - Fajr = later of (sunrise − MIN, 18° Fajr when reachable); Isha = earlier of (sunset + MIN, 18° Isha).
  - If |lat| > threshold: Fajr = later of (Fajr, sunrise − night/7); Isha = earlier of (Isha, sunset + night/7),
    with night = 24 h − (sunset − sunrise).
  - Polar variants as listed in the table.

| Variant | Result against every 2026 day, fields fajr/sunrise/dhuhr/maghrib/isha, m0/m1/m2 |
|---|---|
| **E: threshold 55°, 18° bound, polar = 18° time if reachable else dash** | London, Oslo, Reykjavik, Chicago, Karachi: **every day within ±1 on every field**. Tromsø: 1 mismatch (Nov 27 fajr, the polar-night edge). Longyearbyen: 58-88 mismatches, all on polar-edge days (Feb 16 to Mar 1 and similar). Sydney: 10 = the two early-DST days × 5 fields (§2.10) |
| A: as E but polar = step latitude 0.1° toward the equator (faq_pt 1.2) | Tromsø 98 and Longyearbyen 288-314 mismatches (e.g. Tromsø Jan 01 endpoint fajr 06:29 against model 09:37). **Rejected** |
| B: no 18° bound | Karachi fajr exact on 0 of 365 days (520 mismatches); Sydney 305. **Rejected**: the 18° bound is real |
| C: 1/7 bound from 48.5° | London 234-321 mismatches. **Rejected**: the threshold lies between 51.5° and 59.9°, consistent with the documented 55° |
| slide to 60° above 60° (how-we.html) | Not needed. Reykjavik (64.1°) matches 1/7 at its **own** latitude on 365/365 days, and Tromsø midnight sun is dashed, not slid |

So the generator implements the ≤55° and 55-60° rules as written, and **extends the 55-60° rule unchanged above
60°**. It does not implement how-we.html's "at latitudes more than 60degrees, we slide down to 60degrees and
calculate Fajr & Isha using the rule of Sab'u Lail in summer". It does not implement the booklet's §12 "if day
length is more than 18 hours or less than 6 hours, then we slide down to 60°". It does not implement faq_pt.html
1.2's 0.1° iteration. Whether Sky Prayers or another moonsighting.com product implements those is UNVERIFIED.

The earlier `impls/compare_port_endpoint.py` (islamic-network port against the endpoint, all days) makes the
same point from the other side:
- London m0: Fajr exact on 272 days and ±1 on 91; Isha exact on 263 and ±1 on 100.
- Dhuhr = port + 5 on 357 days; Maghrib = port sunset + 3 on 363.
- The remaining ±60 values are a DST artefact of the port, which mirrors the PHP's use of the midnight offset.
- Oslo: summer divergence up to Fajr +83 and Isha −37, which is the 1/7 bound.

### 2.10 DST applied one day early (lead's request; `impls/dst_transitions.txt`)

- Transition instants: Python 3 `zoneinfo` (IANA tzdata on this Mac).
- Endpoint: m0 caches `moonsighting.ahmedbukhamsin.sa_{sydney,auckland,beirut,cairo,jerusalem,santiago,london,chicago,oslo}_2026_m0.json`.
- "Dhuhr jump" is the day on which Dhuhr changes by about 60 minutes from the day before.

| Zone | tzdata transition (UTC) | Endpoint jump day | Correct first day | Verdict |
|---|---|---|---|---|
| Australia/Sydney | 2026-04-04 16:00 | Apr 04 (−61) | Apr 05 | 1 day early |
| Australia/Sydney | 2026-10-03 16:00 | Oct 03 (+59) | Oct 04 | 1 day early |
| Pacific/Auckland | 2026-04-04 14:00 | Apr 04 (−60) | Apr 05 | 1 day early (predicted from Sydney before fetching, then observed) |
| Pacific/Auckland | 2026-09-26 14:00 | Sep 26 (+59) | Sep 27 | 1 day early |
| Asia/Beirut | 2026-03-28 22:00 | Mar 28 (+60) | Mar 29 | 1 day early |
| Asia/Beirut | 2026-10-24 21:00 | Oct 24 (−60) | Oct 25 | 1 day early |
| Africa/Cairo | 2026-04-23 22:00 | Apr 23 (+59) | Apr 24 | 1 day early |
| Africa/Cairo | 2026-10-29 21:00 | Oct 29 (−60) | Oct 30 | 1 day early |
| Asia/Jerusalem | **2026-03-27 00:00** | Mar 26 (+60) | Mar 27 | 1 day early (transition exactly at 00:00 UTC) |
| Asia/Jerusalem | 2026-10-24 23:00 | Oct 24 (−60) | Oct 25 | 1 day early |
| America/Santiago | 2026-04-05 03:00 | Apr 05 (−61) | Apr 05 | correct |
| America/Santiago | 2026-09-06 04:00 | Sep 06 (+60) | Sep 06 | correct |
| Antarctica/McMurdo (added 2026-09-14, §2.7b) | 2026-04-04 14:00 | Apr 04 (served +12) | Apr 05 | 1 day early (predicted from Auckland before fetching, then observed) |
| Antarctica/McMurdo | 2026-09-26 14:00 | Sep 26 (served +13) | Sep 27 | 1 day early |
| Europe/London | 2026-03-29 01:00 / 2026-10-25 01:00 | Mar 29 / Oct 25 | same | correct |
| Europe/Oslo | 2026-03-29 01:00 / 2026-10-25 01:00 | Mar 29 / Oct 25 | same | correct |
| America/Chicago | 2026-03-08 08:00 / 2026-11-01 07:00 | Mar 08 / Nov 01 | same | correct |

**Mechanism, bounded by measurement.** Each date's offset is sampled at an instant between 00:00 and 01:00 UTC
of the following day:
- Jerusalem at 00:00 UTC is early, so the sample is at or after 00:00.
- London at 01:00 UTC is correct, so the sample is before 01:00.
- Beirut and Cairo at 21:00-22:00 are early, so the sample is after 22:00.

The exact code is UNVERIFIED because the source is not public. Every zone whose transition instant falls before
01:00 UTC of the next day shows the whole preceding local day an hour off. That covers Australia, New Zealand,
the Levant and Egypt. All six fields move together. Rows as served:

```
Sydney    Apr 03 Fri fajr=05:46 sunrise=07:09 dhuhr=13:04 asr=17:07 maghrib=18:51 isha=20:06   [tzdata +11]
Sydney    Apr 04 Sat fajr=04:46 sunrise=06:09 dhuhr=12:03 asr=16:06 maghrib=17:50 isha=19:05   [tzdata +11, served as +10]
Sydney    Apr 05 Sun fajr=04:47 sunrise=06:10 dhuhr=12:03 asr=16:05 maghrib=17:48 isha=19:04   [tzdata +10]
Sydney    Oct 02 Fri fajr=04:07 sunrise=05:31 dhuhr=11:50 asr=16:12 maghrib=18:01 isha=19:13   [tzdata +10]
Sydney    Oct 03 Sat fajr=05:06 sunrise=06:30 dhuhr=12:49 asr=17:12 maghrib=19:02 isha=20:13   [tzdata +10, served as +11]
Sydney    Oct 04 Sun fajr=05:04 sunrise=06:29 dhuhr=12:49 asr=17:13 maghrib=19:03 isha=20:14   [tzdata +11]
Auckland  Apr 04 Sat fajr=05:11 sunrise=06:37 dhuhr=12:29 asr=16:29 maghrib=18:14 isha=19:29   [tzdata +13, served as +12]
Auckland  Sep 26 Sat fajr=05:38 sunrise=07:05 dhuhr=13:17 asr=17:34 maghrib=19:23 isha=20:36   [tzdata +12, served as +13]
Beirut    Mar 28 Sat fajr=05:07 sunrise=06:31 dhuhr=12:48 asr=17:09 maghrib=18:59 isha=20:11   [tzdata +2, served as +3]
Beirut    Oct 24 Sat fajr=04:26 sunrise=05:50 dhuhr=11:27 asr=15:15 maghrib=16:57 isha=18:15   [tzdata +3, served as +2]
Cairo     Apr 23 Thu fajr=04:55 sunrise=06:20 dhuhr=12:58 asr=17:34 maghrib=19:30 isha=20:39   [tzdata +2, served as +3]
Cairo     Oct 29 Thu fajr=04:46 sunrise=06:07 dhuhr=11:44 asr=15:33 maghrib=17:14 isha=18:31   [tzdata +3, served as +2]
Jerusalem Mar 26 Thu fajr=05:14 sunrise=06:36 dhuhr=12:50 asr=17:10 maghrib=18:58 isha=20:10   [tzdata +2, served as +3]
Jerusalem Oct 24 Sat fajr=04:27 sunrise=05:49 dhuhr=11:28 asr=15:19 maghrib=17:00 isha=18:18   [tzdata +3, served as +2]
```

**The site shows the same defect.** The cached `www.moonsighting.com_sydney_2026_m0_praytable.html` rows are
`Apr 04 Sat 04:46 06:09 12:03 16:06 17:50 19:05` and `Oct 03 Sat 05:06 06:30 12:49 17:12 19:02 20:13`, identical
to time_json. No extra request was needed; the table was already cached and diffed at 0 minutes on all 365 rows.

### 2.10b Global timezone sweep (owner instruction: judge globally)

Added probes 2026-09-14 (`probe.py global`), all bukhamsin `time_json.php` m0 2026, cached as
`moonsighting.ahmedbukhamsin.sa_<city>_2026_m0.json`:
Kolkata (+5:30), Kathmandu (+5:45), Adelaide (+9:30/+10:30), St John's (−3:30/−2:30), Casablanca (Ramadan DST),
Kiritimati (+14), Pago Pago (−11), Ushuaia (54.8°S, no DST), Jakarta (6.2°S), Makkah.

**Method.** Script `impls/global_offsets.py`, output `impls/global_offsets.txt`.
- Implied offset = endpoint Dhuhr − 5 min − solar noon (UTC, PrayTimes.org v2.3 equation of time). It is rounded
  to 15 minutes and compared, modulo 24 h, with tzdata's offset at local noon.
- The first run compared without the modulo. It flagged Auckland (+13) and Kiritimati (+14) as −11/−10. Those are
  identical clock times, so that was a false alarm, now removed.
- On every non-mismatch day, the Dhuhr residual is 0 or −1 minute for all 23 cities, so noon + 5 holds globally.

| City (zone) | Days the endpoint's offset differs from tzdata | Which days |
|---|---|---|
| London, Oslo, Tromsø, Longyearbyen, Reykjavik, Chicago, Karachi, Santiago, Kolkata, Kathmandu, St John's, Kiritimati, Pago Pago, Ushuaia, Jakarta, Makkah | 0 | – |
| Sydney | 2 | Apr 04, Oct 03 (day-early DST) |
| Auckland | 2 | Apr 04, Sep 26 (day-early DST) |
| **Adelaide (half-hour DST)** | 2 | Apr 04, Oct 03 (day-early DST; transition 16:30 UTC) |
| Beirut | 2 | Mar 28, Oct 24 |
| Cairo | 2 | Apr 23, Oct 29 |
| Jerusalem | 2 | Mar 26, Oct 24 |
| **Casablanca** | 103 | every day from **Sep 20** to Dec 31: endpoint +1, tzdata +0 |

**Half-hour and 45-minute offsets, ±14/−11 and Ramadan DST.**
- Kolkata, Kathmandu, St John's (including its 05:30/04:30 UTC transitions), Kiritimati and Pago Pago are
  handled correctly.
- Adelaide's half-hour offset is correct, but it has the same day-early DST defect as Sydney.
- Casablanca's Ramadan transitions (tzdata: +1→+0 on 2026-02-15 02:00 UTC, +0→+1 on 2026-03-22 02:00 UTC) are
  followed exactly. The endpoint rows are Feb 14 Dhuhr 13:49 → Feb 15 12:49, and Mar 21 12:43 → Mar 22 13:42.

**Casablanca after 20 September: a tz database version dependency.**
- This Mac's IANA tzdata is **2026c** (`/var/db/timezone/zoneinfo/+VERSION`, Python `tzdata.IANA_VERSION`). It
  has Morocco moving +1→+0 on 2026-09-20 01:00 UTC and staying at +0 to year end.
- Node 24.14.1's ICU tz **2025c** still shows +1 for 2026-09-21 and 2026-12-01.
- The endpoint (PHP 8.2.27, bundled timezonedb version unknown) shows +1: Sep 19 Dhuhr 13:29, Sep 20 13:29,
  Sep 22 13:28, Dec 31 13:38.
- So the endpoint's tz rules match the older database. Which is right for Morocco on 20 September 2026 depends on
  the real-world policy and is **UNVERIFIED**, since the date is after today (2026-09-14).
- Either way, the endpoint's times for any zone are only as current as its PHP timezonedb. A v2.0 client cannot
  see that version.

**Mechanism.** Every day-early case is a transition instant between 14:00 and 00:00 UTC. Every correct case is at
01:00 UTC or later (London, Oslo, Santiago, Chicago, St John's). This is consistent with the offset being sampled
in [00:00, 01:00) UTC of the following day. Source unseen: UNVERIFIED.

### 2.11 Could a worldwide v2.0 depend on it directly?

| Question | Finding |
|---|---|
| Single date / month parameter | None. Always a full year of about 141 KB; `date`/`month`/`day` are ignored (§2.6) |
| Rate limits | None advertised; none hit in about 60 polite requests. Real limits UNVERIFIED |
| Uptime history | Wayback CDX (fetched 2026-09-14): **0 captures** for `moonsighting.com/time_json.php*`, `moonsighting.ahmedbukhamsin.sa*` and `ahmedbukhamsin.sa*`. `praytable.php*` has 17 captures (2016: 9; 2020: 2; 2022: 1 + one 301; 2024: 4). `pray.php*` has 105 (2011-10-17 to 2026-06-08). So no independent uptime record exists for either JSON endpoint (`endpoint/web.archive.org_cdx_*.json`) |
| Terms of use | None found for the API: bukhamsin root is 403; the moonsighting.com crawl has no API terms; PrayerTimeAPI's Apache-2.0 covers the Angular example only. Permission to depend on it is UNVERIFIED and would need the owners |
| Operator | One individual's personal domain, not moonsighting.com's own host, which is broken for JSON |
| Error contract | Errors come as HTTP 200 with HTML warnings or fatal traces in an `application/json` body. Missing `both`/`time` corrupts otherwise valid JSON |
| Data defects a client must handle | DST one day early east of UTC (§2.10); `-----` for up to 128 days a year at 78°N; evening times after midnight and a Fajr on the previous evening with no day marker (§2.7); `-1` numbers under method 3; three trailing spaces; no year or ISO date in `day` |
| CORS | Open (`*`), so a phone or browser can call it directly |

| Southern and polar behaviour (added 2026-09-14) | Rule-consistent to ±1 min at 54.8-67.6°S. McMurdo (77.8°S) has multi-day runs of identical after-midnight Fajr/Isha and Isha 30-105 min off the model at the polar-night edges (§2.7b) |
| Timezone coverage | Correct on every day for 18 of 26 measured IANA zones (27 cities), including ±:30/:45, +14, −11 and Morocco's Ramadan switches. Day-early DST in 7 zones: Sydney, Adelaide, Auckland, McMurdo, Beirut, Cairo and Jerusalem (§2.10, §2.10b, §2.7b). Casablanca after 2026-09-20 follows an older tz rule; the server's timezonedb version cannot be seen (§2.10b) |
| Ownership and terms (item 4 re-check) | Unchanged from §2.1: Cloudflare-fronted Apache/PHP 8.2.27 on the personal `.sa` domain of the developer credited on pray.php. The whois registrant is not published. There are no API terms on either host, and moonsighting.com's own JSON host is broken. Reliability evidence: two same-day observation windows with no failures (§2.4); Wayback has no captures of either JSON host |

Assessment: technically callable from the app, but not a safe sole dependency. At minimum it would need:
- a server-side yearly fetch per location, with validation;
- a DST-day policy: either correct the served day by recomputing its offset from tzdata (which changes
  published numbers, against the owner's no-synthesis rule) or flag the day for the user;
- a policy for dashes, after-midnight evening values and polar-edge Fajr = Isha days;
- the owners' consent.

Whether the owners want that load or would provide an official endpoint is an open question. The DST fault
is a server-side bug the owners could fix, and reporting it to them is the cleanest route.

---

## 3. Which endpoint call reproduces the site's published tables

### 3.1 praytable.php against time_json.php

Script: `impls/praytable_vs_timejson.py`. Output: `impls/praytable_vs_timejson.txt`.

Calls compared: `praytable.php?year=2026&tz=<zone>&lat=<lat>&lon=<lon>&method=<m>&both=false&time=0` against
bukhamsin `time_json.php` with the identical query.

| Table | Rows | Result |
|---|---|---|
| London m0, m1, m2 (lead's cache) and m3 | 365 | 0 min on every cell; headers `Isha(H)` for m1, `Asr(S)`/`Isha(S)` for m2, `Asr(J)`/`Isha(J)` for m3 |
| Oslo m0, m1, m2 | 365 | 0 min on every cell |
| Tromsø m0, m1, m2 | 365 | 0 min on 296 Fajr / 248 Sunrise / 247 Maghrib / 296 Isha cells; the rest are `-----` in both |
| Longyearbyen m0 | 365 | 0 min, or identical `-----` in both |
| Chicago m0, Reykjavik m0, Sydney m0 | 365 | 0 min on every cell |

Other checks:
- A second fetch of London m0 was byte-identical to the lead's copy (`cmp`).
- `both=true` adds an `Asr(S)` column; `time=1` gives `am`/`pm` strings, as in time_json.

**Answer.** `https://moonsighting.ahmedbukhamsin.sa/time_json.php?year=YYYY&tz=<IANA>&lat=<lat>&lon=<lon>&method=0&both=false&time=0`
reproduces the site's generator exactly for method 0 (Hanafi, Shafaq General), and methods 1-3 likewise. The
table's `Asr` column is `asr` (Hanafi for m0/m1, Shafi for m2); the site shows `asr_s` only when `both=true`.

### 3.2 The 2015 booklet's printed tables against today's generator

Script: `impls/booklet_vs_endpoint.py`. Output: `impls/booklet_vs_endpoint.txt`. The booklet's table year is not
stated, so up to ±2 minutes of solar drift is expected.

- For Dec 21, Mar 22, Jun 22 and Sep 22, the booklet's FjrCalc, Sunrise, "Sunset" and IshCalc match the endpoint
  2026 values within ±2 minutes: London, Oslo and Chicago within ±2, Karachi and Sydney within ±1.
  - London Jun 22: booklet Fajr 2:44, Sunrise 4:44, Sunset 21:25, Isha 22:42; endpoint 02:43, 04:43, 21:25, 22:42.
  - Oslo Jun 22: 3:10 / 3:54 / 22:47 / 23:28 in both.
- **The booklet's "Sunset" column equals the generator's Maghrib**, which is sunset + 3. The booklet tables were
  therefore produced by this generator or its predecessor.
- The booklet's Fairbanks (64°50'N) Jun 22 row (FjrCalc 2:40, Sunrise 2:59, Sunset 0:51, IshCalc 1:07) shows 1/7
  at the true latitude with no 60° slide. The 2015 booklet table behaves like today's generator, even though its
  own §12 text describes a slide.

---

## 4. Implementations

### 4.1 The formula every seasonal implementation shares (booklet §11, pp. 24-25)

The booklet text is extracted at `impls/booklet-fajr-isha.txt`. The PDF metadata gives Author "sks1", created
2018-04-05 (Word 2013); the text is dated September 2015. Its SHA-256 is identical in the islamic-network and
kskhan77 repos: `d2faa6c1…5c08b63`.

- `DYY`: north counts from Dec 21 = 0 ("DYY=11 for January 1"); south counts from Jun 21 = 0.
- Fajr: `A = 75 + 28.65/55·|LT|`, `B = 75 + 19.44/55·|LT|`, `C = 75 + 32.74/55·|LT|`, `D = 75 + 48.1/55·|LT|`.
- Isha, Shafaq Ahmer: `A = 62 + 17.4/55·|LT|`, `B = 62 − 7.16/55·|LT|`, `C = 62 + 5.12/55·|LT|`, `D = 62 + 19.44/55·|LT|`.
- Isha, Shafaq Abyad: `A = 75 + 25.6/55·|LT|`, `B = 75 + 7.16/55·|LT|`, `C = 75 + 36.84/55·|LT|`, `D = 75 + 81.84/55·|LT|`.
- Isha, Shafaq General: `A = 75 + 25.6/55·|LT|`, `B = 75 + 2.05/55·|LT|`, `C = 75 − 9.21/55·|LT|`, `D = 75 + 6.14/55·|LT|`.
- MIN, with DYY in days:
  - DYY < 91: A → B over 91 days.
  - < 137: B → C over 46.
  - < 183: C → D over 46.
  - < 229: D → C over 46.
  - < 275: C → B over 46.
  - otherwise: B → A over 91.
- Fajr = sunrise − MIN; Isha = sunset + MIN.
- The written rules (booklet §12 and how-we.html) are:
  - Up to 55°, compare with 18°, taking the later Fajr and the earlier Isha.
  - Between 55° and 60°, also bound by 1/7 of the night.
  - Above 60°, slide to 60°; and Dhuhr = noon + 5, Maghrib = sunset + 3 (+17 Shi'a), from how-we.html.

### 4.2 islamic-network/prayer-times-moonsighting (PHP): the original

- **Where it lives now.** `https://1x.ax/islamic-network/libraries/prayer-times-moonsighting`, a OneDev
  instance (`/~login` redirect, JSESSIONID). It clones anonymously:
  `git clone https://1x.ax/islamic-network/libraries/prayer-times-moonsighting.git`, copied to
  `~/athan-research/src/islamic-network-prayer-times-moonsighting` with `.git`.
  - Packagist `islamic-network/prayer-times-moonsighting` names that URL as its source.
  - The GitHub repo `islamic-network/prayer-times-moonsighting` is deleted; mawaqit's description says so, and
    `opensrc` could not fetch it.
- **Author and history.** Meezaan-ud-Din Abdu Dhil-Jalali Wal-Ikram `<m@meezaan.net>` (Islamic Network /
  AlAdhan).
  - First commit `1bd3796` 2020-07-22; last `f8a8ea4` 2024-01-27 "Remove CircleCI".
  - The booklet was added in `4e3a189` on 2020-07-25.
  - Packagist lists versions 1.0 and 1.1, both 2020-07-22. Downloads (packagist.org, 2026-09-14): 19,362
    total, 633 monthly, 16 daily.
- **Licence.** `composer.json` says `GPL-3.0-or-later`. There is no LICENSE file.
- **Provenance.** README: "Syed Khalid Shaukat, who has done the research for this method … please see the Fajr
  and Isha booklet … and visit https://www.moonsighting.com/". "This library has been written for the AlAdhan.com
  API". moonsighting.com/how-we.html names this repo as a user of the method.
- **Formulas.** Fajr.php:13-16; Isha.php:26-29 (ahmer), 31-34 (abyad), 36-39 (general, with `c` assigned before
  `b`); PrayerTimes.php:50-61 (MIN). Identical to §4.1.
- **DYY quirk** (PrayerTimes.php:29-45):
  - `latitude > 0` is north, so the equator counts as south.
  - `DateTime::createFromFormat('m-d-Y', '12-21-YYYY')` takes the **current wall-clock time**, and
    `diff()->format('%r%a')` floors whole days.
  - So for a date at 00:00, days after Dec 21 of the same year get DYY one less than the calendar count, and
    Dec 21 itself gets 365 instead of 0.
  - The repo's own test pins this: `new DateTime('24-12-2020') // 2 days afer dec 21` asserts `getDyy() == 2`,
    where the calendar count is 3.
  - It is also leap-year blind (a hard-coded `365 +`).
  - The effect is at most one day of slope, well under one minute at London. It is non-deterministic if run at
    exactly 00:00:00.
- **Host library** `islamic-network/prayer-times`: same 1x.ax location, cloned; last commit `8e1bff8`
  2024-05-31; `LICENSE` is LGPL-3.0 while composer.json says GPL-3.0-or-later. Its README says it is "a PHP
  edition of the Prayer Times Library (v2.3) originally written in JavaScript by Hamid Zarrabi-Zadeh".
  - `Method.php:299` `'Moonsighting Committee Worldwide (Moonsighting.com)'` with params only `shafaq`.
  - `PrayerTimes.php:272-273` calls `moonsightingRecalculation` after `adjustTimes`.
  - Lines 281-296: `Fajr = Sunrise − getMinutesBeforeSunrise()/60`; `Isha = Sunset + getMinutesAfterSunset()/60`.
  - Nothing else: no 18° comparison, no 1/7 rule, Maghrib at sunset (`'0 min'`), Dhuhr at noon.
  - `getMeta` reports `latitudeAdjustmentMethod NONE` for this method (824-825), yet the ANGLE_BASED adjustment
    still runs before the recalculation (`adjustHighLatitudes`, 423).
  - `sunAngleTime` clamps `cosRange` to [−1, 1] (573), so polar dates produce clock times, never `-----`.
- **Run.** PHP is not installed, so this is a **port**: `impls/port_islamic_network.py`.
  - The port passes the repo's unit tests: DYY 2/338/2/337 and minutes 88/87/86/83/90/89/89/85, with
    `dyy_mode='php_now'` for the Dec 24 / Jun 24 cases.
  - It reproduces `TimingsMoonSightingTest` for London 2014-04-24 exactly: Fajr 04:04, Sunrise 05:46, Dhuhr
    12:59, Sunset/Maghrib 20:12, Isha 21:21.
  - Live cross-check: **AlAdhan API method 15**
    (`https://api.aladhan.com/v1/timings/DD-MM-2026?latitude=…&longitude=…&method=15&shafaq={general,abyad,ahmer}&timezonestring=…`,
    36 calls cached as `endpoint/api.aladhan.com_<city>_2026_m15_<shafaq>_<yyyymmdd>.json`, 2026-09-14).
    AlAdhan reports `latitudeAdjustmentMethod: NONE`. It equals the port on Fajr, Sunrise, Dhuhr and Maghrib at
    every date, and Isha differs by +1 in 3 of 12 general cases (London Jun 21, Oslo Jun 21 and Sep 22). The
    deployed AlAdhan build may differ slightly; UNVERIFIED.

### 4.3 kskhan77/prayer-times-moonsighting

- **Owner.** GitHub user `kskhan77` is **Khurram Shafique** (bio "A passionate full Stack developer from USA",
  blog khurramshafique.com; API 2026-09-14). **Not Khalid Shaukat**, and there is no evidence of any link to him.
- **Contents.** Repo created 2021-03-21 and not a GitHub fork. Every commit (11, the last `6f8d464` 2020-07-25)
  is authored by Meezaan `<m@meezaan.net>`. It is a pushed copy of islamic-network's repo as of 2020-07-25,
  keeping `.circleci`, the composer name `islamic-network/prayer-times-moonsighting` and homepage
  `https://flarum.org/`. No licence file; composer says GPL-3.0-or-later.
- **Code.** Identical to islamic-network: `diff -r -w` shows only README badges and the composer homepage.
  Formulas as §4.1; run results as §4.2.

### 4.4 mawaqit/prayer-times-moonsighting and mawaqit/prayer-times

- **Repos.** Org `mawaqit` (the Mawaqit mosque-display platform). One commit each: `b5bf6bd` 2025-10-03 "Init
  repository" by `Ben <hbenakremi@axialys.com>`, and `6401572` 2025-10-03.
  - Descriptions: "A fork of islamic-network/prayer-times-moonsighting which has been deleted from gihub", and
    the same for prayer-times.
  - Licence: composer GPL-3.0-or-later; no LICENSE in the moonsighting repo; GitHub shows LGPL-3.0 for
    prayer-times (a LICENSE file is present).
  - The README still says `composer install islamic-network/prayer-times-moonsighting`.
- **Code.** `src/MoonSighting/*` equals islamic-network apart from the namespace `Mawaqit\MoonSighting`, `\DateTime`,
  and a reordered but equivalent DYY branch: `$this->dyy = 365 + $diff; if ($diff > 0) $this->dyy = $diff;`
  (PrayerTimes.php:38-41). The test file is identical.
- **Host library** `mawaqit/prayer-times` is islamic-network/prayer-times as it stood **before** commits
  `1582149` (2024-04-11, "Fix the date for the fraction calculation") and `6cbea8d` (ISO8601 day wrap).
  - It still has `$dayfrac = date('G') / 24 - .5` (PrayerTimes.php:517), which makes the Asr Julian date
    depend on the server's wall clock.
  - `moonsightingRecalculation` is at line 265.
  - Fajr/Isha as §4.2 (port results apply; Asr not compared).

### 4.5 muballighapp/moon-sighting and muballighapp/prayer-times (PHP)

- **Repos.** Rizwan Ahmad `<rizwan_ranjha@hotmail.com>` (Muballigh App), created 2025-03-15, last push
  2025-03-17. GPL-3.0 LICENSE files. Packagist `muballigh/moon-sighting` v1.0 (2025-03-17, 210 downloads) and
  `muballigh/prayer-times` v1.0.
- **Code.** moon-sighting equals islamic-network apart from the namespace (`diff -w`). prayer-times is the
  pre-2024-04 islamic-network host: `date('G')` at PrayerTimes.php:533, `moonsightingRecalculation` at 279-296,
  plus an `arccot` divide-by-zero guard in DMath.php. Its test repeats islamic-network's London 2014 assertions.
- Behaviour as §4.2.

### 4.6 adamarnap/fork_al-adhan_prayer-times-moonsighting (PHP)

- Created 2025-12-08; two commits by `adamarnap`; no licence. Description: "Fork al adhan prayer times from
  repository https://1x.ax/…".
- Code identical to islamic-network (composer name `adamarnap/prayer-times-moonsighting`, homepage flarum.org).

### 4.7 arahmancsd/PrayerTimesManager (C#)

- Created 2026-08-17, pushed 2026-08-21, MIT, 0 stars.
- `PrayerTimesManager/MoonsightingPrayerTimes.cs` ports the islamic-network classes with two changes:
  - **Leap-aware DYY** with Dec 21 = 0: `_dyy = diff >= 0 ? diff : daysInYear + diff` (line 56).
  - Offsets `ZuhrOffsetMinutes = 5`, `SunniMaghribOffsetMinutes = 3`, Shi'a 17 (lines 192-196), citing how-we.html.
- No 18° or 1/7 logic is in this file.
- **Not run** (no `dotnet` on this Mac); runtime UNVERIFIED.
- **Read in full** (2026-09-14 re-read after the no-truncation instruction): `PrayerTimes.cs` (805 lines),
  `PrayerCalculationMethod.cs` (321), `PrayerCalculation.cs` (156), `DMath.cs` (103), `README.md` (206) and
  `PrayerTimesManager.Tests/MoonsightingPrayerTimesTests.cs` (108). What they add:
  - `PrayerTimes.cs:551-552,612-624`: `MoonsightingRecalculation` is islamic-network's: Fajr = sunrise − MIN,
    Isha = sunset + MIN. There is no 18° bound and no 1/7.
  - `SunAngleTime` clamps `cosRange` (740-743), so polar dates give clock values, never `-----`.
  - **The shafaq default depends on the school** (`ConfigureMoonsightingDefaults`, 118-131; README table
    134-138): STANDARD → General, **HANAFI → Abyad**, JAFARI → Ahmer. Maghrib gets +3 (Sunni) or +17 (Jafari),
    and Zuhr +5, through tune offsets.
  - The site's generator is different: its method 0 is "Hanafi (Shafaq General)", so a Hanafi user of this
    library gets the site's method 1 Isha, not method 0.
  - `AsrFactor` Jafari = 4/7 (262).
  - The time zone is `tz.GetUtcOffset(_date)` at the supplied instant (517-526), so a date passed at local
    midnight on a DST day picks the midnight offset.
  - `PrayerCalculationMethod.cs:230-239` describes MC as "Fajr angle 18, Isha angle 18. Also uses seasonal
    adjustement values". The code does not use 18°.

### 4.8 RagibHasin/adhaan (Rust)

- MIT, created 2021-05-24, pushed 2026-03-31. README: "based on the Adhan library by Batoul Apps … started as a
  fork of the earlier port `salah`". So it is adhan lineage.
- `src/models/method/moonsighting_com.rs`:
  - Seasonal functions as §4.1 (lines 28-65).
  - `days_since_solstice = |date − Dec 21 of the same year|` via `.unsigned_abs()` (68-72). For Jan 1 this gives
    354 against the booklet's 11. The result is correct only through the function's symmetry, off by about one
    day.
  - Fajr = max(`≥55° ? sunrise − night/7 : 18°`, sunrise − seasonal) (99-108); Isha = min(…) (119-132).
  - Adjustments Dhuhr 5, Maghrib 3 (77-78).
  - Named statics: Mixed (general), Red (ahmer), White (abyad).
- **Not run** (no `cargo`); UNVERIFIED numerically.
- **Read in full**: `src/schedule.rs` (335), `src/models/method.rs` (323), `src/models/parameters.rs` (116),
  `src/models/polar_circle_resolution.rs` (131), `src/lib.rs` (168), `README.md` (32). What they add:
  - Fajr uses the night from **yesterday's sunset to today's sunrise**; Isha uses **today's sunset to tomorrow's
    sunrise** (schedule.rs:50-56, 82-86).
  - The endpoint model instead uses 24 h − (sunset − sunrise) of the same day.
  - **Rounding differs by prayer.** Fajr, Sunrise and Qiyam are truncated (`RoundMode::Trunc`); Dhuhr, Asr,
    Maghrib and Isha are rounded (schedule.rs:128-150).
  - Its own MC test at 35.775°N (2016-01-31) expects sunrise `12:15` against a comment of `12:16`, which shows
    the truncation.
  - **Polar handling.** The default resolver is `NearestCity` (parameters.rs:34). It walks the latitude toward
    the equator in **0.5° steps**, and only while |lat| ≥ 65°; otherwise it errors
    (polar_circle_resolution.rs:14-15, 95-127).
  - That walk replaces **the whole schedule's** solar times with the substitute latitude's, including sunrise
    and sunset. The site's generator dashes those.
  - Default `high_latitude_rule` MiddleOfTheNight (parameters.rs:33) is irrelevant for MC, since MC overrides
    Fajr/Isha in `moonsighting_com.rs`.
  - Adjustments: Dhuhr +5, Maghrib +3 (moonsighting_com.rs:75-81).

### 4.9 sniper1720/mawaqit (Rust crate `mawaqit` 0.4.0)

- crates.io: 273 downloads, updated 2026-08-28. GitHub: created 2026-06-30, MIT. Adhan-derived API.
- **The one implementation that codes the how-we.html text above 60°**, in `src/schedule.rs`:
  - `resolve_moonsighting_committee_zone` (76-102): Standard at ≤60°.
  - "Astronomical summer above 60°: anchor to ±60° and apply Sab'u Lail" (`Anchored(60.0 * signum)`, 84-85).
  - Perpetual day or night outside summer: nearest-latitude substitution (Aqrabul-Bilaad walk).
  - Otherwise: seasonal at the true latitude.
  - `src/methods/moonsighting.rs:58-78`: DYY via day-of-year + 10 (north) or − 172/173 (south), leap-aware.
- Per §2.9 this does **not** match what moonsighting.com's generator publishes above 60° (Reykjavik, Tromsø).
- **Not run** (no `cargo`); UNVERIFIED numerically.
- **Read in full**: `src/schedule.rs` (1384), `src/models/polar.rs` (138), `src/astronomy/solar.rs` (532),
  `src/models/method.rs` (333), `src/models/parameters.rs` (307), `src/methods/moonsighting.rs` (189),
  `tests/moonsighting_committee.rs` (445), `README.md` (329), `CHANGELOG.md` (116). What they add:
  - **Default shafaq is Ahmer, not General.** `Configuration::with(method, madhab)` sets Shafi → **Ahmer**,
    Hanafi → **Abyad** (parameters.rs:152-161). General is used only by `Configuration::new`.
  - All of the crate's own MC tests use `Configuration::with(MoonsightingCommittee, Shafi)`, so they exercise
    Ahmer. Against the site, that corresponds to method 2, not method 0.
  - **Zones** (schedule.rs:76-137, 199-271):
    - |lat| ≤ 60: Standard. At |lat| ≥ 55 the 18° time is **replaced** by 1/7 of the night, then bounded by the
      seasonal function: Fajr = later, Isha = earlier (schedule.rs:591-604, 646-659). Below 55,
      Fajr = max(18°, seasonal) and Isha = min(18°, seasonal). That matches the generator (§2.9).
    - \>60 and astronomically in summer (true solstice instant to equinox instant, found by bisection,
      solar.rs:110-171): **the entire schedule is computed at ±60°**. That includes sunrise, Dhuhr, Asr and
      Maghrib (tests/moonsighting_committee.rs:24-51 assert all six prayers equal the 60° schedule).
    - \>60, not summer, real days: seasonal at the true latitude with the 18° bound and **no 1/7**.
    - \>60, not summer, no rise or set, or a transition day: `nearest_working_latitude`, a 24-step bisection
      between 0 and |lat| (polar.rs:104-138), and the whole schedule computed there.
  - Measured against the generator (§2.7, §2.9):
    - Reykjavik 64.1° non-summer: generator uses 1/7 at the true latitude; crate uses no 1/7.
    - Tromsø midnight sun: generator dashes; crate uses the 60° schedule.
    - Tromsø polar night: generator gives 18° Fajr/Isha with dashed sunrise and maghrib; crate uses a
      substituted-latitude schedule.
    - So the crate implements the text of how-we.html and faq_pt.html, not the published tables.
  - **Civil date is the UTC date.** `SolarTime::new` zeroes the date to 00:00 UTC (solar.rs:196-200), and every
    time is returned as `DateTime<Utc>`. For zones far from UTC (+13/+14, −11), the caller's local civil date and
    the UTC date differ for part of the day. Whether the crate then computes the neighbouring day is UNVERIFIED
    (not run).
  - Rounding: the MC default is `Nearest` (parameters.rs:62). `setting_hour` rounds to the minute
    (solar.rs:335-373).
  - The crate says it was inspired by `salah` (README:321). CHANGELOG 0.4.0 (2026-08-28) introduced the Zone C
    rules.

### 4.10 acamarata/pray-calc (npm `pray-calc`; Dart port `pray_calc_dart`)

See §5. `src/getMSC.ts`:
- Independent TypeScript. Its header cites "moonsighting.com/isha_fajr.html"; that page was not found in the crawl.
- Coefficients as §4.1 (115-118, 146-165).
- Leap-aware DYY (45-66), with the last segment length `daysInYear − 275` (91).
- In `getTimesAll`, `MSC` is only a comparison entry: `sunrise − mscFajrMin` and `maghribTime + mscIshaMin`,
  with Maghrib = sunset in that code (258-263). No 18°, 1/7 or +3.
- The header says "High-latitude handling (|lat| > 55°): falls back to 1/7-night rule", but that is not applied
  in `getTimesAll`'s MSC path.
- **Read in full**: `src/getMSC.ts` (223), `getTimesAll.ts` (292), `getTimes.ts` (140), `highLatitude.ts` (265),
  `civilDate.ts` (94), `constants.ts` (35), `getAngles.ts` (226), `calcTimesAll.ts` (65), `types.ts` (148),
  `README.md` (121). What they add:
  - The library's **primary** Fajr/Isha is not the MC method. `getAngles.ts:139-203` converts MCW minutes into
    a depression angle, adds Earth–Sun distance, Fourier smoothing, refraction and elevation corrections,
    clamps to 10-22°, and solves with NREL SPA. MC appears only as `Methods.MSC`, a comparison pair.
  - `Methods.MSC` = `sunriseTime − MIN` and `maghribTime + MIN`, where `maghribTime = spaData.sunset` with no +3
    (getTimesAll.ts:208-213, 258-263). There is no 18° bound and no 1/7. Polar dates give NaN.
  - Dhuhr = noon + **2.5 min** (`constants.ts:17`), not +5.
  - The last seasonal segment has length `daysInYear − 275` (getMSC.ts:91): 90 days in a common year and 91 in a
    leap year. The booklet uses 91 in every year, so days near 20 Dec differ very slightly.
  - Civil date is pinned to UTC noon of the caller's local calendar day (civilDate.ts:50-81). `tz` is a numeric
    offset supplied by the caller, so DST is the caller's responsibility.
  - The high-latitude rules for the dynamic path (`highLatitude.ts`) default to `none`. `aqrabAlBilad` means
    **45°**, not moonsighting.com's 0.1° walk.

### 4.11 Sherheryaar/Musallah `src/lib/prayerCalc.ts` (app code, no licence)

- Created 2026-07-12, pushed 2026-09-07. Header comment: "Moonsighting Committee Worldwide method by Sh. Khalid
  Shaukat (moonsighting.com) … Above 55° latitude it falls back to the 1/7-of-night rule".
- Seasonal functions "as implemented in the open-source `adhan` library" (line 153).
- **Coefficient bug:** abyad `D = 75 + (45.1 / 55) * L` (line 220); the booklet has 81.84.
- At ≥55° it **replaces** the seasonal bound with 1/7 (297-300), instead of combining the two as the generator
  does. That is why Oslo March and September Isha are +23 late and Tromsø +21/+22 (§4.14).
- Polar days return `null`.

### 4.12 Mislabelled or empty "Moonsighting" implementations

| Implementation | What it actually does (source) |
|---|---|
| muslimtify-org/libmuslim `prayertimes.h` (C, MIT, pushed 2026-09-07; **read in full**, 1093 lines: v0.2.4 header; `calculate_prayer_times` 923-1092 has Dhuhr = noon with no +5 (1078, 1085); 1/7 used **only when 18° is unreachable** (`high_lat_substitute`, 883-921); polar days solve the whole day at `high_lat_ref` = 60 (964-975); the caller passes a fixed numeric `timezone`, so the header has no DST logic) | `[CALC_MOONSIGHTING] = {"Moonsighting Committee", 18.0, 18.0, 0, 3, …, HIGHLAT_ONE_SEVENTH, 60.0}` (line 558): 18°/18° angles, Maghrib +3, 1/7 when the angle is unreachable, reference latitude 60 in polar cases. **No seasonal function** (no `28.65` anywhere). Its comment at 555-557 paraphrases how-we.html |
| salahapi/salahapi-php (MIT, 2025-12-25; **read in full**: PrayerTimes.php 748, Method.php 396) | `moonsightingRecalculation()` returns `$times` unchanged in both branches (PrayerTimes.php:350-357) and **is never called** by `computeTimes` (370-393). `setMethod` maps method codes through `$methodMapping`, which has no MOONSIGHTING key, so `?? 'MWL'` applies (166-189). **MOONSIGHTING silently computes MWL**: Fajr 18°, Isha 17°, Maghrib "1 min" from `defaults`. The code header says "Based on times.js v3.2 by Hamid Zarrabi-Zadeh" (PrayerTimes.php:10) |
| wailay/piazan (Python; **read in full**: prayer_times.py 531, method.py 370) | `moonsighting_recalculation` returns `times` unchanged: "This is a simplified version … For now, we'll use standard calculations" (prayer_times.py:131-137). MOONSIGHTING params hold only `shafaq` (method.py:263-269), so `load_settings` gives Fajr 0 and Isha 0 (prayer_times.py:57-61). By reading (not run): Fajr = the 0° crossing ≈ sunrise and Isha ≈ sunset. The ANGLE_BASED adjustment has portion 0 × night, so the times collapse onto sunrise and sunset. **Fajr ≈ Sunrise, Isha ≈ Sunset**. A Python port of islamic-network with the moonsighting classes missing |
| a-saab/PrayerTimes (Arduino, MIT; **PrayerTimes.cpp read in full**, 351 lines) | Only a header comment, "Modern authoritative sources (PrayTimes.org, Moonsighting.com)" (PrayerTimes.cpp:10). There is no MC method. The code uses NOAA day-of-year series (135-151), default angles 18/17 (30), and DST as a caller-supplied `dstMinutes` (231-289) |
| @islam-kit/prayer-times (**dist/index.js read in full**, 450 lines) | `MOONSIGHTING: { params: { fajrAngle: 18, ishaAngle: 18 } }` (dist/index.js:68-72), with no seasonal code and no +5/+3. `midDay` = `12 − EoT − lon/15` with **no timezone term** (126-129). `hoursToDate` then sets those UTC hours as **host-local** clock hours (156-164). The result is wrong by the host's UTC offset: the London run on a BST host shows −60 to −65 in summer (§4.14) |
| @misque/prayer-times (**dist/index.js read in full**, 457 lines) | `MoonsightingCommittee: {fajrAngle 18, ishaAngle 18, shafaq "general", methodAdjustments {dhuhr 5, maghrib 3}}` under a comment "Special handling for latitudes above 55 degrees" (dist/index.js:105-116). There is no such handling, and `shafaq` is never read. `calculatePrayerTimes` (167-200) never applies `method.methodAdjustments`. `hourAngle` uses `+sin(angle)` (292), so Fajr/Isha are solved for the sun **above** the horizon. That explains Fajr after sunrise in all 12 runs. `noon` has no timezone term (288), and `convertToDateObjects` sets host-local hours (351-367). Unusable |
| salat-first 1.0.4 (elkhiari, MIT; **read in full** 2026-09-14: dist/index.js 27, prayers/times.js 228, prayers/calculator.js 117, prayers/adjustments.js 75, methods/standard.js 205, methods/index.js 86, core/astronomy.js 204, core/datetime.js 109, core/shadow.js 49, core/math.js 51, core/coordinates.js 47, madhab/index.js 63, utils/formatting.js 88, README 58) | `getMoonsightingCommitteeParameters()` = Fajr 18°, Isha 18°, methodAdjustments Dhuhr +5, Maghrib +3 (standard.js:109-117). **No seasonal function is applied**: `Astronomy.adjustMorningTwilight`/`adjustEveningTwilight` (astronomy.js:141-202, correct booklet coefficients, General only, `daysSinceSolstice` 114-132) are referenced only by astronomy.d.ts. The engine is not adhan's despite the adhan-style names: declination = `23.45·sin(360/365·(doy−81))` (times.js:33); transit = `12 − lon/15` with **no equation of time** (35, 117), so Dhuhr is off by up to about ±16 min over the year; the Julian-day and solar-longitude values computed at 26-31 are never used. Times are written with `setHours` on the host clock using UTC-hour values (36-40, 116-125), so the output depends on the host's timezone and not on the location's. No high-latitude rule; an unreachable angle becomes Invalid Date. The default method is MoroccanHabous (calculator.js:81) |
| masjiduna-waqt 1.0.2 (arafathusayn, AGPL-3.0; **dist/index.js read in full**, 1279 lines) | `MethodProfile.MoonsightingCommittee = {fajr 18, isha 18}` (133-138). `METHOD_ADJUSTMENTS.MoonsightingCommittee = {dhuhr 5, maghrib 3}` (157) is only applied if the caller passes it, and `computePrayerTimes` needs all six keys: a partial object makes Fajr, Sunrise, Asr and Isha NaN (`adjustments.fajr * MS_PER_MIN`, 734-739). The first run hit exactly that, so it recorded "not extractable". That was a harness error, fixed and rerun on 2026-09-14 with `{...NO_ADJUSTMENTS, ...METHOD_ADJUSTMENTS.MoonsightingCommittee}`. `seasonAdjustedMorningTwilight`/`seasonAdjustedEveningTwilight` (1233-1277, correct booklet coefficients for General, Ahmer and Abyad; `daysSinceSolstice` 1121-1133) are exported but **never called** by `computePrayerTimes` (1000-1007) or `_computeCore` (706-999). The effective method is **18°/18° with Dhuhr +5 and Maghrib +3**. An unreachable angle falls back to `highLatRule` (default `middle_of_night`, 433, 957-993). Output is UTC ms; `formatLocal` formats with `Intl` in `timezoneId` (1078-1081), so DST is handled at display. Run results are in §4.14. **Install-time download:** package.json has a `preinstall` hook that runs dist/preinstall.js (11 lines, read in full). It fetches a native `waqt-<platform>` executable from `github.com/arafathusayn/masjiduna-waqt/releases/download/v<version>/` into `~/.waqt/bin` and chmods it 755, with no checksum. It runs whenever `npm_config_global === "true"` **or `BUN_INSTALL` is set**, so any machine with Bun installed triggers it even for a local install. dist/waqt.js (7 lines, read in full) is the CLI shim that executes that binary |
| @masaajid/prayer-times 1.0.1 (farhansyah, MIT; minified dist/index.js **read in full** after an esbuild 0.25.10 reformat to 1057 lines, `impls/npm/@masaajid__prayer-times.formatted.js`; line numbers below refer to that file) | Moonsighting = Fajr 18°, Isha 18°, maghrib "1 min", adjustments Dhuhr +5 / Maghrib +3 (line 1). Maghrib is therefore sunset + 1 + 3 = **sunset + 4** (`iZ` 525-530), +1 against the endpoint in every run. Fajr (`oZ` 506-517): the 18° time, replaced by sunrise − night/7 when \|lat\| ≥ 55 (night = tomorrow's sunrise − today's sunset), then the later of that and the seasonal time (`XZ` 433-442). Isha (`tZ` 531-544) mirrors this with the earlier of the two. Unlike adhan it uses \|lat\|, so the southern hemisphere is covered. **Bug 1, Isha coefficients:** the "general" branch of the seasonal Isha used on the main path (`ZZ`, 443-456, at 447) carries the **Abyad** values (7.16, 36.84, 81.84). The correct General values (2.05, −9.21, 6.14) exist only in the unused fallback `sZ` (387). Measured effect: London Isha +5 at the equinoxes, **+70 on 21 Jun**, 0 on 21 Dec (DYY 0, where the two sets agree). **Bug 2, time of day:** seasonal Fajr/Isha are returned as hours after the *input instant* (512, 515, 539, 542), but `O()` re-bases hours on the input's UTC midnight (499-505). Only a 00:00 UTC input is self-consistent. `impls/masaajid_instant_check.mjs` (London 2026-03-20) gives Isha 19:36 at 00:00Z, 13:36 at 06:00Z, 07:36 at 12:00Z and 01:36 at 18:00Z; every non-midnight input fails its own validator (`eZ` 552-573, "Maghrib time is not before Isha"), so `calculatePrayerTimes` throws. **Correction to the first run:** that harness put `date` inside the config object, but the date is the *second* argument (978-980, 864-866). The package therefore computed "now" (2026-09-14, about 12:00Z) for all 12 cases, and that is why all 12 threw. The time-of-day bug still means the default `new Date()` call throws except at 00:00 UTC. Timezone handling: `U0`/`v()` are no-ops (342-348, 703-705), so output instants are UTC. The timezone validator regex `^[A-Za-z_]+\/[A-Za-z_]+$` (162) rejects three-part and hyphenated IANA names such as America/Argentina/Ushuaia and America/Port-au-Prince. Polar: `WZ` (649-653) labels Tromsø 21 Dec "Sun never sets (polar day)" (it is polar night) and returns Invalid Date where the endpoint gives 06:28/16:56 |
| arshadhs/cc_parser_timetable `moon_sighting.py` | not an implementation: a **client** that scrapes `https://www.moonsighting.com/praytable.php` for Cambridge (52.2178, 0.0662) and parses the HTML table |

### 4.13 adhan-derived copies (for completeness; adhan itself is audited elsewhere)

- **`adhan-extended` 6.1.0** (meypod fork, MIT).
  - Read in full: lib/cjs/PrayerTimes.js (208) and CalculationMethod.js (109). Every other lib/cjs file was
    diffed against adhan 4.4.6's lib/cjs with blank lines, comments and Babel helpers normalised.
  - The MC algorithm is adhan's. 1/7 applies at `coordinates.latitude >= 55`, signed, so never in the south
    (72-75, 96-99). Fajr is the later and Isha the earlier of that and the seasonal time (77-89, 101-113).
  - Difference 1: the MC `methodAdjustments` add `sunset: 3` (CalculationMethod.js:56-64), so the `sunset`
    field is sunset + 3 (131, 137).
  - Difference 2: it **lacks adhan 4.4.6's International Date Line guard** in `approximateTransit` (adhan's
    `expectedTransit` block). UNVERIFIED impact near ±180° (not run for Kiritimati or Pago Pago).
  - Difference 3: `dateByAddingDays` uses `setDate` plus an hour-stepping loop (DateUtils.js).
  - Difference 4: `SunnahTimes` gains a `MidnightMethod`.
- **`namaz` 4.4.0** (goharanwar fork of adhan-js, MIT).
  - Read in full: `package.json` `main` is `Adhan.js`, the webpack bundle (1167 lines). Also src/PrayerTimes.js
    (369), src/CalculationMethod.js (86) and src/Astronomical.js (334); these match the bundle.
  - The MC path is adhan 4.x's, with these differences:
    1. Isha seasonal is General only; there is no shafaq parameter (Astronomical.js:287-311).
    2. The public `dhuhr` is the rounded Dhuhr + 1 min + 4 s (PrayerTimes.js:191; bundle 817), with
       `zawal` = Dhuhr − 4. So Dhuhr reads +1 against the endpoint. It also adds ishraq (−1.4°) and asrMakruh
       (−2.3°) extras.
    3. Polar resolution mutates the caller's Date (`this.date.setTime`, 55; bundle 698).
    4. No International Date Line guard.
- **`@calgiellc/azan` 1.3.0** (CalgieLLC, MIT).
  - Read in full (lib/cjs): core/prayer-times.js (543), core/solar-time.js (100), core/solar-coordinates.js
    (88); astronomical/index.js (48), astronomical.js (13), solar-calculations.js (231), time-calculations.js
    (151), julian-day.js (65); calculation/calculation-method.js (101), calculation-parameters.js (97);
    utils/date-utils.js (118), time-components.js (27), cache.js (136); types/polar-circle-resolution.js (92),
    shafaq.js (17); azan.js (444).
  - The MC path is adhan's, split into methods (`calculateFajrTime` 159-172, `calculateSafeFajr` 179-186,
    `calculateIshaTime` 193-209, `calculateSafeIsha` 216-223), with shafaq. SolarTime, SolarCoordinates,
    julianDay and dayOfYear are LRU-memoised.
  - No International Date Line guard (time-calculations.js:39-46).
  - **Packaging defect:** `package.json` `main` and `exports.require` point to `lib/cjs/Azan.js`, and `types`
    to `lib/types/Azan.d.ts`. The tarball (`tar tzf calgiellc-azan-1.3.0.tgz`) holds only `lib/cjs/azan.js`,
    in lower case. `require('@calgiellc/azan')` can therefore resolve only on a case-insensitive filesystem;
    it worked on this Mac. Failure on Linux is UNVERIFIED (not run there).
  - Not read in full: features/* (azan-app, prayer-time-notifier, prayer-times-calendar/-batch/-formatter/
    -worker/-worker-api, calculation-method-comparator, prayer-adjustments, location-manager, qibla-compass),
    utils/i18n.js and utils/hijri-date-utils.js. Grep shows they construct `PrayerTimes` from core or format
    it; they compute no Fajr/Isha of their own. `prayer-adjustments` offers opt-in user offset profiles.
- `react-native-adhan` (wraps adhan-swift and adhan-kotlin).
- **`prayers-call` 1.7.0** (whiterocktech, MIT; dist/index.mjs, 857 lines, read in full).
  - Depends on `adhan ^4.4.3`. `Methods.MOONSIGHTING_COMMITTEE` maps to `CalculationMethod.MoonsightingCommittee()`
    (156-157).
  - Sets `highLatitudeRule` = MiddleOfTheNight (unused by adhan's MC path) and `polarCircleResolution` =
    Unresolved (141-142).
  - Adds 30 min to Isha in Ramadan only for UmmAlQura or when `adjustForRamadan` is set (295-310, 375).
  - `CountryMethods.GBR` = [NorthAmerica, MWL, MoonsightingCommittee] (823). Times equal adhan's.
- **`adhanline` 0.1.2** (abdalhalimalzohbi, MIT; dist/prayer/calculate.js, 52 lines, read in full).
  - Uses `adhan ^4.4.3` and luxon. Builds a local `new Date(y, m-1, d)`, calls adhan, then formats in the
    location's IANA zone (27-51). Times equal adhan's.
- **`@tawfeeqmartin/fajr` 1.9.3** (MIT; depends on `adhan ^4.4.3`).
  - src/index.js (233) and src/methods.js (122) read in full; engine.js (3385) read in pages, see below.
  - engine.js selects `adhan.CalculationMethod.MoonsightingCommittee()` as the country default for the UK
    (1168-1172), Ireland (1802-1806), China and Mongolia (1893-1900), and for an explicit
    `method: 'MoonsightingCommittee'` (2590-2591).
  - **engine.js is now read in full** (3385 lines, in six pages; src/validity.js, 260 lines, also read in full).
    On top of adhan, `prayerTimes` (2751-3183) makes four changes:
    1. It forces `rounding = None`, then rounds each prayer its own way (`roundIhtiyat`, 2722-2736): Fajr,
       Dhuhr, Asr, Maghrib, Isha and sunset **up**, Shuruq **down** (3027-3037).
    2. It **auto-applies an elevation correction from its city registry** (`src/data/cities.json`): Shuruq
       earlier and Maghrib/sunset later by `acos(R/(R+h))·4/cos φ` minutes (3158-3163, 3198-3243). London's
       registry row has 11 m (0.68 min); Bradford has 110 m (2.28 min) and `methodOverride:
       'MoonsightingCommittee'`.
    3. Norway gets MWL + MiddleOfTheNight, not MC (1379-1392).
    4. It adds notes and validity warnings, which do not change times.
  - Everything else is metadata: country bounding boxes (33-785), Asr-convention labels and `detectLocation`.
  - Run with `impls/run_fajr.mjs`, output `impls/fajr_run.txt`. The package is unmodified; its `adhan` import
    resolves to the extracted adhan 4.4.6 through a symlink in the scratch copy. Diffs are Fajr / Sunrise /
    Dhuhr / Maghrib / Isha against the endpoint:

    | Case | Diffs | Notes |
    |---|---|---|
    | London 03-20 | 0/−1/0/+1/0 | UK default equals explicit MC |
    | London 06-21 | +1/−1/+1/+1/+1 | |
    | London 09-22 | +1/−1/+1/+1/0 | |
    | London 12-21 | 0/−2/0/+2/+1 | |
    | Oslo 03-20 (explicit MC) | 0/−3/+1/+3/+1 | |
    | Oslo 06-21 (explicit MC) | 0/−3/0/+2/+1 | |
    | Oslo 12-21 (explicit MC) | 0/−2/+1/+2/0 | Oslo's registry elevation is 23 m (1.23 min) |
    | Oslo, default dispatch (MWL + MiddleOfTheNight) | Fajr −49 to −111; 21 Jun Isha 01:19 | |
    | Tromsø 03-20 and 09-22 (explicit MC) | 0/+1 | |
    | Tromsø 21 Dec (explicit MC) | Invalid Date | The endpoint has 06:28/16:56 |

  - Verdict: adhan's numbers shifted by up to ±1 min of rounding and by up to 3 min of registry elevation.
    That is not a faithful copy of the published tables; the site applies neither correction.
- Rust `salah` (insha, adhan port); pub.dev `adhan_dart`, `prayers_times` (MohamedAshraf701, adhan port),
  `pray_calc_dart` (port of pray-calc).

### 4.14 Run results: London, Oslo, Tromsø on 2026-03-20, 06-21, 09-22, 12-21

- Scripts: `impls/run_js_impls.mjs` (unmodified packages from the tarballs, or `impls/npmrun/node_modules` for
  pray-calc and @misque; Musallah via `impls/musallah_prayerCalc.transpiled.mjs`, an esbuild 0.25.10 type-strip);
  `impls/run_libmuslim.c` (compiled `cc -std=c11 -O2`); `impls/port_islamic_network.py`;
  `impls/merge_impl_table.py`.
- Output: `impls/impl_table.txt` and `impls/impl_table.json`; raw `impls/js_impls.json` and `impls/libmuslim.json`.
- Reference: endpoint m0 (Shafaq General). Shafaq "general" wherever the API exposes it.

Endpoint values (Fajr/Isha):

| | 03-20 | 06-21 | 09-22 | 12-21 |
|---|---|---|---|---|
| London | 04:30/19:31 | 02:43/22:42 | 05:13/20:16 | 06:22/17:32 |
| Oslo | 04:43/19:49 | 03:10/23:28 | 05:25/20:34 | 07:32/16:55 |
| Tromsø | 04:04/19:20 | `-----`/`-----` | 04:45/20:05 | 06:28/16:56 |

Fajr / Isha diffs against the endpoint (minutes). "polar" means the endpoint cell is `-----`, so no diff exists;
the implementation's raw output is shown instead.

| Implementation | L 03-20 | L 06-21 | L 09-22 | L 12-21 | O 03-20 | O 06-21 | O 09-22 | O 12-21 | T 03-20 | T 06-21 | T 09-22 | T 12-21 | Dhuhr / Maghrib offset |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| islamic-network family (PORT; kskhan77, mawaqit, muballighapp, adamarnap) | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | **−83/+37** | 0/0 | 0/0 | 0/0 | polar: 22:31/02:08 | −1/+1 | **+203/−207** | −5 / −3 |
| AlAdhan API method 15 (live islamic-network) | 0/0 | 0/+1 | 0/0 | 0/0 | 0/0 | −83/+38 | 0/+1 | 0/0 | 0/0 | polar: 22:30/02:09 | −1/+1 | +203/−207 | −5 / −3 |
| @praytime/core 1.0.1 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | −83/+37 | 0/0 | 0/0 | 0/0 | polar: 22:31/02:08 | −1/+1 | +203/−207 | −5 / −3 |
| pray-calc 2.4.0 `Methods.MSC` | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | −83/+37 | 0/0 | 0/0 | 0/0 | NaN | −1/+1 | NaN | −2..−3 / −3 |
| adhan 4.4.6 (reference), adhan-extended 6.1.0, @calgiellc/azan 1.3.0 (identical) | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | −1/0 | 0/0 | 0/0 | 0/0 | Invalid Date | −1/0 | Invalid Date | 0 / 0 |
| namaz 4.4.0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | −1/0 | 0/0 | 0/0 | 0/0 | Invalid Date | −1/0 | Invalid Date | +1 (public `dhuhr` = Dhuhr + 1 min 4 s, src/PrayerTimes.js:191) / 0 |
| Musallah prayerCalc.ts | 0/−1 | 0/−1 | 0/−1 | −1/0 | −6/**+23** | −1/0 | −5/**+23** | **−50/+52** | −1/+21 | null | −1/+22 | null | 0..−1 / −1..0 |
| libmuslim CALC_MOONSIGHTING | −20/+36 | +57/−14 | −21/+37 | −23/+26 | −49/+68 | −1/+3 | −50/+68 | −60/+63 | −138/+165 | polar: 02:36/22:59 | −148/+164 | −28/+28 | −5 / 0 |
| @islam-kit/prayer-times 1.0.0 | −20/+35 | −72/−8 | −81/−21 | −23/+25 | −49/+66 | −109/−11 | −111/+12 | −60/+62 | −137/+157 | Invalid | −208/+113 | 0/0 | summer −65 (DST not applied) |
| salat-first 1.0.4 | −24/+24 | Invalid | −70/−18 | −21/+28 | −51/+53 | Invalid | −98/+13 | −57/+64 | −133/+137 | Invalid | −187/+105 | +3/+2 | host-clock output (`setHours` on UTC-hour values) and no equation of time |
| @misque/prayer-times 0.2.1 | +217/−203 | +199/−279 | +159/−260 | +336/−334 | +253/−238 | +171/−292 | +196/−294 | +283/−280 | +359/−341 | 05:00/18:32 | +299/−394 | +314/−314 | Fajr after sunrise in all 12 cases: unusable |
| masjiduna-waqt 1.0.2 `computePrayerTimes` (rerun 2026-09-14 with the six-key adjustments) | −21/+36 | −101/+140 (both 01:02, middle of night) | −21/+36 | −23/+25 | −49/+68 | −112/+110 (both 01:18) | −51/+68 | −60/+62 | −138/+164 | undefined (sun never reaches altitude) | −149/+162 | 0/0 | −1..0 / −1..0 |
| @masaajid/prayer-times 1.0.1, first harness (date inside config, so "now" was computed) | throws | throws | throws | throws | throws | throws | throws | throws | throws | throws | throws | throws | – |
| @masaajid/prayer-times 1.0.1 `calculateEngine(config, Date at 00:00 UTC)` (rerun 2026-09-14) | 0/+5 | 0/**+70** | 0/+5 | 0/0 | 0/+6 | −1/0 | 0/+6 | 0/0 | 0/+6 | Invalid Date | −1/+7 | Invalid Date ("polar day") | 0 / +1 |

Readings:
- **London.** Everything that implements the seasonal function agrees with the endpoint to ±1 on Fajr and Isha
  at all four dates.
- **Offsets.** Only adhan and its copies also match Dhuhr (+5) and Maghrib (+3).
- **Oslo on 21 Jun.** This is where the 1/7 bound decides, and it separates the islamic-network family (−83/+37)
  from adhan and the endpoint.
- **Tromsø on 21 Dec.** The polar-night 18° rule separates everyone: the endpoint gives 06:28/16:56; adhan gives
  Invalid; the islamic-network family gives clamped nonsense. @islam-kit happens to print 06:28/16:56 because it
  is a plain 18° method.

---

## 5. npm packages claiming the method

Search, all on 2026-09-14:
- `npm search --json` for `moonsighting`, `moonsighting committee`, `MoonsightingCommittee`, `moon sighting prayer`,
  `prayer times fajr isha seasonal`, `khalid shaukat`, `seasonal adjustment prayer`, `adhan`, `prayer times` and
  `praytime` (`impls/npmsearch_*.json`).
- `gh search code` for `MoonsightingCommittee` (816 hits), `seasonAdjustedMorningTwilight` (121),
  `seasonAdjustedEveningTwilight` (121), `moonsighting.com fajr` (138) and `SHAFAQ_ABYAD` (24)
  (`impls/ghcode_*.json`).
- A tarball sweep of 40 candidates grepping for `28.65|moonsighting|seasonAdjusted|shafaq|abyad|Shaukat`
  (`impls/npm/sweep.sh`).
- Weekly downloads from `https://api.npmjs.org/downloads/point/last-week/<pkg>`.

Summary table (`impls/npm_table.txt`):

| Package | Author / repo | Licence | Last publish | Weekly dl | Algorithm lineage | Committee | London 06-21 F/I | London 12-21 F/I |
|---|---|---|---|---|---|---|---|---|
| adhan 4.4.6 (reference) | Batoul Apps, github.com/batoulapps/adhan-js | MIT | 2026-08-31 | 26,697 | adhan's own (booklet coefficients) | Shaukat / moonsighting.com | 0/0 | 0/0 |
| pray-calc 2.4.0 | Aric Camarata, github.com/acamarata/pray-calc | MIT | 2026-08-22 | 150 | **independent** TS (getMSC.ts); MSC is a comparison entry only | Shaukat (cites moonsighting.com) | 0/0 | 0/0 |
| adhan-extended 6.1.0 | meypod, github.com/meypod/adhan-js | MIT | 2023-09-09 | 71 | adhan fork | Shaukat via adhan | 0/0 | 0/0 |
| react-native-adhan 1.0.5 | maxto024 | MIT | 2025-08-03 | 32 | wraps adhan-swift / adhan-kotlin | via adhan | not run (native module) | not run |
| @masaajid/prayer-times 1.0.1 | farhansyah, github.com/masaajid-hub/prayer-times | MIT | 2025-09-17 | 22 | adhan-inspired ("alternative implementation to adhan.js") with seasonal fallback; **Abyad coefficients on the General Isha path**; throws unless the Date is 00:00 UTC (§4.12) | README calls it "UK Moonsighting Committee"; code uses Shaukat coefficients | 0/**+70** (00:00 UTC input); throws otherwise | 0/0 (00:00 UTC input) |
| @tawfeeqmartin/fajr 1.9.3 | Tawfeeq Martin | MIT | 2026-05-15 | 17 | depends on `adhan` (`CalculationMethod.MoonsightingCommittee()`) | via adhan; its "Shaukat 2002" is a **crescent-visibility** criterion, not prayer times | = adhan (not separately run) | = adhan |
| @islam-kit/prayer-times 1.0.0 | asadkomi.dev, github.com/asadkomidev/islam-kit | MIT | 2026-01-07 | 13 | **mislabelled**: 18°/18° | none | −72/−8 | −23/+25 |
| @calgiellc/azan 1.3.0 | CalgieLLC, github.com/calgiellc/azan-npm | MIT | 2026-01-05 | 12 | adhan derivative | via adhan | 0/0 | 0/0 |
| salat-first 1.0.4 | elkhiari (no repo) | MIT | 2025-05-07 | 7 | adhan-style names over its own simplified engine (declination series, no equation of time, host-clock output); MC = 18/18 + 5/3; seasonal helpers never called | none effective | Invalid | −21/+28 |
| masjiduna-waqt 1.0.2 | arafathusayn (preinstall URL: github.com/arafathusayn/masjiduna-waqt) | AGPL-3.0 | 2026-02-26 | 5 | adhan-derived TS rewrite; seasonal exported, not applied; preinstall downloads an unchecksummed binary (§4.12) | none effective | −101/+140 (middle of night) | −23/+25 |
| namaz 4.4.0 | Gohar Anwar, github.com/goharanwar/adhan-js | MIT | 2023-12-23 | 4 | adhan fork (general Isha only) | via adhan | 0/0 | 0/0 |
| adhanline 0.1.2 | abdalhalimalzohbi | MIT | 2026-05-22 | 4 | depends on `adhan` | via adhan | = adhan | = adhan |
| @praytime/core 1.0.1 | dwekat `<mudwekat@gmail.com>`, **no repository** | GPL-3.0-or-later | 2026-02-16 | 3 | **TS port of islamic-network** (method table identical incl. MWL "Goodge Street" coordinates; `computeDyy` replicates the PHP off-by-one: `calendarDiff > 0 ? calendarDiff − 1 : 365 + calendarDiff`, dist/index.js:44) | Shaukat via islamic-network | 0/0 | 0/0 |
| prayers-call 1.7.0 | whiterocktech | MIT | 2023-10-27 | 3 | depends on `adhan` | via adhan | = adhan | = adhan |
| @misque/prayer-times 0.2.1 | misque-dev, github.com/misque/misque | MIT | 2026-01-10 | 2 | own code; MC = 18/18 + adjustments; output broken | none effective | +199/−279 | +336/−334 |

Checked and not implementing MC: `praytime` 3.2.0 (Zarrabi, 95 weekly), `islamic-utils` 1.1.1 (keywords mention
"Moon sighting"; no MC code), `@fehu-zone/islamic-calendar-authority` (metadata only; cites
`moonsighting.com/fajr-isha.html` for Karachi's 18° and lists moonsighting.pk), `@jauza/core`,
`@alighamdan/prayertimes`, `@azkal182/islamic-utils`, `@danishfareed/ramadan-timings`, `@mahbub_ali/prayer-times`,
`@muslims-community/prayer-times-calculation`, `@shkomaghdid/react-native-prayer-times`, `@sofiakb/nemaaz`,
`@thani-sh/prayer-time-se`, `adhan-clock`, `beautiful-salat`, `muwaqqit`, `praye.js`, `prayertiming`,
`praytimess`, `salah`, `salah-calculator`, `salat-times-calculator`, `somali-date`, `tauqeet-js`, `time-pray`,
`noobot-islam`. None had MC markers in the tarball grep.

---

## 6. Other registries

- **Packagist** (`packagist.org/search.json?q=moonsighting`, 2026-09-14): `islamic-network/prayer-times-moonsighting`
  (19,344 in search, 19,362 on the package page) and `muballigh/moon-sighting` (210). Nothing else.
- **pub.dev** (`pub.dev/api/search?q=moonsighting`):
  - `pray_calc_dart` 1.2.1 (2026-08-22, port of pray-calc, "MCW seasonal model").
  - `adhan_dart` 2.0.1 (adhan port).
  - `prayers_times` 0.0.6 (2023-11-24, adhan port).
  - `moon_sighting` (crescent visibility, not prayer times).
  - Not run.
- **crates.io**: `mawaqit` 0.4.0 (§4.9), `salah` 0.7.6 (adhan port, 11,256 downloads), `salati` 0.0.1
  (2022), `salatui`. Not run (no `cargo`).
- **PyPI**: the HTML search page returned no parseable results (JS/anti-bot). UNVERIFIED. GitHub code search
  surfaced only `alphahm/adhanpy` (adhan port), `wailay/piazan` (§4.12), `HETHAT/aladhan.py` (AlAdhan client)
  and `arshadhs/cc_parser_timetable` (praytable scraper, §4.12).

---

## 7. Committee tracing

- Every seasonal implementation in this report carries the booklet §11 coefficients exactly (75/62 bases, the
  /55 latitude scaling, the 91/46/46/46/46/91 day segments).
  - The PHP family credits Syed Khalid Shaukat and ships his booklet.
  - pray-calc cites moonsighting.com, Musallah cites Shaukat by name, and adhan lineage ports cite
    moonsighting.com or adhan.
- None implements the Central Hilal Committee of North America, HM Nautical Almanac / "HMB", or
  moonsightinguk.github.io rules.
- Name collisions seen:
  - `amrojjeh/Moonsighting` ("follows Central Hilal Committee of North America"): dates, not prayer times.
  - `moonsightinguk/moonsightinguk.github.io`: UK Moonsighting website, no code.
  - `@fehu-zone` authority metadata: moonsighting.pk, Pakistan's Ruet-e-Hilal.
  - `@masaajid`'s README label "UK Moonsighting Committee" for code that uses Shaukat's coefficients.
  - `@tawfeeqmartin/fajr`'s "Shaukat 2002" crescent criterion.

---

## 8. Open questions and UNVERIFIED items

1. **Root cause of the www `time_json.php` 500.** The body is empty. Only the owner can confirm, and whether it
   will be fixed is unknown.
2. **Source of the bukhamsin and www generator.** It is not public. §2.9 reverse-engineers its rules to ±1
   minute. Its sun-position algorithm is inferred from the pray.php credit and the warning line numbers.
3. **DST sampling instant.** Bounded to [00:00, 01:00) UTC of the next day by measurement (§2.10); the code is
   unseen.
4. **The polar edge.** Longyearbyen Feb 16 to Mar 1 and Tromsø Nov 27 do not fit the model. The generator's
   sunrise existence test near the polar-night boundary differs from a plain `|cos| ≤ 1`.
5. **The >60° rules.** Whether any moonsighting.com product (Sky Prayers apps, older Wayback captures of
   praytable.php from 2016-2024) implements how-we.html's slide to 60° or faq_pt 1.2's 0.1° walk. The 17
   praytable captures were not diffed.
6. **Rate limits, terms and uptime.** No terms found, no Wayback history for either JSON endpoint, no stress
   test.
7. **Runtime outputs not measured:** arahmancsd (C#), RagibHasin/adhaan and sniper1720/mawaqit (Rust),
   `pray_calc_dart`, `adhan_dart`, `prayers_times`, react-native-adhan. Their formulas were read statically.
8. **AlAdhan against the port.** Three general Isha values differ by +1. Whether AlAdhan runs a newer build than
   the 1x.ax sources is unknown.
9. **Upstream licences.** islamic-network/prayer-times ships an LGPL-3.0 LICENSE while composer.json says
   GPL-3.0-or-later. prayer-times-moonsighting has no LICENSE file.
10. **Author identity.** Whether `abukhams` and `ambu50` are the same person as the pray.php credit is very
    likely (same name) but not formally verified.
11. **McMurdo polar-edge values** (§2.7b). The identical after-midnight Fajr/Isha runs and the 30-105 min Isha
    offsets are unexplained. A middle-of-night fallback is an inference only.
12. **Morocco after 2026-09-20.** Which tz rule is correct depends on real-world policy after today's date. The
    endpoint's PHP timezonedb version is unknown.
13. **@calgiellc/azan on Linux.** The `main`/`exports` case mismatch was proven by tarball listing, not by a run
    on a case-sensitive filesystem.
14. **The International Date Line guard** missing from adhan-extended, namaz and calgiellc. Its effect near
    ±180° was not run (Kiritimati, Pago Pago).
15. **@tawfeeqmartin/fajr outside the four test cities.** Its registry elevation varies by city (Bradford 110 m
    → 2.28 min). Only London, Bradford, Oslo and Tromsø were run.
16. **Sky Prayers apps** (the developer's own apps linked from pray.php) were not examined. They may carry the
    same generator.

---

## 9. Files index

| Path | What |
|---|---|
| `~/athan-research/impls/probe.py`, `probe.log`, `probe.stdout` | all endpoint probes (groups www, ptedge, bk, hilat, wayback, aladhan, extra, dst) |
| `~/athan-research/endpoint/` | cached bodies (`<host>_<city>_<year>_m<method>[_extra].json/html`) and `probes/*.meta.json`, `*.headers.txt` |
| `~/athan-research/impls/port_islamic_network.py` | PORT of islamic-network moonsighting and host (self-tests against the repo's tests) |
| `~/athan-research/impls/compare_port_endpoint.py`, `.txt`, `.json` | port against endpoint, all days |
| `~/athan-research/impls/rules_model.py`, `.txt`, `.json` | how-we rules hypothesis test (§2.9) |
| `~/athan-research/impls/praytable_vs_timejson.py`, `.txt` | site tables against endpoint (§3.1) |
| `~/athan-research/impls/booklet_vs_endpoint.py`, `.txt`, `booklet-fajr-isha.txt` | booklet tables (§3.2) and extracted booklet text |
| `~/athan-research/impls/dst_transitions.txt` | DST defect evidence (§2.10) |
| `~/athan-research/impls/highlat_strings.txt` | high-latitude string runs (§2.7) |
| `~/athan-research/impls/run_js_impls.mjs`, `js_impls.json`, `musallah_prayerCalc.transpiled.mjs` | JS/TS implementation runs |
| `~/athan-research/impls/run_libmuslim.c`, `run_libmuslim`, `libmuslim.json` | libmuslim run |
| `~/athan-research/impls/merge_impl_table.py`, `impl_table.txt`, `impl_table.json` | §4.14 table |
| `~/athan-research/impls/npm/`, `npm_table.txt`, `npmsearch_*.json`, `ghcode_*.json`, `ghrepos_*.json`, `packagist_*.json`, `pubdev_*.json`, `crates_moonsighting.json` | registry searches and tarballs |
| `~/athan-research/impls/tls_bukhamsin.txt`, `whois_ahmedbukhamsin_sa.txt`, `gh_meta_others.txt` | host and repo metadata |
| `~/athan-research/src/{PrayerTimeAPI, islamic-network-prayer-times(-moonsighting), kskhan77-…, mawaqit-…, muballighapp-…, adamarnap-…, arahmancsd-PrayerTimesManager, RagibHasin-adhaan, sniper1720-mawaqit, acamarata-pray-calc, muslimtify-org-libmuslim, a-saab-PrayerTimes, salahapi-salahapi-php, wailay-piazan, Sherheryaar-Musallah}` | copied sources |
| `~/athan-research/impls/global_offsets.py`, `.txt` | global timezone sweep (§2.10b) |
| `~/athan-research/impls/south_analysis.py`, `.txt` | southern high latitudes and McMurdo DST (§2.7b); endpoint files `moonsighting.ahmedbukhamsin.sa_{capehorn,palmer,rothera,mcmurdo}_2026_m0.json` |
| `~/athan-research/impls/masaajid_instant_check.mjs` | @masaajid time-of-day dependence proof (§4.12) |
| `~/athan-research/impls/npm/@masaajid__prayer-times.formatted.js` | esbuild reformat of the minified bundle, used for line references |
| `~/athan-research/impls/run_fajr.mjs`, `fajr_run.txt` | @tawfeeqmartin/fajr run (§4.13); symlink `npm/@tawfeeqmartin__fajr/package/node_modules/adhan` → extracted adhan 4.4.6 |
| `~/athan-research/impls/js_impls.rerun.log` | 2026-09-14 rerun of `run_js_impls.mjs` (masjiduna harness fix, masaajid 00:00 UTC variant) |

---

## 10. Reading ledger (owner instruction: no truncation)

**Redone after the "NO TRUNCATION" instruction.** These were first read partially (grep, `.d.ts`, diffs or
excerpts) and then read in full, with the notes corrected where facts changed:
- libmuslim `prayertimes.h`
- arahmancsd C# (all MC files)
- RagibHasin/adhaan: all src files, including astrolabe/ops.rs, solar.rs and unit.rs, models/*, and
  vendored_tests/london_moonsightingcommittee.rs (709); also scripts/adapt-tests.ts, which vendors adhan's
  shared test JSON, and Cargo.toml (adhaan 0.3.0, MIT, jiff 0.2.23)
- sniper1720/mawaqit and pray-calc
- salahapi-php and piazan (facts changed: MWL fallback; zero angles)
- a-saab
- @praytime/core, @misque and @islam-kit
- masjiduna-waqt: dist/index.js, preinstall.js, waqt.js (facts changed: the harness error; the install-time
  download)
- @masaajid (facts changed: Abyad bug; time-of-day bug; the first-run date error)
- salat-first: all dist files that compute (facts changed: no equation of time; host clock)
- adhan-extended: PrayerTimes and CalculationMethod in full; the other cjs files by normalised diff against
  adhan 4.4.6
- namaz: bundle and src in full (Dhuhr +1:04)
- @calgiellc/azan: core, astronomical, calculation, utils and types
- prayers-call: dist/index.mjs; adhanline: calculate.js
- @tawfeeqmartin/fajr: engine.js, index.js, methods.js, validity.js, elevation.js, night.js and traveler.js
- Musallah: prayerCalc.ts, prayerCalc.test.ts, prayerTimes.ts, prayerTimes.test.ts, settingsStorage.ts and
  README
- PrayerTimeAPI: every source and config file (README, app.component.ts/html/css/spec, app.module.ts,
  main.ts, index.html, polyfills.ts, test.ts, environments, angular.json, tsconfig*, e2e/*, karma.conf.js,
  browserslist, .editorconfig, styles.css, tslint.json, .gitignore, HOW_TO_DEPLOY.sh, package.json,
  docs/index.html). Both built bundles `docs/main-es{5,2015}.*.js` were searched and every URL extracted. The
  only data URL is `https://moonsighting.ahmedbukhamsin.sa/time_json.php?year=&tz=&lat=&lon=&method=&both=&time=`,
  with defaults lat 21.42664, lon 39.82563, method "0", both false, format "0", and tz from
  `Intl.DateTimeFormat().resolvedOptions().timeZone`.

**Covered by an identical copy or a full diff rather than a separate read.**
- islamic-network Method.php and DMath.php: identical to the muballighapp copies apart from namespaces
  (diffed).
- mawaqit prayer-times: code diff against islamic-network.
- namaz src/Astronomical.js and src/PrayerTimes.js: equal to the bundle's concatenated modules.
- masjiduna dist/index.cjs: equal to dist/index.js apart from module syntax (76 changed lines, all
  import/export).

**Deliberately not read in full, with the reason.**
- Musallah app screens, components, scripts and data (app/*.tsx, src/components/*, scripts/*,
  src/data/places.json, about 75 k lines). Grep shows the only code that computes prayer times is
  prayerCalc.ts, with prayerTimes.ts as its memo wrapper and settings.tsx/settingsStorage.ts as option
  plumbing (default method moonsighting, madhab hanafi, shafaq general). Note: `computePrayerSchedule`
  renders times in the *device's* zone (`Date` plus `hhmm`), not the location's.
- @calgiellc/azan features/* (azan-app, notifier, calendar, batch, formatter, worker, worker-api,
  comparator, prayer-adjustments, location-manager, qibla-compass), utils/i18n and hijri-date-utils, bin/,
  and the esm/bundles duplicates of the cjs files. They construct or format `PrayerTimes` from core and
  compute no Fajr/Isha (grep).
- @tawfeeqmartin/fajr hilal.js, lunar.js, hijri*.js, qibla.js, locale.js and features.js (crescent, calendar
  and labels, no prayer-time computation). The data files cities.json (queried for UK rows) and
  umm-al-qura-tabular.* are not code.
- The npm packages listed as "checked and not implementing MC" in §5: tarball grep only, with no MC markers.
- Lockfiles (PrayerTimeAPI package-lock.json, 16,480 lines; RagibHasin Cargo.lock), PrayerTimeAPI
  docs/3rdpartylicenses.txt (licence texts), polyfills/runtime bundles, favicons and mp3/png assets.
- RagibHasin vendored test files other than London MC (other methods) and astrolabe/qiblah.rs (Qibla).
- faq_pt.html: the full text extraction was read; the raw HTML markup was not read separately.
- Sky Prayers apps (§8 item 16).
