# The v3 bake runbook

Operational instructions for the build-time bake. One entry per source: the exact endpoint,
the parameters, the quirks, the response shape, the parse rules, the checks, the span, the
failure modes, and a dry-run command the owner can paste.

Companion files in this directory:

| File | What it holds |
| --- | --- |
| `RUNBOOK.md` | this document |
| `verify.sh` | every dry-run command, read-only, one function per source |
| `bake-manifest.json` | the same entries as data, for the bake program to load |
| `raw/` | the response bodies captured on 2026-11-10, as evidence |

All probes below ran on 2026-11-10 between 05:45 and 07:10 UTC from London, read-only,
GET-only. The one POST is the UAE anonymous token mint, which creates no record and is the
documented door to a public read. Every claim marked VERIFIED has a body in `raw/`.

---

## 0. How the bake runs

The bake is a git-scrape pipeline, guarded and owner-triggered. It runs once a year in the
first half of January, plus a monthly tail for the monthly feeds. It never runs in CI.

```
for each entry in bake-manifest.json where class is not "recipe":
    fetch  -> raw/<id>.bin
    parse  -> rows[]                         (shape checked against the entry's schema)
    check  -> monotonic(r), count(r), span(r), identity(r)
    emit   -> artifacts/<id>.json            (sorted, minute-precision, provenance stamped)
    ledger -> bake-ledger.json               (source hash, fetch time, row count, checks)
```

Five rules bind every entry, and every failure is a hard stop for that source only. A failed
source falls to computation for its country and the pipeline continues.

1. **Monotonicity.** Within one day the six times must strictly increase:
   `fajr < sunrise < dhuhr < asr < maghrib < isha`. Any row that breaks the order is a defect
   in the publisher's payload, not a data point. This is the Brunei detector: it catches a
   table whose columns were shifted, a repeated day, and a DST switch applied twice.
2. **Count.** The row count must equal the entry's expected count within the stated tolerance.
   A Hijri-year file is 354 or 355 rows; a Gregorian year is 365 or 366; a month is 28 to 31.
3. **Span.** First and last date must match the requested window exactly, with no gap. A gap
   longer than one day is a hard stop.
4. **Identity.** The response must name the place or zone that was requested. A feed that
   silently answers for another city is worse than an error, and it happens: Brunei's
   longitude-shifted town rows, Bulgaria's non-Sofia rows.
5. **No substitution.** A source that publishes no row for a prayer yields `--:--`. The bake
   never fills a missing row from a computation, because a substituted value is
   indistinguishable on screen from a published one.

Every entry also carries `expiry`: the date after which the artifact stops being used and the
country falls to its computed recipe. Expiry is silent and total for that source; nothing
crashes (architecture promise).

---

## 1. Table of contents

**Class 1, multi-year digits (5 sources).** Baked once, refreshed when the publisher extends.

1. `gb-london-unified` London, 50 years held, keyed.
2. `sa-ummalqura-makkah` Saudi, Hijri-year files, ceiling 1500H = 2077-11-16.
3. `kz-muftiyat-astana` Kazakhstan, no digits to bake, the recipe plus a 5,694-city table.
4. `kg-muftiyat-bishkek` Kyrgyzstan, rolling window, no year door.
5. `mv-islamicaffairs` Maldives, banded table, season-keyed, no ceiling.

**Class 2, annual (the January class, ~40 feeds).** Full entries for the 17 named sources;
the remainder in the batch table at 3.14.

6. `my-jakim-wly01` and the other 58 JAKIM zones.
7. `bn-mora-brunei` Brunei, ends 2026-12-31.
8. `sg-muis-singapore` Singapore, open licence.
9. `id-kemenag-jakarta` Indonesia, monthly, third-party carriage.
10. `eg-esa-cairo` Egypt, daily and monthly postback.
11. `tr-diyanet-istanbul` Turkey, current year only.
12. `ae-awqaf-dubai` UAE, next year already served.
13. `ma-habous-rabat` Morocco, surface dead today.
14. `jo-awqaf-amman` Jordan, one day.
15. `qa-moi-doha` Qatar, one day.
16. `ba-rijaset-sarajevo` Bosnia, any-year echo, no bake.
17. `lk-acju-zone01` Sri Lanka, monthly image and PDF.
18. `th-skthai` Thailand, annual XLSX, hash-named.
19. 3.14 the remaining 27 annual feeds, tabulated with endpoint and fallback.

**Class 3, recipe only, no digits (no bake, listed so nobody bakes them by mistake).**
Bosnia (echo), Kazakhstan (client compute), Kyrgyzstan (rolling), Taipei, Ireland IFI,
Lebanon, Kosovo. Bosnia and Kazakhstan also appear above, because the runbook documents how to
read their surfaces as cross-checks; neither is ever baked.

**Part 4** is Class 3 itself, at section 4. **Part 5** is the January re-bake calendar.
**Part 6** is the verification ledger. **Part 7** is the failure playbook. **Part 8** is the
assumptions block.

---

## PART 2. CLASS 1, MULTI-YEAR DIGITS

### 2.1 `gb-london-unified` London

| Field | Value |
| --- | --- |
| Class | multi-year, 50 years held (2019 to 2076 in the moonsighting data set) |
| Obtain | provider API, keyed |
| Endpoint | `GET https://www.londonprayertimes.com/api/times?format=json&key=<OWNER_KEY>&year=<YYYY>&24hours=true` |
| Verified today | VERIFIED (auth behaviour only): without the key the endpoint answers `401 {"message":"Unauthorized"}` |

**Quirks.** The key is owner-held and lives outside git (`ai/features/moonsighting/data/london/lpt-2026.meta.json`
records the request shape with the key redacted). `24hours=true` is mandatory: without it the
API returns 12-hour strings with an am/pm marker and the parser's minute arithmetic breaks.
`year` takes any year the provider holds. One GET returns the whole year, 92,372 bytes for
2026.

**Response shape.** JSON object with a `times` array of 365 or 366 objects keyed
`date` (`YYYY-MM-DD`), `fajr`, `sunrise`, `dhuhr`, `asr`, `maghrib`, `isha`, each `HH:MM`,
plus `Jama'ah` and `Asr (2 Mithl)` extras on the same row. Denominations are `01`-`08`
strings in the raw payload; parse to minutes since local midnight.

**Parse rules.** Six rows per day, no derivation. The published sunrise is the anchor for the
Fajr and Isha interval columns, so the parser must keep sunrise even though the app renders a
computed sunrise; the intervals are defined against it.

**Checks.** Monotonic six per day. Count 365 or 366. Span 01-01 to 12-31. Identity: the
response carries no place name, so identity is the key plus the requested year. The moonsighting
extras must be preserved: `Asr (2 Mithl)` is a second published row, not a computed one.

**Failure modes.** 401 on a rotated key (hard stop, the app ships the computation instead,
which for London is the 50-year artifact already in hand, so the blast radius is zero). A
mid-year API change from minute strings to something else (the parser validates the `HH:MM`
regex per field and stops on the first miss). Truncated year (count check).

**Dry run.**

```
curl -sS "https://www.londonprayertimes.com/api/times?format=json&key=$LUPT_KEY&year=2027&24hours=true" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.times.length, j.times[0].date, j.times[0].fajr)})'
# expect: 365 2027-01-01 06:0x
```

### 2.2 `sa-ummalqura-makkah` Saudi Arabia

| Field | Value |
| --- | --- |
| Class | multi-year, Hijri 1318 to 1500 inclusive; 1500H ends 2077-11-16 |
| Obtain | authority feed, whole Hijri year, keyless, one GET per year |
| Endpoint | `GET https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear?lang=en&format=24&yh=<1448>&lat=<21.426666>&lon=<39.831666>&zone=<3>` |
| Verified today | VERIFIED: 1447, 1448, 1500 all 200; 1501 returns 400 with the bound in the body; `zone` proven a whole-hour offset |

**Quirks.**

- `yh` is the Hijri year, not Gregorian. There is no Gregorian-year door.
- The valid range is printed by the service itself on an out-of-range request:
  `{"success":false,"errors":["Valid values are between 1318 and 1500, inclusive. ..."]}`.
  That error text is the ceiling, and 1501 is a 400, not a silent clamp.
- `zone` is a UTC offset in whole hours. Measured: the same coordinates at `zone=1` print
  02:11 Fajr, `zone=2` 03:11, `zone=3` 04:11, `zone=5` 06:11, `zone=9` 10:11. Saudi
  domestic is `zone=3`. Passing the wrong zone produces a valid-looking year shifted by whole
  hours, which no monotonicity check can catch: the count and order stay perfect. Zone is
  therefore part of the identity check, not a detail.
- `lat` and `lon` are 6-decimal degrees. The Makkah reference point is pinned by fit at
  `21.4225 / 39.8262`; the 4-decimal value used in the catalog (`21.4267 / 39.8317`) also
  returns a full year and differs by under a minute, so the bake pins the fitted point and
  records the 4-decimal point as the fallback.
- The payload carries the Hijri date per row free of charge inside the same fetch, which is
  why the Saudi year can be keyed straight onto the app's Hijri display.

**Response shape.** Top-level JSON array, 355 rows for 1448 (Hijri years are 354 or 355).
Row keys:

```
date (ISO datetime, midnight), gregorianDate{year,month,day,...}, hijriDate{year,month,day,...},
prayerTimes{fajr,sunrise,dhuhr,asr,maghrib,isha,eid,rabita{fajrExactRabita,ishaExactRabita}},
seasons{starSeason,starSeasonDay,starSeasonName,farmerSeason,...}
```

Times are `HH:MM` in the requested zone. The `eid` field is a seventh time (Eid prayer) and
must be ignored by the six-row parser; `rabita` repeats fajr and isha exactly.

**Parse rules.** One row per day, keyed by `date`. The Ramadan rule (`isha = maghrib + 120`
instead of `+90`) is already inside the published digits, so the parser never applies it. The
recipe path applies it only when no digits are present.

**Checks.** Monotonic six per day (verified: 0 non-monotonic days in all 355 rows of 1448).
Count 354 or 355. Span: first row must be `yh-01-01` and last `yh-12-29/30`; the Gregorian
span must be contiguous. Identity: `hijriDate.year == yh` on every row, and `zone` echoed in
the request. Ceiling check: the year must be `<= 1500` before the request is even made, so a
400 is never a surprise in a scheduled run.

**Failure modes.** `yh > 1500` (400, hard stop, the source is exhausted in Nov 2077 and the
country falls to the measured recipe: 18.5 / maghrib+90 / +120 Ramadan, sunrise floor,
prayers ceil). Wrong `zone` (silent whole-hour shift, caught only by identity). `lat`/`lon`
rounded to 2 decimals (the service still answers; times drift by minutes).

**Dry run.**

```
for yh in 1448 1500 1501; do
  curl -sS -o /tmp/sa-$yh.json -w "yh=$yh %{http_code}\n" \
    "https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear?lang=en&format=24&yh=$yh&lat=21.4225&lon=39.8262&zone=3"
done
node -e 'const a=require("/tmp/sa-1448.json");console.log(a.length,a[0].date,a.at(-1).date,a[0].hijriDate.year)'
# expect: 355 2026-06-16T00:00:00 2027-06-05T00:00:00 1448 ; yh=1501 -> 400
```

### 2.3 `kz-muftiyat-astana` Kazakhstan

| Field | Value |
| --- | --- |
| Class | multi-year, but there are no digits to bake: the authority computes in the browser |
| Obtain | city table via `api.muftyat.kz`, times by recipe |
| Endpoint (place table) | `GET https://api.muftyat.kz/api/v1/get/cities/?ordering=-title_ru&page=<N>` and `?search=<терм>` |
| Verified today | VERIFIED: 200, `count: 5694`, `next` paging, 6-decimal coordinates, Cyrillic-only search |

**Quirks.**

- The prayer times are never served. `muftyat.kz` computes them client-side from its own
  vendored `prayTimes.js`, so the only artifact worth baking is the place table plus the
  recipe. The city API takes exact coordinates at 6 decimals: `{"id":3,"title":"Астана
  қаласы","lng":"71.433333","lat":"51.133333","timezone":"5","region":"..."}`. Rounding to
  4 decimals moves a village across the 48-degree margin line, which switches the printed
  margins from the +3 set to the +5 set.
- `search` matches Cyrillic only: `search=Астана` returns 1, `search=Astana` returns 0. The
  bake matches on `title` after transliteration, never by sending Latin text.
- 100 rows per page, 5,694 rows today, so 57 pages. Match the ticket's figure: exactly 5,694
  cities across all 5,694 settlements, and the margin census found the same two sets
  everywhere.

**Response shape.** DRF paginated object: `{count, next, previous, results[]}` with
`id, title, lng, lat, timezone, region, district, distance`. `lng` and `lat` are strings with
6 decimals; `timezone` is a whole-hour offset as a string.

**Parse rules.** Keep the id and the coordinate strings verbatim. The recipe is fixed and is
not re-derived at bake time: Fajr 15, Isha 15, Hanafi Asr, `highLats: AngleBased`, then
sunrise -3 and dhuhr/asr/maghrib +3 below 48 degrees north, sunrise -5 and the same three +5
at or above 48. Fajr and Isha take no margin. Imsak = fajr + 10.

**Checks.** Count equals the previous count or grows; a shrink means the API paged differently
and the bake stops. Coordinates within Kazakhstan's bounding box. Every row's `timezone`
consistent with its longitude.

**Failure modes.** The API is a separate host from the site and can be down while the site is
up (the bake treats a non-200 as "keep the previous table", because the table is stable). A
`lat`/`lng` format change to numbers instead of strings (parse both). A new city appearing
mid-year is harmless; a city disappearing is a hard stop for the table, not for the times.

**Dry run.**

```
curl -sS "https://api.muftyat.kz/api/v1/get/cities/?ordering=-title_ru&page=1" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.count,j.results.length,j.results[0].lat,j.results[0].lng)})'
# expect: 5694 20 52.499766 73.099292
```

### 2.4 `kg-muftiyat-bishkek` Kyrgyzstan

| Field | Value |
| --- | --- |
| Class | multi-year by claim, rolling window in practice |
| Obtain | authority page, embedded day array, no year door |
| Endpoint | `GET https://muftiyat.kg/ru/calendar/<cityId>/` (1 Bishkek, 2 Osh, 25 Kara-Balta, 42 Manas) |
| Verified today | VERIFIED: 200, 21 days embedded, `start`/`end` clamped by a 302 to today+20 |

**Quirks.** The page ships its rows as a JavaScript literal (`days=[{...}]`), which is cleaner
than any HTML table. But the window is fixed: requesting `?start=01-01-2027&end=31-12-2027`
returns `302 Location: /ru/calendar/?start=10-11-2026&end=30-11-2026`, that is today and the
following 20 days, and the city is carried by a `point` cookie rather than the path for the
range view. There is therefore no single request that yields a year, and no past dates at all.

**Response shape.** `days=[{id, date, weekday, fajr, sunrise, dhuhr, asr, sunset, maghrib,
isha, tahajjud}]`, `HH:MM` local. Note `sunset` and `maghrib` are separate columns, seven
minutes apart, which is the published iftar margin and not a defect.

**Parse rules.** Extract the `days=` literal, evaluate it as data (never as code), and key by
`date`. The recipe that reproduces it: Fajr 18 flat as a floor, Hanafi Asr, maghrib = sunset +
7 displayed, isha = maghrib + round(7/9 x (fajr - sunrise)) approximated as the twilightRatio
rule, single-angle fallback 15.89 with margin -1.

**Checks.** Monotonic six. Contiguous dates. `maghrib > sunset` on every row. Count 21 per
window.

**Failure modes.** The clamp means a missed day cannot be back-filled from this surface; the
bake therefore treats Kyrgyzstan as a rolling capture, and the durable artifact is the recipe.
A city id that 404s means the settlement list moved; the ids above are the ones measured.

**Dry run.**

```
curl -sSL "https://muftiyat.kg/ru/calendar/1/" \
 | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=/days=(\[.*?\])\s*\n/s.exec(s);const d=eval(m[1]);console.log(d.length,d[0].date,d[0].fajr,d[0].sunset,d[0].maghrib)})'
# expect: 21 <today> 06:09 17:44 17:51
```

### 2.5 `mv-islamicaffairs` Maldives

| Field | Value |
| --- | --- |
| Class | multi-year, no ceiling, season-keyed computed provenance |
| Obtain | banded table, vendored file |
| Endpoint | `GET https://raw.githubusercontent.com/itsMaadh/maldives-prayer-times/main/maldives_prayer_times.sql` |
| Verified today | VERIFIED: 200, 1,299,231 bytes, 202 islands, 42 bands, 366 perpetual days |

**Quirks.** The ministry publishes per island; the machine-readable form is a community
vendoring of the ministry table, 202 islands mapped to 42 latitude bands over a 366-day dummy
leap year. That is a computed band table, not a published almanac, which is why the class is
"season-keyed computed provenance": the digits are official in origin and banded in storage.
There is no year parameter and no expiry. Adopting it means adopting the vendor file, so the
bake pins the commit hash, not the branch.

**Response shape.** SQL: `tbl_islands(island_id, reg_no, name_en, lat, lng, band, offset_min)`
and `tbl_prayer_times(band, day_of_year, fajr, sunrise, dhuhr, asr, maghrib, isha)`. Times are
`HH:MM`. `day_of_year` runs 1 to 366.

**Parse rules.** Resolve the island to its band, apply its per-island offset, look up by
Gregorian day-of-year with 366 mapped to 365 in non-leap years.

**Checks.** 202 islands, 42 distinct bands, 366 x 42 rows, monotonic six per row, `offset_min`
within the measured range. Spot-check MUIS 20/18 with the measured margins (fajr +5, sunrise
-1, dhuhr +4, asr +1, maghrib +2, isha +4).

**Failure modes.** Vendor repo moves or is deleted; the fallback is the measured recipe
(20/18 plus those six margins), which is what the digits already encode.

**Dry run.**

```
curl -sSL https://raw.githubusercontent.com/itsMaadh/maldives-prayer-times/main/maldives_prayer_times.sql \
 | grep -c "INSERT INTO"
# expect: 2 (islands, prayer times)
```

---

## PART 3. CLASS 2, ANNUAL FEEDS

### 3.1 `my-jakim-*` Malaysia, 59 zones

| Field | Value |
| --- | --- |
| Class | annual, current Gregorian year only |
| Obtain | authority feed, whole year, keyless |
| Endpoint | `GET https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=<WLY01>` |
| Verified today | VERIFIED: 200, 77,257 bytes, 365 rows for 2026; a `year=2027` request returns 2026 unchanged |

**Quirks.** The endpoint has no year parameter that works. `year=2027` is accepted and
ignored, and the body is the current year; the record's earlier observation of an HTTP 400 on
some future-date paths is the same door, harder shut. Consequence: a full year is only
obtainable by capturing it during that year, so the January run captures the new year on its
first day and the artifact is complete the moment the feed rolls. Zones are 59 (`WLY01` is the
catalog's row; the federal table for the other 58 differs only by the zone constant).

**Response shape.** `{"prayerTime":[{"hijri":"1447-07-11","date":"01-Jan-2026","day":
"Thursday","imsak":"05:56:00","fajr":"06:06:00","syuruk":"07:18:00","dhuha":"07:43:00",
"dhuhr":"13:19:00","asr":"16:42:00","maghrib":"19:17:00","isha":"20:31:00"}, ...]}`. Note
`HH:MM:SS` with a trailing `:00`, and `date` in `DD-Mon-YYYY`.

**Parse rules.** Eight rows; `imsak` is a real published row (fajr - 10 in every zone except
PLS01, where it equals fajr). `dhuha` is published. The month names are Malay and not English:
`Jan, Feb, Mac, Apr, Mei, Jun, Jul, Ogo, Sep, Okt, Nov, Dis`. `Dis` is December and `Mac` is
March, so an English month parser fails on two of twelve months and a naive one silently maps
`Mei` to May (right) and `Ogo` to August (right) while choking on `Mac`. The dhuhr ihtiyati is
+1.5 minutes applied to transit and rounded, maghrib carries no additive ihtiyati. If digits
are present none of this is applied; the constants exist only for the computed fallback.

**Checks.** Monotonic six (the `imsak < fajr` relation is not part of the six, check it
separately). Count 365 or 366. Span 01-Jan to 31-Dec of the requested year, asserted by parsing
the `date` field, because the year is never in the request. Identity: zone echoed.

**Failure modes.** The feed still serving the old year on 1 January (probe daily until the
first row reads `01-Jan-<new year>`; until then the previous artifact expires and Malaysia
computes at 18/18 with the per-field ihtiyati, MAE under 0.35 minutes, so the gap is
cosmetic). Zone code typo (the endpoint answers 200 with an empty `prayerTime`).

**Dry run.**

```
curl -sS "https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=WLY01" \
 | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s).prayerTime;console.log(j.length,j[0].date,j[0].imsak,j[0].fajr,j.at(-1).date)})'
# expect: 365 01-Jan-2026 05:56:00 06:06:00 31-Dec-2026
```

### 3.2 `bn-mora-brunei` Brunei

| Field | Value |
| --- | --- |
| Class | annual, and the list ends 2026-12-31 today |
| Obtain | authority feed, whole year, keyless SharePoint OData |
| Endpoint | `GET https://www.mora.gov.bn/_api/web/lists/getbytitle('Waktu%20Sembahyang')/items?$orderby=Date%20desc&$top=3` |
| Verified today | VERIFIED: 200 Atom XML; newest row `2026-12-30T16:00:00Z` = 2026-12-31 local |

**Quirks.** SharePoint's REST surface, so the response is Atom XML with `d:` and `m:`
namespaces, not JSON. `$top`, `$filter` and `$orderby` all work, paging is `$skiptoken`. Dates
are stored as `Edm.DateTime` at 16:00Z of the previous day, which is midnight in `Asia/Brunei`:
the parser must add 8 hours before taking the date. Times are dotted decimals, not clock
strings: `4.54` is 04:54, `12.24` is 12:24 and `3.46` is 15:46. Reading `4.54` as 4.54 hours
gives 04:32 and a silent 22-minute error, which is why the dot is a separator here and never a
decimal point. One row per date, no district column: the catalog's Belait zone is a constant
offset on this row, not a second row in the list.

**Response shape.** `<entry><content><m:properties><d:Date>2026-12-30T16:00:00Z</d:Date>
<d:Month>Dec</d:Month><d:Year>2026</d:Year><d:Tarikh>21 Rejab 1448 H</d:Tarikh>
<d:Imsak>4.54</d:Imsak><d:Suboh>5.04</d:Suboh><d:Syuruk>6.28</d:Syuruk><d:Doha>6.52</d:Doha>
<d:Zohor>12.24</d:Zohor><d:Asar>3.46</d:Asar><d:Maghrib>6.18</d:Maghrib>
<d:Isyak>7.33</d:Isyak></m:properties>`.

**Parse rules.** One row per date. `Suboh` is fajr, `Syuruk` sunrise, `Doha` duha, `Zohor`
dhuhr, `Asar` asr, `Isyak` isha. Column order in the payload is not the prayer order
(`Imsak, Suboh, Syuruk, Doha, Zohor, Asar, Maghrib, Isyak`), so the parser must bind by name;
reading positionally is exactly the defect the monotonicity check exists to catch.

**Checks.** Monotonic six per day. Count 365 or 366. Span ends 12-31. Identity: `Month` and
`Year` must agree with `Date`, which catches the 16:00Z offset slipping a day.

**Failure modes.** The classic Brunei defect, a column shift, is caught by monotonicity and is
why this source is the reference case for that check. The list not being extended for the new
year (hard expiry 31 December; the computed fallback is 20/18, nearest, dhuhr +1). Because the
list is a flat SharePoint table, an extension arrives as appended rows, so the January run
re-reads the newest 400 and detects the new year by the first date.

**Dry run.**

```
curl -sS "https://www.mora.gov.bn/_api/web/lists/getbytitle('Waktu%20Sembahyang')/items?\$orderby=Date%20desc&\$top=3" \
 | grep -oE "<d:(Date|Suboh|Maghrib|Isyak)[^>]*>[^<]*" | head -8
# expect: d:Suboh 5.04, d:Maghrib 6.18, d:Isyak 7.33, d:Date 2026-12-30T16:00:00Z (one row per day)
```

### 3.3 `sg-muis-singapore` Singapore

| Field | Value |
| --- | --- |
| Class | annual, three years in one file, open licence |
| Obtain | open data (data.gov.sg), keyless, two-step |
| Endpoint | `GET https://api-open.data.gov.sg/v1/public/api/datasets/<id>/poll-download` then the presigned S3 URL it returns |
| Verified today | VERIFIED: 201 with a presigned URL; the CSV is 366 lines, 8 columns |

**Quirks.** Two requests: the poll endpoint returns
`{"code":0,"data":{"status":"DOWNLOAD_SUCCESS","url":"https://s3...csv?X-Amz-..."}}` with a
one-hour presign, so the download must follow immediately. The dataset id is per publication
(`d_d441e7242e78efc566024dd5b0d9829c` is the 2026 file, filename
`MuslimPrayerTimetable2026.csv`); a new year means a new id, so the bake resolves the id by
dataset search rather than hard-coding it. This is the only source in the whole programme with
a real open licence (Singapore Open Data Licence 1.0).

**Response shape.** CSV, header `Date,Day,Subuh,Syuruk,Zohor,Asar,Maghrib,Isyak`, dates
`YYYY-MM-DD`, times `HH:MM`, no seconds, no Imsak column.

**Parse rules.** Six rows. Singapore rounds UP (measured over 1,096 days, ceiling fits 60 to 78
percent and floor is rejected), so a computed fallback must ceil. MUIS applies no safety
margin at all: every one of the six constants is zero, which makes the CSV a pure library
output under the right method.

**Checks.** Monotonic six. Count 365 or 366 per year, and 1,096 days in the full file. Span
three consecutive years. Identity: no place field, single-island source, so identity is the
dataset id.

**Failure modes.** A presign that expires before download (retry the poll, do not cache the
URL). A new dataset id that the search does not surface (fallback: 20/18, ceil, MAE under a
minute).

**Dry run.**

```
u=$(curl -sS "https://api-open.data.gov.sg/v1/public/api/datasets/d_d441e7242e78efc566024dd5b0d9829c/poll-download" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.url')
curl -sSL "$u" | head -3
# expect: Date,Day,Subuh,... then 2026-01-01,Thurs,05:44,07:08,13:10,16:34,19:11,20:25
```

### 3.4 `id-kemenag-jakarta` Indonesia

| Field | Value |
| --- | --- |
| Class | annual-ish, monthly calls, 518 cities |
| Obtain | third-party carriage of Kemenag data (`api.myquran.com`); the ministry's own endpoint is session-gated |
| Endpoint | `GET https://api.myquran.com/v2/sholat/jadwal/<cityId>/<YYYY>/<M>` for M 1 to 12 |
| Verified today | VERIFIED: 200 for 2026, 2029, 2030 and 2031; per-date values vary |

**Quirks.** The ministry endpoint (`bimasislam.kemenag.go.id/ajax/getShalatbln`) needs a
session key and answers `{"status":"Illegal key"}`, so the shipped path is the third-party
carriage, which is a correction target rather than an authority (its residual against a 20/18
computation is the measured correction). Twelve requests per city per year, 5,817 to 5,819
bytes each. The record's ceiling claim, "2029 real, 2030+ a repetition", did not reproduce
today: 2030 and 2031 rows differ from 2029 at the minute level, so the live surface computes
per date. Bake the year, keep the ceiling caveat in the notes, and let the check stand on the
data.

**Response shape.** `{"status":true,"data":{"id":1301,"lokasi":"KOTA JAKARTA","daerah":"DKI
JAKARTA","jadwal":[{"tanggal":"Kamis, 01/01/2026","imsak":"04:09","subuh":"04:19",
"terbit":"05:39","dhuha":"06:08","dzuhur":"12:00","ashar":"15:26","maghrib":"18:14",
"isya":"19:29","date":"2026-01-01"}]}}`.

**Parse rules.** Key by the ISO `date` field, never the localised `tanggal`. Indonesian names:
`subuh` fajr, `terbit` sunrise, `dzuhur` dhuhr, `ashar` asr, `isya` isha. `imsak` is fajr - 10
as an offset. The measured recipe is 20/18 with per-field rounding (fajr down, sunrise nearest,
dhuhr down, asr down, maghrib up, isha down) and margins +3 -3 +4 +3 +3 +3.

**Checks.** Monotonic six. 28 to 31 rows per month, 365 or 366 per year. Months contiguous.
Identity: `lokasi` must match the requested city id's name.

**Failure modes.** A month missing from the carriage (the fallback is the recipe, which is
already the correction source, so the loss is small). A city id reused for another city
(identity check).

**Dry run.**

```
curl -sS "https://api.myquran.com/v2/sholat/jadwal/1301/2027/1" \
 | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s).data;console.log(j.lokasi,j.jadwal.length,j.jadwal[0].date,j.jadwal[0].subuh)})'
# expect: KOTA JAKARTA 31 2027-01-01 04:19
```

### 3.5 `eg-esa-cairo` Egypt

| Field | Value |
| --- | --- |
| Class | annual by construction, monthly and daily in practice |
| Obtain | authority page, ASP.NET postback |
| Endpoint | `GET https://www.esa.gov.eg/praytimes.aspx` (one day, all cities) and `POST` to it or to `monthlymwaket.aspx` |
| Verified today | VERIFIED: both pages 200; daily page 91,330 bytes with 82 city options plus "all cities"; monthly page 32,023 bytes with two dropdowns and no server-rendered rows |

**Quirks.** This is the one source that needs a stateful request. The pages carry
`__VIEWSTATE`, `__VIEWSTATEGENERATOR` and `__EVENTVALIDATION`, and the table only appears after
a postback to `ctl00$placeholder1$DropDownList1` (city, with `كل المدن` = all cities) and, on
the monthly page, `DropDownList2` (month). Two doors: the daily page gives one day for all 78
cities in one postback, the monthly page gives one month for one city. A full year for one
city is therefore 12 postbacks, and a full year for all cities is 366 postbacks or 12 monthly
ones plus per-city iteration. The record's "78 cities" reads 82 options today including
placeholders; count cities from the option list at bake time and assert the count, do not
hard-code 78.

**Response shape.** HTML. The daily page renders a Gregorian calendar grid with the day cells
carrying the six times; the monthly page renders a table. Column headers are Arabic:
`فجر`, `شروق`, `ظهر`, `عصر`, `مغرب`, `عشاء`.

**Parse rules.** Harvest `__VIEWSTATE` and `__EVENTVALIDATION` from the GET, post the form with
the target control and the desired value, parse the returned table by header text. Times are
`HH:MM` 24-hour local.

**Checks.** Monotonic six. Count 28 to 31 per month. The measured recipe must not be applied
when digits are present: Egypt's published dhuhr has no +1, and the library preset's +1 is a
known trap that zeroes out 71 of 92 matches.

**Failure modes.** The postback protocol changes without notice (the GET still succeeds, which
is why the parse check must assert rows, not status). Timeout on the server-side table build
(2.3 s TTFB measured; allow 30 s). Fallback: 19.5/17.5, nearest, all margins zero.

**Dry run.**

```
curl -sS -o /tmp/eg.html -w "%{http_code} %{size_download}\n" https://www.esa.gov.eg/praytimes.aspx
grep -c "<option" /tmp/eg.html; grep -c "__VIEWSTATE" /tmp/eg.html
# expect: 200 91330 ; 83 ; 1
```

### 3.6 `tr-diyanet-istanbul` Turkey

| Field | Value |
| --- | --- |
| Class | annual, current calendar year only on the public page |
| Obtain | authority page (yearly table in the HTML); the API is registration-gated |
| Endpoint | `GET https://namazvakitleri.diyanet.gov.tr/tr-TR/<ilceId>` (9541 Istanbul, 9206 Ankara) |
| Verified today | VERIFIED: 200, 381,066 bytes, table `#yourTable`, 365 data rows for 2026 |

**Quirks.** The public page embeds the whole current year as an HTML table, which is the
easiest parse in the set. It is the current year only: no year selector in the markup, so
2027 is not reachable here. The page answers `301` to a bare request and needs redirect
following, which is worth knowing because a fetch that stops at the 301 sees 154 bytes and no
table. The official API (`awqatsalah.diyanet.gov.tr`) is the multi-year door and needs a
postal application with 10 requests per month; the record holds the 2027 Istanbul validation
from it, so treat the API as an owner-held resource, not a bake dependency.
`ilce` ids matter: 9542 is Kartal, not Istanbul, and it is the calibration gotcha that shifted
a past fit.

**Response shape.** Three tables; the one to parse is `id="yourTable"`, columns
`Miladi Tarih | Hicri Tarih | İmsak | Güneş | Öğle | İkindi | Akşam | Yatsı`. Dates are
`01 Ocak 2026 Perşembe` (Turkish month names, weekday suffix). Times `HH:MM`.

**Parse rules.** Turkish month map. `İmsak` fajr, `Güneş` sunrise, `Öğle` dhuhr, `İkindi` asr,
`Akşam` maghrib, `Yatsı` isha. Rounds nearest. Margins for the domestic recipe are
`0 -7 +5 +4 +7 0`; the -7 attaches to sunrise only, and there is no temkin on imsak or yatsi.

**Checks.** Monotonic six. 365 or 366 rows. Span 01 Ocak to 31 Aralık. Identity: the page
title carries the ilce name (`İstanbul Namaz Vakitleri`), assert it.

**Failure modes.** The page rolling to the new year late (probe from 1 January; the fallback
18/17 with the temkin margins is the same engine, MAE under a minute). A live "ilce" id
retarget to a district (identity check). Diyanet's European scheme is a different recipe
(18/16), so a page fetched for a diaspora city must not be baked into the Turkey object.

**Dry run.**

```
curl -sSL https://namazvakitleri.diyanet.gov.tr/tr-TR/9541 \
 | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const t=s.slice(s.indexOf("id=\"yourTable\""));const r=[...t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];console.log(r.length-1)})'
# expect: 365
```

### 3.7 `ae-awqaf-dubai` UAE

| Field | Value |
| --- | --- |
| Class | annual, whole federation in one GET, next year already served |
| Obtain | authority API, anonymous token from a POST with an origin header |
| Endpoint | `POST https://mobileappapi.awqaf.gov.ae/APIS/v3/sso/StartRequest?lang=en` then `GET .../APIS/v3/prayer-time/prayertimes/<from>/<to>` |
| Verified today | VERIFIED: token 200 with `Origin: https://www.awqaf.gov.ae`; January 2027 = 1,860 rows across 60 areas; 2028, 2029 and 2030 return zero rows |

**Quirks.**

- The token is anonymous but origin-gated. `POST StartRequest` with
  `Origin: https://www.awqaf.gov.ae` returns
  `{"isSuccess":true,"clientAccessToken":"eyJ..."}` in 617 bytes; the same call without the
  origin header measured 404 in the original research. The JWT subject is
  `APIServiceAccessToken`, so no credential is involved. This is the only POST in the runbook
  and it writes nothing.
- The date range is unbounded in principle and free in practice: a full year is 13.6 MB and
  21,900 rows. A single month is 1.2 MB, which is the sane bake granularity.
- `awqaf.gov.ae/en/prayer-times` now 404s (site rebuilt), so the API is the only live surface.
- Response header carries `x-api-version: 3`.

**Response shape.** `{"azanSettings":{...},"prayerData":[{pid, gDate, dayofWeek, hijryDay,
hijryMonth, hijryYear, emsak, fajr, shurooq, zuhr, asr, maghrib, isha, comments, areaNameAr,
areaNameEn, emirateNameAr, emirateNameEn, areaID, emirateID, ...}]}`. Times are full ISO
datetimes (`2027-01-01T05:44:00`). `emsak` equals `fajr` on every row.

**Parse rules.** Key by `(areaID, gDate)`. Take the time component; the date component is
repeated inside each time field and must not be mixed into the key. 60 areas, no district
geometry: the app binds a coordinate to the nearest area centroid.

**Checks.** Monotonic six per area-day. Rows = 60 x days. Span exact. Identity: exactly 60
distinct `areaID`, and the emirate set matches the previous run. The measured constants for
the computed fallback are 18.2/18.2 with margins `0 -3 +3 +1 +3 0`, sunrise floor, others
nearest.

**Failure modes.** Token mint start failing (401/404, hard stop). A range that crosses the
publisher's horizon returning `{"prayerData":[]}` with 200: that is the expiry signal, not an
error, so the check must assert row count and treat zero as expiry. Date range longer than the
publisher allows (split by month).

**Dry run.**

```
tok=$(curl -sS -X POST "https://mobileappapi.awqaf.gov.ae/APIS/v3/sso/StartRequest?lang=en" \
  -H "Origin: https://www.awqaf.gov.ae" -H "Content-Type: application/json" --data '{}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).clientAccessToken')
curl -sS "https://mobileappapi.awqaf.gov.ae/APIS/v3/prayer-time/prayertimes/2027-01-01/2027-01-31" \
  -H "Authorization: Bearer $tok" -H "Origin: https://www.awqaf.gov.ae" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const p=JSON.parse(s).prayerData;console.log(p.length,new Set(p.map(r=>r.areaID)).size,p[0].gDate,p[0].fajr)})'
# expect: 1860 60 2027-01-01T00:00:00 2027-01-01T05:44:00
```

### 3.8 `ma-habous-rabat` Morocco

| Field | Value |
| --- | --- |
| Class | annual by intent, dead today |
| Obtain | authority page, keyed by city, one Hijri month per response |
| Endpoint (as recorded) | `GET https://www.habous.gov.ma/prieres/index.php?ville=<N>` and `/prieres/horaire-api.php?ville=<N>` |
| Verified today | VERIFIED DEAD: `/prieres/`, `/prieres/index.php?ville=1` and `/prieres/horaire-api.php?ville=1` all 404; the site root is an 8 KB static page with no prayer section |

**Quirks.** The site was rebuilt. The root now serves a small static page whose only outbound
links are stylesheets, a 2026 imamate decision PDF and phone numbers; there is no prayer-time
path under `/prieres/`. Historically the page ignored every date parameter (`mois`, `annee`,
`m`, `hijri`) and returned the current Hijri month, 30 rows, 24,167 bytes, identical for all
variants.

**Parse rules (for when it returns).** Arabic headers `الصبح`, `الشروق`, `الظهر`, `العصر`,
`المغرب`, `العشاء`. The clock is fixed UTC+0 year-round (`fuseau:GMT` in the ministry's own
schema), while civil Morocco runs UTC+1 outside Ramadan, so the stored instant must be built
with an `Etc/GMT` zone and rendered through the fixed-clock path.

**Checks (for when it returns).** Monotonic six. 29 or 30 rows (one Hijri month). Identity:
`ville` echoed. Clock: the published times must be UTC+0, so a Ramadan month and a Sha'ban
month show the same solar time, one hour apart in civil terms.

**Failure modes.** The current one: surface gone. The country falls to the measured recipe,
19/17 with margins `-1 -3 +5 +1 +4 0`, fajr floor, clock fixed at UTC+0, which reproduces the
printed table on 117 days. The January run re-probes three candidate paths; nothing is baked
until one answers.

**Dry run.**

```
for p in "prieres/" "prieres/index.php?ville=1" "prieres/horaire_hijri_2.php?ville=1"; do
  printf "%s -> " "$p"; curl -sS -o /dev/null -w "%{http_code}\n" "https://www.habous.gov.ma/$p"
done
# expect today: 404 404 404 (previously 200 with 30 rows)
```

### 3.9 `jo-awqaf-amman` Jordan

| Field | Value |
| --- | --- |
| Class | daily, no year door |
| Obtain | authority page, one day |
| Endpoint | `GET https://www.awqaf.gov.jo/ar/Pages/PrayerTime` |
| Verified today | VERIFIED: 200, 190,295 bytes, panel dated 11-10-2026 with six rows |

**Quirks.** The page renders one day for Amman and nothing else; the date is the server's
today. There is no parameter for another date on this surface. A year is therefore 365 daily
requests, which is a monthly capture job rather than a January one, and the durable artifact is
the recipe: 18/18 with margins `-6 +1 +1 +6` (sunrise -6, dhuhr +1, asr +1, maghrib +6), fajr
floor, isha ceil. Jordan also prints Fajr at 16 degrees through December, a seasonal
convention the policy layer carries as a monthly override.

**Response shape.** HTML, a panel with `التاريخ: 11-10-2026` and rows `الفجر 05:36`,
`الشروق 06:54`, then image-borne cells for the remainder.

**Parse rules.** Bind by Arabic label; the times sit in `div` cells, not a table. Some rows are
images, so the parser must handle a label without a sibling text node by treating it as
NOT-PUBLISHED rather than substituting.

**Checks.** Monotonic six. Exactly one date per fetch, matching the server's date. Month name
for December must show the 16-degree Fajr, not 18, or the artifact is stale.

**Dry run.**

```
curl -sS https://www.awqaf.gov.jo/ar/Pages/PrayerTime | grep -oE "التاريخ:[0-9-]+|الفجر[^<]*" | head -5
# expect: التاريخ:11-10-2026 then a Fajr cell
```

### 3.10 `qa-moi-doha` Qatar

| Field | Value |
| --- | --- |
| Class | daily, today only |
| Obtain | authority REST returning an HTML fragment |
| Endpoint | `GET https://portal.moi.gov.qa/MoiPortalRestServices/rest/prayertimings/today/en` |
| Verified today | VERIFIED: 200, 2,282 bytes, HTML fragment dated 10/11/2026, Doha |

**Quirks.** The path says REST and the content type says HTML. The fragment carries the date,
country, city, `Time Difference: 3 hours`, latitude `25:15`, longitude `51:36`, qibla
`252:52:15`, then six times as `H:MM` with no zero padding on the hour (`4:29`, `2:27`). The
`today` path has no date parameter; a month or year needs another path and none was found
today.

**Parse rules.** Regex the six values in label order: `Fajer, Sunrise, Dhuhr, Asr, Maghrib,
Isha`. Parse `H:MM` and `HH:MM` both. The published interval is `maghrib + 90`, added after
rounding sunset, which is the ordering quirk; the angle never fits and the catalog's implied
20.8 is a fiction.

**Checks.** Monotonic six. Date equals today in `Asia/Qatar`. `isha - maghrib == 90` on every
captured day (this is the strongest available invariant for Qatar and it is exact).

**Failure modes.** The endpoint is today-only, so a missed day is unrecoverable from this
surface; the artifact is a rolling capture and the recipe (17.8 fajr, maghrib+90, nearest) is
what ships if the capture stops.

**Dry run.**

```
curl -sS https://portal.moi.gov.qa/MoiPortalRestServices/rest/prayertimings/today/en \
 | sed 's/<[^>]*>/|/g' | tr -s '|' '|' | tr -d '\n' | cut -c1-320
# expect: ...|10/11/2026|...|Fajer|Sunrise|Dhuhr|Asr|Maghrib|Isha|...|4:29|5:48|11:17|2:27|4:49|6:19|
```

### 3.11 `ba-rijaset-sarajevo` Bosnia

| Field | Value |
| --- | --- |
| Class | annual by appearance, computed in fact: do not bake |
| Obtain | authority API, any year |
| Endpoint | `GET https://api.vaktija.ba/vaktija/v1/77/<YYYY>` |
| Verified today | VERIFIED: 200 for 2026, 2027, 2028, 2030 and 2035; non-leap years are byte-identical at 21,346 bytes |

**Quirks.** Any year answers, including years the Rijaset has not published, and the values
for 2026, 2030 and 2035 are identical to the minute. That proves the service computes from a
fixed recipe rather than serving an almanac, so baking its digits adds nothing a computation
does not already produce. Ship the recipe (18/15.89, sunrise -7, dhuhr +1, maghrib +6, asr per
printed row) and keep this endpoint as a cross-check, not a source. Note that the +6 on
maghrib is explained by Sarajevo's 611 m horizon dip, not by a margin.

**Response shape.** `{"id":77,"lokacija":"Sarajevo","godina":2027,"mjesec":[{"dan":[{"vakat":
["5:37","7:15","11:51","14:01","16:25","17:52"]}, ...]}]}`. Six values in prayer order, no
labels. `mjesec` has no month number: the array index plus one is the month.

**Checks.** 12 months, 28 to 31 days each, monotonic six, and the year-to-year identity that
marks it as computed.

**Dry run.**

```
for y in 2026 2030; do curl -sS -o /tmp/ba-$y.json -w "$y %{size_download}\n" https://api.vaktija.ba/vaktija/v1/77/$y; done
node -e 'const a=require("/tmp/ba-2026.json"),b=require("/tmp/ba-2030.json");console.log(a.mjesec[0].dan[0].vakat.join(",")===b.mjesec[0].dan[0].vakat.join(","))'
# expect: 2026 21346 / 2030 21346 / true
```

### 3.12 `lk-acju-zone01` Sri Lanka

| Field | Value |
| --- | --- |
| Class | monthly, image and PDF, 13 zones |
| Obtain | authority PDF and JPG, hash-named, keyless |
| Endpoint | `GET https://www.acju.lk/prayer-times/` then the `wp-content/uploads/<YYYY>/<MM>/<ZZ.-Zone>-<M>.pdf` links it lists |
| Verified today | VERIFIED: page 200 but the table is gone from the HTML; the page body lists 312 upload URLs, 13 zones x 12 months x 2 formats, uploaded 2026/10 and 2026/11 |

**Quirks.** The surface changed shape: the page used to carry a table and now carries twelve
monthly files per zone, published as both JPG and PDF. Filenames are stable in pattern and
unstable in zone slug (`01.-Colombo`, `03.-Mullaitivu-District-Except-Nallur-...`,
`12.-Galle-District-Matara-District-Sri-lanka`), so the bake must read the zone list from the
page, never hard-code 13 names. The content is an image in the PDF, so this source needs OCR at
bake time; that is the same class the record dropped Azerbaijan to, and Sri Lanka should be
ranked the same way (recipe first, digits as a validation pass) unless the owner wants the OCR.

**Response shape.** PDF and JPG per (zone, month). Times are printed in a grid, `HH:MM`,
usually with Arabic and Latin labels and a separate `Sunrise` row.

**Parse rules.** OCR with a fixed template per zone; the column order never changes within a
year. Reconcile against the measured recipe (fajr 19.75, isha 18.2, maghrib +1, dual Asr) and
reject any OCR row that misses by more than 2 minutes, which is the OCR error band and not a
data point.

**Checks.** Monotonic six. Rows equal the month's day count. Zone slug matches the request.
Two formats agree (JPG and PDF of the same month are the same table; a disagreement is an OCR
failure).

**Failure modes.** A month not yet uploaded (the files appear in-month, so capture runs on the
5th). The page restructured again (the zone list is read, not assumed). OCR drift on a
hand-corrected month (reject and keep the recipe).

**Dry run.**

```
curl -sS https://www.acju.lk/wp-json/wp/v2/pages/17131 \
 | sed 's#\\/#/#g' \
 | grep -oE "uploads/2026/1[01]/[0-9]{2}\.[A-Za-z-]+-[0-9]{1,2}\.pdf" | sort -u | head -4
# expect four PDF paths such as 01.-Colombo-1.pdf ... (12 per zone)
```

### 3.13 `th-skthai` Thailand

| Field | Value |
| --- | --- |
| Class | annual, 77 provinces, XLSX, hash-named |
| Obtain | authority spreadsheet, annual, keyless but Cloudflare-fronted |
| Endpoint | `GET https://www.skthai.org/th/pages/28433` then the `cache-igetweb-v2.mt108.info/.../filemanager/<hash>.xlsx` links it lists |
| Verified today | PARTIAL: the page is 403 to curl and readable through the fetch proxy; 77 provinces x 2 years of XLSX links confirmed; the binary itself 403s to curl behind Cloudflare |

**Quirks.** Two blockers, both cheap: the page refuses curl with 403 (a browser user agent is
not enough; the fetch proxy reads it fine), and the CDN refuses the binary with a Cloudflare
challenge. The filenames are content hashes (`296921a82aa48aee1c5a2d9f28b64010.xlsx`), so they
change every year and must be scraped from the page each January. Two editions are listed at a
time (`ข้อมูลเวลาปฏิบัติศาสนกิจ ปี 2568` and `ปี 2569`, that is 2025 and 2026 BE), which gives a
free year of backfill.

**Response shape.** XLSX, one sheet per province, a header block with the province name in Thai
and the Hijri year, then one row per Gregorian day with the five times and sunrise (`فجر` to
`อีชา` in Thai transliteration).

**Parse rules.** Read via a spreadsheet library, locate the header row by its first Thai label,
map columns by header text, and convert BE years by subtracting 543. The measured recipe is
fajr 19.8, isha 18.1, Shafi Asr, which reproduces 365 of 365 days.

**Checks.** Monotonic six. 365 or 366 rows per province. 77 provinces present. BE year equals
CE year + 543.

**Failure modes.** Cloudflare escalation at bake time (the bake must go through a browser-grade
fetch; a plain HTTP client will not do). A province missing from the page (assert 77). Fallback
is the recipe, MAE under a minute.

**Dry run.**

```
# the binary needs a browser-grade fetch; the page read is the cheap check
curl -sS -o /dev/null -w "%{http_code}\n" https://www.skthai.org/th/pages/28433
# expect: 403 from a plain client (documented), readable through the fetch proxy
```

### 3.14 The remaining annual feeds

Same contract, all annual, all with a computed fallback. The endpoint column is the recorded
surface; each was measured in the research phase and none is newly probed here.

| Source | Endpoint | Obtain | Fallback recipe |
| --- | --- | --- | --- |
| Tunisia INM | `meteo.tn/fr/heures-prieres` | authority page, part year, keyless | 18/18, dhuhr +7, maghrib +2, fajr floor |
| Algeria MARW | `marw.gov.dz` | authority PDF, whole year, keyed | 17.91/17.09, dhuhr +1, maghrib ceil +2.75 |
| Libya Awqaf | `awqaf.gov.ly` | authority page, part year | 18.5/18, +3/+3 |
| Yemen Awqaf | `awqaf.gov.ye` | authority page monthly API, 1,064 rows measured | 18/16.0, dhuhr +10, maghrib +10, nearest |
| Oman MARA | `mara.gov.om/calendar_page2.asp` | authority page, part year | 17.95/18.2, +5 on dhuhr/asr/maghrib, perfect ceil |
| Kuwait Awqaf | `eservices.awqaf.gov.kw` | authority calendar | library preset exact, 18/17.5, floor fajr, nearest evening |
| Bahrain Awqaf | council PDFs, plain browser UA | authority PDF | 18/18 angle, dhuhr floor +1, maghrib nearest |
| Palestine | per-governorate tables | authority page | 18/18 |
| Bangladesh IFA | `islamicfoundation.gov.bd` | authority PDF (Ramadan artefact) | 18.4 ridge fajr / 18.35 isha, Hanafi, dhuhr +3 |
| Iraq Diwan | `eldwanapp.jeeteak.com` | authority app API | 18/17 angle, dhuhr +5, maghrib +3, Shafi +3 |
| Pakistan | Karachi university fatwas | authority PDF | 18/18 |
| India Deoband | `darulifta-deoband.com` | authority fatwa | 18/18, Hanafi |
| Iran | `calendar.ut.ac.ir` | authority page, isha NOT-PUBLISHED | 17.7, isha `--:--` |
| Azerbaijan | `caucasus-muslims.org` | authority image, whole year, to 2031 | 15.85/14.76, Hanafi, maghrib +14 |
| Belgium EMB | `emb-net.be/nl/gebedstijden` | authority PDF, whole year | 17.99/18, maghrib +2, frozen clock time |
| France GMP | `grandemosqueedeparis.fr` | mosque platform, whole year | seasonal angle sweep 13.03 to 18.10, maghrib +87 |
| Sweden IFiS | `islamiskaforbundet.se/bonetider` | authority page, whole year | 18/16, frozen fraction of night |
| Norway IRN | `bonnetid.no` | authority page, whole year | 16/15, maghrib +4, frozen clock time |
| Germany DITIB | local mosque tables | authority page | 18/16, 45th-parallel rule |
| Netherlands | consensus tables | authority page | 18/17 plus caps |
| Austria IGGOe | `derislam.at` | authority page | June-21 anchored V with clamps |
| Switzerland IZRS | `izrs.ch` | authority page | measured seasonal pair |
| USA FCNA | `fiqhcouncil.org` | ruling | 15/15 |
| Canada | `fiqhcouncil.org` | ruling | 13/13 |
| South Africa MJC | `mjc.org.za/salaah-times` | authority page | 17.96/16.99 |
| Nigeria, China, Philippines, Australia, Brazil, Kenya, Ethiopia, Uzbekistan | none usable | fallback by absence | Moonsighting Committee |

---

## PART 4. CLASS 3, RECIPE ONLY

| Source | Why it is here |
| --- | --- |
| Bosnia `ba-rijaset-sarajevo` | any-year echo proves server-side computation; no digits to bake |
| Kazakhstan `kz-muftiyat-astana` | the authority computes in the browser; bake the 5,694-city table and the recipe |
| Kyrgyzstan `kg-muftiyat-bishkek` | a 21-day rolling window, no year door; rolling capture, recipe is the artifact |
| Taipei | no stable rule across 32 sampled days; buffers drift year over year |
| Ireland IFI | API carries a DST defect (switches 1 April and 1 November, +61/-55 on 10 rows) and no single convention; data feed only |
| Lebanon Dar al-Fatwa | the official feed is a composite no coordinate reproduces; fixed UTC+2 |
| Kosovo BIK | the widget carries broken 2020 foreign data; banned as a source |
| Sudan | the surface is dead, 2027 unissued |

---

## PART 5. The January re-bake calendar

Windows are UTC. "Hard stop" is the date after which the artifact expires and the country
falls to its computed recipe silently.

| Source | Probe starts | Hard stop | Signal the new year has landed |
| --- | --- | --- | --- |
| JAKIM, 59 zones | 01-01 | none, feed is always current | first `date` reads `01-Jan-<N>` |
| Brunei MORA | 20-12 | 31-12 | newest OData `Date` passes 31-12 |
| Singapore MUIS | 10-12 | 31-01 | a new dataset id with `<N>` in the filename |
| Indonesia (518 cities) | 15-12 | monthly, 31-01 | month 1 of `<N>` returns rows |
| Egypt ESA | 01-01 and the 1st of each month | 31-01 | the monthly postback returns 31 rows |
| Turkey Diyanet | 01-01 | 05-01 | the yearly table's first row is `01 Ocak <N>` |
| UAE Awqaf | 01-11 | 31-12 | a non-empty `prayerData` for `<$N>-01-01` |
| Morocco Habous | 01-12 | none, recipe serves | any `/prieres/` path answers 200 |
| Jordan Awqaf | daily | none | the panel date equals today |
| Qatar MOI | daily | none | the fragment date equals today |
| Sri Lanka ACJU | 05th of each month | next month | new `uploads/<Y>/<M>/` files for all 13 zones |
| Thailand SKTHAI | 01-01 | 20-01 | new XLSX hashes and a `ปี <N+543>` edition |
| Maldives | not annual | none | vendor file commit changes |
| London LUPT | any time | none, 50 years held | requested year returns 365/366 rows |
| Saudi Umm al-Qura | any time | 1500H = 2077-11-16 | one GET per Hijri year |

Order of operations in the January run: Saudi and London first (they never fail and prove the
pipeline), then the keyless JSON feeds (JAKIM, Singapore, Brunei), then the token and postback
feeds (UAE, Egypt), then the HTML and PDF feeds (Turkey, Sri Lanka, Thailand), then the
rolling captures (Jordan, Qatar, Kyrgyzstan). Each source is independent; a failure aborts that
source only.

---

## PART 6. Verification ledger, 2026-11-10

| Source | Method | Result |
| --- | --- | --- |
| London | curl | 401 without key, confirms keyed |
| Saudi | curl | 1447/1448/1500 = 200, 1501 = 400 with bounds; zone = hourly offset |
| Kazakhstan | curl | cities API 200, count 5,694, 6-decimal coords, Cyrillic-only search |
| Kyrgyzstan | curl | calendar page 200, 21-day embedded window, range params clamped by 302 |
| Maldives | curl | vendored SQL 200, 1,299,231 bytes, 202 islands / 42 bands / 366 days |
| JAKIM | curl | 200, 365 rows, year param ignored |
| Brunei | curl | OData 200, newest row 2026-12-31, field list confirmed |
| Singapore | curl | poll 201, presigned CSV, 366 lines, 8 columns |
| Indonesia | curl | 200 per month, 2026 and 2029 to 2031, values vary per date |
| Egypt | curl | daily 200 with 82 city options, monthly 200 with two dropdowns, no server rows |
| Turkey | curl | 200, 365 data rows, current year only |
| UAE | curl POST + GET | token 200 with Origin, Jan 2027 = 1,860 rows / 60 areas, 2028+ empty |
| Morocco | curl | three candidate paths all 404, site rebuilt |
| Jordan | curl | 200, one day, six rows |
| Qatar | curl | 200, HTML fragment, today only |
| Bosnia | curl | any year 2026 to 2035, identical values for non-leap years |
| Sri Lanka | curl + wp-json | page 200, no table, 312 upload URLs, 13 zones x 12 months |
| Thailand | fetch proxy + curl | page 403 to curl, readable via proxy, 77 provinces x 2 years XLSX, binary blocked |

UNVERIFIED-TODAY, with the reason:

| Source | Why |
| --- | --- |
| Thailand XLSX binary | Cloudflare challenge on the CDN for a non-browser client |
| Sri Lanka OCR content | the PDFs are images; OCR quality was not assessed |
| Morocco | the surface is gone; no alternate path found |
| Egypt postback round-trip | the GET shape was verified; a full postback replay was not run (it is state-changing in form but read-only in effect, and belongs to the bake) |
| London data | no key in this session |
| Turkey 2027 | the public page serves the current year only; the 2027 validation stands on the record's awqatsalah read |
| Indonesia 2030 repetition claim | contradicted by today's probe; left as a caveat |

---

## PART 7. Failure playbook

1. **A fetch fails.** Retry twice with a 30 s timeout, then mark the source expired and let the
   country compute. Log the status, the byte count and the first 200 bytes of the body.
2. **A parse yields zero rows with a 200.** Treat as expiry, not success. This is the UAE
   out-of-horizon signal and the Egypt postback failure mode both.
3. **Monotonicity fails on one day.** Quarantine the day and re-fetch once. If it repeats, drop
   the year for that source: a publisher with shifted columns is not repairable at bake time.
4. **Count is short by one day.** Re-fetch; if still short, accept and mark `partial`, because a
   one-day gap on a 365-row artifact is smaller than the fallback's error.
5. **Identity fails.** Hard stop. A feed answering for the wrong city is worse than no feed.
6. **A source's endpoint 404s structurally (Morocco today).** Record the death in the ledger and
   fall to computation. Never scrape a mirror to fill the gap: the mirror is a repetition
   artefact by construction, and Indonesia's is the worked example of how that looks.

---

## PART 8. Assumptions made in this runbook

- The keys and tokens the pipeline needs (LUPT key, Diyanet AwqatSalah account) are owner-held
  and supplied through the environment, never committed. Evidence: the LUPT meta file records
  the key as owner-supplied and not stored.
- Sri Lanka's OCR class is a recommendation, not a decision: the ticket ranks it annual, and
  the record already dropped Azerbaijan to recipe tier for image payloads. Evidence: the ACJU
  page now serves JPG and PDF, not a table.
- Bosnia stays in the annual list for cross-checking but must not be baked, because its values
  are the same for any year. Evidence: 2026, 2030 and 2035 are byte-identical.
- The 40-feed count in the January class is treated as approximate; the runbook names 13 with
  full entries and 27 more in the batch table.
