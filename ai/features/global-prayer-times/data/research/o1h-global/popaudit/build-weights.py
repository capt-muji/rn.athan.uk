#!/usr/bin/env python3
"""Audit the O1h population weights and emit weights.json plus the sensitivity numbers.

Basis: Muslim share x 2026 population for every row where WPR publishes both, because
WPR's own Muslim headcount is a share multiplied by a population total of mixed vintage.
The six rows whose share is disputed across sources take the median published share.

Inputs, all fetched 2026-11-10 and saved under raw/:
  raw/wpr-muslim-2026.html    WPR, Muslim Population by Country 2026
  raw/wpr-countries-2026.html WPR, countries by 2026 population
  raw/wiki-*.html             the Wikipedia pages cited for the third share
  methods/raw/pew2020.json    Pew appendix B, 2020 column, derived by the primary pass
  methods/POPULATIONS.md      the primary table under audit
  sim/scores.json             per-country per-method deviations, read only
  sim/aggregates.json         the study's own weighted means, used to validate the replay
"""
import importlib.util
import itertools
import json
import statistics
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parent
RAW = HERE / "raw"


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


pp = load("pp", HERE / "parse-populations.py")
pw = load("pw", HERE / "parse-wiki.py")


def table(path, needle):
    parser = pw.Tables()
    parser.feed(Path(path).read_text(encoding="utf-8", errors="replace"))
    for t in parser.tables:
        rows = [[" ".join("".join(c).split()) for c in r] for r in t if r]
        if rows and needle.lower() in " ".join(rows[0]).lower():
            return [r for r in rows[1:] if r]
    raise SystemExit(f"table not found in {path}")


def millions(text):
    text = text.replace(",", "").strip()
    if not text:
        return None
    try:
        if text.endswith("K"):
            return float(text[:-1]) / 1000
        if text.endswith("M"):
            return float(text[:-1])
        if text.endswith("B"):
            return float(text[:-1]) * 1000
        return float(text) / 1e6
    except ValueError:
        return None


def share(text):
    try:
        return float(text.replace("%", ""))
    except ValueError:
        return None


ALIAS = {"Cote d'Ivoire": "Ivory Coast"}  # WPR omits Kosovo and Czechia entirely
ROWS = pp.parse()
WPR = {
    r[1]: (millions(r[2]), share(r[3]))
    for r in table(RAW / "wpr-muslim-2026.html", "Muslim Population")
    if len(r) > 3 and r[1] and r[2]
}
POP = {r[1]: millions(r[2]) for r in table(RAW / "wpr-countries-2026.html", "2026 Pop.") if len(r) > 2 and r[1]}
PEW = json.loads((ROOT / "methods" / "raw" / "pew2020.json").read_text())

# Third-source shares for the six, each from a page saved under raw/.
EXTRA_SHARES = {
    "Nigeria": [("CIA World Factbook 2018, via Wikipedia Islam in Nigeria", 53.5, 2018)],
    "Egypt": [("Arab Barometer wave V 2018, via Wikipedia Islam in Egypt", 90.4, 2018)],
    "Sudan": [("UNDP Sudan, via Wikipedia Islam in Sudan", 97.0, 2024)],
    "Yemen": [("Wikipedia, Islam in Yemen: over 99 pc", 99.0, 2024)],
    "Syria": [("Wikipedia, Islam in Syria: 87 pc", 87.0, 2024)],
    "Russia": [("Mufti Council via TASS 2015, via Wikipedia Islam in Russia", 13.7, 2015)],
}
# Share endpoints the Wikipedia "Islam by country" table carries for the same rows.
WIKI_SHARE_RANGE = {"Nigeria": (47.0, 49.0), "Egypt": (90.0, 94.7), "Russia": (10.0, 12.0)}
DISPUTED = ["Nigeria", "Egypt", "Sudan", "Yemen", "Syria", "Russia"]

SIM_WEIGHT = {
    "EG-ESA": 87.5, "MA-HABOUS": 36.4, "LK-ACJU": 2.1, "TH-CICOT": 3.6, "KW-AJIRI": 2.2,
    "ME-IZMR": 0.12, "YE-AWQAF-SANAA": 26.8, "JERUSALEM-AWQAF": 4.3, "AE-AWQAF": 6.3,
    "BA-RIJASET": 2.0, "BE-EMB": 0.88, "TN-INM": 10.2, "KZ-MUFTIYAT": 13.2, "KG-MUFTIYAT": 5.5,
    "MV-MUIS": 0.37, "SG-MUIS": 0.92, "MY-JAKIM": 20.1, "TR-DIYANET-DOMESTIC": 81.2,
    "GB-LONDON-INTERVAL-TABLE": 4.0, "IS-FELAG": 0.001, "GR-ATHENS": 0.31, "GR-KOMOTINI": 0.31,
    "BG-SOFIA": 0.86, "OM-MARA": 2.4, "CZ-CENTRUM": 0.03, "CL-CIS": 0.004, "SA-KACST": 31.5,
    "IQ-DIWAN": 39.0, "HK-MASJIDAL": 0.3, "BD-IFB": 150.8, "LY-MUAZZIN": 6.6, "JO-AWQAF": 10.2,
    "IR-NATIONAL": 85.7, "SD-MINISTRY": 38.6, "IT-UCOII": 3.0, "RU-DUMRT": 15.0, "CY-KKTC": 0.28,
    "PT-HSALAH-HUB": 0.04, "ES-CCIM": 2.5, "UZ-ISLOM": 29.9, "XK-BIK": 1.7, "NE-BUTIN": 21.1,
    "RU-DUMRF-MOSCOW": 15.0, "QA-MOI": 1.6, "ID-KEMENAG": 249.8, "PK-DEFACTO": 233.0,
    "IN-DEFACTO": 200.0, "NG-SPA": 96.0, "GB-WIFAQUL-ULAMA": 4.0,
}
DUPLICATE = {"GR-KOMOTINI", "RU-DUMRF-MOSCOW", "GB-WIFAQUL-ULAMA"}
ROW_FOR_COUNTRY = {
    "Egypt": "EG-ESA", "Yemen": "YE-AWQAF-SANAA", "Sudan": "SD-MINISTRY",
    "Russia": "RU-DUMRT", "Nigeria": "NG-SPA",
}

def rounded(value):
    """Keep a tenth above 10M and enough digits below it to stay non-zero."""
    if value >= 10:
        return round(value, 1)
    if value >= 1:
        return round(value, 2)
    if value >= 0.01:
        return round(value, 3)
    return round(value, 4)


PRIORITY = "World Population Review, Muslim Population by Country 2026"
PEW_NAME = "Pew Research Center, Appendix B religious composition table (2020 column)"


def decided(country, row):
    """(chosen_m, sources, reason, low, high)."""
    key = ALIAS.get(country, country)
    primary = row["wpr"]
    if key not in WPR or key not in POP:  # Kosovo and Czechia: WPR omits the row
        sources = [{"name": PEW_NAME, "figure": primary, "year": 2020}]
        return (
            primary,
            sources,
            f"Pew {primary}M stands as the only listed figure: WPR omits the row, and the primary derives it as Pew's share of a Pew total",
            primary,
            primary,
        )

    wpr_m, wpr_share = WPR[key]
    total = POP[key]
    sources = [{"name": PRIORITY, "figure": wpr_m, "year": 2026}]
    if row["pew"] is not None:
        sources.append({"name": PEW_NAME, "figure": row["pew"], "year": 2020})

    if country not in DISPUTED:
        chosen = rounded(wpr_share * total / 100)
        implied = wpr_m / wpr_share * 100
        gap = 100 * (total - implied) / total
        if gap < 1:
            reason = (
                f"WPR's {wpr_share} pc share against its own 2026 total of {total:.1f}M, which returns the published "
                f"{wpr_m}M; the row is already on a current denominator"
            )
        else:
            reason = (
                f"WPR's {wpr_share} pc share against its own 2026 total of {total:.1f}M, not its published {wpr_m}M, "
                f"because that figure assumes a population of {implied:.1f}M, {gap:.0f} pc short of today's"
            )
        return chosen, sources, reason, chosen, chosen

    pool = [wpr_share, PEW[country]["muslimPct"]] + [s for _, s, _ in EXTRA_SHARES[country]]
    if country in WIKI_SHARE_RANGE:
        pool += list(WIKI_SHARE_RANGE[country])
    for label, value, year in EXTRA_SHARES[country]:
        sources.append({"name": label, "figure": rounded(value * total / 100), "year": year})
    med = round(statistics.median(pool), 2)
    chosen = rounded(med * total / 100)
    reason = (
        f"Median of the {len(pool)} published shares ({min(pool)} to {max(pool)} pc) applied to WPR's 2026 total of "
        f"{total:.1f}M, because the sources dispute the share, not the population, and the WPR row is "
        f"{100 * (total - wpr_m / wpr_share * 100) / total:.0f} pc behind today's"
    )
    return chosen, sources, reason, rounded(min(pool) * total / 100), rounded(max(pool) * total / 100)


def main():
    weights, low, high = {}, {}, {}
    for row in ROWS:
        chosen, sources, reason, lo, hi = decided(row["country"], row)
        weights[row["country"]] = {"millions": chosen, "sources": sources, "reason": reason}
        low[row["country"]], high[row["country"]] = lo, hi
    (HERE / "weights.json").write_text(json.dumps(weights, indent=1) + "\n", encoding="utf-8")

    ranked = sorted(ROWS, key=lambda r: -weights[r["country"]]["millions"])
    total = sum(v["millions"] for v in weights.values())
    primary_total = sum(r["wpr"] for r in ROWS)
    top30 = sum(weights[r["country"]]["millions"] for r in ranked[:30])
    primary_top30 = sum(r["wpr"] for r in sorted(ROWS, key=lambda r: -r["wpr"])[:30])

    stale = []
    for row in ROWS:
        key = ALIAS.get(row["country"], row["country"])
        if key in WPR and key in POP:
            implied = WPR[key][0] / WPR[key][1] * 100
            stale.append(((POP[key] - implied) / POP[key] * 100, row["country"]))
    vals = sorted(s[0] for s in stale)
    top30_names = {r["country"] for r in ranked[:30]}
    top_vals = [s[0] for s in stale if s[1] in top30_names]

    # --- sensitivity: replay the study's weighted means -----------------------
    scores = json.loads((ROOT / "sim" / "scores.json").read_text())
    cells = {c["id"]: c for c in scores["cells"]}
    methods = sorted({m for c in scores["cells"] for m in c["cells"] if m != "combined"})

    def weighted(fn):
        out = {}
        for mid in methods:
            num = den = 0.0
            for cid, cell in cells.items():
                m = cell["cells"].get(mid)
                w = fn(cid)
                if not m or not w:
                    continue
                num += w * m["combined"]
                den += w
            out[mid] = num / den if den else float("nan")
        return out

    base = weighted(lambda cid: 0 if cid in DUPLICATE else SIM_WEIGHT.get(cid, 0))

    def audit_w(cid):
        if cid in DUPLICATE:
            return 0
        for country, row_id in ROW_FOR_COUNTRY.items():
            if cid == row_id:
                return weights[country]["millions"]
        return SIM_WEIGHT.get(cid, 0)

    audited = weighted(audit_w)

    # cross-check the replay against the study's own aggregates
    agg = {t["id"]: t["weighted"] for t in json.loads((ROOT / "sim" / "aggregates.json").read_text())["table"]}
    alias = {
        "mwl": "mwl", "egyptian": "egyptian", "isna15": "isna", "ummalqura": "umm-al-qura",
        "karachi": "karachi", "jakim": "jakim", "dubai": "dubai", "tehran": "tehran",
        "ecfr": "ecfr", "mabims": "mabims", "qatar": "qatar", "kuwait": "kuwait",
        "singapore": "singapore-muis", "fazilet-a": "fazilet-a", "fazilet-b": "fazilet-b",
        "diyanet-tr": "diyanet-domestic", "diyanet-eu": "diyanet-europe",
        "russia": "russia-sam", "moonsighting": "moonsighting",
    }
    checks = [
        {"method": m, "replay": round(base[m], 3), "study": round(agg[a], 3)}
        for m, a in alias.items()
        if a in agg
    ]

    def rank_of(values):
        return {m: i + 1 for i, m in enumerate(sorted(methods, key=lambda x: values[x]))}

    corners = []
    for bits in itertools.product([0, 1], repeat=len(ROW_FOR_COUNTRY)):
        pick = {
            row_id: (low[c] if b == 0 else high[c])
            for (c, row_id), b in zip(ROW_FOR_COUNTRY.items(), bits)
        }
        corners.append(weighted(lambda cid, p=pick: 0 if cid in DUPLICATE else p.get(cid, SIM_WEIGHT.get(cid, 0))))

    swing = {}
    for mid in methods:
        vals_m = [c[mid] for c in corners]
        swing[mid] = {
            "min": round(min(vals_m), 3),
            "max": round(max(vals_m), 3),
            "span": round(max(vals_m) - min(vals_m), 3),
            "primary": round(base[mid], 3),
            "audited": round(audited[mid], 3),
            "primaryToAudited": round(audited[mid] - base[mid], 3),
        }
    corner_ranks = [rank_of(c) for c in corners]
    rank_swing = {m: [min(r[m] for r in corner_ranks), max(r[m] for r in corner_ranks)] for m in methods}
    base_rank, aud_rank = rank_of(base), rank_of(audited)

    summary = {
        "rows": len(ROWS),
        "totalCovered": round(total, 1),
        "primaryTotalCovered": round(primary_total, 1),
        "changePct": round(100 * (total - primary_total) / primary_total, 1),
        "top30": round(top30, 1),
        "primaryTop30": round(primary_top30, 1),
        "top30SharePct": round(100 * top30 / total, 2),
        "primaryTop30SharePct": round(100 * primary_top30 / primary_total, 2),
        "top10": [[r["country"], weights[r["country"]]["millions"]] for r in ranked[:10]],
        "primaryTop10": [[r["country"], r["wpr"]] for r in sorted(ROWS, key=lambda r: -r["wpr"])[:10]],
        "staleness": {
            "rowsTested": len(stale),
            "median": round(statistics.median(vals), 1),
            "mean": round(sum(vals) / len(vals), 1),
            "p25": round(vals[len(vals) // 4], 1),
            "p75": round(vals[3 * len(vals) // 4], 1),
            "top30Median": round(statistics.median(top_vals), 1),
            "worst": [[round(s, 1), c] for s, c in sorted(stale, reverse=True)[:6]],
        },
        "disputed": {
            c: {
                "primary": next(r["wpr"] for r in ROWS if r["country"] == c),
                "chosen": weights[c]["millions"],
                "low": low[c],
                "high": high[c],
                "impliedPopulation": round(
                    next(r["wpr"] for r in ROWS if r["country"] == c) / WPR[ALIAS.get(c, c)][1] * 100, 1
                ),
                "wprPopulation2026": POP[ALIAS.get(c, c)],
            }
            for c in DISPUTED
            if (ALIAS.get(c, c) in WPR and ALIAS.get(c, c) in POP)
        },
        "sensitivity": {
            "scoredTargets": len(cells),
            "disputedScored": ROW_FOR_COUNTRY,
            "weightSpanPctOfTotal": {
                c: round(100 * (high[c] - low[c]) / total, 2) for c in DISPUTED if c != "Syria"
            },
            "maxWeightedMeanSwing": round(max(v["span"] for v in swing.values()), 3),
            "maxPrimaryToAudited": round(max(abs(v["primaryToAudited"]) for v in swing.values()), 3),
            "perMethod": swing,
            "rankSwing": {m: v for m, v in rank_swing.items() if v[0] != v[1]},
            "rankChangesPrimaryToAudited": {m: [base_rank[m], aud_rank[m]] for m in methods if base_rank[m] != aud_rank[m]},
            "replayCheck": checks,
            "maxReplayError": round(max(abs(c["replay"] - c["study"]) for c in checks), 4),
        },
    }
    (HERE / "summary.json").write_text(json.dumps(summary, indent=1) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in summary.items() if k != "sensitivity"}, indent=1))
    print("max swing", summary["sensitivity"]["maxWeightedMeanSwing"])
    print("max primary->audited", summary["sensitivity"]["maxPrimaryToAudited"])
    print("rank changes", summary["sensitivity"]["rankChangesPrimaryToAudited"])
    print("rank swings", summary["sensitivity"]["rankSwing"])
    print("replay error", summary["sensitivity"]["maxReplayError"])


if __name__ == "__main__":
    main()
