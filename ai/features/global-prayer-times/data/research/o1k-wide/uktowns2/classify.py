#!/usr/bin/env python3
"""Classify every captured table: LUPT-follower, Hanafi own-table, or independent own-table."""
import json, glob, os

HERE = os.path.dirname(os.path.abspath(__file__))


def to24(field, t):
    h, m = (int(x) for x in t.split(":"))
    if field in ("dhuhr", "asr1", "asr2", "magrib", "isha") and h < 11:
        h += 12
    return f"{h:02d}:{m:02d}"


def mins(t):
    h, m = t.split(":")
    return int(h) * 60 + int(m)


REF = {}
for f in glob.glob(f"{HERE}/data/lupt-2027-*.json"):
    for d, row in json.load(open(f)).items():
        REF[d[5:]] = {k: to24(k, v) for k, v in row.items()}

SURFACES = [
    ("Luton", "Central Mosque Luton (PDF Nov 2026)", "luton-central-mosque-2026-11"),
    ("Luton", "Bury Park Jamia Masjid (app only)", None),
    ("Slough", "Jamia Masjid & Islamic Centre Slough (dpt year)", "slough-jmic-2022"),
    ("Slough", "Slough Islamic Trust (live today row)", None),
    ("Reading", "Aisha Masjid & Islamic Centre (readingmuslim.uk ICS)", "reading-amic-2026"),
    ("Oxford", "Central Oxford Mosque Society (dpt year)", "oxford-coms-2026"),
    ("Oxford", "Madina Masjid Oxford (dpt year, 7 rows/2031)", None),
    ("Cambridge", "Cambridge Central Mosque (monthly page)", "cambridge-central-2026-11"),
    ("Brighton", "Al Medinah Mosque (masjidway month)", "brighton-almedinah-2026-11"),
    ("Nottingham", "Islamic Centre Nottingham (dpt year)", "nottingham-ic-2026"),
    ("Coventry", "Masjid Zeenatul Islam (dpt year)", "coventry-zeenatul-islam-2026"),
    ("Stoke", "City Central Mosque (dpt month)", "stoke-citycentral-month"),
    ("Bolton", "Zakariyya Jaame Masjid (calendar PDF 2026)", "bolton-zakariyya-2026"),
    ("Oldham", "Oldham Central Masjid & Islamic Centre (dpt year)", "oldham-ocmic-2026"),
    ("Oldham", "Westwood Mosque (dpt year)", "oldham-westwood-2026"),
    ("Rochdale", "Golden Mosque (dpt year)", "rochdale-golden-2026"),
    ("Rochdale", "Central Masjid Rochdale (monthly PDF, column-scrambled)", None),
    ("Walsall", "Walsall Jamia Masjid Ghausia (dpt year)", "walsall-wjmg-2020"),
    ("Dudley", "Dudley mosque & Muslim community centre (masjidway month)", "dudley-mcc-2026-11"),
    ("Preston", "Jamea Masjid Preston (masjid247 image Nov 2026)", "preston-jamea-2026-11"),
    ("Blackpool", "Central Mosque Blackpool (masjid247 image Nov 2026)", "blackpool-central-2026-11"),
    ("Middlesbrough", "Middlesbrough Central Masjid (rendered month)", "middlesbrough-central-2026-11"),
    ("Stockport", "Stockport Islamic Centre (monthly page)", "stockport-islamic-centre-2026-11"),
    ("Watford", "Watford Jamia Mosque (image Nov 2026)", "watford-jamia-2026-11"),
    ("Ilford", "Ilford mosque (masjidway month)", "ilford-2026-11"),
]

def main():
    out = []
    for town, label, name in SURFACES:
        if not name:
            continue
        tab = {d: {k: to24(k, v) for k, v in r.items()} for d, r in json.load(open(f"{HERE}/data/{name}.json")).items()}
        dates = sorted(tab)
        has_year = len({d[5:7] for d in dates}) > 2
        picks = ["01-15", "04-15", "07-15"] if has_year else ["11-01", "11-15", "11-30"]
        fajr = [(mins(tab[d]["fajr"]) - mins(REF[d[5:]]["fajr"])) for d in dates
                if d[5:] in REF and tab[d].get("fajr")]
        asr1 = [(mins(tab[d]["asr1"]) - mins(REF[d[5:]]["asr1"])) for d in dates
                if d[5:] in REF and tab[d].get("asr1")]
        asr2 = [(mins(tab[d]["asr1"]) - mins(REF[d[5:]]["asr2"])) for d in dates
                if d[5:] in REF and tab[d].get("asr1")]
        duhr = [(mins(tab[d]["dhuhr"]) - mins(REF[d[5:]]["dhuhr"])) for d in dates
                if d[5:] in REF and tab[d].get("dhuhr")]
        samples = []
        for p in picks:
            d = next((x for x in dates if x[5:] == p), None)
            samples.append(f"{p} {mins(tab[d]['fajr'])-mins(REF[p]['fajr']):+d}" if d else f"{p} -")
        exact = sum(1 for v in fajr if v == 0)
        hanafi = abs(sum(asr1) / len(asr1)) > abs(sum(asr2) / len(asr2)) if asr1 else None
        kind = "LUPT-exact" if exact >= 0.95 * len(fajr) else ("Hanafi own-table" if hanafi else "independent own-table")
        rec = dict(town=town, surface=label, rows=len(tab), n=len(fajr), fajr_exact=exact,
                   fajr_mean=round(sum(fajr) / len(fajr), 1), fajr_max=max(abs(v) for v in fajr),
                   dhuhr_mean=round(sum(duhr) / len(duhr), 1) if duhr else None,
                   asr_vs_mithl1=round(sum(asr1) / len(asr1), 1) if asr1 else None,
                   asr_vs_mithl2=round(sum(asr2) / len(asr2), 1) if asr2 else None,
                   hanafi=hanafi, kind=kind, samples=" ".join(samples))
        out.append(rec)
        print(f"{town:14} {label[:46]:46} {len(tab):>3}r exact={exact:>3}/{len(fajr):<3} "
              f"fajrmean={rec['fajr_mean']:>6} dhuhr={rec['dhuhr_mean']:>6} asr1={rec['asr_vs_mithl1']} "
              f"asr2={rec['asr_vs_mithl2']} -> {kind:22} {rec['samples']}")

    json.dump(out, open(f"{HERE}/data/_classification.json", "w"), indent=1)
    lupt = [r for r in out if r["kind"] == "LUPT-exact"]
    han = [r for r in out if r["kind"] == "Hanafi own-table"]
    print(f"\n{len(out)} tables: LUPT-exact {len(lupt)}, Hanafi own {len(han)}, independent own {len(out)-len(lupt)-len(han)}")
    print("towns following LUPT:", sorted({r['town'] for r in lupt}) or "none")
    print("towns Hanafi:", sorted({r['town'] for r in han}))

if __name__ == "__main__":
    main()
