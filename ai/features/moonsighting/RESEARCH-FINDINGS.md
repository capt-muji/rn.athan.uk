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

## 3. Uncertain or still being established

- Why the `www.moonsighting.com/time_json.php` endpoint returns 500 while `praytable.php` works.
- The exact London modification (per prayer, rule, fit).
- Whether `adhan`'s `MoonsightingCommittee` reproduces the endpoint, and by how many minutes.
- Which other implementations trace to Khalid Shaukat's committee.

## 4. How each finding would affect the app

To be completed.

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
