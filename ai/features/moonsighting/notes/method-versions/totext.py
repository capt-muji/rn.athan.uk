#!/usr/bin/env python3
"""Turn every raw capture in raw/ into text and write zero-context diffs between consecutive distinct texts.

Text extraction follows the earlier wb2text.py/html2text.py passes: drop script/style/noscript, take
soup.get_text('\n'), strip lines, drop blank lines (one block per line), then a FORMS section and a LINKS
section. Differences from those passes, all to make diffs honest:
  - bytes are decoded as UTF-8 when valid, else cp1252 (old pages are Latin-1/cp1252, so degree signs survive);
  - the FORMS section lists every <select> with each option's value, label and selected flag, and every
    <input> with name/type/value, so a change in a method menu or its default shows up in a diff;
  - HTML comments (the site hides editing notes there) go to a separate .comments.txt, one comment per block;
  - e-mail addresses, JWT-like tokens, long key-like strings in URLs and phone numbers are redacted.
Cloudflare-style interstitials ("One moment, please...") and empty/error bodies are classified and kept out
of the diff chain.
"""
import os, re, glob, hashlib, subprocess
from bs4 import BeautifulSoup, Comment

MV = os.path.expanduser('~/athan-research/site-reading/method-versions')
RAW, TXT, DIFFS = (os.path.join(MV, d) for d in ('raw', 'text', 'diffs'))
PAGES = ['how-we.html', 'faq_pt.html', 'pray.php']

EMAIL = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
JWT = re.compile(r'eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}')
KEYPARAM = re.compile(r'((?:key|api_key|apikey|token|access_token|client)=)[A-Za-z0-9_\-]{12,}', re.I)
LONGKEY = re.compile(r'\bAIza[0-9A-Za-z_\-]{20,}\b')
PHONE = re.compile(r'(?<![\w.])(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?![\w.])')


def redact(s):
    s = JWT.sub('[REDACTED-JWT]', s)
    s = LONGKEY.sub('[REDACTED-KEY]', s)
    s = KEYPARAM.sub(r'\1[REDACTED-KEY]', s)
    s = EMAIL.sub('[REDACTED-EMAIL]', s)
    s = PHONE.sub('[REDACTED-PHONE]', s)
    return s


def decode(b):
    try:
        return b.decode('utf-8'), 'utf-8'
    except UnicodeDecodeError:
        return b.decode('cp1252', 'replace'), 'cp1252'


def extract(path):
    b = open(path, 'rb').read()
    html, enc = decode(b)
    soup = BeautifulSoup(html, 'html.parser')
    comments = [c.strip() for c in soup.find_all(string=lambda t: isinstance(t, Comment))]
    for t in soup(['script', 'style', 'noscript']):
        t.decompose()
    forms = []
    for f in soup.find_all('form'):
        forms.append(f"FORM action={f.get('action')} method={f.get('method')}")
        for el in f.find_all(['input', 'select', 'textarea']):
            if el.name == 'select':
                forms.append(f"  SELECT name={el.get('name')} id={el.get('id')}")
                for o in el.find_all('option'):
                    forms.append(f"    OPTION value={o.get('value')!r} selected={o.has_attr('selected')} label={o.get_text(' ', strip=True)!r}")
            elif el.name == 'input':
                forms.append(f"  INPUT name={el.get('name')} type={el.get('type')} value={el.get('value')!r} checked={el.has_attr('checked')}")
            else:
                forms.append(f"  TEXTAREA name={el.get('name')}")
    # selects outside forms (pray.php builds some menus without a <form>)
    for el in soup.find_all('select'):
        if el.find_parent('form') is None:
            forms.append(f"SELECT(no form) name={el.get('name')} id={el.get('id')}")
            for o in el.find_all('option'):
                forms.append(f"    OPTION value={o.get('value')!r} selected={o.has_attr('selected')} label={o.get_text(' ', strip=True)!r}")
    links = [f"[{a.get_text(' ', strip=True)[:60]}] -> {a['href']}" for a in soup.find_all('a', href=True)]
    text = '\n'.join(l.strip() for l in soup.get_text('\n').splitlines() if l.strip())
    body = f"{text}\n\n--- FORMS\n" + '\n'.join(forms) + "\n\n--- LINKS\n" + '\n'.join(links) + '\n'
    com = '\n\n'.join(f"<!-- {c} -->" for c in comments) + ('\n' if comments else '')
    return redact(body), redact(com), enc, text


def classify(text, nbytes):
    if nbytes == 0:
        return 'empty'
    if re.search(r'One moment, please', text) or re.search(r'(Just a moment|Checking your browser|Attention Required|cf-browser-verification|challenge-platform)', text):
        return 'interstitial'
    return 'content'


def updated(text):
    m = [l for l in text.splitlines() if re.match(r'\s*(Last\s+)?Updated\b', l, re.I) or re.search(r'\bUpdated\s+(on\s+)?[A-Z][a-z]+\.?\s+\d', l)]
    return ' | '.join(m) if m else '-'


summary = open(os.path.join(MV, 'captures.tsv'), 'w')
summary.write('page\tts\tkind\tencoding\traw_bytes\ttext_lines\ttext_sha1\tcomments_sha1\tupdated_line\n')
for page in PAGES:
    os.makedirs(os.path.join(DIFFS, page), exist_ok=True)
    caps = sorted(p for p in glob.glob(os.path.join(RAW, f'*__{page}')))
    prev = None  # (ts, textpath, compath, sha)
    chain = []
    for p in caps:
        ts = os.path.basename(p).split('__')[0]
        body, com, enc, text = extract(p)
        kind = classify(body, os.path.getsize(p))
        tp = os.path.join(TXT, f'{ts}__{page}.txt'); cp = os.path.join(TXT, f'{ts}__{page}.comments.txt')
        open(tp, 'w').write(body); open(cp, 'w').write(com)
        sha = hashlib.sha1(body.encode()).hexdigest()[:12]; csha = hashlib.sha1(com.encode()).hexdigest()[:12]
        summary.write(f"{page}\t{ts}\t{kind}\t{enc}\t{os.path.getsize(p)}\t{body.count(chr(10))}\t{sha}\t{csha}\t{redact(updated(text))}\n")
        if kind != 'content':
            chain.append(f'{ts}\t{kind}\tnot in diff chain')
            continue
        if prev is None:
            chain.append(f'{ts}\tFIRST\t-')
        else:
            pts, ptp, pcp, psha, pcsha = prev
            if sha == psha and csha == pcsha:
                chain.append(f'{ts}\tTEXT+COMMENTS IDENTICAL to {pts}\t-')
            else:
                out = os.path.join(DIFFS, page, f'{pts}__to__{ts}.diff')
                d1 = subprocess.run(['diff', '-U0', ptp, tp], capture_output=True, text=True).stdout
                d2 = subprocess.run(['diff', '-U0', pcp, cp], capture_output=True, text=True).stdout
                open(out, 'w').write(f"### TEXT DIFF {pts} -> {ts}\n{d1}\n### COMMENTS DIFF {pts} -> {ts}\n{d2}")
                n = len(open(out).read().splitlines())
                chain.append(f"{ts}\tdiff vs {pts}\t{os.path.basename(out)}\t{n} lines\ttext_same={sha == psha}\tcomments_same={csha == pcsha}")
        prev = (ts, tp, cp, sha, csha)
    open(os.path.join(DIFFS, page, 'CHAIN.tsv'), 'w').write('\n'.join(chain) + '\n')
summary.close()
print('ok')
