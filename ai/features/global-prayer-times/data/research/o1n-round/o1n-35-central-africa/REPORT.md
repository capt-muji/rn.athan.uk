# O1n-35 Central Africa and the Indian Ocean - REPORT

Wave O1n-35, round four (o1n), session three, 2026-11-12. Bundle: DR Congo, Congo-Brazzaville,
Gabon, Cameroon, Central African Republic, Chad, Sudan, South Sudan, Eritrea, Comoros,
Madagascar, Mauritius, Seychelles, Cape Verde, Sao Tome and Principe, Equatorial Guinea.
Dispatched by the coordinator; no children deployed. All timestamps UTC. Engine of record:
adhan 4.4.6 at $HOME/athan-gitree/census/adhan-build/node_modules/adhan. Raw artifacts under
captures/ (gzipped), derived rows and fits under data/.

## Inherited state

- Sudan: two 30-row Ramadan imsakiyas already banked at c13-corrob (ministry 1446 =
  Ramadan 2025, Khartoum state/media 1447 = Feb-Mar 2026); this wave hunts for a fuller
  dated surface and second-year/witness evidence against those held lines.
- DRC/Angola/Mozambique Portuguese routes (O1n-14): ended in calculators, Scribd walls and
  Instagram-only pages. Never redone; new routes only.
- The Fazilet family (FAZILET-248-CITIES, grade A) carries fit-verified city rows for most
  of this bundle (Sudan 10, Chad 17, DRC 14, Cameroon 12, Madagascar 12, CAR 6, Gabon 6,
  Comoros 4, Eritrea 6, South Sudan 2, Eq. Guinea 2, Mauritius 2, Seychelles 1, Cape Verde 1,
  Congo-Brazzaville 2; NO Sao Tome layer at all). The turktakvim tree carries platform-tier
  2026 tables for the bundle's cities. A NEW dated surface is the target; the family rows
  are usable as cross-checks only.

## Mauritius

BANKED, 365 dated rows + witness diff (2026-11-12).

Surface: namaztimes.jummahmasjid.org, the Jummah Masjid Port Louis's own prayer-times web
app ("Official namaz times for Mauritius, provided by Jummah Masjid, Port Louis" - the
app's own llms.txt). The full 2026 timetable is embedded in the Vite bundle
(assets/index--pbmFNlE.js) as a CSV template literal (365 rows, 2026-01-01..12-31, 16
columns: dd/mm/yyyy, sehri, fajr debut/azaan/jamaat, sunrise range, zawaal range, zohr
debut, asr debut/azaan/jamaat, sunset range, maghrib, esha debut/azaan/jamaat). Captures:
captures/jummahmasjid-home.html.gz, captures/namaztimes-app.html.gz,
captures/namaztimes-llms.txt.gz, captures/namaztimes-assets-index.js.gz. Rows:
data/mu-jummahmasjid-2026-rows.json (the app's own rt() decoder: "4.3" = 04:30).

Structure (measured): a jama'ah-board timetable over a computed base. Stepped convention
columns: fajr azaan (31 five-minute values), asr azaan (4 seasonal values 16:15/16:30/16:45/17:00),
esha azaan (6 fixed 15-minute blocks changing 11 times through the year), all jamaat columns.
Computed columns: sehri, sunrise start, zawaal window, zohr debut, sunset window, maghrib,
esha debut.

Fit (adhan 4.4.6, Port Louis -20.1609/57.5012, Indian/Mauritius, Rounding.None; scripts/
mu-fit.mjs, mu-fit-solar.mjs, mu-fit-solar2.mjs; data/mu-jummahmasjid-2026-{fit,solar-fit,solar-fit2,esha-scan}.json):
- sehri = fajr at 18.5 deg: 236/365 exact, 350/365 within-1, worst 2
- fajr debut = fajr at 16.25 deg: 196/365 exact, 350/365 within-1, worst 2
- sunrise start = computed sunrise, margin 0: 253/365 exact, 365/365 within-1, worst 1
- zohr debut = transit + 6: 219/365 exact, 365/365 within-1, worst 1
- sunset window straddles computed sunset (start mean -3.3, end mean +1.7)
- maghrib = sunset + 3: 260/365 exact, 365/365 within-1, worst 1
- esha debut = isha at 17.75 deg: 204/365 exact, 365/365 within-1, worst 1
TWO different twilight lines inside one print (sehri 18.5 vs fajr debut 16.25) - the
mosque's own recipe, recorded as printed, never blended.

Tier: authority (the mosque's own site and app). Grade: provisional (one published cycle,
2026). Span verdict: untestable-single-year (bundle is the single 2026 edition; a 2027
edition would replace the embedded blob).

Witness (same-day per-column diffs vs the Fazilet family line, Port Louis cityId 3206,
5 dates across the year; scripts/mu-witness.mjs; data/mu-jummah-vs-fazilet-witness.json,
captures/fazilet-3206-*.json.gz): sehri +5..+6, fajr -4..-5, sunrise +2..+3, dhuhr -1,
asr +45..+81 (JM prints a stepped jama'ah asr, not comparable), maghrib -3..-4, isha -2.
Two distinct computed generations at the same city, quantified, never blended.

Second witness, Bait Ul Noor (mawaqit board, community tier): the static board page embeds
a 12-month calendar, 366 day entries (data/mu-baitulnoor-calendar.json from
captures/mawaqit-baitulnoor-mauritius.html.gz, scripts/mu-baitulnoor.py). The board prints
no year (the year-blind mawaqit class). Diff vs Jummah Masjid on 365 matched dates
(data/mu-baitulnoor-vs-jummah.json): shuruq median 0, 96.7 pc within-1 (the two boards
share the same solar sunrise); fajr median -6 (Bait Ul Noor earlier, max 8); maghrib
median -2 (BUN sits at sunset+1 against JM's sunset+3, 30.7 pc within-1, max 3); isha
median +15, max 26 (BUN's isha block runs later than JM's 17.75-deg line); both boards
print clock-fixed jama'ah dhuhr/asr blocks (BUN 12:45/15:45 flat). A second Port Louis
community line, quantified per column, never blended.

## Sudan

RECIPE CHARACTERIZED + SECOND DATED YEAR (2026-11-12).

Held evidence (c13-corrob, inherited): the ministry of religious affairs Ramadan 1446
Khartoum imsakiya (30 rows, 2025-03-01..30, ministry crest and stamp) and a Khartoum
state/media Ramadan 1447 table (30 rows, Feb-Mar 2026).

Fit of the ministry 1446 line at Khartoum 15.5007/32.5599, Africa/Khartoum, adhan 4.4.6,
Rounding.None (scripts/sd-fit.mjs, sd-ministry-check.mjs; data/sd-fits.json):
- solar block at a uniform +8 minute pad: sunrise 30/30 within-1 (mean +0.43), dhuhr 30/30
  (+0.23), asr 30/30 (+0.3), maghrib 30/30 (-0.13)
- isha = maghrib + 90: 27/30 exact, 30/30 within-1, worst 1
- fajr: 17 deg at no pad (30/30 within-1, worst 1, mean +0.5) degenerately equal to ~19 deg
  at the +8 house pad (28/30 within-1); a one-month window at 15.5 N cannot separate them;
  both readings recorded, never blended
- the print stores afternoon times without a marker; the +12h rule applied on asr/maghrib/isha

Second dated year: salaty.net already serves the Ramadan 1448 edition (2027-02-08..03-09)
for five Sudanese cities - 150 dated rows banked platform-labelled (tier platform, never
provenance; data/sd-salaty-1448-six-cities.json, captures/salaty-*-imsakia.html.gz,
scripts/sd-salaty-parse.py). At Khartoum the 1448 platform table reproduces the ministry
line cell-for-cell in structure: solar block at the same ~+8 pad (sunrise +8.33, dhuhr +8.1,
maghrib +7.73 means), isha = maghrib + 90 flat (150/150 rows across all cities), fajr 17 deg
no-pad 30/30 within-1 (worst 1, mean -0.13) - the SAME recipe rule across two distinct dated
years at the reference city. Per-city computation confirmed at the platform: with the +8 pad
Atbara, Port Sudan and El Obeid solar columns 30/30 within-1 each (worst 1) at their own
points; Wadi Halfa unresolved at its own point (mean -12.7 at the best pad, all pads fail)
and its fajr unresolved (best 21.75 deg only 17/30 within-1) - recorded, not repaired.

Grade: candidate (the Sudanese authority line: one fitted month 1446 + one platform-reproduced
month 1448; no year-round Sudanese surface exists). Tier: authority for the ministry print
(inherited), platform for the 1448 bank. Span verdict: untestable-short-sample (30-row
Ramadan editions only). Route negative: the ministry itself has no web surface (English and
Arabic searches land on Facebook/Instagram republishes and platforms; the Red Sea state's
1447 official imsakiya is Instagram login-walled, never fetched).

Single-day witnesses: rgtrustschool.net's Arabic-state imsakiya row for Khartoum 2026-02-18
(imsak 05:00, fajr 05:10, maghrib 17:55) vs the held 1447 state table same-day (fajr 04:55,
shuruq 06:13, maghrib 17:54): maghrib within 1, fajr +15 apart - a republisher
approximation, recorded as a witness diff, never banked as rows
(captures/rgtrustschool-arlive42.html.gz).

## Madagascar

BANKED, 736 dated days on one recipe + genuine year-2 recompute (2026-11-12).

Surface: masjidbox board "Islam Da'wa Malagasy" (slug salama), Antananarivo, verified board
flag, timezone Africa/Nairobi. The masjidbox landing API (public app key, the board's own
7-day windows) walked 105 windows (scripts/mbx-walk.py, captures/mbx/salama/*.json.gz, one
journal): 2026-01-01..2027-01-06 complete, 2027 complete, plus 2028-01-06. Zero gaps.
Rows: data/mg-salama-2026-2027.json.

Fit at the point SOLVED FROM THE BOARD'S OWN SOLAR COLUMNS (-18.75, 47.5 - Antananarivo;
scripts/mg-salama-fit.mjs, mg-salama-refit.mjs; data/mg-salama-fit-clean.json), adhan 4.4.6,
Africa/Nairobi, Rounding.None:
- sunrise, dhuhr, asr (Shafi), maghrib: 365/365 within-1 each, worst 1, means ~+0.45 (the
  board rounds up; a uniform half-minute)
- fajr = 18.5 deg: 365/365 within-1, worst 1, mean +0.41
- isha = printed maghrib + 90: 335/365 exact; the 30 deviating days are ONE DATED BLOCK
  (2026-02-19..03-19 and strays) at maghrib + 120 - the Ramadan 1447 tarawih regime, inside
  the board's own 2026 year. Never blended: standard +90, Ramadan block dated.
- the board also carries iqamah columns alongside (banked, not fitted)

Year-2 diff (2026 vs 2027 by month-day, 2,190 cell pairs): 230 cells move - fajr 46,
sunrise 38, dhuhr 21, asr 28, maghrib 39 (all +-1 minute), isha 58 (max 30: the Ramadan
block slides with the Hijri year). GENUINE RECOMPUTE, not a frozen reprint. The 2027 +120
block as served to date runs 2027-02-19..03-04 (29 days; the walk's horizon truncation, recorded).

Tier: community (a masjidbox association board). Grade: community (a fitted non-authority
surface). Span verdict: yes (two distinct years on one recipe). The Fazilet Antananarivo
family rows (fitted, grade A family) stand beside it as the second line at this city.

Witness (same-day per-column diffs vs the Fazilet family line, Antananarivo cityId 2580,
three dates; data/mg-salama-vs-fazilet-witness.json, captures/fazilet-2580-*.json.gz):
fajr -12..-13, sunrise +3, dhuhr -7, asr -5, maghrib -7..-8, isha +8..+12 - two distinct
computed generations at the same city, quantified, never blended.

## Comoros

BANKED negative-as-to-recipe, 366 dated rows (2026-11-12).

Surface: mawaqit board (Masjid al-Jum'a - Sima), slug msjd-ljm-sima-97300-comoros (the
/fr/m/ path 307-redirects to the plain slug; captures/mawaqit-sima-comoros.html). The static
page embeds a 12-month calendar (366 day entries, six columns); the board prints NO year
(the year-blind mawaqit class, same verdict as NP-RAHMANIYA-BOARD). Rows banked:
data/km-sima-calendar.json, tier community.

Structure measured: dhuhr, asr, maghrib, isha, fajr all move day by day; the SHURUQ column
is broken (4 distinct values across the whole year, max deviation from computed sunrise
42-46 min at either candidate point). Recipe fit FAILS at both candidate points (Sima,
Anjouan -12.31/44.45: dhuhr vs transit mean +8.9; Moroni -11.7022/43.2553: dhuhr mean +4.1,
maghrib 286/366 within-1 but isha unfitted); the board serves no coordinates in the static
page and the API route is the JWT-walled class. Verdict: dated rows banked, recipe NOT
PROVEN - the board's computed point is unknown. Never blended with the Fazilet Moroni rows.

## Central African Republic

BANKED, 366 dated rows fitted 366/366 on four columns (2026-11-12).

Surface: mawaqit board Mosquee Saina Youssuf, Avenue UDEAC, Bangui (slug
mosquee-saina-youssuf-avenue-udeac-bangui-central-african-republic; the search-indexed URL
was truncated and 404s, the full slug serves). The static page embeds a 12-month calendar
(366 entries, six columns), no year printed (the year-blind mawaqit class). Rows banked:
data/cf-bangui-saina-calendar.json, captures/mawaqit-saina-bangui.html, tier community.

Fit at Bangui 4.36/18.56, Africa/Bangui, adhan 4.4.6, Rounding.None:
- shuruq = sunrise: 366/366 within-1, worst 1 (mean +0.6)
- maghrib = sunset: 366/366 within-1, worst 1 (mean +0.55)
- fajr = 14.75 deg: 366/366 within-1, worst 1 (exact 196)
- isha = 15.25 deg: 366/366 within-1, worst 1 (exact 200)
- asr = Shafi at mean +0.6: 266/366 within-1, worst 3 (Hanafi refuted, worst 74)
- dhuhr = FIXED 13:00 all year (a clock, about +29 on transit)
A 14.75/15.25 twilight pair - the board's own recipe, recorded. Tier: community.
Grade: community (fitted non-authority surface). Span verdict: untestable-single-template
(the calendar is a served generation with no printed year).

## Seychelles

BANKED, 29 dated rows fitted (2026-11-12).

Surface: the Islamic Society of Seychelles' own site (isoseychelles.org) carries the Masjid
Sheikh Muhammad bin Khalifa Al-Nahyan (Victoria) PRAYER & JAMAAT TIMETABLE as monthly PDFs:
/media/attachments/2026/11/10/jumada-al-akhiraah-timetable.pdf (NOV/DEC 2026 = Jumada
al-Akhira 1448, 1 page, table 11 Nov - 10 Dec 2026). OCR through the local Vision fast
reader (captures/sc-isos-jumada2-1448.pdf, sc-isos-jumada2-1448-ocr.txt; parse
scripts/sc-parse3.py; data/sc-isos-1448-timetable.json). 29 clean rows banked (the 30th
row's OCR is partial and stays open); the OCR emits each row's times then the NEXT row's
date token (validated on every read token; December's date tokens 21-29 mismatch their
rows and stand as unresolved extraction cells, never repaired; the weekday cycle validates
continuously WED..WED, so the row attribution is secure).

Fit at Victoria -4.6196/55.4513, Indian/Mahe, adhan 4.4.6, Rounding.None
(scripts/sc-fit.mjs; data/sc-isos-fit.json), on the printed BEGIN columns:
- sunrise: 29/29 EXACT, worst 0
- fajr begin = 17.75 deg: 29/29 within-1 (exact 24)
- isha begin = 17.25 deg: 29/29 within-1 (exact 25)
- maghrib begin = sunset + 2: uniform (worst 2, mean +2.0)
- asr begin = Shafi at about +1: 24/29 within-1, worst 2, mean +1.17 (Hanafi refuted,
  worst 62); a jama'at column runs beside every prayer (banked, not fitted)
Tier: authority (the association's and the mosque's own print). Grade: provisional (one
published month). Span verdict: untestable-short-sample. Year-2 route: the site's monthly
PDF rolls (the December sheet expected on the same attachments path); the archive route is
closed for now - Wayback returned 503 Temporarily Offline on this wave's single probe
(thread stopped per the standing rule). The site also embeds a prayer.com widget - a
platform embed, labelled platform, never provenance.

## South Sudan

NEGATIVE with routes. The Islamic Council of South Sudan has no web surface: its public
trace is a Facebook page photo (facebook.com/ssichqs, login-walled, never fetched) and a
hajj-registration news item (sudanspost.com). Juba's city traces end at platform pages
(muslimpro, athanpro, islamicfinder). No mosque own-site, no masjidbox or mawaqit board
found under those names. Languages searched: English, Arabic transliterations of Juba.
Searches: "mosquee Juba South Sudan islamic council prayer times", "Juba mosque prayer
times site official". The Fazilet rows (Cuba, Aweil - the layer's two cities) and the
turktakvim platform tables stand as the held lines.

## Eritrea

NEGATIVE with routes. No Eritrean authority or mosque surface on the open web: Asmara
traces end at platform pages (muslimpro, islamicfinder, athanpro, matwproject) and a
Facebook post of the Eritrean diaspora (Eriaddis, login-walled, never fetched). No Dar
al-Ifta web presence found under Arabic/English searches; no masjidbox/mawaqit board. The
Fazilet Asmara row and the turktakvim platform tables stand.

## Cape Verde

NEGATIVE with routes. No own surface: the Muslim community's public traces are Instagram
reels (login-walled, never fetched) and the Brazilian federation FAMBRAS's horario page
(fambras.org.br/horario-de-oracao) - fetched and found to be a generic prayer-times
explainer whose Cabo Verde block lists mosques as phone contacts, with no table (route
recorded, no artifact kept). Languages: Portuguese, Kabuverdianu transliterations. The
Fazilet Praia row and the turktakvim platform tables stand.

## Sao Tome and Principe

NEGATIVE with routes. No surface at all: searches in Portuguese (mesquita, muçulmanos,
oração) return generic prayer-content reels and a TVE (Sao Tome TV) YouTube visit to the
capital's mosque - no schedule, no board, no own site. NOTABLY the Fazilet family has NO
Sao Tome layer at all (its 211-layer enumeration carries none), so the country holds only
its turktakvim platform tables; this wave adds the negative naming the routes.

## Equatorial Guinea

NEGATIVE with routes. No own surface: Malabo traces end at Spanish-language platform pages
(islamicfinder, matwproject, horarios-salat, muslimpro). No association site, no board
found. Languages: Spanish, French, Portuguese. The Fazilet Malabo row and the turktakvim
platform tables stand.

## DR Congo

NEGATIVE as-to-new-surfaces (the O1n-14 inheritance stands). The Kinshasa and Lubumbashi
traces rechecked this session end at platform pages (muslimpro, islamicfinder, athanpro,
prayertimes.date) and press/Facebook items; the Congolese Islamic organisations'
(ADI/CIRDC-class) public traces remain Facebook-only. The new masjidbox/mawaqit boards
found this session do not include any Congolese mosque. The Fazilet Kinshasa/Lubumbashi
rows (family grade A) and the turktakvim platform tables stand.

## Congo-Brazzaville, Gabon, Cameroon, Chad

NEGATIVES with routes. Brazzaville and Libreville: platform pages only (muslimpro,
islamicfinder, athanpro, muslim-expert, laimuna, hamariweb); the Grande Mosquee Hassan II
Libreville has no own site (its public traces are Moroccan-media features and Facebook
videos). Cameroon: the Conseil des Imams et Dignitaires Musulmans du Cameroun's public
traces are CRTV/Facebook items (login-walled, never fetched); Douala/Yaounde traces end at
platform pages. Chad: the Conseil superieur des affaires islamiques du Tchad (renamed
Conseil national des affaires islamiques, Jan 2026, per alwihdainfo) has NO web site; its
public traces are OIC/iifa press releases, ONAMA/MRTV Facebook videos and YouTube. No
masjidbox or mawaqit boards found for any of the four countries' capitals. The Fazilet
rows (Brazzaville 2, Libreville 6, Douala/Yaounde 12, N'Djamena-class 17 cities) and the
turktakvim platform tables stand.

## Wayback note

One CDX probe per surface: namaztimes.jummahmasjid.org empty (no captures - the app is
new); the isoseychelles.org attachments probe returned 503 Temporarily Offline and the
thread stopped per the standing rule.


## Closing tally (2026-11-12)

New dated rows banked this wave: 2,378 (Mauritius 365 + Bait Ul Noor 366; Sudan platform
1448 150; Madagascar 736; CAR 366; Comoros 366; Seychelles 29), plus 8 Fazilet same-day
witness captures (Mauritius 5 dates, Madagascar 3 dates) and the two held Sudan Ramadan
tables fitted for the first time. Ten bundle entries close as honest negatives naming
routes, phrasings and languages. No subagents deployed; nothing outside this workspace
was written; the excluded-territory bullet applied by reading and never restated.
