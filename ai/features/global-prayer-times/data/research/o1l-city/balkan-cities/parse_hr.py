import re, html, json
P=['fajr','sunrise','dhuhr','asr','maghrib','isha']
M=['jan','feb','mar','apr','maj','jun','jul','avg','sep','okt','nov','dec']
def text(f):
    t=open(f,encoding='utf-8',errors='replace').read()
    t=re.sub(r'<(script|style)[^>]*>.*?</\1>','',t,flags=re.S)
    t=re.sub(r'<[^>]+>',' ',t)
    return html.unescape(re.sub(r'\s+',' ',t))
out={}
for city in ['zagreb','split','rijeka']:
    t=text('captures/hr_vaktijaeu_%s.html'%city)
    segs=re.split(r'(?=\b\d{1,2}\.\s(?:%s)\.,)'%'|'.join(M),t)
    rows={}
    for s in segs:
        m=re.match(r'(\d{1,2})\.\s(%s)\.'%('|'.join(M)),s)
        if not m: continue
        times=re.findall(r'\b\d{2}:\d{2}\b',s)
        if len(times)<6: continue
        rows['2026-%02d-%02d'%(M.index(m.group(2))+1,int(m.group(1)))]=dict(zip(P,times[:6]))
    out[city]=dict(sorted(rows.items()))
    print(city,len(rows),min(rows) if rows else '-',max(rows) if rows else '-')
json.dump(out,open('data/hr_vaktijaeu_2026.json','w'),ensure_ascii=False,indent=0)
