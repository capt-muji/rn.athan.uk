import re,json,datetime
from pypdf import PdfReader
r=PdfReader('captures/bh-almajles-calendar-daily-1448.pdf')
rows={}
start=datetime.date(2026,6,16)
bad=[]
for pi in range(2,len(r.pages)):
    t=r.pages[pi].extract_text() or ''
    toks=re.findall(r'(\d{1,2}):(\d{2})',t)
    vals=[f"{int(h):02d}:{m}" for h,m in toks[:7]]
    if len(vals)<7: bad.append((pi+1,len(vals))); continue
    d=start+datetime.timedelta(days=pi-2)
    rows[d.isoformat()]={'raw':vals}
print('pages',len(r.pages),'rows',len(rows),'bad',bad[:5])
json.dump(rows,open('data/bh-calendar-1448-raw.json','w'),indent=0,sort_keys=True)
print(list(rows.items())[:2])
print(list(rows.items())[-1])
