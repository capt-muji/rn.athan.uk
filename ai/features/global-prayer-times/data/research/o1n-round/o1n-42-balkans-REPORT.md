# O1n-42 Balkans and Türkiye — year-2 accrual and second witnesses

Wave: o1n-42, round four (o1n), session three, 2026-11-12. Mission: the Balkans and Türkiye —
year-2 accrual and second witnesses for the single-cycle rows. Engine of record: adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, solar core via the o1n-3 engine.mjs.
Held lines this wave measures against: TT-TREE-110834 (platform, frozen ladder in the Balkans
sunrise ~-6 / dhuhr ~+10 / asr ~+10 / maghrib ~+7, fajr ~17.7 deg, isha ~16.7 deg), EU-DIYANET-16-ISHA-SPLIT
(authority, fajr 18.00 / isha 16-17 / temkin -7,+5,+4,+7), GR-ATHENS-STATE (Ramadan 2026, 16.95/16.65),
BA-SARAJEVO-PODGORICA (community boards). All timestamps UTC.

## Per-front summary (wave close, 2026-11-12T17:45Z)

| Front | Deliverable | Tier | Rows banked | Recipe | Verdict |
|---|---|---|---|---|---|
| TR | Diyanet 2027 annual NOT SERVED (3 routes banked); tree-vs-Diyanet isha second witness at 3 settlements, fresh instant | authority + platform | 3 diyanet yearly (365 ea) + 3 monthly + 3 tt annual (365 ea) | isha +11/+11/+10, dhuhr +6, asr +7, maghrib +1 (family band re-confirmed) | witness banked, no adjudication; 2027 gate after December |
| BG | Grand Muftiate live + 4 Wayback tables (2020-11, 2022-11, 2024-04, 2026-01) | authority | 151 dated rows | imsak 18°−1, güneş −7, öğle +5, ikindi +4, akşam +7, yatsı 17°+0 | stable-across-6, Nov 2022 ≡ Nov 2026 cell-identical; 47 towns POST-only open |
| RS | Mešihat negative (image-only post, OCR-negative); salahtimes platform banked | community→platform | 60 rows (NP + BG Nov 2026) | adhan-exact except asr +39.5 (unresolved family) | authority negative recorded with routes; 2027 month JS/Cloudflare-gated |
| HR | MIZ Zagreb via vaktija.eu, Nov 2026 | community (official-embedded) | 30 rows | fajr 18.4°, sunrise −4, dhuhr +2, asr Shafi exact, maghrib +5, isha 16° | month routes server-pinned; December arrives same URL |
| SI | vaktija.si open feed (Islamic Community Slovenia authority), Nov + Dec 2026, 6-city correction model | authority | 61 rows (Ljubljana base) | 18°−5, sunrise −5.3, transit +2.5, asr +1.7, sunset +6.4, isha 17°+5 | year-2 already served by authority; isha 17°+5 vs Diyanet 16° = conflict-class pair recorded |
| ME | vaktija.eu Podgorica Nov 2026; authority domains dead | community (official-embedded) | 30 rows | 18°−5, sunrise −3.3, transit +0.4, asr −4, sunset +2, isha −1.9 on 17° | meshihat print open (no resolvable domain) |
| BA | Riyaset Takvim SOLVED: 2024 (364) + 2026 (365) text parses + printed recipe from 2025 pages | authority | 729 dated rows | see BA section; 2024→2025 regime change in zora + jacija | proven-to-2026, recipe solved, printed + fitted agree ≤0.5 min; 2027 edition gate late December |
| MK | native authority negative; Diyanet Üsküp + vaktija.eu Skopje banked | platform ×2 | 30 rows | vaktija.eu: asr −6.2 vs Diyanet +4.6 — 10.8-min asr split on one city | conflict-class pair recorded, owner-ruled |
| XK | KBI Kosovo Takvimi 2026 + 2023 editions banked from text-layer PDFs | authority | 684 dated rows | sunrise −7, transit +4, asr +6 (±3 seasonal open), sunset +8, isha +10 on 17°, imsak 18°−5 | two editions one engine (≤0.2 min col deltas); 2027 gate 2026-12-28 intact; Diyanet-abroad absent |

## Open items for the successor

1. TR: re-fetch the three Diyanet district yearly tables after December for the
   2027 annual; the unidentified third-party 2027-Ramadan-imsakiye site (Google
   snippet, thread cut by the sorry page).
2. BG: the 47 non-default towns (POST-only selector); 2027 reachable only when
   the server unpins the year.
3. RS: mosque-level mejlis pages in Novi Pazar/Sandžak; salahtimes month route
   via agent-browser (Turnstile-gated).
4. BA: OCR the image-only 2025 takvim pages (work/ba25-p16-*, ba25-p20-* at
   3x upscale; the fast-level OCR read nothing on the two Facebook photos —
   they are event photos, NOT tables; the real month pages are elsewhere in the
   46-page PDF, pdftoppm route).
5. SI/HR/ME/MK: December re-fetches of vaktija.si/vaktija.eu at the same URLs.
6. XK: the 2027 Takvimi at the 2026-12-28 watch (dituriaislame.com media API).
7. GR: Arabic-edition RTL parse (inherited open formatting item, untouched).



## Entries

(sections below written incrementally, one per entry)

### TR — Diyanet 2027 annual check + tree-vs-Diyanet isha second witness (14:45-15:00Z)

Routes: Diyanet district pages `namazvakitleri.diyanet.gov.tr/tr-TR/<ilceID>/...`
(weekly + monthly + yearly tables in one DOM; yearly discovered server-rendered,
365 rows, span 2026-01-01..2026-12-31 at Istanbul 9541, Ankara 9206, İzmir 9560);
states/districts via `home/GetRegList?ChangeType=state&CountryId=2&StateId=<n>`
(ANKARA 506, İZMİR 540); turktakvim annual pages cityID 16741/16709/16742.

- 2027 imsakiye: NOT SERVED as of 2026-11-12T14:45Z. Three banked routes:
  (1) the district-page yearly table carries 2026 only at all three districts
  (365 rows each, 2026-01-01..2026-12-31, no 2027 rows); (2) main site
  `diyanet.gov.tr/tr-TR` (now a Next.js app, 183 KB) has no imsakiye document
  link, and `/tr-TR/arama?kelime=imsakiye` responds 200 with "Bulunamadı"
  (server-rendered empty state); (3) TinyFish/Google results name no Diyanet
  2027 annual print — only third-party Ramadan-2027 countdown pages (34-city
  per-city "… 2027 Ramazan imsakiyesi" site unidentified before the Google
  thread hit its sorry page — recorded, not solved; parked hosts
  ramazanimsakiyesi.com→imsakiye.eliyte.com and imsakiye.net are landers).
  DuckDuckGo served a challenge: recorded, skipped. Wayback CDX probes timed
  out twice, then empty for `diyanet.gov.tr/tr-TR/imsakiye` — null probe.
  Accrual gate: re-check after December.
- Second witness for the tree's isha finding: fresh same-day fetch
  2026-11-12T14:45Z (`captures/tt-{istanbul,ankara,izmir}-*-2026-11-12T1445Z.html.gz`,
  `captures/tr-diyanet-{istanbul,ankara,izmir}-*-2026-11-12T1445Z.html.gz`),
  measured in `data/tr-tree-vs-diyanet-second-witness.json`. The tree side is
  byte-equal to the held o1n-3 store on the day row at all three settlements
  (8/8 columns each). Medians over the 31-day November overlap, tree minus
  Diyanet: isha **+11 Istanbul / +11 Ankara / +10 İzmir** (day-row deltas +11,
  +11, +10; ranges +10..+12, +10..+12, +10..+11) — inside the held +7..+11
  family band and matching the tree-scale median +11, on a second measurement
  instant (14:45Z vs O1n-39's 11:22Z) and two NEW settlements (Ankara, İzmir).
  Supporting columns, same overlap: dhuhr +6/+6/+6, asr +7/+7/+7, maghrib
  +1/+1/+1, sunrise 0/0/0 — consistent with the o1n-26 crosscheck medians
  (dhuhr +5, asr +6, maghrib 0) within rounding. New measurement: the tree's
  İMSAK runs 16-17 min EARLIER than Diyanet's İmsak at all three cities
  (median -17/-16/-16) while the tree's Sabâh equals Diyanet's İmsak (0/+1/+1):
  the two surfaces carry different imsak families, not just isha. Diyanet's
  side still serves its held line byte-equal (Istanbul 19:18 yatsı on the day
  row, equal to O1n-39's 11:22Z row).
- Verdict: finding re-measured, no adjudication, still a family dispute. The
  yearly-table-on-district-page route is banked as the future 2027 witness
  point (fetch the same three districts after December).



### BG — Grand Muftiate of Bulgaria: live tables, multi-year Wayback accrual, stability (15:00-15:35Z)

Surface: `grandmufti.bg` (Joomla, bg/tr/en/ar). The homepage carries a live Sofia
widget (12 Nov 2026: 5:35 / 7:06 / 12:16 / 14:50 / 17:15 / 18:40); the dedicated
page `/bg/home/vremena-za-namaz.html` server-renders the CURRENT month's table for
the default town Sofia (48-town selector, month selector, NO year selector — the
year is pinned server-side, so no 2027 tables are reachable on this surface).
Captures: `captures/bg-grandmufti-home-*.gz`, `bg-grandmufti-vremena-za-namaz.html.gz`
(November 2026, 30 rows), `bg-grandmufti-tr-namaz2.html.gz` (Turkish edition
Namaz Vakitleri, same 30 rows, same values; column named İmsak — so the Bulgarian
"Зора" column is the imsak column, not a separate fajr line). The per-town tables
for the other 47 towns are POST-only through the month/town selector — not taken
(forms discipline); route recorded as open.

Accrual (Wayback, one probe per thread, no 429s): the route is archived monthly
since 2020-09 (CDX banked, 30 monthly captures 2020-09..2026-07). Harvested four
dated tables, all Sofia default: Nov 2020, Nov 2022, Apr 2024, Jan 2026
(`captures/bg-grandmufti-wayback-*.html.gz`), 151 dated rows total with the live
November 2026 table.

Fit (Sofia published point 42.6983/23.3219, Europe/Sofia, engine adhan 4.4.6 via
the o1n-3 core; per-table scores in `data/bg-grandmufti-sofia-margins.json`):

| table | imsak vs fajr 18° | güneş vs sunrise .833° | öğle vs transit | ikindi vs asr 1 | akşam vs sunset | yatsı vs isha 17° |
|---|---|---|---|---|---|---|
| 2020-11 | -1.0 | -7.3 | +4.8 | +4.9 | +7.5 | +0.5 |
| 2022-11 | -1.5 | -7.9 | +4.7 | +5.3 | +8.0 | +0.9 |
| 2024-04 | -0.7 | -6.8 | +5.0 | +3.2 | +6.1 | -1.3 |
| 2026-01 | -0.6 | -6.6 | +4.7 | +2.6 | +5.6 | -1.4 |
| 2026-11 | -1.6 | -7.9 | +4.7 | +5.3 | +8.0 | +0.9 |

Convention (per-column medians, minute rounding): imsak = fajr 18° minus ~1;
güneş = sunrise 0.833° minus 7; öğle = transit +5; ikindi = asr Shafi +3..+5
(seasonal); akşam = sunset +6..+8; yatsı = isha 17° +0±1.5. The residual
seasonal component (±1.5 min, ikindi/akşam/yatsı covarying) is an engine-family
signature (Diyanet-lineage solar core vs adhan), not a regime change. A printed
day-length solve at true Sofia measures +14.7 min guard inflation (the -7/+8
pair), confirming the pair is a convention, not coordinates (`data/bg-grandmufti-sofia-margins-solved.json`
holds the rejected solved-point attempt and why).

STABILITY FINDING: November 2022 and November 2026 tables are CELL-IDENTICAL
30/30 rows x 7 columns (`scripts/compare-front2-bg.py`); November 2020 differs
from live only by the expected one-day solar drift across six years. One
generation, no dated regime change 2020-2026, so all five tables share one
recipe. Verdict: BG Sofia authority line is stable-across-6 (multi-year accrual
banked), recipe above; forward-longevity upgraded from single-cycle to
stable-across-6 for this surface. The 47 non-default towns remain open
(POST-only route); any 2027 edition awaits the year unpinned (re-check January).



### RS — Mešihat IZS negative + salahtimes platform + Diyanet-abroad absent (15:05-15:50Z)

Authority route: `rijaset.rs` (Rijaset Islamske zajednice Srbije) and
`muftijstvo-beogradsko.rs` — NEITHER serves a prayer-times table. The "Vaktija 2025"
post (`rijaset.rs/2025/03/02/vaktija-2025/`, capture banked) carries two
Facebook-sourced images only; both OCR-negative even at 3x upscale (photos, not
tables; OCR attempts kept). Site searches negative (Bulgarian-side no-results
markers recorded). `vaktija.rs` is a parked domain. Diyanet-abroad does NOT list
Serbia in its country walk (banked `tr-diyanet-countries.json` from O1n-39).
Honest negative: no RS authority table found under vaktija/vakat/namaz routes in
Serbian or Turkish; the Mešihat's printed Vaktija booklets are not served as web
tables. Open: any mosque-level mejlis page in Novi Pazar/Sandžak.

Platform surface banked: `salahtimes.com/serbia/novi-pazar` and `/serbia/belgrade`
(November 2026, 30 dated rows each, `data/rs-salahtimes-{novi-pazar,belgrade}-nov2026.json`).
Fit at published points (engine adhan 4.4.6, `data/rs-balkans-fits.json`): every
column is adhan-exact (all medians within ±0.25 min, IQR < 1) EXCEPT asr, which
sits +39.0/+39.5 min after the Shafi line at both cities — an unresolved asr
family (not Shafi, not Hanafi textbook; recorded as measured). The month selector
is JS-pinned server-side and the PDF/Excel download endpoint is Cloudflare-gated
(403 recorded, not solved); February 2027 is listed in the month options — the
platform's year-2 lead — but is not reachable without a browser session.

### BA / SI / MK — Diyanet-abroad second witnesses, four capitals (15:12-15:50Z)

Fresh district-page fetches 2026-11-12T15:12Z (monthly Nov 12..Dec 12 plus yearly
2026-01-01..2026-12-31, 365 rows each — captures `tr-diyanet-{bg-sofya,ba-sarajevo,si-ljubljana,mk-skopje}-2026-11-12T1512Z.html`,
measurement `data/tr-diyanet-balkans-walk.json`, margins in `data/rs-balkans-fits.json`):

- Sofya (12237): imsak ~0 on 18°, güneş −7.2, öğle +4.9, ikindi +4.5, akşam +7.1,
  yatsı +0.2 (17°).
- Sarajevo (12029): same shape, yatsı −5.4 → isha 16°.
- Ljubljana (16269): same shape, yatsı −5.6 → isha 16°.
- Üsküp/Skopje (15298): same shape, yatsı +0.1 → isha 17°.

THE ISHA SPLIT MEASURED AT TREE SCALE: Diyanet's abroad line switches isha 17° →
16° between Sofia/Skopje (42.7N/42.0N) and Sarajevo/Ljubljana (43.9N/46.1N),
reproducing EU-DIYANET-16-ISHA-SPLIT on fresh same-day served data at four new
capitals; the threshold sits between 43.9N and 42.7N. The common temkin shape
(imsak ~0 on 18°, güneş −7, öğle +5, ikindi +4.5, akşam +7) matches the BG
Muftiate's convention within ~1 min per column — the BG authority and Diyanet
abroad are ONE family, cross-confirmed cell-level on the Sofia overlap
(Nov 12 row: Diyanet 05:37/07:07/12:16/14:50/17:14/18:39 vs Muftiate
05:35/07:06/12:16/14:50/17:15/18:40; deltas ≤2 min on six columns).

These four tables are the second-witness base for the BA (Sarajevo), SI
(Ljubljana) and MK (Skopje) native-authority comparisons in later sections.



### HR — MIZ Zagreb via vaktija.eu, current month banked + fit (15:35-16:00Z)

Route: the official site `islamska-zajednica.hr` (Islamic Community in Croatia)
serves NO table itself — its homepage embeds `vaktija.eu/bs/zagreb` in an iframe
(the "VA KTIJA" block; the site's own /kategorija/vaktija posts stopped at
ramazan 2025, monthly posts at 2021 — captures banked). vaktija.eu IS the live
MIZ Zagreb surface: Next.js app serving the current month server-side with the
PUBLISHER'S OWN coordinates in the payload (Zagreb 45.815, 15.9819, Europe/Zagreb).
Banked: November 2026, 30 dated rows with Hijri labels
(`captures/hr-vaktijaeu-zagreb-2026-11-12T*.html.gz`, normalized rows
`data/hr-vaktijaeu-zagreb-nov2026.json`; Google's AI-overview citation of this
exact table confirms the surface is the one MIZ publishes).

Fit at the published point (engine adhan 4.4.6, `data/hr-vaktijaeu-zagreb-margins.json`):
fajr −3.7 on 18°, sunrise −4.4 on 0.833°, dhuhr +2.3, asr +0.05 (Shafi EXACT),
maghrib +4.9, isha −12.8 on 17° → **isha ≈ 16°** at 45.8N. Recipe: fajr ~18.4°
(or 18° minus ~4), sunrise ~0.833° minus 4, dhuhr transit +2, asr Shafi, maghrib
+5, isha 16°. This is a distinct convention from the Diyanet/BG temkin family
(smaller guards, exact asr) — the Sarajevo lineage continues north: Zagreb serves
isha 16° exactly as Sarajevo and Ljubljana do under Diyanet-abroad.
Accrual gates recorded: month routes are server-pinned (?month=, /_next/data
.json?month= — all ignored, pinned to 2026-11-01, captures banked); the month
advances server-side, so December arrives at the same URL; the platform's
directory API requires a q parameter and returned empty lists for six city
probes (recorded). Diyanet-abroad does NOT serve Croatia (country-walk negative).



### ME — Podgorica via vaktija.eu, current month banked + fit (15:50-16:05Z)

The Montenegro authority domains (islamskazajednica.me, medzlis.me,
medzlis-podgorica.me, ijcg.me) do not resolve — negative. The live Podgorica
surface is the Zagreb-platformed **vaktija.eu/bs/podgorica** (location id 463,
publisher's own coordinates 42.4304/19.2594, Europe/Podgorica): November 2026,
30 dated rows banked (`captures/me-vaktijaeu-podgorica-*.html.gz`,
`data/me-vaktijaeu-podgorica-nov2026.json`).

Fit at the published point (`data/me-vaktijaeu-podgorica-margins.json`): fajr
−5.3 on 18°, sunrise −3.3, dhuhr +0.4, asr −4.0 (EARLIER than Shafi — a distinct
shadow convention, recorded as measured), maghrib +2.0, isha −1.9 on 17°.
vaktija.eu carries per-city recipes (Zagreb and Podgorica differ in every
guard) — the platform is a carrier for each majlis's own line, not one
generator. Held BA-SARAJEVO-PODGORICA community-board line gets this platform
witness; the Mešihat IZ Crne Gore print remains open (no resolvable domain;
searched vaktija/islamska zajednica routes in Montenegrin).



### SI — Islamic Community Slovenia: vaktija.si open feed, Nov+Dec banked + fit (16:00-16:20Z)

Route: `islamska-zajednica.si` (the Islamic Community in the Republic of
Slovenia) links its official vaktija at **vaktija.si** — a React SPA whose data
API is OPEN: `https://www.vaktija.si/api/v2/feed` (67 KB JSON, capture banked).
The feed carries: serverTime; SIX cities (celje, jesenice, koper, ljubljana,
maribor, novo_mesto) each as a PER-CITY CORRECTION VECTOR on a Ljubljana base
(e.g. Jesenice +3/+3/+2/+1/+1/+1, Maribor −4/−4/−5/−5/−5/−5); and TWO month
tables — November 2026 AND December 2026 — i.e. the year-2 gate is already
served by the authority itself (61 dated Ljubljana rows banked:
`captures/si-vaktijasi-feed.json`, `data/si-vaktijasi-ljubljana-rows.json`).

Fit at Ljubljana (46.0569/14.5058, engine adhan 4.4.6,
`data/si-vaktijasi-ljubljana-margins.json`): fajr −5.0 on 18°, sunrise −5.3,
dhuhr +2.5, asr +1.7, maghrib +6.4, isha +5.2 on 17° (≈17° + 5 guard, NOT 16°).
CONFLICT-CLASS PAIR measured: the SI authority's own Ljubljana line (isha 17°
+5) versus Diyanet-abroad's Ljubljana (isha 16°, −5.6 on 17°) differ on the isha
family at the same city — a real two-line split, recorded, owner-ruled like
every family dispute; the other four columns differ by ≤3 min. The 6-city
correction model means the whole Slovenian surface is ONE recipe + published
integer vectors — the provenance is as clean as the Balkans gets.



### XK — KBI Kosovo Takvimi: current 2026 edition banked + 2023 pair, no 2027 yet (16:20-16:50Z)

Route: the Dituria takvimi media API at `dituriaislame.com/wp-json/wp/v2/media?search=takvimi`
(banked, 6 items) — the o1m-53 watch record's surface, re-confirmed: four edition
dates 2022-12-30 (2023), 2023-12-27 (2024), 2026-01-14 (2026); NO 2027 edition
served as of 2026-11-12T16:20Z. The publisher's own domain is bislame.com
(printed on the 2026 colophon: Kryesia e Bashkësisë Islame të Republikës së
Kosovës, Prishtinë). The 2026-12-28 watch gate (window 2026-12-27..2027-01-20)
stands unchanged.

Banked CURRENT tables: `takvimi2026vaktet.pdf` (31 pp) and `takvimi2023vaktet.pdf`
(28 pp), both with clean text layers — 334 dated rows of 2026 and 350 of 2023
(`data/xk-takvimi-2026-rows.json`, `data/xk-takvimi-2023-rows.json`; some month
pages drop wrapped rows — honest counts recorded). The 2026 print carries a
PROVENANCE STATEMENT: the calendar follows "të dhënat zyrtare të Bashkësisë
Islame të Turqisë" (the Turkish official data) plus the five-decade practice of
Hajrullah ef. Hoxha — the Diyanet lineage printed in the document itself.

Fit at Prishtina 42.6629/21.1655 (engine adhan 4.4.6, `data/xk-takvimi-margins.json`):
sunrise −7.0, dhuhr +4.1..+4.2, maghrib +8.1..+8.2, isha +10.1..+10.3 on 17°,
imsak −5.0 on 18°, sabah +15 after imsak. The 2023 and 2026 editions fit
IDENTICALLY within 0.2 min on every column — one engine, one convention, two
years (a second-cycle pair, not single-cycle anymore). OPEN MECHANISM ITEM: the
asr column drifts seasonally (+2 winter..+10.6 summer on Shafi), and imsak/isha
carry the same ±3 seasonal component; a latitude solve from the printed day
lengths recovers 42.9 N (Prishtina within the ±7 guard model, day-length
inflation +14 min), so the drift is the takvimi's own solar engine, not a
different point — recorded as measured, reproduction error ≤3 min on asr, ≤1.5
elsewhere. Diyanet-abroad does NOT serve Kosovo (country-walk negative).



### MK — Skopje: native authority negative, two platform witnesses banked (16:50-17:05Z)

Native route: the Macedonian Islamic Religious Community's domains do not
resolve (ivz.gov.mk, islamiccommunity.mk, irz.mk, medzlis.mk, hjmeti.mk — all
dead; islam.mk is an under-construction stub; search threads hit engine blocks,
recorded). Honest negative for the MK native surface.

Banked witnesses: (1) Diyanet-abroad Üsküp/Skopje 15237→15298 (fresh monthly +
yearly, second witness for the Diyanet family line: isha 17° at 42.0N, see the
BA/SI/MK section above); (2) **vaktija.eu/bs/skopje** (location id 3817,
publisher's own coordinates 42.013055/21.438247): November 2026, 30 dated rows
banked (`data/mk-vaktijaeu-skopje-nov2026.json`). Fit at the published point
(`data/mk-vaktijaeu-skopje-margins.json`): fajr −0.2 on 18°, sunrise +1.4,
dhuhr +1.1, asr −6.2 (early-of-Shafi family, like Podgorica), maghrib −0.2,
isha −3.7 on 17° (≈16.8°). The two witnesses DISAGREE on asr (Diyanet +4.6 vs
vaktija.eu −6.2 — a 10.8-minute split on the same city) — a conflict-class pair,
recorded, owner-ruled.



### BA — Riyaset Takvim SOLVED: text-layer parse, printed recipe, 2024→2025 regime change (16:50-17:40Z)

The predecessor's in-flight parser (hour-grid inference) was replaced with a
line-DP parser (`scripts/parse-ba-takvim2.py`; the broken draft and its two
garbage row files were deleted per session hygiene). The Riyaset annual takvim
grammar: seven columns (zora, izlazak, podne, ikindija, akšam, jacija, kibla),
each printing "H M" only when the hour changes and a bare "M" otherwise, hours
carrying forward; weekday validated against the civil date (the print itself
carries one error: 2026-08-31 prints Ne, civil Monday — recorded).

Rows banked: **2026: 365/365** (`data/ba-rijaset-2026-rows-dp.json`), **2024:
364/366, zero faults** (`data/ba-rijaset-2024-rows-dp.json`). The 2025 PDF is
image-based from page 12 (46 pp; the predecessor's page images remain in work/
ba25-p16/ba20-*); its text pages 3-11 carry NO month tables but DO carry the
complete printed RECIPE (a rarer capture than any table):

- zora/fedžr: Sun **18°** below the east horizon (2025 edition: NO zora temkin).
- izlazak/sunrise: astronomical minus **6 min temkin**.
- podne/zuhr: transit + **1-2 min** (zeval).
- ikindija/'asr: shadow = object length (Shafi), no temkin.
- akšam/magrib: sunset (34' refraction + 16'1.5" solar radius) + **6 min temkin**
  "for the relative altitude of 920 m".
- jacija/'išâ: Sun **16°** below the west horizon.
- Hijri months follow "proračun Predsjedništva vjerskih poslova Republike
  Turske (Dijanet)" — the Diyanet lineage in print.

My fits agree with the printed recipe to ≤0.5 min on every column
(`data/ba-rijaset-sarajevo-margins.json`, Sarajevo 43.8563/18.4131): 2026 zora
+0.05 on 18°, izlazak −6.17, podne +0.97, ikindija −0.09, akšam +5.88, jacija
−6.28 seasonal = **16°**. DATED REGIME CHANGE between the 2024 and 2025
editions: the 2024 fit reads zora −6.3 (= 18° with the −6 temkin, removed in
2025) and jacija −0.1 (= **17°**, changed to 16°). Never blend: 2024 = {18°−6,
sunrise −6, transit +1, asr Shafi, sunset +6, isha 17°}; 2025/2026 = {18°,
sunrise −6, transit +1, asr Shafi, sunset +6, isha 16°}. Cross-witness on the
Diyanet Sarajevo November overlap (31 days): rijaset-minus-diyanet medians
zora 0, izlazak +1, podne −4, ikindija −5, akšam −1, jacija 0 — same angles,
Rijaset carrying the smaller temkin. BA's Riyaset line is proven-to-2026 with a
solved printed recipe; year-2 gates: the 2027 edition PDF (published late
December, per the 2023-12-27 and 2026-01-14 edition dates) and the image-only
2025 pages (OCR continuation item, work/ba25-*.jpg ready).



### GR-ATHENS-STATE — media-API accrual recheck + same-generation PDF witness (11:48-11:52Z)

- Target 4 recheck: the state mosque's media API
  (`www.mosqueofathens.gov.gr/wp-json/wp/v2/media?per_page=100`, capture
  `captures/athens-media-p1.json.gz`) still shows NOTHING after 2026-02-19T14:20Z. The
  February batch is richer than the held note recorded: the 18 Feb images/videos plus THREE
  Ramadan 2026 timetable PDFs uploaded 2026-02-19T14:19-14:20Z — Arabic, English and a Greek
  ΡΑΜΑΖΑΝΙ2026 edition. No daily, monthly or yearly publication since Ramadan: the accrual
  negative stands, refined to the exact newest instant (2026-02-19T14:20:24Z).
- The English edition (`Ramadan_Prayer_Timetable_2026_EN.pdf`) carries a full text layer:
  29 dated rows (1 Ramadan Thu 2026-02-19 .. 29 Ramadan Thu 2026-03-19), six columns
  (Start Fast, Sunrise, Dhuhr, Asr, Maghrib/Iftar, Isha), Eid 20/21 Mar. The held bank
  (o1m-15 `gr-athens-mosque-ramadan-1447.json`, from the Untitled.png image) is CELL-IDENTICAL:
  174/174 cells equal, zero moving, zero diffs (`data/athens-ramadan-pdf-diff.json`). One
  computed generation: the PDF is a second FORMAT witness of the held print, no lift. The
  Arabic edition captured; its RTL text extraction mangles the Hijri-day column (1/29 rows
  parsed) — open formatting item, its times are the same print.
- Held recipe untouched (fajr 16.95 / isha 16.65 on the image reading). Verdict: witness
  banked, accrual negative re-confirmed. Next accrual gate: any non-Ramadan upload.

### BA — the image-only 2025 Takvim pages OCR'd and parsed: 365/365 rows (2026-11-12, wave o1n-49, UTC)

The successor list's open item is closed. The 2025 PDF's month tables (image-only pages
22, 24, ..., 44 of the 46-page file) were rendered and read through the local Vision
binary in two passes — ocrboxes scale 2 (base 1224x1584) and scale 4, all 35 pages
12-46 (`work/ba25-ocr/pNN-s2.txt` + `-s4.txt`, journals inside the directory; pages
split for resumability under `work/ba25-pages/`).

- Parser: `scripts/parse-ba-2025-ocr.py` — the same seven-column hour-carry grammar as
  the banked text-layer parser (zora, izlazak, podne, ikindija, akšam, jaćija, kibla;
  "H M" when the hour changes, bare "M" otherwise), applied to OCR box reads: rows
  banded by y inside the time-column span (pitch ~27.5), cells assigned by x-band,
  scale2+scale4 votes per cell, glued 4-digit tokens split ("2038" = 20:38, the July
  failure mode), weekday validated against the civil 2025 date.
- Rows banked: **365/365, ZERO faults** (`data/ba-rijaset-2025-rows-ocr.json`; the
  per-month page map and Hijri-day metadata included). All 365 printed weekdays match
  the civil calendar — the print self-certifies the parse. One predecessor note
  resolved: the earlier OCR-negative was on two Facebook event photos (pages 16/20
  embedded images), not on the table pages.
- Fits (`scripts/fit-ba-2025.mjs`, engine adhan 4.4.6 via the o1n-3 core, Sarajevo
  43.8563/18.4131, Europe/Sarajevo; `data/ba-rijaset-2025-margins.json`):
  - **Regime B (2025/2026 post-change) on the 2025 rows, full year**: zora median
    +0.07 on 18° (365/365 within-1, worst 0.8), izlazak −0.32 on −6 (296/365, worst
    2.2), podne −0.02 on transit+1 (365/365), ikindija −0.15 on Shafi (281/365,
    worst 2.7), akšam −0.33 on +6 (330/365, worst 2.3), jaćija −0.21 on 16° (301/365,
    worst 2.2). Every median within half a minute of the printed recipe — the
    printed-recipe-vs-fitted agreement extends to the 2025 edition. Per-month scores
    in the same file; worst month column 2.7 (October ikindija), no gross faults.
  - **Regime A (2024 pre-change) as a CONTRAST on the same rows, never blended**:
    zora would read +6.07 (the removed temkin) and jaćija −6.38 (17° vs 16°) — the
    dated 2024→2025 change re-quantified on the new rows. With this file the two
    regimes are now each fitted on their own edition: 2024 = regime A
    (`ba-rijaset-sarajevo-margins.json` "2024"), 2025 = regime B (this file),
    2026 = regime B (`ba-rijaset-sarajevo-margins.json` "2026").
- First-row cross-edition check: 2025-01-01 and 2026-01-01 print identical values on
  all seven columns (05:37/07:15/11:51/14:01/16:25/17:52/08:31) — one generation,
  as the regime analysis said.

### GR-ATHENS-STATE — the Arabic RTL edition resolved: 29/29 dated rows, 174/174 cells equal to EN (2026-11-12, wave o1n-49, UTC)

The inherited open formatting item is closed with both required reads banked.

- Why the predecessor's parse mangled: the whole Arabic table extracts as ONE line,
  and the Arabic tokens carry Unicode PRESENTATION FORMS (ﻣ FEE3 et al.) that defeat
  plain string matching. `scripts/parse-gr-arabic.py` normalizes NFKC and parses the
  single line with a global row regex.
- Read 1 (text layer): 29/29 rows — Hijri day, Gregorian date, weekday letter, six
  times; all 29 weekday letters certify against the civil dates (2026-02-19 Thu ..
  2026-03-19 Thu).
- Read 2 (column-aware OCR, multi-read consensus): ocrboxes scale 2 + scale 4 on the
  PDF page (`work/gr-ar-ocr/ar-s2.txt`, `ar-s4.txt`), time boxes grouped into six
  column bands by x and 29 rows by y, per-cell votes across the two scales. The
  Arabic table lays its columns right-to-left, so the OCR read order is isha..fajr —
  reversed on comparison, the two reads agree **6/6 cells on all 29 rows**.
- Cell-compare against the EN edition's banked rows: **174/174 cells identical**
  (`data/gr-arabic-ramadan-2026-rows.json`, "en_cell_compare"). The Arabic PDF is the
  same computed generation as the EN PDF and the held image print — a THIRD format
  witness of one line, no lift. The Eid al-Fitr prayer-times block (20/21 March,
  07:00/07:30/08:00) is printed in the Arabic edition's footer as well, recorded in
  the raw extract.
- Banked: the rows JSON carries both reads per row (text + OCR), the reconciliation
  block (empty — zero disagreements), and the EN compare. Held recipe untouched.

