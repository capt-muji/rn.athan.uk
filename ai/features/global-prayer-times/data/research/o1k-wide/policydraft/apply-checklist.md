# Apply checklist v2.5 (DRAFT)

Ordered apply list for the build session, executed only after the owner answers
`decisions/DECISIONS.md`. Base artifact: `ai/features/global-prayer-times/data/census/policy-layer.v2.4.json`
(read-only tonight). Entry bodies: `v25-objects.json`. Nothing here runs without the owner's rulings.

Order rules: ungated first; then gated, grouped under its decision number; schema additions last.
Dependency note: PK-NIZAM-E-SALAT, SN-CERFI, BE-EMB, NC-NOUMEA and NO-JAMIAT bodies reference
schema fields that section 3 adds, so either apply section 3 first despite its position, or apply
section 3 atomically with step 2.3 in one transaction. The brief's order is preserved below.

## 1. Ungated

1. `JO-AWQAF` field repair: `evidence.fitYears` 0 -> 8, `multiYearProven` false -> true,
   `years` -> [2021..2026], `measuredDays` -> 579, plus the fresh 60/60 mideast replay note.
   Mechanical: the object's own gradeBasis already said "fitYears 8".

## 2. Gated, under the owner's decision number

### D5 - Morocco conditional A (1 change)

1. `MA-HABOUS`: delete the conditional-A gap, rewrite `gradeBasis` to unconditional on the
   ministry's rebuilt portal evidence (`data/horaires-2026-MM.js`, 190 cities, Rabat November
   100 pc within 1), add the portal note. If the owner answers b, apply nothing and record the
   watch.

### D7 - New Zealand Ramadan display (1 change, plus one held)

1. `NZ-FIANZ` amendment (surface restored, per-city pairs, contradiction recorded): applies
   regardless; the contradiction's DISPLAY behavior follows the D7 answer. On a: announced
   date governs, table's own times stand. On c: requires section 3.7 (`editionId`) first.

### D3 - frozen-generation, Belgium (1 change)

1. `BE-EMB`: 17-deg refutation, measured window encode (plateaus + middle arc), year-2 closed
   nominal. Applies with D14 in practice; grouped here because the frozen-reprint finding is
   what the D3 ruling covers. On b or c, re-grade Botswana/Sri Lanka/Maldives the same way
   before touching BE-EMB's evidence block.

### D14 - adopt the night (27 changes)

New objects, in table order (strip `draftProvenance` from each, mint T-669 commentRefs):

1. PK-NIZAM-E-SALAT
2. SN-CERFI
3. ML-ALMADINA
4. GN-NONO (partial)
5. SO-MWAQIT
6. GT-ALDAWA
7. HN-CENTRO-ISLAMICO
8. VE-CARACAS (resolve the ten-city ladder PDF-vs-web conflict at apply: PDF governs)
9. LU-SHOURA
10. BY-ISLAMBEL
11. LV-LIKC
12. LT-MUFTIATE
13. NC-NOUMEA (carries the isha correction)
14. MU-JUMMAH
15. IT-ROMA
16. CH-GENEVA
17. NL-VIN
18. NO-JAMIAT

Amendments: TN-INM (A + rounding fix + verify3 storage bug), OM-MARA (8-year span; the CityID
note lands under D15), IS-FELAG (A, +90 rule dropped), EU-DIYANET-UNIFIED (F-lift), BE-EMB if
not taken at D3, HK-MASJIDAL (withdrawal extended), SE-MOSQUE (mechanism), DJ-COMMUNITY,
WORLD-ROW-DENMARK, WORLD-ROW-IN-PK. Row edits to `world-table-v2.md/json` ride the same gate:
Pakistan FALLBACK -> provisional, Latvia/Lithuania stubs -> data rows, New Caledonia isha line
rewritten, Denmark reading corrected.

### D15 - five mechanical record repairs (1 object change + 4 repairs)

Owner call a applies all five; call b applies 1-2 only.

1. Kyrgyzstan: KG-MUFTIYAT `ishaRule.twilightRatio` wording sign repair (magnitude 7/9 is the
   rule; the census wording flips the sign). Carried here, not in v25-objects.json amendments:
   one field edit.
2. `FIT-RULES.md` placement note: the path two agents were given is recorded as missing.
3. `MY-JAKIM` Kelantan zone correction (the amendment body in v25-objects.json).
4. Benin row: stop claiming a Cotonou table; the capture is Kandi with no publisher
   (world-table row edit; no policy object exists).
5. `OM-MARA` notes: CityID=2 is Adam, not Muscat.

## 3. Schema additions (after the objects, per the brief's order)

Seven additions. Each names the field, the shape, and the objects that use it. All are
PROPOSED shapes for the build session to place in `schemaReconstruction` and `fieldGlossary`.

### 3.1 Clock ladder (and the two-phase federal clock inside it)

```json
"fajrRule.clockSchedule | ishaRule.clockSchedule | dhuhrRule.clockSchedule": {
  "kind": "clockSchedule",
  "gridMinutes": 15,
  "baseRule": { "kind": "angle", "angle": 18 },
  "snapRule": "ceil(isha@18deg + 12.5) to the grid",
  "schedule": [ { "from": "01-01", "to": "04-14", "value": "13:00" } ],
  "switchDates": [ "2026-10-01", "2026-12-20" ],
  "provenance": "..."
}
```
Users: PK-NIZAM-E-SALAT (dhuhr window pair 13:00/13:15 switching 15 Apr/15 Oct; isha quarter
grid, 19 switch dates, one 30-minute drop). GN-NONO's dhuhr 13:45 pin and BY-ISLAMBEL's cap
pair are the degenerate single-window form.

### 3.2 Window grammar (interval pairs; the left bound is the instant)

```json
"windowTable": {
  "class": "intervalPairs",
  "instantBound": "left",
  "columns": {
    "isha": { "leftBase": "maghrib", "leftOffsetMinutes": 90 },
    "dhuhr": { "leftConstant": "13:00", "eras": [ { "until": "2019-06-30", "value": "13:00" } ] }
  },
  "entries": 366
}
```
Users: TJ-SHURO at its next fit (no v2.5 object; the grammar lands for it and for any
window-class consumer). Consumers read the left bound as the instant - the existing
window-class path converts unchanged.

### 3.3 Two-dawn intervals

```json
"fajrRule.dawnPair": {
  "primary": { "base": "sunrise", "offsetMinutes": -75.5 },
  "secondary": { "base": "sunrise", "offsetMinutes": -60.5 },
  "sunriseColumnIsDawn": true
}
```
User: SN-CERFI (Fajar/Suba; the printed "sunrise" column is Suba, missing astronomical sunrise
by up to 51 minutes).

### 3.4 Flat plateaus and substitution windows

```json
"highLatitude.parameters.windows": [
  { "prayer": "isha", "window": "05-01..05-21", "kind": "flat", "value": "23:26" },
  { "prayer": "isha", "window": "05-22..07-25", "kind": "arc", "latitude": 45, "angle": 18 },
  { "prayer": "fajr", "window": "05-31..07-09", "kind": "arc", "latitude": 44.75, "angle": 19.1, "floorClock": "03:24" }
]
```
Users: BE-EMB (measured boundaries), BY-ISLAMBEL (cap pair, unfitted), NL-VIN's clock caps as
the `flat` value type.

### 3.5 Three-group offsets

```json
"offsetGroups": [
  { "members": ["fajr", "sunrise"], "minutes": -x },
  { "members": ["dhuhr"], "minutes": y },
  { "members": ["asr", "maghrib", "isha"], "minutes": z }
]
```
User: Serbia at its next fit (the Devridaim design; no v2.5 object). Read per prayer the table
looks like render damage - that is how the record filed it once.

### 3.6 Elevation-keyed exception set (21/19)

```json
"reference.elevationExceptionSet": {
  "publisher": "Kemenag",
  "keyField": "regency",
  "thresholdMeters": 1786,
  "deltaDegrees": 1.0,
  "twilights": ["fajr", "isha"],
  "members": ["the six regencies at or above 1,786 m in fit10's banked 516-regency table (incl. Paniai); Deiyai at 1,718 m is untouched and is the negative bound"],
  "rule": "publisher policy, never an elevation formula"
}
```
Ships when D8 rules (a: named regional exception; b: flatten). No ID object exists in v2.4 or
in this pack; the addition lands with the schema so the future ID object carries it.

### 3.7 Edition-named surfaces

```json
"editionId": "fiji-widget-2026-12",
"editions": [
  { "editionId": "fiji-widget-2026-12", "surface": "the date-generating widget", "span": "2025-12..2026-12" },
  { "editionId": "fiji-sheet-2025", "surface": "the printed sheet", "span": "year-agnostic months" }
]
```
Users: FJ-FML when D1 rules (a/b/c); NZ-FIANZ if D7 answers c. Fiji is not in this pack's
object list; the addition lands with the schema so D1's ruling applies in one field write.

### 3.8 Builder rule (not schema)

The publisher's engine is part of the recipe: record `engine: PrayTimes-v2 family` in
`emulation` on GT-ALDAWA, HN-CENTRO-ISLAMICO and future platform recipes. A fit anchored on
adhan over-specifies every platform recipe it touches (phantom -1 dhuhr margin, +/-1.2 minute
asr skew on the same rows).

## Post-apply gates

- `yarn validate` before calling anything done; the pack touches no runtime code.
- Projected counts to assert after the fold: objects 87, A 20, provisional 34, candidate 18,
  community 15, F 0.
- The pack's `draftProvenance` blocks and the two contested grades (NL-VIN A, DJ-COMMUNITY
  community-vs-provisional) are owner-visible: reconcile or keep the fit index's values.
