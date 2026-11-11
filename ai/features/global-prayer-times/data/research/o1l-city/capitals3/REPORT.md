# O1l-57 last capital gaps

Workspace `$HOME/athan-gitree/census/o1l-city/capitals3/`. Read: `BRIEF.md`, `FIT-RULES.md`, the
O1l-45 block in `CONSOLIDATION.md`. Engine adhan 4.4.6 at `census/adhan-build/node_modules/adhan`,
`Rounding.None`, TZ pinned per country, dates built from literal capture strings, no clock read.
Nothing outside this workspace was touched.

## Headline

**Three of the eight gaps close: Kingston JM, San José CR, Georgetown GY.** New Delhi is ruled
covered on its own coordinates. **Four gaps remain: Palikir, Ngerulmud, Tegucigalpa, Pyongyang.**
Capital count moves 194 covered / 8 gap to **198 covered / 4 gap of 202**.

The largest result is a correction to the O1l-45 platform verdict. **None of the four "broken"
athanpro capital pages was broken.** Three render a correct table on a foreign clock named in the
page's own metadata; the fourth was evaluated in the wrong zone by us.

## The athanpro zone defect (re-probe of the four pages)

Each page carries a `"timezone"` list. Three of the four carry exactly one zone foreign to their
country, and that string is the zone the month table was rendered in. The correction is arithmetic
from the page's own literals, never fitted:

`local = printed + (offset(cityZone) - offset(renderZone))`

Offsets taken from the IANA zones at the literal capture dates.

| Page | City zone | Render zone | Delta | Gate before | Gate after | Recipe | Exact / within-1 |
|---|---|---|---|---|---|---|---|
| Kingston | America/Jamaica (-05:00) | Pacific/Norfolk (+11) | -960 min | 481 | **1** | 18/17 Shafi | 92 / **150 of 150** |
| San José | America/Costa_Rica (-06:00) | America/Los_Angeles (-07:00 Sept) | +60 min | 61 | **1** | 18/17 Shafi | 96 / **150 of 150** |
| Georgetown | America/Guyana (-04:00) | Atlantic/St_Helena (0) | -240 min | 239 | **1** | 18/17 Shafi | 94 / **150 of 150** |
| Colonia | Pacific/Yap (+10) | Pacific/Chuuk (+10) | 0 min | 61 | **1** | 18/17 Shafi | 113 / **150 of 150** |

**Record correction on Colonia.** The O1l-45 block calls it "Colonia/Pohnpei" and evaluated it in
`Pacific/Pohnpei` (+11). Colonia is the capital of **Yap**, at 9.5144 N 138.1292 E, **2,223 km from
Palikir**. The page's own zone list is `Pacific/Chuuk`, `Pacific/Kosrae`, `+10:00` — every Micronesian
zone at +10 and none at +11. Evaluated in `Pacific/Yap` the table passes the gate at 1 minute with no
correction at all. Our zone was wrong, not the page. Colonia is therefore a clean Yap table and is
**not** coverage for Palikir or Pohnpei.

The defect is uniform and nameable: these pages print the correct offset label for the city, then
compute the table in an unrelated zone. `captures/athanpro-reprobe/` holds the fresh captures
(HTTP 200, same `buildId` `owtQHPa50jqHRVjyU4ilT`, still the September month), so the build has not
moved since O1l-45.

## Kingston JM

Two surfaces, both new.

**Platform.** `https://athanpro.com/countries/jamaica/kingston`, 18.0179 N -76.8099, 30 dated rows
2026-09-01..30, weekday agreement 30/30. Corrected as above: gate 1 min, 18/17 Shafi, 150/150
within-1, worst 1, fajr and maghrib 30/30 exact. Tier platform, grade provisional (one cycle).

**Community, the record's question answered.** `https://jamaicaislamiccentre.com/` — the Jamaica
Islamic Centre. Its footer address is **Frasers Content, Frasers Blvd, Spanish Town, Jamaica**, so
**the record's "JIC Spanish Town" is the same body**, not a separate mosque. The site's nav carries a
"Prayer Timetable" item but no such page exists (the linked `?page_id=3557` returns 404); the only
times are a live block on the home page: fajr 04:56, zuhr 11:51, asr 15:07, maghrib 17:31,
isha 18:42.

That block is undated, so I dated it by self-consistency rather than by reading a clock: all five
values reproduce on adhan 4.4.6 at 17.5/17 Shafi within 1 minute on exactly five consecutive days,
2026-11-08..2026-11-12, at Kingston's coordinates. At the Spanish Town address coordinates
(17.9917 N -76.9558) **no day in 2026 reproduces within 1 minute**. The centre publishes Kingston
times under a Spanish Town address. Two defects recorded: the "Jammat" column prints 5 minutes
*before* the adhan column on all five prayers (inverted, and no date reproduces it), and the site's
contact number is a UK line.

**Trap recorded.** `jamaicamuslimcenter.org` is the Jamaica Muslim Center of **Jamaica, Queens, New
York** (85-37 JMC Way, Jamaica NY 11432). Its masjidal widget `masjid_id=z0AW66Lj` serves
`"timezone":"America/New_York"` and its own `masjid_info` names the NY address. Not Jamaica the
country.

## San José CR

**Community, full year.** `https://mawaqit.net/en/m/mezquita-luz-y-fe-mercedes-costa-rica-40002-costa-rica`
— Mezquita Luz y Fe, Merced, 9.93369 N -84.08247, **1.1 km from the San José centre**. Captured
2026-11-11, **365 rows 2026-01-01..2026-12-31, live-page gate PASS on 2026-10-01**.

Recipe **fajr 18, isha 17, Shafi, maghrib +8 min**: 1,788 of 1,825 within-1 (98.0%), worst 2.
Per column within-1: fajr 365, sunrise 365, dhuhr 365, maghrib 365, isha 365; asr 328 (worst 2).
Seasonal amplitude: fajr moves **-36 min** 15 Jan to 15 Jul, isha **+30 min**. Between-year
stability not measurable from one cycle. Grade provisional.

**Platform.** `https://athanpro.com/countries/costa-rica/san-jose`, 30 rows, corrected, 96 exact /
150 within-1, gate 1.

**Traps recorded.** `centro-islamico.com` is the **Centro Cultural Islámico de Madrid** and every
"Noviembre 2026" post pointing at it is Madrid's. The San José mosque itself is the **Mezquita de
Omar**, Av. 41 & C. 31, present only as Facebook `centroculturalmusulmandeC.R`. Luz y Fe is a
second, distinct San José congregation and is the one with a platform tenant.

## Georgetown GY

**CIOG layer closed with evidence, not asserted.** `https://ciog.org/` is live and is the Central
Islamic Organisation of Guyana, but it is a fresh Elementor install (`gmt_offset` -4) with exactly
two pages, `CIOG Front` and `canada2025`, and no prayer content anywhere. Wayback CDX over the whole
domain (400 URLs enumerated, `captures/gy/ciog-cdx.txt`) holds **zero PDFs** and three HTML pages
before 2020, none of them a timetable. The CIOG has not published a timetable on its own domain in
the archived record. Its public surface is Facebook `CIOG786` only.

**Coverage.** `https://athanpro.com/countries/guyana/georgetown`, 6.8045 N -58.1553, 30 rows,
corrected, gate 1, 18/17 Shafi, 94 exact / 150 within-1, worst 1.

**Trap recorded.** `gicmasjid.org` is the Georgetown Islamic Center of Georgetown, **Texas**.

## Palikir FSM — honest negative

Not found under these terms. English and site-scoped terms run: Palikir mosque, Islamic Society of
Micronesia, Pohnpei mosque, Kolonia mosque, Ahmadiyya FSM, `site:mawaqit.net`, `site:masjidal.com`,
`site:masjidbox.com` for Micronesia.

The country's mosque is real and named: **Pohnpei Mosque, Ahmadiyya Muslim Community, Blue Nile
Second Floor, Kolonia, Pohnpei 96941**, 7.4 km from Palikir on the same island. It has no website.
Its only public surfaces are Facebook `ahmadiyyamuslimfsm` and Instagram `islamahmadiyyafsm`, neither
of which renders a dated table anonymously.

No platform tenant exists for Pohnpei. The athanpro Micronesia set is Colonia (Yap), Tofol (Kosrae)
and Weno (Chuuk) only; mawaqit and masjidbox return nothing for the country. The nearest dated
surface is therefore 2,223 km away on Yap, which is a different country-sized distance and is not
offered.

## Ngerulmud PW — honest negative at the capital

The country's only mosque is the **Palau Central Jame Masjid, Main St, Koror**, **23.6 km** from
Ngerulmud, on a different island. Both of its own surfaces are defective:

- `https://www.palaucentralmosque.com/` prints a dated live block (Wed 11 Nov 2026, 1 Jumada al-Thani
  1448): fajr 07:50, zuhr 14:42, asr 17:52, maghrib 20:14, isha 21:44, with "Sunrise At: 9:10 AM".
  True Koror for that date is fajr 04:44, sunrise 05:53, dhuhr 11:47, asr 15:05, maghrib 17:47,
  isha 18:54. No single shift and no recipe reproduces the block: best residual **11 minutes** at a
  +165 minute shift with fajr pinned at the 12 degree edge. It is theme demo data, not a timetable.
- mawaqit tenant `palau-central-mosque-main-st-koror-96940-palau`, 365 rows 2026, gate PASS
  2026-10-01, but a hand-set board with a mid-year regime change: Jan-Mar sunrise 08:13 then 07:33
  (about 2 h late), from May sunrise correct; dhuhr +60/+61 min on 243 of 365; fajr +33..37; asr
  +83..104; isha +70..72. No recipe, no stable offsets.

The country surface that does fit is the held athanpro Koror table (30 rows, 18/17, 100 pc within-1,
O1l-45). **I do not claim Ngerulmud on a 23.6 km transfer to another island.** The parent rules:
accept Koror for Ngerulmud and the count is 199/3, refuse it and the count stands at 198/4.

## Tegucigalpa HN — honest negative

Not found under these terms. Spanish and English terms run: "Centro Islámico de Honduras horario de
oración", "Comunidad Islámica de Honduras Tegucigalpa mezquita", "mezquita Tegucigalpa horario
salah", "horario de oración Tegucigalpa 2026", plus `site:` sweeps of mawaqit, masjidal and
masjidbox for Honduras.

Closed by platform absence: athanpro carries a **Honduras country page with zero city pages**
(confirmed against its sitemap, 2,935 URLs). mawaqit's only Honduras tenant is `CENTRO ISLÁMICO DE
HONDURAS - SAN PEDRO SULA` (Cortés), the other of the country's two mosques and 180 km from the
capital. masjidal and masjidbox return nothing for Honduras.

The capital's body is the **Comunidad Islámica de Honduras / Mezquita Islámica Hondureña**, present
as Facebook `islamenhondurasmezquita` only, with no website and no dated table.

## Tehran — candidate artifact only, not claimed

30 dated rows, September 2026, gate 2 min. Best recipe fajr **17.75** with sunrise, dhuhr and
maghrib all 30/30 within-1 and asr 21/30 (worst 2). Isha is unexplained: it prints maghrib +80..84
minutes and no angle between 10 and 19 degrees reproduces it (best worst 38 min). Recorded as a
**candidate**, the same disposition O1l-45 gave it. **Iran stays closed; nothing here lifts it.**

## New Delhi — ruling, and the count it produces

The page `https://athanpro.com/countries/india/delhi` is at **28.6139 N, 77.2090 E**. Wikipedia's
New Delhi coordinate is **28.6139 N, 77.2089 E** (identical to 10 m); Delhi's is 28.61 N, 77.23 E,
2.1 km east. The page is therefore at **New Delhi's own point**, and no 5 km transfer is involved at
all — the O1l-45 framing of it as "Delhi, 5 km" was the wrong way round.

**Ruling: New Delhi counts as covered**, on its own coordinates, at 104 exact / 150 within-1 of 150,
18/17 Shafi, gate 1 min. The O1l-45 figure of 104/150 reproduces exactly (that column was exact
counts, not within-1).

## Count

| | before | after |
|---|---|---|
| covered | 194 | **198** |
| gap | 8 | **4** |
| total | 202 | 202 |

The 198 = 194 + Kingston + San José + Georgetown + New Delhi. The four gaps are Palikir, Ngerulmud,
Tegucigalpa and Pyongyang. Tehran sits outside the count as a candidate against the record's
closure. Accepting Koror for Ngerulmud would make it 199/3.

## Files

- `captures/athanpro-reprobe/` — 7 fresh athanpro pages (the four re-probes plus Koror, Tehran, Delhi).
- `captures/jm/` — JIC home, the JIC 404 page, the masjidal NY widget and its November JSON.
- `captures/cr/` — mawaqit Luz y Fe.
- `captures/gy/` — ciog.org and the CDX enumeration.
- `captures/pw/` — palaucentralmosque.com, mawaqit Palau.
- `captures/hn/` — athanpro Honduras country page, mawaqit San Pedro Sula.
- `data/` — 4 corrected platform months, the San José mawaqit year, the Koror board, the JIC
  recovered row.
- `tools/` — `gate.js` (solar gate), `deshift.js` (zone correction + fit), `shiftfit.js`,
  `daterecover.js` (dates an undated block), `dayfit.js`, `fityear.js`, plus the inherited
  `athanpro.py` and `harvest.py`.
