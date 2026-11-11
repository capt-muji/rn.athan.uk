#!/usr/bin/env python3
"""Re-parse the saved captures (no network) to refresh index.json after a parser change."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import cities  # noqa: E402

DATA = os.path.join(ROOT, "data")
CAP = os.path.join(ROOT, "captures", "cities")


def main():
    uni = [l.rstrip("\n").split("\t") for l in open(os.path.join(DATA, "universe.tsv"))]
    index, fails = [], []
    for u in uni:
        p = os.path.join(CAP, u[0], f"{u[2]}.html")
        if not os.path.exists(p):
            fails.append([u[0], u[2], "not-captured"])
            continue
        h = open(p, encoding="utf-8", errors="replace").read()
        rec = cities.parse(h, u[0], u[2])
        if rec.get("err"):
            fails.append([u[0], u[2], rec["err"]])
            continue
        rows = rec.pop("rows")
        json.dump(rows, open(os.path.join(DATA, f"{u[0]}-{u[2]}.json"), "w"), indent=0)
        rec["rows"] = len(rows)
        index.append(rec)
    json.dump(index, open(os.path.join(DATA, "index.json"), "w"), indent=1)
    json.dump(fails, open(os.path.join(DATA, "fails.json"), "w"), indent=1)
    print(f"reparsed {len(index)} pages, {len(fails)} failures")
    for f in fails:
        print("FAIL", f)


if __name__ == "__main__":
    main()
