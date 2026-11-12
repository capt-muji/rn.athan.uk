# O1n-54 southasia2 REPORT

Wave O1n-54 (session four, round four o1n), worked 2026-11-12. Engine of record
adhan 4.4.6 at $HOME/athan-gitree/census/adhan-build/node_modules/adhan, Rounding.None,
publisher civil zones, timestamps UTC. OCR local Vision fast only. No subagents deployed.
Workspace fresh for this wave; predecessor o1n-38-southasia read first (its banked fronts
and named leads are this wave's inputs; nothing redone).

## Fronts (mission order)

1. BD annual (Islamic Foundation year-2 route)
2. India J&K notices register
3. Pakistan provincial Auqaf + Ministry print
4. Sri Lanka beyond ACJU
5. Myanmar and Nepal re-probes
6. Maldives islamicaffairs.gov.mv cooled-IP retry

---

## BD-2: the Islamic Foundation's PERMANENT annual schedule (the year-2 route on BD-ISLAMICFOUNDATION-64)

Front opened 2026-11-12 ~17:2xZ. The o1n-38 lead said: Ramadan 1447 schedules banked
(1,920 rows, 64 districts), the Foundation's ANNUAL district calendar is the recorded next
surface; "the Foundation's annual (non-Ramadan) namaz schedule was not surfaced by the portal
walk" (o1n-38 open door).

### The find chain

- TinyFish (Bengali + English phrasings) against islamicfoundation.gov.bd and open web:
  the official portal's own pages hold ONLY Ramadan sehri-iftar schedules (the six files
  pages walked live: halal dept, agroprothik, citizen charter, board, projects, journal;
  the notices index swept: zero non-Ramadan schedule entries). The annual surface lives on
  a community carrier: kivabe.com/namaz/islamicfoundation.php, "Islamic Foundation's
  namaz-o-rozar STHAYI (permanent) somoy-suchi", last-updated stamp 18 November 2015.
- The carrier hosts the ANNUAL PRINT ITSELF as one text-layered PDF
  (Calender_permanent_namaz_time.pdf, captured) plus six JPGs (months 1-4, 5-8, 9-12 and
  two district adjustment tables - the JPG digit glyphs defeat the fast OCR, recorded).
  The PDF's text layer extracts cleanly (same legacy SutonnyMJ encoding class as the
  banked 1447 Ramadan PDFs; digits ASCII).

### What the print is

Title decodes as "sehri o iftar (Dhaka) jelar sthayi somoy-suchi" - the Foundation's
permanent annual sehri/iftar schedule for Dhaka district, with the Foundation's own
footnotes on the same sheet: sehri end kept ~3 min early, fajr first start 3 min late,
a 6-minute internal gap between the two morning columns, midday handled at mid-sky,
district times = Dhaka value +/- district minutes with SEPARATE sehri and iftar columns
in the adjustment table (eastern districts subtract, southern/western add; Sylhet-class
+/-1, Khulna/Satkhira/Bagerhat sehri +6 iftar +11; full table banked as raw legacy text).

Layout: 12 month blocks x 6 day rows (01, 06, 12, 18, 24, 30) x 7 time columns, three
panels per strip. MONTH MAP (value-proven by fit, the print's own labels are unreliable
at glyph level): the blocks snake column-wise - left panels Jan-Apr, middle panels
May-Aug, right panels Sep-Dec; every month resolved UNIQUELY (12/12, no candidate ties).

### The fit (one recipe, all 12 months, engine adhan 4.4.6)

Point: Dhaka sadar 23.8103/90.4125, UTC+6, Rounding.None, MiddleOfTheNight. 72 printed
rows, 71 date-mappable (the print prints a February day-30 row; permanent-print
convention, banked undated). Printed evening columns carry a 12-hour clock read (+12h
applied on columns 4-7).

| Column | Rule (adhan 4.4.6) | exact pc | within-1 pc | worst | med |
|---|---|---|---|---|---|
| c1 sehri end | fajr 18.0 - 4.5 (alt: fajr 18.5 - 2, exact 52/71) | 50.7 | 98.6 | 1.97 | +0.07 |
| c2 fajr first start | c1 + 6 (print-internal, exact per month) | 52.1 | 98.6 | 1.97 | +0.03 |
| c3 dhuhr | dhuhr + 3.5 | 81.7 | 100 | 0.88 | +0.02 |
| c4 asr | asr HANAFI (2x shadow) + 0 | 42.3 | 100 | 1.32 | -0.50 |
| c5 maghrib/iftar | sunset + 3.5 | 71.8 | 98.6 | 59.42* | +0.13 |
| c6 isha | isha 18.0 + 2 | 52.1 | 100 | 1.42 | -0.30 |
| c7 last column | sunrise + 12:00 (12h-clock print) | 46.5 | 98.6 | 1.62 | -0.52 |

*worst = ONE named print fault (Jul day 24 prints "5-53" inside a rising
6:46..6:51..6:57 series - digit-slip class, kept as printed). Excluding that single cell
the c5 worst is in the 1-2 min class.

Named second fault: Sep day 18 c1 prints "346" (dropped dash in the text layer; read
3-46), kept as printed.

Structural findings: the annual print is HANAFI on asr (the Ramadan sehri/iftar print
class carries no asr column, so this is the Foundation's first Hanafi-asr witness); the
morning pair is anchored at the 18-degree family (18.0-4.5 and 18.5-2 both fit 70-71/71;
angle identifiability at 23.8N is weak across one year - the family is recorded, the
point rule with it); dhuhr/isha carry +3/+2-class safety offsets (the Foundation's own
footnote describes exactly this class of precautionary adjustment).

Seasonal amplitude: model fajr Jan-1 vs Jul-1 gap 93.2 min; sunset 17:26 vs 18:53. The
print's single table spans the full amplitude (it is a true annual, not a
season-pair).

### The PERMANENT claim, measured

The print stamps itself "sthayi" (permanent, valid any year). Fitting the SAME print
against the 2026 frame: every column keeps med |residual| <= 0.53 and within-1 at 98.6-100
pc, worst 2.12 outside the named fault cell - at 23.8N the 18-degree family's between-year
movement sits at the rounding floor (the o1n-33r equatorial finding, now measured for
Dhaka). The permanent claim is VERIFIED for the measured horizon; the entry's forward
longevity verdict = stable-across-frames (one computed generation, year-agnostic by
design). Per-year scores: one edition, two frames (2017 fit frame, 2026 drift frame),
per-column breakdown banked in data/bd-annual-rows.json (per-cell dev_vs_2017 and
dev_vs_2026).

### Grade and tier

Grade A-eligible structure (one recipe across 12 months x 2 frames, 71 dated rows,
7 columns) but the surface is a COMMUNITY CARRIER (kivabe.com) hosting the Foundation's
own print: tier authority-by-publisher (the Foundation), surface class community-carrier;
the record is labelled exactly so. The o1n-38 BD-ISLAMICFOUNDATION-64 entry (Ramadan
1447, candidate grade) gains its year-round sibling - per-edition, never blended: the
Ramadan regime (sehri = fajr 18.0 zero pad, t2 +3, iftar sunset+1.5) and the annual
regime (this table) remain separate dated records.

### Artifacts

- captures/bd-kivabe-permanent.pdf (the annual print itself), bd-kivabe-permanent-pdftext.txt,
  bd-kivabe-{namaz-1-4,5-8,9-12,time-plus,time-minus,namaz-time-bangladesh}.jpg (+ the
  recorded fast-OCR negatives on the JPGs), bd-kivabe-permanent.html
- captures/bd-if-home.html, bd-if-files-*.html, bd-if-notices.html (the official-portal walk)
- scripts/bd-annual-raw.json (parsed blocks, months value-proven), bd-permanent-xparse.py
  (coordinate parse), bd-annual-fit{1,2,3,4}.js (the sweeps), bd-annual-bank.js (the bank)
- data/bd-annual-rows.json (71 dated rows, per-cell diffs vs 2017 and 2026), bd-annual-sweep1.json

### Open items from this front

- The Foundation's annual DISTRICT variants: the same sheet carries the two district
  adjustment tables (raw legacy text banked); the per-district annual print pages (the
  kivabe JPGs time-plus/time-minus) defeat the fast OCR - the district annuals remain an
  open door behind the Dhaka block now fitted.
- The o1n-38 Ramadan-1447 regime's own year-2: the official portal's PAST Ramadan notices
  (1445/2024 and 1441/2020 PDFs captured this session) - worked in BD-3 below.

## BD-3: the Foundation's own past Ramadan editions - 1441 (2020) and 1445 (2024)

Front opened 2026-11-12 ~18:0xZ. Route: the official portal's notices pages for the past
Ramadans (titles surfaced by TinyFish site search), each carrying the schedule PDF on the
same Oracle object store as the banked 1447 set:

- captures/bd-if-rd1441-2020.pdf (2 pages, Dhaka-district notice, CLEAN text layer, the
  Foundation's recipe footnotes printed: sehri end kept 3 min early, fajr first start 3
  min late, iftar 3 min after maghrib, sehri-to-fajr gap 6 min)
- captures/bd-if-rd1445-2024.pdf (2 pages; text layer in a second broken legacy font,
  digits mangled - not yet parsed; kept as captured negative-evidence, OCR-class open item)

### BD-3 results

- 1441 (2020) edition BANKED: 30 dated rows (frame 2020-04-25 .. 2020-05-24, the
  moon-committee-declared first day; the Apr-23/24 frames fit within +-1, frame-day
  ambiguity recorded). Fit (adhan 4.4.6, Dhaka sadar): c1 sehri end = fajr 17.5 - 8
  (30/30 within-1, worst 1.48, med +0.25); c2 fajr first start = c1 + 5.5..6 (the print's
  own footnote says 6); c3 iftar = sunset + 3 (30/30 within-1). Recipe per-edition, never
  blended with the held 1447 regime.
- THE PER-EDITION PAD INSTABILITY IS NOW MEASURED (three editions of the Ramadan print
  class): sehri pad 1441 = fajr-8 class, annual (permanent) = fajr-4.5, 1447 = fajr-0;
  iftar pad 1441 = sunset+3, annual = sunset+3.5, 1447 = sunset+1.5. The Foundation
  adjusts its safety pads per edition; every edition carries its own recipe.
- Page 2 of the 1441 notice carries the district adjustment register (same-day, +/-minute
  lists per district, separate sehri and iftar columns, "same as Dhaka" lists included) -
  captured raw; text banked in captures/bd-if-rd1441-p2-text.txt.
- 1445 (2024) edition: PDF captured (2 pages), its text layer is a second broken legacy
  font (digit mojibake) and the fast-OCR read of the 3x render yields symbol garbage on
  the Bangla digits (o1n-38's print-class negative reconfirmed). RECORDED OPEN (OCR-class
  open item; a Bangla-digit OCR route or a font-CMap decode lifts it). Not parsed this
  session.
- Ramadan regime standings: 1441 (30 rows fitted, Dhaka), 1447 (1,920 rows held, 64
  districts), 1445 (captured unparsed). The regime is multi-edition with measured pad
  instability.

## IN-2: the J&K notices register (the ledger's candidate row)

Front opened 2026-11-12 ~17:4xZ. The ledger's named lead (notice-register images of the
J&K Muslim board class) resolves to the statutory Jammu & Kashmir WAQF BOARD's public
notices register - waqfboard.jk.gov.in/notices.aspx (open, no login; the Muslim Personal
Law Board J&K surfaced separately as a Facebook-only body, untouched per the no-login
rule).

- The register is LIVE and carries prayer-timing notices with downloadable files. Five
  captured (2026 batch): Eid-ul-Fitr 2026 Nimaaz Timings (posted 18-03-2026), Eid-ul-Adha
  2026 Nimaaz Timings + the Hazratbal variant (24-05-2026), Friday Prayer Timings at
  Assar-i-Sharief Hazratbal 2026 (30-03-2026), Juma-t-ul-Vida 13/03/2026.
- PARSED: the two English Eid registers - ~50-venue jamaat tables for each Eid day; 63
  venue-time rows banked (data/in-jk-waqf-notice-register.json; the Fitr register's
  positional pairing banked with the merge caveat, raw OCR text files are the artifact of
  record; Hazratbal's own Eid row reads 10:30, matching the press). Class: community per
  mission; publisher note: statutory Waqf Board (authority-by-publisher class).
- NEGATIVES (routes named): the three Urdu notices (Friday 2026, Juma-t-ul-Vida,
  Hazratbal Eid) defeat the fast OCR (garbage glyphs, recorded); the register holds NO
  daily/annual prayer calendar - only Eid/Friday jamaat notices and tenders. The
  Personal Law Board J&K publishes organisational news, not timetables (search round,
  English + Urdu).

## PK-1: the provincial Auqaf departments and the Ministry print (453-city tawkit layer's authority depth)

Front opened 2026-11-12 ~19:0xZ. The held layer: the 453-city tawkit bank. This front
hunted the provincial Auqaf annuals and the federal Ministry print, Urdu and English
phrasings (auqaf namaz timings, rozana waqt, اوقاف نماز اوقات).

### Results per body

- PUNJAB AUQAF (auqaf.punjab.gov.pk): the live host is unreachable from this host by curl
  (000/504, recorded); TinyFish fetched the homepage - properties/auctions/FAQ only, no
  prayer-timetable section (437 mosques and 548 shrines under its control, per its own
  FAQ). The department's prayer schedule class is its Eid announcements to press: the
  Eid-ul-Adha 2026 schedule captured in full from The Nation (26 May 2026) - 19 Lahore
  venues x Eid jamaat times (Badshahi 08:30, Data Darbar 07:00, Wazir Khan 07:00,
  Makki Anarkali 05:30 class), banked in data/pk-punjab-auqaf-eid-ul-adha-2026.json as
  a dated single-day register (authority-by-publisher, press carrier).
- KP AUQAF (auqaf.kp.gov.pk + auqafmis.kp.gov.pk + ahrma.kp.gov.pk): all walked live -
  ordinances, tenders, directory, MIS index; no prayer timetable anywhere on the three
  hosts (negative, routes named).
- SINDH AUQAF (arazud.sindh.gov.pk): home, downloads and notifications walked live; no
  prayer timetable (the department's pages carry urs calendars and waqf property lists;
  negative, routes named).
- BALOCHISTAN AUQAF: no own web timetable found under these terms (search round in
  English and Urdu transliteration; only platform surfaces returned). Negative.
- FEDERAL MINISTRY (mora.gov.pk): the site walked live; its Download section carries Hajj
  forms and year books, no prayer calendar. THE NIZAM-E-SALAT LEAD: Dawn (27 Nov 2015)
  confirms the Ministry issued a full-year uniform prayer-timing calendar for Islamabad
  (summer May 2015 + winter Nov 2015, all five prayers, a four-sect Nizam-e-Salat
  committee) - article text banked (TinyFish fetch; direct Dawn fetch is challenge-walled
  to curl), the calendar TABLE itself not found in the article or on mora.gov.pk. The
  successor programme: a unified Islamabad-Rawalpindi azan/jamaat timetable approved to
  start 1 January 2026 (ICCI article banked; an Instagram carrier shows one sample day
  Fajr 05:20/Sunrise 06:37/Dhuhr 12:17/Asr 16:18/Maghrib 17:55). The unified annual table
  itself remains an open named lead (distributed to mosques; no public full-year table
  found).
- WAYBACK: web.archive.org is TEMPORARILY OFFLINE this session (both the Punjab host
  CDX probe and a second probe returned the IA outage page; recorded; the Punjab
  archived-site route re-opens when IA returns).

### Verdict

No provincial Auqaf annual table surfaced under these terms; the provincial class
publishes through press (Eid schedules) rather than own-site annuals. The federal
uniform-timetable programme (Islamabad-Rawalpindi, live since 1 Jan 2026) is the named
open lead for the next wave: its table would be the first federal daily-prayer authority
surface for Pakistan if it publishes.

## LK-1: Sri Lanka beyond ACJU

Front opened 2026-11-12 ~19:4xZ. Held: the ACJU 13-zone national layer (2025/2026 editions,
one computed generation, frozen-reprint verdict strengthened by the O1n-33 re-survey); the
ACJU 2027 edition is calendar-gated (not waited for, per mission).

- DEPARTMENT OF MUSLIM RELIGIOUS AND CULTURAL AFFAIRS (muslimaffairs.gov.lk): the
  department's own site is live (WordPress/Elementor). Its "Prayer Time" section is a
  DAILY WIDGET, not an annual print: captured row 2026-11-12 Colombo (Fajr 04:48 /
  Sunrise 06:00 / Zuhr 11:55 / Asr 15:16 / Magrib 17:49 / Isha 18:57). The row fits a
  generic computed family (fajr 18.0 / isha 17.0, dev <=0.4 on four columns) and is NOT
  the ACJU line (fajr +8, maghrib -2, isha -6 vs held ACJU zone-01 2026-11-12): a second
  computed line for Colombo on a government site, banked as one dated witness
  (data/lk-dmrca-daily-witness.json, computed class). No annual/district print found on
  the site (search round + homepage walk; the department publishes Jumma-conduct and
  event notices, not timetables). Negative on the "own print" lead, route named.
- AZAN.LK (the Sinhala/Tamil local carrier): its daily row for 2026-11-12 is CELL-IDENTICAL
  to the held ACJU zone-01 grid (6/6: 04:40/06:00/11:56/15:18/17:51/19:03) - the site
  carries the ACJU computed generation verbatim ("official ACJU prayer times", Sinhala
  UI). Its RAMADAN 2027 section serves full prospective sehri/iftar tables (the site
  itself labels them expected, ACJU to confirm after moon sighting): 87 dated rows banked
  (Colombo/Kandy/Batticaloa x 29 days, data/lk-azanlk-ramadan2027-rows.json). Fit
  (adhan 4.4.6, city points, UTC+5:30): ALL three cities 100 pc within-1 on both columns,
  worst <=0.75: Colombo sehri = fajr 18.0-7, iftar = sunset+1.5; Batticaloa sehri =
  fajr 18.0-7, iftar = sunset+1.5; Kandy sehri = fajr 18.5-5, iftar = sunset+1.5.
  CLASS: computed-expectation (community/platform label), never the ACJU authority tier;
  the iftar pad matches the ACJU maghrib+1.5-class witness family. Monthly routes on
  azan.lk (Nov/Dec 2026 tables) noted as further harvest for a successor.
- JAMI UL-ALFAR (redmasjid.com): the mosque's own site is live but carries no timetable
  (history/visit content; negative, route named). masjidway carries a platform daily row
  (platform class, never provenance).
- DAWAT-E-ISLAMI SRI LANKA: only the global dawateislami.net platform surfaces (platform
  class); no Sri Lanka own print found under these terms.
- TAMIL AND SINHALA phrasings: searches returned editorial/explanatory content (BBC
  Tamil, ceylon24, mailofislam) - no authority annual tables; the only local-carrier
  surface found is azan.lk (above).

## MM-1 / NP-1: Myanmar and Nepal re-probes

Front opened 2026-11-12 ~20:1xZ. The o1n-38 negatives stand (never redone); this front
worked the named different bodies and new routes.

### Myanmar

- MMISLAMIC.ZNNT.ORG ("Myanmar Islamic Program", the Burmese-phrasing lead): its adhan
  timetable page is a CLIENT-SIDE WRAPPER over api.aladhan.com/v1/calendar - the ajax
  call is in the page's own JS; default calculation method MWL, Hanafi school default,
  location search + geolocation. CLASS: platform wrapper (Burmese re-render of aladhan
  data), community/platform label, never authority (data/mm-mmislamic-wrapper.json).
  The page's own notice: "please use with VPN" - the host is blocked inside Myanmar.
- ISLAMIC RELIGIOUS AFFAIRS COUNCIL (IRAC): Facebook-only presence surfaced; the page is
  login-walled logged-out (public-pages-only rule; recorded, not passed). No IRAC print on
  the open web under these terms (English + Burmese routes: namaz ahcain zayar, azan
  ahcain zayar classes). Negative stands, route named.
- Yangon/Mandalay mosque own sites: none found (platforms and app-store surfaces only,
  including two Myanmar prayer apps with no web tables).

### Nepal

- PRAYERWAQT KATHMANDU (the mission's Jama Masjid Kathmandu lead, one step removed):
  prayerwaqt.com serves Kathmandu with an explicit LOCAL-SOURCE profile "Darul Ifta /
  Nepali Jame Masjid" - the mission-named body class. 14 dated rows captured and banked
  (data/np-prayerwaqt-kathmandu.json, 2026-11-12..25, six columns). The profile DECODED
  against adhan 4.4.6 (27.7017/85.3206, UTC+5:45): fajr 19.25 deg (fajr-sunrise gap
  86.2 min on the anchor row), plain sunrise/dhuhr, asr HANAFI, maghrib sunset+6,
  isha 18.0 deg - all 14 rows within 0.7 min worst on the checked columns. CLASS:
  platform-with-local-source-profile, community label (the body's own print remains
  unfound; the +-1 min disclaimer is the site's own). Prayerwaqt lists 10 Nepal cities
  on the same profile class (named: Kathmandu, Pokhara, Biratnagar, Birganj, Butwal,
  Bharatpur, Dhangadhi, Hetauda, Janakpur, Patan) - a successor can walk all ten.
- NEPAL MUSLIM ASSOCIATION: nothing own-site found under these terms (negative).
- The Rahmaniya negative STANDS untouched (different body, per mission).

## MV-2r: the islamicaffairs.gov.mv cooled-IP retry

Front opened 2026-11-12 ~20:3xZ. One polite retry per mission, different route shapes,
zero challenge interaction:

- robots.txt: 403 Cloudflare block ("Attention Required!", Ray a597647dda1e1655)
- sitemap.xml: 403 Cloudflare block
- sitemap_index.xml: 403 Cloudflare block

All three captured (captures/mv-retry-*.txt). The wall covers the non-page route shapes
from a fresh IP; the O1n-38 negative STANDS STRENGTHENED. No calendar endpoint was
reached; no challenge interaction happened. The ministry's current annual calendar
remains not found under these terms; the held 2015 edition + the banked 2026 Ramadan
witness (O1n-38) remain the Maldives record.

## Session summary

| Front | Verdict | Dated rows banked |
|---|---|---|
| BD-2 Islamic Foundation PERMANENT annual (Dhaka) | FOUND + fitted: 12 months value-proven, one recipe, 98.6-100 pc within-1 all 7 columns, permanent claim verified at the 2026 frame; community carrier of the Foundation's own print; asr HANAFI first witness | 71 (+1 undated Feb-30 row) |
| BD-3 Ramadan editions 1441 (2020) + 1445 (2024) | 1441 fitted (30/30 w1 both columns, frame 2020-04-25); per-edition pad instability MEASURED (sehri pad 1441 -8 / annual -4.5 / 1447 0; iftar +3/+3.5/+1.5); 1445 captured, OCR-class open item | 30 |
| BD-2 district adjustment tables | captured raw (Dhaka base +/- district minutes, separate sehri/iftar columns); decode pending | - |
| IN J&K Waqf Board notices register | FOUND + live: two English Eid registers parsed (49 + 14 venue-jamaat rows, OCR positional caveat), 3 Urdu notices recorded as fast-OCR negatives | 63 |
| PK provincial Auqaf + Ministry | Punjab Eid-ul-Adha 2026 schedule banked from press (19 venues); Sindh/KP/Balochistan own-site negatives with routes; mora Nizam-e-Salat 2015 + unified twin-cities 2026 programme = named open leads; IA outage blocks the Wayback route | 19 |
| LK beyond ACJU | azan.lk Ramadan-2027 prospective tables banked + fitted (87 rows, 100 pc w1, per-city rules); azan.lk daily = held ACJU generation cell-identical 6/6; department site = daily widget only (second computed line, 1 row); Red Masjid + Dawat-e-Islami negatives | 88 |
| MM re-probe | mmislamic.znnt.org = aladhan-API wrapper (platform class, mechanism proven from its own JS); IRAC Facebook login-walled; authority negative stands | - |
| NP re-probe | PrayerWaqt Kathmandu "Darul Ifta / Nepali Jame Masjid" profile decoded (fajr 19.25/Hanafi asr/maghrib+6/isha 18) + 14 dated rows; 10-city platform coverage named; Rahmaniya negative stands | 14 |
| MV cooled-IP retry | robots/sitemap/sitemap_index all 403-blocked; negative stands strengthened | - |

Dated rows banked this session: 285 (71+30+63+19+88+14). Raw captures: 60+ files
gzipped-ready under captures/. Engine of record adhan 4.4.6 throughout; timestamps UTC;
no subagents deployed; no repo writes; nothing under /tmp.

Open items handed to successors (named):
- BD: the 1445 (2024) Ramadan PDF needs a Bangla-digit OCR or font-CMap route; the
  district annual variants sit behind the two adjustment-table images (fast-OCR
  negative recorded); kivabe's district-wise tool is community-computed.
- IN: the Waqf Board register's Urdu notices need Urdu-capable OCR; the Muslim Personal
  Law Board J&K's own notices live on Facebook (login-walled, untouched).
- PK: the unified Islamabad-Rawalpindi annual table (1 Jan 2026 programme) - the
  federation's first federal daily-prayer authority surface if it publishes; Punjab
  archived-site route re-opens when the Internet Archive returns.
- LK: azan.lk's monthly Nov/Dec 2026 tables + its full city list are unharvested
  harvest-the-future surfaces (ACJU-carrier class).
- NP: the ten prayerwaqt city pages (same source-profile class) are unharvested.
- MV: the ministry wall stands; the next reprobe is a future wave's call.
