import json, os, re, html, urllib.request, concurrent.futures as cf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAP = os.path.join(ROOT, 'captures')
DATA = os.path.join(ROOT, 'data')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
tenants = json.load(open(os.path.join(DATA, 'tenants.json')))

def head_config(tid):
    req = urllib.request.Request(f'https://tv.masjidi.app/{tid}', headers={'User-Agent': UA, 'Range': 'bytes=0-70000'})
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            body = r.read().decode('utf-8', 'replace')
    except Exception as e:
        return {'id': tid, 'error': str(e)[:80]}
    m = re.search(r'<masjidi-data data="(.*?)"></masjidi-data>', body, re.S)
    if not m:
        return {'id': tid, 'error': 'no config'}
    c = json.loads(html.unescape(m.group(1)))['configuration']
    t = c.get('timings', {})
    u = t.get('url', '')
    mm = re.search(r'region_json_(\d+)\.json', u)
    td = c.get('templateData', {})
    return {'id': tid, 'tableId': int(mm.group(1)) if mm else None, 'type': t.get('type'),
            'timezone': c.get('timezone'), 'city': td.get('masjidCity'), 'name': td.get('masjidName')}

out = []
with cf.ThreadPoolExecutor(max_workers=6) as ex:
    for r in ex.map(head_config, [o['id'] for o in tenants]):
        out.append(r)
json.dump(out, open(os.path.join(DATA, 'platform_tables.json'), 'w'), ensure_ascii=False, indent=1)
by = {}
for o in out:
    by.setdefault(o.get('tableId'), []).append(o)
print('tenants', len(out), 'errors', sum(1 for o in out if o.get('error')))
print('aladhan', sum(1 for o in out if o.get('type') == 'aladhan-api'))
print('distinct tables', len([k for k in by if k]))
for k in sorted([k for k in by if k], key=lambda x: -len(by[x])):
    print(k, len(by[k]), by[k][0].get('city'), by[k][0].get('name'))
