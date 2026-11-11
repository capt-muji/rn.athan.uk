"""hsalah monthly sheets: six computed columns plus the five jama'ah columns."""
import pypdf, re, json

def txt(name):
    return pypdf.PdfReader(f'captures/{name}.pdf').pages[0].extract_text()

def annual(slug):
    t = pypdf.PdfReader(f'$HOME/athan-gitree/census/o1k-wide/iberia2/captures/pt-{slug}_2026.pdf').pages[10].extract_text()
    out = {}
    for m in re.finditer(r'^(\d{1,2})\s+(?:DOM|SEG|TER|QUA|QUI|SEX|S[ÁA]B)[^\n]*?(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})', t, re.M):
        g = m.groups()
        out[f'2026-11-{int(g[0]):02d}'] = dict(zip(['fajr', 'sunrise', 'zawal', 'dhuhr', 'asr', 'maghrib', 'isha12', 'isha80'], g[1:]))
    return out

def lisboa():
    t = txt('pt-lisboa_nov')
    out = {}
    pat = r'^(\d{1,2})\s+(?:DOM|SEG|TER|QUA|QUI|SEX|S[ÁA]B)[^\n]*?(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+((?:\d{1,2}:\d{2}\s*){5})$'
    for m in re.finditer(pat, t, re.M):
        g = m.groups()
        out[f'2026-11-{int(g[0]):02d}'] = dict(zip(['fajr', 'sunrise', 'zawal', 'dhuhr', 'asr', 'maghrib', 'isha80'], g[1:8])) | {'jamaah': g[8].split()}
    return out

def coimbra():
    t = txt('pt-coimbra_nov')
    out = {}
    for m in re.finditer(r'^(\d{1,2})\s+\w+\s+\d+\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+((?:\d{1,2}:\d{2}\s*){5})$', t, re.M):
        g = m.groups()
        out[f'2026-11-{int(g[0]):02d}'] = dict(zip(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha12'], g[1:7])) | {'jamaah': g[7].split()}
    return out

def porto():
    t = txt('pt-porto_nov')
    out = {}
    for m in re.finditer(r'^(\d{1,2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})', t, re.M):
        g = m.groups()
        out[f'2026-11-{int(g[0]):02d}'] = dict(zip(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'], g[1:]))
    return out

monthly = {'lisboa': lisboa(), 'coimbra': coimbra(), 'porto': porto()}
json.dump(monthly, open('data/pt-monthly-2026-11.json', 'w'), indent=1, ensure_ascii=False)

def mins(s):
    h, m = s.split(':')
    return int(h) * 60 + int(m)

print('rows', {k: len(v) for k, v in monthly.items()})
for slug in monthly:
    a = annual(slug)
    print(f'\n{slug}: monthly vs annual, 30 days, deltas (monthly - annual)')
    for col in ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib']:
        d = [mins(monthly[slug][k][col]) - mins(a[k][col]) for k in monthly[slug] if k in a]
        print(f'  {col:8s} min {min(d):+3d} max {max(d):+3d} distinct {sorted(set(d))[:8]}')
