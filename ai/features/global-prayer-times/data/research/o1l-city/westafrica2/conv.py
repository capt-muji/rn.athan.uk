import json, glob, os, datetime, sys
os.makedirs('data/rows', exist_ok=True)
report={}
for f in sorted(glob.glob('data/mawaqit-*.json')):
    d=json.load(open(f)); cal=d['calendar']
    tag=os.path.basename(f)[8:-5]
    # today anchor: 2026-11-10
    m10=cal[10].get('10')
    m11=cal[10].get('11')
    def ok(m):
        return m is not None and d.get('times')==[m[0],m[2],m[3],m[4],m[5]] and d.get('shuruq')==m[1]
    anchor = 'd10' if ok(m10) else ('d11' if ok(m11) else False)
    rows={}
    for mi in range(12):
        for day,vals in cal[mi].items():
            day=int(day)
            try:
                dt=datetime.date(2026,mi+1,day)
            except ValueError:
                continue  # Feb 29 in leap template
            rows[dt.isoformat()]=dict(zip(("fajr","sunrise","dhuhr","asr","maghrib","isha"),vals))
    out='data/rows/%s-2026.json'%tag
    json.dump(rows,open(out,'w'),indent=0,sort_keys=True)
    report[tag]={'rows':len(rows),'anchor':anchor,'cal_months':len(cal),
                 'cal_days':{m:len(cal[m]) for m in range(12)}}
print(json.dumps(report,indent=1))
