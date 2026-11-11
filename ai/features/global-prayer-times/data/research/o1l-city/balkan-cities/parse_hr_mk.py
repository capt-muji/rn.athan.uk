import re, html, json, os
P=['fajr','sunrise','dhuhr','asr','maghrib','isha']
def text(f):
    t=open(f,encoding='utf-8',errors='replace').read()
    t=re.sub(r'<(script|style)[^>]*>.*?</\1>','',t,flags=re.S)
    t=re.sub(r'<[^>]+>',' ',t)
    return html.unescape(re.sub(r'\s+',' ',t))
out={}
for city in ['zagreb','split','rijeka']:
    t=text('captures/hr_vaktijaeu_%s.html'%city)
    # rows look like: "1. nov., ne 21. džumade-l-ula 04:51 06:32 11:42 14:16 16:47 18:07"
    rows={}
    for m in re.finditer(r'(\d{1,2})\.\s*(jan|feb|mar|apr|maj|jun|jul|avg|sep|okt|nov|dec)[^0-9]{0,40}?(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})',t):
        mi=['jan','feb','mar','apr','maj','jun','jul','avg','sep','okt','nov','dec'].index(m.group(2))+1
        rows['2026-%02d-%02d'%(mi,int(m.group(1)))]=dict(zip(P,m.groups()[2:]))
    out[city]=rows
    print(city,len(rows),min(rows) if rows else '-',max(rows) if rows else '-')
    if rows: print('  sample',list(rows.items())[0])
json.dump(out,open('data/hr_vaktijaeu_2026.json','w'),ensure_ascii=False,indent=0)
