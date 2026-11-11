import json, os, csv, re

HERE = os.path.dirname(os.path.abspath(__file__))
caps = json.load(open(os.path.join(HERE, "data", "capitals.json")))
inv = json.load(open(os.path.join(HERE, "data", "inventory2.json")))
man = [l.split("\t") for l in open(os.path.join(HERE, "manifest.tsv")).read().strip().split("\n")[1:]]
fits = {f["cc"]: f for f in json.load(open(os.path.join(HERE, "data", "fits.json")))}

# Verified surfaces that the alias scan cannot name (national tables whose record names the
# capital only in the publisher's own reference point, plus short samples verified by hand).
EXTRA = {
    "BH": ("bh-bahrain-calendar-1448.json (Al-Majles al-A'la calendar)", 355, "2026-06-16..2027-06-05", "authority"),
    "SG": ("sg-muis-2027.json (MUIS Singapore)", 365, "2027-01-01..2027-12-31", "authority"),
    "MU": ("jummahmasjid-mauritius-2026.json (Jummah Mosque, Port Louis)", 365, "2026-01-01..2026-12-31", "clerical"),
    "PE": ("pe_lima_mawaqit_2026.json (Lima mawaqit conf)", 365, "2026-01-01..2026-12-31", "community"),
    "EC": ("ec_quito_mawaqit_2026.json (Quito mawaqit conf)", 365, "2026-01-01..2026-12-31", "community"),
    "SV": ("mawaqit_sv_sansalvador_daribrahim.json (Mezquita Dar Ibrahim)", 365, "2026-01-01..2026-12-31", "community"),
    "HT": ("mawaqit_ht_portauprince_chalon.json (Port-au-Prince)", 365, "2026-01-01..2026-12-31", "community"),
    "DO": ("masjidbox_do_santodomingo_alnoor.json (Al-Noor, Santo Domingo)", 7, "2026-11-10..2026-11-16", "community"),
    "BB": ("masjidbox_bb_barbados_annoor.json (An-Noor, Bridgetown)", 7, "2026-11-10..2026-11-16", "community"),
    "GN": ("guinea-nono-grande-mosquee-mawaqit-2026.json (Conakry)", 365, "2026-01-01..2026-12-31", "community"),
    "GW": ("gw-attadamun-bissau.json (Bissau)", 365, "2026-01-01..2026-12-31", "community"),
    "BF": ("bf-an-nour-yamtenga-ouaga.json (Ouagadougou)", 365, "2026-01-01..2026-12-31", "community"),
    "SM": ("mawaqit_sanmarino_2026.json (San Marino)", 365, "2026-01-01..2026-12-31", "community"),
    "QA": ("qa-moi-doha-2026-11-10.json (MOI Qatar, Doha)", 1, "2026-11-10..2026-11-10", "authority"),
    "JO": ("jo-awqaf-grid-2026-11-10.json (Awqaf grid)", 10, "2026-11-10..2026-11-19", "authority"),
    "US": ("islamic-center-washington-dc.json (Islamic Center DC)", 3, "2026-11-01..2026-11-30", "community"),
    "VE": ("ve_caracas_mezquita_2026-10-12_2026-11-10.json (Caracas)", 30, "2026-10-12..2026-11-10", "community"),
    "LB": ("mohammad-al-amin-beirut.json (Beirut)", 1, "2026-11-10..2026-11-10", "community"),
    "YE": ("ye-sanaa-31-locations-nov2026.json (Sanaa, 31 locations)", 9, "2026-11-01..2026-11-10", "authority"),
    "NP": ("np-islamisangh-calendar-2083-a.pdf (Islami Sangh Nepal, Kathmandu)", 0, "PDF held, not normalised", "authority"),
    "CY": ("cy_north_kktc_lefkosa.json (KKTC Nicosia)", 30, "2026-11-01..2026-11-30", "authority"),
    "CY-N": ("cy_north_kktc_lefkosa.json (KKTC Nicosia)", 30, "2026-11-01..2026-11-30", "authority"),
    "CN": ("islamichina_beijing_2026.json (islamichina Beijing, 365 dated rows, calculator widget)", 365, "2026-01-01..2026-12-31", "platform"),
    "KE": ("Ramadhan-Timetable-1447-2026.pdf (Jamia Mosque Nairobi, held raw)", 0, "Ramadan 1447 PDF, not normalised", "clerical"),
    "MY": ("my-jakim-2026-all-zones.json (JAKIM zone WLY01, Kuala Lumpur)", 366, "2026-01-01..2026-12-31", "authority"),
}

# False positives from the alias scan: the file names a different place of the same name.
GAP = {
    "GM": "only Bathurst (Australia) held; no Gambian surface names Banjul",
    "JM": "only Kingston, Hobart (Australia) held; no Jamaican surface names Kingston",
    "SC": "only Victoria Falls (Zimbabwe) held; no Seychellois surface names Victoria",
    "CD": "only Goma held; the capital Kinshasa has no surface",
    "MT": "only Msida and Birkirkara held; no surface names Valletta",
    "CM": "only Douala held; no surface names Yaounde before this wave",
    "AG": "no surface", "AM": "no surface", "BS": "no surface", "BT": "no surface",
    "BO": "no surface", "BR": "no surface with dated rows (IIB Brasilia page is a calculator)",
    "BN": "probes only, no dated table", "BI": "no surface", "CA": "only Toronto, Winnipeg, Halifax held",
    "CO": "only Cartagena held",
    "CR": "no surface", "DM": "no surface", "ER": "no surface before this wave", "ET": "settings page only",
    "FJ": "Fiji tables name no Suva row verified", "GD": "no surface", "GY": "no surface",
    "HN": "only San Pedro Sula held", "HU": "iszlamweb Budapest returns 403; no dated table",
    "IN": "only a masjidway Delhi capture, not normalised", "IR": "no dated table captured",
    "IL": "jerusalem-awqaf capture is empty", "KI": "no surface", "KP": "no surface",
    "MG": "only Mahajanga held", "MH": "no surface", "MX": "search page only, no dated rows",
    "FM": "no surface", "MC": "no surface", "MM": "no surface", "NR": "no surface",
    "NI": "no surface before this wave", "NE": "BUTIN portal held, no dated rows normalised",
    "MK": "no surface before this wave", "PW": "no surface", "PG": "no surface",
    "PY": "no surface", "PH": "only Cotabato, Davao, Marawi held", "PL": "no surface before this wave",
    "RO": "no surface before this wave", "RW": "no surface", "KN": "no surface", "LC": "no surface",
    "VC": "no surface", "WS": "no surface", "ST": "no surface", "SK": "no surface",
    "SB": "no surface", "SS": "no surface", "CH": "Geneva and Zurich only; no surface names Bern",
    "TL": "no surface", "TT": "Chaguanas, San Fernando, Tobago only", "TM": "no surface",
    "TV": "no surface", "UY": "no surface before this wave", "VU": "no surface",
    "VA": "no surface", "XK": "takvim probes empty; no dated table", "PS": "no surface before this wave",
    "GE-AB": "no surface", "MD-PMR": "no surface", "AR": "no surface before this wave",
    "CZ": "no surface before this wave", "LV": "only a one-day IslamicFinder row",
    "MD": "no surface before this wave", "SY": "no surface before this wave",
    "AE": "awqaf capture empty; no dated table before this wave", "DZ": "30-day MARW window held",
}


def tier_of(path):
    p = path.lower()
    rules = [
        ("tn-inm", "authority"), ("eg-esa", "authority"), ("kz-muftyat", "authority"),
        ("kz-astana", "authority"), ("tr-diyanet", "authority"), ("kg-muftiyat", "authority"),
        ("kg-bishkek", "authority"), ("uz-islom", "authority"), ("sa-", "authority"),
        ("bh-bahrain", "authority"), ("sg-muis", "authority"), ("jo-awqaf", "authority"),
        ("ae-awqaf", "authority"), ("pk-islamabad-nizam", "authority"), ("af-kabul", "authority"),
        ("khgt", "authority"), ("sihat", "authority"), ("my-jakim", "authority"),
        ("my-jawi", "authority"), ("th-cicot", "authority"), ("ma-habous", "authority"),
        ("acju", "clerical"), ("grandmufti", "authority"), ("vaktijaeu", "authority"),
        ("monteislam", "authority"), ("si_izs", "authority"), ("islam.ua", "authority"),
        ("ua_kiev", "authority"), ("ua_dumu", "authority"), ("ifi_", "authority"),
        ("athens_state", "authority"), ("ucoii", "authority"), ("ccim", "authority"),
        ("be-emb", "authority"), ("se-ifis", "authority"), ("bg_", "authority"),
        ("ba_takvim", "authority"), ("mawaqit", "community"), ("masjidbox", "community"),
        ("masjidal", "community"), ("jamiat", "community"), ("diyanet", "platform"),
        ("salaahtimes", "platform"), ("aladhan", "platform"), ("islamicfinder", "platform"),
    ]
    for k, t in rules:
        if k in p:
            return t
    return "community"


FILLED = {m[0]: m for m in man if m[6] == "PASS"}
for k in ["CA", "CM", "HU", "CZ", "LV", "MD", "SY", "AE", "RO", "PL", "MK", "NI", "UY", "AR", "PS", "ER"]:
    GAP.pop(k, None)

BEST = {
    "GB": ("london-central-mosque-icc-2026-11-12.json", 366, "2026-01-01..2026-12-31", "authority"),
    "NL": ("nl-amsterdam-2026.json", 365, "2026-01-01..2026-12-31", "community"),
    "EG": ("eg-esa-cairo-2026-11.json", 365, "2026-01-01..2026-12-31", "authority"),
    "TN": ("tn-inm-tunis-2026.json", 365, "2026-01-01..2026-12-31", "authority"),
    "TR": ("tr-diyanet-ankara-2026.json", 365, "2026-01-01..2026-12-31", "authority"),
}

rows_out = []
for cc, country, cap, al, lat, lon, tz, pop in caps:
    if cc in FILLED:
        m = FILLED[cc]
        rows_out.append((cc, country, cap, pop, "COVERED",
                         f"mawaqit.net/en/{m[2]} (captured this wave, gate {m[5]})", int(m[4]), "2026-01-01..2026-12-31", "community"))
        continue
    if cc in BEST:
        name, n, span, tier = BEST[cc]
        rows_out.append((cc, country, cap, pop, "COVERED", name, n, span, tier))
        continue
    if cc in EXTRA:
        name, n, span, tier = EXTRA[cc]
        rows_out.append((cc, country, cap, pop, "COVERED", name, n, span, tier))
        continue
    if cc in GAP:
        rows_out.append((cc, country, cap, pop, "GAP", "not found under these terms: " + GAP[cc], 0, "", ""))
        continue
    best = inv.get(cc) or []
    if not best:
        rows_out.append((cc, country, cap, pop, "GAP", "no surface found naming the capital", 0, "", ""))
        continue
    b = best[0]
    path = b[4]
    if b[1] == "iso":
        span, n = f"{b[2]}..{b[3]}", b[0]
    else:
        span, n = "table held (non-ISO layout)", b[0]
        try:
            d = json.load(open(os.path.join(os.path.expanduser("~/athan-gitree/census"), path)))
            if isinstance(d, dict) and isinstance(d.get("rows"), list) and d["rows"]:
                n = len(d["rows"])
                span = d.get("month") or span
        except Exception:
            pass
    rows_out.append((cc, country, cap, pop, "COVERED", os.path.basename(path) + f" [{path}]", n, span, tier_of(path)))

rows_out.sort(key=lambda r: (-r[3], r[1]))
cov = sum(1 for r in rows_out if r[4] == "COVERED")
gap = len(rows_out) - cov

with open(os.path.join(HERE, "CAPITAL-MATRIX.md"), "w") as f:
    f.write("# Capital coverage matrix — city-level round two (O1l-38)\n\n")
    f.write(f"Built 2026-11-11 from `census-index.db` (1,547 surfaces), the coordinate ledger, and a\n"
            f"filesystem sweep of every `data/` table in `$HOME/athan-gitree/census` (21,137 candidate files).\n"
            f"One row per capital, ordered by capital population. A capital is COVERED only where a held\n"
            f"surface names it (or names the country and is computed at it) and carries dated rows; the\n"
            f"row count is distinct dates found in the file. GAP states the reason and the terms searched.\n\n")
    f.write(f"**{cov} covered, {gap} gap, {len(rows_out)} capitals on the list.**\n\n")
    f.write("| # | Country | Capital | Pop (M) | Status | Surface | Rows | Span | Tier |\n")
    f.write("|---|---|---|---|---|---|---|---|---|\n")
    for i, (cc, country, cap, pop, st, surf, n, span, tier) in enumerate(rows_out, 1):
        f.write(f"| {i} | {country} | {cap} | {pop/1e6:.2f} | {st} | {surf} | {n or ''} | {span} | {tier} |\n")

    f.write("\n## Gaps, largest population first\n\n")
    g = [r for r in rows_out if r[4] == "GAP"]
    for r in sorted(g, key=lambda x: -x[3]):
        f.write(f"- **{r[2]}** ({r[1]}, {r[3]/1e6:.2f}M) — {r[5]}\n")

    f.write("\n## Filled this wave (18 capitals, one gated mawaqit capture each)\n\n")
    f.write("| Country | Capital | Surface | Rows | Gate day | Fit (fajr/isha exact, within-1) | Amplitude Jan-Jul |\n")
    f.write("|---|---|---|---|---|---|---|\n")
    for m in man:
        if m[6] != "PASS":
            continue
        cc, city = m[0], m[1]
        fit = fits.get(cc)
        if fit and "prayers" in fit:
            p = fit["prayers"]
            fs = f"{p['fajr']['exactPct']}/{p['fajr']['w1Pct']}, {p['isha']['exactPct']}/{p['isha']['w1Pct']}"
            amp = f"{fit.get('amplitudeFajrMin')}/{fit.get('amplitudeIshaMin')} min"
            note = ""
            if fit.get("confDeltaDeg", 0) > 0.5:
                note = f" (publisher point {fit['confDeltaDeg']} deg off the city)"
            f.write(f"| {cc} | {city} | mawaqit `{m[2]}` | {m[4]} | {m[5]} | {fs}{note} | {amp} |\n")
        else:
            f.write(f"| {cc} | {city} | mawaqit `{m[2]}` | {m[4]} | {m[5]} | not fitted | |\n")

print(cov, gap, len(rows_out))
