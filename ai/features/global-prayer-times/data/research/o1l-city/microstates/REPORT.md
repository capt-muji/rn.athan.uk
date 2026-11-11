# O1l-36 microstates and remaining gaps — European microstates, Gibraltar, Faroe Islands

Agent O1l-36, window 2026-11-11 05:20Z onward. Public pages only, no login, no challenge
solved, no subagents. Every fit: adhan 4.4.6
(`~/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`, TZ pinned per
country through `process.env.TZ`, dates built from the capture's own literals, never the real
clock. Nothing under /tmp. The repository was not touched.

Raw captures in `captures/` (with `MANIFEST.json`: sha256, bytes, capture window), normalised
dated rows in `data/` as `{'YYYY-MM-DD': {fajr, sunrise, dhuhr, asr, maghrib, isha}}`.

**Platform layer actually present here:** mawaqit and masjidway only. masjidal, masjidbox and
the DPT plugin carry no mosque in any of the eight places (checked by site-restricted search
per place). No mawaqit REST access was needed or used: the mosque page embeds the full
12-month grid, and the documented API is 401 without a key.

## Summary

| place | surface held | rows | years | tier | grade |
|---|---|---|---|---|---|
| Andorra | mawaqit, Centre Cultural Islàmic | 365 | 2026 | platform | candidate (new) |
| Malta | mawaqit Birkirkara + mawaqit Bilal + masjidway Paola | 1,460 | 2025, 2026 | platform | community (new, three surfaces) |
| Monaco | none | 0 | - | - | negative |
| Liechtenstein | IGMG Vaduz + IGFL daily line | 396 + 1 | 2026-10 to 2027-10 | platform + clerical | candidate (new) |
| San Marino | mawaqit, Associazione Badr | 365 | 2026 | platform | candidate (new) |
| Gibraltar | masjidway Ibrahim-al-Ibrahim + mawaqit Sunrise Hotel | 1,460 + 365 | 2011, 2014, 2026, 2027 | platform | community (new, 4 years) |
| Faroe Islands | none | 0 | - | - | negative |

**Year resolution.** No mawaqit grid carries a year marker. Every grid below fits its own
capture year at 0.05-0.50 min mean absolute error and the next year at 1.3-1.9, a unique
winner. mawaqit's February always carries 29 day slots; the normaliser used the real 2026
length, so no phantom Feb-29 row entered `data/`.

## ANDORRA

| source | URL | tier | dated rows | years |
|---|---|---|---|---|
| Centre Cultural Islàmic d'Andorra la Vella (mawaqit) | `mawaqit.net/en/m/centre-cultural-islamic-andorra-la-vella-ad500-andorra` | platform (mosque-configured) | 365 | 2026 |

**NEW SURFACE.** The page embeds the whole 12-month grid in its config blob (`calendar`, 12
month objects keyed by day-of-month). The O1k pass read the page as a "calculator embed" and
stopped at today's five values. The grid is anchored: month 11 day 11 equals the page's own
`times` + `shuruq` exactly (06:03 / 07:40 / 12:38 / 15:15 / 17:35 / 19:07). Coordinates
42.5032382, 1.5227984; the config's `timezone` is distrusted and TZ pinned from the
coordinates; jumua 13:30; iqama +5/+10/+5/+5/+5.

Fit over 365 days: fajr **18.1 deg, -1 min** (308/365 exact, 365/365 within 1, absmean 0.16);
isha **16.9 deg, -1** (309 exact, 0.15); sunrise -1 (185 exact, 0.49); dhuhr 0 (190 exact,
0.48); maghrib 0 (184 exact, 0.50); asr Shafi 0 with the engine's seasonal skew (absmean 1.55,
168/365 within 1); asr Hanafi refuted (11.45). Seasonal amplitude: fajr 06:41 (Jan 15) to
04:23 (Jul 15), **-138 min**; isha 19:20 to 23:27, **+247**.

**Confirms.** The O1k negative stands: no Andorran body and no Andorran mosque publishes a
dated table. This is the platform's computed grid for the mosque's configuration, not a
mosque-printed table, and with one mosque on the platform the byte-identity-vs-default test
cannot be run.

**New.** A platform-tier dated surface where the record held none: 365 rows, one cycle, grade
**candidate**. The mosque layer is one centre: the mawaqit slug (Carrer Terra Vella 17) and the
Instagram-named "Mesquita Baitul Quran" share that address; masjidway lists 0 masjids for
Andorra.

## MALTA

| source | URL | tier | dated rows | years |
|---|---|---|---|---|
| Birkirkara Mosque (mawaqit) | `mawaqit.net/en/m/birkirkara-mosque-slc-1760-birkirkara-malta` | platform (mosque-configured) | 365 | 2026 |
| Bilal Mosque, Msida (mawaqit) | `mawaqit.net/en/m/bilal-mosque-msjd-bll-msida-msd-1364-malta` | platform (mosque-configured) | 365 | 2026 |
| Malta Islamic Center, Paola (masjidway) | `en.masjidway.com/masjid/10635/prayer/MMYYYY` | platform (computed) | 365 | 2026 |

**THE v2.5 "NO FIT" WAS AN ABSENCE, NOT A VERDICT.** Malta left the pack because FIT-INDEX
carried no entry, not because a sweep had failed. Three dated platform surfaces exist. No
Maltese authority and no mosque-printed table was found in Maltese, English or Italian.

**Birkirkara** (35.899751/14.462557): fajr is **18 deg with a fixed 05:13 clock floor**. The
floor binds 213 days (2026-02-25 to 2026-11-18); `max(adhan 18 deg, 05:13)` reproduces
313/365 exact, 365/365 within 1, absmean 0.14. Isha 17.1 deg -1 (0.48); sunrise +1 (1.39);
dhuhr -2 (0.43); maghrib -3 (0.78); asr Shafi 0 (0.71). Amplitude: fajr -28 only (the floor
clips it), isha +201.

**Bilal** (35.898454/14.490011): fajr 18.0 (0.28), isha 17.1 -1 (0.37), sunrise +1 (1.38),
dhuhr -2 (0.27), maghrib -3 (0.44), asr Shafi 0 (0.52). Amplitude fajr -90, isha +201. The two
grids are not byte-identical (fajr differs on 214 rows, the other columns on 24-32), so neither
is a platform default wearing a mosque name; the +1/-3 sunrise-maghrib pair is a shared Malta
computation, not a mosque choice.

**Paola** (35.876023/14.508819), the Mariam Al-Batool complex, runs masjidway's computed table:
fajr 17.9 (0.07, 341 exact), isha 16.9 -1 (0.11, 324 exact), sunrise 0 (0.47), dhuhr -1
(0.50), maghrib -1 (0.50), asr Shafi 0 (0.57); amplitude fajr -90, isha +201. Its solar model
differs from mawaqit's by 1-2 min per column, so Malta carries **two distinct platform
engines**, not one table twice.

The masjidway series is walkable backwards: the 2025 year was harvested whole and fits the same
recipe (fajr 17.9, 341 exact, 0.07; isha 16.9 -1, 329 exact, 0.10), and 2025 against 2026
differs by 1 min on 240 of 365 rows with 123 identical, so the years are recomputed, not one
table relabelled. **Malta: two fitted years on the Paola surface, one on each mawaqit grid.**

## MONACO

**HONEST NEGATIVE.** No mosque and no recognised Muslim association in the Principality. The
Constitution guarantees worship, but the community has never obtained association status;
Muslims pray in private rooms or cross to Beausoleil, France. Read:
`en.wikipedia.org/wiki/Islam_in_Monaco`; `monaco-hebdo.com` (2023 dossier on worship, and the
report that the rue Pasteur 26 prayer room at Beausoleil is closed); masjidway country page
51135, "There is no masjid in this region" (0 masjids). Languages searched: French, Italian,
English - "horaires de prière Monaco", "mosquée Monaco", "salle de prière", "association
musulmans Monaco", "musulmans de Monaco", "liberté de culte Monaco". Everything dated that
returns is a calculator (Muslim Pro, IslamicFinder, almuslimplus, prieres.date, athanpro), none
a primary surface.

**TRAP RECORDED.** `mawaqit.net/en/m/mosquee-al-haq-escalier-tivoli-beausoleil-06240-monaco` is
Mosquée AL HAQ in Beausoleil, Alpes-Maritimes, **France**. The slug's "monaco" suffix is the
platform's naming, not a country.

## LIECHTENSTEIN

| source | URL | tier | dated rows | years |
|---|---|---|---|---|
| Islamische Gemeinschaft im Fürstentum Liechtenstein (IGFL) | `igfl.li` (home-page block) | clerical (the recognised body) | 1/day, today only | 2026-11-11 |
| IGMG Gebetskalender, Vaduz (LI) | `igmg.org/wp-json/igmg-gebetszeiten/v1/month?city=206&month=YYYY-MM&lang=de` | platform (federation) | 396 | 2026-10-01 to 2027-10-31 |

**NEW SURFACE AND A CROSS-CONFIRMATION.** IGFL renders one dated line server-side ("Vaduz (LI)
11.11.2026 Fajr-Beginn 05:34 S. aufgang 07:12 Dhuhr 12:11 Asr 14:33 Maghrib 17:00 Isha 18:26")
with no archive, no date parameter and no prayer route in its WordPress REST index; the Wayback
CDX for the domain holds no Gebetszeiten page in any year. IGMG's keyless calendar serves the
same day identically to the minute, so the body's widget and the federation's platform are one
data source. IGMG's window is rolling: `min` 2026-10, `max` 2027-11 (396 rows banked; the
2027-11 request returned 503 twice).

The fit splits where the table leaves the angle rule (FIT-RULES: never blend across a regime
change).

- **Angle regime, Sep 1 - Apr 15 (258 rows):** fajr **18.1 deg -1** (206/258 exact, 258/258
  within 1, absmean 0.20); isha 17 deg -6, absmean 1.1, and the 16-18 deg candidates are
  inseparable inside the table's own +-1.5 min noise - **cannot tell**. Sunrise **-7**, dhuhr
  **+5**, asr Shafi **-5**, maghrib **+7**: four Diyanet-family temkin margins, not engine
  error (the solar columns fit to 0.4-1.0 min once the margin is removed).
- **Summer block, Apr 16 - Aug 31:** fajr and isha leave the angles (fajr up to 58 min later
  than 18 deg, isha up to ~30 min earlier than 17 deg at the solstice). The substitution is
  not a fixed night fraction: measured fajr at 0.755-0.881 of the night and isha at
  0.106-0.221 across the block, so neither Seventh (0.857/0.143) nor Middle (0.5/0.5) fits.
  Rule unidentified from the data - **cannot tell**, flagged for the owner.

Amplitude: fajr 06:15 (Jan 15) to 03:39 (Jul 15), **-156**; isha 18:35 to 22:56, **+261**.

## SAN MARINO

| source | URL | tier | dated rows | years |
|---|---|---|---|---|
| Associazione Culturale Badr, Acquaviva (mawaqit) | `mawaqit.net/en/m/associazione-culturale-badr-acquaviva-san-marino-47892-san-marino` | platform (mosque-configured) | 365 | 2026 |

**NEW SURFACE.** 43.9494681, 12.425174; `timezone` field `Europe/San_Marino`, distrusted and
pinned from the coordinates; grid anchored (month 11 day 11 = 05:37/07:00/11:54/14:28/16:48/
18:11 = the page's own today row). Year resolution 2026 (0.18) against 2027 (1.46).

Fit: **fajr 14.9 deg, isha 15.1 deg, zero margins** - a distinctive 15/15-class pair, neither
MWL nor Diyanet. fajr 0.18 absmean, isha 0.19; sunrise 0 (0.48), dhuhr -1 (0.48), maghrib 0
(0.48), asr Shafi 0 (1.74, the engine's asr artefact). Amplitude: fajr 06:17 to 03:56, **-141**;
isha 18:23 to 22:36, **+253**.

masjidway's San Marino page reports 0 masjids, so this is the only platform surface. The Al Nur
association (the country's other body, per sanmarinortv) keeps a prayer room and publishes no
table.

## GIBRALTAR

| source | URL | tier | dated rows | years |
|---|---|---|---|---|
| Ibrahim-al-Ibrahim Mosque (masjidway) | `en.masjidway.com/masjid/12520/prayer/MMYYYY` | platform (computed at the mosque) | 365/year | 2011, 2014, 2026, 2027 |
| Sunrise Hotel mosque (mawaqit) | `mawaqit.net/en/m/mezquita-sunrise-hotel-gibraltar-gx11-1aa-gibraltar` | platform (mosque-configured) | 365 | 2026 |

**TWO SURFACES, ONE RESULT.** Ibrahim-al-Ibrahim (36.1120042, -5.3454668), one recipe across
every year held: fajr **18.1 deg -1**, isha **16.9 deg -1**, sunrise -1, dhuhr -1, maghrib
0/-1, asr Shafi 0.

| year | rows | fajr exact / absmean | isha exact / absmean | sunrise | dhuhr | maghrib | asr Shafi |
|---|---|---|---|---|---|---|---|
| 2011 | 365 | 341 / 0.07 | 320 / 0.12 | -1 (0.44) | -1 (0.47) | 0 (0.47) | 0 (0.62) |
| 2014 | 365 | 343 / 0.06 | 319 / 0.13 | -1 (0.44) | -1 (0.49) | 0 (0.50) | 0 (0.56) |
| 2026 | 365 | 342 / 0.06 | 321 / 0.12 | -1 (0.45) | -1 (0.49) | -1 (0.50) | 0 (0.58) |
| 2027 | 365 | 345 / 0.05 | 330 / 0.10 | -1 (0.46) | -1 (0.48) | 0 (0.49) | 0 (0.56) |

Parameters frozen across 16 years, values recomputed each year. Amplitude fajr 07:01 to 05:30
(**-91**), isha 19:56 to 23:17 (**+201**).

The year series is a genuine recomputation, not one table relabelled: 2011 against 2014 differs
by 1 min on 244 of 365 rows and matches on 114; 2014 against 2026 by 1 min on 130, matches on
233; 2026 against 2027 by 1 min on 224, matches on 134. Seven dates in each cross-decade pair
differ by a full hour purely because the March and October switch dates fall on different days
- cross-year comparison must align DST phase, and those rows are not a defect. **Forward
longevity: proven to 2027-12-31** (the platform serves the whole 2027 year now).

mawaqit's Sunrise Hotel grid (36.1463686, -5.3431374) is an independent second surface: fajr
17.9 (0.05), isha 16.9 -1 (0.10), sunrise -1 (0.49), dhuhr -1 (0.49), maghrib 0 (0.49), asr
Shafi 0 (1.04); amplitude -91/+202.

## FAROE ISLANDS

**HONEST NEGATIVE.** No mosque, no prayer room with a published table, no association site.
The community is a few dozen people organised through a Tórshavn Facebook page (Tórsstova) and
an Ahmadiyya Føroyar Facebook page; the 2011 census counted 23 Muslims. Searched in Faroese
("bønarhús", "bøn", "moska", "muslimar", "felagsskapur", "bønetider"), Danish ("muslimer
Færøerne", "forening", "bønnerum", "moske") and English. mawaqit and masjidway carry no Faroese
entry. Everything dated that returns is a global calculator (Muslim Pro, islamicfinder,
muslimandquran, bigo.tv, islamweb).

## Method notes and traps

- **masjidway's month path clamps.** `prayer/MMYYYY` outside the install's served range returns
  a nearby valid month rather than a 404 (a request for 2089 rendered July 2026 rows). Every
  parsed row was therefore filtered against the requested year and month, so a clamped page
  yields zero rows, never wrong data.
- **masjidway rate-limits hard.** Bursts return 502/503, and the same pages answer a datacenter
  egress with 503 while a residential IP is served. Harvests ran at 3 s spacing with 20-60 s
  backoff; the raw captures of failed attempts were discarded, not parsed.
- **TZ fields distrusted** on every mawaqit config (`Europe/Andorra`, `Europe/Malta`,
  `Europe/San_Marino`, `Europe/Gibraltar`); TZ was pinned from the published coordinates.
- **The asr skew is the engine's.** On every platform grid the Shafi asr column sits at absmean
  0.5-1.7 with a seasonal sign, the documented adhan-vs-PrayTimes-v2 artefact. It is recorded
  with each fit and never repaired by tuning a margin.
