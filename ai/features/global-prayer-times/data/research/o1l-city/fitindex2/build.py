"""Render FIT-INDEX-ROUND2.md and .json from the transcribed entry lists."""
import json
import entries_a
import entries_b
import entries_c

REGION_ORDER = [
    "North Africa",
    "West Africa",
    "Central, East and Southern Africa, Indian Ocean",
    "Europe: British Isles",
    "Europe: Nordics, Baltics, Benelux and Central",
    "Europe: Iberia and the Balkans",
    "Europe: Russia",
    "Middle East",
    "Central Asia",
    "South Asia",
    "Southeast Asia",
    "East Asia",
    "North America",
    "Central America and the Caribbean",
    "South America",
    "Oceania",
    "Matrices and platforms",
]

ENTRIES = entries_a.ENTRIES + entries_b.ENTRIES + entries_c.ENTRIES


MOVEMENTS = [
    ("C1", "Thailand", "TH-77-PROVINCES"),
    ("C2", "India", "IN-EIGHT-CITY-MOSAIC"),
    ("C3", "China", "CN-29-CAPITALS"),
    ("C4", "Mexico", "MX-GUADALAJARA; MX-MONTERREY"),
    ("C5", "Brazil", "BR-IIB-25"),
    ("C6", "Colombia", "CO-CARTAGENA"),
    ("C7", "Peru", "PE-LIMA"),
    ("C8", "Tanzania", "TZ-ARUSHA"),
    ("C9", "Uganda", "UG-ENTEBBE"),
    ("C10", "Central African Republic", "CF-BANGUI"),
    ("C11", "Western Sahara", "EH-LAAYOUNE-DAKHLA"),
    ("C12", "Madagascar", "MG-THREE-MOSQUES"),
    ("C13", "Guinea-Bissau", "GW-BISSAU"),
    ("C14", "Japan", "JP-KOBE"),
    ("C15", "Korea", "KR-THREE-CITY-YEARS"),
    ("C16", "Tonga", "TO-NIUTOUA"),
    ("C17", "Malta", "MT-THREE-SURFACES"),
    ("C18", "Andorra, Liechtenstein, San Marino", "AD-ANDORRA; LI-VADUZ; SM-BADR"),
    ("C19", "Algeria", "DZ-MINISTRY-1447-1448"),
    ("C20", "Kazakhstan", "KZ-49-YEAR-SPAN; KZ-SEVEN-CITIES"),
    ("C21", "Oman", "OM-SEVEN-CITIES-2021-2031"),
    ("C22", "Saudi Arabia", "SA-43-GOVERNORATES; SA-CENTURY-1318-1500H; SA-TEN-CITIES-1448-1449"),
    ("C23", "United Arab Emirates", "AE-SEVEN-EMIRATES"),
    ("C24", "Turkey", "TR-81-PROVINCES; TR-DISTRICTS-144"),
    ("C25", "Morocco", "MA-HABOUS-190-CITIES"),
    ("C26", "Egypt", "EG-ESA-78-CITIES"),
    ("C27", "Tunisia", "TN-INM-258-DELEGATIONS; TN-INM-FLAT2026"),
    ("C28", "Indonesia", "ID-KEMENAG-38; ID-KHGT-38"),
    ("C29", "Germany (EU-Diyanet)", "DE-24-CITIES; DE-DISTRICT-1241"),
    ("C30", "Russia (DUM RB)", "RU-DUMRB-63; RU-CDUM-MOSCOW"),
    ("C31", "Russia (DUM RT)", "RU-DUMRT-44"),
    ("C32", "United States", "US-33-METROS; US-OMAHA-REGIME"),
    ("C33", "Australia", "AU-218-GRID"),
    ("C34", "New Zealand", "NZ-FIANZ-20-YEAR-PAIR"),
    ("C35", "Fiji", "FJ-TWELVE-SHEETS"),
    ("C36", "New Caledonia", "NC-NOUMEA"),
    ("C37", "Pakistan", "PK-KARACHI-CHART; PK-MULTAN-CHART; PK-PESHAWAR-CHART; PK-QUETTA-CHART"),
    ("C38", "Bosnia and Herzegovina", "BA-61-CITIES"),
    ("C39", "Malaysia", "MY-PERAK-SEVEN-ZONES; MY-PENANG-PANTAI-ACHEH; MY-MELAKA-1447; MY-NEGERI-SEMBILAN"),
    ("C40", "Mauritius", "MU-MAURITIUS"),
    ("C41", "Cyprus (north)", "CY-NORTH-2025-2026"),
    ("C42", "Kuwait", "KW-CAPITAL-2026"),
    ("C43", "Iraq", "IQ-BAGHDAD-DIWAN; IQ-BAGHDAD-MAWAQIT"),
    ("C44", "Bangladesh", "BD-BOLURA-BAND; BD-DHAKA-FOUR"),
    ("C45", "Maldives", "MV-FIVE-ISLANDS"),
    ("C46", "Brunei", "BN-MORA-2026"),
    ("C47", "Austria", "AT-IGGOE"),
    ("C48", "Switzerland", "no entry: undecidable, no dated rows"),
    ("C49", "Ireland", "IE-IFI-26-CITIES"),
    ("C50", "Finland", "FI-JYVASKYLA-TURKU-TAMPERE"),
    ("C51", "Iceland", "IS-NINE-CITIES"),
    ("C52", "Norway", "NO-TEN-CITIES"),
    ("C53", "Denmark", "DK-FOUR-CITIES"),
    ("C54", "Jordan", "JO-REGIONAL-MARGINS"),
    ("C55", "United Kingdom", "GB-SCOTLAND-14; GB-LONDON-9-BOROUGHS; GB-ENGLAND-6-TOWNS; GB-WALES-CARDIFF; GB-BELFAST; GB-SECOND-LAYER"),
    ("C56", "dpt and masjidal pool", "MASJIDAL-216-POOL"),
]


def md_table(rows):
    out = [
        "| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for e in rows:
        out.append(
            "| {id} | {surface} | {tier} | {span} | {recipe} | {scores} | {verdict} | {grade} |".format(
                id=e["id"],
                surface=e["surface"],
                tier=e["tier"],
                span=e["span"],
                recipe=e["recipe_md"],
                scores=e["scores_md"],
                verdict=e["span_verdict"],
                grade=e["grade_md"],
            )
        )
    return "\n".join(out)


def main():
    by_region = {r: [] for r in REGION_ORDER}
    for e in ENTRIES:
        by_region[e["region"]].append(e)

    grades = {}
    for e in ENTRIES:
        grades[e["grade"]] = grades.get(e["grade"], 0) + 1
    countries = sorted({e["country"] for e in ENTRIES})
    countries_real = [c for c in countries if c != "ZZ"]
    conflicts = [e for e in ENTRIES if e.get("conflicts")]
    flagged = [e for e in ENTRIES if e.get("flags")]
    spans = {}
    for e in ENTRIES:
        spans[e["span_verdict"]] = spans.get(e["span_verdict"], 0) + 1

    grade_order = ["A", "A-candidate", "A eligible", "measured", "provisional", "community", "candidate"]
    span_order = ["yes", "frozen-recomputed", "frozen-reprint", "no",
                  "untestable-single-year", "untestable-short-sample", "untestable-single-template"]

    counts_rows = [
        ("Entries", len(ENTRIES)),
        ("Countries and territories touched", len(countries_real)),
        ("Platform and matrix pools (ZZ, not a country)", len(countries) - len(countries_real)),
    ]
    for g in grade_order:
        if g in grades:
            counts_rows.append(("Grade %s" % g, grades[g]))
    for g in grades:
        if g not in grade_order:
            counts_rows.append(("Grade %s" % g, grades[g]))
    counts_rows += [
        ("Entries carrying a conflict note", len(conflicts)),
        ("Entries carrying a flag", len(flagged)),
    ]
    for s in span_order:
        if s in spans:
            counts_rows.append(("Span verdict %s" % s, spans[s]))
    for s in spans:
        if s not in span_order:
            counts_rows.append(("Span verdict %s" % s, spans[s]))

    lines = []
    lines.append("# FIT-INDEX ROUND 2: every recipe the O1l city-level round produced")
    lines.append("")
    lines.append(
        "Machine-readable companion: `FIT-INDEX-ROUND2.json` (same entries, same wording). Built "
        "2026-11-11 by the round-2 registry agent from the fit deliverables themselves, the "
        "CONSOLIDATION blocks, the corrections register and the world-table diff. Recipes are "
        "transcribed as the fits and the blocks state them; nothing is re-derived here and nothing "
        "is adjudicated. The O1k index is the schema template."
    )
    lines.append("")
    lines.append(
        "Reconciliation: every entry that the corrections register (`corrections/CORRECTIONS-ROUND.md`, "
        "A 77 / B 34 / C 56 / D 32 / F 17) or the world-table diff (`wtdiff2/WORLD-TABLE-DIFF-ROUND2.md`, "
        "the 56 grade and span movements) touches carries the register or diff reference in its "
        "`register` field. Entries are the fit objects, not the rows: one entry per fitted surface or "
        "surface family, exactly as O1k counted them."
    )
    lines.append("")
    lines.append("## Counts")
    lines.append("")
    lines.append("| Measure | Value |")
    lines.append("|---|---|")
    for k, v in counts_rows:
        lines.append("| %s | %s |" % (k, v))
    lines.append("")
    lines.append("## The grading rule applied")
    lines.append("")
    lines.append(
        "Owner ruling T-667 #6943 and the O1k frozen-generation precedent, unchanged. **A** needs two "
        "to three distinct fitted years on one recipe. **provisional** is one published cycle or one "
        "year. **community** is a fitted non-authority surface. **candidate** is dated data with no "
        "fit. **F** is structurally closed and **FALLBACK** no surface. Grade and tier are "
        "independent. Three classes the round's blocks wrote outside the six-class vocabulary are "
        "carried as written and counted separately, never converted: **A-candidate** (Thailand, "
        "leap block cannot separate its years), **measured** (China, an authority grid that is not a "
        "publisher object) and **A eligible** (Tanzania). Byte-identical relabelled editions are one "
        "computed generation and never lift provisional to A."
    )
    lines.append("")
    lines.append("## Method")
    lines.append("")
    lines.append(
        "Engine: adhan 4.4.6 at `census/adhan-build/node_modules/adhan`, `Rounding.None`, timezone "
        "pinned per country, dates built from literal capture strings, second resolution then "
        "explicit per-column rounding. Exceptions are stated in the entry: the independent NOAA "
        "routine (Pakistan charts), the PrayTimes-v2 family check (Indonesia, masjidi.app), and the "
        "publisher-side `prayTimes.js` (Kazakhstan). Scores are days, cells or delegations as each "
        "entry states. Where a block printed only a percentage, the entry carries the percentage and "
        "no invented denominator."
    )
    lines.append("")
    lines.append(
        "Span verdict vocabulary: **yes**, **no**, **frozen-recomputed**, **frozen-reprint**, "
        "**untestable-single-year**, **untestable-single-template**, **untestable-short-sample**."
    )
    lines.append("")
    lines.append(
        "In the region tables a recipe field appears only where the block states one, in the order "
        "fajr, isha, asr, dhuhr, maghrib, sunrise, margins, rounding, special. A missing field is "
        "not stated in the block; it is never filled from another source."
    )
    lines.append("")
    lines.append("## Integrity note: the fitter bug")
    lines.append("")
    lines.append(
        "`const isha` followed by `+= 1440` silently drops any year containing one after-midnight "
        "isha (register A53, rule-form D9, `o1l-city/us-unresolved/`). The same bug is present in the "
        "US-states copy. The fitter-bug audit had NOT landed when this index closed: "
        "`o1l-city/flags2/` held only `data/quetta-asr-rows.json` and `fit/quetta-asr.mjs`, and "
        "`o1l-city/integrity2/` held `scan.json` and `_md5.txt` only. Every multi-year score in this "
        "index that came from that fitter therefore carries an integrity flag on its entry "
        "(`US-33-METROS`, `MASJIDAL-216-POOL`, and the dpt sample), and no year count here is "
        "certified by the audit. When the audit lands, its findings attach to these ids."
    )
    lines.append("")

    lines.append("## What the round's grades say")
    lines.append("")
    a_ids = [e["id"] for e in ENTRIES if e["grade"] == "A"]
    lines.append(
        "**A, %d entries.** One recipe, two to three or more distinct fitted years."
        % len(a_ids)
    )
    lines.append("")
    for region in REGION_ORDER:
        ids = [e["id"] for e in ENTRIES if e["grade"] == "A" and e["region"] == region]
        if ids:
            lines.append("- %s: %s" % (region, ", ".join(ids)))
    lines.append("")
    lines.append(
        "**The headline finds the grade rule caps, and why.** Thailand's 77 provinces hold one "
        "recipe across two year-blocks but the leap block cannot separate 2024 from 2028, so the "
        "block's own A-candidate class is carried. China's 29 capitals are an authority grid "
        "measured, not a publisher object, so the class is measured. New Zealand's twenty-year "
        "pair, Fiji's twelve sheets, the Maldives' forward years and Germany's 2027 mirror are "
        "all frozen reprints: identical generations supply no distinct year-2. Australia's 218 "
        "grid points sit on one year. India's eight cities are A-grade community inside a "
        "community row, and Brazil is community tier carrying a two-year note, the convention "
        "the diff asks the close to rule."
    )
    lines.append("")
    lines.append(
        "**No entry in this index regresses on a new measurement.** Every cap is a frozen "
        "generation, a single year, or a dated constant: Cyprus north keeps provisional because "
        "its 2025 edition needs one, and Russia's DUM RB keeps provisional because its regime "
        "change is dated 2025."
    )
    lines.append("")

    lines.append("## Reconciliation: the 56 movements")
    lines.append("")
    lines.append(
        "Every grade or span movement in the register's table C is carried by an entry, or named "
        "as having none. Register tables A, B and D are carried per entry in its `register` field; "
        "a correction (A) or a new row (B) that produced no fit has no entry and is not counted "
        "here, and a rule-form (D) rides inside the recipe of the entry that measured it."
    )
    lines.append("")
    lines.append("| # | Object | Entry |")
    lines.append("|---|---|---|")
    for code, obj, ent in MOVEMENTS:
        lines.append("| %s | %s | %s |" % (code, obj, ent))
    lines.append("")

    for region in REGION_ORDER:
        rows = by_region.get(region) or []
        if not rows:
            continue
        lines.append("## %s" % region)
        lines.append("")
        lines.append(md_table(rows))
        lines.append("")

    lines.append("## Flags carried, not adjudicated")
    lines.append("")
    lines.append("| Flag | Item | Entry | State in this index |")
    lines.append("|---|---|---|---|")
    flag_rows = []
    for e in flagged:
        for f in e["flags"]:
            flag_rows.append("| %s | %s | %s | %s |" % (f[0], f[1], e["id"], f[2]))
    lines.extend(sorted(flag_rows))
    lines.append("")
    lines.append(
        "The register's remaining flags are resolved or carried elsewhere: F6 (the 366/365 row "
        "count) in the Peshawar conflict, F7 (the 15/15 denominators) in the US entry's 26-of-37 "
        "reading, F9 (the Cameroon relabel) in the Cameroon conflict, F16 (blocks unreturned) in "
        "the in-flight section, and F17 (platform traps) in the conflict table and here: "
        "goldenmosque.org is Rochdale UK, arresala and fambras are Sao Paulo, masjidway 9631 is "
        "Hyderabad, Cairo's Awqaf site has no prayer-times section, and Monaco's 'monaco' slug is "
        "Beausoleil, France."
    )
    lines.append("## Conflicts")
    lines.append("")
    lines.append(
        "Conflicts are carried, never resolved here. The three that need arbitration at the close "
        "(Pakistan's chart anchor, Indonesia's two national lines, Niger's grade) are inherited from "
        "O1k; the round adds the Oman parameterization (closed degenerate, both carry), the Quetta "
        "asr, Macedonia's +45-minute fajr split, Porto's convention sheet, the India isha line and "
        "the two Indonesia publisher lines."
    )
    lines.append("")
    lines.append("| Entry | Parties or readings | State |")
    lines.append("|---|---|---|")
    for e in conflicts:
        for c in e["conflicts"]:
            lines.append("| %s | %s | %s |" % (e["id"], c[0], c[1]))
    lines.append("")
    lines.append("## In flight at the close")
    lines.append("")
    lines.append(
        "Reports on disk and counted here: `il-ps`, `westafrica2`, `germany-districts`, `fallback2`, "
        "`masjidi`, `capitals3`, `second-witnesses`. Workspaces with data and no report at this cut, "
        "therefore NOT in the counts: `eastasia2` (China grid and Hong Kong years), `canada2`, "
        "`nz-finish`, `athanpro`, `final-sweep`. Their fits land in the next cut of this index."
    )
    lines.append("")
    lines.append("## Not fitted")
    lines.append("")
    lines.append(
        "Surfaces captured with no recipe this round: Switzerland (IZRS login-walled, no dated rows), "
        "Iran (a 30-row Tehran table, not claimed), North Korea (untouched), Monaco, Faroe, "
        "Turkmenistan, South Sudan, Liberia, Myanmar, Guyana, PNG, Solomon Islands, Vanuatu, Samoa, "
        "Kiribati, Palikir, Ngerulmud, Tegucigalpa, Benin's Cotonou row (withdrawn in O1k), and the "
        "four Egyptian ESA options that render empty all year."
    )
    lines.append("")
    lines.append("## Provenance")
    lines.append("")
    lines.append(
        "Every figure is traceable to the block named in the entry's `source` field and to that "
        "block's workspace under `$HOME/athan-gitree/census/o1l-city/`. The register is the digest, "
        "the block is the measurement, and where they differ the block governs. No web access, no "
        "subagents, nothing under /tmp, and the repository was not touched."
    )
    lines.append("")

    md = "\n".join(lines)
    with open("FIT-INDEX-ROUND2.md", "w") as f:
        f.write(md)

    doc = {
        "schema": "athan-fit-index",
        "schemaVersion": "1.0.0",
        "generated": "2026-11-11",
        "generatedBy": "fitindex2 registry agent (O1l-68), O1l city-level round",
        "purpose": "machine-readable index of every fit recipe the O1l round produced. Recipes are transcribed as the fit deliverables state them; nothing is re-derived.",
        "gradingRule": {
            "source": "T-667 #6943 owner multi-year ruling, O1k frozen-generation precedent",
            "gradeA": "at least 2-3 distinct years of fitted evidence, one recipe reproducing every year",
            "provisional": "one published cycle, one year, or a short sample",
            "community": "fitted recipe from a mosque, federation or platform surface",
            "candidate": "dated data, no fit",
            "F": "structurally closed",
            "FALLBACK": "no surface",
            "carriedClasses": {
                "A-candidate": "Thailand: two year-blocks, one recipe, the leap block cannot separate the years",
                "measured": "China: an authority grid measured, not a publisher object",
                "A eligible": "Tanzania: three fitted years, class left unnamed by the block",
            },
            "frozenGenerationPrecedent": "a table proven perpetual or byte-reprinted across nominal years supplies no distinct year-2",
        },
        "method": {
            "engine": "adhan-js 4.4.6 at census/adhan-build, Rounding.None; exceptions stated per entry (NOAA routine, PrayTimes v2 family, publisher prayTimes.js)",
            "scores": "exact = days, cells or delegations reproduced to the printed minute; within1 = inside one minute; worst = largest whole-minute miss; unit stated per entry",
            "spanVerdicts": {
                "yes": "one recipe holds across every held year or edition",
                "no": "the recipe changes inside the span",
                "frozen-recomputed": "one recipe across recomputed years, a genuine multi-year test",
                "frozen-reprint": "one generation republished: year-2 nominal",
                "untestable-single-year": "one year held",
                "untestable-single-template": "one perpetual template",
                "untestable-short-sample": "one month or one short sample",
            },
        },
        "counts": {
            "entries": len(ENTRIES),
            "countries_or_territories": len(countries_real),
            "platform_and_matrix_pools": len(countries) - len(countries_real),
            "grades": grades,
            "conflictEntries": len(conflicts),
            "flaggedEntries": len(flagged),
            "spans": spans,
        },
        "integrity": {
            "fitterBug": "const isha then += 1440 drops any year with an after-midnight isha (A53/D9); present in the US-states copy",
            "auditState": "not landed at this cut; flags2 and integrity2 held no audit report",
            "affectedEntries": ["US-33-METROS", "MASJIDAL-216-POOL"],
        },
        "entries": [
            {
                "id": e["id"],
                "country": e["country"],
                "country_name": e["country_name"],
                "region": e["region"],
                "surface": e["surface"],
                "publisher": e["publisher"],
                "tier": e["tier"],
                "source_workspace": e["source"],
                "register": e.get("register"),
                "data_span": e["data_span"],
                "recipe": e["recipe"],
                "scores": e["scores"],
                "span_verdict": e["span_verdict"],
                "span_note": e["span_note"],
                "grade_candidate": e["grade"],
                "grade_reason": e["grade_reason"],
                "conflicts": [c[0] for c in e.get("conflicts", [])],
                "flags": [f[1] for f in e.get("flags", [])],
                "open_caveats": e.get("open_caveats", []),
            }
            for e in ENTRIES
        ],
    }
    with open("FIT-INDEX-ROUND2.json", "w") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
    print("entries", len(ENTRIES), "countries", len(countries), "grades", grades, "spans", spans)


if __name__ == "__main__":
    main()
