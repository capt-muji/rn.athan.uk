import sys, json, re
sys.path.insert(0, "$HOME/athan-gitree/census/c17-chile/pylib")
import pymupdf

CITY = {1:"Santiago",2:"Arica",3:"Antofagasta",4:"Copiapo",5:"La Serena-Coquimbo",
        6:"San Felipe-Los Andes",7:"Vina del Mar-Valparaiso",8:"San Antonio",9:"Rancagua",
        10:"Talca-Curico",11:"Linares",12:"Concepcion-Chillan",13:"Temuco-Pucon-Villarrica",
        14:"Valdivia",15:"Osorno",16:"Puerto Montt-Castro",17:"Coyhaique-Puerto Aysen",
        18:"Punta Arenas-Magallanes"}

ROW = re.compile(r"(\d{2}) de \w+\s*\n\s*"
                 r"(\d{1,2}:\d{2})\s*\n\s*(\d{1,2}:\d{2})\s*\n\s*(\d{1,2}:\d{2})\s*\n\s*"
                 r"(\d{1,2}:\d{2})\s*\n\s*(\d{1,2}:\d{2})\s*\n\s*(\d{1,2}:\d{2})")

def parse(path, year="2026", month="11"):
    text = pymupdf.open(path)[0].get_text()
    out = {}
    for m in ROW.finditer(text):
        d = int(m.group(1))
        out[f"{year}-{month}-{d:02d}"] = dict(zip(
            ["fajr","sunrise","dhuhr","asr","magrib","isha"], m.groups()[1:]))
    return out

res = {}
for i in range(1, 19):
    res[CITY[i]] = parse(f"captures/cl_nov2026_{i}.pdf")
json.dump(res, open("data/cl_2026-11.json", "w"), indent=1, ensure_ascii=False)
print({k: len(v) for k, v in res.items()})
print("missing:", {k: sorted(set(f"2026-11-{d:02d}" for d in range(1,31)) - set(v)) for k, v in res.items()})
print("Santiago 1:", res["Santiago"]["2026-11-01"])
print("Punta Arenas 30:", res["Punta Arenas-Magallanes"]["2026-11-30"])
