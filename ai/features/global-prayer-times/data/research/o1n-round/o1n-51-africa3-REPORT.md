# REPORT.md — o1n-51-africa3 (wave O1n-51, round o1n, session four)

Wave O1n-51, Africa round 3, opened 2026-11-12T16:12Z UTC. Workspace
`$HOME/athan-gitree/census/o1n/o1n-51-africa3/`. The repository was never
written; nothing under /tmp; no subagents deployed; no login, form POST,
captcha or challenge touched; Wayback one probe at a time, stopped on the
first failure; every image/PDF read with the local Vision fast binary at
`$HOME/athan-gitree/census/tools/ocr`; engine of record adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`. Timestamps UTC.
Inherited state read first: CONSOLIDATION.md blocks O1n-34 and O1n-35 and
both waves' REPORT.md negatives; no banked front was redone.

## Front 1. Cote d'Ivoire — COSIM dated print found (Ramadan 1439); AEEMCI site tree closed; roll watch re-verified

### 1a. COSIM: a dated Ramadan 1439 calendar PDF (NEW dated artifact)

TinyFish search surfaced `media-files.abidjan.net/document/docs/Calendrier(218).pdf`
linked from the abidjan.net document page 16517 ("Le calendrier islamique 1439
Hégire", 17 May 2018): a one-page COSIM Ramadan 1439 (2018) calendar, scan,
400 KB. OCR (fast level, two renders, 2600 px and 3400 px):

- Columns: Gregorian day number, **Sobh** (suhur end), **Maghreb** (iftar).
- Base zone printed: Abidjan-Adzopé-Afery-Agboville-Anyama-Bingerville-
  Bougouanou-Daoukro-Prikro; Sobh holds 04h42 through most of the month
  (04h43-04h44 at month end), Maghreb climbs 18h26 → 18h32.
- A coefficient block "Pour les autres villes voir les coefficients" prints
  per-city minute offsets: Bondoukou +14, Bouaké/Grand-Lahou +06,
  Yamoussoukro-class +11, Korhogo/Tengrela +16, Zuénoula-class +12, one zone
  +14, Duékoué-class +10, one zone +18; several zone names unresolved at
  fast OCR.
- Verdict: the **first dated COSIM print captured** (authority tier). The
  scan is noisy: cell-exact rows are NOT proven; the full parse is an open
  item for a strip-OCR successor. Banked as
  `data/ci-cosim-1439-structure.json` with the confident cells only.
- Sibling route closed honestly: `Calendrier(217).pdf`/`(220).pdf` are BRVM
  dividend calendars — the docs numbering is abidjan.net's media counter,
  not a COSIM series. The 2018 dossier (3778-ramadan-2018) is the only
  dossier linking a calendar document. Named leads: the Scribd
  "Calendrier Cosim Ramadan 2026 1" document (client-challenge wall,
  never solved) and per-year abidjan.net Ramadan dossiers.

### 1b. COSIM live roll watch — re-verified, still not rolled

`cosim-ci.org/ressources/calendrier` fetched 16:14Z: the Inertia props still
carry exactly one `calendrier` object, `calendrier/calendrier_1792092544.jpeg`
(id 20), and the sheet JPEG itself re-fetched and OCR'd: **"JOUMADA UULA"** —
the Jumada al-Oula 1448 edition still stands at 16:14Z, ~10 h after O1n-34's
three checks. The Jumada al-Thani roll watch stands.

### 1c. AEEMCI — site tree, sister domain, publications: all closed

- All ten pages walked live (`aeemci.org` home + activity/cv,
  activity/formation/religious, activity/inventory, aeemci/Bureau,
  aeemci/cartographie, aeemci/Organes_Centraux, aeemci/stories,
  mediatheque/images, mediatheque/videos): the nav set is exactly O1n-34's;
  **zero timetable routes**. Five publication-style paths probed
  (publications, publication, documents, ressources, mediatheque): all 404.
- The home page's sister link `www.inscription-aeemci.com` (the registration
  platform) is **dead at every spelling** (curl and TinyFish both fail
  resolution/fetch): a stale link, recorded.
- Publications/organ: the organ lineage is the historic **AEEMCI annual
  Islamic calendar** (feast dates, documented 1992 in the ZMO Islam in
  Africa notebook, islam.zmo.de/s/afrique_ouest/item/62648 — "l'article est
  entièrement consacré au calendrier islamique mis au point par l'AEEMCI") —
  feast dates, never prayer times. Today the calendar channel is the
  Facebook (aeemcice) and WhatsApp channel, both named leads (login-walled,
  never fetched). O1n-34's "live and tableless" verdict stands, sharpened.

### 1d. The "national council" lineage

The dispatch's "Ligeled" resolves only to Danish-language noise (literal
search) and to dead domains (ligeled.ci/.org/.com/.net all unresolvable);
read as the Ivorian national-council lineage: the **Conseil National
Islamique (CNI)**, created 1993 as the federating council (Wikipedia;
gouv.ci partnership documents name it as signatory) has **no web surface**
(cni.ci, conseilnationalislamique.ci unresolvable). **CINIR** (cinir.org,
founded 2023) probed live: a Christian evangelical confederation
("mouvement ... évangélique", "Nos églises") — a non-lead, recorded. lipci.org
unresolvable (the LIPCI's public traces stay Facebook/press).

## Front 2. Senegal beyond Dakar — CERFI formats are one Dakar class; MOI has no religious directorate

- **CERFI home re-walked live**: the SPA carries the 152-ville selector plus
  the Dakar hebdo PDF list in FOUR print formats (10x1, 6x1, 4x1, 2x1),
  dated through 2027-01-22. Format-variant probe (2x1/6x1/10x1 for the week
  2026-11-13): identical "région de Dakar" headers, the 2x1 header printed
  twice (a 2-up of the same sheet) — no new city, no new axis; the held
  10x1 bank covers the data class. Fast OCR cannot resolve the variant
  sheets' table cells (artifacts banked).
- **Per-city annual negative**: publication-style paths (publications,
  bibliotheque, cheikh-moussa-kamara, mediatheque, pages, annuelles, annuel)
  all 404 on cerfi.sn; the API week stays the only per-city surface.
- **Cheikh Moussa Kamara library**: no own web surface; Facebook group and
  press traces only (Ganguel). Named lead, never fetched through login.
- **Senegal ministry of interior**: interieur.gouv.sn walked live (387 KB
  home; directions = DAF/DAGE/DPC; attached bodies = ASP and DACORE): **no
  religious-affairs or cultes directorate exists on the ministry's web
  surface**; no prayer-calendar route anywhere in the nav.
- Named leads: CONACOC (moon-sighting communiqués, feast dates not times),
  the community Facebook pages "Heures de prières Dakar" and
  islaminvocationetrappels (weekly times posts, login-walled), namazvakti
  Dakar monthly (platform layer).

## Front 3. East Africa — the EIASC breakthrough (three live domains, on-site prayer-times plugin); Somalia's ministry site found

### 3a. Ethiopia: the Ethiopian Islamic Affairs Supreme Council is LIVE on three own domains

The held record ("eiasc.et a parked Plesk default") is superseded:

- **ethiopianmajlis.org.et** — the council's own WordPress site, live
  16:22Z (282 KB home): about/who-we-are/what-we-do, leadership, services
  (hajj-umrah, halal certification, community registration), news, and the
  twelve regional majlis pages (Addis Ababa, Afar, Amhara, Benishangul-
  Gumuz, Dire Dawa, Gambela, Harari, Oromia, Sidama, Somali-region,
  Southern, South-West, Tigray). **The home enqueues the WordPress plugin
  "daily-prayer-time-for-mosques"** (dpt.js 2023.03.20): an on-site
  prayer-times surface exists by plugin evidence; its monthly table loads
  via `admin-ajax.php?action=get_monthly_timetable` (named from the
  plugin's JS). A path-probe burst tripped the host's mod_security: 406 on
  REST/search/sitemap/unknown paths, then 403 from 16:31Z; backed off per
  discipline, no challenge touched. LEAD for a successor from a cooled IP.
- **Wayback** (one CDX probe + one archived page): the archived home's
  description embeds the DPT daily widget row "Fajr Salat:6:04 AM
  Time:6:45 AM Zuhr 12:16/1:30 PM Asr 2:51/3:30 PM Magrib 4:45 PM Isha
  6:14/8:00 Jumuah 12:16/1:30 PM" — the crawl-day (2023-02-03) azan+iqamah
  row for Addis Ababa, authority-by-publisher, witness class (one
  undated-axis day), never rows.
- **hajj.et** — the council's hajj portal (hajj-educations, hajj-status;
  login routes never touched). No prayer times.
- **eiasc-aic.org** — the council's Audit & Inspection Commission WP site
  (news through 2026-11-11). No timetable routes; REST 406-blocked.
- **eiasc.org.et** — resolves, bare nginx 404 on every route: registered,
  serves nothing. eiasc.et still the parked Plesk default.
- Languages: Amharic search (የኢትዮጵያ እስልምና ጉዳዮች ጠቅላላ ምክር ቤት + የሶላት ጊዜ)
  surfaced the council's own site first (found via Amharic), plus ETV
  YouTube statements and the justice.gov.et proclamation. Oromo phrasings
  not directly indexed by TinyFish; the Oromia regional majlis page is the
  named in-site route.

### 3b. Somalia: the ministry HAS a site now — mesa.gov.so, walked, no times

- **mesa.gov.so** (Wasaaradda Awqaafta iyo Arrimaha Islaamka — the Ministry
  of Endowments and Islamic Affairs, MESA) live 16:26Z: news posts through
  2026-09, services (nikaax, zakat, fatwas, mosque administration,
  madrasas, Quran competitions, hajj/umrah), events. **WP REST search is
  open on this host**: salaada, salaat, wakhtiga, ramadan, ramadaan, imsak,
  and Arabic جدول / إمساكية / مواقيت / صلاة — ZERO timetable content. The
  held negative upgrades from "no surface" to "surface walked, no times".
- diinta.so is an unrelated software-licensing hub. Somaliland's ministry:
  Facebook/YouTube/press only (slmra.org/.com dead). Puntland's: press only
  (.pl.so ministry candidates all NX).
- Somali phrasings searched: wasaaradda awqaafta, wasaaradda diinta iyo
  awqaafta, wakhtiyada salaada, goobjoog tracking pages.

### 3c. Djibouti and South Sudan — negatives sharpened once more

- **Djibouti**: the ministry of Islamic affairs and endowments is
  Facebook-only (page ministereAMCB, Arabic+French; login-walled, never
  fetched); awqaf.dj, mhai.dj, habous.dj re-probes all dead; lanation.dj
  still gone. French and Arabic searches land on platforms only.
- **South Sudan**: .ss-TLD probes (islamiccouncil.ss, ssic.ss, islam.ss,
  muslims.ss, moi.ss, iscs.ss, southsudanislamiccouncil.ss) and
  islamiccouncilofsouthsudan.org — all dead; the council's trace stays the
  Facebook page (ssichqs) and press.
- **Eritrea**: one more re-probe: no new surface; the mufti's public traces
  stay press/social.

## Front 4. Southern Africa — Botswana is the WIN (BMA authority surface); the other seven sharpened

### 4a. Botswana: the Muslim Association's own site carries a full multi-city year grid + three dated Ramadan editions (NEW dated surface, 12,041 rows banked)

`bma.org.bw` (the Botswana Muslim Association, Gaborone) — walked live
16:30Z:

- **/prayer-times/** embeds 397 div blocks (34 Botswana towns x 12 monthly
  tables, 8 columns: Sehri ends/Fajr begins, Sunrise, Zawwal, Shafi Asr,
  Hanafi Asr, Sunset, Maghrib, Isha). **12,041 rows banked**
  (`data/bw-bma-prayertimes-rows.json`; server-side gaps recorded: Ghanzi/
  Gweta/Hukuntsi missing December, Rasesa only Oct+Nov). No year printed
  anywhere: a year-blind leap-year edition (366 day-rows).
- **Fit at Gaborone** (adhan 4.4.6, Rounding.None, UTC+2 fixed,
  `scripts/bma-fit.mjs`): fajr 18.0 deg (354-360/366 within-1), sunrise
  computed (366/366), zawwal transit (366/366), asr Shafi/Hanafi pair
  printed (365-366/366), sunset computed (365/366), maghrib sunset+3
  (365-366/366), isha 17.0 deg (366/366) — ALL solar columns carry the
  classic round-up ceiling (~+0.5). The between-year test is BELOW the
  1-minute print floor: 2024, 2026 and 2028 all fit at 366/366 on the
  solar columns; the 2024 fit is marginally best (fajr 360/366, maghrib
  366/366) so the served generation reads as the 2024 edition, never
  proven as either.
- **/ramadhan-time-tables/** hosts THREE dated Ramadan editions, all
  captured and OCR'd (fast level, artifacts + edition headers banked):
  Ramadan **1441 (Apr-May 2020)**, **1442 (Apr-May 2021)** and **1443
  (Apr-May 2022)**, three cities each, multi-city column sheets. The
  cell-exact row parse (wide columns) is the named open item.
- Tier authority (the association's own site); grade candidate. This is
  Botswana's first authority surface — the country held only platform
  layers before.

### 4b. The other seven — negatives sharpened with new routes

- **Zambia**: re-probed once more; platforms only (the Lusaka Barkaatiyah
  mawaqit board remains the dated layer). The masjidtimetable.com
  aggregator sits behind a Cloudflare challenge, never touched.
- **Zimbabwe**: no council surface under new name variants (sicz.org.zw,
  islamiccouncilzimbabwe.org, supremeislamiccouncilzimbabwe.org all dead);
  the Harare Msasa board and Fazilet lines stand.
- **Angola**: Portuguese searches land on Brazilian platforms; cisa.ao
  still parked; Instagram-only mosques remain the leads.
- **Mozambique**: the councils publish official Ramadan calendars but only
  through walls: the CONSELHO ISLÂMICO DE MOÇAMBIQUE's "Calendário oficial
  de Ramadhan 1447" is a Facebook post (login-walled, named lead) and a
  CIMO (Congresso Islâmico de Moçambique) Ramadan 2026 calendar sits on
  Scribd (challenge-walled, named lead). The Nampula board stands.
- **Namibia**: the Windhoek Islamic Centre has no own site (Wikipedia +
  platform listings; a public Facebook group post asks where to find
  Windhoek Ramadan times — community hearsay that no public timetable
  exists).
- **Lesotho and Eswatini**: nothing found under English searches; no
  association domains resolve; the negatives stand with routes named.
- **Uganda note (read as Zambia's dispatch line)**: umsc360.com is the
  UMSC's app landing (Android listing, no prayer-times feature described);
  the UMSC district-council route yields no new surface this session.

## Front 5. Comoros — the closure attempt: coordinates FOUND, solar trio proven, twilight trio NOT PROVEN

The O1n-35 open items closed as far as the evidence allows:

- **The board coordinates exist**: the Sima board page's own props embed
  `latitude: -12.1992451, longitude: 44.2751395` (mosque ID 12787) — read
  from the held capture; the "no board coordinates" open item is CLOSED.
- **A SECOND Comoros board found and banked**: Mosquée TRAMBWE - Mdjoiezi
  (Grande Comore, slug `mosquee-trambwe-mdjoiezi-99999-comoros`), own
  coordinates -11.83602/43.31473, **366 dated rows banked**
  (`data/km-trambwe-calendar.json`).
- **One shared family generation**: TRAMBWE's 2026-01-01 row equals SIMA's
  on every column except shuruq (Sima's broken 4-value column; TRAMBWE's
  shuruq is clean computed sunrise).
- **Refits at the boards' own points** (`scripts/km-sima-refit.mjs`,
  `scripts/km-trambwe-fit.mjs`): shuruq = computed sunrise (TRAMBWE
  358/366 within-1), dhuhr = transit + 4 (TRAMBWE 325/366), maghrib =
  sunset + 3 (TRAMBWE 297/366; Sima sunset+4..5). BUT fajr (best 17.5
  deg, 165/366), asr (fails every Shafi/Hanafi pad; printed runs EARLIER
  than Shafi on parts of the year - impossible for one rule at one point)
  and isha (119/366 at the 19.75-deg bound) do NOT reduce to single
  angles: **the twilight columns are stepped/curated blocks**.
- Verdict: the mawaqit Comoros family is a curated PrayTimes-class board
  with a computed solar base and edited twilight/jama'ah blocks. The
  recipe is PARTIALLY proven (solar trio at the boards' own points), the
  twilight trio NOT PROVEN — sharper than O1n-35's full "not proven", with
  the mechanism named.
- The muftiate (muftorat) publishes rulings via press only (Jumu'ah fixed
  at 13:00); no own web timetable. Moroni's Grande Mosquée du Vendredi has
  no own site.

## Front 6. Madagascar beyond the capital — Mahajanga's two boards banked (732 rows); Toamasina/Fianarantsoa negative

- **TWO new Mahajanga mawaqit boards** found, fetched, calendars extracted
  and banked (both year-blind, 366 rows each, own coordinates embedded):
  - Mosquée **Tawhid** (tawhid-majunga-mahajanga-401-madagascar), point
    -15.724906/46.321792 — `data/mg-tawhid-mahajanga-calendar.json`,
    fit `data/mg-tawhid-fit-2026.json`: shuruq = computed sunrise
    366/366 within-1 at the board's own point; dhuhr/maghrib/isha carry a
    uniform ~+13 min pad on solar; fajr 16 deg 326/366; asr partial.
  - **Mosquée du Vendredi à Mahabibo**
    (mosquee-du-vendredi-...-mahabibo-market-401-mahajanga), point
    -15.717/46.32 — `data/mg-mahabibo-mahajanga-calendar.json`, fit
    `data/mg-mahabibo-fit-2026.json`: shuruq = sunrise 366/366 EXACT
    (mean 0.0); solar pads ~+15; fajr 19 deg 310/366 worst 10.
  - **Two distinct community lines at the same city** (Jan-1 rows differ
    per column; different pads) — recorded separately, never blended.
  - Tier community; grade community (fitted non-authority surfaces,
    curated-pad class like the Comoros family).
- **Toamasina and Fianarantsoa**: negative with routes. masjidbox slug
  probes (tamatave, toamasina, mahajanga, fianarantsoa) serve identical
  3.4 KB SPA shells — no boards at those slugs; mawaqit slug guesses 404;
  searches land on platforms (muslimpro, islamicfinder, athanpro,
  gotopray, quranmajeed, matwproject, prieres.date). The Antananarivo
  masjidbox bank (O1n-35) stands as the capital's line.

## Session mechanics

- Search engines: TinyFish carried every query this session (no DDG/Google
  challenge encountered); direct curl with a browser UA carried every
  fetch. Challenges RECORDED and never touched: Scribd client-challenge
  (twice), Cloudflare challenge on masjidtimetable.com, mod_security 406/
  403 walls on ethiopianmajlis.org.et and eiasc-aic.org, the WAF ban that
  persisted to session end (one cooldown retry at 16:47Z, still 403).
- Wayback: two probes total (one CDX on ethiopianmajlis, one archived-page
  fetch), both 200, no 429 seen; thread never had to stop.
- OCR: every PDF/image read with the local Vision fast binary — the COSIM
  1439 scan (2 renders), the CERFI variant sheets, 9 BMA Ramadan PDFs
  (+ strip crops), the COSIM current sheet JPEG.
- agent-browser: not needed this session (no JS-hidden table survived the
  static routes; the one candidate, masjidbox slugs, is a shell served to
  every slug).
- Captures: ~100 gzipped artifacts under captures/ (all bma-ramadan
  PDFs, PNG renders and OCR texts; COSIM sheets; CERFI variants; the
  mawaqit board pages for TRAMBWE/Tawhid/Mahabibo; the EIASC homes; mesa;
  BMA/CDX/wb captures). Nothing under /tmp; nothing in the repo.
- No subagents deployed; no login, form POST, captcha or challenge
  touched; the banned word never written; the round-mechanics exclusion
  bullet applied by reading; timestamps UTC throughout.

## Summary table

| Front | Result | Rows banked |
| --- | --- | --- |
| 1 Cote d'Ivoire | COSIM Ramadan 1439 dated print captured (parse open); AEEMCI tree closed; roll watch re-verified | 0 (artifact+structure) |
| 2 Senegal beyond Dakar | CERFI formats = one Dakar class; MOI negative; library negative | 0 |
| 3 East Africa | EIASC found live on 3 domains with an on-site prayer-times plugin (WAF-blocked mid-walk, lead named); Somalia ministry site found+walked (no times); Djibouti/SS/Eritrea negatives | 0 |
| 4 Southern Africa | BMA Botswana authority surface: year grid 34 cities + 3 dated Ramadan editions identified | 12,041 |
| 5 Comoros | Coordinates found; 2nd board banked; solar trio proven, twilight trio not proven | 366 |
| 6 Madagascar provinces | Mahajanga's two boards banked (distinct lines); Toamasina/Fianarantsoa negative | 732 |
| **Total** | **six fronts, one authority breakthrough (BMA), one council-domain breakthrough (EIASC), one ministry-site upgrade (MESA), Comoros sharpened** | **13,139** |




## Open-items closure (wave O1n-53, 2026-11-12, opened 17:47Z UTC) - the unparsed captures

Wave O1n-53 continued this workspace to close the two open parses O1n-51 banked
as debts: the BMA Ramadan editions and the COSIM 1439 first print. The
repository was never written; nothing under /tmp; no subagents; every image/PDF
read with the local Vision fast binary; Wayback untouched; timestamps UTC.

### Closure 1. COSIM Ramadan 1439 - parse CLOSED, rows banked, fit banked

The "noisy scan" reading was WRONG: `Calendrier(218).pdf` carries full embedded
vector text inside Form /TPL1 (zero images). `scripts/ci-cosim-parse.py` does
positional extraction (pypdf visitor), not OCR:

- **31 dated rows banked** (`data/ci-cosim-1439-rows.json`): 2018-05-16..06-15,
  all 31 French weekday abbreviations self-certified (Me=Wed..Di=Sun), dates
  consecutive, hijri day column 01..30 plus a second 01 (Shawwal 1, Eid row
  15 June). Row annotations preserved: hijri 7/15/23 carry stray symbol glyphs
  (PQ/PL/DQ), hijri 26 "Nt dest" (Night of Destiny), hijri 29 "Rch" (banked as
  printed).
- Columns: Sobh (04:42-04:44 stepped), Maghreb (18:26-18:32), and a THIRD
  column (19:24-19:32) the fast OCR had missed entirely - identified as ISHA
  by the fit.
- **Fit** (`scripts/ci-cosim-fit.mjs`, `data/ci-cosim-1439-fit.json`; adhan
  4.4.6, UTC+0, Abidjan [5.359952, -4.0084]): maghreb = sunset + 3 EXACT
  (30/30, worst 0, mean 0.0 - the same +3 pad class as BMA Botswana); isha =
  15.0 deg 30/30 within-1 (equivalently printed maghreb + 59, 29/30); sobh NOT
  a single proven rule: best 18.9 deg 28/30, fajr18-4min 28/30, a point+angle
  grid tops at 29/30 worst 2 - the printed sobh is a STEPPED constant
  (04:42 x13, 04:43, 04:44) quantized against the smooth curve; mechanism
  recorded as "fajr/imsak inside the 18-19 deg band with minute-step
  curation", single angle never proven.
- **Coefficient table CORRECTED from the vector text** (the earlier fast-OCR
  reading was wrong in every zone): H-02 Alepe/Abengourou/Bonoua/Nassian;
  H-04 Adiake/Aboisso/Agnibilikro/Tanda/Bouna; H-06 Bondoukou; H+04 Bouake/
  Grand Lahou/Katiola/Toumodi; H+06 Yamoussokro/Oume/Divo/Ferke/Sinematicali;
  H+08 Bouafle/Lakota/Gagnoa/Korhogo/Tieningboue; H+10 Sassandra/Guiberoua/
  Zenoula/Tingrela/Kolia; H+12 San Pedro/Daloa/Kani/Seguela/Morondo/Soubre;
  H+14 Dioulatchedougou/Djibrosso/Guinteguela/Madinani/Tabou/Goulia/Tieme;
  H+16 Touba/Man/Bako/Borotou/Duekoue/Guiglo/Booko/Koro/Odienne/Kotoula/
  Tienko; H+18 Danane/Seydougou/Koonan/Hounien/Toulepleu/Binhouye. Banked in
  `data/ci-cosim-1439-structure.json`.
- Verdict: FIRST DATED COSIM PRINT PARSED AND FITTED. Authority tier. Recipe:
  base Abidjan, maghreb sunset+3 exact, isha 15 deg, sobh stepped 18-19 band,
  per-city minute coefficients as tabled. One month, one year.

### Closure 2. BMA Ramadan editions - parses CLOSED, three-year family banked

Discovery that unlocked it: the SIX 1442/1443 "wide-column" sheets also carry
embedded vector text (pdfminer positional parse; the fast-OCR garble was
unnecessary). The THREE 1441 sheets are true image PDFs (vector OUTLINES -
glyphs as filled paths, zero text operators), so OCR was the only route there.

- **1442 + 1443 (six text sheets)**: `scripts/bma-ramadan-parse2.py` +
  `bma-ramadan-fit2.mjs` - 30 rows x 7 city-pairs per sheet, all 30/30
  weekday-certified (day1 = Wed 14-Apr-2021 for 1442, Sun 03-Apr-2022 for
  1443), 14/14 times per row. **180 dated rows, 2520 cells banked**
  (`data/bw-bma-ramadan-textparse.json`, `data/bw-bma-ramadan-rows.json`).
- **1441 (three scan sheets)**: band/chain-fitted row geometry self-aligned by
  the printed day-number tokens (day1 = Sat 25-Apr-2020 on all three);
  multi-variant Vision-fast OCR (raw/threshold/levels/gamma at 6800 and 13600
  px, half-row crops); cells certified physically. **90 dated rows,
  1151/1260 cells certified (91%)** (`data/bw-bma-ramadan-1441-rows.json`);
  every uncertified cell is flagged with its expected value, never invented.
- **Town identification**: pair labels read from the sheet headers (x-mapped
  to pairs); every pair physically certified against Wikidata-measured town
  coordinates (26 towns, `bw-towns-wikidata.json` at the opencode temp root,
  copied to `data/`). Gabane (Q38855), Selebi-Phikwe (Q141263), Francistown
  (Q165422), Shashe Bridge (Q171090), Shoshong (Q72571), Thamaga (Q38902)
  queried individually. "Dukwi" (not "Dukwe") is the Francistown-sheet town.
- **Fit per edition vs the held Gaborone recipe** (adhan 4.4.6, UTC+2,
  round-up ceiling): suhur = ceil(fajr 18.0 deg), iftar = ceil(sunset) + 3 -
  27-30/30 per pair per column on the text sheets; 91% of 1441 cells match.
  The recipe holds across 1441 (2020), 1442 (2021), 1443 (2022) AND the
  inherited year-grid (2024-edition guess): a genuine THREE-YEAR Ramadan
  family, banked per edition, never blended.
- **Defects recorded** (publisher-side, flagged not adjudicated):
  (a) the Serowe-labelled pair in BOTH Francistown sheets is a byte-identical
  duplicate of the Mahalapye pair (30/30 identical cells, both editions);
  (b) the Selebi-Phikwe and Dukwi columns carry a +1 min suhur pad on top of
  the ceil convention (constant across the month; equivalent to ~17.5 deg at
  those points; mechanism recorded as pad, point-shift indistinguishable at
  the 1-minute floor); (c) Tshane iftar misprint cells: 1442 15-Apr prints
  6:02 (expect ~6:21), 1443 05-Apr prints 6:03 (expect ~6:31) - kept as
  printed; (d) the 1443 GABORONE sheet's suhur columns sit ~1 min later than
  its own 1442 columns (Jwaneng 24/30, Lobatse/Thamaga 27/30) - within the
  print floor, recorded as edition drift.
- Banked: `data/bw-bma-ramadan-fits.json` (per-pair fits, top-3 alternatives,
  duplicate-column detection), `data/bw-bma-ramadan-rows.json` (normalized
  dated rows, both editions), `data/bw-bma-ramadan-1441-rows.json` (certified
  OCR rows), scripts `bma-ramadan-parse2.py`, `bma-ramadan-fit2.mjs`,
  `bma-ramadan-1441-ocr3.py`, `bma-ramadan-1441-ocr4.py`,
  `bma-ramadan-1441-ocr5.py`, `bma-ramadan-1441-bank.mjs`.
- The bank file `data/bw-bma-bank.json` now reads grade candidate-plus: one
  fitted year-grid generation + three dated Ramadan editions parsed, fitted
  per edition.

### Session mechanics (O1n-53, item 1)

- The two 1443 PDFs missing from O1n-51's captures (FRANCISTOWN and MAUN,
  bma.org.bw /wp-content/uploads/2022/03/) were fetched with curl + browser UA
  (public direct links), gzipped, and OCR'd (fast level) for the record even
  though their cell parse came from vector text.
- Wikidata queries: public SPARQL GET (query.wikidata.org) and
  Special:EntityData; no login, no form POST, no captcha.
- Town coordinates were measured, never assumed: 26 Botswana towns via
  P17=Q963 + P625 (1000-row query) plus five individual entity lookups.
- Every OCR pass ran the local Vision fast binary; the renders, crops and OCR
  texts are journalled under captures/bma-ramadan/ocr1441/ (no /tmp writes of
  data; the opencode temp dir held only working copies of the PDFs).
- Timestamps UTC. The banned word never written; the round-mechanics
  exclusion bullet applied by reading.
