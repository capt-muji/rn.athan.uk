# Platform-ingest schema — mosque-platform layer (C32, ticket T-668)

Specification for ingesting mosque-platform timetable data into v3 safely. One
section per platform: fields as they appear on the wire, semantics, ingest-time
verification tests every capture must pass, and known defects. Evidence paths
are relative to `athan-gitree/census/`. Probes that extended this schema are in
`c32-platforms/PROBES.md`.

Shared vocabulary: "athan" = sun-tracking computed time; "jama'ah"/"iqama"/"jamah" =
congregation time, mosque-set; a "grid" = a multi-day table; a "today-row" = the
single day the surface itself declares current.

---

## 1. MAWAQIT (mawaqit.net)

### 1.1 Capture surface
Mosque page `https://mawaqit.net/{lang}/m/{slug}` (also `/{slug}`), fetched with a
plain HTTP GET + desktop UA — the page embeds the full configuration as JS vars
and JSON blobs; no browser needed. The documented REST API (api.mawaqit.net) is a
separate, key-gated surface and was not used by the census. Raw page captures:
`c1-wafrica/data/mawaqit-*.json` (extracted vars), `c22-pacific/raw/json-mq-*.json`
(full config objects), extraction script `c1-wafrica/scrape_mawaqit.py`.

### 1.2 Fields available (config object)
| Field | Type | Semantics |
|---|---|---|
| `name`, `label` | string | Mosque display name (may be HTML-escaped) |
| `countryCode` | ISO-3166 | Asserted by the mosque admin |
| `timezone` | IANA string | **Untrusted** (see 1.5) |
| `latitude`, `longitude` | float | Published by most mosques (11/12 pages in C21's Balkans set); every non-platform source publishes none |
| `times` | string[5] | TODAY's [fajr, dhuhr, asr, maghrib, isha], HH:MM |
| `shuruq` | string | TODAY's sunrise |
| `calendar` | obj[12] | 12 months keyed "1".."12" (Gregorian order, January-first in all captures); each month maps day-of-month → string[6] = [fajr, shuruq, dhuhr, asr, maghrib, isha] |
| `calendarIqama` / `calendar_iqama` | obj[12] | Same shape minus shuruq: day → string[5], either "+NN" minute offsets from athan, or "HH:MM" absolute clock times — **per mosque, not per platform** |
| `jumua`, `jumua2`, `jumua3` | string/null | Friday congregation times (may be null) |
| `jumuaAsDuhr` | bool | Jumua replaces dhuhr display |
| `imsakNbMinBeforeFajr` | int | Imsak offset convention |
| `hijriAdjustment` | int (-2..+2) | Mosque-set Hijri correction for display |
| `hijriDateEnabled`, `hijriDateForceTo30` | bool | Hijri display config |
| `lastUpdated` | epoch (page var) | Config-save timestamp — **weak signal** (1.5) |
| announcements/events/profile flags | misc | Mosque profile, not timetable |

### 1.3 Semantics
- The grid is a 12-month table with **no year marker anywhere**. The grid's
  calendar year must be recovered by fit: fit maghrib (and sunrise) at the
  published coordinates against both candidate years and require a unique
  winner. C1 measured 0.2-1.7 min fit error at Dakar/Douala/Abuja. Captured in
  Nov 2026, West African mosques served calendar-2027 grids while Djibouti
  mosques served calendar-2026 grids — the year is per-mosque, not per-platform,
  per capture date.
- **February always carries 29 entries** regardless of the grid's real year
  (verified on C1, C22 Tonga, C22 Nazareth captures). February length cannot
  date the grid, and a naive reader must not emit a Feb-29 row in non-leap years.
- `iqamaCalendar` form varies per mosque and per prayer: offsets "+10" vs
  absolute "19:06". An offset-assuming reader on an absolute mosque computes
  iqama = athan + garbage; an absolute-assuming reader on an offset mosque shifts
  times by hours. Detect per mosque, per prayer.
- Row width varies: **six columns** (fajr, shuruq, dhuhr, asr, maghrib, isha) in
  most mosques, **seven** in Baku captures (leading imsak duplicating fajr,
  c10-caucasus). A fixed-6 reader silently shifts Baku by one prayer. Detect by
  checking whether col[0] ≈ col[1] and col[1] ≈ sunrise, or by width itself.
- The page displays today values that can differ from the grid by per-prayer
  offsets: the served HTML contains two adjacent unlabeled 31-day grids (athan
  grid + iqama grid, C3's Lyon/Lisbon/Madrid captures). The displayed today
  times are the iqama-set times, not raw grid values. C1's resolution: match
  the grid against the page's own live today-row, then classify columns.
- `times[5]` has no shuruq; `calendar` rows do. `shuruq` is a separate today var.

### 1.4 Verification tests (all captures)
1. **Today-row anchoring**: the grid's entry for the capture date must equal the
   page's own `times`+`shuruq` (or the known live display) exactly. Fails ⇒ wrong
   year, wrong column mapping, or a stale grid. This test caught 28/28 passes in
   C10 and is the load-bearing gate.
2. **Solar gate**: sunrise and maghrib columns within ±5 min of astronomical
   computation at the published coordinates; dhuhr within ±10 min of solar noon
   **unless declared fixed**. A dhuhr pinned at exactly 12:00 (or 11:50, 12:15
   etc.) marks a **congregation board, not an athan source** (4/12 mawaqit pages
   in C21's Balkans set). Classify per column (C1's S/F cols classification).
3. **Byte-identity-vs-default**: compare the full grid text across mosques
   sharing one city on the platform. Byte-identical grids = platform default
   wearing the mosque's name, never mosque data (C22: Nazareth, Abu Ghosh,
   Haifa identical; only Jaffa configured). Record as default, not capture.
4. **Iqama form detection**: per mosque per prayer, offsets if all entries match
   `^\+\d+$`, absolute if all match `^\d{1,2}:\d{2}$`; mixed = flag and fail.
5. **Year resolution**: fit maghrib over both candidate years at published
   coords; require a unique winner inside tolerance. Ties ⇒ unresolvable, fail.
6. **TZ-field distrust**: never use `timezone` for ingest. Derive tz from
   coordinates; verify with one known instant (maghrib vs computed sunset).
   Srinagar declared `Africa/Abidjan` while printing IST (c11-indopak).

### 1.5 Known defects
- `timezone` field lies (Srinagar/Africa-Abidjan case).
- `lastUpdated` is a config-save epoch, not timetable freshness; stale grids
  carry fresh lastUpdated. Weak signal only.
- Platform-default mosques indistinguishable from configured ones without the
  byte-identity test.
- Congregation-board dhuhr columns masquerade as athan (solar-gate dhuhr test).
- Feb-29 phantom row in every grid.
- Iqama calendars may be all-zero offsets or unset (Tonga jumua null).
- Robots posture is a standing owner question: page fetches by plain HTTP were
  the census method (specific slugs, no bulk enumeration); the bulk-enumeration
  question stays parked with the owner.

---

## 2. MASJIDBOX (masjidbox.com)

### 2.1 Capture surface
- Landing page `https://masjidbox.com/prayer-times/{slug}` (public HTML shell).
- Data API `https://api.masjidbox.com/1.0/masjidbox/landing/athany/{slug}?get=at&days=7&begin={ISO8601}`
  requiring an `apikey` request header. The web app injects a 32-char
  alphanumeric key at runtime; held examples live only in the HAR capture
  (`har/mb.har`, request headers; extracted working copy at
  `c32-platforms/probes/mb-apikey.txt` — reference by path, never print).
  HAR evidence for the endpoint shape: `har/mb.har` (isna-canada capture).
- **Keyless page path (probe-confirmed)**: the public landing page
  `masjidbox.com/prayer-times/{slug}` embeds the ENTIRE landing payload inline
  as URL-encoded JSON (NEXT_DATA-style `{"masjidbox":{"masjidboxAthany":{...}}}`
  blob: timetable, iqamah, Friday jumuah arrays, settings,
  settingLastUpdated). Plain HTTP GET + URL-decode captures masjidbox with no
  key and no browser. Probe evidence: `c32-platforms/probes/mb-kuraby-d7.json`
  (API shape) and the same payload grepped from the page HTML.
- Raw capture examples: `c4-na/data/mcc-silver-spring.json` (normalized),
  `c7-latam/data/tt-chaguanas-masjid.json` (7-day rows), probe results in
  `c32-platforms/PROBES.md` §2.

### 2.2 Fields available (landing response)
| Field | Type | Semantics |
|---|---|---|
| `name`, `address`, `country` | string | Mosque identity as configured |
| `verified` | bool | Platform-asserted claim, not a census fact |
| `settings.timezone` | IANA string | Mosque-set; can be wrong-but-same-offset (America/Detroit for a Toronto mosque) |
| `settings.ampm`, `.language`, `.azan` | display config | |
| `athany.slug`, `.showIqamah`, `.highlight` | widget config | Whether iqamah rows carry real data |
| `timetable[]` | array | Dated rows; `days=` param CLAMPS to 7 (probe-settled); history via `begin=` stepping |
| `timetable[].date` | ISO datetime with offset | Local-midnight marker, carries the tz offset inline |
| `timetable[].fajr..isha` | ISO datetime with offset | Athan as absolute instants (offset embedded — self-describing) |
| `timetable[].iqamah{}` | ISO datetimes or absent | Congregation times, mosque-set; on Fridays carries `jumuah: [t1, t2, ...]` session arrays (probe-observed on Kuraby) |
| `timetable[].hijri{}` | object | dayOfMonth/month/monthISO/monthOfYear/year + formatted Arabic |
| `timetable[].special{}` | ISO datetimes | `imsak`, `iftar` (Ramadan-oriented) |
| `isStale` | bool | Platform's own staleness flag — treat as advisory |
| `settingLastUpdated` | timestamp | Config-save timestamp — weak signal, same rule as mawaqit |

The `athany.showIqamah` flag is unreliable: Kuraby's payload sets it false while
iqamah rows are present. Rule by row presence, never by the flag.

### 2.3 Semantics
- Times are absolute ISO instants with inline UTC offset — the only platform
  whose rows are tz-self-describing. Ingest can normalize without a tz table,
  but must still distrust `settings.timezone` as a label (it can name a
  different zone with the same offset).
- Iqamah presence and form are per-row facts; absence is normal, not an error.
- **Range (probe-settled)**: `days=` CLAMPS to 7 (days=31 and days=366 both
  returned exactly 7 rows). History is walked by stepping `begin=` backwards,
  7 days per request: `begin=2026-06-01` served June 1-7 verbatim. Per-mosque
  back-cover is therefore mechanical but rate-limited by shape. The `.ics`
  subscription idea from C9 is FALSIFIED at every shape tried (PROBES §2).

### 2.4 Verification tests
1. **Today-row anchoring**: row dated the capture date must match the public
   landing page's displayed values.
2. **Solar gate**: sunrise/maghrib vs computation at the mosque's address-derived
   coordinates (masjidbox publishes no coordinates in this payload).
3. **Byte-identity-vs-default**: same-city slugs compared byte-for-byte.
4. **Offset sanity**: each row's inline offset must equal the offset implied by
   its date (DST transitions); mismatch ⇒ corrupted row.
5. **TZ-field distrust**: same rule as mawaqit §1.4.6.

### 2.5 Known defects
- No coordinates in the landing payload (address string only) — geocode or
  derive externally for the solar gate.
- `verified` is the platform's badge, not ours; verified mosques can still sit
  on platform defaults.
- `settings.timezone` can be wrong-but-equal-offset.
- `settingLastUpdated`/`isStale` advisory only.
- `athany.showIqamah` contradicts row content (Kuraby: false with iqamah rows
  present) — never gate on the flag.
- No `.ics` subscription exists at the shapes tried: page `.ics` returns the
  SPA shell with HTTP 200 (soft 404), API-host `.ics` returns 404 with the key.
- The apikey is an unauthenticated constant the web app ships; it is not a
  secret in any cryptographic sense, but treat it as held data (path reference,
  never print).

---

## 3. MASJIDAL (masjidal.com)

### 3.1 Capture surface
Two API shapes held:
1. **Keyless widget API**: `https://masjidal.com/api/v1/time/range?masjid_id={ID}&masjid_detail=yes&from_date=YYYY-MM-DD&to_date=YYYY-MM-DD`
   — no auth at all. masjid_id comes from the monthly widget embed
   (`https://masjidal.com/widget/monthly/v3/?masjid_id=ID`). HAR evidence:
   `har/masjidal.har` (ISBCC Boston, id zVKp9PLP). Raw capture:
   `c4-na/api/masdc-nov2026.json`, `c4-na/api/isbcc-nov2026.json`.
2. **Keyed API**: `https://api.masjidal.com/timings` with `x-api-key` header
   (extracted from a mosque's own site widget — iccuk.org). Capture:
   `c24-uk-ie/data/london-central-mosque.json` (92 dated rows, merged
   athan+jamaah columns).

Known masjid_ids in the census: `xwLVrxLJ` = Kowloon Mosque and Islamic Centre,
Hong Kong (probe-confirmed identity); `zVKp9PLP` = Islamic Society of Boston
Cultural Center; `xdy03lAX` = Islamic Association of North Texas. ids come from
each mosque's widget embed URL.

### 3.2 Fields available (keyless range response)
| Field | Path | Semantics |
|---|---|---|
| `status` | root | "success" |
| `salah[]` | data | Athan rows: `date` ("Sunday, Nov 1, 2026" — parse carefully), `hijri_date`, `hijri_month`, `day`, `fajr`, `sunrise`, `zuhr`, `asr`, `maghrib`, `isha` — 12-hour AM/PM strings |
| `iqamah[]` | data | Congregation rows: `date`, `fajr`, `zuhr`, `asr`, `maghrib`, `isha`, `jummah1`, `jummah2` — mosque-set per date, may track athan (maghrib moves daily) or be fixed (zuhr 12:00PM) |
| `masjid_info` | data | `name`, `location`, `phone`, `logo`, `email`, `website_url`, `event_url` |
| `general_setting.timezone` | data | IANA string — untrusted like all platform tz fields |
| `reminder`, `announcements`, `slideshow_setting`, `slideshow_images` | data | Kiosk widget content, not timetable |

### 3.3 Semantics
- The salah rows are the platform-computed (or mosque-uploaded) athan; iqamah
  rows are the mosque's congregation board, delivered separately. Join on the
  parsed date.
- `date` strings are locale-formatted ("Sunday, Nov 1, 2026") with no year-safe
  ordering; parse with a fixed format, never freeform.
- **Range (probe-settled)**: the keyless range serves FULL PAST YEARS in one
  request — 2025 complete (365 salah + 365 iqamah rows), and a 731-day span
  (2023-06-01..2025-05-31) came back whole. C24's "current quarter" cap applies
  to the KEYED api.masjidal.com/timings shape only. Iqamah history is delivered
  alongside athan history for past dates. Probe evidence:
  `c32-platforms/probes/masjidal-xwLVrxLJ-2025.json`, `...-2yr.json`,
  `masjidal-zVKp9PLP-2024q1.json`.
- Iqamah maghrib rows usually track the daily athan; fixed rows (zuhr 12:00PM,
  isha 7:00PM) are congregation convention — same fixed-vs-tracking
  classification as the athan/jama'ah columns generally.

### 3.4 Verification tests
1. **Today-row anchoring**: the range row for the capture date must equal the
   live widget's displayed values.
2. **Solar gate**: sunrise/maghrib vs computation; masjidal publishes no
   coordinates (address string in masjid_info only).
3. **Byte-identity-vs-default**: compare across same-city masjid_ids.
4. **AM/PM round-trip**: every 12-hour string must parse to a monotonic
   within-day sequence (fajr < sunrise < zuhr < asr < maghrib < isha); the
   12h format invites 12AM/12PM corruption.
5. **TZ-field distrust** (§1.4.6).

### 3.5 Known defects
- No coordinates; address string only.
- 12-hour AM/PM time format is corruption-prone.
- Locale date strings need strict parsing.
- `general_setting.timezone` untrusted.
- The keyed `api.masjidal.com/timings` shape carries per-mosque x-api-keys —
  per-mosque keys are unusable for generic ingest; the keyless shape is the
  viable one.
- C24's note claimed "API keeps only current quarter" for the keyed shape;
  probe results in PROBES §3 settle the range question for the keyless shape.

---

## 4. AMANAHLY (amanahly.com.au)

### 4.1 Capture surface
`https://backend.amanahly.com.au/api/prayer-times/public?date={YYYY-MM-DD}` —
keyless, no tenant parameter. Three routes named in the mosque site bundle
(`c9-oceania/raw/mia.js`), all live (probe-confirmed):
| Route | Returns |
|---|---|
| `prayer-times/public?date=` | JSON: single-day object `{success, data{day row}, dateKey, jumuah, nextJumuah{sessions[]}}` |
| `prayer-times/feed` | ICS "Athan Calendar": UTC-instant VEVENTs, short horizon (79 events, ~2 weeks) |
| `prayer-times/prayer-times.ics` | ICS "Congregation (Iqamah)": 617 events, ~4-month rolling horizon, `X-WR-TIMEZONE` declared |

Captured for MIA Liverpool: `c9-oceania/data/mia-liverpool.json` (30-day window
as C9 saw it — the public shape has since narrowed to single-day). Probe
payloads: `c32-platforms/probes/amanahly-*.json`, `amanahly-feed`,
`amanahly-prayer-times_ics`.

### 4.2 Fields available (rows array)
| Field | Type | Semantics |
|---|---|---|
| `date` | ISO Z timestamp | Local day as UTC midnight (00:00Z) — day ambiguity at non-UTC zones; use the date component only |
| `_id` | mongo id | Stable row id |
| `fajrBegins` / `fajrJamah` | HH:MM | Athan / congregation |
| `sunrise` | HH:MM | |
| `zuhrBegins` / `zuhrJamah` | HH:MM | |
| `asrBegins` / `asrJamah` | HH:MM | |
| `maghribBegins` / `maghribJamah` | HH:MM | |
| `ishaBegins` / `ishaJamah` | HH:MM | |
| `hijriDate` | Arabic string | e.g. "الثلاثاء 30 جمادى الأولى 1448" |
| `isRamadan` | bool | |
| `dateKey` | YYYY-MM-DD | The served day, echo of the request |
| `jumuah` | null or object | Friday session metadata |
| `nextJumuah{}` | object | `{date, isChange, note, sessions[{label, khutbah, salah, khutbahAt}]}` — khutbah/salah times per session |

Response carries no mosque identity, no coordinates, no timezone metadata —
identity lives only in the referring mosque site.

### 4.3 Semantics
- Begins/Jamah pairing is explicit per prayer — no offset-vs-absolute ambiguity:
  both layers are absolute clock strings.
- **Range (probe-settled)**: `date=` serves ANY single day, past included
  (`date=2026-06-01` returned the June 1 row). The empty-date 30-day window C9
  recorded has narrowed to a single-day object in the current shape; a window
  can still be walked day-by-day if a tenant is known.
- **Tenancy (C9's open question, now answered)**: the endpoint is NOT keyed by
  Referer/Origin — identical row `_id` and values with no referer, with the
  mosque's own referer/origin, and with a foreign referer. The public endpoint
  is pinned to ONE DEFAULT TENANT (MIA Liverpool; row `_id` matches C9's held
  capture). No tenant parameter exists in the shape probed; other Amanahly
  tenants are reachable only through their own sites' bundles naming the same
  backend with a tenant-scoped path (none observed). Probe evidence:
  `c32-platforms/probes/amanahly-ref-*.json`.

### 4.4 Verification tests
1. **Identity binding**: capture must record the referring mosque site URL;
   an unbound payload is unusable (no name inside the response).
2. **Solar gate**: coordinates must come from the mosque's own site (the API
   publishes none).
3. **Today-row anchoring**: row for the capture date must match the mosque
   site's displayed values.
4. **Pairing sanity**: Jamah − Begins per prayer must be within 0..60 min;
   negative or hour-scale gaps = mislabeled columns.
5. **TZ-field distrust**: no tz field exists; derive from the mosque's
   location and verify via maghrib.

### 4.5 Known defects
- Response is identity-free: provenance must be carried by the capture manifest.
- **Single-tenant public endpoint**: the `public` route serves only the default
  tenant (MIA Liverpool) regardless of headers; other Amanahly mosques require
  per-site discovery of their own API paths. The platform's per-tenant value is
  therefore bounded until a tenant parameter is found.
- `date` as UTC-midnight-of-local-day is off-by-one-prone for UTC+negative
  zones if ever normalized naively.
- No coordinates, no method metadata, no stated calculation basis anywhere.
- The public JSON shape has narrowed since C9's capture (30-day window →
  single day); the ICS feeds are the wider-surface routes now (`feed` for
  athan UTC instants, `prayer-times.ics` for a ~4-month iqamah horizon).

---

## 5. DPT PLUGIN (WordPress "Daily Prayer Times for Mosques")

### 5.1 Capture surface
Any WordPress mosque site running the plugin exposes:
`https://{domain}/?rest_route=/dpt/v1/prayertime&filter=year` → the full year in
one JSON response; `&filter=month&year=YYYY&month=M` → one month.
Held captures: `c4-na/api/dah-year.json` (hijrah.org, 365 rows),
`c4-na/api/icdc-year.json`, `c4-na/api/iant-nov2026.json`. Probe confirmations
in PROBES §5. Domains held: hijrah.org, theislamiccenter.us, iant.com
(Galway's GICC runs a custom `gicc/v1` namespace — same row shape, different
route; `c24-uk-ie/data/gicc-galway.json`).
**Probe findings**: `filter=year` works on all three, but the served span is
per-install: hijrah.org = complete calendar 2026 (365 rows); theislamiccenter.us
= calendar 2027 Jan-Jul only (212 rows, a half-year import). `d_date` makes
every row self-describing, so span variance is harmless to parsing — but do not
assume 365.

### 5.2 Fields available (per row, inside a triple-nested array)
| Field | Type | Semantics |
|---|---|---|
| `d_date` | YYYY-MM-DD | The only safe date field on any platform |
| `fajr_begins` / `fajr_jamah` | HH:MM:SS | Athan / congregation |
| `sunrise` | HH:MM:SS | |
| `zuhr_begins` / `zuhr_jamah` | HH:MM:SS | |
| `asr_mithl_1` / `asr_mithl_2` | HH:MM:SS | Both Asr schools (Shafi / Hanafi shadow lengths) — may be identical |
| `asr_jamah` | HH:MM:SS | Congregation |
| `maghrib_begins` / `maghrib_jamah` | HH:MM:SS | |
| `isha_begins` / `isha_jamah` | HH:MM:SS | |
| `is_ramadan` | "0"/"1" | String flag |
| `hijri_date` | string | Frequently empty |

### 5.3 Semantics
- `filter=year` is the census-gold shape: dated rows, both layers, both Asr
  schools, one request, plain JSON, no auth, no browser.
- **`filter=month` IGNORES its year/month parameters (probe-settled)**:
  requesting 2026-06 returned November 2026 on both hijrah.org and iant.com.
  Past months are NOT retrievable through the month filter; history depends on
  what each install's `filter=year` happens to carry.
- The response is `[[[ rows ]]]` — unwrap three levels.
- Every value is mosque-admin-configured in the plugin; the plugin does not
  compute, it serves what the mosque typed or imported. Quality varies per
  install: some jams track athan, some are fixed; `asr_mithl_1 == asr_mithl_2`
  on installs that only computed one school.
- No coordinates, no timezone field, no method metadata. Times are bare
  clock strings — tz is the mosque's local civil time by convention.
- Past months via `filter=month` measured in PROBES §5.

### 5.4 Verification tests
1. **Span audit**: a `filter=year` response's `d_date`s must be unique,
   contiguous, and dated within ONE calendar year; the row count is per-install
   (365 at hijrah.org, 212 at theislamiccenter.us) — ingest what the `d_date`s
   cover, never assume a full year.
2. **Solar gate**: sunrise/maghrib vs computation at the mosque's known
   coordinates (plugin publishes none).
3. **Jamah-vs-began classification**: per prayer, if jamah == begins everywhere,
   the mosque has no separate congregation data (do not invent one).
4. **Monotonic within-day check** (fajr < sunrise < zuhr < asr < maghrib < isha
   with wrap-around tolerance for high-latitude isha past midnight).
5. **High-latitude day rollover**: isha past 24:00 does not exist in this format
  (bare HH:MM:SS); a 00:xx isha belongs to the NEXT civil day — consumer adds
  the day marker (C10's Khabarovsk/Perm June case).

### 5.5 Known defects
- `hijri_date` often empty; `is_ramadan` string-typed.
- Triple-nested array wrapper.
- No coordinates, no tz, no method — every capture needs external geo/basis.
- Install quality varies; some installs carry stale or hand-typed months.
- Fixed `zuhr_jamah` at 12:00-style values = congregation board columns inside
  an athan table (classify per column, same as §1).

---

## 6. ATHANPLUS (athanplus.com)

### 6.1 Capture surface
Widget embed `https://timing.athanplus.com/masjid/widgets/embed?theme={n}&masjid_id={ID}`
— server-rendered HTML, TODAY ONLY, no date parameter. masjid_id namespace is
AthanPlus-own (e.g. Lakemba rdRvkZdG). Held capture:
`c9-oceania/data/lakemba-lma-2026-11-10.json` (transcribed from the embed),
`c9-oceania/raw/athanplus.html`. UMA Sydney's whole-year JSON
(`c9-oceania/data/uma-sydney.json`, `uma.org.au/prayertime/lib/calendar_whole_year.json`)
is a mosque-hosted artifact corroborated against the AthanPlus widget — it is
NOT an AthanPlus API response; do not ingest it as platform-shaped data.

### 6.2 Fields available (from the widget render)
| Field | Type | Semantics |
|---|---|---|
| per prayer: `{prayer}` and `{prayer}_iqamah` | 12-hour "4:13 AM" | Athan and congregation pairs; both layers always rendered |
| date | — | Today only; no historical access via the widget |

### 6.3 Semantics
- Today-only: the widget exposes no range, no date parameter, no JSON endpoint
  in the census's holdings. AthanPlus is a poll-daily source: one row per day,
  captured on the day.
- Two mosques sharing one calculation with differing iqamah observed in Sydney
  (UMA vs Lakemba, C9): the athan layer can be platform-shared while iqamah is
  mosque-set — same shared-computation caution as §1 byte-identity, but the
  athan layer remains usable as the computation it is.

### 6.4 Verification tests
1. **Today-row anchoring**: trivially satisfied by construction (the row IS
   today); record capture timestamp as the row's date authority.
2. **Solar gate** at the mosque's coordinates.
3. **Pairing sanity**: iqamah − athan within 0..30 min per prayer.
4. **AM/PM round-trip** (§3.4.4).
5. **TZ-field distrust**: no tz field; derive from location.

### 6.5 Known defects
- Today-only: no dated history, no range — weakest platform for fitting.
- 12-hour AM/PM format.
- No coordinates or method in the widget; identity via the embedding site.

---

## 7. Census-wide ingest rules (apply to all six)

1. Every capture carries a manifest row: source URL, capture UTC timestamp,
   slug/id, referring site (where the platform is identity-free), sha256.
2. Never trust a platform's timezone, verified, or lastUpdated fields as facts;
   derive timezone from geometry, treat verification as our own test suite,
   treat lastUpdated as provenance metadata only.
3. Column classification (sun-tracking vs fixed) is per column, never per table
   (C1's S/F classification is the model).
4. The solar gate is the universal truth test: sunrise and maghrib must agree
   with computation at known coordinates within ±5 min; dhuhr must agree with
   solar noon unless declared fixed. Fails on any column ⇒ classify that column
   as congregation/fixed, not athan.
5. A capture that cannot pass today-row anchoring is not ingested as a
   timetable — it is a lead, recorded for re-capture.
6. Never print, commit, or transcribe api keys; reference the held HAR by path
   (`har/mb.har`, `har/masjidal.har`).
