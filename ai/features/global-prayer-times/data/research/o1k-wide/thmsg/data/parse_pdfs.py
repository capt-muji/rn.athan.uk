"""Parse Singapore MUIS 2027 PDF and Malaysia Jawi 2027 PDFs into dated rows."""
import json, re, sys
from pypdf import PdfReader

MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"]
MY_MONTHS = ["januari","februari","mac","april","mei","jun","julai","ogos","september","oktober","november","disember"]


def parse_sg(path):
    reader = PdfReader(path)
    rows = {}
    for page in reader.pages:
        text = page.extract_text() or ""
        for line in text.splitlines():
            m = re.match(r"\s*(\d{1,2})/(\d{1,2})/(\d{4})\s+\w+\s+(.*)$", line)
            if not m:
                continue
            d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
            nums = re.findall(r"\d{1,2}", m.group(4))
            if len(nums) < 12:
                continue
            hh = [int(nums[i]) for i in range(0, 12, 2)]
            mm = [int(nums[i]) for i in range(1, 12, 2)]
            # Subuh Syuruk Zohor Asar Maghrib Isyak, printed as "H MM" pairs with the hour
            # shown in 12-hour clock for Zohor onward.
            ZOHOR, ASAR, MAGHRIB, ISYAK = 2, 3, 4, 5
            for i in (ZOHOR, ASAR, MAGHRIB, ISYAK):
                if hh[i] < 12:
                    hh[i] += 12
            key = f"{y:04d}-{mo:02d}-{d:02d}"
            rows[key] = {
                "fajr": f"{hh[0]:02d}:{mm[0]:02d}",
                "sunrise": f"{hh[1]:02d}:{mm[1]:02d}",
                "dhuhr": f"{hh[2]:02d}:{mm[2]:02d}",
                "asr": f"{hh[3]:02d}:{mm[3]:02d}",
                "magrib": f"{hh[4]:02d}:{mm[4]:02d}",
                "isha": f"{hh[5]:02d}:{mm[5]:02d}",
            }
    return dict(sorted(rows.items()))


def parse_my(path):
    reader = PdfReader(path)
    rows = {}
    month = None
    for page in reader.pages:
        text = page.extract_text() or ""
        for line in text.splitlines():
            bare = line.strip().lower()
            found = [i + 1 for i, name in enumerate(MY_MONTHS) if name in bare.split()]
            if found:
                month = found[0]
                continue
            m = re.match(r"\s*(\d{1,2})\s+[A-Za-z]+\s+(.+)$", line)
            if not m or month is None:
                continue
            tokens = m.group(2).split()
            times = []
            for tok in tokens[:7]:
                if re.fullmatch(r"\d{1,2}:\d{2}", tok):
                    hh, mm = tok.split(":")
                    times.append(f"{int(hh):02d}:{mm}")
                elif re.fullmatch(r"\d{4}", tok):
                    times.append(tok[:2] + ":" + tok[2:])
            if len(times) < 7:
                continue
            d = int(m.group(1))
            rows[f"2027-{month:02d}-{d:02d}"] = {
                "imsak": times[0], "fajr": times[1], "sunrise": times[2],
                "dhuhr": times[3], "asr": times[4], "magrib": times[5], "isha": times[6],
            }
    return dict(sorted(rows.items()))


if __name__ == "__main__":
    which = sys.argv[1]
    out = sys.argv[3]
    rows = parse_sg(sys.argv[2]) if which == "sg" else parse_my(sys.argv[2])
    with open(out, "w") as fh:
        json.dump(rows, fh, indent=0)
    print(out, len(rows), list(rows)[0] if rows else "-", list(rows)[-1] if rows else "-")
