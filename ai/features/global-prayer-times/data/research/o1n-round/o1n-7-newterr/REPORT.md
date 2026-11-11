# O1n-7 REPORT — new territory: small states, unclaimed presences, council layers

Wave: o1n-7 of round four (o1n). Workspace: this directory. Fit engine: adhan 4.4.6 at
`census/adhan-build/node_modules/adhan`, Rounding.None, dates from literal capture strings,
IANA offsets, unless a surface's own engine is stated beside the fit. Discipline per the round
brief: public pages only, honest negatives name terms and languages, every raw artifact kept,
OCR local Vision binary only, UTC provenance stamps, no real-clock reads in data.

Fronts, worked in order. Banked = normalised dated rows under `data/`.

| Front | Object | Verdict | Banked rows | Tier |
|---|---|---|---|---|
| 1 | Timor-Leste | banked: 1 platform surface (30 rows, fit 100 pc); authority/community negative with languages | 30 | platform |
| 2 | Maldives | banked: ministry annual calendar 2015, Male, 365 rows, fit 18.90/19.05 + margins, 365/365 within 1 (PASS); current ministry site Cloudflare-walled | 365 | authority |
| 3 | Bhutan | dated negative: no public mosque, no organisation; Dzongkha has no timetable vocabulary, Nepali attempt engine-walled | 0 | — |
| 4 | Micro-states (Andorra, Liechtenstein, Monaco, San Marino, Vatican) | dated negative: Andorra 0 mosques, Monaco 0, Liechtenstein 1 (Diyanet-class, no site), San Marino 1 prayer room (Al Nur, no site), Vatican 0 | 0 | — |
| 5 | Caribbean and Central America second cities | banked: 7 muslimsalat monthly tables (20 rows each), uniform platform convention characterised; all community routes recorded negative | 140 | platform |
| 6 | Horn and Sahel councils | horn: dated negative per country + 1 Sudan single-day print (evidence); sahel: Chad/Guinea/Sierra Leone (SL table FIT discharged, PASS) + Mali negative folded | 30 (SL) | community (SL) |
| 7 | Pacific remainder | Solomon + Tuvalu community presences found (MIWT Honiara; Ahmadiyya Tuvalu Mosque), computed single-day values recorded never banked; Nauru/Kiribati negatives | 0 | — |

## Front 1 — Timor-Leste

The record's state: one Diyanet tree city ("DOGU TIMOR" = Dili, 365 rows at 18/17, per
`o1m-r7-diyanet/fit/table.md`), recorded and explicitly NOT claimed (corrections B31).

**Banked — platform (second publisher).** `data/tl-jadwalsholat-net-dili.json`: jadwal-sholat.net
Dili monthly table, November 2026, 30 dated rows. Raw capture
`captures/tl/jadwalsholat-dili-2026-11.html` (curl, 44,051 bytes). The page self-declares
"Liga Muslim Dunia — Hanafi". Fit (adhan 4.4.6, Rounding.None, Asia/Dili, point -8.5569/125.5783):
**MWL 18/17 Hanafi with dhuhr +1 exactly on all 30 rows (0/30 exact, mean 1.00), every other
column zero — 30/30 within-1, rms 0.428 min.** Live gate: a second curl re-fetch one minute later
prints identical same-day values (04:54/06:07/12:22/16:48/18:36/19:45), 6/6 identical.

**Authority/community tier — honest negative.** The An-Nur Mosque (Mesquita An-Nur, Alor
Village/Kampung Alor, Dili, est. 1955; coordinates -8.54979/125.56022 from its Wikipedia page,
captured at `captures/tl/annur-dili-wikipedia.html`) carries no published timetable on any
surface found. Searches in English, Indonesian ("jadwal sholat Dili", "Masjid An-Nur Dili"),
and Portuguese ("horários de oração Dili mesquita comunidade") surfaced platform layers only
(IslamicFinder, TimesPrayer, MuslimPro, jadwal-sholat.net); no mosque page, no association
sheet, no Tetum-language print surfaced at all (Tetum terms: "horasaun tumu" family — the
engines return nothing under them). Google served a captcha on two queries, DuckDuckGo on two,
Mojeek and Ecosia bot-blocked; the remaining reads went direct. Facebook's public directory
returned people profiles only. Not found under these terms: authority or community tier.

## Front 2 — Maldives

Full report: data/mv-summary.md. BANKED, authority tier: the Ministry of Islamic
Affairs' own annual prayer calendar for 2015 (islamicaffairs.gov.mv download, taken
from the Wayback Machine capture 20150105070547; the live ministry domain serves a
Cloudflare challenge — recorded). Raw: captures/mv/mvi-2015-calendar.pdf (image-only
scan, 17 pages). Pipeline: PDFKit renders 4.2x/6.5x, local Vision OCR, column-aware
parser (isha, maghrib, asr, dhuhr, sunrise, fajr order; 12-hour print; every token
window-checked) → 365/365 rows, zero anomalies. Normalised: data/mv-islamicaffairs-
male-2015.json. Fit (adhan 4.4.6, Rounding.None, Male 4.1755/73.5093, Indian/
Maldives, Shafi): fixed ministry margins measured from signed residuals — sunrise
−2, dhuhr +3, asr +1, maghrib +2, fajr and isha pure — then angles **fajr 18.90 /
isha 19.05, 365/365 days all six columns within 1 minute, rms 0.431 min**. The
2019 wayback "prayer page" is a downloads listing with no table; namaadhu.com is
"Coming Soon". Dhivehi term on record: namaadhu (prayer); Thaana OCR-unreadable,
recorded. Dated regime 2015, never blended.

## Front 3 — Bhutan

Full report: data/bhutan-summary.md. Honest negative, as anticipated: no publicly
recognised mosque, Muslims pray in homes or multi-faith rooms (Bumthang facility),
the Ahmadiyya 2008-mosque claim is unverified. Languages: Dzongkha (no online
Islamic timetable vocabulary exists), Nepali attempt engine-walled, English terms
attempted. Nothing to bank.

## Front 4 — Micro-states

Full report: data/micro-summary.md. Dated negative with the mosque-layer reality
named against the platforms: Andorra 0 purpose-built mosques (community centre,
imam Raguig, no site), Monaco 0 (congregation crosses to Beausoleil, France),
Liechtenstein exactly 1 (Green Mosque / Yeşil Camii, Diyanet-affiliated
Liechtenstein Türk Birliği — no domain resolves, no Gebetszeiten online),
San Marino 1 prayer room (Al Nur / Islamic Centre of San Marino, Gualdicciolo,
daily prayers, president Cristina Mercadini — no domain resolves, Ramadan announced
by comunicato but no table), Vatican 0 (2025 visitor prayer room in the Apostolic
Library, no community). Languages attempted per state: Catalan, German, French,
Italian, English. Platform mosque directories (IslamicFinder /other-prayers/,
Masjidbox country routes) are 404/410 shells this session — the "N mosques"
artifacts stay unrated against reality: 1+1+0+1+0. Nothing to bank.

## Front 5 — Caribbean and Central America second cities

Full report: data/carib-summary.md. BANKED, platform tier: seven muslimsalat.com
monthly tables (20 rows each, 2026-11-11..2026-11-30) — Nassau, Belize, Havana,
Santo Domingo, Georgetown, Port-au-Prince, Cap-Haïtien (the front's second-city
item). data/carib-muslimsalat-*.json. Uniform platform convention characterised
across all seven: fajr 18.1 / isha 16.9-16.95 / Shafi asr exact, with fixed offsets
on the sun columns (sunrise ~4.5 early, dhuhr ~1.5 early, maghrib ~3.6 late —
deeper horizon + dhuhr margin), fits in data/carib-muslimsalat.fits.txt. Community
routes all recorded negative: Bahamas (one mosque, Jamaa Ahlus Sunnah, site dead,
2013 wayback homepage is a forum shell with no table), Belize (FB login-walled),
Cuba (FB login-walled), Dominican Republic (Círculo Islámico fetch empty, FB
login-walled), Haiti (FB login-walled), Guyana (CIOG DNS dead, Guyana Islamic
Trust live but tableless, FB login-walled). Languages: English, Spanish, French,
Creole. 140 rows banked.

## Front 6 — Horn and Sahel councils

Horn: data/horn-summary.md now carries the full per-country ledger (Eritrea,
Djibouti, Somalia, Sudan, South Sudan). Every country: dated negative with causes
(mawaqit JWT wall; RTD/La Nation WordPress and RSS searches — La Nation "imsakia"
returns ZERO items; Radio Muqdisho REST 404 on all Somali terms; shabait,
sudanile, sudaneseonline tableless). One dated single-day print banked as
evidence: alshaab.net's "إمساكية رمضان وموعد الافطار في السودان" (posted
2025-03-01) — Khartoum imsak 04:55 / fajr adhan 05:10 / shuruq 06:30 / dhuhr
12:20 / asr 15:45 / iftar 18:35 / isha 19:50, one row, no table, first-fast date
unstated; captures/horn/wp-alshaab-imsakia.json.
Sahel: data/sahel-summary.md (banked by the cancelled child's session) covers
Chad (negative), Guinea (negative, SGAR site live but tableless), Sierra Leone
(Freetown Ramadan 1447 table FIT DISCHARGED: data/sahel-sierraleone-sliwebsl-
freetown.json, 30 rows, fit fajr 17.9 / isha 17.15, RMS 0.537, all columns 30/30
within 1 — the census lift note on this country is closed) — Mali folded in this
wave: HCIM Facebook login-walled (@hci.mali exists), Bamako mawaqit mirror
(Al Madina Al Mounawara) SSR-name-only, malijet 404, maliweb Cloudflare.

## Front 7 — Pacific remainder

Full report: data/pacific-summary.md. Solomon Islands: Melanesian Islamic Welfare
Trust Center, Honiara — community presence with a pray.zone profile rendering one
defective computed day (sunrise field prints "21:48"), recorded never banked;
Facebook "Solomon Islands Muslim Youths" exists, login-walled; the Diyanet row
stays the record's dated surface. Tuvalu: Ahmadiyya Tuvalu Mosque, Funafuti — the
country's only purpose-built mosque; profile on prayer-times.app2mob.com states
plainly its times are "city-wide average until verified mosque timings are
submitted" (2026-11-12 day recorded). Nauru: no mosque exists (honest negative).
Kiribati: Ahmadiyya community with a small South Tarawa mosque, no name published,
no timetable; AMJ press 0 items; government portal has no Islamic content. OSM/
Overpass: zero mosque nodes across all four. Languages: English official in all
four; local languages carry no online timetable vocabulary. Nothing banked; two
community presences recorded with their computed-day evidence.

## Session close

Wave o1n-7r (continuation of cancelled o1n-7) closes 2026-11-11. All seven fronts
banked or dated-negative with languages. New data files this wave: mv-islamicaffairs-
male-2015.json + .fit.txt (365 rows, authority), carib-muslimsalat-{bs,bz,cu,do,gy,
ht,ht2}-*.json (140 rows, platform) + .fits.txt, and per-front summaries (mv,
bhutan, micro, carib, pacific) with horn and sahel summaries completed. Raw
artifacts for every read stand under captures/ — all 360 capture files gzipped in
place at close, so paths cited above read as <path>.gz.
