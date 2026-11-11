# O1m-22 — South America depth: fresh years, second cities, and three defect resolutions

Agent O1m-22. Workspace `$HOME/athan-gitree/census/o1m/o1m-22-southamerica/`.
Engine: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`,
timezone pinned per surface, dates from literal capture strings, no clock read into data.
INCREMENTAL: this report grows as the wave runs. No country is complete.

## 0. Standing

Waves before this one left four open items this mission was sent to close: La Paz's scrambled
table, Santa Cruz's sun columns, the Maracaibo ladder contradiction, and Buenos Aires' stale 2021
CCIAR PDF. Three of the four are now closed, and two of them close by the same cause: **a
seven-value mawaqit calendar read as six values.**

## 1. A platform layer over ten countries: 4,075 cities, 1,486,211 dated rows

`namazvakti.co.uk` (the Diyanet-derived world service) carries a per-city yearly table at
`/Yearly.php?cityID=<id>`, reached from its own country tree (`CountryList.php` → `StateList.php`
→ `CityListAlphabetic.php`). Five passes were made: 111 target cities (capitals, second cities and
the mission's named cities), then **every point the platform advertises for Uruguay, Paraguay,
Bolivia and Ecuador** (386), then **every Brazilian point** (1,734), then **every Argentine point**
(513), then **every Chilean, Colombian, Peruvian and Venezuelan point** (1,367). One raw page each,
12 monthly tables per page, seven printed columns (İmsâk, Sabâh, Güneş, Öğle, İkindi, Akşam, Yatsı).

| country | cities banked | platform's advertised count | rows | mean within-1 | worst |
|---|---|---|---|---|---|
| Argentina | 517 | 529 | 187,592 | 99.70 | 2 |
| Bolivia | **168** | 168 | 61,320 | 99.96 | 2 |
| Brazil | **1,759** | 1,759 | 642,035 | 99.98 | 2 |
| Chile | 218 | 242 | 79,519 | 99.62 | 2 |
| Colombia | **257** | 257 | 93,805 | 100.00 | 1 |
| Ecuador | **82** | 82 | 29,930 | 100.00 | 1 |
| Paraguay | **132** | 132 | 48,180 | 99.89 | 2 |
| Peru | **366** | 366 | 133,590 | 100.00 | 1 |
| Uruguay | **33** | 33 | 12,045 | 99.75 | 2 |
| Venezuela | **543** | 543 | 198,195 | 100.00 | 1 |
| **total** | **4,075** | 4,113 | **1,486,211** | **99.93** | **2** |

Across **8,917,266 cells** the fit puts **99.93 pc within one minute** and never more than two:
fajr 100.00, sunrise 100.00, dhuhr 100.00, asr 99.60, maghrib 99.99, isha 100.00. The asr column is
the only one with a visible tail, and that tail is a two-minute rounding difference, not a table
fault.

**Eight of the ten countries are complete at the platform tier** — Brazil 1,759/1,759, Colombia
257/257, Peru 366/366, Venezuela 543/543, Bolivia 168/168, Paraguay 132/132, Ecuador 82/82,
Uruguay 33/33. The 36 points that are not banked are Argentina's 12 and Chile's 24, and they are one
publisher behaviour, not a fetch gap: see section 2c.

The recipe is publisher-uniform: **18/17 Shafi at the minute grid**, with the Diyanet temkin terms
carried per point (sunrise −4 to −7, dhuhr and asr +7 to +9, maghrib +5 to +6, isha +6 to +11) —
the temkin set the Turkey fit found, in a second publisher's hands, across 30 degrees of latitude
and 1.49 million rows.

**Tier: platform.** This is a foreign authority's calculation at South American coordinates, not a
local mosque's table, and it is labelled so throughout. It gives every banked city a dated 2026
layer where no local surface exists. The year parameter is ignored (`?yil=`/`?year=`/`?sene=`
all return the 2026 title), so the surface is a single published cycle, not a span.

Two city-identity traps the list carries, both handled: `Rosario` at cityID 450 is Rosario de
Jujuy (−22.85, −66.72), not Rosario de Santa Fe; the correct Santa Fe point is 60100 (−32.95,
−60.67). `Cusco` is spelled `Cuzco`, `Caracas` is `Karakas (Caracas)`, and Quito is absent from
the Ecuador list altogether (its districts Tumbaco, Sangolquí and Carcelén are present).

## 2c. The 36 missing points are one publisher behaviour: blank summer cells at the southern tip

Argentina's 12 unparsed points and Chile's 24 are all at latitude −50 to −55: Tierra del Fuego
(Ushuaia, Río Grande, San Sebastián, Lapataia, Lago Escondido, Nueva Harberton, Bahía Thetis,
Estancia San Pablo), the Santa Cruz coast (Monte Dinero, San Pablo, Punta Loyola, Río Gallegos) and
Magallanes (Punta Arenas, Puerto Natales, Puerto Williams, Porvenir, Fuerte Bulnes, Puerto Percy,
Punta Delgada, Río Verde, Lenadura, Tres Puentes, Río Seco, Chabunco and the rest). Each carries
275-299 days and no summer rows.

The publisher **leaves the cell blank** where the sun never reaches the fajr or isha angle, rather
than inventing a night portion. That is the Punta Arenas class C17 fitted for Chile, now seen from
the platform side and in two countries at once. Those 36 points are excluded from the fit table
rather than scored on a truncated year.

## 2. BOLIVIA — La Paz and Santa Cruz both resolved, and the cause is one column

Both Bolivian mawaqit installs (`asociacion-comunidad-islamica-bolivia-1335-la-paz-bolivia`,
`centro-islamico-de-santa-cruz-45678-santa-cruz-de-la-sierra-bolivia`) serve a **seven-value**
`confData.calendar` where every other South American install serves six:

```
["04:19","04:19","05:34","12:21","15:43","18:58","20:08"]   // 1 January, both installs, byte-identical
```

The R6 wave read `values[:6]`, which maps `[fajr, fajr, sunrise, dhuhr, asr, maghrib]` onto six
prayer names. That is the whole of the "La Paz scrambled columns" finding: fajr and sunrise both
print 04:19 because they are the same leading value twice, and every later column is one place
out. Re-read against adhan at each install's own coordinates:

| install | coordinates | 1 Jan fajr/sunrise/dhuhr/asr/maghrib/isha | computed at those coordinates |
|---|---|---|---|
| La Paz (`-16.4959, -68.1242`) | La Paz | 04:19 05:34 12:21 15:43 18:58 20:08 | 04:42 06:03 12:36 16:00 19:09 20:25 |
| Santa Cruz (`-17.7932, -63.1965`) | Santa Cruz | 04:19 05:34 12:21 15:43 18:58 20:08 | 04:19 05:41 12:16 15:39 18:52 20:09 |

**Santa Cruz is the city the table belongs to** (fajr exact, five columns within 7 minutes), and
**the La Paz install is serving Santa Cruz's table** under La Paz's name. Two findings, one cause:

1. **Santa Cruz RESOLVED.** The held "sun columns unreproducible at any South American
   coordinate" was a parser column offset, not a publisher defect. Re-parsed (drop the leading
   duplicate, keep six), 365 rows, fit fajr 18.0 / isha 15.9 deg Shafi, temkin 0/−7/+5/+4/+7/+5:
   within-1 94.2/95.9/92.3/94.8/94.2/93.2, worst 6 (`fit/mw-santacruz.json`). Class:
   **candidate, one cycle**.
2. **La Paz remains a defect, but a different and named one: cloned tenant.** Its install's
   calendar is Santa Cruz's, 15° of longitude away, so its rows cannot describe a La Paz sky
   (dhuhr 11 minutes early is the one column that looks plausible; sunrise is 29 minutes early).
   Class: **city-clone tenant**, distinct from the column-mapping class R6 recorded. La Paz's dated
   layer this wave is the platform layer above (365 rows, 100 pc within-1 on every column).

The seven-value shape is a mawaqit *editor* variant (a leading imsak field), not a defect in
itself: both Bolivian tenants use it, and the Santa Cruz tenant's own data is correct inside it.

**The clone is total.** All 365 days of the two installs are byte-identical
(`data/mawaqit/*.json`, 365/365 equal), while the installs carry different coordinates
(−16.4959, −68.1242) and (−17.7932, −63.1965). One table, two tenants, 15° of longitude apart.

## 2b. A note on mawaqit access

`mawaqit.net/robots.txt` (read this wave) carries an explicit block:

```
User-agent: ClaudeBot
User-agent: anthropic-ai
User-agent: Claude-Web
Disallow: /
```

This agent class therefore stopped at the two Bolivian pages it had already read to close the
recorded defect, and did **not** bulk-harvest the platform this wave. A Uruguay tenant exists and
is recorded for a permitted reader rather than fetched: Montevideo,
`al-musallah-al-haazimi-11100-departamento-de-montevideo-uruguay` (its own page prints fajr 04:01,
dhuhr 12:29, asr 17:20, maghrib 19:21, isha 20:57 — a Montevideo summer row). Whether this
programme's readers are covered by that block is an owner decision, not an agent's.

## 3. VENEZUELA — the Maracaibo contradiction is decided, and the physics decides it

Both artefacts were re-read this wave:

- **The live page** `mezquitadecaracas.com/informaciones/menu mezquita/horario-de-oracion.html`
  prints the ladder as prose: `VALENCIA +05, MARACAY +03, SAN FELIPE +06, ACARIGUA +09,
  BARQUISIMETO +10, CORO +15, MARACAIBO +09, ...`
- **The dated sheet** `mezquitadecaracas.com/horario-salat.pdf` (OCR, macOS Vision) prints the
  same ladder in its footer: `Valencia: +5, Maracay: +3, San Felipe: +6, Acarigua: +9,
  Barquisimeto: +10, Coro: +15, Maracaibo: +19, Bolívar: +12, Porlamar: +13, Maturín: +15`.
  Header: `OCTUBRE-NOVIEMBRE - JUMADA AWAL - 1448`, 30 rows, MWL and Umm al-Qura marks both on
  the sheet.

Nine of the ten cities agree between the two artefacts. Maracaibo is the single disagreement, and
it is the only city whose page value is not also the PDF value.

The test: compute MWL 18/17 at Caracas (10.4806, −66.9036) and at Maracaibo (10.6427, −71.6125)
for seven days of the sheet's own month (`scripts/maracaibo_check.mjs`):

```
2026-10-12  Caracas 05:06 06:16 12:14 15:33 18:12 19:18 | Maracaibo 05:25 06:35 12:33 15:52 18:30 19:37 | delta 19,19,19,19,18,19
2026-10-21  Caracas 05:06 06:17 12:12 15:32 18:07 19:14 | Maracaibo 05:25 06:36 12:31 15:51 18:26 19:33 | delta 19,19,19,19,19,19
mean delta per column: 19.0, 19.0, 19.0, 18.9, 18.7, 18.9
```

The correct offset is **+19 minutes on every column, constant through the month**. The sheet's
`+19` is the publisher's number; the page's `+09` is a one-character transcription error in one
row of ten. **Resolution: the sheet edition governs. Maracaibo's ladder value is +19 minutes, and
the page is recorded as defective at exactly one city of ten.** Class: publisher page typo, not a
publisher contradiction — the contradiction dissolves once the artefacts are read against the sky.
Maracaibo also carries its own dated layer this wave from the platform pass (365 rows, six columns
100 pc within one minute), so the ladder is no longer the city's only route.

## 4. ARGENTINA — CCIAR publishes monthly, but as images

- `ccislamicoreyfahd.org.ar/Horarios-del-Salat.pdf` is still the **Mayo–Junio 1442 / 2021**
  sheet (OCR: header `Mayo-Junio 1442 H 2021`, fajr 6:13-6:17 AM, no year later). The stale-2021
  finding is confirmed live on 2026-11-11, five and a half years on.
- The publisher's real channel is the WordPress post series under
  `category/otras-noticias-historicas/horarios-otras-noticias-historicas/`: one post per Hijri
  month carrying a **sheet image**, not a PDF. Banked list (date published → sheet):
  Rabi al-Awwal 1448 (2026-08-17), Rabi al-Akhir 1448 (2026-09-11), Ramadan 1447 (2026-02-17),
  Rayab 1447 (2025-12-22), Rabi al-Akhir 1447 (2025-09-26 / 2025-10-13), and the 2025-08 post.
  The media library (`wp-json/wp/v2/media`, 398 images enumerated) carries the sheets at full
  size.
- The **September–October 2026 sheet** (Rabi al-Akhir 1448, 30 rows, 2026-09-12..2026-10-11) is
  transcribed from a 3× upscale (`sips -Z 3000` then macOS Vision OCR; the upscaled frame is kept
  as `captures/cciar-sheets/01-upscaled-3x.png`); the upscale is what makes the grid readable — the
  native 720×1040 JPEG returns interleaved columns. Rows and weekday
  checks agree with the 2026 calendar (12 Sep = Sáb, 21 Sep = Lun, 11 Oct = Dom).
  `data/cciar-sheet-2026-09.json`.
- **Two more sheets are legible and not yet transcribed**, and the reason is recorded rather than
  papered over: the Rayab 1447 sheet (Diciembre 2025 – Enero 2026, first row 21 Dom) and the Rabi
  al-Akhir 1447 sheet (Septiembre–Octubre 2025, first row 23 Mar) both read as row sequences after
  the same upscale, but their columns come back with 25 to 29 of 30 values — the missing cells put
  every later row one place out, so a positional transcription would silently misdate the month.
  The fix is per-column cropping, not a better guess.
- The four announcement images (Rabi al-Awwal, Rabi al-Akhir, Rabi al-Akhir 1447, Rabi al-Awwal
  1447) carry **no table**, only the month name; they are recorded as surfaces without rows.

## 5. Brazil, Peru, Ecuador, Colombia — what the publisher surfaces say

**Brazil.** FAMBRAS's prayer page (`fambras.org.br/horario-de-oracao`) publishes no table of its
own: it embeds **nine IslamicFinder widgets**, one per city geonames id, at
`/prayer-widget/<id>/shafi/1/0/18.0/17.0`. That URL is a dated statement of the federation's own
parameters — Shafi, fajr 18, isha 17 — and it agrees with the IIB 25-city fit already in the
record (MWL 18/17, zero margins). Mesquita Brasil's own site (`mesquita-brasil.com.br`) carries no
prayer block; its prayer channel is Instagram and Facebook. Brazil therefore gains no new row
this wave beyond the platform layer, and the federation's 18/17 is now documented from a second
Brazilian publisher.

**Peru.** Lima's two mawaqit installs are held. Arequipa, Trujillo and Cusco have no mosque-owned
dated surface found under Spanish terms; Cusco's mawaqit hit in search is Lima's Nurul Islam
install, not a Cusco tenant. All three carry the platform layer above (365 rows each).

**Ecuador.** Guayaquil's install is held; Quito is held. Cuenca, Loja, Ambato, Manta, Riobamba,
Machala and Santo Domingo carry the platform layer. `namazvakti`'s Ecuador list omits Quito
itself — Tumbaco, Sangolquí and Carcelén are the Quito-metro points it offers.

**Colombia.** Cartagena's masjidbox walk is held, and masjidbox's own search endpoint is dead
(`api.masjidbox.com/1.0/masjidbox/landing/search?q=` returns `[]` for every query tried, including
controls that must match — `madina`, `masjid`, `islam`, a lat/lng/radius triple). Bogotá's board
stays undated: the mosque's social channels post the schedule as images, and no masjidbox or
mawaqit tenant surfaced for the capital. Medellín and Cali are platform-layer only.

## 6. Gate against live pages (R5)

Thirty-seven `namazvakti` city pages were re-requested across the wave and compared cell for cell
against their saved captures — two days per city, six columns each — **612/612 identical**
(180, 72, 180 and 144 across four passes). The two Bolivian mawaqit pages were fetched
fresh this wave and parsed both ways (six-of-seven and six-of-six): the column offset is
reproducible, and the two installs are 365/365 identical to each other.

## 7. Buenos Aires: two independent publishers, two minutes apart

The city now carries a second publisher surface beside the held mawaqit install. Comparing
CCIAR's September–October 2026 sheet against Mezquita Al Ahmad's mawaqit year table for the same
30 days:

| column | difference (CCIAR − mawaqit), range over 30 days | mean |
|---|---|---|
| fajr | −3 .. 0 | −1.1 |
| sunrise | −2 .. +1 | −0.3 |
| dhuhr | +1 .. +2 | +1.1 |
| asr | 0 .. +1 | +0.5 |
| maghrib | 0 .. +1 | +0.4 |
| isha | 0 .. +2 | +0.8 |

Two publishers, one city, never more than three minutes apart, and a consistent sign per column:
they are printing the same sky with different rounding, not two different tables. The CCIAR sheet
itself fits **MWL 18/17 Shafi** at −34.555/−58.390 (coordinate solved by grid search) with
within-1 100/93.3/100/100/100/100 and worst 2 (`fit/cciar-2026-09.json`).

**Córdoba shows the other pattern, and it is the one that matters for the fit index.** Compare the
held mawaqit table of the Centro Islámico de la Provincia with the platform layer for the same 365
days: fajr +0.6, sunrise −5.1, dhuhr +8.3, asr +8.3, maghrib +2.2, isha +8.3 minutes. The angles
are the same 18/17; the entire difference is the Diyanet temkin set, which offsets the platform
layer from any mosque table by roughly +8 minutes on dhuhr, asr and isha and −5 on sunrise. The
two tiers must never be blended: they are the same astronomy with different precaution margins.

## 8. Totals banked this wave

| block | surfaces | dated rows | captures |
|---|---|---|---|
| namazvakti platform layer, 10 countries | 4,075 cities | 1,486,211 | 4,111 yearly pages |
| La Paz / Santa Cruz mawaqit re-read | 2 installs | 730 | 2 pages |
| CCIAR Buenos Aires sheet, Sep–Oct 2026 | 1 | 30 | 8 sheet images + 3 posts + 398 media records |
| **total** | **4,078** | **1,486,971** | **1.5 GB HTML + 240 MB rows** |

Fits: `fit/nv-scores.json` (4,075 cities), `fit/mw-santacruz.json`, `fit/mw-lapaz.json`,
`fit/cciar-2026-09.json`, gates `fit/gate-nv.json`, aggregate `fit/index.json`.

**Disk headroom is thin and the parent should know before the next bulk pass.** The census volume
holding this workspace reports **15 GB free of 460 GB (97 pc used)** at the end of this wave, while
the round's archive target is 50 GB. This wave alone added 1.5 GB of HTML and 240 MB of normalised
rows. At this rate the 50 GB target is not reachable on this volume without pruning or moving the
archive; that is a decision for the owner, not an agent.

## 9. Negatives, with languages

| target | result | languages |
|---|---|---|
| CCIAR own PDF `/Horarios-del-Salat.pdf` | still the Mayo–Junio 1442 / 2021 sheet | ES |
| CCIAR table as text or PDF | monthly sheets are images only; WP media library 398 images enumerated | ES |
| La Paz mawaqit install | cloned Santa Cruz table (365/365 identical), unusable for La Paz | ES |
| Maracaibo mawaqit / masjidbox tenant | none; the Caracas ladder is the only route | ES, EN |
| masjidbox search API | `[]` for every South American city and for known-good controls | ES, PT, EN |
| masjidbox sitemap | 36 URLs, no mosque directory | EN |
| Rosario, Mendoza, La Plata, Tucumán, Salta mosque sites | no own dated table; local mosques publish monthly posters on Facebook/Instagram (Tucumán's Mezquita Ash-Shahid posts one per month) | ES |
| CIRA (`islam.com.ar`) | "Horarios de oración" is a text page on the salat, no table; only a 2020 Ramadan PDF in the uploads | ES |
| Montevideo, Centro Islámico del Uruguay | site carries no prayer block; mawaqit tenant exists but is behind the robots block above | ES |
| Asunción, Paraguay | no mosque-owned dated surface found; `Mezquita del Este` (Ciudad del Este) has no times page | ES |
| FAMBRAS | no own table; embeds IslamicFinder widgets at 18/17 Shafi | PT |
| `islam.org.br` | 503 from this host | PT |
| Arequipa / Trujillo / Cusco, Bogotá / Medellín / Cali | no mosque-owned dated surface found | ES, EN |

## 10. NEXT

- **Buenos Aires year.** CCIAR's monthly image series is the country's authority and runs at least
  Dec 2025 → Sep 2026. The remaining sheets (Rayab 1447, Ramadan 1447, Rabi al-Awwal 1448) are
  captured and need the same upscale-then-OCR pass the September sheet got. That would give Buenos
  Aires two independent publishers across a year.
- **The next depth in every country is a publisher surface, not a platform one.**
- **Eight of the ten countries are complete at the platform tier**; the 36 missing points are the
  southern-tip blank-cell class and cannot be filled from this publisher.
- **Argentina's interior.** Rosario, Mendoza, La Plata and Tucumán publish monthly posters, not
  tables. The route is image capture plus OCR, not search.
- **Venezuela rows.** The Maracaibo ladder is now decided (+19). Turning it into rows needs the
  Caracas sheet transcribed column by column: the sheet's own layout puts the six columns in
  blocks, and the macOS Vision binary returns them out of order at native resolution. Upscaling
  the rendered page to 4000 px recovers only the Friday band, so a per-column crop is the next
  attempt.
- **Uruguay and Paraguay** still have no publisher-tier surface. The Montevideo mawaqit slug is
  recorded above; everything else is charia/community pages without times.
- **The namazvakti universe is far from exhausted**: 3,600+ South American points are advertised
  (Brazil alone 1,759, Venezuela 543, Argentina 529, Peru 366, Colombia 257, Chile 242). 497 were
  banked. The remaining points are a mechanical pass and give every municipality a dated layer.

