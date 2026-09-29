"""Mihrab's shipped names against this app's budget, and against our own Arabic."""
import subprocess, json

BUDGET = 123.0
LASTTHIRD = {
 'en':'Last Third of the Night','ar':'الثلث الأخير من الليل','tr':'Gecenin son üçte biri',
 'id':'Sepertiga malam terakhir','ur':'رات کا آخری تہائی حصہ','bn':'রাতের শেষ তৃতীয়াংশ',
 'de':'Letztes Drittel der Nacht','fr':'Dernier tiers de la nuit',
}
MIDNIGHT = {
 'en':'Islamic Midnight','ar':'منتصف الليل','tr':'İslami gece yarısı','id':'Tengah malam',
 'ur':'نصف شب','bn':'ইসলামিক মধ্যরাত','de':'Islamische Mitternacht','fr':'Minuit islamique',
}
def w(s):
    r = subprocess.run(['swift','ai/plans/39-localisation/scripts/measure-widths.swift'],
                       input=json.dumps(s).encode(), capture_output=True)
    return json.loads(r.stdout.decode())

print(f'Mihrab extras names. Budget {BUDGET:.0f}pt. These are the hardest two terms.\n')
print(f"{'loc':5} {'Last Third':<30} {'pt':>7}   {'Midnight':<24} {'pt':>7}")
over = 0
for tag in LASTTHIRD:
    lw, mw = w([LASTTHIRD[tag]])[0], w([MIDNIGHT[tag]])[0]
    lf = 'OVER' if lw > BUDGET else ''
    mf = 'OVER' if mw > BUDGET else ''
    over += (lw > BUDGET) + (mw > BUDGET)
    print(f'{tag:5} {LASTTHIRD[tag]:<30} {lw:>6.1f} {lf:4} {MIDNIGHT[tag]:<24} {mw:>6.1f} {mf}')
print(f'\n{over} of {2*len(LASTTHIRD)} over budget.')
print('\nOur EXTRAS_ARABIC vs Mihrab ar:')
print("  ours:   'نصف الليل' (Midnight), 'آخر ثلث' (Last Third)")
print("  mihrab: 'منتصف الليل',            'الثلث الأخير من الليل'")
for label, ours, theirs in [('Midnight','نصف الليل','منتصف الليل'), ('Last Third','آخر ثلث','الثلث الأخير من الليل')]:
    a, b = w([ours])[0], w([theirs])[0]
    print(f'  {label:11} ours {a:5.1f}pt   mihrab {b:6.1f}pt   ours is {b-a:+.0f}pt narrower')
