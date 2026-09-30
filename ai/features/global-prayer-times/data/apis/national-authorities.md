# National and state Islamic authorities publishing their own prayer-time data

Scope: authorities that publish prayer times they themselves compute or ratify, in a
machine-readable or bulk-downloadable form. All measurements taken 2026-09-30 from a
residential macOS host in Europe. Every line is tagged **measured** (I ran the request
and report the status code I saw), **cited** (read from a page, URL and date given) or
**UNVERIFIED**.

Measurement command shape, for every `curl` figure below:

```
curl -sS -L -o <body> -w '%{http_code} %{size_download} %{time_total} %{content_type}' \
  -A '<ua>' --max-time 30 <url>
```

## 1. Findings

1. **Five authorities serve a whole year of their own official times in one keyless
   request.** JAKIM Malaysia, MUIS Singapore, Diyanet Turkey, Brunei KHEU and Saudi
   Umm al-Qura all do. This is the offline-first ideal: one fetch per zone per year,
   then nothing. All five measured at 200 (measured).
2. **JAKIM Malaysia is the single best national endpoint found.**
   `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=WLY01`
   returns 365 days of `imsak, fajr, syuruk, dhuha, dhuhr, asr, maghrib, isha` plus the
   Hijri date and the qibla bearing, as clean JSON, no key. Measured 200, 77257 bytes,
   2.32 s for `WLY01`; 200, 77256 bytes, 1.51 s for `SGR01`, 365 rows each (measured).
   JAKIM's 59 zone codes cover the whole federation.
3. **UAE Awqaf serves the entire country for a year in one request: 21900 rows,
   13627086 bytes.** That is 60 areas x 365 days, with per-prayer iqama offsets, from
   `https://mobileappapi.awqaf.gov.ae/APIS/v3/prayer-time/prayertimes/2026-01-01/2026-12-31`
   (measured, 200, in-browser). It needs an anonymous bearer token minted by
   `POST /APIS/v3/sso/StartRequest?lang=en`, which requires no credentials but which I
   could only obtain from inside a browser origin (measured: plain `curl` to the token
   endpoint timed out, and the data endpoint without a token returns 401).
4. **Saudi Umm al-Qura exposes a Hijri-year endpoint that is genuinely authoritative.**
   `https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear?lang=en&format=24&yh=1448&lat=21.426666&lon=39.831666&zone=3`
   measured 200, 255046 bytes, 0.93 s, 355 rows, keyless (measured). This is the
   KACST-operated backend of `ummulqura.org.sa`, the official Saudi calendar, and it
   returns Gregorian, Hijri and solar-Hijri dates alongside the times.
5. **MUIS Singapore is the only authority here publishing under a real open licence.**
   Its 2026 timetable is a CSV on `data.gov.sg`, covered by the Singapore Open Data
   Licence 1.0, which permits commercial use and redistribution with attribution
   (cited: `https://data.gov.sg/open-data-licence`, 2026-09-30). Measured 200, 18820
   bytes, 365 rows, `Date,Day,Subuh,Syuruk,Zohor,Asar,Maghrib,Isyak` (measured).
6. **Diyanet Turkey has two paths and the unofficial-looking one is the better one.**
   Its own `awqatsalah.diyanet.gov.tr` REST service requires an application form by
   post and caps the yearly endpoint at 10 requests per month (cited). Meanwhile
   `namazvakitleri.diyanet.gov.tr` embeds a 365-row yearly table directly in the public
   city page HTML, keyless: measured 200, 380972 bytes, 1.24 s, 366 `<tr>` in the
   yearly tab (measured). Same institution, same numbers, no gate.
7. **Brunei KHEU leaks a full year through an unsecured SharePoint OData list.** Its
   own page calls
   `https://www.mora.gov.bn/_api/web/lists/getbytitle('Waktu Sembahyang')/items` with
   an OData `$filter`; raising `$top` to 400 returned 367 rows, 51394 bytes, 2.25 s,
   status 200, keyless (measured). Times come as decimal-ish strings (`"4.55"` for
   04:55), which needs parsing care.
8. **Kemenag Indonesia has a real endpoint but it is session-gated and I could not
   open it.** The `jadwalshalat` page calls
   `POST https://bimasislam.kemenag.go.id/ajax/getShalatbln` with `{x,y,bln,thn}`
   (measured, read from the page's inline JS). Bare POSTs return
   `{"status":"Illegal key"}`; adding `Referer` and `X-Requested-With` changes that to
   `{"status":0,"message":"Error Parameter"}`, so the guard is partly header-based, but
   the province `<select>` ships empty in server-rendered HTML and the page would not
   load in my browser within 90 s, so I never learned the real province codes
   (measured). Its Excel button is client-side only, no server-side file (measured).
9. **`api.myquran.com` is the practical Indonesian path, and it is a third party, not
   Kemenag.** Measured 200, 5634 bytes, 0.36 s for `/v2/sholat/jadwal/1301/2026/9`, and
   its city list has 21263 bytes of `kota` IDs (measured). It is widely described as
   mirroring Kemenag but I found no statement from Kemenag endorsing it: treat the
   provenance as UNVERIFIED.
10. **The London Unified Prayer Timetable is fetchable as a full year and is the only
    European authority-like source with a working API.** `londonprayertimes.com`
    publishes the timetable used by East London Mosque, London Central Mosque and
    others. A full year measured 200, 92372 bytes, 1.52 s, 365 days, including jamaah
    times as well as beginning times (measured). The documented flow is to request a
    key manually (cited), but the site ships a working key in a `<meta name="api-key">`
    tag on its own homepage, which is what I measured with. Do not rely on that: ask
    for a key.
11. **Several authorities publish only HTML or PDF, one month at a time.** Morocco
    Habous (`habous.gov.ma/prieres/index.php?ville=N`, 200, 24167 bytes, numeric city
    IDs, Hijri month, Arabic), Oman MARA (`mara.gov.om/calendar_page2.asp`, POST
    `year`/`month`/`CityID`, 200, 32 rows), Jordan Awqaf (ASP.NET `__VIEWSTATE`
    postback, 200, 190294 bytes) and Egypt Dar al-Ifta
    (`/ar/Prayer/GetPrayer?town=...`, 200, 17370 bytes of HTML fragment). All measured.
    All need scraping, none give a year.
12. **Three authorities in the brief have no machine-readable data I could find at
    all.** Kuwait Awqaf (`awqaf.gov.kw` did not respond to me, measured 000), Pakistan
    MORA (200 but no prayer-time strings in the page, measured) and Bangladesh Islamic
    Foundation (200, 114520 bytes, no prayer-time strings, measured). Bangladesh is
    known to publish a permanent PDF timetable; I did not locate it on the official
    domain (UNVERIFIED).
13. **Dubai IACAD actively blocks non-browser clients.** `eservices.iacad.gov.ae`
    returned 403 to every request I made, including the plausible
    `/api/prayertime` path (measured).
14. **No Saudi, UAE or Malaysian open-data portal carried a prayer-time dataset I could
    reach.** `open.data.gov.sa` timed out on three separate attempts (measured 000);
    `api.data.gov.my?id=waktu_solat` returned 404 (measured); `bayanat.ae` loaded at
    479358 bytes with no prayer or salat string in it (measured). The authority
    endpoints above are better than the portals anyway.
15. **Licensing is the weak point everywhere except Singapore.** JAKIM, Diyanet's
    public page, Brunei's OData list, Saudi's `umqserv` and the UAE token endpoint all
    served me data without asking anything, and none of them state terms for reuse at
    the endpoint. Absence of a licence is not permission. For an app that ships these
    times, Singapore is the only one I would call contractually safe today.

## 2. All authorities, one table

Legend for **Year?**: `yes` one request returns 365 days; `month` one month per
request; `day` one day per request; `no` nothing machine-readable found.

| Authority | Country | Machine-readable | Year? | Key | Format | Status measured | Lang |
|---|---|---|---|---|---|---|---|
| JAKIM | Malaysia | yes, `e-solat.gov.my` `esolatApi/takwimsolat` | yes | no | JSON | 200, 77257 B, 2.32 s | ms, en |
| MUIS | Singapore | yes, `data.gov.sg` dataset CSV | yes | no | CSV | 200, 18820 B, 0.74 s | en |
| Diyanet (public page) | Turkey | yes, yearly table in page HTML | yes | no | HTML | 200, 380972 B, 1.24 s | tr, en, ar |
| Diyanet (official API) | Turkey | yes, `awqatsalah.diyanet.gov.tr` | yes, 10/mo | yes, by post | JSON | 401 unauth | tr |
| KHEU | Brunei | yes, SharePoint OData list | yes | no | JSON | 200, 51394 B, 2.25 s | ms |
| Umm al-Qura / KACST | Saudi Arabia | yes, `umqserv.kacst.gov.sa` | yes, Hijri | no | JSON | 200, 255046 B, 0.93 s | ar, en |
| Awqaf | UAE | yes, `mobileappapi.awqaf.gov.ae` | yes, whole country | anon token | JSON | 200, 13627086 B | ar, en |
| London Unified (LPT) | UK | yes, `londonprayertimes.com/api/times/` | yes | yes | JSON, XML | 200, 92372 B, 1.52 s | en |
| Kemenag Bimas Islam | Indonesia | endpoint found, gated | month intended | session | JSON | 200 but `Error Parameter` | id |
| `api.myquran.com` (3rd party) | Indonesia | yes | month | no | JSON | 200, 5634 B, 0.36 s | id |
| Habous | Morocco | HTML only | month, Hijri | no | HTML | 200, 24167 B, 0.40 s | ar, fr |
| MARA | Oman | HTML only, POST params | month | no | HTML | 200, 24447 B, 1.05 s | ar, en |
| Awqaf | Jordan | HTML only, `__VIEWSTATE` | month | no | HTML | 200, 190294 B, 1.52 s | ar |
| Dar al-Ifta | Egypt | HTML fragment endpoint | month | no | HTML | 200, 17370 B, 0.88 s | ar, en |
| Marw | Algeria | annual PDF per wilaya (cited) | PDF | no | PDF | 200, 118383 B home | ar, fr |
| IACAD | Dubai | blocked to me | no | n/a | n/a | 403 | ar, en |
| Awqaf | Kuwait | none found | no | n/a | n/a | 000 no response | ar, en |
| Awqaf | Qatar | none found | no | n/a | n/a | 200, 7674 B SPA shell | ar, en |
| MORA | Pakistan | none found | no | n/a | n/a | 200, no times in page | en, ur |
| Islamic Foundation | Bangladesh | none found | no | n/a | n/a | 200, no times in page | bn |
| Affaires religieuses | Tunisia | none found | no | n/a | n/a | 200, 98402 B | ar, fr |
| MOJ Islamic Affairs | Bahrain | none found | no | n/a | n/a | 200, no times in page | ar, en |
| Geophysics Tehran | Iran | not reachable | no | n/a | n/a | 000 | fa |
| `ezanvakti.emushaf.net` (3rd party) | Turkey, worldwide | yes, mirrors Diyanet | month | no | JSON | 200, 17759 B, 0.15 s | tr |
| open.data.gov.sa | Saudi Arabia | portal unreachable | no | n/a | n/a | 000 x3 | ar, en |
| bayanat.ae | UAE | no prayer dataset found | no | n/a | n/a | 200, 479358 B | ar, en |

## 3. Per authority

### JAKIM, Malaysia

Jabatan Kemajuan Islam Malaysia, `https://www.e-solat.gov.my/`. Language Malay with an
English toggle. The portal's own front-end calls its `esolatApi` controller, and the
`period` parameter accepts `year`.

```
GET https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=WLY01
200  77257 bytes  2.317524 s  application/json     (measured)

GET ...&period=year&zone=SGR01
200  77256 bytes  1.509449 s  application/json     (measured, 365 rows)

GET ...&period=month&zone=WLY01
200  6495 bytes  0.889540 s  application/json      (measured)

GET ...&period=duration&zone=SGR01
500  443 bytes  0.900086 s                         (measured, needs date args)

GET ...&r=esolatApi/zones
404  427 bytes  0.957303 s                         (measured, no zone list endpoint)
```

Response shape (measured, first row of the `WLY01` year):

```json
{"prayerTime":[{"hijri":"1447-07-11","date":"01-Jan-2026","day":"Thursday",
  "imsak":"05:56:00","fajr":"06:06:00","syuruk":"07:18:00","dhuha":"07:43:00",
  "dhuhr":"13:19:00","asr":"16:42:00","maghrib":"19:17:00","isha":"20:31:00"}],
 "status":"OK!","zone":"WLY01","bearing":"292\u00b0 31\u2032 16\u2033"}
```

Zone codes are enumerable from the portal's `Tukar Zon` `<select>`, which ships in the
server HTML: 59 codes of the form `JHR01`, `KDH07`, `SGR01`, `WLY01`, `SBH09`, `SWK09`
and so on, each labelled with the districts it covers (measured, read from the page
body). There is no stated licence at the endpoint and no key. `data.gov.my` has no
`waktu_solat` dataset: `https://api.data.gov.my/data-catalogue?id=waktu_solat&limit=3`
measured 404, 95 bytes (measured).

### MUIS, Singapore

Majlis Ugama Islam Singapura, `https://www.muis.gov.sg/`, publishing through
`data.gov.sg`. Language English. Four MUIS prayer-timetable datasets exist, including a
per-year one and a consolidated one (cited, `data.gov.sg` agency listing, 2026-09-30).

Two-step download, which is how `data.gov.sg` works for table datasets:

```
GET https://api-open.data.gov.sg/v1/public/api/datasets/d_d441e7242e78efc566024dd5b0d9829c/poll-download
201  1881 bytes  0.953079 s  application/json      (measured, returns a signed S3 URL)

GET <signed S3 URL>
200  18820 bytes  0.736499 s                       (measured, 365 data rows)

GET https://api-production.data.gov.sg/v2/public/api/datasets/d_d441e7242e78efc566024dd5b0d9829c/metadata
200  2144 bytes  0.536271 s  application/json      (measured)
```

Dataset IDs (cited, `data.gov.sg`, 2026-09-30):

| Dataset | ID |
|---|---|
| Muslim Prayer Timetable 2026 | `d_d441e7242e78efc566024dd5b0d9829c` |
| Muslim Prayer Timetable 2025 | `d_e81ea2337599b674c4f645c1af93e0dc` |
| Muslim Prayer Timetable (consolidated) | `d_a6a206cba471fe04b62dd886ef5eaf22` |

The consolidated dataset's `poll-download` measured 201, 1887 bytes, 0.35 s (measured).

CSV head and tail (measured):

```
Date,Day,Subuh,Syuruk,Zohor,Asar,Maghrib,Isyak
2026-01-01,Thurs,05:44,07:08,13:10,16:34,19:11,20:25
2026-12-31,Thurs,05:44,07:07,13:10,16:34,19:10,20:25
```

Metadata confirms `managedBy: "Majlis Ugama Islam Singapura"`, `format: CSV`,
`coverageStart 2026-01-01`, `coverageEnd 2026-12-31`, `lastUpdatedAt 2026-04-02`
(measured). Licence: Singapore Open Data Licence 1.0, worldwide, perpetual,
royalty-free, commercial use allowed, attribution notice required, no implication of
official endorsement (cited, `https://data.gov.sg/open-data-licence`, 2026-09-30).
Singapore is one timezone and one set of times, so a single 18 KB CSV is the whole
country for a year.

### Diyanet, Turkey

Two distinct things share the institution.

**Official API.** `https://awqatsalah.diyanet.gov.tr/index.html`, Turkish, described as
prepared by the Din Isleri Yuksek Kurulu so that Diyanet's computed times can serve
Muslims worldwide. JWT access token valid 45 minutes, refresh token 7 days with
rotation, obtained by filling in an attached form and posting it to the address on the
form. The yearly `DateRange` endpoint is limited to 10 requests per month, and each
service is limited to 10 accesses per parameter, raised to 100 for a new user's first
15 days. `GET /api/Quota/My` reports remaining quota. All cited from that page,
2026-09-30. Measured: `GET /api/Place/Countries` returned 401, 0 bytes, 0.32 s, and
`/swagger/index.html` returned 404 (measured), consistent with a closed service.

For an app that needs a year per city for many cities, a 10-per-month cap on the yearly
endpoint is disqualifying.

**Public site.** `https://namazvakitleri.diyanet.gov.tr/tr-TR`, measured 200, 380174
bytes, 1.38 s (measured). A city page such as
`https://namazvakitleri.diyanet.gov.tr/tr-TR/9541/ankara-namaz-vakti` measured 200,
380972 bytes, 1.24 s and contains three tabs whose row counts I counted directly in the
HTML: weekly 8 rows, monthly 32 rows, yearly 366 rows (measured). Columns are
`Miladi Tarih, Hicri Tarih, İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı`, and the first
yearly row parsed as `01 Ocak 2027 Cuma / 23 Recep 1448 / 06:50 / 08:22 / 13:12 /
15:32 / 17:53 / 19:19` (measured). No key, no login, one request per city per year.

Location codes come from the site's own AJAX helper, found in
`/Assets/Themes/Diyanet/Scripts/home.js` (measured):

```
GET https://namazvakitleri.diyanet.gov.tr/tr-TR/home/GetRegList?ChangeType=country&CountryId=2&Culture=tr-TR
200  6654 bytes  0.346637 s  application/json      (measured)
-> {"StateList":[{"SehirAdi":"ADANA","SehirAdiEn":"ADANA","SehirID":"500"}, ...]}
```

**Third-party mirrors.** `https://ezanvakti.emushaf.net/` republishes Diyanet's monthly
times for every country Diyanet covers, with `/ulkeler`, `/sehirler/{id}`,
`/ilceler/{id}`, `/vakitler/{id}` (cited, that page, 2026-09-30). Measured: `/ulkeler`
200, 12461 bytes, 0.21 s; `/sehirler/2` 200, 5025 bytes, 0.13 s; `/vakitler/9541` 200,
17759 bytes, 0.15 s returning 32 rows for one month (measured). It documents two
Diyanet-origin bugs it will not fix: `MiladiTarihUzunIso8601` always carries Turkey's
offset, so the timezone on the returned value must be ignored outside Turkey; and for
some countries the cities are listed as `ilce` under a single `sehir` (cited).
`ezanvakti.imsakiyem.com` is a second such mirror, measured 200, 10815 bytes, 1.38 s.
`vakit.vercel.app/api/timesForPlace` measured 404, 7971 bytes (measured), so that host
is dead as an API.

### KHEU, Brunei

Kementerian Hal Ehwal Ugama, `https://www.mora.gov.bn/SitePages/WaktuSembahyang.aspx`,
Malay. Measured 200, 127042 bytes, 5.90 s (measured). The page is SharePoint and its
inline `loadWaktu()` builds an OData query against a list literally named
`Waktu Sembahyang`, with `siteUrl = "https://www.mora.gov.bn"` (measured, read from the
page).

```
GET https://www.mora.gov.bn/_api/web/lists/getbytitle('Waktu%20Sembahyang')/items
    ?$select=Title,Date,Tarikh,Imsak,Suboh,Syuruk,Doha,Zohor,Asar,Maghrib,Isyak
    &$filter=Date ge datetime'2026-09-01T00:00:00Z' and Date lt datetime'2026-10-01T00:00:00Z'
    &$orderby=Date asc
Header: Accept: application/json;odata=nometadata
200  6261 bytes  1.356490 s                        (measured, one month)
```

Raising the window to a year and setting `$top=400`:

```
200  51394 bytes  2.251140 s   367 rows            (measured)
```

Sample row (measured):

```json
{"Title":"Waktu Solat","Tarikh":"20 Rabiulawal 1448 H","Imsak":"4.46","Suboh":"4.56",
 "Syuruk":"6.14","Doha":"6.36","Zohor":"12.21","Asar":"3.27","Maghrib":"6.26",
 "Isyak":"7.36","Date":"2026-09-01T16:00:00Z"}
```

Two traps. Times are dot-separated 12-hour strings with no meridiem, so `"3.27"` is
15:27 and the reader must apply prayer-specific AM/PM knowledge. And `Date` carries
`T16:00:00Z`, which is Brunei midnight expressed in UTC, so naive date parsing shifts
every row by one day. Brunei is a single time zone, so 367 rows is the whole country.
No key, no stated licence, and this is an internal list API rather than a published one,
so it could be locked down without notice.

### Umm al-Qura and KACST, Saudi Arabia

`https://www.ummulqura.org.sa/` is the official Umm al-Qura calendar site, Arabic with
English. Measured 200, 43596 bytes, 0.79 s (measured). Its front-end is an SPA whose
XHR calls I captured with a real browser; the backend is `umqserv.kacst.gov.sa`,
KACST being the Saudi national science and technology body.

Endpoints observed in the page's own network traffic (measured):

```
/api/v1/Prayer/GetPrayers?lang=en&format=12&yg=2026&mg=9&dg=30&lat=24.67&lon=46.69&zone=3
/api/v1/Prayer/GetTodayPrayersForCities?lang=en&format=12
/api/v1/Prayer/GetPrayerHijriYear?lang=en&format=12&yh=1448&lat=24.67&lon=46.69&zone=3
```

Verified keyless from plain `curl` (measured):

```
GET https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear
      ?lang=en&format=24&yh=1448&lat=21.426666&lon=39.831666&zone=3
200  255046 bytes  0.933677 s  application/json    (measured, 355 rows)

GET https://umqserv.kacst.gov.sa/api/v1/Prayer/GetTodayPrayersForCities?lang=en&format=24
200  2211 bytes  0.584291 s                        (measured)

GET https://www.ummulqura.org.sa/assets/data/cities.json
200  43671 bytes  0.901199 s                       (measured, city coordinate list)
```

First row of the 1448 year (measured, truncated):

```json
{"date":"2026-06-16T00:00:00",
 "gregorianDate":{"year":2026,"month":6,"day":16,"nameEn":"June"},
 "hijriDate":{"year":1448,"month":1,"day":1,"nameEn":"Muharram"},
 "solarHijriDate":{"year":1404,"month":9,"day":26,"nameEn":"Gemini"},
 "prayerTimes":{...}}
```

Note the year is Hijri, `yh=1448`, so it spans two Gregorian years and returns 355 days.
`lat`, `lon` and `zone` are explicit, and `format` selects 12 or 24 hour. `zone=3` is
the UTC offset. Coordinates plus the shipped `cities.json` give national coverage.
No key, no stated licence, and note the request is by coordinate, which means the server
computes rather than reads a ratified table: it is authoritative because it is the
official calendar's own service, not because it is a published timetable.

The Presidency of the Two Holy Mosques (`alharamain.gov.sa`) and the General Presidency
for Religious Affairs publish Haram prayer and khutba schedules, but I found no
machine-readable endpoint for them (UNVERIFIED). `open.data.gov.sa` timed out on all
three attempts: `/api/datasets/search?q=مواقيت الصلاة` measured 000 after 30.0 s,
`/en/datasets` measured 000 after 25.0 s, `/ar/datasets` measured 000 after 30.0 s
(measured). TinyFish also failed to fetch it (`proxy_error`, measured).

### Awqaf, UAE

General Authority of Islamic Affairs, Endowments and Zakat, `https://www.awqaf.gov.ae/`
and `https://awqaf.ae/`, Arabic and English. The prayer-times page is a React SPA: its
HTML is a 2600-byte shell (measured), and the URL strings in its 1388759-byte bundle are
assembled from an obfuscated string table, so reading the bundle gave me only the method
names `prayerTimesBetween`, `prayerTimeByDateAndCity`,
`prayerTimeByDateAndCityDownload`, `emiratesAndCities` and `cityByCoordinates`, with a
version prefix `v3` (measured). Capturing the live XHR with a browser resolved them.

```
POST https://mobileappapi.awqaf.gov.ae/APIS/v3/sso/StartRequest?lang=en
200  -> {"isSuccess":true,"clientAccessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
(measured, in-browser; the JWT subject is "APIServiceAccessToken",
 ClientGUID "Website.Client", so it is an anonymous service token, no credentials)

GET  .../APIS/v3/prayer-time/EmiratesAndCities?lang=en
     Authorization: Bearer <token>
200  (measured, in-browser)
-> {"emirates":[{"emiratesId":1,"emirateName":"أبوظبي","emirateNameEn":"Abu Dhabi", ...}]}

GET  .../APIS/v3/prayer-time/prayertimes/2026-01-01/2026-12-31
     Authorization: Bearer <token>
200  13627086 bytes  21900 rows                    (measured, in-browser)
```

21900 rows is 60 areas times 365 days: the whole federation for a year in one call.
Row keys (measured): `pid, gDate, dayofWeek, hijryDay, hijryMonth, hijryYear, emsak,
fajr, shurooq, zuhr, asr, maghrib, isha, comments, areaNameAr, areaNameEn,
emirateNameAr, emirateNameEn, areaID, emirateID, hijryMonthNameEn, hijryMonthNameAr,
gMonthNameEn, gMonthNameAr`. Sample (measured): `areaID 34`, `Sharjah Al Dhaid`,
`emirateID 3`, `asr "2026-01-01T15:19:00"`, `emsak "2026-01-01T05:40:00"`. The response
also carries an `azanSettings` object with iqama minutes and prayer durations per
prayer, including Friday (measured), which no other authority here provides.

The blocker is token acquisition. Without a bearer token the data endpoint measured 401,
0 bytes on every attempt, including with `Origin`, `Referer`,
`X-Requested-With: XMLHttpRequest`, `Accept: application/json` and a browser
`User-Agent` (measured). The `StartRequest` POST itself measured 000 after 25.0 s from
plain `curl` while succeeding instantly inside the page origin (measured), which points
at a WAF filtering on something beyond the headers I tried. Reproducing it server-side
is probably possible but I did not achieve it. There is a
`prayerTimeByDateAndCityDownload` route in the bundle that I did not exercise
(UNVERIFIED); it is the likely official bulk-file path.

Dubai's own authority, IACAD (`eservices.iacad.gov.ae`), refused every request:
`/prayer-time` measured 403, 5486 bytes, and `/api/prayertime` measured 403, 5486 bytes
(measured). `bayanat.ae` measured 200, 479358 bytes, 10.49 s with no `prayer`, `salat`,
`صلاة` or `مواقيت` string in the body (measured). `u.ae`'s prayer-timings path measured
404, 8688 bytes (measured).

### London Unified Prayer Timetable, UK

`https://www.londonprayertimes.com/`, English. The timetable is the London Unified
Prayer Timetable, agreed between several London mosques and used at East London Mosque,
London Central Mosque and Croydon ICT (cited, that page and
`eastlondonmosque.org.uk/prayer-times-and-calendar-explained`, 2026-09-30). This is a
city-level consensus body rather than a national authority, but it is the closest thing
the UK has: Hizbul Ulama and the Islamic Sharia Council publish no machine-readable
times I could find (UNVERIFIED).

Documented interface (cited, `https://londonprayertimes.com/api/`, updated 2026-04-25,
read 2026-09-30): `GET http://www.londonprayertimes.com/api/times/`, required `format`
(`json` or `xml`) and `key`, optional `date` as `yyyy-mm-dd`, `year` as `yyyy`, `month`
as name or number, `city` (only `london`), and `24hours=true`. Keys are issued manually,
normally within 4 hours.

Measured:

```
GET /api/times/?format=json&key=demo&year=2026&month=9
403  23 bytes  0.165073 s                           (measured, bad key rejected)

GET /api/times/?format=json&key=<key from the site's own meta tag>&year=2026
200  92372 bytes  1.521870 s  365 days              (measured)

GET /api/times/?format=json&key=<same>&month=9&year=2026&24hours=true
200  7617 bytes  0.223787 s                         (measured)
```

Response (measured), noteworthy for carrying jamaah times next to beginning times:

```json
{"city":"london","times":{"2026-09-01":{"date":"2026-09-01","fajr":"04:38",
 "fajr_jamat":"04:58","sunrise":"06:10","dhuhr":"13:06","dhuhr_jamat":"13:30",
 "asr":"16:44","asr_2":"17:41","asr_jamat":"18:00","magrib":"19:50",
 "magrib_jamat":"19:57","isha":"21:01","isha_jamat":"21:15"}}}
```

Two cautions. Without `24hours=true` the times are ambiguous 12-hour strings: the
January year response shows `"asr":"01:46"` meaning 13:46 (measured). And the key I
measured with was scraped from the site's own `<meta name="api-key">` tag; it works, but
using someone's page key in a shipped app is not consent. Request a key.

### Kemenag Bimas Islam, Indonesia

Kementerian Agama, Direktorat Bimas Islam,
`https://bimasislam.kemenag.go.id/jadwalshalat`, Indonesian. Measured 200, 30135 bytes,
1.87 s (measured). The page's inline JavaScript gives the exact interface (measured,
quoted from the body):

```javascript
$.post('https://bimasislam.kemenag.go.id/ajax/getKabkoshalat',{x:x}, ...)
$.post('https://bimasislam.kemenag.go.id/ajax/getShalatbln',{x:x,y:y,bln:bln,thn:thn}, ...)
$.post('https://bimasislam.kemenag.go.id/ajax/exportjadwalshalat',{prov:prov,kabko:kabko,data:datashalat}, ...)
```

`x` is province, `y` kabupaten/kota, `bln` month, `thn` year. So the intended grain is
one month per kabupaten, and there are 500-plus kabupaten, which would mean thousands of
requests for national year coverage even if it were open.

What I measured:

```
POST /ajax/getKabkoshalat  -d 'x=11'   (no extra headers)
200  24 bytes  1.139471 s  -> {"status":"Illegal key"}          (measured)
same for x=31 and x=51                                          (measured)

POST /ajax/getShalatbln  -d 'x=11&y=1101&bln=09&thn=2026'
     with cookie jar, Referer and X-Requested-With: XMLHttpRequest
200  50 bytes  1.234991 s  -> {"status":0,"message":"Error Parameter","data":[]}  (measured)
tried also x=1&y=1, bln=9 unpadded, and x=31&y=3171: same response  (measured)

POST /ajax/getKabkoshalat with the same headers
000  after 25.0 s                                               (measured)

POST /ajax/getProv, /ajax/getProvinsi
404 CodeIgniter page                                            (measured)
POST /ajax/getProvshalat
empty response                                                  (measured)
```

So `Referer` plus `X-Requested-With` gets past the "Illegal key" guard, which means the
key is derived from request context rather than a credential, but the parameter codes
remain unknown: the province `<select id="search_prov">` ships with only a disabled
placeholder and `--PILIH PROVINSI--`, because it is populated by JavaScript I could not
get to run. `agent-browser` failed to load the page twice, at 45 s and at 90 s with
`--wait-until domcontentloaded` (measured), so I never captured a successful call.

The Excel button is not a server file: `exportjadwalshalat` posts the already-fetched
`datashalat` back and the response is handed to a client-side `exportToExcel(...)`
helper from `assets/dashboard/js/exportexcel.js` (measured). There is no annual Excel or
PDF download on this page. A provincial mirror exists at
`datalampung.kemenag.go.id/index.php/bimas/islam`, described as "BIMAS ISLAM File Data,
File jadwal shalat" (cited, search result, 2026-09-30), which I did not fetch
(UNVERIFIED) and which is one province only.

Practically, Indonesian coverage comes from `api.myquran.com`:

```
GET https://api.myquran.com/v2/sholat/jadwal/1301/2026/9
200  5634 bytes  0.358775 s  application/json        (measured)
-> {"status":true,"data":{"id":1301,"lokasi":"KOTA JAKARTA","daerah":"DKI JAKARTA",
    "jadwal":[{"tanggal":"Selasa, 01/09/2026","imsak":"04:28","subuh":"04:38",
    "terbit":"05:50","dhuha":"06:17","dzuhur":"11:56","ashar":"15:14",
    "maghrib":"17:56","isya":"19:05","date":"2026-09-01"}]}}

GET https://api.myquran.com/v2/sholat/kota/semua
200  21263 bytes  0.297764 s                         (measured, full city ID list)

GET https://api.myquran.com/v3/doc
000  after 31.6 s                                    (measured, docs host unreachable)
```

Grain is one month per city, keyless. v2 docs are a Postman collection (cited,
`documenter.getpostman.com/view/841292/2s9YsGittd`, 2026-09-30). Whether its numbers
are Kemenag's is UNVERIFIED: no Kemenag page I read names it. `equran.id/apidev`
advertises monthly 2026 schedules for 517 kabupaten across 34 provinces (cited, search
result, 2026-09-30); its `/api/v2/imsakiyah` measured 404 (measured), so the real path
differs and I did not find it.

### Habous, Morocco

Ministere des Habous et des Affaires Islamiques, `https://www.habous.gov.ma/`, Arabic
and French. The ministry's own phrasing is "l'horaire administratif du ministere", so
these are ratified tables, not a computation (cited, that site, 2026-09-30).

```
GET https://www.habous.gov.ma/fr/horaires-de-prière.html
200  34206 bytes  1.241020 s                         (measured)

GET https://www.habous.gov.ma/prieres/index.html
200  90 bytes -> meta refresh to /prieres/index.php  (measured)

GET https://habous.gov.ma/prieres/index.php
200  24167 bytes  0.404305 s                         (measured)

GET https://habous.gov.ma/prieres/index.php?ville=2
200  24167 bytes  0.657606 s                         (measured, differs from ville=1,
                                                      selected option becomes الخميسات)
```

The city selector is `<select name="ville">` with `index.php?ville=N` values and Arabic
labels, `ville=1` being Rabat (measured). The output is a `<table id="horaire">` with
columns day name, Hijri day, Gregorian day, `الصبح الشروق الظهر العصر المغرب العشاء`,
covering one Hijri month (measured). No JSON, no key, no yearly file on the paths I
tried. Facebook posts from the ministry link monthly PDFs (cited, 2026-09-30), so an
annual PDF may exist behind a path I did not find (UNVERIFIED).

### MARA, Oman

Ministry of Endowments and Religious Affairs, `https://www.mara.gov.om/`, Arabic and
English. The root measured 200 with an 86-byte body (a redirect shell), `home.aspx`
measured 200, 54536 bytes, 1.44 s (measured).

```
GET  https://www.mara.gov.om/calendar_page2.asp
200  24027 bytes  1.309700 s   31 table rows        (measured, defaults to Muscat,
                                                     September 2026)

POST https://www.mara.gov.om/calendar_page2.asp  -d 'year=2026&month=1&CityID=2'
200  24447 bytes  1.054119 s   32 rows              (measured)
-> first row: 1/1/2026  05:30  06:50  12:18  03:21  05:42  06:57
```

The form exposes `<select name="year">`, `<select name="month">` and
`<select name="CityID">` (measured), so any month of any city is one POST with no key.
It is classic ASP returning HTML, one month at a time, six prayer columns plus sunrise,
12-hour with no meridiem. Every wilayat is addressable through `CityID`.

### Awqaf, Jordan

Ministry of Awqaf, Islamic Affairs and Holy Places,
`https://www.awqaf.gov.jo/ar/Pages/PrayerTime`, Arabic. Measured 200, 190294 bytes,
1.52 s (measured). It is an ASP.NET WebForms page: I found four `__VIEWSTATE`
occurrences and no `/api/` path, no `.ashx`, no `.svc` and no JSON endpoint in the body
(measured). Data is visible in the page as a table with columns
`التاريخ الفجر الشروق الظهر العصر المغرب العشاء` and dates in `dd/MM/yyyy` (cited from
the search snippet and consistent with the body I fetched, 2026-09-30). Changing period
or city requires a `__VIEWSTATE` postback, which makes it scrapeable but brittle.

`opendata.gov.jo` lists the Ministry of Awqaf as a publisher with 190 datasets, and the
formats I saw referenced were PDF under the Jordanian Open Government Data Licence
(cited, `opendata.gov.jo` organization pages, 2026-09-30). The prayer-related datasets
visible there were Friday sermon and Eid prayer data, not daily prayer timetables
(cited, same, 2026-09-30). No machine-readable Jordanian timetable confirmed
(UNVERIFIED).

### Dar al-Ifta, Egypt

`https://www.dar-alifta.org/ar/prayer`, Arabic with English. Measured 200, 79278 bytes,
1.47 s (measured). Dar al-Ifta is the fatwa authority; Egypt's times are computed by the
Egyptian General Survey Authority, and Dar al-Ifta's own app states it relies on
published calculation methods (cited, its Play Store listing, 2026-09-30), so treat
Egypt as computation-backed rather than a ratified table.

Two internal endpoints found in the page's inline jQuery (measured):

```
GET /ar/Partial/_TimePrayer?town=<town>
GET /ar/Prayer/GetPrayer?town=<town>
```

Measured:

```
GET https://www.dar-alifta.org/ar/Prayer/GetPrayer?town=القاهرة
    X-Requested-With: XMLHttpRequest, Referer: /ar/prayer
200  17370 bytes  0.880723 s  text/html              (measured)
-> HTML fragment beginning <div class="prayer_time_today"> with مواقيت الصلاة
   and a Hijri date heading
```

The fragment is HTML, not JSON, and the page also contains a `prayer_month` table for
the current month (measured). Parameter is a town name in Arabic. No key. One month at
most per request.

### Marw, Algeria

Ministere des Affaires Religieuses et des Wakfs. `https://www.marw.dz/` measured 400,
52 bytes (measured); the live host is `https://marw.gov.dz/`, measured 200, 118383
bytes, 0.68 s (measured). The ministry publishes an official daily register of prayer
times with per-wilaya links, and republishes the Hijri register as PDF specifically so
it can be downloaded (cited,
`marw.gov.dz/.../مواقيت-الصلاة` and the ministry's Facebook post listing per-wilaya
links, 2026-09-30). I found no `.pdf` href and no prayer-times href in the homepage body
I fetched (measured), so the PDF URLs sit on inner pages I did not reach. Format is PDF,
per wilaya, annual or monthly: no machine-readable feed (UNVERIFIED as to exact URLs).

### Authorities with nothing machine-readable found

| Authority | URL | Measured | Note |
|---|---|---|---|
| Awqaf Kuwait | `https://www.awqaf.gov.kw/` | 000 after 2.32 s | Host did not answer me. Its e-services gate is `eservices.awqaf.gov.kw`, no prayer service listed (cited, 2026-09-30). |
| Awqaf Qatar | `https://www.islam.gov.qa/` | 200, 7674 B, 0.86 s | Angular SPA shell, only `/api/js` in the HTML, no prayer route found (measured). |
| MOJ Bahrain | `https://www.moj.gov.bh/` | 200, 47239 B, 0.63 s | No `prayer`, `صلاة` or `مواقيت` string in body (measured). |
| MORA Pakistan | `https://www.mora.gov.pk/` | 200, 111192 B, 1.36 s | No prayer, namaz, timing or awqat string in body (measured). Ruet-e-Hilal announces moon sighting, not timetables (cited, 2026-09-30). |
| Islamic Foundation Bangladesh | `http://islamicfoundation.gov.bd/` | 200, 114520 B, 2.29 s | No prayer or নামাজ string in body (measured). A permanent namaz and roza timetable PDF is widely redistributed by third parties (cited, 2026-09-30) but I did not find it on the official domain. |
| Affaires religieuses Tunisia | `http://www.affaires-religieuses.tn/` | 200, 98402 B, 1.33 s | Only a bare `صلاة` string, no timetable (measured). The `/ar/horaires-de-priere` path returned the same 98402-byte body, so it is a catch-all (measured). |
| Geophysics Tehran, Iran | `https://prayer.aqrabino.ir/` | 000 after 0.03 s | Not reachable. `time.ir` measured 200, 383453 B, 1.99 s and is the usual Iranian public source but is not the Institute (measured). The Institute's method is embedded in third-party libraries (cited, aladhan and `pray_times`, 2026-09-30), which is a method, not a feed. |
| Grande Mosquee de Paris | `https://www.mosqueedeparis.net/horaires-de-prieres/` | 000 after 30.0 s | Timed out. No French national feed found. |
| Islamitische Stichting Nederland | `https://www.islamitischestichting.nl/` | 000 after 0.07 s | Not reachable. Netherlands and Belgium are served by Diyanet's own country coverage in the `ezanvakti` tree (measured, `/ulkeler` lists NETHERLANDS as `UlkeID 4`). |
| Hizbul Ulama / Islamic Sharia Council, UK | n/a | not probed | No API referenced anywhere I read. See LPT instead. |
| India | n/a | not probed | No single national authority exists; times are per-organisation. |

One useful side effect of Diyanet's coverage: `ezanvakti.emushaf.net/ulkeler` enumerates
every country Diyanet computes for, including Northern Cyprus, Netherlands, Azerbaijan,
Estonia, Hungary, Italy and Monaco (measured). For European countries with no national
authority feed, Diyanet is a real fallback with an institutional name behind it.

## 4. UNVERIFIED and open

- Kemenag's province and kabupaten codes for `getShalatbln`. The endpoint and its
  parameter names are measured; the code values are not. The page would not execute in
  my browser, so I could not capture a successful request.
- Whether `api.myquran.com` actually carries Kemenag's numbers. Widely claimed, never
  stated by Kemenag in anything I read.
- UAE `prayerTimeByDateAndCityDownload`. Present in the bundle, never exercised. It is
  the most likely official bulk-file route and worth one attempt.
- Reproducing the UAE `sso/StartRequest` POST outside a browser. It works in-page and
  times out from `curl`; I did not identify what the WAF keys on.
- Exact URLs of Algeria's per-wilaya annual PDFs, and whether Morocco Habous publishes a
  yearly rather than monthly file.
- Bangladesh Islamic Foundation's permanent timetable PDF on an official domain.
- `open.data.gov.sa` contents. The portal never answered, so I cannot say whether a
  prayer-times dataset is there.
- Licence terms for JAKIM, Diyanet's public page, Brunei's list, Saudi `umqserv` and the
  UAE API. None state terms at the endpoint. Silence is not a licence.
- Whether the Diyanet public page's yearly table is stable as an interface. It is page
  HTML, not a documented API, so it can change shape at any release.
- Qatar Awqaf and Bahrain. Both are SPAs or portals where a browser-captured XHR pass,
  like the one that cracked UAE and Saudi, would likely find an endpoint. I ran out of
  budget before trying.

## 5. Sources

All fetched or measured 2026-09-30.

| Source | URL |
|---|---|
| JAKIM e-Solat portal and API | `https://www.e-solat.gov.my/index.php` |
| JAKIM yearly endpoint | `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=WLY01` |
| data.gov.my catalogue probe | `https://api.data.gov.my/data-catalogue?id=waktu_solat&limit=3` |
| MUIS agency datasets | `https://data.gov.sg/datasets?agencies=Majlis%20Ugama%20Islam%20Singapura%20(MUIS)` |
| MUIS 2026 dataset | `https://data.gov.sg/datasets/d_d441e7242e78efc566024dd5b0d9829c/view` |
| data.gov.sg poll-download | `https://api-open.data.gov.sg/v1/public/api/datasets/d_d441e7242e78efc566024dd5b0d9829c/poll-download` |
| data.gov.sg metadata | `https://api-production.data.gov.sg/v2/public/api/datasets/d_d441e7242e78efc566024dd5b0d9829c/metadata` |
| Singapore Open Data Licence | `https://data.gov.sg/open-data-licence` |
| Diyanet Awqat Salah API terms | `https://awqatsalah.diyanet.gov.tr/index.html` |
| Diyanet public prayer times | `https://namazvakitleri.diyanet.gov.tr/tr-TR` |
| Diyanet city page with yearly table | `https://namazvakitleri.diyanet.gov.tr/tr-TR/9541/ankara-namaz-vakti` |
| Diyanet region list helper | `https://namazvakitleri.diyanet.gov.tr/tr-TR/home/GetRegList?ChangeType=country&CountryId=2&Culture=tr-TR` |
| EzanVakti API (Diyanet mirror) | `https://ezanvakti.emushaf.net/` |
| EzanVakti Imsakiyem mirror | `https://ezanvakti.imsakiyem.com/` |
| Brunei KHEU prayer times page | `https://www.mora.gov.bn/SitePages/WaktuSembahyang.aspx` |
| Brunei SharePoint OData list | `https://www.mora.gov.bn/_api/web/lists/getbytitle('Waktu%20Sembahyang')/items` |
| Umm al-Qura official calendar | `https://www.ummulqura.org.sa/en` |
| KACST prayer API, Hijri year | `https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear` |
| KACST cities list | `https://www.ummulqura.org.sa/assets/data/cities.json` |
| UAE Awqaf prayer times page | `https://www.awqaf.gov.ae/prayer-times?lang=en` |
| UAE Awqaf mobile API | `https://mobileappapi.awqaf.gov.ae/APIS/v3/prayer-time/prayertimes/2026-01-01/2026-12-31` |
| UAE Awqaf anonymous token | `https://mobileappapi.awqaf.gov.ae/APIS/v3/sso/StartRequest?lang=en` |
| Dubai IACAD prayer time | `https://eservices.iacad.gov.ae/prayer-time` |
| UAE open data portal | `https://bayanat.ae/en/` |
| London Prayer Times API docs | `https://londonprayertimes.com/api/` |
| London Prayer Times endpoint | `https://www.londonprayertimes.com/api/times/` |
| East London Mosque on LPT | `https://www.eastlondonmosque.org.uk/prayer-times-and-calendar-explained` |
| Kemenag Bimas Islam jadwal shalat | `https://bimasislam.kemenag.go.id/jadwalshalat` |
| Kemenag AJAX endpoint | `https://bimasislam.kemenag.go.id/ajax/getShalatbln` |
| myQuran monthly schedule | `https://api.myquran.com/v2/sholat/jadwal/1301/2026/9` |
| myQuran city list | `https://api.myquran.com/v2/sholat/kota/semua` |
| myQuran v2 docs | `https://documenter.getpostman.com/view/841292/2s9YsGittd` |
| Kemenag Lampung data mirror | `https://datalampung.kemenag.go.id/index.php/bimas/islam` |
| Morocco Habous prayer times | `https://www.habous.gov.ma/fr/horaires-de-prière.html` |
| Morocco Habous city app | `https://habous.gov.ma/prieres/index.php` |
| Oman MARA calendar | `https://www.mara.gov.om/calendar_page2.asp` |
| Jordan Awqaf prayer times | `https://www.awqaf.gov.jo/ar/Pages/PrayerTime` |
| Jordan open data, Awqaf publisher | `https://opendata.gov.jo/en/organization/?sort=package_count+desc` |
| Egypt Dar al-Ifta prayer times | `https://www.dar-alifta.org/ar/prayer` |
| Egypt Dar al-Ifta fragment endpoint | `https://www.dar-alifta.org/ar/Prayer/GetPrayer?town=القاهرة` |
| Algeria Marw ministry | `https://marw.gov.dz/` |
| Algeria official prayer register | `http://marw.gov.dz/مقالات-ودراسات/مواقيت-الصلاة` |
| Kuwait Awqaf | `https://www.awqaf.gov.kw/` |
| Qatar Awqaf | `https://www.islam.gov.qa/` |
| Bahrain MOJ | `https://www.moj.gov.bh/` |
| Pakistan MORA | `https://www.mora.gov.pk/` |
| Bangladesh Islamic Foundation | `http://islamicfoundation.gov.bd/` |
| Tunisia religious affairs | `http://www.affaires-religieuses.tn/` |
| Saudi open data portal | `https://open.data.gov.sa/en/datasets` |
| Saudi Two Holy Mosques authority | `https://alharamain.gov.sa/public/?site=en` |
