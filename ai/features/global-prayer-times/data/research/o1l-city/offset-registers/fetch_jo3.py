import re, html, json, requests
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
URL="https://www.awqaf.gov.jo/ar/Pages/PrayerTime"
NAMES={1:"عمان، البلقاء، الزرقاء، مادبا",2:"اربد",3:"الكرك",4:"الطفيلة",5:"معان",6:"العقبة",7:"الأغوار الشمالية",8:"جرش وعجلون",9:"المفرق",11:"ذيبان",12:"الأزرق",13:"الأغوار الوسطى",14:"الشوبك والبترا",15:"الظليل والهاشمية",19:"الرويشد",33:"القدس"}
s=requests.Session(); s.headers['User-Agent']=UA
t=s.get(URL,timeout=40).text
def hidden(t):
    d={}
    for m in re.finditer(r'<input[^>]*type="hidden"[^>]*>',t,flags=re.I):
        tag=m.group(0); n=re.search(r'name="([^"]+)"',tag); v=re.search(r'value="([^"]*)"',tag)
        if n: d[n.group(1)]=html.unescape(v.group(1)) if v else ""
    return d
b=hidden(t); out={}
for v,name in NAMES.items():
    d=dict(b); d["ctl00$MainContent$DropCompany"]=str(v)
    rr=s.post(URL,data=d,headers={'Referer':URL},timeout=40)
    sel=[m.group(1).strip() for m in re.finditer(r'<option[^>]*selected[^>]*>([^<]*)</option>',rr.text,flags=re.I)]
    rows=[]
    for r in re.findall(r'<tr[\s\S]*?</tr>',rr.text,flags=re.I):
        c=[re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',x))).strip() for x in re.findall(r'<t[dh][\s\S]*?</t[dh]>',r,flags=re.I)]
        if len(c)>=7 and re.match(r'\d{2}/\d{2}/\d{4}',c[0]): rows.append(c[:7])
    out[v]={"label":name,"selectedInResponse":sel,"rows":rows}
    print(v,name,'->',sel,'rows',len(rows),rows[0][1:] if rows else None,flush=True)
json.dump(out,open('data/jo-awqaf-regions-raw.json','w'),ensure_ascii=False,indent=1)
