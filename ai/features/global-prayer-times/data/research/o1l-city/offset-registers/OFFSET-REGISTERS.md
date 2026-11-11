# OFFSET REGISTERS — published per-city and per-zone offset tables

O1l-61, 2026-11-11. One table per country: the publisher, the register, its provenance, and
whether the record holds it as data.

The class is the one O1l-46 found for Palestine: a publisher prints one base table and states,
for each named place, how many minutes to add or subtract. Registers of that class already on
the record: Belgium 18 deltas, Slovenia 6 cities, Fiji town ladder, Malaysia Lampiran B zones,
Sri Lanka 13 zones, Mauritius 3 tiers. Registers this file adds: Palestine, Kosovo, Bosnia,
Egypt.

---

## 1. Palestine — Awqaf al-Quds, seven tiers, 29 places

| Field | Value |
|---|---|
| Publisher | Awqaf al-Quds / Dar al-Ifta (Waqf al-Aqsa) |
| Artifact | `captures/ps-awqaf-dahri-2012.pdf`, page 2, printed Arabic prose |
| Base | Jerusalem, on the winter clock as printed |
| Shape | one delta on all six columns |
| Data | `data/palestine-awqaf-alquds-13city.json` |
| Record | NOT held. `JERUSALEM-AWQAF` has `zoneTable: null` |

The print names seven tiers, not thirteen cities: 29 places in bands of 0, -1, +1, +1.5, +2, +3
and +4 minutes. Verbatim, read from page 2 with pypdf:

1. Jerusalem, and with it Ramallah, Bethlehem, Jenin, Nablus, Nazareth, Umm al-Fahm: no difference.
2. Jericho, Tiberias, Safed, Beit She'an: one minute before Jerusalem.
3. Hebron, Idhna, Dura, Beit Awwa, Haifa, Acre, Tulkarem, Kafr Qasim, Tayibe: one minute after.
4. Lodd, Ramla, Qalqilya: one and a half minutes after.
5. Be'er Sheva, Jaffa: two minutes after.
6. Gaza: three minutes after.
7. Rafah, Khan Younis, Deir al-Balah: four minutes after.
8. Eid prayer begins thirty-five minutes after sunrise.

Tier 4 is the only half-minute band, and a whole-minute timetable cannot express it; the print
rounds it per day. O1l-46 independently confirmed the rule against four mawaqit payloads at a
constant integer band (Bethlehem 0 over 207 days, Haifa +1 over 208, Jaffa +2 over 208, Nablus 0
on 349 of 366).

---

## 2. Kosovo — BIK Takvim, seven places

| Field | Value |
|---|---|
| Publisher | Bashkësia Islame e Kosovës, Kryesia |
| Artifact | `captures/xk-takvim-2026-p6.txt`, and the 2025 print, same page |
| Base | the Takvim's own computed column, valid for the whole territory |
| Shape | one delta on all six columns |
| Data | `data/kosovo-bik-7place.json` |
| Record | NOT held as data; carried in prose only, at world-table-v3 "Surface" |

Sharri +2; Ferizaj -1; Gjilani -1; Prishtina -1; Podujeva -1; Vushtrria -1; Presheva -2.
Identical on the 2024, 2025 and 2026 editions. The 2023 print does not carry the list.

Two findings the record should absorb. First, **Prishtina itself is -1 against the base**, so the
printed column is not computed at Pristina, and the record's Pristina anchor is one minute late
for Pristina. Second, the print attributes the deltas to latitude *and elevation*
("gjerësisë gjeografike ose lartësisë mbidetare"), so this is a fused geographic and elevation
ladder, not a longitude ladder.

---

## 3. Bosnia and Herzegovina — Rijaset per-place table, 118 named, 117 measured

| Field | Value |
|---|---|
| Publisher | Islamska zajednica u Bosni i Hercegovini, served by `api.vaktija.ba` |
| Artifact | `captures/ba-lokacije.json`, `data/ba-city-tables-nov.json` (raw API payloads) |
| Base | Banja Luka (the API's id 1) |
| Shape | per-place, per-column integer delta, constant inside a month |
| Data | `data/bosnia-vaktija-places.json` |
| Record | NOT held. `BA-RIJASET` holds ONE elevation rung and says the per-city Delta-t tables are catalogued but not on the board |

118 place names are held complete, and 117 place-months are measured for November 2026, 20 of
those also for June. The API's own id 118 answers HTTP 500 and its name is unknown.

The structure is worth recording. Inside one month the delta is exactly constant across all 30
days, column by column: **all 117 places show zero variance on every column**. It is not one
number per place: Bijeljina runs -9 on fajr and sunrise against -8 on the four later columns.
Between November and June the **dhuhr delta never moves for any place**, while the morning and
evening columns swing in opposite directions: Bratunac fajr -11 in November against -6 in June,
asr -7 against -11; Breza fajr -7 against -1, asr -2 against -8. That is a longitude term on
dhuhr plus a latitude term that reverses across the seasons. Bosnia is therefore a computed
coordinate table wearing an integer face, not a publisher-stated ladder.

The surface rate-limits at roughly one request every few seconds and answers HTTP 429
otherwise; `fetch_ba_slow.py` records the pacing that completed the sweep.

---

## 4. Egypt — ESA city table, 78 cities

| Field | Value |
|---|---|
| Publisher | الهيئة المصرية العامة للمساحة (Egyptian General Authority for Survey) |
| Artifact | `captures/eg-esa-praytimes.html`, `captures/eg-monthly/*.html` |
| Base | Cairo |
| Shape | coordinate table, per column |
| Data | `data/egypt-esa-city-table.json` |
| Record | Partly. `EG-ESA` anchors one point and says "78 city rows inverted"; the rows were never banked |

78 cities on the publisher's own today page, plus per-city monthly tables addressable by city
and month. Read on two dates to separate a coordinate table from a margin: the deltas **move
with season**, so no single integer describes a city. Alexandria fajr +6 in November against 0
in June, isha +4 against +10. Asyut fajr -1 against +12, isha +3 against -11.

Three defects of the surface: four options in the publisher's own selector return an empty table
(منوف, ديرب نجم, ابو تشت, سمالوط); the monthly endpoint has no year parameter; and the minutes are
not zero-padded, so "1:5 م" means 1:05 PM and breaks a naive parser on the noon and asr columns.

---

## 5. Jordan — 16 regional labels, one table (degenerate)

| Field | Value |
|---|---|
| Publisher | وزارة الأوقاف والشؤون والمقدسات الإسلامية |
| Surface | `https://www.awqaf.gov.jo/ar/Pages/PrayerTime`, field `ctl00$MainContent$DropCompany` |
| Shape | 16 labels, ZERO deltas |
| Data | `data/jordan-awqaf-regional-selector.json` |
| Record | `JO-AWQAF` reads as a per-governorate layer; it is not one |

All 16 selector values were posted. Each response echoes its own label as selected and prints
byte-identical times on all 60 cells of the 10-day window. Aqaba and Irbid cannot agree to the
minute in a genuine November table. Jordan is one point with one recipe; the regional layer
carries no time information.

---

## 6. Surfaces probed, no register found

| Country | Surface | Result |
|---|---|---|
| Iraq | `eldwanapp.jeeteak.com/api/prayer-times` | date-addressable, not place-addressable; city params silently ignored |
| Syria | `awqaf.gov.sy` | DNS does not resolve |
| Cyprus (north) | `kktcdinisleri.com/namaz-vakitleri` | one national table, no selector |
| Bahrain | `moj.gov.bh/ar/` | no prayer-times service on the portal |
| Algeria | `marw.dz` | HTTP 504 across four attempts |
| Turkey | `namazvakitleri.diyanet.gov.tr` | 307 ilçe options, each computed, no stated delta |
| Taiwan | `taipeimosque.org.tw`, `islamtaiwan.com` | third-party widget; 20 county pages, no stated delta |
| Mauritius | `jummahmasjid.org` | the llms.txt is gone; five prayer paths 404 |

Detail and evidence for each: `data/negatives.json`.
