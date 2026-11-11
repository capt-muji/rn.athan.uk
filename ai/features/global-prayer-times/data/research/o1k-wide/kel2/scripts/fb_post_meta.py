#!/usr/bin/env python3
"""Fetch each enumerated public post's og metadata (title + crawler image URL)."""
import re, sys, subprocess, html, json, pathlib

OUT = pathlib.Path.home() / 'athan-gitree/census/o1k-wide/kel2/captures'
UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
PAGE = 'MUFTIKELANTAN'

ids = [l.strip() for l in sys.stdin if l.strip()]
rows = []
for pid in ids:
    url = f'https://www.facebook.com/{PAGE}/posts/{pid}/'
    path = OUT / f'fb-post-{pid}.html'
    if not path.exists() or path.stat().st_size < 10000:
        subprocess.run(['curl', '-sSL', '-A', UA, '--max-time', '60', '-o', str(path), url], check=False)
    try:
        s = path.read_text(encoding='utf-8', errors='ignore')
    except FileNotFoundError:
        rows.append({'post_id': pid, 'error': 'no file'})
        continue
    def meta(prop):
        m = re.search(rf'property="{prop}" content="((?:[^"\\]|\\.)*)"', s)
        return html.unescape(m.group(1)) if m else None
    rows.append({
        'post_id': pid,
        'title': meta('og:description'),
        'image': meta('og:image'),
        'url': url,
        'bytes': len(s),
        'login_wall': 'You must log in to continue' in s,
    })
    print(pid, '|', (rows[-1]['title'] or '')[:90], '|', (rows[-1]['image'] or '')[:80])

(OUT.parent / 'fb-posts-index.json').write_text(json.dumps(rows, indent=1, ensure_ascii=False))
