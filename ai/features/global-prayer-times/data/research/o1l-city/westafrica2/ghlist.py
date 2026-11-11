import json,subprocess,urllib.parse,sys
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
allm={}
for region in ["Ashanti","Northern","Western"]:
    for page in range(1,5):
        url=("https://ghanamasjid.org/api/method/masjid.masjid.api.masjid.get_masjids"
             f"?page={page}&limit=20&masjid_region={urllib.parse.quote(region)}")
        r=subprocess.run(["curl","-s","-m","20","-A",UA,url],capture_output=True,text=True)
        try: d=json.loads(r.stdout)["message"]
        except Exception: break
        if not d: break
        for x in d: allm[x["name"]]=x
        if len(d)<20: break
json.dump(allm,open("captures/gh-masjid-regions.json","w"),indent=1)
for x in allm.values():
    print(x["masjid_region"],"|",x["masjid_name"].strip(),"|",x["masjid_location"],"|",x.get("masjid_coordinates"))
print("TOTAL",len(allm))
