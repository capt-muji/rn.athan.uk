"""Capture every remaining portal district page, six at a time."""
import csv, os, subprocess, concurrent.futures as cf

OUT = os.path.dirname(os.path.abspath(__file__))
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
BASE = 'https://namazvakitleri.diyanet.gov.tr'

rows = list(csv.DictReader(open(f'{OUT}/data/districts-all.tsv'), delimiter='\t'))
todo = [r for r in rows if not os.path.exists(f'{OUT}/captures/district-{r["id"]}.html')]
print('to fetch', len(todo), 'of', len(rows), flush=True)


def one(r):
    dest = f'{OUT}/captures/district-{r["id"]}.html'
    p = subprocess.run(['curl', '-s', '-A', UA, '-o', dest, '-w', '%{http_code}',
                        BASE + r['url']], capture_output=True, text=True)
    code = p.stdout.strip()
    if code != '200':
        if os.path.exists(dest):
            os.remove(dest)
        return f'FAIL {r["id"]} {code} {r["name"]}'
    return None


fails = 0
with cf.ThreadPoolExecutor(max_workers=6) as ex:
    for i, res in enumerate(ex.map(one, todo), 1):
        if res:
            fails += 1
            print(res, flush=True)
        if i % 100 == 0:
            print('done', i, flush=True)
print('fails', fails)
