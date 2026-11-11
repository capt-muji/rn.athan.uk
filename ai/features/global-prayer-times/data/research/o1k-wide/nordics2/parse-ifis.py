import json,re,sys,glob

def text_of(path):
    raw=open(path,encoding='utf-8',errors='replace').read()
    if raw.lstrip().startswith('"'):
        try: return json.loads(raw)
        except Exception: pass
    return raw

def month_rows(path):
    s=text_of(path)
    body=re.search(r'<tbody[^>]*>(.*?)</tbody>',s,re.S)
    if not body: return {}
    out={}
    for tr in body.group(1).split('<tr')[1:]:
        tds=[re.sub(r'<[^>]+>','',t).strip() for t in re.findall(r'<td[^>]*>(.*?)</td>',tr,re.S)]
        if len(tds)!=7 or not tds[0].isdigit(): continue
        out[int(tds[0])]=tds[1:]
    return out

def year_rows(slug):
    rows={}
    for f in sorted(glob.glob(f'captures/se-ifis-{slug}-2026-*.html')):
        m=int(re.search(r'-(\d\d)\.html$',f).group(1))
        if m>12: continue
        for day,vals in month_rows(f).items():
            if any(not v for v in vals): continue
            rows[f'2026-{m:02d}-{day:02d}']=dict(zip(('fajr','sunrise','dhuhr','asr','magrib','isha'),vals))
    return rows

for slug in sys.argv[1:]:
    rows=year_rows(slug)
    json.dump(rows,open(f'data/se-ifis-{slug}-2026.json','w'),indent=0,sort_keys=True)
    print(slug,len(rows),'2026-01-01',rows.get('2026-01-01'),'| 2026-06-21',rows.get('2026-06-21'))
