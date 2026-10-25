"""Both columns at once: English name + second name + time + bell, per locale."""
import json, subprocess
def w(s):
    r=subprocess.run(['swift','ai/plans/39-localisation/scripts/measure-widths.swift'],
                     input=json.dumps(s).encode(),capture_output=True)
    return json.loads(r.stdout.decode())

d=json.load(open('ai/plans/39-localisation/research/prayer-names.json'))
STD=['Fajr','Sunrise','Dhuhr','Asr','Magrib','Isha']
EXT=['Midnight','Last Third','Suhoor','Duha','Istijaba']
PAD_L,PAD_R,BELL,GAP=20,20,20,24
TIME=w(['23:59'])[0]
FIXED=PAD_L+PAD_R+BELL+GAP+TIME

def pick(e): return (e.get('shortText') or e.get('text')) if isinstance(e,dict) else None

# Second column is ALWAYS Arabic (the derived rule).
ar=d['ar']['names']
def col_width(tag, terms):
    vals=[pick(d[tag]['names'].get(t)) for t in terms]
    vals=[v for v in vals if v]
    return max(w(vals)) if vals else 0

ar_std=col_width('ar',STD); ar_ext=col_width('ar',EXT)
print(f'Row overhead: pads {PAD_L+PAD_R} + bell {BELL} + gap {GAP} + time {TIME:.0f} = {FIXED:.0f}pt')
print(f'Arabic column: standard {ar_std:.0f}pt, extras {ar_ext:.0f}pt\n')
print(f"{'loc':5} {'first col':>10} {'+arabic':>8} {'+fixed':>8} {'= total':>8}  {'320dp':>7} {'360dp':>7} {'393dp':>7}")
rows=[]
for tag in ['en','ar','id','ur','bn','tr','fr','de','fa','hi','sw','ms']:
    if tag not in d: continue
    for label,terms,arw in [('std',STD,ar_std),('ext',EXT,ar_ext)]:
        first=col_width(tag,terms)
        second=0 if tag=='ar' else arw
        total=first+second+FIXED
        f=lambda s:'fits' if total<=s else f'+{total-s:.0f}'
        rows.append((tag,label,first,second,total))
        print(f'{tag+" "+label:9} {first:>8.0f}p {second:>7.0f}p {FIXED:>7.0f}p {total:>7.0f}p  {f(320):>7} {f(360):>7} {f(393):>7}')
