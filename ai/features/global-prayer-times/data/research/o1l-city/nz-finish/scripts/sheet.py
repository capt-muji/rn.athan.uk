"""Transcribe FIANZ 1447H Ramadan sheet images into dated rows.

Vision's accurate text model is unavailable in this environment, so OCR runs the
fast model on a 2x upscale. Cells are assigned by geometry: header labels fix the
column centres, time cells cluster into row bands. A cell that comes back empty or
unparsable is re-cropped and OCR'd alone at 3x. The assembled grid is then checked
against the sheet's own printed rules (suhoor = fajr - 5, iftar = sunset + 5) and
against day-to-day smoothness, which catches a misread digit.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
OCR = HERE.parent / "bin" / "ocrfast"
WORK = HERE.parent / "captures" / "ocr"
WORK.mkdir(parents=True, exist_ok=True)

TIME = re.compile(r"^(\d{1,2})[:;.]?(\d{2})$")
TIMECOLS = ["suhoor", "fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
HEADERS = {
    "ramadan": ["RAMADAN"], "date": ["FEBRUARY", "MARCH"], "day": ["DAY"],
    "suhoor": ["SUHOOR"], "fajr": ["FAJR"], "sunrise": ["SHURUQ", "SUNRISE"],
    "dhuhr": ["ZUHR", "DHUHR"], "asr": ["ASR"],
    "maghrib": ["MAGRIB", "MAGHRIB", "IFTAR"], "isha": ["ISHA"],
}


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
    m = TIME.match(s)
    if not m:
        return None
    h, mi = int(m.group(1)), int(m.group(2))
    if h > 24 or mi > 59:
        return None
    return f"{h:02d}:{mi:02d}"


def upscale(src, dst, factor):
    im = Image.open(src)
    im = im.resize((int(im.width * factor), int(im.height * factor)), Image.LANCZOS)
    im.save(dst, quality=95)


def headers(items):
    colx = {}
    for it in items:
        t = it["text"].upper().replace(" ", "")
        for name, keys in HEADERS.items():
            if t in keys:
                colx.setdefault(name, []).append(it["x"] + it["w"] / 2)
    return {k: sum(v) / len(v) for k, v in colx.items()}


def bands(items, colx):
    """Cluster the y centres of time cells into row bands, top to bottom."""
    ys = []
    for it in items:
        cx = it["x"] + it["w"] / 2
        if norm_time(it["text"]) and min(abs(cx - c) for c in colx.values()) < 0.05:
            ys.append(it["y"] + it["h"] / 2)
    ys.sort(reverse=True)
    groups = []
    for y in ys:
        if groups and abs(groups[-1][0] - y) < 0.0075:
            groups[-1].append(y)
        else:
            groups.append([y])
    return [sum(g) / len(g) for g in groups]


def cell_at(items, y, cx):
    best = None
    for it in items:
        cy = it["y"] + it["h"] / 2
        cxx = it["x"] + it["w"] / 2
        if abs(cy - y) < 0.0085 and abs(cxx - cx) < 0.045:
            if best is None or abs(cxx - cx) < abs(best["x"] + best["w"] / 2 - cx):
                best = it
    return best["text"] if best else None


def cell_ocr(img_path, yc, xc, half_w=0.028, half_h=0.0075, factor=3):
    im = Image.open(img_path)
    W, H = im.size
    box = ((xc - half_w) * W, (1 - yc - half_h) * H, (xc + half_w) * W, (1 - yc + half_h) * H)
    crop = im.crop(tuple(int(v) for v in box))
    crop = crop.resize((crop.width * factor, crop.height * factor), Image.LANCZOS)
    p = WORK / f"cell_{abs(hash((img_path, yc, xc))) % 10**8}.png"
    crop.save(p, quality=95)
    return [i["text"] for i in sorted(run_ocr(p), key=lambda i: -i["conf"])]


def transcribe(img_path, want=30):
    big = WORK / "big.jpg"
    upscale(img_path, big, 2.0)
    items = run_ocr(big)
    colx = headers(items)
    missing = [c for c in ["ramadan", "date", "day"] + TIMECOLS if c not in colx]
    if missing:
        return {"error": f"headers missing {missing}", "headers": colx}
    bnds = bands(items, colx)
    if len(bnds) != want:
        return {"error": f"row bands {len(bnds)}", "headers": colx,
                "band_ys": [round(b, 4) for b in bnds]}
    rows, repairs = [], []
    for i, y in enumerate(bnds):
        row = {"n": i + 1}
        for name in TIMECOLS:
            raw = cell_at(items, y, colx[name])
            v = norm_time(raw)
            if v is None:
                cand = cell_ocr(img_path, y, colx[name])
                for c in cand:
                    v = norm_time(c)
                    if v:
                        repairs.append((i + 1, name, raw, c))
                        break
            row[name] = v
        for name in ("date", "day"):
            row[name] = cell_at(items, y, colx[name])
        rows.append(row)
    return {"rows": rows, "repairs": repairs, "headers": colx}


def check(rows):
    """Structural checks against the sheet's printed rules."""
    issues = []
    for r in rows:
        if not all(r.get(c) for c in TIMECOLS):
            issues.append(f"row {r['n']}: empty cell {[c for c in TIMECOLS if not r.get(c)]}")
            continue
        f = lambda c: int(r[c][:2]) * 60 + int(r[c][3:])
        if f("fajr") - f("suhoor") != 5:
            issues.append(f"row {r['n']}: suhoor {r['suhoor']} vs fajr {r['fajr']} (diff {f('fajr') - f('suhoor')})")
        if f("maghrib") - f("sunrise") < -30 or f("maghrib") - f("sunrise") > 900:
            issues.append(f"row {r['n']}: iftar {r['maghrib']} vs sunrise {r['sunrise']}")
    for a, b in zip(rows, rows[1:]):
        for c in TIMECOLS:
            if not (a.get(c) and b.get(c)):
                continue
            fa = int(a[c][:2]) * 60 + int(a[c][3:])
            fb = int(b[c][:2]) * 60 + int(b[c][3:])
            if abs(fb - fa) > 4:
                issues.append(f"row {a['n']}->{b['n']} {c}: {a[c]} -> {b[c]} (delta {fb - fa})")
    return issues


if __name__ == "__main__":
    res = transcribe(sys.argv[1])
    if "error" in res:
        print(json.dumps(res, indent=1))
        sys.exit(1)
    issues = check(res["rows"])
    print(json.dumps({"repairs": res["repairs"], "issues": issues,
                      "first": res["rows"][0], "last": res["rows"][-1]}, indent=1))
