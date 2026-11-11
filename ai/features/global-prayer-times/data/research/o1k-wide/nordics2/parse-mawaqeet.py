import json,re,sys,pypdf

MONTHS={'januar':1,'februar':2,'mars':3,'april':4,'mai':5,'juni':6,'juli':7,'august':8,
        'september':9,'oktober':10,'november':11,'desember':12}
TIME=re.compile(r'^\d{1,2}:\d{2}$')

def parse(path):
    r=pypdf.PdfReader(path); out={}
    for page in r.pages:
        lines=[l.strip() for l in page.extract_text().split('\n') if l.strip()]
        head=lines[0]
        m=re.search(r'-\s*([A-Za-zæøå]+)\s+(\d{4})',head)
        month,year=MONTHS[m.group(1).lower()],int(m.group(2))
        i=lines.index('Isha')
        cells=lines[i+1:]
        k=0
        while k<len(cells):
            if not cells[k].isdigit():
                k+=1; continue
            day=int(cells[k]); vals=cells[k+2:k+9]
            if len(vals)==7 and all(TIME.match(v) or v=='--:--' for v in vals):
                out[f'{year}-{month:02d}-{day:02d}']=dict(zip(
                    ('fajr','sunrise','dhuhr','asr','asr_hanafi','magrib','isha'),
                    [None if v=='--:--' else v for v in vals]))
                k+=9
            else:
                k+=1
    return out

for city in sys.argv[1:]:
    rows=parse(f'captures/no-mawaqeet-{city}-year.pdf')
    json.dump(rows,open(f'data/no-mawaqeet-{city}-2026.json','w'),indent=0,sort_keys=True)
    print(city,len(rows),'2026-01-01',rows.get('2026-01-01'),'| 2026-06-21',rows.get('2026-06-21'))
