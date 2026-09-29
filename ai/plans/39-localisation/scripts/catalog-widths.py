"""Every sourced name measured against the 123pt column budget.

R6 sourced the catalog; this asks whether it fits the layout. A name over budget
needs a terse form (shortText) before that locale can ship.
"""
import json, subprocess

BUDGET = 123.0
data = json.load(open('ai/plans/39-localisation/research/prayer-names.json'))
STANDARD = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha']
EXTRAS = ['Midnight', 'Last Third', 'Suhoor', 'Duha', 'Istijaba']

def widths(strings):
    if not strings:
        return []
    result = subprocess.run(['swift', 'ai/plans/39-localisation/scripts/measure-widths.swift'],
                            input=json.dumps(strings).encode(), capture_output=True)
    return json.loads(result.stdout.decode())

def pick(entry):
    """The terse form if the catalog carries one, else the full form."""
    if not isinstance(entry, dict):
        return None
    return entry.get('shortText') or entry.get('text')

rows = []
for tag, block in sorted(data.items()):
    if tag.startswith('_'):
        continue
    names = block.get('names', {})
    std = [pick(names.get(n)) for n in STANDARD]
    ext = [pick(names.get(n)) for n in EXTRAS]
    std = [s for s in std if s]
    ext = [s for s in ext if s]
    ws, we = widths(std), widths(ext)
    rows.append({
        'tag': tag,
        'std': max(ws) if ws else 0, 'std_name': std[ws.index(max(ws))] if ws else '',
        'ext': max(we) if we else 0, 'ext_name': ext[we.index(max(we))] if we else '',
        'missing': 11 - len(std) - len(ext),
    })

print(f'{len(rows)} locales measured against a {BUDGET:.0f}pt budget\n')
print(f"{'loc':9} {'standard':>9} {'extras':>9}  {'worst name':<28} {'gap':>7}  missing")
over = []
for r in sorted(rows, key=lambda r: -max(r['std'], r['ext'])):
    worst = max(r['std'], r['ext'])
    name = r['ext_name'] if r['ext'] >= r['std'] else r['std_name']
    flag = f"+{worst - BUDGET:.0f}" if worst > BUDGET else 'fits'
    if worst > BUDGET:
        over.append(r['tag'])
    print(f"{r['tag']:9} {r['std']:>8.1f}p {r['ext']:>8.1f}p  {name:<28} {flag:>7}  {r['missing']}")

print(f'\n{len(over)} of {len(rows)} locales exceed the budget: {over}')
