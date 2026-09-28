"""How much of this app's copy actually needs plural rules?

R1's recommendation (a hand-rolled plural table) carries real risk, and the size
of that risk is proportional to how many strings need pluralising. Measured
rather than assumed.
"""
import json, re

rows = json.load(open('ai/plans/39-localisation/research/string-inventory.json'))

# A string needs plural handling only when a COUNT varies inside it.
COUNT_BEARING = re.compile(r'\b(\d+|\{\{?\w*count\w*\}?\}|mins?|minutes?|hours?|days?|seconds?)\b', re.I)

needs, fixed = [], []
for row in rows:
    (needs if COUNT_BEARING.search(row['text']) else fixed).append(row)

print(f'{len(rows)} literals: {len(needs)} mention a count or unit, {len(fixed)} are fixed labels\n')
print('--- the count-bearing set, which is the whole plural surface ---')
for row in needs:
    print(f"  {row['file']}:{row['line']}  {row['text']!r}")
