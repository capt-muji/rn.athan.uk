import re,html,json,requests
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
URL="https://www.esa.gov.eg/monthlymwaket.aspx"
s=requests.Session(); s.headers['User-Agent']=UA
t=s.get(URL,timeout=45).text
def hidden(t):
    d={}
    for m in re.finditer(r'<input[^>]*type="hidden"[^>]*>',t,flags=re.I):
        tag=m.group(0); n=re.search(r'name="([^"]+)"',tag); v=re.search(r'value="([^"]*)"',tag)
        if n: d[n.group(1)]=html.unescape(v.group(1)) if v else ""
    return d
b=hidden(t)
def table(t):
    out=[]
    for r in re.findall(r'<tr[\s\S]*?</tr>',t,flags=re.I):
        c=[re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',x))).strip() for x in re.findall(r'<t[dh][\s\S]*?</t[dh]>',r,flags=re.I)]
        if len(c)>=7: out.append(c)
    return out
d=dict(b)
d["ctl00$placeholder1$DropDownList1"]="القـاهـرة"
d["ctl00$placeholder1$DropDownList2"]="6"
rr=s.post(URL,data=d,headers={'Referer':URL},timeout=60)
open('captures/eg-esa-monthly-cairo-june.html','w').write(rr.text)
tb=table(rr.text)
print(rr.status_code,len(tb))
for r in tb[:6]: print(r)
