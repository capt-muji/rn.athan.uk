"""Pull the IGMG gazetteer point for every portal district, six at a time."""
import csv, json, os, subprocess, unicodedata, concurrent.futures as cf

OUT = os.path.dirname(os.path.abspath(__file__))
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
BASE = 'https://www.igmg.org/wp-json/igmg-gebetszeiten/v1'


def norm(s):
    a = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return ''.join(c for c in a.replace('ß', 'ss').lower() if c.isalnum())


gaz = json.load(open(f'{OUT}/captures/probe-igmg-cities.json'))
by_name = {}
for g in gaz:
    by_name.setdefault(norm(g['name']), []).append(g)

rows = list(csv.DictReader(open(f'{OUT}/data/districts-all.tsv'), delimiter='\t'))
matched = [(r, by_name[norm(r['name'])]) for r in rows if norm(r['name']) in by_name]
print('name-matched', len(matched), 'of', len(rows))

out = f'{OUT}/data/igmg-sun.json'
sun = json.load(open(out)) if os.path.exists(out) else {}


def one(g):
    k = str(g['id'])
    if k in sun:
        return None
    p = subprocess.run(['curl', '-s', '-A', UA, f'{BASE}/times?city={k}&lang=de'],
                       capture_output=True, text=True)
    try:
        d = json.loads(p.stdout)
        return k, {'name': g['name'], 'sun': d.get('sun')}
    except Exception:
        return k, {'name': g['name'], 'sun': None}


todo = [g for _, gs in matched for g in gs if str(g['id']) not in sun]
print('sun to fetch', len(todo), flush=True)
with cf.ThreadPoolExecutor(max_workers=6) as ex:
    for i, res in enumerate(ex.map(one, todo), 1):
        if res:
            sun[res[0]] = res[1]
        if i % 200 == 0:
            print('done', i, flush=True)
json.dump(sun, open(out, 'w'), indent=1)
print('sun banked', len(sun), 'with point', sum(1 for v in sun.values() if v['sun']))
