import json, re, subprocess, sys, os, pypdf

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
ROOT = os.path.expanduser("~/athan-gitree/census/o1l-city/O1l-33")

surfaces = {
    "CM-ngaoundere": "mawaqit-sabongari-ngaoundere",
    "CM-douala-arrahma": "mawaqit-ar-rahma-mosque-27000-douala-cameroon",
    "TD-ndjamena": "mawaqit-masjid-abu-bakr-siddiq-ndjamena-526hhrv-chad",
    "CF-bangui": "mawaqit-mosquee-saina-youssuf-avenue-udeac-bangui-central-african-republic",
    "CD-goma-taqwa": "mawaqit-taqwa-mosque-ibb-boulevard-sake-105-16-gis-goma-congo-kinshasa",
    "CD-goma-daarusalaam": "mawaqit-daarus-salaam-goma-00-congo-kinshasa",
    "CG-brazzaville": "mawaqit-houriya-brazzaville-99324-congo-brazzaville",
    "GA-libreville-kinguele": "mawaqit-mosquee-de-kinguele-msjd-alhq-libreville-0000-gabon",
    "GA-libreville-bellevue3": "mawaqit-mosquee-de-bellevue-3-libreville-0000-gabon",
    "GA-portgentil": "mawaqit-mosquee-du-roi-faisal-msjd-almlk-fysl-port-gentil-2110-gabon",
    "GQ-malabo": "mawaqit-issa-obama-home-malabo-8163-equatorial-guinea",
}

def uuid_of(html_path):
    h = open(html_path, encoding="utf-8", errors="ignore").read()
    m = re.search(r"api/2\.0/mosque/([0-9a-f-]{36})/weather", h)
    return m.group(1) if m else None

def parse_pdf(path):
    r = pypdf.PdfReader(path)
    text = "\n".join((p.extract_text() or "") for p in r.pages)
    dates = list(re.finditer(r"\b(\d{2})-(\d{2})-(\d{4})\b", text))
    rows = {}
    for i, m in enumerate(dates):
        end = dates[i + 1].start() if i + 1 < len(dates) else len(text)
        seg = text[m.end():end]
        times = re.findall(r"\b([0-2]\d:[0-5]\d)\b", seg)
        if len(times) < 6:
            continue
        t = times[-6:]
        rows[f"{m.group(3)}-{m.group(2)}-{m.group(1)}"] = dict(zip(["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"], t))
    return rows

out = {}
for name, slug in surfaces.items():
    html = f"{ROOT}/captures/{slug}.html"
    u = uuid_of(html)
    if not u:
        print(name, "NO UUID"); continue
    pdf = f"{ROOT}/captures/{name}-calendar-2027.pdf"
    if not os.path.exists(pdf):
        subprocess.run(["curl", "-sL", "-A", UA, "--max-time", "60",
                        f"https://mawaqit.net/fr/calendar/{u}.pdf?year=2027", "-o", pdf], check=False)
    if not open(pdf, "rb").read(5) == b"%PDF-":
        print(name, "PDF FAIL"); continue
    rows = parse_pdf(pdf)
    out[name] = rows
    json.dump(rows, open(f"{ROOT}/data/{name}-2027.json", "w"))
    print(name, len(rows), "rows", min(rows) if rows else "", max(rows) if rows else "")
