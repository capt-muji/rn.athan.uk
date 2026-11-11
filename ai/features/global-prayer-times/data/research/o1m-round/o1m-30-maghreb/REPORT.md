# O1m-30 Maghreb year-2: Morocco, Algeria, Tunisia, Libya, and the platform cross-check

Wave `o1m-30`, round o1m, 2026-11-11. Workspace `$HOME/athan-gitree/census/o1m/o1m-30-maghreb/`.
Public pages only, GET only, no login, no form, no challenge met. Raw in `captures/`, dated rows in
`data/`, fits and the wave summary in `fit/`, renders in `pages/`. Engine adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`, integer margins per
column, dates taken from literal capture strings, capture times in UTC. The repository was not
touched. Two binding prohibitions held throughout: the 2026 rebuild is never blended with the
pre-rebuild months, and the 2026-09-20 GMT decree is never blended with the pre-decree clock.

---

## 1. Morocco: December still absent, the pre-rebuild archive is empty, and the decree's real test

### 1.1 The portal's window, re-probed with payload checks

| Probe (UTC 2026-11-11) | Status | Bytes | Payload |
| --- | ---: | ---: | --- |
| `data/horaires-2026-11.js` | 200 | 292,088 | sha256 `17f3372…c9eb`, byte-identical to the O1l capture |
| `data/horaires-2026-12.js` | 404 | 153 | nginx default page |
| `data/horaires-2027-01.js` | 404 | 555 | nginx default page |
| `data/horaires-2027-02.js` | 404 | 555 | nginx default page |
| `data/horaires-2027.js`, `-2027-01`, `-1448-01`, `horaires.json`, `api/horaires` | 404 | 153 | no alternative path serves a year |

The portal root references `horaires-2026-10.js` and `horaires-2026-11.js` and nothing else. The
November file is byte-identical to the copy banked by O1l-39, so the served generation has not moved.
December was 404 at three dated probes in O1l (05:39/05:57/05:58Z) and is 404 again today: the window
is still current plus previous month, and the 404 body has changed from 555 to 153 bytes between the
two runs, which is a node or vhost difference, not a content difference.

`data/hijri.js` (1,112 bytes, 200) still serves the announced month starts, so the portal is alive and
the absence is a publication schedule, not an outage.

### 1.2 The pre-rebuild months are not on Wayback either (record correction)

The census record says the pre-rebuild months are Wayback-only. They are not.

- CDX for `habous.gov.ma/data*` returns three rows: `data/hijri.js` and a single
  `data/horaires-2026-10.js` capture (2026-10-23). No 2024 or 2025 month file exists.
- CDX for the old portal's own month endpoint
  `…/fr/horaire de priere fr/horaire_hijri.php` (prefix match) returns 17 captures, of which four are
  usable 200s from 2025-03-19 and 2025-03-26 (ville 69, ville 88, mois 2). Fetched and decoded
  (`captures/wb-mo-hijri-*.dec.html`): the archived page is a **static 2012 table** — the header reads
  *Hijri month Dhu al-Qada 1433 / 2012* and the rows run 05:25 06:51 12:44 15:56 18:29 19:44. The
  archive ignores the `ville`/`mois` query, so those captures carry no 2024/2025 month.
- The live old endpoint answers 404 under the rebuilt portal, and O1k's own sweep of
  `horaires-2024-10` … `horaires-2025-12` returned 555-byte 404s in every month.

**Verdict: no pre-rebuild Morocco month exists on this portal, in the Wayback machine, or under the
old endpoint.** The pre-rebuild era survives only in the census's own O1k reads of the rebuilt file
names, which were themselves 404s. Any 2024/2025 Morocco month must come from a third party, and every
third-party Moroccan surface found this round prints a computed preset, not the ministry table.

### 1.3 The decree test: December cannot discriminate, October already did

The 2026-09-20 decree (decree 2.26.530, `DECALAGE_MAROC_MINUTES = 0`) keeps Morocco on GMT year round.
A winter month is the **wrong test** for it: under the pre-decree DST rule Morocco was already on GMT
from late October to late March, so a December table printing UTC+0 is equally consistent with the old
regime and the new one. The discriminating window is the one where the old rule would have printed
UTC+1 and the decree prints UTC+0 — that is the last week of March through the last week of October.

- The discriminating window already in hand is **October 2026**: 190 cities × 31 days printed on UTC+0
  (O1l-39: printed dhuhr minus UTC transit `+5.00 min, sd 0.29` over all 190 solved longitudes). Under
  the pre-decree rule 1-25 October would have printed UTC+1 and the same statistic would have read
  `+65`. The decree therefore holds on the only month that can show it.
- November 2026, re-measured today from the identical file, repeats the UTC+0 reading.
- December 2026, if and when it lands, adds a confirmation of a fact the old regime also produces. It
  cannot falsify the decree.
- The next genuinely discriminating window is **2027-03-28 onward** (the old rule's spring switch). The
  portal serves no 2027 month, so no surface exists today on which to run it.

**Verdict: the decree holds; the winter test is satisfied but non-discriminating, and the record should
not cite a December month as its evidence.**

### 1.4 Morocco's residue

- No 2027 edition at any probed path; the portal publishes nothing beyond the current plus previous
  month, so a 2027 edition is structurally unavailable from this publisher.
- `horaire-de-priere.ma` (community aggregator, 120+ city pages) serves November 2026 as a 30-row
  monthly table. Its Casablanca dhuhr prints 12:19-12:24 while the UTC transit is 12:30, i.e. 6-11
  minutes **before** transit, which no Morocco recipe produces. Recorded as a defective aggregator,
  not used for the decree test.

---

## 2. Algeria: the 1448 book found, transcribed, and the recipe reproduced on a second Hijri year

### 2.1 The book

`marw.gov.dz` was unreachable from this host all session (DNS resolves to its address; TCP times out,
and `www.` is NXDOMAIN). The Wayback machine holds the book:
`marw.gov.dz/media/calendrier/1448/Alger.pdf`, captured 2026-07-30 20:24:03, 3,638,619 bytes, fetched
whole to `captures/dz-1448-alger-wayback.pdf` (3,638,042 bytes on disk). Sixteen pages, one per month
for pages 2-13, **zero text characters on every page** (PDFKit reads 0 on all 16), so the content is a
scan and the transcription is OCR.

The CDX prefix sweep for the whole ministry domain returns exactly four books: three 1447 books
(Adrar, Alger, Djelfa) and this one 1448 book. **1448 exists for Alger only** — no Adrar, no Djelfa, no
fourth wilaya — and no 1449 or 2027 edition exists under that path.

### 2.2 The pipeline, and what it cost

Rendering is the census renderer at 5x and 6x (page ≈ 4,210 × 2,975 px). Text extraction is the macOS
Vision binary at `$HOME/athan-gitree/census/tools/ocr`, never a model-vision pass.

The page is a right-to-left table: the six printed time columns come out of OCR as **isha, maghrib,
asr, dhuhr, qibla, sunrise, fajr**, seven tokens per day. Two properties make the parse verifiable
without trusting a single token:

1. **Token-count identity.** A page is accepted only when the repaired token stream is exactly
   `7 × days` and the month's own printed date anchors agree with the start date. Eight of twelve
   months satisfy this at one of the two scales (manifest below). Three others (months 5, 6, 8) lose
   tokens to glyph merging at every scale tried from 5x to 8x and are not used; month 1 is already held
   from O1l-17r.
2. **Printed-order and day-step audit.** Every row must satisfy
   `fajr < sunrise < dhuhr < asr < maghrib < isha`, and no cell may step more than 10 minutes from
   both neighbours. A row that fails is **withheld**, never corrected.

| Hijri 1448 month | Page | Scale | Days | Dates | Kept |
| --- | ---: | ---: | ---: | --- | ---: |
| 2 Safar | 3 | 5x | 29 | 2026-07-16 … 2026-08-13 | 29 |
| 3 Rabi I | 4 | 5x | 30 | 2026-08-14 … 2026-09-12 | 30 |
| 4 Rabi II | 5 | 6x | 29 | 2026-09-13 … 2026-10-11 | 29 |
| 7 Rajab | 8 | 5x | 29 | 2026-12-11 … 2027-01-08 | 16 |
| 9 Ramadan | 10 | 6x | 30 | 2027-02-08 … 2027-03-09 | 27 |
| 10 Shawwal | 11 | 5x | 29 | 2027-03-10 … 2027-04-07 | 29 |
| 11 Dhu al-Qada | 12 | 6x | 30 | 2027-04-08 … 2027-05-07 | 30 |
| 12 Dhu al-Hijja | 13 | 6x | 29 | 2027-05-08 … 2027-06-05 | 29 |

**235 days transcribed, 219 kept, 16 withheld** (`data/dz48-alger.json`,
`fit/dz48-fit.json` → `withheld`). The withheld days are 2026-12-25 … 2027-01-06 (13 consecutive
days in Rajab, where two adjacent cells merged into one token) and 2027-02-10, 02-11, 02-22. No cell
was synthesised; nothing was interpolated.

### 2.3 The recipe on the second year

The 1447 recipe, unchanged, at Alger 36.7538 / 3.0588, printed clock UTC+1:

`fajr 17.80 +0 floor · sunrise +1 floor · dhuhr +1 floor · asr Shafi +1 floor · maghrib +4 floor ·
isha 17.00 +0 ceil`

| Column | Exact | Within 1 | Worst |
| --- | ---: | ---: | ---: |
| fajr | 175/219 (79.9 pc) | **219/219** | 1 |
| sunrise | 208/219 (95.0 pc) | **219/219** | 1 |
| dhuhr | 215/219 (98.2 pc) | **219/219** | 1 |
| asr | 100/219 (45.7 pc) | **219/219** | 1 |
| maghrib | 202/219 (92.2 pc) | **219/219** | 1 |
| isha | 194/219 (88.6 pc) | **219/219** | 1 |

Every one of the eight months is perfect within one minute on its own
(`fit/dz48-fit.json` → `site.isha1700.perMonth`). The implied point (36.7838 / 3.0488) scores the
same within-1 with a slightly higher exact count on fajr (183) and maghrib (208).

**The isha re-parameterisation is confirmed on the second year, not just the 1448 holdout.** The
frozen `16.10 / +5 nearest` description scores isha 102/219 exact, 185/219 within-1, worst 2, and it
misses the same winter months it missed in 1447. The `17.00 / 0 ceil` description scores 194/219 exact
and 219/219 within-1. The ministry prints one curve; `17.00/0 ceil` is its faithful description.

### 2.4 Span and seasonal amplitude

219 verified days spanning 2026-07-16 … 2027-06-05 (351 calendar days of the Hijri year, 16 withheld).
Printed over those days: **fajr spans 169 minutes** (03:40 … 06:29) and **isha spans 166 minutes**
(19:00 … 21:46). The near-identity of the two spans is the signature of a symmetric twilight pair
(17.8 in, 17.0 the other, one degree of angle being worth ~4-5 minutes), and the magnitude is what a
36.75°N site must show. Confidence therefore reads in both dimensions: a large annual swing,
reproduced with zero drift between the two Hijri years.

### 2.5 Algeria's verdict

- **Second complete Hijri year on one recipe**: 1447 (three wilayas, 354 days each) and 1448 (Alger,
  219 verified days across eight months including both equinoxes and the June solstice). The
  between-year test is a recomputed year, not a reprint: the two books' same-cell drift reproduces
  adhan's own drift to ≤0.36 minutes (O1l-17r), and the 1448 book is internally consistent with the
  same margins.
- **Winter solstice coverage is partial**: the 13 withheld Rajab days straddle the solstice, leaving
  2026-12-11 … 2026-12-24 verified on the winter side. The isha winter behaviour is nonetheless
  exercised by Rajab's first 14 days and by Ramadan's 27.
- **Grade**: A stands on the two-year rule with the deficit stated (219 of 354 days of the second
  year, one wilaya of three).

### 2.6 Algeria's residue

- marw.gov.dz unreachable all session (timeouts from this host, repeated).
- No 1448 book for Adrar or Djelfa, and no 1449/2027 edition anywhere in the archive.
- The ministry's live feed, if it exists, was not reachable; the Wayback copy is the only route that
  worked and is what was transcribed.

---

## 3. Tunisia: 2027 closed, December 2026 served, and a record correction on the twilight branch

### 3.1 The two boundary probes

| Probe | Result |
| --- | --- |
| `…/horaire_gouvernorat/2026-12-31/348/621` | 200, a full row (Sousse 05:43 12:24 15:04 17:27 18:45) |
| `…/2027-01-01/348/621` | 200, `{"data":null}` |
| `…/2027-01-15/348/621` | 200, `{"data":null}` |
| `…/2027-06-15/348/621` | 200, `{"data":null}` |

The archive still ends at 2026-12-31. **2027 delegations do not exist**: the endpoint answers, the
calendar is empty, and there is no second cycle to harvest. December 2026, which was the record's
ceiling, is now fully served.

### 3.2 What was banked

Six sweeps, 1,155 requests, **1,102 dated rows across 36 dates (2024-12-16 … 2026-12-31)**, 49
delegations: the 22 Kairouan and Sidi Bouzid delegations, 22 governorate capitals, and three controls. Raw in `captures/tn-*.jsonl`, residuals in `data/tn-*.json`, angle fits in
`fit/tn-twilight-shift.json`.

### 3.3 The finding: a permanent twilight-angle normalisation, not a dip window

The record's rule form `TN-INM-FLAT2026` says 20 Kairouan/Sidi Bouzid delegations **drop the DEM
horizon dip** inside a **window 2025-12-15 … 2026-01-15**. Measured on same-calendar-date pairs at
identical published coordinates, both halves of that description are wrong.

Same date, one and two years apart, printed values at identical lat/long:

| Delegation | 2024-12-16 | 2025-12-16 | 2026-12-16 | fajr fit 2025 | fajr fit 2026 |
| --- | --- | --- | --- | ---: | ---: |
| Kairouan/Bou Hajla | 05:49 / 18:42 | 05:49 / 18:42 | **05:51 / 18:40** | 18.35 | **18.00** |
| Kairouan/El Alaa | 05:50 / 18:45 | 05:50 / 18:45 | **05:53 / 18:42** | 18.70 | **18.00** |
| Sidi Bouzid/Sidi Bouzid | 05:50 / 18:46 | 05:50 / 18:46 | **05:53 / 18:43** | 18.55 | **18.00** |
| Sidi Bouzid/Sidi Ali Ben Aoun | 05:50 / 18:48 | 05:50 / 18:48 | 05:50 / 18:48 | 18.70 | 18.70 |
| Sidi Bouzid/Souk Jedid | 05:49 / 18:46 | 05:49 / 18:46 | 05:49 / 18:46 | 18.55 | 18.55 |
| control Sousse | — | — | — | 18.10 | 18.15 |
| control Kasserine | — | — | — | 18.85 | 18.85 |

(fajr / isha, printed; `×` cells are the changed ones)

- **Twenty of the twenty-two delegations moved from a per-delegation twilight angle of 18.25-18.70 to
  exactly 18.00/18.00.** The per-delegation fit residual against 18.00 is 0.00-0.05° in 2026, i.e. a
  single flat line, where 2024 and 2025 needed 18.35-18.70.
- **The change is permanent, not a window.** It is present in July 2026, September 2026, November 2026
  and December 2026 alike.
- **The change is dated between 2025-12-16 and 2026-01-10.** 2024-12-16 and 2025-12-16 are identical
  to the minute; 2026-01-10 is already on the new line; 2025-12-01 and 2025-11-20 are on the old one.
  The record's window start is the change's onset, not a temporary branch.
- **The horizon did not move.** Maghrib and sunrise are unchanged across the boundary (maghrib
  residual 3.2-5.9 min against the 18.0 fit in both eras, per delegation). A dropped dip would have
  moved maghrib; it did not. The branch is the twilight **angle**.
- **Two delegations did not change**: Sidi Ali Ben Aoun (18.70) and Souk Jedid (18.55), both stable
  across 2024, 2025, 2026 winter and summer. They are the exception class, and they are the reason the
  record's "20 delegations" count is right while its mechanism reading is wrong.

**Correction to the record**: rule form `TN-INM-FLAT2026` is an **angle normalisation to 18.00/18.00 at
20 of 22 Kairouan/Sidi Bouzid delegations, effective between 2025-12-16 and 2026-01-10, permanent
through 2026-12-31**, with the horizon untouched. The DEM-dip reading is refuted on the horizon
columns and on the permanence.

### 3.4 Is the normalisation national? No — and the rest of the country is stable

The same-date pairs were repeated on all 22 governorate capitals (`captures/tn-capitals-pair.jsonl`,
88 rows: 2024-12-16, 2025-12-16, 2026-12-16, 2026-06-16):

- **2024-12-16 and 2025-12-16 are identical to the minute at every capital**, fajr and isha alike.
- **2026-12-16 differs by at most one minute at 21 of 22 capitals**, in both directions, which is the
  rounding floor of a recomputed year. Only Sidi Bouzid moves (05:50 → 05:53 fajr, 18:46 → 18:43 isha),
  and that is the normalisation itself.
- Kairouan capital moves with its group (05:50/18:41 → 05:51/18:39), as the group fit predicts.

So the answer to the obvious next question is measured, not assumed: **the 18.00/18.00 normalisation is
local to the 20 Kairouan/Sidi Bouzid delegations, and the rest of Tunisia's national line is unchanged
across the two years.** Two-year stability now stands at capital level for the whole country.

### 3.5 What the dip test cannot resolve, and why

At these inland delegations the DEM dip is 0.02-0.25°, worth ≤1 minute on a 1-minute printed grid, so
a dip-drop and an angle shift are separable only through the horizon columns — which is exactly how
the test above separated them: maghrib is flat, the twilights moved. The dip stays a real parameter for
the high-elevation delegations O1l-18r fitted (0.0316·√m − 0.0999, R² 0.980); it is simply not what
moved here.

---

## 4. Libya: no year-2 surface found, and one trap closed

| Surface | Result |
| --- | --- |
| `muazzin.com` | 200, 9 KB, **a creative agency portfolio** ("We are Creative Technology") — the invention of a name, not the Libyan app. Recorded as a trap |
| `awqaf.gov.ly`, `www.awqaf.gov.ly` | **403** on both hosts (Cloudflare), re-probed today; the widget stays closed unsolved per the rules |
| `mwaqet.net/prayer-times-in-libya.html` | 403 |
| `salaty.net/prayer-time-{benghazi,misrata,sabha}.html` | 200, **today-only rows with seconds** (05:44:00 … 07:12:46), a live calculator, no dated table, no year axis |
| `salattime.net/libya/salat-times.html` | 200, today-class listing |
| `tv.masjidi.app` region JSONs | 12 endpoints, 366 rows each, **no dates and no year field**; the four Libyan tenants are Tripoli ×2, Zawiya, Gharyan and Misrata — **no Benghazi, no Sabha** |
| Wayback for `tv.masjidi.app/upload/json_prayers_times/*` | zero captures |

**Verdict**: Libya stays `SINGLE-CYCLE`. The 366-row widget remains the only fitted channel; no second
year exists on any surface reachable today, and the three named cities gain no authority surface. The
one new fact worth carrying is negative but useful: the masjidi regional tables have no date axis at
all, so they cannot supply year-2 anywhere, not just in Libya.

---

## 5. The Maghreb cross-check: no platform family reproduces a national line

The three national lines and the closest platform families, as published by O1l-59's family finder:

| Country | National line | Platform family | Offset at the national city |
| --- | --- | --- | --- |
| Morocco | 19 / 17, dhuhr +5, asr ~+0.3, per-city horizon term | masjidi Morocco 19.51 / 16.59 | fajr **−2.5** (Jan) … **−3.5** (Jul); isha **−2.0** … **−2.7** |
| Algeria | 18.1 / 17.0, margins +0/+1/+1/+1/+4, isha ceil | masjidi Algeria 18.31 / 16.77 | fajr **−1.1** … **−1.5**; isha **−1.2** … **−1.6** |
| Tunisia | 18.1 / 18.1 + DEM dip (18.0/18.0 at the 20 normalised delegations) | masjidi Tunisia 18.29 / 17.95 | fajr **−0.9** … **−1.3**; isha **−0.7** … **−1.1** |
| Libya | 18.15 −1 / 18.1 +1, +4/+4 | masjidi Libya 18.72 / 17.95 | fajr **−2.8** … **−3.7**; isha **−0.8** … **−1.0** |

Scored against the **printed** rows rather than the idealised pair (`fit/maghreb-crosscheck.json`):

- **Algeria, the 1448 book, 219 days**: masjidi's family gives fajr bias −2.2 (worst 3), isha bias −1.8
  (worst 3), maghrib bias −3.6 (the ministry prints sunset+4, the family carries no margin), asr −0.5
  with 207/219 within 1. The ministry's own recipe scores 219/219 on all six.
- **Tunisia, Kairouan 2026, 20 days**: masjidi's family gives fajr bias −1.4 (11/20 within 1), dhuhr
  −6.8 (INM prints transit+7, the family carries none), asr −0.1 (19/20 within 1).

**Verdict for the fit index**: none of the four families reproduces a Maghreb national line at zero
margins. Tunisia is closest on the twilights (about one minute early on fajr); Morocco and Libya are
2.5-3.7 minutes early on fajr and roughly 1-2.7 early on isha; Algeria sits 1.1-1.8 early. Every
family matches sunrise, dhuhr and maghrib **before margins**, so the divergence is entirely in the
twilight angles plus the national dhuhr/maghrib pads. The Maghreb lines are national objects no
platform carries, which is the same conclusion the o1m masjidi census reached for the neighbouring
countries.

---

## 6. Defects and honest negatives

**Defects found**
1. Morocco's portal 404 body changed length between runs (555 → 153 bytes) while the content did not;
   a payload check, never a status code, is the gate.
2. The old Moroccan month endpoint, archived, **ignores its own `ville`/`mois` query** and serves one
   2012 table for every request — 17 Wayback captures that look like month data and carry none.
3. `horaire-de-priere.ma` prints a Casablanca dhuhr 6-11 minutes **before** UTC transit, which no
   Moroccan recipe produces.
4. `muazzin.com` is a web-design agency, not the Libyan prayer app.
5. masjidi's regional prayer JSONs carry **no date field and no year field**, so they cannot be dated
   from their own payload; any year attached to them is an inference.
6. INM's archive answers 200 with `{"data":null}` for 2027 dates — a 200 that carries no data, the same
   class as the mawaqit trap the round already recorded.

**Honest negatives, by language searched**
- Morocco: `habous.gov.ma` (Arabic/French), Wayback CDX (English), `horaire-de-priere.ma` (French) —
  no 2027 edition, no pre-rebuild month, no December.
- Algeria: `marw.gov.dz` (Arabic/French) unreachable; Wayback CDX (English) holds four books only.
- Tunisia: no 2027 cycle.
- Libya: `awqaf.gov.ly` (Arabic), `muazzin`, `mwaqet`, `salaty`, `salattime` — no dated authority table,
  no year-2, no Benghazi or Sabha surface. Forum and Facebook surfaces were not used as data.

---

## 7. Record corrections and new rows (for the consolidation)

**Corrections**

| # | Record claim | Measured | Evidence |
| --- | --- | --- | --- |
| C1 | `TN-INM-FLAT2026`: 20 Kairouan/Sidi Bouzid delegations drop the DEM horizon dip in a window 2025-12-15 … 2026-01-15 | The branch is an **angle normalisation to 18.00/18.00**, permanent from between 2025-12-16 and 2026-01-10 through 2026-12-31; the horizon columns are unchanged, so no dip moved | `fit/tn-twilight-shift.json`, §3.3 |
| C2 | Morocco's pre-rebuild months are Wayback-only | Wayback holds **no** 2024/2025 month for this portal; the old Hijri endpoint's 17 archived captures serve one static 2012 table and ignore their own query | §1.2, `captures/wb-mo-*` |
| C3 | The 2026-09-20 GMT decree should be tested on a winter month | A winter month cannot discriminate the decree (the old rule printed GMT in winter too); **October 2026 is the discriminating month and it already passed** | §1.3 |
| C4 | Libya's Muazzin channel has a web presence | `muazzin.com` is an unrelated creative agency; no public web surface for the app exists | §4 |
| C5 | (new) masjidi regional prayer JSONs can be dated | They carry **no date and no year field**; dating is an inference, never a payload fact | §4 |

**New rows**

- Algeria: 1448 Alger book, 219 verified dated days, eight months, one recipe, six columns 219/219 within
  one minute. Second Hijri year on one recipe: A with the deficit stated (one wilaya, 219 of 354 days).
- Algeria: `isha 17.00 / 0 ceil` confirmed on the second year (194/219 exact) against the frozen
  `16.10 / +5` (102/219 exact, worst 2).
- Tunisia: 1,102 dated rows on 36 dates, 2024-12-16 … 2026-12-31, 49 delegations, including the
  governorate-capital two-year triple (2024 / 2025 / 2026 on identical dates).
- Tunisia: two-year stability at capital level for 21 of 22 governorates, exact to the minute.
- Maghreb cross-check: four platform families measured against the four national lines, none
  reproducing one at zero margins (offsets in §5).

---

## 8. Files

- `data/dz48-alger.json` — 235 transcribed days, eight months, with page and scale provenance.
- `fit/dz48-fit.json` — the recipe, both isha descriptions, per-month scores, withheld dates, misses.
- `data/dz48-alger-summary.json` — one-page verdict object.
- `fit/tn-twilight-shift.json` — per-delegation 2025 vs 2026 fajr/isha angles, maghrib control.
- `data/tn-res-a.json`, `data/tn-res-b.json`, `data/tn-dec2026-residuals.json` — residual tables.
- `fit/maghreb-crosscheck.json` — family offsets, printed-row scores, geometry rows.
- `fit/wave-summary.json` — the machine-readable verdict object for the consolidation.
- `captures/` — the 1448 Alger PDF, every OCR text by page and scale, the Morocco probe files and the
  Wayback CDX responses, six Tunisia sweep JSONLs (1,155 requests: 1,102 dated rows), the Libyan probes.
- `pages/` — the renders actually OCRed (5x and 6x), 109 MB.
- Scripts: `rows48.py` (render, scale probe, repair rules), `build-dz48.py` (page to dated rows),
  `fit-dz48.js` (recipe and scores), `tn-sweep.py` … `tn-sweep6.py` (the six probes),
  `tn-dec-fit.js` (residuals), `tn-angle.js` (per-delegation angle fits), `crosscheck.js`.

---

## 9. NEXT

1. **Algeria 1448, the four lost months.** Months 1 and 11 are already held from O1l-17r; months 5, 6
   and 8 fail the token-count identity because adjacent cells merge, and no scale from 5x to 8x
   produced a clean stream. The fix is a per-row crop keyed on the printed date anchors, which this
   round could not locate reliably. Recovered, the 1448 year closes at 354 days and the winter
   solstice gap closes with it (`captures/dz-1448-alger-wayback.pdf` is on disk for that wave).
2. **Tunisia 2027** is a watch, not a survey: the endpoint answers `{"data":null}`; re-probe at the
   first week of January 2027.
3. **Morocco December 2026** lands, if at all, at the month boundary; re-probe with the payload check
   and, more usefully, run the decree test on **2027-03-28 … 2027-04-05**, the next window where the
   old rule and the decree disagree.
4. **Tunisia's other 236 delegations** are answered at capital level (section 3.4): unchanged. The
   remaining work is the non-capital delegations of the 21 other governorates, where a local
   normalisation could still hide.
5. **Libya** needs a dated authority surface, not another platform calculator; the awqaf widget stays
   the named route.
