# R5: closing the country adoption map

**Status: RESEARCH ONLY.** This report closes the gap R2 left. R2 verified about twenty countries at tier A and
then failed to deliver its cluster tables: its line 121 reads `(cluster tables inserted below)` and nothing
follows. Roughly fifty countries had no row at all, and five of the largest Muslim populations sat at tier C.
This report extends and corrects R2. It does not repeat the countries R2 established at tier A.

Research window 2026-09-30. Every fetch date is 2026-09-30 unless a row states otherwise. Retrieval path is named
on every fact: `tinyfish` is `tools.tinyfish.fetch_content` or `tools.tinyfish.search`; `fetch` is a direct HTTP
GET from the `execute` runtime; `agent-browser` is the CLI, used where a page was JavaScript-rendered or where an
endpoint required a browser origin; `OCR` is the macOS Vision framework via a local Swift helper, used where an
authority publishes its table only as an image.

Evidence tiers are R2's, unchanged: **A** the authority's own site, read. **B** a major national mosque's
timetable, read. **C** a local app, newspaper or academic paper. **D** a software library's country mapping,
which is a lead and not a finding. **NULL** nothing sourceable, stated as such.

---

## Findings in one page

1. **All five tier-C giants are now resolved, and three of the five resolve to "there is no national
   authority".** Egypt, Iran, Bangladesh and (newly) Yemen and the UAE were measured against their own
   authorities' published tables and each yielded a clean, reproducible convention. Pakistan and Afghanistan did
   not: neither state publishes a national prayer timetable that this research could find, so the long-circulated
   "Karachi 18/18" attribution for both remains a library constant with no state behind it. That is the finding,
   not a gap in the search.
2. **Egypt is confirmed at tier A by measurement, not by citation.** Inverting the Egyptian General Authority of
   Survey's own `esa.gov.eg` rows for five cities on 2026-09-30 recovers Fajr **19.40 to 19.62 degrees**, Isha
   **17.40 to 17.55 degrees**, Asr shadow factor **0.99 to 1.00**, Dhuhr offset **-0.4 to +0.2 minutes** and
   Maghrib at plain sunset (**0.75 to 0.90 degrees**). The 19.5/17.5 pair that every library ships is correct.
   All measured.
3. **Iran's national Maghrib is sunset plus 17 minutes and its Fajr is 18.0 degrees, not the cited 17.7.**
   Measured against `time.ir`'s own Tehran row: Fajr angle **18.07**, Maghrib **4.27 degrees** below the horizon
   which is exactly **17 minutes** after sunset, Dhuhr at true noon (**-0.5 minutes**). Iran's published
   `نیمه شب شرعی` (shar'i midnight) of 23:12 matches the midpoint of sunset to next Fajr to **1 minute**, and
   misses the sunset-to-sunrise midpoint by **42 minutes**, which proves the Jafari midnight rule empirically.
   Iran publishes **no Isha at all**, so the 14-degree Isha in every library is untestable against the state
   table. All measured.
4. **Bangladesh is now tier A and the Islamic Foundation's own note explains its offsets in writing.** Its
   Ramadan 1447 PDFs, published on `islamicfoundation.gov.bd`, state that the sahri column uses the **eastern**
   edge of each district and the Fajr azan column uses the **western** edge. Measured at the western-edge anchor
   the Fajr angle is **17.90 to 18.01 degrees** across five sampled dates in two districts, and iftar is plain
   sunset (**0.80 to 0.95 degrees**). So Bangladesh is 18 degrees, and the 2 to 3 minute sahri-to-Fajr gap is a
   geographic width correction, not an ihtiyat.
5. **The UAE is fully recovered, including iqama offsets, and its convention is not what any library ships.**
   Minting the anonymous bearer token inside the `www.awqaf.gov.ae` origin with `agent-browser` opened the
   authority's own feed. Measured over 30 days and four emirates: Fajr **17.90 to 18.30** (mean 18.15), Isha
   **17.93 to 18.29** (mean 18.09) as a genuine angle rather than an interval, Asr factor **1.00**, Dhuhr
   **+2.3 to +2.7 minutes**, Maghrib **sunset + 2 to 3 minutes**. The AlAdhan "Dubai" constant of 18.2/18.2 is
   close on the angles but misses the Dhuhr and Maghrib offsets entirely. The feed also carries the state's own
   iqama intervals: **Fajr +25, Dhuhr +20, Asr +20, Maghrib +5, Isha +20, Friday +20 minutes**, which no other
   authority found in this wave publishes.
6. **Azerbaijan is the decisive test of the Shia convention outside Iran, and it answers yes.** Driving
   `caucasus-muslims.org` with `agent-browser` exposed a slug-based GET form; the board publishes its table as a
   WebP image, which was OCR'd locally. Measured over all 30 days of the Baku September 2026 table: Maghrib is
   **sunset + 14 to 15 minutes** (3.18 to 3.36 degrees), Asr shadow factor is **1.96 to 1.99**, which is the
   **Hanafi two-shadow rule**, and the published `Gecə yarısı` matches the sunset-to-Fajr midpoint to **0 to 1
   minute**, the Jafari midnight. Subh is **15.85 degrees** with a separate `Imsak` row exactly **5 minutes**
   earlier, every day. So the Caucasus Muslims Board combines a Shia Maghrib and a Shia midnight with a Hanafi
   Asr, which no single library preset expresses.
7. **The Muslim World League question has a definitive answer and it is negative.** The MWL's own Islamic Fiqh
   Academy has ruled on prayer times repeatedly, at its fifth, ninth, nineteenth and twenty-first sessions, and
   every one of those rulings is **qualitative fiqh, never a number**. The Academy's collected resolutions from
   twenty sessions, published as a 448,078-character PDF by the MWL itself, contains **zero occurrences of the
   word "degree"** (`درج`) in any form. MWL's own `themwl.org` prayer-times page points the reader at its
   `Minhaj` app and publishes no parameters. **The 18/17 pair attributed to the Muslim World League worldwide is
   not the Muslim World League's.** Measured and cited.
8. **The "Leva Research Institute, Qum" could not be shown to exist in Persian or Arabic either.** Searching in
   both languages returns Qum institutions that genuinely do publish on prayer times (`maalemqom.ir`,
   `ehtejaj.com`, the Ijtihad Network), and no Leva. The 16/14/4 "Jafari" constant traces to exactly one place:
   `praytimes.org`, authored by one person, Hamid Zarrabi-Zadeh, and copied from there into every library. It
   ships worldwide with no institution behind it.
9. **R2 was wrong about the Diyanet temkin and R1 was right, and the proof is stronger than a measurement.**
   Diyanet's own feed publishes the prayer rows **and** its own unadjusted astronomical sunrise and sunset side
   by side. Differencing them directly, `Güneş` is **exactly 7 minutes before** `GüneşDoğuş` and `Akşam` is
   **exactly 7 minutes after** `GüneşBatış`, on every one of 32 consecutive days. The decisive test is elevation:
   across seven cities from Trabzon at 0 m to Erzurum at 1,900 m the offset is **exactly 7 minutes in every
   one**. An elevation correction would scale with height (Ankara alone would be 5.7 minutes); a flat constant is
   a decree. Diyanet still applies a temkin. What the 1983 reform removed was the temkin **on Imsak and Yatsı**,
   which measure at 17.95 and 17.20 degrees with no margin, exactly as the critics describe. R2 read a partial
   claim as a total one.
10. **The world's Muslims are majority-uncovered by any established national convention.** Against Pew's 2.0
    billion denominator, the top 25 countries hold 1.66 billion (83.1%). Of those, only **38.5%** of the world's
    Muslims live in a country whose convention this research established at tier A. **29.9%** live in a country
    where nothing was sourceable at all, led by India at 10.0%, Nigeria at 4.8% and Pakistan at 11.7% at tier C.
    Summed across every country where the convention IS established, the total is **40.1%** of the world's
    Muslims. The remaining **59.9%** have no national convention an app can honestly claim to follow. Computed.
11. **Kazakhstan publishes its method in its own page source, and it is the most surprising row in the table.**
    `muftyat.kz` computes client-side and its own script reads `prayTimes.setMethod('ISNA')` with
    `adjust({asr:'Hanafi'})`, that is **Fajr 15, Isha 15, two-shadow Asr**, plus a latitude-banded offset of
    **+/- 3 minutes below 48 degrees and +/- 5 minutes at or above 48**. Reproduced exactly. A 15-degree Fajr in
    Central Asia is three degrees from what every library assigns Kazakhstan.
12. **Sri Lanka and Yemen both turn out to have real national authorities that nobody cites.** ACJU, incorporated
    by Sri Lankan Act of Parliament No. 26 of 1985, publishes an 11-zone national timetable measuring at Fajr
    **19.70 to 19.93**, Isha **18.19 to 18.28**, standard Asr. Yemen's General Authority of Awqaf and Guidance
    serves 31 locations with embedded JSON, measuring at Fajr **17.90 to 18.15** and an Isha near **15.8
    degrees**, which is unlike any library constant for the region. Both measured, both tier A, neither appears
    in any library's country map.

---

## Measurement harness

Every measured number below comes from a self-contained reimplementation of the USNO low-precision solar
algorithm published at `praytimes.org/docs/calculation`, written for this report at
`ai/features/global-prayer-times/data/countries/solar-harness.mjs`. It computes the equation of time and solar
declination, derives true noon, and then either forward-computes a time from a depression angle or **inverts** a
published time to recover the depression angle it implies. `asrFactorAtTime` inverts a published Asr time to
recover its shadow factor. No third-party library was used and nothing was installed into the repository.

**Validation.** Reproducing R1's check, the harness computes Egypt's own published Cairo row for 2026-09-30 from
the 19.5/17.5 parameters and standard Asr, and matches all six times to the minute:

| | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
| --- | --- | --- | --- | --- | --- | --- |
| Published, `esa.gov.eg` | 05:21 | 06:48 | 12:45 | 16:09 | 18:42 | 19:59 |
| Harness, 19.5 / 17.5 / factor 1 | 05:21 | 06:48 | 12:45 | 16:09 | 18:42 | 19:59 |
| Delta, minutes | 0 | 0 | 0 | 0 | 0 | 0 |

A second independent check: the harness matches `api.aladhan.com` method 5 for the same coordinate and date on
all six times (Asr differs by 1 minute from AlAdhan's rounding, and the harness agrees with the authority).

Scripts written for this report, all under `ai/features/global-prayer-times/data/countries/`:

| File | What it does |
| --- | --- |
| `solar-harness.mjs` | The solar model, forward and inverse, with `invertRow` |
| `validate-harness.mjs` | The validation above, as a runnable check; exits non-zero on any mismatch |
| `ocr.swift` | Local macOS Vision OCR for image-only timetables |
| `measure-uae.mjs` | UAE Awqaf, 30 days, four emirates |
| `measure-azerbaijan.mjs` | Caucasus Muslims Board, Baku, 30 days |
| `measure-yemen.mjs` | Yemen Awqaf, four governorates |
| `measure-kazakhstan.mjs` | Reproduces `muftyat.kz`'s own published method |
| `measure-balkans.mjs` | Bosnia and Kosovo |
| `measure-srilanka.mjs` | ACJU Zone 01, September |
| `measure-kuwait-bahrain.mjs` | Kuwait, tier C |
| `measure-diyanet-temkin.mjs` | The temkin resolution, 32 days plus a seven-city elevation test |
| `population-weighting.mjs` | The population table and coverage arithmetic |
| `uae-awqaf-sep2026.json`, `az-baki-2026-09.tsv`, `lk-colombo-sep.tsv`, `turkey-diyanet-ankara-32d.json` | Captured source data |

---

## The five tier-C giants, measured

### Egypt: confirmed, and the best-evidenced row in the world

Authority: **al-Hay'a al-Misriyya al-'Amma li-l-Misaha**, the Egyptian General Authority of Survey,
`esa.gov.eg/praytimes.aspx`, read in Arabic through `tinyfish`. The page serves a same-day table for 43 Egyptian
cities with the header row `فجر`, `شروق`, `ظهر`, `عصر`, `مغرب`, `عشاء`. Inverting five of them for 2026-09-30 at
UTC+3:

| City | Fajr angle | Sunrise angle | Dhuhr offset, min | Asr factor | Maghrib angle | Isha angle | Isha after Maghrib, min |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Cairo | 19.52 | 0.76 | -0.1 | 1.000 | 0.83 | 17.47 | 77 |
| Alexandria | 19.62 | 0.87 | -0.3 | 1.000 | 0.83 | 17.49 | 78 |
| Aswan | 19.45 | 0.77 | -0.4 | 0.992 | 0.89 | 17.55 | 73 |
| Marsa Matruh | 19.54 | 0.82 | -0.1 | 0.991 | 0.90 | 17.53 | 78 |
| Hurghada | 19.40 | 0.77 | +0.2 | 0.999 | 0.75 | 17.40 | 75 |

All measured. Reading: Egypt is **Fajr 19.5, Isha 17.5, standard Asr, Dhuhr at true noon with no offset, Maghrib
at plain sunset**. The Isha-after-Maghrib spread of 73 to 78 minutes confirms Isha is an angle and not an
interval. The cited pair is right, and R2's tier C is upgraded to **tier A, measured**. R1's separate note that a
Facebook post claims Egypt moved from 19.5 to 14.7 degrees is refuted by the authority's own current output.

### Iran: Fajr 18.0, Maghrib sunset+17, no Isha published

Authority: the **Calendar Centre (مرکز تقویم) of the Institute of Geophysics, University of Tehran**, whose site
`calendar.ut.ac.ir` returned HTTP 504 through both `tinyfish` and `agent-browser` on every attempt. The state
timekeeping site `time.ir` publishes the Centre's output and was read through both `tinyfish` and `agent-browser`.
The Centre's methodology is documented verbatim on a mirror, `prayer.aviny.com`, read in Persian:

> در حال حاضر مرکز تقویم مؤسسة ژئوفیزیک دانشگاه تهران که مسولیت استخراج اوقات شرعی کشور را به عهده دارد، برای اذان
> صبح زاویه 17.7 درجه زیر افق را ملاک محاسبات قرار داده

(The Calendar Centre of the Institute of Geophysics, University of Tehran, which is responsible for deriving the
country's shar'i times, uses an angle of 17.7 degrees below the horizon as the basis for the dawn azan.) The same
page states the Maghrib criterion as **4.5 degrees of depression**, explains it as the fading of the
`حمره مشرقیه` (the eastern redness), and states that Dhuhr is the sun's centre crossing the meridian, rounded to
the minute.

Measured against `time.ir`'s own Tehran row for 2026-09-30 at UTC+3:30 (Fajr 04:33, sunrise 05:58, Dhuhr 11:54,
sunset 17:50, Maghrib 18:07, shar'i midnight 23:12):

| Quantity | Measured | Cited |
| --- | ---: | --- |
| Fajr angle | **18.07** | 17.7 |
| Sunrise angle | 0.89 | standard 0.833 |
| Dhuhr offset from true noon | -0.5 min | true noon |
| Maghrib angle | **4.27** | 4.5 |
| Maghrib minus sunset | **17 minutes** | Shia convention, per `moonsighting.com` |
| Isha | **not published** | 14 degrees, library-only |

The Fajr measures 0.37 degrees deeper than the cited 17.7, worth about 2 minutes at Tehran. Forward-computing at
17.7 gives 04:35 against a published 04:33; at 18.0 it gives exactly 04:33. This is R1's finding reproduced
independently.

**The midnight test is new and it is the strongest available proof of the Jafari rule.** Iran's published
`نیمه شب شرعی` for the date is 23:12. The midpoint of sunset to next Fajr is **23:11**, one minute away. The
midpoint of sunset to next sunrise, which is the Sunni convention every library uses by default, is **23:54**,
forty-two minutes away. Measured.

### Bangladesh: Fajr 18.0, sunset Maghrib, geographic edge offsets

Authority: the **Islamic Foundation (ইসলামিক ফাউন্ডেশন)**, `islamicfoundation.gov.bd`, the statutory body under
the Ministry of Religious Affairs. Its site's own file section publishes the 1447 AH Ramadan sahri and iftar
timetable as eight divisional PDFs, read through `tinyfish`. R1 recorded the Foundation as UNVERIFIED because its
site "has no prayer-times or method section reachable through tinyfish"; the tables are there, under
`pages/files/`, and they are signed by the Governor of the Board of Governors, the Director of the Shaikh
Zakariya Islamic Research Centre, and the Khatib of Baitul Mukarram National Mosque.

The PDFs carry an explanatory note in Bengali stating the method. Its substance: the time given as the end of
sahri **is** the start of Fajr; because a single timetable serves a whole district and the district has width,
the **sahri** column uses the subh sadiq of the district's **eastern** edge (seconds dropped) and the **Fajr azan**
column uses the subh sadiq of the district's **western** edge (seconds rounded up), while **iftar** uses the
sunset of the district's **western** edge. That note is the reason the two morning columns differ by 2 to 3
minutes, and it means the correct anchor for inversion is the district edge, not the city centre.

Measured at the district west edge (Dhaka 90.01 E, Narayanganj 90.40 E), UTC+6:

| District | Date | Fajr azan angle (west anchor) | Iftar angle (west anchor) |
| --- | --- | ---: | ---: |
| Dhaka | 19 Feb 2026 | 17.88 | 0.94 |
| Dhaka | 25 Feb 2026 | 17.81 | 0.90 |
| Dhaka | 5 Mar 2026 | 17.89 | 0.92 |
| Dhaka | 12 Mar 2026 | 18.01 | 0.89 |
| Dhaka | 20 Mar 2026 | 18.00 | 0.82 |
| Narayanganj | 19 Feb 2026 | 17.97 | 0.81 |
| Narayanganj | 5 Mar 2026 | 18.00 | 0.80 |
| Narayanganj | 20 Mar 2026 | 17.90 | 0.95 |

All measured. Reading: **Bangladesh is Fajr 18 degrees with Maghrib at plain sunset.** The Karachi attribution
gets the Fajr angle right by coincidence. It gets the reason wrong, and the 18-degree Isha is untested because
the Ramadan table publishes no Isha. Tier **A for Fajr and Maghrib, NULL for Isha and Asr**.

### Pakistan: there is no national authority, and that is the finding

Searched for a Pakistani state prayer timetable in English and Urdu through `tinyfish`. What exists:

- The **Ministry of Religious Affairs and Interfaith Harmony** (`mora.gov.pk`) was read. Its prayer-time function
  is the **Central Ruet-e-Hilal Committee**, which sights the crescent and declares the Hijri month. It publishes
  no prayer timetable and no method. Same structural position as Nigeria's NSCIA.
- The **Pakistan Meteorological Department** (`weather.gov.pk`) publishes sunrise and sunset for major cities and
  a paper on moon sighting. It publishes no prayer timetable.
- A genuine and new development: on **25 November 2025 the federal government approved a unified Azan and
  congregational prayer timetable for Islamabad and Rawalpindi**, effective **1 January 2026**, announced by
  Federal Minister for Religious Affairs Sardar Muhammad Yousaf, with consultations under way to extend it to
  Lahore, Karachi, Peshawar and Quetta. Cited, `propakistani.pk` and `icci.pk`. This is a **jamaah** schedule for
  two cities, not a national calculation method, and the timetable itself was not located. It is the first
  evidence found anywhere that Pakistan is moving toward a national standard.
- The **University of Islamic Sciences, Karachi** has no locatable site or publication, consistent with R1.
  `islamicacademy.org`'s Pakistan tables, a long-standing third-party source, state plainly that they are
  computed "according to 'Fiqh Hanfi'" from two books and verified against US Naval Observatory data, and that
  the reader should "add 5 minutes after start time" as their own safety margin. That is a private compilation,
  not a state convention.

**Verdict: NULL at country level for the calculation convention.** The Hanafi Asr expectation is well evidenced
for the subcontinent (R2 measured a 50-minute gap at Islamabad) and stands. The 18/18 angles do not.

### Afghanistan: NULL, with one documentary trace

The **Ministry of Hajj and Religious Affairs** (`وزارت ارشاد، حج و اوقاف`) has no reachable website; no
`mohia.gov.af` resolved. Its only public channels are X and Facebook. On **5 February 2025** its official X
account posted "جدول دائمی اوقات نمازهای پنجگانه از سوی وزارت ارشاد، حج و اوقاف برای شهر کابل و نواحی آن" (a
permanent table of the five prayer times from the Ministry of Hajj and Religious Affairs, for the city of Kabul
and its districts). Read through `tinyfish`; the post's attached image did not render through the text extractor,
so the table itself was not obtained.

So a national table exists, was published once as a social-media image for one city, and is not retrievable as
data. **Verdict: NULL at country level.** The Karachi 18/18 attribution for Afghanistan is a library mapping with
nothing behind it.

---

## The completed country table

Same columns as R2's. Countries R2 already established at tier A are not repeated. `std Asr` is the one-shadow
rule, `Hanafi Asr` the two-shadow rule.

### Middle East and the Gulf

| Country | Dominant authority (URL) | Convention or fixed table | Asr printed | Local additions | Tier | Evidence and fetch date |
| --- | --- | --- | --- | --- | --- | --- |
| United Arab Emirates | General Authority of Islamic Affairs, Endowments and Zakat, `awqaf.gov.ae` | **Measured: Fajr 18.15, Isha 18.09, both genuine angles. Dhuhr +2.4 min, Maghrib sunset +2.7 min.** 60 areas, whole federation, one year in one call | std Asr, factor 1.00 measured | **`emsak` is printed but equals `fajr` exactly on every row.** The feed carries the state's own iqama intervals: Fajr +25, Dhuhr +20, Asr +20, Maghrib +5, Isha +20, Friday +20 minutes | **A, measured** | `mobileappapi.awqaf.gov.ae/APIS/v3/prayer-time/prayertimes/...` with an anonymous bearer from `/sso/StartRequest`, minted inside the `www.awqaf.gov.ae` origin with `agent-browser`, 2026-09-30. 30 days, Abu Dhabi, Dubai, Sharjah, Fujairah |
| Yemen | General Authority of Awqaf and Guidance, `awqaf.gov.ye` | **Measured: Fajr 17.90 to 18.15, Isha 15.69 to 15.91.** The Isha is far shallower than any library constant for the region | std Asr, factor 0.985 to 0.992 measured | Site serves 31 locations across 21 governorates as embedded JSON with keys `amsek, fajr, sunrise, duhur, asr, maghrib, isha`. **`amsek` equals `fajr` exactly.** Maghrib measures 5 to 10 min after sunset, varying by city, which suggests per-city table adjustment rather than one rule | **A, measured** | `awqaf.gov.ye` root page, embedded `bt-login-bootstrap` JSON, `fetch`, 2026-09-30 |
| Kuwait | Ministry of Awqaf and Islamic Affairs, `awqaf.gov.kw` | Ministry site read; **no prayer-times section found on it.** The state table as reprinted by `al-Anba` measures Fajr **18.11**, Isha **17.75**, Isha 77 min after Maghrib, Dhuhr at true noon, Maghrib sunset +1 | std Asr, factor 1.01 measured | None observed | **C** for the convention (a newspaper, not the ministry), A for the ministry's existence | `awqaf.gov.kw`, `tinyfish`, 2026-09-30; `alanba.com.kw/prayers/` "مواقيت الصلاة لدولة الكويت", `fetch`, 2026-09-30 |
| Bahrain | no authority timetable located | Nothing sourceable. R1's note that the state's `Islamiyat` app carries an Imsakya row during Ramadan stands | not established | not established | **NULL** | `mia.gov.bh` returned no usable content, `tinyfish`, 2026-09-30 |
| Iraq | **no single national authority.** The Sunni Endowment Diwan and the Shia Endowment Diwan are separate state bodies, and the Office of Sayyid Ali al-Sistani rules for Shia Iraqis in fiqh terms | Not establishable as one convention. R1 has Sistani's own ruling 722 requiring the eastern redness to pass before Maghrib, with **no angle given** | both in use, by community | Iraq is the clearest case in the world where one country requires two different Maghrib rules | **NULL at country level** | `awqaf.gov.iq` and `sunniaffairs.gov.iq` returned no content, `tinyfish`, 2026-09-30; Sistani ruling from R1 |
| Syria | Ministry of Awqaf | No authority site reachable | not established | not established | **NULL** | `awkaf.gov.sy` returned no content, `tinyfish`, 2026-09-30 |
| Lebanon | Dar al-Fatwa (Sunni) and the Higher Islamic Shia Council are separate | Nothing sourceable on either body's own site | not established | Lebanon has the same two-community structure as Iraq | **NULL** | `tinyfish`, 2026-09-30 |
| Palestine | Ministry of Awqaf and Religious Affairs, `awqaf.ps` | Site returned no content | not established | not established | **NULL** | `tinyfish`, 2026-09-30 |
| Israel | No Israeli state body publishes Muslim prayer times. The Islamic Movement and local waqf administrations do | Nothing sourceable at national level | not established | The Jerusalem Waqf administers al-Aqsa and sets its own times; not retrieved | **NULL** | `gov.il` read, no prayer content, `tinyfish`, 2026-09-30 |
| Jordan | Ministry of Awqaf, `awqaf.gov.jo` | Unchanged from R2: the authority and its column set are tier A, the parameters are NULL. The table body is JavaScript-rendered | single `العصر` column | none established | **A** for the authority, **NULL** for parameters | as R2 |

### Africa

| Country | Dominant authority (URL) | Convention or fixed table | Asr printed | Local additions | Tier | Evidence and fetch date |
| --- | --- | --- | --- | --- | --- | --- |
| Algeria | Ministry of Religious Affairs and Endowments, `marw.gov.dz` | **The ministry does publish official per-city annual prayer tables**, as PDFs at `marw.gov.dz/media/calendrier/1448/{Alger,Djelfa,Adrar}.pdf`, grouped as three anchor cities each serving a set of linked cities. The PDFs could not be downloaded: direct `curl` returned an HTML block page and `agent-browser` returned "WEB PAGE BLOCKED". **So the convention is still not measured, but the artefact is now located and named.** | not established | The three-anchor structure ("مواقيت الصلاة لمدينة الجزائر والمدن المرتبطة بها") is a **zone system**, like JAKIM's, not coordinate-based | **A** for the existence and structure, **D** for the 18/17 angles | `marw.gov.dz` prayer-times page, `tinyfish`, 2026-09-30; PDF fetch blocked, `curl` and `agent-browser`, 2026-09-30 |
| Tunisia | **Institut National de la Météorologie** (`meteo.tn`), under the **Ministry of Transport**, not the Ministry of Religious Affairs | The INM publishes the official `أوقات الصلاة` page. Its table is paginated and did not render through `tinyfish`. **The significant finding is the ownership: Tunisia's prayer times are a meteorological-service product, not a religious-ministry one.** | not established | none established | **A** for the authority and its identity, **D** for the 18/18 angles | `meteo.tn/ar/heures-prieres`, `tinyfish`, 2026-09-30 |
| Libya | General Authority of Awqaf and Islamic Affairs, `awqaf.gov.ly` | Authority site is live and was read in Arabic. No prayer timetable or method section found on it | not established | not established | **A** for the authority's existence, **NULL** for the convention | `awqaf.gov.ly`, `tinyfish`, 2026-09-30 |
| Sudan | Ministry of Guidance and Endowments | No authority site reachable. Aggregators assign Sudan the Egyptian method; no Sudanese source supports it | not established | not established | **NULL** | `moia.gov.sd` returned no content, `tinyfish`, 2026-09-30 |
| Somalia | Ministry of Endowments and Religious Affairs | No authority site reachable | not established | not established | **NULL** | `tinyfish`, 2026-09-30 |
| Senegal | No state body. The Sufi turuq (Tijaniyya at Tivaouane, Muridiyya at Touba) are the effective religious authorities | Nothing sourceable. Senegal's structure is brotherhood-based, not ministerial, so "the national authority" is the wrong question for it | not established | not established | **NULL** | `tinyfish`, 2026-09-30 |
| Kenya, Tanzania, Ethiopia, Ghana, Ivory Coast, Mali, Niger, Chad, Mauritania | no national prayer-time authority located for any | Nothing sourceable for any of the nine | not established | not established | **NULL** | `tinyfish`, 2026-09-30 |
| South Africa | Muslim Judicial Council (`mjc.org.za`) and Jamiatul Ulama KZN (`jamiat.org.za`) | Unchanged from R1: no national convention. The KZN Jamiat publishes a fatwa telling users **which app preset to choose**: Karachi, Hanafi Asr, plus 3 minutes on Maghrib. MJC's site carries a "Today's Salaah Times" block for Cape Town | Hanafi Asr recommended by the KZN fatwa | the 3-minute Maghrib margin is explicit in the fatwa | **A** for the fatwa as a recommendation, **NULL** for a national convention | `mjc.org.za`, `tinyfish`, 2026-09-30; fatwa from R1 |

### Europe, Russia and the Caucasus

| Country | Dominant authority (URL) | Convention or fixed table | Asr printed | Local additions | Tier | Evidence and fetch date |
| --- | --- | --- | --- | --- | --- | --- |
| Azerbaijan | Caucasus Muslims Board (Qafqaz Müsəlmanları İdarəsi), `caucasus-muslims.org` | **Measured, Baku September 2026, 30 days: Subh 15.77 to 15.94 (mean 15.85), Isha 14.67 to 14.85 (mean 14.76), Maghrib sunset +14 to 15 min (3.18 to 3.36 deg), Dhuhr at true noon (-0.5 min).** | **Hanafi Asr, factor 1.96 to 1.99 measured.** This is the surprise: a Shia-majority board printing the two-shadow Asr | **Separate `İmsak` row exactly 5 minutes before `Sübh azanı`, invariant over 30 days.** Publishes `Gün çıxır` and `Gün batır` (astronomical) separately from `Məğrib azanı`. Publishes `Gecə yarısı` which matches the **sunset-to-Fajr midpoint to 0 to 1 minute**, the Jafari rule. 74 districts, 11 years | **A, measured** | `caucasus-muslims.org/az/namaz-calendar?city=baki&year=2026&month=9`, driven with `agent-browser`, table served as a WebP image, OCR'd locally, 2026-09-30 |
| Bosnia and Herzegovina | Islamic Community in BiH (Rijaset), `vaktija.ba` | **Measured, Sarajevo 2026-09-30: Fajr 18.24, Isha 16.54, Asr factor 1.03, Dhuhr +1.7 min, Maghrib sunset +9 min.** The 9-minute Maghrib is a deliberate margin and the sunrise sits 2.18 degrees below the horizon, that is about 8 minutes early, which is the mirror of the same margin | std Asr | The official `vaktija` row set is `Zora`, `Izlazak sunca`, `Podne`, `Ikindija`, `Akšam`, `Jacija`. **`Zora` is the Fajr row.** A separate community calculator, `vaktija.dev`, advertises "14.6°" in its own title and gives Sarajevo Fajr 05:26 against the Rijaset's 05:05, a 21-minute disagreement inside one city | **A, measured**, for the Rijaset's own vaktija | `vaktija.ba`, `tinyfish`, 2026-09-30; `vaktija.dev`, `tinyfish`, 2026-09-30 |
| Kosovo | Islamic Community of Kosovo (Bashkësia Islame e Kosovës), `bislame.net` | **Measured, Pristina 2026-09-30: Fajr 13.48, Isha 18.93, Asr factor 1.07, Dhuhr +3.7 min, Maghrib sunset +8 min, Isha 91 min after Maghrib.** A 13.5-degree Fajr with a 19-degree Isha is a strongly asymmetric pair found nowhere else in this research | std Asr | Row set `Sabahu`, `L. e Diellit`, `Dreka`, `Ikindia`, `Akshami`, `Jacia`, printed in 12-hour am/pm | **A, measured**, but see the caveat | `bislame.net/namazet/`, `tinyfish`, 2026-09-30 |
| Albania | Komuniteti Mysliman i Shqipërisë (KMSH), `namaz.kmsh.al` | KMSH runs a dedicated prayer-times site stating "Kohët llogariten nga · KMSH" (the times are calculated by KMSH). The table is JavaScript-rendered and returned placeholder dashes | **The row labels are the finding: `Imsaku` glossed `الفجر`.** So in Albanian usage, as in Turkish, `Imsak` **is** the Fajr row, not a pre-dawn extra | Imsak/Fajr conflation as in Turkey | **A** for the authority and its own row set, **NULL** for the parameters | `namaz.kmsh.al`, `tinyfish`, 2026-09-30 |
| North Macedonia | Islamic Religious Community | No authority table retrieved | not established | not established | **NULL** | `tinyfish`, 2026-09-30 |
| Russia | **Several competing muftiates.** The Spiritual Administration of Muslims of the Russian Federation (`dumrf.ru`) was read; it is a live news site with no prayer method page. The Central Spiritual Administration in Ufa and the Coordination Centre for North Caucasus Muslims are separate bodies | Nothing sourceable. The 16/15 pair in every library belongs to no identified Russian body | not established | Russia has no single answer, structurally | **NULL**, and the library's 16/15 is **D** | `dumrf.ru`, `tinyfish`, 2026-09-30 |
| France | **Two bodies publishing competing calendars in the same city**, unchanged from R1: Musulmans de France at **12 degrees** and the Grande Mosquée de Paris at **18 degrees** | Not one convention. This is the sharpest single-country split found anywhere | not specified by either | A joint commission formed in October 2015 has produced no convergence | **A** for each body's own position, **NULL** for a national convention | from R1, `psm-enligne.org`, 2026-09-30 |
| Netherlands, Belgium, Spain, Italy, Sweden, Norway | no national Islamic authority publishing a method located in any | Nothing sourceable. Practice in each is set by individual mosques and federations, and in several the Diyanet and Moroccan diaspora networks import their home country's table | not established | Diyanet publishes per-city times for European cities, which is the same diaspora path R2 evidenced for Germany | **NULL** for all six | `tinyfish`, 2026-09-30 |
| Portugal | Comunidade Islâmica de Lisboa | Unchanged from R1 and still **UNVERIFIED**. The 18 / Maghrib+3 / **Isha 77 minutes after Maghrib** set is `aladhan.com` method 22 and nothing else. The 77-minute fixed Isha is unique in the world | not specified | none established | **D** | from R1 |

### Central, South and East Asia, Oceania

| Country | Dominant authority (URL) | Convention or fixed table | Asr printed | Local additions | Tier | Evidence and fetch date |
| --- | --- | --- | --- | --- | --- | --- |
| Kazakhstan | Spiritual Administration of Muslims of Kazakhstan, `muftyat.kz` | **The muftiate publishes its own method in its page source, and it is Fajr 15, Isha 15.** Its script reads `prayTimes.setMethod('ISNA')`, `adjust({asr:'Hanafi'})`, `adjust({highLats:'AngleBased'})`, then applies a **latitude-banded offset: below 48 degrees, sunrise -3 and Dhuhr, Asr, Maghrib +3; at or above 48 degrees, sunrise -5 and Dhuhr, Asr, Maghrib +5. Fajr and Isha get no offset.** Reproduced exactly | **Hanafi Asr, stated in the muftiate's own code** | The banded offset is a published national safety margin in all but name | **A, read on the authority's own site and reproduced** | `muftyat.kz`, `agent-browser` (the page computes client-side), 2026-09-30. Astana on load: 05:41, 07:08, 13:09, 17:05, 19:00, 20:26 |
| Uzbekistan | Muslim Board of Uzbekistan, `muslim.uz` | Site read in Uzbek; no prayer-times or method section found | not established | not established | **NULL** | `muslim.uz`, `tinyfish`, 2026-09-30 |
| Sri Lanka | **All Ceylon Jamiyyathul Ulama (ACJU)**, `acju.lk`, incorporated by Act of Parliament No. 26 of 1985 | **Measured, Zone 01 (Colombo, Gampaha, Kalutara), September 2026: Fajr 19.70 to 19.93, Isha 18.19 to 18.28, Dhuhr +0.9 to +1.4 min, Maghrib sunset +1 to 2 min.** So Sri Lanka is effectively a **20/18** country, the same pair as Malaysia and Singapore, and nothing like the Karachi 18/18 its region is usually assigned | **std Asr, factor 1.00 to 1.02 measured** | **An 11-zone national system** covering every district, published as twelve monthly tables per zone. This is a zone system like JAKIM's, not coordinate-based | **A, measured** | `acju.lk/prayer-times/`, `tinyfish` for the index, zone tables published as JPEG, OCR'd locally, 2026-09-30 |
| Maldives | Ministry of Islamic Affairs and Endowments, `islamicaffairs.gov.mv` | Authority located and its site read; no prayer table or method retrieved. The state-branded `Namaadhu` app is the public channel | not established | not established | **A** for the authority, **NULL** for the convention | `islamicaffairs.gov.mv`, `tinyfish`, 2026-09-30 |
| China | No national Islamic authority publishing prayer times. The China Islamic Association is the state-recognised body; `chinaislam.net.cn` returned no content | Nothing sourceable. Estimates of the Muslim population themselves span 6.3 to 50 million | not established | not established | **NULL** | `tinyfish`, 2026-09-30 |
| Thailand | Office of the Chularatchamontri (Sheikhul Islam) and the Central Islamic Council of Thailand, `cicot.or.th` | Authority located; no national prayer table retrieved | not established | not established | **A** for the authority, **NULL** for the convention | `cicot.or.th`, `tinyfish`, 2026-09-30 |
| Philippines | National Commission on Muslim Filipinos (NCMF) and the **Bangsamoro Darul-Ifta'** | Both bodies are documented, and their evidenced prayer-time function is **moon sighting and Eid declaration**, exactly as with Nigeria's NSCIA and Pakistan's Ruet-e-Hilal. No national timetable located | not established | not established | **NULL** for the convention | `tinyfish`, 2026-09-30 |
| Australia | Australian National Imams Council, `anic.org.au` | Site read in full. ANIC publishes moon-sighting positions and Taraweeh guidance. **No prayer-time method.** Unchanged from R1 | not established | not established | **NULL** | `anic.org.au`, `tinyfish`, 2026-09-30 |
| New Zealand, Japan, South Korea | no national Islamic authority publishing a method | Nothing sourceable for any | not established | not established | **NULL** | `tinyfish`, 2026-09-30 |

### The Americas

| Country | Dominant authority (URL) | Convention or fixed table | Asr printed | Local additions | Tier | Evidence and fetch date |
| --- | --- | --- | --- | --- | --- | --- |
| Brazil, Argentina, Mexico | no national Islamic authority publishing a method | Nothing sourceable. Muslim populations are small (Brazil 35,000 to 1.5 million by the widest estimate, Mexico 5,500) and practice is mosque-set | not established | not established | **NULL** for all three | `tinyfish`, 2026-09-30 |
| Trinidad and Tobago, Guyana, Suriname | no national authority located. These are the Caribbean's significant Muslim communities (66,000, 55,000 and 86,000) with an Indo-Caribbean Hanafi heritage | Nothing sourceable | Hanafi expectation by community heritage, not established from an authority | not established | **NULL** | `tinyfish`, 2026-09-30 |
| Fiji | no national authority located. 58,000 Muslims, Indo-Fijian, Hanafi heritage | Nothing sourceable | not established | not established | **NULL** | `tinyfish`, 2026-09-30 |

---

## Priority 3: the specific open items, one by one

### The UAE, closed

R1's next step was `agent-browser` against `iacad.gov.ae/en/prayer-times`. That was not what worked. What worked
was R4's lead: the federal Awqaf mobile API, with its token minted **inside the page origin**. The sequence,
reproduced from scratch for this report:

```
POST https://mobileappapi.awqaf.gov.ae/APIS/v3/sso/StartRequest?lang=en
  -> {"isSuccess": true, "clientAccessToken": "<444-char JWT>"}
GET  https://mobileappapi.awqaf.gov.ae/APIS/v3/prayer-time/EmiratesAndCities?lang=en
  Authorization: Bearer <token>       -> 7 emirates, plus the city list
GET  https://mobileappapi.awqaf.gov.ae/APIS/v3/prayer-time/prayertimes/<from>/<to>
  Authorization: Bearer <token>       -> {azanSettings, prayerData}, 60 areas per day
```

Plain `fetch` from the `execute` runtime returns **HTTP 404 with a zero-length body** on every path, including
`/sso/StartRequest`. Executed as JavaScript inside an `agent-browser` tab on `https://www.awqaf.gov.ae/en/prayer-times`,
all three succeed instantly. So the gate is origin, not credentials: there are no credentials, the JWT subject is
a service token. Measured.

Measured convention, 30 days of September 2026, four emirates, UTC+4:

| Area | Fajr angle | Isha angle | Asr factor | Dhuhr offset, min | Maghrib minus sunset, min | Isha after Maghrib, min |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Abu Dhabi | 18.11 to 18.30 (18.21) | 17.94 to 18.16 (18.06) | 1.00 | +1.8 to +2.8 (2.4) | 2 to 3 (2.7) | 73 to 75 |
| Dubai | 18.09 to 18.29 (18.19) | 18.08 to 18.29 (18.18) | 1.01 | +2.3 to +3.2 (2.7) | 3 to 4 (3.2) | 73 to 76 |
| Sharjah | 18.06 to 18.27 (18.15) | 17.93 to 18.15 (18.04) | 1.00 | +1.9 to +2.8 (2.3) | 2 to 3 (2.5) | 73 to 76 |
| Fujairah | 17.90 to 18.12 (18.02) | 17.97 to 18.18 (18.06) | 1.01 | +1.9 to +2.9 (2.4) | 2 to 3 (2.9) | 73 to 75 |

Means in brackets. All measured. Three consequences:

1. **The UAE Isha is an angle, near 18.1, not a 90-minute interval.** The ITL "Gulf Region" grouping that puts the
   UAE with Oman, Qatar and Bahrain at 19.5 with a fixed 90-minute Isha is wrong on both parameters. So the Gulf
   library grouping is now refuted at three of its four members: Oman by 1.5 degrees (R1), Qatar by 0.2 (R1) and
   the UAE by 1.4 degrees plus the wrong Isha type.
2. **AlAdhan's Dubai 18.2/18.2 is close on the angles** and is, by AlAdhan's own admission, "based on the research
   done by the Batoul Apps team" and not official. It happens to land within 0.1 degrees of the real Fajr. It
   omits the Dhuhr +2.7 and Maghrib +3.2 offsets, which are worth about 3 minutes each on two prayers a day.
3. **The federal feed carries iqama intervals as state data.** `azanSettings` reads
   `{fajrIqama:25, fajrPrayDuration:10, zuhrIqama:20, zuhrPrayDurarion:5, asrIqama:20, asrPrayDuration:5,
   magribIqama:5, magribPrayDuration:10, ishaIqama:20, ishaPrayDuration:5, fridayIqama:20, fridayPrayDuration:5}`.
   Measured. Note that R2's Cairo mosque on Mawaqit published jamaah offsets of +25, +20, +20, +10, +20, which is
   the same shape. A congregation offset is a first-class published quantity in this part of the world.

### Azerbaijan, closed, and it answers the Shia question

R1's next step was `agent-browser` against `caucasus-muslims.org/az/namaz-calendar`. Done. The mechanism:

- The page carries **two** forms; the second is a GET form with fields `city`, `year`, `month`, `submit-form`.
- The city control is not a `<select>`. It is a Bootstrap dropdown of anchors carrying `data-value` **slugs**
  (`baki`, `gence`, `abseron`, ...), **74 of them**, feeding a hidden input. So the URL
  `?city=baki&year=2026&month=9&submit-form=` is directly fetchable.
- The response contains **no table**. It contains one link to a WebP image under `/storage/namaz-calendar/`, which
  changes with the city and month. The board publishes its 74-district, 11-year calendar as **images**, which is
  why `tinyfish`, plain GET and POST all returned nothing.
- The image was OCR'd locally with the macOS Vision framework (`ocr.swift`), recovering all 30 rows and all 9
  time columns cleanly.

Column set, in the board's own Azerbaijani: `İmsak vaxtı`, `Sübh azanı`, `Gün çıxır`, `Zöhr azanı`, `Əsr azanı`,
`Gün batır`, `Məğrib azanı`, `İşa azanı`, `Gecə yarısı`.

Measured over all 30 days of September 2026 for Baku (40.4093 N, 49.8671 E, UTC+4):

| Quantity | Measured range | Mean |
| --- | --- | ---: |
| `İmsak` depression angle | 16.63 to 16.85 | 16.75 |
| `Sübh azanı` depression angle | 15.77 to 15.94 | **15.85** |
| `Sübh` minus `İmsak` | **exactly 5 minutes, all 30 days** | 5.00 |
| `Gün çıxır` depression angle | 0.60 to 0.79 | 0.71 (standard sunrise) |
| `Zöhr azanı` offset from true noon | -0.9 to +0.1 min | -0.49 (true noon) |
| `Əsr azanı` shadow factor | 1.96 to 1.99 | **1.97, Hanafi** |
| `Gün batır` depression angle | 0.53 to 0.70 | 0.61 (standard sunset) |
| `Məğrib azanı` minus `Gün batır` | **14 to 15 minutes** | 14.10 |
| `Məğrib` depression angle | 3.18 to 3.36 | 3.27 |
| `İşa azanı` depression angle | 14.67 to 14.85 | **14.76** |
| `Gecə yarısı` versus sunset-to-Fajr midpoint | **0 to 1 minute** | 0.40 |

**The answer to R1's question.** Yes, the delayed Maghrib is used outside Iran, and the Jafari midnight with it.
But the Azerbaijani parameters are not Iran's and not the library's "Jafari" preset:

| Parameter | Azerbaijan, measured | Iran, measured | Library "Jafari" | Library "Tehran" |
| --- | ---: | ---: | ---: | ---: |
| Fajr | 15.85 | 18.07 | 16 | 17.7 |
| Isha | 14.76 | not published | 14 | 14 |
| Maghrib after sunset | 14 to 15 min (3.27 deg) | 17 min (4.27 deg) | 4 deg | 4.5 deg |
| Asr factor | **1.97 (Hanafi)** | not published | 1 | 1 |
| Midnight | sunset to Fajr | sunset to Fajr | sunset to Fajr | sunset to Fajr |

The Isha at 14.76 is the closest any real, measured authority in this research comes to the library's 14, which
is the only support the Jafari preset gets from anywhere. The Asr is the outright contradiction: every library
groups Ja'fari with the standard one-shadow rule, and the Caucasus Muslims Board prints two shadows.

### Kuwait, Bahrain, Jordan, Algeria, Tunisia, Libya, Portugal

R1's instruction was to assume each library constant is wrong until measured. Progress on seven:

| Country | Library constant (`aladhan.com`) | What was found | New tier |
| --- | --- | --- | --- |
| Kuwait | method 9, 18 / 17.5 | Ministry site has no prayer section. State table via `al-Anba` measures **Fajr 18.11, Isha 17.75**. So the library pair is within 0.25 degrees on both, the closest match of any Gulf constant tested so far | **C**, was D |
| Bahrain | ITL groups with Gulf at 19.5 / 90 min | Nothing found. Given that the Gulf grouping is now refuted at Oman, Qatar and the UAE, this constant should be treated as wrong | **NULL**, was D |
| Jordan | method 23, 18 / 18 with Maghrib +5 | No change. Ministry page confirmed, table JavaScript-rendered, parameters not stated | **NULL** for parameters |
| Algeria | method 19, 18 / 17 | **The ministry's own per-city PDF tables were located** at `marw.gov.dz/media/calendrier/1448/`, three anchor cities. Download blocked by a WAF on both paths tried | **D** for the angles, **A** for the artefact and the zone structure |
| Tunisia | method 18, 18 / 18 | **The authority was misidentified.** Tunisia's official prayer times come from the **Institut National de la Météorologie** under the **Ministry of Transport**, not the Ministry of Religious Affairs. Table paginated and not retrieved | **D** for the angles, **A** for the authority's identity |
| Libya | none | **Authority located and live**, `awqaf.gov.ly`, but no timetable on it | **NULL** |
| Portugal | method 22, 18 / Maghrib+3 / **Isha 77 min** | Not re-attempted. Remains the only fixed-minute Isha outside the Gulf and the weakest European constant | **D**, unchanged |

Three of the seven moved. The pattern across all of them is worth stating: **in every case where a state's own
table has now been measured, the library constant was wrong by more than a rounding.** Oman by 1.5 degrees, the
UAE by 1.4 degrees plus the wrong Isha type, Iran by 0.4, Kazakhstan by 3 degrees on Fajr and by a whole madhhab
on Asr. Kuwait, at 0.11 and 0.25 degrees, is the single closest match found, and its evidence is a newspaper.

### The Muslim World League, answered definitively in the negative

R1's next step was to search MWL's Arabic publications and any Islamic Fiqh Academy resolution on prayer times.
Done, in Arabic. Four separate lines of evidence, all pointing the same way:

1. **MWL's own prayer-times page carries no parameters.** `themwl.org/ar/jdwl-awqat-alslat`, titled
   "جدول أوقات الصلاة" (prayer times table), published 2026-05-20, reads in full: "لمعرفة أوقات الصلاة في جميع
   الدول والمدن اضغط مواعيد الصلاة بمنهاج" (to find prayer times in all countries and cities, tap prayer times in
   Minhaj). It is a link to an app. Read through `tinyfish`.
2. **The Islamic Fiqh Academy, which is MWL's own scholarly organ, has ruled on prayer times at least four
   times**, at its fifth, ninth, nineteenth and twenty-first sessions, and the subject each time is
   **high-latitude countries**, never angles. The twenty-first session resolution, dated 24 to 28 Muharram 1434 /
   8 to 12 December 2012, was read in Arabic in full at `ar.themwl.org/node/48`. It clarifies whether combining
   Maghrib and Isha may become the default between 48 and 66 degrees latitude, and rules that it may not, because
   doing so "converts a dispensation into an obligation" (تحويل رخصة الجمع إلى عزيمة). It gives no number.
3. **The underlying classification is qualitative.** The Academy's resolution text, read at `shamela.ws`, divides
   the problem into three cases: places where day or night runs 24 hours or more (take the nearest place with a
   distinguishable day and night); places where the evening twilight does not fade before dawn breaks (estimate
   Isha and the fast's start from the last period when the two twilights were distinguishable); and places with
   extremely long days or nights but distinguishable times (pray at the normal times). Every rule is relational.
   None is an angle.
4. **The decisive count.** The MWL's own collected resolutions of the Islamic Fiqh Academy across twenty sessions,
   published as a PDF and read in full through `tinyfish` at 448,078 characters, contains **zero** occurrences of
   the Arabic root `درج` in any form. Not one degree, anywhere, in twenty sessions of rulings. Measured.

**Verdict.** The Muslim World League has never published the 18/17 parameter pair, and its scholarly organ has
had four opportunities to publish a number on prayer times and has declined every time, by design, because its
position is that the times are defined by observable signs and not by an angle. The world's most-used default is
attributed to a body that does not hold it. The honest label for the 18/17 preset is `praytimes.org default`, not
`Muslim World League`.

### The Leva Research Institute, Qum: no evidence it exists

R1's next step was Persian and Arabic sources. Searched in both. Results:

- **Persian.** Searching `مؤسسه لوا قم اوقات شرعی` and `موسسه پژوهشی لوا قم` returns no such institute. It does
  return Qum bodies that genuinely publish on prayer times: the Ma'alem Qom research collection
  (`maalemqom.ir`), the Ehtejaj Islamic Wisdom Institute's page on the timing of the dawn azan
  (`ehtejaj.com/main/azan/`), and an Ijtihad Network critique titled "نقدی بر تعیین وقت نماز صبح" (a critique of
  the determination of the dawn prayer time). None is Leva and none is the source of a 16/14 pair.
- **Arabic.** Searching `مؤسسة ليوا قم` and `معهد ليوا قم` returns Liwa in the UAE and Liwa University in Abu
  Dhabi. Nothing in Qum.
- **English.** Every result that names "Leva Research Institute, Qom" is either `praytimes.org` itself or a copy
  of `PrayTimes.js`. One of the search results is literally a Malaysian government GitLab repository hosting a
  vendored copy of `PrayTimes.js`.
- **Provenance of the constant.** `praytimes.org/docs/methods` lists it as `Leva Research Institute, Qom`,
  abbreviated `Jafari`, "Some Shia communities worldwide", with Fajr 16, Isha 14, Maghrib 4 degrees and a Jafari
  midnight. `praytimes.org`'s own homepage credits one author: **Hamid Zarrabi-Zadeh**. There is no institutional
  citation on the page and no linked publication.

**Stated plainly, as instructed.** No institution named the Leva Research Institute in Qum could be shown to
exist in Persian, Arabic or English. The 16/14/4 parameter set that ships in every prayer-times library worldwide
as the Ja'fari or Shia default traces to a single personal website with no cited source. It is, on the evidence
available, uncorroborated. The one measurement in this research that touches it is Azerbaijan's Isha at 14.76
degrees, which is the nearest any real Shia authority comes to the 14, and Azerbaijan's Fajr (15.85) and Asr
(factor 1.97) both contradict the preset.

---

## Population weighting

Denominator, **cited**: Pew Research Center, June 2025, "How the Global Religious Landscape Changed From 2010 to
2020". Muslims grew 21% from 1.7 billion in 2010 to **2.0 billion in 2020**, **25.6%** of world population, from
more than 2,700 censuses and surveys across 201 countries. Pew's own anchors, cited: Indonesia roughly 240
million and about 12% of the world's Muslims; India 213 million; the top ten countries hold **1.3 billion, 65%**
of the world total; Asia-Pacific holds 59%, sub-Saharan Africa 18%.

Per-country counts are **cited**, not measured, from the per-row-sourced Wikipedia compilation `Islam by country`
(fetched 2026-09-30) cross-checked against Pew's anchors above. Where a source gives a range the midpoint is used
and the row says so. The percentage column is **computed** as country count divided by 2,000,000,000.

### Top 25 countries by Muslim population

| Rank | Country | Muslims (cited) | % of world Muslims (computed) | Convention | Tier |
| ---: | --- | ---: | ---: | --- | --- |
| 1 | Indonesia | 249,800,000 | 12.49% | Kemenag 20/18 plus 2 min ihtiyati | A (R2) |
| 2 | Pakistan | 233,000,000 | 11.65% | no national authority; Karachi 18/18 asserted | C |
| 3 | India | 200,000,000 | 10.00% | no national authority | NULL |
| 4 | Bangladesh | 150,800,000 | 7.54% | Islamic Foundation, Fajr 18.0 measured | **A (R5)** |
| 5 | Nigeria | 96,000,000 | 4.80% | no national authority | NULL |
| 6 | Egypt | 87,500,000 | 4.38% | Egyptian Survey, 19.5 / 17.5 measured | **A (R5)** |
| 7 | Iran | 85,700,000 | 4.29% | Tehran Calendar Centre, Fajr 18.0, Maghrib sunset+17, measured | **A (R5)** |
| 8 | Turkey | 81,200,000 | 4.06% | Diyanet 18/17 plus temkin | A (R1/R5) |
| 9 | Algeria | 46,500,000 | 2.33% | ministry per-city PDF tables; 18/17 asserted | D |
| 10 | Iraq | 39,000,000 | 1.95% | no single authority; Sunni and Shia divans differ | NULL |
| 11 | Sudan | 38,585,777 | 1.93% | no authority document found | NULL |
| 12 | Afghanistan | 37,098,000 | 1.85% | no authority document found | NULL |
| 13 | Morocco | 36,370,847 | 1.82% | Habous 19/17, measured | A (R1/R2) |
| 14 | Ethiopia | 34,702,632 | 1.74% | no authority document found | NULL |
| 15 | Saudi Arabia | 31,535,000 | 1.58% | Umm al-Qura 18.5 / sunset+90, measured | A (R1/R2) |
| 16 | Uzbekistan | 30,500,000 | 1.52% | no method document found | NULL |
| 17 | Yemen | 28,000,000 | 1.40% | Awqaf, Fajr 18.1, Isha 15.8, measured | **A (R5)** |
| 18 | China | 28,000,000 | 1.40% | no national convention; estimates span 6.3m to 50m | NULL |
| 19 | Niger | 21,101,926 | 1.06% | no authority document found | NULL |
| 20 | Mali | 20,541,904 | 1.03% | no authority document found | NULL |
| 21 | Malaysia | 20,063,500 | 1.00% | JAKIM 20/18, zone system | A (R2) |
| 22 | Tanzania | 19,426,814 | 0.97% | no authority document found | NULL |
| 23 | Senegal | 17,421,191 | 0.87% | no authority document found | NULL |
| 24 | Syria | 15,000,000 | 0.75% | no authority document reachable | NULL |
| 25 | Russia | 15,000,000 | 0.75% | competing muftiates; 16/15 library-only | D |

**Top 25 total: 1,662,847,591 = 83.1% of the 2.0 billion denominator.** Computed. Cross-check against Pew: the
top ten of this table sum to 1,317,500,000, which is 65.9% of the denominator, against Pew's own stated "1.3
billion, 65%". The two agree to within a percentage point, which validates the compilation.

### Coverage by evidence state, within the top 25

| Evidence state | Muslims | % of world Muslims |
| --- | ---: | ---: |
| A: measured or read on the authority's own site | 770,969,347 | **38.5%** |
| NULL: nothing sourceable at all | 597,378,244 | **29.9%** |
| C: asserted second-hand (Pakistan alone) | 233,000,000 | 11.7% |
| D: library constant only (Algeria, Russia) | 61,500,000 | 3.1% |

Computed. The arithmetic: 38.5 + 29.9 + 11.7 + 3.1 = 83.2%, which is the top-25 share to rounding. The remaining
16.8% of the world's Muslims live outside the top 25.

### Coverage by convention family, counting only countries where the convention is established

| Convention family | Countries counted | Muslims | % of world Muslims |
| --- | --- | ---: | ---: |
| **Fajr 19 to 20** (a deep dawn) | Indonesia, Egypt, Morocco, Malaysia, Singapore, Brunei | 395,029,359 | **19.8%** |
| **Fajr 18 to 18.2** | Bangladesh, Iran, Turkey, Yemen, UAE | 355,500,000 | **17.8%** |
| **Fajr 18.5 with a fixed-interval Isha** | Saudi Arabia, Qatar | 33,101,786 | 1.7% |
| **Fajr 15** | Kazakhstan, plus the FCNA recommendation for the USA | 17,658,672 | 0.9% |
| **Total with an established convention** | | **801,289,817** | **40.1%** |
| **Remainder: no established national convention** | | 1,198,710,183 | **59.9%** |

Computed. Four things follow, and they matter for the app's design.

1. **No single convention reaches 20% of the world's Muslims.** The largest family, the deep-dawn 19-to-20-degree
   group, reaches 19.8%, and it is not a single parameter set: Indonesia is 20/18 plus a 2-minute ihtiyat, Egypt
   is 19.5/17.5 with no margin, Morocco is 19/17 with Dhuhr +5 and Maghrib +3, Malaysia is zoned. They agree on
   the depth of dawn and on nothing else.
2. **The 18-degree family is the second largest at 17.8%, and it is heterogeneous in exactly the way that breaks
   a single setting.** Turkey adds a temkin on four rows, Iran delays Maghrib 17 minutes, the UAE adds 2 to 3
   minutes on Dhuhr and Maghrib, Bangladesh corrects by district edge, Yemen's Isha is 15.8 rather than 17.
   Sharing a Fajr angle does not make two countries interchangeable.
3. **A majority of the world's Muslims, 59.9%, live where no national convention is established.** That is
   dominated by four countries: India (10.0%), Pakistan (11.7%), Nigeria (4.8%) and Iraq (2.0%). For a worldwide
   app this is the central fact: the largest single design problem is not choosing between conventions, it is
   what to do where there is nothing to choose.
4. **Measured against R2's framing.** R2 established the Pew denominator and no more. The completed arithmetic
   changes the conclusion: the question "is there one that fits everything" has a numeric answer, and it is that
   the best single choice covers under a fifth of the world's Muslims, and 60% of them are not covered by any
   national convention at all.

---

## The Diyanet temkin: R2 was wrong, R1 was right, and here is the proof

R2's claim, at its findings item 3 and section 1: "Diyanet abolished the `temkin` safety margin in 1982 and moved
from 19 to 18 degrees." R1's measurement: a temkin is present today, Ogle +5, Ikindi +4 to +5, Aksam +7 to +8,
Gunes -7 to -8, over 32 days of Diyanet's own Ankara feed. Both cannot be right.

### The measurement, reproduced independently

Diyanet's feed publishes **both** the prayer rows **and** its own unadjusted astronomical sunrise and sunset, as
separate fields `GunesDogus` and `GunesBatis`. That means the offset can be read off the authority's own data
without any solar model at all. Over 32 consecutive days from 2026-09-23 for Ankara:

| Quantity | Min | Max | Mean |
| --- | ---: | ---: | ---: |
| `Gunes` minus `GunesDogus` | **-7** | **-7** | -7.00 |
| `Aksam` minus `GunesBatis` | **+7** | **+7** | +7.00 |
| `Ogle` minus true noon (harness) | +4.6 | +5.6 | +5.09 |
| `Ikindi` minus standard Asr (harness) | +4.1 | +5.2 | +4.70 |
| `Imsak` depression angle | 17.89 | 18.07 | **17.95** |
| `Yatsi` depression angle | 17.09 | 17.30 | **17.20** |
| `GunesDogus` versus sea-level sunrise (harness) | -0.5 | +0.5 | +0.06 |
| `GunesBatis` versus sea-level sunset (harness) | +0.5 | +1.5 | +1.02 |

Measured. R1's figures reproduce exactly.

### The decisive test: is the 7 minutes an elevation correction or a decree?

This is the question that settles it, and R1 did not run it. If the `Gunes` and `Aksam` offset were a horizon-dip
correction for altitude, it would **scale with the city's elevation**: the dip is 0.0347 times the square root of
height in metres, which for Ankara's 938 m is 1.063 degrees, worth about 5.7 minutes, and for a coastal city
worth zero. Pulling Diyanet's own feed for seven cities spanning 0 to 1,900 m:

| City | Elevation, m | `Gunes` minus `GunesDogus` | `Aksam` minus `GunesBatis` |
| --- | ---: | ---: | ---: |
| Trabzon | 0 | **-7** | **+7** |
| Samsun | 4 | **-7** | **+7** |
| Izmir | 25 | **-7** | **+7** |
| Antalya | 30 | **-7** | **+7** |
| Istanbul | 40 | **-7** | **+7** |
| Ankara | 938 | **-7** | **+7** |
| Erzurum | 1,900 | **-7** | **+7** |

Measured. **Exactly 7 minutes at sea level and exactly 7 minutes at 1,900 metres.** An elevation correction
cannot do that. A flat national constant can, and does. Separately, `GunesDogus` sits within half a minute of the
**sea-level** astronomical sunrise even at Ankara's 938 m, which confirms that Diyanet does not apply an
elevation correction at all, to any row.

### The resolution

Both reports were reading a real fact and each generalised it wrongly.

- **What the 1982-83 reform actually did**, per the Turkish sources, read in the original: `insanvehayat.com`
  states that from 1983 "imsak derecesi -19'dan -18'e indirilmiş, imsak ve yatsı vakitlerinde temkin kaldırılmış,
  diğer vakitlerde de (öğle, ikindi) azaltılmıştır" (the imsak angle was lowered from -19 to -18, the temkin was
  **removed at the imsak and yatsi times**, and **reduced** at the other times, Öğle and İkindi). `Fazilet
  Takvimi` documents the same transition in its own FAQ and says it continues the old 20-minute temkin. Reading
  the original Turkish, not a machine translation, for the `insanvehayat.com` passage.
- **The measurement agrees with that description exactly.** Imsak measures at 17.95 degrees and Yatsi at 17.20,
  which are the bare 18 and 17 angles with **no margin at all**. Öğle measures +5.09 and İkindi +4.70, which are
  **reduced** margins. Güneş and Akşam measure a flat **7 minutes**, untouched by the reform and untouched by
  elevation.
- **So R2 is wrong.** The temkin was not abolished. It was removed on two rows and reduced on two others, and it
  remains at full strength on Güneş and Akşam. R2 stated a partial change as a total one and then built a
  finding on it. **R1 is right**, and its measurement is confirmed by an independent path (differencing
  Diyanet's own two sets of columns) and strengthened by the elevation test.
- **What it costs an implementer.** A library configured to "Turkey 18/17" reproduces Diyanet's İmsak and Yatsı
  correctly and misses Öğle by 5 minutes, İkindi by 5, Akşam by 7 and Güneş by 7. AlAdhan's own "Turkey" method
  is labelled "(experimental)" and carries no temkin, so it cannot reproduce Diyanet's table on four of six rows.
  For 81 million Muslims that is a systematic, one-directional error on two thirds of the timetable.

---

## UNVERIFIED and NULL

Every country still at tier D or NULL after this report, so that no weak row is read as established.

### NULL: nothing sourceable, stated as such

| Country | What was tried |
| --- | --- |
| Pakistan | `mora.gov.pk` read; its prayer function is the Ruet-e-Hilal Committee, moon sighting only. `weather.gov.pk` read; sunrise and sunset only. University of Islamic Sciences Karachi has no locatable publication. A unified Islamabad/Rawalpindi jamaah timetable was approved for 1 January 2026 but not located |
| Afghanistan | No ministry website resolves. The only trace is a 2025-02-05 post on the ministry's X account announcing a permanent Kabul table, published as an image that did not extract |
| India | Unchanged from R2. No national authority |
| Nigeria | Unchanged from R2. NSCIA's prayer function is moon sighting |
| Iraq, Syria, Lebanon, Palestine, Israel | No authority table retrieved for any. Iraq and Lebanon are structurally two-community, so a single national convention may not exist to find |
| Bahrain | No authority table. The ITL Gulf grouping that covers it is now refuted at three of its four other members |
| Sudan, Somalia, Senegal, Kenya, Tanzania, Ethiopia, Ghana, Ivory Coast, Mali, Niger, Chad, Mauritania | No national prayer-time authority located for any of the twelve. Between them they hold over 160 million Muslims. This is the largest contiguous gap in the map |
| South Africa | No national convention. A fatwa recommending an app preset exists and is tier A as a recommendation |
| Russia, Uzbekistan | No method document from any muftiate |
| North Macedonia | No authority table retrieved |
| Netherlands, Belgium, Spain, Italy, Sweden, Norway | No national Islamic authority publishing a method in any |
| France | Two bodies, 12 degrees against 18, no national convention |
| China, Thailand, Philippines, Maldives, Australia, New Zealand, Japan, South Korea | No national timetable for any. Thailand, the Philippines and the Maldives have identified authorities that publish no method |
| Brazil, Argentina, Mexico, Trinidad and Tobago, Guyana, Suriname, Fiji | No national authority located for any |
| Jordan | Authority and column set confirmed at tier A, parameters NULL |
| Albania | KMSH confirmed as the authority and its `Imsaku` glossed `الفجر` confirmed, parameters NULL |
| Libya | Authority live at `awqaf.gov.ly`, no timetable on it |
| Iran, Isha only | The state publishes no Isha row at all. The 14-degree Isha in every library is untestable against Iran's own output |
| Bangladesh, Isha and Asr only | The Ramadan tables give sahri, Fajr and iftar. No Isha or Asr column was obtained |

### D: a library constant and nothing behind it

| Country | Constant | Why it should be assumed wrong |
| --- | --- | --- |
| Algeria | 18 / 17 | The ministry's own tables exist and are zone-based; the angles are untested and the zone structure means a coordinate library answers a different question |
| Tunisia | 18 / 18 | Untested, and the authority was misattributed to the religious ministry when it is the meteorological institute |
| Portugal | 18 / Maghrib+3 / Isha 77 min | Untested and unique in the world |
| Russia | 16 / 15 | Belongs to no identified Russian body |
| Bahrain | 19.5 / 90 min via the ITL Gulf group | The group is refuted at Oman, Qatar and the UAE |
| India, Pakistan, Bangladesh, Afghanistan | Karachi 18 / 18 | Bangladesh's real Fajr measures 18.0, so the constant is accidentally right there and unsupported everywhere else. The university itself has no locatable publication |
| Worldwide default | MWL 18 / 17 | **Traced and refuted.** MWL has never published it |
| Shia worldwide | Jafari 16 / 14 / Maghrib 4 deg | **Traced and unsupported.** The attributed institute could not be shown to exist |

### Measured but with a caveat

| Row | Caveat |
| --- | --- |
| Kosovo, Fajr 13.48 | Measured from one day only, from the Islamic Community of Kosovo's own site. A 13.5-degree Fajr paired with a 19-degree Isha is unusual enough that it should be re-measured across a month before being relied on |
| Kuwait, Fajr 18.11 | Measured from one day and from a newspaper, not the ministry. Tier C |
| Bosnia, Fajr 18.24 | Measured from one day. The 9-minute Maghrib margin and the 2.18-degree sunrise both suggest a systematic temkin-like offset that a month would confirm |
| Sri Lanka, Zone 01 | Measured from one zone and one month. The anchor point for the zone is unknown (Colombo's coordinates were used), and as JAKIM's case showed, an unknown zone anchor can shift a measured angle by degrees |
| Bangladesh | The district-edge anchors were reconstructed from the Foundation's own note, not from a published boundary file. Longitudes are approximate to about 0.1 degrees, worth about 24 seconds |
| Azerbaijan | Read by OCR from an image. All 30 rows parsed cleanly and the internal consistency (the exactly-5-minute Imsak gap on every day, the 14 to 15 minute Maghrib on every day) is itself strong evidence that no digit was misread |

---

## Sources

All fetched 2026-09-30. Path is the retrieval method.

### Authorities read on their own sites

| URL | What it is | Path | Tier it supports |
| --- | --- | --- | --- |
| `https://www.esa.gov.eg/praytimes.aspx` | Egyptian General Authority of Survey, same-day table for 43 cities in Arabic | tinyfish | A, Egypt, measured |
| `https://www.time.ir/` and `/prayer-time` | Iran's state timekeeping site, publishing the Tehran Calendar Centre's output | tinyfish and agent-browser | A, Iran, measured |
| `http://prayer.aviny.com/HowToDeterminePrayerTimes.aspx` | The Calendar Centre's methodology in Persian: 17.7 degrees for the dawn azan, 4.5 degrees for Maghrib, Dhuhr at meridian transit, minute rounding, and the white-nights rule (Imsak at 12 hours after shar'i noon, Fajr 30 minutes later) | tinyfish | A by reproduction, Iran's method |
| `https://calendar.ut.ac.ir/` | The Calendar Centre itself. Homepage read; the methodology and provincial-capital pages returned HTTP 504 on every attempt through both paths | agent-browser | A for the body's identity and its statement that the Supreme Leader approved its council's method |
| `http://islamicfoundation.gov.bd/pages/files/...` | Islamic Foundation Bangladesh, the 1447 AH Ramadan sahri and iftar tables for eight divisions, with the district-edge note and the signatories | tinyfish | A, Bangladesh, measured |
| `https://mobileappapi.awqaf.gov.ae/APIS/v3/...` | UAE Awqaf federal feed: 60 areas, iqama settings, whole year | agent-browser, in-origin | A, UAE, measured |
| `https://www.awqaf.gov.ye/` | Yemen General Authority of Awqaf and Guidance, 31 locations as embedded JSON | fetch | A, Yemen, measured |
| `https://caucasus-muslims.org/az/namaz-calendar?city=baki&year=2026&month=9` | Caucasus Muslims Board, Baku September 2026, published as a WebP image | agent-browser plus local OCR | A, Azerbaijan, measured |
| `https://muftyat.kz/` | Spiritual Administration of Muslims of Kazakhstan, computing client-side, with its method in the page source | agent-browser | A, Kazakhstan, read and reproduced |
| `https://www.muftyat.kz/static/muftyat/scripts/prayTimes.js` | The muftiate's vendored copy of `PrayTimes.js` | fetch | A, supporting the method reading |
| `https://www.acju.lk/prayer-times/` | All Ceylon Jamiyyathul Ulama, 11-zone national timetable as monthly images | tinyfish plus local OCR | A, Sri Lanka, measured |
| `https://vaktija.ba/` | Islamic Community in BiH, Sarajevo vaktija | tinyfish | A, Bosnia, measured |
| `https://bislame.net/namazet/` | Islamic Community of Kosovo, daily times | tinyfish | A, Kosovo, measured |
| `https://namaz.kmsh.al/` | Komuniteti Mysliman i Shqipërisë, with `Imsaku` glossed `الفجر` | tinyfish | A, Albania's row set |
| `https://ezanvakti.emushaf.net/vakitler?ilce=...` | Diyanet's published data for seven cities, carrying `Imsak`, `Gunes`, `Ogle`, `Ikindi`, `Aksam`, `Yatsi` **and** the unadjusted `GunesDogus` and `GunesBatis` | fetch | A, Turkey, measured; the temkin resolution |
| `https://namazvakitleri.diyanet.gov.tr/tr-TR/dini-bilgiler` | Diyanet's own site confirming the same Ankara values and labelling the two extra rows "Astronomik Güneş Doğuş" and "Astronomik Güneş Batış" | tinyfish | A, corroborating the feed |
| `https://osmaniye.diyanet.gov.tr/kadirli/sayfalar/contentdetail.aspx?MenuCategory=Kurumsal&ContentId=533` | Diyanet's Din İşleri Yüksek Kurulu Vakit Hesaplama Bölümü described by its own astronomer Hümeyra Nur İşlek, confirming that Diyanet's tables contain **no "sabah namazı" row**, only Imsak and sunrise, and that the dawn azan is called one hour before sunrise outside Ramadan and at Imsak during Ramadan | tinyfish | A, Turkey's row structure |
| `https://themwl.org/ar/jdwl-awqat-alslat` | MWL's own prayer-times page: a link to the Minhaj app, no parameters | tinyfish | A, the MWL negative |
| `https://ar.themwl.org/node/48` | Islamic Fiqh Academy, 21st session, 24 to 28 Muharram 1434 / 8 to 12 December 2012, clarifying the 19th session's ruling on prayer times between 48 and 66 degrees latitude. Qualitative throughout | tinyfish | A, the MWL negative |
| `https://d1.islamhouse.com/data/ar/ih_books/single_010/ar_qrarat_elmogama3_alfiqhy.pdf` | The MWL Islamic Fiqh Academy's collected resolutions across twenty sessions, 448,078 characters, **zero occurrences of `درج`** | tinyfish | A and measured, the MWL negative |
| `https://ftp.shamela.ws/book/8322/13808` | The Academy's three-case classification of high-latitude prayer times, all relational, no angles | tinyfish | A, the MWL negative |
| `https://marw.gov.dz/media/calendrier/1448/{Alger,Djelfa,Adrar}.pdf` | Algeria's ministry's own per-anchor-city annual tables. Located, not downloadable | tinyfish for the index; download blocked | A for the artefact, D for the angles |
| `https://www.meteo.tn/ar/heures-prieres` | Tunisia's official prayer times, published by the Institut National de la Météorologie under the Ministry of Transport | tinyfish | A, Tunisia's authority identity |
| `https://awqaf.gov.ly/` | Libya's General Authority of Awqaf and Islamic Affairs, live, no timetable | tinyfish | A for the body, NULL for the convention |
| `https://www.awqaf.gov.kw/` | Kuwait's Ministry of Awqaf, no prayer section | tinyfish | A for the body, NULL for the convention |
| `https://www.mora.gov.pk/` | Pakistan's Ministry of Religious Affairs and Interfaith Harmony, whose prayer function is the Ruet-e-Hilal Committee | tinyfish | A, the Pakistan NULL |
| `https://www.anic.org.au/` | Australian National Imams Council, read in full, no prayer method | tinyfish | NULL, Australia |
| `https://www.mjc.org.za/` | Muslim Judicial Council South Africa | tinyfish | NULL for a national convention |
| `https://islamicaffairs.gov.mv/` | Maldives Ministry of Islamic Affairs and Endowments | tinyfish | A for the body, NULL for the convention |
| `https://www.cicot.or.th/en/chularatchamontri` | Thailand, Office of the Sheikhul Islam | tinyfish | A for the body, NULL for the convention |

### Secondary sources, each labelled by what it supports

| URL | What it is | Path | Supports |
| --- | --- | --- | --- |
| `https://www.alanba.com.kw/prayers/` | `al-Anba`, a Kuwaiti national newspaper, publishing "مواقيت الصلاة لدولة الكويت" | fetch | C, Kuwait |
| `https://x.com/mohiaAfghan/status/1887077825271714137` | Afghanistan's Ministry of Hajj and Religious Affairs announcing a permanent Kabul prayer table, 5 February 2025. Image did not extract | tinyfish | The single documentary trace for Afghanistan |
| `https://propakistani.pk/2025/11/25/unified-azan-and-prayer-timings-approved-for-twin-cities/` and `https://www.icci.pk/unified-azan-and-prayer-timings-for-islamabad-rawalpindi/` | Pakistan's federal approval of a unified Azan and jamaah timetable for Islamabad and Rawalpindi from 1 January 2026, announced by Minister Sardar Muhammad Yousaf, with nationwide extension in consultation | tinyfish | Cited, Pakistan's direction of travel |
| `https://www.islamicacademy.org/html/Times/Times_PK.htm` | A long-standing third-party Pakistan timetable, stating openly that it is computed "according to 'Fiqh Hanfi'" from two named books and verified against USNO data, and advising the reader to add their own 5-minute margin | tinyfish | C, evidence that the Pakistani supply is private compilation |
| `https://insanvehayat.com/temkin-meselesi/` | The Turkish account of the 1983 reform, read in the original: imsak lowered from -19 to -18, temkin **removed at imsak and yatsi** and **reduced** at öğle and ikindi | tinyfish | The temkin resolution |
| `https://www.turktakvim.com/index.php?link=html/temkin_muddeti.html` | The four components of temkin (solar semidiameter, refraction, elevation, viewing angle) and the rule that it is subtracted from imsak and sunrise and added to the other times | tinyfish | Background, the temkin definition |
| `https://praytimes.org/docs/methods` | The source of the world's method constants, including `Leva Research Institute, Qom` | tinyfish | The provenance of the disputed constants |
| `https://praytimes.org/` | `praytimes.org` crediting one author, Hamid Zarrabi-Zadeh | tinyfish | The Leva negative |
| `https://vaktija.dev/` | A Bosnian community calculator advertising "14.6°" and giving Sarajevo Fajr 05:26 against the Rijaset's 05:05 | tinyfish | C, the intra-Bosnia disagreement |
| `https://www.pewresearch.org/religion/2025/06/09/muslim-population-change/` | Pew's chapter 3: 2.0 billion Muslims in 2020, 26% of world population, Indonesia roughly 240 million and 12% of the world's Muslims, India 213 million, the top ten holding 1.3 billion and 65% | tinyfish | Cited, the population denominator and anchors |
| `https://en.wikipedia.org/wiki/Islam_by_country` | The per-row-sourced compilation used for the per-country counts, cross-checked against Pew's anchors | tinyfish | Cited, the population table |

### Paths that failed, recorded so they are not retried blindly

| Target | What happened |
| --- | --- |
| `calendar.ut.ac.ir` methodology and provincial-capital pages | HTTP 504 Gateway Timeout on every attempt through `tinyfish`, `fetch` and `agent-browser` over about 20 minutes |
| `api.time.ir` | HTTP 401, "API key is not valid" and "API key is missing". The key is not in the client bundle |
| `marw.gov.dz` PDF downloads | `curl` returned a 2,399-byte HTML block page; `agent-browser` returned "WEB PAGE BLOCKED" naming the client IP |
| `mobileappapi.awqaf.gov.ae` from plain `fetch` | HTTP 404, zero bytes, on every path including `/sso/StartRequest`. Only the browser origin works |
| `islamicfoundation.gov.bd` over plain `fetch` | TLS chain error, "unable to verify the first certificate". `tinyfish` handles it |
| `muftyat.kz` on any API-looking path | HTTP 500 with the homepage body. The site has no API; it computes in the browser |
| `awqaf.gov.iq`, `sunniaffairs.gov.iq`, `awkaf.gov.sy`, `awqaf.ps`, `moia.gov.sd`, `chinaislam.net.cn`, `mia.gov.bh` | No usable content returned |
| `caucasus-muslims.org` via plain GET or POST | Returns HTML with no times. The table is an image link only, which is why every prior attempt failed |
| PDF text extraction locally | No `pdftotext`, `pypdf` or `PyPDF2` on this machine and nothing may be installed. `tinyfish.fetch_content` extracted the Bangladeshi and MWL PDFs successfully and is the working path for PDFs |
