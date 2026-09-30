# R4: every endpoint actually called, with the measured result

All rows measured from London on 2026-09-29/30 with `curl` via `measure.sh`.
`size` is the response body in bytes as served. `ttfb` and `total` are seconds.

| probe | URL | status | size B | ttfb s | total s | content-type | http |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `aladhan_cal_jakarta_2026` | `https://api.aladhan.com/v1/calendar/2026?latitude=-6.2088&longitude=106.8456&method=20` | 200 | 474626 | 0.300 | 0.764 | application/json | 2 |
| `aladhan_cal_london_2026` | `https://api.aladhan.com/v1/calendar/2026?latitude=51.5072&longitude=-0.1276&method=2` | 200 | 480831 | 0.927 | 1.842 | application/json | 2 |
| `aladhan_cal_london_2026_gz` | `https://api.aladhan.com/v1/calendar/2026?latitude=51.5072&longitude=-0.1276&method=2` | 200 | 26715 | 0.239 | 0.334 | application/json | 2 |
| `aladhan_cal_london_m15` | `https://api.aladhan.com/v1/calendar/2026?latitude=51.5072&longitude=-0.1276&method=15&shafaq=general` | 200 | 456011 | 0.508 | 1.031 | application/json | 2 |
| `aladhan_calbycity_jakarta` | `https://api.aladhan.com/v1/calendarByCity/2026?city=Jakarta&country=Indonesia&method=20` | 200 | 475721 | 0.579 | 1.024 | application/json | 2 |
| `aladhan_custom` | `https://api.aladhan.com/v1/calendar/2026?latitude=51.5072&longitude=-0.1276&method=99&methodSettings=18,null,17&tune=0,0,0,0,0,0,0,0,0` | 200 | 447251 | 0.577 | 0.891 | application/json | 2 |
| `aladhan_methods` | `https://api.aladhan.com/v1/methods` | 200 | 3554 | 0.224 | 0.225 | application/json | 2 |
| `bimasislam_root` | `https://bimasislam.kemenag.go.id/jadwalshalat` | 200 | 30135 | 2.315 | 2.692 | text/html; charset=UTF-8 | 1.1 |
| `diyanet_abdusdev` | `https://prayertimes.api.abdus.dev/api/diyanet/prayertimes?country=UNITED%20KINGDOM&city=LONDON` | 422 | 96 | 0.238 | 0.239 | application/json | 2 |
| `esolat_jakim` | `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=WLY01` | 200 | 77257 | 2.114 | 2.318 | application/json | 2 |
| `esolat_zones` | `https://www.e-solat.gov.my/index.php?r=esolatApi/zones` | 404 | 427 | 0.957 | 0.957 | text/html; charset=UTF-8 | 2 |
| `islamicfinder_root` | `https://api.aladhan.com/v1/timings/01-01-2026?latitude=51.5072&longitude=-0.1276&method=15` | 200 | 1196 | 0.389 | 0.390 | application/json | 2 |
| `mawaqit_info_noauth` | `https://mawaqit.net/api/3.0/mosque/05b4d393-fb76-4d9b-b2a4-f98ab4c4b64f/info` | 401 | 3536 | 0.177 | 0.178 | text/html; charset=UTF-8 | 2 |
| `mawaqit_me` | `https://mawaqit.net/api/2.0/me` | 401 | 0 | 0.170 | 0.170 | text/html; charset=UTF-8 | 2 |
| `mawaqit_public_page` | `https://mawaqit.net/en/mosquee-de-paris` | 404 | 3560 | 0.182 | 0.182 | text/html; charset=UTF-8 | 2 |
| `mawaqit_search_london` | `https://mawaqit.net/api/2.0/mosque/search?lat=51.5072&lon=-0.1276` | 200 | 9543 | 0.521 | 0.522 | application/json | 2 |
| `mawaqit_search_noauth` | `https://mawaqit.net/api/2.0/mosque/search?lat=48.8566&lon=2.3522` | 200 | 9922 | 0.429 | 0.431 | application/json | 2 |
| `mawaqit_times_noauth` | `https://mawaqit.net/api/2.0/mosque/05b4d393-fb76-4d9b-b2a4-f98ab4c4b64f/prayer-times` | 401 | 3536 | 0.225 | 0.226 | text/html; charset=UTF-8 | 2 |
| `muis_root` | `https://www.muis.gov.sg/Resources/Prayer-Timetable` | 301 | 0 | 0.168 | 0.169 | - | 2 |
| `muslimsalat_london` | `https://muslimsalat.com/london.json` | 404 | 19 | 0.466 | 0.466 | text/plain; charset=utf-8 | 2 |
| `muslimsalat_root` | `https://muslimsalat.com/` | 404 | 19 | 0.496 | 0.496 | text/plain; charset=utf-8 | 2 |
| `myquran_jakarta` | `https://api.myquran.com/v2/sholat/jadwal/1301/2026/9` | 200 | 5634 | 0.358 | 0.359 | application/json; charset=UTF-8 | 2 |
| `myquran_kota` | `https://api.myquran.com/v2/sholat/kota/semua` | 200 | 21263 | 1.114 | 1.115 | application/json; charset=UTF-8 | 2 |
| `namazvakti_api_london` | `https://namazvakti.vercel.app/api/timesFromCoordinates?lat=51.5072&lng=-0.1276&date=2026-09-30&days=3&timezoneOffset=60&calculationMethod=Turkey` | 307 | 15 | 0.377 | 0.377 | text/plain | 2 |
| `pawanosman` | `https://api.pawan.krd/prayertimes?city=london` | 401 | 157 | 1.167 | 1.168 | application/json; charset=utf-8 | 2 |
| `prayzone_london` | `https://api.pray.zone/v2/times/this_year.json?city=london` | 404 | 0 | 0.463 | 0.464 | - | 2 |
| `quran_com` | `https://api.quran.com/api/v4/` | 200 | 1 | 0.173 | 0.174 | text/plain; charset=utf-8 | 2 |
| `rapidapi_prayertimes` | `https://prayer-times.p.rapidapi.com/` | 404 | 32 | 0.374 | 0.375 | application/json | 2 |
| `sunnah_com` | `https://api.sunnah.com/v1/collections` | 403 | 23 | 0.717 | 0.717 | application/json | 2 |
| `ummah_methods` | `https://ummahapi.com/api/prayer-times/methods` | 200 | 5444 | 0.332 | 0.332 | application/json; charset=utf-8 | 2 |
| `ummah_month_london` | `https://ummahapi.com/api/prayer-times/month?lat=51.5072&lng=-0.1276&month=9&year=2026` | 200 | 14013 | 0.416 | 0.423 | application/json; charset=utf-8 | 2 |
| `ummah_today_jakarta` | `https://ummahapi.com/api/prayer-times?lat=-6.2088&lng=106.8456` | 200 | 1223 | 0.325 | 0.326 | application/json; charset=utf-8 | 2 |
| `ummahapi` | `https://api.ummahapi.com/v1/prayer-times?latitude=51.5072&longitude=-0.1276` | 526 | 16 | 1.141 | 1.141 | text/plain; charset=UTF-8 | 2 |
| `ummahapi2` | `https://ummahapi.com/api/v1/prayer-times?latitude=51.5072&longitude=-0.1276` | 404 | 510 | 0.354 | 0.355 | application/json; charset=utf-8 | 2 |
| `vakit_app` | `https://vakit.vercel.app/api/timesFromCoordinates?lat=51.5072&lng=-0.1276&date=2026-09-30&days=5&timezoneOffset=60&calculationMethod=Turkey` | 404 | 7971 | 0.511 | 0.512 | text/html; charset=utf-8 | 2 |
| `vakit_root` | `https://vakit.vercel.app/api/timesForPlace?lat=51.5072&lng=-0.1276&date=2026-09-30&days=3&timezoneOffset=60&calculationMethod=Turkey` | 404 | 7971 | 0.325 | 0.326 | text/html; charset=utf-8 | 2 |
