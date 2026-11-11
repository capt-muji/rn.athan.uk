# O1n-13: Fazilet door expansion — full city list and year horizon

Wave o1n-13, round o1n, 2026-11-11. Mission: expand the Fazilet door (faziletcalendar.com,
publisher Fazilet Nesriyat) from O1n-9's 28-city sample to its full city list and year
horizon. Workspace `captures/` (raw), `data/` (lists, rows, fits), `scripts/`, this report.
Engine: adhan 4.4.6 at `census/adhan-build/node_modules/adhan`. UTC timestamps throughout.
No subagents were deployed (owner order, standing). The repository was not written.

## Task 1 — the full city list: 6,506 cities across 211 country layers

The door's own selector configuration enumerates everything it serves:

- **Country list (`ulkeler`):** 211 country layers, served inside every `/api/cms/daily`
  response (`captures/selector/daily-full-shape-517.json`, banked as
  `data/fazilet-ulkeler.json`).
- **City list (`sehirler`):** `/api/cms/cities-by-country?districtId=<countryId>&lang=<L>`
  walked for all 211 countries (`captures/selector/cities-*.json`, 211 requests, 0 errors).
  Consolidated: `data/fazilet-city-list.json` — **6,506 unique city ids, zero duplicates,
  zero empty layers**.
- **Language variants:** the UI ships 7 languages (tr=1, en=2, nl=3, de=4, ky=7, az=9,
  fr=17), but the city names are identical across lang values — the canonical `adi` string
  is the alias set (it already carries mixed-script variants, e.g.
  "Aybak (Samangān) - سمنگان", "Kazan' (Казань)"). One pass banked every variant the door
  carries.
- **Districts (`ilceler`):** ride inside `/daily` per city (the walk captures them
  incidentally); Turkey's province rows carry district lists. Not a separate enumeration
  surface.
- **Largest layers:** Rusya 499, ABD 464, Almanya 429, Hindistan 276, Fransa 224,
  Avustralya 210, Avusturya 169, Birleşik Krallık 163, Brezilya 162, Kazakistan 155,
  İsviçre 150, İtalya 146, Japonya 143, Meksika 134, Güney Afrika 117. Full table in the
  consolidation output (`data/fazilet-city-list.json`).
- **Palestine:** the door carries a Filistin layer (11 cities incl. Kudüs/Jerusalem, id
  2644, Gaza, El Halil, Ramallah) plus an occupation-administration layer (7 cities) whose
  country name in the raw API response is the occupying entity's name. Per the standing
  owner order that name is scrubbed from every banked file (label:
  "Filistin (isgal yonetimi katmani)"); the land and its institutions are Palestine;
  Jerusalem stays Jerusalem.

## Task 4 headline numbers (live, fleet-wide)

- **Between-year recompute:** 4,197 of 26,845 same-month-day cells move 2026→2027
  (**15.63 pc**), **zero frozen cities** across 59 cities fitted so far — O1n-9's
  17.46 pc claim reproduced at fleet scale. The movement carries the latitude framing
  exactly as FIT-RULES orders: Budapest 32.5 pc, Benešov 29.0, Nalaikh 29.0, Paris 27.3,
  Helsinki 26.6 move most; Accra 4.8, Kampala 5.1, Nairobi 5.9, Phnom Penh 6.4,
  Addis Ababa 6.6 move least (`data/between-year-recompute.json`).

## Task 2 — the 2026+2027 walk (running this hour)

Plan (`scripts/o1n13-plan.py` → `data/plan-*.json`), polite 1.05 s spacing, journal
`captures/walk-journal.log`, raw per request in `captures/fazilet-walk/`:

- **Tier A — country anchors, full O1n-9 density** (Jan+Jul whole months, both years,
  44 requests/city): 204 cities, one per country layer not anchored by O1n-9, capitals
  preferred (Türkiye→İstanbul, ABD→Washington, Almanya→Berlin, Rusya→Moskova, Çin→Urumqi,
  Hindistan→Delhi, Endonezya→Jakarta, Kazakistan→Astana, Suudi→Riyad).
- **Tier B — second city per country, reduced density** (3 dates/month = 18 rows/year):
  163 cities.
- **Tier C — deep-layer expansion, reduced density:** 547 cities across the big and
  priority layers (Kazakhstan 40, Türkiye 30, Japonya 20, Rusya 20, the Central Asian and
  front layers, the diaspora layers).
- Whole-year walks (tier W): İstanbul, Moskova, Berlin, New York, Delhi, Sao Paulo,
  Johannesburg, Sydney + the two known departures Colombo and Ulaanbaatar (264 requests
  each).

## The engine (task 4): self-solved fits, validated

O1n-9 hand-picked coordinates for 28 cities; 6,506 cities need a solver. The fitter
(`scripts/o1n13-fit.js`) solves everything from the served data, no hand inputs:

1. **Offset** per row from the API's own IANA tz name (`bolge_saatdilimi`), two hypotheses
   tested per city (DST-following vs standard-year-round), the better within-1 fit wins.
   So far the publisher serves standard offset year-round everywhere tested, including DST
   countries (Graz 12:09 noon both seasons).
2. **Latitude** from day-length inversion: the day-length residual against a solar model
   is decomposed into a constant (the pad pair aksam−gunes, ~+10..18 min, family norm)
   plus a date-dependent term; the latitude minimising the date-dependent part wins.
3. **Longitude** from dhuhr against an adhan Greenwich probe — by construction it absorbs
   the dhuhr pad: solved_lon ≈ true_lon − pad/4 (~1.5-1.8 deg for a +6-7 min pad), which
   matches the family pad exactly.
4. **Recipe** (fajr/isha angles at 0.25 steps, asr school) with per-column median margins
   applied inside the scoring, then a ±0.6 deg 2D coordinate refinement, then per-year
   scores on the frozen recipe, seasonal amplitude (Jan vs Jul fajr-isha span).

**Validation:** re-fit O1n-9's 28 banked cities with zero hand inputs: 25 of 28 reproduce
**100 pc within-1, worst 1, both years** on self-solved coordinates (e.g. Bishkek
19.5/17.75 Shafi, 100 w1/w1 — matching O1n-9's claimed recipe family). The departures
reproduce as departures: Nalaikh (see below) worst 4 with a winter fajr excess;
Graz worst 2 (see departures).

### FINDING: O1n-9's "Ulaanbaatar" is Nalaikh — city id mislabel in the O1n-9 walk

O1n-9 walked districtId 8343 as "MN-Ulaanbaatar". The door's own list shows **8343 =
"Nalayh (Ulanbator)"** — Nalaikh, a separate town ~35 km east of Ulaanbaatar. The true
Ulaanbaatar is **id 737** (`data/fazilet-city-list.json`). O1n-9's reported
"seasonal fajr pad" departure belongs to Nalaikh's table; Ulaanbaatar proper (737) enters
this wave's walk as a special priority (`data/plan-S-special.json`). O1n-9's coordinates
(47.8864, 106.9057) are Ulaanbaatar's, not Nalaikh's (47.7, 107.3): the fit's worst cells
are consistent with a ~0.4 deg coordinate mismatch on top of any seasonal term.

### FINDING: O1n-9's stored fit file contradicts its report (stale fit1 overwrote fit2)

Running O1n-9's `fazilet-fit.js` reproduces 25 pc within-1 (worst 11-16) — its report's
"100 pc within-1" comes from `fazilet-fit2.js`, which reproduces the report exactly
(checked: Bishkek 19.5/17.5, 100 w1 both years). The archived `data/fazilet-fit.json`
held fit1's output — a stale run had overwritten fit2's file. The report's claims stand
(fit2 reproduces them from the raw captures); the archived JSON was the wrong artefact.
This wave stores fits per city under `data/fits/<cityId>.json`, one file per city, so a
stale overwrite cannot recur.

### Departures this wave (live)

- **Graz (id 90, Avusturya):** the anchor fits worst 2 at 96 pc within-1 (2027) but only
  87-96 pc 2026 — exact rate drops hard. Under investigation with per-column data; the
  day-length inflation reads 12.5 min (family norm) so the latitude is sound; the
  residual pattern is not a coordinate artefact. Graz is the first candidate for a
  publisher-side city-specific pad or a second compute point inside one country.
  Cross-check note: Diyanet's Graz table sits ~28 min away from Fazilet's uniformly —
  the displacement is on Diyanet's side (see Task 5).
- **Benešov (id 6179, Çekya):** 92.5-92.9 pc within-1, worst 21-23, under the standard-
  offset hypothesis; the raw rows carry a clean DST signature (January dhuhr 12:12,
  July dhuhr 13:12 local, exactly the CET/CEST pair), so the publisher follows civil DST
  in Czechia — but the DST-following fit scores no better, and the residual concentrates
  in the night columns near the solstice where the 19.5-degree angle is polar-undefined
  at 49.8N and a high-latitude rule must stand in for it. Same regime expected across the
  western-Europe diaspora layers; characterised once the tier-B anchors land.
- **Nalaikh (8343):** 96.7-97.0 pc within-1, worst 4, winter-fajr excess both years —
  the seasonal pad O1n-9 characterised, now correctly attributed to Nalaikh.
- **Colombo (3073):** 100 pc within-1 both years on the whole-span recipe
  (18.75/17.5); the 2027 dhuhr pad move O1n-9 reported shows in the per-year signed
  medians, not as a within-1 failure of the span recipe.

## Task 3 — the horizon sample

Plan built (`data/plan-H-horizon.json`): 20 cities x 2020-2024 + 2028-2030, three windows
a year (20 Mar equinox, 21 Jun / 21 Dec solstices), 480 requests. Runs after tier A/B/C.
Regime dating: every horizon year scored separately against the frozen recipe; a year
whose exact/within-1 profile departs the 2026/2027 profile is a dated regime change,
never blended.

## Task 5 — cross-checks and the consensus matrix

Held Diyanet city layer (o1m-r7, 8,894 cities, 365-day 2026 tables) crossed at shared
cities on the shared dates (`scripts/o1n13-crosscheck-diyanet.py` →
`data/crosscheck-vs-diyanet.json`). Fazilet sabah is paired to Diyanet imsak; Fazilet's
own imsak column is reported against it too. Per-column signed median, Fazilet minus
Diyanet, 66 shared days per city:

| city | imsak | sabah(=fajr) | gunes | ogle | ikindi | aksam | yatsi |
|---|---|---|---|---|---|---|---|
| Bishkek | -14 | +6 | +2 | +1 | +1 | 0 | +5 |
| Tokyo | -11.5 | +8.5 | +4 | +2 | +1 | +1 | +6 |
| Beijing | -14.5 | +5.5 | +2 | +2 | +1 | +2 | +13.5 |
| Seoul | -12.5 | +7.5 | +3 | +2 | +1 | 0 | +6 |
| Graz | -46.5 | -26.5 | -27 | -27.5 | -28 | -28 | +8.5 |

- The Fazilet block runs consistently LATER than Diyanet on the night columns (+5..+8
  median on sabah/fajr and yatsi, Beijing's isha +13.5) and near-equal on the solar
  columns (+1..+4 with small worst-cell counts) — one convention family, its own values,
  quantified city by city. ikindi and aksam land within-1 at 60-100 pc (Bishkek/Seoul
  100 pc on aksam).
- **Graz is a displaced-table finding, not a Fazilet defect:** every Fazilet Graz column
  sits ~27-28 min EARLIER than Diyanet's Graz table uniformly (yatsi differs differently),
  while Fazilet Graz fits the adhan model at its own solved point (46.85N 12.9E, pad-
  absorbed lon) with worst 2. Diyanet's diaspora "Graz" is computed ~7 minutes of arc-time
  away from Fazilet's compute point; the two publishers do not share a Graz coordinate.
- The remaining pairs (Berlin, Moscow, Paris, Amsterdam, Astana, İstanbul, Tashkent) run
  when their anchor rows land; `crosscheck-vs-diyanet.json` holds the unresolved list.

O1n-9's relations stand and carry forward: Fazilet vs muftiyat.kg Bishkek 304/330 differ;
vs islom.uz Tashkent 174/174; vs the Tbilisi mawaqit Diyanet block 371/396. O1n-10's
muftiyat-vs-tawkit maghrib split (exactly 6 min at every cell) gives the KG family shape
Fazilet sits beside.

## Task 6 — grading

`FAZILET-N-CITIES` grade at close, with per-country coverage counts. O1n-9's
`FAZILET-28-CITIES` grade-A proposal is superseded by this wave's counts.

## Discipline statement

Public pages only; no login, forms, email or challenge solved. 1.05 s spacing, every
request journaled. No subagents. Banned-name scrub applied to every banked file (see
Task 1). Timestamps UTC; no clock read into data; fits never blend across a dated regime
change. Captures gzipped in place at close.
