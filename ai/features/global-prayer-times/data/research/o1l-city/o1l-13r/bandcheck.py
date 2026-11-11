import re,json,sys,glob
from collections import Counter
cols=['fajr','shuruq','dhuhr','asr','maghrib','isha']
for f in sorted(glob.glob(sys.argv[1])):
    t=open(f,encoding='utf-8',errors='replace').read()
    m=re.search(r'let confData = (\{.*?\});',t,re.S)
    if not m: print(f,'NO CONFDATA'); continue
    d=json.loads(m.group(1))
    cal=d['calendar']
    seq={c:[] for c in cols}
    for mo in cal:
        for day in sorted(mo,key=int):
            for i,c in enumerate(cols): seq[c].append(mo[day][i])
    def runs(v):
        out=[];prev=None;n=0
        for x in v:
            if x==prev:n+=1
            else:
                if prev is not None: out.append((prev,n))
                prev=x;n=1
        out.append((prev,n)); return out
    print('==',f.split('/')[-1],'days',len(seq['fajr']),'lat',round(d['latitude'],3),'lon',round(d['longitude'],3),d.get('timezone'))
    for c in cols:
        r=runs(seq[c]); print('  ',c,'nruns',len(r),'lens',Counter(n for _,n in r).most_common(5))
    print('   jan1',[seq[c][0] for c in cols],'jul1',[seq[c][180] for c in cols])
