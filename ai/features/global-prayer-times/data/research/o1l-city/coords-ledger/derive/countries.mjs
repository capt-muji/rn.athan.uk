// Country and zone assignment for every surface on record. A surface's country comes from
// its own file name where that carries an ISO 3166-1 alpha-2 prefix, else from the workspace
// that captured it, else from an explicit entry here. No country is inferred from a city name
// alone: an unresolved surface stays unassigned and is reported as UNKNOWN.

const WS = {
  "tunisia-cities": "TN", tncities: "TN", "thailand-provinces": "TH", "egypt-82": "EG",
  "indonesia-cities": "ID", "us-states": "US", "nigeria-states": "NG", nigeria3: "NG",
  "uk-seconds": "GB", uktowns2: "GB", ukscotland: "GB", "my2027": "MY", "malaysia-states": "MY",
  "mideast-cities": null, "o1l-15r": "TR", "wayback-back": "KZ", deep1: "KZ", sea2: "ID",
  americas2: "CA", "southernafrica2": null, oceania2: null, sahel2: null, centralasia: null,
  centralasia2: null, balkans2: null, mideast: null, gulf2: null, northafrica2: null,
  africa: null, americas: null, europe: null, benelux2: null, "watches-eu": null,
  "pakistan-cities": "PK", philippines: "PH", china: null, koreajapan: null, deep2: null,
  "balkan-cities": null, "c1-wafrica": null, "c10-caucasus": null, "c17-chile": "CL",
  "c8-easia": null, "c9-oceania": null, "c3-weurope": null, "c14-bd-lk-mv": null,
  "c4-na": null, "c7-latam": null, "c12-gulf": null, "c13-corrob": null, "c16-fits": null,
  "o1g-decade": "GB", thmsg: null, horneast2: null, iberia2: null, nordics2: null,
};

// Workspace-level prefixes that are not ISO codes.
const WORD_PREFIX = {
  "jamiat-blantyre": "MW", "jamiat-bulawayo": "ZW", "jamiat-capetown": "ZA",
  "jamiat-harare": "ZW", "jamiat-lilongwe": "MW", "jamiat-luanda": "AO",
  "jamiat-maputo": "MZ", "jamiat-maseru": "LS", "jamiat-gaborone": "BW",
  "jamiat-lusaka": "ZM", "jamiat-mbabane": "SZ", "jamiat-windhoek": "NA",
  "jamiat-nairobi": "KE", "jamiat-durban": "ZA", "jamiat-johannesburg": "ZA",
  "jamiat-portlouis": "MU", "jamiat-tripoli": "LY", "jamiat-accra": "GH",
  benin: "BJ", burkina: "BF", "ci-": "CI", ghana: "GH", guinea: "GN", liberia: "LR",
  mali: "ML", "niger-": "NE", senegal: "SN", togo: "TG", gambia: "GM", sierraleone: "SL",
  djibouti: "DJ", kenya: "KE", ethiopia: "ET", somalia: "SO", sudan: "SD", eritrea: "ER",
  uganda: "UG", tanzania: "TZ", rwanda: "RW", burundi: "BI", "hongkong": "HK",
  taiwan: "TW", "southkorea": "KR", "kmf-seoul": "KR", nagoya: "JP", sapporo: "JP",
  tokyo: "JP", osaka: "JP", kyoto: "JP", fukuoka: "JP", "au-": "AU", "fj-": "FJ",
  "nz-": "NZ", "pg-": "PG", "ws-": "WS", "to-": "TO", "vu-": "VU", "sb-": "SB",
  "pf-": "PF", "nc-": "NC", "gu-": "GU",
  // Captures whose file name carries the place but no ISO prefix. The record's own naming is
  // the source here; a name that does not identify one country stays unassigned.
  khgt: "ID", sihat: "ID", baku: "AZ", "cdum-": "RU", "umma-kazan": "RU", "umma-moscow": "RU",
  dagestan: "RU", "moscow-": "RU", tbilisi: "GE", "kuwait-": "KW", "mohammad-al-amin": "LB",
  "sheikh-zayed": "AE", iraq_: "IQ", "acju-": "LK", "ekhon-tv": "BD", "masjidbox-masjidul": "LK",
  namaadhuvaguthu: "MV", izw_: "AT", "gicc-galway": "IE", "hicc-dublin": "IE",
  "icci-clonskeagh": "IE", ccim_: "ES", granada_: "ES", gms_: "FR", porto_: "PT", ucoii_: "IT",
  "icci-chicago": "US", "icsc-los": "US", "isgh-": "US", "islamic-foundation-villa": "US",
  "king-fahad-la": "US", "mosque-foundation-bridgeview": "US", "chile-": "CL",
  cambodia_: "KH", japan_: "JP", korea_: "KR", laos_: "LA", mongolia_: "MN", vietnam_: "VN",
  "adelaide-": "AU", "fianz-auckland": "NZ", "fiji-": "FJ", "lakemba-": "AU",
  "victoria-hilaal": "AU", uzbekistan: "UZ", madagascar: "MG", mozambique: "MZ",
  jummahmasjid: "MU", "mjc-": "ZA", "jamiat-mzuzu": "MW", "jamiat-zomba": "MW",
};

// The c1-wafrica timetable names end in the country word; the city is in the middle.
const COUNTRY_WORD = [
  ["cameroon", "CM"], ["nigeria", "NG"], ["cote-d-ivoire", "CI"], ["cote-divoire", "CI"],
  ["senegal", "SN"],
  ["ghana", "GH"], ["benin", "BJ"], ["togo", "TG"], ["mali", "ML"], ["gambia", "GM"],
];

// Files whose place does not resolve to one country from the name alone.
const FILE = {
  belfast: "GB", "birmingham-central": "GB", "croydon-ict": "GB", "croydon-mosque": "GB",
  "didsbury-manchester": "GB", "east-london-mosque": "GB", "ghamkol-sharif-birmingham": "GB",
  "glasgow-central": "GB", "green-lane-birmingham": "GB", islambradford: "GB",
  "leeds-grand": "GB", "leeds-ic": "GB", "london-central-mosque": "GB",
  "mbilal-bradford": "GB", "swic-cardiff": "GB", "victor-street-bradford": "GB",
  "timetable-aghien": null, "timetable-mosqueerayyane": null,
  "timetable-grande-mosquee-de-lucad-dakar": "SN",
};

const ISO = new Set(("ae af al am ao ar at au az ba bd be bf bg bh bi bj bn bo br bw by bz ca cd cf cg ch ci cl cm cn co cr cu cv cy cz de dj dk do dz ec ee eg er es et fi fj fr ga gb ge gh gm gn gq gr gt gw gy hk hn hr ht hu id ie il in iq ir is it jm jo jp ke kg kh km kp kr kw kz la lb lc lk lr ls lt lu lv ly ma mc md me mk ml mm mn mr mt mu mv mw mx my mz na ne ng ni nl no np nz om pa pe pg ph pk pl ps pt py qa ro rs ru rw sa sb sc sd se sg si sk sl sn so sr ss st sv sy sz td tg th tj tl tm tn to tr tt tw tz ua ug us uy uz va ve vn vu ws ye za zm zw").split(" "));

export function countryOf(workspace, file) {
  const base = file.replace(/\.json$/, "").toLowerCase();
  if (base in FILE) return FILE[base];
  const m = base.match(/^([a-z]{2})[-_]/);
  if (m && ISO.has(m[1])) {
    if (m[1] !== "au" || /^au-/.test(base)) return m[1].toUpperCase();
  }
  for (const [word, cc] of Object.entries(WORD_PREFIX)) {
    if (cc && base.startsWith(word)) return cc;
  }
  for (const [word, cc] of COUNTRY_WORD) {
    if (base.endsWith(word) || base.includes(`-${word}-`)) return cc;
  }
  return WS[workspace] ?? null;
}

// IANA zones to try, in order. A multi-zone country lists its zones; the solver keeps the one
// whose residuals are lowest and records it.
export const ZONES = {
  AE: ["Asia/Dubai"], AF: ["Asia/Kabul"], AL: ["Europe/Tirane"], AM: ["Asia/Yerevan"],
  AO: ["Africa/Luanda"], AR: ["America/Argentina/Buenos_Aires"], AT: ["Europe/Vienna"],
  AU: ["Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Adelaide", "Australia/Perth", "Australia/Darwin", "Australia/Hobart"],
  AZ: ["Asia/Baku"], BA: ["Europe/Sarajevo"], BD: ["Asia/Dhaka"], BE: ["Europe/Brussels"],
  BF: ["Africa/Ouagadougou"], BG: ["Europe/Sofia"], BH: ["Asia/Bahrain"], BI: ["Africa/Bujumbura"],
  BJ: ["Africa/Porto-Novo"], BN: ["Asia/Brunei"], BO: ["America/La_Paz"], BR: ["America/Sao_Paulo", "America/Manaus", "America/Fortaleza", "America/Belem"],
  BW: ["Africa/Gaborone"], BY: ["Europe/Minsk"], BZ: ["America/Belize"],
  CA: ["America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg", "America/Halifax", "America/St_Johns", "America/Regina"],
  CD: ["Africa/Kinshasa", "Africa/Lubumbashi"], CF: ["Africa/Bangui"], CG: ["Africa/Brazzaville"],
  CH: ["Europe/Zurich"], CI: ["Africa/Abidjan"], CL: ["America/Santiago", "Pacific/Easter"],
  CM: ["Africa/Douala"], CN: ["Asia/Shanghai", "Asia/Urumqi"], CO: ["America/Bogota"],
  CR: ["America/Costa_Rica"], CU: ["America/Havana"], CV: ["Atlantic/Cape_Verde"],
  CY: ["Asia/Nicosia"], CZ: ["Europe/Prague"], DE: ["Europe/Berlin"], DJ: ["Africa/Djibouti"],
  DK: ["Europe/Copenhagen"], DO: ["America/Santo_Domingo"], DZ: ["Africa/Algiers"],
  EC: ["America/Guayaquil"], EE: ["Europe/Tallinn"], EG: ["Africa/Cairo"], ER: ["Africa/Asmara"],
  ES: ["Europe/Madrid", "Atlantic/Canary"], ET: ["Africa/Addis_Ababa"], FI: ["Europe/Helsinki"],
  FJ: ["Pacific/Fiji"], FR: ["Europe/Paris"], GA: ["Africa/Libreville"], GB: ["Europe/London"],
  GE: ["Asia/Tbilisi"], GH: ["Africa/Accra"], GM: ["Africa/Banjul"], GN: ["Africa/Conakry"],
  GQ: ["Africa/Malabo"], GR: ["Europe/Athens"], GT: ["America/Guatemala"], GW: ["Africa/Bissau"],
  GY: ["America/Guyana"], HK: ["Asia/Hong_Kong"], HN: ["America/Tegucigalpa"], HR: ["Europe/Zagreb"],
  HT: ["America/Port-au-Prince"], HU: ["Europe/Budapest"], ID: ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "Asia/Pontianak"],
  IE: ["Europe/Dublin"], IL: ["Asia/Jerusalem"], IN: ["Asia/Kolkata"], IQ: ["Asia/Baghdad"],
  IR: ["Asia/Tehran"], IS: ["Atlantic/Reykjavik"], IT: ["Europe/Rome"], JM: ["America/Jamaica"],
  JO: ["Asia/Amman"], JP: ["Asia/Tokyo"], KE: ["Africa/Nairobi"], KG: ["Asia/Bishkek"],
  KH: ["Asia/Phnom_Penh"], KM: ["Indian/Comoro"], KP: ["Asia/Pyongyang"], KR: ["Asia/Seoul"],
  KW: ["Asia/Kuwait"], KZ: ["Asia/Almaty", "Asia/Aqtobe", "Asia/Atyrau", "Asia/Qyzylorda", "Asia/Qostanay"],
  LA: ["Asia/Vientiane"], LB: ["Asia/Beirut"], LC: ["America/St_Lucia"], LK: ["Asia/Colombo"],
  LR: ["Africa/Monrovia"], LS: ["Africa/Maseru"], LT: ["Europe/Vilnius"], LU: ["Europe/Luxembourg"],
  LV: ["Europe/Riga"], LY: ["Africa/Tripoli"], MA: ["Africa/Casablanca"], MC: ["Europe/Monaco"],
  MD: ["Europe/Chisinau"], ME: ["Europe/Podgorica"], MG: ["Indian/Antananarivo"], MK: ["Europe/Skopje"], ML: ["Africa/Bamako"],
  MM: ["Asia/Yangon"], MN: ["Asia/Ulaanbaatar"], MR: ["Africa/Nouakchott"], MT: ["Europe/Malta"],
  MU: ["Indian/Mauritius"], MV: ["Indian/Maldives"], MW: ["Africa/Blantyre"], MX: ["America/Mexico_City", "America/Tijuana", "America/Monterrey", "America/Cancun"],
  MY: ["Asia/Kuala_Lumpur", "Asia/Kuching"], MZ: ["Africa/Maputo"], NA: ["Africa/Windhoek"],
  NE: ["Africa/Niamey"], NG: ["Africa/Lagos"], NI: ["America/Managua"], NL: ["Europe/Amsterdam"],
  NO: ["Europe/Oslo"], NP: ["Asia/Kathmandu"], NZ: ["Pacific/Auckland"], OM: ["Asia/Muscat"],
  PA: ["America/Panama"], PE: ["America/Lima"], PG: ["Pacific/Port_Moresby"], PH: ["Asia/Manila"],
  PK: ["Asia/Karachi"], PL: ["Europe/Warsaw"], PS: ["Asia/Gaza", "Asia/Hebron"],
  PT: ["Europe/Lisbon", "Atlantic/Azores"], PY: ["America/Asuncion"], QA: ["Asia/Qatar"],
  RO: ["Europe/Bucharest"], RS: ["Europe/Belgrade"], RU: ["Europe/Moscow", "Asia/Yekaterinburg", "Asia/Novosibirsk", "Asia/Krasnoyarsk", "Asia/Irkutsk", "Asia/Yakutsk", "Asia/Vladivostok", "Europe/Kaliningrad", "Europe/Samara", "Asia/Omsk", "Asia/Magadan", "Asia/Kamchatka"],
  RW: ["Africa/Kigali"], SA: ["Asia/Riyadh"], SB: ["Pacific/Guadalcanal"], SC: ["Indian/Mahe"],
  SD: ["Africa/Khartoum"], SE: ["Europe/Stockholm"], SG: ["Asia/Singapore"], SI: ["Europe/Ljubljana"],
  SK: ["Europe/Bratislava"], SL: ["Africa/Freetown"], SN: ["Africa/Dakar"], SO: ["Africa/Mogadishu"],
  SR: ["America/Paramaribo"], SS: ["Africa/Juba"], ST: ["Africa/Sao_Tome"], SV: ["America/El_Salvador"],
  SY: ["Asia/Damascus"], SZ: ["Africa/Mbabane"], TD: ["Africa/Ndjamena"], TG: ["Africa/Lome"],
  TH: ["Asia/Bangkok"], TJ: ["Asia/Dushanbe"], TL: ["Asia/Dili"], TM: ["Asia/Ashgabat"],
  TN: ["Africa/Tunis"], TO: ["Pacific/Tongatapu"], TR: ["Europe/Istanbul"], TT: ["America/Port_of_Spain"],
  TW: ["Asia/Taipei"], TZ: ["Africa/Dar_es_Salaam"], UA: ["Europe/Kyiv"], UG: ["Africa/Kampala"],
  US: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "America/Anchorage", "Pacific/Honolulu", "America/Detroit", "America/Indiana/Indianapolis"],
  UY: ["America/Montevideo"], UZ: ["Asia/Tashkent", "Asia/Samarkand"], VA: ["Europe/Vatican"],
  VE: ["America/Caracas"], VN: ["Asia/Ho_Chi_Minh"], VU: ["Pacific/Efate"], WS: ["Pacific/Apia"],
  YE: ["Asia/Aden"], ZA: ["Africa/Johannesburg"], ZM: ["Africa/Lusaka"], ZW: ["Africa/Harare"],
};

// Plausible latitude/longitude envelope per country, generous (2 deg of slack applied at test).
export const BBOX = {
  AE: [22.6, 26.1, 51.5, 56.4], AF: [29.3, 38.5, 60.4, 74.9], AL: [39.6, 42.7, 19.2, 21.1],
  AM: [38.8, 41.3, 43.4, 46.6], AO: [-18.1, -4.3, 11.6, 24.1], AR: [-55.1, -21.7, -73.6, -53.6],
  AT: [46.3, 49.1, 9.5, 17.2], AU: [-44.0, -10.0, 112.9, 153.7], AZ: [38.3, 41.9, 44.7, 50.4],
  BA: [42.5, 45.3, 15.7, 19.7], BD: [20.5, 26.7, 88.0, 92.7], BE: [49.4, 51.6, 2.5, 6.5],
  BF: [9.4, 15.1, -5.6, 2.4], BG: [41.2, 44.3, 22.3, 28.7], BH: [25.7, 26.4, 50.3, 50.9],
  BI: [-4.5, -2.3, 29.0, 30.9], BJ: [6.1, 12.5, 0.7, 3.9], BN: [4.0, 5.1, 114.0, 115.4],
  BO: [-22.9, -9.6, -69.7, -57.4], BR: [-34.0, 5.3, -74.0, -34.7], BW: [-26.9, -17.7, 19.9, 29.4],
  BY: [51.2, 56.2, 23.1, 32.8], BZ: [15.8, 18.5, -89.3, -87.7],
  CA: [41.6, 83.2, -141.1, -52.6], CD: [-13.5, 5.4, 12.1, 31.3], CF: [2.2, 11.0, 14.4, 27.5],
  CG: [-5.1, 3.8, 11.1, 18.7], CH: [45.8, 47.9, 5.9, 10.5], CI: [4.3, 10.8, -8.7, -2.4],
  CL: [-56.0, -17.4, -76.0, -66.3], CM: [1.6, 13.1, 8.4, 16.2], CN: [18.1, 53.6, 73.5, 135.1],
  CO: [-4.3, 12.5, -79.1, -66.8], CR: [8.0, 11.3, -86.0, -82.5], CU: [19.7, 23.3, -85.1, -74.0],
  CV: [14.7, 17.3, -25.5, -22.6], CY: [34.5, 35.8, 32.2, 34.7], CZ: [48.5, 51.1, 12.0, 18.9],
  DE: [47.2, 55.1, 5.8, 15.1], DJ: [10.9, 12.8, 41.7, 43.5], DK: [54.5, 57.8, 8.0, 15.3],
  DO: [17.5, 20.0, -72.1, -68.3], DZ: [18.9, 37.2, -8.7, 12.0], EC: [-5.1, 1.5, -81.1, -75.1],
  EE: [57.5, 59.7, 21.7, 28.3], EG: [21.9, 31.8, 24.6, 36.9], ER: [12.3, 18.1, 36.4, 43.2],
  ES: [27.5, 43.9, -18.3, 4.6], ET: [3.3, 14.9, 32.9, 48.1], FI: [59.7, 70.1, 19.5, 31.6],
  FJ: [-21.3, -12.2, 176.8, 180.0], FR: [41.3, 51.2, -5.2, 9.6], GA: [-4.0, 2.4, 8.6, 14.5],
  GB: [49.8, 61.0, -8.7, 2.0], GE: [41.0, 43.6, 40.0, 46.8], GH: [4.7, 11.2, -3.3, 1.2],
  GM: [13.0, 13.9, -17.0, -13.7], GN: [7.1, 12.7, -15.1, -7.6], GQ: [0.9, 3.8, 8.4, 11.4],
  GR: [34.7, 41.8, 19.3, 29.7], GT: [13.7, 17.9, -92.3, -88.2], GW: [10.8, 12.7, -16.8, -13.6],
  GY: [1.1, 8.6, -61.4, -56.4], HK: [22.1, 22.6, 113.8, 114.5], HN: [12.9, 16.6, -89.4, -83.1],
  HR: [42.3, 46.6, 13.4, 19.5], HT: [18.0, 20.1, -74.5, -71.6], HU: [45.7, 48.6, 16.1, 22.9],
  ID: [-11.1, 6.1, 95.0, 141.1], IE: [51.3, 55.5, -10.6, -5.9], IL: [29.4, 33.4, 34.2, 35.9],
  IN: [6.5, 35.6, 68.1, 97.5], IQ: [29.0, 37.4, 38.7, 48.7], IR: [25.0, 39.8, 44.0, 63.4],
  IS: [63.2, 66.6, -24.6, -13.4], IT: [35.4, 47.1, 6.6, 18.6], JM: [17.7, 18.6, -78.4, -76.1],
  JO: [29.1, 33.4, 34.9, 39.4], JP: [24.0, 45.6, 122.9, 153.9], KE: [-4.8, 5.1, 33.9, 41.9],
  KG: [39.1, 43.3, 69.2, 80.3], KH: [10.3, 14.7, 102.3, 107.7], KM: [-12.5, -11.3, 43.2, 44.6],
  KP: [37.6, 43.0, 124.2, 130.7], KR: [33.0, 38.7, 124.5, 132.0], KW: [28.5, 30.1, 46.5, 48.5],
  KZ: [40.5, 55.5, 46.4, 87.4], LA: [13.9, 22.5, 100.0, 107.7], LB: [33.0, 34.7, 35.1, 36.7],
  LC: [13.7, 14.2, -61.1, -60.8], LK: [5.8, 9.9, 79.5, 81.9], LR: [4.3, 8.6, -11.5, -7.4],
  LS: [-30.7, -28.5, 27.0, 29.5], LT: [53.8, 56.5, 20.9, 26.9], LU: [49.4, 50.2, 5.7, 6.6],
  LV: [55.6, 58.1, 20.9, 28.3], LY: [19.5, 33.2, 9.3, 25.2], MA: [27.6, 36.0, -13.3, -0.9],
  MC: [43.7, 43.8, 7.3, 7.5], MD: [45.4, 48.5, 26.6, 30.2], ME: [41.8, 43.6, 18.4, 20.4],
  MG: [-25.6, -11.9, 43.2, 50.5],
  MK: [40.8, 42.4, 20.4, 23.1], ML: [10.1, 25.0, -12.3, 4.3], MM: [9.7, 28.6, 92.1, 101.2],
  MN: [41.5, 52.2, 87.7, 119.9], MR: [14.7, 27.3, -17.1, -4.8], MT: [35.7, 36.1, 14.1, 14.6],
  MU: [-20.6, -19.9, 57.3, 57.9], MV: [-0.7, 7.1, 72.6, 73.8], MW: [-17.2, -9.3, 32.6, 35.9],
  MX: [14.5, 32.8, -118.4, -86.7], MY: [0.8, 7.4, 99.6, 119.3], MZ: [-26.9, -10.4, 30.2, 41.0],
  NA: [-28.9, -16.9, 11.7, 25.3], NE: [11.6, 23.5, 0.1, 16.0], NG: [4.2, 13.9, 2.6, 14.7],
  NI: [10.7, 15.1, -87.7, -83.1], NL: [50.7, 53.6, 3.3, 7.2], NO: [57.9, 71.2, 4.5, 31.1],
  NP: [26.3, 30.5, 80.0, 88.3], NZ: [-47.4, -34.4, 166.3, 178.6], OM: [16.6, 26.4, 52.0, 59.9],
  PA: [7.2, 9.7, -83.1, -77.1], PE: [-18.4, -0.0, -81.4, -68.6], PG: [-10.8, -1.3, 140.8, 155.9],
  PH: [4.5, 21.2, 116.9, 126.7], PK: [23.6, 37.1, 60.8, 77.9], PL: [49.0, 54.9, 14.1, 24.2],
  PS: [31.2, 32.6, 34.2, 35.6], PT: [36.9, 42.2, -9.6, -6.1], PY: [-27.7, -19.2, -62.7, -54.2],
  QA: [24.4, 26.2, 50.7, 51.7], RO: [43.6, 48.3, 20.2, 29.8], RS: [42.2, 46.2, 18.8, 23.1],
  RU: [41.1, 82.0, 19.6, 180.0], RW: [-2.9, -1.0, 28.8, 30.9], SA: [16.3, 32.2, 34.5, 55.7],
  SB: [-11.9, -6.5, 155.5, 167.0], SC: [-5.0, -3.7, 55.2, 56.0], SD: [8.6, 22.2, 21.8, 38.6],
  SE: [55.3, 69.1, 11.0, 24.2], SG: [1.1, 1.5, 103.6, 104.1], SI: [45.4, 46.9, 13.3, 16.7],
  SK: [47.7, 49.6, 16.8, 22.6], SL: [6.9, 10.0, -13.4, -10.2], SN: [12.2, 16.7, -17.6, -11.3],
  SO: [-1.7, 12.0, 40.9, 51.5], SR: [1.7, 6.0, -58.1, -53.9], SS: [3.4, 12.3, 23.4, 35.9],
  ST: [-0.1, 1.7, 6.4, 7.6], SV: [13.1, 14.5, -90.2, -87.6], SY: [32.2, 37.4, 35.6, 42.4],
  SZ: [-27.4, -25.7, 30.7, 32.2], TD: [7.4, 23.5, 13.4, 24.1], TG: [6.0, 11.2, -0.2, 1.9],
  TH: [5.5, 20.6, 97.2, 105.7], TJ: [36.6, 41.1, 67.3, 75.2], TL: [-9.6, -8.1, 124.0, 127.4],
  TM: [35.1, 42.9, 52.4, 66.7], TN: [30.2, 37.6, 7.4, 11.7], TO: [-21.5, -18.5, -175.4, -173.6],
  TR: [35.8, 42.2, 25.6, 44.9], TT: [10.0, 11.4, -61.9, -60.5], TW: [21.8, 25.4, 119.3, 122.1],
  TZ: [-11.8, -0.9, 29.3, 40.5], UA: [44.3, 52.4, 22.1, 40.3], UG: [-1.6, 4.3, 29.5, 35.1],
  US: [18.8, 71.5, -179.2, -66.9], UY: [-35.0, -30.1, -58.5, -53.0], UZ: [37.1, 45.6, 55.9, 73.2],
  VA: [41.8, 41.95, 12.4, 12.5], VE: [0.6, 12.3, -73.4, -59.7], VN: [8.1, 23.4, 102.1, 109.5],
  VU: [-20.3, -13.0, 166.5, 170.3], WS: [-14.1, -13.4, -172.9, -171.3], YE: [12.1, 19.0, 42.5, 54.6],
  ZA: [-35.0, -22.1, 16.4, 33.0], ZM: [-18.1, -8.2, 21.9, 33.7], ZW: [-22.5, -15.6, 25.2, 33.1],
};
