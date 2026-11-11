# O1l-29 — Ireland, Isle of Man, Channel Islands (city layer, round two)

Probe window: 2026-11-11 05:09Z – 06:05Z. All captures under `captures/`, normalized rows under `data/`.
No repository file was read for writing; the census table and consolidation were read only.

## Headline

1. **The IFI publishes a full-year per-city timetable PDF for 26 Irish towns**, one file per city, at a
   stable CMS directory. 9,459 dated rows banked, one year (2026). Every target city except Bray is in it.
2. **The IFI `?year=` parameter does not exist.** Any `?year=` is discarded by a 301 to the bare
   endpoint; 2026, 2027 and 2028 requests return the same 25,380 bytes. The 2027 negative STANDS.
3. **The IFI "DST defect" is still live and is now explained**: the API is the printed table with the
   publisher's two footnotes dropped. The PDF tells the reader to add an hour after summer time starts
   and subtract one after it ends; the API does neither.
4. **One generator, characterised**: horizon −1.26° for sunrise and sunset, dhuhr = solar noon + 2 min,
   winter fajr 16.2° / isha 15.2°, summer isha capped at maghrib + 90 min. Solar columns reproduce at
   0.86–0.95 min rms across 26 cities; the recovered coordinates match the towns to ±0.05°.
5. Isle of Man, Jersey and Guernsey hold **no dated table** on any public page found; Douglas is an
   AlAdhan wrapper and Guernsey an IslamicFinder widget.

## Source A — IFI annual city timetables (NEW SURFACE, 26 cities)

URL pattern: `https://islamicfoundation.ie/site/assets/files/1070/<city>_prayer_timetable[-1].pdf`.
Index page: `/services/mosques-and-prayer-rooms/` (four province pages list the mosques; the PDFs are
not linked from them and were recovered by search plus slug probing).
Tier: **authority-adjacent** (national body, "Prepared by the Islamic Foundation of Ireland, 163 South
Circular Road, Dublin 8"). 12 pages per PDF, one per month, columns DATE / FAJR / SUNRISE / DHUHR /
ASR / MAGHRIB / ISHA, bilingual headings.

Rows banked: `data/ifi_<city>_2026.json` (clock-corrected) and `data/ifi_<city>_2026_printed.json`
(as printed). 365 days each; total **9,459 rows** across 26 cities.

Year proof: Ramadan 1447 begins 19 Feb 2026. The Ramadan edition's day 1 equals the annual edition's
19 Feb row on all six columns for Sligo, Waterford and Limerick, and 30/30 Ramadan rows find an exact
six-column match inside the annual PDF's 19 Feb – 20 Mar window. The annual set is the **2026 edition**.

Cities: Athlone, Ballyhaunis, Carlow, Castlebar, Cavan, Clonmel, Cork, Drogheda, Dublin, Dundalk,
Ennis, Galway, Kilkenny, Letterkenny, Limerick, Longford, Mullingar, Naas, Navan, Portlaoise, Sligo,
Thurles, Tralee, Tullamore, Waterford, Wexford.

Printed defects found: **Athlone** prints asr/maghrib/isha without the tens digit (14:09 → `2:09`,
16:26 → `4:26`, 18:13 → `6:13`) and its June page prints five isha cells as `11: 38` with a space, so June yields 25 of 30 rows
and the city totals 335. **Carlow** July has 30 rows (one day
absent from the text layer). Athlone is therefore held as printed-defective and is excluded from the
cross-city fit.

## Source B — IFI Ramadan 2026/1447 editions (33 towns, same generation)

`https://islamicfoundation.ie/timetable/ramadan-2026/` — index captured, 33 PDF links at
`/site/assets/files/1620/<town>_ramadan_timetable_2026.pdf`. The page states "Dublin as well as other
32 towns in Ireland". Three editions captured and compared: **30/30 exact six-column match** against
the annual PDFs. These are extracts of one computed generation and **do not lift the grade**.
The 33-town list adds Ballina, Ballinasloe, Donegal, Kildare, Monaghan, Roscommon, Tipperary —
towns with no annual PDF. (Galway is spelled `galwau` in its filename.)

## Source C — IFI API feed, recheck

| probe | result |
|---|---|
| `/api/timetable` | 200, 25,380 bytes, sha 99e600d0ad2e655d… |
| `/api/timetable?year=2026` | 301 → bare endpoint, identical bytes |
| `/api/timetable?year=2027` | 301 → bare endpoint, identical bytes |
| `/api/timetable?year=2028` | 301 → bare endpoint, identical bytes |

The endpoint is **parameter-blind**, not merely year-frozen. **No 2027 table exists.**

Content: 366 days with a **Feb 29** row in a non-leap year — the feed is leap-shaped while the PDFs are
365. The API's Dublin rows equal the Dublin PDF's printed rows day for day.

**DST defect: still live, unchanged in form.** fajr jumps +57 min on 1 April (printed 31 Mar 04:22 →
1 Apr 05:19) and −59 min on 1 November (31 Oct 06:34 → 1 Nov 05:35). Real Europe/Dublin 2026:
BST from 29 March, GMT from 25 October. Ten days carry the wrong clock.

**Cause, from the publisher's own footnotes**, printed on every city's PDF:
- March page: "Add one hour to figures after summer time starts."
- October page: "Subtract one hour from the figures after the summer time ends." and "Summer time ends
  on the Sunday following the fourth Saturday in October."

So the printed table is correct **by instruction** and the API is the same table with the instructions
removed. This reclassifies the census defect from a publisher error to a feed-level omission.

## Fit — one recipe, 26 cities, 365 days (FIT-RULES applied)

Engine: own solar engine (NOAA/Meeus), validated against adhan 4.4.6 on Dublin: the depression angle
read at adhan's printed fajr is −16.27°/−16.08°/−16.31° for a 16.25° input, i.e. agreement inside the
one-minute rounding floor. TZ pinned to Europe/Dublin with the real 2026 transitions.

**The generator's solar model** (fitted per city, 4 unknowns, 1,095 observations):
- sunrise and sunset both at horizon **−1.26°** (not the standard −0.833°);
- dhuhr = solar noon **+ 2.00 min**;
- solar-column rms **0.86–0.95 min** on 21 of the 25 fitted cities (Tralee 1.62, Thurles 3.27,
  Cavan 6.33, Letterkenny 10.51 — flagged; Athlone excluded as printed-defective);
- recovered coordinates match the towns to **±0.05°**, so the tables are genuinely per-city, not copies.

**Twilight recipe, winter (Nov–Feb, unclamped):** fajr **16.2°**, isha **15.2°**. Fitting one national
angle at each city's own latitude gives rms **1.75 min** over 3,120 winter observations. A single
reference latitude for all cities is refuted (rms 2.56 min). The residual carries a real
latitude-dependent spread — implied winter fajr 16.59° at Cork (51.9N) down to 15.73° at Letterkenny
(55.0N) — which one fixed angle does not explain; recorded as a measured property, not resolved.

**Summer interval (publisher-stated and measured):** "Red glow does not disappear at night from 18th of
May to 25th of July." and "'Isha time is estimated at 1½ hour after Maghrib (or slightly more.)"
Measured: isha = maghrib + 90 **exactly** on 30–43 consecutive days per city, from 2026-05-28..06-03 to
2026-07-02..07-15, longest in the north (Sligo 43 days) and shortest in the south (Waterford 30). The
cap is an upper bound on the clock, not a fixed calendar window.

**Summer fajr is not reproduced by any rule tested.** Implied depression falls smoothly to a solstice
minimum (11.3° Dublin, 10.0° Letterkenny). The one-seventh rule gives 03:54 against a printed 02:46 at
Dublin on 21 June; middle-of-night gives 01:27 against 02:46. **Both refuted by measurement.** The
offset from solar midnight is 74.8–82.4 min across cities — also not a rule. Recorded as an unmodelled
summer regime, not as a fitted recipe.

**Seasonal amplitude (Jan median vs Jul median):** fajr −197 to −216 min, isha +290 to +311 min.
Per-city table in `data/ifi_seasonal_amplitude.json`.

**Span and ceiling:** one year, 365 rows per city. No second year exists at this publisher: the year
parameter is discarded, and the Ramadan edition is the same generation. **Grade: provisional**
(one published cycle, capped by the frozen-generation precedent). Forward longevity: **stable across
the single year held only** — no forward endpoint.

**Between-year stability: not testable.** One year. Nothing to compare.

## City lines

| City | Surface | Rows | Verdict |
|---|---|---|---|
| Limerick | IFI annual PDF | 365 | provisional; new |
| Limerick | mawaqit `limerick-islamic-cultural-center-limerick` | iqama board | **not data** — fajr 08:00 flat, dhuhr 14:00 flat, shuruq column 58 min off the city's solar sunrise |
| Waterford | IFI annual PDF | 365 | provisional; new |
| Waterford | mawaqit `waterford-muslim-society-viewmount-…` | iqama board, `iqamaEnabled:true` | **not data** — athan array is today-only |
| Drogheda | IFI annual PDF | 365 | provisional; new |
| Drogheda | masjidbox `masjid-drogheda` | 7 (10–16 Nov) | community, solar gate passes |
| Drogheda | own site `masjiddrogheda.ie` | — | live page carries a **TEMPORARY CLOSURE** notice |
| Dundalk | IFI annual PDF | 365 | provisional; new |
| Dundalk | masjidbox `dundalk-islamic-cultural-centre` | 7 (11–17 Nov) | community |
| Kilkenny | IFI annual PDF | 365 | provisional; new; no platform install found |
| Sligo | IFI annual PDF | 365 | provisional; new |
| Sligo | masjidbox `sligo-leitrim-islamic-cultural-centre` | 7 (11–17 Nov) | community |
| Sligo | own site `sligomuslimcentre.com` | today | **disagrees with its own masjidbox install**: fajr 05:39 vs 06:03, sunrise 07:44 vs 07:50 |
| Athlone | IFI annual PDF | 335 | provisional with a printed defect; new |
| Athlone | masjidbox `athlone-masjid` | 7 (11–17 Nov) | community; isha iqama prints `00:00` |
| Ennis | IFI annual PDF | 365 | provisional; new |
| Ennis | masjidbox `ennis-islamic-cultural-centre` | 7 (10–16 Nov) | community |
| Ennis | mawaqit `islamic-cultural-centre-of-ennis-…` | iqama board | **not data** — dhuhr 13:00, asr 15:00, isha 20:00 fixed |
| Tralee | IFI annual PDF | 365 | provisional; new; no platform install found |
| Wexford | IFI annual PDF | 365 | provisional; new |
| Wexford | masjidbox `enniscorthy-main-masjid` ("Wexford Islamic Cultural Center") | 7 (10–16 Nov) | community; **Enniscorthy, not Wexford town** — county coverage only |
| Bray | — | 0 | **honest negative**: IFI directory lists "Bray Mosque, 25 Florence Road"; no own domain, no mawaqit/masjidbox/masjidal install, no dated table. Searched English ("Bray mosque prayer times", "Bray Islamic Centre Wicklow") and site: queries on both platforms. A travel listing claims "permanently closed" (unreliable, recorded not believed) |

## Isle of Man — Douglas (first pass)

`iaiom.com` (IOM Islamic Association, "First Mosque – Fajar Jamaat only", `/prayer-time/`).
The page renders **"🕌 Loading Prayer Times…"** and fills it client-side from
`api.aladhan.com/v1/timings/<DD-MM-YYYY>?latitude=…&longitude=…&method=…&school=0`, with the
configuration read from a Firebase document; the in-page fallback is **method 4 (Umm al-Qura) at
54.15, −4.48**. A Firebase web API key sits in the page source and is **not reproduced here**.
Verdict: **a calculator wrapper, not a witness.** No dated table, no archive, nothing to fit.
No second Manx surface found in English or Manx ("prayer times", "mosque", "Muslim community",
"Islamic Association"). Honest negative: not found under these terms.

## Channel Islands (first pass)

- **Jersey** — `jerseyislamiccenter.com` is a Google Sites page. It carries a "Salaah timetable"
  heading whose content is an embedded Drive file, not a dated table on the page. No mawaqit, masjidbox
  or masjidal install. **Honest negative**: no dated table reachable without the embedded file; not
  followed further this pass. A name collision to record: searches for "Jersey mosque" return Jersey
  City, New Jersey, whose surfaces (ICJC, athanplus) are unrelated.
- **Guernsey** — `islaminguernsey.com` (Guernsey Islamic Charitable Trust). Prayer times are an
  **IslamicFinder widget iframe**: `islamicfinder.org/prayer-widget/3042287/shafi/4/0/18.5/10`
  (Shafi, method 4, 18.5° / 10°). Two Jumu'ah congregations, no dated table. **A wrapper, not a
  witness.** No masjidbox/mawaqit/masjidal install; negative in English and French ("horaires de
  prière", "mosquée Guernesey").

## Platform traps recorded this wave

- **mawaqit search API is now closed**: `mawaqit.net/api/2.0/mosque/search?q=` and `?word=` both return
  `401 {"message":"Unauthorized"}`. Mosque pages remain public and embed `confData` inline.
- **masjidbox returns HTTP 200 for every slug.** 24 invented slugs all answered 200 with no
  `timetable` payload and no `<title>`. Only slugs found through a search index are real. Never treat a
  200 from this platform as existence.
- **masjidbox payloads are URL-encoded fragments** inside the page: decode, then bracket-match the
  `"timetable":[ … ]` array. Each install exposes a **7-day rolling window**, not a month.
- **mawaqit `calendar` arrays are the displayed (iqama) times on iqama-form installs**, not athan
  times; the athan array (`times`) is today-only. Limerick's shuruq column sits 58 min off the city's
  solar sunrise on its first block while Ennis's matches within 1 min — an install-level fault, flagged.

## Honest negatives

- No second year for any Irish surface. The IFI year door does not exist; the Ramadan set is the same
  generation; no Wayback enumeration of the annual PDFs was completed (CDX regex query returned 504,
  not retried).
- Bray: no surface (above).
- Isle of Man, Jersey, Guernsey: no dated table (above).
- Galway REST v1.3 was **not** re-probed this wave: `galwaymosque.ie` and `galwayislamiccentre.ie` do
  not resolve, and the endpoint URL is not carried in this wave's brief. The held 2027-404 reading is
  neither confirmed nor contradicted here.

## Files

- `captures/ifi_<city>_prayer_timetable.pdf` (26), `captures/ifi_<city>_ramadan_2026.pdf` (3),
  `ifi_city_pdf_manifest.tsv` (URL, status, size, sha256 prefix per file)
- `captures/ifi_feed_*.json` (4 probes), `captures/ifi_ramadan2026_index.html`,
  `captures/ifi_mosques_*.html` (5 province pages)
- `captures/masjidbox_*_page.html` + `masjidbox_*_timetable.json` (6 mosques),
  `captures/mawaqit_*.html` (3 installs), `captures/iom_iaiom_*.html`,
  `captures/jersey_ic_home.html`, `captures/guernsey_ict_home.html`,
  `captures/sligo_muslim_centre_home.html`, `captures/drogheda_own_site.html`
- `data/ifi_<city>_2026.json` (26 × 365 clock-corrected), `data/ifi_<city>_2026_printed.json`,
  `data/ifi_city_measured.json`, `data/ifi_generator_model.json`, `data/ifi_seasonal_amplitude.json`,
  `data/ifi_clamps.json`
- scripts: `parse_ifi_pdfs.py`, `export_rows.py`, `solar.py`, `validate_vs_adhan.cjs`,
  `fit_generator.py`, `measure_angles.py`
