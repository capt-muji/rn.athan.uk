import json,re

def live(path):
    raw=open(path,encoding='utf-8',errors='replace').read().strip()
    txt=json.loads(raw) if raw.startswith('"') else raw
    rows={}
    for line in txt.split('\n'):
        f=[x.strip() for x in line.split('\t')]
        if len(f)>=9 and f[0].isdigit():
            rows[int(f[0])]=f[3:9]
    return rows

def mins(t):
    h,m,ap=re.match(r'(\d{1,2}):(\d{2})\s*([AP])M',t).groups()
    h=int(h)%12+(12 if ap=='P' else 0)
    return h*60+int(m)

head='fajr sunrise dhuhr asr magrib isha'.split()
eng=json.load(open('$HOME/athan-gitree/census/o1k-wide/europe/data/ee-eic-both-cities-2026-2027.json'))['tartu']

samples=[(1,2026,'2026-01-15'),(3,2026,'2026-03-20'),(6,2026,'2026-06-21'),
         (9,2026,'2026-09-15'),(12,2026,'2026-12-31'),(6,2027,'2027-06-21')]
bad=0
for m,y,date in samples:
    lv=live(f'captures/ee-eic-live-tartu-{y}-m{m:02d}.txt')
    l=lv.get(int(date[-2:])); e=eng[date]
    diffs=[]
    for i,k in enumerate(head):
        d=mins(l[i])-mins(e[k])
        if d: diffs.append(f'{k} {d:+d}')
    print(f'{date} live={l} engine={[e[k] for k in head]} diff={diffs or "exact"}')
    bad+=len(diffs)
print('total cell diffs:',bad)
