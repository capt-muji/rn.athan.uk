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

- **No primary source seen so far publishes them.** They are not on how-we.html or faq_pt.html,
  nor in Miftahi's book or the UK tables. adhan's maintainer attributes them to "a document from
  Khalid Shaukat" (adhan-js issue #78), which is not public.
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
minute on five of the six times. Asr diverges more, and Tromsø differs by up to hours. The
coefficients rest on an unpublished document that agrees with the only published ranges.

### 2.12 The endpoint changes the clock a day early in some timezones

Confirmed from the cached 2026 method-0 years. For each city, the day Dhuhr jumps by about 60
minutes was compared with the day the zone's offset really changes, measured noon to noon with
Python's `zoneinfo`:

| Zone | Endpoint jumps | Real change | |
| --- | --- | --- | --- |
| Australia/Sydney | Sat 4 Apr, Sat 3 Oct | Sun 5 Apr, Sun 4 Oct | **a day early** |
| Pacific/Auckland | Sat 4 Apr, Sat 26 Sep | Sun 5 Apr, Sun 27 Sep | **a day early** |
| Asia/Beirut | Sat 28 Mar, Sat 24 Oct | Sun 29 Mar, Sun 25 Oct | **a day early** |
| Europe/London, Helsinki, Oslo (and Tromsø) | 29 Mar, 25 Oct | 29 Mar, 25 Oct | correct |
| America/New_York, Toronto, Chicago, Anchorage | 8 Mar, 1 Nov | 8 Mar, 1 Nov | correct |

- On those two days a year, **every time the endpoint gives for those zones is 60 minutes off**.
  For example, Sydney's Dhuhr is 13:04 on Friday 3 April and 12:03 on Saturday 4 April, although
  Sydney stays on UTC+11 until 03:00 on Sunday 5 April. adhan, computed on the real offset, is
  right on those days.
- **INFERRED, not verified.** The three wrong zones all change their clocks after local midnight
  but before 00:00 UTC of the next day. That fits the endpoint reading the offset at about
  24:00 UTC of the date. If so, Egypt, Israel and Palestine would be affected too. Those zones,
  and whether `praytable.php` shares the fault, are being measured.
- **This matters because of the owner's rule that the app edits nothing the API returns.** A v2.0
  client in those zones would ship an hour-wrong day twice a year unless the source is fixed, the
  day is rejected, or the owner rules otherwise (section 5).

### 2.13 How the published method changed, 1999 to 2024

**Source.** `http://www.moonsighting.com/prayer.html` was the site's prayer-times page before
how-we.html.

- **Captures.** The Wayback Machine holds 64 distinct captures, by content digest, from
  1999-02-21 to 2025-10-16; 56 were downloaded to `~/athan-research/pdfs/wayback/prayer-html/`.
- **Unusable captures.** The four from 2021 onwards are a bot-challenge page ("One moment,
  please..."), not the page itself.
- **Missing captures.** Eight failed to download and are being retried, among them 27 July 2011.
- **A limit on reading.** The passages below were pulled by keyword and truncated per capture, so
  this timeline records only what a capture **says**. That a capture is silent on a rule is not
  evidence it lacked one.

| Capture (page's own "Updated") | What it says about Fajr, Isha and high latitude |
| --- | --- |
| 2005-03 (10 Mar 2005). The 1999–2004 captures carry the same degree and 1/7 keywords but were not read line by line | "Fajr & Isha are calculated for Sun being 18 degrees below horizon". Where that is too early or late: "a combination of 18 degrees, 15 degrees, and even 12 degrees", framed as 1/7 of the night ("Fajr is sunrise minus 1/7th of the night and Isha is sunset plus 1/7th of the night"), and "In some cases, even this is impractical, so the times ... are kept in line with other days". Above 66.5°: "Manual calculations are needed". Timetables are sent by email on request. Booklet "When to Pray Fajr & Isha", about 48 pages, unpublished. |
| 2005-11 (31 Oct 2005). The function itself is first seen on 2005-05-17 (dated list below) | "Calculations of Fajr & Isha based on the sun being 18° or 15° below horizon ... are wrong ... This has also been confirmed by Hizbul Ulama UK", citing Miftahi's "Fajar and Isha Time in Britain". Moonsighting.com "uses a complex formula as a function of Latitudes and Seasons based on actual observation". The function is "checked against all round the year observations of Blackburn, UK". |
| 2011-06 (17 Jun 2011) | Still "provides correct schedule upon request through e-mail". Its example requests include "London, ENGLAND - Hanbali". Above 66.5°: "Some convention has to be adopted based on local civil time that is practical and does not cause hardship." |
| **2011-08 (16 Aug 2011)**, two weeks after London adopted the unified timetable on 1 August 2011 | Rewritten as "Prayer Times Definition We Use" (the text that grew into how-we.html). The rules:<ul><li>Fajr is Subh Sadiq "when morning light in the sky spreads horizontally", and Maghrib is "3 minutes after theoretical sunset".</li><li>"Moonsighting.com uses a combination of Shafaq Abyad in Winter and Shafaq Ahmer in summer ... Transition from Abyad to Ahmer is used in Spring and fall seasons ... These formulae are good up to the 55° latitude."</li><li>"**At latitudes between 55° and 65°**, the rule of Sab'u Lail (1/7th of the night) is used ... Isha time is earlier of the two ... Fajr time is later of the two."</li><li>"At latitudes higher than 65° ... a suggestion by Fuqaha' is to calculate for nearest lower latitudes where the sun sets and rises".</li><li>The function was fitted by "curve-fit technique", and "Moonsighting.com algorithm for function of latitudes and seasons is not yet included in the booklet".</li></ul> |
| French page, 2010-08 capture (section 2.9) | 1/7 of the night "between 55 and 66 degrees" |
| how-we.html today (1 Mar 2024) | The 18° comparison up to 55°; 1/7 of the night from 55° to **60°**; above 60°, "slide down to 60degrees". Fajr: "We originally used Subh-Sadiq as a little bit earlier than Fajr-al-Mustatir ... but recently ... started using the spread of light horizontally ('Tabayyun')". Where the sun does not set, latitude is stepped down 0.1° (faq_pt 1.2). |

**When each phrase first and last appears.** The eight failed captures were recovered, so 60
captures with real content cover 1999-02-21 to 2011-08-27. Each capture's full text was searched,
not the truncated extracts above. Where the table above disagrees with this list, this list wins.

| Phrase on the page | Captures | First seen | Last seen |
| --- | ---: | --- | --- |
| "Maghrib ... 3 minutes after" | 55 | 1999-02-21 | 2011-08-27 |
| 1/7 of the night | 37 | 1999-02-21 | 2011-08-27 |
| Zuhr "5 minutes" after noon | 47 | 2002-02-03 | 2011-08-27 |
| Timetables "upon request through e-mail" | 49 | 1999-10-12 | **2011-07-27** |
| "calculated for Sun being 18 degrees" | 7 | 2003-12-04 | 2005-03-22 |
| "combination of 18 degrees, 15 degrees, and even 12" | 4 | 2004-10-01 | 2005-03-22 |
| "function of Latitudes and Seasons" | 35 | **2005-05-17** | 2011-08-27 |
| Blackburn | 35 | 2005-05-17 | 2011-08-27 |
| Hizbul Ulama | 34 | 2005-05-17 | **2011-07-27** |
| Tabayyun / "spreads horizontally" | 9 | **2010-07-28** | 2011-08-27 |
| "good up to the 55° latitude" | 8 | 2010-07-28 | 2011-08-27 |
| "between 55° and 65°" (1/7 of the night) | 4 | **2011-05-22** | 2011-08-27 |
| "Shafaq Abyad in Winter and Shafaq Ahmer in summer" | 1 | **2011-08-27** | 2011-08-27 |
| "between 55 and 60" | 0 | none | none |

Read against London's adoption on 1 August 2011:

- **Before the adoption.** The latitude-and-season function had been on the page since May 2005,
  with the Blackburn observations and Hizbul Ulama cited as confirming it. Tabayyun for Fajr and
  "good up to 55°" arrived in July 2010, and the 55–65° 1/7 band in May 2011.
- **After it.** Shafaq General, the combined Abyad-in-winter, Ahmer-in-summer Isha, first appears on
  27 August 2011. The 27 July 2011 capture still says only that "both Shafaq Abyad (Hanafi) and
  Shafaq Ahmer (Shafi'i, Maaliki, Hanbali) can be calculated by different formulae". So does the
  endpoint's default method 0.
- **At the same time.** Hizbul Ulama's mention and the "upon request through e-mail" offer are last
  seen on 27 July 2011. The first archived copy of the online generator, `pray.php`, is
  17 October 2011.
- **UNVERIFIED:** whether London's timetable was built on the pre-General Isha (strict Abyad or
  Ahmer, or the Hizbul Ulama chart) or on Shafaq General. The London data diff has to settle it.

What this establishes:

- **The high-latitude band has been restated at least three times.** The 1/7-of-the-night band's
  upper edge went 66° (2010), then 65° (2011), then 60° with a slide to 60° (2024). Section 2.11
  measured that neither the endpoint nor adhan applies the slide today. So **the published text
  and the published tables disagree above 60°**, and the tables look closer to the 2010–2011
  wording.
- **The Fajr definition has changed too.** It moved from "a little bit earlier than" the spread of
  light to Tabayyun, the spread itself. The date of that switch is not given ("recently"). Any
  London timetable fixed before the switch could differ from today's base in Fajr for that reason
  alone. **UNVERIFIED:** whether this accounts for any part of the London delta (section 3).
- **The 2011 rewrite and London's adoption are two weeks apart.** London adopted on 1 August 2011;
  the page's "Updated" date is 16 August 2011. The documents seen so far do not say whether the two
  are linked.

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
