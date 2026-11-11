import re, json, glob, os
rows={}
for path in sorted(glob.glob('captures/om-mara-muscat-2028-*.html')):
    html=open(path,encoding='utf-8',errors='replace').read()
    trs=re.findall(r'<tr>(.*?)</tr>',html,re.S)
    for tr in trs:
        tds=re.findall(r"<td[^>]*>(?:<font[^>]*>)?([^<]*)",tr)
        if len(tds)<7: continue
        d=tds[0].strip()
        m=re.match(r'^(\d+)/(\d+)/(\d{4})$',d)
        if not m: continue
        day,mon,yr=int(m.group(1)),int(m.group(2)),int(m.group(3))
        times=[t.strip() for t in tds[1:7]]
        def norm(t,i):
            hh,mm=t.split(':')[:2]; hh=int(hh); mm=int(mm)
            # dhuhr/asr/maghrib/isha printed 12h
            if i>=2 and hh<12: hh+=12
            return f"{hh:02d}:{mm:02d}"
        vals=[norm(t,i) for i,t in enumerate(times)]
        key=f"{yr:04d}-{mon:02d}-{day:02d}"
        rows[key]=dict(zip(['fajr','sunrise','dhuhr','asr','magrib','isha'],vals))
json.dump(rows,open('data/om-muscat-2028.json','w'),indent=0,sort_keys=True)
print(len(rows),min(rows),max(rows))
print(rows['2028-01-01'],rows['2028-12-31'])
