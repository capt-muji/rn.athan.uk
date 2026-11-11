# O1k wide research — centralasia (Uzbekistan, Kazakhstan, Kyrgyzstan, Tajikistan, Afghanistan, Georgia, Azerbaijan, Russia, Australia, New Zealand, Fiji)

Method: TinyFish search where it served (it throttled repeatedly; the recorded ladder tinyfish -> curl with browser UA -> agent-browser session o1k-centralasia was followed; Google and DuckDuckGo served captcha/challenge pages which were never solved, Bing returned query-independent results in this session and is flagged unusable). Raw responses for every surface are under captures/ (462 files incl. the 365 Amanahly day responses); normalized rows under data/ (2,478 dated rows). No login, no forms submitted, no challenges solved, no contact.

Tag: centralasia. Date of work: 2026-11-10. Standing rules of the brief obeyed: public pages only, no login/forms/contact, raw captures under `captures/`, incremental writes, no subagents. Search languages used per country are named in each section.

## Uzbekistan

The attribution question (state board vs islom.uz). What was captured, all on the same civil date (2026-11-10, Tashkent unless said):

| Source | URL | Official/community | What dated data it holds | Years |
|---|---|---|---|---|
| islom.uz taqvim (daily) | islom.uz/taqvim (client-side render; captured via headless browser) | private portal, computes in-browser (adhan-js in own bundle) | daily, per-region | perpetual (computed) |
| islom.uz oylik (month grid) | islom.uz/taqvim/oylik | private portal | November 2026 for Toshkent, Samarqand, Buxoro (30 rows each) | 2026-11 |
| praytime.uz | praytime.uz/?region_id=1/47/34 | community portal BUT states: "Namoz vaqtlari O'zbekiston musulmonlari idorasi taqdim qilgan taqvimga muvofiq olindi" (times taken per the taqvim PROVIDED BY the Muslim Board of Uzbekistan) | daily, 213+ regions, server-rendered | perpetual (computed) |
| muslim.uz (the board) | muslim.uz | authority (state board) | news/graphics only; its /uz/c/prayer page is a fiqh article; no dated timetable on the site | n/a |
| islomiy.info taqvim informer | islomiy.info/taqvim/gettaqwim.php and gettable.php | the board's own widget service ("Muslim.Uz saytining taqvim-informeri"), announced at muslim.uz post 37154 | **DEAD — HostMonster "Account Suspended" page served domain-wide** (captured) | was: per-city widgets |
| sammuslim.uz (the board's Samarkand regional office) | sammuslim.uz | authority (board regional office) | homepage embeds `<iframe src="https://islomiy.info/taqvim/gettable.php?GMT=25...">` — the dead informer above | dead embed |
| muslimshosh.uz (board-linked regional site) | muslimshosh.uz | board-adjacent | calls `islomapi.uz/api/present/day?region=...` | API 502 at capture time (captured) |
| islomapi.uz | islomapi.uz/api/present/day, /month | community API (provenance unstated) | 502 Bad Gateway on both endpoints at capture (captured) | n/a |
| t.me/s/muslimuzportal | the board's Telegram channel, public preview | authority publisher | 4 recent posts, none with namoz vaqtlari graphics (captured) | n/a |

Diff (islom.uz vs praytime.uz, 2026-11-10):

- Samarqand: identical on all seven printed columns (05:51/07:10/07:30/12:16/15:40/17:25/18:40).
- Buxoro: identical on all seven (06:01/07:21/07:41/12:26/15:50/17:35/18:50).
- Toshkent: identical on six of seven; Shom 17:13 (islom.uz) vs 17:12 (praytime.uz) — one minute.

CONFIRMS the census: the numbers still agree (C9's finding), 90 fresh dated rows for the three cities (3 × 30, Nov 2026) in `data/uz-islom.uz-{toshkent,samarqand,buxoro}-2026-11.json`.

NEW on attribution:
1. The board's OWN Samarkand office embeds islomiy.info's taqvim widget — the board historically OPERATED a computed prayer-time service and its regional offices published it. The "private portal vs state board" split is therefore less clean than the record's "muslim.uz publishes graphics only": the state board's computed surface existed at islomiy.info and is now suspended.
2. praytime.uz claims board provenance in print ("per the taqvim provided by the Idora") and matches islom.uz to 0-1 min on all three cities — a third-party attribution claim, community tier, but the strongest print evidence yet that the circulating numbers trace to the board's calendar.
3. The board's annual PRINTED taqvim (the thing the "Qalbaki taqvim" warning protects) is not on the open web as text; its web-era successor (islomiy.info) is dead.

Negative: no November-2026 monthly calendar graphic from the board found on muslim.uz, its infografika category, or its public Telegram page; daily per-region graphics exist on Instagram (login-walled — blocked by the no-login rule, recorded and moved on). Searches run in Uzbek ("namoz vaqtlari noyabr 2026", "site:muslim.uz namoz vaqtlari") and Russian ("намоз вақтлари Тошкент 2026").

## Kazakhstan

Year-6 confirmation of the A fit (muftyat.kz honours any year): Astana full-year 2028 captured with the DST trap neutralized.

- Capture: `captures/kz-muftyat-astana-2028-nodst.json` (366 rows, leap year 2028; city lat/lng echoed by the page: 51.133333/71.433333, tz+5). Normalized: `data/kz-muftyat.kz-astana-2028.json`.
- Method notes (live-verified this run): the page's own `timesByPeriod()` hard-codes `setMethod('ISNA')`, `adjust({asr:'Hanafi'})`, `highLats:'AngleBased'`, `$method='kmdb'`, and the margin block verbatim (`if($c1<48)` → sunrise -3, dhuhr/asr/maghrib +3, else -5/+5 — C19's corrected reading confirmed byte-for-byte in the served JS). DST: `getTimes(..., 'auto', ...)` calls `prayTimes.getDst(date)`, which compares the BROWSER zone's per-date offset to 5 — a Europe/London browser adds +1 h to every summer date. Forcing `prayTimes.getDst = () => 0` before `timesByPeriod` (the third arg does NOT control this) is the required fix; a first capture without it was taken and kept as `kz-muftyat-astana-2028.json` (contaminated summer, labelled).
- Sanity: 1 Jan 2028 = 1 Jan 2026 to the minute (06:36/08:13/12:23/14:36/16:22|16:23/18:00); 21 Jun 2028 within 1 min of 21 Jun 2026 on every column. The recipe is stable at year +2/+3 outside the recorded basis years.

CONFIRMS: Kazakhstan A fit extends to 2028 (366 new dated rows, gap year between the recorded 2027 and 2030 bases).

## Afghanistan

Task: a SECOND witness to the ministry image tables. Search languages: Dari/Persian ("اوقات نماز کابل جدول وزارت ارشاد", "جدول اوقات نماز ۱۴۴۸"), Pashto ("د لمانځګ وختونه کابل"), English ("prayer times Kabul timetable ministry").

FOUND — another ministry page (same publisher, a second dated printing, not independent):
- The ministry's own permanent-table PAGE (mohia.gov.af/dr/جدول-دایمی-اوقات-نماز-های-پنچگانه-شهرکابل) serves an inline raster `inline-images/1_2.jpg` (1,027,701 bytes, captured at captures/mohia-inline/img-1.jpg) that is a DIFFERENT and OLDER printing than the C22 3-pp PDF: a single sheet with TWELVE PANELS — one per named Kabul city district (ناحیه اول through ناحیه دوازدهم), Persian digits, six columns each. Header: "امارت اسلامی افغانستان، وزارت ارشاد، حج و اوقاف، ریاست عمومی ارشام و امور مساجد". Footnote: times follow the Kabul city table and are trusted within 20 km (the C22 sheet says 12 km), issued by "ریاست اطلاعات و اکاسی عامه", dated سال ۱۳۹۹ (2020-21). This is the sheet whose twelve named districts the census's C30 OCR task was meant to unlock — it is live on the ministry's page RIGHT NOW as one raster. The twelve named districts exist in the wild at print resolution; the unlock no longer depends on OCR-ing the C30 PDF.
- The C22 permanent PDF itself is still live and unchanged in place: HTTP 200, 13,078,880 bytes, PDF 1.7 (recaptured raw to captures/mohia-2025-02-aqwat.pdf).

Independents: none found.
- Bing/DuckDuckGo/Google: Bing served query-independent garbage (browser-level poisoning), Google served a captcha (never solved, moved on), DuckDuckGo HTML 202 rate-limit — searches were then run through the ministry's own site search (broken: Drupal search_api fulltext error, 1,127 unfiltered results) and via direct probing.
- ReliefWeb API v1 410, v2 403 for this client; site search blocked. No UN/NGO republication located (record's "no diaspora republication" finding stands).
- The ministry's Pashto mirror has no prayer-table page (only the Dari one).
- The ministry's news listing is AJAX-only; no dated prayer-table news post could be enumerated statically.

NEGATIVE verdict unchanged but sharpened: the second PRINTING exists (ministry's own page, 1399 twelve-district sheet, 20 km note); a second PUBLISHER does not.

## Georgia

Task: capture the Tbilisi Juma mawaqit month grid through the full C32 platform suite, or record it as a lead.

- Capture: `captures/mawaqit-tbilisi-juma.html` — mawaqit.net/en/tbilisi-juma-mosque-32-botanikuri-street-tbilisi-georgia, mosque id 50292, "Tbilisi Juma Mosque - T'BILISI", coords 41.687/44.81, tz field Asia/Tbilisi, jumua 12:50. The FULL-YEAR calendar is inline in the page (12 months × days × [fajr, sunrise, dhuhr, asr, maghrib, isha]); extracted to `data/ge-mawaqit-tbilisi-juma-2026-LEAD.json` (366 rows, lead-class) with the raw conf alongside (`data/ge-mawaqit-tbilisi-juma-conf-2026-11-10.json`).

Platform suite verdict (each test per C32 SCHEMA):
1. Today-row anchoring: PASS — grid 11/10 == page `times`+`shuruq` exactly (06:08/07:36/12:50/15:28/17:53/19:16). Grid dated 2026.
2. Solar gate: FAIL — independent astronomy at the published coordinates (my NOAA calc cross-checked against aladhan's coordinate endpoint, both: sunrise 07:43-44, dhuhr 12:45, sunset 17:45-46): grid sunrise −7 min (outside ±5), dhuhr +5 (inside ±10), maghrib +8 (outside ±5), fajr −16 vs MWL, isha +12. Every column padded conservative; the −7 sunrise is the disqualifying oddity.
3. Byte-identity-vs-default: NOT RUNNABLE — only one mawaqit mosque in the country (the census's finding stands); no same-city grid to compare, no default artifact to diff against.
4. Iqama form: offsets form, all `+0` (iqama = athan), the second inline grid is the all-zero offset calendar.
5. Year resolution: settled by the anchor (2026), the maghrib year-fit is a tie (mean +7.1 both candidate years — the constant padding swamps the drift).
6. TZ-field distrust: tz field consistent with coordinates (Asia/Tbilisi = +4; sunset check verified).

VERDICT: STAYS A LEAD (solar gate failed; a padded mosque grid, not proven platform-default, not proven athan). The census row unchanged. Note: the muftiate's 99-mosque API inventory was NOT re-probed — the record's finding (prayerTimes fields all empty strings) stands as captured by C10 and the app-gated surface cannot be entered under the no-contact rules.

## Azerbaijan

Task: does the muftiate's image archive now hold 2027? (record claimed images to 2031 exist).

- The muftiate's Namaz Təqvimi page (qafqazislam.com/index.php?lang=az&sectionid=123, captured `captures/qafqazislam-namaz-teqvimi.html`) is form-driven but the RESULT IS A DIRECT IMAGE: `./teqvim/{YEAR}/{City}/{MONTH}.jpg` (the page shows `teqvim/2026/Baki/11.jpg`). No form submission needed — the image URLs are directly fetchable, so the no-forms rule was kept.
- Availability probe (HTTP status of `teqvim/{Y}/Baki/1.jpg`): 2025 → 200 (547,959 bytes); 2026 → 200 (777,986 bytes, captured raw `qafqaz-teqvim-2026-Baki-01.jpg` and read: a clean readable monthly sheet — İmsak/Sübh azanı/Gün çıxır/Zöhr/Əsr/Gün batır/Məğrib/İşa/Gecə yarısı, one row per day, Persian-Azerbaijani headers, religious dates footnoted); **2027, 2028, 2029, 2030, 2031, 2032 → 302 (absent)**, also 2018/2020/2022/2023/2024 → 302. 2027 across other cities (Gence, Sumqayit, Naxcivan) → 302.
- The year dropdown offers exactly 2025 and 2026.

VERDICT: 2027 images have NOT posted. The "images to 2031 already exist" record does NOT hold as of 2026-11-10 — today's archive is 2025-2026 only (both years verified serving). IMAGE-ONLY status upheld (the captured sheet is a raster with the table laid out legibly; an OCR-class parse remains possible but out of this run's scope).

## Russia — CDUM + DUM RF

Task: CDUM year tables for 3 new cities; DUM RF's current month PNG for Moscow.

CDUM findings (cdum.ru/time-namaz/):
1. **St. Petersburg — genuinely NEW city captured**: `/time-namaz/Spb.php` serves a full-year 2026 table (12 month tables in one page; 365 rows extracted, `data/ru-cdum-spb-2026.json`; raw `captures/cdum-spb.html`). Spb is the 21st city and was never captured or fitted before. Its June asr (18:52) sits deep in white-nights territory — the fit pipeline will need the polar handling CDUM otherwise applies via substitutes.
2. **The "Salekhard/Surgut" page — captured as served and RECLASSIFIED**: `/time-namaz/Surgut/Surgut2015.php` renders TITLE "Салехард" (Salekhard), zero mentions of Surgut on the page, the tab list carries "Салехард 2026" pointing at this Surgut URL. The table (365 rows extracted, `data/ru-cdum-salekhard-as-served-2026.json`) is POLAR — Jan 1 sunrise 11:14, maghrib 14:01, asr 12:45 six minutes after its own dhuhr (the recorded defect, reproduced today). **Sharper finding for the record: the numbers are Salekhard's, so the C23 fit row labeled "Surgut" (verification_cdum.json: lat 59.85, fajr exact 0.0 pc, within1 2.5 pc, maxAbs 125 min, fitRms 267) was fitting Salekhard's table against Surgut-class coordinates — that row should be reclassified as Salekhard-data-misattributed, and SURGUT ITSELF must be counted ABSENT from CDUM's web** (no Surgut table anywhere on the site; the tab list omits it).
3. **Moskva stability re-check**: `/time-namaz/Moskva/index.php` re-captured today (2026-11-10) and diffed against C23's `Moskva_2026.csv`: 365/365 rows IDENTICAL, 0 mismatches (`data/ru-cdum-moskva-2026-restability.json`). The CDUM surface is generation-stable months after the basis capture.
4. Year-2 negative: no year parameter exists (probed `?year=`, `?y=`, `?god=` — all ignored); CDUM publishes 2026 only. 2027 tables are not yet posted.

DUM RF (Moscow): the current month PNG is live and unchanged in shape — `https://www.dumrf.ru/img/namaz/11.jpg?v=2` (768,096 bytes, captured raw; read: "Время намазов по Москве и Московской области", 2026 НОЯБРЬ / 1448, full 30-row month with Фаджр/Шурук/Зухр/Аср/Магриб/Иша + Jumada al-Ula day column, Fridays highlighted, sidebar note "suhur ends at fajr time"). Still IMAGE-ONLY, still Shafi asr (e.g. 14:20 on Nov 1 — the recorded CDUM-vs-DUMRF Moscow split remains).

## Australia

Task: enumerate the Amanahly-built mosque sites, capture 3+ mosques' full-year JSON; Victoria Hilaal calendar.

Amanahly enumeration — the record's lead is now PARTIALLY RESOLVED and the platform is BETTER than recorded:
- The public day API is `https://backend.amanahly.com.au/api/prayer-times/public?date=YYYY-MM-DD` (keyless, confirmed). NEW FACT: it is NOT a 30-day window — it serves ANY date, past (2026-01-01) and future (2027-06-15; a distinct _id series, i.e. forward-computed). Full-year capture = 365 single-day calls (range/month params are silently ignored; verified).
- Tenant pinning CONFIRMED HARD: the response is identical with a foreign Origin/Referer header (jumuah sessions 13:15/14:15 = MIA Liverpool regardless); the tenant is server-side fixed, not origin-keyed.
- Certificate transparency (crt.sh) for *.amanahly.com.au yields exactly: amanahly.com.au, www, backend. No per-tenant subdomains. The vendor's own site (amanahly.com.au) is a school-platform landing page with no client list; its Instagram announces "the new Masjid Al Noor website" but the domain could not be located (search engines: Bing poisoned, Google/DDG captcha'd; eight plausible alnoor domain guesses carry no Amanahly fingerprint). Only ONE Amanahly-built mosque site is publicly enumerable today: MIA Liverpool.

Captures:
1. **MIA Liverpool — FULL YEAR 2026** (Amanahly platform): 365 day-endpoint responses saved under `captures/amanahly-mia-2026/`, normalized `data/au-amanahly-mia-liverpool-2026.json` — athan AND jama'ah pairs for all five prayers + hijri, 0 rows missing. This is the census's "fit the UMA year" sibling: the Amanahly year is now on disk too.
2. Bonus surface: `api/prayer-times/prayer-times.ics` — 617 VEVENTs, the JAMA'AH calendar, spanning 2026-11 .. 2027-03 (five months; rolling window, not full-year), and `api/prayer-times/feed` — the 30-day athan ICS. Both saved (`captures/amanahly-mia.ics`, `captures/amanahly-mia-feed`).
3. **UMA Sydney — whole-year JSON re-captured fresh**: `uma.org.au/prayertime/lib/calendar_whole_year.json` → 370 rows, byte-identical to C9's capture earlier today (`captures/uma-sydney-whole-year-2026-11-10.json`). Mosque #2.
4. Mosque #3 full-year: NOT DELIVERED — no third publicly-reachable Australian mosque with a keyless year JSON was found in this run's search environment (see negatives). The nearest extra surfaces are months-class (MIA iqamah ICS above; AthanPlus widgets on the record).

Victoria Hilaal Committee calendar: the C9 capture stands — `vic2026.pdf` is 15 pages with ZERO extractable text (verified this run with pypdf: page 1 extracts 0 chars). IMAGE PDF confirmed; stays a LEAD exactly as the record has it (transcription exists in C9).

Negatives: Amanahly client enumeration closed with one tenant (search engines degraded: Bing returned query-independent results in this session, Google served a challenge, DDG rate-limited/challenged — the brief's tinyfish→curl→agent-browser ladder was exhausted end to end).

## New Zealand

Task: FIANZ year-round surface beyond Ramadan.

NEGATIVE, and a STATUS CHANGE: **the FIANZ website is DOWN — "Account Suspended"** (www.fianz.co.nz serves the suspension page on every path probed: /, /prayer-times, /prayer-times/; HTTP 403; captured `captures/fianz-home.html`; fianz.nz 301s to an unresolvable host; fianz.org.nz does not resolve). The recorded year-round CALCULATOR therefore no longer exists online at all — the federation's whole web presence is suspended as of 2026-11-10. No published year-round table exists beyond the calculator (which is gone), the Ramadan sheets (C9's local copies are now the only artifacts; their live URLs are dead), and the league's member associations, which were not in this task's scope. A public-Facebook probe returned no FIANZ timetable. Honest negative with the searched languages: English (NZ is anglophone; no other language applies).

## Fiji

Task: capture the current month; December when it posts; any 2025 month via the league's public Facebook.

FOUND — December HAS POSTED, and there are now TWO EDITIONS:
1. The **live dpt widget** (the WordPress daily-prayer-time plugin behind fml.com.fj/prayer-time/): the month table is served by `wp-admin/admin-ajax.php?action=get_monthly_timetable&month=N` (a public read-only GET, keyless; the dpt REST route `?rest_route=/dpt/v1/prayertime` 403s here — the year-JSON pool route is DISABLED on this install). November 2026 (30 rows) AND **December 2026 (31 rows — newly posted, first sight of it)** captured: `captures/fml-dpt-month-11.html`, `captures/fml-dpt-month-12.html`; normalized `data/fj-fml-2026-11-live.json`, `data/fj-fml-2026-12-live.json` (each row: suhoor_end, fajr iqamah, sunrise, dhuhr begins/iqamah, asr begins/iqamah, magrib begins/iftar, isha begins/iqamah).
2. **EDITION SPLIT on November 2026** — the live widget does NOT match the printed sheet C35 transcribed: dhuhr 11:50 begins / 11:53 iqamah (widget) vs 11:55 (sheet); isha 7:25 / 7:28 vs 7:34; asr 3:04 / 3:07 vs the sheet's DUAL asr 3:05(S)/4:18(H) — the widget prints ONE asr only; magrib 6:13/6:16 vs sheet 6:16 (the sheet prints the jama'ah). The suhoor-end column (4:11 on Nov 1) equals the sheet's "Fajr" column, confirming the sheet prints jama'ah-class times while the widget carries both begins and iqamah. Two authority-tier editions now co-exist and disagree by up to 9 minutes (isha); the C35 recipe was fitted on the SHEET edition.
3. The prayer-time PAGE still embeds the STALE 2024 image set (wp-content/uploads/2024/06/*.jpg for all twelve months — C9's stale-2024 caveat still stands).
4. Facebook: the league's public page (facebook.com/fijimuslimleague) renders logged-out but the posts feed carries no timetable post in this capture (C35 already holds December 2025 via the same route; no NEW 2025 month found).

## Kyrgyzstan

Rolling accrual: the current 21-day window captured for Bishkek.

- The clamp is LIVE and unchanged: bare /kg/calendar/ 302s to `/kg/calendar/?start=11-11-2026&end=30-11-2026`; two wider probes (end 30-12-2026, start 01-01-2026) both clamp back to the same 11-30 Nov window. Captured probe headers kept in the transcript of this section; page served via headless browser (curl -L cannot follow the self-redirect).
- Capture: `captures/muftiyat-kg-bishkek-window-2026-11.txt`; normalized `data/kg-muftiyat.kg-bishkek-2026-11-11_30.json` — 20 dated rows (2026-11-11 .. 2026-11-30), columns Багымдат/Күн/Бешим/Аср/Шам/Куптан.
- Check against the recorded fit (fajr 18 flat floor; isha = maghrib + round(7/9 × (fajr-sunrise) + 3.5)): all 20 rows within 1 min (7 exact, 13 at +1 — the recorded noise floor; the ratio constant is a band, not a point). A year after the L1 basis, the same rule still holds: rolling year-2 accrual secured.
- Bonus fact: the homepage now embeds EVERY settlement's daily row inline in HTML (`points=[{title, prayertimes:{date, fajr...}}]`, date 2026-11-11) — a new keyed daily surface for all settlements (e.g. Айтматов, Ак-Сай), one dated row each. Saved: `captures/muftiyat-kg-home.html`.

CONFIRMS the census surface + accrues 20 new Bishkek rows toward year-2.

## Tajikistan (scope row, no numbered task — quick second-month check)

The record's lift item ("a second month") is met: November 2026 captured live from shuroiulamo.tj/tj/namaz — the full month of WINDOW rows for Dushanbe (fajr 05:22-06:51 style; isha crossing midnight; the disliked interval before sunset printed as its own column "Фурӯ рафтани офтоб... макруҳ"). Capture `captures/shuroiulamo-tj-namaz.html`; normalized `data/tj-shuroiulamo-dushanbe-2026-11-windows.json` (30 window-rows). This is the second dated month after the record's basis month and confirms the table is a live monthly regeneration, not a static artifact.
