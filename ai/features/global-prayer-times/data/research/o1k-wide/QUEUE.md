# O1k nine-hour deployment queue (2026-11-10 19:00 -> 2026-01-11 04:00)

Loop rule: keep exactly 10 agents running (max 5 GLM-5.3-Flash, max 5 DeepSeek V4.1-Flash). On every
completion: consolidate the return into the wave archive, dispatch the next queue item onto the freed
provider slot, re-arm the 10-minute monitor. Never idle. Never bulk-enumerate mawaqit (owner ruling
pending). Public pages only; all standing rules from BRIEF.md apply to every wave.

Wave tags and scopes (dispatch in order, mixing providers to keep 5/5):

- W1 china-sinophone: China (norislam calculator vs any real publisher; Hui community sites), Taiwan
  retry, Hong Kong Islamic Union second surface, Macau.
- W2 korea-japan-mongolia: Seoul/busan mosque tables, Nagoya full-year PDF (the one-parse-away lead),
  Tokyo Camii method statement, Kobe (avoid the content farm), Ulaanbaatar, plus Japan's regional
  mosques (Osaka, Fukuoka, Sapporo).
- W3 central-asia-2: Turkmenistan retry (Turkmen/Russian), Tajikistan second month + any instant-form,
  Kyrgyz Osh + rolling window, Kazakh 3 new cities, Uzbek Bukhara/Fergana vs state board.
- W4 gulf-levant-2: Bahrain's missing fajr angle (ministry publications), Saudi regional presidency
  pages, Palestine per-governorate tables, Syria mirrors, Lebanon Dar al-Fatwa feed fit-readiness,
  Yemen recognised-government feed (owner decision pending: capture only, do not fit), Oman 2028+.
- W5 north-africa-2: Tunisia INM today-page daily capture class + archived month, Algeria marw retry
  via Wayback, Libya second year through the app channel, Egypt 3 new cities, Sudan year-round hunt,
  Mauritania annual tables.
- W6 sahel-west-2: Mali retry, Burkina MSBF printed annual calendar hunt, Senegal Dakar mosques'
  own tables, Guinea-Conakry, Ivory Coast beyond COSIM (Conakry? no: Abidjan communes), Ghana round 2,
  Togo/Benin year captures (the full-year leads), Liberia, Sierra Leone second table.
- W7 horn-east-2: Ethiopia Addis council retry, Somalia/Somaliland retry (local-language), Djibouti
  city-code enumeration lead, Eritrea retry, Kenya KMD year-round host, Tanzania BAKWATA + Zanzibar,
  Uganda Kampala Jamiat year, Rwanda/Burundi retry, Mozambique + Madagascar retry.
- W8 southern-africa-2: South Africa MJC year capture (the second body), Botswana BMA full year,
  Zimbabwe/Namibia/Angola retries, Zambia zamasjids enumeration, Malawi Blantyre anchor question,
  Lesotho/Eswatini years, Mauritius Jummah Masjid full year.
- W9 benelux-fr-2: Belgium EMB 2027 edition (the isha conflict + window boundaries), Netherlands
  consensus followers, France: Grand Mosque of Lyon/Marseille tables + any method statement, GMS
  December cycle watch.
- W10 dach-it-iberia-2: Germany DITIB round 2 (10 more cities), Austria IGGÖ recipe fit-readiness,
  Switzerland IZRS city-year, Italy UCOII 3 cities + Milan, Spain CCIM second city + Granada hijri
  table, Portugal 3 new hsalah cities + Azores/Makeira.
- W11 balkans-2: Serbia Devridaim clean re-read (the render-damaged offset table), Montenegro
  day-counted fit capture, Macedonia Takvim any web mirror, Croatia city-year, Romania retry,
  Bulgaria per-city rows (non-Sofia), Greece Komotini full year + Thessaloniki, Bosnia 2027 monthly,
  Kosovo differently-computed edition check, Slovenia vaktija 2027.
- W12 nordics-baltics-2: Norway mosque-map completion (Bergen/Stavanger/Trondheim), Sweden Göteborg
  year fit-capture, Finland portal year, Denmark Wayback route, Iceland second year, Estonia all
  months, Latvia/Lithuania retry, Ukraine Odesa 2027.
- W13 uk-towns-2: 20 more UK towns beyond the first wave (Luton, Slough, Reading, Oxford, Cambridge,
  Brighton, Nottingham, Coventry, Stoke, Bolton, Oldham, Rochdale, Walsall, Dudley, Preston,
  Blackpool, Middlesbrough, Stockport, Watford, Ilford) + LUPT-uniformity snapshot each.
- W14 americas-2: US states 21-50 dpt/masjidal sweep + ISNA/FCNA current statement, Canada 5 more
  cities, Mexico City retry, Guatemala/Panama/Honduras mosques, Caribbean (Jamaica, Haiti, Barbados,
  Guyana retry, Suriname retry), Chile December pre-publish probe, Argentina 3 cities, Peru 2 cities,
  Colombia Bogota, Ecuador, Venezuela.
- W15 oceania-2: Australia per-state (Sydney mosques, Melbourne ICC, Brisbane, Perth, Adelaide),
  Amanahly network enumeration round 2, NZ FIANZ + Auckland/Wellington mosques, Fiji December watch,
  PNG/Pacific retries, New Caledonia monthly.
- W16 sea-2: Myanmar retry (Burmese), Cambodia/Laos/Vietnam own tables, Brunei 2027 probe, Malaysia
  east-coast states (Kelantan/Terengganu mufti offices), Indonesia outer islands (Aceh, Papua
  highlands regencies with the one-degree-higher isha), Philippines round 2 (Zamboanga, Marawi,
  Davao, Cebu).
- W17 south-asia-2: Pakistan Nizam-e-Salat recheck + provincial auqaf + Lahore/Karachi mosque years,
  India round 2 (Kerala Malayalam, Tamil Nadu, Telangana, UP waqf), Bangladesh district offices +
  Chittagong, Sri Lanka ACJU uploads regeneration check, Nepal/Kashmir mosques, Maldives official
  yearly PDF via namaadhu mirror.
- W18 method-statements: worldwide hunt for OFFICIAL parameter statements (ministry/ council pages
  stating angles, high-latitude rules, rounding): Gulf ministries, Diyanet technical pages, JAKIM
  es-solat notes, Kemenag hisab pages, MWL/ISNA/FCNA current wording, ECFR resolution, Russian
  muftiates' method pages, Balkan rijasets. These statements upgrade derived recipes to stated ones.

Consolidation rule: every returned agent's REPORT.md is appended (path + one-line verdict per country)
to `$HOME/athan-gitree/census/o1k-wide/CONSOLIDATION.md` on the turn it returns. Nothing enters the
repo. Honest negatives are recorded with the languages searched.
