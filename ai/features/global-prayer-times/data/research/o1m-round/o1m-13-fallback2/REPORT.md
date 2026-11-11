# O1m-13 — FALLBACK second witnesses, ten countries lifted by turktakvim

Wave O1m-13 of round three. Scope: an authority or community surface for each of the ten countries
O1m-1 lifted with turktakvim (Liberia, PNG, Solomon Islands, Vanuatu, Kiribati, Turkmenistan, South
Sudan, Myanmar, Guyana, Samoa). Nepal stays with Darul Ifta.

Workspace: `$HOME/athan-gitree/census/o1m/o1m-13-fallback2/`. Captures in `captures/`, rows in
`data/`, fits in `fit/`. Engine: adhan 4.4.6
(`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`, timezone pinned per
country, dates read from each capture's own strings. No clock read. Started 2026-11-11 ~10:5x UTC.

---

## 1. The platform tenant layer is empty in all ten — enumerated, not assumed

Four tenant platforms were checked against their own data rather than by slug guessing:

| Platform | Universe | Tenants in these countries |
|---|---|---|
| masjidi.app | all 468 table tenants enumerated by O1m-3, country field read | **0** (25 countries, none of ours) |
| masjidal | 216-tenant floor (O1l-43) | **0** |
| mawaqit | CDX of `mawaqit.net/en/` filtered on each of the ten country names | **0** (one Sudan tenant, not South Sudan) |
| masjidbox | sitemap holds only main + blog pages; CDX filtered on ten capital city names (cut short by the archive outage) | **0** |

So no mosque in these ten countries publishes through a tenant platform, which is why O1m-1's
platform tier is the only layer the record holds. The negatives here are searches of an enumerated
universe, not of a search engine. The two CDX negatives are provisional: the Internet Archive was
returning "Temporarily Offline" and one 504 during this pass (section 4).

## 2. Diyanet is a second independent publisher for eight of the ten — and it is defective

**`namazvakti.diyanet.gov.tr` lists eight of the ten — every country here except Solomon Islands and
Kiribati** (210 country options captured; ids: Liberia 73, Guyana 82, Myanmar 154, Turkmenistan 159,
PNG 185, Samoa 198, Vanuatu 56, South Sudan 214; Fiji and Tonga are present, so the omission is not a
Pacific-wide gap). Its country page renders one 30-day table for the country's first city; every
state or city postback was walked and captured (`captures/diyanet/`).

### The postback defect, measured and reproduced

61 further city requests (PNG 9, Myanmar 14, Turkmenistan 33, Guyana 3, Liberia 2, South Sudan 2)
returned **one and the same 150-row table in all 61 cases**: one md5 across six countries, spanning
2026-11-12..2027-04-10. It is not the requested city: at Istanbul's own point it misses dhuhr by
-41.6 min and sunrise by -47.0 min, and it has no isha angle at all (the printed isha sits beyond a
9-degree depression on every one of the 150 days). The row count is the tell: a genuine table is 30
rows, the shared table is 150.

A controlled experiment in a single cookie-jar session nails the mechanism
(`data/diyanet-defect-experiment.json`):

| Post in one session | rows | 2026-11-12 first row |
|---|---|---|
| state post, then ASKABAT | 30 | 06:13 07:36 12:55 15:40 18:05 19:23 |
| then MERV | 150 | 05:28 07:00 12:07 14:38 17:03 18:24 |
| then TURKMENABAT | 150 | 05:28 07:00 12:07 14:38 17:03 18:24 |

**The city select is not honoured at all.** The only genuine render is the province's first city,
which is what the state post itself returns; every other city request — including a fresh session
that asks for that city first (tested at Monrovia, Port Moresby and Yangon, all three returned the
150-row default) — falls back to one shared default table. This is O1m-3's "city postback returns
the province's first city" (767 of 814) stated precisely, with the 150-row count as the detection
test. Evidence: `data/diyanet-defect-default-table.json`, `fit/diy-defect-default-istanbul.json`,
`captures/diyanet/` (90 raw pages).

### The gate

A fresh cookie-jar session walked base -> Turkmenistan -> ASKABAT and reproduced the banked table
**30/30 rows identical, zero differing** (`captures/diyanet/gate-turkmenistan-city.html`,
`scripts/gate.py`). Gate PASS. The table's own date column and its first row (06:13 07:36 12:55 15:40
18:05 19:23 for 2026-11-12) are the check; no clock was read.

### The eight genuine tables, fitted

One recipe reproduces every one of the eight at **30/30 within-1 on all six columns**:

| Country | Diyanet city (first in its list) | days | fajr angle | isha angle | sunrise | dhuhr | asr | maghrib |
|---|---|---|---|---|---|---|---|---|
| Liberia | Buchanan | 30 | 18.01 | 16.95 | -6.98 | +4.83 | +4.03 | +6.77 |
| Guyana | Georgetown | 30 | 18.01 | 16.95 | -7.12 | +4.87 | +4.12 | +6.95 |
| Myanmar | Bassein (Pathein) | 30 | 17.98 | 17.02 | -6.95 | +5.02 | +4.00 | +7.12 |
| Turkmenistan | Ashgabat | 30 | 18.04 | 16.97 | -7.42 | +4.68 | +4.30 | +6.95 |
| PNG | Alotau | 30 | 17.98 | 16.95 | -7.20 | +4.90 | +3.85 | +6.82 |
| Samoa | Apia | 30 | 18.02 | 16.81 | -6.95 | +4.72 | +3.48 | +6.42 |
| Vanuatu | Port Vila | 30 | 17.97 | 16.97 | -6.98 | +5.10 | +3.92 | +6.97 |
| South Sudan | Juba | 30 | 18.03 | 16.93 | -7.22 | +4.73 | +3.97 | +6.75 |

Diyanet's own recipe here is **18/16.9-17.0 with a -7.0 sunrise temkin and +7.0 maghrib temkin**.
That is a different pair from turktakvim's 17.9/18.6-18.7. Fits: `fit/diy-*.json`.

The service serves **one rolling 30-day window and no year parameter**, so each table is one
published cycle: this is a candidate-grade surface by FIT-RULES, and it cannot lift a country to A.
What it does is give eight countries a second independent publisher on the same days.

**Samoa and Vanuatu matter most**: turktakvim computes nothing at all for Samoa, so Diyanet's Apia
table is the country's first publisher table outside athanpro.

## 3. turktakvim against Diyanet: one stable offset family, not agreement

Seven settlements carry both surfaces for the same 30 days (2026-11-12..2026-12-11). turktakvim
prints two dawn columns — `imsak` (fasting start) and `sabah` (the fajr prayer) — so the fajr row
below pairs turktakvim's **sabah** with Diyanet's imsak, which is Diyanet's fajr. Median
turktakvim minus Diyanet, minutes:

| Settlement | fajr | sunrise | dhuhr | asr | maghrib | isha | stable days |
|---|---|---|---|---|---|---|---|
| Buchanan LR | +1 | +3 | +2 | +3 | -1 | +7 | 30/30 every column |
| Georgetown GY | +1 | +3 | +2 | +3 | -2 | +7 | 30/30 |
| Pathein MM | 0 | +2 | +2 | +3 | -2 | +7 | 30/30 |
| Ashgabat TM | +1 | +2 | +4.5 | +5 | -1 | +9 | 30/30 |
| Alotau PG | 0 | +3 | +2 | +3 | -2 | +7 | 30/30 |
| Port Vila VU | 0 | +2 | +2 | +3 | -1 | +7 | 30/30 |
| Juba SS | +1 | +3 | +2 | +3 | -1 | +7 | 30/30 |

Every column holds its offset on all 30 days at every settlement: two independent publishers run
**the same dawn and the same solar events with different temkin**, which is what the platform tier
is. Two things follow.

- **fajr agrees**: turktakvim 17.85-17.93 and Diyanet 17.97-18.04 land within 1 minute of each other
  in all seven tables. The dawn angle is not in dispute at the platform tier in these countries.
- **isha does not**: turktakvim runs **+7 min later** at 4-22° latitude and **+9 min at Ashgabat
  (38°N)**, on the same days. That is the latitude-dependent isha correction O1m-1 recovered from
  turktakvim alone, now visible as a **measured offset against a second publisher** whose own isha
  sits on a fixed 16.8-17.0 degrees. The gap widens with latitude exactly as O1m-1's fit predicted.
  It is not adjudicated here: one of the two is a convention, and the record must carry both.

Also recorded: turktakvim's separate **imsak** column sits **-11 to -12 min before Diyanet's imsak**
(which is Diyanet's fajr), i.e. turktakvim prints a fasting start 12 min before its own dawn column.

## 4. Community surfaces

**Mosque inventory banked for the next pass** (OpenStreetMap Overpass, `amenity=place_of_worship`
+ `religion=muslim`, all elements with tags and points, `captures/osm-*.json`,
`data/osm-mosque-inventory.json`):

| Country | mapped mosques | named | the ones that matter |
|---|---|---|---|
| Myanmar | 196 | 156 | Burmese-named Yangon and Mandalay mosques (Mingala, Darga Masjid, Myanma Moslem) |
| Turkmenistan | 185 | 95 | Türkmenbaşy Ruhy Metjidi (Gypjak), Şehitler metjidi, Änew, Mary, Turkmenabat |
| Guyana | 67 | 50 | Georgetown, LBI, Cumberland, No. 70/71 Sunnatul Jammat, Berbice |
| Liberia | 46 | 22 | Gilbrata, Clara Town Central and Last, 18th Street, Newport Street, Ganta Central |
| South Sudan | 28 | 11 | Juba's Munuki Mosque and the Islamic Council building, Abyei Masjid, Melut, Renk |
| PNG | 3 | 3 | Port Moresby Mosque (Hohola), Lae, Kanosia |
| Samoa | 1 | 1 | Samoa Islamic Center (the Mariam Mosque), Apia |
| Solomon Islands, Vanuatu, Kiribati | **0** | 0 | nothing mapped — the Honiara and Port Vila mosques are named in Wikipedia only |

- **Kiribati — Ahmadiyya Ramadan sheet (held from O1m-1).** The community body is real and reachable
  in search: `facebook.com/AhmadiyyaKiribati` (post 1333354565486167, 2026-02-11) and
  `x.com/KiribatiMuslims`. The sheet's five fixed-clock columns stay the recorded defect. The
  sibling blog `ahmadiyyakiribati.wordpress.com` does not exist (WordPress typo page), and
  `ahmadiyyatuvalu.wordpress.com` carries photographs only, no timetable.
- **PNG — the Islamic Society's own site delegates the times.** `ispng.wordpress.com` is live
  (WordPress, 2026) and its `salaah/` page ends at a link to `islamicfinder.org/prayer/index.html`.
  The national body publishes no table of its own. Capture: `captures/ispng-salaah.html`.
- **Guyana — the body's domains are dead or parked**: `ciog.org.gy` does not resolve (curl 000),
  `ciog.org` is live but empty (record), `gitgy.org/?page_id=2` returns a WordPress 404,
  `gitgy.com` is a parking lander (114 bytes, redirect to `/lander`). Mosqpedia's Guyana mosque pages
  (Anna Catherina, Hujjatul Ulama) carry no prayer column.
- **Facebook is closed to anonymous readers**: `facebook.com/plugins/post.php` returns HTTP 400,
  `mbasic.facebook.com` returns 400, and every page or post URL returns the login shell. Public posts
  are therefore unreadable from this host; the pages that matter are named here so a session that is
  allowed to read them can finish the job.
- **Solomon Islands — `hakimids.simdif.com`** (the one Solomon-linked site in Wikipedia's
  references) carries history only, no timetable.

### Honest negatives, with the languages actually searched

Every query below returned calculators, aggregators, Wikipedia or news copy — no publisher table.
Captures: `captures/search-*.html`.

| Country | Query languages and terms | Result |
|---|---|---|
| Turkmenistan | Turkmen ("namaz wagty Aşgabat 2026 metjit"), Russian ("время намаза Ашхабад 2026 расписание"), English | five calculators (salahtimes, 5namaz, azaneum, namaz.today, islam.global) and two apps; no Muftiate or newspaper table |
| Myanmar | Burmese ("နမာဇ် အချိန် ဇယား"), English | Burmese Wikipedia only, plus the AlAdhan-client site already recorded |
| South Sudan | Arabic ("مواقيت الصلاة جوبا جنوب السودان"), English | six calculators; no mosque or council table |
| PNG | Tok Pisin ("taim bilong prea mosque Port Moresby"), English | calculators, the Hohola Mosque's Facebook videos (walled), one YouTube visit video whose description holds no timetable |
| Vanuatu | French ("horaire prière mosquée Port Vila Vanuatu"), Bislama, English | calculators only |
| Samoa | Samoan ("taimi o le tatalo Apia Samoa mosike"), English | Samoan news sites and Facebook pages, no table |
| Solomon Islands | Pijin ("taem blong prea Honiara mosque"), English | calculators, one women's group page, travel videos |
| Kiribati | Gilbertese-adjacent terms and English, plus the community page | the Ahmadiyya post (held) and calculators |
| Guyana | English (mosque names, CIOG, Ramadan timetable) | calculators; CIOG's own domains dead or parked |
| Liberia | English (mosque names, council) | calculators; council site is an AlAdhan widget (record) |

### Access negatives, so the next pass does not repeat them

| Route | Result |
|---|---|
| Brave Search (web + images) | **works** from this host; the engine every find here used; throttles to HTTP 429 after about six rapid queries, so pace at 20 s or more |
| Bing | 200 but returns unrelated results (a "Mariam Mosque Samoa" query returns baby-name pages), unusable |
| DuckDuckGo HTML/lite, Mojeek, Startpage, Ecosia | 202 challenge, empty, empty, 403 |
| Internet Archive CDX | flapping through this work: "Temporarily Offline" pages and one 504; every CDX negative here is provisional and must be re-run |
| searx public instance, Stabroek News REST, Guyana Chronicle, Samoa Observer | browser-verification captcha, `rest_login_required` 401, Sucuri JS challenge, WordPress API 404 |
| Facebook (plugin, mbasic, page, post) | HTTP 400 or login shell on every form |


## 5. Per-country status

| Country | Second witness found | Tier | vs turktakvim | Still open |
|---|---|---|---|---|
| Liberia | Diyanet Buchanan 30 days, 6/6 columns 30/30 within-1 | platform | fajr +1, isha +7 | Monrovia mosque page |
| PNG | Diyanet Alotau 30 days, 6/6 columns 30/30 | platform | fajr 0, isha +7 | Hohola Mosque |
| Solomon Islands | none | — | — | Mbokonavera Masjid; Diyanet does not list the country |
| Vanuatu | Diyanet Port Vila 30 days, 6/6 columns 30/30 | platform | fajr 0, isha +7 | Grand Mosque page |
| Kiribati | Ahmadiyya Ramadan 2026 (O1m-1) | community | maghrib 30/30 exact, five fixed clocks | a second month |
| Turkmenistan | Diyanet Ashgabat 30 days, 6/6 columns 30/30 | platform | fajr +1, isha +9 | Muftiate; state newspaper |
| South Sudan | Diyanet Juba 30 days, 6/6 columns 30/30 | platform | fajr +1, isha +7 | Juba mosque pages |
| Myanmar | Diyanet Pathein 30 days, 6/6 columns 30/30 | platform | fajr 0, isha +7 | Yangon mosque pages |
| Guyana | Diyanet Georgetown 30 days, 6/6 columns 30/30 | platform | fajr +1, isha +7 | CIOG timetable image |
| Samoa | Diyanet Apia 30 days, 6/6 columns 30/30 | platform | turktakvim prints nothing | Mariam Mosque |

### What this wave banks, and what it does not

- **Banks**: eight second-publisher tables (one per country, 30 dated rows each, gate PASS, one
  recipe at 30/30 on all six columns), a seven-settlement measured offset family against turktakvim,
  a reproduced Diyanet defect with its detection test, a mosque inventory for all ten countries, and
  the access map in section 4.
- **Does not bank**: an authority or community table for any of the ten. No grade moves. Solomon
  Islands remains with no surface at all; Kiribati keeps its community sheet with the fixed-clock
  defect; Samoa gains its first publisher table but the gazetteer hole stays.


## 6. File index

| Path | What |
|---|---|
| `captures/diyanet/` | 90 raw pages: base, eight country pages, state and city postbacks, three gates, the defect experiment |
| `data/diyanet-<country>-<city>.json` | the eight genuine 30-row tables |
| `data/diyanet-defect-default-table.json`, `data/diyanet-defect-experiment.json` | the shared 150-row default and the one-session proof |
| `data/offsets-turktakvim-vs-diyanet.json` | the seven-settlement offset record |
| `data/osm-mosque-inventory.json`, `captures/osm-*.json` | the mosque inventory, ten countries |
| `data/geocode-diyanet.json` | the points used, Nominatim and hand entries marked |
| `fit/diy-*.json`, `data/fit-diyanet.json` | adhan 4.4.6 fits, eight tables plus the default as defect evidence |
| `scripts/` | `gate.py`, `diy_get.py`, `diyanet_city.mjs`, `fit_table.js`, `compare_offsets.py`, `geocode_diyanet.py`, `bs.sh`, `bimg.sh`, `overpass.sh` |
| `captures/wiki/`, `captures/search-*.html`, `captures/imgsearch-*.html` | discovery captures |

## 7. NEXT

1. Read the mosque Facebook pages from a host allowed to read them: Hohola Mosque
   (`facebook.com/MosqueHohola`), Samoa's community page (`facebook.com/adb24`), Honiara's
   Mbokonavera Masjid, Port Vila Grand Mosque, Juba's Munuki Mosque, Monrovia's Gilbrata and Clara
   Town. The OSM inventory above gives the names and points.
2. Turkmenistan at authority tier: the Muftiate and the state newspaper by date, not by search.
   `mufti.gov.tm`, `islam.gov.tm`, `metjit.gov.tm` and `watan.tm` do not resolve; `turkmenistan.gov.tm`
   is a news portal with no prayer section (`/tk/namaz-waglary` 404), so the route is the printed
   paper, not the site.
3. Re-run every CDX negative once the Internet Archive is stable; they were taken while it was down.
4. Myanmar is the richest untried community layer: 156 named mosques mapped, and Diyanet's own
   Myanmar list names 14 cities whose tables the postback defect hides.
5. Solomon Islands and Kiribati stay the two countries with no publisher table: Diyanet lists
   neither, and every tenant platform is empty.

