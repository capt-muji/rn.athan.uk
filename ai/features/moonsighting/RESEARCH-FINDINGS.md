# Moonsighting Committee prayer-time method (Khalid Shaukat): research findings

**Status: IN PROGRESS.** Session started 2026-09-14 on branch `research/moonsighting` (worktree
`~/athan-research-wt`, based on `uat-2` at `466b568`). Research only: no app code changed, nothing
built, nothing merged or pushed. Brief: `ai/prompts/moonsighting-research.md`.

Scratch material (crawl, PDFs, endpoint responses, scripts, agent notes) lives under
`~/athan-research/`, outside both checkouts.

## 1. What was researched

To be completed as each strand lands. Strands:

1. The whole of moonsighting.com, every page and every PDF (brief step 1).
2. The Unified Prayer Timetable for London and its delta from the base times (step 2).
3. The implementations: PrayerTimeAPI and moonsighting.com's `time_json.php`, mawaqit, and
   islamic-network (step 3).
4. The packages, `adhan`'s `MoonsightingCommittee` first (step 4).

## 2. Confirmed so far

### 2.1 moonsighting.com can be read (step 1 gate passed)

- 2026-09-14: `/`, `/moon.html` and `/about-us.html` each return HTTP 200. There is no sitemap
  (`/sitemap.xml` is 404), so the page list is being built by a link-walk that also mines the
  site's JS menus (`moonsightingmenu.js`, `mmenu.js`).
- `robots.txt` carries only Cloudflare's content-signal preamble, with no `Content-Signal` values
  and no `Disallow` lines. By its own definitions, an unset signal "neither grants nor restricts
  permission". Reading the site for this research is not restricted by it.

### 2.2 The Unified Prayer Timetable for London: what its founding document says

Source: <http://www.hizbululama.org.uk/articles/english/Unified.pdf>, fetched 2026-09-14 (2 pages;
the PDF was created 2012-08-10).

- The agreed timetable "is based on a mushada-guided computation model developed and maintained by
  specialist Khalid Shaukat of moonsighting.com. In addition to using standard sun and earth
  movement data, the model applies actual mushada (observation) data to determining Fajr and
  Isha'a times. The data was collected at various northern high latitude locations and at various
  times of the year, including observations made by Hizbul Ulama in the north of England."
- It was adopted "from 1 Ramadan 1432 (1 August 2011)" and is valid "within the region enclosed by
  the M25". It is voluntary. Anyone more than 20 miles from a mosque should get a timetable for
  their own location.
- The mosques that took part and adopted it: Islamic Cultural Centre & London Central Mosque,
  Mayfair Islamic Centre, East London Mosque, Muslim Welfare House, Al Muntada Al Islami Education
  Trust, Al Manaar (Muslim Cultural Heritage Centre), and Masjid Al Tawhid & Islamic Sharia Council.
- **The document states no offsets or modifications.** Whatever makes the London times differ
  from the base model has to be derived from the data or found in another source (section 3).

### 2.3 The app's provider, londonprayertimes.com

Fetched 2026-09-14, without the API key.

- Home page: "Times sourced from East London Mosque. We publish the official timetable without
  modification." and "The London Unified Prayer Times are used at a number of mosques in the
  capital, including East London Mosque, London Central Mosque and Croydon ICT."
- `/api`: parameters `format`, `key`, `date`, `year`, `month`, `city` ("london" is the only value)
  and `24hours`. "We only provide times for London." Keys are issued by hand.
- So the chain is: Khalid Shaukat's model → the London unified timetable (modified) → East London
  Mosque's published timetable → londonprayertimes.com → `api/client.ts`.

### 2.4 moonsighting.com's JSON endpoint, measured 2026-09-14

- `https://www.moonsighting.com/time_json.php?year=2026&tz=Europe/London&lat=51.5072&lon=-0.1276&method={0,1,2}&both=false&time=0`
  returns **HTTP 500 with an empty body** for all three methods.
- The fallback named in the PrayerTimeAPI README, `https://moonsighting.ahmedbukhamsin.sa/time_json.php`,
  with the same query returns HTTP 200 `application/json`:
  - a `query` echo, then 365 entries of `{"day":"Jan 01 Thu","times":{"fajr","sunrise","dhuhr","asr","asr_s","asr_h","maghrib","isha"}}`;
  - each value is `HH:mm` padded with trailing spaces;
  - `day` carries no year and no ISO date.
- For London 2026, `method` changes only Isha and, for method 2, which Asr fills `asr`:

  | 21 Jun 2026, London | fajr | sunrise | dhuhr | asr | asr_s | asr_h | maghrib | isha |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | method 0 | 02:43 | 04:43 | 13:07 | 18:40 | 17:25 | 18:40 | 21:25 | 22:42 |
  | method 1 | 02:43 | 04:43 | 13:07 | 18:40 | 17:25 | 18:40 | 21:25 | 23:52 |
  | method 2 | 02:43 | 04:43 | 13:07 | 17:25 | 17:25 | 18:40 | 21:25 | 22:41 |

  Raw responses: `~/athan-research/endpoint/moonsighting.ahmedbukhamsin.sa_london_2026_m{0,1,2}.json`.

### 2.5 The method as moonsighting.com documents it

Two pages carry the rules. <https://www.moonsighting.com/how-we.html> is headed "How We Calculate
Muslim Prayer Times" and footed "Updated March 1, 2024". <https://www.moonsighting.com/faq_pt.html>
is footed "Updated August 25, 2020". Both were fetched 2026-09-14 and are quoted here, not
paraphrased into numbers.

| Prayer | Documented rule | Source |
| --- | --- | --- |
| Fajr | Subh Sadiq, "when morning light in the sky starts spreadings horizontally"; at high latitude, Tabayyan, "when morning light in the sky has spread" | how-we |
| Sunrise | "When the top of the sun's disk just appears above the horizon" | how-we |
| Zuhr | "5 minutes after Zenith". The breakdown: 1.5 min for the disc to leave the zenith, plus 1 min for a 30-mile radius, plus 2.5 min safety | how-we, faq_pt 3.1–3.2 |
| Asr | Shadow factor 1 (Shafi'i, Maliki, Hanbali), 2 (Hanafi), 4/7 (Shi'a), added to the noon shadow | how-we |
| Maghrib | "For Sunni's, actual sunset is 3 minutes after theoretical sunset; for Shi'aas it is 17 minutes". Reasons: refraction, a 15–30 mile radius, and downward-sloping ground | how-we, faq_pt 5.1 |
| Isha | Disappearance of Shafaq: red for Shafi'i, Maliki, Hanbali and Shi'a, white for Hanafi. "At high latitudes a combination of red and white shafaq criteria is used" | how-we |

Fajr and Isha by latitude, from how-we:

- **Where the model comes from.** Observations of Subh Sadiq and of Shafaq disappearing were
  collected at Riyadh, Karachi, Tando Adam, Durban, Auckland, Sydney, Miami, Washington DC, Toronto,
  High Wycombe, Dewsbury and Blackburn. They were curve-fitted into "a function of latitude and
  seasons (day number of the solar year)".
- **Equator to 55°.** "the 18degrees depression angle calculations are compared with the values
  given by the functions of latitude and seasons and most favorable values are used, which means;
  For Fajr, the later of the two and for Isha the earlier of the two."
- **55° to 60°.** Fajr is the later of Subh Sadiq and "last 1/7th of the night". Isha is the
  earlier of Shafaq and "first 1/7th of the night" (Sab'u Lail). The page cites Ashraf Ali Thanwi
  (Imdadul Fatawa vol 2 p98) and Allamah Shami.
- **Above 60°.** "we slide down to 60degrees and calculate Fajr & Isha using the rule of Sab'u Lail
  in summer ... In winter, we use research by Moonsighting.com for Subh-Sadiq and Shafaq as
  functions of latitude and seasons". Oslo at 60° is kept as the Aqrabul-Bilad anchor, citing Dar
  al-Ifta.
- **Where the sun does not set or rise** (faq_pt 1.2). "an iterative calculation process is used by
  decreasing the latitude by 0.1 degrees keeping the longitude the same and recalculate Sunset time
  and repeat this process until a latitude is reached where the sun sets".
- **Shafaq General.** The page contradicts itself here. It says "Moonsighting.com uses Shafaq Ahmer
  in summer when nights are short and Shafaq Abyad in winter", then "Shafaq General uses Shafaq
  Abyad in Summer and Shafaq Ahmer in Winter", then again "Ahmer in summer ... Abyad in winter"
  under the above-60° rule. **UNRESOLVED:** the implementations and the formula PDFs have to settle
  which is meant.
- **The coefficients of the latitude-and-season function are not on either page.** They are
  being sought in the site's PDFs, current and archived (section 2.7), and in the implementations.
- how-we names exactly two outside resources as using the method:
  `github.com/PrayerTimeResearch/PrayerTimeAPI` and `github.com/islamic-network/prayer-times-moonsighting`.

### 2.6 How the site's own tables are generated, and who built the generator

- The timetable page <https://www.moonsighting.com/pray.php> credits: "Calculation method by
  moonsighting.com / Developed by Ahmed Bu-khamsin / Original code by PrayTimes.org". It links
  `twitter.com/techi50` and the Sky Prayers apps (Google Play `com.techiapps.skyprayers`, App
  Store id439409680).
- That page's script, `assets/js/apple_map.js` (header comment "This is the new file 01/08/2022"),
  builds the table in `loadXMLDoc()` with
  `GET praytable.php?year=&tz=&lat=&lon=&method=&both=&time=`. That is the same parameter set as
  `time_json.php`, but it returns HTML. The time zone defaults to the browser's
  `Intl.DateTimeFormat().resolvedOptions().timeZone`, or `tzlookup(lat, lon)` after the pin is
  dragged. The Wayback Machine holds `praytable.php` captures from 2016 to 2024.
- **The published table and the fallback JSON are identical, measured.** On 2026-09-14,
  `https://www.moonsighting.com/praytable.php` for London (51.5072, -0.1276, Europe/London) 2026
  returned HTTP 200. Every day and every column matched
  `moonsighting.ahmedbukhamsin.sa/time_json.php`: 365 days × 6 columns × 3 methods = 6,570 cells,
  **0 mismatches**.
- The HTML table labels the columns by method: m0 `Asr(H)`/`Isha`, m1 `Asr(H)`/`Isha(H)`,
  m2 `Asr(S)`/`Isha(S)`.
- So `moonsighting.ahmedbukhamsin.sa` is the generator developer's own host, not an unrelated
  mirror. The one-year check says its JSON is the site's published table in machine-readable form.
  Whether that holds at every latitude is being measured.

### 2.7 Prayer-time documents the site once carried

The live site no longer links any prayer-time PDF. The Wayback Machine's URL index for
`moonsighting.com/*` (5,875 URLs, fetched 2026-09-14) lists these, each captured with HTTP 200:
`fajarishainbritain1.pdf` (2006), `fajar&isha-a5.pdf` (2006), `fajr&isha-yam.pdf` (2007),
`articles/fajr&isha-yam.pdf` (2007), `articles/uk-prayercharts.pdf` (2007),
`articles/prayers-uk.pdf` (2008), `articles/uk-prayercharts1.pdf` (2010), `prayer.html` (1999),
`prayer-french.html` and `timezone.html`. Every PDF, DOC and PPT in that index is being downloaded
(the live copy when it still exists, the Wayback raw capture otherwise) and read in full.

### 2.8 The UK lineage: Hizbul Ulama's national tables, computed by Khalid Shaukat

Both files are Wayback raw captures of documents moonsighting.com once hosted. Neither is linked
from the live site.

- **2006 edition.** `http://www.moonsighting.com/articles/uk-prayercharts.pdf`, capture
  `20070810011835`; the PDF was created 2006-12-06; 257 pages.
- **2009 edition.** `http://www.moonsighting.com/articles/uk-prayercharts1.pdf`, capture from
  2010; the PDF was created 2009-09-08; 537 pages.
- **Both** are titled "SALAT TIMETABLES FOR TOWNS AND CITIES IN THE UNITED KINGDOM", by Molvi
  Yaqub Ahmed Miftahi of Hizbul Ulama UK (74 Upton Lane, London E7).

What the notes say (2006 edition page 2; 2009 edition pages 2 to 4):

- "These times have been kindly computed by Brother Khalid Shaukat". The 2009 edition adds that he
  "has ensured that observatory calculated times have been adapted for accuracy as observatory
  times do not take into account specific shariah requirements".
- "The Fajar and Isha times shown are based on Mushahadah (naked eye observations) carried out by
  Ulama under the direction of Hizbul Ulama UK, in Blackburn during September 1987 - August 1988."
  Ulama from Jamiatul Ulama Bartaniya, Markazi Jamiatul Ulama and Hizbul Ulama UK agreed to adopt
  them at meetings on 2 April 1988 and 2 January 1989, at Masjid Anisul Islam, Troy Street,
  Blackburn, "rather than use degree times that have been shown to be incorrect". The full
  argument is in Y. A. Miftahi's book "Fajar and Isha", with an Urdu book, "Bartaniya Me Isha Ka
  Sahih Wakt", alongside it.
- Zuhr is noon + 5 minutes, with the same 1.5 + 1 + 2.5 breakdown as how-we.html. Asr is Hanafi,
  and Shafi'i Asr is available from Shaukat on request.
- "Maghrib - 3 Minutes has already been added to calculated sunset ... Some Masajids add about 5
  minutes to sunset. So, if you prefer to add five minutes to sunset instead of three you only need
  to add a further two minutes to the maghrib time below." (2009)
- "Sunrise - ... As the sunrise times given in the tables below are calculated sunrise times, it is
  advised that a minimum of three minutes is taken away from the sunrise time given" (2009). The
  2006 edition does not carry this sentence.
- British Summer Time is built in, but "as this template is based on the 2007 calendar ... you may
  need to adjust the times by one hour for a few days only" (2009).
- The city pages include LONDON, EALING, HACKNEY and CROYDON. The 2006 LONDON page header is
  `LONDON Lt=51:30N Lg= 0:10W GMT+ 0`.

This is the documented ancestor of the London unified timetable: Shaukat's computation, Blackburn's
observations, Hizbul Ulama as the UK body, five years before the 2011 adoption. The notes also name
three places where a mosque may change the base, which makes them candidates for the London
modification: Maghrib +2 (5 minutes after sunset in place of 3), Sunrise −3, and which Asr is used.
Whether the London timetable applies any of them is being tested against real data (section 3).

### 2.9 The high-latitude rule has changed since about 2010

- **Source.** The French prayer-times page, `http://www.moonsighting.com/prayer-french.html`, Wayback
  capture `20100827001844`. The live site no longer serves it.
- **The 2010 rule.** 1/7 of the night was used "Aux latitudes comprises entre 55 et 66 degrés"
  (between 55 and 66 degrees): "Le `ichâ' commence à la fin du premier septième de la nuit, et le
  fajr commence au dernier septième de la nuit". Near and above the Arctic Circle, the times of the
  nearest lower latitude where the sun rises and sets.
- **The rule today.** how-we.html (updated 2024-03-01) uses 1/7 of the night between 55° and 60°,
  and above 60° "slide[s] down to 60degrees". So the band and the anchor latitude have moved.
  **A client or package written against the older text will disagree with today's tables above
  60°.**
- **Shafaq in England.** The same page puts its disappearance at 66 to 100 minutes after sunset
  (9° to 13.6°). The current faq_pt 2.10 says 66 to 105 minutes (12° to 9.7°).
- **The algorithm was not published there.** Of the booklet "When to Pray Fajr & Isha" (about 46
  pages), the page says: "L'algorithme de moonsighting.com pour la fonction basée sur la latitude et
  la saison n'est pas encore inclu dans le livret" (moonsighting.com's latitude-and-season
  algorithm is not yet included in the booklet). The booklet was sent by post only.
- **Where the coefficients may be.** The paper recovered from the Wayback Machine,
  `articles/fajr&isha-yam.pdf` (capture `20070410171730`), is being read for them.

### 2.10 "Fajar and Isha" (Miftahi, 2005): the observations under the UK timings

- **What it is.** Yaqub Ahmed Miftahi, *Fajar and Isha*, Hizbul Ulama UK, Ramadan 1426 /
  October 2005, 123 pages (the PDF's metadata title is "Fajar&IshainBritain", created
  2006-12-07).
- **Where it came from.** Recovered from the Wayback capture `20070410171730` of
  `http://www.moonsighting.com/articles/fajr&isha-yam.pdf`; the live site no longer serves it. It
  is the book the Hizbul Ulama tables (section 2.8) cite as "the full background". Page numbers
  below are the book's own.

**The observation record.** The Mushahadah was carried out in Blackburn, Lancashire
(Lat N53.45, Lon W02.29), from September 1987 to August 1988, by naked eye, "with a blank sheet":
the observers did not set out to test degree times. Table 4 (p115) records, per month:

- **Subha Sadiq** (first light to sunrise): 1h22m to 1h45m from September to April.
- **Shafaq Ahmar** (sunset to the end of the red afterglow): 50m to 1h24m.
- **Shafaq Abyadh** (sunset to the end of the whiteness): 1h12m to 3h16m.
- **June 1988.** "On 12 and 13 June conditions of night - Shafaqe Abyadh - did not occur ... light
  throughout, with shafaq and subha merging"; Shafaq Ahmar was still observed.
- **July 1988.** Rain throughout; nothing observed.

**The agreements.**

1. **2 April 1988**, Masjid Anisul Islam, Blackburn (p110–112), after seven months: Mushahadah is
   the basis, and the observatory's degree times are wrong. Timetables were prepared at once from
   the seven-month chart, the unobserved months were fixed by Takdir for the time being, and days
   lost to weather were to be filled "by the method of Takdir of Akrabul Ayyam".
2. **2 January 1989** (p113–114), after the full year. The Ulama agreed:
   1. "The beginning time of Fajar be determined by Akrabul Ayyam for those days where the
      whiteness of Isha merged with the light of morning".
   2. "For May and June Fajar beginning time be set at the recorded time of Tabayyun".
   3. "During summer months, due to Haraj, and as permitted by the Sahibayn ... Isha time be phased
      in using the disappearance of the red afterglow, Shafaqe Ahmar, as a basis, and towards the
      end of summer, phase out towards Shafaqe Abyadh."

   "Accordingly, a chart based on the agreement of the Ulama was distributed to UK Masajids."

**The UK chart rule (p116–118).** Table 5, "TIME TABLE OF SUBHA SADIQ IN UK", and Table 6,
"TIME TABLE OF ISHA IN UK", give an h-mm interval by day of the year:

- "To fix the time of Subha Sadiq for your city, look at the Sunrise time for your city and deduct
  the time shown on the chart for that day"; Isha is sunset plus Table 6.
- For example, Table 5 has 2-00 on 6 June; Table 6 has 1-40 on 1 January and 1-19 on 1 June.
- Mohammed Arshad Baig wrote a program that applies the charts, and the "Salat Timetables for
  Towns and Cities in the UK" (section 2.8) is the accompanying directory.
- **This is a different rule from moonsighting.com's latitude-and-season function.** It is a fixed
  interval from sunrise and sunset, observed at one place (53.45N) and applied across the UK.
- **UNVERIFIED:** whether the London unified timetable's Fajr and Isha follow this chart,
  Shaukat's function, or a mix. The London data diff (section 3) tests it.

**Where Shaukat appears in the book.** He is quoted repeatedly as an ally against fixed degrees
(e.g. "A decade long research by Moonsighting.com found that the Subha or disappearance of Shafaq
is a function of latitude and seasons"). Readers are referred to him for timetables. **No formula
or coefficient appears anywhere in the book.**

## 3. Uncertain or still being established

- Why the `www.moonsighting.com/time_json.php` endpoint returns 500 while `praytable.php` works.
- The exact London modification (per prayer, rule, fit).
- Whether `adhan`'s `MoonsightingCommittee` reproduces the endpoint, and by how many minutes.
- Which other implementations trace to Khalid Shaukat's committee.

## 4. How each finding would affect the app

This is research, so nothing here is a change. It is where each finding lands in the code as it
stands on `uat-2` at `466b568`. Sections still waiting on data are marked.

### 4.1 The moonsighting.com endpoint does not fit the current client as it is

Measured against `time_json.php` on 2026-09-14 (section 2.4), the current client would reject
every day, for four reasons:

| What the endpoint does | Where the app assumes otherwise | Effect if pointed at it unchanged |
| --- | --- | --- |
| `times` is an **array** of `{ day: "Jan 01 Thu", times: {...} }`, with no year and no ISO date | `IApiResponse.times: Record<string, IApiSingleTime>` keyed by `YYYY-MM-DD` (`shared/types.ts`); `validateApiResponse`, `filterApiData` (`TimeUtils.isDateYesterdayOrFuture(date)`) and `transformApiData` all iterate `Object.entries` and use the key as the date | The dates would be the array indices `"0"` to `"364"` |
| Values are padded: `"06:25   "` | `TIME_PATTERN = /^([01]\d\|2[0-3]):[0-5]\d$/` in `validateApiTimes` (`api/client.ts`) is anchored | Every day fails the pattern and is dropped as unreadable, so the client throws `Malformed prayer time` or `Incomplete data received` |
| The field is `maghrib` | `REQUIRED_TIMES` and `IApiSingleTime` use `magrib`, as do `transformApiData`, `adjustTime(times.magrib, …)` for Istijaba, and the night-time code | `magrib` is missing on every day |
| Two Asr fields (`asr_s`, `asr_h`), with `asr` following the method; no `*_jamat` fields | `IApiSingleTime.asr` and `asr_2`, plus the jamat fields (typed but unused) | The type needs a mapping; nothing uses the jamat fields today |

The request itself (`buildApiUrl` in `api/client.ts`, `API_CONFIG` in `api/config.ts`) would take
`lat`, `lon`, `tz` and `method` in place of `key` and `city`. **The endpoint needs no key**, so
the London-only credential goes away. The year-per-request model in `stores/sync.ts`
(`Api.fetchYear(previousYear | currentYear | nextYear)`) already matches the endpoint's `year`
parameter. The single-day and month requests that londonprayertimes.com offers have no equivalent
on `time_json.php`.

`modules/tls13` and `device/tls13.ts` exist only because `www.londonprayertimes.com` accepts
TLS 1.3 alone (finding 43). Whether the moonsighting hosts need them has not been measured.

### 4.2 One prayer timezone for the whole app

- `PRAYER_TIMEZONE = 'Europe/London'` (`shared/constants.ts:241`) is the only zone.
- `shared/time.ts` reads it for every calendar-day and clock conversion: lines 26, 247, 320 and
  331, and `createPrayerDatetime`.
- The endpoint takes `tz` per request and returns clock times in that zone. So a worldwide client
  has to carry the location's zone from the request through storage and on to every date
  computation, and the constant becomes per-location state.
- Finding 46's London-pinned test oracles (62 tests still assert London's clock values and DST
  rule), `nightTimes.test.ts` included, are the v2.0 test work this implies.

### 4.3 London shown as a fixed place in the interface

These are visual and copy, listed so they are not missed. Changing them needs the owner's say
under the standing no-visual-change rule:

- `components/day/Day.tsx:56` renders "London, UK";
- `widgets/PrayerWidget.tsx:204` subtitle "Prayer times for London";
- `device/updates.ts:15`, the App Store URL slug `athan-london`.

### 4.4 High latitude (findings 44 and 47)

**Waiting on the endpoint measurement at Reykjavik, Tromsø and Longyearbyen.** The documented
method (section 2.5) promises a value every day at every latitude, by 1/7 of the night above 55°,
sliding to 60°, and stepping latitude down 0.1° until the sun sets. If the endpoint really emits a
time for every day, then:

- the `"-----"` polar window that `validateApiTimes` was written for would not occur from this
  source;
- Magrib and Isha after midnight (finding 44's `adjustPrayerDateForMidnightCrossing`,
  `calculateBelongsToDate`, `getNightTimesForDay` in `shared/prayer.ts`) would be exercised every
  summer above about 60°.

### 4.5 The London modification

**Waiting on the London data diff (section 3).** The candidates are named in sections 2.8 and
2.10. Whatever it turns out to be decides whether a v2.0 London user sees today's times from the
moonsighting.com base, or needs London's delta applied on top. Applying one would contradict the
standing rule that the app edits nothing the API returns, unless the delta comes from a source
rather than from the app.

## 5. Open questions for the owner

To be completed.

## 6. Next session should

To be completed.

## Sources

| Source | URL | Fetched |
| --- | --- | --- |
| moonsighting.com home, moon, about-us, robots.txt | <https://www.moonsighting.com/> | 2026-09-14 |
| Unified Prayer Times for London, general announcement | <http://www.hizbululama.org.uk/articles/english/Unified.pdf> | 2026-09-14 |
| London Prayer Times home and API docs | <https://www.londonprayertimes.com/>, <https://www.londonprayertimes.com/api> | 2026-09-14 |
| moonsighting.com JSON endpoint and fallback | <https://www.moonsighting.com/time_json.php>, <https://moonsighting.ahmedbukhamsin.sa/time_json.php> | 2026-09-14 |
