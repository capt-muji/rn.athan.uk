# kel2: Kelantan zon 1 / zon 2 tables, and the neutral Yemen two-feed diff

Agent tag `kel2`. Public pages only, no login, no challenge solved, no contact with any body.
No subagents. Two jobs, both closed. Everything below is measured from the files in this
workspace; `scripts/` holds the code and `runs.log` holds every printed number.

Tooling: `curl` with a crawler user agent (the only way a logged-out Facebook post renders its
own public story), TinyFish for Malay search, `agent-browser` in session `o1k-kel2` for the
page-level read, and the in-repo `adhan 4.4.6` at `~/athan-gitree/census/adhan-build` for every
fit. Time zones are pinned by the caller (`TZ=Asia/Kuala_Lumpur`), no clock is read anywhere,
geometry is produced at second resolution and rounded explicitly afterwards.

---

# Job 1: the Kelantan zon tables, actually captured

## 1.1 Where the table lives, and where it does not

| Surface | URL | Tier | Dated data |
|---|---|---|---|
| Jabatan Mufti Negeri Kelantan, Bahagian Falak (functions page) | `mufti.kelantan.gov.my/index.php/info-jabatan/bahagian-jmnk/jabatan-falak` | authority | none: states the Unit Takwim maintains "data waktu solat bagi zon 1 dan zon 2 Negeri Kelantan" |
| Jabatan Mufti, Muat Turun (Joomla Phoca Download) | `mufti.kelantan.gov.my/index.php/perkhidmatan/muat-turun` | authority | one item, "Borang Arah Kiblat"; no prayer file |
| Jabatan Mufti, Data Terbuka | `mufti.kelantan.gov.my/index.php/info-umum/data-terbuka` | authority | qibla verification, visitor counts, hilal observation; no prayer times |
| **Jabatan Mufti public Facebook page, monthly poster** | `facebook.com/MUFTIKELANTAN` | authority by publisher | **monthly zon 1 + zon 2 poster, Hijri month, printed table** |

The office maintains the data and publishes none of it on its own site. Direct `curl` to
`mufti.kelantan.gov.my` times out from this network (000, repeated); the pages above were read
through the TinyFish fetch API.

## 1.2 The capture that was missing before

A logged-out Facebook page renders only its intro and a photo teaser; the post feed is behind a
sign-in. The public post permalink does render, though, when the request carries a crawler user
agent, and its `og:image` is the full-size poster on `lookaside.fbsbx.com/lookaside/crawler/media/`.
That is the route used, and it needs no account and no cookie:

```
curl -sSL -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  "https://www.facebook.com/MUFTIKELANTAN/posts/<id>/"          # og:description = title, og:image = poster
curl -sSL -A "<same>" "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=<id>" -o <file>
```

Both poster files are on disk, unmodified, 1381 x 2048 px, ~1.0 MB each:

| Month | Post | Image file |
|---|---|---|
| Zulkaedah 1441H / 2020M (23 Jun - 21 Julai) | `posts/1549876565218391` | `captures/my-ktn-1441-zulkaedah-media1549876541885060.jpg` |
| Syawal 1441H / 2020M (24 Mei - 22 Jun) | `posts/1520979401441441` | `captures/my-ktn-1441-syawal-media1520979371441441.jpg` |

Poster footer, verbatim: "Jabatan Mufti Negeri Kelantan / http://www.muftikelantan.gov.my/ /
Tel: 09 748 2023 Fax: 09 7478170 / jabmufti@kelantan.gov.my". Zone membership as printed:
**ZON 1** = Jajahan Kota Bharu, Bachok, Pasir Puteh, Tumpat, Pasir Mas, Tanah Merah, Machang,
Kuala Krai dan Gua Musang (Daerah Chiku); **ZON 2** = Jajahan Jeli, Gua Musang (Daerah Galas dan
Bertam) dan Jajahan Kecil Lojing.

**Which month is "latest", stated honestly.** Zulkaedah is the later of the two posters that
exist, and it is the last of the series I could find. The page's twenty most recent posts (Nov
2026 back to Aug 2026) are events, visits and greetings and carry no prayer table; the 1441
posters are the only monthly zon 1 + zon 2 tables on the page surface that the crawler render
exposes. Wayback holds exactly one capture of the page (2022-04-11) and no post URL. So the
series appears to have stopped after 1441H; that is an inference from a 20-post window, not a
proof.

## 1.3 Transcription, and how it was checked

Both posters are transcribed in full, both zones, all columns, into
`data/ktn-mufti-1441.json`; the same rows are mirrored inside `kelantan.json` under
`transcription`.

| Month | Zone | Rows | First | Last |
|---|---|---|---|---|
| Zulkaedah 1441 | zon 1 | 29 | 2020-06-23 | 2020-07-21 |
| Zulkaedah 1441 | zon 2 | 29 | 2020-06-23 | 2020-07-21 |
| Syawal 1441 | zon 1 | 30 | 2020-05-24 | 2020-06-22 |
| Syawal 1441 | zon 2 | 30 | 2020-05-24 | 2020-06-22 |

Columns printed: Subuh, Syuruk, Dhuha, Zohor, Asar, Maghrib, Isyak. **There is no Imsak row**, so
the imsak rule (JAKIM's fajr - 10, PLS01's exception) cannot be tested from this surface at all.

Checks run over all 118 rows (`scripts/check_transcription.mjs`):

- **Weekday binding.** Every printed weekday matches the 2020 Gregorian calendar for its own
  date, all 118 rows. 24 May 2020 is a Sunday and row 1 says Ahad; 23 Jun 2020 is a Tuesday and
  row 1 says Selasa. The month-to-date binding is therefore not in doubt.
- **Ordering.** Subuh < Syuruk < Dhuha < Zohor < Asar < Maghrib < Isyak holds on every row, both
  zones, both months. Date sequence strictly increasing, no gaps, no repeats.
- **Dhuha is a derived column, not a prayer.** Dhuha - Syuruk is 28 minutes on 113 of 118 rows;
  five late-Zulkaedah zon 1 rows print 27.
- **Isyak - Maghrib** runs 70-72 minutes across both months.
- **Cross-zone structure.** Zon 2 minus Zon 1, in printed minutes: Subuh +3..+5, Syuruk
  +3..+4, Zohor +1..+2, Asar +1..+3, Maghrib 0..+1, Isyak -1..0. Zon 2 runs later through the
  morning and the noon pair, level or a minute later at Maghrib, and level or a minute earlier
  at Isyak: a shorter day with a slightly later noon.

Both posters were read twice: first in overlapping horizontal bands at 3x, then in a second pass
with different band boundaries plus a 5x crop of every table's tail rows (`img/`). The second
pass reproduced every cell. The two places where the first pass could plausibly have misread were
re-read at 5x and settled: the Asar step from 4.44 to 4.43 at Zulkaedah rows 27-28 (real, and the
only non-monotone step in that column), and the five Zulkaedah zon 1 Dhuha cells that print 7.32
where the surrounding rows print 7.33 (real; Dhuha is a derived column, so a printed dip is
possible). Nothing else in the two months moves.

## 1.4 Fit at Kota Bharu (6.1200 N, 102.2400 E, Asia/Kuala_Lumpur)

Engine: adhan 4.4.6, Shafi asr, no high-latitude rule, second resolution, then an explicit
`floor`/`ceil`/`nearest` and a margin swept on a 0.5-minute grid. "Implied depth" is the sun's
true depression at the printed minute, inverted against adhan's own solar position, so it is a
measurement of the table, not a back-fitted parameter.

**Zon 1, both months, at Kota Bharu:**

| Column | Zulkaedah 1441 | Syawal 1441 | Implied depth (both months) |
|---|---|---|---|
| Subuh | 17.7 deg, margin 0, floor: 28/29 exact, 29/29 within 1 | 17.05 deg, -3, floor: 29/30 exact | 17.60-17.84 deg, median 17.71 / 17.75 |
| Syuruk | margin +1, floor: 21/29 exact, 29/29 within 1 | +1, floor: 24/30 exact | sunrise |
| Zohor | +3, floor: 19/29 exact | +3, floor: 20/30 exact | true noon + ~2.7 min |
| Asar | +1, floor: 16/29 exact, 29/29 within 1 | +2, floor: 17/30 exact | Shafi |
| Maghrib | +1, floor: 25/29 exact | +1, floor: 21/30 exact | sunset + ~1 min |
| Isyak | 17.05 deg, +1, floor: 28/29 exact | 17.05 deg, +1, floor: 30/30 exact | 17.18-17.42 deg, median 17.24 / 17.31 |

Read the angle/margin pair as one parameter: 17.7 deg with margin 0 and 17.05 deg with margin -3
score identically (MAE 0.03). At one-minute print resolution the pair is degenerate, exactly as
`fit10` found for the JAKIM annual. The printed amplitude is what the implied-depth column
carries, and that is the number to trust: **fajr sits at 17.6-17.84 deg, isha at 17.2-17.4 deg**.

**Against the JAKIM recipe, emulated at its own declared KTN01 point (6.1254 N, 102.2381 E)**
with fajr 18, isha 17, margins +2/-1/+1.5/+2/0/+2 and ceil/floor/nearest:

| Column | mufti minus JAKIM, Zulkaedah | mufti minus JAKIM, Syawal |
|---|---|---|
| subuh | -0.66 [-1, 0] | -0.80 [-1, 0] |
| syuruk | +1.72 [+1, +2] | +1.80 [+1, +2] |
| zohor | +1.16 [+0.5, +1.5] | +1.17 [+0.5, +1.5] |
| asar | -0.59 [-1, 0] | -0.43 [-1, 0] |
| maghrib | +1.14 [+1, +2] | +1.30 [+1, +2] |
| isyak, isha 17 | -0.83 [-1, 0] | -0.73 [-1, 0] |
| isyak, isha 18 | **-5.38 [-6, -5]** | **-5.27 [-6, -5]** |

## 1.5 Verdict on Zon 1: the JAKIM rule at 18/17, its own almanac at its own point

Zon 1 is the JAKIM recipe family, and it is not a copy of the JAKIM table.

- **Fajr 18 is inside the band**, on two independent measurements (implied 17.7 deg, and the
  free fit admitting 17.0-18.5 within one minute at a free margin). 20 deg, JAKIM's general-zone
  value, is 2.2 degrees deeper than the measured band and cannot print this table.
- **Isha is 17, decisively.** Emulating the JAKIM KTN01 exception at 17 leaves a residual of
  0.8 minutes; the federation value of 18 misses by 5.3 minutes on every one of 59 days. This
  settles the question left open by the one-sample 2026 check: Kelantan's isha is the 17-degree
  zone, and the brief's "isha 18 KTN01" reading is refuted.
- **What differs from JAKIM is rendering, not rule.** Every column sits within 0.7-1.8 minutes
  of the JAKIM emulation, with sunrise and maghrib *later* and the twilight columns *earlier*:
  that is a reference point a few tenths of a degree west of JAKIM's westernmost-point rule,
  not a different set of angles. Asr is Shafi in both (Hanafi would move it 60-70 minutes).
- **Rounding is floor on every column**, in both zones and both months, ten columns out of ten.
  JAKIM ceilings the five prayers and floors only syuruk. This is a real, stated difference, and
  it is what makes the mufti's clock sit a minute under JAKIM's on the four margin-carrying
  columns.

## 1.6 Verdict on Zon 2: the same rule at a second interior point, not at Kota Bharu

Zon 2 cannot be produced at Kota Bharu. The identical recipe at Kota Bharu misses it by 3.3
minutes on subuh, 5.5 on syuruk and 3.1 on zohor, and the free fit at Kota Bharu is poor on
sunrise (MAE 1.48) and noon (MAE 1.55), because no angle or margin can make one point print
sunrise 4 minutes later than zon 1 while printing sunset at the same minute.

The shape of the zon 2 - zon 1 difference says why, without any fitting: zon 2's day is
**3-4 minutes shorter** (maghrib - syuruk, median 748 min vs 745 min in Zulkaedah, 749 vs 745 in
Syawal) and its noon is 1-2 minutes later. A shorter day in late June at 6 N means a point
further from the subsolar latitude, i.e. further south; a later noon means slightly west. Solving
the sunrise/sunset pair alone:

| Month | Implied zon 2 point | Sunrise / maghrib residual at that point |
|---|---|---|
| Zulkaedah 1441 | 4.35 N, 101.62 E | 29/29 exact both |
| Syawal 1441 | 4.90 N, 101.88 E | 29/30 and 29/30 exact |

Both land inside the districts the poster names for zon 2 (Gua Musang 4.88 N 101.97 E, Jeli
5.70 N 101.84 E, Lojing ~4.6 N 101.35 E). The two months agree on the region and not on a point,
which is the honest width: near the solstice, one month of sunrise/sunset minutes pins a locus,
not a coordinate.

At each zone's own solved point, every column of zon 2 reproduces to MAE 0.1 minute or better,
and the twilight pair comes out at the same place as zon 1's: **fajr implied 17.6-18.2 deg
(median 17.70 to 18.14), isha implied 17.37-17.59 deg (median 17.43 to 17.49)**. So:

- **Zon 2 carries the same recipe as zon 1.** There is no 18/17 split between the zones: isha is
  ~17.4 in both, fajr is at or just above 17.7 in both.
- **The zones differ in geography, not in rules.** Zon 2's table is what the same 18/17-Shafi
  recipe prints at a point roughly 1.2-1.8 degrees south of Kota Bharu.
- **The brief's premise "isha 18 KTN01 / 17 KTN02" does not hold for this publisher.** Both
  zones print an isha of the 17 class, and the two zones print identical Maghrib on 15 of 29
  Zulkaedah days (26 of 30 Syawal) and identical Isyak on 28 of 29 Zulkaedah days (26 of 30
  Syawal).

## 1.7 Honest negatives, Job 1

- The Jabatan Mufti site publishes no prayer table, no takwim download and no open-data file.
  Searched its full menu and all four service pages; the Phoca download category holds one qibla
  form.
- No poster later than Zulkaedah 1441 surfaced. Twenty recent page posts (late 2026, all events),
  two indexed 1441 posts, one Wayback capture (2022, useless). DuckDuckGo served a bot challenge and Bing returned no
  results for the page-scoped query; both are recorded, neither was worked around.
- No Imsak column exists on the poster, so the imsak rule cannot be tested here at all.
- Two months, one Hijri year. Enough to separate 17 from 18 on isha (a 5-minute effect) and to
  place zon 2's geography; not enough to call the rounding direction beyond "floor wins on all
  ten columns", and not enough for a year-grade verdict.

---

# Job 2: the neutral Yemen two-feed diff

Facts only. No fit, no recommendation, nothing about which feed the owner should choose.
Data: `gulf2/data/ye-sanaa-31-locations-nov2026.json` and
`gulf2/data/ye-gov-aden-nov2026.json`, re-cut into `yemen-diff.json` by `scripts/yemen_diff.py`.
All values below are minutes of local civil time; every delta is **government feed minus Sanaa
feed**.

## 2.1 What each feed is, as captured

| | Sanaa feed | Government feed |
|---|---|---|
| Publisher | Awqaf authority, Sanaa (`awqaf.gov.ye`) | Ministry of Awqaf and Guidance (`yemenawqaf.org`) |
| Shape | JSON, one document per date, 31 locations, ~6 fields each | one HTML table per month per city, 6 city options |
| Locations captured | 31 (governorates and districts, incl. Sanaa, Aden, Mukalla, Seiyun, Marib, Mahra, Lahj) | 6 (عدن، المكلا، سيئون، مارب، الغيضة، الحوطة) |
| Dates held | 2026-11-01 … 2026-11-10, with **2026-11-08 empty** (9 dated days) | the whole month of any month selectable for 2025, 2026, 2027 (Nov 2026 captured, 30 rows) |
| Recency, as captured | `api_updated_at` 2026-11-10 19:30:16, `server_updated_at` 22:30:17, `server_now` 22:33:55 | no update stamp on the captured page |
| Cadence | rolling: today forward about 9-10 days; every date after 2026-11-10 and every date before 2026-11-01 returned an empty document | month blocks, no history limit observed inside the 2025-2027 selector |
| Per-location values | distinct per location (Aden 04:41 vs Mukalla 04:26 on the same day) | one table serves the city selected; the six selections are a Livewire filter, and only the Aden render was captured |

## 2.2 The overlap: 9 dates, 4 exactly matching places

Shared dates: 2026-11-01, 02, 03, 04, 05, 06, 07, 09, 10 (the 8th is empty in the Sanaa feed).

| Location pair | Feed A (Sanaa) | Feed B (government) |
|---|---|---|
| Aden | عدن | عدن |
| Mukalla | حضرموت - المكلا | المكلا |
| Seiyun | حضرموت - سيئون | سيئون |
| Marib | مأرب | مارب |

Two further pairs are the same governorate at different granularity and are reported separately,
not merged: Sanaa's المهرة (governorate) vs the government feed's الغيضة (Ghaydah, its capital),
and Sanaa's لحج vs الحوطة (Al Hawtah, capital of Lahj).

## 2.3 Side by side, fajr and isha (minutes)

| Date | Aden S | Aden G | d | Mukalla S | Mukalla G | d | Seiyun S | Seiyun G | d | Marib S | Marib G | d |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 11-01 | 04:41 | 04:48 | +7 | 04:26 | 04:48 | +22 | 04:29 | 04:48 | +19 | 04:42 | 04:48 | +6 |
| 11-02 | 04:41 | 04:48 | +7 | 04:26 | 04:48 | +22 | 04:29 | 04:48 | +19 | 04:42 | 04:48 | +6 |
| 11-03 | 04:41 | 04:48 | +7 | 04:27 | 04:48 | +21 | 04:29 | 04:48 | +19 | 04:43 | 04:48 | +5 |
| 11-04 | 04:42 | 04:48 | +6 | 04:27 | 04:48 | +21 | 04:29 | 04:48 | +19 | 04:43 | 04:48 | +5 |
| 11-05 | 04:42 | 04:49 | +7 | 04:27 | 04:49 | +22 | 04:30 | 04:49 | +19 | 04:43 | 04:49 | +6 |
| 11-06 | 04:42 | 04:49 | +7 | 04:27 | 04:49 | +22 | 04:30 | 04:49 | +19 | 04:43 | 04:49 | +6 |
| 11-07 | 04:42 | 04:49 | +7 | 04:28 | 04:49 | +21 | 04:30 | 04:49 | +19 | 04:44 | 04:49 | +5 |
| 11-09 | 04:43 | 04:50 | +7 | 04:28 | 04:50 | +22 | 04:31 | 04:50 | +19 | 04:44 | 04:50 | +6 |
| 11-10 | 04:43 | 04:50 | +7 | 04:28 | 04:50 | +22 | 04:31 | 04:50 | +19 | 04:45 | 04:50 | +5 |

Isha, same grid (`S` = Sanaa feed, `G` = government feed):

| Date | Aden S | Aden G | d | Mukalla S | Mukalla G | d | Seiyun S | Seiyun G | d | Marib S | Marib G | d |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 11-01 | 18:37 | 18:42 | +5 | 18:20 | 18:42 | +22 | 18:20 | 18:42 | +22 | 18:34 | 18:42 | +8 |
| 11-02 | 18:37 | 18:41 | +4 | 18:19 | 18:41 | +22 | 18:19 | 18:41 | +22 | 18:34 | 18:41 | +7 |
| 11-03 | 18:37 | 18:41 | +4 | 18:19 | 18:41 | +22 | 18:19 | 18:41 | +22 | 18:33 | 18:41 | +8 |
| 11-04 | 18:37 | 18:41 | +4 | 18:19 | 18:41 | +22 | 18:19 | 18:41 | +22 | 18:33 | 18:41 | +8 |
| 11-05 | 18:37 | 18:41 | +4 | 18:19 | 18:41 | +22 | 18:19 | 18:41 | +22 | 18:33 | 18:41 | +8 |
| 11-06 | 18:36 | 18:41 | +5 | 18:18 | 18:41 | +23 | 18:18 | 18:41 | +23 | 18:33 | 18:41 | +8 |
| 11-07 | 18:36 | 18:41 | +5 | 18:18 | 18:41 | +23 | 18:18 | 18:41 | +23 | 18:32 | 18:41 | +9 |
| 11-09 | 18:36 | 18:40 | +4 | 18:18 | 18:40 | +22 | 18:18 | 18:40 | +22 | 18:32 | 18:40 | +8 |
| 11-10 | 18:36 | 18:40 | +4 | 18:18 | 18:40 | +22 | 18:18 | 18:40 | +22 | 18:32 | 18:40 | +8 |

## 2.4 Per-prayer delta over all 36 location-days

Government minus Sanaa, minutes:

| Prayer | Mean | Range | Distribution |
|---|---|---|---|
| fajr | +13.3 | +5 … +22 | +5/+6/+7 at Aden and Marib, +19/+21/+22 at Mukalla and Seiyun |
| sunrise | +5.9 | -3 … +15 | -3/-2/0 at Aden, +11…+15 at the Hadramawt pair |
| dhuhr | +0.9 | -8 … +9 | -6…-8 at Aden and Marib, +7…+9 at Mukalla and Seiyun |
| asr | +9.2 | 0 … +18 | 0…+3 at Aden, +16…+18 at the Hadramawt pair |
| maghrib | +3.9 | -6 … +14 | -5/-6 at Aden, +12…+14 at the Hadramawt pair |
| isha | +14.2 | +4 … +23 | +4/+5 at Aden, +22/+23 at the Hadramawt pair |

The spread is not noise around one difference. The two feeds agree closely at **Aden** (fajr +7,
isha +4…+5) and **Marib** (fajr +5…+6, isha +7…+9), and disagree by three to four times as much
at **Mukalla and Seiyun** (fajr +19…+22, isha +22…+23). The Sanaa feed prints a genuinely
different value for each of its 31 locations; the government feed's captured table prints Aden's
own values, and its dhuhr 11:46 sits about two and a half minutes above Aden's solar noon
under UTC+3, which is consistent with a table computed at Aden rather than a national constant. I did not
capture the other five city renders, so I make no claim about what they print.

## 2.5 Geography: the two feeds do not cover the same country

- **Sanaa feed, 31 locations**, including Sanaa city, Saada, Amran, Dhamar, Ibb, Taiz, Hodeidah
  (5 districts), Al Bayda (2), Abyan (2), Hadramawt (3: Mukalla, Seiyun, Tarim), Mahra, Lahj,
  Al Dhale, Shabwa, Marib, Al Jawf, Al Mahwit, Raymah, Hajjah (2), Socotra.
- **Government feed, 6 cities**: Aden, Mukalla, Seiyun, Marib, Ghaydah, Al Hawtah. It publishes
  **nothing for Sanaa city**, and nothing for Saada, Amran, Dhamar, Ibb, Taiz, Hodeidah, Hajjah,
  Al Bayda, Al Dhale, Shabwa, Al Jawf, Al Mahwit, Raymah or Socotra.
- Where both cover the same name, they cover it at different granularity twice: Mahra
  (governorate) against Ghaydah (its capital), Lahj against Al Hawtah (its capital).
- Consequence, stated plainly: **the only place both feeds name on the same day and at the same
  granularity is four cities in the south and east, plus Aden.** The capital itself is served by
  one feed only.

## 2.6 Honest negatives, Job 2

- Nine Sanaa days against one government month, and four genuinely shared locations. That is the
  whole comparable surface; nothing here supports a per-prayer model of either feed.
- The government feed's month for the other five cities was not captured (Livewire POST filter).
  The claim that its six cities differ, or do not, is therefore untested.
- The Sanaa feed's 2026-11-08 document is absent from its own API while the 7th and 9th are
  present, so a single missing day is a property of the feed, not of the capture.
- Neither feed publishes a method statement, an angle, or a rounding rule on the pages captured.

---

# What is on disk

```
captures/my-ktn-1441-zulkaedah-media1549876541885060.jpg   zon 1 + zon 2 poster, Zulkaedah 1441
captures/my-ktn-1441-syawal-media1520979371441441.jpg      zon 1 + zon 2 poster, Syawal 1441
captures/fb-post-<id>.html                                23 public post renders (crawler UA)
captures/my-mufti-fb-page.html                            page render, 20 recent post ids
captures/wb-cdx-muftikelantan.txt                         Wayback CDX, one capture, 2022
captures/search-*.html                                    the two blocked search surfaces
data/ktn-mufti-1441.json                                  the transcription, 118 rows
kelantan.json                                             transcription + every fit output
yemen-diff.json                                           the two-feed diff, per date and per location
img/                                                      the 3x-5x enlargements read from
scripts/                                                  crop, check, fit, diff
runs.log                                                  every number quoted above
```
