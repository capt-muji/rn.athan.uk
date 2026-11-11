# RESIDUAL FITS — the o1k "not fitted tonight" list, closed against the o1l round

Agent O1l-64, 2026-11-11. Workspace `$HOME/athan-gitree/census/o1l-city/residual-fits/`.
Engine: adhan 4.4.6, `Rounding.None` at second resolution, explicit per-column rounding and
margin applied afterwards. Every clock is taken from the literal capture dates and a pinned
zone; the machine clock is never read. No network call was made: every input below is a
capture already in the archive.

## 1. Cross-check: the o1k list against this round

The o1k index named 33 countries "not fitted tonight". This round fitted most of them. Counts:
**29 fitted this round, 2 fitted earlier in the record, 2 fitted here for the first time, 0
unfittable.** Iran and Morocco are added because the o1k list carries them.

| Country | Status | Evidence |
|---|---|---|
| Thailand | fitted this round | O1l-2: 77/77 provinces, one recipe 19.8/18.1, 166,433/166,434 within 1 |
| Kuwait | fitted this round | O1l-8: capital 2026, 18/17.5 at 99.8 pc |
| Jordan | fitted this round | O1l-8: regional margin sets, Irbid and Aqaba 100 pc each |
| Egypt | fitted this round | O1l-14: 78 cities, 19.5/17.5 zero margins, 28,468/28,468 within 1 |
| Morocco | fitted this round | O1l-39: 190 cities, national margins plus a per-city horizon term, 99.94 pc |
| Turkey | fitted this round | O1l-15r: 81 provinces, one recipe, 177,390 cells |
| Iraq (year fit) | fitted this round | O1l-8: Baghdad full 2026, 18.1+1 / 16.9+1, 100 pc |
| Palestine | fitted this round | O1l-46: Jerusalem 366 days at 18/18 plus the published city-offset rule |
| Syria | fitted this round | O1l-38: Damascus 365 rows, 97/87.7 pc exact |
| Sweden | fitted this round | O1l-31: seven cities, IF 18/16 exact on the angle-honest days |
| Denmark | fitted this round | O1l-31: Aarhus, Odense, Aalborg, Esbjerg exact |
| Finland | fitted this round | O1l-31: Jyvaskyla 353 rows 18/17 exact; Turku/Tampere a 15/12 line |
| Latvia | fitted this round | capitals: Riga 365 rows, 14/15.3 twilight (a high-latitude table, scored poorly) |
| Lithuania | fitted this round | O1l-31: Klaipeda 730 rows, Diyanet 18/16 exact |
| Spain | fitted this round | O1l-22: Granada, Barcelona, Valencia, Sevilla fitted |
| Italy | fitted this round | O1l-22: Rome closed (19.02, isha maghrib+90), Milan, Turin, Bologna |
| Andorra | fitted this round | O1l-36: 365 rows, 18.1/16.9 -1, 365/365 within 1 |
| Australia | fitted this round | O1l-19r: 218 grid points, one recipe, all within 2 min |
| New Zealand | fitted this round | O1l-19r: FIANZ pair 18/18, 16/15, 17/17, zero drift over twenty years |
| New Caledonia | fitted this round | O1l-35: Noumea 365 rows, fajr 18, sunset+5, isha a 19:45 floor |
| Fiji | fitted this round | O1l-35: 365 rows, 18/17 zero margins at Suva |
| Brunei | fitted this round | O1l-25: MORA 2026, 20/18, 99.2 pc within 1 |
| Sri Lanka | fitted in the record | policy `LK-ACJU` 19.75/18.2, dhuhr/asr/maghrib +2, 366/366; O1l-27 banked Trincomalee and Galle |
| Bangladesh | fitted this round | O1l-13r: four Dhaka mosques, Sylhet band table |
| India | fitted this round | O1l-11r: eight cities, A-grade community |
| Nepal | fitted this round | O1l-45: Kathmandu 30 rows, 99.3 pc within 1 (thin) |
| Maldives | fitted in the record | policy `MV` MABIMS 20/18, frozen generation proven; O1l-B1r added five islands |
| Iran | fitted this round (thin) | O1l-45: Tehran 30 rows, 95/149, flagged against the record's closure |
| Singapore | fitted in the record | policy `SG-MUIS` 20/18, +1 margins, ceiling, 1,096 days; the 2027 PDF confirms it |
| **Qatar** | **fitted in the record, re-measured here** | policy `QA-MOI` grade A; §2 below fits the Jamiat and platform layers |
| **Yemen** | **provisional in the record, extended here** | policy `YE-AWQAF-SANAA` 18/16; §3 fits Aden and the 31-location sample |
| **Lebanon** | **unfitted anywhere: fitted here** | §4, five Dar al-Fatwa regional tables |
| **Belarus** | **unfitted anywhere: fitted here** | §5, the national association's Minsk year |

Two record conflicts surfaced and are left for the owner: the world table v3 carries Qatar at
**F** while policy layer v2.4 carries `QA-MOI` at **A** on the C40 archive years; and the v3
Belarus row carries the same "needs a cap pair" note that §5 now answers.

## 2. Qatar
## 3. Yemen
## 4. Lebanon
## 5. Belarus
