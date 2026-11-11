"""Batch-transcribe the 34 FIANZ 1447H sheets and write one dated-row file per city.

Row dates are derived structurally: every sheet prints Ramadan 1 against 19 February
2026, and the printed date column is checked against that derivation wherever OCR
reads it. Cells that break day-to-day smoothness are re-cropped wider and the
candidate nearest the neighbour interpolation wins; anything still broken is left
null and reported, never guessed.
"""
import json
import re
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
OCR = HERE.parent / "bin" / "ocrfast"
WORK = HERE.parent / "captures" / "ocr"
DATA = HERE.parent / "data"
CAP = Path.home() / "athan-gitree/census/o1l-city/O1l-19r/captures"

TIMECOLS = ["suhoor", "fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
START = date(2026, 2, 19)


def run_ocr(path):
    out = subprocess.run([str(OCR), str(path)], capture_output=True, text=True)
    items = []
    for line in out.stdout.splitlines():
        parts = line.split("\t")
        if len(parts) != 6:
            continue
        x, y, w, h, conf, text = parts
        items.append({"x": float(x), "y": float(y), "w": float(w), "h": float(h),
                      "conf": float(conf), "text": text.strip()})
    return items


def norm_time(s):
    if not s:
        return None
    s = s.strip().replace(" ", "").replace("I", "1").replace("l", "1").replace("|", "1")
    m = re.match(r"^(\d{1,2})[:;.]?(\d{2})$", s)
    if not m:
        return None
    h, mi = int(m.group(1)), int(m.group(2))
    if h > 24 or mi > 59:
        return None
    return f"{h:02d}:{mi:02d}"


def mins(s):
    return int(s[:2]) * 60 + int(s[3:])


def cell_ocr(img, yc, xc, hw=0.030, hh=0.0080, factor=4):
    im = Image.open(img)
    W, H = im.size
    box = ((xc - hw) * W, (1 - yc - hh) * H, (xc + hw) * W, (1 - yc + hh) * H)
    crop = im.crop(tuple(int(v) for v in box))
    crop = crop.resize((crop.width * factor, crop.height * factor), Image.LANCZOS)
    p = WORK / "cell.png"
    crop.save(p, quality=95)
    return [i["text"] for i in sorted(run_ocr(p), key=lambda i: -i["conf"])]


HEADERS = {
    "ramadan": ["RAMADAN"], "date": ["FEBRUARY", "MARCH"], "day": ["DAY"],
    "suhoor": ["SUHOOR"], "fajr": ["FAJR"], "sunrise": ["SHURUQ", "SUNRISE"],
    "dhuhr": ["ZUHR", "DHUHR"], "asr": ["ASR"],
    "maghrib": ["MAGRIB", "MAGHRIB", "IFTAR"], "isha": ["ISHA"],
}


def transcribe(img_path):
    im = Image.open(img_path)
    im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    big = WORK / "big.jpg"
    im.save(big, quality=95)
    items = run_ocr(big)
    colx, heady = {}, []
    for it in items:
        t = it["text"].upper().replace(" ", "")
        for name, keys in HEADERS.items():
            if t in keys:
                colx.setdefault(name, []).append(it["x"] + it["w"] / 2)
                heady.append(it["y"])
    colx = {k: sum(v) / len(v) for k, v in colx.items()}
    missing = [c for c in ["ramadan"] + TIMECOLS if c not in colx]
    if missing:
        return {"error": f"headers missing {missing}", "headers": colx}

    ys = []
    for it in items:
        cx = it["x"] + it["w"] / 2
        if norm_time(it["text"]) and min(abs(cx - c) for c in colx.values()) < 0.05:
            ys.append(it["y"] + it["h"] / 2)
    floor = min(heady) - 0.004 if heady else 1.0
    ys = [y for y in ys if y < floor]
    ys.sort(reverse=True)
    groups = []
    for y in ys:
        if groups and abs(groups[-1][0] - y) < 0.0075:
            groups[-1].append(y)
        else:
            groups.append([y])
    bnds = [sum(g) / len(g) for g in groups]
    if len(bnds) > 30:
        # footer text can parse as a time; keep the longest evenly spaced run
        deltas = sorted(abs(a - b) for a, b in zip(bnds, bnds[1:]))
        step = deltas[len(deltas) // 2]
        runs, cur = [], [bnds[0]]
        for prev, nxt in zip(bnds, bnds[1:]):
            if abs(abs(prev - nxt) - step) < 0.005:
                cur.append(nxt)
            else:
                runs.append(cur)
                cur = [nxt]
        runs.append(cur)
        bnds = max(runs, key=len)
    if len(bnds) != 30:
        return {"error": f"row bands {len(bnds)}", "band_ys": [round(b, 4) for b in bnds]}

    def cell_at(y, cx):
        best = None
        for it in items:
            cy = it["y"] + it["h"] / 2
            cxx = it["x"] + it["w"] / 2
            if abs(cy - y) < 0.0085 and abs(cxx - cx) < 0.045:
                if best is None or abs(cxx - cx) < abs(best["x"] + best["w"] / 2 - cx):
                    best = it
        return best["text"] if best else None

    rows = []
    for i, y in enumerate(bnds):
        row = {"n": i + 1, "y": y}
        for name in TIMECOLS:
            v = norm_time(cell_at(y, colx[name]))
            if v is None:
                for c in cell_ocr(img_path, y, colx[name]):
                    v = norm_time(c)
                    if v:
                        break
            row[name] = v
        row["date"] = cell_at(y, colx.get("date", 0.195))
        rows.append(row)

    # smoothness repair: a cell that jumps against both neighbours is re-read wider
    log = []
    for c in TIMECOLS:
        for i in range(len(rows)):
            vals = [rows[j][c] for j in (i - 1, i + 1) if 0 <= j < 30 and rows[j][c]]
            if len(vals) < 1 or not rows[i][c]:
                continue
            tgt = sum(mins(v) for v in vals) / len(vals)
            if abs(mins(rows[i][c]) - tgt) <= 4:
                continue
            cands = [norm_time(x) for x in cell_ocr(img_path, rows[i]["y"], colx[c], hw=0.035, hh=0.0090)]
            cands = [x for x in cands if x]
            if not cands:
                continue
            pick = min(cands, key=lambda x: abs(mins(x) - tgt))
            if abs(mins(pick) - tgt) < abs(mins(rows[i][c]) - tgt):
                log.append([rows[i]["n"], c, rows[i][c], pick])
                rows[i][c] = pick

    # suhoor is printed exactly five minutes before fajr on every sheet
    for row in rows:
        if row["suhoor"] and row["fajr"] and mins(row["fajr"]) - mins(row["suhoor"]) != 5:
            log.append([row["n"], "suhoor", row["suhoor"], f"fajr-5 of {row['fajr']}"])
            row["suhoor"] = f"{(mins(row['fajr']) - 5) // 60:02d}:{(mins(row['fajr']) - 5) % 60:02d}"
    return {"rows": rows, "log": log, "colx": colx}


def main():
    imgs = sorted(CAP.glob("nz-fianzcom-1447-*.jpg"))
    DATA.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for img in imgs:
        city = img.stem.replace("nz-fianzcom-1447-", "")
        res = transcribe(img)
        if "error" in res:
            print(city, "ERROR", res["error"])
            manifest[city] = {"error": res["error"]}
            continue
        out = {}
        datecheck = []
        for row in res["rows"]:
            d = START + timedelta(days=row["n"] - 1)
            iso = d.isoformat()
            if row["date"] and row["date"].isdigit():
                printed = int(row["date"])
                if printed != d.day:
                    datecheck.append([row["n"], printed, d.day])
            if any(row[c] is None for c in TIMECOLS):
                out[iso] = {c: row[c] for c in TIMECOLS}
            else:
                out[iso] = {("suhoorEnds" if c == "suhoor" else c): row[c] for c in TIMECOLS}
        (DATA / f"nz-2026-{city}.json").write_text(json.dumps({
            "_source": f"fianz.com/ramzan-calendar 1447H sheet, image captures/nz-fianzcom-1447-{city}.jpg "
                       f"(captured 2026-11-11 by O1l-19r), transcribed by OCR + geometry, "
                       f"structural checks suhoor=fajr-5 and day-to-day smoothness",
            "_sheet_printed": "5 min between suhoor end and fajr; 5 min between sunset and maghrib/iftar; "
                              "asr single shadow; double-shadow asr 40 min later; isha per shafaqul ahmar 15 min earlier",
            "rows": out,
        }, indent=1))
        bad = [r["n"] for r in res["rows"] if any(r[c] is None for c in TIMECOLS)]
        manifest[city] = {"rows": len(out), "incomplete": bad, "log": res["log"],
                          "date_mismatch": datecheck}
        print(city, "rows", len(out), "incomplete", bad, "log", len(res["log"]),
              "date_mismatch", datecheck)
    (DATA / "manifest-2026.json").write_text(json.dumps(manifest, indent=1))


if __name__ == "__main__":
    main()
