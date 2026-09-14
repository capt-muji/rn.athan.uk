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

## 3. Uncertain or still being established

- Why the `www.moonsighting.com` endpoint returns 500, and who operates the fallback host.
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
