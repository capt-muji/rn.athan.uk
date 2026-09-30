# R9: the countries nobody had reached

**Status: RESEARCH ONLY.** This report closes what R2 and R5 left uncovered: most of Africa, the smaller European
states, and the Americas, Asia and Oceania remainder. It does not repeat any country R2 or R5 established at
tier A, except where a new measurement corrects one of theirs, and each such correction is named.

Research window 2026-09-30. Every fetch date is 2026-09-30 unless a row states otherwise. Retrieval path is named
on every fact: `tinyfish` is `tools.tinyfish.fetch_content` or `tools.tinyfish.search`; `fetch` is a direct HTTP
GET from the `execute` runtime; `agent-browser` is the CLI, used where a page was JavaScript-rendered or where a
download was blocked to plain HTTP; `OCR` is the macOS Vision framework through R5's local `pdfocr-ar.swift`.

Evidence tiers are R2's, unchanged. **A** the authority's own site, read. **B** a major national mosque or the
largest mosque network's timetable, read. **C** a local app, newspaper or academic paper. **D** a software
library's country mapping, which is a lead and not a finding. **NULL** nothing sourceable, stated as such.

Every number is marked **measured** (this report computed it), **cited** (with a URL) or **UNVERIFIED**.

Licensing and terms of use are out of scope: the owner has already corresponded with the authorities and holds
permission. Nothing below discusses it.

**Harness.** R5's solar harness at `ai/features/global-prayer-times/data/countries/solar-harness.mjs` was reused
unchanged. `validate-harness.mjs` was run first and exits 0, reproducing the Egyptian General Authority of
Survey's own published Cairo row for 2026-09-30 on all six times to the minute. No new solar code was written.

---

## Findings in one page

1. **Sweden and Norway both print a real number on every day of the year, and they use two DIFFERENT rules.** At
   Stockholm an 18-degree Fajr has no astronomical solution on **118 days**, 24 April to 19 August, and Islamiska
   Förbundet i Sverige prints a Fajr on all 365 anyway. Its summer rule is a **frozen FRACTION OF THE NIGHT**:
   holding the boundary day's fraction (0.2148, that is 1/4.66) and applying it to each day's own night reproduces
   all 118 published values to a **median 1.0 and worst 1.9 minutes**. Islamsk Råd Norge does the opposite: it
   freezes a **CLOCK TIME**, printing Fajr 03:37 unchanged for 34 days and 03:17 for 46 days while leaving its own
   `Morgengry 16°` column visibly blank. Both measured. Two neighbouring countries in the same latitude band, two
   incompatible constructions, and neither is any `highLatitudeRule` a library ships.
2. **France's 12-versus-18 split is real between the two bodies and is NOT how French mosques actually resolve.**
   Measuring **52 mosques** across six French cities through Mawaqit's keyless search, the modal Fajr angle is
   **12 degrees at 48.1%** of mosques, against **11.5% near 18**, with 28.8% in a 13-to-15 band. Musulmans de
   France's position, not the Grande Mosquée de Paris's, is what most measured French mosques print. Measured.
3. **The Grande Mosquée de Paris does not publish a fixed 18 degrees, and its own year proves it.** Inverting all
   **366 days** of the mosque's own published calendar gives a Fajr angle sweeping from **18.0 in December to 13.0
   in June**. It matches an exact 18 degrees on only **78 of the 348 solvable days**, and in June it runs up to
   **113 minutes** later than 18 degrees would give. Its Isha is not an angle at all: it is **Maghrib plus exactly
   87 minutes on 278 of 366 days**. The "Grande Mosquée de Paris uses 18 degrees" claim that R1 and R5 both carry
   is true only of the winter half of its own table. Measured.
4. **Belgium has a national authority publishing both a full annual table and its own high-latitude rule in
   writing, which R5 recorded as not existing.** The Executief van de Moslims van België, the state-recognised
   representative body, publishes `horaire_priere_emb_2026.pdf` over its Conseil des Théologiens' name. Outside
   its own declared window the table measures **Fajr 17.99, Isha 18.00, standard Asr, Maghrib sunset +2**, over 263
   days. Inside
   it, the PDF states the rule in French and Arabic on the same page, and the Arabic names the mechanism exactly:
   `التقدير النسبي لخط عرض 45`, **the relative estimate at latitude 45, from the start of May to the end of July**.
   Measured and cited.
5. **Mauritania is a clean new tier A that no library and no earlier report has.** Its Ministry of Islamic Affairs
   and Original Education publishes a per-city Ramadan imsakia. Inverting **90 city-days across three cities**
   gives **Fajr 19.37, Isha 17.46, standard Asr (factor 1.004), Dhuhr at true noon, Maghrib sunset +3**, with a
   **separate Imsak row exactly 5 minutes before Fajr on all 90 days without exception**. Measured.
6. **Algeria moves from tier D to tier A, measured, and the library constant is wrong on Fajr.** The ministry's own
   annual Algiers calendar, 135 days OCR'd from `marw.gov.dz`, measures **Fajr 17.91, Isha 17.09, Asr factor
   1.005, Dhuhr +0.6 min, Maghrib sunset +4**. The `aladhan.com` method-19 constant of 18/17 is 0.09 low on Fajr
   and close on Isha, but the ministry's real Maghrib margin of 4 minutes is absent from every library. Measured.
7. **Tunisia's Institut National de la Météorologie prints only FIVE rows and no sunrise at all.** Its year-round
   day view gives `AL SOBH`, `AL DHOHR`, `AL ASR`, `AL MAGHREB`, `AL ICHA`. A single Tunis row measures Fajr
   18.06 / Isha 18.10, and the INM's own Ramadan 1446 Tunis imsakia measures the Imsak column at **20.06 degrees**
   over 30 days. So the INM's imsak is 2 degrees deeper than its year-round Sobh, which is a separate row and not
   the same quantity. Measured.
8. **South Africa's largest published national timetable contradicts the fatwa its own ulama bodies issue.** The
   Muslim Judicial Council's Cape Town month measures **Fajr 17.96, Isha 16.99, Asr factor 0.989, Maghrib at plain
   sunset**, that is 18/17 with a STANDARD Asr and no margin. Jamiatul Ulama KZN's published fatwa tells users to
   set Karachi, **Hanafi Asr, plus 3 minutes on Maghrib**. Those are 45 to 60 minutes apart on Asr in the same
   country. Measured against cited.
9. **Nine African countries resolve to "mosques compute, nobody decrees", and the measurement is Egyptian-family
   rather than anything local.** Where a mosque timetable could be measured at all, Libya reads 18.51/18.33,
   Somalia 18.04/17.10, Tanzania 18.02/16.96, Chad 17.88/17.05, Ghana 17.86/17.02, Kenya 17.82/18.11. These are
   18-degree computations from international software, not national conventions, and each rests on one or two
   mosques. Tier B at best and stated as such.
10. **Nigeria stays NULL at country level on a second, harder attempt, and the reason is now documented rather than
    assumed.** NSCIA publishes moon sighting and no timetable, confirmed again. Of six Nigerian mosques on
    Mawaqit, **five fail a solar sanity gate** because their published Dhuhr sits 20 to 40 minutes after true noon,
    which is a congregation schedule and not a computed table. The one survivor reads ISNA 15/15. Nigeria, the
    fifth-largest Muslim population on earth, has neither a national convention nor a measurable mosque consensus.
11. **Norway publishes BOTH Asr columns and names BOTH twilight angles in its own headers, which is the most
    self-documenting authority table in the whole programme.** IRN's thirteen columns include `Morgengry 16°`,
    `Fajr slutt`, `1x-skygge`, `2x-skygge` and `Kveldsgry 15°`. Inverting the filled days gives the named columns
    at **16.08 and 14.93 degrees**, matching their own printed labels, and the two Asr columns sit **18 to 80
    minutes apart, never identical on any of 365 days**. Measured.
12. **Bosnia is re-measured over a year and R5's single-day figures move.** Sampling 41 days across 2026 from the
    Rijaset's own keyless `api.vaktija.ba` gives **Fajr 18.01** (R5 said 18.24), **Isha 15.89** (R5 said 16.54),
    **Maghrib sunset +6** (R5 said +9) and **sunrise 1.71 degrees** (R5 said 2.18). R5's day was inside the
    ordinary scatter on Fajr but 0.65 degrees out on Isha, which is what a one-day measurement costs.
13. **Two European countries are Diyanet by supply chain, not by their own convention.** The Netherlands' largest
    mosque network, Islamitische Stichting Nederland, links from its own homepage straight to
    `namazvakitleri.diyanet.gov.tr` for The Hague. Strasbourg's measured mosque cluster reads **17.9 Fajr with a
    7-to-9 minute Maghrib margin**, which is the Diyanet temkin signature R5 established, inside France.
14. **Sixteen countries remain NULL after this report, and for most of them the finding is structural.** China,
    Thailand, the Philippines, New Zealand, Mexico, Trinidad and Tobago, Guyana, Fiji, Sudan, Ethiopia, Niger,
    Ivory Coast, Mali and North Macedonia produced no authority table and, in most cases, no measurable mosque
    timetable either. What was searched is listed by name in the UNVERIFIED and NULL section.

---

## Country table, by region

Read the tier column before the convention column. `std Asr` is the one-shadow rule, `Hanafi Asr` the two-shadow
rule. Where the tier is B, the number describes what mosques print, not what a state decreed. Where it is D or
NULL the convention column is a lead and not a finding.

### Africa

| Country | Dominant authority (URL) | Convention or fixed table | Asr printed | Local additions | Tier | Evidence and fetch date |
| --- | --- | --- | --- | --- | --- | --- |
| **Mauritania** | Ministry of Islamic Affairs and Original Education, `affairesislamiques.mr` | **Measured over 90 city-days: Fajr 19.25 to 19.49 (median 19.37), Isha 17.34 to 17.60 (median 17.46), Dhuhr at true noon (+0.2 min), Maghrib sunset +3, Isha 66 to 69 min after Maghrib so it is an ANGLE not an interval** | **std Asr, factor 0.998 to 1.010 measured** | **A separate `الإمساك` row exactly 5 minutes before `الفجر`, invariant on all 90 days.** Published as one page per wilaya city; seven time columns | **A, measured** | `affairesislamiques.mr/?q=im` then the ministry's own `RAMADANE 2025 2_merged_compressed.pdf`, `tinyfish` for the index, `agent-browser` for the download, local OCR for the tables, 2026-09-30. Cities: Rosso, Nouadhibou, Néma |
| **Algeria** | Ministry of Religious Affairs and Endowments, `marw.gov.dz` | **Measured over 135 days of the ministry's own Algiers annual calendar: Fajr 17.80 to 18.01 (median 17.91), Isha 17.00 to 17.20 (median 17.09), Dhuhr +0.6 min, Maghrib sunset +4, Isha 77 to 102 min after Maghrib** | **std Asr, factor 1.003 to 1.013 measured** | **A three-anchor ZONE system**, not coordinates: `الجزائر`, `الجلفة` and `أدرار` each serve a set of "linked cities". The ministry also prints a **`القبلة` (qibla) column** beside `الزوال` | **A, measured**, upgraded from R5's D | `marw.gov.dz/مقالات-ودراسات/مواقيت-الصلاة` for the index, `tinyfish`; the `1448/Alger.pdf` calendar OCR'd locally, 2026-09-30 |
| **Algeria, mosque practice** | 19 mosques in Algiers and Oran on Mawaqit | Measured: Fajr median **17.71**, Isha median **17.43**, Maghrib sunset +4 | std Asr, 0 of 19 Hanafi | Mosque practice tracks the ministry's own Maghrib +4 margin, which is the strongest corroboration of the ministry measurement | **B, measured** | `mawaqit.net/api/2.0/mosque/search`, `fetch`, 2026-09-30 |
| **Tunisia** | **Institut National de la Météorologie**, `meteo.tn`, under the **Ministry of Transport** | Year-round Tunis row measures **Fajr 18.06, Isha 18.10, Asr factor 1.003, Dhuhr +6.7 min, Maghrib sunset +3**. The INM's own Ramadan 1446 Tunis imsakia measures its **Imsak column at 19.88 to 20.18 degrees (median 20.05) over 30 days**, with iftar at sunset +2 | std Asr, factor 1.003 measured | **The table prints FIVE rows and NO sunrise at all**: `AL SOBH`, `AL DHOHR`, `AL ASR`, `AL MAGHREB`, `AL ICHA`. R5's finding that the authority is meteorological, not religious, is confirmed on the page's own masthead | **A, measured** for Tunis, upgraded from R5's D | `meteo.tn/fr/heures-prieres`, `agent-browser` (the table needs the Drupal form), 2026-09-30; the INM's `imsakia Tunis .pdf` OCR'd locally |
| **Tunisia, mosque practice** | 9 Tunis mosques on Mawaqit | Measured: Fajr **18.06** on 6 of 9, Isha median **17.91** | std Asr, 0 of 9 Hanafi | Mosque practice matches the INM row to 0.00 degrees on the modal value | **B, measured** | `mawaqit.net/api/2.0/mosque/search`, `fetch`, 2026-09-30 |
| **South Africa** | **Muslim Judicial Council**, `mjc.org.za`, for Cape Town. No national body | **Measured over the MJC's own published September 2026 month: Fajr 17.88 to 18.07 (median 17.96), Isha 16.87 to 17.08 (median 16.99), Dhuhr at true noon, Maghrib at PLAIN SUNSET (0 min)** | **std Asr, factor 0.982 to 0.995 measured.** This directly contradicts the KZN Jamiat fatwa | The MJC's own page says "Please confirm congregational times with your local Masjid". Jamiat SA publishes **both Asr columns** and names MWL 18/17 as "used by SANHA and most South African Ulama bodies" | **A, measured**, for the MJC's Cape Town table; **NULL** for a national convention | `mjc.org.za/salaah-times/`, `tinyfish`, 2026-09-30; `jamiatsa.org/tools/salaah-times.html` and `jamiat.org.za/hanafi-settings-for-salaah-apps/`, `tinyfish`, 2026-09-30 |
| **Libya** | General Authority of Awqaf and Islamic Affairs, `awqaf.gov.ly` | Authority site read again in Arabic and its Telegram channel read: it states it works "على اعتماد مواقيت الصلاة وضبطها" (on adopting and regulating prayer times) but publishes no table. **2 Tripoli mosques measure Fajr 18.51, Isha 18.33, Maghrib sunset +4** | std Asr, factor 0.995 measured | none established | **A** for the authority's existence and its stated remit, **B, measured** for mosque practice, **NULL** for a national convention | `awqaf.gov.ly` and `t.me/s/awqaflibya`, `tinyfish`, 2026-09-30; mosque rows `fetch`, 2026-09-30 |
| **Senegal** | **No state body.** CERFI (`cerfi.sn`) publishes a Dakar timetable; the Sufi turuq at Tivaouane and Touba are the effective religious authorities | CERFI's Dakar row measures **Fajr 19.04, Isha 15.56, Dhuhr +1.2 min, Maghrib sunset +1**, with a **separate `Suba` row measuring 15.42 degrees**, 15 minutes after `Fajr` | std Asr, factor 1.012 measured | **Senegal prints TWO dawn rows under Wolof names**: `Fajr` then `Suba`, plus `Tisbar`, `Takusan`, `Timis`, `Guewe` for the other four. A Wolof-labelled row set that no library or app expresses | **C** for CERFI, **NULL** for a national authority | `cerfi.sn`, `tinyfish`, 2026-09-30 |
| **Senegal, mosque practice** | 11 Dakar and Touba mosques on Mawaqit | **10 of 11 fail the solar sanity gate**: published Dhuhr runs 43 to 75 minutes after true noon. The survivor reads Fajr 18.08, Isha 17.01 | 4 of 11 print a Hanafi Asr before filtering | This is the clearest case in the report of mosques publishing congregation times in the calculation fields | **B, and weak** | `fetch`, 2026-09-30 |
| **Somalia** | Ministry of Endowments and Religious Affairs, no site resolves | 1 Mogadishu mosque measures **Fajr 18.04, Isha 17.10, Dhuhr at true noon, Maghrib at plain sunset** | std Asr, factor 1.006 measured | Somaliland's own Ministry of Religion and Endowments publishes a **regional Eid prayer schedule** by gobol, cited, which is a jamaah table not a daily one | **B, one mosque**; **NULL** for a national convention | `fetch`, 2026-09-30; Somaliland Eid schedule at `hadhwanaagnews.ca`, `tinyfish`, 2026-09-30 |
| **Kenya** | SUPKEM, `supkem.org`, the umbrella body of all Muslim organisations | **SUPKEM's own site was read in full and has no prayer-time section.** Its named services are marriage registration, halal certification, study letters, employment referral, pilgrimage and membership accreditation. 1 Nairobi mosque measures **Fajr 17.82, Isha 18.11** | std Asr, factor 0.992 measured | Jamia Mosque Nairobi publishes a Ramadan timetable; its page did not yield values | **A** for the authority's existence and the absence of a timetable on it, **B, one mosque**; **NULL** for a convention | `supkem.org/en`, `tinyfish`, 2026-09-30; `jamiamosque.co.ke`, `tinyfish`, 2026-09-30; mosque row `fetch` |
| **Tanzania** | BAKWATA, `bakwata.or.tz`, established 1968, the state-recognised council | **`bakwata.or.tz` returned empty content through `tinyfish` on every attempt.** 1 Dar es Salaam mosque measures **Fajr 18.02, Isha 16.96** | std Asr, factor 0.994 measured | BAKWATA's evidenced public function is Hijri month and Eid declaration, the same pattern as Nigeria's NSCIA | **A** for the body, **B, one mosque**; **NULL** for a convention | `bakwata.or.tz`, `tinyfish`, empty, 2026-09-30; mosque row `fetch` |
| **Ghana** | Office of the National Chief Imam | No timetable located. 1 Accra mosque measures **Fajr 17.86, Isha 17.02, Asr factor 1.000, Maghrib at plain sunset** | std Asr measured | none established | **B, one mosque**; **NULL** for a convention | `fetch`, 2026-09-30 |
| **Chad** | Conseil Supérieur des Affaires Islamiques | No timetable located. 1 N'Djamena mosque measures **Fajr 17.88, Isha 17.05** | std Asr, factor 1.009 measured | none established | **B, one mosque**; **NULL** for a convention | `fetch`, 2026-09-30 |
| **Sudan** | Ministry of Religious Affairs and Endowments; the **Islamic Fiqh Academy (مجمع الفقه الإسلامي)** is the body that approves the national imsakia | **The Fiqh Academy is documented as "الجهة الرسمية لإصدار واعتماد إمساكية رمضان" (the official body for issuing and approving the Ramadan imsakia) and warns other parties against issuing one without reference to it.** No table was located. The single Khartoum mosque row failed the solar sanity gate | not established | The existence of a single decreed national authority for the imsakia is itself new: R5 recorded Sudan as no authority found | **C** for the Academy's role, **NULL** for the convention | `alrakoba.net`, `newspaper.sudafax.com` and `t.me/s/SNewsNetWork`, `tinyfish`, 2026-09-30; `moia.gov.sd` still unreachable |
| Ethiopia | Ethiopian Islamic Affairs Supreme Council, `ethiopianmajlis.org.et`, reinstated by decree 1207/2020 | **Site read in full; no prayer-time section.** No mosque on Mawaqit returned usable times for Addis Ababa | not established | none established | **A** for the authority, **NULL** for the convention | `ethiopianmajlis.org.et`, `tinyfish`, 2026-09-30 |
| Mali | Haut Conseil Islamique du Mali | No timetable located. **9 of 10 Bamako mosques fail the solar sanity gate** (Dhuhr 23 to 83 minutes after true noon). Survivor reads 15.04/15.01 | not established | none established | **NULL** | `fetch`, 2026-09-30 |
| Niger | Association Islamique du Niger | No timetable located. **Both Niamey mosques fail the sanity gate outright**, one with a Dhuhr 360 minutes off true noon, which is a broken timezone setting in the mosque's own record | not established | none established | **NULL** | `fetch`, 2026-09-30 |
| Ivory Coast | COSIM, Conseil Supérieur des Imams | No timetable located. Both Abidjan mosques fail the sanity gate (Maghrib +22 min, Dhuhr +54 and +84 min) | Hanafi Asr on both, but from unusable rows | none established | **NULL** | `fetch`, 2026-09-30 |
| **Nigeria** | NSCIA, `nscia.com.ng`, re-attempted | **Still NULL, and the second attempt adds a reason rather than a repeat.** NSCIA's 2026 activity is a national prayer gathering and Hijri declaration. Of 6 Nigerian mosques, **5 fail the solar sanity gate** with Dhuhr 20 to 40 minutes after true noon. The one survivor reads **Fajr 15.02, Isha 15.01, std Asr**, that is ISNA | not established nationally | A third-party site, `prayertimesnigeria.com`, claims LGA-level coverage of all 774 LGAs and "internationally recognized methods validated by Islamic scholars in Nigeria", naming no method and no scholar | **NULL** at country level | `nscia.com.ng`, `thecable.ng`, `punchng.com`, `tinyfish`, 2026-09-30; `prayertimesnigeria.com`, `tinyfish`; mosque rows `fetch` |

### Europe beyond what R2 and R5 covered

| Country | Dominant authority (URL) | Convention or fixed table | Asr printed | Local additions | Tier | Evidence and fetch date |
| --- | --- | --- | --- | --- | --- | --- |
| **Belgium** | **Executief van de Moslims van België / Exécutif des Musulmans de Belgique**, `emb-net.be`, the state-recognised representative body, through its **Conseil des Théologiens** | **Measured over 263 days outside its own declared window: Fajr 17.87 to 18.11 (median 17.99), Isha interquartile 17.95 to 18.03 (median 18.00, with one outlier at 15.12 on the window's own edge), Dhuhr at true noon, Maghrib sunset +2, Asr factor 1.008.** Inside the window the table is NOT an angle, see below | **std Asr, factor 0.995 to 1.038 measured** | **Three things no other authority in this programme publishes together.** (1) A **stated high-latitude rule on the same page as the times**, in French, Dutch and Arabic. (2) **Eighteen named per-city offsets in minutes**: Gent +3, Hasselt -4, Liège -5, Luxembourg -6, Mons +2, Namur -2, Renaix +3, Tournai +4, Verviers -6, Brugge +5, Kortrijk +5, Aalst +1, Maastricht -5, Houthalen -4, Oostende +6, Genk -4, Weert -5, Lokeren +2. (3) A **standing permission to combine**: "le regroupement avancé `jam'ou taqdîm` de ces prières du maghreb et d'al-'ichâ est permis" during the window | **A, measured**, and new: R5 recorded Belgium as NULL | `emb-net.be/nl/gebedstijden` for the index, `tinyfish`; `horaire_priere_emb_2026.pdf` retrieved with `agent-browser` (plain HTTP download is blocked) and read with local PDFKit, 348 of 365 days parsed, 2026-09-30 |
| **Belgium, the summer rule** | the same PDF | **The EMB freezes a CLOCK TIME, not an angle and not a fraction.** Fajr is printed 03:24 unchanged from 10 May to 30 May, 03:08 from 16 to 23 June and 03:24 again from 10 July to 1 August. Isha is 23:26 for 20 days, 00:07 for 7 and 23:33 for 16. At Brussels an 18-degree Fajr has no solution on **47 days**, 27 May to 17 July, and the EMB prints a Fajr on every one. **25 days in the window carry an 'Icha printed AFTER MIDNIGHT**, up to 00:07 | unchanged | Its Arabic text names the mechanism as `التقدير النسبي لخط عرض 45`. Testing that literally, computing at latitude 45 with Brussels's longitude, leaves a **median 20.9-minute error on Fajr**, so the printed values are not a plain latitude-45 substitution. A latitude-46 substitution fits best at **median 10.7 minutes**, which is still not a reproduction. **The stated rule does not reproduce the printed table, and that gap is the finding** | **A** for the stated rule, **measured** for the actual behaviour | as above |
| **France, the national question** | **No national authority.** Musulmans de France at 12 degrees and the Grande Mosquée de Paris publish competing calendars, unchanged from R1 | **Measured across 52 mosques in Paris, Marseille, Lyon, Lille, Toulouse and Strasbourg: 48.1% print a Fajr at or near 12 degrees, 28.8% between 13 and 15, 11.5% near 18, 9.6% between 16 and 17.** Whole-sample Fajr median **14.25**, Isha median **13.70** | **std Asr, median factor 1.011; 0 of 52 print a Hanafi Asr** | The clustering is by city, not national. Marseille and Lille are almost uniformly 12 to 13; Lyon sits at 14.25; Strasbourg splits between a 12-degree group and a **17.9-degree group with a 7-to-9 minute Maghrib margin**, which is the Diyanet temkin signature | **B, measured**, across 52 mosques; **NULL** for a national convention | `mawaqit.net/api/2.0/mosque/search?lat=&lon=`, keyless, `fetch`, 2026-09-30 |
| **France, Grande Mosquée de Paris** | `grandemosqueedeparis.fr`, published through `mawaqit.net/fr/m/grande-mosquee-de-paris` | **Its own 366-day calendar measured. The Fajr angle is NOT fixed: December and January median 17.86, February 16.33, June 13.05, back to 17.61 by mid-October. Whole-year range 13.03 to 18.10.** It matches an exact 18 degrees on only **78 of 348 solvable days**, and in June sits **75 to 113 minutes** later than 18 degrees. **Isha is Maghrib + exactly 87 minutes on 278 of 366 days**, stretching to 85 to 101 only in October to December | **std Asr, factor 0.981 to 1.028 measured** | **Dhuhr is +5 minutes for most of the year and +0.6 to +1.7 in October to December**, so even the mosque's own Dhuhr offset changes mid-year. 18 days in June have no 18-degree solution at all and the mosque prints 03:50 to 03:55 through them | **A, measured**, for the mosque's own published year | `mawaqit.net/fr/m/grande-mosquee-de-paris`, `confData` object extracted with `agent-browser` (plain fetch returns a 650-byte shell), 2026-09-30. Saved at `data/countries/fr-gmparis-mawaqit.json` |
| **Sweden** | **Islamiska Förbundet i Sverige**, `islamiskaforbundet.se`, publishing a full year for **112 Swedish cities** | **Measured over 365 days for Stockholm, Malmö and Kiruna. On the days a deep angle is solvable: Fajr 17.96 at Stockholm and 17.98 at Malmö, Isha 15.92 and 15.89. So Sweden is 18 / 16, not 18 / 17** | not separately published; a single Asr column | Row set `Fajr`, `Shuruk`, `Dhohr`, `Asr`, `Magrib`, `Isha`. **No Imsak row.** The city list runs to Kiruna, Gällivare, Jokkmokk, Haparanda and Pajala, all above or at the Arctic Circle | **A, measured** | `islamiskaforbundet.se/bonetider/`, driven month by month with `agent-browser` (a WordPress admin-ajax widget, nothing renders without a browser), 2026-09-30 |
| **Sweden, the summer rule** | the same table | **IFiS prints a Fajr and an Isha on all 365 days. At Stockholm an 18-degree Fajr has no solution on 118 days (24 April to 19 August); at Malmö 94 days; at Kiruna 166 days.** The rule is a **frozen FRACTION OF THE NIGHT**. Holding the boundary day's fraction and applying it to each day's own night reproduces the printed Fajr to **median 1.0 / worst 1.9 minutes at Stockholm** and **median 0.5 / worst 1.2 at Malmö**, and the Isha to median 1.6 and 1.3 | unchanged | **The fractions are the authority's own, not a library's**: Stockholm Fajr 0.2148 (1/4.66) and Isha 0.1923 (1/5.20); Malmö 0.2159 and 0.1919. A plain one-seventh rule is **29 to 31 minutes out** and a midnight rule 110 to 120 minutes out. **Kiruna is NOT covered by the same rule**: the frozen fraction leaves a median 23.5 and worst 89.3 minutes there | **A, measured** | as above |
| **Norway** | **Islamsk Råd Norge**, `bonnetid.no`, the public face of IRN's `Felles bønnetid` standardisation project, per kommune | **Measured over 365 days for Oslo. IRN NAMES ITS OWN ANGLES IN ITS COLUMN HEADERS and the headers are accurate: `Morgengry 16°` inverts to 15.99 to 16.15 (median 16.08) and `Kveldsgry 15°` to 14.85 to 15.01 (median 14.93). Maghrib is sunset +4 (range 3 to 6)** | **BOTH printed: `1x-skygge` and `2x-skygge`, side by side, 18 to 80 minutes apart, never identical on any of 365 days.** Measured factor 0.993 and 1.988 | **Thirteen columns**: `Dato`, `Dag`, `Morgengry 16`, `Fajr`, `Fajr slutt`, `Duhr`, `Asr`, `1x-skygge`, `2x-skygge`, `Maghrib`, `Isha`, `Kveldsgry 15`, `Midnatt`. **`Fajr slutt` (the END of the Fajr window) is a first-class column**, which nothing else in this programme publishes | **A, measured** | `bonnetid.no`, driven with `agent-browser`; `api.bonnetid.no` refuses a bare fetch with "Authentication credentials were not provided", so the rendered page is the only keyless path, 2026-09-30 |
| **Norway, the summer rule** | the same table | **IRN leaves its own `Morgengry 16°` cell BLANK on 136 days (1 May to 31 July) and `Kveldsgry 15°` blank on 162 days (1 April to 31 August), while still printing a Fajr and an Isha on all 365.** The substitute is a **frozen CLOCK TIME**: Fajr 03:37 held for 34 days (12 April to 15 May) and 03:17 for 46 days (13 July to 27 August). The value carried across the boundary is the last angle-derived one: 4 April prints 03:37 with the column filled, 5 April prints 03:37 with it blank | unchanged | This is the classic `Aqrab al-Ayyam` (nearest day) rule, applied as a clock time. A one-seventh construction is **median 17.2 and worst 81.2 minutes out**; a frozen fraction of the night is **median 11.1 and worst 42.7 out**. Neither reproduces it | **A, measured** | as above |
| Netherlands | **No national convention.** CMO (`cmoweb.nl`) is the state-recognised interlocutor for 380 mosques; **its site has no prayer-time section**. The largest network, Islamitische Stichting Nederland (`isndiyanet.nl`), is Diyanet's Dutch arm | **17 Dutch mosques measured: Fajr median 17.86 but bimodal, with a 15.68 first quartile; Isha median 15.78.** So the Netherlands splits between an 18-degree group and a 15-to-16-degree group | std Asr, 1 of 17 Hanafi | **ISN links from its own homepage straight to `namazvakitleri.diyanet.gov.tr/en-US/13977/prayer-time-for-den-haag`**, which is direct evidence of the diaspora path R2 evidenced for Germany. A separate Dutch project, `waqti.nl`, states it rejects fixed angles in favour of "werkelijke observatie" | **A** for CMO's standing and the absence of a timetable on it, **B, measured** for mosques; **NULL** for a national convention | `cmoweb.nl` and `isndiyanet.nl`, `tinyfish`, 2026-09-30; `waqti.nl`, `tinyfish`; mosque rows `fetch` |
| Spain | **Comisión Islámica de España**, `comisionislamica.org`, the state-recognised body. It announces Ramadan; **no timetable located on its site** | **17 Madrid and Barcelona mosques measured: Fajr median 17.95 with a tight 17.90 first quartile, Isha median 17.05.** Spain is the most internally consistent 18/17 country measured in this report | std Asr, 1 of 17 Hanafi | The Madrid M-30 mosque and Barcelona's CCIB publish their own Ramadan calendars, cited | **A** for the body's standing, **B, measured** for the 18/17 practice; **NULL** for a decreed convention | `comisionislamica.org`, `tinyfish`, 2026-09-30; mosque rows `fetch` |
| Italy | **UCOII**, `ucoii.org`, founded 1990, coordinating communities in all 20 regions. It advertises "Orari Preghiera" but serves them through a WhatsApp assistant, not a page | **8 Rome and Milan mosques measured: Fajr median 17.99 with a 17.98 first quartile, Isha median 17.07.** So Italy is 18/17 in practice | std Asr, 0 of 8 Hanafi | **The Grande Moschea di Roma's own domain, `grandemoscheadiroma.org`, has been taken over by a Turkish gambling site** and no longer serves prayer times. Recorded so it is not retried | **B, measured**; **NULL** for a national convention | `ucoii.org`, `tinyfish`, 2026-09-30; `grandemoscheadiroma.org` hijacked, `tinyfish`, 2026-09-30; mosque rows `fetch` |
| North Macedonia | Islamic Religious Community | No authority table retrieved. **All 3 Skopje mosques fail the solar sanity gate** | not established | none established | **NULL**, unchanged from R5 | `fetch` and `tinyfish`, 2026-09-30 |
| **Bosnia and Herzegovina** | Islamic Community in BiH (Rijaset), through `api.vaktija.ba` | **Re-measured over 41 days sampled across all of 2026, correcting R5's single day: Fajr 17.92 to 18.10 (median 18.01), Isha 15.79 to 16.04 (median 15.89), Dhuhr +1.1 min, Maghrib sunset +6, sunrise 1.71 degrees below the horizon** | **std Asr, factor 0.977 to 1.015 measured** | The Rijaset serves **every one of its locations for any date** through a keyless JSON endpoint, `api.vaktija.ba/vaktija/v1/<id>/<y>/<m>/<d>`, with `vakat` as `[Zora, Izlazak sunca, Podne, Ikindija, Akšam, Jacija]`. At 43.9 N an 18-degree Fajr is solvable on **0 days out of 41 sampled being unsolvable**, so no high-latitude rule is engaged | **A, measured**, correcting R5 | `api.vaktija.ba`, `fetch`, 2026-09-30 |
| Kosovo | Islamic Community of Kosovo, `bislame.net` | **R5's one-day figures reproduce EXACTLY: Fajr 13.48, Isha 18.93, Asr factor 1.074, Dhuhr +3.7 min, Maghrib sunset +8, Isha 91 min after Maghrib.** The site serves today only; `?date=` and `?data=` query parameters are ignored, so a month could not be obtained | std Asr, factor 1.074 measured | Row set `Sabahu`, `L. e Diellit`, `Dreka`, `Ikindia`, `Akshami`, `Jacia`, in 12-hour am/pm | **A, measured**, one day, **caveat carried forward from R5** | `bislame.net/namazet/`, `tinyfish` and `fetch`, 2026-09-30 |

### Asia, Oceania and the Americas

| Country | Dominant authority (URL) | Convention or fixed table | Asr printed | Local additions | Tier | Evidence and fetch date |
| --- | --- | --- | --- | --- | --- | --- |
| Australia | ANIC, `anic.org.au`, publishes no method (R5). The Lebanese Muslim Association, `lma.org.au`, runs Lakemba, Australia's largest mosque | **3 Sydney and Melbourne mosques measured: Fajr 17.93 to 18.05, Isha 15.04 to 18.06** | **1 of 3 prints a Hanafi Asr (factor 1.983)**, so Australia's diaspora split shows in the Asr column | The LMA publishes **separate adhan and iqamah columns** for every prayer, cited: Dhuhr 11:52 then 12:02, Asr 3:21 then 3:31, Maghrib 5:54 then 6:00, Isha 7:24 then a later jamaah | **B, measured**; **NULL** for a national convention, unchanged from R5 | `lma.org.au/mosques-imams`, `tinyfish`, 2026-09-30; mosque rows `fetch` |
| Japan | no national authority | 1 Tokyo mosque measures **Fajr 17.92, Isha 17.06, Asr factor 1.023** | std Asr | none established | **B, one mosque**; **NULL** | `fetch`, 2026-09-30 |
| South Korea | no national authority | 1 Seoul mosque measures **Fajr 17.95, Isha 17.98, Asr factor 2.023** | **Hanafi Asr, measured** | The single measurable Korean mosque prints the two-shadow Asr, consistent with a South and Central Asian congregation | **B, one mosque**; **NULL** | `fetch`, 2026-09-30 |
| Thailand | **Office of the Chularatchamontri (Sheikhul Islam)**, `skthai.org`, which **does publish per-province times for all 77 provinces** | **The province index page was reached and its 77-province structure read. The per-province tables sit behind Cloudflare and returned a 5xx landing page through `agent-browser`, so no values were obtained.** Third-party Thai sites (`salamthailand.com`, `prayertimes.muslimthaipost.com`, `whitechannel.tv`) all attribute their times to the Chularatchamontri's office and all render client-side | not established | **The Thai row set, from the attributing sites, is `อิมซาก` (Imsak), `ซุบฮิ` (Fajr), `ตะวันขึ้น` (Sunrise), `ซุฮฺริ`, `อัศริ`, `มัฆริบ`, `อีชา`. So Thailand prints a separate Imsak row**, which puts it in the Malaysia and Indonesia pattern | **A** for the authority AND for the existence of a 77-province national table, upgraded from R5's "publishes no method"; **NULL** for the parameters | `skthai.org/th/pages/28433`, `tinyfish`, 2026-09-30; `agent-browser` returned Cloudflare 5xx; attributing sites `tinyfish`, 2026-09-30 |
| Brazil | no national authority | 2 São Paulo mosques measure **Fajr 17.96, Isha 16.94, Asr factor 0.990, Dhuhr at true noon** | std Asr | none established | **B, measured**; **NULL**, unchanged from R5 | `fetch`, 2026-09-30 |
| Argentina | no national authority | 1 Buenos Aires mosque measures **Fajr 17.91, Isha 17.00, Asr factor 1.002** | std Asr | none established | **B, one mosque**; **NULL** | `fetch`, 2026-09-30 |
| Suriname | no national authority | 1 Paramaribo mosque measures **Fajr 14.97, Isha 14.96, Asr factor 1.004**, that is ISNA 15/15 | std Asr | Suriname is the only Caribbean or Guianas country in this report with a measurable mosque row | **B, one mosque**; **NULL** | `fetch`, 2026-09-30 |
| Trinidad and Tobago | **ASJA**, the Anjuman Sunnat-ul-Jamaat Association, the largest Muslim organisation, over 70 affiliated jamaats, cited | **No timetable located.** ASJA's evidenced public prayer-time function is announcing Ramadan and Taraweeh start times and Jumu'ah adhan and salat times, cited. No Trinidadian mosque on Mawaqit returned times | not established | ASJA publishes **adhan and salat as separate times** for Jumu'ah, cited: 1st Jumu'ah adhan 1:30 pm, salat 1:45 pm | **A** for the body, **NULL** for the convention | ASJA via `tinyfish`, 2026-09-30; `fetch` returned no mosques |
| Guyana | **CIOG**, the Central Islamic Organisation of Guyana, described as "the main organization of the Muslims of Guyana", cited | **No timetable located.** No Guyanese mosque on Mawaqit returned times | not established | none established | **A** for the body, **NULL** for the convention | `tinyfish`, 2026-09-30 |
| China, Philippines, New Zealand, Mexico, Fiji | see R5 for each body | **No authority table, and no mosque on Mawaqit returned usable times for any of the five.** Mexico returned zero mosques at all | not established | none established | **NULL** for all five, unchanged from R5 | `fetch` and `tinyfish`, 2026-09-30 |

---

## The four questions, answered

### 1. What do Sweden and Norway actually print in summer?

Both print a real, specific number on every single day of the year, and they do it by two different rules. This is
the most useful pair of measurements in the report, because it settles a question no earlier wave could reach and
because the two answers are incompatible with each other and with every library preset.

**Sweden freezes a fraction of the night.** Islamiska Förbundet i Sverige publishes a full year for 112 cities.
For Stockholm, 118 days from 24 April to 19 August have no astronomical solution for an 18-degree Fajr at all. IFiS
prints a Fajr on every one of them, and the printed values keep moving day to day through the whole stretch, which
rules out a frozen clock time. The construction that fits is a frozen proportion. On 23 April, the last day the
angle solves, the published Fajr sits 0.2148 of the night before sunrise, that is one part in 4.66. Holding that
proportion and applying it to each subsequent day's own shrinking and then growing night reproduces all 118
published Fajr values to a median of 1.0 minute and a worst case of 1.9. The same construction on the evening side,
with a boundary fraction of 0.1923 or one part in 5.20, reproduces the Isha to a median of 1.6 and a worst of 3.0.
Malmö behaves identically at 0.2159 and 0.1919 with a worst Fajr error of 1.2 minutes. All measured.

Three things follow. The fractions are the authority's own, derived from its own boundary day, not taken from a
formula: 1/4.66 is not 1/7 and not 18/60. A plain one-seventh rule misses the Swedish table by a median of 29 to
31 minutes, and a midnight rule by 110 to 120. And the rule does not extend to the Arctic: at Kiruna, 67.86 N, the
same frozen-fraction construction leaves a median 23.5 and worst 89.3 minutes, so IFiS is doing something else for
its northernmost cities, and this report could not identify what.

**Norway freezes a clock time.** Islamsk Råd Norge's unified national calendar, the public output of its
`Felles bønnetid` standardisation project, is more explicit than any other authority in this programme. It names
its own angles in its own column headers, `Morgengry 16°` and `Kveldsgry 15°`, and inverting the days those cells
are filled confirms the labels exactly at 16.08 and 14.93 degrees. Then, for 136 days from 1 May to 31 July, IRN
leaves the `Morgengry 16°` cell **blank**, and for 162 days from 1 April to 31 August it leaves `Kveldsgry 15°`
blank, while still printing a Fajr and an Isha on all 365 days. What it prints through those months is a constant:
Fajr 03:37, unchanged for 34 consecutive days from 12 April to 15 May, and 03:17 for 46 consecutive days from 13
July to 27 August. The value carried is the last angle-derived one, unchanged across the boundary: 4 April prints
03:37 with the column filled and 5 April prints 03:37 with it blank. That is the `Aqrab al-Ayyam` nearest-day rule,
applied as a clock time rather than as a proportion. A one-seventh construction misses it by a median 17.2 and
worst 81.2 minutes; a frozen fraction of the night, Sweden's rule, misses it by a median 11.1 and worst 42.7. All
measured.

**IRN documents why it did this, in its own words.** Its project page, read in Norwegian, states that the problem
is that in summer "blir maghrib, isha og fajr bedt i løpet av noen timer" (maghrib, isha and fajr end up prayed
within a few hours), that mosques in the north "prøver å samarbeide om å lage bønnetider, basert på nærmeste
'normalt sted' og 'normal dato'" (try to cooperate on making prayer times, based on the nearest "normal place" and
"normal date"), and that the largest weakness of the existing solutions "er at det ikke er begrunnet i lokale
observasjonsdata" (is that they are not grounded in local observation data). That is the nearest-day rule named
explicitly by a national authority.

**Sweden's fatwa side is separate from its table and says something different.** The Stockholm Mosque's FIFS
theological council publishes, in Swedish, that the European Council for Fatwa and Research has permitted combining
Maghrib and Isha during the period when "de religiösa tecknen för Isha bönen helt försvinner under sommaren i
Sverige" (the religious signs for the Isha prayer disappear entirely during summer in Sweden), that this begins "som
senast den 5 maj för Malmö området (fram till 18 augusti)" (5 May at the latest for the Malmö area, until 18
August), and that the basis is avoiding `haraj`, undue hardship. Cited. So Sweden publishes a computed table for
the whole year AND a standing permission not to follow it, which is the same two-track structure Belgium prints on
its own calendar.

### 2. How does France resolve in practice?

Mawaqit's public mosque search is keyless, returns each mosque's own coordinates alongside its own times for
today, and therefore answers the question by measurement instead of assertion. Fifty-two French mosques across
Paris, Marseille, Lyon, Lille, Toulouse and Strasbourg were inverted at their own coordinates.

| Fajr angle band | Mosques | Share |
| --- | ---: | ---: |
| 12 degrees, the Musulmans de France position | 25 | **48.1%** |
| 13 to 15 degrees | 15 | 28.8% |
| 16 to 17 degrees | 5 | 9.6% |
| 18 degrees, the Grande Mosquée de Paris position | 6 | **11.5%** |
| deeper than 19 | 1 | 1.9% |

All measured. The plurality answer is 12 degrees, and the 18-degree position reaches about one mosque in nine.
Whole-sample Fajr median 14.25, Isha median 13.70, Asr median factor 1.011 with **zero of 52** printing a Hanafi
Asr, and Maghrib a near-universal sunset +3.

**The clustering is municipal, not national, and that is the more useful finding.** Marseille reads 12.5 to 13.1
at nine of ten mosques. Lille reads 12.5 to 12.7 at all ten. Lyon sits at a tight 14.24 to 14.42 across all ten,
which is neither published position. Paris is the most divided city in the sample, with mosques at 12.66, 14.91,
15.72, 16.04, 16.97 and 19.16 within a few kilometres of each other. And Strasbourg splits cleanly in two: five
mosques read 17.91 to 18.09 with a **Maghrib margin of 8 to 9 minutes**, which is the Diyanet temkin signature R5
established by measurement at Ankara, and their names say the same thing (`Fatih Camii`, `Selimiye Camii`,
`Eyyûb Sultan`). The other Strasbourg mosques read 12.6 to 12.9 with a 3-to-4 minute Maghrib. So Strasbourg is not
a French disagreement at all; it is a Turkish timetable and a French one sharing a city.

**The Grande Mosquée de Paris does not itself publish 18 degrees, which reframes the whole dispute.** Its own
366-day calendar, extracted from the `confData` object on its Mawaqit page, inverts to a Fajr angle that sweeps
from 18.0 in December and January down to 13.0 in June and back. Month by month, measured:

| Month | Published Fajr against an exact 18 degrees | Days with no 18-degree solution |
| --- | --- | ---: |
| November, December | median 0 minutes later | 0 |
| January | median 15 minutes later | 0 |
| March | median 13 | 0 |
| May | median 47 | 0 |
| **June** | **median 91, up to 113** | **18** |
| August | median 27 | 0 |
| October | median 2 | 0 |

The mosque matches an exact 18 degrees on 78 of its 348 solvable days, all in late autumn and winter. Its Isha is
not an angle in any month: it is Maghrib plus exactly 87 minutes on 278 of 366 days, widening to 85 to 101 only
between October and December. Testing `max(Maghrib + 87 min, angle A)` for A from 15 to 18 reproduces at best 96
of 366 days within a minute, so the winter widening is not a simple angle floor either.

**So the honest statement of the French position is not "12 against 18".** It is that Musulmans de France publishes
a fixed shallow angle, the Grande Mosquée de Paris publishes a seasonally-varying deep-in-winter angle with a
fixed-interval Isha, about half of measurable French mosques follow the first, one in nine follow something near
the second, and a fifth of Strasbourg follows Turkey. R1's measurement of France as the sharpest single-country
split stands, and this report adds that the split is not between two numbers but between a fixed angle and a
non-angle.

### 3. Which African countries publish anything at all?

Three do, at tier A, and two of those are new to this programme. The rest divide into authorities that exist and
publish no timetable, and authorities that could not be reached at all. Every ministry and council checked is named
below, so the negative result is auditable rather than asserted.

**Publishing a national table, measured at tier A:**

| Country | Authority | What it publishes |
| --- | --- | --- |
| Mauritania | Ministry of Islamic Affairs and Original Education | A per-wilaya-city Ramadan imsakia with seven columns including a separate Imsak row. Measured 19.37 / 17.46 across three cities and 90 days |
| Algeria | Ministry of Religious Affairs and Endowments | A three-anchor annual zone calendar as per-city PDFs. Measured 17.91 / 17.09 over 135 days at Algiers |
| Tunisia | Institut National de la Météorologie, under the Ministry of Transport | A five-row day view with no sunrise, plus a Ramadan imsakia. Measured 18.06 / 18.10 and an Imsak at 20.05 degrees |

Morocco, Egypt and Libya were already covered by earlier reports and are not repeated; Morocco and Egypt are tier
A there, Libya is an authority with no table.

**Authorities that exist, whose own site was read, and that publish no prayer timetable on it:**

| Country | Body checked | URL read | What its site actually does |
| --- | --- | --- | --- |
| Kenya | Supreme Council of Kenya Muslims (SUPKEM) | `supkem.org/en` | Marriage registration, halal certification, study-abroad letters, employment referral, pilgrimage, membership accreditation. No prayer times anywhere |
| Ethiopia | Ethiopian Islamic Affairs Supreme Council | `ethiopianmajlis.org.et` | Statements, Hajj and Umrah coordination, proclamation 1207/2020. No prayer times |
| Libya | General Authority of Awqaf and Islamic Affairs | `awqaf.gov.ly`, `t.me/s/awqaflibya` | Waqf administration, mosque affairs, preaching. Its Telegram states it works "على اعتماد مواقيت الصلاة وضبطها" but no table was published on either channel |
| Nigeria | Nigerian Supreme Council for Islamic Affairs | `nscia.com.ng` | Hijri month declaration through the Sultan of Sokoto, and in 2026 a national prayer gathering at the Abuja National Mosque. No timetable, confirmed on a second attempt |
| Tanzania | BAKWATA, Baraza Kuu la Waislamu wa Tanzania | `bakwata.or.tz` | Site returned empty content on every attempt. Its evidenced public function, from its own Instagram and press coverage, is Hijri month and Eid declaration |
| South Africa | Muslim Judicial Council, Jamiatul Ulama SA, Jamiatul Ulama KZN | `mjc.org.za`, `jamiatsa.org`, `jamiat.org.za` | The MJC publishes a real Cape Town month, measured. There is no national body and the two largest ulama bodies recommend a different method from the one the MJC's own table implements |

**Structurally absent, where the search establishes that the question itself is wrong:** Senegal has no state
prayer-time body, and the effective religious authorities are the Sufi turuq at Tivaouane and Touba. What exists
instead is CERFI, a Dakar organisation publishing a timetable in Wolof prayer names (`Fajr`, `Suba`, `Tisbar`,
`Takusan`, `Timis`, `Guewe`), with two distinct dawn rows fifteen minutes apart. That is tier C, and it is the best
Senegal offers.

**Sudan gained a named authority on this attempt, which R5's search missed.** Sudanese press and the Fiqh Academy's
own statements, read in Arabic, establish the `مجمع الفقه الإسلامي` (Islamic Fiqh Academy) as
"الجهة الرسمية لإصدار واعتماد إمساكية رمضان" (the official body for issuing and approving the Ramadan imsakia),
and record it warning other parties against issuing an imsakia without reference to it. So Sudan does have a
single decreed national authority for its timetable. The timetable itself was not located, `moia.gov.sd` remains
unreachable, and the convention is still NULL. That is a real advance on R5's "no authority document found".

**Where only mosque practice could be measured, and what it says.** For Libya, Somalia, Kenya, Tanzania, Ghana
and Chad the only measurable timetable was one or two mosques on Mawaqit. Every one of them measures in the
17.8-to-18.5 Fajr band with a 17-degree Isha and a standard Asr. That is not a discovery about African conventions;
it is a discovery about international prayer-time software, which defaults to the same family everywhere. It is
recorded at tier B with its sample size stated, and it should not be read as a national convention for any of the
six.

**Why the mosque evidence is thin, measured rather than guessed.** Across the African countries sampled, a majority
of Mawaqit mosque records fail a solar sanity gate: their published Dhuhr sits 20 to 83 minutes after true noon and
their Maghrib up to 36 minutes after sunset, which is arithmetically impossible for any calculation convention and
is instead a congregation schedule typed into the calculation fields. Senegal lost 10 of 11 rows this way, Mali 9
of 10, Nigeria 5 of 6, Ivory Coast 2 of 2 and Niger 2 of 2. This is R2's hand-edit finding appearing as a
measurement: in much of West Africa, the mosque platform record IS the iqama schedule, and no computation reaches
it.

### 4. Does anything here contradict the earlier reports?

Five things, and each is a measurement against a citation rather than an opinion.

**One: the Grande Mosquée de Paris does not publish a fixed 18 degrees.** R1 established the French split as
Musulmans de France at 12 against the Grande Mosquée de Paris at 18, and R5 carried it forward verbatim. The
citation is sound, and the 18 is what the mosque and its commentators say. The mosque's own published year does not
behave that way: 18.0 in December, 13.0 in June, an exact 18-degree match on 78 of 348 solvable days, and an Isha
that is a fixed 87-minute interval on 278 of 366 days rather than an angle at all. Neither R1 nor R5 measured the
mosque's calendar; both quoted its stated position. The correction is not that the earlier reports were careless,
it is that a French body's stated angle and its printed table are different objects. Measured.

**Two: Belgium has a national authority, and R5 said it did not.** R5's Europe row groups "Netherlands, Belgium,
Spain, Italy, Sweden, Norway" as "no national Islamic authority publishing a method located in any", NULL for all
six. Three of the six are now tier A with measured parameters: Belgium through the EMB's own annual PDF, Sweden
through Islamiska Förbundet's 112-city year, and Norway through Islamsk Råd Norge's unified national calendar. For
Belgium in particular the artefact is signed by a Conseil des Théologiens, carries eighteen decreed per-city
offsets, and states its own high-latitude rule in three languages. Two of the six, the Netherlands and Spain, are
confirmed as having a state-recognised body with no timetable on its site, which is a different and weaker finding
than no body existing. Only Italy remains as R5 described it.

**Three: Bosnia's measured parameters move, and the direction matters.** R5 measured Sarajevo from one day as Fajr
18.24, Isha 16.54, Maghrib sunset +9 and sunrise 2.18 degrees, and flagged in its own caveats table that a month
was needed. Forty-one days sampled across 2026 from the Rijaset's own endpoint give Fajr 18.01, Isha 15.89, Maghrib
sunset +6 and sunrise 1.71. R5's Fajr was inside the ordinary day-to-day scatter, but its Isha was 0.65 degrees
deep and its Maghrib margin 3 minutes long. R5 was right to flag it and right about the shape of the answer, and
the numbers should be taken from here. Kosovo's single-day figures, by contrast, reproduce to two decimal places
from the same site on a different day, so R5's Kosovo row needs no correction, only the same caveat it already
carries.

**Four: Tunisia's and Algeria's library constants are now testable, and one of them is wrong in a way no library
records.** R5 correctly downgraded both to tier D and correctly identified Tunisia's authority as the
meteorological institute. Measured, `aladhan.com` method 18 for Tunisia (18/18) is close on both angles for the
year-round Sobh row, and method 19 for Algeria (18/17) is close on both too. What neither carries is the Maghrib
margin: Algeria's ministry prints sunset +4 on 135 of 135 days and Tunisia's INM prints sunset +3. A library
configured to either constant is 3 to 4 minutes early on Maghrib every day of the year, which is the same class of
error R5's temkin work found in Turkey, on the prayer that looks safest.

**Five: South Africa's own institutions contradict each other, which sharpens rather than overturns R5.** R5
recorded the KZN Jamiat fatwa recommending Karachi with a Hanafi Asr and a 3-minute Maghrib margin, at tier A as a
recommendation and NULL for a national convention. That stands. What is new is that the MJC's own published Cape
Town month measures 18/17 with a **standard** Asr and Maghrib at plain sunset. Those two positions are 45 to 60
minutes apart on Asr and 3 minutes apart on Maghrib, inside one country, both from bodies R5 named. R5's NULL for a
South African national convention is not merely unproven, it is now shown to be correct by measurement.

**One place where this report confirms a contested earlier result rather than disturbing it.** R5 resolved the
Diyanet temkin dispute against R2 by measuring a flat 7-minute offset on `Güneş` and `Akşam` across seven cities
spanning 1,900 metres of elevation. That signature appears again here, independently, in a country neither report
was looking at: the Turkish-network mosques in Strasbourg measure a Maghrib margin of 8 to 9 minutes against the
3-to-4 minutes of their French neighbours in the same city. The temkin travelled with the network, which is exactly
what R5's reading predicts.

---

## UNVERIFIED and NULL

Listed so that no weak row is read as established, with what was searched in each case.

### NULL: nothing sourceable for the convention, and what was tried

| Country | What was searched |
| --- | --- |
| **Nigeria** | `nscia.com.ng` read again in full; its 2026 output is a national prayer gathering and Hijri declaration. Searched for a national timetable in English. `prayertimesnigeria.com` and `toolbase.com.ng` read: both third-party, neither names a method or an authority. 6 mosques measured, 5 fail the solar sanity gate, the survivor is ISNA 15/15. **Fifth-largest Muslim population on earth and still NULL** |
| **Sudan** | `moia.gov.sd` still unreachable. The Islamic Fiqh Academy is now established as the decreed approving body, in Arabic press and its own statements, but its imsakia was not located. 1 Khartoum mosque row failed the sanity gate |
| Ethiopia | `ethiopianmajlis.org.et` read in full, no prayer section. `eiasc-aic.org` read, an audit commission. 0 Addis Ababa mosques returned usable times |
| Mali | Searched for the Haut Conseil Islamique du Mali. 10 Bamako mosques measured, 9 fail the sanity gate |
| Niger | Searched for the Association Islamique du Niger in French and Arabic. 2 Niamey mosques, both fail the sanity gate, one with a 360-minute Dhuhr error |
| Ivory Coast | Searched for COSIM. 2 Abidjan mosques, both fail the sanity gate |
| Kenya | `supkem.org` read in full and its service list enumerated, no prayer times. `jamiamosque.co.ke` read, its Ramadan timetable link yielded no values. 1 mosque measured |
| Tanzania | `bakwata.or.tz` returned empty content on every attempt through `tinyfish`. Searched in Swahili for `ratiba ya nyakati za sala`. 1 mosque measured |
| Ghana, Chad, Somalia | Searched for the Office of the National Chief Imam, the Conseil Supérieur des Affaires Islamiques and the Ministry of Endowments and Religious Affairs respectively. One mosque measured each. Somaliland's own ministry publishes a regional Eid schedule, which is a jamaah table |
| Senegal | Searched in French for a state body and for the Tivaouane and Touba turuq. There is no state prayer-time authority; CERFI is tier C |
| North Macedonia | Searched for the Islamic Religious Community in Macedonian and Albanian. 3 Skopje mosques, all fail the sanity gate |
| Netherlands | `cmoweb.nl` read in full, the state-recognised interlocutor for 380 mosques, no prayer section. `isndiyanet.nl` read, links out to Diyanet. `waqti.nl` read. Mosque practice is bimodal and measured at tier B |
| Spain | `comisionislamica.org` read, the state-recognised body, announces Ramadan, no timetable. Mosque practice measured at tier B and it is tightly 18/17 |
| Italy | `ucoii.org` read in full, serves times through a WhatsApp assistant not a page. `grandemoscheadiroma.org` is a hijacked domain |
| Thailand | `skthai.org/th/pages/28433` read and its 77-province structure confirmed; the province tables sit behind Cloudflare and returned 5xx through `agent-browser`. The attributing Thai sites all render client-side. **The authority and its national table are now tier A; only the parameters are NULL** |
| China, Philippines, New Zealand, Fiji | No authority table located; no mosque on Mawaqit returned usable times for any |
| Mexico | 0 mosques returned at all for Mexico City |
| Trinidad and Tobago, Guyana | ASJA and CIOG are both established as the largest national bodies, cited; neither publishes a timetable; no mosque returned times |
| Kiruna and the Swedish Arctic | IFiS publishes a full year for Kiruna, Gällivare, Jokkmokk, Haparanda and Pajala, and the frozen-fraction rule that reproduces Stockholm and Malmö to 1 minute leaves a median 23.5 and worst 89.3 minutes at Kiruna. **What IFiS does above the Arctic Circle is not identified** |

### Measured but with a caveat

| Row | Caveat |
| --- | --- |
| Kosovo, Fajr 13.48 | Still one day. R5's figures reproduce exactly on a different date, which is reassuring but not a month. `bislame.net` ignores `?date=` and `?data=`, so a month could not be obtained |
| Tunisia, the year-round row | One day for the five-row Sobh figure, thirty days for the Imsak figure. The INM's governorate selector needs a real form POST and would not serve a second city through any path tried, so **the Tunis row was not confirmed against a second Tunisian city** |
| Libya, Somalia, Kenya, Tanzania, Ghana, Chad, Japan, South Korea, Argentina, Suriname | **One or two mosques each.** Enough to separate a 12-degree convention from an 18-degree one, and enough to rule a Hanafi Asr in or out, because those differences are tens of minutes. Not enough to distinguish 17.5 from 18.0, and not evidence about the country |
| Belgium, 348 of 365 days | The 17 missing days are rows the PDF labels with a Hijri event name (`Isra`, `Rajab`, `Chaʻban`, `Nuit mi-cha'ban`) instead of a Latin weekday, which breaks the day-number anchor. The missing days are scattered, one to four per month, so they do not bias the measured quartiles |
| Algeria, 135 days of one anchor city | The ministry publishes three anchor cities and only Algiers was OCR'd. **A zone system's measured angle depends on the anchor point**, as R5's JAKIM and Sri Lanka work showed, so Djelfa and Adrar could measure differently |
| Mauritania, three cities | Nouakchott is not a separate page in the ministry's imsakia, so the capital itself was not measured. The three cities measured are 1,000 km apart and agree to 0.05 degrees, which is strong internal evidence that the ministry computes centrally |
| France, 52 mosques | One day. The distribution is a snapshot of what mosques had configured on 2026-09-30, and Mawaqit lets a mosque change it at any time |
| Grande Mosquée de Paris, 366 days | Read from the mosque's Mawaqit page rather than from `grandemosqueedeparis.fr`, whose own prayer page is a Wix shell that served only the Friday khutba times through both paths tried |

### D: a library constant with nothing behind it, after this report

| Country | Constant | Status |
| --- | --- | --- |
| Portugal | 18 / Maghrib+3 / Isha 77 min | Unchanged from R5. Not re-attempted here |
| Bahrain, Russia, India, Pakistan, Afghanistan | see R5 | Unchanged |
| Algeria, Tunisia | 18/17 and 18/18 | **No longer D.** Both are now tier A and measured, and both library constants are close on the angles and missing the authority's real Maghrib margin |

---

## Sources

All fetched 2026-09-30. Path is the retrieval method.

### Authorities read on their own sites

| URL | What it is | Path | Tier it supports |
| --- | --- | --- | --- |
| `https://affairesislamiques.mr/` and `/?q=im` | Mauritania's Ministry of Islamic Affairs and Original Education, its live prayer widget and its imsakia index | tinyfish | A, Mauritania |
| `https://affairesislamiques.mr/sites/default/files/sites/default/files/RAMADANE%202025%202_merged_compressed.pdf` | The ministry's own Ramadan 1446 imsakia, 34 pages, one per wilaya city, signed by the minister. Seven columns including a separate `الإمساك` | agent-browser for the download, local OCR for the tables | **A, Mauritania, measured** |
| `https://marw.gov.dz/مقالات-ودراسات/مواقيت-الصلاة` | Algeria's ministry naming its three anchor calendars: `الجزائر`, `الجلفة`, `أدرار`, each with "والمدن المرتبطة بها" (and the cities linked to it) | tinyfish | A, Algeria's zone structure |
| `https://marw.gov.dz/media/calendrier/1448/Alger.pdf` | The ministry's own annual Algiers calendar, image-scanned, 135 days recovered | local OCR | **A, Algeria, measured** |
| `https://www.meteo.tn/fr/heures-prieres` | Tunisia's Institut National de la Météorologie, five prayer rows and no sunrise, under the masthead "République Tunisienne / Ministère du transport" | agent-browser | **A, Tunisia, measured** |
| `https://www.meteo.tn/sites/default/files/2025-02/imsakia Tunis .pdf` | The INM's own Ramadan 1446 Tunis imsakia, `الإمساك` and `الإفطار` columns | local OCR | A, Tunisia's Imsak, measured |
| `https://mjc.org.za/salaah-times/` | South Africa's Muslim Judicial Council, a full September 2026 Cape Town month with six columns | tinyfish | **A, South Africa Cape Town, measured** |
| `https://www.jamiatsa.org/tools/salaah-times.html` | Jamiatul Ulama SA, publishing **both Asr columns** and naming MWL 18/17 as used by SANHA "and most South African Ulama bodies" | tinyfish | B, South Africa |
| `https://jamiat.org.za/hanafi-settings-for-salaah-apps/` | The KZN Jamiat fatwa: set Karachi, Hanafi Asr, add 3 minutes to Maghrib | tinyfish | A as a recommendation |
| `https://awqaf.gov.ly/` and `https://t.me/s/awqaflibya` | Libya's General Authority of Awqaf, stating its remit over "اعتماد مواقيت الصلاة وضبطها" and publishing no table | tinyfish | A for the body, NULL for the convention |
| `https://www.supkem.org/en` | Kenya's Supreme Council of Kenya Muslims, its full service list, no prayer times | tinyfish | A for the body, NULL for a timetable |
| `https://ethiopianmajlis.org.et/` | Ethiopian Islamic Affairs Supreme Council, reinstated by decree 1207/2020, no prayer section | tinyfish | A for the body, NULL |
| `https://nscia.com.ng/` | Nigeria's NSCIA, re-read | tinyfish | NULL, Nigeria |
| `https://cerfi.sn/` | Senegal's CERFI, a Dakar timetable in Wolof prayer names with TWO dawn rows (`Fajr` 05:44 and `Suba` 05:59 on 2026-09-30) | tinyfish | C, Senegal, measured |
| `https://www.emb-net.be/nl/gebedstijden` | Belgium's Executief van de Moslims van België, its prayer-times index | tinyfish | A, Belgium |
| `https://www.emb-net.be/sites/default/files/horaire_priere_emb_2026.pdf` | **The EMB's own 2026 annual table**, 13 pages, its Conseil des Théologiens' stated high-latitude rule in French, Dutch and Arabic, and eighteen named per-city offsets in minutes | agent-browser for the download (plain HTTP is blocked), local PDFKit for the text | **A, Belgium, measured** |
| `https://www.islamiskaforbundet.se/bonetider/` | Islamiska Förbundet i Sverige, a full year for 112 Swedish cities, row set `Fajr Shuruk Dhohr Asr Magrib Isha` | agent-browser, month by month | **A, Sweden, measured** |
| `https://stockholmsmoske.se/maghrib-isha-sommaren/` | The Stockholm Mosque's FIFS theological council on combining Maghrib and Isha in the Swedish summer, naming 5 May to 18 August for the Malmö area and `haraj` as the basis | tinyfish | A, Sweden's fatwa position |
| `https://bonnetid.no/` | **Islamsk Råd Norge's unified national calendar**, thirteen columns including `Morgengry 16°`, `Fajr slutt`, `1x-skygge`, `2x-skygge`, `Kveldsgry 15°` and `Midnatt` | agent-browser (`api.bonnetid.no` refuses a bare fetch) | **A, Norway, measured** |
| `https://irn.no/prosjekter/felles-bonnetid/` | IRN's own account of the Norwegian standardisation problem and the nearest-normal-place-and-date approach, read in Norwegian | tinyfish | A, Norway's stated rule |
| `https://www.mawaqeet.no/artikler/mawaqeet-bonnetabell/` | A competing Norwegian table stating its own criteria in Norwegian: three latitude zones at 48.5 and 66 degrees, Isha at 18 degrees, **5 minutes added to Maghrib as a safety margin**, and both Asr factors offered as `Asr Shafi` and `Asr Hanafi` | tinyfish | C, Norway's intra-country disagreement |
| `https://api.vaktija.ba/vaktija/v1/77/<y>/<m>/<d>` | Bosnia's Rijaset, every location and any date, keyless | fetch | **A, Bosnia, measured, correcting R5** |
| `https://bislame.net/namazet/` | Kosovo's Islamic Community, daily times | tinyfish and fetch | A, Kosovo, measured, one day |
| `https://www.cmoweb.nl/` | The Netherlands' CMO, state-recognised interlocutor for 380 mosques since 2004, no prayer section | tinyfish | A for the body, NULL |
| `https://isndiyanet.nl/` | Islamitische Stichting Nederland, linking from its own homepage to `namazvakitleri.diyanet.gov.tr` for The Hague | tinyfish | A, the Dutch Diyanet supply path |
| `https://comisionislamica.org/` | Spain's Comisión Islámica de España, announcing Ramadan 2026, no timetable | tinyfish | A for the body, NULL |
| `https://ucoii.org/` | Italy's UCOII, founded 1990, 20 regions, serving "Orari Preghiera" through a WhatsApp assistant | tinyfish | A for the body, NULL |
| `https://www.skthai.org/th/pages/28433` | **Thailand's Office of the Chularatchamontri, publishing per-province times for all 77 provinces**, indexed by region | tinyfish | **A for the authority and the national table**, NULL for parameters |
| `https://www.lma.org.au/mosques-imams` | The Lebanese Muslim Association, Lakemba, publishing **separate adhan and iqamah columns** for every prayer | tinyfish | B, Australia |
| `https://www.grandemosqueedeparis.fr/horaire-des-prieres-paris` | The Grande Mosquée de Paris's own prayer page, a Wix shell serving only the Friday khutba times (13h50 and 14h30) | tinyfish | Recorded as not yielding a table |
| `https://mawaqit.net/fr/m/grande-mosquee-de-paris` | **The Grande Mosquée de Paris's own 366-day calendar**, in the `confData` object, with its own coordinates (48.8424 N, 2.3548 E) and its association named as the Société des Habous et des Lieux Saints de l'Islam | agent-browser | **A, the mosque's own year, measured** |

### Measurement inputs and platforms

| URL | What it is | Path | Supports |
| --- | --- | --- | --- |
| `https://mawaqit.net/api/2.0/mosque/search?lat=&lon=` | Mawaqit's **keyless** public mosque search, returning each mosque's own coordinates and its own times for today as `[fajr, shuruq, dhuhr, asr, maghrib, isha]`. The `?word=` form works too | fetch | **B, measured, in 37 countries queried** |
| `https://api.bonnetid.no//prayertimes/181/2026/<m>` | IRN's own JSON endpoint, discovered in the page's resource timings. **Returns "Authentication credentials were not provided" to any request outside the app**, so the rendered page is the keyless path | agent-browser | Recorded as gated |

### Secondary sources, each labelled by what it supports

| URL | What it is | Path | Supports |
| --- | --- | --- | --- |
| `https://www.psm-enligne.org/10733-horaires-de-prieres-12-ou-18-degres-pourquoi-choisir` and `https://www.saphirnews.com/Horaires-de-prieres-12-ou-18-degres-pourquoi-choisir_a22568.html` | The French dispute in French, quoting the ex-president of the UOIF that "les créneaux de calcul des horaires de prière sont valables dans un intervalle de 12° à 19°" | tinyfish | C, France's stated positions |
| `https://www.al-kanz.org/2012/07/25/calendrier-ramadan-mosquee-paris/` and `https://www.saphirnews.com/La-Grande-Mosquee-de-Paris-garde-le-18e-degre-de-latitude-pour-les-horaires-de-priere_a14937.html` | French reporting that the Grande Mosquée de Paris uses 18 degrees "durant l'année" but "semble-t-il, en été, elle préconise le 15°" | tinyfish | **C, and it corroborates the measured seasonal variation** |
| `https://www.alrakoba.net/31386246/...`, `https://newspaper.sudafax.com/93978/...`, `https://t.me/s/SNewsNetWork` | Sudanese press establishing the Islamic Fiqh Academy as the official body for issuing and approving the national Ramadan imsakia, and warning others against issuing one | tinyfish | C, Sudan's authority |
| `https://hadhwanaagnews.ca/articles/50537/...` | Somaliland's Ministry of Religion and Endowments publishing a per-gobol Eid prayer schedule | tinyfish | C, a jamaah table not a daily one |
| `https://en.wikipedia.org/wiki/Anjuman_Sunnat-ul-Jamaat_Association` and ASJA's own Facebook posts | ASJA as Trinidad and Tobago's largest Muslim organisation, over 70 affiliated jamaats, publishing adhan and salat as separate Jumu'ah times | tinyfish | A for the body, NULL for a timetable |
| `https://www.islamicfinder.org/fr/world/view-place/18368/` | CIOG as "the main organization of the Muslims of Guyana" | tinyfish | A for the body, NULL |
| `https://prayertimesnigeria.com/` | A third-party Nigerian site claiming all 774 LGAs and "internationally recognized methods validated by Islamic scholars in Nigeria", naming neither | tinyfish | Recorded as unsourced |
| `https://prayertimes.muslimthaipost.com/` and `https://salamthailand.com/` | Thai sites attributing their times to the Chularatchamontri's office, and showing the Thai row set with a separate `อิมซาก` (Imsak) row | tinyfish | C, Thailand's row structure |

### Paths that failed, recorded so they are not retried blindly

| Target | What happened |
| --- | --- |
| `bakwata.or.tz` | Empty content through `tinyfish` on every attempt |
| `skthai.org` per-province tables | The index page reads fine through `tinyfish`; `agent-browser` receives a Cloudflare 5xx landing page with a single link |
| `meteo.tn` governorate selector | The two selects and the Apply button all operate, and the served row does not change: every governorate and delegation returned the Tunis values. A `?gouvernorat=&delegation=` query string returns the page with no times at all |
| `emb-net.be` PDF over plain HTTP | `curl` hangs past 80 seconds and downloads nothing. An in-page `fetch` inside `agent-browser`, base64-encoded back out, retrieved all 1,438,151 bytes |
| `api.bonnetid.no` from `fetch` and from an in-page `fetch` | "Manglende autentiseringsinformasjon" / "Authentication credentials were not provided" on every path. No token is present in `localStorage`, `sessionStorage`, cookies or the JS bundle |
| `bislame.net/namazet/?date=` and `?data=` | Both return HTTP 200 and today's times regardless of the parameter |
| `grandemoscheadiroma.org` | The domain now serves a Turkish gambling site. Not a fetch failure, a hijack |
| `grandemosqueedeparis.fr/horaire-des-prieres-paris` | A Wix page whose prayer table did not render; only the Friday khutba times were recovered |
| `affairesislamiques.mr` live widget | The six times it prints do not invert to any coherent convention at Nouakchott's coordinates (Fajr 26.7, Maghrib sunset +51). The widget appears stale or mis-labelled; **the ministry's own imsakia PDF is the reliable path and is what the measurement uses** |
| `chinaislam.net.cn`, `moia.gov.sd`, Mexico and Fiji on Mawaqit | No usable content, and zero mosques for Mexico |

### Scripts written for this report

All under `ai/features/global-prayer-times/data/countries/`. R5's `solar-harness.mjs`, `validate-harness.mjs`,
`pdfocr-ar.swift` and `ocr.swift` were reused unchanged.

| File | What it does |
| --- | --- |
| `measure-france-mawaqit.mjs` | 52 French mosques through Mawaqit's keyless search, inverted at each mosque's own coordinates, bucketed onto the two published French positions |
| `measure-france-gmparis.mjs` | The Grande Mosquée de Paris's own 366-day calendar, inverted month by month |
| `measure-france-gmparis-hilat.mjs` | Which high-latitude construction and which Isha rule the mosque's summer actually follows |
| `mawaqit-grab.sh` | Pulls one Mawaqit mosque's whole annual calendar out of the page's `confData` |
| `grab-sweden.sh` | Drives the IFiS WordPress widget month by month for one Swedish city |
| `measure-sweden.mjs` | Stockholm, Malmö and Kiruna: unsolvable-day counts, implied angles, and the summer plateau |
| `measure-sweden-hilat.mjs` | The Swedish summer against each library construction |
| `measure-sweden-rule.mjs` | The frozen-fraction-of-night rule, identified and error-bounded per city |
| `grab-norway.sh` | Drives `bonnetid.no` month by month, preserving cell POSITIONS so the blank angle columns survive |
| `measure-norway.mjs` | IRN's named angles against its own headers, both Asr columns, and the blank-column counts |
| `measure-norway-summer.mjs` | The frozen-clock-time rule, as runs of identical printed values |
| `grab-belgium.mjs` | Parses the EMB's own annual PDF text layer into 348 days |
| `measure-belgium.mjs` | The EMB's year, its stated latitude-45 rule tested literally, and the after-midnight Isha count |
| `measure-mauritania.mjs` | Three Mauritanian cities, 90 city-days, including the invariant 5-minute Imsak |
| `measure-bosnia-year.mjs` | 41 days across 2026 from the Rijaset's own endpoint, correcting R5 |
| `measure-monthly-tables.mjs` | Inverts a whole published month for one city; carries South Africa's MJC |
| `measure-mawaqit-country.mjs` | Mosque practice in 37 countries queried, with the jamaah sanity gate that drops congregation schedules |
| `measure-r9-rows.mjs` | Single published rows read off an authority's day view, one per country |
| `grab-tunisia.sh` | Drives the INM's Drupal form; records that the governorate selector does not change the served row |
| `fr-gmparis-mawaqit.json`, `se-stockholm-2026.tsv`, `se-malmo-2026.tsv`, `se-kiruna-2026.tsv`, `no-oslo-2026.tsv`, `be-emb-2026.pdf`, `be-emb-2026.txt`, `be-emb-2026.tsv`, `mr-imsakia-1446.pdf`, `mr-p4.txt`, `mr-p9.txt`, `mr-p11.txt`, `za-mjc-capetown-2026-09.tsv`, `tn-governorates-2026-09-30.tsv` | Captured source data |

---

## How far this report reached, stated honestly

The brief set three priorities. Priority 1, Africa, is the one that mattered most and it moved the most: Algeria
and Tunisia go from tier D to tier A measured, Mauritania is a new tier A that nothing in this programme or any
library had, South Africa's largest published table is measured and contradicts its own country's fatwa, Sudan
gains a named decreed authority, and Nigeria is re-attacked and stays NULL with the reason now documented. Nine
further African countries yielded only one or two mosques each, recorded at tier B with the sample size on the row.

Priority 2, Europe, moved further than expected because three of R5's six NULLs turned out to have real
authorities: Belgium, Sweden and Norway. France was measured across 52 mosques rather than argued about, and the
Grande Mosquée de Paris's own year contradicts the 18-degree attribution both earlier reports carry.

Priority 3 is the thinnest. Australia, Japan, South Korea, Brazil, Argentina and Suriname have one to three
measured mosques each and no authority. China, Thailand's parameters, the Philippines, New Zealand, Mexico,
Trinidad and Tobago, Guyana and Fiji are NULL. Thailand's authority and its 77-province national table are now
established at tier A even though its numbers are not, which is the only structural advance in that group.

The two gaps a further wave should take first are named: **what Islamiska Förbundet does above the Arctic Circle**,
which the Swedish rule identified here does not explain and which is a real user-facing question for Kiruna,
Gällivare, Jokkmokk, Haparanda and Pajala; and **Thailand's 77-province tables**, which are a genuine national
authority table sitting behind a Cloudflare rule rather than behind an absence.
