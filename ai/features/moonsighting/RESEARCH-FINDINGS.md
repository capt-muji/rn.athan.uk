# Moonsighting Committee prayer-time method (Khalid Shaukat): research findings

**Status: IN PROGRESS.** Session started 2026-09-14 on branch `research/moonsighting` (worktree
`~/athan-research-wt`, based on `uat-2` at `466b568`). Research only: no app code changed, nothing
built, nothing merged or pushed. Brief: `ai/prompts/moonsighting-research.md`.

Scratch material (crawl, PDFs, endpoint responses, scripts, agent notes) lives under
`~/athan-research/`, outside both checkouts.

## 1. What was researched

The four steps of the brief, run by the lead in parallel with five Opus research agents. Each
agent's full notes are in `~/athan-research/notes/`.

1. **moonsighting.com, every page and every document (step 1)**
   - The live site was link-walked twice, mining links in pages and in the site's JS menus. The
     first crawl was stopped when it looped on `gregorian-calendar.php?YEAR`. The second pass
     covered every link from saved pages, plus every page in the Wayback Machine's 5,875-URL index
     for the domain (`crawl.py`, `crawl2.py`).
   - Every page is being read in full by an agent (`notes/site.md`).
   - Every PDF, DOC and PPT the site carries **or once carried** was downloaded, from the live copy
     where it still exists and otherwise from the Wayback raw capture (58 of 59; `pdfs/manifest.json`).
     Each was read in full, with a page ledger (`notes/documents.md`, section 2.17).
   - All 64 archived versions of the old `prayer.html` were fetched and read in full, the first
     whole and every line of each sequential diff, to date each method change
     (`notes/prayer-history.md`).
2. **The London unified timetable (step 2)**
   - The founding announcement, `Unified.pdf`, was read.
   - The UK lineage was traced through Hizbul Ulama's national tables and Miftahi's book.
   - The reference is the London Prayer Times API's own 2026 year. It was fetched once, with a key
     the owner supplied for the purpose; the key is not stored and not committed. The London data
     work is in `notes/london.md` and section 2.14.
3. **The implementations (step 3)**
   - PrayerTimeAPI's source, and both `time_json.php` hosts measured, including the site's own
     `praytable.php`.
   - mawaqit, islamic-network, kskhan77 and muballighapp read with `opensrc` (`notes/implementations.md`).
4. **The packages (step 4)**
   - `adhan@4.4.6` read with `opensrc` and diffed against the endpoint, every day of 2026, for
     twelve cities and three methods (`notes/adhan.md`, `adhan/results/`).
   - An npm-wide search for other implementations (`notes/implementations.md`).

Tools: WebFetch, `curl`, `agent-browser` and `opensrc`. The tinyfish and docs-mcp servers from
`~/.config/opencode/AGENTS.md` are opencode-only and were not loaded in this Claude Code session.
Nothing was built, no test suite ran, and no app code changed.

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

Raw HTML of `/`, `/api`, `/news` and `/privacy`, fetched with `curl` on 2026-09-14 and read in
full (saved in `~/athan-research/london/lpt-site/`). The earlier WebFetch summaries were replaced
by these reads.

- **Every page's footer:** "Times sourced from East London Mosque. We publish the official
  timetable without modification." and "© London Unified Prayer Times".
- **Home:** "Here you can find the Unified Islamic Prayer Timetable for London. The London Unified
  Prayer Times are used at a number of mosques in the capital, including East London Mosque,
  London Central Mosque and Croydon ICT. We publish the official timetable as provided; where
  jama'ah times are shown, they reflect East London Mosque."
- **`/api`, "Updated Sat 25th April 2026":**
  - endpoint `http://www.londonprayertimes.com/api/times/`, method GET;
  - required `format` (json or xml) and `key`;
  - optional `date` (yyyy-mm-dd), `year`, `month`, `city` ("london") and `24hours` ("true");
  - its notes read "2025 times added (24th Oct 2024)", "24 hour format functionality added
    (22 May 2019)" and "Cities: We only provide times for London";
  - keys are issued by hand: "We manually process this application".
- **`/news`, 13 August 2025:** "This API has been running for over a decade, however the website
  has just been through a refresh ... based on the official East London Mosque timetable ... The
  LPT API is completely free for all use."
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
  capture `20100827001844`, footed "Mise à jour 30 mars 2010" (updated 30 March 2010). The live
  site no longer serves it. Read in full (21,689 characters of text).
- **What else it says.**
  - Timetables are still requested by email, with the city, country and school in the subject line.
  - It links "Urdu letter – Ghaur Talab" as independent confirmation "par des scientifiques au
    Pakistan en 2007".
  - It links a page of "horaires des prières des grandes villes du Royaume-Uni" (prayer times for
    the UK's major cities).
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

### 2.11 `adhan`'s `MoonsightingCommittee`: the source, and deltas in minutes

The full notes, scripts and tables are in `~/athan-research/notes/adhan.md` and
`~/athan-research/adhan/results/{tables,edges}.md`. The source quotes below were checked line by
line against `adhan@4.4.6` (fetched with `opensrc`, MIT, repo `batoulapps/adhan-js`, npm latest,
modified 2026-08-31).

**What the code does**

- `CalculationMethod.ts:45-54`: `new CalculationParameters('MoonsightingCommittee', 18, 18)` with
  `methodAdjustments` `dhuhr: 5, maghrib: 3`. That is Zuhr noon + 5 and Maghrib sunset + 3, as
  how-we.html says.
- `Astronomical.ts:327-356`, `seasonAdjustedMorningTwilight`: minutes before sunrise, piecewise
  linear in days since the winter solstice (`daysSinceSolstice`: day of year + 10 in the north;
  day of year − 172, or − 173 in a leap year, in the south):

  | Set | a | b | c | d |
  | --- | --- | --- | --- | --- |
  | Fajr | 75 + 28.65/55·\|lat\| | 75 + 19.44/55·\|lat\| | 75 + 32.74/55·\|lat\| | 75 + 48.1/55·\|lat\| |

  The segments are `<91` (a→b), `<137` (b→c), `<183` (c→d), `<229` (d→c), `<275` (c→b), and
  otherwise b→a.
- `Astronomical.ts:358-400`, `seasonAdjustedEveningTwilight`: minutes after sunset, with the same
  segments.

  | Shafaq | a | b | c | d |
  | --- | --- | --- | --- | --- |
  | Ahmer | 62 + 17.4/55·\|lat\| | 62 − 7.16/55·\|lat\| | 62 + 5.12/55·\|lat\| | 62 + 19.44/55·\|lat\| |
  | Abyad | 75 + 25.6/55·\|lat\| | 75 + 7.16/55·\|lat\| | 75 + 36.84/55·\|lat\| | 75 + 81.84/55·\|lat\| |
  | General | 75 + 25.6/55·\|lat\| | 75 + 2.05/55·\|lat\| | 75 − 9.21/55·\|lat\| | 75 + 6.14/55·\|lat\| |

- `PrayerTimes.ts:115-181`:
  - Fajr is the **later** of the 18° time and the seasonal time; Isha is the **earlier** of the two.
  - When `coordinates.latitude >= 55` (`HIGH_LATITUDE_THRESHOLD`, line 24), the 18° time is first
    replaced by 1/7 of the night, then compared in the same way.
  - The comparison uses **signed** latitude, so the 1/7 rule never applies south of −55°. This is
    an adhan choice that no documented rule supports.

**Where the coefficients come from, and how far they can be trusted**

- **They are published in Shaukat's booklet.** §11 of "FAJR AND ISHA" (September 2015) gives exactly
  these coefficients (section 2.16) **[lead-verified]**. adhan's maintainer attributes them to "a
  document from Khalid Shaukat" (adhan-js issue #78); whether that document is the booklet is
  **UNVERIFIED**.
- **They agree with the one place Shaukat did publish figures:**
  - The Blackburn ranges he quotes in Miftahi's book are Fajr 94–122 minutes and Shafaq 66–100
    minutes. adhan's functions at 53.75°N give 94.00–122.00 and, for General, 66.00–100.02.
  - The current faq_pt 2.10 says Shafaq takes "66 to 105 minutes", which matches none of adhan's
    three Isha sets. **UNVERIFIED** which figure is current.
- **The General coefficients settle how-we.html's contradiction (section 2.5).** Shafaq General is
  Ahmer-like in summer and Abyad-like in winter.

**Deltas against the endpoint.** All figures are adhan minus endpoint, in minutes, for every day
of 2026 and all three methods. The endpoint's own methods map to adhan settings as
m0 = General + Hanafi, m1 = Abyad + Hanafi and m2 = Ahmer + Shafi'i. That mapping was measured,
not assumed: the wrong pairings match on at most 82 days.

| City (lat) | Fajr exact / ±1 / ≥2 | Isha m0 exact / ±1 / ≥2 | Largest other |
| --- | --- | --- | --- |
| London (51.5) | 339 / 26 / 0 | 339 / 26 / 0 | Asr (Shafi'i) ±2 on 28 days |
| Makkah (21.4) | 362 / 3 / 0 | 358 / 7 / 0 | none |
| Jakarta (−6.2), Cape Town (−33.9) | 361 / 4 / 0, 355 / 10 / 0 | 357 / 8 / 0, 353 / 12 / 0 | none |
| Sydney (−33.9) | ±60 on 2 days | ±60 on 2 days | the endpoint's daylight-saving error (2.12), not adhan |
| New York, Toronto, Oslo, Helsinki, Anchorage, Reykjavik (to 64.1) | never ≥2 (Reykjavik Fajr 209 / 156 / 0) | never ≥2 | Asr ±3 to ±6 at 60–64°, October to February |
| Tromsø (69.6) | −13 to −19 on boundary days; polar day and night differ entirely | −226 on 27 November | Asr −395 on 23 November, where adhan's Asr runs away with the sun below about 2° at noon |

- Dhuhr and Maghrib match only with adhan's +5 and +3 in place. With them zeroed, no day matches.
- Nearest-minute rounding reproduces the endpoint best.

**How the two differ at high latitude**

- **The slide to 60°.** Neither adhan nor the endpoint does it. how-we.html (2024) says it happens
  above 60°. Both use local 1/7 of the night, which is what the 2010 page described (section 2.9).
  Forcing the slide makes the fit worse, by up to 5 minutes at Anchorage and 20 at Reykjavik.
- **Tromsø in polar day** (21 June): the endpoint prints `-----` for Fajr, Sunrise, Maghrib and
  Isha. adhan's default returns Invalid Date for the same four. adhan's `PolarCircleResolution`
  options fill them in, but by rules of its own:
  - `AqrabBalad` steps latitude 0.5° while latitude is 65° or more, and moves every prayer.
  - faq_pt 1.2 describes 0.1° steps.
- **Tromsø in polar night** (21 December, and 48 days in all): the endpoint gives plain 18° times
  (Fajr 06:28, Isha 16:56, both reproduced by rounded 18°) and `-----` for Sunrise and Maghrib. No
  adhan option reproduces that.
- **`HighLatitudeRule` has no effect under this method.** It changed zero instants, in any city,
  on any day.

**Verdict: none, as the brief asks.** Up to 64°N adhan and the endpoint agree to within one
minute on five of the six times. Asr diverges more, and Tromsø differs by up to hours. The coefficients match Shaukat's published booklet (section 2.16).

### 2.12 The endpoint changes the clock a day early in some timezones

Measured on the cached 2026 method-0 years. For each city, the day Dhuhr jumps by about 60 minutes
was compared with the day the zone's offset really changes (noon to noon, Python `zoneinfo`,
IANA tzdata 2026c). **[lead-verified]** for all seven faulty zones.

| Zone | Endpoint jumps | Real change | |
| --- | --- | --- | --- |
| Australia/Sydney | Sat 4 Apr, Sat 3 Oct | Sun 5 Apr, Sun 4 Oct | **a day early** |
| Australia/Adelaide (half-hour zone) | Sat 4 Apr, Sat 3 Oct | Sun 5 Apr, Sun 4 Oct | **a day early** |
| Pacific/Auckland | Sat 4 Apr, Sat 26 Sep | Sun 5 Apr, Sun 27 Sep | **a day early** |
| Antarctica/McMurdo (follows New Zealand; predicted before fetching) | Sat 4 Apr, Sat 26 Sep | Sun 5 Apr, Sun 27 Sep | **a day early** |
| Asia/Beirut | Sat 28 Mar, Sat 24 Oct | Sun 29 Mar, Sun 25 Oct | **a day early** |
| Africa/Cairo | Thu 23 Apr, Thu 29 Oct | Fri 24 Apr, Fri 30 Oct | **a day early** |
| Asia/Jerusalem | Thu 26 Mar, Sat 24 Oct | Fri 27 Mar, Sun 25 Oct | **a day early** |
| Europe/London, Oslo; Tromsø, Longyearbyen, Reykjavik; America/New_York, Toronto, Chicago, Anchorage, Santiago, St John's | on the real day | | correct |

- **On those days every time is an hour off, all six fields together.** For example, Sydney's Dhuhr
  is 13:04 on Friday 3 April and 12:03 on Saturday 4 April, although Sydney stays on UTC+11 until
  03:00 on Sunday 5 April. adhan, computed on the real offset, is right on those days.
- **The site's own table has the same fault.** `praytable.php` for Sydney 2026 equals the JSON
  endpoint on all 2,190 cells, including the 4 April and 3 October rows **[lead-verified]**.
- **Mechanism, bounded by measurement (the source is not public).** Each date's offset behaves as if
  sampled at an instant in [00:00, 01:00) UTC of the following day:
  - Jerusalem's transition, exactly at 00:00 UTC, comes out early;
  - London's, at 01:00 UTC, comes out correct.
  - Every zone whose transition instant falls before 01:00 UTC of the next day is affected: Australia,
    New Zealand, the Levant and Egypt. Palestine was not measured.
- **Wider timezone sweep.** The implementations agent covered 26 IANA zones (`notes/implementations.md`
  §2.10b).
  - **18 zones are correct on every day,** including half-hour and 45-minute offsets (Kolkata,
    Kathmandu, St John's), +14 (Kiritimati), −11 (Pago Pago) and Morocco's Ramadan switches.
  - **Casablanca after 20 September 2026** is served at +1 on 103 days where tzdata 2026c says +0.
    The endpoint follows an older tz rule; Node's ICU tz 2025c agrees with it. Which rule is right is
    **UNVERIFIED**, since the date is still in the future.
  - Either way, the endpoint's times are only as current as its PHP timezone database, whose version a
    client cannot see.
- **This matters because of the owner's rule that the app edits nothing the API returns.** A v2.0
  client in those zones would ship an hour-wrong day twice a year unless:
  - the source is fixed (a server-side bug the owners could fix; reporting it is the cleanest route);
  - the day is rejected;
  - or the owner rules otherwise (section 5).

### 2.13 How the published method changed, 1999 to 2024

**Source.** `http://www.moonsighting.com/prayer.html` was the site's prayer-times page before
how-we.html. The Wayback Machine holds 64 distinct captures, by content digest, all downloaded to
`~/athan-research/pdfs/wayback/prayer-html/`:

- **60 real pages,** from 1999-02-21 to 2011-08-27.
- **4 bot-challenge pages** ("One moment, please...", 2021 to 2025) with no prayer content. There
  are no captures at all from 2012 to 2020.
- **All 60 were read in full by an agent,** in `~/athan-research/notes/prayer-history.md`: the first
  capture whole, every line of all 63 sequential diffs (4,031 lines), and the last real capture
  whole.
- **Links included.** The reading texts include every link target.
- **Spot-checked.** The lead confirmed the dates below by full-text search across the captures.
- **Corrections.** An earlier version of this section rested on keyword extracts truncated per
  capture. This replaces it. Two corrections: the page used **15° before 2003**, and 1/7 of the
  night was **absent from 2005 to 2009**.

Dates are the capture timestamp, followed by the page's own "Updated" line.

| Period | What the page says |
| --- | --- |
| 1999-02 to 2003-06 (Dec 1998 to May 2003) | "Fajr & Isha are calculated for Sun being **15 degrees** below horizon, a value adopted by ISNA". From 1999-10: observations put the angle "closer to 13.5 degrees". For latitudes above **45°**: "1/7th of the night before sunrise for Fajr and 1/7th of the night after sunset for Isha ... the times are roughly those of nearby latitudes". Timetables were only by email request to Khalid Shaukat. |
| 1999-11 to 2000-10 | Maghrib "should be calculated **at least as 1 minutes** after sunset", with "another 2 minutes" for big cities. Before and after this window it is 3 minutes. Zuhr is noon + 5 throughout. |
| 2003-12 to 2005-03 (Oct 2003 to Mar 2005) | "Fajr & Isha are calculated for Sun being **18 degrees** below horizon", with the "1/7th of the Night Rule" at high latitude. From 2004-10: "a combination of 18 degrees, 15 degrees, and even 12 degrees". |
| **2005-05-17 (May 5, 2005)** | "Calculations of Fajr & Isha based on 18° or 15° or fixed minutes before sunset or after sunrise are wrong", "as has been confirmed by Hizbul Ulama UK, 74a Upton Lane, London". "A decade long research by Moonsighting.com found that the Subh-Sadiq or disappearance of Shafaq is a **function of latitude and seasons**. When this function is checked against all round the year observations of Blackburn, UK, the calculations matched observations with amazing accuracy." The 1/7 rule and 18/15/12 are **removed**. Near the Arctic Circle it now says "calculate for nearby lower latitudes where the sun sets and rises". "Moonsighting.com algorithm for function of latitudes and seasons is not yet included in the booklet." |
| 2005-11 to 2011-07 | Links Miftahi's book (`fajarishainbritain1.pdf`, then `fajar&isha-a5.pdf`, then `articles/fajr&isha-yam.pdf`). From 2007-03 to 2010-10 it also links the UK city tables (`articles/uk-prayercharts.pdf`, then `uk-prayercharts1.pdf`), and from 2008-12 to 2011-07 `articles/prayers-uk.pdf`. |
| 2006-05 to 2010-01 | "Shafaq disappears at 66 to 100 minutes (9 to 13.6 egrees) at higher latitudes (like England) ... Subh-Sadiq at higher latitudes is observed at 94 to 122 minutes (14.5 to 10.6 degrees)". Adhan's functions reproduce these ranges at 53.75°N (section 2.11). |
| 2008-02 to 2008-12 | "Every year the prayer times shift slightly by plus minus 1 or 2 minutes, because of February 29 in leap years. Request prayer times for a specific year for accurate times." From 2008-12 the page adds that DST dates also differ every year, so "avoid using PERPETUAL PRAYER TIMES". |
| **2009-09-22 (Sep 10, 2009)** | The 1/7 rule **returns**: "At latitudes between 55 - 66 degrees, the rule of Sab'u Lail (1/7th of the night) is used ... Isha starts at the end of first 1/7th of the night, and Fajr starts at the last 1/7th of the night." |
| **2010-07-28 (Jul 8, 2010)** | Heading "HOW MOONSIGHTING.COM CALCULATES PRAYER TIMES". Blackburn "Subh-Sadiq ... 93 to 123 minutes before sunrise ... Shafaq Ahmer ... 55 to 81 minutes after sunset ... Shafaq Abyad occurs 77 to 105 minutes". "Both Shafaq Ahmer and Shafaq Abyad can be calculated by different mathematical formulae. These formulae are good up to the 55° latitude." At 55–66°, "Isha starts at the time which is earlier of Shafaq calculation or first 1/7th of the night. Similarly Fajr starts at the time which is later of Tabayyan (when morning light in the sky spreads horizontally) or the last 1/7th of the night." |
| **2011-05-22 (May 3, 2011)** | The band becomes "**between 55° and 65°**". Above 65°: "calculate for nearest lower latitudes where the sun sets and rises". "With curve-fit technique, moonsighting.com came up with a function of latitude and seasons." "London, ENGLAND - Hanbali" is added as an email-request example. |
| 2011-06-23, 2011-07-27 | Adds the Thanwi, Shami and Usmani citations: "(the UK in the summer months) ... one should stop eating 10 minutes before this time". |
| **2011-08-27 (Aug 16, 2011)**, the last real capture | Rewritten about two weeks after London adopted the unified timetable on 1 August 2011. **Removed:** the email-request box, all DST and time-zone text, the Hizbul Ulama book and `prayers-uk.pdf` links, and the Blackburn minute figures. **Added:** "Prayer Times Definition We Use" (Maghrib "3 minutes after theoretical sunset"; Dhuhr "5 minutes after Zenith") and "Moonsighting.com uses a combination of **Shafaq Abyad in Winter and Shafaq Ahmer in summer** ... However, if one prefers strictly Shafaq Abyad (Hanafi) or strictly Shafaq Ahmer (Shafi'i, Maaliki, Hanbali), it can be calculated also." Karachi's figure changes from "16° to 18°" to "15° to 16°". **No reason is given for any of it.** |
| how-we.html today (Mar 1, 2024) | 18° compared up to 55°; 1/7 of the night at **55–60°**; above 60°, "slide down to 60degrees"; Aqrabul-Bilad by 0.1° steps (faq_pt 1.2); "Shafaq General". Fajr: "We originally used Subh-Sadiq as a little bit earlier than Fajr-al-Mustatir ... but recently ... started using ... ('Tabayyun')". |

**What prayer.html never says, in any capture:**

- It never states an **18° comparison**. how-we.html's "the 18degrees depression angle calculations
  are compared ... For Fajr, the later of the two and for Isha the earlier" does not appear. The
  only earlier-of/later-of rule on prayer.html compares against 1/7 of the night at 55–65/66°.
  adhan and the endpoint both apply the 18° comparison (section 2.11), so that part of the
  implementation is documented only on the 2024 page.
- It never uses the term **"Shafaq General"**, nor mentions 60°, Oslo, Hammerfest,
  "Aqrabul-Bilad", Dar al-Ifta or the 18-hour fasting limit.
- It never mentions an **online generator**. It campaigned against online calculators from 2002 to
  July 2011. The first archived copy of `pray.php` is 2011-10-17.
- It never says anything about **London adopting a unified timetable**, or about 1 August 2011.

**Where how-we.html (2024) contradicts prayer.html (2011):**

- **Latitude band:** 55–60° with a slide to 60°, against 55–65° with nearest lower latitudes.
- **Shafaq:** how-we's "Shafaq General uses Shafaq Abyad in Summer and Shafaq Ahmer in Winter" is
  the reverse of prayer.html's rule, and of how-we's own neighbouring sentences.
- **Fajr:** how-we separates Fajr-al-Mustatir from Tabayyan; prayer.html equates them.
- **Usmani quotation:** how-we changes "(the UK in the summer months)" to "(e.g., Northern Europe in
  the summer months)" and drops the 10-minute caution.
- **Observation sites:** how-we drops Buffalo, Chicago, San Francisco, Tempe and Houston, and adds
  High Wycombe.

**What this establishes**

- **The high-latitude rule has been restated at least five times.** It went from 1/7 of the night
  above 45° (1999), to 18/15/12 with 1/7 (2004), to nearby latitudes with no 1/7 (2005), to 1/7 at
  55–66° (2009–2010), to 55–65° (2011), and finally to 55–60° with a slide to 60° (2024). The
  published tables do not apply the 2024 slide (section 2.11), so **the text and the tables
  disagree above 60°**.
- **London's source material was removed as London adopted.** Hizbul Ulama's book, the UK charts
  and Blackburn's figures were on the page until July 2011 and gone by 16 August 2011. The same
  revision introduced the Abyad-winter/Ahmer-summer Isha. Section 2.14 shows London's 2026 Isha
  follows the Blackburn chart, not that function. **UNVERIFIED:** whether the removal and London's
  adoption are connected. The page is silent.
- **The page itself warned that year-fixed timetables drift by 1 to 2 minutes** because of leap
  days. London's chart intervals are fixed by calendar date (section 2.14), so check previous years
  for the same drift.

### 2.14 London 2026, reproduced from the API's own year: where it stands

**The reference.** `https://www.londonprayertimes.com/api/times?format=json&year=2026&24hours=true`:

- **Fetched once** on 2026-09-14 with the owner's key, which was never stored and never committed.
- **Where it is:** saved at `~/athan-research/london/lpt-2026.json`, with the request, without the
  key, in `lpt-2026.meta.json`.
- **The check:** the key does not appear in the response.
- **What it holds:** 365 days, 2026-01-01 to 2026-12-31, with no gaps. Every value is `HH:mm`.
- **Fields:** `date`, `fajr`, `fajr_jamat`, `sunrise`, `dhuhr`, `dhuhr_jamat`, `asr`, `asr_2`,
  `asr_jamat`, `magrib`, `magrib_jamat`, `isha`, `isha_jamat`.

**The base** is `moonsighting.ahmedbukhamsin.sa/time_json.php` for London at 51.5072, −0.1276,
Europe/London, 2026, method 0. It is identical to the site's `praytable.php` (section 2.6).

**Fajr: reproduced on 365 of 365 days.** API `fajr` = (API `sunrise` + 3) − the Table 5 interval for
that date.

- **The table.** Table 5 is "TIME TABLE OF SUBHA SADIQ IN UK", page 117 of Miftahi's *Fajar and
  Isha* (2005, section 2.10). A blank "-" carries the last printed value in that month's column
  forward.
- **Checked by eye.** The transcription was read from the page rendered at 300 dpi
  (`~/athan-research/london/tables/table5_{top,bottom}.png`), not only from the PDF text layer.
- **The script** is the inline check recorded in `~/athan-research/london/`. The implied intervals
  for every day are in `lpt-2026-intervals.json`.

**Sunrise: shown 3 minutes early.** API `sunrise` = base sunrise − 3 on 316 days, and base sunrise
− 2 on 49. That is the 2009 Hizbul Ulama advice, "a minimum of three minutes is taken away from the
sunrise time" (section 2.8). **UNVERIFIED:** the 49 days look like a rounding difference in the base
sunrise, and are being pinned down to the second.

**Isha: reproduced on 345 of 365 days.** API `isha` = (API `magrib` − 3) + the Table 6 interval
(Table 6 is "TIME TABLE OF ISHA IN UK", page 118, image-verified in the same way). Every exception,
as date, API, rule, API minus rule and interval used:

| Date | API | Rule | Δ | Table 6 |
| --- | --- | --- | ---: | --- |
| 2026-02-01 | 18:29 | 18:28 | +1 | 1-38 |
| 2026-04-29 | 21:35 | 21:34 | +1 | 1-13 |
| 2026-04-30 | 21:36 | 21:35 | +1 | 1-13 |
| 2026-05-01 | 21:38 | 21:32 | +6 | 1-08 |
| 2026-05-02 | 21:40 | 21:31 | +9 | 1-05 |
| 2026-05-03 | 21:41 | 21:32 | +9 | 1-05 |
| 2026-05-04 | 21:43 | 21:29 | +14 | 1-00 |
| 2026-05-05 | 21:44 | 21:30 | +14 | 1-00 |
| 2026-05-06 | 21:46 | 21:32 | +14 | 1-00 |
| 2026-05-07 | 21:48 | 21:39 | +9 | 1-05 |
| 2026-05-08 | 21:49 | 21:40 | +9 | 1-05 |
| 2026-05-09 | 21:51 | 21:45 | +6 | 1-08 |
| 2026-05-10 | 21:52 | 21:46 | +6 | 1-08 |
| 2026-05-11 | 21:54 | 21:50 | +4 | 1-10 |
| 2026-05-12 | 21:55 | 21:51 | +4 | 1-10 |
| 2026-06-16 | 22:44 | 22:43 | +1 | 1-23 |
| 2026-06-17 | 22:45 | 22:44 | +1 | 1-23 |
| 2026-06-18 | 22:44 | 22:43 | +1 | 1-22 |
| 2026-06-19 | 22:44 | 22:43 | +1 | 1-22 |
| 2026-11-29 | 17:36 | 17:37 | −1 | 1-40 |

- **Early May is the book, not a misreading.** The rendered page really prints May 1-08, 1-05 on
  the 2nd, 1-00 on the 4th, 1-05 on the 7th, 1-08 on the 9th and 1-10 on the 11th.
- **London does not follow that dip.** The API's implied Isha interval keeps rising through early
  May, so London's Isha departs from the 2005 chart there, by up to 14 minutes.
- **The same page prints cells for days that do not exist:** April "31" 1-10 in Table 6, and
  June "31" 1-59 in Table 5.
- **Where London's Isha interval parts from the chart:**
  - It holds **1-14 from 29 April to 12 May**, then rejoins the chart on 13 May (1-13) and 16 May
    (1-14).
  - Around the solstice it holds the chart's June peak of 1-24 through 17 June, where the chart
    drops to 1-23 on the 16th. It then gives 1-23 on 18 and 19 June, where the chart has 1-22,
    and rejoins the chart at 1-22 on the 20th.
  - It steps from January's 1-40 to 1-39 on 1 February, where the chart says 1-38.
  - It reaches November's 1-40 on the 30th, one day after the chart.
  - The implied intervals for every day are in `~/athan-research/london/lpt-2026-intervals.json`.
- **The later UK tables do not explain these days.** The Hizbul Ulama national tables computed by
  Shaukat (section 2.8, parsed page by page by the documents agent) were compared date by date
  with the API's implied intervals, Fajr as sunrise − Fajr and Isha as Isha − (Maghrib − 3):

  | Edition, page | Fajr interval equal to the API | Isha interval equal to the API |
  | --- | ---: | ---: |
  | 2006, LONDON (Lt 51:30N, Lg 0:10W) | 32 / 357 | 11 / 357 |
  | 2006, EALING LONDON | 34 / 365 | 29 / 365 |
  | 2006, HACKNEY London | 34 / 357 | 12 / 357 |
  | 2009, LONDON | 31 / 363 | 20 / 363 |
  | 2009, EALING LONDON | 33 / 363 | 20 / 363 |
  | 2009, HACKNEY London | 34 / 365 | 13 / 365 |

  The tables' intervals change almost day by day, as a formula's would. For example, London 2006's
  Fajr interval runs from 1-41 in early January down to 1-33 in mid-March and up to 2-00 in late
  June. The API's intervals move in whole-minute steps held for days, as the chart's do. **So the
  2006 and 2009 UK tables follow Shaukat's own latitude-and-season function, and London's unified
  timetable does not.** Its Fajr and Isha follow the 1989 Blackburn chart instead.
- **The UK tables dip in early May too**, to an Isha interval of 1-09 on 7 and 8 May (London 2006
  and 2009). London's flat 1-14 overrides a dip present in both the chart and Shaukat's function.
- **These 20 Isha days are UNEXPLAINED** by every source read so far. They look like manual
  adjustments to the chart. The documented reason, and whether they recur in other years, are being
  sought in East London Mosque and other mosques' published timetables and earlier years.

**Dhuhr, Maghrib and Asr.** API minus base, method 0:

| Prayer | 0 | +1 | +2 |
| --- | ---: | ---: | ---: |
| Dhuhr | 309 | 56 | |
| Maghrib | 306 | 59 | |
| `asr` against the base's Shafi'i Asr | 210 | 155 | |
| `asr_2` against the base's Hanafi Asr | 150 | 211 | 4 |

- **The +1 skew** points at rounding or coordinates, not a rule. **UNVERIFIED** until reproduced to
  the second.
- **The two Asr fields are the other way round from the app's type comments.** The API's `asr` is
  the **Shafi'i** Asr (one shadow length) and `asr_2` is the **Hanafi**. `shared/types.ts`
  documents `asr` as "Hanafi calculation" and `asr_2` as "Shafi calculation", and the app shows
  `asr`. Measured against the base on all 365 days: `asr` against Hanafi is never within 28
  minutes, and `asr_2` against Shafi'i is never within 30.

**What this means for London under the moonsighting method.** The base alone does not give
London's times. Two facts do most of the work:

- London's Fajr and Isha come from the Hizbul Ulama observation charts: intervals before sunrise
  and after sunset, from the 1987–88 Blackburn observations. They do not come from moonsighting.com's
  latitude-and-season function. Against the base's own Fajr and Isha, London is −7 to +6 minutes
  (Fajr) and −4 to +11 minutes (Isha) apart, by season.
- Sunrise is shown 3 minutes early.

Everything else sits on Shaukat's sunrise, noon + 5 and sunset + 3.

### 2.15 London's unified timetable, rule by rule

This section completes section 2.14. Sources:

- The London agent's notes: `notes/london.md`, 368 lines, read in full by the lead. Scripts and
  outputs are under `~/athan-research/london/`.
- The lead's independent re-checks, marked **[lead-verified]**.

**Source identity: PROVEN for 2026.** The London Prayer Times API year, East London Mosque's
2026 timetable PDF and the table embedded in ELM's prayer-times web page agree on **4,380 of 4,380
cells** (365 days × 12 fields), with 0 differences.

- **[lead-verified]** API against the ELM PDF: 4,015 cells across the eleven like-named fields,
  plus 365 cells of ELM `asr_1` against API `asr`. All identical.
- The 13 real 2026 rows in the app's `shared/__tests__/nightTimes.test.ts` also equal the API.
- For other years the ELM PDFs are the evidence. They are the provider's stated source, but their
  identity to the API is **UNVERIFIED** except 2024. There, `mocks/full.ts` in the app repo is an
  API dump (first committed as `mocks/data_full.ts` in `c78c36e`, 2024-11-16), and it fits the same
  rules.

**ELM's own statement of the rules.**
<https://www.eastlondonmosque.org.uk/prayer-times-and-calendar-explained> ("Published: 22nd June,
2018; Updated: 3rd July, 2026"), read in full by the agent:

> "Fajr … The daybreak time is based on the work of Hizbul Ulama. The sunrise time is taken from
> His Majesty's Nautical Almanac Office (HMNAO), with 3 minutes taken off for safety to allow
> coverage of the whole M25 region." · "Zuhr … taken from HMNAO, with 5 minutes added" · "'Asr …
> Mithl 1 and Mithl 2 … taken from HMNAO" · "Maghrib … taken from HMNAO, with 3 minutes added for
> safety" · "'Ishā … based on the work of Hizbul Ulama."

**Why it has this shape.** Hizbul Ulama, "Why our fasting times and timetable are not wrong"
(Y. A. Miftahi, 19 August 2011):
<http://www.hizbululama.org.uk/articles/english/Why_our_fasting_times_are_not_wrong.pdf>.
It records:

- the 2 January 1989 agreement: "First Light" generally, and "Tabayyun" in summer, for Fajr;
  "Shafaqe Abyadh" generally, and "Shafaqe Ahmer" in summer, for Isha, "Phasing of times to get to
  one method to the other";
- that the Blackburn chart "can be applied to all parts of the UK using the gaps in twilight
  length";
- London's adoption, by "at least 36 organisations … just before Ramadan 1432 (July 2011)", after
  a meeting "hosted by ICC at Regents Park, London, on Thursday 25th March 2010".

**The rule London ships.** Era B2 covers the 2022 to 2026 timetables. The table gives exact days out
of 365 for 2026.

| Prayer | Rule | 2026 fit |
| --- | --- | --- |
| Fajr | (API sunrise + 3) − Table 5 interval | **365/365.** Across years: 3,652 of 3,652 days (2015, 2017–2022, 2024–2026) **[lead-verified]** |
| Isha | (API Maghrib − 3) + Table 6 interval, with the edited slots below | **365/365** with the edits (345 without) **[lead-verified]** |
| Sunrise | sun's sunrise, rounded to the nearest minute, − 3 | 359/365 at 51°30′N 0°10′W (agent's NOAA/Meeus code). **[lead-verified]** 363/365 with adhan's unrounded sunrise. Every miss is ±1 |
| Dhuhr | transit + 5, rounded | 362/365 (agent); 363/365 with adhan **[lead-verified]** |
| Maghrib | sunset + 3, rounded | 360/365 (agent); 360/365 with adhan **[lead-verified]** |
| Asr, API `asr` | Mithl 1 (Shafi'i) | 353/365 in the agent's code, which treats the target as an apparent altitude with refraction. **Not independently reproduced:** adhan's Asr, which uses the noon declination, matches only 143/365 (mostly ±1). |
| Asr, API `asr_2` | Mithl 2 (Hanafi) | 356/365 (agent); adhan 204/365. Same caveat. |

- **The misses in the sun-based rows are rounding-boundary days.** On every miss, the agent's
  computed event lies within 0.06 minutes (3.6 seconds) of a half-minute. ELM says these times
  come from HMNAO.
- **HMNAO's calculation is not public.** Its prayer-times service returned HTTP 503 on 2026-09-14,
  and its terms say "for personal use only".
- **Nothing tested closes those days,** so these minutes can only be matched with HMNAO's own
  values. The agent tried a coordinate grid, the JPL DE421 ephemeris, the Astronomical Almanac
  formulas, single-pass variants, a seasonal offset and rounding thresholds.
- **Why Fajr and Isha still come out exact:** they are chained to the published sunrise and
  Maghrib.

**The Isha slots London edits.** Minutes after sunset; the book's value is in brackets.
**[lead-verified]** across the ELM files for 2015, 2017–2022, 2025 and 2026, and the 2024 API dump.

| Slot | London | Years |
| --- | --- | --- |
| 1 Feb | 99 (98) | every year |
| 29–30 Apr | 74 (73) | every year |
| 1–12 May | 74 (book: 68, 65, 65, 60, 60, 60, 65, 65, 68, 68, 70, 70) | every year; this removes the book's printed Abyad-to-Ahmer dip |
| 29 Nov | 99 (100) | every year |
| 31 Mar | 79 (80) | 2020 only |
| 16 Jun | 84 (83) | 2020, 2025, 2026 |
| 17 Jun | 84 (83) | 2025, 2026 |
| 18–19 Jun | 83 (82) | 2025, 2026 |

**No documented basis was found for any of these edits.** The agent searched every ELM timetable
and calendar PDF from 2012 to 2026, the ELM explainer, Noor Ul Islam, the ICC, Hizbul Ulama's
articles and moonsighting.com. Miftahi's book mentions software by Mohammed Arshad Baig that applies
the charts; it is a possible origin, **UNVERIFIED**.

**The rule has changed over time.**

- **Era A, 2012 to 2014** (the timetable at adoption):
  - no −3 on sunrise;
  - Fajr close to the moonsighting.com base, m0 (340/365 in 2014);
  - Isha matching nothing tested;
  - 2013 and 2014 identical in GMT.
- **The switch to era B** happened between 20 December 2014 and 9 January 2015, according to
  Wayback snapshots of londonprayertimes.com. ELM's 2015 PDF was created 2014-10-17. No announcement
  was found.
- **Era B1, 2015 to 2021:** the chart rules above, with the sun computed best at 51.5, −0.1275.
- **Era B2, 2022 to 2026:** the same chart rules, with the sun best at 51.5, −0.165, the Hizbul
  Ulama "LONDON" point (0°10′W). Who changed the point, and why, is not documented.

**What this means for the owner's question.**

- **London's times are not the moonsighting.com method with small offsets.** Only Dhuhr (+5),
  Maghrib (+3) and the two Asr shadow rules match the base. Fajr and Isha come from the 1989
  Blackburn chart, with London's own edits. Sunrise is shown 3 minutes early. The underlying sun
  times come from HMNAO, not from moonsighting.com.
- **Against the API in 2024–2026,** the moonsighting.com base at generic London (method 0) gives:
  Fajr −7 to +6 minutes, Isha −4 to +11, sunrise +2 to +4, and Dhuhr, Asr and Maghrib 0 or +1.
- **What exact replication in London needs:**
  - the interval table, which is year-independent except the June and 2020 edits
    (`~/athan-research/london/data/london_intervals_final.json`, 366 slots);
  - a sun calculation at 51°30′N 0°10′W, rounded to the nearest minute;
  - the published sunrise and Maghrib, or HMNAO's values, for the 3 to 12 boundary days per prayer.
  - That is a reconstruction of London's timetable, not the moonsighting.com method. **Using it as
    a source of shown times would breach the standing rule against synthesising prayer times**
    unless the owner rules otherwise (section 5).
- **Finding 43's "21 June … Magrib 21:21" is not API data.** It is the hand-written example in
  `mocks/timing-system-schema.ts`. The 2026 and 2024 API both give 21:25 for that date, and Fajr
  02:40 against finding 43's 02:43, which is the moonsighting.com value.
- **The Asr labels in the app are reversed** (section 2.14). The app shows the Shafi'i time.

### 2.16 The generator, its primary source, the endpoint contract, and every implementation

Sources:

- The implementations agent's notes: `notes/implementations.md`, 1,214 lines, read in full by the
  lead. Scripts, probes and cached responses are under `~/athan-research/impls/` and `endpoint/`.
- Shaukat's booklet, read in full by the lead.
- The lead's own re-checks, marked **[lead-verified]**.

**The primary source for the formula: Shaukat's booklet.**

- **The document.** "FAJR AND ISHA, By Engr. Syed Khalid Shaukat (September 2015)", 27 pages. The PDF
  metadata gives author "sks1", created 2018-04-05 (Word 2013).
- **Where it is.** It ships as `booklet-fajr-isha.pdf` in the islamic-network and kskhan77 repositories,
  byte-identical (SHA-256 `d2faa6c13933b35dca3c878984d96f432ab374d189a43d108b495b1fe5c08b63`). It was
  added to islamic-network on 2020-07-25 (`4e3a189`).
- **§11, "Functions of latitude and seasons for Fajr and Isha" (pp. 24–25),** gives:
  - the Fajr A/B/C/D;
  - the Shafaq Ahmer, Abyad and General A/B/C/D;
  - the 91/46/46/46/46/91-day piecewise function;
  - "DYY=0 for December 21 … DYY=11 for January 1" in the north, and from June 21 in the south;
  - "Fajr is sunrise – MIN and Isha is sunset + MIN".
- **They are adhan's coefficients, exactly** (section 2.11) **[lead-verified]**. So the coefficients do
  have a published primary source, and the earlier statement that none had been found is withdrawn.
- **§10 says the seasonal Isha combination follows the hemisphere:** "Shafaq Abyad when nights are long
  (winter in Northern hemisphere and summer in Southern hemisphere) and Shafaq Ahmer when days are
  long". It adds: "These formulae are good up to the 55° latitude."

**The booklet contradicts itself above 55°, and the tables follow neither version.**

- **§10:** "At latitudes between 55° and 65°, the rule of Sab'u Lail … At latitudes higher than 65° … a
  suggestion by Fuqaha' is to calculate for nearest lower latitudes where the sun sets and rises".
- **§12:**
  - "From equator to 55°, the 18° depression angle calculations are compared … for Fajr, the later of
    the two and for Isha the earlier of the two."
  - "At latitudes between 55° and 60°, the rule of Sab'u Lail".
  - "at latitudes more than 60° … If day length is more than 18 hours or less than 6 hours, then we
    slide down to 60° and calculate Fajr & Isha using the rule of Sab'u Lail."
- **The booklet's own tables** show Fairbanks (64°50′N) on 22 June as FjrCalc 2:40, Sunrise 2:59, Sunset
  0:51, IshCalc 1:07: 1/7 of the night at the true latitude, no slide.
- **Its London row** (Lt 51:30N, Lg 0:10W) on 22 June reads Fajr 2:44, Sunrise 4:44, Sunset 21:25,
  Isha 22:42. The 2026 endpoint gives 02:43, 04:43, 21:25, 22:42 for 21 June.
- **The agent also found** that the booklet's "Sunset" column equals the generator's Maghrib, sunset + 3,
  in every city compared.

**What the published generator actually does.** This was tested by a rules model
(`impls/rules_model.py`), a hypothesis test and not a source of times:

- **Rules model E reproduces every day of 2026 within ±1 minute on every field** at London, Oslo,
  Reykjavik, Chicago and Karachi. Its rules:
  - Dhuhr = noon + 5, Maghrib = sunset + 3;
  - Fajr = later of (seasonal, 18°), Isha = earlier of (seasonal, 18°);
  - above 55°, also bounded by 1/7 of the night at the site's own latitude;
  - in polar night, the plain 18° Fajr and Isha with Sunrise and Maghrib dashed;
  - in midnight sun, all four dashed.
- **Rejected by the data:**
  - no 18° bound: Karachi Fajr exact on 0 of 365 days;
  - a threshold at 48.5°: London 234 to 321 mismatches;
  - faq_pt 1.2's 0.1° walk: Tromsø 98 and Longyearbyen 288 to 314 mismatches;
  - the slide to 60°: Reykjavik matches 1/7 at its own latitude on 365 of 365 days.
- **Dash counts.** Midnight-sun dashes run 69 days at Tromsø and 128 at Longyearbyen.
- **The southern hemisphere follows the same rules.** Ushuaia (54.8°S), Cape Horn (56°S), Palmer
  (64.8°S) and Rothera (67.6°S) fit within ±1, and 1/7 of the night decides 133 to 175 days a year.
- **At McMurdo (77.8°S) the model breaks.**
  - Fajr and Isha print as the same after-midnight time for days at a time: 31 March to 4 April
  (`01:56`/`01:56` on 31 March), and 8 to 12 September (around `00:52`).
  - Next to those runs Isha is 30 to 105 minutes off the model.
  - **UNVERIFIED cause.**
- **Evening values after midnight carry no day marker** at Tromsø, Longyearbyen, Reykjavik, Palmer and
  Rothera. At Longyearbyen the 18 April Fajr prints as `23:36`, the previous evening.

**The endpoint as a contract** (`notes/implementations.md` §2):

- **Hosts.**
  - `www.moonsighting.com/time_json.php` returns HTTP 500 with an empty body for every parameterised GET
    (13 variants), and 200 with a single newline without parameters. Root cause **UNVERIFIED**.
  - `praytable.php` on the same host works and returns HTML.
  - `moonsighting.ahmedbukhamsin.sa` is a separate deployment (Apache, PHP 8.2.27, behind Cloudflare,
    TLS for `*.ahmedbukhamsin.sa`) on the developer's personal domain; no registrant is published.
  - **History.** PrayerTimeAPI's commits show the API began on the author's employer's host
    (`five-tech.com`), moved to `www.moonsighting.com` on 2020-04-24, and to the bukhamsin host on
    2024-10-31.
- **Parameters.**
  - There is no single-day or month parameter: always a full year, about 141 KB.
  - `both` has no effect on the JSON; `time=1` gives `"06:25 am"`.
  - `method=3` gives Ja'fari Asr, Maghrib = sunset + 17, and `asr_s`/`asr_h` as the JSON number `-1`.
- **Errors come back as HTTP 200.**
  - Omitting `both` or `time` prepends a PHP warning to the JSON, so it no longer parses.
  - An invalid `tz` or a `method` outside 0–3 produces a PHP fatal error in an `application/json` body.
  - `lat=95` and `lon=200` are accepted and return garbage.
- **Headers.** `access-control-allow-origin: *`, `cache-control: public, max-age=300`; no rate-limit
  headers, no ETag.
- **Reliability.**
  - No throttling in about 60 requests at 1.1-second spacing.
  - Latency 0.48 to 0.83 seconds for a full year.
  - Two same-day observation windows without failure; that is not an uptime record.
  - The Wayback Machine holds **0 captures** of either JSON endpoint.
  - No terms of use exist on either host.
- **Cross-check.** The endpoint's London 2014 output for 24 April gives Fajr 04:04 and Isha 21:21, the
  values islamic-network's own unit test expects for that date.

**Every implementation, measured against the endpoint.** Diffs are implementation minus endpoint, in
minutes. Reference values are London, Oslo and Tromsø on 20 March, 21 June, 22 September and
21 December 2026 (`notes/implementations.md` §4.14).

| Family | What it computes | London | Oslo, 21 Jun (1/7 decides) | Polar (Tromsø, 21 Dec) | Dhuhr / Maghrib |
| --- | --- | --- | --- | --- | --- |
| **adhan 4.4.6**, adhan-extended, @calgiellc/azan (identical numbers); prayers-call and adhanline (wrap adhan) | seasonal + 18° bound + 1/7 above 55° (signed latitude) | exact, 4 of 4 dates | −1 / 0 | Invalid Date (endpoint: 06:28 / 16:56) | +5 / +3, match |
| namaz 4.4.0 (adhan fork) | as adhan, General Isha only | exact | −1 / 0 | Invalid Date | Dhuhr +1 (public `dhuhr` = Dhuhr + 1 min 4 s) |
| @tawfeeqmartin/fajr 1.9.3 (wraps adhan) | adhan, up-rounding, automatic elevation from a city registry | Sunrise −1/−2, Maghrib +1/+2 | 0 / +1 (explicit MC; its default for Norway is MWL) | Invalid Date | Dhuhr 0 to +1 / Maghrib +1 to +3 |
| **islamic-network** (PHP, the original, by Meezaan-ud-Din for AlAdhan, now on `1x.ax`), and its copies kskhan77 (Khurram Shafique; **not** Khalid Shaukat), mawaqit (2025), muballighapp (2025), adamarnap (2025); AlAdhan API method 15; @praytime/core (TypeScript port) | seasonal function **only**: no 18° bound, no 1/7, Dhuhr at noon, Maghrib at sunset | Fajr and Isha 0 on all 4 dates (live AlAdhan: Isha +1 on 21 June) | **−83 / +37** (AlAdhan +38) | clamped: Fajr +203, Isha −207 | **−5 / −3** |
| pray-calc 2.4.0 (independent TypeScript) | MSC is a comparison entry only; primary method is its own dynamic angle | 0 / 0 | −83 / +37 | NaN | Dhuhr −2 to −3 (noon + 2.5) / −3 |
| Musallah `prayerCalc.ts` (app code) | adhan-style, but 1/7 replaces instead of bounding; Abyad coefficient typo (45.1 for 81.84) | 0 to −1 | −1 / 0 (Oslo equinoxes Isha +23) | null | 0 to −1 |
| sniper1720/mawaqit (Rust), RagibHasin/adhaan (Rust), arahmancsd (C#) | read, **not run** | – | – | – | – |
| **Mislabelled "Moonsighting"**: libmuslim (18°/18°), @islam-kit (18°/18°, no timezone term), salat-first (no equation of time, host clock), masjiduna-waqt (18°/18° with middle-of-night fallback; install hook downloads an unchecksummed binary when Bun is installed), salahapi-php (silently MWL), piazan (angles 0), @misque (Fajr after sunrise) | not the method | −20 to −101 / up to +140 | up to −112 / +110 | varies | varies |
| @masaajid/prayer-times 1.0.1 | seasonal rules, but **Abyad coefficients on its General Isha path**; throws unless the date is 00:00 UTC | Isha **+70** on 21 June | −1 / 0 | Invalid Date | 0 / +1 |

- **The sharp distinction.** Everything that implements the seasonal function agrees with the endpoint
  to ±1 at London. Only adhan and its faithful copies also match Oslo in summer, and Dhuhr and Maghrib.
- **No implementation reproduces the endpoint everywhere.** adhan fails where the endpoint gives times
  in polar night.
- **sniper1720/mawaqit** is the only one that codes how-we.html's slide to 60°, so it matches the text,
  not the published tables.
- **No other committee's rules** are implemented under the name. Every seasonal implementation carries
  the booklet's coefficients.
- **npm weekly downloads** (2026-09-14): adhan 26,697; every other candidate 150 or fewer.

**What this means for a worldwide v2.0.**

- **The published method is reproducible** in its rules to ±1 minute below about 66° in both
  hemispheres.
- **But the only machine-readable source is a single developer's host** with:
  - no terms, no SLA and no archive history;
  - a broken sibling on moonsighting.com;
  - the day-early clock change in seven zones;
  - a hidden timezone-database version;
  - dashes and after-midnight values at high latitude, and the McMurdo anomalies.
- **adhan is the closest implementation,** but it returns Invalid Date in polar night, where the tables
  give 18° times.
- Section 5 carries the resulting owner decisions.

### 2.17 Every document the site carried: what they add

**What was read.** All 59 documents moonsighting.com carries or once carried were read in full by the
documents agent: `notes/documents.md` (1,200 lines, read in full by the lead), with a page-by-page
ledger in PART D. None was unobtainable.

- **Documents with prayer-time content:** the three editions of Miftahi's *Fajar and Isha*, the Urdu
  *prayers-uk.pdf*, the 2006 and 2009 UK tables, the French page and the old `prayer.html`.
- **Everything else** is about moonsighting, the Hijri calendar, Qibla, eclipses or unrelated
  subjects, including one piece of spam.
- **No document on the site publishes the Fajr/Isha formula or its coefficients.** The booklet that
  does (section 2.16) reached the public through the islamic-network repository, not through the
  site's own document links.

**The Urdu book, `articles/prayers-uk.pdf`**

- **What it is.** Wayback capture 20081230101850. It is the 20-page Urdu section of Hizbul Ulama's
  2007 book "Fajar and Isha (part 1&2)", 366 pages, first printed Muharram 1428 / January 2007. Its
  text layer is unusable, so it was read from rendered pages. The lead re-checked PDF page 11 against
  the image.
- **Who computed the UK times.** Page 5 says Dr Khalid Shaukat, at Hizbul Ulama's request, computed on
  computer "for the whole of Britain, the times of the five daily prayers including Fajr and Isha,
  sunrise and zawal, and the Qibla calculations". Before that, "for a long period" mosque committees
  had only "a chart of the intervals" to add to their own sunrise and sunset. Mohammed Arshad Baig's
  software is named as the other route.
- **The clarifications (PDF pp. 10–16), by point:**
  1. Times are in GMT.
  2. Fajr and Isha rest on eyewitness observation. Sunrise, zawal, Zuhr, Asr and Maghrib are by
     approximate astronomical calculation.
  3. The book uses the 2007 calendar with its clock changes.
  4. Zuhr is midday + 5 minutes: 1.5 + 1 + 2.5 **[lead-verified on the page image]**. Ten minutes in
     all are counted as makruh.
  5. Asr is at "double the original shadow (mithlayn)"; the earlier Asr is available from Shaukat.
  6. Maghrib is observatory sea-level sunset + 3; anyone wanting 5 should add only 2 more.
  - A note on p. 13: "sunrise times have been set equal to the observatory's sea-level times;
    therefore it is necessary to set the sunrise times by subtracting three minutes".
- **London's unified timetable applies that −3 itself,** as ELM states (section 2.15). The 2007 book
  left it to the reader.

**The UK tables, 2006 and 2009 editions, read and checked in full** (`notes/documents.md` A4, C6–C8)

- **The two editions are identical.** All 31 cities they share match on every date and all six
  columns (0 differences), so the 2006 book is an exact subset of the 2009 book's 49 cities.
- **When they were generated.** Every header carries a magnetic-declination epoch of 2006.91 to
  2006.94. They are the 2007-calendar directory Shaukat computed in late 2006.
- **What they actually apply,** checked by the agent against an independent NOAA-style solar
  calculation at each printed coordinate:
  - Zuhr is noon + 4.3 to +5.7 minutes, median +5.0.
  - Maghrib is sea-level sunset + 1.8 to +4.2, median +3.0.
  - Sunrise is the unmodified calculated sunrise (median 0), so **the −3 advice is not applied in the
    tables**.
  - Asr is Hanafi, median −0.1.
  - Fajr is 93 to 125 minutes before sunrise and Isha 65 to 100 minutes after Maghrib, **growing
    slightly with latitude**. At Aberdeen (57°10′N) on 21 June, Fajr is 125 minutes before sunrise.
  - **There is no 1/7-of-the-night rule even at Aberdeen and Dundee, above 55°N.** The tables predate
    the site's 1/7 wording, which returns on prayer.html only in 2009 (section 2.13).
- **Errors in the tables, as printed:**
  - BELFAST is computed at "Lt=51:38N Lg=0:25E", a point in Essex; its Zuhr on 1 January is 12:07,
    earlier than London's 12:09.
  - COVENTRY is computed at longitude 0:30W, about 1° off.
  - EALING and HACKNEY switch to BST on 26 March and back on 29 October, the 2006 dates. LONDON and
    CROYDON use 2007's 25 March and 28 October.
  - NOTTINGHAM has no 30 April row.
  - MANCHESTER prints "9.17p" on 31 August.
- **The LONDON page** (Lt 51:30N, Lg 0:10W, PDF pp. 321–331) was read in all 365 rows. For example,
  21 June reads "2:44a 4:43a 1:07p 6:40p 9:25p 10:45p". Section 2.15 shows London's unified timetable
  is a different table.

**Miftahi's *Fajar and Isha*: three editions, fully diffed** (`notes/documents.md` A1, A2)

- **Editions:**
  - 2005-10-31, "Fajar and Isha Time in Britain", 68 pages;
  - 2006-11-15, A5, 123 pages;
  - 2006-12-07, 123 pages.
- **Tables 4, 5 and 6 are identical in all three.** The only difference is the 2005 print of "144"
  for 7 May, which later editions correct to "1-44".
- **The 2005 edition dates the first Blackburn meeting "12 April 1988".** Later editions and the
  Urdu book say 2 April 1988.
- **Shaukat's "66 to 100 minutes … 94 to 122 minutes" quote is absent from the 2005 edition,** and
  appears from November 2006.
- **The sentence naming Shaukat's accompanying UK directory appears only in the 2006-12 build.** That
  dates the directory to between 15 November and 7 December 2006, consistent with the tables' epoch.
- **An inference, not stated in any document:** the website's Blackburn ranges ("93 to 123" and
  "66 to 100" minutes) match the smoothed chart ranges of Tables 5 and 6 (90–124 and 60–100), not the
  raw observations of Table 4.

**Step 1's document half is complete.** The site-page half is still being read (section 3.5).

## 3. Uncertain or still being established

State at the close of 2026-09-14. The document read is finished (section 2.17). The site-page read ran
as an agent, was interrupted repeatedly by API usage limits, and is still running. Its notes, as far
as it had got, are in `notes/site.in-progress.md`. Until it is finished and checked, treat that file's
contents as **UNVERIFIED**.

### 3.1 London (sections 2.14 and 2.15): closed except these

- **Boundary minutes.** Sunrise, Dhuhr, Maghrib and both Asrs miss by ±1 on 3 to 12 days per prayer
  in 2026. Every miss sits within seconds of a half-minute. Matching them needs HMNAO's values
  (service returned 503; terms say personal use only).
- **Asr** is reproduced to 353 and 356 of 365 only by the London agent's refraction-corrected
  calculation. It has not been independently reproduced: adhan's Asr gives 143 and 204.
- **The 21 edited Isha slots** have no documented basis. The same goes for the 2022 change of
  coordinates and the 2025 June edits.
- **Years before 2026** rest on ELM's PDFs, which are not proven identical to the API (except
  2024, via the app's own API dump).

### 3.2 The endpoint, worldwide (section 2.16): closed except these

- **Root cause of the 500s** from `www.moonsighting.com/time_json.php`. The body is empty; only the
  owners can say.
- **The McMurdo runs** (Fajr = Isha after midnight for days, Isha 30 to 105 minutes off), and the
  polar-edge misfits at Longyearbyen and Tromsø.
- **Casablanca after 2026-09-20.** The correct tz rule depends on real-world policy after today.
- **Palestine** is not measured for the day-early clock change.
- **Uptime, rate limits, terms and consent.** None is published. Dependence needs the owners' consent.
- **The Sky Prayers apps**, the generator developer's own apps, were not examined; they may carry the
  same generator.

### 3.3 The method's primary sources

- **The coefficients: resolved.** Shaukat's booklet §11 (September 2015) publishes them, and they equal
  adhan's (section 2.16).
- **Shafaq width in England:** faq_pt 2.10 says "66 to 105 minutes"; the 2006 page and Miftahi's
  book say 66 to 100. Which one is current is unresolved.
- **The rule above 55°** exists in at least four written versions:
  - booklet §10: 55–65°, then nearest lower latitudes;
  - booklet §12 and how-we.html: 55–60°, then slide to 60°;
  - the 2010 French page: 55–66°;
  - the 1999 page: 1/7 above 45°.
  
  Plus the published tables, which apply 1/7 at the true latitude with no slide. The owner has to rule
  which counts as the method (section 5).
- **Documents:** all read, including the Urdu `articles/prayers-uk.pdf` and the two PPTs (section
  2.17). None publishes the formula. The Shaukat foreword the Urdu book mentions is not in any
  file on disk.

### 3.4 Implementations and packages (section 2.16): closed except these

- **Not run:** the Rust (sniper1720/mawaqit, RagibHasin/adhaan), C# (arahmancsd) and Dart ports, and
  react-native-adhan. Their formulas were read statically.
- **@calgiellc/azan on Linux:** the case-mismatched `main` was proven from the tarball, not from a run.
- **The International Date Line guard** missing from adhan-extended, namaz and calgiellc: effect near
  ±180° not run.

### 3.5 Every page and every document

- **Documents: complete.** 59 of 59, with a page ledger (section 2.17).
- **Site pages: not complete.** The full read of every live and archived site page
  (`notes/site.in-progress.md`) is still running. Step 1 closes when that agent confirms every page
  was read in full, with counts.

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
- `shared/time.ts` reads it in three places:
  - `prayerClockFormatter` (line 26), which `prayerTimezoneOffset` and so `createPrayerDatetime`
    use to turn every API clock reading into an instant;
  - `formatHijriDateLong` (line 247);
  - the Ramadan decoration check (lines 320 and 331).
- The night-time code in `shared/prayer.ts` (`getNightTimesForDay`, lines 150–156) and the
  Istijaba instant (lines 122–125) build on `createPrayerDatetime`.
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

The documented method promises a time every day (section 2.5). The endpoint does not deliver
that, measured on 2026 method 0:

- **Tromsø (69.6°N):**
  - **118 of 365 days** carry `-----` in at least one field.
  - Polar day, e.g. 21 June: Fajr, Sunrise, Maghrib and Isha are `-----`, and Dhuhr and Asr are
    real times.
  - Polar night, e.g. 21 December: Sunrise and Maghrib are `-----`, while Fajr 06:28 and Isha
    16:56 are still given.
  - The edge day of 27 November gives Isha 17:11 with Maghrib `-----`.
- **Reykjavik (64.1°N):** no `-----` at all. Maghrib crosses midnight in summer, e.g. 21 June:
  Maghrib 00:07, Isha 00:28.

What this means for the current code:

- **`validateApiTimes` (`api/client.ts`)** drops any day with an unreadable required field. At
  Tromsø that is 118 days a year, and today's day throws. The `"-----"` shape the per-day guard
  was written for (finding 47) is exactly what this source emits. The guard keeps the rest of the
  year usable, as intended.
- **Nothing in the app can represent a day with Isha but no Maghrib, or Fajr but no Sunrise.**
  Session 3's per-prayer `--:--` rendering (`feat/audit-71-dashes`, 1.27.0 to 1.27.3, not merged
  into `uat-2` at `466b568`) addresses display, but Duha
  (`adjustTime(times.sunrise, 20)`), Istijaba (from Magrib) and the night times (from Magrib and
  Fajr) all derive from fields that can be `-----` while their neighbours are real. The
  derivations in `transformApiData` and `getNightTimesForDay` (`shared/prayer.ts`) would have to
  say what a missing base does to each derived time. The owner's rule forbids substituting one.
- **Magrib and Isha after midnight** are routine from about 60°N (Reykjavik above). They exercise
  finding 44's fixes every summer: `adjustPrayerDateForMidnightCrossing`,
  `calculateBelongsToDate`, `magribCrossesIntoNextDay` and `getNightTimesForDay` in
  `shared/prayer.ts`.
- Longyearbyen (78°N) and southern latitudes beyond −55° are still being measured.

More high-latitude evidence from section 2.16, in both hemispheres:

- **Southern latitudes behave the same.** Palmer (64.8°S) and Rothera (67.6°S) print evening values
  after midnight with no day marker, 49 to 57 cells a year. Rothera has 202 dashed cells.
- **McMurdo (77.8°S)** has 708 dashed cells, and multi-day runs where Fajr and Isha print as the same
  after-midnight time.
- **Longyearbyen's Fajr on 18 April prints as `23:36`**, the evening before.
- **The app has no way to tell which calendar day such a value belongs to.** Finding 44's
  midnight-crossing fixes assume Magrib and Isha only cross into the next day. A Fajr on the previous
  evening, or a Fajr equal to Isha, is outside every rule in `shared/prayer.ts`.
- **adhan returns Invalid Date on polar-night days** where the endpoint gives 18° times. So adhan
  cannot stand in for the endpoint there even as a cross-check.

### 4.5 London: the API and the moonsighting.com method are different sources

Sections 2.14 and 2.15 settle it: London's unified timetable is not the moonsighting.com method with
offsets.

- **Fajr and Isha** come from the 1989 Blackburn chart with London's own edits.
- **Sunrise** is shown 3 minutes early.
- **The underlying sun times** come from HMNAO.

For the owner's plan (the London API stays the London default, moonsighting.com is a second option
in London and the only option elsewhere), that means:

- **London, default source (today's app):** unchanged. `api/client.ts` keeps londonprayertimes.com.
  The one defect found is the **Asr labels**: `shared/types.ts` documents API `asr` as Hanafi and
  `asr_2` as Shafi'i, the reverse of the data. The app shows `asr`, the Shafi'i (one shadow length)
  Asr. Which Asr a London user expects is an owner decision (section 5).
- **London, moonsighting.com option:** a user who switches will see different times on most days.
  Against the API in 2024–2026: Fajr −7 to +6 minutes, Isha −4 to +11, sunrise +2 to +4, and
  Dhuhr, Asr and Maghrib 0 or +1. That is expected, not a bug, and the interface should not present
  the two as the same timetable.
- **Reproducing London locally** is possible to the minute for Fajr and Isha given the published
  sunrise and Maghrib, and to within ±1 on boundary days for the rest. That would synthesise times,
  which the standing rule forbids, so the research does not recommend it.
- **Test fixtures:** `mocks/timing-system-schema.ts` carries a hand-written London example
  (Magrib 21:21 on 21 June) that finding 43 quoted as if it were API data. The real 2026 value is
  21:25. Any fixture meant to represent API output should come from `data/london/lpt-2026.json`.

## 5. Open questions for the owner

Draft. The London and implementations strands may add to these.

1. **The source for v2.0.** The machine-readable form of moonsighting.com's tables lives on the
   generator developer's own host, `moonsighting.ahmedbukhamsin.sa`, while `www.moonsighting.com`'s
   `time_json.php` returns 500. The site's own `praytable.php` works but returns HTML. Is a
   dependency on one of these acceptable? Or should v2.0 ask Khalid Shaukat or Ahmed Bu-khamsin
   for a supported endpoint, as the Hizbul Ulama tables once did by email?
2. **The day-early clock change (section 2.12).** In Sydney, Auckland and Beirut, and probably
   Egypt, Israel and Palestine, the endpoint's times are an hour off on two days a year. The
   standing rule is that the app edits nothing the API returns. What should the app do on those
   days?
   - show them as given;
   - treat the day as unreadable (`--:--`);
   - report it to the source and wait;
   - or allow a narrow, documented correction.
3. **Days with some fields missing (section 4.4).** Above about 66°N the endpoint gives Isha with no
   Maghrib, or Fajr with no Sunrise, on the same day. Duha, Istijaba and the night times are
   derived from those fields. Should a derived time go to `--:--` whenever its base is missing,
   even when the prayer beside it is shown?
4. **Which method a v2.0 user gets.** The endpoint offers 0 (Hanafi, Shafaq General), 1 (Hanafi,
   Shafaq Abyad), 2 (Shafi'i, Shafaq Ahmar) and 3 (Ja'fari). Shafaq General only appears on the
   site after August 2011 (section 2.13). Is there a default, or does the user choose?
5. **London under v2.0.** London's unified timetable is not the moonsighting.com base plus an
   offset. Its Fajr and Isha come from the Blackburn chart with 21 London edits, and its sun times
   from HMNAO (section 2.15). The owner's plan already keeps londonprayertimes.com as London's
   default, with moonsighting.com as a second option. No London delta can be "applied" to the
   moonsighting base without synthesising times. Is that plan confirmed as final for London?
6. **Which rule above 55° is "the method"?** There are at least four written versions: booklet §10,
   booklet §12, how-we.html and the 2010 page. The published tables follow none of them exactly;
   they apply 1/7 of the night at the true latitude with no slide, and dashes in midnight sun
   (sections 2.13, 2.16). When text and tables disagree, which counts as "the method" for v2.0?
7. **`adhan` as a fallback or cross-check.** It matches the endpoint to ±1 minute up to 64°N and
   diverges beyond. Should it be used at all, as a check on the source, an offline fallback, or
   not? The "never synthesise a prayer time" rule suggests not as a source of shown times.
8. **Which Asr London users see.** The app shows API `asr`, which is the Shafi'i Asr, one shadow
   length. `shared/types.ts` calls it Hanafi (section 2.14). Should London keep showing the Shafi'i
   time, switch to `asr_2` (Hanafi), or offer both? And should the comments be corrected either way?
9. **How the moonsighting.com option is presented in London.** It differs from the London timetable
   on most days: Fajr −7 to +6 minutes, Isha −4 to +11, sunrise +2 to +4 (section 4.5). Should the
   app say plainly that it is a different timetable from the user's mosque?
10. **Reconstructing London locally.** London's rule can be rebuilt: the chart with its edits,
    HMNAO-style sun times, and ±1 on boundary days (section 2.15). That would synthesise times, so it
    is outside the standing rule. Is it ruled out permanently, or allowed as an offline check only?
11. **Asking for the undocumented edits.** East London Mosque or Hizbul Ulama could be asked for the
    basis of the 21 edited Isha slots and the 2022 change of coordinates. Does the owner want to
    make that contact?

## 6. Next session should

1. **Finish step 1.** The documents are done (section 2.17). Finish the site-page read from
   `notes/site.in-progress.md` until every live and archived page is confirmed read in full, with
   counts, and fold anything new into section 2.
2. **Close what remains of London** (section 3.1):
   - reproduce Asr independently of the London agent's code;
   - look for HMNAO's own values for the boundary days (respect the service's personal-use terms);
   - seek the basis for the 21 Isha edits if the owner agrees (section 5, question 11).
3. **Close what remains of step 3** (sections 3.2 and 3.4): Palestine for the day-early clock change;
   the McMurdo runs; the Sky Prayers apps; running the Rust, C# and Dart ports if their numbers matter
   to a decision.
4. **Review before the owner decides.** One independent Opus reviewer attacks every claim, count and
   fixture in this file, re-derives the London counts from `data/london/`, and re-checks section 2.16's
   table against `notes/implementations.md`. Fix what it finds.
5. **Bring section 5's questions to the owner.**
6. **Run one agent at a time,** two at most. In this session four Opus agents in parallel hit the
   session limit twice and the weekly limit once. Agents save notes after every step.
7. **Keep the standing rules:**
   - research only, no app changes;
   - never print, store or commit the API key, and ask the owner if the API must be called again;
   - never copy, average or invent a prayer time;
   - read 100% of every source;
   - commit through the key-prefix guard with `--no-verify`.

## Sources

| Source | URL | Fetched |
| --- | --- | --- |
| moonsighting.com home, moon, about-us, robots.txt | <https://www.moonsighting.com/> | 2026-09-14 |
| Unified Prayer Times for London, general announcement | <http://www.hizbululama.org.uk/articles/english/Unified.pdf> | 2026-09-14 |
| London Prayer Times home and API docs | <https://www.londonprayertimes.com/>, <https://www.londonprayertimes.com/api> | 2026-09-14 |
| moonsighting.com JSON endpoint and fallback | <https://www.moonsighting.com/time_json.php>, <https://moonsighting.ahmedbukhamsin.sa/time_json.php> | 2026-09-14 |
| moonsighting.com method pages | <https://www.moonsighting.com/how-we.html> (updated 2024-03-01), <https://www.moonsighting.com/faq_pt.html> (updated 2020-08-25) | 2026-09-14 |
| moonsighting.com table generator | <https://www.moonsighting.com/pray.php>, `assets/js/apple_map.js`, <https://www.moonsighting.com/praytable.php> | 2026-09-14 |
| Old prayer-times page, 64 captures | `http://www.moonsighting.com/prayer.html`, Wayback 19990221195144 to 20251016224039 (list in `~/athan-research/pdfs/wayback/prayer-html/captures.txt`) | 2026-09-14 |
| French prayer-times page | `http://www.moonsighting.com/prayer-french.html`, Wayback 20100827001844 | 2026-09-14 |
| Miftahi, *Fajar and Isha* (2005) | `http://www.moonsighting.com/articles/fajr&isha-yam.pdf`, Wayback 20070410171730 (also `fajarishainbritain1.pdf`, `fajar&isha-a5.pdf`) | 2026-09-14 |
| Hizbul Ulama UK city timetables, 2006 and 2009 | `http://www.moonsighting.com/articles/uk-prayercharts.pdf` (Wayback 20070810011835), `articles/uk-prayercharts1.pdf` (Wayback 2010) | 2026-09-14 |
| Every other document the site carried | `~/athan-research/pdfs/manifest.json` (58 of 59 recovered, source URL and capture per file) | 2026-09-14 |
| Hizbul Ulama, "Why our fasting times and timetable are not wrong" (2011) | <http://www.hizbululama.org.uk/articles/english/Why_our_fasting_times_are_not_wrong.pdf> | 2026-09-14 |
| East London Mosque, prayer times explained, and yearly timetables | <https://www.eastlondonmosque.org.uk/prayer-times-and-calendar-explained>, <https://www.eastlondonmosque.org.uk/prayer-times>; PDFs listed in `notes/london.md` §1 | 2026-09-14 |
| London Prayer Times API, 2026 year | `https://www.londonprayertimes.com/api/times?format=json&year=2026&24hours=true` (key supplied by the owner, not stored) → `data/london/lpt-2026.json` | 2026-09-14 |
| `adhan` 4.4.6 source | npm `adhan@4.4.6`, <https://github.com/batoulapps/adhan-js>, read with `opensrc` | 2026-09-14 |
| PrayerTimeAPI and mawaqit sources | <https://github.com/PrayerTimeResearch/PrayerTimeAPI>, <https://github.com/mawaqit/prayer-times-moonsighting>, read with `opensrc` | 2026-09-14 |
