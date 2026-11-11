# O1k europe — report

Tag `europe`, workspace `census/o1k-wide/europe/`. 12 countries. Public pages only,
no logins, no forms. Raw pages in `captures/` (102 files), normalized dated rows in
`data/` (33 files). All times transcribed as printed; no synthesis.

## Norway

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Rabita (Det Islamske Forbundet) | rabita.no/bonnetider | community (IRN line) | Nov+Dec 2026 Oslo, 61 rows | 2026 |
| Mawaqeet network | mawaqeet.no wp-content/uploads/2025/01/{Oslo,Bergen,Stavanger,Drammen}.pdf | community | full-year PDFs, 12 monthly pages each | 2026 |
| islamweb.no / Jamiat Ulama Norway | islamweb.no/phpToPdf/createPDF.php?place=N | community | full-year PDFs for 7 cities (Oslo, Bergen, Stavanger, Drammen, Kristiansand, Sandnes, Skien), 365 rows each | 2026 |
| ICC Norway | islamic.no/bonnetider | community (IRN line) | today's row + stated source | 2026 |
| WIM Den blå Moske | wim.no/bonnetider | community | JS-rendered; Google-rendered Nov 10 Fajr 05:50 = IRN | 2026 |
| Drammen Moske | drammenmoske.no | community | today's athan + jamaat times | 2026 |
| Bergen moske Avd Sotra | masjidbox.com/bonnetider/sotra-moske | community (display platform) | Nov 10 row with iqamah | 2026 |
| Lindeberg Moske | masjidbox.net/lindebergmoske/prayer-times | community | month table (Nov-Dec), 29 rows visible | 2026 |
| Mevlana Stavanger | mevlanastavanger.no | community (Diyanet line) | method statement; times JS, not server-rendered | 2026 |
| Eyüp Sultan Stavanger | eyupsultan.no/bonnetider | community (IGMG/Diyanet line) | statement only ("vi følger IGMG appen") | 2026 |
| IRN platform | bonnetid.no | authority-line (IRN) | IRN Oslo numbers; backed by disp-api.bonnetider.eu + Supabase (endpoints 404) | 2026 |

**Confirms:** Rabita Oslo Nov 10 = IRN bonnetid.no exactly (05:50/12:05/14:03/16:04/18:01); mawaqeet Oslo/ Bergen/Stavanger 2026 PDFs re-captured, match the archived record line.

**New — the schism map (was unmapped):**
- **IRN 16/15 line:** Rabita Oslo (publisher), ICC Norway Oslo (stated on page: "Bønnetidene hentes fra Bønnetid (Islamsk Råd Norge)"), WIM Oslo (05:50 match), Drammen Moske (dhuhr/asr/maghrib match JU exactly, fajr/isha match IRN family), Bergen moske Avd Sotra (fajr 06:12 ≈ IRN 16°, asr 2x 14:04, isha maghrib+117→119).
- **Mawaqeet 18/15 line:** Lindeberg Moske Oslo — states "Besøk www.mawaqeet.no" AND its printed fajr/sunrise/dhuhr/maghrib/isha match mawaqeet Oslo to the minute (Nov 27: 06:06/08:42/12:10/15:31/17:39 vs mawaqeet 06:06/08:42/12:10/15:31/17:39; IRN prints 06:22, JU 06:59 that day).
- **THIRD LINE discovered: Jamiat Ulama Norway (islamweb.no)** — 7-city full-year 2026 PDFs, self-declared "utarbeidet av Jamiat Ulama Norway". Oslo Nov 10: fajr 06:20, isha 17:34 — neither IRN (05:50/18:01) nor mawaqeet (05:36/18:02). Deep winter: Bergen Jan 1 fajr = sunrise−106 min, isha = maghrib+98.
- **Diyanet line:** Mevlana Stavanger (declares Diyanet method; site defective — Oslo coordinates 59.9139/10.7522 printed as "Stavanger", Oslo street address), Eyüp Sultan Stavanger (IGMG app).
- Bergen Moske (bergenmoske.no) publishes NO times: template placeholders ("Tider står som eksempel. Bytt til moskeens tider før publisering").
- Mawaqeet's schism article captured (mawaqeet.no/artikler/hvorfor-vi-ikke-skal-folge-den-nye-irn-tabellen/).
- iBønn app (App Store) offers "Velg mellom IRN- og Mawaqeet-bønnetider" — the two-line split is encoded in the national app.

**Fit-worthy:** the 7× islamweb/JU city-years (largest untouched coherent set; a third Norwegian recipe), the three mawaqeet 2026 city-years.

**Negatives:** ICC Oslo's monthly PDF link (islamic.no/bonnetider-kalender.pdf) serves HTML, broken. bonnetid.no API endpoints 404. Islam Net prayer page is a Joomla DB error. Baitun Nasr (Ahmadiyya, furusetmoske.no) homepage carries no times.

## Iceland

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Félag múslima á Íslandi API | felagmuslima.is/api/prayer-times?city=C&date=YYYY-MM-DD | authority-tier national body | 365 days × 2 cities (Reykjavik + Akureyri) | 2025 (new) |

**New:** the API takes any date. Captured full 2025 for Reykjavik AND Akureyri (65.7°N — the second city the record's lift asked for, to resolve the asr quirk). Cities served found by probing: Reykjavik, Keflavik, Akureyri, Borgarnes, Hella, Husavik (6). `city` param is case-sensitive exact ("Reykjavik" not "reykjavik"). `year`/`month` params are ignored; `date` works freely. Record's fit was 242 days of one year; now two distinct years exist (2025 banked + record's 2026).

## Estonia

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Eesti Islamikeskus generator | eestiislamikeskus.org (index + app.js) | community | Tallinn + Tartu, every month of 2026 AND 2027, 730 rows/city, 1,460 total | 2026+2027 |

**New:** the site is a client-side generator whose full engine ships in app.js (captured verbatim). METHOD block: fajr/isha 15/15, asr shadow 1, sunrise/sunset −0.833, dhuhr/maghrib +0, highLatitudeDivisor 60, fajr clamp 45–120 min before sunrise, isha May–Aug fixed maghrib+90, other months 15° with per-month maxAngleMinutes (180–240) fallback to maghrib+90, 30-min isha/fajr safety gap both directions. Ran their engine headlessly (Node) with their own rounding (fajr/sunrise round, dhuhr/asr/maghrib/isha ceil, 12h AM/PM display). Years 2024–2100 selectable on the site; 2026+2027 banked — the multi-year set the record lacked.

## Netherlands

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Essalam Rotterdam | essalamrotterdam.nl/gebedstijden | community | rolling month table, 29 dated rows (Nov 10–Dec 9 2026) | 2026 |
| Moskeewijzer | moskeewijzer.nl/times/2026/<City>_2026.xlsx + .pdf | community (2023 consensus catalogue) | Rotterdam full year 365 rows as day-fractions; ~240 city files listed | 2026 |
| El Islam mosque | elislam.nl/gebedstijden | community | today's row | 2026 |
| koran.nl network | koran.nl/gebedstijden-<place> | community | method essays (MWL 18/17, ISNA, Islamic Center Aachen in Haaglanden/Utrecht since 2019); tables JS-loaded | 2026 |

**Confirms:** the 2023 national consensus scheme is real and published — moskeewijzer.nl states "De meeste moskeeën zijn in 2023 overeengekomen..." with the International Platform for Prayer Times (salatcalendar.com) as method; its Rotterdam year shows the FIXED CAPS literally true (Jun 21 fajr 03:30 / isha 23:30 exactly).

**New:** the whole consensus catalogue (per-city 2026 xlsx+pdf for ~240 cities) is a standing year-archive one fetch per city. Rotterdam banked.

**Negative:** Essalam's table is current-window only (no month params: `?month=12&year=2026`, `/2026/12/`, `?m=2026-12` all return the same rolling table); the year-long capture needs 12 monthly visits or Wayback. mawaqit.net mosque page (id 4630) is a JS app; api.mawaqit.net routes 404 without a key (key requires signup — not taken). Wayback was offline at first attempt; when it returned, its wakf/essalam snapshots were not helpful (see Denmark).

## France

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| GMS Strasbourg | mosquee-strasbourg.com/wp-content/uploads/pdf-prieres/gms-cal-YYYY-MM.pdf | community | Nov 2026 (30 rows) + Dec 2026 (31 rows) parsed | 2026 |
| GMS live page | mosquee-strasbourg.com/horaires.php | community | today's row; cross-checks the PDF parse (Nov 10: 05:41/12:18/14:37/17:04/18:33 exact match) | 2026 |
| Grand Mosque of Paris | grandemosqueedeparis.fr/post/emsakiat-ramadan-2026-1447-h-... | authority | Ramadan 2026 Paris, 30 dated rows (Feb 18–Mar 19) transcribed from the poster image | 2026 |
| GMP horaires page | grandemosqueedeparis.fr/horaire-des-prieres-paris | authority | NO prayer table — jumu'ah khutba times only | — |

**Confirms:** the two-panel parse trap is real and handled — the PDF draws day numbers 16–30 + their rows FIRST, then 1–15; fixed by extracting all 6-time rows and sorting by sunrise (monotonic Nov 1→30), weekday-validated (Nov 1 2026 = Dim). Columns print as Fajr/Shuruk/Dhuhr/Asr/Maghreb/Isha despite the mangled RTL header.

**New:** GMP's own Ramadan calendar is a real authority-tier dated table (transcribed from their poster image, 30 rows with imsak). The regular GMP "Horaires" page holds no dated table at all — negative on GMP non-Ramadan tables.

**Negative:** no publisher method statement found on mosquee-strasbourg.com (searched French; the sweeps stay unfitted, as the record holds).

## Germany

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Diyanet international portal | namazvakitleri.diyanet.gov.tr/de-DE/{11019 Köln, 11002 Berlin, 11010 Frankfurt} | authority (the scheme's own source) | FULL YEAR 2026 inline tables, 365 dated rows each (imsak/fajr=sunrise/sunrise/dhuhr/asr/maghrib/isha) | 2026 |
| DITIB Essen (mosque layer) | ditib-essen.de/gebetszeiten | community (DITIB mosque) | widget-embedded; Google-rendered values match the Diyanet family | 2026 |

**New — the record's named gap ("NO standing series banked") is closed at authority level:** Diyanet's own portal serves complete German city-years for Köln, Berlin, Frankfurt in German (1,095 rows banked). The German page prints 6 time columns (Morgengebet(Fastenbeginn)=fajr=imsak — consistent with the adopted "imsak row = fajr"; Sonnenaufgang/Mittagsgebet/Nachmittagsgebet/Abendgebet/Nachtgebet). These are Diyanet's numbers, which DITIB's Religionsbeirat adopted (18/16) — the standing series the record asked to bank.

## Sweden

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Göteborgs Moské | goteborgsmoske.se/bonetider/bonetider_2026.pdf (apex domain; www hits a Simply.com browser-check) | community | FULL YEAR 2026, 365 rows, 12 monthly pages | 2026 |
| Angeredsmoské | angeredsmoske.se/bonetider | community | Nov 2026, 30 rows (Friday dhuhr carries `*` jumu'ah marker) | 2026 |
| Imam Ali Center | imamalicenter.se/Bonetider-pdf/Goteborg.pdf | community (Shia center) | Nov 2026 Göteborg month poster; table is graphical (not text-extractable) | 2026 |

**Confirms:** January fajr frozen at 06:25 exactly as the record holds; source stated in the PDF: "Källan för bönetider: www.awqatsalah.com".

**New:** the Göteborg year capture the record named as the closing move is banked (365 rows, 0 weekday mismatches). Quirk: the PDF prints jumu'ah time (12:15) IN the dhuhr column on Fridays — a fit must skip or model Fridays.

## Finland

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| rukousaika.fi (HIC-linked) | rukousaika.fi + wp-content/uploads/2026/02/Helsinki-2026.pdf | community | FULL YEAR 2026 Helsinki, 365 rows + PUBLISHED METHOD | 2026 |
| rabita.fi | rabita.fi/fi/rukousajat | community | Nov 2026 Helsinki, 30 rows | 2026 |
| rukousajat.fi portal | rukousajat.fi (React SPA) | community | computes client-side (bundled adhan engine, night-portion branch latitude>=55); no fetchable series | — |

**New — the record's open lift is closable:** rukousaika.fi publishes its method statement verbatim: table by the International Astronomical Center per MWL rules, lat 60:10N lon 24:58E, dawn angle 18°, night angle 17°, summer = "1/5 yöstä" (1/5 of night), altitude 120 m, keskipäivä +2. The Helsinki year PDF parses to 365 dated rows (Jun 21 isha 00:17 = maghrib 22:56 + 81 min — note: the MWL/ICOP table's own rule, distinct from the mosque's stated maghrib+85 jamaah override; the stated/observed gap narrows to a jamaah-vs-table distinction). rabita.fi gives a second Helsinki November witness.

**Negative:** rukousajat.fi (the recorded portal) serves no dated series to fetch — times are computed in-browser; banking its year would require re-implementing its bundled engine.

## Denmark

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| DIT (Wakf) | wakf.com | community | homepage one-day row (Nov 10: 05:47/07:31/11:55/13:48/16:15/17:52) | 2026 |
| salah.dk | salah.dk | community | homepage one-day row (Nov 10: 05:48/07:34/11:55/13:47/16:12/17:59, +hanafi asr 14:20) | 2026 |
| Tawhid masjidka | masjidka.com | community | one-day row (Nov 10: 06:45/08:33/12:55/14:49/17:15/18:57 — shuruq an hour late; clock artifact, recorded not trusted) | 2026 |

**Confirms:** the record's live-day fit reproduces exactly: wakf isha = maghrib+97 (16:15+97=17:52).

**Negative (honest):** the 30-day series remains unreachable. No calendar path on wakf.com responds (8 path probes: 404s; `index.php?id=bonnetider` 301→homepage). adan.dk returned HTTP 454. Wayback came back online during the session: only homepage snapshots exist for wakf.com (10 in 2026, one day each) and ALL fetched copies are the "Age restricted content" consent interstitial (10,319 bytes, NOINDEX) — the archived pages are gated. Searched Danish: bønetider/bedetider/bønnetider + city names; salah.dk and bedetider.dk are client-side calculators, not publisher series.

## Switzerland

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| IZRS Ramadan calendar | izrs.ch/ramadankalender | authority (federation) | Ramadan 2026 Zürich, 30 dated rows (Feb 18–Mar 19), public page | 2026 |
| IZRS homepage | izrs.ch | authority | one-day Zürich row + "Ganzer Monat" JS view; note of an ongoing isha review | 2026 |
| Iman Zentrum Volketswil/ZH | imanzentrum.ch/gebetszeiten + masjidbox.com/gebetszeiten/imanzentrum | community | one-day row with iqamah (Fajr 05:42, Ishaa 19:20 = maghrib+84 — mosque-adjusted, stated on their page) | 2026 |

**Confirms:** the record's "publication only, nothing fitted" state; the IZRS Ramadan table is the first printed IZRS rows banked.

**Negative:** the IZRS full Gebetszeiten calendar (Ramadan Kalender PDF CH) is GATED — "Registrierung nötig... Bronze Mitgliedschaft... angemeldet" (login required; not taken per standing rules). islam.ch/gebetszeiten returns 404 to curl (search-index stale). The one-city-year lift remains open via 12 monthly homepage/month-view fetches.

## Austria

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| IZW permanent calendar | izwien.at/gebetszeiten + Drive folder (XLSX id 1waW-buD-lMDkkFLajZfweITOD9259ZE4) | community | the XLSX edition currently on offer = 2025 (365 rows, day-fractions) | 2025 |

**New/finding:** the requested "2027 edition" DOES NOT EXIST as a separate artifact — the calendar is permanent by design ("2025 bis 2028 / 2030 bis 2034", one-minute/year drift, 2029 leap correction). The only file published in the Drive folder is `IZW JAHRESGEBETSZEITEN 2026.xlsx` whose data grid is the 2025 edition (serial 45658 = 2025-01-01 through 2025-12-31, 365 rows banked). DST behaviour in this file: +60 min lands between Mar 28–29 2025 (a day before Austria's Mar 30 switch) and the Oct 26 2025 end is NOT applied — worth one audit line against the record's "applies DST exactly on the DST dates" finding, which was measured on the 2026-labeled artifacts.

**Negative:** no 2026/2027 XLSX published; IGGÖ published recipe as the authority alternative remains the open lift, not attempted this run.

## Italy

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| UCOII orari service | ucoii.org/orari-preghiera (SPA) → api.aladhan.com/v1/calendarByCity?city=C&country=Italy&method=3 | community federation (wrapper) | Roma, Milano, Torino, Bologna — Nov 2026, 30 rows each | 2026 |

**New — mechanism identified:** UCOII's per-city prayer service is a client-side wrapper around AlAdhan `calendarByCity` with `method=3` (MWL 18/17), Hijri padding logic included in their bundle. The census's "MWL declared" is confirmed at the mechanism level; the surface is a calculator embed, not a UCOII-computed table. Captured the exact served payloads for 4 cities (task asked 3+) and normalized them.

---

## Session notes

- Wayback Machine was offline at session start ("Temporarily Offline"), returned later; its wakf.com copies are consent-gated (see Denmark).
- bonnetid.no (IRN platform) is a Vite SPA backed by disp-api.bonnetider.eu + Supabase; public endpoints 404 — the mosque register behind it is not public.
- Every download above is from a public page; no login, registration, form or challenge was solved. Google Drive fetches are anonymous `uc?export=download` on a publicly shared folder linked from izwien.at.
- The Iceland capture ran as a background loop (730 requests, 0.25 s pacing); Norway's schism map and all other captures are direct fetches with a browser UA via curl; TinyFish carried all searches.
