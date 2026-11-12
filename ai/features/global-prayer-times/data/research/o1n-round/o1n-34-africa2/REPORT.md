# REPORT.md — o1n-34 africa2 (wave O1n-34, round o1n, session three)

Wave o1n-34, returned 2026-11-12 ~07:0xZ. Workspace
`$HOME/athan-gitree/census/o1n/o1n-34-africa2/`. The repository was never written.
Every date in `data/` comes from a literal capture string or the response's own
date fields; nothing reads the real clock. Timestamps UTC. Raw captures gzipped
under `captures/`. Engine for the one fit: adhan 4.4.6
(`census/adhan-build`, `Rounding.None`, `MiddleOfTheNight`), timezone
Africa/Dakar for the CERFI bank. No subagents were deployed; no Wayback thread
survived its first 429/503; no captcha or challenge was solved (several were
recorded). The round-mechanics exclusion bullet and the banned word were never
written.

## 1. The six mawaqit boards (AF-MAWAQIT-WEST-BOARDS, GW-BISSAU-ATTADAMUN) — live year-parameter routes CLOSED, UCAD witness diff banked

All six African boards of the seven-board class (Nono, Lusaka Barkaatiyah,
Nampula Fátima, Gbessia Port2, Bissau Attadamun, Dakar UCAD) re-fetched live
2026-11-12. The route class named in the dispatch is now exhausted:

- **The URL year parameter is ignored at all six boards**: `?year=2027`
  (and for Nono additionally `?year=2027&month=1`, `/2027`, `/calendar/2027`)
  returns the identical 366-row 2026 calendar byte-for-byte in the parsed
  calendar (all six verified cell-identical: `data/mawaqit-boards-yearprobe.json`).
- **The API route is the JWT-walled class**: `api.mawaqit.net/api/2.0/mosque/<slug>/times?year=…`,
  `…/calendar?year=…`, `…/mosques/search`, and the bare mosque endpoint all
  return the 404 SPA shell without auth; no anonymous route found.
- **The UCAD Dakar mosque's own site found**: grandemosqueeucad.com (WordPress,
  14 pages walked via wp-json, none a timetable). Its home today-widget prints
  Fajr 05:50 / Tisbar 14:15 / Takussaan 17:00 / Timis 19:50 / Guée 21:00 and
  no date. Captured today, the same day as the board's live row
  (05:56/14:15/17:00/19:31/21:00): **own-site minus board = fajr −6,
  dhuhr 0, asr 0, maghrib +19, isha 0**. Per the mihrab.ru precedent one
  undated-axis today-row is not a dated dataset; this is recorded as a
  witness diff on the board entry, never banked as rows. It shows the board
  does not carry the mosque's own site's line.
- **Named lead**: the board's association field points to fieed.com (Fédération
  Islamique des Elèves et Etudiants de Dakar); WAF block page banked (http
  444, https connection refused), never fetched through.
- Verdict: both board entries keep their held banks; the "no second year
  exists by any route" conflict note now extends to the live year-parameter
  routes with six named URL shapes, the API 404s, and the own-site witness.

## 2. Senegal beyond Dakar — NEW DATED SURFACE: the CERFI API serves a dated week for all 152 villes (1,064 rows banked)

The held CERFI object was Dakar-only at A (217 hebdo sheets, 2026-11-06 to
2031-01-02; the 152-city selector's other cities served only a today-anchored
rolling week). This wave walked that rolling route at every city and banked it:

- **Walk** (`scripts/cerfi-api-week-walk.py`, captures
  `captures/cerfi-api-raw/`): `www.cerfi.sn/api/horaires/?ville=<id>` for all
  152 selector ids (id 1 "Baba Garage" through 152 "Ziguinchor"), 152
  requests, zero failures, ~1.2 s spacing. Each response carries a `semaine`
  block of seven days **with explicit ISO dates printed per row**
  (2026-11-12 .. 2026-11-18 in every capture).
- **Bank** (`data/cerfi-152-week.json`): **152 cities x 7 dated days = 1,064
  dated rows, zero missing cells**, six columns (API names: fajr, subh, zuhr,
  asr, magrib, isha).
- **Same-generation witness at the overlap day** (2026-11-12, Dakar): the API
  row equals the held hebdo PDF row of 2026-11-06's sheet on all six columns
  cell-for-cell. Label mapping fixed by that witness: API "fajr" = held
  Fajar (imsak), API "subh" = held Suba (fajr). PASS, recorded in the bank.
- **Interval structure across all 1,064 rows**: isha − magrib = 60 exactly
  (1064/1064); imsak − fajr = −15 exactly (1064/1064).
- **Per-city engine check** (`data/cerfi-city-engine-check.json`, adhan 4.4.6
  at stated gazetteer points): at 20 major cities (Dakar, Touba, Thiès,
  Kaolack, Saint-Louis, Ziguinchor, Mbour, Kaffrine, Nioro, Louga, Kolda,
  Tambacounda, Matam, Mbacké, Diourbel, Vélingara, Kédougou, Sédhiou, Fatick,
  Rufisque) the held interval recipe — subh = sunrise − 60, imsak = subh − 15,
  zuhr = transit + 2, asr = Shafi + 2, magrib = sunset + 2, isha = magrib + 60 —
  reproduces **within-1 on every column at every day at 19 of 20**; Vélingara
  sits a uniform 2–3 min off on every column, the signature of my coarse
  gazetteer point rather than a rule change (recorded as such). Asr carries a
  +1 median at eight cities with coarser points; all within-1.
- **Slug negative extended**: the hebdo static series is Dakar-only by slug —
  `/static/salats/{Touba|touba|145}/hebdo/10x1/…` all 404 at a known Friday
  (2026-11-06), on top of o1n-10's twelve display-name probes.
- **Date-parameter negative extended**: `&date=`, `&semaine=`, `&jour=`,
  `&from=` (each 2026-01-15) all return the same today-anchored window — with
  o1n-10's four spellings, **eight parameter shapes now tried; the week is
  anchored to the visitor's clock by every route**.
- Entry: the Dakar hebdo entry keeps grade A unchanged. New companion entry
  **SN-CERFI-API-152**, tier authority (the council's own API), **grade
  candidate** honestly: dated rows with the held recipe verified per-city on
  the 20-city sample and the interval structure on all 1,064 rows, but the
  surface itself serves one rolling seven-day window, so no full-cycle span
  rests on it. The dated axis accrues only by re-visits (the window rolls
  with the visitor's clock).

## 3. COSIM (Cote d'Ivoire) — the Jumada al-Thani sheet has NOT rolled (watch re-recorded)

- `cosim-ci.org/ressources/calendrier` checked three times today (06:11Z,
  06:30Z, ~07:0xZ): the Inertia props still carry exactly one `calendrier`
  object, `calendrier/calendrier_1792092544.jpeg`, created 2026-10-15 — the
  same Joumada al-Oula 1448 edition o1m-18 banked. The Jumada al-Thani 1448
  roll watch stands. (One of the three probes timed out at 40 s and was
  retried after 20 s; the artifact banked.)
- Wayback for older COSIM sheets (the 1436-class archive): the CDX probe
  returned "Internet Archive: Temporarily Offline" (503); the thread stopped
  on that first failure per discipline. The held three editions stand.
- **AEEMCI** (Association des Elèves et Etudiants Musulmans de Côte d'Ivoire,
  aeemci.org) — a new Ivorian lead probed: site live (59 KB home, 18 links,
  pages: activities cv/formation-religious/inventory, Bureau, Organes
  Centraux, cartographie, stories, mediatheque images/videos). **No timetable
  route anywhere in the nav or pages**; the calendar channel is its Facebook
  (facebook.com/aeemcice) and WhatsApp channel (0029VaF2TCY3mFY5DTSV1j1B),
  both named leads, never fetched through login.

## 4. Tanzania (BAKWATA) — negative sharpened

BAKWATA's own live sites walked 2026-11-12: **bakwata.org** (WordPress, "JITAMBUE, BADILIKA,
ACHA MAZOEA") carries six pages — matangazo (announcements, zero posts in the
static HTML), mawasiliano, mfumo-wa-uchaguzi, ofisi-ya-mufti-dua-ya-kitaifa,
uteuzi — none a timetable; WP REST search returned 406 (mod_security) so the
site-search route is recorded as blocked. **bakwata.or.tz** is a 6 KB stub
(printing only "BAKWATA"). Swahili terms: ratiba, sala. The o1m-18 negative
stands, now with both domains walked live and the announcements page verified
empty. Named lead: BAKWATA matangazo (watch for a posted annual).

## 5. Kenya (SUPKEM) — negative sharpened

supkem.or.ke remains DNS-dead. The never-before-tried variant **supkem.co.ke
resolves in DNS but serves gateway 504** (dead behind it). No timetable route
exists at either. The SUPKEM tableless negative stands with the new route fact.

## 6. Uganda (UMSC) — negative sharpened

umsc.or.ug live (235 KB home). WP REST search walked: `search=ratiba` returns
**zero results**; `search=prayer` returns news only (rain prayers, mufti
tributes); the site's two PDFs are the constitution and a strategic plan —
no timetable. The o1n-10 negative stands, now with the REST-search route
exhausted (English + Luganda term).

## 7. Zambia / Malawi / Mozambique / Angola / Zimbabwe — council negatives; the boards and platform layers stand

- **Zambia**: islamiccouncilzambia.org, icz.org.zm, muslimcouncilzambia.org,
  zcouncil.org.zm, islamicfoundzm.org, zamsa.co.zm, zwma.org.zm — all
  NXDOMAIN. The Lusaka Barkaatiyah board front (section 1) is Zambia's dated
  layer, with Fazilet's 12-city line and turktakvim beneath.
- **Malawi**: mamalawi.com/.mw/.org, muslimassociationmalawi.org, muslims.mw,
  darulsalam.mw — all NXDOMAIN. **malawimuslims.com resolves but the domain
  redirects to www.lollipop-tattoo.com/contact behind a Cloudflare
  verification page** (agent-browser opened it read-only; the challenge was
  never interacted with): a repurposed/parked domain, not a Muslim site.
  Fazilet's 8 cities and turktakvim stand as the layer.
- **Mozambique**: cislamo.org/.co.mz, conselhoislamico.co.mz,
  islamiccentremozambique.org, islamiccenter.mz, islaminmz.org, angomoz.org —
  all NXDOMAIN. masjidbox exposes no public tenant directory
  (sitemap-main.xml walked: product pages only), so the masjidbox year-2
  route cannot be enumerated for Africa without a directory or a working
  search engine. CISLAMO stays Facebook-only (named lead, o1n-14 stands).
  The Nampula board front (section 1) and Fazilet's 5 cities stand.
- **Angola**: cisa.ao resolves but serves a parked 404 host; islamangola.org
  NX. Instagram-only mosque pages remain the named leads (o1n-14).
- **Zimbabwe**: majliszw.org, islamicforumzw.org, zimbabweislamic.org,
  muslimguild.org, anjumanzw.org — all NXDOMAIN. The Harare Msasa board and
  Fazilet Bulawayo/Harare stand.

## 8. Ethiopia and the Horn — negatives sharpened with new routes

- **Ethiopia**: **eiasc.et resolves (213.55.96.151, EthioTelecom space) but
  serves only a Plesk "Domain Default page"** — the council's own national
  domain is registered and parked, still not a surface. The held negative
  (EIASC absent from the web, English/Amharic) stands, sharpened by the
  parked-domain fact. islamicaffairsethiopia.org, ethiopianislamiccouncil.org NX.
- **Somalia**: mora.gov.so, moer.gov.so, moendr.gov.so, mocram.gov.so,
  wasaarada-diinta.so, radioomuqdisho.com, radio-muqdisho.net — all NXDOMAIN;
  the held Horn-ledger negatives (Radio Muqwicho REST 404, mawaqit JWT-walled)
  stand. Fazilet's 5 cities and turktakvim are the layer.
- **Djibouti**: lanation.dj is NXDOMAIN at the apex with www a CNAME to that
  NX target (the newspaper's site is gone entirely — sharper than the held
  "zero items"); habous.dj, minhabous.dj, habous.gouv.dj all NX. The held
  negative stands, sharpened.

## 9. Francophone West Africa beyond COSIM/CERFI/MSBF — negatives with routes

- **Guinea**: SGAR re-verified live at **affairesreligieuses.gov.gn** (the
  domain the o1n-7 captures carried; the bare sgar.gov.gn variants are NX).
  Nav walked (institutions, ministeres, actualites, communiques,
  conference-de-presse, appels-doffres): no calendrier route; the communiqués
  page serves nav links only, no post list in static HTML. Tableless negative
  stands. The Nono, Gbessia and Bissau board fronts (section 1) plus Fazilet
  are the dated layer.
- **Mali**: hautconseilislamique.ml NX (held negative stands); mcr.gov.ml,
  cultes.gov.ml, amari.org.ml, cocim.ml, am2d.ml, fnamm.ml all NX. The
  Federation-associations route could not be searched this session: **every
  search engine challenged this host** — DDG challenge (html, lite, and the
  fetch service), Google captcha, Bing poisoned SERP, Mojeek captcha, Ecosia
  403 — all recorded, none solved. The HCIM Facebook channel remains the
  named lead; the Bamako mosaic, Fazilet Bamako/Ségou and turktakvim stand.
- **Benin / Togo**: islam-benin.org, islamibenin.org, acib.bj, umt.tg,
  unionmusulmanetogo.org, cmt.tg — all NXDOMAIN. Fazilet's rows and
  turktakvim are the layer; associations' Facebook pages stay named leads.

## 10. Session mechanics

- Search-engine availability this session: DDG (three routes) challenged,
  Google captcha, Bing junk, Mojeek captcha, Ecosia 403 — every challenge
  recorded and never solved; direct-fetch routes carried the session.
- agent-browser used read-only on two pages (Bing SERP junk observation,
  malawimuslims.com redirect observation) under session o1n34-africa; the
  session was left open (never `close --all`).
- Wayback: one CDX probe (COSIM), 503 "Temporarily Offline", thread stopped.
- Captures: 53 gzipped artifacts under `captures/` (six live board pages with
  their year-probes, the CERFI 152-city raw bank, the CERFI site/API probes,
  COSIM double checks, AEEMCI, SGAR, BAKWATA, UMSC, eiasc.et, engine-challenge
  evidence, fieed WAF page, masjidbox sitemaps). Data: three files under
  `data/`. Scripts: four under `scripts/`.
- No NOTICE.md was needed; the mission ran to its end without parking.
