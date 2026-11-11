"""Build the portal's 1,241-row German district list, then draw the sample."""
import json, glob, os, csv

SRC = os.path.expanduser('~/athan-gitree/census/o1l-city/germany-cities/captures')
OUT = os.path.dirname(os.path.abspath(__file__))

states = {}
for s in json.load(open(f'{SRC}/de-states.json'))['StateList']:
    states[s['SehirID']] = s['SehirAdi']

rows = []
for f in sorted(glob.glob(f'{SRC}/de-districts-*.json')):
    sid = os.path.basename(f).split('-')[-1].split('.')[0]
    for r in json.load(open(f))['StateRegionList']:
        rows.append({'state_id': sid, 'state': states[sid],
                     'id': r['IlceID'], 'name': r['IlceAdi'],
                     'url': r['IlceUrl']})

with open(f'{OUT}/data/districts-all.tsv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=['state_id', 'state', 'id', 'name', 'url'], delimiter='\t')
    w.writeheader()
    w.writerows(rows)
print('all districts', len(rows), 'states', len(states))

by_state = {}
for r in rows:
    by_state.setdefault(r['state_id'], []).append(r)
