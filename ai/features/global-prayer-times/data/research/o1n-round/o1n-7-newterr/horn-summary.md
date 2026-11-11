# o1n-7-horn: Horn of Africa front (council route)

Wave child of o1n-7 (new territory). Five countries: Eritrea, Djibouti, Somalia, Sudan, South Sudan.
Workspace: o1n/o1n-7-newterr/ (captures/horn/, data/). Engine for all fits: adhan 4.4.6, Rounding.None, via fit.js.
Search-engine state today: Bing (TinyFish and real-browser) serves junk/walled; DuckDuckGo html + Mojeek serve
empty shells; Wayback CDX intermittent (offline window at start, recovered mid-run). Direct + CDX were the routes.

## Per-country ledger

### Eritrea (Asmara) — NO DATED SURFACE

- mawaqit mirror page exists: Masjid Al-Khifaa Al-Rashideen (مسجد الخفاء الراشدين),
  Asmara — captures/horn/mawaqit-asmara-khifa.html. SSR carries the name only; times
  load via the JWT-walled API (search 401, SPA search routes 404). No rows.
- Shabait.com (Ministry of Information, state): homepage live (138 KB) — no imsakia/
  prayer-table content. English/Arabic/Tigre terms probed.
- Languages attempted: English, Arabic (مواقيت الصلاة أسمرة), Tigre/Tigrinya terms via
  transliteration in engine queries. Verdict: not found under these terms.

### Djibouti — NO DATED SURFACE

- Mawaqit mirror: Masjid Abderrahmane bin Auf (مسجد عبد الرحمان بن عوف), ID 3902 —
  page readable (probe-djibouti-known.html), API mosque-by-id returns the SPA shell,
  anonymous REST closed (mawaqit-api-3902.json is HTML, not JSON). No rows.
- RTD (Radio Télévision Djibouti, rtd.dj): WordPress REST search returns 0 for
  "imsakia" and "priere" (wp-rtd-imsakia.json, wp-rtd-priere.json); homepage live,
  no table.
- La Nation (lanation.dj): search RSS — "imsakia" ZERO items, "priere"/"ramadan"
  return religious-column prose only, no dated tables (lanation-rss-*.xml banked).
- Languages attempted: French (imsakia, prière, calendrier), Arabic (إمساكية,
  مواقيت الصلاة جيبوتي). Verdict: not found under these terms.

### Somalia — NO DATED SURFACE

- Radio Muqdisho WordPress REST: 404 on every probe (jadwalka, ramadaan, salaada,
  waqtiga — wp-rm-*.json all Apache 404; API disabled).
- Somali outlets probed, all homepage-level, zero imsakia-class hits: daljir.com,
  garoweonline.com, goobjoog.com, horseedmedia.net, mareeg.com, puntlandpost.net,
  radiomuqdisho.net, raxanreeb.com, hiiraan.com (homepage carries no prayer block
  this capture). +90 platform class stays as the record holds it.
- Languages attempted: Somali (jadwalka salaada, ramadaan waqtiga, goortta), Arabic,
  English. Verdict: not found under these terms.

### Sudan — ONE DATED SINGLE-DAY PRINT (banked as evidence, not rows)

- alshaab.net (الشعب, Sudanese daily): WordPress REST search surfaced the article
  "إمساكية رمضان وموعد الافطار في السودان" (Imsakiya of Ramadan and iftar time in
  Sudan), posted 2025-03-01T13:58Z. Content carried in the API response
  (wp-alshaab-imsakia.json): Khartoum single-day times — imsak 04:55, fajr adhan
  05:10, sunrise 06:30, dhuhr 12:20, asr 15:45, maghrib/iftar 18:35, isha 19:50.
  First-fast date not stated in the article; posted at Ramadan 1446 start. ONE row,
  no table — recorded as evidence that the daily print exists in the press, not
  banked as a surface.
- suna-sd.net (state agency): Cloudflare challenge, no pass (probe banked).
  sudanile.com: homepage live, no imsakia content. sudaneseonline.com: none.
- Languages attempted: Arabic (إمساكية رمضان السودان, مواقيت الصلاة الخرطوم),
  English. Verdict: authority sheet still not found as a table under these terms.

### South Sudan (Juba) — NO DATED SURFACE

- Mawaqit search for Juba: SPA search shell only (search routes 404, API 401).
  cdx-gov.ss queried. No community or authority surface surfaced under English or
  Arabic terms. Verdict: not found under these terms.

## New artifacts this fold

- captures/horn/wp-alshaab-imsakia.json (the Sudan single-day print, full content
  inline)
- captures/horn/mawaqit-api-3902.json (Djibouti mosque-by-id probe: SPA shell —
  anonymous REST closed)
- Existing captures from the cancelled child stand as the raw record; names verified
  against the files listed above.

## Environment negatives (shared causes)

- Facebook: hard login wall for anonymous browsers (page, mbasic-style, and plugins/page.php iframe all render
  no content). Cause: login wall. Affects every ministry/mosque FB print in this region.
- Cloudflare "Just a moment" challenge: alrakoba.net, suna-sd.net (curl 403 / browser challenge, no pass).
- mawaqit.net: mosque mirror pages still curl-readable (verified /en/abdrrahman-djibouti, ID 3902), but the
  public search UI is gone from the SPA (all /en/search* routes 404) and api.mawaqit.net/api/2.0/mosque/search
  returns 401 JWT Token not found. No anonymous JWT in page localStorage. Slug discovery closed.
- Internet Archive: "Temporarily Offline" window at run start; CDX queries recovered later.
