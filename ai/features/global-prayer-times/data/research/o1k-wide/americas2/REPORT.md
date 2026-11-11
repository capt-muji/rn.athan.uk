# O1k Americas 2: wider USA, Canada round 2, Mexico to Venezuela, Chile watch

Agent `americas2`, 2026-11-10. Research only, no contact with any person or body. Every capture
is under `captures/`, normalised rows under `data/`, probe logs under `probes/`. Reading of the
record: `census/world-table-v2.md`, Region 5 plus the unrecorded-country rule (absence means
FALLBACK, not error).

## Method, and one platform recovery

- **dpt probe.** `GET https://<domain>/?rest_route=/dpt/v1/prayertime&filter=year`, HIT = HTTP 200
  with a body opening `[[{"d_date"`. Every miss also fetches the homepage for a Masjidal
  `masjid_id`, a `masjidbox.com/prayer-times/…` path, or a mawaqit path. Script `probes/probe.zsh`,
  logs `probes/us2.tsv`, `probes/us3.tsv`, `probes/ca2.tsv`.
- **Masjidal range API, parameter names recovered.** The record's note
  `masjidal.com/api/v1/time/range?masjid_id=…&masjid_detail=yes` returns **today only** for every
  parameter shape I tried (`year`, `month`, `begin`, `start`, `date`, `range`, `period`, camel
  variants). The widget's own script, `masjidal.com/widget/monthly/monthlyScript.js`, builds the
  request with `&from_date=YYYY-MM-DD&to_date=YYYY-MM-DD`. Those two names work, keyless:
  a whole year, or any span, per mosque. Ten ids captured for 2024, 2025 and 2026 — **10,960 dated
  rows** — plus an eleventh found later, for 2026 (`probes/masjidal_capture.zsh`, 31 capture files).
- **Masjidbox inline payload.** The landing page carries the whole timetable in a URL-encoded JSON
  attribute, iqamah and imsak/iftar included (`probes/masjidbox_extract.py`). `begin=` and `days=`
  on the landing page are ignored; the window is always seven days from today.
- **Mawaqit inline payload.** `confData` carries **all twelve months** of the athan calendar plus
  twelve months of iqamah (`probes/mawaqit_year.py`). Both Central American pages below were
  extracted this way and each yielded 365 dated rows.
- **Gates.** A page whose HTML loads the plugin's own asset is a client of the feed, so the page
  cannot contradict it, and the honest gate becomes a fitted angle pair. A page whose live block
  prints the same numbers as the feed is a stronger gate and is used as such. Every capture below
  carries the gate that was actually applied.
- **Fits.** Pristine adhan-js 4.4.6 from `$HOME/athan-gitree/census/adhan-build/`, three
  high-latitude rules tested per column, angles on a 0.1° grid, `probes/fit_rows.js`.

---

## 1. USA, the wider sweep

### 1.1 New dpt year feeds

| Mosque | Domain | Rows | Fit | Gate |
|---|---|---|---|---|
| Islamic Center of Greater Toledo (Toledo OH) | `icgt.org` | 365, **2025** | 15/15 — fajr MAE 0.78, isha 1.00 on the 120 unshifted days; **summer block defective, see below** | page loads `dpt.js` + `dpt-js-extra`; no independent page gate exists |
| Muslim Center of San Antonio (San Antonio TX) | `mcsamasjid.com` | 365, **2026** | 14.85° fajr MAE 0.73, isha 15.0° MAE 1.04; solar columns −0.3 to 0.0 | page loads `dpt.js` (10 dpt tokens) |

Both feeds carry `fajr_jamah`, `zuhr_jamah`, `asr_jamah`, `maghrib_jamah`, `isha_jamah` and both
asr columns. Toledo's jamah sits one minute after its athan column on 161 days and 61 minutes after
it on the 200 days of the DST block, which is the same +1 rule read against the shifted clock; it
is the placeholder style, the mosque publishes athan only. San Antonio publishes real jamah values (fajr 06:00 against a 05:47
athan on 10 November).

### 1.2 A new dpt defect class: the DST window printed on standard time

Toledo's year feed is exact for January, February, November and December, and **one hour early on
every column except sunrise from 2025-03-09 to 2025-11-01**, that is exactly the United States
daylight-saving window. Sunrise is correct on every day of the year.

| Column | Mean offset in the shifted block | Mean offset outside it |
|---|---|---|
| fajr | −59.3 min | +0.4 |
| sunrise | **+0.5** | +0.1 |
| zuhr | −59.6 | +0.4 |
| asr | −59.3 | −0.1 |
| maghrib | −60.0 | +0.6 |
| isha | −60.3 | +0.5 |

This is a third distinct class beside the record's "serving-2020 stale install" and Brandon's
single-November block. The distinguishing mark is that **sunrise survives**: five of six columns
were generated on the standard offset while the sunrise column was not, so the feed is internally
inconsistent within a single day rather than wholesale shifted. Any capture of `icgt.org` must
discard 9 March to 1 November or re-shift it by +60.

### 1.3 New Masjidal mosques, three years each, all clean 15/15

| Mosque | Masjidal id | Location | Fajr | Isha | Solar offset | Asr |
|---|---|---|---|---|---|---|
| Memphis Islamic Center | `1QL0gbKZ` | Cordova TN | 14.9° (0.19) | 15.1° (0.21) | ≤0.7 min | Shafi |
| Richmond Islamic Community Center | `keLQn7AM` | Richmond TX | 15.2° (0.07) | 15.0° (0.18) | ≤1.1 | **Hanafi** (+42 to +78) |
| Islamic Center of South Bay | `XEdoEvL7` | Lomita CA | 15.0° (0.04) | 15.2° (0.17) | ≤1.0 | Shafi |
| MAS Tarbiyah Center | `nL1JggAa` | Livonia MI | 15.0° (0.23) | 15.0° (0.19) | ≤0.2 | Shafi |
| Jamaica Muslim Center | `z0AW66Lj` | Jamaica NY | 14.8° (0.20) | 15.2° (0.19) | ≤1.0 | **Hanafi** (+38 to +73) |
| Ethiopian Muslim Association | `6adJ5qAk` | SeaTac WA | 15.0° (0.08) | 15.0° (0.19) | 0.0 | Shafi |
| Islamic Center of Tennessee | `rdRvm3dG` | Antioch TN | 15.0° (0.03) | 15.0° (0.10) | 0.0 | Shafi |

`nL1JggAa` and `6adJ5qAk` were already recorded as pool expansions; the other five are new. All
seven are plain ISNA 15/15 at round-to-minute, with scatter under a quarter of a minute. The gate
for each is the mosque's own page rendering the Masjidal widget: `memphisislamiccenter.org`,
`masjidalnoor.org`, `richmondmasjid.org` and `jamaicamuslimcenter.org` all carry the id in their
own HTML; `masdetroit.org` and the two Nashville sites were found the same way.

**No US Masjidal profile carries the DST defect.** Every one of the seven holds within a minute in
November and December, which is what makes the Edmonton cluster in §2.3 a local fault rather than
a platform-wide one.

### 1.4 Honest negative

Two waves. Wave 1 was 176 guessed domains across Dearborn, Toledo, Hartford, Raleigh, Milwaukee,
Nashville, Memphis, Oklahoma City, Salt Lake City, Phoenix, Las Vegas, Portland, Sacramento, San
Antonio, Tampa and 40 further smaller metros: **128 do not resolve at all** (HTTP 000), 30 answer
200, 15 answer 404, 1 answers 403. Wave 2 was 28 domains confirmed to exist by search in eight of
those metros: 5 unresolved, 10 at 200, 10 at 404, 2 at 403.

That is **2 dpt hits and 5 new Masjidal ids out of 204 domains**, and the honest reading is that
the guessed-domain negative is weak: most of the country's mosque sites are on domains I did not
name, not on domains that refused the feed. The metros still returning nothing are Hartford,
Raleigh, Milwaukee, Salt Lake City, Las Vegas, Portland, Sacramento, Oklahoma City and Dearborn;
the sites that answered and expose no feed are `icofa.org`, `mcws.org`, `americanmuslimcenter.org`,
`ism-online.org`, `raleighmasjid.org`, `icntn.org`, `isgoc.com`, `i-sos.org`, `toledomcc.org`,
`berlinmosque.org`, `masjidannur.org` and `islamicfoundation.org`. Dearborn and Nashville are
represented anyway through the Masjidal layer (`nL1JggAa`, `rdRvm3dG`).

---

## 2. Canada, round 2

### 2.1 New dpt year feeds

| Mosque | Domain | Rows | Fit | Gate |
|---|---|---|---|---|
| Kitchener Masjid (MAC) | `kitchenermasjid.com` | 365, 2026 | fajr 14.9° MAE 0.39; isha 15° **capped at 22:10 for 89 days** | page loads `dpt.js`, served from `centres.macnet.ca/kitchenermasjid/` |
| Bilal Centre (Winnipeg) | `bilalcentre.ca` | 365, 2026 | fajr/isha 15° with the November defect below | page loads `dpt.js` |
| Manitoba Islamic Association (Winnipeg) | `miaonline.org` | 334, 1 Jan – 30 Nov 2026 | same, November defect | page loads `dpt.js` |
| Ummah Masjid (Halifax) | `ummahmasjid.ca` | 365, **2025** | **fajr 15.0° MAE 0.18, isha 15.0° MAE 0.21**, solar ≤0.2 | page loads `dpt.js` |

Halifax is the cleanest Canadian year on record so far: plain 15/15, all four solar columns inside
a minute, and a **+2.7 minute dhuhr** caution. It also settles a question the record leaves open:
a Canadian Atlantic mosque prints ISNA 15/15, not FCNA 13/13.

Edmonton, Quebec City, Hamilton and Kitchener-Waterloo were the named targets. Edmonton's dpt
installs do not exist (its mosques are on Masjidal, §2.4); Hamilton's `mahcanada.com` and
`downtownmosque.com` expose no keyless feed; Quebec City is below.

### 2.2 Quebec City: two mawaqit years, both literally 15/15

Quebec City's own sites answer 404 to the dpt route, but both of its mosques publish whole years on
mawaqit, coordinates included:

| Mosque | mawaqit path | Rows | Fajr | Isha | Solar | Jumua |
|---|---|---|---|---|---|---|
| Centre Culturel Islamique de Québec (GMQ) | `/fr/m/cciq` | 365 + 365 iqamah | **15.0° MAE 0.07** | **15.0° MAE 0.15** | all 0.0 | 11:45 |
| Mosquée de la Capitale | `/fr/m/capitale-qc` | 365 + 365 iqamah | **15.0° MAE 0.06** | **15.0° MAE 0.16** | all 0.0 | 12:30 |

Both declare `America/Toronto` (correct for Quebec City) and their published coordinates reproduce
adhan to 0.0 minutes on every solar column across the year. Two independent Quebec City mosques,
two different jumua times, one identical 15/15 calculation: the CCIQ's jumua is 45 minutes earlier,
their isha columns differ by between −6 and +1 minutes across the year, and only 39 of 365 days are
identical across all six columns. Two mosques, one method, their own small house decisions on top.

This retires the record's Canadian sentence that "Quebec's flagship is an image-only calendar (OCR
class)". The image calendar may still exist, but the flagship now has a machine-readable year.

### 2.3 Kitchener: an isha clock cap, a rule the record does not have

Kitchener Masjid prints the 15° isha all year **except 11 May to 7 August 2026, when isha is
pinned at exactly 22:10:00 for 89 consecutive days**. The switch is at the crossing point:
10 May 22:09, 11 May 22:10, 12 May 22:10.

This is a mosque-authored summer ceiling, not an artefact. It is the same shape as the record's
New Caledonia finding (isha pinned 19:45 all year) but seasonal rather than year-round, and it is
the second Canadian mosque after Masjid Toronto that publishes an isha the app cannot derive from
an angle.

### 2.4 The prairie DST cluster: five installs, one defect

The November-2026 block of every prairie install captured here is printed **one hour late**:

| Install | Feed | Shifted block | Everything else |
|---|---|---|---|
| Brandon Islamic Centre (already on record) | dpt `bicmanitoba.ca` | November | correct |
| Bilal Centre, Winnipeg | dpt `bilalcentre.ca` | 1 Nov – 30 Nov | correct to ±0.5 min |
| Manitoba Islamic Association | dpt `miaonline.org` | 1 Nov – 30 Nov | correct to ±0.5 min |
| Markaz Ul Islam, Edmonton | Masjidal `VrdRkwKG` | **1 Nov – 31 Dec** | correct to ±0.5 min |
| Masjid At-Taqwa, Edmonton | Masjidal `pVdwyVLe` | 1 Nov – 30 Nov | correct to ±0.5 min |
| Masjid Al-Fatima, Edmonton | Masjidal `M0dYkvL6` | **1 Nov – 31 Dec** | correct to ±0.5 min |

Two of the Winnipeg feeds are separate installs, not one: across their 334 shared days they agree
on fajr, maghrib and isha on 157 and differ by one minute on 95, so a second copy of the same
parameters rather than a copy of the same file.

The defect travels **across both products** (the WordPress plugin and the Masjidal platform), which
means it sits in the shared generator, not in either plugin. Its signature is the same in all six,
Brandon included:
the post-transition months are computed on the pre-transition offset, so the error appears exactly
at the month the offset changed and disappears at the next cache rebuild. The US profiles in §1.3
are unaffected, so the trigger is the mosque's own saved offset, not the region.

Two Edmonton profiles also carry a **wrong timezone field**: `pVdwyVLe` and `M0dYkvL6` both declare
`America/Regina`, and `VrdRkwKG` declares `America/Edmonton` while its November rows are computed
on −06:00. Whatever the field says, all three print Saskatchewan time.

### 2.5 Edmonton parameters, for the record

Read off the correct months only: Markaz Ul Islam fajr ≈18°, dhuhr +5 min, maghrib +2 min, Shafi
asr; Masjid Al-Fatima Hanafi asr; Masjid At-Taqwa fajr 15° with a different high-latitude rule.
These are not proposed as fits: the November/December blocks corrupt any single-year fit, and the
fits were run on city-centre coordinates because the platform publishes the street address and no
coordinate pair.

---

## 3. Mexico: first dated rows on record

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Mezquita de Guadalajara Isa Ibn Maryam (Zapopan) | `masjidbox.com/tiempos-de-oracion/mezquita-de-guadalajara-isa-ibn-maryam` | community | **7 dated rows**, athan + iqamah + imsak/iftar, `America/Mexico_City` | rolling 7 days |

Captured to `data/mx_guadalajara_isa_ibn_maryam_masjidbox.json`: 2026-11-09 to 2026-11-15, fajr
05:44, sunrise 07:00, dhuhr 12:37, asr 15:50, maghrib 18:14, isha 19:26, with iqamah ten minutes
after the athan on fajr, dhuhr, asr and isha and five after maghrib. Sunrise 07:00 on 9 November is
right for Guadalajara, so the row is at the mosque's own place and clock.

Honest limit: seven days is a surface, not a series. The record's platform note says the Masjidbox
history walks with `begin=`; on the landing page that parameter is ignored for every shape tried,
and the API endpoint is not in the page's own bundles, so the walk was not reproduced. The record's
Mexico row is FALLBACK "second zero", and this capture is the first dated Mexican data found.

Guadalajara's `islamguadalajara.com` answers 403 to the harness and was abandoned. Mexico City,
Monterrey, Islam en México and the Instituto Islámico reopened the record's finding: today-only
displays or no prayer page. `centro-islamico.com` is the Centro Cultural Islámico de **Madrid**,
not Mexico, and its 403 in the earlier report was a false lead.

---

## 4. Central America: two full-year mawaqit surfaces

Both countries are absent from the record, so both start at FALLBACK and both now have a national
mosque publishing a whole year.

| Surface | URL | Tier | Dated data | Coordinates published |
|---|---|---|---|---|
| Mezquita Aldaawa Islámica de Guatemala (Zona 9) | `mawaqit.net/es/m/mezquita-aldaawa-islamica-de-guatemala-zona-9-09-guatemala-guatemala` | community | **365 dated rows + 365 iqamah rows**, jumua 13:00 | 14.610256, −90.515533, `America/Guatemala` |
| Centro Islámico de Honduras (San Pedro Sula) | `mawaqit.net/en/m/centro-islamico-de-honduras-cortes-21104-honduras` | community | **365 dated rows + 365 iqamah rows**, jumua 13:25 | 15.490210, −88.032334, `America/Tegucigalpa` |

### Guatemala is a textbook MWL surface

Fitted over all 365 days: **fajr 18.0° MAE 0.01, isha 17.0° MAE 0.04, sunrise, dhuhr, asr and
maghrib all 0.0 minutes.** That is Muslim World League 18/17 at round-to-minute, Shafi asr, with
no caution offset of any kind. It is the cleanest single surface in this whole sweep and the first
Guatemalan data on record.

### Honduras is the same 18° fajr with three mosque decisions on top

fajr 18.0° MAE 0.01. Then: **isha = 18° + 5 minutes** (MAE 0.06; the plain 18° isha is off by
exactly 5.00), **maghrib = sunset + 5 minutes**, and **Hanafi asr** (+61.5 minutes against Shafi).
The five-minute caution applies to maghrib and isha and not to fajr, and the two asr schools are
61.5 minutes apart at this latitude, which is the largest single-column spread in the sweep.

### The mawaqit trap, checked and cleared

The record calls mawaqit trap-dense and demands today-row anchoring, a solar gate and a
default-identity check before use. Applied here:

- **default identity:** 339 of 365 day-rows are distinct on the Guatemalan page and 331 of 365 on
the Honduran, and the January and July rows differ by about an hour of fajr, so neither payload is
one day repeated.
- **solar gate:** at the published coordinates adhan reproduces sunrise, dhuhr, asr and maghrib to
  0.0 minutes on both pages, across all twelve months. The coordinates are the mosque's own, which
  removes the record's "TZ-FIELD DISTRUST" concern.
- **today-row anchoring** was not run against a rendered clock, because both pages are JavaScript
  shells whose visible block is drawn from the same `confData` that was captured. The solar gate
  stands in its place and is the stronger test here: it would have failed on a shifted clock.

Both remain community tier: neither mosque states a method in text, and the fit is the only
evidence for 18/17.

Costa Rica (Mezquita Omar, San José) and Panama (`islamenpanama.com`) return honest negatives:
Costa Rica publishes through Facebook only, and the Panamanian foundation's page has an "Oraciones"
section that lists services, contains no fajr and no table, and answers 406 to both plausible
prayer-page paths.

---

## 5. The Caribbean, and two traps that are not in the Caribbean

Four countries and two retries, and the answer is mostly negative, but two leads that look like
surfaces are in the wrong hemisphere.

| Country | What was checked | Result |
|---|---|---|
| Jamaica | `kingstonmosque.org` (KMA), `jamaicamuslimcenter.org`, Instagram/Facebook of the Islamic Council of Jamaica | **negative, after two traps** (below) |
| Haiti | Al Fatiha Mosque Port-au-Prince, mosqpedia, Wikipedia, French and English searches | negative: no mosque page, calculators only |
| Barbados | Jama Mosque, Madina Masjid, `madinamasjid.org`, `madinamasjid.us` | negative: Facebook pages and the two US namesakes |
| Bahamas | Nassau masjid, `geocities.ws/nassaumasjid/prayertimes.htm`, Four Roads Freeport | negative: the legacy page is dead, no current mosque surface |
| Guyana (retry) | CIOG site search, `islammessage.org` directory entry, `caribbeanmuslims.com` | **negative confirmed**: CIOG publishes through Facebook, no timetable anywhere |
| Suriname (retry) | `smawebsite.com/salat-timings/`, `gebedstijden` paths, `wp-json` page index | **surface found and verified, §5.2** |

### 5.1 Two traps

- **`kingstonmosque.org` is Kingston upon Thames, Surrey, England.** Its own September-2026 PDF
  says so in print: "Kingston Muslim Association, 55 East Road, Kingston-Upon-Thames, Surrey KT2
  6EJ, Tel: 020 8549 5315". The site offers a monthly PDF on a dated path
  (`/wp-content/uploads/2026/09/September-2026.pdf`, 30 dated rows) and a live daily block. Both
  are London data. The "Download November prayer timetable" link still points at the September
  file, and `2026/11/November-2026.pdf` 404s, so even the English mosque's own link is stale.
- **`jamaicamuslimcenter.org` is Jamaica, Queens, New York.** Masjidal `z0AW66Lj`, address
  "85-37 JMC Way, Jamaica, NY 11432", `America/New_York`, 365 clean 15/15 rows. It is a United
  States mosque and belongs in §1.3, not here. Its own page also carries the Masjidal monthly
  widget, which is how the platform's `from_date`/`to_date` parameters were recovered.

Jamaica is represented by neither site. This is the same shape as the record's Montreal trap
(`islamiccentre.ca` is London, Ontario) and it cost one probe wave to find.

### 5.2 Suriname: the SMA timetable, image-class but real

The Surinaamse Moeslim Associatie (Kankantriestraat 32-40, Paramaribo) publishes a monthly table,
"Tabel Namaaztijden Paramaribo / Nickerie", as a JPG on its "Gebedstijden" page. The newest posted
is **MEI 2025 / DZUL QADA 1446**; the page has not been refreshed since May 2025.

What the sheet contains: nine columns — end of suhoor, begin fajr, sunrise/end of fajr, begin of
the makruh window, begin dhuhr, begin asr, sunset/end of asr, begin maghrib, begin isha — for
Paramaribo, plus a **published town ladder in print**: Nickerie **+8 min**, Moengo **−3 min**,
Albina **−5 min**. A fixed iqamah block sits under the table: fajr 05:45, zuhr 13:55, asr 17:25,
maghrib 20:25, isha 20:15, jumua 14:00. The sheet also advises adding six minutes before and
subtracting five after the printed times.

Transcribed to `data/sr_sma_paramaribo_2025-04-29_2025-05-27.json` and `data/rows_sr_sma_paramaribo_2025.json`:
**29 dated rows**, 29 April to 27 May 2025.

**The transcription verifies itself against the sun, which is the only evidence an image-only
surface can offer.** Fitted over those 29 days at Paramaribo:

| Column | Result |
|---|---|
| fajr | **18.0° MAE 0.03 min** |
| isha | **18.0° MAE 0.86 min** |
| sunrise | +0.5 min |
| dhuhr | −0.1 min |
| maghrib | **+3.2 min** |
| asr | **+63.8 min = Hanafi** |

A single misread digit anywhere in 261 values would show as a spike, and none appears: the sheet
is MWL **18/18** with a +3 minute maghrib, Hanafi asr, and Shafi-style round-to-minute everywhere
else. The printed zuhr (12:38) and the calculated one agree to 0.1 minutes across the month, which
is what makes the transcription trustworthy rather than merely plausible.

This changes Suriname's grade from FALLBACK "current-none" to a **recipe-bearing surface**:
mawaqit-free, platform-free, one national association, 18/18 +3 maghrib Hanafi, with a printed
town ladder. Its limit is publication: month-at-a-time, as a JPG, and the newest posted is seven
months old.

---

## 6. Ecuador and Venezuela

| Country | Surface | Result |
|---|---|---|
| Ecuador | `institutoislamico.org.br` mosque directory entry for the Fundación Islámica Cultural Khalid ibn Al Walid, Quito | **negative**: the directory lists the address (Av. Los Shyris 234 y Eloy Alfaro, La Mariscal) and says "Website: Nao informado". The mosque itself publishes through Facebook only. No timetable, no platform page |
| Venezuela | `mezquitadecaracas.com` monthly PDF | **new surface, 30 rows, §6.1** |

### 6.1 Mezquita de Caracas: a monthly PDF that dates itself by its own weekdays

| Surface | URL | Tier | Dated data |
|---|---|---|---|
| Horario de Oración, monthly sheet | `https://mezquitadecaracas.com/horario-salat.pdf` (linked from `/informaciones/menu mezquita/horario-de-oracion.html`) | community (the mosque) | **30 dated rows**, 2026-10-12 to 2026-11-10, six columns + iqamah block + a ten-city offset ladder |

The sheet is headed "OCTUBRE – NOVIEMBRE – JUMADA AWAL – 1448" and its columns are HIJRI day and
GREGORIAN day. The row for gregorian 12 carries Hijri 1 and the weekday **Lun**; 12 October 2026 is
a Monday and is 1 Jumada I 1448 in the Umm al-Qura calendar, and all thirty weekdays match
sequentially. The month therefore runs 12 October to 10 November, i.e. a Hijri month rather than a
Gregorian one, and today is its last row.

**The method is Umm al-Qura, and the publisher says two different things about it.** The web page
states "El método que ha sido utilizado … es de 'Muslim World League'". The PDF itself stamps
"Umm al-Qura" at the foot. The numbers side with the PDF:

| Column | Measured | Reading |
|---|---|---|
| fajr | 18.5° reproduces the column to a mean of −0.8 min (18.0° is +1.3, 19.0° is −2.8) | Umm al-Qura fajr |
| isha | **exactly maghrib + 89 minutes on all 30 days, zero exceptions** | Umm al-Qura's 90-minute rule at round-to-minute |
| maghrib | sunset + 1.9 min, dhuhr + 1.8, asr + 1.3, sunrise −0.7 | a two-minute caution on three columns |

So the sheet is a national mosque's Umm al-Qura table with a two-minute caution and a fixed isha
interval, published once a month, with a ten-city offset ladder that lets the same sheet serve the
whole country. Venezuela starts at FALLBACK and now has a surface.

**Defect: the two surfaces disagree about the ladder.** The PDF prints Valencia +5, Maracay +3,
San Felipe +6, Acarigua +9, Barquisimeto +10, Coro +15, **Maracaibo +19, Bolívar −12**, Porlamar
−13, Maturín −15. The web page prints **Maracaibo +09** and **Bolívar +10**. For Bolívar the sign
differs as well as the value, and the two differ by 22 minutes for that city. Anyone consuming the
ladder must take the PDF, and nobody should take both.

The iqamah block is a separate, fixed set — fajr 05:30, dhuhr 13:00, asr 16:00, maghrib 10 minutes
after the athan, isha 20:00 — printed on the sheet and unchanged by month, while the athan columns
move. Athan moving and iqamah fixed on one sheet is exactly the shape the record's v2.1
`jamaahRules` field exists for.

---

## 7. Chile: December is not out, November is unchanged

| Surface | URL | Result |
|---|---|---|
| December 2026 page | `https://radioislam.cl/horarios-diciembre/` | **404**, and `horarios-2026/` is 404 too |
| December files | `uploads/2026/11/Diciembre-2026-{1..18}.pdf` and `uploads/2026/10/…`, 36 URIs | **all 404** |
| November 2026 page | `https://radioislam.cl/horarios-noviembre/` | 200, same 18 buttons as the capture taken earlier today |

The November page has not refreshed since this morning's capture, so a re-download would be the
same bytes. Its eighteen buttons are seventeen `Noviembre-2026-N.pdf` under `uploads/2026/10/`
plus the **Viña del Mar button still pointing at
`2026/10/Octubre-2026.xlsm-Grupo_Parte7.pdf`**, which is the third consecutive month of that
defect and no longer a one-off. The unlinked correct file, `uploads/2026/10/Noviembre-2026-7.pdf`,
answers 200 as before.

December therefore stands where the record put it: expected around 29 November, absent today.

---

## 8. What this confirms in the record

- **The US mosaic and the 15/15 skew.** Seven more US mosques, in six states, are plain ISNA 15/15
  at round-to-minute, and two of them print Hanafi asr. Not one states any method on its own page.
  The record's "published FCNA 15/15 is printed by almost nobody" gains seven silent witnesses and
  still not one FCNA 13/13.
- **The live-page gate is still the right law, and it now has a third shape.** Manchester was a
  feed contradicting its page; IANT was a feed contradicting its widget. Toledo is a feed that
  contradicts **itself** across a DST boundary while its page renders it faithfully.
- **Canada follows 15/15, not 13/13, and does so in print on three coasts.** Halifax, both Quebec
  City mosques and Kitchener publish the 15° pair; only the two Toronto mosques use fixed
  post-maghrib intervals. The record's "Quebec's flagship is an image-only calendar" is retired.
- **The dpt defect list was incomplete in a specific way.** Brandon's November block was recorded
  as one mosque's fault. It is at least six installs across two products, in one region, with one
  signature.
- **The record's Chile conversion is untouched.** December is still absent, November is byte-stable
  within a day, and the Viña del Mar link defect is now three months old.
- **The record's platform note for Masjidal was unusable as written** and is now usable: the span
  parameters are `from_date` and `to_date`.

## 9. What deserves a fit

1. **Guatemala, now.** 365 rows of literal 18/17 MWL at 0.01/0.04 minutes with the mosque's own
   coordinates. One page load is the whole year, so a second year costs one request and would lift
   a new country's grade in a single step.
2. **Venezuela, as the hemisphere's Umm al-Qura anchor.** 30 rows now; a monthly fetch would build
   the series. Three things make it worth the wait: the printed method, the exact 89-minute isha
   interval, and a national offset ladder that lets one sheet stand for ten cities.
3. **Quebec City as a Canadian pair.** Two mosques, 365 days each, 15/15 to 0.07 minutes, one page
   load apiece, coordinates and iqamah included: the cheapest two-mosque Canadian anchor available.
   Halifax sits beside it as the Atlantic dpt witness to the same 15/15.
4. **Honduras, for the asr spread.** Hanafi asr 61.5 minutes off the Shafi column at 15.5° N, with
   a five-minute caution on maghrib and isha and none on fajr: a good test of whether the app's
   per-column offsets can be expressed at all.
5. **Kitchener's isha cap.** 89 days pinned at 22:10. If the app ever models a mosque-authored
   summer ceiling this is the cleanest instance in the hemisphere, and it is a second Canadian
   ruling beside Toronto's fixed intervals.
6. **Suriname, for a national recipe with no platform in it.** 18/18, +3 maghrib, Hanafi asr,
   verified to 0.03 minutes over 29 days, and the only Caribbean surface found that is neither a
   calculator nor a Masjidbox profile. The fit needs a month that is not seven months old.
7. **Nothing in Chile yet.** The record's conversion stands unchanged.

## 10. Honest negatives, and where the sweep was weak

- **USA.** 204 domains, 2 dpt hits, 5 new Masjidal ids. The negative is weakest here: 133 of the
  204 domains do not resolve at all, so the sweep proves the guessed-domain list is wrong, not that
  the metros have no feed. The 20-metro conclusion in the earlier report is not disturbed; the
  smaller-metro conclusion should be read as "nothing found on the domains I could name".
- **Canada.** Hamilton exposes no keyless feed; Edmonton publishes through Masjidal only. The
  prairie DST cluster means five of the nine Canadian captures need a shift correction before use.
- **Mexico.** Seven days is a surface, not a series, and the platform's history walk did not
  reopen from the landing page.
- **Central America.** Guatemala and Honduras are good; Costa Rica and Panama have no surface.
- **Caribbean.** Jamaica, Haiti, Barbados and the Bahamas are genuine absences at the mosque level,
  reached after searching in English, Spanish and French. Two of the four "Jamaica" leads were the
  wrong country, which is the more useful result.
- **Guyana.** Second negative in a row; CIOG still publishes through Facebook.
- **Suriname.** Best result of the Caribbean pass: a surfaced national recipe (18/18, +3 maghrib,
  Hanafi asr) that reproduces to 0.03 minutes, held back only by image-class monthly publication
  seven months stale.
- **Ecuador.** The mosque has a street address and a telephone number and no web surface.
- **Chile.** December absent; nothing new to capture.
