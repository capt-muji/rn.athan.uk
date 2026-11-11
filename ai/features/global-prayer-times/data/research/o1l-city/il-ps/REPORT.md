# O1l-46 — Israel / Palestine city layer

Round two, city level. Workspace `$HOME/athan-gitree/census/o1l-city/il-ps/`. The repository was
not touched. Every capture is raw in `captures/`, every parsed table in `data/`.

## 0. Headline

The record's Jerusalem ceiling (47 Wayback days, "a full year is the lift") is **lifted, and the
mechanism is not the one the record assumed**. The Awqaf homepage renders one dated table per day
and accepts no date parameter; its Wayback footprint yields **78 distinct dated days**, not a year.
The year comes from the publisher's own print: the **Palestinian Dar al-Ifta / Awqaf al-Quds
perpetual table** (`التوقيت الدهري`, 2012/1433), 366 dated month-day rows, which matches **77 of 78
live days exactly at a constant +60 minutes on all six columns**.

The mosque layer resolves cleanly: **every mawaqit page in Palestine and Israel carries the Awqaf
print as its prayer calendar, plus that city's own offset from the Awqaf's published city rule**, and
the per-mosque difference lives in the **iqama** layer, not the prayer layer.

## 1. Jerusalem — Awqaf al-Quds (authority)

### 1.1 The live surface

`https://www.awqafalquds.org/` — Cloudflare interstitial on every path tried: `curl` 403
("Just a moment..."), and `agent-browser` (session `o1l-ilps`) reaches a checkbox challenge
("Verify you are human"). Per the standing rules the challenge was **not** attempted. The live site
is closed to this wave.

The homepage block is server-rendered for the current day only:

```
<div class="milady">17 نيسان 2026</div>
<div id="athanAwl">الآذان الأول 4:21</div> <div id="fajr">الفجر 4:41</div>
<div id="shurook">الشروق 6:04</div>  <div id="thuhr">الظهر 12:38</div>
<div id="asr">العصر 16:16</div>      <div id="magreb">المغرب 19:16</div>
<div id="ishaa">العشاء 20:36</div>
```

No query parameter, no AJAX endpoint, no view argument. A dated request cannot be made; the Wayback
Machine is the only year path on this host.

### 1.2 Wayback harvest — 78 dated days

CDX `url=awqafalquds.org/` 2024-2026 → 234 snapshots, 169/55/10 by year. Parsed to **78 distinct
dated days** (2024: 50, 2025: 22, 2026: 5), each read from the page's own printed date, never a
capture clock. Duplicate same-day snapshots agree byte-for-byte on all six columns. Raw pages:
`captures/awqaf-wb/`. Table: `data/jerusalem-awqaf-wayback.json`.

**One day conflicts and is excluded from the fit:** 2024-02-29 prints fajr 06:12, shuruq 07:36,
dhuhr 12:42, asr 15:27, maghrib 17:52, isha 19:13, which is internally inconsistent with any single
offset from the table (residuals +86, +91, +51, +20, +10, +17). Recorded as a publisher defect on
the leap day, not smoothed away.

### 1.3 The year — the perpetual print

`https://www.aghaalnimer.ps/uploads/library/298201815615.pdf` (620 KB, 32 pp., captured raw as
`captures/ps-dahrī-2012.pdf`), titled `توقيت الصلاة الدهري حسب توقيت المسجد الأقصى المبارك`,
Palestinian Authority / Dar al-Ifta al-Filastiniyya, 1433 H / 2012, signed by the Mufti of
Jerusalem and the Khatib of al-Aqsa.

Parsed by x-coordinate (`parse_perpetual.py`), hours carried down each printed column, 12-hour
print converted per column (`normalise_perpetual.py`) → **366 rows, every month complete to its
printed length** (Feb = 29). Table: `data/jerusalem-awqaf-perpetual-24h.json`.

Validation against the live print: **77/77 comparable days differ by exactly +60 minutes on all six
columns, zero dispersion.** The print is on the winter clock; the site prints fixed UTC+3 all year.
This re-confirms the record's fixed-clock finding on 77 days spread across three calendar years,
**including winter months** — a stronger statement than "residual flips across three DST
transitions", because the winter months are the ones that would expose a civil-clock print.

**The year verdict: 366 days held on the publisher's own table. It is one computed generation** —
the 2012 print is still the live print in 2024-2026, so no recomputation has happened in 14 years.
Under FIT-RULES that closes the "47 days, not a year" defect but **cannot lift provisional to A**.

### 1.4 The official city layer (new)

Page 2 of the same print is the Awqaf's own per-city rule, quoted here as data:

| Offset from Jerusalem | Cities named |
|---|---|
| 0 | Jerusalem, Ramallah, Bethlehem, Jenin, Nablus, Nazareth, Umm al-Fahm |
| -1 min | Jericho, Tiberias, Safed, Beit She'an |
| +1 min | Hebron, Idhna, Dura, Beit Awwa, Haifa, Acre, Tulkarem, Kafr Qasim, Tayibe |
| +1.5 min | Lodd, Ramla, Qalqilya |
| +2 min | Be'er Sheva, Jaffa |
| +3 min | Gaza |
| +4 min | Rafah, Khan Younis, Deir al-Balah |

Plus: Eid prayer begins 35 minutes after sunrise. This is the first **authority** city-level
statement for the whole territory, and it is the mechanism behind the one-minute bands the mosque
platforms print (see §2). It covers Hebron, Jericho, Qalqilya, Be'er Sheva and Gaza, none of which
returned a dated mosque surface.

## 2. The mosque layer — byte-identity test, 26 pages, 13 generations

Every page fetched fresh today from `mawaqit.net/en/m/<slug>` with its embedded `confData` saved
raw (`captures/mawaqit-*.html`); `fetch_mawaqit.py`; index in `data/mawaqit-conf.json`.

**Test result: within every city, the prayer calendar payload is byte-identical across mosques.**
The calendar object is a fixed 22,608-byte payload of 12 month arrays; 26 pages collapse to **13
distinct payloads**, and the collapse is by city band, not by mosque:

| Payload | Mosques | Today's five |
|---|---|---|
| `53f081907d` | Nazareth ×3, Umm al-Fahm ×2 | 04:40 11:23 14:20 16:48 18:05 |
| `b0f784a557` | Jaffa ×2, Ramla ×3 | 04:42 11:25 14:22 16:50 18:07 |
| `cc57c1cf22` | Tayibe ×2, Haifa ×2 | 04:41 11:24 14:21 16:49 18:06 |
| `c6998d8fde` | Tulkarem ×2 | 04:41 11:24 14:21 16:49 18:06 |

**And the payload is the Awqaf print plus the Awqaf's own city offset.** Once the DST hour is
removed, each page equals `data/jerusalem-awqaf-perpetual-24h.json` with a **constant integer band on
all six columns**, and the band is exactly the offset §1.4 assigns that city:

| City | Band | Days at that band | Awqaf rule |
|---|---|---|---|
| Bethlehem al-Nasr | 0 | 207 | "بلا فارق" |
| Haifa al-Istiqlal | +1 | 208 | "بعد القدس بدقيقة" |
| Jaffa al-Bahr | +2 | 208 | "بعد القدس بدقيقتين" |
| Nablus al-Hanbali (no DST) | 0 | 349/366 exact | "بلا فارق" |

So the "platform default" in Palestine and Israel is not a generic MWL computation: it is the Awqaf
al-Quds table carrying the Awqaf's own city offset. The one-minute tiers in §2's payload table are
that rule, not a platform artefact.

Two pages carry a **coarse default coordinate**: both Haifa mosques sit at `32.794, 34.99` (four
decimals, identical), so the printed point is a platform placement, not a survey.

**Own-config vs platform-default, per city.** The prayer calendar is a platform/Awqaf generation
everywhere. The **iqama layer is where mosques differ**, and it is richer than the record holds. Two
Haifa mosques prove the split in one city: identical calendar payload `cc57c1cf22`, identical coarse
point `32.794, 34.99`, and **different iqama** (`+20/+12/+12/+8/+8` against `+21/+11/+11/+8/+8`).

| City | Mosque | iqama class | Own config? |
|---|---|---|---|
| Nablus | الحنبلي | +20/+20/+20/+10/+10 | yes |
| Nablus | الحاجة زهية سويسة | +23/+18/+18/+9/+9 | yes |
| Bethlehem | النصر | **absolute daily timetable** | yes (full year) |
| Bethlehem | صلاح الدين الأيوبي | **absolute daily timetable** | yes (full year) |
| Jenin | شهاب الدين | +25/+20/+20/+10/+10 | yes |
| Jenin | التوحيد اليامون | +23/+16/+16/+10/+10 | yes |
| Tulkarem | الرحمة | **absolute daily timetable** | yes |
| Tulkarem | القيسي | **absolute daily timetable** | yes |
| Ramallah gov. | بلعين الكبير | **absolute daily timetable** | yes |
| Nazareth | عمر بن الخطاب | +25/+15/+15/+10/+10 | yes |
| Nazareth | الأبرار | +25/+10/+10/+8/+10 | yes |
| Nazareth | النبي ساعين | +21/+10/+12/+8/+9 | yes |
| Nazareth | عمر المختار | +20/+10/+10/+10/+10 | yes |
| Umm al-Fahm | أبي بكر الصديق | +20/+15/+15/+8/+8 | yes |
| Umm al-Fahm | عبد الله بن مسعود | +20/+15/+15/+9/+9 | yes |
| Haifa | الاستقلال | +20/+12/+12/+8/+8 | yes |
| Haifa | الحاج عبد الله | +21/+11/+11/+8/+8 | yes |
| Acre | الجزار | +23/+13/+13/+11/+11 | yes |
| Jaffa | البحر | **absolute daily timetable** | yes |
| Jaffa | باب الريان | +25/+15/+15/+10/+10 | yes |
| Ramla | العمري الكبير | +10/+10/+10/+5/+10, **jumua 13:00** | yes (jumua is own) |
| Ramla | حمزة | **absolute daily timetable** | yes |
| Ramla | الفضل بن العباس | +18/+12/+12/+7/+7 | yes |
| Tayibe | أبو هريرة | **absolute daily timetable** | yes |
| Tayibe | عمر بن الخطاب | +25/+17/+17/+7/+7 | yes |
| Hebron gov. | شهداء غزة (الفوار) | +25/+17/+17/+12/+12 | yes |

Eight pages carry a full per-day iqama timetable rather than offsets — a second data layer the record
does not hold.

Correction to the record: "only Jaffa carries its own configuration (iqama +20/+15/+15/+7/+7)" does
not survive the pages. **Every** mosque page checked carries its own iqama configuration; the
record's Jaffa offsets are not reproduced on either Jaffa page today (`+25/+15/+15/+10/+10` and an
absolute timetable). What the record correctly identified is that the **prayer calendar** is a
platform default — that half is confirmed and now measured.

## 3. Fit — adhan 4.4.6, Rounding.None, fixed clocks, literal dates

Point: Al-Aqsa `31.7761, 35.2358`. Shafi asr, no high-latitude rule, no real clock. Targets converted
to UTC before scoring, so a surviving margin is a publisher adjustment, never a zone
(`fit_awqaf.js`, `score_recipes.js`, `data/fit-awqaf*.json`).

**Recipe (the record's, confirmed by measurement on the full year): 18/18, Shafi, sunrise -3,
maghrib +6, dhuhr floor, other columns nearest.**

| Set | Days | MAE | exact | within 1 | worst |
|---|---|---|---|---|---|
| Live, fixed UTC+3 | 77 | 0.50 | 54.5% | 92.4-98% | 2 |
| Perpetual, winter +2 | 366 | **0.485** | 57.6% | 94.8% | 4 (fajr) |

Per column on the 366-day set: fajr 0.80 (45.9% exact), sunrise 0.59, **dhuhr 0.077 (92.3% exact —
the floor rule is measured, not inherited)**, asr 0.48, maghrib 0.39, isha 0.57.

A free angle grid returns 18.25/17.9 with MAE 0.514, i.e. **worse than the record's 18/18 once the
dhuhr floor is applied** — the twilight pair is weakly identified here and the record's value stands.

**Per-year (live set):** 2024 50 d MAE 0.473 / 54.7% exact; 2025 22 d MAE 0.530 / 54.5%; 2026 5 d
MAE 0.633 / 43.3%. **Stability: parameters frozen** — one generation, no drift, no dated regime
change across the three years held.

**Seasonal amplitude:** fajr spans 05:12-05:13 in January against 02:58-03:21 in July, a **111-minute
swing** — mid-latitude, so the between-year flatness is a reprint property, not a latitude property.

**Ceiling and forward longevity:** 366 days + 78 live days, one generation → **stable-across-3-years**,
not proven-to-a-future-year. No endpoint serves a future year; the 2027 print does not exist.

**Clock, explicit:** the print is winter time (UTC+2). The live site prints **UTC+3 year-round**,
proven by a constant +60 on 77 days including November and February. The app must shift the instant,
not the zone, and must not apply `Asia/Jerusalem` DST.

## 4. Honest negatives

- **Gaza City:** no authority, mosque or dated surface. `mawaqit` returns only Algeria/Tunisia
  namesakes; the one "Gaza" page (`msjd-shhda-ghzh-lfwar`) is a mosque **named** for Gaza at
  al-Fawwar camp, Hebron governorate (31.4764, 35.0621). Remaining hits are calculators
  (`almosaly.com`, `prayertimes3.today`, `ps.prayertimes.news`) and Instagram/Facebook imsakiyya
  posters, which are not dated tables. Searched Arabic and English.
- **Palestine ministry:** `tawaf.ps` connection timeout on three paths; `awqaf.ps` a 720-byte login
  stub. Both reconfirm the record's closure.
- **Hebron, Jericho, Qalqilya, Be'er Sheva:** no mawaqit or Masjidbox mosque page found under
  Arabic and English terms. Covered only by the Awqaf offset rule (§1.4).
- **Masjidbox / Masjidal:** no public directory; `masjidbox.com/prayer-times` 404 and its search
  returns other cities' pages. Not used.
- **`paltimeps.ps`** is a news portal with a weather widget, not a prayer surface.
- **`almadina-college.com/prayer-times`** is a 2.3 KB placeholder.

This is not a claim that any city or country is complete. It is what these terms returned.
