# O1l-50 westafrica2 — West Africa city-level round two (Ghana, Togo, Benin, Burkina Faso, Côte d'Ivoire, Liberia, Sierra Leone, Gambia)

Captured 2026-11-11. Public pages only, no login, no subagents, nothing under /tmp. Raw responses
under `captures/`, dated rows under `data/` and `data/rows/`, fits under `data/fit-*.json`.
Engine: adhan 4.4.6 (`Rounding.None`, `MiddleOfTheNight`), TZ pinned per country, dates built from
literal capture strings, no clock reads.

**Dated rows banked this wave: 7,930** — 7,300 mawaqit mosque-year rows (20 pages x 365, 2026) and
630 monthly rows (21 surfaces x 30, November 2026).

## Method and gates applied to every surface

- **Year alignment (mawaqit).** Each page embeds a 12-month `calendar` with no year label. Every
  page captured here was anchored against its own live display: the five `times` values plus
  `shuruq` equal `calendar[month 11][day 10 or 11]` of the serving year. Anchor verdict, row shape,
  coordinates and live values per page are in `data/anchors.json` (**20 of 20 anchored**). The served
  year is **2026**, which reconfirms the O1k-W6 correction (current-year aligned, not 2027).
- **Leap template.** Every mawaqit payload carries 366 rows (Feb 29 duplicating Mar 1); the filler
  is dropped in normalization, leaving 365.
- **Live-page gate (R5).** Satisfied by the today anchor above for all 20 pages.
- **Byte-identity-vs-default.** All 20 mawaqit grids were hashed. Exactly one collision:
  `bf-ouaga-10yaar` and `bf-ouaga-kanazoe` are byte-identical on fajr/dhuhr/asr/maghrib/isha — one
  computed generation wearing two mosque names, consistent with C20's six-identical-Ouaga finding.
- **Fixed-board detection.** A table whose fajr and maghrib never move across the year is a
  congregation board, not an athan computation. Five pages fail: `togo-lome-zossime`,
  `ci-abidjan-ibrahim`, `ci-abidjan-aghien`, `ci-abidjan-comucip`, `ci-abidjan-cisse` (partial).

---

## GHANA

### Accra — national mosque and second mosques
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| GhanaMasjid directory, Ghana National Mosque (Kawokudi) | ghanamasjid.org (Frappe API `get_masjid_details`) | platform (AlAdhan-computed, mosque-listed) | 30 (Nov 2026) | 2026 |
| GhanaMasjid, Masjid al-Firdaws (Ablekuma) | same | platform | 30 (Nov 2026) | 2026 |
| National Mosque own site, services page | ghananationalmosque.com/services.html | authority | no table; prints **Jumu'ah 13:20 GMT** | — |

- **Fit (National Mosque, 5.5905/-0.1923):** 17.9/17.15 Shafi, asr +1, **180/180 within 1 min**,
  132 exact. Engine: AlAdhan method 3 (MWL 18/17) — the platform computes, the mosque endorses
  nothing. Firdaws: 17.9/17.15, 180/180 within 1.
- **NEW:** a national mosque-directory surface for Ghana with a per-mosque monthly cache
  (`prayer_times_data`, synced 2026-11-07). The national mosque's only own statement is the Jumu'ah
  hour, which is a convention, not a table.
- **Trap:** ghanamasjid.org's "Prayer Schedules" is an **AlAdhan method=3 wrapper**. The detail
  bundle calls `api.aladhan.com/v1/timings/{epoch}?latitude=..&longitude=..&method=3` on cache miss
  and stores the result as `prayer_times_data`. It is a platform computed surface, never a
  mosque-entered table, whatever the directory framing says.
- **Accra second mosques held from the record:** Al-Firdaws and Mountari (mawaqit, 365 rows each).
  This wave adds the national mosque and the directory layer.

### Kumasi
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| Kumasi Central Mosque (GhanaMasjid record 69503i4pht) | ghanamasjid.org/details/69503i4pht | platform (AlAdhan-computed) | 30 (Nov 2026) | 2026 |
| MATW monthly timetable, Kumasi | matwprojectca.org/donate/namaz-timetable/gh/kumasi | community (computed) | 30 (Nov 2026) | 2026 |

- **Fit (Kumasi Central, 6.6997/-1.6130):** 17.9/17.1 Shafi, asr +1, maghrib +1, **180/180 within
  1 min**, 133 exact. MATW Kumasi: 17.85/18.15 Shafi, **180/180 within 1 min**, 26/30 fajr exact —
  the MATW family line, measured, not assumed.
- **NEW:** first dated rows for Kumasi of any kind. Record carried none.
- **Honest negative:** no Kumasi mosque publishes its own table. `mawaqit.net` has no Kumasi page
  (searched EN/FR, `site:` and slug forms); the Central Mosque's Facebook pages carry no timetable.

### Tamale
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| MATW monthly timetable, Tamale | matwprojectca.org/donate/namaz-timetable/gh/tamale | community (computed) | 30 (Nov 2026) | 2026 |

- **NEW:** first dated rows for Tamale. **Negative:** no mosque or council table; Tamale Central
  Mosque has no domain; GhanaMasjid holds no Northern-region record reachable through the public
  listing (the `get_masjids` endpoint ignores `page` and `masjid_region`, returning the same first
  20 alphabetical records on every call, and `get_search_suggestions` returns empty for "tamale").

### Takoradi
- **Honest negative.** No mawaqit page, no GhanaMasjid record, no MATW slug
  (`.../gh/takoradi` = 404; Sekondi-Takoradi absent). Searched EN ("Takoradi mosque prayer
  timetable", "Sekondi-Takoradi"), and the aggregator-only result set (Muslim Pro, IslamicFinder,
  prayer-now) is calculator class, not a city surface.

---

## TOGO

### Lomé — NEW real table (year)
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| Mosquée Al-I'tisam, Lomé (mawaqit) | mawaqit.net/en/m/mosquee-al-i-tisam-lome-99999-togo | community | **365 (2026)** | 2026 |
| Mosquée de Zossimé, Lomé (mawaqit) | mawaqit.net/en/m/mosquee-de-zossime-lome-1896-togo | community | 365 (2026) | 2026 |
| MATW monthly timetable, Lomé | matwprojectca.org/donate/namaz-timetable/tg/lome | community (computed) | 30 (Nov 2026) | 2026 |

- **Fit (Al-I'tisam, 6.2021/1.2126, Africa/Lome):** **17.9/17.1 Shafi, dhuhr +1, 2,102/2,190
  within 1 min; fajr 339/365 exact (worst 1), isha 335/365 exact (worst 1), maghrib 197 exact
  (worst 1)**. Span 365 days, one year. Seasonal amplitude (Jan vs Jul fajr) **24 min**. Verdict:
  genuine sun-tracking athan table, community tier, provisional (one published cycle).
- **NEW:** Lomé's first real table. The record held Sokodé only.
- **Trap — Zossimé is a fixed board.** fajr 04:40 and maghrib 17:50 for all 365 days, dhuhr 12:30
  (= transit + 44 min, a jama'ah convention). Fit collapses: 667/2,190 within 1. Record it as a
  congregation board, never as an athan table.
- **MATW Lomé:** 17.9/18.1 Shafi, **180/180 within 1 min** — the MATW family line measured in three
  cities (Accra 17.9/18.15, Kumasi 17.85/18.15, Lomé 17.9/18.1), computed, never local.

### Kpalimé
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| MATW monthly timetable, Kpalimé | matwprojectca.org/donate/namaz-timetable/tg/kpalime | community (computed) | 30 (Nov 2026) | 2026 |

- **NEW:** first dated rows for Kpalimé. **Negative:** no mosque table. Searched FR ("mosquée
  Kpalimé horaires prière tableau", "calendrier prière UMT", "mosquée centrale Kpalimé") and EN; the
  only returns are calculators (IslamicFinder, Muslim Pro, AlMosaly, al-hamdoulillah, MATW).

### Atakpamé
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| MATW monthly timetable, Atakpamé | matwprojectca.org/donate/namaz-timetable/tg/atakpame | community (computed) | 30 (Nov 2026) | 2026 |

- **NEW:** first dated rows for Atakpamé. **Negative:** no mosque table, no mawaqit page, no own
  domain. FR/EN searched.

---

## BENIN

### Savalou — NEW real table (city not in the record)
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| Mosquée Al-Mu'tîyy, Savalou (mawaqit) | mawaqit.net/en/mosquee-al-mutiyy-aga-bp01-savalou-benin | community | **365 (2026)** | 2026 |

- **Fit (7.8511/1.8972, Africa/Porto-Novo):** **14.9/15.1 Shafi, sunrise +1, dhuhr +1, asr -1,
  2,016/2,190 within 1 min; fajr 332/365 exact (worst 1), isha 330/365 exact (worst 1)**. Seasonal
  amplitude **29 min**. Provisional, one cycle.
- **NEW:** Benin's second dated table and its first outside Cotonou/Gakpé.

### Porto-Novo, Parakou, Natitingou, Cotonou
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| MATW, Porto-Novo | .../bj/porto-novo | community (computed) | 30 | 2026-11 |
| MATW, Parakou | .../bj/parakou | community (computed) | 30 | 2026-11 |
| MATW, Natitingou | .../bj/natitingou | community (computed) | 30 | 2026-11 |
| MATW, Cotonou | .../bj/cotonou | community (computed) | 30 | 2026-11 |

- **NEW:** first dated rows for Porto-Novo, Parakou and Natitingou.
- **Confirms the record's Benin caution.** FIT-INDEX records Benin losing its row: the Gakpé page
  never says Cotonou and its calendar computes 532 km from the page's own pin. Nothing found this
  wave repairs that; the mawaqit Benin set is Gakpé (Cotonou-class), Savalou and Kandi.
- **Honest negatives:** no Porto-Novo, Parakou or Natitingou mosque table. FR and EN searched
  ("mosquée Porto-Novo horaires", "mosquée Parakou horaires de prière", "mosquée Natitingou horaires
  prière", "Union Islamique du Bénin calendrier"). Returns are calculators and tourist pages.

---

## BURKINA FASO

### Ouagadougou — second mosques
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| Mosquée Dubaï Ouaga (mawaqit) | mawaqit.net/en/mosquee-dubai-ouaga-ouagadougou-00226-burkina-faso | community | **365 (2026)** | 2026 |
| Mosquée Aboubacar Kanazoe de Tanghin (mawaqit) | mawaqit.net/en/mosquee-aboubacar-kanazoe-de-tanghin-ouagadougou-11-bp-1613-burkina-faso | community | 365 (2026) | 2026 |
| MSBF | BRC | Mosquée 10 Yaar (mawaqit) | mawaqit.net/en/mosquee-10-yaar-msbf-ouagadougou-1332-ouaga-burkina-faso | community | 365 (2026) | 2026 |
| MATW, Ouagadougou | .../bf/ouagadougou | community (computed) | 30 | 2026-11 |

- **Fit (Dubaï, 12.2830/-1.4606, Africa/Ouagadougou):** **14.9/15.1 Shafi, zero margins,
  2,190/2,190 within 1 min; fajr 343/365 exact, isha 342/365 exact, maghrib 365/365 within 1**.
  Seasonal amplitude **44 min**. The cleanest surface this wave; provisional (one cycle).
- **Fit (Kanazoe and 10 Yaar):** the two grids are **byte-identical** (federation template). Columns
  are mixed: fajr 58 distinct values and maghrib 59 (to the minute), while dhuhr takes **three**
  clock values (12:25, 12:30, 12:45), asr seven and isha nine — the MSBF template rounds three
  columns to 5-minute blocks. Best fit 16.55/17.45 with dhuhr +18, isha worst 23. Record as the
  federation's blocked template, not a failing mosque.
- **Confirms** C20's federation-template finding (six identical Ouaga records) and the +33-class
  dhuhr doctrine question: the block grid is real and it is a **rounded** convention.
- **NEW:** three further Ouagadougou mosques with dated rows, and the template's exact rounding rule.

### Koudougou — recheck
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| MATW, Koudougou | .../bf/koudougou | community (computed) | 30 | 2026-11 |

- **Recheck result: unchanged negative for a mosque table.** No mawaqit page, no own domain; FR
  searched ("Koudougou mosquée horaires prière", "mosquée centrale Koudougou"). MATW gives the first
  dated rows.

### Banfora
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| MATW, Banfora | .../bf/banfora | community (computed) | 30 | 2026-11 |

- **NEW:** first dated rows for Banfora. **Negative:** no mosque table, no mawaqit page.
- **Site check:** `sunna.bf` is live (47 KB home) but `sunna.bf/heuresprieres/` now returns **0
  bytes**; the 2021 printed calendar held from O1k-W6 is not re-servable and no other city calendar
  is linked.

---

## CÔTE D'IVOIRE

### Abidjan — second mosques (nine pages captured, none is a table)
| Surface | URL slug (mawaqit.net/en/m/…) | Dated rows | Verdict |
|---|---|---|---|
| Grande Mosquée de Génie 2000 | mosquee-de-faya-genie-2000-environs-abidjan-00000-cote-divoire | 365 | board, partial |
| Mosquée Cissé Mamadou | mosquee-cisse-mamadou-abidjan-09-bp-1470-abidjan-09-cote-divoire | 365 | board |
| Mosquée noun touré | mosquee-noun-toure-abidjan-01-cote-divoire | 365 | board |
| COMUFA Mosquée Firdaous | comufa-mosquee-firdaous-abidjan-23-bp-145-abidjan-23-cote-divoire | 365 | board |
| Complexe islamique Firad | complexe-islamique-firad-abidjan-00225-cote-divoire | 365 | board |
| Mosquée Sunnite Alhadj Alhousseyné | mosquee-sunnite-alhadj-alhousseyne-abidjan-00225-cote-divoire | 365 | board, partial |
| Mosquée COMUCIP Cité Prestige 2 | mosquee-comucip-cite-prestige-2-abidjan-10000-cote-divoire | 365 | board |
| Mosquée Ibrahim (CMORA) | cmora-abidjan-cote-d-ivoire | 365 | fixed |
| Communauté musulmane d'Aghien | aghien | 365 | fixed |

- **Result: the Abidjan mosque layer is a jama'ah board, not an athan table.** Every page pins dhuhr
  to a clock value (13:00, 13:20, 13:30, 12:45) and several pin fajr and maghrib too. Best fit of the
  nine: Alhousseyné 1,528/2,190 within 1 (isha 246/329 within 4, dhuhr worst 18); worst: Aghien
  858/2,190. Seasonal amplitude at Abidjan is ~19 min on fajr, and the boards do not track it.
- **Confirms the COSIM convention reading.** O1k-W6 measured zouhr/assr printing as fixed
  13:00/16:00 nationally. The mosque platform layer reproduces exactly that: fixed clock dhuhr, fixed
  asr, sun-tracking sunrise. Two independent surfaces, same doctrine.
- **NEW:** nine Abidjan mosques with coordinates and a full year each, and the finding that the
  platform layer is a board. **Negative:** no Abidjan mosque athan table found.

### Bouaké and Yamoussoukro
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| MATW, Bouaké | .../ci/bouake | community (computed) | 30 | 2026-11 |
| MATW, Yamoussoukro | .../ci/yamoussoukro | community (computed) | 30 | 2026-11 |

- **NEW:** first dated rows for both. **Negatives:** no mosque table for either; masjidway's Bouaké
  mosque page (`fr.masjidway.com/masjid/11517/prayer`) returns **503** on every host variant
  (`fr.`, `en.`, bare), so the one platform lead is closed, not empty.

### Korhogo — NEW real table (city not in the record)
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| Mosquée Ihsane, Korhogo (mawaqit) | mawaqit.net/en/m/mosquee-ihsane-korhogo-savanes-korhogo-cote-divoire-1 | community | **365 (2026)** | 2026 |

- **Fit (9.4718/-5.62):** **17.9/17.1 Shafi, sunrise +1, asr +2, 2,005/2,190 within 1; fajr
  338/365 exact (worst 1), isha 341/365 exact (worst 1)**. Seasonal amplitude **35 min**. Genuine
  sun-tracking table, provisional.
- **NEW:** Côte d'Ivoire's first non-Abidjan dated mosque table, and its first athan-class table at
  all (COSIM's own calendar is a fixed-clock print).

---

## LIBERIA

### Monrovia — second month: honest negative
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| MATW monthly timetable, Monrovia | matwprojectca.org/donate/namaz-timetable/lr/monrovia | community (computed) | 30 (Nov 2026) | 2026 |

- **Confirms** the held November bank exactly (fajr 5:19, dhuhr 12:27 on 1 Nov).
- **Second month: closed under these terms.** The page serves the **current month only** and ignores
  `?month=&year=` (returns 01 Nov 2026 again); `/2026-10` is 404. Wayback CDX holds **no** capture of
  the URL on any MATW domain (`matwprojectca.org`, `matwproject.org`, `matwprojectusa.org`,
  `matwproject.org.uk` all empty). A second month requires a dated poll or a revisit after 1 Dec.

---

## SIERRA LEONE

### Freetown — second surface (year)
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| Masjid Al Ansaar, Freetown (mawaqit) | mawaqit.net/en/masjid-al-ansaar-masiaka-yonibana-highway-freetown-sierra-leone | community | **365 (2026)** | 2026 |
| MATW monthly timetable, Freetown | matwprojectca.org/donate/namaz-timetable/sl/freetown | community (computed) | 30 (Nov 2026) | 2026 |

- **Fit (8.4609/-12.6823):** **17.65/16.9 Shafi, asr -2, maghrib +2, 2,149/2,190 within 1 min; fajr
  351/365 exact, isha 335/365 exact, dhuhr 198 exact, all worst 1**; asr worst 2. Seasonal amplitude
  **31 min**. Provisional, one cycle.
- **NEW:** a full athan-class year for Freetown. This is either C26's one passing mawaqit mosque
  banked as a year, or a second one; either way the held record carried no year for Sierra Leone and
  now does. The tier does **not** rise: still a mosque/platform table, and the record's
  "self-described as estimated" caution stands for the community table, not for this one.
- **Negative:** the SL Islamic Web printed 2026 calendar remains image-only at low resolution; its
  Ramadan 2026 Freetown PDF post (`facebook.com/sliwebsl/posts/...1396219135878017/`) returns a
  Facebook **error page (HTTP 400)** anonymously, so the PDF is not retrievable without login.

---

## GAMBIA

### Banjul — second mosque: FOUND (Kombo) and a trap
| Surface | URL | Tier | Dated rows | Years |
|---|---|---|---|---|
| Muhammad AlFatih Mosque, Old Yundum (mawaqit) | mawaqit.net/en/m/muhammad-al-fatih-mosque-old-yundum-gambia | community | **365 (2026)** | 2026 |
| Masjid Anas bin Malik, Koina Kuntaura (mawaqit) | mawaqit.net/en/masjid-anas-bin-malik-koina-kuntaura-gambia | community | **365 (2026)** | 2026 |
| MATW monthly timetable, Banjul | matwprojectca.org/donate/namaz-timetable/gm/banjul | community (computed) | 30 (Nov 2026) | 2026 |
| King Fahd Mosque, Banjul — own site | kingfahdmosque.gm | mosque (own domain) | **none usable** | — |

- **Fit (Old Yundum, 13.3626/-16.6948, Africa/Banjul):** **17.9/17.1 Shafi, zero margins, fajr
  345/365 exact (worst 1), isha 342/365 exact (worst 1), maghrib 183 exact, dhuhr 196 exact, all
  worst 1**. Seasonal amplitude **48 min** (the largest in this wave — 13.4 N). Provisional.
- **Fit (Koina, 13.4747/-13.8633):** 17.9/17.1, **2,094/2,190 within 1 min**, fajr 344/365 exact,
  isha 345 exact, worst 2. Provisional. Note its payload rows carry **seven** values
  (`[imsak, fajr, sunrise, dhuhr, asr, maghrib, isha]`, imsak duplicating fajr); the 6-value mapping
  mis-parses it and collapses the fit to 42/365, so the row shape is load-bearing.
- **NEW:** the Greater Banjul area's first mosque athan table (Old Yundum sits in Kombo, the GSIC
  calendar's own coverage area) and a second Gambian city (Koina, Upper River Region). GSIC's
  monthly images stay the authority surface; these are community.
- **Trap — King Fahd Banjul static template.** The home page prints a "Today Prayers Time" block:
  Fajr 05:49, Sunrise 06:59, Dhuhur 14:00, Ashr 17:00, Maghrib **19:27**, Isya 20:35. Banjul sunset
  on 11 Nov is ~18:39, so the printed maghrib is **~48 min after sunset** and the dhuhr is transit +
  64 min. The block is an unedited theme demo (its neighbour paragraph is lorem ipsum). No timetable
  on About, Contact, Donate or Sermons. Do not read it as a Banjul surface.
- **Negative:** Pipeline Mosque (Serekunda) has only Facebook and news, no dated table (EN searched).

---

## Trap register (this wave)

1. **mawaqit fixed boards.** Zossimé (Lomé), Ibrahim and Aghien (Abidjan): constant fajr and
   maghrib all year. Board, not athan.
2. **Abidjan platform doctrine.** Nine pages, fixed clock dhuhr 12:45–13:30 and fixed asr. Fitting
   them as tables produces worst errors of 30+ min. They confirm COSIM's convention instead.
3. **MSBF blocked template.** Kanazoe and 10 Yaar byte-identical; dhuhr in three clock values, asr
   in seven, isha in nine. Rounding is part of the doctrine.
4. **ghanamasjid.org is an AlAdhan wrapper.** `method=3`, computed on cache miss, cached monthly.
   Platform tier whatever the directory calls it.
5. **King Fahd Banjul static block** with a physically impossible maghrib (see above).
6. **mawaqit search API is key-gated** — `/api/2.0/mosque/search` returns 401 for every parameter
   shape. Discovery ran through the search index and slug patterns instead; a country-wide
   enumeration is not available without the key.
7. **masjidway 503** on all three host variants — a platform outage, not an empty result.
8. **Seven-value mawaqit rows.** Koina's payload carries `[imsak, fajr, sunrise, dhuhr, asr,
   maghrib, isha]`. The 6-value mapping silently shifts every column by one and produces a
   plausible-looking 42/365 fit. Check row length before parsing.

## Data ceiling and forward longevity

- **Ceiling.** Every mawaqit surface serves exactly one rolling year (2026) and no past or future
  year: the payload has no year parameter and no archive. Ceiling = **1 year, 365 rows per mosque**.
  MATW serves one rolling month, no archive. GhanaMasjid serves one rolling month per mosque.
- **Forward longevity.** No surface here is proven-to-2027. All are `stable-across-1-year` at best;
  the year-2 path is a **dated revisit** (mawaqit pages re-serve a re-aligned year; MATW rolls
  monthly), not an endpoint that serves the future.
- **Regime changes.** None dated this wave. The one doctrine boundary found is the fixed-clock dhuhr
  (Abidjan/COSIM, Lomé Zossimé, MSBF blocks): a fit that crosses a mosque's change from board to
  computed table will break there, so board pages are recorded as boards and never fitted.

## Honest negatives, by language

- **English:** Takoradi, Tamale mosque table, Kumasi mosque own table, Ghana national mosque
  timetable, Liberia second month, Pipeline Mosque (Serekunda), masjidal/masjidbox/athanplus presence
  in any of the eight countries (none found).
- **French:** Kpalimé, Atakpamé, Porto-Novo, Parakou, Natitingou, Koudougou, Banfora, Bouaké,
  Yamoussoukro mosque tables; masjidway (503); sunna.bf/heuresprieres (0 bytes).
- **Twi / Ewe / Fon / Bambara / Wolof:** no query produced a mosque timetable. The Ghanaian,
  Togolese and Beninese mosque web presence is English/French-language; local-language searches
  returned only news, video and calculator pages. Recorded as "not found under these terms".

## Files

- `captures/` — 21 mawaqit HTML pages, 20 MATW pages, ghanamasjid API JSON (directory, metadata,
  four mosque details), ghananationalmosque.com (home + services), kingfahdmosque.gm (home + 4
  pages), sunna.bf, masjidway (503 body), sliwebsl post (Facebook error page).
- `data/rows/mawaqit-*-2026.json` — 20 x 365 dated rows.
- `data/*-2026-11.json` — 21 monthly surfaces x 30 rows.
- `data/fit-*.json` — every fit with recipe, per-column scores, offsets and madhab test.
- `mq.py`, `matw.py`, `conv.py`, `fit.js` — capture, parse, align and fit scripts.
