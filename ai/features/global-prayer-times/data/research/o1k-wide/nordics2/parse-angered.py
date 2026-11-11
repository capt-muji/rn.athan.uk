import json,re,sys,glob
MONTHS={'januari':1,'februari':2,'mars':3,'april':4,'maj':5,'juni':6,'juli':7,'augusti':8,
        'september':9,'oktober':10,'november':11,'december':12}
CELL=re.compile(r'^\d{2}:\d{2}$')
TAG=re.compile(r'<[^>]+>')

def rows_from(path):
    s=open(path,encoding='utf-8',errors='replace').read()
    head=re.search(r'Bönetider Göteborg (\w+) (\d{4})',s)
    if not head: raise SystemExit(f'no month header in {path}')
    month,year=MONTHS[head.group(1).lower()],int(head.group(2))
    body=re.search(r'<tbody>(.*?)</tbody>',s,re.S).group(1)
    out={}
    for row in body.split('</tr>'):
        texts=[TAG.sub('',c).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>',row,re.S)]
        if not texts: continue
        day=int(TAG.sub('',texts[0]).strip()[:2])
        vals=[t.replace('*','').strip() for t in texts[1:7]]
        if len(vals)==6 and all(CELL.match(v) for v in vals):
            out[f'{year}-{month:02d}-{day:02d}']=dict(zip(
                ('fajr','sunrise','dhuhr','asr','magrib','isha'),vals))
    return out

rows={}
for f in sorted(glob.glob('captures/se-angered-2026-*.html')):
    rows.update(rows_from(f))
json.dump(rows,open('data/se-angered-2026.json','w'),indent=0,sort_keys=True)
print('angered',len(rows),'2026-01-01',rows.get('2026-01-01'),'| 2026-06-21',rows.get('2026-06-21'))
