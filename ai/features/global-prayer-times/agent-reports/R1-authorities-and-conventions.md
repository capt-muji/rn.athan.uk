# R1: The calculation authorities and conventions of the world

**Agent:** R1, wave 1 of the global prayer times research.
**Written:** 2026-09-30.
**Scope:** every prominent prayer-time calculation authority and convention worldwide, its published parameters,
and the primary source for those parameters. The Moonsighting Committee (Khalid Shaukat) is treated as one known
row and was not re-researched: wave 1 of `ai/features/moonsighting/` established it in depth.

**Tool path used.** Every web search and page fetch in this report went through the `tinyfish` MCP
(`tools.tinyfish.search` and `tools.tinyfish.fetch_content`). Four JSON and PDF endpoints that tinyfish could not
return were fetched with a plain `fetch` from inside the `execute` runtime, and each is labelled in the sources
table. No `curl` was used. No `agent-browser` was needed. No page required a real browser.

**How numbers in this report are marked.**

- **cited** means a named source asserts it, with a URL and a fetch date in the sources table.
- **measured** means this research computed it. Every measured angle was derived by taking an authority's OWN
  published timetable and inverting the standard solar-hour-angle equation to recover the solar depression the
  authority actually used. The solar model is the U.S. Naval Observatory low-precision algorithm that
  `praytimes.org/docs/calculation` publishes, implemented in the `execute` runtime for this report. It is accurate
  to about one arcminute, which is well inside the one-minute rounding every authority applies, so a measured angle
  is trustworthy to roughly +/- 0.1 degrees.
- **UNVERIFIED** means no authority publication could be found and the number exists only in software constants or
  third-party aggregators.

---

## Findings in one page

1. **The angle pairs that software libraries attribute to authorities are, for a majority of bodies, UNVERIFIED as
   the authority's own position.** The canonical table (MWL 18/17, ISNA 15/15, Karachi 18/18, Tehran 17.7/14,
   Jafari 16/14, Russia 16/15) traces to `praytimes.org` and the Arabeyes ITL project, and ITL's own documentation
   admits in writing that "no contacts have been made to obtain the correct (or up-to-date) numbers as published by
   such organizations" (cited, `github.com/arabeyes-org/ITL`). That sentence is the single most important fact in
   this report.
2. **Only a minority of bodies could be verified against their own published output.** Verified by measurement
   against the authority's own timetable: Egypt (19.5/17.5, exact), Umm al-Qura (18.4 to 18.5 Fajr, Isha exactly
   sunset+90 min, exact), Turkey's Diyanet (18.0 to 18.2 / 17.1 to 17.2 with a temkin margin), Malaysia's JAKIM
   (17.4 to 17.6 measured, not the 20 that its own journal and every library claim), Singapore's MUIS (19.9/18.1),
   Indonesia's Kemenag (19.2/18.6 with a 2-minute ihtiyat), Morocco's Habous (19.0/16.9 with Dhuhr+5 and
   Maghrib+3), Oman (18.0/18.2 with a 5-minute margin, NOT the 19.5/90-minute "Gulf Region" constant), Qatar
   (17.8 Fajr, Isha exactly sunset+90 min), and Iran (18.2 Fajr, Maghrib exactly sunset+17 min).
3. **The Fajr angle span in real, sourced use is 12 to 20 degrees, an 8-degree band.** Lowest is Musulmans de
   France at 12 (cited), highest is Singapore's MUIS and Indonesia's Kemenag at 20 (cited and measured). The Isha
   angle span is 12 to 19.5 degrees, plus two non-angle conventions: a fixed 90 minutes after Maghrib (Saudi
   Arabia, Qatar), 120 minutes in Ramadan (Saudi Arabia), and 77 minutes (Portugal).
4. **In minutes, that 8-degree Fajr band is worth 35 to 41 minutes near the equator, 46 to 87 minutes at 43 to 51
   degrees, and is undefined at all in high-latitude summer** (measured: Makkah 36 to 41 min, Jakarta 35 to 36 min,
   London 54 min in December and no answer at all above 15 degrees on 21 June, Toronto 46 to 87 min, Oslo 68 min in
   December and nothing in June).
5. **The owner's belief that Fajr and Asr differ most is half right.** Fajr and Isha are the only two times a
   convention choice moves materially, and they move by up to an hour and a half. Asr moves by a large fixed amount
   (Hanafi minus standard measured at 18 to 79 minutes depending on latitude and season) but that is a school
   choice, not an authority-convention choice, and the two shadow rules are exactly defined with no disagreement
   about the formula. Dhuhr, sunrise and Maghrib are astronomically fixed to within the few minutes of safety
   margin an authority chooses to add.
6. **Safety margins are real, published, and large enough to matter.** Turkey's Diyanet adds a temkin of 5 minutes
   to Dhuhr, 4 to 5 to Asr, 8 to Maghrib and subtracts 7 to 8 from the "Gunes" column (measured, 32 consecutive
   days). Indonesia's Kemenag adds 2 minutes of ihtiyat to every prayer and sets Imsak 10 minutes before Subuh
   (cited and measured). Morocco adds 5 to Dhuhr and 3 to Maghrib (measured). Oman adds about 5 to 6 minutes to
   Dhuhr, Asr and Maghrib (measured). Ignoring these margins produces times that are wrong against the authority
   even when the angle is right.
7. **The Fiqh Council of North America, not ISNA, is the body that actually published the North American position,
   and it has moved twice.** September 2011: use the moonsighting.com seasonal functions, "for most areas in USA
   this will result Fajr around sun being 17.5 below horizon, and Isha around 15" (cited, an email from FCNA's
   executive director published by the International Astronomical Center). October 2017, reaffirmed on the FCNA
   site: "15 degrees for both Fajr and Isha in the USA and 13 degrees for both Fajr and Isha in Canada" (cited,
   `fiqhcouncil.org`). The moonsighting notes' claim that ISNA moved to 15 degrees "from 2018" is close but the
   decision is dated October 2017 and the deciding body is FCNA. **The Canada figure of 13 degrees appears in no
   software library this research examined.**
8. **The Muslim World League's 18/17 could not be traced to any MWL publication.** `themwl.org` publishes a
   "Minhaj App" that shows prayer times but no method document. MWL 18/17 is therefore **UNVERIFIED as MWL's own
   position** despite being the default in most software.
9. **"Gulf Region" at 19.5 degrees with Isha at 90 minutes is a software convention, not a Gulf position.** Oman's
   own ministry timetable measures at Fajr 18.0 and Isha 18.2 degrees, an Isha angle where the library says a fixed
   interval. Qatar's own interior ministry table measures at Fajr 17.8, not 18 and not 19.5. The 19.5 figure
   originates in Arabeyes ITL method 7 ("Fixed Ishaa Angle Interval") and propagated from there.
10. **The disagreement is not resolvable, and the authorities say so themselves.** FCNA's own 2024 paper states
    that "the timings for Fajr and Isha are not directly dependent on the position of the sun but rather on the
    amount of light in the sky. That amount of light is not scientifically predictable for each location on Earth
    since it varies by season, altitude, location, geographical barriers, and other factors" (cited). It lists
    documented observation ranges of 12 to 18 degrees in the UK, 13 to 15 in Chicago, and 14.8 to 17.5 for Fajr
    from moonsighting.com's own decades of data. There is no single correct global answer for Fajr and Isha.
11. **Only two sources found in this research specify elevation or refraction at all.** Indonesia's Rukyatul Hilal
    publication of the Kemenag criteria carries an explicit altitude correction table (0 to 250 m no correction,
    rising to 6 minutes at 2000 to 2500 m, cited) and the Brunei Astronomical Society's calculator implements
    Mohammad Shawkat Odeh's full refraction, horizon-dip and parallax treatment (cited). Every other authority's
    published timetable is a sea-level table with a fixed 0.833-degree refraction constant baked in, and
    `praytimes.org` says plainly that "in practice, the constant is considered the same regardless of the elevation"
    (cited).
12. **Some authorities publish a TIMETABLE, not a METHOD, and that distinction decides whether this app can
    reproduce them.** Singapore's MUIS, Oman's MARA, Egypt's ESA, Morocco's Habous, Turkey's Diyanet, Malaysia's
    JAKIM and Brunei's MORA all publish fixed tables or zone tables and publish no parameter document. For those
    bodies the only honest route is either to reproduce the measured parameters in this report or to fetch their
    tables.
13. **Malaysia is the clearest case of a published method that its own output contradicts.** JAKIM's own
    `Jurnal Falak` says "Amalan di Malaysia menggunakan sudut 20 di bawah ufuk bagi waktu Subuh dan 18 bagi waktu
    Isyak" (cited, 2015). Its own `e-solat.gov.my` API for zone WLY01 measures at Fajr 17.4 to 17.6 degrees
    (measured, 2 dates, 2 candidate zone anchors). The 20-degree figure does not reproduce JAKIM's own times;
    the gap is about 10 minutes.
14. **Several countries have no single authority and no published national method that this research could find**:
    India, Pakistan (the Karachi 18/18 convention is named after a university, not a state body), Nigeria, Sudan,
    Somalia, Senegal, Kazakhstan, Uzbekistan and South Africa. For these, the country-by-country agent (R2) should
    treat "which body do mosques follow" as an open question, not a lookup.

---

## Master table: authorities and their published parameters

Column key. **Publishes** is `METHOD` (a parameter set others compute from), `TIMETABLE` (fixed tables only), or
`BOTH`. **Verified** is how the numbers were established. Angles are solar depression below the horizon in degrees.

### Transnational and North America

| Body | Country/region | Official site | Fajr | Isha | Asr | Maghrib | Dhuhr | Margin/rounding | High latitude | Publishes | Primary source status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Muslim World League (Rabitat al-Alam al-Islami) | Makkah, used worldwide | `themwl.org` | 18 | 17 | not specified | not specified | not specified | none published | none published | neither, in practice | **UNVERIFIED.** No MWL document found. 18/17 appears in `praytimes.org` and ITL. `themwl.org` has a prayer-times app but no method page. |
| Fiqh Council of North America (FCNA) | USA and Canada | `fiqhcouncil.org` | **15 (USA), 13 (Canada)** | 15 (USA), 13 (Canada) | notes both rules exist; does not mandate | sunset; recommends delaying a few minutes | not specified | recommends delaying Fajr/Isha a few minutes and hastening the fast start, explicitly "not a requirement" | none published | METHOD | **cited, the body's own page.** Decision of the FCNA General Body Meeting, Dallas, 27 to 29 October 2017, published at `fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/`, fetched 2026-09-30. |
| FCNA, superseded 2011 position | USA | via International Astronomical Center | moonsighting.com seasonal functions; "around 17.5" as a degree equivalent | "around 15" | not specified | not specified | not specified | none | METHOD by reference | **cited.** Email from Dr Zulfiqar Ali Shah, FCNA executive director, reproduced at `astronomycenter.net/articles/2012/07/30/81`, fetched 2026-09-30. Decision dated 25 September 2011. |
| Islamic Society of North America (ISNA) | USA and Canada | `isna.net` | 15 | 15 | not specified | not specified | not specified | none published | none published | neither | **UNVERIFIED as ISNA's own publication.** `isna.net/prayer-times/` returned empty content. FCNA's page says its 15-degree ruling "corresponds to 'Islamic Society of North America' in most prayer apps", which is an attribution to software, not to ISNA. |
| Moonsighting Committee Worldwide (Khalid Shaukat) | worldwide | `moonsighting.com` | seasonal function of latitude and day, bounded by the 18-degree time (the later of the two) | seasonal function, bounded by the 18-degree time (the earlier of the two); three Shafaq variants | both offered (factor 1 and 2; 4/7 for Shia) | sunset + 3 min | noon + 5 min | 1/7 of night above 55 degrees | BOTH | **cited, wave 1.** Coefficients published in Shaukat's "FAJR AND ISHA" booklet, September 2015, section 11. See `ai/features/moonsighting/RESEARCH-FINDINGS.md` sections 2.5, 2.11, 2.16. Not re-researched here. |
| Wifaqul Ulama (Britain) | United Kingdom | `wifaqululama.co.uk` | 18 | **15 at 48 degrees latitude and above (al-Shafaq al-Ahmar), 18 below 48 degrees (al-Shafaq al-Abyadh)** | both published, side by side; recommends Hanafi if no local scholar | astronomical sunset + 5 min | Istiwa + 4 min | Aqrabul-Ayyam (a 3-day average, not the absolute last day) or Nisful-Layl; explicitly must not mix the two | METHOD | **cited, the body's own FAQ**, `wifaqululama.co.uk/salahtimes/` and `/highlat/`, fetched 2026-09-30. The high-latitude ruling is dated 11 November 2018, Preston. |

### Middle East and the Gulf

| Body | Country/region | Official site | Fajr | Isha | Asr | Maghrib | Dhuhr | Margin/rounding | High latitude | Publishes | Primary source status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Umm al-Qura University / Umm al-Qura Calendar | Saudi Arabia | `ummulqura.org.sa` | 18.5 cited; **18.28 to 18.33 measured** | **exactly sunset + 90 min measured**; 120 min in Ramadan cited | standard (factor 1), **measured to the minute at Makkah and Medina** | sunset, no offset (measured 0.95 and 0.0 min) | true noon, no offset (measured 0 to 1 min) | none detected | TIMETABLE (the site is a table generator; no method document found) | **18.5 is cited third-hand** (`praytimes.org`, `islamicfinder.org`, `prayersa.com`); **the 90-minute Isha and the Fajr near 18.3 are measured** against `ummulqura.org.sa/en` own published Makkah and Medina rows for 2026-09-29. Fajr angle was 19 before Muharram 1430 (Dec 2008), cited `praytimes.org`. |
| Egyptian General Authority of Survey (al-Hay'a al-Misriyya al-'Amma li-l-Misaha) | Egypt | `esa.gov.eg` | 19.5 cited; **19.59 measured** | 17.5 cited; **17.43 measured** | **standard (factor 1), exact to the minute** | sunset, **0.79 degrees measured, i.e. no offset** | **true noon exactly, 0 min offset measured** | none detected | TIMETABLE (`praytimes.aspx`, `monthlymwaket.aspx`) | **cited and measured.** The 19.5/17.5 pair is cited by FCNA and `praytimes.org`; it is independently **measured** against the authority's own Cairo row for 2026-09-30 at `esa.gov.eg/praytimes.aspx`, fetched 2026-09-30, and reproduces all six times to the minute. **The single best-verified entry in this table.** |
| Ministry of Endowments and Religious Affairs (MARA) | Oman | `mara.gov.om` | **17.84 to 18.06 measured (mean 17.95)** | **18.10 to 18.31 measured (mean 18.20)** | standard + about 5.7 min | sunset + about 5.6 min | noon + about 5.6 min | **a uniform 5 to 6 minute margin on Dhuhr, Asr and Maghrib** | none detected | TIMETABLE | **measured**, 30 consecutive days of the ministry's own Muscat table for September 2026, `mara.gov.om/calendar_page2.asp`, fetched 2026-09-30. **This contradicts the "Gulf Region" library constant of 19.5 and a fixed 90-minute Isha.** |
| Ministry of Interior (publishes the official table) | Qatar | `portal.moi.gov.qa` | **17.81 measured** | **exactly sunset + 90 min measured** (the 20.8-degree implied angle confirms it is an interval, not an angle) | standard, +1 min | sunset, 0 min | true noon, 0 min | none detected | TIMETABLE | **measured**, the ministry's own Doha row for 2026-09-07, `portal.moi.gov.qa/MoiPortalRestServices/rest/prayertimings/today/en`, fetched 2026-09-30. Library constant for Qatar is Fajr 18 with Isha 90 min (`aladhan.com`); the Isha is right, the Fajr is 0.2 degrees off. |
| General Authority of Islamic Affairs, Endowments and Zakat (Awqaf) | United Arab Emirates | `awqaf.gov.ae` | not established | not established | not established | not established | not established | not established | not established | TIMETABLE | **UNVERIFIED.** `awqaf.gov.ae/prayer-times` and `awqaf.ae/prayer-times` both returned empty bodies through tinyfish; `iacad.gov.ae` and `eservices.iacad.gov.ae` returned HTTP 403. AlAdhan labels its Dubai method 18.2/18.2 as **"not an official calculation but based on the research done by the Batoul Apps team"** (cited, `aladhan.com/calculation-methods`). That is an explicit admission that the number is a software convention. |
| Ministry of Awqaf and Islamic Affairs | Kuwait | `awqaf.gov.kw` | 18 | 17.5 | not established | not established | not established | not established | not established | TIMETABLE | **UNVERIFIED.** 18/17.5 appears in `aladhan.com` method 9 and in Mawaqit's help article; no Kuwaiti government document found. The ministry's API returned an error. |
| Bahrain | Bahrain | `services.bahrain.bh` | not established | not established | not established | not established | not established | not established | not established | TIMETABLE (an "Islamiyat" app) | **UNVERIFIED.** No Bahraini method document found. ITL method 7 groups Bahrain with Oman, Qatar and the UAE at 19.5 with a 90-minute Isha, which Oman's and Qatar's own tables refute. |
| Ministry of Awqaf, Islamic Affairs and Holy Places | Jordan | `awqaf.gov.jo` | 18 | 18 | not established | sunset + 5 min | not established | Maghrib + 5 min | not established | TIMETABLE | **UNVERIFIED as the ministry's own publication.** The 18/18 with Maghrib +5 is `aladhan.com` method 23 (cited from the API's own `/v1/methods`, fetched 2026-09-30). No Jordanian document found. |
| Institute of Geophysics, University of Tehran | Iran | `time.ir` is the state timekeeping site | 17.7 cited; **18.17 measured** | 14 cited; the site publishes no Isha at all, only "azan maghrib" and "nimeshab" | not published on `time.ir` | **exactly sunset + 17 min measured** (4.25 degrees implied, against the cited 4.5) | **true noon exactly, 0 min measured** | none published | METHOD (attributed) and TIMETABLE (`time.ir`) | **17.7/14 is UNVERIFIED as the Institute's own publication** (it appears only in `praytimes.org`, which itself notes "Isha angle is not explicitly specified in Tehran method"). **The sunset+17 Maghrib and the 18.17 Fajr are measured** against `time.ir`'s own Tehran row for 2026-09-30, fetched 2026-09-30. |
| Shia Ithna Ashari / Leva Research Institute, Qum | Shia communities worldwide | no site found | 16 | 14 | factor 1 (Ja'fari is grouped with the majority by `praytimes.org`); some sources give 4/7 | Maghrib at 4 degrees | not specified | not specified | midnight is sunset to Fajr, not sunset to sunrise | METHOD (attributed) | **UNVERIFIED.** No Leva Research Institute website or publication could be found at all. 16/14/4 exists only in `praytimes.org` and the libraries that copied it. This is the weakest-sourced row in the table. |
| Office of Sayyid Ali al-Sistani (Najaf) | Iraq and Shia worldwide | `sistani.org` | not given as an angle | not given as an angle | not given as an angle | **"he must not perform the maghrib prayer before the redness of the sky in the east, which appears after sunset, has passed overhead. Even if one does not have such a doubt, he must, based on obligatory precaution, wait until the aforementioned time"** | zawal | qualitative, not numeric | not addressed numerically | METHOD in fiqh terms only, no numbers | **cited, the office's own Islamic Laws, ruling 722**, `sistani.org/english/book/48/2212/`, fetched 2026-09-30. **The sunset+17-minute convention is a computational approximation of this ruling, not the ruling itself.** Sistani's office publishes no angle. |

### South and Southeast Asia

| Body | Country/region | Official site | Fajr | Isha | Asr | Maghrib | Dhuhr | Margin/rounding | High latitude | Publishes | Primary source status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| University of Islamic Sciences, Karachi | Pakistan, and adopted in India, Bangladesh, Afghanistan | no site found | 18 | 18 | ITL splits it into a Shafi'i variant and a Hanafi variant at the same angles | not specified | not specified | none published | none published | METHOD (attributed) | **UNVERIFIED.** No University of Islamic Sciences publication found. 18/18 exists in `praytimes.org` and ITL. **Note that this is a university, not a state body, and nothing found says Pakistan adopted it nationally.** |
| Jabatan Kemajuan Islam Malaysia (JAKIM) | Malaysia | `islam.gov.my`, `e-solat.gov.my` | **20 cited by JAKIM's own journal; 17.41 to 17.60 measured from JAKIM's own API** | **18 cited; 18.51 to 18.56 measured** | standard + 3 min | sunset + 2 min | noon + 3 min | Imsak 10 min before Subuh; an ihtiyati of 1 to 2 min per zone is described in JAKIM's own journal | none published | BOTH (a 62-zone table via API, plus a published 20/18 claim) | **cited and contradicted by measurement.** The 20/18 claim is JAKIM's own: "Amalan di Malaysia menggunakan sudut 20 di bawah ufuk bagi waktu Subuh dan 18 bagi waktu Isyak", `Jurnal Falak` bil. 1 2015 p.134, `e-solat.gov.my/portalassets/files/jurnal_falak_bil1_2015-ilovepdf-compressed.pdf`, fetched 2026-09-30. The measurement inverts JAKIM's own `e-solat.gov.my` zone WLY01 API for 2026-09-30 and 2026-10-05 at two candidate zone anchors (Kuala Lumpur and Putrajaya) and gets 17.4 to 17.6, about 10 minutes later than 20 degrees would give. **Flagged as an open contradiction, not resolved.** |
| Majlis Ugama Islam Singapura (MUIS) | Singapore | `muis.gov.sg` | 20 cited; **19.70 to 20.06 measured (mean 19.88) over all 365 days of 2026** | 18 cited; **17.92 to 18.35 measured (mean 18.13) over all 365 days** | **standard (factor 1), within +/- 1 min all year** | sunset + 0 to 2 min (mean 0.6) | noon + 1 to 2 min (mean 1.6) | a consistent 1 to 2 minute rounding-up margin | none needed at 1.35 degrees latitude | BOTH (a yearly PDF timetable; the 20/18 pair is attributed) | **cited and measured.** The 20/18 pair is cited by FCNA and `praytimes.org`. The measurement uses MUIS's own official `Prayer timetable 2026.pdf` from `muis.gov.sg/resources/islamic-calendar/`, all 365 rows parsed, fetched 2026-09-30. **20/18 is confirmed as correct for Singapore.** |
| Kementerian Agama (Kemenag) | Indonesia | `bimasislam.kemenag.go.id` | **20 plus 2 min ihtiyati, cited**; 19.15 to 19.17 measured (the 2-minute ihtiyat explains the gap) | **18 plus 2 min ihtiyati, cited**; 18.63 to 18.65 measured | **standard (factor 1) plus 2 min ihtiyati, cited**; +3 measured | **sunset plus 2 min ihtiyati, cited**; +3 measured | **true noon plus 2 min ihtiyati, cited**; +3 measured | **2 minutes of ihtiyati added to every prayer; Syuruq has 2 minutes SUBTRACTED; Imsak is 10 minutes before Subuh; the table is valid for 0 to 250 m elevation and for a 30 km radius from the city centre** | none needed | METHOD (a numbered criteria list) and TIMETABLE | **cited, an authoritative transcription of the Kemenag criteria** at `rukyatulhilal.org/jadwalshalat/kriteria.html`, fetched 2026-09-30, with all eight numbered rules and the altitude table. Measured against a Kemenag-derived Jakarta API row for 2026-09-30. `bimasislam.kemenag.go.id/jadwalshalat` rendered as an empty shell through tinyfish, so the criteria transcription is second-hand but internally consistent and reproduces the official output. |
| Ministry of Religious Affairs (MORA / KHEU) | Brunei | `mora.gov.bn` | 20 (retained in the Astronomical Society of Brunei's calculator) | 18 | both offered in the society's calculator | sunset with full semidiameter, refraction, horizon dip and parallax | equation of time | **the society's calculator implements full atmospheric refraction from pressure and temperature, an elevation correction D = 0.035333 * sqrt(h) degrees, and a 0.0024-degree horizontal parallax** | none needed | TIMETABLE (`mora.gov.bn/SitePages/WaktuSembahyang.aspx` serves monthly PDFs) | **cited but second-hand for the angles.** The Astronomical Society of Brunei Darussalam states "The existing Brunei Darussalam calculation setting in this application is retained at Subuh 20 / Isyak 18" and notes "The literature gives 18 as the astronomical Fajr and Isyak criterion", `bruneiastronomy.org/prayer/`, fetched 2026-09-30. The society is not the state authority; MORA publishes tables, not a method. |
| Islamic Foundation Bangladesh | Bangladesh | `islamicfoundation.gov.bd` | not established | not established | not established | not established | not established | not established | not established | TIMETABLE | **UNVERIFIED.** The Foundation's own site has no prayer-times or method section reachable through tinyfish. Bangladesh is grouped under Karachi 18/18 by `praytimes.org` and ITL, which is itself unverified. |
| No single body found | India | n/a | not established | not established | both in use | not established | not established | not established | n/a | n/a | **UNVERIFIED and open.** No Indian national authority publishing a prayer-time method was found. `praytimes.org` and ITL assign India to Karachi 18/18 with a Hanafi Asr. R2 should treat this as unanswered. |

### Turkey, Europe and Russia

| Body | Country/region | Official site | Fajr | Isha | Asr | Maghrib | Dhuhr | Margin/rounding | High latitude | Publishes | Primary source status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Diyanet Isleri Baskanligi, Din Isleri Yuksek Kurulu | Turkey, and DITIB in Europe | `diyanet.gov.tr`, `namazvakti.diyanet.gov.tr` | **18, cited in Diyanet's own words; 17.98 to 18.16 measured over 32 consecutive days** | **17, cited in Diyanet's own words; 17.05 to 17.24 measured** | **standard (factor 1) + 4 to 5 min temkin measured** | **astronomical sunset + 7 to 8 min temkin measured** ("Aksam") | **true noon + 5 min temkin measured** ("Ogle") | **a temkin margin on every time: Ogle +5, Ikindi +4 to +5, Aksam +7 to +8, and the "Gunes" (Fajr end) column set 7 to 8 min BEFORE astronomical sunrise. "GunesDogus" and "GunesBatis" are the unadjusted astronomical values, published alongside.** | **a published, non-angle rule. Beyond 45 degrees latitude Isha is Maghrib + 1 h 20 min (the Brussels Conference decision), capped so that it never falls after one third of the shar'i night. For Imsak, from March to September, 10 minutes are added to the Maghrib-to-Isha interval and that interval is subtracted from sunrise.** | BOTH | **cited, Diyanet's own words, and measured.** The 18/17 pair and the whole high-latitude rule are stated verbatim in the Din Isleri Yuksek Kurulu explanation "Imsak ve Yatsi Vakitlerine Iliskin Aciklama", dated 2009-08-28, reproduced at `ditib.de/detail2.php?id=424`, fetched 2026-09-30. The temkin margins are **measured** against Diyanet's own Ankara feed `ezanvakti.emushaf.net/vakitler?ilce=9206` (fetched directly, not through tinyfish), 32 days from 2026-09-23. **Note: the AlAdhan "Turkey" method is labelled "(experimental)" and carries 18/17 with no temkin, so it cannot reproduce Diyanet's own tables.** |
| Musulmans de France (formerly UOIF) | France | `musulmansdefrance.fr` | **12** | 12 | not specified | not specified | not specified | none published | none published | METHOD (via its published calendars, produced by the Gedis company) | **cited, with the body's own reasoning.** Fouad Alaoui, who edited the UOIF calendars, confirms the 12-degree choice and argues for a seasonally varying angle, in an interview at `psm-enligne.org/10733-horaires-de-prieres-12-ou-18-degres-pourquoi-choisir`, fetched 2026-09-30. He states "en ce qui concerne la France ainsi que la majorite des pays de l'Europe du nord, les creneaux de calcul des horaires de priere sont valables dans un intervalle de 12 a 19 degres". (Reading a French source in the original.) **12 degrees is the lowest Fajr angle in real, sourced use anywhere in the world.** |
| Grande Mosquee de Paris (GMP) | France | `grandemosqueedeparis.fr` | **18** | 18 | not specified | not specified | not specified | none published | none published | TIMETABLE (monthly calendars) | **cited, second-hand but from a serious French Muslim outlet.** The same `psm-enligne.org` piece describes GMP as "adepte du 18" against UOIF's 12, and reports that a joint UOIF/GMP commission formed in October 2015 has produced no convergence, with a possible landing point of "14 ou 15". **France is the sharpest single-country split in the world: 12 against 18 in the same city, from two bodies that publish competing calendars.** |
| Comunidade Islamica de Lisboa | Portugal | `comunidadeislamica.pt` | 18 | **77 minutes after Maghrib** | not specified | sunset + 3 min | not specified | none published | none published | METHOD (attributed) | **UNVERIFIED as the community's own publication.** The 18 / Maghrib+3 / Isha-77-min set is `aladhan.com` method 22 (cited from `/v1/methods`). **The 77-minute Isha is unique in the world and is the only fixed-minute Isha outside the Gulf.** |
| Spiritual Administration of Muslims of Russia (Dukhovnoe Upravlenie Musulman) | Russia | not reachable | 16 | 15 | not specified | not specified | not specified | none published | none published | neither, in practice | **UNVERIFIED.** 16/15 exists only in `praytimes.org` and the libraries copying it. No Russian muftiate publication found. Russia has several competing muftiates (the Central Spiritual Administration in Ufa, the Russian Mufties Council in Moscow, the Coordination Centre for North Caucasus Muslims) and nothing found establishes which one the 16/15 pair belongs to, or whether any of them uses it. |

### Africa

| Body | Country/region | Official site | Fajr | Isha | Asr | Maghrib | Dhuhr | Margin/rounding | High latitude | Publishes | Primary source status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ministere des Habous et des Affaires Islamiques | Morocco | `habous.gov.ma` | 19 cited; **19.04 measured** | 17 cited; **16.85 measured** | **standard (factor 1), 0 min offset measured** | **sunset + 3 min measured** | **true noon + 5 min measured** | **Dhuhr +5, Maghrib +3, and the timetable is served at UTC+0 even during Morocco's permanent DST, so the time base must be handled with care** | none needed | TIMETABLE (a per-city API at `habous.gov.ma/prieres/horaire-api.php`) | **cited and measured.** The 19/17 pair is cited by ITL method 11 (which also gives Zuhr +5 and Maghrib +5) and by Mawaqit. It is **measured** against the ministry's own Rabat row for 2026-09-30 at `habous.gov.ma/prieres/horaire-api.php?ville=1`, fetched 2026-09-30, which confirms 19/17, Dhuhr +5, and **Maghrib +3, not ITL's +5**. That is a 2-minute mismatch against the library constant. |
| Ministere des Affaires Religieuses et des Wakfs | Algeria | `marw.dz` | 18 | 17 | not established | not established | not established | not established | not established | TIMETABLE | **UNVERIFIED as the ministry's own publication.** 18/17 is `aladhan.com` method 19 and is also what Mawaqit attributes jointly to the "Algerian, Moroccan or Turkish Ministry of religious affairs and waqf". No Algerian document found. |
| Ministry of Religious Affairs | Tunisia | `affaires-religieuses.tn` | 18 | 18 | not established | not established | not established | not established | not established | TIMETABLE | **UNVERIFIED.** 18/18 is `aladhan.com` method 18. No Tunisian document found. |
| Libya | Libya | none found | not established | not established | not established | not established | not established | not established | not established | n/a | **UNVERIFIED and open.** No Libyan authority or method found. |
| Nigerian Supreme Council for Islamic Affairs (NSCIA) | Nigeria | `nscia.com.ng` | not established | not established | not established | not established | not established | not established | not established | neither | **UNVERIFIED and open.** NSCIA's site carries no prayer-times method. No Nigerian national convention found. |
| No body found | Sudan, Somalia, Senegal | n/a | not established | not established | not established | not established | not established | not established | n/a | n/a | **UNVERIFIED and open.** Aggregators assign Sudan to the Egyptian method (`muslimpro.com` says so explicitly) and Senegal to a menu of methods, but no West or East African authority publishing its own parameters was found. This is a genuine null. |
| Muslim Judicial Council (MJC) and Jamiatul Ulama (KZN) | South Africa | `mjc.org.za`, `jamiat.org.za` | not published as an angle; the KZN Jamiat **recommends** the Karachi 18/18 setting | not published as an angle | **Hanafi (factor 2) recommended by Jamiatul Ulama KZN** | **sunset + 3 min recommended as a safety margin** | not specified | the 3-minute Maghrib margin is explicit | none needed | neither; both publish times and one publishes app settings | **cited as a recommendation, not a method.** Jamiatul Ulama KZN's fatwa says "If one follows Hanafi Fiqh, it would be best to configure the application to use the 'University of Islamic Sciences, Karachi' setting. The Asr calculation should be set to Hanafi and 3 minutes should be added to the Maghrib Salaah time as a safety margin", `jamiat.org.za/hanafi-settings-for-salaah-apps/`, fetched 2026-09-30. **South Africa has no national convention; it has a fatwa telling users which software preset to pick.** |

### Central Asia, the Caucasus and Oceania

| Body | Country/region | Official site | Fajr | Isha | Asr | Maghrib | Dhuhr | Margin/rounding | High latitude | Publishes | Primary source status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caucasus Muslims Board (Qafqaz Muselmanlari Idaresi) | Azerbaijan | `caucasus-muslims.org` | not established | not established | not established | not established | not established | not established | not established | TIMETABLE (a per-city, per-month "Namaz calendar") | **UNVERIFIED.** The board publishes a city-and-month calendar for 2021 to 2031 for 76 districts, so the data exists, but the table is rendered client-side and neither tinyfish nor a direct GET or POST returned the rows. The board is the Shia-majority authority for Azerbaijan, so the Jafari Maghrib question applies to it, but its convention could not be read. **A concrete next step: drive `caucasus-muslims.org/az/namaz-calendar` with `agent-browser` and measure it.** |
| Muslim Board of Uzbekistan (O'zbekiston Musulmonlari Idorasi) | Uzbekistan | `muslim.uz` | not established | not established | not established | not established | not established | not established | not established | TIMETABLE | **UNVERIFIED and open.** `muslim.uz` has no prayer-method page reachable through tinyfish. |
| Spiritual Administration of Muslims of Kazakhstan | Kazakhstan | `muftyat.kz` | not established | not established | not established | not established | not established | not established | not established | TIMETABLE | **UNVERIFIED and open.** No Kazakh method document found. Aggregators default Kazakhstan to MWL. |
| Australian National Imams Council (ANIC) | Australia | `anic.org.au` | not established | not established | not established | not established | not established | not established | not established | neither | **UNVERIFIED and open.** ANIC publishes Taraweeh timings and moonsighting positions but no prayer-time method. |

---

## 1. What actually varies, and by how much in degrees

### Every distinct Fajr angle found in real, sourced use, sorted

| Angle | Who uses it | Source status |
| --- | --- | --- |
| 12 | Musulmans de France (ex-UOIF) | cited, with the editor's own confirmation |
| 13 | FCNA for Canada | cited, FCNA's own page |
| 14 to 15 | the mooted UOIF/GMP compromise, never adopted | cited as a proposal only |
| 15 | FCNA for the USA (and "ISNA" in software) | cited, FCNA's own page |
| 16 | Leva Institute Qum | UNVERIFIED |
| 17.4 to 17.6 | JAKIM Malaysia, **as measured from its own API** | measured, and it contradicts JAKIM's own published 20 |
| 17.5 | the FCNA 2011 position's degree equivalent; Kuwait's Isha-side partner | cited (FCNA), UNVERIFIED (Kuwait) |
| 17.7 | Institute of Geophysics, Tehran | UNVERIFIED; the actual Iranian state table measures 18.17 |
| 17.8 to 18.1 | Qatar and Oman, **as measured from their own tables** | measured |
| 18 | MWL, Karachi, Turkey's Diyanet, Algeria, Tunisia, Jordan, Portugal, GMP, Wifaqul Ulama | cited for Diyanet, GMP and Wifaqul Ulama; UNVERIFIED for the rest |
| 18.2 | "Dubai" in software | cited as NOT official, by AlAdhan itself |
| 18.28 to 18.5 | Umm al-Qura | 18.5 cited third-hand, 18.28 to 18.33 measured |
| 19 | Morocco's Habous; Umm al-Qura before Muharram 1430; Muwaqqit's default | measured for Morocco, cited for the others |
| 19.5 to 19.6 | Egypt's General Authority of Survey; the "Gulf Region" software constant | measured for Egypt, UNVERIFIED as any Gulf state's position |
| 19.7 to 20.1 | Singapore's MUIS, **measured across a full year** | measured |
| 20 | MUIS, Kemenag Indonesia, Brunei, JAKIM's own claim | cited for all four; measured true for MUIS and Kemenag, measured false for JAKIM |

**Full Fajr span in real use: 12 to 20 degrees.** That is an 8-degree band, held by two bodies that both publish
calendars for France and Singapore respectively.

### Every distinct Isha parameter found in real, sourced use, sorted

| Parameter | Who uses it | Source status |
| --- | --- | --- |
| 12 degrees | Musulmans de France | cited |
| 13 degrees | FCNA for Canada | cited |
| 14 degrees | Tehran, Leva Qum | UNVERIFIED |
| 15 degrees | FCNA for the USA; **Wifaqul Ulama for latitudes 48 and above** | cited for both |
| 16.85 to 17 degrees | Morocco's Habous, Algeria, MWL | measured for Morocco, UNVERIFIED for the others |
| 17.05 to 17.24 degrees | Turkey's Diyanet, measured | measured; matches its cited 17 |
| 17.43 to 17.5 degrees | Egypt's General Authority of Survey; Kuwait | measured for Egypt, UNVERIFIED for Kuwait |
| 17.9 to 18.6 degrees | MUIS, Kemenag, Oman, Karachi, Tunisia, Jordan, Brunei, Wifaqul Ulama below 48 | measured for MUIS, Kemenag and Oman; cited for Wifaqul Ulama; UNVERIFIED for the rest |
| 18.2 degrees | "Dubai" in software | cited as NOT official |
| 19.5 degrees | the "Gulf Region" software constant | UNVERIFIED as anyone's real position |
| **sunset + 77 minutes** | Comunidade Islamica de Lisboa, Portugal | UNVERIFIED as the community's own publication |
| **sunset + 90 minutes** | Umm al-Qura (Saudi Arabia), Qatar | **measured, both exactly 90** |
| **sunset + 120 minutes in Ramadan** | Umm al-Qura only | cited, not measured (no Ramadan day was in range) |
| **Maghrib + 1 h 20 min above 45 degrees, capped at one third of the shar'i night** | Turkey's Diyanet | cited, Diyanet's own words |
| **a seasonal function of latitude and day, bounded by 18 degrees, 1/7 of night above 55** | Moonsighting Committee | cited, wave 1 |

**Full Isha span in real use: 12 to 19.5 degrees**, plus three fixed-interval conventions (77, 90 and 120 minutes)
and two rule-based conventions (Diyanet's 1 h 20 min cap and the Moonsighting seasonal function) that cannot be
expressed as an angle at all.

### What that span is worth in minutes, measured

Fajr at 12 degrees minus Fajr at 20 degrees, and Isha at 19.5 degrees minus Isha at 12 degrees, computed for five
cities on the solstices. All figures **measured**.

| City | Latitude | Fajr span, 21 Jun | Fajr span, 21 Dec | Isha span, 21 Jun | Isha span, 21 Dec |
| --- | --- | --- | --- | --- | --- |
| Makkah | 21.4 N | 41 min | 36 min | 39 min | 34 min |
| Jakarta | 6.2 S | 35 min | 36 min | 33 min | 34 min |
| Toronto | 43.7 N | **87 min** | 46 min | **79 min** | 44 min |
| London | 51.5 N | **no answer above 15 degrees** | 54 min | **no answer above 15 degrees** | 51 min |
| Oslo | 59.9 N | **no answer at any angle** | 68 min | **no answer at any angle** | 64 min |

Two things follow. First, near the equator the whole world's disagreement is worth about 35 minutes, which is
material but survivable. Second, at 44 degrees and above the disagreement grows to an hour and a half, and above
roughly 49 degrees in summer the higher angles stop having an answer at all, which is why every serious authority
that operates at high latitude publishes a separate non-angle rule (Diyanet's 1 h 20 min, Wifaqul Ulama's
Aqrabul-Ayyam and Nisful-Layl, Moonsighting's 1/7 of night).

---

## 2. Which prayers are affected

The owner's belief is that Fajr and Asr differ most. That is **half right**, and the half that is wrong matters.

**The six times, ranked by how much a convention choice can move them.**

| Time | Can a convention choice move it? | By how much | Why |
| --- | --- | --- | --- |
| **Fajr** | **Yes, more than anything else** | 35 to 41 min at the equator, up to 87 min at 44 degrees, undefined above about 49 degrees in summer | The angle is a free parameter. The underlying phenomenon (first spreading light) is not a fixed solar depression. |
| **Isha** | **Yes, equally** | 33 to 39 min at the equator, up to 79 min at 44 degrees, plus 90 versus 120 minutes in Saudi Arabia (a 30-minute step), plus the whole fixed-interval-versus-angle choice | Same reason, symmetric in the evening. |
| **Asr** | **Yes, but by a school choice, not an authority choice** | **measured: Hanafi minus standard is 18 min at Oslo in December, 30 min at London in December, 45 min at Makkah in December, 52 to 61 min at Jakarta, 74 to 79 min at Toronto, London, Makkah and Oslo in June** | Both shadow rules are exactly defined and there is no dispute about the formula. The dispute is which factor to use. See section 3. |
| **Dhuhr** | **Barely, and only by a published safety margin** | 0 min (Egypt, Qatar, Umm al-Qura, Iran) to 5 min (Turkey, Morocco, Moonsighting) to 6 min (Oman), with 1 to 3 min in between (Singapore, Malaysia, Indonesia) | True noon is a solved astronomical quantity. Everything above zero is deliberate ihtiyat. |
| **Maghrib** | **Barely, plus one large structural exception** | 0 min (Egypt, Qatar, Umm al-Qura) to 3 min (Morocco, Moonsighting, South Africa's Jamiat recommendation) to 5 to 6 min (Oman) to 8 min (Turkey). **The exception: the Shia sunset+17-minute convention, measured exactly at 17 min on Iran's own state table.** | Sunset is solved to within the refraction uncertainty. The Shia position is a genuinely different definition (waiting for the eastern redness to pass overhead), not a margin. |
| **Sunrise** | **Barely** | 0 to 1 min everywhere measured, except Turkey where the "Gunes" column is deliberately set 7 to 8 min BEFORE astronomical sunrise (that column marks the END of Fajr, not sunrise; Diyanet publishes the true sunrise separately as "GunesDogus") | Same as Maghrib. |

**So the accurate statement is: Fajr and Isha are the two times where authorities genuinely disagree, and they
disagree by up to an hour and a half. Asr differs by a comparable or larger amount, but that is a madhhab
selection with two exactly-defined answers, not a disagreement between authorities. Dhuhr, sunrise and Maghrib are
fixed by astronomy to within the safety margin each body chooses to add, and those margins run 0 to 8 minutes.**

One practical consequence for this app: an implementation that gets the angles right but ignores the margins will
be 5 to 8 minutes off against Turkey, 2 to 3 off against Indonesia and Morocco, and 5 to 6 off against Oman, on
every single day, for Dhuhr and Maghrib. Those are prayers the owner might assume are safe.

---

## 3. The Asr question

**The rule.** Asr begins when an object's shadow has grown by a multiple of the object's own height, measured from
the shadow length at true noon. Formally, if `a` is the sun's altitude at noon and `f` is the factor, Asr is the
moment the sun reaches an altitude `A` where `cot(A) = f + cot(a)`. The standard (Shafi'i, Maliki, Hanbali, and by
`praytimes.org`'s grouping Ja'fari too) factor is **1**. The Hanafi factor is **2**. `praytimes.org` states this
verbatim: "according to the first four schools of thought, Asr = Dhuhr + A(1), while in the Hanafi school, Asr =
Dhuhr + A(2)" (cited). The International Astronomical Center's Arabic paper by Mohammad Shawkat Odeh gives the same
two equations as (5) and (6) and adds a refraction correction (6a to 6c) applied to the resulting zenith angle
(cited). The Moonsighting Committee's own page adds a third factor, **4/7 for Shia** (cited, wave 1).

**What the gap is worth, measured.**

| City | Latitude | 21 June | 21 December |
| --- | --- | --- | --- |
| Oslo | 59.9 N | 79 min | **18 min** |
| London | 51.5 N | 75 min | 30 min |
| Toronto | 43.7 N | 74 min | 35 min |
| Makkah | 21.4 N | **79 min** | 45 min |
| Jakarta | 6.2 S | 52 min | 61 min |

The gap is never small in absolute terms and it is not monotonic in latitude: it is largest where the noon sun is
high (Makkah in June, 79 min) and smallest where the noon sun is very low (Oslo in December, 18 min). This is the
opposite of the Fajr and Isha pattern, where high latitude means large disagreement.

**Which regions use which.** The IAC paper states the position plainly: "most Islamic countries adopt the Shafi'i
school's definition" (cited, translated from the Arabic). The measurements in this report bear that out without
exception. Every authority timetable measured here reproduces the **standard** factor-1 Asr to within its own
safety margin: Egypt exact, Umm al-Qura exact at both Makkah and Medina, Singapore within +/- 1 minute across all
365 days, Oman at +5.7, Morocco at 0, Qatar at +1, Turkey at +4 to +5, Malaysia at +3, Indonesia at +3.
**No authority timetable measured in this research publishes a Hanafi Asr as its primary or only Asr.**

**One or both?** The pattern that emerged is clear and it matters for this app:

- **State and national authorities publish ONE Asr, and it is the standard factor-1 one.** Egypt, Saudi Arabia,
  Oman, Qatar, Morocco, Turkey, Malaysia, Indonesia and Singapore each publish a single Asr column.
- **Hanafi-community bodies publish BOTH, side by side.** Wifaqul Ulama (Britain) publishes "Asr (Shaf'ae)" and
  "Asr (Hanafi)" as separate rows and says explicitly: "There is a difference of opinion amongst Scholars of
  different Madhahib on Asr times and in order to provide a service to Muslims of differing schools of thought both
  times have been provided... if you are unable to consult a local scholar, use Asr (Hanafi) time" (cited). The
  Moonsighting Committee's generator offers both through its `method` parameter (m0 and m1 are Hanafi, m2 is
  Shafi'i, measured in wave 1).
- **Some bodies publish neither and instead tell users which software preset to pick.** Jamiatul Ulama KZN's fatwa
  is exactly that (cited).

**The implication for a worldwide app is that the Asr factor cannot be derived from the country.** Turkey's own
authority publishes a standard Asr, yet Turkey is overwhelmingly Hanafi. The same is true of Egypt, Pakistan,
Bangladesh, India and Central Asia. The factor is a user preference that happens to correlate with region, and
every honest authority that serves a mixed community publishes both.

---

## 4. The "is any of it correct" question

**The short factual answer: for Dhuhr, sunrise, Asr and Maghrib, yes, there is a correct answer to within a
minute or two. For Fajr and Isha, no, and the authorities themselves say no.**

This is not a theological argument. It is what the sources state.

### The underlying observational problem

FCNA's 2024 paper, written by Shaykh Mustafa Umar and published on the council's own site, is the most direct
statement of it found in this research (all quotes cited, `fiqhcouncil.org`, fetched 2026-09-30):

> "the timings for Zuhr, Asr, and Maghrib are dependent on the position of the sun. This is more scientifically
> deterministic and can be calculated more accurately than dawn or dusk. However, the timings for Fajr and Isha are
> not directly dependent on the position of the sun but rather on the amount of light in the sky. That amount of
> light is not scientifically predictable for each location on Earth since it varies by season, altitude, location,
> geographical barriers, and other factors."

That is the whole problem in two sentences. Fajr and Isha are defined by a **photometric** event (the first
spreading of light along the horizon; the disappearance of the glow) and the solar depression at which that event
occurs is not a constant. The paper lists the factors that move it: **season, latitude, altitude, obstructions,
light pollution, and the observer's own experience** (inexperienced observers systematically report the light
later).

### The observational record, as the authorities themselves cite it

FCNA's paper compiles the documented observations (cited):

| Study | Place | Year | Fajr depression observed |
| --- | --- | --- | --- |
| A group of UK scholars | United Kingdom | 1983 | 12 to 16 degrees |
| A group of Chicago scholars | Chicago | 1985 | 13 to 15 degrees |
| Various | USA and Canada | n/a | 12 to 15 degrees |
| Shaykh Abdul-Aziz Fauzan, a full year | Riyadh | 2004 | 15 degrees |
| Hizbul Ulama, daily for a full year | United Kingdom | 1988 | 12 to 18 degrees |
| moonsighting.com, decades of observers | USA and Canada | n/a | **Fajr 14.8 to 17.5; Isha 11.2 to 17.6** |

FCNA's own summary of the whole record: "The reported solar depression angle usually can fall anywhere between 12
to 18 degrees, or even between 9 to 20 degrees."

**A range of 9 to 20 degrees for a quantity that every software library stores as a single constant is the central
finding of this section.**

### The fiqh dispute about whether an angle can be fixed at all

FCNA lays out the five options scholars have considered and rejects four of them (cited, paraphrased faithfully):

1. **Local observation everywhere.** Rejected as impossible in cities with obstructions and light pollution, and
   impossible for many individuals.
2. **Use astronomical twilight (18 degrees) as the definition.** Rejected outright: "this would be incorrect since
   the start of Fajr does not equate to the criteria of Astronomical Dawn." FCNA calls the widespread conflation of
   the two "a false conflation."
3. **Take the extreme value to be safe.** Rejected because it is self-defeating: "By taking the highest degrees for
   the start of Fajr prayer, to be on the 'safe' side, the start of fasting becomes on the 'dangerous' side, and
   vice versa." This is the single sharpest argument in the whole literature and it explains why no body can simply
   round up.
4. **Publish two times, one for the prayer and one for the fast.** Rejected because the two times are the same
   time in law, and because the gap can be one to two hours.
5. **Choose an approximation per region and tell people to adjust.** **Adopted.** FCNA's reasoning for 15: "it is
   the middle point between twelve and eighteen, which is usually the range of dawn for most places on Earth."

FCNA is explicit that the 18-degree tradition may rest on a misreading of the medieval sources. It quotes David
King's *In Synchrony With the Heavens*: "I am not aware of any legal text in which it is suggested that one should
consult an astronomer on the prayer times", and Asim Yusuf's *Shedding Light on the Dawn*: medieval astronomers
"may not have been directly measuring solar depression at all, but rather stellar elevation and (at most)
inferring solar depression from it... A classical astronomical text citing 18 degrees for true dawn is likely
referring to the angle of elevation of a particular star above the opposite horizon from the Sun." (both cited via
FCNA's footnotes.)

**The counter-position is equally sourced.** Wifaqul Ulama (Britain) holds 18 degrees and rejects the lower-angle
research on two specific technical grounds (cited, `wifaqululama.co.uk/salahtimes/`):

- against the OpenFajr camera study: "Birmingham is located in one of the most light polluted areas of United
  Kingdom... It is not possible to determine (emerging) rays of light when light already exists."
- against Asim Yusuf: "His research is based upon the hypothesis that astronomical twilight varies according to
  latitude... this is disputed with and disagreed by scientists the world over."

Its conclusion: "Until then we recommend 18 degrees as per the near unanimous consensus of Islamic Scholars (the
world over)." Note that the light-pollution objection cuts both ways: FCNA lists light pollution as a reason the
observed angle is **lower**, Wifaqul Ulama lists it as a reason the observation is **invalid**. Both are reasoning
from the same physical fact to opposite conclusions.

### The high-latitude problem

Above roughly 48 to 49 degrees, in summer, the sun never descends to 18 degrees and the Fajr and Isha times do not
exist. This is not a modelling artefact; it is measured. At London on 21 June, no angle at or above 16 degrees has
a solution. At Oslo on 21 June, no angle at all has a solution.

The authorities agree that an estimation rule (*taqdir*) is then religiously required and **agree on nothing else**.
Diyanet's own statement is the clearest admission in the literature (cited, `ditib.de`, translated from Turkish):

> "Islamic scholars and various scientific bodies have put forward a number of estimation methods and solutions on
> this matter. However, up to now no unity has been achieved on any single estimation method."

Diyanet then says it applies *taqdir* above **45** degrees, not 48, on grounds of *istihsan* and *maslaha* and the
principle of not creating hardship, and sets Isha at Maghrib + 1 h 20 min capped at one third of the shar'i night
(cited). Wifaqul Ulama uses Aqrabul-Ayyam or Nisful-Layl and warns against mixing them (cited). ITL offers sixteen
different high-latitude rules and notes, of the fractional-night family, that these "have no proof in traditional
Shari'a (Fiqh) resources. These methods were introduced by modern day Muslim scholars and scientists for practical
reasons only" (cited). The Moonsighting Committee uses 1/7 of the night above 55 (cited, wave 1). `praytimes.org`
describes three more (cited).

**So: the high-latitude answer is not merely contested, it is admitted by a state authority to be unresolved, and
at least one widely-used family of solutions is described by its own implementers as having no traditional basis.**

### The verdict

For the four astronomically determined times, a single correct global answer exists, and every authority measured
here agrees on it to within its own declared safety margin. For Fajr and Isha, a single correct global answer does
not exist, because the phenomenon the law names is not a fixed solar depression and the observational record spans
9 to 20 degrees. What exists instead is a set of defensible regional approximations, several of which an authority
has itself labelled as an approximation.

For this app, that has one hard consequence: **there is no convention that "fits everything", and an app that
claims absolute accuracy for Fajr and Isha claims something no authority on earth claims for itself.** What an app
can honestly promise is faithful reproduction of a named authority's published position, with the authority named
to the user.

---

## 5. Convergence: conventions that are effectively identical despite different names

Grouped by output, using the measured and cited parameters above.

**Group A: 18 and 17.** MWL (UNVERIFIED), Turkey's Diyanet (cited and measured at 18.0 to 18.2 / 17.1 to 17.2),
Algeria (UNVERIFIED), Morocco's Habous on the Isha side only (measured 16.85). Mawaqit attributes 18/17 jointly to
"Algerian, Moroccan or Turkish Ministry of religious affairs and waqf" and separately to MWL (cited), which means
four named bodies collapse to one parameter pair. **Diyanet is NOT interchangeable with MWL in practice**, because
of the temkin margins and the 45-degree rule, but its angles are the same.

**Group B: 18 and 18.** Karachi (UNVERIFIED), Tunisia (UNVERIFIED), Jordan (UNVERIFIED), Oman (measured at
17.95/18.20), Wifaqul Ulama below 48 degrees (cited), Brunei's Isha side. Five named entries, one pair. **Oman's
own measured output lands here, not in the "Gulf Region" group its software label puts it in.**

**Group C: 15 and 15.** FCNA for the USA (cited) and the software method universally labelled "ISNA". These are
the same numbers from one decision; the ISNA name is a software label for an FCNA ruling.

**Group D: 20 and 18.** MUIS Singapore (measured 19.88/18.13), Kemenag Indonesia (cited as 20/18 plus 2-minute
ihtiyat), JAKIM Malaysia (cited as 20/18 but **measured at 17.5/18.5**), Brunei (cited, retained). Also, and this
is the notable one, **Arabeyes ITL method 1 labels 20/18 as "Egyptian General Authority of Survey"** and lists it
as used in "Indonesia, Iraq, Jordan, Lebanon, Malaysia, Singapore, Syria" (cited). Egypt's own table measures at
19.59/17.43, so ITL's method 1 is misattributed: the numbers are the Southeast Asian convention wearing an
Egyptian name. ITL then carries the real Egyptian pair separately as method 8. **This is a documented case of one
library shipping the same authority twice with two different parameter sets, one of them wrong.**

**Group E: a fixed 90 minutes after Maghrib.** Umm al-Qura (measured exactly 90) and Qatar (measured exactly 90).
Different Fajr angles (18.3 versus 17.8) but an identical Isha rule. The ITL "Fixed Ishaa Angle Interval" method
also lands at 90 minutes and attributes it to Bahrain, Oman, Qatar and the UAE, of which **Oman is now measured to
be wrong** (Oman uses an angle) and Qatar right.

**Group F: near-identical outputs across the 17.4 to 18.3 band.** The measured Fajr angles of JAKIM (17.4 to 17.6),
Qatar (17.8), Oman (17.95), Diyanet (18.0 to 18.2), Iran's state table (18.17) and Umm al-Qura (18.28 to 18.33)
span 0.9 degrees, which near the equator is under 4 minutes. **Six national authorities, six different labels, and
an output spread smaller than the rounding some of them apply.** For an app, that is one of the most useful facts
here: a very large share of the Muslim world's Fajr times are within a few minutes of each other regardless of
which of these six labels is chosen.

**Group G: not convergent with anything.** Musulmans de France at 12/12 (cited) stands alone at the low end;
Portugal's 77-minute Isha (UNVERIFIED) stands alone in form; the Moonsighting seasonal function (cited, wave 1),
Diyanet's 1 h 20 min high-latitude rule (cited) and the Jafari sunset+17 Maghrib (measured) cannot be expressed as
angle pairs at all.

---

## 6. The elevation and refraction question

**Refraction.** Every authority measured in this report has a fixed refraction constant baked into its published
sunrise and sunset. The measured implied depressions at published sunrise and sunset cluster tightly on 0.79 to
0.95 degrees (Egypt 0.81 and 0.79, Umm al-Qura 0.95, Qatar and Iran at 0 to 1 minute of the 0.833 value), which is
the standard 0.833 degrees composed of 16 arcminutes of solar semidiameter plus 34 arcminutes of mean horizontal
refraction. `praytimes.org` publishes exactly that constant and the reason for it (cited). None of these bodies
publishes a temperature-and-pressure-dependent refraction.

**Elevation.** Only two sources found in this research specify it at all, and neither is a state authority's own
method document.

1. **Indonesia's Kemenag criteria, as transcribed by Rukyatul Hilal Indonesia** (cited,
   `rukyatulhilal.org/jadwalshalat/kriteria.html`, fetched 2026-09-30). This is the most concrete elevation
   treatment found anywhere in this research. It states that the official table is valid for 0 to 250 m and gives a
   correction table to be applied to Maghrib (added) and sunrise (subtracted):

   | Elevation | Correction |
   | --- | --- |
   | 0 to 250 m | none |
   | 250 to 700 m | 1 min |
   | 700 to 1000 m | 2 min |
   | 1000 to 1300 m | 3 min |
   | 1300 to 1700 m | 4 min |
   | 1700 to 2000 m | 5 min |
   | 2000 to 2500 m | 6 min |

   It publishes the underlying formula too: `D = sqrt(2h/R)` with R = 6.4e6 m, and works the example that 2000 m
   gives a horizon dip of 1.4 degrees, worth about 6 minutes. It also states that the table is valid only within a
   30 km radius of the city centre. **This is the only authority-linked publication found that quantifies
   elevation.**

2. **The Astronomical Society of Brunei Darussalam's calculator** (cited, `bruneiastronomy.org/prayer/`, fetched
   2026-09-30), which implements Mohammad Shawkat Odeh's full high-accuracy treatment: solar semidiameter computed
   from the Earth-Sun distance as `0.2666/R` degrees, refraction as a function of pressure in millibars and
   temperature in Celsius (defaults 1010 mbar and 27 C, user-adjustable), an elevation correction
   `D = 0.035333 * sqrt(h)` degrees, and a horizontal parallax of 0.0024 degrees. It also applies an
   altitude-dependent refraction correction to the Asr zenith angle. **The society is not the state authority; MORA
   publishes the official Brunei tables and publishes no method.**

The International Astronomical Center's Arabic paper by Odeh is the underlying scholarship for both, and it gives
the full chain: zenith = 90 + semidiameter + refraction + horizon dip - horizontal parallax (equation 9), with
worked examples (cited, `astronomycenter.net/article/2001_salat.html`, fetched 2026-09-30, read in Arabic).

**Does anyone's published timetable account for altitude? Essentially no.**

- `praytimes.org` states the practice plainly: "If the observer's location is higher than the surrounding terrain,
  we can consider this elevation into consideration by slightly increasing the above constant 0.833. However, in
  practice, the constant is considered the same regardless of the elevation" (cited).
- Malaysia's JAKIM assigns separate zones to high ground (PHG06 for Cameron Highlands and Genting, PRK07 for Bukit
  Larut, SBH06 for Gunung Kinabalu, KDH07 for Puncak Gunung Jerai), which is elevation handled by zoning rather
  than by a correction term (cited, the zone list at `e-solat.gov.my`). JAKIM's own journal describes the same
  practice historically: Penang was one zone with Bukit Bendera "hanya diberikan pembetulan minit", given only a
  minute correction (cited).
- FCNA's paper acknowledges the size of the effect without prescribing a fix, noting that sunrise on Everest is up
  to 15 minutes 31 seconds earlier than at sea level and that "even the time for sunset, which is much more
  deterministic than twilight, can be different in the same city depending on whether a person is on a hill or in a
  valley" (cited).
- Wifaqul Ulama's FAQ says its app uses "longitude, latitude and altitude" from GPS while its printed timetables do
  not, and warns the two will differ (cited). **That is the only body found that says its own two products disagree
  because one uses elevation and the other does not.**

**One caution for this app, drawn from Kemenag's own numbers.** If the app reads device elevation and applies a dip
correction, it will produce times that differ from the authority's published table at any altitude above 250 m,
because the authority's table does not apply one. An app that wants to match an authority must reproduce the
authority's simplification, not improve on it. The exception is Indonesia, where the authority itself publishes the
correction to apply.

---

## UNVERIFIED and open

Listed in descending order of how much the gap would matter to a worldwide app.

1. **The Muslim World League has no traceable method publication.** 18/17 is the world's most-used default and its
   primary source could not be found. `themwl.org` publishes an app, not a method. **Next step: contact MWL, or
   search its Arabic publications and any Fiqh Academy resolution on prayer times.**
2. **The Leva Research Institute, Qum, could not be shown to exist.** No website, no publication, no document. The
   16/14/4 "Jafari" parameter set that ships in every library traces only to `praytimes.org`. This is the single
   least-supported widely-shipped constant found.
3. **JAKIM's published 20/18 does not reproduce JAKIM's own times.** Measured 17.4 to 17.6 against a claimed 20, a
   gap of about 10 minutes. The measurement used two candidate zone anchor points for WLY01 and both gave the same
   answer, so the discrepancy is not an anchor-point artefact. **Next step: read JAKIM's zone-definition document
   to find the true WLY01 anchor, or measure a single-point zone such as PHG01 (Pulau Tioman).**
4. **The UAE could not be read at all.** `awqaf.gov.ae`, `awqaf.ae` and both IACAD hosts were empty or HTTP 403.
   The 18.2/18.2 figure in circulation is labelled by AlAdhan itself as unofficial Batoul Apps research.
   **Next step: `agent-browser` against `iacad.gov.ae/en/prayer-times`.**
5. **Azerbaijan's Caucasus Muslims Board publishes 76 districts and 11 years of tables that could not be parsed.**
   The table renders client-side. This is a Shia-majority state authority, so it is the best available test of
   whether the sunset+17 Maghrib is used outside Iran. **Next step: `agent-browser` against
   `caucasus-muslims.org/az/namaz-calendar`.**
6. **ISNA has published nothing of its own that could be found.** Its name is on a method it did not author; FCNA
   authored it. `isna.net/prayer-times/` returned empty content through tinyfish. **Next step: `agent-browser`, or
   accept FCNA as the correct attribution and relabel.**
7. **Kuwait, Bahrain, Jordan, Algeria, Tunisia, Libya and Portugal are all library-only.** Each has an angle pair
   in `aladhan.com` and nothing behind it. Given that Oman's library constant turned out to be wrong by 1.5 degrees
   and Qatar's by 0.2, these should be assumed wrong until measured. **Next step: each of these states publishes an
   official timetable somewhere; measure each one the way Oman, Qatar, Egypt and Morocco were measured here.**
8. **India, Pakistan, Bangladesh, Nigeria, Sudan, Somalia, Senegal, Kazakhstan, Uzbekistan, Australia and South
   Africa have no national published method that this research could find.** Some have no national authority at
   all. R2 (the country-by-country agent) must not treat these as lookups.
9. **The Umm al-Qura Ramadan 120-minute Isha was not measured**, only cited, because no Ramadan day fell in the
   fetched range. **Next step: fetch `ummulqura.org.sa` for a Ramadan 1448 date and confirm the interval steps from
   90 to 120.**
10. **The Umm al-Qura Fajr angle measures at 18.28 to 18.33, not the cited 18.5.** A 0.2-degree gap is under a
    minute at Makkah's latitude, so it may be rounding in the published table, or it may be that the real
    convention is 18.3 and 18.5 is a transcription. **Next step: measure a full year of the Umm al-Qura table and
    a high-latitude Saudi city such as Tabuk, where 0.2 degrees is worth more.**
11. **Iran's state table measures at Fajr 18.17, not the cited 17.7.** A 0.47-degree gap, worth about 2 minutes at
    Tehran. `time.ir` publishes no Isha at all, so the cited 14-degree Isha could not be tested. **Next step: find
    which Iranian body actually authors `time.ir`'s times and whether the Institute of Geophysics attribution is
    correct.**
12. **Diyanet's own primary document could not be reached on a `diyanet.gov.tr` host.** The verbatim text used here
    is DITIB's reproduction of the Din Isleri Yuksek Kurulu statement, which is authoritative (DITIB is Diyanet's
    German arm) but is a mirror. `kurul.diyanet.gov.tr` returned an unrelated fatwa. **Next step: search
    `kurul.diyanet.gov.tr` and `vakithesaplama.diyanet.gov.tr` for the original.**
13. **The 1983 Diyanet change is cited only by its critics.** Multiple Turkish sources claim Diyanet moved Imsak
    from 19 to 18 degrees and removed temkin in January 1983. The measurements in this report show a temkin margin
    is present today (5 to 8 minutes), so the "temkin was removed" claim is at least incomplete. Not load-bearing
    for this app, but noted.
14. **The Egyptian 19.5-to-14.7-degree claim is UNVERIFIED and contradicted.** A Facebook post attributed to Dar
    al-Ifta claims the Egyptian Survey Authority changed its Fajr depression from 19.5 to 14.7 degrees. The
    authority's own table for 2026-09-30 measures at 19.59, so if any such change happened it is not in the
    published output. Recorded because it would be a major finding if true.
15. **No authority found publishes a rounding rule explicitly.** The rounding direction was inferred from
    measurement (MUIS rounds up by 1 to 2 minutes; Diyanet's margins are deliberate offsets, not rounding). Wave 1
    measured that nearest-minute rounding best reproduces the moonsighting endpoint. **This matters because
    rounding direction alone is a 1-minute systematic error on every prayer.**

---

## Sources

All fetched 2026-09-30. Path is how the content was retrieved: `tinyfish` means `tools.tinyfish.fetch_content` or
`tools.tinyfish.search`; `fetch` means a direct HTTP GET from the `execute` runtime, used only where tinyfish
failed or where a JSON endpoint was needed.

### Authority primary sources (the body's own site or document)

| Body | URL | Path | What it established |
| --- | --- | --- | --- |
| Fiqh Council of North America | `https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/` | tinyfish | 15 USA / 13 Canada, October 2017; the precaution recommendation; a comparison table of seven methods |
| Fiqh Council of North America | `https://fiqhcouncil.org/fifteen-or-eighteen-degrees-calculating-prayer-fasting-times-in-islam/` | tinyfish | the full reasoning, the observation record (12 to 18, 9 to 20), the five rejected options, the King and Yusuf quotations, the Everest elevation figure |
| FCNA via International Astronomical Center | `https://astronomycenter.net/articles/2012/07/30/81?l=en` | tinyfish | the superseded September 2011 FCNA position: moonsighting.com functions, "around 17.5" and "around 15" |
| Egyptian General Authority of Survey | `https://www.esa.gov.eg/praytimes.aspx` | tinyfish | the authority's own daily table for 80 Egyptian cities; the Cairo row that measures 19.59/17.43 |
| Umm Al-Qura Calendar (Saudi Arabia) | `https://www.ummulqura.org.sa/en` and `/ar/prayer-times` | tinyfish | the Makkah and Medina rows for 2026-09-29 that measure Fajr 18.28 to 18.33 and Isha exactly sunset+90 |
| Ministry of Endowments and Religious Affairs, Oman | `https://www.mara.gov.om/calendar_page2.asp` | tinyfish | 30 days of the ministry's own Muscat table, measuring 17.95/18.20 with a 5-to-6-minute margin |
| Ministry of Interior, Qatar | `https://portal.moi.gov.qa/MoiPortalRestServices/rest/prayertimings/today/en` | tinyfish | the official Doha row measuring Fajr 17.81 and Isha exactly sunset+90 |
| Ministere des Habous et des Affaires Islamiques, Morocco | `https://www.habous.gov.ma/prieres/horaire-api.php?ville=1` | tinyfish | the ministry's own Rabat row measuring 19.04/16.85, Dhuhr+5, Maghrib+3 |
| Diyanet Isleri Baskanligi, via DITIB | `https://www.ditib.de/detail2.php?id=424&lang=en` | tinyfish | the Din Isleri Yuksek Kurulu statement of 2009-08-28 in Turkish: 18/17, the 45-degree threshold, Maghrib + 1 h 20 min capped at one third of the night, the March-to-September Imsak rule |
| Diyanet prayer-time feed (Ankara) | `https://ezanvakti.emushaf.net/vakitler?ilce=9206` | fetch | 32 consecutive days measuring the temkin margins: Ogle +5, Ikindi +4 to +5, Aksam +7 to +8, Gunes -7 to -8, Imsak 17.98 to 18.16, Yatsi 17.05 to 17.24 |
| Majlis Ugama Islam Singapura | `https://www.muis.gov.sg/resources/islamic-calendar/` | tinyfish | the index of official timetables |
| Majlis Ugama Islam Singapura | `https://isomer-user-content.by.gov.sg/48/f989baef-c5eb-440e-b3bb-874626a0664e/Prayer timetable 2026.pdf` | tinyfish | the official 2026 yearly timetable; all 365 rows parsed, measuring 19.88/18.13 |
| Jabatan Kemajuan Islam Malaysia | `https://www.e-solat.gov.my/portalassets/files/jurnal_falak_bil1_2015-ilovepdf-compressed.pdf` | tinyfish | `Jurnal Falak` bil. 1 2015: "Amalan di Malaysia menggunakan sudut 20 di bawah ufuk bagi waktu Subuh dan 18 bagi waktu Isyak" (p.134); the zone and ihtiyati practice (p.59 to 60) |
| Jabatan Kemajuan Islam Malaysia | `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=week&zone=WLY01` | tinyfish | JAKIM's own zone WLY01 output, measuring Fajr 17.41 to 17.60 against its claimed 20 |
| Portal e-Solat (JAKIM) | `https://www.e-solat.gov.my/` | tinyfish | the 62-zone list, including the four high-ground zones |
| Kementerian Agama criteria, via Rukyatul Hilal Indonesia | `https://rukyatulhilal.org/jadwalshalat/kriteria.html` | tinyfish | all eight numbered Kemenag rules (Subuh -20 + 2 min ihtiyati, Isya -18 + 2 min, Imsak 10 min before Subuh, Syuruq -2 min, +2 min on Zuhur, Ashar and Maghrib), the 0-to-250 m validity, the 30 km radius, and the full elevation correction table with its formula |
| Bimas Islam, Kemenag | `https://bimasislam.kemenag.go.id/jadwalshalat` | tinyfish | reached, but rendered as an empty shell; noted as a failed primary-source attempt |
| Astronomical Society of Brunei Darussalam | `https://bruneiastronomy.org/prayer/` | tinyfish | Subuh 20 / Isyak 18 retained for Brunei; the full Odeh refraction, elevation `0.035333*sqrt(h)` and parallax treatment; the Asr refraction correction |
| Ministry of Religious Affairs, Brunei | `https://www.mora.gov.bn/SitePages/WaktuSembahyang.aspx` | tinyfish (search) | confirms MORA publishes monthly tables, not a method |
| Office of Sayyid Ali al-Sistani | `https://www.sistani.org/english/book/48/2212/` | tinyfish | ruling 722: Maghrib must wait until the eastern redness has passed overhead, "based on obligatory precaution"; no angle given |
| time.ir (Iran state timekeeping) | `https://www.time.ir/` | tinyfish | the Tehran row for 2026-09-30 measuring Fajr 18.17, Zohr at exactly true noon, and Maghrib at exactly sunset+17 min |
| Wifaqul Ulama (Britain) | `https://www.wifaqululama.co.uk/salahtimes/` | tinyfish | Fajr 18; Isha 15 at and above 48 degrees, 18 below; Zuhr Istiwa+4; Maghrib sunset+5; both Asr factors; Aqrabul-Ayyam as a 3-day average; the OpenFajr and Asim Yusuf rebuttals |
| Wifaqul Ulama (Britain) | `https://www.wifaqululama.co.uk/highlat/` | tinyfish | the 11 November 2018 Preston ruling on Isha at high latitude and the Ibn Abidin Bulghar precedent |
| Jamiatul Ulama KZN, South Africa | `https://jamiat.org.za/hanafi-settings-for-salaah-apps/` | tinyfish | the fatwa recommending the Karachi preset, Hanafi Asr and a 3-minute Maghrib margin |
| Muslim World League | `https://themwl.org/en` and `/en/minhaj-app` | tinyfish (search) | searched; no method document exists on the site. This is the evidence for the MWL null. |
| Islamic Society of North America | `https://www.isna.net/` | tinyfish | reached; `isna.net/prayer-times/` returned empty content. Evidence for the ISNA null. |
| Caucasus Muslims Board | `https://caucasus-muslims.org/public/en/namaz-calendar` | tinyfish and fetch | the 76-district, 11-year calendar exists; the rows render client-side and could not be read by GET or POST |
| Islamic Foundation Bangladesh | `http://islamicfoundation.gov.bd/` | tinyfish | reached; no prayer-times or method section. Evidence for the Bangladesh null. |
| Muslim Board of Uzbekistan | `https://muslim.uz/` | tinyfish | reached; no method page. Evidence for the Uzbekistan null. |
| Nigerian Supreme Council for Islamic Affairs | `https://nscia.com.ng/` | tinyfish (search) | no method page. Evidence for the Nigeria null. |
| General Authority of Islamic Affairs, UAE | `https://www.awqaf.gov.ae/prayer-times?lang=en`, `https://awqaf.ae/prayer-times` | tinyfish | both returned empty bodies. Evidence for the UAE null. |
| IACAD, Dubai | `https://www.iacad.gov.ae/en/prayer-times`, `https://eservices.iacad.gov.ae/prayer-time` | tinyfish | both HTTP 403. Evidence for the UAE null. |

### Method references, scholarship and aggregators

| Source | URL | Path | What it established |
| --- | --- | --- | --- |
| PrayTimes.org, calculation | `https://praytimes.org/docs/calculation` | tinyfish | the USNO solar algorithm used for every measurement in this report; the definitions of the eight times; the 0.833 sunrise constant and the statement that elevation is ignored in practice; the Asr factor-1 and factor-2 formulas; the Shia Maghrib as Dhuhr + T(4); the legal-midnight definition; the ten-convention table |
| PrayTimes.org, methods | `https://praytimes.org/docs/methods` | tinyfish | the ten-method parameter table including Tehran's Maghrib 4.5, Jafari's 4, the Jafari midnight definition, and the note that Umm al-Qura's Fajr was 19 before Muharram 1430 and that Tehran's Isha angle "is not explicitly specified" |
| Arabeyes ITL | `https://raw.githubusercontent.com/arabeyes-org/ITL/master/prayertime/doc/method-info.md` | tinyfish | the eleven ITL methods; **the admission that "no contacts have been made to obtain the correct (or up-to-date) numbers as published by such organizations"**; the 20/18 pair misattributed to Egypt as method 1; the 19.5/90-min "Fixed Ishaa Angle Interval" for Bahrain, Oman, Qatar and the UAE; the sixteen high-latitude rules and the admission that the fractional-night family "have no proof in traditional Shari'a (Fiqh) resources" |
| AlAdhan, methods page | `https://aladhan.com/calculation-methods` | tinyfish | the 22-method list; **the explicit statement that Dubai 18.2 "is not an official calculation but based on the research done by the Batoul Apps team"**; the admission that countries "tune the timings further, by adding a few minutes here and there, based on criteria that may seem completely arbitrary" |
| AlAdhan, methods API | `https://api.aladhan.com/v1/methods` | fetch | the machine-readable constants for all 22 methods, including Jordan 18/18 with Maghrib 5 min, Portugal 18 with Maghrib 3 min and Isha 77 min, Kuwait 18/17.5, Qatar 18 with 90 min, Gulf 19.5 with 90 min, Turkey 18/17 marked "(experimental)", Russia 16/15, Tunisia 18/18, Algeria 18/17, Morocco 19/17 |
| International Astronomical Center, Mohammad Shawkat Odeh | `https://astronomycenter.net/article/2001_salat.html` | tinyfish | the Arabic prayer-time calculation paper (Oct 2001, revised Sep 2004): the 108-degree zenith for Fajr and Isha; the Asr equations (5), (6) and the refraction correction (6a) to (6c); equation (9) for the full zenith with semidiameter, refraction, horizon dip and parallax; the worked 1000 m example; **the statement that most Islamic countries adopt the Shafi'i Asr definition**; the fajr kazib versus fajr sadiq distinction. Read in the original Arabic. |
| Mawaqit help centre | `https://help.mawaqit.net/en/articles/9047426-why-are-prayer-times-different-from-one-mosque-to-another` | tinyfish | the attribution of 18/17 jointly to the Algerian, Moroccan and Turkish ministries and to MWL; Kuwait 18/17.5; the statement that mosques often load a national calendar rather than compute; "There can be a difference of 20 to 30 minutes or even more sometimes" |
| Saphirnews via PSM en ligne | `https://www.psm-enligne.org/10733-horaires-de-prieres-12-ou-18-degres-pourquoi-choisir` | tinyfish | Fouad Alaoui (UOIF calendar editor) confirming the 12-degree choice; the GMP 18-degree position; the October 2015 joint commission and its lack of progress; the mooted 14-to-15 compromise; the 12-to-19-degree validity band he claims for France and northern Europe. Read in the original French. |
| Grande Mosquee de Paris | `https://www.grandemosqueedeparis.fr/horaire-des-prieres-paris` | tinyfish (search) | confirms GMP publishes its own monthly Paris calendars |
| moonsighting.com FAQ | `https://www.moonsighting.com/faq_pt.html` | tinyfish | section 1.2's Aqrabul-Bilaad 0.1-degree iteration; the latitude-versus-polar-day table; the Hanafi Fajr and Asr ending-time guidance. Cross-checked against wave 1, not re-researched. |
| MuslimMatters, Asim Yusuf discussion paper | `https://muslimmatters.org/2019/05/04/shedding-light-on-the-moonsighting-isha-fajr-times-and-long-fasts/` | tinyfish | the framing of the dispute as valid *ijtihadat*; the *muwafaqa ahl al-bilad* principle of conforming with the local community; the statement that "the times of obligatory prayer can only be known through observation of sunlight and shadow" |
| Muwaqqit | `https://www.muwaqqit.com/` | tinyfish | a worked example of a research-grade calculator publishing Fajr -19, Isha al-Awwal -16, Isha al-Thani -19, Ishtibak al-Nujum -10, both Asr factors, Zuhr as transit shadow + 1 mm, and a +/- 1-degree uncertainty band on every twilight time |
| prayersa.com | `https://prayersa.com/calculation-method` | tinyfish | a Saudi-facing description of the Umm al-Qura method as 18.5 Fajr and 90 minutes after sunset for Isha. Secondary, used only to corroborate the cited 18.5. |
| Umm al-Qura via IslamicFinder | `https://www.islamicfinder.org/prayer-times/` | tinyfish (search) | the widely-copied "18.5 (19 before 1430 hijri), 90 minutes, 120 in Ramadan" formulation. Secondary. |

### Prior art read, not re-researched

| Document | What was read |
| --- | --- |
| `ai/features/moonsighting/RESEARCH-FINDINGS.md` | sections 2.11 (the adhan coefficients, the 18-degree bound, the 1/7 rule above 55, the measured deltas), 2.12 (the endpoint's day-early DST defect), 2.13 (how the published method changed 1999 to 2024) |
| `ai/features/moonsighting/notes/implementations.md` | section 0, all eleven findings |

### Measurement harness

Every measured figure in this report was produced by a self-contained implementation of the USNO low-precision
solar algorithm published at `praytimes.org/docs/calculation`, written in the `execute` runtime for this report.
It computes the equation of time and solar declination, derives true noon, and then either forward-computes a time
from a depression angle or inverts a published time to recover the depression angle it implies. The Asr routine
uses the noon solar altitude and the factor-1 or factor-2 shadow rule from the same page. Sunrise and sunset use
the 0.833-degree constant. No third-party library was used and nothing was installed into the repository. The
harness was validated by reproducing Egypt's own published Cairo row for 2026-09-30 to the minute on all six
times, which is the strongest available check that both the solar model and the inversion are correct.
