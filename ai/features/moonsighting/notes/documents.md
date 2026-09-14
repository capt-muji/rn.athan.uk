# moonsighting.com documents: full reading notes

Reader: document-reading researcher (deep-research session on Khalid Shaukat's moonsighting.com prayer-time method).
Date read: 2026-09-14.
Sources: `~/athan-research/pdfs/live/` (live www.moonsighting.com) and `~/athan-research/pdfs/wayback/` (Wayback Machine `id_` raw captures). Metadata comes from `~/athan-research/pdfs/manifest.json` and from each file's embedded PDF/OLE properties.
Extraction: PDFs with pymupdf `get_text()` (per page, into `~/athan-research/doc-reading/text/`). Tables and any page whose text layer came out jumbled were rendered to PNG (`~/athan-research/doc-reading/png/`) and read as images. `.doc` files went through macOS `textutil -convert txt`.

Page references: "PDF p.N" is the Nth page of the file. Where a book prints its own page numbers, they are given as "printed p.M".
Quotation rule: numbers and wording are quoted exactly as printed, typos included. Anything I could not read or verify is marked **UNVERIFIED** or **UNREADABLE**.

---

<!-- SECTIONS-BELOW -->

# PART A. Prayer-time documents

## A1. "Fajar and Isha", Yaqub Ahmed Miftahi (Hizbul Ulama UK), Oct 2005, 2006 build: `articles/fajr&isha-yam.pdf`

- **Files:** `pdfs/wayback/articles__fajr&isha-yam.pdf` and `pdfs/wayback/fajr&isha-yam.pdf`, byte-identical (MD5 equal, 555,208 bytes).
- **Sources:** `https://web.archive.org/web/20070410171730id_/http://moonsighting.com:80/articles/fajr&isha-yam.pdf` (capture 2007-04-10). The root copy is capture 20070206013323.
- **PDF metadata:** title "Fajar&IshainBritain", author "YMiftahi", created 2006-12-07 09:50:02Z, Acrobat Distiller 7.0.5.
- **Book:** 123 PDF pages (printed pp. 1–122). Title page: "FAJAR AND ISHA By Yaqub Ahmed Miftahi, Ramadan 1426/ October 2005, Hizbul Ulama U.K., 74 Upton Lane, London, E7 9LW".
- **Read:** 123/123 pages, the full text layer. Tables 3–6 (PDF pp. 105, 116, 118, 119) were also read as rendered images, because the text layer scrambles their cells.
- **Other editions:** two exist. The first posting, Oct 2005, is `fajarishainbritain1.pdf`; an intermediate build, Nov 2006, is `fajar&isha-a5.pdf`. See A2 for the diffs.

### Summary
The book is a Hanafi, Deobandi-leaning argument that Fajr and Isha must rest on naked-eye observation (Mushahadah), never on fixed solar-depression degrees. Its evidence is the year-long Blackburn observation of Muharram 1408 to Muharram 1409 (Sept 1987 to Aug 1988), run by Hizbul Ulama UK.

Chapters: 1 Background; 2 Virtues of Salat; 3 Shariah on Fajr; 4 Shariah on Isha; 5 Determining the times (Tables 1–2); 6 "Science is not infallible"; 7 What the Observatory and experts say about twilight; 8 Observations around the world; 9 Mushahadah of Hizbul Ulama UK (Tables 3–6).

Chapter 6 (printed pp. 32–46) is polemic with no prayer-time data. It covers Darwin, the Big Bang, Ghazali and Shah Waliullah, and moonsighting analogies.

### Fajr/Isha definitions and model statements (exact quotes)
- **Fajr (printed p.14):** "the time at which whiteness in the sky appears horizontally, on the length and breadth of the horizon known within Shariah as Subha Sadiq or True Dawn." Thanvi (Bahishti Zewar) is quoted: "From the time that this broad whiteness becomes visible, the time of Fajar Salat commences".
- **Isha (printed pp. 19–20, 95, 99):** Abu Hanifah uses Shafaqe Abyadh; the other Imams and the Sahibayn use Shafaqe Ahmar. Hanafis may take Ahmar only under Haraj: "No Hanafi Alim however is likely to permit Isha any earlier than the time of Shafaqe Ahmar."
- **The book's own conclusion (printed p.10):** "the prayer timings do not conform to any given degrees but fluctuate throughout the year between approximately 12 to 16 degrees." Printed p.80 repeats it: "Hizbul Ulama UK's Mushahadah which came out roughly equating to 12-16 degrees for Subha Sadiq."
- **Shaukat quoted, citing www.moonsighting.com (printed p.63):**
  - "…for areas at or near equator shafaq disappearance and subh sadiq occurs in 75 minutes or at 18 degrees in all seasons. As you move to other latitudes, subh sadiq and disappearance of shafaq occurs at different degrees in different seasons. Shafaq disappears at 66 to 100 minutes (9 to 13.6 degrees) at higher latitudes (like England) in different seasons. Subh sadiq at higher latitudes is observed at 94 to 122 minutes (14.5 to 10.6 degrees) in different seasons"
  - Also (printed p.62): "People in different locations around the globe have made observations about Subha Sadiq and the results are anywhere between 13.5 degrees to 18 degrees".
- **Shaukat quoted (printed pp. 78–79):**
  - "Some use 17, 19 or even 21 degrees. Others use 90 minutes, 75 minutes or 60 minutes criteria. Research by moonsighting.com shows that any fixed degree is not correct … Many places in the world {Riyadh, (Saudi Arabia), Tano Adam, (Pakistan), South Africa, New Zealand, Buffalo (New York), Toronto (Canada)}, have done limited observations that are misleading to apply for the entire year".
  - "Most places in the world do not follow 18 degrees. What they follow is 1 hour and 30 minutes. When checked out for suns position, it comes out about 18 degrees, only at latitudes near equator. At high latitudes it varies quite a bit from 12 degrees to 18 degrees".
- **Shaukat on the Blackburn data (printed p.89):** "A decade long research by Moonsighting.com found that the Subha or disappearance of Shafaq is a function of latitude and seasons. When this function is checked against round the year observations of Blackburn, UK, the calculations matched observations with amazing accuracy."
- **The book prints no formula or coefficients** for Shaukat's function. It only asserts that the function exists and matched Blackburn.
- **Omar Afzal, Khalid Shaukat and A. Imam, "When to Pray Fajr and Isha?" (summarised printed p.72):**
  1. "Brightness decreases after sunset almost linearly until the sun reaches 11 Degrees"
  2. "at 13.5 degrees the 'limiting night value' is reached"
  3. "The change in illumination from 13 to 18 degrees is so negligible that, without instruments that were only available from the 1940's, the change would not make any appreciable difference to the naked eye".
  (The 2005 edition words point 3 differently and adds a point 4 about 12 degrees; see A2.)
- **Table 1 (printed p.26), modern methods:**
  | Method | Fajr | Isha |
  |---|---|---|
  | Karachi | 18 | 18 |
  | "Various" | 15 | 15 |
  | MWL | 18 | 17 |
  | Umm al-Qura | 19 | "90 minutes after the Sunset Prayer 120 minutes (in Ramadan only)" |
  | Egyptian | 19.5 | 17.5 |
- **Table 2 (printed p.27), medieval astronomers, Fajar/Shafaq in degrees:**
  | Astronomers | Fajar | Shafaq |
  |---|---|---|
  | Al Biruni | 15-18 | 16-18 |
  | Al Qaini | 17 | 17 |
  | Ibn Yunus, Al Khalili, Ibn Al Shatir, Tusi, Mardeni, "All Muwaqits of Syria, Maghreb, Egypt, Turkey, since 15th C" | 19 | 17 |
  | Habash, Muadh, Ibn Al Haithim | 18 | 18 |
  | Al Marrakushi, Makkah, Tunis, Yemen | 20 | 16 |
  | Al Moeti | 19 | 18 |
  | Ibn Riqam | 19 | 19 |
  | Chagmini, Barjandi, Kamili | 15 | 15 |

  (Table 2 is laid out differently in the 2005 edition; see A2.)
- **RGO sheet quoted (printed p.55):** "There is no precise definition of "dawn". If it is interpreted as the time of "first light", dawn corresponds to a depression between 18 and 12 degrees but it is not possible to be more precise" (RGO Astronomical Information Sheet No. 7, Yallop & Hohenkerk). Yallop reportedly suggested, for Bolton, "setting Subha Sadiq only half an hour before sunset!" The book prints "sunset" there, then "sunrise" on printed p.56.

### Observation data (Blackburn and others)
- **Other observations cited (printed pp. 80–83):**
  - Tando Adam, Pakistan, 11–13 June 1970 (Mufti Shafi', Mufti Rashid Ahmed Ludhianvi and 11 ulama): faint light at 4.00AM, "similar to Subha Kadhib"; "Subha Sadiq itself was observed at 4.17AM". Their fatwa: 18-degree charts show Subh Kadhib, so call Adhan "at least 20 minutes later".
  - Ludhianvi: further observations on 23–24 Dec 1971.
  - A. Latiff: nine observations, Apr 1973 to Mar 1975, "seven in total" practical; eight in Pakistan, one in Saudi Arabia; concluded "much nearer to 18 Degrees".
  - Chicago 1985: "Subha Sadiq fell between 13 to 15 degrees". Buffalo, Toronto, Montreal, San Francisco, Tempe, Houston and Washington DC: "13 to 15 degrees". Eastern Australia: "13/14 degrees".
  - Riyadh: whole-year observations "by a group with Sheikh Abdul Aziz Fauzan revealed that Subha Sadiq occurred at about 15 degrees and not the 19 degrees".
  - UK: Molana Manzoorul Haq and Mufti Abdul Baqi each confirmed "12 degrees". Molana Y.I. Qasmi Kawiwala of Dewsbury advocates 18 degrees.
- **Blackburn Mushahadah (printed pp. 88–114):**
  - Run "during Muharram 1408 to Muharram 1409 (September 1987 to August 1988)", with observation "attempted for each and every day of the year".
  - Main observers: Yaqub Ahmed Miftahi, "the late Qari Mohammed Suleman RA, Imam of Masjid Anisul Islam and late Molana Ismail Kantharia RA"; Molana Ismail Manubari (Darul Uloom Bharuch) for the first seven months.
  - They observed: 1 First Light; 2 spreading of first light (Tabayyun); 3 end of Shafaqe Ahmar; 4 end of Shafaqe Abyadh; plus sunrise and sunset positions.
- **Meeting 1:** Masjid Anisul Islam, Troy Street, Blackburn, "Saturday 15th Shaban 1408 (2 April 1988)", under Molana Musa Karmadi (Ameer, Hizbul Ulama UK) and Molana Ubaidurrahman Camelpuri (Jamiatul Ulama Bartaniyah; Central Moonsighting Committee of GB). Resolutions:
  1. Mushahadah is the original basis.
  2. Complete the remaining five months.
  3. UK Muslims to prepare timetables from the seven-month chart "forthwith".
  4. The unobserved five months to be fixed by Takdir, temporarily.
  5. Unobserved days to be filled by "Takdir of Akrabul Ayyam".
- **Meeting 2:** "Monday 24 JamaDilAwwal 1409 Hijri (2 January 1989)". Findings:
  - Subha Kadhib seen only on 2 and 6 May.
  - Summer gaps "much wider".
  - A "vapoury" arc from end of May to 6 June.
  - Mid-June: Ahmar disappeared but whiteness persisted all night.
  - May/June Tabayyun took "from 20 minutes to over one hour and fifteen minutes".
- **Meeting 2 resolutions (printed pp. 113–114):**
  1. "The beginning time of Fajar be determined by Akrabul Ayyam for those days where the whiteness of Isha merged with the light of morning".
  2. "For May and June Fajar beginning time be set at the recorded time of Tabayyun".
  3. "During summer months, due to Haraj, and as permitted by the Sahibayn … Isha time be phased in using the disappearance of the red afterglow, Shafaqe Ahmar, as a basis, and towards the end of summer, phase out towards Shafaqe Abyadh."
- **Method for other cities (printed p.109):** the durations are applied, not clock times. "we have measured the gap between Subha Sadiq and sunrise … and advocated the application of that length in time. Similarly, for determining Isha we have measured the gap between sunset and Shafaq … in a town where sunrise was 5.15am, Subha Sadiq would be set at 3.15am."
- **Software (printed p.114):** "Brother Mohammed Arshad Baig … has kindly produced a computer programme which automatically works out the times of Subha Sadiq if you enter the time of sunrise for your town/city, and the time of Isha if you enter the time of sunset". It also points to the directory "Salat Timetables for Towns and Cities in the UK", with requests to "Brother Khalid Shaukat, shaukat@moonsighting.com for a timetable for your location." That sentence appears only in this 2006-12 build; see A2.

**Table 4 (PDF p.116, printed p.115), "Summary Observation Record", Blackburn "Longitude W 02.29 Latitude N53.45".** Durations after sunset (Ahmar, Abyad) or before sunrise (Subha Sadiq):

| Month | Shafaqe Ahmar | Shafaqe Abyad | Subha Sadiq |
|---|---|---|---|
| Muharram/Safar 1408 (September 1987) | 55m to 1hr | 1hr 20m to 1hr 22m | 1hr 22m to 1hr 26m |
| Safar/RabiAlAwwal 1408 (October 1987) | 58m to 1hr 8m | 1hr 15m to 1hr 25m | 1hr 25m to 1hr 31m |
| RabiAW/RabiAlThani 1408 (November 1987) | 1hr 8m | 1hr 12m to 1hr 28m | 1hr 32m to 1hr 45m |
| RabiAT/JamadilAwwal 1408 (December 1987) | 53m to 1hr 20m | 1hr 17m to 1hr 40m | 1hr 39m |
| JamA/JamadilThani 1408 (January 1988) | 50m to 1hr 06m | 1hr 31m to 1hr 38m | Unable to observe successfully |
| JamT/Rajab 1408 (February 1988) | Unable to observe successfully | 1hr 19 m | 1hr 37m to 1hr 39m |
| Rajab/Shaban 1408 (March/April 1988) | 56m | 1hr 25m | 1hr 37m |
| Shaban/Ramadan 1408 (April 1988) | Unable to observe successfully | 1hr 24m to 1hr 27m | 1hr 35m |
| Ramadan/Shawal 1408 (May 1988) | 57m to 1hr 15m | 1hr 55m to 3hrs 16m | 1hr 33m to 1hr 44m ** |
| Shawal/ZulQaida 1408 June 1988 # | 1hr 21m to 1hr 24m * | 3hr 7m on 5 June * | 1hr 43m to 1hr 54m ** |
| ZulQ/ZulHajja 1408 (July 1988) *** | Unable to observe successfully | Unable to observe successfully | Unable to observe successfully |
| ZulH/Muharram 1409 (August 1988) | 1hr 07m to 1hr 08m | 2hr 11m to 2hrs 12m | 1hr 23m to 1hr 24m |

Table 4 notes (PDF p.117):
1. The Subha Sadiq column is the time from first light to sunrise; the Ahmar and Abyadh columns are times from sunset.
2. "* 6-11 June unable to successfully observe both Shafaqe Ahmar and Shafaqe Abyadh".
3. "# On 12 and 13 June conditions of night - Shafaqe Abyadh - did not occur … Shafaqe Ahmar was however observed".
4. "** Months of May/June only, the Tabayyun time of Fajar is shown".
5. "*** Whole of July was a rainy month".
6. "Subha Kadhib was observed on two days only- 2nd and 6th May".

Worked examples in the book: 6 June sunrise 4.30am, deduct "2 hours", giving 2.30am. 25 February sunset 5.30pm, add "1 hour and 30 minutes", giving 7.00pm.

**Table 5 "TIME TABLE OF SUBHA SADIQ IN UK" (PDF p.118, printed p.117).** Hours-minutes before sunrise, transcribed cell by cell from the page image. "-" is printed for all other days; the book gives no interpolation rule.

| Day | JAN | FEB | MAR | APR | MAY | JUN | JUL | AUG | SEP | OCT | NOV | DEC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1-40 | 1-40 | 1-40 | 1-35 | 1-41 | 1-57 | 1-59 | 1-45 | 1-35 | 1-31 | 1-40 | 1-45 |
| 2 | - | - | - | - | - | 1-58 | 1-58 | - | - | - | - | - |
| 3 | - | - | - | - | 1-42 | - | - | 1-44 | - | - | - | - |
| 4 | - | - | - | - | - | 1-59 | 1-57 | - | - | - | 1-41 | - |
| 5 | - | - | - | - | 1-43 | - | - | 1-43 | - | 1-32 | - | - |
| 6 | - | - | - | - | - | 2-00 | - | - | - | - | - | - |
| 7 | - | - | - | - | 1-44 | - | 1-56 | - | - | - | 1-42 | - |
| 8 | - | - | - | - | - | 2-01 | - | 1-42 | - | 1-33 | - | - |
| 9 | - | - | - | - | 1-45 | - | 1-55 | - | - | - | - | - |
| 10 | - | - | - | - | - | 2-02 | - | - | - | - | 1-43 | - |
| 11 | - | - | - | - | 1-46 | - | - | 1-41 | - | 1-34 | - | - |
| 12 | - | - | - | - | - | 2-03 | 1-54 | - | - | - | - | - |
| 13 | - | - | - | - | 1-47 | 2-04 | - | - | - | - | 1-44 | - |
| 14 | - | - | - | - | - | - | 1-53 | 1-40 | - | 1-35 | - | - |
| 15 | - | - | - | - | 1-48 | - | - | - | - | - | - | - |
| 16 | - | - | - | - | - | - | - | - | 1-34 | - | 1-45 | 1-44 |
| 17 | - | - | - | - | 1-49 | - | 1-52 | 1-39 | - | 1-36 | - | - |
| 18 | - | - | - | 1-36 | - | - | - | - | - | - | - | - |
| 19 | - | - | - | - | 1-50 | - | 1-51 | - | 1-33 | - | - | - |
| 20 | - | - | 1-39 | - | - | 2-03 | - | 1-38 | - | - | - | 1-43 |
| 21 | - | - | - | 1-37 | 1-51 | - | - | - | - | 1-37 | - | - |
| 22 | - | - | 1-38 | - | - | - | 1-50 | - | 1-32 | - | - | - |
| 23 | - | - | - | - | 1-52 | 2-02 | - | 1-37 | - | 1-38 | - | - |
| 24 | - | - | - | 1-38 | 1-53 | - | 1-49 | - | - | - | - | - |
| 25 | - | - | - | - | 1-54 | - | - | - | 1-31 | - | - | - |
| 26 | - | - | 1-37 | - | - | 2-01 | 1-48 | 1-36 | - | 1-39 | - | 1-41 |
| 27 | - | - | - | 1-39 | 1-55 | - | - | - | - | - | - | - |
| 28 | - | - | 1-36 | - | - | 2-00 | 1-47 | - | 1-30 | - | - | - |
| 29 | - | - | - | - | 1-56 | - | - | 1-35 | - | 1-40 | - | 1-40 |
| 30 | - | - | - | 1-40 | - | - | 1-46 | - | - | - | - | - |
| 31 | - | - | 1-35 | - | 1-57 | 1-59 | - | - | - | - | - | - |

Oddities, as printed:
- A value appears against "JUN 31" (1-59).
- The minimum is 1-30 (28 Sep); the maximum is 2-04 (13 Jun).
- From mid-March to end-April the values rise, from 1-35 (31 Mar) to 1-40 (30 Apr).
- May and June show Tabayyun, per the resolution.

**Table 6 "TIME TABLE OF ISHA IN UK" (PDF p.119, printed p.118).** Hours-minutes after sunset, transcribed from the page image:

| Day | JAN | FEB | MAR | APR | MAY | JUN | JUL | AUG | SEP | OCT | NOV | DEC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1-40 | 1-38 | 1-29 | 1-20 | 1-08 | 1-19 | 1-15 | 1-07 | 1-14 | 1-21 | 1-31 | 1-40 |
| 2 | - | - | - | - | 1-05 | 1-20 | - | - | - | - | - | - |
| 3 | - | 1-37 | 1-28 | 1-19 | - | - | - | - | - | 1-22 | 1-32 | - |
| 4 | - | - | - | - | 1-00 | - | 1-14 | - | 1-15 | - | - | - |
| 5 | - | 1-36 | 1-27 | - | - | 1-21 | - | - | - | - | 1-33 | - |
| 6 | - | - | - | - | - | - | - | 1-08 | - | - | - | - |
| 7 | - | 1-35 | 1-26 | - | 1-05 | - | 1-13 | - | 1-16 | 1-24 | 1-34 | - |
| 8 | - | - | - | - | - | - | - | - | - | - | - | - |
| 9 | - | 1-34 | 1-25 | 1-18 | 1-08 | 1-22 | - | - | - | - | 1-35 | - |
| 10 | - | - | - | - | - | - | 1-12 | - | - | - | - | - |
| 11 | - | - | - | - | 1-10 | 1-23 | - | 1-09 | 1-17 | - | - | - |
| 12 | - | - | - | - | - | - | - | - | - | - | - | - |
| 13 | - | 1-33 | 1-24 | - | 1-13 | 1-24 | 1-11 | - | - | 1-26 | 1-36 | - |
| 14 | - | - | - | - | - | - | - | - | - | - | - | - |
| 15 | - | - | - | - | - | - | - | - | 1-18 | - | - | - |
| 16 | - | - | - | - | 1-14 | 1-23 | 1-10 | 1-10 | - | - | - | - |
| 17 | - | 1-32 | 1-23 | 1-17 | - | - | - | - | - | - | 1-37 | - |
| 18 | - | - | - | - | - | 1-22 | - | - | - | - | - | - |
| 19 | - | - | - | - | 1-15 | - | 1-09 | - | - | - | - | - |
| 20 | - | - | - | - | - | - | - | - | - | - | - | - |
| 21 | - | 1-31 | 1-22 | - | - | 1-21 | - | 1-11 | 1-19 | 1-28 | 1-38 | - |
| 22 | - | - | - | - | 1-16 | 1-20 | 1-08 | - | - | - | - | - |
| 23 | - | - | - | 1-16 | - | - | - | - | - | - | - | - |
| 24 | - | - | - | - | - | 1-19 | - | - | - | - | - | - |
| 25 | - | 1-30 | 1-21 | - | 1-17 | - | 1-07 | 1-12 | 1-20 | 1-30 | 1-39 | - |
| 26 | - | - | - | 1-15 | - | - | - | - | - | - | - | - |
| 27 | - | - | - | - | - | 1-18 | - | - | - | - | - | - |
| 28 | - | - | - | - | 1-18 | - | 1-06 | - | - | - | - | - |
| 29 | - | 1-29 | 1-20 | 1-13 | - | 1-17 | - | 1-13 | - | - | 1-40 | - |
| 30 | - | - | - | - | - | 1-16 | - | - | - | - | - | - |
| 31 | - | - | - | 1-10 | 1-19 | - | - | - | - | - | - | - |

Oddities, as printed:
- A value appears against "APR 31" (1-10).
- The minimum is 1-00 on 4 May. The curve dips from 1-20 (1 Apr) to 1-00 (4 May), then climbs to 1-24 (13 Jun) and falls to 1-06 (28 Jul). This matches the "phase in Ahmar" resolution.
- Winter peaks at 1-40 (1 Jan, 29 Nov, 1 Dec). Only 1 Jan and 1 Dec are printed for those months.

### High latitude (printed pp. 102–104)
- "The whole land mass of Britain is within the range of 50-60 degrees Latitude and it is not until 66 degrees Latitude when the Arctic Circle is reached and special circumstances apply." The Hadith Dajjal (fixing times by the clock) is said not to apply to the UK.
- Takdir methods named and rejected for the UK: "one hour after Maghrib, Akrabul Ayyam, Akrabul Balad, Aadal Ayyam, Tansifullayl" (printed p.99).
- "Persisting twilight" is explained as meaning only that the sun does not reach 15 or 18 degrees; it does not mean that Shafaq never ends.
- **Table 3 (PDF p.105), "Source: www.moonsighting.com":**
  | Latitude | Place | Miles from pole | Sun below horizon | Sun above horizon | Days sun rises and sets |
  |---|---|---|---|---|---|
  | 66:30N | Arctic Circle | 1575 | 17 Dec-26 Dec | 29 May-13 July | 308 |
  | 70:00N | Dead Horse, Alaska | 1400 | 25 Nov-16 Jan | 17 May-27 July | 240 |
  | 80:00N | Franz Josef Land | 700 | 21 Oct-19 Feb | 14 Apr-19 Aug | 115 |
  | 84:00N | northern Greenland | 420 | 10 Oct-2 March | 2 Apr-9 Sept | 60 |
  | 89:00N | – | 70 | 27 Sept-15 March | 20 March-21 Sept | 10 |
  | 89:45N | – | 20 | 26 Sept-17 March | 18 March-23 Sept | 2 |

### UK practice criticised (printed pp. 87, 94–99)
- Mosques using 15 degrees, 18 degrees, "Isha one hour after Maghrib all year round", or one hour "only during the summer".
- The book calls both hour-based methods impermissible. They rest on misreadings of fatwas by Molana Zafar Ahmed Thanvi ("about 70 years ago") and Mufti Yahya, Mazahirul Uloom ("25 years ago"), which assumed Ahmar ends one hour after sunset.
- Mufti Wali Hasan Tonki and Molana Yusuf Binori are quoted: at "latitudes of 45 or over" Hanafis may use Ahmar.

## A2. The two other editions of the Miftahi book, and what changed

| File | Wayback capture | PDF metadata | Pages | Read |
|---|---|---|---|---|
| `pdfs/wayback/fajarishainbritain1.pdf` | 20060111060751, from `/fajarishainbritain1.pdf` | title "Fajar&IshainBritain", author YMiftahi, created **2005-10-31**, Distiller 6.0 | 68 (A4) | text layer 68/68; pp.1, 16, 40, 64, 65, 66 also as images |
| `pdfs/wayback/fajar&isha-a5.pdf` | 20061119060551, from `/fajar&isha-a5.pdf` | created **2006-11-15**, Distiller 7.0.5 | 123 (A5) | text layer 123/123 |

The 2005 edition's title page reads "FAJAR AND ISHA TIME IN BRITAIN By Molvi Yaqub Miftahi, Hizbul Ulama, UK". Its running head is "Fajar and IshaTime in Britain".

**Method.** I ran a word-level `difflib` diff of each edition against the 2006-12-07 build (A1), in three passes:
1. Raw.
2. Normalised: case, punctuation, running heads and bare page numbers removed.
3. Numbers only.

Every non-equal hunk was read. The files are `doc-reading/diff__*`, `diffnorm__*` and the numeric output quoted below. Similarity: 2005 vs 2006-12 ratio 0.971, 133 normalised hunks; 2006-11 vs 2006-12 ratio 0.995, 28 hunks.

The Urdu front matter (A3, printed p.358) confirms the history: the English book has been on moonsighting.com "since Ramadan 1426 / October 2005", was corrected twice, and received additions before printing in Jan 2007.

### Substantive changes, in order of relevance
1. **Blackburn meeting date.**
   - 2005: "Saturday 15th Shaban 1408 (**12** April 1988)".
   - 2006-11 and 2006-12: "(**2** April 1988)". The Urdu 2007 front matter also has 2 April 1988.
   - No other change to the agreement text beyond wording: "Hazrat" added before Camelpuri, "Cambelpuri" corrected to "Camelpuri", "cross examination" shortened to "examination".
   - The 2005 edition adds "(See page 46 above, Para's 4 and 5)" after the Tabayyun resolution.
2. **Shaukat's minutes-and-degrees quote** ("Shafaq disappears at 66 to 100 minutes (9 to 13.6 degrees) at higher latitudes (like England) … Subh sadiq … 94 to 122 minutes (14.5 to 10.6 degrees)") is **absent from the 2005 edition**. It is present from 2006-11. The only move between 2006-11 and 2006-12 is where the "(www.moonsighting.com)" citation sits. The 2005 edition calls him "Dr Khalid Shaukat"; later builds drop "Dr".
3. **"Technical Observations by Omar Afzal Et Al"**, verified on the 2005 page image, PDF p.40:
   - 2005 and 2006-11: "3. The change in illumination from 15 degrees to 18 is negligible / 4. That at 12 degrees, the illumination of the sky is so dark that the marine horizon can no longer be seen".
   - 2006-12: "3. The change in illumination from 13 to 18 degrees is so negligible that, without instruments that were only available from the 1940's, the change would not make any appreciable difference to the naked eye". Point 4 is removed.
4. **Table 2 (medieval degrees).**
   - 2005 (image, PDF p.16) is laid out "FAJAR / END OF SHAFAQ / ASTRONOMERS/MUWAQITS": 17/17 "Al Qaini, Al Biruni and others"; 18/18 "Al-Biruni, Habash, Muadh, Ibn Al Haithim"; 19/17 Ibn Yunus…"since 15th Century"; 20/16 "Al Marrakushi, in Makkah, Tunis, Yemen"; 19/18 Al Moeti; 19/19 Ibn Riqam; 15/15 Chagmini, Barjandi, Kamili. Source: "(Source: Article, "When to Pray Fajr and Isha? By Omar Afzal, Khalid Shaukat and A. Imam)".
   - 2006-11: Biruni gets his own row, "15/18 16/17/18". Source becomes "…A. Imam & also Y. Miftahi, Bartaniya Me Isha Ka Sahih Waqt)".
   - 2006-12: "15-18 16-18". The source adds "Mufti R.A. Ludhianvi, Subha Sadiq, Ahsanul Fatawa".
5. **Thanvi and 18 degrees = Subha Kadhib.** The whole passage ("the time gap between sun set and setting of shafaqe abyadh is the same as the time gap between subha kadhib (18 degrees) and sun rise") is **absent in 2005**. 2006-11 cites "Imdadul Ahkam Volume 2 Page 323/4"; 2006-12 cites "Volume 1 Page 415". The Urdu-book page range changes from "(pages 90-92)" in 2005 to "(pages 90-96)".
6. **The directory sentence naming Shaukat** ("an accompanying directory with this book, "Salat Timetables for Towns and Cities in the UK" … or to Brother Khalid Shaukat, shaukat@moonsighting.com for a timetable for your location") appears **only in the 2006-12 build**. It is absent from both 2005 and 2006-11. It dates Shaukat's computed UK directory to between 15 Nov and 7 Dec 2006, matching A3 and the 2006 uk-prayercharts in A4.
7. **Tables 4, 5 and 6: identical values in all three editions**, checked on the images and by numeric diff. One exception: 2005 Table 5 prints "**144**" for 7 May where later builds print "1-44". In 2005 the how-to-use notes sit above Tables 5 and 6 rather than on printed p.116.
8. **Minor wording in the 2005 edition only:**
   - "Careful scrutiny is therefore necessary before degree based methods are adopted"
   - "Mushahadah has precedence over Hisab using Ahadith as the basis of their deliberations"
   - Molvi's Urdu book called "Isha Time in Britain"
   - "not widely used in the medieval period for reasons that should still apply today"
   - "checked and a procedure for verification introduced i.e. by way of Mushahadah"
   - "In addition the last chapter, Chapter 6, clearly demonstrated that science is not infallible."
   - Ghazali quote ends "'indeed, some conjecture is sin' (Quran 49:12)"
   - No sentence "Solar depression levels may be appropriate for the other prayer times but not so for Fajar and Isha" (added in 2006)
   - No Rozenberg quote in chapter 6
   - Figure 1 "Twilight Sequence" absent in 2005 and 2006-11
   - The "Technical Opposites" figure is numbered Figure 1 in 2005 and 2006-11, Figure 2 in 2006-12
   - Ludhianvi cited as "Mufti Rashid Ahmed Ludhianvi's" rather than "R. A."
9. **2006-11 only:** "Molana" added before several Mufti names in the fatwa list (Mufti Abdullah Kawi and others).

## A3. Urdu front matter of "Fajar and Isha part 1&2" (the 2007 Hizbul Ulama book): `articles/prayers-uk.pdf`

- **File:** `pdfs/wayback/articles__prayers-uk.pdf`. Source `https://web.archive.org/web/20081230101850id_/http://www.moonsighting.com/articles/prayers-uk.pdf` (capture 2008-12-30).
- **PDF metadata:** author "Safwan", created 2008-09-14. 20 pages, 420×595 pt.
- **Text layer:** unusable (legacy Urdu font encoding). Only English fragments survive.
- **Read:** 20/20 pages as images rendered at 130 dpi. PDF pp.19–20 are blank apart from page numbers.
- **What it is:** the Urdu section, printed pp.364→349 (numbered right to left), of a 366-page book.
  - Title page (PDF p.1): "برطانیہ میں طلوع آفتاب، زوال، پنج وقتہ نمازیں، روزہ اوقات کیلنڈر وقبلہ گائڈ" ("Sunrise, Zawal, five daily prayers, fasting-times calendar and Qibla guide in Britain"). Compiler: "مولوی یعقوب احمد مفتاحی" (Molvi Yaqub Ahmad Miftahi). Publisher: Hizbul Ulama UK.
  - PDF p.2: "کل صفحات: ۳٦٦"; "اشاعتِ اوّل: محرّم ۱۴۲۸ھ / جنوری ۲۰۰۷ء"; book name "فجر وعشاء اور برطانیہ میں نماز روزہ اوقات وقبلہ کیلنڈر (حصہ ۱-۲)".
  - Part 2's English name (PDF p.3): "SALAT TIMES, QIBLAH FOR TOWNS AND CITIES IN THE UNITED KINGDOM(v-2)". Part 1 is "Fajar and Isha (v-1)", i.e. A1.
- **Translation:** mine, faithful rather than literal. Numbers are as printed, in Urdu numerals.

### Content, page by page
- **PDF pp.3–4 (printed 364–363).** Recaps the Blackburn observations, "محرم الحرام ۱۴۰۸ھ سے لیکر محرم ۱۴۰۹ھ (مطابق ستمبر ۱۹۸۷ء سے اگست ۱۹۸۸ء)". Two meetings: "۱۵ شعبان ۱۴۰۸ھ مطابق ۲ اپریل ۱۹۸۸ء بروز ہفتہ" and "۲۴ جمادی الاولی ۱۴۰۹ھ مطابق ۲ جنوری ۱۹۸۹ء بروز پیر".
  - The ulama of Jamiatul Ulama Britain, Markazi Jamiatul Ulama Britain and Hizbul Ulama UK decided the following. The observatory's computed times differ clearly from the observations, so "آبزرویٹری والوں کے سورج کے زیرِ افق بارہ، پندرہ یا اٹھارہ درجات کے مطابق اوقات غلط ہیں" (times by the sun at twelve, fifteen or eighteen degrees below the horizon are wrong), and the observed times are to be used.
  - For "a long period" mosque committees were given only a chart of the intervals ("فاصلوں کا صرف چارٹ") and told to add or subtract them from local sunrise and sunset. That was a hardship.
- **PDF p.5 (362).** Muhammad Arshad Baig wrote free software, over "the last two years", that prints the two prayers' times for any British place once sunrise and sunset are typed in.
  - "اس درمیان ڈاکٹر خالد شوکت صاحب نے ہماری گذارش کو خاطر میں لاکر برطانیہ بھر کیلئے بشمول فجر وعشاء پنج وقتہ نماز، طلوع وزوالِ آفتاب کے اوقات اور قبلہ کے حسابات کمپیوٹر پر بڑی محنت سے تیار کرکے ہمیں دئے جو اس وقت آپ کے سامنے کتاب کی شکل میں موجود ہے".
  - Translation: "Meanwhile Dr Khalid Shaukat, at our request, prepared with great effort on computer, for the whole of Britain, the times of the five daily prayers including Fajr and Isha, sunrise and zawal, and the Qibla calculations, and gave them to us; this is now before you as a book."
  - **This names Shaukat as the person who computed the Hizbul Ulama UK 2007 all-UK timetable directory.**
- **PDF pp.6–9 (361–358).** Polemic: astronomical calculations are approximations, not certainties.
  - Praise for Shaukat's "دس سالہ ریسرچ" (ten-year research): Fajr and Isha by assumed 15 or 18 degrees are wrong. He is described as an ISNA Advisory Board member and as honest in presenting counter-evidence on moonsighting.com.
  - Shaukat put Miftahi's English book on moonsighting.com "(دیکھیں اس کتاب کا Forward)". This implies the English part 1 of the printed book carries a Foreword by Shaukat. **UNVERIFIED:** the Foreword is not in any PDF edition on disk.
  - Thanks to Prof. Dr Muhammad Ilyas.
  - Note on printed p.358: the book has been on moonsighting.com since "رمضان ۱۴۲۶ھ/اکتوبر ۲۰۰۵ء", "دومرتبہ تصحیح کی گئی" (corrected twice), with additions before press.
- **PDF p.10 (357), "Clarification about the times given in the book":**
  - "(۱) کتاب میں نمازوں کے اوقات گرینچ مین ٹائم (G.M.T.) مفروضہ کے مطابق ترتیب دئے گئے ہیں": times are arranged in GMT.
  - "(۲) کتاب میں فجر وعشاء کے اوقات عینی مشاہدات پر مبنی ہیں جبکہ طلوع آفتاب، زوال و ظہر، عصر ومغرب کی تینوں نمازوں کے اوقات آسٹرونومی کی مفروضہ تھیوریوں کے تقریبی حساب سے ترتیب دئے گئے ہیں": Fajr and Isha rest on eyewitness observation; sunrise, zawal/Zuhr, Asr and Maghrib are by approximate astronomical calculation.
  - "(۳) کتاب میں سن ۲۰۰۷ء کے کیلنڈر کے یہ اوقات موسمِ گرما وسرما کے اوقات کے مطابق تیار شدہ ہیں جن میں مارچ واکتوبر میں ایک گھنٹہ کی کمی یا زیادتی بھی کرلی گئی ہے": the 2007 calendar includes the one-hour clock changes in March and October.
  - "(۴) ظہر کا وقت نصف النہار (آدھا دن یا Midday) کے وقت سے پانچ منٹ بعد سے ترتیب دیا گیا ہے": **Zuhr is set 5 minutes after midday.**
  - "(الف) … نصف النہار کے مفروضہ وقت سے پہلے احتیاطی پانچ منٹ شمار کئے گئے ہیں اور بقیہ پانچ منٹ عین نصف النہار سے زوال یعنی ظہر کے شروع وقت تک": zawal counts 5 precautionary minutes before midday plus 5 minutes after.
- **PDF p.11 (356), the 5 minutes after midday:**
  - "(i) ڈیڑھ منٹ": 1.5 minutes for the sun's trailing limb to clear the meridian.
  - "(ii) … تیس میل کے ایریا کے احاطہ کو مدِّ نظر رکھ کر اس میں مزید ایک منٹ کا اضافہ": one more minute for a 30-mile radius, making 2.5 minutes, "then another two and a half minutes for further precaution … five minutes".
  - "(iii) … زوالِ آفتاب کا کل دس منٹ کا وقت": zawal totals 10 minutes.
  - Note: the true makruh time is 1.5–2.5 minutes, but because observatory times are approximate, ten minutes are counted as makruh.
- **PDF p.12 (355):**
  - "(۵) عصر کا وقت سایہ اصلی کے دوگنا (مثلین) ہونے کے وقت کے حساب پر ترتیب دیا گیا ہے جبکہ مثلِ اول کے وقت کی معلومات کیلئے ڈاکٹر خالد شوکت صاحب سے اسی میل shaukat@moonsighting.com پر رابطہ کیا جائے": **Asr is printed at Mithlayn (Hanafi, shadow = 2× plus noon shadow).** For Mithl-e-Awwal, contact Shaukat.
  - "(٦) مغرب کی نمازوں کے اوقات رصدگاہوں کے سطحِ سمندر کے حساب والے غروب آفتاب کے اوقات کے بجائے سطحِ سمندر سے انتہائی بلندی کے مطابق ترتیب دئے گئے ہیں … آبزرویٹری کے غروب آفتاب والے اوقات میں تین منٹ کی زیادتی کی گئی ہے": **Maghrib = observatory (sea-level) sunset + 3 minutes.**
  - "(بعض لوگ تین منٹ کے بجائے پانچ منٹ بڑھاتے ہیں اگرچہ تین منٹ کافی ہیں مگر کل پانچ منٹ ہی بڑھانا چاہیں تو ان تین منٹوں میں صرف دو منٹ بڑھائیں نہ کہ پانچ …)": some add five minutes; three suffice, but anyone wanting five total should add only two more to the printed time.
  - (الف) The observatory gives sunrise and sunset for sea level, not local elevation.
- **PDF p.13 (354).** Refraction and the flattened earth are discussed. Then:
  - "نوٹ: کتاب میں (وقتِ مغرب برابر ہے مگر) طلوع آفتاب کے اوقات رصدگاہ کے سطحِ سمندر والے اوقات کے برابر ترتیب دئے گئے ہیں اس لئے ہر روز کے 'طلوع آفتاب' کے ان اوقات میں سے تین منٹ کی کمی کرکے طلوع آفتاب کے اوقات ترتیب دینا ضروری ہے۔"
  - Translation: "In the book (Maghrib is as stated, but) sunrise is printed equal to the observatory sea-level time, **so three minutes must be subtracted from each day's printed sunrise.**"
- **PDF p.14 (353).** "(۷) عشاء اور فجر کے اوقات سال بھر کے مشاہدات کے مطابق ہیں": Isha and Fajr follow the year of observations.
  - "(۸)": UK clocks change on the last Sunday of March and October. The book follows 2007 dates, so later years need a one-hour correction only on the dates between the 2007 and current-year change Sundays.
  - (الف) describes the October change as adding an hour, as printed. It reads as physically muddled but is transcribed as-is.
- **PDF pp.15–16 (352–351).** Worked example: last Sunday of March is the 25th in 2007 and the 30th in 2008; of October, the 28th in 2007 and the 26th in 2008.
  - For March 2008, "۲۵ … ۲٦، ۲۷، ۲۸ اور ۲۹ تاریخوں کے وقت میں ایک گھنٹہ کی زیادتی".
  - For October 2008, only the 26th and 27th.
  - Signed "مولوی یعقوب احمد مفتاحی، ناظم حزب العلماء یوکے، محرم الحرام ۱۴۲۸ھ/ جنوری ۲۰۰۷ء".
- **PDF p.17 (350).** Services of Hizbul Ulama UK ("The society of Muslim Scholar in u.k.") and the Central MoonSighting Committee of Great Britain, "۱۴۰۳ھ/۱۹۸۳ء" to date.
  - Books: "برطانیہ میں عشاء کا صحیح وقت" (Urdu) and "Fajar and Isha (part 1&2)" (English). They proved "صبح صادق اور عشاء کے اوقات کیلئے زیرِ افق کے ۱۲، ۱۵ یا ۱۸ وغیرہ درجات کی تخصیص غلط ہے".
  - Part 2 gives the five prayers and sunrise/sunset for most British cities, plus Qibla.
  - Other work: halal slaughter, Satanic Verses, Qadiani, Shariah panchayat, Bosnia/Kosovo.
- **PDF p.18 (349).** Where to obtain the book: Hizbul Ulama UK, 74c Upton Lane London E7 9LW; Jamiatul Ulama Briton Bradford (Haji Qamre Aalem), 36 Chippendale Rise, Bradford BD8.

## A4. "Salat Timetables for Towns and Cities in the United Kingdom" (Hizbul Ulama UK; times computed by Khalid Shaukat): `articles/uk-prayercharts.pdf` (2006) and `articles/uk-prayercharts1.pdf` (2009)

These are a lighter pass, since the lead already has the tables. What I did:
- Read every non-table page (pp.1–3 of the 2006 edition, pp.1–6 of the 2009 edition) in full.
- Machine-checked every other page: the city header and Qibla line were extracted from each, and pages were scanned for any that were not timetable pages.
- Result: **no appendix and no other prose exists beyond the notes pages**. Every page after p.3 (2006) or p.6 (2009) is a monthly timetable.

| | 2006 edition | 2009 edition |
|---|---|---|
| File | `pdfs/wayback/articles__uk-prayercharts.pdf` | `pdfs/wayback/articles__uk-prayercharts1.pdf` |
| Capture | 20070810011835 | 20100102034206 |
| PDF metadata | 257 pp.; title field "PeterborougKentUK Lt=52:35N …"; author "karoliay"; created 2006-12-06 14:54Z | 537 pp.; title "Microsoft Word - citiesTTlong"; author "faizaan"; created 2009-09-08 |
| Cities | 31 | 49 |
| Title page | "SALAT TIMETABLES FOR TOWNS AND CITIES IN THE UNITED KINGDOM, Molvi Yaqub Ahmed Miftahi, Hizbul Ulama UK", 74 Upton Lane | same, but 74**c** Upton Lane |

Every page header has the form "CITY Lt=… Lg=… GMT+ 0" / "Qibla Compass=…E(2006.9x) Qibla from True North =…E". Columns: "DATE | Fajr Sunrise Zuhr Asr(H) Maghrib Isha".

### Notes page, 2006 edition (p.2), quoted in full where substantive
- "These times have been kindly computed by Brother Khalid Shaukat, advisor to the Islamic Society of North America (ISNA)…"
- "The Fajar and Isha times shown are based on Mushahadah (naked eye observations)carried out by Ulama under the direction of Hizbul Ulama UK, in Blackburn during September 1987 - August 1988 … agreed at a meeting held on 2 April 1988 (followed by another meeting on 2 January 1989)at Masjid Anisul Islam Troy Street, Blackburn, to adopt these times rather than use degree times that have been shown to be incorrect."
- "Zuhr is set five minutes after noon/mid day time … Zawaal is about ten minutes before Zuhr beginning time which has a measure of safety … It takes about 1.5 minutes for the sun's disk to come out of zenith. Additional 1 minute must be added for a 30 mile radius. … A factor of safety (additional 2.5 minutes) … Thus, 5 minutes has been added in Noon time for Zuhr. In your timetables advise caution for prayer during Zawaal and refrain from prayer approximately ten minutes before Zuhr time (being five minutes before Noon/midday)."
- "Asr time shown is according to Hanafi fiqh which is two shadow lengths."
- "Maghrib has been calculated 3 minutes after sunset due to: the effects of humidity, temperature, pressure etc; also, in some areas there could be a downward sloping ground towards western horizon … for major metropolitan cities, the sunset in a 30 mile radius … varies. … Some Masajids add about 5 minutes to sunset."
- "Daylight/Summer Time is considered, but you may need to adjust a few days every year."
- The 2006 notes do **not** carry the sunrise −3 advice.

### Notes pages, 2009 edition (pp.2–4): additions and changes against 2006
- "Khalid Shaukat has ensured that observatory calculated times have been adapted for accuracy as observatory times do not take into account specific shariah requirements."
- Zawaal wording: "Zawaal phase is about five minutes before mid day and five minutes after … one must refrain from prayer ten minutes before [Zuhr]".
- "Asr time shown is according to Hanafi fiqh which is two shadow lengths. **If you require Shafi time which equates to one shadow length please send an email request to brother Khalid Shaukat.**"
- "Maghrib - 3 Minutes has already been added to calculated sunset in the timetables below as there is a difference in theoretically calculated sunset and actual sunset. **Maghrib time is actual sunset.** Calculations for sunset are done assuming the earth is a perfect sphere (which it is not), also assuming that the ground towards western horizon is perfectly level … Some Masajids add about 5 minutes to sunset. So, if you prefer to add five minutes to sunset instead of three you only need to add a further two minutes to the maghrib time below."
- "**Sunrise** - The effects described for sunset above apply also to sunrise and will have the effect of an earlier sunrise than observatory calculated times. As the sunrise times given in the tables below are calculated sunrise times, **it is advised that a minimum of three minutes is taken away from the sunrise time given within the timetables below.** Alternatively, you may add a note of caution in your Masajid timetables advising worshippers to refrain from prayer during the last few minutes of sunrise."
- "British Summer Time Adjustment - The tables take into account changes due to daylight/summer time. … **as this template is based on the 2007 calendar**, it may be necessary that for future years you may need to adjust the times by one hour for a few days only depending on when the last Sunday of the month falls (i.e. in March and October)."
- It also mentions the Urdu book "Bartaniya Me Isha Ka Sahih Wakt", "available in hard published version only".
- **No statement anywhere of how Fajr and Isha were computed from the Blackburn chart.** Presumably Table 5/6 durations were applied to computed sunrise/sunset (A1 printed p.109); **UNVERIFIED** from these documents.

### Full city list with coordinates (as printed; Qibla = "Qibla Compass" / "Qibla from True North")

| 2006 p. | 2009 p. | City (as printed) | Lt | Lg | Qibla compass (epoch) | Qibla true |
|---|---|---|---|---|---|---|
| – | 7 | ABERDEEN Scotland | 57:10N | 2:04W | 125:42E (2006.94) | 121:44E |
| – | 17 | BELFAST N.IRELAND | **51:38N** | **0:25E** | 121:42E (2006.94) | 119:43E |
| 4 | 28 | BIRMINGHAM | 52:30N | 1:50W | 121:01E (2006.91) | 118:03E |
| 12 | 39 | BLACKBURN | 53:45N | 2:29W | 121:54E (2006.91) | 118:27E |
| 20 | 50 | BOLTON, LANCASHIRE | 53:35N | 2:26W | 121:46E | 118:21E |
| 28 | 61 | BRADFORD YORKSHIRE | 53:45N | 1:50W | 122:21E | 119:09E |
| 36 | 72 | BRISTOL AVON | 51:27N | 2:35W | 119:22E | 116:17E |
| – | 82 | BURNLEY Lancashire | 53:48N | 2:14W | 122:07E (2006.94) | 118:45E |
| 44 | 93 | CARDIFF WALES | 51:30N | 3:13W | 119:00E | 115:40E |
| – | 104 | CHORLEY Lancashire | 53:39N | 2:39W | 121:41E | 118:11E |
| 53 | 115 | COVENTRY, MIDLANDS | 52:25N | **0:30W** | 121:52E | 119:26E |
| 61 | 126 | CROYDON SURREY | 51:23N | 0:06W | 121:03E | 118:55E |
| 69 | 137 | DERBY | 52:55N | 1:29W | 121:42E (2006.92) | 118:48E |
| 77 | 147 | DEWSBURY & BATLEY, WEST YORKSHIRE | 53:42N | 1:37W | 122:26E | 119:21E |
| – | 158 | DUNDEE Scotland | 56:28N | 3:00W | 124:23E | 120:09E |
| 85 | 169 | EALING LONDON | 51:31N | 0:20W | 121:01E (2006.92) | 118:47E |
| 94 | 180 | EDINBURGH SCOTLAND | 55:57N | 3:13W | 123:43E | 119:30E |
| 102 | 191 | ESSEX | 51:48N | 0:40E | 122:04E (2006.92) | 120:10E |
| – | 202 | EXETER | 50:43N | 3:31W | 117:57E | 114:38E |
| 110 | 212 | GLASGOW SCOTLAND | 55:53N | 4:15W | 122:59E | 118:19E |
| 118 | 223 | HACKNEY London | 51:33N | 0:03W | 121:16E (2006.92) | 119:08E |
| – | 234 | HALIFAX WEST YORKSHIRE | 53:44N | 1:52W | 122:18E | 119:06E |
| – | 245 | HUDDERSFIELD YORKSHIRE | 53:39N | 1:47W | 122:16E | 119:07E |
| – | 256 | HULL, EAST YORKSHIRE | 53:45N | 0:20W | 123:24E | 120:48E |
| – | 267 | IPSWICH | 52:04N | 1:10E | 122:44E | 120:58E |
| – | 277 | LANCASTER | 54:03N | 2:48W | 122:00E | 118:21E |
| 126 | 288 | LEEDS WEST YORKSHIRE | 53:50N | 1:35W | 122:36E | 119:30E |
| 134 | 299 | LEICESTER | 52:38N | 1:05W | 121:41E | 118:59E |
| 143 | 310 | LIVERPOOL | 53:25N | 2:55W | 121:15E (2006.92) | 117:41E |
| **151** | **321** | **LONDON** | **51:30N** | **0:10W** | **121:08E (2006.91)** | **118:57E** |
| – | 332 | LUTON Bedfordshire | 51:53N | 0:25W | 121:21E | 119:02E |
| – | 342 | MANCHESTER | 53:30N | 2:15W | 121:48E (2006.91) | 118:29E |
| 159 | 353 | NEWCASTLE UPON TYNE | 54:59N | 1:35W | 123:48E | 120:29E |
| 167 | 364 | NOTTINGHAM | 52:58N | 1:10W | 121:59E | 119:11E |
| 175 | 375 | OLDHAM LANCASHIRE | 53:33N | 2:07W | 121:56E | 118:40E |
| – | 386 | OXFORD | 51:46N | 1:15W | 120:38E | 118:01E |
| 184 | 397 | PETERBOROUGH **KENT** | 52:35N | 0:15W | 122:14E | 119:51E |
| – | 407 | PLYMOUTH | 50:23N | 4:10W | 117:09E | 113:39E |
| 192 | 418 | PORTSMOUTH | 50:48N | 1:05W | 119:42E | 117:18E |
| 200 | 429 | PRESTON LANCASHIRE | 53:46N | 2:42W | 121:46E | 118:13E |
| – | 440 | ROCHDALE Lancashire | 53:38N | 2:09W | 122:00E | 118:42E |
| 208 | 451 | ROTHERHAM | 53:26N | 1:20W | 122:21E | 119:25E |
| 216 | 462 | SHEFFIELD | 53:23N | 1:30W | 122:11E | 119:12E |
| 224 | 472 | SOUTHAMPTON | 50:55N | 1:25W | 119:36E | 117:03E |
| 233 | 483 | STOKE-ON-TRENT | 53:00N | 2:10W | 121:19E | 118:08E |
| – | 494 | SUNDERLAND | 54:55N | 1:23W | 123:52E | 120:39E |
| 241 | 505 | SWANSEA WALES | 51:38N | 3:57W | 118:40E | 115:01E |
| – | 516 | WAKEFIELD WEST YORKSHIRE | 53:42N | 1:29W | 122:32E | 119:29E |
| 249 | 527 | WALSALL MIDLANDS | 52:35N | 1:58W | 121:01E | 117:59E |

All headers print "GMT+ 0". Where the epoch is omitted it matches the one above (2006.91–2006.94).

**Coordinate errors, as printed (flagged, not corrected):**
- BELFAST "51:38N 0:25E" is not Belfast; it is roughly Essex/Chelmsford. Its Qibla values match that location.
- COVENTRY "0:30W" is about 1° off Coventry's longitude (~1:31W).
- "PETERBOROUGH KENT": Peterborough is in Cambridgeshire.
- All three are **UNVERIFIED** against source intent. London is listed at 51:30N 0:10W.

The 2006 p.4 sample row (Birmingham) reads "Jan 1 6:37a 8:18a 12:16p 2:16p 4:07p 5:43p". I did not re-tabulate the tables; the lead holds them.

## A5. French prayer-times page: `prayer-french.html` (Wayback 20100827001844; page footer "Mise à jour 30 mars 2010")

- **File:** `pdfs/wayback/prayer-french.html` (43,828 bytes). Read in full via `pdfs/wayback/prayer-french.html.txt`, 477 lines.
- **What it is:** a French translation ("NdT" = translator's notes) of the English prayer.html as of about March 2010. Translation into English is mine.

**Prayer-time content:**
- **Zuhr:** midday + 1.5 min + 1 min ("rayon de 48 km", 30 miles) + 2.5 min safety = "un total de 5 minutes". The translator notes the Maliki school sees no harm in praying at solar noon.
- **Asr:** Shafi'i, Maliki and Hanbali at shadow = length; Hanafi at twice length (the translator adds "+ noon shadow"); Ja'fari "4/7 de sa taille (comme me l'a indiqué un disciple de l'Ayatollah as-Sîstânî)".
- **Maghrib:** "au moins 3 minutes après le coucher du soleil" (refraction, sloping ground, 48 km radius). Ja'fari: 17 minutes.
- **Fajr/Isha.** Fixed 17°, 19°, 20°, 21°, or 90, 75 or 60 minutes are not valid at all latitudes. Limited observations (Riyadh, Tando Adam, South Africa, New Zealand, Buffalo, Toronto) cannot be extrapolated to a whole year; "Une observation plus complète pendant toute l'année a été effectuée à Blackburn". Then: "pour des endroits situés à l'équateur … 75 minutes … ou à 18 degrés pendant toutes les saisons … Le chafaq met entre 66 et 100 minutes (de 9 à 13,6 degrés) à disparaître à des latitudes plus élevées (comme l'Angleterre)". A decade of research showed Subh Sadiq and Shafaq occur "en fonction de la latitude et de la saison … Moonsighting.com utilise cette fonction". The subh-sadiq "94 to 122 minutes" clause of the English quote in A1 is absent here.
- **High latitude:** "**Aux latitudes comprises entre 55 et 66 degrés, la règle du soubou` al-layl (1/7e de la nuit) est utilisée** lorsque les autres méthodes donnent des horaires qui s'avèrent difficiles pour ces régions. Le `ichâ' commence à la fin du premier septième de la nuit, et le fajr commence au dernier septième de la nuit." Near or above the Arctic circle: "se baser sur les régions les plus proches situées à une latitude moindre où le soleil se lève et se couche".
- **Booklet:** "Un livre d'environ 46 pages (8-1/2 x 11), « When to Pray Fajr & Isha » … **L'algorithme de moonsighting.com pour la fonction basée sur la latitude et la saison n'est pas encore inclu dans le livret.** Ce livre n'est pas encore publié" (photocopy by post on request).
- **Caution box:** Hizbul Ulama UK confirmed it ("Lisez le livre détaillé, « Fajr and Isha » écrit par Molvi Yaqub Ahmed Miftahi"). "Cela a de plus été confirmé de manière indépendante par des scientifiques au Pakistan en 2007. Veuillez consulter « Urdu letter – Ghaur Talab »." There is a link to "horaires des prières des grandes villes du Royaume-Uni".
- **Tayebi email:** St Joseph MI, 19 May 2009, "Maghrib était à 9:05 … Isha avec la disparation complète du shafaq ahmar était aux alentour de 10:15"; near-disappearance "vers 10:04", "vers 10:11" traces of dark red.
- **Online calculators:** above 48.5° the sun does not reach 18° "(NdT : à certaines périodes de l'année)"; above 51.5° it does not reach 15°; above 66.5° no sunrise or sunset on some days.
- **IslamicFinder criticism,** with emails dated 26 Dec 2007 (Mohammad Akhtar), 5 Mar 2008 (Coleraine, "Latitude 55.08 Nord Longitude 6.40 Ouest"), 25 Apr 2008, 11 May 2008 (Oulu 65.05 N, Kokkola 63.84 N, Maliki), 17 May 2009 (Guildford), 29 Sep 2009 (Tehran).
- **ISNA:** "l'ISNA n'a jamais eu de position officielle concernant les horaires des prières" (checked with Dr. Muzammil Siddiqi and Dr. Sayyid Syeed). "Nous utilisons une formule complexe comme fonction pour les latitudes et les saisons … Des observations différentes ont été faites pour couvrir l'année toute entière".

**Contradictions with how-we.html (2024):**
- French 2010 applies 1/7-night at **55–66°**. how-we applies it at **55–60°** and slides everything above 60° down to 60°.
- how-we says the 1/7 rule is used in "summer" above 60°; the French page has no season qualifier.

## A6. `prayer.html`: every Wayback capture, 1999 to 2025 (how the method statement changed)

- **Files:** `pdfs/wayback/prayer-html/prayer.html.<timestamp>` plus `.txt`; 56 captures, index in `captures.txt`.
- **Retry status:** `retrydocs.py` marked `/prayer.html` MISS, because its check only accepts PDF/OLE bodies, but the HTML captures were fetched separately into `prayer-html/`.
- **Read:** the first capture (19990221195144) in full, then a unified diff of every consecutive pair (`doc-reading/prayer-html-diffs.txt`, 1,986 lines, all read). Every version's text is therefore covered.
- **Afterwards:** from 2011 the page is replaced by how-we.html. Captures 20211206, 20220123 and 20221207 hold only "One moment, please... Please wait while your request is being verified..." (a bot wall); 20251016 adds "Loader". No content.

### Timeline of the Fajr/Isha statement ("Updated" dates are as printed on each page)
1. **Updated Dec 9, 1998 (capture 1999-02-21).** "Fajr & Isha are calculated for Sun being **15 degrees** below horizon, a value adopted by ISNA … However, for latitudes higher than **45 degrees** … a special consideration is adopted that has been suggested by Ulemaa' of Fiqh. (This includes **1/7th of the night** before sunrise for Fajr and 1/7th of the night after sunset for Isha. In some cases, even this is impractical, so the times for Fajr & Isha are kept in line with other days of the year just before and after these special days of hardship …, such that the times are roughly those of nearby latitudes …)". Maghrib "is calculated as 3 minutes after sunset". Zuhr = noon + 5 min (1.5 + 1 + 2.5). Asr gives Shafi'i/Maliki and Hanafi (shadow + noon shadow).
2. **Updated May 14, 1999.** New section "Fajr & Isha 15 VS 18 Degrees": "Groups from Pakistan, England, USA, Caribbean Islands, and Australia have made actual observation for Subh-e-Sadiq … I have made calculations to find the corresponding angle of depression for each observation, and found that the angle comes closer to **13.5 degrees**. Keeping a little factor of safety, it makes sense to use 15 degrees everywhere in the world." Also first mention of the book "When to Pray Fajr & Isha" (unpublished manuscript).
3. **Updated Nov 6, 1999.** Maghrib changed to "**at least as 1 minutes** after sunset … For major metropolitan cities, another 2 minutes should be added". **Updated Feb 4, 2001** restores "at least as 3 minutes after sunset" with the 30-mile radius as reason 3.
4. **Updated Jan 20, 2002.** "Avoid On-line Prayer Times Calculations": "At latitudes higher than 45 degrees, computer programs may not calculate Fajr & Isha … At latitudes higher than 67.5 degrees, sunrise and sunset may not occur". **May 23, 2003** changes these to "48.5 degrees … 18 degrees" and "66.5 degrees".
5. **Updated Oct 10, 2003.** The method switches to "**calculated for Sun being 18 degrees below horizon.** If this makes Fajr very early and Isha very late as it happens at higher latitudes in summer … a special consideration is adopted … (known as 1/7th of the Night Rule). This rule means 1/7 of the length of night from sunset to sunrise is calculated; Fajr is sunrise minus 1/7th of the night and Isha is sunset plus 1/7th of the night."
6. **Updated Sep 19, 2004 / Dec 29, 2004.** "a special consideration is adopted that is a **combination of 18 degrees, 15 degrees, and even 12 degrees.** This combination is based on a suggestion by Fuqaha' that if the sun does not set at higher latitudes then the times for nearest location, where sun sets, can be used. This can also be translated in a mathematical way as "1/7th of the Night" Rule."
7. **Updated Oct 31, 2005 (capture 2005-11-07), the first appearance of the latitude-season function.** "Caution: Calculations of Fajr & Isha based on the sun being 18° or 15° … are wrong … This has also been confirmed by Hizbul Ulama UK … Read a detailed book, "Fajar and Isha Time in Britain"". Then: "A decade long research by Moonsighting.com found that the Subh-Sadiq or disappearance of Shafaq is a function of latitude and seasons. When this function is checked against all round the year observations of Blackburn, UK, … the calculations matched observations with amazing accuracy. So, Fajr and Isha are calculated using that function of latitude and seasons." Also: "Moonsighting.com algorithm for function of latitudes and seasons is not yet included in the booklet" (48 pages, later 46). Also the ISNA note: "It uses a complex formula as a function of Latitudes and Seasons".
8. **Updated May 11, 2006.** Adds "All collected observations show that for areas at or near equator Shafaq disappearance and Subh-Sadiq occurs in 75 minutes or at 18 degrees in all seasons … Shafaq disappears at 66 to 100 minutes (9 to 13.6 egrees) at higher latitudes (like England) … Subh-Sadiq at higher latitudes is observed at 94 to 122 minutes (14.5 to 10.6 degrees) … When this function is checked against all collected observations it came very close to the observations at all latitudes." This is the source Miftahi quotes from the 2006 build on (A2).
9. **Updated Aug 9, 2006.** Shi'a Maghrib "14 minutes after sunset". **Nov 15, 2006** changes it to "17 minutes".
10. **Updated Mar 8, 2007.** "Download Prayer Times for Large Cities in UK - pdf". **Sep 2007** adds "This was further confirmed independently by scientists in Pakistan in 2007. Please see an "Urdu letter"" (later titled "Urdu letter - Ghaur Talab").
11. **Updated Feb 5, 2008.** "avoid using PERPETUAL PRAYER TIMES. Every year the prayer times shift slightly by plus minus 1 or 2 minutes, because of February 29 in leap years." Oct 2008 adds DST. **Oct 30, 2008** adds the Asr definitions, including Ja'fari "4/7 of its length (as given to me by a follower of Ayatullah Sistani)", and Ja'fari Maghrib "17 minutes after sunset … enough for the bronze glow on the horizon to disappear".
12. **Updated June 2, 2009.** Tayebi email (St Joseph MI, 19 May 2009). **Updated Sep 10, 2009:** "**At latitudes between 55 - 66 degrees, the rule of Sab'u Lail (1/7th of the night) is used** when other methods give times that become hardship … Isha starts at the end of first 1/7th of the night, and Fajr starts at the last 1/7th of the night." The French page (A5) translates this state.
13. **Updated July 8, 2010 (capture 2010-07-28), the key numbers.**
    - "**Subh-Sadiq, in Blackburn UK, was observed 93 to 123 minutes before sunrise** in different seasons. **Shafaq Ahmer occurs, in Blackburn UK, 55 to 81 minutes after sunset** in different seasons, while **Shafaq Abyad occurs 77 to 105 minutes after sunset.** Similarly, **Subh-Sadiq, in Chicago, USA, was observed 90 to 111 minutes** before sunrise … **Shafaq Ahmer … Chicago … 57 to 76 minutes** … **Shafaq Abyad … 77 to 98 minutes**."
    - "A decade long research by Moonsighting.com found that the Subh-Sadiq and Shafaq are functions of latitude and seasons (**day number of the solar year**)."
    - "Both Shafaq Ahmer and Shafaq Abyad can be calculated by different mathematical formulae. **These formulae are good up to the 55° latitude.**"
    - "At latitudes between 55° and 66°, the rule of Sab'u Lail … **Isha starts at the time which is earlier of Shafaq calculation or first 1/7th of the night. Similarly Fajr starts at the time which is later of Tabayyan (when morning light in the sky spreads horizontally) or the last 1/7th of the night.**"
    - "These observations were not for 365 days … (Imdadul-Fatawa Vol1, Page 98)".
    - Detroit email (Khalid Yaseen, 20 June 2010): Isha "at around 10:30 PM EDT … most of the city is calling the athan at 11:00 PM, based on what is attributed to the ISNA time chart".
14. **Updated Nov 13, 2010.** The observation site list is extended to "Riyadh (Saudi Arabia), Tando Adam (Pakistan), South Africa, New Zealand, Australia, Miami FL, Buffalo NY, Chicago IL, San Francisco CA, Tempe AZ, Houston TX, and Washington DC (USA), Toronto (Canada), and Dewsbuary UK".
15. **Updated May 3, 2011 (capture 2011-05-22).**
    - Adds "Above 48.5° (e.g., Vancouver, Canada) … 18° … Above 51.5° (e.g., Cambridge, UK) … 15° … Isha calculated at 15° will give Isha time 2.5 hours after Maghrib … Above 54.5° (e.g., Copenhagen, Denmark) … 12° … 3 hours after Maghrib".
    - Observations in degrees:
      - "in Karachi and Tando Adam, Pakistan (approx. 25°- 26° latitude) … Subh-Sadiq and disappearance of White Shafaq occur at about **16° to 18°**"
      - "In Chicago, USA (about 42° latitude), Subh-Sadiq was observed at 111 to 90 minutes before sunrise (**about 15.7°-17.4°**) … Shafaq Ahmer … 76 to 57 minutes after sunset (**about 12°-15°**), while Shafaq Abyad … 98 to 77 minutes (**about 13°-18°**)"
      - "**In Blackburn UK, Subh-Sadiq was observed 123 to 93 minutes before sunrise (about 11°-14.5°)** … Shafaq Ahmer was observed 81 to 55 minutes after sunset (**about 8.3°-10.0°**), while Shafaq Abyad was observed 105 to 77 (**about 8.3°-13.6°**)".
    - "All collected observations at different latitudes were plotted against day number of the year. **With curve-fit technique**, moonsighting.com came up with a function of latitude and seasons."
    - "These formulae are good from equator to the 55° latitude."
    - "**At latitudes between 55° and 65°**, the rule of Sab'u Lail … Isha time is earlier of the two … Fajr time is later of the two." The upper limit changes from 66° to 65° here.
    - "**At latitudes higher than 65°** … a suggestion by Fuqaha' is to calculate for nearest lower latitudes where the sun sets and rises".
    - Online-calculator text: "Some convention has to be adopted based on local civil time that is practical and does not cause hardship."
16. **Updated June 17, 2011.**
    - "For Isha, both Shafaq Abyad (Hanafi) and Shafaq Ahmer (Shafi'i, Maaliki, Hanbali) can be calculated by different formulae. These formulae are good up to the 55° latitude."
    - Thanvi "(Imadadul Fatawa, vol 2, p98, 12/12/1322Hijri)" and Allamah Shami.
    - Mufti Shafi Usmani: "In those countries where Subah Sadiq cannot be clearly distinguished (**the UK in the summer months**) it is permissible to act upon this advice.' **Erring on the side of caution, one should stop eating 10 minutes before this time.**' (Imdadul Fatawa, vol 1, p100)".
17. **Updated Aug 16, 2011 (capture 2011-08-27), the last content version.**
    - "Prayer Times Definition We Use": Fajr "Subh Sadiq (Fajr-al-Mustatir) when morning light in the sky spreads horizontally"; Dhuhr "5 minutes after Zenith"; Asr "a factor (usually 1 or 2)"; Maghrib "3 minutes after theoretical sunset"; Isha "Disappearance of Shafaq; Redness or whiteness".
    - Pakistan changes from "16° to 18°" to "**about 15° to 16°**".
    - **The Blackburn minutes-and-degrees sentence is removed** (Chicago stays).
    - Blackburn now reads: "Although these observations were not for 365 days of the year, they covered every season."
    - "In 2007 independent Muslim scientists in Pakistan also confirmed that degrees fluctuate with seasons."
    - **Shafaq General first appears:** "Moonsighting.com uses a combination of **Shafaq Abyad in Winter and Shafaq Ahmer in summer.** This is chosen to avoid hardship at higher latitudes, when Shafaq Abyad becomes too late in summer time. Transition from Abyad to Ahmer is used in Spring and fall seasons. However, if one prefers strictly Shafaq Abyad (Hanafi) or strictly Shafaq Ahmer (Shafi'i, Maaliki, Hanbali), it can be calculated also. These formulae are good up to the 55° latitude."
    - 55–65° Sab'u Lail with earlier/later-of; above 65°, nearest lower latitude.
    - Mufti Shafi quote retains "erring on the side of caution, one should stop eating 10 minutes before this time".

**The page never prints the formula or its coefficients.** It says only "complex formula", "curve-fit technique" and "day number of the solar year".

### Internal inconsistencies across versions and against how-we.html (2024)
1. **Latitude band for 1/7 night:**
   - 1998: above 45°
   - 2009-09: 55–66°
   - 2010-07: 55–66°
   - 2011-05: 55–65°
   - how-we 2024: 55–60°, with everything above 60° slid down to 60° and 1/7 used "in summer"
2. **Above the Arctic/65°:**
   - 2005–2011: nearest lower latitude
   - how-we 2024: slide to 60° plus Sab'u Lail in summer; winter uses the function; cites the Dar al-Ifta 18-hour fasting fatwa
3. **Isha Shafaq variant.**
   - 2011: "Abyad in Winter and Ahmer in summer … Transition from Abyad to Ahmer is used in Spring and fall".
   - how-we 2024: "uses Shafaq Ahmer in summer when nights are short and Shafaq Abyad in winter" but then "**Shafaq General uses Shafaq Abyad in Summer and Shafaq Ahmer in Winter**" (the reverse) "…Transition from Abyad to Ahmer is used in Spring and Ahmer to Abyad in Fall".
   - The two how-we sentences contradict each other; the 2011 prayer.html agrees with the first.
4. **18° comparison.** No prayer.html version mentions comparing with 18° and taking the later Fajr / earlier Isha. That rule appears only in how-we 2024 ("From equator to 55degrees, the 18degrees depression angle calculations are compared … For Fajr, the later of the two and for Isha the earlier of the two").
5. **Subh Sadiq definition.**
   - how-we 2024: "We originally used Subh-Sadiq as a little bit earlier than Fajr-al-Mustatir … but recently … started using the spread of light horizontally (We call it "Tabayyun")"
   - 2011 prayer.html already defines Fajr as "Fajr-al-Mustatir … when morning light in the sky spreads horizontally", and the 55–65° rule already uses "Tabayyan".
6. **Pakistan degrees** change from "16° to 18°" (May 2011) to "15° to 16°" (Aug 2011).
7. **Blackburn ranges.**
   - Page 2010–11: Subh Sadiq 93–123 min (about 11°–14.5°), Ahmer 55–81 min, Abyad 77–105 min.
   - Page 2006–10: "Subh-Sadiq … 94 to 122 minutes (14.5 to 10.6 degrees)"; Shafaq "66 to 100 minutes (9 to 13.6)".
   - Miftahi Table 4 (A1): Ahmer 50m–1h24m (50–84 min), Abyad 1h12m–3h16m (72–196 min), Subha Sadiq 1h22m–1h54m (82–114 min, May/June Tabayyun).
   - Miftahi Table 5 chart: 1-30 to 2-04 (90–124 min).
   - Miftahi Table 6 chart: 1-00 to 1-40 (60–100 min).
   - The website's "93 to 123" and "66 to 100" line up with the smoothed **Tables 5 and 6** (90–124 and 60–100), not with the raw Table 4 extremes. **Inference, not a statement in any document.**
8. **Chicago Ahmer degrees.** "76 to 57 minutes (about 12°-15°)" is given for Ahmer, while Blackburn Ahmer is "about 8.3°-10.0°". Chicago Abyad is "about 13°-18°"; Blackburn Abyad is "about 8.3°-13.6°" (its lower bound equals the Ahmer lower bound, 8.3°). These are as printed and unverified.

---

# PART B. Non-prayer documents (read in full; pages read / total; prayer-time mentions quoted where any)

Method: every page of every text layer was read with the Read tool, with nothing skipped. Rendered pages were viewed where the text layer is empty or garbled; renders are listed per document. Identical copies were checked by md5; near-duplicates by full diff.

### B1. `live/actual-saudi-dates.pdf`, Khalid Shaukat (PDF created 2022-11-22)
- **Pages read:** 2/2 (500 text lines).
- **Contents:** a table of AH 1389–1444 giving 1 Muharram, 1 Ramadan, days in Ramadan, 1 Shawwal, 1 Zul-Hijja, Hajj date and the accumulated number and % of changes, under the headings "calculated dates per Saudi Ummul-Qura Calendar".
- **Criterion history as printed:**
  - "moon is born according to Greenwich time and date" (to 1420)
  - "moonset after sunset in Makkah, whether moon is born or not" (1421–1422)
  - "moon must be born & moonset after sunset in Makkah" (1423–1424)
  - "moon must be born before sunset in Makkah)-????" (1425–1426)
  - "moon must be born & moonset after sunset in Makkah" (1427 on)
- **Last row:** "1444 … Thu, Mar 23, 2023 … 25 … 11.16%".
- **Unverified:** the blue/red colour coding is not in the text layer. Page 2 has 4 drawings; page 1 has no images.
- **Prayer-time content: none.**

### B2. `live/articles__louaysafi.pdf` (2 pp.) and `wayback/articles__louaysafi.doc`
- **Contents:** "Moon Sighting or Astronomical Calculation", Dr. Louay Safi. A condensed argument for the FCNA's adoption of calculation.
- **Pages read:** pdf 2/2; doc text 36/36 lines. The doc text is word-identical to the pdf.
- **Prayer-time content: none.**

### B3. `live/articles__moonsighting-in-saudi-arabia.pdf` (1 p.), `wayback/moonsighting-in-saudi-arabia.doc` and `wayback/articles__moonsighting-in-saudi-arabia.doc`
- **Duplicates:** the two .doc files are md5-identical (864b60fb…) and their text is byte-identical. The pdf text matches.
- **Contents:** a letter from Haroon R. Choudhary (Edmonton) on Saudi sighting practice, 1976–84, and the Arafat/Eid-ul-Adha announcement of 19/20 January 2005.
- **Pages read:** 1/1 plus 18/18 doc lines.
- **Prayer-time mentions:** "finished our Sahur of 29th of Ramadan, when suddenly the TV started playing music about Eid ul Fitr at 3:30 AM"; "their date starts at sunset time". No method.
- **Prayer-time content: none.**

### B4. `live/articles__suggested-global-islamic-calendar.pdf`, "A Suggested Global Islamic Calendar", Khalid Shaukat (2010-05-25)
- **Pages read:** 8/8.
- **Proposal:** "If the moon is born between 0:00 - 12:00 UT the Islamic month begins at sunset of the day everywhere in the world"; if born 12:00–23:59 UT, the month begins at sunset of the next day. Reference line is the IDL.
- **Stated adoption:** FCNA accepted it in 2006; it was discussed at Rabat, 9–10 Nov 2006.
- **Bibliography:** 42 items, including Yallop 1998 NAO TN 69 and Ilyas 1984.
- **Shaukat's stance on prayer times (p.3), quoted:** "When clocks were invented, Muslims changed this method and started using calculated movements of the sun. They did so even though there was no Ayah or Hadith that provide for using calculations for Salah. They established the timings of daily Salah and developed perpetual Salah timetables that can be used throughout the year… No one disputes the use of calculated times for Salah". It gives no formula or angles.

### B5. `wayback/articles__Suggested Global Islamic Calendar 2nd meeting.pdf`, Khalid Shaukat, for the Second Experts Meeting in Rabat, 15–16 October 2008 (4 pp.)
- **Pages read:** 4/4.
- **Contents:** "Conjunction before 12:00 UT" proposal, the joint 2006 position with Jamal Eddine Abderrazik, and a critique of the alternatives. Example: Ramadan 1430 visible 20 Aug 2009 in the Polynesian islands, while Umm al-Qura shows 22 Aug.
- **The one prayer-time statement (p.3), relevant to Fajr definitions:** "(4) Conjunction before Dawn (Fajr) of Makkah: This will require calculation of Fajr at Makkah. Muslims calculate Fajr in many different ways (15º, 18º, 19º etc.). There is no unified definition of Fajr. Even if you choose one definition, someone, at some point in time later, can prove it is not the correct definition."

### B6. `wayback/aashura1430.doc`
- **Text read:** 10/10 lines.
- **Contents:** "How Saudi changed the Date of Aashura on 8th of Muharram 1430?" The Saudi Mufti's statement, in Arabic with an English translation: Aashura falls on Tuesday because Muharram began on Sunday, not Monday as in Umm al-Qura. "Info provided by Abdullateef S Uthman".
- **Prayer-time content: none.**

### B7. `wayback/al-watan-80-yr-witnesses.pdf` (3 pp.) and `.doc`
- **Contents:** "Testimonies of the Impossible", Hamza Al-Muzani, Al-Watan, 10 Dhul-hijja 1425. The doc text is word-identical to the pdf.
- **Pages read:** 3/3 plus 38/38 doc lines.
- **Relation to moon_uk:** this is the source of the "over eighty years old" and "shock… King Abdul Aziz City" passages that moon_uk v0.8 deleted (C1).
- **Prayer-time mention:** "go out with a judge … before Maghrib". No times.

### B8. `wayback/alwatanimpossible.pdf` (4 pp., "file://C:\Type\Hilaal\AlWatan… .htm", printed 12/21/2006)
- **Text layer:** read 574/574 lines. It is font-encoded Arabic and unreadable as text; only the footer is legible: "Send mail to mailto:webmaster@alwatan.com.sa … Copyright © 2001 Alwatan newspaper".
- **Renders:** `png/alwatan_p1–p4` exist; see B8a.

### B9. `wayback/articles__ahillah.pdf`, "How Islamic Months Begin", Ali Manikfan (Hijra Committee of India), 10 pp.
- **Pages read:** 10/10. Renders of pp.5 and 7 were viewed (C11).
- **Argument:** "Soomoo li ru'uyathihi" means observing phases; the month begins after conjunction; Umm al-Qura is criticised.
- **Prayer-day statements quoted (pp.7, 10):** "The Prophet SAW taught that 5 prayers make a day and the first prayer of the day is the Fajre. It is not Magrib." and "Quran and Sunnah clearly explain that our day starts before dawn".
- **Prayer-time content:** none (no times or method).

### B10. `wayback/articles__moonsplit.doc`, "Moon Split or Fault Line?" (Khalid Shaukat)
- **Text read:** 13/13 lines.
- **Contents:** NASA APOD rille image and the "Straight Wall" fault-line photos.
- **Unverified:** the embedded images in the .doc were not rendered.
- **Prayer-time content: none.**

### B11. `wayback/articles__pmi_pmp.pdf` (2 pp.)
- **Pages read:** 2/2, plus render.
- **Contents:** PMP certification exam advert, prepaway.com. Unrelated spam.
- **Prayer-time content: none.**

### B12. `wayback/articles__quranic-calendar.pdf`, "Quranic Calendar: A Brief Introduction", Abdushukoor Thalathil, Calicut (9 pp., 2014-03-21)
- **Pages read:** 9/9.
- **Contents:** Hijri Committee of India argument against the "Kerala criterion", and a phase-based calendar. It gives the calendar dates 10-04-2013, 08-07-2013 and 03-11-2013 with moonset 2/4/6 minutes after sunset.
- **Prayer-time content: none.**

### B13. `wayback/articles__relevance of ummul qura calendar.pdf`, Salma K. Rasheed (India), 4 pp.
- **Pages read:** 4/4.
- **Contents:** argument for the Hijra calendar.
- **Only prayer mention:** "We, in India will be the first to offer the Fajr prayer and 2 ½ hours later the Saudis would offer the prayer". No method.

### B14. `wayback/articles__urdu-uk-moonsight.pdf` = `wayback/urdu-uk-moonsight.pdf` (md5 5cc26ec2…, 16 pp.)
- **Text layer:** 72/72 lines, empty. Each of the 16 pages is a single scanned image.
- **Renders:** `png/urdu_p1–p16` exist; see B14a.

### B15. `wayback/astronomy-overview.ppt` and `wayback/astronomy2009.ppt`
- **Slide text read in full:** 142/142 and 228/228 lines. The extraction repeats slide text across masters and custom shows.
- **Contents:** "Overview of Basic Astronomy" and "International Year of Astronomy (2009) And Islamic Calendar". Slides cover the 2009 moon-landing anniversary, Saturn ring-plane crossing, "As of March 2009, there are 167 moons of 8 Planets", the dwarf planet definition, asteroids and comets, the 17 brightest stars, and a religious conclusion. Spanish master placeholders ("Haga clic para modificar…").
- **Unverified:** embedded slide pictures were not rendered; no PPT renderer was used.
- **Prayer-time content in text: none.**

### B16. `wayback/ecfr-announcement.doc` (Arabic)
- **Text read:** 56/56 lines.
- **Contents:** ECFR General Secretariat (Dublin), 20 Sha'ban 1433 / 09 July 2012.
  - Criteria (19th session, Istanbul 2009): conjunction before sunset, visibility anywhere, moonset after sunset, moon altitude ≥5° at sunset, elongation ≥8°.
  - Conjunction 19 July 2012 04:24 GMT.
  - Sunset/moonset examples: Santiago 17:55/18:42, Brasília 17:56/18:30, Lima 17:59/18:36, Cape Town 17:58/18:30.
  - 1 Ramadan 1433 = Friday 20 July 2012.
- **Prayer-time content: none.** The times are sunset/moonset for visibility only.

### B17. `wayback/eid-article.doc`, Muhammad Nisarul Haq, "Eid-ul-Adha: Going with local moon sighting or with Hajj Schedule?"
- **Text read:** 219/219 lines.
- **Relation to other files:** same article as `articles__eid-or-hajj.doc/.pdf` (A-covered; C5). The full diff against the eid-or-hajj text is logged in B17a.
- **Prayer-time content: none.**

### B18. `wayback/fcna-drsiddiqi.ppt`, "Islamic Lunar Calendar – Fiqh Council of North America"
- **Slide text read:** 186/186 lines.
- **Contents:**
  - Quran and hadith guidelines.
  - Conferences: FCNA June 2006; multinational conference November 2006; ECFR Sarajevo May 2007.
  - "Decision by FCNA and ECFR: … Makkah as the reference point … 1) Conjunction (moon birth) is before sunset in Makkah 2) Moon sets after sunset".
  - Nine-point table of madhhab disagreements on witnesses.
- **Unverified:** slide images were not rendered.
- **Prayer-time content: none.**

### B19. `wayback/images__revised-report-sa.pdf` (1 p.)
- **Contents:** UUCSA "Adjustment of Islamic Date": 1 Rabi ul Akhir 1434 = 12 February 2013. Signed Moulana Ebrahim Bham, 19 Feb 2013.
- **Pages read:** 1/1 text plus render (C11).
- **Prayer-time content: none.**

### B20. `wayback/mecca__introduction.pdf`, "The Calendar of Mecca", Bentchikou Abdelhamid (4 pp., 2009-07-06)
- **Pages read:** 4/4, plus render of p.2.
- **Method:** Limiting Horizon = westward longitude reached between sunset in Mecca and the next Fajr in Mecca. Quoted: "this interval of time varies between roughly 12 hours when the nights are the longest and 9 hours when they are the shortest"; "LH = 140° West". It uses "the visibility curves provided by Syed Khalid Shaukat" (green and blue fields).
- **Prayer-time content:** Fajr in Mecca is used only as a calendar boundary. No definition of Fajr is given.

### B21. `wayback/ramadan1431 false claim.pdf` (CMSC of Great Britain, 2 pp.)
- **Pages read:** 2/2 text plus both renders (C11).
- **Contents:** Birmingham sighting testimony, "Tuesday 10th August 2010 … after Maghrib Salaat … at about 9 PM", signed Y.A.Miftahi (HGS).
- **Prayer-time content:** "after Maghrib Salaat", with no calculation.

### B22. `wayback/rhcna.doc`, Rooyat-e-Hilal Committee of North America, January 1, 2006
- **Text read:** 19/19 lines.
- **Contents:** Moon not seen 31 Dec 2005; Eid al-Adha Wednesday 11 January 2006. Signed Mohammed Qamarul Hasan.
- **Prayer-time content: none.**

### B23. `wayback/saudi-announcement1434shw.doc` (Arabic)
- **Text read:** 2/2 lines.
- **Contents:** Saudi Supreme Court statement that the Shawwal 1434 crescent was sighted "this Wednesday evening" on the testimony of upright witnesses.
- **Prayer-time content: none.**

### B24. `wayback/unity in calendar.pdf` (Diyanet announcement, 4 pp., 2015-06-30)
- **Pages read:** 4/4 text plus all 4 renders (C11).
- **Prayer-time content: none.**

### B25. `wayback/yesmoonsighted.pdf`, Khalid Jan, Ottawa, June 9, 2015 (4 pp.)
- **Pages read:** 4/4 text plus all 4 renders.
- **Contents:** includes a quote from the Toronto Hilal Committee's decisions page.
- **Prayer-time content: none.**

### B26. `wayback/timezone.html`
- **Status:** 0 bytes on disk, so there is nothing to read. It is logged as an empty capture, and its site-level content is covered by `notes/site.md`.


### B14a. urdu-uk-moonsight.pdf: all 16 scanned pages viewed (`png/urdu_p1–p16`)
- **Page numbering:** the pages are printed 1–8 then 17–24. **Printed pp.9–16 are absent from the PDF**, so the file itself is incomplete; this is recorded as a gap in the source, not a reading gap.
- **Title (p.1):** "برطانیہ میں رؤیت ہلال کا مسئلہ / برطانیہ میں سعودی رؤیت پر چلنے والوں سے سنبھلنے کی درخواست" ("The problem of moonsighting in Britain / a request to those following the Saudi sighting to take care").
- **Content:**
  - An Urdu polemic against the UK following Saudi announcements.
  - Sighting is impossible under about 16 hours' age.
  - The Hanafi requirement of "jamm-e-ghafir" (a large group) under a clear sky, citing Durr al-Mukhtar, Hidaya and Fatawa Haqqaniya.
  - The Al-Watan "شهود المستحيل" witnesses (20 Jan 2005, over 80 years old), also covered by Roznama Jang London.
  - Fatawa Rahimiyya.
  - Letters from Mufti Taqi Usmani and Abul Hasan Ali Nadwi.
  - p.17: al-Subki's fatwa that calculation denying possibility voids the testimony.
  - p.18: Maulana Yaqub Kawi, Dewsbury Tablighi markaz, "۲۴ شعبان ۱۴۱۴ھ (۵ فروری ۱۹۹۴ء)".
  - p.19: Burhanuddin Sambhali.
  - p.20: Darul Uloom Deoband fatwa, Mufti Habibur Rahman, "۱۸ صفر ۱۴۲۴ھ (۲۰ اپریل ۲۰۰۳ء)": follow Morocco.
  - pp.21–23: Mazahir Uloom, Ahmad Khanpuri, Yusuf Binnori, Khairul Madaris; the "۳۲ سال کا کیلنڈر گرینچ کے مطابق" claim; Ismail Kachhlawi "۱۶ جنوری ۱۹۹۲ء".
  - p.24: appeal to ulama and mosque trustees.
  - This is the Urdu source of the English fatwa digest in `wayback/fatwa_scholars.pdf` (C13).
- **Only time-related phrase:** p.21, "جہاں طلوع وغیرہ میں زیادہ تفاوت نہ ہو" ("where there is not much difference in [sun]rise etc."). **No prayer-time content.**
- **Pages read:** 16/16 (all present pages).

### B15a. PPT embedded pictures, all extracted and viewed (`doc-reading/png/ppt/`, contact sheets `sheet_0–5.png`)
- **astronomy-overview.ppt: 32 pictures.** Earth over sunset, night-lights map, meteor shower, pixelated planet discs (Mercury, Venus, Earth, Mars, Jupiter, Uranus, Neptune), Earth hemispheres, star-size comparisons ("Jupiter is about 1 pixel in size", "Antares is 16th brightest star in the sky"), Saturn, a solar-system diagram, the Apollo flag photo, Jupiter/Saturn/Sun size charts, a Halley 2024 orbit plot, Saturn ring tilt 1996–2000, Earth and Moon, Big Dipper / Polaris / Ursa Major, asteroids, a comet, and a thin black bar (#26).
- **astronomy2009.ppt: 30 pictures.** All md5-identical to pictures in astronomy-overview; only 3483d96b (planets lineup) and c6b0ef14 (Halley/Pluto orbit) are unique to the overview deck.
- **Title slides** (Quick Look): "Overview of Basic Astronomy" and "International Year of Astronomy (2009)".
- **fcna-drsiddiqi.ppt:** one 103-byte all-black PNG. Title slide (Quick Look): "Islamic Lunar Calendar / Fiqh Council of North America".
- **Unverified:** slide-by-slide layout (which picture sits on which slide). There is no PPT renderer (no LibreOffice); Quick Look gives only the first slide. The slide text is fully read (B15, B18) and every picture is viewed. **No prayer-time content in text or pictures.**

### B10a. articles__moonsplit.doc rendered (Quick Look, 1 page)
- The page shows the NASA rille photo and two "Straight Wall" CCD images, matching the text in B10. **1/1 page. No prayer-time content.**

### B17a. eid-article.doc vs articles__eid-or-hajj.doc: complete token diff, read in full
- **Sizes:** 3616 vs 4085 tokens, ratio 0.8438. Every hunk was printed and read.
- **What the diff shows:** eid-article.doc is the **earlier draft**; eid-or-hajj ("Revised") is the rewrite.
- **Wording changes:** "Way of the Prophet" → "Sunnah"; "arafah" → "Arafah"; "Islamic law" → "Sharia".
- **Revised version adds:**
  - an "Introduction" heading;
  - the Eid prayer instituted in year 1 AH ("شرعت صلاة العيد سنة الأولى من الهجرة", Bayhaqi), with Hajj obligatory only in 9th/10th year;
  - Ibn Umar's report of ten years of sacrifice in Madinah (Musnad Ahmad);
  - "There is no evidence that any of the four rightly guided caliphs … tried to do it";
  - the Fadail-cannot-ground-Ahkam argument;
  - the 1427 Dhul-Hijja country lists (30 Dec vs 31 Dec 2006);
  - references to Wahba al-Zuhayli and moonsighting.com/1427zhj.html.
- **Draft only:** the 250-miles Makkah–Madinah argument and the "Makkan horizon … قياس" wording. The draft's 1426 country list (Tue 10 / Wed 11 Jan 2006, "UK" on Wednesday) is replaced in the revision.
- **No prayer-time content in either.**

### B27. ned-tour1966.doc, "N.E.D. Educational Tour 1966 (Third Year Engineering Class)", Khalid Shaukat
- **Text read in full:** Word piece-table parse `text/wayback__ned-tour1966.doc.parsed.txt`, 140/140 lines, plus `strings.txt` 53/53.
- **Contents:** a 12 March – 1 April 1966 student tour diary: Karachi, Kotri, Mohenjodaro, Sukkur, Multan, Daudkhel, Kala Bagh, Peshawar, Landikotal/Torkham, Warsak Dam, Dargai, Swat, Rawalpindi, Murree, Islamabad, Abbottabad, Lahore. The last lines are "PAGE 6" field codes.
- **Other text files:** `ned-tour1966.clean.txt` and `.doc.txt` are raw binary dumps (the file is 15 MB because of embedded images); they contain no further prose.
- **Embedded pictures:** see B27a.
- **No prayer-time content.**

### B28. compass.pdf, "COMPASS3.PDF", author Khalid Shaukat (9 pp.)
- **Read:** text 2184/2184 lines, plus p.1 render.
- **Contents:** a world list of cities by country (Afghanistan … Zimbabwe; US "Alphabetical within State") with one integer 0–39 each.
  - UK entries: Aberdeen 26, Belfast 26, Birmingham 26, Blackburn 26, Bradford 26, Cambridge 27, Cardiff 27, Coventry 26, Dundee 26, Edinburgh 26, Glasgow 26, Leeds 26, Leicester 26, Liverpool 26, **London 26**, Manchester 26, Oldham 26, Oxford 26, Plymouth 27, Ramsgate 26, Scraborough [sic] 26, Sheffield 26, Stroud 27.
  - The values wrap from 39 to 0 (Vancouver 0, Seattle 0, Mombasa 0), so they are a setting on a 40-division dial.
- **Meaning (UNVERIFIED):** the document gives no heading, units or explanation; by its name it is a Qibla-compass dial setting.
- **No prayer-time content.**

### B29. 1444HijriCalendar.pdf (live), Hijri Committee of India, "Alruman Calendar 2022-2023"
- **Read:** text 1191/1191 lines, plus all 6 renders (`png/hijri1444_p1–p6`). p.1 re-viewed this pass; the text layer matches the image (dates, phase codes FQ/FM/LQ/NM/UQ with UTC times, e.g. Muharram "NM UTC 08:17", Safar "NM UTC 21:54").
- **Contents:** 12 months of 1444 AH in a Sunday-first grid. The month begins the day after conjunction ("UQ: Urjoonal Qadeem like"). Legend, Quran 9:36 and 55:5, and bank details. Eclipses marked: "OCTOBER 25 PARTIAL SOLAR ECLIPSE", "NOVEMBER 8 TOTAL LUNAR ECLIPSE", "APRIL 20 HYBRID SOLAR ECLIPSE", "MAY 05 LUNAR PENUMBRAL ECLIPSE".
- **No prayer-time content.**


### B30. twoeids.pdf = articles__twoeids.pdf (md5 4b04028…), "Two Eids; The root of the problem", Dr. Waheed Younis, Toronto (14 pp.)
- **Text read:** 830/830 lines (the two text extractions are byte-identical). Figure pages 2–5 and 10–12 were rendered and viewed (C11).
- **Content:**
  - Elongation angle; "it takes around 17 to 40 hours from the conjunction to the first visibility"; "it can not be less than 15 hours".
  - Table 1: Saudi month starts 1417–1423H with moon age at Makkah sunset.
  - 1423H Zul-Hajj witnesses "kept seeing it until 17:50 whereas the moonset at that location was only at 17:18".
  - Rebuttals 1–14.
  - Suggested solution (Tables 2–3, flow chart Fig.6).
  - North America spans 60°W–120°W, "only 16%" of the time a horizon split arises.
- **Prayer-time mentions:** "salaat-ul-jumma" (analogy only). Qibla needs "spherical trigonometry". **No prayer-time content.**

### B31. qibla-wy.pdf, "Qibla in North America", Dr. Waheed Younis, Toronto (11 pp., 2005-08-28)
- **Text read:** 719/719 lines. Figure pages 2–7, 9 and 10 were viewed (C10).
- **Content:**
  - Great circle vs rhumb line; direction vs bearing.
  - Formulas: cos p = cos a·cos b + sin a·sin b·cos∠BPA, and sin∠ABP = sin∠BPA·sin b / sin p.
  - Boston worked example: Makkah "39°49′24″ E (=39.823333°E) and 21°25′24″ N (=21.423333°N)"; p = 90.3104°; "∠ABP = 60.1341°", "That is 60° from North to East".
  - Table of 31 cities (C10).
- **No prayer-time content.**


### B32. articles__adha-paper.doc / .pdf, "Eid al-Adha is connected with Hajj", Dr. Zulfiqar Ali Shah (26 pp. pdf)
- **Read:** doc text 503/503 lines in full. C5 showed the pdf and doc differ only in page numbers, headers and footnote placement (959 hunks, all read), so this covers the 26-page pdf.
- **Argument:**
  - It first sets out the local-sighting case: the Eids instituted in 1–2 AH before Hajj (6–9 AH); Tirmidhi's ten years of sacrifice in Madinah; Abdullah Saleem; Taqi Usmani.
  - It then argues that Eid al-Adha rites follow the Hujjaj, citing Ibn Taymiyyah, Ibn Rajab, al-Baghawi, al-Sarakhsi, al-Nawawi and Ibn Qudamah ("الناس تبع للحاج"), and the hadith "صومكم يوم تصومون… وأضحاكم يوم تضحون".
  - Conclusion: "Going with the Hajj is more beneficial (Maslahah)".
  - 86 endnotes.
- **Prayer-time mentions (fiqh only, no times):** Eid prayer timing follows the pilgrims' arrival at Mina; Takbeer of Tashreeq begins "عقيب صلاة الظهر من يوم النحر" and runs to "الصبح من آخر أيام التشريق" (varying opinions). **No prayer-time calculation content.**


### B27a. ned-tour1966.doc: all 45 embedded pictures extracted and viewed
- **Picture inventory:** the Data stream is 15,461,547 bytes, holding exactly 45 PICF blocks whose sizes sum to the whole stream. The blocks are 38 EMF (zlib-compressed, each wrapping one bitmap record type 81) and 7 JPEG.
- **Rendering:** all 45 decoded.
  - EMF pictures: `png/ned_emf/emf_00–37.bmp`, contact sheets `ned_emf/sheet_0–3.png`.
  - JPEGs: `png/ned2/img_00–06.jpg`, contact sheet `ned2/sheet.png`.
  - Two stray JPEG start markers inside EMF blocks 20 and 25 are compressed data, not extra images.
- **Content:** black-and-white 1966 tour photos of students at the places in B27:
  - train carriage "PASS. B4";
  - Kotri Junction;
  - barrages;
  - brick ruins;
  - a Multan gate;
  - Peshawar University / Islamia College;
  - the Khyber gate;
  - a Landi Kotal tea table;
  - "SUFAID MAHAL";
  - "CIVIL HOSPITAL MURREE";
  - Swat hills;
  - a Lahore Fort / Badshahi strip (emf_37).
- **Pages read:** 1 document plus 45/45 pictures. **No prayer-time content.**

<!-- PART-B-BELOW -->

# PART C. Redo log and completeness ledger (after the no-truncation directive)

Earlier passes used character slices in a few places. Each one has been redone here in full, with no slices, `head`, or keyword filters.

- **C1. moon_uk v0.7 (root, 47 pp.) vs v0.8 (articles, 49 pp.).** Redone in full: `doc-reading/diff_moonuk_arabic_and_fatwa.txt`, lines 1–1085, read.
  - Arabic-script diff: 328 hunks. Latin diff: 32 hunks.
  - Most hunks are extraction noise (split letters, swapped adjacent words) or renumbered table-of-contents pages.
  - **Substantive changes, v0.7 to v0.8:**
    - (a) Added: the Tableeghi Jamaat "HazratJee" letter to Hafiz Patel, "Bangla Wali Masjid 15 Shabaan 1407 15 April 1987", in both English and Urdu. It recommends taking calculations from Dr Ilyas of Malaysia and "the Nautical Almanac Office of England".
    - (b) Deleted: the paragraph "Other sources draw a different picture of the witnesses…" (Al-Hayat correspondents at Al-Rayn; KACST experts "found them to be over eighty years old").
    - (c) Deleted: the fragment "The statement came as a shock to everyone, due to the fact that the King Abdul Aziz City for".
    - (d) Deleted: the section-intro "The Negation of Following Saudi Moon sighting…", in English and Urdu.
    - (e) Deleted: the whole "European Council for Fatwa and Research presided by Shaykh Yusuf Qaradawi" section (3rd session, 19–22 May 1999, "Colon, Germany", Fatwa 8), in English and Urdu.
    - (f) Small wording fixes: "can", "Saudia" to "Saudi it", "present" to "can presented" "was".
  - **No prayer-time content in either version** (both read in full, 47/47 and 49/49).
- **C2. `articles/fatwa_scholars.pdf` (38 pp.).** Verified by a complete token diff against moon_uk v0.8 pp.15–49.
  - Latin: 10141 vs 9998 tokens. Arabic: 6160 vs 6151.
  - The **only** difference is fatwa_scholars' own front matter: the title "Fatawa on the subject of following Saudi moon sighting", "Muadh Khan", its email line, its table of contents, and the Urdu title "سعودی رویت هلال کے بارے ميں علما کے فتاوی".
  - Everything else is word-for-word identical. Pages read: 38/38, via full diff against a fully-read text. No prayer-time content.
- **C3. `prayer-french.html`.** HTML visible text vs the `.txt` used for A5, full word diff.
  - The page is cp1252. The `.txt` renders every apostrophe as "ĺ" (e.g. "lĺombre dĺun") and three characters at the end as mojibake ("Ó", "Útage", "prophŔte").
  - **No words are missing.** A5 stands.
- **C4. `prayer.html` HTML-to-text conversions (61 captures).** Checked against BeautifulSoup visible text.
  - 0 visible words missing in 56 captures.
  - The four 2011 captures (20110522, 20110623, 20110727, 20110827) drop only the tokens "h" and "sah". (Being located.)
  - Image alt/title texts are navigation labels only ("Home Page", "Top", "web counter", "TIME LIFE SOFT ROCK", "Muslim Friends!").
- **C5. `adha-paper` and `eid-or-hajj`, .pdf vs .doc.** Redone in full, untruncated: 959 and 110 hunks, all read.
  - **adha-paper:** every hunk is one of four kinds:
    - (i) a PDF font-mapping artefact: ه printed as ھ, لا as "E"/"N"/"e", الأ as "3"/"ا";
    - (ii) footnotes placed inline in the PDF and at the end in the .doc;
    - (iii) Qur'anic verses that come out of the PDF text layer as Latin garbage (e.g. "G H 7 I J K…") but are correct Arabic in the .doc;
    - (iv) one Qur'an verse (Al-Ma'idah 114, "قال عيسى ابن مريم…") present only in the .doc.
    - No sentence of the English argument differs.
  - **eid-or-hajj:** page numbers, "Revised" running header, footnote placement, and table row numbers (the list of 1426/1427 dates) only.
  - Both documents read in full via the .doc text plus this diff. No prayer-time content.
- **C6. UK chart tables, complete by-date parse of every table page.** Output files:
  - `doc-reading/uk2006.bydate.txt` (257 pp.)
  - `doc-reading/uk2009.bydate.txt` (537 pp.)
  - `doc-reading/uk2006_vs_2009.bydate.diff.txt`
  - Every non-heading token on every page parsed as a date row: 0 residue text, 0 malformed rows.
  - 2006: 31 cities. 2009: 49 cities (the 31 plus Aberdeen, Belfast, Burnley, Chorley, Dundee, Exeter, Halifax, Huddersfield, Hull, Ipswich, Lancaster, Luton, Manchester, Oxford, Plymouth, Rochdale, Sunderland, Wakefield).
  - Each city has 365 dates except **Nottingham, which has no "Apr 30" row in either edition** (364 rows).
  - **All 31 common cities are identical in the two editions on every date and every one of the six columns: 0 differing city-dates.** The 2006 book's tables are therefore an exact subset of the 2009 book's. Reading the 2009 tables in full also reads the 2006 tables.
  - One typo: 2009 PDF p.350 (Manchester, 2009-only city), "Aug 31 … 9.17p" (full stop instead of colon) in the Isha column.
- **C7. UK chart tables (2009 edition, 49 cities × 365 days) checked against an independent NOAA-style solar computation.**
  - Script: `doc-reading/scripts/solarcheck.py`. Outputs: `uk2009.solarcheck.tsv` (one line per city-date) and `uk2009.solarcheck.summary.txt`.
  - This is my analysis, not a statement in any document. Computed values are used only to test the printed notes; they are not prayer times.
  - Sign conventions: printed minus computed. BST 25 Mar–28 Oct 2007. Each city's printed Lt/Lg.
  - **Checks of the printed notes:**
    - **Zuhr − computed solar noon:** +4.3 to +5.7 min in every city (median +5.0). Confirms the note "Zuhr is set five minutes after Noon" (2009 p.3).
    - **Maghrib − computed sea-level sunset (−0.833°):** +1.8 to +4.2 (median +3.0/+3.1). Confirms "Maghrib – 3 Minutes has already been added to calculated sunset".
    - **Sunrise − computed sunrise:** −1.1 to +1.2 (median 0). The Sunrise column is unmodified calculated sunrise, as the notes say ("the sunrise times given in the tables below are calculated sunrise times"). The "take away three minutes" advice is **not** applied in the table.
    - **Asr − computed Hanafi (shadow = 2 + tan|φ−δ|):** −1.5 to +1.8 (median about −0.1). Confirms Hanafi two-shadow Asr with no added offset.
  - **Fajr and Isha intervals as printed:**
    - Printed Fajr is 93–125 minutes before printed Sunrise; printed Isha is 65–100 minutes after printed Maghrib.
    - **London (p.321–331):** Fajr 93–120 min before sunrise; Isha 66–98 min after Maghrib.
    - Implied solar depression at the printed times, London: Fajr 11.8°–15.7°, Isha 9.1°–14.6° (below the horizon; Isha measured from the printed Isha time).
    - Aberdeen (57°10'N): Fajr 95–125 min, Isha 65–100 min, implied Fajr 8.5°–14.1°.
    - The intervals are therefore not constant Blackburn minutes: they grow slightly with latitude. There is no sign of a 1/7-night (Sab'u Lail) rule even at Aberdeen and Dundee (above 55°N).
    - Example, Aberdeen 21 Jun (p.12): Fajr 2:07a, Sunrise 4:12a (125 min before), Maghrib 10:11p, Isha 11:32p. 1/7 of the Maghrib-to-sunrise night would be about 52 min.
  - **Belfast and Coventry were computed at the (wrong) printed coordinates.**
    - Belfast's header reads "Lt=51:38N Lg= 0:25E". With those coordinates Zuhr − noon is +5.0 and Maghrib − sunset +3.0 on every date. So the Belfast table is for a point in Essex, not Belfast (54°36'N 5°56'W); Belfast Zuhr on 1 Jan is printed 12:07p, earlier than London's 12:09p.
    - Coventry is likewise consistent with its printed "Lg= 0:30W" rather than about 1°31'W.
    - Readers using those two tables would be misled. As printed; my inference from the check.
  - **Clock-change error in two London tables:**
    - **EALING LONDON** (p.169–179) and **HACKNEY London** (p.223–233) switch to BST on **26 Mar** and back on **29 Oct**. These are the 2006 clock-change dates.
    - Every other city, including LONDON and CROYDON, switches on **25 Mar** and **28 Oct** (the 2007 dates the notes say are used).
    - As printed, Ealing's 25 Mar row is "4:19a 5:53a 12:12p 4:22p 6:26p 7:42p" (GMT) while London's is "5:19a 6:53a 1:12p 5:21p 7:24p 8:41p" (BST). Ealing's 28 Oct row is "6:11a 7:48a 12:50p 3:53p 5:45p 7:11p" (still BST) while London's is "5:10a 6:46a 11:50a 2:53p 4:45p 6:11p".
    - Identical in the 2006 edition.
  - Nottingham lacks an "Apr 30" row in both editions: Apr 29 is followed by May 1 on 2009 p.368.
  - Text-layer fidelity: 2009 p.321 (London start) was rendered and compared by eye with the parsed rows; they match.
- **C8. Reading progress, 2009 chart tables (`uk2009.bydate.txt`, 18,469 lines):** reading in 700-line chunks, logged here as it goes.
  - Lines 1–6300 read (PDF pp.1–187: Aberdeen, Belfast, Birmingham, Blackburn, Bolton, Bradford, Bristol, Burnley, Cardiff, Chorley, Coventry, Croydon, Derby, Dewsbury & Batley, Dundee, Ealing, and Edinburgh to 13 Sep).
  - Observations while reading, as printed:
    - Every table runs Jan 1–Dec 31.
    - Zuhr is shown as "12:00n" at true noon.
    - BST jumps are on Mar 25 and Oct 28 in every city except Ealing (Mar 26/Oct 29).
    - Summer Fajr minima include Aberdeen 2:07a (Jun 20–22), Dundee 2:17a (Jun 21–22), Edinburgh 2:23a (Jun 18–23), Blackburn 2:37a (Jun 20–22), Croydon 2:44a (Jun 19–23), Ealing 2:44a (Jun 19–22).
    - Latest summer Isha: Aberdeen 11:33p (Jun 22), Dundee 11:30p, Edinburgh 11:27p, Blackburn 11:09p (Jun 22), Croydon 10:45p (Jun 22), Ealing 10:46p.
    - Row-to-row changes are smooth throughout: no jumps other than the BST changes.
  - Lines 6301–9100 read (PDF pp.187–268: Edinburgh to Dec, Essex, Exeter, Glasgow, Hackney, Halifax, Huddersfield, Hull, Ipswich to 16 Feb).
    - Hackney confirmed on the rows themselves: Mar 25 is still GMT ("4:18a 5:52a 12:11p"), Mar 26 is BST ("5:15a 6:50a 1:11p"); Oct 28 is still BST ("6:10a 7:46a 12:49p"), Oct 29 is GMT ("5:11a 6:48a 11:49a"). p.226, p.232.
    - Glasgow summer minimum Fajr 2:27a (Jun 21–22), latest Isha 11:31p (Jun 22–23).
    - Exeter summer Fajr minimum 3:02a (Jun 18–23), latest Isha 10:55p (Jun 22).
    - Hull Fajr 2:29a (Jun 18–23), Isha 11:00p (Jun 22–24).
    - No anomalies beyond those already logged.
  - Lines 9101–11900 read (PDF pp.268–348: Ipswich, Lancaster, Leeds, Leicester, Liverpool, **London (pp.321–331)**, Luton, and Manchester to 24 Jul).
    - **LONDON (Lt=51:30N Lg=0:10W), all 365 rows read**, selected rows exactly as printed:
      - Jan 1 "6:25a 8:06a 12:09p 2:15p 4:05p 5:41p" (p.321)
      - Mar 24 "4:22a 5:55a 12:12p 4:20p 6:23p 7:40p", then Mar 25 (BST) "5:19a 6:53a 1:12p 5:21p 7:24p 8:41p" (p.323)
      - Jun 21 "2:44a 4:43a 1:07p 6:40p 9:25p 10:45p"; Jun 22 "2:43a 4:43a 1:07p 6:40p 9:25p 10:45p" (p.326; the earliest Fajr in the London table)
      - Latest Isha "10:45p", Jun 21–25 (p.326)
      - Oct 27 "6:08a 7:45a 12:50p 3:55p 5:47p 7:12p", then Oct 28 (GMT) "5:10a 6:46a 11:50a 2:53p 4:45p 6:11p" (p.330)
      - Dec 31 "6:25a 8:06a 12:08p 2:14p 4:04p 5:41p" (p.331)
    - Luton, Leicester, Leeds, Lancaster, Liverpool and Ipswich: smooth, BST on Mar 25/Oct 28, nothing irregular.
    - Leeds summer minimum Fajr 2:33a (Jun 19–23); Liverpool 2:41a (Jun 21–22); Lancaster 2:36a (Jun 20–22).
  - Lines 11901–14700 read (PDF pp.348–429: Manchester, Newcastle, Nottingham, Oldham, Oxford, Peterborough, Plymouth, and Portsmouth to 29 Dec).
    - Confirmed on the rows: Manchester "Aug31 4:35a 6:15a 1:15p 5:53p 8:05p 9.17p" (p.350), with a full stop in the Isha time.
    - Confirmed on the rows: Nottingham goes "Apr29 3:52a …" then "May01 3:47a …" with no Apr 30 (p.368). The Fajr step of 5 minutes across the gap is consistent with a skipped row.
    - Oldham, one-minute non-monotonic Fajr at year end: "Dec30 6:43a" then "Dec31 6:42a" (p.386). Rounding-level; as printed.
    - Newcastle summer Fajr minimum 2:24a (Jun 20–22), latest Isha 11:13p (Jun 21–25).
    - Plymouth summer Fajr minimum 3:06a (Jun 21–22).
    - Peterborough ("KENT" in the header; Peterborough is in Cambridgeshire) summer Fajr 2:37a (Jun 17–23).
  - Lines 14701–17500 read (PDF pp.429–508: Portsmouth, Preston, Rochdale, Rotherham, Sheffield, Southampton, Stoke-on-Trent, Sunderland, and Swansea to 4 Jun).
    - All smooth, with BST on Mar 25 and Oct 28.
    - Sunderland summer Fajr minimum 2:24a (Jun 19–23), latest Isha 11:12p (Jun 21–24).
    - Southampton Fajr 2:52a (Jun 20–22).
    - Preston Fajr 2:38a (Jun 19–23).
    - Rotherham and Sheffield Fajr 2:35a / 2:36a (Jun 19–23).
    - No further typos or gaps found.
  - Lines 17501–18470 read (PDF pp.509–537: Swansea, Wakefield, Walsall). **The 2009 tables are now read in full: 537/537 pages, 49 cities, 17,884 date rows.**
    - Swansea summer Fajr 2:58a (Jun 18–23).
    - Wakefield 2:34a (Jun 18–23).
    - Walsall 2:43a (Jun 21–22); Walsall's last row is "Dec31 6:37a 8:19a 12:15p 2:15p 4:05p 5:43p" (p.537).
  - **Header lines, 2006 vs 2009.**
    - Every one of the 31 common city headers (Lt, Lg, GMT, Qibla Compass with its epoch, Qibla from True North) is character-for-character the same.
    - The epoch in brackets is "2006.91" or "2006.92" in both editions: the magnetic declination epoch, so the charts were generated in late 2006.
    - 2006 pp.4–6 carry nothing beyond table rows and page numbers.
  - **2006 edition tables (257 pp.):** covered by the full by-date diff in C6 (0 differences on every common date). The 2009 read therefore covers every 2006 row as well. The 2006 notes pages (pp.1–3) were read in full for A4.

### C9. muslimnames.pdf, "Muslim Names For Muslim Children" (Syed Khalid Shaukat), text layer read in full
- **Pages read:** 158/158 PDF pages, text layer lines 1–11,160 read with nothing skipped.
- **Structure:**
  - Front matter: preface dated April 2015; Foreword placeholder "Expected to be written by Dr. Sayyid Saeed".
  - Boys' names: letter-divider pages, then tables with columns English / Urdu / Origin / Abjad / Meaning, through Zulqarnain (printed p.78).
  - "Names for Girls" (PDF p.89, printed p.79), Abeer through Zulfeen (printed p.148).
- **Pages blank apart from the page number** (checked by render): PDF p.63 (printed 53), p.105 (95), p.111 (101), p.137 (127), p.145 (135), plus p.6, 8, 10, 12 and 41.
- **Urdu column:** the text layer holds 0 Arabic-script characters on the 90 pages with vector drawings, so the Urdu names are drawn as vector paths. The render check of those pages is in C9a.
- **Transcription oddities, as printed:**
  - The P section of girls' names is printed twice on PDF p.131.
  - Some entries have no Abjad value: Takmeel (p.78) and Noorain (p.126).
  - "Musaff1" (p.123).
  - The only astronomy-adjacent meanings are name glosses: "Tariq … morning star", "Sumair … Sunset time", "Zuha … beakfast time", "Taqweem … calendar, almanac".
- **Prayer-time content: none.**

### C10. Figure pages rendered and viewed (content outside the text layer)
- **moon_uk v0.8, pp.4, 5, 7, 8, 9, 12, 13, 14.**
  - p.4, Fig.1: orbit diagram with Sun, New Moon, Crescent Moon, Earth and Full Moon ("www.moonsighting.org.uk").
  - p.5, Fig.2: "Solar Eclipse Geometry" ("www.MrEclipse.com ©2000 F. Espenak").
  - p.7: Fig.3 is a lunar-phase photo grid; Fig.4 is "Geometry of Earth–Sun–Moon system during 1st quarter lunar phase".
  - p.8, Fig.5: phase and elongation diagram ("Sun would be about 389 times farther away than the Moon").
  - p.9, Fig.6: "Lunar Eclipse Geometry". The same page cites Schaefer, Ahmad and Doggett, Q.J.R. Astr. Soc. (1993) 34 p53-56, including "Morning crescent on Sep 14, 1871, Age -15.4h at Athens Greece, seen by Schmidt (Naked eye)".
  - pp.12–14, Figs.7–9: screenshots of Acrobat windows showing "F2005Jan10.pdf", "F2005Jan11.pdf" and "F2005Jan12.pdf", each titled "Visibility of the New Crescent Moon for 2005 January 10/11/12". Each is marked "New Moon: 2005 January 10 at 12:03 UT", with key classes A–F.
  - **Urdu caption discrepancy on p.13:** the English says "the 12th of January 2005" but the Urdu prints "٢١ جنوری ٢٠٠٥" (21 January), apparently transposed digits.
  - p.14 Summary: "Moon must be born", "Moon must not set before Sunset", "Moon must be over 13 hours old and if it is less than 15 hours old it is better to have multiple witnesses to this sighting".
  - The v0.7 images are md5-identical (C1).
  - **Prayer-time content: none.**
- **qibla-wy pp.2–7, 9, 10.**
  - Fig.1: azimuthal and globe maps of points A–F relative to Makkah.
  - Figs.2–4: great circle vs rhumb line, and a gnomonic vs Mercator comparison of Tokyo and New Orleans. Footnote 1: Al-Baqarah 150.
  - Fig.5: direction vs bearing (triangle ABC).
  - Fig.6: the spherical triangle PAB.
  - p.9, "5. Qibla, around the world": a table of 31 cities, for example "Paris (France) 48.52° N 2.20° E 118.6°" and "Oslo (Norway 59.55° N 10.45° E 138.4°" (the missing bracket is as printed). There is no UK city.
  - p.10, Fig.7: world map of qibla vectors.
  - **Prayer-time content: none.**


### C9a. muslimnames: the vector-drawn Urdu pages, rendered and viewed
- **Pages viewed:** all 90 pages that use vector drawings, as 23 tiles of four pages each (`doc-reading/png/names_tile_00.png` to `names_tile_22.png`; PDF pp.15–158).
- **What the drawings are:** every one is a name table (English / Urdu / Origin / Abjad / Meaning) with the Urdu spelling drawn as glyph outlines. There are no charts, figures or prayer tables.
- **Extra detail from the renders, as printed:**
  - Benazir (printed p.85) has a blank Meaning cell.
  - Kulsoom's meaning (p.107) is set in a smaller font.
- **Total pages read:** 158/158 (text layer plus render). **Prayer-time content: none.**

### C11. Remaining figure renders, viewed
- **articles/ahilla, pp.5 and 7.**
  - Contents: Arabic hadith boxes. p.5: Abu Dawud "16920" and the Kuraib hadith (Sahih Muslim). p.7: Sahih Muslim "765 … (8801) - 29".
  - p.7 also states: "The Prophet SAW taught that 5 prayers make a day and the first prayer of the day is the Fajre. It is not Magrib."
  - That is day-boundary theology, not a prayer-time calculation.
- **articles/eid-or-hajj, pp.1 and 9.**
  - p.1: title "Revised"; "Eid-ul-Adha: Going with local moon sighting or with Hajj Schedule?", Muhammad Nisarul Haq.
  - p.9: a pink table of Eid-ul-Adha 2006 dates by country ("Wednesday, January 11, 2006: … 6. UK"); footnotes 21–22 cite moonsighting.com/1426zhj.html and 1427zhj.html.
  - **Prayer-time content: none.**
- **ramadan1431 (CMSC of Great Britain), pp.1–2.**
  - Letterhead: "Central Moon-Sighting Committee of Great Britain (Hizbul Ulama UK, Darul Uloom Bury, Jamiatul Ulama Britain)". Signed "Y.A.Miftahi (HGS)".
  - Contents: a Birmingham testimony for Ramadhan 1431, "Tuesday 10th August 2010 … at about 9 PM", from the Madina Masjid car park on Adderley Road.
  - Handwritten signatures are rendered as images.
  - **Prayer-time content:** "after Maghrib Salaat" is the only prayer reference; there are no times.
- **images/revised (UUCSA letter), p.1.** "Adjustment of Islamic Date": 1st Rabi ul Akhir 1434 moved to 12 February 2013. Signed Moulana Ebrahim Bham, 19 February 2013. **Prayer-time content: none.**
- **mecca-introduction, p.2.** Two tables comparing month lengths in Algiers with a Hoggar oasis. **Prayer-time content: none.**
- **articles/pmi-pmp, pp.1–2.**
  - Contents: "PMI PMP: General Overview, Exam Preparation", with a link to prepaway.com. This is spam or SEO content unrelated to the site's subject.
  - **Prayer-time content: none.**
- **fajarishainbritain1, pp.15 and 58 (printed 14 and 57).**
  - p.14, "Table 1: Selection of Modern Day Degree based Calculation Methods":
    - Karachi 18/18
    - "Various" 15/15, "Parts of the USA, Canada, Parts of the UK"
    - MWL 18/17
    - Umm Al-Qura 19 / "90 minutes after the Sunset Prayer 120 minutes (in Ramadan only)"
    - Egyptian 19.5/17.5
  - p.57, "Table 3: Locations where the sun does not rise and set for every day of the year", for example "66:30N Arctic Circle 1575 17 Dec-26 Dec 29 May-13 July 308", with "Source: www.moonsighting.com".
  - The render matches the text layer.
- **unity-in-calendar (Diyanet), pp.1–4.**
  - Contents: announcement of the "International Start of the Lunar Months and Hijri Calendar Unity Congress". Proposals due September 15, 2015; congress planned for March 2016.
  - The Scientific Commission list includes "Dr. Zülfiqar A. Shah (USA)".
  - **Prayer-time content: none.**
- **yes-moon-sighted (Khalid Jan, Ottawa, June 9, 2015), pp.1–4.**
  - Contents: an argument against naked-eye sighting on perception and medical grounds, with footnotes [1]–[17].
  - **Prayer-time content: none.**
- **twoeids, pp.2, 3, 4, 5, 10, 11, 12.**
  - Figures:
    - Figs.1–4: elongation angle diagrams.
    - Fig.5: illuminated-percentage curve.
    - p.5, Table 1: Saudi month starts 1417H–1423H with "Age of moon at the time of sunset", for example "Zul-Hajj 1423H Feb 2, 2003 Sunday | Feb 1, 2003 13:48 | 18:10 | 4 hrs 22 min | Impossible".
    - p.10, Table 2 (East vs local claim); p.11, Table 3 (claim vs science).
    - p.12, Fig.6: flow diagram "to decide about hilaal".
  - p.3 states it "can not be less than 15 hours" from conjunction to first visibility, citing Ilyas 1994, QJRAS 35 pp.425-461.
  - **Prayer-time content: none.** Sunset in Makkah is used only as the moon-age reference.


### C4a. prayer.html 2011 captures: the "h" and "sah" tokens, located (closes the open item in C4)
- **Where they come from:** four captures (20110522060534, 20110623225032, 20110727110355, 20110827031037) have a mis-encoded byte in the raw HTML: "[Sah\ufffdh Muslim]".
- **Effect:** the visible HTML text splits "Sah" / "h" at the replacement character. The `.txt` conversion has "[Sahîh Muslim]", so it lost nothing.
- **Captures without the passage:** 20101114190900 and 20110318232426 contain neither token.
- **Context, as printed:** 'He replied: "You should approximate the times." [Sahîh Muslim]. Therefore, for such situations, a suggestion by Fuqaha' is t…'
- **Result:** a pure encoding artefact. **No words lost** in any of the 56 captures.


### C12. prayers-uk.pdf, pp.10–16 (printed 357–351): prayer-time pages re-rendered at 150 dpi and translated sentence by sentence
- **Renders:** `doc-reading/png/puk/puk_p01–p20.png` (150 dpi). The earlier 130-dpi set is `png/prayersuk_p1–p20.png`.
- **This pass:** every sentence on pp.10–16 was re-read from the image. The translation below is faithful rather than loose; Urdu numerals are rendered as Western digits; brackets hold my notes.
- **Corrections to A3:**
  - (a) Asr: the page says only "سایہ اصلی کے دوگنا (مثلین)", "double the original shadow (mithlayn)". A3's gloss "plus noon shadow" is interpretation, not printed text.
  - (b) Point (2) also refers the reader to the Urdu book for the Shar'i status. A3 omitted that.
  - (c) p.13 is now translated in full.
- **Heading, p.10:** "Clarification regarding the times given in the book"
- **Points (1)–(4), p.10:**
  - (1) "In the book the prayer times have been arranged according to the conventional Greenwich Mean Time (G.M.T.)."
  - (2) "In the book the Fajr and Isha times are based on eyewitness observations, whereas the times of sunrise, zawal, and the three prayers Zuhr, Asr and Maghrib have been arranged by approximate calculation from the assumed theories of astronomy; for their 'Shar'i status' read my separate Urdu book 'The correct time of Isha in Britain'."
  - (3) "In the book these times of the year-2007 calendar are prepared according to summer and winter time, in which the one-hour decrease or increase in March and October has also been made."
  - (4) "The Zuhr time has been set from five minutes after the time of nisf al-nahar (half the day, or Midday); at this time the Zuhr prayer can be prayed without any doubt."
  - (A) "The zawal minutes are counted thus: five precautionary minutes are counted before the assumed time of Midday, and the remaining five minutes are counted from exact Midday until zawal, i.e. the start of Zuhr time, as follows:"
- **The five minutes, p.11:**
  - (i) "One and a half minutes are for the last edge of the sun to leave the meridian completely, because the sun needs only one and a half minutes to decline fully from the meridian."
  - (ii) "Then, keeping in view an area of thirty miles around the central point of the city whose Midday time this is, one more minute has been added, so that the time difference of that area relative to the city's central time is covered. This makes two and a half minutes; then for further precaution another two and a half minutes were included, so that all three together make five minutes."
  - (iii) "If the five minutes before Midday are added to these five, a total of ten minutes is counted as the 'zawal of the sun'!"
  - Note: "At Midday every prayer is haram; Zuhr time begins after the said ten minutes. In reality the makruh time is only the one and a half to two and a half minutes in which the sun declines from the meridian and moves fully away. But because observatory times are approximate, not definitive, instead of two and a half minutes the said ten minutes have been counted as makruh time as a precaution, to remove the uncertainty and expected shortfall of the calculation."
- **Points (5)–(6), p.12:**
  - (5) "The Asr time has been arranged by calculating the time when the shadow is double the original shadow (mithlayn); for the time of mithl-e-awwal, contact Dr Khalid Shaukat at the email shaukat@moonsighting.com."
  - (6) "The Maghrib prayer times have been arranged not by the observatories' sunset times computed for sea level, but according to the maximum height above sea level. The detail is that three minutes have been added to the observatory's sunset times, so that no doubt remains that the sun has set. (Some people add five minutes instead of three. Although three minutes suffice, anyone who wants to add five minutes in total should add only two minutes to these three, not five, so that three and two together make five in total.)"
  - (A), running on to p.13: "The observatory people give the sunrise and sunset times of every city and place according to sea level rather than the elevation of those places, because it is not possible to calculate sunrise and sunset correctly by taking into account the elevation of every place with its ups and downs. So the approximate sunrise and sunset times that they give by sea-level (Sea Level) reckoning, they give on the assumption that the earth is perfectly round, like a football! Yet it is not so. They themselves describe the surface around the assumed centres of the earth, the North and South poles (Northpol/SouthPol), over areas thousands of miles long and wide, as not exactly level like the sea surface but pitted, with highs and lows, and to a considerable degree flattened and depressed. Despite this, their arranging sunrise and sunset times while treating the whole earth as round like a 'football' at sea level is their technical compulsion. In reality, at that moment the sun has neither risen nor set: at the given sunset time, in clear weather, it is still before the eyes, which in their technical terminology they call refraction (Refraction), and it actually sets a little later; likewise, it is seen rising a little before their given sunrise times!"
- **The sunrise correction, p.13:** "Note: In the book (the Maghrib time is in order, but) the sunrise times have been set equal to the observatory's sea-level times; therefore it is necessary to set the sunrise times by subtracting three minutes from each day's 'sunrise' times."
- **Points (7)–(8), p.14:**
  - (7) "The Isha and Fajr times follow the year-long observations, the detail of which is in my separate Urdu and English books ('Fajar and Esha' and 'The correct time of Isha in Britain', compiled by Molvi Yaqub Ahmad Miftahi); see there."
  - (8) "It is well known that in Britain the clock must be moved one hour back or forward on the last Sunday of March and October. The times in the book follow the 2007 calendar, in which this decrease or increase has also been made; therefore for later years the decrease or increase need be made only for a few dates of these two months (not for all the months from March to October or October to March). For detail see:"
- **(A), pp.14–15, the clock change as printed:**
  - Quote: "It is well known that in Britain in October one hour is added to standard time, so that at sunrise the start of these hazy winter days is in more light, by the artificial method of moving the clock one hour forward. This protects against road traffic accidents, and gives people more daylight at the start of the day for leaving home for their daily work, for children going to madrasah and school, and for returning home in the evening. Then as soon as the days advance from cold to warmth and become bright and clear by March, this one-hour increase is restored to the original standard time from the last Sunday of March by moving the clock one hour back. In this way the cycle of moving the clock one hour forward and back continues twice every year, in October and March."
  - [As printed. The direction is the reverse of UK practice, where clocks go back in October and forward in March. In this text's own terms "increase" = the winter setting and "decrease" = the summer setting, and points C and E below are consistent with that usage.]
- **(B), p.15:** "On this basis the dates of the last Sunday of October and March in later years will change relative to those of previous years, and to the extent of the difference in dates, a minor change will be needed year by year in the times of those dates! For example, the last Sunday of March 2007 is the 25th whereas in 2008 it is the 30th; likewise the last Sunday of October 2007 is the 28th whereas in October 2008 it is the 26th. So in March 2008 the last-Sunday date differs by four days, and in October by two days."
- **(C), p.15:** "In view of this difference, in March 2008 an increase of one hour will now be made in the times of the 25th together with the 26th, 27th, 28th and 29th, because they previously carried the decreased time, whereas from the 30th the one-hour-decreased time is already present."
  - [Physically: 25–29 March are BST in the 2007-based tables but GMT in 2008, so the printed times for those dates are one hour late for 2008.]
- **(D), p.16:** "Likewise there is a clear difference between the last Sunday of October 2007 and that of October 2008: the last Sunday falls 'two days earlier', on the 26th instead of the 28th."
- **(E), p.16:** "In view of this difference, the increase of one hour will be made only on the two dates 26 and 27 October 2008, because on the later dates this increase is already present."
- **Result, p.16:** "The result: from the 2007 times, each year a one-hour decrease or increase must be made only on some dates around the last Sunday of March and October, and the rest of the calendar stays as it is."
  - Closing duʿa (Urdu and Arabic). Signed "Molvi Yaqub Ahmad Miftahi, Nazim Hizbul Ulama UK, Muharram al-Haram 1428 / January 2007".
- **Consistency with the tables (C7):** the offsets stated here match what the tables show numerically:
  - Zuhr = noon + 5
  - Maghrib = sunset + 3
  - Asr at mithlayn
  - Sunrise printed at sea-level value, with −3 to be applied by the reader
  - GMT with 2007 clock changes
- **Page ledger:** prayers-uk.pdf 20/20 pages read visually (A3). Pages 10–16 were re-verified in this pass.

### C13. Image and render checks for documents in PART B
- **alwatanimpossible.pdf, 4/4 pages viewed** (`png/alwatan_p1–p4`).
  - The Arabic original of Al-Watan "شهود المستحيل", Hamza al-Muzaini, dated "الخميس 10 ذو الحجة 1425هـ الموافق 20 يناير 2005م العدد (1574)".
  - Same article as B7; the Arabic says the witnesses were each over eighty ("يتجاوز عمر كل واحد منهما الثمانين").
  - Only prayer reference: "قبيل المغرب" ("just before Maghrib"). No prayer-time content.
- **actual-saudi-dates.pdf, 2/2 pages viewed** (`png/misc/saudidates_p1–p2`).
  - Blue marks "a day later than calculated date"; red marks "a day earlier".
  - 1431 Shawwal and Zul-Hijja, and 1433 Ramadan, are highlighted yellow: "Cases when moon is easily visible somewhere on the globe".
  - Red cells, for example: 1395 Zul-Hijja and Hajj; 1404 Muharram and Shawwal; 1425 Shawwal, Zul-Hijja and Hajj; 1428–1429.
  - Blue cells, for example: 1390; 1407–1408; 1416; 1432 Shawwal; 1433–1435; 1436; 1439.
  - No prayer-time content.
- **images/eclipses/le2015sep28t.pdf, 1/1 viewed.** NASA/Espenak "Total Lunar Eclipse of 2015 Sep 28", "Greatest Eclipse = 02:48:16.8 TD (= 02:47:07.5 UT)", contacts P1 00:11:47 to P4 05:22:27 UT, dated "2009 Apr 29". No prayer-time content.
- **images/eclipses/le2016mar23n.pdf, 1/1 viewed.** "Penumbral Lunar Eclipse of 2016 Mar 23", "Greatest Eclipse = 11:48:21.3 TD (= 11:47:11.8 UT)", P1 09:39:29 to P4 13:54:50 UT. No prayer-time content.
- **fiji-eid.pdf, 1/1 viewed.** Fiji Muslim League, 8 August 2013: new moon sighted, Eid-ul-Fitr Friday 9 August 2013. Signed Mohammed Taabish Akbar. No prayer-time content.
- **wayback/fatwa_scholars.pdf (5 pp., KAMIL KHAN, 2005-10-14): text 231/231 lines and all 5 renders viewed.**
  - This is a different document from the 38-page articles/fatwa_scholars.pdf (C2).
  - Contents: a digest of fatwas against following Saudi sighting in the UK and for following Morocco:
    - Deoband, Mufti Habibur Rahman, 18 Safar 1424
    - Mazahirul-uloom, 1 Sha'aban 1424
    - Dhabail
    - Nadwatul Ulama, 9 Jan 1992
    - Khairul Madaris Multan, 24 Jumadal-Thani 1424
    - Binori Town, 21 Ramadhan 1424
    - Taqi Usmani, 19 Dhil-Hijja 1412 and 19 Rabiut-Thani 1413
    - Manzoor Naumani retraction, 19 Nov 1990
    - Darul Ifta Bradford, 16 Jan 1992
    - Ahsanul Fatawa
    - ECFR resolution
  - Placeholder links "VIEW FULL IN TEXT IN URDU ENGLISH (PLEASE PLACE A HYPELINK TO THE PDF)" are printed in blue.
  - Only time mention: Mazahirul-uloom's "countries … where there isn't a lot of difference between sunrise and sunset times". No prayer-time content.

<!-- PART-C-BELOW -->


# PART D. Final completeness ledger: every document, pages read out of total

Coverage for each file is shown as pages read out of pages in the file. "Text" means the full text layer was read line by line with no truncation; "render" means pages were viewed as images. Identical copies were checked by md5; near-duplicates by complete diff. Section references point to the evidence in this file.

## Live site (`pdfs/live/`)
| File | Pages read / total | How | Prayer-time content | Ref |
|---|---|---|---|---|
| 1444HijriCalendar.pdf | 6/6 | text 1191/1191 + 6 renders | none | B29 |
| actual-saudi-dates.pdf | 2/2 | text 500/500 + 2 renders | none | B1, C13 |
| articles__louaysafi.pdf | 2/2 | text | none | B2 |
| articles__moonsighting-in-saudi-arabia.pdf | 1/1 | text | none | B3 |
| articles__suggested-global-islamic-calendar.pdf | 8/8 | text | stance only: calculated Salah times accepted, no method | B4 |

## Wayback (`pdfs/wayback/`)
| File | Pages read / total | How | Prayer-time content | Ref |
|---|---|---|---|---|
| articles__fajr&isha-yam.pdf = fajr&isha-yam.pdf (md5 identical) | 123/123 | text + figure renders | **YES**: Blackburn observations, Fajr/Isha model statements | A1 |
| fajar&isha-a5.pdf | 123/123 | text + full diff vs A1 | **YES** | A2 |
| fajarishainbritain1.pdf | 68/68 | text + full raw diff (lines 1–1663, all read) + renders | **YES** | A2, C11 |
| articles__prayers-uk.pdf (Urdu) | 20/20 | visual (text layer unusable); pp.10–16 re-read at 150 dpi and translated | **YES**: GMT basis, Zuhr = midday+5, Asr mithlayn, Maghrib = sunset+3, sunrise −3, clock-change rule | A3, C12 |
| articles__uk-prayercharts.pdf (2006) | 257/257 | parsed by date; full diff vs 2009 (identical on common dates); headers identical | **YES**: tables | A4, C6 |
| articles__uk-prayercharts1.pdf (2009) | 537/537 | every city page read (18,470 by-date lines) + solar check | **YES**: tables | A4, C6–C8 |
| prayer-html/ (64 captures, 1999–2025) + captures.txt | 64/64 captures | visible text vs .txt word check; all read | **YES**: method statement history | A6, C4, C4a |
| prayer-french.html | 1/1 | text | **YES** | A5, C3 |
| articles__moon_uk.pdf (v0.8) | 49/49 | text + figure renders | none | C1, C10 |
| moon_uk.pdf (v0.7) | 47/47 | full diff vs v0.8; images md5-identical | none | C1 |
| articles__fatwa_scholars.pdf | 38/38 | full diff vs moon_uk v0.8 pp.15–49 + own front matter | none | C2 |
| fatwa_scholars.pdf (different 5-page doc) | 5/5 | text + 5 renders | none | C13 |
| articles__adha-paper.pdf + .doc | 26/26 | doc text 503/503 + full pdf/doc diff | none (Takbeer timing fiqh only) | B32, C5 |
| articles__eid-or-hajj.pdf + .doc | 10/10 | full diff vs eid-article (read in full) + pdf/doc diff + renders p1, p9 | none | B17a, C5, C11 |
| eid-article.doc | 1 doc (no pagination) | text 219/219 + Quick Look page 1 | none | B17, B17a |
| articles__twoeids.pdf = twoeids.pdf (md5 identical) | 14/14 | text 830/830 + figure renders | none | B30, C11 |
| qibla-wy.pdf | 11/11 | text 719/719 + figure renders | none | B31, C10 |
| compass.pdf | 9/9 | text 2184/2184 + p1 render | none (unexplained 0–39 dial numbers; London 26) | B28 |
| muslimnames.pdf | 158/158 | text 11,160/11,160 + blank pages + 90 vector pages rendered | none | C9, C9a |
| articles__urdu-uk-moonsight.pdf = urdu-uk-moonsight.pdf (md5 identical) | 16/16 | visual (scans); printed pp.9–16 absent from source | none | B14, B14a |
| alwatanimpossible.pdf | 4/4 | 4 renders (text layer garbled) | none | B8, C13 |
| al-watan-80-yr-witnesses.pdf + .doc | 3/3 | text + doc text 38/38 | none | B7 |
| articles__Suggested Global Islamic Calendar 2nd meeting.pdf | 4/4 | text | one Fajr remark ("15º, 18º, 19º … no unified definition of Fajr") | B5 |
| articles__ahillah.pdf | 10/10 | text + renders p5, p7 | none (day-begins-at-Fajr theology) | B9, C11 |
| articles__louaysafi.doc | 1 doc | text 36/36 | none | B2 |
| articles__moonsighting-in-saudi-arabia.doc = moonsighting-in-saudi-arabia.doc (md5 identical) | 1 doc | text 18/18 | none | B3 |
| articles__moonsplit.doc | 1/1 | text 13/13 + Quick Look render | none | B10, B10a |
| articles__pmi_pmp.pdf | 2/2 | text + renders | none (spam) | B11, C11 |
| articles__quranic-calendar.pdf | 9/9 | text | none | B12 |
| articles__relevance of ummul qura calendar.pdf | 4/4 | text | none | B13 |
| astronomy-overview.ppt | 30 slides | all slide text (142/142 lines) + all 32 pictures + title slide | none | B15, B15a |
| astronomy2009.ppt | 26 slides | all slide text (228/228) + all 30 pictures (subset of overview) + title slide | none | B15, B15a |
| fcna-drsiddiqi.ppt | 14 slides | all slide text (186/186) + its 1 picture (black) + title slide | none | B18, B15a |
| aashura1430.doc | 1 doc | text 10/10 | none | B6 |
| ecfr-announcement.doc (Arabic) | 1 doc | text 56/56 | none | B16 |
| rhcna.doc | 1 doc | text 19/19 | none | B22 |
| saudi-announcement1434shw.doc | 1 doc | text 2/2 | none | B23 |
| ned-tour1966.doc | 1 doc (6 printed pages) | text 140/140 (+ strings 53/53); all 45 embedded pictures viewed (B27a) | none | B27 |
| fiji-eid.pdf | 1/1 | render | none | C13 |
| images__eclipses__le2015sep28t.pdf | 1/1 | render | none | C13 |
| images__eclipses__le2016mar23n.pdf | 1/1 | render | none | C13 |
| images__revised-report-sa.pdf | 1/1 | text + render | none | B19, C11 |
| mecca__introduction.pdf | 4/4 | text + render p2 | none (Fajr in Mecca as a calendar limit only) | B20, C11 |
| ramadan1431 false claim.pdf | 2/2 | text + renders | none ("after Maghrib Salaat") | B21, C11 |
| unity in calendar.pdf | 4/4 | text + 4 renders | none | B24, C11 |
| yesmoonsighted.pdf | 4/4 | text + 4 renders | none | B25, C11 |
| timezone.html | 0 bytes | nothing to read (empty capture) | n/a | B26 |

## Redo note (character limits and truncation)
- **Redone in full after the no-truncation directive** (C-series):
  - moon_uk Arabic diff
  - fatwa_scholars stats
  - adha/eid pdf-doc diffs
  - chart samples
  - britain1 raw diff (lines 500–1663 read this session)
- **Earlier scans that used partial reads** were superseded by these complete reads:
  - muslimnames 1–11,160
  - uk2009 by-date file in 700-line chunks
- **Remaining unverified items, stated honestly:**
  - PPT slide-by-slide picture placement (no renderer).
  - actual-saudi-dates colour coding: now verified by render (C13).
  - The meaning of the compass.pdf numbers.
  - The Shaukat Foreword referred to in A3 is not on disk.
  - Printed pp.9–16 of urdu-uk-moonsight are absent from the source file.
- **Unobtainable documents: none.** Every manifest entry is on disk and read; timezone.html is an empty capture.
