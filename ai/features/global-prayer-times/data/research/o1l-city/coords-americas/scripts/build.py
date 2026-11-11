#!/usr/bin/env python3
"""Assemble one coordinate record per Americas surface from the recovered evidence.

Classes used here:
  PUBLISHED     the surface's own publisher states the point (page payload or printed PDF)
  DERIVED       the point is solved from the surface's own columns and the record agrees
  DERIVED-CITY  the publisher states the mosque's city or street address, never its point;
                the record carries that city's centre from the gazetteer
"""
import json, os

WS = os.path.expanduser("~/athan-gitree/census/o1l-city/coords-americas")
GAZ = json.load(open(f"{WS}/data/gazetteer.json"))
BANKED = json.load(open(f"{WS}/data/banked.json"))
SURF = [l.strip().split("|") for l in open(f"{WS}/data/surfaces.txt") if l.strip()]

CITY_OF = {}  # surface file -> (city gazetteer key, published city/address, publisher)
GEO = {}      # surface file -> (lat, lon, citation, platform)

# ---- 1. mawaqit: the page payload states the mosque's own point -------------------
MAWAQIT = {
    "rows_mawaqit_bekcc-denver-80212-united-states.json": "mawaqit_bekcc-denver-80212-united-states.html",
    "rows_mawaqit_cmcc-colorado-80013-united-states.json": "mawaqit_cmcc-colorado-80013-united-states.html",
    "rows_mawaqit_islamic-center-of-boise-boise-83704-united-states.json": "mawaqit_islamic-center-of-boise-boise-83704-united-states.html",
    "rows_mawaqit_islamic-center-of-new-orleans-new-orleans-70116-1541-united-states.json": "mawaqit_islamic-center-of-new-orleans-new-orleans-70116-1541-united-states.html",
    "rows_mawaqit_masjid-al-ihsaan-miami-33157-united-states.json": "mawaqit_masjid-al-ihsaan-miami-33157-united-states.html",
    "rows_mawaqit_masjid-noor-miami-33186-united-states.json": "mawaqit_masjid-noor-miami-33186-united-states.html",
    "rows_mawaqit_masjid-tawheed.json": "mawaqit_masjid-tawheed.html",
    "rows_ca_cciq_quebec_city.json": "ca_qc_cciq_mawaqit.html",
    "rows_ca_mosquee_de_la_capitale_quebec.json": "ca_qc_capitale-qc_mawaqit.html",
    "rows_gt_aldaawa_guatemala_city.json": "gt_aldaawa_mawaqit.html",
    "rows_hn_centro_islamico_san_pedro_sula.json": "hn_sps_mawaqit.html",
}
for surf, cap in MAWAQIT.items():
    b = BANKED[cap]
    GEO[surf] = (b["lat"], b["lon"],
                 f"mawaqit page payload states the mosque point ({b['lat']}, {b['lon']}); capture {cap}",
                 "mawaqit")

# ---- 2. Masjidal: the platform states the mosque's street address ----------------
MASJIDAL = {
    "0AWpj0dj": ("Marysville, Washington, USA", "5010 Grove St, Marysville, WA 98270, US"),
    "1QL0VydZ": ("Lynnwood, Washington, USA", "15709 Hwy 99, Lynnwood, WA 98087, US"),
    "1QL0gbKZ": ("Cordova, Tennessee, USA", "10299 Humphrey Rd, Cordova, Tennessee 38018, US"),
    "1XAlZzKb": ("Getzville, New York, USA", "745 Heim Rd, Getzville, NY 14068, US"),
    "4nL1XlKa": ("Johns Creek, Georgia, USA", "11005 Jones Bridge Rd Suite 112, Johns Creek, GA 30022, US"),
    "5AvPx2KX": ("Buford, Georgia, USA", "3350 Ridge Rd, Buford, GA 30519, US"),
    "6adJ5qAk": ("SeaTac, Washington, USA", "3730 S 166th St, SeaTac, WA 98188, US"),
    "8KXma5LM": ("Katy, Texas, USA", "6703 Pitts Rd, Katy, Texas 77493, US"),
    "8L7mGbd5": ("Waterbury, Connecticut, USA", "95 Schraffts Dr, Waterbury, Connecticut 06705, US"),
    "BYADgwLN": ("Houston, Texas, USA", "6443 Prestwood Dr, Houston, TX 77081, US"),
    "PAPy7ZdJ": ("Loganville, Georgia, USA", "1920 Temple Johnson Rd, Loganville, GA 30052, US"),
    "QL0MGBAZ": ("Kent, Washington, USA", "20857 108th Ave SE, Kent, WA 98031, US"),
    "RKxwXOdO": ("Seattle, Washington, USA", "4625 22nd Ave NE, Seattle, WA 98105, US"),
    "VrdRZqdG": ("Buford, Georgia, USA", "1400-E1 Buford Hwy NE, Buford, GA 30518, US"),
    "VrdRbPdG": ("Redmond, Washington, USA", "17550 NE 67th Ct, Redmond, WA 98052, US"),
    "XAlzQrKb": ("Portland, Oregon, USA", "12335 NE Glisan St, Portland, Oregon 97230, US"),
    "adJmGxAk": ("Portland, Oregon, USA", "10323 SW 43rd Ave, Portland, Oregon 97219, US"),
    "keLQjWAM": ("Seattle, Washington, USA", "1400 NE Northgate Way, Seattle, WA 98125, US"),
    "keLQn7AM": ("Richmond, Texas, USA", "5530 Long Prairie Trace #100, Richmond, TX 77407, US"),
    "lJAmRjdR": ("Seattle, Washington, USA", "5945 39th Ave S, Seattle, WA 98118, US"),
    "nzKzgvLO": ("Honolulu, Hawaii, USA", "1935 Aleo Pl, Honolulu, HI 96822, US"),
    "p8KXgNdM": ("Buffalo, New York, USA", "40 Parker Ave, Buffalo, NY 14214, US"),
    "pQKMMBKB": ("Suwanee, Georgia, USA", "80 Celebration Drive, Suwanee, GA 30024, US"),
    "rdRvm3dG": ("Antioch, Tennessee, USA", "5400 Bell Forge Ln E, Antioch, TN 37013, US"),
    "xdyqvadX": ("Charlotte, North Carolina, USA", "3116 Johnston Oehler Rd, Charlotte, NC 28269, US"),
    "xwLVXMdJ": ("Tukwila, Washington, USA", "14101 Tukwila International Blvd, Tukwila, WA 98168, US"),
    "y0LbBXLo": ("Puyallup, Washington, USA", "11815 110th Ave E, Puyallup, Washington 98374, US"),
    "zKz3zRLO": ("Glendale, Arizona, USA", "19250 N 35th Ave, Glendale, Arizona 85308, US"),
    "zVKpbbAP": ("Franklin, Tennessee, USA", "320 Mallory Station Rd, Franklin, TN 37067, US"),
}
# americas2 masjidal records carry the mosque, not the id
MASJIDAL_EXTRA = {
    "rows_us_memphis_islamic_center.json": "1QL0gbKZ",
    "rows_us_richmond_iccc_tx.json": "keLQn7AM",
    "rows_us_icsouthbay_lomita_ca.json": None,   # id XEdoEvL7, address below
    "rows_us_islamic_center_of_tennessee.json": "rdRvm3dG",
    "rows_us_jamaica_muslim_center_queens_ny.json": None,  # z0AW66Lj
    "rows_us_mas_tarbiyah_livonia_mi.json": None,          # nL1JggAa
    "rows_us_ema_seatac_wa.json": "6adJ5qAk",
    "rows_ca_markaz_ul_islam_edmonton.json": None,         # VrdRkwKG
    "rows_ca_masjid_alfatima_edmonton.json": None,         # M0dYkvL6
    "rows_ca_masjid_ataqwa_edmonton.json": None,           # pVdwyVLe
}
MASJIDAL_DIRECT = {
    "rows_us_icsouthbay_lomita_ca.json": ("Lomita, California, USA", "25816 Walnut St, Lomita, California 90717, US"),
    "rows_us_jamaica_muslim_center_queens_ny.json": ("Jamaica, Queens, New York, USA", "85-37 JMC WAY, JAMAICA, NY 11432, United States"),
    "rows_us_mas_tarbiyah_livonia_mi.json": ("Livonia, Michigan, USA", "36924 Ann Arbor Trail, Livonia, MI 48150, US"),
    "rows_ca_markaz_ul_islam_edmonton.json": ("Edmonton, Alberta, Canada", "7907 36 Ave NW, Edmonton, AB T6K 3S6, CA"),
    "rows_ca_masjid_alfatima_edmonton.json": ("Edmonton, Alberta, Canada", "9275 25 Ave NW, Edmonton, AB T6N 0A5, CA"),
    "rows_ca_masjid_ataqwa_edmonton.json": ("Edmonton, Alberta, Canada", "10654 101 St NW, Edmonton, Alberta T5H 2S1, CA"),
}
for surf, mid in MASJIDAL_EXTRA.items():
    if mid:
        MASJIDAL_DIRECT[surf] = MASJIDAL[mid]

for mid, (city, addr) in MASJIDAL.items():
    for y in ("2024", "2025", "2026"):
        surf = f"masjidal_{mid}_{y}.json"
        CITY_OF[surf] = (city, addr, "Masjidal masjid_info.location")
for surf, (city, addr) in MASJIDAL_DIRECT.items():
    CITY_OF[surf] = (city, addr, "Masjidal masjid_info.location")

# ---- 3. Masjidbox: JSON-LD PostalAddress ----------------------------------------
MASJIDBOX = {
    "rows_masjidbox_icnm_abq.json": ("Albuquerque, New Mexico, USA", "1100 Yale Blvd SE, Albuquerque, NM, USA"),
    "tt-chaguanas-masjid.json": ("Chaguanas, Trinidad and Tobago", "Newton Street, Chaguanas, Trinidad and Tobago"),
    "tt-guaico-masjid-ul-mumineen.json": ("Guaico, Trinidad and Tobago", "Masjid ul Mu'mineen, Guaico Tamana Rd, Trinidad and Tobago"),
    "tt-san-fernando-jama-masjid.json": ("San Fernando, Trinidad and Tobago", "66 Mucurapo Street, San Fernando, Trinidad and Tobago"),
    "tt-tobago-masjid-abdullah-ibn-abbaas.json": ("Crown Point, Tobago, Trinidad and Tobago", "Crown Point, Tobago, Trinidad and Tobago"),
    "co-cartagena-mezquita-de-muhammad.json": ("Cartagena de Indias, Colombia", "Cl. 25 #8b-177, Getsemani, Cartagena de Indias, Bolívar, Colombia"),
}
for surf, (city, addr) in MASJIDBOX.items():
    CITY_OF[surf] = (city, addr, "Masjidbox page JSON-LD PostalAddress")

# ---- 4. Chile: the publisher names the city on the sheet -------------------------
CITIES_CL = json.load(open(os.path.expanduser("~/athan-gitree/census/c17-chile/fit/cities.json")))
CL_LABEL = {  # census file -> sheet label as printed
    "cl-santiago-mezquita-as-salam.json": "Santiago - Región Metropolitana",
    "cl-arica-mezquita-as-salam.json": "Arica",
    "cl-antofagasta-mezquita-as-salam.json": "Antofagasta",
    "cl-copiapo-mezquita-as-salam.json": "Copiapó",
    "cl-la-serena-mezquita-as-salam.json": "La Serena - Coquimbo",
    "cl-san-felipe-mezquita-as-salam.json": "San Felipe - Los Andes",
    "cl-vina-del-mar-mezquita-as-salam.json": "Viña del Mar - Valparaíso",
    "cl-san-antonio-mezquita-as-salam.json": "San Antonio - Barrancas - Llolleo - Santo Domingo",
    "cl-rancagua-mezquita-as-salam.json": "Rancagua",
    "cl-talca-mezquita-as-salam.json": "Talca - Curicó",
    "cl-linares-mezquita-as-salam.json": "Linares",
    "cl-concepcion-mezquita-as-salam.json": "Concepción - Chillán",
    "cl-temuco-mezquita-as-salam.json": "Temuco - Pucón - Villarrica",
    "cl-valdivia-mezquita-as-salam.json": "Valdivia",
    "cl-osorno-mezquita-as-salam.json": "Osorno",
    "cl-puerto-montt-mezquita-as-salam.json": "Puerto Montt - Castro",
    "cl-coyhaique-mezquita-as-salam.json": "Coyhaique - Puerto Aysén",
    "cl-punta-arenas-mezquita-as-salam.json": "Punta Arenas - Magallanes",
}
CHILE = {}
for n, c in CITIES_CL.items():
    CHILE[int(n)] = c
for surf, label in CL_LABEL.items():
    # the census index carries 18 city sheets under two workspaces; the sheet number is
    # the join, and each file's own name carries the city slug
    slug = surf.replace("cl-", "").replace("-mezquita-as-salam.json", "")
    match = None
    for i, c in CHILE.items():
        s = (c["name"].lower().replace("ó", "o").replace("é", "e").replace("í", "i")
             .replace("á", "a").replace("ñ", "n").replace(" ", "-"))
        if s == slug:
            match = c
            break
    if match:
        GEO[surf] = (match["lat"], match["lon"],
                     f"publisher prints the city name on the sheet ({label}); point is that city centre",
                     "radioislam.cl (Centro Islámico de Chile)")
# the two c7-latam duplicates
for surf, city in (("chile-santiago-mezquita-as-salam.json", "Santiago"),
                   ("chile-punta-arenas-mezquita-as-salam.json", "Punta Arenas")):
    for i, c in CHILE.items():
        if c["name"] == city:
            GEO[surf] = (c["lat"], c["lon"],
                         f"publisher prints the city name on the sheet ({city}); point is that city centre",
                         "radioislam.cl (Centro Islámico de Chile)")

# ---- 5. mosque's own site states the address ------------------------------------
SITE = {
    "ca_bilal_centre_winnipeg.json": ("Winnipeg, Manitoba, Canada", "Winnipeg Islamic Centre (Masjid Bilal), Winnipeg, MB", "bilalcentre.ca"),
    "rows_ca_bilal_centre_winnipeg.json": ("Winnipeg, Manitoba, Canada", "Winnipeg Islamic Centre (Masjid Bilal), Winnipeg, MB", "bilalcentre.ca"),
    "ca_kitchener_masjid.json": ("Kitchener, Ontario, Canada", "1017 Victoria St. N. Kitchener, ON, N2B 3C7, Canada", "kitchenermasjid.com"),
    "rows_ca_kitchener_masjid.json": ("Kitchener, Ontario, Canada", "1017 Victoria St. N. Kitchener, ON, N2B 3C7, Canada", "kitchenermasjid.com"),
    "ca_mia_winnipeg.json": ("Winnipeg, Manitoba, Canada", "Manitoba Islamic Association, Winnipeg, MB", "miaonline.org"),
    "rows_ca_mia_winnipeg.json": ("Winnipeg, Manitoba, Canada", "Manitoba Islamic Association, Winnipeg, MB", "miaonline.org"),
    "ca_ummah_masjid_halifax.json": ("Halifax, Nova Scotia, Canada", "Ummah Masjid and Community Center, Halifax, NS", "ummahmasjid.ca"),
    "rows_ca_ummah_masjid_halifax.json": ("Halifax, Nova Scotia, Canada", "Ummah Masjid and Community Center, Halifax, NS", "ummahmasjid.ca"),
    "us_icgt_toledo.json": ("Perrysburg, Ohio, USA", "25877 Scheider Rd, Perrysburg, OH (Islamic Center of Greater Toledo)", "icgt.org"),
    "rows_us_icgt_toledo.json": ("Perrysburg, Ohio, USA", "25877 Scheider Rd, Perrysburg, OH (Islamic Center of Greater Toledo)", "icgt.org"),
    "us_mcsamasjid_san_antonio.json": ("San Antonio, Texas, USA", "Muslim Center of San Antonio, San Antonio, Texas", "mcsamasjid.com"),
    "rows_us_mcsamasjid_san_antonio.json": ("San Antonio, Texas, USA", "Muslim Center of San Antonio, San Antonio, Texas", "mcsamasjid.com"),
    "dpt_isghmasjidhamza.org_2025.json": ("Houston, Texas, USA", "6233 Tres Lagunas Dr, Houston, TX 77082", "isghmasjidhamza.org"),
    "iqamah_dpt_isghmasjidhamza.org_2025.json": ("Houston, Texas, USA", "6233 Tres Lagunas Dr, Houston, TX 77082", "isghmasjidhamza.org"),
    "dpt_masjid.mcisonline.net_2026.json": ("Houston, Texas, USA", "2222 Mansard St, Houston, TX 77054 (Medical Center Islamic Society)", "masjid.mcisonline.net"),
    "iqamah_dpt_masjid.mcisonline.net_2026.json": ("Houston, Texas, USA", "2222 Mansard St, Houston, TX 77054 (Medical Center Islamic Society)", "masjid.mcisonline.net"),
    "rows_athanplus_YAD4yNAN_prov_2025-10_2026-11.json": ("North Smithfield, Rhode Island, USA", "40 Sayles Hill Road, North Smithfield, RI 02896 (Masjid Al-Islam)", "mai-ri.org"),
    "rows_athanplus_YAD4yNAN_prov_2026-11.json": ("North Smithfield, Rhode Island, USA", "40 Sayles Hill Road, North Smithfield, RI 02896 (Masjid Al-Islam)", "mai-ri.org"),
    "icci-chicago.json": ("Chicago, Illinois, USA", "Islamic Community Center of Illinois, 6435 W Belmont Ave, Chicago, IL", "iccicenter.org"),
    "icsc-los-angeles.json": ("Los Angeles, California, USA", "Islamic Center of Southern California, Los Angeles, CA", "islamiccenter.com"),
    "isgh-houston.json": ("Houston, Texas, USA", "Islamic Society of Greater Houston, 3110 Eastside St, Houston, TX 77098", "isgh.org"),
    "king-fahad-la.json": ("Culver City, California, USA", "10980 Washington Blvd, Culver City, CA 90232", "kingfahadmosque.org"),
    "mosque-foundation-bridgeview.json": ("Bridgeview, Illinois, USA", "Mosque Foundation, Bridgeview, IL 60455", "mosquefoundation.org"),
    "us_daralhijrah_falls_church_va_2026.json": ("Falls Church, Virginia, USA", "Dar Al-Hijrah Islamic Center, Falls Church, VA", "hijrah.org"),
    "us_iant_richardson_tx_2026.json": ("Richardson, Texas, USA", "840 Abrams Rd, Richardson, TX 75081 (Islamic Association of North Texas)", "iant.com / Masjidal xdy03lAX"),
    "rows_us_iant_richardson_tx.json": ("Richardson, Texas, USA", "840 Abrams Rd, Richardson, TX 75081 (Islamic Association of North Texas)", "iant.com / Masjidal xdy03lAX"),
    "ca_brandon_islamic_centre_2026.json": ("Brandon, Manitoba, Canada", "Brandon Islamic Centre Inc, Brandon, Manitoba R7A 4H1", "bicmanitoba.ca"),
    "ca_icswo_london_on_DEFECTIVE_2026.json": ("London, Ontario, Canada", "951 Pond Mills Rd, London ON N6N 1C3 (Islamic Centre of Southwest Ontario)", "islamiccentre.ca"),
    "ca_islamic_institute_toronto_2026.json": ("Toronto, Ontario, Canada", "Islamic Institute of Toronto, Toronto, ON", "islamicinstitute.ca"),
    "ca_masjid_toronto_2026.json": ("Toronto, Ontario, Canada", "168 Dundas St. West, Toronto, ON M5G 1C6 Canada", "masjidtoronto.com"),
    "sr_sma_paramaribo_2025-04-29_2025-05-27.json": ("Paramaribo, Suriname", "Surinaamse Moeslim Associatie, Kankantriestraat 32-40, Paramaribo", "smawebsite.com"),
}
for surf, (city, addr, pub) in SITE.items():
    CITY_OF[surf] = (city, addr, pub)

# ---- 6. published point printed on the surface's own artifact -------------------
GEO["islamic-foundation-villa-park.json"] = (
    41.8898, -87.9890,
    "the surface's own PDF prints the point 41.8898N 87.9890W in its method block; c4-na MANIFEST.md",
    "Islamic Foundation Villa Park")

# ---- country repair ------------------------------------------------------------
# the ledger assigned these by envelope, and its envelope test put them under CA
TRUE_COUNTRY = {"rows_gt_aldaawa_guatemala_city.json": "GT",
                "rows_hn_centro_islamico_san_pedro_sula.json": "HN"}
for f in list(TRUE_COUNTRY) + [s for s in CITY_OF if s.startswith("rows_us_")]:
    TRUE_COUNTRY.setdefault(f, "US")

# ---- assemble ------------------------------------------------------------------
out = []
for sid, cc, ws, file, rows, first, last, cls, why in SURF:
    rec = {"id": int(sid), "country": TRUE_COUNTRY.get(file, cc),
           "countryLedger": cc, "workspace": ws, "file": file,
           "rows": int(rows), "first": first, "last": last}
    if file in GEO:
        lat, lon, cite, plat = GEO[file]
        published = "city centre" not in cite
        rec.update({"pointClass": "PUBLISHED" if published else "DERIVED-CITY",
                    "lat": lat, "lon": lon, "source": cite, "platform": plat})
    elif file in CITY_OF:
        city, addr, pub = CITY_OF[file]
        g = GAZ[city]
        rec.update({"pointClass": "DERIVED-CITY", "lat": g["lat"], "lon": g["lon"],
                    "city": city, "publishedPlace": addr, "platform": pub,
                    "source": f"publisher states the place ({addr}); point is the centre of {city} from the gazetteer (OSM {g['osm']})"})
    elif file == "ca_saskatoon_2026.json":
        rec.update({"pointClass": "DERIVED", "lat": 52.188, "lon": -109.108,
                    "source": "solved from the surface's own horizon and asr columns (carried from coords-ledger)"})
    else:
        rec.update({"pointClass": "UNKNOWN", "unknownStatus": why,
                    "source": "no place stated by the publisher and none recoverable"})
    out.append(rec)

json.dump(out, open(f"{WS}/data/coords-recovered.json", "w"), indent=1, ensure_ascii=False)
from collections import Counter
print(len(out), "surfaces")
print(Counter(r["pointClass"] for r in out))
print("by country:", Counter((r["country"], r["pointClass"]) for r in out))
for r in out:
    if r["pointClass"] == "UNKNOWN":
        print("UNKNOWN:", r["file"], r.get("unknownStatus"))
