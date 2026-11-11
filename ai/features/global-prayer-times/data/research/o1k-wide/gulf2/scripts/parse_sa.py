import json,glob
for city in ('medina','jeddah'):
    rows={}
    for p in sorted(glob.glob(f'captures/sa-umq-{city}-14*.json')):
        for r in json.load(open(p)):
            pt=r['prayerTimes']
            rows[r['date'][:10]]={'fajr':pt['fajr'],'sunrise':pt['sunrise'],'dhuhr':pt['dhuhr'],
                                  'asr':pt['asr'],'magrib':pt['maghrib'],'isha':pt['isha']}
    json.dump(rows,open(f'data/sa-{city}-1448-1449.json','w'),indent=0,sort_keys=True)
    print(city,len(rows),min(rows),max(rows))
