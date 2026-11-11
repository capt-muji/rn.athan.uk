# O1l-1 Malaysia states (worldwide census, city-level round two)

Agent tag `o1l-1` (workspace `malaysia-states`). Captured 2026-11-11. Public pages only, GET only,
no login, no challenge solved, no contact with any body, no subagents, nothing written outside this
workspace. The repository is untouched.

Mission: state-level coverage beyond the held record for Penang, Johor, Sabah, Sarawak, Negeri
Sembilan, Melaka, Kedah, Perlis, Pahang, Terengganu (Kelantan is held via O1k-K2); the e-Solat 2027
probe; and a fit of the banked Perak 2026 seven-zone tables plus every new table banked here.
Recipes tested: Recipe B = the 2027 federation verdict (fajr 18, isha 18, Shafi asr, zohor +1.5
ONLY, prayers ceil, sunrise floor) against Recipe A = the census margins (+2/-1/+1.5/+2/0/+2).
Engine: adhan 4.4.6 at second resolution, Rounding.None, TZ pinned +8, dates from literal capture
strings, no clock read. Each table's own reference point is recovered from the table (longitude
from zohor median, latitude golden-section on the other five fields) — the method O1k-M2 validated
against Lampiran B to 0.03 deg on six of seven checked zones. Raw output of every figure below is
in `numbers.txt` and `data/fit-results.json`.

## 1. The Perak fit (banked O1k-M2 data, copied read-only)

7 zones x 365 days (2,555 rows), Jabatan Mufti Negeri Perak annual PDFs, 2026 only. Points
recovered: zon1 4.138/101.057, zon2 4.586/100.705, zon3 5.229/100.856, zon4 5.480/101.203,
zon5 4.139/100.515, zon6 5.120/100.354, zon7 4.905/100.783.

Verdict per zone (exact/365, Recipe B; the same column under Recipe A in parentheses):

| Zone | fajr | syuruk | zohor | asar | maghrib | isyak |
| --- | --- | --- | --- | --- | --- | --- |
| zon1 | 331 (A 0) | 3, w1 228 | 357 (357) | 262 (A 0) | 330 (330) | 333 (A 0) |
| zon2 | 340 (A 0) | 0, w1 37 | 355 (355) | 254 (A 0) | 334 (334) | 349 (A 0) |
| zon3 | 265 (A 0) | 0, w1 231 | 360 (360) | 252 (A 0) | 274 (274) | 255 (A 0) |
| zon4 | 306 (A 0) | 0, w1 276 | 355 (355) | 263 (A 0) | 322 (322) | 319 (A 0) |
| zon5 | 330 (A 0) | 0, w1 44 | 358 (358) | 267 (A 0) | 332 (332) | 319 (A 0) |
| zon6 | 341 (A 0) | 0, w1 214 | 359 (359) | 253 (A 0) | 346 (346) | 335 (A 0) |
| zon7 | 338 (A 0) | 0, w1 0 | 359 (359) | 254 (A 0) | 0 (0) | 331 (A 0) |

**The census +2 margins score ZERO exact days on every Perak zone on fajr, asar and isyak**
(worst -3: the printed values sit ~2 min earlier than a +2 recipe). **Recipe B reproduces Perak**:
fajr 265-341, asar 252-267, maghrib 274-346, isyak 255-349 exact, everything within 1 except the
syuruk multipoint column; zohor 355-360 exact at +1.5. The 2027 federation verdict (zohor +1.5
ONLY-ceil) is CONFIRMED on Perak's own state-mufti tables — a second publisher, one year, so
provisional-grade evidence for the Perak line; between-year stability not testable (no 2027 Perak
table published; only a coordination-workshop notice, re-verified this session).

**NEW FINDING (zon7 = Bukit Larut, an elevation term).** Zon7's terbit and maghrib columns sit
symmetrically off the zone point by -5.9 and +5.6 min, month-invariant to +-0.5 min (day-length
residual +10.97 to +12.11 min through the year, lowest at equinox). A latitude move is REFUTED —
the equinox day also runs +11 min, and no latitude shift lengthens the equinox day. This is a
horizon/elevation term (implied dip about 1.4 deg, larger than Bukit Larut's ~1,035 m station
height explains under the sqrt rule; not derivable from public data). The other four columns are
plain 18/18 at the zone point. The Tunisia Gafsa elevation-ladder class (O1k-T1) thus appears in
Malaysia: Perak publishes Bukit Larut as a zone NAMED for the hill and gives its sun-up/sun-down
columns the horizon dip while leaving zohor, subuh, asar and isyak at standard geometry.
Syuruk elsewhere in Perak follows the national multipoint rule (zon1's eastern point +0.54 deg,
already on the O1k-M2 record).

## 2. The e-Solat probes

- **2027 probe (the dated watch):** `GET /index.php?r=esolatApi/takwimsolat&period=year&zone=WLY01&year=2027`
  at 2026-11-11 03:00 UTC. **HTTP 200, application/json, 77,257 bytes**, first bytes:
  `{"prayerTime":[{"hijri":"1447-07-11","date":"01-Jan-2026",...` — **the year parameter is
  silently ignored; the feed still serves the running year only.** Raw: `captures/esolat-2027-probe.json`.
- **Negeri Sembilan gap fill (NEW):** the held `my-jakim-2026-all-zones.json` carries 57 zones and
  contains **no NGS zone at all** — the O1k-M2 sweep missed the state. Probed `zone=NGS01` and
  `zone=NGS02`: **both serve full-year 2026 (365 rows each, HTTP 200)**. Banked as
  `data/my-esolat-2026-ngs01.json`/`ngs02.json`, 730 new dated rows. **The JAKIM federation surface
  is 59 zones, not 57.**
- **JAKIM 2028 takwim already published** (dated-watch note): `portalassets/files/TAKWIM 2028
  MILADIAH - DISAHKAN JAKIM.pdf` serves HTTP 200 (1 page, 164,693 bytes) — a Hijri-Miladi date
  grid only ("TAKWIM 2028 MILADIAH / 1449 - 1450 HIJRIAH BAGI MALAYSIA"), no prayer times. The
  calendar is out two years early while the feed still serves 2026.

NGS fit (points recovered, Recipe B): NGS01 2.714/102.200, NGS02 2.903/101.919.

| Zone | fajr | syuruk | zohor | asar | maghrib | isyak |
| --- | --- | --- | --- | --- | --- | --- |
| NGS01 | 288 (A 0) | 3, w1 337 | 355 (355) | 250 (A 0) | 292 (292) | 294 (A 0) |
| NGS02 | 310 (A 0) | 29, w1 345 | 351 (351) | 270 (A 0) | 308 (308) | 297 (A 0) |

Recipe B carries NS at the national quality level; census margins score zero exact days on
fajr/asar/isyak. Amplitude (Jan-vs-Jul, Recipe B): fajr 9-10 min, isyak 10-11 min (near-equatorial
framing as FIT-RULES expects).

## 3. State sweep

### Penang — CAPTURED + TWO-YEAR FIT (the round's prize)
- Surface: Jabatan Mufti Negeri Pulau Pinang, `Takwim_2026_2027_1448H.pdf` (authority), 13 pages,
  text layer under a column-order trap (pypdf's reading order interleaves week-columns; the
  parser works from pdfminer coordinates, one day per row). `captures/penang-takwim-1448H.pdf`,
  parser `parse_penang.py`.
- Data: **354 dated rows, 2026-06-17..2027-06-05, zero gaps** (`data/my-penang-2026-2027-grid.json`)
  — the first cross-year state table beyond the held set, spanning both calendar years.
- Fit at the recovered point **5.333/100.163 (Pantai Acheh, Lampiran B's PNG01 point)**:
  - 2026 (198 days): fajr 180, zohor 196, asar 141, maghrib 188, isyak 184 exact; all within 1.
  - 2027 (156 days): fajr 139, zohor 149, asar 112, maghrib 146, isyak 148 exact; all within 1.
  - **Two distinct years on one frozen recipe: the A-grade evidence class for PNG01's state line.**
  - Census margins A: fajr/asar/isyak exact **0** in 2026.
- Defects: one printed typo, **2027-04-04 maghrib 19:23** (neighbours 19:28/19:29; the raw cell
  was re-read and it prints 7:23 — a publisher typo, recorded as printed, worst -5). Syuruk fits
  only 54-62/198,156 exactly: the Bukit Bendera multipoint rule. NOTE: the takwim's own footnote
  says Bukit Bendera syuruk -4 / maghrib +4 min at 813 m, where Lampiran B (on the census record)
  says -3/+3 on subuh, syuruk and dhuha — a print-vs-register delta to reconcile at the owner's
  level; the main zone point fits without the correction.

### Melaka — CAPTURED + TWO-YEAR FIT
- Surface: Jabatan Mufti Melaka annual takwim, `2025-2026M-1447H-compressed.pdf` (authority, via
  the mufti's own taqwim page). Text layer in a 12-block hijri-month grid; later blocks MIRROR
  their column order (subuh left of imsak), so the parser classifies times by VALUE and resolves
  each row's masihi day by weekday plus continuity (`parse_melaka.py`).
- Data: **355 dated rows, 2025-06-27..2026-06-16 (1 Muharram 1447 to 30 Zulhijjah 1447), zero
  gaps, every row weekday-validated** (`data/my-melaka-mufti-2025-2026.json`).
- Fit at the recovered point **2.3986/101.9622**:
  - 2025 (188 days): fajr 178, zohor 181, asar 161, maghrib 176, isyak 173 exact; all within 1.
  - 2026 (167 days): fajr 154, zohor 161, asar 133, maghrib 161, isyak 157 exact; all within 1.
  - Zohor margin check: round(transit + 1.5) at the recovered point = 342/355 exact (355/355
    within 1); the city coordinate needs +2.5 and still scores worse (311). **The federation zohor
    rule (+1.5) transfers; Melaka's own reference point simply sits ~0.28 deg west of the city.**
  - **Two years, one frozen recipe: A-grade evidence class for the Melaka state line.**
  - Census margins A: fajr/asar/isyak exact 0 (2025).
- The 1446H edition (`2024-2025M-1446H-compressed.pdf`, captured) is a wakaf/calendar poster with
  ZERO time cells — honest negative for a third year. The 1448H poster remains image-only
  (already on the my2027 record).

### Perak — FITTED (banked data; section 1), 2026 only, 7 zones.

### Negeri Sembilan — GAP FILLED (e-Solat zones; section 2), 2026, 2 zones, 730 rows.
The state mufti's own site: `/taqwim/` still links only the 2024 image-only zone PDFs (per the
my2027 record; re-verified via search this session — nothing newer served).

### Johor — SURFACES ONLY, no rows
- Jabatan Mufti Johor takwim download page (captured `johor-mufti-takwim-list.html`) offers three
  2026 poster JPEGs: RUMI/JAWI/Gantung (saved raw, `johor-Takwim_2026_*.jpg`). The RUMI image is a
  poster COVER only (Masjid Bandar Tiram, "Takwim 2026 1447H-1448H") — no table inside. The
  14-page scan on the same page class has no text layer (my2027 record, unchanged).
- MAIJ (`maij.gov.my/waktu-solat/`) and JAINJ (`jainj.johor.gov.my/waktu-solat-negeri-johor/`) are
  e-Solat embeds (today-only). e-Solat JHR01-04 2026 held. 2027: nothing published.

### Kedah — DISTRIBUTION SURFACE ONLY
- JHEAIK (`jheaik.kedah.gov.my/waktu-solat-2/`, captured) embeds seven e-Solat widgets, one per
  Kedah zone (KDH01..KDH07, `solat.php?kod=KDH0x`) — the state's religious department
  distributing JAKIM's zones, no own table, today-only. e-Solat KDH01-07 2026 held. No 2027.

### Perlis — SURFACE CAPTURED, IMAGE-ONLY
- Jabatan Mufti Negeri Perlis publishes its own annual takwim (Phoca Download; license-agree POST
  with a per-session token — negotiated mechanically, no challenge solved). **Takwim 1448H
  captured: `perlis-takwim-1448H.pdf`, 12 pages, 67 MB — ZERO text layer (image-only).** The
  1447H edition (86 MB) is the same class. Perlis's own rows are unreachable without OCR; the
  surfaces are saved for a future OCR pass. e-Solat PLS01 2026 held. This is the state whose
  falak council historically computes its own times, so the images are the prize — named and
  banked, not transcribed.

### Sabah — NEGATIVE (infrastructure down state-wide)
- `mufti.sabah.gov.my`: HTTP 500 (re-verified twice). `muis.sabah.gov.my`: "Penyelenggaraan sedang
  dijalankan" (maintenance). `www.sabah.gov.my/solat/` (the state portal's own prayer page):
  HTTP 500. Nothing Sabah-official serves rows today. e-Solat SBH01-09 2026 held.

### Sarawak — NEGATIVE (host dead from every path)
- `muftinegeri.sarawak.gov.my`: curl timeout (25 s, twice) AND agent-browser navigation timeout
  (ERR_CONNECTION_TIMED_OUT) — the host is down, not bot-walled. Sarawak's only dated artifact
  reachable: JAKIM's federal Ramadhan 1447H imsak/berbuka PDF for Sarawak
  (`islam.gov.my/images/ramadhan ALFALAH/Jadual Imsak 2026M/3. SARAWAK.pdf`, captured, RAMADAN-ONLY
  class, imsak/berbuka columns only). e-Solat SWK01-09 2026 held.

### Terengganu — NEGATIVE (WAF-blocked, honestly)
- `mufti.terengganu.gov.my`: HTTP 403 (curl). `ekhutbah.terengganu.gov.my/solat` (the state's own
  prayer page, found via search): **Check Point CloudGuard WAF block** — "Attack blocked by web
  application protection", Incident Id 1ba92b33-3455-4227-90c1-8ace4040704f (agent-browser,
  own session `o1l-malaysia`). Not solved per rules. e-Solat TRG01-04 2026 held.

### Pahang — NEGATIVE (maintenance portal persists)
- `mufti.pahang.gov.my`: serves "PORTAL SEDANG DISELENGGARA" plus a FingerprintJS client-identity
  script (captured `pahang-mufti-home.html`). No content behind it. e-Solat PHG01-07 2026 held.

## 4. What this round does to the record

1. **The census MY-JAKIM margin set is dead on every new table measured**: Perak 7/7 zones, NS
   2/2 zones, Penang, Melaka — fajr/asar/isyak carry NO additive ihtiyati (exact 0 under the +2s,
   worst -3), zohor +1.5 everywhere. The O1k-M2 federation verdict (4th conflict) now has
   state-publisher confirmation from FOUR publishers across 2,015 new dated rows.
2. **Two new multi-year fits at the A-grade evidence class**: Penang 2026+2027 (354 rows) and
   Melaka 2025+2026 (355 rows), each on one frozen recipe at its own recovered point.
3. **Negeri Sembilan exists**: the 57-zone harvest was incomplete; the federation API is 59 zones.
   Any bake reading `my-jakim-2026-all-zones.json` as the whole federation misses NS entirely.
4. **The elevation-ladder rule class reaches Malaysia**: Perak zon7 Bukit Larut's terbit/maghrib
   horizon term (~5.6/5.9 min, month-invariant). A bake of Perak zone 7 needs the term or it
   prints maghrib ~6 min early every day of the year.
5. **Print-typo register grows by one**: Penang 2027-04-04 maghrib 19:23 (should be 19:28),
   recorded as printed.
6. **2028 calendar exists, feed still 2026**: the yearly e-Solat 2027 probe re-verified the
   year-parameter refusal byte-for-byte; JAKIM's DISAHKAN 2028 takwim (dates only) is published.

## 5. Honest negatives, with languages searched

Searches ran in Malay (`jadual waktu solat <negeri> 2026/2027`, `takwim solat <negeri> mufti`,
`jadual waktu solat Sabah 2026 MUIS takwim`, `takwim hijriah dan jadual waktu solat`) via TinyFish
(available and used; 8 state queries) and via the publishers' own pages with curl + a browser UA;
agent-browser ran only for Terengganu and Sarawak with session `o1l-malaysia` (not closed with
--all).

| State | What closed it |
| --- | --- |
| Sabah | mufti host 500, MUIS maintenance, state portal page 500 (all re-probed this session) |
| Sarawak | mufti host connection-timeout on curl AND a real browser; only JAKIM's federal Ramadan artifact reachable |
| Terengganu | mufti 403; ekhutbah prayer page behind Check Point CloudGuard WAF (incident id recorded), unsolved per rules |
| Pahang | maintenance portal + FingerprintJS, no content |
| Johor | poster covers only (saved); scan without text layer; MAIJ/JAINJ are e-Solat embeds |
| Kedah | JHEAIK page is a 7-zone e-Solat widget wall; no own table, no 2027 |
| Perlis | own takwim is image-only (1447H + 1448H both captured raw, 67-86 MB); OCR out of scope this session |
| Melaka 3rd year | 1446H edition is a wakaf poster with zero time cells; 1448H poster image-only |
| Negeri Sembilan own table | still the 2024 image-only zone PDFs; nothing newer served |

## 6. Files

- `captures/` — Penang 1448H grid PDF; Melaka 1447H + 1446H PDFs + mufti page; Perak listing +
  (Perak PDFs live in the my2027 workspace, copied as data); Perlis 1448H PDF (67 MB) + listing;
  Johor 3 poster JPEGs + takwim page; JAKIM Ramadhan Sarawak PDF; JAKIM 2028 takwim PDF; e-Solat
  2027 probe (JSON + headers) and NGS01/NGS02 JSON; the state pages swept (Kedah JHEAIK, Sabah
  portal, Terengganu WAF page, Pahang maintenance page); e-Solat download page.
- `data/` — `my-perak-2026-zon1..7.json` (copied), `my-esolat-2026-ngs01/02.json`,
  `my-penang-2026-2027-grid.json`, `my-melaka-mufti-2025-2026.json`, `fit-results.json`,
  `my-jakim-2026-all-zones.json` (copied reference).
- `fit.mjs` (point recovery + Recipe A/B scoring + seasonal amplitude), `parse_penang.py`,
  `parse_melaka.py`, `norm_esolat.py`, `numbers.txt` (raw fit output).
