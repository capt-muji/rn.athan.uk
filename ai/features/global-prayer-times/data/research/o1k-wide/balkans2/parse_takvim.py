#!/usr/bin/env python3
"""Parse the Rijaset Takvim 2026 (Sarajevo) compressed-table layout into dated rows.

The Takvim prints hh:mm only when the hour differs from the row above; other
rows carry minutes alone, right-aligned on the column anchor. Two page regimes:
uniform-pitch pages parse by anchors (hour token <= anchor-3, minute at
anchor); drifted pages (pypdf renders them with shifting pitch) parse by
gap-grouped pairs. Rows a page truncates are recovered from normal-mode text.
"""
import json, re, sys
from pypdf import PdfReader

MONTHS = {
    "JANUAR": 1, "FEBRUAR": 2, "MART": 3, "APRIL": 4, "MAJ": 5, "JUN": 6, "JUNI": 6,
    "JUL": 7, "AUGUST": 8, "SEPTEMBAR": 9, "OKTOBAR": 10, "NOVEMBAR": 11, "DECEMBAR": 12,
}
DAYS_IN = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31}
PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
PAIR_GAP = 3

def tokens_pos(ln, floor):
    return [(m.start(), m.end(), int(m.group())) for m in re.finditer(r"\d+", ln) if m.start() >= floor]

def pair_cells_from(toks, carried=None):
    carried = carried or [None] * 6
    cells, i = [], 0
    while i < len(toks):
        x0, e0, v0 = toks[i]
        k = len(cells)
        if i + 1 < len(toks) and toks[i + 1][0] - e0 <= PAIR_GAP and v0 <= 23:
            if k < len(carried) and carried[k] is not None and abs(v0 - carried[k]) > 1 and i + 2 < len(toks) \
                    and toks[i + 2][0] - toks[i + 1][1] <= PAIR_GAP and toks[i + 1][2] <= 23:
                # hour glyph missing from the text layer: (m, m+1) is the next pair
                cells.append((None, v0))
                cells.append((toks[i + 1][2], toks[i + 2][2]))
                i += 3
                continue
            cells.append((v0, toks[i + 1][2]))
            i += 2
        else:
            cells.append((None, v0))
            i += 1
    return cells

def col_floor(lines):
    floors = []
    for ln in lines:
        starts = [m.start() for m in re.finditer(r"\d+", ln) if m.start() >= 40]
        if len(starts) >= 12 and starts[0] >= 50:
            floors.append(starts[0])
    return (min(floors) - 4) if floors else 55

def col_anchors(lines, floor):
    """Anchors = minute-x of pairs on full-pair rows. A leading pair far left of
    the rest (wrapped moon time) is dropped. Returns (anchors, uniform) where
    uniform means minutes-only rows also sit on the anchors."""
    cands = []
    for ln in lines:
        toks = tokens_pos(ln, floor)
        xs, i = [], 0
        while i < len(toks):
            x0, e0, v0 = toks[i]
            if i + 1 < len(toks) and toks[i + 1][0] - e0 <= PAIR_GAP and v0 <= 23:
                xs.append(toks[i + 1][0])
                i += 2
            else:
                xs.append(x0)
                i += 1
        if len(xs) >= 6:
            cands.append(xs)
    if not cands:
        return None, False
    ref = max(cands, key=len)
    if len(ref) >= 7:
        gaps = [b - a for a, b in zip(ref, ref[1:])]
        med = sorted(gaps)[len(gaps) // 2]
        if gaps[0] > 1.4 * med:
            ref = ref[1:]
    anchors = ref[:7]
    if len(anchors) < 6:
        return None, False
    uniform = True
    for xs in cands:
        if len(xs) != 7:
            continue
        dev = sum(abs(x - a) for x, a in zip(xs, anchors)) / 7
        if dev > 3:
            uniform = False
    return anchors, uniform

def parse_line_anchored(ln, floor, anchors):
    toks = tokens_pos(ln, floor)
    cols = [[] for _ in anchors]
    for x, e, v in toks:
        k = min(range(len(anchors)), key=lambda i: abs((x + 3.5 if x < anchors[i] - 2 else x) - anchors[i]))
        cols[k].append((x, v))
    out = []
    for k, cell in enumerate(cols):
        a = anchors[k]
        cell.sort()
        hours = [v for x, v in cell if x <= a - 2]
        mins = [v for x, v in cell if x >= a - 1]
        if not mins:
            if hours:
                # minute rendered left of the zone boundary: it is a minutes-only cell
                out.append((None, hours[-1]))
            else:
                out.append(None)
        else:
            out.append((hours[-1] if hours else None, mins[0]))
    return out[:6]

def main():
    r = PdfReader("captures/takvim_2026.pdf")
    data = {}
    normal = {}
    for pi, page in enumerate(r.pages):
        text = page.extract_text(extraction_mode="layout")
        ntext = page.extract_text()
        lines = text.splitlines()
        month = None
        for name, num in sorted(MONTHS.items(), key=lambda kv: -len(kv[0])):
            if re.search(r"\b" + name, text, re.IGNORECASE):
                month = num
                break
        if month is None:
            continue
        floor = col_floor(lines)
        anchors, uniform = col_anchors(lines, floor)
        regime = "anchor" if (anchors and uniform) else "pair"
        hours = [None] * 6
        cur_day = None
        cur_label = None
        for ln, nln in zip(lines, ntext.splitlines()):
            mm = re.match(r"\s*(\d{1,2})\s+[A-ZČĆĐŠŽ]", ln)
            if mm and 1 <= int(mm.group(1)) <= DAYS_IN[month]:
                cur_day = int(mm.group(1))
                cur_label = nln
            if cur_day is None:
                continue
            cells = parse_line_anchored(ln, floor, anchors) if regime == "anchor" else pair_cells_from(tokens_pos(ln, floor), hours)[:6]
            if not any(c is not None for c in cells):
                continue
            # trailing recovery for truncated rows, from the normal-mode line
            if not all(c is not None for c in cells):
                ntoks = [(m.start(), m.group()) for m in re.finditer(r"\d+", cur_label)]
                filled = [c for c in cells if c is not None]
                if filled and ntoks:
                    last_known = None
                    for x, e, v in tokens_pos(ln, floor):
                        for nx, nv in ntoks:
                            if nv == str(v):
                                last_known = nx
                    if last_known is not None:
                        rest = [(nx, nx + len(nv), int(nv)) for nx, nv in ntoks if nx > last_known]
                        rc = pair_cells_from(rest)
                        j = 0
                        for i in range(6):
                            if cells[i] is None and j < len(rc):
                                cells[i] = rc[j]
                                j += 1
            vals = []
            for i, c in enumerate(cells):
                if c is not None and c[0] is not None:
                    hours[i] = c[0]
                if c is None or hours[i] is None:
                    vals.append(None)
                    continue
                vals.append(f"{hours[i]:02d}:{c[1]:02d}")
            row = dict(zip(PRAYERS, vals))
            key = f"2026-{month:02d}-{cur_day:02d}"
            if key in data and sum(v is not None for v in row.values()) < sum(v is not None for v in data[key].values()):
                continue
            data[key] = row
    complete = sum(1 for row in data.values() if all(row.values()))
    print(f"days: {len(data)}, complete rows: {complete}", file=sys.stderr)
    json.dump(data, open("data/ba_takvim2026_sarajevo.json", "w"), indent=1, ensure_ascii=False, sort_keys=True)

if __name__ == "__main__":
    main()
