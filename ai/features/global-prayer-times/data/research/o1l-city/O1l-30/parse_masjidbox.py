import json, re, sys, datetime

# Masjidbox public page: ld+json Event list carries per-prayer times for a rolling
# 7-day window (startDate is date-local with the site's offset).
NAMES = {'Fajr': 'fajr', 'Fadjr': 'fajr', 'Shuruq': 'sunrise', 'Shurûq': 'sunrise', 'Dhuhr': 'dhuhr', 'Dhohr': 'dhuhr', 'Duhr': 'dhuhr', 'Asr': 'asr', 'Assr': 'asr', 'Maghrib': 'maghrib', 'Maghreb': 'maghrib', 'Magrib': 'maghrib', 'Magreb': 'maghrib', 'Jumuah': 'dhuhr', 'Jumu\'ah': 'dhuhr', 'Isha': 'isha', 'Ishaa': 'isha'}

def parse(path):
    h = open(path, encoding='utf-8', errors='replace').read()
    addr = re.search(r'"streetAddress":"([^"]+)"', h)
    rows = {}
    for m in re.finditer(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', h, re.S):
        try:
            blob = json.loads(m.group(1))
        except json.JSONDecodeError:
            continue
        items = blob if isinstance(blob, list) else [blob]
        for ev in items:
            if not isinstance(ev, dict) or ev.get('@type') != 'Event':
                continue
            nm = ev.get('name', '')
            for label, key in NAMES.items():
                if label + ' ' in nm or nm.endswith(label):
                    stamp = ev['startDate']
                    date = stamp[:10]
                    hm = stamp[11:16]
                    rows.setdefault(date, {})[key] = hm
                    break
    return (addr.group(1) if addr else None), rows

if __name__ == '__main__':
    addr, rows = parse(sys.argv[1])
    out = {'meta': {'address': addr, 'source': sys.argv[1]}, 'rows': {k: v for k, v in sorted(rows.items())}}
    json.dump(out, open(sys.argv[2], 'w'), indent=1)
    print(addr, 'days', len(rows))
    for k in sorted(rows)[:3]:
        print(' ', k, rows[k])
