# O1k wide research — oceania2 (Australia per-state, New Zealand after the domain death, Fiji split, Pacific retries)

Returned 2026-11-10. Builds on banked context (MIA Liverpool Amanahly year, Victoria Hilaal textless, Fiji Dec 2026 9-min split, fianz.co.nz suspended). No subagents, public pages only, no logins; Facebook pages read through public renders (TinyFish / named agent-browser session) only.

## Australia

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Preston Mosque / ISV Ramadan Timetable | isv.org.au/ramadan-calendar-2026/ (PDF Rizmana-1.pdf; linked from Preston Mosque public FB post 2026-02-04) | community mosque | 30 rows, Feb 18*–Mar 19, all six prayers | 2026 |
| Diyanet location 11331 Broadmeadows | namazvakitleri.diyanet.gov.tr/en-US/11331 (full-year table embedded in served HTML) | authority (Diyanet; Turkish mosque convention) | 365 rows, all prayers + sunrise | 2026 |
| Diyanet location 11281 Preston | same platform, second Melbourne grid point | authority (Diyanet) | 365 rows; differs from Broadmeadows 0–1 min (one calculation, two grid points) | 2026 |
| Diyanet location 11428 Brisbane | same platform | authority (Diyanet) | 365 rows | 2026 |
| Auburn Gallipoli Mosque own API | gallipolimosque.org.au POST /api/rpc/prayer/month {"json":{month,year}} | community mosque (own site; prints method "Diyanet İşleri Başkanlığı", seasonEnd 2027-09-30) | 91 rows (2026-11, 2026-12, 2027-06), imsak/begins/iqamah per prayer | 2026–2027 |
| Masjid Ali Bin Abi Talib (Lakemba) AthanPlus monthly | timing.athanplus.com/masjid/widgets/monthly?masjid_id=rdRvkZdG (embedded on lma.org.au) | community mosque | 56 rows (2026-11: 30 full; 2026-12: 26 as entered), iqamah, maghrib printed "Sunset" | 2026 |
| Othman Bin Affan Mosque AthanPlus monthly | same platform, masjid_id=Edol4oK7 | community mosque | 56 rows (same months) | 2026 |
| Islamic Society of South Australia monthly schedule | islamicsocietysa.org.au/monthly-prayer-schedule/ | community mosque body | 61 rows transcribed (Nov + Dec 2026); Apr–Oct 2026 PDFs banked raw (7 months) | 2026 |
| Bosniak Islamic Centre of Qld AthanPlus monthly | timing.athanplus.com/masjid/widgets/monthly?masjid_id=VKpDaOKP | community mosque | 2 dated iqamah rows (Nov 1, Nov 6) + 2 Jumu'ah sessions | 2026 |

Today-only / calculator-class surfaces (no dated tables; the record's "mosque layer publishes through clock widgets" holds): LMA own page (AthanPlus embeds, gated live), Punchbowl Mosque on time.my-masjid.com timingscreen (today+tomorrow), ICMG Guildford on masjidbox, Masjid As-Salam Guildford on gopray, Auburn Gallipoli gopray page, Al-Taqwa Mirrabooka on awqat.com.au and gopray (gopray's cached Maghrib 7:xx is stale vs the live 8:05), ICV City Mosque (MosqueScreen vercel display, today+tomorrow), Adelaide City Mosque own site + masjidbox (today). gopray.com.au itself: 762 mosques, iqamah-offset class — a new platform worth a sweep of its own.

**Confirms:** UMA/Lakemba single-calculation claim (both LMA mosques' AthanPlus monthlies carry the same iqamah grid); the "mosque layer is widget-class" defect.
**New:** ~1,100 dated Australian rows: Preston Ramadan 30; Diyanet years 1,095 (three locations, two distinct calculations); Gallipoli 91; Lakemba + Othman Bin Affan 112; Adelaide ISSA 61 (plus 7 raw months); Bosniak 2. QLD, WA and SA now have dated tables where the record said "today-only or absent".
**Fit-worthy:** Diyanet's Melbourne year (365, both grid points) and Brisbane year; Preston's Ramadan month; Adelaide ISSA months. Lakemba's November is a clean jamaah-month object.
**Gates passed:** Gallipoli API row for 2026-11-11 equals the live SPA screen exactly; Diyanet sunrise/maghrib track solar; Adelaide ISSA table values monotone and sun-tracking. Transcription-confidence rows flagged inside the Adelaide JSONs (dark banding).

## New Zealand

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| FIANZ Ramadhan Calendar, successor domain | fianz.com/ramzan-calendar/ (33 city sheets, uploads/2026/01/*.jpg) | community federation | 33 city sheets for Ramadan 1447H (2026), Feb 19–Mar 20; Auckland/Wellington/Christchurch transcribed (90 rows) | 2026 |
| FIANZ Facebook | facebook.com/FIANZ.NZ post 1372646068242255 | community federation | Hilal confirmation: Ramadan 1447H begins Fri 20 Feb 2026 | 2026 |
| Wayback of dead fianz.co.nz | CDX enumerations saved (captures/nz-fianz-cdx-*.json) | archive | one sheet-class URL found (/salat/fianz_salat_ramadan.php); 2010 snapshot is carrier-blocked junk (Vodafone age-gate), 2012 snapshot carries no table; no archived PDFs under uploads | 2010–2012 |

**Confirms:** the record's stated offsets print VERBATIM on the new sheets ("5 minutes allowed between end of Suhur and Fajr. 5 minutes allowed between sunset and Iftar/Maghrib. Asr time is based on single shadow. Asr time based on double shadow is 40 mins later."). The surface is REBORN, not dead: fianz.co.nz suspended, fianz.com live, multi-city (33 towns vs the record's Auckland-only transcription).
**New:** 90 dated NZ rows (three cities), 30 raw sheets banked.
**Contradiction worth the owner's eye:** the sheets start Ramadan 1 = Thu 19 Feb 2026 while the Hilal Committee's public confirmation says Ramadan begins Fri 20 Feb (same two-editions pattern as Fiji, now in NZ).
**Negatives:** Christchurch Masjid Annur (masjidannur.org.nz/prayertimes) is Cloudflare-challenged (403 curl, interstitial hang in browser); its TinyFish cache shows today-only class. Ponsonby/NZMA prayer-timetable page embeds a quranbookk.com calculator iframe (calculator-class). Wellington Kilbirnie + NZ Islamic Cultural Trust on masjidbox: today-only. No login used anywhere.

## Fiji — widget-vs-sheet verdict

Both editions captured for the same December dates (plus November):
- **Widget layer:** fml.com.fj runs WordPress `daily-prayer-time-for-mosques` (dpt); public ajax `admin-ajax.php action=get_monthly_timetable` returns the full month. Captured Nov 2026 (30) + Dec 2026 (31) = the banked 61 rows, each with Suhoor End, Fajr Iqamah, Sunrise, per-prayer Begins/Iqamah.
- **Sheet layer:** the league's printed monthly sheets (site uploads; December identical to the image posted on the league's public Facebook on Saturday 29 November 2025, post 1239994874821937, 31 rows transcribed with dual Asr and the town ladder).

Deltas (sheet minus widget Begins), stable across both months: fajr 0/+1, sunrise 0/+1, dhuhr +5 constant, asr −1/+1, maghrib +2/+3, isha +6..+10. The banked "up to 9 min" reproduces on November isha (Nov 1 = +9, max Nov 13 = +10); December alone maxes +7. The sheet's maghrib equals the widget's Maghrib Iqamah column exactly every day (both sunset+3). Two standing editions confirmed in the wild; a fit must name its edition (belongs-to-version for the owner).

Year evidence 2025: December 2025 sheet captured from the league's public Facebook (posted Sat 29 Nov 2025) — 31 rows, dual Asr (Hanafi column in a companion file), town ladder including Lakeba −11 (record's convention confirmed in print). The site's year-agnostic month images chain Nov 30 → Dec 1 exactly, so the "stale-2024" uploads are the CURRENT edition by content.

## Pacific retries

| Territory | Verdict |
|---|---|
| Papua New Guinea (Hohola/Port Moresby Mosque) | negative again — no own or community surface; calculators only (athanpro, muslimpro, praywatch) |
| Solomon Islands | negative again — calculators only |
| Vanuatu | negative again — calculators only |
| Samoa | negative again — calculators only |
| Kiribati | negative again — Ahmadiyya mosque in South Tarawa exists (Wikipedia), no times surface |
| Tonga | mosque layer CONFIRMED as a surface: Masjid Al-Khadeejah public Facebook page (facebook.com/imamIlyasmanu, Kolomotu'a, 140 followers, no times posted); times remain calculator-only |
| New Caledonia | **current month captured as a full year**: Centre Islamique de Nouméa is on Mawaqit (mawaqit.net/fr/m/mosquee-de-noumea-noumea-98800-new-caledonia); embedded calendar + iqamaCalendar extracted, 365 dated rows (a stray 2026-02-29 row from the platform dropped on normalization), live-display gate passed. Dhuhr/asr land on exact 5-minute marks all year (CONFIRMED). Isha pinned 19:45 all year (REFUTED in this edition): 19:45 holds 243/365 days; 19:50/19:55/20:00/20:05/20:15 cover the rest. Iqama offsets constant (+10, +10, +10, +5 asr, +10) |
| French Polynesia | Tahiti Masjidway page (en.masjidway.com/masjid/3814) verified STILL UNCLAIMED verbatim ("If you are the manager of this masjid…"); times are calculator output ("Method: Australia"); nothing captured per instructions |

## Honest negatives and blocks

- masjidannur.org.nz: Cloudflare challenge, unresolved without interaction; recorded, moved on.
- Facebook public feeds render only partially anonymously; post images fetched only from posts whose permalinks render publicly (numeric-id permalinks), no login at any point.
- Wayback accrual for fianz.co.nz: the archive itself intermittently 503/504'd; all successful CDX queries saved. The live successor domain supersedes the archive for sheet evidence.
- No dpt-plugin mosque found in Australia (FML Fiji remains the territory's dpt user). Masjidal: no Australian mosque page found; the "Masjidal" platform is absent from the territories swept.
- AthanPro monthly pages for Port Moresby/Nuku'alofa exist but are calculator-class output — recorded as surfaces, never captured as data.

## Data files

`data/fj-2025-12.json`, `fj-2025-12-asr-hanafi.json`, `fj-2026-11-sheet.json`, `fj-2026-11-dpt-widget.json`, `fj-2026-12-dpt-widget.json`, `fj-widget-vs-sheet-verdict.json`, `nz-2026-ramadan-auckland.json`, `nz-2026-ramadan-wellington.json`, `nz-2026-ramadan-christchurch.json`, `au-2026-ramadan-preston-isv.json`, `au-2026-diyanet-broadmeadows.json`, `au-2026-diyanet-preston.json`, `au-2026-diyanet-brisbane.json`, `au-gallipoli-own-api-2026-11_12_2027-06.json`, `au-athanplus-rdRvkZdG-2026-11_12.json`, `au-athanplus-Edol4oK7-2026-11_12.json`, `au-2026-11-adelaide-issa.json`, `au-2026-12-adelaide-issa.json`, `nc-2026-noumea-mawaqit-year.json`. Raw pages in `captures/` (106 files).
