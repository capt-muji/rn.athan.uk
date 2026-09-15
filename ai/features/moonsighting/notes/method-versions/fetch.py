#!/usr/bin/env python3
"""Fetch every digest-distinct Wayback capture of how-we.html, faq_pt.html and pray.php.

Dedupe each CDX list by digest, keeping the earliest timestamp per digest. Captures already on disk
(from the earlier passes) are copied byte-for-byte into method-versions/raw/ instead of refetched.
Everything else is fetched from https://web.archive.org/web/<ts>id_/<original>, one at a time,
with a pause between requests and exponential backoff on 429/5xx/network errors.
Raw bodies that arrive gzip- or zstd-compressed are decompressed (gzip module / zstd CLI).
A TSV ledger (ledger.tsv) records: page, ts, digest, url, source(disk|fetched|failed), http status,
compression, byte length, and the later timestamps sharing the digest.
"""
import os, sys, time, gzip, shutil, subprocess, urllib.request, urllib.error

BASE = os.path.expanduser('~/athan-research/site-reading')
OUT = os.path.join(BASE, 'method-versions', 'raw')
os.makedirs(OUT, exist_ok=True)
UA = 'Mozilla/5.0 (research; reading for prayer-time method study)'
PAGES = ['how-we.html', 'faq_pt.html', 'pray.php']
OLD_DIRS = [os.path.join(BASE, 'wayback', 'versions'), os.path.join(BASE, 'wayback')]


def cdx(page):
    rows = []
    for line in open(os.path.join(BASE, 'wayback', f'cdx__moonsighting.com__{page}.txt')):
        p = line.split()
        if len(p) >= 4:
            rows.append((p[0], p[1], p[2], p[3]))
    rows.sort()
    first = {}
    repeats = {}
    for ts, url, dg, ln in rows:
        if dg in first:
            repeats.setdefault(dg, []).append(ts)
        else:
            first[dg] = (ts, url, dg, ln)
    return sorted(first.values()), repeats, len(rows)


def decompress(body):
    if body[:2] == b'\x1f\x8b':
        return gzip.decompress(body), 'gzip'
    if body[:4] == b'\x28\xb5\x2f\xfd':
        r = subprocess.run(['zstd', '-d', '-c'], input=body, capture_output=True, check=True)
        return r.stdout, 'zstd'
    return body, 'none'


def get(url):
    delay = 10
    last = None
    for attempt in range(7):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Encoding': 'identity'}), timeout=90) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            if e.code in (404, 403, 410):
                try:
                    return e.code, e.read()
                except Exception:
                    return e.code, b''
            last = e.code
        except Exception as e:
            last = repr(e)
        print(f'  retry {attempt} after {last}; sleeping {delay}s', flush=True)
        time.sleep(delay)
        delay = min(delay * 2, 300)
    return f'failed:{last}', b''


ledger_path = os.path.join(BASE, 'method-versions', 'ledger.tsv')
done = {}
if os.path.exists(ledger_path):
    for line in open(ledger_path):
        f = line.rstrip('\n').split('\t')
        if f[0] != 'page' and len(f) > 4 and f[4] in ('disk', 'fetched'):
            done[(f[0], f[1])] = line
ledger = open(ledger_path + '.new', 'w')
ledger.write('page\tts\tdigest\turl\tsource\thttp\tcompression\tbytes\tcdx_len\trepeat_ts_same_digest\n')
for page in PAGES:
    caps, repeats, nrows = cdx(page)
    print(f'{page}: {nrows} CDX rows, {len(caps)} digest-distinct', flush=True)
    for ts, url, dg, ln in caps:
        name = f'{ts}__{page}'
        dst = os.path.join(OUT, name)
        rep = ','.join(repeats.get(dg, []))
        if (page, ts) in done and os.path.exists(dst) and os.path.getsize(dst) > 0:
            ledger.write(done[(page, ts)]); continue
        old = next((os.path.join(d, name) for d in OLD_DIRS if os.path.exists(os.path.join(d, name)) and os.path.getsize(os.path.join(d, name)) > 0), None)
        if old:
            body, comp = decompress(open(old, 'rb').read())
            open(dst, 'wb').write(body)
            ledger.write(f'{page}\t{ts}\t{dg}\t{url}\tdisk\t-\t{comp}\t{len(body)}\t{ln}\t{rep}\n'); ledger.flush()
            print('DISK', ts, page, len(body), flush=True)
            continue
        st, body = get(f'https://web.archive.org/web/{ts}id_/{url}')
        comp = '-'
        if body:
            try:
                body, comp = decompress(body)
            except Exception as e:
                comp = f'decompress-error:{e!r}'
        ok = st == 200 and len(body) > 0
        if ok:
            open(dst, 'wb').write(body)
        else:
            open(dst + '.error', 'wb').write(body)
        ledger.write(f'{page}\t{ts}\t{dg}\t{url}\t{"fetched" if ok else "failed"}\t{st}\t{comp}\t{len(body)}\t{ln}\t{rep}\n'); ledger.flush()
        print('GET', st, comp, len(body), ts, page, flush=True)
        time.sleep(1.5)
ledger.close()
os.replace(ledger_path + '.new', ledger_path)
print('DONE', flush=True)
