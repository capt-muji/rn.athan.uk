import json, sys, os, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parse_ifi_pdfs import parse

ML = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
# IFI's clock rule: BST applied from 1 April, GMT restored 1 November.
# Real Europe/Dublin DST in 2026: 29 March - 25 October.
LATE_START = [(3, 29), (3, 30), (3, 31)]          # printed in GMT, should be BST
LATE_END = [(10, d) for d in range(25, 32)]        # printed in BST, should be GMT


def shift(rec, minutes):
    out = {}
    for k, v in rec.items():
        h, m = v.split(":")
        t = (int(h) * 60 + int(m) + minutes) % 1440
        out[k] = f"{t // 60:02d}:{t % 60:02d}"
    return out


def main():
    os.makedirs("data", exist_ok=True)
    for path in sorted(glob.glob("captures/ifi_*_prayer_timetable.pdf")):
        city = os.path.basename(path).replace("ifi_", "").replace("_prayer_timetable.pdf", "")
        d, bad = parse(path)
        printed, corrected = {}, {}
        for mo in range(1, 13):
            for dd in range(1, ML[mo - 1] + 1):
                rec = d.get(mo, {}).get(dd)
                if not rec:
                    continue
                iso = f"2026-{mo:02d}-{dd:02d}"
                printed[iso] = rec
                if (mo, dd) in LATE_START:
                    corrected[iso] = shift(rec, 60)
                elif (mo, dd) in LATE_END:
                    corrected[iso] = shift(rec, -60)
                else:
                    corrected[iso] = rec
        json.dump(printed, open(f"data/ifi_{city}_2026_printed.json", "w"), indent=0, sort_keys=True)
        json.dump(corrected, open(f"data/ifi_{city}_2026.json", "w"), indent=0, sort_keys=True)
        print(f"{city:14s} printed={len(printed):3d} corrected={len(corrected):3d} defects={bad}")


if __name__ == "__main__":
    main()
