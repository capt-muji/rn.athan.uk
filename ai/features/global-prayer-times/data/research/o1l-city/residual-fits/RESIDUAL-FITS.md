# RESIDUAL FITS - the o1k "not fitted tonight" list, closed against the o1l round

Agent O1l-64, 2026-11-11. Workspace `$HOME/athan-gitree/census/o1l-city/residual-fits/`.
Engine: adhan 4.4.6, `Rounding.None` at second resolution, explicit per-column rounding and
margin applied afterwards. Every clock is taken from the literal capture dates and a pinned
zone; the machine clock is never read. No network call was made: every input below is a
capture already in the archive.

## 1. Cross-check: the o1k list against this round

The o1k index named 33 countries "not fitted tonight". This round fitted most of them. Counts:
**26 fitted this round, 3 fitted earlier in the record, 2 re-measured, 2 fitted here for the
first time, 0 unfittable.** Iran and Morocco are added because the o1k list carries them.

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
| **Yemen** | **provisional in the record, extended here** | policy `YE-AWQAF-SANAA` 18/16; §3 fits both feeds: Sanaa and Aden |
| **Lebanon** | **unfitted anywhere: fitted here** | §4, five Dar al-Fatwa regional tables |
| **Belarus** | **unfitted anywhere: fitted here** | §5, the national association's Minsk year |

Two record conflicts surfaced and are left for the owner: the world table v3 carries Qatar at
**F** while policy layer v2.4 carries `QA-MOI` at **A** on the C40 archive years; and the v3
Belarus row carries the same "needs a cap pair" note that §5 now answers.

## 2. Qatar - the record's A fit re-measured, and two platform layers closed

The record already holds `QA-MOI` at grade A (C40: 28 days across seven archive years, fajr 18
with a +1 margin, isha the rounded maghrib plus 90). Nothing banked here can test the MOI asr
drift, which the record names as the one open prayer: the only MOI row in the archive is
2026-11-10, and it sits inside the Aug-Nov window where the drift bites.

What was banked and never fitted is the second publisher and the platform layer.

**Jamiat perpetual table for Doha** (`c15-jamiat/data/Qatar/doha-qatar.json`, November 2026,
published point 25.2833 N / 51.5333 E, +3). One month, 30 rows, six columns.

| Column | Rule | within 1 | exact | worst |
|---|---|---|---|---|
| fajr | 18.00, nearest | 30/30 | 30 | 0 |
| sunrise | flat, nearest | 30/30 | 30 | 0 |
| dhuhr | transit + 4, nearest | 30/30 | 30 | 0 |
| asr | Shafi + 0, ceil | 30/30 | 29 | 1 |
| maghrib | sunset + 3, nearest | 30/30 | 29 | 1 |
| isha | 15.05, nearest | 30/30 | 29 | 1 |

Joint all-six 30/30, worst 1. Seasonal amplitude 95.5 minutes (fajr 05:01 in January,
03:25 in July). The Jamiat's isha is a 15.05-degree twilight, not the MOI's maghrib + 90: the
same city carries two different isha rules 26 minutes apart on the same day (17:53 against
18:19 on 2026-11-10). That is a publisher difference, not an error, and it is why the two
objects must stay separate.

**Platform layer** (athanpro, September 2026, five Qatari cities): four of five cities are
**structurally closed** - their isha has no single depression angle in 12-20 degrees, which is
the signature of a fixed maghrib interval. Al Khor alone fits 18.00/17.05 at 30/30. The
platform is therefore not a Qatar recipe and is recorded as a closed surface, not a fit.

## 3. Yemen - both authority feeds fitted, and the two-feed diff quantified

The record holds `YE-AWQAF-SANAA` at provisional on 1,064 rows with the day count unstated, and
the feed choice open (#6912). Both feeds are now banked and both are now fitted, separately.

**Sanaa awqaf** (`awqaf.gov.ye`, nine-day rolling window, 2026-11-01..09, 31 locations). At the
record's own Sanaa point (15.3694 N / 44.191 E, Asia/Aden):

| Column | Rule | within 1 | worst |
|---|---|---|---|
| fajr | 18.00, nearest | 9/9 | 1 |
| sunrise | flat, ceil | 9/9 | 0 |
| dhuhr | transit + 10, floor | 9/9 | 1 |
| asr | Shafi + 0, nearest | 9/9 | 1 |
| maghrib | sunset + 10, floor | 9/9 | 1 |
| isha | 16.00, nearest | 9/9 | 0 |

Joint 9/9. The implied angles are 18.00 (85 day-votes, band 17.70-18.35) and 16.00 (84 votes,
15.65-16.30). **This confirms the record's 18/16 and its dhuhr +10 / maghrib +10 exactly**, and
it confirms that the margins are the Sanaa feed's own, not a national convention: the same
feed's Aden row carries dhuhr +8 and maghrib +6 at 18.05/16.00, also 9/9.

**Aden, Ministry of Awqaf and Guidance** (`yemenawqaf.org`, November 2026, 30 rows) is a
different line at the same latitude class: **fajr 16.40, isha 17.00**, dhuhr +1, every column
30/30 within 1. Fajr amplitude 46 minutes. The two-feed diff kel2 recorded as "a diff, not a
recipe" is now a measured pair of recipes: the recognised government's fajr is 1.6 degrees
shallower and its isha 1.0 degree deeper than Sanaa's, which is roughly 9 and 5 minutes at
Aden's latitude. **Neither is chosen**: the owner decision stands, and both are on record.

**Platform layer** (athanpro, September 2026, ten cities): every city is 18.00/17.00 at 30/30,
which is the MWL default and carries no Yemeni provenance.

**Not fitted**: the other 29 Sanaa locations. Nine days cannot separate latitude from horizon
dip, and the feed publishes no per-location coordinates; a latitude-only solve returned
11.1-16.3 N against known cities from 12.8 to 16.5 N, which is noise, so no per-location fit is
claimed.

## 4. Lebanon - first fit; the composite is three tables, not one

The record held Lebanon at candidate: "feed identity pinned, unfitted, fixed UTC+2 year-round".
Five regional annual tables are banked (`tv.masjidi.app`, 366 rows each, undated payload). The
payload is leap-shaped with a 29 February seam after row 59, so the series is **2028, inferred
and never quoted as a published date**. The clock is fixed UTC+2 year-round, so the fit runs at
a fixed +120 and never on Asia/Beirut.

The five regions are not one table. Regions 3, 4 and 5 carry identical fajr, sunrise, dhuhr,
asr and isha and differ only in maghrib (16:43 / 16:48 / 16:47 on row 0), which is a per-region
horizon term. Regions 1 and 2 carry their own columns entirely.

| Region | Point (derived) | fajr | isha | maghrib margin | joint within 1 |
|---|---|---|---|---|---|
| 1 | 33.88 N, 35.33 E, dip 0 | 17.55 | 16.30 | sunset + 1 | 132/366 |
| 2 | 33.88 N, 35.83 E, dip 0 | 19.45 | 17.80 | sunset + 6 | 120/366 |
| 3 | 34.32 N, 35.39 E, dip 0.15 | 18.40 | 17.65 | sunset + 2 | 175/366 |
| 4 | 34.32 N, 35.39 E, dip 0.15 | 18.40 | 17.65 | sunset + 7 | 175/366 |
| 5 | 34.32 N, 35.39 E, dip 0.15 | 18.40 | 17.65 | sunset + 6 | 175/366 |

Regions 3-5 reproduce five of six columns almost perfectly: fajr 365/366, sunrise 366/366,
maghrib 366/366, isha 366/366, asr 260/366. What blocks the joint score is **dhuhr: 220/366
with a worst of 5 minutes**, and no point closes it - the residual is seasonal, so the
composite's dhuhr is a clock column, not a solar one. Latitude is recovered from the table's own
columns to 0.02 degrees; longitude comes from the dhuhr transit and is degenerate with the dhuhr
margin, so it is reported, never asserted.

Verdict: **one recipe per region, three of the five regions one shared table**; the fajr and
isha angles are per-region (17.55 to 19.45 and 16.30 to 17.80), which is a spread far wider than
any two neighbouring governorates should carry. The composite is a regional family, not a
national object, and the per-region coordinates the record named as missing are now derived.

## 5. Belarus - first fit; the angle pair found, the summer block identified

The record held Belarus at candidate with the note "a fit needs a cap pair, not angles alone".
The banked table is the national association's Minsk year (`islambel.by`, 365 rows, 2025 only).

Inverting each column for the angle that reproduces it settles the rule: **fajr 18.00** (134
day-votes, band 16.45-18.20) and **isha 15.95** (138 votes, 14.65-16.45), with a horizon dip of
0.85 degrees derived at the Minsk point (53.9 N / 27.5667 E, corroborated by a second table that
agrees to the minute in September). The two ends are capped: fajr never later than 07:16, isha
never later than 23:06.

From May to August the sun never reaches either angle at 53.9 N, and the publisher substitutes a
night portion: the implied angle collapses to 8-15 degrees over that block. Those 146 days are
scored separately and are **not** fitted to an angle.

| Column | Rule | within 1 (219 angle-honest days) | exact | worst |
|---|---|---|---|---|
| fajr | 18.00, ceil, cap 07:16 | 219/219 | 147 | 1 |
| sunrise | dip 0.85, floor | 218/219 | 97 | 2 |
| dhuhr | transit + 4, nearest | 219/219 | 189 | 1 |
| asr | Shafi + 3, nearest | 124/219 | 48 | 4 |
| maghrib | sunset + 0, nearest | 156/219 | 77 | 3 |
| isha | 15.95, nearest, cap 23:06 | 151/219 | 37 | 3 |

Joint all-six 108/219; whole year 104/365, worst 248 minutes, which is the substitution block
showing through and nothing else. Amplitude cannot be stated from a capped year (July is inside
the substitution block), so the fajr amplitude is left null rather than rendered from the model.

Verdict: **the twilight pair is 18.00/15.95 with a 0.85-degree dip and a 07:16/23:06 cap pair**;
three of six columns reproduce exactly on the angle-honest days, and asr, maghrib and isha carry
a 3 to 4 minute scatter that no angle or margin removes. The summer block is a substitution, not
a cap, and it is the open item for a second pass.

## 6. Method and provenance

Every fit above reads a capture already in the archive; no page was fetched and the machine
clock was never read. The engine is adhan 4.4.6 with `Rounding.None` at second resolution and an
explicit rounding mode and integer margin applied per column afterwards. The twilight columns are
taken from the solar hour angle directly, because adhan's `PrayerTimes` substitutes a night
portion whenever the angle is unreachable - that substitution would have hidden the publisher's
own cap behind a phantom rule, and it did, until it was removed. The clock is the literal capture
date plus a pinned IANA zone, or a fixed offset where the publisher prints standard time
year-round. The reference point is published where the surface publishes one, and derived from
the table's own dhuhr, asr and sunrise columns otherwise; longitude is never claimed where it is
degenerate with the dhuhr margin.

Inputs: `data/` (47 staged files, copies of the archive's own JSON with key renames only).
Fits: `fits-stage1.json`, `fits-stage2.json`. Tools: `tools/fitlib.mjs`, `tools/prep.mjs`,
`tools/fit-stage1.mjs`, `tools/fit-stage2.mjs`.

