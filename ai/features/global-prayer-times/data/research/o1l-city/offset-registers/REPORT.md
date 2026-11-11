# O1l-61 — published offset registers

Session 2026-11-11. Workspace `$HOME/athan-gitree/census/o1l-city/offset-registers/`.
Read first: `../BRIEF.md`, `../FIT-RULES.md`, the O1l-46 block in `../CONSOLIDATION.md`.
The repository was not touched.

## What this job was

The resolver needs every publisher's per-city offset rule. O1l-46 established the class for
Palestine: one printed base table plus a published minute delta per named place. This session
enumerates that class across the countries the mission named, banks each register as JSON, and
records the surfaces that carry none.

## Registers banked

| Country | Publisher | Shape | Rows | Data file | Record held it? |
|---|---|---|---|---|---|
| PS/IL | Awqaf al-Quds, 2012 print p2 | 7 tiers, one delta on all columns | 29 places | `data/palestine-awqaf-alquds-13city.json` | no |
| XK (+Presheva) | BIK Takvim, 2024/2025/2026 p6 | 7 places, one delta on all columns | 7 | `data/kosovo-bik-7place.json` | prose only |
| BA | Rijaset via api.vaktija.ba | per-place, per-column integer, constant within a month | 117 measured of 118 named | `data/bosnia-vaktija-places.json` | one rung only |
| EG | Egyptian General Authority for Survey | per-city coordinate table | 78 | `data/egypt-esa-city-table.json` | point only |
| JO | Jordanian Ministry of Awqaf | 16 labels, zero deltas | 16 labels | `data/jordan-awqaf-regional-selector.json` | misread as a layer |

## The four results that change something

**Palestine: the table is seven tiers, not thirteen cities.** 29 places in bands of 0, -1, +1,
+1.5, +2, +3 and +4 minutes, plus an Eid rule at sunrise + 35. Read verbatim from page 2 of the
2012 print. Tier 4 is the only half-minute band, which a whole-minute timetable cannot express.

**Kosovo: the base is not Pristina.** Prishtina carries -1 against the printed column, so the
Takvim's base is one minute later than Pristina and the record's Pristina anchor is a minute
late for Pristina itself. The print also attributes the deltas to latitude *and elevation*, so
the ladder is fused, not longitudinal. Identical on the 2024, 2025 and 2026 editions.

**Bosnia: a stated-looking integer face over a computed table.** Across 117 places, each holds
a per-column integer delta with zero variance across 30 days, but the delta differs between
columns of the same place, and between November and June the dhuhr delta never moves while the
morning and evening columns swing in opposite directions. That is a longitude term on
dhuhr plus a reversing latitude term. The record must not read Bosnia's place layer as a stated
ladder.

**Jordan: the regional selector is cosmetic.** All 16 labels were posted; each echoes its own
label as selected and prints byte-identical times. Jordan is one point with one recipe.

## Egypt, in more detail

The record's `EG-ESA` says "78 city rows inverted" and anchors one Cairo point. The rows are the
publisher's own today table. They were read on two dates (2026-11-11 and the median of
2026-06-01..30) to test whether the layer is a margin or a coordinate table. It is a coordinate
table: Alexandria fajr +6 in November against 0 in June; Asyut fajr -1 against +12. Banking a
single integer per city would be wrong.

Defects of the surface, all reproduced: four of the publisher's own selector options return an
empty table (منوف, ديرب نجم, ابو تشت, سمالوط); the monthly endpoint has no year parameter; and
the printed minutes are not zero-padded, so "1:5 م" (1:05 PM) silently parses as 1:05 AM and
corrupts the noon and asr columns of any naive reader.

## Honest negatives

| Country | Surface | How it closed |
|---|---|---|
| IQ | `eldwanapp.jeeteak.com/api/prayer-times` | one national table; `city`, `city_id`, `governorate`, `governorate_id` all ignored. `?date=` works, so it is date-addressable only. |
| SY | `awqaf.gov.sy` | DNS does not resolve (curl exit 6), both with and without `www`. |
| CY (north) | `kktcdinisleri.com/namaz-vakitleri` | one Lefkoşa table, no selector, no place delta. |
| BH | `moj.gov.bh/ar/` | no prayer-times service on the portal; the official times live in the iGA app. |
| DZ | `marw.dz` | HTTP 504 across four attempts after a timeout. Algeria's layer is per-wilaya books anyway, already banked. |
| TR | `namazvakitleri.diyanet.gov.tr` | 307 ilçe options, each computed, no stated delta. Measured layer, never published. |
| TW | `taipeimosque.org.tw`, `islamtaiwan.com` | third-party widget; 20 county pages with no stated delta. |
| MU | `jummahmasjid.org` | the llms.txt that carried the tier statement is gone (404); five prayer paths 404. The record's three tiers stay unresolved to town names. |

Search languages: Arabic for JO, EG, IQ, SY, BH, DZ; Turkish for CY and TR; Albanian for XK;
Bosnian/Croatian/Serbian for BA; Traditional Chinese and English for TW; English and French for
MU.

## Blocks and limits

- `api.vaktija.ba` rate-limits hard and answers HTTP 429 "Previše pokušaja" at roughly one
  request every few seconds. The sweep completed at 4-second pacing after two cooldown waits;
  `fetch_ba_slow.py` carries the pacing and the resume logic.
- The Jordan page serves a rolling 10-day window from tomorrow, so only November was observable.
- The Egypt monthly endpoint serves the current year only.
- Nothing here was fitted: this job banks registers and records shapes. Every register carries
  its raw artifact under `captures/`.

## Files

```
OFFSET-REGISTERS.md            one table per country, with provenance
data/palestine-awqaf-alquds-13city.json
data/kosovo-bik-7place.json
data/bosnia-vaktija-places.json
data/egypt-esa-city-table.json
data/jordan-awqaf-regional-selector.json
data/negatives.json
data/eg-esa-cities-today-raw.json      parsed today table, 78 cities
data/eg-esa-monthly-raw.json           per-city June tables, 82 cities
data/eg-esa-deltas-june.json           per-column June medians
data/jo-awqaf-regions-raw.json         16 posted regions, 10 days each
data/ba-city-tables-nov.json           raw API payloads, 117 places, November 2026
data/ba-vaktija-city-tables.json       raw API payloads, 21 places, November and June
fetch_ba_slow.py, fetch_eg.py, fetch_eg_all.py, fetch_jo3.py   the sweep scripts, with the pacing that completed each
captures/                              every raw page, PDF and API payload
```

## Not done

No second witness was sought for the Palestine or Kosovo prints (both are authority artifacts
held whole). The Bosnia place list is complete and 117 of 118 place-months are measured; the
API's own id 118 answers HTTP 500 and its name is unknown. The Algerian, Syrian and Bahraini
layers remain unreachable from a public page this session.
