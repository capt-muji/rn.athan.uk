import json, os, re, unicodedata
os.chdir(os.path.dirname(os.path.abspath(__file__)))

def norm(s):
    s = s.replace('đ', 'd').replace('Đ', 'D')
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()

eu = json.load(open('captures/eu_vaktija_locations_v4.json'))['data']
by_name = {}
for x in eu:
    by_name.setdefault(norm(x['name']), []).append(x)

# ids >= 107 are the Montenegro/Sandžak block appended after the 107 BiH entries
COUNTRY = {107: 'ME', 108: 'ME', 109: 'RS', 110: 'RS', 111: 'ME', 112: 'ME',
           113: 'RS', 114: 'RS', 115: 'ME', 116: 'RS', 117: 'RS'}

index = json.load(open('data/ba_cities_index.json'))
coords = {}
for idx, meta in index.items():
    i = int(idx)
    name = meta['place']
    want = COUNTRY.get(i, 'BA')
    hits = [x for x in by_name.get(norm(name), []) if x['country']['code'] == want]
    if not hits:
        hits = by_name.get(norm(name), [])
    if hits:
        x = hits[0]
        coords[i] = {'lat': x['latitude'], 'lon': x['longitude'],
                     'source': 'api.vaktija.eu/v4/locations id=%s slug=%s country=%s' % (x['id'], x['slug'], x['country']['code'])}
        if x['country']['code'] != want:
            print('COUNTRY MISMATCH', name, want, x['country']['code'])
        continue
    print('MISSING', i, name)
json.dump(coords, open('data/ba_coords.json', 'w'), ensure_ascii=False, indent=1)
print('coords', len(coords))
