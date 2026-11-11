# O1n-16 — Russia and the Caucasus, depth

Wave O1n-16 of round o1n. Workspace `$HOME/athan-gitree/census/o1n/o1n-16-russia/`.
Engine: adhan 4.4.6 (`census/adhan-build/node_modules/adhan`), `Rounding.None`, dates from the
row index (day-of-year, reference frame 2026 unless stated), zone Europe/Moscow for the
republics' western band. Scores are measured after removing the publisher's per-column median
offset. Captures are timestamped in UTC. No subagents deployed (owner order: no grandchildren).

## Status at a glance

| front | state |
| --- | --- |
| Dagestan (Muftiyat RD) | **27 district tables, 9,855 dated rows banked**; recipe solved; two isha forms inside one republic; static year-agnostic edition proven by byte-identical archive |
| Chechnya | see section 2 |
| Ingushetia, KBR, North Ossetia, KChR, Adygea | see later sections |
| Moscow / St Petersburg | see later sections |
| Siberia beyond CDUM | see later sections |
| Bashkortostan retention | see later sections |
| Caucasus trio (AZ / GE / AM) | see later sections |

## 1. Dagestan — muftiyatrd.ru, the Muftiyat's own JSON layer

**The surface.** The Muftiyat of the Republic of Dagestan serves the prayer table at
`http://muftiyatrd.ru/json/namaz/<district>.json`, one file per district, listed by the page
script `sites/all/themes/mytheme/js/namaz_time.js`. 27 files answer 200
(`captures/muftiyatrd_json/`). Each is an array of 365 rows
(`namaz_1`=fajr, `voshod`=sunrise, `namaz_2`=dhuhr, `namaz_3`=asr, `namaz_4`=maghrib,
`namaz_5`=isha), day-indexed with no dates inside; the page JS slices it by the viewer's
current month. Normalised rows: `data/dagestan_muftiyat_rows.json` (9,855 rows).

**The edition is static and year-agnostic.** The Wayback capture of `mahashkala.json` from
2020-11-22 (`captures/muftiyatrd_wb2020_mahashkala.json`) is **byte-identical** to the live
2026-11-12 fetch (44,531 bytes, 365/365 rows equal). The muftiate has served the same table
since at least November 2020, displayed against whatever year opens the page. Reference frame
for the fit is therefore the display year 2026, and per FIT-RULES this is a **candidate**:
dated rows on one edition, no second edition to fit against, and the year identity of the
edition is not printed anywhere in it.

**Recipe (Makhachkala table, 365 days):**

| column | solved | exact | within-1 | worst |
| --- | --- | --- | --- | --- |
| fajr | **17.5 deg** (17.25-17.75 tie band) | 56.2 | 99.5 | 21 |
| sunrise | solar − 2 min | 61.9 | 100 | 1 |
| dhuhr | transit + 5 min | 54.5 | 100 | 1 |
| asr | **Shafi** + 1 median | 25.8 | 74.2 | 2 |
| maghrib | sunset + 4 min | 54.8 | 100 | 2 (one 21-min fault day) |
| isha | **15.0 deg** | 66.3 | 100 | 1 |

The asr residual after the median is a small seasonal term (74 pc within-1, worst 2), the
takdir-correction class already recorded at the Diyanet tier. **This is a different house
recipe from CDUM's 18/17 Hanafi**: Dagestan prays Shafi asr and carries a 15-degree isha.

**Two isha forms inside one republic.** The three southernmost rayon tables — Kurakh, Rutul,
Agul — carry isha = **maghrib + 90 fixed** in every one of the twelve months (internal column
difference: 90 in all 12, range 90..90), while their fajr stays on the 17.5-degree shape.
Every other district's internal isha−maghrib swings seasonally (73..113) as a 15-degree angle
must. The CDUM 2021 edition was a whole-table fixed-interval year; Dagestan runs both forms
side by side in the same edition, by district.

**Faults, all dated:**
- Makhachkala fajr: one −21 min day in April, one +10 min day in November (one-off cell
  faults, not recipe terms).
- Tlyarata: the whole August block is shifted (internal fajr−sunrise −214 min, day length
  719 min for a month whose neighbours read ~741): a corrupted month block in the JSON.
- Shamilkala: maghrib day 358 prints `16:3`, a truncated cell.
- Kizilurt and Rutul: from a certain day on, times print `4:09` without the leading zero
  (formatting fault; values parse).
- Yuzhno-Sukhokumsk: the series is not solvable at its own position (mean within-1 44-60 pc
  at any scanned position), day lengths are self-consistent with the city's own latitude and
  the isha form is the angle form; the table carries an unresolved whole-table shift. Flagged
  unresolved, not fitted.
- Babayurt: sunrise and maghrib columns sit 30-60 pc within-1 at its own position while
  fajr/dhuhr/isha fit; the solar pair reads as a different position's series.

Seasonal amplitude (Makhachkala): fajr→maghrib span 649 min on 1 Jan against 1,053 min on
1 Jul in the table, against the model's 647 / 1,055 — a 406-minute seasonal swing reproduced.

## 2. Chechnya — Grozny

(checked next)
