import re,html,json,requests,time,os,sys
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
URL="https://www.esa.gov.eg/monthlymwaket.aspx"
s=requests.Session(); s.headers['User-Agent']=UA
t=s.get(URL,timeout=45).text
opts=re.findall(r'<option[^>]*value="([^"]+)"[^>]*>([^<]*)</option>',t)
cities=[v for v,_ in opts if v not in ('كل المدن','0','1','2','3','4','5','6','7','8','9','10','11','12')]
print('cities',len(cities),flush=True)
def hidden(t):
    d={}
    for m in re.finditer(r'<input[^>]*type="hidden"[^>]*>',t,flags=re.I):
        tag=m.group(0); n=re.search(r'name="([^"]+)"',tag); v=re.search(r'value="([^"]*)"',tag)
        if n: d[n.group(1)]=html.unescape(v.group(1)) if v else ""
    return d
b=hidden(t)
out={}
for i,city in enumerate(cities):
    for month in (6,):
        d=dict(b); d["ctl00$placeholder1$DropDownList1"]=city; d["ctl00$placeholder1$DropDownList2"]=str(month)
        try:
            rr=s.post(URL,data=d,headers={'Referer':URL},timeout=60)
        except Exception as e:
            out.setdefault(city,{})[month]={'error':str(e)}; continue
        rows=[]
        for r in re.findall(r'<tr[\s\S]*?</tr>',rr.text,flags=re.I):
            cc=[re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',x))).strip() for x in re.findall(r'<t[dh][\s\S]*?</t[dh]>',r,flags=re.I)]
            if len(cc)>=9 and re.match(r'\d{4}-\d{2}-\d{2}',cc[1]): rows.append(cc)
        out.setdefault(city,{})[month]=rows
        open(f"captures/eg-monthly/{i:03d}-m{month}.html","w").write(rr.text)
    print(i,city,len(out[city].get(6,[])),flush=True)
    if i%10==0: json.dump(out,open('data/eg-esa-monthly-raw.json','w'),ensure_ascii=False)
    time.sleep(0.4)
json.dump(out,open('data/eg-esa-monthly-raw.json','w'),ensure_ascii=False,indent=1)
print('done',len(out))
