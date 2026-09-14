# moonsighting.com `prayer.html`: complete dated history, 1999 to 2025

Research note, 2026-09-14. Scope: every archived distinct-digest capture of `http://www.moonsighting.com/prayer.html` (64 captures listed in `~/athan-research/pdfs/wayback/prayer-html/captures.txt`). Every statement below quotes the page's own words and names the capture timestamp(s). Quotes keep the page's own spelling errors ("timimgs", "Prohobitted", "reporetd", "Dewsbuary", "Imama Maalik", "egrees", etc.). No prayer time is copied, averaged or invented. The only clock times quoted are ones the page itself prints (an Islamicfinder example and a reader's observation).

## 0. Method and completeness

- **Source files.** Raw captures `prayer.html.<ts>`. All 64 were already on disk when extraction ran (05:43 on 2026-09-14). After the usage-limit resume I re-checked every raw file's size and mtime against `meta.json`: none changed, none added.
- **Faithfulness of the existing `.txt` files.** All 64 existing `.txt` files reproduce exactly when regenerated with BeautifulSoup `html.parser`, scripts and styles removed, lines stripped and blank lines dropped. As an independent check, I stripped the raw HTML of tags with a regex and compared word-count multisets against the bs4 text for all 60 real captures: zero words differ, so nothing visible was dropped. Non-ASCII bytes present are 0xB0 (°), 0x85 (…), 0x91/0x92 (curly single quotes) and 0xEE (î). Decoding is strict cp1252 with no undefined bytes.
- **Reading texts.** `~/athan-research/prayer-history/text/<ts>.txt` holds the bs4 text plus inline markers `⟦tag attr="…"⟧` for every `href`, `src`, `alt`, `name`, form `action`/`input`, `meta` content, HTML comment, and script/style body. These markers cover the link targets that the existing `.txt` files lack. Script: `~/athan-research/prayer-history/extract.py`.
- **Diffs.** `~/athan-research/prayer-history/diffs/<prev>_to_<ts>.diff` holds the full `difflib.unified_diff` of each capture's reading text against the previous one, written whole to disk: 63 diffs.
- **Reading copies.** Lines longer than 1,500 characters are split with a `↩` continuation marker in `diffs-read/`, because the reading tool truncates at 2,000 characters. The longest line is 6,207 characters: a JavaScript clock, 2007–2009. Rejoining the pieces is asserted byte-identical to the canonical diff.
- **Reading done.**
  - Capture 1 (19990221195144) read in full, all 129 lines.
  - Every line of all 63 sequential diffs read in full.
  - The last real capture (20110827031037) additionally read in full, all 83 lines.
  - The four post-2011 captures read in full as raw HTML and as diffs.
  - how-we.html text read in full, all 88 lines.
- **Running log.** `~/athan-research/prayer-history/working-notes.md`, saved after each batch.
- **Counts.**
  - 64 captures in total: 60 real pages plus 4 bot-challenge pages.
  - Full reads: 1 first capture, 1 last real capture and 4 bot pages as raw HTML.
  - Diffs: 63 of 63 read in full, 4,031 diff lines in total.

## (a) Every capture

"Updated" is the page's own "Updated …" line, verbatim.

| # | Capture | Bytes | Page's "Updated" | Read |
|---|---|---|---|---|
| 1 | 19990221195144 | 7328 | Updated Dec 9, 1998 | read: full |
| 2 | 19990419193656 | 8435 | Updated Mar 6, 1998 | read: full diff vs 19990221195144 |
| 3 | 19990427164509 | 9868 | Updated Mar 21, 1998 | read: full diff vs 19990419193656 |
| 4 | 19991012043239 | 10322 | Updated May 14, 1999 | read: full diff vs 19990427164509 |
| 5 | 19991110003800 | 10950 | Updated Nov 6, 1999 | read: full diff vs 19991012043239 |
| 6 | 20000301021134 | 10691 | Updated Jan 1, 2000 | read: full diff vs 19991110003800 |
| 7 | 20000520040340 | 10637 | Updated Jan 1, 2000 | read: full diff vs 20000301021134 |
| 8 | 20000816224322 | 11034 | Updated on July 19, 2000 | read: full diff vs 20000520040340 |
| 9 | 20001018085152 | 14334 | Updated on Oct 10, 2000 | read: full diff vs 20000816224322 |
| 10 | 20010204222000 | 13084 | Updated on Feb 4, 2001 | read: full diff vs 20001018085152 |
| 11 | 20010409230832 | 13635 | Updated on Apr 05, 2001 | read: full diff vs 20010204222000 |
| 12 | 20010610050848 | 13263 | Updated on Apr 26, 2001 | read: full diff vs 20010409230832 |
| 13 | 20011004085946 | 13266 | Updated on Apr 26, 2001 | read: full diff vs 20010610050848 |
| 14 | 20020203211857 | 16197 | Updated on Jan 20, 2002 | read: full diff vs 20011004085946 |
| 15 | 20020610031936 | 16459 | Updated Apr 4, 2002 | read: full diff vs 20020203211857 |
| 16 | 20021012095956 | 17027 | Updated June 30, 2002 | read: full diff vs 20020610031936 |
| 17 | 20021206215653 | 17076 | Updated June 30, 2002 | read: full diff vs 20021012095956 |
| 18 | 20030628052150 | 12048 | Updated May 23, 2003 | read: full diff vs 20021206215653 |
| 19 | 20031204113435 | 9768 | Updated Oct 10, 2003 | read: full diff vs 20030628052150 |
| 20 | 20040203144209 | 9765 | Updated Oct 10, 2003 | read: full diff vs 20031204113435 |
| 21 | 20040603164422 | 9681 | Updated April 3, 2004 | read: full diff vs 20040203144209 |
| 22 | 20041001083915 | 9872 | Updated September 19, 2004 | read: full diff vs 20040603164422 |
| 23 | 20041128040928 | 9750 | Updated September 19, 2004 | read: full diff vs 20041001083915 |
| 24 | 20041230222901 | 9915 | Updated December 29, 2004 | read: full diff vs 20041128040928 |
| 25 | 20050322032413 | 9969 | Updated March 10, 2005 | read: full diff vs 20041230222901 |
| 26 | 20050517081501 | 11726 | Updated May 5, 2005 | read: full diff vs 20050322032413 |
| 27 | 20051107023034 | 13581 | Updated October 31, 2005 | read: full diff vs 20050517081501 |
| 28 | 20051208073336 | 13358 | Updated November 8, 2005 | read: full diff vs 20051107023034 |
| 29 | 20060321063509 | 13363 | Updated March 14, 2006 | read: full diff vs 20051208073336 |
| 30 | 20060516094153 | 13772 | Updated May 11, 2006 | read: full diff vs 20060321063509 |
| 31 | 20060818182933 | 14064 | Updated August 9, 2006 | read: full diff vs 20060516094153 |
| 32 | 20061020114835 | 15324 | Updated September 26, 2006 | read: full diff vs 20060818182933 |
| 33 | 20061119055856 | 15433 | Updated November 15, 2006 | read: full diff vs 20061020114835 |
| 34 | 20070202014744 | 15854 | Updated Januray 29, 2007 | read: full diff vs 20061119055856 |
| 35 | 20070220023056 | 15933 | Updated Februray 15, 2007 | read: full diff vs 20070202014744 |
| 36 | 20070228233224 | 15853 | Updated Januray 29, 2007 | read: full diff vs 20070220023056 |
| 37 | 20070308233702 | 15978 | Updated March 8, 2007 | read: full diff vs 20070228233224 |
| 38 | 20070317081529 | 17391 | Updated March 16, 2007 | read: full diff vs 20070308233702 |
| 39 | 20070331122828 | 17391 | Updated March 16, 2007 | read: full diff vs 20070317081529 |
| 40 | 20070510122654 | 17023 | Updated May 1, 2007 | read: full diff vs 20070331122828 |
| 41 | 20070911005515 | 17220 | Updated May 1, 2007 | read: full diff vs 20070510122654 |
| 42 | 20070925050450 | 24084 | Updated September 22, 2007 | read: full diff vs 20070911005515 |
| 43 | 20080215023105 | 25148 | Updated February 5, 2008 | read: full diff vs 20070925050450 |
| 44 | 20080319094925 | 25497 | Updated March 5, 2008 | read: full diff vs 20080215023105 |
| 45 | 20080513044447 | 26248 | Updated May 11, 2008 | read: full diff vs 20080319094925 |
| 46 | 20081223035751 | 26868 | Updated October 30, 2008 | read: full diff vs 20080513044447 |
| 47 | 20090720004402 | 27424 | Updated June 2, 2009 | read: full diff vs 20081223035751 |
| 48 | 20090822003840 | 20809 | Updated June 2, 2009 | read: full diff vs 20090720004402 |
| 49 | 20090922052502 | 21117 | Updated September 10, 2009 | read: full diff vs 20090822003840 |
| 50 | 20091228042146 | 21639 | Updated December 4, 2009 | read: full diff vs 20090922052502 |
| 51 | 20100128054622 | 22467 | Updated January 2, 2010 | read: full diff vs 20091228042146 |
| 52 | 20100728224828 | 24477 | Updated July 8, 2010 | read: full diff vs 20100128054622 |
| 53 | 20100826025114 | 25946 | Updated August 22, 2010 | read: full diff vs 20100728224828 |
| 54 | 20101013225925 | 26266 | Updated September 27, 2010 | read: full diff vs 20100826025114 |
| 55 | 20101114190900 | 25281 | Updated November 13, 2010 | read: full diff vs 20101013225925 |
| 56 | 20110318232426 | 24145 | Updated March 11, 2011 | read: full diff vs 20101114190900 |
| 57 | 20110522060534 | 25837 | Updated May 3, 2011 | read: full diff vs 20110318232426 |
| 58 | 20110623225032 | 26740 | Updated June 17, 2011 | read: full diff vs 20110522060534 |
| 59 | 20110727110355 | 26518 | Updated July 25, 2011 | read: full diff vs 20110623225032 |
| 60 | 20110827031037 | 14709 | Updated August 16, 2011 | read: full diff vs 20110727110355, and full text |
| 61 | 20211206054638 | 1358 | none (bot challenge) | read: full raw, and full diff vs 20110827031037 |
| 62 | 20220123124049 | 1377 | none (bot challenge) | read: full raw, and full diff vs 20211206054638 |
| 63 | 20221207202552 | 1329 | none (bot challenge) | read: full raw, and full diff vs 20220123124049 |
| 64 | 20251016224039 | 11604 | none (bot challenge) | read: full raw, and full diff vs 20221207202552 |

Notes on the table:
- **Dates out of order.** The "Updated" dates go backwards twice: "Dec 9, 1998" (19990221195144), then "Mar 6, 1998" (19990419193656), then "Mar 21, 1998" (19990427164509); and "Februray 15, 2007" (20070220023056), then "Januray 29, 2007" (20070228233224). The 2007 reversal matches a content revert: the item "4. Do you want Islamic dates according to Unified Global Islamic Calendar?" was removed again.
- **Bot-challenge captures.** 20211206054638, 20220123124049 and 20221207202552 are identical "One moment, please..." / "Please wait while your request is being verified..." pages. They differ only in the obfuscated `west`/`east` numbers, and the form action is `/z0f76a1d14fd21a8fb5fd0d03e0fdc3d3cedae52f`. 20251016224039 is a newer challenge page: a spinner SVG titled "Loader", bot-detection JS with `pdata` `https%3A%2F%2Fwww.moonsighting.com%2Fprayer.html` and `ts` `1760654438`. None of the four contains any prayer content.
- **No captures from 2012 to 2020.** Between 20110827031037 and 20211206054638 there are no distinct-digest captures.

## (b) Dated change log (method-relevant changes)

Format: capture where the change first appears (page's Updated date). "Before" is the text in the previous capture.

### 1999–2000: 15° (ISNA), 1/7 night above 45°, email-only timetables

- **19990221195144 (Dec 9, 1998), first capture.** The whole method is:
  - Maghrib "is calculated as 3 minutes after sunset".
  - Zuhr: "Thus, 5 minutes are added in Noon time for Zuhr."
  - Fajr & Isha: "Fajr & Isha are calculated for Sun being 15 degrees below horizon, a value adopted by ISNA, which is based on sound principles of Qur'an and Sunnah, as applied in the light of modern scientific calculations. For determining the times of Fajr and Isha, observations have been made in different parts of the world for Subh-e-Sadiq, and disappearance of Shafaq by different groups of people, and the data was compiled and analyzed by Muslim scientists in North America, and the most suitable judgmental scientific values of degrees below horizon that appear to be correct have been suggested to be 15 degrees, that was adopted by ISNA. However, for latitudes higher than 45 degrees, where some days in summer and winter, either the sun does not reach 15 degrees below or it reaches so late at night that it becomes impractical or hardship to pray Isha & Fajr. For those situations a special consideration is adopted that has been suggested by Ulemaa' of Fiqh. (This includes 1/7th of the night before sunrise for Fajr and 1/7th of the night after sunset for Isha. In some cases, even this is impractical, so the times for Fajr & Isha are kept in line with other days of the year just before and after these special days of hardship in summer and winter, such that the times are roughly those of nearby latitudes where practical times can be calculated.)"
  - Asr: "is calculated for Shafei/Maliki Fiqh (Shadow = Length + shadow @ noon), and for Hanafi Fiqh (Shadow = twice length + shadow @ noon)."
  - Delivery: "Remember, the Prayer Schedule is different for every city, so if you need Prayer Schedule, send your city name; just the state or country would not be enough. Also indicate whether you need Asr Shafei, or Hanafi, or both and whether you need the column for Qibla direction. E-mail to: Khalid Shaukat" (`mailto:shaukat@moonsighting.com`).
- **19991012043239 (May 14, 1999).**
  - Maghrib "is calculated as" becomes "should be calculated as 3 minutes after sunset".
  - New section "Fajr & Isha 15 VS 18 Degrees: Let me explain the controversy of 15 and 18 degrees. In the last 20 years, Muslim Groups from four continents have made a deliberate effort to observe Subh-e-Sadiq. Groups from Pakistan, England, USA, Caribbean Islands, and Australia have made actual observation for Subh-e-Sadiq (for Fajr) noting down the time for observation. I have made calculations to find the corresponding angle of depression for each observation, and found that the angle comes closer to 13.5 degrees. Keeping a little factor of safety, it makes sense to use 15 degrees everywhere in the world. On requests, I have been providing Prayer Schedule all around the world, with 15 degrees."
  - Also new: "Those who calculate it at 18 degrees have one of the two reasons; 1)Charts were available since last 60 years for astronomical twilight (18 degrees); 2)In tropical countries like India, Pakistan, and Arabia usual practice is 1.5 hours after sunset for Isha or 1.5 hours before sunrise for Fajr. This translates into 18 degrees approximately."
  - Also new: the book "When to Pray Fajr & Isha", with "This was not yet published, but the manuscript is available at the cost of xeroxing and mailing" (`mailto:makhtoon@hotmail.com`).
  - The 15° paragraph drops "and disappearance of Shafaq" and now reads "… However, this is not applicable for latitudes higher than 45 degrees … suggested by Ulemaa' of Fiqh in the past centuries."
- **19991110003800 (Nov 6, 1999).**
  - Maghrib: before "should be calculated as 3 minutes after sunset"; after "should be calculated at least as 1 minutes after sunset for the following considerations:", with "For major metropolitan cities, another 2 minutes should be added, because the sunset in a 30 mile radius from the point taken in calculation varies."
  - 18° reason 1 becomes "Before the advent of computers, tables were available for astronomical twilight (18 degrees), and Muslims used those tables for ease of amy more detailed calculations".
- **20000301021134 (Jan 1, 2000).** Heading becomes "Fajr & Isha 15 vs 18 Degrees:". Reason 1 ends "so they do not have to make any more calculations". "This is not yet published".
- **20000520040340 (Jan 1, 2000).** Delivery: "send your request to Khalid Shaukat with city name; just the state or country would not be enough."

### 2001–2002: Maghrib back to 3 minutes; "Avoid On-line Prayer Times Calculations" (DST, time zone)

- **20010204222000 (Feb 4, 2001).**
  - Maghrib: before "at least as 1 minutes after sunset … another 2 minutes should be added"; after "should be calculated at least as 3 minutes after sunset", with item "3. For major metropolitan cities, the sunset in a 30 mile radius from the point taken in calculation varies. Since the people using this schedule may live all around the city, this may delay sunset for some areas."
  - Asr: "Shafei/Maliki/Hambali Fiqh".
  - New link `6monthdays.html` "Where on earth the night or day are 6 months long? Click here".
- **20010409230832 (Apr 05, 2001).** New link `http://www.ummah.net/astronomy/saltime/` "Formulae for Prayer Times" (last seen 20011004085946).
- **20010610050848 (Apr 26, 2001).** Delivery: "If you need Prayer Schedule, send email to Khalid Shaukat with city name; also indicate whether you need Asr Shafei, or Hanafi, or both and a column for Qibla direction."
- **20020203211857 (Jan 20, 2002).**
  - New block "Looking for Prayer Schedule?  Read this first / Avoid On-line Prayer Times Calculations: Let me explain why.":
    1. "Entering Latitudes and longitudes will not be sufficient to calculate prayer times. Time zone is another input required by the user. A user may not know the Time Zone applicable to a given longitude."
    2. "The Daylight Saving Times (DST), and its start and end are different in different countries. This information is not available from any single authentic source. To calculate Prayer Times correctly these data are critically important."
    3. "Daylight Saving Time practices in USA and Canada are different in various states. Some states in USA and Canada have two time zones. A user may not realize it."
    4. "At latitudes higher than 45 degrees, computer programs may not calculate Fajr & Isha times. The user gets blank for those times."
    5. "At latitudes higher than 67.5 degrees, sunrise and sunset may not occur on few days or more. Special considerations, that cannot be programmed, are required to calculate all 5 prayer times at those high latitudes. This cannot be done by computer programs alone. Manual considerations are needed."
    6. "Qiblah direction can only be calculated from True North by computer programs. … True North may be up to and beyond 90 degrees away from Magnetic North … U.S. Geological Survey (USGS) updates this information …" After this item: "These things cannot be programmed on-line." Items 7–10 follow under "More reasons for objecting the on-line computer program for prayer schedule are".
  - Zuhr becomes "Thus, 5 minutes should be added in Noon time for Zuhr."
  - Delivery: "For Prayer Schedule send email to Khalid Shaukat indicating city name and whether you need Asr Shafei, or Hanafi, or both and a column for Qibla direction."
- **20021012095956 (June 30, 2002).**
  - DST item 3 becomes "Some states in USA (Alaska, Florida, Idaho, Indiana, Kansas, Kentucky, Michigan, Nebraska, N. Dakota, Oregon, S. Dakota, Tennessee, Texas) and Canada (British Columbia, Newfoundland, Saskatchewan) have two time zones. A user may not realize it and may not find the information easily."
  - Email addresses are now written by JavaScript: the manuscript address becomes moon7415@hotmail.com, and shaukat@moonsighting.com is kept.

### 2003: twilight argument; 15° still in use

- **20030628052150 (May 23, 2003).**
  - Online-calculator list reworded:
    - "Latitudes and longitudes are usually not available to the user. Even if they were available, it is not sufficient to calculate prayer times."
    - "Time zone is another input required by the user, who may not know the Time Zone applicable to a given location."
    - "The Daylight Saving Times (DST) also called summer time are practiced differently in different countries."
    - "At latitudes higher than 48.5 degrees, the sun does not go 18 degrees below horizon, and computer will not calculate Fajr & Isha times. The user gets blanks for those times."
    - "At latitudes higher than 66.5 degrees, sunrise and sunset may not occur on few days or more. … Manual calculations are needed."
  - Intro becomes "Most Prayer Schedules available on-line lack some important fiqh considerations and result in wrong timings. I took the initiative to educate the masses about the corrections needed, and provide the Correct Prayer Schedule  especially for Maghrib and Zuhr".
  - Asr formulas removed; now "time calculations require different interpretations by different jurists such as Hanafi, Shafi'i, Maaliki, Hambali, or Shi'aa."
  - 15° section: "Since 1970s, Muslim Groups from four continents … found that the observed time was closer to corresponding angle of 13.5 degrees. If we give a little factor of safety, it makes sense to use 15 degrees." The phrases "everywhere in the world" and "On requests, I have been providing Prayer Schedule all around the world, with 15 degrees." are removed.
  - New twilight text: "Civil twilight (6 degrees) … Nautical twilight (12 degrees) … Astronomical twilight (18 degrees) is defined as "the time when the indirect illumination from the Sun is approximately equal to that of the night sky, meaning that at 18 degrees the complete darkness takes over."  None of these definitions fit the requirement for Fajr or Isha."
  - ISNA paragraph: "This effort showed that the observed time was close to 13.5 degrees. … However, even 15 degrees is not suitable for latitudes higher than 45 degrees".
  - Delivery: "For Prayer Schedule & Qibla Direction send email by clicking on E-mail at the top of the page. Indicate city name and whether you need Qibla Direction columnn and Asr Shafei, or Hanafi, or both."

### Late 2003 to early 2005: switch to 18°, with 18/15/12 and 1/7 night for high latitudes

- **20031204113435 (Oct 10, 2003). Reversal to 18°.**
  - Before (20030628052150): "Fajr & Isha are calculated for Sun being 15 degrees below horizon, a value adopted by ISNA … Fajr & Isha 15 vs 18 Degrees: …"
  - After: "Fajr & Isha are calculated for Sun being 18 degrees below horizon. If this makes Fajr very early and Isha very late as it happens at higher latitudes in summer of Europe and North America in Northern Hemisphere and in summer of Australia and New Zealand in Southern Hemisphere then" … "a special consideration is adopted that has been suggested by Ulemaa' of Fiqh in the past centuries (known as 1/7th of the Night Rule).  This rule means 1/7 of the length of night from sunset to sunrise is calculated; Fajr is sunrise minus 1/7th of the night and Isha is sunset plus 1/7th of the night. In some cases, even this is impractical, so the times for Fajr & Isha are kept in line with other days of the year just before and after these special days of hardship at higher latitudes."
  - The book becomes "A booklet of about 48 pages".
  - The 15° statement, the 13.5° argument, the twilight explanation and the ISNA paragraph are all gone (last seen 20030628052150).
- **20040603164422 (April 3, 2004).** Zuhr "Haraam" becomes "Mamnoo' (Prohobitted)".
- **20041001083915 (September 19, 2004).** High latitude: "a special consideration is adopted that is a combination of 18 degrees, 15 degrees, and even 12 degrees. This combination is based on suggestion by Ulemaa' of Fiqh in the past centuries (known as 1/7th of the Night Rule)."
- **20041230222901 (December 29, 2004).** "This combination is based on a suggestion by Fuqaha' that if the sun does not set at higher latitudes then the times for nearest location, where sun sets, can be used. This can also be translated in a mathematical way as "1/7th of the Night" Rule.  1/7 of the night (from sunset to sunrise) is calculated; Fajr is sunrise minus 1/7th of the night and Isha is sunset plus 1/7th of the night." Qibla text adds "Either of this time is provided for everyday in Qibla column after Isha."

### May 2005: no fixed degrees; function of latitude and seasons; Blackburn; Hizbul Ulama (London)

- **20050517081501 (May 5, 2005).**
  - Before (20050322032413): "are calculated for Sun being 18 degrees below horizon … combination of 18 degrees, 15 degrees, and even 12 degrees … "1/7th of the Night" Rule …"
  - After, new "Caution:": "Calculations of Fajr & Isha based on 18° or 15° or fixed minutes before sunset or after sunrise are wrong. Observations of Subh-Sadiq at various locations throughout the globe have confirmed that any fixed minutes or fixed degree for Subh-Sadiq (whether 18° or 15°) is not right. Similarly, disappearance of Shafaq for Isha does not occur at any fixed minutes or fixed degree (whether 18° or 15°). It is wrong to calculate Fajr & Isha based on 18° or 15° as has been confirmed by Hizbul Ulama UK, 74a Upton Lane, London E7 9LW, Telephone 07866-464040, email: info@hizbululama.com:"
  - After, Fajr & Isha: "are calculated by others using different criteria, all over the world. Some use 17°,19°, 20°, or even 21°. Others use 90 minutes, 75 minutes or 60 minutes criteria.  Research by moonsighting.com shows that any fixed degree is not correct for Subh-Sadiq or disappearance of Shafaq for Isha.  This can only be seen if a whole year observation is conducted. Many plaves in the world [Riyadh (Saudi Arabia), Tando Adam (Pakistan), South Africa, New Zealand, Buffalo (New York), Toronto (Canada)] have done limited observations that are misleading to apply for the entire year. A more comprehensive observation for the entire year done in Blackburn, Lancashire, England also showed that any fixed degree is not correct for Subh-Sadiq or disappearance of Shafaq for Isha. A decade long research by Moonsighting.com found that the Subh-Sadiq or disappearance of Shafaq is a function of latitude and seasons. When this function is checked against all round the year observations of Blackburn, UK, the calculations matched  observations with amazing accuracy. So, Fajr and Isha are calculated using that function of latitude and seasons."
  - Booklet: "Moonsighting.com algorithm for function of latitudes and seasons is not yet included in the booklet. … can be sent by mail (NOT by e-mail) upon request."
  - High latitude: "At latitudes close to or higher than arctic circle, the sun does not set in summer, or does not rise in winter for a number of days. For such situations, a suggestion by Fuqaha', to calculate for nearby lower latitudes where the sun sets and rises, is used." The 1/7 rule and 18/15/12 are removed (last seen 20050322032413).
  - Online-calculator list: "At latitudes higher than 48.5°, the sun does not go 18° below horizon, and computer will not calculate Fajr & Isha times. … Similarly, at latitudes higher than 51.5°, the sun does not go 15° below horizon". Also "At latitudes higher than 66.5° … Computer will not calculate Maghrib time."
  - Intro: "Moonsighting.com took the initiative … specially for Fajr, Isha, Zuhr, Asr, and Maghrib".
- **20051107023034 (October 31, 2005). First PDF.**
  - Caution: "… fixed number of minutes (e.g, 90 minutes) after sunset or before sunrise are wrong. … This has also been confirmed by Hizbul Ulama UK, 74 Upton Lane, London E7 9LW, Telephone 0786-646-4040, email: info@hizbululama.org.uk.  Read a detailed book, "Fajar and Isha Time in Britain" written by Molvi Yaqub Miftahi from UK." (`fajarishainbritain1.pdf`).
  - Blackburn sentence: "When this function is checked against all round the year observations of Blackburn, UK, by a group of Ulamaa' (Click here to download a book published by Hizbul Ulama, 74 Upton Lane London E7 9LW UK), the calculations matched  observations with amazing accuracy."
  - New "Avoid Islamicfinder.org Prayer Times": "Islamicfinder.org has used ISNA's name without verifying from ISNA. … I have checked with ISNA (Dr. Muzammil Siddiqi and Dr. Sayyid Syeed); ISNA never had any official position.  Use of 15 or 18 degrees is not correct. Moonsighting.com provides correct schedule upon request through e-mail, and that does not use any fixed degrees.  It uses a complex formula as a function of Latitudes and Seasons based on actual observation of Subh-Sadiq and disappearance of Shafaq as observed by teams of Muslims/Ulamaa in different parts of the world.  Sufficient observations were for the entire year capturing the difference in all seasons."
- **20060516094153 (May 11, 2006).**
  - Before: "the calculations matched  observations with amazing accuracy".
  - After: "All collected observations show that for areas at or near equator Shafaq disappearance and Subh-Sadiq occurs in 75 minutes or at 18 degrees in all seasons. As you move to other latitudes, subh-Sadiq and disappearance of Shafaq occurs at different degrees in different seasons. Shafaq disappears at 66 to 100 minutes (9 to 13.6 egrees) at higher latitudes (like England) in different seasons.  Subh-Sadiq at higher latitudes is observed at 94 to 122 minutes (14.5 to 10.6 degrees) in different seasons. … Moonsighting.com uses this function of latitude and seasons for calculating Fajr and Isha times."
- **20060818182933 (August 9, 2006).**
  - Caution adds "Research and observations by Moonsighting.com members have also held this opinion for quite some time."
  - Maghrib adds "These are the considerations for the 4 major Sunni school of thought. For Shi'aa school of thought, 14 minutes after sunset is considered as Maghrib time."
- **20061020114835 (September 26, 2006).** Caution becomes "assuming any fixed degree (whether 18° or 15°) or any fixed minutes (like 90 minutes or 75 minutes) is not right."
- **20061119055856 (November 15, 2006).**
  - Shi'a Maghrib: before "14 minutes after sunset"; after "17 minutes after sunset".
  - Asr: "… Hambali, or Ja'friyah (Shi'aa)."
  - PDF href becomes `fajar&isha-a5.pdf`.
- **20070202014744 (Januray 29, 2007).**
  - PDF href becomes `fajr&isha-yam.pdf`, "written by Molvi Yaqub Ahmed Miftahi from UK. Therefore, Moonsighting.com uses a function of latitude and seasons of the year for calculating Fajr and Isha times."
  - Online list adds "Time difference from GMT is also needed." and "Moreover, Congress in USA and Government of Canada have adopted a new DST schedule starting 2007."
  - Request form: "1. City, and State/Country? 2. What school of thought … 3. Do you need Qibla Direction column?"
- **20070308233702 (March 8, 2007).** PDF moves to `articles/fajr&isha-yam.pdf`. New link `articles/UK-PrayerCharts.pdf` "Download Prayer Times for Large Cities in UK - pdf".
- **20070317081529 (March 16, 2007).** "To request Prayer Times (Qibla from Compass provided), E-mail with the following:"; new links `narvik.html` and `timezone.html`.
- **20070911005515 (May 1, 2007).** "This was further confirmed independently by scientists in Pakistan in 2007.  Please see an "Urdu letter"" (`images/ghor-talab.gif`).
- **20080215023105 (February 5, 2008).** "For accurate prayer times avoid using PERPETUAL PRAYER TIMES. Every year the prayer times shift slightly by plus minus 1 or 2 minutes, because of February 29 in leap years. Request prayer times for a specific year for accurate times." Zuhr "Additional 1 minute"; "Mamnoo' (Prohibited)".
- **20081223035751 (October 30, 2008).**
  - PERPETUAL text becomes "If Daylight Saving Time(DST) is observed in your area, avoid using PERPETUAL PRAYER TIMES, because the dates for DST are different every year. Also, Every year the prayer times shift slightly by plus minus 1 or 2 minutes, because of February 29 in leap years. Request prayer times for a specific year for accurate times."
  - "Moreover, DST changes on different dates every year."
  - Asr: "For Shafi'i, Maaliki, and Hambali, Asr is calculated when the shadow of any object becomes equal to its length. For Hanafi, Asr is calculated when the shadow of any object becomes twice its length. For Ja'friyah, Asr is calculated when the shadow of any object becomes equal 4/7 of its length (as given to me by a follower of Ayatullah Sistani)."
  - Maghrib: "For Ja'friyah school of thought, 17 minutes after sunset is considered as Maghrib time which is considered enough for the bronze glow on the horizon to disappear."
  - New links `articles/ghor-talab.gif` "Urdu letter - Ghaur Talab" and `articles/prayers-uk.pdf`.
- **20090720004402 (June 2, 2009).**
  - PERPETUAL/DST advice removed (last seen 20081223035751).
  - Delivery: "put in the Subject your city, state/country and your school of thought".
  - First use of "Shafaq Ahmer", in the Abdelkader Tayebi (Windsor, Canada) email about St Joseph MI on 19 May 2009: "So your calculations using a function of latitude and seasons are mashaAllah quite accurate."
- **20090922052502 (September 10, 2009). 1/7 rule returns, as Sab'u Lail.** "At latitudes between 55 - 66 degrees, the rule of Sab'u Lail (1/7th of the night) is used when other methods give times that become hardship for those areas. Isha starts at the end of first 1/7th of the night, and Fajr starts at the last 1/7th of the night." The UK charts link becomes `articles/uk-prayercharts1.pdf`.

### 2010–2011: Shafaq Ahmer/Abyad data, earlier-of/later-of rule, 55–65° band, final rewrite

- **20100728224828 (July 8, 2010).**
  - Heading: before "PRAYER SCHEDULE, THAT YOU HAVE, MAY NOT BE CORRECT"; after "HOW MOONSIGHTING.COM CALCULATES PRAYER TIMES".
  - "Limited observations were done in many places in the world [Riyadh (Saudi Arabia), Tando Adam (Pakistan), South Africa, New Zealand, Buffalo (New York), Toronto (Canada)] that have gaps of many days throughout the year. A more comprehensive observation for almost entire year was done in Blackburn, Lancashire, England (from September 1987 to August 1988) by a group of Ulamaa'."
  - "These observations were not for 365 days of the year, but were sufficient to fill in the gaps of missing days. Manu Ulamaa including Hakimul-Ummat Hazrat Maulana Ashraf Ali Thanvi (RA) have advocated i.e. to carry out observations on two or three days a month and to use that as a basis for preparing a chart for the whole year (Imdadul-Fatawa Vol1, Page 98)."
  - "Observations at or near equator show that Shafaq Abyad occurs in about 75 minutes after sunset and Subh-Sadiq occurs in about 75 minutes before sunrise in all seasons. The 75 minutes at equator is equivalent to about 18 degrees sun's position below horizon. … For example, Subh-Sadiq, in Blackburn UK, was observed 93 to 123 minutes before sunrise in different seasons. Shafaq Ahmer occurs, in Blackburn UK, 55 to 81 minutes after sunset in different seasons, while  Shafaq Abyad occurs 77 to 105 minutes after sunset.  Similarly, Subh-Sadiq, in Chicago, USA, was observed 90 to 111 minutes before sunrise in different seasons. Shafaq Ahmer occurs, in Chicago, USA, 57 to 76 minutes after sunset in different seasons, while Shafaq Abyad occurs 77 to 98 minutes after sunset."
  - "A decade long research by Moonsighting.com found that the Subh-Sadiq and Shafaq are functions of latitude and seasons (day number of the solar year). … specially for the whole year observations done by Ulamaa of Blackburn UK."
  - "Both Shafaq Ahmer and Shafaq Abyad can be calculated by different mathematical formulae. These formulae are good up to the 55° latitude."
  - Band: before (20090922052502) "Isha starts at the end of first 1/7th of the night, and Fajr starts at the last 1/7th of the night"; after "At latitudes between 55° and 66°, the rule of Sab'u Lail (1/7th of the night) is used, when other methods give times that become hardship for those areas. Isha starts at the time which is earlier of Shafaq calculation or first 1/7th of the night. Similarly Fajr starts at the time which is later of Tabayyan (when morning light in the sky spreads horizontally) or the last 1/7th of the night."
  - The 2006 "66 to 100 minutes (9 to 13.6 egrees) … 94 to 122 minutes (14.5 to 10.6 degrees)" text is removed (last seen 20100128054622).
  - Language chooser added: `prayer-french.html`. The request address becomes email@moonsighting.com.
  - DST item adds "These DST dates change frequently by decisions of authorities in many countries, and are not available to users."
- **20101013225925 (September 27, 2010).** "Moonsighting.com uses a complex formula as a function of Latitudes and Seasons derived from actual observation … Limited observations were done in many places in the world [Riyadh (Saudi Arabia), Tando Adam (Pakistan), South Africa, New Zealand, Australia, Miami FL, Buffalo NY, Chicago IL, San Francisco CA, Tempe AZ, Houston TX,  and Washington DC (USA), Toronto (Canada), and Dewsbuary UK]."
- **20101114190900 (November 13, 2010).** `articles/uk-prayercharts1.pdf` link removed (last seen 20101013225925). The French page link is removed.
- **20110318232426 (March 11, 2011).** Hizbul Ulama address and book link removed from the Caution box, which now ends "…held this opinion for quite some time." The book link stays in the Fajr & Isha section. The bottom request box is removed.
- **20110522060534 (May 3, 2011).**
  - Request examples add "London, ENGLAND - Hanbali".
  - Online list: before "Special considerations, that cannot be programmed, in my opinion, are required … Manual calculations are needed."; after "Special considerations, are required to calculate all 5 prayer times at those high latitudes. Some convention has to be adopted based on local civil time that is practical and does not cause hardship."
  - New latitude examples:
    - "Above 48.5° (e.g., Vancouver, Canada), the sun does not go 18° below horizon on the longest day of the year."
    - "Above 51.5° (e.g., Cambridge, UK), the sun does not go 15° below horizon on the longest day of the year. On other days, Isha calculated at 15° will give Isha time 2.5 hours after Maghrib. This becomes hardship."
    - "Above 54.5° (e.g., Copenhagen, Denmark), the sun does not go 12° below horizon on the longest day of the year. On other days, Isha calculated at 12° will give Isha time 3 hours after Maghrib. This is even more hardship, so it is impractical."
  - Observations restated with degrees:
    - "in Karachi and Tando Adam, Pakistan (approx. 25°- 26° latitude) several observations have been made by Ulamaa' and it was noted that Subh-Sadiq and disappearance of White Shafaq occur at about 16° to 18° in different seasons."
    - "In Chicago, USA (about 42° latitude), Subh-Sadiq was observed at 111 to 90 minutes before sunrise (about 15.7°-17.4°) in different seasons. Shafaq Ahmer was observed at 76 to 57 minutes after sunset (about 12°-15°), while Shafaq Abyad was observed 98 to 77 minutes after sunset (about 13°-18°) in different seasons."
    - "In Blackburn UK, Subh-Sadiq was observed 123 to 93 minutes before sunrise (about 11°-14.5°) in different seasons. Shafaq Ahmer was observed 81 to 55 minutes after sunset (about 8.3°-10.0°), while Shafaq Abyad was observed 105 to 77 (about 8.3°-13.6°) in different seasons. The whole year observations was done by Ulamaa of Blackburn UK."
  - Curve fit: "All collected observations at different latitudes were plotted against day number of the year. With curve-fit technique, moonsighting.com came up with a function of latitude and seasons."
  - Formula range: "These formulae are good from equator to the 55° latitude."
  - Band: before "between 55° and 66°"; after "At latitudes between 55° and 65°, the rule of Sab'u Lail (1/7th of the night) is used, when other methods give times that become hardship for those areas. This rule is an extrapolation of the Hadith, mentioned in the following paragraph, regarding perpetual day or perpetual night for 24 hours or more. Therefore, we calculate two things for Isha; disappearance of Shafaq and first 1/7th of the night. Isha time is earlier of the two. Similarly, we calculate two things for Fajr; Tabayyan (when morning light in the sky spreads horizontally) and the last 1/7th of the night. Fajr time is later of the two."
  - Polar: before "At latitudes close to or higher than arctic circle …"; after "At latitudes higher than 65°, the sun does not set in summer, or does not rise in winter for a few or number of days. All Muslim scholars agree that whenever there is perpetual day or perpetual night for 24 hours or more, the prayer times during the affected days should be approximated. … "You should approximate the times." [Sahîh Muslim]. Therefore, for such situations, a suggestion by Fuqaha' is to calculate for nearest lower latitudes where the sun sets and rises, and that is used."
- **20110623225032 (June 17, 2011).**
  - New: "For Fajr, Subh Sadiq that is described as (Fajr-al-Mustatir of Ahadith) when morning light in the sky spreads horizontally is used. For Isha, both Shafaq Abyad (Hanafi) and Shafaq Ahmer (Shafi'i, Maaliki, Hanbali) can be calculated by different formulae. These formulae are good up to the 55° latitude."
  - Band text: "Hakim Ul Ummat Ashraf Ali Thanwi writes: 'by splitting the night into 7 parts, a person can eat in the first 6 parts.' (Imadadul Fatawa, vol 2, p98, 12/12/1322Hijri) This is a similar statement to Allamah Shami in Dure Mukhtar. Mufti Shafi Usmani said: 'This statement is presented via assumption. In those countries where Subah Sadiq cannot be clearly distinguished (the UK in the summer months) it is permissible to act upon this advice.' Erring on the side of caution, one should stop eating 10 minutes before this time.' (Imdadul Fatawa, vol 1, p100)."
  - The sentence "This rule is an extrapolation of the Hadith …" is removed.
  - New user email: "Fri, May 27, 2011, from Irfan Khan: … Can you please email me the correct prayer timings for Birmingham, UK."
- **20110727110355 (July 25, 2011).** "This is a similar statement of 1/7th of the night rule by Allamah Shami in Dure Mukhtar. Mufti Shafi Usmani said: 'This statement is presented via assumption, that in those countries where Subah Sadiq cannot be clearly distinguished (the UK in the summer months) it is permissible to act upon this advice. However, erring on the side of caution, one should stop eating 10 minutes before this time.'" The "(Imdadul Fatawa, vol 1, p100)" citation is dropped.
- **20110827031037 (August 16, 2011). Last real capture.**
  - **Removed**, all last seen 20110727110355:
    - the email request box (with "London, ENGLAND - Hanbali");
    - the "Avoid Islamicfinder.org" section, including "Moonsighting.com provides correct schedule upon request through e-mail";
    - the "Avoid On-line Prayer Times Calculation Programs" list, including every DST and time-zone item;
    - all user emails except Tayebi's;
    - the Hizbul Ulama book link `articles/fajr&isha-yam.pdf`, `articles/prayers-uk.pdf` and `articles/ghor-talab.gif`;
    - the Blackburn minute and degree figures;
    - Thanvi's "two or three days a month" sentence.
  - **New definitions list:** "Prayer Times Definition We Use: Fajr: Subh Sadiq (Fajr-al-Mustatir) when morning light in the sky spreads horizontally. Sunrise: When the top of the sun's disk just appears above the horizon. Dhuhr: When the sun begins to decline after reaching its highest point (Zenith) in the sky. 5 minutes after Zenith. Asr: When the length of any object's shadow reaches a factor (usually 1 or 2) of the length of the object plus the length of that object's shadow at Noon. Sunset: Theoretical time when the top of the sun's disk just disappears below the horizon. Maghrib: Actual sunset considering 3 things (variation in refraction, area around the actual latitude and longitude considered, and any downward sloping ground towards sunset direction). 3 minutes after theoretical sunset. Isha: Disappearance of Shafaq; Redness or whiteness."
  - **Karachi figure:** before (20110522060534–20110727110355) "occur at about 16° to 18° in different seasons"; after "occur at about 15° to 16° in different seasons."
  - **Blackburn:** before "A more comprehensive observation for almost entire year …"; after "More observations were done in Blackburn, Lancashire, England (from September 1987 to August 1988) by a group of Ulamaa'. Although these observations were not for 365 days of the year, they covered every season."
  - **Research paragraph:** "A decade long research by Moonsighting.com found that any fixed degree is not correct for Subh-Sadiq or disappearance of Shafaq. The Subh-Sadiq and Shafaq are functions of latitude and seasons (day number of the solar year). All collected observations from different latitudes were plotted against day number of the year. With curve-fit technique, moonsighting.com came up with a function of latitude and seasons. In 2007 independent Muslim scientists in Pakistan also confirmed that degrees fluctuate with seasons."
  - **Shafaq:**
    - Before: "For Isha, both Shafaq Abyad (Hanafi) and Shafaq Ahmer (Shafi'i, Maaliki, Hanbali) can be calculated by different formulae."
    - After: "Moonsighting.com uses the functions of latitude and seasons for calculating Fajr and Isha times based on observations. For Fajr, Subh Sadiq that is considered as (Fajr-al-Mustatir of Ahadith) when morning light in the sky spreads horizontally is used. For Isha, Imam Shafi'i, Imama Maalik, Imam Ahmad bin Hanbal, and two prominent pupils of Imam Abu-Hanifa (Imam Abu-Yusuf and Imam Muhammad) all prefer Shafaq Ahmer. Imam Abu-Hanifa prefers Shafaq Abyad. Moonsighting.com uses a combination of Shafaq Abyad in Winter and Shafaq Ahmer in summer. This is chosen to avoid hardship at higher latitudes, when Shafaq Abyad becomes too late in summer time. Transition from Abyad to Ahmer is used in Spring and fall seasons. However, if one prefers strictly Shafaq Abyad (Hanafi) or strictly Shafaq Ahmer (Shafi'i, Maaliki, Hanbali), it can be calculated also. These formulae are good up to the 55° latitude."
  - **Maghrib:** "should be calculated at least as 3 minutes after theoretical sunset (reporetd in newspapers) for the following considerations: … 3. For major metropolitan cities, the sunset in a 30 mile radius from the point assumed in calculation will vary."
- **20211206054638 onward.** The bot challenge replaces the page. No method content.

### London / 1 August 2011 finding

No capture of prayer.html contains any statement about London, Hizbul Ulama or any UK body adopting a unified timetable, and none mentions 1 August 2011. A whole-corpus search for "unified" finds only 20070220023056's "Unified Global Islamic Calendar" item. The page's UK content in 2010–2011 is:
- Hizbul Ulama's Blackburn observations and book link (to 20110727110355);
- "Cambridge, UK" as the 51.5° example (from 20110522060534);
- "(the UK in the summer months)" in the Usmani quote (from 20110623225032);
- "London, ENGLAND - Hanbali" as a request example (20110522060534–20110727110355);
- emails asking for Guildford, Coleraine and Birmingham times.

The date 1 August 2011 falls between capture 20110727110355 ("Updated July 25, 2011") and capture 20110827031037 ("Updated August 16, 2011"). The August 16 revision is the one that:
- removed the Hizbul Ulama book and address, the `prayers-uk.pdf` link and the Blackburn figures;
- introduced the Shafaq Abyad-winter/Ahmer-summer combination;
- removed all email-request and DST text.

The page gives no reason for these changes.

## (c) Per-topic timelines (exact quotes)

### Fajr
| Period (first to last capture) | Page's text |
|---|---|
| 19990221195144 to 20030628052150 | "Fajr & Isha are calculated for Sun being 15 degrees below horizon, a value adopted by ISNA" (from 19991012043239 also "found that the angle comes closer to 13.5 degrees"; from 20030628052150 "the observed time was closer to corresponding angle of 13.5 degrees") |
| 20031204113435 to 20050322032413 | "Fajr & Isha are calculated for Sun being 18 degrees below horizon." |
| 20050517081501 to 20110827031037 | no fixed degree; "function of latitude and seasons" ("Calculations of Fajr & Isha based on 18° or 15° … are wrong", 20050517081501) |
| 20060516094153 to 20100128054622 | "for areas at or near equator Shafaq disappearance and Subh-Sadiq occurs in 75 minutes or at 18 degrees in all seasons … Subh-Sadiq at higher latitudes is observed at 94 to 122 minutes (14.5 to 10.6 degrees)" |
| 20100728224828 to 20110727110355 | "Subh-Sadiq, in Blackburn UK, was observed 93 to 123 minutes before sunrise" (20110522060534 onward: "123 to 93 minutes before sunrise (about 11°-14.5°)") |
| 20100728224828 to 20110827031037 | Chicago "90 to 111 minutes before sunrise" (20110522060534 onward: "111 to 90 minutes before sunrise (about 15.7°-17.4°)") |
| 20110522060534 to 20110727110355 | Karachi/Tando Adam "Subh-Sadiq and disappearance of White Shafaq occur at about 16° to 18°" |
| 20110827031037 | Karachi/Tando Adam "about 15° to 16°" |
| 20100728224828 to 20110827031037 | "Tabayyan (when morning light in the sky spreads horizontally)" is the Fajr input to the later-of rule at 55–65° (55–66° until 20110318232426) |
| 20110623225032 to 20110827031037 | "Subh Sadiq that is described as (Fajr-al-Mustatir of Ahadith) when morning light in the sky spreads horizontally" ("considered as" in 20110827031037); 20110827031037 definition "Fajr: Subh Sadiq (Fajr-al-Mustatir) when morning light in the sky spreads horizontally." |

### Isha / Shafaq
| Period | Page's text |
|---|---|
| 19990221195144 to 19990427164509 | 15°; "observations … for Subh-e-Sadiq, and disappearance of Shafaq" |
| 19991012043239 to 20030628052150 | 15° ("disappearance of Shafaq" dropped from the ISNA sentence) |
| 20031204113435 to 20050322032413 | 18° |
| 20050517081501 to 20110827031037 | "disappearance of Shafaq for Isha does not occur at any fixed minutes or fixed degree"; function of latitude and seasons |
| 20060516094153 to 20100128054622 | "Shafaq disappears at 66 to 100 minutes (9 to 13.6 egrees) at higher latitudes (like England)" |
| 20090720004402 | first "Shafaq Ahmer" on the page (Tayebi email, St Joseph MI, Isha "around 10:15" with "shafaq ahmar"; kept to 20110827031037) |
| 20100728224828 to 20110727110355 | Blackburn "Shafaq Ahmer occurs … 55 to 81 minutes after sunset … Shafaq Abyad occurs 77 to 105 minutes"; Chicago "57 to 76 … 77 to 98"; "Both Shafaq Ahmer and Shafaq Abyad can be calculated by different mathematical formulae. These formulae are good up to the 55° latitude." |
| 20110522060534 to 20110727110355 | Blackburn "(about 8.3°-10.0°)" Ahmer, "(about 8.3°-13.6°)" Abyad; Chicago "(about 12°-15°)" Ahmer, "(about 13°-18°)" Abyad (Chicago kept in 20110827031037) |
| 20110623225032 to 20110727110355 | "both Shafaq Abyad (Hanafi) and Shafaq Ahmer (Shafi'i, Maaliki, Hanbali) can be calculated by different formulae" |
| 20110827031037 | "Moonsighting.com uses a combination of Shafaq Abyad in Winter and Shafaq Ahmer in summer. … Transition from Abyad to Ahmer is used in Spring and fall seasons. However, if one prefers strictly Shafaq Abyad (Hanafi) or strictly Shafaq Ahmer (Shafi'i, Maaliki, Hanbali), it can be calculated also."; definition "Isha: Disappearance of Shafaq; Redness or whiteness." |

The term "Shafaq General" never appears on prayer.html (whole-corpus search: 0 captures).

### High latitude, 1/7 night, polar handling
| Period | Page's text |
|---|---|
| 19990221195144 to 20030628052150 | ">45 degrees": "1/7th of the night before sunrise for Fajr and 1/7th of the night after sunset for Isha. In some cases, even this is impractical, so the times … are roughly those of nearby latitudes" |
| 20020203211857 to 20021206215653 | (online list) "At latitudes higher than 67.5 degrees, sunrise and sunset may not occur" |
| 20030628052150 to 20110727110355 | (online list) "At latitudes higher than 66.5 …"; "48.5 degrees, the sun does not go 18 degrees below horizon" |
| 20031204113435 to 20050322032413 | "1/7th of the Night Rule … Fajr is sunrise minus 1/7th of the night and Isha is sunset plus 1/7th of the night"; from 20041001083915 "a combination of 18 degrees, 15 degrees, and even 12 degrees"; from 20041230222901 "if the sun does not set at higher latitudes then the times for nearest location, where sun sets, can be used" |
| 20050517081501 to 20110318232426 | "At latitudes close to or higher than arctic circle … a suggestion by Fuqaha', to calculate for nearby lower latitudes where the sun sets and rises, is used." (no 1/7 rule until 20090922052502) |
| 20050517081501 to 20110827031037 | "at latitudes higher than 51.5°, the sun does not go 15° below horizon" |
| 20090922052502 to 20100128054622 | "At latitudes between 55 - 66 degrees, the rule of Sab'u Lail (1/7th of the night) is used … Isha starts at the end of first 1/7th of the night, and Fajr starts at the last 1/7th of the night." |
| 20100728224828 to 20110318232426 | "between 55° and 66° … Isha starts at the time which is earlier of Shafaq calculation or first 1/7th of the night. Similarly Fajr starts at the time which is later of Tabayyan … or the last 1/7th of the night." |
| 20110522060534 to 20110827031037 | "between 55° and 65° … Isha time is earlier of the two. … Fajr time is later of the two."; "At latitudes higher than 65° … a suggestion by Fuqaha' is to calculate for nearest lower latitudes where the sun sets and rises, and that is used." Also "Above 54.5° (e.g., Copenhagen, Denmark) … 12°" |
| 20110623225032 to 20110827031037 | Thanwi ("Imadadul Fatawa, vol 2, p98, 12/12/1322Hijri"), Allamah Shami ("Dure Mukhtar"), Mufti Shafi Usmani ("(the UK in the summer months)", "stop eating 10 minutes before this time") |

Never on prayer.html: "Aqrabul-Bilad", "Aqrabul-Ayyam", "Dar al-Ifta", the 18-hour fasting fatwa, Hammerfest, Oslo, a 60° band, or "Makkah times" (all 0 captures).

### Zuhr, Asr, Maghrib offsets
- **Zuhr.** "5 minutes are added in Noon time for Zuhr" (19990221195144–20011004085946). "5 minutes should be added in Noon time for Zuhr" (20020203211857–20110827031037). "Haraam" (to 20040203144209); "Mamnoo' (Prohobitted)" (20040603164422–20051208073336); "Mamnoo' (Prohibitted)" (20060321063509–20070925050450); "Mamnoo' (Prohibited)" (20080215023105–20110827031037). Definition "5 minutes after Zenith." (20110827031037).
- **Maghrib.**
  - "is calculated as 3 minutes after sunset" (19990221195144–19990427164509).
  - "should be calculated as 3 minutes after sunset" (19991012043239).
  - "should be calculated at least as 1 minutes after sunset … For major metropolitan cities, another 2 minutes should be added" (19991110003800–20001018085152).
  - "should be calculated at least as 3 minutes after sunset" (20010204222000–20110727110355).
  - "at least as 3 minutes after theoretical sunset (reporetd in newspapers)" (20110827031037).
  - Shi'a: "14 minutes after sunset" (20060818182933–20061020114835); "17 minutes after sunset" (20061119055856–20110827031037).
- **Asr.**
  - "Shafei/Maliki Fiqh (Shadow = Length + shadow @ noon) … Hanafi Fiqh (Shadow = twice length + shadow @ noon)" (19990221195144–20001018085152).
  - "Shafei/Maliki/Hambali" (20010204222000–20021206215653).
  - No formula, only "different interpretations by different jurists" (20030628052150–20080513044447).
  - Formulas back with "Ja'friyah … 4/7 of its length (as given to me by a follower of Ayatullah Sistani)" (20081223035751–20110827031037).
  - Definition "a factor (usually 1 or 2)" (20110827031037).

### Delivery (how timetables were produced and delivered)
- **Email request to Khalid Shaukat, the only channel on the page from 19990221195144 to 20110727110355.** Requested details:
  - city name, and "Asr Shafei, or Hanafi, or both", and the Qibla column (1999–2006);
  - "city/State or Country and what school of thought" (20061020114835);
  - "PERPETUAL PRAYER TIMES" warning (20080215023105–20081223035751);
  - subject-line format with examples "Saginaw, Michigan - Hanafi … Tokyo, JAPAN - Shi'aa" (20100128054622–20110727110355), plus "London, ENGLAND - Hanbali" (20110522060534–20110727110355).
- **Request address.** shaukat@moonsighting.com (19990221195144–20100128054622); email@moonsighting.com (20100728224828–20110827031037). From 20110827031037 the address is kept only for booklet requests.
- **"On requests, I have been providing Prayer Schedule all around the world, with 15 degrees."** (19991012043239–20021206215653).
- **"Moonsighting.com provides correct schedule upon request through e-mail, and that does not use any fixed degrees.  It uses a complex formula as a function of Latitudes and Seasons …"** (20051107023034–20110727110355).
- **The page never mentions an online generator or any software download** in any capture. It argues against online calculators, 20020203211857–20110727110355.
- **The only PDF timetables linked** are `articles/UK-PrayerCharts.pdf` / `articles/uk-prayercharts.pdf` / `articles/uk-prayercharts1.pdf` ("Prayer Times for Large Cities in UK", 20070308233702–20101013225925) and `articles/prayers-uk.pdf` (Urdu-click image, 20081223035751–20110727110355).
- **20110827031037 has no timetable request text at all.**

### UK / London / Hizbul Ulama / Blackburn
- "Groups from Pakistan, England, USA, Caribbean Islands, and Australia" (19991012043239–20030628052150).
- Hizbul Ulama UK:
  - "74a Upton Lane, London E7 9LW, Telephone 07866-464040, email: info@hizbululama.com" (20050517081501);
  - "74 Upton Lane, London E7 9LW, Telephone 0786-646-4040, email: info@hizbululama.org.uk" (20051107023034–20101114190900 in the Caution box; 20100728224828–20110727110355 in the Fajr & Isha section).
  - Last mention 20110727110355.
- Book: "Fajar and Isha Time in Britain" written by Molvi Yaqub Miftahi (20051107023034–20061020114835); "Fajar and Isha" (20061119055856); "Fajr and Isha" by Molvi Yaqub Ahmed Miftahi (20070202014744–20110727110355).
- Blackburn:
  - "A more comprehensive observation for the entire year done in Blackburn, Lancashire, England" (20050517081501);
  - "matched  observations with amazing accuracy" (20050517081501–20060321063509);
  - "(from September 1987 to August 1988)" (20100728224828–20110827031037);
  - minute/degree figures (20100728224828–20110727110355);
  - final "Although these observations were not for 365 days of the year, they covered every season." (20110827031037).
- "Dewsbuary UK" (20101013225925–20110827031037). "Cambridge, UK" 51.5° example (20110522060534–20110827031037). "(the UK in the summer months)" (20110623225032–20110827031037).
- "(like England)" in the 2006 figures (20060516094153–20100128054622).
- UK readers' emails: Coleraine "Lt 55.08N Lg6.40W" (20080319094925–20110727110355), Guildford, Surrey (20090720004402–20110727110355), Birmingham (20110623225032–20110727110355).

### DST and time zones
- "Time zone is another input required by the user" (20020203211857–20070202014744 in variants; with `timezone.html` link 20070317081529–20110727110355).
- "The Daylight Saving Times (DST), and its start and end are different in different countries. This information is not available from any single authentic source." (20020203211857 onward; last 20110727110355).
- US/Canada two-time-zone states list (20021012095956–20110727110355).
- "Time difference from GMT is also needed." (20070202014744–20110727110355).
- "Moreover, Congress in USA and Government of Canada have adopted a new DST schedule starting 2007." (20070202014744–20080513044447), replaced by "Moreover, DST changes on different dates every year." (20081223035751–20110727110355).
- "If Daylight Saving Time(DST) is observed in your area, avoid using PERPETUAL PRAYER TIMES, because the dates for DST are different every year." (20081223035751 only). The earlier leap-year-only version appears 20080215023105–20080513044447.
- "These DST dates change frequently by decisions of authorities in many countries, and are not available to users." (20100728224828–20110727110355).
- None of this remains in 20110827031037.

### Named people and organisations (first to last capture)
- Khalid Shaukat (19990221195144–20110827031037, also in meta description).
- ISNA (19990221195144–20110727110355); Dr. Muzammil Siddiqi and Dr. Sayyid Syeed (20051107023034–20110727110355).
- Muslim scientists in North America (19990221195144–20030628052150).
- Hizbul Ulama UK (20050517081501–20110727110355).
- Molvi Yaqub (Ahmed) Miftahi (20051107023034–20110727110355).
- Ulamaa of Blackburn (20050517081501–20110827031037).
- "scientists in Pakistan in 2007" (20070911005515–20110827031037).
- Hakimul-Ummat Ashraf Ali Thanvi/Thanwi (20100728224828–20110827031037); Allamah Shami, Mufti Shafi Usmani (20110623225032–20110827031037).
- Imams Shafi'i, Maalik, Ahmad bin Hanbal, Abu-Hanifa, Abu-Yusuf, Muhammad (20110827031037).
- Follower of Ayatullah Sistani (20081223035751–20110827031037).
- U.S. Geological Survey (20020203211857–20110727110355).
- Islamicfinder.org (20051107023034–20110727110355); Soundvision (20080215023105–20110727110355); Guidedways (20101114190900–20110727110355).
- Email correspondents:
  - Roy Hasan (20061020114835–20110727110355);
  - Abdullah (20070925050450–20110727110355);
  - Mohammad Akhtar (20080215023105–20110727110355);
  - Paramel Nazeer (20080319094925–20110727110355);
  - Bilal Brown and Sakina (20080513044447–20110727110355);
  - Hanan Insyiraah (20090720004402–20110727110355);
  - Abdelkader Tayebi (20090720004402–20110827031037);
  - Mahdi Rahmani (20091228042146–20110727110355);
  - Syed Rizwan Ahmed (20091228042146–20100128054622);
  - Khalid Yaseen, Detroit (20100728224828–20110727110355);
  - Kamil Azman (20100826025114–20110727110355);
  - Mohammad Imran (20101114190900–20110727110355);
  - Abdur-Raheem Norman (20110318232426–20110727110355);
  - Irfan Khan (20110623225032–20110727110355).
- musalman.com search box (19990427164509 only).

### Other prayer-time calculation content
- Twilight definitions (20030628052150 only).
- "Unified Global Islamic Calendar" request option (20070220023056 only).
- Leap-year drift "plus minus 1 or 2 minutes, because of February 29 in leap years" (20080215023105–20081223035751).
- Islamicfinder Narvik example as quoted by the page: "On Jan 8, it is 7:28. On Jan 9, it is 11:14. … On July 20, it is 8:31. On July 21, it is 12:22." These are Islamicfinder's values (20051107023034–20110727110355).
- Khalid Yaseen, Detroit: "most of the city is calling the athan at 11:00 PM, based on what is attributed to the ISNA time chart!" (20100728224828–20110727110355).

## (d) Every linked document and external URL (first to last capture seen)

Documents and method-relevant links:

| href | First | Last | Notes |
|---|---|---|---|
| faq_ps.html ("Frequently Asked Questions" / "Questions & Answers" / "FAQs on Prayer Times") | 19990419193656 | 20021206215653 | |
| mailto:makhtoon@hotmail.com (manuscript "When to Pray Fajr & Isha") | 19991012043239 | 20020610031936 | |
| JS mailto moon7415@hotmail.com (manuscript) | 20021012095956 | 20021206215653 | |
| mailto:shaukat@moonsighting.com (direct link) | 19990221195144 | 20020610031936 | also 20070228233224–20070308233702; "mailto: shaukat@moonsighting.com" (with space) 20070202014744–20070220023056 |
| JS mailto shaukat@moonsighting.com | 20021012095956 | 20100128054622 | |
| JS mailto email@moonsighting.com | 20100728224828 | 20110827031037 | |
| 6monthdays.html | 20010204222000 | 20021206215653 | |
| http://www.ummah.net/astronomy/saltime/ ("Formulae for Prayer Times") | 20010409230832 | 20011004085946 | |
| fajarishainbritain1.pdf ("Fajar and Isha Time in Britain", Molvi Yaqub Miftahi; Hizbul Ulama) | 20051107023034 | 20061020114835 | |
| fajar&isha-a5.pdf | 20061119055856 | 20061119055856 | |
| fajr&isha-yam.pdf | 20070202014744 | 20070228233224 | |
| articles/fajr&isha-yam.pdf | 20070308233702 | 20110727110355 | |
| articles/UK-PrayerCharts.pdf ("Download Prayer Times for Large Cities in UK - pdf") | 20070308233702 | 20070331122828 | |
| articles/uk-prayercharts.pdf | 20070510122654 | 20090822003840 | |
| articles/uk-prayercharts1.pdf ("Click here for Prayer Times for Large Cities in UK") | 20090922052502 | 20101013225925 | |
| articles/prayers-uk.pdf (Urdu-click image) | 20081223035751 | 20110727110355 | |
| images/ghor-talab.gif ("Urdu letter") | 20070911005515 | 20080513044447 | |
| articles/ghor-talab.gif ("Urdu letter - Ghaur Talab") | 20081223035751 | 20110727110355 | |
| narvik.html (Islamicfinder example) | 20070317081529 | 20110727110355 | |
| timezone.html | 20070317081529 | 20110727110355 | |
| qibla.html | 19990221195144 | 20110827031037 | |
| #fajr&isha (in-page) | 20080215023105 | 20110318232426 | |
| prayer-french.html | 20100728224828 | 20101013225925 | |
| prophet_artifacts.html | 20030628052150 | 20101013225925 | |
| http://www.guidedways.com/prayertimes/prayerschedule.php?country=norway&city=Narvik&state=Nordland&prayer=5&asr=1&gmt=1&dst=&latitude=68.4356&longitude=17.4372&year=2010&day=22&dhuhrprayer=1&maghribprayer=1&monthly=1&month=1 | 20101114190900 | 20101114190900 | plain text URL in an email, not an href |
| http://www.guidedways.com/prayertimes/salat_world.php | 20110318232426 | 20110727110355 | plain text URL, not an href |

Site navigation and other hrefs:
- home.html, calendar.html, jokes.html, links.html, moonphoto.html: to 20021206215653.
- moon.html: 19990221195144–19990427164509 and 20010204222000–20021206215653.
- index.html: 19991012043239–20020203211857.
- convert.html: 19990221195144–20001018085152.
- actual.html: 19991012043239–20010204222000.
- quran.html: 19991012043239–20000520040340.
- dont/don_a.html: to 20021206215653.
- solareclipse.html: 20010204222000–20011004085946.
- q&a.html: 20010204222000.
- articles.html, faqs.html: 20010409230832–20021206215653.
- eclipses.html: 20020203211857–20021206215653.
- Image maps: 20000816224322.
- Scripts: menu.js (20030628052150–20081223035751), vmenu.js and mmenu.js (20090720004402), header.js (20090720004402–20110827031037).

Third-party:
- http://www.musalman.net/cgi-bin/webinator.cgi (19990427164509).
- hitbox (19991110003800).
- http://www.muslim-names.co.uk "Baby Names" (20050322032413–20060321063509; commented out to 20061119055856).
- http://www.muslimfriends.com/i/af1628010 (20061020114835–20070331122828; commented to 20101013225925).
- Counters: erols.com (19990221195144–20061020114835), bfndevelopment.com (20061119055856–20070911005515 and 20080215023105–20080513044447), digits.com (20070925050450), leoprotection.com / freehitscounter.org (20081223035751–20100128054622), as-seen-on-tv-store-1.com "TIME LIFE SOFT ROCK" (20100728224828), website-hit-counters.com (20100826025114–20110827031037).
- Google Analytics UA-2625504-1 (20070925050450–20090822003840).

## (e) Contradictions between prayer.html and how-we.html

how-we.html is "Updated March 1, 2024", from `~/athan-research/site-text/www.moonsighting.com/how-we.html.txt`, read in full.

1. **Upper Sab'u Lail band and polar handling.**
   - prayer.html: "At latitudes between 55° and 65°, the rule of Sab'u Lail …" and "At latitudes higher than 65° … a suggestion by Fuqaha' is to calculate for nearest lower latitudes where the sun sets and rises" (20110522060534–20110827031037). Earlier "55 - 66 degrees" (20090922052502–20100128054622) and "55° and 66°" (20100728224828–20110318232426).
   - how-we: "at latitudes between 55degrees and 60degrees, the rule of Sab'u Lail (1/7th of the night), is used" and "at latitudes more than 60degrees,  we slide down to 60degrees and calculate Fajr & Isha using the rule of Sab'u Lail in summer. … In winter, we use research by Moonsighting.com for Subh-Sadiq and Shafaq as functions of latitude and seasons".
   - The band edge (65° vs 60°) and the polar rule both differ. prayer.html never mentions 60°, Oslo, Hammerfest, "Aqrabul-Bilad"/"Aqrabul-Ayyam", Dar al-Ifta or the 18-hour fasting limit.
2. **Seasonal Shafaq rule.**
   - prayer.html 20110827031037: "Moonsighting.com uses a combination of Shafaq Abyad in Winter and Shafaq Ahmer in summer. … Transition from Abyad to Ahmer is used in Spring and fall seasons." The term "Shafaq General" never appears (0 captures).
   - how-we: "Moonsighting.com uses Shafaq Ahmer in summer when nights are short and Shafaq Abyad in winter, when days are short. However, Shafaq General is chosen to avoid hardship at higher latitudes, when Shafaq Abyad becomes too late in summer. Shafaq General uses Shafaq Abyad in Summer and Shafaq Ahmer in Winter. Transition from Abyad to Ahmer is used in Spring and Ahmer to Abyad in Fall."
   - how-we's "Shafaq General uses Shafaq Abyad in Summer and Shafaq Ahmer in Winter" is the reverse of prayer.html's combination, and of how-we's own previous sentence. prayer.html's "Transition from Abyad to Ahmer is used in Spring and fall seasons" also differs from how-we's "Abyad to Ahmer … in Spring and Ahmer to Abyad in Fall". (Separately, how-we's last paragraph repeats prayer.html's version: "Moonsighting.com uses Shafaq Ahmer in summer … Shafaq Abyad in winter … Transition from Abyad to Ahmer is used in Spring and Fall seasons.")
3. **18° comparison clamp.**
   - how-we: "From equator to 55degrees, the 18degrees depression angle calculations are compared with the values given by the functions of latitude and seasons and most favorable values are used, which means; For Fajr, the later of the two and for Isha the earlier of the two."
   - prayer.html never states an 18° comparison in any capture. The only earlier-of/later-of rule on prayer.html compares against 1/7 of the night, and only at 55–65°/66°.
   - From 20050517081501 prayer.html says fixed-degree calculations "are wrong"; 18° appears only as the equator equivalent ("The 75 minutes at equator is equivalent to about 18° sun's position below horizon", 20100728224828–20110827031037).
4. **What Fajr and Tabayyan mean.**
   - prayer.html equates them. Fajr: "Subh Sadiq (Fajr-al-Mustatir) when morning light in the sky spreads horizontally" (20110827031037). Tabayyan: "(when morning light in the sky spreads horizontally)" (20100728224828–20110827031037), used only in the 55–65° band.
   - how-we distinguishes them: "Subh Sadiq (Fajr-al-Mustatir) when morning light in the sky starts spreadings horizontally. At high latitudes, where it becomes hardship to pray Fajr too early, (Tabayyan) when morning light in the sky has spread is used." It also says "We originally used Subh-Sadiq as a little bit earlier than Fajr-al-Mustatir of Ahadith just as a precaution. but recently … started using the spread of light horizontally (We call it "Tabayyun") as Subh-Sadiq."
   - prayer.html never uses the spelling "Tabayyun" (0 captures) and never states the earlier-precaution history.
5. **Usmani quotation.**
   - prayer.html: "(the UK in the summer months) it is permissible to act upon this advice. However, erring on the side of caution, one should stop eating 10 minutes before this time." (20110727110355–20110827031037). The 20110623225032 version cites "(Imdadul Fatawa, vol 1, p100)".
   - how-we: "(e.g., Northern Europe in the summer months) it is permissible to act upon this advice". The 10-minute caution is absent. how-we also dates Thanwi "12/12/1322 Hijri" and cites "Durre Mukhtar"; prayer.html has "12/12/1322Hijri" and "Dure Mukhtar".
6. **Asr and Isha definitions.**
   - prayer.html 20110827031037: Asr "a factor (usually 1 or 2)". how-we: "The factor is 4/7 for Shi'aa; 1 for Shafi'i, Maaliki, Hanbali, and 2 for Hanafi." Both carry the 4/7 Ja'fari rule in the long Asr paragraph, so this is a difference in definition wording only.
   - Isha, prayer.html 20110827031037: "Disappearance of Shafaq; Redness or whiteness." how-we: "Redness for Shafi'i, Maaliki, and Hanbali, and Shi'aa; whiteness for Hanafi. At high latitudes a combination of red and white shafaq criteria is used."
7. **Observation sites.**
   - prayer.html (20101013225925–20110827031037): "[Riyadh (Saudi Arabia), Tando Adam (Pakistan), South Africa, New Zealand, Australia, Miami FL, Buffalo NY, Chicago IL, San Francisco CA, Tempe AZ, Houston TX,  and Washington DC (USA), Toronto (Canada), and Dewsbuary UK]" plus Blackburn and Karachi.
   - how-we: "[e.g., Riyadh (Saudi Arabia), Karachi and Tando Adam (Pakistan), Durban (South Africa), Auckland (New Zealand), Sydney NSW (Australia), Miami FL (USA), Washington DC (USA), Toronto (Canada), High Wycombe (UK), Dewsbury (UK), and Blackburn (UK)]".
   - how-we drops Buffalo, Chicago, San Francisco, Tempe and Houston, and adds High Wycombe (never on prayer.html).
   - The quantitative observation ranges (Chicago, Blackburn, Karachi degrees) exist only on prayer.html. Its last Karachi figure "about 15° to 16°" contradicts its own previous "about 16° to 18°".
8. **Where the functions apply.**
   - prayer.html: "These formulae are good up to the 55° latitude" (20100728224828–20110827031037).
   - how-we: "These formulas are good up to the 55degrees latitude", but also "In winter, we use research by Moonsighting.com for Subh-Sadiq and Shafaq as functions of latitude and seasons" above 60°. That applies the functions beyond 55°, which prayer.html never does.
9. **England degrees history.** how-we: "in the last few years Ulamaa' in England have switched from 18degrees to 15degrees or 12degrees or even 9degrees." prayer.html has no such statement.
10. **Delivery.**
    - prayer.html's only channel was an email request (1999–July 2011), and it campaigned against online calculators (20020203211857–20110727110355).
    - how-we lists "Moonsighting.com method for prayer times is used by the following resources: 1. https://github.com/PrayerTimeResearch/PrayerTimeAPI 2. https://github.com/islamic-network/prayer-times-moonsighting".
11. **Consistent between the two pages (no contradiction):**
    - Zuhr 5 minutes after zenith; Maghrib 3 minutes after theoretical sunset; Shi'a Maghrib 17 minutes;
    - the 48.5°/51.5°/54.5° example sentences (identical wording apart from degree symbols);
    - the Qibla paragraph; the Tayebi St Joseph MI email (how-we adds "I, Abdelkader" and a second email from Rafik Ouared, Pampigny, Switzerland, 2016, not on prayer.html).
    - Both pages say the seasonal functions came from a curve fit of observations against "day number of the year".
