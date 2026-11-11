import json, sys, datetime
from parse_mawaqit import load

def extract(path, year):
    d = load(path)
    rows = {}
    dup_imsak = 0
    for m, month in enumerate(d['calendar'], start=1):
        for day, r in month.items():
            dd = int(day)
            try:
                date = datetime.date(year, m, dd)
            except ValueError:
                continue
            if len(r) == 7:
                if r[0] == r[1]:
                    dup_imsak += 1
                r = r[1:]
            rows[date.isoformat()] = {
                'fajr': r[0], 'sunrise': r[1], 'dhuhr': r[2],
                'asr': r[3], 'maghrib': r[4], 'isha': r[5],
            }
    meta = {
        'name': d['name'], 'countryCode': d['countryCode'], 'timezone_field': d['timezone'],
        'lat': d['latitude'], 'lon': d['longitude'], 'jumua': [d.get('jumua'), d.get('jumua2'), d.get('jumua3')],
        'imsak_offset': d['imsakNbMinBeforeFajr'], 'dup_imsak_days': dup_imsak,
        'today_row': d['times'], 'today_shuruq': d['shuruq'], 'year': year,
        'iqama_sample': d['iqamaCalendar'][10].get('11') if len(d['iqamaCalendar']) > 10 else None,
    }
    return meta, rows

if __name__ == '__main__':
    path, out, year = sys.argv[1], sys.argv[2], int(sys.argv[3])
    meta, rows = extract(path, year)
    json.dump({'meta': meta, 'rows': rows}, open(out, 'w'), indent=1)
    print(json.dumps(meta, ensure_ascii=False))
    print('rows', len(rows))
