import json, re, sys

def load(path):
    h = open(path, encoding='utf-8', errors='replace').read()
    i = h.find('confData = ')
    if i < 0:
        return None
    j = h.find('};\n', i)
    if j < 0:
        j = h.find('};', i)
    return json.loads(h[i + 11:j + 1])

def year_of(d):
    # conf carries no year; resolve by matching today's `times` row inside calendar
    today = d.get('times')
    if not today:
        return None, None
    for m in range(12):
        for day, row in d['calendar'][m].items():
            if row[1:] == today:
                return None, (m + 1, int(day))
    return None, None

if __name__ == '__main__':
    d = load(sys.argv[1])
    print('name', d['name'], 'cc', d['countryCode'], 'tz', d['timezone'], 'lat', d['latitude'], 'lon', d['longitude'])
    print('months', len(d['calendar']), 'days per month', [len(d['calendar'][m]) for m in range(len(d['calendar']))])
    print('today', d['times'], 'shuruq', d['shuruq'])
    print('match', year_of(d))
    print('jumua', d['jumua'], d['jumua2'], 'imsakOffset', d['imsakNbMinBeforeFajr'])
