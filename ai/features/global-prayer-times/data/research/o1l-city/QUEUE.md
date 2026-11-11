# O1l QUEUE — city-level round two

10 slots, continuous redeployment on every completion. 5 agents on cpa-glm/GLM: GLM-5.3-Flash
(GLM), 5 on cpa-opencode-go/DeepSeek V4.1 Flash (DS). Work your own territory only.

## Wave 1 (dispatched 2026-11-11 ~02:5x UTC)
1. O1l-1 malaysia-states (GLM): state mufti / JAIS / JAKIM zone coverage 2026+2027: Penang,
   Johor, Sabah, Sarawak, Negeri Sembilan, Melaka, Kedah, Perlis, Pahang, Terengganu; FIT the
   banked Perak 2026 seven-zone data from o1k-wide/my2027/data/. Malay.
2. O1l-2 thailand-provinces (DS): CICOT provincial workbooks to full national coverage (9 held);
   both normal and leap blocks; fit 19.8/18.1. Thai.
3. O1l-3 indonesia-cities (GLM): Kemenag SIHAT 2026 one regency per province (all 38); KHGT same
   cities; 21/19 boundary check; city-level map. Bahasa Indonesia.
4. O1l-4 china-provinces (DS): norislam grid at provincial capitals (calculator-class, stated
   15/15 Hanafi basis) + search for any real published city tables. Chinese.
5. O1l-5 us-states (GLM): mosque surfaces beyond the 20 metros: Southeast, Mountain, PNW, New
   England second tier, AK/HI; 15/15 default verification; platform suites + live-page gate.
6. O1l-6 russia-boards (DS): DUM RB 63-city API capture+fit (both recipe years), DUM RT beyond
   44 cities, CDUM further cities, other regional boards. Russian.
7. O1l-7 nigeria-states (GLM): mosque layer state by state (Kano, Kaduna, Sokoto, Ilorin,
   Ibadan, Abeokuta, Enugu, PH, Maiduguri); masjidway/masjidbox/mawaqit; fit Egyptian 19.5/17.5
   vs MWL per mosque. English/Hausa.
8. O1l-8 mideast-cities (DS): Saudi umqserv second cities; Oman CityID enumeration (Adam trap);
   Kuwait beyond the capital; Jordan 10-day grid for Irbid/Zarqa/Aqaba; Iraq Diwan API Basra/
   Mosul/Erbil/Kirkuk. Arabic.
9. O1l-9 latam-cities (GLM): Brazil IIB beyond 25 cities; Mexico accrual+search; Colombia Bogotá;
   Peru Lima suite; Ecuador/Uruguay/Paraguay/Bolivia first rows; Caribbean recheck. Spanish/
   Portuguese.
10. O1l-10 watches-europe-year2 (DS): every table-1 watch probed once with URL+result (JAKIM
    2027, Sri Lanka uploads 2026/11, Brunei OData, Kosovo BIK, Chile December, Morocco December,
    Turkey 2027, SKTHAI 2027, Indonesia 2027 month 1, Pakistan unified) + Europe cheapest year-2s
    (Germany more cities + 2027 roll, Belarus 2026 read, Ireland recheck).

## Priority queue (owner orders 2026-11-11 02:53 — these take the next freed slots)
- O1l-A1 algo-table-matrix (GLM): from the banked record + archive (no web needed): every
  country holding BOTH a stated algorithm AND dated tables — the comparison matrix. Sync /
  drift+magnitude+direction / undecidable, per prayer, full span. Deliverable
  $HOME/athan-gitree/census/o1l-city/algo-table/ALGO-TABLE-COMPARE.md.
- O1l-A2 span-ledger (DS): per country: data ceiling (years, rows), the derived recipe,
  forward-longevity verdict (proven-to-<year> / stable-across-N / single-cycle), every dated
  regime change, backward-harvest opportunities not yet taken. Deliverable
  $HOME/athan-gitree/census/o1l-city/span-ledger/SPAN-LEDGER.md.
- O1l-B1 wayback-back-harvest (GLM): backward sweeps: Saudi umqserv 1318H-1448H in ~20-Hijri-year
  steps (a century of Makkah; date every regime change found); Wayback CDX enumeration for Chile
  (190 PDFs indexed), Portugal 2023-, Egypt ESA, Morocco pre-rebuild, Ireland IFI, NZ dead
  domain, Austria IZW; Tajik month-endpoint archive completion; Tunisia 2019-2020 back-fill;
  Kyrgyzstan/Kazakhstan past years.
- O1l-B2 more-sources-per-city (DS): the Scotland rule — re-sweep HELD territories for the
  hidden 49: Scotland's every mosque beyond Glasgow/Dundee/Edinburgh/Aberdeen; London boroughs
  beyond the adopters; England's 20 towns second sources; then any country your slot allows.

## Queued (dispatch as slots free, parent's choice by what Wave 1 returns)
- O1l-11 india-cities (GLM): state waqf boards, city mosques (Delhi, Mumbai, Hyderabad,
  Bengaluru, Chennai, Kolkata). Hindi/Urdu/Malayalam/Tamil.
- O1l-12 pakistan-cities (DS): provincial auqaf boards (Punjab, Sindh, KP, Balochistan),
  Lahore/Karachi/Peshawar/Quetta surfaces, unified-calendar register recheck.
- O1l-13 bangladesh-cities (GLM): district IFB offices, Chittagong/Khulna/Rajshahi/Sylhet mosque
  layer beside the national 72-band schedule.
- O1l-14 egypt-82cities (DS): the 82-city postback sweep (tatweel trap), countrywide
  19.5/17.5 zero-margin verification.
- O1l-15 turkey-cities (GLM): Diyanet ilce tables Izmir/Bursa/Adana/Konya/Trabzon/Diyarbakir/
  Antalya; 2027 roll check; ilce-code trap.
- O1l-16 balkan-cities (DS): Bosnia rijaset API beyond location 77; Serbia Devridaim clean
  re-read; Croatia beyond Pula; Montenegro city-groups; Macedonia bfi.mk accrual.
- O1l-17 algeria-1447 (GLM): transcribe the remaining 1447 book months (Wayback PDFs); extend
  the between-year verdict; more wilayas.
- O1l-18 tunisia-cities (DS): meteo.tn archive next delegations (Sousse, Monastir, Nabeul,
  Gabes, Djerba); countrywide + elevation-term fit across all cities held.
- O1l-19 au-nz-cities (GLM): Australia diaspora more cities (Perth, Canberra, Darwin), Adelaide
  ISSA accrual; NZ FIANZ Wayback accrual on the dead-domain CDX + more of the 33 city sheets.
- O1l-20 africa-cities (DS): East Africa cluster beyond the 11 mosques; Sahel second cities
  (Bamako beyond four mosques, Niamey beyond eight regions, Ouagadougou held: Bobo second year).

## Closing acts (at the owner's word)
- integrity2, wtdiff2 (world-table v3 city rows), fitindex2, decisions addenda,
  night-summary2 — then the repo commit: rsync to
  ai/features/global-prayer-times/data/research/o1l-city/, version bump, privacy scrub,
  yarn validate, push uat.
