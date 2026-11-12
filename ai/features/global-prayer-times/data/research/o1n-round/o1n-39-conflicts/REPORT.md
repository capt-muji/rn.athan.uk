# O1n-39 conflicts - the census's conflict class, measured (round four o1n, session three)

Measured 2026-11-12 (UTC). Wave o1n-39. Workspace:
`$HOME/athan-gitree/census/o1n/o1n-39-conflicts/`. One section per pair, written
incrementally as each pair banks. Every delta is a measurement, never an adjudication.
Held baselines come from FIT-INDEX-ROUND5 and the named prior workspaces, never re-fit.

## 1. Libya - platform-vs-mufti identity (tawkit Tripoli vs api.ifta.ly)

FIT-INDEX-ROUND5 entry: LY-TRIPOLI-ALI-BIN-ABI-TALIB conflict set plus O1n-12's identity
block (the Dar al-Ifta's Tripoli row identical to the platform's on 2026-11-11).

- Claim A (mufti): `api.ifta.ly/api/v1/prayer-time` serves a rolling today-plus-seven
  window of Tripoli rows.
- Claim B (platform): `tawkit.net/en/prayer-times/libya/tripoli/timetable/` carries the
  mufti's house line at its reference city.

Today's measurement (fetched 2026-11-12 UTC, `captures/ly-iftaly-prayertime-*.json`,
`captures/ly-tawkit-tripoli-*.html`):

- Side A still serves its held line: all seven overlap days of the held 2026-11-11
  window (11-11 through 11-17 available today) reproduce the held rows to the second,
  delta 0.0 min on every column. The window has rolled by exactly one day, as held.
- Side B still serves its held line: its 2026-11-11 grid row equals the held identity
  row 06:07 / 07:33 / 12:54 / 15:47 / 18:12 / 19:34.
- Delta between the two sides on 2026-11-12: 0.0 min on all six columns
  (fajr 06:07, sunrise 07:34, dhuhr 12:55, asr 15:46, maghrib 18:11, isha 19:34).

Verdict as measurement: the identity measured on 2026-11-11 re-measures identical on
2026-11-12 on a fresh fetch of both sides. Data: `data/ly-ifta-vs-tawkit.json`.

## 2. Iraq - the Diwan endpoint vs the platform's Baghdad row (IQ-TAWKIT-145 conflict set)

Held: on 2026-11-11 the Diwan's bare endpoint and the platform's Baghdad row were
identical in all six columns (O1n-12's "two lines are one" finding; held platform rows
`o1m-24-levant/data/tawkit-levant-rows.json`, 365 days Baghdad 2026-11..2027-10).

Today's measurement (fetched 2026-11-12 UTC, `captures/iq-eldwan-prayertimes-*.json`,
`captures/iq-tawkit-baghdad-*.html`):

- Side A (Diwan, `eldwanapp.jeeteak.com/api/prayer-times`, bare parameter-free GET)
  still serves, still one row per day: 05:05 / 06:30 / 11:52 / 14:44 / 17:05 / 18:22
  for 2026-11-12.
- Side B (tawkit Baghdad November grid) serves its held 2026-11-11 row unchanged
  (05:05 / 06:29 / 11:51 / 14:45 / 17:06 / 18:23, delta 0.0 on every column against the
  held bank) and its 2026-11-12 row 05:05 / 06:30 / 11:52 / 14:44 / 17:05 / 18:22.
- Delta between the two sides on 2026-11-12: 0.0 min on all six columns.

Verdict as measurement: the two Iraqi lines re-measure value-identical on the second
sampled day, one day after the held finding. The per-city divergence recorded in the
conflict note is untouched by this pair. Data: `data/iq-diwan-vs-tawkit.json`.

## 3. Qatar - the ministry's gateway vs the masjidi Al-Rayyan table (QA-MINISTRY-3-YEARS / QA-MASJIDI-164 conflict set)

Held: the ministry's gateway recipe (fajr 18.42 deg at floor(raw)+1, isha maghrib+90)
fits four years; the masjidi Qatari table 164 "fails the same test (fajr 18.575, isha
interval 20.1)" and is recorded as a second Qatari line, never merged with the platform's
maghrib+90.

Today's measurement (fetched 2026-11-12 UTC, `captures/qa-gateway-*.json`,
`captures/qa-masjidi-table164-*.json`):

- Side A (ministry gateway, `PrayerTimes?date=12-11-2026`) still serves its held line:
  04:29 / 05:49 / 11:18 / 14:25 / 16:49 / 18:19 - delta 0.0 min on every column against
  the held 2026-11-12 row.
- Side B (masjidi table 164) still serves its held line: the 366-row perpetual month
  template is content-identical to the held capture row for row, and its scaffold-mapped
  2026-11-12 row (row 316 on the held 2028 leap scaffold) reads 4:29 / 5:49 / 11:19 /
  14:26 / 16:49 / 18:19.
- Delta between the two sides on 2026-11-12 (masjidi minus ministry, minutes): fajr 0,
  sunrise 0, dhuhr +1, asr +1, maghrib 0, isha 0.

Verdict as measurement: both sides still serve their held lines; on this date the two
lines nearly coincide (0-1 min), while the held recipe families behind them remain
distinct and unmerged - the conflict record stands as a recipe-level disagreement, and
today's row-level coincidence does not adjudicate it. Data:
`data/qa-ministry-vs-masjidi164.json`.

## 4. Kuwait - the two ruznama lines, measured where measurable (KW-MASJIDI-144, O1n-12/O1n-23 blocks)

Held: the ministry publishes no prayer page; the line it adopts is the Al-Ojeiri almanac
(held 2026 year `o1m-27-gulf/data/kw-kuwait-2026-rows.json`); the ministry's own official
2026 ruznama is banked as twelve monthly images whose cell extraction is CLOSED (the
O1n-23 negative, every attempt banked); masjidi table 144 carries a Kuwait national table.

Today's measurement (fetched 2026-11-12 UTC, `captures/kw-alojeiri-calendar-*.html`,
`captures/kw-masjidi-table144-*.json`):

- Side A (alojeiri.com calendar) still serves its held line: 04:47 / 06:09 / 11:32 /
  14:34 / 16:55 / 18:14 for 2026-11-12, delta 0.0 min on every column against the held
  2026-11-12 row.
- Side B (masjidi table 144, 366-row 2028 scaffold) still serves its held capture
  content-identical, and its scaffold-mapped 2026-11-12 row equals Side A's row to the
  minute (delta 0.0 on all six columns).
- Side C (the ministry's official 2026 ruznama, twelve images) remains unextractable:
  the held OCR closure stands; no cell measurement exists for it today, and that is a
  dated fact of this conflict file, not a new attempt.

Verdict as measurement: the two measurable Kuwait lines (the almanac's own surface and
the masjidi national table) agree to the minute on 2026-11-12 and each still serves its
held capture; the ministry print stays the unmeasurable side of the ruznama pair. The
tqwem Ramadan-only third line has no overlap date with today and is untouched. Data:
`data/kw-ruznama-lines.json`.

## 5. Saudi Arabia - the Umm al-Qura grid: -2 edge cells and the coordinate-only endpoint (SA-GRID-225-POINTS conflict set; O1n-5 F-SA-EDGE-CELLS closure)

Held: 194 outlier cells, all exactly -2, confined to Al Jawf and Northern Borders on 15
dates (hy 1449/1450), closed as a publisher edge with the recipe and grade standing; the
endpoint is coordinate-only (city, cityId, id and name return one byte-identical default
payload).

Today's measurement (fetched 2026-11-12 UTC, `captures/sa-grid-al-jawf-00-1449-*.json`,
`captures/sa-grid-al-jawf-00-1450-*.json`, `captures/sa-grid-al-bahah-00-1449-*.json`,
`captures/sa-grid-probe-*.json`):

- The publisher still serves the grid byte-exact: refetched hy 1449 and hy 1450 at the
  northern point al-jawf-00 (29.64N, 37.6375E) equal the held rows on all 4,248 compared
  cells, zero diffs, and the southern control al-bahah-00 matches held likewise on the
  edge dates.
- The -2 edge still serves exactly as held: all 90 edge-date cells (15 dates x 6 columns
  across both hijri years) are byte-equal to the held rows; the anomaly is not a transient.
- The coordinate-only claim re-proves: appending city=Riyadh, city=Jeddah, cityId=7,
  id=99 and name=Makkah to the same coordinate request returns byte-identical payloads
  (one sha256 across all six bodies).

Verdict as measurement: the conflict's both facts re-measure unchanged on fresh fetches -
the edge behaviour persists as served data and the endpoint's axis stays coordinate-only.
No adjudication. Data: `data/sa-grid-edge-refetch.json`.

## 6. Yemen - the two authorities' Aden diff (YE-AWQAF-6-GOVERNORATES conflict set; O1n-12 quantification)

Held: the ministry feed (yemenawqaf.org) and the Sanaa-based General Authority (awqaf.ye)
are two distinct authority lines, quantified on Aden 2026 as yemenawqaf minus awqaf.ye:
fajr +6, sunrise 0, dhuhr -8, asr -1, maghrib -6, isha +4. The two are never blended.

Today's measurement (fetched 2026-11-12 UTC: ministry Livewire walk
`captures/ye-yemenawqaf-aden-2026-11-fresh.*`; authority browser-session fetch
`captures/ye-awqafye-aden-cid2-2026-11-fresh-*.json` - curl on awqaf.ye is 403, the
route tried and recorded):

- Side A (ministry) still serves its held line: 04:50 / 05:57 / 11:46 / 15:03 / 17:31 /
  18:40 for 2026-11-12, delta 0.0 min on every column against the held Aden row.
- Side B (authority) still serves its held line: 04:44 / 05:57 / 11:54 / 15:03 / 17:37 /
  18:36 for 2026-11-12, delta 0.0 min on every column against the held row (its print is
  a 12-hour clock on asr/maghrib/isha, mapped by column context).
- Delta between the two authorities on 2026-11-12 (ministry minus authority, minutes):
  fajr +6, sunrise 0, dhuhr -8, asr 0, maghrib -6, isha +4 - identical to the held
  quantification except asr, which measures 0 today against the held -1 (the held note
  quantified Aden 2026 as a year; today is one sampled day of it).

Verdict as measurement: both authorities still serve their held lines and the two lines
remain separated by the held gaps on today's row. Data:
`data/ye-aden-two-authorities.json`.

## 7. The African ladder at Monrovia - turktakvim vs athanpro vs Fazilet (TT-PLATFORM-10-COUNTRIES conflict note)

Held: athanpro's Monrovia fajr sits about 12 minutes later and isha about 15 minutes
earlier than turktakvim's on the same days (the TT-PLATFORM-10-COUNTRIES note); the
turktakvim gazetteer entry TT-AFRICA-8565 carries the platform ladder; Fazilet Monrovia
is a separate line in the FAZILET-248-CITIES bank.

Today's measurement (fetched 2026-11-12 UTC: `captures/lr-turktakvim-monrovia-8708-*.html`
(annual page, cityID 8708, 365 rows parsed), `captures/lr-athanpro-monrovia-*.html` plus
`captures/lr-athanpro-monrovia-nextdata-*.json`, `captures/fz-lr-monrovia-daily-*.json`):

- turktakvim still serves its held line: the fresh annual page equals the held bank on
  all 2,920 compared cells (366 dates x 8 columns minus the bank's 11-11/11-12 overlap
  already equal), zero diffs.
- athanpro still serves its held generation but NOT the current month: both the SSR page
  and the `_next/data` JSON route serve September 2026 on a 2026-11-12 fetch - the city
  page's month axis has not rotated six weeks past September. Its served September rows
  reproduce the held conflict ladder exactly: athanpro minus turktakvim on the served
  same-days, September median (and day 12 identical): fajr +12, sunrise +5, dhuhr -7,
  asr -6, maghrib -5, isha -15 minutes.
- Fazilet Monrovia today (2026-11-12) reads 05:31 / 06:30 / 12:34 / 15:54 / 18:29 /
  19:35 against turktakvim's fresh same-day row (sabah 05:20, sunrise 06:27, dhuhr 12:34,
  asr 15:56, maghrib 18:28, isha 19:38): deltas fajr +11, sunrise +3, dhuhr 0, asr -2,
  maghrib +1, isha -3 minutes.

Verdict as measurement: the recorded three-publisher disagreement re-measures intact -
turktakvim byte-stable, athanpro frozen on the September generation carrying the exact
+12/-15 twilight split, Fazilet a third line within 3 minutes of turktakvim on five of
six columns and +11 on fajr. Data: `data/af-ladder-monrovia.json`.

## 8. Oman - the ministry's 18/18 grid vs the platform's 18/17 layer (OM-MARA-86-CITYIDS conflict note)

Held: the ministry (mara.gov.om calendar_page2.asp, CityID 0 = Muscat) runs fajr 18 /
isha 18; the tawkit Oman layer runs 18/17 - a different pair. Held rows:
`o1m-27-gulf/data/om-named-rows-2026.json` (Muscat, 365 days) and
`o1m-6-mideast/data/tawkit-rows.json` (oman/muscat, the eleven-month window).

Today's measurement (fetched 2026-11-12 UTC: `captures/om-mara-cid0-*.html`,
`captures/om-tawkit-muscat-*.html`; a first fetch at CityID 1 served Ibra and is kept as
the control that mapped the ids - Muscat is CityID 0):

- Side A (ministry) still serves its held line: all 30 November rows fetched fresh equal
  the held Muscat rows cell for cell, 180/180, zero diffs.
- Side B (tawkit) still serves its held line: the live Muscat November grid equals the
  held bank's 2026-11-12 row to the minute on every column.
- Delta between the two sides on 2026-11-12 (ministry minus platform, minutes): fajr -1,
  sunrise 0, dhuhr 0, asr 0, maghrib 0, isha +1 - the platform's isha prints one minute
  earlier today, consistent with its held 17-degree isha against the ministry's 18.

Verdict as measurement: both sides serve their held lines and the two lines remain
distinct on today's row by the recorded twilight margin. Data:
`data/om-muscat-cross-2026-11-12.json` and `data/om-mara-muscat-2026-11-fresh.json`.

## 9. Bolivia - the La Paz install serving Santa Cruz's table (BO-SANTA-CRUZ-RESOLVED / BO-LA-PAZ-RECLASSIFIED conflict set)

Held: the La Paz mawaqit install (asociacion-comunidad-islamica-bolivia-1335) serves
Santa Cruz's table byte-identical across the year (365 days), 15 degrees of longitude
apart; one frozen generation.

Today's measurement (fetched 2026-11-12 UTC, `captures/bo-mawaqit-lapaz-2026-*.html`,
`captures/bo-mawaqit-santacruz-2026-*.html`; a slug probe for a "masjid-as-salam"
Santa Cruz board 404s and is recorded):

- Both installs still serve: each board's embedded calendar parsed whole, twelve months,
  366 dated cells for 2026.
- The identity still serves: all 366 common month-days of the La Paz install equal the
  Santa Cruz board's cell for cell today (2026-11-12 row 04:12 / 05:23 / 12:02 / 15:11 /
  18:31 / 19:37 on both), zero diffs.
- Both boards still serve their held generation: the live 2026-11-12 row equals the held
  merged Santa Cruz bank's row on all six prayer columns.

Verdict as measurement: the recorded identity re-measures unchanged on fresh fetches of
both boards - one generation behind two names, exactly as held. Data:
`data/bo-lapaz-vs-santacruz-live.json`.

## 10. Canada - the Alberta Masjidal +60 fall-back block and Leduc's +120 December (CA-21-TENANTS-6-YEARS conflict set; O1n-11 live gate)

Held: six Alberta Masjidal tenants carry a +60 block from 2026-11-01 only (the 2026
edition missed the fall-back); Leduc (`1XAlR4Kb`) serves December at +120, not +60. Held
gate: `o1n-11-americas/data/ca-plus60-livegate.json` (Nov 1-10 medians +59..+67).

Today's measurement (fetched 2026-11-12 UTC, `captures/ca-masjidal-1XAlR4Kb-*.json`,
`captures/ca-masjidal-M9L2WrAZ-*.json`, keyless range API 2026-10-25..2026-12-31; deviation
against adhan 4.4.6 MWL Rounding.None at each tenant's own coordinates, the held gate's
method, timestamps in America/Edmonton):

- Leduc still serves the block: November 1-12 fajr/dhuhr/isha deviation medians 59/60/63
  minutes (held: 59/60/63); its December rows serve at 120/120/122 - the +120 December
  block is still served.
- AlFalah Edmonton still serves the block: November medians 60/61/63 (held: 60/61/63),
  December 61/61/62 (held: 61).
- Today's served row (2026-11-12) carries the block on every column (Leduc fajr +59,
  AlFalah fajr +60).

Verdict as measurement: the fall-back defect re-measures alive on fresh fetches of both
tenants, with Leduc's second broken month (+120 December) still served. Data:
`data/ca-masjidal-plus60-refetch.json`.

## 11. Turkey vs Diyanet-abroad - the isha margin family (DIYANET-TREE-207 conflict set; O1n-1 "Diyanet 644 pairs, isha +10 the family dispute")

Held: Diyanet's Turkey line and its abroad lines carry different isha families (16 or 17
degrees by latitude, never blended); the tree's crosscheck against turktakvim measured an
isha delta median of +11 minutes over 1,059 pairs.

Today's measurement (fetched 2026-11-12 UTC: `captures/tr-diyanet-istanbul-9541-*.html`
(district 9541, November table), `captures/sn-diyanet-dakar-16183-*.html` (abroad,
Senegal, district 16183), `captures/sn-turktakvim-dakar-70390-*.html` (platform, cityID
70390); the discovery chain `captures/tr-diyanet-countries.json` -> `GetRegList` walks is
banked too):

- Side A (Diyanet Turkey, Istanbul) still serves its held line: the fresh 2026-11-12 row
  06:13 / 07:41 / 12:53 / 15:31 / 17:56 / 19:18 equals the held 2026 bank's row exactly.
- Side B (Diyanet abroad, Dakar) still serves: 05:55 / 07:02 / 12:59 / 16:16 / 18:45 /
  19:48 for 2026-11-12.
- Side C (turktakvim, Dakar) still serves its held bank byte-exact (fresh annual page vs
  held rows: 365 dates, zero diffs); its 2026-11-12 isha sits +7 minutes over Diyanet
  Dakar's yatsi (maghrib -1) - inside the held +7..+11 family band, one sampled day.
- The family shape measures on the same day: Diyanet's own isha-minus-maghrib gap is
  82 minutes at Istanbul and 63 minutes at Dakar - the two latitude families as served.

Verdict as measurement: the Turkey-vs-abroad split re-measures as served data on a fresh
same-day fetch of three surfaces; the ladder delta at the sampled city (+7) sits inside
the held dispute band (+7..+11 median +11). No adjudication. Data:
`data/tr-diyanet-isha-family-2026-11-12.json`.

## 12. Malaysia - the Perak mufti's own print vs the JAKIM zone (MY-PERAK-7-ZONES-2027 / MY-JAKIM-59-ZONES-2027 conflict set)

Held: the census's +2 margin set scores zero exact days against Perak's own 2027 print in
all seven zones on both editions; JAKIM's PRK zones reproduce the mufti's own PDFs
(mirror-gated, O1m-16); the held 2027 JAKIM bank came from the wsa render route because
the public GET ignores the year parameter.

Today's measurement (fetched 2026-11-12 UTC: `captures/my-jakim-prk01-2026-11-*.json`,
`captures/my-jakim-prk01-2027-01-*.json`; the mufti-side routes tried and recorded in
`data/my-perak-jakim.json`):

- Side JAKIM still serves its held line: the fresh PRK01 November 2026 table equals the
  held 2026 bank on all 30 dates x 7 columns (210 cells, zero diffs).
- The two names still cover one reality: Perak mufti zon1 2027 (held OCR bank) minus
  JAKIM PRK01 2027 (held bank) is 0.0 minutes median on every one of the seven columns,
  exact on 364/364 days per column - the value identity behind the fit-level conflict
  re-quantifies unchanged.
- Side mufti is NOT proven served today: the held host does not resolve (muftiperak.gov.my
  and variants NOANSWER at two public resolvers), digital.perak.my 404s the held PDF path
  on a different server stack, Wayback CDX holds nothing for the path or the domain, and
  the search engines returned a captcha and junk - all routes stopped per discipline and
  recorded. This is a dated fact of the conflict file, not an adjudication.

Verdict as measurement: the value-identity holds and the JAKIM side serves its held line;
the mufti side's current availability is "not proven" with routes named. Data:
`data/my-perak-jakim.json`.

## Wave close (2026-11-12, UTC)

Twelve conflict pairs measured, one per section above; every pair carries a dated capture
set under `captures/` (gzipped in place) and a derived file under `data/`. No pair was
adjudicated. Negative results are recorded as findings: athanpro's Monrovia page serves a
September-frozen month on 2026-11-12; the Perak mufti host is not re-resolvable today
(NOT PROVEN, routes named); awqaf.ye answers curl with 403 and was read through the
browser session; the Kuwait ruznama print remains unextractable (held closure stands).
The Diyanet and Fazilet captures embed third-party selector lists whose administration
layer name is scrubbed with a named marker per the standing order; all other banked text
is clean at close.
