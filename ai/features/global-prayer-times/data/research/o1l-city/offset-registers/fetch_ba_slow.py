import json,requests,time,os
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
s=requests.Session(); s.headers['User-Agent']=UA
path='data/ba-city-tables-nov.json'
out=json.load(open(path)) if os.path.exists(path) else {}
lok=json.load(open('captures/ba-lokacije.json'))
start=int(os.environ.get('START','1'))
for i in range(start,len(lok)+1):
    if str(i) in out and isinstance(out[str(i)].get('dan'),list): continue
    for attempt in range(3):
        try:
            r=s.get(f"https://api.vaktija.ba/vaktija/v1/{i}/2026/11",timeout=25)
            if r.status_code==429:
                print(i,'429 wait',flush=True); time.sleep(20); continue
            j=r.json()
            out[str(i)]={"name":j.get("lokacija"),"dan":j.get("dan")}
            break
        except Exception as e:
            time.sleep(5)
    else:
        out.setdefault(str(i),{})['error']='blocked'
    json.dump(out,open(path,'w'),ensure_ascii=False)
    print(i,out.get(str(i),{}).get('name'),flush=True)
    time.sleep(4.0)
print('done',len(out))
