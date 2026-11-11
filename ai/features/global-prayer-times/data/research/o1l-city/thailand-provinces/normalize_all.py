"""Normalize every captured CICOT provincial workbook: both year-blocks, coordinates, report."""
import json
import re
import sys

from parse_xlsx import parse

names = json.load(open('captures/th-province-names.json'))
index = json.load(open('captures/skthai-28433-province-index.json'))

COORD = re.compile(r'ละติจูด\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+).*?ลองจิจูด\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)')

coords, summary = {}, []
for entry in index:
    th = entry['province_th']
    slug = names[th].lower().replace(' ', '')
    header, normal, leap = parse(f'captures/th-xlsx-{slug}.xlsx')
    m = COORD.search(header)
    lat = round(int(m.group(1)) + int(m.group(2)) / 60 + int(m.group(3)) / 3600, 6) if m else None
    lon = round(int(m.group(4)) + int(m.group(5)) / 60 + int(m.group(6)) / 3600, 6) if m else None
    district = re.search(r'[\(（]([^)）]+)[\)）]', header)
    coords[names[th]] = {'lat': lat, 'lon': lon,
                         'district_th': district.group(1).strip() if district else None,
                         'header': header.strip()}
    json.dump(normal, open(f'data/th-cicot-{slug}-2569.json', 'w'), indent=0)
    json.dump(leap, open(f'data/th-cicot-{slug}-2569-leap.json', 'w'), indent=0)
    summary.append((names[th], len(normal), len(leap), lat, lon))

json.dump(coords, open('data/th-province-coordinates.json', 'w'), ensure_ascii=False, indent=1)
print(len(summary), 'provinces')
print('rows', sum(s[1] for s in summary), 'normal +', sum(s[2] for s in summary), 'leap')
bad = [s for s in summary if s[1] != 365 or s[2] != 366 or s[3] is None]
print('anomalies', bad)
for s in summary:
    print(f'{s[0]}\t{s[1]}\t{s[2]}\t{s[3]}\t{s[4]}')
