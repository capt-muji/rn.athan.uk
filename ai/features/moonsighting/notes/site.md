# moonsighting.com: full site reading notes

Researcher: site-reading agent, 2026-09-14. This covers moonsighting.com HTML pages from crawl 1 and crawl 2 (both finished), plus the Wayback captures of pages that are 404 live.
Not covered: the PDF documents, which are in `notes/documents.md`, and the full prayer.html history, which the lead is diffing under `pdfs/wayback/prayer-html/`.
All quotes are verbatim, typos included. No prayer time is copied anywhere in this file. The Apple MapKit JWTs in `assets/js/apple_map.js` exist for three hostnames; their values are not reproduced.

Scratch outputs: `~/athan-research/site-reading/`, which holds these:
- `reports-sweep.txt`: every monthly report, with its preamble and keyword lines
- `nonreport-table.tsv`
- `ok-paths.json`: the union of HTTP 200 paths
- `wayback/` and `wayback-text/`: raw captures and their text

---

## 1. Page inventory

### 1.1 Counts
Union of crawl 1 (`crawl.log`) and crawl 2 (`crawl2.log`, ends `DONE fetched 907 queue left 0`). Only HTTP 200 paths count, and `www.` and bare-host copies are collapsed into one.

The two host copies are byte-identical, apart from Cloudflare email-obfuscation tokens and `http`/`https` in a few links. I checked all 5 differing pairs (index, faq_ms, faq_pt, moon, articles/2eclipses).

| Type | Unique 200 paths | Read how |
|---|---|---|
| Monthly moonsighting reports `14xxmmm.html` (1429–1431, 1435–1436, 1438–1448; 12 each) | 192 | Every report was parsed. For each one, the preamble, placeholder count and all keyword lines went to `reports-sweep.txt`. Anything off the usual pattern was read in context. |
| Query-string duplicates of reports (`?mc_cid`, `?fbclid`, `?utm_source=chatgpt.com`, `?_e_pi_`) | 4 | Same bytes as the canonical report |
| `gregorian-calendar.php` and `?YEAR` (1796–2266, sampled) | 434 | Scripted. All 434 contain only month grids; the residual non-calendar text is empty |
| FCNA yearly Hijri calendars `1438fcna`–`1443fcna.html` | 6 | Grid plus 3 header lines each |
| `index.cgi/...` (any path; the server returns the homepage) | 418 | Crawler loop. Every copy is 22,342 bytes, and a sample diff against `index.html` shows only the Cloudflare email token differs |
| "Do Not Click" joke chain `dont/*` | 63 | All read |
| Articles `articles/*` | 11 | All read |
| Other site pages (including `/`, `pray.php`, `3books.html`, `hijri-calendar.html`) | 38 | All read |
| `praytable.php` responses | 7 | Read for structure only; no times copied |
| Query-string duplicates of pages (`ramadan-eid.html?fbclid`, `visibility.html?s=09`) | 2 | Identical |
| PDFs on the live site (`1444HijriCalendar.pdf`, `actual-saudi-dates.pdf`) | 2 | Text extracted and scanned. No prayer-time content; see §7 |
| Scripts (`moonsightingmenu.js`, `mmenu.js`, `header.js`, `assets/js/apple_map.js`, `index.js`, `tz.js`, jQuery, Bootstrap, Cloudflare email-decode) | 9 | The site's own JS was read in full. The libraries were scanned for URLs |
| **Total** | **1,186** | |

About 410 further paths never returned 200. Most are junk URLs parsed out of JS, and the rest are historic pages that are now 404 (§1.4).

**Pages read: all 1,186 unique 200 paths.** Of the 1,186, 434 calendar grids and 418 homepage duplicates were checked by script; the rest were read directly or through the scripted report sweep.
Without the loop, the calendar grids and the query duplicates, the site has **262 distinct content pages**: 192 reports, 38 site pages, 11 articles, 6 FCNA calendars, 63 joke pages, 7 praytable responses and 2 PDFs, plus the JS.

**The menus hide nothing.** `moonsightingmenu.js`, the Milonic sidebar, links only to pages already in the list, plus these externals: GitHub `PrayerTimeResearch/PrayerTimeAPI` (labelled "API Prayer Times for Programmers"), latlong.net, timeanddate, stellafane, worldtimezone and alexandertutoring. `mmenu.js` is the Milonic engine, with no page links. `header.js` only writes a stylesheet link.

### 1.2 Table of every non-report page
Updated dates are the page's own "Updated …" line; "-" means the page has none. PT means prayer-time relevant.

| URL (www.moonsighting.com/…) | Title | Updated | Content (one line) | PT |
|---|---|---|---|---|
| `/` (= `index.html`) | Moonsighting.com | March 10, 2024 | Home. Report grid 1438–1448, stale Ramadan 1445 banner, a live date line ("September 13, 2026 (Sun) Preparing for Next Islamic Year"), ad links, PayPal donate | no |
| `moon.html` | Moonsighting.com | March 10, 2024 | Same as home, without the live date line | no |
| `how-we.html` | How We Calculate Muslim Prayer Times | March 1, 2024 | The method: Fajr/Isha latitude-season function, 1/7 night, Aqrabul-Bilad, Zuhr +5, Maghrib +3, Asr factors | **yes** |
| `faq_pt.html` | FAQ About Prayer Times | August 25, 2020 | 25 Q&As: Blackburn data in minutes and degrees, ISNA 15°, Maghrib +3, Zuhr +5 | **yes** |
| `pray.php` | Moonsighting.com Prayer Timetable | - | The interactive timetable form. "Developed by Ahmed Bu-khamsin", "Original code by PrayTimes.org" | **yes** |
| `praytable.php` (+6 query variants) | (fragment) | - | Server table generator called by `apple_map.js`. Columns Fajr, Sunrise, Dhuhr, Asr(H)/(S), Maghrib, Isha | **yes** |
| `about-us.html` | About Us: Moonsighting Man (Khalid Shaukat) | April 14, 2022 | Biography. "chief consultant to FCNA and ISNA for … Prayer Times" | yes (who) |
| `lectures.html` | Moonsighting Lectures | November 21, 2021 | 121 lectures 1993–2017, several on Fajr & Isha, 4 in London | **yes** |
| `3books.html` | Moonsighting Reports [sic] | - | Three books by Shaukat. Book 2 "Fajr & Isha" blurb | **yes** |
| `mosques.html` | Mosques around the World | July 2, 2021 | **A photo gallery of famous mosques by country.** No UK mosque, no users list, no timetables | no |
| `faq_ms.html` | FAQ About Moon-sighting | May 3, 2022 | 16 sections. Shaukat visibility criterion formula; "Dr. Monzur Ahmad of UK" checks calculations | minor |
| `faq_qd.html` | FAQ About Qibla Direction | April 11, 2019 | Great circle; sun over Kaaba "May 28, and July 16" | no |
| `qibla.html` | Qibla Direction | January 19, 2021 | MapKit Qibla map; sun over Kaaba "May 28 at 9:18 UT / July 15 at 9:27 UT" | no |
| `secondqibla.html` | First Qibla - Bayt al-Maqdis | November 15, 2021 | Al-Aqsa history | no |
| `mcw.html` | Moonsighting Committee Worldwide | April 3, 2024 | 282 members in 88 countries; 13 UK members | UK |
| `how-countries.html` | Moonsighting for Wolrd [sic] | May 15, 2022 | Which countries follow Saudi, Turkey, local sighting or own criteria; two UK groupings | UK |
| `countries.html` | Countries that have used moonsighting.com | June 27, 2021 | 236 countries | no |
| `links.html` | Favorite Links | January 15, 2023 | Links; "AZAN-SOFTWARE" points to islamicfinder | no |
| `ramadan-eid.html` | Ramadan and Eid-al-Fitr | July 26, 2023 | FCNA/ECFR 8°/5° dates, 1445–1457 | no |
| `fcna-uq-calendar.html` | FCNA & UQ Calendar | July 26, 2023 | FCNA and Umm al-Qura month starts, 1445–1467 | no |
| `important-dates.html` | Important Islamic Dates in NA | March 13, 2024 | FCNA dates 1445–1448 | no |
| `globalcalendar.html` | Global Hijri Calendar | September 26, 2022 | Turkey 2016 congress, Qaradawi criterion | no |
| `hijri-calendar.html` | Hijri Calendar | May 2, 2020 | Qur'an verses on calendar; links "Moonsighting Conference in UK, October 31, 2010" | UK (video) |
| `soomu-hadith.html` | Month is 29 days (Hadith) | May 29, 2022 | Argues sighting is not required | no |
| `what-hijri-calendar-should-be.html` | What Hijri Calendar Should Be | - | Critique of Ali Manikfan's calendar | no |
| `manikfan.html` | Ali Manikfan | July 22, 2022 | Short biography | no |
| `morocco-meeting.html` | Morocco Meeting on Global Islamic Calendar | March 21, 2018 | Rabat, Nov 2006; FCNA "Conjunction before 12:00 UT" | no |
| `visibility.html` | Crescent Moon Visibility Maps 1438-1465 AH | May 7, 2022 | Link grid to the maps | no |
| `moonphotos.html` | Moon Photos | May 12, 2021 | Crescent photos 2013–2021 | no |
| `eclipses.html` | Sun & Moon Eclipses | October 24, 2022 | Eclipses; Salat al-Kusoof | no |
| `planets.html` | 8 Planets | January 9, 2022 | Fact table | no |
| `perigee-apogee-new-full.html` | Perigee/Apogee Calculator | - | fourmilab JS calculator | no |
| `evolution.html` | Evolution of Calendars | - | Essay by S. Khalid Shaukat | no |
| `ever-wonder.html` | Ever Wonder Why | November 21, 2021 | "(3) In 1900 AD, in Indian subcontinent, calculated Prayer Times were not acceptable by Fatawa" | minor |
| `isra-meraj.html` | Isra-Meraj | - | Date discussion | no |
| `fun-time.html` | Fun Time | August 25, 2022 | Jokes and puzzles | no |
| `dilaram.html` | Dil-Araam Chess Problem | - | Chess story | no |
| `ned67warrenton.html` | NED67 Group photos | August 25, 2021 | Photos only | no |
| `articles.html` | Articles index | August 12, 2022 | 14 articles; **none on prayer times** | no |
| `articles/significance of urjoonal-qadeem.html` | Significance of Al Urjoonal Qadeem | - | Irshad Sait (Hijri Committee of India) | no |
| `articles/when-hijri-calendar.html` | When Would We Have Hijri Calendar? | - | Zaheer Hussain | no |
| `articles/story-of-wise-man.html` | Story of a Wise Man | - | K.V. Aboobacker | no |
| `articles/eid-on-4-days.html` | Eid on 4 Different Days | - | A.H. Nazeer Ahmed | no |
| `articles/why-islamic-dates-in-mess.html` | Why are Islamic Dates in a Mess? | - | Irshad Sait | no |
| `articles/full-moon-on-eidul-adha.html` | Full Moon/Eclipse after Eidul Adha | - | Irshad Sait | no |
| `articles/2eclipses.html` | Qadiani claim of 2 eclipses | - | Shaukat, 1998 calculations | no |
| `articles/inventions.html` | Inventions by Muslims | - | Compiled by Shaukat | no |
| `articles/chronology.html` | Chronology of Early Scholars | - | Compiled by Shaukat | no |
| `articles/roleofislam.html` | The Role of Astronomy in Islam | - | Dr Shirin Haque-Copilah; "softwares available for calculating … prayer times and qibla" | minor |
| `articles/hilal-manaazil.html` | Hilal or Manaazil | May 3, 2014 | Four anti-sighting articles | no |
| `1438fcna`–`1443fcna.html` | Hijri Calendar for North America | - | FCNA month grids | no |
| `gregorian-calendar.php[?YEAR]` | Gregorian Calendar | - | Year grids | no |
| `dont/*` (63) | Do Not Click | only `donlang.html` "Updated April 7, 2023" | Joke loop | no |
| `1444HijriCalendar.pdf` | Hijri Committee of India 1444 | - | Image calendar | no |
| `actual-saudi-dates.pdf` | Actual Saudi dates | - | Umm al-Qura vs observed, 1389 AH onward | no |

### 1.3 Monthly reports: what they are and how current
- **Pattern:** conjunction time → visibility forecast → "earliest reported sighting" → per-date, per-country "Seen / Not Seen" reports by MCW members → a per-country table of the first day of the month.
- **Reporting stopped in spring 2024.** Placeholder (`????`) counts and page sizes are in `reports-sweep.txt`.
  - The last report with real content is `1445shw.html` (Shawwal 1445, April 2024).
  - `1445zqd.html` (May 2024) onward are stubs: forecast text only, with "The earliest reported sighting of the new crescent was on ......... from ...................".
  - The `rmd`, `shw` and `zhj` pages for 1445–1448 are empty templates with 118 `????` each.
  - Example: `1447rmd.html` still has `????` against every country in September 2026.
- **The site-wide "Updated" dates stop at the same point.** The newest are March 1, 2024 (how-we), March 10, 2024 (home), March 13, 2024 (important-dates) and April 3, 2024 (mcw).
  - The home banner is frozen: "The earliest reported sighting of the new crescent for Ramadan was on Sunday March 10 from Mexico City, Mexico" (that is Ramadan 1445).
  - Only the JS date line on `/` is live.
- **Reports absent live:** 1420–1428 (404), 1432 (404; a 2010 Wayback capture of `1432muh` exists), 1433 and 1434 (never linked, not in the index), and 1437 (all 12 are 404).
- **Prayer-time content in reports: none.** In 192 reports the only hits for Fajr, Isha, Shafaq or twilight are observers' incidental words ("after Maghrib", "by 'Isha time", "end of civil twilight"). No report discusses the prayer-time method. UK content in reports is in §4.

### 1.4 Historic pages (404 live) found through the Wayback index
Fetched raw (`id_`) into `site-reading/wayback/`, one capture each unless noted.

| Page | Capture | Content | PT |
|---|---|---|---|
| `prayer.html` | 19990221195144 | "Khalid Shaukat on Prayer Schedule", Updated Dec 9, 1998: **Fajr & Isha at 15°**, 1/7 night above 45°, Maghrib +3, Zuhr +5. The lead holds the other 63 versions | **yes** |
| `faq_ps.html` | 19990423015634 | "Questions on Prayer Schedule", Updated August 18, 1998; 11 Q&As; 15° endorsed by ISNA; observations "closer to 13.5 degrees" | **yes** |
| `prayer-french.html` | 20100827001844 | French translation of the 2010 English prayer page ("Mise à jour 30 mars 2010"). Latitude-season function; **Hizbul Ulama**; UK charts PDF; 1/7 rule 55–66° | **yes** |
| `methods.html` | 20000817190618 | "Methods for Beginning Islamic Months", Mar 30, 2000 | no |
| `britain.html` | 20010302151201 | Q-News Dec 2000: House of Lords fatwa on Ramadan dates by "scientific sighting" | UK |
| `uk-live.html` | 20100305133134 | Live crescent webcam, Qamar Uddin, York; Updated Feb 21, 2010 | UK |
| `1426uk&e`, `1427uk&e`, `1428uk&e`, `2005uk&e`, `2006uk&e`, `2007uk&e` | 2005 captures | "The Islamic Calendar for UK & Europe" (Hijri month grids) | UK (calendar) |
| `calendars/islamic-calendar-for-uk.html` | 20101024041703 | "Islamic Calendar for UK based on naked eye visibility in or East of UK", 1432–1434 | UK (calendar) |
| `shaukat.html` | 19991010105732 | 1999 biography: "Prayer Schedule … for various cities … even polar regions (Norway and Alaska)" | who |
| `members.html` | 20030808173032 | 2003 members list; UK: "Dr. Monzur Ahmed." | who |
| `home.html` | 19990218052741 | 1999 "Astronomy for Islam" portal; FAQ links, including prayer schedule | who |
| `index.html` | 19991010020601 | 1999 home: visibility criterion from "over 900 observations"; MoonCalc 5.0 map | no |
| `elementofplace.html` | 20000817190704 | FCNA/ISNA position on Eid al-Adha | no |
| `timezone.html` | 20061119060543 | Empty capture (no text) | no |
| (ten more archived pages: see §8.4) | | | |

---

## 2. Prayer-time calculation: every statement, grouped

### 2.1 Current method page `how-we.html` (Updated March 1, 2024)
Lead has read it; confirmed. Key sentences verbatim:
- **Fajr definition:** "Subh Sadiq (Fajr-al-Mustatir) when morning light in the sky starts spreadings horizontally. At high latitudes, where it becomes hardship to pray Fajr too early, (Tabayyan) when morning light in the sky has spread is used."
- **Sunrise:** "When the top of the sun's disk just appears above the horizon."
- **Zuhr:** "5 minutes after Zenith." Rationale: "It takes about 1.5 minutes for the sun's disk come out of zenith. Additional 1 minute must be added for a 30 miles radius consideration … a little factor of safety (additional 2.5 minutes) … Thus, 5 minutes should be added in Noon time for Zuhr."
- **Asr:** "The factor is 4/7 for Shi'aa; 1 for Shafi'i, Maaliki, Hanbali, and 2 for Hanafi." Elsewhere: Ja'fari 4/7 "(as given to me by a follower of Ayatullah Sistani)".
- **Maghrib:** "For Sunni's, actual sunset is 3 minutes after theoretical sunset; for Shi'aas it is 17 minutes after theoretical sunset." Its three reasons: refraction; "For major metropolitan cities, the sunset in a 30 mile radius"; downward-sloping ground.
- **Isha:** "Disappearance of Shafaq; Redness for Shafi'i, Maaliki, and Hanbali, and Shi'aa; whiteness for Hanafi. At high latitudes a combination of red and white shafaq criteria is used."
- **Fixed-degree failure latitudes:** "Above 48.5degrees (e.g., Vancouver, Canada), the sun does not go 18degrees below horizon on the longest day of the year. Above 51.5degrees (e.g., Cambridge, UK), the sun does not go 15degrees below horizon … Isha calculated at 15degrees will give Isha time 2.5 hours after Maghrib. … Above 54.5degrees (e.g., Copenhagen, Denmark) … 12degrees …"
- **UK practice:** "in the last few years Ulamaa' in England have switched from 18degrees to 15degrees or 12degrees or even 9degrees."
- **Observation sites:** "Riyadh (Saudi Arabia), Karachi and Tando Adam (Pakistan), Durban (South Africa), Auckland (New Zealand), Sydney NSW (Australia), Miami FL (USA), Washington DC (USA), Toronto (Canada), High Wycombe (UK), Dewsbury (UK), and Blackburn (UK)".
- **The model:** "A decade long research by Moonsighting.com found that the Subh-Sadiq and Shafaq are functions of latitude and seasons (day number of the solar year). All collected observations from different latitudes were plotted against day number of the year. With curve-fit technique, moonsighting.com came up with a function of latitude and seasons for Fajr & Isha." **No coefficients or formula appear anywhere on the site.**
- **Shafaq selection (contradictory, §6.1):** "Moonsighting.com uses Shafaq Ahmer in summer when nights are short and Shafaq Abyad in winter, when days are short. However, Shafaq General is chosen to avoid hardship at higher latitudes, when Shafaq Abyad becomes too late in summer. Shafaq General uses Shafaq Abyad in Summer and Shafaq Ahmer in Winter. Transition from Abyad to Ahmer is used in Spring and Ahmer to Abyad in Fall. These formulas are good up to the 55degrees latitude."
- **The 18° comparison, 0–55°:** "From equator to 55degrees, the 18degrees depression angle calculations are compared with the values given by the functions of latitude and seasons and most favorable values are used, which means; For Fajr, the later of the two and for Isha the earlier of the two."
- **Change of Subh Sadiq definition:** "We originally used Subh-Sadiq as a little bit earlier than Fajr-al-Mustatir of Ahadith just as a precaution. but recently, after collecting more and more observations from USA and Europe, we believe and started using the spread of light horizontally (We call it "Tabayyun") as Subh-Sadiq." (No date given.)
- **55–60°:** "the rule of Sab'u Lail (1/7th of the night), is used … Fajr time is later of the two. … Isha time is earlier of the two." Authorities cited: Thanwi (Imdadul Fatawa vol 2 p98), Shami, Mufti Shafi Usmani.
- **Above 60°:** "we slide down to 60degrees and calculate Fajr & Isha using the rule of Sab'u Lail in summer. … In winter, we use research by Moonsighting.com for Subh-Sadiq and Shafaq as functions of latitude and seasons". Justified by the Dar al-Ifta 18-hour fatwa and Oslo practice.
- **Qibla column:** "Either of this time is provided for everyday in Qibla column after Isha."
- **Users:** "Moonsighting.com method for prayer times is used by the following resources: 1. https://github.com/PrayerTimeResearch/PrayerTimeAPI 2. https://github.com/islamic-network/prayer-times-moonsighting"

### 2.2 `faq_pt.html` (Updated August 25, 2020)
- **1.1** "Zuhr time begins approximately 5 minutes after Zawaal (So, Zawaal is 5 minutes before Zuhr in the schedules provided by Moonsighting.com). … Isha ends at Fajr, but it is preferrable to pray Isha before Midnight."
- **1.2, high latitude (a different rule from how-we):** "moonsighting.com uses the Fiqh concept of "Aqrabul-Bilaad". To apply this concept an iterative calculation process is used by decreasing the latitude by 0.1 degrees keeping the longitude the same and recalculate Sunset time and repeat this process until a latitude is reached where the sun sets and that latitude and same longitude is used."
- **2.1, Haramain parameters:** Fajr 18.5°, Shurooq 1 minute before sunrise, Zuhr = calculated noon, Asr Hanbali, Maghrib 1 minute after sunset, Isha 90 minutes after Maghrib.
- **2.2, 15° vs 18° for Subh Sadiq:** "results are anywhere between between 9° to 18° from high latitudes to equator".
  - Miami, Dec 3, 2000: "The time that moonsighting.com had provided for 15° was 100% accurate."
  - **Blackburn:** "In 1987 a group of Ulema in Blackburn, England including Molana Yaqub Miftahi from UK … carried out the Mushahada (from September 1987 to August 1988) and chose to disregard the times provided by the Observatory … Observations show that the degrees for Fajr times fluctuate throughout the year."
  - **Dewsbury:** "Maulana Y.Ismail Qasmi (in his book, Bartaniya me Subh-e-Sadiq ka Sahih Waqt: Dewsbury U.K., 1983...Suppl. 1984) mentions several observations by the Ulama in England citing that Fajr prayer should be at 12° or even to 16°."
  - Chicago 1985: 13–15°. Tando Adam: 15°. NZ/Australia: 12–15°. Riyadh 2004 (Sheikh Abdul-Aziz Fauzan): 15°.
- **2.3** "if one has 15 degree chart for Fajr then one should finish eating 20 to 30 minutes before that chart time for Fajr."
- **2.5** "Isha time at 12° is not considered correct by Ulamaa across the world. Even Fiqh Coincil of North America (FCNA) does not accept 12° for Isha."
- **2.6** "Moonsighting.com have been studying this problem for over 25 years … Moonsighting.com has been providing the prayer times specially to extreme Northern latitides up to 72° (Barrow, Alaska and Tromso, Norway)". Also cites Hafiz Maulana Mohammad Naeem (Deoband), who compared the times in Alaska.
- **2.7** "Islamicfinder.org has used ISNA's name without verifying from ISNA. Since 2018 onwards, ISNA recommends using 15° for ease of calculations programmed by many in cell phones and websites. … It uses a complex formula based on latitudes and seasons."
- **2.10, the key Blackburn numbers:** "More observations were done in Blackburn, Lancashire, England (from September 1987 to August 1988) by a group of Ulamaa'. … for areas at or near equator Shafaq disappearance and Subh-Sadiq occurs at 18° every day of the year, and it translates into 75 minutes in all seasons. … **Subh-Sadiq at higher latitudes (like Blackburn) is observed at 94 to 122 minutes (14.6° to 10.6 degrees) in different seasons. Red Shafaq disappears at 66 to 105 minutes (12° to 9.7°) at higher latitudes in different seasons.**"
- **3.1 / 3.2** "At least 5 minutes after Zawaal should be allowed". "For Zuhr, 5 minutes after "Astronomical Noon" is a good approximation having a little factor of safety".
- **5.1, Maghrib:** "at least 3 minutes must be added to the calculated time of astronomical sunset … 1. The calculations are made at one point by longitude and latitude, and the observer in most cases could be up to 15 miles away from it." Mountains: "the sunset should be calculated as if the monutains are not there".
- **5.3** "The altitude from mean sea level does not affect sunrise/sunset time. What affects sunrise/sunset time is the height of observer from the ground."
- **1.4** Zodiacal light, "From temperate latitudes like those of the British Isles" (a quoted UK text).

### 2.3 The calculator: `pray.php`, `praytable.php`, `assets/js/apple_map.js`
- `pray.php`:
  - form fields: Latitude, longitude, Time Zone, Year
  - "Method:" options, in this order: "Hanafi (Shafaq General)", "Hanafi (Shafaq Abyad)", "Shafi'i, Maaliki, Hanbali", "Jafriyyah (Ithna-Ashari)"
  - "Time format: 24 hours / 12 hours" and "Print both Asr methods"
  - footer: "Calculation method by moonsighting.com / Developed by Ahmed Bu-khamsin [twitter.com/techi50] / Original code by PrayTimes.org"
  - app badges: Google Play `com.techiapps.skyprayers` and App Store `sky-prayers/id439409680` ("Sky Prayers")
- `apple_map.js` (header comment "//This is the new file 01/08/2022"):
  - Calls `praytable.php?year=…&tz=…&lat=…&lon=…&method=…&both=…&time=…`, with the timezone taken from the browser `Intl` or from `tzlookup` (tz.js) on pin drag.
  - Ka'bah point `21.423333, 39.823333`. With geolocation denied, it defaults to `24.5247, 39.5692` (Madinah).
  - `changeSelection()` disables "both" when `selectedIndex == 3` (Ja'fari).
  - MapKit JWTs for www, bare host and localhost (not copied).
- `praytable.php` output: "The latitude is …, the longitude is …, and the timezone is …", then a table with a year column and Fajr, Sunrise, Dhuhr, Asr(H) (plus Asr(S) if both), Maghrib, Isha.
  - One row per day: the 2020 Chicago response has 367 `<tr>`.
  - The output contains **no method text, parameters or version**.
  - A bare `praytable.php` returns a 25-byte table-closing fragment.
- **`time_json.php` does not appear in any saved page or script** (grep across `site/`). Nor does "PrayTimes" appear except in the `pray.php` footer.

### 2.4 The earlier methods (Wayback)
- **1998–1999, fixed 15°.** `prayer.html`, Updated Dec 9, 1998:
  - "Fajr & Isha are calculated for Sun being 15 degrees below horizon, a value adopted by ISNA … the most suitable judgmental scientific values of degrees below horizon that appear to be correct have been suggested to be 15 degrees, that was adopted by ISNA."
  - "for latitudes higher than 45 degrees … (This includes 1/7th of the night before sunrise for Fajr and 1/7th of the night after sunset for Isha. In some cases, even this is impractical, so the times for Fajr & Isha are kept in line with other days of the year just before and after these special days of hardship in summer and winter, such that the times are roughly those of nearby latitudes where practical times can be calculated.)"
  - Maghrib is "3 minutes after sunset" and Zuhr "5 minutes are added in Noon time"; the reasoning is identical to today's. Times were sent by e-mail on request.
- **`faq_ps.html`**, Updated August 18, 1998:
  - A5: "After collecting the actual observation for Subh-e-Sadiq … and disappearance of Shafaq … the angle comes out to be closer to 13.5 degrees. Keeping a little factor of safety, it makes sense to keep on using 15 degrees not only in North America, but I also anywhere in the world."
  - A6: "15 degrees is the best approximation for both Fajr and Isha for all latitudes up to 45 degrees … I have been using 1/7th of the night rule".
  - A1: "5 to 10 minutes after Zawaal should be allowed for the beginning of Zuhr."
  - A2: "Isha ends at Midnight."
- **June 2003 → November 2008, the switch.** The 2003-06-29 faq_pt still says "Islamic Society of North America (ISNA), has adopted to use the angle of depression as 15°, both for Isha and Fajr". The 2008-11-19 faq_pt already uses "a function of latitude and seasons" and claims it "matched observations with amazing accuracy" at Blackburn. Details in §8.3.
- **2010, the latitude-season function, from `prayer-french.html`** (a translation of the then-English page, "Mise à jour 30 mars 2010"):
  - Limited observations are "délusoires". "Une observation plus complète pendant toute l'année a été effectuée à Blackburn (Lancashire, Angleterre) par un groupe de `oulamâ' (cliquez ici pour télécharger un livre publié par Hizbul Ulama, 74 Upton Lane London E7 9LW UK)".
  - "Le chafaq met entre 66 et 100 minutes (de 9 à 13,6 degrés) à disparaître à des latitudes plus élevées (comme l'Angleterre) selon la saison."
  - "Aux latitudes comprises entre 55 et 66 degrés, la règle du soubou` al-layl (1/7e de la nuit) est utilisée".
  - Above the Arctic circle: "se baser sur les régions les plus proches situées à une latitude moindre où le soleil se lève et se couche."
  - Book "When to Pray Fajr & Isha" (~46 pages): "L'algorithme de moonsighting.com pour la fonction basée sur la latitude et la saison n'est pas encore inclu dans le livret."
  - Warning: "Ceci a également été confirmé par Hizbul Ulama UK, 74 Upton Lane London E7 9LW … Lisez le livre détaillé, « Fajr and Isha » écrit par Molvi Yaqub Ahmed Miftahi du Royaume-Uni. Cela a de plus été confirmé de manière indépendante par des scientifiques au Pakistan en 2007." (links `articles/fajr&isha-yam.pdf` and `articles/ghor-talab.gif`)
  - "Cliquez ici pour avoir les horaires des prières des grandes villes du Royaume-Uni." → `articles/uk-prayercharts1.pdf`
  - ISNA: "J'ai vérifié avec l'ISNA (Dr. Muzammil Siddiqi et Dr. Sayyid Syeed), et l'ISNA n'a jamais eu de position officielle concernant les horaires des prières. Utiliser 15 ou 18 degrés pour le fajr ou le `ichâ' n'est pas correct."
  - "Moonsighting.com fournit des calendriers corrects sur simple demande par e-mail, et aucun degré fixe n'est utilisé. Nous utilisons une formule complexe comme fonction pour les latitudes et les saisons".
- **Book 2 blurb, `3books.html` (undated):** "in the last few years the Ulama in England have switched from 102° to 108° and then back to 102°, etc., and yet no satisfactory answer has emerged". These are zenith angles, i.e. 12° → 18° → 12° depression.

### 2.5 Other prayer-related statements
- `ever-wonder.html`: "(2) 300 years ago, when clocks and watches were invented; use of those devices for prayer times was not allowed by Fatawa (Fatwas). (3) In 1900 AD, in Indian subcontinent, calculated Prayer Times were not acceptable by Fatawa (Fatwas)."
- `faq_ms.html` 11.8: "Invention of watches did not change the paryer times that were in practice before watches."
- `hijri-calendar.html` (Ghamidi quote): "At suhoor time, no one watches white light appearing in the sky; every one relies on watch."
- `eclipses.html`: congregational 2 rak'aat at solar eclipse.

---

## 3. Who maintains, who produces the tables, who uses them
- **Founder and author:** Khalid Shaukat. "the founder of moonsighting.com, and Moonsighting Committee Worldwide (MCW)".
  - "He is the chief consultant to Fiqh Council of North America (FCNA) and Islamic Society of North America (ISNA) for moonsighting, Hijri Calendar, Prayer Times, and Qibla Direction." (about-us, Apr 14, 2022)
  - In 1999: "consultant on moonsighting for Islamic Society of North America, and a consultant for Islamic Shura Council of North America" (shaukat.html).
  - The pages are first-person ("I, Khalid Shaukat").
  - `mcw.html` lists "Engr. Khalid Shaukat, Silver Spring, MD". The contact is `shaukat@moonsighting.com` (1999 pages).
- **Table producer:**
  - 1998–2010: tables e-mailed on request ("send your city name", prayer.html 1999; French 2010 page).
  - Since then: the web calculator `pray.php` → `praytable.php`, "Developed by Ahmed Bu-khamsin" (Twitter @techi50, whose apps are "Sky Prayers"), "Original code by PrayTimes.org". The map JS is dated "01/08/2022".
  - The site publishes no algorithm or coefficients (§2.1). The French page says the algorithm was not in the book either.
  - From Dec 2012 (faq_pt) and Oct 2013 (how-we) to 2016–2017, both pages advertised **Shaukat's own unpublished ~28-page booklet "Fajr & Isha"**: "Moonsighting.com has developed algorithms for function of latitudes and seasons based on observations after decades of research. These algorithms are included in the booklet. … a hard (xeroxed) copy of the manuscript can be sent by postage mail (NOT by e-mail) upon request." This is the only place the site says the formula was ever written down. The paragraph was removed from how-we in 2016 and from faq_pt in 2017. The booklet was not found in the crawl or the Wayback index.
- **Programmatic users named by the site:** `github.com/PrayerTimeResearch/PrayerTimeAPI` (menu: "API Prayer Times for Programmers") and `github.com/islamic-network/prayer-times-moonsighting` (how-we.html).
- **Reach claimed:** "Prayer Times, Qibla Direction, and Moonsighting information to more than 500,000 people in more than 6,000 cities, in almost every Country in the World (at least 236 countries)" (about-us).
- **Checkers:** `faq_ms.html` 9.20 says "Calculations are chacked by other Muslims (e.g. Dr. Monzur Ahmad of UK, and Mohammed Odeh of Jordan)". That refers to moon calculations. The 1999 home credits "Dr Monzur Ahmed's MoonCalc 5.0". The 2003 `members.html` lists "UK: Dr. Monzur Ahmed."
- **No list of mosques or organisations using the prayer times exists anywhere on the live site.** `mosques.html` is a photo gallery. `links.html` lists 6 Washington-DC-area mosques as links, not users.
- **Hosting:** Cloudflare (email obfuscation, `/cdn-cgi/`); PayPal donate form; paid ad links (essay services, CBD gummies); a free hit counter, "Visitors since Feb. 1996".

---

## 4. UK and London content

### 4.1 Prayer times
- **Blackburn observations:** faq_pt 2.2 and 2.10 (quoted in §2.2), how-we observation list ("High Wycombe (UK), Dewsbury (UK), and Blackburn (UK)"), and the 2010 French page (Hizbul Ulama, 74 Upton Lane; the Miftahi book). The book itself is summarised in `notes/documents.md` A1.
- **Unified Prayer Timetable / London timetables: no mention on any live or archived page read.**
  - The corpus grep for "timetable", "unified prayer", "East London Mosque" and "London Central Mosque" matches only the pray.php title ("Moonsighting.com Prayer Timetable") and moonsighting announcements in the 1431rmd and 1441rmd reports.
  - Every "unified" hit on the site means the "unified global Islamic calendar".
- **UK city charts:** the 2010 page links `articles/uk-prayercharts1.pdf` ("horaires des prières des grandes villes du Royaume-Uni"). The Wayback index also has `articles/uk-prayercharts.pdf` (2007) and `articles/prayers-uk.pdf` (2008). Handled in documents.md.
- **Cambridge example:** how-we "Above 51.5degrees (e.g., Cambridge, UK), the sun does not go 15degrees below horizon on the longest day of the year." (London's latitude is below this threshold.)
- **UK Ulama switching degrees:** how-we says "18degrees to 15degrees or 12degrees or even 9degrees"; 3books says "102° to 108° and then back to 102°".

### 4.2 Moonsighting and organisations (reports and pages)
- **`how-countries.html` (May 15, 2022):**
  - under local sighting: "UK"
  - under "Countries that follow their own criteria": "UK [Coordinated by Major Islamic Centres and Mosques of London]" and "UK [Wifaaqul ulama), (Ahle Sunnat Wal Jamaat], OR (Sighting from countries east of UK)"
- **Reports, UK groupings in the country tables:**
  - "UK (Follow Saudi)" and "UK [Coordinated by Major Islamic Centres and Mosques of London]" (23 reports each)
  - "UK (Calculations) [Coordination Committee of Major Islamic Centres and Mosques of London]" (1431rmd.html, Aug 2010)
  - "UK (Local Sighting) [Wifaaqul ulama…]" (1435rmd)
  - "UK [National Council of Mosques London]" and "UK [Markazi Jamat Ahle Sunnat UK & Overseas Trust" (1439shw)
  - "UK - Central Moon Sighting Committee of Great Britain, (Jamiat-ul-Ulama Britain Dar-ul-Uloom Bury & Hizbul-Ulama) (Following Saudi)" (1431zhj)
- **Hizbul Ulama in reports:**
  - `1431rmd.html`: "False Sighting Reports for Ramadan on August 10 from Birmingham, UK (Jamiatul Ulama Britain, Darul Uloom Bury, Hizbul Ulama UK): Simple facts: Sunset was 8:50pm; Moonset was 8:35pm that was before sunset. Sighting was done after 9:00pm. What an absurdity!"
  - `1431shw.html`: "Hizbul Ulamaa from UK reported: … we, the Central moon-sighting Committee of Great Britain officially announce that Eid-ul-Fitr will now be celebrated in the UK on Friday 10th September 2010. Central Moonsighting Committee of Great Britain includes Dar-ul-Uloom Bury, Jamiat-ul-Ulama Britain & Hizbul-Ulama UK."
- **London Coordination Committee:**
  - `1429shw` (2008): "This is an official statement for London which has been announced further to my reporting of Regents Park Mosque: 'The Coordination Committee of Major Islamic Centres and Mosques of London has agreed that Eid ul-Fitr, will be on Tuesday 30 09 2008.'" The same committee appears in 1430rmd, 1431rmd ("official statement by Regents Park and East London Mosque and others") and 1431shw.
  - `1441rmd` (2020), "Coordination Council of Mosques 2020": "The Islamic Cultural Centre & London Central Mosque / East London Mosque & London Muslim Centre Al Manaar … Markazi Jamiat Ahlehadith UK / Banbury Sheikh Bin Baaz Masjid / Mayfair Islamic Centre Green Lane Mosque / Jamiat e Ulama Britain / Al Muntada Al Islami / West London Islamic Centre / Edinburgh Central Mosque / Muslim Welfare House / Masjid Al Tawhid / Finsbury Park Mosque".
- **Wifaqul Ulama:**
  - "Wifaqul Ulama Administrator of Britain reported:" appears in 31 reports; Aziz Raje of Ilford/Walthamstow reports for them in 1430.
  - Their decisions follow UK sighting or sighting "from countries east of UK" (Morocco, South Africa).
- **Blackburn in reports:**
  - Hamid Chaudry (1431zhj, 1435sfr)
  - MCW member Hidayatullah Patel, "Mellor, Blackburn, Lancashire" (1440shb, 1440zhj)
  - 1441rmd: "Moon not sighted in Blackburn, UK today 23rd April"
  - New Crescent Society (1441rmd): "Accrington, Batley, Blackburn, Cornwall Dewsbury, …"
- **Oxford:**
  - Dr Muhammad Afifi al-Akiti (MCW) in 10 reports, 1429–1444
  - Croydon Mosque sighting "(Wednesday, 4 June 2008)" (1429jmt)
- **Royal Observatory:** a link posted in 1431rmd: `nmm.ac.uk/rog/2010/07/start_and_end_dates_of_ramadan.html`.
- **MCW UK members (mcw.html, Apr 3, 2024):** Moeez Ahmad (Bradford), Nazish ishaque (Bradford), Aziz Raje (Ilford), Dr Afifi al-Akiti (Oxford), Bilal Brown (Oldham), Hidayatullah Patel (Blackburn), Juned Patel (Bolton), Modoris Ali (Birmingham), Mohammad Ramtoola (Preston), Nasar Ramzan (London), Qamar Uddin (York), Saraj Qazi (Luton), Shakil Qureshi (Cardiff).
- **Lectures in the UK (lectures.html):**
  - "81. Live Talk on Radio Ikhlas, Darby, UK (Oct 24, 2004) — How to Achieve Unity on Moon Issue"
  - "86. Islamic Education Board, London, UK (Sep 4, 2005) — Moonsighting: Science/Shari'ah Perspective"
  - "107. Live Talk, IQRA TV, London UK (Oct 30, 2010) — Moonsighting & Eid-al-Adha"
  - "108. Tooting Islamic Center, London UK (Oct 31, 2010) — Moonsighting (Visibility Maps)"
  - video: "Khalid Shaukat on Moonsighting Conference in London, UK 2010" → vimeo.com/17995767
  - **None of the UK lectures is on prayer times.**
- **Archived UK pages:**
  - `britain.html` (House of Lords fatwa, Dec 2000)
  - `uk-live.html` (York webcam, 2010)
  - UK & Europe Hijri calendars 1426–1428 AH / 2005–2007
  - `calendars/islamic-calendar-for-uk.html` (2010, "naked eye visibility in or East of UK")

---

## 5. Lectures and articles on prayer times
- **Lectures on prayer times** (lectures.html, Updated November 21, 2021). All are in North America or the Caribbean/Africa; none in the UK:
  - 10 Westbury NY Oct 1995 "Moonsighting & Prayer Times"; 11 Astoria NYC Mar 30 1996; 12 Dale City VA Apr 1996; 16 Knoxville TN May 1997; 21 Edison NJ Mar 1998; 27 Charleston WV Jun 1999; 29 Beckley WV Aug 1999; 36 Berbice Guyana Jul 7 2000 "Qibla Direction and Prayer Times"; 42 Georgetown Guyana Jul 9 2000; 50 Bermuda Jun 9 2001
  - **56 Islamic Center of Maryland, Gaithersburg, Dec 28, 2001, "Calculate Salah Times in light of Quarn & Science"**
  - 63–65 Richmond/Surrey/Vancouver BC May 2–4 2003; 76 Baltimore Nov 16 2003; 83 Jamaica Masjid Queens Dec 25 2004
  - **103 ICM Gaithersburg Jun 14, 2009, "Times for Fajr & Isha'"**
  - **112 FCNA, Herndon VA, Sep 25, 2011, "Fajr & Isha in North America"**
  - **116 Detroit Muslim Center Apr 15, 2015, "Times for Fajr & Isha'"**
  - **121 FCNA, Richardson TX, Oct 28, 2017, "Revisit Fajr & Isha Times in North America"**
  - No slides, papers or video are linked for any of these.
- **Articles:** `articles.html` (Aug 12, 2022) lists 14 articles. **None is on prayer times.**
  - The archived `articles/` directory held prayer PDFs (`fajr&isha-yam.pdf`, `uk-prayercharts.pdf`, `uk-prayercharts1.pdf`, `prayers-uk.pdf`), all now 404 live; see documents.md.
  - `3books.html` Book 2 "Fajr & Isha" is available on request only (§2.4).

---

## 6. Contradictions and changes between pages

### 6.1 Inside `how-we.html`
1. **Shafaq General, three conflicting statements:**
   - (a) "Moonsighting.com uses Shafaq Ahmer in summer when nights are short and Shafaq Abyad in winter"
   - (b) "Shafaq General uses Shafaq Abyad in Summer and Shafaq Ahmer in Winter"
   - (c) the >60° section repeats (a): "uses Shafaq Ahmer in summer when nights are short and Shafaq Abyad in winter … This is chosen to avoid hardship at higher latitudes, when Shafaq Abyad becomes too late in summer."
   - (b) is the reverse of (a) and (c). The stated reason (Abyad is too late in summer) supports Ahmer in summer, i.e. (a).
   - Sentence (b) first appears in the 2020-01-14 capture (page "Updated May 17, 2019"). The 2011–2018 versions had only (a); the 2011 version adds that strict Abyad or strict Ahmer "can be calculated also". See §8.1.
2. **Tabayyun definitions:**
   - the definitions block uses "Subh Sadiq (Fajr-al-Mustatir) when morning light … starts spreadings horizontally", and "(Tabayyan) when morning light in the sky has spread" only at high latitudes
   - the conclusions block says "we … started using the spread of light horizontally (We call it "Tabayyun") as Subh-Sadiq"
   - So the same word names two different moments, and the page does not say whether Tabayyun applies everywhere or only at high latitude.
3. **Zones:**
   - "These formulas are good up to the 55degrees latitude"
   - 1/7 night "between 55degrees and 60degrees"
   - above 60° "slide down to 60degrees"
   - The introduction says 18° already fails above 48.5° and 15° above 51.5°, yet the page says the 18° comparison runs "From equator to 55degrees". It does not say what happens to the 18° side of the comparison on days when 18° does not occur (48.5–55°).

### 6.2 Between pages
| Topic | Page A | Page B |
|---|---|---|
| High-latitude rule | how-we: above 60° "slide down to 60degrees … Sab'u Lail in summer … In winter … functions" | faq_pt 1.2: Aqrabul-Bilaad by "decreasing the latitude by 0.1 degrees … until a latitude is reached where the sun sets" |
| 1/7-night band | how-we since Oct 2013: 55°–60° | how-we Aug 2011: "between 55° and 65°"; prayer-french 2010: "entre 55 et 66 degrés"; prayer 1998 and faq_pt 2003: above 45° |
| 18° zone | how-we since Jul 2016: 18° compared with the function "From equator to 55°" | how-we Oct 2013: "From equator to 30° latitude, for both Fajr & Isha, 18° depression angle is used … Between 30° and 55°" compared |
| >60° rule | how-we since Jul 2016: "slide down to 60°" always | how-we Oct 2013: only "If day length is more than 18 hours or less than 6 hours"; how-we 2011: "calculate for nearest lower latitudes where the sun sets and rises" (above 65°) |
| Algorithm availability | how-we 2011 and prayer-french 2010: "algorithm … is not yet included in the booklet" | faq_pt Dec 2012, how-we Oct 2013: "These algorithms are included in the booklet" (Shaukat's own 28-page booklet); removed Jul 2016 (how-we), Nov 2017 (faq_pt) |
| Maghrib radius | how-we and prayer.html 1998: "30 mile radius" (French: 48 km) | faq_pt 5.1: "up to 15 miles away" |
| Zuhr offset | how-we, faq_pt: 5 minutes | faq_ps 1998 A1: "5 to 10 minutes after Zawaal" |
| End of Isha | faq_pt 1.1: "Isha ends at Fajr, but it is preferrable to pray Isha before Midnight" | faq_ps 1998 A2: "Isha ends at Midnight" |
| ISNA position | prayer.html 1998: 15° "adopted by ISNA"; faq_ps 1998: "endorsed by ISNA"; faq_pt 2003: "ISNA, has adopted to use the angle of depression as 15°" | faq_pt 2008–2017: "ISNA never had any official position."; prayer-french 2010: "l'ISNA n'a jamais eu de position officielle concernant les horaires des prières"; faq_pt since 2020: "Since 2018 onwards, ISNA recommends using 15°" |
| 15° validity | 1998: 15° usable "anywhere in the world" up to 45° | how-we / faq_pt: "no fixed degree"; yet faq_pt 2.2 keeps the Miami e-mail praising "15° was 100% accurate" and 2.3 advises finishing Suhoor "20 to 30 minutes before" a 15° chart |
| Research length | how-we, faq_pt 2.2, 2.10: "A decade long research" | faq_pt 2.6: "studying this problem for over 25 years" |
| Blackburn Shafaq / Fajr | faq_pt since 2012: Red Shafaq "66 to 105 minutes (12° to 9.7°)", Subh Sadiq "94 to 122 minutes (14.6° to 10.6 degrees)" | faq_pt 2008 and prayer-french 2010: Shafaq "66 to 100 minutes (9 to 13.6 egrees)", Subh Sadiq "(14.5 to 10.6 degrees)"; faq_pt 2008 also: Fajr "12° to 13.5°", Isha "15° to 18°" |
| England degree history | how-we: "switched from 18degrees to 15degrees or 12degrees or even 9degrees" | 3books: "switched from 102° to 108° and then back to 102°" (12°→18°→12°) |
| Observation site lists | how-we: Riyadh, Karachi, Tando Adam, Durban, Auckland, Sydney, Miami, Washington DC, Toronto, High Wycombe, Dewsbury, Blackburn | faq_pt 2.10: Riyadh, Tando Adam, Cape Town, NZ, Buffalo, Toronto, Sydney, Phoenix, Trinidad + Blackburn |
| Qibla sun dates | faq_qd: "May 28, and July 16" ("12:27pm on July 16") | qibla.html: "May 28 at 9:18 UT / July 15 at 9:27 UT" |
| FCNA month criterion | 1430shw (2009): "conjunction must take place before sunset in Makkah and the moon must set after sunset in Makkah"; morocco-meeting (2006): "Conjunction before 12:00 UT (Fiqh Council of North America)" | ramadan-eid / fcna-uq-calendar (2023): ECFR "elongation … at least 8 degrees and moon … at least 5 degrees above horizon" anywhere |

### 6.3 What changes the picture from how-we.html
1. **The method is not old, and it kept moving.**
   - A flat 15° for Fajr and Isha ("adopted by ISNA"), with 1/7 night above 45°, lasted from Dec 1998 until at least June 2003.
   - The latitude-season function was in place by Nov 2008.
   - The zones then changed three times: 1/7 band 55–65° in 2011; a pure-18° zone up to 30° in 2013; the 18° comparison extended to 55° and the Tabayyun redefinition in 2016.
   - The Shafaq General reversal sentence arrived in 2019.
   - The method text has been unchanged in substance since Sept 2021 (§8.1, §8.3).
   - The Blackburn-validation claim ("matched observations with amazing accuracy", 2008) was deleted by Dec 2012.
2. **The method's UK evidence is Hizbul Ulama's Blackburn Mushahadah** (Sept 1987 – Aug 1988). The site named Hizbul Ulama and linked their book, but the book prints no formula (documents.md A1). The site never publishes the curve-fit coefficients.
3. **No page on the site mentions London's Unified Prayer Timetable, a London mosque's timetable, or any UK user of the times.** London appears only in moonsighting announcements.
4. **The site has been effectively frozen since spring 2024:** reports unfilled, newest "Updated" April 3, 2024, home banner stuck at Ramadan 1445. Anything the app needs from the site after that date cannot be expected.
5. **The public tool is a third-party re-implementation.** `pray.php` is "Developed by Ahmed Bu-khamsin" on "Original code by PrayTimes.org". Its method menu offers "Hanafi (Shafaq General)" and "Hanafi (Shafaq Abyad)", and shows no Shafaq Ahmer choice for Hanafi. Its output carries no method metadata.

---

## 7. Pages not read, or read only in part, and why
- **`index.cgi/*` (418 URLs):** the server returns the homepage for any `index.cgi/...` path. Every copy is 22,342 bytes; a sample diff shows only the Cloudflare email token differs. Not read one by one.
- **`gregorian-calendar.php?YEAR` (434):** crawl 2 sampled, crawl 1 looped. Checked by script, not by eye; no non-grid text in any.
- **Library JS** (`jquery.min.js`, `bootstrap.min.js`, `tz.js` timezone polygons, Cloudflare `email-decode.min.js`): scanned for URLs and endpoints only.
- **`1444HijriCalendar.pdf`** (24 MB, 6 pages, image-based Hijri Committee of India calendar): the text layer is date grids only; 0 keyword hits. **`actual-saudi-dates.pdf`** (2 pages): Umm al-Qura vs actual Saudi dates from 1389 AH; 0 prayer hits.
- **Long non-prayer pages** (`fun-time`, `evolution`, `roleofislam`, `planets`, `visibility`, `fcna-uq-calendar`): all prose was read and grids skimmed. Only `roleofislam` has a prayer-related line.
- **Live 404, not recoverable from the crawl:** reports 1420–1428, 1432–1434, 1437; `narvik.html` (its Wayback capture is itself a 404); `prayer.php` (Wayback 404).
- **`timezone.html` (2006 capture):** the capture is empty.
- **`pray.php` captures of 2025-03-04 and 2025-10-16:** Cloudflare "One moment, please..." verification interstitials, with no page content.
- **faq_pt / how-we / pray.php:** only 6, 9 and 6 of the 79, 58 and 34 digest-distinct captures were fetched. Those were chosen to span each era, and adjacent fetched versions that proved identical bound the change dates.
- **`prayer.html` 2000–2025 versions:** not fetched, by instruction; the lead holds 64 versions.
- **PDFs** (`fajr&isha-yam`, `uk-prayercharts*`, `prayers-uk`, `fajarishainbritain1`, `fajar&isha-a5`): in documents.md, not repeated.

## 8. Version history of the method pages (Wayback, digest-collapsed CDX)
There are three sources: the CDX lists in `site-reading/wayback/cdx__*.txt`, the captures in `site-reading/wayback/versions/`, and the sentence-level diffs in `site-reading/howwe-version-diffs.txt` and `faqpt-version-diffs.txt`.
- Some Wayback raw (`id_`) captures came back gzip- or zstd-compressed and were decompressed before diffing.
- The 2025 `pray.php` captures are Cloudflare bot-check pages ("One moment, please... Please wait while your request is being verified..."), not the calculator.

### 8.1 `how-we.html`: what changed, when
The CDX shows 58 digest-distinct captures between 2011-11-24 and 2026-07-21. Eight were fetched to span every text era, and they were diffed against each other and against the 2026-09 crawl.

| Capture (page's own "Updated") | Change of method substance |
|---|---|
| **2011-11-24** (Aug 16, 2011) | Oldest how-we capture. See the list below this table. |
| **2014-02-09** (Oct 30, 2013) | See the list below this table. |
| **2016-07-23** (July 5, 2016) | See the list below this table. |
| **2018-09-09** (July 4, 2017) | Above 60°: "Sab'u Lail **in summer**", plus the new winter sentence "In winter, we use research by Moonsighting.com for Subh-Sadiq and Shafaq as functions of latitude and seasons". Adds the Rafik Ouared (Pampigny, Switzerland, 23 June 2016) imsak e-mail. |
| **2020-01-14** (May 17, 2019) | **The Shafaq General contradiction is introduced here.** "Since only Imam Abu-Hanifa preferred Shafaq Abyad, Moonsighting.com uses Shafaq Ahmer in summer … and Shafaq Abyad in winter" becomes "Only Imam Abu-Hanifa preferred Shafaq Abyad. Moonsighting.com uses Shafaq Ahmer in summer when nights are short and Shafaq Abyad in winter, when days are short. However, Shafaq General is chosen to avoid hardship at higher latitudes, when Shafaq Abyad becomes too late in summer. Shafaq General uses Shafaq Abyad in Summer and Shafaq Ahmer in Winter. Transition from Abyad to Ahmer is used in Spring and Ahmer to Abyad in Fall." The >60° paragraph was not updated, so it still says Ahmer in summer. |
| **2022-05-17** (September 28, 2021) | Maghrib text rewritten ("Actual sunset can be 3 minutes after theoretical sunset reported in news papers and most Apps in cell phones"). The "used by the following resources" list (the two GitHub repos) first appears. |
| 2024-02-13 (Sept 28, 2021) | Identical to 2022-05-17. |
| **2025-03-04** (March 1, 2024) | No substantive change: "°" replaced by "degrees" throughout, date bumped. |
| 2026-05-02 and the 2026-09 crawl | Identical to 2025-03-04. **The method text has not changed in substance since September 2021; the last wording change was May 2019 (the Shafaq General paragraph).** |

**2011-11-24 (Updated Aug 16, 2011), oldest capture:**
- "Subh Sadiq (Fajr-al-Mustatir) when morning light in the sky spreads horizontally."
- "Moonsighting.com uses a combination of Shafaq Abyad in Winter and Shafaq Ahmer in summer. … However, if one prefers strictly Shafaq Abyad (Hanafi) or strictly Shafaq Ahmer (Shafi'i, Maaliki, Hanbali), it can be calculated also. These formulae are good up to the 55° latitude."
- "**At latitudes between 55° and 65°**, the rule of Sab'u Lail (1/7th of the night) is used".
- Above 65°: "calculate for nearest lower latitudes where the sun sets and rises".
- Observations quoted in detail:
  - Karachi/Tando Adam "15° to 16°"
  - Chicago "Subh-Sadiq was observed at 111 to 90 minutes before sunrise (about 15.7°-17.4°) … Shafaq Ahmer was observed at 76 to 57 minutes after sunset (about 12°-15°), while Shafaq Abyad was observed 98 to 77 minutes after sunset (about 13°-18°)"
  - "More observations were done in Blackburn, Lancashire, England (from September 1987 to August 1988) by a group of Ulamaa'."
  - "In 2007 independent Muslim scientists in Pakistan also confirmed that degrees fluctuate with seasons."
- Book "When to Pray Fajr & Isha" (~46 pp.): "Moonsighting.com algorithm for function of latitudes and seasons is not yet included in the booklet."
- The Mufti Shafi quote reads "(**the UK** in the summer months) it is permissible to act upon this advice. However, erring on the side of caution, one should stop eating 10 minutes before this time."
- Fajr at 1/7: "Tabayyan (when morning light in the sky spreads horizontally)".

**2014-02-09 (Updated Oct 30, 2013):**
- Fajr definition adds "At high latitudes, where it becomes hardship to pray Fajr too early, (Tabayyan) when morning light in the sky has spread is used."
- Asr factors 4/7, 1, 2 appear. Ja'fari Maghrib "17 minutes" appears.
- The **booklet becomes Shaukat's own**: "A booklet of about 28 pages (8-1/2 x 11), "Fajr & Isha" has been written by Khalid Shaukat of moonsighting.com … Moonsighting.com has developed algorithms for function of latitudes and seasons based on observations after decades of research. **These algorithms are included in the booklet.** … The booklet is not yet published, but a hard (xeroxed) copy of the manuscript can be sent by postage mail (NOT by e-mail) upon request."
- **New zoning:** "From equator to 30° latitude, for both Fajr & Isha, 18° depression angle is used that gives results matching observations. Between 30° and 55°, the 18° depression angle calculations are compared with the values given by the functions of latitude and seasons and most favorable values are used". 1/7 band narrowed to "**between 55° and 60°**".
- The Mufti quote changes "the UK" to "e.g., Northern Europe" and drops the 10-minute caution.
- Above 60° (new Dar al-Ifta 18-hour fatwa, Hammerfest, Oslo): "first we calculate the interval from sunrise to sunset and being a little conservative assume it to be the day length … **If day length is more than 18 hours or less than 6 hours, then we slide down to 60°** and calculate Fajr & Isha using the rule of Sab'u Lail. But then we keep whatever values are obtained at this new latitude, even if they are more than 18 hours."

**2016-07-23 (Updated July 5, 2016):**
- **Booklet paragraph removed** (the algorithms-in-booklet claim disappears).
- The 0–30° pure-18° zone is removed: "From equator to 55°, the 18° depression angle calculations are compared …", with the outlier rationale added.
- **Tabayyun redefinition added:** "We originally used Subh-Sadiq as a little bit earlier than Fajr-al-Mustatir of Ahadith just as a precaution. but recently, after collecting more and more observations from USA and Europe, we believe and started using the spread of light horizontally (We call it "Tabayyun") as Subh-Sadiq." So the change dates to between Oct 2013 and Jul 2016.
- The 1/7 Fajr comparison changes from "Tabayyan" to "Subh Sadiq".
- The >60° day-length test is **removed**: now "at latitudes more than 60°, we slide down to 60°" unconditionally.
- The criteria list changes from "17°, 19°, 20°, or even 21° … 90 minutes, 75 minutes or 60 minutes" to "15°, 18°, or even 20° … 75 minutes or 90 minutes criteria (as in Saudi and Indo-Pak)".

### 8.2 `pray.php` / `praytable.php`
- **2011-10-17**: "Moonsighting.com Prayer Timetable … If you get error message, please [e-mail] your request for Prayer Times for your city." The four methods are the same as today. "Developed by Ahmed Bu-khamsin / Original code by PrayTimes.org". Link to the iTunes Sky Prayers app.
- **2015-03-18**: adds "Calculation method by moonsighting.com" and the Google Play Sky Prayers link. **2017-06-23**: adds the link "HOW WE CALCULATES PRAYER TIMES, Click Here". **2020-01-14**: Bootstrap navbar (the current layout).
- **The method menu has not changed since 2011** ("Hanafi (Shafaq General)", "Hanafi (Shafaq Abyad)", "Shafi'i, Maaliki, Hanbali", "Jafriyyah (Ithna-Ashari)"). Hanafi Shafaq General has been the first and default option throughout.
- The March 2025 and October 2025 captures are Cloudflare verification interstitials, so the site now sits behind bot protection.
- The `praytable.php?` 2016 capture is 10 bytes (empty).
- The first `praytable.php` URL in the CDX is 2016-05-09; parameterised captures run 2020–2024.

### 8.3 `faq_pt.html`
The CDX lists 79 digest-distinct captures, 2003–2026. Six were fetched: 2003-06-29, 2008-11-19, 2012-12-05, 2017-11-24, 2021-09-24 and 2025-03-11. They were diffed against the 2026-09 crawl.

- **2003-06-29, "FAQ on Prayer Schedule", still fixed 15°:**
  - "Islamic Society of North America (ISNA), has adopted to use the angle of depression as 15°, both for Isha and Fajr."
  - "I have made calculations to find the corresponding angle of depression for each observation … closer to 13.5° to 14°. Keeping a little factor of safety, it makes sense to use 15° not only in North America, but also anywhere in the world."
  - "15° is the best approximation for both Fajr and Isha for all latitudes up to 45° … For this, I use 1/7th of the night rule".
  - Chicago 12° question: "Although, in general 15 degrees was adopted by ISNA, it is applicable for temperate latitudes. For latitudes higher than 40 degrees … One option is to use 12 degrees for Fajr & Isha. At some higher latitudes, sun does not reach even 12 degrees so some smaller value has to be adopted. This is in line with … the 1/7th Rule". Also: "Muzammil Siddiqi of ISNA, a scholar of Islam also agrees with the philosophy of hardship at higher latitudes."
  - Other bodies: "15°/15° (ISNA), 18°/17° (World Islamic League), 18°/18° (Karachi), 19°/17° (Umm al-Qura), and 19.5°/90 minutes (Egypt)".
  - "Isha ends at Fajr, but it is preferrable not to delay after Midnight."
- **2008-11-19, the latitude-season function, with Blackburn as its claimed validation:**
  - "In 1987 and 1988 a group of Ulema in Blackburn … **Observations show that the Fajr times do not conform to any given degrees but fluctuate throughout the year between approximately 12° to 13.5° in different seasons, and Isha times fluctuate between approximately 15° to 18°.**"
  - "A decade long research by Moonsighting.com found that the Subh-Sadiq or disappearance of Shafaq is a function of latitude and seasons. **When this function is checked against all round the year observations of Blackburn, UK, the calculations matched observations with amazing accuracy.** … **The functions used for fajr and Isha are not the same.**"
  - "we are in a position to calculated Fajr and Isha based on actual observations meeting the the Shari'ah for Sub-Sadiq and disappearance of Shafaq matching the Blackburn observations."
  - "Moonsighting.com calculates Fajr and Isha as a function of latitude and seasons, and that function matches systematic observations of the whole year at Blackburn, UK."
  - "**ISNA never had any official position.** Islamicfinder.org is wrong and at fault to use ISNA's name and that ISNA uses 15 degrees."
  - "( Click here to download a book published by Hizbul Ulama , 74 Upton Lane London E7 9LW UK)."
  - "Shafaq disappears at 66 to 100 minutes (9 to 13.6 egrees) at higher latitudes (like England) … Subh-Sadiq at higher latitudes is observed at 94 to 122 minutes (14.5 to 10.6 degrees)".
  - Haramain "Fajr 19°".
  - **The same 2008 page contradicts itself:** Fajr "12° to 13.5°" against Subh Sadiq "14.5 to 10.6 degrees", and Isha "15° to 18°" against Shafaq "9 to 13.6" degrees. For the book's own figure ("12 to 16 degrees") see documents.md A1.
- **2012-12-05:**
  - The Blackburn 12–13.5° / 15–18° sentence is cut to "Observations show that the degrees for Fajr times fluctuate throughout the year."
  - "amazing accuracy", "The functions used for fajr and Isha are not the same" and all "matching the Blackburn observations" wording are **removed**.
  - The Hizbul Ulama download link is removed.
  - The numbers become "Subh-Sadiq at higher latitudes (like Blackburn) is observed at 94 to 122 minutes (14.6° to 10.6 degrees) … Red Shafaq disappears at 66 to 105 minutes (12° to 9.7°)" (the live wording).
  - Haramain Fajr 19° becomes 18.5°.
  - Adds "If one wants to take into account high altitude (like in airplane), the sunset would only be delayed by a maximum of 8 minutes".
  - Adds "A new booklet of about 28 pages … "Fajr & Isha" … written by Khalid Shaukat … These algorithms are included in the booklet."
- **2017-11-24:** booklet paragraph removed; "Also note that up to 65 degrees latitude the sun rises and sets daily."
- **2021-09-24** (the live page says "Updated August 25, 2020", so these changes date to Nov 2017 – Aug 2020):
  - **Adds the 0.1° Aqrabul-Bilaad iteration** (Q1.2).
  - Adds "Even Fiqh Coincil of North America (FCNA) does not accept 12° for Isha."
  - "ISNA never had any official position" is **replaced** by "Since 2018 onwards, ISNA recommends using 15° for ease of calculations programmed by many in cell phones and websites."
  - Adds "For most places in the world at temperate latitudes, Islamicfinder.org prayer times are reliable."
- **2025-03-11 and the 2026-09 crawl:** identical to 2021-09-24.

**Dating the switch from 15° to the function:** June 2003 (15°) → November 2008 (function). The lead's prayer.html series can narrow it further.

### 8.4 Other archived pages fetched (all 404 live)
| Page | Capture | Content | PT/UK |
|---|---|---|---|
| `others.html` | 20110705071359 | "What others are saying about moonsighting.com", Updated June 19, 2011. Testimonials, including "Irfan Khan from Birmingham, UK - May 27, 2011 … Can you please email me the correct prayer timings for Birmingham, UK." and "Alex Gorin from Manchester, UK - June 16, 2011 … Your methodology, based on relativity of location, is by far the soundest." Also "Rula Alminawi - December 8, 2010 … thank you so much for the prayer schedule you provided for our city … until 2011". | PT, UK users |
| `faqs.html` | 20010210073214 | FAQ hub, Updated Feb 5, 2001. Shaukat "a consultant to Islamic Shura Council of North America, and National Coordinator for Islamic Society of North America (ISNA)". "Through his web site he has provided Prayer Schedule, Qibla Direction, or Moonsighting information to over 2500 cities". Calendar users: NAIT Indiana, Amica Technologies, Salama Arastu. | who |
| `ask.html` | 20030629144846 | "Ask Khalid Shaukat For questions about Moonsighting, Islamic calendar, Prayer Times, and Qibla Direction", Updated May 23, 2003 | who |
| `locate-mosques.html` | 20160416161450 | "Locate mosques in any zip code (USA/Canada)", Updated December 7, 2015 (widget only) | no |
| `compare.html` | 20170529231738 | FCNA/ISNA vs Umm al-Qura vs ECFR important dates 1438–1440, Updated May 3, 2017 | no |
| `calculation-or-sighting.html` | 20160305183825 | Which countries follow Saudi, Updated December 6, 2015. "UK - News from countries east of UK (e.g., Morocco, South Africa) (Some Follow Saudi) [Coordination Committee of Major Islamic Centres and Mosques of London]" | UK |
| `calc-sighting_init.html` | 20080223154632 | "Initial fixed frameset" (empty) | no |
| `monthly-reports.html` | 20200905140754 | Report index with the "Ever Wonder Why?" list, Updated August 16, 2020. Item "(3) 120 years ago, in Indian subcontinent, calculated Prayer Times were not acceptable by Ulamaa'." | minor |
| `unityofhorizons.htm` | 20061119060411 | Dr Zulfiqar Ali Shah, "The Unity of Horizons or Variety of Horizons" (moonsighting fiqh; mentions prayer times only as an analogy) | no |
| `faq_pt.html` | 20030629145054 | The 2003 FAQ: see the faq_pt part of §8 | PT |
| `how-we.html` | 20111124161453 | The 2011 method: see §8.1 | PT |
| `pray.php` | 20111017162540 | The 2011 calculator: see §8.2 | PT |

---

## 9. Reading-status checkpoint (2026-09-14 08:25). Supersedes the "how read" claims in §1 until §10 is written.
The owner's rule is that every page is read at 100%, either in full or as a full diff against a base page. Some of the earlier reads above used scripted sweeps, head, or keyword extracts. Those pages are being re-read in full, and their notes go to `site-reading/readnotes/`:

| Scope | Reader output (when done) |
|---|---|
| Reports 1429–1431 (36) | `readnotes/reports-1429-1431.md` |
| Reports 1435, 1436, 1438 (36) + 1438rmd query duplicate diff | `readnotes/reports-1435-1438.md` |
| Reports 1439–1440 (24) + 1439zhj query duplicate diff | `readnotes/reports-1439-1440.md` |
| Reports 1441–1442 (24) | `readnotes/reports-1441-1442.md` |
| Reports 1443–1444 (24) + 1443rmd query duplicate diff | `readnotes/reports-1443-1444.md` |
| Reports 1445–1448 (48) + 1447rmd query duplicate diff | `readnotes/reports-1445-1448.md` |
| Gregorian calendar (434, full diff), index.cgi (409, full diff vs home), FCNA (6, full diff), praytable (7 full), ramadan-eid/visibility (+ duplicate diffs) | `readnotes/calendars-indexcgi-fcna-dups.md` |
| 19 remaining site pages, 11 articles, 63 dont/ pages | `readnotes/site-pages-reread.md` |
| All 9 JS files (fully, via fold) | `readnotes/js-files.md` |
| All 51 Wayback captures and versions + 3 full version-diff files | `readnotes/wayback-captures.md` |
| HTML comments and inline scripts of all 1,367 raw pages (dropped by html2text; deduped to 523 blocks) | read by the site agent; notes in §10 |

**Already read in full by this agent** (Read tool, every line including the FORMS and LINKS sections):
- how-we.html, faq_pt.html, pray.php, about-us.html, articles.html, lectures.html, mosques.html
- moon.html, index.html, faq_ms.html (3 consecutive ranges), mcw.html, morocco-meeting.html
- links.html, countries.html, how-countries.html, faq_qd.html, qibla.html, 1447rmd.html
- actual-saudi-dates.pdf (text), 1444HijriCalendar.pdf (text)

The bare-host copies: all 560 text files were diffed against their www copies. The complete diff is 2 lines (http→https links in articles/2eclipses and faq_ms).

## 10. HTML comments and inline scripts (hidden from the rendered text), read in full
**Source and coverage:**
- The source is `site-reading/readnotes/html-comments-and-inline-scripts.fold.txt`: 6,385 lines, 523 distinct comment and script blocks, drawn from all 1,367 raw HTML files (live www and bare-host copies plus the Wayback captures; the index.cgi homepage copies are excluded as identical to `/`; style blocks omitted).
- **Read how:** full, every line, in consecutive Read ranges 1–700, 701–1400, 1401–2100, 2101–2800, 2801–3500, 3501–4200, 4201–4900, 4901–5200 and 5201–6385.
- Blocks are deduplicated by exact content, and each carries the list of files it appears in. Reading each distinct block once therefore covers every file's comments and scripts.
- Google Maps API keys found in three blocks (`qibla.html`; the 2017 and 2020 `pray.php` captures) were redacted in the scratch file. Apple MapKit JWTs were redacted at extraction. Neither is reproduced anywhere.
- Personal e-mail addresses and phone numbers were not copied. They appear in the `mcw.html` comments (members' contact details) and the home-page comments (advertisers).

**What the comments add:**
- **The site was maintained until spring 2024.**
  - Hidden bookkeeping comments on `/` and `moon.html` record paid text and DOFollow ad links, e.g. "Paid up to 1/23/2024 DOFollow link for $240 for one year". The latest paid-until date is "Paid up to 5/8/2024 by Invoice 1279". There are reminders "Sent reminder on 7/13/2023".
  - This fits the "Updated March 10, 2024" line and the report stop in April 2024 (§1.3). The site was partly funded by paid SEO links.
- `/` comment: "Near Muharram of every year, Change index.cgi and upload <<NOT REQUIRED ANYMORE IN ASCII THEN CHMOD>>". This explains the `index.cgi` loop: a legacy date script.
- **Prayer-time related:**
  - how-we.html 2011 and 2014 captures and the faq_pt 2012 capture: "Fajr Isha in UK Booklet URL is on this page and also on Question F10" and "Fajr Isha in UK Booklet URL used two times on this page and one time on Question F10". This is Shaukat's own editing note that the pages linked the UK Fajr/Isha booklet (the Hizbul Ulama / Miftahi book, documents.md A1).
  - No formula, coefficient or hidden method text exists in any comment or script.
  - The live `pray.php` loads `https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js`, `assets/js/tz.js`, `jquery.min.js`, `apple_map.js`, `bootstrap.min.js` and `index.js`. All computation is server-side in `praytable.php`.
  - The 2011–2017 `pray.php` used Google Maps, `http://api.geonames.org/timezoneJSON?…&username=skyprayers` for time zones (the "skyprayers" account ties the tool to Bu-khamsin's Sky Prayers app), MaxMind GeoIP as a fallback, and a New York default location.
  - 2011: `alert("Sorry the external Timezone service doesn't work right now. All times are shown in GMT now")`.
  - 2015/2017: `document.getElementById('timeZone').value ="GMT"`.
  - The Ja'fari index still disables "both Asr".
  - The 2025 captures are a bot-check (`wsidchk`) interstitial.
- **Qibla constants differ between tools:** `qibla.html` calculator `latk = 21.4225`, `longk = 39.8264`; map line (`qibla.html`, `pray.php`, `apple_map.js`) `21.423333, 39.823333`.
- **FCNA/UQ:** `fcna-uq-calendar.html` hidden note: "Checked up to Muharram 1452. Beyond that, we are still checking with more authentic sources of Ummul-Qura calendar."
- **Hidden country list in `1436muh.html`:**
  - "USA (FCNA/ISNA …) The criteria are Moon must be born before Sunset in Makkah, and moonset after sunset in Makkah. These criteria are not applicable for Eid-al-Adha, for which it is relied on Saudi Announcement of Hajj."
  - "UK (Follow Saudi) [Coordination Committee of Major Islamic Centres and Mosques of London]"
  - "UK (30 days completion) [Wifaaqul ulama), (Ahle Sunnat Wal Jamaat], OR (Sighting from countries east of UK)]"
  - "Hijri Committee of India, a small minority in India (The day after conjunction is the first day of the month)".
- **UK people in hidden photo captions:**
  - "Photo is provided by MCW member Mr Ayyub Patel from Dewsbury, UK" (`1443jmo`, `1443rba`, `1443rbt`)
  - "The rising moon (waning moon) over Derby Street, Bolton, UK … 27th of July 2022" (Juned Patel, `1444rba`)
  - a commented-out MCW member "Shezad Ishfaq, Sheffield, Yorkshire" (`mcw.html`)
- `mcw.html` comments hold each member's join year, birth year, e-mail and phone. Markers include "NonMuslim" (Jim Stamm, Ruth Jeffery) and "Shi'aa" (Javad Torabinejad). Not copied.
- **Document metadata:**
  - `calendars/islamic-calendar-for-uk.html` (2010): `<o:Author>Zareen</o:Author> <o:LastAuthor>Khalid</o:LastAuthor> … <o:LastSaved>2010-09-26…`
  - `unityofhorizons.htm` (2006): `<o:Author>shah</o:Author> <o:LastAuthor>Shaukat</o:LastAuthor>`
  - Zareen Shaukat also appears in `fun-time.html`. Content was prepared by Khalid Shaukat and family, in MS Word or Excel.
- **1999 `index.html`:**
  - scrolling banner "I saw the crescent in binocular at 7:45pm EDST on September 10 in Washington DC area, and could not see it with the naked eye…"
  - comment "* In Cape Town South Africa, the moon visibility has been experienced better than most placesin the world. This may be because of low aerosol particles in that region."
- **Other hidden items:**
  - `articles.html` hidden entries: "Calendar in Islam by Ali Manikfan", "Misinterpreted Hadhees by Ali Manikfan" (PDFs, 404 live)
  - `eclipses.html` hidden: "Next Lunar & Solar Eclipses in Ramadan will not come until 2024 CE"
  - `1444zhj.html` hidden: "On the 29th of ZulQadh - Sunday, June18, 2023 we have received naked eye moon sighting reports from multiple locations across the states of Texas, Arizona and California."
- Remaining blocks are layout markers, menu and ad-script includes (Google AdSense `ca-pub-…`), and the fourmilab perigee calculator code (Meeus coefficients for lunar perigee and apogee, unrelated to prayer times).

## 11. Attribute text (alt, title, value, meta content), read in full
**Source and coverage:** `site-reading/readnotes/html-attribute-text.fold.txt` holds 661 lines: 626 distinct (tag, attribute, text) triples from all 1,367 raw HTML files, deduplicated with file lists. It was read in full in two consecutive Read ranges, 1–416 and 417–661.

**What it adds:**
- **The `pray.php` method `<option value>`s are 0, 1, 2 and 3.** In menu order they are "Hanafi (Shafaq General)"=0, "Hanafi (Shafaq Abyad)"=1, "Shafi'i, Maaliki, Hanbali"=2 and "Jafriyyah (Ithna-Ashari)"=3. They are sent to `praytable.php` as `method=`. The 2011–2025 captures are the same.
- The 2011 `pray.php` has the image alt "sky prayers ad".
- **Page descriptions (meta content):**
  - how-we.html: "How Prayer times are calculated for Muslims by moonsighting.com described by Khalid Shaukat". The 2010–2014 wording was "How Prayer times are calculated for Muslims described by Khalid Shaukat".
  - 1999 shaukat.html: "He is a scientist/engineer involved in research work in moonsighting, Islamic calendar, prayer times, and qibla direction, since 1967."
  - 1999 prayer.html: "Prayer Schedule for Muslims, 5 times a day. This page gives information about the considerations required for prayer timings in light of Hadith and Fiqh. Also gives a link to get the prayer schedules".
- The home-page PayPal donate form posts to the site's Gmail account (not copied here).
- 2010 `uk-live.html` embeds a Zaplive player for "icouk" (Islamic Crescent Observation UK).
- The remaining triples are image captions (mosque and country names, crescent photo codes), SEO keywords and form defaults. There is no formula, coefficient or hidden method text.

## 12. Checkpoint (2026-09-14 13:25), after the two usage-limit interruptions
**Reader outputs complete on disk**, each noting how every file was read (full, or full diff against a named base):

| File | Contents |
|---|---|
| `readnotes/reports-1429-1431.md` | 36/36, full |
| `readnotes/reports-1435-1438.md` | 37/37 (36 reports + 1438fcna) + 1438rmd duplicate diff, full; topic sections 2.1–2.7 |
| `readnotes/reports-1439-1440.md` | 26/26 (+1439fcna, 1440fcna) + 1439zhj duplicate diff |
| `readnotes/reports-1441-1442.md` | 26/26, saved from the reader's reply |
| `readnotes/reports-1443-1444.md` | 25/25 + 1443rmd duplicate diff, saved from the reader's reply |
| `readnotes/reports-1445-1448.md` | 48/48 (38 full, 9 templates as full diff against 1445zhj) + 1447rmd duplicate diff |
| `readnotes/calendars-indexcgi-fcna-dups.md` | 434 calendar pages (base full + full diffs), 409 index.cgi (full diffs against home), 6 FCNA, 7 praytable, 2 duplicates |
| `readnotes/site-pages-reread.md` | 19 pages + 11 articles + 63 dont/, full |
| `readnotes/js-files.md` | 9 JS files, full via fold; all byte-identical to the bare-host copies |
| `readnotes/wayback-captures.md` | all 50 Wayback captures and versions, full |

**Read in full by this agent since §9:**
- `readnotes/diff-praphp-versions-full.txt` (54 lines)
- `readnotes/diff-howwe-versions-full.txt` (301 lines, untruncated; confirms §8.1)
- `readnotes/html-comments-and-inline-scripts.fold.txt` (§10)
- `readnotes/html-attribute-text.fold.txt` (§11)

**Remaining:** `readnotes/diff-faqpt-versions-full.txt` (1,023 lines), then the final consolidation (§13).

## 13. Final consolidation: reading complete (2026-09-14)
All 1,186 unique HTTP-200 paths are read, plus the 50 Wayback captures and versions, the hidden HTML comments and inline scripts, and the attribute text. Each is read in full, or as a full diff against a named base. The per-page ledger is in §14 and in `site-reading/readnotes/ledger.tsv`.

Final read, faq_pt version history: `readnotes/diff-faqpt-versions-full.txt`, 1,023 lines, read in full in four consecutive ranges.
The index.cgi homepage copies without a text file (9 of them) were diffed raw against `index.html` in `readnotes/diff-indexcgi-notext-vs-home-raw.txt`, 54 lines, read in full. Each differs only in the Cloudflare email token.

### 13.1 Corrections to earlier sections (this section wins where they differ)
- **§1.1 "Read how" column.** It is superseded by §14. The scripted sweeps listed there were redone as full reads or full diffs.
- **§1.3, reports.**
  - The last page with actual sighting reports is `1445shw.html` (latest reports 9 April 2024). Even that page's summary line was never filled in.
  - The last fully completed report is `1445rmd.html`, and the last UK report is on `1445shb.html` (10 Feb 2024).
  - `1436rmd`, `1436shw`, `1436zqd` and `1436zhj` are stubs ("Sighting info is lost").
  - `1438rba` ends at an empty date heading.
  - Pages were pre-generated up to `1448zhj` (May 2027).
- **§2.3, the calculator in practice** (readnotes/js-files.md, calendars-indexcgi-fcna-dups.md):
  - The Apple MapKit tokens for www and the bare host expired on 2023-08-01. The live map, and the flow that requests the table, may fail.
  - The time zone sent is the browser's own unless the pin is dragged. If geolocation is denied, the Madinah default coordinates go out with the viewer's own zone.
  - `praytable.php` returns local clock times, including DST (the 2020 Chicago file jumps on Mar 08 and Nov 01).
  - It gives no method text, and an unknown zone returns headers but no rows.
- **§8.3, additions to the faq_pt history:**
  - 2003–2008: "Why don't you have an on-line option to calculate prayer times…?" was answered with "10 reasons" why not.
  - 2012: "We are in the process of putting it online." `pray.php` already existed in Oct 2011.
  - 2008 F3: "Get the most accurate Prayer Times from Moonsighting.com by sending email."
  - 2008: Blackburn "carried out the Mushahada during a complete year". From 2012: "from September 1987 to August 1988 … covered almost entire year with a few months missing."
  - 2012–2017 S3: "the sunset would only be delayed by a maximum of 8 minutes" at aircraft altitude. From 2020, 5.3: "The altitude from mean sea level does not affect sunrise/sunset time."
  - 2017 polar answer: "The answer is simpler than what you may think … we can calculate those two points and determine Prayer times around those two known times". Replaced by 2021 with the 0.1° Aqrabul-Bilaad iteration.
  - 2003, other bodies' angles: "15°/15° (ISNA), 18°/17° (World Islamic League), 18°/18° (Karachi), 19°/17° (Umm al-Qura), and 19.5°/90 minutes (Egypt)". Also: "Those observations revealed to us that Fajr time starts when the sun is 13.5° to 14° below horizon."

### 13.2 Findings the full re-read added
- **No page on the live site or in the archive states Shaukat's Fajr/Isha formula or coefficients.**
  - Nor does any page mention the London Unified Prayer Timetable, or name a UK mosque or organisation that uses moonsighting.com prayer times.
  - Across all 1,186 paths, the prayer-time method appears only in how-we.html, faq_pt.html, 3books.html (the booklet blurb), ever-wonder.html (a passing remark) and the archived prayer.html, faq_ps.html and prayer-french.html.
  - The 2010–2011 `others.html` testimonials from Birmingham and Manchester are individuals requesting times by e-mail.
- **When the Islamic day begins (relevant to the app's day model):**
  - The site's calendars say "Hijri DATES BEGIN AT SUNSET THE PRECEDING EVENING" (FCNA pages) and "ISLAMIC DATES BEGIN AT SUNSET OF PRECEDING EVENING" (important-dates).
  - Reports quote Wifaqul Ulama: "Keep in mind that in Islam, the new day starts at sunset" (1440jmt).
  - Oxford: "Sunday 3 April (beginning from Maghrib, 2 April)" (1443rmd).
  - A hosted guest article contradicts this: "the day starts at Fajr and not at Maghrib" (articles/hilal-manaazil.html).
- **How UK bodies set months, as reported on the site:**
  - **Wifaqul Ulama** decides from the UK or a "designated zone for United Kingdom which also includes Morocco" (1442muh), with South Africa (1441rbt).
  - **The London Coordination Committee** varies: "UK (Calculations)" (1431rmd); "Follow Saudi" (1435, 1438zhj); "Some Follow Saudi" (1436muh); and on a sighting date apart from Saudi for Eid al-Fitr 1438 (1438shw).
  - Its 2020 Ramadan list names London Central Mosque, East London Mosque, Jamiat e Ulama Britain, Finsbury Park, and others (1441rmd).
  - **The Central Moonsighting Committee of GB** (Dar-ul-Uloom Bury, Jamiat-ul-Ulama Britain, Hizbul-Ulama UK) followed Saudi in 1431 (1431shw, 1431zhj).
  - The site called the Birmingham sighting claim for Ramadan 1431 by these bodies "absurdity" (1431rmd).
  - 1443rmd editorial: "according to the data produced by HMNAO … the moon was actually scientifically impossible to be seen in Saudi, and indeed the UK … on Friday 1 April."
- **Data quality of the site's own pages:**
  - The FCNA grids carry wrong Gregorian labels ("NOV 2016" repeated; 2021 printed for 2022) and a Shawwal 18/29 pairing error.
  - important-dates disagrees with the FCNA table in 11 entries.
  - ramadan-eid gives Ramadan 1454 as Dec 4, before the 22 Dec conjunction it states, and repeats 1455's years for 1456.
  - Reports hold many pasted-text, wrong-weekday and heading-versus-body contradictions (see the readnotes).
  - The site's dates and tables need independent checking before any use.
- **Operations:**
  - Paid SEO ad links were kept until May 2024 (§10).
  - Since 2025 the site has sat behind a Cloudflare bot-check (Wayback `pray.php` captures).
  - The last substantive how-we text change was Sept 2021; the last faq_pt change was Aug 2020 (live "Updated August 25, 2020").

### 13.3 Pages that could not be read, and why
- **404 live with no usable archive, or out of scope:**
  - reports 1420–1428, 1432 (except a 2010 capture of 1432muh, not fetched), 1433, 1434, 1437
  - `narvik.html` (the Wayback capture is itself a 404)
  - `prayer.php` (Wayback 404)
  - `timezone.html` and `calc-sighting_init.html` (the captures are empty)
- **Not fetched by this agent, by instruction:** the prayer.html history (64 versions, lead) and all PDFs and documents (notes/documents.md).
- **Bot-protected:** `pray.php` captures from 2025 are Cloudflare interstitials. The live copy in the crawl is readable.
- **Deliberately not reproduced:** Apple MapKit JWTs; the Google Maps and Geolocation keys; members' and advertisers' e-mails and phone numbers (`mcw.html` and home-page comments); all prayer times (praytable output).

## 14. Per-page ledger (how each page was read)
"full" means every line of the page's text copy, including FORMS and LINKS, was read with the Read tool. "full diff vs X" means page X was read in full and the complete unified diff of this page against X was read line by line. The notes column names where the findings live.
Bare-host `moonsighting.com/…` copies are the same pages. The complete diff of all 560 text copies against www is 2 lines (§9).

### 14.1 Wayback captures (all 404 live except the method-page versions)
Read by the Wayback reader in full: `readnotes/wayback-captures.md`, 50 rows.
Most were also read by this agent (§1.4, §2.4, §8).
The how-we, faq_pt and pray.php version chains were also read as complete sentence diffs: `readnotes/diff-howwe-versions-full.txt`, `diff-faqpt-versions-full.txt`, `diff-praphp-versions-full.txt`.

| Capture | How read |
|---|---|
| 19990218052741__home.html | full (wayback reader; version files also via full diff chain) |
| 19990221195144__prayer.html | full (wayback reader; version files also via full diff chain) |
| 19990423015634__faq_ps.html | full (wayback reader; version files also via full diff chain) |
| 19991010020601__index.html | full (wayback reader; version files also via full diff chain) |
| 19991010105732__shaukat.html | full (wayback reader; version files also via full diff chain) |
| 20000817190618__methods.html | full (wayback reader; version files also via full diff chain) |
| 20000817190704__elementofplace.html | full (wayback reader; version files also via full diff chain) |
| 20010210073214__faqs.html | full (wayback reader; version files also via full diff chain) |
| 20010302151201__britain.html | full (wayback reader; version files also via full diff chain) |
| 20030629144846__ask.html | full (wayback reader; version files also via full diff chain) |
| 20030629145054__faq_pt.html | full (wayback reader; version files also via full diff chain) |
| 20030808173032__members.html | full (wayback reader; version files also via full diff chain) |
| 20050211072851__1426uk_and_e.html | full (wayback reader; version files also via full diff chain) |
| 20050211072942__1427uk_and_e.html | full (wayback reader; version files also via full diff chain) |
| 20050211073047__1428uk_and_e.html | full (wayback reader; version files also via full diff chain) |
| 20050211073459__2007uk_and_e.html | full (wayback reader; version files also via full diff chain) |
| 20050215023900__2005uk_and_e.html | full (wayback reader; version files also via full diff chain) |
| 20050407070555__2006uk_and_e.html | full (wayback reader; version files also via full diff chain) |
| 20061119060411__unityofhorizons.htm | full (wayback reader; version files also via full diff chain) |
| 20061119060543__timezone.html | full (wayback reader; version files also via full diff chain) |
| 20080223154632__calc-sighting_init.html | full (wayback reader; version files also via full diff chain) |
| 20100305133134__uk-live.html | full (wayback reader; version files also via full diff chain) |
| 20100827001844__prayer-french.html | full (wayback reader; version files also via full diff chain) |
| 20101024041703__calendars__islamic-calendar-for-uk.html | full (wayback reader; version files also via full diff chain) |
| 20110705071359__others.html | full (wayback reader; version files also via full diff chain) |
| 20111017162540__pray.php | full (wayback reader; version files also via full diff chain) |
| 20111124161453__how-we.html | full (wayback reader; version files also via full diff chain) |
| 20160305183825__calculation-or-sighting.html | full (wayback reader; version files also via full diff chain) |
| 20160416161450__locate-mosques.html | full (wayback reader; version files also via full diff chain) |
| 20160509133711__praytable.php_Q_ | full (wayback reader; version files also via full diff chain) |
| 20170529231738__compare.html | full (wayback reader; version files also via full diff chain) |
| 20200905140754__monthly-reports.html | full (wayback reader; version files also via full diff chain) |
| versions/20081119135740__faq_pt.html | full (wayback reader; version files also via full diff chain) |
| versions/20121205081238__faq_pt.html | full (wayback reader; version files also via full diff chain) |
| versions/20140209182423__how-we.html | full (wayback reader; version files also via full diff chain) |
| versions/20150318071343__pray.php | full (wayback reader; version files also via full diff chain) |
| versions/20160723193950__how-we.html | full (wayback reader; version files also via full diff chain) |
| versions/20170623060258__pray.php | full (wayback reader; version files also via full diff chain) |
| versions/20171124133208__faq_pt.html | full (wayback reader; version files also via full diff chain) |
| versions/20180909185334__how-we.html | full (wayback reader; version files also via full diff chain) |
| versions/20200114093914__how-we.html | full (wayback reader; version files also via full diff chain) |
| versions/20200114093914__pray.php | full (wayback reader; version files also via full diff chain) |
| versions/20210924153617__faq_pt.html | full (wayback reader; version files also via full diff chain) |
| versions/20220517141430__how-we.html | full (wayback reader; version files also via full diff chain) |
| versions/20240213100829__how-we.html | full (wayback reader; version files also via full diff chain) |
| versions/20250304071531__how-we.html | full (wayback reader; version files also via full diff chain) |
| versions/20250304085651__pray.php | full (wayback reader; version files also via full diff chain) |
| versions/20250311175424__faq_pt.html | full (wayback reader; version files also via full diff chain) |
| versions/20251016224226__pray.php | full (wayback reader; version files also via full diff chain) |
| versions/20260502180530__how-we.html | full (wayback reader; version files also via full diff chain) |

### 14.2 Live-site paths (1,186 unique HTTP-200 paths)
| Path | How read | Notes |
|---|---|---|
| `/` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/1429jmo.html` | full | readnotes/reports-1429-1431.md |
| `/1429jmt.html` | full | readnotes/reports-1429-1431.md |
| `/1429muh.html` | full | readnotes/reports-1429-1431.md |
| `/1429rba.html` | full | readnotes/reports-1429-1431.md |
| `/1429rbt.html` | full | readnotes/reports-1429-1431.md |
| `/1429rjb.html` | full | readnotes/reports-1429-1431.md |
| `/1429rmd.html` | full | readnotes/reports-1429-1431.md |
| `/1429sfr.html` | full | readnotes/reports-1429-1431.md |
| `/1429shb.html` | full | readnotes/reports-1429-1431.md |
| `/1429shw.html` | full | readnotes/reports-1429-1431.md |
| `/1429zhj.html` | full | readnotes/reports-1429-1431.md |
| `/1429zqd.html` | full | readnotes/reports-1429-1431.md |
| `/1430jmo.html` | full | readnotes/reports-1429-1431.md |
| `/1430jmt.html` | full | readnotes/reports-1429-1431.md |
| `/1430muh.html` | full | readnotes/reports-1429-1431.md |
| `/1430rba.html` | full | readnotes/reports-1429-1431.md |
| `/1430rbt.html` | full | readnotes/reports-1429-1431.md |
| `/1430rjb.html` | full | readnotes/reports-1429-1431.md |
| `/1430rmd.html` | full | readnotes/reports-1429-1431.md |
| `/1430sfr.html` | full | readnotes/reports-1429-1431.md |
| `/1430shb.html` | full | readnotes/reports-1429-1431.md |
| `/1430shw.html` | full | readnotes/reports-1429-1431.md |
| `/1430zhj.html` | full | readnotes/reports-1429-1431.md |
| `/1430zqd.html` | full | readnotes/reports-1429-1431.md |
| `/1431jmo.html` | full | readnotes/reports-1429-1431.md |
| `/1431jmt.html` | full | readnotes/reports-1429-1431.md |
| `/1431muh.html` | full | readnotes/reports-1429-1431.md |
| `/1431rba.html` | full | readnotes/reports-1429-1431.md |
| `/1431rbt.html` | full | readnotes/reports-1429-1431.md |
| `/1431rjb.html` | full | readnotes/reports-1429-1431.md |
| `/1431rmd.html` | full | readnotes/reports-1429-1431.md |
| `/1431sfr.html` | full | readnotes/reports-1429-1431.md |
| `/1431shb.html` | full | readnotes/reports-1429-1431.md |
| `/1431shw.html` | full | readnotes/reports-1429-1431.md |
| `/1431zhj.html` | full | readnotes/reports-1429-1431.md |
| `/1431zqd.html` | full | readnotes/reports-1429-1431.md |
| `/1435jmo.html` | full | readnotes/reports-1435-1438.md |
| `/1435jmt.html` | full | readnotes/reports-1435-1438.md |
| `/1435muh.html` | full | readnotes/reports-1435-1438.md |
| `/1435rba.html` | full | readnotes/reports-1435-1438.md |
| `/1435rbt.html` | full | readnotes/reports-1435-1438.md |
| `/1435rjb.html` | full | readnotes/reports-1435-1438.md |
| `/1435rmd.html` | full | readnotes/reports-1435-1438.md |
| `/1435sfr.html` | full | readnotes/reports-1435-1438.md |
| `/1435shb.html` | full | readnotes/reports-1435-1438.md |
| `/1435shw.html` | full | readnotes/reports-1435-1438.md |
| `/1435zhj.html` | full | readnotes/reports-1435-1438.md |
| `/1435zqd.html` | full | readnotes/reports-1435-1438.md |
| `/1436jmo.html` | full | readnotes/reports-1435-1438.md |
| `/1436jmt.html` | full | readnotes/reports-1435-1438.md |
| `/1436muh.html` | full | readnotes/reports-1435-1438.md |
| `/1436rba.html` | full | readnotes/reports-1435-1438.md |
| `/1436rbt.html` | full | readnotes/reports-1435-1438.md |
| `/1436rjb.html` | full | readnotes/reports-1435-1438.md |
| `/1436rmd.html` | full | readnotes/reports-1435-1438.md |
| `/1436sfr.html` | full | readnotes/reports-1435-1438.md |
| `/1436shb.html` | full | readnotes/reports-1435-1438.md |
| `/1436shw.html` | full | readnotes/reports-1435-1438.md |
| `/1436zhj.html` | full | readnotes/reports-1435-1438.md |
| `/1436zqd.html` | full | readnotes/reports-1435-1438.md |
| `/1438fcna.html` | full (reports reader) + full diff vs 1438fcna | readnotes/reports-1435-1438.md + calendars-indexcgi-fcna-dups.md |
| `/1438jmo.html` | full | readnotes/reports-1435-1438.md |
| `/1438jmt.html` | full | readnotes/reports-1435-1438.md |
| `/1438muh.html` | full | readnotes/reports-1435-1438.md |
| `/1438rba.html` | full | readnotes/reports-1435-1438.md |
| `/1438rbt.html` | full | readnotes/reports-1435-1438.md |
| `/1438rjb.html` | full | readnotes/reports-1435-1438.md |
| `/1438rmd.html` | full | readnotes/reports-1435-1438.md |
| `/1438rmd.html?mc_cid=3eea635ad3&mc_eid=cc4f6854b4` | full diff vs /1438rmd.html (only SOURCE line differs) | readnotes/reports-1435-1438.md |
| `/1438sfr.html` | full | readnotes/reports-1435-1438.md |
| `/1438shb.html` | full | readnotes/reports-1435-1438.md |
| `/1438shw.html` | full | readnotes/reports-1435-1438.md |
| `/1438zhj.html` | full | readnotes/reports-1435-1438.md |
| `/1438zqd.html` | full | readnotes/reports-1435-1438.md |
| `/1439fcna.html` | full (reports reader) + full diff vs 1438fcna | readnotes/reports-1439-1440.md + calendars-indexcgi-fcna-dups.md |
| `/1439jmo.html` | full | readnotes/reports-1439-1440.md |
| `/1439jmt.html` | full | readnotes/reports-1439-1440.md |
| `/1439muh.html` | full | readnotes/reports-1439-1440.md |
| `/1439rba.html` | full | readnotes/reports-1439-1440.md |
| `/1439rbt.html` | full | readnotes/reports-1439-1440.md |
| `/1439rjb.html` | full | readnotes/reports-1439-1440.md |
| `/1439rmd.html` | full | readnotes/reports-1439-1440.md |
| `/1439sfr.html` | full | readnotes/reports-1439-1440.md |
| `/1439shb.html` | full | readnotes/reports-1439-1440.md |
| `/1439shw.html` | full | readnotes/reports-1439-1440.md |
| `/1439zhj.html` | full | readnotes/reports-1439-1440.md |
| `/1439zhj.html?_e_pi_=7%2CPAGE_ID10%2C7730956992` | full diff vs /1439zhj.html (only SOURCE line differs) | readnotes/reports-1439-1440.md |
| `/1439zqd.html` | full | readnotes/reports-1439-1440.md |
| `/1440fcna.html` | full (reports reader) + full diff vs 1438fcna | readnotes/reports-1439-1440.md + calendars-indexcgi-fcna-dups.md |
| `/1440jmo.html` | full | readnotes/reports-1439-1440.md |
| `/1440jmt.html` | full | readnotes/reports-1439-1440.md |
| `/1440muh.html` | full | readnotes/reports-1439-1440.md |
| `/1440rba.html` | full | readnotes/reports-1439-1440.md |
| `/1440rbt.html` | full | readnotes/reports-1439-1440.md |
| `/1440rjb.html` | full | readnotes/reports-1439-1440.md |
| `/1440rmd.html` | full | readnotes/reports-1439-1440.md |
| `/1440sfr.html` | full | readnotes/reports-1439-1440.md |
| `/1440shb.html` | full | readnotes/reports-1439-1440.md |
| `/1440shw.html` | full | readnotes/reports-1439-1440.md |
| `/1440zhj.html` | full | readnotes/reports-1439-1440.md |
| `/1440zqd.html` | full | readnotes/reports-1439-1440.md |
| `/1441fcna.html` | full (reports reader) + full diff vs 1438fcna | readnotes/reports-1441-1442.md + calendars-indexcgi-fcna-dups.md |
| `/1441jmo.html` | full | readnotes/reports-1441-1442.md |
| `/1441jmt.html` | full | readnotes/reports-1441-1442.md |
| `/1441muh.html` | full | readnotes/reports-1441-1442.md |
| `/1441rba.html` | full | readnotes/reports-1441-1442.md |
| `/1441rbt.html` | full | readnotes/reports-1441-1442.md |
| `/1441rjb.html` | full | readnotes/reports-1441-1442.md |
| `/1441rmd.html` | full | readnotes/reports-1441-1442.md |
| `/1441sfr.html` | full | readnotes/reports-1441-1442.md |
| `/1441shb.html` | full | readnotes/reports-1441-1442.md |
| `/1441shw.html` | full | readnotes/reports-1441-1442.md |
| `/1441zhj.html` | full | readnotes/reports-1441-1442.md |
| `/1441zqd.html` | full | readnotes/reports-1441-1442.md |
| `/1442fcna.html` | full (reports reader) + full diff vs 1438fcna | readnotes/reports-1441-1442.md + calendars-indexcgi-fcna-dups.md |
| `/1442jmo.html` | full | readnotes/reports-1441-1442.md |
| `/1442jmt.html` | full | readnotes/reports-1441-1442.md |
| `/1442muh.html` | full | readnotes/reports-1441-1442.md |
| `/1442rba.html` | full | readnotes/reports-1441-1442.md |
| `/1442rbt.html` | full | readnotes/reports-1441-1442.md |
| `/1442rjb.html` | full | readnotes/reports-1441-1442.md |
| `/1442rmd.html` | full | readnotes/reports-1441-1442.md |
| `/1442sfr.html` | full | readnotes/reports-1441-1442.md |
| `/1442shb.html` | full | readnotes/reports-1441-1442.md |
| `/1442shw.html` | full | readnotes/reports-1441-1442.md |
| `/1442zhj.html` | full | readnotes/reports-1441-1442.md |
| `/1442zqd.html` | full | readnotes/reports-1441-1442.md |
| `/1443fcna.html` | full (reports reader) + full diff vs 1438fcna | readnotes/reports-1443-1444.md + calendars-indexcgi-fcna-dups.md |
| `/1443jmo.html` | full | readnotes/reports-1443-1444.md |
| `/1443jmt.html` | full | readnotes/reports-1443-1444.md |
| `/1443muh.html` | full | readnotes/reports-1443-1444.md |
| `/1443rba.html` | full | readnotes/reports-1443-1444.md |
| `/1443rbt.html` | full | readnotes/reports-1443-1444.md |
| `/1443rjb.html` | full | readnotes/reports-1443-1444.md |
| `/1443rmd.html` | full | readnotes/reports-1443-1444.md |
| `/1443rmd.html?fbclid=IwAR1g6XlT2B43HV0av0J-onMZAPx1vsFMd-1-w7WwItLfQeGijk-OLRwjLa0` | full diff vs /1443rmd.html (only SOURCE line differs) | readnotes/reports-1443-1444.md |
| `/1443sfr.html` | full | readnotes/reports-1443-1444.md |
| `/1443shb.html` | full | readnotes/reports-1443-1444.md |
| `/1443shw.html` | full | readnotes/reports-1443-1444.md |
| `/1443zhj.html` | full | readnotes/reports-1443-1444.md |
| `/1443zqd.html` | full | readnotes/reports-1443-1444.md |
| `/1444HijriCalendar.pdf` | full (extracted text, site agent) | site-reading/*.pdf.txt; notes/site.md §7 |
| `/1444jmo.html` | full | readnotes/reports-1443-1444.md |
| `/1444jmt.html` | full | readnotes/reports-1443-1444.md |
| `/1444muh.html` | full | readnotes/reports-1443-1444.md |
| `/1444rba.html` | full | readnotes/reports-1443-1444.md |
| `/1444rbt.html` | full | readnotes/reports-1443-1444.md |
| `/1444rjb.html` | full | readnotes/reports-1443-1444.md |
| `/1444rmd.html` | full | readnotes/reports-1443-1444.md |
| `/1444sfr.html` | full | readnotes/reports-1443-1444.md |
| `/1444shb.html` | full | readnotes/reports-1443-1444.md |
| `/1444shw.html` | full | readnotes/reports-1443-1444.md |
| `/1444zhj.html` | full | readnotes/reports-1443-1444.md |
| `/1444zqd.html` | full | readnotes/reports-1443-1444.md |
| `/1445jmo.html` | full | readnotes/reports-1445-1448.md |
| `/1445jmt.html` | full | readnotes/reports-1445-1448.md |
| `/1445muh.html` | full | readnotes/reports-1445-1448.md |
| `/1445rba.html` | full | readnotes/reports-1445-1448.md |
| `/1445rbt.html` | full | readnotes/reports-1445-1448.md |
| `/1445rjb.html` | full | readnotes/reports-1445-1448.md |
| `/1445rmd.html` | full | readnotes/reports-1445-1448.md |
| `/1445sfr.html` | full | readnotes/reports-1445-1448.md |
| `/1445shb.html` | full | readnotes/reports-1445-1448.md |
| `/1445shw.html` | full | readnotes/reports-1445-1448.md |
| `/1445zhj.html` | full | readnotes/reports-1445-1448.md |
| `/1445zqd.html` | full | readnotes/reports-1445-1448.md |
| `/1446jmo.html` | full | readnotes/reports-1445-1448.md |
| `/1446jmt.html` | full | readnotes/reports-1445-1448.md |
| `/1446muh.html` | full | readnotes/reports-1445-1448.md |
| `/1446rba.html` | full | readnotes/reports-1445-1448.md |
| `/1446rbt.html` | full | readnotes/reports-1445-1448.md |
| `/1446rjb.html` | full | readnotes/reports-1445-1448.md |
| `/1446rmd.html` | full diff vs /1445zhj.html (template) | readnotes/reports-1445-1448.md |
| `/1446sfr.html` | full | readnotes/reports-1445-1448.md |
| `/1446shb.html` | full | readnotes/reports-1445-1448.md |
| `/1446shw.html` | full diff vs /1445zhj.html (template) | readnotes/reports-1445-1448.md |
| `/1446zhj.html` | full diff vs /1445zhj.html (template) | readnotes/reports-1445-1448.md |
| `/1446zqd.html` | full | readnotes/reports-1445-1448.md |
| `/1447jmo.html` | full | readnotes/reports-1445-1448.md |
| `/1447jmt.html` | full | readnotes/reports-1445-1448.md |
| `/1447muh.html` | full | readnotes/reports-1445-1448.md |
| `/1447rba.html` | full | readnotes/reports-1445-1448.md |
| `/1447rbt.html` | full | readnotes/reports-1445-1448.md |
| `/1447rjb.html` | full | readnotes/reports-1445-1448.md |
| `/1447rmd.html` | full diff vs /1445zhj.html (template) | readnotes/reports-1445-1448.md |
| `/1447rmd.html?utm_source=chatgpt.com` | full diff vs /1447rmd.html (only SOURCE line differs) | readnotes/reports-1445-1448.md |
| `/1447sfr.html` | full | readnotes/reports-1445-1448.md |
| `/1447shb.html` | full | readnotes/reports-1445-1448.md |
| `/1447shw.html` | full diff vs /1445zhj.html (template) | readnotes/reports-1445-1448.md |
| `/1447zhj.html` | full diff vs /1445zhj.html (template) | readnotes/reports-1445-1448.md |
| `/1447zqd.html` | full | readnotes/reports-1445-1448.md |
| `/1448jmo.html` | full | readnotes/reports-1445-1448.md |
| `/1448jmt.html` | full | readnotes/reports-1445-1448.md |
| `/1448muh.html` | full | readnotes/reports-1445-1448.md |
| `/1448rba.html` | full | readnotes/reports-1445-1448.md |
| `/1448rbt.html` | full | readnotes/reports-1445-1448.md |
| `/1448rjb.html` | full | readnotes/reports-1445-1448.md |
| `/1448rmd.html` | full diff vs /1445zhj.html (template) | readnotes/reports-1445-1448.md |
| `/1448sfr.html` | full | readnotes/reports-1445-1448.md |
| `/1448shb.html` | full | readnotes/reports-1445-1448.md |
| `/1448shw.html` | full diff vs /1445zhj.html (template) | readnotes/reports-1445-1448.md |
| `/1448zhj.html` | full diff vs /1445zhj.html (template) | readnotes/reports-1445-1448.md |
| `/1448zqd.html` | full | readnotes/reports-1445-1448.md |
| `/3books.html` | full | readnotes/site-pages-reread.md |
| `/about-us.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/actual-saudi-dates.pdf` | full (extracted text, site agent) | site-reading/*.pdf.txt; notes/site.md §7 |
| `/articles.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/articles/2eclipses.html` | full | readnotes/site-pages-reread.md |
| `/articles/chronology.html` | full | readnotes/site-pages-reread.md |
| `/articles/eid-on-4-days.html` | full | readnotes/site-pages-reread.md |
| `/articles/full-moon-on-eidul-adha.html` | full | readnotes/site-pages-reread.md |
| `/articles/hilal-manaazil.html` | full | readnotes/site-pages-reread.md |
| `/articles/inventions.html` | full | readnotes/site-pages-reread.md |
| `/articles/roleofislam.html` | full | readnotes/site-pages-reread.md |
| `/articles/significance%20of%20urjoonal-qadeem.html` | full | readnotes/site-pages-reread.md |
| `/articles/story-of-wise-man.html` | full | readnotes/site-pages-reread.md |
| `/articles/when-hijri-calendar.html` | full | readnotes/site-pages-reread.md |
| `/articles/why-islamic-dates-in-mess.html` | full | readnotes/site-pages-reread.md |
| `/assets/bootstrap/js/bootstrap.min.js` | full via fold | readnotes/js-files.md |
| `/assets/js/apple_map.js` | full via fold | readnotes/js-files.md |
| `/assets/js/index.js` | full via fold | readnotes/js-files.md |
| `/assets/js/jquery.min.js` | full via fold | readnotes/js-files.md |
| `/assets/js/tz.js` | full via fold | readnotes/js-files.md |
| `/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js` | full via fold | readnotes/js-files.md |
| `/countries.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/dilaram.html` | full | readnotes/site-pages-reread.md |
| `/dont/don_a.html` | full | readnotes/site-pages-reread.md |
| `/dont/don_b.html` | full | readnotes/site-pages-reread.md |
| `/dont/don_s.html` | full | readnotes/site-pages-reread.md |
| `/dont/don_t.html` | full | readnotes/site-pages-reread.md |
| `/dont/don_u.html` | full | readnotes/site-pages-reread.md |
| `/dont/don_v.html` | full | readnotes/site-pages-reread.md |
| `/dont/don_w.html` | full | readnotes/site-pages-reread.md |
| `/dont/don_x.html` | full | readnotes/site-pages-reread.md |
| `/dont/don_y.html` | full | readnotes/site-pages-reread.md |
| `/dont/don_z.html` | full | readnotes/site-pages-reread.md |
| `/dont/donlang.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot0.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot1.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot10.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot11.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot12.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot13.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot14.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot15.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot16.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot17.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot18.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot19.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot2.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot20.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot21.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot3.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot4.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot5.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot6.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot7.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot8.html` | full | readnotes/site-pages-reread.md |
| `/dont/donot9.html` | full | readnotes/site-pages-reread.md |
| `/dont/donoto0.html` | full | readnotes/site-pages-reread.md |
| `/dont/donoto1.html` | full | readnotes/site-pages-reread.md |
| `/dont/donoto2.html` | full | readnotes/site-pages-reread.md |
| `/dont/donoto3.html` | full | readnotes/site-pages-reread.md |
| `/dont/donoto4.html` | full | readnotes/site-pages-reread.md |
| `/dont/donoto5.html` | full | readnotes/site-pages-reread.md |
| `/dont/donoto6.html` | full | readnotes/site-pages-reread.md |
| `/dont/donoto7.html` | full | readnotes/site-pages-reread.md |
| `/dont/donoto8.html` | full | readnotes/site-pages-reread.md |
| `/dont/dont0.html` | full | readnotes/site-pages-reread.md |
| `/dont/dont1.html` | full | readnotes/site-pages-reread.md |
| `/dont/dont10.html` | full | readnotes/site-pages-reread.md |
| `/dont/dont2.html` | full | readnotes/site-pages-reread.md |
| `/dont/dont3.html` | full | readnotes/site-pages-reread.md |
| `/dont/dont4.html` | full | readnotes/site-pages-reread.md |
| `/dont/dont5.html` | full | readnotes/site-pages-reread.md |
| `/dont/dont6.html` | full | readnotes/site-pages-reread.md |
| `/dont/dont7.html` | full | readnotes/site-pages-reread.md |
| `/dont/dont8.html` | full | readnotes/site-pages-reread.md |
| `/dont/dont9.html` | full | readnotes/site-pages-reread.md |
| `/dont/dontc0.html` | full | readnotes/site-pages-reread.md |
| `/dont/dontc1.html` | full | readnotes/site-pages-reread.md |
| `/dont/dontc2.html` | full | readnotes/site-pages-reread.md |
| `/dont/dontc3.html` | full | readnotes/site-pages-reread.md |
| `/dont/dontc4.html` | full | readnotes/site-pages-reread.md |
| `/dont/dontc5.html` | full | readnotes/site-pages-reread.md |
| `/dont/dontc6.html` | full | readnotes/site-pages-reread.md |
| `/dont/dontc7.html` | full | readnotes/site-pages-reread.md |
| `/dont/dontc8.html` | full | readnotes/site-pages-reread.md |
| `/dont/dontc9.html` | full | readnotes/site-pages-reread.md |
| `/eclipses.html` | full | readnotes/site-pages-reread.md |
| `/ever-wonder.html` | full | readnotes/site-pages-reread.md |
| `/evolution.html` | full | readnotes/site-pages-reread.md |
| `/faq_ms.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/faq_pt.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/faq_qd.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/fcna-uq-calendar.html` | full | readnotes/site-pages-reread.md |
| `/fun-time.html` | full | readnotes/site-pages-reread.md |
| `/globalcalendar.html` | full | readnotes/site-pages-reread.md |
| `/gregorian-calendar.php` | full | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1796` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1805` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1806` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1807` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1814` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1815` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1816` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1817` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1818` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1822` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1823` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1824` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1825` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1826` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1827` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1828` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1829` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1831` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1832` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1833` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1834` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1835` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1836` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1837` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1838` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1839` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1840` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1841` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1842` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1843` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1844` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1845` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1846` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1847` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1848` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1849` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1850` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1851` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1852` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1853` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1854` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1855` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1856` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1857` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1858` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1859` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1860` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1861` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1862` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1863` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1864` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1865` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1866` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1867` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1868` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1869` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1870` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1871` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1872` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1873` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1874` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1875` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1876` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1877` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1878` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1879` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1880` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1881` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1882` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1883` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1884` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1885` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1886` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1887` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1888` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1889` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1890` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1891` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1892` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1893` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1894` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1895` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1896` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1897` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1898` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1899` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1900` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1901` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1902` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1903` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1904` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1905` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1906` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1907` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1908` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1909` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1910` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1911` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1912` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1913` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1914` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1915` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1916` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1917` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1918` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1919` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1920` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1921` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1922` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1923` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1924` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1925` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1926` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1927` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1928` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1929` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1930` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1931` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1932` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1933` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1934` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1935` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1936` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1937` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1938` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1939` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1940` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1941` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1942` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1943` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1944` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1945` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1946` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1947` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1948` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1949` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1950` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1951` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1952` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1953` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1954` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1955` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1956` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1957` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1958` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1959` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1960` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1961` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1962` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1963` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1964` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1965` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1966` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1967` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1968` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1969` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1970` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1971` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1972` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1973` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1974` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1975` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1976` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1977` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1978` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1979` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1980` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1981` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1982` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1983` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1984` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1985` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1986` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1987` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1988` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1989` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1990` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1991` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1992` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1993` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1994` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1995` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1996` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1997` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1998` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?1999` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2000` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2001` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2002` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2003` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2004` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2005` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2006` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2007` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2008` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2009` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2010` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2011` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2012` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2013` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2014` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2015` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2016` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2017` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2018` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2019` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2020` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2021` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2022` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2023` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2024` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2025` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2026` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2027` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2028` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2029` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2030` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2031` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2032` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2033` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2034` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2035` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2036` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2037` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2038` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2039` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2040` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2041` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2042` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2043` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2044` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2045` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2046` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2047` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2048` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2049` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2050` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2051` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2052` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2053` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2054` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2055` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2056` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2057` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2058` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2059` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2060` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2061` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2062` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2063` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2064` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2065` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2066` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2067` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2068` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2069` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2070` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2071` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2072` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2073` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2074` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2075` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2076` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2077` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2078` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2079` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2080` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2081` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2082` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2083` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2084` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2085` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2086` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2087` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2088` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2089` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2090` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2091` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2092` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2093` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2094` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2095` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2096` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2097` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2098` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2099` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2100` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2101` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2102` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2103` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2104` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2105` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2106` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2107` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2108` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2109` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2110` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2111` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2112` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2113` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2114` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2115` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2116` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2117` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2118` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2119` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2120` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2121` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2122` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2123` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2124` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2125` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2126` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2127` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2128` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2129` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2130` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2131` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2132` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2133` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2134` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2135` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2136` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2137` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2138` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2139` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2140` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2141` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2142` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2143` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2144` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2145` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2146` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2147` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2148` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2149` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2150` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2151` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2152` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2153` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2154` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2155` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2156` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2157` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2158` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2159` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2160` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2161` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2162` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2163` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2164` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2165` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2166` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2167` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2168` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2169` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2170` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2171` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2172` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2173` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2174` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2175` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2176` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2177` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2178` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2179` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2180` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2181` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2182` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2183` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2184` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2185` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2186` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2187` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2188` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2189` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2190` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2191` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2192` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2193` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2194` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2195` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2196` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2197` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2198` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2199` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2200` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2201` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2202` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2203` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2204` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2205` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2206` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2207` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2208` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2209` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2210` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2211` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2212` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2213` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2214` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2215` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2216` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2217` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2218` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2219` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2220` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2221` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2222` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2223` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2224` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2225` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2226` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2227` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2228` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2229` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2230` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2233` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2234` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2235` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2236` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2237` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2238` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2239` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2244` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2245` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2246` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2247` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2248` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2255` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2256` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2257` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/gregorian-calendar.php?2266` | full diff vs /gregorian-calendar.php | readnotes/calendars-indexcgi-fcna-dups.md |
| `/header.js` | full via fold | readnotes/js-files.md |
| `/hijri-calendar.html` | full | readnotes/site-pages-reread.md |
| `/how-countries.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/how-we.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/important-dates.html` | full | readnotes/site-pages-reread.md |
| `/index.cgi/1438jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1438jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1438muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1438rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1438rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1438rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1438rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1438sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1438shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1438shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1438zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1438zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1439jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1439jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1439muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1439rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1439rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1439rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1439rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1439sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1439shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1439shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1439zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1439zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1440jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1440jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1440muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1440rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1440rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1440rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1440rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1440sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1440shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1440shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1440zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1440zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1441jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1441jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1441muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1441rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1441rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1441rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1441rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1441sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1441shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1441shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1441zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1441zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1442jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1442jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1442muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1442rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1442rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1442rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1442rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1442sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1442shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1442shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1442zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1442zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1443jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1443jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1443muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1443rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1443rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1443rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1443rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1443sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1443shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1443shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1443zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1443zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1444jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1444jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1444muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1444rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1444rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1444rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1444rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1444sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1444shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1444shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1444zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1444zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1445jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1445jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1445muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1445rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1445rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1445rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1445rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1445sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1445shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1445shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1445zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1445zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1446jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1446jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1446muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1446rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1446rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1446rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1446rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1446sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1446shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1446shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1446zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1446zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1447jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1447jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1447muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1447rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1447rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1447rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1447rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1447sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1447shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1447shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1447zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1447zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1448jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1448jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1448muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1448rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1448rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1448rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1448rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1448sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1448shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1448shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1448zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/1448zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/about-us.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1438jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1438jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1438muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1438rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1438rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1438rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1438rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1438sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1438shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1438shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1438zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1438zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1439jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1439jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1439muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1439rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1439rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1439rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1439rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1439sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1439shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1439shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1439zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1439zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1440jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1440jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1440muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1440rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1440rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1440rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1440rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1440sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1440shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1440shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1440zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1440zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1441jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1441jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1441muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1441rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1441rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1441rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1441rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1441sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1441shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1441shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1441zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1441zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1442jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1442jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1442muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1442rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1442rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1442rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1442rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1442sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1442shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1442shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1442zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1442zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1443jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1443jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1443muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1443rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1443rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1443rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1443rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1443sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1443shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1443shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1443zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1443zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1444jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1444jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1444muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1444rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1444rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1444rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1444rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1444sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1444shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1444shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1444zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1444zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1445jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1445jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1445muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1445rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1445rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1445rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1445rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1445sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1445shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1445shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1445zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1445zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1446jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1446jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1446muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1446rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1446rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1446rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1446rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1446sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1446shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1446shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1446zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1446zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1447jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1447jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1447muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1447rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1447rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1447rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1447rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1447sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1447shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1447shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1447zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1447zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1448jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1448jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1448muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1448rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1448rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1448rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1448rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1448sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1448shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1448shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1448zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/1448zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/about-us.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/don_a.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/header.js` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/mmenu.js` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/dont/moonsightingmenu.js` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/header.js` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/links.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/mmenu.js` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/moonphoto.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/moonsightingmenu.js` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/quranastronomy.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/shuraRamadan.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1438jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1438jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1438muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1438rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1438rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1438rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1438rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1438sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1438shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1438shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1438zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1438zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1439jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1439jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1439muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1439rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1439rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1439rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1439rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1439sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1439shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1439shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1439zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1439zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1440jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1440jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1440muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1440rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1440rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1440rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1440rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1440sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1440shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1440shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1440zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1440zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1441jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1441jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1441muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1441rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1441rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1441rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1441rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1441sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1441shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1441shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1441zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1441zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1442jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1442jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1442muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1442rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1442rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1442rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1442rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1442sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1442shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1442shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1442zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1442zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1443jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1443jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1443muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1443rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1443rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1443rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1443rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1443sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1443shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1443shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1443zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1443zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1444jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1444jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1444muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1444rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1444rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1444rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1444rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1444sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1444shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1444shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1444zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1444zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1445jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1445jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1445muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1445rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1445rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1445rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1445rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1445sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1445shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1445shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1445zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1445zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1446jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1446jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1446muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1446rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1446rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1446rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1446rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1446sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1446shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1446shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1446zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1446zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1447jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1447jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1447muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1447rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1447rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1447rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1447rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1447sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1447shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1447shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1447zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1447zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1448jmo.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1448jmt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1448muh.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1448rba.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1448rbt.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1448rjb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1448rmd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1448sfr.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1448shb.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1448shw.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1448zhj.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/1448zqd.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/6monthdays.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/about-us.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/calendar.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/eclipses.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/firstqibla.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/header.js` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/mmenu.js` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/moonsightingmenu.js` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/index.cgi/ym/us/non.html` | full diff vs /index.html | readnotes/calendars-indexcgi-fcna-dups.md |
| `/isra-meraj.html` | full | readnotes/site-pages-reread.md |
| `/lectures.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/links.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/manikfan.html` | full | readnotes/site-pages-reread.md |
| `/mcw.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/mmenu.js` | full via fold | readnotes/js-files.md |
| `/moon.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/moonphotos.html` | full | readnotes/site-pages-reread.md |
| `/moonsightingmenu.js` | full via fold | readnotes/js-files.md |
| `/morocco-meeting.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/mosques.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/ned67warrenton.html` | full | readnotes/site-pages-reread.md |
| `/perigee-apogee-new-full.html` | full | readnotes/site-pages-reread.md |
| `/planets.html` | full | readnotes/site-pages-reread.md |
| `/pray.php` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/praytable.php` | full (structure only; no times copied) | readnotes/calendars-indexcgi-fcna-dups.md |
| `/praytable.php?year=&tz=&lat=&lon=&method=0&both=false&time=0` | full (structure only; no times copied) | readnotes/calendars-indexcgi-fcna-dups.md |
| `/praytable.php?year=&tz=&lat=24&lon=24&method=0&both=false&time=0` | full (structure only; no times copied) | readnotes/calendars-indexcgi-fcna-dups.md |
| `/praytable.php?year=&tz=&lat=24&lon=24&method=0&both=true&time=0` | full (structure only; no times copied) | readnotes/calendars-indexcgi-fcna-dups.md |
| `/praytable.php?year=&tz=undefined&lat=&lon=&method=0&both=false&time=0` | full (structure only; no times copied) | readnotes/calendars-indexcgi-fcna-dups.md |
| `/praytable.php?year=2020&tz=America/Chicago&lat=37.09024&lon=-95.712891&method=0&both=false&time=0` | full (structure only; no times copied) | readnotes/calendars-indexcgi-fcna-dups.md |
| `/praytable.php?year=2024&tz=Etc/Unknown&lat=24.5247&lon=39.5692&method=0&both=false&time=0` | full (structure only; no times copied) | readnotes/calendars-indexcgi-fcna-dups.md |
| `/qibla.html` | full (site agent, Read tool incl. FORMS/LINKS) | notes/site.md §2–§6 |
| `/ramadan-eid.html` | full | readnotes/calendars-indexcgi-fcna-dups.md |
| `/ramadan-eid.html?fbclid=IwAR0aClfAQxbNaO_L-41_Jl0EIcaYBwMCMq4_Dqeg0ZJ-mT40tjBKKYlEoOk` | full diff vs base (identical) | readnotes/calendars-indexcgi-fcna-dups.md |
| `/secondqibla.html` | full | readnotes/site-pages-reread.md |
| `/soomu-hadith.html` | full | readnotes/site-pages-reread.md |
| `/visibility.html` | full | readnotes/calendars-indexcgi-fcna-dups.md |
| `/visibility.html?s=09` | full diff vs base (identical) | readnotes/calendars-indexcgi-fcna-dups.md |
| `/what-hijri-calendar-should-be.html` | full | readnotes/site-pages-reread.md |

Ledger totals:
- 279 pages "full" by readers and 17 "full" by the site agent
- 433 calendar years as full diffs and 418 index.cgi copies as full diffs
- 9 report templates as full diffs and 4 report query duplicates as full diffs
- 6 FCNA pages (full plus full diff) and 7 praytable responses (full)
- 2 page query duplicates as full diffs
- 9 JS files (full via fold) and 2 PDFs (full text)

Total: 1,186.
