import re,json,datetime,statistics
from pypdf import PdfReader
r=PdfReader('captures/bh-almajles-calendar-daily-1448.pdf')
start=datetime.date(2026,6,16)
rows={}; bad=[]
def mins(t):
    h,m=t.split(':');return int(h)*60+int(m)
for pi in range(2,len(r.pages)):
    t=(r.pages[pi].extract_text() or '').replace('\u200f','')
    toks=re.findall(r'(\d{1,2}):(\d{2})',t)
    toks=[f"{int(h):02d}:{m}" for h,m in toks]
    pct=[i for i,x in enumerate(toks) if x.startswith('%')]
    # find anchor: the '%' marker is matched separately
    anchor=t.find('%')
    # tokens before anchor position: re-scan using character offset
    pre=[f"{int(h):02d}:{m}" for h,m in re.findall(r'(\d{1,2}):(\d{2})',t[:anchor])] if anchor>0 else []
    if len(pre)<7: bad.append((pi+1,'short')); continue
    blk=pre[-7:]
    def pm(x):
        h,m=x.split(':');
        h=int(h)
        if h<12: h+=12
        return f"{h:02d}:{m}"
    d=start+datetime.timedelta(days=pi-2)
    rows[d.isoformat()]={'fajr':blk[0],'sunrise':blk[6],'dhuhr':blk[5],
                         'asr':pm(blk[4]),'magrib':pm(blk[3]),'isha':pm(blk[2]),'lastThird':blk[1]}
print('rows',len(rows),'bad',bad)
viol=[(d,v) for d,v in rows.items() if not (mins(v['fajr'])<mins(v['sunrise'])<mins(v['dhuhr'])<mins(v['asr'])<mins(v['magrib'])<mins(v['isha']))]
print('violations',len(viol),viol[:3])
json.dump(rows,open('data/bh-bahrain-calendar-1448.json','w'),indent=0,sort_keys=True)
diff=[mins(v['isha'])-mins(v['magrib']) for v in rows.values()]
print('isha-maghrib',min(diff),max(diff),round(statistics.mean(diff),1))
print(rows['2026-06-16'],rows['2026-12-21'])
